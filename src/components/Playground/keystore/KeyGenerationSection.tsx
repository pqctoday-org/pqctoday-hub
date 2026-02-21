import React, { useState } from 'react'
import {
  Key as KeyIcon,
  RefreshCw,
  Layers,
  Lock,
  Code,
  ChevronDown,
  Copy,
  Check,
} from 'lucide-react'

// Maps a selected algorithm/keySize to OpenSSL CLI + liboqs-python + Go snippets
function getCodeSnippets(
  algorithm: string,
  keySize: string
): { label: string; lang: string; code: string }[] {
  const algKey = algorithm.startsWith('ML-KEM')
    ? `ML-KEM-${keySize}`
    : algorithm.startsWith('ML-DSA')
      ? `ML-DSA-${keySize}`
      : keySize // HQC-*, FrodoKEM-*, SLH-DSA-*, FN-DSA-*, Classic-McEliece-*

  const isKEM =
    algKey.startsWith('ML-KEM') ||
    algKey.startsWith('HQC') ||
    algKey.startsWith('FrodoKEM') ||
    algKey.startsWith('Classic-McEliece')

  const isSig =
    algKey.startsWith('ML-DSA') || algKey.startsWith('SLH-DSA') || algKey.startsWith('FN-DSA')

  const opensslAlg = algKey.replace('FN-DSA-512', 'falcon512').replace('FN-DSA-1024', 'falcon1024')

  const opensslSnippet = `# OpenSSL 3.6+ — ${algKey}
openssl genpkey -algorithm ${opensslAlg} -out private.pem
openssl pkey -in private.pem -pubout -out public.pem`

  const pythonKEM = `# liboqs-python — ${algKey}
import oqs

with oqs.KeyEncapsulation("${algKey}") as kem:
    public_key = kem.generate_keypair()
    secret_key = kem.export_secret_key()

    # Encapsulate (sender)
    ciphertext, shared_secret_enc = kem.encap_secret(public_key)

    # Decapsulate (receiver)
    shared_secret_dec = kem.decap_secret(ciphertext)
    assert shared_secret_enc == shared_secret_dec`

  const pythonSig = `# liboqs-python — ${algKey}
import oqs

with oqs.Signature("${algKey}") as sig:
    public_key = sig.generate_keypair()
    secret_key = sig.export_secret_key()

    message = b"Hello, post-quantum world!"
    signature = sig.sign(message)
    valid = sig.verify(message, signature, public_key)
    assert valid`

  const goKEM = `// liboqs-go — ${algKey}
package main

import (
    "fmt"
    "github.com/open-quantum-safe/liboqs-go/oqs"
)

func main() {
    kem := oqs.NewKeyEncapsulation("${algKey}", nil)
    defer kem.Clean()

    pubKey, _ := kem.GenerateKeyPair()
    ciphertext, sharedSecretEnc, _ := kem.EncapSecret(pubKey)
    sharedSecretDec, _ := kem.DecapSecret(ciphertext)
    fmt.Println("Secrets match:", string(sharedSecretEnc) == string(sharedSecretDec))
}`

  const goSig = `// liboqs-go — ${algKey}
package main

import (
    "fmt"
    "github.com/open-quantum-safe/liboqs-go/oqs"
)

func main() {
    signer := oqs.NewSignature("${algKey}", nil)
    defer signer.Clean()

    pubKey, _ := signer.GenerateKeyPair()
    msg := []byte("Hello, post-quantum world!")
    signature, _ := signer.Sign(msg)

    verifier := oqs.NewSignature("${algKey}", nil)
    defer verifier.Clean()
    valid, _ := verifier.Verify(msg, signature, pubKey)
    fmt.Println("Valid:", valid)
}`

  const snippets = [{ label: 'OpenSSL CLI', lang: 'bash', code: opensslSnippet }]
  if (isKEM) {
    snippets.push({ label: 'Python (liboqs)', lang: 'python', code: pythonKEM })
    snippets.push({ label: 'Go (liboqs-go)', lang: 'go', code: goKEM })
  } else if (isSig) {
    snippets.push({ label: 'Python (liboqs)', lang: 'python', code: pythonSig })
    snippets.push({ label: 'Go (liboqs-go)', lang: 'go', code: goSig })
  }
  return snippets
}

function CodeSnippetPanel({ algorithm, keySize }: { algorithm: string; keySize: string }) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [copied, setCopied] = useState(false)

  const snippets = getCodeSnippets(algorithm, keySize)
  // eslint-disable-next-line security/detect-object-injection
  const active = snippets[activeTab] ?? snippets[0]

  const handleCopy = () => {
    if (!active) return
    navigator.clipboard.writeText(active.code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  if (snippets.length === 0) return null

  return (
    <div className="bg-muted/20 border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <Code size={14} />
          Code Reference
        </span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-border">
          {/* Tab bar */}
          <div className="flex border-b border-border bg-muted/10">
            {snippets.map((s, i) => (
              <button
                key={s.label}
                type="button"
                onClick={() => setActiveTab(i)}
                className={`px-3 py-2 text-xs font-medium transition-colors ${
                  i === activeTab
                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {s.label}
              </button>
            ))}
            <button
              type="button"
              onClick={handleCopy}
              className="ml-auto px-3 py-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
              aria-label="Copy code snippet"
            >
              {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          {/* Code block */}
          <pre className="p-4 text-xs font-mono text-foreground/90 overflow-x-auto leading-relaxed whitespace-pre bg-background/50">
            {active?.code}
          </pre>
        </div>
      )}
    </div>
  )
}

interface KeyGenerationSectionProps {
  algorithm: string
  keySize: string
  loading: boolean
  onAlgorithmChange: (algorithm: string) => void
  onKeySizeChange: (size: string) => void
  onGenerateKeys: () => void
  onUnifiedChange?: (algorithm: string, keySize: string) => void
  classicalAlgorithm: string
  classicalLoading: boolean
  onClassicalAlgorithmChange: (algorithm: string) => void
  onGenerateClassicalKeys: () => void
}

export const KeyGenerationSection: React.FC<KeyGenerationSectionProps> = ({
  algorithm,
  keySize,
  loading,
  onAlgorithmChange,
  onKeySizeChange,
  onGenerateKeys,
  onUnifiedChange,
  classicalAlgorithm,
  classicalLoading,
  onClassicalAlgorithmChange,
  onGenerateClassicalKeys,
}) => {
  return (
    <>
      {/* PQC Key Generation Section */}
      <div className="bg-muted/30 border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
          <Layers size={16} className="text-secondary" />
          <h5 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Generate New Keys
          </h5>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Algorithm & Key Size Selection */}
          <div className="space-y-2">
            <label
              htmlFor="keystore-key-size"
              className="text-xs font-medium text-muted-foreground block"
            >
              Algorithm & Security Level
            </label>
            <select
              id="keystore-key-size"
              value={keySize}
              onChange={(e) => {
                const val = e.target.value
                if (['512', '768', '1024'].includes(val)) {
                  // ML-KEM
                  if (onUnifiedChange) {
                    onUnifiedChange('ML-KEM', val)
                  } else {
                    if (algorithm !== 'ML-KEM') onAlgorithmChange('ML-KEM')
                    onKeySizeChange(val)
                  }
                } else if (
                  val.startsWith('HQC-') ||
                  val.startsWith('FrodoKEM-') ||
                  val.startsWith('Classic-McEliece-') ||
                  val.startsWith('SLH-DSA-') ||
                  val.startsWith('FN-DSA-')
                ) {
                  // HQC, FrodoKEM, Classic McEliece, SLH-DSA, or FN-DSA - pass the full algorithm name
                  if (onUnifiedChange) {
                    onUnifiedChange(val, val) // algorithm IS the keySize for these
                  } else {
                    onAlgorithmChange(val)
                    onKeySizeChange(val)
                  }
                } else {
                  // ML-DSA (44, 65, 87)
                  if (onUnifiedChange) {
                    onUnifiedChange('ML-DSA', val)
                  } else {
                    if (algorithm !== 'ML-DSA') onAlgorithmChange('ML-DSA')
                    onKeySizeChange(val)
                  }
                }
              }}
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary appearance-none transition-colors"
            >
              <optgroup label="ML-KEM (Key Encapsulation)">
                <option value="512">ML-KEM-512 (NIST Level 1)</option>
                <option value="768">ML-KEM-768 (NIST Level 3)</option>
                <option value="1024">ML-KEM-1024 (NIST Level 5)</option>
              </optgroup>
              <optgroup label="HQC (Code-Based KEM)">
                <option value="HQC-128">HQC-128 (NIST Level 1)</option>
                <option value="HQC-192">HQC-192 (NIST Level 3)</option>
                <option value="HQC-256">HQC-256 (NIST Level 5)</option>
              </optgroup>
              <optgroup label="FrodoKEM (Lattice-Based KEM)">
                <option value="FrodoKEM-640-AES">FrodoKEM-640-AES (Level 1)</option>
                <option value="FrodoKEM-976-AES">FrodoKEM-976-AES (Level 3)</option>
                <option value="FrodoKEM-1344-AES">FrodoKEM-1344-AES (Level 5)</option>
              </optgroup>
              <optgroup label="Classic McEliece (Code-Based KEM)">
                <option value="Classic-McEliece-348864">Classic McEliece 348864</option>
                <option value="Classic-McEliece-460896">Classic McEliece 460896</option>
                <option value="Classic-McEliece-6688128">Classic McEliece 6688128</option>
                <option value="Classic-McEliece-6960119">Classic McEliece 6960119</option>
                <option value="Classic-McEliece-8192128">Classic McEliece 8192128</option>
              </optgroup>
              <optgroup label="ML-DSA (Digital Signatures)">
                <option value="44">ML-DSA-44 (NIST Level 2)</option>
                <option value="65">ML-DSA-65 (NIST Level 3)</option>
                <option value="87">ML-DSA-87 (NIST Level 5)</option>
              </optgroup>
              <optgroup label="SLH-DSA (Hash-Based Signatures)">
                <option value="SLH-DSA-SHA2-128f">SLH-DSA-SHA2-128f (Level 1, Fast)</option>
                <option value="SLH-DSA-SHA2-128s">SLH-DSA-SHA2-128s (Level 1, Small)</option>
                <option value="SLH-DSA-SHAKE-128f">SLH-DSA-SHAKE-128f (Level 1, Fast)</option>
              </optgroup>
              <optgroup label="FN-DSA / Falcon (Signatures)">
                <option value="FN-DSA-512">FN-DSA-512 / Falcon-512 (Level 1)</option>
                <option value="FN-DSA-1024">FN-DSA-1024 / Falcon-1024 (Level 5)</option>
              </optgroup>
            </select>
          </div>

          {/* Generate Button */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground block opacity-0 select-none">
              Action
            </span>
            <button
              onClick={onGenerateKeys}
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 h-[42px] text-sm shadow-lg shadow-primary/20"
            >
              {loading ? <RefreshCw className="animate-spin" size={16} /> : <KeyIcon size={16} />}
              Generate Keys
            </button>
          </div>
        </div>
      </div>

      {/* Code snippet reference for selected PQC algorithm */}
      <CodeSnippetPanel algorithm={algorithm} keySize={keySize} />

      {/* Classical Algorithms Key Generation Section */}
      <div className="bg-muted/30 border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4 pb-3 border-border">
          <Lock size={16} className="text-accent" />
          <h5 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Generate Classical Keys
          </h5>
          <span className="text-xs text-muted-foreground ml-auto">(Web Crypto API)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Algorithm Selection */}
          <div className="space-y-2">
            <label
              htmlFor="classical-algo-select"
              className="text-xs font-medium text-muted-foreground block"
            >
              Classical Algorithm
            </label>
            <select
              id="classical-algo-select"
              value={classicalAlgorithm}
              onChange={(e) => onClassicalAlgorithmChange(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
            >
              <optgroup label="Signature Algorithms">
                <option value="RSA-2048">RSA-2048 (2048 bits)</option>
                <option value="RSA-3072">RSA-3072 (3072 bits)</option>
                <option value="RSA-4096">RSA-4096 (4096 bits)</option>
                <option value="ECDSA-P256">ECDSA P-256 (NIST)</option>
                <option value="Ed25519">Ed25519 (Curve25519)</option>
              </optgroup>
              <optgroup label="Key Exchange">
                <option value="X25519">X25519 (Curve25519)</option>
                <option value="P-256">P-256 ECDH (NIST)</option>
              </optgroup>
              <optgroup label="Symmetric Encryption">
                <option value="AES-128">AES-128-GCM</option>
                <option value="AES-256">AES-256-GCM</option>
              </optgroup>
            </select>
          </div>

          {/* Generate Button */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground block opacity-0 select-none">
              Action
            </span>
            <button
              onClick={onGenerateClassicalKeys}
              disabled={classicalLoading}
              className="w-full btn-primary flex items-center justify-center gap-2 h-[42px] text-sm shadow-lg shadow-accent/20"
            >
              {classicalLoading ? (
                <RefreshCw className="animate-spin" size={16} />
              ) : (
                <Lock size={16} />
              )}
              Generate Classical Keys
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
