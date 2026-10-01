import Link from "next/link";
import { Activity } from "lucide-react";

export function TopNav() {
  return (
    <nav className="sticky top-0 z-30 border-b border-zinc-900/80 bg-zinc-950/70 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-sky-500 text-zinc-950">
            <Activity size={14} strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-zinc-100">Winamax Bet Analyzer</p>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">
              Predictive football dashboard
            </p>
          </div>
        </Link>
        <div className="hidden items-center gap-5 text-xs text-zinc-400 md:flex">
          <Link href="/" className="transition hover:text-zinc-100">
            Dashboard
          </Link>
          <span className="cursor-not-allowed text-zinc-600">Combinés</span>
          <span className="cursor-not-allowed text-zinc-600">Backtest</span>
          <span className="cursor-not-allowed text-zinc-600">Bankroll</span>
        </div>
      </div>
    </nav>
  );
}
