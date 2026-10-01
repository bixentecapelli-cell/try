import type { Metadata } from "next";
import "./globals.css";
import { TopNav } from "@/components/nav/TopNav";

export const metadata: Metadata = {
  title: "Winamax Bet Analyzer — Dashboard prédictif football",
  description:
    "Analyse statistique des cotes Winamax (Ligue 1, Premier League, Liga, UCL) avec Safe Bets, Value Bets et combinés intelligents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        <TopNav />
        {children}
      </body>
    </html>
  );
}
