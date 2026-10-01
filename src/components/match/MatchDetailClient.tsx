"use client";

import { useMemo, useState } from "react";
import type { MarketPrediction } from "@/types";
import { MarketTable } from "./MarketTable";
import { KellyCalculator } from "./KellyCalculator";

export function MatchDetailClient({ predictions }: { predictions: MarketPrediction[] }) {
  const bestEV = useMemo(
    () => [...predictions].sort((a, b) => b.ev - a.ev)[0] ?? predictions[0],
    [predictions],
  );
  const [selected, setSelected] = useState<MarketPrediction>(bestEV);

  return (
    <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
      <MarketTable
        predictions={predictions}
        onSelect={setSelected}
        selectedKey={selected?.market}
      />
      <KellyCalculator prediction={selected} />
    </div>
  );
}
