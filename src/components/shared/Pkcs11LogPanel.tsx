// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Pkcs11LogPanel — prop-based PKCS#11 call log for learning modules.
 *
 * Self-contained (no HsmContext dependency). Pass log entries from useHSM().
 * Rows with inspect data show a ▶ chevron — click to expand decoded parameters.
 * Default: collapsible, starts collapsed. Runs of supporting (non-mechanism)
 * calls fold into one expandable row so the crypto calls stand out.
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
  ChevronsDownUp,
  ChevronsUpDown,
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

  const hasInspect = inspectMode && (!!entry.inspect || !!entry.inspectNote)

  const rvColor = entry.ok
    ? 'text-status-success'
    : entry.rvHex === '0x00000150'
      ? 'text-status-warning'
      : 'text-status-error'

  // The raw args are pointers; the decoded mechanism name (when the call
  // log decoded one) is what lets a phrase say which algorithm ran.
  const mechNames = (entry.inspect?.inputs ?? [])
    .map((s) => s.mechanism?.name ?? '')
    .filter(Boolean)
    .join(' ')
  const english = beginnerMode
    ? pkcs11PlainEnglish(entry.fn, `${entry.args || ''} ${mechNames}`.trim())
    : ''

  return (
    <div>
      <div
        role={hasInspect ? 'button' : undefined}
        tabIndex={hasInspect ? 0 : undefined}
        aria-expanded={hasInspect ? expanded : undefined}
        className={`grid ${
          beginnerMode
            ? 'grid-cols-[1rem_minmax(0,7rem)_minmax(0,12rem)_minmax(0,1fr)_minmax(0,6rem)_minmax(0,4rem)_minmax(0,12rem)]'
            : 'grid-cols-[1rem_minmax(0,7rem)_minmax(0,12rem)_minmax(0,1fr)_minmax(0,6rem)_minmax(0,4rem)]'
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
      {expanded && !entry.inspect && entry.inspectNote && (
        <p className="mt-1 mb-1 ml-4 pl-3 border-l-2 border-border text-[11px] text-muted-foreground">
          {entry.inspectNote}
        </p>
      )}

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

/**
 * Calls that run a cryptographic mechanism — the rows a learner came to see.
 * Every other C_* call (attribute reads, object search, session/token setup,
 * mechanism discovery, object import/policy edits) is supporting plumbing:
 * a single sign can trigger a dozen C_GetAttributeValue reads, which buried
 * the call that mattered. Supporting calls are folded into an expandable
 * group row by default, never removed.
 */
const MECHANISM_OPS = new Set([
  // Key generation, derivation, wrapping
  'C_GenerateKeyPair',
  'C_GenerateKey',
  'C_DeriveKey',
  'C_WrapKey',
  'C_UnwrapKey',
  'C_WrapKeyAuthenticated',
  'C_UnwrapKeyAuthenticated',
  // KEM (FIPS 203, PKCS#11 v3.2)
  'C_EncapsulateKey',
  'C_DecapsulateKey',
  // Encrypt / decrypt
  'C_EncryptInit',
  'C_Encrypt',
  'C_EncryptUpdate',
  'C_EncryptFinal',
  'C_DecryptInit',
  'C_Decrypt',
  'C_DecryptUpdate',
  'C_DecryptFinal',
  // Sign / verify (incl. recover and the v3.2 single-shot VerifySignature)
  'C_SignInit',
  'C_Sign',
  'C_SignUpdate',
  'C_SignFinal',
  'C_SignRecoverInit',
  'C_SignRecover',
  'C_VerifyInit',
  'C_Verify',
  'C_VerifyUpdate',
  'C_VerifyFinal',
  'C_VerifyRecoverInit',
  'C_VerifyRecover',
  'C_VerifySignatureInit',
  'C_VerifySignature',
  'C_VerifySignatureUpdate',
  'C_VerifySignatureFinal',
  // Digest
  'C_DigestInit',
  'C_Digest',
  'C_DigestUpdate',
  'C_DigestKey',
  'C_DigestFinal',
  // Dual-function multi-part
  'C_DigestEncryptUpdate',
  'C_DecryptDigestUpdate',
  'C_SignEncryptUpdate',
  'C_DecryptVerifyUpdate',
  // Random
  'C_GenerateRandom',
  'C_SeedRandom',
  // PKCS#11 v3.0+ Message API (ML-DSA/SLH-DSA sign, AES-GCM encrypt)
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
  'C_MessageEncryptInit',
  'C_EncryptMessage',
  'C_EncryptMessageBegin',
  'C_EncryptMessageNext',
  'C_MessageEncryptFinal',
  'C_MessageDecryptInit',
  'C_DecryptMessage',
  'C_DecryptMessageBegin',
  'C_DecryptMessageNext',
  'C_MessageDecryptFinal',
])

/**
 * C_GetAttributeValue's per-attribute "no" answers (PKCS#11 v3.2 §5.7.5):
 * the attribute isn't defined for this object, or it's sensitive. Readers
 * probe optional attributes and expect these, so they are answers, not
 * failures — one keygen can produce a dozen of them.
 */
const ATTRIBUTE_PROBE_RVS = new Set(['0x00000011', '0x00000012'])

const isAttributeProbeMiss = (e: Pkcs11LogEntry) =>
  e.fn === 'C_GetAttributeValue' && ATTRIBUTE_PROBE_RVS.has(e.rvHex)

/**
 * A row that folds into a "supporting calls" group: a real C_* call that runs
 * no mechanism. Real failures always stay visible (an error is never noise);
 * attribute-probe misses fold. Synthetic rows ('Dual-Engine Parity', '[WRAP]')
 * and any function the caller named in `filterFns` stay visible too — the
 * module asked for it.
 */
const isSupportCall = (e: Pkcs11LogEntry, pinned: readonly string[] | undefined) =>
  !e.isStepHeader &&
  (e.ok || isAttributeProbeMiss(e)) &&
  e.fn.startsWith('C_') &&
  !MECHANISM_OPS.has(e.fn) &&
  !(pinned && pinned.includes(e.fn))

type DisplayItem =
  | { kind: 'entry'; entry: Pkcs11LogEntry }
  | { kind: 'group'; id: number; entries: Pkcs11LogEntry[] }

/** Fold runs of 2+ consecutive supporting calls; a lone one stays a plain row. */
const foldSupportCalls = (
  ordered: Pkcs11LogEntry[],
  pinned: readonly string[] | undefined
): DisplayItem[] => {
  const items: DisplayItem[] = []
  let run: Pkcs11LogEntry[] = []
  const flush = () => {
    if (run.length >= 2) items.push({ kind: 'group', id: run[0].id, entries: run })
    else for (const e of run) items.push({ kind: 'entry', entry: e })
    run = []
  }
  for (const e of ordered) {
    if (isSupportCall(e, pinned)) {
      run.push(e)
    } else {
      flush()
      items.push({ kind: 'entry', entry: e })
    }
  }
  flush()
  return items
}

/** "C_GetAttributeValue ×8 · C_FindObjects ×2", most frequent first. */
const summarizeFns = (entries: Pkcs11LogEntry[]) => {
  const counts = new Map<string, number>()
  for (const e of entries) counts.set(e.fn, (counts.get(e.fn) ?? 0) + 1)
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([fn, n]) => (n > 1 ? `${fn} ×${n}` : fn))
    .join(' · ')
}

const SupportGroupRow = ({
  entries,
  expanded,
  onToggle,
  inspectMode,
  beginnerMode,
}: {
  entries: Pkcs11LogEntry[]
  expanded: boolean
  onToggle: () => void
  inspectMode: boolean
  beginnerMode: boolean
}) => {
  const summary = summarizeFns(entries)
  const probeMisses = entries.filter((e) => !e.ok).length
  return (
    <div data-testid="pkcs11-log-support-group">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground py-0.5 px-1 border-b border-border/10 rounded cursor-pointer hover:bg-muted/30"
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggle()
          }
        }}
        title={expanded ? 'Collapse supporting calls' : `Show ${entries.length} supporting calls`}
      >
        {expanded ? (
          <ChevronDown size={10} className="shrink-0" />
        ) : (
          <ChevronRight size={10} className="shrink-0" />
        )}
        <span className="shrink-0 italic font-sans">{entries.length} supporting calls</span>
        {probeMisses > 0 && (
          <span
            className="shrink-0 font-sans text-status-warning"
            title="Attributes the object doesn't have or won't reveal (CKR_ATTRIBUTE_TYPE_INVALID / CKR_ATTRIBUTE_SENSITIVE) — expected answers to an attribute probe"
          >
            {probeMisses} attribute{probeMisses === 1 ? '' : 's'} not available
          </span>
        )}
        <span className="truncate opacity-70" title={summary}>
          {summary}
        </span>
      </div>
      {expanded && (
        <div className="ml-1.5 pl-1 border-l border-border/40">
          {entries.map((e) => (
            <LogEntryRow
              key={e.id}
              entry={e}
              inspectMode={inspectMode}
              beginnerMode={beginnerMode}
            />
          ))}
        </div>
      )}
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
  /** Start with the additive plain-English column visible. */
  defaultBeginnerMode?: boolean
  /**
   * Lesson context: every call a lesson step makes is the point (including
   * C_Initialize/C_OpenSession/C_Login when the lesson is about those calls
   * specifically), so supporting calls start expanded here. The collapse
   * toggle stays available.
   */
  lessonMode?: boolean
  /**
   * Start with supporting (non-mechanism) calls folded into group rows.
   * Defaults to true, or false under `lessonMode`.
   */
  defaultCollapseSupport?: boolean
  /**
   * Section (isStepHeader-grouped) display order. Defaults to
   * 'newest-first' — the existing behaviour every other caller relies on
   * for live debugging (most recent activity at the top). A step-by-step
   * lesson walkthrough with a fixed, small step count reads backwards under
   * that default (Step 6's calls above Step 1's) — pass 'chronological'
   * there to keep sections in the order they were produced instead.
   */
  groupOrder?: 'newest-first' | 'chronological'
}

/**
 * PKCS#11 v3.2 §5.4-5.6 session, slot/token and object-management calls —
 * everything a consumer runs just to HAVE a usable token, before any crypto.
 * useHSM's initialize() emits ~18 of these on mount, so a raw log length says
 * nothing about whether a tool actually computed anything. Counting only the
 * rest gives "did this surface do cryptographic work", which is what the
 * playground validation spec asserts growth in.
 */
const SESSION_MGMT_FNS = new Set([
  'C_Initialize',
  'C_Finalize',
  'C_GetInfo',
  'C_GetFunctionList',
  'C_GetSlotList',
  'C_GetSlotInfo',
  'C_GetTokenInfo',
  'C_GetMechanismList',
  'C_GetMechanismInfo',
  'C_InitToken',
  'C_InitPIN',
  'C_SetPIN',
  'C_OpenSession',
  'C_CloseSession',
  'C_CloseAllSessions',
  'C_GetSessionInfo',
  'C_Login',
  'C_Logout',
])

const countCryptoCalls = (log: Pkcs11LogEntry[]) =>
  log.reduce((n, e) => (SESSION_MGMT_FNS.has(e.fn) ? n : n + 1), 0)

export const Pkcs11LogPanel = ({
  log,
  onClear,
  title = 'PKCS#11 Call Log',
  defaultOpen = false,
  className = '',
  emptyMessage = 'No PKCS#11 calls yet — run a live operation to see activity.',
  filterFns,
  showBeginnerMode = false,
  defaultBeginnerMode = false,
  lessonMode = false,
  defaultCollapseSupport,
  groupOrder = 'newest-first',
}: Pkcs11LogPanelProps) => {
  const [open, setOpen] = useState(defaultOpen)
  const [copied, setCopied] = useState(false)
  const [inspectMode, setInspectMode] = useState(false)
  const [beginnerMode, setBeginnerMode] = useState(defaultBeginnerMode)
  const [collapseSupport, setCollapseSupport] = useState(defaultCollapseSupport ?? !lessonMode)
  // Groups the user flipped away from the global collapse state, keyed by the
  // group's first (oldest) entry id — stable as new calls extend the run.
  const [flippedGroups, setFlippedGroups] = useState<ReadonlySet<number>>(new Set())

  const toggleCollapseAll = () => {
    setCollapseSupport((v) => !v)
    setFlippedGroups(new Set())
  }
  const toggleGroup = (id: number) =>
    setFlippedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const visibleLog = log.filter((e) => {
    if (e.isStepHeader) return true
    if (MECHANISM_OPS.has(e.fn)) return true
    if (filterFns && filterFns.length > 0) {
      return filterFns.includes(e.fn)
    }
    return true
  })

  const mechanismCount = visibleLog.filter((e) => MECHANISM_OPS.has(e.fn)).length
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

    // 2. Reverse the groups so the newest section is at the top of the UI —
    // unless the caller asked to keep sections in the order they happened.
    return (groupOrder === 'newest-first' ? groups.reverse() : groups).flat()
  })()

  const displayItems = foldSupportCalls(orderedLog, filterFns)
  const hasSupportGroups = displayItems.some((i) => i.kind === 'group')

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
    // The data-* hooks let a test assert "this tool exposes a live call log"
    // without pattern-matching the title, which varies per tool ("PKCS#11 Call
    // Log — Envelope Encryption", "Rust Engine · PKCS#11 Log", "PKCS#11 Hybrid
    // Cert Gen Log", ...). Title-matching gave false "no log panel" verdicts on
    // tools whose logs were working. `data-pkcs11-log-entries` is the FULL log
    // length, not the filtered/visible count, so a panel that is collapsed or
    // filtered down to nothing still reports what the engine actually recorded.
    <div
      className={`glass-panel p-3 ${className}`}
      data-testid="pkcs11-log-panel"
      data-pkcs11-log-entries={log.length}
      data-pkcs11-crypto-entries={countCryptoCalls(log)}
    >
      {/* Header — wraps at narrow widths. Every child here is `whitespace-nowrap`
          (Button's own base class), so without `flex-wrap` + a shrinkable title
          the row demanded ~820px of intrinsic width and pushed the whole page
          content off the left edge on a 390px viewport (the app shell scrolls
          horizontally under `overflow-x:hidden`, so the user had no way back). */}
      <div className="w-full flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-sm font-semibold">
        <Button
          variant="ghost"
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 max-w-full flex-1 items-center justify-start gap-2 text-left text-sm font-semibold"
          aria-expanded={open}
        >
          <span className="flex min-w-0 items-center gap-2">
            {open ? (
              <ChevronDown size={14} className="shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight size={14} className="shrink-0 text-muted-foreground" />
            )}
            <span className="truncate">{title}</span>
            <span className="shrink-0 text-xs font-normal text-muted-foreground">
              ({visibleLog.length} calls
              {mechanismCount > 0 && <span> · {mechanismCount} crypto</span>}
              {inspectableCount > 0 && (
                <span className="text-primary"> · {inspectableCount} inspectable</span>
              )}
              )
            </span>
          </span>
        </Button>
        {/* Controls are siblings of the toggle button (not nested) — valid DOM. */}
        <span className="flex flex-wrap items-center gap-1">
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
          {hasSupportGroups && (
            <Button
              variant={collapseSupport ? 'secondary' : 'ghost'}
              size="sm"
              className="h-6 px-1.5 text-xs mr-1"
              onClick={toggleCollapseAll}
              aria-pressed={collapseSupport}
              title={
                collapseSupport
                  ? 'Supporting calls (attribute reads, object search, session setup) are folded — click to expand them all'
                  : 'Fold supporting calls so only cryptographic mechanism calls stand out'
              }
            >
              {collapseSupport ? (
                <ChevronsUpDown size={11} className="mr-1" />
              ) : (
                <ChevronsDownUp size={11} className="mr-1" />
              )}
              {collapseSupport ? 'Expand all' : 'Collapse support'}
            </Button>
          )}
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
      </div>

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
              <div className="space-y-0 max-h-[500px] overflow-x-auto overflow-y-auto pr-2 custom-scrollbar relative">
                <div
                  className={`grid ${
                    beginnerMode
                      ? 'grid-cols-[1rem_minmax(0,7rem)_minmax(0,12rem)_minmax(0,1fr)_minmax(0,6rem)_minmax(0,4rem)_minmax(0,12rem)]'
                      : 'grid-cols-[1rem_minmax(0,7rem)_minmax(0,12rem)_minmax(0,1fr)_minmax(0,6rem)_minmax(0,4rem)]'
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
                {displayItems.map((item) =>
                  item.kind === 'group' ? (
                    <SupportGroupRow
                      key={`g${item.id}`}
                      entries={item.entries}
                      expanded={collapseSupport === flippedGroups.has(item.id)}
                      onToggle={() => toggleGroup(item.id)}
                      inspectMode={inspectMode}
                      beginnerMode={beginnerMode}
                    />
                  ) : (
                    <LogEntryRow
                      key={item.entry.id}
                      entry={item.entry}
                      inspectMode={inspectMode}
                      beginnerMode={beginnerMode}
                    />
                  )
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
