import { SupabaseClient } from "@supabase/supabase-js";
import { ActionDraft, AuditEntry, Deal, DraftEmail } from "./types";
import { buildSeedDeals } from "./seed";
import { getSupabase } from "./supabase";

// Data-access layer. Uses Supabase (Postgres) when NEXT_PUBLIC_SUPABASE_URL
// and a key are configured; otherwise falls back to the in-memory store so
// the demo keeps working offline. All functions are async either way.

// ---------------------------------------------------------------------------
// In-memory fallback, kept on globalThis so it survives Next.js dev hot reloads.
// ---------------------------------------------------------------------------

interface MemoryStore {
  deals: Deal[];
  drafts: ActionDraft[];
  audit: AuditEntry[];
  counter: number;
}

const globalStore = globalThis as unknown as { __dealradar?: MemoryStore };

function memory(): MemoryStore {
  if (!globalStore.__dealradar) {
    globalStore.__dealradar = { deals: buildSeedDeals(), drafts: [], audit: [], counter: 1 };
  }
  return globalStore.__dealradar;
}

// Fire-and-forget realtime broadcast so open dashboards refresh instantly
// after a mutation. Best-effort: failures never block the request.
let syncChannel: ReturnType<SupabaseClient["channel"]> | null = null;

function broadcastChange(kind: string): void {
  const supabase = getSupabase();
  if (!supabase) return;
  if (!syncChannel) syncChannel = supabase.channel("dealradar-sync");
  Promise.resolve(
    syncChannel.send({ type: "broadcast", event: "changed", payload: { kind } })
  ).catch((err) => console.error("Realtime broadcast failed:", err));
}

function nextId(prefix: string): string {
  const supabase = getSupabase();
  if (supabase) {
    // Random suffix instead of a counter — no shared counter row needed.
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
  }
  return `${prefix}-${memory().counter++}`;
}

// ---------------------------------------------------------------------------
// Row mapping (snake_case columns <-> camelCase app types)
// ---------------------------------------------------------------------------

interface DealRow {
  id: string;
  name: string;
  company: string;
  owner: string;
  value: number;
  stage: Deal["stage"];
  stage_entered_at: string;
  created_at: string;
  expected_close_date: string;
  close_date_history: string[];
  next_step: string | null;
  contacts: Deal["contacts"];
  activities: Deal["activities"];
  notes: Deal["notes"];
}

function dealFromRow(r: DealRow): Deal {
  return {
    id: r.id,
    name: r.name,
    company: r.company,
    owner: r.owner,
    value: Number(r.value),
    stage: r.stage,
    stageEnteredAt: new Date(r.stage_entered_at).toISOString(),
    createdAt: new Date(r.created_at).toISOString(),
    expectedCloseDate: new Date(r.expected_close_date).toISOString(),
    closeDateHistory: r.close_date_history ?? [],
    nextStep: r.next_step,
    contacts: r.contacts ?? [],
    activities: r.activities ?? [],
    notes: r.notes ?? [],
  };
}

function dealToRow(d: Deal): DealRow {
  return {
    id: d.id,
    name: d.name,
    company: d.company,
    owner: d.owner,
    value: d.value,
    stage: d.stage,
    stage_entered_at: d.stageEnteredAt,
    created_at: d.createdAt,
    expected_close_date: d.expectedCloseDate,
    close_date_history: d.closeDateHistory,
    next_step: d.nextStep,
    contacts: d.contacts,
    activities: d.activities,
    notes: d.notes,
  };
}

interface DraftRow {
  id: string;
  deal_id: string;
  created_at: string;
  next_best_action: string;
  email: DraftEmail;
  rationale: string;
  status: ActionDraft["status"];
  resolved_at: string | null;
  source: ActionDraft["source"];
}

function draftFromRow(r: DraftRow): ActionDraft {
  return {
    id: r.id,
    dealId: r.deal_id,
    createdAt: new Date(r.created_at).toISOString(),
    nextBestAction: r.next_best_action,
    email: r.email,
    rationale: r.rationale,
    status: r.status,
    resolvedAt: r.resolved_at ? new Date(r.resolved_at).toISOString() : null,
    source: r.source,
  };
}

interface AuditRow {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  deal_id: string | null;
  detail: string;
}

function auditFromRow(r: AuditRow): AuditEntry {
  return {
    id: r.id,
    timestamp: new Date(r.timestamp).toISOString(),
    actor: r.actor,
    action: r.action,
    dealId: r.deal_id,
    detail: r.detail,
  };
}

// ---------------------------------------------------------------------------
// Seeding — on first use with an empty Supabase `deals` table, insert the
// demo deals (dates generated relative to today so the data looks live).
// ---------------------------------------------------------------------------

let seedPromise: Promise<void> | null = null;

function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      const supabase = getSupabase()!;
      const { data, error } = await supabase.from("deals").select("id").limit(1);
      if (error) {
        const hint = error.message.includes("schema cache")
          ? " — the tables are missing; run supabase/schema.sql in the Supabase SQL editor (Dashboard → SQL Editor), then retry."
          : "";
        throw new Error(`Supabase deals query failed: ${error.message}${hint}`);
      }
      if (data.length === 0) {
        const rows = buildSeedDeals().map(dealToRow);
        const { error: insertError } = await supabase.from("deals").insert(rows);
        if (insertError) throw new Error(`Supabase seed failed: ${insertError.message}`);
      }
    })().catch((err) => {
      seedPromise = null; // allow retry on the next request
      throw err;
    });
  }
  return seedPromise;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getDeals(): Promise<Deal[]> {
  const supabase = getSupabase();
  if (!supabase) return memory().deals;
  await ensureSeeded();
  const { data, error } = await supabase.from("deals").select("*").order("id");
  if (error) throw new Error(`Supabase getDeals failed: ${error.message}`);
  return (data as DealRow[]).map(dealFromRow);
}

export async function getDeal(dealId: string): Promise<Deal | undefined> {
  const supabase = getSupabase();
  if (!supabase) return memory().deals.find((d) => d.id === dealId);
  await ensureSeeded();
  const { data, error } = await supabase
    .from("deals")
    .select("*")
    .eq("id", dealId)
    .maybeSingle();
  if (error) throw new Error(`Supabase getDeal failed: ${error.message}`);
  return data ? dealFromRow(data as DealRow) : undefined;
}

export async function getDrafts(): Promise<ActionDraft[]> {
  const supabase = getSupabase();
  if (!supabase) return memory().drafts;
  const { data, error } = await supabase
    .from("action_drafts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Supabase getDrafts failed: ${error.message}`);
  return (data as DraftRow[]).map(draftFromRow);
}

export async function getDraft(draftId: string): Promise<ActionDraft | undefined> {
  const supabase = getSupabase();
  if (!supabase) return memory().drafts.find((d) => d.id === draftId);
  const { data, error } = await supabase
    .from("action_drafts")
    .select("*")
    .eq("id", draftId)
    .maybeSingle();
  if (error) throw new Error(`Supabase getDraft failed: ${error.message}`);
  return data ? draftFromRow(data as DraftRow) : undefined;
}

export async function createDraft(draft: Omit<ActionDraft, "id">): Promise<ActionDraft> {
  const full: ActionDraft = { ...draft, id: nextId("ACT") };
  const supabase = getSupabase();
  if (!supabase) {
    memory().drafts.unshift(full);
    return full;
  }
  const { error } = await supabase.from("action_drafts").insert({
    id: full.id,
    deal_id: full.dealId,
    created_at: full.createdAt,
    next_best_action: full.nextBestAction,
    email: full.email,
    rationale: full.rationale,
    status: full.status,
    resolved_at: full.resolvedAt,
    source: full.source,
  });
  if (error) throw new Error(`Supabase createDraft failed: ${error.message}`);
  broadcastChange("draft_created");
  return full;
}

export async function resolveDraft(
  draftId: string,
  status: "approved" | "edited" | "dismissed",
  email?: DraftEmail
): Promise<ActionDraft | undefined> {
  const resolvedAt = new Date().toISOString();
  const supabase = getSupabase();
  if (!supabase) {
    const draft = memory().drafts.find((d) => d.id === draftId);
    if (!draft) return undefined;
    draft.status = status;
    draft.resolvedAt = resolvedAt;
    if (email) draft.email = email;
    return draft;
  }
  const patch: Partial<DraftRow> = { status, resolved_at: resolvedAt };
  if (email) patch.email = email;
  const { data, error } = await supabase
    .from("action_drafts")
    .update(patch)
    .eq("id", draftId)
    .select()
    .maybeSingle();
  if (error) throw new Error(`Supabase resolveDraft failed: ${error.message}`);
  broadcastChange("draft_resolved");
  return data ? draftFromRow(data as DraftRow) : undefined;
}

export async function logAudit(
  entry: Omit<AuditEntry, "id" | "timestamp">
): Promise<AuditEntry> {
  const full: AuditEntry = {
    ...entry,
    id: nextId("A"),
    timestamp: new Date().toISOString(),
  };
  const supabase = getSupabase();
  if (!supabase) {
    memory().audit.unshift(full);
    return full;
  }
  const { error } = await supabase.from("audit_log").insert({
    id: full.id,
    timestamp: full.timestamp,
    actor: full.actor,
    action: full.action,
    deal_id: full.dealId,
    detail: full.detail,
  });
  if (error) throw new Error(`Supabase logAudit failed: ${error.message}`);
  broadcastChange("audit_logged");
  return full;
}

export async function getAudit(limit = 50): Promise<AuditEntry[]> {
  const supabase = getSupabase();
  if (!supabase) return memory().audit.slice(0, limit);
  const { data, error } = await supabase
    .from("audit_log")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Supabase getAudit failed: ${error.message}`);
  return (data as AuditRow[]).map(auditFromRow);
}

/** Deal IDs whose at-risk state has an approved or edited action (counted as "protected"). */
export function protectedIdsFrom(drafts: ActionDraft[]): Set<string> {
  return new Set(
    drafts
      .filter((d) => d.status === "approved" || d.status === "edited")
      .map((d) => d.dealId)
  );
}

export async function protectedDealIds(): Promise<Set<string>> {
  return protectedIdsFrom(await getDrafts());
}
