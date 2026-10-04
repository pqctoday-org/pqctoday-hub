// SPDX-License-Identifier: GPL-3.0-only
import type { DimensionStatusValue, DraftStage } from './pqcProtocolMatrix'

/**
 * Stage <-> value consistency table for the PQC Protocol Support matrix: for
 * each fine-grained `stage`, the coarse `value`s a dimension may carry. Shared
 * by the matrix audit and the stage-collapse unit tests.
 */
export const STAGE_VALUE_CONSISTENCY: Record<DraftStage, DimensionStatusValue[]> = {
  none: ['na', 'none'],
  na: ['na'],
  identified: ['experimental', 'none'],
  experimental: ['experimental'],
  'individual-draft': ['draft', 'experimental'],
  'wg-document': ['draft'],
  'wg-last-call': ['draft'],
  'iesg-submitted': ['draft'],
  'ietf-last-call': ['draft'],
  'rfc-editor-queue': ['draft', 'rfc'],
  'rfc-published': ['rfc'],
}
