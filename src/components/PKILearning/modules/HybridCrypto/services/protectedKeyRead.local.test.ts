// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { Pkcs11Error } from '@/wasm/softhsm'
import { requireProtectedKeyReadRefusal } from './protectedKeyRead'
describe('protected-key read evidence classification', () => {
  it.each(['C_GetAttributeValue(len)', 'C_GetAttributeValue'])(
    'accepts the expected wrapper refusal from %s',
    (operation) => {
      const result = requireProtectedKeyReadRefusal(() => {
        throw new Pkcs11Error(0x11, operation)
      })
      expect(result).toContain('Sample plaintext-read refusal observed')
      expect(result).toContain('does not establish the wrapping/export policy')
    }
  )
  it.each([
    'C_GetAttributeValue(len) → CKR_SESSION_HANDLE_INVALID (0x000000b3)',
    'C_GetAttributeValue(len) → CKR_OBJECT_HANDLE_INVALID (0x00000082)',
    'C_GetAttributeValue(len) → CKR_ATTRIBUTE_SENSITIVE (0x00000005)',
    'C_WrapKey → CKR_ATTRIBUTE_SENSITIVE (0x00000011)',
    'unrelated JavaScript failure mentioning CKR_ATTRIBUTE_SENSITIVE',
    'C_GetAttributeValue(len) → CKR_ATTRIBUTE_SENSITIVE (0x00000011)',
  ])('keeps unrelated or mismatched evidence incomplete: %s', (message) => {
    expect(() =>
      requireProtectedKeyReadRefusal(() => {
        throw new Error(message)
      })
    ).toThrow('check incomplete')
  })
  it.each([
    [0xb3, 'C_GetAttributeValue(len)'],
    [0x82, 'C_GetAttributeValue'],
    [0x11, 'C_WrapKey'],
  ] as const)('does not accept another operation or return code (%s, %s)', (rv, operation) => {
    expect(() =>
      requireProtectedKeyReadRefusal(() => {
        throw new Pkcs11Error(rv, operation)
      })
    ).toThrow('check incomplete')
  })
  it('rejects an unstructured thrown value instead of claiming a measured refusal', () => {
    expect(() =>
      requireProtectedKeyReadRefusal(() => {
        throw 'CKR_ATTRIBUTE_SENSITIVE'
      })
    ).toThrow('check incomplete')
  })
  it.each([new Uint8Array(), new Uint8Array(32)])(
    'rejects any unexpectedly successful read',
    (bytes) => {
      expect(() => requireProtectedKeyReadRefusal(() => bytes)).toThrow('unexpectedly succeeded')
    }
  )
})
