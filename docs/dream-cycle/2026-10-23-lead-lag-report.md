# lead-lag — kdreams nightly research (2026-10-23)

> kdreams nightly (GitHub Actions, observe-only research). Model: openai/gpt-6-sol via OpenAI (6777 tokens, $0.02084).
> Nothing here placed an order. Tonight's hypothesis is INCONCLUSIVE by construction: it is
> frozen at 2026-10-23T13:45Z and is only graded on snapshots recorded after that.

## Frozen hypotheses graded tonight

| H | spec | post-freeze ticks | value | n | grade | by | note |
|---|---|---|---|---|---|---|---|
| 2026-10-22 | spread.fracOneCent < 0.89 (venue pm, UTC 2h-4h, n>=300) | 95 | 0.832 | 661 | SUPPORTED | code | spread.fracOneCent = 0.832 vs < 0.89 on n=661; already true before the freeze, so no information |
| 2026-10-21 | pair.bothSidesFracNetPositive < 0.01 (pair house-2026-republican, n>=300) | 191 | 0 | 372 | SUPPORTED | code | pair.bothSidesFracNetPositive = 0 vs < 0.01 on n=372; already true before the freeze, so no information |

## Tonight's spec (frozen at 2026-10-23T13:45Z)

- resolution.netCentsPer10 > 1 (venue pm, entry 0.97..0.99, n>=100)
- pre-freeze value: 3 on n=327; graded on post-freeze data once it has 48 ticks and n >= 100
- tonight was a required profit night (previous hypothesis 2026-10-22 did not predict profit)

## Observations
- The Republican House pair shows a Polymarket lead at lag 2 (r=0.134), but its mean absolute price difference is 0.98c and buy-both-sides checks are net-positive 0% of the time.
- The Democratic House pair shows a Polymarket lead at lag 1 (r=0.253); buy-both-sides checks are likewise net-positive 0%.
- The recorded median tick gap is 15 minutes, so these lag results do not establish an actionable news-latency window.

## Hypothesis
Given Polymarket markets with a favored-side entry price from 0.97 to below 0.99, when buying that side at the touch and holding to settlement, then resolution.netCentsPer10 should be > 1 cent per $10 vs the recorded 3 cents per $10, subject to taker fees and full settlement losses.

## Hypothesis spec
```json
{"metric":"resolution.netCentsPer10","venue":"pm","slice":{"priceMin":0.97,"priceMax":0.99},"op":">","threshold":1,"minN":100}
```

## Next observation
Over the next 7 days, record first eligible entries and eventual per-market settlements, retaining unresolved markets so the test exposes settlement-selection bias; do not trade.

## Pair candidates
KXFEDDECISION-26OCT-H0 <-> 0xdf9bf27e — Fed maintains rate; mids 0.925 vs 0.915.
CONTROLS-2026-R <-> 0x86bfb53a — Republican Senate control; both mids 0.325.
KXBALANCEPOWERCOMBO-27FE <-> 0xc5eae79d — Republican sweep; mids 0.088 vs 0.075.

## Evidence (recorded top-of-book, observe-only)

- Coverage: 114733 rows, 575 ticks, 2149 Polymarket + 1362 Kalshi markets, 2026-10-14T19:13Z .. 2026-10-23T13:45Z (10 day files); median gap between ticks 15 min.
- Polymarket spread: median 1c (p25 0.1, p75 1), one-tick 89% of 49259 two-sided rows; touch median bid 11817.25 / ask 12215.41.
- Polymarket maker proxy (60-minute horizon): 41901 attempts (1934 unobservable: no later snapshot inside the horizon), fill 20%, round-trip 18%, net -48091c total = -1.148c/attempt (gross 1485, fees 0, mark -49576).
- Kalshi spread: median 1c (p25 1, p75 1), one-tick 90% of 39912 two-sided rows; touch median bid 16764.25 / ask 48978.4.
- Kalshi maker proxy (60-minute horizon): 34334 attempts (1370 unobservable: no later snapshot inside the horizon), fill 16%, round-trip 20%, net -35904.56c total = -1.046c/attempt (gross 1046, fees 1823.3, mark -35127.25).
- Pair CONTROLH-2026-R vs 0x4e4f77e7: n=564, mean |diff| 0.98c, max 2c, >2c 0%; both-sides net-positive 0% (max 0.04c); leads: polymarket (lag 2, r=0.134).
- Pair CONTROLH-2026-D vs 0xd5d9fc47: n=570, mean |diff| 0.73c, max 1.35c, >2c 0%; both-sides net-positive 0% (max -0.15c); leads: polymarket (lag 1, r=0.253).
- Polymarket tightest UTC hours: 10h 93%, 8h 93%, 7h 92%; loosest: 2h 84%, 1h 83%.
- Top one-tick candidates: [pm] Will the Fed decrease interest rates by 50+ bps af (one-tick 100%, touch 1449360.61, mid 0.001); [pm] Will Mitch Landrieu win the 2028 Democratic presid (one-tick 100%, touch 1035440.59, mid 0.002); [ks] Carolina vs Philadelphia: Spread — Carolina wins b (one-tick 100%, touch 969785.09, mid 0.99); [ks] 2027 Pro Football Champion — Atlanta (one-tick 100%, touch 914489.11, mid 0.015); [pm] Will the Democratic Party control the House after  (one-tick 100%, touch 881035.1, mid 0.925).
- Hold to resolution (2890 settled markets recorded; buy the favored side with $10 at the first snapshot in a price band, hold to settlement, taker fees in): pm 0.5-0.9 n=1070 win 63% net -57.4c/$10; pm 0.9-0.95 n=372 win 92% net 0.1c/$10; pm 0.95-0.97 n=240 win 95% net -8.8c/$10; pm 0.97-0.99 n=327 win 98% net 3c/$10; pm 0.99-1 n=379 win 100% net 2.3c/$10; ks 0.5-0.9 n=437 win 66% net -46.7c/$10; ks 0.9-0.95 n=179 win 92% net -6.2c/$10; ks 0.95-0.97 n=121 win 94% net -15.8c/$10; ks 0.97-0.99 n=142 win 98% net 1.5c/$10; ks 0.99-1 n=133 win 99% net 1.4c/$10. Best net-positive band with n >= 20: pm 0.97-0.99.
- Fees at 50c per contract: PM taker 1c / maker 0c; Kalshi taker 1.75c / maker 0.44c. One-cent maker round trip nets 1c on PM, 0.13c on Kalshi.

| venue | market | one-tick | touch | mid | 24h vol |
|---|---|---|---|---|---|
| pm | Will the Fed decrease interest rates by 50+ bps after the Oc | 100% | 1449360.61 | 0.001 | 124324.71 |
| pm | Will Mitch Landrieu win the 2028 Democratic presidential nom | 100% | 1035440.59 | 0.002 | 62400 |
| ks | Carolina vs Philadelphia: Spread — Carolina wins by over 3.5 | 100% | 969785.09 | 0.99 | 1114748.96 |
| ks | 2027 Pro Football Champion — Atlanta | 100% | 914489.11 | 0.015 | 12308.13 |
| pm | Will the Democratic Party control the House after the 2026 M | 100% | 881035.1 | 0.925 | 310126.44 |
| ks | 2027 Pro Football Champion — New England | 100% | 878584.15 | 0.035 | 25176.62 |
| ks | Washington vs San Francisco: Spread — San Francisco wins by  | 96% | 1638735.26 | 0.01 | 5789583.77 |
| ks | 2027 Pro Football Champion — Houston | 100% | 837925.73 | 0.035 | 627816.53 |
| pm | Will the Republican Party control the House after the 2026 M | 100% | 773822.69 | 0.075 | 136190.7 |
| ks | 2027 Pro Football Champion — Cincinnati | 100% | 772653.68 | 0.035 | 61564.78 |

| venue | entry price | markets | unsized | win rate | net c per $10 | worst c | median hold h |
|---|---|---|---|---|---|---|---|
| pm | 0.5-0.9 | 1070 | 907 | 63% | -57.4 | -1020 | 2.8 |
| pm | 0.9-0.95 | 372 | 235 | 92% | 0.1 | -993.96 | 1.5 |
| pm | 0.95-0.97 | 240 | 151 | 95% | -8.8 | -963.46 | 1.5 |
| pm | 0.97-0.99 | 327 | 209 | 98% | 3 | -987.51 | 1.3 |
| pm | 0.99-1 | 379 | 257 | 100% | 2.3 | -990.4 | 1.1 |
| ks | 0.5-0.9 | 437 | 0 | 66% | -46.7 | -1035 | 2.9 |
| ks | 0.9-0.95 | 179 | 0 | 92% | -6.2 | -997 | 1.1 |
| ks | 0.95-0.97 | 121 | 0 | 94% | -15.8 | -963 | 1 |
| ks | 0.97-0.99 | 142 | 0 | 98% | 1.5 | -982 | 0.7 |
| ks | 0.99-1 | 133 | 0 | 99% | 1.4 | -991 | 0.6 |

_Hold to resolution counts only markets that have already settled, so long-dated markets are under-represented; one entry per market (per event on Kalshi)._

_Maker model is a proxy: a resting order counts as filled only when the recorded price trades through its level; no queue position is modeled._

## Witness
- session commit: `0637d2a5fd2ff09adb7dd1bace231f7d4adfed32`
- report sha256: `8f2528b2c1569c895a58d31e4156614510c05b8d5f3b76c7bfaf04843df4cd98`
- witness: `de5ed3ea9f4d4b00e9e48e369ba869e1372c48f5e483ca025f8725f0a8f296aa`
