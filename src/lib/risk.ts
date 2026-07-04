import { Deal, RiskAssessment, RiskCategory, RiskSignal, Stage } from "./types";

// Benchmark: expected days a healthy deal spends in each stage.
export const STAGE_BENCHMARK_DAYS: Record<Stage, number> = {
  Prospecting: 14,
  Qualification: 21,
  Proposal: 21,
  Negotiation: 18,
  Closing: 10,
};

// Phrases in notes/activities that historically correlate with stalls.
const STALL_PHRASES = [
  "circle back",
  "next quarter",
  "no budget",
  "budget review",
  "on hold",
  "postpone",
  "pushed to",
  "gone quiet",
  "no reply",
  "still evaluating",
  "re-org",
  "reorg",
  "timing isn't great",
  "timing is not great",
  "on leave",
];

function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / 86_400_000);
}

export function daysInStage(deal: Deal, now = new Date()): number {
  return daysBetween(now, new Date(deal.stageEnteredAt));
}

export function daysSinceLastActivity(deal: Deal, now = new Date()): number | null {
  if (deal.activities.length === 0) return null;
  const latest = deal.activities
    .map((a) => new Date(a.date).getTime())
    .reduce((m, t) => Math.max(m, t), 0);
  return daysBetween(now, new Date(latest));
}

export function assessDeal(deal: Deal, now = new Date()): RiskAssessment {
  const signals: RiskSignal[] = [];

  // Signal 1: days in stage vs benchmark
  const inStage = daysInStage(deal, now);
  const benchmark = STAGE_BENCHMARK_DAYS[deal.stage];
  const stageOverrun = inStage / benchmark;
  signals.push({
    id: "stage-overrun",
    label: "Stalled in stage",
    triggered: stageOverrun > 1.25,
    weight: stageOverrun > 2 ? 25 : 15,
    reason:
      stageOverrun > 1.25
        ? `${inStage} days in ${deal.stage} vs. a ${benchmark}-day benchmark (${Math.round(stageOverrun * 100)}% of expected).`
        : `${inStage} days in ${deal.stage} is within the ${benchmark}-day benchmark.`,
  });

  // Signal 2: time since last activity
  const silentDays = daysSinceLastActivity(deal, now);
  const silent = silentDays === null ? 999 : silentDays;
  signals.push({
    id: "no-activity",
    label: "Gone quiet",
    triggered: silent > 10,
    weight: silent > 21 ? 25 : 15,
    reason:
      silentDays === null
        ? "No activity has ever been logged on this deal."
        : silent > 10
          ? `No activity in ${silent} days; last touch was "${deal.activities[0].summary}"`
          : `Last activity ${silent} day(s) ago — engagement is current.`,
  });

  // Signal 3: missing next step
  const noNextStep = !deal.nextStep || deal.nextStep.trim() === "";
  signals.push({
    id: "no-next-step",
    label: "No next step",
    triggered: noNextStep,
    weight: 20,
    reason: noNextStep
      ? "No next step is recorded — the deal has no agreed path forward."
      : `Next step on file: "${deal.nextStep}".`,
  });

  // Signal 4: single-threading
  const singleThreaded = deal.contacts.length <= 1;
  signals.push({
    id: "single-threaded",
    label: "Single-threaded",
    triggered: singleThreaded,
    weight: 15,
    reason: singleThreaded
      ? `Only ${deal.contacts.length} contact (${deal.contacts[0]?.name ?? "none"}) — the deal depends on one person.`
      : `${deal.contacts.length} contacts engaged (${deal.contacts.map((c) => c.name).join(", ")}).`,
  });

  // Signal 5: stall language in recent notes/activities
  const recentTexts = [
    ...deal.notes.map((n) => n.text),
    ...deal.activities.map((a) => a.summary),
  ];
  const hits = new Set<string>();
  for (const text of recentTexts) {
    const lower = text.toLowerCase();
    for (const phrase of STALL_PHRASES) {
      if (lower.includes(phrase)) hits.add(phrase);
    }
  }
  const stallHits = [...hits];
  signals.push({
    id: "stall-language",
    label: "Stall language in notes",
    triggered: stallHits.length > 0,
    weight: stallHits.length > 1 ? 20 : 12,
    reason:
      stallHits.length > 0
        ? `Notes contain stall language: ${stallHits.map((h) => `"${h}"`).join(", ")}.`
        : "No stall language detected in recent notes.",
  });

  // Signal 6: slipping close date
  const slipped = deal.closeDateHistory.length;
  const closeDate = new Date(deal.expectedCloseDate);
  const pastDue = daysBetween(now, closeDate) > 0;
  const slipTriggered = slipped > 0 || pastDue;
  signals.push({
    id: "close-slip",
    label: "Slipping close date",
    triggered: slipTriggered,
    weight: slipped >= 2 || pastDue ? 20 : 10,
    reason: slipTriggered
      ? pastDue
        ? `Expected close date passed ${daysBetween(now, closeDate)} day(s) ago and was never updated${slipped > 0 ? `, after slipping ${slipped} time(s) already` : ""}.`
        : `Close date has slipped ${slipped} time(s).`
      : "Close date has held steady.",
  });

  const rawScore = signals.filter((s) => s.triggered).reduce((sum, s) => sum + s.weight, 0);
  const score = Math.min(100, rawScore);
  const category: RiskCategory = score >= 55 ? "at-risk" : score >= 25 ? "watch" : "healthy";

  // Confidence grows with the amount of evidence available on the deal.
  const evidenceCount = deal.activities.length + deal.notes.length;
  const confidence = Math.round(Math.min(0.95, 0.5 + evidenceCount * 0.06) * 100) / 100;

  return {
    dealId: deal.id,
    score,
    category,
    confidence,
    signals,
    assessedAt: now.toISOString(),
  };
}

export function assessAll(deals: Deal[], now = new Date()): Map<string, RiskAssessment> {
  const map = new Map<string, RiskAssessment>();
  for (const deal of deals) map.set(deal.id, assessDeal(deal, now));
  return map;
}
