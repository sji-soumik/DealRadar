import { NextResponse } from "next/server";
import { getDeal, getStore, logAudit, nextId } from "@/lib/store";
import { assessDeal } from "@/lib/risk";
import { draftAction } from "@/lib/agent";
import { ActionDraft } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deal = getDeal(id);
  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  const assessment = assessDeal(deal);
  const result = await draftAction(deal, assessment);

  const store = getStore();
  const draft: ActionDraft = {
    id: nextId("ACT"),
    dealId: deal.id,
    createdAt: new Date().toISOString(),
    nextBestAction: result.nextBestAction,
    email: result.email,
    rationale: result.rationale,
    status: "pending",
    resolvedAt: null,
    source: result.source,
  };
  store.drafts.unshift(draft);

  logAudit({
    actor: "DealRadar Agent",
    action: "draft_created",
    dealId: deal.id,
    detail: `Drafted next-best action for ${deal.company} (risk ${assessment.score}/100, source: ${result.source}).`,
  });

  return NextResponse.json({ draft, assessment });
}
