// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { hsmToCbomInput, libraryToCbomInput } from './cbomAdapters'
import { CRYPTO_LIBRARIES } from '../data/cryptoLibraries'
import { HSM_VENDORS } from '../data/hsmVendors'
import { buildCbomDocument } from '@/services/cbom/cycloneDx'

const legacyLibrary = CRYPTO_LIBRARIES.find((library) => library.id === 'openssl-1.1.1')!
const legacyHsm = HSM_VENDORS.find((hsm) => hsm.cmvpCertNumber?.includes('#3925'))!

describe('CBOM source association without inferred FIPS edition', () => {
  it.each([
    [
      'library',
      libraryToCbomInput(legacyLibrary),
      legacyLibrary.cmvpCertNumber,
      legacyLibrary.notes,
    ],
    ['device', hsmToCbomInput(legacyHsm), legacyHsm.cmvpCertNumber, legacyHsm.notes],
  ] as const)(
    'preserves the complete %s source identifier and notes without promoting it to FIPS140-3',
    (type, input, certId, notes) => {
      expect(input.type).toBe(type)
      expect(input.description).toBe(notes)
      expect(input.certifications).toEqual([{ certType: 'CMVP catalogue association', certId }])
      expect(input.properties).toContainEqual({
        name: 'pqctoday:cmvpEditionScope',
        value: expect.stringContaining('edition not established by this record'),
      })
      const doc = JSON.parse(buildCbomDocument([input]).json)
      const component = doc.components.find((item: { type: string }) => item.type === type)
      expect(component.description).toBe(notes)
      const references = component.properties.find(
        (property: { name: string }) => property.name === 'pqctoday:certificateReferences'
      )
      expect(JSON.parse(references.value)).toEqual([
        { certType: 'CMVP catalogue association', certId },
      ])
      expect(component.evidence).toBeUndefined()
      expect(JSON.stringify(component)).not.toContain('FIPS 140-3 CMVP')
    }
  )

  it('reports the existing level without asserting an edition, and does not parse a free-text standard', () => {
    const input = hsmToCbomInput(legacyHsm)
    expect(input.properties).toContainEqual({
      name: 'pqctoday:fipsLevel',
      value: `Reported level ${legacyHsm.fipsLevel}`,
    })
    const withoutEdition = libraryToCbomInput({
      ...legacyLibrary,
      cmvpCertNumber: '#sample-reference',
    })
    expect(withoutEdition.certifications?.[0]).toEqual({
      certType: 'CMVP catalogue association',
      certId: '#sample-reference',
    })
    const newer = libraryToCbomInput(
      CRYPTO_LIBRARIES.find((library) => library.id === 'openssl-3.5')!
    )
    expect(newer.certifications?.[0]?.certType).toBe('CMVP catalogue association')
    expect(newer.properties).toContainEqual({
      name: 'pqctoday:cmvpEditionScope',
      value: expect.stringContaining('edition not established by this record'),
    })
  })

  it('adds no certificate or edition assertion when there is no associated certificate', () => {
    const input = libraryToCbomInput({ ...legacyLibrary, cmvpCertNumber: null })
    expect(input.certifications).toEqual([])
    expect(
      input.properties?.some((property) => property.name === 'pqctoday:cmvpEditionScope')
    ).toBe(false)
  })
})
