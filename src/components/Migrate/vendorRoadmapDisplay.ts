// SPDX-License-Identifier: AGPL-3.0-only
//
// Pure extraction (2026-08-24, real production feedback on the mobile
// Migrate screen) from VendorRoadmapPanel.tsx -- desktop's JSX for this data
// is a real .tsx component, and src/components/Mobile is not allowed to
// import a desktop view component (no-restricted-imports; see eslint.config
// -js's comment on that rule). This file carries every derived/filtered
// value VendorRoadmapPanel.tsx computes, unchanged, so desktop and mobile
// render the same facts from the same roadmap/enrichment rows -- only the
// JSX differs per platform. Desktop was refactored to consume this file
// rather than keep a second, driftable copy of the same logic.

import type { VendorRoadmap, VendorRoadmapEnrichment } from '@/types/MigrateTypes'

const NONE_DETECTED = 'None detected'

export type GaStatusKind = 'ga' | 'preview' | 'beta' | 'planned'

export interface GaStatusInfo {
  /** The badge colour. For a mixed status this is the least mature part, so
   * a record that is only partly generally available never reads as all GA. */
  kind: GaStatusKind
  label: string
  /** Present only when the status text reports more than one availability
   * state (for example GA for some capabilities and Preview for others),
   * in the order the vendor lists them. */
  mixedKinds?: GaStatusKind[]
}

function gaStatusLabel(kind: GaStatusKind): string {
  switch (kind) {
    case 'ga':
      return 'GA'
    case 'beta':
      return 'Beta'
    case 'preview':
      return 'Preview'
    case 'planned':
      return 'Planned'
  }
}

// Least to most mature; decides the colour of a mixed badge.
const GA_STATUS_MATURITY: GaStatusKind[] = ['planned', 'preview', 'beta', 'ga']

function leadingStatusKind(status: string): GaStatusKind | null {
  const m = SEGMENT_STATUS_RE.exec(status)
  return m ? segmentKind(m[1]) : null
}

/** Drops parenthetical detail and quoted text, which describe a status rather
 * than state one ("Planned (JDK 27 GA in September 2026)" is planned, not GA;
 * 'GA; "...world's first certification"' is GA with a quotation). */
function topLevelStatusText(status: string): string {
  let depth = 0
  let inQuote = false
  let out = ''
  for (const ch of status) {
    if (ch === '"' || ch === '\u201c' || ch === '\u201d') {
      inQuote = !inQuote
      continue
    }
    if (inQuote) continue
    if (ch === '(') depth += 1
    else if (ch === ')') depth = Math.max(0, depth - 1)
    else if (depth === 0) out += ch
  }
  return out
}

const SEGMENT_STATUS_RE =
  /^\s*(ga|general availability|beta|preview|planned|early (?:availability|access))\b/i
const QUALIFIER_STATUS_RE = /\bin\s+(preview|beta)\b/gi

function segmentKind(word: string): GaStatusKind {
  const w = word.toLowerCase()
  if (w === 'ga' || w === 'general availability') return 'ga'
  if (w === 'beta') return 'beta'
  if (w === 'planned') return 'planned'
  return 'preview' // preview, early availability, early access: available to some, not generally
}

/** The distinct availability states a status sentence reports, in order. A
 * vendor sentence such as "GA (X, Y); Preview (Z)" or "GA, with W in preview"
 * reports two; the first state alone would drop the second. */
function statusKinds(status: string): GaStatusKind[] {
  const lead = leadingStatusKind(status)
  if (!lead) return []
  const top = topLevelStatusText(status)
  const kinds: GaStatusKind[] = [lead]
  for (const segment of top.split(';').slice(1)) {
    const m = SEGMENT_STATUS_RE.exec(segment)
    if (m) kinds.push(segmentKind(m[1]))
  }
  for (const m of top.matchAll(QUALIFIER_STATUS_RE)) kinds.push(segmentKind(m[1]))
  return kinds.filter((k, i) => kinds.indexOf(k) === i)
}

/** "ga...", "preview...", "beta...", "planned..." (case-insensitive prefix
 * match, same as VendorRoadmapPanel.tsx always used) -> a category + display
 * label, or null for any other/unrecognized status string. When the status
 * text reports more than one state, the label names all of them ("GA +
 * Preview") instead of reducing the sentence to its first word. */
export function getGaStatusInfo(status: string): GaStatusInfo | null {
  const kinds = statusKinds(status)
  if (kinds.length === 0) return null
  if (kinds.length === 1) return { kind: kinds[0], label: gaStatusLabel(kinds[0]) }
  const leastMature = GA_STATUS_MATURITY.find((k) => kinds.includes(k))!
  return {
    kind: leastMature,
    label: kinds.map(gaStatusLabel).join(' + '),
    mixedKinds: kinds,
  }
}

export type ScopeChipKind = 'portfolio' | 'multi' | 'single' | 'standard'

export interface ScopeChipInfo {
  kind: ScopeChipKind
  label: string
}

/** enrichment.roadmapScope's free-text prefix -> a category + display label.
 * Null for an absent/"None detected"/unrecognized scope, same guard
 * VendorRoadmapPanel.tsx always applied before showing this chip. */
export function getScopeChipInfo(scopeLabel: string | undefined): ScopeChipInfo | null {
  if (!scopeLabel || scopeLabel === NONE_DETECTED) return null
  const s = scopeLabel.toLowerCase()
  if (s.startsWith('portfolio')) return { kind: 'portfolio', label: 'Portfolio strategy' }
  if (s.startsWith('multi')) return { kind: 'multi', label: 'Multi-product' }
  if (s.startsWith('single')) return { kind: 'single', label: 'Single product' }
  if (s.startsWith('algorithm')) return { kind: 'standard', label: 'Standard ref' }
  return null
}

/** Strips a leading "Yes"/"No"/"Partial" qualifier (plus trailing
 * punctuation) off hybridModeSupport, the same regex VendorRoadmapPanel.tsx
 * always used -- callers already gate on hybridModeSupport being present
 * and not "None"-prefixed before calling this. */
export function cleanHybridModeText(hybridModeSupport: string): string {
  return hybridModeSupport.replace(/^(Yes|No|Partial)[;,]?\s*/i, '')
}

export interface VendorRoadmapDateLine {
  label: 'verified' | 'published'
  date: string
}

export interface VendorRoadmapDisplay {
  title: string
  roadmapUrl: string | null
  vendorName: string
  roadmapStatus: VendorRoadmap['status'] | null
  gaStatus: GaStatusInfo | null
  /** The vendor's own status wording, when it says more than the badge does
   * (which capabilities are GA, which are in preview). Null when the badge
   * already says it all. */
  gaStatusDetail: string | null
  scopeChip: ScopeChipInfo | null
  dateLine: VendorRoadmapDateLine | null
  pqcAlgorithms: string[]
  migrationDates: string | null
  hybridModeText: string | null
  complianceFrameworks: string[]
  firstQuote: string | null
  /** True when there's genuinely nothing to show beyond the empty-state
   * message (no URL and no enrichment at all). */
  isEmpty: boolean
}

/** Every derived/filtered value VendorRoadmapPanel.tsx's JSX reads, computed
 * once here so desktop and mobile can't drift. Returns null only when BOTH
 * roadmap and enrichment are undefined (same top guard the desktop
 * component always had) -- callers render nothing in that case. */
export function deriveVendorRoadmapDisplay(
  roadmap: VendorRoadmap | undefined,
  enrichment: VendorRoadmapEnrichment | undefined
): VendorRoadmapDisplay | null {
  if (!roadmap && !enrichment) return null

  const hasUrl = !!roadmap?.roadmapUrl
  let dateLine: VendorRoadmapDateLine | null = null
  if (roadmap?.lastVerifiedDate) dateLine = { label: 'verified', date: roadmap.lastVerifiedDate }
  else if (roadmap?.publishDate) dateLine = { label: 'published', date: roadmap.publishDate }

  const migrationDates =
    enrichment?.targetMigrationDates && enrichment.targetMigrationDates !== NONE_DETECTED
      ? enrichment.targetMigrationDates
      : null

  const hybridModeText =
    enrichment?.hybridModeSupport &&
    enrichment.hybridModeSupport !== NONE_DETECTED &&
    !enrichment.hybridModeSupport.startsWith('None')
      ? cleanHybridModeText(enrichment.hybridModeSupport)
      : null

  const gaStatus = enrichment ? getGaStatusInfo(enrichment.currentGaStatus) : null
  const statusText = enrichment?.currentGaStatus.trim() ?? ''
  const gaStatusDetail =
    gaStatus && statusText && statusText.toLowerCase() !== gaStatus.label.toLowerCase()
      ? statusText
      : null

  return {
    title: roadmap?.roadmapTitle || 'Vendor PQC Roadmap',
    roadmapUrl: hasUrl ? roadmap!.roadmapUrl : null,
    vendorName: roadmap?.vendorName ?? '',
    roadmapStatus: roadmap?.status ?? null,
    gaStatus,
    gaStatusDetail,
    scopeChip: getScopeChipInfo(enrichment?.roadmapScope),
    dateLine,
    pqcAlgorithms: enrichment?.pqcAlgorithms ?? [],
    migrationDates,
    hybridModeText,
    complianceFrameworks: enrichment?.complianceFrameworks ?? [],
    firstQuote:
      enrichment?.keyQuotes && enrichment.keyQuotes.length > 0 ? enrichment.keyQuotes[0] : null,
    isEmpty: !hasUrl && !enrichment,
  }
}
