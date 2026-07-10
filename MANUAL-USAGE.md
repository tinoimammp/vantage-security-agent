# Using Vantage Without Claude Code

The plugin wrapper (`.claude-plugin/`, `commands/`, `skills/`) is Claude-Code-
specific — auto-dispatch, slash commands, `${CLAUDE_PLUGIN_ROOT}` path
resolution. The actual methodology (`agents/`, `workflow/`, `knowledge/`,
`schemas/`, `templates/`) is plain markdown with no dependency on it. This
guide covers running the same pipeline manually with any other AI coding
tool (ChatGPT, Cursor, Copilot Chat, Codex, Gemini, etc.) — or even by
following it yourself without an AI agent at all.

## What you lose without the plugin

| | With Claude Code plugin | Manual |
|---|---|---|
| Dispatch | `Task` tool, Phase 03's 10 agents run in parallel | One conversation, one agent role at a time, sequential |
| Invocation | `/vantage:scan-web`, natural-language auto-trigger | You paste the instructions below yourself |
| Paths | `${CLAUDE_PLUGIN_ROOT}` auto-resolved | You substitute the real folder path yourself |
| `scope.json` | Auto-generated from the template | You copy it and fill placeholders yourself |
| `fix-agent` edits | Built-in `Edit` tool | Only works if your tool can edit files (Cursor/Copilot yes, a plain chat window no — you'd copy-paste the diff in yourself) |

Everything else — the agent methodology, decision trees, schemas, knowledge —
is identical. Findings quality depends on the model you're using, same as
with Claude Code.

## Setup

1. Copy or clone this repo somewhere your AI tool can read it. Either layout
   works — pick whichever your tool can see:
   - **Sibling folder:** next to the project you want scanned, e.g. `./vantage/`.
   - **Inside the target repo:** e.g. `<target-repo>/vantage/` — this is
     closer to how the framework originally worked (dropped straight into
     the repo it scans). Just use a distinct name from `.vantage/` (the
     artifacts output folder — see below) so you don't confuse the
     framework copy with its own output, and add both to
     `.gitignore`/`.git/info/exclude` if you don't want either committed
     into the target repo's history.
2. Note two paths you'll substitute everywhere below:
   - `<vantage>` = wherever you put this repo (replaces `${CLAUDE_PLUGIN_ROOT}`)
   - `<target>` = the repo you're scanning (replaces bare `artifacts/...` with
     `<target>/.vantage/artifacts/...`)

## Manual pipeline walkthrough

Paste this to start (adjust the paths):

```
Read <vantage>/START-HERE.md fully — this defines a 6-phase SAST pipeline.
Everywhere it says ${CLAUDE_PLUGIN_ROOT}, use <vantage>. Everywhere it says
a bare artifacts/... path, use <target>/.vantage/artifacts/....

We're scanning the repository at <target>. Determine platform (web or
mobile) from its structure. If <target>/.vantage/artifacts/recon/scope.json
doesn't exist, copy <vantage>/artifacts/recon/scope.json.template there and
fill the placeholders (use today's date, the repo path, and platform).

Phase 1 — Recon: read <vantage>/agents/web/recon-agent.md (or
mobile-recon-agent.md if mobile) and follow it exactly against <target>.
Write your output to the exact paths it specifies. Tell me when done.
```

Then continue phase by phase — after confirming each one, paste the next:

```
Phase 2 — Mapping: read <vantage>/agents/web/mapper-agent.md and follow it,
reading the Phase 1 output you just wrote.
```

```
Phase 3 — Testing: read and run these 10 agents one at a time, each writing
its own raw-findings.<agent-name>.json (never a shared file):
auth-agent, authorization-agent, api-agent, sqli-agent, xss-agent,
upload-agent, business-logic-agent, injection-agent, dependency-agent,
secrets-agent (all under <vantage>/agents/web/).
```

```
Phase 4 — Validation: read <vantage>/agents/others/validator-agent.md.
Merge all raw-findings.*.json first, then follow the agent's methodology.
```

```
Phase 5 — PoC: read <vantage>/agents/others/poc-agent.md and write one PoC
per validated finding.
```

```
Phase 6 — Reporting: read <vantage>/agents/others/report-agent.md and
produce the one report.md file it specifies.
```

## Tips for better results outside Claude Code

- **One agent per fresh chat, if your tool allows it.** A single long
  conversation carrying all 6 phases can drift or lose earlier context by
  Phase 6. If your tool supports it, start a new chat per phase (or even per
  Phase-03 agent) and just point it at the artifact files from previous
  phases — that's the whole point of the artifact-driven design.
- **Phase 03 is 10 sequential turns here, not parallel.** Expect it to take
  longer than in Claude Code. Running each of the 10 as its own fresh chat
  (rather than 10 turns in one chat) gives more focused, less fatigued
  output.
- **Fixing findings** (`fix-agent`, `agents/others/fix-agent.md`) needs a
  tool that can actually write to your files. If yours can't, ask it to
  output the diff and apply it yourself.
- **No auto-generated `scope.json`.** Do this once yourself at the start
  rather than asking the AI to guess repeatedly.

## When you don't need an AI agent at all

Every `agents/*.md` file is also just a **methodology document a human can
read and follow manually** — decision trees, code patterns to grep for,
confidence heuristics. If you're doing the review yourself, open the
relevant agent file for the vulnerability class you care about and use it as
a checklist.
