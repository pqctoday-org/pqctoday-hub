// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  MODULE_PLAYGROUND_TOOL,
  MODULE_TAXONOMY,
  getPlaygroundToolForModule,
  shouldShowPlaygroundLink,
  getModuleAlgorithms,
  getModuleStandards,
  modulesByAlgorithm,
  modulesByStandard,
} from './moduleEnrichment'

describe('moduleEnrichment — playground mapping (P2-1)', () => {
  it('returns the curated tool id for known modules', () => {
    expect(getPlaygroundToolForModule('tls-basics')).toBe('tls-simulator')
    expect(getPlaygroundToolForModule('email-signing')).toBe('email-signing')
    expect(getPlaygroundToolForModule('pki-workshop')).toBe('pki-workshop')
  })

  it('returns undefined for modules without a curated mapping', () => {
    expect(getPlaygroundToolForModule('pqc-101')).toBeUndefined()
    expect(getPlaygroundToolForModule('nonexistent-module')).toBeUndefined()
  })

  it('shouldShowPlaygroundLink only fires for ops persona with a mapped module', () => {
    expect(shouldShowPlaygroundLink('ops', 'tls-basics')).toBe(true)
    expect(shouldShowPlaygroundLink('ops', 'pqc-101')).toBe(false) // no mapping
    expect(shouldShowPlaygroundLink('developer', 'tls-basics')).toBe(false) // wrong persona
    expect(shouldShowPlaygroundLink(null, 'tls-basics')).toBe(false)
  })

  it('every mapped Playground tool id is non-empty and lowercase-hyphen', () => {
    for (const [moduleId, toolId] of Object.entries(MODULE_PLAYGROUND_TOOL)) {
      expect(toolId.length).toBeGreaterThan(0)
      expect(toolId).toMatch(/^[a-z0-9-]+$/)
      expect(moduleId.length).toBeGreaterThan(0)
    }
  })
})

describe('moduleEnrichment — researcher taxonomy (P2-3)', () => {
  it('returns the curated algorithm list for tagged modules', () => {
    expect(getModuleAlgorithms('pqc-101')).toEqual(['ML-KEM', 'ML-DSA', 'SLH-DSA'])
    expect(getModuleAlgorithms('hybrid-crypto')).toContain('ML-KEM')
    expect(getModuleAlgorithms('hybrid-crypto')).toContain('X25519')
  })

  it('returns an empty list for untagged modules', () => {
    expect(getModuleAlgorithms('untagged-module')).toEqual([])
    expect(getModuleStandards('untagged-module')).toEqual([])
  })

  it('modulesByAlgorithm finds every tagged module', () => {
    const ml_kem = modulesByAlgorithm('ML-KEM')
    expect(ml_kem).toContain('pqc-101')
    expect(ml_kem).toContain('tls-basics')
    expect(ml_kem).toContain('hybrid-crypto')
    // sanity — not all modules
    expect(ml_kem.length).toBeLessThan(Object.keys(MODULE_TAXONOMY).length + 1)
  })

  it('modulesByStandard finds every tagged module', () => {
    const fips_205 = modulesByStandard('FIPS 205')
    expect(fips_205).toContain('slh-dsa')

    const jose = modulesByStandard('JOSE')
    expect(jose).toContain('email-signing')
    expect(jose).toContain('api-security-jwt')
  })

  it('every taxonomy entry references real algorithm / standard tokens', () => {
    const ALGS = new Set([
      'ML-KEM',
      'ML-DSA',
      'SLH-DSA',
      'Falcon',
      'LMS/XMSS',
      'HQC',
      'RSA',
      'ECDSA',
      'ECDH',
      'X25519',
    ])
    const STDS = new Set([
      'FIPS 203',
      'FIPS 204',
      'FIPS 205',
      'NIST SP 800-208',
      'RFC 9421',
      'RFC 9180',
      'RFC 9442',
      'RFC 9794',
      'X.509',
      'PKCS#11',
      'JOSE',
    ])
    for (const entry of Object.values(MODULE_TAXONOMY)) {
      for (const alg of entry.algorithms ?? []) {
        expect(ALGS.has(alg)).toBe(true)
      }
      for (const std of entry.standards ?? []) {
        expect(STDS.has(std)).toBe(true)
      }
    }
  })
})
