# OWASP Mobile Top 10 (2024) — Reference Library for Agents

Quick-reference dictionary for the **OWASP Mobile Top 10, 2024 Final Release**
(https://owasp.org/www-project-mobile-top-10/). Each entry maps the risk to
what to test statically (source, manifest, decompiled binary — never a running
app or device) and which `agents/mobile/*` agent owns it.

When recording a finding, set `category` to the matching value in
`${CLAUDE_PLUGIN_ROOT}/schemas/finding.schema.json`, set `platform: "mobile"`,
and add the M-number plus CWE refs to `references[]`. Example:
`OWASP MASVS M9:2024` / `CWE-312`.

This is a **SAST** reference: every technique below is static (manifest/plist
review, decompiled/disassembled source review, string/resource scanning,
dependency manifest review). Dynamic techniques (instrumenting a running app,
Frida hooking, live network capture, jailbreak/root device testing) are out of
scope for this pipeline — they belong to the human manual-verification step,
same as the web pipeline's PoC step.

---

## Categories (M1–M10, 2024 order)

### M1:2024 — Improper Credential Usage
**Owner:** `credential-usage-agent`
Hardcoded API keys/secrets/passwords in source, resources, or build config;
credentials cached insecurely (SharedPreferences/UserDefaults/plist in plaintext);
biometric auth that falls back to a weak mechanism without re-verifying the
credential; secrets embedded in deep-link/URL-scheme handlers.
- CWE-798 (Hardcoded Credentials), CWE-522 (Insufficiently Protected Credentials).

### M2:2024 — Inadequate Supply Chain Security
**Owner:** `supply-chain-agent`
Vulnerable/abandoned third-party SDKs and libraries (CocoaPods/SPM/Gradle/Maven
manifests), unverified/unsigned dependency sources, build pipeline integrity
(CI signing keys, unpinned dependency versions), third-party SDKs with excessive
permissions or known data-exfiltration behavior.
- CWE-1104 (Use of Unmaintained Third-Party Components), CWE-937, CWE-494.

### M3:2024 — Insecure Authentication/Authorization
**Owner:** `mobile-auth-agent`
Client-side-only authentication/authorization checks, missing server-side
re-validation of client-supplied role/permission claims, insecure session/token
storage or reuse, weak or missing biometric-to-backend binding, IDOR-equivalent
flaws in mobile-consumed APIs (delegates to `authorization-agent` findings if
the backend is in scope).
- CWE-287 (Improper Authentication), CWE-862 (Missing Authorization).

### M4:2024 — Insufficient Input/Output Validation
**Owner:** `mobile-validation-agent`
Unvalidated input reaching WebViews (XSS), local SQLite/Realm queries (SQLi),
deep-link/intent/URL-scheme parameters reaching sensitive sinks, unsafe
deserialization of IPC messages (Intents, `NSCoding`, pasteboard/clipboard
data), path traversal via file-provider or content-provider paths.
- CWE-20 (Improper Input Validation), CWE-79 (XSS), CWE-89 (SQL Injection).

### M5:2024 — Insecure Communication
**Owner:** `mobile-network-agent`
Cleartext HTTP endpoints in code/config, missing or misconfigured certificate
pinning, disabled/weakened TLS verification (`allowsArbitraryLoads`,
custom `TrustManager` that accepts all certs), sensitive data sent over
insecure channels (SMS, unencrypted push payloads, Bluetooth).
- CWE-319 (Cleartext Transmission), CWE-295 (Improper Certificate Validation).

### M6:2024 — Inadequate Privacy Controls
**Owner:** `privacy-agent`
Over-broad permission requests vs. declared purpose, PII/PHI collected or
logged without justification, third-party SDKs (analytics/ads) given access to
contacts/location/device identifiers beyond stated need, missing data-minimization
or consent-gating in code paths that collect personal data.
- CWE-359 (Exposure of Private Information).

### M7:2024 — Insufficient Binary Protections
**Owner:** `binary-protection-agent`
Missing/weak obfuscation on sensitive logic (license checks, crypto, anti-fraud),
absence of root/jailbreak or debugger/emulator detection where the threat model
calls for it, missing tamper/integrity checks (signature/checksum verification),
debug flags or verbose logging left enabled in release builds.
- CWE-656 (Reliance on Security Through Obscurity — flag *absence* of expected
  protections), CWE-489 (Active Debug Code).

### M8:2024 — Security Misconfiguration
**Owner:** `mobile-config-agent`
Overly permissive exported Activities/Services/Receivers/Providers (Android)
or insecure `Info.plist`/entitlements (iOS), debuggable/backup-allowed flags
enabled in release manifests, verbose crash reporting exposing internals,
insecure default configuration shipped from a third-party SDK.
- CWE-16 (Configuration), CWE-1032 (OWASP ASVS mapping gap — cite CWE-16 primarily).

### M9:2024 — Insecure Data Storage
**Owner:** `mobile-storage-agent`
Sensitive data in plaintext in SharedPreferences/UserDefaults/plist/SQLite/Realm/
external storage/logs/backups/keyboard caches/clipboard; missing platform
keystore (Android Keystore / iOS Keychain) usage for secrets; sensitive data
retained in memory or temp files longer than necessary.
- CWE-312 (Cleartext Storage of Sensitive Information), CWE-922.

### M10:2024 — Insufficient Cryptography
**Owner:** `mobile-crypto-agent`
Weak/broken algorithms (DES/RC4/MD5/SHA1 for security purposes), hardcoded or
derivable encryption keys/IVs, custom/home-grown crypto instead of platform
APIs, ECB mode, missing or predictable salt/IV, insecure random number
generation for security-sensitive values.
- CWE-327 (Broken/Risky Crypto Algorithm), CWE-326 (Inadequate Encryption Strength),
  CWE-330 (Use of Insufficiently Random Values).

---

## Notes for `mobile-mapper-agent`

- Prioritization mirrors the web pipeline: **Critical → High → Medium** before
  Low/Informational (see `${CLAUDE_PLUGIN_ROOT}/knowledge/severity-matrix.md`).
- M9 (Insecure Data Storage) and M5 (Insecure Communication) are typically
  highest-yield on first pass — check them before the rest.
- M3 findings that trace back to a backend API the app calls should also be
  cross-referenced against the web pipeline's `authorization-agent`/`api-agent`
  categories if the backend source is also in scope — don't double-count the
  same root cause as two unrelated findings.
