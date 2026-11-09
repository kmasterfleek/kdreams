import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { bestOfBook, mapPolymarket, mapKalshi, isPlainBinary, round, pmResolution, ksResolution, resolutionCandidates } from './kdreams-collect.mjs';
import {
  parseRows, groupSeries, spreadStats, makerSpreadProxy, sumProxies, crossVenue, byBucket, candidates, feeTable, quantile, corr, medianGapMinutes, mid, sliceFilter, parseResolutions, holdToResolution, pairStatus, driftToResolution,
} from './lib/kdreams-metrics.mjs';
import { computeReport, renderSummary, renderMarkdown, validateSpec, measureSpecRows, gradeSpec, describeSpec, pairFees } from './kdreams-backtest.mjs';
import { priorNightFates, reasoningFor, extractHypothesis, extractSpec, specInstructions, planRetests, fatesSummary, cell, isProfitSpec, specRejection, scorecard, deadPairReason, settleDeadPairGrades } from './kdreams-nightly.mjs';

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
  // Pinned hypotheses skip the maxOpen cap and expire on their own window.
  const pinned = [...hyps, { id: '2026-09-20-h1', date: '2026-09-20', frozenAt: '2026-09-20T00:00Z', status: 'open', pinned: true, windowDays: 28 }];
  const p2 = planRetests(pinned, { date: '2026-10-17', days: 14, minTicks: 48, maxOpen: 1 }, () => 99);
  assert.deepEqual(p2.due.map((x) => x.h.id), ['2026-09-20-h1', '2026-10-16']);
  assert.deepEqual(planRetests(pinned, { date: '2026-10-19', days: 14, maxOpen: 1 }, () => 99).expired.map((h) => h.id), ['2026-09-01', '2026-09-20-h1']);
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

test('metrics: parseRows skips junk and duplicate ticks, groupSeries sorts and dedupes by t', () => {
  const rows = parseRows(`${JSON.stringify(pm(1, 0.5, 0.51))}\nnot json\n${JSON.stringify(pm(0, 0.5, 0.51))}\n${JSON.stringify(pm(1, 0.5, 0.52))}\n`);
  assert.equal(rows.length, 2);
  assert.equal(rows.find((r) => r.t === T(1)).a, 0.52);
  assert.equal(groupSeries([...rows, pm(1, 0.5, 0.53)]).get('pm:c1')[1].a, 0.53);
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
  // A pair's own Polymarket taker rate replaces the default; a higher rate shrinks the same gap's net.
  const fees = { polymarketTakerRate: 0.04, kalshiTakerRate: 0.07 };
  assert.equal(pairFees(fees, { name: 'x' }), fees);
  assert.deepEqual(pairFees(fees, { name: 'x', polymarketTakerRate: 0.05 }), { polymarketTakerRate: 0.05, kalshiTakerRate: 0.07 });
  const hi = crossVenue([pm(0, 0.39, 0.4)], [ks(0, 0.5, 0.51)], pairFees(fees, { polymarketTakerRate: 0.05 }));
  assert.ok(hi.bothSides.maxNetCents < g.bothSides.maxNetCents);
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

test('metrics: holdToResolution buys the favored side once per market and nets fees at settlement', () => {
  const row = (v, id, t, b, a, bs = 1000, as = 1000) => ({ t, v, id, b, a, bs, as, last: null, v24: null, oi: null });
  const rows = [
    row('ks', 'G-A', '2026-10-14T18:00Z', 0.95, 0.96), // below the band
    row('ks', 'G-A', '2026-10-14T18:15Z', 0.97, 0.98), // entry: YES at 0.98
    row('ks', 'G-A', '2026-10-14T18:30Z', 0.98, 0.99), // later snapshot ignored
    row('ks', 'G-B', '2026-10-14T18:15Z', 0.01, 0.02), // same event, NO at 0.99: skipped
    row('pm', 'p1', '2026-10-14T18:00Z', 0.02, 0.03, 5, 5), // NO at 0.98, but $0.05 at the touch: skipped
    row('pm', 'p1', '2026-10-14T18:15Z', 0.01, 0.02, null, null), // NO at 0.99, unsized: entered
    row('pm', 'p2', '2026-10-14T18:00Z', 0.97, 0.98), // loses
    row('pm', 'p3', '2026-10-14T21:00Z', 0.97, 0.98), // after settlement: ignored
  ];
  const res = parseResolutions([
    '{"t":"x","v":"ks","id":"G-A","y":1,"at":"2026-10-14T20:00Z"}', '{"t":"x","v":"ks","id":"G-B","y":0,"at":"2026-10-14T20:00Z"}',
    '{"t":"x","v":"pm","id":"p1","y":0,"at":"2026-10-14T20:00Z"}', '{"t":"x","v":"pm","id":"p2","y":0,"at":"2026-10-14T20:00Z"}',
    '{"t":"x","v":"pm","id":"p3","y":1,"at":"2026-10-14T20:00Z"}', 'junk', '{"t":"x","v":"pm","id":"p1","y":1,"at":"later"}',
  ].join('\n'));
  assert.equal(res.size, 5);
  assert.equal(res.get('pm:p1').y, 0);
  const catalogs = { ks: { 'G-A': { event: 'G', closeTime: '2026-10-14T20:00:00Z' }, 'G-B': { event: 'G' } } };
  const fees = { polymarketTakerRate: 0.04, kalshiTakerRate: 0.07 };

  // Kalshi: 10 contracts at 98c win 2c each = 20c gross; fee 0.07*10*0.98*0.02*100 = 1.372c, rounded up to 2c.
  const ks = holdToResolution(rows.filter((r) => r.v === 'ks'), res, catalogs, { fees, slice: { priceMin: 0.97, priceMax: 0.99 } });
  assert.deepEqual([ks.markets, ks.wins, ks.netCentsPer10, ks.feeCents, ks.medianHoldHours], [1, 1, 18, 2, 1.8]);
  // The other side of the same game is the same bet: not entered again even when its band matches.
  assert.equal(holdToResolution(rows.filter((r) => r.v === 'ks'), res, catalogs, { fees, slice: { priceMin: 0.97 } }).markets, 1);
  // hoursToClose uses the catalog close: G-A's entry is 1.75h before close.
  assert.equal(holdToResolution(rows.filter((r) => r.v === 'ks'), res, catalogs, { fees, slice: { priceMin: 0.97, hoursToClose: [0, 1] } }).markets, 0);

  // Polymarket: p1 NO at 0.99 wins (10 contracts, +10c minus 0.396c fee), p2 YES at 0.98 loses 10 * 98c minus fee.
  const pm = holdToResolution(rows.filter((r) => r.v === 'pm'), res, catalogs, { fees, slice: { priceMin: 0.97 } });
  assert.deepEqual([pm.markets, pm.unsized, pm.wins, pm.winRate], [2, 1, 1, 0.5]);
  assert.equal(pm.worstCents, -980.78);
  assert.equal(pm.netCentsPer10, round((10 - 0.396 + -980 - 0.784) / 2, 1));
});

test('specs: resolution metrics validate their own slice keys and count as profit predictions', () => {
  const r = { metric: 'resolution.netCentsPer10', venue: 'ks', slice: { priceMin: 0.97, priceMax: 0.99, hoursToClose: [0, 24] }, op: '>', threshold: 1 };
  assert.equal(validateSpec(r), null);
  assert.match(validateSpec({ ...r, slice: { midMin: 0.9 } }), /priceMin\/priceMax/);
  assert.match(validateSpec({ ...r, slice: { priceMin: 0.3 } }), /0\.5\.\.1/);
  assert.match(validateSpec({ ...r, slice: { priceMin: 0.99, priceMax: 0.97 } }), /below priceMax/);
  assert.match(validateSpec({ ...r, slice: { hoursToClose: [5, 2] } }), /hoursToClose/);
  assert.match(validateSpec({ metric: 'maker.fillRate', venue: 'pm', op: '>', threshold: 0, slice: { priceMin: 0.9 } }), /only applies to resolution/);
  assert.equal(describeSpec(r), 'resolution.netCentsPer10 > 1 (venue ks, entry 0.97..0.99, 0-24h to close)');
  assert.equal(isProfitSpec(r), true);
  assert.equal(isProfitSpec({ ...r, metric: 'resolution.winRate', threshold: 0.99 }), false);
  // A profit prediction may already hold before the freeze: persistence is the claim.
  assert.equal(specRejection(r, { value: 15, n: 80 }), null);
  assert.match(specInstructions([]), /hoursToClose/);
});

test('pairs: a retired, settled or silent pair leaves the report and settles its open hypotheses', () => {
  const live = { name: 'p1', polymarketId: 'c1', kalshiTicker: 'KX-1' };
  const rows = [];
  for (let i = 0; i < 10; i++) { rows.push(pm(i, 0.5, 0.51)); rows.push(ks(i, 0.5, 0.51)); }
  const series = groupSeries(rows);
  const last = T(9);
  assert.equal(pairStatus(live, series, new Map(), { lastTick: last }), null);
  assert.match(pairStatus({ ...live, retired: 'settled 11-04' }, series, new Map(), { lastTick: last }), /retired in the watchlist: settled 11-04/);
  const settled = new Map([['pm:c1', { v: 'pm', id: 'c1', y: 1, at: T(5) }]]);
  assert.match(pairStatus(live, series, settled, { lastTick: last }), /Polymarket leg settled at/);
  assert.match(pairStatus({ ...live, kalshiTicker: 'KX-GONE' }, series, new Map(), { lastTick: last }), /Kalshi leg has no two-sided quote in the window/);
  // Kalshi keeps emitting bid 0 / ask 1 rows after settlement; those are not quotes.
  const quiet = [...rows.filter((r) => r.v === 'pm'), ks(0, 0.5, 0.51), ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => ks(i, 0, 1))];
  assert.match(pairStatus(live, groupSeries(quiet), new Map(), { lastTick: last, staleHours: 1 }), /Kalshi leg has no two-sided quote since 2026-10-14T10:00Z/);
  assert.equal(pairStatus(live, groupSeries(quiet), new Map(), { lastTick: last, staleHours: 24 }), null);
  assert.equal(pairStatus(live, new Map(), new Map(), {}), null);

  const dir = mkdtempSync(join(tmpdir(), 'kdreams-pairs-'));
  mkdirSync(join(dir, 'snapshots'));
  writeFileSync(join(dir, 'snapshots', '2026-10-14.ndjson'), rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
  const r = computeReport({ dataDir: dir, watchlist: { pairs: [{ ...live, retired: 'settled' }, { ...live, name: 'p2' }], fees: {} }, days: 14 });
  assert.deepEqual(r.crossVenue.map((p) => p.name), ['p2']);
  assert.deepEqual(r.retiredPairs.map((p) => p.name), ['p1']);
  assert.match(renderSummary(r), /Retired pairs \(no new evidence possible[^)]*\): p1 — retired in the watchlist: settled/);
  const none = computeReport({ dataDir: dir, watchlist: { pairs: [{ ...live, retired: 'settled' }], fees: {} }, days: 14 });
  assert.match(renderSummary(none), /no live pairs/);

  const retired = [{ name: 'p1', reason: 'Polymarket leg settled at 2026-11-04T09:57Z' }];
  const onDead = { metric: 'pair.bothSidesFracNetPositive', pair: 'p1', op: '>', threshold: 0.1 };
  assert.match(deadPairReason(onDead, retired), /pair p1 can produce no new evidence \(Polymarket leg settled/);
  assert.equal(deadPairReason({ ...onDead, pair: 'p2' }, retired), null);
  assert.equal(deadPairReason({ metric: 'maker.fillRate', venue: 'pm' }, retired), null);
  assert.match(specInstructions([{ name: 'p2' }], retired), /Configured pair names: p2\.\nRetired pairs[^\n]*: p1\./);
  const hyps = [{ id: 'a', spec: onDead }, { id: 'b', spec: onDead }, { id: 'c', spec: { ...onDead, pair: 'p2' } }];
  const out = settleDeadPairGrades([
    { id: 'a', verdict: 'INCONCLUSIVE', note: 'n=0', by: 'code' },
    { id: 'b', verdict: 'REFUTED', note: 'x', by: 'code' },
    { id: 'c', verdict: 'INCONCLUSIVE', note: 'n=5', by: 'code' },
  ], hyps, retired);
  assert.deepEqual(out.map((g) => `${g.id} ${g.verdict} ${g.by}`), ['a UNGRADEABLE rule', 'b REFUTED code', 'c INCONCLUSIVE code']);
  assert.match(out[0].note, /^pair p1 can produce no new evidence .*; n=0$/);
});

test('metrics: driftToResolution buys the side a move points to, using only data before entry', () => {
  // 15-minute ticks starting 10:00; resolutions settle long after.
  const at = (i) => new Date(Date.parse('2026-10-14T10:00Z') + i * 900000).toISOString().slice(0, 16) + 'Z';
  const row = (v, id, i, b, a) => ({ t: at(i), v, id, b, a, bs: 1000, as: 1000, last: null, v24: 1, oi: 1 });
  const rows = [];
  // up: mid 0.40 -> 0.46 over 1h, then on to 0.80. Settles YES.
  for (let i = 0; i < 12; i++) rows.push(row('pm', 'up', i, 0.4 + Math.min(i, 4) * 0.015 + Math.max(0, i - 4) * 0.04, 0.41 + Math.min(i, 4) * 0.015 + Math.max(0, i - 4) * 0.04));
  // down: mid 0.60 -> 0.54 over 1h. Settles YES anyway, so the NO bought on the move loses.
  for (let i = 0; i < 12; i++) rows.push(row('pm', 'down', i, 0.595 - Math.min(i, 4) * 0.015, 0.605 - Math.min(i, 4) * 0.015));
  // flat: never moves 5c. Never entered.
  for (let i = 0; i < 12; i++) rows.push(row('pm', 'flat', i, 0.5, 0.51));
  const res = new Map([
    ['pm:up', { v: 'pm', id: 'up', y: 1, at: '2026-10-15T00:00Z' }],
    ['pm:down', { v: 'pm', id: 'down', y: 1, at: '2026-10-15T00:00Z' }],
    ['pm:flat', { v: 'pm', id: 'flat', y: 1, at: '2026-10-15T00:00Z' }],
  ]);
  const d = driftToResolution(rows, res, {}, { fees: { polymarketTakerRate: 0 }, slice: { lookbackHours: 1, minMoveCents: 5 } });
  assert.equal(d.markets, 2);
  assert.equal(d.winRate, 0.5);
  // up: bought YES at ask 0.47 (mid moved 6c by i=4), paid 1 -> +53c. down: bought NO at 1 - 0.535 = 0.465, paid 0 -> -46.5c.
  assert.equal(d.excessCents, round2((53 - 46.5) / 2));
  assert.ok(d.seCents > 40);
  assert.equal(d.meanAbsMoveCents, 6);
  // A bigger required move is never reached by "down" (6c), and "up" enters later at a higher price.
  const big = driftToResolution(rows, res, {}, { fees: { polymarketTakerRate: 0 }, slice: { lookbackHours: 1, minMoveCents: 10 } });
  assert.equal(big.markets, 1); assert.ok(big.meanPrice > 0.47);
  // Settlement before the move means no entry: only snapshots before res.at count.
  const early = new Map([...res].map(([k, r]) => [k, { ...r, at: at(3) }]));
  assert.equal(driftToResolution(rows, early, {}, { slice: { lookbackHours: 1, minMoveCents: 5 } }).markets, 0);
  // With no snapshot an hour back, nothing qualifies.
  assert.equal(driftToResolution(rows, res, {}, { slice: { lookbackHours: 6, minMoveCents: 5 } }).markets, 0);

  const spec = { metric: 'drift.excessCents', venue: 'pm', slice: { lookbackHours: 1, minMoveCents: 5, hoursToClose: [0, 24], priceMin: 0.1 }, op: '>', threshold: 0 };
  assert.equal(validateSpec(spec), null);
  assert.match(validateSpec({ ...spec, slice: { midMin: 0.2 } }), /drift\.\* metrics slice on priceMin/);
  assert.match(validateSpec({ ...spec, slice: { lookbackHours: 0 } }), /lookbackHours/);
  assert.match(validateSpec({ ...spec, slice: { minMoveCents: 80 } }), /minMoveCents/);
  assert.match(validateSpec({ metric: 'maker.fillRate', venue: 'pm', op: '>', threshold: 0, slice: { lookbackHours: 2 } }), /only applies to drift/);
  assert.match(validateSpec({ metric: 'resolution.winRate', venue: 'pm', op: '>', threshold: 0, slice: { priceMin: 0.2 } }), /0\.5\.\.1/);
  assert.equal(describeSpec(spec), 'drift.excessCents > 0 (venue pm, entry 0.1..1, 0-24h to close, move >= 5c over 1h)');
  assert.deepEqual(measureSpecRows(rows, spec, { fees: { polymarketTakerRate: 0 } }, { resolutions: res }), { value: null, n: 0 });
  assert.deepEqual(measureSpecRows(rows, { ...spec, slice: { lookbackHours: 1, minMoveCents: 5 } }, { fees: { polymarketTakerRate: 0 } }, { resolutions: res }), { value: 3.25, n: 2 });
  assert.equal(isProfitSpec({ ...spec, metric: 'drift.netCentsPer10' }), true);
  assert.equal(isProfitSpec(spec), false);
  assert.match(specInstructions([]), /drift\.\* metrics buy the side/);
});

test('tape: rows, signed flow, windows, paging and wallet selection', async () => {
  const { yesSign, tapeWindow, mapPmTrade, mapKsTrade, aggregateFlow, walletsToLookup, mapWalletStats, pageBack, collectTape } = await import('./kdreams-tape.mjs');
  assert.deepEqual([yesSign(0, 'B'), yesSign(0, 'S'), yesSign(1, 'B'), yesSign(1, 'S'), yesSign(null, 'B')], [1, -1, -1, 1, 0]);

  // Windows chain end to end; a long outage is clipped to maxWindowMinutes and reported.
  assert.deepEqual(tapeWindow({}, 10000, { lagSeconds: 100, firstWindowMinutes: 15 }), { start: 9000, end: 9900, gapSeconds: 0 });
  assert.deepEqual(tapeWindow({ end: 9000 }, 10000, { lagSeconds: 100 }), { start: 9000, end: 9900, gapSeconds: 0 });
  assert.deepEqual(tapeWindow({ end: 1000 }, 10000, { lagSeconds: 100, maxWindowMinutes: 60 }), { start: 6300, end: 9900, gapSeconds: 5300 });

  const pmT = { proxy_wallet: '0xabc', side: 'SELL', token_id: 'tokNo', condition_id: '0xc1', size: 2000, price: 0.6, timestamp: 1794182059, outcome_index: 999 };
  assert.deepEqual(mapPmTrade(pmT, { '0xc1': { yesToken: 'tokYes', noToken: 'tokNo' } }), { t: '2026-11-08T23:54:19Z', v: 'pm', id: '0xc1', o: 1, s: 'S', p: 0.6, n: 2000, usd: 1200, w: '0xabc' });
  assert.equal(mapPmTrade(pmT).o, null);
  assert.equal(mapPmTrade({ ...pmT, outcome_index: 0, side: 'BUY' }).o, 0);
  const ksT = { count_fp: '9.39', created_time: '2026-11-08T23:54:16.056171Z', no_price_dollars: '0.7100', taker_outcome_side: 'no', ticker: 'KX-1', yes_price_dollars: '0.2900' };
  assert.deepEqual(mapKsTrade(ksT), { t: '2026-11-08T23:54:16Z', v: 'ks', id: 'KX-1', o: 1, s: 'B', p: 0.71, n: 9.39, usd: 6.67 });

  const flow = aggregateFlow([
    { v: 'ks', id: 'KX-1', o: 0, s: 'B', usd: 1500 }, { v: 'ks', id: 'KX-1', o: 1, s: 'B', usd: 20 },
    { v: 'pm', id: '0xc1', o: 1, s: 'S', usd: 30 }, { v: 'pm', id: '0xc1', o: null, s: 'B', usd: 5 },
  ], { t: 'T', from: 'F', minUsd: 1000, capped: new Set(['pm:0xc1']) });
  assert.deepEqual(flow, [
    { t: 'T', v: 'ks', id: 'KX-1', from: 'F', k: 2, yu: 1500, nu: 20, big: 1, cap: false },
    { t: 'T', v: 'pm', id: '0xc1', from: 'F', k: 2, yu: 30, nu: 0, big: 0, cap: true },
  ]);

  const now = Date.parse('2026-11-09T00:00Z') / 1000;
  const wallets = { '0xold': { statsAt: '2026-10-01T00:00Z' }, '0xfresh': { statsAt: '2026-11-08T00:00Z' } };
  assert.deepEqual(walletsToLookup([{ w: '0xnew', usd: 10 }, { w: '0xold', usd: 50 }, { w: '0xfresh', usd: 99 }, { w: '0xnew', usd: 70 }, { usd: 1e6 }], wallets, now, { refreshDays: 7 }), ['0xnew', '0xold']);
  assert.deepEqual(mapWalletStats({ trades: 199, join_date: 1784477815, all_time_pnl: { trade_count: 980, volume_usdc: 50834.1226, realized_pnl: -1939.469 } }, 'T'),
    { join: '2026-07-19T16:16:55Z', trades: 980, markets: 199, volume: 50834.12, pnl: -1939.47, statsAt: 'T' });
  assert.deepEqual(mapWalletStats(null, 'T'), { statsAt: 'T', missing: true });

  // Newest-first paging stops at the window start, and says when the page cap cut it short.
  const feed = [50, 40, 30, 20, 10].map((s) => ({ s }));
  const page = (size) => async (cursor) => { const i = cursor ?? 0; const rows = feed.slice(i, i + size); return { rows, cursor: i + size < feed.length ? i + size : null, oldestSec: Math.min(...rows.map((x) => x.s)) }; };
  const full = await pageBack(page(2), { start: 20, end: 45, maxPages: 10, timeOf: (x) => x.s });
  assert.deepEqual([full.rows.map((x) => x.s), full.capped, full.pages], [[40, 30], false, 2]);
  const cut = await pageBack(page(1), { start: 0, end: 99, maxPages: 2, timeOf: (x) => x.s });
  assert.deepEqual([cut.rows.length, cut.capped], [2, true]);

  // End to end against a fake venue: writes trades, flow, wallets and the window state.
  const dir = mkdtempSync(join(tmpdir(), 'kdreams-tape-'));
  mkdirSync(join(dir, 'catalog'));
  const end = now - 120;
  const fake = async (url) => {
    if (url.includes('filter_type=CASH')) return { data: [{ ...pmT, condition_id: '0xother', outcome_index: 0, side: 'BUY', timestamp: end - 10, title: 'Other market?' }], pagination: { next_cursor: null } };
    if (url.includes('/trades?condition=')) return { data: [{ ...pmT, outcome_index: 1, size: 10, timestamp: end - 5 }, { ...pmT, outcome_index: 1, timestamp: end - 900 - 1 }], pagination: { next_cursor: null } };
    if (url.includes('/markets/trades')) return { trades: [{ ...ksT, count_fp: '2000', created_time: new Date((end - 30) * 1000).toISOString() }], cursor: '' };
    if (url.includes('/user-stats')) return { data: { trades: 1, join_date: end - 3600, all_time_pnl: { trade_count: 1 } } };
    throw new Error(`unexpected ${url}`);
  };
  const out = await collectTape({ kalshi: { pauseMs: 0 }, polymarket: { pauseMs: 0 }, wallets: { pauseMs: 0 } }, { dataDir: dir, t: '2026-11-09T00:00Z', nowSec: now, pmIds: ['0xc1'], ksTickers: ['KX-1'], fetchJson: fake });
  assert.deepEqual([out.big, out.flow, out.capped], [2, 2, 0]);
  const trades = readFileSync(join(dir, 'trades', '2026-11-09.ndjson'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  assert.deepEqual(trades.map((r) => `${r.v} ${r.id} ${r.usd}`), ['ks KX-1 1420', 'pm 0xother 1200']);
  const flowRows = readFileSync(join(dir, 'flow', '2026-11-09.ndjson'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  assert.deepEqual(flowRows.map((r) => `${r.v} ${r.k} ${r.yu} ${r.nu}`), ['pm 1 6 0', 'ks 1 0 1420']);
  const w = JSON.parse(readFileSync(join(dir, 'catalog', 'wallets.json'), 'utf8'));
  assert.equal(w['0xabc'].trades, 1); assert.equal(w['0xabc'].firstSeen, '2026-11-09T00:00Z');
  assert.equal(JSON.parse(readFileSync(join(dir, 'catalog', 'polymarket.json'), 'utf8'))['0xother'].title, 'Other market?');
  assert.equal(JSON.parse(readFileSync(join(dir, 'catalog', 'tape-state.json'), 'utf8')).end, end);
  // The next run starts where this one ended.
  assert.equal(await collectTape({}, { dataDir: dir, t: 'x', nowSec: now, fetchJson: fake }), null);
});

test('tape: summary shows where large money went and flags fresh wallets', async () => {
  const { parseTape, tapeSummary } = await import('./lib/kdreams-metrics.mjs');
  const { tapeEvidence } = await import('./kdreams-backtest.mjs');
  const trades = parseTape([
    JSON.stringify({ t: '2026-11-09T10:00:00Z', v: 'pm', id: 'c1', o: 0, s: 'B', p: 0.2, n: 10000, usd: 2000, w: '0xnew' }),
    JSON.stringify({ t: '2026-11-09T10:05:00Z', v: 'pm', id: 'c1', o: 1, s: 'B', p: 0.8, n: 1250, usd: 1000, w: '0xold' }),
    JSON.stringify({ t: '2026-11-09T11:00:00Z', v: 'ks', id: 'KX-1', o: 1, s: 'B', p: 0.5, n: 3000, usd: 1500 }),
    'junk',
  ].join('\n'));
  assert.equal(trades.length, 3);
  const wallets = { '0xnew': { join: '2026-11-07T00:00:00Z' }, '0xold': { join: '2025-01-01T00:00:00Z' } };
  const s = tapeSummary(trades, wallets, { pm: { c1: { title: 'Will X?' } } }, { freshDays: 7 });
  assert.deepEqual(s.venues, { pm: { trades: 2, usd: 3000 }, ks: { trades: 1, usd: 1500 } });
  assert.deepEqual(s.topMarkets.map((m) => `${m.venue} ${m.title} ${m.usd} ${m.yesShare}`), ['pm Will X? 3000 0.67', 'ks KX-1 1500 0']);
  assert.deepEqual([s.fresh.trades, s.fresh.usd, s.fresh.wallets, s.fresh.profiledWallets, s.fresh.topMarkets[0].yesShare], [1, 2000, 1, 2, 1]);
  assert.deepEqual([s.first, s.last], ['2026-11-09T10:00:00Z', '2026-11-09T11:00:00Z']);

  // The report reads the 24 hours before the last snapshot tick and nothing after it.
  const dir = mkdtempSync(join(tmpdir(), 'kdreams-tape-ev-'));
  mkdirSync(join(dir, 'trades')); mkdirSync(join(dir, 'catalog'));
  writeFileSync(join(dir, 'trades', '2026-11-09.ndjson'), trades.map((r) => JSON.stringify(r)).join('\n') + '\n');
  writeFileSync(join(dir, 'catalog', 'wallets.json'), JSON.stringify(wallets));
  assert.equal(tapeEvidence(dir, '2026-11-09T10:30Z', {}).venues.pm.trades, 2);
  assert.equal(tapeEvidence(dir, '2026-11-09T10:30Z', {}).venues.ks, undefined);
  assert.equal(tapeEvidence(dir, '2026-11-11T00:00Z', {}), null);
  assert.equal(tapeEvidence(join(dir, 'nope'), '2026-11-09T10:30Z', {}), null);
  assert.match(renderSummary({ ...computeReport({ dataDir: join(dir, 'nope') }), tape: s }), /Trade tape, last 24h[\s\S]*Fresh wallets \(joined within 7 days[^)]*\): 1 large trades, \$2000, 1 wallets; most in Will X\? \$2000 in 1 \(100% adding YES\)/);
});
