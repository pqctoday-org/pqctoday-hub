// SPDX-License-Identifier: GPL-3.0-only
//
// AcvpSuiteWorkbench — the Build tab's Cryptographic Validation Workbench
// (historically "the ACVP suite"; it mixes evidence classes, so the visible
// heading no longer says ACVP — remediation plan WS-A, A-1) inside the shared
// Builder/Code shell (design handoff design_handoff_kmip_pkcs11_playground
// §3.6, D6). Palette = the 7 algorithm-family categories (checkbox each,
// All/None), canvas = live progress + the streamed result rows, aside =
// counts, evidence-class legend and the execution log. Code = a generated
// Python driver that runs the same selection through the `acvp_native`
// bridge. Execution is the untouched hsm/acvp/useAcvpSuite.ts runner —
// e2e/acvp-validator.spec.ts's testids and its `e2e:trigger_acvp` window
// event are preserved.
import { memo, useMemo, useState } from 'react'
import {
  Play,
  CheckCircle,
  XCircle,
  MinusCircle,
  ExternalLink,
  Copy,
  Check,
  Loader2,
} from 'lucide-react'
import clsx from 'clsx'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useHsmContext } from '../../../hsm/HsmContext'
import {
  useAcvpSuite,
  CATEGORIES,
  ALL_CATEGORY_IDS,
  type TestResult,
} from '../../../hsm/acvp/useAcvpSuite'
import { ValidationDisclaimer } from '@/components/shared/ValidationDisclaimer'
import { CaseEvidenceBadge, coverageMatrixUrl } from '@/components/shared/CaseEvidenceBadge'
import { evidenceForRowId } from '@/data/validation/acvpRowEvidence'
import { EVIDENCE_CLASSES, EVIDENCE_CLASS_SHORT } from '@/data/validation/evidenceClasses'
import { VALIDATION_DISCLAIMER_TEXT } from '@/data/validationDisclaimer'
import { SuiteShell, type SuiteView, type CodeRunOutput } from './SuiteShell'
import { emitAcvpSuite } from './suiteCodegen'
import { createAcvpBridge, runSuiteScript } from './suiteBridges'

/**
 * One streamed result row, memoized on the result object.
 *
 * Why memo (2026-09-25 slow-run fix): the runner streams ~1100 rows and
 * commits them in batches, and without this every commit re-rendered every
 * row's whole subtree — a CATEGORIES lookup, an `evidenceForRowId` lookup, a
 * CaseEvidenceBadge and two lucide SVGs each. That is O(rows × commits) real
 * render work and it dominated the full-suite wall time (measured 173.8 s →
 * 122.5 s from batching alone, then 122.5 s → see the spec's timing comment
 * from this memo). `res` objects are created once by pushResult and never
 * mutated, so reference equality is a sound bail-out.
 */
const AcvpResultRow = memo(({ res }: { res: TestResult }) => (
  <tr
    data-testid="acvp-result-row"
    // The stable per-case id, so a test can address ONE row instead of
    // text-filtering it. Text filters are ambiguous here: the evidence badge
    // renders each record's limitations, and those quote the vector file's
    // subset policy, which itself names every upstream negative reason — so
    // filtering rows by e.g. 'invalid signature - too small' also matches the
    // POSITIVE case of the same parameter set (found 2026-09-25).
    data-row-id={res.id}
    data-category={res.category}
    data-status={res.status}
    className="hover:bg-muted/30 transition-colors"
  >
    <td className="p-2 text-[10.5px] text-muted-foreground whitespace-nowrap">
      {CATEGORIES.find((c) => c.id === res.category)?.label ?? res.category}
    </td>
    <td className="p-2 font-medium text-foreground">{res.algorithm}</td>
    <td className="p-2 text-muted-foreground">
      {res.testCase}
      <CaseEvidenceBadge records={evidenceForRowId(res.id)} className="mt-1" />
    </td>
    <td className="p-2">
      <span
        className={clsx(
          'px-2 py-0.5 rounded text-[10px] uppercase font-bold flex items-center gap-1 w-fit',
          res.status === 'pass'
            ? 'bg-status-success/20 text-status-success'
            : res.status === 'skip'
              ? 'bg-status-warning/20 text-status-warning'
              : 'bg-destructive/20 text-destructive'
        )}
      >
        {res.status === 'pass' ? (
          <CheckCircle size={12} />
        ) : res.status === 'skip' ? (
          <MinusCircle size={12} />
        ) : (
          <XCircle size={12} />
        )}
        {res.status}
      </span>
    </td>
    <td className="p-2 text-muted-foreground truncate max-w-[200px]" title={res.details}>
      {res.details}
    </td>
    <td className="p-2">
      <a
        href={res.referenceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:text-primary/70 transition-colors"
        title={res.referenceUrl}
      >
        <ExternalLink size={12} />
      </a>
    </td>
  </tr>
))
AcvpResultRow.displayName = 'AcvpResultRow'

export const AcvpSuiteWorkbench = () => {
  const role = usePersonaStore((s) => s.selectedPersona)
  const { engineMode } = useHsmContext()
  const suite = useAcvpSuite()
  const {
    results,
    loading,
    progress,
    logs,
    logCopied,
    setLogCopied,
    logCopyTimerRef,
    selectedCategories,
    setSelectedCategories,
    runTests,
    totalChecks,
    passed,
    failed,
    skipped,
    executed,
  } = suite
  const [view, setView] = useState<SuiteView>('builder')
  const [codeRunning, setCodeRunning] = useState(false)
  const [codeOutput, setCodeOutput] = useState<CodeRunOutput | null>(null)

  const code = useMemo(
    () => emitAcvpSuite(selectedCategories, engineMode),
    [selectedCategories, engineMode]
  )

  // Per-category pass/fail counts in one pass over `results`, memoized.
  // This used to be 3 full `results.filter()` scans per category (21 scans of a
  // ~1100-row array) on every render, and the runner renders on every batched
  // commit during a run — part of the same O(rows × commits) cost the memoized
  // row above addresses.
  const catCounts = useMemo(() => {
    const acc = new Map<string, { total: number; passed: number; failed: number }>()
    for (const r of results) {
      let e = acc.get(r.category)
      if (!e) {
        e = { total: 0, passed: 0, failed: 0 }
        acc.set(r.category, e)
      }
      e.total += 1
      if (r.status === 'pass') e.passed += 1
      else if (r.status === 'fail') e.failed += 1
    }
    return acc
  }, [results])

  // Engineering-workbench surface — same gate as the suite trigger in
  // DeveloperTab; belt and braces for a stale/hand-crafted deep link.
  if (role === 'curious' || role === 'executive' || role === 'grc') return null

  const runCode = async () => {
    setCodeRunning(true)
    setCodeOutput(null)
    try {
      setCodeOutput(await runSuiteScript(code, { acvp_native: createAcvpBridge(suite) }))
    } catch (e) {
      setCodeOutput({ ok: false, text: `Could not run: ${(e as Error).message}` })
    } finally {
      setCodeRunning(false)
    }
  }

  const running = loading || codeRunning

  const palette = (
    <>
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase text-muted-foreground">
          Categories — click to include/exclude
        </div>
        <div className="flex items-center gap-2 text-[10.5px]">
          <Button
            variant="link"
            data-testid="acvp-select-all"
            className="h-auto p-0 text-[10.5px]"
            onClick={() => setSelectedCategories(new Set(ALL_CATEGORY_IDS))}
          >
            All
          </Button>
          <span className="text-muted-foreground">·</span>
          <Button
            variant="link"
            data-testid="acvp-select-none"
            className="h-auto p-0 text-[10.5px]"
            onClick={() => setSelectedCategories(new Set())}
          >
            None
          </Button>
        </div>
      </div>
      <div className="space-y-1">
        {CATEGORIES.map((cat) => {
          const c = catCounts.get(cat.id)
          const catPassed = c?.passed ?? 0
          const catFailed = c?.failed ?? 0
          return (
            <label
              key={cat.id}
              data-testid={`acvp-category-row-${cat.id}`}
              className="flex items-start gap-2 p-1.5 rounded-md hover:bg-muted/50 cursor-pointer text-xs"
            >
              <input
                type="checkbox"
                aria-label={cat.label}
                data-testid={`acvp-category-checkbox-${cat.id}`}
                className="mt-0.5 accent-primary"
                checked={selectedCategories.has(cat.id)}
                onChange={(e) =>
                  setSelectedCategories((prev) => {
                    const next = new Set(prev)
                    if (e.target.checked) next.add(cat.id)
                    else next.delete(cat.id)
                    return next
                  })
                }
              />
              <span className="flex-1 min-w-0">
                <span className="flex items-center justify-between gap-2">
                  <span className="font-medium text-foreground">{cat.label}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{cat.groups}</span>
                </span>
                {(c?.total ?? 0) > 0 && (
                  <span className="block text-[10.5px] text-muted-foreground">
                    <span className="text-status-success">{catPassed} ok</span>
                    {catFailed > 0 && (
                      <>
                        {' '}
                        <span className="text-destructive">{catFailed} fail</span>
                      </>
                    )}
                  </span>
                )}
              </span>
            </label>
          )
        })}
      </div>
      <div className="mt-auto pt-3 border-t text-[10.5px] text-muted-foreground">
        <div className="font-semibold uppercase mb-1">Engine</div>
        <div className="font-mono">
          {engineMode === 'cpp' ? 'C++' : engineMode === 'rust' ? 'Rust' : 'C++ + Rust (dual)'}
        </div>
      </div>
    </>
  )

  const canvas = (
    <div className="space-y-3 flex flex-col min-h-0 flex-1">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-base font-bold">Cryptographic Validation Workbench</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Replays sampled test cases across the WASM PKCS#11 FFI. Evidence is mixed: selected
            public{' '}
            <a
              href="https://github.com/usnistgov/ACVP-Server"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline text-primary"
            >
              NIST ACVP-Server reference samples
            </a>
            , published-standard KATs, OpenSSL-oracle comparisons and functional round-trips. Hover
            a row&apos;s status badge for its evidence tier; rows without a tier icon are functional
            or behavioral checks with no external expected value.
          </p>
        </div>
      </div>

      <ValidationDisclaimer />

      {(loading || totalChecks > 0) && (
        <div className="space-y-1.5" aria-live="polite">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              {loading ? (
                <>
                  <Loader2 size={13} className="animate-spin text-primary" aria-hidden="true" />
                  Running validation tests…
                  {progress ? ` ${progress.current} (${progress.done} done)` : ''}
                </>
              ) : (
                <>
                  <CheckCircle size={13} className="text-status-success" aria-hidden="true" />
                  Validation complete
                </>
              )}
            </span>
            <span className="tabular-nums text-muted-foreground">
              {totalChecks} {totalChecks === 1 ? 'row' : 'rows'}
              {skipped > 0 && ` (${executed} executed, ${skipped} skipped)`} ·{' '}
              <span className="text-status-success">{passed} passed</span>
              {failed > 0 && (
                <>
                  {' '}
                  · <span className="text-destructive">{failed} failed</span>
                </>
              )}
              {skipped > 0 && (
                <>
                  {' '}
                  · <span className="text-status-warning">{skipped} skipped</span>
                </>
              )}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={clsx(
                'h-full rounded-full transition-all w-full',
                loading
                  ? 'animate-pulse bg-primary'
                  : failed > 0
                    ? 'bg-destructive'
                    : skipped > 0
                      ? 'bg-status-warning'
                      : 'bg-status-success'
              )}
            />
          </div>
        </div>
      )}

      <div className="bg-muted/30 border border-border rounded-lg overflow-hidden flex-1 overflow-y-auto custom-scrollbar">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/30 text-muted-foreground uppercase text-[10px] sticky top-0 backdrop-blur-md">
              <tr>
                <th className="p-2 font-bold">Category</th>
                <th className="p-2 font-bold">Algorithm</th>
                <th className="p-2 font-bold">Test Case</th>
                <th className="p-2 font-bold">Status</th>
                <th className="p-2 font-bold">Details</th>
                <th className="p-2 font-bold">Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {results.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground/80 italic">
                    No results yet. Pick categories on the left and press Run.
                  </td>
                </tr>
              ) : (
                results.map((res) => <AcvpResultRow key={res.id} res={res} />)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const aside = (
    <>
      <Card className="p-3.5">
        <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">Selection</div>
        <div className="flex flex-col gap-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Categories</span>
            <span className="font-mono">
              {selectedCategories.size}/{CATEGORIES.length}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Test groups</span>
            <span className="font-mono">
              {CATEGORIES.filter((c) => selectedCategories.has(c.id)).reduce(
                (n, c) => n + c.groups,
                0
              )}
              /{CATEGORIES.reduce((n, c) => n + c.groups, 0)}
            </span>
          </div>
          {totalChecks > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last run</span>
              <span className="font-mono">
                {passed}✓ {failed}✗ {skipped}○
              </span>
            </div>
          )}
        </div>
      </Card>
      <Card className="p-3.5">
        <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">
          Evidence classes
        </div>
        <p className="mb-1.5 text-[10.5px] text-muted-foreground">
          Each row&apos;s class, case, parameters, source and limits come from the reviewed vector
          manifest and test registry. Rows with no badge (skips, errors) are evidence of nothing.
        </p>
        <dl className="flex flex-col gap-1 text-[11px]" data-testid="acvp-evidence-legend">
          {Object.values(EVIDENCE_CLASSES).map((c) => (
            <div key={c.id}>
              <dt className="font-medium text-foreground">{EVIDENCE_CLASS_SHORT[c.id]}</dt>
              <dd className="text-muted-foreground">{c.permittedClaim}</dd>
            </div>
          ))}
        </dl>
        <a
          href={coverageMatrixUrl()}
          className="mt-2 inline-block text-[11px] text-primary hover:underline"
          data-testid="acvp-coverage-link"
        >
          Full coverage matrix and open gaps →
        </a>
      </Card>
      <Card className="p-3.5 flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold uppercase text-muted-foreground">Execution log</div>
          {logs.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                void navigator.clipboard
                  .writeText([VALIDATION_DISCLAIMER_TEXT, '', ...logs].join('\n'))
                  .then(() => {
                    setLogCopied(true)
                    if (logCopyTimerRef.current) clearTimeout(logCopyTimerRef.current)
                    logCopyTimerRef.current = setTimeout(() => setLogCopied(false), 2000)
                  })
              }}
              className="h-6 gap-1 px-1.5 text-[10.5px] text-muted-foreground hover:text-foreground"
              title="Copy log to clipboard"
            >
              {logCopied ? <Check size={11} className="text-status-success" /> : <Copy size={11} />}
              {logCopied ? 'Copied' : 'Copy'}
            </Button>
          )}
        </div>
        <div
          data-testid="acvp-execution-log"
          className="bg-muted/50 border border-border rounded-md p-2 font-mono text-[10.5px] text-status-success/80 overflow-y-auto custom-scrollbar flex-1 min-h-[6rem] max-h-64"
        >
          {logs.length === 0 ? (
            <span className="text-muted-foreground/80 italic">Ready to engage HSM suite…</span>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="mb-0.5">
                {log}
              </div>
            ))
          )}
        </div>
      </Card>
    </>
  )

  return (
    <SuiteShell
      title="Cryptographic Validation Workbench"
      subtitle="Selected NIST ACVP-Server reference samples, standard KATs, oracle comparisons and functional round-trips, replayed against the WASM engine"
      actions={
        <Button
          variant="ghost"
          size="sm"
          data-testid="acvp-run-all"
          onClick={() => void runTests(ALL_CATEGORY_IDS)}
          disabled={running}
          aria-busy={loading}
          title="Run every category regardless of the selection"
        >
          <Play size={14} className="mr-1" /> Run all
        </Button>
      }
      running={running}
      runLabel="Run"
      runTestId="acvp-run-selected"
      runDisabled={view === 'builder' && selectedCategories.size === 0}
      runTitle={
        view === 'code'
          ? 'Run the generated script through the acvp_native bridge'
          : selectedCategories.size === 0
            ? 'Check at least one category first'
            : `Run the ${selectedCategories.size} checked ${selectedCategories.size === 1 ? 'category' : 'categories'}`
      }
      onRun={() => (view === 'code' ? void runCode() : void runTests())}
      palette={palette}
      canvas={canvas}
      aside={aside}
      code={code}
      downloadName="acvp-suite.py"
      codeOutput={codeOutput}
      view={view}
      onViewChange={setView}
      testId="acvp-suite-workbench"
    />
  )
}
