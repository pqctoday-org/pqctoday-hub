// SPDX-License-Identifier: GPL-3.0-only
/**
 * pyRuntime — shared, lazily-booted Pyodide instance for the hub's Developer
 * tabs (dev-tabs-pkcs11-kmip plan, WS-A).
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
 * and the KMIP WASM engine are main-thread-synchronous already, so a worker
 * would require an RPC rewrite of the shims for no v1 benefit (plan §4).
 * That means there is no way to hard-abort a runaway script mid-execution in
 * v1 (Pyodide's interrupt buffer needs a cross-thread SharedArrayBuffer
 * write, which requires the interrupting code to run on a different
 * thread) — RUN_TIMEOUT_MS below is enforced BEFORE a run starts (refusing
 * to start a new run while one is still in flight) and via Python-level
 * cooperative checks a script can observe, not a true preemptive kill. A
 * true timeout is a recorded follow-on once/if execution moves to a worker.
 */
import type { PyodideInterface } from 'pyodide'

const INDEX_URL = '/pyodide/'
const RUN_TIMEOUT_MS = 15_000

export type PyRunResult = {
  ok: boolean
  stdout: string
  stderr: string
  error: string | null
  elapsedMs: number
}

export type PyBootState = 'idle' | 'loading' | 'ready' | 'unavailable'

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

/** Fetch a shim source file shipped as a static asset and return its text.
 *  Shims live under /pyodide-shims/ (copied at build time from
 *  src/wasm/pyodide/shims/ — see vite.config.ts's dev-tabs-shims plugin). */
async function fetchShimSource(relPath: string): Promise<string> {
  const res = await fetch(`/pyodide-shims/${relPath}`)
  if (!res.ok) {
    throw new Error(`pyRuntime: failed to fetch shim ${relPath} (HTTP ${res.status})`)
  }
  return res.text()
}

const SHIM_FILES = [
  'p11/__init__.py',
  'p11/_constants.py',
  'pqctoday_kmip/__init__.py',
] as const

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
 *  while one run is already in flight (see the class-level note on why
 *  there is no true preemptive timeout in v1). */
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
  py.setStdout({ batched: (s: string) => { out += s + '\n' } })
  py.setStderr({ batched: (s: string) => { err += s + '\n' } })
  try {
    const timeoutGuard = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Script exceeded ${RUN_TIMEOUT_MS / 1000}s`)), RUN_TIMEOUT_MS)
    })
    // runPythonAsync (not runPython): supports top-level `await` in the
    // generated script — needed for the KMIP tab's Load-policy step, which
    // fetches a real policy YAML file via Pyodide's pyfetch (the browser's
    // real fetch(), which resolves a relative URL like /kmip-policies/x.yaml
    // against the page's own origin — plain urllib.request has no browser
    // context and rejects a relative URL outright, confirmed live). A
    // strict superset of runPython: every already-proven synchronous
    // script (P1/P2/P3's PKCS#11 and KMIP-lifecycle samples) still runs
    // unchanged under it. Racing it against a timer only catches the case
    // where the AWAIT before it never resolves (module import, a stalled
    // fetch, etc.) — not a true mid-execution abort. Documented above.
    await Promise.race([py.runPythonAsync(code), timeoutGuard])
    return { ok: true, stdout: out, stderr: err, error: null, elapsedMs: performance.now() - t0 }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return { ok: false, stdout: out, stderr: err, error: message, elapsedMs: performance.now() - t0 }
  } finally {
    runInFlight = false
    py.setStdout({})
    py.setStderr({})
  }
}
