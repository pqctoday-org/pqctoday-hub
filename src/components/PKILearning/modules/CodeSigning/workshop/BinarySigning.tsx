import React, { useState, useCallback } from 'react'
import { Key, PenLine, CheckCircle, Loader2, Copy, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CODE_SIGNING_ALGORITHMS } from '../constants'

type AlgorithmName = 'ML-DSA-44' | 'ML-DSA-65' | 'ML-DSA-87'

interface KeyPair {
  publicKey: string
  privateKey: string
  algorithm: AlgorithmName
}

interface SignatureResult {
  hash: string
  signature: string
  sigBytes: number
  verified: boolean
}

/** Generate realistic-looking hex string of a given byte length */
function generateHex(bytes: number): string {
  const chars = '0123456789abcdef'
  let result = ''
  for (let i = 0; i < bytes * 2; i++) {
    result += chars[Math.floor(Math.random() * 16)]
  }
  return result
}

/** Simulate SHA-256 hash (always 32 bytes / 64 hex chars) */
function simulateSha256(input: string): string {
  // Deterministic-looking hash based on input length and first chars
  let seed = 0
  for (let i = 0; i < input.length; i++) {
    seed = (seed * 31 + input.charCodeAt(i)) & 0xffffffff
  }
  const chars = '0123456789abcdef'
  let result = ''
  for (let i = 0; i < 64; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    result += chars[seed % 16]
  }
  return result
}

const ALGORITHM_OPTIONS: { name: AlgorithmName; level: string }[] = [
  { name: 'ML-DSA-44', level: 'NIST Level 2' },
  { name: 'ML-DSA-65', level: 'NIST Level 3' },
  { name: 'ML-DSA-87', level: 'NIST Level 5' },
]

export const BinarySigning: React.FC = () => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmName>('ML-DSA-65')
  const [keyPair, setKeyPair] = useState<KeyPair | null>(null)
  const [inputText, setInputText] = useState('Hello, Post-Quantum World!')
  const [signatureResult, setSignatureResult] = useState<SignatureResult | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const algInfo = CODE_SIGNING_ALGORITHMS.pqc.find((a) => a.name === selectedAlgorithm)

  const handleGenerateKeypair = useCallback(async () => {
    setIsGenerating(true)
    setKeyPair(null)
    setSignatureResult(null)

    // Simulate async keygen delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    const keyBytes = algInfo?.keyBytes ?? 1952
    setKeyPair({
      publicKey: generateHex(keyBytes),
      privateKey: generateHex(keyBytes + 64),
      algorithm: selectedAlgorithm,
    })
    setIsGenerating(false)
  }, [selectedAlgorithm, algInfo])

  const handleSign = useCallback(async () => {
    if (!keyPair || !inputText.trim()) return

    setIsSigning(true)
    setSignatureResult(null)

    // Simulate signing delay
    await new Promise((resolve) => setTimeout(resolve, 600))

    const sigBytes = algInfo?.sigBytes ?? 3309
    const hash = simulateSha256(inputText)
    const signature = generateHex(sigBytes)

    setSignatureResult({
      hash,
      signature,
      sigBytes,
      verified: true,
    })
    setIsSigning(false)
  }, [keyPair, inputText, algInfo])

  const handleReset = () => {
    setKeyPair(null)
    setSignatureResult(null)
    setInputText('Hello, Post-Quantum World!')
  }

  const handleCopy = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 1500)
    })
  }, [])

  const truncateHex = (hex: string, maxChars: number = 80): string => {
    if (hex.length <= maxChars) return hex
    return `${hex.slice(0, maxChars / 2)}...${hex.slice(-maxChars / 2)}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Binary Signing with ML-DSA</h3>
        <p className="text-sm text-muted-foreground">
          Select an algorithm, generate a keypair, sign input data, and verify the signature. All
          operations are simulated with realistic output sizes.
        </p>
      </div>

      {/* Algorithm Selection */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3">1. Select Algorithm</h4>
        <div className="flex flex-wrap gap-2">
          {ALGORITHM_OPTIONS.map((alg) => (
            <button
              key={alg.name}
              onClick={() => {
                setSelectedAlgorithm(alg.name)
                setKeyPair(null)
                setSignatureResult(null)
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedAlgorithm === alg.name
                  ? 'bg-primary/20 text-primary border border-primary/50'
                  : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
              }`}
            >
              <div>{alg.name}</div>
              <div className="text-[10px] opacity-70">{alg.level}</div>
            </button>
          ))}
        </div>
        {algInfo && (
          <div className="mt-3 text-xs text-muted-foreground">
            Public key: <span className="font-mono">{algInfo.keyBytes.toLocaleString()}</span> bytes
            &middot; Signature:{' '}
            <span className="font-mono">{algInfo.sigBytes.toLocaleString()}</span> bytes
          </div>
        )}
      </div>

      {/* Key Generation */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-foreground">2. Generate Keypair</h4>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleGenerateKeypair}
              disabled={isGenerating}
              className="text-sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-1" /> Generating...
                </>
              ) : (
                <>
                  <Key size={14} className="mr-1" /> Generate Keypair
                </>
              )}
            </Button>
            {keyPair && (
              <Button variant="ghost" onClick={handleReset} className="text-sm">
                <RotateCcw size={14} className="mr-1" /> Reset
              </Button>
            )}
          </div>
        </div>

        {keyPair && (
          <div className="space-y-3 animate-fade-in">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-foreground">
                  Public Key ({keyPair.algorithm})
                </span>
                <button
                  onClick={() => handleCopy(keyPair.publicKey, 'pubkey')}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copiedField === 'pubkey' ? (
                    <CheckCircle size={12} className="text-success" />
                  ) : (
                    <Copy size={12} />
                  )}
                </button>
              </div>
              <p className="font-mono text-[10px] text-muted-foreground break-all leading-relaxed">
                {truncateHex(keyPair.publicKey)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {(keyPair.publicKey.length / 2).toLocaleString()} bytes
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-foreground">
                  Private Key (truncated for display)
                </span>
                <button
                  onClick={() => handleCopy(keyPair.privateKey, 'privkey')}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copiedField === 'privkey' ? (
                    <CheckCircle size={12} className="text-success" />
                  ) : (
                    <Copy size={12} />
                  )}
                </button>
              </div>
              <p className="font-mono text-[10px] text-muted-foreground break-all leading-relaxed">
                {truncateHex(keyPair.privateKey)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {(keyPair.privateKey.length / 2).toLocaleString()} bytes
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Sign Input */}
      {keyPair && (
        <div className="glass-panel p-4 animate-fade-in">
          <h4 className="text-sm font-bold text-foreground mb-3">3. Sign Data</h4>
          <div className="space-y-3">
            <div>
              <label
                htmlFor="sign-input"
                className="text-xs font-medium text-muted-foreground mb-1 block"
              >
                Data to sign
              </label>
              <textarea
                id="sign-input"
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value)
                  setSignatureResult(null)
                }}
                className="w-full rounded-lg bg-muted/50 border border-border p-3 text-sm text-foreground font-mono resize-none focus:outline-none focus:border-primary/50"
                rows={3}
                placeholder="Enter text to sign..."
              />
            </div>
            <Button
              variant="gradient"
              onClick={handleSign}
              disabled={isSigning || !inputText.trim()}
              className="text-sm"
            >
              {isSigning ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-1" /> Signing...
                </>
              ) : (
                <>
                  <PenLine size={14} className="mr-1" /> Sign
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Signature Result */}
      {signatureResult && (
        <div className="glass-panel p-4 animate-fade-in">
          <h4 className="text-sm font-bold text-foreground mb-3">4. Result</h4>
          <div className="space-y-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <span className="text-xs font-bold text-foreground">SHA-256 Hash</span>
              <p className="font-mono text-[10px] text-muted-foreground break-all mt-1">
                {signatureResult.hash}
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-foreground">
                  Signature ({selectedAlgorithm})
                </span>
                <button
                  onClick={() => handleCopy(signatureResult.signature, 'sig')}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copiedField === 'sig' ? (
                    <CheckCircle size={12} className="text-success" />
                  ) : (
                    <Copy size={12} />
                  )}
                </button>
              </div>
              <p className="font-mono text-[10px] text-muted-foreground break-all leading-relaxed">
                {truncateHex(signatureResult.signature, 120)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {signatureResult.sigBytes.toLocaleString()} bytes
              </p>
            </div>
            <div
              className={`rounded-lg p-3 border ${
                signatureResult.verified
                  ? 'bg-success/10 border-success/30'
                  : 'bg-destructive/10 border-destructive/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle
                  size={16}
                  className={signatureResult.verified ? 'text-success' : 'text-destructive'}
                />
                <span
                  className={`text-sm font-bold ${signatureResult.verified ? 'text-success' : 'text-destructive'}`}
                >
                  {signatureResult.verified ? 'Signature Verified' : 'Verification Failed'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Verification performed using the {selectedAlgorithm} public key against the SHA-256
                hash of the input data.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-side Size Comparison */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3">
          Signature Size Comparison Across Algorithms
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-2 text-muted-foreground font-medium">Algorithm</th>
                <th className="text-right p-2 text-muted-foreground font-medium">Signature</th>
                <th className="text-right p-2 text-muted-foreground font-medium">Public Key</th>
                <th className="text-center p-2 text-muted-foreground font-medium">Quantum Safe</th>
              </tr>
            </thead>
            <tbody>
              {[...CODE_SIGNING_ALGORITHMS.classical, ...CODE_SIGNING_ALGORITHMS.pqc]
                .filter((a) =>
                  [
                    'ECDSA P-256',
                    'Ed25519',
                    'RSA-4096',
                    'ML-DSA-44',
                    'ML-DSA-65',
                    'ML-DSA-87',
                  ].includes(a.name)
                )
                .map((alg) => (
                  <tr
                    key={alg.name}
                    className={`border-b border-border/50 ${alg.name === selectedAlgorithm ? 'bg-primary/5' : ''}`}
                  >
                    <td className="p-2 font-mono text-xs text-foreground">
                      {alg.name}
                      {alg.name === selectedAlgorithm && (
                        <span className="ml-2 text-[10px] text-primary font-bold">(selected)</span>
                      )}
                    </td>
                    <td className="p-2 text-right font-mono text-xs text-foreground">
                      {alg.sigBytes.toLocaleString()} B
                    </td>
                    <td className="p-2 text-right font-mono text-xs text-foreground">
                      {alg.keyBytes.toLocaleString()} B
                    </td>
                    <td className="p-2 text-center">
                      {alg.broken ? (
                        <span className="text-destructive font-bold text-xs">No</span>
                      ) : (
                        <span className="text-success font-bold text-xs">Yes</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Educational note */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Note:</strong> All cryptographic operations shown here are simulated with
          realistic output sizes matching the actual FIPS 204 (ML-DSA) specification. In a
          production environment, signing would use a hardware security module (HSM) or a
          FIPS-validated software library. Generated keys are for educational purposes only.
        </p>
      </div>
    </div>
  )
}
