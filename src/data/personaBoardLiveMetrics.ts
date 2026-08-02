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
import { authoritativeSources } from './authoritativeSourcesData'

/**
 * Live active-row count for the library corpus, read from the same loader
 * every other page uses (`libraryData.ts`, already filtered to `status !==
 * 'deprecated'/'obsolete'` rows). Hardcoding a count would reintroduce the
 * exact staleness problem this value exists to avoid, so it is recomputed
 * from the live import every time this module loads.
 */
export const LIBRARY_ACTIVE_SOURCE_COUNT = libraryData.length

/** Formats an ISO `YYYY-MM-DD` as "D Mon YYYY" (UTC — no local-timezone drift). */
function formatVerifiedDate(isoDate: string): string {
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
 * chip — the most recent `lastVerifiedDate` among authoritative sources that
 * actually feed the compliance CSV (`complianceCsv === true`), read from
 * `authoritativeSourcesData.ts`. There is no single existing "compliance data
 * verified as of" field anywhere else in the codebase, so this derives the
 * closest real equivalent from data that already exists rather than
 * hardcoding a date. `undefined` only if the authoritative-sources CSV
 * somehow has zero compliance-tagged rows with a verified date, which is not
 * expected in practice.
 */
export const REGULATORY_DATA_VERIFIED_DATE: string | undefined = (() => {
  const dates = authoritativeSources
    .filter((s) => s.complianceCsv && s.lastVerifiedDate)
    .map((s) => s.lastVerifiedDate)
    .sort()
  const latest = dates[dates.length - 1]
  return latest ? formatVerifiedDate(latest) : undefined
})()
