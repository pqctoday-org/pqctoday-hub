// SPDX-License-Identifier: AGPL-3.0-only
import { requireSampleTrustInputs } from './utils/sampleTrust'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Play, Loader2 } from 'lucide-react'
import { useTLSStore } from '@/store/tls-learning.store'
import { useModuleStore } from '@/store/useModuleStore'
import { ModuleShell } from '@/components/PKILearning/common/ModuleShell'
import { TLSClientPanel } from './TLSClientPanel'
import { TLSServerPanel } from './TLSServerPanel'
import { TLSNegotiationResults } from './components/TLSNegotiationResults'
import { TLSComparisonTable } from './components/TLSComparisonTable'
import { TLSIntroduction } from './components/TLSIntroduction'
import { TLSExercises } from './components/TLSExercises'
import { TLSConfigGenerator } from './components/TLSConfigGenerator'
import { TLSSummary } from './components/TLSSummary'
import { TLSDowngradeScenario } from './components/TLSDowngradeScenario'
import { openSSLService } from '@/services/crypto/OpenSSLService'
import { generateOpenSSLConfig } from './utils/configGenerator'

import { useHSM, type HsmKey } from '@/hooks/useHSM'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import { HsmKeyInspector } from '@/components/shared/HsmKeyInspector'
import { hsm_importMLDSAPublicKey } from '@/wasm/softhsm'
import {
  getCertificateVerifySample,
  certificateVerifyControls,
  certificateVerifyHex,
  verifyCapturedBytes,
} from './utils/certificateVerifySample'
import { Button } from '@/components/ui/button'

const TLS_HSM_OPERATIONS = [
  'C_CreateObject',
  'C_GetAttributeValue',
  'C_MessageVerifyInit',
  'C_VerifyMessage',
  'C_MessageVerifyFinal',
]

import { useSampleTrustDefaults } from './utils/useSampleTrustDefaults'
import manifest from './manifest'

const MODULE_ID = 'tls-basics'

export const TLSBasicsModule: React.FC = () => {
  const { updateModuleProgress, markStepComplete } = useModuleStore()

  /* The TLS simulator's HSM mode (live softhsm keygen + cert-mint at session
   * start, with CertificateVerify signing through pkcs11-provider) was
   * removed: it never produced a successful handshake for end-users and the
   * "HSM ON" toggle was misleading. The C-side wiring is left in
   * tls_simulation_hsm.c (currently unreachable: no JS plumbing calls
   * tls_simulation_set_hsm_mode anymore) for a future, deliberate revival.
   * For now the workshop runs PEM-only — the bundled cert/key PEMs in
   * defaultCertificates.ts, OpenSSL native signing. That's how the
   * production build at origin/main behaves today. */

  const {
    clientConfig,
    serverConfig,
    isSimulating,
    setIsSimulating,
    runInputs,
    results,
    setResults,
    commands,
    clearSession,
    clientMessage,
    serverMessage,
  } = useTLSStore()

  // --- Cleanup on unmount ---
  useEffect(() => {
    return () => clearSession()
  }, [clearSession])

  useSampleTrustDefaults()

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
      requireSampleTrustInputs(clientConfig, serverConfig)
      markStepComplete(MODULE_ID, 'config')

      const encoder = new TextEncoder()
      const serverCertPem = serverConfig.certificates.certPem || ''
      const clientCertPem = clientConfig.certificates.certPem || ''

      const simFiles = [
        { name: 'ssl/server.crt', data: encoder.encode(serverCertPem) },
        { name: 'ssl/server.key', data: encoder.encode(serverConfig.certificates.keyPem || '') },
      ]

      const clientCaPem = clientConfig.certificates.caPem
      if (clientCaPem) {
        simFiles.push({ name: 'ssl/client-ca.crt', data: encoder.encode(clientCaPem) })
      }

      const serverCaPem = serverConfig.certificates.caPem
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
          markStepComplete(MODULE_ID, 'workshop')
          markStepComplete(MODULE_ID, 'comparison')
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

  // --- Live HSM demo — HSM-backed TLS server key operations ---
  const hsm = useHSM()
  const [hsmLines, setHsmLines] = useState<string[]>([])
  const [hsmRunning, setHsmRunning] = useState(false)
  const [hsmError, setHsmError] = useState<string | null>(null)
  const [hsmValidated, setHsmValidated] = useState(false)
  const hsmAttempt = useRef(0)
  useEffect(
    () => () => {
      hsmAttempt.current++
    },
    []
  )

  const runHsmServerDemo = useCallback(async () => {
    if (!hsm.moduleRef.current) return
    const attempt = ++hsmAttempt.current
    const current = () => attempt === hsmAttempt.current
    setHsmRunning(true)
    setHsmValidated(false)
    setHsmLines([])
    setHsmError(null)
    hsm.clearLog()

    const addLine = (line: string) => {
      if (current()) setHsmLines((prev) => [...prev, line])
    }

    try {
      const M = hsm.moduleRef.current
      const hSession = hsm.hSessionRef.current

      const sample = await getCertificateVerifySample()
      const controls = await certificateVerifyControls(sample)
      if (!current()) return
      const pubHandle = hsm_importMLDSAPublicKey(M, hSession, 65, sample.publicKey)
      hsm.registerKey(M, hSession, {
        handle: pubHandle,
        family: 'ml-dsa',
        role: 'public',
        label: 'Captured TLS leaf public key (ML-DSA-65)',
        generatedAt: new Date().toISOString(),
      })
      const wrongHandle = hsm_importMLDSAPublicKey(M, hSession, 65, controls.wrongKey)
      hsm.registerKey(M, hSession, {
        handle: wrongHandle,
        family: 'ml-dsa',
        role: 'public',
        label: 'Altered public key (negative control)',
        generatedAt: new Date().toISOString(),
      })
      addLine(
        '[Profile] Retained TLS 1.3 / TLS_AES_128_GCM_SHA256 / ML-DSA-65 server CertificateVerify'
      )
      addLine(
        `[Transcript] ClientHello + ServerHello + EncryptedExtensions + Certificate, including Handshake headers: ${sample.transcript.length} B`
      )
      addLine(`[SHA-256] ${certificateVerifyHex(sample.transcriptHash)}`)
      addLine(
        '[Signed input] 64 space bytes (0x20) + "TLS 1.3, server CertificateVerify" + 00 + transcript hash'
      )
      addLine(
        `[Complete signed input: ${sample.input.length} B] ${certificateVerifyHex(sample.input)}`
      )
      addLine(
        `[Certificate key] ML-DSA-65 raw public key: ${sample.publicKey.length} B extracted from the actual leaf SubjectPublicKeyInfo; not a 1952 B SPKI`
      )
      const verify = (input: Uint8Array, signature: Uint8Array, key = pubHandle) =>
        verifyCapturedBytes(M, hSession, key, input, signature)
      const valid = verify(sample.input, sample.signature)
      addLine(
        `[Actual verification] Captured ${sample.signature.length} B signature: ${valid ? 'VALID' : 'INVALID'}`
      )
      if (!valid) throw new Error('Captured CertificateVerify did not verify')
      for (const [label, input, signature, key] of [
        ['Changed transcript', controls.changedTranscriptInput, sample.signature, pubHandle],
        [
          'Client context instead of server',
          controls.clientContextInput,
          sample.signature,
          pubHandle,
        ],
        ['Changed signature', sample.input, controls.changedSignature, pubHandle],
        ['Truncated signature', sample.input, controls.truncatedSignature, pubHandle],
        ['Wrong public key', sample.input, sample.signature, wrongHandle],
      ] as const) {
        const accepted = verify(input, signature, key)
        addLine(`[Actual negative check] ${label}: ${accepted ? 'UNEXPECTED ACCEPT' : 'REJECTED'}`)
        if (accepted) throw new Error(`${label} was unexpectedly accepted`)
      }
      addLine(
        'Captured transcript authentication verified under its leaf key; CA trust, hostname, expiry and policy validation are separate checks. No new TLS connection was executed.'
      )
      setHsmValidated(true)
      markStepComplete(MODULE_ID, 'hsm-demo')
    } catch (e) {
      if (current()) setHsmError(e instanceof Error ? e.message : String(e))
    } finally {
      if (current()) setHsmRunning(false)
    }
  }, [hsm, markStepComplete])

  return (
    <ModuleShell
      manifest={manifest}
      title="TLS 1.3 Basics"
      description="Learn about TLS 1.3, configure handshake parameters, and explore PQC migration trade-offs."
      learn={(api) => <TLSIntroduction onNavigateToSimulate={() => api.goToWorkshop()} />}
      visual={<TLSDowngradeScenario />}
      exercises={(api) => (
        <>
          <TLSExercises onNavigateToSimulate={() => api.goToWorkshop()} />
          <div className="mt-6">
            <TLSConfigGenerator />
          </div>
        </>
      )}
      workshop={
        <>
          <div className="space-y-6">
            {/* Capabilities banner — what this simulator does and does NOT
             *  exercise today. Surfaces the gaps explicitly so users aren't
             *  misled by dropdown options whose runtime support is incomplete. */}
            <div className="glass-panel p-4 border-l-4 border-primary/50">
              <div className="text-sm font-semibold mb-2">
                What this TLS 1.3 simulator supports today
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>
                  <span className="text-status-success font-semibold">✓ Pure PQC keys</span> —
                  ML-DSA-44 / ML-DSA-65 / ML-DSA-87 server &amp; client certs (FIPS 204)
                </li>
                <li>
                  <span className="text-status-success font-semibold">✓ Hybrid KEM</span> —
                  X25519MLKEM768, SecP256r1MLKEM768, SecP384r1MLKEM1024 (TLS 1.3 key share, RFC
                  10024); pure ML-KEM-512/768/1024 groups (draft-ietf-tls-mlkem-11)
                </li>
                <li>
                  <span className="text-status-success font-semibold">✓ Classical certs</span> —
                  RSA-2048, ECDSA-P256, Ed25519 (bundled PEMs, OpenSSL native sign)
                </li>
                <li>
                  <span className="text-status-success font-semibold">✓ Pure PQC certs</span> —
                  ML-DSA-44 / ML-DSA-87 cert + key bundled, real ML-DSA CertificateVerify
                </li>
                <li>
                  <span className="text-status-warning font-semibold">
                    ⚠ Hybrid (composite) certs — not supported yet
                  </span>{' '}
                  — LAMPS composite-sig (ML-DSA + RSA-PSS / ECDSA / Ed25519) is on the roadmap. The
                  dropdown rows for composite are currently a placeholder that substitutes the
                  nearest pure ML-DSA PEM (the wire signature is ML-DSA, not composite). Provider
                  machinery for composite is built in the vendored pkcs11-provider fork
                  (composite.c) but the runtime cert-minting path is not yet wired here.
                </li>
                <li>
                  <span className="text-status-warning font-semibold">
                    ⚠ HSM-backed signing — removed
                  </span>{' '}
                  — The previous "HSM ON" toggle never produced a successful handshake for end-users
                  and was misleading. Removed pending a deliberate revival. softhsm v3 +
                  pkcs11-provider remain statically linked into openssl.wasm; the wiring just isn't
                  user-facing.
                </li>
              </ul>
            </div>

            {/* Simulation Controls */}
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
                disabled={isSimulating}
                className="btn btn-primary flex items-center gap-2 px-6 py-3 text-lg"
              >
                {isSimulating ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <Play size={20} fill="currentColor" />
                )}
                {results ? 'Run Again' : 'Start Full Interaction'}
              </Button>
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
                mTLSEnabled={(runInputs?.serverConfig ?? serverConfig).verifyClient ?? false}
              />
            )}

            {/* Detailed Results */}
            <TLSNegotiationResults />

            {/* HSM-Backed Server — Live PKCS#11 Demo */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">
                Captured TLS CertificateVerify — construct and verify
              </h3>
              <p className="text-xs text-muted-foreground">
                Reconstruct the server signed input from the retained TLS 1.3 / SHA-256 / ML-DSA-65
                sample, then verify its actual signature with the public key from its leaf
                certificate. Check changed transcript, role context, signature and key cases. This
                offline captured example is separate from the configurable live handshake above.
                CertificateVerify authenticates the transcript under the leaf key; it does not
                establish CA trust, hostname, expiry or certificate policy.
              </p>

              <LiveHSMToggle hsm={hsm} operations={TLS_HSM_OPERATIONS} />

              {hsm.isReady && (
                <div className="glass-panel p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">
                      Verify the retained server CertificateVerify
                    </p>
                    <Button
                      variant="gradient"
                      onClick={runHsmServerDemo}
                      disabled={hsmRunning}
                      className="flex max-w-full h-auto whitespace-normal items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded transition-colors disabled:opacity-50"
                    >
                      {hsmRunning ? (
                        <>
                          <Loader2 size={11} className="animate-spin" /> Running…
                        </>
                      ) : (
                        'Verify captured CertificateVerify (live WASM)'
                      )}
                    </Button>
                  </div>

                  {hsmError && (
                    <p role="alert" className="text-xs text-status-error font-mono">
                      {hsmError}
                    </p>
                  )}

                  {hsmLines.length > 0 && (
                    <div className="bg-muted/30 border border-border rounded-lg p-3 space-y-1">
                      {hsmValidated && (
                        <p role="status">All captured CertificateVerify checks passed</p>
                      )}
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
                <Button
                  variant="gradient"
                  onClick={() => {
                    markStepComplete(MODULE_ID, 'workshop')
                    updateModuleProgress(MODULE_ID, { status: 'completed' })
                  }}
                  className="px-6 py-3 min-h-[44px] font-bold rounded-lg transition-colors"
                >
                  Complete Module
                </Button>
              </div>
            )}
          </div>
          {hsm.isReady && (
            <div className="space-y-4 mt-6">
              <Pkcs11LogPanel
                log={hsm.log}
                onClear={hsm.clearLog}
                defaultOpen={true}
                title="PKCS#11 Call Log — Captured CertificateVerify Checks"
                emptyMessage="Run the captured verification example to inspect its calls."
                filterFns={TLS_HSM_OPERATIONS}
              />
              {hsm.keys.length > 0 && (
                <HsmKeyInspector
                  keys={hsm.keys}
                  moduleRef={hsm.moduleRef}
                  hSessionRef={hsm.hSessionRef}
                  onRemoveKey={(key: HsmKey) => hsm.removeKey(key.handle)}
                />
              )}
            </div>
          )}
        </>
      }
    />
  )
}
