// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import { normalizeSearchText } from './useLibraryPipeline'

describe('normalizeSearchText', () => {
  it('makes "PKCS #11", "PKCS-11", "PKCS#11", and "PKCS11" equivalent', () => {
    const query = normalizeSearchText('pkcs11')
    expect(normalizeSearchText('pkcs #11 cryptographic token interface profiles')).toContain(query)
    expect(normalizeSearchText('pkcs-11-cryptographic-token-interface-profiles')).toContain(query)
    expect(normalizeSearchText('pkcs#11 conformance profiles')).toContain(query)
  })

  it('is a pure separator strip, not a no-op on unrelated text', () => {
    expect(normalizeSearchText('nist sp 800-171')).toBe('nistsp800171')
    expect(normalizeSearchText('rfc 9151')).toBe('rfc9151')
  })

  it('leaves an already-normalized string unchanged', () => {
    expect(normalizeSearchText('pkcs11')).toBe('pkcs11')
  })
})
