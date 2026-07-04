import { NextResponse } from "next/server";
import { getStore, logAudit } from "@/lib/store";
import { DraftEmail } from "@/lib/types";

export const dynamic = "force-dynamic";

interface ResolveBody {
  decision: "approved" | "edited" | "dismissed";
  email?: DraftEmail;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const store = getStore();
  const draft = store.drafts.find((d) => d.id === id);
  if (!draft) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }
  if (draft.status !== "pending") {
    return NextResponse.json({ error: "Draft already resolved" }, { status: 409 });
  }

  const body = (await req.json()) as ResolveBody;
  if (!["approved", "edited", "dismissed"].includes(body.decision)) {
    return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
  }

  draft.status = body.decision;
  draft.resolvedAt = new Date().toISOString();
  if (body.decision === "edited" && body.email) {
    draft.email = body.email;
  }

  const deal = store.deals.find((d) => d.id === draft.dealId);
  logAudit({
    actor: "Manager",
    action: `draft_${body.decision}`,
    dealId: draft.dealId,
    detail: `${body.decision === "dismissed" ? "Dismissed" : body.decision === "edited" ? "Edited and approved" : "Approved"} agent action for ${deal?.company ?? draft.dealId}: "${draft.nextBestAction}"`,
  });

  return NextResponse.json({ draft });
}
