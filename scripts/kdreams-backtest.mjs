#!/usr/bin/env node
/**
 * kdreams-backtest — the evaluator. Reads data/snapshots/*.ndjson and reports
 * what the recorded top-of-book actually showed, per research surface.
 *
 * Observe-only. The maker model is a labeled proxy. No orders, no credentials.
 *
 * Usage: node scripts/kdreams-backtest.mjs [--json] [--summary] [--days N] [--out FILE]
 * Env:   KDREAMS_DATA (default data), KDREAMS_WATCHLIST (default config/kdreams.watchlist.json)
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  parseRows, groupSeries, spreadStats, makerSpreadProxy, sumProxies, crossVenue, byBucket, candidates, feeTable, mid, round,
} from './lib/kdreams-metrics.mjs';

function loadJson(path, fallback) {
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return fallback; }
}

export function loadRows(dataDir, days) {
  const dir = join(dataDir, 'snapshots');
  if (!existsSync(dir)) return { rows: [], files: [] };
  const files = readdirSync(dir).filter((f) => /^\d{4}-\d{2}-\d{2}\.ndjson$/.test(f)).sort().slice(-days);
  const rows = [];
  for (const f of files) rows.push(...parseRows(readFileSync(join(dir, f), 'utf8')));
  return { rows, files };
}

export function computeReport({ dataDir = 'data', watchlist = {}, days = 14 } = {}) {
  const { rows, files } = loadRows(dataDir, days);
  const catalogs = { pm: loadJson(join(dataDir, 'catalog', 'polymarket.json'), {}), ks: loadJson(join(dataDir, 'catalog', 'kalshi.json'), {}) };
  const fees = watchlist.fees || {};
  const horizon = watchlist.backtest?.horizonTicks ?? 4;
  const series = groupSeries(rows);
  const ticks = [...new Set(rows.map((r) => r.t))].sort();
  const pmRows = rows.filter((r) => r.v === 'pm'), ksRows = rows.filter((r) => r.v === 'ks');

  const proxy = { pm: [], ks: [] };
  for (const [key, s] of series) {
    const v = key.slice(0, 2);
    proxy[v].push(makerSpreadProxy(s, { horizon, tick: 0.01, makerFeeRate: v === 'pm' ? (fees.polymarketMakerRate ?? 0) : (fees.kalshiMakerRate ?? 0.0175) }));
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
    generatedFrom: { files, days, rows: rows.length, ticks: ticks.length, firstTick: ticks[0] || null, lastTick: lastT || null,
      marketsPm: [...series.keys()].filter((k) => k.startsWith('pm:')).length, marketsKs: [...series.keys()].filter((k) => k.startsWith('ks:')).length },
    spread: { pm: spreadStats(pmRows), ks: spreadStats(ksRows) },
    makerSpreadProxy: { horizonTicks: horizon, pm: sumProxies(proxy.pm), ks: sumProxies(proxy.ks) },
    crossVenue: pairs,
    byHour: { pm: byBucket(pmRows, 'hour'), ks: byBucket(ksRows, 'hour') },
    byWeekday: { pm: byBucket(pmRows, 'weekday'), ks: byBucket(ksRows, 'weekday') },
    candidates: candidates(series, catalogs, { top: 10 }),
    feeTable: feeTable(fees),
    topMarkets: { pm: topMarkets('pm'), ks: topMarkets('ks') },
  };
}

function pct(x) { return x === null || x === undefined ? 'n/a' : `${Math.round(x * 100)}%`; }
function num(x) { return x === null || x === undefined ? 'n/a' : String(x); }

export function renderSummary(r) {
  const g = r.generatedFrom;
  const L = [];
  L.push(`Coverage: ${g.rows} rows, ${g.ticks} ticks, ${g.marketsPm} Polymarket + ${g.marketsKs} Kalshi markets, ${g.firstTick || '-'} .. ${g.lastTick || '-'} (${g.files.length} day files).`);
  for (const v of ['pm', 'ks']) {
    const s = r.spread[v], m = r.makerSpreadProxy[v], name = v === 'pm' ? 'Polymarket' : 'Kalshi';
    L.push(`${name} spread: median ${num(s.medianCents)}c (p25 ${num(s.p25Cents)}, p75 ${num(s.p75Cents)}), one-tick ${pct(s.fracOneCent)} of ${s.twoSided} two-sided rows; touch median bid ${num(s.medianBidSize)} / ask ${num(s.medianAskSize)}.`);
    L.push(`${name} maker proxy (${r.makerSpreadProxy.horizonTicks}-tick horizon): ${m.attempts} attempts, fill ${pct(m.fillRate)}, round-trip ${pct(m.roundTripRate)}, net ${num(m.netCents)}c total = ${num(m.netCentsPerAttempt)}c/attempt (gross ${num(m.grossCents)}, fees ${num(m.feeCents)}, mark ${num(m.mtmCents)}).`);
  }
  if (r.crossVenue.length === 0) L.push('Cross-venue: no pairs configured in config/kdreams.watchlist.json yet.');
  for (const p of r.crossVenue) {
    L.push(`Pair ${p.kalshiTicker} vs ${p.polymarketId.slice(0, 10)}: n=${p.n}, mean |diff| ${num(p.meanAbsCents)}c, max ${num(p.maxAbsCents)}c, >2c ${pct(p.fracAbsGt2c)}; both-sides net-positive ${pct(p.bothSides.fracNetPositive)} (max ${num(p.bothSides.maxNetCents)}c); leads: ${p.leads || 'n/a'} (lag ${p.bestLag?.lag ?? 'n/a'}, r=${num(p.bestLag?.corr)}).`);
  }
  const hrs = r.byHour.pm.length ? r.byHour.pm.slice().sort((a, b) => b.fracOneCent - a.fracOneCent) : [];
  if (hrs.length) L.push(`Polymarket tightest UTC hours: ${hrs.slice(0, 3).map((h) => `${h.hour}h ${pct(h.fracOneCent)}`).join(', ')}; loosest: ${hrs.slice(-2).map((h) => `${h.hour}h ${pct(h.fracOneCent)}`).join(', ')}.`);
  if (r.candidates.length) L.push(`Top one-tick candidates: ${r.candidates.slice(0, 5).map((c) => `[${c.venue}] ${c.title.slice(0, 50)} (one-tick ${pct(c.fracOneCent)}, touch ${num(c.medianTouch)}, mid ${num(c.mid)})`).join('; ')}.`);
  const f50 = r.feeTable.find((x) => x.price === 0.5);
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
  out.push('_Maker model is a proxy: a resting order counts as filled only when the recorded price trades through its level; no queue position is modeled._');
  return out.join('\n');
}

export function main(argv = process.argv.slice(2)) {
  const get = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : undefined; };
  const watchlist = loadJson(process.env.KDREAMS_WATCHLIST || 'config/kdreams.watchlist.json', {});
  const days = Number(get('--days') || watchlist.backtest?.days || 14);
  const report = computeReport({ dataDir: process.env.KDREAMS_DATA || 'data', watchlist, days });
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
