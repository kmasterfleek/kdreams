# maker-spread-capture — kdreams nightly research (2026-10-30)

> kdreams nightly (GitHub Actions, observe-only research). Model: openai/gpt-6-sol via OpenAI (6822 tokens, $0.02153).
> Nothing here placed an order. Tonight's hypothesis is INCONCLUSIVE by construction: it is
> frozen at 2026-10-30T15:15Z and is only graded on snapshots recorded after that.

## Frozen hypotheses graded tonight

| H | spec | post-freeze ticks | value | n | grade | by | note |
|---|---|---|---|---|---|---|---|
| 2026-10-29 | resolution.netCentsPer10 > 1 (venue ks, entry 0.97..0.99, n>=100) | 91 | -158.1 | 11 | INCONCLUSIVE | code | resolution.netCentsPer10 = -158.1 on n=11, below the n>=100 needed |
| 2026-10-28 | pair.bothSidesFracNetPositive > 0.03 (pair house-2026-democratic, n>=300) | 188 | 0.247 | 376 | SUPPORTED | code | pair.bothSidesFracNetPositive = 0.247 vs > 0.03 on n=376 |
| 2026-10-27 | maker.netCentsPerAttempt > 0 (venue pm, UTC 7h-8h, mid 0.1..0.9, n>=300) | 285 | -1.112 | 436 | REFUTED | code | maker.netCentsPerAttempt = -1.112 vs > 0 on n=436 |

## Tonight's spec (frozen at 2026-10-30T15:15Z)

- maker.netCentsPerAttempt > 0 (venue pm, mid 0.9..0.99, n>=300)
- pre-freeze value: -0.437 on n=6581; graded on post-freeze data once it has 48 ticks and n >= 300

## Observations
- One-tick spreads dominate two-sided rows: 88% on Polymarket and 91% on Kalshi. A visible tick is not necessarily captured profit.
- The 60-minute maker proxy is negative on both venues: −1.293c per attempt on Polymarket and −1.068c on Kalshi. Marks outweigh gross spread gains.
- At 50c, a one-cent maker round trip nets 1c per Polymarket contract but 0.13c per Kalshi contract before adverse marks. Kalshi also rounds a $10 order’s fee up to at least 1c.
- Large displayed touch is not evidence of fill priority: the proxy counts fills only after a recorded trade-through and models no queue position.

## Hypothesis
Given Polymarket markets entered at a mid of 0.9–0.99, when a one-tick resting-order maker attempt is evaluated over the recorded 60-minute horizon, then maker.netCentsPerAttempt should be > 0c vs the Polymarket baseline of −1.293c per attempt, subject to adverse marks being included.

## Hypothesis spec
```json
{"metric":"maker.netCentsPerAttempt","venue":"pm","slice":{"midMin":0.9,"midMax":0.99},"op":">","threshold":0,"minN":300}
```

## Next observation
Over the next 7 days, record the same maker-proxy attempts and compute fills, round trips, and fee-and-mark-adjusted net per attempt for this entry-mid slice, without trading.

## Pair candidates
KXLIGUE1GAME-26OCT30HACP <-> 0x84853420 — PSG winning the listed match appears to be the same YES outcome; mids 0.755 and 0.745.

## Evidence (recorded top-of-book, observe-only)

- Coverage: 241862 rows, 1210 ticks, 3402 Polymarket + 2082 Kalshi markets, 2026-10-17T05:15Z .. 2026-10-30T15:15Z (14 day files); median gap between ticks 15 min.
- Polymarket spread: median 1c (p25 0.2, p75 1), one-tick 88% of 104098 two-sided rows; touch median bid 6649.57 / ask 5497.66.
- Polymarket maker proxy (60-minute horizon): 90168 attempts (1433 unobservable: no later snapshot inside the horizon), fill 22%, round-trip 19%, net -116547.6c total = -1.293c/attempt (gross 3699, fees 0, mark -120246.6).
- Kalshi spread: median 1c (p25 1, p75 1), one-tick 91% of 85133 two-sided rows; touch median bid 15687.49 / ask 46166.49.
- Kalshi maker proxy (60-minute horizon): 76656 attempts (855 unobservable: no later snapshot inside the horizon), fill 16%, round-trip 19%, net -81857.26c total = -1.068c/attempt (gross 2301, fees 4083.59, mark -80074.7).
- Pair CONTROLH-2026-R vs 0x4e4f77e7: n=1205, mean |diff| 1.09c, max 3c, >2c 4%; both-sides net-positive 7% (max 1.08c); leads: polymarket (lag 2, r=0.076).
- Pair CONTROLH-2026-D vs 0xd5d9fc47: n=1205, mean |diff| 0.93c, max 2.95c, >2c 4%; both-sides net-positive 6% (max 0.98c); leads: kalshi (lag -3, r=0.072).
- Polymarket tightest UTC hours: 10h 92%, 16h 92%, 8h 92%; loosest: 0h 80%, 1h 78%.
- Top one-tick candidates: [pm] Will the Fed decrease interest rates by 50+ bps af (one-tick 100%, touch 1500694.73, mid 0.001); [ks] Dallas vs Philadelphia: Spread — Dallas wins by ov (one-tick 98%, touch 1825757.65, mid 0.99); [ks] Kansas City vs Seattle: Spread — Seattle wins by o (one-tick 100%, touch 1321067.35, mid 0.99); [ks] Carolina vs Green Bay: Spread — Green Bay wins by  (one-tick 96%, touch 1674796.99, mid 0.99); [pm] Will Josh Stein win the 2028 Democratic presidenti (one-tick 100%, touch 968966.56, mid 0.002).
- Hold to resolution (5446 settled markets recorded; buy the favored side with $10 at the first snapshot in a price band, hold to settlement, taker fees in): pm 0.5-0.9 n=1969 win 64% net -36.8c/$10; pm 0.9-0.95 n=784 win 91% net -9.2c/$10; pm 0.95-0.97 n=492 win 96% net 2.6c/$10; pm 0.97-0.99 n=592 win 98% net 2.8c/$10; pm 0.99-1 n=733 win 100% net -0.5c/$10; ks 0.5-0.9 n=746 win 67% net -16.5c/$10; ks 0.9-0.95 n=357 win 92% net -9.7c/$10; ks 0.95-0.97 n=231 win 94% net -18.8c/$10; ks 0.97-0.99 n=269 win 98% net 3.7c/$10; ks 0.99-1 n=249 win 98% net -7.2c/$10. Best net-positive band with n >= 20: ks 0.97-0.99.
- Fees at 50c per contract: PM taker 1c / maker 0c; Kalshi taker 1.75c / maker 0.44c. One-cent maker round trip nets 1c on PM, 0.13c on Kalshi.

| venue | market | one-tick | touch | mid | 24h vol |
|---|---|---|---|---|---|
| pm | Will the Fed decrease interest rates by 50+ bps after the Oc | 100% | 1500694.73 | 0.001 | 552685.1 |
| ks | Dallas vs Philadelphia: Spread — Dallas wins by over 4.5 poi | 98% | 1825757.65 | 0.99 | 4562601.05 |
| ks | Kansas City vs Seattle: Spread — Seattle wins by over 2.5 po | 100% | 1321067.35 | 0.99 | 3986980.44 |
| ks | Carolina vs Green Bay: Spread — Green Bay wins by over 3.5 p | 96% | 1674796.99 | 0.99 | 4557675.97 |
| pm | Will Josh Stein win the 2028 Democratic presidential nominat | 100% | 968966.56 | 0.002 | 70457 |
| ks | LA Chargers vs KC Chiefs — Los Angeles C | 100% | 956341.72 | 0.01 | 10732378.29 |
| ks | 2027 Pro Football Champion — New England | 100% | 878584.15 | 0.035 | 25176.62 |
| pm | Will Mitch Landrieu win the 2028 Democratic presidential nom | 100% | 872460.97 | 0.002 | 70306 |
| ks | Washington vs San Francisco: Spread — San Francisco wins by  | 96% | 1638735.26 | 0.01 | 5789583.77 |
| pm | Will Candace Owens win the 2028 Republican presidential nomi | 100% | 713735.13 | 0.003 | 72585.01 |

| venue | entry price | markets | unsized | win rate | net c per $10 | worst c | median hold h |
|---|---|---|---|---|---|---|---|
| pm | 0.5-0.9 | 1969 | 764 | 64% | -36.8 | -1020 | 2.9 |
| pm | 0.9-0.95 | 784 | 214 | 91% | -9.2 | -993.96 | 1.4 |
| pm | 0.95-0.97 | 492 | 146 | 96% | 2.6 | -963.46 | 1.3 |
| pm | 0.97-0.99 | 592 | 199 | 98% | 2.8 | -989.44 | 1.1 |
| pm | 0.99-1 | 733 | 295 | 100% | -0.5 | -990.4 | 0.9 |
| ks | 0.5-0.9 | 746 | 0 | 67% | -16.5 | -1035 | 2.6 |
| ks | 0.9-0.95 | 357 | 0 | 92% | -9.7 | -997 | 1 |
| ks | 0.95-0.97 | 231 | 0 | 94% | -18.8 | -963 | 1 |
| ks | 0.97-0.99 | 269 | 0 | 98% | 3.7 | -982 | 0.7 |
| ks | 0.99-1 | 249 | 0 | 98% | -7.2 | -991 | 0.6 |

_Hold to resolution counts only markets that have already settled, so long-dated markets are under-represented; one entry per market (per event on Kalshi)._

_Maker model is a proxy: a resting order counts as filled only when the recorded price trades through its level; no queue position is modeled._

## Witness
- session commit: `37a6de6e6208757be6372482a0e07052fd7bdce9`
- report sha256: `80b0a0e4d170a53be97aa93a16d8d54da6e713d78d779630f19e76d2f406abc0`
- witness: `5d82a48e527875e267a47ba74ed8a9d78baa65dcac31a8158b6df68d77c9cacd`
