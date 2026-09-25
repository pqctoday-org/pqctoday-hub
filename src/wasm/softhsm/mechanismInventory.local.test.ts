// SPDX-License-Identifier: GPL-3.0-only
//
// Real-engine KAT for the WS-G mechanism inventory: loads BOTH shipped WASM
// engines, captures C_GetMechanismList + C_GetMechanismInfo through
// mechanismInventory.ts, and asserts the inventory hash equals the one
// committed in src/data/validation/mechanism-inventory.generated.json — and is
// stable across two captures of the same engine. A mismatch means the shipped
// engine advertises something the committed denominator does not describe:
// regenerate with `npm run gen:mechanism-inventory`.
//
// Engine loading mirrors mechanismNames.local.test.ts (Rust: the playground's
// own getSoftHSMRustModule singleton; C++: the vendored Emscripten glue with a
// filesystem locateFile, since getSoftHSMCppModule is browser-only).
//
// Venue: `*.local.test.ts` — real wasm, local gate only (2026-07-01 directive).
import { describe, it, expect, beforeAll } from 'vitest'
import { createRequire } from 'node:module'
import path from 'node:path'
import {
  getSoftHSMRustModule,
  hsm_initialize,
  hsm_getFirstSlot,
  type SoftHSMModule,
} from '@/wasm/softhsm'
import {
  captureMechanismInventory,
  compareToGenerated,
  type GeneratedMechanismInventoryFile,
  type MechanismInventory,
} from './mechanismInventory'
import generatedJson from '@/data/validation/mechanism-inventory.generated.json'

const generated = generatedJson as unknown as GeneratedMechanismInventoryFile
const require_ = createRequire(import.meta.url)

const loadCppEngineInNode = async (): Promise<SoftHSMModule> => {
  const gluePath = require_.resolve('@pqctoday/softhsm-wasm/wasm/softhsm.js')
  const wasmPath = path.join(path.dirname(gluePath), 'softhsm.wasm')
  const create = require_(gluePath) as (arg?: Record<string, unknown>) => Promise<SoftHSMModule>
  return create({ locateFile: (p: string) => (p.endsWith('.wasm') ? wasmPath : p) })
}

const captureTwice = async (
  M: SoftHSMModule
): Promise<[MechanismInventory, MechanismInventory]> => {
  const once = async () => {
    hsm_initialize(M)
    try {
      return await captureMechanismInventory(M, hsm_getFirstSlot(M))
    } finally {
      M._C_Finalize(0)
    }
  }
  return [await once(), await once()]
}

describe('runtime mechanism inventory matches the committed generated record', () => {
  let cpp: [MechanismInventory, MechanismInventory]
  let rust: [MechanismInventory, MechanismInventory]

  beforeAll(async () => {
    rust = await captureTwice((await getSoftHSMRustModule()) as SoftHSMModule)
    cpp = await captureTwice(await loadCppEngineInNode())
  }, 60000)

  it('C++: stable across captures and equal to the generated hash', () => {
    expect(cpp[0].inventorySha256).toBe(cpp[1].inventorySha256)
    expect(cpp[0].mechanismCount).toBeGreaterThan(50)
    expect(compareToGenerated(cpp[0], generated.engines.cpp)).toBe('matches-generated')
  })

  it('Rust: stable across captures and equal to the generated hash', () => {
    expect(rust[0].inventorySha256).toBe(rust[1].inventorySha256)
    expect(rust[0].mechanismCount).toBeGreaterThan(50)
    expect(compareToGenerated(rust[0], generated.engines.rust)).toBe('matches-generated')
  })

  it('no advertised mechanism has a failed C_GetMechanismInfo or zero operation flags', () => {
    for (const inv of [cpp[0], rust[0]]) {
      const bad = inv.mechanisms.filter(
        (m) =>
          m.findings.includes('mechanism-info-failed') || m.findings.includes('no-operation-flags')
      )
      expect(bad.map((m) => m.typeHex)).toEqual([])
    }
  })
})
