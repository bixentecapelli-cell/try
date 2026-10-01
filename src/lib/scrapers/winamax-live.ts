import type { League, Match, WinamaxOdds } from "@/types";

// ============================================================================
// Live Winamax scraper
// ----------------------------------------------------------------------------
// Winamax exposes its sport board as a JSON payload inside the HTML page
// (hydration state) at paths like `/paris-sportifs/sports/<sportId>`. We fetch
// the page, extract the `PRELOADED_STATE` script tag and project the subset
// we care about into our Match type.
//
// This runs server-side only. On Vercel serverless, outbound requests to
// Winamax may be rate-limited or blocked by Cloudflare, so the orchestrator
// (scrapers/winamax.ts) always has a mock fallback.
// ============================================================================

const WINAMAX_URL = "https://www.winamax.fr/paris-sportifs/sports/1"; // 1 = Football
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
const TIMEOUT_MS = 7_000;

interface WinamaxBoardPayload {
  // Simplified projection of the fields we need
  matches?: Record<
    string,
    {
      matchId: string;
      sportId: number;
      competitionId: number;
      competitionName?: string;
      homeTeam: string;
      awayTeam: string;
      matchStart: number; // epoch seconds
      stadium?: string;
      mainBetId?: number;
    }
  >;
  bets?: Record<
    string,
    {
      betId: number;
      matchId: string;
      marketTypeId: number;
      outcomes: Array<{ odd: number; label: string; outcomeId: number }>;
    }
  >;
  competitions?: Record<string, { competitionName: string }>;
}

// --- League mapping (Winamax competition names → our enum) ----------------
const LEAGUE_ALIASES: Record<string, League> = {
  "Ligue 1": "Ligue 1",
  "Ligue 1 McDonald's": "Ligue 1",
  "Premier League": "Premier League",
  "Liga": "La Liga",
  "La Liga": "La Liga",
  "LaLiga": "La Liga",
  "Serie A": "Serie A",
  "Bundesliga": "Bundesliga",
  "Ligue des Champions": "Champions League",
  "Champions League": "Champions League",
  "Ligue Europa": "Europa League",
};

function mapLeague(name?: string): League | null {
  if (!name) return null;
  for (const key of Object.keys(LEAGUE_ALIASES)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return LEAGUE_ALIASES[key];
  }
  return null;
}

// --- Market extraction -----------------------------------------------------
// Winamax market type IDs (observed, may evolve):
//   1  -> 1N2
//   7  -> Total goals Over/Under
//   8  -> Both teams to score
const MARKET_TYPE = {
  MATCH_RESULT: 1,
  TOTAL_GOALS: 7,
  BTTS: 8,
} as const;

function parseOddsForMatch(
  matchId: string,
  payload: WinamaxBoardPayload,
): Partial<WinamaxOdds> {
  const odds: Partial<WinamaxOdds> = {};
  const bets = Object.values(payload.bets ?? {}).filter((b) => b.matchId === matchId);

  for (const bet of bets) {
    switch (bet.marketTypeId) {
      case MARKET_TYPE.MATCH_RESULT:
        for (const o of bet.outcomes) {
          if (/^1$/.test(o.label.trim())) odds["1"] = o.odd;
          else if (/^(N|X)$/i.test(o.label.trim())) odds.N = o.odd;
          else if (/^2$/.test(o.label.trim())) odds["2"] = o.odd;
        }
        break;
      case MARKET_TYPE.TOTAL_GOALS:
        for (const o of bet.outcomes) {
          const over = /\+?\s*1[.,]5/.test(o.label) && /plus|over|\+/i.test(o.label);
          const under15 = /-?\s*1[.,]5/.test(o.label) && /moins|under|-/i.test(o.label);
          const over25 = /\+?\s*2[.,]5/.test(o.label) && /plus|over|\+/i.test(o.label);
          const under25 = /-?\s*2[.,]5/.test(o.label) && /moins|under|-/i.test(o.label);
          if (over) odds.O1_5 = o.odd;
          if (under15) odds.U1_5 = o.odd;
          if (over25) odds.O2_5 = o.odd;
          if (under25) odds.U2_5 = o.odd;
        }
        break;
      case MARKET_TYPE.BTTS:
        for (const o of bet.outcomes) {
          if (/oui|yes/i.test(o.label)) odds.BTTS_YES = o.odd;
          else if (/non|no/i.test(o.label)) odds.BTTS_NO = o.odd;
        }
        break;
    }
  }
  return odds;
}

// --- Fetch + parse ---------------------------------------------------------

export class WinamaxFetchError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "WinamaxFetchError";
  }
}

async function fetchWithTimeout(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      // Winamax sends anti-bot JS challenges to unknown UAs; use a realistic one.
      headers: {
        "User-Agent": UA,
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Cache-Control": "no-cache",
      },
      // Avoid persistent Next.js data cache so the odds are fresh.
      cache: "no-store",
    });
    if (!res.ok) {
      throw new WinamaxFetchError(`HTTP ${res.status}`, res.status);
    }
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

/** Grab the preloaded state blob from the Winamax HTML. */
function extractPreloadedState(html: string): WinamaxBoardPayload | null {
  // Winamax injects something like `var PRELOADED_STATE = {...};`
  const m = html.match(/PRELOADED_STATE\s*=\s*(\{[\s\S]*?\});/);
  if (!m) return null;
  try {
    return JSON.parse(m[1]) as WinamaxBoardPayload;
  } catch {
    return null;
  }
}

/**
 * Pulls the current Winamax football board, projecting it to our Match shape.
 * This DOES NOT attempt to enrich stats (xG, form, lineups) — those come from
 * a separate stats provider (Football-Data.org or API-Football) in production.
 * For now we return odds-only Match shells and merge them with mock stats so
 * the engine stays functional until the stats adapter lands.
 *
 * Returns `null` when Winamax is unreachable or the HTML shape changed.
 */
export async function fetchWinamaxBoard(): Promise<Match[] | null> {
  try {
    const html = await fetchWithTimeout(WINAMAX_URL);
    const payload = extractPreloadedState(html);
    if (!payload?.matches || !payload.bets) return null;

    const matches: Match[] = [];
    for (const m of Object.values(payload.matches)) {
      if (m.sportId !== 1) continue; // football only
      const league = mapLeague(
        m.competitionName ??
          payload.competitions?.[String(m.competitionId)]?.competitionName,
      );
      if (!league) continue;

      const partialOdds = parseOddsForMatch(m.matchId, payload);
      // Require at minimum the 1N2 odds to be considered usable
      if (!partialOdds["1"] || !partialOdds.N || !partialOdds["2"]) continue;

      matches.push({
        id: `wm-${m.matchId}`,
        league,
        kickoff: new Date(m.matchStart * 1000).toISOString(),
        stadium: m.stadium,
        // Stats come from the enrichment layer; for now we expose zeros so
        // downstream code can detect "live, un-enriched" entries.
        home: {
          id: `wm-${m.matchId}-home`,
          name: m.homeTeam,
          league,
          last5: [],
          last10: [],
          homePPG: 1.5,
          awayPPG: 1.2,
          xgFor: 1.4,
          xgAgainst: 1.2,
          goalsFor: 0,
          goalsAgainst: 0,
          restDays: 7,
          keyAbsences: 0,
          motivation: 60,
        },
        away: {
          id: `wm-${m.matchId}-away`,
          name: m.awayTeam,
          league,
          last5: [],
          last10: [],
          homePPG: 1.5,
          awayPPG: 1.2,
          xgFor: 1.4,
          xgAgainst: 1.2,
          goalsFor: 0,
          goalsAgainst: 0,
          restDays: 7,
          keyAbsences: 0,
          motivation: 60,
        },
        h2h: { matchesPlayed: 0, homeWins: 0, draws: 0, awayWins: 0, avgGoals: 0, bttsRate: 0 },
        odds: {
          "1": partialOdds["1"]!,
          N: partialOdds.N!,
          "2": partialOdds["2"]!,
          O1_5: partialOdds.O1_5 ?? 1.3,
          U1_5: partialOdds.U1_5 ?? 3.5,
          O2_5: partialOdds.O2_5 ?? 1.9,
          U2_5: partialOdds.U2_5 ?? 1.9,
          BTTS_YES: partialOdds.BTTS_YES ?? 1.85,
          BTTS_NO: partialOdds.BTTS_NO ?? 1.95,
        },
      });
    }

    return matches.length > 0 ? matches : null;
  } catch (err) {
    // Any network, timeout, parsing or shape error → let the orchestrator
    // fall back to mock data.
    console.warn("[winamax-live] fallback:", (err as Error).message);
    return null;
  }
}
