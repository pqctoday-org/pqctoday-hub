// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useEffect, useCallback } from 'react'
import { Play } from 'lucide-react'
import { useTLSStore, type SimulationResult } from '@/store/tls-learning.store'
import { openSSLService } from '@/services/crypto/OpenSSLService'
import { generateOpenSSLConfig } from '../PKILearning/modules/TLSBasics/utils/configGenerator'
import { TLSClientPanel } from '../PKILearning/modules/TLSBasics/TLSClientPanel'
import { TLSServerPanel } from '../PKILearning/modules/TLSBasics/TLSServerPanel'
import { TLSNegotiationResults } from '../PKILearning/modules/TLSBasics/components/TLSNegotiationResults'
import { TLSSummary } from '../PKILearning/modules/TLSBasics/components/TLSSummary'
import { TLSComparisonTable } from '../PKILearning/modules/TLSBasics/components/TLSComparisonTable'
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
} from '../PKILearning/modules/TLSBasics/utils/defaultCertificates'

export const TLSSimulatorTab: React.FC = () => {
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

  // Initialize default certificates on first mount
  useEffect(() => {
    if (serverConfig.certificates.certPem && serverConfig.certificates.caPem) return
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Dynamic trust store: keep client/server CA in sync with selected certs
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
      setClientConfig({ certificates: { ...clientConfig.certificates, caPem: requiredClientCa } })
    }

    const requiredServerCa = getRootCa(clientConfig.certificates.certPem)
    if (serverConfig.certificates.caPem !== requiredServerCa) {
      setServerConfig({ certificates: { ...serverConfig.certificates, caPem: requiredServerCa } })
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

      const resultStr = await openSSLService.simulateTLS(
        clientCfg,
        serverCfg,
        simFiles,
        currentCommands
      )

      try {
        const parsed = JSON.parse(resultStr) as Record<string, unknown>
        setResults({
          trace: (parsed.trace as SimulationResult['trace']) || [],
          status: (parsed.status as SimulationResult['status']) || 'success',
          error: parsed.error as string | undefined,
        })
      } catch {
        setResults({
          trace: [],
          status: 'error',
          error: resultStr.substring(0, 200) || 'Unknown WASM error',
        })
      }
    } catch (error) {
      setResults({
        trace: [],
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setIsSimulating(false)
    }
  }, [clientConfig, serverConfig, clientMessage, serverMessage, setIsSimulating, setResults])

  // Re-run when commands change (Replay trigger)
  useEffect(() => {
    if (commands.length > 0) {
      triggerSimulation()
    }
  }, [commands, triggerSimulation])

  const [isSpinning, setIsSpinning] = useState(false)
  useEffect(() => {
    setIsSpinning(isSimulating)
  }, [isSimulating])

  return (
    <div className="space-y-6 animate-fade-in">
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
          disabled={isSpinning}
          className="btn btn-primary flex items-center gap-2 px-6 py-3 text-lg"
        >
          {isSpinning ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            <Play size={20} fill="currentColor" />
          )}
          {results ? 'Run Again' : 'Start Full Interaction'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TLSClientPanel />
        <TLSServerPanel />
      </div>

      {results && (
        <TLSSummary
          events={results.trace || []}
          status={results.status === 'success' ? 'success' : 'failed'}
          mTLSEnabled={serverConfig.verifyClient ?? false}
        />
      )}

      <TLSNegotiationResults />

      <div className="mt-6">
        <TLSComparisonTable />
      </div>
    </div>
  )
}
