// SPDX-License-Identifier: GPL-3.0-only
/**
 * Node-only engine loaders for the CLI (F-8) and the real-engine local tests.
 * Never import from browser code.
 *
 * Mirrors pqctoday-hsm tests/helpers.mjs `loadEngine()` (origin/main):
 *  - C++: the Emscripten CJS glue `softhsm.js` + `softhsm.wasm` (locateFile).
 *  - Rust: wasm-bindgen's `softhsmrustv3.js` does a static `import … .wasm`
 *    that Node cannot load, so the `_bg.js` glue is imported and the `.wasm`
 *    instantiated by hand with it as the import object, then `__wbg_set_wasm`
 *    + `__wbindgen_start` — and wrapped in the same Emscripten-compatible
 *    shim (`_free(ptr, 1)`, unsigned setValue/getValue, live HEAPU8) that
 *    src/wasm/softhsm.ts getSoftHSMRustModule() builds for the browser.
 *
 * Both load from THIS checkout's files (not via node_modules, which may be a
 * symlink to another worktree), and the loaded bytes are SHA-256'd for the
 * evidence sidecar alongside the matching public/wasm/wasm-provenance.json
 * record.
 */
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import { SOFTHSM_PRODUCT_VERSION } from '../../../wasm/softhsm'
import type { EngineIdentity } from '../dispatch'

export type EngineId = 'cpp' | 'rust'

export const ENGINE_ARTIFACTS: Record<
  EngineId,
  { glue: string; wasm: string; bundle: string; label: string; implementation: string }
> = {
  cpp: {
    glue: 'src/vendor/softhsm-wasm/wasm/softhsm.js',
    wasm: 'src/vendor/softhsm-wasm/wasm/softhsm.wasm',
    bundle: 'softhsm-cpp-engine',
    label: 'softhsmv3 C++ engine',
    implementation: 'pqctoday-hsm softhsmv3 C++ (OpenSSL 3.6 backend), Emscripten WASM',
  },
  rust: {
    glue: 'src/wasm/softhsmrustv3_bg.js',
    wasm: 'src/wasm/softhsmrustv3_bg.wasm',
    bundle: 'softhsmrustv3-engine',
    label: 'softhsmv3 Rust engine',
    implementation: 'pqctoday-hsm softhsmrustv3 (Rust), wasm-bindgen WASM',
  },
}

interface ProvenanceBundle {
  name: string
  hsmCommit?: string
  builtAt?: string
}

const readProvenance = (repoRoot: string, bundle: string): ProvenanceBundle | null => {
  try {
    const doc = JSON.parse(
      readFileSync(path.join(repoRoot, 'public/wasm/wasm-provenance.json'), 'utf8')
    ) as { bundles?: ProvenanceBundle[] }
    return doc.bundles?.find((b) => b.name === bundle) ?? null
  } catch {
    return null
  }
}

export interface LoadedEngine {
  module: SoftHSMModule
  identity: EngineIdentity
}

export const loadEngineNode = async (repoRoot: string, id: EngineId): Promise<LoadedEngine> => {
  const art = ENGINE_ARTIFACTS[id]
  const gluePath = path.join(repoRoot, art.glue)
  const wasmPath = path.join(repoRoot, art.wasm)
  const wasmBytes = readFileSync(wasmPath)
  const prov = readProvenance(repoRoot, art.bundle)
  const identity: EngineIdentity = {
    id,
    label: art.label,
    implementation: art.implementation,
    softhsmProductVersion: SOFTHSM_PRODUCT_VERSION,
    provenanceBundle: art.bundle,
    hsmCommit: prov?.hsmCommit ?? null,
    builtAt: prov?.builtAt ?? null,
    artifactPath: art.wasm,
    artifactSha256: createHash('sha256').update(wasmBytes).digest('hex'),
    artifactSha256Note: `SHA-256 of the exact ${art.wasm} bytes loaded for this run; hsmCommit/builtAt from public/wasm/wasm-provenance.json bundle "${art.bundle}".`,
  }

  if (id === 'cpp') {
    const require_ = createRequire(import.meta.url)
    const create = require_(gluePath) as (arg?: Record<string, unknown>) => Promise<SoftHSMModule>
    const module = await create({
      locateFile: (p: string) => (p.endsWith('.wasm') ? wasmPath : p),
    })
    return { module, identity }
  }

  const bg = (await import(/* @vite-ignore */ pathToFileURL(gluePath).href)) as Record<
    string,
    unknown
  > & { __wbg_set_wasm: (exports: WebAssembly.Exports) => void }
  const instance = new WebAssembly.Instance(new WebAssembly.Module(wasmBytes), {
    './softhsmrustv3_bg.js': bg as WebAssembly.ModuleImports,
  })
  bg.__wbg_set_wasm(instance.exports)
  ;(instance.exports.__wbindgen_start as (() => void) | undefined)?.()
  const memory = instance.exports.memory as WebAssembly.Memory
  const shim: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(bg)) if (typeof v === 'function') shim[k] = v
  const rawFree = bg._free as (ptr: number, size: number) => void
  shim._free = (ptr: number) => rawFree(ptr, 1)
  shim.setValue = (ptr: number, val: number, type: string) => {
    if (type === 'i32') new DataView(memory.buffer).setUint32(ptr, val, true)
  }
  shim.getValue = (ptr: number, type: string) =>
    type === 'i32' ? new DataView(memory.buffer).getUint32(ptr, true) : 0
  Object.defineProperty(shim, 'HEAPU8', { get: () => new Uint8Array(memory.buffer) })
  return { module: shim as unknown as SoftHSMModule, identity }
}
