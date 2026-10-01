"use client";

import type { FactorBreakdown as FB } from "@/lib/engine/scoring";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const LABELS: Record<keyof FB, string> = {
  form: "Forme",
  homeAway: "Dom/Ext",
  h2h: "H2H",
  lineup: "Compos",
  xg: "xG",
  fatigue: "Fatigue",
  motivation: "Enjeu",
  referee: "Arbitre",
  weather: "Météo",
};

export function FactorBreakdownView({
  breakdown,
  homeName,
  awayName,
  weights,
}: {
  breakdown: FB;
  homeName: string;
  awayName: string;
  weights: Record<keyof FB, number>;
}) {
  const keys = Object.keys(breakdown) as (keyof FB)[];
  const data = keys.map((k) => ({
    axis: LABELS[k],
    // Center around 0.5 so the radar is readable; positive = home advantage
    home: 0.5 + Math.max(-0.5, Math.min(0.5, breakdown[k] / 2)),
    away: 0.5 - Math.max(-0.5, Math.min(0.5, breakdown[k] / 2)),
    weight: weights[k],
    raw: breakdown[k],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Décomposition des 9 facteurs</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-[2fr_3fr]">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius="78%">
              <PolarGrid stroke="#27272a" />
              <PolarAngleAxis
                dataKey="axis"
                tick={{ fill: "#a1a1aa", fontSize: 11 }}
                stroke="#3f3f46"
              />
              <Radar
                name={homeName}
                dataKey="home"
                stroke="#34d399"
                fill="#34d399"
                fillOpacity={0.3}
              />
              <Radar
                name={awayName}
                dataKey="away"
                stroke="#f472b6"
                fill="#f472b6"
                fillOpacity={0.25}
              />
            </RadarChart>
          </ResponsiveContainer>
          <div className="mt-1 flex items-center justify-center gap-4 text-xs">
            <span className="inline-flex items-center gap-1 text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> {homeName}
            </span>
            <span className="inline-flex items-center gap-1 text-pink-300">
              <span className="h-2 w-2 rounded-full bg-pink-400" /> {awayName}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {data.map((d) => {
            const magnitude = Math.min(1, Math.abs(d.raw));
            const favorsHome = d.raw >= 0;
            return (
              <div
                key={d.axis}
                className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-200">{d.axis}</span>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                    poids {Math.round(d.weight * 100)}%
                  </span>
                </div>
                <div className="relative mt-2 flex h-2 w-full items-center">
                  <div className="absolute inset-0 rounded-full bg-zinc-800" />
                  <div
                    className={cn(
                      "absolute left-1/2 top-0 h-2 rounded-full",
                      favorsHome ? "bg-emerald-400" : "bg-pink-400",
                    )}
                    style={{
                      width: `${magnitude * 50}%`,
                      transform: favorsHome ? "translateX(0)" : "translateX(-100%)",
                    }}
                  />
                  <div className="absolute left-1/2 top-[-4px] h-4 w-px bg-zinc-600" />
                </div>
                <p className="mt-1 text-[11px] text-zinc-500">
                  {favorsHome ? homeName : awayName} ·{" "}
                  <span className="text-zinc-300">
                    {d.raw >= 0 ? "+" : ""}
                    {(d.raw * 100).toFixed(0)} pts
                  </span>
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
