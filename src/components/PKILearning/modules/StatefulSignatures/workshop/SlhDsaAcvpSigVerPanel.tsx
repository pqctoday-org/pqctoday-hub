// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { ShieldCheck, Loader2, CheckCircle, XCircle, MinusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ErrorAlert } from '@/components/ui/error-alert'
import { useHSM } from '@/hooks/useHSM'
import { KatEvidenceChip } from '@/components/shared/ValidationDisclaimer'
import { KatStatusBadge } from '@/components/shared/KatStatusBadge'
import { runSigVerSample, type SigVerSampleResult } from './slhdsaAcvpSigVer'

const answerLabel = (accepted: boolean | null): string =>
  accepted === null ? 'Engine error' : accepted ? 'Accepted' : 'Rejected'

/**
 * Real published SLH-DSA sigVer cases: the public NIST ACVP-Server sample, run
 * through the in-browser SLH-DSA engine and compared with NIST's own expected
 * result. This is the known-answer check the other rows in the Known Answer
 * panel are not: the expected value comes from NIST, not from the engine.
 */
export const SlhDsaAcvpSigVerPanel: React.FC = () => {
  const hsm = useHSM()
  const [results, setResults] = useState<SigVerSampleResult[]>([])
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async () => {
    setRunning(true)
    setDone(false)
    setError(null)
    setResults([])
    try {
      if (!hsm.isReady) await hsm.initialize()
      const M = hsm.moduleRef.current
      if (!M) throw new Error('The in-browser HSM engine did not start.')
      const collected: SigVerSampleResult[] = []
      await runSigVerSample(M, hsm.hSessionRef.current, (r) => {
        collected.push(r)
        setResults([...collected])
      })
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setRunning(false)
    }
  }

  const passed = results.filter((r) => r.status === 'pass').length
  const bad = results.length - passed

  return (
    <div
      className="glass-panel p-5 space-y-4 border border-border"
      data-testid="slhdsa-acvp-sigver"
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-primary shrink-0" aria-hidden="true" />
          <div>
            <h3 className="font-semibold text-foreground text-sm">
              SLH-DSA signature verification: NIST ACVP reference sample
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              FIPS 205 · public NIST ACVP-Server sigVer cases · evidence level:{' '}
              <KatEvidenceChip evidence="nist-acvp-reference-sample" />
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={run}
          disabled={running}
          className="flex items-center gap-2 shrink-0"
        >
          {running ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Running…
            </>
          ) : (
            <>
              <ShieldCheck size={14} />
              Run NIST sigVer sample
            </>
          )}
        </Button>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {error
          ? `The NIST sigVer sample could not run. ${error}`
          : done
            ? `${passed} of ${results.length} cases matched NIST's expected result.`
            : ''}
      </p>

      {error && <ErrorAlert message={error} onRetry={() => void run()} />}

      {done && (
        <div className="flex items-center gap-3 text-xs">
          <span
            data-testid="slhdsa-acvp-pass-count"
            className={`flex items-center gap-1 font-medium ${
              passed > 0 ? 'text-status-success' : 'text-muted-foreground'
            }`}
          >
            {passed > 0 ? <CheckCircle size={13} /> : <MinusCircle size={13} />}
            {passed} of {results.length} match NIST&apos;s expected result
          </span>
          {bad > 0 && (
            <span className="flex items-center gap-1 text-status-error font-medium">
              <XCircle size={13} />
              {bad} did not
            </span>
          )}
        </div>
      )}

      {results.length > 0 && (
        <div
          className="overflow-x-auto rounded-lg border border-border"
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- WCAG scrollable-region-focusable: the rows hold no focusable content, so the scroll region itself must be reachable by keyboard (same pattern as StatefulSigsIntroduction).
          tabIndex={0}
          role="region"
          aria-label="SLH-DSA sigVer cases and results"
        >
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-muted/40 border-b border-border text-muted-foreground uppercase tracking-wider">
                <th className="px-3 py-2 font-semibold">NIST case</th>
                <th className="px-3 py-2 font-semibold">NIST label</th>
                <th className="px-3 py-2 font-semibold">NIST expects</th>
                <th className="px-3 py-2 font-semibold">Engine</th>
                <th className="px-3 py-2 font-semibold">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {results.map((r) => (
                <tr key={`${r.tgId}-${r.tcId}`} className="hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2 text-foreground">
                    <span className="font-mono">
                      tg{r.tgId}/tc{r.tcId}
                    </span>
                    <span className="block text-muted-foreground">
                      {r.parameterSet}, pure, context {r.contextBytes} B, message {r.messageBytes}{' '}
                      B, signature {r.signatureBytes.toLocaleString('en-US')} B
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{r.reason}</td>
                  <td className="px-3 py-2 font-medium text-foreground">
                    {r.testPassed ? 'Accept' : 'Reject'}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {answerLabel(r.accepted)}
                    {r.status !== 'pass' && <span className="block">{r.details}</span>}
                  </td>
                  <td className="px-3 py-2">
                    <KatStatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {results.length === 0 && !running && !error && (
        <p className="text-xs text-muted-foreground italic">
          Verifies a small set of published NIST SLH-DSA sigVer cases (valid signatures, and
          signatures NIST says must be rejected) with the in-browser engine and compares each answer
          with NIST&apos;s expected result.
        </p>
      )}

      <p className="text-[10px] text-muted-foreground border-t border-border pt-3">
        Source: public{' '}
        <a
          href="https://github.com/usnistgov/ACVP-Server/tree/975de31eb83d87039ec88934fdc47d8c312b892d/gen-val/json-files/SLH-DSA-sigVer-FIPS205"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          NIST ACVP-Server, SLH-DSA-sigVer-FIPS205
        </a>{' '}
        (commit 975de31). Eight cases from two of its 36 test groups (SLH-DSA-SHA2-128s and
        SLH-DSA-SHAKE-128s, pure, external interface). Pre-hash, internal-interface, key-generation
        and signature-generation vectors are not run here. These are reference samples, not vectors
        issued by an ACVTS test session: passing them establishes no validation.
      </p>
    </div>
  )
}
