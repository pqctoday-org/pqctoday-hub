// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useCallback, useRef } from 'react'
import {
  FileCode,
  Key,
  CheckCircle,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
  Info,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useHSM } from '@/hooks/useHSM'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import {
  hsm_generateMLDSAKeyPair,
  hsm_extractKeyValue,
  hsm_digest,
  hsm_sign,
  hsm_verify,
  CKM_SHA256,
} from '@/wasm/softhsm'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'

type WizardStep = 0 | 1 | 2 | 3

interface FirmwareManifest {
  firmwareName: string
  version: string
  vendor: string
  platform: string
  currentSigningKey: string
  currentAlgorithm: string
  currentSignatureSize: number
  currentKeySize: number
  components: FirmwareComponent[]
}

interface FirmwareComponent {
  name: string
  size: string
  hash: string
}

interface GeneratedKey {
  algorithm: string
  publicKeyHex: string
  publicKeySize: number
  privateKeySize: number
  nistLevel: string
  usage: string
  isLive?: boolean
}

interface SignatureResult {
  algorithm: string
  signatureHex: string
  signatureSize: number
  signingTime: string
  certChain: string[]
  isLive?: boolean
}

interface VerificationResult {
  verified: boolean
  algorithm: string
  signerDN: string
  validFrom: string
  validUntil: string
  nistLevel: string
  isLive?: boolean
}

const MOCK_MANIFEST: FirmwareManifest = {
  firmwareName: 'APTIO_V_GenericServerPlatform',
  version: '5.27.1234',
  vendor: 'AMI',
  platform: 'Xeon Scalable 4th Gen Reference Platform',
  currentSigningKey: 'ami-firmware-sign-rsa2048-2023',
  currentAlgorithm: 'RSA-2048 with SHA-256',
  currentSignatureSize: 256,
  currentKeySize: 256,
  components: [
    { name: 'PEI Core', size: '512 KB', hash: 'a3f2c1d4e5b6a7f8...' },
    { name: 'DXE Core', size: '1.2 MB', hash: 'b4c3d2e1f0a9b8c7...' },
    { name: 'UEFI Shell', size: '256 KB', hash: 'c5d4e3f2a1b0c9d8...' },
    { name: 'Setup UI', size: '384 KB', hash: 'd6e5f4a3b2c1d0e9...' },
    { name: 'Network Stack', size: '192 KB', hash: 'e7f6a5b4c3d2e1f0...' },
  ],
}

const MOCK_PQC_KEY: GeneratedKey = {
  algorithm: 'ML-DSA-65 (FIPS 204)',
  publicKeyHex:
    '308203c0300d0609608648016503040303050003820003003082037ec0f2a1d3e4b5c6a7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2...(truncated 1,952 bytes total)',
  publicKeySize: 1952,
  privateKeySize: 4032,
  nistLevel: 'NIST Level 3',
  usage: 'Firmware Signing (id-ml-dsa-65)',
}

const MOCK_SIGNATURE: SignatureResult = {
  algorithm: 'ML-DSA-65 (FIPS 204)',
  signatureHex:
    '3082035003050603608648016503040303050003820310a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4...(3,309 bytes total)',
  signatureSize: 3309,
  signingTime: '2026-03-07T14:32:11Z',
  certChain: [
    'AMI Firmware Signing Cert (ML-DSA-65) — Subject: CN=ami-fw-sign-pqc-001',
    'AMI Intermediate CA (ML-DSA-87) — Subject: CN=AMI PQC Intermediate CA 2026',
    'AMI Root CA (ML-DSA-87) — Subject: CN=AMI PQC Root CA',
  ],
}

const MOCK_VERIFICATION: VerificationResult = {
  verified: true,
  algorithm: 'ML-DSA-65 (FIPS 204)',
  signerDN: 'CN=ami-fw-sign-pqc-001, O=AMI, C=US',
  validFrom: '2026-01-01T00:00:00Z',
  validUntil: '2029-01-01T00:00:00Z',
  nistLevel: 'NIST Level 3 — Quantum-safe',
}

const STEP_TITLES = [
  'Step 1: Inventory — Current Firmware Manifest',
  'Step 2: Generate ML-DSA-65 Signing Key',
  'Step 3: Sign Firmware with ML-DSA-65',
  'Step 4: Verify Signature & Certificate Chain',
]

const STEP_ICONS = [FileCode, Key, AlertTriangle, CheckCircle]

const LIVE_OPERATIONS = [
  'C_GenerateKeyPair',
  'C_GetAttributeValue',
  'C_DigestInit',
  'C_Digest',
  'C_MessageSignInit',
  'C_SignMessage',
  'C_MessageSignFinal',
  'C_MessageVerifyInit',
  'C_VerifyMessage',
  'C_MessageVerifyFinal',
]

/** Convert byte array to hex string */
const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

/** Truncate hex for display */
const truncateHex = (hex: string, maxChars = 80): string => {
  if (hex.length <= maxChars) return hex
  return `${hex.slice(0, maxChars / 2)}...${hex.slice(-maxChars / 2)}`
}

/** Build a deterministic manifest string from the component hashes */
const buildManifestString = (): string =>
  MOCK_MANIFEST.components.map((c) => `${c.name}:${c.size}:${c.hash}`).join('|')

export const FirmwareSigningMigrator: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<WizardStep>(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [isProcessing, setIsProcessing] = useState(false)

  // Live HSM state
  const hsm = useHSM()
  const liveKeyRef = useRef<{ pubHandle: number; privHandle: number }>({
    pubHandle: 0,
    privHandle: 0,
  })
  const [liveKey, setLiveKey] = useState<GeneratedKey | null>(null)
  const [liveSig, setLiveSig] = useState<SignatureResult | null>(null)
  const [liveVerify, setLiveVerify] = useState<VerificationResult | null>(null)
  const liveSigBytesRef = useRef<Uint8Array | null>(null)

  const [hasPrivHandle, setHasPrivHandle] = useState(false)
  const [hasSigBytes, setHasSigBytes] = useState(false)

  const isLive = hsm.isReady && !!hsm.moduleRef.current
  const keyData = isLive && liveKey ? liveKey : MOCK_PQC_KEY
  const sigData = isLive && liveSig ? liveSig : MOCK_SIGNATURE
  const verifyData = isLive && liveVerify ? liveVerify : MOCK_VERIFICATION

  const markComplete = (step: number) => {
    setCompletedSteps((prev) => new Set([...prev, step]))
  }

  // Step 2: Generate real ML-DSA-65 key pair via PKCS#11
  const handleGenerateKey = useCallback(async () => {
    if (!hsm.isReady || !hsm.moduleRef.current) return
    setIsProcessing(true)
    try {
      const M = hsm.moduleRef.current as unknown as SoftHSMModule
      const hSession = hsm.hSessionRef.current
      const { pubHandle, privHandle } = hsm_generateMLDSAKeyPair(M, hSession, 65)
      liveKeyRef.current = { pubHandle, privHandle }
      setHasPrivHandle(true)

      const pubBytes = hsm_extractKeyValue(M, hSession, pubHandle)
      const pubHex = toHex(pubBytes)

      setLiveKey({
        algorithm: 'ML-DSA-65 (FIPS 204)',
        publicKeyHex: pubHex,
        publicKeySize: pubBytes.length,
        privateKeySize: 4032,
        nistLevel: 'NIST Level 3',
        usage: 'Firmware Signing (id-ml-dsa-65)',
        isLive: true,
      })
    } catch (err) {
      console.error('[FirmwareSigningMigrator] live keygen error:', err)
    }
    setIsProcessing(false)
  }, [hsm])

  // Step 3: Sign firmware manifest hash via PKCS#11
  const handleSign = useCallback(async () => {
    if (!hsm.isReady || !hsm.moduleRef.current || !liveKeyRef.current.privHandle) return
    setIsProcessing(true)
    try {
      const M = hsm.moduleRef.current as unknown as SoftHSMModule
      const hSession = hsm.hSessionRef.current
      const { privHandle } = liveKeyRef.current

      // Build the firmware manifest string and hash it for PKCS#11 log visibility
      const manifestStr = buildManifestString()
      const manifestBytes = new TextEncoder().encode(manifestStr)
      hsm_digest(M, hSession, manifestBytes, CKM_SHA256)

      // Sign with ML-DSA-65 (message signing, not pre-hash)
      const sig = hsm_sign(M, hSession, privHandle, manifestStr)
      liveSigBytesRef.current = sig
      setHasSigBytes(true)

      setLiveSig({
        algorithm: 'ML-DSA-65 (FIPS 204)',
        signatureHex: toHex(sig),
        signatureSize: sig.length,
        signingTime: new Date().toISOString(),
        certChain: MOCK_SIGNATURE.certChain,
        isLive: true,
      })
    } catch (err) {
      console.error('[FirmwareSigningMigrator] live sign error:', err)
    }
    setIsProcessing(false)
  }, [hsm])

  // Step 4: Verify firmware signature via PKCS#11
  const handleVerify = useCallback(async () => {
    if (
      !hsm.isReady ||
      !hsm.moduleRef.current ||
      !liveKeyRef.current.pubHandle ||
      !liveSigBytesRef.current
    )
      return
    setIsProcessing(true)
    try {
      const M = hsm.moduleRef.current as unknown as SoftHSMModule
      const hSession = hsm.hSessionRef.current
      const { pubHandle } = liveKeyRef.current

      const manifestStr = buildManifestString()
      const verified = hsm_verify(M, hSession, pubHandle, manifestStr, liveSigBytesRef.current)

      setLiveVerify({
        verified,
        algorithm: 'ML-DSA-65 (FIPS 204)',
        signerDN: 'CN=ami-fw-sign-pqc-001, O=AMI, C=US',
        validFrom: '2026-01-01T00:00:00Z',
        validUntil: '2029-01-01T00:00:00Z',
        nistLevel: 'NIST Level 3 — Quantum-safe',
        isLive: true,
      })
    } catch (err) {
      console.error('[FirmwareSigningMigrator] live verify error:', err)
    }
    setIsProcessing(false)
  }, [hsm])

  const handleNext = useCallback(async () => {
    // Auto-execute live operations when advancing steps
    if (isLive) {
      if (currentStep === 1 && !liveKey) await handleGenerateKey()
      if (currentStep === 2 && !liveSig) await handleSign()
      if (currentStep === 3 && !liveVerify) await handleVerify()
    }
    markComplete(currentStep)
    if (currentStep < 3) setCurrentStep((currentStep + 1) as WizardStep)
  }, [
    currentStep,
    isLive,
    liveKey,
    liveSig,
    liveVerify,
    handleGenerateKey,
    handleSign,
    handleVerify,
  ])

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((currentStep - 1) as WizardStep)
  }

  const handleReset = () => {
    setCurrentStep(0)
    setCompletedSteps(new Set())
    setLiveKey(null)
    setLiveSig(null)
    setLiveVerify(null)
    liveSigBytesRef.current = null
    liveKeyRef.current = { pubHandle: 0, privHandle: 0 }
    setHasPrivHandle(false)
    setHasSigBytes(false)
    hsm.clearLog()
    hsm.clearKeys()
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Firmware Signing Migrator</h3>
        <p className="text-sm text-muted-foreground">
          Walk through the 4-step ML-DSA-65 firmware signing migration. Compare RSA-2048 vs
          ML-DSA-65 signature sizes, certificate chains, and verification flows.
        </p>
      </div>

      {/* Live HSM Toggle */}
      <LiveHSMToggle hsm={hsm} operations={LIVE_OPERATIONS} />

      {/* Step Progress */}
      <div className="overflow-x-auto px-1">
        <div className="flex justify-between relative min-w-max sm:min-w-0">
          <div className="absolute top-5 left-0 w-full h-0.5 bg-border -z-10 hidden sm:block" />
          {STEP_TITLES.map((title, idx) => {
            const StepIcon = STEP_ICONS[idx]
            const isDone = completedSteps.has(idx)
            const isActive = idx === currentStep
            return (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx as WizardStep)}
                className={`flex flex-col items-center gap-2 px-2 group ${isActive ? 'text-primary' : isDone ? 'text-status-success' : 'text-muted-foreground'}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors bg-background font-bold
                    ${isActive ? 'border-primary text-primary' : isDone ? 'border-status-success text-status-success' : 'border-border text-muted-foreground'}`}
                >
                  <StepIcon size={18} />
                </div>
                <span className="text-[10px] font-medium hidden md:block text-center max-w-[80px] leading-tight">
                  {title.split(':')[0]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="glass-panel p-4 sm:p-6 min-h-[400px]">
        <h4 className="text-base font-bold text-foreground mb-4">{STEP_TITLES[currentStep]}</h4>

        {currentStep === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Review the current firmware manifest. The platform uses RSA-2048 for signing — a
              quantum-vulnerable algorithm. We will migrate this to ML-DSA-65.
            </p>

            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs mb-3">
                <div>
                  <span className="text-muted-foreground">Firmware: </span>
                  <span className="text-foreground font-mono">{MOCK_MANIFEST.firmwareName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Version: </span>
                  <span className="text-foreground font-mono">{MOCK_MANIFEST.version}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Vendor: </span>
                  <span className="text-foreground">{MOCK_MANIFEST.vendor}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Platform: </span>
                  <span className="text-foreground">{MOCK_MANIFEST.platform}</span>
                </div>
              </div>

              <div className="border-t border-border pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={14} className="text-status-error" aria-hidden="true" />
                  <span className="text-xs font-bold text-status-error">
                    Current Signing Configuration (Quantum-Vulnerable)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div>
                    <span className="text-muted-foreground">Key ID: </span>
                    <span className="font-mono text-status-error">
                      {MOCK_MANIFEST.currentSigningKey}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Algorithm: </span>
                    <span className="text-status-error">{MOCK_MANIFEST.currentAlgorithm}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Signature size: </span>
                    <span className="font-mono text-status-error">
                      {MOCK_MANIFEST.currentSignatureSize} bytes
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Public key size: </span>
                    <span className="font-mono text-status-error">
                      {MOCK_MANIFEST.currentKeySize} bytes
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="text-xs font-bold text-foreground mb-2">
                Firmware Components ({MOCK_MANIFEST.components.length})
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-1.5 text-muted-foreground font-medium">
                      Component
                    </th>
                    <th className="text-right py-1.5 text-muted-foreground font-medium">Size</th>
                    <th className="text-right py-1.5 text-muted-foreground font-medium">
                      Hash (SHA-256)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_MANIFEST.components.map((c) => (
                    <tr key={c.name} className="border-b border-border/50">
                      <td className="py-1.5 text-foreground">{c.name}</td>
                      <td className="py-1.5 text-right font-mono text-muted-foreground">
                        {c.size}
                      </td>
                      <td className="py-1.5 text-right font-mono text-muted-foreground truncate max-w-[120px]">
                        {c.hash}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Generate a new ML-DSA-65 signing key pair. The public key is{' '}
              <strong>7.6× larger</strong> than RSA-2048 (1,952 bytes vs 256 bytes). The private key
              is <strong>3.4× larger</strong> (4,032 bytes vs 1,192 bytes).
            </p>

            {isLive && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleGenerateKey}
                  disabled={isProcessing}
                  variant="outline"
                  className="text-sm"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={14} className="animate-spin mr-1" /> Generating...
                    </>
                  ) : (
                    <>
                      <Key size={14} className="mr-1" />
                      Generate (Live WASM)
                    </>
                  )}
                </Button>
                {liveKey?.isLive && (
                  <span className="text-[11px] text-status-success font-semibold">
                    Real key via C_GenerateKeyPair(CKM_ML_DSA_KEY_PAIR_GEN, CKP_ML_DSA_65)
                  </span>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-status-error/5 rounded-lg p-4 border border-status-error/20">
                <div className="text-xs font-bold text-status-error mb-2">
                  Classical RSA-2048 Key
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Algorithm:</span>
                    <span className="font-mono text-status-error">RSA-2048</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Public key:</span>
                    <span className="font-mono">256 bytes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Private key:</span>
                    <span className="font-mono">1,192 bytes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Security:</span>
                    <span className="text-status-error">~112-bit classical</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quantum-safe:</span>
                    <span className="text-status-error font-bold">No</span>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                <div className="text-xs font-bold text-primary mb-2">
                  ML-DSA-65 Key {keyData.isLive ? '(Live WASM)' : '(Generated)'}
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Algorithm:</span>
                    <span className="font-mono text-primary">{keyData.algorithm}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Public key:</span>
                    <span className="font-mono text-primary">
                      {keyData.publicKeySize.toLocaleString()} bytes
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Private key:</span>
                    <span className="font-mono text-primary">
                      {keyData.privateKeySize.toLocaleString()} bytes
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Security:</span>
                    <span className="text-primary">{keyData.nistLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quantum-safe:</span>
                    <span className="text-status-success font-bold">Yes</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="text-xs font-bold text-foreground mb-2">Public Key (excerpt)</div>
              <pre className="text-[10px] font-mono text-muted-foreground bg-background rounded p-2 border border-border overflow-x-auto whitespace-pre-wrap break-all">
                {truncateHex(keyData.publicKeyHex, 120)}
              </pre>
              <p className="text-[10px] text-muted-foreground mt-2">
                {keyData.isLive
                  ? `${keyData.publicKeySize.toLocaleString()} bytes — CKA_VALUE extracted via C_GetAttributeValue. Private key is HSM-protected (CKA_EXTRACTABLE=FALSE).`
                  : `Usage: ${keyData.usage} — This key will be enrolled in the UEFI Secure Boot db as an EFI_CERT_X509 entry.`}
              </p>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Sign the firmware manifest with the ML-DSA-65 private key. The signature is{' '}
              <strong>12.9× larger</strong> than RSA-2048 (3,309 bytes vs 256 bytes). This affects
              UEFI Authenticated Variable storage.
            </p>

            {isLive && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSign}
                  disabled={isProcessing || !hasPrivHandle}
                  variant="outline"
                  className="text-sm"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={14} className="animate-spin mr-1" /> Signing...
                    </>
                  ) : (
                    'Sign Manifest (Live WASM)'
                  )}
                </Button>
                {liveSig?.isLive && (
                  <span className="text-[11px] text-status-success font-semibold">
                    Real signature via C_MessageSignInit + C_SignMessage (CKM_ML_DSA)
                  </span>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-status-error/5 rounded-lg p-3 border border-status-error/20 text-center">
                <div className="text-lg font-bold text-status-error">256 B</div>
                <div className="text-[10px] text-muted-foreground">RSA-2048 signature</div>
              </div>
              <div className="bg-primary/5 rounded-lg p-3 border border-primary/20 text-center">
                <div className="text-lg font-bold text-primary">
                  {sigData.signatureSize.toLocaleString()} B
                </div>
                <div className="text-[10px] text-muted-foreground">ML-DSA-65 signature</div>
              </div>
              <div className="bg-status-warning/5 rounded-lg p-3 border border-status-warning/20 text-center">
                <div className="text-lg font-bold text-status-warning">
                  {(sigData.signatureSize / 256).toFixed(1)}×
                </div>
                <div className="text-[10px] text-muted-foreground">Size increase</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
                <div className="text-lg font-bold text-foreground">~50 KB</div>
                <div className="text-[10px] text-muted-foreground">Total signing overhead</div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="text-xs font-bold text-foreground mb-2">
                Signature (ML-DSA-65, DER-encoded)
              </div>
              <pre className="text-[10px] font-mono text-primary bg-background rounded p-2 border border-primary/20 overflow-x-auto whitespace-pre-wrap break-all">
                {truncateHex(sigData.signatureHex, 120)}
              </pre>
              <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                <span>Signing time: {sigData.signingTime}</span>
                <span className="font-mono text-primary">
                  {sigData.signatureSize.toLocaleString()} bytes
                </span>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="text-xs font-bold text-foreground mb-2">Certificate Chain</div>
              <div className="space-y-1.5">
                {sigData.certChain.map((cert, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 bg-background rounded p-2 border border-border"
                  >
                    <span className="text-[10px] font-bold text-muted-foreground w-4 shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-[10px] text-foreground/80">{cert}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Verify the ML-DSA-65 firmware signature. The UEFI firmware verifier checks: (1)
              certificate chain up to the enrolled db certificate, (2) ML-DSA signature over the
              firmware hash, (3) certificate validity period.
            </p>

            {isLive && (
              <div className="flex items-center gap-2 mb-2">
                <Button
                  onClick={handleVerify}
                  disabled={isProcessing || !hasSigBytes}
                  variant="outline"
                  className="text-sm"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={14} className="animate-spin mr-1" /> Verifying...
                    </>
                  ) : (
                    'Verify (Live WASM)'
                  )}
                </Button>
                {liveVerify?.isLive && (
                  <span className="text-[11px] text-status-success font-semibold">
                    Real verification via C_MessageVerifyInit + C_VerifyMessage
                  </span>
                )}
              </div>
            )}

            <div
              className={`rounded-lg p-4 border-2 ${verifyData.verified ? 'border-status-success/50 bg-status-success/5' : 'border-status-error/50 bg-status-error/5'}`}
            >
              <div className="flex items-center gap-2 mb-3">
                {verifyData.verified ? (
                  <CheckCircle size={20} className="text-status-success" aria-label="Verified" />
                ) : (
                  <AlertTriangle
                    size={20}
                    className="text-status-error"
                    aria-label="Verification failed"
                  />
                )}
                <span
                  className={`text-sm font-bold ${verifyData.verified ? 'text-status-success' : 'text-status-error'}`}
                >
                  {verifyData.verified
                    ? 'Signature Verification PASSED'
                    : 'Signature Verification FAILED'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Algorithm: </span>
                  <span className="text-primary font-medium">{verifyData.algorithm}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Security level: </span>
                  <span className="text-status-success">{verifyData.nistLevel}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Signer: </span>
                  <span className="font-mono text-foreground/80">{verifyData.signerDN}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Valid from: </span>
                  <span className="font-mono text-foreground/80">{verifyData.validFrom}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Valid until: </span>
                  <span className="font-mono text-foreground/80">{verifyData.validUntil}</span>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Info size={14} className="text-primary" aria-hidden="true" />
                <div className="text-xs font-bold text-foreground">
                  Migration Summary: RSA-2048 → ML-DSA-65
                </div>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-1.5 text-muted-foreground font-medium">Metric</th>
                    <th className="text-right py-1.5 text-muted-foreground font-medium">
                      RSA-2048
                    </th>
                    <th className="text-right py-1.5 text-muted-foreground font-medium">
                      ML-DSA-65
                    </th>
                    <th className="text-right py-1.5 text-muted-foreground font-medium">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { metric: 'Public key', rsa: '256 B', pqc: '1,952 B', change: '7.6×' },
                    { metric: 'Private key', rsa: '1,192 B', pqc: '4,032 B', change: '3.4×' },
                    { metric: 'Signature', rsa: '256 B', pqc: '3,309 B', change: '12.9×' },
                    { metric: 'Quantum-safe', rsa: 'No', pqc: 'Yes', change: '✓' },
                    { metric: 'NIST level', rsa: '~80-bit PQ', pqc: 'Level 3', change: '↑' },
                  ].map((row) => (
                    <tr key={row.metric} className="border-b border-border/50">
                      <td className="py-1.5 text-foreground">{row.metric}</td>
                      <td className="py-1.5 text-right font-mono text-status-error">{row.rsa}</td>
                      <td className="py-1.5 text-right font-mono text-primary">{row.pqc}</td>
                      <td className="py-1.5 text-right font-bold text-status-warning">
                        {row.change}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PKCS#11 Call Log */}
        {hsm.isReady && hsm.log.length > 0 && (
          <Pkcs11LogPanel
            log={hsm.log}
            onClear={hsm.clearLog}
            title="PKCS#11 Call Log"
            defaultOpen={false}
            className="mt-4"
            filterFns={LIVE_OPERATIONS}
          />
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-4 border-t border-border">
          <div className="flex gap-2">
            <Button
              onClick={handleBack}
              disabled={currentStep === 0}
              variant="outline"
              className="flex items-center gap-2"
            >
              &larr; Back
            </Button>
            <Button
              onClick={handleReset}
              variant="ghost"
              className="flex items-center gap-2 text-muted-foreground"
            >
              <RotateCcw size={14} />
              Reset
            </Button>
          </div>

          {currentStep < 3 ? (
            <Button
              onClick={handleNext}
              disabled={isProcessing}
              variant="gradient"
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Processing...
                </>
              ) : (
                <>
                  Next <ArrowRight size={14} />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => markComplete(3)}
              variant="gradient"
              className="flex items-center gap-2"
            >
              <CheckCircle size={14} />
              Complete
            </Button>
          )}
        </div>
      </div>

      {/* Educational note */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Note:</strong>{' '}
          {isLive
            ? 'All cryptographic operations execute in SoftHSM3 WASM — a reference PKCS#11 v3.2 implementation. Key sizes and signature sizes match the FIPS 204 (ML-DSA) specification exactly.'
            : 'In simulation mode, key and signature data are representative examples. Enable Live WASM mode to execute real PKCS#11 v3.2 operations.'}{' '}
          Generated keys are for educational purposes only.
        </p>
      </div>
    </div>
  )
}
