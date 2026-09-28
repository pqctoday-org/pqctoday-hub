// Runs katRunner's SUCI Profile B chain on the real Rust engine against the
// values printed in 3GPP TS 33.501 V19.5.0 Annex C.4.4.1 (Eph. Shared Key,
// Enc key, ICB, MAC key, cipher text, MAC tag, Scheme Output). Until
// 2026-09-24 steps 4, 6 and 7 returned 'pass' without checking anything, so
// this suite could not fail on them. Both engines: katRunner.engines.local.test.ts.
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import * as SoftHSM from './softhsm'
import { runKAT } from '../utils/katRunner'

describe('5G SUCI Profile B (3GPP TS 33.501 Annex C.4.4.1) KATs on the Rust engine', () => {
  let hsmd: SoftHSM.SoftHSMModule
  let sessionHandle: number

  beforeAll(async () => {
    const instance = await SoftHSM.getSoftHSMRustModule()
    hsmd = instance as any

    SoftHSM.hsm_initialize(hsmd)
    const rawSlot = SoftHSM.hsm_getFirstFreeSlot(hsmd)
    const slot = SoftHSM.hsm_initToken(hsmd, rawSlot, '1234', 'SUCI Test')
    sessionHandle = SoftHSM.hsm_openUserSession(hsmd, slot, '1234', '1234')
  })

  afterAll(() => {
    // Basic cleanup
  })

  const steps = [
    '1-unwrap-hn-priv',
    '2-unwrap-eph-priv',
    '3-ecdh',
    '4-kdf',
    '5-encrypt',
    '6-mac',
    '7-e2e',
  ]

  steps.forEach((step) => {
    it(`should pass suci-B-${step} against 3GPP vectors in SoftHSM3`, async () => {
      const result = await runKAT(hsmd, sessionHandle, {
        id: `suci-B-${step}`,
        useCase: '5G SUCI construction',
        standard: '3GPP TS 33.501 Annex C.4',
        referenceUrl: 'https://www.3gpp.org',
        kind: { type: 'suci-profile-b', step: step as any },
      })
      expect(result.status, result.details).toBe('pass')
    })
  })
})

describe('sabotage: a wrong published value fails the SUCI steps (temp module copy)', () => {
  it('one flipped ICB bit fails the KDF and encrypt steps; ECDH, which does not read it, still passes', async () => {
    const real = (await import('../data/kat/gsma_suci_ts33501_annex_c.json')).default as {
      official_3gpp_vectors: Array<Record<string, unknown>>
    }
    const copy = structuredClone(real)
    const b = copy.official_3gpp_vectors.find((v) => v.id === 'profile-b-imsi')!
    b.icb_hex = String(b.icb_hex).replace(/^EF/, 'EE')
    vi.resetModules()
    vi.doMock('../data/kat/gsma_suci_ts33501_annex_c.json', () => ({ default: copy }))
    const { runKAT: runSabotaged } = await import('../utils/katRunner')
    const M = (await SoftHSM.getSoftHSMRustModule()) as SoftHSM.SoftHSMModule
    const run = (step: string) =>
      runSabotaged(M, sabotageSession(M), {
        id: step,
        useCase: 'sabotage',
        standard: 'TS 33.501 C.4.4.1',
        referenceUrl: 'https://www.3gpp.org',
        kind: { type: 'suci-profile-b', step: step as '4-kdf' },
      })
    expect((await run('4-kdf')).status).toBe('fail')
    expect((await run('5-encrypt')).status).toBe('fail')
    expect((await run('3-ecdh')).status).toBe('pass') // ECDH does not read the ICB
    vi.doUnmock('../data/kat/gsma_suci_ts33501_annex_c.json')
  })
})

function sabotageSession(M: SoftHSM.SoftHSMModule): number {
  const slot = SoftHSM.hsm_initToken(M, SoftHSM.hsm_getFirstFreeSlot(M), '1234', 'SUCI sabotage')
  return SoftHSM.hsm_openUserSession(M, slot, '1234', '1234')
}
