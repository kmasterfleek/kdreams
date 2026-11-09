# fee-modeling — kdreams nightly research (2026-11-09)

> kdreams nightly (GitHub Actions, observe-only research). Model: openai/gpt-6-sol via OpenAI (7011 tokens, $0.02261).
> Nothing here placed an order. Tonight's hypothesis is INCONCLUSIVE by construction: it is
> frozen at 2026-11-09T19:15Z and is only graded on snapshots recorded after that.

## Frozen hypotheses graded tonight

| H | spec | post-freeze ticks | value | n | grade | by | note |
|---|---|---|---|---|---|---|---|
| 2026-11-08 | pair.bothSidesFracNetPositive > 0.1 (pair house-2026-republican, n>=300) | 95 | n/a | 0 | INCONCLUSIVE | code | pair.bothSidesFracNetPositive not measurable on post-freeze data (n=0) |
| 2026-11-06 | pair.bothSidesFracNetPositive > 0.1 (pair house-2026-republican, n>=300) | 278 | n/a | 0 | INCONCLUSIVE | code | pair.bothSidesFracNetPositive not measurable on post-freeze data (n=0) |
| 2026-11-03 | pair.bothSidesFracNetPositive > 0.12 (pair house-2026-democratic, n>=300) | 527 | 0.141 | 156 | INCONCLUSIVE | code | pair.bothSidesFracNetPositive = 0.141 on n=156, below the n>=300 needed |

## Tonight's spec (frozen at 2026-11-09T19:15Z)

- resolution.netCentsPer10 > 1 (venue ks, entry 0.9..0.95, n>=100)
- pre-freeze value: 6.7 on n=394; graded on post-freeze data once it has 48 ticks and n >= 100

## Observations
- At 50c, Kalshi maker fees are 0.44c per contract versus 1.75c taker; a one-cent maker round trip leaves 0.13c before order-level rounding.
- Fee savings alone do not establish an edge: the Kalshi maker proxy netted −0.967c per attempt, including −77,353.9c in marks.
- The Kalshi favored-side 0.9–0.95 entry band netted 6.7c per $10 across 394 settled markets after taker fees. Its worst recorded outcome was −997c, so the mean is sensitive to losses.

## Hypothesis
Given Kalshi markets with favored-side entry prices from 0.9 to below 0.95, when modeling a $10 buy at the touch held to settlement, then resolution.netCentsPer10 should be > 1c versus the recorded 6.7c baseline, subject to taker fees and order-level fee rounding.

## Hypothesis spec
```json
{"metric":"resolution.netCentsPer10","venue":"ks","slice":{"priceMin":0.9,"priceMax":0.95},"op":">","threshold":1,"minN":100}
```

## Next observation
Over the next 7 days, record one qualifying entry per independent Kalshi event and compute settled-market net cents per $10 with rounded taker fees, without trading.

## Pair candidates
KXNFLSPREAD-26NOV09BUFMI <-> 0xae130eadd35add39a97bbc — Buffalo winning by over 3.5 points matches Bills −3.5; recorded mids are 0.485 and 0.475.

## Evidence (recorded top-of-book, observe-only)

- Coverage: 248796 rows, 1234 ticks, 3281 Polymarket + 2075 Kalshi markets, 2026-10-27T00:00Z .. 2026-11-09T19:15Z (14 day files); median gap between ticks 15 min.
- Polymarket spread: median 1c (p25 0.1, p75 1), one-tick 89% of 105836 two-sided rows; touch median bid 4272.88 / ask 3893.87.
- Polymarket maker proxy (60-minute horizon): 91828 attempts (2115 unobservable: no later snapshot inside the horizon), fill 22%, round-trip 18%, net -113375.7c total = -1.235c/attempt (gross 3556, fees 0, mark -116931.7).
- Kalshi spread: median 1c (p25 0.4, p75 1), one-tick 93% of 89662 two-sided rows; touch median bid 11879.29 / ask 29721.
- Kalshi maker proxy (60-minute horizon): 81751 attempts (1336 unobservable: no later snapshot inside the horizon), fill 17%, round-trip 16%, net -79079.34c total = -0.967c/attempt (gross 2322, fees 4047.55, mark -77353.9).
- Pair CONTROLH-2026-R vs 0x4e4f77e7: n=774, mean |diff| 1.03c, max 2.5c, >2c 2%; both-sides net-positive 17% (max 1.07c); leads: simultaneous (lag 0, r=0.323).
- Pair CONTROLH-2026-D vs 0xd5d9fc47: n=785, mean |diff| 0.94c, max 2.35c, >2c 1%; both-sides net-positive 13% (max 0.98c); leads: simultaneous (lag 0, r=0.442).
- Pair KXFEDDECISION-26DEC-H25 vs 0x8a419661: n=491, mean |diff| 0.65c, max 3c, >2c 20%; both-sides net-positive 3% (max 0.02c); leads: simultaneous (lag 0, r=0.75).
- Pair KXFEDDECISION-26DEC-H0 vs 0x723822eb: n=491, mean |diff| 1.29c, max 3.5c, >2c 23%; both-sides net-positive 0% (max 0.02c); leads: simultaneous (lag 0, r=0.564).
- Polymarket tightest UTC hours: 16h 93%, 12h 92%, 9h 92%; loosest: 2h 81%, 1h 80%.
- Top one-tick candidates: [pm] Will the Democratic Party control the House after  (one-tick 99%, touch 1491847.41, mid 0.999); [pm] Bills vs. Vikings (one-tick 100%, touch 1151360.78, mid 0.625); [pm] Will the Republican Party control the House after  (one-tick 98%, touch 1492591.77, mid 0.001); [ks] Carolina vs Green Bay: Spread — Green Bay wins by  (one-tick 96%, touch 1674796.99, mid 0.99); [pm] Will Josh Stein win the 2028 Democratic presidenti (one-tick 100%, touch 968966.56, mid 0.002).
- Hold to resolution (9094 settled markets recorded; buy the favored side with $10 at the first snapshot in a price band, hold to settlement, taker fees in): pm 0.5-0.9 n=1852 win 64% net -36c/$10; pm 0.9-0.95 n=841 win 92% net -1c/$10; pm 0.95-0.97 n=550 win 96% net 5c/$10; pm 0.97-0.99 n=667 win 98% net 1.4c/$10; pm 0.99-1 n=913 win 99% net -1.8c/$10; ks 0.5-0.9 n=702 win 69% net -6.1c/$10; ks 0.9-0.95 n=394 win 93% net 6.7c/$10; ks 0.95-0.97 n=263 win 95% net -4.3c/$10; ks 0.97-0.99 n=305 win 98% net -1c/$10; ks 0.99-1 n=254 win 99% net -3.6c/$10. Best net-positive band with n >= 20: ks 0.9-0.95.
- Fees at 50c per contract: PM taker 1c / maker 0c; Kalshi taker 1.75c / maker 0.44c. One-cent maker round trip nets 1c on PM, 0.13c on Kalshi.

| venue | market | one-tick | touch | mid | 24h vol |
|---|---|---|---|---|---|
| pm | Will the Democratic Party control the House after the 2026 M | 99% | 1491847.41 | 0.999 | 11996315.07 |
| pm | Bills vs. Vikings | 100% | 1151360.78 | 0.625 | 167783.68 |
| pm | Will the Republican Party control the House after the 2026 M | 98% | 1492591.77 | 0.001 | 7837040.74 |
| ks | Carolina vs Green Bay: Spread — Green Bay wins by over 3.5 p | 96% | 1674796.99 | 0.99 | 4557675.97 |
| pm | Will Josh Stein win the 2028 Democratic presidential nominat | 100% | 968966.56 | 0.002 | 70457 |
| ks | 2028 Democratic presidential nominee — Elizabeth Warren | 100% | 946033.81 | 0.002 | 19158.94 |
| ks | 2027 Pro Football Champion — Dallas | 100% | 839552.42 | 0.015 | 29978.57 |
| pm | Will Mitch Landrieu win the 2028 Democratic presidential nom | 100% | 827464.86 | 0.002 | 70306 |
| ks | Chicago vs Seattle — Seattle | 100% | 793279.28 | 0.01 | 29421813.39 |
| ks | Jacksonville vs Baltimore: Spread — Jacksonville wins by ove | 100% | 786568.6 | 0.99 | 5281381.52 |

| venue | entry price | markets | unsized | win rate | net c per $10 | worst c | median hold h |
|---|---|---|---|---|---|---|---|
| pm | 0.5-0.9 | 1852 | 0 | 64% | -36 | -1020 | 2.9 |
| pm | 0.9-0.95 | 841 | 1 | 92% | -1 | -998.22 | 1.4 |
| pm | 0.95-0.97 | 550 | 1 | 96% | 5 | -968.28 | 1.4 |
| pm | 0.97-0.99 | 667 | 5 | 98% | 1.4 | -983.67 | 1.2 |
| pm | 0.99-1 | 913 | 89 | 99% | -1.8 | -997.12 | 1.2 |
| ks | 0.5-0.9 | 702 | 0 | 69% | -6.1 | -1035 | 2.6 |
| ks | 0.9-0.95 | 394 | 0 | 93% | 6.7 | -997 | 1.2 |
| ks | 0.95-0.97 | 263 | 0 | 95% | -4.3 | -963 | 1.2 |
| ks | 0.97-0.99 | 305 | 0 | 98% | -1 | -982 | 0.9 |
| ks | 0.99-1 | 254 | 0 | 99% | -3.6 | -991 | 0.8 |

_Hold to resolution counts only markets that have already settled, so long-dated markets are under-represented; one entry per market (per event on Kalshi)._

_Maker model is a proxy: a resting order counts as filled only when the recorded price trades through its level; no queue position is modeled._

## Witness
- session commit: `52aada4f2e86d56583546900d2be3dbc2e2e811c`
- report sha256: `85fdfb2f741b8eb5130d94ea3a6f61f129f1c9da3cab1a05f30c3d26a7f9c5c9`
- witness: `0c5743af3f16d5195d089f28d880a9a50e110173ccf61ffd197a408449698dcd`
