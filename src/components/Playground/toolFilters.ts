// SPDX-License-Identifier: GPL-3.0-only
/**
 * Pure predicates shared by the PlaygroundWorkshop filter pipeline.
 * Keep this file framework-free so it can be unit-tested in isolation.
 */

/** Case-insensitive algorithm-tag match used by the researcher taxonomy filter. */
export function toolMatchesAlgorithm(
  tool: { algorithms: string[] },
  algorithm: string | null
): boolean {
  if (!algorithm) return true
  const target = algorithm.toLowerCase()
  return tool.algorithms.some((a) => a.toLowerCase() === target)
}
