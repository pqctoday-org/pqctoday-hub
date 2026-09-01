// SPDX-License-Identifier: GPL-3.0-only
/**
 * P11ShimGate — the P1 proof harness for dev-tabs-pkcs11-kmip plan WS-B.
 *
 * NOT part of the product. This route exists only so the P1 gate script
 * (scripts/dev-gate/run-p11-shim-gate.mjs) can drive a real browser, boot
 * the real softhsmv3 WASM engine + a real Pyodide instance, wire the p11
 * bridge, and run the sandbox's ACTUAL, UNMODIFIED sample source
 * (fetched from /dev-gate-fixtures/03-sign-verify.py, a copy of
 * pqctoday-sandbox/samples/py/03-sign-verify.py) through it — then read the
 * result off `window.__p11GateResult`.
 *
 * This is deliberately separate from the real Developer tab UI (WS-F, not
 * yet built): P1's job is to prove the runtime seam works before any tab
 * chrome is built on top of it.
 */
import { useEffect, useRef } from 'react'
import { getSoftHSMCppModule, createLoggingProxy, type SoftHSMModule } from '../wasm/softhsm'
import {
  hsm_initialize,
  hsm_getFirstSlot,
  hsm_initToken,
  hsm_openUserSession,
} from '../wasm/softhsm/session'
import { hsm_finalize } from '../wasm/softhsm/pqc'
import { createP11Bridge } from '../services/python/pyodide/p11Bridge'
import { bootPyRuntime, runPython } from '../services/python/pyRuntime'

declare global {
  interface Window {
    __p11GateResult?: {
      status: 'pending' | 'ok' | 'error'
      detail?: string
      stdout?: string
      stderr?: string
    }
  }
}

async function runGate(): Promise<void> {
  window.__p11GateResult = { status: 'pending' }
  try {
    const M: SoftHSMModule = await getSoftHSMCppModule()
    const proxy = createLoggingProxy(M, () => {}, 'cpp')
    // The WASM module is a singleton (see HsmContext.autoInit's identical
    // guard) — React 18 StrictMode double-invokes effects in dev, and a
    // prior gate run in the same page session leaves C_Initialize already
    // called. Finalize first; best-effort no-op when nothing was initialized.
    hsm_finalize(M, 0)
    hsm_initialize(proxy)
    const slot0 = hsm_getFirstSlot(proxy)
    const newSlot = hsm_initToken(proxy, slot0, '12345678', 'DevGate')
    // A fresh token has no USER PIN set — real hardware ships the same way,
    // and setting it (SO login → C_InitPIN → logout → login USER) is
    // provisioning, not part of the lesson. hsm_openUserSession does exactly
    // that sequence and leaves a session logged in as USER as a side effect.
    // PKCS#11 login state is per-TOKEN, not per-session (PKCS#11 v3.2 §5.6.1
    // — confirmed live here: closing the session alone left CKR_USER_ALREADY_
    // LOGGED_IN on the sample's own C_Login), so this harness must explicitly
    // C_Logout before handing off, or the sample's own Module().open_session
    // (pin='1234') would silently skip its real login rather than proving it.
    const provisioningSession = hsm_openUserSession(proxy, newSlot, '12345678', '1234')
    proxy._C_Logout(provisioningSession)
    proxy._C_CloseSession(provisioningSession)

    const py = await bootPyRuntime()
    const bridge = createP11Bridge(proxy)
    py.registerJsModule('p11_bridge', bridge)

    const sampleRes = await fetch('/dev-gate-fixtures/03-sign-verify.py')
    if (!sampleRes.ok) throw new Error(`fixture fetch failed: HTTP ${sampleRes.status}`)
    const sampleSrc = await sampleRes.text()

    const result = await runPython(sampleSrc)
    window.__p11GateResult = {
      status: result.ok ? 'ok' : 'error',
      detail: result.error ?? undefined,
      stdout: result.stdout,
      stderr: result.stderr,
    }
  } catch (e) {
    window.__p11GateResult = {
      status: 'error',
      detail: e instanceof Error ? `${e.message}\n${e.stack ?? ''}` : String(e),
    }
  }
}

export default function P11ShimGate() {
  const ran = useRef(false)
  useEffect(() => {
    if (ran.current) return
    ran.current = true
    void runGate()
  }, [])
  return <pre id="p11-gate-status">P1 gate running — see window.__p11GateResult</pre>
}
