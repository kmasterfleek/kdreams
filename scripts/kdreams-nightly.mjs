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
 *      GH_TOKEN (for gh), DREAM_CONFIG (default dream.config.json), DREAM_DATE (override)
 * Usage: node scripts/kdreams-nightly.mjs [--dry-run]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { computeReport, renderMarkdown } from './kdreams-backtest.mjs';

const DRY = process.argv.includes('--dry-run');
const CONFIG = process.env.DREAM_CONFIG || 'dream.config.json';
const MODEL = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-v4-flash';
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

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}`, 'HTTP-Referer': `https://github.com/${ctx.cfg.repo}`, 'X-Title': 'kdreams nightly (observe-only)' },
    body: JSON.stringify({ model: MODEL, messages: [{ role: 'system', content: sys }, { role: 'user', content: user }], max_tokens: 900, temperature: 0.3 }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    return { blocked: true, body: `**LLM_EVAL=blocked** — OpenRouter request failed (${res.status}). ${t.slice(0, 200)}\n\n${ev.md}`, finding: `research failed (${res.status}) on ${ctx.deep}` };
  }
  const json = await res.json();
  const body = (json.choices?.[0]?.message?.content?.trim() || '(empty model response)') + `\n\n${ev.md}`;
  const lines = body.split('\n').map((l) => l.trim()).filter(Boolean);
  const hypo = lines.find((l) => /^Given\b/i.test(l.replace(/^["*_\-\s]+/, '')));
  const firstProse = lines.find((l) => !/^#{1,6}\s|^[-*]\s*$/.test(l)) || `research on ${ctx.deep}`;
  const finding = (hypo || firstProse).replace(/^[#>*_\-\s"]+/, '').slice(0, 80);
  return { blocked: false, body, finding, usage: json.usage };
}

function witness(reportPath, commit) {
  const reportHash = createHash('sha256').update(readFileSync(reportPath)).digest('hex');
  return { reportHash, witness: createHash('sha256').update(reportHash + commit).digest('hex') };
}

async function main() {
  const ctx = tonight();
  console.log(`Tonight: DATE=${ctx.date} DEEP=${ctx.deep} SCAN=${(ctx.scan || []).join(',')} COMMIT=${ctx.commit.slice(0, 8)} MODEL=${KEY ? MODEL : 'none'}`);
  const ev = evidence();
  const g = ev.report.generatedFrom;
  console.log(`Evidence: ${g.rows} rows, ${g.ticks} ticks, ${g.marketsPm} pm + ${g.marketsKs} ks markets`);

  const r = await research(ctx, ev);
  const evaluated = r.blocked ? 'blocked' : 'no';
  const verdict = 'INCONCLUSIVE'; // observe-only research night by construction
  const cost = r.usage ? ` (${r.usage.total_tokens} tokens)` : '';

  mkdirSync('docs/dream-cycle', { recursive: true });
  const reportPath = `docs/dream-cycle/${ctx.date}-${ctx.deep}-report.md`;
  const report = [
    `# ${ctx.deep} — kdreams nightly research (${ctx.date})`, ``,
    `> kdreams nightly (GitHub Actions, observe-only research). Model: ${r.blocked ? 'none' : MODEL}${cost}.`,
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

  const priorFates = shSafe('bash', ['-lc', `tail -n 1 ${LEDGER} 2>/dev/null`]).split('|')[7]?.trim().slice(0, 40) || 'first night';
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

main().catch((e) => { console.error(e); process.exit(1); });
