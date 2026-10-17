// SPDX-License-Identifier: AGPL-3.0-only

export type SourceFreshness = 'recorded' | 'older-than-year' | 'not-tracked' | 'invalid'

export function sourceFreshness(
  lastVerified?: string,
  referenceDate: Date = new Date()
): SourceFreshness {
  if (!lastVerified) return 'not-tracked'
  const checked = new Date(`${lastVerified}T00:00:00Z`)
  if (Number.isNaN(checked.getTime())) return 'invalid'
  const ageDays = Math.floor((referenceDate.getTime() - checked.getTime()) / 86_400_000)
  if (ageDays < 0) return 'invalid'
  return ageDays > 365 ? 'older-than-year' : 'recorded'
}

const META: Record<SourceFreshness, { label: string; className: string }> = {
  recorded: {
    label: 'Source check recorded',
    className: 'border-status-success/30 bg-status-success/10 text-status-success',
  },
  'older-than-year': {
    label: 'Source check over 12 months old',
    className: 'border-status-warning/30 bg-status-warning/10 text-status-warning',
  },
  'not-tracked': {
    label: 'No source-check date',
    className: 'border-border bg-muted/40 text-muted-foreground',
  },
  invalid: {
    label: 'Invalid source-check date',
    className: 'border-status-error/30 bg-status-error/10 text-status-error',
  },
}

export function SourceFreshnessBadge({ lastVerified }: { lastVerified?: string }) {
  const meta = META[sourceFreshness(lastVerified)]
  return (
    <span
      className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-medium ${meta.className}`}
      title={
        lastVerified
          ? `${meta.label}: ${lastVerified}. This records a catalogue source check, not continuing legal validity.`
          : `${meta.label}. Absence means freshness has not been recorded, not that the source is obsolete.`
      }
    >
      {meta.label}
      {lastVerified ? ` · ${lastVerified}` : ''}
    </span>
  )
}
