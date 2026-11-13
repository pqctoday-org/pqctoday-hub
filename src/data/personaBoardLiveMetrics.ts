// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The two role-board values sourced from CSV-backed data, extracted from
 * `personaConfig.ts` on 2026-08-02.
 *
 * `libraryData.ts` and `authoritativeSourcesData.ts` both call
 * `import.meta.glob(...)` at module scope to read their CSVs — a Vite build-time
 * macro that only resolves inside a Vite context (dev server, `vite build`, or
 * vitest, which runs through Vite's own transform). It throws in plain Node/tsx
 * execution. `personaConfig.ts` used to import both directly for these two
 * values, which meant the ENTIRE file — including the role-board content the
 * generator script (`scripts/generate-role-board-content.ts`) needs to read via
 * plain `tsx` — was unimportable outside a browser or vitest.
 *
 * Isolating just these two glob-dependent constants here means
 * `personaConfig.ts` no longer touches `import.meta.glob` at all, so the
 * generator can import the rest of it directly.
 */
import { libraryData } from './libraryData'
import { complianceFrameworks } from './complianceData'
import { timelineData } from './timelineData'
import { recordedDateCoverage, recordedDateCoveragePhrase } from './recordedDateCoverage'

/**
 * Live active-row count for the library corpus, read from the same loader
 * every other page uses (`libraryData.ts`, already filtered to `status !==
 * 'deprecated'/'obsolete'` rows). Hardcoding a count would reintroduce the
 * exact staleness problem this value exists to avoid, so it is recomputed
 * from the live import every time this module loads.
 */
export const LIBRARY_ACTIVE_SOURCE_COUNT = libraryData.length

/** Formats an ISO `YYYY-MM-DD` as "D Mon YYYY" (UTC — no local-timezone drift). */
export function formatVerifiedDate(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return isoDate
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** Separate populations from the same active-row loaders the boards use. */
export const REGULATORY_SOURCE_DATE_COVERAGE = {
  compliance: recordedDateCoverage(complianceFrameworks.map((f) => f.lastVerified)),
  timeline: recordedDateCoverage(
    timelineData.flatMap((country) =>
      country.bodies.flatMap((body) => body.events.map((event) => event.lastVerified))
    )
  ),
}

export const REGULATORY_SOURCE_COVERAGE_PHRASE =
  'Recorded checking dates — ' +
  [
    recordedDateCoveragePhrase('Compliance', REGULATORY_SOURCE_DATE_COVERAGE.compliance),
    recordedDateCoveragePhrase('Timeline', REGULATORY_SOURCE_DATE_COVERAGE.timeline),
  ].join('. ') +
  '. Metadata coverage, not independent review.'

/** Compatibility newest-date value; never use alone as a whole-corpus review claim. */
export const REGULATORY_DATA_VERIFIED_DATE: string | undefined = (() => {
  const latest = [
    REGULATORY_SOURCE_DATE_COVERAGE.compliance.newestDate,
    REGULATORY_SOURCE_DATE_COVERAGE.timeline.newestDate,
  ]
    .filter((date): date is string => Boolean(date))
    .sort()
    .at(-1)
  return latest ? formatVerifiedDate(latest) : undefined
})()
