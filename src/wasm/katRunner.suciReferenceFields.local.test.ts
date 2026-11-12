// SPDX-License-Identifier: AGPL-3.0-only
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRequire } from 'node:module'
import { createECDH, createHash, createCipheriv, createHmac } from 'node:crypto'
import path from 'node:path'
import * as SoftHSM from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'
import { runKAT, type KatTestSpec } from '@/utils/katRunner'
import vectors from '@/data/kat/gsma_suci_ts33501_annex_c.json'

// An isolated in-memory copy; the published source file is never changed.
vi.mock('@/data/kat/gsma_suci_ts33501_annex_c.json', async (original) => ({
  default: structuredClone((await original<{ default: typeof vectors }>()).default),
}))
const baseline = structuredClone(vectors)
type Vector = {
  eph_shared_key_hex: string
  eph_enc_key_hex: string
  icb_hex: string
  eph_mac_key_hex: string
  scheme_output_parts: { cipher_msin: string; mac_tag: string }
  scheme_output: string
}
const vector = () =>
  vectors.official_3gpp_vectors.find((v) => v.id === 'profile-b-imsi') as unknown as Vector
const flip = (s: string) =>
  (parseInt(s.slice(0, 2), 16) ^ 1).toString(16).padStart(2, '0') + s.slice(2)
const steps = ['3-ecdh', '4-kdf', '5-encrypt', '6-mac', '7-e2e'] as const
const specs: KatTestSpec[] = steps.map((step) => ({
  id: step,
  useCase: 'Fixed Profile B published sample',
  standard: '3GPP TS 33.501 V19.5.0 C.4.4.1',
  referenceUrl:
    'https://www.etsi.org/deliver/etsi_ts/133500_133599/133501/19.05.00_60/ts_133501v190500p.pdf',
  kind: { type: 'suci-profile-b', step },
}))
const changes: Array<{
  label: string
  change: (v: Vector) => void
  omit: (v: Partial<Vector>) => void
}> = [
  {
    label: 'ECDH Z',
    change: (v) => {
      v.eph_shared_key_hex = flip(v.eph_shared_key_hex)
    },
    omit: (v) => {
      delete v.eph_shared_key_hex
    },
  },
  {
    label: 'Enc key',
    change: (v) => {
      v.eph_enc_key_hex = flip(v.eph_enc_key_hex)
    },
    omit: (v) => {
      delete v.eph_enc_key_hex
    },
  },
  {
    label: 'ICB',
    change: (v) => {
      v.icb_hex = flip(v.icb_hex)
    },
    omit: (v) => {
      delete v.icb_hex
    },
  },
  {
    label: 'MAC key',
    change: (v) => {
      v.eph_mac_key_hex = flip(v.eph_mac_key_hex)
    },
    omit: (v) => {
      delete v.eph_mac_key_hex
    },
  },
  {
    label: 'ciphertext',
    change: (v) => {
      v.scheme_output_parts.cipher_msin = flip(v.scheme_output_parts.cipher_msin)
    },
    omit: (v) => {
      Reflect.deleteProperty(v.scheme_output_parts!, 'cipher_msin')
    },
  },
  {
    label: 'MAC tag',
    change: (v) => {
      v.scheme_output_parts.mac_tag = flip(v.scheme_output_parts.mac_tag)
    },
    omit: (v) => {
      Reflect.deleteProperty(v.scheme_output_parts!, 'mac_tag')
    },
  },
  {
    label: 'scheme output',
    change: (v) => {
      v.scheme_output = flip(v.scheme_output)
    },
    omit: (v) => {
      delete v.scheme_output
    },
  },
]
const contexts: Array<{
  engine: string
  M: SoftHSMModule
  session: number
  advertised: Set<number>
}> = []
beforeAll(async () => {
  const require_ = createRequire(import.meta.url)
  const glue = path.resolve('src/vendor/softhsm-wasm/wasm/softhsm.js')
  const createCpp = require_(glue) as (config: Record<string, unknown>) => Promise<SoftHSMModule>
  for (const [engine, load] of [
    ['rust', () => SoftHSM.getSoftHSMRustModule() as Promise<SoftHSMModule>],
    [
      'cpp',
      () => createCpp({ locateFile: (file: string) => path.resolve(path.dirname(glue), file) }),
    ],
  ] as const) {
    const M = await load()
    SoftHSM.hsm_initialize(M)
    const slot = SoftHSM.hsm_initToken(M, SoftHSM.hsm_getFirstFreeSlot(M), '1234', 'SUCI reference')
    contexts.push({
      engine,
      M,
      session: SoftHSM.hsm_openUserSession(M, slot, '1234', '1234'),
      advertised: new Set(SoftHSM.hsm_getMechanismList(M, slot)),
    })
  }
}, 60_000)
beforeEach(() => {
  Object.assign(vectors, structuredClone(baseline))
})
afterAll(() => {
  for (const { M, session } of contexts) M._C_CloseSession(session)
})
async function runAll(context: (typeof contexts)[number]) {
  const results = []
  for (const spec of specs)
    results.push(await runKAT(context.M, context.session, spec, { advertised: context.advertised }))
  return results
}
it('independently reproduces the published inputs and all expected outputs with Node crypto', () => {
  const v = baseline.official_3gpp_vectors.find((item) => item.id === 'profile-b-imsi')!
  const eph = createECDH('prime256v1')
  eph.setPrivateKey(Buffer.from(v.eph_priv_hex, 'hex'))
  const publicPoint = eph.getPublicKey(undefined, 'compressed')
  expect(publicPoint.toString('hex').toUpperCase()).toBe(v.eph_pub_compressed_hex)
  const hn = createECDH('prime256v1')
  hn.setPrivateKey(Buffer.from(v.hn_priv_hex, 'hex'))
  expect(hn.getPublicKey().toString('hex').toUpperCase()).toBe(v.hn_pub_hex)
  const z = eph.computeSecret(Buffer.from(v.hn_pub_hex, 'hex'))
  const kdf = Buffer.concat(
    [1, 2].map((counter) =>
      createHash('sha256')
        .update(z)
        .update(Buffer.from([0, 0, 0, counter]))
        .update(publicPoint)
        .digest()
    )
  )
  const cipher = createCipheriv('aes-128-ctr', kdf.subarray(0, 16), kdf.subarray(16, 32))
  const ciphertext = Buffer.concat([
    cipher.update(Buffer.from(v.plaintext_block_hex!, 'hex')),
    cipher.final(),
  ])
  const tag = createHmac('sha256', kdf.subarray(32, 64)).update(ciphertext).digest().subarray(0, 8)
  expect(
    [
      z,
      kdf.subarray(0, 16),
      kdf.subarray(16, 32),
      kdf.subarray(32, 64),
      ciphertext,
      tag,
      Buffer.concat([publicPoint, ciphertext, tag]),
    ].map((bytes) => bytes.toString('hex').toUpperCase())
  ).toEqual([
    v.eph_shared_key_hex,
    v.eph_enc_key_hex,
    v.icb_hex,
    v.eph_mac_key_hex,
    v.scheme_output_parts.cipher_msin,
    v.scheme_output_parts.mac_tag,
    v.scheme_output,
  ])
})
for (const engine of ['rust', 'cpp']) {
  describe(`fixed Profile B expected fields on ${engine}`, () => {
    const context = () => contexts.find((c) => c.engine === engine)!
    it('passes all five published output checks on the existing actual engine', async () => {
      const results = await runAll(context())
      expect(results.map((r) => [r.id, r.status, r.evidence])).toEqual(
        steps.map((s) => [s, 'pass', 'published-standard-kat'])
      )
    })
    for (const entry of changes) {
      it(`does not complete when the published ${entry.label} differs`, async () => {
        entry.change(vector())
        const results = await runAll(context())
        expect(results.some((r) => r.status === 'fail')).toBe(true)
        expect(results.every((r) => r.status === 'pass')).toBe(false)
        if (entry.label === 'MAC key')
          expect(results.find((r) => r.id === '3-ecdh')?.status).toBe('pass')
      })
      it(`does not complete when the published ${entry.label} is missing`, async () => {
        entry.omit(vector())
        expect((await runAll(context())).every((r) => r.status === 'pass')).toBe(false)
      })
    }
    it('keeps a derivation operation error incomplete and permits a genuine retry', async () => {
      const { M } = context()
      const spy = vi.spyOn(M, '_C_DeriveKey').mockReturnValue(5)
      try {
        expect((await runAll(context())).every((r) => r.status === 'pass')).toBe(false)
      } finally {
        spy.mockRestore()
      }
      expect((await runAll(context())).every((r) => r.status === 'pass')).toBe(true)
    })
  })
}
