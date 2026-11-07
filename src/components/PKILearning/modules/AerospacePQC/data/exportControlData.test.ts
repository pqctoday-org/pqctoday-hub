// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { EXPORT_PRODUCTS, EXPORT_DESTINATIONS, classifyExport } from './exportControlData'

const product = (id: string) => EXPORT_PRODUCTS.find((p) => p.id === id)!
const destination = (id: string) => EXPORT_DESTINATIONS.find((d) => d.id === id)!

describe('AUKUS screening is conditional, not a blanket no-license verdict', () => {
  const aukusDestinations = EXPORT_DESTINATIONS.filter((d) => /AUKUS/.test(d.alliance))

  it('covers Australia and the UK', () => {
    expect(aukusDestinations.map((d) => d.id).sort()).toEqual(['australia', 'uk'])
  })

  it('never says no license is needed for an ITAR item because of the destination alone', () => {
    for (const p of EXPORT_PRODUCTS.filter((x) => x.regime === 'itar')) {
      for (const d of aukusDestinations) {
        const r = classifyExport(p, d)
        expect(r.licenseRequired).toBe(true)
        expect(r.verdict).not.toMatch(/Streamlined under bilateral agreement/)
        expect(r.verdictColor).not.toBe('text-status-success')
      }
    }
  })

  it('in scope: an eligible-looking item is only potentially eligible, with its conditions listed', () => {
    const r = classifyExport(product('satellite-payload'), destination('australia'))
    expect(r.verdict).toMatch(/Potentially eligible for the AUKUS exemption \(22 CFR 126\.7\)/)
    expect(r.verdict).toMatch(/subject to every condition/)
    expect(r.verdict).toMatch(/excluded technology list/)
    expect(r.verdict).toMatch(/If any condition fails, a license or agreement is required/)
    expect(r.licenseException).toMatch(/only if every condition is met/)
  })

  it('out of scope: a classified XIII(b) crypto unit is on the excluded technology list', () => {
    const r = classifyExport(product('military-crypto-unit'), destination('uk'))
    expect(r.verdict).toMatch(/Excluded from the AUKUS exemption/)
    expect(r.verdict).toMatch(/USML Category XIII\(b\)/)
    expect(r.licenseException).toBeNull()
    expect(r.licenseRequired).toBe(true)
  })

  it('out of scope: a non-AUKUS destination never mentions the AUKUS exemption', () => {
    const r = classifyExport(product('satellite-payload'), destination('germany'))
    expect(r.verdict).not.toMatch(/AUKUS/)
    expect(r.licenseRequired).toBe(true)
  })

  it('states the 22 CFR 126.7 conditions and that it is not a country-level waiver', () => {
    for (const d of aukusDestinations) {
      expect(d.notes).toMatch(/22 CFR 126\.7/)
      expect(d.notes).toMatch(/Supplement No\. 2 excluded technology list/)
    }
    expect(destination('australia').notes).toMatch(/not a country-level waiver/)
    expect(destination('australia').notes).not.toMatch(
      /Technology Sharing Agreement|TAA covers most/
    )
  })
})

describe('EAR encryption screening', () => {
  it('does not grant a license exception from the destination alone', () => {
    for (const p of EXPORT_PRODUCTS.filter((x) => x.regime === 'ear')) {
      for (const d of EXPORT_DESTINATIONS.filter((x) => x.licenseEase !== 'denied')) {
        const r = classifyExport(p, d)
        expect(r.licenseRequired).toBe(true)
        expect(r.verdict).not.toMatch(/generally available/i)
        expect(r.verdict).toMatch(/License Exception ENC may/)
        expect(r.verdict).toMatch(/otherwise a license is required/i)
      }
    }
  })

  it('does not call publicly available software "TSR"', () => {
    const lib = product('pqc-crypto-library')
    expect(lib.licenseException ?? '').not.toMatch(/TSR|TSU/)
    expect(lib.licenseException).toMatch(/publicly available source code is not subject to the EAR/)
    const r = classifyExport(lib, destination('germany'))
    expect(r.verdict).toMatch(/source code is publicly available it is not subject to the EAR/)
    expect(r.verdict).toMatch(/compiled copies qualify only when their source meets those criteria/)
  })
})

describe('sample products are labelled hypothetical', () => {
  it('prefixes every classification with Hypothetical, so none reads as a universal ruling', () => {
    for (const p of EXPORT_PRODUCTS) {
      expect(p.classification).toMatch(/^Hypothetical:/)
      expect(p.description).toMatch(/^Hypothetical example:/)
    }
  })

  it('uses the USML entry for cryptographic equipment (XIII(b)), not the military-electronics category', () => {
    const unit = product('military-crypto-unit')
    expect(unit.classification).toMatch(/XIII\(b\)/)
    expect(unit.cfrCitation).toMatch(/XIII\(b\)/)
    expect(unit.classification).not.toMatch(/XI\(b\)(?!I)/)
  })
})
