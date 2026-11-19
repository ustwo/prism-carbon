# PRISM Carbon Tracker — Capture Lifecycle & Multi-Window Hardening Report

**Status:** ✅ Implemented & verified (typecheck, lint, production build)
**Area:** Extension activation/deactivation, capture proxy, log analyzers, crash recovery, and full per-window / per-project isolation.

---

## TL;DR

We audited and hardened how PRISM's capture machinery starts and stops, and made it correct when **multiple VS Code windows run multiple projects simultaneously**.

Outcome:
1. The proxy, log analyzers, and all listeners start/stop cleanly with the extension's enable/disable lifecycle. A disabled extension stays fully inert (proxy never runs) until re-enabled.
2. The runtime proxy is **opt-in**: it only runs when `estimatingCarbon.enableRuntimeProxy` is `true` (off by default) and the user accepts a one-time security warning. Copilot and Claude Code capture work via log files and need no proxy.
3. Proxy environment variables are now cleaned out of terminals on stop.
4. Crashed-window proxies are garbage-collected on the next start, without ever harming a live window.
5. Each window runs its **own** proxy on its **own** port and captures/attributes data independently.
6. The single shared resource — the CA certificate — is now generated race-free.
7. The proxy honours an existing upstream corporate proxy, and the worker is forked with a minimal, explicit environment.

---

## 1. How PRISM captures (architecture)

PRISM estimates the CO₂ of AI usage by capturing token counts from three sources, then converting tokens → emissions and recording each "call" in the tracker (sidebar, status bar, dashboard).

There are **two capture mechanisms**:

| Mechanism | What it captures | How | Default |
|---|---|---|---|
| **Log analyzers** | GitHub Copilot Chat and Claude Code usage | Read provider log files on disk on a polling interval and on file save. Parse token usage out of the logs. | **Always on** |
| **Interceptor proxy** (optional) | Runtime LLM API calls (Anthropic, OpenAI, Gemini, GitHub) made from terminals — e.g. your own CLI tools / SDK scripts | A forked HTTP/HTTPS proxy (`mockttp`) child process. Proxy env vars are auto-injected into terminals so their traffic routes through it. Responses are parsed for token usage *after* the stream completes (never interrupts the user). | **Off** — opt-in via `estimatingCarbon.enableRuntimeProxy` |

> The proxy exists to capture calls from **your own scripts**. If you only use Claude Code and GitHub Copilot Chat, you never need it — those are captured via log files.

Supporting pieces: status bar, tree view, budget/emissions store (`workspaceState`), dashboard webview, and listeners (save, branch change, log refresh, launch button).

---

## 2. Lifecycle wiring (confirmed correct)

Everything is tied to VS Code's native `activate()` / `deactivate()`. Enabling/disabling the extension is what triggers these — there is **no separate on/off toggle command**.

### On `activate()` — `src/extension.ts`
- Initializes logger, budget store, status bar, tree view, webview.
- Restores call history and seeds the log analyzers' "last access" timestamp.
- Registers all listeners and commands into `context.subscriptions`.
- Registers a configuration-change watcher.
- Log analyzers begin polling (and do an immediate capture). **This always happens.**
- **Only if `estimatingCarbon.enableRuntimeProxy` is `true`:** calls `startCapture(...)`, which first shows a modal **security warning**; if the user accepts, it garbage-collects orphaned proxies, forks the proxy worker, starts the `mockttp` server on a per-window port, and injects proxy env into terminals. If the setting is off or the user declines, no proxy is started.

### On `deactivate()` — `src/extension.ts`
- `stopLogRefresh()` — clears the log-polling timer.
- `await stopCapture()` — disposes the terminal listener, **cleans proxy env from terminals**, sends `stop` to the worker and kills the child process (which releases its port), clears state, and removes this window's lock file.
- VS Code auto-disposes everything in `context.subscriptions` (listeners, commands, views, config watcher).

### Restart while the extension is disabled
A disabled extension is **never loaded** into the extension host, so `activate()` does not run and the proxy is never forked. There is no persistent daemon or background process. **The proxy stays off until the extension is enabled** — and even then only if `enableRuntimeProxy` is on and the security warning is accepted. ✅

---

## 3. Changes made

### 3a) Terminal environment cleanup on stop
**Before:** The proxy env vars (`HTTP_PROXY`, `HTTPS_PROXY`, `http_proxy`, `https_proxy`, `REQUESTS_CA_BUNDLE`, `SSL_CERT_FILE`, `CURL_CA_BUNDLE`, `AWS_CA_BUNDLE`, `NODE_EXTRA_CA_CERTS`, `NODE_OPTIONS`, `JAVA_TOOL_OPTIONS`) were injected into terminals but never removed. After the extension stopped, terminals kept pointing at a dead proxy and could fail network requests.

**After:** `stopCapture()` issues `unset …` across all open terminals, deriving the key list from the same source as the injection path so the two can never drift.

> Note: injection and cleanup both assume a POSIX shell (`export` / `unset`), consistent with the pre-existing behavior. PowerShell/cmd are unaffected either way.

### 3b) Crash-recovery guard for orphaned proxies
**Problem:** On a hard crash (VS Code killed without `deactivate`), the forked proxy worker can survive and keep holding a port.

**Solution:** a PID registry. Each window writes a lock file `proxy-locks/<hostPid>.json` (in the shared globalStorage dir) recording `{ hostPid, workerPid, port }`. On startup, `gcOrphanedProxies()`:
- Scans the registry.
- For any lock whose owning window (`hostPid`) is **no longer alive**, kills the recorded **worker PID** and removes the lock.
- Verifies the worker PID is still a **Node** process before killing — so a recycled PID can never cause us to kill an unrelated process.
- Leaves live siblings completely untouched.

This kills by PID via the registry (no port scanning / `lsof` parsing required).

### 3c) Per-window dynamic ports (multi-window correctness)
**Problem:** The original design used one fixed port (3024) shared by every window. With multiple windows this either failed (`EADDRINUSE`) or — under a naive guard — caused the newest window to kill an older window's proxy.

**Solution:** each window runs its **own** proxy:
- The worker tries the preferred port (3024); if it's taken, it falls back to an **OS-assigned free port**, then reports the actual bound port back to the extension.
- Terminal injection uses that window's actual port.
- Every window captures its own terminal traffic and attributes it to its own tracker.

`src/proxy/proxyServer.ts` now exposes the actual bound `port` and the `workerPid`.

### 3d) Race-free CA certificate generation
**Problem:** The CA cert lives in shared globalStorage. On a **simultaneous first-ever cold start**, two windows could each generate a different CA and clobber the file — leaving a window serving one cert while its terminals were told to trust another → TLS failures.

**Solution (`ensureCaCert`):**
- Fast path: if both cert + key exist, just read them.
- Otherwise elect a single generator via an **exclusive (`wx`) create** of the key file. The winner generates the CA, writes the key, then writes the cert **last** (as a completion signal).
- Other windows wait for the cert to appear and read the same pair.
- Includes cleanup if generation fails, plus a one-shot retry if a crashed generator left a stale key file.

After the first run this is a no-op fast read.

### 3e) Opt-in enablement, security warning & upstream proxy
The runtime proxy is now **opt-in and explicitly consented**:
- It runs only when `estimatingCarbon.enableRuntimeProxy` is `true` (default `false`).
- On start it shows a modal **security warning** explaining that HTTPS traffic is decrypted via a self-signed CA, responses are processed in memory, and terminal env vars are modified. The proxy starts only if the user accepts.
- It **honours an existing upstream corporate proxy**: if `HTTPS_PROXY` / `HTTP_PROXY` (and `NO_PROXY`) are set in the environment, PRISM's proxy chains through them instead of bypassing them.
- The proxy worker is forked with a **minimal, explicit environment** (only `PATH`, `HOME`, temp dirs, and the proxy vars) rather than the full parent environment.

> These behaviors came from `main` and were preserved through the merge; the lifecycle/isolation hardening above was layered on top of them.

---

## 4. Multi-window / multi-project isolation (full picture)

With several VS Code windows open on several projects, every window operates independently. Each resource is either isolated per-window, per-project, or shared-but-safe:

> The proxy rows below apply only to windows where the proxy is enabled (`enableRuntimeProxy` + accepted warning). Log-based capture and storage are isolated regardless.

| Resource | Isolation | Mechanism |
|---|---|---|
| Proxy (port) | Per window | Own dynamic port (3024 preferred, free-port fallback) |
| Terminal injection | Per window | Each window injects **its** port into its terminals |
| Copilot capture (logs) | Per window | `context.logPath` is a per-window log session; each reads its own `GitHub Copilot Chat.log` |
| Claude Code capture (logs) | Per project | Derived from `~/.claude/projects/<workspace-path>` |
| Emissions / budget storage | Per project | `context.workspaceState` |
| Orphan garbage collection | Coordinated | Shared PID registry; only kills dead windows' workers |
| CA certificate | Shared (now safe) | Single CA, generated once via generator election |

**Net result:** 3 windows / 3 projects → Copilot + Claude Code captured independently per project from log files; plus, in any window where the proxy is enabled, its own proxy on its own port capturing that window's terminal traffic. Each stores to its own workspace and shares only the CA certificate safely. If one window crashes, the next to start cleans up its orphan without disturbing the others.

---

## 5. Files changed

| File | What changed |
|---|---|
| `src/extension.ts` | Lifecycle wiring; `startCapture` gated behind `enableRuntimeProxy`; deactivate stops log refresh + capture |
| `src/core/capture/adapters/interceptor/interceptorAdapter.ts` | Security-warning gate → orphan GC → per-window dynamic-port start; terminal env cleanup; PID-registry lock helpers; dynamic-port env injection |
| `src/proxy/proxyServer.ts` | Exposes the actual bound port and worker PID; passes preferred port to the worker; forks the worker with a minimal explicit environment |
| `src/proxy/serverWorker.ts` | Preferred-port-with-fallback binding that reports the real port; race-free `ensureCaCert` with generator election; upstream corporate proxy support (`proxyConfig` from env) |
| `package.json` | New setting `estimatingCarbon.enableRuntimeProxy` (default `false`) |

---

## 6. Verification

All checks below were re-run **after merging `main`** (which introduced the opt-in setting, security warning, upstream proxy support, and hardened fork environment) and resolving the conflicts:

| Check | Result |
|---|---|
| `tsc --noEmit` (typecheck) | ✅ clean |
| `tsc -p .` (full project compile, test config) | ✅ clean |
| `eslint src` | ✅ clean |
| `node esbuild.js` (production bundle) | ✅ regenerated `dist/extension.js` + `dist/proxy/serverWorker.js` |
| Dangling references to removed symbols | ✅ none |
| `vscode-test` (integration suite) | ⚠️ not runnable — repo has no `.vscode-test` config (pre-existing, unrelated to these changes) |

---

## 7. Residual notes / possible follow-ups

- **Same project open in two windows:** VS Code normally prevents this. If forced, the two windows would share `workspaceState` and the Claude Code log directory, which could double-count. Out of normal usage; not addressed.
- **PID reuse during GC (extremely rare):** if the OS reassigns a dead window's host PID to an unrelated process, the GC treats it as a live sibling and skips cleanup — leaving one orphaned worker until reboot. This is a harmless leak; it never kills the wrong process.
- **Missing `vscode-test` config:** the repo has no `.vscode-test` file, so the integration test suite cannot run locally or in CI. Adding one would let these lifecycle paths be exercised automatically.
- **Shell support:** terminal env injection/cleanup target POSIX shells (bash/zsh), matching the existing implementation.
