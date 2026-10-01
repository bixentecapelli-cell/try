import type { CategoryMetrics } from "@/lib/history/backtest";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatPercent } from "@/lib/utils";

const LABELS: Record<CategoryMetrics["category"], string> = {
  overall: "Toutes catégories",
  safe: "Safe Bets",
  balanced: "Équilibré",
  value: "Value Bets",
};

export function CategoryTable({ rows }: { rows: CategoryMetrics[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance par profil</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
              <th className="py-2 font-normal">Catégorie</th>
              <th className="py-2 font-normal">Paris</th>
              <th className="py-2 font-normal">Taux</th>
              <th className="py-2 font-normal">Cote moy.</th>
              <th className="py-2 font-normal">Mises</th>
              <th className="py-2 font-normal">Profit</th>
              <th className="py-2 text-right font-normal">ROI</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const positive = r.profit >= 0;
              return (
                <tr key={r.category} className="border-t border-zinc-800/80">
                  <td className="py-3">
                    <span className="font-medium text-zinc-100">{LABELS[r.category]}</span>
                  </td>
                  <td className="py-3 text-zinc-300 tabular-nums">{r.bets}</td>
                  <td className="py-3 text-zinc-300 tabular-nums">
                    {formatPercent(r.hitRate, 1)}
                  </td>
                  <td className="py-3 text-zinc-300 tabular-nums">{r.avgOdd.toFixed(2)}</td>
                  <td className="py-3 text-zinc-300 tabular-nums">{r.stake.toFixed(0)} €</td>
                  <td
                    className={cn(
                      "py-3 tabular-nums",
                      positive ? "text-emerald-300" : "text-rose-300",
                    )}
                  >
                    {positive ? "+" : ""}
                    {r.profit.toFixed(2)} €
                  </td>
                  <td className="py-3 text-right">
                    <Badge variant={positive ? "success" : "danger"}>
                      {positive ? "+" : ""}
                      {(r.roi * 100).toFixed(1)}%
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-3 text-[11px] text-zinc-500">
          ROI = Profit / Mises totales. Yield et ROI sont équivalents dans le jargon des paris
          sportifs.
        </p>
      </CardContent>
    </Card>
  );
}
