# DealRadar — Demo Video Script (~2.5 minutes)

> Before recording: run `npm run dev`, open http://localhost:3000, and click
> "Rescan pipeline" once so the page is fresh. Keep the browser full-screen.

---

## Scene 1 — The problem (0:00–0:25)

**On screen:** dashboard homepage, don't scroll yet.

**Say:**

"Sales teams live and die by their pipeline — but only about 45% of sales
organizations report accurate forecasts. Not because anyone is lying, but
because nobody has time to inspect every open deal every week. At-risk deals
sit unnoticed until they're lost, and leadership makes decisions on numbers
that quietly aren't real.

This is DealRadar — an autonomous pipeline-health and forecast-integrity
agent. It just scanned all 12 open deals in this pipeline, automatically."

## Scene 2 — The forecast gap (0:25–0:50)

**On screen:** point at the KPI cards, then the two forecast bars.

**Say:**

"Here's the headline. The naive, stage-weighted forecast says this pipeline is
worth about $598,000. But DealRadar discounts every deal by its actual
slippage risk — and the risk-adjusted forecast is only $307,000.

That's a $290,000 gap that would normally surface as a missed quarter.
DealRadar shows it today, while there's still time to act. It also flags
$585,000 of revenue sitting in at-risk deals."

## Scene 3 — Explainable risk scoring (0:50–1:30)

**On screen:** scroll to the pipeline table, click the top row
(Northwind Logistics) to expand it.

**Say:**

"The pipeline is sorted by risk, and every score is fully explainable — no
black box. Take Northwind Logistics: $185,000, sitting in Negotiation.
DealRadar found six triggered signals, each with cited evidence from the
deal's own history:

It's been 48 days in Negotiation against an 18-day benchmark. No activity in
over three weeks — the last touch was a follow-up email with no reply. There's
no next step on file. The deal is single-threaded through one contact, Gary.
The notes literally contain stall language — 'budget review pushed to next
quarter'. And the close date has already slipped twice.

A rep would need to read every note to catch this. DealRadar does it for the
entire pipeline in seconds."

## Scene 4 — The action agent + human approval (1:30–2:05)

**On screen:** click **"Draft action & email"**, wait for the draft card,
then click **Approve**. Scroll briefly to the audit log at the bottom.

**Say:**

"Finding the risk is only half the job. A second agent drafts the response:
a concrete next-best action — call Gary this week with new value and propose
a specific meeting slot — plus a ready-to-send re-engagement email.

Nothing is sent autonomously. The manager approves, edits, or dismisses every
draft, and every decision — the agent's and the human's — is written to an
audit log.

The moment I approve, 'Revenue protected' jumps to $185,000, and the
dashboard tracks the hours of manual deal review this replaces every week."

## Scene 5 — MCP integration + close (2:05–2:30)

**On screen:** either show `mcp/server.ts` in the editor, or a terminal
running `npm run mcp`, or Claude/Cursor calling `assess_pipeline`.

**Say:**

"And DealRadar isn't locked inside this dashboard. It ships as an MCP server,
so you can ask Claude or Cursor directly: 'Which of my deals are at risk and
why?' — same engine, same cited reasons, right in chat.

Explainable risk scoring, human-approved agent actions, and a forecast you can
actually trust. That's DealRadar."

---

## Recording tips

- Total target: 2:20–2:40. Practice Scene 3 once — it's the densest.
- If you have an OpenAI key in `.env.local`, the draft will be GPT-written and
  the card shows "GPT-drafted" — mention it. Without a key it says
  "rule-based draft", which you can frame as the offline fallback.
- If you want a clean slate between takes, restart the dev server — the
  in-memory store (drafts + audit log) resets.
