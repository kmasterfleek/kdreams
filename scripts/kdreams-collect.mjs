#!/usr/bin/env node
/**
 * kdreams-collect — observe-only snapshot collector for Polymarket + Kalshi.
 *
 * No API keys, no accounts, no orders. Every run appends one NDJSON line per
 * watched market to data/snapshots/YYYY-MM-DD.ndjson and refreshes the
 * id -> metadata catalogs under data/catalog/. Dependency-free on purpose so
 * the 15-minute GitHub Actions job never has to `npm ci`.
 *
 * Row shape (keys fixed, numbers rounded):
 *   { t, v: "pm"|"ks", id, b, a, bs, as, last, v24, oi }
 *   b/a   best bid / best ask for YES (0..1)      bs/as  size at the touch (shares/contracts)
 *   last  last trade price (Kalshi only)          v24    24h volume (venue units)
 *   oi    Kalshi open interest; Polymarket liquidity number
 *
 * Settled markets also get one line each in data/resolutions.ndjson:
 *   { t, v, id, y, at }   y = what one YES share paid (0..1), at = settlement time
 * Candidates are catalog markets past their close time or no longer in the watched
 * set; each is re-checked at most every `resolutions.recheckMinutes`.
 *
 * Env:   KDREAMS_WATCHLIST (default config/kdreams.watchlist.json)
 *        KDREAMS_DATA      (default data)
 *        KDREAMS_NOW       (ISO override, for reproducible runs)
 * Usage: node scripts/kdreams-collect.mjs [--dry-run] [--rescan]
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const GAMMA = 'https://gamma-api.polymarket.com';
export const CLOB = 'https://clob.polymarket.com';
export const KALSHI = 'https://api.elections.kalshi.com/trade-api/v2';

const UA = 'kdreams-collect (observe-only; https://github.com/kmasterfleek/kdreams)';

export function round(x, d = 4) {
  if (x === null || x === undefined || x === '' || Number.isNaN(Number(x))) return null;
  const f = 10 ** d;
  return Math.round(Number(x) * f) / f;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function fetchJson(url, { retries = 2, timeoutMs = 20000 } = {}) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: ctrl.signal });
      if (res.status === 429 || res.status >= 500) {
        lastErr = new Error(`${res.status} ${url}`);
        await sleep(1000 * (i + 1));
        continue;
      }
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
      await sleep(500 * (i + 1));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr;
}

/** Best bid / best ask + sizes from a CLOB book (levels may arrive in either order). */
export function bestOfBook(book) {
  const bids = (book?.bids || []).map((l) => ({ p: Number(l.price), s: Number(l.size) })).filter((l) => l.p > 0);
  const asks = (book?.asks || []).map((l) => ({ p: Number(l.price), s: Number(l.size) })).filter((l) => l.p > 0);
  const bb = bids.length ? bids.reduce((m, l) => (l.p > m.p ? l : m)) : null;
  const ba = asks.length ? asks.reduce((m, l) => (l.p < m.p ? l : m)) : null;
  return { b: bb?.p ?? null, a: ba?.p ?? null, bs: bb?.s ?? null, as: ba?.s ?? null };
}

function parseJsonField(v, fallback = []) {
  if (Array.isArray(v)) return v;
  if (typeof v !== 'string') return fallback;
  try { return JSON.parse(v); } catch { return fallback; }
}

/** Gamma market (+ optional CLOB book for the YES token) -> snapshot row + catalog meta. */
export function mapPolymarket(m, book, t) {
  const tokens = parseJsonField(m.clobTokenIds);
  const touch = book ? bestOfBook(book) : { b: null, a: null, bs: null, as: null };
  const row = {
    t, v: 'pm', id: String(m.conditionId || m.id),
    b: round(touch.b ?? m.bestBid), a: round(touch.a ?? m.bestAsk),
    bs: round(touch.bs, 2), as: round(touch.as, 2),
    last: round(m.lastTradePrice),
    v24: round(m.volume24hr, 2), oi: round(m.liquidityNum, 2),
  };
  const meta = {
    title: m.question || m.slug || row.id, slug: m.slug || null, closeTime: m.endDate || null,
    tick: round(m.orderPriceMinTickSize) ?? null, minSize: round(m.orderMinSize) ?? null,
    yesToken: tokens[0] ?? null, noToken: tokens[1] ?? null, category: m.category || null,
  };
  return { row, meta };
}

/** Kalshi v2 market (dollar/fp string fields) -> snapshot row + catalog meta. */
export function mapKalshi(m, t, event) {
  const row = {
    t, v: 'ks', id: String(m.ticker),
    b: round(m.yes_bid_dollars), a: round(m.yes_ask_dollars),
    bs: round(m.yes_bid_size_fp, 2), as: round(m.yes_ask_size_fp, 2),
    last: round(m.last_price_dollars),
    v24: round(m.volume_24h_fp, 2), oi: round(m.open_interest_fp, 2),
  };
  const meta = {
    title: event?.title ? `${event.title} — ${m.yes_sub_title || m.title}` : (m.title || row.id),
    sub: m.yes_sub_title || null, closeTime: m.close_time || null, tick: 0.01, minSize: 1,
    series: event?.series_ticker || null, event: m.event_ticker || null, category: event?.category || null,
  };
  return { row, meta };
}

/** Gamma market -> resolution row, or null while unresolved. YES is outcome 0, as in mapPolymarket. */
export function pmResolution(m, t) {
  if (!m.closed || m.umaResolutionStatus !== 'resolved') return null;
  const y = round(parseJsonField(m.outcomePrices)[0]);
  if (y === null || y < 0 || y > 1) return null;
  const at = m.closedTime ? new Date(String(m.closedTime).replace(' ', 'T').replace(/\+00$/, 'Z')) : null;
  return { t, v: 'pm', id: String(m.conditionId), y, at: at && !Number.isNaN(at.getTime()) ? at.toISOString().slice(0, 16) + 'Z' : null };
}

/** Kalshi v2 market -> resolution row, or null while unsettled (voided markets never resolve). */
export function ksResolution(m, t) {
  const y = m.result === 'yes' ? 1 : m.result === 'no' ? 0 : null;
  if (y === null) return null;
  const at = m.settlement_ts || m.close_time || null;
  return { t, v: 'ks', id: String(m.ticker), y: round(m.settlement_value_dollars) ?? y, at: at ? String(at).slice(0, 16) + 'Z' : null };
}

/** Catalog ids worth asking about: past close or out of the watched set, unresolved, not checked recently. */
export function resolutionCandidates(catalog, resolved, checks, t, { recheckMinutes = 360, max = 200, staleMinutes = 120 } = {}) {
  const now = Date.parse(t);
  return Object.entries(catalog)
    .filter(([id, m]) => !resolved.has(id))
    .filter(([, m]) => (m.closeTime && Date.parse(m.closeTime) <= now) || (m.lastSeen && now - Date.parse(m.lastSeen) > staleMinutes * 60000))
    .filter(([id]) => !checks[id] || now - Date.parse(checks[id]) >= recheckMinutes * 60000)
    .sort(([a, x], [b, y]) => (checks[a] || '').localeCompare(checks[b] || '') || String(x.closeTime).localeCompare(String(y.closeTime)))
    .slice(0, max)
    .map(([id]) => id);
}

export function isPlainBinary(m) {
  return m.market_type === 'binary' && !m.mve_collection_ticker && (m.status === 'active' || m.status === 'open');
}

// ---------------------------------------------------------------------------

function loadJson(path, fallback) {
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return fallback; }
}

function mergeCatalog(catalog, id, meta, t) {
  const prev = catalog[id] || {};
  catalog[id] = { ...prev, ...stripNull(meta), firstSeen: prev.firstSeen || t, lastSeen: t };
}

function stripNull(o) {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined));
}

async function collectPolymarket(cfg, t, log) {
  const n = cfg.topByVolume24h ?? 100;
  const markets = await fetchJson(`${GAMMA}/markets?limit=${n}&active=true&closed=false&order=volume24hr&ascending=false`);
  for (const slug of cfg.extraSlugs || []) {
    try {
      const extra = await fetchJson(`${GAMMA}/markets?slug=${encodeURIComponent(slug)}`);
      for (const m of extra) if (!markets.some((x) => x.id === m.id)) markets.push(m);
    } catch (e) { log(`polymarket slug ${slug} skipped: ${e.message}`); }
  }
  const depthTop = cfg.bookDepthTop ?? 0;
  const out = [];
  for (let i = 0; i < markets.length; i++) {
    const m = markets[i];
    let book = null;
    const yes = parseJsonField(m.clobTokenIds)[0];
    if (i < depthTop && yes) {
      try { book = await fetchJson(`${CLOB}/book?token_id=${yes}`); await sleep(120); }
      catch (e) { log(`book ${m.slug} skipped: ${e.message}`); }
    }
    out.push(mapPolymarket(m, book, t));
  }
  return out;
}

/** Full open-events scan (~70 pages). Only run when the top list is stale. */
async function scanKalshiTop(n, log) {
  const seen = [];
  let cursor = null;
  for (let page = 0; page < 200; page++) {
    const q = `${KALSHI}/events?limit=200&status=open&with_nested_markets=true${cursor ? `&cursor=${cursor}` : ''}`;
    const d = await fetchJson(q);
    for (const e of d.events || []) {
      for (const m of e.markets || []) {
        if (!isPlainBinary(m)) continue;
        seen.push({ ticker: m.ticker, v24: Number(m.volume_24h_fp || 0), event: { title: e.title, series_ticker: e.series_ticker, category: e.category } });
      }
    }
    cursor = d.cursor;
    if (!cursor) break;
    await sleep(100);
  }
  seen.sort((x, y) => y.v24 - x.v24);
  log(`kalshi rescan: ${seen.length} plain binary markets scanned`);
  const top = seen.slice(0, n);
  return { tickers: top.map((x) => x.ticker), events: Object.fromEntries(top.map((x) => [x.ticker, x.event])) };
}

async function collectKalshi(cfg, t, dataDir, flags, log) {
  const topPath = join(dataDir, 'catalog', 'kalshi-top.json');
  let top = loadJson(topPath, null);
  const stale = !top || !top.scannedAt || (Date.parse(t) - Date.parse(top.scannedAt)) > (cfg.rescanEveryMinutes ?? 360) * 60000;
  if (stale || flags.rescan) {
    const scanned = await scanKalshiTop(cfg.topByVolume24h ?? 100, log);
    top = { scannedAt: t, ...scanned };
    if (!flags.dryRun) { mkdirSync(join(dataDir, 'catalog'), { recursive: true }); writeFileSync(topPath, JSON.stringify(top, null, 2) + '\n'); }
  }
  const tickers = [...new Set([...(top.tickers || []), ...(cfg.extraTickers || [])])];
  const out = [];
  for (let i = 0; i < tickers.length; i += 50) {
    const batch = tickers.slice(i, i + 50);
    const d = await fetchJson(`${KALSHI}/markets?limit=100&tickers=${batch.join(',')}`);
    for (const m of d.markets || []) out.push(mapKalshi(m, t, top.events?.[m.ticker]));
    await sleep(100);
  }
  return out;
}

async function fetchResolutions(venue, ids, t) {
  const out = [];
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    if (venue === 'polymarket') {
      const ms = await fetchJson(`${GAMMA}/markets?${batch.map((id) => `condition_ids=${id}`).join('&')}&closed=true&limit=100`);
      for (const m of ms) { const r = pmResolution(m, t); if (r) out.push(r); }
    } else {
      const d = await fetchJson(`${KALSHI}/markets?limit=100&tickers=${batch.join(',')}`);
      for (const m of d.markets || []) { const r = ksResolution(m, t); if (r) out.push(r); }
    }
    await sleep(150);
  }
  return out;
}

/** Append newly settled markets to data/resolutions.ndjson. Never fails the snapshot run. */
async function collectResolutions(cfg, dataDir, t, flags, log) {
  const file = join(dataDir, 'resolutions.ndjson');
  const checksPath = join(dataDir, 'catalog', 'resolution-checks.json');
  const resolved = new Set(existsSync(file) ? readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l).id; } catch { return null; } }) : []);
  const checks = loadJson(checksPath, {});
  const rows = [];
  for (const venue of ['polymarket', 'kalshi']) {
    const catalog = loadJson(join(dataDir, 'catalog', `${venue}.json`), {});
    const ids = resolutionCandidates(catalog, resolved, checks, t, cfg);
    if (!ids.length) continue;
    try {
      const got = await fetchResolutions(venue, ids, t);
      for (const id of ids) checks[id] = t;
      rows.push(...got.filter((r) => !resolved.has(r.id)));
      log(`resolutions ${venue}: ${got.length} settled of ${ids.length} checked`);
    } catch (e) { log(`resolutions ${venue} skipped: ${e.message}`); }
  }
  if (flags.dryRun) return rows.length;
  for (const r of rows) delete checks[r.id];
  if (rows.length) appendFileSync(file, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
  writeFileSync(checksPath, JSON.stringify(checks, null, 1) + '\n');
  return rows.length;
}

export async function main(argv = process.argv.slice(2)) {
  const flags = { dryRun: argv.includes('--dry-run'), rescan: argv.includes('--rescan') };
  const log = (s) => console.log(`[kdreams-collect] ${s}`);
  const wl = loadJson(process.env.KDREAMS_WATCHLIST || 'config/kdreams.watchlist.json', {});
  const dataDir = process.env.KDREAMS_DATA || 'data';
  const now = process.env.KDREAMS_NOW ? new Date(process.env.KDREAMS_NOW) : new Date();
  const t = now.toISOString().slice(0, 16) + 'Z';

  const results = await Promise.allSettled([
    collectPolymarket(wl.polymarket || {}, t, log),
    collectKalshi(wl.kalshi || {}, t, dataDir, flags, log),
  ]);
  const pm = results[0].status === 'fulfilled' ? results[0].value : (log(`polymarket failed: ${results[0].reason?.message}`), []);
  const ks = results[1].status === 'fulfilled' ? results[1].value : (log(`kalshi failed: ${results[1].reason?.message}`), []);
  const all = [...pm, ...ks];
  log(`t=${t} pm=${pm.length} ks=${ks.length}`);

  if (flags.dryRun) {
    for (const x of all.slice(0, 3)) console.log(JSON.stringify(x.row));
    const settled = await collectResolutions(wl.resolutions || {}, dataDir, t, flags, log).catch((e) => (log(`resolutions failed: ${e.message}`), 0));
    log(`dry run: ${all.length} rows and ${settled} resolutions not written`);
    return { t, pm: pm.length, ks: ks.length };
  }
  if (all.length === 0) throw new Error('both venues failed; nothing to write');

  mkdirSync(join(dataDir, 'snapshots'), { recursive: true });
  mkdirSync(join(dataDir, 'catalog'), { recursive: true });
  const day = join(dataDir, 'snapshots', `${t.slice(0, 10)}.ndjson`);
  appendFileSync(day, all.map((x) => JSON.stringify(x.row)).join('\n') + '\n');

  for (const [venue, rows] of [['polymarket', pm], ['kalshi', ks]]) {
    if (rows.length === 0) continue;
    const path = join(dataDir, 'catalog', `${venue}.json`);
    const catalog = existsSync(path) ? loadJson(path, {}) : {};
    for (const x of rows) mergeCatalog(catalog, x.row.id, x.meta, t);
    writeFileSync(path, JSON.stringify(catalog, null, 1) + '\n');
  }
  log(`wrote ${all.length} rows to ${day}`);
  const settled = await collectResolutions(wl.resolutions || {}, dataDir, t, flags, log).catch((e) => (log(`resolutions failed: ${e.message}`), 0));
  if (settled) log(`appended ${settled} resolutions`);
  return { t, pm: pm.length, ks: ks.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
