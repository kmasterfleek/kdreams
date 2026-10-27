# liquidity-by-hour — kdreams nightly research (2026-10-27)

> kdreams nightly (GitHub Actions, observe-only research). Model: openai/gpt-6-sol via OpenAI (6926 tokens, $0.02222).
> Nothing here placed an order. Tonight's hypothesis is INCONCLUSIVE by construction: it is
> frozen at 2026-10-27T15:00Z and is only graded on snapshots recorded after that.

## Frozen hypotheses graded tonight

| H | spec | post-freeze ticks | value | n | grade | by | note |
|---|---|---|---|---|---|---|---|
| 2026-10-26 | pair.bothSidesFracNetPositive > 0.03 (pair house-2026-republican, n>=300) | 92 | 0.038 | 184 | INCONCLUSIVE | code | pair.bothSidesFracNetPositive = 0.038 on n=184, below the n>=300 needed |

## Tonight's spec (frozen at 2026-10-27T15:00Z)

- maker.netCentsPerAttempt > 0 (venue pm, UTC 7h-8h, mid 0.1..0.9, n>=300)
- pre-freeze value: -0.755 on n=1771; graded on post-freeze data once it has 48 ticks and n >= 300

## Observations
- Polymarket’s one-tick share is highest at UTC 7h, 8h and 10h (92% each), versus 79% at 1h and 80% at 2h. This describes spread, not executable hourly profit.
- Overall, 88% of Polymarket two-sided rows are one-tick, yet its 60-minute maker proxy nets −1.312c per attempt. A tight book alone has not overcome adverse marks.
- The UTC 8h–10h Polymarket maker-profit hypothesis was refuted after its freeze (−1.505c per attempt); an hourly claim needs a distinct, forward test.

## Hypothesis
Given Polymarket markets with mids from 0.1 to 0.9 at UTC 7h–8h, when a one-tick maker-proxy attempt is evaluated over 60 minutes, then maker.netCentsPerAttempt should be > 0c vs the overall −1.312c-per-attempt baseline, subject to the recorded adverse mark and maker-fee accounting.

## Hypothesis spec
```json
{"metric":"maker.netCentsPerAttempt","venue":"pm","slice":{"hoursUtc":[7,8],"midMin":0.1,"midMax":0.9},"op":">","threshold":0,"minN":300}
```

## Next observation
Over the next 7 days, record the same 60-minute maker-proxy outcomes by entry hour and check sample size and net cents per attempt; separately compute weekday and volume-cycle splits without treating them as tested hypotheses.

## Pair candidates
KXFEDDECISION-26OCT-H0 <-> 0xdf9bf27e — Fed maintains rates / no change; mids 0.935 / 0.943.  
KXMLB-26-TB <-> 0x4d9567b9 — Tampa Bay baseball champion; mids 0.04 / 0.031.  
KXMLB-26-MIL <-> 0x3db74f14 — Milwaukee baseball champion; mids 0.961 / 0.969.

## Evidence (recorded top-of-book, observe-only)

- Coverage: 192228 rows, 962 ticks, 3201 Polymarket + 1971 Kalshi markets, 2026-10-14T19:13Z .. 2026-10-27T15:00Z (14 day files); median gap between ticks 15 min.
- Polymarket spread: median 1c (p25 0.1, p75 1), one-tick 88% of 82386 two-sided rows; touch median bid 8620.85 / ask 7151.77.
- Polymarket maker proxy (60-minute horizon): 70589 attempts (2215 unobservable: no later snapshot inside the horizon), fill 21%, round-trip 19%, net -92599.2c total = -1.312c/attempt (gross 2905, fees 0, mark -95504.2).
- Kalshi spread: median 1c (p25 1, p75 1), one-tick 90% of 66003 two-sided rows; touch median bid 18683.86 / ask 51636.
- Kalshi maker proxy (60-minute horizon): 57918 attempts (1496 unobservable: no later snapshot inside the horizon), fill 16%, round-trip 20%, net -65525.7c total = -1.131c/attempt (gross 1884, fees 3261.57, mark -64148.15).
- Pair CONTROLH-2026-R vs 0x4e4f77e7: n=951, mean |diff| 1.03c, max 3c, >2c 4%; both-sides net-positive 2% (max 1.08c); leads: polymarket (lag 2, r=0.095).
- Pair CONTROLH-2026-D vs 0xd5d9fc47: n=957, mean |diff| 0.84c, max 2.95c, >2c 4%; both-sides net-positive 2% (max 0.98c); leads: polymarket (lag 1, r=0.083).
- Polymarket tightest UTC hours: 10h 92%, 7h 92%, 8h 92%; loosest: 2h 80%, 1h 79%.
- Top one-tick candidates: [pm] Will the Fed decrease interest rates by 50+ bps af (one-tick 100%, touch 1449360.61, mid 0.001); [ks] Dallas vs Philadelphia: Spread — Dallas wins by ov (one-tick 98%, touch 1825757.65, mid 0.99); [ks] Kansas City vs Seattle: Spread — Seattle wins by o (one-tick 100%, touch 1321067.35, mid 0.99); [ks] Carolina vs Philadelphia: Spread — Carolina wins b (one-tick 100%, touch 969785.09, mid 0.99); [ks] 2027 Pro Football Champion — Atlanta (one-tick 100%, touch 898369.08, mid 0.015).
- Hold to resolution (4533 settled markets recorded; buy the favored side with $10 at the first snapshot in a price band, hold to settlement, taker fees in): pm 0.5-0.9 n=1781 win 64% net -41.5c/$10; pm 0.9-0.95 n=651 win 91% net -10.3c/$10; pm 0.95-0.97 n=423 win 96% net -1.5c/$10; pm 0.97-0.99 n=510 win 98% net 1.7c/$10; pm 0.99-1 n=639 win 100% net 0.2c/$10; ks 0.5-0.9 n=706 win 67% net -28.4c/$10; ks 0.9-0.95 n=301 win 93% net 3.6c/$10; ks 0.95-0.97 n=199 win 95% net -13.5c/$10; ks 0.97-0.99 n=231 win 99% net 9.3c/$10; ks 0.99-1 n=217 win 99% net -0.4c/$10. Best net-positive band with n >= 20: ks 0.97-0.99.
- Fees at 50c per contract: PM taker 1c / maker 0c; Kalshi taker 1.75c / maker 0.44c. One-cent maker round trip nets 1c on PM, 0.13c on Kalshi.

| venue | market | one-tick | touch | mid | 24h vol |
|---|---|---|---|---|---|
| pm | Will the Fed decrease interest rates by 50+ bps after the Oc | 100% | 1449360.61 | 0.001 | 269603.4 |
| ks | Dallas vs Philadelphia: Spread — Dallas wins by over 4.5 poi | 98% | 1825757.65 | 0.99 | 4562601.05 |
| ks | Kansas City vs Seattle: Spread — Seattle wins by over 2.5 po | 100% | 1321067.35 | 0.99 | 3986980.44 |
| ks | Carolina vs Philadelphia: Spread — Carolina wins by over 3.5 | 100% | 969785.09 | 0.99 | 1114748.96 |
| ks | 2027 Pro Football Champion — Atlanta | 100% | 898369.08 | 0.015 | 108114.67 |
| ks | 2027 Pro Football Champion — New England | 100% | 878584.15 | 0.035 | 25176.62 |
| pm | Will Mitch Landrieu win the 2028 Democratic presidential nom | 100% | 872460.97 | 0.002 | 162841.28 |
| ks | Washington vs San Francisco: Spread — San Francisco wins by  | 96% | 1638735.26 | 0.01 | 5789583.77 |
| ks | Kansas City vs Seattle — Seattle | 100% | 703283.56 | 0.99 | 10853721.46 |
| ks | College Football National Championship Winner — Tennessee | 100% | 663115.74 | 0.01 | 115431.43 |

| venue | entry price | markets | unsized | win rate | net c per $10 | worst c | median hold h |
|---|---|---|---|---|---|---|---|
| pm | 0.5-0.9 | 1781 | 926 | 64% | -41.5 | -1020 | 2.9 |
| pm | 0.9-0.95 | 651 | 244 | 91% | -10.3 | -993.96 | 1.4 |
| pm | 0.95-0.97 | 423 | 163 | 96% | -1.5 | -963.46 | 1.3 |
| pm | 0.97-0.99 | 510 | 221 | 98% | 1.7 | -989.44 | 1.2 |
| pm | 0.99-1 | 639 | 310 | 100% | 0.2 | -990.4 | 1 |
| ks | 0.5-0.9 | 706 | 0 | 67% | -28.4 | -1035 | 2.8 |
| ks | 0.9-0.95 | 301 | 0 | 93% | 3.6 | -997 | 1.1 |
| ks | 0.95-0.97 | 199 | 0 | 95% | -13.5 | -963 | 1 |
| ks | 0.97-0.99 | 231 | 0 | 99% | 9.3 | -982 | 0.7 |
| ks | 0.99-1 | 217 | 0 | 99% | -0.4 | -991 | 0.6 |

_Hold to resolution counts only markets that have already settled, so long-dated markets are under-represented; one entry per market (per event on Kalshi)._

_Maker model is a proxy: a resting order counts as filled only when the recorded price trades through its level; no queue position is modeled._

## Witness
- session commit: `66eb5928de39fc4d2485df426573750e8b0e2fb0`
- report sha256: `95641d5a7d024635fd688b75c075dd0b7385528bde326600516a771c2a2ef467`
- witness: `61688a2deb93177d47cd4012f36ac1adca345ccc58946045280372123e4a9c71`
