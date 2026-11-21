import type { LucideIcon } from "lucide-react";

// White KPI card used across the creator dashboard (home, links,
// applications): tinted icon tile, label, value and an optional caption.
export function CreatorStatCard({
  icon: Icon,
  label,
  value,
  tint,
  caption,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  /** Icon tile colours, e.g. "bg-teal-100 text-teal-700". */
  tint: string;
  caption?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-[14px] border border-border bg-card p-4 shadow-card">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${tint}`}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs text-ink-400">{label}</p>
        <p className="truncate text-[19px] font-bold tracking-tight text-foreground">
          {value}
        </p>
        {caption && (
          <p className="mt-0.5 truncate text-[11px] text-ink-400">{caption}</p>
        )}
      </div>
    </div>
  );
}
