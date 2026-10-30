// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Binds every sentence the lesson makes about a document to the Library, and binds the
 * workshop's few computed values to their inputs. An edit that drops a sentence, cites an id
 * that is not a claim, or leaves a claim that no lesson shows fails here.
 */
import { describe, it, expect } from 'vitest'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'
import { SOURCE_CLAIMS } from './data/sourceClaims'
import { content } from './content'
import { STATUS_GROUPS } from './data/statusMapData'
import { SIGNATURE_CHOICES } from './data/provenanceData'
import {
  MAX_KEYS,
  TUF_ROLES,
  attackerCanSign,
  normaliseRole,
  uptaneOutcome,
} from './data/updateFrameworkData'
import { CURRENT_ALGORITHM, NEW_ALGORITHMS, rawRows, rawSum } from './data/transitionData'

const SOURCES = import.meta.glob(
  ['./components/*.tsx', './workshop/*.tsx', './data/*.ts', '!./data/sourceClaims.ts'],
  { query: '?raw', import: 'default', eager: true }
) as Record<string, string>

const CLAIM_ID = /['"](SC-\d+\.\d+[a-z]*n?)['"]/g

describe('source claims', () => {
  it('keys each claim by its own id and cites a Library document the module declares', () => {
    const declared = new Set(content.standards.map((s) => s.id))
    for (const [key, claim] of Object.entries(SOURCE_CLAIMS)) {
      expect(claim.id, key).toBe(key)
      expect(() => getStandard(claim.sourceId), key).not.toThrow()
      expect(declared.has(claim.sourceId), `${key} -> ${claim.sourceId}`).toBe(true)
      expect(claim.text.length, key).toBeGreaterThan(20)
    }
  })

  it('shows every claim somewhere in the lesson, the workshop or the data files', () => {
    const used = new Set<string>()
    for (const text of Object.values(SOURCES)) {
      for (const m of text.matchAll(CLAIM_ID)) used.add(m[1])
    }
    for (const id of Object.keys(SOURCE_CLAIMS)) expect(used.has(id), id).toBe(true)
  })

  it('refers only to claim ids that exist', () => {
    for (const [file, text] of Object.entries(SOURCES)) {
      for (const m of text.matchAll(CLAIM_ID)) {
        expect(Object.keys(SOURCE_CLAIMS), `${file}: ${m[1]}`).toContain(m[1])
      }
    }
  })

  it('carries no reviewer wording in a sentence', () => {
    for (const [key, claim] of Object.entries(SOURCE_CLAIMS)) {
      expect(claim.text, key).not.toMatch(/^OPTIONAL/)
      expect(claim.text, key).not.toMatch(/tightening|ledger|reviewer|local-evidence|pipeline/i)
    }
  })
})

describe('status map and provenance matrix', () => {
  it('gives every status entry a claim', () => {
    for (const g of STATUS_GROUPS)
      for (const r of g.rows)
        for (const e of r.entries) expect(SOURCE_CLAIMS[e.claim], e.claim).toBeDefined()
  })

  it('points every signature cell at an existing claim', () => {
    for (const c of SIGNATURE_CHOICES)
      for (const ids of Object.values(c.cells))
        // eslint-disable-next-line security/detect-object-injection
        for (const id of ids ?? []) expect(SOURCE_CLAIMS[id], `${c.id}: ${id}`).toBeDefined()
  })
})

describe('roles and thresholds', () => {
  it('compares the keys held with the threshold', () => {
    expect(attackerCanSign(1, 2)).toBe(false)
    expect(attackerCanSign(2, 2)).toBe(true)
    expect(attackerCanSign(0, 1)).toBe(false)
    expect(attackerCanSign(1, 1)).toBe(true)
  })

  it('keeps a role between 1 and the maximum keys with a threshold no larger than its keys', () => {
    expect(normaliseRole(9, 9)).toEqual({ keys: MAX_KEYS, threshold: MAX_KEYS })
    expect(normaliseRole(2, 5)).toEqual({ keys: 2, threshold: 2 })
    expect(normaliseRole(0, 0)).toEqual({ keys: 1, threshold: 1 })
    for (const r of TUF_ROLES) expect(r.defaultThreshold).toBeLessThanOrEqual(r.defaultKeys)
  })

  it('places controlling both Uptane repositories outside the stated assumption', () => {
    expect(uptaneOutcome('both', true).insideAssumption).toBe(false)
    expect(uptaneOutcome('director', true).insideAssumption).toBe(true)
    expect(uptaneOutcome('none', false).insideAssumption).toBe(true)
  })
})

describe('transition planner sizes', () => {
  it('takes every size from the algorithm registry', () => {
    for (const a of NEW_ALGORITHMS) {
      const reg = getAlgorithm(a.registryId)
      const [row] = rawRows('replace', a.registryId)
      expect(row.publicKeyBytes, a.registryId).toBe(reg.publicKeyBytes)
      expect(row.signatureBytes, a.registryId).toBe(reg.signatureOrCiphertextBytes)
    }
  })

  it('adds the current algorithm to the new one for a second block and a composite signature', () => {
    const current = getAlgorithm(CURRENT_ALGORITHM)
    const next = getAlgorithm('ML-DSA-65')
    for (const option of ['second-block', 'composite'] as const) {
      const sum = rawSum(rawRows(option, 'ML-DSA-65'))
      expect(sum.publicKeyBytes).toBe((current.publicKeyBytes ?? 0) + (next.publicKeyBytes ?? 0))
      expect(sum.signatureBytes).toBe(
        (current.signatureOrCiphertextBytes ?? 0) + (next.signatureOrCiphertextBytes ?? 0)
      )
    }
  })

  it('uses the registry id of the LMS parameter set the lesson names', () => {
    expect(NEW_ALGORITHMS.some((a) => a.registryId === 'LMS-SHA256 (H20/W8)')).toBe(true)
  })
})
