// SPDX-License-Identifier: GPL-3.0-only
// @vitest-environment node
/**
 * The threats rules generate-rag-corpus.ts applies, on in-memory fixtures —
 * the generator is not run and public/data/rag-corpus.json is not touched.
 */
import { describe, it, expect } from 'vitest'
import {
  buildThreatsPageGuide,
  isUnpublishedThreatRow,
  publishedThreatIds,
  publishedThreatRecords,
  threatDeepLink,
} from './threatsCorpus'
import { validateCorpusDeepLinks } from '../../src/services/search/deepLinkGrammar'

const HEADER = ['industry', 'threat_id', 'threat_description', 'criticality', 'status']
const rows = [
  HEADER,
  ['Finance & Banking', 'FIN-001', 'Settlement data', 'Critical', 'active'],
  ['Critical Infrastructure', 'CI-001', 'Grid telemetry', 'High', 'active'],
  ['Energy / Critical Infrastructure', 'EN-001', 'Pipeline SCADA', 'Medium', 'active'],
  ['Cross-Industry', 'CROS-008', 'Stub', '', 'draft'],
  ['Aerospace / Aviation', 'AERO-008', 'Old row', 'High', 'deprecated'],
  ['Insurance', 'INS-001', 'Underwriting archives', '', 'active'],
]

describe('threats corpus rules', () => {
  it('drops draft, deprecated and obsolete rows', () => {
    expect([...publishedThreatIds(rows)].sort()).toEqual(['CI-001', 'EN-001', 'FIN-001', 'INS-001'])
    expect(isUnpublishedThreatRow(rows, 4)).toBe(true) // draft
    expect(isUnpublishedThreatRow(rows, 5)).toBe(true) // deprecated
    expect(isUnpublishedThreatRow(rows, 1)).toBe(false)
  })

  it('a file with no status column publishes every row', () => {
    expect(
      publishedThreatIds([
        ['industry', 'threat_id'],
        ['X', 'A-1'],
      ])
    ).toEqual(new Set(['A-1']))
  })

  it('links &industry= with the page’s label, not an old raw CSV label', () => {
    expect(threatDeepLink('CI-001', 'Critical Infrastructure')).toBe(
      '/threats?id=CI-001&industry=Critical%20Infrastructure%20%2F%20OT'
    )
    expect(threatDeepLink('EN-001', 'Energy / Critical Infrastructure')).toBe(
      '/threats?id=EN-001&industry=Critical%20Infrastructure%20%2F%20OT'
    )
    expect(threatDeepLink('FIN-001', 'Finance & Banking')).toBe(
      '/threats?id=FIN-001&industry=Finance%20%26%20Banking'
    )
    expect(threatDeepLink(' FIN-001 ')).toBe('/threats?id=FIN-001')
  })

  it('page guide: counts, industries and criticality levels come from the published rows', () => {
    const guide = buildThreatsPageGuide(publishedThreatRecords(rows))
    // 4 published rows; the two critical-infrastructure labels merge → 3 industries.
    expect(guide).toContain('lists 4 quantum threat scenarios across 3 industries')
    expect(guide).toContain('Critical Infrastructure / OT, Finance & Banking, Insurance')
    expect(guide).not.toContain('Aerospace') // deprecated row
    expect(guide).toContain('Criticality levels in use: Critical, High, Medium, Unrated')
    expect(guide).not.toContain('Medium-High')
    expect(guide).not.toMatch(/80\+|20 industries/)
  })

  it('page guide: documents every parameter the page reads, including evidence sort', () => {
    const guide = buildThreatsPageGuide(publishedThreatRecords(rows))
    for (const param of [
      'id',
      'industry',
      'criticality',
      'class',
      'q',
      'sort',
      'dir',
      'mode',
      'tier',
      'view',
    ]) {
      expect(guide).toContain(`?${param}=`)
    }
    expect(guide).toContain('evidence')
  })

  it('every link the page guide and the chunk builder produce passes the deep-link grammar', () => {
    const guide = buildThreatsPageGuide(publishedThreatRecords(rows))
    const guideLinks = [...guide.matchAll(/\/threats\?[^\s),]+/g)].map((m) => m[0])
    expect(guideLinks.length).toBeGreaterThan(0)
    const chunks = [
      ...guideLinks,
      threatDeepLink('CI-001', 'Critical Infrastructure'),
      threatDeepLink('FIN-001'),
    ].map((deepLink, i) => ({ id: `c${i}`, source: 'threats', deepLink }))
    expect(validateCorpusDeepLinks(chunks)).toEqual([])
  })
})
