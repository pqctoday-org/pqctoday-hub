// SPDX-License-Identifier: AGPL-3.0-only
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { BUSINESS_COMPARISON_CASES } from '@/data/businessComparisonCases'
import { Button } from '@/components/ui/button'
import { withEducationNoticeMarkdown } from '@/data/educationNotice'
import { downloadBlob } from '@/services/exportBundle'

interface ComparisonNote {
  after: string
  decision: string
}

interface ComparisonSnapshot {
  baseline: string
  note?: ComparisonNote
}

interface ComparisonState {
  toolId: string
  snapshots: ReadonlyMap<string, ComparisonSnapshot>
  capture: (key: string, text: string) => void
  recordDecision: (key: string, baseline: string, note: ComparisonNote) => void
  clear: (key: string) => void
}

const ComparisonContext = createContext<ComparisonState | null>(null)

function restoreComparisons(key: string): Map<string, ComparisonSnapshot> {
  const snapshots = new Map<string, ComparisonSnapshot>()
  try {
    const cached: unknown = JSON.parse(sessionStorage.getItem(key) ?? '[]')
    if (!Array.isArray(cached)) return snapshots
    for (const row of cached) {
      if (!Array.isArray(row) || typeof row[0] !== 'string') continue
      const snapshot = row[1]
      if (typeof snapshot?.baseline !== 'string') continue
      const note = snapshot.note
      snapshots.set(row[0], {
        baseline: snapshot.baseline,
        note:
          typeof note?.after === 'string' && typeof note?.decision === 'string'
            ? { after: note.after, decision: note.decision }
            : undefined,
      })
    }
  } catch {
    // Keep comparison usable when browser session storage is unavailable.
  }
  return snapshots
}

export function ScenarioComparisonProvider({
  children,
  toolId,
}: {
  children: ReactNode
  toolId: string
}) {
  const storageKey = `pqc-scenario-comparison:${toolId}`
  const [snapshots, setSnapshots] = useState(() => restoreComparisons(storageKey))

  useEffect(() => {
    try {
      if (snapshots.size) sessionStorage.setItem(storageKey, JSON.stringify([...snapshots]))
      else sessionStorage.removeItem(storageKey)
    } catch {
      // A full or disabled session store leaves this comparison usable in memory.
    }
  }, [snapshots, storageKey])

  function capture(key: string, baseline: string) {
    setSnapshots((previous) => new Map(previous).set(key, { baseline }))
  }
  function recordDecision(key: string, baseline: string, note: ComparisonNote) {
    setSnapshots((previous) =>
      previous.get(key)?.baseline === baseline
        ? new Map(previous).set(key, { baseline, note })
        : previous
    )
  }
  function clear(key: string) {
    setSnapshots((previous) => {
      const next = new Map(previous)
      next.delete(key)
      return next
    })
  }

  const savedDecisions = [...snapshots].filter(([, snapshot]) => snapshot.note?.decision.trim())
  return (
    <ComparisonContext.Provider value={{ snapshots, capture, recordDecision, clear, toolId }}>
      {savedDecisions.length > 0 && (
        <details className="rounded-md border border-border p-3 text-sm print:hidden">
          <summary className="cursor-pointer font-semibold">Saved scenario comparisons</summary>
          <p className="mt-2 text-muted-foreground">
            These decisions belong to the report pairs saved in this tab. Editing the tool can
            produce a different current report.
          </p>
          {savedDecisions.map(([key, snapshot]) => {
            const note = snapshot.note
            if (!note) return null
            return (
              <div key={key} className="mt-3 space-y-2 border-t border-border pt-2">
                <p className="whitespace-pre-wrap break-words">{note.decision}</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-h-11"
                    onClick={() =>
                      downloadComparison(toolId, snapshot.baseline, note.after, note.decision)
                    }
                  >
                    Download saved comparison
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="min-h-11"
                    onClick={() => clear(key)}
                  >
                    Clear saved comparison
                  </Button>
                </div>
              </div>
            )
          })}
        </details>
      )}
      {children}
    </ComparisonContext.Provider>
  )
}

/** Preserve order and duplicate lines. Include everything between the first and last change. */
function differingSection(before: string, after: string) {
  const original = before.split(/\r?\n/)
  const current = after.split(/\r?\n/)
  const commonLength = Math.min(original.length, current.length)
  let start = 0
  while (start < commonLength && original[start] === current[start]) start++
  let end = 0
  while (
    end < commonLength - start &&
    original[original.length - 1 - end] === current[current.length - 1 - end]
  )
    end++
  return {
    before: original.slice(start, original.length - end).join('\n'),
    after: current.slice(start, current.length - end).join('\n'),
  }
}

function indented(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => `    ${line}`)
    .join('\n')
}

function downloadComparison(toolId: string, baseline: string, report: string, decision: string) {
  const markdown = [
    '# Scenario comparison',
    '',
    `Planning tool: ${toolId}`,
    '',
    '## Decision and next evidence',
    '',
    indented(decision.trim() || 'Decision pending.'),
    '',
    '## Baseline report',
    '',
    indented(baseline),
    '',
    '## Current report',
    '',
    indented(report),
    '',
  ].join('\n')
  downloadBlob(
    new Blob([withEducationNoticeMarkdown(markdown)], { type: 'text/markdown;charset=utf-8' }),
    `${toolId}-comparison.md`
  )
}

export function ScenarioComparison({ reportId, report }: { reportId: string; report: string }) {
  const state = useContext(ComparisonContext)
  if (!state) return null
  const exercise = BUSINESS_COMPARISON_CASES[state.toolId]
  const snapshot = state.snapshots.get(reportId)
  const baseline = snapshot?.baseline
  const changed = baseline !== undefined && baseline !== report
  const section = changed ? differingSection(baseline, report) : null
  const note = snapshot?.note
  const decision = note?.after === report ? note.decision : ''

  const download = () => {
    if (changed) downloadComparison(state.toolId, baseline, report, decision)
  }

  return (
    <details className="rounded border border-border p-3 text-sm print:hidden">
      <summary className="cursor-pointer font-semibold">Compare scenario outputs</summary>
      <p className="my-2">
        Keep a baseline, change one assumption in the tool, then compare the generated report here.
        The comparison stays in this browser tab when session storage is available.
      </p>
      {baseline !== undefined && exercise && (
        <p className="my-2">
          <strong>Try this change. </strong>
          {exercise.change}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11"
          onClick={() => state.capture(reportId, report)}
        >
          {baseline === undefined ? 'Keep this baseline' : 'Use current output as baseline'}
        </Button>
        {baseline !== undefined && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-11"
            onClick={() => state.clear(reportId)}
          >
            Clear comparison
          </Button>
        )}
      </div>
      <p role="status" className="mt-2">
        {baseline === undefined
          ? ''
          : changed
            ? 'The report changed. Compare the affected section below.'
            : 'The current report matches your baseline.'}
      </p>
      {section && (
        <div className="mt-2 grid gap-3 md:grid-cols-2">
          {(
            [
              ['Baseline', section.before],
              ['Current output', section.after],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="min-w-0">
              <h3 className="font-semibold">{label}</h3>
              <pre className="mt-1 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded bg-muted p-2 text-xs">
                {value || '(no text in this section)'}
              </pre>
            </div>
          ))}
        </div>
      )}
      {changed && (
        <div className="mt-3 space-y-2">
          <label className="block space-y-1">
            <span className="font-medium">Decision and next evidence</span>
            <textarea
              className="block w-full rounded-md border border-input bg-background p-2 text-foreground"
              rows={3}
              maxLength={1000}
              value={decision}
              onChange={(event) =>
                state.recordDecision(reportId, baseline, {
                  after: report,
                  decision: event.target.value,
                })
              }
            />
          </label>
          <Button type="button" variant="outline" size="sm" className="min-h-11" onClick={download}>
            Download scenario comparison
          </Button>
        </div>
      )}
      {baseline !== undefined && exercise && (
        <details className="mt-2">
          <summary className="cursor-pointer">How to interpret the change</summary>
          <p className="mt-1">{exercise.interpret}</p>
        </details>
      )}
    </details>
  )
}
