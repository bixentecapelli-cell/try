import { NextResponse } from "next/server";
import { diagnoseOddsApi } from "@/lib/scrapers/odds-api";
import { fetchFootballMatches } from "@/lib/scrapers/winamax";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const [diagnostic, slate] = await Promise.all([
    diagnoseOddsApi(),
    fetchFootballMatches(),
  ]);

  return NextResponse.json(
    {
      source: slate.source,
      fetchedAt: slate.fetchedAt,
      matchesServed: slate.matches.length,
      firstFixture: slate.matches[0]
        ? {
            id: slate.matches[0].id,
            league: slate.matches[0].league,
            kickoff: slate.matches[0].kickoff,
            home: slate.matches[0].home.name,
            away: slate.matches[0].away.name,
          }
        : null,
      oddsApi: diagnostic,
      hints: {
        hasOddsApiKey: diagnostic.configured,
        howToFixDemoMode: diagnostic.configured
          ? "Key is set. If source === 'mock', the API returned no matches for the configured sport keys right now (off-season or no games in the next 3 days)."
          : "Set ODDS_API_KEY in Vercel → Project Settings → Environment Variables, then redeploy.",
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
