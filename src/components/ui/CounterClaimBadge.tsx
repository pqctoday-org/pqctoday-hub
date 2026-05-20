// SPDX-License-Identifier: GPL-3.0-only
/**
 * CounterClaimBadge — T09 of the Trust Engine implementation plan.
 *
 * Lightweight UI affordance that any record card can drop in. Renders only
 * when a counter-claim is registered against the (resourceType, resourceId)
 * pair; otherwise null. Click opens a side-by-side detail dialog.
 *
 * Intentionally narrow surface: cards opt in by importing this component
 * and passing the pair. No store, no global wiring.
 */
import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { getCounterClaims, type CounterClaimRecordType } from '@/data/counterClaimsData'
import { Button } from '@/components/ui/button'

interface CounterClaimBadgeProps {
  recordType: CounterClaimRecordType
  recordId: string
  className?: string
}

export function CounterClaimBadge({
  recordType,
  recordId,
  className = '',
}: CounterClaimBadgeProps) {
  const [open, setOpen] = useState(false)
  const claims = getCounterClaims(recordType, recordId)
  if (claims.length === 0) return null

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 h-auto rounded text-[10px] font-medium uppercase tracking-wide text-status-warning bg-status-warning/10 border border-status-warning/30 hover:bg-status-warning/20 ${className}`}
        aria-label={`${claims.length} authoritative source disagreement${claims.length > 1 ? 's' : ''}`}
        title={`Tier-1 source disagreement on this record (${claims.length} counter-claim${claims.length > 1 ? 's' : ''})`}
      >
        <AlertTriangle className="w-3 h-3" />
        <span>counter-claim{claims.length > 1 ? `s (${claims.length})` : ''}</span>
      </Button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Counter-claim details"
        >
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="relative z-10 w-full max-w-2xl bg-card border border-border rounded-lg shadow-xl max-h-[80vh] overflow-y-auto">
            <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
              <div>
                <p className="text-xs text-muted-foreground capitalize">{recordType}</p>
                <h2 className="text-sm font-semibold text-foreground">
                  Authoritative-source disagreement: {recordId}
                </h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close">
                <X className="w-4 h-4" />
              </Button>
            </header>
            <div className="px-4 py-3 space-y-4">
              {claims.map((c) => (
                <div key={c.claimId} className="rounded border border-border p-3 bg-muted/30">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground">competing source</p>
                      <p className="text-sm font-medium text-foreground font-mono">
                        {c.competingSourceId}
                      </p>
                    </div>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      verified {c.verifiedDate}
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-0.5">competing value</p>
                    <p className="text-sm text-foreground italic">"{c.competingValue}"</p>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-0.5">disagreement summary</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {c.disagreementSummary}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>by @{c.verifiedBy}</span>
                    {c.peerReviewed && (
                      <span className="capitalize">· peer-reviewed: {c.peerReviewed}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
