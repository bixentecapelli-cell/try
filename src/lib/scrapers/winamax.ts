import type { Match } from "@/types";
import { MOCK_MATCHES } from "@/lib/data/mock";
import { fetchWinamaxBoard } from "./winamax-live";
import { recordSnapshot } from "@/lib/history/snapshots";

// ============================================================================
// Winamax data orchestrator
// ----------------------------------------------------------------------------
// Flow on every request (TTL 60s):
//   1. Try the live Winamax scraper (winamax-live.ts). Odds-only Match shells.
//   2. If it returns matches, merge them with the mock stats dataset by team
//      name so the scoring engine still has xG / form / H2H to chew on.
//   3. If live returns null (timeout, 403, DOM change, zero fixtures), fall
//      back to the full mock dataset.
//   4. Record the odds snapshot for the Odds Tracker and the backtester.
// ============================================================================

export type MatchSource = "winamax" | "mock" | "merged";

export interface FetchOptions {
  leagues?: string[];
  from?: Date;
  to?: Date;
  // When true, bypass the live scraper and only serve mock data (used in dev
  // and for deterministic screenshots).
  forceMock?: boolean;
}

interface CacheEntry {
  fetchedAt: number;
  data: Match[];
  source: MatchSource;
}

const TTL_MS = 60_000;
let cache: CacheEntry | null = null;

// Build an index of mock stats keyed by lowercased team name.
const MOCK_TEAM_INDEX = new Map<string, (typeof MOCK_MATCHES)[number]["home"]>();
for (const m of MOCK_MATCHES) {
  MOCK_TEAM_INDEX.set(m.home.name.toLowerCase(), m.home);
  MOCK_TEAM_INDEX.set(m.away.name.toLowerCase(), m.away);
}

function enrichWithMockStats(live: Match[]): Match[] {
  return live.map((m) => {
    const homeMock = MOCK_TEAM_INDEX.get(m.home.name.toLowerCase());
    const awayMock = MOCK_TEAM_INDEX.get(m.away.name.toLowerCase());
    return {
      ...m,
      home: homeMock ? { ...homeMock, name: m.home.name, id: m.home.id, league: m.league } : m.home,
      away: awayMock ? { ...awayMock, name: m.away.name, id: m.away.id, league: m.league } : m.away,
    };
  });
}

export async function fetchFootballMatches(opts: FetchOptions = {}): Promise<{
  matches: Match[];
  source: MatchSource;
  fetchedAt: number;
}> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < TTL_MS) {
    const filtered = opts.leagues?.length
      ? cache.data.filter((m) => opts.leagues!.includes(m.league))
      : cache.data;
    return { matches: filtered, source: cache.source, fetchedAt: cache.fetchedAt };
  }

  let data: Match[] = MOCK_MATCHES;
  let source: MatchSource = "mock";

  if (!opts.forceMock) {
    const live = await fetchWinamaxBoard();
    if (live && live.length > 0) {
      data = enrichWithMockStats(live);
      source = "merged";
    }
  }

  cache = { fetchedAt: now, data, source };

  // Fire-and-forget snapshot persistence
  try {
    recordSnapshot(data, now);
  } catch {
    /* best-effort */
  }

  const filtered = opts.leagues?.length
    ? data.filter((m) => opts.leagues!.includes(m.league))
    : data;

  return { matches: filtered, source, fetchedAt: now };
}

export function invalidateCache() {
  cache = null;
}
