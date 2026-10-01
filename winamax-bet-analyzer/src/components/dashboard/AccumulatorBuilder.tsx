"use client";

import { useMemo, useState } from "react";
import { Dices, ShieldCheck, Target, Trash2, Sparkles } from "lucide-react";
import type { League, Match, RiskProfile } from "@/types";
import { buildAccumulator } from "@/lib/engine/accumulator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatEV, formatOdds, formatPercent, cn } from "@/lib/utils";

const PROFILES: {
  id: RiskProfile;
  label: string;
  blurb: string;
  icon: React.ElementType;
  accent: string;
}[] = [
  {
    id: "safe",
    label: "Sécurité",
    blurb: "3-4 blindages · cote x1.8-2.5",
    icon: ShieldCheck,
    accent: "emerald",
  },
  {
    id: "balanced",
    label: "Équilibré",
    blurb: "3 value plays · cote x3-6",
    icon: Target,
    accent: "sky",
  },
  {
    id: "fun",
    label: "Jackpot",
    blurb: "2-3 pépites EV++ · cote x6-25",
    icon: Dices,
    accent: "fuchsia",
  },
];

const ACCENTS: Record<string, { ring: string; bg: string; text: string; badge: string }> = {
  emerald: {
    ring: "ring-emerald-500/60",
    bg: "from-emerald-500/15",
    text: "text-emerald-300",
    badge: "bg-emerald-500/20 text-emerald-200 border-emerald-500/30",
  },
  sky: {
    ring: "ring-sky-500/60",
    bg: "from-sky-500/15",
    text: "text-sky-300",
    badge: "bg-sky-500/20 text-sky-200 border-sky-500/30",
  },
  fuchsia: {
    ring: "ring-fuchsia-500/60",
    bg: "from-fuchsia-500/15",
    text: "text-fuchsia-300",
    badge: "bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-500/30",
  },
};

export function AccumulatorBuilder({ matches }: { matches: Match[] }) {
  const [profile, setProfile] = useState<RiskProfile>("balanced");
  const [excludedLeagues, setExcludedLeagues] = useState<Set<League>>(new Set());
  const [excludeDraws, setExcludeDraws] = useState(true);

  const availableLeagues = useMemo(() => {
    const set = new Set<League>();
    matches.forEach((m) => set.add(m.league));
    return Array.from(set).sort();
  }, [matches]);

  const activeMatches = useMemo(
    () => matches.filter((m) => !excludedLeagues.has(m.league)),
    [matches, excludedLeagues],
  );

  const accumulator = useMemo(
    () =>
      buildAccumulator(activeMatches, profile, {
        excludeDraws,
      }),
    [activeMatches, profile, excludeDraws],
  );

  const accent = ACCENTS[PROFILES.find((p) => p.id === profile)!.accent];

  const toggleLeague = (l: League) => {
    setExcludedLeagues((prev) => {
      const next = new Set(prev);
      if (next.has(l)) next.delete(l);
      else next.add(l);
      return next;
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-zinc-200">
            <Sparkles size={14} className="text-fuchsia-300" />
            Smart Accumulator
          </CardTitle>
          <p className="mt-1 text-xs text-zinc-500">
            Combinés auto-générés selon ton profil de risque, filtrés par ligue.
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Profile selector */}
        <div className="grid gap-2 md:grid-cols-3">
          {PROFILES.map((p) => {
            const Icon = p.icon;
            const a = ACCENTS[p.accent];
            const active = profile === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setProfile(p.id)}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3 text-left transition",
                  active
                    ? `border-transparent bg-gradient-to-br ${a.bg} to-transparent ring-1 ${a.ring}`
                    : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700",
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    active ? a.badge : "bg-zinc-800 text-zinc-400",
                  )}
                >
                  <Icon size={16} />
                </div>
                <div>
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      active ? a.text : "text-zinc-200",
                    )}
                  >
                    {p.label}
                  </p>
                  <p className="text-[11px] text-zinc-500">{p.blurb}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider text-zinc-500">Ligues</span>
          {availableLeagues.map((l) => {
            const active = !excludedLeagues.has(l);
            return (
              <button
                key={l}
                type="button"
                onClick={() => toggleLeague(l)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition",
                  active
                    ? "border-zinc-700 bg-zinc-800 text-zinc-200"
                    : "border-zinc-800 bg-zinc-950 text-zinc-600 line-through",
                )}
              >
                {l}
              </button>
            );
          })}
          <span className="mx-2 h-5 w-px bg-zinc-800" />
          <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-400">
            <input
              type="checkbox"
              checked={excludeDraws}
              onChange={(e) => setExcludeDraws(e.target.checked)}
              className="h-4 w-4 accent-emerald-500"
            />
            Exclure les nuls
          </label>
        </div>

        {/* Result */}
        {accumulator ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={cn("text-xs uppercase tracking-widest", accent.text)}>
                  {accumulator.label}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {accumulator.legs.length} sélections · prob. combinée{" "}
                  {formatPercent(accumulator.combinedProb)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">Cote totale</p>
                <p className="text-3xl font-black text-white tabular-nums">
                  x{formatOdds(accumulator.totalOdd)}
                </p>
                <Badge
                  variant={accumulator.combinedEV >= 0.1 ? "success" : accumulator.combinedEV >= 0 ? "info" : "danger"}
                  className="mt-1"
                >
                  EV {formatEV(accumulator.combinedEV)}
                </Badge>
              </div>
            </div>

            <ul className="mt-4 space-y-2">
              {accumulator.legs.map((leg) => (
                <li
                  key={leg.match.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-900/50 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-100">
                      {leg.match.home.name}{" "}
                      <span className="text-zinc-500">vs</span> {leg.match.away.name}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      {leg.match.league} · {leg.prediction.label}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span className="text-xs text-zinc-500">
                      {formatPercent(leg.prediction.estimatedProb, 0)}
                    </span>
                    <span className="w-14 text-right text-base font-bold text-zinc-100 tabular-nums">
                      {formatOdds(leg.prediction.odd)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 p-8 text-center">
            <Trash2 size={16} className="text-zinc-600" />
            <p className="text-sm text-zinc-400">
              Pas assez de sélections éligibles pour construire un combiné avec ces filtres.
            </p>
            <p className="text-xs text-zinc-600">Essaie d&apos;élargir la liste des ligues ou de changer de profil.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
