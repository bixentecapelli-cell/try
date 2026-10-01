import { ShieldCheck, Flame, Trophy } from "lucide-react";
import type { Match, MarketPrediction } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProbabilityBar } from "@/components/ui/progress";
import { ConfidenceStars } from "@/components/ui/stars";
import { formatEV, formatOdds, formatPercent } from "@/lib/utils";

interface Pick {
  match: Match;
  prediction: MarketPrediction;
}

interface Props {
  safe?: Pick;
  value?: Pick;
  featured?: Pick;
}

function PickBody({ match, prediction, accent }: Pick & { accent: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-500">{match.league}</p>
          <p className="text-base font-semibold text-zinc-100">
            {match.home.name}{" "}
            <span className="text-zinc-500">vs</span>{" "}
            {match.away.name}
          </p>
        </div>
        <ConfidenceStars value={prediction.confidence} />
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-zinc-500">Pari</p>
          <p className={`text-xl font-bold ${accent}`}>{prediction.label}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-500">Cote Winamax</p>
          <p className="text-2xl font-black tabular-nums text-white">
            {formatOdds(prediction.odd)}
          </p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>Prob. modèle&nbsp;{formatPercent(prediction.estimatedProb)}</span>
          <span className="text-amber-400">
            Marché&nbsp;{formatPercent(prediction.impliedProb)}
          </span>
        </div>
        <ProbabilityBar
          value={prediction.estimatedProb}
          reference={prediction.impliedProb}
          className="mt-1"
        />
      </div>

      <div className="flex items-center justify-between">
        <Badge variant={prediction.ev >= 0.1 ? "success" : prediction.ev >= 0 ? "info" : "danger"}>
          EV {formatEV(prediction.ev)}
        </Badge>
        <Badge variant="muted">Edge {formatPercent(prediction.edge, 1)}</Badge>
      </div>

      {prediction.rationale.length > 0 && (
        <ul className="space-y-1 text-xs text-zinc-400">
          {prediction.rationale.map((r) => (
            <li key={r} className="flex gap-2">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-zinc-500" />
              {r}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function BetPickerCards({ safe, value, featured }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="relative overflow-hidden border-emerald-500/20">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
        <CardHeader className="relative flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-emerald-300">
            <ShieldCheck size={16} /> Le Pari Blindé
          </CardTitle>
          <Badge variant="success">Safe</Badge>
        </CardHeader>
        <CardContent className="relative">
          {safe ? (
            <PickBody match={safe.match} prediction={safe.prediction} accent="text-emerald-300" />
          ) : (
            <p className="text-sm text-zinc-500">Aucun pari safe qualifié aujourd&apos;hui.</p>
          )}
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden border-fuchsia-500/20">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 to-transparent" />
        <CardHeader className="relative flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-fuchsia-300">
            <Flame size={16} /> La Pépite Value
          </CardTitle>
          <Badge variant="warning">EV+</Badge>
        </CardHeader>
        <CardContent className="relative">
          {value ? (
            <PickBody match={value.match} prediction={value.prediction} accent="text-fuchsia-300" />
          ) : (
            <p className="text-sm text-zinc-500">Pas d&apos;erreur de cotation marquante détectée.</p>
          )}
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden border-amber-500/20">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent" />
        <CardHeader className="relative flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-amber-300">
            <Trophy size={16} /> L&apos;Affiche du Jour
          </CardTitle>
          <Badge variant="info">Headline</Badge>
        </CardHeader>
        <CardContent className="relative">
          {featured ? (
            <PickBody match={featured.match} prediction={featured.prediction} accent="text-amber-300" />
          ) : (
            <p className="text-sm text-zinc-500">Aucune affiche programmée.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
