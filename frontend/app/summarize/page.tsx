"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailCard } from "@/components/email-card";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Copy, X } from "lucide-react";
import { toast } from "sonner";

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

export default function SummarizePage() {
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const selectedEmail = mockEmails.find((e) => e.id === selectedEmailId);

  const handleSelectEmail = async (email: Email) => {
    setSelectedEmailId(email.id);
    setIsLoading(true);
    setSummary(null);

    // Simulate API call with delay
    await new Promise((resolve) => setTimeout(resolve, 400));

    const mockSummaries: Record<string, Summary> = {
      "1": {
        keyPoints: [
          "Q2 project is on track for scheduled release",
          "API integration completed successfully",
          "User testing phase has started",
        ],
        actionItems: [
          "Finalize remaining features",
          "Conduct security audit",
          "Prepare launch materials",
        ],
        sentiment: "Positive and Progress-focused",
      },
      "2": {
        keyPoints: [
          "Design mockups received positive overall feedback",
          "Interface is clean and intuitive",
          "Some accessibility considerations needed",
        ],
        actionItems: [
          "Adjust button sizing for better accessibility",
          "Add more icons for visual hierarchy",
          "Test designs across different screen sizes",
          "Schedule design review call",
        ],
        sentiment: "Constructive and Supportive",
      },
      "3": {
        keyPoints: [
          "Q3 budget approved for new initiatives",
          "Partnership proposal moving forward",
          "Monthly leadership check-ins established",
        ],
        actionItems: [
          "Prepare detailed Q3 budget breakdown",
          "Create partnership agreement draft",
          "Update project roadmap",
        ],
        sentiment: "Positive and Decisive",
      },
      "4": {
        keyPoints: [
          "Comprehensive system architecture guide provided",
          "Three-phase implementation plan outlined",
          "Best practices and standards included",
        ],
        actionItems: [
          "Review implementation guide",
          "Provide feedback by Friday",
          "Begin Phase 1 infrastructure setup",
        ],
        sentiment: "Technical and Professional",
      },
    };

    setSummary(mockSummaries[email.id] || mockSummaries["1"]);
    setIsLoading(false);
  };

  const handleCopySummary = () => {
    if (!summary) return;

    const summaryText = `Key Points:\n${summary.keyPoints.map((p) => `- ${p}`).join("\n")}\n\nAction Items:\n${summary.actionItems.map((a) => `- ${a}`).join("\n")}\n\nSentiment: ${summary.sentiment}`;

    navigator.clipboard.writeText(summaryText);
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
                  <div key={email.id} className="flex gap-2">
                    <button
                      onClick={() => handleSelectEmail(email)}
                      className="flex-1 text-left"
                    >
                      <EmailCard
                        from={email.from}
                        subject={email.subject}
                        preview={email.preview}
                        date={email.date}
                      />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Summary Section */}
          <div className="lg:col-span-2 space-y-4">
            {selectedEmail && (
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
                        Generating summary...
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
                          >
                            <Copy className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
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
                                <span className="text-primary font-bold">•</span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

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
                                <span className="text-secondary font-bold">
                                  ✓
                                </span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

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
            )}

            {!selectedEmail && (
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
