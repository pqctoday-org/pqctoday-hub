import React, { useState, useCallback } from 'react'
import { Loader2, Play, FileText } from 'lucide-react'
import { hybridCryptoService, type CertResult } from '../services/HybridCryptoService'

interface CompositeCertificateViewerProps {
  initialAlgorithm?: string
}

interface CertDemoResult extends CertResult {
  algorithm: string
  algorithmLabel: string
  keyGenMs: number
}

const CERT_ALGORITHMS = [
  { label: 'ECDSA P-256', opensslAlg: 'EC', type: 'classical' as const },
  { label: 'ML-DSA-65', opensslAlg: 'ML-DSA-65', type: 'pqc' as const },
]

export const CompositeCertificateViewer: React.FC<CompositeCertificateViewerProps> = ({
  initialAlgorithm,
}) => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState(initialAlgorithm || 'all')
  const [results, setResults] = useState<CertDemoResult[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [expandedView, setExpandedView] = useState<Record<string, 'pem' | 'parsed' | null>>({})

  const generateCerts = useCallback(async () => {
    setIsGenerating(true)
    const algos =
      selectedAlgorithm === 'all'
        ? CERT_ALGORITHMS
        : CERT_ALGORITHMS.filter((a) => a.opensslAlg === selectedAlgorithm)

    const newResults: CertDemoResult[] = []

    for (const algo of algos) {
      const prefix = algo.label.toLowerCase().replace(/[^a-z0-9]/g, '_')
      const keyFile = `${prefix}_cert_key.pem`
      const certFile = `${prefix}_cert.pem`

      const keyResult = await hybridCryptoService.generateKey(algo.opensslAlg, keyFile)
      if (keyResult.error) {
        newResults.push({
          algorithm: algo.opensslAlg,
          algorithmLabel: algo.label,
          keyGenMs: keyResult.timingMs,
          pem: '',
          parsed: '',
          timingMs: 0,
          error: keyResult.error,
        })
        continue
      }

      const certResult = await hybridCryptoService.generateSelfSignedCert(
        keyFile,
        certFile,
        `/CN=${algo.label} Demo/O=PQC Today/OU=Hybrid Crypto Workshop`
      )

      newResults.push({
        algorithm: algo.opensslAlg,
        algorithmLabel: algo.label,
        keyGenMs: keyResult.timingMs,
        ...certResult,
      })
    }

    setResults(newResults)
    setIsGenerating(false)
  }, [selectedAlgorithm])

  const toggleView = (label: string, view: 'pem' | 'parsed') => {
    setExpandedView((prev) => ({
      ...prev,
      // eslint-disable-next-line security/detect-object-injection
      [label]: prev[label] === view ? null : view,
    }))
  }

  const typeColor = (type: 'classical' | 'pqc') =>
    type === 'classical'
      ? 'bg-warning/10 text-warning border-warning/20'
      : 'bg-success/10 text-success border-success/20'

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Composite Certificates</h3>
        <p className="text-sm text-muted-foreground">
          Generate self-signed X.509 certificates with classical and PQC signature algorithms.
          Compare the certificate structure, sizes, and algorithm OIDs.
        </p>
      </div>

      {/* Algorithm selector */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedAlgorithm('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedAlgorithm === 'all'
              ? 'bg-primary/20 text-primary border border-primary/50'
              : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
          }`}
        >
          Generate Both
        </button>
        {CERT_ALGORITHMS.map((algo) => (
          <button
            key={algo.opensslAlg}
            onClick={() => setSelectedAlgorithm(algo.opensslAlg)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedAlgorithm === algo.opensslAlg
                ? 'bg-primary/20 text-primary border border-primary/50'
                : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
            }`}
          >
            {algo.label}
          </button>
        ))}
      </div>

      {/* Generate button */}
      <button
        onClick={generateCerts}
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
            Generate Certificate{selectedAlgorithm === 'all' ? 's' : ''}
          </>
        )}
      </button>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className={`grid grid-cols-1 ${results.length > 1 ? 'lg:grid-cols-2' : ''} gap-4`}>
            {results.map((result) => {
              const algoMeta = CERT_ALGORITHMS.find((a) => a.opensslAlg === result.algorithm)
              const currentView = expandedView[result.algorithmLabel]
              return (
                <div key={result.algorithmLabel} className="glass-panel p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText size={18} className="text-primary" />
                      <h4 className="font-bold text-foreground">{result.algorithmLabel}</h4>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded border font-bold ${typeColor(algoMeta?.type || 'classical')}`}
                    >
                      {algoMeta?.type === 'pqc' ? 'POST-QUANTUM' : 'CLASSICAL'}
                    </span>
                  </div>

                  {result.error ? (
                    <p className="text-xs text-destructive">{result.error}</p>
                  ) : (
                    <>
                      {/* Timing */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center bg-muted/50 rounded-lg p-3">
                          <div className="text-lg font-bold text-foreground">
                            {result.keyGenMs.toFixed(0)}
                          </div>
                          <div className="text-[10px] text-muted-foreground">Key Gen (ms)</div>
                        </div>
                        <div className="text-center bg-muted/50 rounded-lg p-3">
                          <div className="text-lg font-bold text-primary">
                            {result.timingMs.toFixed(0)}
                          </div>
                          <div className="text-[10px] text-muted-foreground">Cert Gen (ms)</div>
                        </div>
                      </div>

                      {/* PEM size */}
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Certificate PEM size</span>
                        <span className="font-mono text-foreground">{result.pem.length} chars</span>
                      </div>

                      {/* View toggles */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleView(result.algorithmLabel, 'parsed')}
                          className={`text-xs px-3 py-1.5 rounded transition-colors ${
                            currentView === 'parsed'
                              ? 'bg-primary/20 text-primary border border-primary/50'
                              : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
                          }`}
                        >
                          Parsed Fields
                        </button>
                        <button
                          onClick={() => toggleView(result.algorithmLabel, 'pem')}
                          className={`text-xs px-3 py-1.5 rounded transition-colors ${
                            currentView === 'pem'
                              ? 'bg-primary/20 text-primary border border-primary/50'
                              : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
                          }`}
                        >
                          PEM Output
                        </button>
                      </div>

                      {/* Content */}
                      {currentView && (
                        <pre className="text-[10px] bg-background p-3 rounded border border-border overflow-x-auto max-h-80 overflow-y-auto font-mono whitespace-pre-wrap">
                          {currentView === 'parsed' ? result.parsed.trim() : result.pem.trim()}
                        </pre>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>

          {/* Comparison insights */}
          {results.length > 1 && results.every((r) => !r.error) && (
            <div className="glass-panel p-4">
              <h4 className="text-sm font-bold text-foreground mb-3">Key Differences</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-2 text-muted-foreground font-medium">Property</th>
                      {results.map((r) => (
                        <th
                          key={r.algorithmLabel}
                          className="text-center p-2 text-foreground font-bold"
                        >
                          {r.algorithmLabel}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/50">
                      <td className="p-2 text-muted-foreground">Key Gen Time</td>
                      {results.map((r) => (
                        <td key={r.algorithmLabel} className="p-2 text-center font-mono text-xs">
                          {r.keyGenMs.toFixed(0)} ms
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="p-2 text-muted-foreground">Cert Gen Time</td>
                      {results.map((r) => (
                        <td key={r.algorithmLabel} className="p-2 text-center font-mono text-xs">
                          {r.timingMs.toFixed(0)} ms
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="p-2 text-muted-foreground">PEM Size</td>
                      {results.map((r) => (
                        <td key={r.algorithmLabel} className="p-2 text-center font-mono text-xs">
                          {r.pem.length} chars
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="p-2 text-muted-foreground">Quantum Safe</td>
                      {results.map((r) => {
                        const meta = CERT_ALGORITHMS.find((a) => a.opensslAlg === r.algorithm)
                        return (
                          <td key={r.algorithmLabel} className="p-2 text-center">
                            {meta?.type === 'pqc' ? (
                              <span className="text-success font-bold">Yes</span>
                            ) : (
                              <span className="text-destructive font-bold">No</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Educational note */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>About composite certificates:</strong> True composite certificates (single cert
          with dual algorithm OIDs per draft-ietf-lamps-pq-composite-sigs) are still in draft
          standardization. The certificates generated here use a single PQC or classical algorithm
          each. In production, organizations will deploy both types during the transition period,
          often using separate certificate chains for classical and PQC verification paths.
        </p>
      </div>
    </div>
  )
}
