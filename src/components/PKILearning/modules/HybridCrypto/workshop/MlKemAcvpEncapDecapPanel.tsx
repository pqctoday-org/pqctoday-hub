// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { ShieldCheck, Loader2, CheckCircle, XCircle, MinusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ErrorAlert } from '@/components/ui/error-alert'
import { useHSM } from '@/hooks/useHSM'
import { KatEvidenceChip } from '@/components/shared/ValidationDisclaimer'
import { KatStatusBadge } from '@/components/shared/KatStatusBadge'
import {
  runEncapDecapSample,
  PARAMETER_SET,
  type EncapDecapFunction,
  type EncapDecapResult,
} from './mlkemAcvpEncapDecap'

const FUNCTION_LABEL: Record<EncapDecapFunction, string> = {
  encapsulation: 'Encapsulation (AFT)',
  decapsulation: 'Decapsulation (VAL)',
  encapsulationKeyCheck: 'Encapsulation-key check (VAL)',
  decapsulationKeyCheck: 'Decapsulation-key check (VAL)',
}

/**
 * Real published ML-KEM encapDecap cases: the public NIST ACVP-Server sample,
 * run through the in-browser ML-KEM engine and compared with NIST's own expected
 * result. Unlike the round-trip rows in the Known Answer panel below it, the
 * expected value comes from NIST, not from the engine itself.
 */
export const MlKemAcvpEncapDecapPanel: React.FC = () => {
  const hsm = useHSM()
  const [results, setResults] = useState<EncapDecapResult[]>([])
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
      const collected: EncapDecapResult[] = []
      await runEncapDecapSample(M, hsm.hSessionRef.current, (r) => {
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
      data-testid="mlkem-acvp-encapdecap"
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-primary shrink-0" aria-hidden="true" />
          <div>
            <h3 className="font-semibold text-foreground text-sm">
              {PARAMETER_SET} encapsulation and decapsulation: NIST ACVP reference sample
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              FIPS 203 · public NIST ACVP-Server encapDecap cases · expected result from NIST{' '}
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
              Run NIST encapDecap sample
            </>
          )}
        </Button>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {error
          ? `The NIST encapDecap sample could not run. ${error}`
          : done
            ? `${passed} of ${results.length} cases matched NIST's expected result.`
            : ''}
      </p>

      {error && <ErrorAlert message={error} onRetry={() => void run()} />}

      {done && (
        <div className="flex items-center gap-3 text-xs">
          <span
            data-testid="mlkem-acvp-pass-count"
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
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- WCAG scrollable-region-focusable: the rows hold no focusable content, so the scroll region itself must be reachable by keyboard (same pattern as SlhDsaAcvpSigVerPanel).
          tabIndex={0}
          role="region"
          aria-label="ML-KEM encapDecap cases and results"
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
                      {FUNCTION_LABEL[r.function]}, {r.inputs}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{r.label}</td>
                  <td className="px-3 py-2 font-medium text-foreground">{r.expects}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.observed}</td>
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
          Runs published NIST ML-KEM-768 cases through the in-browser engine: encapsulation with
          NIST&apos;s random value m, decapsulation of valid and modified ciphertexts, and keys the
          FIPS 203 input checks must accept or reject. Each answer is compared with NIST&apos;s.
        </p>
      )}

      <p className="text-[10px] text-muted-foreground border-t border-border pt-3">
        Source: public{' '}
        <a
          href="https://github.com/usnistgov/ACVP-Server/tree/975de31eb83d87039ec88934fdc47d8c312b892d/gen-val/json-files/ML-KEM-encapDecap-FIPS203"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          NIST ACVP-Server, ML-KEM-encapDecap-FIPS203
        </a>{' '}
        (commit 975de31), ML-KEM-768 groups only: three of 25 encapsulation cases, four
        decapsulation cases and two cases of each key check. Encapsulation uses NIST&apos;s m, a
        test input this engine accepts outside the PKCS#11 standard. ML-KEM-512 and ML-KEM-1024, key
        generation and the remaining cases are not run here. These are reference samples, not
        vectors issued by an ACVTS test session: passing them establishes no validation.
      </p>
    </div>
  )
}
