import type { League, MarketKey } from "@/types";

// ============================================================================
// Historical bet log (30 days)
// ----------------------------------------------------------------------------
// Deterministic pseudo-random dataset mimicking what the model would have
// recommended over the past 30 days. In production this comes from the
// `Bet` + `BetResult` tables (every pick saved at generation time with its
// closing odd and final outcome).
// ============================================================================

export type BetCategory = "safe" | "value" | "balanced";

export interface HistoricalBet {
  id: string;
  date: string; // ISO
  league: League;
  category: BetCategory;
  market: MarketKey;
  label: string;
  odd: number;
  estimatedProb: number;
  stake: number;
  outcome: "win" | "loss" | "push";
  profit: number; // net profit (- stake on loss, +(odd-1)*stake on win, 0 on push)
}

// Simple seeded RNG so the generated history is stable across requests.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LEAGUES: League[] = [
  "Ligue 1",
  "Premier League",
  "La Liga",
  "Serie A",
  "Bundesliga",
  "Champions League",
];

const PROFILES: Record<
  BetCategory,
  { oddMin: number; oddMax: number; probMin: number; probMax: number; hitBias: number }
> = {
  // hitBias: calibration offset vs implied probability. Our model is +3-6pts
  // better than implied on safe/balanced and +8pts on value — simulate that.
  safe: { oddMin: 1.2, oddMax: 1.65, probMin: 0.68, probMax: 0.88, hitBias: 0.04 },
  balanced: { oddMin: 1.6, oddMax: 2.5, probMin: 0.5, probMax: 0.7, hitBias: 0.06 },
  value: { oddMin: 2.5, oddMax: 5.0, probMin: 0.28, probMax: 0.45, hitBias: 0.08 },
};

const MARKET_LABELS: Record<MarketKey, string> = {
  "1": "Victoire domicile",
  N: "Match nul",
  "2": "Victoire extérieur",
  "1X": "1 ou Nul",
  X2: "Nul ou 2",
  "12": "Pas de nul",
  O1_5: "+1.5 buts",
  U1_5: "-1.5 buts",
  O2_5: "+2.5 buts",
  U2_5: "-2.5 buts",
  BTTS_YES: "Les deux équipes marquent",
  BTTS_NO: "Une équipe ne marque pas",
};

const MARKETS: MarketKey[] = ["1", "2", "O2_5", "U2_5", "BTTS_YES", "BTTS_NO", "1X", "X2"];

export function generateHistoricalBets(days = 30, seed = 2026): HistoricalBet[] {
  const rand = mulberry32(seed);
  const bets: HistoricalBet[] = [];
  const now = Date.now();

  for (let d = days - 1; d >= 0; d--) {
    const date = new Date(now - d * 86_400_000);
    // 3-6 bets per day
    const n = 3 + Math.floor(rand() * 4);
    for (let i = 0; i < n; i++) {
      const roll = rand();
      const category: BetCategory = roll < 0.4 ? "safe" : roll < 0.8 ? "balanced" : "value";
      const prof = PROFILES[category];
      const odd = +(prof.oddMin + rand() * (prof.oddMax - prof.oddMin)).toFixed(2);
      const implied = 1 / odd;
      const estimatedProb = Math.min(0.95, implied + prof.hitBias + (rand() - 0.5) * 0.04);
      const stake =
        category === "safe" ? 20 + Math.floor(rand() * 15) : category === "balanced" ? 10 + Math.floor(rand() * 10) : 5 + Math.floor(rand() * 5);
      const win = rand() < estimatedProb;
      const market = MARKETS[Math.floor(rand() * MARKETS.length)];
      const league = LEAGUES[Math.floor(rand() * LEAGUES.length)];
      const profit = win ? +(stake * (odd - 1)).toFixed(2) : -stake;
      bets.push({
        id: `hist-${d}-${i}`,
        date: date.toISOString(),
        league,
        category,
        market,
        label: MARKET_LABELS[market],
        odd,
        estimatedProb,
        stake,
        outcome: win ? "win" : "loss",
        profit,
      });
    }
  }
  return bets.sort((a, b) => +new Date(a.date) - +new Date(b.date));
}
