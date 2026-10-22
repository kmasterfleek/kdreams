#!/usr/bin/env node
/**
 * kdreams-backtest — the evaluator. Reads data/snapshots/*.ndjson and reports
 * what the recorded top-of-book actually showed, per research surface.
 *
 * Observe-only. The maker model is a labeled proxy. No orders, no credentials.
 *
 * Usage: node scripts/kdreams-backtest.mjs [--json] [--summary] [--days N] [--since ISO] [--out FILE]
 * Env:   KDREAMS_DATA (default data), KDREAMS_WATCHLIST (default config/kdreams.watchlist.json)
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  parseRows, groupSeries, spreadStats, makerSpreadProxy, sumProxies, crossVenue, byBucket, candidates, feeTable, mid, round, medianGapMinutes, sliceFilter,
  parseResolutions, holdToResolution,
} from './lib/kdreams-metrics.mjs';

function loadJson(path, fallback) {
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return fallback; }
}

/** Rows from the last `days` day files; with `since`, only rows strictly after that tick. */
export function loadRows(dataDir, days, since = null) {
  const dir = join(dataDir, 'snapshots');
  if (!existsSync(dir)) return { rows: [], files: [] };
  const files = readdirSync(dir).filter((f) => /^\d{4}-\d{2}-\d{2}\.ndjson$/.test(f)).sort().slice(-days)
    .filter((f) => !since || f.slice(0, 10) >= since.slice(0, 10));
  const rows = [];
  for (const f of files) rows.push(...parseRows(readFileSync(join(dir, f), 'utf8')).filter((r) => !since || r.t > since));
  return { rows, files };
}

/** Settled markets from data/resolutions.ndjson, keyed "v:id". */
export function loadResolutions(dataDir) {
  const path = join(dataDir, 'resolutions.ndjson');
  return existsSync(path) ? parseResolutions(readFileSync(path, 'utf8')) : new Map();
}

export function loadCatalogs(dataDir) {
  return { pm: loadJson(join(dataDir, 'catalog', 'polymarket.json'), {}), ks: loadJson(join(dataDir, 'catalog', 'kalshi.json'), {}) };
}

/** Entry-price bands the report always shows for hold-to-resolution. */
export const RESOLUTION_BANDS = [[0.5, 0.9], [0.9, 0.95], [0.95, 0.97], [0.97, 0.99], [0.99, 1]];

export function computeReport({ dataDir = 'data', watchlist = {}, days = 14, since = null } = {}) {
  const { rows, files } = loadRows(dataDir, days, since);
  const catalogs = loadCatalogs(dataDir);
  const resolutions = loadResolutions(dataDir);
  const fees = watchlist.fees || {};
  const horizon = watchlist.backtest?.horizonTicks ?? 4;
  const horizonMinutes = watchlist.backtest?.horizonMinutes ?? null;
  const series = groupSeries(rows);
  const ticks = [...new Set(rows.map((r) => r.t))].sort();
  const pmRows = rows.filter((r) => r.v === 'pm'), ksRows = rows.filter((r) => r.v === 'ks');

  const proxy = { pm: [], ks: [] };
  for (const [key, s] of series) {
    const v = key.slice(0, 2);
    proxy[v].push(makerSpreadProxy(s, { horizon, horizonMinutes, tick: 0.01, makerFeeRate: v === 'pm' ? (fees.polymarketMakerRate ?? 0) : (fees.kalshiMakerRate ?? 0.0175) }));
  }

  const pairs = (watchlist.pairs || []).map((p) => {
    const pm = series.get(`pm:${p.polymarketId}`) || [], ks = series.get(`ks:${p.kalshiTicker}`) || [];
    return { ...p, pmTitle: catalogs.pm[p.polymarketId]?.title || null, ksTitle: catalogs.ks[p.kalshiTicker]?.title || null, ...crossVenue(pm, ks, fees) };
  });

  const lastT = ticks[ticks.length - 1];
  const topMarkets = (v) => rows.filter((r) => r.v === v && r.t === lastT)
    .sort((x, y) => (y.v24 || 0) - (x.v24 || 0)).slice(0, 30)
    .map((r) => ({ id: r.id, title: catalogs[v][r.id]?.title || r.id, mid: round(mid(r), 3), spreadCents: r.a !== null && r.b !== null ? round((r.a - r.b) * 100) : null, v24: round(r.v24) }));

  return {
    generatedFrom: { files, days, since, rows: rows.length, medianGapMinutes: medianGapMinutes(ticks), ticks: ticks.length, firstTick: ticks[0] || null, lastTick: lastT || null,
      marketsPm: [...series.keys()].filter((k) => k.startsWith('pm:')).length, marketsKs: [...series.keys()].filter((k) => k.startsWith('ks:')).length },
    spread: { pm: spreadStats(pmRows), ks: spreadStats(ksRows) },
    makerSpreadProxy: { horizonTicks: horizon, horizonMinutes, pm: sumProxies(proxy.pm), ks: sumProxies(proxy.ks) },
    crossVenue: pairs,
    byHour: { pm: byBucket(pmRows, 'hour'), ks: byBucket(ksRows, 'hour') },
    byWeekday: { pm: byBucket(pmRows, 'weekday'), ks: byBucket(ksRows, 'weekday') },
    candidates: candidates(series, catalogs, { top: 10 }),
    feeTable: feeTable(fees),
    topMarkets: { pm: topMarkets('pm'), ks: topMarkets('ks') },
    holdToResolution: {
      settled: resolutions.size,
      bands: ['pm', 'ks'].flatMap((v) => RESOLUTION_BANDS.map(([lo, hi]) => ({
        venue: v, priceMin: lo, priceMax: hi, ...holdToResolution(v === 'pm' ? pmRows : ksRows, resolutions, catalogs, { fees, slice: { priceMin: lo, priceMax: hi } }),
      }))),
    },
  };
}

// ---------------------------------------------------------------------------
// Gradeable hypotheses. A spec names one number this evaluator computes, the
// slice it is computed on, and a threshold, so a re-test is arithmetic on
// post-freeze rows rather than a judgment call.

/** Metrics a hypothesis spec may name: kind says whether it needs `venue` or `pair`; n is what counts as the sample. */
export const SPEC_METRICS = {
  'spread.fracOneCent': { kind: 'venue', n: 'two-sided rows', unit: 'share 0..1 of two-sided rows at a one-tick spread' },
  'spread.medianCents': { kind: 'venue', n: 'two-sided rows', unit: 'cents' },
  'maker.fillRate': { kind: 'venue', n: 'attempts', unit: 'share 0..1 of maker-proxy attempts that filled' },
  'maker.roundTripRate': { kind: 'venue', n: 'fills', unit: 'share 0..1 of fills that exited one tick higher' },
  'maker.netCentsPerAttempt': { kind: 'venue', n: 'attempts', unit: 'cents per maker-proxy attempt after maker fees and marks' },
  'pair.meanAbsCents': { kind: 'pair', n: 'aligned snapshots', unit: 'cents of mean |mid difference|' },
  'pair.fracAbsGt2c': { kind: 'pair', n: 'aligned snapshots', unit: 'share 0..1 of aligned snapshots more than 2c apart' },
  'pair.bothSidesFracNetPositive': { kind: 'pair', n: 'both-sides checks', unit: 'share 0..1 of buy-both-sides checks net positive after taker fees' },
  'resolution.netCentsPer10': { kind: 'venue', n: 'resolved markets entered', unit: 'net cents per $10 bought at the touch on the favored side and held to settlement, after taker fees' },
  'resolution.winRate': { kind: 'venue', n: 'resolved markets entered', unit: 'share 0..1 of those entries whose side paid more than its price' },
};

const RESOLUTION_SLICE_KEYS = ['priceMin', 'priceMax', 'hoursToClose'];

/** Why a spec cannot be graded, or null when it can. */
export function validateSpec(spec, pairs = []) {
  if (!spec || typeof spec !== 'object') return 'no spec';
  const m = SPEC_METRICS[spec.metric];
  if (!m) return `unknown metric "${spec.metric}"`;
  if (m.kind === 'venue' && !['pm', 'ks'].includes(spec.venue)) return `${spec.metric} needs venue "pm" or "ks"`;
  if (m.kind === 'pair' && !pairs.some((p) => p.name === spec.pair)) return `${spec.metric} needs a configured pair name (${pairs.map((p) => p.name).join(', ') || 'none configured'})`;
  if (!['>', '<'].includes(spec.op)) return 'op must be ">" or "<"';
  if (!Number.isFinite(spec.threshold)) return 'threshold must be a number';
  const sl = spec.slice || {};
  for (const k of Object.keys(sl)) if (!['hoursUtc', 'midMin', 'midMax', ...RESOLUTION_SLICE_KEYS].includes(k)) return `unknown slice key "${k}"`;
  const isRes = spec.metric.startsWith('resolution.');
  for (const k of RESOLUTION_SLICE_KEYS) if (sl[k] !== undefined && !isRes) return `slice.${k} only applies to resolution.* metrics`;
  if (isRes && (sl.midMin !== undefined || sl.midMax !== undefined)) return 'resolution.* metrics slice on priceMin/priceMax (the entry price of the side bought), not mid';
  for (const k of ['priceMin', 'priceMax']) if (sl[k] !== undefined && !(Number.isFinite(sl[k]) && sl[k] >= 0.5 && sl[k] <= 1)) return `slice.${k} must be within 0.5..1 (the favored side)`;
  if (sl.priceMin !== undefined && sl.priceMax !== undefined && !(sl.priceMin < sl.priceMax)) return 'slice.priceMin must be below priceMax';
  if (sl.hoursToClose !== undefined && !(Array.isArray(sl.hoursToClose) && sl.hoursToClose.length === 2 && sl.hoursToClose.every((x) => Number.isFinite(x) && x >= 0) && sl.hoursToClose[0] < sl.hoursToClose[1])) return 'slice.hoursToClose must be [min, max) hours with 0 <= min < max';
  if (sl.hoursUtc !== undefined && !(Array.isArray(sl.hoursUtc) && sl.hoursUtc.length === 2 && sl.hoursUtc.every((x) => Number.isInteger(x) && x >= 0 && x <= 24) && sl.hoursUtc[0] !== sl.hoursUtc[1])) return 'slice.hoursUtc must be [from, to] whole UTC hours, from != to';
  for (const k of ['midMin', 'midMax']) if (sl[k] !== undefined && !(Number.isFinite(sl[k]) && sl[k] >= 0 && sl[k] <= 1)) return `slice.${k} must be within 0..1`;
  if (spec.minN !== undefined && !(Number.isInteger(spec.minN) && spec.minN > 0)) return 'minN must be a positive integer';
  return null;
}

/** The spec's metric and sample size over `rows`. Assumes validateSpec passed. */
export function measureSpecRows(rows, spec, watchlist = {}, { resolutions = new Map(), catalogs = {} } = {}) {
  const def = SPEC_METRICS[spec.metric];
  const keep = sliceFilter(spec.slice || {});
  const fees = watchlist.fees || {};
  const field = spec.metric.split('.')[1];
  if (def.kind === 'pair') {
    const p = (watchlist.pairs || []).find((x) => x.name === spec.pair);
    const series = groupSeries(rows);
    const cv = crossVenue((series.get(`pm:${p.polymarketId}`) || []).filter(keep), (series.get(`ks:${p.kalshiTicker}`) || []).filter(keep), fees);
    if (field === 'bothSidesFracNetPositive') return { value: cv.bothSides.fracNetPositive, n: cv.bothSides.checks };
    return { value: cv[field], n: cv.n };
  }
  const venueRows = rows.filter((r) => r.v === spec.venue);
  if (spec.metric.startsWith('resolution.')) {
    const h = holdToResolution(venueRows, resolutions, catalogs, { fees, slice: spec.slice || {} });
    return { value: h[field], n: h.markets };
  }
  if (spec.metric.startsWith('spread.')) {
    const st = spreadStats(venueRows.filter(keep));
    return { value: st[field], n: st.twoSided };
  }
  const bt = watchlist.backtest || {};
  const makerFeeRate = spec.venue === 'pm' ? (fees.polymarketMakerRate ?? 0) : (fees.kalshiMakerRate ?? 0.0175);
  const sum = sumProxies([...groupSeries(venueRows).values()].map((s) => makerSpreadProxy(s, {
    horizon: bt.horizonTicks ?? 4, horizonMinutes: bt.horizonMinutes ?? null, tick: 0.01, makerFeeRate, entryFilter: keep,
  })));
  return { value: sum[field], n: field === 'roundTripRate' ? sum.fills : sum.attempts };
}

export function measureSpec({ dataDir = 'data', watchlist = {}, days = 14, since = null, spec }) {
  return measureSpecRows(loadRows(dataDir, days, since).rows, spec, watchlist, { resolutions: loadResolutions(dataDir), catalogs: loadCatalogs(dataDir) });
}

/** SUPPORTED / REFUTED once the sample reaches max(spec.minN, floor); INCONCLUSIVE below it. */
export function gradeSpec(spec, { value, n }, floor = 100) {
  const need = Math.max(spec.minN ?? 0, floor);
  if (value === null || value === undefined) return { verdict: 'INCONCLUSIVE', note: `${spec.metric} not measurable on post-freeze data (n=${n})` };
  if (n < need) return { verdict: 'INCONCLUSIVE', note: `${spec.metric} = ${value} on n=${n}, below the n>=${need} needed` };
  const holds = spec.op === '>' ? value > spec.threshold : value < spec.threshold;
  return { verdict: holds ? 'SUPPORTED' : 'REFUTED', note: `${spec.metric} = ${value} vs ${spec.op} ${spec.threshold} on n=${n}` };
}

/** One line naming exactly what a spec measures. */
export function describeSpec(spec) {
  const sl = spec.slice || {};
  const parts = [spec.venue ? `venue ${spec.venue}` : `pair ${spec.pair}`];
  if (sl.hoursUtc) parts.push(`UTC ${sl.hoursUtc[0]}h-${sl.hoursUtc[1]}h`);
  if (sl.midMin !== undefined || sl.midMax !== undefined) parts.push(`mid ${sl.midMin ?? 0}..${sl.midMax ?? 1}`);
  if (sl.priceMin !== undefined || sl.priceMax !== undefined) parts.push(`entry ${sl.priceMin ?? 0.5}..${sl.priceMax ?? 1}`);
  if (sl.hoursToClose) parts.push(`${sl.hoursToClose[0]}-${sl.hoursToClose[1]}h to close`);
  return `${spec.metric} ${spec.op} ${spec.threshold} (${parts.join(', ')}${spec.minN ? `, n>=${spec.minN}` : ''})`;
}

function pct(x) { return x === null || x === undefined ? 'n/a' : `${Math.round(x * 100)}%`; }
function num(x) { return x === null || x === undefined ? 'n/a' : String(x); }

export function renderSummary(r) {
  const g = r.generatedFrom;
  const L = [];
  L.push(`Coverage: ${g.rows} rows, ${g.ticks} ticks, ${g.marketsPm} Polymarket + ${g.marketsKs} Kalshi markets, ${g.firstTick || '-'} .. ${g.lastTick || '-'} (${g.files.length} day files${g.since ? `, after ${g.since}` : ''}); median gap between ticks ${num(g.medianGapMinutes)} min.`);
  const h = r.makerSpreadProxy.horizonMinutes ? `${r.makerSpreadProxy.horizonMinutes}-minute` : `${r.makerSpreadProxy.horizonTicks}-tick`;
  for (const v of ['pm', 'ks']) {
    const s = r.spread[v], m = r.makerSpreadProxy[v], name = v === 'pm' ? 'Polymarket' : 'Kalshi';
    L.push(`${name} spread: median ${num(s.medianCents)}c (p25 ${num(s.p25Cents)}, p75 ${num(s.p75Cents)}), one-tick ${pct(s.fracOneCent)} of ${s.twoSided} two-sided rows; touch median bid ${num(s.medianBidSize)} / ask ${num(s.medianAskSize)}.`);
    L.push(`${name} maker proxy (${h} horizon): ${m.attempts} attempts (${m.unobserved ?? 0} unobservable: no later snapshot inside the horizon), fill ${pct(m.fillRate)}, round-trip ${pct(m.roundTripRate)}, net ${num(m.netCents)}c total = ${num(m.netCentsPerAttempt)}c/attempt (gross ${num(m.grossCents)}, fees ${num(m.feeCents)}, mark ${num(m.mtmCents)}).`);
  }
  if (r.crossVenue.length === 0) L.push('Cross-venue: no pairs configured in config/kdreams.watchlist.json yet.');
  for (const p of r.crossVenue) {
    L.push(`Pair ${p.kalshiTicker} vs ${p.polymarketId.slice(0, 10)}: n=${p.n}, mean |diff| ${num(p.meanAbsCents)}c, max ${num(p.maxAbsCents)}c, >2c ${pct(p.fracAbsGt2c)}; both-sides net-positive ${pct(p.bothSides.fracNetPositive)} (max ${num(p.bothSides.maxNetCents)}c); leads: ${p.leads || 'n/a'} (lag ${p.bestLag?.lag ?? 'n/a'}, r=${num(p.bestLag?.corr)}).`);
  }
  const hrs = r.byHour.pm.length ? r.byHour.pm.slice().sort((a, b) => b.fracOneCent - a.fracOneCent) : [];
  if (hrs.length) L.push(`Polymarket tightest UTC hours: ${hrs.slice(0, 3).map((h) => `${h.hour}h ${pct(h.fracOneCent)}`).join(', ')}; loosest: ${hrs.slice(-2).map((h) => `${h.hour}h ${pct(h.fracOneCent)}`).join(', ')}.`);
  if (r.candidates.length) L.push(`Top one-tick candidates: ${r.candidates.slice(0, 5).map((c) => `[${c.venue}] ${c.title.slice(0, 50)} (one-tick ${pct(c.fracOneCent)}, touch ${num(c.medianTouch)}, mid ${num(c.mid)})`).join('; ')}.`);
  const f50 = r.feeTable.find((x) => x.price === 0.5);
  const hr = r.holdToResolution;
  if (hr) {
    const best = hr.bands.filter((b) => b.markets >= 20 && b.netCentsPer10 > 0).sort((a, b) => b.netCentsPer10 - a.netCentsPer10)[0];
    L.push(`Hold to resolution (${hr.settled} settled markets recorded; buy the favored side with $10 at the first snapshot in a price band, hold to settlement, taker fees in): ` +
      hr.bands.filter((b) => b.markets).map((b) => `${b.venue} ${b.priceMin}-${b.priceMax} n=${b.markets} win ${pct(b.winRate)} net ${num(b.netCentsPer10)}c/$10`).join('; ') +
      (best ? `. Best net-positive band with n >= 20: ${best.venue} ${best.priceMin}-${best.priceMax}.` : '. No band with n >= 20 is net positive yet.'));
  }
  if (f50) L.push(`Fees at 50c per contract: PM taker ${f50.pmTaker}c / maker ${f50.pmMaker}c; Kalshi taker ${f50.ksTaker}c / maker ${f50.ksMaker}c. One-cent maker round trip nets ${f50.oneCentMakerRoundTripNet.polymarket}c on PM, ${f50.oneCentMakerRoundTripNet.kalshi}c on Kalshi.`);
  return L.join('\n');
}

export function renderMarkdown(r) {
  const out = ['## Evidence (recorded top-of-book, observe-only)', '', ...renderSummary(r).split('\n').map((l) => `- ${l}`), ''];
  if (r.candidates.length) {
    out.push('| venue | market | one-tick | touch | mid | 24h vol |', '|---|---|---|---|---|---|');
    for (const c of r.candidates) out.push(`| ${c.venue} | ${c.title.slice(0, 60)} | ${pct(c.fracOneCent)} | ${num(c.medianTouch)} | ${num(c.mid)} | ${num(c.v24)} |`);
    out.push('');
  }
  const hr = r.holdToResolution;
  if (hr?.bands.some((b) => b.markets)) {
    out.push('| venue | entry price | markets | unsized | win rate | net c per $10 | worst c | median hold h |', '|---|---|---|---|---|---|---|---|');
    for (const b of hr.bands) if (b.markets) out.push(`| ${b.venue} | ${b.priceMin}-${b.priceMax} | ${b.markets} | ${b.unsized} | ${pct(b.winRate)} | ${num(b.netCentsPer10)} | ${num(b.worstCents)} | ${num(b.medianHoldHours)} |`);
    out.push('', '_Hold to resolution counts only markets that have already settled, so long-dated markets are under-represented; one entry per market (per event on Kalshi)._', '');
  }
  out.push('_Maker model is a proxy: a resting order counts as filled only when the recorded price trades through its level; no queue position is modeled._');
  return out.join('\n');
}

export function main(argv = process.argv.slice(2)) {
  const get = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : undefined; };
  const watchlist = loadJson(process.env.KDREAMS_WATCHLIST || 'config/kdreams.watchlist.json', {});
  const days = Number(get('--days') || watchlist.backtest?.days || 14);
  const report = computeReport({ dataDir: process.env.KDREAMS_DATA || 'data', watchlist, days, since: get('--since') || null });
  const out = get('--out');
  if (out) writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
  if (argv.includes('--json')) console.log(JSON.stringify(report, null, 2));
  else if (argv.includes('--summary')) console.log(renderSummary(report));
  else console.log(renderMarkdown(report));
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { main(); } catch (e) { console.error(e); process.exit(1); }
}
