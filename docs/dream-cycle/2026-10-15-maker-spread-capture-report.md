# maker-spread-capture — kdreams nightly research (2026-10-15)

> kdreams nightly (GitHub Actions, observe-only research). Model: qwen/qwen3.7-flash via Alibaba (5775 tokens, $0.00037).
> Nothing here placed an order. Verdict is INCONCLUSIVE by construction: the hypothesis
> below is frozen tonight and can only be tested on snapshots recorded after it.

## Observations — 2-4 bullets about "maker-spread-capture", each citing a number from EVIDENCE.
- Polymarket’s median spread is 1c with one-tick prevalence at 90%, yet the maker proxy yields -0.674c/attempt due to an 8% round-trip rate, indicating that resting orders are frequently crossed before capture.
- Kalshi exhibits wider spreads (median 1c, p75 2.25c) and higher fees (taker 1.75c), resulting in a less negative but still unprofitable maker proxy of -0.238c/attempt despite similar fill rates (20%).
- The fee structure favors Polymarket for makers (0c vs Kalshi 0.44c), allowing a theoretical net of 1c per contract on PM if filled, whereas Kalshi nets only 0.13c after the 1.75c taker cost is avoided by making.
- Tightest liquidity on Polymarket occurs during UTC 5h (97%) and 22h (94%), suggesting temporal clustering of opportunities where spread capture is most viable.

## Hypothesis — exactly one, in the form: "Given <market subset>, when <simple action>, then <metric from EVIDENCE> should be <direction/threshold> vs <baseline>, subject to <fee or risk invariant>."
Given Polymarket markets with mid-price > 0.10 and spread = 1c, when placing a limit order at the best bid during UTC 5h–10h, then the net profit per attempt should exceed 0.8c vs the baseline of -0.674c, subject to the 0c maker fee invariant and no queue position guarantee.

## Next observation — one sentence: what to record or compute over the next 7 days to test it (no trading).
Record top-of-book snapshots every 15 minutes for Polymarket markets with 1c spreads during UTC 5h–10h to calculate the time-to-fill distribution for bids placed at the best bid level.

## Pair candidates — up to 3 lines "KALSHI_TICKER <-> polymarket id prefix — why" where the catalog excerpt shows the same real-world event on both venues, else "none found".
none found

## Evidence (recorded top-of-book, observe-only)

- Coverage: 1200 rows, 6 ticks, 234 Polymarket + 157 Kalshi markets, 2026-10-14T19:13Z .. 2026-10-15T10:10Z (2 day files).
- Polymarket spread: median 1c (p25 0.1, p75 1), one-tick 90% of 560 two-sided rows; touch median bid 14239.65 / ask 10703.75.
- Polymarket maker proxy (4-tick horizon): 504 attempts, fill 21%, round-trip 8%, net -339.9c total = -0.674c/attempt (gross 8, fees 0, mark -347.9).
- Kalshi spread: median 1c (p25 1, p75 2.25), one-tick 69% of 600 two-sided rows; touch median bid 651.74 / ask 6093.81.
- Kalshi maker proxy (4-tick horizon): 416 attempts, fill 20%, round-trip 7%, net -98.87c total = -0.238c/attempt (gross 6, fees 25.93, mark -78.95).
- Cross-venue: no pairs configured in config/kdreams.watchlist.json yet.
- Polymarket tightest UTC hours: 5h 97%, 22h 94%, 10h 93%; loosest: 0h 87%, 19h 85%.
- Fees at 50c per contract: PM taker 1c / maker 0c; Kalshi taker 1.75c / maker 0.44c. One-cent maker round trip nets 1c on PM, 0.13c on Kalshi.

_Maker model is a proxy: a resting order counts as filled only when the recorded price trades through its level; no queue position is modeled._

## Witness
- session commit: `cfba91b4fff44eaf4a08feb81f6a8444880ddc9e`
- report sha256: `718d812172aefda731b5a30d8bd33db87c32cfa16c92c92fa14843522e6fa8de`
- witness: `139bf439668906a190d50c1af78e4719d972b09190086b0903e46151fee1a9eb`
