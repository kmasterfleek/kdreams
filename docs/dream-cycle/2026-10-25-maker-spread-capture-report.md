# maker-spread-capture — kdreams nightly research (2026-10-25)

> kdreams nightly (GitHub Actions, observe-only research). Model: openai/gpt-6-sol via OpenAI (6959 tokens, $0.02293).
> Nothing here placed an order. Tonight's hypothesis is INCONCLUSIVE by construction: it is
> frozen at 2026-10-25T13:15Z and is only graded on snapshots recorded after that.

## Frozen hypotheses graded tonight

| H | spec | post-freeze ticks | value | n | grade | by | note |
|---|---|---|---|---|---|---|---|
| 2026-10-24 | resolution.netCentsPer10 > 1 (venue pm, entry 0.9..0.95, n>=100) | 98 | -34.3 | 83 | INCONCLUSIVE | code | resolution.netCentsPer10 = -34.3 on n=83, below the n>=100 needed |
| 2026-10-23 | resolution.netCentsPer10 > 1 (venue pm, entry 0.97..0.99, n>=100) | 190 | -17.5 | 80 | INCONCLUSIVE | code | resolution.netCentsPer10 = -17.5 on n=80, below the n>=100 needed |

## Tonight's spec (frozen at 2026-10-25T13:15Z)

- maker.netCentsPerAttempt > 0 (venue pm, UTC 8h-10h, mid 0.1..0.9, n>=300)
- pre-freeze value: -1.097 on n=2828; graded on post-freeze data once it has 48 ticks and n >= 300

## Observations
- One-tick spreads dominate two-sided rows: 89% on Polymarket and 90% on Kalshi. Median touch sizes are 9985.4/9329.98 and 18961.87/55056.44 at bid/ask, respectively; displayed size does not establish maker fills.
- The 60-minute maker proxy loses 1.307c per attempt on Polymarket and 1.109c on Kalshi after modeled fees and marks. Its fill rates are 21% and 16%; a visible spread is not captured reliably.
- At 50c, a one-cent maker round trip nets 1c per contract on Polymarket but only 0.13c on Kalshi. At that price, 1c per contract is 2% of the 50c tied up, before accounting for failed attempts and adverse marks.

## Hypothesis
Given Polymarket markets with entry mid from 0.1 to below 0.9 during 8h–10h UTC, when a resting maker quote is evaluated by the recorded 60-minute trade-through proxy, then maker.netCentsPerAttempt should be > 0c vs the all-hours Polymarket baseline of −1.307c, subject to adverse-mark risk and the proxy’s lack of queue-position modeling.

## Hypothesis spec
```json
{"metric":"maker.netCentsPerAttempt","venue":"pm","slice":{"hoursUtc":[8,10],"midMin":0.1,"midMax":0.9},"op":">","threshold":0,"minN":300}
```

## Next observation
Over the next 7 days, compute the specified maker-proxy result on newly recorded snapshots, retaining fill, round-trip, mark, and unobservable-attempt counts without trading.

## Pair candidates
KXNFLGAME-26OCT25CINBAL- <-> 0xc5f590356b401a3d7b2594 — Cincinnati outcome; both mids 0.585.  
KXLALIGAGAME-26OCT25BARR <-> 0x793815e8628516f2970962 — Barcelona outcome; both mids 0.615.

## Evidence (recorded top-of-book, observe-only)

- Coverage: 152807 rows, 765 ticks, 2675 Polymarket + 1683 Kalshi markets, 2026-10-14T19:13Z .. 2026-10-25T13:15Z (12 day files); median gap between ticks 15 min.
- Polymarket spread: median 1c (p25 0.1, p75 1), one-tick 89% of 65612 two-sided rows; touch median bid 9985.4 / ask 9329.98.
- Polymarket maker proxy (60-minute horizon): 56100 attempts (2067 unobservable: no later snapshot inside the horizon), fill 21%, round-trip 19%, net -73317.8c total = -1.307c/attempt (gross 2198, fees 0, mark -75515.8).
- Kalshi spread: median 1c (p25 1, p75 1), one-tick 90% of 52568 two-sided rows; touch median bid 18961.87 / ask 55056.44.
- Kalshi maker proxy (60-minute horizon): 45908 attempts (1447 unobservable: no later snapshot inside the horizon), fill 16%, round-trip 20%, net -50907.73c total = -1.109c/attempt (gross 1457, fees 2534.44, mark -49830.3).
- Pair CONTROLH-2026-R vs 0x4e4f77e7: n=754, mean |diff| 0.92c, max 2c, >2c 0%; both-sides net-positive 0% (max 0.04c); leads: polymarket (lag 2, r=0.1).
- Pair CONTROLH-2026-D vs 0xd5d9fc47: n=760, mean |diff| 0.72c, max 1.55c, >2c 0%; both-sides net-positive 0% (max 0.13c); leads: polymarket (lag 1, r=0.159).
- Polymarket tightest UTC hours: 10h 92%, 8h 92%, 7h 92%; loosest: 1h 82%, 2h 82%.
- Top one-tick candidates: [pm] Will the Fed decrease interest rates by 50+ bps af (one-tick 100%, touch 1449360.61, mid 0.001); [ks] Kansas City vs Seattle: Spread — Seattle wins by o (one-tick 100%, touch 1319064.55, mid 0.535); [ks] Indianapolis vs Minnesota: Spread — Minnesota wins (one-tick 100%, touch 1097148.32, mid 0.525); [ks] Carolina vs Philadelphia: Spread — Carolina wins b (one-tick 100%, touch 969785.09, mid 0.99); [ks] 2027 Pro Football Champion — Atlanta (one-tick 100%, touch 914489.11, mid 0.015).
- Hold to resolution (3686 settled markets recorded; buy the favored side with $10 at the first snapshot in a price band, hold to settlement, taker fees in): pm 0.5-0.9 n=1426 win 63% net -48.8c/$10; pm 0.9-0.95 n=507 win 91% net -11.6c/$10; pm 0.95-0.97 n=320 win 95% net -11.9c/$10; pm 0.97-0.99 n=411 win 98% net -0.7c/$10; pm 0.99-1 n=488 win 100% net 0.8c/$10; ks 0.5-0.9 n=573 win 66% net -37.6c/$10; ks 0.9-0.95 n=239 win 93% net 1.7c/$10; ks 0.95-0.97 n=157 win 94% net -21.9c/$10; ks 0.97-0.99 n=184 win 98% net 6c/$10; ks 0.99-1 n=170 win 99% net 3.1c/$10. Best net-positive band with n >= 20: ks 0.97-0.99.
- Fees at 50c per contract: PM taker 1c / maker 0c; Kalshi taker 1.75c / maker 0.44c. One-cent maker round trip nets 1c on PM, 0.13c on Kalshi.

| venue | market | one-tick | touch | mid | 24h vol |
|---|---|---|---|---|---|
| pm | Will the Fed decrease interest rates by 50+ bps after the Oc | 100% | 1449360.61 | 0.001 | 119925.24 |
| ks | Kansas City vs Seattle: Spread — Seattle wins by over 2.5 po | 100% | 1319064.55 | 0.535 | 27649.49 |
| ks | Indianapolis vs Minnesota: Spread — Minnesota wins by over 6 | 100% | 1097148.32 | 0.525 | 313652.39 |
| ks | Carolina vs Philadelphia: Spread — Carolina wins by over 3.5 | 100% | 969785.09 | 0.99 | 1114748.96 |
| ks | 2027 Pro Football Champion — Atlanta | 100% | 914489.11 | 0.015 | 12308.13 |
| ks | 2027 Pro Football Champion — New England | 100% | 878584.15 | 0.035 | 25176.62 |
| pm | Will Mitch Landrieu win the 2028 Democratic presidential nom | 100% | 872463.01 | 0.002 | 162835.21 |
| ks | Washington vs San Francisco: Spread — San Francisco wins by  | 96% | 1638735.26 | 0.01 | 5789583.77 |
| ks | 2027 Pro Football Champion — Houston | 100% | 816179.04 | 0.035 | 69350.65 |
| ks | 2027 Pro Football Champion — Cincinnati | 100% | 772653.68 | 0.035 | 61564.78 |

| venue | entry price | markets | unsized | win rate | net c per $10 | worst c | median hold h |
|---|---|---|---|---|---|---|---|
| pm | 0.5-0.9 | 1426 | 909 | 63% | -48.8 | -1020 | 2.9 |
| pm | 0.9-0.95 | 507 | 237 | 91% | -11.6 | -993.96 | 1.5 |
| pm | 0.95-0.97 | 320 | 153 | 95% | -11.9 | -963.46 | 1.4 |
| pm | 0.97-0.99 | 411 | 211 | 98% | -0.7 | -987.51 | 1.3 |
| pm | 0.99-1 | 488 | 275 | 100% | 0.8 | -990.4 | 1 |
| ks | 0.5-0.9 | 573 | 0 | 66% | -37.6 | -1035 | 2.8 |
| ks | 0.9-0.95 | 239 | 0 | 93% | 1.7 | -997 | 1.1 |
| ks | 0.95-0.97 | 157 | 0 | 94% | -21.9 | -963 | 1 |
| ks | 0.97-0.99 | 184 | 0 | 98% | 6 | -982 | 0.7 |
| ks | 0.99-1 | 170 | 0 | 99% | 3.1 | -991 | 0.6 |

_Hold to resolution counts only markets that have already settled, so long-dated markets are under-represented; one entry per market (per event on Kalshi)._

_Maker model is a proxy: a resting order counts as filled only when the recorded price trades through its level; no queue position is modeled._

## Witness
- session commit: `0b34e433ddbb3fc153b89cc6aceb0367d5d1cd66`
- report sha256: `fa9911f15e378d5ace07990deaa8d505a821c1fd0f293e6ffda76af4e8629bbc`
- witness: `ebae2f40fbb17a815d137e493db108a4f1e6520dcacab6d7b0b10746f964103b`
