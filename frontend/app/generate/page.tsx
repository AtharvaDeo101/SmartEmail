'use client';   

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Sparkles, Send, Loader2, Copy, Check } from "lucide-react";

export default function EmailGenerator() {
  const [prompt, setPrompt] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setStatus(null);

    // Simulate AI generation (replace with real AI call)
    await new Promise((r) => setTimeout(r, 1500));

    const generated = `Subject: ${prompt.trim()}\n\nDear Recipient,\n\nI hope this email finds you well. ${prompt.trim()}\n\nPlease don't hesitate to reach out if you have any questions or need further clarification.\n\nBest regards`;
    setGeneratedEmail(generated);
    setIsGenerating(false);
  };

  const handleSend = async () => {
    if (!generatedEmail.trim() || !recipientEmail.trim()) return;
    setIsSending(true);
    setStatus(null);

    // Simulate sending (replace with real send logic)
    await new Promise((r) => setTimeout(r, 1200));

    setStatus({ type: "success", message: `Email sent to ${recipientEmail}` });
    setIsSending(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-2">
            <Mail className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            AI Email Generator
          </h1>
          <p className="text-muted-foreground text-base max-w-md mx-auto">
            Describe what you want to say — get a professional email instantly.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 md:p-8 space-y-6">
          {/* Recipient */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">To</label>
            <Input
              type="email"
              placeholder="recipient@example.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="h-11"
            />
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              What should the email say?
            </label>
            <Textarea
              placeholder="e.g. Follow up on our meeting about the Q3 roadmap and ask for the budget spreadsheet…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="w-full h-11 text-base gap-2"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isGenerating ? "Generating…" : "Generate Email"}
          </Button>

          {/* Generated Output */}
          {generatedEmail && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  Generated Email
                </label>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="rounded-xl bg-accent/50 border border-border p-4">
                <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">
                  {generatedEmail}
                </pre>
              </div>

              {/* Send Button */}
              <Button
                onClick={handleSend}
                disabled={!recipientEmail.trim() || isSending}
                variant="secondary"
                className="w-full h-11 text-base gap-2"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {isSending ? "Sending…" : "Send Email"}
              </Button>
            </div>
          )}

          {/* Status */}
          {status && (
            <div
              className={`text-sm text-center py-2 px-4 rounded-lg ${
                status.type === "success"
                  ? "bg-primary/10 text-primary"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {status.message}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Powered by AI · Review before sending
        </p>
      </div>
    </div>
  );
}
