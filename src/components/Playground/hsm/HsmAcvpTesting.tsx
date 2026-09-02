// SPDX-License-Identifier: GPL-3.0-only
//
// Standalone ACVP validation view — sidebar | results | execution log.
// All state and the run logic live in acvp/useAcvpSuite.ts (extracted
// 2026-09-02); this file is presentation only. The Build tab's ACVP suite
// (dev/pipeline/suites/AcvpSuiteWorkbench.tsx) composes the same pieces
// inside the shared Builder/Code shell.
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
import { useAcvpSuite, CATEGORIES, ALL_CATEGORY_IDS, EVIDENCE_TIER_META } from './acvp/useAcvpSuite'

export { CATEGORIES, ALL_CATEGORY_IDS } from './acvp/useAcvpSuite'
export type { CategoryId } from './acvp/useAcvpSuite'

export const HsmAcvpTesting = () => {
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
  } = useAcvpSuite()

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <CheckCircle className="text-success" aria-hidden="true" size={20} />
            SoftHSMv3 FIPS Validation Mode (ACVP)
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Validates deterministic operations across the WASM PKCS#11 FFI using NIST CAVP target
            vectors.
          </p>
          <a
            href="https://github.com/usnistgov/ACVP-Server"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs hover:underline text-primary mt-2 block"
          >
            View NIST ACVP JSON Reference Vectors
          </a>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            data-testid="acvp-run-selected"
            onClick={() => runTests()}
            className="flex items-center gap-2"
            // Always clickable (unless a run is in flight): runTests self-heals the
            // session, so the user can recover from a lost session without reloading.
            disabled={loading || selectedCategories.size === 0}
            aria-busy={loading}
            title={
              selectedCategories.size === 0
                ? 'Check at least one category in the sidebar first'
                : `Run the ${selectedCategories.size} checked ${selectedCategories.size === 1 ? 'category' : 'categories'}`
            }
          >
            <Play size={16} /> Run Selected
          </Button>
          <Button
            variant="ghost"
            data-testid="acvp-run-all"
            onClick={() => runTests(ALL_CATEGORY_IDS)}
            className="btn-primary flex items-center gap-2"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {progress ? `Running ${progress.current}… (${progress.done} done)` : 'Running…'}
              </>
            ) : (
              <>
                <Play size={18} /> Run All
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Live run status: shows the suite is actually executing and how far it
          has progressed (the count climbs as each check streams in). */}
      {(loading || totalChecks > 0) && (
        <div className="shrink-0 space-y-1.5" aria-live="polite">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              {loading ? (
                <>
                  <Loader2 size={13} className="animate-spin text-primary" aria-hidden="true" />
                  Running ACVP validation…
                </>
              ) : (
                <>
                  <CheckCircle size={13} className="text-success" aria-hidden="true" />
                  Validation complete
                </>
              )}
            </span>
            <span className="tabular-nums text-muted-foreground">
              {totalChecks} {totalChecks === 1 ? 'row' : 'rows'}
              {skipped > 0 && ` (${executed} executed, ${skipped} skipped)`} ·{' '}
              <span className="text-success">{passed} passed</span>
              {failed > 0 && (
                <>
                  {' '}
                  · <span className="text-destructive">{failed} failed</span>
                </>
              )}
              {skipped > 0 && (
                <>
                  {' '}
                  · <span className="text-warning">{skipped} skipped</span>
                </>
              )}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={clsx(
                'h-full rounded-full transition-all',
                loading
                  ? 'w-full animate-pulse bg-primary'
                  : failed > 0
                    ? 'w-full bg-destructive'
                    : skipped > 0
                      ? 'w-full bg-warning'
                      : 'w-full bg-success'
              )}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_1fr] gap-6 flex-1 min-h-0">
        {/* Category sidebar — pick which test groups "Run Selected" executes.
            "Run All" always ignores this and runs every category. */}
        <div className="space-y-3 flex flex-col min-h-0">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-muted-foreground uppercase tracking-wider text-sm">
              Categories
            </h4>
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
          <div className="space-y-1 overflow-y-auto custom-scrollbar">
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
                    <span className="block font-medium text-foreground">{cat.label}</span>
                    <span className="block text-[10.5px] text-muted-foreground">
                      {cat.groups} test {cat.groups === 1 ? 'group' : 'groups'}
                      {catResults.length > 0 && (
                        <>
                          {' · '}
                          <span className="text-success">{catPassed} ok</span>
                          {catFailed > 0 && (
                            <>
                              {' '}
                              <span className="text-destructive">{catFailed} fail</span>
                            </>
                          )}
                        </>
                      )}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Results Column */}
        <div className="space-y-4 flex flex-col min-h-0">
          <h4 className="font-bold text-muted-foreground uppercase tracking-wider text-sm">
            Test Results
          </h4>
          <div className="bg-muted/30 border border-border rounded-lg overflow-hidden flex-1 overflow-y-auto custom-scrollbar">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/30 text-muted-foreground uppercase text-xs sticky top-0 backdrop-blur-md">
                  <tr>
                    <th className="p-3 font-bold">Category</th>
                    <th className="p-3 font-bold">Algorithm</th>
                    <th className="p-3 font-bold">Test Case</th>
                    <th className="p-3 font-bold">Status</th>
                    <th className="p-3 font-bold">Details</th>
                    <th className="p-3 font-bold">Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {results.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-foreground/30 italic">
                        No results yet. Run the validation suite to assert ACVP compliance.
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
                        <td className="p-3 text-[10.5px] text-muted-foreground whitespace-nowrap">
                          {CATEGORIES.find((c) => c.id === res.category)?.label ?? res.category}
                        </td>
                        <td className="p-3 font-medium text-foreground">{res.algorithm}</td>
                        <td className="p-3 text-muted-foreground">{res.testCase}</td>
                        <td className="p-3">
                          <span
                            className={clsx(
                              'px-2 py-0.5 rounded text-[10px] uppercase font-bold flex items-center gap-1 w-fit',
                              res.status === 'pass'
                                ? 'bg-success/20 text-success'
                                : res.status === 'skip'
                                  ? 'bg-warning/20 text-warning'
                                  : 'bg-destructive/20 text-destructive'
                            )}
                            title={
                              res.evidenceTier
                                ? EVIDENCE_TIER_META[res.evidenceTier].label
                                : undefined
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
                                return (
                                  <TierIcon size={11} className="opacity-70" aria-hidden="true" />
                                )
                              })()}
                          </span>
                        </td>
                        <td
                          className="p-3 text-muted-foreground truncate max-w-[200px]"
                          title={res.details}
                        >
                          {res.details}
                        </td>
                        <td className="p-3">
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

        {/* Logs Column */}
        <div className="space-y-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-muted-foreground uppercase tracking-wider text-sm">
              Execution Log
            </h4>
            {logs.length > 0 && (
              <Button
                variant="ghost"
                onClick={() => {
                  void navigator.clipboard.writeText(logs.join('\n')).then(() => {
                    setLogCopied(true)
                    if (logCopyTimerRef.current) clearTimeout(logCopyTimerRef.current)
                    logCopyTimerRef.current = setTimeout(() => setLogCopied(false), 2000)
                  })
                }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                title="Copy log to clipboard"
              >
                {logCopied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                {logCopied ? 'Copied' : 'Copy log'}
              </Button>
            )}
          </div>
          <div className="bg-muted/50 border border-border rounded-lg p-4 font-mono text-xs text-success/80 overflow-y-auto custom-scrollbar flex-1">
            {logs.length === 0 ? (
              <span className="text-foreground/20 italic">Ready to engage HSM suite...</span>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
