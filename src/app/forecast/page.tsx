"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { Kpi, ForecastBar } from "@/components/Stats";
import { categoryBadge, money, moneyFull } from "@/components/format";
import { ForecastSummary } from "@/lib/types";

export default function ForecastPage() {
  const [forecast, setForecast] = useState<ForecastSummary | null>(null);

  useEffect(() => {
    fetch("/api/pipeline", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setForecast(data.forecast));
  }, []);

  if (!forecast) {
    return (
      <AppShell>
        <main className="flex min-h-[60vh] items-center justify-center text-muted">
          Building forecast…
        </main>
      </AppShell>
    );
  }

  const atRiskCount = forecast.rows.filter((r) => r.category === "at-risk").length;

  return (
    <AppShell atRiskCount={atRiskCount}>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <header className="mb-8">
          <h1 className="bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            Forecast
          </h1>
          <p className="mt-1 text-sm text-muted">
            Naive stage-weighted view vs. DealRadar&apos;s risk-adjusted view,
            deal by deal.
          </p>
        </header>

        <section className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Kpi label="Naive forecast" value={money(forecast.naiveWeightedTotal)} sub="stage-weighted" />
          <Kpi
            label="Risk-adjusted forecast"
            value={money(forecast.riskAdjustedTotal)}
            sub="what it's really worth"
            tone="accent"
          />
          <Kpi label="Forecast gap" value={`−${money(forecast.gap)}`} sub="overstated by naive view" tone="danger" />
          <Kpi label="Revenue at risk" value={money(forecast.revenueAtRisk)} sub={`${atRiskCount} deals`} tone="danger" />
        </section>

        <section className="mb-8 rounded-xl border border-border-line bg-surface p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
            Forecast integrity
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
        </section>

        <section className="rounded-xl border border-border-line bg-surface">
          <div className="border-b border-border-line px-5 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Per-deal breakdown — sorted by risk
            </h2>
          </div>
          <div className="hidden grid-cols-12 gap-2 border-b border-border-line px-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted md:grid">
            <div className="col-span-4">Deal</div>
            <div className="col-span-2">Stage</div>
            <div className="col-span-2 text-right">Naive weighted</div>
            <div className="col-span-1 text-right">Risk</div>
            <div className="col-span-2 text-right">Risk-adjusted</div>
            <div className="col-span-1 text-right">Category</div>
          </div>
          {forecast.rows.map((row) => (
            <div
              key={row.dealId}
              className="grid grid-cols-12 items-center gap-2 border-b border-border-line px-5 py-3 text-sm last:border-b-0"
            >
              <div className="col-span-8 md:col-span-4">
                <p className="font-medium">{row.company}</p>
                <p className="text-xs text-muted">
                  {row.name} · {money(row.value)}
                </p>
              </div>
              <div className="hidden text-xs text-muted md:col-span-2 md:block">
                {row.stage} · {Math.round(row.stageProbability * 100)}%
              </div>
              <div className="hidden text-right md:col-span-2 md:block">
                {moneyFull(row.naiveWeighted)}
              </div>
              <div className="hidden text-right font-semibold md:col-span-1 md:block">
                {row.riskScore}
              </div>
              <div className="col-span-4 text-right font-semibold text-accent md:col-span-2">
                {moneyFull(row.riskAdjusted)}
              </div>
              <div className="hidden text-right md:col-span-1 md:block">
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${categoryBadge(row.category)}`}
                >
                  {row.category}
                </span>
              </div>
            </div>
          ))}
        </section>
      </main>
    </AppShell>
  );
}
