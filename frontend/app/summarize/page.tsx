"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailCard } from "@/components/email-card";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Copy, X } from "lucide-react";
import { toast } from "sonner";

const API = "http://localhost:5000";

interface Email {
  id: string;
  from: string;
  subject: string;
  preview: string;
  body: string;
  date: string;
}

interface Summary {
  keyPoints: string[];
  actionItems: string[];
  sentiment: string;
}

const mockEmails: Email[] = [
  {
    id: "1",
    from: "alice@company.com",
    subject: "Project Update - Q2 Timeline",
    preview: "Hi team, I wanted to provide an update on the project timeline for Q2...",
    body: "Hi team,\n\nI wanted to provide an update on the project timeline for Q2. We've made significant progress on the core features and are on track for the scheduled release.\n\nKey accomplishments:\n- Completed API integration\n- User testing phase started\n- Performance optimization underway\n\nNext steps:\n- Finalize remaining features\n- Conduct security audit\n- Prepare launch materials\n\nLooking forward to our team sync next week.\n\nBest regards,\nAlice",
    date: "Today",
  },
  {
    id: "2",
    from: "bob@company.com",
    subject: "Feedback on Design Proposal",
    preview: "Great work on the new design mockups! I have some initial thoughts...",
    body: "Great work on the new design mockups! I have some initial thoughts:\n\nPositive feedback:\n- Clean and intuitive interface\n- Excellent color scheme\n- Good use of white space\n\nSuggestions:\n- Consider adjusting button sizing for better accessibility\n- Add more icons for visual hierarchy\n- Test with different screen sizes\n\nPlease schedule a review call to discuss these points.\n\nThanks,\nBob",
    date: "Yesterday",
  },
  {
    id: "3",
    from: "carol@company.com",
    subject: "Meeting Notes - Stakeholder Sync",
    preview: "Following up from our stakeholder meeting yesterday. Here are the key decisions...",
    body: "Following up from our stakeholder meeting yesterday. Here are the key decisions made:\n\nDecisions:\n1. Approve budget for Q3 initiatives\n2. Move forward with partnership proposal\n3. Schedule monthly check-ins with leadership\n\nAction Items:\n- Finance team: Prepare detailed budget breakdown\n- Product team: Create partnership agreement draft\n- All teams: Update roadmap accordingly\n\nNext meeting scheduled for next month.\n\nBest,\nCarol",
    date: "2 days ago",
  },
  {
    id: "4",
    from: "david@company.com",
    subject: "Technical Implementation Guide",
    preview: "Here's the comprehensive guide for implementing the new system architecture...",
    body: "Here's the comprehensive guide for implementing the new system architecture. The document covers:\n\n1. System Design Overview\n   - Architecture diagrams\n   - Technology stack\n   - Scalability considerations\n\n2. Implementation Steps\n   - Phase 1: Infrastructure setup\n   - Phase 2: Core features\n   - Phase 3: Integration and testing\n\n3. Best Practices\n   - Code standards\n   - Testing requirements\n   - Documentation guidelines\n\nPlease review and provide feedback by Friday.\n\nThanks,\nDavid",
    date: "3 days ago",
  },
];

/**
 * Parses the flat summary string from the backend into structured sections.
 * The model returns free-form text, so we do a best-effort parse.
 */
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
    else {
      // Fallback: treat bullet-like lines as key points
      if (/^[-•*]/.test(line)) keyPoints.push(cleaned);
    }
  }

  // If the model returned a flat paragraph with no sections, use the whole thing as one key point
  if (keyPoints.length === 0 && actionItems.length === 0) {
    keyPoints.push(raw.trim());
  }

  return { keyPoints, actionItems, sentiment };
}

export default function SummarizePage() {
  const isAuthenticated = useAuth(); // redirects to /login if not authed

  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const selectedEmail = mockEmails.find((e) => e.id === selectedEmailId);

  /* Show spinner while auth check is in progress */
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const handleSelectEmail = async (email: Email) => {
    setSelectedEmailId(email.id);
    setIsLoading(true);
    setSummary(null);

    try {
      const res = await fetch(`${API}/summarize_email`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: email.body, type: "full" }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Summarization failed");
      }

      const data = await res.json();
      setSummary(parseSummary(data.summary));
    } catch (err: any) {
      toast.error(err.message || "Failed to summarize email");
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySummary = () => {
    if (!summary) return;
    const text = [
      "Key Points:",
      ...summary.keyPoints.map((p) => `- ${p}`),
      "",
      "Action Items:",
      ...summary.actionItems.map((a) => `- ${a}`),
      "",
      `Sentiment: ${summary.sentiment}`,
    ].join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Summary copied to clipboard");
  };

  const handleClearSelection = () => {
    setSelectedEmailId(null);
    setSummary(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Summarize Email
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Select an email to get an AI-powered summary
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Email List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Emails</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {mockEmails.map((email) => (
                  <button
                    key={email.id}
                    onClick={() => handleSelectEmail(email)}
                    className="w-full text-left"
                  >
                    <EmailCard
                      from={email.from}
                      subject={email.subject}
                      preview={email.preview}
                      date={email.date}
                    />
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Summary Section */}
          <div className="lg:col-span-2 space-y-4">
            {selectedEmail ? (
              <>
                {/* Email Preview */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {selectedEmail.subject}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          From: {selectedEmail.from}
                        </p>
                      </div>
                      <button
                        onClick={handleClearSelection}
                        className="p-1.5 hover:bg-secondary rounded-md transition-colors"
                        aria-label="Close"
                      >
                        <X className="w-5 h-5 text-muted-foreground" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap text-foreground/80">
                      {selectedEmail.body}
                    </p>
                  </CardContent>
                </Card>

                {/* Summary */}
                {isLoading ? (
                  <Card className="min-h-[300px] flex items-center justify-center">
                    <div className="text-center">
                      <LoadingSpinner />
                      <p className="text-muted-foreground text-sm mt-4">
                        Generating summary…
                      </p>
                    </div>
                  </Card>
                ) : summary ? (
                  <>
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Summary</CardTitle>
                          <button
                            onClick={handleCopySummary}
                            className="p-1.5 hover:bg-secondary rounded-md transition-colors"
                            aria-label="Copy summary"
                          >
                            <Copy className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {summary.keyPoints.length > 0 && (
                          <div>
                            <h3 className="font-semibold text-sm mb-2">
                              Key Points
                            </h3>
                            <ul className="space-y-1">
                              {summary.keyPoints.map((point, i) => (
                                <li
                                  key={i}
                                  className="text-sm text-foreground/80 flex gap-2"
                                >
                                  <span className="text-primary font-bold shrink-0">
                                    •
                                  </span>
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {summary.actionItems.length > 0 && (
                          <div className="pt-3 border-t border-border">
                            <h3 className="font-semibold text-sm mb-2">
                              Action Items
                            </h3>
                            <ul className="space-y-1">
                              {summary.actionItems.map((item, i) => (
                                <li
                                  key={i}
                                  className="text-sm text-foreground/80 flex gap-2"
                                >
                                  <span className="text-primary font-bold shrink-0">
                                    ✓
                                  </span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="pt-3 border-t border-border">
                          <p className="text-sm">
                            <span className="font-semibold">Sentiment:</span>{" "}
                            <span className="text-foreground/80">
                              {summary.sentiment}
                            </span>
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Button
                      onClick={handleClearSelection}
                      variant="outline"
                      className="w-full"
                    >
                      Clear Selection
                    </Button>
                  </>
                ) : null}
              </>
            ) : (
              <Card className="min-h-[300px] flex items-center justify-center">
                <CardContent className="text-center">
                  <p className="text-muted-foreground">
                    Select an email to view its summary
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}