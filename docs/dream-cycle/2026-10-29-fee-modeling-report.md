# fee-modeling — kdreams nightly research (2026-10-29)

> kdreams nightly (GitHub Actions, observe-only research). Model: openai/gpt-6-sol via OpenAI (6775 tokens, $0.02113).
> Nothing here placed an order. Tonight's hypothesis is INCONCLUSIVE by construction: it is
> frozen at 2026-10-29T15:30Z and is only graded on snapshots recorded after that.

## Frozen hypotheses graded tonight

| H | spec | post-freeze ticks | value | n | grade | by | note |
|---|---|---|---|---|---|---|---|
| 2026-10-28 | pair.bothSidesFracNetPositive > 0.03 (pair house-2026-democratic, n>=300) | 97 | 0.227 | 194 | INCONCLUSIVE | code | pair.bothSidesFracNetPositive = 0.227 on n=194, below the n>=300 needed |
| 2026-10-27 | maker.netCentsPerAttempt > 0 (venue pm, UTC 7h-8h, mid 0.1..0.9, n>=300) | 194 | -1.246 | 282 | INCONCLUSIVE | code | maker.netCentsPerAttempt = -1.246 on n=282, below the n>=300 needed |

## Tonight's spec (frozen at 2026-10-29T15:30Z)

- resolution.netCentsPer10 > 1 (venue ks, entry 0.97..0.99, n>=100)
- pre-freeze value: 7.1 on n=262; graded on post-freeze data once it has 48 ticks and n >= 100

## Observations
- At 50c, the stated fees are 1c per contract for a Polymarket taker and 1.75c for a Kalshi taker; Kalshi also rounds fees up to at least 1c per order.
- A one-cent maker round trip nets 1c per contract on Polymarket but 0.13c on Kalshi before adverse selection. The observed maker proxies instead net −1.298c and −1.039c per attempt, respectively.
- Kalshi favored-side entries at 0.97–0.99 returned 7.1c per $10 across 262 settled markets, versus −3.5c at 0.99–1 across 243. The 0.97–0.99 band’s worst recorded outcome was −982c per $10.

## Hypothesis
Given Kalshi markets with favored-side entry prices from 0.97 to below 0.99, when modeling a $10 touch purchase held to settlement, then resolution.netCentsPer10 should be > 1c versus the recorded 7.1c per $10 baseline, subject to taker fees and the risk that one loss erases many wins.

## Hypothesis spec
```json
{"metric":"resolution.netCentsPer10","venue":"ks","slice":{"priceMin":0.97,"priceMax":0.99},"op":">","threshold":1,"minN":100}
```

## Next observation
Over the next 7 days, compute the specified result only for newly recorded, independently settled Kalshi markets, retaining per-order rounded fees and reporting the loss count; no orders are needed.

## Pair candidates
KXBALANCEPOWERCOMBO-27FE (Republicans sweep) <-> 0xc5eae79d1ffe7165723539 — same R-House/R-Senate outcome; catalog mids 0.083 vs 0.065.  
KXBALANCEPOWERCOMBO-27FE (Democrats sweep) <-> 0x16c63b7cc37f012b9f59ee — same D-House/D-Senate outcome; catalog mids 0.655 vs 0.665.

## Evidence (recorded top-of-book, observe-only)

- Coverage: 229287 rows, 1147 ticks, 3425 Polymarket + 2101 Kalshi markets, 2026-10-16T00:32Z .. 2026-10-29T15:30Z (14 day files); median gap between ticks 15 min.
- Polymarket spread: median 1c (p25 0.2, p75 1), one-tick 88% of 98314 two-sided rows; touch median bid 7596.53 / ask 6143.
- Polymarket maker proxy (60-minute horizon): 85121 attempts (1721 unobservable: no later snapshot inside the horizon), fill 22%, round-trip 19%, net -110495.6c total = -1.298c/attempt (gross 3548, fees 0, mark -114043.6).
- Kalshi spread: median 1c (p25 1, p75 1), one-tick 91% of 80138 two-sided rows; touch median bid 16952.34 / ask 48345.41.
- Kalshi maker proxy (60-minute horizon): 71686 attempts (1078 unobservable: no later snapshot inside the horizon), fill 16%, round-trip 19%, net -74491.61c total = -1.039c/attempt (gross 2190, fees 3842.63, mark -72839).
- Pair CONTROLH-2026-R vs 0x4e4f77e7: n=1139, mean |diff| 1.06c, max 3c, >2c 4%; both-sides net-positive 5% (max 1.08c); leads: polymarket (lag 2, r=0.077).
- Pair CONTROLH-2026-D vs 0xd5d9fc47: n=1142, mean |diff| 0.88c, max 2.95c, >2c 4%; both-sides net-positive 4% (max 0.98c); leads: kalshi (lag -3, r=0.073).
- Polymarket tightest UTC hours: 10h 92%, 8h 92%, 12h 92%; loosest: 2h 80%, 1h 78%.
- Top one-tick candidates: [ks] Carolina vs Green Bay: Spread — Green Bay wins by  (one-tick 100%, touch 1565941.03, mid 0.505); [pm] Will the Fed decrease interest rates by 50+ bps af (one-tick 100%, touch 1449860.61, mid 0.001); [ks] Dallas vs Philadelphia: Spread — Dallas wins by ov (one-tick 98%, touch 1825757.65, mid 0.99); [ks] Kansas City vs Seattle: Spread — Seattle wins by o (one-tick 100%, touch 1321067.35, mid 0.99); [ks] Carolina vs Philadelphia: Spread — Carolina wins b (one-tick 100%, touch 969785.09, mid 0.99).
- Hold to resolution (5175 settled markets recorded; buy the favored side with $10 at the first snapshot in a price band, hold to settlement, taker fees in): pm 0.5-0.9 n=1955 win 64% net -40.8c/$10; pm 0.9-0.95 n=765 win 92% net -7.3c/$10; pm 0.95-0.97 n=486 win 96% net 1.9c/$10; pm 0.97-0.99 n=584 win 98% net 2.5c/$10; pm 0.99-1 n=726 win 100% net 0.8c/$10; ks 0.5-0.9 n=747 win 67% net -25.8c/$10; ks 0.9-0.95 n=345 win 93% net -1.2c/$10; ks 0.95-0.97 n=220 win 94% net -21.8c/$10; ks 0.97-0.99 n=262 win 99% net 7.1c/$10; ks 0.99-1 n=243 win 99% net -3.5c/$10. Best net-positive band with n >= 20: ks 0.97-0.99.
- Fees at 50c per contract: PM taker 1c / maker 0c; Kalshi taker 1.75c / maker 0.44c. One-cent maker round trip nets 1c on PM, 0.13c on Kalshi.

| venue | market | one-tick | touch | mid | 24h vol |
|---|---|---|---|---|---|
| ks | Carolina vs Green Bay: Spread — Green Bay wins by over 3.5 p | 100% | 1565941.03 | 0.505 | 295647.48 |
| pm | Will the Fed decrease interest rates by 50+ bps after the Oc | 100% | 1449860.61 | 0.001 | 552685.1 |
| ks | Dallas vs Philadelphia: Spread — Dallas wins by over 4.5 poi | 98% | 1825757.65 | 0.99 | 4562601.05 |
| ks | Kansas City vs Seattle: Spread — Seattle wins by over 2.5 po | 100% | 1321067.35 | 0.99 | 3986980.44 |
| ks | Carolina vs Philadelphia: Spread — Carolina wins by over 3.5 | 100% | 969785.09 | 0.99 | 1114748.96 |
| pm | Will Josh Stein win the 2028 Democratic presidential nominat | 100% | 968966.56 | 0.002 | 70457 |
| ks | 2027 Pro Football Champion — Atlanta | 100% | 895489.95 | 0.015 | 108114.67 |
| ks | 2027 Pro Football Champion — New England | 100% | 878584.15 | 0.035 | 25176.62 |
| pm | Will Mitch Landrieu win the 2028 Democratic presidential nom | 100% | 872460.97 | 0.002 | 70306 |
| ks | Washington vs San Francisco: Spread — San Francisco wins by  | 96% | 1638735.26 | 0.01 | 5789583.77 |

| venue | entry price | markets | unsized | win rate | net c per $10 | worst c | median hold h |
|---|---|---|---|---|---|---|---|
| pm | 0.5-0.9 | 1955 | 849 | 64% | -40.8 | -1020 | 2.9 |
| pm | 0.9-0.95 | 765 | 227 | 92% | -7.3 | -993.96 | 1.4 |
| pm | 0.95-0.97 | 486 | 160 | 96% | 1.9 | -963.46 | 1.3 |
| pm | 0.97-0.99 | 584 | 216 | 98% | 2.5 | -989.44 | 1.1 |
| pm | 0.99-1 | 726 | 315 | 100% | 0.8 | -990.4 | 0.9 |
| ks | 0.5-0.9 | 747 | 0 | 67% | -25.8 | -1035 | 2.7 |
| ks | 0.9-0.95 | 345 | 0 | 93% | -1.2 | -997 | 1 |
| ks | 0.95-0.97 | 220 | 0 | 94% | -21.8 | -963 | 1 |
| ks | 0.97-0.99 | 262 | 0 | 99% | 7.1 | -982 | 0.7 |
| ks | 0.99-1 | 243 | 0 | 99% | -3.5 | -991 | 0.6 |

_Hold to resolution counts only markets that have already settled, so long-dated markets are under-represented; one entry per market (per event on Kalshi)._

_Maker model is a proxy: a resting order counts as filled only when the recorded price trades through its level; no queue position is modeled._

## Witness
- session commit: `a352c86a2f6b60c293b5829710472bea7060a8cd`
- report sha256: `6e02c783eeeafb51ee0d13cfd99a0311e98a15ed81799a4be3b00f34f52aceb1`
- witness: `104fa993223c2443bfa78959fb443bd3e571789fb28bf7cf5b46e1c580794211`
