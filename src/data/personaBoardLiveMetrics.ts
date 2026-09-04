// SPDX-License-Identifier: GPL-3.0-only
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

/**
 * Live "regulatory data last verified" date for the executive board's proof
 * chip — the most recent `last_verified` across the regulatory data itself
 * (`compliance_*.csv` frameworks and `timeline_*.csv` events), not the
 * registry of authoritative sources that merely cite it.
 *
 * Changed 2026-09-03: this used to take the latest `lastVerifiedDate` among
 * authoritative sources flagged `complianceCsv === true` — 55 registry rows,
 * max 2026-07-16 — while the compliance rows themselves were verified to
 * 2026-08-16 and the timeline rows to 2026-08-29. The chip understated the
 * data's real freshness by four to six weeks, and two boards carried the
 * phrase as a hand-typed literal that could only drift further from it. This
 * reads the dates the "regulatory data verified" claim is actually about.
 */
export const REGULATORY_DATA_VERIFIED_DATE: string | undefined = (() => {
  const complianceDates = complianceFrameworks
    .map((f) => f.lastVerified)
    .filter((d): d is string => Boolean(d))
  const timelineDates = timelineData.flatMap((country) =>
    country.bodies.flatMap((body) =>
      body.events.map((event) => event.lastVerified).filter((d): d is string => Boolean(d))
    )
  )
  const latest = [...complianceDates, ...timelineDates].sort().at(-1)
  return latest ? formatVerifiedDate(latest) : undefined
})()
