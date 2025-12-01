import React from 'react'
import { Activity, Lock, Key as KeyIcon, CheckCircle, XCircle } from 'lucide-react'
import { useSettingsContext } from '../contexts/SettingsContext'
import { useKeyStoreContext } from '../contexts/KeyStoreContext'
import { useOperationsContext } from '../contexts/OperationsContext'
import { DataInput } from '../DataInput'
import { logEvent } from '../../../utils/analytics'

export const KemOpsTab: React.FC = () => {
  const { loading } = useSettingsContext()
  const { keyStore, selectedEncKeyId, setSelectedEncKeyId, selectedDecKeyId, setSelectedDecKeyId } =
    useKeyStoreContext()
  const {
    runOperation,
    sharedSecret,
    setSharedSecret,
    ciphertext,
    setCiphertext,
    encryptedData,
    setEncryptedData,
    decryptedData,
    setDecryptedData,
    dataToEncrypt,
    setDataToEncrypt,
    kemDecapsulationResult,
  } = useOperationsContext()

  const isKEM = (algo: string) => algo.startsWith('ML-KEM') || ['X25519', 'P-256'].includes(algo)
  const kemPublicKeys = keyStore.filter((k) => k.type === 'public' && isKEM(k.algorithm))
  const kemPrivateKeys = keyStore.filter((k) => k.type === 'private' && isKEM(k.algorithm))

  return (
    <div className="max-w-6xl mx-auto animate-fade-in space-y-8">
      {/* Section 1: Key Encapsulation */}
      <div>
        <h4 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2 mb-6">
          <Activity size={18} className="text-accent" /> Key Encapsulation Mechanism (KEM)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Encapsulate */}
          <div className="p-6 bg-black/20 rounded-xl border border-white/5 hover:border-blue-500/30 transition-colors group flex flex-col">
            <div className="text-sm text-blue-300 mb-4 font-bold uppercase tracking-wider flex items-center gap-2">
              <Lock size={16} /> Encapsulate
            </div>
            <p className="text-xs text-muted mb-4 h-10">
              Generate a shared secret and encapsulate it for a public key.
            </p>
            <select
              value={selectedEncKeyId}
              onChange={(e) => setSelectedEncKeyId(e.target.value)}
              className="w-full mb-4 bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
            >
              <option value="">Select Public Key...</option>
              {kemPublicKeys.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name}
                </option>
              ))}
            </select>

            {selectedEncKeyId &&
              (() => {
                const key = keyStore.find((k) => k.id === selectedEncKeyId)
                if (!key) return null
                let scheme = 'Unknown'
                const secretSize = '32 bytes' // Default for ML-KEM and standard ECDH curves

                if (key.algorithm.startsWith('ML-KEM')) {
                  scheme = 'ML-KEM (Kyber)'
                } else if (['X25519', 'P-256'].includes(key.algorithm)) {
                  scheme = 'Ephemeral-Static ECDH'
                }

                return (
                  <div className="mb-4 p-3 bg-white/5 rounded border border-white/10 text-xs text-muted space-y-1">
                    <div className="flex justify-between">
                      <span>Algorithm:</span>
                      <span className="text-white font-mono">{key.algorithm}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Scheme:</span>
                      <span className="text-white font-mono">{scheme}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shared Secret Size:</span>
                      <span className="text-white font-mono">{secretSize}</span>
                    </div>
                  </div>
                )
              })()}

            <div className="space-y-4 mb-4">
              <DataInput
                label="Shared Secret (Output)"
                value={sharedSecret}
                onChange={setSharedSecret}
                inputType="binary"
                placeholder="Run Encapsulate to generate"
                height="h-24"
              />
              <DataInput
                label="Ciphertext (Output)"
                value={ciphertext}
                onChange={setCiphertext}
                inputType="binary"
                placeholder="Run Encapsulate to generate"
                height="h-24"
              />
            </div>

            <div className="mt-auto">
              <button
                onClick={() => {
                  runOperation('encapsulate')
                  logEvent('Playground', 'KEM Encapsulate')
                }}
                disabled={!selectedEncKeyId || loading}
                className="w-full py-3 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold"
              >
                Run Encapsulate
              </button>
            </div>
          </div>

          {/* Decapsulate */}
          <div className="p-6 bg-black/20 rounded-xl border border-white/5 hover:border-purple-500/30 transition-colors group flex flex-col">
            <div className="text-sm text-purple-300 mb-4 font-bold uppercase tracking-wider flex items-center gap-2">
              <KeyIcon size={16} /> Decapsulate
            </div>
            <p className="text-xs text-muted mb-4 h-10">
              Decapsulate a shared secret using a private key.
            </p>
            <select
              value={selectedDecKeyId}
              onChange={(e) => setSelectedDecKeyId(e.target.value)}
              className="w-full mb-4 bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500"
            >
              <option value="">Select Private Key...</option>
              {kemPrivateKeys.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name}
                </option>
              ))}
            </select>

            {selectedDecKeyId &&
              (() => {
                const key = keyStore.find((k) => k.id === selectedDecKeyId)
                if (!key) return null
                let scheme = 'Unknown'
                const secretSize = '32 bytes'

                if (key.algorithm.startsWith('ML-KEM')) {
                  scheme = 'ML-KEM (Kyber)'
                } else if (['X25519', 'P-256'].includes(key.algorithm)) {
                  scheme = 'Ephemeral-Static ECDH'
                }

                return (
                  <div className="mb-4 p-3 bg-white/5 rounded border border-white/10 text-xs text-muted space-y-1">
                    <div className="flex justify-between">
                      <span>Algorithm:</span>
                      <span className="text-white font-mono">{key.algorithm}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Scheme:</span>
                      <span className="text-white font-mono">{scheme}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shared Secret Size:</span>
                      <span className="text-white font-mono">{secretSize}</span>
                    </div>
                  </div>
                )
              })()}

            <div className="space-y-4 mb-4">
              <DataInput
                label="Ciphertext (Input)"
                value={ciphertext}
                onChange={setCiphertext}
                inputType="binary"
                placeholder="No Ciphertext (Run Encapsulate first)"
                height="h-24"
              />
            </div>

            {/* Decapsulation Result Display */}
            {kemDecapsulationResult !== null && (
              <div
                className={`mb-4 p-4 rounded-lg border flex items-center gap-3 ${
                  kemDecapsulationResult
                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}
              >
                {kemDecapsulationResult ? <CheckCircle size={24} /> : <XCircle size={24} />}
                <div>
                  <div className="font-bold text-lg">
                    {kemDecapsulationResult ? 'SECRET RECOVERED' : 'DECAPSULATION FAILED'}
                  </div>
                  <div className="text-xs opacity-80">
                    {kemDecapsulationResult
                      ? 'The decapsulated secret matches the original shared secret.'
                      : 'The decapsulated secret does NOT match the original shared secret.'}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-auto">
              <button
                onClick={() => {
                  runOperation('decapsulate')
                  logEvent('Playground', 'KEM Decapsulate')
                }}
                disabled={!selectedDecKeyId || loading}
                className="w-full py-3 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold"
              >
                Run Decapsulate
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Hybrid Encryption */}
      <div>
        <h4 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2 mb-6">
          <Lock size={18} className="text-accent" /> Hybrid Encryption (AES-GCM)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Encrypt Data */}
          <div className="p-6 bg-black/20 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-colors group flex flex-col">
            <div className="text-sm text-cyan-300 mb-4 font-bold uppercase tracking-wider flex items-center gap-2">
              <Lock size={16} /> Encrypt Message
            </div>
            <p className="text-xs text-muted mb-4 h-10">
              Encrypt the input message using the established shared secret.
            </p>

            <div className="space-y-4 mb-4">
              <DataInput
                label="Message to Encrypt"
                value={dataToEncrypt}
                onChange={setDataToEncrypt}
                inputType="text"
                placeholder="Enter message to encrypt..."
                height="h-24"
              />
              <DataInput
                label="Shared Secret (Input)"
                value={sharedSecret}
                onChange={setSharedSecret}
                inputType="binary"
                placeholder="No Shared Secret (Run Encapsulate first)"
                height="h-24"
              />
              <DataInput
                label="Encrypted Data (Output)"
                value={encryptedData}
                onChange={setEncryptedData}
                inputType="binary"
                placeholder="Run Encrypt to generate"
                height="h-24"
              />
            </div>

            <div className="mt-auto">
              <button
                onClick={() => {
                  runOperation('encrypt')
                  logEvent('Playground', 'Hybrid Encrypt')
                }}
                disabled={!sharedSecret || loading}
                className="w-full py-3 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold"
              >
                Encrypt Message
              </button>
            </div>
          </div>

          {/* Decrypt Data */}
          <div className="p-6 bg-black/20 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-colors group flex flex-col">
            <div className="text-sm text-emerald-300 mb-4 font-bold uppercase tracking-wider flex items-center gap-2">
              <KeyIcon size={16} /> Decrypt Message
            </div>
            <p className="text-xs text-muted mb-4 h-10">
              Decrypt the ciphertext using the established shared secret.
            </p>

            <div className="space-y-4 mb-4">
              <DataInput
                label="Encrypted Data (Input)"
                value={encryptedData}
                onChange={setEncryptedData}
                inputType="binary"
                placeholder="No Encrypted Data (Run Encrypt first)"
                height="h-24"
              />
              <DataInput
                label="Decrypted Data (Output)"
                value={decryptedData}
                onChange={setDecryptedData}
                inputType="binary"
                placeholder="Run Decrypt to generate"
                height="h-24"
              />
            </div>

            <div className="mt-auto">
              <button
                onClick={() => {
                  runOperation('decrypt')
                  logEvent('Playground', 'Hybrid Decrypt')
                }}
                disabled={!encryptedData || loading}
                className="w-full py-3 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold"
              >
                Decrypt Message
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
