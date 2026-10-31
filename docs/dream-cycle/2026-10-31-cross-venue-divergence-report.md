# cross-venue-divergence — kdreams nightly research (2026-10-31)

> kdreams nightly (GitHub Actions, observe-only research). Model: openai/gpt-6-sol via OpenAI (6824 tokens, $0.02176).
> Nothing here placed an order. Tonight's hypothesis is INCONCLUSIVE by construction: it is
> frozen at 2026-10-31T14:45Z and is only graded on snapshots recorded after that.

## Frozen hypotheses graded tonight

| H | spec | post-freeze ticks | value | n | grade | by | note |
|---|---|---|---|---|---|---|---|
| 2026-10-30 | maker.netCentsPerAttempt > 0 (venue pm, mid 0.9..0.99, n>=300) | 94 | -0.923 | 435 | REFUTED | code | maker.netCentsPerAttempt = -0.923 vs > 0 on n=435 |
| 2026-10-29 | resolution.netCentsPer10 > 1 (venue ks, entry 0.97..0.99, n>=100) | 185 | -48.9 | 28 | INCONCLUSIVE | code | resolution.netCentsPer10 = -48.9 on n=28, below the n>=100 needed |

## Tonight's spec (frozen at 2026-10-31T14:45Z)

- pair.bothSidesFracNetPositive > 0.1 (pair house-2026-democratic, n>=300)
- pre-freeze value: 0.053 on n=2506; graded on post-freeze data once it has 48 ticks and n >= 300

## Observations
- The configured House pairs show modest average mid divergence: Republican 1.05c and Democratic 0.92c across 1,253 aligned snapshots each. Net-positive buy-both-sides checks occur in 7% and 5%, respectively; these are checks, not demonstrated fills.
- Neither pair shows a strong lead signal: the reported lag correlations are 0.073 and 0.066.
- Resolution rules remain a matching risk. The catalog’s Senate-control Republican outcomes have matching 0.285 mids, but identical wording of the settlement condition has not been established.

## Hypothesis
Given the configured Democratic House-control pair, when observing a buy-both-sides check at the recorded touch, then `pair.bothSidesFracNetPositive` should be > 0.10 vs the recorded 0.05 baseline, subject to both venues’ taker fees and verified equivalent resolution rules.

## Hypothesis spec
```json
{"metric":"pair.bothSidesFracNetPositive","pair":"house-2026-democratic","op":">","threshold":0.10,"minN":300}
```

## Next observation
Over the next 7 days, record aligned asks, fee-inclusive buy-both-sides checks, and the two House contracts’ resolution terms; distinguish positive checks from fillable opportunities without trading.

## Pair candidates
CONTROLS-2026-R <-> 0x86bfb53af7250a40928975 — Republican Senate control on both venues; both catalog mids are 0.285, pending resolution-rule verification.

## Evidence (recorded top-of-book, observe-only)

- Coverage: 251416 rows, 1258 ticks, 3393 Polymarket + 2063 Kalshi markets, 2026-10-18T03:15Z .. 2026-10-31T14:45Z (14 day files); median gap between ticks 15 min.
- Polymarket spread: median 1c (p25 0.2, p75 1), one-tick 88% of 108673 two-sided rows; touch median bid 6415.13 / ask 5317.71.
- Polymarket maker proxy (60-minute horizon): 94270 attempts (1356 unobservable: no later snapshot inside the horizon), fill 22%, round-trip 18%, net -121111.5c total = -1.285c/attempt (gross 3758, fees 0, mark -124869.5).
- Kalshi spread: median 1c (p25 1, p75 1), one-tick 92% of 89192 two-sided rows; touch median bid 15574.24 / ask 46241.65.
- Kalshi maker proxy (60-minute horizon): 80872 attempts (795 unobservable: no later snapshot inside the horizon), fill 16%, round-trip 18%, net -82530.91c total = -1.021c/attempt (gross 2288, fees 4159.9, mark -80659.05).
- Pair CONTROLH-2026-R vs 0x4e4f77e7: n=1253, mean |diff| 1.05c, max 3c, >2c 4%; both-sides net-positive 7% (max 1.08c); leads: polymarket (lag 2, r=0.073).
- Pair CONTROLH-2026-D vs 0xd5d9fc47: n=1253, mean |diff| 0.92c, max 2.95c, >2c 3%; both-sides net-positive 5% (max 0.98c); leads: kalshi (lag -3, r=0.066).
- Polymarket tightest UTC hours: 10h 92%, 12h 92%, 8h 91%; loosest: 0h 80%, 1h 78%.
- Top one-tick candidates: [ks] Dallas vs Philadelphia: Spread — Dallas wins by ov (one-tick 98%, touch 1825757.65, mid 0.99); [ks] Kansas City vs Seattle: Spread — Seattle wins by o (one-tick 100%, touch 1321067.35, mid 0.99); [ks] Carolina vs Green Bay: Spread — Green Bay wins by  (one-tick 96%, touch 1674796.99, mid 0.99); [pm] Will Josh Stein win the 2028 Democratic presidenti (one-tick 100%, touch 968966.56, mid 0.002); [ks] LA Chargers vs KC Chiefs — Los Angeles C (one-tick 100%, touch 956341.72, mid 0.01).
- Hold to resolution (5728 settled markets recorded; buy the favored side with $10 at the first snapshot in a price band, hold to settlement, taker fees in): pm 0.5-0.9 n=1959 win 64% net -38.4c/$10; pm 0.9-0.95 n=802 win 91% net -17.5c/$10; pm 0.95-0.97 n=509 win 96% net -2c/$10; pm 0.97-0.99 n=619 win 98% net 3.6c/$10; pm 0.99-1 n=748 win 99% net -1.7c/$10; ks 0.5-0.9 n=723 win 67% net -21.8c/$10; ks 0.9-0.95 n=347 win 91% net -18.1c/$10; ks 0.95-0.97 n=222 win 94% net -16.8c/$10; ks 0.97-0.99 n=265 win 98% net 3.5c/$10; ks 0.99-1 n=245 win 98% net -7.4c/$10. Best net-positive band with n >= 20: pm 0.97-0.99.
- Fees at 50c per contract: PM taker 1c / maker 0c; Kalshi taker 1.75c / maker 0.44c. One-cent maker round trip nets 1c on PM, 0.13c on Kalshi.

| venue | market | one-tick | touch | mid | 24h vol |
|---|---|---|---|---|---|
| ks | Dallas vs Philadelphia: Spread — Dallas wins by over 4.5 poi | 98% | 1825757.65 | 0.99 | 4562601.05 |
| ks | Kansas City vs Seattle: Spread — Seattle wins by over 2.5 po | 100% | 1321067.35 | 0.99 | 3986980.44 |
| ks | Carolina vs Green Bay: Spread — Green Bay wins by over 3.5 p | 96% | 1674796.99 | 0.99 | 4557675.97 |
| pm | Will Josh Stein win the 2028 Democratic presidential nominat | 100% | 968966.56 | 0.002 | 70457 |
| ks | LA Chargers vs KC Chiefs — Los Angeles C | 100% | 956341.72 | 0.01 | 10732378.29 |
| ks | 2027 Pro Football Champion — New England | 100% | 878584.15 | 0.035 | 25176.62 |
| pm | Will Mitch Landrieu win the 2028 Democratic presidential nom | 100% | 872460.97 | 0.002 | 70306 |
| ks | Washington vs San Francisco: Spread — San Francisco wins by  | 96% | 1638735.26 | 0.01 | 5789583.77 |
| pm | Will Candace Owens win the 2028 Republican presidential nomi | 100% | 713735.13 | 0.003 | 72585.01 |
| ks | Kansas City vs Seattle — Seattle | 100% | 703283.56 | 0.99 | 10853721.46 |

| venue | entry price | markets | unsized | win rate | net c per $10 | worst c | median hold h |
|---|---|---|---|---|---|---|---|
| pm | 0.5-0.9 | 1959 | 647 | 64% | -38.4 | -1020 | 2.9 |
| pm | 0.9-0.95 | 802 | 184 | 91% | -17.5 | -993.96 | 1.4 |
| pm | 0.95-0.97 | 509 | 127 | 96% | -2 | -968.28 | 1.3 |
| pm | 0.97-0.99 | 619 | 181 | 98% | 3.6 | -989.44 | 1.1 |
| pm | 0.99-1 | 748 | 274 | 99% | -1.7 | -990.4 | 0.9 |
| ks | 0.5-0.9 | 723 | 0 | 67% | -21.8 | -1035 | 2.4 |
| ks | 0.9-0.95 | 347 | 0 | 91% | -18.1 | -997 | 0.9 |
| ks | 0.95-0.97 | 222 | 0 | 94% | -16.8 | -963 | 0.9 |
| ks | 0.97-0.99 | 265 | 0 | 98% | 3.5 | -982 | 0.6 |
| ks | 0.99-1 | 245 | 0 | 98% | -7.4 | -991 | 0.6 |

_Hold to resolution counts only markets that have already settled, so long-dated markets are under-represented; one entry per market (per event on Kalshi)._

_Maker model is a proxy: a resting order counts as filled only when the recorded price trades through its level; no queue position is modeled._

## Witness
- session commit: `f61b4f5cde876366145ebf3cb4d0ea5f78792afe`
- report sha256: `b03a6b95da3a670dcb7c5d19bc3cf5fbbd765741b18f30ad19d0c0bc22743244`
- witness: `76ce09ac312a545cc7b082e0afe559a460782452be924fbc10e31d43d41ae930`
