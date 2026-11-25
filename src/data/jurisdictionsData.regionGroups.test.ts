// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The site's region and EU-member lists are read from jurisdictions_*.csv, never typed
 * again elsewhere. These checks pin what the other files rely on.
 */
import { describe, it, expect } from 'vitest'
import {
  ALL_JURISDICTIONS,
  COUNTRY_CODE_TO_NAME,
  EU_MEMBER_CODES,
  EU_MEMBER_NAMES,
  JURISDICTION_BY_CODE,
  JURISDICTION_NAMES_BY_REGION,
  REGION_JURISDICTION_NAMES,
  REGION_LEAD_JURISDICTION,
} from './jurisdictionsData'

describe('region groups read from the jurisdictions registry', () => {
  it('lists every active jurisdiction under exactly one region', () => {
    const listed = Object.values(JURISDICTION_NAMES_BY_REGION).flat()
    expect(new Set(listed).size).toBe(listed.length)
    expect(new Set(listed)).toEqual(new Set(Object.values(COUNTRY_CODE_TO_NAME)))
  })

  it('offers each site region every jurisdiction the registry puts there, picker or not', () => {
    for (const region of ['americas', 'eu', 'mena', 'apac'] as const) {
      expect(REGION_JURISDICTION_NAMES[region].length).toBeGreaterThan(0)
      for (const name of REGION_JURISDICTION_NAMES[region]) {
        const code = Object.entries(COUNTRY_CODE_TO_NAME).find(([, n]) => n === name)?.[0]
        expect(JURISDICTION_BY_CODE[code as string].region).toBe(region)
      }
    }
    const picker = ALL_JURISDICTIONS.filter((j) => j.region === 'apac').map((j) => j.name)
    for (const name of picker) expect(REGION_JURISDICTION_NAMES.apac).toContain(name)
  })

  it('keeps Israel in the Middle East and the Czech Republic named as the registry names it', () => {
    expect(REGION_JURISDICTION_NAMES.mena).toContain('Israel')
    expect(REGION_JURISDICTION_NAMES.eu).not.toContain('Israel')
    expect(COUNTRY_CODE_TO_NAME.CZ).toBe('Czech Republic')
  })

  it('has the EU itself and the 27 member states as EU members', () => {
    expect(EU_MEMBER_NAMES.has('European Union')).toBe(true)
    expect(EU_MEMBER_NAMES.size).toBe(EU_MEMBER_CODES.size)
    expect(EU_MEMBER_NAMES.size).toBe(28)
  })

  // A region's lead is the first row of that region in the CSV; this fails if the rows are
  // re-ordered so a different country would be picked by default.
  it('leads each region with the country a reader lands on', () => {
    expect(REGION_LEAD_JURISDICTION).toEqual({
      americas: 'United States',
      eu: 'European Union',
      mena: 'Israel',
      apac: 'Japan',
    })
  })
})
