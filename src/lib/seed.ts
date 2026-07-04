import { Deal, Stage } from "./types";

// All dates are generated relative to "now" so the demo data always looks live.
const now = new Date();

function daysAgo(n: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function daysFromNow(n: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

interface SeedSpec {
  id: string;
  name: string;
  company: string;
  owner: string;
  value: number;
  stage: Stage;
  daysInStage: number;
  ageDays: number;
  closeInDays: number;
  slips?: number[]; // previous close dates, as days-from-now offsets
  nextStep: string | null;
  contacts: { name: string; title: string; email: string }[];
  activities: { type: "email" | "call" | "meeting" | "demo" | "note"; daysAgo: number; summary: string }[];
  notes: { daysAgo: number; text: string }[];
}

const specs: SeedSpec[] = [
  // ---------- Clearly at-risk deals ----------
  {
    id: "D-1001",
    name: "Enterprise Platform License",
    company: "Northwind Logistics",
    owner: "Priya Sharma",
    value: 185000,
    stage: "Negotiation",
    daysInStage: 48,
    ageDays: 160,
    closeInDays: 10,
    slips: [-35, -12],
    nextStep: null,
    contacts: [{ name: "Gary Holt", title: "VP Operations", email: "gary.holt@northwind.example" }],
    activities: [
      { type: "meeting", daysAgo: 41, summary: "Pricing review meeting — Gary pushed back on multi-year commit." },
      { type: "email", daysAgo: 33, summary: "Sent revised pricing; no reply." },
      { type: "email", daysAgo: 24, summary: "Follow-up email; no reply." },
    ],
    notes: [
      { daysAgo: 24, text: "Gary has gone quiet since we sent revised pricing. Procurement said budget review pushed to next quarter. Need to re-engage before this stalls completely." },
    ],
  },
  {
    id: "D-1002",
    name: "Analytics Suite Rollout",
    company: "Bluepeak Health",
    owner: "Marcus Lee",
    value: 96000,
    stage: "Proposal",
    daysInStage: 39,
    ageDays: 95,
    closeInDays: 21,
    slips: [-20],
    nextStep: null,
    contacts: [{ name: "Dana Reyes", title: "Director of Analytics", email: "dana.reyes@bluepeak.example" }],
    activities: [
      { type: "demo", daysAgo: 44, summary: "Full product demo to analytics team, well received." },
      { type: "email", daysAgo: 37, summary: "Sent proposal and pricing." },
      { type: "call", daysAgo: 19, summary: "Left voicemail; Dana on leave, no backup contact." },
    ],
    notes: [
      { daysAgo: 19, text: "Dana is our only contact and she's on leave for two weeks. Deal is on hold until she is back — completely single-threaded here." },
    ],
  },
  {
    id: "D-1003",
    name: "Field Ops Automation",
    company: "TerraGrid Energy",
    owner: "Priya Sharma",
    value: 240000,
    stage: "Qualification",
    daysInStage: 52,
    ageDays: 70,
    closeInDays: -6,
    nextStep: null,
    contacts: [{ name: "Omar Bakr", title: "Head of Field Operations", email: "omar.bakr@terragrid.example" }],
    activities: [
      { type: "call", daysAgo: 50, summary: "Discovery call, strong pain around manual scheduling." },
      { type: "email", daysAgo: 30, summary: "Sent case studies; short 'thanks, will review' reply." },
    ],
    notes: [
      { daysAgo: 28, text: "Omar mentioned they might postpone the initiative — 'no budget until the new fiscal year, let's circle back later'. Close date already passed and never updated." },
    ],
  },
  // ---------- Watch-list deals ----------
  {
    id: "D-1004",
    name: "Customer Portal Redesign",
    company: "Argo Freight",
    owner: "Sofia Ivanova",
    value: 72000,
    stage: "Proposal",
    daysInStage: 24,
    ageDays: 60,
    closeInDays: 18,
    nextStep: "Pricing call with CFO scheduled",
    contacts: [{ name: "Lena Wu", title: "Product Manager", email: "lena.wu@argo.example" }],
    activities: [
      { type: "meeting", daysAgo: 12, summary: "Scope walkthrough with product team." },
      { type: "email", daysAgo: 9, summary: "Confirmed pricing call for next week." },
    ],
    notes: [
      { daysAgo: 9, text: "Lena is engaged but we still haven't met the CFO who owns the budget. Only one contact so far." },
    ],
  },
  {
    id: "D-1005",
    name: "Compliance Module Add-on",
    company: "Meridian Bank",
    owner: "Marcus Lee",
    value: 54000,
    stage: "Negotiation",
    daysInStage: 22,
    ageDays: 130,
    closeInDays: 14,
    slips: [-10],
    nextStep: "Legal review of MSA redlines",
    contacts: [
      { name: "Tom Okafor", title: "Compliance Lead", email: "tom.okafor@meridian.example" },
      { name: "Jess Park", title: "Procurement Manager", email: "jess.park@meridian.example" },
    ],
    activities: [
      { type: "email", daysAgo: 13, summary: "Received MSA redlines from legal." },
      { type: "call", daysAgo: 11, summary: "Walked through redlines with Tom; two open clauses." },
    ],
    notes: [
      { daysAgo: 11, text: "Legal review is slow but moving. Close date already slipped once for this reason." },
    ],
  },
  {
    id: "D-1006",
    name: "Warehouse IoT Sensors",
    company: "Cobalt Retail Group",
    owner: "Sofia Ivanova",
    value: 118000,
    stage: "Qualification",
    daysInStage: 26,
    ageDays: 34,
    closeInDays: 40,
    nextStep: "Technical evaluation kickoff",
    contacts: [{ name: "Ravi Nair", title: "IT Director", email: "ravi.nair@cobalt.example" }],
    activities: [
      { type: "meeting", daysAgo: 16, summary: "Requirements workshop with IT." },
      { type: "email", daysAgo: 8, summary: "Sent technical evaluation plan." },
    ],
    notes: [{ daysAgo: 8, text: "Waiting on Ravi to confirm eval start date. Slightly slow in stage for qualification." }],
  },
  // ---------- Healthy deals ----------
  {
    id: "D-1007",
    name: "API Platform Expansion",
    company: "Helios Software",
    owner: "Marcus Lee",
    value: 150000,
    stage: "Negotiation",
    daysInStage: 9,
    ageDays: 85,
    closeInDays: 12,
    nextStep: "Contract signature — order form with CEO",
    contacts: [
      { name: "Anna Berg", title: "CTO", email: "anna.berg@helios.example" },
      { name: "Chris Doyle", title: "CEO", email: "chris.doyle@helios.example" },
      { name: "Mia Chen", title: "Head of Engineering", email: "mia.chen@helios.example" },
    ],
    activities: [
      { type: "meeting", daysAgo: 4, summary: "Final commercial review; CEO verbally approved." },
      { type: "email", daysAgo: 2, summary: "Sent order form for signature." },
    ],
    notes: [{ daysAgo: 2, text: "Verbal commit from Chris. Expecting signature this week." }],
  },
  {
    id: "D-1008",
    name: "Data Pipeline Migration",
    company: "Quartz Media",
    owner: "Priya Sharma",
    value: 88000,
    stage: "Proposal",
    daysInStage: 7,
    ageDays: 40,
    closeInDays: 25,
    nextStep: "Proposal review meeting booked",
    contacts: [
      { name: "Sam Torres", title: "VP Data", email: "sam.torres@quartz.example" },
      { name: "Kim Achebe", title: "Data Eng Manager", email: "kim.achebe@quartz.example" },
    ],
    activities: [
      { type: "email", daysAgo: 5, summary: "Sent proposal v2 with revised scope." },
      { type: "call", daysAgo: 3, summary: "Sam confirmed proposal review meeting." },
    ],
    notes: [{ daysAgo: 3, text: "Strong engagement from both Sam and Kim. Timeline realistic." }],
  },
  {
    id: "D-1009",
    name: "Security Audit Package",
    company: "Vanta Rail",
    owner: "Sofia Ivanova",
    value: 45000,
    stage: "Closing",
    daysInStage: 5,
    ageDays: 55,
    closeInDays: 7,
    nextStep: "Countersignature and kickoff scheduling",
    contacts: [
      { name: "Ed Malone", title: "CISO", email: "ed.malone@vanta-rail.example" },
      { name: "Rita Gomez", title: "Procurement", email: "rita.gomez@vanta-rail.example" },
    ],
    activities: [
      { type: "email", daysAgo: 2, summary: "Received signed contract from procurement." },
      { type: "call", daysAgo: 1, summary: "Scheduled kickoff for next Monday." },
    ],
    notes: [{ daysAgo: 1, text: "Signed on their side, countersign pending. Done deal." }],
  },
  {
    id: "D-1010",
    name: "Mobile App License",
    company: "Fable Foods",
    owner: "Marcus Lee",
    value: 30000,
    stage: "Prospecting",
    daysInStage: 6,
    ageDays: 6,
    closeInDays: 60,
    nextStep: "Discovery call booked",
    contacts: [{ name: "Noor Hassan", title: "Ops Manager", email: "noor.hassan@fablefoods.example" }],
    activities: [
      { type: "email", daysAgo: 4, summary: "Intro email exchange, positive reply." },
      { type: "call", daysAgo: 2, summary: "Booked discovery call." },
    ],
    notes: [{ daysAgo: 2, text: "Early but responsive. Discovery call this week." }],
  },
  {
    id: "D-1011",
    name: "Support Suite Upgrade",
    company: "Kestrel Airlines",
    owner: "Priya Sharma",
    value: 64000,
    stage: "Proposal",
    daysInStage: 30,
    ageDays: 75,
    closeInDays: 15,
    slips: [-8],
    nextStep: null,
    contacts: [
      { name: "Paul Straub", title: "Head of Support", email: "paul.straub@kestrel.example" },
      { name: "Ines Duarte", title: "IT Procurement", email: "ines.duarte@kestrel.example" },
    ],
    activities: [
      { type: "meeting", daysAgo: 21, summary: "Proposal walkthrough; Paul wanted comparison vs incumbent." },
      { type: "email", daysAgo: 15, summary: "Sent comparison doc; brief acknowledgment." },
    ],
    notes: [
      { daysAgo: 14, text: "Paul said they're 'still evaluating options and timing isn't great with the re-org'. Next step never rescheduled after the walkthrough." },
    ],
  },
  {
    id: "D-1012",
    name: "Fleet Telemetry Pilot",
    company: "Orion Couriers",
    owner: "Sofia Ivanova",
    value: 52000,
    stage: "Qualification",
    daysInStage: 10,
    ageDays: 20,
    closeInDays: 35,
    nextStep: "Pilot scoping workshop",
    contacts: [
      { name: "Beth Kim", title: "COO", email: "beth.kim@orion.example" },
      { name: "Alan Osei", title: "Fleet Manager", email: "alan.osei@orion.example" },
    ],
    activities: [
      { type: "meeting", daysAgo: 6, summary: "Exec alignment meeting with COO." },
      { type: "email", daysAgo: 3, summary: "Confirmed pilot scoping workshop." },
    ],
    notes: [{ daysAgo: 3, text: "COO sponsoring directly. Multi-threaded and moving fast." }],
  },
];

export function buildSeedDeals(): Deal[] {
  return specs.map((s) => ({
    id: s.id,
    name: s.name,
    company: s.company,
    owner: s.owner,
    value: s.value,
    stage: s.stage,
    stageEnteredAt: daysAgo(s.daysInStage),
    createdAt: daysAgo(s.ageDays),
    expectedCloseDate: daysFromNow(s.closeInDays),
    closeDateHistory: (s.slips ?? []).map((d) => daysFromNow(d)),
    nextStep: s.nextStep,
    contacts: s.contacts,
    activities: s.activities
      .map((a) => ({ type: a.type, date: daysAgo(a.daysAgo), summary: a.summary }))
      .sort((a, b) => (a.date < b.date ? 1 : -1)),
    notes: s.notes
      .map((n) => ({ date: daysAgo(n.daysAgo), text: n.text }))
      .sort((a, b) => (a.date < b.date ? 1 : -1)),
  }));
}
