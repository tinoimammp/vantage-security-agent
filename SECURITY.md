# Security Policy

This repository contains a **prompt/methodology framework**, not a running service —
there is no deployed attack surface to report against. Two categories of report apply:

## Reporting a problem with the framework itself

If you find that a workflow, agent prompt, or template could cause an AI agent to:
- generate a false sense of security (e.g. missing a common vulnerability class),
- produce unsafe guidance (e.g. suggesting live exploitation without authorization),
- or leak/encourage leaking secrets found during analysis,

please report it privately to the maintainer rather than a public issue (if
this repository is hosted somewhere with private advisories, e.g. GitHub's
"Security" tab, use that once it's enabled).

## Using this framework itself

This framework is for **authorized security testing only**:
- Only point it at code you own or have explicit written permission to test.
- The SAST pipeline (`/vantage:scan-web`, `/vantage:scan-mobile`, phases
  01–06) only reads source code — it never sends network requests or
  executes the target application.
- Any live/manual verification of a generated PoC against a running system is the
  responsibility of the human tester and must stay within the authorized scope.
- `/vantage:fix-issue` and `/vantage:fix` are the one exception: they
  **directly edit source code** in the target repository to apply a
  validated finding's remediation. They never run a build or test suite, so
  correctness is not verified automatically — review every change (`git diff`)
  and run your own tests before committing. Use them only on code you're
  authorized to modify, same as the scan itself.

Misuse of this framework against systems without authorization is not condoned by
the maintainers.
