// SPDX-License-Identifier: AGPL-3.0-only
import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const reportPath = '/data/fhe-evidence/ckks-scoring-service-x86-vm-kmip-5f0ff3d/check.json'

type Reference = 'cubic' | 'sigmoid'
type Result = {
  maxError: number
  withinTolerance: boolean
  heldOutRows: number
}

function readSampleReport(report: unknown, reference: Reference) {
  if (!report || typeof report !== 'object') throw new Error('Invalid report')
  const sample = report as {
    uniqueTestRows?: number
    scoreVsPlaintextPolynomial_uniqueRows?: { maxAbs?: number }
    scoreVsExactSigmoid_uniqueRows?: { maxAbs?: number }
  }
  const maxError =
    reference === 'cubic'
      ? sample.scoreVsPlaintextPolynomial_uniqueRows?.maxAbs
      : sample.scoreVsExactSigmoid_uniqueRows?.maxAbs
  const heldOutRows = sample.uniqueTestRows
  if (
    typeof maxError !== 'number' ||
    !Number.isFinite(maxError) ||
    maxError < 0 ||
    typeof heldOutRows !== 'number' ||
    !Number.isSafeInteger(heldOutRows) ||
    heldOutRows < 1
  ) {
    throw new Error('Missing sample metrics')
  }
  return { maxError, heldOutRows }
}

export function CkksAccuracyCheck({ onComplete }: { onComplete: () => void }) {
  const id = useId()
  const [reference, setReference] = useState<Reference>('cubic')
  const [tolerance, setTolerance] = useState('0.001')
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')
  const [running, setRunning] = useState(false)

  async function check() {
    const limit = Number(tolerance)
    if (!tolerance.trim() || !Number.isFinite(limit) || limit <= 0 || limit > 1) {
      setError('Enter a maximum absolute error greater than 0 and at most 1.')
      return
    }
    setError('')
    setResult(null)
    setRunning(true)
    try {
      const response = await fetch(reportPath)
      if (!response.ok) throw new Error('Report not available')
      const observed = readSampleReport(await response.json(), reference)
      setResult({ ...observed, withinTolerance: observed.maxError <= limit })
      onComplete()
    } catch {
      setError('Unable to read the archived CKKS result. Check again when the report is available.')
    } finally {
      setRunning(false)
    }
  }

  return (
    <section aria-labelledby={id} className="glass-panel p-4 space-y-3">
      <h4 id={id} className="text-sm font-semibold">
        Does the CKKS result meet your error limit?
      </h4>
      <p className="text-xs text-muted-foreground">
        Use recorded results from a reference CKKS run. The service evaluated a cubic on encrypted
        values. Compare its decrypted scores with that same cubic in plaintext to check computation
        error, then compare with the exact sigmoid to include error from approximating the original
        model. This exercise reads the archived run without sending inputs or starting a new run.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs space-y-1">
          <span className="block">Plaintext reference</span>
          {/* eslint-disable-next-line no-restricted-syntax -- Native <select> preserved for form semantics and Playwright combobox/selectOption tests */}
          <select
            value={reference}
            disabled={running}
            onChange={(event) => {
              setReference(event.target.value === 'sigmoid' ? 'sigmoid' : 'cubic')
              setResult(null)
              setError('')
            }}
            className="w-full min-h-[44px] rounded-md border border-border bg-background px-2 text-sm"
          >
            <option value="cubic">Same cubic evaluated by CKKS</option>
            <option value="sigmoid">Exact sigmoid from the original model</option>
          </select>
        </label>
        <label htmlFor={`${id}-tolerance`} className="text-xs space-y-1">
          <span className="block">Maximum absolute error allowed</span>
          <Input
            id={`${id}-tolerance`}
            value={tolerance}
            disabled={running}
            inputMode="decimal"
            onChange={(event) => {
              setTolerance(event.target.value)
              setResult(null)
              setError('')
            }}
          />
        </label>
      </div>
      <Button variant="outline" size="sm" onClick={check} disabled={running}>
        {running ? 'Reading recorded result…' : 'Check recorded result'}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-status-error">
          {error}
        </p>
      )}
      <div role="status" aria-label="CKKS accuracy decision" className="text-sm">
        {result && (
          <>
            <p className="font-semibold">
              {result.withinTolerance
                ? 'Within the sample error limit.'
                : 'Exceeds the sample error limit.'}
            </p>
            <p>
              Observed maximum absolute error {result.maxError.toPrecision(4)} across{' '}
              {result.heldOutRows.toLocaleString('en-US')} held-out rows.
            </p>
            <p>
              {reference === 'cubic'
                ? 'This measures CKKS evaluation and release error against the same cubic.'
                : 'This includes the difference introduced by replacing the exact sigmoid with a cubic.'}
            </p>
          </>
        )}
      </div>
      <a className="text-xs text-primary underline" href={reportPath}>
        Open the archived CKKS report
      </a>
    </section>
  )
}
