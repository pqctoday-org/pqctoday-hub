// SPDX-License-Identifier: GPL-3.0-only
/**
 * Pkcs11LogPanel — prop-based PKCS#11 call log for learning modules.
 *
 * Self-contained (no HsmContext dependency). Pass log entries from useHSM().
 * Rows with inspect data show a ▶ chevron — click to expand decoded parameters.
 * Default: collapsible, starts collapsed.
 */
import { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Trash2,
  Copy,
  CheckCircle,
  Eye,
  BookOpenText,
  Filter,
} from 'lucide-react'
import { Button } from '../ui/button'
import type { Pkcs11LogEntry } from '../../wasm/softhsm'
import { lookupCkr } from '../../wasm/pkcs11Inspect'
import { InspectPanel } from './Pkcs11InspectPanel'
import { pkcs11PlainEnglish } from '../../wasm/pkcs11PlainEnglish'

// ── Entry row ────────────────────────────────────────────────────────────────

const LogEntryRow = ({
  entry,
  inspectMode,
  beginnerMode,
}: {
  entry: Pkcs11LogEntry
  inspectMode: boolean
  beginnerMode: boolean
}) => {
  const [expanded, setExpanded] = useState(false)

  if (entry.isStepHeader) {
    return (
      <div className="py-1 px-1 mt-1 text-[11px] font-mono font-semibold text-primary/80 border-t border-border/50 bg-muted/20 -mx-1 rounded-sm">
        {entry.fn}
      </div>
    )
  }

  const hasInspect = inspectMode && !!entry.inspect

  const rvColor = entry.ok
    ? 'text-status-success'
    : entry.rvHex === '0x00000150'
      ? 'text-status-warning'
      : 'text-status-error'

  const english = beginnerMode ? pkcs11PlainEnglish(entry.fn, entry.args || '') : ''

  return (
    <div>
      <div
        role={hasInspect ? 'button' : undefined}
        tabIndex={hasInspect ? 0 : undefined}
        aria-expanded={hasInspect ? expanded : undefined}
        className={`grid ${
          beginnerMode
            ? 'grid-cols-[1rem_7rem_12rem_1fr_6rem_4rem_12rem]'
            : 'grid-cols-[1rem_7rem_12rem_1fr_6rem_4rem]'
        } gap-x-2 text-xs font-mono py-0.5 border-b border-border/10 last:border-0 px-1 rounded items-start
          ${hasInspect ? 'cursor-pointer hover:bg-muted/30' : ''}`}
        onClick={hasInspect ? () => setExpanded((v) => !v) : undefined}
        onKeyDown={
          hasInspect
            ? (e) => (e.key === 'Enter' || e.key === ' ') && setExpanded((v) => !v)
            : undefined
        }
      >
        {/* Expand chevron */}
        <span className="flex items-center justify-center mt-0.5">
          {hasInspect ? (
            expanded ? (
              <ChevronDown size={10} className="text-muted-foreground" />
            ) : (
              <ChevronRight size={10} className="text-muted-foreground" />
            )
          ) : (
            <span className="w-2.5" />
          )}
        </span>
        <span className="text-muted-foreground shrink-0">{entry.timestamp}</span>
        <span className="text-primary font-semibold truncate" title={entry.fn}>
          {entry.fn}
        </span>
        <span className="text-foreground/70 truncate" title={entry.args}>
          {entry.args || '—'}
        </span>
        <span className={`${rvColor} shrink-0`}>{entry.rvName}</span>
        <span className="text-muted-foreground shrink-0 text-right">{entry.ms}ms</span>
        {beginnerMode && (
          <span
            className="text-muted-foreground italic truncate font-sans"
            title={english || undefined}
          >
            {english || ''}
          </span>
        )}
      </div>

      {/* Inspect drawer — reuses the same InspectPanel as the HSM Playground */}
      {expanded && entry.inspect && <InspectPanel inspect={entry.inspect} />}

      {/* Error hint */}
      {!entry.ok &&
        (() => {
          const ckr = lookupCkr(parseInt(entry.rvHex, 16) || 0)
          return (
            <div className="ml-4 mb-0.5 text-[10px] leading-relaxed">
              <span className="text-status-error">{ckr.description}</span>
              {ckr.hint && <span className="text-muted-foreground ml-1.5">— {ckr.hint}</span>}
            </div>
          )
        })()}
    </div>
  )
}

// ── PKCS#11 function classification ──────────────────────────────────────────

const CRYPTO_OPS = new Set([
  'C_GenerateKeyPair',
  'C_GenerateKey',
  'C_DeriveKey',
  'C_WrapKey',
  'C_UnwrapKey',
  'C_EncryptInit',
  'C_Encrypt',
  'C_EncryptUpdate',
  'C_EncryptFinal',
  'C_DecryptInit',
  'C_Decrypt',
  'C_DecryptUpdate',
  'C_DecryptFinal',
  'C_SignInit',
  'C_Sign',
  'C_SignUpdate',
  'C_SignFinal',
  'C_VerifyInit',
  'C_Verify',
  'C_VerifyUpdate',
  'C_VerifyFinal',
  'C_DigestInit',
  'C_Digest',
  'C_DigestUpdate',
  'C_DigestFinal',
  // KEM extensions (CKM_ML_KEM)
  'C_EncapsulateKey',
  'C_DecapsulateKey',
  // PKCS#11 v3.2 Message API (ML-DSA, SLH-DSA multi-message sign/verify)
  'C_MessageSignInit',
  'C_SignMessage',
  'C_SignMessageBegin',
  'C_SignMessageNext',
  'C_MessageSignFinal',
  'C_MessageVerifyInit',
  'C_VerifyMessage',
  'C_VerifyMessageBegin',
  'C_VerifyMessageNext',
  'C_MessageVerifyFinal',
])

// ── Main panel ────────────────────────────────────────────────────────────────

interface Pkcs11LogPanelProps {
  log: Pkcs11LogEntry[]
  onClear?: () => void
  title?: string
  defaultOpen?: boolean
  className?: string
  /** Empty-state message shown when log has no entries */
  emptyMessage?: string
  /**
   * When provided, only entries whose fn matches one of these names are shown.
   * Use to surface only the operations relevant to the current use-case
   * (e.g. ['C_GenerateKeyPair', 'C_Sign']) — hides the identical init sequence.
   */
  filterFns?: string[]
  /**
   * When true, reveal the Beginner-mode toggle that adds a trailing column
   * with a short plain-English phrase per call. Raw fn/args/rv fields are
   * never edited — Beginner mode is purely additive.
   */
  showBeginnerMode?: boolean
}

export const Pkcs11LogPanel = ({
  log,
  onClear,
  title = 'PKCS#11 Call Log',
  defaultOpen = false,
  className = '',
  emptyMessage = 'No PKCS#11 calls yet — run a live operation to see activity.',
  filterFns,
  showBeginnerMode = false,
}: Pkcs11LogPanelProps) => {
  const [open, setOpen] = useState(defaultOpen)
  const [copied, setCopied] = useState(false)
  const [inspectMode, setInspectMode] = useState(false)
  const [beginnerMode, setBeginnerMode] = useState(false)
  const [hideAdminOps, setHideAdminOps] = useState(true)

  const visibleLog = log.filter((e) => {
    if (e.isStepHeader) return true
    // Crypto-only filter: hide everything that isn't a core crypto operation
    if (hideAdminOps && !CRYPTO_OPS.has(e.fn)) return false
    if (!inspectMode && e.fn === 'C_GetAttributeValue') return false
    if (!inspectMode && e.fn === 'C_FindObjects') return false
    if (CRYPTO_OPS.has(e.fn)) return true
    if (filterFns && filterFns.length > 0) {
      if (inspectMode) return true // Show all operations in inspect mode to aid diagnosis
      return filterFns.includes(e.fn)
    }
    return true
  })

  const inspectableCount = visibleLog.filter((e) => !!e.inspect).length

  // Build display order: newest section first, but chronological inside the section.
  const orderedLog = (() => {
    // 1. Convert to chronological (oldest-first) to group properly
    const chronologicalLog = [...visibleLog].reverse()
    const groups: Pkcs11LogEntry[][] = []
    let currentGroup: Pkcs11LogEntry[] = []

    for (const e of chronologicalLog) {
      if (e.isStepHeader) {
        if (currentGroup.length > 0) groups.push(currentGroup)
        currentGroup = [e]
      } else {
        currentGroup.push(e)
      }
    }
    if (currentGroup.length > 0) groups.push(currentGroup)

    // 2. Reverse the groups so the newest section is at the top of the UI
    return groups.reverse().flat()
  })()

  const copyAll = () => {
    const text = visibleLog
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
      <Button
        variant="ghost"
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
          <span className="text-xs font-normal text-muted-foreground">
            ({visibleLog.length} calls
            {inspectableCount > 0 && (
              <span className="text-primary"> · {inspectableCount} inspectable</span>
            )}
            )
          </span>
        </span>
        {/* role="presentation" + onKeyDown satisfies jsx-a11y for stopPropagation wrapper */}
        <span
          role="presentation"
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {showBeginnerMode && (
            <Button
              variant={beginnerMode ? 'secondary' : 'ghost'}
              size="sm"
              className="h-6 px-1.5 text-xs mr-1"
              onClick={() => setBeginnerMode(!beginnerMode)}
              title={
                beginnerMode
                  ? 'Hide plain-English translations'
                  : 'Show a short plain-English phrase per call'
              }
            >
              <BookOpenText size={11} className="mr-1" />
              Beginner
            </Button>
          )}
          <Button
            variant={hideAdminOps ? 'secondary' : 'ghost'}
            size="sm"
            className="h-6 px-1.5 text-xs mr-1"
            onClick={() => setHideAdminOps(!hideAdminOps)}
            title={
              hideAdminOps
                ? 'Showing crypto ops only — click to include admin ops'
                : 'Show crypto operations only (hide C_Initialize, C_OpenSession, etc.)'
            }
          >
            <Filter size={11} className="mr-1" />
            Crypto Only
          </Button>
          <Button
            variant={inspectMode ? 'secondary' : 'ghost'}
            size="sm"
            className="h-6 px-1.5 text-xs mr-1"
            onClick={() => setInspectMode(!inspectMode)}
            title={inspectMode ? 'Hide parameter decode' : 'Show parameter decode'}
          >
            <Eye size={11} className="mr-1" />
            Inspect
          </Button>
          {onClear && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-xs"
              disabled={visibleLog.length === 0}
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
            disabled={visibleLog.length === 0}
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
      </Button>

      {/* Body */}
      {open && (
        <div className="mt-2">
          {visibleLog.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">{emptyMessage}</p>
          ) : (
            <>
              {inspectableCount > 0 && (
                <p className="text-[10px] text-muted-foreground mb-1.5">
                  Click any <ChevronRight size={9} className="inline" /> row to expand decoded
                  PKCS#11 parameters &amp; attributes
                </p>
              )}
              <div className="space-y-0 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar relative">
                <div
                  className={`grid ${
                    beginnerMode
                      ? 'grid-cols-[1rem_7rem_12rem_1fr_6rem_4rem_12rem]'
                      : 'grid-cols-[1rem_7rem_12rem_1fr_6rem_4rem]'
                  } gap-x-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider py-1 mb-1 border-b border-border/30 px-1 sticky top-0 bg-background/95 backdrop-blur z-10`}
                >
                  <span className="w-2.5" />
                  <span>Time</span>
                  <span>Function</span>
                  <span>Arguments</span>
                  <span>Return Value</span>
                  <span className="text-right">Duration</span>
                  {beginnerMode && <span>Plain English</span>}
                </div>
                {orderedLog.map((e) => (
                  <LogEntryRow
                    key={e.id}
                    entry={e}
                    inspectMode={inspectMode}
                    beginnerMode={beginnerMode}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
