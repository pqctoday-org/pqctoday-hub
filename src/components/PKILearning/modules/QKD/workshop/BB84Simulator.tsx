// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useCallback, useMemo } from 'react'
import { Play, RotateCcw, Shield, ShieldAlert, Eye } from 'lucide-react'
import {
  createInitialState,
  advancePhase,
  BB84_PHASES,
  PHASE_LABELS,
  bitsToHex,
  type BB84SimulationState,
  type BB84Phase,
} from '../services/BB84Service'
import { Button } from '@/components/ui/button'

interface BB84SimulatorProps {
  initialEveEnabled?: boolean
  initialNumQubits?: number
}

const QUBIT_OPTIONS = [8, 16, 32] as const

export const BB84Simulator: React.FC<BB84SimulatorProps> = ({
  initialEveEnabled = false,
  initialNumQubits = 16,
}) => {
  const [numQubits, setNumQubits] = useState<number>(initialNumQubits)
  const [eveEnabled, setEveEnabled] = useState(initialEveEnabled)
  const [eveRate, setEveRate] = useState(1.0)
  const [state, setState] = useState<BB84SimulationState>(() =>
    createInitialState(numQubits, eveEnabled, eveRate)
  )

  const currentPhaseIndex = useMemo(() => {
    if (state.phase === 'idle') return -1
    return BB84_PHASES.indexOf(state.phase)
  }, [state.phase])

  const canAdvance = state.phase !== 'complete'
  const isIdle = state.phase === 'idle'

  const handleAdvance = useCallback(() => {
    setState((prev) => advancePhase(prev))
  }, [])

  const handleReset = useCallback(() => {
    setState(createInitialState(numQubits, eveEnabled, eveRate))
  }, [numQubits, eveEnabled, eveRate])

  const handleQubitChange = useCallback(
    (n: number) => {
      setNumQubits(n)
      setState(createInitialState(n, eveEnabled, eveRate))
    },
    [eveEnabled, eveRate]
  )

  const handleEveToggle = useCallback(() => {
    const newEve = !eveEnabled
    setEveEnabled(newEve)
    setState(createInitialState(numQubits, newEve, eveRate))
  }, [eveEnabled, numQubits, eveRate])

  const handleEveRateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const rate = parseFloat(e.target.value)
      setEveRate(rate)
      if (isIdle) {
        setState(createInitialState(numQubits, eveEnabled, rate))
      }
    },
    [numQubits, eveEnabled, isIdle]
  )

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Qubits:</span>
          <div className="flex gap-1">
            {QUBIT_OPTIONS.map((n) => (
              <Button
                variant="ghost"
                key={n}
                onClick={() => handleQubitChange(n)}
                disabled={!isIdle}
                className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                  numQubits === n
                    ? 'bg-primary text-black border-primary font-bold'
                    : 'bg-muted border-border text-foreground hover:border-primary/50 disabled:opacity-50'
                }`}
              >
                {n}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={handleEveToggle}
            disabled={!isIdle}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded border transition-colors ${
              eveEnabled
                ? 'bg-destructive/10 text-destructive border-destructive/30 font-bold'
                : 'bg-muted border-border text-muted-foreground hover:border-primary/50 disabled:opacity-50'
            }`}
          >
            <Eye size={14} />
            Eve: {eveEnabled ? 'ON' : 'OFF'}
          </Button>

          {eveEnabled && (
            <div className="flex items-center gap-2 text-sm border border-border bg-muted/30 px-3 py-1.5 rounded disabled:opacity-50">
              <span className="text-muted-foreground whitespace-nowrap hidden sm:inline">
                Intercept:
              </span>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                disabled={!isIdle}
                value={eveRate}
                onChange={handleEveRateChange}
                className="w-24 sm:w-32 accent-destructive disabled:opacity-50"
                aria-label="Eavesdropper interception rate"
                aria-valuenow={eveRate}
              />
              <span className="text-destructive font-mono w-9 text-right">
                {Math.round(eveRate * 100)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Phase Progress Bar */}
      <div
        className="flex items-center gap-1 overflow-x-auto pb-2"
        role="progressbar"
        aria-label="BB84 protocol progress"
        aria-valuenow={currentPhaseIndex + 1}
        aria-valuemin={1}
        aria-valuemax={BB84_PHASES.length}
      >
        {BB84_PHASES.map((phase, idx) => (
          <div key={phase} className="flex items-center gap-1">
            <div
              className={`px-2 py-1 text-xs rounded whitespace-nowrap transition-colors ${
                idx === currentPhaseIndex
                  ? 'bg-primary text-black font-bold'
                  : idx < currentPhaseIndex
                    ? 'bg-success/20 text-success'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {PHASE_LABELS[phase]}
            </div>
            {idx < BB84_PHASES.length - 1 && (
              <div
                className={`w-4 h-0.5 ${idx < currentPhaseIndex ? 'bg-success' : 'bg-border'}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Qubit Grid Visualization */}
      {state.aliceQubits.length > 0 && (
        <div className="bg-muted/30 rounded-lg p-4 border border-border overflow-x-auto">
          <div className="grid grid-cols-1 gap-4 min-w-max">
            {/* Header row */}
            <div
              className={`grid gap-2 text-xs font-bold text-muted-foreground`}
              style={{ gridTemplateColumns: `80px repeat(${numQubits}, minmax(0, 1fr))` }}
            >
              <div />
              {state.aliceQubits.map((_, i) => (
                <div key={i} className="text-center">
                  Q{i}
                </div>
              ))}
            </div>

            {/* Alice's qubits */}
            <div
              className={`grid gap-2 items-center`}
              style={{ gridTemplateColumns: `80px repeat(${numQubits}, minmax(0, 1fr))` }}
            >
              <div className="text-xs font-bold text-primary">Alice</div>
              {state.aliceQubits.map((q, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm font-mono border-2 transition-colors ${
                    q.basis === '+'
                      ? 'border-primary/50 bg-primary/10'
                      : 'border-accent/50 bg-accent/10'
                  }`}
                  title={`Bit: ${q.bitValue}, Basis: ${q.basis}`}
                >
                  {state.phase !== 'idle' ? q.polarization : '?'}
                </div>
              ))}
            </div>

            {/* Alice's bases */}
            {currentPhaseIndex >= BB84_PHASES.indexOf('reconcile') && (
              <div
                className={`grid gap-2 items-center`}
                style={{ gridTemplateColumns: `80px repeat(${numQubits}, minmax(0, 1fr))` }}
              >
                <div className="text-xs text-muted-foreground">Basis</div>
                {state.aliceQubits.map((q, i) => (
                  <div key={i} className="text-center text-xs font-mono text-muted-foreground">
                    {q.basis}
                  </div>
                ))}
              </div>
            )}

            {/* Eve (if present and phase >= transmit) */}
            {eveEnabled && currentPhaseIndex >= BB84_PHASES.indexOf('transmit') && (
              <div
                className={`grid gap-2 items-center`}
                style={{ gridTemplateColumns: `80px repeat(${numQubits}, minmax(0, 1fr))` }}
              >
                <div className="text-xs font-bold text-destructive flex items-center gap-1">
                  <Eye size={12} /> Eve
                </div>
                {state.eveInterceptions.map((intercepted, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm font-mono border-2 ${
                      intercepted
                        ? 'border-destructive/50 bg-destructive/10 text-destructive'
                        : 'border-transparent'
                    }`}
                  >
                    {intercepted && state.eveMeasurements[i] !== null
                      ? state.eveMeasurements[i]
                      : ''}
                  </div>
                ))}
              </div>
            )}

            {/* Bob's bases */}
            {state.bobBases.length > 0 && (
              <div
                className={`grid gap-2 items-center`}
                style={{ gridTemplateColumns: `80px repeat(${numQubits}, minmax(0, 1fr))` }}
              >
                <div className="text-xs text-muted-foreground">Basis</div>
                {state.bobBases.map((b, i) => (
                  <div key={i} className="text-center text-xs font-mono text-muted-foreground">
                    {b}
                  </div>
                ))}
              </div>
            )}

            {/* Bob's measurements */}
            {state.bobMeasurements.some((m) => m !== null) && (
              <div
                className={`grid gap-2 items-center`}
                style={{ gridTemplateColumns: `80px repeat(${numQubits}, minmax(0, 1fr))` }}
              >
                <div className="text-xs font-bold text-success">Bob</div>
                {state.bobMeasurements.map((m, i) => {
                  const matching = state.matchingBases[i]
                  const sifted = matching !== undefined ? matching : false
                  return (
                    <div
                      key={i}
                      className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm font-mono border-2 transition-colors ${
                        currentPhaseIndex >= BB84_PHASES.indexOf('sift')
                          ? sifted
                            ? 'border-success/50 bg-success/10 text-success font-bold'
                            : 'border-border/30 bg-muted/30 text-muted-foreground/30'
                          : 'border-success/50 bg-success/10'
                      }`}
                    >
                      {m !== null ? m : '?'}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Matching indicator */}
            {state.matchingBases.length > 0 && (
              <div
                className={`grid gap-2 items-center`}
                style={{ gridTemplateColumns: `80px repeat(${numQubits}, minmax(0, 1fr))` }}
              >
                <div className="text-xs text-muted-foreground">Match</div>
                {state.matchingBases.map((match, i) => (
                  <div
                    key={i}
                    className={`text-center text-xs font-bold ${match ? 'text-success' : 'text-muted-foreground/30'}`}
                  >
                    {match ? '✓' : '✗'}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results Summary */}
      {state.phase === 'sift' || state.phase === 'detect' || state.phase === 'complete' ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs text-muted-foreground">Transmitted</div>
            <div className="text-lg font-bold text-foreground">{state.numQubits} qubits</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs text-muted-foreground">Sifted Key</div>
            <div className="text-lg font-bold text-foreground">
              {state.siftedKeyAlice.length} bits
            </div>
            <div className="text-xs text-muted-foreground font-mono mt-1">
              {bitsToHex(state.siftedKeyAlice)}
            </div>
          </div>
          {state.qber !== null && (
            <div
              className={`rounded-lg p-3 border ${state.isSecure ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'}`}
            >
              <div className="text-xs text-muted-foreground">QBER</div>
              <div
                className={`text-lg font-bold ${state.isSecure ? 'text-success' : 'text-destructive'}`}
              >
                {(state.qber * 100).toFixed(1)}%
              </div>
              <div className="flex items-center gap-1 mt-1">
                {state.isSecure ? (
                  <>
                    <Shield size={12} className="text-success" />
                    <span className="text-xs text-success font-medium">Key is secure</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert size={12} className="text-destructive" />
                    <span className="text-xs text-destructive font-medium">
                      Eavesdropper detected!
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Phase explanation */}
      {state.phase !== 'idle' && state.phase !== 'complete' && (
        <div className="bg-muted/30 rounded-lg p-3 border border-border">
          <PhaseExplanation phase={state.phase} evePresent={eveEnabled} />
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3">
        {isIdle ? (
          <Button
            variant="ghost"
            onClick={handleAdvance}
            className="px-6 py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
            aria-label="Start BB84 protocol simulation"
          >
            <Play size={16} /> Start Protocol
          </Button>
        ) : canAdvance ? (
          <Button
            variant="ghost"
            onClick={handleAdvance}
            className="px-6 py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Play size={16} /> Next Step
          </Button>
        ) : null}
        {!isIdle && (
          <Button
            variant="ghost"
            onClick={handleReset}
            className="px-6 py-3 rounded-lg border border-border hover:bg-muted transition-colors flex items-center gap-2 text-foreground"
            aria-label="Reset simulation"
          >
            <RotateCcw size={16} /> Reset
          </Button>
        )}
      </div>
    </div>
  )
}

function PhaseExplanation({ phase, evePresent }: { phase: BB84Phase; evePresent: boolean }) {
  const explanations: Partial<Record<BB84Phase, string>> = {
    prepare:
      'Alice generates random bits and encodes each in a randomly chosen basis (+ or x). Each qubit is represented as a polarized photon.',
    transmit: evePresent
      ? 'Alice sends photons over the quantum channel. Eve intercepts a fraction of qubits, measures them, and re-sends them — inevitably disturbing some states.'
      : 'Alice sends photons over the quantum channel to Bob. Without interference, the quantum states arrive undisturbed.',
    measure:
      "Bob independently chooses a random basis for each qubit and measures. When his basis matches Alice's, the result is deterministic. Otherwise it's random.",
    reconcile:
      'Alice and Bob publicly announce their basis choices (not the bit values). They identify which positions used matching bases.',
    sift: 'Positions where bases matched form the sifted key — typically about half the transmitted qubits. Non-matching positions are discarded.',
    detect:
      'A random sample of sifted key bits is compared to estimate the QBER. If QBER < 11%, the key is deemed secure. Above 11% indicates eavesdropping.',
  }

  return <p className="text-sm text-muted-foreground">{explanations[phase] || ''}</p>
}
