# cross-venue-divergence — kdreams nightly research (2026-11-06)

> kdreams nightly (GitHub Actions, observe-only research). Model: openai/gpt-6-sol via OpenAI (6930 tokens, $0.02138).
> Nothing here placed an order. Tonight's hypothesis is INCONCLUSIVE by construction: it is
> frozen at 2026-11-06T16:15Z and is only graded on snapshots recorded after that.

## Frozen hypotheses graded tonight

| H | spec | post-freeze ticks | value | n | grade | by | note |
|---|---|---|---|---|---|---|---|
| 2026-11-05 | maker.netCentsPerAttempt > 0 (venue pm, mid 0.3..0.7, n>=300) | 87 | -2.911 | 1499 | REFUTED | code | maker.netCentsPerAttempt = -2.911 vs > 0 on n=1499 |
| 2026-11-04 | resolution.netCentsPer10 > 1 (venue ks, entry 0.5..0.9, n>=100) | 165 | 14.5 | 64 | INCONCLUSIVE | code | resolution.netCentsPer10 = 14.5 on n=64, below the n>=100 needed |
| 2026-11-03 | pair.bothSidesFracNetPositive > 0.12 (pair house-2026-democratic, n>=300) | 249 | 0.141 | 156 | INCONCLUSIVE | code | pair.bothSidesFracNetPositive = 0.141 on n=156, below the n>=300 needed |

## Tonight's spec (frozen at 2026-11-06T16:15Z)

- pair.bothSidesFracNetPositive > 0.1 (pair house-2026-republican, n>=300)
- pre-freeze value: 0.14 on n=2120; graded on post-freeze data once it has 48 ticks and n >= 300

## Observations
- The House Republican pair’s mean absolute mid-price difference was 1.07c across 1,060 aligned snapshots. Buy-both-sides checks were net-positive after taker fees in 14% of checks, with a maximum of 1.08c.
- The December Fed hike pair was more often over 2c apart (44% of 213 snapshots), yet only 7% of buy-both-sides checks were net-positive; the maximum was 0.02c. Mid-price divergence alone is a poor filter.
- Both House pairs had their strongest measured lead at lag 0. The 15-minute median snapshot gap cannot establish which venue moved first.

## Hypothesis
Given the matched 2026 House Republican-control pair, when evaluating simultaneous purchases of YES on both venues at recorded asks, then `pair.bothSidesFracNetPositive` should be **> 0.10** vs the recorded **0.14**, subject to identical YES resolution rules and per-order taker fees, including Kalshi’s cent rounding on a roughly $10 order.

## Hypothesis spec
```json
{"metric":"pair.bothSidesFracNetPositive","pair":"house-2026-republican","op":">","threshold":0.10,"minN":300}
```

## Next observation
Over the next 7 days, record aligned asks, available touch size, fee-rounded $10 buy-both-sides results, and any resolution-rule mismatch; report checks by independent market event rather than treating repeated snapshots as independent.

## Pair candidates
KXAKSENATE-26NOV03-DSUL <-> 0x741bb46008b72234857c51 — Dan Sullivan winning the Alaska Senate race is the same YES outcome; catalog mids are 0.031 and 0.022, so confirm rules before matching.

## Evidence (recorded top-of-book, observe-only)

- Coverage: 249177 rows, 1242 ticks, 3178 Polymarket + 2032 Kalshi markets, 2026-10-24T00:00Z .. 2026-11-06T16:15Z (14 day files); median gap between ticks 15 min.
- Polymarket spread: median 1c (p25 0.1, p75 1), one-tick 89% of 106075 two-sided rows; touch median bid 5339.98 / ask 4484.1.
- Polymarket maker proxy (60-minute horizon): 92517 attempts (1913 unobservable: no later snapshot inside the horizon), fill 22%, round-trip 18%, net -115543.5c total = -1.249c/attempt (gross 3617, fees 0, mark -119160.5).
- Kalshi spread: median 1c (p25 0.7, p75 1), one-tick 93% of 89676 two-sided rows; touch median bid 14060.84 / ask 35117.91.
- Kalshi maker proxy (60-minute horizon): 81731 attempts (1183 unobservable: no later snapshot inside the horizon), fill 17%, round-trip 16%, net -80387.84c total = -0.984c/attempt (gross 2290, fees 4189.62, mark -78488.3).
- Pair CONTROLH-2026-R vs 0x4e4f77e7: n=1060, mean |diff| 1.07c, max 3c, >2c 5%; both-sides net-positive 14% (max 1.08c); leads: simultaneous (lag 0, r=0.213).
- Pair CONTROLH-2026-D vs 0xd5d9fc47: n=1071, mean |diff| 0.97c, max 2.95c, >2c 4%; both-sides net-positive 11% (max 0.98c); leads: simultaneous (lag 0, r=0.259).
- Pair KXFEDDECISION-26DEC-H25 vs 0x8a419661: n=213, mean |diff| 1.36c, max 3c, >2c 44%; both-sides net-positive 7% (max 0.02c); leads: simultaneous (lag 0, r=0.762).
- Pair KXFEDDECISION-26DEC-H0 vs 0x723822eb: n=213, mean |diff| 1.27c, max 3.5c, >2c 16%; both-sides net-positive 0% (max 0.02c); leads: simultaneous (lag 0, r=0.573).
- Polymarket tightest UTC hours: 16h 93%, 10h 92%, 12h 92%; loosest: 2h 81%, 1h 80%.
- Top one-tick candidates: [ks] Dallas vs Philadelphia: Spread — Dallas wins by ov (one-tick 98%, touch 1825757.65, mid 0.99); [ks] Kansas City vs Seattle: Spread — Seattle wins by o (one-tick 100%, touch 1321067.35, mid 0.99); [ks] Carolina vs Green Bay: Spread — Green Bay wins by  (one-tick 96%, touch 1674796.99, mid 0.99); [pm] Will Josh Stein win the 2028 Democratic presidenti (one-tick 100%, touch 968966.56, mid 0.002); [ks] 2028 Democratic presidential nominee — Elizabeth W (one-tick 100%, touch 946033.81, mid 0.002).
- Hold to resolution (7713 settled markets recorded; buy the favored side with $10 at the first snapshot in a price band, hold to settlement, taker fees in): pm 0.5-0.9 n=1847 win 64% net -42.1c/$10; pm 0.9-0.95 n=809 win 91% net -9c/$10; pm 0.95-0.97 n=523 win 96% net -1c/$10; pm 0.97-0.99 n=620 win 98% net 0c/$10; pm 0.99-1 n=868 win 99% net -4.4c/$10; ks 0.5-0.9 n=698 win 70% net 0.7c/$10; ks 0.9-0.95 n=364 win 92% net -4.3c/$10; ks 0.95-0.97 n=242 win 95% net -12.7c/$10; ks 0.97-0.99 n=289 win 98% net 1c/$10; ks 0.99-1 n=249 win 98% net -7.8c/$10. Best net-positive band with n >= 20: ks 0.97-0.99.
- Fees at 50c per contract: PM taker 1c / maker 0c; Kalshi taker 1.75c / maker 0.44c. One-cent maker round trip nets 1c on PM, 0.13c on Kalshi.

| venue | market | one-tick | touch | mid | 24h vol |
|---|---|---|---|---|---|
| ks | Dallas vs Philadelphia: Spread — Dallas wins by over 4.5 poi | 98% | 1825757.65 | 0.99 | 4562601.05 |
| ks | Kansas City vs Seattle: Spread — Seattle wins by over 2.5 po | 100% | 1321067.35 | 0.99 | 3986980.44 |
| ks | Carolina vs Green Bay: Spread — Green Bay wins by over 3.5 p | 96% | 1674796.99 | 0.99 | 4557675.97 |
| pm | Will Josh Stein win the 2028 Democratic presidential nominat | 100% | 968966.56 | 0.002 | 70457 |
| ks | 2028 Democratic presidential nominee — Elizabeth Warren | 100% | 946033.81 | 0.002 | 272539.74 |
| pm | Will Mitch Landrieu win the 2028 Democratic presidential nom | 100% | 872459.44 | 0.002 | 70306 |
| ks | 2027 Pro Football Champion — Dallas | 100% | 839552.42 | 0.015 | 29978.57 |
| ks | 2027 Pro Football Champion — Pittsburgh | 100% | 839087.15 | 0.015 | 122473.38 |
| pm | Will the Democratic Party control the House after the 2026 M | 97% | 1226625.75 | 0.999 | 11996315.07 |
| ks | Chicago vs Seattle — Seattle | 100% | 793279.28 | 0.01 | 29421813.39 |

| venue | entry price | markets | unsized | win rate | net c per $10 | worst c | median hold h |
|---|---|---|---|---|---|---|---|
| pm | 0.5-0.9 | 1847 | 0 | 64% | -42.1 | -1020 | 2.9 |
| pm | 0.9-0.95 | 809 | 0 | 91% | -9 | -993.96 | 1.5 |
| pm | 0.95-0.97 | 523 | 0 | 96% | -1 | -968.28 | 1.4 |
| pm | 0.97-0.99 | 620 | 5 | 98% | 0 | -989.44 | 1.2 |
| pm | 0.99-1 | 868 | 87 | 99% | -4.4 | -997.12 | 1.2 |
| ks | 0.5-0.9 | 698 | 0 | 70% | 0.7 | -1035 | 2.6 |
| ks | 0.9-0.95 | 364 | 0 | 92% | -4.3 | -997 | 1.1 |
| ks | 0.95-0.97 | 242 | 0 | 95% | -12.7 | -963 | 1.2 |
| ks | 0.97-0.99 | 289 | 0 | 98% | 1 | -982 | 0.8 |
| ks | 0.99-1 | 249 | 0 | 98% | -7.8 | -991 | 0.7 |

_Hold to resolution counts only markets that have already settled, so long-dated markets are under-represented; one entry per market (per event on Kalshi)._

_Maker model is a proxy: a resting order counts as filled only when the recorded price trades through its level; no queue position is modeled._

## Witness
- session commit: `6ca878374249f4830245c4e55203b9359c0eb085`
- report sha256: `c82c3b450728a638984a556e9919b830fb008ccbfc4901778dd0bfa121ad5474`
- witness: `c70d14284a5a2bfdec8df96bb96adeb81c926d957fa2fb570a2018d83fbafdb0`
