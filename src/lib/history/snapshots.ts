import type { Match, MarketKey } from "@/types";

// ============================================================================
// Odds snapshot store
// ----------------------------------------------------------------------------
// Lightweight in-memory ring buffer of recent odds. Enough to power:
//   - the per-match Odds Tracker trend (compute Δ% vs 24h ago),
//   - the backtest results page (settle historical picks).
//
// In production we'd back this with Vercel KV / Postgres and attach a
// Prisma `OddsSnapshot(matchId, marketKey, odd, fetchedAt)` composite PK.
// ============================================================================

export interface OddsSnapshot {
  matchId: string;
  fetchedAt: number;
  odds: Record<string, number>;
}

const MAX_ENTRIES_PER_MATCH = 288; // ~24h at 5-min polling

const store = new Map<string, OddsSnapshot[]>();

export function recordSnapshot(matches: Match[], fetchedAt: number): void {
  for (const m of matches) {
    const snapshot: OddsSnapshot = {
      matchId: m.id,
      fetchedAt,
      odds: {
        "1": m.odds["1"],
        N: m.odds.N,
        "2": m.odds["2"],
        O2_5: m.odds.O2_5,
        U2_5: m.odds.U2_5,
        BTTS_YES: m.odds.BTTS_YES,
      },
    };
    const list = store.get(m.id) ?? [];
    list.push(snapshot);
    if (list.length > MAX_ENTRIES_PER_MATCH) list.splice(0, list.length - MAX_ENTRIES_PER_MATCH);
    store.set(m.id, list);
  }
}

export function getSnapshots(matchId: string): OddsSnapshot[] {
  return store.get(matchId) ?? [];
}

/**
 * Returns the percent change (-1..+1) between the first snapshot in the
 * given window and the latest snapshot for the given market.
 * `null` when we don't have enough history yet.
 */
export function getTrend(matchId: string, market: MarketKey, windowMs = 86_400_000): number | null {
  const snaps = store.get(matchId);
  if (!snaps || snaps.length < 2) return null;
  const now = snaps[snaps.length - 1].fetchedAt;
  const cutoff = now - windowMs;
  const base = snaps.find((s) => s.fetchedAt >= cutoff) ?? snaps[0];
  const current = snaps[snaps.length - 1];
  const o0 = base.odds[market as string];
  const o1 = current.odds[market as string];
  if (!o0 || !o1) return null;
  return (o1 - o0) / o0;
}

/** Debug helper. */
export function clearAllSnapshots(): void {
  store.clear();
}
