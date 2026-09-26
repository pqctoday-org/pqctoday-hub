// SPDX-License-Identifier: GPL-3.0-only
import type { SoftwareItem } from '../types/MigrateTypes'
import { compareDatasets, type ItemStatus } from '../utils/dataComparison'
import { loadLatestCSV } from './csvUtils'
import { vendorMap } from './vendorData'

// Glob import to find all matching CSV files
const modules = import.meta.glob('./pqc_product_catalog_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

interface RawSoftwareItem {
  product_id?: string
  software_name: string
  /** Earlier display names of this product (semicolon list), kept when a name is corrected. */
  former_names?: string
  /** What the product is (library, hsm, cloud_service, …) — drives its freshness class. */
  product_kind?: string
  /** pqc_relevant | migration_baseline (owner decision, migrate remediation r2 R3). */
  catalogue_population?: string
  /** Why a no-PQC product belongs in the catalogue ("<segment>: <why>"). */
  baseline_rationale?: string
  /** Product line this row is a release/edition/configuration of; blank for a singleton. */
  family_id?: string
  category_id: string
  category_name: string
  infrastructure_layer: string
  cisa_category?: string
  pqc_support: string
  pqc_certified?: string
  has_certification?: string
  pqc_status_canonical?: string
  pqc_capability_description: string
  license_type: string
  license: string
  latest_version: string
  release_date: string
  fips_validated: string
  pqc_migration_priority: string
  primary_platforms: string
  target_industries: string
  authoritative_source: string
  repository_url: string
  product_brief: string
  product_brief_url?: string
  user_manual_url?: string
  source_type: string
  verification_status: string
  last_verified_date: string
  migration_phases: string
  learning_modules: string
  vendor_id?: string
  trusted_source_id?: string
  peer_reviewed?: string
  vetting_body?: string
  evidence_flags?: string
  proof_url?: string
  proof_publication_date?: string
  proof_relevant_info?: string
  validation_result?: string
  correction_notes?: string
  quantum_tech?: string
  wip?: string
  github_contribution_url?: string
  confidence_score?: string
  cswp39_tags?: string
  status?: string
  deprecated_at?: string
  deprecated_reason?: string
}

function deriveCisaCategory(categoryName: string, layer: string): string {
  const cat = (categoryName || '').toLowerCase()
  if (cat.includes('cloud')) return 'Cloud Services'
  if (cat.includes('identity') || cat.includes('iam') || cat.includes('pki'))
    return 'Identity, Credential, and Access Management (ICAM) Software'
  if (cat.includes('network') || cat.includes('vpn') || cat.includes('protocol'))
    return 'Networking Software'
  if (layer === 'Hardware' || cat.includes('hardware') || cat.includes('semiconductor'))
    return 'Networking Hardware'
  if (
    cat.includes('database') ||
    cat.includes('storage') ||
    cat.includes('disk') ||
    cat.includes('file')
  )
    return 'Data'
  if (cat.includes('messaging') || cat.includes('email') || cat.includes('collaboration'))
    return 'Collaboration Software'
  if (cat.includes('browser') || cat.includes('web')) return 'Web Software'
  if (cat.includes('operating system')) return 'Computers (Physical and Virtual)'
  if (layer === 'Endpoint') return 'Endpoint Security'
  return 'Enterprise Security'
}

/**
 * Derive verification_status from proof fields at load time.
 * Rules:
 * - Verified (No PQC): the archived proof verified the ABSENCE of PQC support
 *   (VALIDATED_NO_PQC) — must never present as a plain PQC-'Verified'
 * - Verified: proof_url present + validation confirms PQC (VALIDATED, FIPS_VERIFIED, CORRECTED)
 * - Partially Verified: proof_url present but validation incomplete or evidence indirect
 * - Pending Verification: no proof_url or validation negative
 * - Needs Review: the maintenance flow withheld the row (csv
 *   "Unverified — needs review") because a claim was contradicted — wins over
 *   every other rule, VALIDATED_NO_PQC included
 * - A csv "Verified" alone never produces Verified: the validation result must
 *   confirm it (the old manual override let 15 rows with FIPS_ISSUE,
 *   NEEDS_REVIEW, PENDING or blank results render as Verified)
 *
 * Exported for tests.
 */
export function deriveVerificationStatus(
  csvStatus: string,
  proofUrl?: string,
  validationResult?: string,
  evidenceFlags?: string,
  proofRelevantInfo?: string
): string {
  const hasProofUrl = !!(proofUrl || '').trim()
  const vr = (validationResult || '').toUpperCase()
  const ef = (evidenceFlags || '').toLowerCase()
  const hasProofContent = !!(proofRelevantInfo || '').trim()

  // A withheld row stays withheld until a reviewed decision restores it.
  if (csvStatus.trim().toLowerCase().startsWith('unverified')) return 'Needs Review'

  // A proof that validated the ABSENCE of PQC is its own state — rows whose
  // evidence disproves the PQC claim must not share a badge with rows whose
  // evidence confirms it.
  if (vr === 'VALIDATED_NO_PQC') {
    return hasProofUrl ? 'Verified (No PQC)' : 'Pending Verification'
  }

  // Derive from evidence
  if (hasProofUrl) {
    if (vr === 'VALIDATED' || vr === 'FIPS_VERIFIED' || vr === 'CORRECTED') return 'Verified'
    if (vr === 'PARTIALLY_VALIDATED' || vr === 'NEEDS_REVIEW') return 'Partially Verified'
    if (hasProofContent && !ef.includes('needs-extraction')) return 'Partially Verified'
    return 'Pending Verification'
  }

  // No proof_url
  if (ef.includes('doc-extraction') || ef.includes('iec')) return 'Pending Verification'
  if (csvStatus === 'Verified' || csvStatus === 'Partially Verified') return 'Pending Verification'
  if (csvStatus && csvStatus !== 'Needs Verification') return csvStatus
  return 'Needs Verification'
}

// Count of rows hidden by the no-record-without-proof deprecation gate (mechanical
// at parse time, not authored) — surfaced to the UI so the proof-gate discipline is
// visible rather than silently dropping rows from the catalog.
let deprecatedRowCount = 0

// A row deprecated as a duplicate ("duplicate of <id>" / "re-issued as <id>")
// names the same product as the row it was merged into, so its display name is
// a former name of that row: saved selections, share links and search chunks
// that carry the old name resolve to the kept product (migrate remediation r2).
const duplicateSuccessors: Array<[string, string]> = []
const DUPLICATE_OF = /^(?:duplicate of|re-issued as) ([A-Za-z0-9._-]+)/

const {
  data: currentItems,
  previousData: previousItems,
  metadata,
} = loadLatestCSV<RawSoftwareItem, SoftwareItem>(
  modules,
  /catalog_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
  (row) => {
    if (row.status && row.status !== 'active') {
      deprecatedRowCount += 1
      const successor = DUPLICATE_OF.exec((row.deprecated_reason || '').trim())?.[1]
      if (successor && row.software_name) {
        duplicateSuccessors.push([row.software_name, successor.replace(/[:.,]+$/, '')])
      }
      return null
    }
    return {
      productId: row.product_id || '',
      softwareName: row.software_name,
      productKind: row.product_kind || '',
      cataloguePopulation: row.catalogue_population || '',
      baselineRationale: row.baseline_rationale || '',
      familyId: row.family_id || '',
      formerNames: (row.former_names || '')
        .split(';')
        .map((n) => n.trim())
        .filter(Boolean),
      categoryId: row.category_id,
      categoryName: row.category_name,
      infrastructureLayer: row.infrastructure_layer,
      cisaCategory:
        row.cisa_category || deriveCisaCategory(row.category_name, row.infrastructure_layer),
      pqcSupport: row.pqc_support,
      pqcCertified: (row.pqc_certified || 'none') as SoftwareItem['pqcCertified'],
      hasCertification: (row.has_certification || 'unknown') as SoftwareItem['hasCertification'],
      pqcStatusCanonical: row.pqc_status_canonical || '',
      pqcCapabilityDescription: row.pqc_capability_description,
      licenseType: row.license_type,
      license: row.license,
      latestVersion: row.latest_version,
      releaseDate: row.release_date,
      fipsValidated: row.fips_validated,
      pqcMigrationPriority: row.pqc_migration_priority,
      primaryPlatforms: row.primary_platforms,
      targetIndustries: row.target_industries,
      authoritativeSource: row.authoritative_source,
      repositoryUrl: row.repository_url,
      productBrief: row.product_brief,
      productBriefUrl: row.product_brief_url?.trim() || undefined,
      userManualUrl: row.user_manual_url?.trim() || undefined,
      sourceType: row.source_type,
      verificationStatus: deriveVerificationStatus(
        row.verification_status,
        row.proof_url,
        row.validation_result,
        row.evidence_flags,
        row.proof_relevant_info
      ),
      lastVerifiedDate: row.last_verified_date,
      migrationPhases: row.migration_phases || '',
      learningModules: row.learning_modules || '',
      vendorId: row.vendor_id || '',
      peerReviewed: (row.peer_reviewed?.toLowerCase() as SoftwareItem['peerReviewed']) || undefined,
      vettingBody: row.vetting_body
        ? row.vetting_body
            .split(';')
            .map((s: string) => s.trim())
            .filter(Boolean)
        : undefined,
      evidenceFlags: row.evidence_flags
        ? row.evidence_flags
            .split(';')
            .map((s: string) => s.trim())
            .filter(Boolean)
        : undefined,
      proofUrl: row.proof_url || undefined,
      proofPublicationDate: row.proof_publication_date || undefined,
      proofRelevantInfo: row.proof_relevant_info || undefined,
      validationResult: (row.validation_result as SoftwareItem['validationResult']) || undefined,
      correctionNotes: row.correction_notes || undefined,
      quantumTech: (row.quantum_tech as SoftwareItem['quantumTech']) || undefined,
      wip: row.wip === 'true',
      githubContributionUrl: row.github_contribution_url?.trim() || undefined,
      confidenceScore: row.confidence_score ? Number(row.confidence_score) : undefined,
      cswp39Tags: row.cswp39_tags
        ? row.cswp39_tags
            .split(';')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined,
    }
  },
  true // withPrevious for status badges
)

// Compute status map if previous data exists. Keyed by product_id — the row's
// immutable identity — so a display-name correction reads as "Updated", not as
// one product vanishing and a "New" one appearing.
const statusMap = previousItems
  ? compareDatasets(currentItems, previousItems, 'productId')
  : new Map<string, ItemStatus>()

export const softwareMetadata = metadata

/** Count of catalog rows currently hidden pending proof (no-record-without-proof gate). */
export const deprecatedProductCount = deprecatedRowCount

export const softwareData: SoftwareItem[] = currentItems.map((item) => ({
  ...item,
  status: statusMap.get(item.productId),
}))

for (const [name, successorId] of duplicateSuccessors) {
  const kept = softwareData.find((p) => p.productId === successorId)
  if (kept && kept.softwareName !== name && !(kept.formerNames ?? []).includes(name)) {
    kept.formerNames = [...(kept.formerNames ?? []), name]
  }
}

// Compute productCount for each vendor
softwareData.forEach((item) => {
  if (item.vendorId && vendorMap.has(item.vendorId)) {
    const vendor = vendorMap.get(item.vendorId)!
    vendor.productCount = (vendor.productCount ?? 0) + 1
  }
})

// Re-export vendorMap with computed productCounts
export { vendorMap }

/**
 * Alias from a legacy catalog token to its canonical MIGRATION_STEPS id.
 * The catalog historically tags `prepare`; the canonical step id is `preparation`.
 * (Map, not a plain object, to avoid dynamic-key object-injection.)
 */
const MIGRATION_STEP_ALIASES = new Map<string, string>([['prepare', 'preparation']])

/**
 * Whether a product (by its `migration_phases` cell) applies to a given migration
 * step. Robust to comma/semicolon delimiters and the prepare/preparation alias;
 * an UNTAGGED product is phase-agnostic and matches EVERY step rather than being
 * silently dropped from the step filter (was dropping ~41% of the catalog).
 */
export function matchesMigrationStep(migrationPhases: string | undefined, stepId: string): boolean {
  const phases = (migrationPhases ?? '')
    .split(/[,;]/)
    .map((p) => {
      const t = p.trim().toLowerCase()
      return MIGRATION_STEP_ALIASES.get(t) ?? t
    })
    .filter(Boolean)
  return phases.length === 0 || phases.includes(stepId)
}

export function getMigrateItemsForModule(moduleId: string): SoftwareItem[] {
  return softwareData.filter((item) => {
    if (!item.learningModules) return false
    return item.learningModules
      .split(';')
      .map((m) => m.trim())
      .includes(moduleId)
  })
}
