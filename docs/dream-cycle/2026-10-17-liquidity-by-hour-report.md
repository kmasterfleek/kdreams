# liquidity-by-hour — kdreams nightly research (2026-10-17)

> kdreams nightly (GitHub Actions, observe-only research). Model: openai/gpt-6-sol via OpenAI (7297 tokens, $0.02329).
> Nothing here placed an order. Tonight's hypothesis is INCONCLUSIVE by construction: it is
> frozen at 2026-10-17T10:45Z and is only graded on snapshots recorded after that.

## Frozen hypotheses re-tested tonight

| H | post-freeze ticks | grade | by | note |
|---|---|---|---|---|
| 2026-10-16 | 48 | INCONCLUSIVE | model | post-freeze maker fill was 14% overall; the specified UTC window, market subset, and round-trip fill metric were not reported. |
| 2026-10-15 | 54 | INCONCLUSIVE | model | post-freeze net was -0.709c/attempt overall, not for the specified bid, spread, mid-price, and UTC-window subset. |
| 2026-10-14 | 59 | INCONCLUSIVE | model | post-freeze fill was 14% using a top-of-book proxy, not the proposed continuous Level 2 test. |

## Re-tests — one line per hypothesis above, exactly "H <date>: SUPPORTED|REFUTED|INCONCLUSIVE — <reason citing a post-freeze number>".
H 2026-10-16: INCONCLUSIVE — post-freeze maker fill was 14% overall; the specified UTC window, market subset, and round-trip fill metric were not reported.
H 2026-10-15: INCONCLUSIVE — post-freeze net was -0.709c/attempt overall, not for the specified bid, spread, mid-price, and UTC-window subset.
H 2026-10-14: INCONCLUSIVE — post-freeze fill was 14% using a top-of-book proxy, not the proposed continuous Level 2 test.

## Observations
- Polymarket’s tightest reported UTC hours were 10h and 9h at 95% one-tick, then 8h at 94%; its overall two-sided rate was 93%.
- The loosest reported hours were 19h at 89% and 4h at 87%. These are spread frequencies, not measured hour-specific fill rates.
- Liquidity at the touch does not establish capture: the Polymarket maker proxy netted -0.726c/attempt overall, with no queue position modeled.

## Hypothesis
Given two-sided Polymarket markets observed during UTC 8h–10h, when filtering snapshots to those hours, then the one-tick share should remain above the 93% overall baseline, subject to the invariant that this spread metric implies neither a fill nor net profit after fees.

## Next observation
Over the next 7 days, record two-sided snapshot counts and one-tick shares by UTC hour and market, then compare UTC 8h–10h with the overall baseline without placing orders.

## Pair candidates
KXEPLGAME-26OCT17EVECFC- <-> 0xe3aa6fb12076a8c644b8a9 — Chelsea to win on the same date; catalog mids 0.415 and 0.405, respectively.

## Evidence (recorded top-of-book, observe-only)

- Coverage: 12048 rows, 60 ticks, 617 Polymarket + 427 Kalshi markets, 2026-10-14T19:13Z .. 2026-10-17T10:45Z (4 day files); median gap between ticks 15 min.
- Polymarket spread: median 1c (p25 0.1, p75 1), one-tick 93% of 5620 two-sided rows; touch median bid 25329.71 / ask 25272.9.
- Polymarket maker proxy (60-minute horizon): 3896 attempts (1301 unobservable: no later snapshot inside the horizon), fill 14%, round-trip 18%, net -2826.8c total = -0.726c/attempt (gross 99, fees 0, mark -2925.8).
- Kalshi spread: median 1c (p25 1, p75 2), one-tick 71% of 6000 two-sided rows; touch median bid 4550 / ask 15841.89.
- Kalshi maker proxy (60-minute horizon): 3216 attempts (1047 unobservable: no later snapshot inside the horizon), fill 9%, round-trip 14%, net -399.84c total = -0.124c/attempt (gross 43, fees 91, mark -351.85).
- Pair CONTROLH-2026-R vs 0x4e4f77e7: n=54, mean |diff| 0.83c, max 1c, >2c 0%; both-sides net-positive 0% (max -0.99c); leads: n/a (lag n/a, r=n/a).
- Pair CONTROLH-2026-D vs 0xd5d9fc47: n=60, mean |diff| 0.32c, max 0.35c, >2c 0%; both-sides net-positive 0% (max -1.18c); leads: n/a (lag n/a, r=n/a).
- Polymarket tightest UTC hours: 10h 95%, 9h 95%, 8h 94%; loosest: 19h 89%, 4h 87%.
- Top one-tick candidates: [pm] Will the Fed decrease interest rates by 50+ bps af (one-tick 100%, touch 1449360.61, mid 0.002); [ks] Carolina vs Philadelphia: Spread — Carolina wins b (one-tick 100%, touch 969785.09, mid 0.485); [ks] 2027 Pro Football Champion — Atlanta (one-tick 100%, touch 914489.11, mid 0.015); [pm] Will the Republican Party control the House after  (one-tick 100%, touch 772772.25, mid 0.095); [ks] 2027 Pro Football Champion — Green Bay (one-tick 100%, touch 701223.5, mid 0.015).
- Fees at 50c per contract: PM taker 1c / maker 0c; Kalshi taker 1.75c / maker 0.44c. One-cent maker round trip nets 1c on PM, 0.13c on Kalshi.

| venue | market | one-tick | touch | mid | 24h vol |
|---|---|---|---|---|---|
| pm | Will the Fed decrease interest rates by 50+ bps after the Oc | 100% | 1449360.61 | 0.002 | 68840.43 |
| ks | Carolina vs Philadelphia: Spread — Carolina wins by over 3.5 | 100% | 969785.09 | 0.485 | 71157.79 |
| ks | 2027 Pro Football Champion — Atlanta | 100% | 914489.11 | 0.015 | 12308.13 |
| pm | Will the Republican Party control the House after the 2026 M | 100% | 772772.25 | 0.095 | 35631.42 |
| ks | 2027 Pro Football Champion — Green Bay | 100% | 701223.5 | 0.015 | 124500.51 |
| ks | 2027 Pro Football Champion — Minnesota | 100% | 605903.4 | 0.035 | 76392.84 |
| pm | Will the Fed increase interest rates by 50+ bps after the Oc | 100% | 561784.73 | 0.004 | 304057.62 |
| ks | Washington vs Purdue — Washington | 100% | 557834.58 | 0.405 | 444049.54 |
| ks | Memphis vs Tulane: Spread — Memphis wins by over 6.5 points | 100% | 446118.73 | 0.595 | 1572111.24 |
| pm | Will the Democratic Party control the House after the 2026 M | 100% | 419103.52 | 0.905 | 282975.96 |

_Maker model is a proxy: a resting order counts as filled only when the recorded price trades through its level; no queue position is modeled._

## Witness
- session commit: `99134cd461d77931e0dd0e5002bd0372afbdd06b`
- report sha256: `c628f567e44235133d5e81b352b00f21fdd0ccd19119bc4d308f6b6ca7ca4ee0`
- witness: `01ed828abdb04d33166ed052b77cf62c2274652fdc189109a320ae4a7fc81d65`
