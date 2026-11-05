# maker-spread-capture — kdreams nightly research (2026-11-05)

> kdreams nightly (GitHub Actions, observe-only research). Model: openai/gpt-6-sol via OpenAI (6993 tokens, $0.02192).
> Nothing here placed an order. Tonight's hypothesis is INCONCLUSIVE by construction: it is
> frozen at 2026-11-05T16:45Z and is only graded on snapshots recorded after that.

## Frozen hypotheses graded tonight

| H | spec | post-freeze ticks | value | n | grade | by | note |
|---|---|---|---|---|---|---|---|
| 2026-11-04 | resolution.netCentsPer10 > 1 (venue ks, entry 0.5..0.9, n>=100) | 78 | 15.9 | 35 | INCONCLUSIVE | code | resolution.netCentsPer10 = 15.9 on n=35, below the n>=100 needed |
| 2026-11-03 | pair.bothSidesFracNetPositive > 0.12 (pair house-2026-democratic, n>=300) | 162 | 0.141 | 156 | INCONCLUSIVE | code | pair.bothSidesFracNetPositive = 0.141 on n=156, below the n>=300 needed |

## Tonight's spec (frozen at 2026-11-05T16:45Z)

- maker.netCentsPerAttempt > 0 (venue pm, mid 0.3..0.7, n>=300)
- pre-freeze value: -3.132 on n=23407; graded on post-freeze data once it has 48 ticks and n >= 300

## Observations
- One-tick spreads dominate two-sided rows: 89% on Polymarket and 93% on Kalshi. That leaves little spread to capture.
- The 60-minute maker proxy is negative on both venues: Polymarket −1.278c per attempt and Kalshi −0.991c per attempt, despite observed round trips.
- At 50c, a one-cent maker round trip nets 1c per contract on Polymarket but 0.13c on Kalshi before adverse marks. The proxy does not model queue position.

## Hypothesis
Given Polymarket markets with entry mids from 0.3 to below 0.7, when observing a resting one-tick maker entry under the 60-minute proxy, then maker.netCentsPerAttempt should be > 0c vs the all-market Polymarket baseline of −1.278c per attempt, subject to adverse marks outweighing captured spread.

## Hypothesis spec
```json
{"metric":"maker.netCentsPerAttempt","venue":"pm","slice":{"midMin":0.3,"midMax":0.7},"op":">","threshold":0,"minN":300}
```

## Next observation
Over the next 7 days, compute the specified maker-proxy result on newly recorded snapshots and separately record trade-throughs and touch-size changes to assess whether apparent fills are executable.

## Pair candidates
KXATPMATCH-26NOV05MUSVAN <-> 0x35e85a48 — Lorenzo Musetti wins the same match; both mids 0.695.  
KXCAWEALTHTAX-26 <-> 0x9345d514 — California billionaire wealth tax passes; mids 0.013 and 0.016.  
KXPRESNOMD-28-JOSS <-> 0x74dba1ce — Jon Ossoff wins the Democratic nomination; mids 0.255 and 0.274.

## Evidence (recorded top-of-book, observe-only)

- Coverage: 250698 rows, 1251 ticks, 3193 Polymarket + 2019 Kalshi markets, 2026-10-23T00:00Z .. 2026-11-05T16:45Z (14 day files); median gap between ticks 15 min.
- Polymarket spread: median 1c (p25 0.2, p75 1), one-tick 89% of 106570 two-sided rows; touch median bid 6063.07 / ask 4993.91.
- Polymarket maker proxy (60-minute horizon): 92802 attempts (1821 unobservable: no later snapshot inside the horizon), fill 22%, round-trip 18%, net -118601.3c total = -1.278c/attempt (gross 3647, fees 0, mark -122248.3).
- Kalshi spread: median 1c (p25 1, p75 1), one-tick 93% of 90892 two-sided rows; touch median bid 15179.7 / ask 39356.9.
- Kalshi maker proxy (60-minute horizon): 82950 attempts (1151 unobservable: no later snapshot inside the horizon), fill 17%, round-trip 17%, net -82199.36c total = -0.991c/attempt (gross 2352, fees 4265.95, mark -80285.5).
- Pair CONTROLH-2026-R vs 0x4e4f77e7: n=1156, mean |diff| 1.06c, max 3c, >2c 4%; both-sides net-positive 13% (max 1.08c); leads: simultaneous (lag 0, r=0.203).
- Pair CONTROLH-2026-D vs 0xd5d9fc47: n=1167, mean |diff| 0.96c, max 2.95c, >2c 4%; both-sides net-positive 11% (max 0.98c); leads: simultaneous (lag 0, r=0.251).
- Pair KXFEDDECISION-26DEC-H25 vs 0x8a419661: n=126, mean |diff| 1.73c, max 3c, >2c 64%; both-sides net-positive 12% (max 0.02c); leads: simultaneous (lag 0, r=0.807).
- Pair KXFEDDECISION-26DEC-H0 vs 0x723822eb: n=126, mean |diff| 1.2c, max 3c, >2c 2%; both-sides net-positive 0% (max 0.02c); leads: simultaneous (lag 0, r=0.806).
- Polymarket tightest UTC hours: 16h 93%, 12h 92%, 10h 92%; loosest: 2h 80%, 1h 79%.
- Top one-tick candidates: [ks] Dallas vs Philadelphia: Spread — Dallas wins by ov (one-tick 98%, touch 1825757.65, mid 0.99); [ks] Kansas City vs Seattle: Spread — Seattle wins by o (one-tick 100%, touch 1321067.35, mid 0.99); [ks] Carolina vs Green Bay: Spread — Green Bay wins by  (one-tick 96%, touch 1674796.99, mid 0.99); [pm] Will Josh Stein win the 2028 Democratic presidenti (one-tick 100%, touch 968966.56, mid 0.002); [pm] Will the Democratic Party control the House after  (one-tick 98%, touch 1284866.47, mid 0.999).
- Hold to resolution (7420 settled markets recorded; buy the favored side with $10 at the first snapshot in a price band, hold to settlement, taker fees in): pm 0.5-0.9 n=1875 win 64% net -39.5c/$10; pm 0.9-0.95 n=812 win 91% net -13.9c/$10; pm 0.95-0.97 n=536 win 95% net -5.5c/$10; pm 0.97-0.99 n=624 win 98% net -1.4c/$10; pm 0.99-1 n=867 win 99% net -4.3c/$10; ks 0.5-0.9 n=715 win 69% net -4.4c/$10; ks 0.9-0.95 n=373 win 92% net -5.1c/$10; ks 0.95-0.97 n=251 win 94% net -18.6c/$10; ks 0.97-0.99 n=289 win 98% net 1.2c/$10; ks 0.99-1 n=246 win 98% net -7.9c/$10. Best net-positive band with n >= 20: ks 0.97-0.99.
- Fees at 50c per contract: PM taker 1c / maker 0c; Kalshi taker 1.75c / maker 0.44c. One-cent maker round trip nets 1c on PM, 0.13c on Kalshi.

| venue | market | one-tick | touch | mid | 24h vol |
|---|---|---|---|---|---|
| ks | Dallas vs Philadelphia: Spread — Dallas wins by over 4.5 poi | 98% | 1825757.65 | 0.99 | 4562601.05 |
| ks | Kansas City vs Seattle: Spread — Seattle wins by over 2.5 po | 100% | 1321067.35 | 0.99 | 3986980.44 |
| ks | Carolina vs Green Bay: Spread — Green Bay wins by over 3.5 p | 96% | 1674796.99 | 0.99 | 4557675.97 |
| pm | Will Josh Stein win the 2028 Democratic presidential nominat | 100% | 968966.56 | 0.002 | 70457 |
| pm | Will the Democratic Party control the House after the 2026 M | 98% | 1284866.47 | 0.999 | 11996315.07 |
| pm | Will Mitch Landrieu win the 2028 Democratic presidential nom | 100% | 872460.97 | 0.002 | 70306 |
| ks | 2027 Pro Football Champion — Pittsburgh | 100% | 837032.92 | 0.015 | 257923.53 |
| ks | Chicago vs Seattle — Seattle | 100% | 793279.28 | 0.01 | 29421813.39 |
| ks | Philadelphia vs Washington: Spread — Washington wins by over | 96% | 1256701.78 | 0.985 | 4167766.69 |
| ks | Kansas City vs Seattle — Seattle | 100% | 703283.56 | 0.99 | 10853721.46 |

| venue | entry price | markets | unsized | win rate | net c per $10 | worst c | median hold h |
|---|---|---|---|---|---|---|---|
| pm | 0.5-0.9 | 1875 | 0 | 64% | -39.5 | -1020 | 2.9 |
| pm | 0.9-0.95 | 812 | 0 | 91% | -13.9 | -993.96 | 1.4 |
| pm | 0.95-0.97 | 536 | 0 | 95% | -5.5 | -968.28 | 1.4 |
| pm | 0.97-0.99 | 624 | 5 | 98% | -1.4 | -989.44 | 1.2 |
| pm | 0.99-1 | 867 | 84 | 99% | -4.3 | -997.12 | 1.2 |
| ks | 0.5-0.9 | 715 | 0 | 69% | -4.4 | -1035 | 2.5 |
| ks | 0.9-0.95 | 373 | 0 | 92% | -5.1 | -997 | 1.1 |
| ks | 0.95-0.97 | 251 | 0 | 94% | -18.6 | -963 | 1.2 |
| ks | 0.97-0.99 | 289 | 0 | 98% | 1.2 | -982 | 0.9 |
| ks | 0.99-1 | 246 | 0 | 98% | -7.9 | -991 | 0.7 |

_Hold to resolution counts only markets that have already settled, so long-dated markets are under-represented; one entry per market (per event on Kalshi)._

_Maker model is a proxy: a resting order counts as filled only when the recorded price trades through its level; no queue position is modeled._

## Witness
- session commit: `2ccb0812a4c5d8a1e71b41673466ed1488e93d54`
- report sha256: `fa6ecaf01ede7cbc586a736e0a9793b080680d1e033d130e3da3c0c261304e71`
- witness: `a4ffcc0dc70d237ac02dccf75a4952d57accf23ffa82cdaa86423c8ac2dd04fb`
