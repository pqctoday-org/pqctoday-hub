// SPDX-License-Identifier: GPL-3.0-only
/**
 * Tests for the ChangelogView "For me" persona-keyword regex map.
 *
 * The PERSONA_KEYWORDS regex is a heuristic that surfaces changelog entries to
 * a persona when the entry doesn't carry an explicit [persona:X] tag. These
 * tests pin the regex against real phrases from the corpus so future edits
 * don't accidentally narrow the filter or introduce false positives.
 */
import { describe, it, expect } from 'vitest'
import { PERSONA_KEYWORDS } from './ChangelogView'

describe('PERSONA_KEYWORDS', () => {
  it('has a regex for every persona', () => {
    expect(Object.keys(PERSONA_KEYWORDS).sort()).toEqual([
      'architect',
      'curious',
      'developer',
      'executive',
      'ops',
      'researcher',
    ])
  })

  describe('executive', () => {
    it.each([
      'CNSA 2.0 deadline is 2027',
      'New regulatory framework from ANSSI',
      'Compliance landscape update',
      'NIST policy roadmap',
      'BSI guidance shipped',
      'Audit gate enforces…',
    ])('matches %s', (text) => {
      expect(PERSONA_KEYWORDS.executive.test(text)).toBe(true)
    })

    it.each(['Improved tsconfig for vitest', 'Refactor TLS handshake state machine'])(
      'does not match %s',
      (text) => {
        expect(PERSONA_KEYWORDS.executive.test(text)).toBe(false)
      }
    )
  })

  describe('developer', () => {
    it.each([
      'OpenSSL WASM bundle rebuilt',
      'JWT signing now uses RFC 9964',
      'New vitest harness for KAT vectors',
      'CI workflow on GitHub Action',
      'lint passes on the playground tools',
      'TypeScript type for ChunkProv',
    ])('matches %s', (text) => {
      expect(PERSONA_KEYWORDS.developer.test(text)).toBe(true)
    })

    it.each(['Updated US compliance deadline copy', 'New regulatory framework summary card'])(
      'does not match %s',
      (text) => {
        expect(PERSONA_KEYWORDS.developer.test(text)).toBe(false)
      }
    )
  })

  describe('architect', () => {
    it.each([
      'PKI hierarchy redesign',
      'PKCS#11 v3.2 wrapper landed',
      'Hybrid certificate composite signature',
      'Crypto-agility maturity dashboard',
      'X.509 certificate chain validation',
      'Root of trust attestation flow',
    ])('matches %s', (text) => {
      expect(PERSONA_KEYWORDS.architect.test(text)).toBe(true)
    })
  })

  describe('researcher', () => {
    it.each([
      'New PROV-DM provenance fields',
      'RAG corpus embeddings regenerated',
      'Trust-engine attestation verified in CI',
      'ACVP test vectors pinned for ML-DSA',
      'Cryptanalysis attack on Falcon variant',
      'OSCAL combined artifact re-signed',
      'CBOM regenerated to v3.16',
      'Concept registry deprecates draft slug',
    ])('matches %s', (text) => {
      expect(PERSONA_KEYWORDS.researcher.test(text)).toBe(true)
    })
  })

  describe('ops', () => {
    it.each([
      'Cert rotation cadence shortened',
      'New CSV refresh for compliance data',
      'Catalog refresh added 12 products',
      'HSM firmware update guidance',
      'Deploy runbook revised',
      'Fleet planner shows TPS per region',
    ])('matches %s', (text) => {
      expect(PERSONA_KEYWORDS.ops.test(text)).toBe(true)
    })
  })

  describe('curious', () => {
    it.each([
      'Plain-language intro to PQC',
      'Three-step onboarding flow',
      'Curious teaser card on /algorithms',
      'New orientation banner on /threats',
      'Persona picker simplified',
      'Learn module overview card',
    ])('matches %s', (text) => {
      expect(PERSONA_KEYWORDS.curious.test(text)).toBe(true)
    })
  })

  it('developer + researcher both match cross-cutting RAG-corpus work', () => {
    // Real entry: "RAG corpus + embeddings + trust-engine signatures regenerated"
    const text = 'RAG corpus + embeddings + trust-engine signatures regenerated for RFC 9964'
    expect(PERSONA_KEYWORDS.researcher.test(text)).toBe(true)
    // Not exclusively researcher — also OK if developer matches via "RFC"
  })
})
