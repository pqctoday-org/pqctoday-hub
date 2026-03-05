import React, { useEffect, useCallback } from 'react'
import { Play } from 'lucide-react'
import { useTLSStore } from '../../../../store/tls-learning.store'
import { TLSClientPanel } from './TLSClientPanel'
import { TLSServerPanel } from './TLSServerPanel'
import { TLSNegotiationResults } from './components/TLSNegotiationResults'
import { TLSComparisonTable } from './components/TLSComparisonTable'
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

export const TLSBasicsModule: React.FC = () => {
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

  // Cleanup on unmount
  useEffect(() => {
    return () => clearSession()
  }, [clearSession])

  // Initialize Default Certificates if missing
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
          caPem: DEFAULT_ROOT_CA, // Trust certs signed by Root CA (starts with RSA)
        },
      })
      setClientConfig({
        certificates: {
          keyPem: DEFAULT_CLIENT_KEY,
          certPem: DEFAULT_CLIENT_CERT,
          caPem: DEFAULT_ROOT_CA, // Trust certs signed by Root CA
        },
      })
      console.log('Default certificates loaded.')
    }

    initDefaults()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Intentionally run once on mount; store persistence handles re-entry

  // Dynamic Trust Store Management
  // Automatically switches the trusted Root CA based on the peer's certificate type
  // This bypasses WASM limitations with concatenated PEM files
  useEffect(() => {
    // Ensure certificates are loaded before applying logic
    // This prevents overwriting the store with stale/empty state during initialization
    if (!serverConfig.certificates.certPem || !clientConfig.certificates.certPem) return

    // Helper to resolve the correct Root CA for a given certificate
    const getRootCa = (certPem: string | undefined) => {
      if (certPem === DEFAULT_MLDSA_SERVER_CERT || certPem === DEFAULT_MLDSA_CLIENT_CERT)
        return DEFAULT_MLDSA_ROOT_CA
      if (certPem === DEFAULT_MLDSA87_SERVER_CERT || certPem === DEFAULT_MLDSA87_CLIENT_CERT)
        return DEFAULT_MLDSA87_ROOT_CA
      return DEFAULT_ROOT_CA
    }

    // 1. Client Trust -> Server
    const requiredClientCa = getRootCa(serverConfig.certificates.certPem)
    if (clientConfig.certificates.caPem !== requiredClientCa) {
      setClientConfig({
        certificates: {
          ...clientConfig.certificates,
          caPem: requiredClientCa,
        },
      })
    }

    // 2. Server Trust -> Client (mTLS)
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

  const triggerSimulation = useCallback(async () => {
    setIsSimulating(true)
    setResults(null)

    // Define Standard Flow with current input messages
    const currentCommands = [
      `CLIENT_SEND: ${clientMessage}`,
      `SERVER_SEND: ${serverMessage}`,
      'CLIENT_DISCONNECT',
      'SERVER_DISCONNECT',
    ]

    try {
      // 1. Prepare Certificates from Store
      const encoder = new TextEncoder()
      const serverCertPem = serverConfig.certificates.certPem || ''
      const clientCertPem = clientConfig.certificates.certPem || ''

      const simFiles = [
        { name: 'ssl/server.crt', data: encoder.encode(serverCertPem) },
        { name: 'ssl/server.key', data: encoder.encode(serverConfig.certificates.keyPem || '') },
      ]

      // Client CA: Used by CLIENT to verify SERVER's certificate
      const clientCaPem = clientConfig.certificates.caPem || serverCertPem
      if (clientCaPem) {
        simFiles.push({ name: 'ssl/client-ca.crt', data: encoder.encode(clientCaPem) })
      }

      // Server CA: Used by SERVER to verify CLIENT's certificate (mTLS)
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

      // 2. Prepare Configs
      const clientCfg = generateOpenSSLConfig(clientConfig, 'client')
      const serverCfg = generateOpenSSLConfig(serverConfig, 'server')

      // Debug: Log configurations
      console.log('[TLS Debug] Client Config:', clientCfg)
      console.log('[TLS Debug] Server Config:', serverCfg)
      console.log(
        '[TLS Debug] Server CA PEM:',
        serverCaPem ? serverCaPem.substring(0, 50) + '...' : 'None'
      )

      // 3. Run Simulation
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
  }, [clientConfig, serverConfig, clientMessage, serverMessage, setIsSimulating, setResults])

  // Trigger simulation when commands change (Replay)
  useEffect(() => {
    if (commands.length > 0) {
      triggerSimulation()
    }
  }, [commands, triggerSimulation])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">TLS 1.3 Basics</h1>
          <p className="text-muted-foreground mt-2">
            Configure Client and Server parameters to observe the TLS 1.3 handshake negotiation.
          </p>
        </div>

        <div className="flex gap-3">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TLSClientPanel />
        <TLSServerPanel />
      </div>

      <TLSNegotiationResults />

      {/* Comparison Table Section */}
      <div className="mt-6">
        <TLSComparisonTable />
      </div>
    </div>
  )
}
