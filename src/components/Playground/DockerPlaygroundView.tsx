// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Server, Lock, Globe, FileSignature, Box, Link2, AlertCircle, Trash2 } from 'lucide-react'
import { Pkcs11LogPanel } from '../shared/Pkcs11LogPanel'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, Upload, UploadCloud, TerminalSquare, Copy, Check } from 'lucide-react'
import type { Pkcs11LogEntry } from '../../wasm/softhsm'

type TestScenario = 'tls' | 'ssh' | 'vpn' | 'pki' | 'sequoia' | 'web3'

interface TileBlueprint {
  id: TestScenario
  title: string
  description: string
  icon: React.ElementType
  steps: string[]
  expected: string
}

const TILES: TileBlueprint[] = [
  { id: 'tls', title: 'OpenSSL 3.6 TLS 1.3', description: 'Evaluate ML-KEM Key Encapsulation within a TLS tunnel.', icon: Globe, steps: ['1. Initialize OpenSSL s_server bound to SoftHSMv3', '2. Connect s_client using ML-KEM OID', '3. Capture Ephemeral KEM establishment', '4. Complete TLS handshake over loopback'], expected: 'CKR_OK returning derived shared secret confirming ML-KEM parity.' },
  { id: 'ssh', title: 'OpenSSH Connectivity', description: 'Extract hardware-bound identities dynamically via ssh-agent.', icon: Server, steps: ['1. Launch ssh-agent mapping pkcs11-provider', '2. Inject ML-DSA-87 public key via ssh-add', '3. Initialize SSH connection over loopback', '4. Intercept PKCS#11 C_Sign during auth'], expected: 'CKR_OK producing a valid 4627-byte ML-DSA signature.' },
  { id: 'vpn', title: 'strongSwan IPsec', description: 'Simulate IKEv2 negotiations securely over the loopback protocol.', icon: Link2, steps: ['1. Start strongSwan charon daemon', '2. Load SoftHSMv3 PKCS#11 plugin natively', '3. Initiate IKEv2 PQC tunnel establishment', '4. Sign IKE_AUTH hash using ML-DSA'], expected: 'Tunnel established and C_Sign returning CKR_OK for IKE authentication.' },
  { id: 'pki', title: 'Easy-RSA PKI', description: 'Generate Enterprise ML-DSA Certificate Authorities recursively.', icon: FileSignature, steps: ['1. Build Easy-RSA skeleton environment', '2. Issue Root CA using ML-DSA-44', '3. Provision Server constraints', '4. Verify Cert chain cryptographic validity'], expected: 'C_SignInit and C_Sign returning valid X.509 Certificate structures.' },
  { id: 'sequoia', title: 'Sequoia PGP', description: 'Assert software code signing dynamically over internal pipelines.', icon: Box, steps: ['1. Initialize Sequoia sq backend', '2. Generate OpenPGP ML-DSA bind', '3. Sign mock software binary artifact', '4. Validate detached signature integrity'], expected: 'Software artifact securely signed and validated returning CKR_OK.' },
  { id: 'web3', title: 'Web3 & Identity', description: 'Ethereum JSON-RPC and IOTA Identity execution boundaries.', icon: Lock, steps: ['1. Instantiate Ethereum Key manager payload', '2. Sign EIP-1559 transaction natively', '3. Validate DID (Distributed ID) core', '4. Verify smart contract execution signature'], expected: 'Transaction hash derived securely over PKCS#11 provider.' }
]

export const DockerPlaygroundView = () => {
  const [hsmLog, setHsmLog] = useState<Pkcs11LogEntry[]>([])
  const [loading, setLoading] = useState<TestScenario | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [activeModal, setActiveModal] = useState<TileBlueprint | null>(null)
  const [showInstallGuide, setShowInstallGuide] = useState(false)
  const [copied, setCopied] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText("docker run -d -p 8080:8080 ghcr.io/pqctoday/pqctoday-playground:latest")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
      setActiveModal(null)
    }
  }

  const clearLog = () => {
    setHsmLog([])
    setErrorMsg(null)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setIsUploading(true)
    setErrorMsg(null)
    
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const res = await fetch(`http://localhost:8080/api/upload`, {
        method: 'POST',
        body: formData
      })
      if (!res.ok) {
        throw new Error("Failed to parse trace log on backend.")
      }
      const data = await res.json()
      if (data.status === 200 && data.log) {
        setHsmLog(data.log)
      } else {
        throw new Error(data.error || "Malformed trace log")
      }
    } catch (err: any) {
      setErrorMsg(`Upload parsing error: ${err.message}`)
    } finally {
      setIsUploading(false)
      // Reset input so the same file can be uploaded again if needed
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
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
        {/* Initialization Tile */}
        <div className="glass-panel p-5 flex flex-col items-start gap-4 border border-primary/40 shadow-[0_0_15px_rgba(var(--primary),0.1)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <div className="flex items-center gap-3 w-full">
            <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <TerminalSquare className="w-5 h-5 text-primary" aria-hidden="true" />
            </div>
            <h4 className="font-semibold text-foreground flex-1">
              Initialize Local Engine
            </h4>
          </div>
          <p className="text-sm text-muted-foreground flex-1">
            Install and run the complete hardware simulation environment via GHCR in less than 30 seconds.
          </p>
          <Button
            onClick={() => setShowInstallGuide(true)}
            className="w-full mt-2 font-bold"
            variant="default"
          >
            Installation Guide
          </Button>
        </div>

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
                onClick={() => setActiveModal(tile)}
                disabled={disabled}
                className="w-full mt-2"
                variant={isActing ? "secondary" : "outline"}
              >
                {isActing ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                    Simulating...
                  </span>
                ) : (
                  "View Overview"
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
            <div className="flex items-center gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept=".log,.txt,text/*" 
                  className="hidden" 
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={isUploading} 
                  className="h-6 gap-1 text-xs px-2"
                >
                    {isUploading ? <span className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full" /> : <UploadCloud size={12} />} 
                    Upload Trace
                </Button>
                <Button variant="ghost" size="sm" onClick={clearLog} disabled={hsmLog.length === 0} className="h-6 gap-1 text-xs px-2">
                    <Trash2 size={12} /> Clear Stream
                </Button>
            </div>
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

      <AnimatePresence>
        {activeModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="fixed inset-0 embed-backdrop bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 glass-panel p-6 max-w-lg w-full max-h-[90dvh] overflow-y-auto z-50 rounded-xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="docker-modal-title"
              style={{ zIndex: 60 }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                    <activeModal.icon className="w-5 h-5 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 id="docker-modal-title" className="text-xl font-bold leading-tight">
                      {activeModal.title}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Execution Overview</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setActiveModal(null)} aria-label="Close modal" className="shrink-0">
                  <X size={20} />
                </Button>
              </div>

              <p className="text-sm text-foreground/80 my-4">
                {activeModal.description}
              </p>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Execution Steps</h4>
                <ul className="space-y-1.5 pl-1">
                  {activeModal.steps.map((step, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground">
                      {step}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-status-success/5 border border-status-success/20 rounded-lg p-3 mb-6">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-status-success mb-1">Expected Telemetry</h4>
                <p className="text-xs text-muted-foreground">
                  {activeModal.expected}
                </p>
              </div>

              <Button
                className="w-full gap-2 font-bold"
                onClick={() => handleExecute(activeModal.id)}
              >
                <Play className="w-4 h-4 fill-current"/>
                Confirm & Execute Simulation
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Install Guide Modal */}
      <AnimatePresence>
        {showInstallGuide && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInstallGuide(false)}
              className="fixed inset-0 embed-backdrop bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 glass-panel p-6 max-w-lg w-full max-h-[90dvh] overflow-y-auto z-50 rounded-xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="install-modal-title"
              style={{ zIndex: 60 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                    <TerminalSquare className="w-5 h-5 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 id="install-modal-title" className="text-xl font-bold leading-tight">
                      Deploy Engine via GHCR
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Automated Execution Environment</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowInstallGuide(false)} aria-label="Close modal">
                  <X size={20} />
                </Button>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-foreground/90">
                  Because this platform natively integrates OpenSSH, strongSwan, and TLS 1.3 compiling across massively heavy cryptography payloads, the execution relies on our automated headless container.
                </p>
                <div className="bg-muted border border-border rounded-lg p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Step 1: Execute Container</p>
                  <p className="text-xs text-foreground/70 mb-3">
                    Ensure Docker Desktop or OrbStack is running, then paste this into your terminal. It will instantly pull and run the environment in the background.
                  </p>
                  <div className="relative group">
                    <pre className="bg-black text-green-400 p-3 rounded-md text-xs font-mono overflow-x-auto">
                      docker run -d -p 8080:8080 ghcr.io/pqctoday/pqctoday-playground:latest
                    </pre>
                    <Button 
                      onClick={handleCopy} 
                      size="icon" 
                      variant="outline" 
                      className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-black border-zinc-700 hover:bg-zinc-800 focus:opacity-100"
                    >
                      {copied ? <Check size={12} className="text-status-success"/> : <Copy size={12} className="text-white"/>}
                    </Button>
                  </div>
                </div>
                <div className="bg-status-success/10 border border-status-success/20 rounded-lg p-4">
                   <p className="text-xs font-semibold uppercase text-status-success mb-1">Step 2: Simulation Activated</p>
                   <p className="text-xs text-muted-foreground">
                      That’s it! The container is now flawlessly hooked into your application instance over port 8080. You can now close this interface and select any simulation to natively intercept traces!
                   </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </Card>
  )
}
