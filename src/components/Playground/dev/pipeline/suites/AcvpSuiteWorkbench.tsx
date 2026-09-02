// SPDX-License-Identifier: GPL-3.0-only
//
// AcvpSuiteWorkbench — the Build tab's ACVP suite inside the shared
// Builder/Code shell (design handoff design_handoff_kmip_pkcs11_playground
// §3.6, D6). Palette = the 7 algorithm-family categories (checkbox each,
// All/None), canvas = live progress + the streamed result rows, aside =
// counts, evidence-tier legend and the execution log. Code = a generated
// Python driver that runs the same selection through the `acvp_native`
// bridge. Execution is the untouched hsm/acvp/useAcvpSuite.ts runner —
// e2e/acvp-validator.spec.ts's testids and its `e2e:trigger_acvp` window
// event are preserved.
import { useMemo, useState } from 'react'
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
  EVIDENCE_TIER_META,
  type EvidenceTier,
} from '../../../hsm/acvp/useAcvpSuite'
import { SuiteShell, type SuiteView, type CodeRunOutput } from './SuiteShell'
import { emitAcvpSuite } from './suiteCodegen'
import { createAcvpBridge, runSuiteScript } from './suiteBridges'

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

  // Engineering-workbench surface — same gate as the suite trigger in
  // DeveloperTab; belt and braces for a stale/hand-crafted deep link.
  if (role === 'curious' || role === 'executive') return null

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
          const catResults = results.filter((r) => r.category === cat.id)
          const catPassed = catResults.filter((r) => r.status === 'pass').length
          const catFailed = catResults.filter((r) => r.status === 'fail').length
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
                {catResults.length > 0 && (
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
          <h3 className="text-base font-bold">ACVP Known-Answer Tests</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Validates deterministic operations across the WASM PKCS#11 FFI using NIST CAVP target
            vectors.{' '}
            <a
              href="https://github.com/usnistgov/ACVP-Server"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline text-primary"
            >
              NIST ACVP JSON reference vectors
            </a>
          </p>
        </div>
      </div>

      {(loading || totalChecks > 0) && (
        <div className="space-y-1.5" aria-live="polite">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              {loading ? (
                <>
                  <Loader2 size={13} className="animate-spin text-primary" aria-hidden="true" />
                  Running ACVP validation…
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
                  <td colSpan={6} className="p-8 text-center text-muted-foreground/60 italic">
                    No results yet. Pick categories on the left and press Run.
                  </td>
                </tr>
              ) : (
                results.map((res) => (
                  <tr
                    key={res.id}
                    data-testid="acvp-result-row"
                    data-category={res.category}
                    data-status={res.status}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-2 text-[10.5px] text-muted-foreground whitespace-nowrap">
                      {CATEGORIES.find((c) => c.id === res.category)?.label ?? res.category}
                    </td>
                    <td className="p-2 font-medium text-foreground">{res.algorithm}</td>
                    <td className="p-2 text-muted-foreground">{res.testCase}</td>
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
                        title={
                          res.evidenceTier ? EVIDENCE_TIER_META[res.evidenceTier].label : undefined
                        }
                      >
                        {res.status === 'pass' ? (
                          <CheckCircle size={12} />
                        ) : res.status === 'skip' ? (
                          <MinusCircle size={12} />
                        ) : (
                          <XCircle size={12} />
                        )}
                        {res.status}
                        {res.evidenceTier &&
                          (() => {
                            const TierIcon = EVIDENCE_TIER_META[res.evidenceTier].icon
                            return <TierIcon size={11} className="opacity-70" aria-hidden="true" />
                          })()}
                      </span>
                    </td>
                    <td
                      className="p-2 text-muted-foreground truncate max-w-[200px]"
                      title={res.details}
                    >
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
          Evidence tiers
        </div>
        <div className="flex flex-col gap-1 text-[11px]">
          {(Object.keys(EVIDENCE_TIER_META) as EvidenceTier[]).map((t) => {
            const Icon = EVIDENCE_TIER_META[t].icon
            return (
              <div key={t} className="flex items-start gap-1.5">
                <Icon size={12} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                <span className="text-muted-foreground">{EVIDENCE_TIER_META[t].label}</span>
              </div>
            )
          })}
        </div>
      </Card>
      <Card className="p-3.5 flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold uppercase text-muted-foreground">Execution log</div>
          {logs.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                void navigator.clipboard.writeText(logs.join('\n')).then(() => {
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
        <div className="bg-muted/50 border border-border rounded-md p-2 font-mono text-[10.5px] text-status-success/80 overflow-y-auto custom-scrollbar flex-1 min-h-[6rem] max-h-64">
          {logs.length === 0 ? (
            <span className="text-muted-foreground/60 italic">Ready to engage HSM suite…</span>
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
      title="ACVP Known-Answer Tests"
      subtitle="NIST ACVP reference vectors + self-consistency oracles, replayed against the WASM engine"
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
