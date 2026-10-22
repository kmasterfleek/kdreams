import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { bestOfBook, mapPolymarket, mapKalshi, isPlainBinary, round, pmResolution, ksResolution, resolutionCandidates } from './kdreams-collect.mjs';
import {
  parseRows, groupSeries, spreadStats, makerSpreadProxy, sumProxies, crossVenue, byBucket, candidates, feeTable, quantile, corr, medianGapMinutes, mid, sliceFilter,
} from './lib/kdreams-metrics.mjs';
import { computeReport, renderSummary, renderMarkdown, validateSpec, measureSpecRows, gradeSpec, describeSpec } from './kdreams-backtest.mjs';
import { priorNightFates, reasoningFor, extractHypothesis, extractSpec, specInstructions, planRetests, fatesSummary, cell, isProfitSpec, specRejection, scorecard } from './kdreams-nightly.mjs';

test('nightly: importing the module never runs the pipeline, and helpers behave', () => {
  // Importing above must not have filed anything or touched the ledger: the guard is the test.
  const dir = mkdtempSync(join(tmpdir(), 'kdreams-ledger-'));
  const header = '| Date | Deep | Finding | Issue | PR | Evaluated? | Verdict | Effect | Witness | Prior-night fates |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n';
  writeFileSync(join(dir, 'empty.md'), header);
  writeFileSync(join(dir, 'one.md'), header + '| 2026-10-14 | fee-modeling | Given X | #1 | NONE | no | INCONCLUSIVE | 200 rows | fc0fe92c | first night |\n');
  writeFileSync(join(dir, 'two.md'), header + '| 2026-10-14 | a | x | #1 | NONE | no | INCONCLUSIVE | e | w | first night |\n| 2026-10-15 | lead-lag | y | #3 | #4 | no | REJECT | e | w | 2026-10-14 a INCONCLUSIVE #1 |\n');
  assert.equal(priorNightFates(join(dir, 'missing.md')), 'first night');
  assert.equal(priorNightFates(join(dir, 'empty.md')), 'first night');
  assert.equal(priorNightFates(join(dir, 'one.md')), '2026-10-14 fee-modeling INCONCLUSIVE #1');
  assert.equal(priorNightFates(join(dir, 'two.md')), '2026-10-15 lead-lag REJECT #3 #4');
  assert.deepEqual(reasoningFor('deepseek/deepseek-v4-flash'), { effort: 'low', exclude: true });
  assert.deepEqual(reasoningFor('openai/gpt-5-nano'), { effort: 'low', exclude: true });
  assert.deepEqual(reasoningFor('qwen/qwen3.7-flash'), { max_tokens: 1500, exclude: true });
});

test('nightly: hypothesis extraction, re-test parsing, planning and ledger summary', () => {
  assert.equal(extractHypothesis('## Hypothesis\n**Given A, when B, then C.**\n## Next'), 'Given A, when B, then C.');
  assert.equal(extractHypothesis('no hypothesis here'), null);
  assert.deepEqual(extractSpec('## Hypothesis spec\n```json\n{"metric": "maker.fillRate", "venue": "pm", "op": ">", "threshold": 0.2}\n```'), { metric: 'maker.fillRate', venue: 'pm', op: '>', threshold: 0.2 });
  assert.equal(extractSpec('```json\n{not json}\n```'), null);
  assert.equal(extractSpec('no block'), null);
  assert.match(specInstructions([{ name: 'house-r' }]), /maker\.netCentsPerAttempt[\s\S]*Configured pair names: house-r/);
  assert.equal(cell('a | b\n c'), 'a / b c');
  const hyps = [
    { id: '2026-09-01', date: '2026-09-01', frozenAt: '2026-09-01T10:00Z', status: 'open' },
    { id: '2026-10-14', date: '2026-10-14', frozenAt: '2026-10-14T19:13Z', status: 'open' },
    { id: '2026-10-15', date: '2026-10-15', frozenAt: '2026-10-15T10:10Z', status: 'open' },
    { id: '2026-10-16', date: '2026-10-16', frozenAt: '2026-10-16T09:38Z', status: 'open' },
    { id: '2026-10-10', date: '2026-10-10', frozenAt: '2026-10-10T09:00Z', status: 'REFUTED' },
  ];
  const ticks = { '2026-10-14': 60, '2026-10-15': 50, '2026-10-16': 3 };
  const plan = planRetests(hyps, { date: '2026-10-17', days: 14, minTicks: 48, maxOpen: 5 }, (h) => ticks[h.id]);
  assert.deepEqual(plan.expired.map((h) => h.id), ['2026-09-01']);
  assert.deepEqual(plan.due.map((x) => x.h.id), ['2026-10-15', '2026-10-14']);
  assert.deepEqual(plan.tooSoon.map((x) => x.h.id), ['2026-10-16']);
  // Tonight's own (re-run) hypothesis is never re-tested against itself.
  assert.equal(planRetests(hyps, { date: '2026-10-16' }, () => 99).due.some((x) => x.h.id === '2026-10-16'), false);
  assert.equal(fatesSummary([{ id: '2026-10-15', verdict: 'REFUTED', ticks: 50 }, { id: '2026-09-01', verdict: 'EXPIRED' }]), '10-15 REFUTED (50t); 09-01 EXPIRED');
  assert.equal(fatesSummary([]), '');
});

const T = (i) => `2026-10-14T${String(10 + Math.floor(i / 4)).padStart(2, '0')}:${String((i % 4) * 15).padStart(2, '0')}Z`;
const round2 = (x) => Math.round(x * 100) / 100;
const pm = (i, b, a, extra = {}) => ({ t: T(i), v: 'pm', id: 'c1', b, a, bs: 1000, as: 900, last: null, v24: 5000, oi: 100, ...extra });
const ks = (i, b, a, extra = {}) => ({ t: T(i), v: 'ks', id: 'KX-1', b, a, bs: 50, as: 40, last: b, v24: 300, oi: 700, ...extra });

test('collector: bestOfBook picks highest bid and lowest ask regardless of level order', () => {
  const book = { bids: [{ price: '0.48', size: '1' }, { price: '0.50', size: '7' }, { price: '0.49', size: '2' }], asks: [{ price: '0.53', size: '3' }, { price: '0.51', size: '9' }] };
  assert.deepEqual(bestOfBook(book), { b: 0.5, a: 0.51, bs: 7, as: 9 });
  assert.deepEqual(bestOfBook({}), { b: null, a: null, bs: null, as: null });
});

test('collector: mapPolymarket parses stringified token ids and prefers book touch over gamma fields', () => {
  const m = { conditionId: '0xabc', question: 'Will X?', slug: 'will-x', endDate: '2026-12-01', bestBid: 0.4, bestAsk: 0.45, clobTokenIds: '["111","222"]', orderPriceMinTickSize: 0.01, orderMinSize: 5, volume24hr: 123.456, liquidityNum: 9 };
  const { row, meta } = mapPolymarket(m, { bids: [{ price: '0.41', size: '10' }], asks: [{ price: '0.42', size: '20' }] }, '2026-10-14T10:00Z');
  assert.equal(row.id, '0xabc'); assert.equal(row.b, 0.41); assert.equal(row.a, 0.42); assert.equal(row.bs, 10); assert.equal(row.v24, 123.46);
  assert.equal(meta.yesToken, '111'); assert.equal(meta.minSize, 5);
  const noBook = mapPolymarket(m, null, '2026-10-14T10:00Z').row;
  assert.equal(noBook.b, 0.4); assert.equal(noBook.bs, null);
});

test('collector: mapKalshi reads dollar/fp string fields and isPlainBinary excludes multi-leg', () => {
  const m = { ticker: 'KXA-1', title: 'A', yes_sub_title: 'Yes A', yes_bid_dollars: '0.1500', yes_ask_dollars: '0.1600', yes_bid_size_fp: '10.5', yes_ask_size_fp: '4', last_price_dollars: '0.15', volume_24h_fp: '348783.04', open_interest_fp: '5', close_time: '2028-11-07T15:00:00Z', market_type: 'binary', status: 'active' };
  const { row, meta } = mapKalshi(m, '2026-10-14T10:00Z', { title: 'Nominee', series_ticker: 'KXA', category: 'Elections' });
  assert.equal(row.b, 0.15); assert.equal(row.a, 0.16); assert.equal(row.bs, 10.5); assert.equal(row.v24, 348783.04);
  assert.equal(meta.title, 'Nominee — Yes A'); assert.equal(meta.series, 'KXA');
  assert.equal(isPlainBinary(m), true);
  assert.equal(isPlainBinary({ ...m, mve_collection_ticker: 'MVE' }), false);
  assert.equal(round('abc'), null); assert.equal(round('0.1234567'), 0.1235);
});

test('metrics: parseRows skips junk, groupSeries sorts and dedupes by t', () => {
  const rows = parseRows(`${JSON.stringify(pm(1, 0.5, 0.51))}\nnot json\n${JSON.stringify(pm(0, 0.5, 0.51))}\n${JSON.stringify(pm(1, 0.5, 0.52))}\n`);
  assert.equal(rows.length, 3);
  const s = groupSeries(rows).get('pm:c1');
  assert.equal(s.length, 2); assert.equal(s[0].t, T(0)); assert.equal(s[1].a, 0.52);
});

test('metrics: spreadStats and quantile', () => {
  assert.equal(quantile([1, 2, 3, 4], 0.5), 2.5);
  const s = spreadStats([pm(0, 0.5, 0.51), pm(1, 0.5, 0.52), pm(2, null, 0.5), pm(3, 0.5, 0.51)]);
  assert.equal(s.n, 4); assert.equal(s.twoSided, 3); assert.equal(s.medianCents, 1); assert.equal(s.fracOneCent, 0.667); assert.equal(s.medianBidSize, 1000);
  // Kalshi reports an empty side as bid 0 / ask 1: not a quote, and no fake 0.50 mid.
  const e = spreadStats([ks(0, 0, 1), ks(1, 0, 0.02), ks(2, 0.4, 0.41)]);
  assert.equal(e.twoSided, 1); assert.equal(e.medianCents, 1);
  assert.equal(mid(ks(0, 0, 1, { last: 0.07 })), 0.07);
});

test('metrics: makerSpreadProxy fills only when price trades through, round-trips one tick', () => {
  // t0 one-tick spread at 50/51 -> rest bid 0.50; t1 ask drops to 0.50 (fill); t2 bid rises to 0.51 (exit) => 1c gross.
  const s = [pm(0, 0.5, 0.51), pm(1, 0.49, 0.5), pm(2, 0.51, 0.52), pm(3, 0.6, 0.62)];
  const r = makerSpreadProxy(s, { horizon: 4 });
  assert.equal(r.attempts, 3); assert.equal(r.fills, 1); assert.equal(r.roundTrips, 1); assert.equal(r.grossCents, 1); assert.equal(r.netCents, 1);
  // Kalshi maker fee at 50c: 0.0175*0.25*100 = 0.4375c per leg -> 0.875c per round trip.
  const k = makerSpreadProxy(s, { horizon: 4, makerFeeRate: 0.0175 });
  assert.equal(k.feeCents, 0.88); assert.equal(k.netCents, 0.13);
  // Never fills: ask never reaches our bid.
  const none = makerSpreadProxy([pm(0, 0.5, 0.51), pm(1, 0.52, 0.53), pm(2, 0.54, 0.55)], { horizon: 2 });
  assert.equal(none.fills, 0); assert.equal(none.fillRate, 0);
  // Filled, never exited: marked to last mid inside horizon (mid 0.45 vs bid 0.50 => -5c).
  const stuck = makerSpreadProxy([pm(0, 0.5, 0.51), pm(1, 0.44, 0.46), pm(2, 0.44, 0.46)], { horizon: 2 });
  assert.equal(stuck.fills, 1); assert.equal(stuck.roundTrips, 0); assert.equal(stuck.mtmCents, -5); assert.equal(stuck.netCents, -5);
  const sum = sumProxies([r, k]);
  assert.equal(sum.attempts, 6); assert.equal(sum.roundTrips, 2);
  // The last one-tick snapshot has nothing after it: unobservable, not a missed fill.
  assert.equal(r.unobserved, 0); assert.equal(none.unobserved, 1); assert.equal(none.attempts, 2);
});

test('metrics: makerSpreadProxy with horizonMinutes ignores snapshots beyond the wall-clock window', () => {
  // Same fill-then-exit path, but the fill arrives 5 hours later: outside a 60-minute horizon.
  const at = (t, b, a) => ({ ...pm(0, b, a), t });
  const late = [at('2026-10-14T10:00Z', 0.5, 0.51), at('2026-10-14T15:00Z', 0.49, 0.5), at('2026-10-14T20:00Z', 0.51, 0.52)];
  const byTicks = makerSpreadProxy(late, { horizon: 4 });
  assert.equal(byTicks.roundTrips, 1);
  const byMinutes = makerSpreadProxy(late, { horizonMinutes: 60 });
  assert.equal(byMinutes.attempts, 0); assert.equal(byMinutes.unobserved, 3); assert.equal(byMinutes.fillRate, null);
  // 15-minute cadence: fill at +15, exit at +30, both inside 60 minutes.
  const fast = [at('2026-10-14T10:00Z', 0.5, 0.51), at('2026-10-14T10:15Z', 0.49, 0.5), at('2026-10-14T10:30Z', 0.51, 0.52), at('2026-10-14T12:00Z', 0.6, 0.62)];
  const f = makerSpreadProxy(fast, { horizonMinutes: 60 });
  assert.equal(f.roundTrips, 1); assert.equal(f.grossCents, 1);
  assert.equal(medianGapMinutes(['2026-10-14T10:00Z', '2026-10-14T10:15Z', '2026-10-14T10:30Z', '2026-10-14T15:00Z']), 15);
});

test('metrics: crossVenue computes divergence, both-sides net, and lead-lag', () => {
  // Polymarket steps up every third tick; Kalshi echoes each step exactly one tick later (aperiodic, so lag +1 is unique).
  const pb = [0.5, 0.6, 0.6, 0.6, 0.7, 0.7, 0.7, 0.8, 0.8, 0.8], kb = [0.5, 0.5, 0.6, 0.6, 0.6, 0.7, 0.7, 0.7, 0.8, 0.8];
  const p = pb.map((b, i) => pm(i, b, round2(b + 0.01)));
  const k = kb.map((b, i) => ks(i, b, round2(b + 0.01)));
  const r = crossVenue(p, k, { polymarketTakerRate: 0.04, kalshiTakerRate: 0.07 });
  assert.equal(r.n, 10); assert.equal(r.meanAbsCents, 3); assert.equal(r.maxAbsCents, 10); assert.equal(r.fracAbsGt2c, 0.3);
  // At each 10c divergence, YES on Kalshi (0.51) + NO on Polymarket (0.40) costs 0.91: a gross 9c gap, ~6c after taker fees.
  assert.equal(r.bothSides.checks, 20); assert.equal(r.bothSides.fracGrossPositive, 0.15); assert.equal(r.bothSides.fracNetPositive, 0.15);
  assert.ok(r.bothSides.maxNetCents > 5 && r.bothSides.maxNetCents < 9);
  assert.equal(r.leads, 'polymarket'); assert.equal(r.bestLag.lag, 1);
  // A genuine both-sides gap: PM YES ask 0.40, Kalshi YES bid 0.50 -> NO ask 0.50 -> cost 0.90 -> 10c gross.
  const g = crossVenue([pm(0, 0.39, 0.4)], [ks(0, 0.5, 0.51)], { polymarketTakerRate: 0.04, kalshiTakerRate: 0.07 });
  assert.equal(g.bothSides.fracGrossPositive, 0.5); assert.ok(g.bothSides.maxNetCents > 7 && g.bothSides.maxNetCents < 10);
  assert.equal(corr([1, 2, 3], [1, 1, 1]), null);
});

test('metrics: byBucket, candidates, feeTable', () => {
  const rows = [pm(0, 0.5, 0.51), pm(1, 0.5, 0.52), { ...pm(4, 0.5, 0.51), t: '2026-10-14T11:00Z' }];
  const h = byBucket(rows, 'hour');
  assert.equal(h.length, 2); assert.equal(h[0].hour, 10); assert.equal(h[0].n, 2); assert.equal(h[0].fracOneCent, 0.5);
  const series = groupSeries(Array.from({ length: 9 }, (_, i) => pm(i, 0.5, 0.51)));
  const c = candidates(series, { pm: { c1: { title: 'Will X?' } } }, { minPoints: 8 });
  assert.equal(c.length, 1); assert.equal(c[0].title, 'Will X?'); assert.equal(c[0].fracOneCent, 1); assert.equal(c[0].medianTouch, 900);
  const f = feeTable({ kalshiTakerRate: 0.07, kalshiMakerRate: 0.0175, polymarketTakerRate: 0.04 });
  const at50 = f.find((x) => x.price === 0.5);
  assert.equal(at50.ksTaker, 1.75); assert.equal(at50.ksMaker, 0.44); assert.equal(at50.pmTaker, 1); assert.equal(at50.pmMaker, 0);
  assert.equal(at50.oneCentMakerRoundTripNet.polymarket, 1); assert.equal(at50.oneCentMakerRoundTripNet.kalshi, 0.13);
});

test('backtest: computeReport over a temp data dir and renders', () => {
  const dir = mkdtempSync(join(tmpdir(), 'kdreams-'));
  mkdirSync(join(dir, 'snapshots')); mkdirSync(join(dir, 'catalog'));
  const rows = [];
  for (let i = 0; i < 10; i++) { rows.push(pm(i, 0.5, 0.51)); rows.push(ks(i, 0.5 + (i % 2) * 0.01, 0.51 + (i % 2) * 0.01)); }
  writeFileSync(join(dir, 'snapshots', '2026-10-14.ndjson'), rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
  writeFileSync(join(dir, 'catalog', 'polymarket.json'), JSON.stringify({ c1: { title: 'Will X?' } }));
  writeFileSync(join(dir, 'catalog', 'kalshi.json'), JSON.stringify({ 'KX-1': { title: 'X — Yes' } }));
  const r = computeReport({ dataDir: dir, watchlist: { pairs: [{ polymarketId: 'c1', kalshiTicker: 'KX-1' }], fees: {} }, days: 14 });
  assert.equal(r.generatedFrom.rows, 20); assert.equal(r.generatedFrom.ticks, 10); assert.equal(r.generatedFrom.marketsPm, 1);
  assert.equal(r.crossVenue.length, 1); assert.equal(r.crossVenue[0].pmTitle, 'Will X?'); assert.equal(r.crossVenue[0].n, 10);
  assert.equal(r.topMarkets.pm[0].title, 'Will X?');
  const summary = renderSummary(r);
  assert.match(summary, /Coverage: 20 rows, 10 ticks/); assert.match(summary, /Pair KX-1/);
  assert.match(renderMarkdown(r), /proxy/);
  assert.equal(r.generatedFrom.medianGapMinutes, 15);
  const after = computeReport({ dataDir: dir, watchlist: {}, days: 14, since: T(6) });
  assert.equal(after.generatedFrom.ticks, 3); assert.equal(after.generatedFrom.firstTick, T(7));
  assert.match(renderSummary(after), new RegExp(`after ${T(6)}`));
  const empty = computeReport({ dataDir: join(dir, 'nope'), watchlist: {}, days: 14 });
  assert.equal(empty.generatedFrom.rows, 0); assert.match(renderSummary(empty), /no pairs configured/);
});

test('specs: validation, slicing, measurement and grading are arithmetic, not judgment', () => {
  const pairs = [{ name: 'p1', polymarketId: 'c1', kalshiTicker: 'KX-1' }];
  assert.equal(validateSpec({ metric: 'maker.fillRate', venue: 'pm', op: '>', threshold: 0.1 }, pairs), null);
  assert.match(validateSpec({ metric: 'volume.tier', venue: 'pm', op: '>', threshold: 1 }, pairs), /unknown metric/);
  assert.match(validateSpec({ metric: 'maker.fillRate', op: '>', threshold: 1 }, pairs), /needs venue/);
  assert.match(validateSpec({ metric: 'pair.meanAbsCents', pair: 'nope', op: '<', threshold: 1 }, pairs), /configured pair/);
  assert.match(validateSpec({ metric: 'maker.fillRate', venue: 'pm', op: '>=', threshold: 1 }, pairs), /op must/);
  assert.match(validateSpec({ metric: 'maker.fillRate', venue: 'pm', op: '>', threshold: 1, slice: { hoursUtc: [5, 5] } }, pairs), /hoursUtc/);
  assert.match(validateSpec({ metric: 'maker.fillRate', venue: 'pm', op: '>', threshold: 1, slice: { volume: 1 } }, pairs), /unknown slice key/);
  assert.equal(validateSpec(null), 'no spec');

  // Hour windows are [from, to) and wrap past midnight.
  const at = (h) => ({ ...pm(0, 0.5, 0.51), t: `2026-10-14T${String(h).padStart(2, '0')}:00Z` });
  assert.deepEqual([4, 5, 9, 10].map((h) => sliceFilter({ hoursUtc: [5, 10] })(at(h))), [false, true, true, false]);
  assert.deepEqual([21, 22, 3, 4].map((h) => sliceFilter({ hoursUtc: [22, 4] })(at(h))), [false, true, true, false]);
  assert.equal(sliceFilter({ midMin: 0.6 })(at(5)), false);

  // Measurement: spread and maker metrics on a venue, divergence on a pair.
  const rows = [];
  for (let i = 0; i < 10; i++) { rows.push(pm(i, 0.5, 0.51)); rows.push(ks(i, 0.52, 0.53)); }
  const wl = { pairs, fees: {}, backtest: { horizonTicks: 4 } };
  assert.deepEqual(measureSpecRows(rows, { metric: 'spread.fracOneCent', venue: 'pm' }, wl), { value: 1, n: 10 });
  assert.deepEqual(measureSpecRows(rows, { metric: 'spread.fracOneCent', venue: 'pm', slice: { midMin: 0.6 } }, wl), { value: null, n: 0 });
  assert.deepEqual(measureSpecRows(rows, { metric: 'pair.meanAbsCents', pair: 'p1' }, wl), { value: 2, n: 10 });
  const maker = measureSpecRows(rows, { metric: 'maker.fillRate', venue: 'pm' }, wl);
  assert.equal(maker.n, 9); assert.equal(maker.value, 0);

  // Grading: below the sample floor stays INCONCLUSIVE; at or above it the threshold decides.
  const spec = { metric: 'maker.fillRate', venue: 'pm', op: '>', threshold: 0.2, minN: 50 };
  assert.equal(gradeSpec(spec, { value: 0.5, n: 120 }, 100).verdict, 'SUPPORTED');
  assert.equal(gradeSpec(spec, { value: 0.1, n: 120 }, 100).verdict, 'REFUTED');
  assert.equal(gradeSpec(spec, { value: 0.5, n: 99 }, 100).verdict, 'INCONCLUSIVE');
  assert.equal(gradeSpec({ ...spec, minN: 500 }, { value: 0.5, n: 120 }, 100).verdict, 'INCONCLUSIVE');
  assert.equal(gradeSpec(spec, { value: null, n: 0 }, 100).verdict, 'INCONCLUSIVE');
  assert.equal(describeSpec({ ...spec, slice: { hoursUtc: [5, 10] } }), 'maker.fillRate > 0.2 (venue pm, UTC 5h-10h, n>=50)');
});

test('specs: restating pre-freeze data is rejected, profit is required every other night', () => {
  const lose = { metric: 'maker.netCentsPerAttempt', venue: 'ks', op: '<', threshold: 0 };
  const profit = { metric: 'maker.netCentsPerAttempt', venue: 'pm', slice: { midMin: 0.2 }, op: '>', threshold: 0 };
  const tight = { metric: 'spread.fracOneCent', venue: 'pm', op: '<', threshold: 0.89 };
  assert.equal(isProfitSpec(profit), true);
  assert.equal(isProfitSpec(lose), false);
  assert.equal(isProfitSpec({ metric: 'pair.bothSidesFracNetPositive', pair: 'p1', op: '>', threshold: 0 }), false);
  assert.match(specRejection(lose, { value: -1.8, n: 10000 }), /already true before the freeze/);
  assert.equal(specRejection(tight, { value: 0.95, n: 3000 }), null);
  assert.equal(specRejection(tight, { value: null, n: 0 }), null);
  // A profit prediction may already hold: persistence out of sample is the claim worth testing.
  assert.equal(specRejection(profit, { value: 0.4, n: 500 }), null);
  assert.match(specRejection(tight, { value: 0.95, n: 3000 }, { requireProfit: true }), /must/);
  assert.equal(specRejection(profit, { value: -1, n: 500 }, { requireProfit: true }), null);

  const card = scorecard([
    { status: 'SUPPORTED', spec: lose, baseline: { value: -1.8, n: 1 } },
    { status: 'REFUTED', spec: profit, baseline: { value: -1, n: 1 } },
    { status: 'open', spec: tight },
  ]);
  assert.equal(card, 'Record: 2 graded; profit predictions 1 (0 SUPPORTED); 1 SUPPORTED grade(s) were already true at freeze and carry no information.');
});

test('collector: resolutions read settled outcomes and pick unchecked past-close candidates', () => {
  const t = '2026-10-22T12:00Z';
  const pm = { conditionId: '0xabc', closed: true, umaResolutionStatus: 'resolved', outcomePrices: '["1", "0"]', closedTime: '2026-10-14 21:24:00+00' };
  assert.deepEqual(pmResolution(pm, t), { t, v: 'pm', id: '0xabc', y: 1, at: '2026-10-14T21:24Z' });
  assert.equal(pmResolution({ ...pm, outcomePrices: '["0.5", "0.5"]' }, t).y, 0.5);
  assert.equal(pmResolution({ ...pm, umaResolutionStatus: 'proposed' }, t), null);
  assert.equal(pmResolution({ ...pm, closed: false }, t), null);
  const ks = { ticker: 'KX-A', status: 'finalized', result: 'no', settlement_value_dollars: '0.0000', settlement_ts: '2026-10-14T20:58:39.38Z' };
  assert.deepEqual(ksResolution(ks, t), { t, v: 'ks', id: 'KX-A', y: 0, at: '2026-10-14T20:58Z' });
  assert.equal(ksResolution({ ...ks, result: '' }, t), null);

  const catalog = {
    past: { closeTime: '2026-10-20T00:00:00Z', lastSeen: '2026-10-20T00:00Z' },
    open: { closeTime: '2026-12-01T00:00:00Z', lastSeen: '2026-10-22T11:45Z' },
    dropped: { closeTime: '2026-12-01T00:00:00Z', lastSeen: '2026-10-21T00:00Z' },
    done: { closeTime: '2026-10-19T00:00:00Z', lastSeen: '2026-10-19T00:00Z' },
    recent: { closeTime: '2026-10-19T00:00:00Z', lastSeen: '2026-10-19T00:00Z' },
  };
  const checks = { recent: '2026-10-22T10:00Z', dropped: '2026-10-22T02:00Z' };
  assert.deepEqual(resolutionCandidates(catalog, new Set(['done']), checks, t), ['past', 'dropped']);
  assert.deepEqual(resolutionCandidates(catalog, new Set(['done']), checks, t, { max: 1 }), ['past']);
});
