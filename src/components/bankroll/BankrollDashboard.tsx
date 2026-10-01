"use client";

import { useMemo, useState } from "react";
import {
  Wallet,
  Target,
  Percent,
  TrendingUp,
  Flame,
  Snowflake,
  PlusCircle,
  Trash2,
  CheckCircle2,
  XCircle,
  Minus,
  Trophy,
} from "lucide-react";
import { useBankroll, type BetStatus } from "@/lib/hooks/useBankroll";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiTile } from "@/components/backtest/KpiTile";
import { Badge } from "@/components/ui/badge";
import { cn, formatPercent } from "@/lib/utils";

const STATUS_COPY: Record<BetStatus, { label: string; tone: "success" | "danger" | "info" | "muted" }> = {
  pending: { label: "En cours", tone: "info" },
  win: { label: "Gagné", tone: "success" },
  loss: { label: "Perdu", tone: "danger" },
  push: { label: "Remboursé", tone: "muted" },
};

export function BankrollDashboard() {
  const {
    hydrated,
    bets,
    summary,
    startingBankroll,
    addBet,
    updateBetStatus,
    removeBet,
    setStartingBankroll,
    reset,
  } = useBankroll();

  const [form, setForm] = useState({
    match: "",
    market: "Victoire domicile",
    odd: 1.9,
    stake: 20,
  });

  const canSubmit = form.match.trim().length > 0 && form.odd > 1 && form.stake > 0;

  const chronological = useMemo(
    () => [...bets].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [bets],
  );

  const bankrollSeries = useMemo(() => {
    // Build a lightweight running-balance list for the sparkline tile
    const settled = [...bets]
      .filter((b) => b.status === "win" || b.status === "loss")
      .sort((a, b) => +new Date(a.settledAt ?? a.createdAt) - +new Date(b.settledAt ?? b.createdAt));
    let balance = startingBankroll;
    const series = [{ i: 0, balance }];
    settled.forEach((b, i) => {
      balance += b.status === "win" ? b.stake * (b.odd - 1) : -b.stake;
      series.push({ i: i + 1, balance: +balance.toFixed(2) });
    });
    return series;
  }, [bets, startingBankroll]);

  if (!hydrated) {
    return <p className="text-sm text-zinc-500">Chargement du journal local…</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 md:grid-cols-4">
        <KpiTile
          label="Bankroll"
          value={`${summary.balance.toFixed(2)} €`}
          sublabel={`départ ${summary.startingBankroll.toFixed(0)} €`}
          accent={summary.balance >= summary.startingBankroll ? "emerald" : "rose"}
          icon={<Wallet size={14} />}
        />
        <KpiTile
          label="ROI"
          value={`${summary.roi >= 0 ? "+" : ""}${(summary.roi * 100).toFixed(1)}%`}
          sublabel={`${summary.totalStake.toFixed(0)} € misés`}
          accent={summary.roi >= 0 ? "emerald" : "rose"}
          icon={<Percent size={14} />}
        />
        <KpiTile
          label="Taux de passage"
          value={`${(summary.hitRate * 100).toFixed(0)}%`}
          sublabel={`${summary.wins}V · ${summary.losses}D · ${summary.pushes}P`}
          accent="sky"
          icon={<Target size={14} />}
        />
        <KpiTile
          label="Streak"
          value={
            summary.streak.kind === "none" ? "—" : `${summary.streak.count}${summary.streak.kind}`
          }
          sublabel={`${summary.pending} paris en attente · ${summary.pendingStake.toFixed(0)} € bloqués`}
          accent={summary.streak.kind === "W" ? "amber" : summary.streak.kind === "L" ? "rose" : "zinc"}
          icon={summary.streak.kind === "W" ? <Flame size={14} /> : summary.streak.kind === "L" ? <Snowflake size={14} /> : <TrendingUp size={14} />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_3fr]">
        {/* Add bet */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle size={14} className="text-emerald-300" /> Ajouter un pari
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="block">
              <span className="text-[11px] uppercase tracking-wider text-zinc-500">Match</span>
              <input
                value={form.match}
                onChange={(e) => setForm({ ...form, match: e.target.value })}
                placeholder="PSG vs Metz"
                className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500/60"
              />
            </label>
            <label className="block">
              <span className="text-[11px] uppercase tracking-wider text-zinc-500">Marché</span>
              <input
                value={form.market}
                onChange={(e) => setForm({ ...form, market: e.target.value })}
                className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500/60"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[11px] uppercase tracking-wider text-zinc-500">Cote</span>
                <input
                  type="number"
                  step={0.01}
                  min={1.01}
                  value={form.odd}
                  onChange={(e) => setForm({ ...form, odd: Number(e.target.value) || 0 })}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm tabular-nums text-zinc-100 outline-none focus:border-emerald-500/60"
                />
              </label>
              <label className="block">
                <span className="text-[11px] uppercase tracking-wider text-zinc-500">Mise (€)</span>
                <input
                  type="number"
                  step={1}
                  min={1}
                  value={form.stake}
                  onChange={(e) => setForm({ ...form, stake: Number(e.target.value) || 0 })}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm tabular-nums text-zinc-100 outline-none focus:border-emerald-500/60"
                />
              </label>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs text-zinc-500">
              <span>
                Gain potentiel ·{" "}
                <span className="text-emerald-300 tabular-nums">
                  +{(form.stake * (form.odd - 1)).toFixed(2)} €
                </span>
              </span>
            </div>

            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => {
                addBet(form);
                setForm({ ...form, match: "" });
              }}
              className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-sky-500 py-2 text-sm font-semibold text-zinc-950 transition disabled:opacity-40"
            >
              Enregistrer
            </button>

            <div className="grid grid-cols-2 gap-3 border-t border-zinc-800 pt-3">
              <label className="block">
                <span className="text-[11px] uppercase tracking-wider text-zinc-500">
                  Bankroll de départ
                </span>
                <input
                  type="number"
                  min={0}
                  step={10}
                  value={startingBankroll}
                  onChange={(e) => setStartingBankroll(Number(e.target.value) || 0)}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm tabular-nums text-zinc-100 outline-none focus:border-emerald-500/60"
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  if (confirm("Supprimer tous les paris et réinitialiser la bankroll ?")) {
                    reset();
                  }
                }}
                className="mt-5 rounded-lg border border-rose-500/30 bg-rose-500/10 py-2 text-xs text-rose-300 transition hover:bg-rose-500/20"
              >
                Reset journal
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Sparkline-ish summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy size={14} className="text-amber-300" /> Progression bankroll
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bankrollSeries.length <= 1 ? (
              <p className="text-sm text-zinc-500">
                Enregistre et clôture quelques paris pour voir la courbe se dessiner.
              </p>
            ) : (
              <svg viewBox="0 0 400 160" className="w-full">
                {(() => {
                  const vals = bankrollSeries.map((p) => p.balance);
                  const min = Math.min(...vals, startingBankroll);
                  const max = Math.max(...vals, startingBankroll);
                  const span = Math.max(1, max - min);
                  const points = bankrollSeries
                    .map((p, i) => {
                      const x = (i / Math.max(1, bankrollSeries.length - 1)) * 400;
                      const y = 160 - ((p.balance - min) / span) * 140 - 10;
                      return `${x.toFixed(1)},${y.toFixed(1)}`;
                    })
                    .join(" ");
                  const refY = 160 - ((startingBankroll - min) / span) * 140 - 10;
                  const positive = bankrollSeries.at(-1)!.balance >= startingBankroll;
                  return (
                    <>
                      <line
                        x1="0"
                        y1={refY}
                        x2="400"
                        y2={refY}
                        stroke="#52525b"
                        strokeDasharray="4 4"
                      />
                      <polyline
                        points={points}
                        fill="none"
                        stroke={positive ? "#34d399" : "#f87171"}
                        strokeWidth="2.5"
                      />
                    </>
                  );
                })()}
              </svg>
            )}
            <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
              <span>Ligne pointillée = capital de départ</span>
              <span className="tabular-nums">
                {bets.length} paris · {summary.pending} en cours
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bets table */}
      <Card>
        <CardHeader>
          <CardTitle>Journal des paris</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {chronological.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Aucun pari pour l&apos;instant. Utilise le formulaire ci-dessus pour tracker tes
              premières mises.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
                  <th className="py-2 font-normal">Date</th>
                  <th className="py-2 font-normal">Match</th>
                  <th className="py-2 font-normal">Marché</th>
                  <th className="py-2 font-normal">Cote</th>
                  <th className="py-2 font-normal">Mise</th>
                  <th className="py-2 font-normal">Statut</th>
                  <th className="py-2 text-right font-normal">Actions</th>
                </tr>
              </thead>
              <tbody>
                {chronological.map((b) => {
                  const copy = STATUS_COPY[b.status];
                  const profit =
                    b.status === "win"
                      ? b.stake * (b.odd - 1)
                      : b.status === "loss"
                        ? -b.stake
                        : 0;
                  return (
                    <tr key={b.id} className="border-t border-zinc-800/80">
                      <td className="py-3 text-xs text-zinc-500">
                        {new Date(b.createdAt).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </td>
                      <td className="py-3">
                        <span className="font-medium text-zinc-100">{b.match}</span>
                      </td>
                      <td className="py-3 text-xs text-zinc-400">{b.market}</td>
                      <td className="py-3 tabular-nums text-zinc-200">{b.odd.toFixed(2)}</td>
                      <td className="py-3 tabular-nums text-zinc-200">{b.stake.toFixed(2)} €</td>
                      <td className="py-3">
                        <Badge variant={copy.tone}>
                          {copy.label}
                          {b.status !== "pending" && b.status !== "push" && (
                            <span
                              className={cn(
                                "ml-1 tabular-nums",
                                profit >= 0 ? "text-emerald-200" : "text-rose-200",
                              )}
                            >
                              {profit >= 0 ? "+" : ""}
                              {profit.toFixed(2)}€
                            </span>
                          )}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        {b.status === "pending" ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              aria-label="Marquer gagné"
                              onClick={() => updateBetStatus(b.id, "win")}
                              className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-1 text-emerald-300 transition hover:bg-emerald-500/20"
                            >
                              <CheckCircle2 size={14} />
                            </button>
                            <button
                              type="button"
                              aria-label="Marquer perdu"
                              onClick={() => updateBetStatus(b.id, "loss")}
                              className="rounded-md border border-rose-500/30 bg-rose-500/10 p-1 text-rose-300 transition hover:bg-rose-500/20"
                            >
                              <XCircle size={14} />
                            </button>
                            <button
                              type="button"
                              aria-label="Marquer remboursé"
                              onClick={() => updateBetStatus(b.id, "push")}
                              className="rounded-md border border-zinc-700 bg-zinc-800/50 p-1 text-zinc-400 transition hover:bg-zinc-800"
                            >
                              <Minus size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            aria-label="Supprimer"
                            onClick={() => removeBet(b.id)}
                            className="rounded-md p-1 text-zinc-500 transition hover:text-rose-300"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <p className="mt-3 text-[11px] text-zinc-500">
            Données stockées localement dans ton navigateur (localStorage). Rien n&apos;est envoyé à
            un serveur.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
