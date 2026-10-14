#!/usr/bin/env node
/**
 * kdreams-nightly — the research half of the Dream Machine loop, pointed at
 * prediction markets instead of a codebase. Runs from GitHub Actions.
 *
 * Each night: pick tonight's surface from dream.config.json, run the backtest
 * over the recorded snapshots, hand that evidence to a cheap OpenRouter model
 * for observations + ONE falsifiable hypothesis, witness the report, file a
 * labeled issue, append one ledger row, and open a DRAFT PR with the report.
 *
 * Honest scope: this is observe-only research. The model never sees an order
 * endpoint, nothing here trades, and the verdict is INCONCLUSIVE by
 * construction until a frozen hypothesis is tested on data recorded AFTER it
 * was frozen. With no OPENROUTER_API_KEY it degrades to LLM_EVAL=blocked and
 * still files an honest skipped note.
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
import { computeReport, renderMarkdown } from './kdreams-backtest.mjs';

const DRY = process.argv.includes('--dry-run');
const CONFIG = process.env.DREAM_CONFIG || 'dream.config.json';
const MODEL = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-v4-flash';
const FALLBACKS = (process.env.OPENROUTER_FALLBACKS ?? 'qwen/qwen3.7-flash,openai/gpt-5-nano').split(',').map((s) => s.trim()).filter(Boolean);
const KEY = process.env.OPENROUTER_API_KEY || '';
const LEDGER = 'docs/dream-cycle/LEDGER.md';
const MAX_EVIDENCE_CHARS = 7000;

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
  const report = computeReport({ dataDir: process.env.KDREAMS_DATA || 'data', watchlist, days: watchlist.backtest?.days ?? 14 });
  let md = renderMarkdown(report);
  if (md.length > MAX_EVIDENCE_CHARS) md = md.slice(0, MAX_EVIDENCE_CHARS) + '\n…(evidence truncated)';
  const list = (v) => report.topMarkets[v].map((m) => `- ${m.id.slice(0, 24)} | ${m.title.slice(0, 70)} | mid ${m.mid} | spread ${m.spreadCents}c`).join('\n');
  return { report, md, catalogs: `Polymarket top 30 by 24h volume:\n${list('pm')}\n\nKalshi top 30 by 24h volume:\n${list('ks')}` };
}

async function research(ctx, ev) {
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
    `EVIDENCE (computed from recorded top-of-book snapshots, 15-minute cadence):\n${ev.md}\n\n` +
    `CATALOG EXCERPT:\n${ev.catalogs}\n\n` +
    `Produce, in under 400 words, with these exact headings:\n` +
    `## Observations — 2-4 bullets about "${ctx.deep}", each citing a number from EVIDENCE.\n` +
    `## Hypothesis — exactly one, in the form: "Given <market subset>, when <simple action>, then <metric from EVIDENCE> should be <direction/threshold> vs <baseline>, subject to <fee or risk invariant>."\n` +
    `## Next observation — one sentence: what to record or compute over the next 7 days to test it (no trading).\n` +
    `## Pair candidates — up to 3 lines "KALSHI_TICKER <-> polymarket id prefix — why" where the catalog excerpt shows the same real-world event on both venues, else "none found".`;

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
    return { blocked: true, body: `**LLM_EVAL=blocked** — every model route failed:\n${failures.map((f) => `- ${f}`).join('\n')}\n\n${ev.md}`, finding: `research failed on ${ctx.deep}` };
  }
  const served = `${json.model || MODEL}${json.provider ? ` via ${json.provider}` : ''}`;
  const body = json.choices[0].message.content.trim() + `\n\n${ev.md}`;
  const lines = body.split('\n').map((l) => l.trim()).filter(Boolean);
  const hypo = lines.find((l) => /^Given\b/i.test(l.replace(/^["*_\-\s]+/, '')));
  const firstProse = lines.find((l) => !/^#{1,6}\s|^[-*]\s*$/.test(l)) || `research on ${ctx.deep}`;
  const finding = trimWords((hypo || firstProse).replace(/^[#>*_\-\s"]+/, ''), 80);
  return { blocked: false, body, finding, usage: json.usage, served };
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

  const r = await research(ctx, ev);
  const evaluated = r.blocked ? 'blocked' : 'no';
  const verdict = 'INCONCLUSIVE'; // observe-only research night by construction
  const cost = r.usage ? ` (${r.usage.total_tokens} tokens${r.usage.cost !== undefined ? `, $${Number(r.usage.cost).toFixed(5)}` : ''})` : '';

  // Dry runs never leave a report behind in the repo.
  const reportDir = DRY ? tmpdir() : 'docs/dream-cycle';
  mkdirSync(reportDir, { recursive: true });
  const reportPath = join(reportDir, `${ctx.date}-${ctx.deep}-report.md`);
  const report = [
    `# ${ctx.deep} — kdreams nightly research (${ctx.date})`, ``,
    `> kdreams nightly (GitHub Actions, observe-only research). Model: ${r.blocked ? 'none' : r.served}${cost}.`,
    `> Nothing here placed an order. Verdict is INCONCLUSIVE by construction: the hypothesis`,
    `> below is frozen tonight and can only be tested on snapshots recorded after it.`, ``,
    r.body, ``, `## Witness`, `- session commit: \`${ctx.commit}\``,
  ].join('\n');
  writeFileSync(reportPath, report + '\n');
  const w = witness(reportPath, ctx.commit);
  writeFileSync(reportPath, report + `\n- report sha256: \`${w.reportHash}\`\n- witness: \`${w.witness}\`\n`);

  const finding = r.finding || `research on ${ctx.deep}`;
  const title = `[kdreams ${ctx.date}] ${ctx.deep}: ${finding}`;

  if (DRY) {
    console.log('--- DRY RUN ---'); console.log(title); console.log(readFileSync(reportPath, 'utf8'));
    console.log(`ledger row → verdict=${verdict} evaluated=${evaluated} witness=${w.witness.slice(0, 8)}`);
    return;
  }

  let issueRef = 'LOCAL';
  try {
    const url = sh('gh', ['issue', 'create', '--title', title, '--body-file', reportPath, '--label', 'dream-cycle', '--label', 'research', '--label', 'kdreams']);
    issueRef = '#' + (url.match(/\/issues\/(\d+)/)?.[1] ?? '');
    console.log('issue:', url);
  } catch (e) { console.log('issue creation skipped:', String(e).split('\n')[0]); }

  const priorFates = priorNightFates(LEDGER);
  execFileSync('node', ['packages/cli/dist/bin.js', 'ledger', 'append',
    '--path', LEDGER, '--date', ctx.date, '--deep', ctx.deep, '--finding', finding, '--issue', issueRef, '--pr', 'NONE',
    '--evaluated', evaluated, '--verdict', verdict, '--effect', `${g.rows} rows / ${g.ticks} ticks observed`,
    '--witness', w.witness.slice(0, 8), '--priorFates', priorFates], { stdio: 'inherit' });

  const branch = `${ctx.cfg.branchPrefix || 'dream/'}${ctx.date}-${ctx.deep}`;
  sh('git', ['config', 'user.name', 'kdreams[bot]']);
  sh('git', ['config', 'user.email', 'kdreams@users.noreply.github.com']);
  shSafe('git', ['checkout', '-b', branch]);
  sh('git', ['add', LEDGER, reportPath]);
  sh('git', ['commit', '-m', `dream(${ctx.deep}): ${issueRef} ${finding}`]);
  sh('git', ['push', '-u', 'origin', branch, '--force-with-lease']);
  try {
    const pr = sh('gh', ['pr', 'create', '--draft', '--title', `${title} (research)`,
      '--body', `Nightly observe-only research. See ${issueRef}.\n\nVerdict: INCONCLUSIVE (research-only). **Do not self-merge** — human review required. No orders were placed.\n\nWitness: \`${w.witness}\``,
      '--label', 'dream-cycle']);
    console.log('draft PR:', pr);
  } catch (e) { console.log('PR creation skipped:', String(e).split('\n')[0]); }

  console.log(`Done. Issue ${issueRef} (evaluated=${evaluated}, verdict=${verdict}). Witness: ${w.witness}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
