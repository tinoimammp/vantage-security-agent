# PoC: [F-101] Auth token (JWT) stored in plaintext SharedPreferences

| | |
|---|---|
| **Finding ID** | F-101 |
| **Severity** | Critical |
| **CVSS** | 7.6 — `AV:P/AC:L/PR:N/UI:N/S:U/C:H/I:L/A:N` |
| **Category** | Insecure Data Storage (OWASP Mobile M9:2024) |
| **Platform** | mobile (Android) |
| **Affected Component** | `AuthManager.java` (no HTTP endpoint — local storage issue) |
| **Non-destructive** | Yes (read-only proof against a test build) |

---

## 1. Summary
`AuthManager.saveSession()` writes the session JWT to `SharedPreferences` in
plaintext, with no Android Keystore or `EncryptedSharedPreferences` wrapping.
Combined with `android:allowBackup="true"` and no backup-exclusion rule, the
token is extractable without root via `adb backup`.

## 2. Code Evidence (SAST — confirmed statically)
**File:** `app/src/main/java/com/acmebank/auth/AuthManager.java` **Line:** 22 **Function:** `saveSession`
```java
public void saveSession(String jwt) {
  SharedPreferences prefs = context.getSharedPreferences("auth", Context.MODE_PRIVATE);
  prefs.edit().putString("auth_token", jwt).apply(); // plaintext
}
```
**Data flow:** `login response JWT -> AuthManager.saveSession() -> SharedPreferences (plaintext)`
**Missing check:** Use `EncryptedSharedPreferences` (Jetpack Security) or Keystore-backed storage instead of a plain `putString()`.

The validator independently confirmed no `EncryptedSharedPreferences`/Keystore
usage anywhere in the `auth` package, and confirmed
`android:allowBackup="true"` with no `android:fullBackupContent` exclusion in
the release `AndroidManifest.xml`.

> Everything below this line is written for a **human** to execute manually
> on a test device/emulator running a debug or staging build. No agent in
> this pipeline installed, ran, or instrumented the app — see `START-HERE.md` §0.

## 3. Prerequisites
- A debug or staging build of the app installed on a device/emulator you
  control (or `adb` access to one), with USB debugging enabled.
- A test account to log in with (no production credentials).
- Tooling: Android `platform-tools` (`adb`) on your machine.

## 4. Manual Test Steps (human-executed)
1. Install the debug/staging build: `adb install app-debug.apk`.
2. Log in with the test account so `AuthManager.saveSession()` runs.
3. Pull a backup of the app's data (works because `allowBackup="true"`):
   ```bash
   adb backup -f acmebank-backup.ab com.acmebank.app
   # Convert the .ab backup to a tar archive, then locate: apps/com.acmebank.app/sp/auth.xml
   ```
4. Inspect `shared_prefs/auth.xml` inside the extracted backup and observe
   the `auth_token` key holding the raw JWT in plaintext:
   ```xml
   <map><string name="auth_token">eyJhbGciOiJIUzI1NiIs....REDACTED_SIGNATURE</string></map>
   ```
5. (Optional, confirms impact) Decode the JWT payload (e.g. at jwt.io, offline)
   and note it is a live, usable session token — not a placeholder.

## 5. Impact
Anyone with physical or `adb` access to the device (a shared/lost/stolen
device, or a malicious app exploiting a separate local vulnerability) can
extract a live session token and impersonate the user against the AcmeBank
API without needing their password.

## 6. Remediation
```java
// Store secrets via Jetpack Security's EncryptedSharedPreferences instead:
SharedPreferences securePrefs = EncryptedSharedPreferences.create(
  context, "auth", masterKeyAlias,
  EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
  EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
);
securePrefs.edit().putString("auth_token", jwt).apply();
```
- Set `android:allowBackup="false"`, or add `android:fullBackupContent` rules
  excluding the `auth` preferences file.
- Shorten token lifetime and implement refresh to reduce the exposure window
  of any token that does leak.

## 7. References
- OWASP MASVS M9:2024 — Insecure Data Storage
- CWE-312 — Cleartext Storage of Sensitive Information
- CWE-922 — Insecure Storage of Sensitive Information
