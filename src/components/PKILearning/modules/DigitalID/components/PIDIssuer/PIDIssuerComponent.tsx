import React, { useState } from 'react'
import { Button } from '../../../../../ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../ui/card'
import type { WalletInstance, CryptoKey, VerifiableCredential } from '../../types'
import { useDigitalIDLogs } from '../../hooks/useDigitalIDLogs'
import { generateKeyPair, signData } from '../../utils/crypto-utils'
import { createMdoc } from '../../utils/mdoc-utils'
import { Loader2, CheckCircle, Smartphone, Lock, UserCheck, CreditCard } from 'lucide-react'

interface PIDIssuerComponentProps {
  wallet: WalletInstance
  onCredentialIssued: (cred: VerifiableCredential, key: CryptoKey) => void
  onBack: () => void
}

type IssuanceStep = 'DISCOVERY' | 'AUTH' | 'KEY_GEN' | 'ISSUANCE' | 'COMPLETE'

const KeyIcon = (props: React.ComponentProps<'svg'>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="7.5" cy="15.5" r="5.5" />
    <path d="m21 2-9.6 9.6" />
    <path d="m15.5 7.5 3 3L22 7l-3-3" />
  </svg>
)

export const PIDIssuerComponent: React.FC<PIDIssuerComponentProps> = ({
  wallet,
  onCredentialIssued,
  onBack,
}) => {
  const [step, setStep] = useState<IssuanceStep>('DISCOVERY')
  const [loading, setLoading] = useState(false)
  const { logs, opensslLogs, activeLogTab, setActiveLogTab, addLog, addOpenSSLLog } =
    useDigitalIDLogs()

  const handleStart = async () => {
    setStep('AUTH')
    addLog('Starting PID Issuance Flow...')
    addLog('Discovered Issuer: https://pid-provider.motorizzazione.gov.it')
  }

  const handleAuth = async () => {
    setLoading(true)
    addLog('Requesting Authorization Code (OpenID4VCI)...')
    await new Promise((r) => setTimeout(r, 1000)) // Simulate net
    addLog('Authorization Code received. Exchanging for Access Token...')
    await new Promise((r) => setTimeout(r, 500))
    addLog('Access Token acquired.')
    setLoading(false)
    setStep('KEY_GEN')
  }

  const handleKeyGen = async () => {
    setLoading(true)
    addLog('Generating secure key pair in Wallet HSM...')

    // 1. Generate Key in "HSM"
    const key = await generateKeyPair('ES256', 'P-256', addOpenSSLLog)
    addLog(`Key Generated: ${key.id} (P-256/ES256)`)

    // 2. Proof of Possession
    const nonce = 'nonce-' + Math.random().toString(36).substring(2)
    addLog(`Creating Proof of Possession (PoP) for nonce: ${nonce}`)

    const popPayload = JSON.stringify({
      iss: 'wallet-instance',
      aud: 'https://pid-provider',
      nonce: nonce,
      cnonce: 'generated-cnonce',
    })
    const popSig = await signData(key, popPayload, addOpenSSLLog)
    addLog(`PoP Signed: ${popSig.substring(0, 20)}...`)

    setLoading(false)
    setStep('ISSUANCE')
    return key
  }

  const handleIssuance = async (key: CryptoKey) => {
    setLoading(true)
    addLog('Requesting Credential: eu.europa.ec.eudi.pid.1')

    await new Promise((r) => setTimeout(r, 1500)) // Simulate server processing

    // Create attributes from user profile
    const attributes = [
      { name: 'family_name', value: wallet.owner.legalName },
      { name: 'given_name', value: 'Maria Elena' }, // Hardcoded partial for realism per reqs
      { name: 'birth_date', value: wallet.owner.birthDate },
      { name: 'age_over_18', value: true },
      { name: 'issuing_country', value: 'ES' },
    ]

    // Mock Issuer Key
    const issuerKey = await generateKeyPair('ES256', 'P-256', addOpenSSLLog)

    // Create mDoc
    addLog('Issuer generating mdoc...')
    const mDoc = await createMdoc(attributes, issuerKey, key, undefined, addOpenSSLLog)

    const credential: VerifiableCredential = {
      id: `pid-${Date.now()}`,
      type: ['VerifiableCredential', 'PersonIdentificationData'],
      issuer: 'Motor Vehicle Authority',
      issuanceDate: new Date().toISOString(),
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      credentialSubject: attributes.reduce(
        (acc, curr) => ({ ...acc, [curr.name]: curr.value }),
        {}
      ),
      format: 'mso_mdoc',
      raw: JSON.stringify(mDoc),
    }

    addLog('Credential received and verified.')
    onCredentialIssued(credential, key)
    setLoading(false)
    setStep('COMPLETE')
  }

  const runFlow = async () => {
    await handleAuth()
    const key = await handleKeyGen()
    await handleIssuance(key)
  }

  return (
    <Card className="max-w-7xl mx-auto border-blue-200 shadow-xl">
      <CardHeader className="bg-blue-50/50">
        <CardTitle className="text-blue-700 flex items-center gap-2">
          <UserCheck className="w-6 h-6" />
          Motor Vehicle Authority (PID Issuer)
        </CardTitle>
        <CardDescription>
          Issue your digital Driver's License and PID using OpenID4VCI
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* status visualization */}
          <div className="space-y-6 lg:col-span-2">
            <div className="flex flex-col gap-4">
              <StepIndicator current={step} step="DISCOVERY" label="Discovery" icon={Smartphone} />
              <StepIndicator current={step} step="AUTH" label="Authorization" icon={Lock} />
              <StepIndicator current={step} step="KEY_GEN" label="HSM Key Gen" icon={KeyIcon} />
              <StepIndicator current={step} step="ISSUANCE" label="Issuance" icon={CreditCard} />
            </div>

            {step === 'DISCOVERY' && (
              <Button onClick={handleStart} className="w-full">
                Start Issuance Flow
              </Button>
            )}
            {step === 'AUTH' && (
              <Button onClick={runFlow} disabled={loading} className="w-full">
                {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                Proceed with Authentication
              </Button>
            )}
            {step === 'COMPLETE' && (
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <h3 className="text-lg font-bold text-green-700">Success!</h3>
                <p className="text-sm text-green-600">
                  PID has been securely stored in your Wallet.
                </p>
                <Button onClick={onBack} variant="outline" className="mt-4">
                  Return to Wallet
                </Button>
              </div>
            )}
          </div>

          {/* Logs */}
          <div className="flex flex-col h-[400px] border rounded-lg bg-slate-950 overflow-hidden lg:col-span-3">
            {/* Tabs */}
            <div className="flex items-center border-b border-slate-800 bg-slate-900">
              <button
                onClick={() => setActiveLogTab('protocol')}
                className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
                  activeLogTab === 'protocol'
                    ? 'text-blue-400 bg-slate-800 border-b-2 border-blue-500'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                PROTOCOL LOG
              </button>
              <button
                onClick={() => setActiveLogTab('openssl')}
                className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
                  activeLogTab === 'openssl'
                    ? 'text-green-400 bg-slate-800 border-b-2 border-green-500'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                OPENSSL LOG
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-slate-50">
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
                    <div key={i} className="mb-2 whitespace-pre-wrap break-all text-green-200/90">
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

interface StepIndicatorProps {
  current: IssuanceStep
  step: IssuanceStep
  label: string
  icon: React.ElementType
}

const StepIndicator = ({ current, step, label, icon: Icon }: StepIndicatorProps) => {
  const steps = ['DISCOVERY', 'AUTH', 'KEY_GEN', 'ISSUANCE', 'COMPLETE']
  const idx = steps.indexOf(step)
  const currentIdx = steps.indexOf(current)

  let status = 'pending'
  if (currentIdx > idx) status = 'completed'
  if (currentIdx === idx) status = 'active'

  const colors = {
    pending: 'text-slate-400 bg-slate-100',
    active: 'text-blue-600 bg-blue-100 border-blue-500',
    completed: 'text-green-600 bg-green-100',
  }

  return (
    <div
      className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${status === 'active' ? 'border-primary shadow-sm' : 'border-transparent'}`}
    >
      <div className={`p-2 rounded-full ${colors[status as keyof typeof colors]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p
          className={`font-medium ${status === 'pending' ? 'text-muted-foreground' : 'text-foreground'}`}
        >
          {label}
        </p>
        {status === 'active' && (
          <p className="text-xs text-blue-600 animate-pulse">Processing...</p>
        )}
      </div>
      {status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />}
    </div>
  )
}
