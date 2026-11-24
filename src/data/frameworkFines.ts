// SPDX-License-Identifier: AGPL-3.0-only
import { getFrameworkById } from './complianceData'

/**
 * Max-penalty lookup for compliance frameworks, in USD millions (rounded to whole
 * millions for headline clarity: these are regulatory maxima, not expected values).
 * The value is the `max_fine_usd_millions` column of the compliance catalogue, so it
 * sits on the framework's own row. Sources are public regulatory documents; a value is
 * the "maximum fine per violation" or "per incident", whichever is higher. Revenue-
 * percentage regimes (GDPR, NIS2) are converted to a representative cap appropriate for a
 * mid-sized regulated enterprise.
 *
 * A framework with no value in its row has no explicit fine data yet and counts as 0
 * (rather than silently taking a false default).
 */

/**
 * Look up the max fine (USD millions) for a framework id. Returns 0 when the
 * framework has none on file: the caller should treat 0 as "no exposure data".
 */
export function getFrameworkMaxFine(frameworkId: string): number {
  if (!frameworkId) return 0
  return getFrameworkById(frameworkId)?.maxFineUsdMillions ?? 0
}
