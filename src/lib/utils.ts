import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatOdds(odd: number): string {
  return odd.toFixed(2);
}

export function formatPercent(p: number, digits = 1): string {
  return `${(p * 100).toFixed(digits)}%`;
}

export function formatEV(ev: number): string {
  const sign = ev >= 0 ? "+" : "";
  return `${sign}${(ev * 100).toFixed(1)}%`;
}
