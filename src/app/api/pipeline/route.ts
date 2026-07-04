import { NextResponse } from "next/server";
import { getStore, protectedDealIds } from "@/lib/store";
import { assessAll } from "@/lib/risk";
import { buildForecast } from "@/lib/forecast";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore();
  const assessments = assessAll(store.deals);
  const forecast = buildForecast(store.deals, assessments, protectedDealIds());

  return NextResponse.json({
    deals: store.deals,
    assessments: Object.fromEntries(assessments),
    forecast,
    drafts: store.drafts,
    audit: store.audit.slice(0, 50),
  });
}
