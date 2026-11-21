// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Claims-lineage, negative/analysis as-of-date, and leak-free tests for CustodyPqcMigration (LM-085).
 */
import { describe, it, expect } from 'vitest'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'
import { SOURCE_CLAIMS } from './data/sourceClaims'
import { content } from './content'

const SOURCES = import.meta.glob(
  ['./components/*.tsx', './workshop/*.tsx', './data/*.ts', '!./data/sourceClaims.ts'],
  { query: '?raw', import: 'default', eager: true }
) as Record<string, string>

const CLAIM_ID = /['"](DA-\d+\.\d+[a-z0-9-]*)['"]/g

describe('CustodyPqcMigration source claims', () => {
  it('keys each claim by its own id and cites a single Library document declared in content.standards', () => {
    const declared = new Set(content.standards.map((s) => s.id))
    for (const [key, claim] of Object.entries(SOURCE_CLAIMS)) {
      expect(claim.id, key).toBe(key)
      expect(() => getStandard(claim.sourceId), key).not.toThrow()
      expect(declared.has(claim.sourceId), `${key} -> ${claim.sourceId}`).toBe(true)
      expect(claim.text.length, key).toBeGreaterThan(20)
    }
  })

  it('cites every claim somewhere in the lesson, workshop, or data files (zero unused claims)', () => {
    const used = new Set<string>()
    for (const text of Object.values(SOURCES)) {
      for (const m of text.matchAll(CLAIM_ID)) used.add(m[1])
    }
    for (const id of Object.keys(SOURCE_CLAIMS)) {
      expect(used.has(id), `Unused claim in SOURCE_CLAIMS: ${id}`).toBe(true)
    }
  })

  it('refers only to claim ids that exist in SOURCE_CLAIMS (zero unknown ids)', () => {
    for (const [file, text] of Object.entries(SOURCES)) {
      for (const m of text.matchAll(CLAIM_ID)) {
        expect(Object.keys(SOURCE_CLAIMS), `${file}: unknown claim ${m[1]}`).toContain(m[1])
      }
    }
  })

  it('requires an explicit as-of date on every negative or analysis claim row', () => {
    for (const [key, claim] of Object.entries(SOURCE_CLAIMS)) {
      if ('isNegativeOrAnalysis' in claim && claim.isNegativeOrAnalysis) {
        expect(
          'asOfDate' in claim && typeof claim.asOfDate === 'string' && claim.asOfDate.length >= 10,
          key
        ).toBe(true)
      }
    }
  })

  it('carries no reviewer or internal pipeline wording', () => {
    for (const [key, claim] of Object.entries(SOURCE_CLAIMS)) {
      expect(claim.text, key).not.toMatch(/^OPTIONAL/)
      expect(claim.text, key).not.toMatch(
        /(?:\bclaim[_-]?ledger\b|tightening|reviewer|local-evidence|pipeline)/i
      )
    }
  })

  it('declares valid algorithm entries in content.algorithms', () => {
    expect(content.algorithms.length).toBeGreaterThan(0)
    for (const alg of content.algorithms) {
      expect(getAlgorithm(alg.name)).toBeDefined()
    }
  })
})
