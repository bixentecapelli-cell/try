import type { Match, League, WinamaxOdds } from "@/types";

// ============================================================================
// The Odds API adapter (https://the-odds-api.com)
// ----------------------------------------------------------------------------
// Free tier: 500 requests/month, European books included (Winamax, Unibet,
// Betfair, Bwin, Betclic, Pinnacle…). Needs a free API key set in the env
// var ODDS_API_KEY.
//
// We hit the aggregated endpoint:
//   GET /v4/sports/{sportKey}/odds/?apiKey=...&regions=eu&markets=h2h,totals
//
// Response (abridged):
//   [
//     {
//       id: "abc123",
//       sport_key: "soccer_france_ligue_one",
//       commence_time: "2026-10-01T19:00:00Z",
//       home_team: "Paris SG",
//       away_team: "FC Metz",
//       bookmakers: [
//         {
//           key: "winamax", title: "Winamax",
//           markets: [
//             { key: "h2h", outcomes: [{name: "Paris SG", price: 1.22}, ...] },
//             { key: "totals", outcomes: [{name: "Over", price: 1.42, point: 2.5}, ...] },
//             { key: "btts", outcomes: [{name: "Yes", price: 1.95}, ...] }
//           ]
//         },
//         ...
//       ]
//     }
//   ]
// ============================================================================

const SPORT_KEYS: Record<string, League> = {
  // Ligues domestiques
  soccer_france_ligue_one: "Ligue 1",
  soccer_epl: "Premier League",
  soccer_spain_la_liga: "La Liga",
  soccer_italy_serie_a: "Serie A",
  soccer_germany_bundesliga: "Bundesliga",
  // Compétitions UEFA inter-clubs
  soccer_uefa_champs_league: "Champions League",
  soccer_uefa_europa_league: "Europa League",
  // Sélections nationales
  soccer_uefa_nations_league: "Nations League",
  soccer_fifa_world_cup_qualifiers_europe: "Qualif. Coupe du Monde",
  soccer_uefa_european_championship_qualifiers: "Qualif. Euro",
};

const PREFERRED_BOOK = "winamax";
const BOOK_FALLBACKS = ["unibet_eu", "betclic", "pinnacle", "bwin", "marathonbet"];
const TIMEOUT_MS = 8_000;

interface OddsApiEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    key: string;
    title: string;
    last_update: string;
    markets: Array<{
      key: string;
      outcomes: Array<{ name: string; price: number; point?: number }>;
    }>;
  }>;
}

async function fetchWithTimeout(url: string): Promise<OddsApiEvent[] | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      console.warn(`[odds-api] ${url.split("?")[0]} → HTTP ${res.status}`);
      return null;
    }
    return (await res.json()) as OddsApiEvent[];
  } catch (err) {
    console.warn("[odds-api] fetch failed:", (err as Error).message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function pickBookmaker(event: OddsApiEvent) {
  const byKey = (k: string) => event.bookmakers.find((b) => b.key === k);
  return (
    byKey(PREFERRED_BOOK) ??
    BOOK_FALLBACKS.map(byKey).find(Boolean) ??
    event.bookmakers[0]
  );
}

function extractOdds(event: OddsApiEvent): WinamaxOdds | null {
  const book = pickBookmaker(event);
  if (!book) return null;

  const h2h = book.markets.find((m) => m.key === "h2h");
  const totals = book.markets.find((m) => m.key === "totals");
  const btts = book.markets.find((m) => m.key === "btts");

  if (!h2h) return null;

  const home = h2h.outcomes.find((o) => o.name === event.home_team)?.price;
  const away = h2h.outcomes.find((o) => o.name === event.away_team)?.price;
  const draw = h2h.outcomes.find((o) => o.name === "Draw")?.price;
  if (!home || !away || !draw) return null;

  // Totals: find both 1.5 and 2.5 lines
  const find = (point: number, label: "Over" | "Under") =>
    totals?.outcomes.find((o) => o.name === label && o.point === point)?.price;

  const o15 = find(1.5, "Over");
  const u15 = find(1.5, "Under");
  const o25 = find(2.5, "Over");
  const u25 = find(2.5, "Under");

  const btts_yes = btts?.outcomes.find((o) => o.name === "Yes")?.price;
  const btts_no = btts?.outcomes.find((o) => o.name === "No")?.price;

  return {
    "1": home,
    N: draw,
    "2": away,
    O1_5: o15 ?? 1.3,
    U1_5: u15 ?? 3.5,
    O2_5: o25 ?? 1.9,
    U2_5: u25 ?? 1.9,
    BTTS_YES: btts_yes ?? 1.9,
    BTTS_NO: btts_no ?? 1.9,
  };
}

function stubTeam(name: string, league: League) {
  return {
    id: `oa-${league}-${name}`.toLowerCase().replace(/\s+/g, "-"),
    name,
    league,
    last5: [] as never[],
    last10: [] as never[],
    homePPG: 1.5,
    awayPPG: 1.2,
    xgFor: 1.4,
    xgAgainst: 1.2,
    goalsFor: 0,
    goalsAgainst: 0,
    restDays: 7,
    keyAbsences: 0,
    motivation: 60,
  };
}

/**
 * Fetches real odds for the configured leagues and returns them as Match
 * shells. Returns `null` if no API key is set OR all leagues failed.
 */
export async function fetchOddsApiMatches(): Promise<Match[] | null> {
  const key = process.env.ODDS_API_KEY;
  if (!key) return null;

  const horizonMs = 72 * 3600 * 1000; // next 3 days
  const now = Date.now();

  const perSport = await Promise.all(
    Object.entries(SPORT_KEYS).map(async ([sportKey, league]) => {
      const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${encodeURIComponent(
        key,
      )}&regions=eu&markets=h2h,totals,btts&oddsFormat=decimal`;
      const events = await fetchWithTimeout(url);
      if (!events) return [];

      const matches: Match[] = [];
      for (const ev of events) {
        const commence = new Date(ev.commence_time).getTime();
        if (commence < now || commence > now + horizonMs) continue;

        const odds = extractOdds(ev);
        if (!odds) continue;

        matches.push({
          id: `oa-${ev.id}`,
          league,
          kickoff: ev.commence_time,
          home: stubTeam(ev.home_team, league),
          away: stubTeam(ev.away_team, league),
          h2h: {
            matchesPlayed: 0,
            homeWins: 0,
            draws: 0,
            awayWins: 0,
            avgGoals: 0,
            bttsRate: 0,
          },
          odds,
        });
      }
      return matches;
    }),
  );

  const flat = perSport.flat().sort((a, b) => +new Date(a.kickoff) - +new Date(b.kickoff));
  return flat.length > 0 ? flat : null;
}
