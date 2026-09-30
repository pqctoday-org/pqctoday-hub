// SPDX-License-Identifier: GPL-3.0-only
import { ArrowRightLeft, Filter, SearchX, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * What a reader sees when a deep link could not be honoured as-is.
 *
 * - `kind="widened"`: the linked resource was hidden by the page's default or
 *   saved filters, so they were widened just enough to show it. `onUndo`
 *   restores the reader's previous filters.
 * - `kind="moved"`: the link names something that was retired, merged or
 *   superseded, and the page opened its replacement instead.
 * - `kind="not-found"`: the link names a resource the page does not have
 *   (retired, renamed, draft or mistyped). Before this, pages opened nothing
 *   and said nothing — the link just failed silently.
 *
 * Same look as RetiredThreatNotice, which already does this for /threats.
 */
export function DeepLinkNotice({
  kind,
  message,
  onUndo,
  onDismiss,
}: {
  kind: 'widened' | 'not-found' | 'moved'
  message: string
  onUndo?: () => void
  onDismiss: () => void
}) {
  const Icon = kind === 'widened' ? Filter : kind === 'moved' ? ArrowRightLeft : SearchX
  return (
    <div
      role="status"
      data-testid={`deeplink-notice-${kind}`}
      className="mb-4 flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3 text-sm text-foreground"
    >
      <Icon size={16} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <p className="flex-1 leading-relaxed">{message}</p>
      {onUndo && (
        <Button variant="ghost" size="sm" onClick={onUndo} className="h-7 shrink-0 px-2 text-xs">
          Undo
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={onDismiss}
        aria-label="Dismiss notice"
        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
      >
        <X size={14} aria-hidden="true" />
      </Button>
    </div>
  )
}
