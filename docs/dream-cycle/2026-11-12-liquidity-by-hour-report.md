# liquidity-by-hour — kdreams nightly research (2026-11-12)

> kdreams nightly (GitHub Actions, observe-only research). Model: openai/gpt-6-sol via OpenAI (7795 tokens, $0.02312).
> Nothing here placed an order. Tonight's hypothesis is INCONCLUSIVE by construction: it is
> frozen at 2026-11-12T17:00Z and is only graded on snapshots recorded after that.

## Frozen hypotheses graded tonight

| H | spec | post-freeze ticks | value | n | grade | by | note |
|---|---|---|---|---|---|---|---|
| 2026-11-11 | pair.bothSidesFracNetPositive > 0.02 (pair fed-2026-12-hold, n>=100) | 101 | 0.213 | 202 | SUPPORTED | code | pair.bothSidesFracNetPositive = 0.213 vs > 0.02 on n=202 |
| 2026-11-09 | resolution.netCentsPer10 > 1 (venue ks, entry 0.9..0.95, n>=100) | 268 | -1.3 | 53 | INCONCLUSIVE | code | resolution.netCentsPer10 = -1.3 on n=53, below the n>=100 needed |

## Tonight's spec (frozen at 2026-11-12T17:00Z)

- maker.netCentsPerAttempt > 0 (venue pm, UTC 9h-12h, n>=300)
- pre-freeze value: -0.542 on n=12796; graded on post-freeze data once it has 48 ticks and n >= 300

## Observations
- Polymarket’s tightest UTC hours are 9h, 10h, and 11h: each has a 92% one-tick share. Its loosest reported hours are 1h at 83% and 2h at 81%.
- A tight quote is not evidence of profitable liquidity provision: the Polymarket maker proxy nets −1.155c per attempt overall.
- Top-of-book liquidity needs filtering: the catalog includes Kalshi markets with a 100c spread despite high reported volume.

## Hypothesis
Given two-sided Polymarket markets observed from 9h to before 12h UTC, when simulating a one-tick maker entry with the recorded 60-minute exit rule, then maker.netCentsPerAttempt should be > 0c vs the overall −1.155c per attempt, subject to the recorded mark-to-market and maker-fee accounting. The 92% one-tick share motivates the test; it does not establish an edge.

## Hypothesis spec
```json
{"metric":"maker.netCentsPerAttempt","venue":"pm","slice":{"hoursUtc":[9,12]},"op":">","threshold":0,"minN":300}
```

## Next observation
Over the next 7 days, record post-freeze maker-proxy attempts by entry hour and compute net cents per attempt for the specified slice, including unobservable exits and marks; do not trade.

## Pair candidates
KXUEFANLGAME-26NOV12ITAF <-> 0xc4632bf9 — France to win the Italy–France match on both venues.  
KXUEFANLGAME-26NOV12TURB <-> 0x652584ab — Belgium to win the Türkiye–Belgium match on both venues.

## Evidence (recorded top-of-book, observe-only)

- Coverage: 246984 rows, 1214 ticks, 3235 Polymarket + 2114 Kalshi markets, 2026-10-30T00:00Z .. 2026-11-12T17:00Z (14 day files); median gap between ticks 15 min.
- Polymarket spread: median 1c (p25 0.1, p75 1), one-tick 89% of 105083 two-sided rows; touch median bid 3683.83 / ask 3391.59.
- Polymarket maker proxy (60-minute horizon): 91316 attempts (2296 unobservable: no later snapshot inside the horizon), fill 22%, round-trip 17%, net -105476.1c total = -1.155c/attempt (gross 3426, fees 0, mark -108902.1).
- Kalshi spread: median 1c (p25 0.4, p75 1), one-tick 92% of 87762 two-sided rows; touch median bid 10662.37 / ask 25608.76.
- Kalshi maker proxy (60-minute horizon): 79679 attempts (1408 unobservable: no later snapshot inside the horizon), fill 18%, round-trip 17%, net -76076.74c total = -0.955c/attempt (gross 2349, fees 3959.37, mark -74466.5).
- Pair house-2026-republican (CONTROLH-2026-R vs 0x4e4f77e7) SETTLED 2026-11-04T09:57Z, no new data can arrive: n=486, mean |diff| 0.95c, max 2.15c, >2c 1%; both-sides net-positive 18% (max 0.82c); leads: simultaneous (lag 0, r=0.456).
- Pair house-2026-democratic (CONTROLH-2026-D vs 0xd5d9fc47) SETTLED 2026-11-04T13:06Z, no new data can arrive: n=497, mean |diff| 0.88c, max 1.95c, >2c 0%; both-sides net-positive 16% (max 0.92c); leads: simultaneous (lag 0, r=0.584).
- Pair fed-2026-12-hike25 (KXFEDDECISION-26DEC-H25 vs 0x8a419661): n=708, mean |diff| 0.59c, max 3c, >2c 13%; both-sides net-positive 2% (max 0.02c); leads: simultaneous (lag 0, r=0.776).
- Pair fed-2026-12-hold (KXFEDDECISION-26DEC-H0 vs 0x723822eb): n=708, mean |diff| 1.14c, max 3.5c, >2c 16%; both-sides net-positive 4% (max 0.9c); leads: simultaneous (lag 0, r=0.71).
- Pair fed-2026-12-cut25 (KXFEDDECISION-26DEC-C25 vs 0xf17ad24e): n=233, mean |diff| 0.65c, max 1.05c, >2c 0%; both-sides net-positive 3% (max 0.41c); leads: simultaneous (lag 0, r=-0.006).
- Pair hormuz-2026-11-normal (KXHORMUZNORM-26MAR17-B261201 vs 0xd64b917e): n=253, mean |diff| 0.35c, max 1.45c, >2c 0%; both-sides net-positive 4% (max 0.7c); leads: kalshi (lag -3, r=0.001).
- Pair scanner (2026-11-12T06:00Z): 8 same-event pairs among 237 Polymarket + 1047 Kalshi non-sports markets closing within 42 days, 4 not yet configured; 1 netted >= 1c per $10 buying both sides at scan time. Closest: 12.1c/$10 KXHEGSETHOUT-26AUG-26DEC01 vs Pete Hegseth out as Secretary of Defense by Novemb; -3.8c/$10 KXFEDDECISION-26DEC-C25 vs Will the Fed decrease interest rates by 25 bps aft; -3.9c/$10 KXFEDDECISION-26DEC-H0 vs Will there be no change in Fed interest rates afte. Scanned pairs are candidates: a human confirms one into config before a spec can name it.
- Polymarket tightest UTC hours: 9h 92%, 10h 92%, 11h 92%; loosest: 1h 83%, 2h 81%.
- Top one-tick candidates: [pm] Will the Democratic Party control the House after  (one-tick 100%, touch 1797975.46, mid 0.999); [pm] Will the Republican Party control the House after  (one-tick 98%, touch 1670691.31, mid 0.001); [ks] 2028 Democratic presidential nominee — Elizabeth W (one-tick 100%, touch 946033.81, mid 0.002); [ks] 2027 Pro Football Champion — Dallas (one-tick 100%, touch 839552.42, mid 0.015); [ks] Chicago vs Seattle — Seattle (one-tick 100%, touch 793279.28, mid 0.01).
- Hold to resolution (9982 settled markets recorded; buy the favored side with $10 at the first snapshot in a price band, hold to settlement, taker fees in): pm 0.5-0.9 n=1796 win 65% net -22.6c/$10; pm 0.9-0.95 n=794 win 92% net -4.5c/$10; pm 0.95-0.97 n=529 win 95% net -7.9c/$10; pm 0.97-0.99 n=627 win 97% net -6.2c/$10; pm 0.99-1 n=865 win 100% net 1.2c/$10; ks 0.5-0.9 n=672 win 69% net -27.4c/$10; ks 0.9-0.95 n=369 win 93% net 4.2c/$10; ks 0.95-0.97 n=250 win 96% net 1.1c/$10; ks 0.97-0.99 n=289 win 98% net 1c/$10; ks 0.99-1 n=241 win 99% net -0.2c/$10. Best net-positive band with n >= 20: ks 0.9-0.95.
- Fees at 50c per contract: PM taker 1c / maker 0c; Kalshi taker 1.75c / maker 0.44c. One-cent maker round trip nets 1c on PM, 0.13c on Kalshi.

| venue | market | one-tick | touch | mid | 24h vol |
|---|---|---|---|---|---|
| pm | Will the Democratic Party control the House after the 2026 M | 100% | 1797975.46 | 0.999 | 11996315.07 |
| pm | Will the Republican Party control the House after the 2026 M | 98% | 1670691.31 | 0.001 | 7837040.74 |
| ks | 2028 Democratic presidential nominee — Elizabeth Warren | 100% | 946033.81 | 0.002 | 916.02 |
| ks | 2027 Pro Football Champion — Dallas | 100% | 839552.42 | 0.015 | 29978.57 |
| ks | Chicago vs Seattle — Seattle | 100% | 793279.28 | 0.01 | 29421813.39 |
| ks | Jacksonville vs Baltimore: Spread — Jacksonville wins by ove | 100% | 786568.6 | 0.99 | 5281381.52 |
| ks | MVP Winner? — Kirk Cousins | 100% | 778938.17 | 0.015 | 922686.55 |
| pm | Will Josh Stein win the 2028 Democratic presidential nominat | 100% | 744809.38 | 0.002 | 73024.45 |
| ks | 2027 Pro Football Champion — New York G | 100% | 736555.23 | 0.015 | 55785.71 |
| ks | Philadelphia vs Washington: Spread — Washington wins by over | 96% | 1256701.78 | 0.985 | 4167766.69 |

| venue | entry price | markets | unsized | win rate | net c per $10 | worst c | median hold h |
|---|---|---|---|---|---|---|---|
| pm | 0.5-0.9 | 1796 | 0 | 65% | -22.6 | -1020 | 2.9 |
| pm | 0.9-0.95 | 794 | 1 | 92% | -4.5 | -998.22 | 1.4 |
| pm | 0.95-0.97 | 529 | 1 | 95% | -7.9 | -970.2 | 1.4 |
| pm | 0.97-0.99 | 627 | 3 | 97% | -6.2 | -988.47 | 1.2 |
| pm | 0.99-1 | 865 | 81 | 100% | 1.2 | -997.12 | 1.3 |
| ks | 0.5-0.9 | 672 | 0 | 69% | -27.4 | -1035 | 2.6 |
| ks | 0.9-0.95 | 369 | 0 | 93% | 4.2 | -997 | 1.2 |
| ks | 0.95-0.97 | 250 | 0 | 96% | 1.1 | -963 | 1.2 |
| ks | 0.97-0.99 | 289 | 0 | 98% | 1 | -982 | 0.8 |
| ks | 0.99-1 | 241 | 0 | 99% | -0.2 | -991 | 0.7 |

_Hold to resolution counts only markets that have already settled, so long-dated markets are under-represented; one entry per market (per event on Kalshi)._

| net c per $10 | direction | size ok | Polymarket | Kalshi | mid diff c | PM fee | closes |
|---|---|---|---|---|---|---|---|
| 12.1 | pm YES + ks NO | true | Pete Hegseth out as Secretary of Defense by November 30? | KXHEGSETHOUT-26AUG-26DEC01 | -2.5 | 0.04 | 2026-12-01 |
| -3.8 | pm YES + ks NO | false | Will the Fed decrease interest rates by 25 bps after the Dec | KXFEDDECISION-26DEC-C25 (configured) | -0.1 | 0.05 | 2026-12-09 |
| -3.9 | pm YES + ks NO | true | Will there be no change in Fed interest rates after the Dece | KXFEDDECISION-26DEC-H0 (configured) | -0.8 | 0.05 | 2026-12-09 |
| -5.6 | ks YES + pm NO | true | Strait of Hormuz traffic returns to normal by November 30? | KXHORMUZNORM-26MAR17-B261201 (configured) | 0.2 | 0 | 2026-12-01 |
| -9.1 | pm YES + ks NO | true | US-Iran Final Nuclear Deal by November 30, 2026? | KXUSAIRANAGREEMENT-27-26DEC | -0.2 | 0 | 2026-12-01 |
| -10 | ks YES + pm NO | true | Will Trump speak to Elon Musk by November 30? | KXTRUMPMEETM-26DEC01-EMUS | 0 | 0 | 2026-12-01 |
| -10 | ks YES + pm NO 
…(evidence truncated)

## Witness
- session commit: `bc672fba2b78301fc8732ce1982eea3ae5c2669e`
- report sha256: `8b9e00295882c14f47fd7a5cf881d0a4ac40898688ca522762471f0c9f8f22d6`
- witness: `1616c7065ab2d50d0cc7e63dc042bb229088f7cf6aaad95bdcec79ca57856144`
