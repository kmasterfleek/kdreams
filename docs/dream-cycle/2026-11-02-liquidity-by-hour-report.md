# liquidity-by-hour — kdreams nightly research (2026-11-02)

> kdreams nightly (GitHub Actions, observe-only research). Model: openai/gpt-6-sol via OpenAI (6613 tokens, $0.02009).
> Nothing here placed an order. Tonight's hypothesis is INCONCLUSIVE by construction: it is
> frozen at 2026-11-02T18:45Z and is only graded on snapshots recorded after that.

## Frozen hypotheses graded tonight

| H | spec | post-freeze ticks | value | n | grade | by | note |
|---|---|---|---|---|---|---|---|
| 2026-11-01 | pair.bothSidesFracNetPositive > 0.1 (pair house-2026-democratic, n>=300) | 103 | 0.15 | 206 | INCONCLUSIVE | code | pair.bothSidesFracNetPositive = 0.15 on n=206, below the n>=300 needed |
| 2026-10-31 | pair.bothSidesFracNetPositive > 0.1 (pair house-2026-democratic, n>=300) | 202 | 0.191 | 404 | SUPPORTED | code | pair.bothSidesFracNetPositive = 0.191 vs > 0.1 on n=404 |
| 2026-10-29 | resolution.netCentsPer10 > 1 (venue ks, entry 0.97..0.99, n>=100) | 387 | -22.4 | 90 | INCONCLUSIVE | code | resolution.netCentsPer10 = -22.4 on n=90, below the n>=100 needed |

## Tonight's spec (frozen at 2026-11-02T18:45Z)

- maker.netCentsPerAttempt > 0 (venue pm, UTC 16h-17h, n>=300)
- pre-freeze value: -1.364 on n=4173; graded on post-freeze data once it has 48 ticks and n >= 300

## Observations
- Polymarket’s one-tick share is highest at 16h and 10h UTC (93% each), versus 79% at 1h UTC. This is a spread pattern, not evidence of executable liquidity.
- Across hours, the Polymarket maker proxy lost 1.3c per attempt despite a 1c median spread. Its 60-minute mark loss dominated gross spread capture.
- The collector’s median tick gap is 15 minutes; top-of-book snapshots cannot establish queue position or fills between ticks.

## Hypothesis
Given Polymarket markets entered from 16h to 17h UTC, when observing a one-tick-improvement maker attempt under the recorded proxy, then maker.netCentsPerAttempt should be > 0c vs the all-hours baseline of -1.3c per attempt, subject to the invariant that adverse marks can exceed the fee-free spread captured.

## Hypothesis spec
```json
{"metric":"maker.netCentsPerAttempt","venue":"pm","slice":{"hoursUtc":[16,17]},"op":">","threshold":0,"minN":300}
```

## Next observation
Over the next 7 days, compute the specified hourly proxy result and record attempted fills, round trips, and subsequent marks separately; do not treat a price trade-through as a queue-confirmed fill.

## Pair candidates
CONTROLS-2026-R <-> 0x86bfb53af7250a40928975 — Republican Senate control on both venues; mids both 0.265.  
KXBALANCEPOWERCOMBO-27FE <-> 0xc5eae79d1ffe7165723539 — Republicans sweep both chambers on both venues; mids 0.06 and 0.065.

## Evidence (recorded top-of-book, observe-only)

- Coverage: 262064 rows, 1312 ticks, 3428 Polymarket + 2077 Kalshi markets, 2026-10-20T00:00Z .. 2026-11-02T18:45Z (14 day files); median gap between ticks 15 min.
- Polymarket spread: median 1c (p25 0.2, p75 1), one-tick 89% of 113067 two-sided rows; touch median bid 7073.71 / ask 5539.82.
- Polymarket maker proxy (60-minute horizon): 98905 attempts (1355 unobservable: no later snapshot inside the horizon), fill 22%, round-trip 18%, net -128572.95c total = -1.3c/attempt (gross 3803, fees 0, mark -132375.95).
- Kalshi spread: median 1c (p25 1, p75 1), one-tick 92% of 94698 two-sided rows; touch median bid 17842.12 / ask 49052.49.
- Kalshi maker proxy (60-minute horizon): 86483 attempts (838 unobservable: no later snapshot inside the horizon), fill 16%, round-trip 18%, net -87122.29c total = -1.007c/attempt (gross 2355, fees 4349.4, mark -85127.95).
- Pair CONTROLH-2026-R vs 0x4e4f77e7: n=1307, mean |diff| 1.06c, max 3c, >2c 4%; both-sides net-positive 10% (max 1.08c); leads: polymarket (lag 2, r=0.049).
- Pair CONTROLH-2026-D vs 0xd5d9fc47: n=1307, mean |diff| 0.97c, max 2.95c, >2c 3%; both-sides net-positive 8% (max 0.98c); leads: polymarket (lag 1, r=0.065).
- Polymarket tightest UTC hours: 16h 93%, 10h 93%, 12h 92%; loosest: 2h 80%, 1h 79%.
- Top one-tick candidates: [ks] Dallas vs Philadelphia: Spread — Dallas wins by ov (one-tick 98%, touch 1825757.65, mid 0.99); [ks] Kansas City vs Seattle: Spread — Seattle wins by o (one-tick 100%, touch 1321067.35, mid 0.99); [ks] Chicago vs Seattle: Spread — Seattle wins by over  (one-tick 100%, touch 1312011.2, mid 0.565); [ks] Carolina vs Green Bay: Spread — Green Bay wins by  (one-tick 96%, touch 1674796.99, mid 0.99); [pm] Will Josh Stein win the 2028 Democratic presidenti (one-tick 100%, touch 968966.56, mid 0.002).
- Hold to resolution (6648 settled markets recorded; buy the favored side with $10 at the first snapshot in a price band, hold to settlement, taker fees in): pm 0.5-0.9 n=2017 win 64% net -43.1c/$10; pm 0.9-0.95 n=849 win 91% net -16.8c/$10; pm 0.95-0.97 n=544 win 97% net 6.4c/$10; pm 0.97-0.99 n=645 win 98% net 1.1c/$10; pm 0.99-1 n=790 win 99% net -2.6c/$10; ks 0.5-0.9 n=757 win 68% net -13.6c/$10; ks 0.9-0.95 n=365 win 90% net -21.7c/$10; ks 0.95-0.97 n=235 win 93% net -26.3c/$10; ks 0.97-0.99 n=274 win 98% net 0.2c/$10; ks 0.99-1 n=250 win 98% net -11.1c/$10. Best net-positive band with n >= 20: pm 0.95-0.97.
- Fees at 50c per contract: PM taker 1c / maker 0c; Kalshi taker 1.75c / maker 0.44c. One-cent maker round trip nets 1c on PM, 0.13c on Kalshi.

| venue | market | one-tick | touch | mid | 24h vol |
|---|---|---|---|---|---|
| ks | Dallas vs Philadelphia: Spread — Dallas wins by over 4.5 poi | 98% | 1825757.65 | 0.99 | 4562601.05 |
| ks | Kansas City vs Seattle: Spread — Seattle wins by over 2.5 po | 100% | 1321067.35 | 0.99 | 3986980.44 |
| ks | Chicago vs Seattle: Spread — Seattle wins by over 2.5 points | 100% | 1312011.2 | 0.565 | 210332.51 |
| ks | Carolina vs Green Bay: Spread — Green Bay wins by over 3.5 p | 96% | 1674796.99 | 0.99 | 4557675.97 |
| pm | Will Josh Stein win the 2028 Democratic presidential nominat | 100% | 968966.56 | 0.002 | 70457 |
| ks | 2027 Pro Football Champion — New England | 100% | 876688.26 | 0.035 | 25176.62 |
| pm | Will Mitch Landrieu win the 2028 Democratic presidential nom | 100% | 872460.97 | 0.002 | 70306 |
| ks | Chicago vs Seattle — Seattle | 100% | 793098.09 | 0.615 | 1011450.39 |
| pm | Will the Democratic Party control the House after the 2026 M | 98% | 1038841.46 | 0.955 | 2357263.6 |
| ks | Philadelphia vs Washington: Spread — Washington wins by over | 96% | 1256701.78 | 0.985 | 4167766.69 |

| venue | entry price | markets | unsized | win rate | net c per $10 | worst c | median hold h |
|---|---|---|---|---|---|---|---|
| pm | 0.5-0.9 | 2017 | 395 | 64% | -43.1 | -1020 | 2.9 |
| pm | 0.9-0.95 | 849 | 121 | 91% | -16.8 | -993.96 | 1.4 |
| pm | 0.95-0.97 | 544 | 74 | 97% | 6.4 | -968.28 | 1.4 |
| pm | 0.97-0.99 | 645 | 115 | 98% | 1.1 | -989.44 | 1.1 |
| pm | 0.99-1 | 790 | 202 | 99% | -2.6 | -997.12 | 0.9 |
| ks | 0.5-0.9 | 757 | 0 | 68% | -13.6 | -1035 | 2.5 |
| ks | 0.9-0.95 | 365 | 0 | 90% | -21.7 | -997 | 1 |
| ks | 0.95-0.97 | 235 | 0 | 93% | -26.3 | -963 | 1 |
| ks | 0.97-0.99 | 274 | 0 | 98% | 0.2 | -982 | 0.7 |
| ks | 0.99-1 | 250 | 0 | 98% | -11.1 | -991 | 0.6 |

_Hold to resolution counts only markets that have already settled, so long-dated markets are under-represented; one entry per market (per event on Kalshi)._

_Maker model is a proxy: a resting order counts as filled only when the recorded price trades through its level; no queue position is modeled._

## Witness
- session commit: `8651b2ed44552d31e9c06f54fde59c2c76bd3ca4`
- report sha256: `1127560fe871557d74684acc4fc344a938da230577ca7dbd70e61723255cf178`
- witness: `bc98647df24cfcdee36aff3cdc9e0b0fdddb3001cfe30e3c03e42b0c6ff0d83f`
