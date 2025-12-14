import React, { useEffect } from 'react'
import { Play } from 'lucide-react'
import { useTLSStore } from '../../../../store/tls-learning.store'
import { TLSClientPanel } from './TLSClientPanel'
import { TLSServerPanel } from './TLSServerPanel'
import { TLSNegotiationResults } from './components/TLSNegotiationResults'
import { openSSLService } from '../../../../services/crypto/OpenSSLService'
import { generateOpenSSLConfig } from './utils/configGenerator'

import {
  DEFAULT_CLIENT_CERT,
  DEFAULT_CLIENT_KEY,
  DEFAULT_SERVER_CERT,
  DEFAULT_SERVER_KEY,
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

  // Trigger simulation when commands change (Replay)
  useEffect(() => {
    if (commands.length > 0) {
      triggerSimulation()
    }
  }, [commands])

  // Cleanup on unmount
  useEffect(() => {
    return () => clearSession()
  }, [])

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
          caPem: DEFAULT_CLIENT_CERT, // Trust the client cert (for mTLS if enabled)
        },
      })
      setClientConfig({
        certificates: {
          keyPem: DEFAULT_CLIENT_KEY,
          certPem: DEFAULT_CLIENT_CERT,
          caPem: DEFAULT_SERVER_CERT, // Trust the server cert
        },
      })
      console.log('Default certificates loaded.')
    }

    initDefaults()
  }, []) // Run once on mount (store persistence handles re-entry check)

  const triggerSimulation = async () => {
    setIsSimulating(true)
    setResults(null)

    // Define Standard Flow with current input messages
    // Always reconstruct standard flow for the "Run Full Interaction" button
    const currentCommands = [
      `CLIENT_SEND: ${clientMessage}`,
      `SERVER_SEND: ${serverMessage}`,
      'CLIENT_DISCONNECT',
      'SERVER_DISCONNECT',
    ]

    try {
      // 1. Prepare Certificates from Store
      // We encode them back to Uint8Array to pass to Worker
      const encoder = new TextEncoder()

      // For self-signed certificates, the CA is the certificate itself
      // For CA-signed certificates, caPem would be the actual CA cert
      const serverCertPem = serverConfig.certificates.certPem || ''
      const clientCertPem = clientConfig.certificates.certPem || ''

      const simFiles = [
        { name: 'ssl/server.crt', data: encoder.encode(serverCertPem) },
        { name: 'ssl/server.key', data: encoder.encode(serverConfig.certificates.keyPem || '') },
      ]

      // Client CA: Used by CLIENT to verify SERVER's certificate
      // If clientConfig.certificates.caPem is set, use it; otherwise fallback to server's cert (for self-signed)
      const clientCaPem = clientConfig.certificates.caPem || serverCertPem
      if (clientCaPem) {
        simFiles.push({ name: 'ssl/client-ca.crt', data: encoder.encode(clientCaPem) })
      }

      // Server CA: Used by SERVER to verify CLIENT's certificate (mTLS)
      // If serverConfig.certificates.caPem is set, use it; otherwise fallback to client's cert (for self-signed)
      const serverCaPem = serverConfig.certificates.caPem || clientCertPem
      if (serverCaPem && serverConfig.verifyClient) {
        simFiles.push({ name: 'ssl/server-ca.crt', data: encoder.encode(serverCaPem) })
      }

      if (clientCertPem) {
        // Add client cert and key for mTLS scenarios
        simFiles.push(
          { name: 'ssl/client.crt', data: encoder.encode(clientCertPem) },
          { name: 'ssl/client.key', data: encoder.encode(clientConfig.certificates.keyPem || '') }
        )
      }

      // 2. Prepare Configs
      const clientCfg = generateOpenSSLConfig(clientConfig, 'client')
      const serverCfg = generateOpenSSLConfig(serverConfig, 'server')

      // 3. Run Simulation
      const resultStr = await openSSLService.simulateTLS(
        clientCfg,
        serverCfg,
        simFiles,
        currentCommands
      )

      try {
        const parsed = JSON.parse(resultStr)
        setResults({
          trace: parsed.trace || [],
          status: parsed.status || 'success', // Fallback to success if not present in older runs? No, C provides it.
          error: parsed.error,
        })
      } catch {
        console.error('JSON Parse Error on result:', resultStr)
        // Fallback: If output is not JSON (e.g. worker crash/timeout text), display it as a log entry
        setResults({
          trace: [
            {
              side: 'system',
              event: 'error',
              details: 'RAW OUTPUT: ' + resultStr.substring(0, 1000), // Truncate for safety
            },
          ],
          status: 'error',
          error: 'Simulation returned invalid data (likely worker crash or timeout).',
        })
      }
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : 'Unknown error'
      console.error('Simulation failed:', e)
      setResults({ trace: [], status: 'error', error: errMsg })
    } finally {
      setIsSimulating(false)
    }
  }

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
    </div>
  )
}
