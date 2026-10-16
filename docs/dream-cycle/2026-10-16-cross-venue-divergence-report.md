# cross-venue-divergence — kdreams nightly research (2026-10-16)

> kdreams nightly (GitHub Actions, observe-only research). Model: qwen/qwen3.7-flash via Alibaba (6870 tokens, $0.00043).
> Nothing here placed an order. Verdict is INCONCLUSIVE by construction: the hypothesis
> below is frozen tonight and can only be tested on snapshots recorded after it.

## Observations — 2-4 bullets about "cross-venue-divergence", each citing a number from EVIDENCE.

- Polymarket maker proxy yields -1.212c/attempt with 9% round-trip success, while Kalshi’s is -0.564c/attempt; the divergence stems from PM’s higher fill rate (26% vs 21%) but lower liquidity depth relative to order size.
- One-tick prevalence is near-universal on Polymarket (91% of two-sided rows) versus Kalshi (74%), indicating PM’s limit order book is thinner and more susceptible to immediate execution against resting quotes.
- Top one-tick candidates show extreme mid-price compression (e.g., Fed rate cut markets at 0.002–0.004), suggesting that "one-tick" status often reflects binary resolution proximity rather than active trading interest, creating false signals for spread capture.
- Fee structure disparity: PM taker fee is 1c vs Kalshi’s 1.75c; however, PM maker net is negative due to low fill rates, whereas Kalshi maker net is less negative despite higher fees, implying Kalshi’s wider spreads (median 1–2c) offer better protection against adverse selection for passive liquidity provision.

## Hypothesis — exactly one, in the form: "Given <market subset>, when <simple action>, then <metric from EVIDENCE> should be <direction/threshold> vs <baseline>, subject to <fee or risk invariant>."

Given high-volume Polymarket binary events with median 1c spread and mid-prices between 0.1 and 0.9, when placing a maker bid at the touch price (bid side), then the round-trip fill rate should exceed 15% (vs current 9% baseline) during UTC 5h–9h windows, subject to the invariant that total fees remain below 1c per contract filled.

## Next observation — one sentence: what to record or compute over the next 7 days to test it (no trading).

Record top-of-book snapshots every 15 minutes for the top 5 Polymarket markets by volume, calculating the time-to-fill for bids placed at the recorded touch price during UTC 5h–9h versus off-peak hours.

## Pair candidates — up to 3 lines "KALSHI_TICKER <-> polymarket id prefix — why" where the catalog excerpt shows the same real-world event on both venues, else "none found".

CONTROLH-2026-R <-> 0xd5d9fc47718bd553592d12 — Both track US House control post-2026 midterms; PM mid 0.905, KS mid 0.105 (likely different question framing or venue-specific resolution rules).
SENATETX-26-R <-> none found — Kalshi has Texas Senate winner (Talarico/Paxton), but no corresponding Polymarket market in the provided catalog excerpt.
KXFEDDECISION-26OCT-H0 <-> 0xa69ef420d8b4075ad8ba86 / 0x9cf563d7b55aa9aa876d5d — Kalshi tracks Fed decision outcome, Polymarket tracks specific rate change magnitudes (50+ bps, 25 bps); correlated but not identical resolution criteria.

## Evidence (recorded top-of-book, observe-only)

- Coverage: 2400 rows, 12 ticks, 407 Polymarket + 294 Kalshi markets, 2026-10-14T19:13Z .. 2026-10-16T09:38Z (3 day files).
- Polymarket spread: median 1c (p25 0.1, p75 1), one-tick 91% of 1103 two-sided rows; touch median bid 19507.15 / ask 18929.25.
- Polymarket maker proxy (4-tick horizon): 1004 attempts, fill 26%, round-trip 9%, net -1217.25c total = -1.212c/attempt (gross 23, fees 0, mark -1240.25).
- Kalshi spread: median 1c (p25 1, p75 2), one-tick 74% of 1200 two-sided rows; touch median bid 1647.93 / ask 9745.01.
- Kalshi maker proxy (4-tick horizon): 886 attempts, fill 21%, round-trip 7%, net -499.38c total = -0.564c/attempt (gross 14, fees 57.14, mark -456.25).
- Cross-venue: no pairs configured in config/kdreams.watchlist.json yet.
- Polymarket tightest UTC hours: 5h 97%, 22h 94%, 9h 94%; loosest: 19h 87%, 4h 87%.
- Top one-tick candidates: [pm] Will the Republican Party control the House after  (one-tick 100%, touch 772772.25, mid 0.095); [ks] 2027 Pro Football Champion — Minnesota (one-tick 100%, touch 606706.58, mid 0.035); [pm] Will the Democratic Party control the House after  (one-tick 100%, touch 589701.01, mid 0.905); [pm] Will the Fed decrease interest rates by 50+ bps af (one-tick 100%, touch 499142.18, mid 0.002); [pm] Will the Fed decrease interest rates by 25 bps aft (one-tick 100%, touch 373494.3, mid 0.004).
- Fees at 50c per contract: PM taker 1c / maker 0c; Kalshi taker 1.75c / maker 0.44c. One-cent maker round trip nets 1c on PM, 0.13c on Kalshi.

| venue | market | one-tick | touch | mid | 24h vol |
|---|---|---|---|---|---|
| pm | Will the Republican Party control the House after the 2026 M | 100% | 772772.25 | 0.095 | 69352.41 |
| ks | 2027 Pro Football Champion — Minnesota | 100% | 606706.58 | 0.035 | 151678.58 |
| pm | Will the Democratic Party control the House after the 2026 M | 100% | 589701.01 | 0.905 | 312580.02 |
| pm | Will the Fed decrease interest rates by 50+ bps after the Oc | 100% | 499142.18 | 0.002 | 1091483.28 |
| pm | Will the Fed decrease interest rates by 25 bps after the Oct | 100% | 373494.3 | 0.004 | 203534.21 |
| ks | SEA Seahawks vs DEN Broncos — Seattle | 100% | 348560.81 | 0.625 | 6717722.89 |
| pm | Will Shakhtar Donetsk win the 2026-27 UEFA Champions League  | 100% | 338878.53 | 0.002 | 423538.9 |
| ks | 2027 Pro Football Champion — Philadelphia | 100% | 287610.93 | 0.015 | 259532.52 |
| pm | Will the Fed increase interest rates by 50+ bps after the Oc | 100% | 228108.05 | 0.004 | 178915.47 |
| ks | Texas Senate winner? — James Talarico | 100% | 143094.84 | 0.615 | 253312.96 |

_Maker model is a proxy: a resting order counts as filled only when the recorded price trades through its level; no queue position is modeled._

## Witness
- session commit: `d28f694422e00d481bde5031b3d1c324216e4b30`
- report sha256: `5a4eb25699f2089d22980c07e1b12abbc24f405b723001ad118c46a1641d960a`
- witness: `725c3a33852ccb2a2fe54853e2e55049efe9d737411d37e0d0ad2ad9b7c4223f`
