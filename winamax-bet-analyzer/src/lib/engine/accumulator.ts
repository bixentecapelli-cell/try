import type { Accumulator, AccumulatorLeg, Match, MarketPrediction, RiskProfile } from "@/types";
import { analyzeMatch } from "./scoring";

// ============================================================================
// Smart Accumulator — builds 3/4-leg combined bets per risk profile.
// ============================================================================

interface AccumulatorConfig {
  minLegs: number;
  maxLegs: number;
  minOdd: number;
  maxOdd: number;
  targetTotalOdd: [number, number];
  pickFilter: (p: MarketPrediction) => boolean;
  rank: (a: MarketPrediction, b: MarketPrediction) => number;
}

const PROFILES: Record<RiskProfile, AccumulatorConfig> = {
  safe: {
    minLegs: 3,
    maxLegs: 4,
    minOdd: 1.2,
    maxOdd: 1.6,
    targetTotalOdd: [1.8, 2.5],
    pickFilter: (p) => p.estimatedProb >= 0.72 && p.edge >= 0.015,
    // Rank by estimated probability desc
    rank: (a, b) => b.estimatedProb - a.estimatedProb,
  },
  balanced: {
    minLegs: 3,
    maxLegs: 3,
    minOdd: 1.4,
    maxOdd: 2.0,
    targetTotalOdd: [3.0, 6.0],
    pickFilter: (p) => p.estimatedProb >= 0.55 && p.edge >= 0.03,
    // Rank by EV desc
    rank: (a, b) => b.ev - a.ev,
  },
  fun: {
    minLegs: 2,
    maxLegs: 3,
    minOdd: 2.0,
    maxOdd: 5.0,
    targetTotalOdd: [6.0, 25.0],
    pickFilter: (p) => p.edge >= 0.07 && p.ev >= 0.1,
    rank: (a, b) => b.ev - a.ev,
  },
};

export interface BuildAccumulatorOptions {
  excludeDraws?: boolean;
  leagues?: string[];
  targetTotalOddOverride?: number;
}

export function buildAccumulator(
  matches: Match[],
  profile: RiskProfile,
  opts: BuildAccumulatorOptions = {},
): Accumulator | null {
  const cfg = PROFILES[profile];

  const candidates: AccumulatorLeg[] = [];

  for (const match of matches) {
    if (opts.leagues?.length && !opts.leagues.includes(match.league)) continue;

    const { predictions } = analyzeMatch(match);
    const best = predictions
      .filter((p) => p.odd >= cfg.minOdd && p.odd <= cfg.maxOdd)
      .filter((p) => (opts.excludeDraws ? !["N", "1X", "X2"].includes(p.market) : true))
      .filter(cfg.pickFilter)
      .sort(cfg.rank)[0];

    if (best) candidates.push({ match, prediction: best });
  }

  if (candidates.length < cfg.minLegs) return null;

  // Sort global candidate pool by the profile's ranking rule, then pick top N
  // whose total odd fits the target window (and max 1 pick per match)
  candidates.sort((a, b) => cfg.rank(a.prediction, b.prediction));

  const seen = new Set<string>();
  const legs: AccumulatorLeg[] = [];

  for (const c of candidates) {
    if (seen.has(c.match.id)) continue;
    legs.push(c);
    seen.add(c.match.id);
    if (legs.length >= cfg.maxLegs) break;
  }

  if (legs.length < cfg.minLegs) return null;

  const totalOdd = legs.reduce((acc, l) => acc * l.prediction.odd, 1);
  const combinedProb = legs.reduce((acc, l) => acc * l.prediction.estimatedProb, 1);
  const combinedEV = combinedProb * totalOdd - 1;

  // Trim down if total odd overshoots the target window
  while (
    legs.length > cfg.minLegs &&
    totalOdd > cfg.targetTotalOdd[1] * 1.3
  ) {
    legs.pop();
  }

  const label =
    profile === "safe"
      ? `Combi Sécurité — ${legs.length} sélections verrouillées`
      : profile === "balanced"
        ? `Combi Équilibré — ${legs.length} value plays`
        : `Combi Jackpot — ${legs.length} coups de folie`;

  return {
    profile,
    legs,
    totalOdd,
    combinedProb,
    combinedEV,
    label,
  };
}
