# Framework Search Patterns — locate entry points fast

Shared by every web testing agent that needs to find HTTP route
handlers before analyzing the code inside them (`auth-agent`,
`authorization-agent`, `api-agent`, `upload-agent`, `business-logic-agent`,
`injection-agent`, `sqli-agent`, `xss-agent`). Route-finding is identical
across these agents' targets — only what each agent looks for *inside* the
handler differs (that stays in each agent's own file).

Use `Grep` with the pattern for the detected stack instead of reading every
file; filter the matched lines to the HTTP verb(s) relevant to your check
(e.g. upload-agent only cares about `POST`/`PUT` matches, authorization-agent
cares about all verbs).

## 1. Detect the stack first

If your agent's own `Reads:` header already includes `recon.json`, use its
`tech_stack` field directly — it's already been detected there, no need to
re-derive it. (`attack-surface.json` and `scope.json` do **not** carry stack
info — don't check those for this.) Otherwise, check the repo's manifest
file directly:

| Manifest file | Stack |
|---|---|
| `package.json` | Node (Express/NestJS/Fastify/Koa/Hapi — check `dependencies`); if `next`/`nuxt`/`@sveltejs/kit`/`@remix-run/*` is present, it's a full-stack JS meta-framework with its own API-route convention (see §2) |
| `composer.json` | PHP (check `require` for `laravel/framework`, `symfony/*`, `codeigniter4/framework`, `cakephp/cakephp`, `yiisoft/yii2`, `slim/slim`) |
| `requirements.txt` / `pyproject.toml` | Python (check for `flask`, `fastapi`, `django`, `tornado`, `bottle`, `pyramid`) |
| `pom.xml` / `build.gradle` | Java (Spring, Micronaut, Quarkus, JAX-RS) |
| `build.gradle.kts` (Kotlin plugin) | Kotlin (Ktor) |
| `Gemfile` | Ruby (check for `rails` vs `sinatra`) |
| `*.csproj` | .NET (MVC/Web API controllers, or Minimal API in `Program.cs`) |
| `go.mod` | Go (check for `gin-gonic`, `gorilla/mux`, `labstack/echo`, `gofiber/fiber`) |
| `Cargo.toml` | Rust (check for `actix-web`, `axum`) |
| `mix.exs` | Elixir (Phoenix) |
| `Package.swift` (server-side, has `vapor` dependency) | Swift (Vapor) |

## 2. Route/entry-point patterns by stack

`<VERB>` = the HTTP verb(s) you're checking for — substitute
`get|post|put|delete|patch` (all) or a subset.

| Stack | Grep pattern |
|---|---|
| PHP (vanilla) | no router — check `.htaccess`/front-controller/`$_SERVER['REQUEST_METHOD']` |
| PHP (Laravel) | `Route::(<VERB>)\(`, `Route::match\(\[.*<VERB>` |
| PHP (Symfony) | `#\[Route\(.*methods:\s*\[.?(<VERB>)` |
| PHP (CodeIgniter 4) | `\$routes->(<VERB>)\(` |
| PHP (CakePHP) | `\$routes->connect\(`, `->(<VERB>)\(` (routes.php) |
| PHP (Yii2) | `'(<VERB>)?\s*<.*>'\s*=>`  in `urlManager` rules |
| PHP (Slim) | `\$app->(<VERB>)\(` |
| Node (Express) | `app\.(<VERB>)\(`, `router\.(<VERB>)\(` |
| Node (NestJS) | `@(Get\|Post\|Put\|Delete\|Patch)\(` (capitalized, per-verb decorator) |
| Node (Fastify) | `fastify\.(<VERB>)\(`, `method:\s*['"](<VERB>)['"]` |
| Node (Koa) | `router\.(<VERB>)\(` (koa-router), `ctx\.method` |
| Node (Hapi) | `method:\s*['"](<VERB>)['"].*path:` (route config object) |
| React/Next.js (Pages Router API) | `pages/api/` file path, `req\.method\s*===?\s*['"](<VERB_UPPER>)` |
| React/Next.js (App Router) | `app/**/route\.(js\|ts)` file path, `export\s+(async\s+)?function\s+(<VERB_UPPER>)\(` |
| Vue/Nuxt (server API) | `server/api/` file path, `defineEventHandler\(`, or filename suffix `\.(<verb>)\.(ts\|js)$` |
| SvelteKit | `\+server\.(js\|ts)` file path, `export\s+(async\s+)?function\s+(<VERB_UPPER>)\(` |
| Remix | `app/routes/` file path, `export\s+(async\s+)?function\s+action\(` (POST/PUT/DELETE), `export\s+(async\s+)?function\s+loader\(` (GET) |
| React (plain SPA — CRA/Vite, no server routes) | **no `<VERB>` handler exists here** — the real backend is one of the stacks above/below; grep the API **call site** instead: `fetch\(`, `axios\.(<verb>)\(`, `\.(<verb>)\(` on an axios instance. Client routing (`<Route path=`, React Router) only maps UI screens, not worth checking for backend vulns. |
| Vue (plain SPA — Vue CLI/Vite, no server routes) | same principle as plain React — grep `axios\.(<verb>)\(`, `fetch\(` for the actual backend call; Vue Router's `path:` entries in `router/index.js` are UI navigation only. |
| Python (Flask) | `@app\.route\(.*methods=\[.?(<VERB>)`, `@app\.(<VERB>)\(` |
| Python (FastAPI) | `@app\.(<VERB>)\(`, `@router\.(<VERB>)\(` |
| Python (Django) | `def (<verb>)\(self` in `views.py`, cross-ref `urls.py`'s `path\(`/`re_path\(` |
| Python (Tornado) | `class \w+Handler\(.*RequestHandler\)`, `def (<verb>)\(self` |
| Python (Pyramid) | `@view_config\(.*request_method=['"](<VERB>)` |
| Python (Bottle) | `@(<verb>)\(`, `@route\(.*method=['"](<VERB>)` |
| Java (Spring) | `@(GetMapping\|PostMapping\|PutMapping\|DeleteMapping\|PatchMapping)`, `RequestMethod\.(VERB)` |
| Java (JAX-RS) | `@(GET\|POST\|PUT\|DELETE\|PATCH)` (uppercase annotation, no parens) |
| Java (Micronaut) | `@(Get\|Post\|Put\|Delete\|Patch)\(` (per-verb, mirrors Spring style) |
| Kotlin (Ktor) | `(<verb>)\(['"]` inside a `routing\s*\{` block |
| Ruby (Rails) | `(<verb>) ['"]`, `resources :`, check `config/routes.rb` |
| Ruby (Sinatra) | `^(<verb>) ['"]` (top-level DSL, not `config/routes.rb`) |
| .NET (ASP.NET MVC/Web API) | `\[Http(Get\|Post\|Put\|Delete\|Patch)\]` |
| .NET (Minimal API) | `app\.Map(Get\|Post\|Put\|Delete\|Patch)\(` in `Program.cs` |
| Go (Gin) | `\.(<VERB>)\(` (lowercase method call) |
| Go (gorilla/mux) | `Methods\(['"](<VERB>)['"]` |
| Go (Echo) | `e\.(<VERB>)\(`, `group\.(<VERB>)\(` |
| Go (Fiber) | `app\.(<VERB>)\(` (capitalized: `app\.Get\(`, `app\.Post\(`) |
| Rust (Actix-web) | `#\[(<verb>)\(['"]`, `\.route\(.*web::(<verb>)\(\)` |
| Rust (Axum) | `\.route\(['"].*,\s*(<verb>)\(` |
| Elixir (Phoenix) | `(<verb>)\s+['"].*,\s*\w+Controller` in `router.ex` |
| Swift (Vapor) | `app\.(<verb>)\(['"]`, `routes\.(<verb>)\(` |

## 3. Fallback — stack not listed above

Generic keyword search regardless of framework: `route`, `handler`,
`endpoint`, plus the verb itself (`post`, `get`, ...) case-insensitive, then
manually confirm it's a real route registration and not a false hit
(comment, string literal, log message).
