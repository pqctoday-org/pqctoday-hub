// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useCallback } from 'react'
import { Workflow, KeyRound, Play, RotateCw, Cpu, ArrowRight, Database, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getRandomBytes } from '@/utils/webCrypto'
import { formatHex } from '../utils/outputFormatters'

// --- SP 800-90A HMAC_DRBG Implementation ---

async function hmac(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    key as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, data as BufferSource)
  return new Uint8Array(signature)
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((acc, val) => acc + val.length, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0
  for (const array of arrays) {
    result.set(array, offset)
    offset += array.length
  }
  return result
}

async function hmacDrbgUpdate(
  providedData: Uint8Array | null,
  K: Uint8Array,
  V: Uint8Array
): Promise<{ K: Uint8Array; V: Uint8Array }> {
  // Step 1: K = HMAC(K, V || 0x00 || providedData)
  let payload1 = concat(V, new Uint8Array([0x00]))
  if (providedData && providedData.length > 0) {
    payload1 = concat(payload1, providedData)
  }
  let newK = await hmac(K, payload1)

  // Step 2: V = HMAC(K, V)
  let newV = await hmac(newK, V)

  // Step 3: If no provided_data, return KH, Vh
  if (!providedData || providedData.length === 0) {
    return { K: newK, V: newV }
  }

  // Step 4: K = HMAC(K, V || 0x01 || providedData)
  const payload2 = concat(newV, new Uint8Array([0x01]), providedData)
  newK = await hmac(newK, payload2)

  // Step 5: V = HMAC(K, V)
  newV = await hmac(newK, newV)

  return { K: newK, V: newV }
}

export const DrbgArchitectureDemo: React.FC = () => {
  // DRBG Internal State
  const [K, setK] = useState<Uint8Array>(new Uint8Array(32).fill(0x00))
  const [V, setV] = useState<Uint8Array>(new Uint8Array(32).fill(0x01))
  const [reseedCounter, setReseedCounter] = useState(0)
  const [instantiated, setInstantiated] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Inputs
  const [entropyInput, setEntropyInput] = useState<Uint8Array>(() => getRandomBytes(32))
  const [nonce, setNonce] = useState<Uint8Array>(() => getRandomBytes(16))
  const [persoString, setPersoString] = useState('PQC-Timeline-App')

  const [genBytesCount, setGenBytesCount] = useState(32)
  const [addlInputStr, setAddlInputStr] = useState('')

  // Outputs
  const [lastGenerated, setLastGenerated] = useState<Uint8Array | null>(null)
  const [historyLog, setHistoryLog] = useState<string[]>([])

  const logAction = (action: string) => {
    setHistoryLog((prev) => [action, ...prev].slice(0, 5))
  }

  // Instantiate
  const handleInstantiate = useCallback(async () => {
    setIsProcessing(true)
    try {
      const persoBytes = new TextEncoder().encode(persoString)
      const seedMaterial = concat(entropyInput, nonce, persoBytes)

      const initialK = new Uint8Array(32).fill(0x00)
      const initialV = new Uint8Array(32).fill(0x01)

      const { K: nextK, V: nextV } = await hmacDrbgUpdate(seedMaterial, initialK, initialV)

      setK(new Uint8Array(nextK))
      setV(new Uint8Array(nextV))
      setReseedCounter(1)
      setInstantiated(true)
      logAction('Instantiated HMAC_DRBG')
    } finally {
      setIsProcessing(false)
    }
  }, [entropyInput, nonce, persoString])

  // Generate
  const handleGenerate = useCallback(async () => {
    if (!instantiated) return
    setIsProcessing(true)
    try {
      let currentK = K
      let currentV = V
      const addlBytes = addlInputStr ? new TextEncoder().encode(addlInputStr) : null

      if (addlBytes && addlBytes.length > 0) {
        const state = await hmacDrbgUpdate(addlBytes, currentK, currentV)
        currentK = state.K
        currentV = state.V
      }

      let temp = new Uint8Array(0)
      while (temp.length < genBytesCount) {
        currentV = await hmac(currentK, currentV)
        temp = concat(temp, currentV)
      }

      const generated = new Uint8Array(temp.slice(0, genBytesCount))
      setLastGenerated(generated)

      const updateState = await hmacDrbgUpdate(addlBytes, currentK, currentV)
      setK(new Uint8Array(updateState.K))
      setV(new Uint8Array(updateState.V))
      setReseedCounter((c) => c + 1)
      logAction(`Generated ${genBytesCount} bytes. Reseed counter updated.`)
    } finally {
      setIsProcessing(false)
    }
  }, [instantiated, K, V, addlInputStr, genBytesCount])

  // Reseed
  const handleReseed = useCallback(async () => {
    if (!instantiated) return
    setIsProcessing(true)
    try {
      const newEntropy = getRandomBytes(32) as Uint8Array
      setEntropyInput(newEntropy) // show logic that we grabbed new entropy

      const addlBytes = addlInputStr ? new TextEncoder().encode(addlInputStr) : null
      const seedMaterial = addlBytes ? concat(newEntropy, addlBytes) : newEntropy

      const { K: nextK, V: nextV } = await hmacDrbgUpdate(seedMaterial, K, V)

      setK(new Uint8Array(nextK))
      setV(new Uint8Array(nextV))
      setReseedCounter(1) // resetting per SP 800-90A
      logAction('Reseeded HMAC_DRBG')
    } finally {
      setIsProcessing(false)
    }
  }, [instantiated, addlInputStr, K, V])

  const handleReset = () => {
    setK(new Uint8Array(32).fill(0x00))
    setV(new Uint8Array(32).fill(0x01))
    setReseedCounter(0)
    setInstantiated(false)
    setLastGenerated(null)
    setHistoryLog([])
    setEntropyInput(getRandomBytes(32) as Uint8Array)
    setNonce(getRandomBytes(16) as Uint8Array)
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel p-4 space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Workflow className="text-primary" size={20} />
          <h3 className="text-lg font-bold text-foreground">SP 800-90A HMAC_DRBG</h3>
        </div>
        <p className="text-sm text-foreground leading-relaxed">
          Explore the internal lifecycle of a Deterministic Random Bit Generator. Unlike simple
          PRNGs, a DRBG uses a cryptographic primitive (here, HMAC-SHA256) to recursively update its
          internal state ('Key' and 'V' vectors).
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          SP 800-90A mandates three core phases: <strong>Instantiate</strong> (seeding),{' '}
          <strong>Generate</strong> (deriving random bits and ratcheting state forward), and{' '}
          <strong>Reseed</strong> (injecting fresh entropy to prevent compromise).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Controls */}
        <div className="space-y-4">
          {/* Phase 1: Instantiate */}
          <div
            className={`glass-panel p-4 space-y-4 border ${!instantiated ? 'border-primary' : 'border-border/50 opacity-60'}`}
          >
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs">
                1
              </span>
              Instantiate Phase
            </h4>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground flex justify-between">
                  <span>Entropy Input (32 bytes)</span>
                  <button
                    onClick={() => setEntropyInput(getRandomBytes(32))}
                    disabled={instantiated}
                    className="text-primary hover:underline"
                  >
                    re-roll
                  </button>
                </span>
                <div className="font-mono text-[10px] bg-muted/40 p-2 rounded break-all mt-1">
                  {formatHex(entropyInput, 0)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground flex justify-between">
                    <span>Nonce (16 bytes)</span>
                  </span>
                  <div className="font-mono text-[10px] bg-muted/40 p-2 rounded break-all mt-1 h-[32px] flex items-center truncate">
                    {formatHex(nonce, 0)}
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="drbg-perso"
                    className="text-[10px] uppercase font-bold text-muted-foreground"
                  >
                    Personalization (String)
                  </label>
                  <Input
                    id="drbg-perso"
                    value={persoString}
                    onChange={(e) => setPersoString(e.target.value)}
                    disabled={instantiated}
                    className="h-[32px] text-xs mt-1"
                  />
                </div>
              </div>

              <Button
                variant={instantiated ? 'outline' : 'gradient'}
                className="w-full"
                onClick={handleInstantiate}
                disabled={instantiated || isProcessing}
              >
                <Cpu size={16} className="mr-2" />
                Instantiate HMAC_DRBG
              </Button>
            </div>
          </div>

          {/* Phase 2: Generate & Reseed */}
          <div
            className={`glass-panel p-4 space-y-4 border ${instantiated ? 'border-success' : 'border-border/50 opacity-50'}`}
          >
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <span className="flex items-center justify-center bg-success text-success-foreground rounded-full w-5 h-5 text-xs">
                2
              </span>
              Generate & Reseed
            </h4>

            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label
                    htmlFor="drbg-bytes"
                    className="text-[10px] uppercase font-bold text-muted-foreground"
                  >
                    Bytes
                  </label>
                  <Input
                    id="drbg-bytes"
                    type="number"
                    value={genBytesCount}
                    onChange={(e) =>
                      setGenBytesCount(Math.max(1, Math.min(2048, Number(e.target.value))))
                    }
                    disabled={!instantiated || isProcessing}
                    className="h-[32px] text-xs mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <label
                    htmlFor="drbg-addl"
                    className="text-[10px] uppercase font-bold text-muted-foreground"
                  >
                    Additional Input (Opt.)
                  </label>
                  <Input
                    id="drbg-addl"
                    placeholder="E.g., contextual info"
                    value={addlInputStr}
                    onChange={(e) => setAddlInputStr(e.target.value)}
                    disabled={!instantiated || isProcessing}
                    className="h-[32px] text-xs mt-1"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="default"
                  className="w-full"
                  onClick={handleGenerate}
                  disabled={!instantiated || isProcessing}
                >
                  <Play size={16} className="mr-2" /> Generate
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleReseed}
                  disabled={!instantiated || isProcessing}
                  title="Reseeds using the current Additional Input and fresh entropy"
                >
                  <RotateCw size={16} className="mr-2" /> Reseed
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: State Visualization */}
        <div className="space-y-4">
          <div className="glass-panel p-4 space-y-4 bg-muted/10 h-full flex flex-col relative">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Database size={16} className="text-primary" />
                Internal State Tracker
              </h4>
              <div className="text-xs bg-muted/50 px-2 py-1 rounded font-medium text-muted-foreground">
                Reseed Counter: <span className="text-foreground">{reseedCounter}</span>
              </div>
            </div>

            {!instantiated && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px] z-10 rounded-xl">
                <span className="text-sm font-medium text-muted-foreground bg-background px-4 py-2 rounded-lg shadow-sm">
                  Instantiate DRBG to start tracking state
                </span>
              </div>
            )}

            <div className="space-y-4 flex-grow">
              {/* Key K */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-primary flex items-center gap-1">
                  <KeyRound size={12} /> Working Key (K)
                </span>
                <div className="font-mono text-[11px] bg-primary/10 text-primary rounded p-3 break-all border border-primary/20">
                  {formatHex(K, 0)}
                </div>
              </div>

              {/* Value V */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-success flex items-center gap-1">
                  <Hash size={12} /> State Value (V)
                </span>
                <div className="font-mono text-[11px] bg-success/10 text-success rounded p-3 break-all border border-success/20">
                  {formatHex(V, 0)}
                </div>
              </div>

              {lastGenerated && (
                <div className="space-y-1 mt-6 border-t border-border/50 pt-4">
                  <span className="text-[10px] uppercase font-bold text-foreground flex items-center gap-1">
                    <ArrowRight size={12} /> Last Generated Output ({lastGenerated.length} bytes)
                  </span>
                  <pre className="font-mono text-[11px] bg-muted/40 rounded p-3 break-all max-h-[100px] overflow-y-auto w-full whitespace-pre-wrap">
                    {formatHex(lastGenerated)}
                  </pre>
                </div>
              )}
            </div>

            {historyLog.length > 0 && (
              <div className="mt-4 border-t border-border/50 pt-3">
                <span className="text-[10px] uppercase font-bold text-muted-foreground mb-2 block">
                  Action Log
                </span>
                <div className="space-y-1">
                  {historyLog.map((log, i) => (
                    <div
                      key={i}
                      className={`text-[10px] ${i === 0 ? 'text-foreground font-medium' : 'text-muted-foreground opacity-60'}`}
                    >
                      • {log}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {instantiated && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="w-full mt-4 border border-border"
              >
                Reset DRBG
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
