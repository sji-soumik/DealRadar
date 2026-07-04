"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Which deals are at risk and why?",
  "What should I focus on first this week?",
  "Why is the forecast lower than the pipeline total?",
];

export default function PipelineChat({ fullPage = false }: { fullPage?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  async function send(question: string) {
    const text = question.trim();
    if (!text || thinking) return;
    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setThinking(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      setMessages([
        ...next,
        {
          role: "assistant",
          content: res.ok ? data.reply : `Something went wrong: ${data.error ?? res.status}`,
        },
      ]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Could not reach the pipeline copilot. Is the server running?" }]);
    } finally {
      setThinking(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <section
      className={`rounded-xl border border-border-line bg-surface ${
        fullPage ? "flex min-h-[70vh] flex-col" : "mb-8"
      }`}
    >
      <div className="flex items-center justify-between border-b border-border-line px-5 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Ask your pipeline — grounded in the live scan
        </h2>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="text-xs text-muted transition hover:text-fg"
          >
            Clear
          </button>
        )}
      </div>

      <div
        ref={scrollRef}
        className={`space-y-3 overflow-y-auto px-5 py-4 ${fullPage ? "flex-1" : "max-h-80"}`}
      >
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-xs text-accent transition hover:bg-sky-500/20"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                m.role === "user"
                  ? "bg-sky-500/15 text-fg"
                  : "border border-border-line bg-surface-2/50"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex justify-start">
            <div className="rounded-lg border border-border-line bg-surface-2/50 px-3 py-2 text-sm text-muted">
              Analyzing pipeline…
            </div>
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="flex gap-2 border-t border-border-line px-5 py-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about your deals, risks, or forecast…"
          className="flex-1 rounded-lg border border-border-line bg-surface-2/50 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-sky-500/50"
        />
        <button
          type="submit"
          disabled={thinking || !input.trim()}
          className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-accent transition hover:bg-sky-500/20 disabled:opacity-50"
        >
          Ask
        </button>
      </form>
    </section>
  );
}
