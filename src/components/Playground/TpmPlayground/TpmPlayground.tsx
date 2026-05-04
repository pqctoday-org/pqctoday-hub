import { useEffect, useState } from 'react'
import { ShieldCheck, Terminal, Cpu } from 'lucide-react'
import { initTpm } from '../../../wasm/tpmBridge'
import { CommandBuilder } from './CommandBuilder'
import { StateInspector } from './StateInspector'
import { ExecutionLog } from './ExecutionLog'
import { ComplianceRunner } from './ComplianceRunner'

export interface TpmLogEntry {
  commandType: string
  algorithm: string
  request: Uint8Array
  response: Uint8Array | null
  error?: string
}

export interface TpmObjectEntry {
  handle: string
  description: string
  algorithm: string
}

export default function TpmPlayground() {
  const [isWasmReady, setIsWasmReady] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const [logs, setLogs] = useState<TpmLogEntry[]>([])
  const [objects, setObjects] = useState<TpmObjectEntry[]>([])

  useEffect(() => {
    initTpm()
      .then(() => setIsWasmReady(true))
      .catch((err) => setInitError(String(err)))
  }, [])

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-8 px-4">
      <div className="glass-panel p-8">
        <div className="flex items-start justify-between gap-8">
          <div className="flex-1 space-y-4">
            <h1 className="text-3xl font-bold tracking-tight">TPM 2.0 PQC Playground</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Execute raw TPM 2.0 commands directly within the browser using the
              WebAssembly-compiled
              <code>pqctpm</code> emulator. Explore the new TCG V1.85 RC4 Post-Quantum primitives
              (ML-KEM and ML-DSA) via a dual-mode Semantic & Hex builder.
            </p>
            <div className="flex gap-4">
              <span
                className={`text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${isWasmReady ? 'bg-success/10 text-success border-success/30' : 'bg-warning/10 text-warning border-warning/30'}`}
              >
                {isWasmReady ? 'WASM TPM INITIALIZED' : 'INITIALIZING WASM...'}
              </span>
              {initError && (
                <span className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded border bg-destructive/10 text-destructive border-destructive/30">
                  {initError}
                </span>
              )}
            </div>
          </div>
          <div className="text-6xl p-4 bg-secondary/5 rounded-2xl border border-border shrink-0">
            <Cpu className="h-16 w-16 text-primary" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Command Builder & Compliance */}
        <div className="lg:col-span-4 space-y-8">
          <div className="glass-panel p-6 border-l-4 border-l-primary">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Terminal className="text-primary h-5 w-5" />
              Command Builder
            </h2>
            <CommandBuilder
              disabled={!isWasmReady}
              onLogUpdate={(log) => setLogs((prev) => [...prev, log])}
              onObjectUpdate={(obj) => setObjects((prev) => [...prev, obj])}
              objects={objects}
            />
          </div>

          <div className="glass-panel p-6 border-l-4 border-l-secondary">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ShieldCheck className="text-secondary h-5 w-5" />
              Compliance Suite
            </h2>
            <ComplianceRunner />
          </div>
        </div>

        {/* Center Column: Execution Log */}
        <div className="lg:col-span-5 space-y-8">
          <div className="glass-panel p-6 h-full flex flex-col">
            <h2 className="text-xl font-bold mb-4">Execution Log</h2>
            <ExecutionLog logs={logs} />
          </div>
        </div>

        {/* Right Column: State Inspector */}
        <div className="lg:col-span-3 space-y-8">
          <div className="glass-panel p-6 h-full flex flex-col">
            <h2 className="text-xl font-bold mb-4">TPM State</h2>
            <StateInspector objects={objects} />
          </div>
        </div>
      </div>
    </div>
  )
}
