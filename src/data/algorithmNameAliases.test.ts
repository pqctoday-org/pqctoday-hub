// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { expandAlgorithmAliases } from './algorithmNameAliases'

describe('expandAlgorithmAliases', () => {
  it('maps legacy filing-era names to their FIPS names', () => {
    expect(expandAlgorithmAliases(['Kyber'])).toEqual(['ML-KEM'])
    expect(expandAlgorithmAliases(['Dilithium'])).toEqual(['ML-DSA'])
    expect(expandAlgorithmAliases(['SPHINCS+'])).toEqual(['SLH-DSA'])
    expect(expandAlgorithmAliases(['Falcon'])).toEqual(['FN-DSA'])
  })

  it('maps FIPS names back to their legacy filing-era names', () => {
    expect(expandAlgorithmAliases(['ML-KEM'])).toEqual(['Kyber'])
    expect(expandAlgorithmAliases(['ML-DSA'])).toEqual(['Dilithium'])
    expect(expandAlgorithmAliases(['SLH-DSA'])).toEqual(['SPHINCS+'])
    expect(expandAlgorithmAliases(['FN-DSA'])).toEqual(['Falcon'])
  })

  it('is case-insensitive on lookup', () => {
    expect(expandAlgorithmAliases(['kyber'])).toEqual(['ML-KEM'])
  })

  it('returns no aliases for names with no known mapping', () => {
    expect(expandAlgorithmAliases(['RSA', 'AES'])).toEqual([])
  })

  it('dedupes and ignores unmapped names in a mixed list', () => {
    const result = expandAlgorithmAliases(['Kyber', 'Kyber', 'RSA'])
    expect(result).toEqual(['ML-KEM'])
  })
})
