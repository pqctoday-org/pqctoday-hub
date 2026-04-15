// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Server, Lock, Globe, FileSignature, Box, Link2, AlertCircle, Trash2 } from 'lucide-react'
import { Pkcs11LogPanel } from '../shared/Pkcs11LogPanel'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import type { Pkcs11LogEntry } from '../../wasm/softhsm'

type TestScenario = 'tls' | 'ssh' | 'vpn' | 'pki' | 'sequoia' | 'web3'

interface TileBlueprint {
  id: TestScenario
  title: string
  description: string
  icon: React.ElementType
}

const TILES: TileBlueprint[] = [
  { id: 'tls', title: 'OpenSSL 3.6 TLS 1.3', description: 'Evaluate ML-KEM Key Encapsulation within a TLS tunnel.', icon: Globe },
  { id: 'ssh', title: 'OpenSSH Connectivity', description: 'Extract hardware-bound identities dynamically via ssh-agent.', icon: Server },
  { id: 'vpn', title: 'strongSwan IPsec', description: 'Simulate IKEv2 negotiations securely over the loopback protocol.', icon: Link2 },
  { id: 'pki', title: 'Easy-RSA PKI', description: 'Generate Enterprise ML-DSA Certificate Authorities recursively.', icon: FileSignature },
  { id: 'sequoia', title: 'Sequoia PGP', description: 'Assert software code signing dynamically over internal pipelines.', icon: Box },
  { id: 'web3', title: 'Web3 & Identity', description: 'Ethereum JSON-RPC and IOTA Identity execution boundaries.', icon: Lock }
]

export const DockerPlaygroundView = () => {
  const [hsmLog, setHsmLog] = useState<Pkcs11LogEntry[]>([])
  const [loading, setLoading] = useState<TestScenario | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleExecute = async (scenario: TestScenario) => {
    setLoading(scenario)
    setErrorMsg(null)
    try {
      const res = await fetch(`http://localhost:8080/api/run/${scenario}`, {
        method: 'POST'
      })
      
      if (!res.ok) {
        throw new Error("HTTP Docker Bridge failed to connect!")
      }
      
      const data = await res.json()
      if (data.status === 200 && data.log) {
        // Shift exact chronological array up dynamically mapped from spy traces
        setHsmLog(data.log)
      } else {
        throw new Error("Playground API returned malformed data.")
      }
    } catch (err: any) {
      setErrorMsg(`Connection error to Docker API on port 8080: ${err.message}`)
      setHsmLog([])
    } finally {
      setLoading(null)
    }
  }

  const clearLog = () => {
    setHsmLog([])
    setErrorMsg(null)
  }

  return (
    <Card className="p-3 md:p-6 min-h-[60vh] md:min-h-[85vh] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 shrink-0 gap-2">
        <h3 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <Server className="text-primary" aria-hidden="true" />
          Enterprise Docker Simulation
        </h3>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-status-warning/10 text-status-warning border border-status-warning/30">
          Native Container Required
        </span>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
        <p className="text-sm text-foreground/80">
          These test scenarios execute entirely inside the powerful <strong>pqctoday-playground</strong> C++ Docker monolith via local API mappings (localhost:8080).
          Click any target below to spawn an isolated cryptographic workflow securely evaluating the specific protocol. The resulting hardware telemetry will be seamlessly ported directly into your frontend here!
        </p>
      </div>

      {/* Target Array */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 flex-1">
        {TILES.map((tile) => {
          const Icon = tile.icon
          const isActing = loading === tile.id
          const disabled = loading !== null
          
          return (
            <div key={tile.id} className="glass-panel p-5 flex flex-col items-start gap-4">
              <div className="flex items-center gap-3 w-full">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
                </div>
                <h4 className="font-semibold text-foreground flex-1">
                  {tile.title}
                </h4>
              </div>
              
              <p className="text-sm text-muted-foreground flex-1">
                {tile.description}
              </p>

              <Button
                onClick={() => handleExecute(tile.id)}
                disabled={disabled}
                className="w-full mt-2"
                variant={isActing ? "secondary" : "default"}
              >
                {isActing ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                    Simulating...
                  </span>
                ) : (
                  "Execute Scenario"
                )}
              </Button>
            </div>
          )
        })}
      </div>

      {/* Error display */}
      {errorMsg && (
        <div className="p-4 bg-status-error/10 border border-status-error/50 rounded-xl flex items-center gap-3 text-status-error text-sm shrink-0 mb-4">
          <AlertCircle size={20} aria-hidden="true" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Interactive Spy Parser Log Terminal */}
      <div className="mt-auto">
         <div className="flex justify-between items-center bg-card-header p-3 border border-border rounded-t-xl mt-4">
            <h4 className="flex items-center gap-2 font-medium text-sm">
                <FileSignature size={14} className="text-primary"/> 
                PKCS#11 Trace Pipeline
            </h4>
            <Button variant="ghost" size="sm" onClick={clearLog} disabled={hsmLog.length === 0} className="h-6 gap-1 text-xs px-2">
                <Trash2 size={12} /> Clear Stream
            </Button>
         </div>
         <div className="border border-t-0 border-border rounded-b-xl overflow-hidden shadow-inner">
             <Pkcs11LogPanel 
                log={hsmLog} 
                onClear={clearLog} 
                defaultOpen={true} 
                className="border-none shadow-none bg-transparent" 
             />
         </div>
      </div>

    </Card>
  )
}
