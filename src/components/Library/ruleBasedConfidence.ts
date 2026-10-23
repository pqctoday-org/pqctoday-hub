// SPDX-License-Identifier: AGPL-3.0-only
import type { LibraryItem } from '@/data/libraryData'

/**
 * A confidence score set by a document-type rule (not assessed against the
 * document) is recorded in the row's data-quality notes as
 * "confidence N is rule-based (…), not assessed per document". Readers must be
 * able to tell such a score from an assessed one, so it is shown with that
 * provenance; an assessed score is not shown here at all.
 */
const RULE_BASED = /\bconfidence (\d+) is rule-based\b/

export function ruleBasedConfidenceLabel(item: LibraryItem): string | undefined {
  if (item.confidenceScore == null || !item.dataQualityNotes) return undefined
  const match = RULE_BASED.exec(item.dataQualityNotes)
  if (!match || Number(match[1]) !== item.confidenceScore) return undefined
  return `${item.confidenceScore} (set by document-type rule, not assessed per document)`
}
