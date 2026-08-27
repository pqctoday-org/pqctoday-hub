// SPDX-License-Identifier: GPL-3.0-only
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
  kind: GaStatusKind
  label: string
}

/** "ga...", "preview...", "beta...", "planned..." (case-insensitive prefix
 * match, same as VendorRoadmapPanel.tsx always used) -> a category + display
 * label, or null for any other/unrecognized status string. */
export function getGaStatusInfo(status: string): GaStatusInfo | null {
  const s = status.toLowerCase()
  if (s.startsWith('ga')) return { kind: 'ga', label: 'GA' }
  if (s.startsWith('beta')) return { kind: 'beta', label: 'Beta' }
  if (s.startsWith('preview')) return { kind: 'preview', label: 'Preview' }
  if (s.startsWith('planned')) return { kind: 'planned', label: 'Planned' }
  return null
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

  return {
    title: roadmap?.roadmapTitle || 'Vendor PQC Roadmap',
    roadmapUrl: hasUrl ? roadmap!.roadmapUrl : null,
    vendorName: roadmap?.vendorName ?? '',
    roadmapStatus: roadmap?.status ?? null,
    gaStatus: enrichment ? getGaStatusInfo(enrichment.currentGaStatus) : null,
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
