# ☾ kdreams

**An observe-only nightly research loop over Polymarket and Kalshi, built on the
[Dream Machine](https://github.com/ruvnet/dream-machine) engine.**

The question it works on is small on purpose: *is there a simple action that
nets at least one cent on about $10 deployed (0.1% per trade) after fees, and
repeats reliably enough to be a flywheel?* At a 50c price, $10 buys 20
contracts, so that is about 0.05c per contract; fees, not edge, are the hurdle.
It never trades. It
records what the order books actually showed, forms one falsifiable hypothesis a
night, and writes the verdict down whether or not the answer was the hoped-for
one.

> Evaluation is not promotion. The machine never places an order and never
> merges; a human does both, separately, if ever.

## What runs

| Job | Cadence | What it does | Cost |
|---|---|---|---|
| `kdreams collect` | every 15 min, inside a ~6 h loop | Snapshots top-of-book for the 100 highest-volume markets on each venue plus the pinned pair markets (no keys, no accounts) and commits one NDJSON line per market to `data/snapshots/`. Each tick also records how up to 200 past-close markets per venue settled in `data/resolutions.ndjson`. GitHub drops most high-frequency cron runs, so each run loops on the quarter hour for up to 340 minutes and an hourly cron restarts it. | free CI minutes (public repo) |
| `kdreams nightly` | 09:00 UTC | Runs the backtest over the last 14 days, grades still-open frozen hypotheses on post-freeze snapshots (in code), hands the evidence and those grades to an OpenRouter model (GPT-6 Sol) for observations and one new hypothesis with a machine-readable spec, files a witnessed issue, and commits the report, one ledger row and `docs/dream-cycle/hypotheses.json` to main. | ~$0.014 / night (~$0.40 / month) on GPT-6 Sol; falls back to Qwen 3.7 flash, then GPT-5 nano |

Every night ends in exactly one verdict: **ACCEPT**, **REJECT**, or
**INCONCLUSIVE**. In this observe-only phase tonight's own row is always INCONCLUSIVE:
a hypothesis frozen tonight can only be tested on snapshots recorded after it.
Every hypothesis carries a spec: one metric the evaluator computes, a venue
or a configured pair, an optional slice (UTC hour window, mid-price range) and
a threshold, for example

```json
{"metric": "maker.netCentsPerAttempt", "venue": "pm", "slice": {"hoursUtc": [5, 10], "midMin": 0.1}, "op": ">", "threshold": 0.8}
```

Grading is arithmetic, not model judgment. Each later night computes exactly
that number on snapshots recorded after the freeze and grades it **SUPPORTED**
or **REFUTED** once there are `backtest.retestMinTicks` post-freeze ticks (48,
about 12 hours) and the metric's sample reaches `max(spec.minN,
backtest.retestMinN)` (at least 100 attempts, rows or checks). Before that it
stays **INCONCLUSIVE**. A hypothesis whose spec is missing or names something
the evaluator cannot measure (volume tiers, sub-15-minute cadence, depth beyond
the touch) is frozen as **UNGRADEABLE** and never graded. Grades land in the
ledger's prior-night fates column, in `docs/dream-cycle/hypotheses.json`, and
as a comment on the hypothesis's issue, which is then closed. The model sees
past grades the next night so it does not re-propose a refuted idea.

Two rules keep the model from grading itself on easy questions. A spec that the
pre-freeze data already satisfies is rejected, unless it is a **profit
prediction** (`maker.netCentsPerAttempt > t` with t >= 0, or
`pair.bothSidesFracNetPositive > t` with t > 0); "Kalshi maker still loses
money" restates the evidence and teaches nothing. And after any night whose
spec was not a profit prediction, the next night's spec must be one. A rejected
spec gets one retry with the reason; a second miss is frozen as UNGRADEABLE.
The model also sees its record: profit predictions made and supported, and how
many SUPPORTED grades were already true at freeze.

A SUPPORTED grade means the stated number held, nothing more: a higher round-
trip rate can still lose money per attempt. Read the spec, not the sentence. The point of the first month is to accumulate those
snapshots and sharpen the hypotheses, not to produce trades.

## Research surfaces (nightly rotation)

1. **maker-spread-capture** — how often the spread is exactly one tick, how much size rests at the touch, and a labeled proxy for whether a resting order would have filled and exited.
2. **cross-venue-divergence** — for hand-confirmed pairs of the same event, how far the two venues' mids drift and whether buying both sides ever nets positive after taker fees.
3. **liquidity-by-hour** — spread tightness by UTC hour and weekday.
4. **lead-lag** — which venue moves first on paired events.
5. **fee-modeling** — the published fee schedules as cents per contract, and what a one-cent round trip nets after them.

Every night's evidence, whatever the surface, also carries **hold-to-resolution**: buy the favored side with $10 when it first trades in a price band (say 97–99c), hold to settlement, and net taker fees (Kalshi's rounded up per order). Measured on `data/resolutions.ndjson` as `resolution.netCentsPer10` and `resolution.winRate`, sliced by entry price, hours to the scheduled close and UTC hour. One entry per market, one per event on Kalshi, and a touch showing under $10 of size is skipped. Only settled markets count, so long-dated ones are under-represented; one loss at 98c erases about 50 wins, so trust it only on a large sample.

## Fees are the whole game

| At a 50c price | Polymarket | Kalshi |
|---|---|---|
| Taker fee per contract | ~1.0c (4% category) | ~1.75c |
| Maker fee per contract | 0c | ~0.44c |
| One-cent maker round trip nets | 1.0c | ~0.13c |

Those rates live in `config/kdreams.watchlist.json` and are third-party reports
of the venues' published schedules as of October 2026. Re-verify them on the
venues' own fee pages before believing any edge claim the loop produces.

## Local use

Node 22.13+ or 24 (`.nvmrc` pins 24).

```bash
npm ci && npm run build
node scripts/kdreams-collect.mjs --dry-run        # fetch both venues, print 3 rows, write nothing
node scripts/kdreams-collect.mjs                  # append a snapshot to data/
node scripts/kdreams-backtest.mjs                 # markdown evidence report
node scripts/kdreams-backtest.mjs --summary       # ten-line summary
node scripts/kdreams-backtest.mjs --json          # full report
node scripts/kdreams-nightly.mjs --dry-run        # tonight's research, nothing filed
node packages/cli/dist/bin.js tui --path docs/dream-cycle/LEDGER.md
npm run check                                     # typecheck, build, lint, tests
```

Set `OPENROUTER_API_KEY` in the environment for a model-backed dry run;
without it the nightly still runs and reports `LLM_EVAL=blocked`. The model
chain is `OPENROUTER_MODEL` then `OPENROUTER_FALLBACKS`; each report records
which model and provider actually answered, what it cost, and any routes that
failed before it.

The scheduled nightly takes its primary model from the repo variable
`OPENROUTER_MODEL`, currently `openai/gpt-6-sol` (about $2 / $10 per million
input / output tokens on OpenRouter, roughly 4-7k tokens a night). The cheap
models stay in the chain only as fallbacks: proposing a sound, measurable
hypothesis needs more reasoning than the flash-tier models showed (night 3 on
Qwen paired a Republican market with a Democratic one).
If the variable is unset, the script falls back to its built-in default,
`deepseek/deepseek-v4-flash`. Change the model with
`gh variable set OPENROUTER_MODEL --body <openrouter-model-id>`.

## Data layout

```
data/snapshots/YYYY-MM-DD.ndjson   one line per market per tick: {t,v,id,b,a,bs,as,last,v24,oi}
data/catalog/polymarket.json       conditionId -> question, slug, tokens, tick, minSize, first/last seen
data/catalog/kalshi.json           ticker -> title, series, category, closeTime, first/last seen
data/catalog/kalshi-top.json       the 100 Kalshi tickers currently watched (rescanned every 6h)
data/resolutions.ndjson            one line per settled market: {t,v,id,y,at}, y = what a YES share paid
data/catalog/resolution-checks.json  when each unsettled past-close market was last checked
config/kdreams.watchlist.json      venue limits, fee rates, and hand-confirmed cross-venue pairs
docs/dream-cycle/LEDGER.md         one row per night, the only durable cross-night memory
docs/dream-cycle/*-report.md       each night's witnessed report
```

Pairs are the one thing the loop cannot discover safely on its own. The nightly
report proposes candidates; a human confirms a pair by adding
`{ "polymarketId": "<conditionId>", "kalshiTicker": "<ticker>" }` to the
watchlist, and only then does the cross-venue surface measure it.

## Setup on a fork

1. Add the repo secret `OPENROUTER_API_KEY` and the repo variable `OPENROUTER_MODEL` (this repo uses `openai/gpt-6-sol`).
2. Allow Actions to create pull requests (Settings → Actions → General → Workflow permissions).
3. Run `kdreams collect` once by hand from the Actions tab, then let the schedules take over.

## Safety

- **Observe-only.** No order endpoint, wallet, or venue credential exists anywhere in this repository or its workflows.
- **Human merge authority.** Auto-merge is off. The nightly commits only research artifacts (report, ledger row, hypothesis registry) to main; any code or config change goes through a human-reviewed PR.
- **Witnessed provenance.** Every report is bound to its commit by a reproducible double-sha256.
- **Honest degradation.** No API key, a failed venue, or an empty data directory produce a recorded `blocked` night, never a fabricated finding.

## Upstream

The engine (config compiler, ledger toolkit, witness, TUI, CLI) is
[ruvnet/dream-machine](https://github.com/ruvnet/dream-machine), MIT © rUv,
kept intact under `packages/`. kdreams adds the collector, the metrics
library, the backtest evaluator, the nightly runner, and the two workflows.

## License

MIT. Engine © [rUv](https://github.com/ruvnet); kdreams additions © kmasterfleek.
