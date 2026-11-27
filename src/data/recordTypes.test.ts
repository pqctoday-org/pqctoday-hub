// SPDX-License-Identifier: AGPL-3.0-only
// CI for the single record-type table (handoff 2.10, WP2): every type in the knowledge file is
// mapped, no type lands in "More" unless the owner listed it, and the label dictionary works.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  MORE_ALLOWED_TYPES,
  TAB_ORDER,
  countryName,
  labelFor,
  recordTypeInfo,
  recordTypes,
  tabOfType,
  typesOfTab,
} from './recordTypes'

const core = JSON.parse(
  readFileSync(resolve(__dirname, '../../public/data/knowledge-core.json'), 'utf8')
) as { records: { type: string; status?: string }[] }
const typesInFile = [...new Set(core.records.map((r) => r.type))].sort()

describe('recordTypes', () => {
  it('maps every record.type in the knowledge file (an unmapped type fails here)', () => {
    const unmapped = typesInFile.filter((t) => !recordTypeInfo(t))
    expect(unmapped, `unmapped record types: ${unmapped.join(', ')}`).toEqual([])
  })

  it('holds 46 types and no type the file does not use', () => {
    expect(Object.keys(recordTypes)).toHaveLength(46)
    expect(typesInFile).toHaveLength(46)
    expect(Object.keys(recordTypes).sort()).toEqual(typesInFile)
  })

  it('puts a type in "more" only when it is on the owner allow-list', () => {
    const inMore = Object.values(recordTypes).filter((i) => i.tab === 'more')
    const stray = inMore.filter((i) => !(MORE_ALLOWED_TYPES as readonly string[]).includes(i.type))
    expect(stray.map((i) => i.type)).toEqual([])
    expect(inMore.map((i) => i.type).sort()).toEqual([...MORE_ALLOWED_TYPES].sort())
  })

  it('uses only TAB_ORDER keys, in the fixed order of the handoff', () => {
    expect(TAB_ORDER).toEqual([
      'top',
      'learn',
      'timeline',
      'threats',
      'algorithms',
      'products',
      'compliance',
      'certifications',
      'tools',
      'library',
      'leaders',
      'patents',
      'pages',
      'releases',
      'glossary',
      'more',
    ])
    for (const info of Object.values(recordTypes)) expect(TAB_ORDER).toContain(info.tab)
  })

  it('has a route, an icon and a component for every type', () => {
    for (const info of Object.values(recordTypes)) {
      expect(info.route.startsWith('/'), info.type).toBe(true)
      expect(info.icon, info.type).toBeTruthy()
      expect(info.component, info.type).toMatch(/^[A-Z]/)
    }
  })

  it("keeps today's landings (D9) and the intended tab moves (I2)", () => {
    expect(recordTypes.country).toMatchObject({ tab: 'timeline', route: '/compliance' })
    expect(recordTypes.industrystandard).toMatchObject({ tab: 'library', route: '/algorithms' })
    expect(recordTypes.guidance.tab).toBe('compliance')
    expect(recordTypes.framework.tab).toBe('compliance')
    expect(recordTypes.algorithm.tab).toBe('algorithms')
    expect(recordTypes.tool.routes).toContain('/business/tools/<tool>')
  })

  it('answers for a type it does not hold', () => {
    expect(recordTypeInfo('nonsense')).toBeUndefined()
    expect(tabOfType('nonsense')).toBe('more')
    expect(typesOfTab('threats')).toEqual(['threat'])
  })
})

describe('label dictionary (D6)', () => {
  it('maps the three casings to one label', () => {
    for (const k of [
      'OrgName',
      'authors_or_organization',
      'enforcement_body',
      'assignee',
      'vendor',
    ])
      expect(labelFor(k)).toBe('Issued by')
    expect(labelFor('initial_publication_date')).toBe('Published')
    expect(labelFor('last_update_date')).toBe('Updated')
    expect(labelFor('EndYear')).toBe('Deadline')
  })
  it('puts any other key in sentence case', () => {
    expect(labelFor('hybridKem')).toBe('Hybrid kem')
    expect(labelFor('key_size_bits')).toBe('Key size bits')
  })
  it('names countries', () => {
    expect(countryName('IL')).toBe('Israel')
    expect(countryName('PQC-REGION-EU')).toBe('European Union')
    expect(countryName('US')).toBe('United States')
    expect(countryName('United States')).toBe('United States')
  })
})
