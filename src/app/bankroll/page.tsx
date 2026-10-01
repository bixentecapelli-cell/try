import Link from "next/link";
import { ArrowLeft, Wallet } from "lucide-react";
import { BankrollDashboard } from "@/components/bankroll/BankrollDashboard";

export const metadata = {
  title: "Bankroll Tracker · Winamax Bet Analyzer",
};

export default function BankrollPage() {
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
          <Wallet size={16} className="text-emerald-300" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Bankroll Tracker
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Mon capital</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-400">
          Journal des paris persistant localement. Enregistre chaque mise, clôture-la en gagnée /
          perdue / remboursée et suis ta vraie performance au fil du temps.
        </p>
      </header>

      <BankrollDashboard />
    </main>
  );
}
