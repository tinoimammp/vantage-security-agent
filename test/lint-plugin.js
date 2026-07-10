#!/usr/bin/env node
// Structural consistency lint for the vantage plugin repo.
// Pure Node built-ins only — no dependencies, no package.json needed.
// Run: node test/lint-plugin.js

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let failures = 0;

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  failures++;
}
function ok(msg) {
  console.log(`OK:   ${msg}`);
}

function walk(dir, exts, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, exts, out);
    else if (exts.some((e) => entry.name.endsWith(e))) out.push(full);
  }
  return out;
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

// ---------------------------------------------------------------------
// Check 1: every agent must have an *operational* run-log instruction —
// either inside its "## Handoff" section, or as its own numbered step
// (e.g. fix-agent's "### 7. Append to run-log.md", since it has no next
// agent to hand off to). A bare mention in header metadata (e.g. a
// "**Writes:** ... run-log.md line" contract line) alone doesn't count.
// ---------------------------------------------------------------------
function checkRunLog() {
  console.log('\n== Check 1: run-log wiring (operational, not just mentioned) ==');
  const agentFiles = walk(path.join(ROOT, 'agents'), ['.md']);
  let clean = true;
  for (const f of agentFiles) {
    const content = read(f);
    const idx = content.indexOf('\n## Handoff');
    const inHandoff = idx !== -1 && content.slice(idx).includes('run-log');
    const inOwnStep = /^#{2,4}.*run-log/im.test(content);
    if (!inHandoff && !inOwnStep) {
      fail(`${path.relative(ROOT, f)} has no operational run-log instruction (not in "## Handoff" or its own heading)`);
      clean = false;
    }
  }
  if (clean) ok(`all ${agentFiles.length} agents have an operational run-log instruction`);
}

// ---------------------------------------------------------------------
// Check 2: every plugin-asset path reference resolves to a real file or
// directory on disk (dead-link detection) — both the proper
// ${CLAUDE_PLUGIN_ROOT}/<path> form AND bare references to known asset
// dirs (agents/, workflow/, knowledge/, schemas/, templates/, examples/).
// Deliberately excludes artifacts/ — those are target-project runtime
// paths, not files expected to exist in this repo.
// ---------------------------------------------------------------------
function checkPluginRootLinks() {
  console.log('\n== Check 2: plugin-asset path references resolve ==');
  const allMd = walk(ROOT, ['.md']);
  const prefixed = /\$\{CLAUDE_PLUGIN_ROOT\}\/([A-Za-z0-9_\-./]+)/g;
  const assetDirs = ['agents', 'workflow', 'knowledge', 'schemas', 'templates', 'examples'];
  const bare = new RegExp(
    `(?<!CLAUDE_PLUGIN_ROOT\\}\\/)\\b(?:${assetDirs.join('|')})\\/[A-Za-z0-9_\\-./]+\\.(?:md|json)\\b`,
    'g'
  );
  const seen = new Set();
  let clean = true;
  function checkRef(f, rel) {
    rel = rel.replace(/[.,;:)]+$/, ''); // strip trailing punctuation
    if (rel.includes('<')) return; // template placeholder, not a real path
    if (seen.has(rel)) return;
    seen.add(rel);
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) {
      fail(`${path.relative(ROOT, f)} references missing ${rel}`);
      clean = false;
    }
  }
  for (const f of allMd) {
    const content = read(f);
    let m;
    while ((m = prefixed.exec(content))) checkRef(f, m[1]);
    while ((m = bare.exec(content))) checkRef(f, m[0]);
  }
  if (clean) ok(`all ${seen.size} unique plugin-asset path references resolve`);
}

// ---------------------------------------------------------------------
// Check 3: plugin.json's "agents" array matches the files on disk
// ---------------------------------------------------------------------
function checkPluginJsonAgents() {
  console.log('\n== Check 3: plugin.json agents[] matches agents/ on disk ==');
  const pluginJson = JSON.parse(read(path.join(ROOT, '.claude-plugin', 'plugin.json')));
  const declared = new Set((pluginJson.agents || []).map((p) => p.replace(/^\.\//, '')));
  const onDisk = new Set(
    walk(path.join(ROOT, 'agents'), ['.md']).map((f) => path.relative(ROOT, f).replace(/\\/g, '/'))
  );
  let clean = true;
  for (const d of declared) {
    if (!onDisk.has(d)) {
      fail(`plugin.json declares "${d}" but it doesn't exist on disk`);
      clean = false;
    }
  }
  for (const f of onDisk) {
    if (!declared.has(f)) {
      fail(`${f} exists on disk but isn't declared in plugin.json's agents[]`);
      clean = false;
    }
  }
  if (clean) ok(`plugin.json agents[] matches all ${onDisk.size} files on disk`);
}

// ---------------------------------------------------------------------
// Check 4: every finding-writing agent cites finding-template.md.
// "Finding-writer" is derived dynamically — any agent whose header has
// `**Conforms to:** ... finding.schema.json` — instead of a hardcoded
// file list, so a newly added testing agent is automatically covered
// without anyone having to remember to update this script.
// ---------------------------------------------------------------------
function checkFindingTemplateCitation() {
  console.log('\n== Check 4: finding-template.md cited by every finding-writer ==');
  const agentFiles = walk(path.join(ROOT, 'agents'), ['.md']);
  const conformsPattern = /\*\*Conforms to:\*\*.*finding\.schema\.json/;
  const expected = agentFiles.filter((f) => conformsPattern.test(read(f)));
  if (expected.length === 0) {
    fail('no agent matched the finding.schema.json "Conforms to" pattern — check the pattern itself is still correct');
    return;
  }
  let clean = true;
  for (const f of expected) {
    if (!read(f).includes('finding-template.md')) {
      fail(`${path.relative(ROOT, f)} doesn't cite finding-template.md`);
      clean = false;
    }
  }
  if (clean) ok(`all ${expected.length} finding-writing agents cite finding-template.md`);
}

checkRunLog();
checkPluginRootLinks();
checkPluginJsonAgents();
checkFindingTemplateCitation();

console.log(`\n${failures === 0 ? 'PASS' : 'FAIL'} — ${failures} issue(s) found.`);
process.exit(failures === 0 ? 0 : 1);
