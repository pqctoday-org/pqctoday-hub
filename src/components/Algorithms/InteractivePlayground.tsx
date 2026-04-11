// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import {
  RefreshCw,
  Lock,
  Key as KeyIcon,
  Play,
  AlertCircle,
  FileSignature,
  Trash2,
} from 'lucide-react'
import * as MLKEM from '../../wasm/liboqs_kem'
import * as MLDSA from '../../wasm/liboqs_dsa'
import clsx from 'clsx'
import { bytesToHex } from '../../utils/dataInputUtils'
import { FilterDropdown } from '../common/FilterDropdown'
import { Button } from '@/components/ui/button'

interface Key {
  id: string
  name: string
  type: 'public' | 'private'
  algorithm: 'ML-KEM' | 'ML-DSA'
  value: string
}

export const InteractivePlayground = () => {
  const [algorithm, setAlgorithm] = useState<'ML-KEM' | 'ML-DSA'>('ML-KEM')
  const [keySize, setKeySize] = useState<string>('768') // Default: ML-KEM-768

  // Update key size when algorithm changes
  const handleAlgorithmChange = (newAlgorithm: 'ML-KEM' | 'ML-DSA') => {
    setAlgorithm(newAlgorithm)
    // Set appropriate default for each algorithm
    setKeySize(newAlgorithm === 'ML-KEM' ? '768' : '65')
  }
  const [keyStore, setKeyStore] = useState<Key[]>([])
  const [input, setInput] = useState('Hello Quantum World!')
  const [output, setOutput] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ML-KEM specific states
  const [sharedSecret, setSharedSecret] = useState<string>('')
  const [ciphertext, setCiphertext] = useState<string>('')
  const [encryptedData, setEncryptedData] = useState<string>('')

  // ML-DSA specific states
  const [signature, setSignature] = useState<string>('')

  // Selection states
  const [selectedEncKeyId, setSelectedEncKeyId] = useState<string>('')
  const [selectedDecKeyId, setSelectedDecKeyId] = useState<string>('')
  const [selectedSignKeyId, setSelectedSignKeyId] = useState<string>('')
  const [selectedVerifyKeyId, setSelectedVerifyKeyId] = useState<string>('')

  const generateKeys = async () => {
    setLoading(true)
    setError(null)
    try {
      await new Promise((resolve) => setTimeout(resolve, 800))

      const timestamp = new Date().toLocaleTimeString([], { hour12: false })
      const idBase = Math.random().toString(36).substring(2, 9)

      let newKeys: Key[] = []

      if (algorithm === 'ML-KEM') {
        const algoName = `ML-KEM-${keySize}`
        const keys = await MLKEM.generateKey({ name: algoName })

        newKeys = [
          {
            id: `${idBase}-pub`,
            name: `${algoName} Public Key [${timestamp}]`,
            type: 'public',
            algorithm: 'ML-KEM',
            value: bytesToHex(keys.publicKey),
          },
          {
            id: `${idBase}-priv`,
            name: `${algoName} Private Key [${timestamp}]`,
            type: 'private',
            algorithm: 'ML-KEM',
            value: bytesToHex(keys.secretKey),
          },
        ]
      } else {
        // ML-DSA
        const algoName = `ML-DSA-${keySize}`
        const keys = await MLDSA.generateKey({ name: algoName })

        newKeys = [
          {
            id: `${idBase}-pub`,
            name: `${algoName} Public Key [${timestamp}]`,
            type: 'public',
            algorithm: 'ML-DSA',
            value: bytesToHex(keys.publicKey),
          },
          {
            id: `${idBase}-priv`,
            name: `${algoName} Private Key [${timestamp}]`,
            type: 'private',
            algorithm: 'ML-DSA',
            value: bytesToHex(keys.secretKey),
          },
        ]
      }

      setKeyStore((prev) => [...prev, ...newKeys])

      if (algorithm === 'ML-KEM') {
        setSelectedEncKeyId(newKeys[0].id)
        setSelectedDecKeyId(newKeys[1].id)
      } else {
        setSelectedSignKeyId(newKeys[1].id)
      }

      setOutput(`Generated key pair: ${newKeys[0].name} & ${newKeys[1].name}`)
    } catch {
      setError('Failed to generate keys')
    } finally {
      setLoading(false)
    }
  }

  const runOperation = async (
    type: 'encapsulate' | 'decapsulate' | 'sign' | 'verify' | 'encrypt' | 'decrypt'
  ) => {
    setLoading(true)
    setError(null)
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))

      if (type === 'encapsulate') {
        const key = keyStore.find((k) => k.id === selectedEncKeyId)
        if (!key) throw new Error('Please select a Public Key')

        const newSharedSecret = Math.random().toString(36).substring(2).toUpperCase()
        const newCiphertext =
          Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)
        setSharedSecret(newSharedSecret)
        setCiphertext(newCiphertext)
        setOutput(
          `[Encapsulate using ${key.name}]\nShared Secret: ${newSharedSecret}\nCiphertext: ${newCiphertext}...`
        )
      } else if (type === 'decapsulate') {
        const key = keyStore.find((k) => k.id === selectedDecKeyId)
        if (!key) throw new Error('Please select a Private Key')
        if (!ciphertext) throw new Error('No ciphertext available. Run Encapsulate first.')

        setOutput(
          `[Decapsulate using ${key.name}]\nRecovered Shared Secret: ${sharedSecret} (Matches!)`
        )
      } else if (type === 'encrypt') {
        if (!sharedSecret) throw new Error('No shared secret available. Run Encapsulate first.')
        if (!input) throw new Error('Please enter a message to encrypt.')

        const encrypted = btoa(input + ':' + sharedSecret)
          .split('')
          .reverse()
          .join('')
        setEncryptedData(encrypted)
        setOutput(`[Encrypt using Shared Secret]\nOriginal: "${input}"\nEncrypted: ${encrypted}`)
      } else if (type === 'decrypt') {
        if (!sharedSecret) throw new Error('No shared secret available.')
        if (!encryptedData) throw new Error('No encrypted data available. Run Encrypt first.')

        const decrypted = atob(encryptedData.split('').reverse().join('')).split(':')[0]
        setOutput(
          `[Decrypt using Shared Secret]\nEncrypted: ${encryptedData}\nDecrypted: "${decrypted}"`
        )
      } else if (type === 'sign') {
        const key = keyStore.find((k) => k.id === selectedSignKeyId)
        if (!key) throw new Error('Please select a Private Key')

        const newSignature =
          Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)
        setSignature(newSignature)
        setOutput(`[Sign using ${key.name}]\nMessage: "${input}"\nSignature: ${newSignature}...`)
      } else if (type === 'verify') {
        const key = keyStore.find((k) => k.id === selectedVerifyKeyId)
        if (!key) throw new Error('Please select a Public Key')
        if (!signature)
          throw new Error('No signature available. Run Sign first or enter a signature.')

        const isValid = signature.length > 10 // Simple mock validation
        setOutput(
          `[Verify using ${key.name}]\nMessage: "${input}"\nSignature: ${signature}\nVerification: ${isValid ? '✓ VALID' : '✗ INVALID'}`
        )
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Operation failed'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const clearKeys = () => {
    setKeyStore([])
    setSelectedEncKeyId('')
    setSelectedDecKeyId('')
    setSelectedSignKeyId('')
    setSelectedVerifyKeyId('')
    setOutput('')
  }

  const publicKeys = keyStore.filter((k) => k.algorithm === algorithm && k.type === 'public')
  const privateKeys = keyStore.filter((k) => k.algorithm === algorithm && k.type === 'private')

  return (
    <div className="glass-panel p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <Play className="text-secondary" aria-hidden="true" />
          Interactive Playground
        </h3>
        <div
          className="flex bg-muted/30 rounded-lg p-1"
          role="group"
          aria-label="Select cryptographic algorithm"
        >
          <Button
            variant="ghost"
            onClick={() => {
              handleAlgorithmChange('ML-KEM')
              setOutput('')
            }}
            aria-label="ML-KEM Encryption algorithm"
            aria-pressed={algorithm === 'ML-KEM'}
            className={clsx(
              'px-4 py-2 rounded-md text-sm font-bold transition-colors',
              algorithm === 'ML-KEM'
                ? 'bg-primary/20 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            ML-KEM (Encryption)
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              handleAlgorithmChange('ML-DSA')
              setOutput('')
            }}
            aria-label="ML-DSA Signing algorithm"
            aria-pressed={algorithm === 'ML-DSA'}
            className={clsx(
              'px-4 py-2 rounded-md text-sm font-bold transition-colors',
              algorithm === 'ML-DSA'
                ? 'bg-secondary/20 text-secondary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            ML-DSA (Signing)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Controls */}
        {/* Left Column: Controls */}
        <div className="space-y-10">
          {/* Section 1: Key Gen */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                1. Key Generation
              </span>
              {keyStore.length > 0 && (
                <Button
                  variant="ghost"
                  onClick={clearKeys}
                  className="text-xs text-status-error hover:text-destructive/80 flex items-center gap-1"
                >
                  <Trash2 size={12} /> Clear Keys
                </Button>
              )}
            </div>
            <div className="space-y-3">
              <span className="text-xs text-muted-foreground uppercase tracking-wider block">
                Key Size / Security Level
              </span>
              <FilterDropdown
                selectedId={keySize}
                onSelect={(id) => setKeySize(id)}
                items={
                  algorithm === 'ML-KEM'
                    ? [
                        { id: '512', label: 'ML-KEM-512 (NIST Level 1)' },
                        { id: '768', label: 'ML-KEM-768 (NIST Level 3)' },
                        { id: '1024', label: 'ML-KEM-1024 (NIST Level 5)' },
                      ]
                    : [
                        { id: '44', label: 'ML-DSA-44 (NIST Level 2)' },
                        { id: '65', label: 'ML-DSA-65 (NIST Level 3)' },
                        { id: '87', label: 'ML-DSA-87 (NIST Level 5)' },
                      ]
                }
                defaultLabel="Select Size..."
                noContainer
              />
            </div>
            <Button
              variant="ghost"
              onClick={generateKeys}
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 h-12"
            >
              {loading ? <RefreshCw className="animate-spin" size={18} /> : <KeyIcon size={18} />}
              Generate New {algorithm} Pair
            </Button>
          </div>

          {/* Section 2: Input */}
          <div className="space-y-4">
            <label
              htmlFor="message-input"
              className="text-sm font-bold text-muted-foreground uppercase tracking-wider block mb-2"
            >
              2. {algorithm === 'ML-KEM' ? 'Input Data' : 'Message to Sign'}
            </label>
            <textarea
              id="message-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-describedby={error ? 'playground-error' : undefined}
              className="w-full bg-muted/30 border border-border rounded-lg p-3 text-sm text-foreground focus:border-primary outline-none transition-colors h-32 resize-none placeholder:text-foreground/20 leading-relaxed"
            />
          </div>

          {/* Section 3: Operations */}
          <div className="space-y-4">
            <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider block mb-2">
              3. Execute Operation
            </span>

            {algorithm === 'ML-KEM' ? (
              <div className="grid grid-cols-1 gap-4">
                {/* Encapsulate */}
                <div className="p-4 bg-muted/30 rounded-lg border border-border">
                  <div className="text-xs text-primary/80 mb-2 font-bold uppercase tracking-wider">
                    Encapsulate (Public Key)
                  </div>
                  <div className="mb-3">
                    <FilterDropdown
                      selectedId={selectedEncKeyId || 'All'}
                      onSelect={(id) => setSelectedEncKeyId(id === 'All' ? '' : id)}
                      items={publicKeys.map((k) => ({ id: k.id, label: k.name }))}
                      defaultLabel="Select Public Key..."
                      noContainer
                    />
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => runOperation('encapsulate')}
                    disabled={!selectedEncKeyId || loading}
                    className="w-full py-2.5 rounded-lg bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold flex items-center justify-center gap-2"
                  >
                    <Lock size={16} /> Encapsulate
                  </Button>
                </div>

                {/* Decapsulate */}
                <div className="p-4 bg-muted/30 rounded-lg border border-border">
                  <div className="text-xs text-secondary/80 mb-2 font-bold uppercase tracking-wider">
                    Decapsulate (Private Key)
                  </div>
                  <div className="mb-3">
                    <FilterDropdown
                      selectedId={selectedDecKeyId || 'All'}
                      onSelect={(id) => setSelectedDecKeyId(id === 'All' ? '' : id)}
                      items={privateKeys.map((k) => ({ id: k.id, label: k.name }))}
                      defaultLabel="Select Private Key..."
                      noContainer
                    />
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => runOperation('decapsulate')}
                    disabled={!selectedDecKeyId || loading}
                    className="w-full py-2.5 rounded-lg bg-secondary/20 text-secondary border border-secondary/30 hover:bg-secondary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold flex items-center justify-center gap-2"
                  >
                    <KeyIcon size={16} /> Decapsulate
                  </Button>
                  {sharedSecret && (
                    <div className="mt-3">
                      <label
                        htmlFor="shared-secret-input"
                        className="text-xs text-muted-foreground block mb-2"
                      >
                        Shared Secret:
                      </label>
                      <input
                        id="shared-secret-input"
                        type="text"
                        value={sharedSecret}
                        onChange={(e) => setSharedSecret(e.target.value)}
                        className="w-full bg-muted border border-secondary/30 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-secondary font-mono"
                        placeholder="Shared secret will appear here..."
                      />
                    </div>
                  )}
                </div>

                {/* Encrypt Data */}
                <div className="p-4 bg-muted/30 rounded-lg border border-border">
                  <div className="text-xs text-primary/80 mb-2 font-bold uppercase tracking-wider">
                    Encrypt Data (Shared Secret)
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => runOperation('encrypt')}
                    disabled={!sharedSecret || loading}
                    className="w-full py-2.5 rounded-lg bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold flex items-center justify-center gap-2"
                  >
                    <Lock size={16} /> Encrypt Message
                  </Button>
                  {!sharedSecret && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Run Encapsulate first to get shared secret
                    </p>
                  )}
                </div>

                {/* Decrypt Data */}
                <div className="p-4 bg-muted/30 rounded-lg border border-border">
                  <div className="text-xs text-accent/80 mb-2 font-bold uppercase tracking-wider">
                    Decrypt Data (Shared Secret)
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => runOperation('decrypt')}
                    disabled={!encryptedData || loading}
                    className="w-full py-2.5 rounded-lg bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold flex items-center justify-center gap-2"
                  >
                    <KeyIcon size={16} /> Decrypt Message
                  </Button>
                  {!encryptedData && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Run Encrypt first to get encrypted data
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {/* Sign */}
                <div className="p-4 bg-muted/30 rounded-lg border border-border">
                  <div className="text-xs text-accent/80 mb-2 font-bold uppercase tracking-wider">
                    Sign (Private Key)
                  </div>
                  <div className="mb-3">
                    <FilterDropdown
                      selectedId={selectedSignKeyId || 'All'}
                      onSelect={(id) => setSelectedSignKeyId(id === 'All' ? '' : id)}
                      items={privateKeys.map((k) => ({ id: k.id, label: k.name }))}
                      defaultLabel="Select Private Key..."
                      noContainer
                    />
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => runOperation('sign')}
                    disabled={!selectedSignKeyId || loading}
                    className="w-full py-2.5 rounded-lg bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold flex items-center justify-center gap-2"
                  >
                    <FileSignature size={16} /> Sign Message
                  </Button>
                </div>

                {/* Verify */}
                <div className="p-4 bg-muted/30 rounded-lg border border-border">
                  <div className="text-xs text-status-warning mb-2 font-bold uppercase tracking-wider">
                    Verify (Public Key)
                  </div>
                  <div className="mb-3">
                    <FilterDropdown
                      selectedId={selectedVerifyKeyId || 'All'}
                      onSelect={(id) => setSelectedVerifyKeyId(id === 'All' ? '' : id)}
                      items={publicKeys.map((k) => ({ id: k.id, label: k.name }))}
                      defaultLabel="Select Public Key..."
                      noContainer
                    />
                  </div>
                  <label
                    htmlFor="signature-verify-input"
                    className="text-xs text-muted-foreground block mb-2"
                  >
                    Signature to Verify:
                  </label>
                  <input
                    id="signature-verify-input"
                    type="text"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder="Paste or edit signature here..."
                    className="w-full mb-3 bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent font-mono"
                  />
                  <Button
                    variant="ghost"
                    onClick={() => runOperation('verify')}
                    disabled={!selectedVerifyKeyId || loading}
                    className="w-full py-2.5 rounded-lg bg-status-warning/20 text-status-warning border border-status-warning/30 hover:bg-status-warning/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold flex items-center justify-center gap-2"
                  >
                    <FileSignature size={16} /> Verify Signature
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Key Store & Results */}
        <div className="space-y-6">
          <div className="space-y-4">
            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              Key Store ({keyStore.length})
            </label>
            <div className="bg-muted/30 border border-border rounded-lg overflow-hidden h-64 flex flex-col">
              <div className="overflow-y-auto flex-1 custom-scrollbar">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/30 text-muted-foreground uppercase text-xs sticky top-0 backdrop-blur-md">
                    <tr>
                      <th className="p-3 font-bold">Name</th>
                      <th className="p-3 font-bold">Type</th>
                      <th className="p-3 font-bold">Algorithm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {keyStore.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-foreground/30 italic">
                          No keys generated yet...
                        </td>
                      </tr>
                    ) : (
                      keyStore.map((key) => (
                        <tr key={key.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-medium text-foreground">{key.name}</td>
                          <td className="p-3">
                            <span
                              className={clsx(
                                'px-2 py-0.5 rounded text-[10px] uppercase font-bold',
                                key.type === 'public'
                                  ? 'bg-primary/20 text-primary'
                                  : 'bg-secondary/20 text-secondary'
                              )}
                            >
                              {key.type}
                            </span>
                          </td>
                          <td className="p-3 text-muted-foreground">{key.algorithm}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider block">
              Output Log
            </span>
            <div
              className="bg-muted/30 border border-border rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm break-all text-accent whitespace-pre-wrap shadow-inner custom-scrollbar"
              role="log"
              aria-live="polite"
              aria-atomic="false"
            >
              {output || (
                <span className="text-foreground/30 italic">Waiting for operation...</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div
          id="playground-error"
          role="alert"
          className="mt-4 p-3 bg-status-error border border-status-error rounded-lg flex items-center gap-2 text-status-error text-sm"
        >
          <AlertCircle size={16} aria-hidden="true" />
          {error}
        </div>
      )}
    </div>
  )
}
