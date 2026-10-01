import type { Match } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDownRight, ArrowUpRight, Minus, Zap } from "lucide-react";
import { formatOdds } from "@/lib/utils";

function TrendCell({ label, odd, trend }: { label: string; odd: number; trend?: number }) {
  const t = trend ?? 0;
  const absPct = Math.abs(t * 100);
  const sharpMove = absPct >= 5;
  const Icon = t === 0 ? Minus : t > 0 ? ArrowUpRight : ArrowDownRight;
  const color =
    t === 0
      ? "text-zinc-500"
      : t > 0
        ? "text-rose-300"
        : "text-emerald-300";
  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-zinc-500">{label}</span>
        {sharpMove && (
          <Badge variant="warning">
            <Zap size={10} /> steam
          </Badge>
        )}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-xl font-bold tabular-nums text-zinc-100">{formatOdds(odd)}</span>
        <span className={`inline-flex items-center text-xs tabular-nums ${color}`}>
          <Icon size={12} />
          {absPct.toFixed(1)}% 24h
        </span>
      </div>
    </div>
  );
}

export function OddsTracker({ match }: { match: Match }) {
  const { odds } = match;
  const hasTrend = odds.trend1 != null || odds.trendN != null || odds.trend2 != null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Odds Tracker · 1N2 Winamax (24h)</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-2">
        <TrendCell label={match.home.name} odd={odds["1"]} trend={odds.trend1} />
        <TrendCell label="Nul" odd={odds.N} trend={odds.trendN} />
        <TrendCell label={match.away.name} odd={odds["2"]} trend={odds.trend2} />
        {!hasTrend && (
          <p className="col-span-3 text-[11px] text-zinc-500">
            Aucune variation significative captée depuis la dernière synchro.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
