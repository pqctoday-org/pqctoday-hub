// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { Play, Loader2, Check, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'
import {
  resolveEngine,
  getEngineLabel,
  runBenchmark,
  type BenchmarkResult,
} from '../../services/crypto/algorithmEngineResolver'
import type { AlgorithmDetail } from '../../data/pqcAlgorithmsData'
import { Button } from '@/components/ui/button'

interface AlgorithmCheckButtonProps {
  algorithm: AlgorithmDetail
}

export function AlgorithmCheckButton({ algorithm }: AlgorithmCheckButtonProps) {
  const [state, setState] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<BenchmarkResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  const engine = resolveEngine(algorithm.name)
  if (!engine) return null

  const handleRun = async () => {
    setState('running')
    setError(null)
    try {
      const res = await runBenchmark(algorithm.name)
      setResult(res)
      setState('done')
      setExpanded(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setState('error')
    }
  }

  const sizeMatch = (
    actual: number | null,
    expected: number | null
  ): 'match' | 'mismatch' | 'na' => {
    if (actual === null || actual === 0 || expected === null || expected === 0) return 'na'
    return actual === expected ? 'match' : 'mismatch'
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      <Button
        variant="ghost"
        type="button"
        onClick={state === 'done' ? () => setExpanded(!expanded) : handleRun}
        disabled={state === 'running'}
        title={
          state === 'running'
            ? 'Running...'
            : state === 'done'
              ? expanded
                ? 'Hide results'
                : 'Show results'
              : `Run live check via ${getEngineLabel(engine)}`
        }
        className={clsx(
          'shrink-0 p-1 rounded transition-colors',
          state === 'running' && 'animate-pulse text-primary',
          state === 'done' && 'text-status-success',
          state === 'error' && 'text-status-error',
          state === 'idle' && 'text-muted-foreground hover:text-primary hover:bg-primary/10'
        )}
      >
        {state === 'running' ? (
          <Loader2 size={14} className="animate-spin" />
        ) : state === 'done' ? (
          <Check size={14} />
        ) : state === 'error' ? (
          <AlertTriangle size={14} />
        ) : (
          <Play size={14} />
        )}
      </Button>

      {/* Inline result badge */}
      {result && expanded && (
        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
          <span className="px-1.5 py-0.5 rounded bg-muted border border-border text-muted-foreground font-medium">
            {getEngineLabel(result.engine)}
          </span>
          <span className="text-muted-foreground">
            KG: <span className="text-foreground font-mono">{result.keyGenMs.toFixed(1)}ms</span>
          </span>
          <span className="text-muted-foreground">
            S/E:{' '}
            <span className="text-foreground font-mono">{result.signEncapsMs.toFixed(1)}ms</span>
          </span>
          <span className="text-muted-foreground">
            V/D:{' '}
            <span className="text-foreground font-mono">{result.verifyDecapsMs.toFixed(1)}ms</span>
          </span>
          {/* Size validation badges */}
          {(() => {
            const pubMatch = sizeMatch(result.publicKeyBytes, algorithm.publicKeySize)
            return pubMatch !== 'na' ? (
              <span
                className={clsx(
                  'px-1 py-0.5 rounded border font-mono',
                  pubMatch === 'match'
                    ? 'bg-status-success/10 text-status-success border-status-success/30'
                    : 'bg-status-warning/10 text-status-warning border-status-warning/30'
                )}
              >
                pk:{result.publicKeyBytes}B {pubMatch === 'match' ? '✓' : '⚠'}
              </span>
            ) : null
          })()}
          {(() => {
            const sigMatch = sizeMatch(result.sigCiphertextBytes, algorithm.signatureCiphertextSize)
            return sigMatch !== 'na' ? (
              <span
                className={clsx(
                  'px-1 py-0.5 rounded border font-mono',
                  sigMatch === 'match'
                    ? 'bg-status-success/10 text-status-success border-status-success/30'
                    : 'bg-status-warning/10 text-status-warning border-status-warning/30'
                )}
              >
                sig:{result.sigCiphertextBytes}B {sigMatch === 'match' ? '✓' : '⚠'}
              </span>
            ) : null
          })()}
        </div>
      )}

      {error && (
        <span className="text-[10px] text-status-error truncate max-w-[120px]" title={error}>
          {error}
        </span>
      )}
    </div>
  )
}
