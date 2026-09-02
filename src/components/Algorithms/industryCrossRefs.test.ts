// SPDX-License-Identifier: GPL-3.0-only
//
// Unit tests for the Industry Landscape cross-reference resolvers. These run
// against the REAL loaded data, not fixtures, wherever the assertion is about a
// seam (sector codes, tool ids) — a fixture would pass while the shipped tile
// rendered a dead link.

import { describe, expect, it } from 'vitest'
import {
  learnModulesForIndustry,
  librarySectorHref,
  regulatoryFor,
  sectorCodesFor,
  standardsForIndustry,
  toolsForIndustry,
  toolsForUseCase,
} from './industryCrossRefs'
import { getLandscapeIndustries, loadIndustryLandscape } from '@/data/industryLandscapeData'
import { isCrossIndustry } from '@/data/industryMatch'
import type { ComplianceFramework } from '@/data/complianceData'

const { useCases, standards } = loadIndustryLandscape()

function makeFramework(o: Partial<ComplianceFramework> = {}): ComplianceFramework {
  return {
    id: 'TEST',
    label: 'Test',
    description: '',
    industries: [],
    countries: [],
    requiresPQC: true,
    pqcRequirement: 'yes',
    deadline: 'Ongoing',
    deadlinePhase: 'ongoing',
    notes: '',
    enforcementBody: 'Test',
    libraryRefs: [],
    timelineRefs: [],
    bodyType: 'compliance_framework',
    ...o,
  }
}

describe('sectorCodesFor', () => {
  it('resolves every landscape industry except Cross-Industry', () => {
    for (const ind of getLandscapeIndustries()) {
      const codes = sectorCodesFor(ind)
      if (isCrossIndustry(ind)) expect(codes).toEqual([])
      else expect(codes.length, `${ind} resolved to no sector code`).toBeGreaterThan(0)
    }
  })

  it('returns [] rather than echoing an unresolved label', () => {
    // resolveToNaicsSet echoes its input on a miss; echoing it into
    // `/library?sector=` would build a filter that matches nothing.
    expect(sectorCodesFor('Not A Real Sector')).toEqual([])
  })

  it('builds a repeatable sector query for multi-code industries', () => {
    // Rail / Transit resolves to both halves of the NAICS 48-49 split.
    expect(sectorCodesFor('Rail / Transit')).toEqual(['48', '49'])
    expect(librarySectorHref('Rail / Transit')).toBe('/library?sector=48&sector=49')
  })

  it('has no library link for Cross-Industry', () => {
    expect(librarySectorHref('Cross-Industry')).toBeNull()
  })
})

describe('learnModulesForIndustry', () => {
  it('resolves a module for the 19 industries that declare one', () => {
    // 2026-08-19: was 20 — Supply Chain / Logistics's learn_module_id was
    // cleared (vendor-risk covers vendor/software supply-chain risk, not the
    // physical maritime/customs/EBL use cases this industry actually lists;
    // no dedicated logistics module exists to relink to instead).
    // 2026-08-29: 19 → 22 — three single-row 'Cross-Industry / X' sub-labels
    // (Web & API TLS, Network & VPN, Code Signing) split out of the bare
    // 'Cross-Industry' bucket so each could honestly carry its own module,
    // without forcing the other, genuinely mixed-topic Cross-Industry rows
    // (PKI, email, OpenPGP, DNSSEC) to share it.
    // 2026-09-01: 22 → 19 — the 3 sub-labels were remapped back to plain
    // 'Cross-Industry' (they sat outside the threats vocabulary and had no
    // market-size row). That reinstates the mixed-topic bucket the 08-29
    // split existed to avoid, so their learn_module_id was cleared to match
    // the industry's other (module-less) rows — the driftguard requires
    // every row sharing an industry to agree on one module id, and
    // 'Cross-Industry' as a whole has no single dedicated module.
    const withModule = getLandscapeIndustries().filter(
      (i) => learnModulesForIndustry(i, useCases).length > 0
    )
    expect(withModule).toHaveLength(19)
  })

  it('returns nothing for the three industries with no module', () => {
    expect(learnModulesForIndustry('Cross-Industry', useCases)).toEqual([])
    expect(learnModulesForIndustry('Media / Entertainment / DRM', useCases)).toEqual([])
    expect(learnModulesForIndustry('Supply Chain / Logistics', useCases)).toEqual([])
  })

  it('de-duplicates the industry-level module across its use-case rows', () => {
    // Healthcare has 4 use-case rows all carrying 'healthcare-pqc'.
    const mods = learnModulesForIndustry('Healthcare / Pharmaceutical', useCases)
    expect(mods).toHaveLength(1)
    expect(mods[0].manifest.id).toBe('healthcare-pqc')
    expect(mods[0].href).toContain('/learn/healthcare-pqc')
  })

  it('routes multi-industry modules at the industry’s own learn path', () => {
    // emv-payment-pqc serves cards, banking and retail; each deep-links at its
    // own path rather than the top of a 110-minute module.
    const banking = learnModulesForIndustry('Finance & Banking', useCases)
    expect(banking[0].href).toContain('path=banking')
  })
})

describe('standardsForIndustry', () => {
  it('groups by standards body, alphabetically', () => {
    const groups = standardsForIndustry('Cross-Industry', standards)
    expect(groups.length).toBeGreaterThan(1)
    expect(groups.map((g) => g.body)).toEqual([...groups.map((g) => g.body)].sort())
  })

  it('does NOT inherit Cross-Industry rows into another industry', () => {
    // Decision 2026-08-13: the gap stays visible — an industry renders its own
    // standards or none, never the Cross-Industry set.
    //
    // This used to assert that Payment Card Industry returned []. That held only
    // because PCI had no rows of its own; the 2026-08-13 standards sweep gave it
    // some, and the test failed while the behaviour it guards was still correct.
    // Assert the rule instead of a row count, so filling a gap cannot break it.
    const crossOnly = standards
      .filter((s) => s.industry === 'Cross-Industry')
      .map((s) => s.standardId)
    for (const industry of new Set(standards.map((s) => s.industry))) {
      if (industry === 'Cross-Industry') continue
      const ids = standardsForIndustry(industry, standards).flatMap((g) =>
        g.standards.map((r) => r.standardId)
      )
      for (const id of ids) {
        expect(crossOnly, `${industry} inherited cross-industry standard ${id}`).not.toContain(id)
      }
    }
    // And an industry with no rows of its own still renders empty.
    expect(standardsForIndustry('No Such Industry', standards)).toEqual([])
  })
})

describe('toolsForUseCase / toolsForIndustry', () => {
  it('resolves every curated id and sorts sandbox scenarios last', () => {
    for (const uc of useCases) {
      const tools = toolsForUseCase(uc)
      expect(tools, `${uc.useCaseId}: an id failed to resolve`).toHaveLength(
        uc.playgroundTools.length
      )
      const firstSandbox = tools.findIndex((t) => t.sandbox)
      if (firstSandbox >= 0) {
        expect(
          tools.slice(firstSandbox).every((t) => t.sandbox),
          `${uc.useCaseId}: a browser tool sorts after a sandbox one`
        ).toBe(true)
      }
    }
  })

  it('returns no tools for the one use case with no honest match', () => {
    const nuclear = useCases.find((u) => u.useCaseId === 'energy-nuclear')!
    expect(toolsForUseCase(nuclear)).toEqual([])
  })

  it('de-duplicates across an industry and records which use cases named a tool', () => {
    const tools = toolsForIndustry('Cross-Industry', useCases)
    const ids = tools.map((t) => t.tool.id)
    expect(new Set(ids).size).toBe(ids.length)
    // sbx-pki is named by cross-pki only (2026-08-29: cross-web-tls, the
    // original example here, moved to its own 'Cross-Industry / Web & API
    // TLS' sub-label — see learnModulesForIndustry's 19→22 test above).
    const pki = tools.find((t) => t.tool.id === 'sbx-pki')!
    expect(pki.useCases.map((u) => u.useCaseId)).toEqual(['cross-pki'])
  })

  it('every industry surfaces at least one tool', () => {
    for (const ind of getLandscapeIndustries()) {
      expect(toolsForIndustry(ind, useCases).length, `${ind} has no tools`).toBeGreaterThan(0)
    }
  })
})

describe('regulatoryFor', () => {
  // Healthcare / Pharmaceutical → NAICS 62.
  const hc = (o: Partial<ComplianceFramework>) => makeFramework({ naicsCodes: ['62'], ...o })

  it('counts only PQC-relevant frameworks', () => {
    const frameworks = [
      hc({ id: 'YES', pqcRequirement: 'yes' }),
      hc({ id: 'EXPECTED', pqcRequirement: 'expected' }),
      hc({ id: 'PARTIAL', pqcRequirement: 'partial' }),
      // guidance and no are real obligations but not post-quantum ones — this
      // count sits beside a crypto mechanism list, so they are out of scope.
      hc({ id: 'GUIDANCE', pqcRequirement: 'guidance' }),
      hc({ id: 'NO', pqcRequirement: 'no' }),
    ]
    expect(regulatoryFor('Healthcare / Pharmaceutical', frameworks).count).toBe(3)
  })

  it('matches on naicsCodes — the same predicate the destination filters with', () => {
    // REGRESSION (2026-08-13): the count first used the applicability engine,
    // whose tier rules need a country signal. With none saved it returned 0 for
    // Healthcare while the register the link opened listed several — a browser
    // probe caught it. Count and destination must share one predicate.
    const frameworks = [
      hc({ id: 'HEALTH' }),
      makeFramework({ id: 'ENERGY', naicsCodes: ['22'] }),
      makeFramework({ id: 'UNTAGGED' }), // no naicsCodes at all
    ]
    expect(regulatoryFor('Healthcare / Pharmaceutical', frameworks).count).toBe(1)
  })

  it('counts a multi-code industry across all of its codes', () => {
    // Rail / Transit → 48 and 49; a row tagged either one is reachable.
    const frameworks = [
      makeFramework({ id: 'T48', naicsCodes: ['48'] }),
      makeFramework({ id: 'T49', naicsCodes: ['49'] }),
      makeFramework({ id: 'FIN', naicsCodes: ['52'] }),
    ]
    expect(regulatoryFor('Rail / Transit', frameworks).count).toBe(2)
  })

  it('is zero for an industry with no sector identity', () => {
    // Cross-Industry resolves to no NAICS code, so there is nothing to filter
    // the register by — counting the whole corpus would be a lie.
    expect(regulatoryFor('Cross-Industry', [hc({ id: 'ANY' })]).count).toBe(0)
  })

  it('carries the same industry and filter into the deep link', () => {
    const { href } = regulatoryFor('Healthcare / Pharmaceutical', [])
    expect(href).toContain('tab=standards')
    expect(href).toContain('ind=Healthcare+%2F+Pharmaceutical')
    // The link must express the same narrowing as the count, or the tile
    // promises 3 and the register shows 197.
    expect(href).toContain('req=yes%2Cexpected%2Cpartial')
  })

  it('agrees with the real corpus, not just fixtures', () => {
    // The number a reader actually sees, against the shipped CSV.
    const { count } = regulatoryFor('Financial Services / Banking')
    expect(count).toBeGreaterThan(0)
  })
})
