"use client";

import {
  AreaChart,
  Area,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BankrollPoint } from "@/lib/history/backtest";

interface Props {
  points: BankrollPoint[];
  startingBankroll: number;
}

export function BankrollChart({ points, startingBankroll }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Courbe de bankroll · 30 derniers jours</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="bankroll" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#34d399" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#a1a1aa", fontSize: 10 }}
              stroke="#3f3f46"
              tickFormatter={(v) => v.slice(5)}
            />
            <YAxis
              tick={{ fill: "#a1a1aa", fontSize: 10 }}
              stroke="#3f3f46"
              domain={["auto", "auto"]}
              tickFormatter={(v) => `${v} €`}
            />
            <ReferenceLine y={startingBankroll} stroke="#71717a" strokeDasharray="4 4" />
            <Tooltip
              contentStyle={{
                background: "#09090b",
                border: "1px solid #27272a",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "#d4d4d8" }}
              formatter={(value, name) => [`${value} €`, name === "bankroll" ? "Bankroll" : String(name ?? "")]}
            />
            <Area
              type="monotone"
              dataKey="bankroll"
              stroke="#34d399"
              strokeWidth={2}
              fill="url(#bankroll)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
