// SPDX-License-Identifier: AGPL-3.0-only
import type { ComplianceFramework } from '@/data/complianceData'
import { sourceFreshness } from './SourceFreshnessBadge'

export interface ComplianceDataQualitySummary {
  total: number
  sourceCheckRecorded: number
  sourceCheckOlderThanYear: number
  sourceCheckMissing: number
  bindingRows: number
  bindingRowsMissingBasis: number
}

export function summarizeComplianceDataQuality(
  frameworks: readonly ComplianceFramework[],
  referenceDate: Date = new Date()
): ComplianceDataQualitySummary {
  const bindingRows = frameworks.filter(
    (framework) =>
      framework.bindingStatus === 'binding' || framework.bindingStatus === 'mandatory_for_scope'
  )
  return {
    total: frameworks.length,
    sourceCheckRecorded: frameworks.filter(
      (framework) => sourceFreshness(framework.lastVerified, referenceDate) === 'recorded'
    ).length,
    sourceCheckOlderThanYear: frameworks.filter(
      (framework) => sourceFreshness(framework.lastVerified, referenceDate) === 'older-than-year'
    ).length,
    sourceCheckMissing: frameworks.filter(
      (framework) => sourceFreshness(framework.lastVerified, referenceDate) === 'not-tracked'
    ).length,
    bindingRows: bindingRows.length,
    bindingRowsMissingBasis: bindingRows.filter((framework) => !framework.bindingBasis).length,
  }
}
