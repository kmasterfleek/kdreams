# maker-spread-capture — kdreams nightly research (2026-10-20)

> kdreams nightly (GitHub Actions, observe-only research). Model: openai/gpt-6-sol via OpenAI (5528 tokens, $0.01871).
> Nothing here placed an order. Tonight's hypothesis is INCONCLUSIVE by construction: it is
> frozen at 2026-10-20T13:45Z and is only graded on snapshots recorded after that.

## Frozen hypotheses graded tonight

| H | spec | post-freeze ticks | value | n | grade | by | note |
|---|---|---|---|---|---|---|---|
| 2026-10-19 | maker.netCentsPerAttempt > 0 (venue pm, mid 0.2..0.8, n>=300) | 87 | -2.543 | 2327 | REFUTED | code | maker.netCentsPerAttempt = -2.543 vs > 0 on n=2327 |

## Tonight's spec (frozen at 2026-10-20T13:45Z)

- maker.netCentsPerAttempt < 0 (venue ks, mid 0.1..0.9, n>=300)
- pre-freeze value: -1.805 on n=10010; graded on post-freeze data once it has 48 ticks and n >= 300

## Observations
- One-tick spreads account for 89% of two-sided rows on each venue, but a visible spread is not realized maker profit.
- The 60-minute maker proxy lost 1.23c per attempt on Polymarket and 1.247c on Kalshi after marks and fees.
- Kalshi’s one-cent maker round trip nets only 0.13c at the stated 50c fee example, before adverse marks.
- Median touch size is 24547.81 bid and 60533.68 ask on Kalshi; top-of-book size does not establish queue position.

## Hypothesis
Given Kalshi markets with entry mids from 0.1 to 0.9, when evaluating the recorded 60-minute maker proxy at the touch, then maker.netCentsPerAttempt should be < 0 vs the all-market Kalshi baseline of -1.247c, subject to maker fees and exit marks being included.

## Hypothesis spec
```json
{"metric":"maker.netCentsPerAttempt","venue":"ks","slice":{"midMin":0.1,"midMax":0.9},"op":"<","threshold":0,"minN":300}
```

## Next observation
Over the next 7 days, record the same top-of-book snapshots and compute the specified sliced proxy, retaining unobservable attempts separately; do not trade.

## Pair candidates
KXUCLGAME-26OCT20PSGBAR- <-> 0x130d93a16ff24b39208e54 — Barcelona win on the same date; catalog mids 0.405 and 0.395.

## Evidence (recorded top-of-book, observe-only)

- Coverage: 58827 rows, 287 ticks, 1464 Polymarket + 924 Kalshi markets, 2026-10-14T19:13Z .. 2026-10-20T13:45Z (7 day files); median gap between ticks 15 min.
- Polymarket spread: median 1c (p25 0.1, p75 1), one-tick 89% of 25265 two-sided rows; touch median bid 10627.2 / ask 16084.82.
- Polymarket maker proxy (60-minute horizon): 20309 attempts (1687 unobservable: no later snapshot inside the horizon), fill 19%, round-trip 19%, net -24980.2c total = -1.23c/attempt (gross 734, fees 0, mark -25714.2).
- Kalshi spread: median 1c (p25 1, p75 1), one-tick 89% of 19108 two-sided rows; touch median bid 24547.81 / ask 60533.68.
- Kalshi maker proxy (60-minute horizon): 15510 attempts (1176 unobservable: no later snapshot inside the horizon), fill 16%, round-trip 21%, net -19342.12c total = -1.247c/attempt (gross 538, fees 855.62, mark -19024.5).
- Pair CONTROLH-2026-R vs 0x4e4f77e7: n=281, mean |diff| 1.08c, max 2c, >2c 1%; both-sides net-positive 0% (max 0.04c); leads: polymarket (lag 2, r=0.347).
- Pair CONTROLH-2026-D vs 0xd5d9fc47: n=287, mean |diff| 0.65c, max 1.35c, >2c 0%; both-sides net-positive 0% (max -0.15c); leads: kalshi (lag -3, r=-0.001).
- Polymarket tightest UTC hours: 9h 94%, 8h 94%, 7h 94%; loosest: 2h 84%, 17h 84%.
- Top one-tick candidates: [pm] Will the Fed decrease interest rates by 50+ bps af (one-tick 100%, touch 1449360.61, mid 0.001); [ks] Carolina vs Philadelphia: Spread — Carolina wins b (one-tick 100%, touch 969785.09, mid 0.99); [ks] 2027 Pro Football Champion — Atlanta (one-tick 100%, touch 914489.11, mid 0.015); [ks] 2027 Pro Football Champion — New England (one-tick 100%, touch 881383.17, mid 0.035); [ks] Washington vs San Francisco: Spread — San Francisc (one-tick 96%, touch 1638735.26, mid 0.01).
- Fees at 50c per contract: PM taker 1c / maker 0c; Kalshi taker 1.75c / maker 0.44c. One-cent maker round trip nets 1c on PM, 0.13c on Kalshi.

| venue | market | one-tick | touch | mid | 24h vol |
|---|---|---|---|---|---|
| pm | Will the Fed decrease interest rates by 50+ bps after the Oc | 100% | 1449360.61 | 0.001 | 70906.99 |
| ks | Carolina vs Philadelphia: Spread — Carolina wins by over 3.5 | 100% | 969785.09 | 0.99 | 1114748.96 |
| ks | 2027 Pro Football Champion — Atlanta | 100% | 914489.11 | 0.015 | 12308.13 |
| ks | 2027 Pro Football Champion — New England | 100% | 881383.17 | 0.035 | 211877.88 |
| ks | Washington vs San Francisco: Spread — San Francisco wins by  | 96% | 1638735.26 | 0.01 | 5789583.77 |
| ks | 2027 Pro Football Champion — Houston | 100% | 837485.81 | 0.025 | 121902.31 |
| ks | 2027 Pro Football Champion — Cincinnati | 100% | 772653.68 | 0.035 | 61564.78 |
| ks | College Football National Championship Winner — Tennessee | 100% | 663115.74 | 0.015 | 53561.79 |
| ks | WAS Commanders vs SF 49ers — Washington | 100% | 664046.77 | 0.01 | 50303068.89 |
| pm | Will the Fed increase interest rates by 50+ bps after the Oc | 100% | 638401.43 | 0.004 | 199288.8 |

_Maker model is a proxy: a resting order counts as filled only when the recorded price trades through its level; no queue position is modeled._

## Witness
- session commit: `4ced601157e9adeb9abba707193c67eae6072a03`
- report sha256: `bd9a332e68d8eed47e34608296c2215a8777d17089dbfdc2e0e20a2ab1453933`
- witness: `811553af7601a6250cb8874fb6e5ecfb16280b332806db1c1c67525d040004d1`
