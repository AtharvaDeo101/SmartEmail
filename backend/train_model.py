import os
import json
import math
import torch
import numpy as np
from torch.optim import AdamW
from torch.utils.data import Dataset, DataLoader
from transformers import (
    GPT2LMHeadModel,
    GPT2TokenizerFast,
    get_cosine_schedule_with_warmup,
)
from torch.cuda.amp import autocast, GradScaler
from pathlib import Path
import warnings
warnings.filterwarnings("ignore")

# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────
CONFIG = {
    "model_name": "gpt2",
    "output_dir": "./saved_email_model",
    "data_file": "emails.txt",          # ← Path to your .txt email dataset
    "email_separator": "---",           # ← Separator between emails in the file
    "max_length": 256,
    "batch_size": 4,
    "gradient_accumulation_steps": 4,
    "epochs": 5,
    "lr": 5e-5,
    "warmup_ratio": 0.1,
    "weight_decay": 0.01,
    "fp16": torch.cuda.is_available(),
    "seed": 42,
    "save_every_n_epochs": 1,
    "logging_steps": 10,
    "min_email_length": 20,             # ← Skip emails shorter than this (chars)
}


# ─────────────────────────────────────────────
# LOAD EMAILS FROM TXT FILE
# ─────────────────────────────────────────────
def load_emails_from_file(filepath: str, separator: str = "---", min_length: int = 20):
    """
    Load emails from a .txt file.

    File format — each email separated by the separator on its own line:

        Subject: Hello Team
        Dear All,
        This is email one.
        Best, Alex
        ---
        Subject: Invoice Due
        Hi Client,
        Your invoice is attached.
        Regards, Finance
        ---

    Args:
        filepath:   Path to the .txt file
        separator:  String that separates individual emails (default: ---)
        min_length: Minimum character length to keep an email (filters junk)

    Returns:
        List of email strings
    """
    path = Path(filepath)
    if not path.exists():
        raise FileNotFoundError(
            f"\n[ERROR] Dataset file not found: '{filepath}'\n"
            f"  → Create a file named '{filepath}' in the same folder as this script.\n"
            f"  → Each email should be separated by '{separator}' on its own line.\n"
            f"  → See emails_sample.txt for the expected format.\n"
        )

    raw = path.read_text(encoding="utf-8")
    emails = [e.strip() for e in raw.split(separator) if e.strip()]

    # Filter out too-short entries (empty blocks, stray separators, etc.)
    emails = [e for e in emails if len(e) >= min_length]

    if len(emails) == 0:
        raise ValueError(
            f"\n[ERROR] No valid emails found in '{filepath}'.\n"
            f"  → Make sure emails are separated by '{separator}' on its own line.\n"
            f"  → Each email must be at least {min_length} characters long.\n"
        )

    print(f"[INFO] Loaded {len(emails)} emails from '{filepath}'")
    print(f"[INFO] Avg email length: {int(sum(len(e) for e in emails)/len(emails))} chars")
    print(f"[INFO] Sample (first email preview):\n{'-'*40}\n{emails[0][:300]}...\n{'-'*40}\n")

    return emails


# ─────────────────────────────────────────────
# DATASET CLASS
# ─────────────────────────────────────────────
class EmailDataset(Dataset):
    def __init__(self, texts, tokenizer, max_length):
        self.examples = []
        bos = tokenizer.bos_token or "<|endoftext|>"
        eos = tokenizer.eos_token or "<|endoftext|>"

        for text in texts:
            formatted = f"{bos}{text.strip()}{eos}"
            encoded = tokenizer(
                formatted,
                max_length=max_length,
                truncation=True,
                padding="max_length",
                return_tensors="pt",
            )
            self.examples.append({
                "input_ids": encoded["input_ids"].squeeze(),
                "attention_mask": encoded["attention_mask"].squeeze(),
            })

    def __len__(self):
        return len(self.examples)

    def __getitem__(self, idx):
        item = self.examples[idx]
        return {
            "input_ids": item["input_ids"],
            "attention_mask": item["attention_mask"],
            "labels": item["input_ids"].clone(),
        }


# ─────────────────────────────────────────────
# LOAD MODEL & TOKENIZER
# ─────────────────────────────────────────────
def load_model_and_tokenizer(model_name):
    print(f"[INFO] Loading tokenizer and model: {model_name}")
    tokenizer = GPT2TokenizerFast.from_pretrained(model_name)
    tokenizer.pad_token = tokenizer.eos_token

    model = GPT2LMHeadModel.from_pretrained(model_name)
    model.resize_token_embeddings(len(tokenizer))
    model.config.pad_token_id = tokenizer.pad_token_id

    total_params = sum(p.numel() for p in model.parameters()) / 1e6
    print(f"[INFO] Model parameters: {total_params:.1f}M")
    return model, tokenizer


# ─────────────────────────────────────────────
# TRAINING FUNCTION
# ─────────────────────────────────────────────
def train(config, emails):
    torch.manual_seed(config["seed"])
    np.random.seed(config["seed"])

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[INFO] Device: {device}")

    model, tokenizer = load_model_and_tokenizer(config["model_name"])
    model = model.to(device)

    dataset = EmailDataset(emails, tokenizer, config["max_length"])
    dataloader = DataLoader(dataset, batch_size=config["batch_size"], shuffle=True)

    total_steps = (len(dataloader) // config["gradient_accumulation_steps"]) * config["epochs"]
    warmup_steps = int(total_steps * config["warmup_ratio"])

    optimizer = AdamW(
        model.parameters(),
        lr=config["lr"],
        weight_decay=config["weight_decay"],
    )
    scheduler = get_cosine_schedule_with_warmup(optimizer, warmup_steps, total_steps)
    scaler = GradScaler(enabled=config["fp16"])

    output_dir = Path(config["output_dir"])
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n[INFO] Starting training — {config['epochs']} epochs | {len(emails)} emails | {total_steps} total steps\n")

    global_step = 0
    for epoch in range(1, config["epochs"] + 1):
        model.train()
        epoch_loss = 0.0
        optimizer.zero_grad()

        for step, batch in enumerate(dataloader, 1):
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["labels"].to(device)

            with autocast(enabled=config["fp16"]):
                outputs = model(
                    input_ids=input_ids,
                    attention_mask=attention_mask,
                    labels=labels,
                )
                loss = outputs.loss / config["gradient_accumulation_steps"]

            scaler.scale(loss).backward()
            epoch_loss += loss.item() * config["gradient_accumulation_steps"]

            if step % config["gradient_accumulation_steps"] == 0:
                scaler.unscale_(optimizer)
                torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                scaler.step(optimizer)
                scaler.update()
                scheduler.step()
                optimizer.zero_grad()
                global_step += 1

                if global_step % config["logging_steps"] == 0:
                    avg_loss = epoch_loss / step
                    ppl = math.exp(min(avg_loss, 20))
                    print(f"  Epoch {epoch} | Step {global_step} | Loss: {avg_loss:.4f} | PPL: {ppl:.2f}")

        avg_epoch_loss = epoch_loss / len(dataloader)
        ppl = math.exp(min(avg_epoch_loss, 20))
        print(f"\n✅ Epoch {epoch}/{config['epochs']} — Avg Loss: {avg_epoch_loss:.4f} | Perplexity: {ppl:.2f}\n")

        if epoch % config["save_every_n_epochs"] == 0:
            ckpt_path = output_dir / f"checkpoint-epoch-{epoch}"
            model.save_pretrained(ckpt_path)
            tokenizer.save_pretrained(ckpt_path)
            print(f"[SAVED] Checkpoint → {ckpt_path}\n")

    # Save final model + config
    model.save_pretrained(output_dir)
    tokenizer.save_pretrained(output_dir)
    with open(output_dir / "training_config.json", "w") as f:
        json.dump(
            {k: str(v) if not isinstance(v, (int, float, bool, str)) else v for k, v in config.items()},
            f, indent=2
        )

    print(f"[DONE] Final model saved → {output_dir}")
    return model, tokenizer


# ─────────────────────────────────────────────
# EMAIL GENERATION
# ─────────────────────────────────────────────
def generate_email(
    model,
    tokenizer,
    prompt: str,
    max_new_tokens: int = 200,
    temperature: float = 0.85,
    top_k: int = 50,
    top_p: float = 0.92,
    repetition_penalty: float = 1.2,
    num_return_sequences: int = 1,
):
    device = next(model.parameters()).device
    model.eval()

    bos = tokenizer.bos_token or "<|endoftext|>"
    full_prompt = f"{bos}{prompt}"
    inputs = tokenizer(full_prompt, return_tensors="pt").to(device)

    with torch.no_grad():
        output_ids = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            temperature=temperature,
            top_k=top_k,
            top_p=top_p,
            repetition_penalty=repetition_penalty,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id,
            num_return_sequences=num_return_sequences,
        )

    generated = []
    for ids in output_ids:
        text = tokenizer.decode(ids, skip_special_tokens=True)
        if text.startswith(prompt):
            text = text[len(prompt):].strip()
        generated.append(text)

    return generated


# ─────────────────────────────────────────────
# LOAD SAVED MODEL
# ─────────────────────────────────────────────
def load_saved_model(model_dir: str):
    print(f"[INFO] Loading saved model from: {model_dir}")
    tokenizer = GPT2TokenizerFast.from_pretrained(model_dir)
    tokenizer.pad_token = tokenizer.eos_token
    model = GPT2LMHeadModel.from_pretrained(model_dir)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = model.to(device)
    print("[INFO] Model loaded successfully.")
    return model, tokenizer


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────
if __name__ == "__main__":
    # ── STEP 1: LOAD EMAILS FROM FILE ──────────
    emails = load_emails_from_file(
        filepath=CONFIG["data_file"],
        separator=CONFIG["email_separator"],
        min_length=CONFIG["min_email_length"],
    )

    # ── STEP 2: TRAIN ──────────────────────────
    model, tokenizer = train(CONFIG, emails)

    # ── STEP 3: GENERATE ───────────────────────
    test_prompts = [
        "Subject: Quarterly Review Meeting\nDear Team,",
        "Subject: Job Offer - Software Engineer\nDear Applicant,",
        "Subject: Payment Reminder\nHi,",
    ]

    print("\n" + "═"*60)
    print("         EMAIL GENERATION DEMO")
    print("═"*60)

    for prompt in test_prompts:
        print(f"\n📧 PROMPT:\n{prompt}")
        results = generate_email(model, tokenizer, prompt, max_new_tokens=150)
        print(f"\n✉️  GENERATED:\n{results[0]}")
        print("─"*60)