// SPDX-License-Identifier: AGPL-3.0-only
import { createContext, useContext, useState, type ReactNode } from 'react'
import { BUSINESS_COMPARISON_CASES } from '@/data/businessComparisonCases'
import { Button } from '@/components/ui/button'

interface ComparisonState {
  toolId: string
  baselines: ReadonlyMap<string, string>
  capture: (key: string, text: string) => void
}

const ComparisonContext = createContext<ComparisonState | null>(null)

/** An edit/preview switch can unmount the report. Keep its baseline with the tool. */
export function ScenarioComparisonProvider({
  children,
  toolId,
}: {
  children: ReactNode
  toolId: string
}) {
  const [baselines, setBaselines] = useState<ReadonlyMap<string, string>>(new Map())
  function capture(key: string, text: string) {
    setBaselines((previous) => new Map(previous).set(key, text))
  }
  return (
    <ComparisonContext.Provider value={{ baselines, capture, toolId }}>
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

export function ScenarioComparison({ reportId, report }: { reportId: string; report: string }) {
  const state = useContext(ComparisonContext)
  if (!state) return null
  const exercise = BUSINESS_COMPARISON_CASES[state.toolId]
  const baseline = state.baselines.get(reportId)
  const changed = baseline !== undefined && baseline !== report
  const section = changed ? differingSection(baseline, report) : null
  return (
    <details className="rounded border border-border p-3 text-sm print:hidden">
      <summary className="cursor-pointer font-semibold">Compare scenario outputs</summary>
      <p className="my-2">
        Keep a baseline, change one assumption in the tool, then compare the generated report here.
        The baseline lasts until you leave this tool.
      </p>
      {baseline !== undefined && exercise && (
        <p className="my-2">
          <strong>Try this change. </strong>
          {exercise.change}
        </p>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => state.capture(reportId, report)}
      >
        {baseline === undefined ? 'Keep this baseline' : 'Use current output as baseline'}
      </Button>
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
      {baseline !== undefined && exercise && (
        <details className="mt-2">
          <summary className="cursor-pointer">How to interpret the change</summary>
          <p className="mt-1">{exercise.interpret}</p>
        </details>
      )}
    </details>
  )
}
