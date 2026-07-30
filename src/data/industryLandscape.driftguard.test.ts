// SPDX-License-Identifier: GPL-3.0-only
//
// Driftguards for the industry-landscape source. These pin the cross-source
// contracts the Industry Landscape tab depends on:
//   - industries ⊆ the threats-source vocabulary (shared filters/deep links)
//   - protocols ⊆ pqcProtocolMatrix row ids (Protocol Support deep links)
//   - mechanisms ⊆ cryptoMechanisms families, whose members ⊆ ALGORITHM_REGISTRY
//   - standards library_ref resolves to a live Library catalog row (Library links)
//   - icons ⊆ the landscapeIcons allowlist
// A failure here means a CSV refresh or vocabulary change broke a seam, not a bug
// in this file.

import { describe, expect, it } from 'vitest'
import { loadIndustryLandscape, getLandscapeIndustries } from './industryLandscapeData'
import { CRYPTO_MECHANISMS, isKnownMechanism } from './cryptoMechanisms'
import { ALGORITHM_REGISTRY } from './algorithmProperties'
import { PROTOCOL_MATRIX } from './pqcProtocolMatrix'
import { threatsData } from './threatsData'
import { libraryData } from './libraryData'
import { INDUSTRY_ICONS, USE_CASE_ICONS } from '../components/Algorithms/landscapeIcons'
import { MANIFEST_BY_ID } from '../components/PKILearning/manifest/registry'

const { useCases, standards, marketSizes } = loadIndustryLandscape()

/** Industries with no official-statistics market figure, by design:
 *  Cross-Industry (not an industry), Hardware Security Modules (product
 *  segment — only analyst estimates exist), IoT (verified 2026-07-29: no
 *  official source publishes a market size). Insurance was exempt for one
 *  revision (its threats evidence was audit-rejected) and was re-grounded on
 *  Munich Re's 2025 cyber-trends report + BEA value added on 2026-07-29. */
const MARKET_SIZE_EXEMPT = new Set([
  'Cross-Industry',
  'Hardware Security Modules',
  'Internet of Things (IoT)',
])

describe('industry-landscape driftguards', () => {
  it('loads all three CSV families', () => {
    expect(useCases.length).toBeGreaterThan(50)
    expect(standards.length).toBeGreaterThan(20)
    expect(marketSizes.length).toBeGreaterThan(15)
  })

  it('every industry exists in the threats-source vocabulary', () => {
    const threatIndustries = new Set(threatsData.map((t) => t.industry))
    // 'Cross-Industry' aside (threats keeps it too), each landscape industry
    // must match a canonical threats label so /threats deep links resolve.
    for (const ind of getLandscapeIndustries()) {
      expect(threatIndustries, `industry "${ind}" missing from threats vocabulary`).toContain(ind)
    }
  })

  it('every protocol id exists in the protocol matrix', () => {
    const ids = new Set(PROTOCOL_MATRIX.map((p) => p.id))
    for (const uc of useCases) {
      for (const p of uc.protocols) {
        expect(ids, `${uc.useCaseId}: unknown protocol "${p}"`).toContain(p)
      }
    }
  })

  it('every mechanism resolves through the cryptoMechanisms vocabulary', () => {
    for (const uc of useCases) {
      for (const m of [...uc.classicalMechanisms, ...uc.pqcMechanisms]) {
        expect(isKnownMechanism(m), `${uc.useCaseId}: unknown mechanism "${m}"`).toBe(true)
      }
    }
    for (const s of standards) {
      for (const m of s.mechanismsReferenced) {
        expect(isKnownMechanism(m), `${s.standardId}: unknown mechanism "${m}"`).toBe(true)
      }
    }
  })

  it('mechanism families only reference real ALGORITHM_REGISTRY members', () => {
    // AES/SHA are symmetric — ALGORITHM_REGISTRY is asymmetric-only by design
    // (it backs the Detailed Comparison tab), so they're the only families
    // allowed an empty registryMembers list (see cryptoMechanisms.ts interface doc).
    const SYMMETRIC_EXEMPT = new Set(['AES', 'SHA'])
    for (const fam of CRYPTO_MECHANISMS) {
      for (const member of fam.registryMembers) {
        expect(
          ALGORITHM_REGISTRY[member],
          `${fam.family}: member "${String(member)}" missing from ALGORITHM_REGISTRY`
        ).toBeDefined()
      }
      if (!SYMMETRIC_EXEMPT.has(fam.family)) {
        expect(fam.registryMembers.length).toBeGreaterThan(0)
      }
    }
  })

  it('classical/pqc mechanism columns agree with the vocabulary classical flag', () => {
    for (const uc of useCases) {
      for (const m of uc.classicalMechanisms) {
        expect(
          CRYPTO_MECHANISMS.find((f) => f.family === m)?.classical,
          `${uc.useCaseId}: "${m}" listed as classical`
        ).toBe(true)
      }
      for (const m of uc.pqcMechanisms) {
        expect(
          CRYPTO_MECHANISMS.find((f) => f.family === m)?.classical,
          `${uc.useCaseId}: "${m}" listed as PQC`
        ).toBe(false)
      }
    }
  })

  it('every standards row names at least one specific mechanism', () => {
    // Design rule (user decision 2026-07-29): the standards column exists to
    // show which SPECIFIC crypto mechanisms a technical standard references —
    // governance/process frameworks that name none (HIPAA, FERPA, WCO SAFE,
    // IMO circular, NAIC 668, UNECE R155...) live in the Library only, never
    // as a standards row. Each row's mechanisms were verified against the
    // cached document text (grep of the library evidence, 2026-07-29).
    for (const s of standards) {
      expect(
        s.mechanismsReferenced.length,
        `${s.standardId}: standards rows must reference >=1 specific mechanism`
      ).toBeGreaterThan(0)
    }
  })

  it('every standards row has a resolvable library_ref (hard FK)', () => {
    const refs = new Set(libraryData.map((d) => d.referenceId))
    for (const s of standards) {
      expect(s.libraryRef, `${s.standardId}: empty library_ref`).not.toBe('')
      expect(refs, `${s.standardId}: library_ref "${s.libraryRef}" not in Library`).toContain(
        s.libraryRef
      )
    }
  })

  it('related_standards and use_case_ids are mutually resolvable', () => {
    const stdIds = new Set(standards.map((s) => s.standardId))
    const ucIds = new Set(useCases.map((u) => u.useCaseId))
    for (const uc of useCases) {
      for (const rel of uc.relatedStandards) {
        expect(stdIds, `${uc.useCaseId}: related standard "${rel}" has no row`).toContain(rel)
      }
    }
    for (const s of standards) {
      for (const u of s.useCaseIds) {
        expect(ucIds, `${s.standardId}: use case "${u}" has no row`).toContain(u)
      }
    }
  })

  it('use-case ids are unique', () => {
    const ids = useCases.map((u) => u.useCaseId)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('icons are allowlisted', () => {
    for (const uc of useCases) {
      expect(
        USE_CASE_ICONS[uc.useCaseIcon],
        `${uc.useCaseId}: icon "${uc.useCaseIcon}" not in USE_CASE_ICONS`
      ).toBeDefined()
    }
    for (const ind of getLandscapeIndustries()) {
      expect(INDUSTRY_ICONS[ind], `industry "${ind}" has no icon`).toBeDefined()
    }
  })

  it('market sizes cover every non-exempt industry, with sane values', () => {
    const byIndustry = new Map(marketSizes.map((m) => [m.industry, m]))
    for (const ind of getLandscapeIndustries()) {
      if (MARKET_SIZE_EXEMPT.has(ind)) continue
      const m = byIndustry.get(ind)
      expect(m, `industry "${ind}" has no market-size row`).toBeDefined()
      expect(m!.marketSizeUsd).toBeGreaterThan(1e9)
      expect(['global', 'US', 'EU']).toContain(m!.regionScope)
      expect(m!.sourceUrl).toMatch(/^https:\/\//)
      expect(m!.trustedSourceId).not.toBe('')
    }
    const landscapeIndustries = new Set(getLandscapeIndustries())
    for (const m of marketSizes) {
      expect(landscapeIndustries, `market row for unknown industry "${m.industry}"`).toContain(
        m.industry
      )
    }
  })

  it('learn_module_id, when set, resolves to a real Learn module', () => {
    // Consistency check requested 2026-07-29: Industry Landscape must not
    // silently drift from the Learn feature's "Industries" track. Every
    // non-empty learnModuleId must be a real ModuleManifest.id; a missing
    // link is a reportable content gap (see gap report), not a test failure —
    // so this only checks the values that ARE set, never requires coverage.
    for (const uc of useCases) {
      if (!uc.learnModuleId) continue
      expect(
        MANIFEST_BY_ID[uc.learnModuleId],
        `${uc.useCaseId}: learn_module_id "${uc.learnModuleId}" is not a real Learn module id`
      ).toBeDefined()
    }
    // All rows for the same industry must agree on the same module id — the
    // field is industry-level, repeated per use-case row; a mismatch means a
    // stale row was edited without updating its siblings.
    const byIndustry = new Map<string, Set<string>>()
    for (const uc of useCases) {
      const set = byIndustry.get(uc.industry) ?? new Set<string>()
      set.add(uc.learnModuleId)
      byIndustry.set(uc.industry, set)
    }
    for (const [industry, ids] of byIndustry) {
      expect(
        ids.size,
        `industry "${industry}" has inconsistent learn_module_id values: ${[...ids]}`
      ).toBe(1)
    }
  })

  it('every use case carries a citation', () => {
    for (const uc of useCases) {
      expect(uc.sourceUrl, `${uc.useCaseId}: no source_url`).toMatch(/^https?:\/\//)
      expect(uc.trustedSourceId, `${uc.useCaseId}: no trusted_source_id`).not.toBe('')
    }
  })
})
