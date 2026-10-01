import type { Match, TeamStats, FormResult, League } from "@/types";

// ============================================================================
// Mock dataset — realistic parameters calibrated so the scoring engine returns
// coherent markets. Each match has a different narrative so the dashboard
// surfaces distinct Safe / Value / Featured picks.
// ============================================================================

function form(seq: string): FormResult[] {
  return seq.split("").map((c) => c as FormResult);
}

function team(
  id: string,
  name: string,
  league: League,
  overrides: Partial<TeamStats> = {},
): TeamStats {
  return {
    id,
    name,
    league,
    last5: form("WWDWW"),
    last10: form("WWDWWLDWWW"),
    homePPG: 2.0,
    awayPPG: 1.5,
    xgFor: 1.6,
    xgAgainst: 1.1,
    goalsFor: 15,
    goalsAgainst: 10,
    restDays: 7,
    keyAbsences: 0,
    motivation: 60,
    ...overrides,
  };
}

export const MOCK_MATCHES: Match[] = [
  // --------------------------------------------------------------------------
  // 1. "Safe Bet" scenario — PSG @ home vs a struggling side
  // --------------------------------------------------------------------------
  {
    id: "psg-metz-2026-10-02",
    league: "Ligue 1",
    kickoff: "2026-10-02T19:00:00Z",
    stadium: "Parc des Princes",
    home: team("psg", "Paris SG", "Ligue 1", {
      last5: form("WWWWW"),
      last10: form("WWWWWDWWWW"),
      homePPG: 2.8,
      awayPPG: 2.2,
      xgFor: 2.6,
      xgAgainst: 0.8,
      goalsFor: 28,
      goalsAgainst: 6,
      restDays: 4,
      keyAbsences: 1,
      motivation: 75,
    }),
    away: team("metz", "FC Metz", "Ligue 1", {
      last5: form("LLDLL"),
      last10: form("LLDLLWLLDL"),
      homePPG: 1.1,
      awayPPG: 0.5,
      xgFor: 0.9,
      xgAgainst: 2.1,
      goalsFor: 7,
      goalsAgainst: 22,
      restDays: 7,
      keyAbsences: 2,
      motivation: 55,
    }),
    h2h: { matchesPlayed: 6, homeWins: 5, draws: 1, awayWins: 0, avgGoals: 3.1, bttsRate: 0.3 },
    referee: { name: "Benoît Bastien", avgCards: 3.8, avgPenalties: 0.3 },
    weather: { condition: "clear", tempC: 18, windKmh: 12 },
    odds: {
      "1": 1.22,
      N: 7.0,
      "2": 12.0,
      O1_5: 1.15,
      U1_5: 5.5,
      O2_5: 1.42,
      U2_5: 2.85,
      BTTS_YES: 2.0,
      BTTS_NO: 1.78,
      trend1: -0.03,
      trend2: 0.08,
    },
  },

  // --------------------------------------------------------------------------
  // 2. "Value Bet" scenario — underpriced away team
  // --------------------------------------------------------------------------
  {
    id: "brighton-arsenal-2026-10-03",
    league: "Premier League",
    kickoff: "2026-10-03T15:00:00Z",
    stadium: "Amex Stadium",
    home: team("brighton", "Brighton", "Premier League", {
      last5: form("DLWLD"),
      last10: form("DLWLDWLDWL"),
      homePPG: 1.6,
      awayPPG: 1.3,
      xgFor: 1.5,
      xgAgainst: 1.4,
      goalsFor: 12,
      goalsAgainst: 14,
      restDays: 6,
      keyAbsences: 3,
      motivation: 55,
    }),
    away: team("arsenal", "Arsenal", "Premier League", {
      last5: form("WWWDW"),
      last10: form("WWWDWWDWWW"),
      homePPG: 2.4,
      awayPPG: 2.1,
      xgFor: 2.2,
      xgAgainst: 0.9,
      goalsFor: 24,
      goalsAgainst: 8,
      restDays: 3, // played Champions League Wednesday
      keyAbsences: 0,
      motivation: 85,
    }),
    h2h: { matchesPlayed: 8, homeWins: 2, draws: 2, awayWins: 4, avgGoals: 2.6, bttsRate: 0.75 },
    referee: { name: "Michael Oliver", avgCards: 4.4, avgPenalties: 0.4 },
    weather: { condition: "rain", tempC: 12, windKmh: 28 },
    odds: {
      "1": 3.5,
      N: 3.9,
      "2": 2.1, // model will say Arsenal should be shorter -> value on "2"
      O1_5: 1.25,
      U1_5: 3.8,
      O2_5: 1.72,
      U2_5: 2.1,
      BTTS_YES: 1.6,
      BTTS_NO: 2.3,
      trend1: 0.04,
      trend2: -0.09, // Winamax dropping Arsenal odds -> market agrees
    },
  },

  // --------------------------------------------------------------------------
  // 3. "Affiche du Jour" — Clasico-level fixture, balanced + tactical
  // --------------------------------------------------------------------------
  {
    id: "real-barca-2026-10-04",
    league: "La Liga",
    kickoff: "2026-10-04T20:00:00Z",
    stadium: "Santiago Bernabéu",
    home: team("real", "Real Madrid", "La Liga", {
      last5: form("WWWDW"),
      last10: form("WWWDWWWLWW"),
      homePPG: 2.6,
      awayPPG: 2.1,
      xgFor: 2.3,
      xgAgainst: 1.0,
      goalsFor: 22,
      goalsAgainst: 10,
      restDays: 5,
      keyAbsences: 1,
      motivation: 90,
    }),
    away: team("barca", "FC Barcelone", "La Liga", {
      last5: form("WWDWL"),
      last10: form("WWDWLWWDWW"),
      homePPG: 2.5,
      awayPPG: 1.9,
      xgFor: 2.4,
      xgAgainst: 1.2,
      goalsFor: 21,
      goalsAgainst: 11,
      restDays: 4,
      keyAbsences: 2,
      motivation: 90,
    }),
    h2h: { matchesPlayed: 10, homeWins: 4, draws: 2, awayWins: 4, avgGoals: 3.2, bttsRate: 0.8 },
    referee: { name: "Mateu Lahoz", avgCards: 5.9, avgPenalties: 0.5 },
    weather: { condition: "clear", tempC: 20, windKmh: 10 },
    odds: {
      "1": 2.1,
      N: 3.6,
      "2": 3.3,
      O1_5: 1.18,
      U1_5: 4.8,
      O2_5: 1.55,
      U2_5: 2.45,
      BTTS_YES: 1.42,
      BTTS_NO: 2.8,
    },
  },

  // --------------------------------------------------------------------------
  // 4. BTTS value pick — two attacking sides, bookmaker undervaluing yes
  // --------------------------------------------------------------------------
  {
    id: "dortmund-leverkusen-2026-10-03",
    league: "Bundesliga",
    kickoff: "2026-10-03T17:30:00Z",
    stadium: "Signal Iduna Park",
    home: team("dortmund", "Dortmund", "Bundesliga", {
      last5: form("WDWLW"),
      last10: form("WDWLWWDLWW"),
      homePPG: 2.3,
      awayPPG: 1.5,
      xgFor: 2.1,
      xgAgainst: 1.6,
      goalsFor: 20,
      goalsAgainst: 15,
      restDays: 7,
      keyAbsences: 1,
      motivation: 70,
    }),
    away: team("leverkusen", "Bayer Leverkusen", "Bundesliga", {
      last5: form("WWDLW"),
      last10: form("WWDLWWWDLW"),
      homePPG: 2.4,
      awayPPG: 1.8,
      xgFor: 2.0,
      xgAgainst: 1.3,
      goalsFor: 19,
      goalsAgainst: 12,
      restDays: 6,
      keyAbsences: 1,
      motivation: 75,
    }),
    h2h: { matchesPlayed: 8, homeWins: 3, draws: 3, awayWins: 2, avgGoals: 3.4, bttsRate: 0.88 },
    referee: { name: "Felix Zwayer", avgCards: 4.0, avgPenalties: 0.3 },
    weather: { condition: "clear", tempC: 15, windKmh: 15 },
    odds: {
      "1": 2.3,
      N: 3.5,
      "2": 3.0,
      O1_5: 1.2,
      U1_5: 4.3,
      O2_5: 1.5,
      U2_5: 2.6,
      BTTS_YES: 1.52,
      BTTS_NO: 2.5,
    },
  },

  // --------------------------------------------------------------------------
  // 5. UCL — rested home side vs tired traveller
  // --------------------------------------------------------------------------
  {
    id: "bayern-inter-2026-10-01",
    league: "Champions League",
    kickoff: "2026-10-01T19:00:00Z",
    stadium: "Allianz Arena",
    home: team("bayern", "Bayern Munich", "Champions League", {
      last5: form("WWWWW"),
      last10: form("WWWWWDWWWW"),
      homePPG: 2.7,
      awayPPG: 2.2,
      xgFor: 2.5,
      xgAgainst: 0.9,
      goalsFor: 26,
      goalsAgainst: 7,
      restDays: 6,
      keyAbsences: 0,
      motivation: 85,
    }),
    away: team("inter", "Inter Milan", "Champions League", {
      last5: form("WDLWD"),
      last10: form("WDLWDWWLDW"),
      homePPG: 2.2,
      awayPPG: 1.4,
      xgFor: 1.7,
      xgAgainst: 1.1,
      goalsFor: 17,
      goalsAgainst: 10,
      restDays: 2, // played Serie A on Sunday
      keyAbsences: 3,
      motivation: 70,
    }),
    h2h: { matchesPlayed: 4, homeWins: 2, draws: 1, awayWins: 1, avgGoals: 2.5, bttsRate: 0.5 },
    referee: { name: "Clément Turpin", avgCards: 4.2, avgPenalties: 0.3 },
    weather: { condition: "clear", tempC: 14, windKmh: 10 },
    odds: {
      "1": 1.55,
      N: 4.3,
      "2": 5.5,
      O1_5: 1.18,
      U1_5: 4.8,
      O2_5: 1.5,
      U2_5: 2.65,
      BTTS_YES: 1.7,
      BTTS_NO: 2.1,
    },
  },

  // --------------------------------------------------------------------------
  // 6. Low-event defensive battle — model loves U2.5
  // --------------------------------------------------------------------------
  {
    id: "atletico-sevilla-2026-10-04",
    league: "La Liga",
    kickoff: "2026-10-04T17:00:00Z",
    stadium: "Metropolitano",
    home: team("atletico", "Atlético Madrid", "La Liga", {
      last5: form("WDWDW"),
      last10: form("WDWDWDWDLW"),
      homePPG: 2.3,
      awayPPG: 1.6,
      xgFor: 1.3,
      xgAgainst: 0.8,
      goalsFor: 13,
      goalsAgainst: 7,
      restDays: 7,
      keyAbsences: 0,
      motivation: 70,
    }),
    away: team("sevilla", "FC Séville", "La Liga", {
      last5: form("DDDWL"),
      last10: form("DDDWLDLDLL"),
      homePPG: 1.5,
      awayPPG: 0.9,
      xgFor: 1.0,
      xgAgainst: 1.3,
      goalsFor: 8,
      goalsAgainst: 12,
      restDays: 7,
      keyAbsences: 2,
      motivation: 60,
    }),
    h2h: { matchesPlayed: 6, homeWins: 3, draws: 2, awayWins: 1, avgGoals: 1.9, bttsRate: 0.4 },
    referee: { name: "Jesús Gil Manzano", avgCards: 5.1, avgPenalties: 0.4 },
    weather: { condition: "clear", tempC: 22, windKmh: 8 },
    odds: {
      "1": 1.75,
      N: 3.6,
      "2": 5.0,
      O1_5: 1.42,
      U1_5: 2.85,
      O2_5: 2.4,
      U2_5: 1.57,
      BTTS_YES: 2.3,
      BTTS_NO: 1.6,
    },
  },
];
