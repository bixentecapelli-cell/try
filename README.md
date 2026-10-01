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

Priorité descendante :

1. **The Odds API** (`src/lib/scrapers/odds-api.ts`) — vraies cotes publiques
   agrégées (Winamax, Unibet, Betclic, Pinnacle, Bwin…). Nécessite la variable
   d'environnement `ODDS_API_KEY` (compte gratuit sur
   [the-odds-api.com](https://the-odds-api.com), 500 req/mois). C'est le mode
   recommandé en prod — fonctionne depuis Vercel.
2. **Scraper direct Winamax** (`src/lib/scrapers/winamax-live.ts`) — fetch
   l'HTML du board et extrait le `PRELOADED_STATE`. Souvent bloqué par le WAF
   Cloudflare depuis les IPs Vercel, mais marche en local.
3. **Dataset mock dynamique** (`src/lib/data/mock.ts` → `getMockMatches()`) —
   6 matchs calibrés avec kickoffs toujours relatifs à "aujourd'hui". Utilisé
   quand les deux sources live sont KO, pour que la démo reste présentable.

Les stats profondes (xG, forme, H2H) ne sont jamais retournées par les APIs
publiques : elles sont mergées depuis le mock dataset par nom d'équipe
(correspondance exacte ou "best effort"). Pour une prod sérieuse, brancher
Football-Data.org ou API-Football en 4ème couche d'enrichissement.

### Config Vercel

Dans le projet Vercel → **Settings** → **Environment Variables** :

| Key | Value | Scopes |
|-----|-------|--------|
| `ODDS_API_KEY` | ton API key the-odds-api.com | Production, Preview, Development |

Redéploie après l'ajout. Le badge "source" du dashboard devient `Live · The
Odds API` quand la clé est détectée et que l'API répond.

Le hook de persistence `recordSnapshot()` sauvegarde chaque poll pour que
l'Odds Tracker puisse afficher les variations réelles de cote dès que
l'historique est constitué.

## Déploiement

Prêt pour Vercel : poussez sur `main` (ou toute branche) et le preview sort
automatiquement. Le projet est à la racine du repository.

## Avertissement

Les paris sportifs comportent des risques. Cet outil est un dashboard
d'analyse pédagogique, pas une recommandation de mise.
