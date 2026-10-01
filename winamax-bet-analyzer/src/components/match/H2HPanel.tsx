import type { Match } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ActivitySquare, Siren } from "lucide-react";

function Stat({ label, value, sublabel }: { label: string; value: string; sublabel?: string }) {
  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-3">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-zinc-100 tabular-nums">{value}</p>
      {sublabel && <p className="text-[11px] text-zinc-500">{sublabel}</p>}
    </div>
  );
}

export function H2HPanel({ match }: { match: Match }) {
  const { h2h, home, away } = match;
  const total = Math.max(h2h.matchesPlayed, 1);
  const homePct = Math.round((h2h.homeWins / total) * 100);
  const drawPct = Math.round((h2h.draws / total) * 100);
  const awayPct = 100 - homePct - drawPct;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={14} /> Confrontations directes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex overflow-hidden rounded-full border border-zinc-800">
            <div
              className="flex items-center justify-center bg-emerald-500/80 text-xs font-semibold text-zinc-950"
              style={{ width: `${homePct}%` }}
            >
              {h2h.homeWins}V
            </div>
            <div
              className="flex items-center justify-center bg-zinc-600/80 text-xs font-semibold text-zinc-50"
              style={{ width: `${drawPct}%` }}
            >
              {h2h.draws}N
            </div>
            <div
              className="flex items-center justify-center bg-pink-500/80 text-xs font-semibold text-zinc-950"
              style={{ width: `${awayPct}%` }}
            >
              {h2h.awayWins}V
            </div>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-emerald-300">{home.name}</span>
            <span className="text-zinc-400">Nul</span>
            <span className="text-pink-300">{away.name}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Stat
              label="Matchs analysés"
              value={h2h.matchesPlayed.toString()}
              sublabel="3 dernières saisons"
            />
            <Stat label="Buts/match" value={h2h.avgGoals.toFixed(1)} />
            <Stat label="BTTS rate" value={`${Math.round(h2h.bttsRate * 100)}%`} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ActivitySquare size={14} /> Forme & effectifs
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {[home, away].map((team, idx) => (
            <div
              key={team.id}
              className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4"
            >
              <p className="text-xs uppercase tracking-widest text-zinc-500">
                {idx === 0 ? "Domicile" : "Extérieur"}
              </p>
              <p className="text-base font-semibold text-zinc-100">{team.name}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-zinc-500">xG créés</p>
                  <p className="font-bold text-emerald-300 tabular-nums">
                    {team.xgFor.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500">xG concédés</p>
                  <p className="font-bold text-pink-300 tabular-nums">
                    {team.xgAgainst.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500">Buts/match</p>
                  <p className="text-zinc-100 tabular-nums">
                    {(team.goalsFor / Math.max(team.last10.length, 1)).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500">Repos</p>
                  <p className="text-zinc-100 tabular-nums">{team.restDays} j</p>
                </div>
              </div>
              {team.keyAbsences > 0 && (
                <div className="mt-3 inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-300">
                  <Siren size={10} /> {team.keyAbsences} absence
                  {team.keyAbsences > 1 ? "s" : ""} majeure
                  {team.keyAbsences > 1 ? "s" : ""}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
