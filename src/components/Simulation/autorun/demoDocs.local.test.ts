// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { DEMO_DOCS_BY_SECTOR } from './demoDocs'

describe('generated sample CBOM scope', () => {
  for (const [sector, docs] of Object.entries(DEMO_DOCS_BY_SECTOR)) {
    it(`labels the ${sector} summary as fictional Markdown, not discovery or schema export`, () => {
      const doc = docs['crypto-cbom']!
      expect(doc.title).toBe('Illustrative CBOM summary')
      expect(doc.data).toContain('no discovery')
      expect(doc.data).toContain('not a machine-readable CycloneDX export')
      expect(doc.data).toContain('Illustrative scenario totals')
      expect(doc.data).not.toContain('Generated against')
    })
  }
})

describe('generated sample migration roadmap', () => {
  for (const [sector, docs] of Object.entries(DEMO_DOCS_BY_SECTOR)) {
    const doc = docs['migration-roadmap']
    if (!doc || doc.data.includes('No private-bank regulatory obligation is inferred')) continue
    it(`names the ${sector} external dates as milestones selected for the plan, not regulatory deadlines`, () => {
      expect(doc.data).toContain('## External Milestones Selected For This Plan')
      expect(doc.data).not.toContain('## External Regulatory Deadlines')
    })
  }
})
