import { useCallback, useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router'
import { ShieldCheck, Terminal, Cpu } from 'lucide-react'
import {
  initTpm,
  getV2p7Status,
  getPqcBridgeStatus,
  type PqcBridgeStatus,
} from '../../../wasm/tpmBridge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { CommandBuilder } from './CommandBuilder'
import { StateInspector } from './StateInspector'
import { ExecutionLog } from './ExecutionLog'
import { ComplianceRunner } from './ComplianceRunner'
import { V2p7EkExplorer } from './V2p7EkExplorer'
import { V2p7EkCertReader } from './V2p7EkCertReader'
import { AttestationPanel } from './AttestationPanel'
import { WhyThisMatters } from '@/components/ui/WhyThisMatters'
import { GlossaryProvider } from '../learnkit/GlossaryProvider'
import { TPM_GLOSSARY_DATA } from './learn/tpmGlossary'
import { TpmLearnView } from './learn/TpmLearnView'

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

const TPM_ROUTE = '/playground/tpm-playground'
const TPM_TABS = ['learn', 'builder', 'v27-eks', 'v27-certs', 'attestation'] as const
type TpmTab = (typeof TPM_TABS)[number]
const isTpmTab = (v: string | null): v is TpmTab =>
  v !== null && (TPM_TABS as readonly string[]).includes(v)

export default function TpmPlayground() {
  const [isWasmReady, setIsWasmReady] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const [logs, setLogs] = useState<TpmLogEntry[]>([])
  const [objects, setObjects] = useState<TpmObjectEntry[]>([])
  const [bridgeStatus, setBridgeStatus] = useState<PqcBridgeStatus>('unknown')
  // Learn is the default tab (2026-07-23 curriculum decision, mirroring the
  // PKCS#11 redesign); controlled so lesson "try it in the workbench" chips
  // can navigate.
  //
  // On its own page the open tab lives in ?tab= so it can be shared. The same
  // component is also embedded in a simulation step, where the address belongs
  // to the simulation, so only the tool's own route reads or writes it.
  const [searchParams, setSearchParams] = useSearchParams()
  const { pathname } = useLocation()
  const ownsUrl = pathname === TPM_ROUTE
  const urlTab = searchParams.get('tab')
  const [activeTab, setActiveTabState] = useState<TpmTab>(() =>
    ownsUrl && isTpmTab(urlTab) ? urlTab : 'learn'
  )
  const setActiveTab = useCallback(
    (tab: string) => {
      if (!isTpmTab(tab)) return
      setActiveTabState(tab)
      if (!ownsUrl) return
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (tab === 'learn') next.delete('tab')
          else next.set('tab', tab)
          return next
        },
        { replace: true }
      )
    },
    [ownsUrl, setSearchParams]
  )

  useEffect(() => {
    initTpm()
      .then(() => {
        setIsWasmReady(true)
        setBridgeStatus(getPqcBridgeStatus())
      })
      .catch((err) => setInitError(String(err)))
  }, [])

  return (
    <GlossaryProvider data={TPM_GLOSSARY_DATA}>
      <div className="max-w-7xl mx-auto space-y-8 py-8 px-4">
        <div className="glass-panel p-8">
          <div className="flex items-start justify-between gap-8">
            <div className="flex-1 space-y-4">
              {/* h2, not h1: PlaygroundToolRoute now supplies the page's single
                  <h1> (the tool name) for every tool. This was the one tool that
                  shipped its own h1, so leaving it would give this page two.
                  Visual styling is unchanged. */}
              <h2 className="text-3xl font-bold tracking-tight">TPM 2.0 PQC Playground</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Execute raw TPM 2.0 commands directly within the browser using the
                WebAssembly-compiled
                <code>pqctpm</code> emulator. Explore ML-KEM and ML-DSA using an engine derived from
                the earlier TCG V1.85 RC4 snapshot. The current normative reference is the final TCG
                TPM 2.0 Library Version 185 (March 2026). Commands run against this local software
                emulator, not a physical TPM; the displayed results do not demonstrate
                hardware-backed key protection or device attestation.
              </p>
              <div className="flex gap-4">
                <span
                  className={`text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${isWasmReady ? 'bg-success/10 text-success border-success/30' : 'bg-warning/10 text-warning border-warning/30'}`}
                >
                  {isWasmReady ? 'WASM TPM INITIALIZED' : 'INITIALIZING WASM...'}
                </span>
                {isWasmReady && bridgeStatus === 'active' && (
                  <span className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded border bg-success/10 text-success border-success/30">
                    PQC BRIDGE ACTIVE — REAL ML-KEM/ML-DSA
                  </span>
                )}
                {isWasmReady && bridgeStatus === 'unavailable' && (
                  <span
                    className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded border bg-destructive/10 text-destructive border-destructive/30"
                    title="registerPqcBridge() failed to load — every PQC command this session returns synthetic placeholder bytes, not real ML-KEM/ML-DSA output."
                  >
                    PQC BRIDGE UNAVAILABLE — PLACEHOLDER CRYPTO
                  </span>
                )}
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

        <WhyThisMatters title="TPM Hierarchy & Hardware-Bound PQC Keys" variant="info">
          <p>
            TPM 2.0 commonly presents three primary <strong>hierarchies</strong>: <em>Owner</em>{' '}
            (user-controlled storage), <em>Endorsement</em>
            (used for endorsement keys and related authorization), and <em>Platform</em>
            (firmware-controlled). It also defines the <em>Null</em> hierarchy for transient
            objects. A hierarchy seed helps derive primary objects, but hierarchy authorization
            alone does not decide whether a child object can be moved.
          </p>
          <p>
            For a TPM-created ML-DSA or ML-KEM object, attributes such as <code>fixedTPM</code>,{' '}
            <code>fixedParent</code>, and <code>sensitiveDataOrigin</code>, together with its parent
            and authorization policy, govern creation and duplication. Those are TPM controls;{' '}
            <code>CKA_EXTRACTABLE</code> belongs to PKCS #11. A key is hardware-bound only when its
            attributes and policy prevent duplication—not merely because it was created below a
            hierarchy.
          </p>
          <p>
            The V2.7 EK tabs show sample Endorsement Keys and certificates created by this local
            emulator. The published TCG profile defines templates and certificate slots, but does
            not require every manufacturer to pre-provision those certificates. The browser sample
            is not a manufacturer credential or proof of a physical TPM. Note also that TCG TPM 2.0
            (discrete or firmware TPMs) is distinct from silicon root-of-trust architectures such as
            OCP Caliptra, which define their own DICE/attestation flows rather than the TPM 2.0
            command set.
          </p>
        </WhyThisMatters>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="learn">Learn</TabsTrigger>
            <TabsTrigger value="builder">Command Builder</TabsTrigger>
            <TabsTrigger value="v27-eks">V2.7 EKs</TabsTrigger>
            <TabsTrigger value="v27-certs">EK Certs</TabsTrigger>
            <TabsTrigger value="attestation">Attestation</TabsTrigger>
          </TabsList>

          <TabsContent value="learn">
            <TpmLearnView isWasmReady={isWasmReady} onTryInWorkbench={setActiveTab} />
          </TabsContent>

          <TabsContent value="builder">
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
                  <StateInspector objects={objects} isWasmReady={isWasmReady} />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="v27-eks">
            <V2p7EkExplorer isWasmReady={isWasmReady} v2p7Status={getV2p7Status()} />
          </TabsContent>

          <TabsContent value="v27-certs">
            <V2p7EkCertReader isWasmReady={isWasmReady} v2p7Status={getV2p7Status()} />
          </TabsContent>

          <TabsContent value="attestation">
            <AttestationPanel isWasmReady={isWasmReady} />
          </TabsContent>
        </Tabs>
      </div>
    </GlossaryProvider>
  )
}
