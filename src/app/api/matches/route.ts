import { NextResponse } from "next/server";
import { fetchFootballMatches } from "@/lib/scrapers/winamax";
import { analyzeMatch } from "@/lib/engine/scoring";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const forceMock = url.searchParams.get("mock") === "1";
  const leagues = url.searchParams.get("leagues")?.split(",").filter(Boolean);

  const { matches, source, fetchedAt } = await fetchFootballMatches({
    forceMock,
    leagues,
  });

  const enriched = matches.map((m) => {
    const { predictions, derived } = analyzeMatch(m);
    return {
      id: m.id,
      league: m.league,
      kickoff: m.kickoff,
      home: m.home.name,
      away: m.away.name,
      odds: m.odds,
      expectedGoals: {
        home: derived.expectedGoalsHome,
        away: derived.expectedGoalsAway,
      },
      picks: predictions
        .sort((a, b) => b.ev - a.ev)
        .slice(0, 3)
        .map((p) => ({
          market: p.market,
          label: p.label,
          odd: p.odd,
          estimatedProb: p.estimatedProb,
          impliedProb: p.impliedProb,
          ev: p.ev,
          confidence: p.confidence,
        })),
    };
  });

  return NextResponse.json(
    { source, fetchedAt, count: enriched.length, matches: enriched },
    { headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" } },
  );
}
