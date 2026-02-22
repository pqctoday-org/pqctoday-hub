import React, { useState } from 'react'
import { Loader2, Play, BarChart3 } from 'lucide-react'
import { HYBRID_ALGORITHMS } from '../constants'
import { hybridCryptoService, type KeyGenResult } from '../services/HybridCryptoService'

interface HybridKeyGenerationProps {
  initialCategory?: 'kem' | 'signature'
}

export const HybridKeyGeneration: React.FC<HybridKeyGenerationProps> = ({
  initialCategory = 'kem',
}) => {
  const [category, setCategory] = useState<'kem' | 'signature'>(initialCategory)
  const [results, setResults] = useState<Map<string, KeyGenResult>>(new Map())
  const [isGenerating, setIsGenerating] = useState(false)
  const [expandedPem, setExpandedPem] = useState<string | null>(null)

  const algorithms = HYBRID_ALGORITHMS.filter((a) => a.category === category)
  const columns = [
    {
      title: 'Classical',
      algorithms: algorithms.filter((a) => a.type === 'classical'),
      color: 'text-warning',
      barColor: 'bg-warning',
    },
    {
      title: 'Post-Quantum',
      algorithms: algorithms.filter((a) => a.type === 'pqc'),
      color: 'text-success',
      barColor: 'bg-success',
    },
    {
      title: 'Hybrid',
      algorithms: algorithms.filter((a) => a.type === 'hybrid'),
      color: 'text-primary',
      barColor: 'bg-primary',
    },
  ].filter((col) => col.algorithms.length > 0)

  const maxKeySize = Math.max(...algorithms.map((a) => a.publicKeyBytes + a.privateKeyBytes), 1)

  const formatBytes = (bytes: number): string => {
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${bytes} B`
  }

  const generateAll = async () => {
    setIsGenerating(true)
    const newResults = new Map<string, KeyGenResult>()

    for (const algo of algorithms) {
      if (algo.opensslAlgorithm === 'SIMULATED') {
        // Hybrid: generate X25519 + ML-KEM-768 separately
        const x25519Result = await hybridCryptoService.generateKey(
          'X25519',
          'hybrid_x25519_key.pem'
        )
        const mlkemResult = await hybridCryptoService.generateKey(
          'ML-KEM-768',
          'hybrid_mlkem768_key.pem'
        )
        if (x25519Result.error || mlkemResult.error) {
          newResults.set(algo.name, {
            algorithm: algo.name,
            pemOutput: '',
            keyInfo: '',
            timingMs: x25519Result.timingMs + mlkemResult.timingMs,
            error: x25519Result.error || mlkemResult.error,
          })
        } else {
          newResults.set(algo.name, {
            algorithm: algo.name,
            pemOutput: [
              '--- X25519 Key ---',
              x25519Result.pemOutput,
              '--- ML-KEM-768 Key ---',
              mlkemResult.pemOutput,
            ].join('\n'),
            keyInfo: [
              '--- X25519 ---',
              x25519Result.keyInfo,
              '--- ML-KEM-768 ---',
              mlkemResult.keyInfo,
            ].join('\n'),
            timingMs: x25519Result.timingMs + mlkemResult.timingMs,
          })
        }
      } else {
        const filename = `${algo.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_key.pem`
        const result = await hybridCryptoService.generateKey(algo.opensslAlgorithm, filename)
        newResults.set(algo.name, { ...result, algorithm: algo.name })
      }
    }

    setResults(newResults)
    setIsGenerating(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Key Generation Comparison</h3>
        <p className="text-sm text-muted-foreground">
          Generate classical, PQC, and hybrid key pairs side-by-side. Compare key sizes, generation
          times, and PEM output to understand the trade-offs.
        </p>
      </div>

      {/* Category toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setCategory('kem')
            setResults(new Map())
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            category === 'kem'
              ? 'bg-primary/20 text-primary border border-primary/50'
              : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
          }`}
        >
          KEM (Key Encapsulation)
        </button>
        <button
          onClick={() => {
            setCategory('signature')
            setResults(new Map())
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            category === 'signature'
              ? 'bg-primary/20 text-primary border border-primary/50'
              : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
          }`}
        >
          Signatures
        </button>
      </div>

      {/* Generate button */}
      <button
        onClick={generateAll}
        disabled={isGenerating}
        className="flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {isGenerating ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Play size={18} fill="currentColor" />
            Generate All Keys
          </>
        )}
      </button>

      {/* Results grid */}
      {results.size > 0 && (
        <>
          <div
            className={`grid grid-cols-1 ${columns.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-4`}
          >
            {columns.map((col) => (
              <div key={col.title} className="space-y-3">
                <h4 className={`text-sm font-bold ${col.color}`}>{col.title}</h4>
                {col.algorithms.map((algo) => {
                  const result = results.get(algo.name)
                  if (!result) return null
                  return (
                    <div key={algo.name} className="glass-panel p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">{algo.name}</span>
                        {result.error ? (
                          <span className="text-xs px-2 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20">
                            ERROR
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded bg-success/10 text-success border border-success/20">
                            {result.timingMs.toFixed(0)}ms
                          </span>
                        )}
                      </div>

                      {result.error ? (
                        <p className="text-xs text-destructive">{result.error}</p>
                      ) : (
                        <>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Public key</span>
                              <span className="text-foreground">
                                {formatBytes(algo.publicKeyBytes)}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Private key</span>
                              <span className="text-foreground">
                                {formatBytes(algo.privateKeyBytes)}
                              </span>
                            </div>
                            {algo.nistLevel && (
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">NIST Level</span>
                                <span className="text-foreground">{algo.nistLevel}</span>
                              </div>
                            )}
                          </div>

                          {/* Size bar */}
                          <div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${col.barColor}`}
                                style={{
                                  width: `${((algo.publicKeyBytes + algo.privateKeyBytes) / maxKeySize) * 100}%`,
                                }}
                              />
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-1">
                              Total: {formatBytes(algo.publicKeyBytes + algo.privateKeyBytes)}
                            </div>
                          </div>

                          {/* PEM toggle */}
                          <button
                            onClick={() =>
                              setExpandedPem(expandedPem === algo.name ? null : algo.name)
                            }
                            className="text-xs text-primary hover:text-primary/80 transition-colors"
                          >
                            {expandedPem === algo.name ? 'Hide PEM' : 'Show PEM'}
                          </button>
                          {expandedPem === algo.name && result.pemOutput && (
                            <pre className="text-[10px] bg-background p-2 rounded border border-border overflow-x-auto max-h-48 overflow-y-auto font-mono">
                              {result.pemOutput.trim()}
                            </pre>
                          )}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Size comparison table */}
          <div className="glass-panel p-4">
            <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <BarChart3 size={16} /> Size Comparison
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2 text-muted-foreground font-medium">Algorithm</th>
                    <th className="text-center p-2 text-muted-foreground font-medium">Type</th>
                    <th className="text-right p-2 text-muted-foreground font-medium">Public Key</th>
                    <th className="text-right p-2 text-muted-foreground font-medium">
                      Private Key
                    </th>
                    <th className="text-right p-2 text-muted-foreground font-medium">
                      {category === 'kem' ? 'Ciphertext' : 'Signature'}
                    </th>
                    <th className="text-right p-2 text-muted-foreground font-medium">Gen Time</th>
                  </tr>
                </thead>
                <tbody>
                  {algorithms.map((algo) => {
                    const result = results.get(algo.name)
                    return (
                      <tr key={algo.name} className="border-b border-border/50">
                        <td className="p-2 font-medium">{algo.name}</td>
                        <td className="p-2 text-center">
                          <span
                            className={`text-xs px-2 py-0.5 rounded border ${
                              algo.type === 'classical'
                                ? 'bg-warning/10 text-warning border-warning/20'
                                : algo.type === 'pqc'
                                  ? 'bg-success/10 text-success border-success/20'
                                  : 'bg-primary/10 text-primary border-primary/20'
                            }`}
                          >
                            {algo.type}
                          </span>
                        </td>
                        <td className="p-2 text-right font-mono text-xs">
                          {formatBytes(algo.publicKeyBytes)}
                        </td>
                        <td className="p-2 text-right font-mono text-xs">
                          {formatBytes(algo.privateKeyBytes)}
                        </td>
                        <td className="p-2 text-right font-mono text-xs">
                          {formatBytes(algo.ciphertextOrSigBytes)}
                        </td>
                        <td className="p-2 text-right font-mono text-xs">
                          {result && !result.error ? `${result.timingMs.toFixed(0)}ms` : '\u2014'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Educational note */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          {category === 'kem' ? (
            <>
              <strong>Key observation:</strong> Hybrid keys (X25519MLKEM768) combine X25519 (32
              bytes) + ML-KEM-768 (1,184 bytes) into a single key pair. The total size is roughly
              the sum of both components. This provides quantum resistance via ML-KEM while
              maintaining classical security through X25519 &mdash; even if one algorithm is broken,
              the other provides protection.
            </>
          ) : (
            <>
              <strong>Key observation:</strong> ML-DSA-65 public keys (1,952 bytes) are ~30x larger
              than ECDSA P-256 keys (65 bytes), and signatures (3,309 bytes) are ~46x larger. This
              size increase is the main trade-off for quantum resistance. Composite signature
              standards (draft-ietf-lamps-pq-composite-sigs) would combine both.
            </>
          )}
        </p>
      </div>
    </div>
  )
}
