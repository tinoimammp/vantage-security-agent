# Mobile Search Patterns — locate entry points and sinks fast

Shared by every mobile testing agent (M1-M10). Mobile has no server-side
HTTP routes — "entry points" are app components (Activities, Intents,
deep links), and "sinks" are local storage, network clients, and crypto
APIs. Each agent references only the section(s) relevant to its check;
agent-unique patterns (e.g. binary-protection's ProGuard rules,
supply-chain's per-ecosystem lockfiles) stay in that agent's own file.

Use `Grep` to shortlist before reading line by line.

## 1. Detect the platform/stack first

| Files present | Stack |
|---|---|
| `AndroidManifest.xml` + `build.gradle`/`build.gradle.kts` | Native Android (Java/Kotlin) |
| `Info.plist` + `*.xcodeproj`/`*.xcworkspace`/`Podfile` | Native iOS (Swift/Obj-C) |
| `package.json` + `android/` and `ios/` dirs | React Native |
| `pubspec.yaml` | Flutter |
| `*.csproj` + `Xamarin`/`MAUI` refs | Xamarin/MAUI |
| `capacitor.config.*` / `ionic.config.json` | Ionic/Capacitor (WebView-based) |

## 2. Manifest/plist components & entry points

| Concern | Android | iOS |
|---|---|---|
| Exported components | `exported="true"`, `<intent-filter>` on `<activity\|service\|receiver\|provider>` | URL scheme in `Info.plist` `CFBundleURLTypes`, Universal Links `applinks:` entitlement |
| Deep-link/IPC handler | `onNewIntent\(`, `getIntent\(\)\.getExtras?\(`, `getSerializableExtra\(`, `getParcelableExtra\(` | `application\(_:open:options:\)`, `NSUserActivity`, `continueUserActivity` |
| Permission declaration | `<uses-permission android:name=` | `NSCameraUsageDescription`, `NS.*UsageDescription` keys |
| Backup/debug flags | `android:allowBackup`, `android:debuggable`, `android:fullBackupContent` | `Info.plist` build-config-specific keys |

## 3. Local storage sinks

| Concern | Android | iOS |
|---|---|---|
| Key-value prefs | `SharedPreferences`, `getSharedPreferences\(`, `\.edit\(\)\.putString\(` | `UserDefaults`, `NSUserDefaults`, `\.set\(.*forKey` |
| Local database | `SQLiteOpenHelper`, `Room`, `@Entity`/`@Dao`, `Realm\(` | `CoreData`, `Realm\(`, raw `sqlite3_` calls |
| Encrypted storage (its *absence* around sensitive data is the finding) | `EncryptedSharedPreferences`, `AndroidKeyStore`, `SQLCipher` | `Keychain`, `kSecClass`, `Realm` config `encryptionKey` |
| External/shared storage | `getExternalStorageDirectory\(`, `getExternalFilesDir\(` | `NSSearchPathForDirectoriesInDomains`, shared App Group container |
| Clipboard | `ClipboardManager`, `setPrimaryClip\(` | `UIPasteboard`, `\.general\.string` |

## 4. Network client & TLS config

| Concern | Android | iOS |
|---|---|---|
| Cleartext traffic | `network_security_config.xml` `cleartextTrafficPermitted`, `usesCleartextTraffic` | `Info.plist` `NSAppTransportSecurity`, `NSAllowsArbitraryLoads` |
| TLS verification bypass | custom `X509TrustManager`/`HostnameVerifier` returning unconditionally | `URLSession` delegate calling `completionHandler\(\.useCredential` unconditionally |
| Certificate pinning | OkHttp `CertificatePinner` | `TrustKit`, manual pinning in `URLSession` delegate |
| HTTP client | `OkHttpClient`, `Retrofit`, `HttpURLConnection` | `URLSession`, `Alamofire` |
| Hardcoded base URL | `http://` literal near a client/base-URL constant | same |

## 5. WebView / deep-link / IPC sinks

| Concern | Android | iOS |
|---|---|---|
| WebView load | `loadUrl\(`, `loadData\(` | `loadHTMLString\(`, `\.load\(` (WKWebView) |
| JS bridge | `addJavascriptInterface\(` (flag if missing `@JavascriptInterface` + input checks) | `WKScriptMessageHandler`, `userContentController\(.*didReceive` |
| JS execution | `evaluateJavascript\(` | `evaluateJavaScript\(` |
| Deserialization of untrusted IPC data | `getSerializableExtra\(`, `Parcelable` from external sender | `NSCoding`, `Codable` decode of pasteboard/IPC payload |

## 6. Crypto & randomness

| Concern | Android | iOS |
|---|---|---|
| Weak algorithm/mode | `DES`, `RC4`, `ECB`, `MD5`, `SHA1` used for confidentiality/hashing | same (`CommonCrypto`/`CryptoKit` constants) |
| Crypto API | `javax\.crypto\.Cipher`, `MessageDigest` | `CommonCrypto`, `CryptoKit` |
| Weak/insecure RNG | `java\.util\.Random\(`, `Math\.random\(` | `arc4random\(\)` used incorrectly, `rand\(\)`, custom PRNG |
| Secure RNG (rules it out) | `SecureRandom\(` | `SecRandomCopyBytes`, `CryptoKit.SymmetricKey` |
| Biometric API | `BiometricPrompt`, `FingerprintManager` | `LocalAuthentication`, `LAContext` |

## 7. Logging & debug artifacts

| Concern | Android | iOS |
|---|---|---|
| Logging call | `Log\.d\(`, `Log\.i\(`, `System\.out\.print` | `NSLog\(`, `print\(` |
| Debug-only code left active | `BuildConfig\.DEBUG`, `if \(DEBUG\)` | `#if DEBUG` |
| Crash reporter breadcrumbs | Crashlytics/Sentry `log\(`/`addBreadcrumb\(` calls with raw variables | same |
