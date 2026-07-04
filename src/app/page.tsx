"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ActionDraft,
  AuditEntry,
  Deal,
  ForecastSummary,
  RiskAssessment,
} from "@/lib/types";
import { categoryBadge, money, moneyFull, shortDate } from "@/components/format";
import DealDetail from "@/components/DealDetail";
import AppShell from "@/components/AppShell";
import { Kpi, ForecastBar } from "@/components/Stats";
import { getBrowserSupabase } from "@/lib/supabase-browser";

interface PipelinePayload {
  deals: Deal[];
  assessments: Record<string, RiskAssessment>;
  forecast: ForecastSummary;
  drafts: ActionDraft[];
  audit: AuditEntry[];
}

export default function Dashboard() {
  const [data, setData] = useState<PipelinePayload | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/pipeline", { cache: "no-store" });
    setData(await res.json());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Realtime: any mutation (draft created/resolved, audit written) broadcasts
  // on this channel, so every open dashboard refreshes without a reload.
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

  async function rescan() {
    setScanning(true);
    await refresh();
    // Brief delay so the scan feels tangible in the demo.
    setTimeout(() => setScanning(false), 600);
  }

  if (!data) {
    return (
      <AppShell>
        <main className="flex min-h-[60vh] items-center justify-center text-muted">
          Scanning pipeline…
        </main>
      </AppShell>
    );
  }

  const { forecast, deals, assessments, drafts, audit } = data;
  const atRiskCount = forecast.rows.filter((r) => r.category === "at-risk").length;
  const watchCount = forecast.rows.filter((r) => r.category === "watch").length;
  const pendingDrafts = drafts.filter((d) => d.status === "pending");

  return (
    <AppShell atRiskCount={atRiskCount} pendingActions={pendingDrafts.length}>
    <main className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            DealRadar
          </h1>
          <p className="mt-1 text-sm text-muted">
            Autonomous pipeline-health & forecast-integrity agent · {deals.length} open
            deals scanned · {atRiskCount} at risk · {watchCount} on watch
          </p>
        </div>
        <button
          onClick={rescan}
          disabled={scanning}
          className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-accent transition hover:bg-sky-500/20 disabled:opacity-60"
        >
          {scanning ? "Scanning…" : "Rescan pipeline"}
        </button>
      </header>

      {/* KPI cards */}
      <section className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Total pipeline" value={money(forecast.naiveTotal)} sub={`${deals.length} open deals`} />
        <Kpi label="Naive forecast" value={money(forecast.naiveWeightedTotal)} sub="stage-weighted" />
        <Kpi
          label="Risk-adjusted forecast"
          value={money(forecast.riskAdjustedTotal)}
          sub="what it's really worth"
          tone="accent"
        />
        <Kpi
          label="Forecast gap"
          value={`−${money(forecast.gap)}`}
          sub="overstated by naive view"
          tone="danger"
        />
        <Kpi label="Revenue at risk" value={money(forecast.revenueAtRisk)} sub={`${atRiskCount} deals`} tone="danger" />
        <Kpi
          label="Revenue protected"
          value={money(forecast.revenueProtected)}
          sub={`~${forecast.hoursSaved}h review saved/wk`}
          tone="ok"
        />
      </section>

      {/* Forecast comparison */}
      <section className="mb-8 rounded-xl border border-border-line bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
          Forecast integrity — naive vs. risk-adjusted
        </h2>
        <ForecastBar
          label="Naive stage-weighted forecast"
          value={forecast.naiveWeightedTotal}
          max={forecast.naiveWeightedTotal}
          color="bg-slate-400"
        />
        <ForecastBar
          label="DealRadar risk-adjusted forecast"
          value={forecast.riskAdjustedTotal}
          max={forecast.naiveWeightedTotal}
          color="bg-sky-400"
        />
        <p className="mt-3 text-xs text-muted">
          The naive forecast counts every deal at its stage probability. DealRadar
          discounts each deal by its slippage risk, revealing a{" "}
          <span className="font-semibold text-danger">{moneyFull(forecast.gap)}</span>{" "}
          gap that would otherwise surface as a missed quarter.
        </p>
      </section>

      {/* Deal table */}
      <section className="mb-8 rounded-xl border border-border-line bg-surface">
        <div className="flex items-center justify-between border-b border-border-line px-5 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Pipeline health — sorted by risk
          </h2>
          {pendingDrafts.length > 0 && (
            <span className="rounded-full bg-sky-500/15 px-3 py-1 text-xs font-semibold text-accent">
              {pendingDrafts.length} action{pendingDrafts.length > 1 ? "s" : ""} awaiting review
            </span>
          )}
        </div>

        <div className="hidden grid-cols-12 gap-2 border-b border-border-line px-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted md:grid">
          <div className="col-span-4">Deal</div>
          <div className="col-span-2">Owner</div>
          <div className="col-span-1 text-right">Value</div>
          <div className="col-span-2">Stage</div>
          <div className="col-span-2">Risk</div>
          <div className="col-span-1 text-right">Score</div>
        </div>

        {forecast.rows.map((row) => {
          const deal = deals.find((d) => d.id === row.dealId)!;
          const assessment = assessments[row.dealId];
          const isOpen = expanded === row.dealId;
          const triggered = assessment.signals.filter((s) => s.triggered).length;
          return (
            <div key={row.dealId} className="border-b border-border-line last:border-b-0">
              <button
                onClick={() => setExpanded(isOpen ? null : row.dealId)}
                className="grid w-full grid-cols-12 items-center gap-2 px-5 py-3 text-left text-sm transition hover:bg-surface-2/50"
              >
                <div className="col-span-8 md:col-span-4">
                  <p className="font-medium">{row.company}</p>
                  <p className="text-xs text-muted">{row.name}</p>
                </div>
                <div className="hidden text-muted md:col-span-2 md:block">{deal.owner}</div>
                <div className="col-span-4 text-right font-medium md:col-span-1">
                  {money(row.value)}
                </div>
                <div className="hidden md:col-span-2 md:block">
                  <span className="text-xs">{row.stage}</span>
                  <span className="block text-[11px] text-muted">
                    close {shortDate(deal.expectedCloseDate)}
                  </span>
                </div>
                <div className="hidden md:col-span-2 md:block">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${categoryBadge(row.category)}`}>
                    {row.category}
                  </span>
                  <span className="ml-1.5 text-[11px] text-muted">
                    {triggered} signal{triggered !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="hidden md:col-span-1 md:block">
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-1.5 w-12 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className={`h-full rounded-full ${
                          row.category === "at-risk"
                            ? "bg-red-400"
                            : row.category === "watch"
                              ? "bg-amber-400"
                              : "bg-emerald-400"
                        }`}
                        style={{ width: `${row.riskScore}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-xs font-semibold">{row.riskScore}</span>
                  </div>
                </div>
              </button>
              {isOpen && (
                <DealDetail
                  deal={deal}
                  assessment={assessment}
                  drafts={drafts}
                  onDraftCreated={refresh}
                  onDraftResolved={refresh}
                />
              )}
            </div>
          );
        })}
      </section>

      {/* Audit log */}
      <section className="rounded-xl border border-border-line bg-surface p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
          Audit log — every agent draft and manager decision
        </h2>
        {audit.length === 0 ? (
          <p className="text-sm text-muted">
            No events yet. Open an at-risk deal and ask the agent to draft an action.
          </p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {audit.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-baseline gap-x-2 rounded-md border border-border-line bg-surface-2/40 px-3 py-2"
              >
                <span className="text-xs text-muted">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
                <span className={`text-xs font-semibold ${entry.actor === "Manager" ? "text-ok" : "text-accent"}`}>
                  {entry.actor}
                </span>
                <span className="text-xs text-muted">{entry.detail}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="mt-8 text-center text-xs text-muted">
        DealRadar · hackathon build · also available as an MCP server (`npm run mcp`)
      </footer>
    </main>
    </AppShell>
  );
}

