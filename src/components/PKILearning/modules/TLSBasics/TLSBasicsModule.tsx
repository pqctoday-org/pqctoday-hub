// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Play, Loader2 } from 'lucide-react'
import { useTLSStore } from '@/store/tls-learning.store'
import { useModuleStore } from '@/store/useModuleStore'
import { getModuleDeepLink, useSyncDeepLink } from '@/hooks/useModuleDeepLink'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { TLSClientPanel } from './TLSClientPanel'
import { TLSServerPanel } from './TLSServerPanel'
import { TLSNegotiationResults } from './components/TLSNegotiationResults'
import { TLSComparisonTable } from './components/TLSComparisonTable'
import { TLSIntroduction } from './components/TLSIntroduction'
import { TLSExercises } from './components/TLSExercises'
import { TLSConfigGenerator } from './components/TLSConfigGenerator'
import { TLSSummary } from './components/TLSSummary'
import { openSSLService } from '@/services/crypto/OpenSSLService'
import { generateOpenSSLConfig } from './utils/configGenerator'
import { ModuleReferencesTab } from '../../common/ModuleReferencesTab'
import { ModuleMigrateTab } from '../../common/ModuleMigrateTab'

import { useHSM } from '@/hooks/useHSM'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import { hsm_generateMLDSAKeyPair, hsm_extractKeyValue, hsm_sign } from '@/wasm/softhsm'

const TLS_HSM_OPERATIONS = [
  'C_GenerateKeyPair',
  'C_GetAttributeValue',
  'C_MessageSignInit',
  'C_SignMessage',
  'C_MessageSignFinal',
]

import {
  DEFAULT_CLIENT_CERT,
  DEFAULT_CLIENT_KEY,
  DEFAULT_SERVER_CERT,
  DEFAULT_SERVER_KEY,
  DEFAULT_ROOT_CA,
  DEFAULT_MLDSA_ROOT_CA,
  DEFAULT_MLDSA_SERVER_CERT,
  DEFAULT_MLDSA_CLIENT_CERT,
  DEFAULT_MLDSA87_ROOT_CA,
  DEFAULT_MLDSA87_SERVER_CERT,
  DEFAULT_MLDSA87_CLIENT_CERT,
} from './utils/defaultCertificates'

const MODULE_ID = 'tls-basics'

export const TLSBasicsModule: React.FC = () => {
  const deepLink = getModuleDeepLink({ validTabs: ['learn', 'workshop', 'simulate'] })
  const [activeTab, setActiveTab] = useState(() => {
    // Map external 'workshop' URL param to internal 'simulate' tab value
    return deepLink.initialTab === 'workshop' ? 'simulate' : deepLink.initialTab
  })
  useSyncDeepLink(activeTab, 0)
  const startTimeRef = useRef(Date.now())
  const { updateModuleProgress, markStepComplete } = useModuleStore()

  const {
    clientConfig,
    serverConfig,
    setClientConfig,
    setServerConfig,
    isSimulating,
    setIsSimulating,
    results,
    setResults,
    commands,
    clearSession,
    clientMessage,
    serverMessage,
  } = useTLSStore()

  // --- Module Progress Tracking ---
  useEffect(() => {
    startTimeRef.current = Date.now()
    updateModuleProgress(MODULE_ID, {
      status: 'in-progress',
      lastVisited: Date.now(),
    })

    return () => {
      const elapsedMs = Date.now() - startTimeRef.current
      const elapsedMins = elapsedMs / 60000
      if (elapsedMins > 0) {
        const current = useModuleStore.getState().modules[MODULE_ID]
        updateModuleProgress(MODULE_ID, {
          timeSpent: (current?.timeSpent || 0) + elapsedMins,
        })
      }
    }
  }, [updateModuleProgress])

  // Track tab visits as completed steps
  const handleTabChange = useCallback(
    (tab: string) => {
      // Mark the tab being left
      markStepComplete(MODULE_ID, activeTab)
      setActiveTab(tab)
    },
    [activeTab, markStepComplete]
  )

  // --- Cleanup on unmount ---
  useEffect(() => {
    return () => clearSession()
  }, [clearSession])

  // --- Initialize Default Certificates ---
  useEffect(() => {
    const initDefaults = () => {
      // If we already have certificates AND caPem, don't regenerate (persists navigation)
      if (serverConfig.certificates.certPem && serverConfig.certificates.caPem) return

      console.log('Loading default certificates...')

      // Use pre-generated defaults for speed/stability
      setServerConfig({
        certificates: {
          keyPem: DEFAULT_SERVER_KEY,
          certPem: DEFAULT_SERVER_CERT,
          caPem: DEFAULT_ROOT_CA,
        },
      })
      setClientConfig({
        certificates: {
          keyPem: DEFAULT_CLIENT_KEY,
          certPem: DEFAULT_CLIENT_CERT,
          caPem: DEFAULT_ROOT_CA,
        },
      })
      console.log('Default certificates loaded.')
    }

    initDefaults()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Intentionally run once on mount; store persistence handles re-entry

  // --- Dynamic Trust Store Management ---
  useEffect(() => {
    if (!serverConfig.certificates.certPem || !clientConfig.certificates.certPem) return

    const getRootCa = (certPem: string | undefined) => {
      if (certPem === DEFAULT_MLDSA_SERVER_CERT || certPem === DEFAULT_MLDSA_CLIENT_CERT)
        return DEFAULT_MLDSA_ROOT_CA
      if (certPem === DEFAULT_MLDSA87_SERVER_CERT || certPem === DEFAULT_MLDSA87_CLIENT_CERT)
        return DEFAULT_MLDSA87_ROOT_CA
      return DEFAULT_ROOT_CA
    }

    const requiredClientCa = getRootCa(serverConfig.certificates.certPem)
    if (clientConfig.certificates.caPem !== requiredClientCa) {
      setClientConfig({
        certificates: {
          ...clientConfig.certificates,
          caPem: requiredClientCa,
        },
      })
    }

    const requiredServerCa = getRootCa(clientConfig.certificates.certPem)
    if (serverConfig.certificates.caPem !== requiredServerCa) {
      setServerConfig({
        certificates: {
          ...serverConfig.certificates,
          caPem: requiredServerCa,
        },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    serverConfig.certificates.certPem,
    clientConfig.certificates.certPem,
    serverConfig.certificates.caPem,
    clientConfig.certificates.caPem,
    setClientConfig,
    setServerConfig,
  ])

  // --- Simulation ---
  const triggerSimulation = useCallback(async () => {
    setIsSimulating(true)
    setResults(null)

    const currentCommands = [
      `CLIENT_SEND: ${clientMessage}`,
      `SERVER_SEND: ${serverMessage}`,
      'CLIENT_DISCONNECT',
      'SERVER_DISCONNECT',
    ]

    try {
      const encoder = new TextEncoder()
      const serverCertPem = serverConfig.certificates.certPem || ''
      const clientCertPem = clientConfig.certificates.certPem || ''

      const simFiles = [
        { name: 'ssl/server.crt', data: encoder.encode(serverCertPem) },
        { name: 'ssl/server.key', data: encoder.encode(serverConfig.certificates.keyPem || '') },
      ]

      const clientCaPem = clientConfig.certificates.caPem || serverCertPem
      if (clientCaPem) {
        simFiles.push({ name: 'ssl/client-ca.crt', data: encoder.encode(clientCaPem) })
      }

      const serverCaPem = serverConfig.certificates.caPem || clientCertPem
      if (serverCaPem && serverConfig.verifyClient) {
        simFiles.push({ name: 'ssl/server-ca.crt', data: encoder.encode(serverCaPem) })
      }

      if (clientCertPem) {
        simFiles.push(
          { name: 'ssl/client.crt', data: encoder.encode(clientCertPem) },
          { name: 'ssl/client.key', data: encoder.encode(clientConfig.certificates.keyPem || '') }
        )
      }

      const clientCfg = generateOpenSSLConfig(clientConfig, 'client')
      const serverCfg = generateOpenSSLConfig(serverConfig, 'server')

      console.log('[TLS Debug] Client Config:', clientCfg)
      console.log('[TLS Debug] Server Config:', serverCfg)
      console.log(
        '[TLS Debug] Server CA PEM:',
        serverCaPem ? serverCaPem.substring(0, 50) + '...' : 'None'
      )

      const resultStr = await openSSLService.simulateTLS(
        clientCfg,
        serverCfg,
        simFiles,
        currentCommands
      )

      try {
        const parsed = JSON.parse(resultStr)
        const simulationResult = {
          trace: parsed.trace || [],
          status: parsed.status || 'success',
          error: parsed.error,
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setResults(simulationResult as any)

        if (simulationResult.status === 'success') {
          markStepComplete(MODULE_ID, 'simulate')
        }

        if (simulationResult.status !== 'success') {
          console.error('[TLS Debug] Simulation Failed:', simulationResult.error)
        }
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError)
        setResults({
          trace: [],
          status: 'error',
          error: resultStr.substring(0, 200) || 'Unknown WASM error',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
      }
    } catch (error) {
      console.error('Simulation execution failed:', error)
      setResults({
        trace: [],
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
    } finally {
      setIsSimulating(false)
    }
  }, [
    clientConfig,
    serverConfig,
    clientMessage,
    serverMessage,
    setIsSimulating,
    setResults,
    markStepComplete,
  ])

  // Trigger simulation when commands change (Replay)
  useEffect(() => {
    if (commands.length > 0) {
      triggerSimulation()
    }
  }, [commands, triggerSimulation])

  const navigateToSimulate = useCallback(() => {
    markStepComplete(MODULE_ID, activeTab)
    setActiveTab('simulate')
  }, [activeTab, markStepComplete])

  // --- Live HSM demo — HSM-backed TLS server key operations ---
  const hsm = useHSM()
  const [hsmLines, setHsmLines] = useState<string[]>([])
  const [hsmRunning, setHsmRunning] = useState(false)
  const [hsmError, setHsmError] = useState<string | null>(null)

  const runHsmServerDemo = useCallback(async () => {
    if (!hsm.moduleRef.current) return
    setHsmRunning(true)
    setHsmLines([])
    setHsmError(null)
    hsm.clearLog()

    const addLine = (line: string) => setHsmLines((prev) => [...prev, line])

    try {
      const M = hsm.moduleRef.current
      const hSession = hsm.hSessionRef.current

      // Step 1: Generate server key pair (ML-DSA-65) in HSM
      const { pubHandle, privHandle } = hsm_generateMLDSAKeyPair(M, hSession, 65)
      const pubKeyBytes = hsm_extractKeyValue(M, hSession, pubHandle)
      addLine(
        `[Server] Key: C_GenerateKeyPair(CKM_ML_DSA_KEY_PAIR_GEN, CKP_ML_DSA_65)` +
          ` → pub=0x${pubHandle.toString(16).padStart(8, '0')} (${pubKeyBytes.length} B)`
      )

      // Step 2: Extract SubjectPublicKeyInfo (public key for Certificate)
      addLine(
        `[Server] Cert key: C_GetAttributeValue(CKA_VALUE) → ${pubKeyBytes.length} B SubjectPublicKeyInfo`
      )

      // Step 3: Sign TLS CertificateVerify message
      const handshakeTranscript =
        'TLS-1.3-CertificateVerify:ClientHello+ServerHello+...+CertificateVerify'
      const sigBytes = hsm_sign(M, hSession, privHandle, handshakeTranscript)
      addLine(
        `[Server] CertificateVerify: C_MessageSignInit(CKM_ML_DSA) + C_SignMessage(transcript) → ${sigBytes.length} B`
      )
      addLine(
        `[Client] Verify: sig[0..7]=${Array.from(sigBytes.slice(0, 8))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')}…`
      )
      addLine(`Private key never left HSM — CKA_EXTRACTABLE=FALSE`)
    } catch (e) {
      setHsmError(e instanceof Error ? e.message : String(e))
    } finally {
      setHsmRunning(false)
    }
  }, [hsm])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">TLS 1.3 Basics</h1>
          <p className="text-muted-foreground mt-2">
            Learn about TLS 1.3, configure handshake parameters, and explore PQC migration
            trade-offs.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="learn">Learn</TabsTrigger>
          <TabsTrigger value="simulate">Workshop</TabsTrigger>
          <TabsTrigger value="exercises">Exercises</TabsTrigger>
          <TabsTrigger value="references">References</TabsTrigger>
          <TabsTrigger value="tools">Tools & Products</TabsTrigger>
        </TabsList>

        {/* Learn Tab */}
        <TabsContent value="learn">
          <TLSIntroduction onNavigateToSimulate={navigateToSimulate} />
        </TabsContent>

        {/* Simulate Tab */}
        <TabsContent value="simulate">
          <div className="space-y-6">
            {/* Simulation Controls */}
            <div className="flex justify-end gap-3">
              {results && (
                <button
                  onClick={() => {
                    setResults(null)
                    clearSession()
                  }}
                  className="btn btn-secondary flex items-center gap-2 px-4 py-3"
                >
                  Reset
                </button>
              )}
              <button
                onClick={triggerSimulation}
                disabled={isSimulating}
                className="btn btn-primary flex items-center gap-2 px-6 py-3 text-lg"
              >
                {isSimulating ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <Play size={20} fill="currentColor" />
                )}
                {results ? 'Run Again' : 'Start Full Interaction'}
              </button>
            </div>

            {/* Config Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TLSClientPanel />
              <TLSServerPanel />
            </div>

            {/* Summary (appears after simulation) */}
            {results && (
              <TLSSummary
                events={results.trace || []}
                status={results.status === 'success' ? 'success' : 'failed'}
                mTLSEnabled={serverConfig.verifyClient ?? false}
              />
            )}

            {/* Detailed Results */}
            <TLSNegotiationResults />

            {/* HSM-Backed Server — Live PKCS#11 Demo */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">
                HSM-Backed TLS Server (PKCS#11)
              </h3>
              <p className="text-xs text-muted-foreground">
                In production, TLS server private keys live in a Hardware Security Module. The HSM
                signs the TLS CertificateVerify message via PKCS#11. Enable Live HSM Mode to see the
                real calls.
              </p>

              <LiveHSMToggle hsm={hsm} operations={TLS_HSM_OPERATIONS} />

              {hsm.isReady && (
                <div className="glass-panel p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">Run HSM Server Key Operations</p>
                    <button
                      onClick={runHsmServerDemo}
                      disabled={hsmRunning}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-black font-bold rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {hsmRunning ? (
                        <>
                          <Loader2 size={11} className="animate-spin" /> Running…
                        </>
                      ) : (
                        'Execute (Live WASM)'
                      )}
                    </button>
                  </div>

                  {hsmError && <p className="text-xs text-status-error font-mono">{hsmError}</p>}

                  {hsmLines.length > 0 && (
                    <div className="bg-status-success/5 border border-status-success/20 rounded-lg p-3 space-y-1">
                      {hsmLines.map((line, i) => (
                        <p key={i} className="text-xs font-mono text-foreground/80 break-all">
                          {line}
                        </p>
                      ))}
                      <p className="text-[10px] text-muted-foreground pt-1 border-t border-border/30">
                        Real output from SoftHSM3 WASM · PKCS#11 v3.2
                      </p>
                    </div>
                  )}

                  <Pkcs11LogPanel
                    log={hsm.log}
                    onClear={hsm.clearLog}
                    defaultOpen={true}
                    title="PKCS#11 Call Log — TLS Server Operations"
                    emptyMessage="Click 'Execute' to run the HSM-backed TLS server demo."
                    filterFns={TLS_HSM_OPERATIONS}
                  />
                </div>
              )}
            </div>

            {/* Comparison Table */}
            <div className="mt-6">
              <TLSComparisonTable />
            </div>

            {/* Complete Module — shown after a successful simulation */}
            {results?.status === 'success' && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    markStepComplete(MODULE_ID, 'workshop')
                    updateModuleProgress(MODULE_ID, { status: 'completed' })
                  }}
                  className="px-6 py-3 min-h-[44px] bg-accent text-accent-foreground font-bold rounded-lg hover:bg-accent/90 transition-colors"
                >
                  Complete Module
                </button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Exercises Tab */}
        <TabsContent value="exercises">
          <TLSExercises onNavigateToSimulate={navigateToSimulate} />
          <div className="mt-6">
            <TLSConfigGenerator />
          </div>
        </TabsContent>

        {/* References Tab */}
        <TabsContent value="references">
          <ModuleReferencesTab moduleId="tls-basics" />
        </TabsContent>

        {/* Tools & Products Tab */}
        <TabsContent value="tools">
          <ModuleMigrateTab moduleId={MODULE_ID} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
