// SPDX-License-Identifier: GPL-3.0-only
//
// NativeConformanceEvidence — WS-G G-6: the pqctoday-hsm engines' own PKCS#11
// v3.2 conformance suites, shown from src/data/validation/
// native-conformance.generated.json (the native-conformance importer),
// never from hand-written numbers. Every count is shown with the engine
// commit and report date it belongs to, how far that commit is behind the
// pinned hsm commit, whether it is the commit this page's own WASM was built from, and the
// statement that none of it ran in this browser.
import { useEffect, useState } from 'react'
import { ListChecks } from 'lucide-react'
import {
  formatCounts,
  shortCommit,
  type NativeConformanceFile,
  type NativeSuiteRecord,
} from '@/data/validation/nativeConformance'

const ENGINE_LABEL: Record<NativeSuiteRecord['engine'], string> = {
  cpp: 'C++',
  rust: 'Rust',
  'cross-engine': 'C++ + Rust',
}

/** Where the suite ran, from the report's own statement — never inferred. */
const executionWording = (s: NativeSuiteRecord): string => {
  const r = s.report
  if (!r) return 'Not executed in this browser.'
  if (s.engine === 'cpp')
    return `Native suite (engine library ${r.engineAsStated}, as the report states), not executed in this browser.`
  return `Run by pqctoday-hsm's own harness against a ${r.target} (as the report states), not executed in this browser.`
}

const identityWording = (s: NativeSuiteRecord): string => {
  switch (s.report?.caseIdentity) {
    case 'suite-assigned':
      return 'yes (suite-assigned ids)'
    case 'derived-from-transcript':
      return 'derived from transcript labels (the harness assigns no ids)'
    default:
      return 'no — counts only'
  }
}

const SuiteBlock = ({ s }: { s: NativeSuiteRecord }) => {
  const r = s.report
  return (
    <div
      className="space-y-0.5 pt-1.5 border-t border-border/50"
      data-testid={`native-suite-${s.id}`}
    >
      <p className="font-medium text-foreground">{s.name}</p>
      <p>{executionWording(s)}</p>
      {r ? (
        <>
          <p className="font-mono text-foreground" data-testid="native-suite-counts">
            {formatCounts(r.counts)} · {r.counts.total} cases
          </p>
          <p>
            Engine commit <span className="font-mono">{shortCommit(r.engineCommit)}</span> · report
            dated <span className="font-mono">{r.reportDate}</span>
          </p>
          <p>
            {r.staleness.engineCommitOnPinnedMainHistory
              ? `${r.staleness.commitsFromEngineToPinnedMain} engine commit(s) behind the pinned hsm commit above (report-only commits not counted).`
              : `Not in the pinned hsm commit's history (a branch build); ${r.staleness.commitsFromEngineToPinnedMain} commit(s) at the pin are not in it.`}
          </p>
          {r.wasm && (
            <p>
              {r.wasm.engineCommitEqualsBundleCommit
                ? `Same hsm commit as this page's ${ENGINE_LABEL[s.engine]} WASM.`
                : `Not the hsm commit this page's ${ENGINE_LABEL[s.engine]} WASM was built from (${shortCommit(r.wasm.bundleHsmCommit)}).`}
            </p>
          )}
          <p>Per-case identity: {identityWording(s)}</p>
        </>
      ) : null}
      {s.openGaps.length > 0 && (
        <details>
          <summary className="cursor-pointer">Open gaps ({s.openGaps.length})</summary>
          <ul className="list-disc pl-4 space-y-0.5">
            {s.openGaps.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}

export const NativeConformanceEvidenceView = ({ data }: { data: NativeConformanceFile }) => (
  <div className="space-y-1.5" data-testid="native-conformance-evidence">
    <p className="flex items-center gap-1.5 font-medium text-foreground">
      <ListChecks className="h-3.5 w-3.5" /> Engine suites — not executed in this browser
    </p>
    <p>
      Imported from the reports pqctoday-hsm committed, read at hsm{' '}
      <span className="font-mono">{shortCommit(data.hsm.pinnedCommit)}</span> (
      {data.hsm.pinnedCommitDate}
      {data.hsm.pinnedCommitPublished
        ? ''
        : '; an unpushed local hsm commit, not yet on any pqctoday-hsm remote'}
      ). They are the engines&apos; own results for the commit named under each suite, not results
      for this browser session.
    </p>
    {data.suites.map((s) => (
      <SuiteBlock key={s.id} s={s} />
    ))}
  </div>
)

/** Loads the generated file on demand (its ~2,000 case ids stay out of the page chunk). */
export const NativeConformanceEvidence = () => {
  const [data, setData] = useState<NativeConformanceFile | null>(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    let live = true
    import('@/data/validation/native-conformance.generated.json')
      .then((m) => live && setData(m.default as unknown as NativeConformanceFile))
      .catch(() => live && setError(true))
    return () => {
      live = false
    }
  }, [])
  if (error) return <p>The engine-suite evidence could not be loaded.</p>
  if (!data) return <p>Loading engine-suite evidence…</p>
  return <NativeConformanceEvidenceView data={data} />
}
