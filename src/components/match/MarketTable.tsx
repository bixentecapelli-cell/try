"use client";

import { useState } from "react";
import type { MarketPrediction } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProbabilityBar } from "@/components/ui/progress";
import { formatEV, formatOdds, formatPercent, cn } from "@/lib/utils";

export function MarketTable({
  predictions,
  onSelect,
  selectedKey,
}: {
  predictions: MarketPrediction[];
  onSelect?: (p: MarketPrediction) => void;
  selectedKey?: string;
}) {
  const [filter, setFilter] = useState<"all" | "value" | "safe">("all");

  const filtered = predictions.filter((p) => {
    if (filter === "value") return p.edge >= 0.03 && p.odd >= 2.0;
    if (filter === "safe") return p.estimatedProb >= 0.6 && p.edge >= 0;
    return true;
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Marchés disponibles · modèle vs Winamax</CardTitle>
        <div className="flex items-center gap-1 rounded-full bg-zinc-900 p-1">
          {(["all", "safe", "value"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setFilter(v)}
              className={cn(
                "rounded-full px-3 py-1 text-[11px] transition",
                filter === v
                  ? "bg-zinc-800 text-zinc-100 shadow-inner"
                  : "text-zinc-500 hover:text-zinc-300",
              )}
            >
              {v === "all" ? "Tous" : v === "safe" ? "Safe" : "Value"}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
              <th className="py-2 font-normal">Marché</th>
              <th className="py-2 font-normal">Cote</th>
              <th className="py-2 font-normal">Prob. modèle</th>
              <th className="py-2 font-normal">Marché</th>
              <th className="py-2 font-normal">Edge</th>
              <th className="py-2 text-right font-normal">EV</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const selected = p.market === selectedKey;
              const strong = p.edge > 0.05;
              return (
                <tr
                  key={p.market}
                  onClick={() => onSelect?.(p)}
                  className={cn(
                    "cursor-pointer border-t border-zinc-800/80 transition",
                    selected
                      ? "bg-emerald-500/10"
                      : "hover:bg-zinc-900/60",
                  )}
                >
                  <td className="py-3 pr-3">
                    <span className="font-medium text-zinc-100">{p.label}</span>
                    {strong && (
                      <Badge variant="success" className="ml-2">
                        Value
                      </Badge>
                    )}
                  </td>
                  <td className="py-3 pr-3 font-bold tabular-nums text-zinc-100">
                    {formatOdds(p.odd)}
                  </td>
                  <td className="py-3 pr-3 w-[22%] min-w-[160px]">
                    <div className="flex items-center gap-2">
                      <span className="w-10 text-xs tabular-nums text-emerald-300">
                        {formatPercent(p.estimatedProb, 0)}
                      </span>
                      <ProbabilityBar
                        value={p.estimatedProb}
                        reference={p.impliedProb}
                        className="w-full"
                      />
                    </div>
                  </td>
                  <td className="py-3 pr-3 text-xs tabular-nums text-amber-300">
                    {formatPercent(p.impliedProb, 0)}
                  </td>
                  <td
                    className={cn(
                      "py-3 pr-3 text-xs tabular-nums",
                      p.edge > 0 ? "text-emerald-300" : "text-rose-300",
                    )}
                  >
                    {p.edge >= 0 ? "+" : ""}
                    {(p.edge * 100).toFixed(1)} pts
                  </td>
                  <td
                    className={cn(
                      "py-3 text-right text-sm font-semibold tabular-nums",
                      p.ev >= 0.1
                        ? "text-emerald-300"
                        : p.ev >= 0
                          ? "text-zinc-200"
                          : "text-zinc-500",
                    )}
                  >
                    {formatEV(p.ev)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-3 text-[11px] text-zinc-500">
          Clique une ligne pour recalculer la mise Kelly sur ce marché.
        </p>
      </CardContent>
    </Card>
  );
}
