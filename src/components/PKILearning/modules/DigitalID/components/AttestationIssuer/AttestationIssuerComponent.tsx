import React, { useState } from 'react'
import { Button } from '../../../../../ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../ui/card'
import type {
  WalletInstance,
  CryptoKey,
  VerifiableCredential,
  CredentialAttribute,
} from '../../types'
import { generateKeyPair } from '../../utils/crypto-utils'
import { createSDJWT } from '../../utils/sdjwt-utils'
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
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (msg: string) =>
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])

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
    // Note: For mDoc PID, this would be DeviceSigned mDoc. For SD-JWT PID, it's VP.
    // We simplified PID to mdoc format, so purely simulation log here if we used mdoc utils for PID.
    // But let's assume standard flow just for the logs.
    await new Promise((r) => setTimeout(r, 800))

    addLog('VP Sent to University Verifier.')
    setLoading(false)
    setStep('VERIFICATION')
  }

  const handleIssuance = async () => {
    setLoading(true)
    addLog('Issuing Bachelor of Science Diploma...')

    // 1. Generate Holder Key for Diploma Binding
    const holderKey = await generateKeyPair('ES256', 'P-256')
    addLog(`Generated Holder Key for Binding: ${holderKey.id}`)

    // 2. University (Issuer) generates SD-JWT
    const issuerKey = await generateKeyPair('ES256', 'P-256') // Mock issuer key

    const claims: CredentialAttribute[] = [
      { name: 'given_name', value: 'Maria Elena', type: 'sd' },
      { name: 'family_name', value: wallet.owner.legalName, type: 'sd' },
      { name: 'degree', value: 'Bachelor of Science (Computer Science)', type: 'sd' }, // Simplified value for type Safety
      { name: 'gpa', value: 3.8, type: 'sd' },
      { name: 'honors', value: true, type: 'sd' },
    ]

    const sdJwt = await createSDJWT(
      claims,
      issuerKey,
      holderKey,
      'https://university.edu',
      'eu.europa.ec.eudi.diploma.1'
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
    <Card className="max-w-4xl mx-auto border-purple-200 shadow-xl">
      <CardHeader className="bg-purple-50/50">
        <CardTitle className="text-purple-700 flex items-center gap-2">
          <GraduationCap className="w-6 h-6" />
          Technical University (Attestation Issuer)
        </CardTitle>
        <CardDescription>
          Request authentic digital formatted transcripts and diplomas
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            {/* Steps */}
            <div className="space-y-4">
              <div
                className={`p-4 rounded-lg border flex items-center gap-3 ${step === 'START' ? 'bg-purple-50 border-purple-500' : 'bg-slate-50'}`}
              >
                <div className="bg-purple-100 p-2 rounded-full text-purple-600 font-bold">1</div>
                <div>Log in with European Digital Identity</div>
              </div>
              <div
                className={`p-4 rounded-lg border flex items-center gap-3 ${['PRESENTATION', 'VERIFICATION'].includes(step) ? 'bg-purple-50 border-purple-500' : 'bg-slate-50'}`}
              >
                <div className="bg-purple-100 p-2 rounded-full text-purple-600 font-bold">2</div>
                <div>Verify Identity Attributes</div>
              </div>
              <div
                className={`p-4 rounded-lg border flex items-center gap-3 ${step === 'ISSUANCE' ? 'bg-purple-50 border-purple-500' : 'bg-slate-50'}`}
              >
                <div className="bg-purple-100 p-2 rounded-full text-purple-600 font-bold">3</div>
                <div>Issue Diploma (SD-JWT)</div>
              </div>
            </div>

            {/* Actions */}
            {step === 'START' && (
              <Button onClick={handleStart} className="w-full bg-purple-600 hover:bg-purple-700">
                Login to Student Portal
              </Button>
            )}

            {step === 'PID_CHECK' &&
              (!pidCredential ? (
                <div className="bg-yellow-50 p-4 rounded border border-yellow-200 text-yellow-800">
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
                <Loader2 className="animate-spin w-8 h-8 text-purple-500 mx-auto" />
                <p className="text-sm mt-2 text-muted-foreground">
                  Sending Verifiable Presentation...
                </p>
              </div>
            )}

            {step === 'VERIFICATION' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600 justify-center">
                  <ShieldCheck className="w-6 h-6" /> Identity Verified
                </div>
                <Button
                  onClick={handleIssuance}
                  disabled={loading}
                  className="w-full bg-purple-600"
                >
                  {loading && <Loader2 className="animate-spin mr-2" />} Issue Diploma
                </Button>
              </div>
            )}

            {step === 'COMPLETE' && (
              <div className="bg-green-50 p-4 rounded border border-green-200 text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <h3 className="font-bold text-green-800">Diploma Added!</h3>
                <p className="text-sm text-green-700 mb-4">
                  You can now use your degree to prove your qualifications.
                </p>
                <Button onClick={onBack} variant="outline">
                  Return to Wallet
                </Button>
              </div>
            )}
          </div>
          {/* Logs */}
          <div className="bg-slate-950 text-slate-50 p-4 rounded-lg font-mono text-xs h-[400px] overflow-y-auto">
            <div className="mb-2 text-slate-400 border-b border-slate-800 pb-2">
              Transaction Log
            </div>
            {logs.map((log: string, i: number) => (
              <div key={i} className="mb-1">
                {log}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
