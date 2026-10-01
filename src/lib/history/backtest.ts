import type { HistoricalBet, BetCategory } from "@/lib/data/historical";

// ============================================================================
// Backtest aggregator — turns a list of historical bets into dashboard KPIs.
// ============================================================================

export interface CategoryMetrics {
  category: BetCategory | "overall";
  bets: number;
  wins: number;
  losses: number;
  hitRate: number; // 0..1
  stake: number;
  profit: number;
  roi: number; // profit / stake
  yield: number; // alias of roi (industry term for sports betting)
  avgOdd: number;
}

export interface BankrollPoint {
  date: string; // YYYY-MM-DD
  bankroll: number;
  dailyProfit: number;
  betsOfDay: number;
}

export interface BacktestResult {
  overall: CategoryMetrics;
  perCategory: CategoryMetrics[];
  bankrollCurve: BankrollPoint[];
  bestDay: BankrollPoint;
  worstDay: BankrollPoint;
}

function aggregate(bets: HistoricalBet[], category: CategoryMetrics["category"]): CategoryMetrics {
  if (bets.length === 0) {
    return {
      category,
      bets: 0,
      wins: 0,
      losses: 0,
      hitRate: 0,
      stake: 0,
      profit: 0,
      roi: 0,
      yield: 0,
      avgOdd: 0,
    };
  }
  const wins = bets.filter((b) => b.outcome === "win").length;
  const losses = bets.filter((b) => b.outcome === "loss").length;
  const stake = bets.reduce((acc, b) => acc + b.stake, 0);
  const profit = bets.reduce((acc, b) => acc + b.profit, 0);
  const avgOdd = bets.reduce((acc, b) => acc + b.odd, 0) / bets.length;
  const roi = stake > 0 ? profit / stake : 0;
  return {
    category,
    bets: bets.length,
    wins,
    losses,
    hitRate: bets.length ? wins / bets.length : 0,
    stake: +stake.toFixed(2),
    profit: +profit.toFixed(2),
    roi,
    yield: roi,
    avgOdd,
  };
}

export function computeBacktest(bets: HistoricalBet[], startingBankroll = 1000): BacktestResult {
  const overall = aggregate(bets, "overall");
  const perCategory: CategoryMetrics[] = (["safe", "balanced", "value"] as const).map((c) =>
    aggregate(
      bets.filter((b) => b.category === c),
      c,
    ),
  );

  // Build daily bankroll curve
  const byDay = new Map<string, HistoricalBet[]>();
  for (const b of bets) {
    const key = b.date.slice(0, 10);
    const arr = byDay.get(key) ?? [];
    arr.push(b);
    byDay.set(key, arr);
  }

  const sortedDays = [...byDay.keys()].sort();
  let bankroll = startingBankroll;
  const bankrollCurve: BankrollPoint[] = [];
  for (const day of sortedDays) {
    const dayBets = byDay.get(day)!;
    const dailyProfit = dayBets.reduce((acc, b) => acc + b.profit, 0);
    bankroll += dailyProfit;
    bankrollCurve.push({
      date: day,
      bankroll: +bankroll.toFixed(2),
      dailyProfit: +dailyProfit.toFixed(2),
      betsOfDay: dayBets.length,
    });
  }

  const bestDay = [...bankrollCurve].sort((a, b) => b.dailyProfit - a.dailyProfit)[0];
  const worstDay = [...bankrollCurve].sort((a, b) => a.dailyProfit - b.dailyProfit)[0];

  return { overall, perCategory, bankrollCurve, bestDay, worstDay };
}
