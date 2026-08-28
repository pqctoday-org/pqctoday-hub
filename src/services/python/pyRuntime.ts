// SPDX-License-Identifier: GPL-3.0-only
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

/** Boot (or return the existing) shared Pyodide instance. Installs the p11 /
 *  pqctoday_kmip shim packages onto its filesystem, but does NOT register
 *  the JS bridges — callers register `js.p11_bridge` / `js.kmip_bridge`
 *  themselves once their engine is booted (see HsmContext / KmipEngine
 *  wiring), because bridge availability is per-tab, not global. */
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

/** Run a Python script, capturing stdout/stderr. Rejects a concurrent call
 *  while one run is already in flight — a fixed guard, not itself a
 *  timeout (see the class-level note on the two actual timeout layers). */
export async function runPython(code: string): Promise<PyRunResult> {
  if (runInFlight) {
    return {
      ok: false,
      stdout: '',
      stderr: '',
      error: 'A script is already running in this tab — wait for it to finish.',
      elapsedMs: 0,
    }
  }
  const py = await bootPyRuntime()
  runInFlight = true
  const t0 = performance.now()
  let out = ''
  let err = ''
  py.setStdout({
    batched: (s: string) => {
      out += s + '\n'
    },
  })
  py.setStderr({
    batched: (s: string) => {
      err += s + '\n'
    },
  })

  // Arm the watchdog (layer 1). The soft race keeps a pathological
  // worker-boot failure from wedging runs forever — that run simply falls
  // back to layer 2, and the await itself yields the event loop, which is
  // exactly what a still-loading watchdog needs to finish starting.
  const buffer = await Promise.race([
    startWatchdog(),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 1000)),
  ])
  let armed = false
  if (buffer && armCtrl) {
    buffer[0] = 0 // clear any stale interrupt a prior run's deadline raced in after that run finished
    py.setInterruptBuffer(buffer)
    armGeneration++
    Atomics.store(armCtrl, 0, armGeneration)
    Atomics.notify(armCtrl, 0)
    armed = true
  }

  try {
    const timeoutGuard = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error(`Script exceeded ${RUN_TIMEOUT_MS / 1000}s`)),
        RUN_TIMEOUT_MS
      )
    })
    // runPythonAsync (not runPython): supports top-level `await` in the
    // generated script — needed for the KMIP tab's Load-policy step, which
    // fetches a real policy YAML file via Pyodide's pyfetch (the browser's
    // real fetch(), which resolves a relative URL like /kmip-policies/x.yaml
    // against the page's own origin — plain urllib.request has no browser
    // context and rejects a relative URL outright, confirmed live). A
    // strict superset of runPython: every already-proven synchronous
    // script (P1/P2/P3's PKCS#11 and KMIP-lifecycle samples) still runs
    // unchanged under it. The race is layer 2 only (stalled awaits) — a
    // tight synchronous loop is layer 1's job, see the module header.
    await Promise.race([py.runPythonAsync(code), timeoutGuard])
    return { ok: true, stdout: out, stderr: err, error: null, elapsedMs: performance.now() - t0 }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return {
      ok: false,
      stdout: out,
      stderr: err,
      error: message,
      elapsedMs: performance.now() - t0,
    }
  } finally {
    runInFlight = false
    py.setStdout({})
    py.setStderr({})
    if (armed && armCtrl) {
      Atomics.store(armCtrl, 0, 0) // disarm — the watchdog's wait wakes and goes back to sleep
      Atomics.notify(armCtrl, 0)
    }
  }
}
