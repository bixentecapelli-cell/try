import type {
  FormResult,
  Match,
  MarketPrediction,
  MarketKey,
  TeamStats,
  WinamaxOdds,
} from "@/types";
import { MARKET_LABELS } from "@/types";

// ============================================================================
// Winamax Bet Analyzer — predictive scoring engine
// ----------------------------------------------------------------------------
// The engine blends 9 weighted factors (recent form, home/away, H2H, xG,
// line-up, fatigue, stakes, refereeing, weather) into a Poisson-based goals
// expectation per team. From that expectation we derive calibrated
// probabilities for every exposed market and compare them to the Winamax
// implied probability (devigged) to compute the Expected Value (EV).
// ============================================================================

// --- Factor weights (sum == 1.0) --------------------------------------------
export const FACTOR_WEIGHTS = {
  form: 0.18,
  homeAway: 0.14,
  h2h: 0.08,
  lineup: 0.14,
  xg: 0.2,
  fatigue: 0.08,
  motivation: 0.08,
  referee: 0.05,
  weather: 0.05,
} as const;

// ----------------------------------------------------------------------------
// Low-level helpers
// ----------------------------------------------------------------------------

function pointsFromForm(form: FormResult[]): number {
  if (!form.length) return 1.5;
  const pts = form.reduce((acc, r) => acc + (r === "W" ? 3 : r === "D" ? 1 : 0), 0);
  return pts / form.length; // 0 - 3
}

function momentum(form: FormResult[]): number {
  // Weighted most-recent-first streak: last match counts most
  let score = 0;
  let weight = 0;
  form.forEach((r, i) => {
    const w = 1 / (i + 1);
    const v = r === "W" ? 1 : r === "D" ? 0 : -1;
    score += v * w;
    weight += w;
  });
  return weight === 0 ? 0 : score / weight; // -1 .. +1
}

function xgEfficiency(team: TeamStats): number {
  // positive = clinical finisher, negative = underperforming
  const n = Math.max(team.last10.length, 1);
  const expectedGoals = team.xgFor * n;
  const expectedConceded = team.xgAgainst * n;
  const scoredDelta = team.goalsFor - expectedGoals;
  const concededDelta = expectedConceded - team.goalsAgainst;
  return (scoredDelta + concededDelta) / (2 * n); // ~ -1 .. +1
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

// ----------------------------------------------------------------------------
// Factor computation
// ----------------------------------------------------------------------------

export interface FactorBreakdown {
  form: number;
  homeAway: number;
  h2h: number;
  lineup: number;
  xg: number;
  fatigue: number;
  motivation: number;
  referee: number;
  weather: number;
}

export interface TeamStrength {
  attack: number; // ~ goals expected
  defense: number; // ~ goals conceded expected (lower is better)
  edge: number; // -1 (clearly weaker) .. +1 (clearly stronger)
  breakdown: FactorBreakdown;
}

export function computeTeamEdges(match: Match): {
  home: TeamStrength;
  away: TeamStrength;
} {
  const { home, away, h2h, referee, weather } = match;

  // 1. Form (last 5 weighted, last 10 as context) ----------------------------
  const homeForm = pointsFromForm(home.last5) * 0.6 + pointsFromForm(home.last10) * 0.4;
  const awayForm = pointsFromForm(away.last5) * 0.6 + pointsFromForm(away.last10) * 0.4;
  const homeMomentum = momentum(home.last5);
  const awayMomentum = momentum(away.last5);
  // Normalize to -1 .. +1 by comparing to the opponent
  const formDelta = (homeForm - awayForm) / 3 + (homeMomentum - awayMomentum) * 0.3;

  // 2. Home / Away split -----------------------------------------------------
  const homeAdvantage = (home.homePPG - away.awayPPG) / 3; // -1 .. +1 approx

  // 3. H2H -------------------------------------------------------------------
  let h2hEdge = 0;
  if (h2h.matchesPlayed > 0) {
    h2hEdge = (h2h.homeWins - h2h.awayWins) / h2h.matchesPlayed;
  }

  // 4. Line-up (key absences) ------------------------------------------------
  // Each missing key player ~ 3% impact on strength
  const lineupEdge = clamp((away.keyAbsences - home.keyAbsences) * 0.06, -0.5, 0.5);

  // 5. xG efficiency ---------------------------------------------------------
  const xgEdge = clamp(xgEfficiency(home) - xgEfficiency(away), -1, 1);

  // 6. Fatigue (rest days differential) -------------------------------------
  const fatigueEdge = clamp((home.restDays - away.restDays) / 10, -0.5, 0.5);

  // 7. Motivation ------------------------------------------------------------
  const motivationEdge = clamp((home.motivation - away.motivation) / 100, -0.5, 0.5);

  // 8. Referee (lenient refs favour attacking home sides slightly) ----------
  let refereeEdge = 0;
  if (referee) {
    const cardBias = (referee.avgCards - 4.0) / 10; // -0.4 .. +0.4
    refereeEdge = -cardBias * 0.3; // strict refs penalise aggressive travellers
  }

  // 9. Weather --------------------------------------------------------------
  let weatherEdge = 0;
  if (weather) {
    if (weather.condition === "rain" || weather.condition === "snow") weatherEdge = -0.1;
    if (weather.windKmh > 40) weatherEdge -= 0.1;
    // Extreme weather favours the home crowd (slightly)
    weatherEdge += 0.05;
  }

  const breakdown: FactorBreakdown = {
    form: formDelta,
    homeAway: homeAdvantage,
    h2h: h2hEdge,
    lineup: lineupEdge,
    xg: xgEdge,
    fatigue: fatigueEdge,
    motivation: motivationEdge,
    referee: refereeEdge,
    weather: weatherEdge,
  };

  // Weighted sum -> global home edge in [-1, +1]
  const homeEdge = clamp(
    breakdown.form * FACTOR_WEIGHTS.form +
      breakdown.homeAway * FACTOR_WEIGHTS.homeAway +
      breakdown.h2h * FACTOR_WEIGHTS.h2h +
      breakdown.lineup * FACTOR_WEIGHTS.lineup +
      breakdown.xg * FACTOR_WEIGHTS.xg +
      breakdown.fatigue * FACTOR_WEIGHTS.fatigue +
      breakdown.motivation * FACTOR_WEIGHTS.motivation +
      breakdown.referee * FACTOR_WEIGHTS.referee +
      breakdown.weather * FACTOR_WEIGHTS.weather,
    -1,
    1,
  );

  // Convert xG baselines + edge into attack / defense expectations
  // Base: each side's season xG, modulated by home advantage + global edge
  const baseHome = (home.xgFor + away.xgAgainst) / 2;
  const baseAway = (away.xgFor + home.xgAgainst) / 2;

  const homeAttack = clamp(baseHome * (1 + 0.5 * homeEdge) + 0.15, 0.2, 4);
  const awayAttack = clamp(baseAway * (1 - 0.5 * homeEdge) - 0.05, 0.1, 4);

  // Build mirrored breakdown for the away team
  const awayBreakdown: FactorBreakdown = {
    form: -breakdown.form,
    homeAway: -breakdown.homeAway,
    h2h: -breakdown.h2h,
    lineup: -breakdown.lineup,
    xg: -breakdown.xg,
    fatigue: -breakdown.fatigue,
    motivation: -breakdown.motivation,
    referee: -breakdown.referee,
    weather: -breakdown.weather,
  };

  return {
    home: {
      attack: homeAttack,
      defense: awayAttack,
      edge: homeEdge,
      breakdown,
    },
    away: {
      attack: awayAttack,
      defense: homeAttack,
      edge: -homeEdge,
      breakdown: awayBreakdown,
    },
  };
}

// ----------------------------------------------------------------------------
// Poisson market derivation
// ----------------------------------------------------------------------------

function poisson(k: number, lambda: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  let fact = 1;
  for (let i = 2; i <= k; i++) fact *= i;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / fact;
}

/** Returns a 2D score probability matrix up to maxGoals, inclusive. */
function scoreMatrix(lambdaHome: number, lambdaAway: number, maxGoals = 8): number[][] {
  const m: number[][] = [];
  for (let i = 0; i <= maxGoals; i++) {
    m[i] = [];
    for (let j = 0; j <= maxGoals; j++) {
      m[i][j] = poisson(i, lambdaHome) * poisson(j, lambdaAway);
    }
  }
  return m;
}

export interface DerivedProbabilities {
  "1": number;
  N: number;
  "2": number;
  "1X": number;
  X2: number;
  "12": number;
  O1_5: number;
  U1_5: number;
  O2_5: number;
  U2_5: number;
  BTTS_YES: number;
  BTTS_NO: number;
  expectedGoalsHome: number;
  expectedGoalsAway: number;
}

export function deriveProbabilities(home: TeamStrength, away: TeamStrength): DerivedProbabilities {
  const lh = home.attack;
  const la = away.attack;
  const grid = scoreMatrix(lh, la);

  let pHome = 0;
  let pDraw = 0;
  let pAway = 0;
  let pOver1_5 = 0;
  let pOver2_5 = 0;
  let pBTTS = 0;

  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      const p = grid[i][j];
      if (i > j) pHome += p;
      else if (i === j) pDraw += p;
      else pAway += p;
      const total = i + j;
      if (total >= 2) pOver1_5 += p;
      if (total >= 3) pOver2_5 += p;
      if (i >= 1 && j >= 1) pBTTS += p;
    }
  }

  return {
    "1": pHome,
    N: pDraw,
    "2": pAway,
    "1X": pHome + pDraw,
    X2: pDraw + pAway,
    "12": pHome + pAway,
    O1_5: pOver1_5,
    U1_5: 1 - pOver1_5,
    O2_5: pOver2_5,
    U2_5: 1 - pOver2_5,
    BTTS_YES: pBTTS,
    BTTS_NO: 1 - pBTTS,
    expectedGoalsHome: lh,
    expectedGoalsAway: la,
  };
}

// ----------------------------------------------------------------------------
// Devig implied probabilities (remove bookmaker margin)
// ----------------------------------------------------------------------------

export function devigImplied(odds: WinamaxOdds): Record<MarketKey, number> {
  const inv = {
    "1": 1 / odds["1"],
    N: 1 / odds.N,
    "2": 1 / odds["2"],
    O1_5: 1 / odds.O1_5,
    U1_5: 1 / odds.U1_5,
    O2_5: 1 / odds.O2_5,
    U2_5: 1 / odds.U2_5,
    BTTS_YES: 1 / odds.BTTS_YES,
    BTTS_NO: 1 / odds.BTTS_NO,
  };

  const match1x2 = inv["1"] + inv.N + inv["2"];
  const overUnder15 = inv.O1_5 + inv.U1_5;
  const overUnder25 = inv.O2_5 + inv.U2_5;
  const btts = inv.BTTS_YES + inv.BTTS_NO;

  return {
    "1": inv["1"] / match1x2,
    N: inv.N / match1x2,
    "2": inv["2"] / match1x2,
    "1X": (inv["1"] + inv.N) / match1x2,
    X2: (inv.N + inv["2"]) / match1x2,
    "12": (inv["1"] + inv["2"]) / match1x2,
    O1_5: inv.O1_5 / overUnder15,
    U1_5: inv.U1_5 / overUnder15,
    O2_5: inv.O2_5 / overUnder25,
    U2_5: inv.U2_5 / overUnder25,
    BTTS_YES: inv.BTTS_YES / btts,
    BTTS_NO: inv.BTTS_NO / btts,
  };
}

// ----------------------------------------------------------------------------
// Confidence scoring (1-5 stars)
// ----------------------------------------------------------------------------

function confidenceFromMatch(match: Match, edgeMagnitude: number): 1 | 2 | 3 | 4 | 5 {
  let score = 0;
  // Data availability bonuses
  if (match.home.last10.length >= 10 && match.away.last10.length >= 10) score += 1;
  if (match.h2h.matchesPlayed >= 3) score += 1;
  if (match.home.keyAbsences <= 1 && match.away.keyAbsences <= 1) score += 1;
  if (match.referee) score += 0.5;
  if (match.weather) score += 0.5;
  // Edge strength bonus
  score += clamp(edgeMagnitude * 4, 0, 2);
  const rounded = Math.max(1, Math.min(5, Math.round(score)));
  return rounded as 1 | 2 | 3 | 4 | 5;
}

// ----------------------------------------------------------------------------
// Rationale generation
// ----------------------------------------------------------------------------

function buildRationale(
  match: Match,
  market: MarketKey,
  home: TeamStrength,
  away: TeamStrength,
): string[] {
  const r: string[] = [];
  const b = home.breakdown;
  const side =
    market === "1" || market === "1X" ? match.home.name : market === "2" || market === "X2" ? match.away.name : null;

  if (Math.abs(b.form) > 0.1) {
    const better = b.form > 0 ? match.home.name : match.away.name;
    r.push(`Dynamique récente favorable à ${better}`);
  }
  if (Math.abs(b.xg) > 0.1) {
    const better = b.xg > 0 ? match.home.name : match.away.name;
    r.push(`Supériorité statistique xG pour ${better}`);
  }
  if (Math.abs(b.lineup) > 0.08) {
    const impacted = b.lineup > 0 ? match.away.name : match.home.name;
    r.push(`Effectif diminué côté ${impacted}`);
  }
  if (b.homeAway > 0.15) r.push(`Forteresse à domicile pour ${match.home.name}`);
  if (b.homeAway < -0.15) r.push(`${match.away.name} performe à l'extérieur`);
  if (Math.abs(b.fatigue) > 0.1) {
    const fresher = b.fatigue > 0 ? match.home.name : match.away.name;
    r.push(`Avantage fraîcheur pour ${fresher}`);
  }
  if (Math.abs(b.motivation) > 0.15) {
    const hungrier = b.motivation > 0 ? match.home.name : match.away.name;
    r.push(`Enjeu majeur pour ${hungrier}`);
  }
  if (market === "O2_5" && home.attack + away.attack > 2.8) {
    r.push(`Attaques prolifiques des deux côtés`);
  }
  if (market === "BTTS_YES" && home.attack > 1.1 && away.attack > 1.1) {
    r.push(`Deux équipes qui marquent régulièrement`);
  }
  if (side && r.length === 0) {
    r.push(`Convergence modérée en faveur de ${side}`);
  }
  return r.slice(0, 4);
}

// ----------------------------------------------------------------------------
// Public API: analyze a single match
// ----------------------------------------------------------------------------

export function analyzeMatch(match: Match): {
  home: TeamStrength;
  away: TeamStrength;
  derived: DerivedProbabilities;
  predictions: MarketPrediction[];
} {
  const { home, away } = computeTeamEdges(match);
  const derived = deriveProbabilities(home, away);
  const implied = devigImplied(match.odds);

  const markets: MarketKey[] = [
    "1",
    "N",
    "2",
    "1X",
    "X2",
    "12",
    "O1_5",
    "U1_5",
    "O2_5",
    "U2_5",
    "BTTS_YES",
    "BTTS_NO",
  ];

  const oddFor = (m: MarketKey): number | undefined => {
    switch (m) {
      case "1":
      case "N":
      case "2":
      case "O1_5":
      case "U1_5":
      case "O2_5":
      case "U2_5":
      case "BTTS_YES":
      case "BTTS_NO":
        return match.odds[m];
      case "1X":
        return 1 / (1 / match.odds["1"] + 1 / match.odds.N);
      case "X2":
        return 1 / (1 / match.odds.N + 1 / match.odds["2"]);
      case "12":
        return 1 / (1 / match.odds["1"] + 1 / match.odds["2"]);
    }
  };

  const edgeMagnitude = Math.abs(home.edge);

  const predictions: MarketPrediction[] = markets.map((m) => {
    const odd = oddFor(m)!;
    const estimated = derived[m];
    const impliedProb = implied[m];
    const ev = estimated * odd - 1;
    const edge = estimated - impliedProb;
    const confidence = confidenceFromMatch(match, edgeMagnitude);
    return {
      market: m,
      label: MARKET_LABELS[m],
      odd,
      impliedProb,
      estimatedProb: estimated,
      ev,
      edge,
      confidence,
      rationale: buildRationale(match, m, home, away),
    };
  });

  return { home, away, derived, predictions };
}

// ----------------------------------------------------------------------------
// Public API: safe + value picks
// ----------------------------------------------------------------------------

/**
 * Safe pick: highest estimated probability with odd between 1.15 and 1.60.
 * We require a minimum edge above the devigged line so we only serve bets the
 * model actually agrees with.
 */
export function pickSafeBet(predictions: MarketPrediction[]): MarketPrediction | undefined {
  return predictions
    .filter((p) => p.odd >= 1.15 && p.odd <= 1.6 && p.edge >= 0.02 && p.estimatedProb >= 0.7)
    .sort((a, b) => b.estimatedProb - a.estimatedProb)[0];
}

/**
 * Value pick: highest EV, odd above 2.5, estimated edge > 5 pts.
 */
export function pickValueBet(predictions: MarketPrediction[]): MarketPrediction | undefined {
  return predictions
    .filter((p) => p.odd >= 2.5 && p.edge >= 0.05)
    .sort((a, b) => b.ev - a.ev)[0];
}
