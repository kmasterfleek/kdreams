# liquidity-by-hour — kdreams nightly research (2026-10-22)

> kdreams nightly (GitHub Actions, observe-only research). Model: openai/gpt-6-sol via OpenAI (5696 tokens, $0.01928).
> Nothing here placed an order. Tonight's hypothesis is INCONCLUSIVE by construction: it is
> frozen at 2026-10-22T14:00Z and is only graded on snapshots recorded after that.

## Frozen hypotheses graded tonight

| H | spec | post-freeze ticks | value | n | grade | by | note |
|---|---|---|---|---|---|---|---|
| 2026-10-21 | pair.bothSidesFracNetPositive < 0.01 (pair house-2026-republican, n>=300) | 96 | 0 | 182 | INCONCLUSIVE | code | pair.bothSidesFracNetPositive = 0 on n=182, below the n>=300 needed |

## Tonight's spec (frozen at 2026-10-22T14:00Z)

- spread.fracOneCent < 0.89 (venue pm, UTC 2h-4h, n>=300)
- pre-freeze value: 0.844 on n=3028; graded on post-freeze data once it has 48 ticks and n >= 300

## Observations
- Polymarket’s one-tick share is lowest at UTC 2h (84%) and 3h (85%), versus 89% across its two-sided rows.
- Its tightest reported hours are UTC 7h (92%), 8h (93%), and 10h (93%). The evidence does not establish that those tighter quotes are profitable: the Polymarket maker proxy averaged −1.131c per attempt.
- Kalshi’s overall one-tick share is 89%, but no Kalshi hourly breakdown is provided. Its maker proxy averaged −1.126c per attempt.

## Hypothesis
Given Polymarket two-sided markets observed at UTC 2h–4h, when screening recorded quotes without placing orders, then `spread.fracOneCent` should be < 0.89 vs the 0.89 overall Polymarket baseline, subject to the invariant that quote tightness is not treated as net profit after fees or marks.

## Hypothesis spec
```json
{"metric":"spread.fracOneCent","venue":"pm","slice":{"hoursUtc":[2,4]},"op":"<","threshold":0.89,"minN":300}
```

## Next observation
Over the next 7 days, compute the specified hourly share and its two-sided-row count from newly recorded snapshots; do not trade.

## Pair candidates
KXFEDDECISION-26OCT-H0 <-> 0xdf9bf27e — Fed maintains rates / no change; mids 0.905 and 0.915.  
KXFEDDECISION-26OCT-H25 <-> 0x12aa13b3 — Fed hikes 25 bps; mids 0.085 and 0.075.  
KXBALANCEPOWERCOMBO-27FE (Democrats sweep) <-> 0x16c63b7c — Democratic Senate and House; both mids 0.675.

## Evidence (recorded top-of-book, observe-only)

- Coverage: 98537 rows, 480 ticks, 1928 Polymarket + 1207 Kalshi markets, 2026-10-14T19:13Z .. 2026-10-22T14:00Z (9 day files); median gap between ticks 15 min.
- Polymarket spread: median 1c (p25 0.1, p75 1), one-tick 89% of 42590 two-sided rows; touch median bid 15033.42 / ask 18766.61.
- Polymarket maker proxy (60-minute horizon): 35059 attempts (1850 unobservable: no later snapshot inside the horizon), fill 20%, round-trip 19%, net -39643.4c total = -1.131c/attempt (gross 1286, fees 0, mark -40929.4).
- Kalshi spread: median 1c (p25 1, p75 1), one-tick 89% of 34078 two-sided rows; touch median bid 18792.03 / ask 51308.94.
- Kalshi maker proxy (60-minute horizon): 28223 attempts (1310 unobservable: no later snapshot inside the horizon), fill 16%, round-trip 20%, net -31791.51c total = -1.126c/attempt (gross 919, fees 1576.71, mark -31133.8).
- Pair CONTROLH-2026-R vs 0x4e4f77e7: n=469, mean |diff| 0.95c, max 2c, >2c 0%; both-sides net-positive 0% (max 0.04c); leads: polymarket (lag 2, r=0.149).
- Pair CONTROLH-2026-D vs 0xd5d9fc47: n=475, mean |diff| 0.66c, max 1.35c, >2c 0%; both-sides net-positive 0% (max -0.15c); leads: polymarket (lag 1, r=0.296).
- Polymarket tightest UTC hours: 10h 93%, 8h 93%, 7h 92%; loosest: 3h 85%, 2h 84%.
- Top one-tick candidates: [pm] Will the Fed decrease interest rates by 50+ bps af (one-tick 100%, touch 1449360.61, mid 0.001); [ks] Carolina vs Philadelphia: Spread — Carolina wins b (one-tick 100%, touch 969785.09, mid 0.99); [ks] 2027 Pro Football Champion — Atlanta (one-tick 100%, touch 914489.11, mid 0.015); [pm] Will the Democratic Party control the House after  (one-tick 100%, touch 880397.16, mid 0.925); [ks] 2027 Pro Football Champion — New England (one-tick 100%, touch 878584.15, mid 0.035).
- Fees at 50c per contract: PM taker 1c / maker 0c; Kalshi taker 1.75c / maker 0.44c. One-cent maker round trip nets 1c on PM, 0.13c on Kalshi.

| venue | market | one-tick | touch | mid | 24h vol |
|---|---|---|---|---|---|
| pm | Will the Fed decrease interest rates by 50+ bps after the Oc | 100% | 1449360.61 | 0.001 | 142034.21 |
| ks | Carolina vs Philadelphia: Spread — Carolina wins by over 3.5 | 100% | 969785.09 | 0.99 | 1114748.96 |
| ks | 2027 Pro Football Champion — Atlanta | 100% | 914489.11 | 0.015 | 12308.13 |
| pm | Will the Democratic Party control the House after the 2026 M | 100% | 880397.16 | 0.925 | 584942.63 |
| ks | 2027 Pro Football Champion — New England | 100% | 878584.15 | 0.035 | 25176.62 |
| ks | Washington vs San Francisco: Spread — San Francisco wins by  | 96% | 1638735.26 | 0.01 | 5789583.77 |
| ks | 2027 Pro Football Champion — Houston | 100% | 839626.34 | 0.025 | 135508.9 |
| ks | 2027 Pro Football Champion — Cincinnati | 100% | 772653.68 | 0.035 | 61564.78 |
| ks | College Football National Championship Winner — Tennessee | 100% | 663115.74 | 0.015 | 53561.79 |
| ks | WAS Commanders vs SF 49ers — Washington | 100% | 664046.77 | 0.01 | 50303068.89 |

_Maker model is a proxy: a resting order counts as filled only when the recorded price trades through its level; no queue position is modeled._

## Witness
- session commit: `9eb43e295dc4383e9fbb02829566f13ae3b2a496`
- report sha256: `d2f3b820e26a474427746521571374ce44f43343dd567ae62c264824f9230a57`
- witness: `0097e9374bfba357f80b385fd20b3633788c5815aa365e738bf6a883de7bb52f`
