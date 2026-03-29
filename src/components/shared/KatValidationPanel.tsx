// SPDX-License-Identifier: GPL-3.0-only
/**
 * KatValidationPanel — Inline KAT validation panel for learn module workshop steps.
 *
 * Self-manages its own HSM lifecycle via useHSM(). Runs use-case-specific KATs
 * against NIST FIPS 203/204 ACVP test vectors and displays results inline.
 */
import { useState } from 'react'
import { ShieldCheck, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useHSM } from '@/hooks/useHSM'
import { runKAT } from '@/utils/katRunner'
import type { KATResult, KatTestSpec } from '@/utils/katRunner'

interface KatValidationPanelProps {
  specs: KatTestSpec[]
  label: string
  authorityNote: string
}

export const KatValidationPanel: React.FC<KatValidationPanelProps> = ({
  specs,
  label,
  authorityNote,
}) => {
  const hsm = useHSM()
  const [results, setResults] = useState<KATResult[]>([])
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runKATs = async () => {
    setRunning(true)
    setError(null)
    setResults([])

    try {
      if (!hsm.isReady) {
        await hsm.initialize()
      }
      const M = hsm.moduleRef.current!
      const hSession = hsm.hSessionRef.current
      const out: KATResult[] = []
      for (const spec of specs) {
        const r = await runKAT(M, hSession, spec)
        out.push(r)
        setResults([...out])
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setRunning(false)
    }
  }

  const passCount = results.filter((r) => r.status === 'pass').length
  const failCount = results.filter((r) => r.status !== 'pass').length
  const done = results.length === specs.length && !running

  return (
    <div className="glass-panel p-5 space-y-4 border border-border">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-primary shrink-0" aria-hidden="true" />
          <div>
            <h4 className="font-semibold text-foreground text-sm">{label}</h4>
            <p className="text-xs text-muted-foreground mt-0.5">{authorityNote}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={runKATs}
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
              Run NIST KAT
            </>
          )}
        </Button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-status-error bg-status-error/10 rounded-lg px-3 py-2">
          <AlertCircle size={13} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Summary badges */}
      {done && (
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-status-success font-medium">
            <CheckCircle size={13} />
            {passCount} passed
          </span>
          {failCount > 0 && (
            <span className="flex items-center gap-1 text-status-error font-medium">
              <XCircle size={13} />
              {failCount} failed
            </span>
          )}
        </div>
      )}

      {/* Results table */}
      {results.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-muted/40 border-b border-border text-muted-foreground uppercase tracking-wider">
                <th className="px-3 py-2 font-semibold">Use Case</th>
                <th className="px-3 py-2 font-semibold">Algorithm</th>
                <th className="px-3 py-2 font-semibold">Standard</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {results.map((r) => (
                <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2 font-medium text-foreground">{r.useCase}</td>
                  <td className="px-3 py-2 font-mono text-foreground">{r.algorithm}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {r.referenceUrl ? (
                      <a
                        href={r.referenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {r.standard}
                      </a>
                    ) : (
                      r.standard
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        r.status === 'pass'
                          ? 'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-status-success/10 text-status-success'
                          : 'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-status-error/10 text-status-error'
                      }
                    >
                      {r.status === 'pass' ? <CheckCircle size={10} /> : <XCircle size={10} />}
                      {r.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{r.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state */}
      {results.length === 0 && !running && !error && (
        <p className="text-xs text-muted-foreground italic">
          Click <strong>Run NIST KAT</strong> to validate {specs.length} use-case scenario
          {specs.length !== 1 ? 's' : ''} against NIST ACVP test vectors.
        </p>
      )}

      {/* Authority footnote */}
      <p className="text-[10px] text-muted-foreground border-t border-border pt-3">
        Test vectors from{' '}
        <a
          href="https://github.com/usnistgov/ACVP-Server"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          NIST ACVP Server
        </a>{' '}
        · {authorityNote} · Generated keys are for educational use only.
      </p>
    </div>
  )
}
