// SPDX-License-Identifier: GPL-3.0-only
/// <reference lib="webworker" />
//
// certDiscovery.worker.ts — runs the "Discovering certificates" lesson on its
// OWN Rust softhsmrustv3 instance, so the lesson can show a complete
// C_Initialize → C_Finalize trace without touching the playground's shared,
// already-initialized session (HsmContext). A worker has its own module
// graph, so this instance shares no state with the page's engine.
//
// The wasm-bindgen glue is instantiated by hand (the same two steps
// softhsmrustv3.js performs: __wbg_set_wasm, then __wbindgen_start) because
// Vite does not run vite-plugin-wasm inside workers; `?url` is core Vite.
//
// Protocol (one phase per message, run in order):
//   → { type: 'provision' | 'short' | 'long', requestId }
//   ← { type: 'result', requestId, result }  |  { type: 'error', requestId, error }
import * as bg from '@/wasm/softhsmrustv3_bg.js'
import wasmUrl from '@/wasm/softhsmrustv3_bg.wasm?url'
import {
  provisionFixture,
  runLongFlow,
  runShortFlow,
  type DiscoveryEngine,
} from './certDiscoveryCore'
import { LESSON_CERTS_DER_HEX } from './lessonCerts'

type Phase = 'provision' | 'short' | 'long'

let enginePromise: Promise<DiscoveryEngine> | null = null

const loadEngine = (): Promise<DiscoveryEngine> => {
  if (!enginePromise) {
    enginePromise = (async () => {
      const bytes = await (await fetch(wasmUrl)).arrayBuffer()
      const { instance } = await WebAssembly.instantiate(bytes, {
        './softhsmrustv3_bg.js': bg as unknown as WebAssembly.ModuleImports,
      })
      const glue = bg as unknown as {
        __wbg_set_wasm: (exports: WebAssembly.Exports) => void
        __wbg_get_memory: () => WebAssembly.Memory
      }
      glue.__wbg_set_wasm(instance.exports)
      ;(instance.exports.__wbindgen_start as () => void)()
      return { ...(bg as unknown as DiscoveryEngine), memory: () => glue.__wbg_get_memory() }
    })()
  }
  return enginePromise
}

self.onmessage = async (ev: MessageEvent<{ type: Phase; requestId: number }>) => {
  const { type, requestId } = ev.data
  try {
    const E = await loadEngine()
    const result =
      type === 'provision'
        ? provisionFixture(E, LESSON_CERTS_DER_HEX)
        : type === 'short'
          ? runShortFlow(E)
          : runLongFlow(E)
    self.postMessage({ type: 'result', requestId, result })
  } catch (e) {
    self.postMessage({
      type: 'error',
      requestId,
      error: e instanceof Error ? e.message : String(e),
    })
  }
}
