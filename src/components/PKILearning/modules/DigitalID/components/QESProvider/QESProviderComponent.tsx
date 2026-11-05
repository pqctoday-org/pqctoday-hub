// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { WalletInstance } from '../../types'
import { useDigitalIDLogs } from '../../hooks/useDigitalIDLogs'
import type { CryptoProvider } from '../../utils/crypto-provider'
import type { KeyAlgorithm, KeyCurve } from '../../types'
import { OpenSSLCryptoProvider } from '../../utils/openssl-crypto-provider'
import { SoftHSMCryptoProvider, isHsmBackedKey } from '../../utils/hsm-crypto-provider'
import { DualCryptoProvider } from '../../utils/dual-crypto-provider'
import { generateX509Certificate } from '../../utils/x509-utils'
import { Loader2, FileSignature, UploadCloud, CheckCircle, PenTool, Lock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import type { UseHSMResult, HsmKey } from '@/hooks/useHSM'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import { HsmKeyInspector } from '@/components/shared/HsmKeyInspector'

type QesAlgorithmOption = {
  label: string
  algorithm: KeyAlgorithm
  curve: KeyCurve
  description: string
}

const QES_ALGORITHM_OPTIONS: QesAlgorithmOption[] = [
  {
    label: 'ES384 (P-384)',
    algorithm: 'ES384',
    curve: 'P-384',
    description:
      'ECDSA with P-384 — listed for qualified signatures in ETSI TS 119 312 (~192-bit classical security)',
  },
  {
    label: 'ES256 (P-256)',
    algorithm: 'ES256',
    curve: 'P-256',
    description: 'ECDSA with P-256 — widely supported (~128-bit classical security)',
  },
  {
    label: 'EdDSA (Ed25519)',
    algorithm: 'EdDSA',
    curve: 'Ed25519',
    description: 'Edwards-curve DSA — fast, compact signatures, 128-bit security',
  },
]

const QES_LIVE_OPERATIONS = [
  'C_DigestInit',
  'C_Digest',
  'C_GenerateKeyPair',
  'C_SignInit',
  'C_Sign',
  'C_VerifyInit',
  'C_Verify',
]

interface QESProviderComponentProps {
  wallet: WalletInstance
  hsm: UseHSMResult
  onBack: () => void
}

export const QESProviderComponent: React.FC<QESProviderComponentProps> = ({
  wallet,
  hsm,
  onBack,
}) => {
  const [step, setStep] = useState<'UPLOAD' | 'PID_CHECK' | 'AUTH' | 'SIGN' | 'COMPLETE'>('UPLOAD')
  const [loading, setLoading] = useState(false)
  const { logs, opensslLogs, activeLogTab, setActiveLogTab, addLog, addOpenSSLLog, clearLogs } =
    useDigitalIDLogs()
  const [docName, setDocName] = useState('Contract.pdf')
  const [docHash, setDocHash] = useState('')
  const [selectedAlg, setSelectedAlg] = useState<QesAlgorithmOption>(QES_ALGORITHM_OPTIONS[0])
  const [error, setError] = useState('')
  const runId = useRef(0)
  const busy = useRef(false)
  const invalidateRun = useCallback(() => {
    runId.current++
  }, [])
  useEffect(() => {
    runId.current++
    busy.current = false
    setLoading(false)
    setStep('UPLOAD')
    setDocHash('')
    setError('')
    clearLogs()
    return invalidateRun
  }, [hsm.isReady, clearLogs, invalidateRun])
  const resetInputs = () => {
    runId.current++
    setDocHash('')
    setError('')
    clearLogs()
  }

  const getCryptoProvider = (): CryptoProvider => {
    const ossl = new OpenSSLCryptoProvider()
    if (hsm.isReady && hsm.moduleRef.current && hsm.hSessionRef.current) {
      const hsmProvider = new SoftHSMCryptoProvider(
        hsm.moduleRef.current,
        hsm.hSessionRef.current,
        { addKey: hsm.addKey }
      )
      return new DualCryptoProvider(hsmProvider, ossl)
    }
    return ossl
  }

  const pidCredential = wallet.credentials.find((c) => c.type.includes('PersonIdentificationData'))

  const handleUpload = async () => {
    if (busy.current) return
    if (!docName.trim()) {
      setError('Please enter a sample document name.')
      return
    }
    if (selectedAlg.algorithm === 'EdDSA' && !hsm.isReady) {
      setError(
        'Enable Live HSM for this Ed25519 sample. The OpenSSL-only path does not support this selection here.'
      )
      return
    }
    setError('')
    if (!pidCredential) {
      setStep('PID_CHECK')
      return
    }
    const id = ++runId.current
    busy.current = true
    setLoading(true)
    addLog('Sample PID presence checked; identity and trust validation are simulated.')
    try {
      const provider = getCryptoProvider()
      const trace = (message: string) => {
        if (runId.current === id) addOpenSSLLog(message)
      }
      const hash = await provider.sha256Hash(`Content of ${docName} - ${Date.now()}`, trace)
      if (runId.current !== id) return
      setDocHash(hash)
      addLog(`Sample content hash calculated: ${hash.substring(0, 16)}...`)
      setStep('AUTH')
    } catch (error) {
      if (runId.current === id) setError(`Sample hashing failed: ${String(error)}`)
    } finally {
      if (runId.current === id) {
        busy.current = false
        setLoading(false)
      }
    }
  }

  const handleAuth = async () => {
    if (busy.current) return
    const id = ++runId.current
    busy.current = true
    setLoading(true)
    addLog(
      'Simulated CSC authorization; no QTSP is contacted and sole-control assurance is not tested.'
    )
    await new Promise((resolve) => setTimeout(resolve, 1000))
    if (runId.current === id) {
      busy.current = false
      setLoading(false)
      setStep('SIGN')
    }
  }

  const handleSign = async () => {
    if (busy.current) return
    const id = ++runId.current
    busy.current = true
    setLoading(true)
    setError('')
    const algorithm = selectedAlg
    const hash = docHash
    const trace = (message: string) => {
      if (runId.current === id) addOpenSSLLog(message)
    }
    try {
      if (!hash) throw new Error('Prepare the sample document again before signing')
      if (algorithm.algorithm === 'EdDSA' && !hsm.isReady)
        throw new Error('Enable Live HSM for Ed25519')
      const provider = getCryptoProvider()
      addLog(`Generating sample ${algorithm.label} signing key...`)
      const key = await provider.generateKeyPair(algorithm.algorithm, algorithm.curve, trace)
      if (runId.current !== id) return
      if (key.algorithm !== algorithm.algorithm || key.curve !== algorithm.curve)
        throw new Error('Generated key does not match the selected algorithm')
      let identName = 'Citizen'
      const familyName = pidCredential?.credentialSubject?.family_name
      if (typeof familyName === 'string') identName = familyName
      const cert = await generateX509Certificate(
        key,
        provider,
        `/CN=${identName} (Sample Signing)`,
        trace
      )
      if (runId.current !== id) return
      addOpenSSLLog(cert)
      const signature = await provider.signData(key, hash, trace)
      if (runId.current !== id) return
      const valid = await provider.verifySignature(key, signature, hash, trace)
      if (runId.current !== id) return
      if (!valid) throw new Error('Sample signature verification failed')
      addLog(`Sample test passed: ${algorithm.label}; document-hash signature verified.`)
      addLog(`Sample signature: ${signature}`)
      addLog(
        'The self-signed certificate and simulated authorization do not establish qualified-signature status.'
      )
      setStep('COMPLETE')
    } catch (error) {
      if (runId.current === id) {
        setError(`Sample signing incomplete: ${String(error)}`)
        addLog('Sample signing incomplete; no successful result recorded.')
      }
    } finally {
      if (runId.current === id) {
        busy.current = false
        setLoading(false)
      }
    }
  }

  return (
    <Card className="max-w-7xl mx-auto border-warning/30 shadow-xl">
      <CardHeader className="bg-warning/5">
        <CardTitle className="text-warning flex items-center gap-2">
          <FileSignature className="w-6 h-6" />
          Qualified Trust Service Provider (QES)
        </CardTitle>
        <CardDescription>
          Explore sample document signing with simulated CSC authorization
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <LiveHSMToggle
          hsm={hsm}
          operations={QES_LIVE_OPERATIONS}
          className="mb-4"
          preventDisable={loading || wallet.keys.some(isHsmBackedKey)}
          preventDisableReason="Disable is locked while your wallet holds HSM-backed keys — Reset the workshop to release them."
        />
        {error && (
          <p role="alert" className="mb-4 text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="space-y-6 lg:col-span-2">
            {step === 'UPLOAD' && (
              <div className="space-y-4">
                <div className="bg-warning/5 p-3 rounded-lg border border-warning/20 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">
                    Note: Cloud Signature Consortium (CSC) API
                  </p>
                  <p>
                    Remote <InlineTooltip term="Qualified Electronic Signature">QES</InlineTooltip>{' '}
                    uses the CSC API standard (V2.2, November 2025) to interact with a cloud-based
                    HSM managed by a{' '}
                    <InlineTooltip term="QTSP">
                      Qualified Trust Service Provider (QTSP)
                    </InlineTooltip>
                    . Your signing key never leaves the HSM. The QTSP ensures Sole Control Assurance
                    (SCAL2) — only you can authorize signature operations on your key. This exercise
                    uses local sample keys and simulated authorization; it does not test those
                    production assurances.
                  </p>
                </div>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-muted/5">
                  <UploadCloud className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <Label className="block mb-2">Document Name</Label>
                  <Input
                    type="text"
                    value={docName}
                    onChange={(e) => {
                      resetInputs()
                      setDocName(e.target.value)
                    }}
                    disabled={loading}
                    className="text-center"
                    placeholder="e.g. Contract.pdf"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Enter any name to simulate a file upload.
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Signature Algorithm</Label>
                  <FilterDropdown
                    disabled={loading}
                    items={QES_ALGORITHM_OPTIONS.map((o) => o.label)}
                    selectedId={selectedAlg.label}
                    onSelect={(label) => {
                      const match = QES_ALGORITHM_OPTIONS.find((o) => o.label === label)
                      if (match) {
                        resetInputs()
                        setSelectedAlg(match)
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">{selectedAlg.description}</p>
                </div>
                <Button
                  variant="ghost"
                  onClick={handleUpload}
                  disabled={loading}
                  className="w-full"
                >
                  Proceed to Sign
                </Button>
              </div>
            )}

            {step === 'PID_CHECK' && !pidCredential && (
              <div className="bg-warning/5 p-4 rounded border border-warning/30 text-warning">
                <h4 className="font-bold flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Identity Required
                </h4>
                <p className="text-sm mt-1">
                  You must have a valid PID in your wallet to use QES services.
                </p>
                <Button onClick={onBack} variant="secondary" className="mt-3 w-full">
                  Go back to get PID
                </Button>
              </div>
            )}

            {step === 'AUTH' && (
              <div className="space-y-4">
                <div className="bg-warning/5 p-4 rounded border border-warning/30">
                  <h4 className="font-bold flex items-center gap-2">
                    <Lock className="w-4 h-4" /> Authorization Required
                  </h4>
                  <p className="text-sm mt-1">
                    Continue the simulated authorization; this does not contact a QTSP.
                  </p>
                </div>
                <Button variant="ghost" onClick={handleAuth} disabled={loading} className="w-full">
                  {loading && <Loader2 className="animate-spin mr-2" />} Authorize Access
                </Button>
              </div>
            )}

            {step === 'SIGN' && (
              <div className="space-y-4">
                <div className="p-4 bg-muted/10 rounded text-sm font-mono break-all">
                  <p className="font-bold text-xs text-muted-foreground mb-1">DOCUMENT HASH:</p>
                  {docHash || 'Calculating...'}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                  <PenTool className="w-4 h-4" /> Ready to sign the sample document hash
                </div>
                <Button variant="ghost" onClick={handleSign} disabled={loading} className="w-full">
                  {loading && <Loader2 className="animate-spin mr-2" />} Sign Document
                </Button>
              </div>
            )}

            {step === 'COMPLETE' && (
              <div className="bg-success/5 p-6 rounded-lg text-center border border-success/30">
                <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-success">Sample Signature Checked</h2>
                <p className="text-success mt-2">
                  The selected algorithm signed the sample document hash and its signature check
                  passed. This demonstration does not establish legal QES status.
                </p>
                <Button
                  onClick={onBack}
                  variant="outline"
                  className="mt-6 border-success text-success hover:bg-success/5"
                >
                  Done
                </Button>
              </div>
            )}
          </div>

          {/* Logs */}
          <div className="flex flex-col h-[400px] border rounded-lg bg-card overflow-hidden lg:col-span-3">
            {/* Tabs */}
            <div className="flex items-center border-b border-border bg-muted/30">
              <Button
                variant="ghost"
                onClick={() => setActiveLogTab('protocol')}
                className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
                  activeLogTab === 'protocol'
                    ? 'text-warning bg-muted/50 border-b-2 border-warning'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                }`}
              >
                PROTOCOL LOG
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActiveLogTab('openssl')}
                className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
                  activeLogTab === 'openssl'
                    ? 'text-success bg-muted/50 border-b-2 border-success'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                }`}
              >
                OPENSSL LOG
              </Button>
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
                    <span className="text-muted-foreground">Waiting for document...</span>
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
                    <span className="text-muted-foreground">
                      No cryptographic operations logged yet.
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        {hsm.isReady && (
          <Pkcs11LogPanel
            log={hsm.log}
            onClear={hsm.clearLog}
            title="PKCS#11 Call Log — QES Signing"
            className="mt-4"
            filterFns={QES_LIVE_OPERATIONS}
          />
        )}
        {hsm.isReady && (
          <HsmKeyInspector
            keys={hsm.keys}
            moduleRef={hsm.moduleRef}
            hSessionRef={hsm.hSessionRef}
            onRemoveKey={(key: HsmKey) => hsm.removeKey(key.handle)}
          />
        )}
      </CardContent>
    </Card>
  )
}
