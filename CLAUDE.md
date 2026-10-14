# kdreams

Observe-only nightly research loop over Polymarket and Kalshi, built on the Dream Machine engine.

## Rules

- Observe-only: never add order placement, wallets, or venue credentials anywhere in this repo.
- The collector must stay dependency-free (native fetch and fs only); the 15-minute job does not run `npm ci`.
- `data/` is append-only. Never rewrite or squash snapshot history.
- Fee rates in `config/kdreams.watchlist.json` are inputs, not facts; cite the venue fee page when changing them.
- Run `npm run check` before pushing. Tests for the kdreams scripts live in `scripts/kdreams.test.mjs`.
- Keep the engine under `packages/` intact; kdreams logic lives in `scripts/` and `config/`.

## Key files

- `config/kdreams.watchlist.json` — venue limits, fee rates, hand-confirmed cross-venue pairs
- `scripts/kdreams-collect.mjs` — snapshot collector
- `scripts/lib/kdreams-metrics.mjs` — pure metrics
- `scripts/kdreams-backtest.mjs` — evaluator and report renderer
- `scripts/kdreams-nightly.mjs` — nightly research runner
- `docs/dream-cycle/LEDGER.md` — one row per night
