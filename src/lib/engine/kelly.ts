// ============================================================================
// Kelly criterion & fractional Kelly bankroll sizing.
// ============================================================================

export interface KellyRecommendation {
  stakeFraction: number; // percentage of bankroll (0 - 1)
  stakeAmount: number; // bankroll * fraction
  edge: number; // model prob - implied prob
  verdict: "no-bet" | "small" | "standard" | "aggressive";
}

/**
 * Full Kelly stake fraction = (b * p - q) / b
 *   where b = odd - 1, p = win probability, q = 1 - p
 */
export function fullKellyFraction(prob: number, odd: number): number {
  const b = odd - 1;
  if (b <= 0) return 0;
  const q = 1 - prob;
  const f = (b * prob - q) / b;
  return Math.max(0, f);
}

/**
 * Fractional Kelly (default 1/4 Kelly) — safer in presence of model error.
 */
export function recommendStake(
  prob: number,
  odd: number,
  bankroll: number,
  impliedProb: number,
  fraction = 0.25,
): KellyRecommendation {
  const edge = prob - impliedProb;
  const kelly = fullKellyFraction(prob, odd);
  const stakeFraction = Math.min(0.1, kelly * fraction); // cap at 10% of bankroll
  const stakeAmount = Math.round(bankroll * stakeFraction * 100) / 100;

  let verdict: KellyRecommendation["verdict"];
  if (edge <= 0 || stakeFraction <= 0.002) verdict = "no-bet";
  else if (stakeFraction < 0.015) verdict = "small";
  else if (stakeFraction < 0.04) verdict = "standard";
  else verdict = "aggressive";

  return { stakeFraction, stakeAmount, edge, verdict };
}
