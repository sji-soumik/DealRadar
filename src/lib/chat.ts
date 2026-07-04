import OpenAI from "openai";
import { ActionDraft, Deal, ForecastSummary, RiskAssessment } from "./types";
import { getDeals, getDrafts, protectedIdsFrom } from "./store";
import { assessAll } from "./risk";
import { buildForecast } from "./forecast";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResult {
  reply: string;
  source: "openai" | "fallback";
}

interface PipelineContext {
  deals: Deal[];
  assessments: Map<string, RiskAssessment>;
  forecast: ForecastSummary;
  drafts: ActionDraft[];
}

async function loadContext(): Promise<PipelineContext> {
  const [deals, drafts] = await Promise.all([getDeals(), getDrafts()]);
  const assessments = assessAll(deals);
  const forecast = buildForecast(deals, assessments, protectedIdsFrom(drafts));
  return { deals, assessments, forecast, drafts };
}

/** Compact, token-efficient snapshot of the pipeline for the system prompt. */
function contextBlock({ deals, assessments, forecast, drafts }: PipelineContext): string {
  const dealLines = forecast.rows.map((row) => {
    const deal = deals.find((d) => d.id === row.dealId)!;
    const a = assessments.get(row.dealId)!;
    const signals = a.signals
      .filter((s) => s.triggered)
      .map((s) => `${s.label}: ${s.reason}`)
      .join(" | ");
    const draft = drafts.find((d) => d.dealId === row.dealId);
    return [
      `- ${row.dealId} ${deal.company} — "${deal.name}", $${deal.value.toLocaleString()}, stage ${deal.stage}, owner ${deal.owner}, close ${deal.expectedCloseDate.slice(0, 10)}`,
      `  risk ${a.score}/100 (${a.category}), next step: ${deal.nextStep ?? "NONE"}`,
      signals ? `  signals: ${signals}` : `  signals: none triggered`,
      draft ? `  agent draft: [${draft.status}] ${draft.nextBestAction}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  });

  return [
    `FORECAST`,
    `- Total open pipeline: $${forecast.naiveTotal.toLocaleString()} across ${deals.length} deals`,
    `- Naive stage-weighted forecast: $${Math.round(forecast.naiveWeightedTotal).toLocaleString()}`,
    `- Risk-adjusted forecast: $${Math.round(forecast.riskAdjustedTotal).toLocaleString()}`,
    `- Forecast gap: $${Math.round(forecast.gap).toLocaleString()}`,
    `- Revenue at risk: $${forecast.revenueAtRisk.toLocaleString()}, revenue protected: $${forecast.revenueProtected.toLocaleString()}`,
    ``,
    `DEALS (sorted by risk, highest first)`,
    ...dealLines,
  ].join("\n");
}

const SYSTEM_PROMPT = `You are DealRadar's pipeline copilot, talking to a sales manager about their live pipeline.
Ground every answer in the pipeline snapshot below — never invent deals, numbers, or history.
When you flag a deal as risky, cite the specific signals and evidence from the snapshot (days stalled, quiet periods, stall language, slipped close dates).
Be concise and actionable: lead with the answer, use short paragraphs or tight bullet lists, format money like $185K.
If asked what to do, recommend concrete next steps and mention that the "Draft action & email" button can prepare the outreach.
If a question cannot be answered from the snapshot, say so briefly.`;

async function chatWithOpenAI(
  messages: ChatMessage[],
  context: PipelineContext
): Promise<ChatResult> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0.4,
    messages: [
      { role: "system", content: `${SYSTEM_PROMPT}\n\n${contextBlock(context)}` },
      ...messages.slice(-10),
    ],
  });
  const reply = completion.choices[0]?.message?.content?.trim();
  if (!reply) throw new Error("OpenAI returned an empty chat reply");
  return { reply, source: "openai" };
}

/** Deterministic fallback so the chat always answers without an API key. */
function chatWithRules(context: PipelineContext): ChatResult {
  const { forecast, assessments, deals } = context;
  const atRisk = forecast.rows.filter((r) => r.category === "at-risk");
  const lines = atRisk.slice(0, 5).map((row) => {
    const a = assessments.get(row.dealId)!;
    const top = a.signals.filter((s) => s.triggered).slice(0, 2);
    return `• ${row.company} ($${Math.round(row.value / 1000)}K, risk ${row.riskScore}/100): ${top.map((s) => s.reason).join(" ")}`;
  });
  const reply = [
    `Here's the current picture across your ${deals.length} open deals:`,
    ``,
    `Naive forecast $${Math.round(forecast.naiveWeightedTotal / 1000)}K vs. risk-adjusted $${Math.round(forecast.riskAdjustedTotal / 1000)}K — a $${Math.round(forecast.gap / 1000)}K gap. $${Math.round(forecast.revenueAtRisk / 1000)}K is sitting in ${atRisk.length} at-risk deals:`,
    ``,
    ...lines,
    ``,
    `Start with the top deal and use "Draft action & email" to prepare the re-engagement. (Set OPENAI_API_KEY for free-form answers — this is the rule-based fallback.)`,
  ].join("\n");
  return { reply, source: "fallback" };
}

export async function answerChat(messages: ChatMessage[]): Promise<ChatResult> {
  const context = await loadContext();
  if (process.env.OPENAI_API_KEY) {
    try {
      return await chatWithOpenAI(messages, context);
    } catch (err) {
      console.error("OpenAI chat failed, using fallback:", err);
    }
  }
  return chatWithRules(context);
}
