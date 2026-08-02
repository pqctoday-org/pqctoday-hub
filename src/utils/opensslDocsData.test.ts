// SPDX-License-Identifier: GPL-3.0-only
// Regression coverage for the Grade-A remediation OS-2 fix: parseDocsMap
// normalizes openssl_docs_map.csv keys to lower case, but the algorithm
// names OpenSSL Studio's shipped presets emit (WorkbenchPresets.tsx) are
// upper case (e.g. `ML-DSA-65`). Every lookup must go through the
// case-insensitive getOpenSSLDocEntry / getOpenSSLDocUrl helpers instead of
// touching the map directly, or a real preset's docs link silently misses.
import { describe, it, expect } from 'vitest'
import {
  getOpenSSLDocEntry,
  getOpenSSLDocUrl,
  tokenizeCommand,
  FLAG_HINTS,
} from './opensslDocsData'

describe('getOpenSSLDocEntry', () => {
  it('resolves an upper-case algorithm name (ML-DSA-65) to its real doc entry', () => {
    const entry = getOpenSSLDocEntry('ML-DSA-65')
    expect(entry).toBeDefined()
    expect(entry?.filename).toBe('EVP_SIGNATURE-ML-DSA.html')
    expect(entry?.docUrl).toContain('EVP_SIGNATURE-ML-DSA.html')
  })

  it('resolves mixed-case and lower-case variants of the same key identically', () => {
    const upper = getOpenSSLDocEntry('ML-KEM-768')
    const lower = getOpenSSLDocEntry('ml-kem-768')
    const mixed = getOpenSSLDocEntry('Ml-Kem-768')
    expect(upper).toEqual(lower)
    expect(mixed).toEqual(lower)
    expect(lower?.filename).toBe('EVP_KEM-ML-KEM.html')
  })

  it('resolves SLH-DSA parameter-set names case-insensitively', () => {
    const entry = getOpenSSLDocEntry('SLH-DSA-SHA2-128s')
    expect(entry?.filename).toBe('EVP_SIGNATURE-SLH-DSA.html')
  })

  it('returns undefined for a command/algorithm that has no CSV row', () => {
    expect(getOpenSSLDocEntry('not-a-real-command')).toBeUndefined()
  })
})

describe('getOpenSSLDocUrl', () => {
  it('links a shipped ML-DSA-65 genpkey preset to the ML-DSA-specific man page, not the generic genpkey page', () => {
    const url = getOpenSSLDocUrl('openssl genpkey -algorithm ML-DSA-65 -out ml-dsa-65.key')
    expect(url).toContain('EVP_SIGNATURE-ML-DSA.html')
    expect(url).not.toContain('openssl-genpkey.html')
  })

  it('links a shipped ML-KEM-768 genpkey preset to the ML-KEM-specific man page', () => {
    const url = getOpenSSLDocUrl('openssl genpkey -algorithm ML-KEM-768 -out ml-kem-768.key')
    expect(url).toContain('EVP_KEM-ML-KEM.html')
  })

  it('links a shipped SLH-DSA genpkey preset to the SLH-DSA-specific man page', () => {
    const url = getOpenSSLDocUrl('openssl genpkey -algorithm SLH-DSA-SHA2-128s -out slh-dsa.key')
    expect(url).toContain('EVP_SIGNATURE-SLH-DSA.html')
  })

  it('falls back to the primary command doc page when no arg matches a specific algorithm', () => {
    const url = getOpenSSLDocUrl(
      'openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out rsa.key'
    )
    expect(url).toContain('openssl-genpkey.html')
  })

  it('falls back to the primary command doc page for a plain non-PQC operation', () => {
    const url = getOpenSSLDocUrl('openssl req -new -key private.key -out csr.pem -sha256')
    expect(url).toContain('openssl-req.html')
  })

  it('returns the default doc for an empty command', () => {
    expect(getOpenSSLDocUrl('')).toContain('openssl.html')
  })
})

describe('tokenizeCommand / FLAG_HINTS (already case-consistent, unaffected by the CSV casing bug)', () => {
  it('still attaches a hover hint to a known flag regardless of the docs-map fix', () => {
    const tokens = tokenizeCommand('genpkey -algorithm ML-DSA-65 -out ml-dsa-65.key')
    const algorithmFlag = tokens.find((t) => t.text === '-algorithm')
    expect(algorithmFlag?.hint).toBe(FLAG_HINTS['-algorithm'])
  })
})
