import os
import base64
import secrets
import hashlib
from email.mime.text import MIMEText

from huggingface_hub import InferenceClient
from flask import Flask, redirect, session, request, jsonify
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from dotenv import load_dotenv
from flask_session import Session
from flask_cors import CORS

load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY") or os.urandom(24)

app.config.update(
    SESSION_TYPE="filesystem",
    SESSION_FILE_DIR="./flask_session",
    SESSION_PERMANENT=False,
    SESSION_USE_SIGNER=True,
    SESSION_COOKIE_NAME="session",
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SECURE=False,  # Set True in production with HTTPS
    SESSION_COOKIE_SAMESITE="Lax",
    PERMANENT_SESSION_LIFETIME=1800,
)

Session(app)

CORS(
    app,
    resources={r"/*": {"origins": "http://localhost:3000", "supports_credentials": True}},
)

GOOGLE_CLIENT_ID     = os.environ.get("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET")
SCOPES = [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.modify",
]
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000/")
REDIRECT_URI = os.environ.get("REDIRECT_URI", "http://localhost:5000/oauth2callback")

# ── Hugging Face Inference Client (new chat_completion API) ────────────────────
HF_API_TOKEN = os.environ.get("HF_API_TOKEN")

# Mistral-7B is free, fast, and excellent for email tasks
HF_MODEL = "meta-llama/Llama-3.1-8B-Instruct"

hf_client = InferenceClient(token=HF_API_TOKEN)


def generate_with_api(prompt: str) -> str:
    """
    Generate a professional email using Mistral-7B via HF chat completion API.
    Returns the full generated email text.
    """
    messages = [
        {
            "role": "system",
            "content": (
                "You are a professional email writing assistant. "
                "When given a topic or instruction, write a complete professional email. "
                "Always format your response exactly as:\n"
                "Subject: <subject line>\n\n"
                "<email body starting with Dear...>"
                "\n\nDo not include any explanation outside the email itself."
            ),
        },
        {
            "role": "user",
            "content": f"Write a professional email about: {prompt}",
        },
    ]

    response = hf_client.chat_completion(
        model=HF_MODEL,
        messages=messages,
        max_tokens=400,
        temperature=0.7,
    )
    return response.choices[0].message.content.strip()


def summarize_with_api(content: str, summary_type: str = "brief") -> str:
    """
    Summarize an email using Mistral-7B via HF chat completion API.
    Returns a structured plain-text summary.
    """
    if summary_type == "brief":
        instruction = (
            "Give a brief 2-3 sentence summary of this email. "
            "Include the main point, any action items, and the tone."
        )
    else:
        instruction = (
            "Summarize this email in detail. Include:\n"
            "- Key Points (bullet list)\n"
            "- Action Items (bullet list)\n"
            "- Sentiment (one phrase describing the tone)"
        )

    messages = [
        {
            "role": "system",
            "content": "You are an expert email summarizer. Be concise and accurate.",
        },
        {
            "role": "user",
            "content": f"{instruction}\n\nEmail:\n{content}",
        },
    ]

    response = hf_client.chat_completion(
        model=HF_MODEL,
        messages=messages,
        max_tokens=300,
        temperature=0.3,
    )
    return response.choices[0].message.content.strip()


# ── Gmail helper ───────────────────────────────────────────────────────────────

def get_gmail_service():
    if "credentials" not in session:
        return None
    creds = Credentials(**session["credentials"])
    return build("gmail", "v1", credentials=creds)


# ── Auth routes ────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    if "credentials" in session:
        return jsonify({"status": "logged_in"})
    return jsonify({"status": "not_logged_in"})


@app.route("/login")
def login():
    code_verifier = secrets.token_urlsafe(32)
    session["code_verifier"] = code_verifier

    code_challenge = (
        base64.urlsafe_b64encode(hashlib.sha256(code_verifier.encode()).digest())
        .decode()
        .rstrip("=")
    )

    flow = Flow.from_client_config(
        client_config={
            "web": {
                "client_id":     GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "auth_uri":      "https://accounts.google.com/o/oauth2/auth",
                "token_uri":     "https://oauth2.googleapis.com/token",
                "redirect_uris": [REDIRECT_URI],
            }
        },
        scopes=SCOPES,
    )
    flow.redirect_uri = REDIRECT_URI

    authorization_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
        code_challenge=code_challenge,
        code_challenge_method="S256",
    )
    session["state"] = state
    return redirect(authorization_url)


@app.route("/oauth2callback")
def oauth2callback():
    if "state" not in session or session["state"] != request.args.get("state"):
        return "Invalid state parameter", 400
    if "code_verifier" not in session:
        return "Code verifier not found in session", 400

    code_verifier = session.pop("code_verifier")

    flow = Flow.from_client_config(
        client_config={
            "web": {
                "client_id":     GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "auth_uri":      "https://accounts.google.com/o/oauth2/auth",
                "token_uri":     "https://oauth2.googleapis.com/token",
                "redirect_uris": [REDIRECT_URI],
            }
        },
        scopes=SCOPES,
        state=session["state"],
    )
    flow.redirect_uri = REDIRECT_URI

    flow.fetch_token(
        authorization_response=request.url,
        code_verifier=code_verifier,
    )

    creds = flow.credentials
    session["credentials"] = {
        "token":         creds.token,
        "refresh_token": creds.refresh_token,
        "token_uri":     creds.token_uri,
        "client_id":     creds.client_id,
        "client_secret": creds.client_secret,
        "scopes":        creds.scopes,
    }
    return redirect(FRONTEND_URL)


@app.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"status": "logged_out"})


@app.route("/me")
def me():
    service = get_gmail_service()
    if service is None:
        return jsonify({"error": "not_authenticated"}), 401
    profile = service.users().getProfile(userId="me").execute()
    return jsonify(profile)


# ── Email CRUD routes ──────────────────────────────────────────────────────────

@app.route("/send_email", methods=["POST"])
def send_email():
    service = get_gmail_service()
    if service is None:
        return jsonify({"error": "not_authenticated"}), 401

    data    = request.get_json() or {}
    to      = data.get("to")
    subject = data.get("subject")
    body    = data.get("body")

    if not all([to, subject, body]):
        return jsonify({"error": "to, subject, body are required"}), 400

    message            = MIMEText(body)
    message["to"]      = to
    message["subject"] = subject

    raw  = base64.urlsafe_b64encode(message.as_bytes()).decode()
    sent = service.users().messages().send(userId="me", body={"raw": raw}).execute()
    return jsonify({"message": "sent", "id": sent.get("id")})


@app.route("/list_emails", methods=["GET"])
def list_emails():
    service = get_gmail_service()
    if service is None:
        return jsonify({"error": "not_authenticated"}), 401

    max_results = request.args.get("max_results", 10, type=int)
    query       = request.args.get("q", "")

    result   = service.users().messages().list(userId="me", maxResults=max_results, q=query).execute()
    messages = result.get("messages", [])

    email_list = []
    for m in messages:
        msg = service.users().messages().get(
            userId="me", id=m["id"], format="metadata",
            metadataHeaders=["Subject", "From", "Date"],
        ).execute()
        headers = msg.get("payload", {}).get("headers", [])
        email_list.append({
            "id":      m["id"],
            "subject": next((h["value"] for h in headers if h["name"] == "Subject"), ""),
            "from":    next((h["value"] for h in headers if h["name"] == "From"), ""),
            "date":    next((h["value"] for h in headers if h["name"] == "Date"), ""),
        })

    return jsonify({"emails": email_list})


def extract_email_body(payload):
    body = ""
    if "parts" in payload:
        for part in payload["parts"]:
            if part.get("mimeType") == "text/plain":
                data = part.get("body", {}).get("data")
                if data:
                    body = base64.urlsafe_b64decode(data).decode("utf-8", errors="ignore")
                    break
            elif part.get("mimeType") == "text/html" and not body:
                data = part.get("body", {}).get("data")
                if data:
                    body = base64.urlsafe_b64decode(data).decode("utf-8", errors="ignore")
    else:
        data = payload.get("body", {}).get("data")
        if data:
            body = base64.urlsafe_b64decode(data).decode("utf-8", errors="ignore")
    return body


@app.route("/get_email/<email_id>", methods=["GET"])
def get_email(email_id):
    service = get_gmail_service()
    if service is None:
        return jsonify({"error": "not_authenticated"}), 401

    msg     = service.users().messages().get(userId="me", id=email_id, format="full").execute()
    payload = msg.get("payload", {})
    headers = payload.get("headers", [])

    return jsonify({
        "id":      email_id,
        "subject": next((h["value"] for h in headers if h["name"] == "Subject"), ""),
        "from":    next((h["value"] for h in headers if h["name"] == "From"), ""),
        "date":    next((h["value"] for h in headers if h["name"] == "Date"), ""),
        "body":    extract_email_body(payload),
    })


@app.route("/create_draft", methods=["POST"])
def create_draft():
    service = get_gmail_service()
    if service is None:
        return jsonify({"error": "not_authenticated"}), 401

    data    = request.get_json() or {}
    to      = data.get("to")
    subject = data.get("subject")
    body    = data.get("body")

    if not all([to, subject, body]):
        return jsonify({"error": "to, subject, body are required"}), 400

    message            = MIMEText(body)
    message["to"]      = to
    message["subject"] = subject

    raw   = base64.urlsafe_b64encode(message.as_bytes()).decode()
    draft = service.users().drafts().create(
        userId="me", body={"message": {"raw": raw}}
    ).execute()
    return jsonify({"message": "draft_created", "id": draft.get("id")})


@app.route("/list_labels", methods=["GET"])
def list_labels():
    service = get_gmail_service()
    if service is None:
        return jsonify({"error": "not_authenticated"}), 401

    result = service.users().labels().list(userId="me").execute()
    return jsonify({"labels": result.get("labels", [])})


# ── AI routes ──────────────────────────────────────────────────────────────────

@app.route("/generate_email", methods=["POST"])
def generate_email():
    if "credentials" not in session:
        return jsonify({"error": "not_authenticated"}), 401

    data   = request.get_json() or {}
    prompt = data.get("prompt")
    if not prompt:
        return jsonify({"error": "prompt is required"}), 400

    try:
        text = generate_with_api(prompt)

        # ── Parse subject + body from the model's formatted response ───────
        lines      = text.strip().splitlines()
        subject    = ""
        body_lines = []

        for i, line in enumerate(lines):
            if line.lower().startswith("subject:"):
                subject    = line[len("subject:"):].strip()
                body_lines = lines[i + 1:]
                break

        # Strip leading blank lines from body
        while body_lines and not body_lines[0].strip():
            body_lines.pop(0)

        body = "\n".join(body_lines).strip()

        # Fallbacks if model didn't follow the format exactly
        if not subject:
            subject = prompt[:60]
        if not body:
            body = text.strip()

        return jsonify({"subject": subject, "body": body, "raw_output": text})

    except Exception as e:
        app.logger.error(f"generate_email error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/summarize_email", methods=["POST"])
def summarize_email():
    if "credentials" not in session:
        return jsonify({"error": "not_authenticated"}), 401

    data         = request.get_json() or {}
    content      = data.get("content")
    summary_type = data.get("type", "brief")

    if not content:
        return jsonify({"error": "content is required"}), 400

    try:
        summary = summarize_with_api(content, summary_type=summary_type)

        return jsonify({
            "summary":         summary,
            "type":            summary_type,
            "original_length": len(content),
            "summary_length":  len(summary),
        })

    except Exception as e:
        app.logger.error(f"summarize_email error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


# ── Entry point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    os.makedirs("./flask_session", exist_ok=True)
    app.run(debug=True, port=5000)