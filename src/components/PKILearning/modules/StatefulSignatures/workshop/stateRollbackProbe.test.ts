// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import { CKA_HSS_KEYS_REMAINING, CKA_VALUE } from '@/wasm/softhsm/constants'
import { probeStateRollback } from './stateRollbackProbe'

const fakeModule = (rv: { set: number; get: number; copy: number }) => {
  const setValue = vi.fn()
  const M = {
    HEAPU8: new Uint8Array(4096),
    _malloc: vi.fn(() => 64),
    _free: vi.fn(),
    setValue,
    getValue: vi.fn(() => 99),
    _C_SetAttributeValue: vi.fn(() => rv.set),
    _C_GetAttributeValue: vi.fn(() => rv.get),
    _C_CopyObject: vi.fn(() => rv.copy),
    _C_DestroyObject: vi.fn(() => 0),
  }
  return { M: M as unknown as SoftHSMModule, mock: M, setValue }
}

describe('probeStateRollback', () => {
  it('records the engine’s three refusals by name, and the counter it read before and after', () => {
    const { M, mock } = fakeModule({ set: 0x10, get: 0x11, copy: 0x1b })
    const probe = probeStateRollback(M, 1, 11, 29, () => 27)
    expect(probe.attempts.map((a) => [a.id, a.call, a.returned, a.refused])).toEqual([
      [
        'write-counter',
        'C_SetAttributeValue(CKA_HSS_KEYS_REMAINING)',
        'CKR_ATTRIBUTE_READ_ONLY',
        true,
      ],
      ['read-state', 'C_GetAttributeValue(CKA_VALUE)', 'CKR_ATTRIBUTE_SENSITIVE', true],
      ['copy-key', 'C_CopyObject', 'CKR_ACTION_PROHIBITED', true],
    ])
    expect(probe).toMatchObject({ remainingBefore: 27, remainingAfter: 27, counterMoved: false })
    expect(mock._C_DestroyObject).not.toHaveBeenCalled()
    // the calls are made on the key handle given, for the attributes named
    expect(mock._C_SetAttributeValue.mock.calls[0].slice(0, 2)).toEqual([1, 11])
    expect(mock._C_GetAttributeValue.mock.calls[0].slice(0, 2)).toEqual([1, 11])
    expect(mock._C_CopyObject.mock.calls[0].slice(0, 2)).toEqual([1, 11])
    expect(CKA_HSS_KEYS_REMAINING).toBe(0x61c)
    expect(CKA_VALUE).toBe(0x11)
  })

  it('shows an accepted attempt as accepted, removes a copy the engine made, and sees the counter move', () => {
    const { M, mock } = fakeModule({ set: 0, get: 0, copy: 0 })
    let remaining = 27
    mock._C_SetAttributeValue.mockImplementation(() => {
      remaining = 29
      return 0
    })
    const probe = probeStateRollback(M, 1, 11, 29, () => remaining)
    expect(probe.attempts.every((a) => !a.refused)).toBe(true)
    expect(probe.attempts.map((a) => a.returned)).toEqual(['CKR_OK', 'CKR_OK', 'CKR_OK'])
    expect(probe).toMatchObject({ remainingBefore: 27, remainingAfter: 29, counterMoved: true })
    expect(mock._C_DestroyObject).toHaveBeenCalledWith(1, 99)
  })
})
