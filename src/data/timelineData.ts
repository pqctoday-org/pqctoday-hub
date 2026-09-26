// SPDX-License-Identifier: GPL-3.0-only
import Papa from 'papaparse'
import type {
  CountryData,
  Phase,
  TimelineEvent,
  RegulatoryBody,
  EventType,
  TimelinePhase,
  GanttCountryData,
} from '../types/timeline'
import { complianceFrameworks } from './complianceData'
import { filterActive } from './loaderUtils'
import timelineReviewPolicy from './timelineReviewPolicy.json'

// Re-export types for backward compatibility
export type {
  CountryData,
  Phase,
  TimelineEvent,
  RegulatoryBody,
  EventType,
  TimelinePhase,
  GanttCountryData,
}

// Phase color mappings for Gantt chart visualization
export const phaseColors: Record<Phase, { start: string; end: string; glow: string }> = {
  Discovery: {
    start: 'hsl(var(--phase-discovery))',
    end: 'hsl(var(--phase-discovery))',
    glow: 'hsl(var(--phase-discovery) / 0.5)',
  },
  Testing: {
    start: 'hsl(var(--phase-testing))',
    end: 'hsl(var(--phase-testing))',
    glow: 'hsl(var(--phase-testing) / 0.5)',
  },
  POC: {
    start: 'hsl(var(--phase-poc))',
    end: 'hsl(var(--phase-poc))',
    glow: 'hsl(var(--phase-poc) / 0.5)',
  },
  Migration: {
    start: 'hsl(var(--phase-migration))',
    end: 'hsl(var(--phase-migration))',
    glow: 'hsl(var(--phase-migration) / 0.5)',
  },
  Standardization: {
    start: 'hsl(var(--phase-standardization))',
    end: 'hsl(var(--phase-standardization))',
    glow: 'hsl(var(--phase-standardization) / 0.5)',
  },
  Guidance: {
    start: 'hsl(var(--phase-guidance))',
    end: 'hsl(var(--phase-guidance))',
    glow: 'hsl(var(--phase-guidance) / 0.5)',
  },
  Policy: {
    start: 'hsl(var(--phase-policy))',
    end: 'hsl(var(--phase-policy))',
    glow: 'hsl(var(--phase-policy) / 0.5)',
  },
  Regulation: {
    start: 'hsl(var(--phase-regulation))',
    end: 'hsl(var(--phase-regulation))',
    glow: 'hsl(var(--phase-regulation) / 0.5)',
  },
  Research: {
    start: 'hsl(var(--phase-research))',
    end: 'hsl(var(--phase-research))',
    glow: 'hsl(var(--phase-research) / 0.5)',
  },
  Deadline: {
    start: 'hsl(var(--phase-deadline))',
    end: 'hsl(var(--phase-deadline))',
    glow: 'hsl(var(--phase-deadline) / 0.5)',
  },
}

import { MOCK_CSV_CONTENT } from './mockTimelineData'
import { compareDatasets, type ItemStatus } from '../utils/dataComparison'

// ─── PapaParse-based CSV parser ─────────────────────────────────────────────

interface RawTimelineRow {
  Country: string
  FlagCode: string
  OrgName: string
  OrgFullName: string
  OrgLogoUrl: string
  Type: string
  Category: string
  StartYear: string
  EndYear: string
  Title: string
  Description: string
  SourceUrl: string
  SourceDate: string
  Status: string
  trusted_source_id: string
  local_file: string
  peer_reviewed: string
  vetting_body: string
  source_url_quality: string
  trusted_source_id_status: string
  data_quality_notes: string
  confidence_score?: string
  // DS01 status-column schema (see loaderUtils.ts). Lowercase `status`
  // distinguishes active vs deprecated/obsolete rows — distinct from the
  // capital-S `Status` ("Completed"/"In Progress"/…) that feeds event.status.
  status?: string
  deprecated_at?: string
  deprecated_reason?: string
  related_standards?: string
  // Strict foreign key into library's `reference_id`, ";"-delimited (added
  // 2026-08-14). Distinct from `related_standards` above, which is a LABEL
  // list — free text like 'CNSA 2.0' or 'FedRAMP' that names a standard
  // without pointing at a row. A `library_refs` token always resolves to a
  // library document, because it is only ever written where the timeline
  // row's SourceUrl and that document's download_url are the SAME URL
  // (link_timeline_library_refs.py in priv; the FK is gated by
  // validate_timeline). The two coexist: the label list stays useful for
  // display, the key is what cross-page navigation and scoring can trust.
  library_refs?: string
  entity_type?: string
  // Tags the ONE row per country that is its canonical PQC migration deadline for
  // the sim. Consumed by scripts/gen-timeline-facts.mjs (the single-source codegen).
  is_sim_deadline?: string
  // Curated binding-vs-guidance label for this row (HARD/SOFT/DRAFT, or blank if
  // not yet reviewed). Event-level counterpart to the generated facts' per-country map.
  mandate_type?: string
  // Stable row identity (added 2026-07-16, timeline maintainer-process remediation
  // Phase 3) — sacred once minted, never reused/renamed. Unlocks update_run.py's
  // per-row verify stage and deprecation_sweep.py's rotating checkpoint, both of
  // which previously had no ID column to key on for this source.
  event_id?: string
  // Date this specific row was last human-verified against its primary source
  // (added 2026-07-16, same remediation) — distinct from `SourceDate` (the
  // source document's own publication date). Blank means "never row-verified",
  // which IS the staleness signal; enrichment never sets this field.
  last_verified?: string
  // Added 2026-09-24 (timeline remediation r2). binding_force: the reviewed
  // binding character (binding | mandatory_for_scope | official_target |
  // recommendation | draft | informational), set only by a Claude + Codex
  // agreed review. source_class: primary (the issuer's own publication) or
  // secondary (reputable secondary reporting, allowed when flagged — user
  // decision T5); blank = not yet classified. trusted_source_linked_at: when
  // the trusted_source_id link was made (moved out of the old free-text
  // trusted_source_id_status values).
  binding_force?: string
  source_class?: string
  trusted_source_linked_at?: string
}

// ─── Graded confidence score ─────────────────────────────────────────────────
// Replaces the binary 60/85 confidence_score column with a transparent 0–100
// score derived from signals already present on each row. Computed at load time
// (single source of truth, no CSV churn). Rubric weights:
//   Source-URL quality   30  (authoritative 30 / needs-review 15 / else 0)
//   Peer review + vetting 25 (peer yes 20 / partial 10 / no 0, + 5 if vetted)
//   Source recency        20 (≤12 mo 20 / ≤36 mo 10 / older|missing 0)
//   Cached local evidence 15 (local_file present 15 / else 0)
//   Date specificity      10 (point event 10 / dated range 5 / else 0)
//
// Recency is scored against a `referenceDate` supplied by the caller — the wired
// CSV's own snapshot date (parsed from its `timeline_MMDDYYYY[_rN].csv` filename),
// not `new Date()` at module load. Anchoring to real wall-clock time made every
// row's recency score silently drift downward as calendar time passed, with no
// underlying data change — the same CSV could score differently in CI depending on
// what day it ran. `referenceDate` defaults to `new Date()` only so this function
// stays directly testable without a snapshot date in hand.
export function computeTimelineConfidence(
  row: RawTimelineRow,
  referenceDate: Date = new Date()
): number {
  let score = 0

  // Source-URL quality (30)
  const q = (row.source_url_quality || '').trim()
  if (q === 'url_authoritative') score += 30
  else if (q === 'url_needs_review') score += 15

  // Peer review + vetting body (25)
  const pr = (row.peer_reviewed || '').trim().toLowerCase()
  if (pr === 'yes') score += 20
  else if (pr === 'partial') score += 10
  if ((row.vetting_body || '').trim()) score += 5

  // Source recency (20) — relative to the CSV's own snapshot date
  const sd = (row.SourceDate || '').trim()
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(sd) ? new Date(sd) : null
  if (parsed && !Number.isNaN(parsed.getTime())) {
    const months = (referenceDate.getTime() - parsed.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
    if (months >= 0 && months <= 12) score += 20
    else if (months > 12 && months <= 36) score += 10
  }

  // Cached local evidence (15)
  if ((row.local_file || '').trim()) score += 15

  // Date specificity (10)
  const sy = parseInt(row.StartYear, 10)
  const ey = parseInt(row.EndYear, 10)
  if (!Number.isNaN(sy) && !Number.isNaN(ey)) score += sy === ey ? 10 : 5

  return Math.min(100, score)
}

// A malformed StartYear/EndYear cell (e.g. "Q1 2030", a blank, or an obviously
// out-of-range value) would otherwise flow straight into the Gantt's pixel-position
// math as NaN and silently corrupt the chart's geometry. Reject anything that isn't
// a clean 4-digit year in a sane range, with a loud console warning identifying the
// offending row — fail loudly at load time instead of rendering broken bars.
const MIN_SANE_YEAR = 1990
const MAX_SANE_YEAR = 2100

function parseSaneYear(raw: string | undefined, context: string): number | null {
  const trimmed = (raw ?? '').trim()
  const year = /^\d{4}$/.test(trimmed) ? parseInt(trimmed, 10) : NaN
  if (!Number.isFinite(year) || year < MIN_SANE_YEAR || year > MAX_SANE_YEAR) {
    console.error(
      `[timelineData] Malformed year value ${JSON.stringify(raw)} for ${context} — ` +
        `excluding this row from the Gantt rather than corrupting the chart geometry.`
    )
    return null
  }
  return year
}

const UNREVIEWED_STATUSES: ReadonlySet<string> = new Set(
  timelineReviewPolicy.unreviewedStatuses.map((s) => s.trim().toLowerCase())
)

/**
 * True when a CSV `Status` value marks a row as not yet reviewed
 * (timelineReviewPolicy.json). Such rows are withheld from the public timeline
 * until a reviewer changes their Status (user decision T4, 2026-09-24).
 */
export function isUnreviewedStatus(status: string | undefined): boolean {
  return UNREVIEWED_STATUSES.has((status ?? '').trim().toLowerCase())
}

export interface ParseTimelineOptions {
  /** Keep rows whose Status is unreviewed. Off for everything public. */
  includeUnreviewed?: boolean
}

export function parseTimelineCSV(
  csvContent: string,
  referenceDate: Date = new Date(),
  options: ParseTimelineOptions = {}
): CountryData[] {
  const { data: allRows } = Papa.parse<RawTimelineRow>(csvContent.trim(), {
    header: true,
    skipEmptyLines: true,
  })

  // DS01: exclude deprecated/obsolete rows from the Gantt. Rows without a
  // `status` column are treated as active (backwards-compatible).
  // Timeline remediation r2 T-B1: unreviewed rows are withheld from the public
  // output (they stay in the CSV and in the private review queue).
  const rows = filterActive(allRows).filter(
    (r) => options.includeUnreviewed || !isUnreviewedStatus(r.Status)
  )

  const countriesMap = new Map<string, CountryData>()

  for (const row of rows) {
    if (!row.Country) continue

    const startYear = parseSaneYear(row.StartYear, `${row.Country} / "${row.Title}" (StartYear)`)
    const endYear = parseSaneYear(row.EndYear, `${row.Country} / "${row.Title}" (EndYear)`)
    if (startYear === null || endYear === null) continue

    const countryName = row.Country
    const flagCode = row.FlagCode || ''
    const orgName = row.OrgName || ''

    // Special handling for CNSA (NSA) to create a separate lane
    let effectiveCountryName = countryName
    if (countryName === 'United States' && orgName === 'NSA') {
      effectiveCountryName = 'United States (CNSA)'
    }

    // Ensure country exists
    if (!countriesMap.has(effectiveCountryName)) {
      countriesMap.set(effectiveCountryName, {
        countryName: effectiveCountryName,
        flagCode,
        bodies: [],
      })
    }

    const country = countriesMap.get(effectiveCountryName)!

    // Ensure body exists
    let body = country.bodies.find((b) => b.name === orgName)
    if (!body) {
      body = {
        name: orgName,
        fullName: row.OrgFullName || '',
        logoUrl: row.OrgLogoUrl || '',
        countryCode: flagCode,
        events: [],
      }
      country.bodies.push(body)
    }

    // Create event — PapaParse auto-strips quotes
    const event: TimelineEvent = {
      startYear,
      endYear,
      phase: row.Category as Phase,
      type: (row.Type as EventType) || 'Phase',
      title: row.Title || '',
      description: row.Description || '',
      sourceUrl: row.SourceUrl || '',
      sourceDate: row.SourceDate || '',
      reviewStatus: row.Status?.trim() || undefined,
      peerReviewed:
        (row.peer_reviewed?.toLowerCase() as TimelineEvent['peerReviewed']) || undefined,
      vettingBody: row.vetting_body
        ? row.vetting_body
            .split(';')
            .map((s: string) => s.trim())
            .filter(Boolean)
        : undefined,
      sourceUrlQuality: row.source_url_quality || undefined,
      trustedSourceIdStatus: row.trusted_source_id_status || undefined,
      dataQualityNotes: row.data_quality_notes || undefined,
      confidenceScore: computeTimelineConfidence(row, referenceDate),
      trustedSourceId: row.trusted_source_id || undefined,
      localFile: row.local_file || undefined,
      mandateType: (row.mandate_type?.trim() as TimelineEvent['mandateType']) || undefined,
      entityType: (row.entity_type?.trim() as TimelineEvent['entityType']) || 'government',
      eventId: row.event_id || undefined,
      lastVerified: row.last_verified || undefined,
      bindingForce: (row.binding_force?.trim() as TimelineEvent['bindingForce']) || undefined,
      sourceClass: (row.source_class?.trim() as TimelineEvent['sourceClass']) || undefined,
      complianceRefs: [],
      xwalkEdgeIds: [],
      // Populate denormalized fields
      orgName,
      orgFullName: row.OrgFullName || '',
      orgLogoUrl: row.OrgLogoUrl || '',
      countryName: effectiveCountryName,
      flagCode,
    }

    body.events.push(event)
  }

  return Array.from(countriesMap.values())
}

// ─── File discovery and loading ─────────────────────────────────────────────

function getLatestTimelineFiles(): {
  current: { content: string; filename: string; date: Date } | null
  previous: { content: string; filename: string; date: Date } | null
} {
  // Check for mock data environment variable
  if (import.meta.env.VITE_MOCK_DATA === 'true') {
    console.log('Using mock timeline data for testing')
    return {
      current: { content: MOCK_CSV_CONTENT, filename: 'MOCK_DATA', date: new Date() },
      previous: null,
    }
  }

  // Use import.meta.glob to find all timeline CSV files
  const modules = import.meta.glob('./timeline_*.csv', {
    query: '?raw',
    import: 'default',
    eager: true,
  })

  // Extract filenames and parse dates
  const files = Object.keys(modules)
    .map((path) => {
      // Path format: ./timeline_MMDDYYYY.csv or ./timeline_MMDDYYYY_rN.csv
      // eslint-disable-next-line security/detect-unsafe-regex
      const match = path.match(/timeline_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/)
      if (match) {
        const [, month, day, year, rev] = match
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        const revision = rev ? parseInt(rev) : 0
        // eslint-disable-next-line security/detect-object-injection
        return { path, date, revision, content: modules[path] as string }
      }
      return null
    })
    .filter((f): f is { path: string; date: Date; revision: number; content: string } => f !== null)

  if (files.length === 0) {
    console.warn('No dated timeline CSV files found.')
    return { current: null, previous: null }
  }

  // Sort by date descending, then by revision descending (latest revision wins on same date)
  files.sort((a, b) => {
    const dateDiff = b.date.getTime() - a.date.getTime()
    return dateDiff !== 0 ? dateDiff : b.revision - a.revision
  })

  console.log(`Loading latest timeline data from: ${files[0].path}`)
  if (files.length > 1) {
    console.log(`Comparison data loaded from: ${files[1].path}`)
  }

  return {
    current: {
      content: files[0].content,
      filename: files[0].path.split('/').pop() || files[0].path,
      date: files[0].date,
    },
    previous:
      files.length > 1
        ? {
            content: files[1].content,
            filename: files[1].path.split('/').pop() || files[1].path,
            date: files[1].date,
          }
        : null,
  }
}

/** Snapshot-comparison key: the row's stable event_id, else the legacy composite. */
function changeKey(countryName: string, bodyName: string, e: TimelineEvent): string {
  return e.eventId || `${countryName}:${bodyName}:${e.phase}:${e.title}`
}

// Parse the CSV content to get the timeline data
let parsedData: CountryData[] = []
let metadata: { filename: string; lastUpdate: Date } | null = null

try {
  const { current, previous } = getLatestTimelineFiles()

  if (current) {
    // Score confidence recency against the CSV's own snapshot date (from its
    // filename), not real wall-clock time — see computeTimelineConfidence.
    const currentCountries = parseTimelineCSV(current.content, current.date)
    const previousCountries = previous ? parseTimelineCSV(previous.content, previous.date) : []

    // Flatten events to compare them. Keyed by the stable event_id (timeline
    // remediation r2 W-B: a title edit used to read as a brand-new event), with
    // the old composite as a fallback for rows without one. Only the CONTENT a
    // reader sees is compared — adding a metadata column, or the confidence
    // score drifting with the snapshot date, is not an "Updated" event.
    const flattenEvents = (countries: CountryData[]) => {
      return countries.flatMap((c) =>
        c.bodies.flatMap((b) =>
          b.events.map((e) => ({
            id: changeKey(c.countryName, b.name, e),
            title: e.title,
            description: e.description,
            startYear: e.startYear,
            endYear: e.endYear,
            phase: e.phase,
            type: e.type,
            sourceUrl: e.sourceUrl,
            sourceDate: e.sourceDate,
            reviewStatus: e.reviewStatus,
            mandateType: e.mandateType,
          }))
        )
      )
    }

    const currentEvents = flattenEvents(currentCountries)
    const previousEvents = flattenEvents(previousCountries)

    // Compute status map
    const statusMap = previous
      ? compareDatasets(currentEvents, previousEvents, 'id')
      : new Map<string, ItemStatus>()

    // Inject status into the nested structure
    parsedData = currentCountries.map((c) => ({
      ...c,
      bodies: c.bodies.map((b) => ({
        ...b,
        events: b.events.map((e) => {
          return {
            ...e,
            status: statusMap.get(changeKey(c.countryName, b.name, e)),
          }
        }),
      })),
    }))

    metadata = { filename: current.filename, lastUpdate: current.date }
  } else {
    parsedData = []
  }
} catch (error) {
  console.error('Failed to parse timeline CSV:', error)
  // Fallback to empty array to prevent crash
  parsedData = []
}

// ─── complianceRefs post-pass ────────────────────────────────────────────────
// Inverts compliance.timeline_refs → event.complianceRefs. timeline_refs holds
// "Country:OrgName" tuples (CSVmaintenance.md §5.1), so a framework is attached
// to every event of that country/body. Until 2026-09-24 this looked the tuples
// up by event TITLE — 0 of 80 ever matched, so no event carried a reference
// (timeline remediation r2 W-B). The lane key mirrors the loader's CNSA split.
function attachComplianceRefs(countries: CountryData[]): void {
  const byPair = new Map<string, string[]>()
  for (const fw of complianceFrameworks) {
    for (const ref of fw.timelineRefs ?? []) {
      const key = ref.trim().toLowerCase()
      const arr = byPair.get(key) ?? []
      if (!arr.includes(fw.id)) arr.push(fw.id)
      byPair.set(key, arr)
    }
  }
  for (const country of countries) {
    const csvCountry =
      country.countryName === 'United States (CNSA)' ? 'United States' : country.countryName
    for (const body of country.bodies) {
      const refs = byPair.get(`${csvCountry}:${body.name}`.toLowerCase())
      if (!refs || refs.length === 0) continue
      for (const event of body.events) event.complianceRefs = [...refs]
    }
  }
}

attachComplianceRefs(parsedData)

export const timelineData: CountryData[] = parsedData
export const timelineMetadata = metadata

/**
 * Canonical concept_id for a timeline event. The concept registry keys timeline
 * rows by their stable event_id (all 294 source_row_ids are event_ids); this
 * used to look them up by title, which never matched (timeline remediation r2
 * W-B).
 */
import { conceptIdForStoreKey } from './conceptRegistry'
export function conceptIdForTimelineEvent(event: { eventId?: string }): string | undefined {
  return event.eventId ? conceptIdForStoreKey('timeline', event.eventId) : undefined
}

/**
 * Converts timeline events into Gantt-compatible data with phases and milestones
 */
export function transformToGanttData(countries: CountryData[]): GanttCountryData[] {
  return countries.map((country) => {
    const allEvents = country.bodies.flatMap((body) => body.events)

    // Group events by unique identifier (Phase + Title) to allow multiple phases of same type
    // This is crucial for CNSA which has multiple "Migration" phases
    const phaseMap = new Map<string, TimelineEvent[]>()

    allEvents.forEach((event) => {
      // Create a unique key for grouping
      // For Milestones, we might want to group them if they are the same phase?
      // Actually, for CNSA, we want distinct rows for distinct migration efforts.
      // Let's group by Title if it's a Migration phase, otherwise by Phase.
      let key = event.phase as string

      if (event.phase === 'Migration') {
        key = `${event.phase}-${event.title}`
      } else if (event.phase === 'Deadline') {
        // Keep Deadlines separate too if they have different titles
        key = `${event.phase}-${event.title}`
      }

      if (!phaseMap.has(key)) {
        phaseMap.set(key, [])
      }
      phaseMap.get(key)!.push(event)
    })

    const phases: TimelinePhase[] = []

    // Create phase rows
    phaseMap.forEach((events) => {
      // Sort events by startYear
      events.sort((a, b) => a.startYear - b.startYear)
      const firstEvent = events[0]

      // Determine if this row is a "Milestone" row or "Phase" row
      const isMilestoneRow = events.every((e) => e.type === 'Milestone')
      const rowType: EventType = isMilestoneRow ? 'Milestone' : 'Phase'

      // Calculate phase duration based on events
      const startYear = Math.min(...events.map((e) => e.startYear))
      const endYear = Math.max(...events.map((e) => e.endYear))

      // Extract the actual phase name from the event, not the key
      const phaseName = firstEvent.phase

      // Determine aggregated status for the phase row
      // If ANY event in the group is New/Updated, mark the phase as modified
      const aggregatedStatus = events.some((e) => e.status === 'New')
        ? 'New'
        : events.some((e) => e.status === 'Updated')
          ? 'Updated'
          : undefined

      phases.push({
        startYear,
        endYear,
        phase: phaseName,
        type: rowType,
        title: firstEvent.title,
        description: firstEvent.description,
        events: events,
        status: aggregatedStatus, // Propagate status to UI model
      })
    })

    // Sort phases by start year
    phases.sort((a, b) => a.startYear - b.startYear)

    return {
      country,
      phases,
    }
  })
}

/**
 * Most recent human-verification date across a country's events (CSV
 * `last_verified` column — added 2026-07-16, maintenance-facing, sparse
 * coverage today). Returns undefined when no event for this country has
 * been reviewed yet; callers should render nothing rather than a
 * placeholder in that case (Phase 8.4 — per-country freshness stamp).
 * ISO `YYYY-MM-DD` strings compare correctly lexicographically.
 */
export function getCountryLastVerified(country: CountryData): string | undefined {
  let latest: string | undefined
  for (const body of country.bodies) {
    for (const event of body.events) {
      if (event.lastVerified && (!latest || event.lastVerified > latest)) {
        latest = event.lastVerified
      }
    }
  }
  return latest
}
