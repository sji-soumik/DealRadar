"use client";

import { useState } from "react";
import {
  ActionDraft,
  Deal,
  DraftEmail,
  RiskAssessment,
} from "@/lib/types";
import { shortDate } from "./format";

interface Props {
  deal: Deal;
  assessment: RiskAssessment;
  drafts: ActionDraft[];
  onDraftCreated: () => void;
  onDraftResolved: () => void;
}

export default function DealDetail({
  deal,
  assessment,
  drafts,
  onDraftCreated,
  onDraftResolved,
}: Props) {
  const [drafting, setDrafting] = useState(false);
  const dealDrafts = drafts.filter((d) => d.dealId === deal.id);
  const hasPending = dealDrafts.some((d) => d.status === "pending");

  async function requestDraft() {
    setDrafting(true);
    try {
      await fetch(`/api/deals/${deal.id}/draft`, { method: "POST" });
      onDraftCreated();
    } finally {
      setDrafting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 border-t border-border-line bg-surface-2/40 p-4 lg:grid-cols-2">
      <div className="space-y-4">
        <section>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Risk signals ({assessment.signals.filter((s) => s.triggered).length} triggered,
            confidence {Math.round(assessment.confidence * 100)}%)
          </h4>
          <ul className="space-y-1.5">
            {assessment.signals.map((s) => (
              <li
                key={s.id}
                className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${
                  s.triggered
                    ? "border-red-500/25 bg-red-500/8"
                    : "border-border-line bg-surface/60 opacity-60"
                }`}
              >
                <span className="mt-0.5 text-xs">{s.triggered ? "⚠" : "✓"}</span>
                <span>
                  <span className="font-medium">{s.label}</span>
                  {s.triggered && (
                    <span className="ml-1.5 rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-danger">
                      +{s.weight}
                    </span>
                  )}
                  <span className="block text-xs text-muted">{s.reason}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Recent notes & activity
          </h4>
          <ul className="space-y-1.5 text-sm">
            {deal.notes.map((n, i) => (
              <li key={`n${i}`} className="rounded-md border border-border-line bg-surface/60 px-3 py-2">
                <span className="mr-2 text-xs text-muted">{shortDate(n.date)} · note</span>
                {n.text}
              </li>
            ))}
            {deal.activities.map((a, i) => (
              <li key={`a${i}`} className="rounded-md border border-border-line bg-surface/60 px-3 py-2">
                <span className="mr-2 text-xs text-muted">
                  {shortDate(a.date)} · {a.type}
                </span>
                {a.summary}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="space-y-4">
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
              Agent: next-best action
            </h4>
            {!hasPending && (
              <button
                onClick={requestDraft}
                disabled={drafting}
                className="rounded-md bg-sky-500/90 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-sky-400 disabled:opacity-50"
              >
                {drafting ? "Drafting…" : "Draft action & email"}
              </button>
            )}
          </div>

          {dealDrafts.length === 0 && !drafting && (
            <p className="text-sm text-muted">
              No drafts yet. Ask the agent to propose a next-best action and a
              re-engagement email for this deal.
            </p>
          )}

          <div className="space-y-3">
            {dealDrafts.map((draft) => (
              <DraftCard key={draft.id} draft={draft} onResolved={onDraftResolved} />
            ))}
          </div>
        </section>

        <section className="text-sm text-muted">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Contacts
          </h4>
          <ul className="space-y-1">
            {deal.contacts.map((c) => (
              <li key={c.email}>
                <span className="text-fg">{c.name}</span> — {c.title} ·{" "}
                <span className="text-xs">{c.email}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function DraftCard({
  draft,
  onResolved,
}: {
  draft: ActionDraft;
  onResolved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [subject, setSubject] = useState(draft.email.subject);
  const [body, setBody] = useState(draft.email.body);
  const [busy, setBusy] = useState(false);

  async function resolve(decision: "approved" | "edited" | "dismissed", email?: DraftEmail) {
    setBusy(true);
    try {
      await fetch(`/api/drafts/${draft.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, email }),
      });
      onResolved();
    } finally {
      setBusy(false);
      setEditing(false);
    }
  }

  const statusStyle: Record<string, string> = {
    pending: "bg-sky-500/15 text-accent border-sky-500/30",
    approved: "bg-emerald-500/15 text-ok border-emerald-500/30",
    edited: "bg-emerald-500/15 text-ok border-emerald-500/30",
    dismissed: "bg-slate-500/15 text-muted border-slate-500/30",
  };

  return (
    <div className="rounded-lg border border-border-line bg-surface p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${statusStyle[draft.status]}`}>
          {draft.status}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-muted">
          {draft.source === "openai" ? "GPT-drafted" : "rule-based draft"}
        </span>
      </div>

      <p className="text-sm font-medium">{draft.nextBestAction}</p>
      {draft.rationale && (
        <p className="mt-1 text-xs text-muted">{draft.rationale}</p>
      )}

      <div className="mt-3 rounded-md border border-border-line bg-surface-2/60 p-3">
        {editing ? (
          <div className="space-y-2">
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded border border-border-line bg-surface px-2 py-1.5 text-sm"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className="w-full rounded border border-border-line bg-surface px-2 py-1.5 text-sm"
            />
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold">Subject: {draft.email.subject}</p>
            <p className="mt-2 whitespace-pre-wrap text-xs text-muted">{draft.email.body}</p>
          </>
        )}
      </div>

      {draft.status === "pending" && (
        <div className="mt-3 flex gap-2">
          {editing ? (
            <>
              <button
                disabled={busy}
                onClick={() => resolve("edited", { subject, body })}
                className="rounded-md bg-emerald-500/90 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
              >
                Save & approve
              </button>
              <button
                disabled={busy}
                onClick={() => setEditing(false)}
                className="rounded-md border border-border-line px-3 py-1.5 text-xs font-semibold text-muted hover:text-fg"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                disabled={busy}
                onClick={() => resolve("approved")}
                className="rounded-md bg-emerald-500/90 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                disabled={busy}
                onClick={() => setEditing(true)}
                className="rounded-md border border-border-line px-3 py-1.5 text-xs font-semibold hover:border-sky-500/50"
              >
                Edit
              </button>
              <button
                disabled={busy}
                onClick={() => resolve("dismissed")}
                className="rounded-md border border-border-line px-3 py-1.5 text-xs font-semibold text-muted hover:text-danger"
              >
                Dismiss
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
