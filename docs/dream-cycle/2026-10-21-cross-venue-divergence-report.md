# cross-venue-divergence — kdreams nightly research (2026-10-21)

> kdreams nightly (GitHub Actions, observe-only research). Model: openai/gpt-6-sol via OpenAI (5490 tokens, $0.01765).
> Nothing here placed an order. Tonight's hypothesis is INCONCLUSIVE by construction: it is
> frozen at 2026-10-21T14:00Z and is only graded on snapshots recorded after that.

## Frozen hypotheses graded tonight

| H | spec | post-freeze ticks | value | n | grade | by | note |
|---|---|---|---|---|---|---|---|
| 2026-10-20 | maker.netCentsPerAttempt < 0 (venue ks, mid 0.1..0.9, n>=300) | 97 | -1.561 | 4064 | SUPPORTED | code | maker.netCentsPerAttempt = -1.561 vs < 0 on n=4064 |

## Tonight's spec (frozen at 2026-10-21T14:00Z)

- pair.bothSidesFracNetPositive < 0.01 (pair house-2026-republican, n>=300)
- pre-freeze value: 0.003 on n=756; graded on post-freeze data once it has 48 ticks and n >= 300

## Observations
- The Republican House pair’s mean absolute mid-price difference was 1.02c across 378 aligned snapshots; differences exceeded 2c in 1%.
- The Democratic House pair’s mean absolute difference was 0.69c across 384 snapshots, with no differences exceeding 2c.
- Neither configured pair had a net-positive buy-both-sides check after taker fees: 0% for each. Quote divergence alone is not an executable edge.
- The collector’s median gap was 15 minutes, so these snapshots cannot establish whether shorter-lived divergences were actionable.

## Hypothesis
Given the configured Republican House cross-venue pair, when checking aligned quotes for a buy-both-sides opportunity without submitting orders, then pair.bothSidesFracNetPositive should be < 0.01 vs the observed 0%, subject to both venues’ taker fees.

## Hypothesis spec
```json
{"metric":"pair.bothSidesFracNetPositive","pair":"house-2026-republican","op":"<","threshold":0.01,"minN":300}
```

## Next observation
Over the next 7 days, record aligned top-of-book quotes and compute fee-adjusted buy-both-sides checks, while separately verifying that the paired contracts have equivalent resolution rules.

## Pair candidates
KXUCLGAME-26OCT21BMUARS- <-> 0x6c99b60b726fcb7e4fdeec — Bayern win on both; catalog mids 0.435 on each.  
KXUCLGAME-26OCT21BMUARS- <-> 0x43bb68fc1b7e002559026c — Arsenal win on both; catalog mids 0.315 on each.

## Evidence (recorded top-of-book, observe-only)

- Coverage: 79037 rows, 384 ticks, 1705 Polymarket + 1069 Kalshi markets, 2026-10-14T19:13Z .. 2026-10-21T14:00Z (8 day files); median gap between ticks 15 min.
- Polymarket spread: median 1c (p25 0.1, p75 1), one-tick 89% of 34105 two-sided rows; touch median bid 13919.2 / ask 18243.63.
- Polymarket maker proxy (60-minute horizon): 27914 attempts (1775 unobservable: no later snapshot inside the horizon), fill 19%, round-trip 19%, net -32577.35c total = -1.167c/attempt (gross 992, fees 0, mark -33569.35).
- Kalshi spread: median 1c (p25 1, p75 1), one-tick 90% of 26839 two-sided rows; touch median bid 23551.41 / ask 56382.75.
- Kalshi maker proxy (60-minute horizon): 22178 attempts (1207 unobservable: no later snapshot inside the horizon), fill 16%, round-trip 22%, net -25966.48c total = -1.171c/attempt (gross 774, fees 1248.68, mark -25491.8).
- Pair CONTROLH-2026-R vs 0x4e4f77e7: n=378, mean |diff| 1.02c, max 2c, >2c 1%; both-sides net-positive 0% (max 0.04c); leads: polymarket (lag 2, r=0.316).
- Pair CONTROLH-2026-D vs 0xd5d9fc47: n=384, mean |diff| 0.69c, max 1.35c, >2c 0%; both-sides net-positive 0% (max -0.15c); leads: simultaneous (lag 0, r=-0.003).
- Polymarket tightest UTC hours: 8h 93%, 9h 93%, 10h 93%; loosest: 2h 86%, 3h 85%.
- Top one-tick candidates: [pm] Will the Fed decrease interest rates by 50+ bps af (one-tick 100%, touch 1449360.61, mid 0.001); [ks] Carolina vs Philadelphia: Spread — Carolina wins b (one-tick 100%, touch 969785.09, mid 0.99); [ks] 2027 Pro Football Champion — Atlanta (one-tick 100%, touch 914489.11, mid 0.015); [ks] 2027 Pro Football Champion — New England (one-tick 100%, touch 878584.15, mid 0.035); [pm] Will the Democratic Party control the House after  (one-tick 100%, touch 873940.1, mid 0.915).
- Fees at 50c per contract: PM taker 1c / maker 0c; Kalshi taker 1.75c / maker 0.44c. One-cent maker round trip nets 1c on PM, 0.13c on Kalshi.

| venue | market | one-tick | touch | mid | 24h vol |
|---|---|---|---|---|---|
| pm | Will the Fed decrease interest rates by 50+ bps after the Oc | 100% | 1449360.61 | 0.001 | 112489.64 |
| ks | Carolina vs Philadelphia: Spread — Carolina wins by over 3.5 | 100% | 969785.09 | 0.99 | 1114748.96 |
| ks | 2027 Pro Football Champion — Atlanta | 100% | 914489.11 | 0.015 | 12308.13 |
| ks | 2027 Pro Football Champion — New England | 100% | 878584.15 | 0.035 | 25176.62 |
| pm | Will the Democratic Party control the House after the 2026 M | 100% | 873940.1 | 0.915 | 210367.74 |
| ks | Washington vs San Francisco: Spread — San Francisco wins by  | 96% | 1638735.26 | 0.01 | 5789583.77 |
| ks | 2027 Pro Football Champion — Houston | 100% | 837985.81 | 0.025 | 131694.59 |
| ks | 2027 Pro Football Champion — Cincinnati | 100% | 772653.68 | 0.035 | 61564.78 |
| ks | College Football National Championship Winner — Tennessee | 100% | 663115.74 | 0.015 | 53561.79 |
| ks | WAS Commanders vs SF 49ers — Washington | 100% | 664046.77 | 0.01 | 50303068.89 |

_Maker model is a proxy: a resting order counts as filled only when the recorded price trades through its level; no queue position is modeled._

## Witness
- session commit: `7a411447bfc1d725fca7553cc66c16edda8c9f69`
- report sha256: `55d1bc3f1e853852e79d47bebb19b90e86f3109ccbce0f00b6e705e70d7cebde`
- witness: `a5e0fc839deee5abc4016386db0e8ab417a7bd2fe5f28d2d8e3dba23c36fec45`
