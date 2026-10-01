"use client";

import { useMemo, useState } from "react";
import { Wallet } from "lucide-react";
import type { MarketPrediction } from "@/types";
import { recommendStake } from "@/lib/engine/kelly";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatPercent } from "@/lib/utils";

const VERDICT_COPY = {
  "no-bet": {
    label: "Ne pas jouer",
    tone: "danger" as const,
    note: "L'edge n'est pas suffisant par rapport à la cote.",
  },
  small: {
    label: "Mise prudente",
    tone: "info" as const,
    note: "Edge limité : mise réduite pour amortir la variance.",
  },
  standard: {
    label: "Mise standard",
    tone: "success" as const,
    note: "Edge solide, Kelly fractionné renvoie une mise classique.",
  },
  aggressive: {
    label: "Mise musclée (cap 10%)",
    tone: "warning" as const,
    note: "Edge rare : Kelly plafonné à 10% du capital pour la sécurité.",
  },
};

export function KellyCalculator({ prediction }: { prediction: MarketPrediction }) {
  const [bankroll, setBankroll] = useState(500);
  const [fractionPct, setFractionPct] = useState(25);

  const reco = useMemo(
    () =>
      recommendStake(
        prediction.estimatedProb,
        prediction.odd,
        bankroll,
        prediction.impliedProb,
        fractionPct / 100,
      ),
    [prediction, bankroll, fractionPct],
  );

  const copy = VERDICT_COPY[reco.verdict];
  const potentialPayout = reco.stakeAmount * prediction.odd;
  const potentialProfit = potentialPayout - reco.stakeAmount;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-zinc-200">
          <Wallet size={14} className="text-emerald-300" />
          Gestionnaire de Bankroll — Kelly fractionné
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-zinc-500">
              Bankroll (€)
            </span>
            <input
              type="number"
              min={1}
              step={10}
              value={bankroll}
              onChange={(e) => setBankroll(Math.max(1, Number(e.target.value) || 0))}
              className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-lg font-semibold tabular-nums text-zinc-100 outline-none focus:border-emerald-500/60"
            />
          </label>
          <label className="block">
            <span className="flex items-center justify-between text-[11px] uppercase tracking-wider text-zinc-500">
              <span>Fraction de Kelly</span>
              <span className="text-emerald-300">{fractionPct}%</span>
            </span>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={fractionPct}
              onChange={(e) => setFractionPct(Number(e.target.value))}
              className="mt-3 w-full accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-zinc-500">
              <span>1/10 (safe)</span>
              <span>Full Kelly</span>
            </div>
          </label>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-zinc-500">
                Mise conseillée
              </p>
              <p
                className={cn(
                  "text-3xl font-black tabular-nums",
                  reco.verdict === "no-bet" ? "text-rose-300" : "text-emerald-300",
                )}
              >
                {reco.verdict === "no-bet" ? "—" : `${reco.stakeAmount.toFixed(2)} €`}
              </p>
              <p className="text-xs text-zinc-500">
                {formatPercent(reco.stakeFraction, 2)} du capital
              </p>
            </div>
            <Badge variant={copy.tone}>{copy.label}</Badge>
          </div>

          {reco.verdict !== "no-bet" && (
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-zinc-800/80 pt-3 text-sm">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-zinc-500">
                  Gain potentiel
                </p>
                <p className="font-semibold tabular-nums text-zinc-100">
                  +{potentialProfit.toFixed(2)} €
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-zinc-500">
                  Payout total
                </p>
                <p className="font-semibold tabular-nums text-zinc-100">
                  {potentialPayout.toFixed(2)} €
                </p>
              </div>
            </div>
          )}

          <p className="mt-3 text-xs text-zinc-500">{copy.note}</p>
        </div>

        <p className="text-[11px] leading-relaxed text-zinc-600">
          Formule : <span className="font-mono">f* = (b·p − q) / b</span>, puis multipliée par la
          fraction choisie et plafonnée à 10% de la bankroll. Edge actuel :{" "}
          <span className="text-zinc-400">{formatPercent(reco.edge, 1)}</span>.
        </p>
      </CardContent>
    </Card>
  );
}
