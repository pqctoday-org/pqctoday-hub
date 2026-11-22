// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection -- keys are ids from the module data files */
/**
 * Binds every sentence the lesson makes about a document to the Library, keeps the lesson's own
 * wording to signposts, and binds the workshop's size table to the algorithm registry. An edit
 * that drops a sentence, cites an id that is not a claim, or leaves a claim that no lesson shows
 * fails here.
 */
import { describe, it, expect } from 'vitest'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'
import { SOURCE_CLAIMS } from './data/sourceClaims'
import { LESSON_OUTLINE } from './data/lessonOutline'
import {
  COMPARATOR_NAMES,
  DSA_PARAMETER_SETS,
  KEM_PARAMETER_SETS,
  SIZE_CLAIM,
  contextOption,
  isCarriableContext,
  sizeRows,
} from './data/workshopData'
import { content } from './content'
import manifest from './manifest'

const SOURCES = import.meta.glob(
  ['./components/*.tsx', './workshop/*.tsx', './data/*.ts', '!./data/sourceClaims.ts'],
  { query: '?raw', import: 'default', eager: true }
) as Record<string, string>

const CLAIM_ID = /['"](ALG-[A-Z]\d+)['"]/g

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

  it('declares only documents that a claim rests on', () => {
    const cited = new Set<string>(Object.values(SOURCE_CLAIMS).map((c) => c.sourceId))
    for (const s of content.standards) expect(cited.has(s.id), s.id).toBe(true)
  })

  it('shows every claim somewhere in the lesson or the workshop', () => {
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

describe('lesson outline', () => {
  it('shows every claim in the Learn tab, in a block', () => {
    const shown = new Set(LESSON_OUTLINE.flatMap((s) => s.blocks.flatMap((b) => b.claims)))
    for (const id of Object.keys(SOURCE_CLAIMS)) expect(shown.has(id as never), id).toBe(true)
    for (const id of shown) expect(SOURCE_CLAIMS[id], id).toBeDefined()
  })

  it('has one section per manifest Learn section, in order', () => {
    expect(LESSON_OUTLINE.map((s) => s.id)).toEqual(manifest.learnSections?.map((s) => s.id))
    expect(LESSON_OUTLINE.map((s) => s.title)).toEqual(manifest.learnSections?.map((s) => s.label))
  })

  it('gives every block a heading, a known panel and at least one claim', () => {
    for (const s of LESSON_OUTLINE)
      for (const b of s.blocks) {
        expect(b.heading.length, `${s.id}`).toBeGreaterThan(0)
        expect(['none', 'developers', 'validation'], b.heading).toContain(b.panel)
        expect(b.claims.length, b.heading).toBeGreaterThan(0)
      }
  })

  it('points every go-deeper link at a module route', () => {
    for (const s of LESSON_OUTLINE)
      for (const g of s.goDeeper) expect(g.to, g.label).toMatch(/^\/learn\/[a-z0-9-]+$/)
  })

  // Leads and bridges only point at what follows. A figure, a standard number or a document
  // name belongs in a claim, where it carries its source. The product names "CNSA 2.0" and
  // "TLS 1.3" are the only digits a signpost may hold.
  it('keeps every lead and bridge free of figures and standard numbers', () => {
    const NAMED = /CNSA 2\.0|TLS 1\.3/g
    for (const s of LESSON_OUTLINE) {
      const signposts = [s.lead, ...s.blocks.map((b) => b.bridge)].filter(Boolean)
      for (const text of signposts) {
        const bare = text.replace(NAMED, '')
        expect(bare, text).not.toMatch(/\d/)
        expect(bare, text).not.toMatch(/FIPS|RFC|SP 800/)
      }
    }
  })
})

describe('size comparator', () => {
  it('takes every number from the algorithm registry', () => {
    const rows = sizeRows()
    expect(rows.map((r) => r.name)).toEqual([...COMPARATOR_NAMES])
    for (const r of rows) {
      const reg = getAlgorithm(r.name)
      expect(r.publicKeyBytes, r.name).toBe(reg.publicKeyBytes)
      expect(r.privateKeyBytes, r.name).toBe(reg.privateKeyBytes)
      expect(r.signatureOrCiphertextBytes, r.name).toBe(reg.signatureOrCiphertextBytes)
    }
  })

  it('covers the three ML-KEM and three ML-DSA sets and a classical RSA and ECC entry', () => {
    for (const n of [...KEM_PARAMETER_SETS, ...DSA_PARAMETER_SETS])
      expect(COMPARATOR_NAMES).toContain(n)
    expect(COMPARATOR_NAMES.some((n) => n.startsWith('RSA'))).toBe(true)
    expect(COMPARATOR_NAMES.some((n) => n.startsWith('ECDSA'))).toBe(true)
  })

  it('agrees with the sentence that states each ML-KEM and ML-DSA row', () => {
    for (const r of sizeRows()) {
      if (!r.claim) continue
      expect(SIZE_CLAIM[r.name], r.name).toBe(r.claim)
      const text = SOURCE_CLAIMS[r.claim].text
      for (const n of [r.publicKeyBytes, r.privateKeyBytes, r.signatureOrCiphertextBytes]) {
        expect(text, `${r.name}: ${n}`).toContain(String(n))
      }
    }
  })

  it('makes no statement about speed', () => {
    for (const [file, text] of Object.entries(SOURCES)) {
      if (!file.includes('SizeComparator')) continue
      expect(text, file).not.toMatch(/\b(faster|slower|speed|performance|milliseconds)\b/i)
    }
  })
})

describe('workshop command lines', () => {
  it('builds context options that survive the service tokenizer', () => {
    expect(contextOption('')).toBe('')
    expect(contextOption('abc')).toBe(' -pkeyopt context-string:abc')
    expect(contextOption('two words')).toBe(' -pkeyopt "context-string:two words"')
  })

  it('refuses a context string the command line cannot carry', () => {
    expect(isCarriableContext('plain text 1')).toBe(true)
    expect(isCarriableContext('has"quote')).toBe(false)
    expect(isCarriableContext('back\\slash')).toBe(false)
    expect(isCarriableContext('tab\there')).toBe(false)
  })
})
