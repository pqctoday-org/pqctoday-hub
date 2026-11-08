// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection -- engine key is a literal 'cpp' | 'rust' */
//
// The envelope workshop's known-answer checks run through the REAL runKAT and the REAL softhsm
// wasm engines (C++ and Rust), the same code the "KMS PQC Known Answer Tests" panel runs in the
// browser. The default-venue suite pins the vectors and the labels against Node/OpenSSL; this one
// proves the engines pass every spec the workshop lists, including ML-KEM-512/768/1024
// decapsulation against NIST ACVP samples, the CAVP AES-256-GCM vector, HKDF (RFC 5869 A.1), and
// the RFC 5649 section 6 AES-KWP vectors.
//
//   npx vitest run --config vitest.local.config.ts \
//     src/components/PKILearning/modules/KmsPqc/workshop/EnvelopeEncryptionDemo.kat.local.test.ts
//
// Venue: `*.local.test.ts` — local gate only (directive 2026-07-01).
import { createRequire } from 'node:module'
import path from 'node:path'
import { describe, it, expect, beforeAll } from 'vitest'
import * as SoftHSM from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'
import { runKAT, advertisedMechanisms, type KATResult } from '@/utils/katRunner'
import { KMS_KAT_SPECS, runPublishedKwpVectors } from './EnvelopeEncryptionDemo'

const require_ = createRequire(import.meta.url)
const CPP_GLUE = path.resolve(process.cwd(), 'src/vendor/softhsm-wasm/wasm/softhsm.js')
const CPP_WASM = path.join(path.dirname(CPP_GLUE), 'softhsm.wasm')

const loadCpp = async (): Promise<SoftHSMModule> => {
  const create = require_(CPP_GLUE) as (arg?: Record<string, unknown>) => Promise<SoftHSMModule>
  return create({ locateFile: (p: string) => (p.endsWith('.wasm') ? CPP_WASM : p) })
}

const openSession = (M: SoftHSMModule) => {
  SoftHSM.hsm_initialize(M)
  const slot = SoftHSM.hsm_initToken(M, SoftHSM.hsm_getFirstFreeSlot(M), '1234', 'KMS KAT')
  return { slot, session: SoftHSM.hsm_openUserSession(M, slot, '1234', '1234') }
}

describe('envelope workshop known-answer checks on both real wasm engines', () => {
  const kat: Record<'cpp' | 'rust', KATResult[]> = { cpp: [], rust: [] }
  const kwp: Record<'cpp' | 'rust', ReturnType<typeof runPublishedKwpVectors>> = {
    cpp: [],
    rust: [],
  }

  beforeAll(async () => {
    for (const [engine, load] of [
      ['cpp', loadCpp],
      ['rust', async () => (await SoftHSM.getSoftHSMRustModule()) as SoftHSMModule],
    ] as const) {
      const M = await load()
      const { slot, session } = openSession(M)
      const advertised = advertisedMechanisms(M, slot)
      for (const spec of KMS_KAT_SPECS) {
        kat[engine].push(await runKAT(M, session, spec, { advertised }))
      }
      kwp[engine] = runPublishedKwpVectors(M, session)
    }
  }, 600_000)

  it.each(['cpp', 'rust'] as const)(
    '%s: every workshop KAT spec passes (no fail, error or skip)',
    (engine) => {
      expect(kat[engine].length).toBe(KMS_KAT_SPECS.length)
      const bad = kat[engine]
        .filter((r) => r.status !== 'pass')
        .map((r) => `${r.id}: ${r.status} — ${r.details}`)
      expect(bad).toEqual([])
    }
  )

  it.each(['cpp', 'rust'] as const)(
    '%s: the RFC 5649 section 6 vectors reproduce the published ciphertext and key data',
    (engine) => {
      expect(kwp[engine].length).toBe(2)
      const bad = kwp[engine].filter((r) => !r.pass).map((r) => `${r.id}: ${r.details}`)
      expect(bad).toEqual([])
    }
  )
})
