"use client";

import AppShell from "@/components/AppShell";
import PipelineChat from "@/components/PipelineChat";

export default function CopilotPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <header className="mb-6">
          <h1 className="bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            Pipeline Copilot
          </h1>
          <p className="mt-1 text-sm text-muted">
            Ask anything about your deals, risks, and forecast — answers are
            grounded in the live pipeline scan, with cited evidence.
          </p>
        </header>
        <PipelineChat fullPage />
      </main>
    </AppShell>
  );
}
