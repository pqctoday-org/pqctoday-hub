// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Loader2, Play } from 'lucide-react'
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
import { WhyThisMatters } from '@/components/ui/WhyThisMatters'

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

  /* HSM mode toggle removed: it never produced a successful handshake for
   * end-users and the "HSM ON" toggle was misleading. softhsm v3 +
   * pkcs11-provider remain statically linked into openssl.wasm; the wiring
   * just isn't user-facing. */

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

      {/* Capabilities banner — what this simulator does and does NOT exercise
       *  today. Surfaces gaps explicitly so users aren't misled by dropdown
       *  options whose runtime support is incomplete. */}
      <div className="glass-panel p-4 border-l-4 border-primary/50">
        <div className="text-sm font-semibold mb-2">What this TLS 1.3 simulator supports today</div>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>
            <span className="text-status-success font-semibold">✓ Pure PQC keys</span> — ML-DSA-44 /
            ML-DSA-65 / ML-DSA-87 server &amp; client certs (FIPS 204)
          </li>
          <li>
            <span className="text-status-success font-semibold">✓ Hybrid KEM</span> —
            X25519MLKEM768, SecP256r1MLKEM768, X448MLKEM1024, SecP384r1MLKEM1024 (TLS 1.3 key share,
            IETF draft-connolly-tls-mlkem)
          </li>
          <li>
            <span className="text-status-success font-semibold">✓ Classical certs</span> — RSA-2048,
            ECDSA-P256, Ed25519 (bundled PEMs, OpenSSL native sign)
          </li>
          <li>
            <span className="text-status-success font-semibold">✓ Pure PQC certs</span> — ML-DSA-44
            / ML-DSA-87 cert + key bundled, real ML-DSA CertificateVerify
          </li>
          <li>
            <span className="text-status-warning font-semibold">
              ⚠ Hybrid (composite) certs — not supported yet
            </span>{' '}
            — LAMPS composite-sig (ML-DSA + RSA-PSS / ECDSA / Ed25519) is on the roadmap. The
            dropdown rows for composite are currently a placeholder that substitutes the nearest
            pure ML-DSA PEM (the wire signature is ML-DSA, not composite). Provider machinery for
            composite is built in the vendored pkcs11-provider fork (composite.c) but the runtime
            cert-minting path is not yet wired here.
          </li>
          <li>
            <span className="text-status-warning font-semibold">
              ⚠ HSM-backed signing — removed
            </span>{' '}
            — The previous "HSM ON" toggle never produced a successful handshake for end-users and
            was misleading. Removed pending a deliberate revival. softhsm v3 + pkcs11-provider
            remain statically linked into openssl.wasm; the wiring just isn't user-facing.
          </li>
        </ul>
      </div>

      <WhyThisMatters title="TLS 1.3 Security Model & Where PQC Applies" variant="info">
        <p>
          TLS 1.3 provides two independent security properties: <strong>authentication</strong>{' '}
          (server identity is bound to a certificate verified by the CA chain) and{' '}
          <strong>key exchange</strong> (the session key is established via an ephemeral ECDH/KEM —
          never exposed in the record). These are separate and both must be migrated independently.
        </p>
        <p>
          <strong>Replacing only the KEX group</strong> (e.g. switching from X25519 to
          X25519MLKEM768) protects against harvest-now-decrypt-later attacks on the session content.
          But if the server certificate is still signed by a classical RSA/ECDSA CA, a future
          quantum adversary can forge that certificate and impersonate the server — defeating
          authentication entirely.
        </p>
        <p>
          A complete migration requires both: a <strong>hybrid or pure-PQC certificate</strong>{' '}
          (ML-DSA in the cert chain) <em>and</em> a <strong>hybrid KEM group</strong> in the key
          share. The &quot;Hybrid (composite) certs&quot; capability above is on the roadmap
          precisely because half-migration is not sufficient for long-term security.
        </p>
      </WhyThisMatters>

      <div className="flex justify-end gap-3">
        {results && (
          <Button
            variant="ghost"
            onClick={() => {
              setResults(null)
              clearSession()
            }}
            className="flex items-center gap-2 px-4 py-3"
          >
            Reset
          </Button>
        )}
        <Button
          variant="gradient"
          onClick={triggerSimulation}
          disabled={isSpinning}
          className="flex items-center gap-2 px-6 py-3 text-lg"
        >
          {isSpinning ? (
            <Loader2 size={20} className="animate-spin" aria-hidden="true" />
          ) : (
            <Play size={20} fill="currentColor" aria-hidden="true" />
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
