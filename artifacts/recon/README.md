# artifacts/recon/

Reconnaissance phase output — written by `recon-agent` (web) or
`mobile-recon-agent` (mobile), per `scope.json.platform`.

## Required files
- `scope.json` — engagement scope & constraints (shared by both platforms).
  **Create from** `${CLAUDE_PLUGIN_ROOT}/artifacts/recon/scope.json.template`
  (this file is a plugin asset, not generated per-engagement) before any
  analysis. **Replace all `<PLACEHOLDERS>` with actual values. Use system
  timestamp for `started_at`.** This defines the repository path,
  include/exclude analysis paths, and the `platform` field.
- **Web (`platform: "web"`):**
  - `endpoints.json` — array of endpoint objects (`${CLAUDE_PLUGIN_ROOT}/schemas/endpoint.schema.json`).
  - `recon.json` — tech stack, auth surface, API inventory, discovery stats.
- **Mobile (`platform: "mobile"`):**
  - `mobile-recon.json` — permissions, exported components, WebViews, local
    storage, crypto usage, network config, third-party SDKs (freeform; see
    `${CLAUDE_PLUGIN_ROOT}/agents/mobile/mobile-recon-agent.md` for the shape).
  - `endpoints.json` / `recon.json` too, only if the app calls a backend API.

## Contract
Full validation rules and field shapes are owned by
`${CLAUDE_PLUGIN_ROOT}/agents/web/recon-agent.md` /
`${CLAUDE_PLUGIN_ROOT}/agents/mobile/mobile-recon-agent.md` and
`${CLAUDE_PLUGIN_ROOT}/schemas/endpoint.schema.json` — this file is a directory
map, not the source of truth. See `${CLAUDE_PLUGIN_ROOT}/examples/sample-endpoints.json`
(web) and `${CLAUDE_PLUGIN_ROOT}/examples/sample-mobile-recon.json` (mobile).