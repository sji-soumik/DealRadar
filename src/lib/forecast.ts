import { Deal, ForecastRow, ForecastSummary, RiskAssessment, Stage } from "./types";

// Standard stage win probabilities used for the naive weighted forecast.
export const STAGE_PROBABILITY: Record<Stage, number> = {
  Prospecting: 0.1,
  Qualification: 0.25,
  Proposal: 0.5,
  Negotiation: 0.75,
  Closing: 0.9,
};

// Minutes a rep would spend manually reviewing one deal per week.
const MINUTES_PER_DEAL_REVIEW = 15;

export function buildForecast(
  deals: Deal[],
  assessments: Map<string, RiskAssessment>,
  protectedDealIds: Set<string>
): ForecastSummary {
  const rows: ForecastRow[] = deals.map((deal) => {
    const assessment = assessments.get(deal.id)!;
    const stageProbability = STAGE_PROBABILITY[deal.stage];
    const naiveWeighted = deal.value * stageProbability;
    // Risk discount: an at-risk deal's stage probability is haircut by its risk score.
    const riskFactor = 1 - assessment.score / 100;
    const riskAdjusted = naiveWeighted * riskFactor;
    return {
      dealId: deal.id,
      company: deal.company,
      name: deal.name,
      value: deal.value,
      stage: deal.stage,
      stageProbability,
      naiveWeighted: Math.round(naiveWeighted),
      riskScore: assessment.score,
      riskAdjusted: Math.round(riskAdjusted),
      category: assessment.category,
    };
  });

  const naiveTotal = rows.reduce((s, r) => s + r.value, 0);
  const naiveWeightedTotal = rows.reduce((s, r) => s + r.naiveWeighted, 0);
  const riskAdjustedTotal = rows.reduce((s, r) => s + r.riskAdjusted, 0);
  const atRiskRows = rows.filter((r) => r.category === "at-risk");
  const revenueAtRisk = atRiskRows.reduce((s, r) => s + r.value, 0);
  const revenueProtected = atRiskRows
    .filter((r) => protectedDealIds.has(r.dealId))
    .reduce((s, r) => s + r.value, 0);
  const hoursSaved = Math.round(((deals.length * MINUTES_PER_DEAL_REVIEW) / 60) * 10) / 10;

  return {
    naiveTotal,
    naiveWeightedTotal: Math.round(naiveWeightedTotal),
    riskAdjustedTotal: Math.round(riskAdjustedTotal),
    gap: Math.round(naiveWeightedTotal - riskAdjustedTotal),
    revenueAtRisk,
    revenueProtected,
    hoursSaved,
    rows: rows.sort((a, b) => b.riskScore - a.riskScore),
  };
}
