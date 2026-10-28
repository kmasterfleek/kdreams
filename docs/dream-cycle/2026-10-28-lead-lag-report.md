# lead-lag — kdreams nightly research (2026-10-28)

> kdreams nightly (GitHub Actions, observe-only research). Model: openai/gpt-6-sol via OpenAI (6964 tokens, $0.02256).
> Nothing here placed an order. Tonight's hypothesis is INCONCLUSIVE by construction: it is
> frozen at 2026-10-28T15:15Z and is only graded on snapshots recorded after that.

## Frozen hypotheses graded tonight

| H | spec | post-freeze ticks | value | n | grade | by | note |
|---|---|---|---|---|---|---|---|
| 2026-10-27 | maker.netCentsPerAttempt > 0 (venue pm, UTC 7h-8h, mid 0.1..0.9, n>=300) | 97 | -0.873 | 137 | INCONCLUSIVE | code | maker.netCentsPerAttempt = -0.873 on n=137, below the n>=300 needed |
| 2026-10-26 | pair.bothSidesFracNetPositive > 0.03 (pair house-2026-republican, n>=300) | 189 | 0.019 | 378 | REFUTED | code | pair.bothSidesFracNetPositive = 0.019 vs > 0.03 on n=378 |

## Tonight's spec (frozen at 2026-10-28T15:15Z)

- pair.bothSidesFracNetPositive > 0.03 (pair house-2026-democratic, n>=300)
- pre-freeze value: 0.019 on n=2102; graded on post-freeze data once it has 48 ticks and n >= 300

## Observations
- On the configured House pairs, Polymarket leads Kalshi by 2 snapshots for Republican (r=0.09) and 1 for Democratic (r=0.077). At the recorded 15-minute median gap, these are weak, coarse lead-lag signals.
- Mean absolute mid differences are 1.02c and 0.83c, respectively; only 2% of opposite-side checks on either pair are net-positive after taker fees.
- A lead does not establish executable profit: the earlier Republican-pair prediction of a net-positive fraction above 0.03 was refuted at 0.019.

## Hypothesis
Given the configured Democratic House pair, when checking opposite-side cross-venue touch purchases without executing, then pair.bothSidesFracNetPositive should be > 0.03 vs the recorded 0.02 baseline, subject to taker fees being included in every check.

## Hypothesis spec
```json
{"metric":"pair.bothSidesFracNetPositive","pair":"house-2026-democratic","op":">","threshold":0.03,"minN":300}
```

## Next observation
Over the next 7 days, record aligned touch checks and their fee-adjusted net outcomes, then separately assess whether positive checks offer at least 1c per $10 and persist at finer-than-15-minute sampling; do not trade.

## Pair candidates
KXMLB-26-TB <-> 0x4d9567b9 — Tampa Bay champion; mids 0.09 and 0.092.  
KXMLB-26-MIL <-> 0x3db74f14 — Milwaukee champion; mids 0.911 and 0.909.

## Evidence (recorded top-of-book, observe-only)

- Coverage: 211087 rows, 1056 ticks, 3354 Polymarket + 2098 Kalshi markets, 2026-10-15T00:42Z .. 2026-10-28T15:15Z (14 day files); median gap between ticks 15 min.
- Polymarket spread: median 1c (p25 0.2, p75 1), one-tick 88% of 90507 two-sided rows; touch median bid 7973.87 / ask 6652.36.
- Polymarket maker proxy (60-minute horizon): 77794 attempts (2115 unobservable: no later snapshot inside the horizon), fill 22%, round-trip 19%, net -99703.9c total = -1.282c/attempt (gross 3255, fees 0, mark -102958.9).
- Kalshi spread: median 1c (p25 1, p75 1), one-tick 91% of 73335 two-sided rows; touch median bid 17705.17 / ask 49484.63.
- Kalshi maker proxy (60-minute horizon): 64971 attempts (1431 unobservable: no later snapshot inside the horizon), fill 16%, round-trip 20%, net -70140.23c total = -1.08c/attempt (gross 2085, fees 3594.15, mark -68631.1).
- Pair CONTROLH-2026-R vs 0x4e4f77e7: n=1045, mean |diff| 1.02c, max 3c, >2c 4%; both-sides net-positive 2% (max 1.08c); leads: polymarket (lag 2, r=0.09).
- Pair CONTROLH-2026-D vs 0xd5d9fc47: n=1051, mean |diff| 0.83c, max 2.95c, >2c 3%; both-sides net-positive 2% (max 0.98c); leads: polymarket (lag 1, r=0.077).
- Polymarket tightest UTC hours: 10h 92%, 8h 92%, 7h 91%; loosest: 2h 80%, 1h 79%.
- Top one-tick candidates: [pm] Will the Fed decrease interest rates by 50+ bps af (one-tick 100%, touch 1449360.61, mid 0.001); [ks] Dallas vs Philadelphia: Spread — Dallas wins by ov (one-tick 98%, touch 1825757.65, mid 0.99); [ks] Kansas City vs Seattle: Spread — Seattle wins by o (one-tick 100%, touch 1321067.35, mid 0.99); [ks] Carolina vs Philadelphia: Spread — Carolina wins b (one-tick 100%, touch 969785.09, mid 0.99); [pm] Will Josh Stein win the 2028 Democratic presidenti (one-tick 100%, touch 969234.22, mid 0.002).
- Hold to resolution (4839 settled markets recorded; buy the favored side with $10 at the first snapshot in a price band, hold to settlement, taker fees in): pm 0.5-0.9 n=1867 win 64% net -42.9c/$10; pm 0.9-0.95 n=703 win 92% net -6.2c/$10; pm 0.95-0.97 n=452 win 96% net -1.1c/$10; pm 0.97-0.99 n=547 win 98% net 3.1c/$10; pm 0.99-1 n=673 win 100% net 0.4c/$10; ks 0.5-0.9 n=737 win 67% net -17.4c/$10; ks 0.9-0.95 n=324 win 93% net -0.3c/$10; ks 0.95-0.97 n=209 win 94% net -20.3c/$10; ks 0.97-0.99 n=246 win 98% net 6.1c/$10; ks 0.99-1 n=232 win 99% net -4.1c/$10. Best net-positive band with n >= 20: ks 0.97-0.99.
- Fees at 50c per contract: PM taker 1c / maker 0c; Kalshi taker 1.75c / maker 0.44c. One-cent maker round trip nets 1c on PM, 0.13c on Kalshi.

| venue | market | one-tick | touch | mid | 24h vol |
|---|---|---|---|---|---|
| pm | Will the Fed decrease interest rates by 50+ bps after the Oc | 100% | 1449360.61 | 0.001 | 452565.09 |
| ks | Dallas vs Philadelphia: Spread — Dallas wins by over 4.5 poi | 98% | 1825757.65 | 0.99 | 4562601.05 |
| ks | Kansas City vs Seattle: Spread — Seattle wins by over 2.5 po | 100% | 1321067.35 | 0.99 | 3986980.44 |
| ks | Carolina vs Philadelphia: Spread — Carolina wins by over 3.5 | 100% | 969785.09 | 0.99 | 1114748.96 |
| pm | Will Josh Stein win the 2028 Democratic presidential nominat | 100% | 969234.22 | 0.002 | 70582.63 |
| ks | 2027 Pro Football Champion — Atlanta | 100% | 898369.08 | 0.015 | 108114.67 |
| ks | 2027 Pro Football Champion — New England | 100% | 878584.15 | 0.035 | 25176.62 |
| pm | Will Mitch Landrieu win the 2028 Democratic presidential nom | 100% | 872460.97 | 0.002 | 70130.64 |
| ks | Washington vs San Francisco: Spread — San Francisco wins by  | 96% | 1638735.26 | 0.01 | 5789583.77 |
| ks | Kansas City vs Seattle — Seattle | 100% | 703283.56 | 0.99 | 10853721.46 |

| venue | entry price | markets | unsized | win rate | net c per $10 | worst c | median hold h |
|---|---|---|---|---|---|---|---|
| pm | 0.5-0.9 | 1867 | 907 | 64% | -42.9 | -1020 | 2.9 |
| pm | 0.9-0.95 | 703 | 238 | 92% | -6.2 | -993.96 | 1.4 |
| pm | 0.95-0.97 | 452 | 162 | 96% | -1.1 | -963.46 | 1.4 |
| pm | 0.97-0.99 | 547 | 220 | 98% | 3.1 | -989.44 | 1.2 |
| pm | 0.99-1 | 673 | 312 | 100% | 0.4 | -990.4 | 1 |
| ks | 0.5-0.9 | 737 | 0 | 67% | -17.4 | -1035 | 2.8 |
| ks | 0.9-0.95 | 324 | 0 | 93% | -0.3 | -997 | 1 |
| ks | 0.95-0.97 | 209 | 0 | 94% | -20.3 | -963 | 1 |
| ks | 0.97-0.99 | 246 | 0 | 98% | 6.1 | -982 | 0.7 |
| ks | 0.99-1 | 232 | 0 | 99% | -4.1 | -991 | 0.6 |

_Hold to resolution counts only markets that have already settled, so long-dated markets are under-represented; one entry per market (per event on Kalshi)._

_Maker model is a proxy: a resting order counts as filled only when the recorded price trades through its level; no queue position is modeled._

## Witness
- session commit: `d3ca377bdc75d08f92f90afd4537f90c33627c70`
- report sha256: `e149e25b886faf699eabfb196830b8e427d2e311dc7a38bed8c8dc2005444ba5`
- witness: `5509671f4db01eb7e6b193f163b87c4c421382e1d12b76a1cffc56a4ea154493`
