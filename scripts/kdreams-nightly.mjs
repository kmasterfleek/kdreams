#!/usr/bin/env node
/**
 * kdreams-nightly — the research half of the Dream Machine loop, pointed at
 * prediction markets instead of a codebase. Runs from GitHub Actions.
 *
 * Each night: pick tonight's surface from dream.config.json, run the backtest
 * over the recorded snapshots, re-test every still-open frozen hypothesis on
 * snapshots recorded AFTER it was frozen, hand that evidence to a cheap
 * OpenRouter model for re-test grades + observations + ONE new falsifiable
 * hypothesis, witness the report, file a labeled issue, and commit the report,
 * one ledger row and the hypothesis registry straight to main so the next
 * night can see them.
 *
 * Honest scope: this is observe-only research. The model never sees an order
 * endpoint and nothing here trades. Tonight's own hypothesis is INCONCLUSIVE by
 * construction; a frozen one is only graded once it has at least
 * backtest.retestMinTicks post-freeze ticks, and below that the grade is a
 * code-enforced INCONCLUSIVE that never reaches the model. With no
 * OPENROUTER_API_KEY it degrades to LLM_EVAL=blocked and still files an honest
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
import { computeReport, renderMarkdown, renderSummary } from './kdreams-backtest.mjs';

const DRY = process.argv.includes('--dry-run');
const CONFIG = process.env.DREAM_CONFIG || 'dream.config.json';
const MODEL = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-v4-flash';
const FALLBACKS = (process.env.OPENROUTER_FALLBACKS ?? 'qwen/qwen3.7-flash,openai/gpt-5-nano').split(',').map((s) => s.trim()).filter(Boolean);
const KEY = process.env.OPENROUTER_API_KEY || '';
const LEDGER = 'docs/dream-cycle/LEDGER.md';
const HYPOTHESES = 'docs/dream-cycle/hypotheses.json';
const MAX_EVIDENCE_CHARS = 7000;
const MAX_RETEST_CHARS = 1800;
const GRADES = ['SUPPORTED', 'REFUTED', 'INCONCLUSIVE'];

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

/** Grades from the model's "## Re-tests" section: lines like "H 2026-10-15: REFUTED — why". */
export function parseRetests(text) {
  const out = new Map();
  for (const raw of String(text).split('\n')) {
    const m = raw.match(/\bH[\s-]*(\d{4}-\d{2}-\d{2})\**\s*[:—–-]\s*\**\s*(SUPPORTED|REFUTED|INCONCLUSIVE)\b\**\s*[—–:-]*\s*(.*)$/i);
    if (m && !out.has(m[1])) out.set(m[1], { verdict: m[2].toUpperCase(), note: m[3].trim() });
  }
  return out;
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

async function research(ctx, ev, retests = []) {
  if (!KEY) {
    return {
      blocked: true,
      body: `**LLM_EVAL=blocked** — no \`OPENROUTER_API_KEY\` is configured, so no model-backed research ran tonight. This is an honest research-skipped night for the \`${ctx.deep}\` surface. The recorded evidence below is still real.\n\n${ev.md}`,
      finding: `research skipped (no API key) on ${ctx.deep}`,
    };
  }
  const sys =
    'You are the research half of kdreams, an OBSERVE-ONLY nightly loop over Polymarket and Kalshi prediction markets. ' +
    'Goal: find simple, repeatable actions that net about one cent per contract after fees. Be terse, technical, evidence-driven. ' +
    'Quote numbers only from the EVIDENCE block; never invent measurements. Grade external claims A (official/reproducible) / B (cross-checked) / C (single-source). ' +
    'Never recommend placing an order; the output is a hypothesis for a human to test on data recorded after tonight.';
  const user =
    `Date ${ctx.date}. Tonight's deep surface: "${ctx.deep}"; scan surfaces: ${(ctx.scan || []).join(', ')}.\n\n` +
    `EVIDENCE (computed from recorded top-of-book snapshots; the collector targets a 15-minute cadence, the real median gap is ${ev.report.generatedFrom.medianGapMinutes ?? 'n/a'} minutes):\n${ev.md}\n\n` +
    `CATALOG EXCERPT:\n${ev.catalogs}\n\n` +
    (retests.length
      ? `RE-TESTS: each hypothesis below was frozen on an earlier night. Its evidence block is computed ONLY from snapshots recorded after it was frozen. Grade each one on that evidence alone.\n\n` +
        retests.map(({ h, md }) => `### H ${h.id} (${h.deep}, frozen at ${h.frozenAt})\n${h.text}\n\nPost-freeze evidence:\n${md}`).join('\n\n') + '\n\n'
      : '') +
    `Produce, in under ${retests.length ? 550 : 400} words, with these exact headings:\n` +
    (retests.length
      ? `## Re-tests — one line per hypothesis above, exactly "H <date>: SUPPORTED|REFUTED|INCONCLUSIVE — <reason citing a post-freeze number>". INCONCLUSIVE when the post-freeze evidence does not measure the hypothesis's metric.\n`
      : '') +
    `## Observations — 2-4 bullets about "${ctx.deep}", each citing a number from EVIDENCE.\n` +
    `## Hypothesis — exactly one, in the form: "Given <market subset>, when <simple action>, then <metric from EVIDENCE> should be <direction/threshold> vs <baseline>, subject to <fee or risk invariant>."\n` +
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

  // Re-test frozen hypotheses on data recorded after each was frozen.
  const bt = ev.watchlist.backtest || {};
  const hyps = loadJson(HYPOTHESES, []);
  const sinceCache = new Map();
  const postFreeze = (h) => {
    if (!sinceCache.has(h.frozenAt)) sinceCache.set(h.frozenAt, computeReport({ dataDir: ev.dataDir, watchlist: ev.watchlist, days: ev.days, since: h.frozenAt }));
    return sinceCache.get(h.frozenAt);
  };
  const plan = planRetests(hyps, { date: ctx.date, days: ev.days, minTicks: bt.retestMinTicks ?? 48, maxOpen: bt.retestMaxOpen ?? 5 }, (h) => postFreeze(h).generatedFrom.ticks);
  const retests = plan.due.map(({ h }) => {
    let md = renderSummary(postFreeze(h));
    if (md.length > MAX_RETEST_CHARS) md = md.slice(0, MAX_RETEST_CHARS) + ' …(truncated)';
    return { h, md };
  });
  console.log(`Re-tests: ${plan.due.length} due, ${plan.tooSoon.length} too soon, ${plan.expired.length} expired`);

  const r = await research(ctx, ev, retests);
  const evaluated = r.blocked ? 'blocked' : 'no';
  const verdict = 'INCONCLUSIVE'; // tonight's own hypothesis is untested by construction
  const cost = r.usage ? ` (${r.usage.total_tokens} tokens${r.usage.cost !== undefined ? `, $${Number(r.usage.cost).toFixed(5)}` : ''})` : '';

  const minTicks = bt.retestMinTicks ?? 48;
  const modelGrades = r.blocked ? new Map() : parseRetests(r.content);
  const grades = [
    ...plan.due.map(({ h, ticks }) => {
      const g = modelGrades.get(h.id);
      return { id: h.id, ticks, verdict: g?.verdict || 'INCONCLUSIVE', note: g ? cell(g.note) : (r.blocked ? 'no model ran' : 'model gave no grade'), by: g ? 'model' : 'rule' };
    }),
    ...plan.tooSoon.map(({ h, ticks }) => ({ id: h.id, ticks, verdict: 'INCONCLUSIVE', note: `only ${ticks} post-freeze ticks (< ${minTicks})`, by: 'rule' })),
    ...plan.expired.map((h) => ({ id: h.id, verdict: 'EXPIRED', note: `frozen before the ${ev.days}-day window without a grade`, by: 'rule' })),
  ];
  const regradeTable = grades.length
    ? ['## Frozen hypotheses re-tested tonight', '', '| H | post-freeze ticks | grade | by | note |', '|---|---|---|---|---|',
      ...grades.map((g) => `| ${g.id} | ${g.ticks ?? 'n/a'} | ${g.verdict} | ${g.by} | ${g.note} |`), ''].join('\n')
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
    h.retests = [...(h.retests || []), { date: ctx.date, ticks: gr.ticks ?? null, verdict: gr.verdict, by: gr.by, note: gr.note }];
    if (gr.verdict !== 'INCONCLUSIVE') { h.status = gr.verdict; h.settledOn = ctx.date; }
    if (gr.by === 'model' && /^#\d+$/.test(h.issue || '')) {
      shSafe('gh', ['issue', 'comment', h.issue.slice(1), '--body', `Re-test ${ctx.date} (${issueRef}) on ${gr.ticks} post-freeze ticks: **${gr.verdict}** — ${gr.note}`]);
      if (h.status !== 'open') shSafe('gh', ['issue', 'close', h.issue.slice(1), '--reason', 'completed']);
    }
  }
  if (r.hypothesis) {
    const frozen = { id: ctx.date, date: ctx.date, deep: ctx.deep, issue: issueRef, text: r.hypothesis, frozenAt: g.lastTick, status: 'open', retests: [] };
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
    catch (e) { console.log(`push attempt ${i} failed: ${String(e).split('\n')[0]}`); execFileSync('sleep', [String(i * 5)]); }
  }
  if (!pushed) throw new Error('could not push the nightly commit to main after 3 attempts');

  console.log(`Done. Issue ${issueRef} (evaluated=${evaluated}, verdict=${verdict}, re-tests: ${priorFates}). Witness: ${w.witness}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
