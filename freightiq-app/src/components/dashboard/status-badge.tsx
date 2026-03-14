type StatusBadgeProps = {
  status: string;
};

const badgeClasses: Record<string, string> = {
  open: "bg-[var(--brand)]/20 text-[var(--brand)]",
  matched: "bg-blue-500/20 text-blue-400",
  picked_up: "bg-amber-500/20 text-amber-300",
  in_transit: "bg-yellow-500/20 text-yellow-300",
  delivered: "bg-slate-600/30 text-slate-200",
  cancelled: "bg-red-500/20 text-red-300",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalizedStatus = status || "open";
  const label = normalizedStatus.replaceAll("_", " ");

  return (
    <span
      className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
        badgeClasses[normalizedStatus] ?? "bg-slate-700/40 text-slate-300"
      }`}
    >
      {label}
    </span>
  );
}
