// SPDX-License-Identifier: AGPL-3.0-only
//
// Inspect decoding for engines that run outside createLoggingProxy — a
// dedicated worker that drives its own raw wasm instance through closures
// (`call('C_GetTokenInfo', '…', () => E._C_GetTokenInfo(slot, p))`). The
// closure hides the raw arguments the decoder needs, so instead of editing
// every call site, the engine object's `_C_*` functions are wrapped once and
// the most recent call is handed to buildInspect right after it returns,
// while the buffers it points at are still live.
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import { buildInspect, type Pkcs11LogInspect } from './pkcs11Inspect'

type Fn = (...a: number[]) => number

interface CapturedCall {
  fn: string
  args: number[]
  rv: number
}

const captures = new WeakMap<object, { last: CapturedCall | null; raw: Record<string, Fn> }>()

/**
 * Wrap every `_C_*` function on `engine` in place (idempotent) and return a
 * reader for the last call. `memory` gives the engine's linear memory, which
 * may grow, so it is re-read on every access.
 */
export const capturePkcs11Calls = (
  engine: object,
  memory: () => WebAssembly.Memory
): { inspectLast: (fn: string) => Pkcs11LogInspect | undefined } => {
  const E = engine as Record<string, unknown>
  let state = captures.get(engine)
  if (!state) {
    const s = { last: null as CapturedCall | null, raw: {} as Record<string, Fn> }
    state = s
    captures.set(engine, s)
    for (const k of Object.keys(E)) {
      const f = E[k]
      if (!k.startsWith('_C_') || typeof f !== 'function') continue
      s.raw[k] = f as Fn
      E[k] = (...args: number[]) => {
        const rv = (f as Fn)(...args)
        s.last = { fn: k.slice(1), args, rv: rv >>> 0 }
        return rv
      }
    }
  }
  const s = state
  const view = () => new DataView(memory().buffer)
  // The subset of SoftHSMModule buildInspect reads. Attribute lookups made by
  // a decoder (a key's CKA_PARAMETER_SET) go through the engine's own
  // function, so they are not themselves captured or logged.
  const heap = {
    get HEAPU8() {
      return new Uint8Array(memory().buffer)
    },
    getValue: (p: number) => view().getInt32(p, true),
    setValue: (p: number, v: number) => view().setInt32(p, v | 0, true),
    _malloc: E._malloc,
    _free: E._free,
    _C_GetAttributeValue: s.raw._C_GetAttributeValue,
  } as unknown as SoftHSMModule
  return {
    inspectLast: (fn) => {
      const c = s.last
      s.last = null
      return c && c.fn === fn ? buildInspect(heap, c.fn, c.args, c.rv) : undefined
    },
  }
}
