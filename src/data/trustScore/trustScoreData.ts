// SPDX-License-Identifier: GPL-3.0-only
/**
 * Pre-computes trust scores for all resources at module load time.
 * Exports lookup maps for efficient score retrieval by resource ID.
 */
import type { TrustScore, ScoredResourceType, ScoringContext } from './types'
import { computeTrustScore, type ResourceFields } from './engine'

// Data imports — all synchronous / eagerly loaded
import { trustedSources } from '../trustedSourcesData'
import { xrefsByResource, type TrustedSourceXref } from '../trustedSourceXrefData'
import { libraryEnrichments, type LibraryEnrichment } from '../libraryEnrichmentData'
import { timelineEnrichments, getTimelineEnrichmentKey } from '../timelineEnrichmentData'
import { complianceFrameworks } from '../complianceData'
import { threatsData } from '../threatsData'
import { leadersData } from '../leadersData'
import { softwareData } from '../migrateData'
import { algorithmsData } from '../algorithmsData'
import { timelineData } from '../timelineData'
import { libraryData } from '../libraryData'
import { parseEnrichmentMarkdown, type EnrichmentLookup } from '../libraryEnrichmentData'

// ---------------------------------------------------------------------------
// Enrichment dimension counting
// ---------------------------------------------------------------------------

/** The 18 enrichment dimensions checked for completeness. */
const ENRICHMENT_DIMENSIONS: (keyof LibraryEnrichment)[] = [
  'pqcAlgorithms',
  'quantumThreats',
  'migrationTimeline',
  'regionsAndBodies',
  'leadersContributions',
  'pqcProducts',
  'protocols',
  'infrastructureLayers',
  'standardizationBodies',
  'complianceFrameworks',
  'classicalAlgorithms',
  'keyTakeaways',
  'securityLevels',
  'hybridApproaches',
  'performanceConsiderations',
  'targetAudience',
  'implementationPrereqs',
  'relevantFeatures',
]

function countPopulatedDimensions(e: LibraryEnrichment): { populated: number; total: number } {
  let populated = 0
  for (const key of ENRICHMENT_DIMENSIONS) {
    const val = e[key]
    if (val === null || val === undefined) continue
    if (Array.isArray(val) && val.length === 0) continue
    if (typeof val === 'string' && (!val || val === 'None detected')) continue
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      // regionsAndBodies: { regions: [], bodies: [] }
      const obj = val as { regions: string[]; bodies: string[] }
      if (obj.regions.length === 0 && obj.bodies.length === 0) continue
    }
    populated++
  }
  return { populated, total: ENRICHMENT_DIMENSIONS.length }
}

function buildEnrichmentMap(
  lookup: EnrichmentLookup
): Record<string, { populatedCount: number; totalCount: number }> {
  const result: Record<string, { populatedCount: number; totalCount: number }> = {}
  for (const [id, enrichment] of Object.entries(lookup)) {
    const { populated, total } = countPopulatedDimensions(enrichment)
    result[id] = { populatedCount: populated, totalCount: total }
  }
  return result
}

// ---------------------------------------------------------------------------
// Threats enrichments (loaded inline — no dedicated module exists)
// ---------------------------------------------------------------------------

function loadThreatsEnrichments(): EnrichmentLookup {
  const modules = import.meta.glob('../doc-enrichments/threats_doc_enrichments_*.md', {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>

  const paths = Object.keys(modules)
  if (paths.length === 0) return {}

  const withDates = paths.map((p) => {
    const match = p.match(/(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.md$/)
    if (!match) return { path: p, date: 0, rev: 0 }
    const [, mm, dd, yyyy, , rev] = match
    return { path: p, date: parseInt(yyyy + mm + dd), rev: rev ? parseInt(rev) : 0 }
  })
  withDates.sort((a, b) => a.date - b.date || a.rev - b.rev)

  const merged: EnrichmentLookup = {}
  for (const { path } of withDates) {
    const raw = modules[path]
    if (!raw) continue
    Object.assign(merged, parseEnrichmentMarkdown(raw))
  }
  return merged
}

// ---------------------------------------------------------------------------
// Manifest loading (for doc grounding dimension)
// ---------------------------------------------------------------------------

interface ManifestEntry {
  refId?: string
  threatId?: string
  status: string
}

function loadManifestStatuses(): Map<string, 'downloaded' | 'skipped' | 'failed'> {
  const map = new Map<string, 'downloaded' | 'skipped' | 'failed'>()

  // Load manifests via glob
  const manifestModules = import.meta.glob(
    [
      '/public/library/manifest.json',
      '/public/timeline/manifest.json',
      '/public/threats/manifest.json',
      '/public/products/manifest.json',
    ],
    { import: 'default', eager: true }
  ) as Record<string, { entries?: ManifestEntry[] }>

  for (const manifest of Object.values(manifestModules)) {
    if (!manifest?.entries) continue
    for (const entry of manifest.entries) {
      const id = entry.refId || entry.threatId
      if (!id) continue
      const status = entry.status as 'downloaded' | 'skipped' | 'failed'
      if (status === 'downloaded' || status === 'skipped' || status === 'failed') {
        map.set(id, status)
      }
    }
  }

  return map
}

// ---------------------------------------------------------------------------
// Algorithms demonstrable in the Playground
// ---------------------------------------------------------------------------

const DEMONSTRABLE_ALGORITHMS = new Set([
  'mlkem',
  'mlkem512',
  'mlkem768',
  'mlkem1024',
  'mldsa',
  'mldsa44',
  'mldsa65',
  'mldsa87',
  'slhdsa',
  'aes',
  'aes128',
  'aes256',
  'chacha20',
  'sha256',
  'sha512',
  'sha3',
  'ed25519',
  'x25519',
  'secp256k1',
  'p256',
  'rsa',
  'ecdsa',
  'ecdh',
])

// ---------------------------------------------------------------------------
// Build ScoringContext
// ---------------------------------------------------------------------------

function buildScoringContext(): ScoringContext {
  // Trusted sources map
  const trustedSourcesMap = new Map<string, { trustTier: string; sourceType: string }>()
  for (const src of trustedSources) {
    trustedSourcesMap.set(src.sourceId, { trustTier: src.trustTier, sourceType: src.sourceType })
  }

  // Xrefs map — convert to simplified form
  const xrefsMap = new Map<string, Array<{ sourceId: string; matchMethod: string }>>()
  for (const [key, xrefs] of xrefsByResource) {
    xrefsMap.set(
      key,
      xrefs.map((x: TrustedSourceXref) => ({ sourceId: x.sourceId, matchMethod: x.matchMethod }))
    )
  }

  // Enrichment maps
  const threatsEnrichmentLookup = loadThreatsEnrichments()

  // Compliance cross-references
  const complianceLibraryRefs = new Map<string, string[]>()
  const complianceTimelineRefs = new Map<string, string[]>()
  for (const fw of complianceFrameworks ?? []) {
    if (fw.libraryRefs?.length > 0) complianceLibraryRefs.set(fw.id, fw.libraryRefs)
    if (fw.timelineRefs?.length > 0) complianceTimelineRefs.set(fw.id, fw.timelineRefs)
  }

  // Library dependencies
  const libraryDeps = new Map<string, string[]>()
  for (const item of libraryData ?? []) {
    if (item.dependencies) {
      const deps = item.dependencies
        .split(';')
        .map((d) => d.trim())
        .filter(Boolean)
      if (deps.length > 0) libraryDeps.set(item.referenceId, deps)
    }
  }

  // Threat module refs
  const threatModuleRefs = new Map<string, string[]>()
  for (const t of threatsData ?? []) {
    if (t.relatedModules?.length > 0) threatModuleRefs.set(t.threatId, t.relatedModules)
  }

  // Manifest statuses
  const manifestStatuses = loadManifestStatuses()

  return {
    trustedSources: trustedSourcesMap,
    xrefsByResource: xrefsMap,
    libraryEnrichments: buildEnrichmentMap(libraryEnrichments),
    timelineEnrichments: buildEnrichmentMap(timelineEnrichments),
    threatsEnrichments: buildEnrichmentMap(threatsEnrichmentLookup),
    manifestStatuses,
    complianceLibraryRefs,
    complianceTimelineRefs,
    libraryDependencies: libraryDeps,
    threatModuleRefs,
    demonstrableAlgorithms: DEMONSTRABLE_ALGORITHMS,
  }
}

// ---------------------------------------------------------------------------
// Compute all scores
// ---------------------------------------------------------------------------

function computeAllScores(): Map<string, TrustScore> {
  const ctx = buildScoringContext()
  const scores = new Map<string, TrustScore>()

  const score = (type: ScoredResourceType, id: string, fields: ResourceFields) => {
    const key = `${type}:${id}`
    scores.set(key, computeTrustScore(type, id, fields, ctx))
  }

  // Library items
  for (const item of libraryData ?? []) {
    score('library', item.referenceId, {
      peerReviewed: item.peerReviewed,
      vettingBody: item.vettingBody,
      localFile: item.localFile,
      documentType: item.documentType,
      algorithmFamily: item.algorithmFamily,
      lastUpdateDate: item.lastUpdateDate,
    })
  }

  // Timeline events — xrefs use the event title as resource ID
  for (const country of timelineData ?? []) {
    for (const body of country.bodies) {
      for (const event of body.events) {
        const title = event.title
        const compositeId = `${country.countryName}:${body.name}:${event.phase}:${title}`
        const enrichmentKey = getTimelineEnrichmentKey(country.countryName, body.name, title)

        // Score using title (matches xref resource_id)
        score('timeline', title, {
          peerReviewed: event.peerReviewed,
          vettingBody: event.vettingBody,
          lastUpdateDate: event.sourceDate,
        })

        // Map alternate keys so UI lookups work with either format
        const computed = scores.get(`timeline:${title}`)!
        scores.set(`timeline:${enrichmentKey}`, computed)
        scores.set(`timeline:${compositeId}`, computed)
      }
    }
  }

  // Compliance frameworks
  for (const fw of complianceFrameworks ?? []) {
    score('compliance', fw.id, {
      peerReviewed: fw.peerReviewed,
      vettingBody: fw.vettingBody ?? (fw.enforcementBody ? [fw.enforcementBody] : []),
      lastUpdateDate: fw.deadline !== 'Ongoing' ? fw.deadline : undefined,
    })
  }

  // Migrate products
  for (const item of softwareData ?? []) {
    score('migrate', item.softwareName, {
      peerReviewed: item.peerReviewed,
      vettingBody: item.vettingBody,
      localFile: undefined, // Products have docs in public/products/
      pqcSupport: item.pqcSupport,
      lastVerifiedDate: item.lastVerifiedDate,
      releaseDate: item.releaseDate,
    })
  }

  // Threats
  for (const t of threatsData ?? []) {
    score('threats', t.threatId, {
      peerReviewed: t.peerReviewed,
      vettingBody: t.vettingBody,
    })
  }

  // Leaders — use keyResourceUrl to inherit credibility from authored reference docs
  // Build a map of library referenceId → peer review status for doc-grounding leaders
  const libraryPeerReview = new Map<string, string>()
  const libraryVettingBodies = new Map<string, string[]>()
  for (const item of libraryData ?? []) {
    if (item.peerReviewed) libraryPeerReview.set(item.referenceId, item.peerReviewed)
    if (item.vettingBody?.length) libraryVettingBodies.set(item.referenceId, item.vettingBody)
  }

  for (const l of leadersData ?? []) {
    // Infer vetting from leader type + organizations
    const inferredVetting = l.vettingBody?.length
      ? l.vettingBody
      : l.type === 'Public' || l.type === 'Academic'
        ? l.organizations.slice(0, 1)
        : undefined

    // Use keyResourceUrl to boost: inherit peer review and vetting from authored docs
    const docRefs = l.keyResourceUrl ?? []
    let bestPeerReview = l.peerReviewed
    const docVettingBodies = new Set<string>(inferredVetting ?? [])

    for (const refId of docRefs) {
      // If leader authored a peer-reviewed doc, they inherit that status
      const docPR = libraryPeerReview.get(refId)
      if (docPR === 'yes') bestPeerReview = 'yes'
      else if (docPR === 'partial' && bestPeerReview !== 'yes') bestPeerReview = 'partial'

      // Inherit vetting bodies from authored docs
      const docVB = libraryVettingBodies.get(refId)
      if (docVB) docVB.forEach((b) => docVettingBodies.add(b))
    }

    score('leaders', l.name, {
      peerReviewed: bestPeerReview,
      vettingBody: docVettingBodies.size > 0 ? [...docVettingBodies] : undefined,
    })

    // Inject keyResourceUrl refs into the cross-reference context so density picks them up
    if (docRefs.length > 0) {
      const existing = ctx.xrefsByResource.get(l.name) ?? []
      for (const refId of docRefs) {
        existing.push({ sourceId: `lib:${refId}`, matchMethod: 'direct' })
      }
      ctx.xrefsByResource.set(l.name, existing)
    }
  }

  // Algorithms — strip parenthetical suffix to match xref IDs (e.g., "ML-DSA-44 (NIST Level 2)" → "ML-DSA-44")
  for (const a of algorithmsData ?? []) {
    const cleanName = a.pqc.replace(/\s*\([^)]*\)\s*$/, '')
    score('algorithm', cleanName, {
      peerReviewed: undefined,
      vettingBody: undefined,
      algorithmFamily: cleanName,
      lastUpdateDate: a.standardizationDate,
    })
    // Also map the full name with parenthetical for any UI lookups
    if (cleanName !== a.pqc) {
      scores.set(`algorithm:${a.pqc}`, scores.get(`algorithm:${cleanName}`)!)
    }
  }

  return scores
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

function safeComputeAllScores(): Map<string, TrustScore> {
  try {
    return computeAllScores()
  } catch {
    // In test environments, data modules may not be fully available
    return new Map()
  }
}

export const trustScores: Map<string, TrustScore> = safeComputeAllScores()

export function getTrustScore(
  resourceType: ScoredResourceType,
  resourceId: string
): TrustScore | undefined {
  return trustScores.get(`${resourceType}:${resourceId}`)
}

/** Get all scores for a given resource type. */
export function getScoresForType(resourceType: ScoredResourceType): TrustScore[] {
  const result: TrustScore[] = []
  for (const [key, score] of trustScores) {
    if (key.startsWith(`${resourceType}:`)) result.push(score)
  }
  return result
}
