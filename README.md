# Winamax Bet Analyzer

Dashboard prédictif pour les paris sportifs football, construit sur Next.js 15,
TypeScript, Tailwind et Recharts. L'app compare les probabilités réelles
estimées par un moteur statistique maison aux cotes Winamax dévig(u)ées pour
détecter les paris à Expected Value positive.

## Démarrer

```bash
npm install
npm run dev           # http://localhost:3000
npm run build         # build production
npm start             # serve le build
```

## Architecture

```
src/
├── app/
│   ├── page.tsx                 → Dashboard (Instant Bet Picker + Accumulator)
│   ├── match/[id]/page.tsx      → Fiche match détaillée
│   ├── backtest/page.tsx        → Résultats ROI/yield sur 30 jours
│   └── api/matches/route.ts     → API JSON exposant matchs + prédictions
├── components/
│   ├── dashboard/               → BetPickerCards, AccumulatorBuilder, MatchListPreview
│   ├── match/                   → MatchHeader, FactorBreakdown, H2HPanel,
│   │                              MarketTable, KellyCalculator, OddsTracker
│   ├── backtest/                → BankrollChart, KpiTile, CategoryTable
│   ├── nav/TopNav.tsx
│   └── ui/                      → Primitives (Card, Badge, ProgressBar, Stars)
├── lib/
│   ├── engine/
│   │   ├── scoring.ts           → Modèle 9 facteurs + Poisson → 12 marchés
│   │   ├── accumulator.ts       → Smart Accumulator (safe/balanced/fun)
│   │   └── kelly.ts             → Kelly fractionné
│   ├── scrapers/
│   │   ├── winamax.ts           → Orchestrateur (live > enrichi > mock)
│   │   └── winamax-live.ts      → Scraper HTTP + parser PRELOADED_STATE
│   ├── history/
│   │   ├── snapshots.ts         → Ring buffer d'odds historiques
│   │   └── backtest.ts          → Agrégation ROI/yield/bankroll curve
│   └── data/
│       ├── mock.ts              → 6 matchs réalistes multi-ligues
│       └── historical.ts        → 30 jours de paris simulés
└── types/
```

## Moteur de scoring

Les 9 facteurs (`src/lib/engine/scoring.ts`) sont pondérés puis agrégés en un
"edge global" ∈ [-1, +1] qui module des λ Poisson par équipe. Une grille 9×9
produit les probabilités calibrées pour 12 marchés (1N2, double chance, O/U
1.5 & 2.5, BTTS). L'EV se calcule contre la probabilité implicite Winamax
dévig(u)ée.

| Facteur | Poids |
|---|---|
| Forme récente | 18% |
| xG & efficacité | 20% |
| Domicile / Extérieur | 14% |
| Compositions / absences | 14% |
| Fatigue (jours de repos) | 8% |
| H2H | 8% |
| Enjeu / motivation | 8% |
| Arbitre | 5% |
| Météo | 5% |

## Source de données

`src/lib/scrapers/winamax.ts` tente d'abord un fetch live sur Winamax
(`winamax-live.ts`), extrait le `PRELOADED_STATE` et normalise vers notre
type `Match`. Les stats profondes (xG, forme, H2H) sont ensuite mergées
depuis le mock dataset indexé par nom d'équipe. En cas d'échec (403,
timeout, DOM changé), l'orchestrateur retombe sur le dataset mock complet.

Le hook de persistence `recordSnapshot()` sauvegarde chaque poll pour que
l'Odds Tracker puisse afficher les variations réelles de cote dès que
l'historique est constitué.

## Déploiement

Prêt pour Vercel : poussez sur `main` (ou toute branche) et le preview sort
automatiquement. Le projet est à la racine du repository.

## Avertissement

Les paris sportifs comportent des risques. Cet outil est un dashboard
d'analyse pédagogique, pas une recommandation de mise.
