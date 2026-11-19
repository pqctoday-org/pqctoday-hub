// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The reader note shown with a partially verified answer, or null when nothing was
 * removed. Plain and neutral: it says what happened, not who or what is at fault.
 */
export function removedStatementsNote(count: number): string | null {
  if (!Number.isFinite(count) || count < 1) return null
  return count === 1
    ? '1 statement from the draft was left out because the retrieved sources did not support it.'
    : `${count} statements from the draft were left out because the retrieved sources did not support them.`
}
