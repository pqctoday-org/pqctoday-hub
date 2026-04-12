// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { Cpu, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { TVLA_TARGETS, TVLA_STAGES, type TVLATarget } from '../data/testingConstants'
import { Button } from '@/components/ui/button'

// Simulated t-test scores per (target, stage) — values > threshold indicate leakage
// Scores are pre-generated representative values (not real measurements)
const TTEST_SCORES: Record<string, Record<string, number>> = {
  'mlkem-unmasked': {
    'key-load': 8.4,
    ntt: 12.7,
    'poly-mul': 9.1,
    'mod-reduction': 7.8,
    sampling: 1.2,
    compress: 6.3,
  },
  'mlkem-masked': {
    'key-load': 2.1,
    ntt: 3.4,
    'poly-mul': 2.8,
    'mod-reduction': 1.9,
    sampling: 0.8,
    compress: 1.5,
  },
  'mldsa-unmasked': {
    'key-load': 10.2,
    ntt: 14.8,
    'poly-mul': 11.3,
    'mod-reduction': 3.1,
    sampling: 1.4,
    compress: 4.7,
  },
  'mldsa-masked': {
    'key-load': 2.8,
    ntt: 3.1,
    'poly-mul': 5.9,
    'mod-reduction': 1.3,
    sampling: 0.9,
    compress: 2.2,
  },
}

const DEFAULT_THRESHOLD = 4.5

const barColor = (score: number, threshold: number) => {
  if (score > threshold * 2) return 'bg-destructive'
  if (score > threshold) return 'bg-status-warning'
  return 'bg-status-success'
}

const barTextColor = (score: number, threshold: number) => {
  if (score > threshold * 2) return 'text-destructive'
  if (score > threshold) return 'text-status-warning'
  return 'text-status-success'
}

export const TVLALeakageAnalyzer: React.FC = () => {
  const [selectedTarget, setSelectedTarget] = useState<string>('mlkem-unmasked')
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD)

  const target: TVLATarget = TVLA_TARGETS.find((t) => t.id === selectedTarget)!
  const scores = TTEST_SCORES[selectedTarget]

  const leakingStages = useMemo(
    () => TVLA_STAGES.filter((s) => (scores[s.id] ?? 0) > threshold),
    [scores, threshold]
  )

  const maxScore = Math.max(...Object.values(scores))

  return (
    <div className="space-y-6">
      {/* Tool banner */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
        <Cpu size={16} className="text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Simulating:</span> Keysight Inspector
          Crypto 3 / ChipWhisperer TVLA analysis. Pre-recorded power traces (10,000 measurements)
          evaluated using Welch&apos;s t-test. |t| &gt; threshold indicates statistically
          significant leakage.
        </p>
      </div>

      {/* Target selector */}
      <div className="space-y-2">
        <span className="text-sm font-medium text-foreground">Implementation Under Test:</span>
        <div className="grid sm:grid-cols-2 gap-2">
          {TVLA_TARGETS.map((t) => (
            <Button
              variant="ghost"
              key={t.id}
              onClick={() => setSelectedTarget(t.id)}
              className={`text-left p-3 rounded-lg border transition-all ${
                selectedTarget === t.id
                  ? 'bg-primary/10 border-primary/40'
                  : 'bg-muted/30 border-border hover:border-border/80'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-xs text-foreground">{t.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${
                    t.implementation === 'masked'
                      ? 'text-status-success bg-status-success/10 border-status-success/30'
                      : 'text-destructive bg-destructive/10 border-destructive/30'
                  }`}
                >
                  {t.implementation.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{t.description}</p>
            </Button>
          ))}
        </div>
      </div>

      {/* Threshold control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            TVLA Threshold |t| ={' '}
            <span className="text-primary font-mono">{threshold.toFixed(1)}</span>
          </span>
          <span className="text-xs text-muted-foreground">NIST standard: 4.5 | Strict: 3.0</span>
        </div>
        <input
          type="range"
          min="2.0"
          max="8.0"
          step="0.5"
          value={threshold}
          onChange={(e) => setThreshold(parseFloat(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Strict (2.0)</span>
          <span>NIST standard (4.5)</span>
          <span>Lenient (8.0)</span>
        </div>
      </div>

      {/* Stage leakage bars */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          Power Trace t-test Results — {target.algorithm} ({target.implementation})
        </h3>

        {TVLA_STAGES.map((stage) => {
          const score = scores[stage.id] ?? 0
          const pct = Math.min(100, (score / (maxScore * 1.1)) * 100)
          const leaks = score > threshold

          return (
            <div key={stage.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-foreground">{stage.label}</span>
                  <span className="text-muted-foreground ml-2">{stage.description}</span>
                </div>
                <div className="flex items-center gap-2">
                  {leaks ? (
                    <AlertTriangle size={12} className="text-status-warning" />
                  ) : (
                    <CheckCircle size={12} className="text-status-success" />
                  )}
                  <span
                    className={`font-mono font-bold tabular-nums ${barTextColor(score, threshold)}`}
                  >
                    |t| = {score.toFixed(1)}
                  </span>
                </div>
              </div>

              <div className="h-5 bg-muted rounded-full overflow-hidden relative">
                {/* Threshold line */}
                <div
                  className="absolute top-0 bottom-0 w-px bg-border z-10"
                  style={{ left: `${Math.min(100, (threshold / (maxScore * 1.1)) * 100)}%` }}
                />
                <div
                  className={`h-full ${barColor(score, threshold)} transition-all duration-500 rounded-full`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}

        {/* Threshold reference line label */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-4 h-px bg-border" />
          <span>Threshold line ({threshold.toFixed(1)})</span>
        </div>
      </div>

      {/* Leakage summary */}
      {leakingStages.length > 0 ? (
        <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <AlertTriangle size={14} />
            {leakingStages.length} leaking stage{leakingStages.length !== 1 ? 's' : ''} detected
          </div>
          {leakingStages.map((s) => (
            <div key={s.id} className="text-xs text-foreground/80">
              <span className="font-semibold">{s.label}:</span>{' '}
              {s.leaksIn.includes(selectedTarget) ? (
                <span>
                  Side-channel leakage confirmed — t = {scores[s.id].toFixed(1)}. Key-dependent
                  power variation at this stage enables key recovery with sufficient traces.
                </span>
              ) : (
                <span>
                  Score above threshold — possible higher-order leakage. Increase trace count for
                  confirmation.
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 rounded-lg border border-status-success/30 bg-status-success/5 flex items-center gap-2 text-sm text-status-success">
          <CheckCircle size={14} />
          No leakage detected at threshold |t| = {threshold.toFixed(1)}
        </div>
      )}

      {/* Key insight: why fixed-vs-random TVLA fails for PQC */}
      <div className="p-3 rounded-lg bg-muted border border-border space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <Info size={13} className="text-primary" />
          Why classical fixed-vs-random TVLA fails for PQC
        </div>
        <p className="text-xs text-muted-foreground">
          Classical TVLA uses a fixed plaintext set vs random plaintexts to distinguish
          key-dependent leakage. For ML-KEM/ML-DSA, the public key and ciphertext are structurally
          coupled — a fixed ciphertext always uses the same secret polynomial, making the
          &quot;fixed&quot; set trivially distinguishable regardless of implementation quality.
          Instead, target specific algorithmic stages: NTT/INTT (dominant leakage), polynomial
          multiplication (nonce leakage in ML-DSA), and modular reduction (q=3329 conditional
          subtraction). Keysight Inspector&apos;s Dilithium TVLA generator targets these operations
          directly.
        </p>
      </div>
    </div>
  )
}
