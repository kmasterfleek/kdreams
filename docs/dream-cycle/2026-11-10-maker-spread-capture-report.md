# maker-spread-capture — kdreams nightly research (2026-11-10)

> kdreams nightly (GitHub Actions, observe-only research). Model: openai/gpt-6-sol via OpenAI (7934 tokens, $0.02492).
> Nothing here placed an order. Tonight's hypothesis is INCONCLUSIVE by construction: it is
> frozen at 2026-11-10T16:30Z and is only graded on snapshots recorded after that.

## Frozen hypotheses graded tonight

| H | spec | post-freeze ticks | value | n | grade | by | note |
|---|---|---|---|---|---|---|---|
| 2026-11-03 | pair.bothSidesFracNetPositive > 0.12 (pair house-2026-democratic, n>=300) | n/a | 0.141 | 156 | EXPIRED | rule | pair house-2026-democratic settled at 2026-11-04T13:06Z with n=156 post-freeze, below the n>=300 needed |
| 2026-11-06 | pair.bothSidesFracNetPositive > 0.1 (pair house-2026-republican, n>=300) | n/a | n/a | 0 | EXPIRED | rule | pair house-2026-republican settled at 2026-11-04T09:57Z with n=0 post-freeze, below the n>=300 needed |
| 2026-11-08 | pair.bothSidesFracNetPositive > 0.1 (pair house-2026-republican, n>=300) | n/a | n/a | 0 | EXPIRED | rule | pair house-2026-republican settled at 2026-11-04T09:57Z with n=0 post-freeze, below the n>=300 needed |
| 2026-11-09 | resolution.netCentsPer10 > 1 (venue ks, entry 0.9..0.95, n>=100) | 69 | 81.7 | 17 | INCONCLUSIVE | code | resolution.netCentsPer10 = 81.7 on n=17, below the n>=100 needed |

## Tonight's spec (frozen at 2026-11-10T16:30Z)

- maker.netCentsPerAttempt > 1 (venue pm, mid 0.7..0.9, n>=300)
- pre-freeze value: -1.884 on n=8123; graded on post-freeze data once it has 48 ticks and n >= 300

## Observations
- One-tick spreads dominate two-sided books: **89%** of Polymarket rows and **93%** of Kalshi rows. A visible spread is not, by itself, evidence of capturable profit.
- Over a 60-minute horizon, maker proxies netted **−1.214c/attempt** on Polymarket and **−0.98c/attempt** on Kalshi; fill rates were **21%** and **18%**, respectively.
- At a 50c contract price, a one-cent maker round trip nets **1c** on Polymarket versus **0.13c** on Kalshi before accounting for unsuccessful attempts and adverse marks.

## Hypothesis
Given Polymarket markets with entry midpoints from 0.7 to below 0.9, when simulating a one-tick maker spread capture, then maker.netCentsPerAttempt should be > 1c vs the recorded Polymarket baseline of −1.214c/attempt, subject to including unfilled attempts and adverse marks.

## Hypothesis spec
```json
{"metric":"maker.netCentsPerAttempt","venue":"pm","slice":{"midMin":0.7,"midMax":0.9},"op":">","threshold":1,"minN":300}
```

## Next observation
Record the next 7 days of eligible maker-proxy attempts, including fills, exits, and marks, and separately check whether any positive result survives sizing to about $10 and applicable per-order fees; place no orders.

## Pair candidates
KXATPMATCH-26NOV09RINKEC <-> 0xe5a75de9 — Arthur Rinderknech wins the Rinderknech–Kecmanovic match on both venues; recorded mids are both 0.645.

## Evidence (recorded top-of-book, observe-only)

- Coverage: 243695 rows, 1207 ticks, 3218 Polymarket + 2077 Kalshi markets, 2026-10-28T00:00Z .. 2026-11-10T16:30Z (14 day files); median gap between ticks 15 min.
- Polymarket spread: median 1c (p25 0.1, p75 1), one-tick 89% of 103612 two-sided rows; touch median bid 4106.97 / ask 3724.78.
- Polymarket maker proxy (60-minute horizon): 89602 attempts (2259 unobservable: no later snapshot inside the horizon), fill 21%, round-trip 18%, net -108742.65c total = -1.214c/attempt (gross 3381, fees 0, mark -112123.65).
- Kalshi spread: median 1c (p25 0.4, p75 1), one-tick 93% of 87353 two-sided rows; touch median bid 11296.17 / ask 28382.33.
- Kalshi maker proxy (60-minute horizon): 79463 attempts (1413 unobservable: no later snapshot inside the horizon), fill 18%, round-trip 16%, net -77875.34c total = -0.98c/attempt (gross 2284, fees 3958.06, mark -76201.4).
- Pair house-2026-republican (CONTROLH-2026-R vs 0x4e4f77e7) SETTLED 2026-11-04T09:57Z, no new data can arrive: n=678, mean |diff| 1.04c, max 2.5c, >2c 2%; both-sides net-positive 19% (max 1.07c); leads: simultaneous (lag 0, r=0.342).
- Pair house-2026-democratic (CONTROLH-2026-D vs 0xd5d9fc47) SETTLED 2026-11-04T13:06Z, no new data can arrive: n=689, mean |diff| 0.94c, max 2.35c, >2c 1%; both-sides net-positive 15% (max 0.98c); leads: simultaneous (lag 0, r=0.45).
- Pair fed-2026-12-hike25 (KXFEDDECISION-26DEC-H25 vs 0x8a419661): n=560, mean |diff| 0.65c, max 3c, >2c 18%; both-sides net-positive 3% (max 0.02c); leads: simultaneous (lag 0, r=0.769).
- Pair fed-2026-12-hold (KXFEDDECISION-26DEC-H0 vs 0x723822eb): n=560, mean |diff| 1.24c, max 3.5c, >2c 21%; both-sides net-positive 1% (max 0.28c); leads: simultaneous (lag 0, r=0.691).
- Pair fed-2026-12-cut25 (KXFEDDECISION-26DEC-C25 vs 0xf17ad24e): n=34, mean |diff| 0.71c, max 1.05c, >2c 0%; both-sides net-positive 19% (max 0.41c); leads: kalshi (lag -1, r=-0.032).
- Pair hormuz-2026-11-normal (KXHORMUZNORM-26MAR17-B261201 vs 0xd64b917e): n=54, mean |diff| 0.58c, max 1.45c, >2c 0%; both-sides net-positive 10% (max 0.7c); leads: simultaneous (lag 0, r=-0.013).
- Pair scanner (2026-11-10T06:00Z): 7 same-event pairs among 242 Polymarket + 1095 Kalshi non-sports markets closing within 42 days, 3 not yet configured; 1 netted >= 1c per $10 buying both sides at scan time. Closest: 10.8c/$10 KXHEGSETHOUT-26AUG-26DEC01 vs Pete Hegseth out as Secretary of Defense by Novemb; -3.8c/$10 KXHORMUZNORM-26MAR17-B261201 vs Strait of Hormuz traffic returns to normal by Nove; -7.6c/$10 KXFEDDECISION-26DEC-C25 vs Will the Fed decrease interest rates by 25 bps aft. Scanned pairs are candidates: a human confirms one into config before a spec can name it.
- Polymarket tightest UTC hours: 12h 92%, 9h 92%, 10h 92%; loosest: 2h 82%, 1h 81%.
- Top one-tick candidates: [pm] Will the Democratic Party control the House after  (one-tick 100%, touch 1641308.09, mid 0.999); [pm] Will the Republican Party control the House after  (one-tick 98%, touch 1731432.32, mid 0.001); [ks] Carolina vs Green Bay: Spread — Green Bay wins by  (one-tick 96%, touch 1674796.99, mid 0.99); [pm] Will Josh Stein win the 2028 Democratic presidenti (one-tick 100%, touch 968966.56, mid 0.002); [ks] 2028 Democratic presidential nominee — Elizabeth W (one-tick 100%, touch 946033.81, mid 0.002).
- Hold to resolution (9367 settled markets recorded; buy the favored side with $10 at the first snapshot in a price band, hold to settlement, taker fees in): pm 0.5-0.9 n=1799 win 65% net -25.6c/$10; pm 0.9-0.95 n=801 win 92% net 1.2c/$10; pm 0.95-0.97 n=531 win 96% net -0.2c/$10; pm 0.97-0.99 n=644 win 98% net -2.5c/$10; pm 0.99-1 n=889 win 99% net -2c/$10; ks 0.5-0.9 n=678 win 71% net 16c/$10; ks 0.9-0.95 n=383 win 94% net 13.3c/$10; ks 0.95-0.97 n=257 win 96% net -1.6c/$10; ks 0.97-0.99 n=302 win 98% net -1.2c/$10; ks 0.99-1 n=253 win 99% net 0.3c/$10. Best net-positive band with n >= 20: ks 0.5-0.9.
- Fees at 50c per contract: PM taker 1c / maker 0c; Kalshi taker 1.75c / maker 0.44c. One-cent maker round trip nets 1c on PM, 0.13c on Kalshi.

| venue | market | one-tick | touch | mid | 24h vol |
|---|---|---|---|---|---|
| pm | Will the Democratic Party control the House after the 2026 M | 100% | 1641308.09 | 0.999 | 11996315.07 |
| pm | Will the Republican Party control the House after the 2026 M | 98% | 1731432.32 | 0.001 | 7837040.74 |
| ks | Carolina vs Green Bay: Spread — Green Bay wins by over 3.5 p | 96% | 1674796.99 | 0.99 | 4557675.97 |
| pm | Will Josh Stein win the 2028 Democratic presidential nominat | 100% | 968966.56 | 0.002 | 70457 |
| ks | 2028 Democratic presidential nominee — Elizabeth Warren | 100% | 946033.81 | 0.002 | 467808.01 |
| ks | 2027 Pro Football Champion — Dallas | 100% | 839552.42 | 0.015 | 29978.57 |
| pm | Will Mitch Landrieu win the 2028 Democratic presidential nom | 100% | 827464.86 | 0.002 | 70306 |
| ks | Chicago vs Seattle — Seattle | 100% | 793279.28 | 0.01 | 29421813.39 |
| ks | Jacksonville vs Baltimore: Spread — Jacksonville wins by ove | 100% | 786568.6 | 0.99 | 5281381.52 |
| ks | 2027 Pro Football Champion — New York G | 100% | 736555.23 | 0.015 | 55785.71 |

| venue | entry price | markets | unsized | win rate | net c per $10 | worst c | median hold h |
|---|---|---|---|---|---|---|---|
| pm | 0.5-0.9 | 1799 | 0 | 65% | -25.6 | -1020 | 2.9 |
| pm | 0.9-0.95 | 801 | 2 | 92% | 1.2 | -998.22 | 1.4 |
| pm | 0.95-0.97 | 531 | 1 | 96% | -0.2 | -970.2 | 1.4 |
| pm | 0.97-0.99 | 644 | 4 | 98% | -2.5 | -988.47 | 1.1 |
| pm | 0.99-1 | 889 | 81 | 99% | -2 | -997.12 | 1.2 |
| ks | 0.5-0.9 | 678 | 0 | 71% | 16 | -1035 | 2.7 |
| ks | 0.9-0.95 | 383 | 0 | 94% | 13.3 | -997 | 1.2 |
| ks | 0.95-0.97 | 257 | 0 | 96% | -1.6 | -963 | 1.2 |
| ks | 0.97-0.99 | 302 | 0 | 98% | -1.2 | -982 | 0.8 |
| ks | 0.99-1 | 253 | 0 | 99% | 0.3 | -991 | 0.8 |

_Hold to resolution counts only markets that have already settled, so long-dated markets are under-represented; one entry per market (per event on Kalshi)._

| net c per $10 | direction | size ok | Polymarket | Kalshi | mid diff c | PM fee | closes |
|---|---|---|---|---|---|---|---|
| 10.8 | pm YES + ks NO | true | Pete Hegseth out as Secretary of Defense by November 30? | KXHEGSETHOUT-26AUG-26DEC01 | -4 | 0.04 | 2026-12-01 |
| -3.8 | pm YES + ks NO | true | Strait of Hormuz traffic returns to normal by November 30? | KXHORMUZNORM-26MAR17-B261201 (configured) | -0.4 | 0 | 2026-12-01 |
| -7.6 | pm YES + ks NO | false | Will the Fed decrease interest rates by 25 bps after the Dec | KXFEDDECISION-26DEC-C25 (configured) | -0.3 | 0.05 | 2026-12-09 |
| -13.8 | pm YES + ks NO | true | US-Iran Final Nuclear Deal by November 30, 2026? | KXUSAIRANAGREEMENT-27-26DEC | -0.2 | 0 | 2026-12-01 |
| -18.7 | pm YES + ks NO | true | Will there be no change in Fed interest rates after the Dece | KXFEDDECISION-26DEC-H0 (configured) | -1 | 0.05 | 2026-12-09 |
| -20 | pm YES + ks NO | true | Will the Fed increase interest rates by 25 bps after
…(evidence truncated)

## Witness
- session commit: `5420f42c3e5b62d6d419b95fc24ba12773fd9dda`
- report sha256: `9866a465d6c350b00895620ac2def06ac74bb5b2a5ef8709cb84ed03cb0e3b96`
- witness: `0ba0ac31378a59ceaf91b9e0ac3e32a89ff2c7fdea67ee9211cd038ff8c43574`
