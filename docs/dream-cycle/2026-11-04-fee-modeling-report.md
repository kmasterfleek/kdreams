# fee-modeling — kdreams nightly research (2026-11-04)

> kdreams nightly (GitHub Actions, observe-only research). Model: openai/gpt-6-sol via OpenAI (6703 tokens, $0.02047).
> Nothing here placed an order. Tonight's hypothesis is INCONCLUSIVE by construction: it is
> frozen at 2026-11-04T14:30Z and is only graded on snapshots recorded after that.

## Frozen hypotheses graded tonight

| H | spec | post-freeze ticks | value | n | grade | by | note |
|---|---|---|---|---|---|---|---|
| 2026-11-03 | pair.bothSidesFracNetPositive > 0.12 (pair house-2026-democratic, n>=300) | 84 | 0.141 | 156 | INCONCLUSIVE | code | pair.bothSidesFracNetPositive = 0.141 on n=156, below the n>=300 needed |
| 2026-11-02 | maker.netCentsPerAttempt > 0 (venue pm, UTC 16h-17h, n>=300) | 149 | -0.104 | 320 | REFUTED | code | maker.netCentsPerAttempt = -0.104 vs > 0 on n=320 |
| 2026-10-29 | resolution.netCentsPer10 > 1 (venue ks, entry 0.97..0.99, n>=100) | 536 | -13.3 | 143 | REFUTED | code | resolution.netCentsPer10 = -13.3 vs > 1 on n=143 |

## Tonight's spec (frozen at 2026-11-04T14:30Z)

- resolution.netCentsPer10 > 1 (venue ks, entry 0.5..0.9, n>=100)
- pre-freeze value: 7.3 on n=735; graded on post-freeze data once it has 48 ticks and n >= 100

## Observations
- At 50c, a one-cent maker round trip nets 1c per Polymarket contract but only 0.13c on Kalshi after modeled maker fees. Kalshi’s per-order cent rounding further matters for roughly $10 orders.
- The 60-minute maker proxies remain negative after fees and marks: −1.298c per Polymarket attempt and −1.012c per Kalshi attempt. A favorable fee schedule alone does not establish a flywheel.
- Kalshi favored-side entries priced 0.5–0.9 returned 7.3c per $10 across 735 settled markets; its higher-price bands were all negative. This settled-only sample under-represents long-dated markets.

## Hypothesis
Given Kalshi markets whose favored-side entry price is 0.5–0.9, when modeling a $10 purchase at the recorded touch held to settlement, then resolution.netCentsPer10 should be > 1c vs the recorded 7.3c per $10, subject to taker fees and full-loss outcomes being included.

## Hypothesis spec
```json
{"metric":"resolution.netCentsPer10","venue":"ks","slice":{"priceMin":0.5,"priceMax":0.9},"op":">","threshold":1,"minN":100}
```

## Next observation
Over the next 7 days, compute this metric on newly recorded, independently settled Kalshi markets, retaining per-order fee rounding and reporting the number of distinct events; do not trade.

## Pair candidates
KXMAYORLA-26-NRAM <-> 0x694595d0 — Nithya Raman winning Los Angeles mayor; mids 0.984 and 0.983.

## Evidence (recorded top-of-book, observe-only)

- Coverage: 253592 rows, 1269 ticks, 3238 Polymarket + 2002 Kalshi markets, 2026-10-22T00:00Z .. 2026-11-04T14:30Z (14 day files); median gap between ticks 15 min.
- Polymarket spread: median 1c (p25 0.2, p75 1), one-tick 89% of 107582 two-sided rows; touch median bid 6741.85 / ask 5300.28.
- Polymarket maker proxy (60-minute horizon): 93778 attempts (1579 unobservable: no later snapshot inside the horizon), fill 22%, round-trip 18%, net -121714.85c total = -1.298c/attempt (gross 3618, fees 0, mark -125332.85).
- Kalshi spread: median 1c (p25 1, p75 1), one-tick 93% of 91486 two-sided rows; touch median bid 15463.29 / ask 43490.57.
- Kalshi maker proxy (60-minute horizon): 83590 attempts (1020 unobservable: no later snapshot inside the horizon), fill 17%, round-trip 17%, net -84608.81c total = -1.012c/attempt (gross 2388, fees 4365.86, mark -82631.05).
- Pair CONTROLH-2026-R vs 0x4e4f77e7: n=1248, mean |diff| 1.05c, max 3c, >2c 4%; both-sides net-positive 12% (max 1.08c); leads: simultaneous (lag 0, r=0.198).
- Pair CONTROLH-2026-D vs 0xd5d9fc47: n=1259, mean |diff| 0.95c, max 2.95c, >2c 3%; both-sides net-positive 10% (max 0.98c); leads: simultaneous (lag 0, r=0.247).
- Polymarket tightest UTC hours: 16h 93%, 10h 92%, 13h 92%; loosest: 2h 80%, 1h 79%.
- Top one-tick candidates: [ks] Dallas vs Philadelphia: Spread — Dallas wins by ov (one-tick 98%, touch 1825757.65, mid 0.99); [ks] Kansas City vs Seattle: Spread — Seattle wins by o (one-tick 100%, touch 1321067.35, mid 0.99); [ks] Carolina vs Green Bay: Spread — Green Bay wins by  (one-tick 96%, touch 1674796.99, mid 0.99); [pm] Will Josh Stein win the 2028 Democratic presidenti (one-tick 100%, touch 968966.56, mid 0.002); [pm] Will the Democratic Party control the House after  (one-tick 98%, touch 1292676.49, mid 0.999).
- Hold to resolution (7088 settled markets recorded; buy the favored side with $10 at the first snapshot in a price band, hold to settlement, taker fees in): pm 0.5-0.9 n=1910 win 64% net -35.8c/$10; pm 0.9-0.95 n=820 win 91% net -11.1c/$10; pm 0.95-0.97 n=541 win 96% net -3c/$10; pm 0.97-0.99 n=622 win 98% net 0.3c/$10; pm 0.99-1 n=782 win 99% net -3.9c/$10; ks 0.5-0.9 n=735 win 70% net 7.3c/$10; ks 0.9-0.95 n=375 win 92% net -9.9c/$10; ks 0.95-0.97 n=254 win 94% net -21.8c/$10; ks 0.97-0.99 n=297 win 98% net -1.7c/$10; ks 0.99-1 n=255 win 98% net -11.2c/$10. Best net-positive band with n >= 20: ks 0.5-0.9.
- Fees at 50c per contract: PM taker 1c / maker 0c; Kalshi taker 1.75c / maker 0.44c. One-cent maker round trip nets 1c on PM, 0.13c on Kalshi.

| venue | market | one-tick | touch | mid | 24h vol |
|---|---|---|---|---|---|
| ks | Dallas vs Philadelphia: Spread — Dallas wins by over 4.5 poi | 98% | 1825757.65 | 0.99 | 4562601.05 |
| ks | Kansas City vs Seattle: Spread — Seattle wins by over 2.5 po | 100% | 1321067.35 | 0.99 | 3986980.44 |
| ks | Carolina vs Green Bay: Spread — Green Bay wins by over 3.5 p | 96% | 1674796.99 | 0.99 | 4557675.97 |
| pm | Will Josh Stein win the 2028 Democratic presidential nominat | 100% | 968966.56 | 0.002 | 70457 |
| pm | Will the Democratic Party control the House after the 2026 M | 98% | 1292676.49 | 0.999 | 11996315.07 |
| pm | Will Mitch Landrieu win the 2028 Democratic presidential nom | 100% | 872460.97 | 0.002 | 70306 |
| ks | Chicago vs Seattle — Seattle | 100% | 793279.28 | 0.01 | 29421813.39 |
| ks | Philadelphia vs Washington: Spread — Washington wins by over | 96% | 1256701.78 | 0.985 | 4167766.69 |
| pm | Will Candace Owens win the 2028 Republican presidential nomi | 100% | 713735.13 | 0.003 | 500503.4 |
| ks | Kansas City vs Seattle — Seattle | 100% | 703283.56 | 0.99 | 10853721.46 |

| venue | entry price | markets | unsized | win rate | net c per $10 | worst c | median hold h |
|---|---|---|---|---|---|---|---|
| pm | 0.5-0.9 | 1910 | 136 | 64% | -35.8 | -1020 | 2.9 |
| pm | 0.9-0.95 | 820 | 44 | 91% | -11.1 | -993.96 | 1.4 |
| pm | 0.95-0.97 | 541 | 29 | 96% | -3 | -968.28 | 1.4 |
| pm | 0.97-0.99 | 622 | 44 | 98% | 0.3 | -989.44 | 1.2 |
| pm | 0.99-1 | 782 | 130 | 99% | -3.9 | -997.12 | 1 |
| ks | 0.5-0.9 | 735 | 0 | 70% | 7.3 | -1035 | 2.5 |
| ks | 0.9-0.95 | 375 | 0 | 92% | -9.9 | -997 | 1.1 |
| ks | 0.95-0.97 | 254 | 0 | 94% | -21.8 | -963 | 1.2 |
| ks | 0.97-0.99 | 297 | 0 | 98% | -1.7 | -982 | 0.9 |
| ks | 0.99-1 | 255 | 0 | 98% | -11.2 | -991 | 0.7 |

_Hold to resolution counts only markets that have already settled, so long-dated markets are under-represented; one entry per market (per event on Kalshi)._

_Maker model is a proxy: a resting order counts as filled only when the recorded price trades through its level; no queue position is modeled._

## Witness
- session commit: `f0dd9ccdb93698000bdafb5b0ed08b11d68b8164`
- report sha256: `96e2f542ec1a6509bc1564f9ecababe48e43e13ba2568742c14bd7bdff687c10`
- witness: `a5ef41788df386b8efeae8a2dafbf0057a2bbda24998cf7d87a0ff789634a211`
