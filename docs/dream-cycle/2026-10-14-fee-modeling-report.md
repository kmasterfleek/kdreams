# fee-modeling — kdreams nightly research (2026-10-14)

> kdreams nightly (GitHub Actions, observe-only research). Model: none.
> Nothing here placed an order. Verdict is INCONCLUSIVE by construction: the hypothesis
> below is frozen tonight and can only be tested on snapshots recorded after it.

**LLM_EVAL=blocked** — no `OPENROUTER_API_KEY` is configured, so no model-backed research ran tonight. This is an honest research-skipped night for the `fee-modeling` surface. The recorded evidence below is still real.

## Evidence (recorded top-of-book, observe-only)

- Coverage: 0 rows, 0 ticks, 0 Polymarket + 0 Kalshi markets, - .. - (0 day files).
- Polymarket spread: median n/ac (p25 n/a, p75 n/a), one-tick n/a of 0 two-sided rows; touch median bid n/a / ask n/a.
- Polymarket maker proxy (4-tick horizon): 0 attempts, fill n/a, round-trip n/a, net 0c total = n/ac/attempt (gross 0, fees 0, mark 0).
- Kalshi spread: median n/ac (p25 n/a, p75 n/a), one-tick n/a of 0 two-sided rows; touch median bid n/a / ask n/a.
- Kalshi maker proxy (4-tick horizon): 0 attempts, fill n/a, round-trip n/a, net 0c total = n/ac/attempt (gross 0, fees 0, mark 0).
- Cross-venue: no pairs configured in config/kdreams.watchlist.json yet.
- Fees at 50c per contract: PM taker 1c / maker 0c; Kalshi taker 1.75c / maker 0.44c. One-cent maker round trip nets 1c on PM, 0.13c on Kalshi.

_Maker model is a proxy: a resting order counts as filled only when the recorded price trades through its level; no queue position is modeled._

## Witness
- session commit: `0000000000000000000000000000000000000000`
- report sha256: `544f62d4062ed0d26ab6d8f45ce26bd1b1bafefc774229d177e803658bda74d1`
- witness: `7eea33eb8b9ae4996abf31cd58985c732d4d54a68e561a584e8c96d956497e03`
