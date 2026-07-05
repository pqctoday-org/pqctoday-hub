// SPDX-License-Identifier: GPL-3.0-only
//
// CommandsView — category-sorted tester for every KMIP 3.0 operation (all
// 66 the protocol defines), built entirely on the generic op-template
// pipeline (src/wasm/kmip/ttlv/) rather than a Rust match arm per op. Every
// Run button fires a REAL request through the same dispatcher path the
// Agility tab uses — including the 15 permanently-unsupported ops, which
// get a real `OperationNotSupported` rejection, never a simulated one.
//
// Every run is appended to a persistent Execution Log (most recent first),
// each entry rendered with `WireTreeView` — the same decomposed, collapsible
// tag/value tree the Agility tab's Inspector uses — so the actual response
// is readable, not just a pass/fail chip.
import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronRight, Play, Loader2, CheckCircle2, XCircle, KeyRound, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { KmipEngine } from '@/wasm/kmip/kmipEngine'
import { getCodepointTable, type CodepointTable } from '@/wasm/kmip/ttlv/codepointTable'
import { runOp, type RunResult } from '@/wasm/kmip/ttlv/runner'
import { OP_TEMPLATES, type OpCategory, type OpTemplate } from '@/wasm/kmip/ttlv/opTemplates'
import * as ops from '@/wasm/kmip/ttlv/opTemplates'
import { WireTreeView } from './WireTreeView'

const CATEGORY_ORDER: OpCategory[] = [
  'Discovery & Session',
  'Object Lifecycle',
  'Attributes',
  'Cryptographic Services',
  'RNG & PKCS#11 Passthrough',
  'Certificate Services (not in this build)',
  'Advertised-only / Not Implemented',
]

const LOG_LIMIT = 50

interface LogEntry {
  id: number
  op: string
  result: RunResult
}

/** For the handful of ops most useful to chain against a just-created key,
 * rebuild the request using the shared "Object UID" field below instead of
 * the template's zero-arg placeholder. Every other op still runs for real
 * via its own `build()` defaults — this is a convenience for the common
 * "create, then do things to it" flow, not a requirement for coverage. */
const UID_OVERRIDES: Record<string, (uid: string) => ReturnType<OpTemplate['build']>> = {
  Get: ops.get,
  Activate: ops.activate,
  Revoke: ops.revoke,
  Destroy: ops.destroy,
  Deactivate: ops.deactivate,
  Check: ops.check,
  Archive: ops.archive,
  Recover: ops.recover,
  Obliterate: ops.obliterate,
  GetAttributes: (uid) => ops.getAttributes(uid),
  GetAttributeList: ops.getAttributeList,
  GetUsageAllocation: (uid) => ops.getUsageAllocation(uid),
  Export: ops.exportObject,
  Encapsulate: ops.encapsulate,
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
  sharedUid,
  lastOk,
  onRun,
}: {
  template: OpTemplate
  engine: KmipEngine
  table: CodepointTable | null
  sharedUid: string
  lastOk: boolean | null
  onRun: (op: string, result: RunResult) => void
}) {
  const [running, setRunning] = useState(false)

  const run = () => {
    if (!table) return
    setRunning(true)
    try {
      const payload =
        sharedUid && template.op in UID_OVERRIDES ? UID_OVERRIDES[template.op](sharedUid) : template.build()
      onRun(template.op, runOp(engine, table, template.op, payload))
    } finally {
      setRunning(false)
    }
  }

  return (
    <li className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-2">
      <span className="font-mono text-xs font-semibold text-foreground">{template.op}</span>
      {!template.supported && (
        <span className="rounded bg-status-warning/15 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-status-warning">
          not available in this build
        </span>
      )}
      <span className="text-[10.5px] text-muted-foreground">{template.spec}</span>
      <div className="ml-auto flex items-center gap-2">
        <StatusBadge ok={lastOk} />
        <Button
          size="sm"
          variant="secondary"
          disabled={running || !table}
          onClick={run}
          className="h-7 gap-1.5 px-2.5 text-[11px]"
        >
          {running ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />} Run
        </Button>
      </div>
    </li>
  )
}

function LogEntryView({ entry }: { entry: LogEntry }) {
  const [open, setOpen] = useState(true)
  const { result } = entry
  return (
    <li className="rounded-lg border border-border bg-card p-2.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 text-left"
      >
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        <span className="font-mono text-xs font-semibold text-foreground">{entry.op}</span>
        <StatusBadge ok={result.ok} />
        {!result.ok && result.resultMessage && (
          <span className="truncate text-[10.5px] text-muted-foreground">{result.resultMessage}</span>
        )}
      </button>
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
}: {
  engine: KmipEngine
  onChanged: () => void
}) {
  const [table, setTable] = useState<CodepointTable | null>(null)
  const [tableError, setTableError] = useState<string | null>(null)
  const [sharedUid, setSharedUid] = useState('')
  const [collapsed, setCollapsed] = useState<Set<OpCategory>>(new Set())
  const [log, setLog] = useState<LogEntry[]>([])
  const [lastByOp, setLastByOp] = useState<Record<string, boolean>>({})
  const nextLogId = useRef(0)

  useEffect(() => {
    let alive = true
    getCodepointTable()
      .then((t) => alive && setTable(t))
      .catch((e: unknown) => alive && setTableError(e instanceof Error ? e.message : String(e)))
    return () => {
      alive = false
    }
  }, [])

  const handleRun = (op: string, result: RunResult) => {
    nextLogId.current += 1
    setLog((prev) => [{ id: nextLogId.current, op, result }, ...prev].slice(0, LOG_LIMIT))
    setLastByOp((prev) => ({ ...prev, [op]: result.ok }))
    onChanged()
  }

  const byCategory = useMemo(() => {
    const m = new Map<OpCategory, OpTemplate[]>()
    for (const cat of CATEGORY_ORDER) m.set(cat, [])
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

  if (tableError) {
    return <p className="text-sm text-destructive">Couldn't load the KMIP tag/enum table: {tableError}</p>
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 items-start">
      <div>
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-card p-3">
          <KeyRound size={14} className="text-primary" />
          <label className="text-xs font-medium text-foreground" htmlFor="kmip3-shared-uid">
            Object UID
          </label>
          <input
            id="kmip3-shared-uid"
            value={sharedUid}
            onChange={(e) => setSharedUid(e.target.value)}
            placeholder="paste a UID from a Create/CreateKeyPair result in the log"
            className="flex-1 rounded-md border border-border bg-background px-2 py-1 font-mono text-[11px]"
          />
          <span className="text-[10.5px] text-muted-foreground">
            used by Get/Activate/Revoke/Destroy/GetAttributes/…
          </span>
        </div>

        {!table && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 size={13} className="animate-spin" /> Loading the KMIP tag/enum table…
          </p>
        )}

        <div className="space-y-3">
          {CATEGORY_ORDER.map((cat) => {
            const templates = byCategory.get(cat) ?? []
            const isCollapsed = collapsed.has(cat)
            return (
              <section key={cat} className="rounded-xl border border-border bg-card">
                <button
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left"
                >
                  {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                  <span className="text-xs font-bold uppercase tracking-wide text-foreground">{cat}</span>
                  <span className="text-[10.5px] text-muted-foreground">({templates.length})</span>
                </button>
                {!isCollapsed && (
                  <ul className="space-y-1.5 px-3 pb-3">
                    {templates.map((t) => (
                      <OpRow
                        key={t.op}
                        template={t}
                        engine={engine}
                        table={table}
                        sharedUid={sharedUid}
                        lastOk={lastByOp[t.op] ?? null}
                        onRun={handleRun}
                      />
                    ))}
                  </ul>
                )}
              </section>
            )
          })}
        </div>
      </div>

      {/* ── Execution log — every run, decomposed via WireTreeView ────────── */}
      <div className="rounded-xl border border-border bg-card p-3 lg:sticky lg:top-2">
        <div className="mb-2 flex items-center gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wide text-foreground">Execution Log</h3>
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
          <p className="text-[11px] italic text-muted-foreground">Run an operation to see its decomposed response here.</p>
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
