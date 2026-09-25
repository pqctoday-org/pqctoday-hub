// SPDX-License-Identifier: GPL-3.0-only
export type Phase =
  | 'Discovery'
  | 'Testing'
  | 'POC'
  | 'Migration'
  | 'Standardization'
  | 'Guidance'
  | 'Policy'
  | 'Regulation'
  | 'Research'
  | 'Deadline'

export type EventType = 'Phase' | 'Milestone'

// Org classification for the timeline category filter (FR-T-06).
// 'government' = national/supranational agencies & regulators;
// 'standards'  = formal SDOs + cross-industry consortia;
// 'vendor'     = commercial vendors, hardware, blockchain (off by default).
export type EntityType = 'government' | 'standards' | 'vendor'

export interface TimelineEvent {
  startYear: number
  endYear: number
  phase: Phase
  type: EventType
  title: string
  description: string
  sourceUrl?: string
  sourceDate?: string
  // CHANGE status relative to the previous CSV snapshot ('New' | 'Updated'), set by
  // the loader's snapshot comparison. NOT the CSV's editorial `Status` column —
  // that is `reviewStatus` below (split 2026-09-24, timeline remediation r2 T-B1:
  // the comparison used to overwrite it, so no component ever saw it).
  status?: string
  // The CSV's capital-S `Status`, verbatim (Validated / Completed / Active / …).
  // Rows whose review status is unreviewed (timelineReviewPolicy.json) never
  // reach the public loader output.
  reviewStatus?: string
  peerReviewed?: 'yes' | 'no' | 'partial'
  vettingBody?: string[]
  sourceUrlQuality?: string
  trustedSourceIdStatus?: string
  dataQualityNotes?: string
  confidenceScore?: number

  // New fields — populated from CSV columns (FR-T-02)
  trustedSourceId?: string
  localFile?: string

  // Curated binding-vs-guidance label for this specific row, from the CSV
  // `mandate_type` column (event-level — distinct from the generated facts'
  // country-level fallback, which only covers the one row per country tagged
  // `is_sim_deadline`). Absent when the row hasn't been reviewed yet.
  mandateType?: 'HARD' | 'SOFT' | 'DRAFT'

  // Org classification for the category filter (FR-T-06)
  entityType: EntityType

  // Stable row identity (added 2026-07-16). `lastVerified` is the CSV's
  // `last_verified` column, which today is a bulk stamp (stamp-last-verified.py,
  // close-remaining-coverage.py), NOT a per-row claim decision — do not present
  // it as "verified" in the UI (timeline remediation r2 §1 #11).
  eventId?: string
  lastVerified?: string

  // Derived fields — populated at load time, not from CSV (FR-T-05)
  complianceRefs?: string[]
  xwalkEdgeIds?: string[]

  // Denormalized fields for convenient access
  orgName: string
  orgFullName: string
  orgLogoUrl?: string
  countryName: string
  flagCode: string
}

export interface TimelinePhase {
  startYear: number
  endYear: number
  phase: string
  type: EventType
  title: string
  description: string
  events: TimelineEvent[]
  status?: 'New' | 'Updated'
}

export interface RegulatoryBody {
  name: string
  fullName: string
  logoUrl?: string
  countryCode: string
  events: TimelineEvent[]
  status?: 'New' | 'Updated'
}

export interface CountryData {
  countryName: string
  flagCode: string
  bodies: RegulatoryBody[]
  status?: 'New' | 'Updated'
}

export interface GanttCountryData {
  country: CountryData
  phases: TimelinePhase[]
}
