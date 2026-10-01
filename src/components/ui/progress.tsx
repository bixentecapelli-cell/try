import * as React from "react";
import { cn } from "@/lib/utils";

export function ProbabilityBar({
  value,
  reference,
  className,
}: {
  value: number; // 0..1 model probability
  reference?: number; // 0..1 implied probability from odds
  className?: string;
}) {
  const pct = Math.round(value * 1000) / 10;
  const refPct = reference != null ? Math.round(reference * 1000) / 10 : null;
  return (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-zinc-800", className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-sky-400"
        style={{ width: `${pct}%` }}
      />
      {refPct != null && (
        <div
          aria-label="Winamax implied"
          className="absolute top-0 h-full w-[2px] bg-amber-400"
          style={{ left: `${refPct}%` }}
        />
      )}
    </div>
  );
}
