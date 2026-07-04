/**
 * DealRadar MCP server — exposes pipeline-health tools over stdio so the
 * agent can be called from Claude Desktop, Cursor, or any MCP client.
 *
 * Run with: npm run mcp
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { assessAll, assessDeal } from "../src/lib/risk";
import { buildForecast } from "../src/lib/forecast";
import { draftAction } from "../src/lib/agent";
// The store reads env lazily on first use, after loadEnvFile below has run.
import { getDeal, getDeals, protectedDealIds } from "../src/lib/store";

// tsx does not auto-load env files the way Next.js does; pick up the same
// .env.local so Supabase (and OpenAI) work here too. Missing files are fine —
// the store falls back to in-memory seed data.
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // file not present — ignore
  }
}

function json(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

const server = new McpServer({ name: "dealradar", version: "0.1.0" });

server.registerTool(
  "list_deals",
  {
    title: "List open deals",
    description:
      "List all open deals in the pipeline with company, value, stage, owner, and expected close date.",
    inputSchema: {},
  },
  async () =>
    json(
      (await getDeals()).map((d) => ({
        id: d.id,
        company: d.company,
        name: d.name,
        value: d.value,
        stage: d.stage,
        owner: d.owner,
        expectedCloseDate: d.expectedCloseDate,
        nextStep: d.nextStep,
      }))
    )
);

server.registerTool(
  "assess_pipeline",
  {
    title: "Assess pipeline health",
    description:
      "Run the risk-scoring engine over every open deal. Returns each deal's risk score (0-100), category (healthy/watch/at-risk), confidence, and the explainable signals that triggered.",
    inputSchema: {},
  },
  async () => {
    const deals = await getDeals();
    const assessments = assessAll(deals);
    return json(
      [...assessments.values()]
        .sort((a, b) => b.score - a.score)
        .map((a) => {
          const deal = deals.find((d) => d.id === a.dealId)!;
          return {
            dealId: a.dealId,
            company: deal.company,
            value: deal.value,
            score: a.score,
            category: a.category,
            confidence: a.confidence,
            triggeredSignals: a.signals
              .filter((s) => s.triggered)
              .map((s) => ({ signal: s.label, reason: s.reason })),
          };
        })
    );
  }
);

server.registerTool(
  "assess_deal",
  {
    title: "Assess a single deal",
    description:
      "Run a full risk assessment on one deal by ID. Returns the score, category, confidence, and every signal (triggered or not) with its cited reasoning.",
    inputSchema: { dealId: z.string().describe("Deal ID, e.g. D-1001") },
  },
  async ({ dealId }) => {
    const deal = await getDeal(dealId);
    if (!deal) return json({ error: `Deal ${dealId} not found` });
    return json({ deal, assessment: assessDeal(deal) });
  }
);

server.registerTool(
  "get_forecast",
  {
    title: "Get risk-adjusted forecast",
    description:
      "Compare the naive stage-weighted forecast with DealRadar's risk-adjusted forecast. Returns totals, the forecast gap, revenue at risk, and a per-deal breakdown.",
    inputSchema: {},
  },
  async () => {
    const deals = await getDeals();
    const assessments = assessAll(deals);
    return json(buildForecast(deals, assessments, await protectedDealIds()));
  }
);

server.registerTool(
  "draft_action",
  {
    title: "Draft next-best action",
    description:
      "Ask the drafting agent to propose a next-best action and a re-engagement email for a deal. Uses OpenAI when OPENAI_API_KEY is set, otherwise a deterministic rule-based drafter.",
    inputSchema: { dealId: z.string().describe("Deal ID, e.g. D-1001") },
  },
  async ({ dealId }) => {
    const deal = await getDeal(dealId);
    if (!deal) return json({ error: `Deal ${dealId} not found` });
    const assessment = assessDeal(deal);
    const draft = await draftAction(deal, assessment);
    return json({ dealId, riskScore: assessment.score, category: assessment.category, ...draft });
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("DealRadar MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal MCP server error:", err);
  process.exit(1);
});
