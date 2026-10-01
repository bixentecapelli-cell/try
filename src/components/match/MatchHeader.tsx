import type { FormResult, Match } from "@/types";
import { Badge } from "@/components/ui/badge";
import { ConfidenceStars } from "@/components/ui/stars";
import { CalendarDays, MapPin, UserRound, CloudRain, Cloud, Sun, Wind, Snowflake } from "lucide-react";
import { cn } from "@/lib/utils";

function FormChip({ r }: { r: FormResult }) {
  const colors =
    r === "W"
      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
      : r === "D"
        ? "bg-zinc-700/40 text-zinc-300 border-zinc-600/60"
        : "bg-rose-500/20 text-rose-300 border-rose-500/30";
  return (
    <span
      className={cn(
        "inline-flex h-5 w-5 items-center justify-center rounded border text-[10px] font-semibold",
        colors,
      )}
    >
      {r}
    </span>
  );
}

function WeatherIcon({ condition }: { condition?: string }) {
  if (condition === "rain") return <CloudRain size={12} />;
  if (condition === "snow") return <Snowflake size={12} />;
  if (condition === "wind") return <Wind size={12} />;
  if (condition === "clear") return <Sun size={12} />;
  return <Cloud size={12} />;
}

export function MatchHeader({ match, confidence }: { match: Match; confidence: number }) {
  const kickoff = new Date(match.kickoff);
  return (
    <header className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
      <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-widest text-zinc-500">
        <Badge variant="muted">{match.league}</Badge>
        <span className="inline-flex items-center gap-1">
          <CalendarDays size={12} />
          {kickoff.toLocaleString("fr-FR", {
            weekday: "long",
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        {match.stadium && (
          <span className="inline-flex items-center gap-1">
            <MapPin size={12} />
            {match.stadium}
          </span>
        )}
        {match.referee && (
          <span className="inline-flex items-center gap-1">
            <UserRound size={12} />
            {match.referee.name}
          </span>
        )}
        {match.weather && (
          <span className="inline-flex items-center gap-1">
            <WeatherIcon condition={match.weather.condition} />
            {match.weather.tempC}°C · vent {match.weather.windKmh} km/h
          </span>
        )}
      </div>

      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="text-right">
          <p className="text-xl font-bold text-zinc-100 md:text-2xl">{match.home.name}</p>
          <p className="text-[11px] text-zinc-500">Domicile · {match.home.homePPG.toFixed(2)} pts/match</p>
          <div className="mt-2 flex items-center justify-end gap-1">
            {match.home.last5.map((r, i) => (
              <FormChip key={`h-${i}`} r={r} />
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-xs uppercase tracking-widest text-zinc-500">
            vs
          </div>
          <ConfidenceStars value={confidence} />
          <span className="text-[10px] text-zinc-500">Indice de confiance</span>
        </div>

        <div>
          <p className="text-xl font-bold text-zinc-100 md:text-2xl">{match.away.name}</p>
          <p className="text-[11px] text-zinc-500">Extérieur · {match.away.awayPPG.toFixed(2)} pts/match</p>
          <div className="mt-2 flex items-center gap-1">
            {match.away.last5.map((r, i) => (
              <FormChip key={`a-${i}`} r={r} />
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
