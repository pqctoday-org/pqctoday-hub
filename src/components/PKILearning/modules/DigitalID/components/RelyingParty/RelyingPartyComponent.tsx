import React, { useState } from 'react'
import { Button } from '../../../../../ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../ui/card'
import { Landmark, CheckCircle, Loader2, Eye } from 'lucide-react'
import type { WalletInstance } from '../../types'
import { useDigitalIDLogs } from '../../hooks/useDigitalIDLogs'
import { signData } from '../../utils/crypto-utils'

interface RelyingPartyComponentProps {
  wallet: WalletInstance
  onBack: () => void
}

type RPStep = 'START' | 'DISCLOSURE' | 'PRESENTATION' | 'VERIFICATION' | 'COMPLETE'

export const RelyingPartyComponent: React.FC<RelyingPartyComponentProps> = ({ wallet, onBack }) => {
  const [step, setStep] = useState<RPStep>('START')
  const [loading, setLoading] = useState(false)
  const { logs, opensslLogs, activeLogTab, setActiveLogTab, addLog, addOpenSSLLog } = useDigitalIDLogs()

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

      addLog('Generating Device Binding Proof...')

      // Create a mock challenge
      const challenge = crypto.randomUUID()
      const payload = {
        iss: 'did:wallet:123',
        aud: 'https://bank.example.com',
        nonce: challenge,
        iat: Date.now()
      }

      const payloadStr = JSON.stringify(payload, null, 2)
      addLog(`Signing Verification Payload:\n${payloadStr}`)

      // Sign with the available key
      // We pass the payload string directly. helper handles encoding.
      const signature = await signData(availableKey, payloadStr, addOpenSSLLog)

      addLog(`Signature generated: ${signature.substring(0, 20)}...`)
      addLog('Presentation with Proof sent to Bank.')

      await new Promise(r => setTimeout(r, 800)) // UI pacing

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
    addLog('Bank Verifying Proof...')
    await new Promise(r => setTimeout(r, 1000))
    addLog('✅ Signature Valid.')
    addLog('✅ Trust Chain Valid (eIDAS Bridge).')
    addLog('✅ Selective Disclosure Checked.')
    setLoading(false)
    setStep('COMPLETE')
  }

  return (
    <Card className="max-w-7xl mx-auto border-blue-200 shadow-xl">
      <CardHeader className="bg-blue-50/50">
        <CardTitle className="text-blue-800 flex items-center gap-2">
          <Landmark className="w-6 h-6" />
          Bank (Relying Party)
        </CardTitle>
        <CardDescription>
          Verify your identity to open a premium bank account
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="space-y-6 lg:col-span-2">

            {/* Steps Visualization */}
            <div className="space-y-4">
              <div className={`p-3 rounded border flex items-center gap-3 ${step === 'START' ? 'bg-blue-50 border-blue-400' : 'bg-slate-50'}`}>
                <div className="bg-blue-100 p-1.5 rounded-full text-blue-600 font-bold text-xs">1</div>
                <span className="text-sm">Request</span>
              </div>
              <div className={`p-3 rounded border flex items-center gap-3 ${step === 'DISCLOSURE' ? 'bg-blue-50 border-blue-400' : 'bg-slate-50'}`}>
                <div className="bg-blue-100 p-1.5 rounded-full text-blue-600 font-bold text-xs">2</div>
                <span className="text-sm">Disclosure</span>
              </div>
              <div className={`p-3 rounded border flex items-center gap-3 ${['PRESENTATION', 'VERIFICATION'].includes(step) ? 'bg-blue-50 border-blue-400' : 'bg-slate-50'}`}>
                <div className="bg-blue-100 p-1.5 rounded-full text-blue-600 font-bold text-xs">3</div>
                <span className="text-sm">Proof & Verify</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 border-t pt-6">
              {step === 'START' && (
                <Button onClick={handleStart} className="w-full bg-blue-600 hover:bg-blue-700">
                  Login with Wallet
                </Button>
              )}

              {step === 'DISCLOSURE' && (
                <div className="space-y-4">
                  <div className="bg-slate-100 p-3 rounded text-sm">
                    <p className="font-semibold mb-2 flex items-center gap-2"><Eye className="w-4 h-4" /> Requested Data:</p>
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
                  <Loader2 className="animate-spin w-8 h-8 text-blue-500 mx-auto" />
                  <p className="text-sm mt-2 text-muted-foreground">Generating Zero-Knowledge Proof...</p>
                </div>
              )}

              {step === 'VERIFICATION' && (
                <Button onClick={handleVerification} className="w-full bg-green-600 hover:bg-green-700">
                  Check Verification Result
                </Button>
              )}

              {step === 'COMPLETE' && (
                <div className="bg-green-50 p-4 rounded border border-green-200 text-center">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                  <h3 className="font-bold text-green-800">Account Opened!</h3>
                  <p className="text-sm text-green-700 mb-4">
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
          <div className="flex flex-col h-[400px] border rounded-lg bg-slate-950 overflow-hidden lg:col-span-3">
            {/* Tabs */}
            <div className="flex items-center border-b border-slate-800 bg-slate-900">
              <button
                onClick={() => setActiveLogTab('protocol')}
                className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${activeLogTab === 'protocol'
                  ? 'text-blue-400 bg-slate-800 border-b-2 border-blue-500'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
              >
                PROTOCOL LOG
              </button>
              <button
                onClick={() => setActiveLogTab('openssl')}
                className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${activeLogTab === 'openssl'
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
                  {logs.map((log, i) => (
                    <div key={i} className="mb-1">
                      {log}
                    </div>
                  ))}
                  {logs.length === 0 && <span className="opacity-50">Waiting for connection...</span>}
                </>
              ) : (
                <>
                  {opensslLogs.map((log, i) => (
                    <div key={i} className="mb-2 whitespace-pre-wrap break-all text-green-200/90">
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
