// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { summarizeCbom } from './reportSummary'
import { extractAllAlgorithmsFromText, type CbomComponentInput } from './cycloneDx'

function input(type: CbomComponentInput['type'], name: string, text: string): CbomComponentInput {
  return { type, name, bomRef: `pkg:${name}`, algorithms: extractAllAlgorithmsFromText(text) }
}

describe('summarizeCbom', () => {
  it('returns an all-zero summary for an empty inventory', () => {
    const summary = summarizeCbom([], 'libs')
    expect(summary.mode).toBe('libs')
    expect(summary.componentCount).toBe(0)
    expect(summary.componentsWithCrypto).toBe(0)
    expect(summary.cryptoAssetCount).toBe(0)
    expect(summary.quantumSafeCount).toBe(0)
    expect(summary.quantumVulnerableCount).toBe(0)
    expect(summary.algorithms).toEqual([])
    expect(summary.byType).toEqual({})
  })

  it('splits quantum-safe (PQC) from quantum-vulnerable (classical) crypto-assets', () => {
    const inputs = [
      input('library', 'liboqs', 'ML-KEM-768 key exchange, ML-DSA-65 signatures'),
      input('library', 'openssl', 'RSA-2048 certificate signing'),
    ]
    const summary = summarizeCbom(inputs, 'libs')
    expect(summary.cryptoAssetCount).toBe(3)
    expect(summary.quantumSafeCount).toBe(2)
    expect(summary.quantumVulnerableCount).toBe(1)
  })

  it('counts components without any detected crypto separately from componentCount', () => {
    const inputs = [
      input('library', 'liboqs', 'ML-KEM-768 key exchange'),
      input('device', 'no-crypto-hsm', 'a device with no algorithms named in its description'),
    ]
    const summary = summarizeCbom(inputs, 'hsm')
    expect(summary.componentCount).toBe(2)
    expect(summary.componentsWithCrypto).toBe(1)
  })

  it('deduplicates repeated algorithms across components in the citation list, but still counts each occurrence', () => {
    const inputs = [
      input('library', 'lib-a', 'ML-KEM-768 key exchange'),
      input('library', 'lib-b', 'ML-KEM-768 key exchange'),
    ]
    const summary = summarizeCbom(inputs, 'libs')
    expect(summary.cryptoAssetCount).toBe(2) // both occurrences counted
    expect(summary.algorithms).toHaveLength(1) // but listed once
    expect(summary.algorithms[0].name).toBe('ML-KEM-768')
  })

  it('attaches a real registry citation for standardized families, never fabricates one for unstandardized ones', () => {
    const inputs = [input('library', 'mixed', 'ML-KEM-768 key exchange, Falcon-512 signatures')]
    const summary = summarizeCbom(inputs, 'libs')
    const mlkem = summary.algorithms.find((a) => a.family === 'ML-KEM')
    const falcon = summary.algorithms.find((a) => a.family === 'Falcon')
    expect(mlkem?.standard).toBe('FIPS203')
    expect(mlkem?.standardUrl).toMatch(/^https:\/\//)
    expect(falcon?.standard).toBeUndefined()
    expect(falcon?.standardUrl).toBeUndefined()
  })

  it('tallies components by type', () => {
    const inputs = [
      input('library', 'lib-a', 'ML-KEM-768'),
      input('library', 'lib-b', 'RSA-2048'),
      input('device', 'hsm-a', 'ECDSA P-256'),
    ]
    const summary = summarizeCbom(inputs, 'sbom')
    expect(summary.byType).toEqual({ library: 2, device: 1 })
  })

  it('marks classical algorithm entries as classical:true, PQC entries as classical:false', () => {
    const inputs = [input('library', 'mixed', 'ML-KEM-768 key exchange, RSA-2048 signing')]
    const summary = summarizeCbom(inputs, 'libs')
    expect(summary.algorithms.find((a) => a.family === 'ML-KEM')?.classical).toBe(false)
    expect(summary.algorithms.find((a) => a.family.startsWith('RSA'))?.classical).toBe(true)
  })
})
