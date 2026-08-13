// SPDX-License-Identifier: GPL-3.0-only
//
// Drift guard for the Mechanism Discovery name table (MECH_TABLE in
// session.ts) vs. what the two real engines actually advertise via
// C_GetMechanismList.
//
// Why this exists: the 2026-08-13 PKCS#11 playground audit (N13) found the
// mechanisms tab rendering "CKM_UNKNOWN" + raw hex for ~37 Rust / ~21 C++
// mechanism IDs — including standard v3.2 ones (CKM_RSA_PKCS_PSS 0x0d, the
// 0x0240 SSL/TLS-era block, the 0x4021–0x4037 ChaCha20/Poly1305/BLAKE2b/
// SHA-3-HMAC/HKDF block) and the engines' own vendor-defined PQC pair
// (CKM_PQCTODAY_FRODOKEM_* / CKM_PQCTODAY_CLASSIC_MCELIECE_*) that the KEM
// pane itself advertises by name. Nothing guarded the table against the
// engines: an engine release can add a mechanism and the pane silently
// degrades to hex.
//
// This test loads BOTH real wasm engines (the same singletons the playground
// ships), pulls their real advertised lists, and asserts every single ID
// decodes to a proper CKM_ name. Follows the pattern of
// workshopAlgorithms.driftguard.test.ts (guard derived from the real artifact,
// not from metadata) and pkcs11Lessons.local.test.ts (real-wasm venue).
//
// Venue: `*.local.test.ts` — excluded from CI vitest globs, run by the local
// gate (project directive 2026-07-01: new suites are local-only).
import { describe, it, expect, beforeAll } from 'vitest'
import { createRequire } from 'node:module'
import path from 'node:path'
import {
  getSoftHSMRustModule,
  hsm_initialize,
  hsm_getFirstSlot,
  hsm_getAllMechanisms,
  type SoftHSMModule,
  type MechanismInfo,
} from '@/wasm/softhsm'

const require_ = createRequire(import.meta.url)

/**
 * Load the C++ (Emscripten) engine directly from the vendored package.
 * getSoftHSMCppModule() is browser-only (it injects a <script> tag and fetches
 * /wasm/softhsm.wasm over HTTP), but the Emscripten glue itself supports Node
 * (ENVIRONMENT_IS_NODE) when given a filesystem path to the .wasm.
 */
const loadCppEngineInNode = async (): Promise<SoftHSMModule> => {
  const gluePath = require_.resolve('@pqctoday/softhsm-wasm/wasm/softhsm.js')
  const wasmPath = path.join(path.dirname(gluePath), 'softhsm.wasm')
  const createSoftHSMModule = require_(gluePath) as (
    arg?: Record<string, unknown>
  ) => Promise<SoftHSMModule>
  return createSoftHSMModule({
    locateFile: (p: string) => (p.endsWith('.wasm') ? wasmPath : p),
  })
}

/** Query one engine's full advertised mechanism list (C_GetMechanismList). */
const advertisedMechanisms = (M: SoftHSMModule): MechanismInfo[] => {
  hsm_initialize(M)
  const slot = hsm_getFirstSlot(M)
  // Mechanism discovery only needs a slot ID — no token init / login required
  // (same precondition HsmMechanismPanel relies on).
  return hsm_getAllMechanisms(M, slot)
}

const unnamed = (mechs: MechanismInfo[]): string[] =>
  mechs.filter((m) => m.name === 'CKM_UNKNOWN').map((m) => m.typeHex)

describe('MECH_TABLE covers every mechanism both real engines advertise', () => {
  let rustMechs: MechanismInfo[]
  let cppMechs: MechanismInfo[]

  beforeAll(async () => {
    const rust = (await getSoftHSMRustModule()) as SoftHSMModule
    rustMechs = advertisedMechanisms(rust)
    const cpp = await loadCppEngineInNode()
    cppMechs = advertisedMechanisms(cpp)
  }, 60000)

  it('both engines return a non-trivial mechanism list (guard is not vacuous)', () => {
    expect(rustMechs.length).toBeGreaterThan(50)
    expect(cppMechs.length).toBeGreaterThan(50)
  })

  it('Rust engine: every advertised mechanism ID decodes to a CKM_ name', () => {
    expect(unnamed(rustMechs)).toEqual([])
  })

  it('C++ engine: every advertised mechanism ID decodes to a CKM_ name', () => {
    expect(unnamed(cppMechs)).toEqual([])
  })

  it('no decoded name is a placeholder or duplicate-of-another-ID collision', () => {
    // Two different IDs resolving to the same CKM_ name would mean a
    // copy-paste error in the table — each codepoint names exactly one
    // mechanism in the OASIS header and the vendor headers.
    for (const mechs of [rustMechs, cppMechs]) {
      const named = mechs.filter((m) => m.name !== 'CKM_UNKNOWN')
      const byName = new Map<string, number[]>()
      for (const m of named) {
        byName.set(m.name, [...(byName.get(m.name) ?? []), m.type])
      }
      const collisions = [...byName.entries()].filter(([, types]) => types.length > 1)
      expect(collisions).toEqual([])
    }
  })
})
