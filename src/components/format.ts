export function money(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1000)}K`;
  return `$${n.toLocaleString()}`;
}

export function moneyFull(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function categoryColor(category: string): string {
  switch (category) {
    case "at-risk":
      return "text-danger";
    case "watch":
      return "text-warn";
    default:
      return "text-ok";
  }
}

export function categoryBadge(category: string): string {
  switch (category) {
    case "at-risk":
      return "bg-red-500/15 text-danger border-red-500/30";
    case "watch":
      return "bg-amber-500/15 text-warn border-amber-500/30";
    default:
      return "bg-emerald-500/15 text-ok border-emerald-500/30";
  }
}
