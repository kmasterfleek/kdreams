# cross-venue-divergence — kdreams nightly research (2026-11-11)

> kdreams nightly (GitHub Actions, observe-only research). Model: openai/gpt-6-sol via OpenAI (7822 tokens, $0.02371).
> Nothing here placed an order. Tonight's hypothesis is INCONCLUSIVE by construction: it is
> frozen at 2026-11-11T16:45Z and is only graded on snapshots recorded after that.

## Frozen hypotheses graded tonight

| H | spec | post-freeze ticks | value | n | grade | by | note |
|---|---|---|---|---|---|---|---|
| 2026-11-10 | maker.netCentsPerAttempt > 1 (venue pm, mid 0.7..0.9, n>=300) | 98 | -2.031 | 586 | REFUTED | code | maker.netCentsPerAttempt = -2.031 vs > 1 on n=586 |
| 2026-11-09 | resolution.netCentsPer10 > 1 (venue ks, entry 0.9..0.95, n>=100) | 167 | -12.1 | 35 | INCONCLUSIVE | code | resolution.netCentsPer10 = -12.1 on n=35, below the n>=100 needed |

## Tonight's spec (frozen at 2026-11-11T16:45Z)

- pair.bothSidesFracNetPositive > 0.02 (pair fed-2026-12-hold, n>=100)
- pre-freeze value: 0.008 on n=1316; graded on post-freeze data once it has 48 ticks and n >= 100

## Observations
- The configured Fed hold pair differed by 1.16c on average across 658 aligned snapshots, but buying complementary sides was net-positive after fees in only 1% of checks.
- The Fed hike pair exceeded a 2c midpoint difference in 16% of 658 snapshots; complementary-side checks were net-positive in only 2%. Midpoint divergence is not a touch-price edge.
- The scanner found a candidate showing 18c/$10 at one scan, but it is not configured. Its outcome equivalence and resolution rules still need human confirmation.

## Hypothesis
Given the configured Fed December hold pair, when simulating complementary-side purchases at recorded touches, then pair.bothSidesFracNetPositive should be > 0.02 vs the recorded 0.01 baseline, subject to both venues’ taker fees and equivalent resolution outcomes.

## Hypothesis spec
```json
{"metric":"pair.bothSidesFracNetPositive","pair":"fed-2026-12-hold","op":">","threshold":0.02,"minN":100}
```

## Next observation
Over the next 7 days, record aligned executable touches, available size, fees, and both venues’ resolution-rule text; separately compute how many equivalent-outcome checks clear 1c per $10.

## Pair candidates
none found

## Evidence (recorded top-of-book, observe-only)

- Coverage: 244999 rows, 1210 ticks, 3248 Polymarket + 2128 Kalshi markets, 2026-10-29T00:00Z .. 2026-11-11T16:45Z (14 day files); median gap between ticks 15 min.
- Polymarket spread: median 1c (p25 0.1, p75 1), one-tick 89% of 104241 two-sided rows; touch median bid 3821.25 / ask 3430.94.
- Polymarket maker proxy (60-minute horizon): 90167 attempts (2278 unobservable: no later snapshot inside the horizon), fill 21%, round-trip 17%, net -108349.95c total = -1.202c/attempt (gross 3299, fees 0, mark -111648.95).
- Kalshi spread: median 1c (p25 0.4, p75 1), one-tick 93% of 87324 two-sided rows; touch median bid 10902.61 / ask 26752.46.
- Kalshi maker proxy (60-minute horizon): 79405 attempts (1415 unobservable: no later snapshot inside the horizon), fill 18%, round-trip 16%, net -76900.73c total = -0.968c/attempt (gross 2218, fees 3845.24, mark -75273.6).
- Pair house-2026-republican (CONTROLH-2026-R vs 0x4e4f77e7) SETTLED 2026-11-04T09:57Z, no new data can arrive: n=583, mean |diff| 1.04c, max 2.5c, >2c 3%; both-sides net-positive 20% (max 1.07c); leads: simultaneous (lag 0, r=0.389).
- Pair house-2026-democratic (CONTROLH-2026-D vs 0xd5d9fc47) SETTLED 2026-11-04T13:06Z, no new data can arrive: n=594, mean |diff| 0.95c, max 2.35c, >2c 1%; both-sides net-positive 16% (max 0.98c); leads: simultaneous (lag 0, r=0.496).
- Pair fed-2026-12-hike25 (KXFEDDECISION-26DEC-H25 vs 0x8a419661): n=658, mean |diff| 0.63c, max 3c, >2c 16%; both-sides net-positive 2% (max 0.02c); leads: simultaneous (lag 0, r=0.759).
- Pair fed-2026-12-hold (KXFEDDECISION-26DEC-H0 vs 0x723822eb): n=658, mean |diff| 1.16c, max 3.5c, >2c 18%; both-sides net-positive 1% (max 0.69c); leads: simultaneous (lag 0, r=0.687).
- Pair fed-2026-12-cut25 (KXFEDDECISION-26DEC-C25 vs 0xf17ad24e): n=132, mean |diff| 0.66c, max 1.05c, >2c 0%; both-sides net-positive 5% (max 0.41c); leads: kalshi (lag -1, r=-0.01).
- Pair hormuz-2026-11-normal (KXHORMUZNORM-26MAR17-B261201 vs 0xd64b917e): n=152, mean |diff| 0.36c, max 1.45c, >2c 0%; both-sides net-positive 4% (max 0.7c); leads: kalshi (lag -3, r=0.004).
- Pair scanner (2026-11-11T06:00Z): 7 same-event pairs among 243 Polymarket + 1087 Kalshi non-sports markets closing within 42 days, 3 not yet configured; 2 netted >= 1c per $10 buying both sides at scan time. Closest: 18c/$10 KXUSIRANMEETING-27-26DEC01 vs Next US-Iran senior diplomatic meeting by November; 1c/$10 KXUSAIRANAGREEMENT-27-26DEC vs US-Iran Final Nuclear Deal by November 30, 2026?; -1.8c/$10 KXFEDDECISION-26DEC-H0 vs Will there be no change in Fed interest rates afte. Scanned pairs are candidates: a human confirms one into config before a spec can name it.
- Polymarket tightest UTC hours: 9h 92%, 10h 92%, 11h 92%; loosest: 1h 82%, 2h 81%.
- Top one-tick candidates: [pm] Will the Democratic Party control the House after  (one-tick 100%, touch 1753915.05, mid 0.999); [pm] Will the Republican Party control the House after  (one-tick 97%, touch 1820960.58, mid 0.001); [ks] Carolina vs Green Bay: Spread — Green Bay wins by  (one-tick 96%, touch 1674796.99, mid 0.99); [pm] Will Josh Stein win the 2028 Democratic presidenti (one-tick 100%, touch 968966.56, mid 0.002); [ks] 2028 Democratic presidential nominee — Elizabeth W (one-tick 100%, touch 946033.81, mid 0.002).
- Hold to resolution (9667 settled markets recorded; buy the favored side with $10 at the first snapshot in a price band, hold to settlement, taker fees in): pm 0.5-0.9 n=1809 win 65% net -26.6c/$10; pm 0.9-0.95 n=809 win 92% net -3.1c/$10; pm 0.95-0.97 n=531 win 96% net -4c/$10; pm 0.97-0.99 n=648 win 98% net -2.4c/$10; pm 0.99-1 n=891 win 99% net -2c/$10; ks 0.5-0.9 n=669 win 70% net -4.9c/$10; ks 0.9-0.95 n=376 win 93% net 5.8c/$10; ks 0.95-0.97 n=252 win 96% net 1.4c/$10; ks 0.97-0.99 n=295 win 98% net -2c/$10; ks 0.99-1 n=247 win 99% net 0.1c/$10. Best net-positive band with n >= 20: ks 0.9-0.95.
- Fees at 50c per contract: PM taker 1c / maker 0c; Kalshi taker 1.75c / maker 0.44c. One-cent maker round trip nets 1c on PM, 0.13c on Kalshi.

| venue | market | one-tick | touch | mid | 24h vol |
|---|---|---|---|---|---|
| pm | Will the Democratic Party control the House after the 2026 M | 100% | 1753915.05 | 0.999 | 11996315.07 |
| pm | Will the Republican Party control the House after the 2026 M | 97% | 1820960.58 | 0.001 | 7837040.74 |
| ks | Carolina vs Green Bay: Spread — Green Bay wins by over 3.5 p | 96% | 1674796.99 | 0.99 | 4557675.97 |
| pm | Will Josh Stein win the 2028 Democratic presidential nominat | 100% | 968966.56 | 0.002 | 70457 |
| ks | 2028 Democratic presidential nominee — Elizabeth Warren | 100% | 946033.81 | 0.002 | 916.02 |
| ks | 2027 Pro Football Champion — Dallas | 100% | 839552.42 | 0.015 | 29978.57 |
| ks | Chicago vs Seattle — Seattle | 100% | 793279.28 | 0.01 | 29421813.39 |
| ks | Jacksonville vs Baltimore: Spread — Jacksonville wins by ove | 100% | 786568.6 | 0.99 | 5281381.52 |
| ks | 2027 Pro Football Champion — New York G | 100% | 736555.23 | 0.015 | 55785.71 |
| ks | Philadelphia vs Washington: Spread — Washington wins by over | 96% | 1256701.78 | 0.985 | 4167766.69 |

| venue | entry price | markets | unsized | win rate | net c per $10 | worst c | median hold h |
|---|---|---|---|---|---|---|---|
| pm | 0.5-0.9 | 1809 | 0 | 65% | -26.6 | -1020 | 2.9 |
| pm | 0.9-0.95 | 809 | 1 | 92% | -3.1 | -998.22 | 1.4 |
| pm | 0.95-0.97 | 531 | 1 | 96% | -4 | -970.2 | 1.4 |
| pm | 0.97-0.99 | 648 | 5 | 98% | -2.4 | -988.47 | 1.2 |
| pm | 0.99-1 | 891 | 82 | 99% | -2 | -997.12 | 1.3 |
| ks | 0.5-0.9 | 669 | 0 | 70% | -4.9 | -1035 | 2.6 |
| ks | 0.9-0.95 | 376 | 0 | 93% | 5.8 | -997 | 1.2 |
| ks | 0.95-0.97 | 252 | 0 | 96% | 1.4 | -963 | 1.2 |
| ks | 0.97-0.99 | 295 | 0 | 98% | -2 | -982 | 0.8 |
| ks | 0.99-1 | 247 | 0 | 99% | 0.1 | -991 | 0.8 |

_Hold to resolution counts only markets that have already settled, so long-dated markets are under-represented; one entry per market (per event on Kalshi)._

| net c per $10 | direction | size ok | Polymarket | Kalshi | mid diff c | PM fee | closes |
|---|---|---|---|---|---|---|---|
| 18 | pm YES + ks NO | true | Next US-Iran senior diplomatic meeting by November 30, 2026? | KXUSIRANMEETING-27-26DEC01 | -4 | 0 | 2026-12-01 |
| 1 | ks YES + pm NO | true | US-Iran Final Nuclear Deal by November 30, 2026? | KXUSAIRANAGREEMENT-27-26DEC | 1.4 | 0 | 2026-12-01 |
| -1.8 | pm YES + ks NO | true | Will there be no change in Fed interest rates after the Dece | KXFEDDECISION-26DEC-H0 (configured) | -0.8 | 0.05 | 2026-12-09 |
| -2.9 | pm YES + ks NO | true | Strait of Hormuz traffic returns to normal by November 30? | KXHORMUZNORM-26MAR17-B261201 (configured) | -0.5 | 0 | 2026-12-01 |
| -3.8 | pm YES + ks NO | false | Will the Fed decrease interest rates by 25 bps after the Dec | KXFEDDECISION-26DEC-C25 (configured) | -0.1 | 0.05 | 2026-12-09 |
| -11.6 | ks YES + pm NO | true | Pete Hegseth out as Secretary of Defense by November 30? | KXHEGSETHOUT-
…(evidence truncated)

## Witness
- session commit: `ab5a4517c84c4ea781a1b39092c7dbc277e486ea`
- report sha256: `f8841f80120012e0b37f8433eb2a8b84501d2d2a466026cfb49b0f67ee93961a`
- witness: `606f6a2b763a4452b0224b21d485a454eb8a76811b097a0d107229d3d21593da`
