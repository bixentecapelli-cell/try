import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { fetchFootballMatches } from "@/lib/scrapers/winamax";
import { analyzeMatch, FACTOR_WEIGHTS } from "@/lib/engine/scoring";
import { MatchHeader } from "@/components/match/MatchHeader";
import { FactorBreakdownView } from "@/components/match/FactorBreakdown";
import { H2HPanel } from "@/components/match/H2HPanel";
import { MatchDetailClient } from "@/components/match/MatchDetailClient";
import { OddsTracker } from "@/components/match/OddsTracker";

export const dynamic = "force-dynamic";

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { matches } = await fetchFootballMatches();
  const match = matches.find((m) => m.id === id);
  if (!match) notFound();

  const { home, predictions } = analyzeMatch(match);
  const topConfidence = Math.max(...predictions.map((p) => p.confidence)) as 1 | 2 | 3 | 4 | 5;

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 md:px-6 md:py-12">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-1 text-xs text-zinc-500 transition hover:text-zinc-200"
      >
        <ArrowLeft size={14} /> Retour au radar
      </Link>

      <MatchHeader match={match} confidence={topConfidence} />

      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <FactorBreakdownView
          breakdown={home.breakdown}
          homeName={match.home.name}
          awayName={match.away.name}
          weights={FACTOR_WEIGHTS}
        />
        <OddsTracker match={match} />
      </div>

      <H2HPanel match={match} />

      <MatchDetailClient predictions={predictions} />
    </main>
  );
}
