# fee-modeling — kdreams nightly research (2026-10-14)

> kdreams nightly (GitHub Actions, observe-only research). Model: deepseek/deepseek-v4-flash via Alibaba (5644 tokens, $0.00083).
> Nothing here placed an order. Verdict is INCONCLUSIVE by construction: the hypothesis
> below is frozen tonight and can only be tested on snapshots recorded after it.

## Observations
- 82% of Polymarket two-sided rows show a 1c spread (median 1c, p25 0.1, p75 1); 84% of Kalshi rows also show 1c (median 1c, p25 1, p75 1).  
- Maker proxy (4-tick horizon) recorded 0% fill rate on both venues (75 attempts on Polymarket, 84 on Kalshi), yielding 0c net per attempt.  
- Fee model: a one-cent maker round trip nets 1c on Polymarket (maker 0c, taker 1c) but only 0.13c on Kalshi (maker rebate 0.44c, taker 1.75c).  
- The catalog shows the same real-world events (e.g., Real Madrid vs Roma, Man City vs PSG) trade on both venues with near-identical mids and 1c spreads.

## Hypothesis
Given Polymarket markets with a 1c spread and mid price between 0.2 and 0.8 (to avoid binary extremes), when we simulate a limit order at the best bid for 1 contract and record whether it is filled within the next 4 ticks (using continuous Level 2 snapshots), then the observed fill rate should be >0% vs the 0% rate from prior 15-min snapshots, subject to queue position risk and the fact that the earlier proxy used only top-of-book.

## Next observation
Record Level 2 order book depth (at least top 5 levels) for all Polymarket markets with 1c spreads and mid 0.2–0.8 at every 1-minute tick for the next 7 days to estimate queue position and time-to-fill for a best-bid limit order.

## Pair candidates
KXUCLGAME-26OCT14ROMRMA- <-> 0xf417fdb994941fcbfb40b8b — same Real Madrid vs Roma match, mids 0.485 vs 0.475, both 1c spread.  
KXUCLGAME-26OCT14MCIPSG- <-> 0xdf8e2dc5860027decbe616 — same Man City vs PSG match, both mids ~0.505, 1c spread.  
KXUCLGAME-26OCT14SLOVFB- <-> 0x698e699d6d20a237b4dbda — same Slovan Bratislava vs Stuttgart, mids 0.145 vs 0.145, 1c spread.

## Evidence (recorded top-of-book, observe-only)

- Coverage: 200 rows, 1 ticks, 100 Polymarket + 100 Kalshi markets, 2026-10-14T19:13Z .. 2026-10-14T19:13Z (1 day files).
- Polymarket spread: median 1c (p25 0.1, p75 1), one-tick 82% of 91 two-sided rows; touch median bid 13853.41 / ask 8358.46.
- Polymarket maker proxy (4-tick horizon): 75 attempts, fill 0%, round-trip n/a, net 0c total = 0c/attempt (gross 0, fees 0, mark 0).
- Kalshi spread: median 1c (p25 1, p75 1), one-tick 84% of 100 two-sided rows; touch median bid 1491.58 / ask 9585.89.
- Kalshi maker proxy (4-tick horizon): 84 attempts, fill 0%, round-trip n/a, net 0c total = 0c/attempt (gross 0, fees 0, mark 0).
- Cross-venue: no pairs configured in config/kdreams.watchlist.json yet.
- Polymarket tightest UTC hours: 19h 82%; loosest: 19h 82%.
- Fees at 50c per contract: PM taker 1c / maker 0c; Kalshi taker 1.75c / maker 0.44c. One-cent maker round trip nets 1c on PM, 0.13c on Kalshi.

_Maker model is a proxy: a resting order counts as filled only when the recorded price trades through its level; no queue position is modeled._

## Witness
- session commit: `4d94910ed397f5f7a82424d0f2ec5006655c6549`
- report sha256: `81ae129b7760547b62c03518d001a0f4080e61095123e5328dc3f5e78635feea`
- witness: `fc0fe92c9378a4a3b5b003c93850731a10fb317eca28f432068fc887aabc8738`
