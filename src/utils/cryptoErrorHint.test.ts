// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { getCryptoErrorHint } from './cryptoErrorHint'
import { CKR_KEY_EXHAUSTED } from '@/wasm/softhsm/constants'

describe('getCryptoErrorHint', () => {
  it('maps CKR_KEY_EXHAUSTED by its real code (0x203), not CKA_EXTRACTABLE (0x162)', () => {
    expect(CKR_KEY_EXHAUSTED).toBe(0x203)
    const hint = getCryptoErrorHint('C_Sign failed: rv=0x00000203')
    expect(hint?.technicalNote).toContain('CKR_KEY_EXHAUSTED (0x203)')
    expect(getCryptoErrorHint('rv=0x00000162')?.technicalNote ?? '').not.toContain(
      'CKR_KEY_EXHAUSTED'
    )
  })
})
