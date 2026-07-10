# Run Log

Every agent appends ONE line per execution. Format:

```
[ISO-8601 timestamp] <agent> | <artifact written> | <summary> | <status>
```

Example:
```
[2025-01-09T10:22:00Z] recon-agent | recon/endpoints.json | 142 endpoints, 9 APIs | OK
[2025-01-09T11:05:00Z] mapper-agent | mapping/attack-surface.json | 12 P0, 28 P1 | OK
[2025-01-10T09:14:00Z] authorization-agent | findings/raw-findings.authorization-agent.json | +1 candidate (IDOR) | OK
[2025-01-11T14:00:00Z] validator-agent | findings/validated-findings.json | 2 validated, 1 rejected | OK
[2025-01-12T09:00:00Z] poc-agent | poc/F-001.md | PoC generated | OK
[2025-01-23T16:00:00Z] report-agent | reports/report.md | 5 findings reported | OK
```

---

## Entries
<!-- Agents append below this line -->