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
//
// The "97-pass / 5-deprecated-skip" baseline text below is re-verified
// current (2026-07-17) against origin/main: an earlier pass of the
// 2026-07-17 audit measured 92-pass against a local hsm checkout that
// turned out to be 43 commits behind origin/main — the 2 precondition and
// 3 RNG-policy-variant tests that stale baseline showed as skipped pass
// outright on current origin/main via harness-side chaining and per-test
// `--rng-seed-mode` flags. Re-run `dispatcher_replay.py` before trusting
// this number if it's been a while.
//
// 2026-07-17 (later same day): the in-browser replay reached full parity
// with the native baseline (97/97, 0 skip-transport) — `dispatch()` itself
// now enforces §9.10 `MaximumResponseSize` (`enforce_max_response_size` in
// `dispatcher/mod.rs`), so `KmipPlayground::submit` no longer needs the
// native TLS listener for it. See `src/wasm/kmip/corpus/classify.ts`'s
// `TRANSPORT_TESTS` comment for the full history.
//
// 2026-09-01: state/fetch/run logic moved into useKmipCorpus.ts so the same
// corpus data/execution can also drive the "corpus" palette source inside
// KmipPipelineBuilder (kmip3-corpus-palette-plan-09012026.md) without a
// second, independently-reimplemented copy. This component's own JSX is
// otherwise unchanged — it's still a fully standalone, always-enabled view.
import { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  FlaskConical,
  Loader2,
  Play,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Code2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { TestStatus } from '@/wasm/kmip/corpus/runner'
import { useKmipCorpus, STATUS_LABEL } from './useKmipCorpus'
import { WireTreeView } from './WireTreeView'

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
  const corpus = useKmipCorpus({ enabled: true })
  const {
    table,
    error,
    results,
    running,
    collapsed,
    expandedTests,
    setExpandedTests,
    selectedTest,
    byCategory,
    entryByName,
    tierCounts,
    ran,
    passed,
    failed,
    runOne,
    runAll,
    selectForCode,
    toggleCategory,
  } = corpus
  const [viewMode, setViewMode] = useState<'builder' | 'code'>('builder')

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
              <span className="font-medium text-foreground">
                Transcripts from KMIP Profiles 3.0 CSD02 — an OASIS committee draft, not yet a
                ratified Standard.
              </span>{' '}
              {tierCounts.oasis || '…'} real OASIS test transcripts (mandatory + optional) plus{' '}
              {tierCounts.pqc || '…'} vendored PQC interop tests — the same suite behind{' '}
              <code className="text-foreground">conformance/REPLAY_REPORT.md</code>, replayed live
              against this tab's engine instead of over a network. The engine's native CI pins an
              exact 97-pass / 5-deprecated-skip baseline on the 102 OASIS tests, and this in-browser
              replay now matches it exactly — the RNG-seed variant tests each boot an engine pinned
              to their expected mode, and the 3 message-encoding tests exercise the same
              `MaximumResponseSize` (§9.10) check the native listener runs. Zero failures or skips
              tolerated.
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

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'builder' | 'code')}>
        <TabsList data-tour="corpus-view-tabs" className="mb-3">
          <TabsTrigger value="builder">Builder</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="mt-0">
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
                              <span className="font-mono text-xs text-foreground">
                                {entry.name}
                              </span>
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
        </TabsContent>

        <TabsContent value="code" className="mt-0">
          <div className="grid gap-3 lg:grid-cols-[280px_1fr]">
            <div className="space-y-3 lg:max-h-[70vh] lg:overflow-y-auto">
              {Array.from(byCategory.entries()).map(([cat, entries]) => (
                <section key={cat} className="rounded-xl border border-border bg-card">
                  <div className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-foreground">
                    {cat}{' '}
                    <span className="text-[10.5px] text-muted-foreground">({entries.length})</span>
                  </div>
                  <ul className="space-y-1 px-2 pb-2">
                    {entries.map((entry) => {
                      const result = results[entry.name]
                      const active = selectedTest === entry.name
                      return (
                        <li key={entry.name}>
                          <Button
                            variant={active ? 'secondary' : 'ghost'}
                            size="sm"
                            disabled={!table}
                            onClick={() => void selectForCode(entry)}
                            className="h-auto w-full justify-start gap-1.5 px-2 py-1.5 text-left text-[11px] font-mono"
                          >
                            {running === entry.name ? (
                              <Loader2 size={11} className="shrink-0 animate-spin" />
                            ) : result ? (
                              <StatusBadge status={result.status} />
                            ) : (
                              <Code2 size={11} className="shrink-0 text-muted-foreground" />
                            )}
                            <span className="truncate">{entry.name}</span>
                          </Button>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              ))}
            </div>

            <div className="min-w-0">
              {!selectedTest && (
                <p className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                  Pick a test on the left to see the decoded KMIP request it actually sends — the
                  real script this corpus replays, not just a pass/fail verdict.
                </p>
              )}
              {selectedTest &&
                (() => {
                  const entry = entryByName.get(selectedTest)
                  const result = results[selectedTest]
                  return (
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-foreground">{selectedTest}</span>
                        {entry && (
                          <span className="text-[10.5px] uppercase tracking-wide text-muted-foreground">
                            {entry.category} · {entry.tier}
                          </span>
                        )}
                        {result && <StatusBadge status={result.status} />}
                      </div>
                      {running === selectedTest && (
                        <p className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Loader2 size={13} className="animate-spin" /> Replaying…
                        </p>
                      )}
                      {result && result.pairs.length === 0 && running !== selectedTest && (
                        <p className="text-xs text-muted-foreground">
                          {result.detail || 'No request was decoded for this test.'}
                        </p>
                      )}
                      {result && result.pairs.length > 0 && (
                        <div className="space-y-3">
                          {result.pairs.map((pair, i) => (
                            <div key={i}>
                              {result.pairs.length > 1 && (
                                <p className="mb-1 text-[9.5px] font-bold uppercase tracking-wide text-muted-foreground">
                                  Request {i + 1} of {result.pairs.length}
                                </p>
                              )}
                              <WireTreeView root={pair.requestTree} annotated />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })()}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
