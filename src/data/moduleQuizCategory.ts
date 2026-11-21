// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Explicit mapping from Learn module IDs whose quiz questions live in a
 * shared or domain-grouped quiz category (instead of a 1:1 category ID).
 */
export const MODULE_QUIZ_CATEGORY_MAP: Record<string, string> = {
  'custody-threats-controls': 'digital-assets',
  'custody-lifecycle-ops': 'digital-assets',
  'custody-pqc-migration': 'digital-assets',
  'custody-governance': 'digital-assets',
  'ai-crypto-attacks': 'ai-crypto-threats',
}

/** Resolve a Learn module ID to its quiz category ID (defaults to moduleId). */
export function resolveModuleQuizCategory(moduleId: string): string {
  // eslint-disable-next-line security/detect-object-injection
  return MODULE_QUIZ_CATEGORY_MAP[moduleId] ?? moduleId
}
