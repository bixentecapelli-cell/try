import { LineChart, Zap } from "lucide-react";
import { fetchFootballMatches } from "@/lib/scrapers/winamax";
import { analyzeMatch, pickSafeBet, pickValueBet } from "@/lib/engine/scoring";
import { BetPickerCards } from "@/components/dashboard/BetPickerCards";
import { MatchListPreview } from "@/components/dashboard/MatchListPreview";
import { AccumulatorBuilder } from "@/components/dashboard/AccumulatorBuilder";
import { Badge } from "@/components/ui/badge";
import type { Match, MarketPrediction } from "@/types";

export const dynamic = "force-dynamic";

function pickFeatured(matches: Match[]):
  | { match: Match; prediction: MarketPrediction }
  | undefined {
  // Pick the fixture with the highest combined glam score: top league + two
  // elite teams (low 1 and 2 odds) + best model-market edge.
  const ranked = matches
    .map((m) => {
      const { predictions } = analyzeMatch(m);
      const glam =
        (["Champions League", "La Liga", "Premier League"].includes(m.league) ? 1 : 0) +
        (m.odds["1"] < 2.5 && m.odds["2"] < 4 ? 1 : 0);
      // Pick the strongest single bet on the match
      const best = [...predictions]
        .filter((p) => p.estimatedProb >= 0.4 && p.edge >= 0)
        .sort((a, b) => b.ev - a.ev)[0];
      return { m, best, glam };
    })
    .filter((x) => x.best)
    .sort((a, b) => b.glam - a.glam || b.best!.ev - a.best!.ev);

  const top = ranked[0];
  if (!top) return undefined;
  return { match: top.m, prediction: top.best! };
}

export default async function HomePage() {
  const { matches, source, fetchedAt } = await fetchFootballMatches();

  // Compute picks across the whole slate
  const allPredictions = matches.flatMap((m) =>
    analyzeMatch(m).predictions.map((p) => ({ match: m, prediction: p })),
  );

  const safePool = allPredictions.filter(({ prediction }) =>
    pickSafeBet([prediction]) !== undefined,
  );
  const safe = safePool.sort((a, b) => b.prediction.estimatedProb - a.prediction.estimatedProb)[0];

  const valuePool = allPredictions.filter(({ prediction }) =>
    pickValueBet([prediction]) !== undefined,
  );
  const value = valuePool.sort((a, b) => b.prediction.ev - a.prediction.ev)[0];

  const featured = pickFeatured(matches);

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 md:px-6 md:py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Instant Bet Picker
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-400">
            Analyse en temps réel des cotes Winamax et détection d&apos;opportunités
            à forte Expected Value, pondérée par forme, xG, compos, fatigue et
            enjeux.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Badge variant={source === "winamax" ? "success" : "muted"}>
            <Zap size={10} /> Source: {source}
          </Badge>
          <Badge variant="info">
            <LineChart size={10} /> {matches.length} matchs
          </Badge>
          <span>MàJ {new Date(fetchedAt).toLocaleTimeString("fr-FR")}</span>
        </div>
      </header>

      <BetPickerCards safe={safe} value={value} featured={featured} />

      <AccumulatorBuilder matches={matches} />

      <MatchListPreview matches={matches} />

      <footer className="mt-6 text-center text-xs text-zinc-600">
        Les paris sportifs comportent des risques — jouez de manière responsable.
        Ce dashboard est un outil d&apos;analyse, pas une recommandation de mise.
      </footer>
    </main>
  );
}
