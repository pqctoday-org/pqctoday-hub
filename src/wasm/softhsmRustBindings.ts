// SPDX-License-Identifier: AGPL-3.0-only
type RustBindings = typeof import('./softhsmrustv3.js')

let bindingsPromise: Promise<RustBindings> | null = null

async function instantiateBindings(): Promise<RustBindings> {
  if (typeof process !== 'undefined' && process.versions?.node) {
    return import('./softhsmrustv3.js')
  }

  // Fetch the binary separately so a failed request can be retried without
  // replaying a rejected ES module evaluation from the browser's module map.
  const bindings = await import('@/wasm/softhsmrustv3_bg.js')
  const binary = new URL('./softhsmrustv3_bg.wasm', import.meta.url)
  const response = await fetch(binary)
  if (!response.ok) throw new Error(`SoftHSM Rust WASM request failed (${response.status})`)
  const { instance } = await WebAssembly.instantiate(await response.arrayBuffer(), {
    './softhsmrustv3_bg.js': bindings as WebAssembly.ModuleImports,
  })
  bindings.__wbg_set_wasm(instance.exports)
  const start = instance.exports.__wbindgen_start as () => void
  start()
  return bindings as RustBindings
}

export function loadSoftHsmRustBindings(): Promise<RustBindings> {
  if (!bindingsPromise) {
    bindingsPromise = instantiateBindings().catch((error) => {
      bindingsPromise = null
      throw error
    })
  }
  return bindingsPromise
}
