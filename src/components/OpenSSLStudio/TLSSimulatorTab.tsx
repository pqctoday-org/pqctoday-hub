// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Play, ShieldCheck } from 'lucide-react'
import { clsx } from 'clsx'
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
import { Button } from '@/components/ui/button'

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

  // HSM mode: when enabled, the next handshake uses softhsmv3 (statically
  // linked into openssl.wasm via pkcs11-provider) to hold the server private
  // key. CertificateVerify routes through C_SignInit + C_SignMessage.
  const [hsmMode, setHsmMode] = useState<boolean>(false)

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
        currentCommands,
        { hsmMode }
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
  }, [
    clientConfig,
    serverConfig,
    clientMessage,
    serverMessage,
    setIsSimulating,
    setResults,
    hsmMode,
  ])

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
      {/* Citation chips + Learn cross-link */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: 'RFC 8446', href: 'https://www.rfc-editor.org/rfc/rfc8446', title: 'TLS 1.3' },
            {
              label: 'FIPS 203',
              href: 'https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.203.pdf',
              title: 'ML-KEM',
            },
            {
              label: 'FIPS 204',
              href: 'https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.204.pdf',
              title: 'ML-DSA',
            },
            {
              label: 'FIPS 205',
              href: 'https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.205.pdf',
              title: 'SLH-DSA',
            },
            {
              label: 'draft-ietf-tls-hybrid-design-16',
              href: 'https://datatracker.ietf.org/doc/draft-ietf-tls-hybrid-design/16/',
              title: 'Hybrid KEX in TLS 1.3',
            },
            {
              label: 'draft-ietf-tls-mlkem-07',
              href: 'https://datatracker.ietf.org/doc/draft-ietf-tls-mlkem/07/',
              title: 'ML-KEM Key Agreement for TLS 1.3',
            },
            {
              label: 'draft-ietf-tls-mldsa-02',
              href: 'https://datatracker.ietf.org/doc/draft-ietf-tls-mldsa/02/',
              title: 'ML-DSA for TLS 1.3',
            },
            {
              label: 'BSI TR-02102-2',
              href: 'https://www.bsi.bund.de/SharedDocs/Downloads/EN/BSI/Publications/TechGuidelines/TG02102/BSI-TR-02102-2.html',
              title: 'BSI TLS recommendations',
            },
          ].map((cite) => (
            <a
              key={cite.label}
              href={cite.href}
              target="_blank"
              rel="noopener noreferrer"
              title={cite.title}
              className="text-[10px] px-2 py-0.5 rounded border border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors flex items-center gap-1"
            >
              {cite.label}
              <ExternalLink size={9} className="opacity-50" />
            </a>
          ))}
        </div>
        <Link
          to="/learn/tls-basics"
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          Open in Learn for HSM-backed keys, exercises, and Apache/nginx/HAProxy/Caddy snippets →
        </Link>
      </div>

      {/* Live HSM toggle. When ON, the server's ML-DSA-65 private key is
       *  generated inside softhsmv3 (statically linked into openssl.wasm) and
       *  the CertificateVerify sign call routes through pkcs11-provider →
       *  C_SignInit + C_SignMessage. */}
      <div
        className={clsx(
          'glass-panel p-4 flex items-center justify-between gap-3',
          hsmMode && 'border-success/40'
        )}
      >
        <div className="flex items-start gap-3">
          <ShieldCheck
            size={20}
            className={clsx('mt-0.5', hsmMode ? 'text-success' : 'text-muted-foreground')}
          />
          <div>
            <div className="text-sm font-semibold">
              Live HSM Mode (softhsmv3 + pkcs11-provider, statically linked into openssl.wasm)
            </div>
            <p className="text-xs text-muted-foreground">
              {hsmMode
                ? 'Next run: server private key generated inside softhsmv3; CertificateVerify routes through PKCS#11 (C_SignInit + C_SignMessage). Private key never leaves the simulated HSM.'
                : 'OFF: handshake uses bundled PEM keys (the default). Toggle ON to demonstrate HSM-resident server key signing.'}
            </p>
          </div>
        </div>
        <Button
          variant={hsmMode ? 'gradient' : 'outline'}
          onClick={() => setHsmMode((v) => !v)}
          disabled={isSpinning}
          className="px-4 py-2 text-xs font-bold whitespace-nowrap"
          aria-pressed={hsmMode}
        >
          {hsmMode ? 'HSM ON' : 'HSM OFF'}
        </Button>
      </div>

      <div className="flex justify-end gap-3">
        {results && (
          <Button
            variant="ghost"
            onClick={() => {
              setResults(null)
              clearSession()
            }}
            className="btn btn-secondary flex items-center gap-2 px-4 py-3"
          >
            Reset
          </Button>
        )}
        <Button
          variant="ghost"
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
        </Button>
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
