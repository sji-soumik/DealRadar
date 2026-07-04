import { NextResponse } from "next/server";
import { createDraft, getDeal, logAudit } from "@/lib/store";
import { assessDeal } from "@/lib/risk";
import { draftAction } from "@/lib/agent";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deal = await getDeal(id);
  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  const assessment = assessDeal(deal);
  const result = await draftAction(deal, assessment);

  const draft = await createDraft({
    dealId: deal.id,
    createdAt: new Date().toISOString(),
    nextBestAction: result.nextBestAction,
    email: result.email,
    rationale: result.rationale,
    status: "pending",
    resolvedAt: null,
    source: result.source,
  });

  await logAudit({
    actor: "DealRadar Agent",
    action: "draft_created",
    dealId: deal.id,
    detail: `Drafted next-best action for ${deal.company} (risk ${assessment.score}/100, source: ${result.source}).`,
  });

  return NextResponse.json({ draft, assessment });
}
