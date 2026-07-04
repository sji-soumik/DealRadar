import { ActionDraft, AuditEntry, Deal } from "./types";
import { buildSeedDeals } from "./seed";

// In-memory store, kept on globalThis so it survives Next.js dev hot reloads.
interface Store {
  deals: Deal[];
  drafts: ActionDraft[];
  audit: AuditEntry[];
  counter: number;
}

const globalStore = globalThis as unknown as { __dealradar?: Store };

function init(): Store {
  return { deals: buildSeedDeals(), drafts: [], audit: [], counter: 1 };
}

export function getStore(): Store {
  if (!globalStore.__dealradar) globalStore.__dealradar = init();
  return globalStore.__dealradar;
}

export function nextId(prefix: string): string {
  const store = getStore();
  return `${prefix}-${store.counter++}`;
}

export function logAudit(entry: Omit<AuditEntry, "id" | "timestamp">): AuditEntry {
  const store = getStore();
  const full: AuditEntry = {
    ...entry,
    id: nextId("A"),
    timestamp: new Date().toISOString(),
  };
  store.audit.unshift(full);
  return full;
}

export function getDeal(dealId: string): Deal | undefined {
  return getStore().deals.find((d) => d.id === dealId);
}

/** Deal IDs whose at-risk state has an approved or edited action (counted as "protected"). */
export function protectedDealIds(): Set<string> {
  const store = getStore();
  return new Set(
    store.drafts
      .filter((d) => d.status === "approved" || d.status === "edited")
      .map((d) => d.dealId)
  );
}
