"use client";

import { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { AuditEntry } from "@/lib/types";
import { getBrowserSupabase } from "@/lib/supabase-browser";

export default function AuditPage() {
  const [audit, setAudit] = useState<AuditEntry[] | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/pipeline", { cache: "no-store" });
    const data = await res.json();
    setAudit(data.audit);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Live-update as agent drafts and manager decisions are logged.
  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const channel = supabase
      .channel("dealradar-sync")
      .on("broadcast", { event: "changed" }, () => refresh())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <header className="mb-6">
          <h1 className="bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            Audit log
          </h1>
          <p className="mt-1 text-sm text-muted">
            Every agent draft and every manager decision, in order. Nothing is
            sent autonomously.
          </p>
        </header>

        <section className="rounded-xl border border-border-line bg-surface p-5">
          {!audit ? (
            <p className="text-sm text-muted">Loading audit trail…</p>
          ) : audit.length === 0 ? (
            <p className="text-sm text-muted">
              No events yet. Open an at-risk deal on the dashboard and ask the
              agent to draft an action.
            </p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {audit.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-baseline gap-x-2 rounded-md border border-border-line bg-surface-2/40 px-3 py-2"
                >
                  <span className="text-xs text-muted">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                  <span
                    className={`text-xs font-semibold ${entry.actor === "Manager" ? "text-ok" : "text-accent"}`}
                  >
                    {entry.actor}
                  </span>
                  {entry.dealId && (
                    <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold text-muted">
                      {entry.dealId}
                    </span>
                  )}
                  <span className="text-xs text-muted">{entry.detail}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </AppShell>
  );
}
