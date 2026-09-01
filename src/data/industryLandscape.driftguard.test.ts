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
import {
  loadIndustryLandscape,
  getLandscapeIndustries,
  getIndustryCertificationSummary,
  EVIDENCE_TYPES,
  PQC_CLAIM_BASES,
} from './industryLandscapeData'
import { evidenceLabelFor, unlabelledEvidenceTypes } from '../components/Algorithms/evidenceLabels'
import { CRYPTO_MECHANISMS, isKnownMechanism, CYCLONEDX_REGISTRY } from './cryptoMechanisms'
import { ALGORITHM_FAMILIES, REGISTRY_LAST_UPDATED } from './cyclonedxCryptoRegistry'
import { ALGORITHM_REGISTRY } from './algorithmProperties'
import { PROTOCOL_MATRIX, DRAFT_STAGE_LEVEL } from './pqcProtocolMatrix'
import { threatsData } from './threatsData'
import { libraryData } from './libraryData'
import { softwareData } from './migrateData'
import { INDUSTRY_ICONS, USE_CASE_ICONS } from '../components/Algorithms/landscapeIcons'
import { MANIFEST_BY_ID } from '../components/PKILearning/manifest/registry'
import { WORKSHOP_TOOLS } from '../components/Playground/workshopRegistry'
import { resolveToNaicsSet } from './sectorVocabularyData'
import { isCrossIndustry } from './industryMatch'

const { useCases, standards, marketSizes } = loadIndustryLandscape()
const rowByIdForTargets = new Map(PROTOCOL_MATRIX.map((r) => [r.id, r]))

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

/** Mechanism for industries a freshness pass deprecates because their
 *  market-size row cites a pre-2024 figure with no compliant successor from
 *  the SAME publisher/account — as opposed to MARKET_SIZE_EXEMPT, where no
 *  official-statistics concept exists at all. All three industries the
 *  2026-08-17 pass first put here (Education / Research, Healthcare /
 *  Pharmaceutical, Water / Wastewater) were reinstated the same day on a
 *  second, deeper look — in each case the GLOBAL total genuinely had no
 *  successor, but a different US federal agency (Census's Annual Survey of
 *  School System Finances for Education; US CMS NHE for Healthcare;
 *  Census's raw FY2024 "Individual Unit Files" public-use data, one level
 *  deeper than the missing quinquennial summary spreadsheet, for Water)
 *  published a real ≥2024 US-scoped figure. Same US-narrowing pattern as
 *  Cloud/IT/Media/Telecom elsewhere in this file. Kept as an empty set
 *  (not deleted) so the next freshness pass has the mechanism ready — move
 *  an industry back to an active row (not into MARKET_SIZE_EXEMPT) the
 *  moment a qualifying figure appears; only reach for MARKET_SIZE_EXEMPT if
 *  a future check concludes no official-statistics concept exists at all. */
const MARKET_SIZE_STALE_PENDING_REFRESH = new Set<string>([])

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
    // 'Cross-Industry / X' sub-labels are exempt the same way: they're not
    // real industries in the threats taxonomy either, and every row carrying
    // one today has a populated source_library_ref, so it never falls through
    // to the /threats?industry= link this guard is protecting.
    for (const ind of getLandscapeIndustries()) {
      if (isCrossIndustry(ind)) continue
      expect(threatIndustries, `industry "${ind}" missing from threats vocabulary`).toContain(ind)
    }
  })

  it('every PQC claim is reachable through a target protocol (WS3a)', () => {
    // THE consistency check, and note carefully what it does NOT ask.
    //
    // The first design asked "is migration_status=none while a linked protocol
    // is RFC-published?" — run against real data it flagged 16 of 76 rows and
    // every one was correct as written: x509 HAS published PQC RFCs, and
    // avionics genuinely has not adopted them. That rule conflated STANDARDS
    // PROGRESS with SECTOR ADOPTION, which are different facts.
    //
    // This asks a question that is objectively true or false instead: does the
    // claimed algorithm have ANY path through the protocols this row migrates
    // to? A KEM claim needs a target with a KEM dimension; a signature claim
    // needs one with a signature dimension. It found 2 real defects
    // (cloud-backup, fin-archives — ML-KEM claimed while naming only TLS 1.2,
    // which the matrix documents as having no PQC track at all) and 0 false
    // positives.
    const KEM_FAMILIES = new Set(['ML-KEM', 'HQC', 'FrodoKEM', 'Classic-McEliece'])
    const SIG_FAMILIES = new Set(['ML-DSA', 'SLH-DSA', 'FN-DSA', 'LMS', 'XMSS'])
    const rowById = new Map(PROTOCOL_MATRIX.map((r) => [r.id, r]))
    const applies = (v: string) => v !== 'na'

    for (const uc of useCases) {
      if (uc.pqcMechanisms.length === 0) continue
      const targets = uc.protocolsTarget.map((id) => rowById.get(id)).filter(Boolean)
      // A row with no protocol at all is covered by the no_protocol_reason
      // guard below, not here — there is nothing to be reachable through.
      if (targets.length === 0) continue

      const anyKem = targets.some(
        (t) => applies(t!.dimensions.pureKem.value) || applies(t!.dimensions.hybridKem.value)
      )
      const anySig = targets.some(
        (t) => applies(t!.dimensions.pureSig.value) || applies(t!.dimensions.hybridSig.value)
      )
      for (const m of uc.pqcMechanisms) {
        if (KEM_FAMILIES.has(m)) {
          expect(
            anyKem,
            `${uc.useCaseId}: claims KEM "${m}" but no target protocol (${uc.protocolsTarget.join(', ')}) has a KEM dimension`
          ).toBe(true)
        }
        if (SIG_FAMILIES.has(m)) {
          expect(
            anySig,
            `${uc.useCaseId}: claims signature "${m}" but no target protocol (${uc.protocolsTarget.join(', ')}) has a signature dimension`
          ).toBe(true)
        }
      }
    }
  })

  it('protocols_current / protocols_target resolve, and empty is explained (WS11)', () => {
    const ids = new Set(PROTOCOL_MATRIX.map((p) => p.id))
    for (const uc of useCases) {
      for (const p of [...uc.protocolsCurrent, ...uc.protocolsTarget]) {
        expect(ids, `${uc.useCaseId}: unknown protocol "${p}"`).toContain(p)
      }
      // A target must never be a dead end — that is the whole point of the
      // split. If the matrix says a protocol is superseded, the target column
      // must already name its successor.
      for (const p of uc.protocolsTarget) {
        expect(
          rowByIdForTargets.get(p)?.supersededByProtocolId,
          `${uc.useCaseId}: target "${p}" is itself superseded — migrate the row to its successor`
        ).toBeUndefined()
      }
      // "No standardised protocol exists" must be distinguishable from
      // "nobody filled it in".
      if (uc.protocolsCurrent.length === 0) {
        expect(
          uc.noProtocolReason.trim().length,
          `${uc.useCaseId}: no protocols and no no_protocol_reason`
        ).toBeGreaterThan(0)
      } else {
        expect(
          uc.protocolsTarget.length,
          `${uc.useCaseId}: has current protocols but no target`
        ).toBeGreaterThan(0)
      }
    }
  })

  it('pqc_claim_basis is a known value and within its matrix-derived ceiling (WS10)', () => {
    const rowById = new Map(PROTOCOL_MATRIX.map((r) => [r.id, r]))
    for (const uc of useCases) {
      expect(
        PQC_CLAIM_BASES as readonly string[],
        `${uc.useCaseId}: unknown pqc_claim_basis "${uc.pqcClaimBasis}"`
      ).toContain(uc.pqcClaimBasis)

      // A row claiming no PQC mechanism must not claim a basis for one.
      if (uc.pqcMechanisms.length === 0) {
        expect(uc.pqcClaimBasis, `${uc.useCaseId}: basis set but no PQC mechanism`).toBe('none')
        continue
      }
      expect(uc.pqcClaimBasis, `${uc.useCaseId}: claims PQC but basis is 'none'`).not.toBe('none')

      // The CEILING is checkable; adoption is not. A row may claim less than
      // its target protocol supports (the sector is behind — normal), but never
      // more (that would be asserting a standard that does not exist).
      const targets = uc.protocolsTarget.map((id) => rowById.get(id)).filter(Boolean)
      if (targets.length === 0) continue
      const bestStage = Math.max(
        ...targets.flatMap((t) =>
          Object.values(t!.dimensions).map((d) =>
            d.stage
              ? DRAFT_STAGE_LEVEL[d.stage]
              : d.value === 'rfc'
                ? 7
                : d.value === 'draft'
                  ? 4
                  : 0
          )
        )
      )
      if (bestStage < 7) {
        expect(
          ['adopted', 'standardised'].includes(uc.pqcClaimBasis),
          `${uc.useCaseId}: basis "${uc.pqcClaimBasis}" exceeds its ceiling — no target protocol has a published standard`
        ).toBe(false)
      }
    }
  })

  it('source_library_ref, when set, resolves to an ACTIVE library row (WS8a)', () => {
    // Hard FK, same class as standards' library_ref and mechanism_refs. The
    // tile renders /library?ref=<id> when this is set and falls back to
    // /threats?industry= when it is empty, so a ref pointing at a missing or
    // deprecated row is a dead link where the fallback would have worked.
    //
    // Empty is legitimate and NOT a failure — it is the documented fallback
    // state, and the value is hand-set only (fuzzy title matching resolved
    // "IEC 62351-3/-5/-9" to IEC 62443 and "PCI DSS v4.0.1" to the PCI-DSS
    // quick-reference guide, i.e. a DIFFERENT standard).
    const active = new Set(libraryData.map((d) => d.referenceId))
    for (const uc of useCases) {
      if (!uc.sourceLibraryRef) continue
      expect(
        active,
        `${uc.useCaseId}: source_library_ref "${uc.sourceLibraryRef}" is not an active library row`
      ).toContain(uc.sourceLibraryRef)
    }
  })

  it('source_citation_type is well-formed and internally consistent (2026-08-15)', () => {
    // "If there is no specific crypto requirements, mention it" — this is the
    // structural half of that guard (see compute-source-citation-type.py for
    // the content half, which opens the cached document; too slow for hub CI).
    const SOURCE_CITATION_TYPES = new Set(['', 'technical', 'driver'])
    for (const uc of useCases) {
      expect(
        SOURCE_CITATION_TYPES,
        `${uc.useCaseId}: unknown source_citation_type "${uc.sourceCitationType}"`
      ).toContain(uc.sourceCitationType)

      // The classification only means something when there is a link to
      // classify. A value with no sourceLibraryRef is orphaned metadata.
      if (uc.sourceCitationType && !uc.sourceLibraryRef) {
        expect.fail(
          `${uc.useCaseId}: source_citation_type "${uc.sourceCitationType}" set with no source_library_ref`
        )
      }

      // A 'driver' verdict means the cited document does NOT prove the claim
      // — so something else must. If mechanismRefs is also empty, the row's
      // mechanism claim has NO proof anywhere, which is exactly the silent
      // gap this whole column exists to surface, not hide behind a link.
      if (uc.sourceCitationType === 'driver') {
        expect(
          uc.mechanismRefs.length,
          `${uc.useCaseId}: 'driver' citation with empty mechanism_refs — the claim has no proof at all`
        ).toBeGreaterThan(0)
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
    const SYMMETRIC_EXEMPT = new Set(['AES', 'SHA', 'SNOW3G', 'ZUC'])
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
      // isCrossIndustry catches 'Cross-Industry' sub-labels too (e.g.
      // 'Cross-Industry / Code Signing') — they're the same "not a real
      // sector" case MARKET_SIZE_EXEMPT's 'Cross-Industry' entry covers, split
      // only for the learn_module_id consistency guard.
      if (
        MARKET_SIZE_EXEMPT.has(ind) ||
        isCrossIndustry(ind) ||
        MARKET_SIZE_STALE_PENDING_REFRESH.has(ind)
      )
        continue
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

  it('every migrate_product_refs id resolves to an ACTIVE migrate-catalog row', () => {
    // Same hard-FK rule as mechanism_refs above, added 2026-08-16 alongside
    // the tile's new "Implementation" link — a ref pointing at a missing or
    // deprecated catalog row would deep-link to nothing.
    const active = new Set(softwareData.map((p) => p.productId))
    for (const uc of useCases) {
      for (const ref of uc.migrateProductRefs) {
        expect(
          active,
          `${uc.useCaseId}: migrate_product_ref "${ref}" is not an active migrate-catalog row`
        ).toContain(ref)
      }
    }
  })

  it('HSM certification verdicts use the closed vocabulary', () => {
    // '' is VALID and means "not yet assessed" — deliberately distinct from
    // 'none' ("assessed, no requirement exists"). Collapsing the two would let
    // an unresearched row render as a verified negative, which is the exact
    // overclaim shape this whole column set exists to avoid.
    const VERDICTS = new Set(['mandated', 'de-facto', 'none', ''])
    for (const uc of useCases) {
      for (const [field, v] of [
        ['fips_140', uc.fipsCertification],
        ['common_criteria', uc.ccCertification],
        ['pci_certification', uc.pciCertification],
        ['national_certification', uc.nationalCertification],
      ] as const) {
        expect(VERDICTS, `${uc.useCaseId}: ${field} = "${v}"`).toContain(v)
      }
    }
  })

  it('fips_140_level uses the closed vocabulary and is 140-3 only', () => {
    // FIPS 140-2 is deprecated — CMVP moves 140-2 certificates to the
    // Historical List on 2026-09-21 and NIST says that list "should not be
    // used for procurement decisions". Sources that still say "140-2 Level 3"
    // (PCI PIN v3.1, SWIFT CP, DoD CSP SRG) are normalised to the current
    // generation here; their literal wording stays in the cited document.
    // A stray '140-2 ...' value would mean that normalisation was skipped.
    const LEVELS = new Set(['140-3 L1', '140-3 L2', '140-3 L3', '140-3 L4', 'not-specified', ''])
    for (const uc of useCases) {
      expect(
        LEVELS,
        `${uc.useCaseId}: fips_140_level = "${uc.fipsCertificationLevel}" — store the ` +
          `current-generation equivalent (140-3 Lx) or 'not-specified', never a 140-2 value`
      ).toContain(uc.fipsCertificationLevel)
    }
  })

  it('a FIPS level is present exactly when FIPS is required, and absent when it is not', () => {
    for (const uc of useCases) {
      const claimed = uc.fipsCertification === 'mandated' || uc.fipsCertification === 'de-facto'
      if (claimed) {
        expect(
          uc.fipsCertificationLevel,
          `${uc.useCaseId} claims FIPS "${uc.fipsCertification}" but names no level — use ` +
            `'not-specified' when the mandate genuinely names none (e.g. SP 800-53 SC-13)`
        ).not.toBe('')
      } else {
        expect(
          uc.fipsCertificationLevel,
          `${uc.useCaseId}: fips_140 is "${uc.fipsCertification}" so no level may be recorded`
        ).toBe('')
      }
    }
  })

  it('any-of logic is only claimed where there is more than one route to satisfy', () => {
    // 'any-of' renders as "or" between the badges. Claiming it with a single
    // required scheme would render an alternation with nothing to alternate.
    for (const uc of useCases) {
      if (uc.certificationLogic !== 'any-of') continue
      const required = [
        uc.fipsCertification,
        uc.ccCertification,
        uc.pciCertification,
        uc.nationalCertification,
      ].filter((v) => v === 'mandated' || v === 'de-facto')
      expect(
        required.length,
        `${uc.useCaseId}: hsm_certification_logic='any-of' needs >= 2 required schemes`
      ).toBeGreaterThanOrEqual(2)
    }
    const LOGIC = new Set(['any-of', 'all-of', ''])
    for (const uc of useCases) {
      expect(LOGIC, `${uc.useCaseId}: hsm_certification_logic`).toContain(uc.certificationLogic)
    }
  })

  it('every row asserting a certification requirement cites proof for it', () => {
    // Same grounding discipline as mechanism_refs. A regulatory-requirement
    // claim with no citation is unfalsifiable by a reader, which is precisely
    // the defect class the 2026-08-13 audit found 12 instances of.
    const known = new Set(libraryData.map((r) => r.referenceId))
    for (const uc of useCases) {
      const asserts = [
        uc.fipsCertification,
        uc.ccCertification,
        uc.pciCertification,
        uc.nationalCertification,
      ].some((v) => v === 'mandated' || v === 'de-facto')
      if (!asserts) continue
      expect(
        uc.hsmCertificationRefs.length,
        `${uc.useCaseId} asserts a certification requirement but cites no evidence`
      ).toBeGreaterThan(0)
      for (const ref of uc.hsmCertificationRefs) {
        expect(
          known,
          `${uc.useCaseId}: hsm_certification_ref "${ref}" is not a library row`
        ).toContain(ref)
      }
    }
  })

  it('the industry rollup never contradicts the rows it is derived from', () => {
    const RANK: Record<string, number> = { mandated: 3, 'de-facto': 2, none: 1, '': 0 }
    for (const industry of new Set(useCases.map((u) => u.industry))) {
      const summary = getIndustryCertificationSummary(industry)
      const rows = useCases.filter((u) => u.industry === industry)
      for (const [label, roll, pick] of [
        ['fips', summary.fips, (u: (typeof rows)[number]) => u.fipsCertification],
        ['cc', summary.cc, (u: (typeof rows)[number]) => u.ccCertification],
        ['pci', summary.pci, (u: (typeof rows)[number]) => u.pciCertification],
        ['national', summary.national, (u: (typeof rows)[number]) => u.nationalCertification],
      ] as const) {
        const best = rows.reduce((m, u) => Math.max(m, RANK[pick(u)] ?? 0), 0)
        expect(RANK[roll] ?? 0, `${industry}: ${label} rollup "${roll}" != strongest row`).toBe(
          best
        )
      }
    }
  })

  it('certification_future is dated, cited, and cites into the future', () => {
    // A "future" requirement with no date is unfalsifiable (future relative
    // to WHEN?); with no citation it is unfalsifiable at all. Both defeat
    // the point of the column — it exists to let a reader check the claim.
    const DATE_RE = /^\d{4}(-\d{2}-\d{2})?$/
    for (const uc of useCases) {
      if (!uc.certificationFuture) {
        expect(
          uc.certificationFutureDate,
          `${uc.useCaseId}: certification_future_date set without certification_future`
        ).toBe('')
        expect(
          uc.certificationFutureRefs,
          `${uc.useCaseId}: certification_future_refs set without certification_future`
        ).toEqual([])
        continue
      }
      expect(
        uc.certificationFutureDate,
        `${uc.useCaseId}: certification_future needs certification_future_date (YYYY or YYYY-MM-DD)`
      ).toMatch(DATE_RE)
      expect(
        uc.certificationFutureRefs.length,
        `${uc.useCaseId}: certification_future asserts a coming change but cites no evidence`
      ).toBeGreaterThan(0)
      for (const ref of uc.certificationFutureRefs) {
        expect(
          libraryData.map((r) => r.referenceId),
          `${uc.useCaseId}: certification_future_ref "${ref}" is not a library row`
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

  it('evidence_type is a known value, and honest in BOTH directions', () => {
    // A research paper admitted to the standards table must SAY so — the chip
    // badge is driven entirely by this field, so a mislabelled row renders a
    // preprint as though it were a specification.
    //
    // The first version of this test only checked one direction: that a row
    // marked non-standard points at a researchy document. It never checked
    // that a row marked `standard` is not secretly a report — and two were
    // (GSMA PQ.01 and the ENISA hybridisation study, both Industry Reports),
    // because the sweep set evidence_type='standard' on every pre-existing row
    // without looking. A one-way guard on a two-way claim is barely a guard.
    const NOT_A_SPEC = new Set(['Research Paper', 'Industry Report', 'Government Guidance'])
    const docTypeOf = new Map(libraryData.map((d) => [d.referenceId, d.documentType]))
    for (const s of standards) {
      // Derived from the exported vocabulary, not a second hardcoded list —
      // a hardcoded copy here is exactly how `guidance` came to be accepted by
      // this test while the renderer had never heard of it (see the
      // vocabulary/renderer test below).
      expect(
        EVIDENCE_TYPES as readonly string[],
        `standard "${s.standardId}" has unknown evidence_type "${s.evidenceType}"`
      ).toContain(s.evidenceType)
      const docType = docTypeOf.get(s.libraryRef) ?? ''
      if (s.evidenceType === 'standard') {
        // Reverse direction. NOTE the library's `Reference` type is NOT listed
        // in NOT_A_SPEC: it holds FIPS 203/204/205, SP 800-208 and the TCG TPM
        // library, which are specifications despite the label. Only the three
        // types that are never normative are rejected here.
        expect(
          NOT_A_SPEC,
          `standard "${s.standardId}" is marked as a standard but the library calls it a ${docType}`
        ).not.toContain(docType)
      } else {
        expect(
          new Set([...NOT_A_SPEC, 'Reference']),
          `standard "${s.standardId}" is marked ${s.evidenceType} but its library row is a ${docType}`
        ).toContain(docType)
      }
    }
  })

  it('CycloneDX projection: every mapped family exists in the vendored registry', () => {
    // WS5 (2026-08-15). cryptoMechanisms.ts's provenance block CLAIMED it was
    // "checked by the maintenance flow so a registry update surfaces as a
    // freshness finding". Nothing read it — not the validators, not a script,
    // not the freshness manifest — so the mapping was correct by inspection
    // rather than by test, and a typo would have shipped silently.
    //
    // The vocabulary is NOT adopted as the primary key, deliberately: 4 PQC
    // families (FN-DSA, HQC, FrodoKEM, Classic McEliece) have no registry entry
    // at all, RSA splits into 4 padding-specific families the sector evidence
    // never specifies, and X25519 collapses into ECDH. It is a projection for
    // CBOM export, and this pins the projection.
    const known = new Set(ALGORITHM_FAMILIES.map((f) => f.family))
    for (const fam of CRYPTO_MECHANISMS) {
      for (const cdx of fam.cycloneDxFamilies) {
        expect(
          known,
          `${fam.family}: cycloneDxFamilies value "${cdx}" is not in the vendored CycloneDX registry`
        ).toContain(cdx)
      }
    }
  })

  it('CycloneDX projection: the deliberately-absent PQC families are still absent', () => {
    // The other half of the guard, and the one that earns its keep. These four
    // map to [] because the registry has no entry for them (verified absent
    // 2026-07-29). When CycloneDX adds HQC, this test fails and tells you to
    // map it — which is the only way anyone would find out.
    const known = new Set(ALGORITHM_FAMILIES.map((f) => f.family))
    for (const fam of ['FN-DSA', 'HQC', 'FrodoKEM', 'Classic-McEliece']) {
      const entry = CRYPTO_MECHANISMS.find((f) => f.family === fam)
      expect(entry, `${fam} missing from CRYPTO_MECHANISMS`).toBeDefined()
      expect(
        entry!.cycloneDxFamilies,
        `${fam} is mapped, so the registry now has an entry — update the mapping`
      ).toEqual([])
      // Belt and braces: assert the registry really still lacks it, so the
      // empty mapping above stays honest rather than merely unchanged.
      expect(
        known.has(fam),
        `CycloneDX registry now defines "${fam}" — map it in cryptoMechanisms.ts`
      ).toBe(false)
    }
  })

  it('CycloneDX pin matches the vendored registry it claims to describe', () => {
    // CYCLONEDX_REGISTRY.verifiedAgainst is rendered to READERS on the tile
    // ("registry data 2026-02-24"). If it drifts from the vendored copy's own
    // lastUpdated, the page states a provenance date that is not the data's.
    expect(REGISTRY_LAST_UPDATED.slice(0, 10)).toBe(CYCLONEDX_REGISTRY.verifiedAgainst)
  })

  it('every evidence_type the vocabulary allows has a renderer badge', () => {
    // WS3c (2026-08-15). THE guard for the D7 class: a value the data layer
    // accepts but the renderer has never heard of. `guidance` was added to the
    // Python validator and to this file's allowed list, but not to the TS union
    // and not to the badge map — so three guidance documents rendered as
    // specifications. Nothing checked that the two lists agreed, because there
    // was no single list. Now there is one, and this asserts the renderer
    // covers all of it.
    expect(
      unlabelledEvidenceTypes(),
      'evidence_type values with no badge label — they would render as specifications'
    ).toEqual([])

    // `standard` is the ONLY value entitled to render with no badge.
    for (const t of EVIDENCE_TYPES) {
      if (t === 'standard') {
        expect(evidenceLabelFor(t), 'standard must render without a badge').toBeNull()
      } else {
        expect(
          evidenceLabelFor(t),
          `evidence_type "${t}" must carry a visible badge, not render as a standard`
        ).toBeTruthy()
      }
    }

    // Defensive: a value that is not in the vocabulary at all must still not
    // fall through to the no-badge state.
    expect(evidenceLabelFor('not-a-real-type' as never)).toBe('Unverified type')
  })

  it('standards coverage of use cases does not regress', () => {
    // Ratchet, like mechanism_refs above. 2026-08-13: 74 of 76 use cases have
    // at least one standards row. The two without are gov-procurement and
    // ins-cyber-underwriting, governance use cases that claim no mechanism at
    // all — nothing to cite. The four proven only by research, industry
    // reports or courseware ARE listed, carrying an evidence_type badge.
    const covered = new Set<string>()
    for (const s of standards) for (const uc of s.useCaseIds) covered.add(uc)
    for (const u of useCases) if (u.relatedStandards.length > 0) covered.add(u.useCaseId)
    expect(covered.size, 'industry_standards coverage regressed').toBeGreaterThanOrEqual(74)
  })

  it('every industry resolves to a sector code for the Library/Compliance links', () => {
    // The detail view links unsupported industries at /library?sector=<naics>
    // and the regulatory count at /compliance?ind=<label>; both resolve through
    // sector_vocabulary_*.csv. resolveToNaicsSet is EXACT-match on the
    // lowercased alias and falls back to echoing the input, so a missing alias
    // is silent — it returns the industry name as if it were a NAICS code and
    // the filter matches nothing.
    for (const ind of getLandscapeIndustries()) {
      // 'Cross-Industry' (and its sub-labels) is the absence of a sector, not
      // a sector — the tile renders no sector link for it (see
      // industryCrossRefs.sectorCodesFor).
      if (isCrossIndustry(ind)) continue
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
