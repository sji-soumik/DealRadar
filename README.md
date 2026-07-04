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

The sidebar navigates between four pages:

| Page | Route | What's there |
| --- | --- | --- |
| Dashboard | `/` | KPIs, forecast bars, risk-sorted pipeline table, audit log |
| Pipeline Copilot | `/copilot` | chat with your pipeline, grounded in the live scan |
| Forecast | `/forecast` | naive vs. risk-adjusted KPIs + per-deal breakdown |
| Audit log | `/audit` | full audit trail, live-updating |

Optional — enable LLM drafting (otherwise a deterministic rule-based drafter is
used, so the demo always works offline):

```bash
cp .env.example .env.local
# set OPENAI_API_KEY=sk-...
```

Optional — enable persistence with Supabase (otherwise an in-memory store is
used and data resets on restart):

1. Create a free project at [supabase.com](https://supabase.com).
2. Run `supabase/schema.sql` in the SQL editor (Dashboard → SQL Editor).
3. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
   `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.

The 12 demo deals are seeded automatically on first run. Deals, action drafts,
and the audit log then survive restarts, and the MCP server reads/writes the
same database as the dashboard.

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

### 4. Pipeline copilot (`src/lib/chat.ts`)

A full-page "Ask your pipeline" chat at `/copilot` (Pipeline Copilot in the
sidebar). Questions like *"Which deals are at risk and why?"* are answered by
an LLM grounded in the live scan — same risk engine, same cited evidence,
never invented numbers. Uses OpenAI with a deterministic rule-based fallback,
like the drafting agent.

### 5. Live updates (Supabase Realtime)

Every mutation (draft created, decision made) broadcasts on a realtime channel;
every open dashboard and audit page refreshes instantly — approve a draft in
one window and watch "Revenue protected" jump in another.

### 6. MCP server (`mcp/server.ts`)

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

## Demo script (~3 minutes)

Full narrated script in [DEMO_SCRIPT.md](DEMO_SCRIPT.md). The short version:

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
5. Open **Pipeline Copilot** in the sidebar and ask *"Which deals are at risk
   and why?"* — grounded answers with the same cited evidence.
6. Show **Forecast** and **Audit log** pages from the sidebar — the audit page
   updates live as decisions are made in another window.
7. Ask Claude/Cursor (via MCP): *"Which of my deals are at risk and why?"* —
   same engine, same cited reasons, in chat.

## Architecture

```
src/lib/seed.ts       deterministic mock CRM data (dates relative to today)
src/lib/risk.ts       explainable risk-scoring engine
src/lib/forecast.ts   naive vs. risk-adjusted forecast
src/lib/agent.ts      OpenAI drafting agent + rule-based fallback
src/lib/chat.ts       pipeline copilot: LLM grounded in the live scan + fallback
src/lib/store.ts      data layer: Supabase (Postgres) or in-memory fallback
src/lib/supabase.ts   Supabase server client (null when env vars are missing)
src/lib/supabase-browser.ts  browser client for realtime dashboard sync
supabase/schema.sql   Postgres schema (deals, action_drafts, audit_log)
src/app/api/*         REST endpoints (pipeline, chat, draft, approve/edit/dismiss)
src/app/page.tsx      dashboard UI (Next.js App Router + Tailwind)
src/app/copilot/      full-page pipeline copilot chat
src/app/forecast/     forecast page (KPIs + per-deal breakdown)
src/app/audit/        audit-trail page (live-updating)
mcp/server.ts         MCP server over stdio (shares the same store)
```

Stack: Next.js 16, React 19, TypeScript, Tailwind CSS v4, Supabase, OpenAI SDK,
`@modelcontextprotocol/sdk`.
