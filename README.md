# DealRadar — Autonomous Pipeline-Health & Forecast Agent

DealRadar inspects every open deal in the pipeline, scores slippage risk from
**explainable signals**, drafts the next-best action and re-engagement email for
at-risk deals (human-approved, fully audited), and shows a **risk-adjusted
forecast** next to the naive pipeline sum. It also ships as an **MCP server**
callable from Claude Desktop or Cursor.

## Quick start

```bash
npm install
npm run dev        # dashboard at http://localhost:3000
```

Optional — enable LLM drafting (otherwise a deterministic rule-based drafter is
used, so the demo always works offline):

```bash
cp .env.example .env.local
# set OPENAI_API_KEY=sk-...
```

## What it does

### 1. Risk scoring engine (`src/lib/risk.ts`)

Every open deal is scored 0–100 from six explainable signals, each with a
cited, human-readable reason:

| Signal | Example reason |
| --- | --- |
| Stalled in stage | "48 days in Negotiation vs. an 18-day benchmark (267%)" |
| Gone quiet | "No activity in 24 days; last touch was 'Follow-up email; no reply.'" |
| No next step | "No next step is recorded — no agreed path forward" |
| Single-threaded | "Only 1 contact (Gary Holt) — the deal depends on one person" |
| Stall language | "Notes contain: 'next quarter', 'budget review', 'gone quiet'" |
| Slipping close date | "Close date passed 6 days ago and was never updated" |

Score ⇒ category (`healthy` / `watch` / `at-risk`) plus a confidence value that
grows with the amount of evidence (activities + notes) on the deal.

### 2. Action-drafting agent (`src/lib/agent.ts`)

For any flagged deal, a second agent drafts a concrete next-best action, a
rationale tied to the triggered signals, and a re-engagement email. Uses OpenAI
(`OPENAI_API_KEY`) with a rule-based fallback. The manager **approves, edits, or
dismisses** every draft — nothing is sent autonomously, and every decision is
written to the audit log.

### 3. Forecast engine (`src/lib/forecast.ts`)

- **Naive forecast** = Σ deal value × stage probability
- **Risk-adjusted forecast** = naive × (1 − risk score/100) per deal
- The dashboard shows both, the **forecast gap**, **revenue at risk**,
  **revenue protected** (at-risk deals with an approved action), and
  **hours saved** vs. manual weekly deal review.

### 4. MCP server (`mcp/server.ts`)

```bash
npm run mcp
```

Exposes `list_deals`, `assess_pipeline`, `assess_deal`, `get_forecast`, and
`draft_action` over stdio. Example client config (Claude Desktop / Cursor):

```json
{
  "mcpServers": {
    "dealradar": {
      "command": "npx",
      "args": ["tsx", "mcp/server.ts"],
      "cwd": "/path/to/DealRader"
    }
  }
}
```

## Demo script (2 minutes)

1. Open the dashboard — 12 open deals scanned, headline KPIs show the naive
   forecast (**$598K**) vs. the risk-adjusted forecast (**$307K**): a **$290K
   gap** leadership would otherwise never see.
2. The pipeline table is sorted by risk. Expand **Northwind Logistics** — six
   triggered signals, each with cited evidence from the deal's own notes and
   activity history.
3. Click **Draft action & email** — the agent proposes a next-best action, a
   rationale, and a ready-to-send re-engagement email.
4. **Approve** it — the audit log records both the agent draft and the manager
   decision, and **Revenue protected** jumps to $185K.
5. Ask Claude/Cursor (via MCP): *"Which of my deals are at risk and why?"* —
   same engine, same cited reasons, in chat.

## Architecture

```
src/lib/seed.ts       deterministic mock CRM data (dates relative to today)
src/lib/risk.ts       explainable risk-scoring engine
src/lib/forecast.ts   naive vs. risk-adjusted forecast
src/lib/agent.ts      OpenAI drafting agent + rule-based fallback
src/lib/store.ts      in-memory store + audit log
src/app/api/*         REST endpoints (pipeline, draft, approve/edit/dismiss)
src/app/page.tsx      dashboard UI (Next.js App Router + Tailwind)
mcp/server.ts         MCP server over stdio
```

Stack: Next.js 16, React 19, TypeScript, Tailwind CSS v4, OpenAI SDK,
`@modelcontextprotocol/sdk`.
