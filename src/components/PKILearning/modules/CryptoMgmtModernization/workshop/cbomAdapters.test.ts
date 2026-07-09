// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  matchLibrary,
  libraryToCbomInput,
  hsmToCbomInput,
  fileArtifactToCbomInput,
} from './cbomAdapters'
import { CRYPTO_LIBRARIES } from '../data/cryptoLibraries'
import { HSM_VENDORS } from '../data/hsmVendors'
import { FILE_ARTIFACTS } from '../data/fileArtifacts'
import { buildCbomDocument } from '@/services/cbom/cycloneDx'

interface DocComponent {
  type: string
  'bom-ref': string
  cryptoProperties?: {
    assetType: string
    algorithmProperties: {
      primitive: string
      executionEnvironment: string
      cryptoFunctions: string[]
    }
  }
}

describe('matchLibrary — version-aware SBOM → catalog matching', () => {
  it('resolves legacy openssl@1.1.1w to the EoL "crypto-debt" record, not the modern 3.5', () => {
    const m = matchLibrary('openssl', '1.1.1w')
    expect(m?.id).toBe('openssl-1.1.1')
    expect(m?.posture).toBe('red') // surfaced as crypto-debt
    expect(m?.fipsStatus).toBe('historical')
  })

  it('resolves openssl@3.5.0 to the active PQC-capable record', () => {
    const m = matchLibrary('openssl', '3.5.0')
    expect(m?.id).toBe('openssl-3.5')
    expect(m?.fipsStatus).toBe('active-pqc')
  })

  it('aliases bc-fips package names to the Bouncy Castle FIPS catalog entry', () => {
    const m = matchLibrary('bcprov-fips', '2.0.0')
    expect(m?.name.toLowerCase()).toContain('bouncy castle')
  })

  it('leaves a non-catalogued / non-FIPS package unmatched (surfaced as unknown debt)', () => {
    // plain bcprov (non-FIPS) has no catalog entry → unmatched, so it is NOT
    // mislabelled as the validated FIPS build
    expect(matchLibrary('bcprov-jdk18on', '1.78')).toBeUndefined()
    expect(matchLibrary('pycryptodome', '3.20.0')).toBeUndefined()
    expect(matchLibrary('netty-handler', '4.1.105.Final')).toBeUndefined()
  })

  it('still matches single-entry libraries by primary token', () => {
    expect(matchLibrary('mbedtls', '3.6.2')?.name).toBe('Mbed TLS')
    expect(matchLibrary('liboqs', '0.12.0')?.name).toBe('liboqs')
  })
})

describe('libraryToCbomInput → buildCbomDocument', () => {
  it('produces a schema-valid component with crypto-assets for a PQC-capable library', () => {
    const openssl35 = CRYPTO_LIBRARIES.find((l) => l.id === 'openssl-3.5')!
    const doc = JSON.parse(buildCbomDocument([libraryToCbomInput(openssl35)]).json)
    const lib = doc.components.find((c: { type: string }) => c.type === 'library')
    expect(lib.name).toBe('OpenSSL')
    expect(lib.version).toBe(openssl35.latestVersion)
    // ML-KEM + ML-DSA from "ML-KEM, ML-DSA via FIPS 3.5 provider" → crypto-assets
    const assets = doc.components.filter((c: { type: string }) => c.type === 'cryptographic-asset')
    expect(assets.length).toBeGreaterThanOrEqual(2)
    expect(assets.every((a: { cryptoProperties?: unknown }) => a.cryptoProperties)).toBe(true)
  })
})

describe('full-catalog CBOM validity (CycloneDX 1.6 enums + uniqueness)', () => {
  const VALID_COMPONENT_TYPES = new Set([
    'library',
    'application',
    'device',
    'file',
    'platform',
    'cryptographic-asset',
  ])
  // 07092026: classical algorithms (RSA/ECDSA/ECDH/EdDSA) now also emit as
  // crypto-assets, adding 'pke'/'key-agree' primitives and their functions.
  const VALID_PRIMITIVES = new Set(['kem', 'signature', 'pke', 'key-agree'])
  const VALID_FUNCTIONS = new Set([
    'encapsulate',
    'decapsulate',
    'sign',
    'verify',
    'encrypt',
    'decrypt',
    'keygen',
    'keyderive',
  ])

  it('every real catalog row emits enum-valid components with unique bom-refs', () => {
    const inputs = [
      ...CRYPTO_LIBRARIES.map(libraryToCbomInput),
      ...HSM_VENDORS.map(hsmToCbomInput),
      ...FILE_ARTIFACTS.map(fileArtifactToCbomInput),
    ]
    const doc = JSON.parse(buildCbomDocument(inputs).json)
    const components = doc.components as DocComponent[]
    expect(components.length).toBeGreaterThan(inputs.length) // parents + crypto-assets

    const refs = new Set<string>()
    for (const c of components) {
      expect(VALID_COMPONENT_TYPES.has(c.type)).toBe(true)
      // bom-refs unique across the whole document (CycloneDX requirement)
      expect(refs.has(c['bom-ref'])).toBe(false)
      refs.add(c['bom-ref'])
      if (c.type === 'cryptographic-asset') {
        expect(c.cryptoProperties?.assetType).toBe('algorithm')
        const ap = c.cryptoProperties!.algorithmProperties
        expect(VALID_PRIMITIVES.has(ap.primitive)).toBe(true)
        expect(ap.executionEnvironment).toBe('software-plain-ram')
        for (const fn of ap.cryptoFunctions) expect(VALID_FUNCTIONS.has(fn)).toBe(true)
      }
    }
  })
})
