// SPDX-License-Identifier: GPL-3.0-only
import { Archive, X } from 'lucide-react'
import type { RetiredThreat } from '@/data/threatsData'
import { Button } from '@/components/ui/button'
import { retiredThreatMessage } from '@/data/threatRowRules'

/**
 * What a reader sees when an old link (`/threats?id=<id>`) names a threat that
 * has since been retired. Before this, the page opened nothing and said
 * nothing — the link just failed silently.
 */
export function RetiredThreatNotice({
  retired,
  onDismiss,
}: {
  retired: RetiredThreat
  onDismiss: () => void
}) {
  return (
    <div
      role="status"
      className="mb-4 flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3 text-sm text-foreground"
    >
      <Archive size={16} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <p className="flex-1 leading-relaxed">{retiredThreatMessage(retired)}</p>
      <Button
        variant="ghost"
        size="icon"
        onClick={onDismiss}
        aria-label="Dismiss retired-entry notice"
        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
      >
        <X size={14} aria-hidden="true" />
      </Button>
    </div>
  )
}
