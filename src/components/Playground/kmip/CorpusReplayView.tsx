// SPDX-License-Identifier: GPL-3.0-only
//
// CorpusReplayView — a live, in-browser replay of the real OASIS KMIP 3.0
// conformance test corpus (95 mandatory + 7 optional OASIS tests, plus 42
// vendored PQC interop tests). Each test boots its own hermetic engine
// instance (see src/wasm/kmip/corpus/runner.ts) and its PASS/FAIL/SKIP
// status is directly comparable to
// pqctoday-hsm/kmip/conformance/REPLAY_REPORT.md, the report the real
// Python/TLS harness produces — this is the same test suite, running
// entirely in the tab instead of against a server.
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  FlaskConical,
  Loader2,
  Play,
  CheckCircle2,
  XCircle,
  MinusCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getCodepointTable, type CodepointTable } from '@/wasm/kmip/ttlv/codepointTable'
import { runCorpusTest, type TestResult, type TestStatus } from '@/wasm/kmip/corpus/runner'
import { WireTreeView } from './WireTreeView'

interface ManifestEntry {
  file: string
  tier: 'mandatory' | 'optional' | 'pqc'
  category: string
  name: string
}
interface Manifest {
  count: number
  tests: ManifestEntry[]
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// Slots below this are reserved for the rest of the app's shared engines
// (the Agility/Commands tabs use slot 0) — start corpus-replay slots well
// clear of those.
const SLOT_BASE = 10_000

const STATUS_LABEL: Record<TestStatus, string> = {
  PASS: 'PASS',
  FAIL: 'FAIL',
  ERROR: 'ERROR',
  SKIP_OP: 'SKIP (op not implemented)',
  SKIP_PARSE: 'SKIP (XML malformed)',
  SKIP_DEPRECATED: 'SKIP (deprecated algorithm)',
  SKIP_PRECONDITION: 'SKIP (needs prior-transcript state)',
  SKIP_POLICY_VARIANT: 'SKIP (mutually-exclusive policy)',
  SKIP_TRANSPORT: 'SKIP (native-transport-only feature)',
}

function StatusBadge({ status }: { status: TestStatus }) {
  if (status === 'PASS') {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-status-success/15 px-1.5 py-0.5 text-[10px] font-semibold text-status-success">
        <CheckCircle2 size={11} /> {STATUS_LABEL[status]}
      </span>
    )
  }
  if (status === 'FAIL' || status === 'ERROR') {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-destructive/15 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
        <XCircle size={11} /> {STATUS_LABEL[status]}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
      <MinusCircle size={11} /> {STATUS_LABEL[status]}
    </span>
  )
}

export function CorpusReplayView() {
  const [table, setTable] = useState<CodepointTable | null>(null)
  const [manifest, setManifest] = useState<Manifest | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [xmlCache] = useState(() => new Map<string, string>())
  const [results, setResults] = useState<Record<string, TestResult>>({})
  const [running, setRunning] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set())
  const nextSlot = useRef(SLOT_BASE)

  useEffect(() => {
    let alive = true
    Promise.all([
      getCodepointTable(),
      fetch('/kmip-corpus/manifest.json').then((r) =>
        r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))
      ),
    ])
      .then(([t, m]) => {
        if (!alive) return
        setTable(t)
        setManifest(m as Manifest)
      })
      .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : String(e)))
    return () => {
      alive = false
    }
  }, [])

  const byCategory = useMemo(() => {
    const m = new Map<string, ManifestEntry[]>()
    for (const t of manifest?.tests ?? []) {
      const list = m.get(t.category) ?? []
      list.push(t)
      m.set(t.category, list)
    }
    return m
  }, [manifest])

  async function fetchXml(entry: ManifestEntry): Promise<string> {
    const cached = xmlCache.get(entry.file)
    if (cached) return cached
    const text = await fetch(`/kmip-corpus/${entry.file}`).then((r) => r.text())
    xmlCache.set(entry.file, text)
    return text
  }

  async function runOne(entry: ManifestEntry) {
    if (!table) return
    setRunning(entry.name)
    try {
      const xml = await fetchXml(entry)
      const result = await runCorpusTest(entry.name, xml, table, nextSlot.current++)
      setResults((prev) => ({ ...prev, [entry.name]: result }))
    } finally {
      setRunning(null)
    }
  }

  async function runAll() {
    if (!table || !manifest) return
    setRunning('__all__')
    const out: Record<string, TestResult> = {}
    for (const entry of manifest.tests) {
      await sleep(0)
      const xml = await fetchXml(entry)
      out[entry.name] = await runCorpusTest(entry.name, xml, table, nextSlot.current++)
      setResults({ ...out })
    }
    setRunning(null)
  }

  const toggleCategory = (cat: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })

  const ran = Object.keys(results)
  const passed = ran.filter((k) => results[k].status === 'PASS').length
  const failed = ran.filter(
    (k) => results[k].status === 'FAIL' || results[k].status === 'ERROR'
  ).length

  if (error) {
    return <p className="text-sm text-destructive">Couldn't load the OASIS corpus: {error}</p>
  }

  return (
    <div>
      <section className="mb-4 rounded-xl border border-primary/30 bg-primary/[0.03] p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-semibold flex items-center gap-2 text-foreground">
              <FlaskConical size={16} className="text-primary" /> OASIS KMIP 3.0 conformance corpus
            </h3>
            <p className="mt-1 max-w-xl text-xs text-muted-foreground">
              {manifest?.count ?? '…'} real OASIS test transcripts (mandatory + optional) plus
              vendored PQC interop tests — the same suite behind{' '}
              <code className="text-foreground">conformance/REPLAY_REPORT.md</code>, replayed live
              against this tab's engine instead of over a network.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {ran.length > 0 && (
              <span
                className={cn(
                  'rounded px-2 py-1 text-[11px] font-semibold',
                  failed === 0
                    ? 'bg-status-success/15 text-status-success'
                    : 'bg-destructive/15 text-destructive'
                )}
              >
                {passed}/{ran.length} pass
                {failed > 0 ? `, ${failed} failed` : ''}
              </span>
            )}
            <Button onClick={runAll} disabled={!table || !!running} className="gap-1.5">
              {running === '__all__' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Play size={14} />
              )}{' '}
              Run all
            </Button>
          </div>
        </div>
      </section>

      {!table && !error && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 size={13} className="animate-spin" /> Loading the OASIS corpus + tag/enum table…
        </p>
      )}

      <div className="space-y-3">
        {Array.from(byCategory.entries()).map(([cat, entries]) => {
          const isCollapsed = collapsed.has(cat)
          return (
            <section key={cat} className="rounded-xl border border-border bg-card">
              <Button
                variant="ghost"
                onClick={() => toggleCategory(cat)}
                className="flex h-auto w-full items-center gap-2 rounded-xl px-3 py-2 text-left"
              >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                <span className="text-xs font-bold uppercase tracking-wide text-foreground">
                  {cat}
                </span>
                <span className="text-[10.5px] text-muted-foreground">({entries.length})</span>
              </Button>
              {!isCollapsed && (
                <ul className="space-y-1.5 px-3 pb-3">
                  {entries.map((entry) => {
                    const result = results[entry.name]
                    const open = expandedTests.has(entry.name)
                    return (
                      <li
                        key={entry.name}
                        className="rounded-lg border border-border bg-card/60 px-3 py-2"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          {result && result.pairs.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setExpandedTests((prev) => {
                                  const next = new Set(prev)
                                  if (next.has(entry.name)) next.delete(entry.name)
                                  else next.add(entry.name)
                                  return next
                                })
                              }
                              className="h-auto p-0.5"
                            >
                              {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                            </Button>
                          )}
                          <span className="font-mono text-xs text-foreground">{entry.name}</span>
                          {result && (
                            <>
                              <StatusBadge status={result.status} />
                              {result.detail && (
                                <span
                                  className="max-w-md truncate text-[10.5px] text-muted-foreground"
                                  title={result.detail}
                                >
                                  {result.detail}
                                </span>
                              )}
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={!table || !!running}
                            onClick={() => runOne(entry)}
                            className="ml-auto h-7 gap-1.5 px-2.5 text-[11px]"
                          >
                            {running === entry.name ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Play size={12} />
                            )}{' '}
                            Run
                          </Button>
                        </div>
                        {open && result && result.pairs.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {result.pairs.map((pair, i) => (
                              <div key={i}>
                                {result.pairs.length > 1 && (
                                  <p className="mb-1 text-[9.5px] font-bold uppercase tracking-wide text-muted-foreground">
                                    Pair {i + 1} of {result.pairs.length}
                                  </p>
                                )}
                                <WireTreeView root={pair.responseTree} annotated />
                              </div>
                            ))}
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
