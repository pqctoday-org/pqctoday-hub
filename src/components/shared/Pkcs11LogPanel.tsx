// SPDX-License-Identifier: GPL-3.0-only
/**
 * Pkcs11LogPanel — prop-based PKCS#11 call log for learning modules.
 *
 * Self-contained (no HsmContext dependency). Pass log entries from useHSM().
 * Default: collapsible, starts collapsed.
 */
import { useState } from 'react'
import { ChevronDown, ChevronRight, Trash2, Copy, CheckCircle } from 'lucide-react'
import { Button } from '../ui/button'
import type { Pkcs11LogEntry } from '../../wasm/softhsm'

// ── Entry row ────────────────────────────────────────────────────────────────

const LogEntryRow = ({ entry }: { entry: Pkcs11LogEntry }) => {
  const rvColor = entry.ok
    ? 'text-status-success'
    : entry.rvHex === '0x00000150'
      ? 'text-status-warning'
      : 'text-status-error'

  return (
    <div className="grid grid-cols-[7rem_12rem_1fr_6rem_4rem] gap-x-2 text-xs font-mono py-0.5 border-b border-border/10 last:border-0 hover:bg-muted/30 px-1 rounded items-start">
      <span className="text-muted-foreground shrink-0">{entry.timestamp}</span>
      <span className="text-primary font-semibold truncate" title={entry.fn}>
        {entry.fn}
      </span>
      <span className="text-foreground/70 truncate" title={entry.args}>
        {entry.args || '—'}
      </span>
      <span className={`${rvColor} shrink-0`}>{entry.rvName}</span>
      <span className="text-muted-foreground shrink-0 text-right">{entry.ms}ms</span>
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

interface Pkcs11LogPanelProps {
  log: Pkcs11LogEntry[]
  onClear?: () => void
  title?: string
  defaultOpen?: boolean
  className?: string
  /** Empty-state message shown when log has no entries */
  emptyMessage?: string
}

export const Pkcs11LogPanel = ({
  log,
  onClear,
  title = 'PKCS#11 Call Log',
  defaultOpen = false,
  className = '',
  emptyMessage = 'No PKCS#11 calls yet — run a live operation to see activity.',
}: Pkcs11LogPanelProps) => {
  const [open, setOpen] = useState(defaultOpen)
  const [copied, setCopied] = useState(false)

  const copyAll = () => {
    const text = [...log]
      .reverse()
      .map((e) => `[${e.timestamp}] ${e.fn}(${e.args}) → ${e.rvName} ${e.rvHex} [${e.ms}ms]`)
      .join('\n')
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => {})
  }

  return (
    <div className={`glass-panel p-3 ${className}`}>
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 text-sm font-semibold"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          {open ? (
            <ChevronDown size={14} className="text-muted-foreground" />
          ) : (
            <ChevronRight size={14} className="text-muted-foreground" />
          )}
          {title}
          <span className="text-xs font-normal text-muted-foreground">({log.length} calls)</span>
        </span>
        {/* role="presentation" + onKeyDown satisfies jsx-a11y for stopPropagation wrapper */}
        <span
          role="presentation"
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {onClear && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-xs"
              disabled={log.length === 0}
              onClick={onClear}
              title="Clear log"
            >
              <Trash2 size={11} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-xs"
            disabled={log.length === 0}
            onClick={copyAll}
            title="Copy all entries"
          >
            {copied ? (
              <CheckCircle size={11} className="text-status-success" />
            ) : (
              <Copy size={11} />
            )}
          </Button>
        </span>
      </button>

      {/* Body */}
      {open && (
        <div className="mt-2">
          {log.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">{emptyMessage}</p>
          ) : (
            <div className="space-y-0 max-h-64 overflow-y-auto">
              {/* Log is newest-first; display oldest-first */}
              {[...log].reverse().map((e) => (
                <LogEntryRow key={e.id} entry={e} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
