// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect, useRef } from 'react'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import clsx from 'clsx'

export interface LogEntry {
  status: 'pending' | 'success' | 'error'
  message: string
  durationMs?: number
}

interface WorkshopOperationLogProps {
  entries: LogEntry[]
  className?: string
}

/**
 * Structured log panel for async WASM operations — ux-standard.md §S4.13.
 *
 * Renders a scrollable monospace list of log entries with per-row status
 * icons. Auto-scrolls to the bottom on new entries. Announces changes to
 * screen readers via aria-live="polite". When any entry is `pending`, an
 * indeterminate progress bar runs at the top of the log so users can see
 * an operation is in flight without reading the per-row icons.
 */
export const WorkshopOperationLog: React.FC<WorkshopOperationLogProps> = ({
  entries,
  className,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null)
  const hasPending = entries.some((e) => e.status === 'pending')

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' })
  }, [entries.length])

  if (entries.length === 0) return null

  return (
    <div
      role="log"
      aria-live="polite"
      aria-label="Operation log"
      aria-busy={hasPending}
      className={clsx(
        'bg-muted rounded-lg p-3 font-mono text-xs max-h-32 overflow-y-auto space-y-1',
        className
      )}
    >
      {hasPending && (
        <div
          className="relative -m-1 mb-1 h-1 overflow-hidden rounded-full bg-primary/20"
          role="progressbar"
          aria-label="Operation in progress"
        >
          <div className="absolute inset-y-0 left-0 w-1/3 animate-workshop-progress rounded-full bg-primary" />
        </div>
      )}
      {entries.map((entry, idx) => (
        <div key={idx} className="flex items-start gap-1.5 min-w-0">
          <span className="shrink-0 mt-px">
            {entry.status === 'pending' && (
              <Loader2 size={12} className="animate-spin text-primary" />
            )}
            {entry.status === 'success' && (
              <CheckCircle2 size={12} className="text-status-success" />
            )}
            {entry.status === 'error' && <XCircle size={12} className="text-status-error" />}
          </span>
          <span
            className={clsx(
              'break-all',
              entry.status === 'error' && 'text-status-error',
              entry.status === 'success' && 'text-foreground',
              entry.status === 'pending' && 'text-muted-foreground'
            )}
          >
            {entry.message}
            {entry.durationMs !== undefined && (
              <span className="ml-1.5 text-muted-foreground/60">[{entry.durationMs}ms]</span>
            )}
          </span>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
