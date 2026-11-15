// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Clamp a requested starting step (from a `?step=N` link or a simulation embed)
 * into a tool's real step range. A link can carry any number, and several
 * workshop tools index their step array directly, so an out-of-range value
 * would otherwise throw while rendering. Anything that is not a non-negative
 * integer opens the first step.
 */
export function clampStep(step: number | undefined, count: number): number {
  if (step === undefined || !Number.isInteger(step) || step < 0 || count <= 0) return 0
  return Math.min(step, count - 1)
}
