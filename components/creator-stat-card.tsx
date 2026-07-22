// Tinted summary card matching the creator home dashboard's KPI row.
export function CreatorStatCard({
  value,
  label,
  bg,
}: {
  value: string;
  label: string;
  bg: string;
}) {
  return (
    <div className={`flex flex-col gap-1 rounded-[14px] p-5 ${bg}`}>
      <p className="text-[15px] font-bold text-foreground">{value}</p>
      <p className="text-xs text-ink-600">{label}</p>
    </div>
  );
}
