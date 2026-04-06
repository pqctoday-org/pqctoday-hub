import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import * as SoftHSM from './softhsm'
import { runKAT } from '../utils/katRunner'

describe('Dual-Engine 5G SUCI Profile B (3GPP TS 33.501 Annex C.4) KATs', () => {
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
