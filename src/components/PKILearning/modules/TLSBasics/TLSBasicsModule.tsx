/* eslint-disable security/detect-object-injection */
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Play } from 'lucide-react'
import { useTLSStore } from '../../../../store/tls-learning.store'
import { useModuleStore } from '../../../../store/useModuleStore'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { TLSClientPanel } from './TLSClientPanel'
import { TLSServerPanel } from './TLSServerPanel'
import { TLSNegotiationResults } from './components/TLSNegotiationResults'
import { TLSComparisonTable } from './components/TLSComparisonTable'
import { TLSIntroduction } from './components/TLSIntroduction'
import { TLSExercises } from './components/TLSExercises'
import { TLSSummary } from './components/TLSSummary'
import { openSSLService } from '../../../../services/crypto/OpenSSLService'
import { generateOpenSSLConfig } from './utils/configGenerator'

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
import { ModuleReferencesTab } from '../../common/ModuleReferencesTab'

const MODULE_ID = 'tls-basics'

export const TLSBasicsModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState('learn')
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
      if (serverConfig.certificates.certPem && serverConfig.certificates.caPem) return

      console.log('Loading default certificates...')

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
          <TabsTrigger value="simulate">Simulate</TabsTrigger>
          <TabsTrigger value="exercises">Exercises</TabsTrigger>
          <TabsTrigger value="references">References</TabsTrigger>
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

            {/* Comparison Table */}
            <div className="mt-6">
              <TLSComparisonTable />
            </div>
          </div>
        </TabsContent>

        {/* Exercises Tab */}
        <TabsContent value="exercises">
          <TLSExercises onNavigateToSimulate={navigateToSimulate} />
        </TabsContent>
        {/* References Tab */}
        <TabsContent value="references">
          <ModuleReferencesTab moduleId="tls-basics" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
