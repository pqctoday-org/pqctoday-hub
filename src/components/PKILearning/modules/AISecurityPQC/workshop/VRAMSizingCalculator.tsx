// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Activity, ShieldAlert, Cpu, Database, Server } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { calculateVramImpact } from '../utils/aiVramMath'

const GPUS = [
  { id: 'l4', name: 'NVIDIA L4', capacityGB: 24 },
  { id: 'a10g', name: 'NVIDIA A10G', capacityGB: 24 },
  { id: 'a100-40', name: 'NVIDIA A100 (40GB)', capacityGB: 40 },
  { id: 'a100-80', name: 'NVIDIA A100 (80GB)', capacityGB: 80 },
]

const MODELS = [
  { id: 'llama3-8b', name: 'Llama 3 (8B)', weightsGB: 14, kvCacheMB: 10 },
  { id: 'llama3-70b', name: 'Llama 3 (70B) quantized', weightsGB: 35, kvCacheMB: 40 },
]

const CRYPTO_PROFILES = [
  { id: 'classical', name: 'Classical (ECDSA)', sizeKB: 2 },
  { id: 'hybrid', name: 'Hybrid (P-256 + ML-DSA-44)', sizeKB: 10 },
  { id: 'pure-pqc', name: 'Pure PQC (ML-DSA-87)', sizeKB: 25 },
]

export const VRAMSizingCalculator: React.FC = () => {
  const [selectedGpuId, setSelectedGpuId] = useState('a100-80')
  const [selectedModelId, setSelectedModelId] = useState('llama3-70b')
  const [selectedCryptoId, setSelectedCryptoId] = useState('pure-pqc')
  const [concurrentSessions, setConcurrentSessions] = useState(100_000) // High concurrency

  const gpu = GPUS.find((g) => g.id === selectedGpuId) || GPUS[3]
  const model = MODELS.find((m) => m.id === selectedModelId) || MODELS[1]
  const crypto = CRYPTO_PROFILES.find((c) => c.id === selectedCryptoId) || CRYPTO_PROFILES[2]

  const { modelVramGB, kvCacheVramGB, cryptoVramGB, totalVramGB, isOOM, remainingVramGB } =
    calculateVramImpact(
      gpu.capacityGB,
      model.weightsGB,
      concurrentSessions,
      model.kvCacheMB,
      crypto.sizeKB
    )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h2 className="text-2xl font-bold text-foreground">GPU VRAM Sizing Calculator</h2>
        <p className="text-muted-foreground mt-2">
          Model the VRAM exhaustion risk when terminating massive PQC cryptographic payloads
          directly on inference GPUs (e.g., cuPQC) at extremely high concurrency.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="glass-panel p-6 space-y-6">
          <div>
            <div className="text-sm font-bold block mb-2 flex items-center gap-2">
              <Server size={16} /> Inference GPU
            </div>
            <div className="grid grid-cols-2 gap-2">
              {GPUS.map((g) => (
                <Button
                  key={g.id}
                  variant={selectedGpuId === g.id ? 'default' : 'outline'}
                  onClick={() => setSelectedGpuId(g.id)}
                  className="w-full text-xs"
                >
                  {g.name}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-bold block mb-2 flex items-center gap-2">
              <Database size={16} /> LLM Weights & Context
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MODELS.map((m) => (
                <Button
                  key={m.id}
                  variant={selectedModelId === m.id ? 'default' : 'outline'}
                  onClick={() => setSelectedModelId(m.id)}
                  className="w-full text-xs"
                >
                  {m.name}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-bold block mb-2 flex items-center gap-2">
              <Cpu size={16} /> Cryptographic State
            </div>
            <div className="grid grid-cols-3 gap-2">
              {CRYPTO_PROFILES.map((c) => (
                <Button
                  key={c.id}
                  variant={selectedCryptoId === c.id ? 'default' : 'outline'}
                  onClick={() => setSelectedCryptoId(c.id)}
                  className="w-full text-xs p-1 h-auto py-2 flex flex-col items-center"
                >
                  <span className="font-bold block">{c.name.split(' ')[0]}</span>
                  <span className="text-[10px] opacity-80">{c.sizeKB} KB</span>
                </Button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-bold flex justify-between mb-2">
              <span>Concurrent Inferences (Batch Size)</span>
              <span className="font-mono text-primary">{concurrentSessions.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="1000"
              max="250000"
              step="1000"
              value={concurrentSessions}
              onChange={(e) => setConcurrentSessions(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
        </div>

        {/* Visualization */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Activity size={20} className={isOOM ? 'text-destructive' : 'text-success'} />
              VRAM Allocation Stack
            </h3>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-500" /> Model Weights
                </span>
                <span className="font-mono">{modelVramGB.toFixed(2)} GB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-purple-500" /> KV Cache
                </span>
                <span className="font-mono">{kvCacheVramGB.toFixed(2)} GB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-warning" /> PQC Crypto State
                </span>
                <span className="font-mono">{cryptoVramGB.toFixed(2)} GB</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between text-sm font-bold">
                <span>Total Required</span>
                <span className={`font-mono ${isOOM ? 'text-destructive' : 'text-foreground'}`}>
                  {totalVramGB.toFixed(2)} GB / {gpu.capacityGB} GB
                </span>
              </div>
            </div>

            {/* Stack Bar */}
            <div className="w-full h-8 bg-muted rounded-lg overflow-hidden flex shadow-inner">
              <div
                className="h-full bg-blue-500"
                style={{ width: `${Math.min((modelVramGB / gpu.capacityGB) * 100, 100)}%` }}
              />
              <div
                className="h-full bg-purple-500"
                style={{ width: `${Math.min((kvCacheVramGB / gpu.capacityGB) * 100, 100)}%` }}
              />
              <div
                className="h-full bg-warning"
                style={{ width: `${Math.min((cryptoVramGB / gpu.capacityGB) * 100, 100)}%` }}
              />
            </div>
            {isOOM && <div className="w-full h-2 bg-destructive mt-1 rounded-full animate-pulse" />}
          </div>

          <div className="mt-8">
            {isOOM ? (
              <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg flex gap-3 text-destructive">
                <ShieldAlert size={24} className="shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">Out of Memory (CUDA OOM)</h4>
                  <p className="text-xs mt-1 opacity-90">
                    The total requested VRAM ({totalVramGB.toFixed(1)} GB) exceeds the {gpu.name}'s
                    physical capacity ({gpu.capacityGB} GB). The massive PQC cryptographic state
                    buffers have pushed the inference engine over the edge.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-success/10 border border-success/20 p-4 rounded-lg flex gap-3 text-success-foreground">
                <Activity size={24} className="shrink-0 text-success" />
                <div>
                  <h4 className="font-bold text-sm">VRAM Optimal</h4>
                  <p className="text-xs mt-1 opacity-90">
                    The GPU can safely terminate the cryptographic connections and load the model.{' '}
                    {remainingVramGB.toFixed(1)} GB of VRAM remains available.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
