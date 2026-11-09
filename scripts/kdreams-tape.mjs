/**
 * kdreams-tape — observe-only trade tape: who is putting money in, where, and how big.
 *
 * Dependency-free (native fetch and fs only), called by kdreams-collect.mjs on every tick.
 * Reads public trade feeds only; no keys, no accounts, no orders. Each run covers one window of
 * time, (state.end, now - lagSeconds], so consecutive runs neither overlap nor leave a hole
 * unless a run is missed for longer than maxWindowMinutes (the log says so, and every flow row
 * carries the window it covers).
 *
 * data/trades/YYYY-MM-DD.ndjson — one line per large taker trade (>= minUsd):
 *   { t, v, id, o, s, p, n, usd, w? }
 *   t    trade time, ISO to the second       o  outcome bought or sold: 0 = YES token, 1 = NO, null unknown
 *   s    taker side "B" buy / "S" sell       p  price of that outcome (0..1)    n  shares/contracts
 *   usd  n * p                               w  Polymarket taker wallet (public, on-chain); Kalshi has none
 * data/flow/YYYY-MM-DD.ndjson — one line per watched market with trades in the window:
 *   { t, v, id, from, k, yu, nu, big, cap }
 *   t/from  window end (the tick) and start  k  taker trades   yu/nu  USD of taker flow adding YES / NO exposure
 *   big     trades >= minUsd                 cap  true when paging stopped before the window start (undercount)
 * data/catalog/wallets.json — Polymarket wallets seen in large trades, with the venue's public
 *   profile stats (join date, trade count, volume, realized PnL), refreshed every refreshDays.
 *
 * Polymarket: the global large-trade feed (one cash filter covers every market) plus full taker
 * flow on the watched markets. Kalshi has no size filter and trades hundreds of times a second at
 * peak, so it is read per watched ticker.
 */
import { readFileSync, writeFileSync, mkdirSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';

export const PM_DATA = 'https://data-api.polymarket.com/v2';

function r4(x) { const n = Number(x); return Number.isFinite(n) ? Math.round(n * 1e4) / 1e4 : null; }
function r2(x) { const n = Number(x); return Number.isFinite(n) ? Math.round(n * 100) / 100 : null; }
function iso(sec) { return new Date(sec * 1000).toISOString().slice(0, 19) + 'Z'; }
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function loadJson(path, fallback) { try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return fallback; } }

/** +1 when a taker trade adds YES exposure (buys YES or sells NO), -1 when it adds NO, 0 unknown. */
export function yesSign(o, s) {
  if (o !== 0 && o !== 1) return 0;
  return (o === 0) === (s === 'B') ? 1 : -1;
}

/** The window this run covers, in epoch seconds: (start, end]. */
export function tapeWindow(state, nowSec, { lagSeconds = 120, maxWindowMinutes = 60, firstWindowMinutes = 15 } = {}) {
  const end = nowSec - lagSeconds;
  const floor = end - maxWindowMinutes * 60;
  const prev = Number.isFinite(state?.end) ? state.end : end - firstWindowMinutes * 60;
  return { start: Math.max(prev, floor), end, gapSeconds: prev < floor ? floor - prev : 0 };
}

/** Polymarket v2 trade -> tape row. `catalog` resolves the outcome when outcome_index is not 0/1. */
export function mapPmTrade(x, catalog = {}) {
  const id = String(x.condition_id || '');
  let o = x.outcome_index === 0 || x.outcome_index === 1 ? x.outcome_index : null;
  if (o === null && x.token_id) {
    const m = catalog[id];
    if (m?.yesToken === String(x.token_id)) o = 0;
    else if (m?.noToken === String(x.token_id)) o = 1;
  }
  const p = r4(x.price), n = r2(x.size);
  return { t: iso(Number(x.timestamp)), v: 'pm', id, o, s: x.side === 'SELL' ? 'S' : 'B', p, n, usd: r2(p * n), w: x.proxy_wallet || null };
}

/** Kalshi v2 trade -> tape row. The taker always buys an outcome; a YES taker pays yes_price. */
export function mapKsTrade(x) {
  const yes = x.taker_outcome_side ? x.taker_outcome_side === 'yes' : x.taker_side === 'yes';
  const p = r4(yes ? x.yes_price_dollars : x.no_price_dollars), n = r2(x.count_fp ?? x.count);
  return { t: String(x.created_time).slice(0, 19) + 'Z', v: 'ks', id: String(x.ticker), o: yes ? 0 : 1, s: 'B', p, n, usd: r2(p * n) };
}

/** Taker flow per market over one window, from tape rows. */
export function aggregateFlow(rows, { t, from, minUsd = 1000, capped = new Set() } = {}) {
  const by = new Map();
  for (const r of rows) {
    const k = `${r.v}:${r.id}`;
    if (!by.has(k)) by.set(k, { t, v: r.v, id: r.id, from, k: 0, yu: 0, nu: 0, big: 0, cap: capped.has(k) });
    const a = by.get(k);
    a.k++;
    const sign = yesSign(r.o, r.s);
    if (sign > 0) a.yu += r.usd || 0; else if (sign < 0) a.nu += r.usd || 0;
    if ((r.usd || 0) >= minUsd) a.big++;
  }
  return [...by.values()].map((a) => ({ ...a, yu: r2(a.yu), nu: r2(a.nu) }));
}

/** Wallets worth a profile lookup: never looked up or stale, biggest trade first. */
export function walletsToLookup(trades, wallets, nowSec, { lookupsPerTick = 40, refreshDays = 7 } = {}) {
  const biggest = new Map();
  for (const r of trades) if (r.w) biggest.set(r.w, Math.max(biggest.get(r.w) || 0, r.usd || 0));
  return [...biggest.entries()]
    .filter(([w]) => !wallets[w]?.statsAt || nowSec - Date.parse(wallets[w].statsAt) / 1000 > refreshDays * 86400)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, lookupsPerTick)
    .map(([w]) => w);
}

/** Polymarket /v2/user-stats payload -> wallet catalog fields. */
export function mapWalletStats(d, t) {
  if (!d) return { statsAt: t, missing: true };
  const pnl = d.all_time_pnl || {};
  return {
    join: Number.isFinite(d.join_date) ? iso(d.join_date) : null,
    trades: d.all_time_pnl?.trade_count ?? d.trades ?? null,
    markets: d.trades ?? null,
    volume: r2(pnl.volume_usdc ?? pnl.volume),
    pnl: r2(pnl.realized_pnl),
    statsAt: t,
  };
}

/**
 * Page a newest-first feed until it reaches the window start. `page(cursor)` returns
 * { rows, cursor, oldestSec }. Returns rows inside (start, end] and whether paging was capped.
 */
export async function pageBack(page, { start, end, maxPages = 10, timeOf }) {
  const out = [];
  let cursor = null, pages = 0, reached = false;
  while (pages < maxPages) {
    const got = await page(cursor);
    pages++;
    for (const x of got.rows) { const s = timeOf(x); if (s > start && s <= end) out.push(x); }
    if (!got.rows.length || got.oldestSec <= start || !got.cursor) { reached = true; break; }
    cursor = got.cursor;
  }
  return { rows: out, capped: !reached, pages };
}

export async function collectTape(cfg, { dataDir, t, nowSec, pmIds = [], ksTickers = [], fetchJson, dryRun = false, log = () => {} }) {
  if (cfg.enabled === false) return null;
  const KALSHI = 'https://api.elections.kalshi.com/trade-api/v2';
  const pmCfg = cfg.polymarket || {}, ksCfg = cfg.kalshi || {}, wCfg = cfg.wallets || {};
  const statePath = join(dataDir, 'catalog', 'tape-state.json');
  const state = loadJson(statePath, {});
  const win = tapeWindow(state, nowSec, cfg);
  if (win.end <= win.start) return null;
  if (win.gapSeconds) log(`tape: ${Math.round(win.gapSeconds / 60)} minutes since the last window were not read (beyond maxWindowMinutes)`);
  const from = iso(win.start), to = iso(win.end);
  const catPath = join(dataDir, 'catalog', 'polymarket.json');
  const pmCatalog = loadJson(catPath, {});
  const capped = new Set();
  const pmTime = (x) => Number(x.timestamp);
  const pmPage = (qs) => async (cursor) => {
    const d = await fetchJson(`${PM_DATA}/trades?${qs}&taker_only=true${cursor ? `&cursor=${encodeURIComponent(cursor)}` : '&limit=1000'}`);
    const rows = d?.data || [];
    return { rows, cursor: d?.pagination?.next_cursor || null, oldestSec: rows.length ? Math.min(...rows.map(pmTime)) : -Infinity };
  };

  // Polymarket: every large trade on any market, then all taker flow on the watched markets.
  let pmBig = [];
  const pmMin = pmCfg.minUsd ?? 1000;
  try {
    const got = await pageBack(pmPage(`filter_type=CASH&filter_amount=${pmMin}`), { ...win, maxPages: pmCfg.maxPages ?? 10, timeOf: pmTime });
    pmBig = got.rows.map((x) => mapPmTrade(x, pmCatalog)).filter((r) => r.usd >= pmMin);
    if (got.capped) log(`tape: polymarket large-trade feed capped at ${got.pages} pages; window undercounted`);
    for (const x of got.rows) {
      const id = String(x.condition_id || '');
      // lastSeen lets the resolution checker pick tape-only markets up once they stop trading.
      if (id && !pmCatalog[id]) pmCatalog[id] = { title: x.title || id, slug: x.slug || null, event: x.event_slug || null, tapeSeen: t, firstSeen: t, lastSeen: t };
    }
  } catch (e) { log(`tape: polymarket large trades skipped: ${e.message}`); }
  const pmFlowRows = [];
  for (let i = 0; i < pmIds.length; i += 20) {
    const batch = pmIds.slice(i, i + 20);
    try {
      const got = await pageBack(pmPage(`condition=${batch.join(',')}`), { ...win, maxPages: pmCfg.maxFlowPages ?? 3, timeOf: pmTime });
      pmFlowRows.push(...got.rows.map((x) => mapPmTrade(x, pmCatalog)));
      if (got.capped) for (const id of batch) capped.add(`pm:${id}`);
    } catch (e) { log(`tape: polymarket flow batch ${i / 20} skipped: ${e.message}`); }
    await sleep(pmCfg.pauseMs ?? 150);
  }

  // Kalshi: per watched ticker; the taker side is the outcome bought.
  const ksRows = [];
  const ksTime = (x) => Date.parse(x.created_time) / 1000;
  for (const ticker of ksTickers) {
    try {
      const got = await pageBack(async (cursor) => {
        const d = await fetchJson(`${KALSHI}/markets/trades?ticker=${encodeURIComponent(ticker)}&min_ts=${Math.floor(win.start)}&max_ts=${Math.ceil(win.end)}&limit=1000${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
        const rows = d?.trades || [];
        return { rows, cursor: d?.cursor || null, oldestSec: rows.length ? Math.min(...rows.map(ksTime)) : -Infinity };
      }, { ...win, maxPages: ksCfg.maxPagesPerTicker ?? 3, timeOf: ksTime });
      ksRows.push(...got.rows.map(mapKsTrade));
      if (got.capped) capped.add(`ks:${ticker}`);
    } catch (e) { log(`tape: kalshi ${ticker} skipped: ${e.message}`); }
    await sleep(ksCfg.pauseMs ?? 250);
  }

  const ksMin = ksCfg.minUsd ?? 1000;
  const seen = new Set();
  const key = (r) => `${r.v}|${r.id}|${r.t}|${r.o}|${r.s}|${r.p}|${r.n}|${r.w || ''}`;
  const big = [...pmBig, ...pmFlowRows.filter((r) => r.usd >= pmMin), ...ksRows.filter((r) => r.usd >= ksMin)]
    .filter((r) => { const k = key(r); if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((a, b) => (a.t < b.t ? -1 : a.t > b.t ? 1 : 0));
  const flow = [
    ...aggregateFlow(pmFlowRows, { t, from, minUsd: pmMin, capped }),
    ...aggregateFlow(ksRows, { t, from, minUsd: ksMin, capped }),
  ];

  // Profile the wallets behind large Polymarket trades: a days-old wallet making a large bet is the signal to study.
  const walletsPath = join(dataDir, 'catalog', 'wallets.json');
  const wallets = loadJson(walletsPath, {});
  let looked = 0;
  for (const w of walletsToLookup(big, wallets, nowSec, wCfg)) {
    try {
      const d = await fetchJson(`${PM_DATA}/user-stats?user=${w}`);
      wallets[w] = { firstSeen: wallets[w]?.firstSeen || t, ...wallets[w], ...mapWalletStats(d?.data, t) };
      looked++;
    } catch (e) { log(`tape: wallet ${w.slice(0, 10)} lookup skipped: ${e.message}`); }
    await sleep(wCfg.pauseMs ?? 150);
  }
  for (const r of big) if (r.w && !wallets[r.w]) wallets[r.w] = { firstSeen: t };

  log(`tape ${from}..${to}: ${big.length} large trades (pm ${big.filter((r) => r.v === 'pm').length}, ks ${big.filter((r) => r.v === 'ks').length}), flow rows ${flow.length}, ${capped.size} capped, ${looked} wallets profiled`);
  if (dryRun) {
    for (const r of big.slice(-3)) console.log(JSON.stringify(r));
    return { window: win, big: big.length, flow: flow.length, capped: capped.size };
  }
  const day = t.slice(0, 10);
  mkdirSync(join(dataDir, 'trades'), { recursive: true });
  mkdirSync(join(dataDir, 'flow'), { recursive: true });
  if (big.length) appendFileSync(join(dataDir, 'trades', `${day}.ndjson`), big.map((r) => JSON.stringify(r)).join('\n') + '\n');
  if (flow.length) appendFileSync(join(dataDir, 'flow', `${day}.ndjson`), flow.map((r) => JSON.stringify(r)).join('\n') + '\n');
  writeFileSync(walletsPath, JSON.stringify(wallets, null, 1) + '\n');
  writeFileSync(catPath, JSON.stringify(pmCatalog, null, 1) + '\n');
  writeFileSync(statePath, JSON.stringify({ end: win.end, at: t }, null, 1) + '\n');
  return { window: win, big: big.length, flow: flow.length, capped: capped.size };
}
