// SPDX-License-Identifier: GPL-3.0-only
//
// Driftguards for the industry-landscape source. These pin the cross-source
// contracts the Industry Landscape tab depends on:
//   - industries ⊆ the threats-source vocabulary (shared filters/deep links)
//   - protocols ⊆ pqcProtocolMatrix row ids (Protocol Support deep links)
//   - mechanisms ⊆ cryptoMechanisms families, whose members ⊆ ALGORITHM_REGISTRY
//   - standards library_ref resolves to a live Library catalog row (Library links)
//   - playground_tools ⊆ WORKSHOP_TOOLS ids (Crypto Lab deep links)
//   - every industry resolves to a sector code (Library/Compliance deep links)
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
import { WORKSHOP_TOOLS } from '../components/Playground/workshopRegistry'
import { resolveToNaicsSet } from './sectorVocabularyData'

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

  it('every playground_tools id resolves to a real Crypto Lab tool', () => {
    // Hard FK, same shape as the learn_module_id guard above: the tile renders
    // `/playground/<id>`, so an id the registry doesn't know is a dead link.
    // WORKSHOP_TOOLS includes the generated `sbx-*` sandbox scenarios, so a
    // renamed or retired scenario fails here rather than 404ing in the UI.
    const ids = new Set(WORKSHOP_TOOLS.map((t) => t.id))
    for (const uc of useCases) {
      for (const id of uc.playgroundTools) {
        expect(ids, `${uc.useCaseId}: unknown playground tool "${id}"`).toContain(id)
      }
      expect(
        new Set(uc.playgroundTools).size,
        `${uc.useCaseId}: duplicate playground tool ids`
      ).toBe(uc.playgroundTools.length)
    }
  })

  it('at least one use case per industry offers a playground tool', () => {
    // Deliberately per-INDUSTRY, not per-use-case. An individual use case with
    // no honest tool match is a legitimate empty cell (energy-nuclear today);
    // a whole industry with none means the tile's "Try it" row never renders,
    // which is a content gap worth failing on.
    const byIndustry = new Map<string, number>()
    for (const uc of useCases) {
      byIndustry.set(uc.industry, (byIndustry.get(uc.industry) ?? 0) + uc.playgroundTools.length)
    }
    for (const [industry, n] of byIndustry) {
      expect(n, `industry "${industry}" has no playground tools on any use case`).toBeGreaterThan(0)
    }
  })

  it('every mechanism_refs id resolves to an ACTIVE library row', () => {
    // Hard FK, same rule as the standards CSV's library_ref: the column exists
    // to prove a row's mechanism claims, so a ref pointing at a missing or
    // deprecated document proves nothing. Empty is legitimate and reported
    // separately (see the coverage test below), never failed here.
    const active = new Set(libraryData.map((d) => d.referenceId))
    for (const uc of useCases) {
      for (const ref of uc.mechanismRefs) {
        expect(
          active,
          `${uc.useCaseId}: mechanism_ref "${ref}" is not an active library row`
        ).toContain(ref)
      }
    }
  })

  it('a row claiming mechanisms carries at least one proof ref, or is a known gap', () => {
    // Ratchet, not a coverage mandate. 2026-08-14 baseline: 73 of the 74 rows
    // that claim a mechanism carry a ref. The number may only go UP — this
    // fails if a refresh drops proof links, which is the regression that
    // matters. Raise the floor as the remaining gaps close; do not lower it.
    //
    // The one holdout is aero-atc-datalink (RSA). ACARS message security is
    // specified in ARINC 823, and both it and ARINC 811 are sold through SAE —
    // paywalled, so unusable as a citation a reader could follow. The one
    // open-access alternative found, "Economy Class Crypto" (Smith et al.,
    // FC 2018), is about weak SYMMETRIC ciphers in ACARS traffic and contains
    // no RSA, ECDSA or ECDH at all, so it proves nothing about this claim.
    const withClaims = useCases.filter(
      (u) => u.classicalMechanisms.length + u.pqcMechanisms.length > 0
    )
    const withRefs = withClaims.filter((u) => u.mechanismRefs.length > 0)
    expect(
      withRefs.length,
      'mechanism_refs coverage regressed below its baseline'
    ).toBeGreaterThanOrEqual(74)
    // Every row that claims nothing must also cite nothing.
    for (const uc of useCases) {
      if (uc.classicalMechanisms.length + uc.pqcMechanisms.length === 0) {
        expect(uc.mechanismRefs, `${uc.useCaseId}: refs on a row with no mechanisms`).toEqual([])
      }
    }
  })

  it('every standards row points at a use case that exists', () => {
    // use_case_ids is how a use case acquires its standards; a typo here
    // silently leaves the use case looking unstandardised rather than failing.
    const ids = new Set(useCases.map((u) => u.useCaseId))
    for (const s of standards) {
      for (const uc of s.useCaseIds) {
        expect(ids, `standard "${s.standardId}" lists unknown use case "${uc}"`).toContain(uc)
      }
    }
  })

  it('a standards row is scoped to the industry of the use cases it serves', () => {
    // The tab groups standards under an industry heading, so a row whose
    // use_case_ids belong to a different industry renders under the wrong one.
    const industryOf = new Map(useCases.map((u) => [u.useCaseId, u.industry]))
    for (const s of standards) {
      for (const uc of s.useCaseIds) {
        const owner = industryOf.get(uc)
        if (!owner || s.industry === 'Cross-Industry') continue
        expect(owner, `standard "${s.standardId}" (${s.industry}) serves ${uc} (${owner})`).toBe(
          s.industry
        )
      }
    }
  })

  it('standards coverage of use cases does not regress', () => {
    // Ratchet, like mechanism_refs above. 2026-08-13: 70 of 76 use cases have
    // at least one standards row. The six without are honest: aero-atc-datalink,
    // energy-nuclear, hlth-implants and pci-emv are proven by research papers
    // and industry reports, which must NOT become rows in a standards table;
    // gov-procurement and ins-cyber-underwriting claim no mechanism at all.
    const covered = new Set<string>()
    for (const s of standards) for (const uc of s.useCaseIds) covered.add(uc)
    for (const u of useCases) if (u.relatedStandards.length > 0) covered.add(u.useCaseId)
    expect(covered.size, 'industry_standards coverage regressed').toBeGreaterThanOrEqual(70)
  })

  it('every industry resolves to a sector code for the Library/Compliance links', () => {
    // The detail view links unsupported industries at /library?sector=<naics>
    // and the regulatory count at /compliance?ind=<label>; both resolve through
    // sector_vocabulary_*.csv. resolveToNaicsSet is EXACT-match on the
    // lowercased alias and falls back to echoing the input, so a missing alias
    // is silent — it returns the industry name as if it were a NAICS code and
    // the filter matches nothing.
    for (const ind of getLandscapeIndustries()) {
      // 'Cross-Industry' is the absence of a sector, not a sector — the tile
      // renders no sector link for it (see industryCrossRefs.sectorCodesFor).
      if (ind === 'Cross-Industry') continue
      const codes = resolveToNaicsSet(ind)
      expect(codes, `industry "${ind}" has no sector_vocabulary alias`).not.toEqual([ind])
      expect(codes.length, `industry "${ind}" resolved to no sector code`).toBeGreaterThan(0)
    }
  })

  it('every use case carries a citation', () => {
    for (const uc of useCases) {
      expect(uc.sourceUrl, `${uc.useCaseId}: no source_url`).toMatch(/^https?:\/\//)
      expect(uc.trustedSourceId, `${uc.useCaseId}: no trusted_source_id`).not.toBe('')
    }
  })
})
