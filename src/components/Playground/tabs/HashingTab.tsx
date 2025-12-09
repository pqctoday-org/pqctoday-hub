import React from 'react'
import { Hash, Info } from 'lucide-react'
import { DataInput } from '../DataInput'
import { useSettingsContext } from '../contexts/SettingsContext'
import { useOperationsContext } from '../contexts/OperationsContext'
import { HASH_METHODS } from '../hooks/useHashingOperations'

export const HashingTab: React.FC = () => {
  const { loading } = useSettingsContext()
  const {
    selectedHashMethod,
    setSelectedHashMethod,
    hashInput,
    setHashInput,
    hashOutput,
    setHashOutput,
    runOperation,
  } = useOperationsContext()

  const selectedMethod = HASH_METHODS.find((m) => m.id === selectedHashMethod)

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <h4 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border pb-2 mb-6">
        <Hash size={18} className="text-accent" /> Cryptographic Hashing
      </h4>

      {/* Hash Method Selection */}
      <div className="mb-6 p-6 bg-muted/20 rounded-xl border border-border">
        <h5 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-4">
          <Hash size={14} /> Select Hash Algorithm
        </h5>
        <select
          value={selectedHashMethod}
          onChange={(e) => setSelectedHashMethod(e.target.value)}
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent"
        >
          {HASH_METHODS.map((method) => (
            <option key={method.id} value={method.id}>
              {method.name} - {method.description}
            </option>
          ))}
        </select>

        {selectedMethod && (
          <div className="mt-4 p-3 bg-muted/40 rounded border border-border text-xs space-y-1 animate-fade-in">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Algorithm:</span>
              <span className="text-accent font-mono font-bold">{selectedMethod.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Output Size:</span>
              <span className="text-foreground font-mono">
                {selectedMethod.outputSize} ({selectedMethod.outputBits} bits)
              </span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">Use Cases:</span>
              <span className="text-foreground font-mono text-right max-w-[60%]">
                {selectedMethod.useCases}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input */}
        <div className="p-6 bg-muted/20 rounded-xl border border-border hover:border-cyan-500/30 transition-colors">
          <div className="text-sm text-cyan-500 dark:text-cyan-300 mb-4 font-bold uppercase tracking-wider flex items-center gap-2">
            <Hash size={16} /> Input Data
          </div>
          <DataInput
            label="Data to Hash (ASCII)"
            value={hashInput}
            onChange={setHashInput}
            placeholder="Enter data to hash..."
            inputType="text"
            height="h-32"
          />
          <div className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
            <Info size={12} className="mt-0.5 shrink-0" />
            <span>Enter any text to compute its cryptographic hash</span>
          </div>
          <button
            onClick={() => runOperation('hash')}
            disabled={!hashInput || loading}
            className="w-full mt-4 py-3 rounded-lg bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold"
          >
            Compute Hash
          </button>
        </div>

        {/* Output */}
        <div className="p-6 bg-muted/20 rounded-xl border border-border hover:border-emerald-500/30 transition-colors">
          <div className="text-sm text-emerald-300 mb-4 font-bold uppercase tracking-wider flex items-center gap-2">
            <Hash size={16} /> Hash Output
          </div>
          <DataInput
            label="Hash Result (Hex)"
            value={hashOutput}
            onChange={setHashOutput}
            placeholder="Hash result will appear here..."
            inputType="text"
            height="h-32"
            readOnly
          />
          {hashOutput && (
            <div className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
              <Info size={12} className="mt-0.5 shrink-0" />
              <span>
                Hash length: {hashOutput.length / 2} bytes ({hashOutput.length} hex chars)
              </span>
            </div>
          )}
          <button
            onClick={() => {
              if (hashOutput) {
                navigator.clipboard.writeText(hashOutput)
              }
            }}
            disabled={!hashOutput}
            className="w-full mt-4 py-3 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold"
          >
            Copy Hash
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <h5 className="text-sm font-bold text-blue-400 mb-2 flex items-center gap-2">
          <Info size={14} /> About Cryptographic Hashing
        </h5>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Cryptographic hash functions are one-way functions that produce a fixed-size output
          (digest) from arbitrary input data. They are deterministic (same input always produces the
          same output), fast to compute, and collision-resistant. Hashes are used throughout the
          learn modules for address generation (Bitcoin, Ethereum), data integrity, digital
          signatures, and more.
        </p>
      </div>
    </div>
  )
}
