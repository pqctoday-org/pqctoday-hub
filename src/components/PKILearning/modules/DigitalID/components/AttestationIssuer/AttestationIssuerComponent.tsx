import React, { useState } from 'react'
import { Button } from '../../../../../ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../ui/card'
import type {
  WalletInstance,
  CryptoKey,
  VerifiableCredential,
  CredentialAttribute,
} from '../../types'
import { generateKeyPair, signData } from '../../utils/crypto-utils'
import { createSDJWT } from '../../utils/sdjwt-utils'
import { useDigitalIDLogs } from '../../hooks/useDigitalIDLogs'
import { MARIA_IDENTITY } from '../../constants'
import { Loader2, CheckCircle, GraduationCap, ShieldCheck, AlertTriangle } from 'lucide-react'

interface AttestationIssuerComponentProps {
  wallet: WalletInstance
  onCredentialIssued: (cred: VerifiableCredential, key: CryptoKey) => void
  onBack: () => void
}

type FlowStep = 'START' | 'PID_CHECK' | 'PRESENTATION' | 'VERIFICATION' | 'ISSUANCE' | 'COMPLETE'

export const AttestationIssuerComponent: React.FC<AttestationIssuerComponentProps> = ({
  wallet,
  onCredentialIssued,
  onBack,
}) => {
  const [step, setStep] = useState<FlowStep>('START')
  const [loading, setLoading] = useState(false)
  const { logs, opensslLogs, activeLogTab, setActiveLogTab, addLog, addOpenSSLLog } =
    useDigitalIDLogs()

  // Check for PID availability
  const pidCredential = wallet.credentials.find((c) => c.type.includes('PersonIdentificationData'))

  const handleStart = () => {
    setStep('PID_CHECK')
    addLog('Connecting to University Portal...')
    if (!pidCredential) {
      addLog('ERROR: No Valid PID found in wallet to verify identity.')
    } else {
      addLog('PID found. Requesting identity attribute presentation via OpenID4VP.')
    }
  }

  const handlePresentation = async () => {
    setLoading(true)
    setStep('PRESENTATION')

    // Mock VP Request: Please show "family_name" and "given_name" from PID
    addLog('University requests: [family_name, given_name] from PID.')
    await new Promise((r) => setTimeout(r, 1000))

    // Find PID Key (mocking lookup)
    const pidKey = wallet.keys[0] // Simplified assumption for education: 1st key is PID key
    if (!pidKey) {
      addLog('Error: No signing key found for PID.')
      setLoading(false)
      return
    }

    addLog('Wallet consenting to share data...')
    // In simulation, we just proceed. In real UI, user would confirm checkboxes.

    addLog('Generating VP with Key Binding...')

    // Create authentic presentation log by performing the crypto
    // We need the pidCredential to "present" but for this Attestation flow step,
    // we are simulating the "Identity Verification" so we act as if we are presenting the PID.
    // However, the helper 'createPresentation' is for SD-JWT. PID is mDoc.
    // So for this specific "PID Presentation" step, we might need to mock the log
    // OR allow the AttestationIssuer to actually verify an SD-JWT if we had one.
    // BUT the PID is mDoc.
    // If we want logs, we should sign a mock payload with the PID key to show a signature happened.

    // 1. Create a dummy challenge
    const nonce = crypto.randomUUID()

    // 2. Sign it with PID key (which we found as pidKey)
    const challengePayload = JSON.stringify({ nonce, aud: 'university' })
    await signData(pidKey, challengePayload, addOpenSSLLog) // This generates the log!

    addLog('Device binding signature verified.')
    await new Promise((r) => setTimeout(r, 500))

    addLog('VP Sent to University Verifier.')
    setLoading(false)
    setStep('VERIFICATION')
  }

  const handleIssuance = async () => {
    setLoading(true)
    addLog('Issuing Master of Science Diploma...')

    // 1. Generate Holder Key for Diploma Binding (P-384/ES384 per ARF attestation profile)
    const holderKey = await generateKeyPair('ES384', 'P-384', addOpenSSLLog)
    addLog(`Generated Holder Key for Binding: ${holderKey.id} (P-384/ES384)`)

    // 2. University (Issuer) generates SD-JWT
    const issuerKey = await generateKeyPair('ES384', 'P-384', addOpenSSLLog) // Mock issuer key

    const claims: CredentialAttribute[] = [
      { name: 'given_name', value: MARIA_IDENTITY.given_name, type: 'sd' },
      { name: 'family_name', value: MARIA_IDENTITY.family_name, type: 'sd' },
      { name: 'degree', value: 'Master of Science (Computer Science)', type: 'sd' },
      { name: 'gpa', value: 3.8, type: 'sd' },
      { name: 'honors', value: true, type: 'sd' },
    ]

    const sdJwt = await createSDJWT(
      claims,
      issuerKey,
      holderKey,
      'https://university.edu',
      'eu.europa.ec.eudi.diploma.1',
      addOpenSSLLog
    )

    const credential: VerifiableCredential = {
      id: `diploma-${Date.now()}`,
      type: ['VerifiableCredential', 'UniversityDegreeCredential'],
      issuer: 'Technical University of Madrid',
      issuanceDate: new Date().toISOString(),
      credentialSubject: {}, // In SD-JWT, claims are in the JWT/disclosures
      format: 'vc+sd-jwt',
      raw: sdJwt.raw,
    }

    addLog('Credential Issued (SD-JWT) and downloaded to Wallet.')
    onCredentialIssued(credential, holderKey)
    setLoading(false)
    setStep('COMPLETE')
  }

  return (
    <Card className="max-w-7xl mx-auto border-secondary/30 shadow-xl">
      <CardHeader className="bg-secondary/5">
        <CardTitle className="text-secondary flex items-center gap-2">
          <GraduationCap className="w-6 h-6" />
          Technical University (Attestation Issuer)
        </CardTitle>
        <CardDescription>
          Request authentic digital formatted transcripts and diplomas
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="space-y-6 lg:col-span-2">
            {/* Steps */}
            <div className="space-y-4">
              <div
                className={`p-4 rounded-lg border flex items-center gap-3 ${step === 'START' ? 'bg-secondary/10 border-secondary' : 'bg-muted/5'}`}
              >
                <div className="bg-secondary/20 p-2 rounded-full text-secondary font-bold">1</div>
                <div>Log in with European Digital Identity</div>
              </div>
              <div
                className={`p-4 rounded-lg border flex items-center gap-3 ${['PRESENTATION', 'VERIFICATION'].includes(step) ? 'bg-secondary/10 border-secondary' : 'bg-muted/5'}`}
              >
                <div className="bg-secondary/20 p-2 rounded-full text-secondary font-bold">2</div>
                <div>Verify Identity Attributes</div>
              </div>
              <div
                className={`p-4 rounded-lg border flex items-center gap-3 ${step === 'ISSUANCE' ? 'bg-secondary/10 border-secondary' : 'bg-muted/5'}`}
              >
                <div className="bg-secondary/20 p-2 rounded-full text-secondary font-bold">3</div>
                <div>Issue Diploma (SD-JWT)</div>
              </div>
            </div>

            {/* Actions */}
            {step === 'START' && (
              <Button onClick={handleStart} className="w-full">
                Login to Student Portal
              </Button>
            )}

            {step === 'PID_CHECK' &&
              (!pidCredential ? (
                <div className="bg-warning/5 p-4 rounded border border-warning/30 text-warning">
                  <h4 className="font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Identity Required
                  </h4>
                  <p className="text-sm mt-1">
                    You must have a valid National ID (PID) in your wallet to proceed with this
                    service.
                  </p>
                  <Button onClick={onBack} variant="secondary" className="mt-3 w-full">
                    Go back to get PID
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm">
                    The University requests to view your <strong>Name</strong> and{' '}
                    <strong>Nationality</strong> from your PID.
                  </p>
                  <Button onClick={handlePresentation} disabled={loading} className="w-full">
                    {loading && <Loader2 className="animate-spin mr-2" />} Share PID Data
                  </Button>
                </div>
              ))}

            {step === 'PRESENTATION' && (
              <div className="text-center py-4">
                <Loader2 className="animate-spin w-8 h-8 text-secondary mx-auto" />
                <p className="text-sm mt-2 text-muted-foreground">
                  Sending Verifiable Presentation...
                </p>
              </div>
            )}

            {step === 'VERIFICATION' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-success justify-center">
                  <ShieldCheck className="w-6 h-6" /> Identity Verified
                </div>
                <Button onClick={handleIssuance} disabled={loading} className="w-full">
                  {loading && <Loader2 className="animate-spin mr-2" />} Issue Diploma
                </Button>
              </div>
            )}

            {step === 'COMPLETE' && (
              <div className="bg-success/5 p-4 rounded border border-success/30 text-center">
                <CheckCircle className="w-12 h-12 text-success mx-auto mb-2" />
                <h3 className="font-bold text-success">Diploma Added!</h3>
                <p className="text-sm text-success mb-4">
                  You can now use your degree to prove your qualifications.
                </p>
                <Button onClick={onBack} variant="outline">
                  Return to Wallet
                </Button>
              </div>
            )}
          </div>
          {/* Logs */}
          <div className="flex flex-col h-[400px] border rounded-lg bg-card overflow-hidden lg:col-span-3">
            {/* Tabs */}
            <div className="flex items-center border-b border-border bg-muted/30">
              <button
                onClick={() => setActiveLogTab('protocol')}
                className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
                  activeLogTab === 'protocol'
                    ? 'text-secondary bg-muted/50 border-b-2 border-secondary'
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
                  {logs.map((log: string, i: number) => (
                    <div key={i} className="mb-1">
                      {log}
                    </div>
                  ))}
                  {logs.length === 0 && <span className="opacity-50">Waiting to start...</span>}
                </>
              ) : (
                <>
                  {opensslLogs.map((log: string, i: number) => (
                    <div key={i} className="mb-2 whitespace-pre-wrap break-all text-success/80">
                      {log}
                    </div>
                  ))}
                  {opensslLogs.length === 0 && (
                    <span className="opacity-50">
                      No cryptographic operations logged yet. Run the flow to see OpenSSL commands.
                    </span>
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
