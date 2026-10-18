# lead-lag — kdreams nightly research (2026-10-18)

> kdreams nightly (GitHub Actions, observe-only research). Model: openai/gpt-6-sol via OpenAI (7091 tokens, $0.02187).
> Nothing here placed an order. Tonight's hypothesis is INCONCLUSIVE by construction: it is
> frozen at 2026-10-18T08:45Z and is only graded on snapshots recorded after that.

## Frozen hypotheses re-tested tonight

| H | post-freeze ticks | grade | by | note |
|---|---|---|---|---|
| 2026-10-16 | 94 | INCONCLUSIVE | model | post-freeze round-trip rate is 20% overall, but the specified UTC 5h–9h, high-volume subset is not measured. |
| 2026-10-15 | 100 | INCONCLUSIVE | model | post-freeze net is -1.037c/attempt overall, not for the specified mid-price, spread, and UTC-hour subset. |
| 2026-10-14 | 105 | INCONCLUSIVE | model | post-freeze fill is 15% under a top-of-book proxy; the proposed continuous Level 2 fill metric is not measured. |
| 2026-10-17 | 46 | INCONCLUSIVE | rule | only 46 post-freeze ticks (< 48) |

## Re-tests
H 2026-10-16: INCONCLUSIVE — post-freeze round-trip rate is 20% overall, but the specified UTC 5h–9h, high-volume subset is not measured.
H 2026-10-15: INCONCLUSIVE — post-freeze net is -1.037c/attempt overall, not for the specified mid-price, spread, and UTC-hour subset.
H 2026-10-14: INCONCLUSIVE — post-freeze fill is 15% under a top-of-book proxy; the proposed continuous Level 2 fill metric is not measured.

## Observations
- Neither configured pair has a measured lead or lag: both report lag n/a and r n/a.
- The Republican-control pair has mean absolute midpoint difference 0.91c across 100 observations; the Democratic-control pair has 0.33c across 106.
- Both pairs have >2c divergence in 0% of observations and both-sides net-positive in 0%. These snapshots show no executable lead-lag signal.

## Hypothesis
Given the configured cross-venue control-of-House pairs, when observing synchronized quote updates at finer-than-15-minute cadence, then the >2c divergence rate should be >0% vs the recorded 0% baseline, subject to a both-sides net-positive-after-fees invariant.

## Next observation
Over the next 7 days, record timestamped quote updates for both configured pairs and compute lead-lag, divergence duration, and fee-adjusted executable prices without trading.

## Pair candidates
none found

## Evidence (recorded top-of-book, observe-only)

- Coverage: 21276 rows, 106 ticks, 910 Polymarket + 556 Kalshi markets, 2026-10-14T19:13Z .. 2026-10-18T08:45Z (5 day files); median gap between ticks 15 min.
- Polymarket spread: median 1c (p25 0.1, p75 1), one-tick 92% of 9778 two-sided rows; touch median bid 20364.99 / ask 15352.32.
- Polymarket maker proxy (60-minute horizon): 7352 attempts (1604 unobservable: no later snapshot inside the horizon), fill 15%, round-trip 19%, net -7668c total = -1.043c/attempt (gross 215, fees 0, mark -7883).
- Kalshi spread: median 1c (p25 1, p75 100), one-tick 65% of 10600 two-sided rows; touch median bid 1977.19 / ask 7711.09.
- Kalshi maker proxy (60-minute horizon): 5743 attempts (1120 unobservable: no later snapshot inside the horizon), fill 14%, round-trip 21%, net -1700.06c total = -0.296c/attempt (gross 168, fees 277.67, mark -1590.4).
- Pair CONTROLH-2026-R vs 0x4e4f77e7: n=100, mean |diff| 0.91c, max 1c, >2c 0%; both-sides net-positive 0% (max -0.99c); leads: n/a (lag n/a, r=n/a).
- Pair CONTROLH-2026-D vs 0xd5d9fc47: n=106, mean |diff| 0.33c, max 0.35c, >2c 0%; both-sides net-positive 0% (max -1.18c); leads: n/a (lag n/a, r=n/a).
- Polymarket tightest UTC hours: 10h 95%, 8h 95%, 9h 95%; loosest: 3h 87%, 17h 86%.
- Top one-tick candidates: [pm] Will the Fed decrease interest rates by 50+ bps af (one-tick 100%, touch 1449360.61, mid 0.002); [ks] Carolina vs Philadelphia: Spread — Carolina wins b (one-tick 100%, touch 969785.09, mid 0.485); [ks] 2027 Pro Football Champion — Atlanta (one-tick 100%, touch 914489.11, mid 0.015); [ks] 2027 Pro Football Champion — Houston (one-tick 100%, touch 809871.98, mid 0.015); [pm] Will the Republican Party control the House after  (one-tick 100%, touch 772772.25, mid 0.095).
- Fees at 50c per contract: PM taker 1c / maker 0c; Kalshi taker 1.75c / maker 0.44c. One-cent maker round trip nets 1c on PM, 0.13c on Kalshi.

| venue | market | one-tick | touch | mid | 24h vol |
|---|---|---|---|---|---|
| pm | Will the Fed decrease interest rates by 50+ bps after the Oc | 100% | 1449360.61 | 0.002 | 57094.16 |
| ks | Carolina vs Philadelphia: Spread — Carolina wins by over 3.5 | 100% | 969785.09 | 0.485 | 71157.79 |
| ks | 2027 Pro Football Champion — Atlanta | 100% | 914489.11 | 0.015 | 12308.13 |
| ks | 2027 Pro Football Champion — Houston | 100% | 809871.98 | 0.015 | 202821.95 |
| pm | Will the Republican Party control the House after the 2026 M | 100% | 772772.25 | 0.095 | 48720.57 |
| ks | 2027 Pro Football Champion — Green Bay | 100% | 701223.5 | 0.015 | 124500.51 |
| ks | College Football National Championship Winner — Tennessee | 100% | 663115.74 | 0.015 | 464979.74 |
| ks | 2027 Pro Football Champion — Minnesota | 100% | 605903.4 | 0.035 | 76392.84 |
| pm | Will the Fed increase interest rates by 50+ bps after the Oc | 100% | 564357.23 | 0.004 | 244670.57 |
| ks | Washington vs Purdue — Washington | 100% | 557834.58 | 0.405 | 444049.54 |

_Maker model is a proxy: a resting order counts as filled only when the recorded price trades through its level; no queue position is modeled._

## Witness
- session commit: `4a6e2d920b2c0cf5a92d9ea50b897ff6289dc537`
- report sha256: `a5896769757d595f54f3df8e853625317a2e672ffb2743ebf0e95b46c607bef0`
- witness: `3caed720c77097a91ef33564a935a6837a5d2f8671c2e63d6a2f2367a401ea8a`
