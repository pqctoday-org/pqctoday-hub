// SPDX-License-Identifier: AGPL-3.0-only
import clsx from 'clsx'
import type { ThreatItem } from '@/data/threatsData'
import { getThreatRecordType, THREAT_RECORD_TYPE_LABELS } from '@/data/threatRecordTypes'

export function ThreatRecordTypeBadge({
  threat,
  className,
}: {
  threat: Pick<ThreatItem, 'threatId' | 'recordType'>
  className?: string
}) {
  const type = getThreatRecordType(threat)
  return (
    <span
      className={clsx(
        'inline-flex rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground',
        className
      )}
    >
      {/* `type` is constrained by the governed ThreatRecordType union. */}
      {THREAT_RECORD_TYPE_LABELS[type] /* eslint-disable-line security/detect-object-injection */}
    </span>
  )
}
