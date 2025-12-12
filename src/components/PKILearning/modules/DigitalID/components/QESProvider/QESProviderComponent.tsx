import React, { useState } from 'react'
import { Button } from '../../../../../ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../ui/card'
import type { WalletInstance } from '../../types'
import { useDigitalIDLogs } from '../../hooks/useDigitalIDLogs'
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
  const { logs, opensslLogs, activeLogTab, setActiveLogTab, addLog, addOpenSSLLog } =
    useDigitalIDLogs()
  const [docName, setDocName] = useState('Contract.pdf')
  const [docHash, setDocHash] = useState('')

  const handleUpload = async () => {
    if (!docName.trim()) {
      addLog('Error: Please enter a document name.')
      return
    }

    setStep('AUTH') // Move to Auth state immediately to show progress
    addLog(`Document selected: ${docName}`)
    addLog('Calculating SHA-256 hash of document (simulated content)...')

    try {
      // Mock hash calculation using crypto utils to show OpenSSL log
      // We simulate content by just hashing the name + timestamp
      const fileContent = `Content of ${docName} - ${Date.now()}`
      const hash = await sha256Hash(fileContent, addOpenSSLLog)
      setDocHash(hash)
      addLog(`Hash calculated: ${hash.substring(0, 16)}...`)
    } catch (e) {
      addLog(`Error hashing document: ${e}`)
    }
  }

  const handleAuth = async () => {
    setLoading(true)
    addLog('Connecting to QTSP (CSC API)...')
    addLog('Requesting authorization for Remote Signing...')

    // Mock CSC Auth delay
    await new Promise((r) => setTimeout(r, 1000))
    addLog('Authorization SUCCESS. Access Token granted.')
    setLoading(false)
    setStep('SIGN')
  }

  const handleSign = async () => {
    setLoading(true)
    addLog('Requesting QES signature on hash...')

    await new Promise((r) => setTimeout(r, 800))

    addLog('Remote HSM: Key loaded (ECC P-384).')
    addLog('Sole Control Assurance: Validated.')

    // Simulate signing log from OpenSSL (even though key is remote/mock)
    // We'll log a "Remote Sign" event to OpenSSL logs to satisfy the user needing logs
    addOpenSSLLog(`[Remote HSM] Signing hash: ${docHash.substring(0, 32)}...`)
    addOpenSSLLog(`[Remote HSM] Algorithm: ecdsa-with-SHA384`)

    addLog('Signature returned by QTSP.')
    setLoading(false)
    setStep('COMPLETE')
  }

  return (
    <Card className="max-w-7xl mx-auto border-orange-200 shadow-xl">
      <CardHeader className="bg-orange-50/50">
        <CardTitle className="text-orange-800 flex items-center gap-2">
          <FileSignature className="w-6 h-6" />
          Qualified Trust Service Provider (QES)
        </CardTitle>
        <CardDescription>Sign documents legally using Remote HSM and CSC API</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="space-y-6 lg:col-span-2">
            {step === 'UPLOAD' && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center bg-slate-50">
                  <UploadCloud className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <Label className="block mb-2">Document Name</Label>
                  <Input
                    type="text"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    className="text-center"
                    placeholder="e.g. Contract.pdf"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Enter any name to simulate a file upload.
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
                  {docHash || 'Calculating...'}
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

          {/* Logs */}
          <div className="flex flex-col h-[400px] border rounded-lg bg-slate-950 overflow-hidden lg:col-span-3">
            {/* Tabs */}
            <div className="flex items-center border-b border-slate-800 bg-slate-900">
              <button
                onClick={() => setActiveLogTab('protocol')}
                className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
                  activeLogTab === 'protocol'
                    ? 'text-orange-400 bg-slate-800 border-b-2 border-orange-500' // Orange theme for QES
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
                  {logs.map((log, i) => (
                    <div key={i} className="mb-1">
                      {log}
                    </div>
                  ))}
                  {logs.length === 0 && <span className="opacity-50">Waiting for document...</span>}
                </>
              ) : (
                <>
                  {opensslLogs.map((log, i) => (
                    <div key={i} className="mb-2 whitespace-pre-wrap break-all text-green-200/90">
                      {log}
                    </div>
                  ))}
                  {opensslLogs.length === 0 && (
                    <span className="opacity-50">No cryptographic operations logged yet.</span>
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
