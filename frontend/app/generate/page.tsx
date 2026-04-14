"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Navigation } from "@/components/landing/navigation";
import {
  Send,
  User,
  Sparkles,
  Loader2,
  Copy,
  Check,
  Eye,
  PlusCircle,
  Save,
  X,
  Mail,
  Clock,
  Trash2,
  MailOpen,
  Inbox,
  SendHorizonal,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Code,
} from "lucide-react";

const API = "http://localhost:5000";

// ── Types ──────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface DraftEmail {
  id: string;
  subject: string;
  body: string;
  recipientEmail: string;
  createdAt: Date;
}

interface GmailEmail {
  id: string;
  subject: string;
  from: string;
  date: string;
}

interface GmailEmailDetail {
  id: string;
  subject: string;
  from: string;
  date: string;
  body: string;       // plain text (backwards compatible)
  plain_body?: string;
  html_body?: string;
}

// ── ChatPrompt ─────────────────────────────────────────────────────────────

interface ChatPromptProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

function ChatPrompt({ messages, onSendMessage, isLoading }: ChatPromptProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput("");
  };

  return (
    <div className="flex flex-col h-64 border border-border rounded-xl bg-card overflow-hidden">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3"
      >
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Describe the email you want to generate…
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-2.5 max-w-[85%]",
              msg.role === "user" ? "ml-auto flex-row-reverse" : ""
            )}
          >
            <div
              className={cn(
                "h-7 w-7 rounded-full flex items-center justify-center shrink-0",
                msg.role === "user" ? "bg-primary" : "bg-accent"
              )}
            >
              {msg.role === "user" ? (
                <User className="h-3.5 w-3.5 text-primary-foreground" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 text-accent-foreground" />
              )}
            </div>
            <div
              className={cn(
                "rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent text-accent-foreground"
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2.5">
            <div className="h-7 w-7 rounded-full bg-accent flex items-center justify-center shrink-0">
              <Sparkles className="h-3.5 w-3.5 text-accent-foreground" />
            </div>
            <div className="bg-accent rounded-xl px-4 py-3 flex gap-1">
              <span
                className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="border-t border-border p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe the email you want to generate…"
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          disabled={isLoading}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || isLoading}
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

// ── EmailEditor ────────────────────────────────────────────────────────────

interface EmailEditorProps {
  subject: string;
  body: string;
  onSubjectChange: (val: string) => void;
  onBodyChange: (val: string) => void;
}

function EmailEditor({
  subject,
  body,
  onSubjectChange,
  onBodyChange,
}: EmailEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [body]);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3 border-b border-border pb-3">
        <span className="text-xs font-medium text-muted-foreground w-14 shrink-0">
          Subject
        </span>
        <Input
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          placeholder="Email subject…"
          className="border-none shadow-none focus-visible:ring-0 p-0 h-auto text-sm font-medium bg-transparent"
        />
      </div>
      <div className="flex gap-3">
        <span className="text-xs font-medium text-muted-foreground w-14 shrink-0 pt-0.5">
          Body
        </span>
        <Textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          placeholder="Email body…"
          className="border-none shadow-none focus-visible:ring-0 p-0 resize-none min-h-[180px] text-sm bg-transparent leading-relaxed"
        />
      </div>
    </div>
  );
}

// ── EmailPreviewModal ──────────────────────────────────────────────────────

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientEmail: string;
  subject: string;
  body: string;
}

function EmailPreviewModal({
  isOpen,
  onClose,
  recipientEmail,
  subject,
  body,
}: EmailPreviewModalProps) {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Email Preview"
    >
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-border bg-card shadow-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Mail className="h-4 w-4 text-primary" />
            Email Preview
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close preview"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="px-5 py-3 border-b border-border space-y-2 text-sm shrink-0">
          <div className="flex gap-3">
            <span className="text-muted-foreground w-14 shrink-0">To</span>
            <span className="text-foreground font-medium">
              {recipientEmail || "—"}
            </span>
          </div>
          <div className="flex gap-3">
            <span className="text-muted-foreground w-14 shrink-0">Subject</span>
            <span className="text-foreground font-medium">
              {subject || "—"}
            </span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">
            {body || (
              <span className="text-muted-foreground">No body yet.</span>
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}

// ── GmailEmailDetailModal ──────────────────────────────────────────────────

interface GmailEmailDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: GmailEmailDetail | null;
  isLoading: boolean;
}

function GmailEmailDetailModal({
  isOpen,
  onClose,
  email,
  isLoading,
}: GmailEmailDetailModalProps) {
  const [viewMode, setViewMode] = useState<"text" | "html">("text");

  useEffect(() => {
    // reset mode when opening a new email
    if (isOpen) setViewMode("text");
  }, [isOpen, email?.id]);

  if (!isOpen) return null;

  const plain = email?.plain_body || email?.body || "";
  const html = email?.html_body || "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Email Detail"
    >
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-border bg-card shadow-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Mail className="h-4 w-4 text-primary" />
            {email?.subject || "Email"}
          </div>
          <div className="flex items-center gap-2">
            {html && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() =>
                  setViewMode((prev) => (prev === "text" ? "html" : "text"))
                }
              >
                <Code className="h-3 w-3" />
                {viewMode === "text" ? "View HTML" : "View text"}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : email ? (
          <>
            <div className="px-5 py-3 border-b border-border space-y-2 text-sm shrink-0">
              <div className="flex gap-3">
                <span className="text-muted-foreground w-14 shrink-0">From</span>
                <span className="text-foreground font-medium">
                  {email.from || "—"}
                </span>
              </div>
              <div className="flex gap-3">
                <span className="text-muted-foreground w-14 shrink-0">
                  Subject
                </span>
                <span className="text-foreground font-medium">
                  {email.subject || "—"}
                </span>
              </div>
              <div className="flex gap-3">
                <span className="text-muted-foreground w-14 shrink-0">Date</span>
                <span className="text-foreground">{email.date || "—"}</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {viewMode === "text" || !html ? (
                <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">
                  {plain || (
                    <span className="text-muted-foreground">
                      No body content.
                    </span>
                  )}
                </pre>
              ) : (
                <div className="prose max-w-none text-sm text-foreground">
                  {/* We trust Gmail HTML enough in this context; if needed sanitize first */}
                  <div
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
            Failed to load email.
          </div>
        )}
      </div>
    </div>
  );
}

// ── SidebarSection ─────────────────────────────────────────────────────────

interface SidebarSectionProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  isLoading: boolean;
  onRefresh: () => void;
  children: React.ReactNode;
}

function SidebarSection({
  title,
  count,
  icon,
  isOpen,
  onToggle,
  isLoading,
  onRefresh,
  children,
}: SidebarSectionProps) {
  return (
    <div className="border-t border-border">
      <div
        className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            {icon}
            {title}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{count}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onRefresh();
            }}
            aria-label={`Refresh ${title}`}
          >
            <RefreshCw
              className={cn("h-3 w-3", isLoading && "animate-spin")}
            />
          </Button>
        </div>
      </div>
      {isOpen && (
        <div className="pb-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  );
}

// ── EmailSidebar ───────────────────────────────────────────────────────────

interface EmailSidebarProps {
  drafts: DraftEmail[];
  activeDraftId: string | null;
  onSelectDraft: (draft: DraftEmail) => void;
  onDeleteDraft: (id: string) => void;
  inboxEmails: GmailEmail[];
  sentEmails: GmailEmail[];
  inboxLoading: boolean;
  sentLoading: boolean;
  onRefreshInbox: () => void;
  onRefreshSent: () => void;
  onOpenGmailEmail: (id: string) => void;
}

function EmailSidebar({
  drafts,
  activeDraftId,
  onSelectDraft,
  onDeleteDraft,
  inboxEmails,
  sentEmails,
  inboxLoading,
  sentLoading,
  onRefreshInbox,
  onRefreshSent,
  onOpenGmailEmail,
}: EmailSidebarProps) {
  const [draftsOpen, setDraftsOpen] = useState(true);
  const [inboxOpen, setInboxOpen] = useState(true);
  const [sentOpen, setSentOpen] = useState(true);

  const formatTime = (dateStr: string | Date) => {
    const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    if (isNaN(date.getTime())) return dateStr as string;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return date.toLocaleDateString();
  };

  const GmailEmailItem = ({ email }: { email: GmailEmail }) => (
    <div
      className="group mx-2 mb-1 rounded-lg px-3 py-2.5 cursor-pointer hover:bg-accent transition-colors"
      onClick={() => onOpenGmailEmail(email.id)}
    >
      <p className="text-xs font-medium truncate text-foreground">
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
    </div>
  );

  return (
    <aside className="w-64 shrink-0 flex flex-col border-r border-border bg-card/50 h-full overflow-y-auto">
      {/* Drafts */}
      <div
        className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => setDraftsOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          {draftsOpen ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Mail className="h-3.5 w-3.5" />
            Drafts
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {drafts.length} saved
        </span>
      </div>

      {draftsOpen && (
        <div className="pb-2">
          {drafts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 px-4 text-center">
              <MailOpen className="h-7 w-7 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">No drafts yet.</p>
            </div>
          ) : (
            drafts.map((draft) => (
              <div
                key={draft.id}
                className={cn(
                  "group relative mx-2 mb-1 rounded-lg px-3 py-2.5 cursor-pointer transition-colors",
                  activeDraftId === draft.id
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-accent text-foreground"
                )}
                onClick={() => onSelectDraft(draft)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">
                      {draft.subject || "Untitled"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {draft.recipientEmail || "No recipient"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDraft(draft.id);
                    }}
                    aria-label="Delete draft"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-1 mt-1.5">
                  <Clock className="h-2.5 w-2.5 text-muted-foreground/60" />
                  <span className="text-xs text-muted-foreground/60">
                    {formatTime(draft.createdAt)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Inbox */}
      <SidebarSection
        title="Inbox"
        count={inboxEmails.length}
        icon={<Inbox className="h-3.5 w-3.5" />}
        isOpen={inboxOpen}
        onToggle={() => setInboxOpen((v) => !v)}
        isLoading={inboxLoading}
        onRefresh={onRefreshInbox}
      >
        {inboxEmails.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 px-4 text-center">
            <Inbox className="h-7 w-7 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">
              No inbox emails found.
            </p>
          </div>
        ) : (
          inboxEmails.map((email) => (
            <GmailEmailItem key={email.id} email={email} />
          ))
        )}
      </SidebarSection>

      {/* Sent */}
      <SidebarSection
        title="Sent"
        count={sentEmails.length}
        icon={<SendHorizonal className="h-3.5 w-3.5" />}
        isOpen={sentOpen}
        onToggle={() => setSentOpen((v) => !v)}
        isLoading={sentLoading}
        onRefresh={onRefreshSent}
      >
        {sentEmails.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 px-4 text-center">
            <SendHorizonal className="h-7 w-7 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">
              No sent emails found.
            </p>
          </div>
        ) : (
          sentEmails.map((email) => (
            <GmailEmailItem key={email.id} email={email} />
          ))
        )}
      </SidebarSection>
    </aside>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function EmailGenerator() {
  const isAuthenticated = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [drafts, setDrafts] = useState<DraftEmail[]>([]);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);

  // Inbox & Sent
  const [inboxEmails, setInboxEmails] = useState<GmailEmail[]>([]);
  const [sentEmails, setSentEmails] = useState<GmailEmail[]>([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [sentLoading, setSentLoading] = useState(false);

  // Gmail detail modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailEmail, setDetailEmail] = useState<GmailEmailDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchInbox = async () => {
    setInboxLoading(true);
    try {
      const res = await fetch(
        `${API}/list_emails?max_results=20&q=in:inbox`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch inbox");
      const data = await res.json();
      setInboxEmails(data.emails || []);
    } catch {
      setInboxEmails([]);
    } finally {
      setInboxLoading(false);
    }
  };

  const fetchSent = async () => {
    setSentLoading(true);
    try {
      const res = await fetch(
        `${API}/list_emails?max_results=20&q=in:sent`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch sent");
      const data = await res.json();
      setSentEmails(data.emails || []);
    } catch {
      setSentEmails([]);
    } finally {
      setSentLoading(false);
    }
  };

  const handleOpenGmailEmail = async (id: string) => {
    setDetailModalOpen(true);
    setDetailEmail(null);
    setDetailLoading(true);
    try {
      const res = await fetch(`${API}/get_email/${id}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch email");
      const data = await res.json();
      setDetailEmail(data);
    } catch {
      setDetailEmail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchInbox();
      fetchSent();
    }
  }, [isAuthenticated]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const addMessage = (role: ChatMessage["role"], content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, role, content },
    ]);
  };

  const handleSendMessage = async (userMessage: string) => {
    addMessage("user", userMessage);
    setIsChatLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`${API}/generate_email`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage }),
      });
      if (!res.ok)
        throw new Error((await res.json()).error || "Generation failed");
      const data = await res.json();
      setSubject(data.subject ?? "");
      setBody(data.body ?? "");
      addMessage(
        "assistant",
        `I've drafted an email with the subject "${data.subject}". Review and edit it below, then send when ready.`
      );
    } catch (err: any) {
      const msg = err.message || "Unknown error";
      addMessage("assistant", `Sorry, something went wrong: ${msg}`);
      setStatus({ type: "error", message: msg });
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSaveDraft = () => {
    if (!subject && !body) return;
    if (activeDraftId) {
      setDrafts((prev) =>
        prev.map((d) =>
          d.id === activeDraftId
            ? {
                ...d,
                subject,
                body,
                recipientEmail,
                createdAt: new Date(),
              }
            : d
        )
      );
    } else {
      const newDraft: DraftEmail = {
        id: `${Date.now()}`,
        subject,
        body,
        recipientEmail,
        createdAt: new Date(),
      };
      setDrafts((prev) => [newDraft, ...prev]);
      setActiveDraftId(newDraft.id);
    }
    setStatus({ type: "success", message: "Draft saved." });
    setTimeout(() => setStatus(null), 2000);
  };

  const handleNewEmail = () => {
    setSubject("");
    setBody("");
    setRecipientEmail("");
    setActiveDraftId(null);
    setMessages([]);
    setStatus(null);
  };

  const handleSelectDraft = (draft: DraftEmail) => {
    setSubject(draft.subject);
    setBody(draft.body);
    setRecipientEmail(draft.recipientEmail);
    setActiveDraftId(draft.id);
    setMessages([]);
  };

  const handleDeleteDraft = (id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
    if (activeDraftId === id) handleNewEmail();
  };

  const handleSend = async () => {
    if (!body.trim() || !recipientEmail.trim()) return;
    setIsSending(true);
    setStatus(null);
    try {
      const res = await fetch(`${API}/send_email`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipientEmail.trim(),
          subject,
          body,
        }),
      });
      if (!res.ok)
        throw new Error((await res.json()).error || "Sending failed");
      setStatus({
        type: "success",
        message: `Email sent to ${recipientEmail}`,
      });
      addMessage(
        "assistant",
        `✅ Email successfully sent to ${recipientEmail}!`
      );
      fetchSent();
    } catch (err: any) {
      setStatus({
        type: "error",
        message: err.message || "Unknown error",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasEmail = Boolean(subject || body);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <div className="flex flex-1 overflow-hidden pt-16">
        <EmailSidebar
          drafts={drafts}
          activeDraftId={activeDraftId}
          onSelectDraft={handleSelectDraft}
          onDeleteDraft={handleDeleteDraft}
          inboxEmails={inboxEmails}
          sentEmails={sentEmails}
          inboxLoading={inboxLoading}
          sentLoading={sentLoading}
          onRefreshInbox={fetchInbox}
          onRefreshSent={fetchSent}
          onOpenGmailEmail={handleOpenGmailEmail}
        />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-foreground tracking-tight">
                  AI Email Generator
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Describe what you want to say — get a professional email
                  instantly.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewEmail}
                className="gap-1.5"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                New
              </Button>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                To
              </label>
              <Input
                type="email"
                placeholder="recipient@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Chat with AI
              </label>
              <ChatPrompt
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isChatLoading}
              />
            </div>

            {hasEmail && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">
                    Edit Email
                  </label>
                  <div className="flex items-center gap-2">
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
                    <button
                      onClick={() => setPreviewOpen(true)}
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Preview
                    </button>
                  </div>
                </div>
                <EmailEditor
                  subject={subject}
                  body={body}
                  onSubjectChange={setSubject}
                  onBodyChange={setBody}
                />
              </div>
            )}

            {hasEmail && (
              <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  className="flex-1 h-11 gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Draft
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={!recipientEmail.trim() || isSending}
                  className="flex-1 h-11 gap-2"
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

            <p className="text-center text-xs text-muted-foreground pb-4">
              Powered by AI · Review before sending
            </p>
          </div>
        </main>
      </div>

      <EmailPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        recipientEmail={recipientEmail}
        subject={subject}
        body={body}
      />

      <GmailEmailDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setDetailEmail(null);
        }}
        email={detailEmail}
        isLoading={detailLoading}
      />
    </div>
  );
}