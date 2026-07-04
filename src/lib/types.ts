export type Stage =
  | "Prospecting"
  | "Qualification"
  | "Proposal"
  | "Negotiation"
  | "Closing";

export const STAGES: Stage[] = [
  "Prospecting",
  "Qualification",
  "Proposal",
  "Negotiation",
  "Closing",
];

export interface Contact {
  name: string;
  title: string;
  email: string;
}

export type ActivityType = "email" | "call" | "meeting" | "demo" | "note";

export interface Activity {
  type: ActivityType;
  date: string; // ISO
  summary: string;
}

export interface Note {
  date: string; // ISO
  text: string;
}

export interface Deal {
  id: string;
  name: string;
  company: string;
  owner: string;
  value: number;
  stage: Stage;
  stageEnteredAt: string; // ISO
  createdAt: string; // ISO
  expectedCloseDate: string; // ISO
  closeDateHistory: string[]; // previous expected close dates (slips)
  nextStep: string | null;
  contacts: Contact[];
  activities: Activity[];
  notes: Note[];
}

export type RiskCategory = "healthy" | "watch" | "at-risk";

export interface RiskSignal {
  id: string;
  label: string;
  triggered: boolean;
  weight: number; // contribution to score when triggered
  reason: string; // human-readable explanation with cited evidence
}

export interface RiskAssessment {
  dealId: string;
  score: number; // 0-100
  category: RiskCategory;
  confidence: number; // 0-1
  signals: RiskSignal[];
  assessedAt: string;
}

export interface DraftEmail {
  subject: string;
  body: string;
}

export type ActionStatus = "pending" | "approved" | "edited" | "dismissed";

export interface ActionDraft {
  id: string;
  dealId: string;
  createdAt: string;
  nextBestAction: string;
  email: DraftEmail;
  rationale: string;
  status: ActionStatus;
  resolvedAt: string | null;
  source: "openai" | "fallback";
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  dealId: string | null;
  detail: string;
}

export interface ChatMessageRecord {
  id: string;
  sessionId: string;
  createdAt: string;
  role: "user" | "assistant";
  content: string;
  source: "openai" | "fallback" | null; // null for user messages
}

export interface ForecastRow {
  dealId: string;
  company: string;
  name: string;
  value: number;
  stage: Stage;
  stageProbability: number;
  naiveWeighted: number;
  riskScore: number;
  riskAdjusted: number;
  category: RiskCategory;
}

export interface ForecastSummary {
  naiveTotal: number; // sum of open deal values
  naiveWeightedTotal: number; // stage-probability weighted
  riskAdjustedTotal: number;
  gap: number; // naiveWeightedTotal - riskAdjustedTotal
  revenueAtRisk: number; // total value of at-risk deals
  revenueProtected: number; // value of at-risk deals with an approved action
  hoursSaved: number;
  rows: ForecastRow[];
}
