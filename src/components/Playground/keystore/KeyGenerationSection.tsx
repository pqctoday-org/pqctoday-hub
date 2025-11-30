import React from 'react'
import { Key as KeyIcon, RefreshCw, Layers, Lock } from 'lucide-react'

interface KeyGenerationSectionProps {
  algorithm: 'ML-KEM' | 'ML-DSA'
  keySize: string
  loading: boolean
  onAlgorithmChange: (algorithm: 'ML-KEM' | 'ML-DSA') => void
  onKeySizeChange: (size: string) => void
  onGenerateKeys: () => void
  onUnifiedChange?: (algorithm: 'ML-KEM' | 'ML-DSA', keySize: string) => void
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
      <div className="bg-black/20 border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
          <Layers size={16} className="text-secondary" />
          <h5 className="text-sm font-bold text-white uppercase tracking-wider">
            Generate New Keys
          </h5>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Algorithm & Key Size Selection */}
          <div className="space-y-2">
            <label htmlFor="keystore-key-size" className="text-xs font-medium text-muted block">
              Algorithm & Security Level
            </label>
            <select
              id="keystore-key-size"
              value={keySize}
              onChange={(e) => {
                const val = e.target.value
                if (['512', '768', '1024'].includes(val)) {
                  if (onUnifiedChange) {
                    onUnifiedChange('ML-KEM', val)
                  } else {
                    if (algorithm !== 'ML-KEM') onAlgorithmChange('ML-KEM')
                    onKeySizeChange(val)
                  }
                } else {
                  if (onUnifiedChange) {
                    onUnifiedChange('ML-DSA', val)
                  } else {
                    if (algorithm !== 'ML-DSA') onAlgorithmChange('ML-DSA')
                    onKeySizeChange(val)
                  }
                }
              }}
              className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary appearance-none transition-colors"
            >
              <optgroup label="ML-KEM (Key Encapsulation)">
                <option value="512">ML-KEM-512 (NIST Level 1)</option>
                <option value="768">ML-KEM-768 (NIST Level 3)</option>
                <option value="1024">ML-KEM-1024 (NIST Level 5)</option>
              </optgroup>
              <optgroup label="ML-DSA (Digital Signatures)">
                <option value="44">ML-DSA-44 (NIST Level 2)</option>
                <option value="65">ML-DSA-65 (NIST Level 3)</option>
                <option value="87">ML-DSA-87 (NIST Level 5)</option>
              </optgroup>
            </select>
          </div>

          {/* Generate Button */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted block opacity-0 select-none">
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

      {/* Classical Algorithms Key Generation Section */}
      <div className="bg-black/20 border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4 pb-3 border-white/10">
          <Lock size={16} className="text-accent" />
          <h5 className="text-sm font-bold text-white uppercase tracking-wider">
            Generate Classical Keys
          </h5>
          <span className="text-xs text-muted ml-auto">(Web Crypto API)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Algorithm Selection */}
          <div className="space-y-2">
            <label htmlFor="classical-algo-select" className="text-xs font-medium text-muted block">
              Classical Algorithm
            </label>
            <select
              id="classical-algo-select"
              value={classicalAlgorithm}
              onChange={(e) => onClassicalAlgorithmChange(e.target.value)}
              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
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
            <span className="text-xs font-medium text-muted block opacity-0 select-none">
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
