"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CodeSnippetProps {
  apiKey?: string;
  domain?: string;
  toEmail?: string;
}

export default function CodeSnippet({
  apiKey = "re_123456789",
  domain = "example.com",
  toEmail = "delivered@resend.dev",
}: CodeSnippetProps) {
  const [activeTab, setActiveTab] = useState<"curl" | "node" | "python" | "go">(
    "curl"
  );
  const [copied, setCopied] = useState(false);

  const snippets = {
    curl: `curl -X POST 'http://localhost:8080/v1/emails' \\
  -H 'Authorization: Bearer ${apiKey}' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "from": "Acme <onboarding@${domain}>",
    "to": ["${toEmail}"],
    "subject": "Hello World",
    "html": "<strong>It works!</strong>"
  }'`,

    node: `import { Resend } from 'resend';

const resend = new Resend('${apiKey}', {
  baseUrl: 'http://localhost:8080/v1'
});

await resend.emails.send({
  from: 'Acme <onboarding@${domain}>',
  to: ['${toEmail}'],
  subject: 'Hello World',
  html: '<strong>It works!</strong>',
});`,

    python: `import resend

resend.api_key = "${apiKey}"
resend.api_url = "http://localhost:8080/v1"

params = {
    "from": "Acme <onboarding@${domain}>",
    "to": ["${toEmail}"],
    "subject": "Hello World",
    "html": "<strong>It works!</strong>"
}

email = resend.Emails.send(params)`,

    go: `package main

import (
	"fmt"
	"github.com/resend/resend-go/v2"
)

func main() {
	client := resend.NewClient("${apiKey}")
	// Configure baseUrl: http://localhost:8080/v1

	params := &resend.SendEmailRequest{
		From:    "Acme <onboarding@${domain}>",
		To:      []string{"${toEmail}"},
		Subject: "Hello World",
		Html:    "<strong>It works!</strong>",
	}

	sent, err := client.Emails.Send(params)
	if err != nil {
		panic(err)
	}
	fmt.Println("Email ID:", sent.Id)
}`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-surface-border bg-zinc-950">
      {/* Tab Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 bg-zinc-900/50">
        <div className="flex items-center gap-1.5">
          {(["curl", "node", "python", "go"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-3 py-1.5 text-[13px] font-mono transition-colors ${
                activeTab === tab
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
              }`}
            >
              {tab === "curl" ? "cURL" : tab === "node" ? "Node.js" : tab === "python" ? "Python" : "Go"}
            </button>
          ))}
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span className="font-medium">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Display */}
      <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed text-zinc-300 bg-transparent">
        <code>{snippets[activeTab]}</code>
      </pre>
    </div>
  );
}
