# cross-venue-divergence — kdreams nightly research (2026-11-01)

> kdreams nightly (GitHub Actions, observe-only research). Model: openai/gpt-6-sol via OpenAI (6722 tokens, $0.02088).
> Nothing here placed an order. Tonight's hypothesis is INCONCLUSIVE by construction: it is
> frozen at 2026-11-01T15:30Z and is only graded on snapshots recorded after that.

## Frozen hypotheses graded tonight

| H | spec | post-freeze ticks | value | n | grade | by | note |
|---|---|---|---|---|---|---|---|
| 2026-10-31 | pair.bothSidesFracNetPositive > 0.1 (pair house-2026-democratic, n>=300) | 99 | 0.232 | 198 | INCONCLUSIVE | code | pair.bothSidesFracNetPositive = 0.232 on n=198, below the n>=300 needed |
| 2026-10-29 | resolution.netCentsPer10 > 1 (venue ks, entry 0.97..0.99, n>=100) | 284 | -9.9 | 62 | INCONCLUSIVE | code | resolution.netCentsPer10 = -9.9 on n=62, below the n>=100 needed |

## Tonight's spec (frozen at 2026-11-01T15:30Z)

- pair.bothSidesFracNetPositive > 0.1 (pair house-2026-democratic, n>=300)
- pre-freeze value: 0.069 on n=2580; graded on post-freeze data once it has 48 ticks and n >= 300

## Observations
- The Democratic House pair’s mids differ by 0.95c on average across 1,290 aligned snapshots, yet 7% of buy-both-sides checks are net-positive after taker fees; the maximum is 0.98c per contract.
- The Republican House pair shows a 1.06c mean absolute difference and 9% net-positive checks. Divergence alone does not establish repeatable profit: its earlier profit hypothesis was refuted on 378 later checks.
- Lead signals are weak for both pairs: reported correlations are 0.065 for the Democratic pair and 0.072 for the Republican pair.

## Hypothesis
Given the Democratic House pair, when simulating a purchase of complementary outcomes across venues at recorded touches, then `pair.bothSidesFracNetPositive` should be > 0.1 vs the recorded 0.07 baseline, subject to taker fees and verified matching resolution rules.

## Hypothesis spec
```json
{"metric":"pair.bothSidesFracNetPositive","pair":"house-2026-democratic","op":">","threshold":0.1,"minN":300}
```

## Next observation
Over the next 7 days, record aligned executable touches and both venues’ resolution terms, then recompute fee-net buy-both-sides checks without treating a positive snapshot as a fill.

## Pair candidates
KXLALIGAGAME-26NOV01SANR <-> 0x6e3ac1fc — Real Madrid to win; both mids 0.925, pending resolution-rule verification.

## Evidence (recorded top-of-book, observe-only)

- Coverage: 258730 rows, 1295 ticks, 3389 Polymarket + 2109 Kalshi markets, 2026-10-19T00:00Z .. 2026-11-01T15:30Z (14 day files); median gap between ticks 15 min.
- Polymarket spread: median 1c (p25 0.2, p75 1), one-tick 88% of 111612 two-sided rows; touch median bid 6767.61 / ask 5435.45.
- Polymarket maker proxy (60-minute horizon): 97176 attempts (1320 unobservable: no later snapshot inside the horizon), fill 22%, round-trip 18%, net -125008.85c total = -1.286c/attempt (gross 3691, fees 0, mark -128699.85).
- Kalshi spread: median 1c (p25 1, p75 1), one-tick 92% of 92644 two-sided rows; touch median bid 16576.54 / ask 48346.53.
- Kalshi maker proxy (60-minute horizon): 84331 attempts (799 unobservable: no later snapshot inside the horizon), fill 15%, round-trip 17%, net -82336.55c total = -0.976c/attempt (gross 2202, fees 4111.55, mark -80427.05).
- Pair CONTROLH-2026-R vs 0x4e4f77e7: n=1290, mean |diff| 1.06c, max 3c, >2c 4%; both-sides net-positive 9% (max 1.08c); leads: polymarket (lag 2, r=0.072).
- Pair CONTROLH-2026-D vs 0xd5d9fc47: n=1290, mean |diff| 0.95c, max 2.95c, >2c 3%; both-sides net-positive 7% (max 0.98c); leads: kalshi (lag -3, r=0.065).
- Polymarket tightest UTC hours: 10h 92%, 12h 92%, 16h 92%; loosest: 0h 80%, 1h 79%.
- Top one-tick candidates: [ks] Philadelphia vs Washington: Spread — Washington wi (one-tick 100%, touch 1695370.86, mid 0.515); [ks] Dallas vs Philadelphia: Spread — Dallas wins by ov (one-tick 98%, touch 1825757.65, mid 0.99); [ks] Kansas City vs Seattle: Spread — Seattle wins by o (one-tick 100%, touch 1321067.35, mid 0.99); [ks] Arizona vs Dallas: Spread — Dallas wins by over 7. (one-tick 100%, touch 1097888.09, mid 0.475); [ks] Carolina vs Green Bay: Spread — Green Bay wins by  (one-tick 96%, touch 1674796.99, mid 0.99).
- Hold to resolution (6169 settled markets recorded; buy the favored side with $10 at the first snapshot in a price band, hold to settlement, taker fees in): pm 0.5-0.9 n=1967 win 64% net -42.4c/$10; pm 0.9-0.95 n=830 win 91% net -13.1c/$10; pm 0.95-0.97 n=521 win 97% net 6.6c/$10; pm 0.97-0.99 n=634 win 98% net 0.9c/$10; pm 0.99-1 n=781 win 99% net -2.6c/$10; ks 0.5-0.9 n=725 win 68% net -7.6c/$10; ks 0.9-0.95 n=346 win 91% net -12.4c/$10; ks 0.95-0.97 n=218 win 94% net -18.1c/$10; ks 0.97-0.99 n=264 win 99% net 7.1c/$10; ks 0.99-1 n=247 win 98% net -11.3c/$10. Best net-positive band with n >= 20: ks 0.97-0.99.
- Fees at 50c per contract: PM taker 1c / maker 0c; Kalshi taker 1.75c / maker 0.44c. One-cent maker round trip nets 1c on PM, 0.13c on Kalshi.

| venue | market | one-tick | touch | mid | 24h vol |
|---|---|---|---|---|---|
| ks | Philadelphia vs Washington: Spread — Washington wins by over | 100% | 1695370.86 | 0.515 | 646978.56 |
| ks | Dallas vs Philadelphia: Spread — Dallas wins by over 4.5 poi | 98% | 1825757.65 | 0.99 | 4562601.05 |
| ks | Kansas City vs Seattle: Spread — Seattle wins by over 2.5 po | 100% | 1321067.35 | 0.99 | 3986980.44 |
| ks | Arizona vs Dallas: Spread — Dallas wins by over 7.5 points | 100% | 1097888.09 | 0.475 | 699645.98 |
| ks | Carolina vs Green Bay: Spread — Green Bay wins by over 3.5 p | 96% | 1674796.99 | 0.99 | 4557675.97 |
| pm | Will Josh Stein win the 2028 Democratic presidential nominat | 100% | 968966.56 | 0.002 | 70457 |
| ks | 2027 Pro Football Champion — New England | 100% | 878584.15 | 0.035 | 25176.62 |
| pm | Will Mitch Landrieu win the 2028 Democratic presidential nom | 100% | 872460.97 | 0.002 | 70306 |
| ks | Washington vs San Francisco: Spread — San Francisco wins by  | 96% | 1638735.26 | 0.01 | 5789583.77 |
| ks | Las Vegas vs New York J — New York J | 100% | 747509.46 | 0.535 | 541730.55 |

| venue | entry price | markets | unsized | win rate | net c per $10 | worst c | median hold h |
|---|---|---|---|---|---|---|---|
| pm | 0.5-0.9 | 1967 | 494 | 64% | -42.4 | -1020 | 2.8 |
| pm | 0.9-0.95 | 830 | 148 | 91% | -13.1 | -993.96 | 1.4 |
| pm | 0.95-0.97 | 521 | 98 | 97% | 6.6 | -968.28 | 1.4 |
| pm | 0.97-0.99 | 634 | 149 | 98% | 0.9 | -989.44 | 1.1 |
| pm | 0.99-1 | 781 | 237 | 99% | -2.6 | -997.12 | 1 |
| ks | 0.5-0.9 | 725 | 0 | 68% | -7.6 | -1035 | 2.3 |
| ks | 0.9-0.95 | 346 | 0 | 91% | -12.4 | -997 | 1 |
| ks | 0.95-0.97 | 218 | 0 | 94% | -18.1 | -963 | 1 |
| ks | 0.97-0.99 | 264 | 0 | 99% | 7.1 | -982 | 0.7 |
| ks | 0.99-1 | 247 | 0 | 98% | -11.3 | -991 | 0.6 |

_Hold to resolution counts only markets that have already settled, so long-dated markets are under-represented; one entry per market (per event on Kalshi)._

_Maker model is a proxy: a resting order counts as filled only when the recorded price trades through its level; no queue position is modeled._

## Witness
- session commit: `84b049414816f1d485bc20bcaa691b800e19c8f9`
- report sha256: `6acba8257cf52e33ce6de3a8356e798e1bc0f86bfc4f79a4b2fb1d06a56c52a0`
- witness: `e61237eaa02efdae4871327ece642cecd59dacc2e3151d4296de46e8cc98f3e6`
