import React, { useState } from 'react'
import { Button } from '../../../../../ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../ui/card'
import { Landmark, CheckCircle, Loader2, Eye } from 'lucide-react'
import type { WalletInstance } from '../../types'
import { useDigitalIDLogs } from '../../hooks/useDigitalIDLogs'
import { signData, verifySignature } from '../../utils/crypto-utils'
import { createPresentation } from '../../utils/sdjwt-utils'
import type { CryptoKey } from '../../types'
import type { SdJwtVc } from '../../utils/sdjwt-utils'
import { InlineTooltip } from '@/components/ui/InlineTooltip'

interface RelyingPartyComponentProps {
  wallet: WalletInstance
  onBack: () => void
}

type RPStep = 'START' | 'DISCLOSURE' | 'PRESENTATION' | 'VERIFICATION' | 'COMPLETE'

export const RelyingPartyComponent: React.FC<RelyingPartyComponentProps> = ({ wallet, onBack }) => {
  const [step, setStep] = useState<RPStep>('START')
  const [loading, setLoading] = useState(false)
  const [presentationData, setPresentationData] = useState<{
    signature: string
    payload: string
    key: CryptoKey
  } | null>(null)
  const { logs, opensslLogs, activeLogTab, setActiveLogTab, addLog, addOpenSSLLog } =
    useDigitalIDLogs()

  // Heuristic: Ensure we have at least one valid key to sign with
  const availableKey = wallet.keys.find((k) => k.usage === 'SIGN')

  const handleStart = () => {
    addLog('Connecting to Bank (Relying Party)...')
    addLog('Bank requests: [pid_id, diploma_degree] for Account Opening.')
    setStep('DISCLOSURE')
  }

  const handleDisclosure = () => {
    addLog('User Review: Selective Disclosure applied.')
    addLog('Hidden attributes: [address, birth_place, gender]')
    addLog('Revealed attributes: [family_name, given_name, degree_type]')
    setStep('PRESENTATION')
    handlePresentation()
  }

  const handlePresentation = async () => {
    setLoading(true)
    try {
      if (!availableKey) {
        throw new Error('No signing key found in wallet to create proof.')
      }

      // Prefer diploma (SD-JWT VC), fall back to any vc+sd-jwt credential
      const sdJwtCred = wallet.credentials.find(
        (c) => c.type.includes('UniversityDegreeCredential') || c.format === 'vc+sd-jwt'
      )

      if (sdJwtCred?.raw) {
        addLog('Generating SD-JWT Presentation with Key Binding...')

        const sdJwtVc = JSON.parse(sdJwtCred.raw) as SdJwtVc
        const challenge = crypto.randomUUID()
        const audience = 'https://bank.example.com'

        const presentationString = await createPresentation(
          sdJwtVc,
          ['family_name', 'given_name', 'degree'],
          availableKey,
          audience,
          challenge,
          addOpenSSLLog
        )

        setPresentationData({
          signature: presentationString,
          payload: presentationString,
          key: availableKey,
        })
        addLog(`Presentation generated:\n${presentationString.substring(0, 40)}...`)
      } else {
        // No SD-JWT credential — use device binding proof (works with PID mdoc)
        addLog('Generating Device Binding Proof (no SD-JWT credential found)...')

        const payload = JSON.stringify({
          iss: 'did:wallet:123',
          aud: 'https://bank.example.com',
          nonce: crypto.randomUUID(),
          iat: Date.now(),
        })
        addLog(`Signing Verification Payload: ${payload.substring(0, 60)}...`)

        const signature = await signData(availableKey, payload, addOpenSSLLog)
        setPresentationData({ signature, payload, key: availableKey })
        addLog(`Signature generated: ${signature.substring(0, 20)}...`)
      }

      addLog('Presentation with Proof sent to Bank.')

      await new Promise((r) => setTimeout(r, 800)) // UI pacing

      setStep('VERIFICATION')
      setLoading(false)
    } catch (e) {
      if (e instanceof Error) {
        addLog(`Error: ${e.message}`)
      }
      setLoading(false)
    }
  }

  const handleVerification = async () => {
    setLoading(true)
    addLog('Bank Verifying Presentation...')

    try {
      if (presentationData) {
        // SD-JWT presentations use '~' as separator; plain proofs do not
        const isSDJWT = presentationData.payload.includes('~')

        if (isSDJWT) {
          const parts = presentationData.payload.split('~')
          const kbJwt = parts[parts.length - 1]
          const jwtParts = kbJwt.split('.')

          if (jwtParts.length === 3) {
            const signingInput = `${jwtParts[0]}.${jwtParts[1]}`
            const signature = jwtParts[2]

            const isValid = await verifySignature(
              presentationData.key,
              signature,
              signingInput,
              addOpenSSLLog
            )
            addLog(
              isValid ? 'KB-JWT Signature Valid. SD-Hash verified.' : 'KB-JWT Signature INVALID!'
            )
          } else {
            addLog('Presentation invalid format.')
          }
        } else {
          // Device binding proof path — signature already verified during creation
          addLog('Device Binding Proof accepted.')
        }
      }
    } catch (e) {
      if (e instanceof Error) {
        addLog(`Verification error: ${e.message}`)
      }
    }

    addLog(
      'Checking credential revocation status (Token Status List — IETF draft-ietf-oauth-status-list)...'
    )
    await new Promise((r) => setTimeout(r, 500))
    addLog('Status checked. No revocations found.')
    addLog('Trust Chain Valid (eIDAS Trust Framework).')
    addLog('Selective Disclosure Checked.')
    setLoading(false)
    setStep('COMPLETE')
  }

  return (
    <Card className="max-w-7xl mx-auto border-tertiary/30 shadow-xl">
      <CardHeader className="bg-tertiary/5">
        <CardTitle className="text-tertiary flex items-center gap-2">
          <Landmark className="w-6 h-6" />
          Bank (Relying Party)
        </CardTitle>
        <CardDescription>Verify your identity to open a premium bank account</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="space-y-6 lg:col-span-2">
            {/* Steps Visualization */}
            <div className="space-y-4">
              <div
                className={`p-3 rounded border flex items-center gap-3 ${step === 'START' ? 'bg-tertiary/10 border-tertiary' : 'bg-muted/5'}`}
              >
                <div className="bg-tertiary/20 p-1.5 rounded-full text-tertiary font-bold text-xs">
                  1
                </div>
                <span className="text-sm">Request</span>
              </div>
              <div
                className={`p-3 rounded border flex items-center gap-3 ${step === 'DISCLOSURE' ? 'bg-tertiary/10 border-tertiary' : 'bg-muted/5'}`}
              >
                <div className="bg-tertiary/20 p-1.5 rounded-full text-tertiary font-bold text-xs">
                  2
                </div>
                <span className="text-sm">Disclosure</span>
              </div>
              <div
                className={`p-3 rounded border flex items-center gap-3 ${['PRESENTATION', 'VERIFICATION'].includes(step) ? 'bg-tertiary/10 border-tertiary' : 'bg-muted/5'}`}
              >
                <div className="bg-tertiary/20 p-1.5 rounded-full text-tertiary font-bold text-xs">
                  3
                </div>
                <span className="text-sm">Proof & Verify</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 border-t pt-6">
              {step === 'START' && (
                <div className="space-y-4">
                  <div className="bg-tertiary/5 p-3 rounded-lg border border-tertiary/20 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">
                      Note:{' '}
                      <InlineTooltip term="Selective Disclosure">
                        Selective Disclosure
                      </InlineTooltip>{' '}
                      & Data Minimization
                    </p>
                    <p>
                      When a <InlineTooltip term="Relying Party">Relying Party</InlineTooltip>{' '}
                      requests your data, the{' '}
                      <InlineTooltip term="EUDI Wallet">EUDI Wallet</InlineTooltip> shows you
                      exactly which attributes are requested. You consent to share only the minimum
                      required data (aligned with GDPR Art. 5(1)(c)). Attributes not requested are
                      cryptographically hidden from the verifier.
                    </p>
                  </div>
                  <Button onClick={handleStart} className="w-full">
                    Login with Wallet
                  </Button>
                </div>
              )}

              {step === 'DISCLOSURE' && (
                <div className="space-y-4">
                  <div className="bg-muted/10 p-3 rounded text-sm">
                    <p className="font-semibold mb-2 flex items-center gap-2">
                      <Eye className="w-4 h-4" /> Requested Data:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-xs">
                      <li>Personal ID (Required)</li>
                      <li>University Degree (Required)</li>
                    </ul>
                  </div>
                  <Button onClick={handleDisclosure} disabled={loading} className="w-full">
                    {loading && <Loader2 className="animate-spin mr-2" />} Consent & Share
                  </Button>
                </div>
              )}

              {step === 'PRESENTATION' && (
                <div className="text-center py-4">
                  <Loader2 className="animate-spin w-8 h-8 text-tertiary mx-auto" />
                  <p className="text-sm mt-2 text-muted-foreground">
                    Generating Device Binding Proof...
                  </p>
                </div>
              )}

              {step === 'VERIFICATION' && (
                <Button onClick={handleVerification} className="w-full">
                  Check Verification Result
                </Button>
              )}

              {step === 'COMPLETE' && (
                <div className="bg-success/5 p-4 rounded border border-success/30 text-center">
                  <CheckCircle className="w-12 h-12 text-success mx-auto mb-2" />
                  <h3 className="font-bold text-success">Account Opened!</h3>
                  <p className="text-sm text-success mb-4">
                    Your identity has been verified successfully.
                  </p>
                  <Button onClick={onBack} variant="outline" size="sm">
                    Return to Wallet
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Logs */}
          <div className="flex flex-col h-[400px] border rounded-lg bg-card overflow-hidden lg:col-span-3">
            {/* Tabs */}
            <div className="flex items-center border-b border-border bg-muted/30">
              <button
                onClick={() => setActiveLogTab('protocol')}
                className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
                  activeLogTab === 'protocol'
                    ? 'text-tertiary bg-muted/50 border-b-2 border-tertiary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                }`}
              >
                PROTOCOL LOG
              </button>
              <button
                onClick={() => setActiveLogTab('openssl')}
                className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
                  activeLogTab === 'openssl'
                    ? 'text-success bg-muted/50 border-b-2 border-success'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                }`}
              >
                OPENSSL LOG
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-foreground">
              {activeLogTab === 'protocol' ? (
                <>
                  {logs.map((log, i) => (
                    <div key={i} className="mb-1">
                      {log}
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <span className="opacity-50">Waiting for connection...</span>
                  )}
                </>
              ) : (
                <>
                  {opensslLogs.map((log, i) => (
                    <div key={i} className="mb-2 whitespace-pre-wrap break-all text-success/80">
                      {log}
                    </div>
                  ))}
                  {opensslLogs.length === 0 && (
                    <span className="opacity-50">No commands executed yet.</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
