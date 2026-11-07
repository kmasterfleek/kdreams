# liquidity-by-hour — kdreams nightly research (2026-11-07)

> kdreams nightly (GitHub Actions, observe-only research). Model: openai/gpt-6-sol via OpenAI (6813 tokens, $0.02036).
> Nothing here placed an order. Tonight's hypothesis is INCONCLUSIVE by construction: it is
> frozen at 2026-11-07T15:15Z and is only graded on snapshots recorded after that.

## Frozen hypotheses graded tonight

| H | spec | post-freeze ticks | value | n | grade | by | note |
|---|---|---|---|---|---|---|---|
| 2026-11-06 | pair.bothSidesFracNetPositive > 0.1 (pair house-2026-republican, n>=300) | 87 | n/a | 0 | INCONCLUSIVE | code | pair.bothSidesFracNetPositive not measurable on post-freeze data (n=0) |
| 2026-11-04 | resolution.netCentsPer10 > 1 (venue ks, entry 0.5..0.9, n>=100) | 252 | -3.7 | 108 | REFUTED | code | resolution.netCentsPer10 = -3.7 vs > 1 on n=108 |
| 2026-11-03 | pair.bothSidesFracNetPositive > 0.12 (pair house-2026-democratic, n>=300) | 336 | 0.141 | 156 | INCONCLUSIVE | code | pair.bothSidesFracNetPositive = 0.141 on n=156, below the n>=300 needed |

## Tonight's spec (frozen at 2026-11-07T15:15Z)

- maker.netCentsPerAttempt > 0 (venue pm, UTC 12h-13h, n>=300)
- pre-freeze value: -0.842 on n=3825; graded on post-freeze data once it has 48 ticks and n >= 300

## Observations
- Polymarket’s tightest recorded UTC hour was 16h, with one-tick spreads in 94% of two-sided rows; 12h and 10h each reached 92%.
- The loosest recorded hours were 2h at 82% and 1h at 80%. A tighter spread is not evidence of a profitable fill.
- Across all hours, the Polymarket maker proxy lost 1.187c per attempt over a 60-minute horizon. Its trade-through fill rule does not model queue position.

## Hypothesis
Given Polymarket markets observed during 12h–13h UTC, when modeling a one-tick maker entry and exit, then maker.netCentsPerAttempt should be > 0c vs the all-hour baseline of -1.187c per attempt, subject to the invariant that marks and maker fees remain included.

## Hypothesis spec
```json
{"metric":"maker.netCentsPerAttempt","venue":"pm","slice":{"hoursUtc":[12,13]},"op":">","threshold":0,"minN":300}
```

## Next observation
Over the next 7 days, record the same top-of-book snapshots and compute the post-freeze maker-proxy net per attempt for 12h–13h UTC, reporting attempts, fills, marks, and fees without placing orders.

## Pair candidates
KXEPLGAME-26NOV07ARSHUL- <-> 0xf5d7380019 — Arsenal win; both mids 0.845.  
KXEPLGAME-26NOV07NFOMCI- <-> 0x77e2a154d6810e63cd01b1 — Manchester City win; both mids 0.575.

## Evidence (recorded top-of-book, observe-only)

- Coverage: 247593 rows, 1233 ticks, 3116 Polymarket + 2025 Kalshi markets, 2026-10-25T00:00Z .. 2026-11-07T15:15Z (14 day files); median gap between ticks 15 min.
- Polymarket spread: median 1c (p25 0.1, p75 1), one-tick 89% of 105477 two-sided rows; touch median bid 5023.75 / ask 4343.93.
- Polymarket maker proxy (60-minute horizon): 91979 attempts (2009 unobservable: no later snapshot inside the horizon), fill 22%, round-trip 17%, net -109224.75c total = -1.187c/attempt (gross 3442, fees 0, mark -112666.75).
- Kalshi spread: median 1c (p25 0.5, p75 1), one-tick 92% of 89284 two-sided rows; touch median bid 12973.31 / ask 32349.41.
- Kalshi maker proxy (60-minute horizon): 81234 attempts (1245 unobservable: no later snapshot inside the horizon), fill 17%, round-trip 15%, net -75339.66c total = -0.927c/attempt (gross 2153, fees 3990.24, mark -73502.5).
- Pair CONTROLH-2026-R vs 0x4e4f77e7: n=964, mean |diff| 1.11c, max 3c, >2c 5%; both-sides net-positive 15% (max 1.08c); leads: simultaneous (lag 0, r=0.218).
- Pair CONTROLH-2026-D vs 0xd5d9fc47: n=975, mean |diff| 1.01c, max 2.95c, >2c 4%; both-sides net-positive 13% (max 0.98c); leads: simultaneous (lag 0, r=0.271).
- Pair KXFEDDECISION-26DEC-H25 vs 0x8a419661: n=300, mean |diff| 1.02c, max 3c, >2c 31%; both-sides net-positive 5% (max 0.02c); leads: simultaneous (lag 0, r=0.749).
- Pair KXFEDDECISION-26DEC-H0 vs 0x723822eb: n=300, mean |diff| 1.63c, max 3.5c, >2c 34%; both-sides net-positive 0% (max 0.02c); leads: simultaneous (lag 0, r=0.563).
- Polymarket tightest UTC hours: 16h 94%, 12h 92%, 10h 92%; loosest: 2h 82%, 1h 80%.
- Top one-tick candidates: [ks] Dallas vs Philadelphia: Spread — Dallas wins by ov (one-tick 98%, touch 1825757.65, mid 0.99); [pm] Will the Democratic Party control the House after  (one-tick 98%, touch 1340004.37, mid 0.999); [ks] Carolina vs Green Bay: Spread — Green Bay wins by  (one-tick 96%, touch 1674796.99, mid 0.99); [pm] Will Josh Stein win the 2028 Democratic presidenti (one-tick 100%, touch 968966.56, mid 0.002); [ks] 2028 Democratic presidential nominee — Elizabeth W (one-tick 100%, touch 946033.81, mid 0.002).
- Hold to resolution (7994 settled markets recorded; buy the favored side with $10 at the first snapshot in a price band, hold to settlement, taker fees in): pm 0.5-0.9 n=1744 win 64% net -42.5c/$10; pm 0.9-0.95 n=775 win 91% net -9.3c/$10; pm 0.95-0.97 n=516 win 96% net 0.3c/$10; pm 0.97-0.99 n=612 win 98% net 2.8c/$10; pm 0.99-1 n=870 win 99% net -2c/$10; ks 0.5-0.9 n=651 win 71% net 10.3c/$10; ks 0.9-0.95 n=347 win 92% net -5.1c/$10; ks 0.95-0.97 n=239 win 95% net -9.1c/$10; ks 0.97-0.99 n=274 win 98% net 0c/$10; ks 0.99-1 n=245 win 98% net -8.1c/$10. Best net-positive band with n >= 20: ks 0.5-0.9.
- Fees at 50c per contract: PM taker 1c / maker 0c; Kalshi taker 1.75c / maker 0.44c. One-cent maker round trip nets 1c on PM, 0.13c on Kalshi.

| venue | market | one-tick | touch | mid | 24h vol |
|---|---|---|---|---|---|
| ks | Dallas vs Philadelphia: Spread — Dallas wins by over 4.5 poi | 98% | 1825757.65 | 0.99 | 4562601.05 |
| pm | Will the Democratic Party control the House after the 2026 M | 98% | 1340004.37 | 0.999 | 11996315.07 |
| ks | Carolina vs Green Bay: Spread — Green Bay wins by over 3.5 p | 96% | 1674796.99 | 0.99 | 4557675.97 |
| pm | Will Josh Stein win the 2028 Democratic presidential nominat | 100% | 968966.56 | 0.002 | 70457 |
| ks | 2028 Democratic presidential nominee — Elizabeth Warren | 100% | 946033.81 | 0.002 | 19158.94 |
| pm | Will Mitch Landrieu win the 2028 Democratic presidential nom | 100% | 872363.01 | 0.002 | 70306 |
| ks | 2027 Pro Football Champion — Pittsburgh | 100% | 845597.35 | 0.015 | 100984.9 |
| ks | 2027 Pro Football Champion — Dallas | 100% | 839552.42 | 0.015 | 29978.57 |
| pm | Will the Fed decrease interest rates by 25 bps after the Oct | 100% | 810871.73 | 0.001 | 4825505.67 |
| ks | Chicago vs Seattle — Seattle | 100% | 793279.28 | 0.01 | 29421813.39 |

| venue | entry price | markets | unsized | win rate | net c per $10 | worst c | median hold h |
|---|---|---|---|---|---|---|---|
| pm | 0.5-0.9 | 1744 | 0 | 64% | -42.5 | -1020 | 2.9 |
| pm | 0.9-0.95 | 775 | 1 | 91% | -9.3 | -993.96 | 1.5 |
| pm | 0.95-0.97 | 516 | 0 | 96% | 0.3 | -968.28 | 1.4 |
| pm | 0.97-0.99 | 612 | 5 | 98% | 2.8 | -989.44 | 1.2 |
| pm | 0.99-1 | 870 | 87 | 99% | -2 | -997.12 | 1.3 |
| ks | 0.5-0.9 | 651 | 0 | 71% | 10.3 | -1035 | 2.5 |
| ks | 0.9-0.95 | 347 | 0 | 92% | -5.1 | -997 | 1.1 |
| ks | 0.95-0.97 | 239 | 0 | 95% | -9.1 | -963 | 1.2 |
| ks | 0.97-0.99 | 274 | 0 | 98% | 0 | -982 | 0.8 |
| ks | 0.99-1 | 245 | 0 | 98% | -8.1 | -991 | 0.7 |

_Hold to resolution counts only markets that have already settled, so long-dated markets are under-represented; one entry per market (per event on Kalshi)._

_Maker model is a proxy: a resting order counts as filled only when the recorded price trades through its level; no queue position is modeled._

## Witness
- session commit: `74a7c5e7984d6d310939cca0b691ff0ea83110e4`
- report sha256: `321356c081e51ed55c2e8344e69a7d288cb440405328a3ee777206c2b8734e05`
- witness: `d5860e418b217b676f874796975338b9cc17a5aec7d173f48937a0fecc779d3a`
