# fee-modeling — kdreams nightly research (2026-10-24)

> kdreams nightly (GitHub Actions, observe-only research). Model: openai/gpt-6-sol via OpenAI (6890 tokens, $0.02188).
> Nothing here placed an order. Tonight's hypothesis is INCONCLUSIVE by construction: it is
> frozen at 2026-10-24T12:45Z and is only graded on snapshots recorded after that.

## Frozen hypotheses graded tonight

| H | spec | post-freeze ticks | value | n | grade | by | note |
|---|---|---|---|---|---|---|---|
| 2026-10-23 | resolution.netCentsPer10 > 1 (venue pm, entry 0.97..0.99, n>=100) | 92 | 19.6 | 26 | INCONCLUSIVE | code | resolution.netCentsPer10 = 19.6 on n=26, below the n>=100 needed |

## Tonight's spec (frozen at 2026-10-24T12:45Z)

- resolution.netCentsPer10 > 1 (venue pm, entry 0.9..0.95, n>=100)
- pre-freeze value: 2.7 on n=414; graded on post-freeze data once it has 48 ticks and n >= 100

## Observations
- At 50c, a one-cent maker round trip nets 1c per contract on Polymarket but 0.13c on Kalshi after maker fees. At a 50c entry price, 1c per contract is 2% of capital.
- The maker proxy is negative on both venues: −1.201c per Polymarket attempt and −1.042c per Kalshi attempt. It does not model queue position.
- Holding favored Polymarket entries priced 0.9–0.95 to settlement returned 2.7c per $10 across 414 settled markets, after taker fees. The worst recorded entry lost 993.96c per $10.

## Hypothesis
Given Polymarket favored-side entries priced 0.9–0.95, when buying at the recorded touch and holding to settlement, then resolution.netCentsPer10 should be > 1c per $10 vs the recorded 2.7c per $10, subject to taker fees and the risk that a single loss overwhelms many wins.

## Hypothesis spec
```json
{"metric":"resolution.netCentsPer10","venue":"pm","slice":{"priceMin":0.9,"priceMax":0.95},"op":">","threshold":1,"minN":100}
```

## Next observation
Over the next 7 days, record newly settled eligible markets and compute after-fee net cents per $10, keeping one entry per market and reporting the sample size.

## Pair candidates
KXBRPRES-26-LULA <-> 0xdf8e2dc5 — Lula winner on both; mids 0.205 vs 0.195.  
KXEPLGAME-26OCT24AVLMCI- <-> 0x9edd4fbc — Aston Villa winner on both; mids 0.165 vs 0.165.  
KXEPLGAME-26OCT24CFCTOT- <-> 0x59d4686a — Chelsea winner on both; mids 0.505 vs 0.505.

## Evidence (recorded top-of-book, observe-only)

- Coverage: 133158 rows, 667 ticks, 2375 Polymarket + 1491 Kalshi markets, 2026-10-14T19:13Z .. 2026-10-24T12:45Z (11 day files); median gap between ticks 15 min.
- Polymarket spread: median 1c (p25 0.1, p75 1), one-tick 89% of 57162 two-sided rows; touch median bid 10586.95 / ask 10233.92.
- Polymarket maker proxy (60-minute horizon): 48725 attempts (2001 unobservable: no later snapshot inside the horizon), fill 20%, round-trip 18%, net -58523.25c total = -1.201c/attempt (gross 1767, fees 0, mark -60290.25).
- Kalshi spread: median 1c (p25 1, p75 1), one-tick 90% of 46586 two-sided rows; touch median bid 18476.43 / ask 53093.6.
- Kalshi maker proxy (60-minute horizon): 40560 attempts (1407 unobservable: no later snapshot inside the horizon), fill 15%, round-trip 20%, net -42255.74c total = -1.042c/attempt (gross 1213, fees 2143.99, mark -41324.75).
- Pair CONTROLH-2026-R vs 0x4e4f77e7: n=656, mean |diff| 0.92c, max 2c, >2c 0%; both-sides net-positive 0% (max 0.04c); leads: polymarket (lag 2, r=0.112).
- Pair CONTROLH-2026-D vs 0xd5d9fc47: n=662, mean |diff| 0.69c, max 1.35c, >2c 0%; both-sides net-positive 0% (max -0.15c); leads: polymarket (lag 1, r=0.18).
- Polymarket tightest UTC hours: 10h 93%, 8h 92%, 7h 92%; loosest: 3h 83%, 2h 82%.
- Top one-tick candidates: [pm] Will the Fed decrease interest rates by 50+ bps af (one-tick 100%, touch 1449360.61, mid 0.001); [pm] Will Mitch Landrieu win the 2028 Democratic presid (one-tick 100%, touch 1035440.59, mid 0.002); [ks] Carolina vs Philadelphia: Spread — Carolina wins b (one-tick 100%, touch 969785.09, mid 0.99); [ks] 2027 Pro Football Champion — Atlanta (one-tick 100%, touch 914489.11, mid 0.015); [ks] 2027 Pro Football Champion — New England (one-tick 100%, touch 878584.15, mid 0.035).
- Hold to resolution (3207 settled markets recorded; buy the favored side with $10 at the first snapshot in a price band, hold to settlement, taker fees in): pm 0.5-0.9 n=1198 win 63% net -57c/$10; pm 0.9-0.95 n=414 win 93% net 2.7c/$10; pm 0.95-0.97 n=274 win 95% net -9.9c/$10; pm 0.97-0.99 n=357 win 98% net 4.5c/$10; pm 0.99-1 n=418 win 100% net 2.5c/$10; ks 0.5-0.9 n=496 win 66% net -49.5c/$10; ks 0.9-0.95 n=204 win 93% net -1.7c/$10; ks 0.95-0.97 n=137 win 94% net -16.5c/$10; ks 0.97-0.99 n=159 win 98% net 3.6c/$10; ks 0.99-1 n=151 win 99% net 2.3c/$10. Best net-positive band with n >= 20: pm 0.97-0.99.
- Fees at 50c per contract: PM taker 1c / maker 0c; Kalshi taker 1.75c / maker 0.44c. One-cent maker round trip nets 1c on PM, 0.13c on Kalshi.

| venue | market | one-tick | touch | mid | 24h vol |
|---|---|---|---|---|---|
| pm | Will the Fed decrease interest rates by 50+ bps after the Oc | 100% | 1449360.61 | 0.001 | 178910.25 |
| pm | Will Mitch Landrieu win the 2028 Democratic presidential nom | 100% | 1035440.59 | 0.002 | 62400 |
| ks | Carolina vs Philadelphia: Spread — Carolina wins by over 3.5 | 100% | 969785.09 | 0.99 | 1114748.96 |
| ks | 2027 Pro Football Champion — Atlanta | 100% | 914489.11 | 0.015 | 12308.13 |
| ks | 2027 Pro Football Champion — New England | 100% | 878584.15 | 0.035 | 25176.62 |
| ks | Washington vs San Francisco: Spread — San Francisco wins by  | 96% | 1638735.26 | 0.01 | 5789583.77 |
| ks | 2027 Pro Football Champion — Houston | 100% | 816179.04 | 0.035 | 69350.65 |
| pm | Will the Democratic Party control the House after the 2026 M | 99% | 888032.21 | 0.915 | 316758.48 |
| ks | 2027 Pro Football Champion — Cincinnati | 100% | 772653.68 | 0.035 | 61564.78 |
| pm | Will the Republican Party control the House after the 2026 M | 99% | 794033.1 | 0.085 | 286382.76 |

| venue | entry price | markets | unsized | win rate | net c per $10 | worst c | median hold h |
|---|---|---|---|---|---|---|---|
| pm | 0.5-0.9 | 1198 | 909 | 63% | -57 | -1020 | 2.9 |
| pm | 0.9-0.95 | 414 | 237 | 93% | 2.7 | -993.96 | 1.5 |
| pm | 0.95-0.97 | 274 | 153 | 95% | -9.9 | -963.46 | 1.5 |
| pm | 0.97-0.99 | 357 | 211 | 98% | 4.5 | -987.51 | 1.3 |
| pm | 0.99-1 | 418 | 263 | 100% | 2.5 | -990.4 | 1 |
| ks | 0.5-0.9 | 496 | 0 | 66% | -49.5 | -1035 | 2.7 |
| ks | 0.9-0.95 | 204 | 0 | 93% | -1.7 | -997 | 1 |
| ks | 0.95-0.97 | 137 | 0 | 94% | -16.5 | -963 | 1 |
| ks | 0.97-0.99 | 159 | 0 | 98% | 3.6 | -982 | 0.7 |
| ks | 0.99-1 | 151 | 0 | 99% | 2.3 | -991 | 0.6 |

_Hold to resolution counts only markets that have already settled, so long-dated markets are under-represented; one entry per market (per event on Kalshi)._

_Maker model is a proxy: a resting order counts as filled only when the recorded price trades through its level; no queue position is modeled._

## Witness
- session commit: `be2d6cb6bd8153f6da41083579b1300f112c0685`
- report sha256: `d23a1d95bdafe56d2db6f27d03ab6bb579939b26cf59f990069a811573e45500`
- witness: `1f9c95085bf179c2cb9b67bfbc78982f22f0d974367311416243cefa76e1679b`
