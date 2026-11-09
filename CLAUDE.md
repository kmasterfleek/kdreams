# kdreams

Observe-only nightly research loop over Polymarket and Kalshi, built on the Dream Machine engine.

## Rules

- Observe-only: never add order placement or venue credentials anywhere in this repo.
- No wallet of our own (keys, seed phrases, funded or signing addresses) without Kunal's express approval, given for that specific wallet and recorded in the PR that adds it. Recording other traders' public wallet addresses from the venues' public trade feeds is observation and is allowed.
- The collector must stay dependency-free (native fetch and fs only); the 15-minute job does not run `npm ci`. The trade tape (`scripts/kdreams-tape.mjs`) runs inside it under the same rule.
- `data/` is append-only. Never rewrite or squash snapshot history.
- Fee rates in `config/kdreams.watchlist.json` are inputs, not facts; cite the venue fee page when changing them.
- Run `npm run check` before pushing. Tests for the kdreams scripts live in `scripts/kdreams.test.mjs`.
- Keep the engine under `packages/` intact; kdreams logic lives in `scripts/` and `config/`.

## Key files

- `config/kdreams.watchlist.json` — venue limits, fee rates, hand-confirmed cross-venue pairs
- `scripts/kdreams-collect.mjs` — snapshot collector
- `scripts/kdreams-tape.mjs` — trade tape: large trades (`data/trades/`), per-market taker flow (`data/flow/`), wallet profiles (`data/catalog/wallets.json`)
- `scripts/lib/kdreams-metrics.mjs` — pure metrics
- `scripts/kdreams-backtest.mjs` — evaluator and report renderer
- `scripts/kdreams-nightly.mjs` — nightly research runner
- `docs/dream-cycle/LEDGER.md` — one row per night
