# Dynamic Timestamps — Agent Instructions

**All agents MUST use system timestamps when creating artifacts.**

---

## 1. When creating `scope.json` from template

```javascript
const now = new Date();

scope.started_at = now.toISOString(); // "2025-01-09T10:30:00.000Z"
scope.engagement = `${PROJECT_NAME} Security Assessment ${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
```

## 2. When creating findings

```javascript
finding.discovered_at = new Date().toISOString();
```

## 3. When creating reports

```javascript
report.generated_at = new Date().toISOString();
```

## 4. When appending to run-log.md

```javascript
const timestamp = new Date().toISOString();
logEntry = `[${timestamp}] ${agentName} | ${artifact} | ${summary} | ${status}`;
```

---

## Template Placeholders to Replace

| Placeholder | Replace with |
|-------------|-------------|
| `<SYSTEM_TIMESTAMP_NOW>` | `new Date().toISOString()` |
| `<CURRENT_YEAR-MONTH>` | `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}` |
| `<PROJECT_NAME>` | Actual engagement name (user-provided or default "WebApp") |
| `<AUTHORIZATION_EMAIL>` | Actual authorizing contact |
| `<USE_SYSTEM_TIMESTAMP>` | `new Date().toISOString()` |

---

## Python equivalent

```python
from datetime import datetime

now = datetime.utcnow()

scope['started_at'] = now.isoformat() + 'Z'
finding['discovered_at'] = datetime.utcnow().isoformat() + 'Z'
```

---

## PowerShell equivalent

```powershell
$now = (Get-Date).ToUniversalTime()

$scope.started_at = $now.ToString('o')
$finding.discovered_at = (Get-Date).ToUniversalTime().ToString('o')
```

---

**RULE: Never hardcode dates. Always use system time at execution.**