import type { Match } from "@/types";
import { analyzeMatch } from "@/lib/engine/scoring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProbabilityBar } from "@/components/ui/progress";
import { formatOdds, formatPercent } from "@/lib/utils";

function OddCell({
  label,
  odd,
  prob,
  implied,
}: {
  label: string;
  odd: number;
  prob: number;
  implied: number;
}) {
  const edge = prob - implied;
  const positive = edge > 0.02;
  const strong = edge > 0.06;
  return (
    <div
      className={`rounded-lg border px-3 py-2 ${
        strong
          ? "border-emerald-500/40 bg-emerald-500/5"
          : positive
            ? "border-zinc-700 bg-zinc-900"
            : "border-zinc-800 bg-zinc-900/60"
      }`}
    >
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-zinc-500">
        <span>{label}</span>
        <span
          className={`${strong ? "text-emerald-300" : positive ? "text-zinc-300" : "text-zinc-500"}`}
        >
          {edge >= 0 ? "+" : ""}
          {(edge * 100).toFixed(1)}
        </span>
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-lg font-bold text-white tabular-nums">{formatOdds(odd)}</span>
        <span className="text-xs text-zinc-500">{formatPercent(prob, 0)}</span>
      </div>
      <ProbabilityBar value={prob} reference={implied} className="mt-1 h-1" />
    </div>
  );
}

export function MatchListPreview({ matches }: { matches: Match[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Matchs du jour · aperçu moteur</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {matches.map((m) => {
          const { predictions, derived } = analyzeMatch(m);
          const byMarket = Object.fromEntries(predictions.map((p) => [p.market, p]));

          return (
            <div
              key={m.id}
              className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-zinc-500">
                    {m.league} · {new Date(m.kickoff).toLocaleString("fr-FR", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-lg font-semibold text-zinc-100">
                    {m.home.name} <span className="text-zinc-500">vs</span> {m.away.name}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <Badge variant="muted">
                    xG {derived.expectedGoalsHome.toFixed(2)} - {derived.expectedGoalsAway.toFixed(2)}
                  </Badge>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-6">
                {(["1", "N", "2", "O2_5", "U2_5", "BTTS_YES"] as const).map((k) => {
                  const p = byMarket[k];
                  return (
                    <OddCell
                      key={k}
                      label={p.label}
                      odd={p.odd}
                      prob={p.estimatedProb}
                      implied={p.impliedProb}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
