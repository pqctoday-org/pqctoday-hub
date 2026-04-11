// SPDX-License-Identifier: GPL-3.0-only
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
import { FilterDropdown } from '../../common/FilterDropdown'
import { Button } from '@/components/ui/button'

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
      <Button
        variant="ghost"
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
      </Button>

      {open && (
        <div className="border-t border-border">
          {/* Tab bar */}
          <div className="flex border-b border-border bg-muted/10">
            {snippets.map((s, i) => (
              <Button
                variant="ghost"
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
              </Button>
            ))}
            <Button
              variant="ghost"
              type="button"
              onClick={handleCopy}
              className="ml-auto px-3 py-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
              aria-label="Copy code snippet"
            >
              {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
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
  hideSnippets?: boolean
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
  hideSnippets,
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
            <span className="text-xs font-medium text-muted-foreground block">
              Algorithm & Security Level
            </span>
            <FilterDropdown
              selectedId={keySize}
              onSelect={(val) => {
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
                  val.startsWith('FN-DSA-') ||
                  val.startsWith('LMS-')
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
              items={[
                { id: '512', label: 'ML-KEM-512 (NIST Level 1)' },
                { id: '768', label: 'ML-KEM-768 (NIST Level 3)' },
                { id: '1024', label: 'ML-KEM-1024 (NIST Level 5)' },
                { id: 'HQC-128', label: 'HQC-128 (NIST Level 1)' },
                { id: 'HQC-192', label: 'HQC-192 (NIST Level 3)' },
                { id: 'HQC-256', label: 'HQC-256 (NIST Level 5)' },
                { id: 'FrodoKEM-640-AES', label: 'FrodoKEM-640-AES (Level 1)' },
                { id: 'FrodoKEM-976-AES', label: 'FrodoKEM-976-AES (Level 3)' },
                { id: 'FrodoKEM-1344-AES', label: 'FrodoKEM-1344-AES (Level 5)' },
                { id: 'Classic-McEliece-348864', label: 'Classic McEliece 348864' },
                { id: 'Classic-McEliece-460896', label: 'Classic McEliece 460896' },
                { id: 'Classic-McEliece-6688128', label: 'Classic McEliece 6688128' },
                { id: 'Classic-McEliece-6960119', label: 'Classic McEliece 6960119' },
                { id: 'Classic-McEliece-8192128', label: 'Classic McEliece 8192128' },
                { id: '44', label: 'ML-DSA-44 (NIST Level 2)' },
                { id: '65', label: 'ML-DSA-65 (NIST Level 3)' },
                { id: '87', label: 'ML-DSA-87 (NIST Level 5)' },
                { id: 'SLH-DSA-SHA2-128f', label: 'SLH-DSA-SHA2-128f (Level 1, Fast)' },
                { id: 'SLH-DSA-SHA2-128s', label: 'SLH-DSA-SHA2-128s (Level 1, Small)' },
                { id: 'SLH-DSA-SHA2-192f', label: 'SLH-DSA-SHA2-192f (Level 3, Fast)' },
                { id: 'SLH-DSA-SHA2-192s', label: 'SLH-DSA-SHA2-192s (Level 3, Small)' },
                { id: 'SLH-DSA-SHA2-256f', label: 'SLH-DSA-SHA2-256f (Level 5, Fast)' },
                { id: 'SLH-DSA-SHA2-256s', label: 'SLH-DSA-SHA2-256s (Level 5, Small)' },
                { id: 'SLH-DSA-SHAKE-128f', label: 'SLH-DSA-SHAKE-128f (Level 1, Fast)' },
                { id: 'SLH-DSA-SHAKE-128s', label: 'SLH-DSA-SHAKE-128s (Level 1, Small)' },
                { id: 'SLH-DSA-SHAKE-192f', label: 'SLH-DSA-SHAKE-192f (Level 3, Fast)' },
                { id: 'SLH-DSA-SHAKE-192s', label: 'SLH-DSA-SHAKE-192s (Level 3, Small)' },
                { id: 'SLH-DSA-SHAKE-256f', label: 'SLH-DSA-SHAKE-256f (Level 5, Fast)' },
                { id: 'SLH-DSA-SHAKE-256s', label: 'SLH-DSA-SHAKE-256s (Level 5, Small)' },
                { id: 'FN-DSA-512', label: 'FN-DSA-512 / Falcon-512 (Level 1)' },
                { id: 'FN-DSA-1024', label: 'FN-DSA-1024 / Falcon-1024 (Level 5)' },
                { id: 'LMS-SHA256-H10', label: 'LMS SHA-256 H=10 (1,024 sigs)' },
                { id: 'LMS-SHA256-H15', label: 'LMS SHA-256 H=15 (32,768 sigs)' },
                { id: 'LMS-SHA256-H20', label: 'LMS SHA-256 H=20 (1,048,576 sigs)' },
              ]}
              defaultLabel="Select Algorithm..."
              noContainer
            />
          </div>

          {/* Generate Button */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground block opacity-0 select-none">
              Action
            </span>
            <Button
              variant="ghost"
              onClick={onGenerateKeys}
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 h-[42px] text-sm shadow-lg shadow-primary/20"
            >
              {loading ? <RefreshCw className="animate-spin" size={16} /> : <KeyIcon size={16} />}
              Generate Keys
            </Button>
          </div>
        </div>
      </div>

      {/* Code snippet reference for selected PQC algorithm */}
      {!hideSnippets && <CodeSnippetPanel algorithm={algorithm} keySize={keySize} />}

      {/* Classical Algorithms Key Generation Section */}
      <div className="bg-muted/30 border border-border rounded-xl p-6 mt-4">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
          <Lock size={16} className="text-accent" />
          <h5 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Generate Classical Keys
          </h5>
          {!hideSnippets && (
            <span className="text-xs text-muted-foreground ml-auto">(Web Crypto API)</span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Algorithm Selection */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground block">
              Classical Algorithm
            </span>
            <FilterDropdown
              selectedId={classicalAlgorithm}
              onSelect={(id) => onClassicalAlgorithmChange(id)}
              items={[
                { id: 'RSA-2048', label: 'RSA-2048 (2048 bits)' },
                { id: 'RSA-3072', label: 'RSA-3072 (3072 bits)' },
                { id: 'RSA-4096', label: 'RSA-4096 (4096 bits)' },
                { id: 'ECDSA-P256', label: 'ECDSA P-256 (NIST)' },
                { id: 'ECDSA-P384', label: 'ECDSA P-384 (NIST)' },
                { id: 'ECDSA-P521', label: 'ECDSA P-521 (NIST)' },
                { id: 'Ed25519', label: 'Ed25519 (Curve25519)' },
                { id: 'Ed448', label: 'Ed448 (Curve448)' },
                { id: 'secp256k1', label: 'secp256k1 (Bitcoin/Ethereum)' },
                { id: 'X25519', label: 'X25519 (Curve25519)' },
                { id: 'X448', label: 'X448 (Curve448)' },
                { id: 'P-256', label: 'P-256 ECDH (NIST)' },
                { id: 'P-384', label: 'P-384 ECDH (NIST)' },
                { id: 'P-521', label: 'P-521 ECDH (NIST)' },
                { id: 'DH-2048', label: 'DH-2048 (Deprecated)' },
                { id: 'AES-128', label: 'AES-128-GCM' },
                { id: 'AES-192', label: 'AES-192-GCM' },
                { id: 'AES-256', label: 'AES-256-GCM' },
              ]}
              defaultLabel="Select Algorithm..."
              noContainer
            />
          </div>

          {/* Generate Button */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground block opacity-0 select-none">
              Action
            </span>
            <Button
              variant="ghost"
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
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
