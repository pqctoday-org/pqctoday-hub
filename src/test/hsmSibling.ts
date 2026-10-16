// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The sibling pqctoday-hsm checkout, and what a guard does when it is missing.
 *
 * Owner decision 2026-10-12 ("fail loudly, then move gradually"): a guard that
 * reads the sibling repository no longer skips quietly when it is absent. It
 * throws a clear message, unless the person running it sets ALLOW_MISSING_HSM=1;
 * the run then prints a visible WARNING naming the guard it skipped. GitHub CI
 * never runs these guards (they are local-tier), so CI is unaffected.
 */
import { existsSync } from 'node:fs'
import path from 'node:path'

export const ALLOW_MISSING_ENV = 'ALLOW_MISSING_HSM'

/** Where the sibling checkout is: HSM_REPO_PATH, else ../pqctoday-hsm next to this repository. */
export function hsmRepoPath(root: string = process.cwd()): string {
  return process.env.HSM_REPO_PATH ?? path.resolve(root, '..', 'pqctoday-hsm')
}

export function missingHsmAllowed(): boolean {
  return process.env[ALLOW_MISSING_ENV] === '1'
}

/**
 * True when `probe` exists. When it does not: throws, or, if the run explicitly
 * allows a missing sibling, prints a WARNING and returns false so the caller skips.
 */
export function hsmAvailableOrExplicitSkip(guard: string, probe: string): boolean {
  if (existsSync(probe)) return true
  const reason =
    `${guard} needs the sibling pqctoday-hsm checkout (expected ${probe}). ` +
    `Set HSM_REPO_PATH to its location, or ${ALLOW_MISSING_ENV}=1 to skip this guard knowingly.`
  if (missingHsmAllowed()) {
    console.warn(`WARNING: guard skipped, ${reason}`)
    return false
  }
  throw new Error(reason)
}
