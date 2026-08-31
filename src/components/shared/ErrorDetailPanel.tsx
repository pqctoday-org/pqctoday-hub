// SPDX-License-Identifier: GPL-3.0-only
/**
 * ErrorDetailPanel — excType/message + a click-to-expand full traceback.
 * Shared by both pipeline builders' Inspect views (StepInspectPanel on the
 * PKCS#11 side, KmipStepInspectPanel on the KMIP side) — same shape of
 * StepDetail{kind:'error'} data, same presentation, one copy.
 */
import { useState } from 'react'
import { Button } from '../ui/button'

export function ErrorDetailPanel({
  excType,
  message,
  traceback,
}: {
  excType: string
  message: string
  traceback: string
}) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="mt-2 ml-1 pl-2 border-l-2 border-destructive/40 bg-muted/30 rounded-r-lg p-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
        Error detail
      </p>
      <p className="text-xs font-mono text-status-error mb-1.5">
        {excType}: {message}
      </p>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-auto p-0 text-[11px] text-muted-foreground hover:text-foreground hover:underline hover:bg-transparent"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-[9px] opacity-70 mr-1">{expanded ? '▼' : '▶'}</span>
        {expanded ? 'Hide traceback' : 'Show full traceback'}
      </Button>
      {expanded && (
        <pre className="mt-1.5 p-2 bg-background/50 rounded border border-border/30 max-h-56 overflow-auto text-[10px] leading-relaxed whitespace-pre-wrap select-text">
          {traceback}
        </pre>
      )}
    </div>
  )
}
