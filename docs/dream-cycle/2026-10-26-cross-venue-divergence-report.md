# cross-venue-divergence — kdreams nightly research (2026-10-26)

> kdreams nightly (GitHub Actions, observe-only research). Model: openai/gpt-6-sol via OpenAI (6824 tokens, $0.02185).
> Nothing here placed an order. Tonight's hypothesis is INCONCLUSIVE by construction: it is
> frozen at 2026-10-26T15:30Z and is only graded on snapshots recorded after that.

## Frozen hypotheses graded tonight

| H | spec | post-freeze ticks | value | n | grade | by | note |
|---|---|---|---|---|---|---|---|
| 2026-10-25 | maker.netCentsPerAttempt > 0 (venue pm, UTC 8h-10h, mid 0.1..0.9, n>=300) | 105 | -1.505 | 327 | REFUTED | code | maker.netCentsPerAttempt = -1.505 vs > 0 on n=327 |
| 2026-10-24 | resolution.netCentsPer10 > 1 (venue pm, entry 0.9..0.95, n>=100) | 203 | -9 | 164 | REFUTED | code | resolution.netCentsPer10 = -9 vs > 1 on n=164 |
| 2026-10-23 | resolution.netCentsPer10 > 1 (venue pm, entry 0.97..0.99, n>=100) | 295 | -6.7 | 146 | REFUTED | code | resolution.netCentsPer10 = -6.7 vs > 1 on n=146 |

## Tonight's spec (frozen at 2026-10-26T15:30Z)

- pair.bothSidesFracNetPositive > 0.03 (pair house-2026-republican, n>=300)
- pre-freeze value: 0.023 on n=1718; graded on post-freeze data once it has 48 ticks and n >= 300

## Observations
- The Republican House pair had a mean absolute mid-price difference of 1.01c across 859 aligned snapshots, but only 2% of buy-both-sides checks were net-positive after taker fees.
- The Democratic House pair showed a similar 2% net-positive share across 865 snapshots; its maximum net-positive check was 0.98c.
- The 15-minute median snapshot gap cannot establish that quotes on both venues were simultaneously executable. Identical-sounding markets also require a resolution-rule match.

## Hypothesis
Given the configured Republican House pair, when checking synchronized buy-both-sides quotes without placing orders, then `pair.bothSidesFracNetPositive` should be > 0.03 vs the recorded 2% baseline, subject to both taker fees and identical YES-resolution rules. This tests the frequency of apparent opportunities, not whether they clear 1c per $10 deployed.

## Hypothesis spec
```json
{"metric":"pair.bothSidesFracNetPositive","pair":"house-2026-republican","op":">","threshold":0.03,"minN":300}
```

## Next observation
Over the next 7 days, record timestamped executable bid/ask quotes and resolution terms on both venues, then recompute fee-inclusive buy-both-sides checks and their net cents per $10 without trading.

## Pair candidates
KXBALLONDOR-26-KMBA <-> 0x87091dc5 — Mbappé to win the 2026 Ballon d’Or on both; mids 0.315 and 0.323; verify resolution rules.  
KXBALLONDOR-26-HKAN <-> 0x12dc2b61 — Kane to win the 2026 Ballon d’Or on both; mids 0.635 and 0.634; verify resolution rules.

## Evidence (recorded top-of-book, observe-only)

- Coverage: 173828 rows, 870 ticks, 2963 Polymarket + 1829 Kalshi markets, 2026-10-14T19:13Z .. 2026-10-26T15:30Z (13 day files); median gap between ticks 15 min.
- Polymarket spread: median 1c (p25 0.1, p75 1), one-tick 88% of 74553 two-sided rows; touch median bid 9059.43 / ask 7849.89.
- Polymarket maker proxy (60-minute horizon): 63715 attempts (2138 unobservable: no later snapshot inside the horizon), fill 21%, round-trip 19%, net -85810.45c total = -1.347c/attempt (gross 2590, fees 0, mark -88400.45).
- Kalshi spread: median 1c (p25 1, p75 1), one-tick 90% of 59252 two-sided rows; touch median bid 19004.24 / ask 54449.83.
- Kalshi maker proxy (60-minute horizon): 51851 attempts (1459 unobservable: no later snapshot inside the horizon), fill 16%, round-trip 20%, net -59506.49c total = -1.148c/attempt (gross 1684, fees 2920, mark -58270.5).
- Pair CONTROLH-2026-R vs 0x4e4f77e7: n=859, mean |diff| 1.01c, max 3c, >2c 4%; both-sides net-positive 2% (max 1.08c); leads: polymarket (lag 2, r=0.106).
- Pair CONTROLH-2026-D vs 0xd5d9fc47: n=865, mean |diff| 0.82c, max 2.95c, >2c 4%; both-sides net-positive 2% (max 0.98c); leads: kalshi (lag -3, r=0.119).
- Polymarket tightest UTC hours: 7h 92%, 10h 92%, 8h 92%; loosest: 2h 81%, 1h 81%.
- Top one-tick candidates: [pm] Will the Fed decrease interest rates by 50+ bps af (one-tick 100%, touch 1449360.61, mid 0.001); [ks] Kansas City vs Seattle: Spread — Seattle wins by o (one-tick 100%, touch 1321067.35, mid 0.99); [ks] Dallas vs Philadelphia: Spread — Dallas wins by ov (one-tick 100%, touch 1226153.35, mid 0.495); [ks] Carolina vs Philadelphia: Spread — Carolina wins b (one-tick 100%, touch 969785.09, mid 0.99); [ks] 2027 Pro Football Champion — Atlanta (one-tick 100%, touch 902908.08, mid 0.015).
- Hold to resolution (4184 settled markets recorded; buy the favored side with $10 at the first snapshot in a price band, hold to settlement, taker fees in): pm 0.5-0.9 n=1629 win 64% net -43.6c/$10; pm 0.9-0.95 n=592 win 92% net -7c/$10; pm 0.95-0.97 n=384 win 96% net -3.3c/$10; pm 0.97-0.99 n=480 win 98% net 0.5c/$10; pm 0.99-1 n=580 win 100% net -0.2c/$10; ks 0.5-0.9 n=648 win 66% net -35.3c/$10; ks 0.9-0.95 n=273 win 93% net 0c/$10; ks 0.95-0.97 n=180 win 94% net -19.5c/$10; ks 0.97-0.99 n=214 win 98% net 3.5c/$10; ks 0.99-1 n=202 win 99% net -6c/$10. Best net-positive band with n >= 20: ks 0.97-0.99.
- Fees at 50c per contract: PM taker 1c / maker 0c; Kalshi taker 1.75c / maker 0.44c. One-cent maker round trip nets 1c on PM, 0.13c on Kalshi.

| venue | market | one-tick | touch | mid | 24h vol |
|---|---|---|---|---|---|
| pm | Will the Fed decrease interest rates by 50+ bps after the Oc | 100% | 1449360.61 | 0.001 | 125896.11 |
| ks | Kansas City vs Seattle: Spread — Seattle wins by over 2.5 po | 100% | 1321067.35 | 0.99 | 3986980.44 |
| ks | Dallas vs Philadelphia: Spread — Dallas wins by over 4.5 poi | 100% | 1226153.35 | 0.495 | 758674.57 |
| ks | Carolina vs Philadelphia: Spread — Carolina wins by over 3.5 | 100% | 969785.09 | 0.99 | 1114748.96 |
| ks | 2027 Pro Football Champion — Atlanta | 100% | 902908.08 | 0.015 | 107646.77 |
| ks | 2027 Pro Football Champion — New England | 100% | 878584.15 | 0.035 | 25176.62 |
| pm | Will Mitch Landrieu win the 2028 Democratic presidential nom | 100% | 872460.97 | 0.002 | 162841.28 |
| ks | Washington vs San Francisco: Spread — San Francisco wins by  | 96% | 1638735.26 | 0.01 | 5789583.77 |
| ks | 2027 Pro Football Champion — Houston | 100% | 704307.54 | 0.015 | 757685.48 |
| ks | Kansas City vs Seattle — Seattle | 100% | 703283.56 | 0.99 | 10853721.46 |

| venue | entry price | markets | unsized | win rate | net c per $10 | worst c | median hold h |
|---|---|---|---|---|---|---|---|
| pm | 0.5-0.9 | 1629 | 921 | 64% | -43.6 | -1020 | 2.9 |
| pm | 0.9-0.95 | 592 | 241 | 92% | -7 | -993.96 | 1.4 |
| pm | 0.95-0.97 | 384 | 159 | 96% | -3.3 | -963.46 | 1.4 |
| pm | 0.97-0.99 | 480 | 216 | 98% | 0.5 | -989.44 | 1.2 |
| pm | 0.99-1 | 580 | 293 | 100% | -0.2 | -990.4 | 1 |
| ks | 0.5-0.9 | 648 | 0 | 66% | -35.3 | -1035 | 2.9 |
| ks | 0.9-0.95 | 273 | 0 | 93% | 0 | -997 | 1.1 |
| ks | 0.95-0.97 | 180 | 0 | 94% | -19.5 | -963 | 1 |
| ks | 0.97-0.99 | 214 | 0 | 98% | 3.5 | -982 | 0.7 |
| ks | 0.99-1 | 202 | 0 | 99% | -6 | -991 | 0.6 |

_Hold to resolution counts only markets that have already settled, so long-dated markets are under-represented; one entry per market (per event on Kalshi)._

_Maker model is a proxy: a resting order counts as filled only when the recorded price trades through its level; no queue position is modeled._

## Witness
- session commit: `a58aca6daff8d623c033eef834cde09f66bd0797`
- report sha256: `f66d2e982ba9330f7b641d3bc226759d4cd0c0b67b39555c8e72ef222cad742e`
- witness: `1bb6af45f59b540816e3910467380cee67fa998ee058ed392a6dd0d5661c405b`
