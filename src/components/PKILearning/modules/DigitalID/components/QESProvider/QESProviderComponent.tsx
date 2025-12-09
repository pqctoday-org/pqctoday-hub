import React, { useState } from 'react'
import { Button } from '../../../../../ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../ui/card'
import type { WalletInstance } from '../../types'
import { sha256Hash } from '../../utils/crypto-utils'
import { Loader2, FileSignature, UploadCloud, CheckCircle, PenTool, Lock } from 'lucide-react'
import { Input } from '../../../../../ui/input'
import { Label } from '../../../../../ui/label'

interface QESProviderComponentProps {
  wallet: WalletInstance
  onBack: () => void
}

export const QESProviderComponent: React.FC<QESProviderComponentProps> = ({ onBack }) => {
  const [step, setStep] = useState<'UPLOAD' | 'AUTH' | 'SIGN' | 'COMPLETE'>('UPLOAD')
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [docName, setDocName] = useState('Contract.pdf')
  const [docHash, setDocHash] = useState('')

  const addLog = (msg: string) =>
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])

  const handleUpload = () => {
    addLog(`Document selected: ${docName}`)
    addLog('Calculating SHA-256 hash of document...')

    // Mock hash
    const hash = sha256Hash(docName + Date.now())
    setDocHash(hash)
    addLog(`Hash: ${hash.substring(0, 16)}...`)
    setStep('AUTH')
  }

  const handleAuth = async () => {
    setLoading(true)
    addLog('Connecting to QTSP (CSC API)...')
    addLog('Requesting authorization for Remote Signing...')

    // Mock CSC Auth
    await new Promise((r) => setTimeout(r, 1000))
    addLog('Authorization SUCCESS. Access Token granted.')
    setLoading(false)
    setStep('SIGN')
  }

  const handleSign = async () => {
    setLoading(true)
    addLog('Requesting QES signature on hash...')

    // Find QES key (or generate temporary session one effectively owned by provider for the user)
    // In real QES, the key is in the QTSP's HSM.
    // We will simulate this by using a new key or existing one if we track them.
    // For simplicity, generate a new QTSP-held key for this user.

    // Mock remote signing delay
    await new Promise((r) => setTimeout(r, 1500))

    addLog('Remote HSM: Key loaded (RSA-4096 or ECC P-384).')
    addLog('Sole Control Assurance: Validated.')
    addLog('Signing data...')

    // We don't have the key here to actually sign in this client component if it's "remote",
    // but we can simulate the result.
    const mockSig = 'MEYCIQ...[Simulated QES Signature]...Of8s'

    addLog('Signature returned by QTSP.')
    addLog(`Signature: ${mockSig.substring(0, 20)}...`)

    setLoading(false)
    setStep('COMPLETE')
  }

  return (
    <Card className="max-w-4xl mx-auto border-orange-200 shadow-xl">
      <CardHeader className="bg-orange-50/50">
        <CardTitle className="text-orange-800 flex items-center gap-2">
          <FileSignature className="w-6 h-6" />
          Qualified Trust Service Provider (QES)
        </CardTitle>
        <CardDescription>Sign documents legally using Remote HSM and CSC API</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            {step === 'UPLOAD' && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center bg-slate-50">
                  <UploadCloud className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <Label className="block mb-2">Upload Document to Sign</Label>
                  <Input
                    type="text"
                    value={docName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setDocName(e.target.value)
                    }
                    className="text-center"
                    placeholder="Enter document name"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Simulated upload (no file actually transferred)
                  </p>
                </div>
                <Button onClick={handleUpload} className="w-full bg-orange-600 hover:bg-orange-700">
                  Proceed to Sign
                </Button>
              </div>
            )}

            {step === 'AUTH' && (
              <div className="space-y-4">
                <div className="bg-orange-50 p-4 rounded border border-orange-200">
                  <h4 className="font-bold flex items-center gap-2">
                    <Lock className="w-4 h-4" /> Authorization Required
                  </h4>
                  <p className="text-sm mt-1">Authorize the QTSP to access your signing key.</p>
                </div>
                <Button onClick={handleAuth} disabled={loading} className="w-full bg-orange-600">
                  {loading && <Loader2 className="animate-spin mr-2" />} Authorize Access
                </Button>
              </div>
            )}

            {step === 'SIGN' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-100 rounded text-sm font-mono break-all">
                  <p className="font-bold text-xs text-slate-500 mb-1">DOCUMENT HASH:</p>
                  {docHash}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                  <PenTool className="w-4 h-4" /> Ready to apply Qualified Electronic Signature
                </div>
                <Button onClick={handleSign} disabled={loading} className="w-full bg-orange-600">
                  {loading && <Loader2 className="animate-spin mr-2" />} Sign Document
                </Button>
              </div>
            )}

            {step === 'COMPLETE' && (
              <div className="bg-green-50 p-6 rounded-lg text-center border border-green-200">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-green-800">Signed Successfully!</h2>
                <p className="text-green-700 mt-2">
                  The document has been signed with a Qualified Electronic Signature.
                </p>
                <Button
                  onClick={onBack}
                  variant="outline"
                  className="mt-6 border-green-600 text-green-700 hover:bg-green-50"
                >
                  Done
                </Button>
              </div>
            )}
          </div>

          {/* Log */}
          <div className="bg-slate-950 text-slate-50 p-4 rounded-lg font-mono text-xs h-[400px] overflow-y-auto">
            <div className="mb-2 text-slate-400 border-b border-slate-800 pb-2">
              CSC API Protocol Log
            </div>
            {logs.map((log, i) => (
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
