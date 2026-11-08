# lead-lag — kdreams nightly research (2026-11-08)

> kdreams nightly (GitHub Actions, observe-only research). Model: openai/gpt-6-sol via OpenAI (6836 tokens, $0.02113).
> Nothing here placed an order. Tonight's hypothesis is INCONCLUSIVE by construction: it is
> frozen at 2026-11-08T15:30Z and is only graded on snapshots recorded after that.

## Frozen hypotheses graded tonight

| H | spec | post-freeze ticks | value | n | grade | by | note |
|---|---|---|---|---|---|---|---|
| 2026-11-07 | maker.netCentsPerAttempt > 0 (venue pm, UTC 12h-13h, n>=300) | 96 | -2.687 | 308 | REFUTED | code | maker.netCentsPerAttempt = -2.687 vs > 0 on n=308 |
| 2026-11-06 | pair.bothSidesFracNetPositive > 0.1 (pair house-2026-republican, n>=300) | 183 | n/a | 0 | INCONCLUSIVE | code | pair.bothSidesFracNetPositive not measurable on post-freeze data (n=0) |
| 2026-11-03 | pair.bothSidesFracNetPositive > 0.12 (pair house-2026-democratic, n>=300) | 432 | 0.141 | 156 | INCONCLUSIVE | code | pair.bothSidesFracNetPositive = 0.141 on n=156, below the n>=300 needed |

## Tonight's spec (frozen at 2026-11-08T15:30Z)

- pair.bothSidesFracNetPositive > 0.1 (pair house-2026-republican, n>=300)
- pre-freeze value: 0.16 on n=1736; graded on post-freeze data once it has 48 ticks and n >= 300

## Observations
- All configured cross-venue pairs show their strongest recorded co-movement at lag 0; the 15-minute median snapshot gap cannot establish which venue moved first.
- The Republican House pair differs by more than 2c in 4% of 868 aligned snapshots, yet its buy-both-sides check is net-positive in 16% after taker fees.
- The December Fed hold pair differs by more than 2c in 27% of 396 snapshots, but its buy-both-sides check is net-positive in 0%. Mid-price divergence alone is not a fee-adjusted opportunity.

## Hypothesis
Given the configured Republican House pair, when checking both sides at the recorded touches, then pair.bothSidesFracNetPositive should be > 0.1 vs the recorded 0.16, subject to taker fees and per-order rounding; a positive check does not establish executable profit on about $10.

## Hypothesis spec
```json
{"metric":"pair.bothSidesFracNetPositive","pair":"house-2026-republican","op":">","threshold":0.1,"minN":300}
```

## Next observation
Over the next 7 days, record aligned touches and fee-rounded buy-both-sides checks, while collecting faster timestamps to distinguish a genuine lead from movement hidden within the snapshot gap.

## Pair candidates
KXEPLGAME-26NOV08SUNCFC- <-> 0xe7c0c551 — Chelsea win on both; mids 0.12 and 0.105.  
KXATPMATCH-26NOV08SHEALC <-> 0x06293598 — Ben Shelton win on both; mids 0.145 and 0.145.

## Evidence (recorded top-of-book, observe-only)

- Coverage: 248085 rows, 1233 ticks, 3196 Polymarket + 2014 Kalshi markets, 2026-10-26T00:00Z .. 2026-11-08T15:30Z (14 day files); median gap between ticks 15 min.
- Polymarket spread: median 1c (p25 0.1, p75 1), one-tick 89% of 105460 two-sided rows; touch median bid 4752.58 / ask 4151.89.
- Polymarket maker proxy (60-minute horizon): 91821 attempts (2016 unobservable: no later snapshot inside the horizon), fill 22%, round-trip 17%, net -107641.15c total = -1.172c/attempt (gross 3385, fees 0, mark -111026.15).
- Kalshi spread: median 1c (p25 0.4, p75 1), one-tick 93% of 90008 two-sided rows; touch median bid 12547 / ask 31078.8.
- Kalshi maker proxy (60-minute horizon): 82094 attempts (1267 unobservable: no later snapshot inside the horizon), fill 17%, round-trip 15%, net -72022.32c total = -0.877c/attempt (gross 2125, fees 3898.48, mark -70248.95).
- Pair CONTROLH-2026-R vs 0x4e4f77e7: n=868, mean |diff| 1.08c, max 2.5c, >2c 4%; both-sides net-positive 16% (max 1.07c); leads: simultaneous (lag 0, r=0.276).
- Pair CONTROLH-2026-D vs 0xd5d9fc47: n=879, mean |diff| 0.99c, max 2.35c, >2c 3%; both-sides net-positive 13% (max 0.98c); leads: simultaneous (lag 0, r=0.321).
- Pair KXFEDDECISION-26DEC-H25 vs 0x8a419661: n=396, mean |diff| 0.78c, max 3c, >2c 24%; both-sides net-positive 4% (max 0.02c); leads: simultaneous (lag 0, r=0.749).
- Pair KXFEDDECISION-26DEC-H0 vs 0x723822eb: n=396, mean |diff| 1.54c, max 3.5c, >2c 27%; both-sides net-positive 0% (max 0.02c); leads: simultaneous (lag 0, r=0.56).
- Polymarket tightest UTC hours: 16h 94%, 17h 93%, 13h 92%; loosest: 2h 82%, 1h 80%.
- Top one-tick candidates: [ks] Dallas vs Philadelphia: Spread — Dallas wins by ov (one-tick 98%, touch 2044361.54, mid 0.99); [ks] Dallas vs Indianapolis: Spread — Dallas wins by ov (one-tick 100%, touch 1302727.03, mid 0.495); [ks] New York G vs Philadelphia: Spread — New York G wi (one-tick 100%, touch 1107612.28, mid 0.535); [ks] Detroit vs Miami: Spread — Detroit wins by over 6. (one-tick 100%, touch 1095558.77, mid 0.495); [pm] Will the Democratic Party control the House after  (one-tick 98%, touch 1406893.68, mid 0.999).
- Hold to resolution (8507 settled markets recorded; buy the favored side with $10 at the first snapshot in a price band, hold to settlement, taker fees in): pm 0.5-0.9 n=1753 win 64% net -43.7c/$10; pm 0.9-0.95 n=787 win 92% net -3.8c/$10; pm 0.95-0.97 n=527 win 96% net 1.5c/$10; pm 0.97-0.99 n=619 win 98% net 4.8c/$10; pm 0.99-1 n=881 win 99% net -3.1c/$10; ks 0.5-0.9 n=658 win 70% net 3.3c/$10; ks 0.9-0.95 n=358 win 93% net 0.3c/$10; ks 0.95-0.97 n=240 win 95% net -4.7c/$10; ks 0.97-0.99 n=270 win 98% net -0.4c/$10; ks 0.99-1 n=232 win 99% net -4.8c/$10. Best net-positive band with n >= 20: pm 0.97-0.99.
- Fees at 50c per contract: PM taker 1c / maker 0c; Kalshi taker 1.75c / maker 0.44c. One-cent maker round trip nets 1c on PM, 0.13c on Kalshi.

| venue | market | one-tick | touch | mid | 24h vol |
|---|---|---|---|---|---|
| ks | Dallas vs Philadelphia: Spread — Dallas wins by over 4.5 poi | 98% | 2044361.54 | 0.99 | 4562601.05 |
| ks | Dallas vs Indianapolis: Spread — Dallas wins by over 4.5 poi | 100% | 1302727.03 | 0.495 | 174837.13 |
| ks | New York G vs Philadelphia: Spread — New York G wins by over | 100% | 1107612.28 | 0.535 | 218849.26 |
| ks | Detroit vs Miami: Spread — Detroit wins by over 6.5 points | 100% | 1095558.77 | 0.495 | 187283.83 |
| pm | Will the Democratic Party control the House after the 2026 M | 98% | 1406893.68 | 0.999 | 11996315.07 |
| ks | Carolina vs Green Bay: Spread — Green Bay wins by over 3.5 p | 96% | 1674796.99 | 0.99 | 4557675.97 |
| pm | Will Josh Stein win the 2028 Democratic presidential nominat | 100% | 968966.56 | 0.002 | 70457 |
| pm | Will the Fed decrease interest rates by 25 bps after the Oct | 100% | 966927.59 | 0.001 | 4825505.67 |
| ks | 2028 Democratic presidential nominee — Elizabeth Warren | 100% | 946033.81 | 0.002 | 19158.94 |
| ks | 2027 Pro Football Champion — Pittsburgh | 100% | 845903.82 | 0.015 | 94756.18 |

| venue | entry price | markets | unsized | win rate | net c per $10 | worst c | median hold h |
|---|---|---|---|---|---|---|---|
| pm | 0.5-0.9 | 1753 | 0 | 64% | -43.7 | -1020 | 2.9 |
| pm | 0.9-0.95 | 787 | 0 | 92% | -3.8 | -993.96 | 1.5 |
| pm | 0.95-0.97 | 527 | 0 | 96% | 1.5 | -968.28 | 1.4 |
| pm | 0.97-0.99 | 619 | 5 | 98% | 4.8 | -983.67 | 1.1 |
| pm | 0.99-1 | 881 | 85 | 99% | -3.1 | -997.12 | 1.4 |
| ks | 0.5-0.9 | 658 | 0 | 70% | 3.3 | -1035 | 2.5 |
| ks | 0.9-0.95 | 358 | 0 | 93% | 0.3 | -997 | 1.2 |
| ks | 0.95-0.97 | 240 | 0 | 95% | -4.7 | -963 | 1.2 |
| ks | 0.97-0.99 | 270 | 0 | 98% | -0.4 | -982 | 0.9 |
| ks | 0.99-1 | 232 | 0 | 99% | -4.8 | -991 | 0.8 |

_Hold to resolution counts only markets that have already settled, so long-dated markets are under-represented; one entry per market (per event on Kalshi)._

_Maker model is a proxy: a resting order counts as filled only when the recorded price trades through its level; no queue position is modeled._

## Witness
- session commit: `1e6b4660d417cd4d2ef43aafdf3f272de9fc0c40`
- report sha256: `0a24e008b764cffa194d8dab0d11e1c6bdae2d1b268ab466757972bb90d7070b`
- witness: `931816b85e212b05d7fe84d67fcfc2ab3315334916080e1c9d50de604f223b6c`
