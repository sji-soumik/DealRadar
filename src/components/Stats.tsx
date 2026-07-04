import { moneyFull } from "./format";

export function Kpi({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "accent" | "danger" | "ok";
}) {
  const toneClass =
    tone === "accent"
      ? "text-accent"
      : tone === "danger"
        ? "text-danger"
        : tone === "ok"
          ? "text-ok"
          : "text-fg";
  return (
    <div className="rounded-xl border border-border-line bg-surface p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className={`mt-1 text-xl font-bold ${toneClass}`}>{value}</p>
      <p className="text-[11px] text-muted">{sub}</p>
    </div>
  );
}

export function ForecastBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="font-semibold">{moneyFull(value)}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-surface-2">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
