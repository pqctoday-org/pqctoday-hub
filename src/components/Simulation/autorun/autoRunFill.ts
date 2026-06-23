// SPDX-License-Identifier: GPL-3.0-only
/**
 * Transient flag: true while the auto-run playthrough is active, so embedded tools
 * initialize their forms with demo content sourced from the framework / hub data /
 * assessment (see each tool's demo-fill block).
 *
 * Deliberately a plain module-level flag, NOT a store and NOT persisted: tools read
 * it once in their `useState` initializer (the player sets it before tools mount
 * during a run, clears it on stop/finish), so it can never affect normal manual
 * tool use.
 */
let active = false

export const setAutoRunFill = (v: boolean): void => {
  active = v
}

export const isAutoRunFillActive = (): boolean => active
