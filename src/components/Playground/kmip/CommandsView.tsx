// SPDX-License-Identifier: GPL-3.0-only
//
// CommandsView — "Reference": a category-sorted, individually-parameterized
// tester for every KMIP 3.0 operation (all 66 CSD02 defines — 64 carried
// over from CSD01 plus CSD02's Encapsulate/Decapsulate),
// built entirely on the generic op-template pipeline (src/wasm/kmip/ttlv/)
// rather than a Rust match arm per op. Every Run button fires a REAL request
// through the same dispatcher path the Agility tab uses — including the 4
// permanently-unsupported ops (out of scope, not a wasm32 backend gap —
// since the pure-Rust cert-ops port, Certify/Re-certify/Validate are real
// here too), which get a real `OperationNotSupported` rejection, never a
// simulated one.
//
// Every op row is individually expandable with a real parameter form (each
// field's type — algorithm select, uid + datalist, hex/text/number/bool —
// matches `opTemplates.ts`'s `OpParam.kind`), a plain-English blurb, and
// "part of Lesson N" backlinks into the Learn tab. Every run is ALSO
// appended to the persistent Execution Log (most recent first) on the
// right, so the full session history stays visible across rows.
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  Search,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { logEvent } from '@/utils/analytics'
import type { KmipEngine } from '@/wasm/kmip/kmipEngine'
import { getCodepointTable, type CodepointTable } from '@/wasm/kmip/ttlv/codepointTable'
import { runOp, type RunResult } from '@/wasm/kmip/ttlv/runner'
import { OP_TEMPLATES, type OpCategory, type OpTemplate } from '@/wasm/kmip/ttlv/opTemplates'
import { LESSONS } from './kmip3/learnLessons'
import { ParamField } from './kmip3/ParamField'
import { WireTreeView } from './WireTreeView'

const CATEGORY_ORDER: OpCategory[] = [
  'Discovery & Session',
  'Object Lifecycle',
  'Attributes',
  'Cryptographic Services',
  'Certificate Services',
  'RNG & PKCS#11 Passthrough',
  'Asynchronous Processing',
]

const HIDDEN_CATEGORIES: OpCategory[] = ['Not Implemented (out of scope)']

const LOG_LIMIT = 50

interface LogEntry {
  id: number
  op: string
  result: RunResult
}

/** op name → the lessons that reference it (Learn's "tryRef"), for the
 * Reference tab's "part of Lesson N" backlink chips. */
const OP_TO_LESSONS = new Map<string, { id: string; n: number }[]>()
for (const lesson of LESSONS) {
  for (const op of lesson.tryRef) {
    const list = OP_TO_LESSONS.get(op) ?? []
    list.push({ id: lesson.id, n: lesson.n })
    OP_TO_LESSONS.set(op, list)
  }
}

function StatusBadge({ ok }: { ok: boolean | null }) {
  if (ok === null) return null
  return ok ? (
    <span className="inline-flex items-center gap-1 rounded bg-status-success/15 px-1.5 py-0.5 text-[10px] font-semibold text-status-success">
      <CheckCircle2 size={11} /> Success
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded bg-destructive/15 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
      <XCircle size={11} /> Failed
    </span>
  )
}

function OpRow({
  template,
  engine,
  table,
  values,
  onFieldChange,
  expanded,
  onToggleExpand,
  keystoreUids,
  lastResult,
  onRun,
  rowRef,
}: {
  template: OpTemplate
  engine: KmipEngine
  table: CodepointTable | null
  values: Record<string, string>
  onFieldChange: (key: string, value: string) => void
  expanded: boolean
  onToggleExpand: () => void
  keystoreUids: string[]
  lastResult: RunResult | null
  onRun: (op: string, result: RunResult) => void
  rowRef?: (el: HTMLLIElement | null) => void
}) {
  const [running, setRunning] = useState(false)
  const [wireTab, setWireTab] = useState<'request' | 'response'>('response')
  const [showRawHex, setShowRawHex] = useState(false)
  // A build/encode failure (bad enum value, unknown tag — a template- or
  // field-authoring bug) throws instead of returning a `RunResult`; before
  // this catch existed it vanished silently, leaving the Run button looking
  // like it did nothing. A real KMIP rejection is never a throw (see
  // `runOp`'s doc comment) so this only ever fires for that class of bug.
  const [encodeError, setEncodeError] = useState<string | null>(null)

  const run = () => {
    if (!table) return
    setRunning(true)
    setEncodeError(null)
    try {
      onRun(
        template.op,
        runOp(engine, table, template.op, template.build(values), template.headerBuild?.(values))
      )
    } catch (e) {
      setEncodeError(e instanceof Error ? e.message : String(e))
    } finally {
      setRunning(false)
    }
  }

  const lessonRefs = OP_TO_LESSONS.get(template.op) ?? []

  return (
    <li ref={rowRef} className="rounded-lg border border-border bg-card/60">
      <Button
        variant="ghost"
        onClick={onToggleExpand}
        className="flex h-auto w-full items-center gap-2 rounded-lg px-3 py-2 text-left"
      >
        {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        <span className="font-mono text-xs font-semibold text-foreground">{template.op}</span>
        {!template.supported && (
          <span className="rounded bg-status-warning/15 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-status-warning">
            not available in this build
          </span>
        )}
        <span className="text-[10.5px] text-muted-foreground">{template.spec}</span>
        {!expanded && (
          <span className="hidden truncate text-[10.5px] text-muted-foreground/80 sm:inline">
            — {template.blurb}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <StatusBadge ok={lastResult ? lastResult.ok : null} />
        </div>
      </Button>

      {expanded && (
        <div className="space-y-3 px-3 pb-3">
          <p className="text-[11.5px] text-muted-foreground">{template.blurb}</p>

          {lessonRefs.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {lessonRefs.map((l) => (
                <span
                  key={l.id}
                  className="rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary"
                >
                  part of Lesson {l.n}
                </span>
              ))}
            </div>
          )}

          {template.params.length > 0 && (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {template.params.map((p) => (
                <ParamField
                  key={p.key}
                  param={p}
                  value={values[p.key] ?? p.default ?? ''}
                  onChange={(v) => onFieldChange(p.key, v)}
                  keystoreUids={p.kind === 'uid' ? keystoreUids : undefined}
                />
              ))}
            </div>
          )}

          <Button
            size="sm"
            variant="secondary"
            disabled={running || !table}
            onClick={run}
            className="h-7 gap-1.5 px-2.5 text-[11px]"
          >
            {running ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />} Run
          </Button>

          {encodeError && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-[11px] text-destructive">
              <span className="font-semibold">Couldn't build this request:</span> {encodeError}
            </div>
          )}

          {lastResult && (
            <div className="rounded-lg border border-border bg-muted/30 p-2">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                {!lastResult.ok && lastResult.resultMessage && (
                  <span className="text-[10.5px] text-muted-foreground">
                    {lastResult.resultMessage}
                  </span>
                )}
                <div className="ml-auto flex items-center gap-1">
                  <Button
                    variant={wireTab === 'request' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setWireTab('request')}
                    className="h-6 px-2 text-[10px]"
                  >
                    Request
                  </Button>
                  <Button
                    variant={wireTab === 'response' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setWireTab('response')}
                    className="h-6 px-2 text-[10px]"
                  >
                    Response
                  </Button>
                  <Button
                    variant={showRawHex ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setShowRawHex((s) => !s)}
                    className="h-6 px-2 text-[10px]"
                  >
                    raw hex
                  </Button>
                </div>
              </div>
              {showRawHex ? (
                <p className="break-all font-mono text-[10px] text-muted-foreground">
                  {wireTab === 'request' ? lastResult.requestWireHex : lastResult.responseWireHex}
                </p>
              ) : (
                <WireTreeView
                  root={wireTab === 'request' ? lastResult.requestTree : lastResult.responseTree}
                  annotated
                />
              )}
            </div>
          )}
        </div>
      )}
    </li>
  )
}

function LogEntryView({ entry }: { entry: LogEntry }) {
  const [open, setOpen] = useState(false)
  const { result } = entry
  return (
    <li className="rounded-lg border border-border bg-card p-2.5">
      <Button
        variant="ghost"
        onClick={() => setOpen((o) => !o)}
        className="flex h-auto w-full items-center gap-2 p-0 text-left"
      >
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        <span className="font-mono text-xs font-semibold text-foreground">{entry.op}</span>
        <StatusBadge ok={result.ok} />
        {!result.ok && result.resultMessage && (
          <span className="truncate text-[10.5px] text-muted-foreground">
            {result.resultMessage}
          </span>
        )}
      </Button>
      {open && (
        <div className="mt-2 max-h-72 overflow-auto rounded border border-border bg-muted/30 p-2">
          <WireTreeView root={result.responseTree} />
        </div>
      )}
    </li>
  )
}

export function CommandsView({
  engine,
  onChanged,
  pendingOp,
  onPendingOpHandled,
  expert = true,
}: {
  engine: KmipEngine
  onChanged: () => void
  /** Set by Learn's "Try it yourself in Reference" chips — expand + scroll
   * that op's row into view, then clear. */
  pendingOp?: string | null
  onPendingOpHandled?: () => void
  /** Expert mode reveals the "Not implemented in this build" disclosure
   *  (design handoff design_handoff_kmip_pkcs11_playground, D5). */
  expert?: boolean
}) {
  const [table, setTable] = useState<CodepointTable | null>(null)
  const [tableError, setTableError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState<Set<OpCategory>>(new Set())
  const [hiddenOpen, setHiddenOpen] = useState(false)
  const [expandedOps, setExpandedOps] = useState<Set<string>>(new Set())
  const [fieldValues, setFieldValues] = useState<Record<string, Record<string, string>>>({})
  const [log, setLog] = useState<LogEntry[]>([])
  const [lastByOp, setLastByOp] = useState<Record<string, RunResult>>({})
  // Bumped after "Set up demo CA" succeeds — its only job is forcing a
  // re-render so `keystoreUids` (recomputed fresh below, not memoized)
  // picks up the new CA's private/public keys and certificate for the
  // uid-kind fields' datalist.
  const [, forceRefresh] = useState(0)
  const nextLogId = useRef(0)
  const rowRefs = useRef(new Map<string, HTMLLIElement>())

  useEffect(() => {
    let alive = true
    getCodepointTable()
      .then((t) => alive && setTable(t))
      .catch((e: unknown) => alive && setTableError(e instanceof Error ? e.message : String(e)))
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!pendingOp) return
    setExpandedOps((prev) => new Set(prev).add(pendingOp))
    setHiddenOpen((prev) => prev || HIDDEN_CATEGORIES.includes(templateCategory(pendingOp)))
    const el = rowRefs.current.get(pendingOp)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    onPendingOpHandled?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fires once per pendingOp change, matching the "deep-link then clear" contract Kmip3View owns.
  }, [pendingOp])

  const handleRun = (op: string, result: RunResult) => {
    nextLogId.current += 1
    setLog((prev) => [{ id: nextLogId.current, op, result }, ...prev].slice(0, LOG_LIMIT))
    setLastByOp((prev) => ({ ...prev, [op]: result }))
    logEvent('Playground', 'KMIP Command Run', `${op}:${result.ok ? 'ok' : 'fail'}`)
    onChanged()
  }

  const q = search.trim().toLowerCase()
  const matches = (t: OpTemplate) =>
    !q || t.op.toLowerCase().includes(q) || t.blurb.toLowerCase().includes(q)

  const byCategory = useMemo(() => {
    const m = new Map<OpCategory, OpTemplate[]>()
    for (const cat of [...CATEGORY_ORDER, ...HIDDEN_CATEGORIES]) m.set(cat, [])
    for (const t of OP_TEMPLATES) m.get(t.category)?.push(t)
    return m
  }, [])

  const toggleCategory = (cat: OpCategory) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })

  const keystoreUids = engine.listObjects().map((o) => o.uid)
  const hiddenCount = HIDDEN_CATEGORIES.reduce((n, c) => n + (byCategory.get(c)?.length ?? 0), 0)
  const totalCount = OP_TEMPLATES.length

  if (tableError) {
    return (
      <p className="text-sm text-destructive">
        Couldn't load the KMIP tag/enum table: {tableError}
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_360px]">
      <div>
        <div className="mb-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              size={13}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search operations…"
              className="h-9 pl-8 text-[13px]"
            />
          </div>
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {totalCount} operations
          </span>
        </div>

        {!table && (
          <p className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 size={13} className="animate-spin" /> Loading the KMIP tag/enum table…
          </p>
        )}

        <div className="space-y-3">
          {CATEGORY_ORDER.map((cat) => {
            const templates = (byCategory.get(cat) ?? []).filter(matches)
            if (templates.length === 0 && q) return null
            const isCollapsed = collapsed.has(cat) && !q
            return (
              <CategorySection
                key={cat}
                title={cat}
                count={templates.length}
                collapsed={isCollapsed}
                onToggle={() => toggleCategory(cat)}
                headerExtra={
                  cat === 'Certificate Services' ? (
                    <DemoCaSetup engine={engine} onDone={() => forceRefresh((n) => n + 1)} />
                  ) : undefined
                }
              >
                {templates.map((t) => (
                  <OpRow
                    key={t.op}
                    template={t}
                    engine={engine}
                    table={table}
                    values={fieldValues[t.op] ?? {}}
                    onFieldChange={(key, v) =>
                      setFieldValues((prev) => ({ ...prev, [t.op]: { ...prev[t.op], [key]: v } }))
                    }
                    expanded={expandedOps.has(t.op)}
                    onToggleExpand={() =>
                      setExpandedOps((prev) => {
                        const next = new Set(prev)
                        if (next.has(t.op)) next.delete(t.op)
                        else next.add(t.op)
                        return next
                      })
                    }
                    keystoreUids={keystoreUids}
                    lastResult={lastByOp[t.op] ?? null}
                    onRun={handleRun}
                    rowRef={(el) => {
                      if (el) rowRefs.current.set(t.op, el)
                      else rowRefs.current.delete(t.op)
                    }}
                  />
                ))}
              </CategorySection>
            )
          })}

          {!q && expert && (
            <CategorySection
              title={`Not implemented in this build (${hiddenCount})`}
              count={hiddenCount}
              collapsed={!hiddenOpen}
              onToggle={() => setHiddenOpen((o) => !o)}
            >
              {HIDDEN_CATEGORIES.flatMap((cat) => byCategory.get(cat) ?? []).map((t) => (
                <OpRow
                  key={t.op}
                  template={t}
                  engine={engine}
                  table={table}
                  values={fieldValues[t.op] ?? {}}
                  onFieldChange={(key, v) =>
                    setFieldValues((prev) => ({ ...prev, [t.op]: { ...prev[t.op], [key]: v } }))
                  }
                  expanded={expandedOps.has(t.op)}
                  onToggleExpand={() =>
                    setExpandedOps((prev) => {
                      const next = new Set(prev)
                      if (next.has(t.op)) next.delete(t.op)
                      else next.add(t.op)
                      return next
                    })
                  }
                  keystoreUids={keystoreUids}
                  lastResult={lastByOp[t.op] ?? null}
                  onRun={handleRun}
                  rowRef={(el) => {
                    if (el) rowRefs.current.set(t.op, el)
                    else rowRefs.current.delete(t.op)
                  }}
                />
              ))}
            </CategorySection>
          )}
        </div>
      </div>

      {/* ── Execution log — every run this session, most recent first ────── */}
      <div className="rounded-xl border border-border bg-card p-3 lg:sticky lg:top-2">
        <div className="mb-2 flex items-center gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wide text-foreground">
            Execution Log
          </h3>
          <span className="text-[10.5px] text-muted-foreground">({log.length})</span>
          <Button
            variant="ghost"
            size="sm"
            disabled={log.length === 0}
            onClick={() => setLog([])}
            className="ml-auto h-6 gap-1 px-2 text-[10.5px] text-muted-foreground hover:text-foreground"
          >
            <Trash2 size={11} /> Clear
          </Button>
        </div>
        {log.length === 0 ? (
          <p className="text-[11px] italic text-muted-foreground">
            Run an operation to see its decomposed response here.
          </p>
        ) : (
          <ul className="max-h-[70vh] space-y-2 overflow-auto">
            {log.map((entry) => (
              <LogEntryView key={entry.id} entry={entry} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function CategorySection({
  title,
  count,
  collapsed,
  onToggle,
  headerExtra,
  children,
}: {
  title: string
  count: number
  collapsed: boolean
  onToggle: () => void
  headerExtra?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 px-1">
        <Button
          variant="ghost"
          onClick={onToggle}
          className="flex h-auto flex-1 items-center gap-2 rounded-xl px-2 py-2 text-left"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          <span className="text-xs font-bold uppercase tracking-wide text-foreground">{title}</span>
          {!title.includes('(') && (
            <span className="text-[10.5px] text-muted-foreground">({count})</span>
          )}
        </Button>
        {headerExtra}
      </div>
      {!collapsed && <ul className="space-y-1.5 px-3 pb-3">{children}</ul>}
    </section>
  )
}

const DEMO_CA_ALGORITHMS = ['ECDSA-P256', 'RSA-2048', 'ML-DSA-65', 'SLH-DSA-SHA2-128f'] as const

/** "Set up demo CA" — the affordance Certify/Re-certify need before either
 * can sign anything: mints a fresh keypair + self-signed root cert via
 * `KmipEngine.setupDemoCa` (the SAME `certify::bootstrap_ca_certificate`
 * path the native server's `--ca-key` bootstrap uses) and designates it.
 * Safe to click more than once — each call mints an independently-UID'd CA
 * and re-designates it as the active one, e.g. to try a different
 * algorithm mid-session. */
function DemoCaSetup({ engine, onDone }: { engine: KmipEngine; onDone: () => void }) {
  const [algorithm, setAlgorithm] = useState<(typeof DEMO_CA_ALGORITHMS)[number]>('ECDSA-P256')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; label: string } | null>(null)

  const run = () => {
    setBusy(true)
    try {
      const r = engine.setupDemoCa(algorithm, 'Playground Demo CA')
      setResult(
        r.ok
          ? { ok: true, label: `CA ready: ${r.certificateUid}` }
          : { ok: false, label: r.error ?? 'setup failed' }
      )
      onDone()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-1.5 py-1 pr-2">
      {result && (
        <span
          className={`hidden max-w-[220px] truncate text-[10px] sm:inline ${result.ok ? 'text-status-success' : 'text-destructive'}`}
          title={result.label}
        >
          {result.label}
        </span>
      )}
      <FilterDropdown
        items={[...DEMO_CA_ALGORITHMS]}
        selectedId={algorithm}
        onSelect={(id) => setAlgorithm(id as (typeof DEMO_CA_ALGORITHMS)[number])}
        ariaLabel="Demo CA algorithm"
        hideDefaultOption
        noContainer
        size="sm"
      />
      <Button
        size="sm"
        variant="outline"
        className="h-7 px-2 text-[10.5px]"
        disabled={busy}
        onClick={run}
      >
        {busy ? <Loader2 size={12} className="animate-spin" /> : 'Set up demo CA'}
      </Button>
    </div>
  )
}

function templateCategory(op: string): OpCategory {
  return OP_TEMPLATES.find((t) => t.op === op)?.category ?? 'Discovery & Session'
}
