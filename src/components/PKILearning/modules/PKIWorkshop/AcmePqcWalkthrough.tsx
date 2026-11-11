// SPDX-License-Identifier: AGPL-3.0-only
import { useState, useCallback, useEffect, useRef } from 'react'
import {
  ChevronRight,
  ChevronLeft,
  KeyRound,
  Download,
  BookOpen,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ErrorAlert } from '@/components/ui/error-alert'
import { generateAcmeSampleArtifacts } from './acmeSampleArtifacts'
import { ACME_STEPS } from '@/data/acmeFixtures'
import {
  ACME_SAMPLE_ACCOUNT_CHALLENGE,
  ACME_SAMPLE_ACCOUNT_JWK,
  ACME_SAMPLE_CHALLENGE_TOKEN,
} from './acmeAccountThumbprint'

type StepState = 'idle' | 'active' | 'done'

interface WalkthroughState {
  currentStep: number
  stepStates: StepState[]
  /** Complete public SPKI from this sample run. */
  publicKeyPem: string | null
  /** Complete self-verified PKCS#10 request from the same sample key. */
  csrPem: string | null
  csrDerBase64Url: string | null
  cryptoLoading: boolean
  cryptoError: string | null
}

function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function AcmePqcWalkthrough() {
  const [state, setState] = useState<WalkthroughState>({
    currentStep: 0,
    stepStates: ACME_STEPS.map((_, i) => (i === 0 ? 'active' : 'idle')),
    publicKeyPem: null,
    csrPem: null,
    csrDerBase64Url: null,
    cryptoLoading: false,
    cryptoError: null,
  })

  const isFinalizeStep = state.currentStep === ACME_STEPS.length - 1

  const generationRef = useRef(0)
  const runningRef = useRef(false)
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      generationRef.current += 1
    }
  }, [])

  const generateKeys = useCallback(async () => {
    if (runningRef.current) return
    runningRef.current = true
    const generation = ++generationRef.current
    const isCurrent = () => mountedRef.current && generationRef.current === generation
    setState((s) => ({
      ...s,
      cryptoLoading: true,
      cryptoError: null,
      publicKeyPem: null,
      csrPem: null,
      csrDerBase64Url: null,
    }))
    try {
      const artifacts = await generateAcmeSampleArtifacts(isCurrent)
      if (!isCurrent()) return
      setState((s) => ({
        ...s,
        publicKeyPem: artifacts.publicKeyPem,
        csrPem: artifacts.csrPem,
        csrDerBase64Url: artifacts.csrDerBase64Url,
      }))
    } catch (error) {
      if (!isCurrent()) return
      setState((s) => ({
        ...s,
        cryptoError: error instanceof Error ? error.message : 'Sample artifact generation failed.',
      }))
    } finally {
      runningRef.current = false
      if (isCurrent()) setState((s) => ({ ...s, cryptoLoading: false }))
    }
  }, [])

  const advance = useCallback(() => {
    if (runningRef.current) return
    const next = state.currentStep + 1
    if (next >= ACME_STEPS.length) return
    setState((s) => {
      const newStates = [...s.stepStates]
      newStates[s.currentStep] = 'done'
      newStates[next] = 'active'
      return { ...s, currentStep: next, stepStates: newStates }
    })
    if (next === ACME_STEPS.length - 1 && !state.csrPem) void generateKeys()
  }, [state.currentStep, state.csrPem, generateKeys])

  const retreat = useCallback(() => {
    if (runningRef.current) return
    setState((s) => {
      if (s.currentStep === 0) return s
      const prev = s.currentStep - 1
      const newStates = [...s.stepStates]
      newStates[s.currentStep] = 'idle'
      newStates[prev] = 'active'
      return { ...s, currentStep: prev, stepStates: newStates }
    })
  }, [])

  const originalStep = ACME_STEPS[state.currentStep]
  const currentStep = isFinalizeStep
    ? {
        ...originalStep,
        description:
          'Generate a real ML-DSA-65 software sample key and a matching, self-verified PKCS#10 request for example.com. ACME submission and certificate issuance remain simulated.',
        mockRequest: originalStep.mockRequest
          ? {
              ...originalStep.mockRequest,
              body: {
                ...originalStep.mockRequest.body,
                csr: state.csrDerBase64Url ?? '<sample CSR not generated yet>',
              },
            }
          : undefined,
      }
    : originalStep
  const isLast = state.currentStep === ACME_STEPS.length - 1
  const isFirst = state.currentStep === 0

  return (
    <div className="space-y-4">
      {/* Disclaimer */}
      <div className="rounded-lg border border-status-warning/40 bg-status-warning/5 px-4 py-3">
        <p className="text-xs text-status-warning leading-relaxed">
          ACME transport, account requests, challenges and CA responses are simulated. Step 5
          generates a real ML-DSA-65 software sample key, its public SPKI and a matching CSR using
          OpenSSL in this browser. No ACME request is sent and no certificate is issued.
        </p>
      </div>

      {/* Step progress rail */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {ACME_STEPS.map((step, i) => {
          const st = state.stepStates[i]
          return (
            <div key={step.id} className="flex items-center gap-1 shrink-0">
              <div
                className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold border transition-colors ${
                  st === 'done'
                    ? 'bg-primary/20 text-primary border-primary/40'
                    : st === 'active'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/30 text-muted-foreground border-border'
                }`}
              >
                {st === 'done' ? <CheckCircle2 size={12} /> : i + 1}
              </div>
              {i < ACME_STEPS.length - 1 && (
                <div className={`w-6 h-px ${st === 'done' ? 'bg-primary/40' : 'bg-border'}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Main layout: step content + sidebar */}
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_260px] gap-4">
        {/* Left: step content */}
        <div className="min-w-0 space-y-4">
          <div className="glass-panel p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h2 className="text-base font-bold text-foreground">{currentStep.title}</h2>
              <span className="text-[10px] font-mono text-muted-foreground shrink-0 mt-0.5">
                {currentStep.rfc}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {currentStep.description}
            </p>

            {currentStep.id === 'challenge' && (
              <section
                aria-label="Account JWK thumbprint calculation"
                className="space-y-3 mb-4 min-w-0"
              >
                <h3 className="text-sm font-bold">Calculated sample key authorization</h3>
                <p className="text-xs text-muted-foreground">
                  This public RFC 9964 Appendix A.1 account test key is distinct from the Step 5
                  certificate-request key. The canonicalization and SHA-256 calculation below run
                  locally. The fixed public token encodes 16 bytes; it does not demonstrate entropy.
                  A real CA token must be unpredictable with at least 128 bits of entropy (RFC 8555
                  §8.3). Account JWS, HTTP transport and CA challenge validation remain simulated.
                </p>
                {[
                  ['Public account JWK', JSON.stringify(ACME_SAMPLE_ACCOUNT_JWK, null, 2)],
                  [
                    'Canonical required-member JSON (UTF-8 hash input)',
                    ACME_SAMPLE_ACCOUNT_CHALLENGE.canonicalJson,
                  ],
                  [
                    'SHA-256 JWK thumbprint (base64url, no padding)',
                    ACME_SAMPLE_ACCOUNT_CHALLENGE.thumbprint,
                  ],
                  ['Simulated challenge token', ACME_SAMPLE_CHALLENGE_TOKEN],
                  ['HTTP-01 key authorization', ACME_SAMPLE_ACCOUNT_CHALLENGE.keyAuthorization],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs font-semibold mb-1">{label}</p>
                    <pre
                      aria-label={label}
                      className="text-xs bg-muted/30 border border-border rounded-lg p-3 overflow-x-auto max-h-32 overflow-y-auto"
                    >
                      {value}
                    </pre>
                  </div>
                ))}
              </section>
            )}

            {/* Mock request */}
            {currentStep.mockRequest && (
              <div className="mb-3">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
                  HTTP Request (simulated)
                </p>
                <pre className="text-xs bg-muted/30 border border-border rounded-lg p-3 overflow-x-auto text-muted-foreground leading-relaxed">
                  <span className="text-primary font-bold">{currentStep.mockRequest.method}</span>{' '}
                  {currentStep.mockRequest.url}
                  {currentStep.mockRequest.body && (
                    <>
                      {'\n\n'}
                      {JSON.stringify(currentStep.mockRequest.body, null, 2)}
                    </>
                  )}
                </pre>
              </div>
            )}

            {/* Mock response */}
            {currentStep.mockResponse && (
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
                  HTTP Response (simulated)
                </p>
                <pre className="text-xs bg-muted/30 border border-border rounded-lg p-3 overflow-x-auto text-muted-foreground leading-relaxed">
                  <span
                    className={`font-bold ${currentStep.mockResponse.status < 300 ? 'text-status-success' : 'text-status-error'}`}
                  >
                    {currentStep.mockResponse.status}
                  </span>
                  {'\n'}
                  {JSON.stringify(currentStep.mockResponse.body, null, 2)}
                </pre>
              </div>
            )}

            {/* Finalize step: actual public sample artifacts */}
            {isFinalizeStep && (
              <div className="mt-4 space-y-3">
                {state.cryptoLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                    Generating and checking the sample CSR and public key…
                  </div>
                )}
                {state.cryptoError && (
                  <ErrorAlert message={state.cryptoError} onRetry={() => void generateKeys()} />
                )}
                {state.csrPem && (
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
                      Sample CSR — self-signature verified; public key matched
                    </p>
                    <pre className="text-xs bg-muted/30 border border-border rounded-lg p-3 overflow-x-auto text-muted-foreground leading-relaxed max-h-32 overflow-y-auto">
                      {state.csrPem}
                    </pre>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadText(state.csrPem!, 'ml-dsa-65-sample.csr.pem')}
                        className="gap-1.5 text-xs h-auto whitespace-normal text-left max-w-full py-2"
                      >
                        <Download size={12} />
                        Download sample CSR (.pem)
                      </Button>
                      {state.publicKeyPem && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            downloadText(state.publicKeyPem!, 'ml-dsa-65-sample-public-key.pem')
                          }
                          className="gap-1.5 text-xs h-auto whitespace-normal text-left max-w-full py-2"
                        >
                          <KeyRound size={12} />
                          Download matching public key (.pem)
                        </Button>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      The CSR signature was checked and its embedded public key matches this run’s
                      exported SPKI. These public sample artifacts do not establish domain control,
                      CA acceptance or a deployed certificate. No private key is downloaded.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={retreat}
              disabled={isFirst || state.cryptoLoading}
              className="gap-1.5"
            >
              <ChevronLeft size={14} />
              Back
            </Button>
            {!isLast ? (
              <Button
                variant="gradient"
                size="sm"
                onClick={advance}
                disabled={state.cryptoLoading}
                className="gap-1.5"
              >
                Next step
                <ChevronRight size={14} />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                disabled
                className="gap-1.5 text-status-success border-status-success/30"
              >
                <CheckCircle2 size={14} />
                Complete
              </Button>
            )}
          </div>
        </div>

        {/* Right: educational sidebar */}
        <div className="glass-panel p-4 h-fit">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={14} className="text-primary" aria-hidden="true" />
            <p className="text-xs font-semibold text-foreground">About This Step</p>
          </div>
          <ul className="space-y-2">
            {currentStep.sidebarLines.map((line, i) => (
              <li key={i} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">{line}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
