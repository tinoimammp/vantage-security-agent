# High-Impact-First Methodology (SAST)

A pragmatic prioritization methodology adapted from bug-bounty triage, but
re-scoped for **static code analysis**: every heuristic below is something you
confirm by reading source, not by attacking a live target. No agent in this
pipeline sends a request — see `START-HERE.md` Golden Rules.

---

## 1. Mindset
- **Impact over volume.** One Critical IDOR beats fifty missing-header findings.
- **Think like the data, not the page.** Follow objects and identifiers through
  the code's data flow.
- **Authorization is king.** Broken access control is the most common high-impact
  class in modern apps. Always start there.
- **Trust nothing client-side.** If a price, role, state, or validation rule is
  only enforced in frontend JS and not re-checked server-side, that's the bug —
  find the server-side handler and confirm the check is genuinely missing.

## 2. Workflow (maps to framework phases)
1. **Recon** — full code surface map: routes, JS bundles, config, API specs.
2. **Map** — prioritize by data sensitivity and privilege, from code structure.
3. **Hunt high-impact first (in code):**
   - Authorization (IDOR/BOLA/BFLA/priv-esc)
   - Authentication bypass / account takeover
   - Injection (SQLi, then XSS)
   - Business logic (money/fraud)
   - File upload -> RCE
   - SSRF
4. **Validate** — re-trace the data flow independently, confirm no mitigation
   exists, kill false positives (see `${CLAUDE_PLUGIN_ROOT}/agents/others/validator-agent.md`).
5. **PoC + Report** — code evidence, plus manual steps for a human to confirm.

## 3. High-Yield Heuristics (code review actions)
- Every `id` in a route/body is an IDOR candidate — find the handler and check
  whether it compares the object's owner to the current principal before
  returning/mutating it.
- Every write handler may bind extra fields (mass assignment) — check whether
  it uses an allow-list or binds `req.body`/`req.params` wholesale onto the
  model (`role`, `isAdmin`, `price`, `ownerId`, `verified`, `balance` are the
  fields to look for).
- Every multi-step flow (e.g. cart -> checkout -> pay) may have a final
  endpoint that re-derives trusted state instead of trusting an earlier step —
  check whether the last handler independently recomputes price/eligibility or
  just accepts what the client asserts.
- Every numeric financial field's handler should be checked for server-side
  bounds validation (negative, zero, absurdly large, fractional units).
- Every JWT verification call should be checked for algorithm confusion
  (`alg:none` accepted, or the code accepting both RS256 and HS256 with the
  same key material) and for skipped signature verification.
- Every versioned API (`/v1`, `/v2`, ...) should be checked for whether older
  route files apply the same authz middleware as the current version.
- Every GraphQL schema/config should be checked for introspection left enabled
  and for resolvers missing field-level authorization.
- Every file-upload handler should be checked for missing content-type/
  extension validation and for storing uploads in an executable web-root path.

## 4. Chaining
These are conceptual patterns for scoring combined impact — confirm each half
of the chain as its own code-based finding before citing the chain:
- Self-XSS + CSRF -> stored XSS.
- Open redirect + OAuth -> token theft -> account takeover.
- IDOR read of reset token -> account takeover.
- SSRF -> cloud metadata -> credential theft.
- Mass assignment of `role` -> admin -> full compromise.

## 5. Efficiency Rules for Agents
- Batch reconnaissance, then focus deep code review on P0/P1 endpoints.
- Stop analyzing Low/Info patterns until Critical/High surface is exhausted.
- Capture evidence (file/line/snippet/data flow) as you go — never reconstruct
  it from memory afterward.
- Read by module/directory, not endpoint-by-endpoint, to avoid re-parsing the
  same file for multiple candidate findings.

## 6. Ethics & Safety
- Stay in scope: analyze only `scope.json.repository_path`, honoring
  `include_paths`/`exclude_paths`. Never execute, run, or send requests to the
  target — this is static analysis only.
- Redact any secret discovered in code (`redact_secrets_in_artifacts`) before
  it reaches an artifact.
- Live verification against a running system happens later, and only by a
  human, using the PoC this pipeline produces.