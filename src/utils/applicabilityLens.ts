// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Persona-driven view shaping for applicability results.
 *
 * The applicability engine returns *all* items that match the user's profile.
 * For an executive that's overwhelming (300+ docs across domains). For an
 * architect, the same 300 docs are exactly what's wanted — but ordered by
 * protocols/algorithms first.
 *
 * `applyLens()` re-orders, caps, and filters the engine output for the
 * persona — without changing what the engine considers "applicable". The
 * panel applies a lens before rendering; the assessment report and command
 * center share the same logic via `useApplicability`.
 */
import type { PersonaId } from '../data/learningPersonas'
import type { XwalkRelationshipType } from '../data/conceptXwalkData'
import type { LibraryItem } from '../data/libraryData'
import type { ThreatData } from '../data/threatsData'
import type { AllApplicable, ApplicabilityResult, ApplicabilityTier } from './applicabilityEngine'
import { TIER_ORDER, TIER_META } from './applicabilityEngine'

export type SectionId = 'frameworks' | 'threats' | 'library' | 'timeline'

/**
 * Flat top-N caps that override per-tier caps when set. Used by the executive
 * lens to enforce strict UX-actionable counts (3 library docs, 5 threats) for
 * workshop drama, regardless of how many items might match in each tier.
 */
export interface FlatCaps {
  libraryMax?: number
  threatsMax?: number
  industryEventsMax?: number
}

export interface PersonaTrustPathConfig {
  allowedRelationships: XwalkRelationshipType[]
  /** Suppress derived results below this 0-100 score. */
  confidenceThreshold: number
  maxDerivedResults: number
  twoHopEnabled: boolean
}

export interface PersonaLens {
  /** Display order — sections not listed here are hidden. */
  sections: SectionId[]
  /** Per-tier item caps applied independently per section. */
  tierCaps: Partial<Record<ApplicabilityTier, number>>
  /** When set, library docs are filtered to these LIBRARY_CATEGORIES values. */
  libraryCategories?: string[]
  /** Flat top-N caps that override tierCaps for specific sections. */
  flatCaps?: FlatCaps
  /** One-liner shown above the panel — frames *why* these items matter for this persona. */
  framing: string
  /** IR 8477 trust path traversal config — controls derived-tier results. */
  trustPathConfig: PersonaTrustPathConfig
}

const ALL_NON_RELATED: XwalkRelationshipType[] = [
  'subset_of',
  'superset_of',
  'equivalent',
  'intersects_with',
]

const DEFAULT_LENS_SOURCE: PersonaLens = {
  sections: ['frameworks', 'threats', 'library', 'timeline'],
  tierCaps: { mandatory: 10, recognized: 8, 'cross-border': 5, advisory: 5 },
  framing: 'Items that apply to your industry and country.',
  trustPathConfig: {
    allowedRelationships: ALL_NON_RELATED,
    confidenceThreshold: 50,
    maxDerivedResults: 10,
    twoHopEnabled: false,
  },
}

/**
 * Per-persona lenses. Captures the user's directive that an executive needs
 * actionable mandates while an architect needs protocols/algorithms.
 */
const PERSONA_LENS_SOURCE: Record<PersonaId, PersonaLens> = {
  executive: {
    sections: ['frameworks', 'threats', 'timeline', 'library'],
    tierCaps: { mandatory: 8, recognized: 5, 'cross-border': 3, advisory: 3 },
    flatCaps: { libraryMax: 3, threatsMax: 5, industryEventsMax: 5 },
    libraryCategories: ['Government & Policy', 'Migration Guidance', 'International Frameworks'],
    framing: 'Compliance obligations, sector threats, and deadlines that require action.',
    trustPathConfig: {
      allowedRelationships: ['subset_of', 'superset_of', 'equivalent'],
      confidenceThreshold: 60,
      maxDerivedResults: 5,
      twoHopEnabled: false,
    },
  },
  // GRC (2026-09-07 split): the complete obligations/requirements experience,
  // not executive's downsampled browsing caps (executive-grc-split-plan.md
  // §5's compliance section) — generous tier caps and two-hop derived results
  // so tracing an obligation to its source document is actually possible here.
  grc: {
    sections: ['frameworks', 'library', 'threats', 'timeline'],
    tierCaps: { mandatory: 20, recognized: 15, 'cross-border': 10, advisory: 10 },
    libraryCategories: [
      'Government & Policy',
      'Compliance & Certification',
      'Migration Guidance',
      'International Frameworks',
    ],
    framing: 'Applicable obligations and their supporting evidence, ordered by tier.',
    trustPathConfig: {
      allowedRelationships: ALL_NON_RELATED,
      confidenceThreshold: 55,
      maxDerivedResults: 15,
      twoHopEnabled: true,
    },
  },
  architect: {
    sections: ['library', 'frameworks', 'threats', 'timeline'],
    tierCaps: { mandatory: 15, recognized: 12, 'cross-border': 10, advisory: 20 },
    libraryCategories: [
      'Protocols',
      'PKI Certificate Management',
      'KEM',
      'Digital Signature',
      'Algorithm Specifications',
      'NIST Standards',
    ],
    framing:
      'Protocols, algorithm specs, and PKI standards relevant to your stack — followed by the compliance frameworks they implement against.',
    trustPathConfig: {
      allowedRelationships: ALL_NON_RELATED,
      confidenceThreshold: 50,
      maxDerivedResults: 12,
      twoHopEnabled: false,
    },
  },
  developer: {
    sections: ['library', 'frameworks', 'threats', 'timeline'],
    tierCaps: { mandatory: 12, recognized: 10, 'cross-border': 6, advisory: 12 },
    libraryCategories: [
      'Protocols',
      'PKI Certificate Management',
      'KEM',
      'Digital Signature',
      'Algorithm Specifications',
    ],
    framing:
      'Implementation specifications and protocol drafts you will encode against. Compliance shown for context.',
    trustPathConfig: {
      allowedRelationships: ALL_NON_RELATED,
      confidenceThreshold: 45,
      maxDerivedResults: 15,
      twoHopEnabled: false,
    },
  },
  researcher: {
    sections: ['library', 'timeline', 'frameworks', 'threats'],
    tierCaps: { mandatory: 20, recognized: 20, 'cross-border': 15, advisory: 20 },
    framing: 'Standards, drafts, and timeline events across all library categories.',
    trustPathConfig: {
      allowedRelationships: ALL_NON_RELATED,
      confidenceThreshold: 35,
      maxDerivedResults: 25,
      twoHopEnabled: true,
    },
  },
  // cert-engineer (2026-09-29): the schemes and specifications a module is
  // tested against lead; threats are context, not the work.
  'cert-engineer': {
    sections: ['library', 'frameworks', 'timeline', 'threats'],
    tierCaps: { mandatory: 15, recognized: 12, 'cross-border': 8, advisory: 12 },
    libraryCategories: [
      'Compliance & Certification',
      'NIST Standards',
      'Algorithm Specifications',
      'Implementations',
    ],
    framing:
      'The standards a module is tested against and the certification schemes it answers to. Threats shown for context.',
    trustPathConfig: {
      allowedRelationships: ALL_NON_RELATED,
      confidenceThreshold: 45,
      maxDerivedResults: 15,
      twoHopEnabled: false,
    },
  },
  ops: {
    sections: ['frameworks', 'threats', 'library', 'timeline'],
    tierCaps: { mandatory: 10, recognized: 8, 'cross-border': 6, advisory: 5 },
    libraryCategories: ['Migration Guidance', 'PKI Certificate Management', 'Government & Policy'],
    framing: 'Migration playbooks and operational compliance items for your country and sector.',
    trustPathConfig: {
      allowedRelationships: ['intersects_with', 'subset_of', 'superset_of'],
      confidenceThreshold: 50,
      maxDerivedResults: 10,
      twoHopEnabled: false,
    },
  },
  curious: {
    sections: ['frameworks', 'threats', 'timeline', 'library'],
    tierCaps: { mandatory: 5, recognized: 3, 'cross-border': 3, advisory: 3 },
    flatCaps: { libraryMax: 3, threatsMax: 3, industryEventsMax: 3 },
    framing: 'A quick read on what applies to you — the top items only.',
    trustPathConfig: {
      allowedRelationships: ['equivalent', 'subset_of'],
      confidenceThreshold: 65,
      maxDerivedResults: 3,
      twoHopEnabled: false,
    },
  },
}

const SECTION_NOUN: Record<SectionId, string> = {
  frameworks: 'frameworks',
  threats: 'threats',
  library: 'library documents',
  timeline: 'timeline milestones',
}

function joinWords(words: string[]): string {
  if (words.length <= 1) return words.join('')
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`
}

/**
 * States, in plain words, how a lens shortens what the engine found, written from the
 * lens's own limits so the sentence cannot drift from the caps it describes. A lens that
 * shortens its lists must never be framed as complete.
 */
function limitsNote(lens: PersonaLens): string {
  const flat = lens.flatCaps ?? {}
  /* eslint-disable security/detect-object-injection -- t and id are closed unions */
  const tierLimits = TIER_ORDER.filter((t) => lens.tierCaps[t] !== undefined).map(
    (t) => `${TIER_META[t].label} ${lens.tierCaps[t]}`
  )
  const sentences: string[] = []
  if (tierLimits.length > 0) {
    const capped = lens.sections.filter(
      (id) =>
        !(id === 'library' && flat.libraryMax !== undefined) &&
        !(id === 'threats' && flat.threatsMax !== undefined)
    )
    sentences.push(
      `Each tier is capped for ${joinWords(capped.map((id) => SECTION_NOUN[id]))} (${tierLimits.join(', ')}).`
    )
  }
  if (flat.libraryMax !== undefined) {
    sentences.push(
      `Library documents are cut to ${flat.libraryMax} (highest tier first, then most recently updated).`
    )
  }
  if (flat.threatsMax !== undefined) {
    sentences.push(
      `Threats are cut to ${flat.threatsMax} (highest tier first, then most critical).`
    )
  }
  if (lens.libraryCategories && lens.libraryCategories.length > 0) {
    sentences.push(`Library documents outside ${joinWords(lens.libraryCategories)} are left out.`)
  }
  /* eslint-enable security/detect-object-injection */
  if (sentences.length === 0) return ''
  sentences.push(
    'Each section header counts the items this hides; the full lists are on the Compliance, Library, Threats and Timeline pages.'
  )
  return sentences.join(' ')
}

function withLimitsNote(lens: PersonaLens): PersonaLens {
  const note = limitsNote(lens)
  return note ? { ...lens, framing: `${lens.framing} ${note}` } : lens
}

const DEFAULT_LENS: PersonaLens = withLimitsNote(DEFAULT_LENS_SOURCE)
const PERSONA_LENSES = Object.fromEntries(
  Object.entries(PERSONA_LENS_SOURCE).map(([id, lens]) => [id, withLimitsNote(lens)])
) as Record<PersonaId, PersonaLens>

export function getLens(personaId: PersonaId | null): PersonaLens {
  if (!personaId) return DEFAULT_LENS
  // eslint-disable-next-line security/detect-object-injection
  return PERSONA_LENSES[personaId] ?? DEFAULT_LENS
}

function emptyTierCounts(): Record<ApplicabilityTier, number> {
  return {
    mandatory: 0,
    recognized: 0,
    'cross-border': 0,
    advisory: 0,
    derived: 0,
    informational: 0,
  }
}

/** Cap a tier-grouped list to the lens's tierCaps. Returns the kept list and the total dropped count. */
export function capByTier<T>(
  results: ApplicabilityResult<T>[],
  caps: PersonaLens['tierCaps']
): { kept: ApplicabilityResult<T>[]; droppedByTier: Record<ApplicabilityTier, number> } {
  const dropped = emptyTierCounts()
  const seenByTier = emptyTierCounts()
  const kept: ApplicabilityResult<T>[] = []
  for (const r of results) {
    const cap = caps[r.tier]
    seenByTier[r.tier] += 1
    if (cap !== undefined && seenByTier[r.tier] > cap) {
      dropped[r.tier] += 1
      continue
    }
    kept.push(r)
  }
  return { kept, droppedByTier: dropped }
}

// ── Sort helpers ─────────────────────────────────────────────────────────

const TIER_INDEX: Record<ApplicabilityTier, number> = (() => {
  const out = {} as Record<ApplicabilityTier, number>
  TIER_ORDER.forEach((t, i) => {
    out[t] = i
  })
  return out
})()

const CRITICALITY_RANK: Record<string, number> = {
  Critical: 0,
  High: 1,
  'Medium-High': 1.5,
  Medium: 2,
  Low: 3,
}

/**
 * Sort library results by tier (mandatory first) then by `lastUpdateDate` desc.
 * Used when the lens specifies `flatCaps.libraryMax` so the top-N picked is
 * the freshest mandate-relevant set, not an arbitrary first-N.
 */
function sortLibrary(
  results: ApplicabilityResult<LibraryItem>[]
): ApplicabilityResult<LibraryItem>[] {
  const sorted = [...results]
  sorted.sort((a, b) => {
    const ti = TIER_INDEX[a.tier] - TIER_INDEX[b.tier]
    if (ti !== 0) return ti
    // newer items first (lastUpdateDate is a YYYY-MM-DD string in the CSV)
    const da = a.item.lastUpdateDate ?? ''
    const db = b.item.lastUpdateDate ?? ''
    return db.localeCompare(da)
  })
  return sorted
}

/**
 * Sort threats by tier (mandatory first), then by criticality
 * (Critical > High > Medium > Low), then by threatId for stability.
 */
function sortThreats(
  results: ApplicabilityResult<ThreatData>[]
): ApplicabilityResult<ThreatData>[] {
  const sorted = [...results]
  sorted.sort((a, b) => {
    const ti = TIER_INDEX[a.tier] - TIER_INDEX[b.tier]
    if (ti !== 0) return ti
    const ca = CRITICALITY_RANK[a.item.criticality] ?? 99
    const cb = CRITICALITY_RANK[b.item.criticality] ?? 99
    if (ca !== cb) return ca - cb
    return a.item.threatId.localeCompare(b.item.threatId)
  })
  return sorted
}

/** Apply a flat top-N cap, recording the residual count as `droppedByTier['advisory']`. */
function flatCap<T>(
  results: ApplicabilityResult<T>[],
  max: number | undefined
): { kept: ApplicabilityResult<T>[]; droppedByTier: Record<ApplicabilityTier, number> } {
  const dropped = emptyTierCounts()
  if (max === undefined || max < 0) return { kept: results, droppedByTier: dropped }
  if (results.length <= max) return { kept: results, droppedByTier: dropped }
  const kept = results.slice(0, max)
  for (const r of results.slice(max)) dropped[r.tier] += 1
  return { kept, droppedByTier: dropped }
}

/** Filters library docs to only those in the lens's libraryCategories list. */
export function filterLibraryByCategories(
  results: ApplicabilityResult<LibraryItem>[],
  categories?: string[]
): ApplicabilityResult<LibraryItem>[] {
  if (!categories || categories.length === 0) return results
  const want = new Set(categories)
  return results.filter((r) => r.item.categories.some((c) => want.has(c)))
}

export interface LensedApplicable extends AllApplicable {
  /** Number of items hidden per domain per tier (capped or filtered out) — surfaced as "+N more" hints in the panel. */
  droppedCounts: {
    frameworks: Record<ApplicabilityTier, number>
    library: Record<ApplicabilityTier, number>
    threats: Record<ApplicabilityTier, number>
    timeline: Record<ApplicabilityTier, number>
  }
  lens: PersonaLens
}

/** Applies the persona lens to engine output: filters library by category, then caps per tier. */
export function applyLens(data: AllApplicable, personaId: PersonaId | null): LensedApplicable {
  const lens = getLens(personaId)
  const filteredLibrary = filterLibraryByCategories(data.library, lens.libraryCategories)
  const fw = capByTier(data.frameworks, lens.tierCaps)
  // Library: when flatCaps.libraryMax is set, sort by tier+lastUpdateDate then
  // take top-N (overrides per-tier caps). Otherwise use per-tier caps.
  const lib =
    lens.flatCaps?.libraryMax !== undefined
      ? flatCap(sortLibrary(filteredLibrary), lens.flatCaps.libraryMax)
      : capByTier(filteredLibrary, lens.tierCaps)
  // Documents the category filter left out are hidden too: count them with the capped ones, so the
  // panel's "hidden" total is every library item the role does not see.
  const keptByFilter = new Set(filteredLibrary)
  for (const r of data.library) {
    if (!keptByFilter.has(r)) lib.droppedByTier[r.tier] += 1
  }
  // Threats: when flatCaps.threatsMax is set, sort by tier+criticality then top-N.
  const thr =
    lens.flatCaps?.threatsMax !== undefined
      ? flatCap(sortThreats(data.threats), lens.flatCaps.threatsMax)
      : capByTier(data.threats, lens.tierCaps)
  const tl = capByTier(data.timeline, lens.tierCaps)
  return {
    frameworks: fw.kept,
    library: lib.kept,
    threats: thr.kept,
    timeline: tl.kept,
    droppedCounts: {
      frameworks: fw.droppedByTier,
      library: lib.droppedByTier,
      threats: thr.droppedByTier,
      timeline: tl.droppedByTier,
    },
    lens,
  }
}
