"use client";

import { useCallback, useEffect, useState } from "react";

// ============================================================================
// useBankroll — localStorage-backed bet log for the Bankroll Tracker page.
// ----------------------------------------------------------------------------
// Writes are debounced via useEffect so repeated state updates don't thrash
// the storage. Every value is wrapped in try/catch because privacy-mode
// browsers throw on localStorage access.
// ============================================================================

export type BetStatus = "pending" | "win" | "loss" | "push";

export interface LoggedBet {
  id: string;
  createdAt: string; // ISO
  settledAt?: string; // ISO
  match: string; // display label, e.g. "PSG vs Metz"
  market: string; // display label of the market picked
  odd: number;
  stake: number;
  status: BetStatus;
}

const KEY = "winamax-bet-analyzer:v1:bankroll";

interface BankrollState {
  startingBankroll: number;
  bets: LoggedBet[];
}

const DEFAULT_STATE: BankrollState = {
  startingBankroll: 1000,
  bets: [],
};

function read(): BankrollState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as BankrollState;
    if (!parsed || !Array.isArray(parsed.bets)) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return DEFAULT_STATE;
  }
}

function write(state: BankrollState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* privacy mode etc. */
  }
}

export interface BankrollSummary {
  startingBankroll: number;
  balance: number;
  pendingStake: number;
  totalStake: number;
  profit: number;
  roi: number;
  wins: number;
  losses: number;
  pushes: number;
  pending: number;
  hitRate: number;
  streak: { kind: "W" | "L" | "none"; count: number };
}

function summarize(state: BankrollState): BankrollSummary {
  const settled = state.bets.filter((b) => b.status === "win" || b.status === "loss");
  const wins = settled.filter((b) => b.status === "win").length;
  const losses = settled.filter((b) => b.status === "loss").length;
  const pushes = state.bets.filter((b) => b.status === "push").length;
  const pending = state.bets.filter((b) => b.status === "pending").length;
  const pendingStake = state.bets.filter((b) => b.status === "pending").reduce((a, b) => a + b.stake, 0);
  const totalStake = settled.reduce((a, b) => a + b.stake, 0);
  const profit = settled.reduce((a, b) => a + (b.status === "win" ? b.stake * (b.odd - 1) : -b.stake), 0);
  const balance = state.startingBankroll + profit - pendingStake;
  const roi = totalStake > 0 ? profit / totalStake : 0;
  const hitRate = settled.length > 0 ? wins / settled.length : 0;

  // Compute current streak from the most recent settled bets
  const chronological = [...settled].sort((a, b) => +new Date(a.settledAt ?? a.createdAt) - +new Date(b.settledAt ?? b.createdAt));
  let streak: BankrollSummary["streak"] = { kind: "none", count: 0 };
  for (let i = chronological.length - 1; i >= 0; i--) {
    const b = chronological[i];
    const kind: "W" | "L" = b.status === "win" ? "W" : "L";
    if (streak.kind === "none") streak = { kind, count: 1 };
    else if (streak.kind === kind) streak.count += 1;
    else break;
  }

  return {
    startingBankroll: state.startingBankroll,
    balance: +balance.toFixed(2),
    pendingStake: +pendingStake.toFixed(2),
    totalStake: +totalStake.toFixed(2),
    profit: +profit.toFixed(2),
    roi,
    wins,
    losses,
    pushes,
    pending,
    hitRate,
    streak,
  };
}

export function useBankroll() {
  const [state, setState] = useState<BankrollState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount (client only)
  useEffect(() => {
    setState(read());
    setHydrated(true);
  }, []);

  // Persist on change (after hydration)
  useEffect(() => {
    if (hydrated) write(state);
  }, [state, hydrated]);

  const addBet = useCallback(
    (bet: Omit<LoggedBet, "id" | "createdAt" | "status"> & { status?: BetStatus }) => {
      const newBet: LoggedBet = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
        status: bet.status ?? "pending",
        match: bet.match,
        market: bet.market,
        odd: bet.odd,
        stake: bet.stake,
      };
      setState((s) => ({ ...s, bets: [newBet, ...s.bets] }));
    },
    [],
  );

  const updateBetStatus = useCallback((id: string, status: BetStatus) => {
    setState((s) => ({
      ...s,
      bets: s.bets.map((b) =>
        b.id === id
          ? { ...b, status, settledAt: status === "pending" ? undefined : new Date().toISOString() }
          : b,
      ),
    }));
  }, []);

  const removeBet = useCallback((id: string) => {
    setState((s) => ({ ...s, bets: s.bets.filter((b) => b.id !== id) }));
  }, []);

  const setStartingBankroll = useCallback((v: number) => {
    setState((s) => ({ ...s, startingBankroll: Math.max(0, v) }));
  }, []);

  const reset = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  return {
    hydrated,
    bets: state.bets,
    summary: summarize(state),
    startingBankroll: state.startingBankroll,
    addBet,
    updateBetStatus,
    removeBet,
    setStartingBankroll,
    reset,
  };
}
