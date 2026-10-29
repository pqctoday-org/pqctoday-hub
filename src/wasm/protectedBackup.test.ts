// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { decodeProtectedBackup, encodeProtectedBackup } from './protectedBackup'

describe('protected backup file boundary', () => {
  it('preserves the encrypted DER bytes exactly', () => {
    const bytes = new Uint8Array([0x30, 0x82, 0, 0xff])
    expect(decodeProtectedBackup(encodeProtectedBackup(bytes))).toEqual(bytes)
  })
  it.each(['null', '{}', '[]', '{"format":"legacy-seed","packageHex":"00"}'])(
    'rejects legacy or unidentified input: %s',
    (text) => {
      expect(() => decodeProtectedBackup(text)).toThrow(/protected replication export/)
    }
  )
  it.each(['', '0', '0x01', 'gg', '01 02'])(
    'rejects incomplete/non-hex bytes: %s',
    (packageHex) => {
      expect(() =>
        decodeProtectedBackup(
          JSON.stringify({ format: 'PQCTODAY_KEY_REPLICATION_1_0', packageHex })
        )
      ).toThrow(/hexadecimal/)
    }
  )
  it('bounds file size before parsing', () => {
    expect(() => decodeProtectedBackup(' '.repeat(525313))).toThrow(/too large/)
  })
  it('returns only package bytes, never editable algorithm/representation claims', () => {
    const value = JSON.parse(encodeProtectedBackup(new Uint8Array([0x30, 1])))
    value.algorithm = 'AES'
    value.representation = 'seed'
    expect(decodeProtectedBackup(JSON.stringify(value))).toEqual(new Uint8Array([0x30, 1]))
  })
})
