// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Claims-lineage, analysis/negative as-of-date, and leak-free tests for CustodyGovernance (LM-086).
 */
import { describe, it, expect } from 'vitest'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'
import { ANALYSIS_CLAIMS, SOURCE_CLAIMS } from './data/sourceClaims'
import { content } from './content'

const SOURCES = import.meta.glob(
  ['./components/*.tsx', './workshop/*.tsx', './data/*.ts', '!./data/sourceClaims.ts'],
  { query: '?raw', import: 'default', eager: true }
) as Record<string, string>

const CLAIM_ID = /['"](DA-\d+\.\d+[a-z0-9-]*)['"]/g

describe('CustodyGovernance source claims & analysis lineage', () => {
  it('keys each primary-source claim by its own id and cites a single Library document declared in content.standards', () => {
    const declared = new Set(content.standards.map((s) => s.id))
    for (const [key, claim] of Object.entries(SOURCE_CLAIMS)) {
      expect(claim.id, key).toBe(key)
      expect(() => getStandard(claim.sourceId), key).not.toThrow()
      expect(declared.has(claim.sourceId), `${key} -> ${claim.sourceId}`).toBe(true)
      expect(claim.text.length, key).toBeGreaterThan(20)
      expect(claim.edition.length, key).toBeGreaterThan(5)
      expect(claim.locator.length, key).toBeGreaterThan(3)
    }
  })

  it('requires every ANALYSIS and NEGATIVE row to carry premiseIds, Rule G1 authority text, and an ISO as-of date', () => {
    for (const [key, entry] of Object.entries(ANALYSIS_CLAIMS)) {
      expect(entry.id, key).toBe(key)
      expect(['ANALYSIS', 'NEGATIVE']).toContain(entry.kind)
      expect(entry.premiseIds.length, key).toBeGreaterThan(0)
      expect(entry.g1Authorities.length, key).toBeGreaterThan(20)
      expect(entry.asOfDate, key).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('cites every SOURCE_CLAIMS and ANALYSIS_CLAIMS id somewhere in the lesson, workshop, or data files (zero unused claims)', () => {
    const used = new Set<string>()
    for (const text of Object.values(SOURCES)) {
      for (const m of text.matchAll(CLAIM_ID)) used.add(m[1])
    }
    for (const id of Object.keys(SOURCE_CLAIMS)) {
      expect(used.has(id), `Unused claim in SOURCE_CLAIMS: ${id}`).toBe(true)
    }
    for (const id of Object.keys(ANALYSIS_CLAIMS)) {
      expect(used.has(id), `Unused claim in ANALYSIS_CLAIMS: ${id}`).toBe(true)
    }
  })

  it('refers only to claim ids that exist in SOURCE_CLAIMS or ANALYSIS_CLAIMS (zero unknown ids)', () => {
    const validIds = new Set([...Object.keys(SOURCE_CLAIMS), ...Object.keys(ANALYSIS_CLAIMS)])
    for (const [file, text] of Object.entries(SOURCES)) {
      for (const m of text.matchAll(CLAIM_ID)) {
        expect(validIds.has(m[1]), `${file}: unknown claim ${m[1]}`).toBe(true)
      }
    }
  })

  it('carries no internal pipeline, repo, script, or model names in public claims', () => {
    const forbidden =
      /(?:\bclaim[_-]?ledger\b|tightening|local-evidence|pipeline|codex|gemini|claude|carbon|xcheck|dispositions-v)/i
    for (const [key, claim] of Object.entries(SOURCE_CLAIMS)) {
      expect(claim.text, key).not.toMatch(/^OPTIONAL/)
      expect(claim.text, key).not.toMatch(forbidden)
    }
    for (const [key, entry] of Object.entries(ANALYSIS_CLAIMS)) {
      expect(entry.text, key).not.toMatch(forbidden)
      expect(entry.g1Authorities, key).not.toMatch(forbidden)
    }
  })

  it('declares valid algorithm entries in content.algorithms', () => {
    expect(content.algorithms.length).toBeGreaterThan(0)
    for (const alg of content.algorithms) {
      expect(getAlgorithm(alg.name)).toBeDefined()
    }
  })
})
