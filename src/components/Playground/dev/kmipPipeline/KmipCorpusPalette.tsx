// SPDX-License-Identifier: GPL-3.0-only
//
// Corpus-mode content for KmipPipelineBuilder's palette/canvas/summary
// regions — the OASIS conformance corpus as an alternate palette source,
// switched via `paletteSource` (kmip3-corpus-palette-plan-09012026.md).
// Selecting a test in the palette runs it (via useKmipCorpus's selectTest)
// and shows its result in the canvas; the same selection is shared between
// the Builder and Code tabs, so switching tabs keeps the same test in view.
// Execution stays exactly what CorpusReplayView always used — real TTLV
// wire-byte replay via runCorpusTest() — this only changes where it's
// rendered, never how it runs.
import { ChevronDown, ChevronRight, FlaskConical, Loader2, Play, Code2 } from 'lucide-react'
import { Button } from '../../../ui/button'
import { Card } from '../../../ui/card'
import type { UseKmipCorpus } from '../../kmip/useKmipCorpus'
import { StatusBadge } from '../../kmip/CorpusStatusBadge'
import { WireTreeView } from '../../kmip/WireTreeView'

/** Spec-status disclosure, carried over from CorpusReplayView's own header
 * section (now folded into this palette). One of 3 tracked strings that
 * must be updated together on KMIP 3.0 ratification — see the other two at
 * KmipPlaygroundView.tsx's "Spec status" banner and its Commands op-count
 * claim. */
export const KmipCorpusDisclosure: React.FC<{ corpus: UseKmipCorpus }> = ({ corpus }) => (
  <div className="px-4 py-2.5 border-b text-[11px] text-muted-foreground flex items-start gap-2">
    <FlaskConical size={13} className="text-primary shrink-0 mt-0.5" />
    <p>
      <span className="font-medium text-foreground">
        OASIS KMIP 3.0 Profiles CSD02 conformance corpus — a committee draft, not yet a ratified
        Standard.
      </span>{' '}
      {corpus.tierCounts.oasis || '…'} OASIS test transcripts + {corpus.tierCounts.pqc || '…'}{' '}
      vendored PQC interop tests, replayed live against this tab's engine. Zero failures or skips
      tolerated.
    </p>
  </div>
)

/** Left palette content for corpus mode — a compact category tree, click to
 * select (not drag: chained tests have a fixed prerequisite order from the
 * manifest, so free reordering/composition doesn't apply here the way it
 * does for standard primitives). Reused as-is for both the Builder tab's
 * 280px aside and the Code tab's own 280px aside. */
export const KmipCorpusPaletteList: React.FC<{ corpus: UseKmipCorpus }> = ({ corpus }) => {
  const { manifest, error, byCategory, collapsed, toggleCategory, results, running, table } = corpus
  const { selectedTest, selectTest } = corpus

  if (error) {
    return <p className="text-xs text-destructive">Couldn't load the OASIS corpus: {error}</p>
  }
  if (!manifest) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 size={12} className="animate-spin" /> Loading corpus…
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {Array.from(byCategory.entries()).map(([cat, entries]) => {
        const isCollapsed = collapsed.has(cat)
        return (
          <div key={cat}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleCategory(cat)}
              className="flex h-auto w-full items-center gap-1.5 rounded px-1.5 py-1 text-left"
            >
              {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
              <span className="text-[10px] font-semibold uppercase tracking-wide text-foreground">
                {cat}
              </span>
              <span className="text-[9.5px] text-muted-foreground">({entries.length})</span>
            </Button>
            {!isCollapsed && (
              <div className="flex flex-col gap-0.5 pl-2">
                {entries.map((entry) => {
                  const result = results[entry.name]
                  const active = selectedTest === entry.name
                  return (
                    <Button
                      key={entry.name}
                      variant={active ? 'secondary' : 'ghost'}
                      size="sm"
                      disabled={!table}
                      onClick={() => void selectTest(entry)}
                      className="h-auto w-full justify-start gap-1.5 px-1.5 py-1 text-left text-[10.5px] font-mono"
                    >
                      {running === entry.name ? (
                        <Loader2 size={10} className="shrink-0 animate-spin" />
                      ) : result ? (
                        <StatusBadge status={result.status} />
                      ) : (
                        <Code2 size={10} className="shrink-0 text-muted-foreground" />
                      )}
                      <span className="truncate">{entry.name}</span>
                    </Button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/** The selected test's detail — response (Builder canvas, with a Run
 * button) or decoded request (Code tab, read-only, no Run button: matches
 * CorpusReplayView's original Code tab, a pure decode viewer). */
export const KmipCorpusDetail: React.FC<{
  corpus: UseKmipCorpus
  field: 'requestTree' | 'responseTree'
  emptyHint: string
}> = ({ corpus, field, emptyHint }) => {
  const { table, entryByName, results, running, selectedTest, runOne } = corpus

  if (!selectedTest) {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
        {emptyHint}
      </p>
    )
  }

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
        {result?.detail && (
          <span
            className="max-w-md truncate text-[10.5px] text-muted-foreground"
            title={result.detail}
          >
            {result.detail}
          </span>
        )}
        {field === 'responseTree' && (
          <Button
            size="sm"
            variant="secondary"
            disabled={!table || !!running || !entry}
            onClick={() => entry && runOne(entry)}
            className="ml-auto h-7 gap-1.5 px-2.5 text-[11px]"
          >
            {running === selectedTest ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Play size={12} />
            )}{' '}
            Run
          </Button>
        )}
      </div>
      {running === selectedTest && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 size={13} className="animate-spin" /> Replaying…
        </p>
      )}
      {result && result.pairs.length === 0 && running !== selectedTest && (
        <p className="text-xs text-muted-foreground">
          {result.detail || 'Nothing decoded for this test.'}
        </p>
      )}
      {result && result.pairs.length > 0 && (
        <div className="max-w-2xl space-y-3">
          {result.pairs.map((pair, i) => (
            <div key={i}>
              {result.pairs.length > 1 && (
                <p className="mb-1 text-[9.5px] font-bold uppercase tracking-wide text-muted-foreground">
                  {field === 'requestTree' ? 'Request' : 'Pair'} {i + 1} of {result.pairs.length}
                </p>
              )}
              <WireTreeView root={pair[field]} annotated />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/** Right-aside summary for corpus mode — replaces the pipeline's "Pipeline
 * summary"/"Validation" cards, neither of which mean anything for a fixed
 * conformance suite. */
export const KmipCorpusSummaryCard: React.FC<{ corpus: UseKmipCorpus }> = ({ corpus }) => {
  const { tierCounts, ran, passed, failed, table } = corpus
  return (
    <Card className="p-3.5">
      <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">
        Corpus summary
      </div>
      <div className="flex flex-col gap-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">OASIS tests</span>
          <span className="font-mono">{tierCounts.oasis || '…'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">PQC interop tests</span>
          <span className="font-mono">{tierCounts.pqc || '…'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Run so far</span>
          <span className="font-mono">
            {ran.length
              ? `${passed}/${ran.length} pass${failed > 0 ? `, ${failed} failed` : ''}`
              : 'none yet'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Engine</span>
          <span className="font-mono">{table ? 'KMIP/CACP (browser)' : 'initializing…'}</span>
        </div>
      </div>
    </Card>
  )
}
