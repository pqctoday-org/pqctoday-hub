// SPDX-License-Identifier: GPL-3.0-only
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

const rawTerms = [...algorithms, ...protocols, ...standards, ...concepts, ...organizations] as {
  term: string
}[]

describe('glossary term uniqueness', () => {
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
