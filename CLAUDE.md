# Winamax Bet Analyzer — Claude Code notes

Next.js 15 (App Router), TypeScript, Tailwind v4, Recharts.

## Where things live

- `src/app/page.tsx` — dashboard (picker cards, accumulator, match list)
- `src/app/match/[id]/page.tsx` — detailed match view
- `src/app/backtest/page.tsx` — 30-day backtest with simulated bets
- `src/app/bankroll/page.tsx` — personal bankroll tracker (localStorage)
- `src/app/api/matches/route.ts` — JSON API with top-3 picks per match
- `src/lib/engine/scoring.ts` — 9-factor model → Poisson → 12 markets
- `src/lib/engine/accumulator.ts` — Smart Accumulator (safe/balanced/fun)
- `src/lib/engine/kelly.ts` — fractional Kelly staking helper
- `src/lib/scrapers/winamax-live.ts` — real HTML scraper (defensive)
- `src/lib/scrapers/winamax.ts` — orchestrator (live → merged → mock)
- `src/lib/history/snapshots.ts` — in-memory odds snapshot ring buffer
- `src/lib/history/backtest.ts` — ROI/yield/bankroll-curve aggregator
- `src/lib/hooks/useBankroll.ts` — localStorage persistence hook
- `src/lib/data/mock.ts` — 6 realistic test fixtures (multi-ligues)
- `src/lib/data/historical.ts` — deterministic 30-day bet log for backtest

## Working on the engine

The flow is:
`fetchFootballMatches()` → `Match[]` → `analyzeMatch(match)` → `{ home, away, derived, predictions }` where every market has `odd`, `estimatedProb`, `impliedProb` (devigged), `edge`, `ev`, `confidence`, `rationale`.

If you touch `FACTOR_WEIGHTS` keep them summing to 1.0 — the aggregated edge
assumes it. The home-only `breakdown` is mirrored to the away team by negating
every value in `computeTeamEdges`.

## Scripts

```bash
npm run dev            # localhost:3000
npm run build          # production build
npm run lint
```

## Branch / PR conventions

- Development branch for this session: `claude/peaceful-brown-8wgauz`
- Push to that branch with `git push -u origin <branch>` and open a draft PR.
- Vercel previews build from the repo root (the project is at `/`, not in a
  subfolder — don't move it back).

## Known quirks

- The real Winamax scraper (`winamax-live.ts`) often fails from Vercel IPs
  (Cloudflare WAF). The orchestrator silently falls back to the mock dataset
  and the UI exposes the resulting `source` so the user can tell.
- `recharts` is heavy — the `/match/[id]` and `/backtest` routes carry it.
  Keep the `dashboard` route lean (no Recharts imports).
- The snapshot store is in-memory per Vercel invocation; a production rewrite
  would persist to Vercel KV or Postgres (schema sketched in the scraper file).

## Avoid

- Writing files that could leak secrets (`.env*` is already gitignored).
- Running the real scraper in tests without a `forceMock: true` guard.
- Breaking the `MarketKey` union — downstream engine code switches on it.
