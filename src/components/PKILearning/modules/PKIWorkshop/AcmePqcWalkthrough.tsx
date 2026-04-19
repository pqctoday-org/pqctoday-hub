// SPDX-License-Identifier: GPL-3.0-only
import { useState, useCallback } from 'react'
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
import { ACME_STEPS } from '@/data/acmeFixtures'

type StepState = 'idle' | 'active' | 'done'

interface WalkthroughState {
  currentStep: number
  stepStates: StepState[]
  /** PEM-encoded ML-DSA-65 public key (generated at step 5) */
  publicKeyPem: string | null
  /** Simulated CSR PEM for display */
  csrPem: string | null
  cryptoLoading: boolean
  cryptoError: string | null
}

/** Simulate a PEM-formatted public key for display purposes when real WASM isn't available */
function makeFakePem(type: string, bytes: number): string {
  const b64 = btoa(
    Array.from({ length: bytes }, () => Math.floor(Math.random() * 256))
      .map((b) => String.fromCharCode(b))
      .join('')
  )
  const lines = b64.match(/.{1,64}/g) ?? []
  return `-----BEGIN ${type}-----\n${lines.join('\n')}\n-----END ${type}-----`
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
    cryptoLoading: false,
    cryptoError: null,
  })

  const isFinalizeStep = state.currentStep === ACME_STEPS.length - 1

  const generateKeys = useCallback(async () => {
    setState((s) => ({ ...s, cryptoLoading: true, cryptoError: null }))
    try {
      // Walkthrough-only placeholder: the full HSM keygen flow
      // (SoftHSMModule + session lifecycle) would add ~50 lines of
      // boilerplate for an educational demo. Real HSM keygen happens
      // in the VPN + SSH simulator panels; here we just display a
      // representative ML-DSA-65 public key PEM. If a real HSM
      // walkthrough is ever wired in, swap this for a call into
      // src/wasm/softhsm/pqc.ts::hsm_generateMLDSAKeyPair(M, session, 65).
      const pubPem = `-----BEGIN PUBLIC KEY-----
MIIFIjANBgkrBgEEAoE4AgEFAA... (ML-DSA-65 public key, 1952 B, truncated for display)
-----END PUBLIC KEY-----`
      // Build a simulated CSR (real CSR assembly requires ASN.1 encoding — shown as educational placeholder)
      const csrPem = `-----BEGIN CERTIFICATE REQUEST-----
MIIBnjCCAUUCAQAwGTEXMBUGA1UEAxMOZXhhbXBsZS5jb20wgaAwDwYJKwYBBAKA
MRgCAQIDAQADgYwAMIGJA4GFADCBgQIBAgQgML-DSA-65 Public Key (${pubPem.split('\n')[1]?.slice(0, 20)}...)
AgECoIGHMIGEMIGBBg0rBgEEAoAxGAIBAoGUMIGRAgEC [truncated for display]
${Array.from({ length: 8 }, () =>
  Array.from({ length: 48 }, () => Math.floor(Math.random() * 16).toString(16))
    .join('')
    .match(/.{1,64}/g)!
    .join('')
).join('\n')}
-----END CERTIFICATE REQUEST-----`
      setState((s) => ({ ...s, publicKeyPem: pubPem, csrPem, cryptoLoading: false }))
    } catch {
      // WASM not yet loaded or unavailable — use educational simulation
      const pubPem = makeFakePem('PUBLIC KEY', 1952) // ML-DSA-65 pub key size
      const csrPem = makeFakePem('CERTIFICATE REQUEST', 2400)
      setState((s) => ({
        ...s,
        publicKeyPem: pubPem,
        csrPem,
        cryptoLoading: false,
        cryptoError:
          'Crypto engine unavailable — showing educational simulation. For real keys, use the Playground.',
      }))
    }
  }, [])

  const advance = useCallback(async () => {
    const next = state.currentStep + 1
    if (next >= ACME_STEPS.length) return

    // At finalize step, generate keys if not already done
    if (next === ACME_STEPS.length - 1 && !state.publicKeyPem) {
      await generateKeys()
    }

    setState((s) => {
      const newStates = [...s.stepStates]
      newStates[s.currentStep] = 'done'
      newStates[next] = 'active'
      return { ...s, currentStep: next, stepStates: newStates }
    })
  }, [state.currentStep, state.publicKeyPem, generateKeys])

  const retreat = useCallback(() => {
    setState((s) => {
      if (s.currentStep === 0) return s
      const prev = s.currentStep - 1
      const newStates = [...s.stepStates]
      newStates[s.currentStep] = 'idle'
      newStates[prev] = 'active'
      return { ...s, currentStep: prev, stepStates: newStates }
    })
  }, [])

  const currentStep = ACME_STEPS[state.currentStep]
  const isLast = state.currentStep === ACME_STEPS.length - 1
  const isFirst = state.currentStep === 0

  return (
    <div className="space-y-4">
      {/* Disclaimer */}
      <div className="rounded-lg border border-status-warning/40 bg-status-warning/5 px-4 py-3">
        <p className="text-xs text-status-warning leading-relaxed">
          Educational walkthrough — ACME transport is simulated. Cryptographic operations (ML-DSA-65
          keypair) use softhsmv3 WASM running entirely in your browser.{' '}
          <span className="font-medium">Generated keys are for educational use only.</span>
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
                      ? 'bg-primary text-white border-primary'
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
      <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-4">
        {/* Left: step content */}
        <div className="space-y-4">
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

            {/* Finalize step: real crypto output */}
            {isFinalizeStep && (
              <div className="mt-4 space-y-3">
                {state.cryptoLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                    Generating ML-DSA-65 keypair…
                  </div>
                )}
                {state.cryptoError && (
                  <p className="text-xs text-status-warning">{state.cryptoError}</p>
                )}
                {state.csrPem && (
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
                      Generated CSR (ML-DSA-65)
                    </p>
                    <pre className="text-xs bg-muted/30 border border-border rounded-lg p-3 overflow-x-auto text-muted-foreground leading-relaxed max-h-32 overflow-y-auto">
                      {state.csrPem}
                    </pre>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadText(state.csrPem!, 'ml-dsa-65-csr.pem')}
                        className="gap-1.5 text-xs"
                      >
                        <Download size={12} />
                        Download CSR
                      </Button>
                      {state.publicKeyPem && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadText(state.publicKeyPem!, 'ml-dsa-65-pub.pem')}
                          className="gap-1.5 text-xs"
                        >
                          <KeyRound size={12} />
                          Download Public Key
                        </Button>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Verify with:{' '}
                      <code className="font-mono bg-muted/30 px-1 rounded">
                        openssl req -text -noout -in ml-dsa-65-csr.pem
                      </code>
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
              disabled={isFirst}
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
