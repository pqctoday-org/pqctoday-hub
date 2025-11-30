import React from 'react'
import { Lock, Key as KeyIcon } from 'lucide-react'
import { DataInput } from '../DataInput'
import { useSettingsContext } from '../contexts/SettingsContext'
import { useKeyStoreContext } from '../contexts/KeyStoreContext'
import { useOperationsContext } from '../contexts/OperationsContext'

export const SymmetricTab: React.FC = () => {
  const { loading } = useSettingsContext()
  const { selectedSymKeyId, setSelectedSymKeyId, keyStore } = useKeyStoreContext()
  const { symData, setSymData, symOutput, setSymOutput, runOperation } = useOperationsContext()

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <h4 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2 mb-6">
        <Lock size={18} className="text-accent" /> Symmetric Encryption (AES-GCM)
      </h4>

      {/* Key Selection */}
      <div className="mb-6 p-6 bg-black/20 rounded-xl border border-white/5">
        <h5 className="text-sm font-bold text-muted uppercase tracking-wider flex items-center gap-2 mb-4">
          <KeyIcon size={14} /> Select Symmetric Key
        </h5>
        <select
          value={selectedSymKeyId}
          onChange={(e) => setSelectedSymKeyId(e.target.value)}
          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-accent"
        >
          <option value="">Select AES Key...</option>
          {keyStore
            .filter((k) => k.type === 'symmetric')
            .map((k) => (
              <option key={k.id} value={k.id}>
                {k.name}
              </option>
            ))}
        </select>

        {selectedSymKeyId &&
          (() => {
            const key = keyStore.find((k) => k.id === selectedSymKeyId)
            if (!key) return null
            return (
              <div className="mt-4 p-3 bg-black/40 rounded border border-white/10 text-xs space-y-1 animate-fade-in">
                <div className="flex justify-between">
                  <span className="text-muted">Algorithm:</span>
                  <span className="text-accent font-mono font-bold">{key.algorithm}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Mode:</span>
                  <span className="text-white font-mono">GCM (Galois/Counter Mode)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">IV (Nonce):</span>
                  <span className="text-white font-mono">12 bytes (Prepend to Ciphertext)</span>
                </div>
              </div>
            )
          })()}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Encrypt */}
        <div className="p-6 bg-black/20 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-colors">
          <div className="text-sm text-cyan-300 mb-4 font-bold uppercase tracking-wider flex items-center gap-2">
            <Lock size={16} /> Encrypt Data
          </div>
          <DataInput
            label="Input Data (Hex/ASCII)"
            value={symData}
            onChange={setSymData}
            placeholder="Enter data to encrypt..."
            inputType="binary"
            height="h-32"
          />
          <button
            onClick={() => runOperation('symEncrypt')}
            disabled={!selectedSymKeyId || loading}
            className="w-full mt-4 py-3 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold"
          >
            Encrypt
          </button>
        </div>

        {/* Decrypt */}
        <div className="p-6 bg-black/20 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-colors">
          <div className="text-sm text-emerald-300 mb-4 font-bold uppercase tracking-wider flex items-center gap-2">
            <Lock size={16} /> Decrypt Result
          </div>
          <DataInput
            label="Output / Ciphertext (Hex/ASCII)"
            value={symOutput}
            onChange={setSymOutput}
            placeholder="Result will appear here..."
            inputType="binary"
            height="h-32"
          />
          <button
            onClick={() => runOperation('symDecrypt')}
            disabled={!selectedSymKeyId || loading}
            className="w-full mt-4 py-3 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold"
          >
            Decrypt (Reverse)
          </button>
        </div>
      </div>
    </div>
  )
}
