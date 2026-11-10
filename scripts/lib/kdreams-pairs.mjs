/**
 * Pure helpers for the cross-venue pair scanner: match Polymarket and Kalshi
 * markets that name the same event, and price buying both sides with $10.
 * Dependency-free: the 15-minute collector imports this.
 */

const STOP = new Set(('will the a an of on in to be by vs v at after before win wins winner who which what is are for and or ' +
  'there any than more less over under next does do this that it its with from as during end ' +
  'january february march april may june july august september october november december ' +
  'jan feb mar apr jun jul aug sep sept oct nov dec yes no').split(' '));

/** Venue wording that means the same thing. */
const SYN = {
  hike: 'increase', hikes: 'increase', raise: 'increase', raises: 'increase', increases: 'increase',
  cut: 'decrease', cuts: 'decrease', lower: 'decrease', lowers: 'decrease', decreases: 'decrease',
  maintains: 'nochange', maintain: 'nochange', hold: 'nochange', holds: 'nochange', unchanged: 'nochange',
  republicans: 'republican', gop: 'republican', democrats: 'democratic', democrat: 'democratic', dems: 'democratic',
  bps: 'bp', basis: 'bp', federal: 'fed', reserve: 'fed', fomc: 'fed', btc: 'bitcoin', eth: 'ethereum',
};

/**
 * Normalised content words of a market title (dates, years and filler dropped).
 * Bounds and rate moves become one token each so they are compared exactly:
 * ">25" -> gt25, "50+" -> ge50, "25 bps" / "25bps" -> bp25.
 */
export function titleTokens(s) {
  const words = String(s || '').toLowerCase().replace(/[’']/g, '').replace(/\d{4}-\d{2}-\d{2}/g, ' ')
    .replace(/(\d),(\d{3})/g, '$1$2').replace(/\bno change\b/g, 'nochange')
    .replace(/>\s*(\d+(?:\.\d+)?)/g, ' gt$1 ').replace(/(\d+(?:\.\d+)?)\s*\+/g, ' ge$1 ')
    .replace(/(?<![a-z\d.])(\d+(?:\.\d+)?)\s*(?:bps?|basis points)\b/g, ' bp$1 ')
    .replace(/(\d)([a-z])/g, '$1 $2').split(/[^a-z0-9.]+/);
  const out = new Set();
  for (let w of words) {
    w = w.replace(/^\.+|\.+$/g, '');
    if (!w || STOP.has(w) || /^20\d\d$/.test(w)) continue;
    if (SYN[w]) w = SYN[w];
    else if (w.length > 4 && /[^s]s$/.test(w) && !/\d/.test(w)) w = w.slice(0, -1); // rates -> rate
    out.add(w);
  }
  return out;
}

function jaccard(a, b) {
  let inter = 0;
  for (const w of a) if (b.has(w)) inter++;
  return inter / (a.size + b.size - inter || 1);
}

/** Thresholds and other figures a title commits to (bounds, rate moves, numbers >= 100 or with a decimal point); day numbers are left out. */
function figures(T) {
  return [...T].filter((w) => /^(gt|ge|bp)\d/.test(w) || (/^\d+(\.\d+)?$/.test(w) && (w.includes('.') || Number(w) >= 100))).sort().join(',');
}

const mid = (q) => (q.b != null && q.a != null ? (q.b + q.a) / 2 : null);

/**
 * One-to-one Polymarket/Kalshi matches.
 * pm: [{ id, title, close, b, a }], ks: [{ id, title, sub, close, b, a }] (close = ISO time).
 * A match needs closes within maxCloseHours, title overlap >= minScore, Kalshi's outcome
 * words present in the Polymarket title, the same figures (price levels, counts) on both sides,
 * and mids within maxMidDiff (so YES means the same thing). A Kalshi market fixed to a clock time
 * ("at 5pm EST") must close within an hour of its Polymarket match: a noon reading is another event.
 */
export function matchPairs(pm, ks, { maxCloseHours = 12, minScore = 0.3, maxMidDiff = 0.06 } = {}) {
  const P = pm.map((m) => { const T = titleTokens(m.title); return { m, T, F: figures(T), c: Date.parse(m.close), mid: mid(m) }; });
  const cands = [];
  for (const k of ks) {
    const c = Date.parse(k.close), kmid = mid(k);
    if (!Number.isFinite(c) || kmid === null) continue;
    const T = titleTokens(`${k.title} ${k.sub || ''}`), F = figures(T), S = [...titleTokens(k.sub)].filter((w) => !/^[\d.]+$/.test(w));
    const window = /\b\d{1,2}(:\d\d)?\s?(am|pm)\b/i.test(k.title) ? 1 : maxCloseHours;
    for (const p of P) {
      if (!Number.isFinite(p.c) || p.mid === null || Math.abs(p.c - c) / 36e5 > window || p.F !== F) continue;
      if (S.length && S.filter((w) => p.T.has(w)).length < Math.ceil(S.length / 2)) continue;
      const score = jaccard(T, p.T);
      if (score < minScore || Math.abs(p.mid - kmid) > maxMidDiff) continue;
      cands.push({ pm: p.m, ks: k, score: Math.round(score * 100) / 100, midDiffCents: Math.round((p.mid - kmid) * 1000) / 10 });
    }
  }
  cands.sort((x, y) => y.score - x.score || Math.abs(x.midDiffCents) - Math.abs(y.midDiffCents));
  const usedP = new Set(), usedK = new Set(), out = [];
  for (const x of cands) {
    if (usedP.has(x.pm.id) || usedK.has(x.ks.id)) continue;
    usedP.add(x.pm.id); usedK.add(x.ks.id); out.push(x);
  }
  return out;
}

/**
 * Buy YES on one venue and NO on the other with `stake` dollars, both at the touch.
 * pmQ/ksQ: { b, a, bs, as } for YES. Kalshi's taker fee rounds up to the cent per order;
 * Polymarket's is rate * n * p(1-p) at the market's own rate (0 when fees are off).
 * Returns the better direction, or null when neither can be priced.
 */
export function bothSidesPer10(pmQ, ksQ, { pmFeeRate = 0.04, ksFeeRate = 0.07, stake = 10 } = {}) {
  const dirs = [
    { dir: 'pm YES + ks NO', pmP: pmQ.a, ksP: ksQ.b == null ? null : 1 - ksQ.b, size: [pmQ.as, ksQ.bs] },
    { dir: 'ks YES + pm NO', pmP: pmQ.b == null ? null : 1 - pmQ.b, ksP: ksQ.a, size: [pmQ.bs, ksQ.as] },
  ];
  let best = null;
  for (const d of dirs) {
    if (d.pmP == null || d.ksP == null) continue;
    const cost = d.pmP + d.ksP, n = Math.floor(stake / cost);
    if (!(n > 0)) continue;
    const ksFee = Math.ceil(ksFeeRate * n * d.ksP * (1 - d.ksP) * 100 - 1e-9);
    const pmFee = pmFeeRate * n * d.pmP * (1 - d.pmP) * 100;
    const netCents = Math.round((n * (1 - cost) * 100 - ksFee - pmFee) * 10) / 10;
    const sizeOk = d.size.every((s) => s != null) ? d.size.every((s) => s >= n) : null;
    if (!best || netCents > best.netCents) best = { dir: d.dir, cost: Math.round(cost * 1000) / 1000, contracts: n, netCents, sizeOk };
  }
  return best;
}

/** The markets a scan asks the collector to keep recording: the `n` pairs closest to net positive. */
export function scanPins(scan, n = 20) {
  const pairs = [...(scan?.pairs || [])].sort((x, y) => (y.best?.netCents ?? -Infinity) - (x.best?.netCents ?? -Infinity)).slice(0, n);
  return { pm: pairs.map((p) => p.pmId), ks: pairs.map((p) => p.ksTicker) };
}
