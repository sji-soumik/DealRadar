import { NextResponse } from "next/server";
import { getAudit, getDeals, getDrafts, protectedIdsFrom } from "@/lib/store";
import { assessAll } from "@/lib/risk";
import { buildForecast } from "@/lib/forecast";

export const dynamic = "force-dynamic";

export async function GET() {
  const [deals, drafts, audit] = await Promise.all([
    getDeals(),
    getDrafts(),
    getAudit(50),
  ]);
  const assessments = assessAll(deals);
  const forecast = buildForecast(deals, assessments, protectedIdsFrom(drafts));

  return NextResponse.json({
    deals,
    assessments: Object.fromEntries(assessments),
    forecast,
    drafts,
    audit,
  });
}
