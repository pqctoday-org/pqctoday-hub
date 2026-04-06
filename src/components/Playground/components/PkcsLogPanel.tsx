// SPDX-License-Identifier: GPL-3.0-only
/**
 * PkcsLogPanel — PKCS#11 call log with optional inspect mode.
 *
 * Compact mode: flat list with timestamp, function, args, rv, ms.
 * Inspect mode: each entry with inspect data shows an expand chevron;
 *   expanded view renders mechanism, attribute templates, and outputs
 *   decoded via pkcs11Inspect.ts.
 */
import { useState } from 'react'
import { Copy, Trash2, CheckCircle, Eye, EyeOff, ChevronRight, ChevronDown } from 'lucide-react'
import { Button } from '../../ui/button'
import { useHsmContext } from '../hsm/HsmContext'
import type { Pkcs11LogEntry } from '../../../wasm/softhsm'
import { lookupCkr } from '../../../wasm/pkcs11Inspect'
import { InspectPanel } from '../../shared/Pkcs11InspectPanel'

// ── Log entry row ─────────────────────────────────────────────────────────────

const LogEntryRow = ({ entry, inspectMode }: { entry: Pkcs11LogEntry; inspectMode: boolean }) => {
  const [expanded, setExpanded] = useState(false)
  const hasInspect = inspectMode && !!entry.inspect

  return (
    <div>
      <div
        role={hasInspect ? 'button' : undefined}
        tabIndex={hasInspect ? 0 : undefined}
        className={`flex items-baseline gap-2 text-xs font-mono py-0.5 ${hasInspect ? 'cursor-pointer hover:bg-muted/30 rounded px-1 -mx-1' : ''}`}
        onClick={() => hasInspect && setExpanded((e) => !e)}
        onKeyDown={(ev) =>
          hasInspect && (ev.key === 'Enter' || ev.key === ' ') && setExpanded((e) => !e)
        }
      >
        {hasInspect && (
          <span className="text-muted-foreground shrink-0 w-3">
            {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          </span>
        )}
        {!hasInspect && <span className="w-3" />}
        <span className="text-muted-foreground shrink-0 w-16">{entry.timestamp}</span>
        {entry.engineName === 'rust' && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-warning/20 text-warning shrink-0">
            Rust
          </span>
        )}
        {entry.engineName === 'cpp' && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary shrink-0">
            C++
          </span>
        )}
        {entry.engineName === 'dual' && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-secondary/20 text-secondary shrink-0">
            Dual
          </span>
        )}
        <span className="text-inherit opacity-90 font-bold shrink-0">{entry.fn}</span>
        <span className="text-muted-foreground truncate">{entry.args && `(${entry.args})`}</span>
        <span className="ml-auto shrink-0">→</span>
        <span className={entry.ok ? 'text-status-success shrink-0' : 'text-status-error shrink-0'}>
          {entry.rvName}
        </span>
        <span className="text-muted-foreground shrink-0">[{entry.ms}ms]</span>
      </div>
      {expanded && entry.inspect && <InspectPanel inspect={entry.inspect} />}
      {!entry.ok &&
        (() => {
          const ckr = lookupCkr(parseInt(entry.rvHex, 16) || 0)
          return (
            <div className="ml-8 mb-1 text-[10px] leading-relaxed">
              <span className="text-status-error">{ckr.description}</span>
              {ckr.hint && <span className="text-muted-foreground ml-1.5">— {ckr.hint}</span>}
            </div>
          )
        })()}
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

export const PkcsLogPanel = ({ filterFn }: { filterFn?: (entry: Pkcs11LogEntry) => boolean }) => {
  const { hsmLog, clearHsmLog, inspectMode, toggleInspect } = useHsmContext()
  const [copied, setCopied] = useState(false)

  const filteredLogs = filterFn ? hsmLog.filter(filterFn) : hsmLog

  const copyAll = () => {
    const text = filteredLogs
      .map(
        (e) =>
          `[${e.timestamp}]${e.engineName ? ` [${e.engineName.toUpperCase()}]` : ''} ${e.fn}(${e.args}) → ${e.rvName} ${e.rvHex} [${e.ms}ms]`
      )
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          PKCS#11 Call Log
          <span className="text-xs text-muted-foreground font-normal">
            ({filteredLogs.length} calls)
          </span>
        </h3>
        <div className="flex gap-2">
          <Button
            variant={inspectMode ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={toggleInspect}
            title={inspectMode ? 'Hide parameter decode' : 'Show parameter decode'}
          >
            {inspectMode ? (
              <EyeOff size={12} className="mr-1" />
            ) : (
              <Eye size={12} className="mr-1" />
            )}
            Inspect
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={filteredLogs.length === 0}
            onClick={copyAll}
          >
            {copied ? (
              <CheckCircle size={12} className="mr-1 text-status-success" />
            ) : (
              <Copy size={12} className="mr-1" />
            )}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={clearHsmLog}>
            <Trash2 size={12} className="mr-1" /> Clear
          </Button>
        </div>
      </div>

      {inspectMode && (
        <p className="text-xs text-muted-foreground">
          Click an entry to expand PKCS#11 v3.2 parameter decode.
        </p>
      )}

      {filteredLogs.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          No calls yet — initialize the token and run KEM or Sign operations.
        </p>
      ) : (
        <div className="space-y-0.5">
          {/* Log is newest-first from addHsmLog — reverse to show oldest-first visually */}
          {[...filteredLogs].reverse().map((e) => (
            <LogEntryRow key={e.id} entry={e} inspectMode={inspectMode} />
          ))}
        </div>
      )}
    </div>
  )
}
