/**
 * kdreams-metrics — pure, deterministic metrics over snapshot rows.
 *
 * Everything here is an OBSERVATION over recorded top-of-book data. The maker
 * "fill" model is a proxy (price traded through our level), not a queue model,
 * and is labeled as such wherever it is reported. Nothing here places orders.
 */

const EPS = 1e-9;

export function round(x, d = 2) {
  if (x === null || x === undefined || !Number.isFinite(x)) return null;
  const f = 10 ** d;
  return Math.round((x + Number.EPSILON * Math.sign(x)) * f) / f;
}

export function parseRows(text) {
  const rows = [];
  for (const line of String(text).split('\n')) {
    const s = line.trim();
    if (!s) continue;
    try {
      const r = JSON.parse(s);
      if (r && r.t && r.v && r.id) rows.push(r);
    } catch { /* skip malformed line */ }
  }
  return rows;
}

export function mid(r) {
  if (twoSided(r)) return (r.b + r.a) / 2;
  if (r.last !== null && r.last !== undefined) return r.last;
  return null;
}

/** Map "venue:id" -> rows sorted by t (deduped by t, last wins). */
export function groupSeries(rows) {
  const m = new Map();
  for (const r of rows) {
    const k = `${r.v}:${r.id}`;
    if (!m.has(k)) m.set(k, new Map());
    m.get(k).set(r.t, r);
  }
  const out = new Map();
  for (const [k, byT] of m) out.set(k, [...byT.values()].sort((x, y) => (x.t < y.t ? -1 : x.t > y.t ? 1 : 0)));
  return out;
}

export function quantile(values, q) {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}

export function mean(values) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

export function corr(xs, ys) {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return null;
  const mx = mean(xs.slice(0, n)), my = mean(ys.slice(0, n));
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { const dx = xs[i] - mx, dy = ys[i] - my; sxy += dx * dy; sxx += dx * dx; syy += dy * dy; }
  if (sxx < EPS || syy < EPS) return null;
  return sxy / Math.sqrt(sxx * syy);
}

/** A real quote on both sides. Kalshi reports an empty side as bid 0 / ask 1, which is not a quote. */
function twoSided(r) {
  return r.b !== null && r.b !== undefined && r.a !== null && r.a !== undefined && r.b > EPS && r.a < 1 - EPS && r.a >= r.b;
}

/** Spread distribution (cents) + touch size for one series or a flat list of rows. */
export function spreadStats(rows) {
  const two = rows.filter(twoSided);
  const cents = two.map((r) => (r.a - r.b) * 100);
  const bs = two.map((r) => r.bs).filter((x) => x !== null && x !== undefined);
  const as = two.map((r) => r.as).filter((x) => x !== null && x !== undefined);
  return {
    n: rows.length, twoSided: two.length,
    medianCents: round(quantile(cents, 0.5)), p25Cents: round(quantile(cents, 0.25)), p75Cents: round(quantile(cents, 0.75)),
    fracOneCent: two.length ? round(cents.filter((c) => c <= 1 + EPS).length / two.length, 3) : null,
    fracLeTwoCents: two.length ? round(cents.filter((c) => c <= 2 + EPS).length / two.length, 3) : null,
    medianBidSize: round(quantile(bs, 0.5)), medianAskSize: round(quantile(as, 0.5)),
  };
}

/** Minutes between two snapshot timestamps. */
export function minutesBetween(t0, t1) {
  return (Date.parse(t1) - Date.parse(t0)) / 60000;
}

/** Median minutes between consecutive distinct ticks (the real collector cadence). */
export function medianGapMinutes(ticks) {
  const gaps = [];
  for (let i = 1; i < ticks.length; i++) gaps.push(minutesBetween(ticks[i - 1], ticks[i]));
  return round(quantile(gaps, 0.5), 1);
}

/**
 * Maker spread-capture PROXY for one series.
 * At each snapshot where the spread is exactly one tick, imagine resting a bid
 * at the best bid. It "fills" if within the horizon the best ask reaches our
 * price (the market traded through our level). After a fill we rest an ask one
 * tick higher; it "fills" if the best bid later reaches that price. Unexited
 * fills are marked to the last mid inside the horizon.
 *
 * The horizon is `horizonMinutes` of wall-clock time when given (snapshots are
 * irregular, so a tick count can silently stretch to many hours), else
 * `horizon` snapshots. An attempt with no later snapshot inside the window is
 * unobservable: it is counted in `unobserved`, not in `attempts`.
 */
export function makerSpreadProxy(series, { horizon = 4, horizonMinutes = null, tick = 0.01, makerFeeRate = 0, entryFilter = null } = {}) {
  let attempts = 0, unobserved = 0, fills = 0, roundTrips = 0, mtmCents = 0, feeCents = 0;
  const n = series.length;
  // Last index still inside the horizon that starts at index `from`.
  const lastInside = (from) => {
    if (horizonMinutes === null || horizonMinutes === undefined) return Math.min(from + horizon, n - 1);
    let j = from;
    while (j + 1 < n && minutesBetween(series[from].t, series[j + 1].t) <= horizonMinutes + EPS) j++;
    return j;
  };
  for (let i = 0; i < n; i++) {
    const p = series[i];
    if (!twoSided(p) || p.a - p.b > tick + EPS) continue;
    if (entryFilter && !entryFilter(p)) continue;
    const fillEnd = lastInside(i);
    if (fillEnd <= i) { unobserved++; continue; }
    attempts++;
    const bid = p.b;
    let filledAt = -1;
    for (let j = i + 1; j <= fillEnd; j++) {
      if (series[j].a !== null && series[j].a !== undefined && series[j].a <= bid + EPS) { filledAt = j; break; }
    }
    if (filledAt < 0) continue;
    fills++;
    const exitPx = bid + tick;
    let exited = false;
    const end = lastInside(filledAt);
    for (let k = filledAt + 1; k <= end; k++) {
      if (series[k].b !== null && series[k].b !== undefined && series[k].b >= exitPx - EPS) { exited = true; break; }
    }
    const legFee = makerFeeRate * bid * (1 - bid) * 100;
    if (exited) { roundTrips++; feeCents += 2 * legFee; }
    else { const m = mid(series[end]); mtmCents += ((m ?? bid) - bid) * 100; feeCents += legFee; }
  }
  const grossCents = roundTrips * tick * 100;
  const netCents = grossCents - feeCents + mtmCents;
  return {
    model: 'proxy: fill when price trades through our level; no queue position',
    attempts, unobserved, fills, roundTrips,
    fillRate: attempts ? round(fills / attempts, 3) : null,
    roundTripRate: fills ? round(roundTrips / fills, 3) : null,
    grossCents: round(grossCents), feeCents: round(feeCents), mtmCents: round(mtmCents), netCents: round(netCents),
    netCentsPerAttempt: attempts ? round(netCents / attempts, 3) : null,
  };
}

/** Sum a list of makerSpreadProxy results. */
export function sumProxies(list) {
  const s = { attempts: 0, unobserved: 0, fills: 0, roundTrips: 0, grossCents: 0, feeCents: 0, mtmCents: 0, netCents: 0 };
  for (const r of list) for (const k of Object.keys(s)) s[k] += r[k] || 0;
  return {
    ...s, grossCents: round(s.grossCents), feeCents: round(s.feeCents), mtmCents: round(s.mtmCents), netCents: round(s.netCents),
    fillRate: s.attempts ? round(s.fills / s.attempts, 3) : null,
    roundTripRate: s.fills ? round(s.roundTrips / s.fills, 3) : null,
    netCentsPerAttempt: s.attempts ? round(s.netCents / s.attempts, 3) : null,
  };
}

function takerFeeCents(rate, p) {
  return rate * p * (1 - p) * 100;
}

/** Align two series on identical timestamps. */
export function align(a, b) {
  const byT = new Map(b.map((r) => [r.t, r]));
  const out = [];
  for (const r of a) { const s = byT.get(r.t); if (s) out.push([r, s]); }
  return out;
}

/** Cross-venue divergence, gross/net "buy both sides" check, and lead-lag for one pair. */
export function crossVenue(pmSeries, ksSeries, fees = {}) {
  const pmT = fees.polymarketTakerRate ?? 0.04, ksT = fees.kalshiTakerRate ?? 0.07;
  const pairs = align(pmSeries, ksSeries).filter(([p, k]) => mid(p) !== null && mid(k) !== null);
  const diffs = pairs.map(([p, k]) => (mid(p) - mid(k)) * 100);
  const abs = diffs.map(Math.abs);
  let grossPos = 0, netPos = 0, maxNet = -Infinity;
  const netWhenPos = [];
  for (const [p, k] of pairs) {
    if (!twoSided(p) || !twoSided(k)) continue;
    // A: YES on Polymarket at ask, NO on Kalshi at (1 - yes bid).  B: the mirror.
    const legs = [
      { cost: p.a + (1 - k.b), fee: takerFeeCents(pmT, p.a) + takerFeeCents(ksT, 1 - k.b) },
      { cost: k.a + (1 - p.b), fee: takerFeeCents(ksT, k.a) + takerFeeCents(pmT, 1 - p.b) },
    ];
    for (const l of legs) {
      const gross = (1 - l.cost) * 100;
      const net = gross - l.fee;
      if (gross > EPS) grossPos++;
      if (net > EPS) { netPos++; netWhenPos.push(net); }
      if (net > maxNet) maxNet = net;
    }
  }
  const dp = [], dk = [];
  for (let i = 1; i < pairs.length; i++) {
    dp.push(mid(pairs[i][0]) - mid(pairs[i - 1][0]));
    dk.push(mid(pairs[i][1]) - mid(pairs[i - 1][1]));
  }
  const leadLag = [];
  for (let lag = -3; lag <= 3; lag++) {
    const xs = [], ys = [];
    for (let i = 0; i < dp.length; i++) { const j = i + lag; if (j >= 0 && j < dk.length) { xs.push(dp[i]); ys.push(dk[j]); } }
    leadLag.push({ lag, corr: round(corr(xs, ys), 3), n: xs.length });
  }
  // Highest POSITIVE co-movement wins, nearest lag on ties: lag > 0 means a Polymarket move is echoed by Kalshi `lag` ticks later.
  const best = leadLag.filter((x) => x.corr !== null).sort((x, y) => (y.corr - x.corr) || (Math.abs(x.lag) - Math.abs(y.lag)))[0] || null;
  const checks = pairs.length * 2;
  return {
    n: pairs.length,
    meanDiffCents: round(mean(diffs)), meanAbsCents: round(mean(abs)), maxAbsCents: round(abs.length ? Math.max(...abs) : null),
    fracAbsGt2c: pairs.length ? round(abs.filter((x) => x > 2).length / pairs.length, 3) : null,
    fracAbsGt5c: pairs.length ? round(abs.filter((x) => x > 5).length / pairs.length, 3) : null,
    bothSides: {
      checks, fracGrossPositive: checks ? round(grossPos / checks, 3) : null, fracNetPositive: checks ? round(netPos / checks, 3) : null,
      meanNetCentsWhenPositive: round(mean(netWhenPos)), maxNetCents: Number.isFinite(maxNet) ? round(maxNet) : null,
    },
    leadLag, bestLag: best, leads: best && best.corr !== null ? (best.lag > 0 ? 'polymarket' : best.lag < 0 ? 'kalshi' : 'simultaneous') : null,
  };
}

/** Spread by UTC hour (0-23) and weekday (0=Sun) for a flat list of rows. */
export function byBucket(rows, which = 'hour') {
  const buckets = new Map();
  for (const r of rows) {
    if (!twoSided(r)) continue;
    const d = new Date(r.t);
    const k = which === 'hour' ? d.getUTCHours() : d.getUTCDay();
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k).push((r.a - r.b) * 100);
  }
  return [...buckets.entries()].sort((x, y) => x[0] - y[0]).map(([k, cents]) => ({
    [which]: k, n: cents.length, meanSpreadCents: round(mean(cents)), fracOneCent: round(cents.filter((c) => c <= 1 + EPS).length / cents.length, 3),
  }));
}

/** Markets that most often sit at a one-tick spread with real size at the touch. */
export function candidates(seriesMap, catalogs, { minPoints = 8, top = 10 } = {}) {
  const out = [];
  for (const [key, series] of seriesMap) {
    const [v, id] = [key.slice(0, 2), key.slice(3)];
    const s = spreadStats(series);
    if (s.twoSided < minPoints || s.fracOneCent === null) continue;
    const touch = Math.min(s.medianBidSize ?? 0, s.medianAskSize ?? 0);
    const last = series[series.length - 1];
    out.push({
      venue: v, id, title: catalogs?.[v]?.[id]?.title || id, points: s.twoSided, fracOneCent: s.fracOneCent,
      medianTouch: round(touch), mid: round(mid(last), 3), v24: round(last.v24), score: round(s.fracOneCent * Math.log10(1 + touch), 3),
    });
  }
  return out.sort((x, y) => y.score - x.score || x.id.localeCompare(y.id)).slice(0, top);
}

/** Static fee table: cents per contract at a few prices, under the configured schedules. */
export function feeTable(fees = {}) {
  const pmT = fees.polymarketTakerRate ?? 0.04, pmM = fees.polymarketMakerRate ?? 0;
  const ksT = fees.kalshiTakerRate ?? 0.07, ksM = fees.kalshiMakerRate ?? 0.0175;
  return [0.05, 0.1, 0.2, 0.3, 0.4, 0.5].map((p) => ({
    price: p, pmTaker: round(takerFeeCents(pmT, p)), pmMaker: round(takerFeeCents(pmM, p)),
    ksTaker: round(takerFeeCents(ksT, p)), ksMaker: round(takerFeeCents(ksM, p)),
    oneCentMakerRoundTripNet: { polymarket: round(1 - 2 * takerFeeCents(pmM, p)), kalshi: round(1 - 2 * takerFeeCents(ksM, p)) },
  }));
}

/**
 * Row predicate for a hypothesis slice: { hoursUtc: [from, to], midMin, midMax }.
 * hoursUtc keeps rows with from <= UTC hour < to, wrapping past midnight when from > to.
 * Mid bounds are inclusive and use mid(), so a row without a real quote fails them.
 */
export function sliceFilter(slice = {}) {
  const h = slice.hoursUtc;
  const hasMid = slice.midMin !== undefined || slice.midMax !== undefined;
  return (r) => {
    if (h) {
      const hour = new Date(r.t).getUTCHours();
      if (h[0] <= h[1] ? hour < h[0] || hour >= h[1] : hour < h[0] && hour >= h[1]) return false;
    }
    if (hasMid) {
      const m = mid(r);
      if (m === null || (slice.midMin !== undefined && m < slice.midMin - EPS) || (slice.midMax !== undefined && m > slice.midMax + EPS)) return false;
    }
    return true;
  };
}

/** Resolution rows (data/resolutions.ndjson text) keyed "v:id"; later lines never override earlier ones. */
export function parseResolutions(text) {
  const m = new Map();
  for (const line of String(text).split('\n')) {
    if (!line.trim()) continue;
    try {
      const r = JSON.parse(line);
      const k = `${r.v}:${r.id}`;
      if (r.v && r.id && Number.isFinite(r.y) && r.at && !m.has(k)) m.set(k, r);
    } catch { /* skip junk */ }
  }
  return m;
}

/**
 * Hold to resolution: buy the favored side (YES at the ask when the ask is >= 0.5, else NO at
 * 1 - bid) with `stake` dollars at the first snapshot that fits the slice, and hold until the
 * market settles. Only resolved markets count, and only snapshots before settlement. A touch
 * showing less than `stake` dollars of size is skipped; rows without sizes count as `unsized`. Kalshi markets are
 * entered once per event (both sides of one game are one bet). Kalshi taker fees round up to the
 * cent per order; Polymarket's do not.
 *
 * Slice keys: priceMin <= entry price < priceMax; hoursToClose [min, max) measured to the
 * catalog close time; plus the usual hoursUtc. Returns net cents per `stake` dollars entered.
 */
export function holdToResolution(rows, resolutions, catalogs = {}, { fees = {}, stake = 10, slice = {} } = {}) {
  const pmT = fees.polymarketTakerRate ?? 0.04, ksT = fees.kalshiTakerRate ?? 0.07;
  const inHours = sliceFilter({ hoursUtc: slice.hoursUtc });
  const pMin = slice.priceMin ?? 0.5, pMax = slice.priceMax ?? 1;
  const entries = [], events = new Set();
  for (const [key, series] of groupSeries(rows)) {
    const res = resolutions.get(key);
    if (!res) continue;
    const v = key.slice(0, 2), id = key.slice(3);
    const meta = catalogs[v]?.[id] || {};
    const event = v === 'ks' && meta.event ? `ks:${meta.event}` : null;
    if (event && events.has(event)) continue;
    for (const r of series) {
      if (r.t >= res.at || !twoSided(r) || !inHours(r)) continue;
      const yes = r.a >= 0.5;
      const p = yes ? r.a : 1 - r.b, size = yes ? r.as : r.bs;
      if (p < pMin - EPS || p >= pMax - EPS || p >= 1) continue;
      if (slice.hoursToClose) {
        const close = Date.parse(meta.closeTime || '');
        const h = (close - Date.parse(r.t)) / 3600000;
        if (!Number.isFinite(h) || h < slice.hoursToClose[0] || h >= slice.hoursToClose[1]) continue;
      }
      if (size !== null && size !== undefined && !(size * p >= stake)) continue;
      const n = Math.floor(stake / p + EPS);
      const rawFee = (v === 'pm' ? pmT : ksT) * n * p * (1 - p) * 100;
      const fee = v === 'ks' ? Math.ceil(rawFee - EPS) : rawFee;
      const payout = yes ? res.y : 1 - res.y;
      entries.push({ key, t: r.t, p, sized: size !== null && size !== undefined, win: payout > p, net: n * (payout - p) * 100 - fee, fee, holdHours: (Date.parse(res.at) - Date.parse(r.t)) / 3600000 });
      if (event) events.add(event);
      break;
    }
  }
  const nets = entries.map((e) => e.net);
  return {
    markets: entries.length,
    unsized: entries.filter((e) => !e.sized).length,
    wins: entries.filter((e) => e.win).length,
    winRate: entries.length ? round(entries.filter((e) => e.win).length / entries.length, 3) : null,
    netCentsPer10: entries.length ? round((mean(nets) * 10) / stake, 1) : null,
    worstCents: entries.length ? round(Math.min(...nets)) : null,
    meanPrice: entries.length ? round(mean(entries.map((e) => e.p)), 3) : null,
    feeCents: round(entries.reduce((a, e) => a + e.fee, 0)),
    medianHoldHours: entries.length ? round(quantile(entries.map((e) => e.holdHours), 0.5), 1) : null,
  };
}
