"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Copy, Send, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface GeneratedEmail {
  subject: string;
  body: string;
}

export default function GeneratePage() {
  const [prompt, setPrompt] = useState("");
  const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editedSubject, setEditedSubject] = useState("");
  const [editedBody, setEditedBody] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 300));

    const mockEmails = [
      {
        subject: "Meeting Request: Project Discussion",
        body: "Hi there,\\n\\nI hope this email finds you well. I wanted to reach out regarding our upcoming project discussion. Would you be available for a meeting next week to align on our goals and timeline?\\n\\nPlease let me know what works best for your schedule.\\n\\nBest regards",
      },
      {
        subject: "Exciting Opportunity to Collaborate",
        body: "Hello,\\n\\nI came across your work and was impressed by your approach. I believe we could create something valuable together. Would you be interested in discussing a potential collaboration?\\n\\nLooking forward to hearing from you.\\n\\nWarm regards",
      },
      {
        subject: "Proposal for Q2 Initiative",
        body: "Dear Team,\\n\\nI'd like to propose a new initiative for Q2 that could significantly improve our workflow. I've attached a preliminary outline and would love to get your feedback.\\n\\nWhen would be a good time to discuss this further?\\n\\nThank you",
      },
    ];

    const randomEmail = mockEmails[Math.floor(Math.random() * mockEmails.length)];
    setGeneratedEmail(randomEmail);
    setEditedSubject(randomEmail.subject);
    setEditedBody(randomEmail.body);
    setIsLoading(false);
    toast.success("Email generated successfully!");
  };

  const handleCopySubject = () => {
    navigator.clipboard.writeText(editedSubject);
    toast.success("Subject copied to clipboard");
  };

  const handleCopyBody = () => {
    navigator.clipboard.writeText(editedBody);
    toast.success("Email body copied to clipboard");
  };

  const handleSend = () => {
    toast.success("Email sent successfully!");
    setPrompt("");
    setGeneratedEmail(null);
    setEditedSubject("");
    setEditedBody("");
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ✅ Static page header — no longer sticky, layout handles offset */}
      <div className="bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Generate Email
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Describe what you want to say and let AI write your email
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">What do you want to say?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="e.g., Write a professional email requesting a meeting with my manager to discuss project updates..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[200px] resize-none"
                />
                <Button
                  onClick={handleGenerate}
                  disabled={isLoading || !prompt.trim()}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isLoading ? (
                    <LoadingSpinner />
                  ) : (
                    <>
                      Generate Email
                      <span className="ml-2">✨</span>
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Output Section */}
          <div className="space-y-4">
            {generatedEmail ? (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Subject Line</CardTitle>
                      <button
                        onClick={handleCopySubject}
                        className="p-1.5 hover:bg-secondary rounded-md transition-colors"
                        title="Copy subject"
                      >
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Input
                      value={editedSubject}
                      onChange={(e) => setEditedSubject(e.target.value)}
                      className="text-sm"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Email Body</CardTitle>
                      <button
                        onClick={handleCopyBody}
                        className="p-1.5 hover:bg-secondary rounded-md transition-colors"
                        title="Copy body"
                      >
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={editedBody}
                      onChange={(e) => setEditedBody(e.target.value)}
                      className="min-h-[200px] resize-none text-sm"
                    />
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Button
                    onClick={handleRegenerate}
                    variant="outline"
                    className="flex-1"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                  <Button
                    onClick={handleSend}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>
                </div>
              </>
            ) : (
              <Card className="h-full flex items-center justify-center min-h-[400px]">
                <CardContent className="text-center">
                  <p className="text-muted-foreground">
                    Your generated email will appear here
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