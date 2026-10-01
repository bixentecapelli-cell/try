// ============================================================================
// Core domain types for the Winamax Bet Analyzer
// ============================================================================

export type League =
  | "Ligue 1"
  | "Premier League"
  | "La Liga"
  | "Serie A"
  | "Bundesliga"
  | "Champions League"
  | "Europa League"
  | "Nations League"
  | "Qualif. Coupe du Monde"
  | "Qualif. Euro";

export type MarketKey =
  | "1" // home win
  | "N" // draw
  | "2" // away win
  | "1X" // double chance home or draw
  | "X2" // double chance draw or away
  | "12" // double chance no draw
  | "O1_5" // over 1.5
  | "U1_5" // under 1.5
  | "O2_5" // over 2.5
  | "U2_5" // under 2.5
  | "BTTS_YES"
  | "BTTS_NO";

export const MARKET_LABELS: Record<MarketKey, string> = {
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

export type FormResult = "W" | "D" | "L";

export interface TeamStats {
  id: string;
  name: string;
  logo?: string;
  league: League;
  // Last 5 and 10 matches outcomes, most recent first
  last5: FormResult[];
  last10: FormResult[];
  // Home / away split performance (points per match)
  homePPG: number; // points per home match (0-3)
  awayPPG: number; // points per away match (0-3)
  // xG metrics (per match averages)
  xgFor: number;
  xgAgainst: number;
  // Efficiency: actual goals - xG (positive = clinical, negative = underperforming)
  goalsFor: number;
  goalsAgainst: number;
  // Rest days since last match
  restDays: number;
  // Count of key players unavailable (injured / suspended)
  keyAbsences: number;
  // 0-100 stake importance: 100 = title or relegation decider, 50 = normal, 20 = dead rubber
  motivation: number;
}

export interface HeadToHead {
  matchesPlayed: number;
  homeWins: number;
  draws: number;
  awayWins: number;
  avgGoals: number;
  bttsRate: number; // 0-1
}

export interface Referee {
  name: string;
  avgCards: number;
  avgPenalties: number;
}

export interface Weather {
  condition: "clear" | "rain" | "snow" | "wind" | "fog";
  tempC: number;
  windKmh: number;
}

export interface WinamaxOdds {
  "1": number;
  N: number;
  "2": number;
  O1_5: number;
  U1_5: number;
  O2_5: number;
  U2_5: number;
  BTTS_YES: number;
  BTTS_NO: number;
  // Derived (optional)
  "1X"?: number;
  X2?: number;
  "12"?: number;
  // Odds trend: percent change in the last 24h on the "1" market
  trend1?: number;
  trendN?: number;
  trend2?: number;
}

export interface Match {
  id: string;
  league: League;
  kickoff: string; // ISO
  stadium?: string;
  home: TeamStats;
  away: TeamStats;
  h2h: HeadToHead;
  referee?: Referee;
  weather?: Weather;
  odds: WinamaxOdds;
}

// ----------------------------------------------------------------------------
// Prediction output
// ----------------------------------------------------------------------------

export interface MarketPrediction {
  market: MarketKey;
  label: string;
  odd: number;
  impliedProb: number; // 1 / odd (normalized by removing book margin)
  estimatedProb: number; // model probability
  ev: number; // expected value = p * odd - 1
  edge: number; // estimatedProb - impliedProb
  confidence: 1 | 2 | 3 | 4 | 5; // data quality / signal confluence (1-5 stars)
  rationale: string[]; // short bullet points
}

export interface MatchPrediction {
  matchId: string;
  predictions: MarketPrediction[];
  topSafe?: MarketPrediction;
  topValue?: MarketPrediction;
  confidence: 1 | 2 | 3 | 4 | 5;
  featuredRationale: string;
}

// ----------------------------------------------------------------------------
// Combined bet (accumulator)
// ----------------------------------------------------------------------------

export type RiskProfile = "safe" | "balanced" | "fun";

export interface AccumulatorLeg {
  match: Match;
  prediction: MarketPrediction;
}

export interface Accumulator {
  profile: RiskProfile;
  legs: AccumulatorLeg[];
  totalOdd: number;
  combinedProb: number;
  combinedEV: number;
  label: string;
}
