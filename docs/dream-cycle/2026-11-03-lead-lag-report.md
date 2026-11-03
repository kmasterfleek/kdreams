# lead-lag — kdreams nightly research (2026-11-03)

> kdreams nightly (GitHub Actions, observe-only research). Model: openai/gpt-6-sol via OpenAI (6739 tokens, $0.02127).
> Nothing here placed an order. Tonight's hypothesis is INCONCLUSIVE by construction: it is
> frozen at 2026-11-03T16:30Z and is only graded on snapshots recorded after that.

## Frozen hypotheses graded tonight

| H | spec | post-freeze ticks | value | n | grade | by | note |
|---|---|---|---|---|---|---|---|
| 2026-11-02 | maker.netCentsPerAttempt > 0 (venue pm, UTC 16h-17h, n>=300) | 65 | -0.133 | 157 | INCONCLUSIVE | code | maker.netCentsPerAttempt = -0.133 on n=157, below the n>=300 needed |
| 2026-11-01 | pair.bothSidesFracNetPositive > 0.1 (pair house-2026-democratic, n>=300) | 168 | 0.131 | 336 | SUPPORTED | code | pair.bothSidesFracNetPositive = 0.131 vs > 0.1 on n=336 |
| 2026-10-29 | resolution.netCentsPer10 > 1 (venue ks, entry 0.97..0.99, n>=100) | 452 | -18.8 | 97 | INCONCLUSIVE | code | resolution.netCentsPer10 = -18.8 on n=97, below the n>=100 needed |

## Tonight's spec (frozen at 2026-11-03T16:30Z)

- pair.bothSidesFracNetPositive > 0.12 (pair house-2026-democratic, n>=300)
- pre-freeze value: 0.087 on n=2552; graded on post-freeze data once it has 48 ticks and n >= 300

## Observations
- The House Republican pair has 1,276 aligned snapshots and a Polymarket-leading correlation of only 0.047 at lag 2. The House Democratic pair likewise shows a weak 0.063 at lag 1; neither establishes an actionable lead.
- Buy-both-sides checks were net-positive after taker fees in 11% of Republican-pair snapshots and 9% of Democratic-pair snapshots. A positive check is not evidence that both quoted touches remain available.
- The collector’s median gap is 15 minutes, too coarse to resolve a news-latency sequence or establish which venue moved first between snapshots.

## Hypothesis
Given the House Democratic pair, when checking simultaneous buy-both-sides prices at the recorded touches, then `pair.bothSidesFracNetPositive` should be > 0.12 vs the recorded 9%, subject to both taker fees being included and the quoted touches being executable.

## Hypothesis spec
```json
{"metric":"pair.bothSidesFracNetPositive","pair":"house-2026-democratic","op":">","threshold":0.12,"minN":300}
```

## Next observation
Over the next 7 days, record synchronized touch prices and available size for both venues, then compute the specified fee-inclusive check and separately measure how often both touches persist long enough to be actionable.

## Pair candidates
CONTROLS-2026-R <-> 0x86bfb53 — Republican Senate control on both venues; mids 0.255 and 0.245.
CONTROLS-2026-D <-> 0x307a1ed8 — Democratic Senate control on both venues; mids 0.745 and 0.765.

## Evidence (recorded top-of-book, observe-only)

- Coverage: 255854 rows, 1281 ticks, 3301 Polymarket + 2012 Kalshi markets, 2026-10-21T00:00Z .. 2026-11-03T16:30Z (14 day files); median gap between ticks 15 min.
- Polymarket spread: median 1c (p25 0.2, p75 1), one-tick 89% of 110003 two-sided rows; touch median bid 7464.77 / ask 5773.37.
- Polymarket maker proxy (60-minute horizon): 96153 attempts (1572 unobservable: no later snapshot inside the horizon), fill 21%, round-trip 18%, net -122225.25c total = -1.271c/attempt (gross 3638, fees 0, mark -125863.25).
- Kalshi spread: median 1c (p25 1, p75 1), one-tick 93% of 92959 two-sided rows; touch median bid 16742 / ask 47383.66.
- Kalshi maker proxy (60-minute horizon): 85026 attempts (1043 unobservable: no later snapshot inside the horizon), fill 16%, round-trip 17%, net -83764.46c total = -0.985c/attempt (gross 2201, fees 4259.84, mark -81705.7).
- Pair CONTROLH-2026-R vs 0x4e4f77e7: n=1276, mean |diff| 1.04c, max 3c, >2c 4%; both-sides net-positive 11% (max 1.08c); leads: polymarket (lag 2, r=0.047).
- Pair CONTROLH-2026-D vs 0xd5d9fc47: n=1276, mean |diff| 0.95c, max 2.95c, >2c 3%; both-sides net-positive 9% (max 0.98c); leads: polymarket (lag 1, r=0.063).
- Polymarket tightest UTC hours: 16h 93%, 10h 93%, 12h 92%; loosest: 2h 81%, 1h 79%.
- Top one-tick candidates: [ks] Dallas vs Philadelphia: Spread — Dallas wins by ov (one-tick 98%, touch 1825757.65, mid 0.99); [ks] Kansas City vs Seattle: Spread — Seattle wins by o (one-tick 100%, touch 1321067.35, mid 0.99); [ks] Carolina vs Green Bay: Spread — Green Bay wins by  (one-tick 96%, touch 1674796.99, mid 0.99); [pm] Will Josh Stein win the 2028 Democratic presidenti (one-tick 100%, touch 968966.56, mid 0.002); [pm] Will Mitch Landrieu win the 2028 Democratic presid (one-tick 100%, touch 872460.97, mid 0.002).
- Hold to resolution (6821 settled markets recorded; buy the favored side with $10 at the first snapshot in a price band, hold to settlement, taker fees in): pm 0.5-0.9 n=1954 win 63% net -43.1c/$10; pm 0.9-0.95 n=826 win 91% net -15.7c/$10; pm 0.95-0.97 n=527 win 96% net 1.4c/$10; pm 0.97-0.99 n=611 win 98% net -0.2c/$10; pm 0.99-1 n=767 win 99% net -2.8c/$10; ks 0.5-0.9 n=739 win 68% net -7.8c/$10; ks 0.9-0.95 n=357 win 91% net -12.1c/$10; ks 0.95-0.97 n=226 win 93% net -24.7c/$10; ks 0.97-0.99 n=264 win 98% net -0.5c/$10; ks 0.99-1 n=234 win 98% net -12.5c/$10. Best net-positive band with n >= 20: pm 0.95-0.97.
- Fees at 50c per contract: PM taker 1c / maker 0c; Kalshi taker 1.75c / maker 0.44c. One-cent maker round trip nets 1c on PM, 0.13c on Kalshi.

| venue | market | one-tick | touch | mid | 24h vol |
|---|---|---|---|---|---|
| ks | Dallas vs Philadelphia: Spread — Dallas wins by over 4.5 poi | 98% | 1825757.65 | 0.99 | 4562601.05 |
| ks | Kansas City vs Seattle: Spread — Seattle wins by over 2.5 po | 100% | 1321067.35 | 0.99 | 3986980.44 |
| ks | Carolina vs Green Bay: Spread — Green Bay wins by over 3.5 p | 96% | 1674796.99 | 0.99 | 4557675.97 |
| pm | Will Josh Stein win the 2028 Democratic presidential nominat | 100% | 968966.56 | 0.002 | 70457 |
| pm | Will Mitch Landrieu win the 2028 Democratic presidential nom | 100% | 872460.97 | 0.002 | 70306 |
| ks | Chicago vs Seattle — Seattle | 100% | 793279.28 | 0.01 | 29421813.39 |
| pm | Will the Democratic Party control the House after the 2026 M | 98% | 1039263.95 | 0.945 | 4148377.52 |
| ks | Philadelphia vs Washington: Spread — Washington wins by over | 96% | 1256701.78 | 0.985 | 4167766.69 |
| pm | Will Candace Owens win the 2028 Republican presidential nomi | 100% | 713735.13 | 0.003 | 72585.01 |
| ks | Kansas City vs Seattle — Seattle | 100% | 703283.56 | 0.99 | 10853721.46 |

| venue | entry price | markets | unsized | win rate | net c per $10 | worst c | median hold h |
|---|---|---|---|---|---|---|---|
| pm | 0.5-0.9 | 1954 | 258 | 63% | -43.1 | -1020 | 2.9 |
| pm | 0.9-0.95 | 826 | 83 | 91% | -15.7 | -993.96 | 1.4 |
| pm | 0.95-0.97 | 527 | 54 | 96% | 1.4 | -968.28 | 1.3 |
| pm | 0.97-0.99 | 611 | 81 | 98% | -0.2 | -989.44 | 1.1 |
| pm | 0.99-1 | 767 | 165 | 99% | -2.8 | -997.12 | 0.9 |
| ks | 0.5-0.9 | 739 | 0 | 68% | -7.8 | -1035 | 2.3 |
| ks | 0.9-0.95 | 357 | 0 | 91% | -12.1 | -997 | 1 |
| ks | 0.95-0.97 | 226 | 0 | 93% | -24.7 | -963 | 0.9 |
| ks | 0.97-0.99 | 264 | 0 | 98% | -0.5 | -982 | 0.7 |
| ks | 0.99-1 | 234 | 0 | 98% | -12.5 | -991 | 0.6 |

_Hold to resolution counts only markets that have already settled, so long-dated markets are under-represented; one entry per market (per event on Kalshi)._

_Maker model is a proxy: a resting order counts as filled only when the recorded price trades through its level; no queue position is modeled._

## Witness
- session commit: `77264c0939e25e0d283e0adf044d1b6c8fecf7a2`
- report sha256: `e8d85d072d5c1e59ebd95aca30ce81a88746dbbf33d20507416928bf754f4155`
- witness: `d3335e65a4173d978346166f279ceba14239684082e188d397b4e24afcbaa6dd`
