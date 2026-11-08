// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  CERT_RELATIONSHIPS,
  certCoverageText,
  certIsLimited,
  certificationXrefs,
  parseCertRelationship,
} from './certificationXrefData'

// The Junos OS certificate 5266 case: the certificate covers MX and EX hardware
// running Junos OS 22.3R1, while the catalogue's latest release is 25.4R1.
const JUNOS_COVERS =
  'MX240, MX480 and MX960 series and EX9204, EX9208, EX9214 Ethernet Switches, Junos OS 22.3R1'

describe('parseCertRelationship', () => {
  it('knows the four recorded relationships', () => {
    expect([...CERT_RELATIONSHIPS].sort()).toEqual(
      ['earlier_release', 'module_of_product', 'platform_specific', 'same_release'].sort()
    )
    expect(parseCertRelationship(' Earlier_Release ')).toBe('earlier_release')
  })

  it('reads blank, absent and unknown values as not recorded', () => {
    expect(parseCertRelationship('')).toBeUndefined()
    expect(parseCertRelationship(undefined)).toBeUndefined()
    expect(parseCertRelationship('newer_release')).toBeUndefined()
  })
})

describe('certCoverageText', () => {
  it('an earlier-release certificate says so, naming the catalogue release', () => {
    expect(
      certCoverageText({ certCovers: JUNOS_COVERS, certRelationship: 'earlier_release' }, '25.4R1')
    ).toEqual({
      covers: JUNOS_COVERS,
      sentence: "Covers an earlier release than the catalogue's latest (25.4R1)",
      limited: true,
    })
  })

  it('leaves the release out of the sentence when the catalogue records none', () => {
    expect(certCoverageText({ certRelationship: 'earlier_release' }, '').sentence).toBe(
      "Covers an earlier release than the catalogue's latest"
    )
    expect(certCoverageText({ certRelationship: 'earlier_release' }).sentence).toBe(
      "Covers an earlier release than the catalogue's latest"
    )
  })

  it('words the other relationships plainly', () => {
    expect(certCoverageText({ certRelationship: 'platform_specific' })).toMatchObject({
      sentence: 'Covers named hardware platforms only',
      limited: true,
    })
    expect(certCoverageText({ certRelationship: 'module_of_product' })).toMatchObject({
      sentence: 'Covers a validated module the product uses, not the whole product',
      limited: true,
    })
    expect(certCoverageText({ certRelationship: 'same_release' })).toMatchObject({
      sentence: 'Matches the catalogue release',
      limited: false,
    })
  })

  it('a blank relationship adds no sentence and never defaults to "same release"', () => {
    const none = certCoverageText({ certCovers: JUNOS_COVERS })
    expect(none.sentence).toBeNull()
    expect(none.limited).toBe(false)
    expect(none.covers).toBe(JUNOS_COVERS)
  })

  it('blank columns give nothing at all', () => {
    expect(certCoverageText({})).toEqual({ covers: null, sentence: null, limited: false })
    expect(certCoverageText({ certCovers: '   ' }).covers).toBeNull()
  })
})

describe('certIsLimited', () => {
  it('is true only for a recorded relationship other than same release', () => {
    expect(certIsLimited({ certRelationship: 'earlier_release' })).toBe(true)
    expect(certIsLimited({ certRelationship: 'platform_specific' })).toBe(true)
    expect(certIsLimited({ certRelationship: 'module_of_product' })).toBe(true)
    expect(certIsLimited({ certRelationship: 'same_release' })).toBe(false)
    expect(certIsLimited({})).toBe(false)
  })
})

describe('certificate coverage on the shipped file', () => {
  it('every recorded relationship is a known value', () => {
    for (const x of certificationXrefs) {
      if (x.certRelationship) expect(CERT_RELATIONSHIPS).toContain(x.certRelationship)
    }
  })

  it('every earlier-release row says which release it covers', () => {
    for (const x of certificationXrefs) {
      if (x.certRelationship !== 'earlier_release') continue
      expect(
        /\d/.test(x.certCovers ?? ''),
        `${x.softwareName} #${x.certId}: earlier release with no release named in cert_covers`
      ).toBe(true)
    }
  })
})
