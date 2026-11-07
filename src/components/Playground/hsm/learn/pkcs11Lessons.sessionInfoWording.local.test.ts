// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import type { HsmContextValue } from '../HsmContext'

vi.mock('@/wasm/softhsm', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/wasm/softhsm')>()),
  hsm_getSessionInfo: vi.fn(() => ({ slotID: 1, state: 3, flags: 6 })),
}))

import { FOUNDATIONS_LESSONS } from './pkcs11Lessons'

describe('C_GetSessionInfo lesson step', () => {
  it('describes the session state as the one entered by logging in', async () => {
    const step = FOUNDATIONS_LESSONS.flatMap((l) => l.steps).find(
      (s) => s.op === 'C_GetSessionInfo'
    )!
    const hsm = {
      moduleRef: { current: {} },
      hSessionRef: { current: 7 },
      slotRef: { current: 1 },
    } as unknown as HsmContextValue
    const result = await step.run(hsm, [])
    expect(result.detail).toBe(
      'slotID=1 state=3 flags=0x6 — state reflects the R/W User Functions state you entered by logging in.'
    )
    expect(result.detail).not.toContain('login you just performed')
  })
})
