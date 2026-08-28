// SPDX-License-Identifier: GPL-3.0-only
/**
 * KmipShimGate — the P3 proof harness for dev-tabs-pkcs11-kmip plan WS-C.
 *
 * NOT part of the product. Mirrors P11ShimGate.tsx exactly: boots the real
 * KmipEngine, wires the kmip bridge, and runs the sandbox's ACTUAL,
 * UNMODIFIED sample source (fetched from /dev-gate-fixtures/17-kmip-cacp.py,
 * a copy of pqctoday-sandbox/samples/py/17-kmip-cacp.py) through Pyodide —
 * then reads the result off `window.__kmipGateResult`.
 */
import { useEffect, useRef } from 'react'
import { getKmipEngine } from '../wasm/kmip/kmipEngine'
import { createKmipBridge } from '../services/python/pyodide/kmipBridge'
import { bootPyRuntime, runPython } from '../services/python/pyRuntime'

declare global {
  interface Window {
    __kmipGateResult?: {
      status: 'pending' | 'ok' | 'error'
      detail?: string
      stdout?: string
      stderr?: string
    }
  }
}

async function runGate(): Promise<void> {
  window.__kmipGateResult = { status: 'pending' }
  try {
    const engine = await getKmipEngine()

    const py = await bootPyRuntime()
    const bridge = createKmipBridge(engine)
    py.registerJsModule('kmip_bridge', bridge)

    const sampleRes = await fetch('/dev-gate-fixtures/17-kmip-cacp.py')
    if (!sampleRes.ok) throw new Error(`fixture fetch failed: HTTP ${sampleRes.status}`)
    const sampleSrc = await sampleRes.text()

    const result = await runPython(sampleSrc)
    window.__kmipGateResult = {
      status: result.ok ? 'ok' : 'error',
      detail: result.error ?? undefined,
      stdout: result.stdout,
      stderr: result.stderr,
    }
  } catch (e) {
    window.__kmipGateResult = {
      status: 'error',
      detail: e instanceof Error ? `${e.message}\n${e.stack ?? ''}` : String(e),
    }
  }
}

export default function KmipShimGate() {
  const ran = useRef(false)
  useEffect(() => {
    if (ran.current) return
    ran.current = true
    void runGate()
  }, [])
  return <pre id="kmip-gate-status">P3 gate running — see window.__kmipGateResult</pre>
}
