"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/* ---------- SJ Innovation dot-matrix logo ---------- */

function SjMark({ size = 34 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/sji-mark.png"
      alt="SJ Innovation"
      width={size}
      height={size}
      className="shrink-0 object-contain"
    />
  );
}

function SjLogo() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/sji-logo.png"
      alt="SJ Innovation — AI First Solutions"
      className="h-10 w-auto shrink-0 object-contain"
    />
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
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9Zm-4.3 13a2 2 0 0 1-3.4 0",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-15v2m0 16v2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M2 12h2m16 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  panel: "M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm5 0v16",
  home: "M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5",
  chevronRight: "m9 6 6 6-6 6",
  chevronDown: "m6 9 6 6 6-6",
  trophy:
    "M8 21h8m-4-4v4m-6-17h12v5a6 6 0 0 1-12 0V4Zm12 2h2a2 2 0 0 1-2 4M6 6H4a2 2 0 0 0 2 4",
};

/* ---------- Sidebar ---------- */

interface NavItem {
  href: string;
  label: string;
  icon: keyof typeof icons;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: "grid" },
  { href: "/copilot", label: "Pipeline Copilot", icon: "radar" },
  { href: "/forecast", label: "Forecast", icon: "chart" },
  { href: "/audit", label: "Audit log", icon: "clipboard" },
];

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/copilot": "Pipeline Copilot",
  "/forecast": "Forecast",
  "/audit": "Audit log",
};

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] transition ${
        active
          ? "bg-surface-2 font-semibold text-fg shadow-[inset_2px_0_0_0_#38bdf8]"
          : "text-muted hover:bg-surface-2/50 hover:text-fg"
      }`}
    >
      <Icon d={icons[item.icon]} className={active ? "text-sky-400" : ""} />
      <span className="flex-1 text-left">{item.label}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">
          {item.badge}
        </span>
      )}
    </Link>
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
  const pathname = usePathname();
  const pageTitle = PAGE_TITLES[pathname] ?? "Dashboard";

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

          <nav className="flex-1 overflow-y-auto px-3 pb-4">
            <SectionLabel>Workspace</SectionLabel>
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                item={{
                  ...item,
                  badge:
                    item.href === "/"
                      ? atRiskCount
                      : item.href === "/audit"
                        ? pendingActions
                        : undefined,
                }}
                active={pathname === item.href}
              />
            ))}
          </nav>
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
          <Link href="/" className="text-muted transition hover:text-fg">
            Home
          </Link>
          <Icon d={icons.chevronRight} className="h-3.5 w-3.5 text-muted" />
          <span className="font-semibold text-fg">{pageTitle}</span>
        </div>

        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
