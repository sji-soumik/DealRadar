"use client";

import { ReactNode, useState } from "react";

/* ---------- SJ Innovation dot-matrix logo ---------- */

function SjMark({ size = 34 }: { size?: number }) {
  // Diagonal dot-matrix mark inspired by the SJ Innovation logo.
  const dots: { x: number; y: number; r: number; c: string }[] = [];
  const cols = 7;
  const rows = 5;
  const palette = ["#f59e0b", "#fb923c", "#f97316", "#fbbf24"];
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      // keep dots inside a rising diagonal band
      const band = col - row;
      if (band < -1 || band > 3) continue;
      dots.push({
        x: 6 + col * 8,
        y: 42 - row * 8 - col * 1.5,
        r: 2.6,
        c: palette[(col + row) % palette.length],
      });
    }
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 52"
      aria-hidden
      className="shrink-0"
    >
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.c} />
      ))}
    </svg>
  );
}

function SjLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <SjMark />
      <div className="leading-none">
        <span className="block text-[15px] font-extrabold tracking-wide text-sky-400">
          SJ <span className="text-fg">INNOVATION</span>
        </span>
        <span className="mt-0.5 block text-[8px] font-medium uppercase tracking-[0.3em] text-muted">
          Interactive
        </span>
      </div>
    </div>
  );
}

/* ---------- Icons (inline, stroke style) ---------- */

function Icon({ d, className = "" }: { d: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-[18px] w-[18px] shrink-0 ${className}`}
    >
      <path d={d} />
    </svg>
  );
}

const icons = {
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35",
  grid: "M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z",
  radar:
    "M12 12 19 5M12 21a9 9 0 1 1 9-9M12 17a5 5 0 1 1 5-5M12 12h.01",
  chart: "M3 3v18h18M8 17v-6m5 6V7m5 10v-9",
  clipboard:
    "M9 5h6m-7 0a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2m-8 0H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1M9 12h6M9 16h4",
  calendar:
    "M8 2v4m8-4v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
  briefcase:
    "M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-8 0h8m-8 0H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3M3 13h18",
  growth: "M3 17l6-6 4 4 8-8m0 0h-5m5 0v5",
  review:
    "M9 3h6a1 1 0 0 1 1 1v1H8V4a1 1 0 0 1 1-1Zm7 2h2a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m1 7 2 2 4-4",
  bot: "M12 3v3m-6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-7Zm3 3h.01M15 13h.01M3 13v3m18-3v3",
  sparkle:
    "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Zm7 11 .9 2.6L22.5 18l-2.6.9L19 21.5l-.9-2.6L15.5 18l2.6-.9L19 14Z",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9Zm-4.3 13a2 2 0 0 1-3.4 0",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-15v2m0 16v2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M2 12h2m16 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  panel: "M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm5 0v16",
  home: "M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5",
  chevronRight: "m9 6 6 6-6 6",
  chevronDown: "m6 9 6 6 6-6",
  refresh:
    "M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6",
  trophy:
    "M8 21h8m-4-4v4m-6-17h12v5a6 6 0 0 1-12 0V4Zm12 2h2a2 2 0 0 1-2 4M6 6H4a2 2 0 0 0 2 4",
};

/* ---------- Sidebar ---------- */

interface NavItem {
  label: string;
  icon: string;
  badge?: number;
  tag?: string;
  active?: boolean;
  chevron?: boolean;
}

function NavLink({ item }: { item: NavItem }) {
  return (
    <button
      className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] transition ${
        item.active
          ? "bg-surface-2 font-semibold text-fg shadow-[inset_2px_0_0_0_#38bdf8]"
          : "text-muted hover:bg-surface-2/50 hover:text-fg"
      }`}
    >
      <Icon d={icons[item.icon as keyof typeof icons]} className={item.active ? "text-sky-400" : ""} />
      <span className="flex-1 text-left">{item.label}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">
          {item.badge}
        </span>
      )}
      {item.tag && (
        <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold text-muted">
          {item.tag}
        </span>
      )}
      {item.chevron && <Icon d={icons.chevronDown} className="h-3.5 w-3.5 text-muted" />}
    </button>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-1 mt-5 px-3 text-[11px] font-bold uppercase tracking-widest text-muted/70">
      {children}
    </p>
  );
}

export default function AppShell({
  children,
  atRiskCount = 0,
  pendingActions = 0,
}: {
  children: ReactNode;
  atRiskCount?: number;
  pendingActions?: number;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen">
      {/* ---------- Left sidebar ---------- */}
      {sidebarOpen && (
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border-line bg-sidebar md:flex">
          {/* Logo row */}
          <div className="flex items-center justify-between px-4 pb-2 pt-4">
            <SjLogo />
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-md p-1.5 text-muted transition hover:bg-surface-2 hover:text-fg"
              title="Collapse sidebar"
            >
              <Icon d={icons.panel} className="h-4 w-4" />
            </button>
          </div>

          {/* Search */}
          <div className="px-4 py-3">
            <div className="flex items-center gap-2.5 rounded-xl border border-border-line bg-surface px-3 py-2.5 text-muted">
              <Icon d={icons.search} className="h-4 w-4" />
              <span className="flex-1 text-[13px]">Search...</span>
              <kbd className="rounded-md border border-border-line bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold">
                ⌘ K
              </kbd>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 pb-4">
            <NavLink item={{ label: "Top Deals", icon: "trophy" }} />

            <SectionLabel>Home</SectionLabel>
            <NavLink item={{ label: "Dashboard", icon: "grid", badge: atRiskCount, active: true }} />
            <NavLink item={{ label: "Pipeline", icon: "radar", badge: pendingActions }} />
            <NavLink item={{ label: "Forecast", icon: "chart" }} />
            <NavLink item={{ label: "Meetings", icon: "calendar", chevron: true }} />
            <NavLink item={{ label: "Productivity", icon: "clipboard" }} />

            <SectionLabel>Projects &amp; Delivery</SectionLabel>
            <NavLink item={{ label: "Projects", icon: "briefcase", chevron: true }} />

            <SectionLabel>Team &amp; People</SectionLabel>
            <NavLink item={{ label: "My Growth", icon: "growth", tag: "Beta" }} />
            <NavLink item={{ label: "My Reviews", icon: "review" }} />
          </nav>

          {/* Bottom section */}
          <div className="border-t border-border-line px-3 py-3">
            <NavLink item={{ label: "Refresh Permissions", icon: "refresh" }} />
            <NavLink item={{ label: "AI Agents", icon: "bot" }} />
            <NavLink item={{ label: "Vision", icon: "sparkle" }} />
          </div>
        </aside>
      )}

      {/* ---------- Main column ---------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border-line bg-sidebar/90 px-5 backdrop-blur">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-md p-1.5 text-muted transition hover:bg-surface-2 hover:text-fg"
              title="Expand sidebar"
            >
              <Icon d={icons.panel} className="h-4 w-4" />
            </button>
          )}
          <div className="flex items-center gap-3">
            <SjMark size={30} />
            <span className="hidden text-sm font-extrabold tracking-wide text-sky-400 lg:block">
              SJ <span className="text-fg">INNOVATION</span>
            </span>
            <h1 className="bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-xl font-bold text-transparent">
              SJ BD Dashboard
            </h1>
          </div>

          <div className="ml-auto flex items-center gap-4">
            {/* Live pill */}
            <span className="flex items-center gap-2 rounded-full border border-sky-500/30 bg-surface px-4 py-1.5 text-xs font-bold shadow-[0_0_18px_rgba(56,189,248,0.25)]">
              <Icon d={icons.radar} className="h-3.5 w-3.5 text-sky-400" />
              <span className="tracking-wide text-fg">PIPELINE</span>
              <span className="text-muted">|</span>
              <span className="text-sky-400">LIVE</span>
            </span>

            <button className="relative rounded-md p-1.5 text-muted transition hover:bg-surface-2 hover:text-fg">
              <Icon d={icons.bell} />
            </button>

            <span className="hidden items-center gap-2 text-sm text-fg sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Signed in
            </span>

            <button className="rounded-md p-1.5 text-muted transition hover:bg-surface-2 hover:text-fg">
              <Icon d={icons.sun} />
            </button>

            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-sm font-bold text-white">
              SS
            </span>
          </div>
        </header>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 border-b border-border-line bg-background px-6 py-3 text-sm">
          <Icon d={icons.home} className="h-4 w-4 text-muted" />
          <span className="text-muted">Home</span>
          <Icon d={icons.chevronRight} className="h-3.5 w-3.5 text-muted" />
          <span className="font-semibold text-fg">Dashboard</span>
        </div>

        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
