"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Navigation } from "@/components/landing/navigation";
import {
  Copy,
  Check,
  X,
  Sparkles,
  Clock,
  Inbox,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  FileText,
  CheckCircle2,
  MessageSquare,
  MailOpen,
  Search,
  Mail,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = typeof window !== "undefined" && window.location.hostname !== "localhost"
  ? ""        // production: use /api/* rewrite (same origin)
  : "http://localhost:5000"  // local: direct to Flask
// ── Types ──────────────────────────────────────────────────────────────────

interface GmailEmail {
  id: string;
  subject: string;
  from: string;
  date: string;
}

interface Summary {
  keyPoints: string[];
  actionItems: string[];
  sentiment: string;
}

interface SelectedEmail {
  id: string;
  subject: string;
  from: string;
  body: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function parseSummary(raw: string): Summary {
  const lines = raw
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const keyPoints: string[] = [];
  const actionItems: string[] = [];
  let sentiment = "Neutral";
  let mode: "key" | "action" | "other" = "other";

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes("key point") || lower.includes("summary")) {
      mode = "key";
      continue;
    }
    if (lower.includes("action") || lower.includes("next step")) {
      mode = "action";
      continue;
    }
    if (lower.startsWith("sentiment") || lower.startsWith("tone")) {
      sentiment = line.replace(/^(sentiment|tone)[:\s-]*/i, "").trim();
      mode = "other";
      continue;
    }
    const cleaned = line.replace(/^[-•*\d.]+\s*/, "").trim();
    if (!cleaned) continue;
    if (mode === "key") keyPoints.push(cleaned);
    else if (mode === "action") actionItems.push(cleaned);
    else if (/^[-•*]/.test(line)) keyPoints.push(cleaned);
  }

  if (keyPoints.length === 0 && actionItems.length === 0)
    keyPoints.push(raw.trim());
  return { keyPoints, actionItems, sentiment };
}

function sentimentColor(sentiment: string) {
  const s = sentiment.toLowerCase();
  if (s.includes("positive") || s.includes("good") || s.includes("great"))
    return "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400";
  if (s.includes("negative") || s.includes("urgent") || s.includes("concern"))
    return "text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400";
  return "text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400";
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const now = new Date();
  const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// ── AnimatedWave ───────────────────────────────────────────────────────────

function AnimatedWave() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const chars = "·∘○◯◌●◉";
    let time = 0;
    let resizeTimer: ReturnType<typeof setTimeout>;

    const applySize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    applySize();

    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(applySize, 100);
    };
    window.addEventListener("resize", onResize);

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.font = "14px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const cols = Math.floor(rect.width / 20);
      const rows = Math.floor(rect.height / 20);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const px = (x + 0.5) * (rect.width / cols);
          const py = (y + 0.5) * (rect.height / rows);
          const wave1 =
            Math.sin(x * 0.2 + time * 2) * Math.cos(y * 0.15 + time);
          const wave2 = Math.sin((x + y) * 0.1 + time * 1.5);
          const wave3 = Math.cos(x * 0.1 - y * 0.1 + time * 0.8);
          const combined = (wave1 + wave2 + wave3) / 3;
          const normalized = (combined + 1) / 2;
          const charIndex = Math.floor(normalized * (chars.length - 1));
          const alpha = 0.15 + normalized * 0.5;
          ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
          ctx.fillText(chars[charIndex], px, py);
        }
      }
      time += 0.03;
      frameRef.current = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frameRef.current);
      clearTimeout(resizeTimer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="w-full h-full"
      style={{ display: "block" }}
    />
  );
}

// ── SummaryCard ────────────────────────────────────────────────────────────

interface SummaryCardProps {
  summary: Summary;
  onCopy: () => void;
  copied: boolean;
}

function SummaryCard({ summary, onCopy, copied }: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Summary
        </div>
        <button
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Copy summary"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div className="p-5 space-y-5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Sentiment
          </span>
          <span
            className={cn(
              "text-xs font-semibold px-2.5 py-0.5 rounded-full",
              sentimentColor(summary.sentiment)
            )}
          >
            {summary.sentiment}
          </span>
        </div>

        {summary.keyPoints.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <FileText className="h-3.5 w-3.5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                Key Points
              </h3>
            </div>
            <ul className="space-y-2">
              {summary.keyPoints.map((point, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-foreground/80">
                  <span className="text-primary font-bold shrink-0 mt-0.5">•</span>
                  <span className="leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {summary.actionItems.length > 0 && (
          <div className="pt-4 border-t border-border">
            <div className="flex items-center gap-1.5 mb-3">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                Action Items
              </h3>
            </div>
            <ul className="space-y-2">
              {summary.actionItems.map((item, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-foreground/80">
                  <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ── EmailSidebar ───────────────────────────────────────────────────────────

interface EmailSidebarProps {
  emails: GmailEmail[];
  selectedEmailId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  onRefresh: () => void;
  onSelect: (email: GmailEmail) => void;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  onLogin: () => void;
}

function EmailSidebar({
  emails,
  selectedEmailId,
  isLoading,
  isAuthenticated,
  onRefresh,
  onSelect,
  searchQuery,
  onSearchChange,
  onLogin,
}: EmailSidebarProps) {
  const [open, setOpen] = useState(true);

  const filtered = emails.filter((e) => {
    const q = searchQuery.toLowerCase();
    return (
      (e.subject || "").toLowerCase().includes(q) ||
      (e.from || "").toLowerCase().includes(q)
    );
  });

  return (
    <aside className="w-72 shrink-0 flex flex-col border-r border-border bg-card/50 h-full overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-accent/50 transition-colors border-b border-border"
        onClick={() => setOpen((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Inbox className="h-3.5 w-3.5" />
            Gmail Inbox
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{emails.length}</span>
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onRefresh();
              }}
              aria-label="Refresh inbox"
            >
              <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      {open && isAuthenticated && emails.length > 0 && (
        <div className="px-3 py-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search by subject or sender…"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      )}

      {/* Body */}
      {open && (
        <div className="flex-1 overflow-y-auto">
          {/* Not logged in */}
          {!isAuthenticated && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 px-4 text-center">
              <AlertCircle className="h-7 w-7 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">
                Sign in with Google to load your inbox
              </p>
              <Button size="sm" onClick={onLogin} className="gap-1.5 text-xs">
                <Mail className="h-3.5 w-3.5" />
                Sign in
              </Button>
            </div>
          )}

          {/* Loading skeletons */}
          {isAuthenticated && isLoading && (
            <div role="status" aria-label="Loading emails">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="px-3 py-3 border-b border-border/50 space-y-1.5"
                >
                  <div className="h-3 rounded bg-muted animate-pulse w-4/5" />
                  <div className="h-2.5 rounded bg-muted animate-pulse w-3/5" />
                  <div className="h-2 rounded bg-muted animate-pulse w-1/4" />
                </div>
              ))}
            </div>
          )}

          {/* Empty / no results */}
          {isAuthenticated && !isLoading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center">
              {searchQuery ? (
                <>
                  <Search className="h-7 w-7 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">
                    No emails match &ldquo;{searchQuery}&rdquo;
                  </p>
                </>
              ) : (
                <>
                  <MailOpen className="h-7 w-7 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">
                    No inbox emails found.
                  </p>
                  <button
                    onClick={onRefresh}
                    className="text-xs text-primary hover:underline mt-1"
                  >
                    Refresh
                  </button>
                </>
              )}
            </div>
          )}

          {/* Email list */}
          {isAuthenticated && !isLoading && filtered.length > 0 &&
            filtered.map((email) => (
              <button
                key={email.id}
                onClick={() => onSelect(email)}
                className={cn(
                  "w-full text-left px-3 py-3 border-b border-border/50 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
                  selectedEmailId === email.id
                    ? "bg-primary/10"
                    : "hover:bg-accent"
                )}
              >
                <p
                  className={cn(
                    "text-xs font-semibold truncate",
                    selectedEmailId === email.id
                      ? "text-primary"
                      : "text-foreground"
                  )}
                >
                  {email.subject || "(No Subject)"}
                </p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {email.from || "—"}
                </p>
                <div className="flex items-center gap-1 mt-1.5">
                  <Clock className="h-2.5 w-2.5 text-muted-foreground/60" />
                  <span className="text-xs text-muted-foreground/60">
                    {formatTime(email.date)}
                  </span>
                </div>
              </button>
            ))}
        </div>
      )}
    </aside>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function SummarizePage() {
  // Auth state — checked against backend /me directly, no hook dependency
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Inbox
  const [emails, setEmails] = useState<GmailEmail[]>([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Selected email + summary
  const [selectedEmail, setSelectedEmail] = useState<SelectedEmail | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout>>();

  // ── Check auth via /me on mount ──────────────────────────────────────────

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${API}/me`, { credentials: "include" });
        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      } finally {
        setAuthChecked(true);
      }
    };
    checkAuth();
  }, []);

  // ── Fetch inbox ──────────────────────────────────────────────────────────

  const fetchInbox = useCallback(async () => {
    setInboxLoading(true);
    try {
      const res = await fetch(
        `${API}/list_emails?max_results=20&q=in:inbox`,
        { credentials: "include" }
      );
      if (res.status === 401) {
        setIsAuthenticated(false);
        toast.error("Session expired. Please sign in again.");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || "Failed to fetch inbox");
      }
      const data = await res.json();
      const fetched: GmailEmail[] = data.emails || [];
      setEmails(fetched);
      if (fetched.length === 0) {
        toast.info("No emails found in your inbox.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load inbox";
      toast.error(msg);
      setEmails([]);
    } finally {
      setInboxLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchInbox();
  }, [isAuthenticated, fetchInbox]);

  // ── Fetch body + summarize ───────────────────────────────────────────────

  const fetchAndSummarize = useCallback(async (email: GmailEmail) => {
    setSelectedEmail({
      id: email.id,
      subject: email.subject,
      from: email.from,
      body: "",
    });
    setSummarizing(true);
    setSummary(null);

    try {
      // Step 1: get full email
      const bodyRes = await fetch(`${API}/get_email/${email.id}`, {
        credentials: "include",
      });
      if (bodyRes.status === 401) {
        setIsAuthenticated(false);
        toast.error("Session expired. Please sign in again.");
        setSummarizing(false);
        return;
      }
      if (!bodyRes.ok) throw new Error("Failed to fetch email content");

      const bodyData = await bodyRes.json();
      const bodyText: string = bodyData.plain_body || bodyData.body || "";

      setSelectedEmail({
        id: email.id,
        subject: bodyData.subject || email.subject,
        from: bodyData.from || email.from,
        body: bodyText,
      });

      if (!bodyText.trim()) {
        toast.warning("This email has no readable text content.");
        setSummarizing(false);
        return;
      }

      // Step 2: summarize
      const sumRes = await fetch(`${API}/summarize_email`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: bodyText, type: "full" }),
      });
      if (sumRes.status === 401) {
        setIsAuthenticated(false);
        toast.error("Session expired. Please sign in again.");
        setSummarizing(false);
        return;
      }
      if (!sumRes.ok) {
        const errData = await sumRes.json().catch(() => ({}));
        throw new Error(
          (errData as { error?: string }).error || "Summarization failed"
        );
      }
      const sumData = await sumRes.json();
      setSummary(parseSummary(sumData.summary));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to summarize email";
      toast.error(message);
      setSummary(null);
    } finally {
      setSummarizing(false);
    }
  }, []);

  // ── Copy ─────────────────────────────────────────────────────────────────

  const handleCopy = useCallback(() => {
    if (!summary) return;
    const text = [
      `Sentiment: ${summary.sentiment}`,
      "",
      "Key Points:",
      ...summary.keyPoints.map((p) => `- ${p}`),
      "",
      "Action Items:",
      ...summary.actionItems.map((a) => `- ${a}`),
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 2000);
  }, [summary]);

  const handleClear = useCallback(() => {
    setSelectedEmail(null);
    setSummary(null);
  }, []);

  const handleLogin = () => {
    window.location.href = `${API}/login`;
  };

  // ── Auth loading ──────────────────────────────────────────────────────────

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />

      <div className="flex flex-1 overflow-hidden pt-16">
        {/* Sidebar */}
        <EmailSidebar
          emails={emails}
          selectedEmailId={selectedEmail?.id ?? null}
          isLoading={inboxLoading}
          isAuthenticated={isAuthenticated}
          onRefresh={fetchInbox}
          onSelect={fetchAndSummarize}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onLogin={handleLogin}
        />

        {/* Main */}
        <main className="flex-1 overflow-y-auto">
          {/* Hero */}
          <div className="relative w-full h-44 overflow-hidden border-b border-border">
            <div className="absolute inset-0">
              <AnimatedWave />
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background/80" />
            <div className="relative z-10 flex items-center justify-between h-full px-8 md:px-12 max-w-3xl mx-auto w-full">
              <div>
                <h1 className="text-3xl font-semibold text-foreground tracking-tight">
                  AI Email Summarizer
                </h1>
                <p className="text-base text-muted-foreground mt-1">
                  Select any email to instantly extract key points and action items.
                </p>
              </div>
              {selectedEmail && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  className="gap-1.5 shrink-0 bg-background/70 backdrop-blur-sm"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8">
            <div className="max-w-3xl mx-auto space-y-6">

              {/* Not logged in — full page prompt */}
              {!isAuthenticated && (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-24 text-center gap-4 animate-in fade-in duration-300">
                  <div className="h-14 w-14 rounded-full bg-accent flex items-center justify-center">
                    <Mail className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Connect your Gmail account
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sign in with Google to load and summarize your emails
                    </p>
                  </div>
                  <Button onClick={handleLogin} className="gap-2 mt-2">
                    <Mail className="h-4 w-4" />
                    Sign in with Google
                  </Button>
                </div>
              )}

              {/* Empty state — logged in, no selection */}
              {isAuthenticated && !selectedEmail && !summarizing && (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-24 text-center gap-4 animate-in fade-in duration-300">
                  <div className="h-14 w-14 rounded-full bg-accent flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      No email selected
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Pick an email from the sidebar to generate a summary
                    </p>
                  </div>
                </div>
              )}

              {/* Selected email card */}
              {selectedEmail && (
                <div className="rounded-xl border border-border bg-card overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-start justify-between px-5 py-4 border-b border-border">
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {selectedEmail.subject || "(No Subject)"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        From: {selectedEmail.from}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleClear}
                      aria-label="Close email"
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Body skeleton while loading */}
                  {summarizing ? (
                    <div className="px-5 py-4 space-y-2 animate-pulse">
                      <div className="h-3 bg-muted rounded w-full" />
                      <div className="h-3 bg-muted rounded w-5/6" />
                      <div className="h-3 bg-muted rounded w-4/5" />
                      <div className="h-3 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                    </div>
                  ) : (
                    selectedEmail.body && (
                      <div className="px-5 py-4 max-h-48 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-sm text-foreground/75 font-sans leading-relaxed">
                          {selectedEmail.body}
                        </pre>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Summarizing spinner */}
              {summarizing && (
                <div
                  className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 gap-4 animate-in fade-in duration-200"
                  role="status"
                  aria-live="polite"
                >
                  <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-accent-foreground animate-pulse" />
                  </div>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Generating summary…
                  </p>
                </div>
              )}

              {/* Summary result */}
              {summary && !summarizing && (
                <SummaryCard
                  summary={summary}
                  onCopy={handleCopy}
                  copied={copied}
                />
              )}

              {summary && !summarizing && (
                <Button
                  variant="outline"
                  onClick={handleClear}
                  className="w-full h-11 animate-in fade-in duration-300"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Selection
                </Button>
              )}

              <p className="text-center text-xs text-muted-foreground pb-4">
                Powered by AI · Summaries are generated automatically
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}