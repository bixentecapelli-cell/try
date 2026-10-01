import Link from "next/link";
import { ArrowLeft, TrendingUp, Target, Percent, Flame, History } from "lucide-react";
import { generateHistoricalBets } from "@/lib/data/historical";
import { computeBacktest } from "@/lib/history/backtest";
import { BankrollChart } from "@/components/backtest/BankrollChart";
import { KpiTile } from "@/components/backtest/KpiTile";
import { CategoryTable } from "@/components/backtest/CategoryTable";

export const dynamic = "force-dynamic";

const STARTING_BANKROLL = 1000;

export default function BacktestPage() {
  const bets = generateHistoricalBets(30);
  const result = computeBacktest(bets, STARTING_BANKROLL);
  const { overall, perCategory, bankrollCurve, bestDay, worstDay } = result;
  const finalBankroll = bankrollCurve.at(-1)?.bankroll ?? STARTING_BANKROLL;
  const growth = (finalBankroll - STARTING_BANKROLL) / STARTING_BANKROLL;

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 md:px-6 md:py-12">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-1 text-xs text-zinc-500 transition hover:text-zinc-200"
      >
        <ArrowLeft size={14} /> Retour au radar
      </Link>

      <header>
        <div className="mb-2 flex items-center gap-2">
          <History size={16} className="text-sky-300" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Backtest · 30 derniers jours
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Transparence du modèle
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-400">
          Simulation des recommandations du modèle sur les 30 derniers jours. Bankroll de départ :{" "}
          {STARTING_BANKROLL} €, mises variables selon la catégorie.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-4">
        <KpiTile
          label="Bankroll finale"
          value={`${finalBankroll.toFixed(0)} €`}
          sublabel={`départ ${STARTING_BANKROLL} €`}
          accent={growth >= 0 ? "emerald" : "rose"}
          icon={<TrendingUp size={14} />}
        />
        <KpiTile
          label="ROI global"
          value={`${growth >= 0 ? "+" : ""}${(growth * 100).toFixed(1)}%`}
          accent={growth >= 0 ? "emerald" : "rose"}
          icon={<Percent size={14} />}
          sublabel={`${overall.bets} paris · ${overall.stake.toFixed(0)} € misés`}
        />
        <KpiTile
          label="Taux de réussite"
          value={`${(overall.hitRate * 100).toFixed(1)}%`}
          sublabel={`${overall.wins}V · ${overall.losses}D`}
          accent="sky"
          icon={<Target size={14} />}
        />
        <KpiTile
          label="Meilleure journée"
          value={`+${bestDay.dailyProfit.toFixed(2)} €`}
          sublabel={bestDay.date}
          accent="amber"
          icon={<Flame size={14} />}
        />
      </div>

      <BankrollChart points={bankrollCurve} startingBankroll={STARTING_BANKROLL} />

      <CategoryTable rows={[overall, ...perCategory]} />

      <div className="grid gap-3 md:grid-cols-2">
        <KpiTile
          label="Pire journée"
          value={`${worstDay.dailyProfit.toFixed(2)} €`}
          sublabel={`${worstDay.date} · ${worstDay.betsOfDay} paris`}
          accent="rose"
        />
        <KpiTile
          label="Volume moyen / jour"
          value={`${(overall.bets / 30).toFixed(1)} paris`}
          sublabel={`${(overall.stake / 30).toFixed(0)} € de mises quotidiennes`}
          accent="zinc"
        />
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">
        Les résultats de backtest sont indicatifs et simulés sur un dataset déterministe pour la
        démo. En production, ces chiffres proviendront des paris réels enregistrés avec leur cote
        de clôture et le résultat final du match.
      </p>
    </main>
  );
}
