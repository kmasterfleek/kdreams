# lead-lag — kdreams nightly research (2026-11-13)

> kdreams nightly (GitHub Actions, observe-only research). Model: openai/gpt-6-sol via OpenAI (7788 tokens, $0.02308).
> Nothing here placed an order. Tonight's hypothesis is INCONCLUSIVE by construction: it is
> frozen at 2026-11-13T16:45Z and is only graded on snapshots recorded after that.

## Frozen hypotheses graded tonight

| H | spec | post-freeze ticks | value | n | grade | by | note |
|---|---|---|---|---|---|---|---|
| 2026-11-12 | maker.netCentsPerAttempt > 0 (venue pm, UTC 9h-12h, n>=300) | 98 | -0.725 | 1140 | REFUTED | code | maker.netCentsPerAttempt = -0.725 vs > 0 on n=1140 |
| 2026-11-09 | resolution.netCentsPer10 > 1 (venue ks, entry 0.9..0.95, n>=100) | 366 | -3.3 | 76 | INCONCLUSIVE | code | resolution.netCentsPer10 = -3.3 on n=76, below the n>=100 needed |

## Tonight's spec (frozen at 2026-11-13T16:45Z)

- pair.bothSidesFracNetPositive > 0.1 (pair fed-2026-12-hold, n>=100)
- pre-freeze value: 0.061 on n=1612; graded on post-freeze data once it has 48 ticks and n >= 100

## Observations
- The configured Fed hold pair moved simultaneously at the sampled cadence (lag 0, r=0.699); the median snapshot gap is 15 minutes. A faster lead cannot be resolved from these snapshots.
- Its mean absolute mid-price difference was 1.11c, yet only 6% of buy-both-sides checks were net positive after taker fees. A mid-price gap is not itself an executable edge.
- A prior post-freeze test found 21.3% net-positive checks on 202 aligned observations for this pair, above its earlier 6% baseline. That measures available quotes, not realized fills or profit.

## Hypothesis
Given the configured Fed December hold pair, when checking the two quoted sides for a buy-both-sides opportunity without placing an order, then pair.bothSidesFracNetPositive should be > 0.1 vs the 6% pre-freeze baseline, subject to both taker fees being included.

## Hypothesis spec
```json
{"metric":"pair.bothSidesFracNetPositive","pair":"fed-2026-12-hold","op":">","threshold":0.1,"minN":100}
```

## Next observation
Over the next 7 days, record aligned touch quotes and compute the fee-inclusive buy-both-sides check, while separately logging quote age and available touch size.

## Pair candidates
KXUFCFIGHT-26NOV14GANHOK <-> 0xc8cfc009e5ef7798f16727 — Josh Hokit to win the same UFC fight; mids 0.335 and 0.345, respectively.

## Evidence (recorded top-of-book, observe-only)

- Coverage: 249484 rows, 1220 ticks, 3238 Polymarket + 2123 Kalshi markets, 2026-10-31T00:00Z .. 2026-11-13T16:45Z (14 day files); median gap between ticks 15 min.
- Polymarket spread: median 1c (p25 0.1, p75 1), one-tick 90% of 106363 two-sided rows; touch median bid 3660.18 / ask 3308.53.
- Polymarket maker proxy (60-minute horizon): 92954 attempts (2226 unobservable: no later snapshot inside the horizon), fill 22%, round-trip 18%, net -105377.15c total = -1.134c/attempt (gross 3553, fees 0, mark -108930.15).
- Kalshi spread: median 1c (p25 0.3, p75 1), one-tick 92% of 88811 two-sided rows; touch median bid 10898 / ask 24228.14.
- Kalshi maker proxy (60-minute horizon): 80573 attempts (1343 unobservable: no later snapshot inside the horizon), fill 18%, round-trip 17%, net -73017.5c total = -0.906c/attempt (gross 2429, fees 3963.6, mark -71483).
- Pair house-2026-republican (CONTROLH-2026-R vs 0x4e4f77e7) SETTLED 2026-11-04T09:57Z, no new data can arrive: n=394, mean |diff| 0.91c, max 1.85c, >2c 0%; both-sides net-positive 17% (max 0.82c); leads: simultaneous (lag 0, r=0.623).
- Pair house-2026-democratic (CONTROLH-2026-D vs 0xd5d9fc47) SETTLED 2026-11-04T13:06Z, no new data can arrive: n=405, mean |diff| 0.83c, max 1.75c, >2c 0%; both-sides net-positive 14% (max 0.92c); leads: simultaneous (lag 0, r=0.644).
- Pair fed-2026-12-hike25 (KXFEDDECISION-26DEC-H25 vs 0x8a419661): n=806, mean |diff| 0.68c, max 3c, >2c 18%; both-sides net-positive 3% (max 0.72c); leads: simultaneous (lag 0, r=0.758).
- Pair fed-2026-12-hold (KXFEDDECISION-26DEC-H0 vs 0x723822eb): n=806, mean |diff| 1.11c, max 3.5c, >2c 14%; both-sides net-positive 6% (max 0.9c); leads: simultaneous (lag 0, r=0.699).
- Pair fed-2026-12-cut25 (KXFEDDECISION-26DEC-C25 vs 0xf17ad24e): n=331, mean |diff| 0.62c, max 1.05c, >2c 0%; both-sides net-positive 2% (max 0.41c); leads: simultaneous (lag 0, r=-0.001).
- Pair hormuz-2026-11-normal (KXHORMUZNORM-26MAR17-B261201 vs 0xd64b917e): n=351, mean |diff| 0.31c, max 1.45c, >2c 0%; both-sides net-positive 3% (max 0.7c); leads: kalshi (lag -3, r=0.003).
- Pair scanner (2026-11-13T06:00Z): 8 same-event pairs among 287 Polymarket + 1091 Kalshi non-sports markets closing within 42 days, 4 not yet configured; 3 netted >= 1c per $10 buying both sides at scan time. Closest: 6c/$10 KXFEDDECISION-26DEC-H0 vs Will there be no change in Fed interest rates afte; 5.7c/$10 KXFEDDECISION-26DEC-H25 vs Will the Fed increase interest rates by 25 bps aft; 4c/$10 KXUSIRANMEETING-27-26DEC01 vs Next US-Iran senior diplomatic meeting by November. Scanned pairs are candidates: a human confirms one into config before a spec can name it.
- Polymarket tightest UTC hours: 9h 93%, 11h 92%, 12h 92%; loosest: 1h 84%, 2h 82%.
- Top one-tick candidates: [pm] Will the Democratic Party control the House after  (one-tick 100%, touch 1575249.78, mid 0.999); [pm] Will the Republican Party control the House after  (one-tick 100%, touch 1497075.39, mid 0.001); [ks] 2028 Democratic presidential nominee — Elizabeth W (one-tick 100%, touch 946033.81, mid 0.002); [ks] 2027 Pro Football Champion — Dallas (one-tick 100%, touch 839552.42, mid 0.015); [ks] Chicago vs Seattle — Seattle (one-tick 100%, touch 793279.28, mid 0.01).
- Hold to resolution (10264 settled markets recorded; buy the favored side with $10 at the first snapshot in a price band, hold to settlement, taker fees in): pm 0.5-0.9 n=1807 win 66% net -13.7c/$10; pm 0.9-0.95 n=801 win 92% net -5.3c/$10; pm 0.95-0.97 n=519 win 96% net -3.1c/$10; pm 0.97-0.99 n=612 win 97% net -5.2c/$10; pm 0.99-1 n=860 win 100% net 2.3c/$10; ks 0.5-0.9 n=679 win 69% net -16.9c/$10; ks 0.9-0.95 n=373 win 94% net 10.9c/$10; ks 0.95-0.97 n=249 win 96% net -3.1c/$10; ks 0.97-0.99 n=290 win 98% net 4.6c/$10; ks 0.99-1 n=250 win 99% net 0.1c/$10. Best net-positive band with n >= 20: ks 0.9-0.95.
- Fees at 50c per contract: PM taker 1c / maker 0c; Kalshi taker 1.75c / maker 0.44c. One-cent maker round trip nets 1c on PM, 0.13c on Kalshi.

| venue | market | one-tick | touch | mid | 24h vol |
|---|---|---|---|---|---|
| pm | Will the Democratic Party control the House after the 2026 M | 100% | 1575249.78 | 0.999 | 11996315.07 |
| pm | Will the Republican Party control the House after the 2026 M | 100% | 1497075.39 | 0.001 | 7837040.74 |
| ks | 2028 Democratic presidential nominee — Elizabeth Warren | 100% | 946033.81 | 0.002 | 916.02 |
| ks | 2027 Pro Football Champion — Dallas | 100% | 839552.42 | 0.015 | 29978.57 |
| ks | Chicago vs Seattle — Seattle | 100% | 793279.28 | 0.01 | 29421813.39 |
| ks | Jacksonville vs Baltimore: Spread — Jacksonville wins by ove | 100% | 786568.6 | 0.99 | 5281381.52 |
| ks | 2027 Pro Football Champion — New York G | 100% | 783146.53 | 0.015 | 487210.03 |
| ks | MVP Winner? — Kirk Cousins | 100% | 779561.07 | 0.015 | 36922.89 |
| pm | Will Josh Stein win the 2028 Democratic presidential nominat | 100% | 744809.38 | 0.002 | 72758.45 |
| ks | Philadelphia vs Washington: Spread — Washington wins by over | 96% | 1256701.78 | 0.985 | 4167766.69 |

| venue | entry price | markets | unsized | win rate | net c per $10 | worst c | median hold h |
|---|---|---|---|---|---|---|---|
| pm | 0.5-0.9 | 1807 | 0 | 66% | -13.7 | -1020 | 2.8 |
| pm | 0.9-0.95 | 801 | 1 | 92% | -5.3 | -998.22 | 1.4 |
| pm | 0.95-0.97 | 519 | 2 | 96% | -3.1 | -970.2 | 1.4 |
| pm | 0.97-0.99 | 612 | 3 | 97% | -5.2 | -988.47 | 1.2 |
| pm | 0.99-1 | 860 | 85 | 100% | 2.3 | -997.12 | 1.2 |
| ks | 0.5-0.9 | 679 | 0 | 69% | -16.9 | -1035 | 2.6 |
| ks | 0.9-0.95 | 373 | 0 | 94% | 10.9 | -997 | 1.3 |
| ks | 0.95-0.97 | 249 | 0 | 96% | -3.1 | -963 | 1.2 |
| ks | 0.97-0.99 | 290 | 0 | 98% | 4.6 | -982 | 0.8 |
| ks | 0.99-1 | 250 | 0 | 99% | 0.1 | -991 | 0.8 |

_Hold to resolution counts only markets that have already settled, so long-dated markets are under-represented; one entry per market (per event on Kalshi)._

| net c per $10 | direction | size ok | Polymarket | Kalshi | mid diff c | PM fee | closes |
|---|---|---|---|---|---|---|---|
| 6 | pm YES + ks NO | true | Will there be no change in Fed interest rates after the Dece | KXFEDDECISION-26DEC-H0 (configured) | -1.6 | 0.05 | 2026-12-09 |
| 5.7 | ks YES + pm NO | true | Will the Fed increase interest rates by 25 bps after the Dec | KXFEDDECISION-26DEC-H25 (configured) | 3 | 0.05 | 2026-12-09 |
| 4 | ks YES + pm NO | true | Next US-Iran senior diplomatic meeting by November 30, 2026? | KXUSIRANMEETING-27-26DEC01 | 2 | 0 | 2026-12-01 |
| -1.9 | pm YES + ks NO | true | US-Iran Final Nuclear Deal by November 30, 2026? | KXUSAIRANAGREEMENT-27-26DEC | -0.5 | 0 | 2026-12-01 |
| -1.9 | pm YES + ks NO | false | Will the highest temperature in New York City be between 46- | KXHIGHCHI-26NOV12-B46.5 | -0.3 | 0.05 | 2026-11-13 |
| -5.5 | pm YES + ks NO | true | Strait of Hormuz traffic returns to normal by November 30? | KXHORMUZNORM-26MAR17-B261201 (configured) | -0.1 | 0 | 2026-12-01 |
| -5.7 | pm YES 
…(evidence truncated)

## Witness
- session commit: `17ae2f66a885e6e6b9539d4af2310807fee8c685`
- report sha256: `5e25bf19fdaae184783b9d6ca21192c53fa295740a098ce8e3b2e565e9787773`
- witness: `215aafa1e6c39d1897bbfe1da06d092bce2205ef41d4f7d6eb64dc2744617ff8`
