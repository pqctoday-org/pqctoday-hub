// SPDX-License-Identifier: GPL-3.0-only
/**
 * An importer that silently drops half a reader's inventory is worse than no
 * importer — they would carry a confident report built on a partial premise.
 * Both directions are pinned: what it matches, and what it admits it didn't.
 */
import { describe, it, expect } from 'vitest'
import { parseCbom, CbomParseError } from './cbomImport'

const OPTIONS = ['RSA-2048', 'ECDH P-256', 'ML-KEM-768', 'AES-256', 'Ed25519']

const cbom = (components: unknown[], specVersion = '1.7') =>
  JSON.stringify({ bomFormat: 'CycloneDX', specVersion, components })

const asset = (props: Record<string, unknown>) => ({
  type: 'cryptographic-asset',
  ...props,
})

describe('parseCbom', () => {
  it('matches algorithm names regardless of punctuation or case', () => {
    const doc = cbom([
      asset({ cryptoProperties: { algorithmProperties: { primitive: 'ml-kem-768' } } }),
      asset({ cryptoProperties: { algorithmProperties: { primitive: 'RSA_2048' } } }),
    ])
    const r = parseCbom(doc, OPTIONS)
    expect(r.recognised).toEqual(['ML-KEM-768', 'RSA-2048'])
    expect(r.unrecognised).toEqual([])
    expect(r.assetsSeen).toBe(2)
  })

  it('reports what it could not match rather than dropping it', () => {
    const doc = cbom([
      asset({ cryptoProperties: { algorithmProperties: { primitive: 'ML-KEM-768' } } }),
      asset({ cryptoProperties: { algorithmProperties: { primitive: 'GOST R 34.10-2012' } } }),
    ])
    const r = parseCbom(doc, OPTIONS)
    expect(r.recognised).toEqual(['ML-KEM-768'])
    expect(r.unrecognised).toContain('GOST R 34.10-2012')
  })

  it('ignores non-crypto components, and counts only crypto assets', () => {
    const doc = cbom([
      { type: 'library', name: 'RSA-2048' },
      asset({ cryptoProperties: { algorithmProperties: { primitive: 'AES-256' } } }),
    ])
    const r = parseCbom(doc, OPTIONS)
    expect(r.assetsSeen).toBe(1)
    expect(r.recognised).toEqual(['AES-256'])
  })

  it('refuses a file that is not CycloneDX, with a sentence a human can act on', () => {
    expect(() => parseCbom(JSON.stringify({ hello: 'world' }), OPTIONS)).toThrow(CbomParseError)
    expect(() => parseCbom('not json at all', OPTIONS)).toThrow(/valid JSON/i)
  })

  it('refuses a CycloneDX file with no cryptographic assets, and says why', () => {
    expect(() => parseCbom(cbom([{ type: 'library', name: 'left-pad' }]), OPTIONS)).toThrow(
      /no cryptographic assets/i
    )
  })

  it('reports the spec version it actually read', () => {
    const r = parseCbom(
      cbom([asset({ cryptoProperties: { algorithmProperties: { primitive: 'AES-256' } } })], '1.6'),
      OPTIONS
    )
    expect(r.format).toBe('CycloneDX 1.6')
  })
})
