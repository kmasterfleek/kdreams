# fee-modeling — kdreams nightly research (2026-10-19)

> kdreams nightly (GitHub Actions, observe-only research). Model: openai/gpt-6-sol via OpenAI (5384 tokens, $0.01769).
> Nothing here placed an order. Tonight's hypothesis is INCONCLUSIVE by construction: it is
> frozen at 2026-10-19T16:00Z and is only graded on snapshots recorded after that.

## Frozen hypotheses graded tonight

| H | spec | post-freeze ticks | value | n | grade | by | note |
|---|---|---|---|---|---|---|---|
| 2026-10-14 | none | n/a | n/a | n/a | UNGRADEABLE | rule | needs continuous Level 2 snapshots; the collector records top-of-book only |
| 2026-10-18 | none | n/a | n/a | n/a | UNGRADEABLE | rule | needs finer-than-15-minute cadence; the collector records every 15 minutes |
| 2026-10-17 | spread.fracOneCent > 0.93 (venue pm, UTC 8h-10h) | 140 | 0.949 | 1122 | SUPPORTED | code | spread.fracOneCent = 0.949 vs > 0.93 on n=1122 |
| 2026-10-16 | maker.roundTripRate > 0.15 (venue pm, UTC 5h-9h, mid 0.1..0.9) | 188 | 0.213 | 282 | SUPPORTED | code | maker.roundTripRate = 0.213 vs > 0.15 on n=282 |
| 2026-10-15 | maker.netCentsPerAttempt > 0.8 (venue pm, UTC 5h-10h, mid 0.1..1) | 194 | -0.788 | 2630 | REFUTED | code | maker.netCentsPerAttempt = -0.788 vs > 0.8 on n=2630 |

## Tonight's spec (frozen at 2026-10-19T16:00Z)

- maker.netCentsPerAttempt > 0 (venue pm, mid 0.2..0.8, n>=300)
- pre-freeze value: -2.452 on n=5272; graded on post-freeze data once it has 48 ticks and n >= 300

## Observations
- At 50c, a one-cent maker round trip nets 1c on Polymarket after its 0c maker fee, but 0.13c on Kalshi after its 0.44c maker fee per side.
- Fees alone do not explain the maker-proxy losses: Polymarket averaged -1.27c per attempt with 0 fees; Kalshi averaged -1.557c with 635.59c in fees.
- The proxy omits queue position. Its 60-minute fill rate was 19% on both venues, so the round-trip fee calculation is not an estimate of expected profit per attempt.

## Hypothesis
Given Polymarket markets with entry mids from 0.2 to 0.8, when modeling a one-tick maker round trip over the recorded 60-minute horizon, then maker.netCentsPerAttempt should be > 0c vs the all-market Polymarket baseline of -1.27c, subject to including marks on unsuccessful exits and assuming no maker fee.

## Hypothesis spec
```json
{"metric":"maker.netCentsPerAttempt","venue":"pm","slice":{"midMin":0.2,"midMax":0.8},"op":">","threshold":0,"minN":300}
```

## Next observation
Over the next 7 days, compute that slice’s maker-proxy net cents per attempt from newly recorded snapshots, retaining unsuccessful-exit marks and flagging attempts without a later snapshot inside the horizon.

## Pair candidates
KXATPMATCH-26OCT19KUKSAK <-> 0x76a7b37b — Kukushkin wins; mids 0.755 and 0.76.  
KXWTAMATCH-26OCT18BOUSAK <-> 0xfdacaa62 — Boulter wins; mids 0.945 and 0.935.  
KXATPCHALLENGERMATCH-26O <-> 0xd2fe0c2f — Boyer wins; mids 0.015 and 0.01; verify the truncated Kalshi ticker before matching.

## Evidence (recorded top-of-book, observe-only)

- Coverage: 40627 rows, 200 ticks, 1256 Polymarket + 827 Kalshi markets, 2026-10-14T19:13Z .. 2026-10-19T16:00Z (6 day files); median gap between ticks 15 min.
- Polymarket spread: median 1c (p25 0.1, p75 1), one-tick 89% of 17093 two-sided rows; touch median bid 12919.5 / ask 15830.59.
- Polymarket maker proxy (60-minute horizon): 13525 attempts (1601 unobservable: no later snapshot inside the horizon), fill 19%, round-trip 21%, net -17180.05c total = -1.27c/attempt (gross 552, fees 0, mark -17732.05).
- Kalshi spread: median 1c (p25 1, p75 1), one-tick 88% of 12104 two-sided rows; touch median bid 21189.71 / ask 58676.8.
- Kalshi maker proxy (60-minute horizon): 9466 attempts (1155 unobservable: no later snapshot inside the horizon), fill 19%, round-trip 24%, net -14739.03c total = -1.557c/attempt (gross 430, fees 635.59, mark -14533.45).
- Pair CONTROLH-2026-R vs 0x4e4f77e7: n=194, mean |diff| 0.95c, max 1c, >2c 0%; both-sides net-positive 0% (max -0.99c); leads: n/a (lag n/a, r=n/a).
- Pair CONTROLH-2026-D vs 0xd5d9fc47: n=200, mean |diff| 0.35c, max 0.4c, >2c 0%; both-sides net-positive 0% (max -1.18c); leads: n/a (lag n/a, r=n/a).
- Polymarket tightest UTC hours: 8h 95%, 9h 95%, 7h 94%; loosest: 19h 84%, 3h 84%.
- Top one-tick candidates: [pm] Will the Fed decrease interest rates by 50+ bps af (one-tick 100%, touch 1449360.61, mid 0.001); [ks] Carolina vs Philadelphia: Spread — Carolina wins b (one-tick 100%, touch 969785.09, mid 0.99); [ks] 2027 Pro Football Champion — Atlanta (one-tick 100%, touch 914489.11, mid 0.015); [ks] 2027 Pro Football Champion — New England (one-tick 100%, touch 875292.36, mid 0.035); [pm] Will the Republican Party control the House after  (one-tick 100%, touch 772772.25, mid 0.095).
- Fees at 50c per contract: PM taker 1c / maker 0c; Kalshi taker 1.75c / maker 0.44c. One-cent maker round trip nets 1c on PM, 0.13c on Kalshi.

| venue | market | one-tick | touch | mid | 24h vol |
|---|---|---|---|---|---|
| pm | Will the Fed decrease interest rates by 50+ bps after the Oc | 100% | 1449360.61 | 0.001 | 1278537.73 |
| ks | Carolina vs Philadelphia: Spread — Carolina wins by over 3.5 | 100% | 969785.09 | 0.99 | 1114748.96 |
| ks | 2027 Pro Football Champion — Atlanta | 100% | 914489.11 | 0.015 | 12308.13 |
| ks | 2027 Pro Football Champion — New England | 100% | 875292.36 | 0.035 | 229089 |
| pm | Will the Republican Party control the House after the 2026 M | 100% | 772772.25 | 0.095 | 119302.79 |
| ks | 2027 Pro Football Champion — Cincinnati | 100% | 690557.92 | 0.035 | 101552.41 |
| ks | College Football National Championship Winner — Tennessee | 100% | 663115.74 | 0.015 | 53561.79 |
| ks | WAS Commanders vs SF 49ers — Washington | 100% | 660843.81 | 0.215 | 1490338.03 |
| ks | 2027 Pro Football Champion — Minnesota | 100% | 605933.15 | 0.045 | 298149.69 |
| ks | 2027 Pro Football Champion — Houston | 100% | 588080.52 | 0.025 | 270972.79 |

_Maker model is a proxy: a resting order counts as filled only when the recorded price trades through its level; no queue position is modeled._

## Witness
- session commit: `002c6e4f2c3731152ba4d8db3b5d14cfa8a95ed1`
- report sha256: `43f08143b83ced7e9c95d0b3d63639fc8832eb0da01826333c1c9213c162b10d`
- witness: `0116894bff47b2d715b84973f80e0d17cb526697beec2b6df9d8e616dbac7504`
