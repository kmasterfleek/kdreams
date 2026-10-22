#!/usr/bin/env node
/**
 * kdreams-nightly — the research half of the Dream Machine loop, pointed at
 * prediction markets instead of a codebase. Runs from GitHub Actions.
 *
 * Each night: pick tonight's surface from dream.config.json, run the backtest
 * over the recorded snapshots, grade every still-open frozen hypothesis on
 * snapshots recorded AFTER it was frozen, hand the evidence and the grades to
 * an OpenRouter model for observations + ONE new falsifiable hypothesis with a
 * machine-readable spec, witness the report, file a labeled issue, and commit
 * the report, one ledger row and the hypothesis registry straight to main so
 * the next night can see them.
 *
 * Grading is code, not judgment: a spec names one metric from SPEC_METRICS, a
 * venue or pair, an optional slice and a threshold, and the re-test computes
 * exactly that number on post-freeze rows. It is SUPPORTED or REFUTED once the
 * post-freeze data has backtest.retestMinTicks ticks and the metric's sample
 * reaches max(spec.minN, backtest.retestMinN); INCONCLUSIVE before that. A
 * hypothesis whose spec is missing or invalid is frozen as UNGRADEABLE.
 *
 * Honest scope: this is observe-only research. The model never sees an order
 * endpoint and nothing here trades. With no OPENROUTER_API_KEY it degrades to
 * LLM_EVAL=blocked, still grades frozen hypotheses, and files an honest
 * skipped note.
 *
 * Env: OPENROUTER_API_KEY (optional), OPENROUTER_MODEL (default deepseek/deepseek-v4-flash),
 *      OPENROUTER_FALLBACKS (comma list tried in order when the primary route fails;
 *      default qwen/qwen3.7-flash,openai/gpt-5-nano), GH_TOKEN (for gh),
 *      DREAM_CONFIG (default dream.config.json), DREAM_DATE (override)
 * The report records which model and provider actually answered.
 * Usage: node scripts/kdreams-nightly.mjs [--dry-run]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { computeReport, renderMarkdown, loadRows, loadResolutions, loadCatalogs, SPEC_METRICS, validateSpec, measureSpecRows, gradeSpec, describeSpec } from './kdreams-backtest.mjs';

const DRY = process.argv.includes('--dry-run');
const CONFIG = process.env.DREAM_CONFIG || 'dream.config.json';
const MODEL = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-v4-flash';
const FALLBACKS = (process.env.OPENROUTER_FALLBACKS ?? 'qwen/qwen3.7-flash,openai/gpt-5-nano').split(',').map((s) => s.trim()).filter(Boolean);
const KEY = process.env.OPENROUTER_API_KEY || '';
const LEDGER = 'docs/dream-cycle/LEDGER.md';
const HYPOTHESES = 'docs/dream-cycle/hypotheses.json';
const MAX_EVIDENCE_CHARS = 7000;
const MAX_HISTORY = 8;

function sh(cmd, args) { return execFileSync(cmd, args, { encoding: 'utf8' }).trim(); }
function shSafe(cmd, args) { try { return sh(cmd, args); } catch { return ''; } }
function loadJson(path, fallback) { try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return fallback; } }

function tonight() {
  const cfg = JSON.parse(readFileSync(CONFIG, 'utf8'));
  const date = process.env.DREAM_DATE || new Date().toISOString().slice(0, 10);
  const dayint = Number(date.replace(/-/g, ''));
  const { deep, scan } = cfg.slots[dayint % cfg.slots.length];
  const commit = shSafe('git', ['rev-parse', 'HEAD']) || '0'.repeat(40);
  return { cfg, date, deep, scan, commit };
}

function evidence() {
  const watchlist = loadJson('config/kdreams.watchlist.json', {});
  const dataDir = process.env.KDREAMS_DATA || 'data';
  const days = watchlist.backtest?.days ?? 14;
  const report = computeReport({ dataDir, watchlist, days });
  let md = renderMarkdown(report);
  if (md.length > MAX_EVIDENCE_CHARS) md = md.slice(0, MAX_EVIDENCE_CHARS) + '\n…(evidence truncated)';
  const list = (v) => report.topMarkets[v].map((m) => `- ${m.id.slice(0, 24)} | ${m.title.slice(0, 70)} | mid ${m.mid} | spread ${m.spreadCents}c`).join('\n');
  return { watchlist, dataDir, days, report, md, catalogs: `Polymarket top 30 by 24h volume:\n${list('pm')}\n\nKalshi top 30 by 24h volume:\n${list('ks')}` };
}

/** The full "Given ..." hypothesis line from a model answer, or null. */
export function extractHypothesis(text) {
  for (const raw of String(text).split('\n')) {
    const l = raw.trim().replace(/^["*_\-\s>]+/, '').replace(/["*_\s]+$/, '');
    if (/^Given\b/i.test(l)) return l;
  }
  return null;
}

/** The first fenced ```json block in a model answer, parsed; null when absent or not JSON. */
export function extractSpec(text) {
  const m = String(text).match(/```(?:json)?\s*\n([\s\S]*?)\n\s*```/);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

/** The spec contract the model must follow, built from the live metric catalog and pair names. */
export function specInstructions(pairs = []) {
  const metrics = Object.entries(SPEC_METRICS).map(([k, d]) => `  - ${k} (${d.kind === 'venue' ? 'needs "venue": "pm"|"ks"' : 'needs "pair"'}; n = ${d.n}): ${d.unit}`).join('\n');
  return `Metrics a spec may name (nothing else is measured):\n${metrics}\n` +
    `Configured pair names: ${pairs.map((p) => p.name).join(', ') || 'none'}.\n` +
    `Optional "slice": {"hoursUtc": [from, to] (whole UTC hours, from <= hour < to, wraps past midnight), "midMin": 0..1, "midMax": 0..1}. Maker slices apply at order entry.\n` +
    `resolution.* metrics slice instead on "priceMin"/"priceMax" (0.5..1, entry price of the favored side bought, min <= p < max) and "hoursToClose": [min, max) hours before the scheduled close, plus hoursUtc; they never take midMin/midMax.\n` +
    `Required: "op": ">" or "<", numeric "threshold". Optional "minN": the sample the metric needs before it is graded (a floor still applies).\n` +
    `The spec must say exactly what the Hypothesis sentence says; anything the catalog cannot express (volume tiers, cadence, depth beyond the touch, queue position) belongs in Next observation, not in the hypothesis.`;
}

/** Specs that predict money made after fees: the only kind allowed to already hold before the freeze. */
export function isProfitSpec(spec) {
  if (spec?.op !== '>') return false;
  if (spec.metric === 'maker.netCentsPerAttempt' || spec.metric === 'resolution.netCentsPer10') return spec.threshold >= 0;
  if (spec.metric === 'pair.bothSidesFracNetPositive') return spec.threshold > 0;
  return false;
}

/** Whether a measured value already satisfies a spec's threshold. */
export function holds(spec, value) {
  if (value === null || value === undefined) return false;
  return spec.op === '>' ? value > spec.threshold : value < spec.threshold;
}

/**
 * Why a valid spec would teach nothing, or null. A non-profit prediction the pre-freeze data
 * already satisfies is a restatement; after a non-profit night the next one must predict profit.
 */
export function specRejection(spec, baseline, { requireProfit = false } = {}) {
  if (requireProfit && !isProfitSpec(spec)) return 'the previous hypothesis did not predict profit, so tonight\'s must (resolution.netCentsPer10 or maker.netCentsPerAttempt > a threshold >= 0, or pair.bothSidesFracNetPositive > a threshold > 0, in some slice)';
  if (!isProfitSpec(spec) && holds(spec, baseline?.value)) return `already true before the freeze (${spec.metric} = ${baseline.value} on n=${baseline.n}); a non-profit prediction must claim a change from the recorded value`;
  return null;
}

/** The record the model sees: how many profit predictions it made and how many SUPPORTED grades were free. */
export function scorecard(hyps) {
  const graded = hyps.filter((h) => h.status === 'SUPPORTED' || h.status === 'REFUTED');
  const profit = graded.filter((h) => isProfitSpec(h.spec));
  const free = graded.filter((h) => h.status === 'SUPPORTED' && !isProfitSpec(h.spec) && holds(h.spec, h.baseline?.value));
  return `Record: ${graded.length} graded; profit predictions ${profit.length} (${profit.filter((h) => h.status === 'SUPPORTED').length} SUPPORTED); ` +
    `${free.length} SUPPORTED grade(s) were already true at freeze and carry no information.`;
}

/** Keep ledger cells and registry notes table-safe and short. */
export function cell(text, max = 160) {
  return trimWords(String(text).replace(/\|/g, '/').replace(/\s+/g, ' ').trim(), max);
}

/**
 * Split open hypotheses into ones old enough to grade and ones that are not.
 * `ticksSince(h)` returns how many ticks were recorded after h.frozenAt.
 * Hypotheses frozen before the backtest window are expired, never graded.
 */
export function planRetests(hyps, { date, days = 14, minTicks = 48, maxOpen = 5 }, ticksSince) {
  const cutoff = new Date(Date.parse(`${date}T00:00:00Z`) - days * 86400000).toISOString();
  const expired = [], due = [], tooSoon = [];
  const open = hyps.filter((h) => h.status === 'open' && h.date !== date);
  for (const h of open) if (h.frozenAt < cutoff) expired.push(h);
  const live = open.filter((h) => !expired.includes(h)).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, maxOpen);
  for (const h of live) {
    const ticks = ticksSince(h);
    (ticks >= minTicks ? due : tooSoon).push({ h, ticks });
  }
  return { expired, due, tooSoon };
}

/** One-line ledger summary of tonight's re-test grades. */
export function fatesSummary(grades) {
  if (!grades.length) return '';
  return cell(grades.map((g) => `${g.id.slice(5)} ${g.verdict}${g.ticks !== undefined ? ` (${g.ticks}t)` : ''}`).join('; '), 120);
}

async function research(ctx, ev, history = [], rules = '', retry = '') {
  if (!KEY) {
    return {
      blocked: true,
      body: `**LLM_EVAL=blocked** — no \`OPENROUTER_API_KEY\` is configured, so no model-backed research ran tonight. This is an honest research-skipped night for the \`${ctx.deep}\` surface. The recorded evidence below is still real.\n\n${ev.md}`,
      finding: `research skipped (no API key) on ${ctx.deep}`,
    };
  }
  const sys =
    'You are the research half of kdreams, an OBSERVE-ONLY nightly loop over Polymarket and Kalshi prediction markets. ' +
    'Goal: find one simple action that nets at least 1 cent on about $10 deployed (0.1% of capital per trade) after per-order fees, ' +
    'repeatably enough to run again and again: the flywheel. Convert per-contract numbers to return on capital: a contract bought at price p ' +
    'ties up p dollars, so x cents per contract is x/p percent (0.05c per contract at 50c is 0.1%). Kalshi rounds fees up to the cent per order, ' +
    'so a $10 order pays at least 1c in fees. Settled outcomes are recorded per market, and resolution.netCentsPer10 measures buying the favored side ' +
    'with $10 and holding to settlement; one loss at 98c erases about 50 wins, so it needs a large sample of independent markets. ' +
    'Be terse, technical, evidence-driven. ' +
    'Quote numbers only from the EVIDENCE block; never invent measurements. Grade external claims A (official/reproducible) / B (cross-checked) / C (single-source). ' +
    'Never recommend placing an order; the output is a hypothesis for a human to test on data recorded after tonight.';
  const user =
    `Date ${ctx.date}. Tonight's deep surface: "${ctx.deep}"; scan surfaces: ${(ctx.scan || []).join(', ')}.\n\n` +
    `EVIDENCE (computed from recorded top-of-book snapshots; the collector targets a 15-minute cadence, the real median gap is ${ev.report.generatedFrom.medianGapMinutes ?? 'n/a'} minutes):\n${ev.md}\n\n` +
    `CATALOG EXCERPT:\n${ev.catalogs}\n\n` +
    (history.length
      ? `EARLIER HYPOTHESES (graded by code on snapshots recorded after each was frozen; do not re-propose a REFUTED one unchanged):\n${history.join('\n')}\n${scorecard(ctx.hyps || [])}\n\n`
      : '') +
    `HYPOTHESIS SPEC CONTRACT:\n${specInstructions(ev.watchlist.pairs)}\n${rules}\n\n` +
    (retry ? `${retry}\n\n` : '') +
    `Produce, in under 450 words, with these exact headings:\n` +
    `## Observations — 2-4 bullets about "${ctx.deep}", each citing a number from EVIDENCE.\n` +
    `## Hypothesis — exactly one, in the form: "Given <market subset>, when <simple action>, then <metric> should be <op threshold> vs <baseline from EVIDENCE>, subject to <fee or risk invariant>." The threshold must be a stated number that the data could refute.\n` +
    `## Hypothesis spec — one fenced json block, e.g. {"metric": "maker.netCentsPerAttempt", "venue": "pm", "slice": {"hoursUtc": [5, 10], "midMin": 0.1}, "op": ">", "threshold": 0, "minN": 300}\n` +
    `## Next observation — one sentence: what to record or compute over the next 7 days to test it (no trading).\n` +
    `## Pair candidates — up to 3 lines "KALSHI_TICKER <-> polymarket id prefix — why" where the catalog excerpt shows the same real-world event on both venues AND YES means the same outcome on both (Republican vs Republican, never Republican vs Democratic; mids should be close), else "none found". Skip pairs already configured in EVIDENCE.`;

  // Try each model in turn with its own reasoning settings. Reasoning models cannot disable
  // thinking: DeepSeek honors a low effort hint, Qwen only honors an explicit token budget and
  // otherwise burns the whole output cap thinking. Empty content counts as a failure.
  const chain = [MODEL, ...FALLBACKS.filter((m) => m !== MODEL)];
  const messages = [{ role: 'system', content: sys }, { role: 'user', content: user }];
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}`, 'HTTP-Referer': `https://github.com/${ctx.cfg.repo}`, 'X-Title': 'kdreams nightly (observe-only)' };
  const failures = [];
  let json = null;
  for (const model of chain) {
    for (let attempt = 0; attempt < 2 && !json; attempt++) {
      const payload = { model, messages, max_tokens: 6000, temperature: 0.3, reasoning: reasoningFor(model) };
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', { method: 'POST', headers, body: JSON.stringify(payload) });
        const j = await res.json().catch(() => null);
        const content = j?.choices?.[0]?.message?.content?.trim();
        if (res.ok && !j?.error && content) { json = j; break; }
        const why = j?.error?.message || (content ? '' : `empty content (finish=${j?.choices?.[0]?.finish_reason})`) || `HTTP ${res.status}`;
        failures.push(`${model}: ${String(why).slice(0, 120)}`);
      } catch (e) { failures.push(`${model}: ${String(e.message || e).slice(0, 120)}`); }
      await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
    }
    if (json) break;
  }
  if (!json) {
    return { blocked: true, body: `**LLM_EVAL=blocked** — every model route failed:\n${failures.map((f) => `- ${f}`).join('\n')}\n\n${ev.md}`, finding: `research failed on ${ctx.deep}`, failures };
  }
  const served = `${json.model || MODEL}${json.provider ? ` via ${json.provider}` : ''}`;
  const content = json.choices[0].message.content.trim();
  const routeNote = failures.length ? `\n\n<details><summary>Model routes that failed before ${served} answered</summary>\n\n${failures.map((f) => `- ${f}`).join('\n')}\n</details>` : '';
  const body = content + `\n\n${ev.md}` + routeNote;
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
  const hypothesis = extractHypothesis(content);
  const firstProse = lines.find((l) => !/^#{1,6}\s|^[-*]\s*$/.test(l)) || `research on ${ctx.deep}`;
  const finding = trimWords((hypothesis || firstProse).replace(/^[#>*_\-\s"]+/, ''), 80);
  return { blocked: false, body, content, hypothesis, finding, usage: json.usage, served, failures };
}

/** Cut to at most `max` chars on a word boundary. */
function trimWords(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const at = cut.lastIndexOf(' ');
  return (at > max / 2 ? cut.slice(0, at) : cut).replace(/[,;:]$/, '') + '…';
}

/** Per-model reasoning settings (see research()). */
export function reasoningFor(model) {
  if (model.startsWith('deepseek/')) return { effort: 'low', exclude: true };
  if (model.startsWith('openai/')) return { effort: 'low', exclude: true };
  return { max_tokens: 1500, exclude: true };
}

/** Summarize the previous ledger row (date, verdict, issue) without shelling out. */
export function priorNightFates(ledgerPath) {
  let text = '';
  try { text = readFileSync(ledgerPath, 'utf8'); } catch { return 'first night'; }
  const rows = text.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('|') && !/^\|\s*(Date|---)\s*\|/.test(l));
  if (rows.length === 0) return 'first night';
  const cells = rows[rows.length - 1].replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
  const [date, deep, , issue, pr, , verdict] = cells;
  return `${date} ${deep} ${verdict} ${issue}${pr && pr !== 'NONE' ? ` ${pr}` : ''}`.slice(0, 60);
}

function witness(reportPath, commit) {
  const reportHash = createHash('sha256').update(readFileSync(reportPath)).digest('hex');
  return { reportHash, witness: createHash('sha256').update(reportHash + commit).digest('hex') };
}

async function main() {
  const ctx = tonight();
  console.log(`Tonight: DATE=${ctx.date} DEEP=${ctx.deep} SCAN=${(ctx.scan || []).join(',')} COMMIT=${ctx.commit.slice(0, 8)} MODEL=${KEY ? [MODEL, ...FALLBACKS].join(' -> ') : 'none'}`);
  const ev = evidence();
  const g = ev.report.generatedFrom;
  console.log(`Evidence: ${g.rows} rows, ${g.ticks} ticks, ${g.marketsPm} pm + ${g.marketsKs} ks markets`);

  // Grade frozen hypotheses on data recorded after each was frozen. Pure arithmetic: no model involved.
  const bt = ev.watchlist.backtest || {};
  const minTicks = bt.retestMinTicks ?? 48, minN = bt.retestMinN ?? 100;
  const hyps = loadJson(HYPOTHESES, []);
  const allRows = loadRows(ev.dataDir, ev.days).rows;
  const settled = { resolutions: loadResolutions(ev.dataDir), catalogs: loadCatalogs(ev.dataDir) };
  const after = (t) => allRows.filter((x) => x.t > t);
  const ticksAfter = (t) => new Set(after(t).map((x) => x.t)).size;
  const grades = [];
  for (const h of hyps.filter((x) => x.status === 'open' && x.date !== ctx.date)) {
    const why = validateSpec(h.spec, ev.watchlist.pairs);
    if (why) grades.push({ id: h.id, verdict: 'UNGRADEABLE', note: cell(h.specNote || why), by: 'rule' });
  }
  const plan = planRetests(hyps.filter((x) => !grades.some((gr) => gr.id === x.id)), { date: ctx.date, days: ev.days, minTicks, maxOpen: bt.retestMaxOpen ?? 5 }, (h) => ticksAfter(h.frozenAt));
  for (const { h, ticks } of plan.due) {
    const m = measureSpecRows(after(h.frozenAt), h.spec, ev.watchlist, settled);
    const gr = gradeSpec(h.spec, m, minN);
    if (gr.verdict === 'SUPPORTED' && !isProfitSpec(h.spec) && holds(h.spec, h.baseline?.value)) gr.note += '; already true before the freeze, so no information';
    grades.push({ id: h.id, ticks, ...gr, value: m.value, n: m.n, by: 'code' });
  }
  for (const { h, ticks } of plan.tooSoon) grades.push({ id: h.id, ticks, verdict: 'INCONCLUSIVE', note: `only ${ticks} post-freeze ticks (< ${minTicks})`, by: 'rule' });
  for (const h of plan.expired) grades.push({ id: h.id, verdict: 'EXPIRED', note: `frozen before the ${ev.days}-day window without a grade`, by: 'rule' });
  console.log(`Grades: ${grades.map((x) => `${x.id} ${x.verdict}`).join(', ') || 'none'}`);

  // What the model sees of the past: tonight's grades plus the most recent settled hypotheses.
  const tonightGrade = new Map(grades.map((x) => [x.id, x]));
  const history = hyps.filter((h) => h.date !== ctx.date).slice(-MAX_HISTORY).map((h) => {
    const gr = tonightGrade.get(h.id) || h.retests?.at(-1);
    const free = (gr?.verdict || h.status) === 'SUPPORTED' && !isProfitSpec(h.spec) && holds(h.spec, h.baseline?.value);
    return `- H ${h.id} [${gr?.verdict || h.status}${free ? ', already true at freeze' : ''}${isProfitSpec(h.spec) ? ', profit' : ''}] ${h.spec && !validateSpec(h.spec, ev.watchlist.pairs) ? describeSpec(h.spec) : cell(h.text, 140)}${gr?.note ? ` — ${gr.note}` : ''}`;
  });

  // Tonight's rules: no restating what the data already shows, and profit at least every other night.
  const prev = hyps.filter((h) => h.date < ctx.date).at(-1);
  const requireProfit = !!prev && !isProfitSpec(prev.spec);
  const rules = `A spec that the pre-freeze data already satisfies is rejected unless it predicts profit (resolution.netCentsPer10 or maker.netCentsPerAttempt > a threshold >= 0, or pair.bothSidesFracNetPositive > a threshold > 0); a non-profit prediction must claim a change from the recorded value.` +
    (requireProfit ? ` The previous hypothesis (${prev.id}) did not predict profit, so TONIGHT'S SPEC MUST be a profit prediction: choose the metric family whose EVIDENCE is closest to net positive per $10, find the slice where it is most plausible, and say why.` : '');
  ctx.hyps = hyps;
  const freeze = (res) => {
    if (!res.hypothesis) return null;
    const spec = extractSpec(res.content);
    const invalid = validateSpec(spec, ev.watchlist.pairs);
    const baseline = invalid ? null : measureSpecRows(allRows, spec, ev.watchlist, settled);
    const specError = invalid || specRejection(spec, baseline, { requireProfit });
    return { id: ctx.date, date: ctx.date, deep: ctx.deep, issue: 'LOCAL', text: res.hypothesis, spec, frozenAt: g.lastTick,
      baseline, status: specError ? 'UNGRADEABLE' : 'open', ...(specError ? { specNote: specError } : {}), retests: [] };
  };
  let r = await research(ctx, ev, history, rules);
  let frozen = r.blocked ? null : freeze(r);
  if (!r.blocked && frozen?.status !== 'open') {
    // One retry with the reason; a second miss is frozen as UNGRADEABLE with that reason.
    const why = frozen ? frozen.specNote : 'no Hypothesis section was found';
    console.log(`Spec rejected (${why}); asking once more`);
    const r2 = await research(ctx, ev, history, rules, `YOUR PREVIOUS ANSWER WAS REJECTED: ${why}.${frozen?.spec ? ` Its spec was ${JSON.stringify(frozen.spec)}.` : ''} Answer again in full with a hypothesis and spec that fix this.`);
    if (!r2.blocked) {
      const u1 = r.usage || {}, u2 = r2.usage || {};
      r = { ...r2, usage: { total_tokens: (u1.total_tokens || 0) + (u2.total_tokens || 0), ...(u1.cost !== undefined || u2.cost !== undefined ? { cost: (u1.cost || 0) + (u2.cost || 0) } : {}) },
        body: `${r2.body}\n\n<details><summary>First answer, rejected: ${cell(why, 200)}</summary>\n\n${r.content}\n</details>` };
      frozen = freeze(r);
    }
  }
  const decisive = grades.some((x) => x.verdict === 'SUPPORTED' || x.verdict === 'REFUTED');
  const evaluated = r.blocked ? 'blocked' : decisive ? 'yes' : 'no';
  const verdict = 'INCONCLUSIVE'; // tonight's own hypothesis is untested by construction
  const cost = r.usage ? ` (${r.usage.total_tokens} tokens${r.usage.cost !== undefined ? `, $${Number(r.usage.cost).toFixed(5)}` : ''})` : '';

  const specLine = frozen
    ? (frozen.status === 'open'
      ? `## Tonight's spec (frozen at ${frozen.frozenAt})\n\n- ${describeSpec(frozen.spec)}\n- pre-freeze value: ${frozen.baseline.value} on n=${frozen.baseline.n}; graded on post-freeze data once it has ${minTicks} ticks and n >= ${Math.max(frozen.spec.minN ?? 0, minN)}\n`
      : `## Tonight's spec\n\n- UNGRADEABLE: ${frozen.specNote}. The hypothesis is recorded but will never be graded.\n`) +
      (requireProfit ? `- tonight was a required profit night (previous hypothesis ${prev.id} did not predict profit)\n` : '')
    : '';
  const regradeTable = grades.length
    ? ['## Frozen hypotheses graded tonight', '', '| H | spec | post-freeze ticks | value | n | grade | by | note |', '|---|---|---|---|---|---|---|---|',
      ...grades.map((x) => { const h = hyps.find((y) => y.id === x.id); return `| ${x.id} | ${h.spec && !validateSpec(h.spec, ev.watchlist.pairs) ? cell(describeSpec(h.spec), 90) : 'none'} | ${x.ticks ?? 'n/a'} | ${x.value ?? 'n/a'} | ${x.n ?? 'n/a'} | ${x.verdict} | ${x.by} | ${x.note} |`; }), ''].join('\n')
    : '';

  // Dry runs never leave a report behind in the repo.
  const reportDir = DRY ? tmpdir() : 'docs/dream-cycle';
  mkdirSync(reportDir, { recursive: true });
  const reportPath = join(reportDir, `${ctx.date}-${ctx.deep}-report.md`);
  const report = [
    `# ${ctx.deep} — kdreams nightly research (${ctx.date})`, ``,
    `> kdreams nightly (GitHub Actions, observe-only research). Model: ${r.blocked ? 'none' : r.served}${cost}.`,
    `> Nothing here placed an order. Tonight's hypothesis is INCONCLUSIVE by construction: it is`,
    `> frozen at ${g.lastTick || 'n/a'} and is only graded on snapshots recorded after that.`, ``,
    ...(regradeTable ? [regradeTable] : []),
    ...(specLine ? [specLine] : []),
    r.body, ``, `## Witness`, `- session commit: \`${ctx.commit}\``,
  ].join('\n');
  writeFileSync(reportPath, report + '\n');
  const w = witness(reportPath, ctx.commit);
  writeFileSync(reportPath, report + `\n- report sha256: \`${w.reportHash}\`\n- witness: \`${w.witness}\`\n`);

  const finding = cell(r.finding || `research on ${ctx.deep}`, 80);
  const title = `[kdreams ${ctx.date}] ${ctx.deep}: ${finding}`;
  const priorFates = fatesSummary(grades) || priorNightFates(LEDGER);

  if (DRY) {
    console.log('--- DRY RUN ---'); console.log(title); console.log(readFileSync(reportPath, 'utf8'));
    console.log(`ledger row → verdict=${verdict} evaluated=${evaluated} witness=${w.witness.slice(0, 8)} priorFates=${priorFates}`);
    return;
  }

  let issueRef = 'LOCAL';
  try {
    const url = sh('gh', ['issue', 'create', '--title', title, '--body-file', reportPath, '--label', 'dream-cycle', '--label', 'research', '--label', 'kdreams']);
    issueRef = '#' + (url.match(/\/issues\/(\d+)/)?.[1] ?? '');
    console.log('issue:', url);
  } catch (e) { console.log('issue creation skipped:', String(e).split('\n')[0]); }

  // Update the registry: record every grade, settle graded hypotheses, freeze tonight's.
  for (const gr of grades) {
    const h = hyps.find((x) => x.id === gr.id);
    h.retests = [...(h.retests || []), { date: ctx.date, ticks: gr.ticks ?? null, value: gr.value ?? null, n: gr.n ?? null, verdict: gr.verdict, by: gr.by, note: gr.note }];
    if (gr.verdict === 'INCONCLUSIVE') continue;
    h.status = gr.verdict; h.settledOn = ctx.date;
    if (/^#\d+$/.test(h.issue || '')) {
      shSafe('gh', ['issue', 'comment', h.issue.slice(1), '--body', `Graded ${ctx.date} (${issueRef})${gr.ticks !== undefined ? ` on ${gr.ticks} post-freeze ticks` : ''}: **${gr.verdict}** — ${gr.note}`]);
      shSafe('gh', ['issue', 'close', h.issue.slice(1), '--reason', gr.verdict === 'SUPPORTED' || gr.verdict === 'REFUTED' ? 'completed' : 'not planned']);
    }
  }
  if (frozen) {
    frozen.issue = issueRef;
    const at = hyps.findIndex((x) => x.id === ctx.date);
    if (at >= 0) hyps[at] = frozen; else hyps.push(frozen);
  }
  writeFileSync(HYPOTHESES, JSON.stringify(hyps, null, 2) + '\n');

  execFileSync('node', ['packages/cli/dist/bin.js', 'ledger', 'append',
    '--path', LEDGER, '--date', ctx.date, '--deep', ctx.deep, '--finding', finding, '--issue', issueRef, '--pr', 'NONE',
    '--evaluated', evaluated, '--verdict', verdict, '--effect', `${g.rows} rows / ${g.ticks} ticks observed`,
    '--witness', w.witness.slice(0, 8), '--priorFates', priorFates], { stdio: 'inherit' });

  // Research artifacts go straight to main: the ledger and the registry are the loop's memory,
  // and a row parked on a side branch is invisible to the next night. Code never changes here.
  sh('git', ['config', 'user.name', 'kdreams[bot]']);
  sh('git', ['config', 'user.email', 'kdreams@users.noreply.github.com']);
  sh('git', ['add', LEDGER, HYPOTHESES, reportPath]);
  sh('git', ['commit', '-m', `dream(${ctx.deep}): ${issueRef} ${finding}`]);
  let pushed = false;
  for (let i = 1; i <= 3 && !pushed; i++) {
    try { sh('git', ['pull', '--rebase', 'origin', 'main']); sh('git', ['push', 'origin', 'HEAD:main']); pushed = true; }
    catch (e) { console.log(`push attempt ${i} failed: ${String(e).split('\n')[0]}`); shSafe('git', ['rebase', '--abort']); execFileSync('sleep', [String(i * 5)]); }
  }
  if (!pushed) throw new Error('could not push the nightly commit to main after 3 attempts');

  console.log(`Done. Issue ${issueRef} (evaluated=${evaluated}, verdict=${verdict}, re-tests: ${priorFates}). Witness: ${w.witness}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
