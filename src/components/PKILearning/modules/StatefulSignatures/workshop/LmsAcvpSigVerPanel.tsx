// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { ShieldCheck, Loader2, CheckCircle, XCircle, MinusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ErrorAlert } from '@/components/ui/error-alert'
import { useHSM } from '@/hooks/useHSM'
import { KatEvidenceChip } from '@/components/shared/ValidationDisclaimer'
import { KatStatusBadge } from '@/components/shared/KatStatusBadge'
import { runLmsSigVerSample, type LmsSigVerResult } from './lmsAcvpSigVer'

const answerLabel = (r: LmsSigVerResult): string =>
  r.accepted === null ? 'Engine error' : r.accepted ? 'Accepted' : 'Rejected'

/**
 * Real published LMS sigVer cases: the public NIST ACVP-Server samples, run
 * through the in-browser engine and compared with NIST's own expected result.
 * This is the LMS known-answer check the functional round trips are not: the
 * expected value comes from NIST, not from the engine.
 */
export const LmsAcvpSigVerPanel: React.FC = () => {
  const hsm = useHSM()
  const [results, setResults] = useState<LmsSigVerResult[]>([])
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
      const collected: LmsSigVerResult[] = []
      await runLmsSigVerSample(M, hsm.hSessionRef.current, (r) => {
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
    <div className="glass-panel p-5 space-y-4 border border-border" data-testid="lms-acvp-sigver">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-primary shrink-0" aria-hidden="true" />
          <div>
            <h3 className="font-semibold text-foreground text-sm">
              LMS signature verification: NIST ACVP reference sample
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              SP 800-208 · RFC 8554 · public NIST ACVP-Server sigVer cases · evidence level:{' '}
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
              Run NIST LMS sigVer sample
            </>
          )}
        </Button>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {error
          ? `The NIST LMS sigVer sample could not run. ${error}`
          : done
            ? `${passed} of ${results.length} cases matched NIST's expected result.`
            : ''}
      </p>

      {error && <ErrorAlert message={error} onRetry={() => void run()} />}

      {done && (
        <div className="flex items-center gap-3 text-xs">
          <span
            data-testid="lms-acvp-pass-count"
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
          aria-label="LMS sigVer cases and results"
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
                <tr
                  key={`${r.revision}-${r.tgId}-${r.tcId}`}
                  className="hover:bg-muted/20 transition-colors"
                >
                  <td className="px-3 py-2 text-foreground">
                    <span className="font-mono">
                      {r.revision} · tg{r.tgId}/tc{r.tcId}
                    </span>
                    <span className="block text-muted-foreground">
                      {r.lmsMode} / {r.lmOtsMode}, message {r.messageBytes.toLocaleString('en-US')}{' '}
                      B, signature {r.signatureBytes.toLocaleString('en-US')} B
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{r.reason}</td>
                  <td className="px-3 py-2 font-medium text-foreground">
                    {r.testPassed ? 'Accept' : 'Reject'}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {answerLabel(r)}
                    <span className="block font-mono">{r.returned}</span>
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
          Verifies the published NIST LMS sigVer cases (valid signatures, and signatures NIST says
          must be rejected) with the in-browser engine and compares each answer with NIST&apos;s
          expected result.
        </p>
      )}

      <p className="text-[10px] text-muted-foreground border-t border-border pt-3">
        Source: public NIST ACVP-Server,{' '}
        <a
          href="https://github.com/usnistgov/ACVP-Server/tree/975de31eb83d87039ec88934fdc47d8c312b892d/gen-val/json-files/LMS-sigVer-SP800-208"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          LMS-sigVer-SP800-208
        </a>{' '}
        and{' '}
        <a
          href="https://github.com/usnistgov/ACVP-Server/tree/975de31eb83d87039ec88934fdc47d8c312b892d/gen-val/json-files/LMS-sigVer-1.0"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          LMS-sigVer-1.0
        </a>{' '}
        (commit 975de31), described by the{' '}
        <a
          href="https://pages.nist.gov/ACVP/draft-celi-acvp-lms.txt"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          ACVP LMS specification
        </a>
        . All 16 cases of both sample folders: four test groups (two per folder) on the SHA-256/192
        sets LMS_SHA256_M24_H5 / LMOTS_SHA256_N24_W1 and LMS_SHA256_M24_H10 / LMOTS_SHA256_N24_W2,
        each with one valid signature and three that must be rejected. The engine verifies LMS
        through PKCS#11 CKM_HSS, so each NIST key and signature is sent with the 4-byte one-level
        HSS prefix; the LMS bytes and messages are NIST&apos;s, unchanged. LMS key generation and
        signature generation, the SHA-256/256 and SHAKE sets, and HSS and XMSS are not run here.
        These are reference samples, not vectors issued by an ACVTS test session: passing them
        establishes no validation.
      </p>
    </div>
  )
}
