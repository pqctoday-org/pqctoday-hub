// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useCallback } from 'react'
import {
  Cpu,
  Play,
  RotateCcw,
  RefreshCw,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getRandomBytes } from '@/utils/webCrypto'
import { formatHex } from '../utils/outputFormatters'
import { BitMatrixGrid } from './BitMatrixGrid'

type DRBGPhase = 'idle' | 'instantiated' | 'generating' | 'needs-reseed'

interface DRBGState {
  /** Counter block V (128 bits = 16 bytes) */
  v: Uint8Array
  /** Key (256 bits = 32 bytes) */
  key: Uint8Array
  /** Reseed counter */
  reseedCounter: number
  /** Generated output blocks */
  outputs: Uint8Array[]
}

const RESEED_INTERVAL = 4 // Force reseed after this many generates
const V_SIZE = 16 // 128-bit counter block
const KEY_SIZE = 32 // 256-bit key

/** Simulated CTR_DRBG update: derives new V and Key from seed material.
 * This is a simplified educational simulation — not a real CTR_DRBG implementation. */
function deriveState(seedMaterial: Uint8Array): { v: Uint8Array; key: Uint8Array } {
  // Use first 16 bytes as V, next 32 as Key (XOR with seed to show derivation)
  const v = new Uint8Array(V_SIZE)
  const key = new Uint8Array(KEY_SIZE)
  for (let i = 0; i < V_SIZE; i++) {
    v[i] = seedMaterial[i % seedMaterial.length]
  }
  for (let i = 0; i < KEY_SIZE; i++) {
    key[i] = seedMaterial[(i + V_SIZE) % seedMaterial.length] ^ (i * 7 + 0x5a)
  }
  return { v, key }
}

/** Simulated CTR_DRBG generate: increment V and produce output block.
 * Uses XOR of V and Key to simulate AES-CTR output without requiring OpenSSL. */
function generateBlock(v: Uint8Array, key: Uint8Array): { newV: Uint8Array; output: Uint8Array } {
  const newV = new Uint8Array(v)
  // Increment V (big-endian increment of 128-bit counter)
  for (let i = V_SIZE - 1; i >= 0; i--) {
    newV[i] = (newV[i] + 1) & 0xff
    if (newV[i] !== 0) break
  }
  // Simulate AES-CTR: XOR V with Key bytes to produce output
  const output = new Uint8Array(V_SIZE)
  for (let i = 0; i < V_SIZE; i++) {
    output[i] = newV[i] ^ key[i % KEY_SIZE] ^ key[(i + 8) % KEY_SIZE]
  }
  return { newV, output }
}

/** Pipeline stage indicator */
const PipelineStage: React.FC<{
  label: string
  active: boolean
  completed: boolean
  icon: React.ReactNode
}> = ({ label, active, completed, icon }) => (
  <div
    className={`rounded-lg border px-3 py-2 text-center min-w-[100px] transition-all duration-300 ${
      active
        ? 'border-primary bg-primary/10 shadow-[0_0_12px_hsl(var(--primary)/0.2)]'
        : completed
          ? 'border-success/50 bg-status-success/5'
          : 'border-border bg-muted/30'
    }`}
  >
    <div className="flex items-center justify-center mb-1">
      {completed ? <CheckCircle size={14} className="text-success" /> : icon}
    </div>
    <span
      className={`text-[10px] font-medium ${
        active ? 'text-primary' : completed ? 'text-success' : 'text-muted-foreground'
      }`}
    >
      {label}
    </span>
  </div>
)

export const DRBGSimulator: React.FC = () => {
  const [phase, setPhase] = useState<DRBGPhase>('idle')
  const [state, setState] = useState<DRBGState>({
    v: new Uint8Array(V_SIZE),
    key: new Uint8Array(KEY_SIZE),
    reseedCounter: 0,
    outputs: [],
  })
  const [seedHex, setSeedHex] = useState<string>('')
  const [animating, setAnimating] = useState<string | null>(null)

  const handleInstantiate = useCallback(() => {
    setAnimating('instantiate')
    const entropy = getRandomBytes(48) // 384 bits of entropy
    setSeedHex(formatHex(entropy))
    const { v, key } = deriveState(entropy)

    // Brief animation delay
    setTimeout(() => {
      setState({
        v,
        key,
        reseedCounter: 1,
        outputs: [],
      })
      setPhase('instantiated')
      setAnimating(null)
    }, 400)
  }, [])

  const handleGenerate = useCallback(() => {
    if (phase === 'needs-reseed') return

    setAnimating('generate')
    setTimeout(() => {
      setState((prev) => {
        const { newV, output } = generateBlock(prev.v, prev.key)
        const newCounter = prev.reseedCounter + 1
        const newPhase = newCounter > RESEED_INTERVAL ? 'needs-reseed' : 'generating'
        setPhase(newPhase as DRBGPhase)

        return {
          ...prev,
          v: newV,
          reseedCounter: newCounter,
          outputs: [...prev.outputs, output],
        }
      })
      setAnimating(null)
    }, 300)
  }, [phase])

  const handleReseed = useCallback(() => {
    setAnimating('reseed')
    const freshEntropy = getRandomBytes(48)
    setSeedHex(formatHex(freshEntropy))

    setTimeout(() => {
      setState((prev) => {
        // Mix fresh entropy with current state
        const mixed = new Uint8Array(48)
        for (let i = 0; i < 48; i++) {
          mixed[i] = freshEntropy[i] ^ (i < V_SIZE ? prev.v[i] : prev.key[i - V_SIZE])
        }
        const { v, key } = deriveState(mixed)
        return {
          ...prev,
          v,
          key,
          reseedCounter: 1,
        }
      })
      setPhase('instantiated')
      setAnimating(null)
    }, 400)
  }, [])

  const handleReset = useCallback(() => {
    setPhase('idle')
    setState({
      v: new Uint8Array(V_SIZE),
      key: new Uint8Array(KEY_SIZE),
      reseedCounter: 0,
      outputs: [],
    })
    setSeedHex('')
    setAnimating(null)
  }, [])

  const isInstantiated = phase !== 'idle'
  const needsReseed = phase === 'needs-reseed'
  const canGenerate = isInstantiated && !needsReseed && !animating

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Cpu size={20} className="text-primary" />
        <div>
          <h3 className="text-base font-semibold text-foreground">
            CTR_DRBG State Machine Simulator
          </h3>
          <p className="text-xs text-muted-foreground">
            Step through the lifecycle of a CTR_DRBG: Instantiate with entropy, Generate output
            blocks, and Reseed when required.
          </p>
        </div>
      </div>

      {/* Pipeline visualization */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <PipelineStage
            label="Entropy Source"
            active={animating === 'instantiate' || animating === 'reseed'}
            completed={isInstantiated}
            icon={<Lock size={14} className="text-muted-foreground" />}
          />
          <ArrowRight
            size={14}
            className={`shrink-0 transition-colors ${
              animating === 'instantiate' || animating === 'reseed'
                ? 'text-primary animate-pulse'
                : 'text-border'
            }`}
          />
          <PipelineStage
            label="Seed / Reseed"
            active={animating === 'instantiate' || animating === 'reseed'}
            completed={isInstantiated}
            icon={<RefreshCw size={14} className="text-muted-foreground" />}
          />
          <ArrowRight
            size={14}
            className={`shrink-0 transition-colors ${
              isInstantiated ? 'text-primary' : 'text-border'
            }`}
          />
          <PipelineStage
            label="DRBG State"
            active={isInstantiated && !animating}
            completed={false}
            icon={
              <Cpu
                size={14}
                className={isInstantiated ? 'text-primary' : 'text-muted-foreground'}
              />
            }
          />
          <ArrowRight
            size={14}
            className={`shrink-0 transition-colors ${
              animating === 'generate' ? 'text-primary animate-pulse' : 'text-border'
            }`}
          />
          <PipelineStage
            label="Output"
            active={animating === 'generate'}
            completed={state.outputs.length > 0}
            icon={<Play size={14} className="text-muted-foreground" />}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {!isInstantiated ? (
          <Button
            variant="gradient"
            size="sm"
            onClick={handleInstantiate}
            disabled={!!animating}
            className="gap-1.5"
          >
            <Lock size={14} />
            Instantiate (Seed from Entropy)
          </Button>
        ) : (
          <>
            <Button
              variant="gradient"
              size="sm"
              onClick={handleGenerate}
              disabled={!canGenerate}
              className={`gap-1.5 ${needsReseed ? 'opacity-50' : ''}`}
            >
              <Play size={14} />
              Generate Block
            </Button>
            <Button
              variant={needsReseed ? 'gradient' : 'outline'}
              size="sm"
              onClick={handleReseed}
              disabled={!!animating}
              className={`gap-1.5 ${needsReseed ? 'animate-pulse' : ''}`}
            >
              <RefreshCw size={14} />
              Reseed
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={!!animating}
              className="gap-1.5"
            >
              <RotateCcw size={14} />
              Reset
            </Button>
          </>
        )}
      </div>

      {/* Reseed warning */}
      {needsReseed && (
        <div className="flex items-center gap-2 rounded-lg border border-warning/50 bg-status-warning/10 px-4 py-2">
          <AlertTriangle size={14} className="text-warning shrink-0" />
          <p className="text-xs text-foreground">
            <strong>Reseed required.</strong> The DRBG has generated {RESEED_INTERVAL} blocks since
            last seed. Per SP 800-90A, the reseed interval limits how much output can be produced
            from a single seed. Click Reseed to inject fresh entropy.
          </p>
        </div>
      )}

      {/* Internal state */}
      {isInstantiated && (
        <div className="glass-panel p-4 space-y-4">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Internal State
          </h4>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* V (counter block) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  V <span className="text-muted-foreground font-normal">(128-bit counter)</span>
                </span>
              </div>
              <pre className="font-mono text-[10px] text-foreground bg-muted/30 rounded px-2 py-1.5 overflow-x-auto">
                {formatHex(state.v)}
              </pre>
              <BitMatrixGrid data={state.v} compact bitOnly />
            </div>

            {/* Key */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  Key <span className="text-muted-foreground font-normal">(256-bit)</span>
                </span>
              </div>
              <pre className="font-mono text-[10px] text-foreground bg-muted/30 rounded px-2 py-1.5 overflow-x-auto">
                {formatHex(state.key)}
              </pre>
              <BitMatrixGrid data={state.key} compact bitOnly />
            </div>

            {/* Reseed counter */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-foreground">Reseed Counter</span>
              <div className="flex items-center gap-3">
                <span
                  className={`text-3xl font-bold font-mono ${
                    needsReseed ? 'text-warning' : 'text-primary'
                  }`}
                >
                  {state.reseedCounter}
                </span>
                <span className="text-xs text-muted-foreground">/ {RESEED_INTERVAL} max</span>
              </div>
              {/* Counter progress bar */}
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    needsReseed ? 'bg-warning' : 'bg-primary'
                  }`}
                  style={{
                    width: `${Math.min((state.reseedCounter / RESEED_INTERVAL) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Seed material */}
          {seedHex && (
            <div>
              <span className="text-xs font-semibold text-foreground">
                Last Seed Material{' '}
                <span className="text-muted-foreground font-normal">
                  (384 bits from OS entropy)
                </span>
              </span>
              <pre className="font-mono text-[10px] text-muted-foreground bg-muted/30 rounded px-2 py-1.5 mt-1 overflow-x-auto">
                {seedHex}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Generated output */}
      {state.outputs.length > 0 && (
        <div className="glass-panel p-4 space-y-3">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Generated Output ({state.outputs.length} block{state.outputs.length !== 1 ? 's' : ''})
          </h4>
          <div className="space-y-2">
            {state.outputs.map((output, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground font-mono w-8 shrink-0">
                  #{i + 1}
                </span>
                <pre className="font-mono text-[10px] text-foreground bg-muted/30 rounded px-2 py-1 flex-1 overflow-x-auto">
                  {formatHex(output)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Educational notes */}
      <div className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-3 space-y-2">
        <p>
          <strong className="text-foreground">How CTR_DRBG works:</strong> The DRBG maintains
          internal state (V, Key) seeded from a validated entropy source. Each Generate call
          increments V and runs AES-CTR to produce output. The reseed counter ensures periodic
          refresh from the entropy source.
        </p>
        <p>
          <strong className="text-foreground">Why reseed?</strong> Even with a perfect seed, an
          attacker who compromises the internal state could predict all future outputs. Reseeding
          limits the window of vulnerability — SP 800-90A specifies a maximum reseed interval
          (typically 2<sup>48</sup> for CTR_DRBG, reduced to {RESEED_INTERVAL} here for
          demonstration).
        </p>
      </div>
    </div>
  )
}
