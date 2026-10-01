import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export function KpiTile({
  label,
  value,
  trend,
  accent = "zinc",
  icon,
  sublabel,
}: {
  label: string;
  value: ReactNode;
  trend?: string;
  accent?: "emerald" | "rose" | "sky" | "amber" | "zinc";
  icon?: ReactNode;
  sublabel?: ReactNode;
}) {
  const accentMap: Record<string, string> = {
    emerald: "text-emerald-300",
    rose: "text-rose-300",
    sky: "text-sky-300",
    amber: "text-amber-300",
    zinc: "text-zinc-100",
  };
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <span className="text-[11px] uppercase tracking-wider text-zinc-500">{label}</span>
        {icon && <span className="text-zinc-500">{icon}</span>}
      </div>
      <p className={cn("mt-1 text-2xl font-black tabular-nums", accentMap[accent])}>{value}</p>
      {sublabel && <p className="text-xs text-zinc-400">{sublabel}</p>}
      {trend && <p className="text-[11px] text-zinc-500">{trend}</p>}
    </Card>
  );
}
