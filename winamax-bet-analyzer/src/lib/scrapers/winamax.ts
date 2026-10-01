import type { Match } from "@/types";
import { MOCK_MATCHES } from "@/lib/data/mock";

// ============================================================================
// Winamax data source — swappable adapter.
// ----------------------------------------------------------------------------
// Right now this returns the deterministic mock dataset so the dashboard works
// out of the box. In Phase 4 we'll back it with a real scraper that hits
// Winamax's internal JSON endpoints (observed on the Winamax Sport sections)
// with the following contract:
//
//   fetchFootballMatches({ leagues?: League[], from?: Date, to?: Date }): Promise<Match[]>
//
// Implementation plan for the real adapter (Phase 4):
//   1. HTTP: use Playwright in headless mode OR direct fetch to the Winamax
//      sports JSON feed (e.g. https://www.winamax.fr/sports-nj/sports/<id>)
//      with the usual browser headers (User-Agent, Accept-Language fr-FR,
//      Referer, X-Requested-With) and a shared cookie jar.
//   2. Rate limiting: a token bucket (1 req / 2s per host) + exponential
//      backoff on 429/503. Guard clauses on any failed status so we never
//      silently corrupt the odds board.
//   3. Normalisation: map Winamax market IDs ("Résultat du match", "Nombre
//      total de buts (plus/moins)", "Les deux équipes marquent") to our
//      MarketKey enum. Store the raw payload alongside for audit.
//   4. Caching: write every snapshot to the DB (Prisma `OddsSnapshot` table)
//      with a (match_id, scraped_at) composite PK. The odds tracker and
//      backtester read from this history.
//   5. Fallback: if Winamax rate-limits us or changes its DOM, degrade
//      gracefully to Football-Data.org or API-Football to keep stats fresh
//      and expose a `source: "winamax" | "fallback"` field.
// ============================================================================

export type MatchSource = "winamax" | "fallback" | "mock";

export interface FetchOptions {
  leagues?: string[];
  from?: Date;
  to?: Date;
}

interface CacheEntry {
  fetchedAt: number;
  data: Match[];
}

const TTL_MS = 60_000; // 1 minute in-memory cache
let cache: CacheEntry | null = null;

/**
 * Returns the current matchday fixtures with Winamax odds. In this iteration
 * (Phase 2) it delegates to the mock dataset; the signature stays stable so
 * the UI never has to change when we flip the switch to real scraping.
 */
export async function fetchFootballMatches(opts: FetchOptions = {}): Promise<{
  matches: Match[];
  source: MatchSource;
  fetchedAt: number;
}> {
  const filtered = opts.leagues?.length
    ? MOCK_MATCHES.filter((m) => opts.leagues!.includes(m.league))
    : MOCK_MATCHES;

  if (cache && Date.now() - cache.fetchedAt < TTL_MS) {
    return { matches: cache.data, source: "mock", fetchedAt: cache.fetchedAt };
  }
  cache = { fetchedAt: Date.now(), data: filtered };
  return { matches: filtered, source: "mock", fetchedAt: cache.fetchedAt };
}

export function invalidateCache() {
  cache = null;
}
