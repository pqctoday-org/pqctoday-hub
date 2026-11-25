// SPDX-License-Identifier: AGPL-3.0-only
// Guards against duplicate glossary terms shipping again — the glossary once
// carried 11 duplicated term names with conflicting definitions (including
// three different CBOM entries and two SBOM entries).
import { describe, it, expect } from 'vitest'
import { glossaryTerms } from './glossaryData'
import algorithms from './glossary/algorithms.json'
import protocols from './glossary/protocols.json'
import standards from './glossary/standards.json'
import concepts from './glossary/concepts.json'
import organizations from './glossary/organizations.json'
import pkcs11 from './glossary/pkcs11.json'
import glossaryIdsSnapshot from './glossary/glossaryIds.snapshot.json'
import { loadCuriousGlossary, loadGlossaryTermById } from './glossary'
import curiousBeforeFold from './__golden__/curiousGlossary.beforeFold.golden.json'

const rawTerms = [...algorithms, ...protocols, ...standards, ...concepts, ...organizations] as {
  id: string
  term: string
}[]
const allRawTerms = [...rawTerms, ...pkcs11] as { id: string; term: string }[]

describe('glossary term uniqueness', () => {
  it('gives every glossary term a unique lowercase kebab-case id', () => {
    const ids = allRawTerms.map((term) => term.id)
    expect(ids.every((id) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(id))).toBe(true)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('keeps frozen glossary ids so renamed terms retain their identity', () => {
    const currentIds = new Set(allRawTerms.map((term) => term.id))
    const missingIds = glossaryIdsSnapshot.filter((id) => !currentIds.has(id))
    expect(
      missingIds,
      'Glossary ids are permanent. Do not change or remove an existing id; to add a new glossary id, add it to glossaryIds.snapshot.json.'
    ).toEqual([])
  })

  it('looks up a loaded glossary term by its permanent id', async () => {
    await expect(loadGlossaryTermById('ml-kem')).resolves.toMatchObject({
      id: 'ml-kem',
      term: 'ML-KEM',
    })
    await expect(loadGlossaryTermById('not-a-glossary-id')).resolves.toBeUndefined()
  })

  it('source JSON files contain no duplicate term names (case-insensitive)', () => {
    const counts = new Map<string, number>()
    for (const t of rawTerms) {
      const key = t.term.trim().toLowerCase()
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    const duplicates = [...counts.entries()].filter(([, n]) => n > 1).map(([k]) => k)
    expect(duplicates).toEqual([])
  })

  it('exported glossaryTerms has no duplicates (guard holds even if JSON regresses)', () => {
    const keys = glossaryTerms.map((t) => t.term.trim().toLowerCase())
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('CBOM appears exactly once, with the authoritative CycloneDX-style definition', () => {
    const cbom = glossaryTerms.filter((t) => t.term.toLowerCase() === 'cbom')
    expect(cbom).toHaveLength(1)
    expect(cbom[0].definition).toMatch(/Cryptography Bill of Materials/i)
    expect(cbom[0].definition).toMatch(/cryptographic/i)
  })

  it('SBOM appears exactly once, with the NTIA-style definition', () => {
    const sbom = glossaryTerms.filter((t) => t.term.toLowerCase() === 'sbom')
    expect(sbom).toHaveLength(1)
    expect(sbom[0].definition).toMatch(/Software Bill of Materials/i)
    expect(sbom[0].definition).toMatch(/supply-chain relationships/i)
  })
})

describe('Curious Explorer definitions are stored once, on the main terms', () => {
  it('shows every plain-language definition exactly as before they were folded into the main terms', async () => {
    const now = await loadCuriousGlossary()
    // the same 23 names, each with the same text, character for character
    expect(Object.keys(now).sort()).toEqual(Object.keys(curiousBeforeFold).sort())
    for (const [name, text] of Object.entries(curiousBeforeFold)) {
      expect(now[name], name).toBe(text)
    }
  })

  it('has no separate Curious file left to drift from the main terms', () => {
    expect(Object.keys(import.meta.glob('./glossary/curious.json'))).toEqual([])
  })

  it('keeps a plain definition only on a term that exists once, and an acronym wording only with an acronym', () => {
    for (const term of rawTerms as {
      id: string
      acronym?: string
      plainDefinition?: string
      plainDefinitionAcronym?: string
    }[]) {
      if (term.plainDefinitionAcronym) {
        expect(term.acronym, `${term.id} has an acronym wording but no acronym`).toBeTruthy()
        expect(term.plainDefinition, `${term.id} needs its name wording too`).toBeTruthy()
      }
    }
  })

  it('gives the five Curious-only terms a permanent id in the ids snapshot', () => {
    for (const id of [
      'classical-cryptography',
      'digital-signatures',
      'hash-based',
      'lattice-based',
      'quantum-computer',
    ]) {
      expect(glossaryIdsSnapshot, id).toContain(id)
      expect(
        rawTerms.some((term) => term.id === id),
        id
      ).toBe(true)
    }
  })
})
