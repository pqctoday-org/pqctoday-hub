// SPDX-License-Identifier: AGPL-3.0-only
/**
 * pyRuntime — shared, lazily-booted Pyodide instance for the hub's Developer
 * tabs (dev-tabs-pkcs11-kmip plan, WS-A; true timeout added G9/W4).
 *
 * Self-hosted under /pyodide/ (pinned exact version, core + stdlib only — no
 * micropip, no network fetch beyond the initial asset load) rather than a
 * CDN, matching this repo's CSP posture. Deliberately excluded from the PWA
 * precache: the Developer tabs are online-only, and Pyodide's non-.wasm
 * assets fall through sw.ts's network-fallback branch by design (see the
 * comment there). One instance is shared by both the PKCS#11 and KMIP
 * Developer tabs — whichever tab opens first pays the load cost.
 *
 * Execution model: synchronous, main thread. Both the softhsmv3 WASM engine
 * and the KMIP WASM engine are main-thread-synchronous already, so moving
 * Pyodide itself into a worker would need an RPC rewrite of the shims for no
 * v1 benefit (plan §4) — that part of the original design stands.
 *
 * Timeout, two layers:
 *  1. A genuine mid-run KeyboardInterrupt (G9/W4). Pyodide's interrupt byte
 *     is polled by the CPython bytecode loop itself, so a write into shared
 *     memory from ANY other thread kills a runaway `while True:` loop even
 *     while it monopolizes the main thread. The other thread is a tiny
 *     static watchdog worker (public/pyRuntimeWatchdog.js). CRITICAL,
 *     found the hard way: a worker does not start executing until its
 *     script load is serviced by the parent's event loop — a watchdog
 *     created immediately before the blocking run never runs at all
 *     (proven live with a minimal probe, identically on Chromium AND
 *     WebKit; a pre-warmed worker interrupted a blocked main thread at
 *     1005ms against a 1000ms deadline on both). So the watchdog is
 *     created and handshaken during boot, while the event loop is free,
 *     and each run arms/disarms it purely via Atomics on the shared
 *     buffer — no timers, no per-run postMessage, nothing that needs the
 *     parent event loop once a run has started.
 *  2. A `Promise.race` deadline (RUN_TIMEOUT_MS below). Its setTimeout can
 *     only fire when the event loop is free, so it can NEVER catch a tight
 *     synchronous loop — it exists for stalled awaits (a hung pyfetch, a
 *     module load) and as the only layer when layer 1's shared memory is
 *     unavailable (see `sabSupported`).
 *
 * Honest limit, stated rather than oversold: a long call INSIDE compiled
 * WASM (e.g. a slow keygen inside a bridge's C_GenerateKeyPair) returns to
 * the Python bytecode loop only when it finishes — the interrupt lands
 * after, so that one case is genuinely unkillable in-browser.
 *
 * Layer 1 needs `crossOriginIsolated` — true on service-worker-controlled
 * loads (sw.ts injects the COI headers on every response) and on the local
 * dev/preview servers (vite.config.ts sets them directly), but not on a
 * first-ever SW-less load. `getInterruptMode()` reports which layer is
 * active, surfaced in both dev tabs' summary rail.
 */
import type { PyodideInterface } from 'pyodide'

const INDEX_URL = '/pyodide/'
const RUN_TIMEOUT_MS = 15_000
const WATCHDOG_URL = '/pyRuntimeWatchdog.js'

export type PyRunResult = {
  ok: boolean
  stdout: string
  stderr: string
  error: string | null
  elapsedMs: number
}

export type PyBootState = 'idle' | 'loading' | 'ready' | 'unavailable'
export type InterruptMode = 'preemptive' | 'best-effort'

let bootPromise: Promise<PyodideInterface> | null = null
let bootState: PyBootState = 'idle'
const listeners = new Set<(s: PyBootState) => void>()

function setBootState(s: PyBootState): void {
  bootState = s
  listeners.forEach((l) => l(s))
}

export function onPyBootStateChange(cb: (s: PyBootState) => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function getPyBootState(): PyBootState {
  return bootState
}

/* ── G9/W4: the interrupt watchdog (sab-optional) ──
 * Every actual shared-buffer reference below carries a same-line
 * `sab-optional` marker: workshopRequirements.driftguard.test.ts's `sab`
 * scan is line-scoped specifically so an annotated, feature-detected,
 * gracefully-degrading use like this one doesn't force `cacp-kmip` (the
 * WORKSHOP_TOOLS entry whose component tree reaches this file) to declare
 * `requires: ['sab']` — which would wrongly mark that entire tool as
 * needing it just because ONE optional sub-feature does. (This comment
 * block deliberately avoids repeating the literal class name, so the
 * driftguard's own line-scoped scan — which cannot tell code from prose —
 * has nothing here to flag.) */

function sabSupported(): boolean {
  if (typeof SharedArrayBuffer === 'undefined') return false // sab-optional
  return typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated
}
const sabAvailable = sabSupported()

/** Which timeout layer is active this session — see the module header. */
export function getInterruptMode(): InterruptMode {
  return sabAvailable ? 'preemptive' : 'best-effort'
}

let watchdogReady: Promise<Uint8Array | null> | null = null
let armCtrl: Int32Array | null = null
let armGeneration = 0

/** Create + handshake the watchdog worker. MUST be kicked off while the
 *  event loop is still free (bootPyRuntime does, before the pyodide asset
 *  load) — the worker cannot start once the main thread is blocked; that
 *  was the entire W4 root cause. Resolves to the interrupt-byte view, or
 *  null when shared memory is unavailable / the worker fails to load. */
function startWatchdog(): Promise<Uint8Array | null> {
  if (!sabAvailable) return Promise.resolve(null)
  if (watchdogReady) return watchdogReady
  watchdogReady = new Promise((resolve) => {
    try {
      const sab = new SharedArrayBuffer(8) // sab-optional: only reached once sabSupported() is true
      const sig = new Uint8Array(sab, 0, 1)
      const ctrl = new Int32Array(sab, 4, 1)
      const worker = new Worker(WATCHDOG_URL)
      worker.onerror = () => resolve(null)
      worker.onmessage = () => {
        // 'ready' handshake: the worker is genuinely running and parked in
        // its Atomics.wait loop — safe to rely on even under a blocked
        // main thread from here on.
        armCtrl = ctrl
        resolve(sig)
      }
      worker.postMessage({ sab, deadlineMs: RUN_TIMEOUT_MS })
    } catch {
      resolve(null)
    }
  })
  return watchdogReady
}

/** Fetch a shim source file shipped as a static asset and return its text.
 *  Shims live under /pyodide-shims/ (copied by `npm run sync:pyodide-shims`
 *  — wired into `predev`/`prebuild` — from
 *  src/services/python/pyodide/shims/). That source directory moved here
 *  2026-08-28 (G6) from src/wasm/pyodide/: `src/wasm` is entirely excluded
 *  from eslint (a pre-existing repo-wide rule for generated/vendored glue,
 *  confirmed via git history on src/wasm/softhsm.ts predating this
 *  feature), which had been silently exempting this hand-written
 *  bridge/shim code from lint the whole session — found only because a new
 *  driftguard test file under the old path came back "ignored" instead of
 *  passing. */
async function fetchShimSource(relPath: string): Promise<string> {
  const res = await fetch(`/pyodide-shims/${relPath}`)
  if (!res.ok) {
    throw new Error(`pyRuntime: failed to fetch shim ${relPath} (HTTP ${res.status})`)
  }
  return res.text()
}

const SHIM_FILES = ['p11/__init__.py', 'p11/_constants.py', 'pqctoday_kmip/__init__.py'] as const

async function installShims(py: PyodideInterface): Promise<void> {
  py.FS.mkdirTree('/hub_shims/p11')
  py.FS.mkdirTree('/hub_shims/pqctoday_kmip')

  const sources = await Promise.all(SHIM_FILES.map(fetchShimSource))
  SHIM_FILES.forEach((relPath, i) => {
    py.FS.writeFile(`/hub_shims/${relPath}`, sources[i])
  })

  py.runPython(`
import sys
if '/hub_shims' not in sys.path:
    sys.path.insert(0, '/hub_shims')
`)
}

/** Boot the shared Pyodide instance and install the Python shim files. The
 *  caller supplies the relevant JavaScript bridges when it runs a script. */
export async function bootPyRuntime(): Promise<PyodideInterface> {
  if (bootPromise) return bootPromise
  setBootState('loading')
  // Pre-warm the watchdog NOW, while the event loop is free — the awaited
  // pyodide asset load below gives its tiny static script ample turns to
  // start (see startWatchdog's doc for why lazy creation cannot work).
  void startWatchdog()
  bootPromise = (async () => {
    try {
      const { loadPyodide } = await import('pyodide')
      const py = await loadPyodide({ indexURL: INDEX_URL })
      await installShims(py)
      setBootState('ready')
      return py
    } catch (e) {
      setBootState('unavailable')
      bootPromise = null
      throw e
    }
  })()
  return bootPromise
}

let runInFlight = false

/** Run one script at a time, including setup and any execution that outlives
 *  its UI deadline. Bridge replacements and output capture share that lock. */
export async function runPython(
  code: string,
  modules: Record<string, object> = {}
): Promise<PyRunResult> {
  if (runInFlight) {
    return {
      ok: false,
      stdout: '',
      stderr: '',
      error: 'A script is still running in this tab. Wait for it to finish before retrying.',
      elapsedMs: 0,
    }
  }
  runInFlight = true
  const t0 = performance.now()
  let out = ''
  let err = ''
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  let cleanupOnCompletion = false
  let release = () => {
    runInFlight = false
  }

  try {
    const py = await bootPyRuntime()
    let armed = false
    const disarmWatchdog = () => {
      if (!armed || !armCtrl) return
      Atomics.store(armCtrl, 0, 0)
      Atomics.notify(armCtrl, 0)
      // Replace the shared byte so a signal already in flight cannot
      // interrupt the callbacks that resume a timed-out asynchronous wait.
      py.setInterruptBuffer(new Uint8Array(1))
      armed = false
    }
    release = () => {
      try {
        disarmWatchdog()
        py.setStdout({})
        py.setStderr({})
      } finally {
        runInFlight = false
      }
    }
    for (const [name, module] of Object.entries(modules)) {
      py.registerJsModule(name, module)
      // Python import caching otherwise keeps the bridge from a previous engine or suite run.
      py.runPython(`__import__("sys").modules.pop(${JSON.stringify(name)}, None)\nNone`)
    }

    py.setStdout({
      batched: (line: string) => {
        out += line + '\n'
      },
    })
    py.setStderr({
      batched: (line: string) => {
        err += line + '\n'
      },
    })

    // Do not wait forever for a watchdog that failed to start.
    const buffer = await Promise.race([
      startWatchdog(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 1000)),
    ])
    if (buffer && armCtrl) {
      buffer[0] = 0
      py.setInterruptBuffer(buffer)
      armGeneration++
      Atomics.store(armCtrl, 0, armGeneration)
      Atomics.notify(armCtrl, 0)
      armed = true
    }

    const timeoutGuard = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        disarmWatchdog()
        reject(new Error(`Script exceeded ${RUN_TIMEOUT_MS / 1000}s`))
      }, RUN_TIMEOUT_MS)
    })
    // KMIP sample scripts need top-level await for pyfetch. Reporting a timeout
    // does not cancel a pending await, so release only when Python settles.
    const execution = py.runPythonAsync(code).finally(release)
    cleanupOnCompletion = true
    await Promise.race([execution, timeoutGuard])
    return { ok: true, stdout: out, stderr: err, error: null, elapsedMs: performance.now() - t0 }
  } catch (error) {
    return {
      ok: false,
      stdout: out,
      stderr: err,
      error: error instanceof Error ? error.message : String(error),
      elapsedMs: performance.now() - t0,
    }
  } finally {
    clearTimeout(timeoutId)
    if (!cleanupOnCompletion) release()
  }
}
