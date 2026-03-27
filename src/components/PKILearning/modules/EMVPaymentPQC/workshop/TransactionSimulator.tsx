// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Clock,
  AlertTriangle,
  ArrowDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TRANSACTION_FLOWS } from '../data/transactionFlowData'
import {
  TRANSACTION_MODE_LABELS,
  ACTOR_COLORS,
  ACTOR_LABELS,
  type TransactionMode,
  type TransactionFlowStep,
} from '../data/emvConstants'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MODE_ORDER: TransactionMode[] = [
  'online',
  'offline-dda',
  'offline-cda',
  'contactless',
  'mobile-pay',
]

const SPEED_OPTIONS = [
  { label: '0.5x', ms: 2000 },
  { label: '1x', ms: 1000 },
  { label: '2x', ms: 500 },
]

// ---------------------------------------------------------------------------
// TransactionSimulator
// ---------------------------------------------------------------------------

export const TransactionSimulator: React.FC = () => {
  const [selectedMode, setSelectedMode] = useState<TransactionMode>('online')
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speedIndex, setSpeedIndex] = useState(1) // default 1x
  const [quantumExposure, setQuantumExposure] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flow = useMemo(
    () => TRANSACTION_FLOWS.find((f) => f.mode === selectedMode)!,
    [selectedMode]
  )

  const vulnerableCount = flow.quantumVulnerableSteps
  const totalLatency = flow.totalLatencyMs
  const maxLatency = Math.max(...flow.steps.map((s) => s.latencyMs))

  // Auto-play logic
  const advanceStep = useCallback(() => {
    setActiveStepIndex((prev) => {
      if (prev === null) return 0
      const next = prev + 1
      if (next >= flow.steps.length) {
        setIsPlaying(false)
        return prev
      }
      return next
    })
  }, [flow.steps.length])

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearTimeout(timerRef.current)
      return
    }
    timerRef.current = setTimeout(advanceStep, SPEED_OPTIONS[speedIndex].ms)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isPlaying, activeStepIndex, advanceStep, speedIndex])

  const handlePlay = () => {
    if (activeStepIndex !== null && activeStepIndex >= flow.steps.length - 1) {
      // restart from beginning
      setActiveStepIndex(0)
    }
    setIsPlaying(true)
  }

  const handlePause = () => setIsPlaying(false)

  const handleReset = () => {
    setIsPlaying(false)
    setActiveStepIndex(null)
  }

  const handleModeChange = (mode: TransactionMode) => {
    setIsPlaying(false)
    setActiveStepIndex(null)
    setSelectedMode(mode)
  }

  // Determine if a step should be dimmed in quantum exposure mode
  const isStepDimmed = (step: TransactionFlowStep): boolean => {
    return quantumExposure && !step.quantumVulnerable
  }

  return (
    <div className="space-y-6">
      {/* Mode selector */}
      <div className="flex flex-wrap gap-2">
        {MODE_ORDER.map((mode) => (
          <Button
            key={mode}
            variant={selectedMode === mode ? 'gradient' : 'outline'}
            size="sm"
            onClick={() => handleModeChange(mode)}
          >
            {TRANSACTION_MODE_LABELS[mode]}
          </Button>
        ))}
      </div>

      {/* Flow description */}
      <div className="glass-panel p-4">
        <h4 className="font-semibold text-foreground mb-1">{flow.name}</h4>
        <p className="text-sm text-muted-foreground">{flow.description}</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-3 text-center">
          <Zap size={18} className="mx-auto text-primary mb-1" />
          <div className="text-xl font-bold text-foreground">{flow.steps.length}</div>
          <div className="text-xs text-muted-foreground">Total Steps</div>
        </div>
        <div className="glass-panel p-3 text-center">
          <ShieldAlert size={18} className="mx-auto text-status-error mb-1" />
          <div className="text-xl font-bold text-status-error">{vulnerableCount}</div>
          <div className="text-xs text-muted-foreground">Quantum Vulnerable</div>
        </div>
        <div className="glass-panel p-3 text-center">
          <Clock size={18} className="mx-auto text-primary mb-1" />
          <div className="text-xl font-bold text-foreground">{totalLatency} ms</div>
          <div className="text-xs text-muted-foreground">Total Latency</div>
        </div>
      </div>

      {/* Playback controls */}
      <div className="flex items-center gap-3 flex-wrap">
        {isPlaying ? (
          <Button variant="outline" size="sm" onClick={handlePause}>
            <Pause size={14} className="mr-1" /> Pause
          </Button>
        ) : (
          <Button variant="gradient" size="sm" onClick={handlePlay}>
            <Play size={14} className="mr-1" /> Play
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={handleReset}>
          <RotateCcw size={14} className="mr-1" /> Reset
        </Button>

        {/* Speed control */}
        <div className="flex items-center gap-1 ml-2">
          <span className="text-xs text-muted-foreground mr-1">Speed:</span>
          {SPEED_OPTIONS.map((opt, i) => (
            <Button
              key={opt.label}
              variant={speedIndex === i ? 'secondary' : 'ghost'}
              size="sm"
              className="px-2 py-1 text-xs"
              onClick={() => setSpeedIndex(i)}
            >
              {opt.label}
            </Button>
          ))}
        </div>

        {/* Quantum exposure toggle */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Quantum Exposure</span>
          <button
            role="switch"
            aria-checked={quantumExposure}
            onClick={() => setQuantumExposure((p) => !p)}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              quantumExposure ? 'bg-status-error' : 'bg-muted'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-foreground transition-transform ${
                quantumExposure ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Flow steps */}
      <div className="space-y-2">
        {flow.steps.map((step, index) => {
          const isActive = activeStepIndex === index
          const isPast = activeStepIndex !== null && index < activeStepIndex
          const dimmed = isStepDimmed(step)

          return (
            <div key={step.id}>
              {/* Connection arrow between steps */}
              {index > 0 && (
                <div className="flex justify-center py-1">
                  <ArrowDown size={16} className="text-muted-foreground opacity-40" />
                </div>
              )}

              <div
                role="button"
                tabIndex={0}
                aria-label={`Step ${step.order}: ${step.label}`}
                className={`glass-panel p-4 transition-all duration-300 cursor-pointer ${
                  isActive ? 'ring-2 ring-primary shadow-glow' : ''
                } ${isPast ? 'opacity-60' : ''} ${dimmed ? 'opacity-30' : ''} ${
                  quantumExposure && step.quantumVulnerable
                    ? 'border-l-4 border-l-status-error'
                    : ''
                }`}
                onClick={() => {
                  if (!isPlaying) setActiveStepIndex(index)
                }}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !isPlaying) {
                    e.preventDefault()
                    setActiveStepIndex(index)
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Step number */}
                  <div className="shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-foreground">
                    {step.order}
                  </div>

                  <div className="flex-1 space-y-2 min-w-0">
                    {/* Label row */}
                    <div className="flex items-center flex-wrap gap-2">
                      <h5 className="font-semibold text-foreground text-sm">{step.label}</h5>
                      {step.quantumVulnerable ? (
                        <span className="flex items-center gap-1 text-xs text-status-error">
                          <ShieldAlert size={13} /> Vulnerable
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-status-success">
                          <ShieldCheck size={13} /> Safe
                        </span>
                      )}
                    </div>

                    {/* Actor badges */}
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={`px-2 py-0.5 rounded border ${ACTOR_COLORS[step.fromActor]}`}
                      >
                        {ACTOR_LABELS[step.fromActor]}
                      </span>
                      <span className="text-muted-foreground">&rarr;</span>
                      <span className={`px-2 py-0.5 rounded border ${ACTOR_COLORS[step.toActor]}`}>
                        {ACTOR_LABELS[step.toActor]}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-muted-foreground">{step.description}</p>

                    {/* Crypto & metadata */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      {step.cryptoUsed.length > 0 && (
                        <div className="text-muted-foreground">
                          <span className="font-medium text-secondary">Crypto:</span>{' '}
                          {step.cryptoUsed.join(', ')}
                        </div>
                      )}
                      {step.pqcReplacement && (
                        <div className="text-muted-foreground">
                          <span className="font-medium text-status-success">PQC:</span>{' '}
                          {step.pqcReplacement}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{step.dataSize}</span>
                      <span>{step.latencyMs} ms</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Latency bar */}
      <div className="glass-panel p-4 space-y-3">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <AlertTriangle size={14} className="text-status-warning" />
          Latency Contribution
        </h4>
        <div className="space-y-2">
          {flow.steps.map((step) => {
            const pct = maxLatency > 0 ? (step.latencyMs / maxLatency) * 100 : 0
            return (
              <div key={step.id} className="flex items-center gap-2 text-xs">
                <span className="w-6 text-right text-muted-foreground font-mono">{step.order}</span>
                <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      step.quantumVulnerable ? 'bg-status-error' : 'bg-primary'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-12 text-right text-muted-foreground">{step.latencyMs} ms</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
