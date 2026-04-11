// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useCallback } from 'react'
import { Lock, Unlock, ArrowRight, Key } from 'lucide-react'
import { JOSE_KEY_AGREEMENT_ALGORITHMS, SAMPLE_JWT_PAYLOAD } from '../constants'
import { simulateHexBytes, simulateBase64url } from '../jwtUtils'
import { Button } from '@/components/ui/button'

type JWEStep = 'keygen' | 'encapsulate' | 'derive' | 'encrypt' | 'assemble'

const JWE_STEPS: { id: JWEStep; label: string; description: string }[] = [
  {
    id: 'keygen',
    label: '1. Generate ML-KEM-768 Keypair',
    description:
      'The recipient generates a ML-KEM-768 keypair. The public key (1,184 bytes) is shared; the private key is kept secret.',
  },
  {
    id: 'encapsulate',
    label: '2. Encapsulate Shared Secret',
    description:
      'The sender calls ML-KEM.Encaps(pk) which produces a shared secret (32 bytes) and a ciphertext (1,088 bytes). The ciphertext is included in the JWE encrypted key field.',
  },
  {
    id: 'derive',
    label: '3. Derive CEK via HKDF',
    description:
      'HKDF-SHA256 derives a Content Encryption Key (CEK) from the shared secret. The CEK is a 256-bit key for AES-256-GCM.',
  },
  {
    id: 'encrypt',
    label: '4. Encrypt Payload with AES-256-GCM',
    description:
      'The JWT payload is encrypted using AES-256-GCM with the derived CEK. This produces ciphertext and a 128-bit authentication tag.',
  },
  {
    id: 'assemble',
    label: '5. Assemble JWE',
    description:
      'The five JWE parts are assembled: JOSE header, KEM ciphertext (encrypted key), initialization vector, ciphertext, and authentication tag.',
  },
]

interface JWEResult {
  header: string
  encryptedKey: string
  iv: string
  ciphertext: string
  tag: string
  fullToken: string
  sharedSecret: string
  cek: string
}

export const JWEEncryption: React.FC = () => {
  const [activeStep, setActiveStep] = useState<JWEStep>('keygen')
  const [result, setResult] = useState<JWEResult | null>(null)
  const [isEncrypting, setIsEncrypting] = useState(false)
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [decrypted, setDecrypted] = useState(false)
  const [keypairGenerated, setKeypairGenerated] = useState(false)
  const [publicKeyHex, setPublicKeyHex] = useState('')

  const mlKem768 = JOSE_KEY_AGREEMENT_ALGORITHMS.find((a) => a.jose === 'ML-KEM-768')!

  const handleEncrypt = useCallback(() => {
    setIsEncrypting(true)
    setDecrypted(false)
    setActiveStep('keygen')

    // Simulate step-by-step encryption
    const steps: JWEStep[] = ['keygen', 'encapsulate', 'derive', 'encrypt', 'assemble']
    steps.forEach((step, idx) => {
      setTimeout(() => setActiveStep(step), idx * 600)
    })

    setTimeout(() => {
      const pkHex = simulateHexBytes(64)
      setPublicKeyHex(pkHex)
      setKeypairGenerated(true)

      // Build simulated JWE
      const headerJson = JSON.stringify({
        alg: 'ML-KEM-768',
        enc: 'A256GCM',
        typ: 'JWT',
      })
      const headerB64 = btoa(headerJson).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
      const encryptedKeyB64 = simulateBase64url(mlKem768.ctBytes!) // KEM ciphertext
      const ivB64 = simulateBase64url(12) // 96-bit IV for AES-GCM
      const ciphertextB64 = simulateBase64url(JSON.stringify(SAMPLE_JWT_PAYLOAD).length + 16)
      const tagB64 = simulateBase64url(16) // 128-bit auth tag
      const sharedSecret = simulateHexBytes(32)
      const cek = simulateHexBytes(32)

      const fullToken = `${headerB64}.${encryptedKeyB64}.${ivB64}.${ciphertextB64}.${tagB64}`

      setResult({
        header: headerB64,
        encryptedKey: encryptedKeyB64,
        iv: ivB64,
        ciphertext: ciphertextB64,
        tag: tagB64,
        fullToken,
        sharedSecret,
        cek,
      })
      setIsEncrypting(false)
    }, 3200)
  }, [mlKem768.ctBytes])

  const handleDecrypt = useCallback(() => {
    if (!result) return
    setIsDecrypting(true)

    setTimeout(() => {
      setDecrypted(true)
      setIsDecrypting(false)
    }, 800)
  }, [result])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">JWE Encryption with ML-KEM</h3>
        <p className="text-sm text-muted-foreground">
          Walk through the five-step JWE encryption flow using ML-KEM-768 for key agreement and
          AES-256-GCM for content encryption. All operations are simulated with realistic output.
        </p>
      </div>

      {/* JWE Format Explainer */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3">
          JWE Compact Serialization (5 parts)
        </h4>
        <div className="bg-background rounded-lg p-3 border border-border overflow-x-auto">
          <div className="flex flex-wrap gap-1 items-center text-xs font-mono">
            <span className="px-2 py-1 rounded bg-primary/10 text-primary">Header</span>
            <span className="text-muted-foreground font-bold">.</span>
            <span className="px-2 py-1 rounded bg-warning/10 text-warning">Encrypted Key</span>
            <span className="text-muted-foreground font-bold">.</span>
            <span className="px-2 py-1 rounded bg-secondary/10 text-secondary">IV</span>
            <span className="text-muted-foreground font-bold">.</span>
            <span className="px-2 py-1 rounded bg-destructive/10 text-destructive">Ciphertext</span>
            <span className="text-muted-foreground font-bold">.</span>
            <span className="px-2 py-1 rounded bg-success/10 text-success">Auth Tag</span>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Unlike JWS (3 parts), JWE has 5 base64url-encoded parts. The &quot;Encrypted Key&quot;
          field contains the ML-KEM ciphertext (1,088 bytes for ML-KEM-768).
        </p>
      </div>

      {/* Step Progress */}
      <div className="flex flex-wrap gap-2">
        {JWE_STEPS.map((step) => (
          <Button
            variant="ghost"
            key={step.id}
            onClick={() => setActiveStep(step.id)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeStep === step.id
                ? 'bg-primary/20 text-primary border border-primary/50'
                : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
            }`}
          >
            {step.label.split('.')[0]}
          </Button>
        ))}
      </div>

      {/* Step Description */}
      <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
        <div className="text-xs font-bold text-primary mb-1">
          {JWE_STEPS.find((s) => s.id === activeStep)?.label}
        </div>
        <p className="text-sm text-foreground">
          {JWE_STEPS.find((s) => s.id === activeStep)?.description}
        </p>
      </div>

      {/* Visual Pipeline */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3">Encryption Pipeline</h4>
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-0">
          {JWE_STEPS.map((step, idx) => (
            <React.Fragment key={step.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setActiveStep(step.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setActiveStep(step.id)
                  }
                }}
                className={`flex-1 text-center p-2 rounded-lg border transition-colors cursor-pointer ${
                  activeStep === step.id
                    ? 'bg-primary/10 border-primary/50 text-primary'
                    : JWE_STEPS.findIndex((s) => s.id === activeStep) > idx
                      ? 'bg-success/10 border-success/30 text-success'
                      : 'bg-muted/50 border-border text-muted-foreground'
                }`}
              >
                <div className="text-[10px] font-bold">{step.label.split('.')[0]}</div>
              </div>
              {idx < JWE_STEPS.length - 1 && (
                <ArrowRight
                  size={12}
                  className="text-muted-foreground hidden sm:block mx-0.5 shrink-0"
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Encrypt Button */}
      <div className="flex justify-center gap-3">
        <Button
          variant="ghost"
          onClick={handleEncrypt}
          disabled={isEncrypting}
          className="px-6 py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          <Lock size={16} />
          {isEncrypting ? 'Encrypting...' : 'Encrypt JWT Payload'}
        </Button>
        {result && (
          <Button
            variant="ghost"
            onClick={handleDecrypt}
            disabled={isDecrypting || decrypted}
            className="px-6 py-3 bg-secondary text-secondary-foreground font-bold rounded-lg hover:bg-secondary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <Unlock size={16} />
            {isDecrypting ? 'Decrypting...' : decrypted ? 'Decrypted' : 'Decrypt'}
          </Button>
        )}
      </div>

      {/* Intermediate Values */}
      {keypairGenerated && (
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-3">
            <Key size={16} className="text-primary" />
            <h4 className="text-sm font-bold text-foreground">Intermediate Cryptographic Values</h4>
          </div>
          <div className="space-y-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-[10px] font-bold text-primary mb-1">
                ML-KEM-768 Public Key ({mlKem768.keyBytes.toLocaleString()} bytes)
              </div>
              <code className="text-[10px] font-mono text-foreground/70 break-all">
                {publicKeyHex.substring(0, 96)}...
              </code>
            </div>
            {result && (
              <>
                <div className="bg-muted/50 rounded-lg p-3 border border-border">
                  <div className="text-[10px] font-bold text-warning mb-1">
                    Shared Secret (32 bytes)
                  </div>
                  <code className="text-[10px] font-mono text-foreground/70 break-all">
                    {result.sharedSecret}
                  </code>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 border border-border">
                  <div className="text-[10px] font-bold text-success mb-1">
                    Content Encryption Key / CEK (32 bytes, derived via HKDF)
                  </div>
                  <code className="text-[10px] font-mono text-foreground/70 break-all">
                    {result.cek}
                  </code>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* JWE Parts Display */}
      {result && (
        <div className="glass-panel p-4">
          <h4 className="text-sm font-bold text-foreground mb-3">JWE Token Parts</h4>
          <div className="space-y-3">
            {[
              { label: 'Header', value: result.header, color: 'text-primary', bg: 'bg-primary/10' },
              {
                label: `Encrypted Key (ML-KEM ct, ${mlKem768.ctBytes} B)`,
                value: result.encryptedKey,
                color: 'text-warning',
                bg: 'bg-warning/10',
              },
              {
                label: 'Initialization Vector (96-bit)',
                value: result.iv,
                color: 'text-secondary',
                bg: 'bg-secondary/10',
              },
              {
                label: 'Ciphertext (AES-256-GCM)',
                value: result.ciphertext,
                color: 'text-destructive',
                bg: 'bg-destructive/10',
              },
              {
                label: 'Authentication Tag (128-bit)',
                value: result.tag,
                color: 'text-success',
                bg: 'bg-success/10',
              },
            ].map((part) => (
              <div key={part.label} className="bg-muted/50 rounded-lg p-3 border border-border">
                <div className={`text-[10px] font-bold ${part.color} mb-1`}>{part.label}</div>
                <div className={`${part.bg} rounded p-2 overflow-x-auto`}>
                  <code className="text-[10px] font-mono text-foreground/70 break-all">
                    {part.value.substring(0, 120)}
                    {part.value.length > 120 && '...'}
                  </code>
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {part.value.length} base64url characters
                </div>
              </div>
            ))}

            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-[10px] font-bold text-foreground mb-1">Total JWE Size</div>
              <div className="text-sm font-mono font-bold text-foreground">
                {result.fullToken.length.toLocaleString()} characters (
                {(result.fullToken.length / 1024).toFixed(1)} KB)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Decrypted Payload */}
      {decrypted && (
        <div className="glass-panel p-4 border-success/20">
          <div className="flex items-center gap-2 mb-3">
            <Unlock size={16} className="text-success" />
            <h4 className="text-sm font-bold text-foreground">Decrypted Payload</h4>
            <span className="text-[10px] px-2 py-0.5 rounded border font-bold bg-success/20 text-success border-success/50">
              Integrity Verified
            </span>
          </div>
          <pre className="text-xs font-mono text-foreground/80 bg-background rounded p-3 border border-border overflow-x-auto">
            {JSON.stringify(SAMPLE_JWT_PAYLOAD, null, 2)}
          </pre>
          <p className="text-[10px] text-muted-foreground mt-2">
            Decryption: ML-KEM.Decaps(sk, ct) &rarr; shared_secret &rarr; HKDF &rarr; CEK &rarr;
            AES-GCM-Decrypt(CEK, iv, ciphertext, tag) &rarr; plaintext
          </p>
        </div>
      )}

      {/* Educational note */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Key insight:</strong> JWE with ML-KEM replaces the ECDH-ES key agreement step with
          KEM encapsulation. The rest of the JWE pipeline (AES-GCM content encryption) remains
          unchanged. The ML-KEM-768 ciphertext (1,088 bytes) goes in the &quot;encrypted key&quot;
          field where the ECDH ephemeral public key would normally appear.
        </p>
      </div>
    </div>
  )
}
