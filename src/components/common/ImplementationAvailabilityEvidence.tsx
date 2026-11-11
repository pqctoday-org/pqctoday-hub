// SPDX-License-Identifier: AGPL-3.0-only
import type { LiveDeployment } from '@/data/pqcProtocolMatrix'

/** Release/API support evidence is useful without implying production deployment. */
export function ImplementationAvailabilityEvidence({
  entries,
  compact = false,
}: {
  entries: readonly LiveDeployment[]
  compact?: boolean
}) {
  if (!entries.length) return null
  const label = `${entries.length} vendor availability ${entries.length === 1 ? 'report' : 'reports'}`
  if (compact) {
    return (
      <span
        className="text-xs text-muted-foreground"
        title={entries.map((e) => `${e.provider} — ${e.what}`).join('\n')}
      >
        {label}
      </span>
    )
  }
  return (
    <section aria-label="Vendor implementation availability" className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">
        Vendor availability ({entries.length})
      </h3>
      <p className="text-xs text-muted-foreground">
        Release and API support; these references do not establish production deployment.
      </p>
      {entries.map((entry) => (
        <a
          key={entry.referenceUrl}
          href={entry.referenceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-md border border-border bg-muted/20 p-2 text-xs text-foreground"
        >
          <span className="font-semibold">{entry.provider}</span>
          {entry.since && <span> — available since {entry.since}</span>}
          <p className="mt-1 text-muted-foreground">{entry.what}</p>
        </a>
      ))}
    </section>
  )
}
