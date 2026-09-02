// SPDX-License-Identifier: GPL-3.0-only
//
// Pyodide JS modules for the suite Code views. Registered per run with
// `py.registerJsModule('acvp_native', …)` / `('pkcs11_conformance', …)` next
// to the existing `p11_bridge`. Each function calls the suite hook's own
// runner (so the Builder view's rows update too) and returns the rows as a
// JSON string — a plain string crosses the Pyodide boundary without proxy
// lifetime concerns, and `json.loads` on the Python side is one line.
import type { AcvpSuite, CategoryId } from '@/components/Playground/hsm/acvp/useAcvpSuite'
import type { Pkcs11ConformanceSuite } from '@/components/Playground/hsm/conformance/usePkcs11Conformance'
import { bootPyRuntime, runPython } from '@/services/python/pyRuntime'

/** A Python list arrives as a PyProxy; a JS array as itself. */
const toStringArray = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.map(String)
  const proxy = v as { toJs?: () => unknown }
  if (proxy && typeof proxy.toJs === 'function') {
    const js = proxy.toJs()
    return Array.isArray(js) ? js.map(String) : []
  }
  return []
}

export interface AcvpBridge {
  run_categories: (ids: unknown) => Promise<string>
}

export const createAcvpBridge = (suite: AcvpSuite): AcvpBridge => ({
  run_categories: async (ids: unknown) => {
    const set = new Set(toStringArray(ids) as CategoryId[])
    const rows = await suite.runTests(set)
    return JSON.stringify(rows)
  },
})

export interface ConformanceBridge {
  claims: () => string
  run_cases: (ids: unknown, tierB: unknown, coverage: unknown) => Promise<string>
}

export const createConformanceBridge = (suite: Pkcs11ConformanceSuite): ConformanceBridge => ({
  claims: () => JSON.stringify(suite.claims),
  run_cases: async (ids: unknown, tierB: unknown, coverage: unknown) => {
    const rows = await suite.run({
      tierA: new Set(toStringArray(ids)),
      tierB: Boolean(tierB),
      coverage: Boolean(coverage),
    })
    return JSON.stringify(rows)
  },
})

/** Run a generated suite script in Pyodide with the given JS modules
 *  registered first (in addition to whatever the runtime already has).
 *  Returns captured stdout/stderr as one block for the Code view. */
export async function runSuiteScript(
  code: string,
  modules: Record<string, object>
): Promise<{ ok: boolean; text: string }> {
  const py = await bootPyRuntime()
  for (const [name, mod] of Object.entries(modules)) py.registerJsModule(name, mod)
  const result = await runPython(code)
  const text = [result.stdout, result.stderr, result.error].filter(Boolean).join('\n').trim()
  return { ok: result.ok, text: text || (result.ok ? '(no output)' : 'run failed') }
}
