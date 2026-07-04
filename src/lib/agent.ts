import OpenAI from "openai";
import { Deal, DraftEmail, RiskAssessment } from "./types";

export interface AgentDraftResult {
  nextBestAction: string;
  email: DraftEmail;
  rationale: string;
  source: "openai" | "fallback";
}

function buildPrompt(deal: Deal, assessment: RiskAssessment): string {
  const triggered = assessment.signals.filter((s) => s.triggered);
  return [
    `You are DealRadar, an AI sales assistant. A deal has been flagged as ${assessment.category} (risk score ${assessment.score}/100).`,
    ``,
    `DEAL`,
    `- ${deal.name} at ${deal.company}, value $${deal.value.toLocaleString()}, stage ${deal.stage}, owner ${deal.owner}`,
    `- Contacts: ${deal.contacts.map((c) => `${c.name} (${c.title})`).join("; ")}`,
    `- Next step on file: ${deal.nextStep ?? "NONE"}`,
    ``,
    `RISK SIGNALS`,
    ...triggered.map((s) => `- ${s.label}: ${s.reason}`),
    ``,
    `RECENT NOTES`,
    ...deal.notes.slice(0, 3).map((n) => `- ${n.text}`),
    ``,
    `RECENT ACTIVITY`,
    ...deal.activities.slice(0, 4).map((a) => `- [${a.type}] ${a.summary}`),
    ``,
    `Respond with JSON matching exactly this shape:`,
    `{"nextBestAction": "<one concrete action the rep should take this week, one sentence>",`,
    ` "rationale": "<why this action addresses the specific risk signals, 1-2 sentences>",`,
    ` "email": {"subject": "<re-engagement email subject>", "body": "<short, specific re-engagement email to the primary contact, first name greeting, max 120 words, no placeholders except [Your Name]>"}}`,
  ].join("\n");
}

async function draftWithOpenAI(deal: Deal, assessment: RiskAssessment): Promise<AgentDraftResult> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    messages: [{ role: "user", content: buildPrompt(deal, assessment) }],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });
  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as {
    nextBestAction?: string;
    rationale?: string;
    email?: { subject?: string; body?: string };
  };
  if (!parsed.nextBestAction || !parsed.email?.subject || !parsed.email?.body) {
    throw new Error("OpenAI response missing required fields");
  }
  return {
    nextBestAction: parsed.nextBestAction,
    rationale: parsed.rationale ?? "",
    email: { subject: parsed.email.subject, body: parsed.email.body },
    source: "openai",
  };
}

/** Deterministic fallback so the demo never breaks without an API key. */
function draftWithRules(deal: Deal, assessment: RiskAssessment): AgentDraftResult {
  const contact = deal.contacts[0];
  const firstName = contact ? contact.name.split(" ")[0] : "there";
  const triggered = assessment.signals.filter((s) => s.triggered).map((s) => s.id);

  let action: string;
  let rationale: string;
  if (triggered.includes("no-activity") || triggered.includes("stall-language")) {
    action = `Call ${contact?.name ?? "the primary contact"} this week with a new piece of value (relevant case study or ROI summary) and propose a specific 20-minute slot to restart the conversation.`;
    rationale = "The deal has gone quiet and notes show stall language; a value-led touch with a concrete meeting ask is the fastest way to test whether it is alive.";
  } else if (triggered.includes("no-next-step")) {
    action = `Book a working session with ${contact?.name ?? "the buyer"} to agree a mutual close plan with dated next steps.`;
    rationale = "There is no agreed next step, so the deal has no forward path; a mutual action plan re-establishes momentum and surfaces real intent.";
  } else if (triggered.includes("single-threaded")) {
    action = `Ask ${contact?.name ?? "your champion"} for an intro to the economic buyer and one more stakeholder, framed as de-risking their internal approval.`;
    rationale = "The deal depends on a single contact; multi-threading protects it against vacations, re-orgs, and silent vetoes.";
  } else {
    action = `Confirm the close plan and validate the ${new Date(deal.expectedCloseDate).toLocaleDateString()} close date with ${contact?.name ?? "the buyer"}.`;
    rationale = "The close date has slipped before; re-validating it now keeps the forecast honest and surfaces blockers early.";
  }

  const email: DraftEmail = {
    subject: `Quick next step on ${deal.name}?`,
    body: `Hi ${firstName},

I wanted to pick our conversation on ${deal.name} back up. I know priorities shift, so I pulled together a short summary of the value case we discussed — happy to send it over.

Would a 20-minute call this week work to align on next steps? If the timing has changed on your side, just let me know what would be more realistic and I'll work around it.

Best,
[Your Name]`,
  };

  return { nextBestAction: action, rationale, email, source: "fallback" };
}

export async function draftAction(deal: Deal, assessment: RiskAssessment): Promise<AgentDraftResult> {
  if (process.env.OPENAI_API_KEY) {
    try {
      return await draftWithOpenAI(deal, assessment);
    } catch (err) {
      console.error("OpenAI drafting failed, using fallback:", err);
    }
  }
  return draftWithRules(deal, assessment);
}
