import React, { useState, useCallback } from 'react'
import { Loader2, Play, FileText, ExternalLink } from 'lucide-react'
import { hybridCryptoService, type CertResult } from '../services/HybridCryptoService'

interface CompositeCertificateViewerProps {
  initialAlgorithm?: string
}

type FormatType = 'classical' | 'pure-pqc' | 'composite'

interface CertAlgoConfig {
  label: string
  opensslAlg: string
  type: 'classical' | 'pqc' | 'hybrid'
  formatType: FormatType
  standard: string
  standardUrl: string
  oid: string
  description: string
}

const CERT_ALGORITHMS: CertAlgoConfig[] = [
  {
    label: 'Classical (ECDSA P-256)',
    opensslAlg: 'EC',
    type: 'classical',
    formatType: 'classical',
    standard: 'RFC 5480',
    standardUrl: 'https://www.rfc-editor.org/rfc/rfc5480',
    oid: '1.2.840.10045.4.3.2',
    description: 'Traditional single-algorithm X.509 — quantum-vulnerable',
  },
  {
    label: 'Pure PQC (ML-DSA-65)',
    opensslAlg: 'ML-DSA-65',
    type: 'pqc',
    formatType: 'pure-pqc',
    standard: 'RFC 9881',
    standardUrl: 'https://www.rfc-editor.org/rfc/rfc9881',
    oid: '2.16.840.1.101.3.4.3.18',
    description: 'Standalone PQC X.509 cert — fully standardized, works in OpenSSL today',
  },
  {
    label: 'Composite (Simulated)',
    opensslAlg: 'COMPOSITE',
    type: 'hybrid',
    formatType: 'composite',
    standard: 'draft-ietf-lamps-pq-composite-sigs-14',
    standardUrl: 'https://datatracker.ietf.org/doc/draft-ietf-lamps-pq-composite-sigs/',
    oid: '2.16.840.1.114027.80.8.1.6',
    description:
      'id-MLDSA65-ECDSA-P256: both sigs must verify — component certs shown (OpenSSL composite OIDs pending)',
  },
]

interface CertDemoResult extends CertResult {
  algorithm: string
  algorithmLabel: string
  keyGenMs: number
  formatType: FormatType
  // For composite: holds the two component results
  components?: Array<{ label: string; pem: string; parsed: string; type: 'classical' | 'pqc' }>
}

export const CompositeCertificateViewer: React.FC<CompositeCertificateViewerProps> = ({
  initialAlgorithm,
}) => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState(initialAlgorithm || 'all')
  const [results, setResults] = useState<CertDemoResult[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [expandedView, setExpandedView] = useState<Record<string, 'pem' | 'parsed' | null>>({})

  const generateSingleCert = useCallback(async (algo: CertAlgoConfig): Promise<CertDemoResult> => {
    const prefix = algo.label.toLowerCase().replace(/[^a-z0-9]/g, '_')
    const keyFile = `${prefix}_cert_key.pem`
    const certFile = `${prefix}_cert.pem`

    const keyResult = await hybridCryptoService.generateKey(algo.opensslAlg, keyFile)
    if (keyResult.error) {
      return {
        algorithm: algo.opensslAlg,
        algorithmLabel: algo.label,
        keyGenMs: keyResult.timingMs,
        formatType: algo.formatType,
        pem: '',
        parsed: '',
        timingMs: 0,
        error: keyResult.error,
      }
    }

    const certResult = await hybridCryptoService.generateSelfSignedCert(
      keyFile,
      certFile,
      `/CN=${algo.label} Demo/O=PQC Today/OU=Certificate Format Workshop`,
      keyResult.fileData
    )

    return {
      algorithm: algo.opensslAlg,
      algorithmLabel: algo.label,
      keyGenMs: keyResult.timingMs,
      formatType: algo.formatType,
      ...certResult,
    }
  }, [])

  const generateCerts = useCallback(async () => {
    setIsGenerating(true)
    const algos =
      selectedAlgorithm === 'all'
        ? CERT_ALGORITHMS
        : CERT_ALGORITHMS.filter((a) => a.opensslAlg === selectedAlgorithm)

    const newResults: CertDemoResult[] = []

    for (const algo of algos) {
      if (algo.opensslAlg === 'COMPOSITE') {
        // Composite: generate both classical and PQC component certs
        const classicalAlgo = CERT_ALGORITHMS[0] // ECDSA P-256
        const pqcAlgo = CERT_ALGORITHMS[1] // ML-DSA-65

        const classicalResult = await generateSingleCert({
          ...classicalAlgo,
          label: 'composite_classical_ecdsa_p256',
        })
        const pqcResult = await generateSingleCert({
          ...pqcAlgo,
          label: 'composite_pqc_mldsa65',
        })

        const hasError = classicalResult.error || pqcResult.error
        newResults.push({
          algorithm: 'COMPOSITE',
          algorithmLabel: algo.label,
          keyGenMs: (classicalResult.keyGenMs || 0) + (pqcResult.keyGenMs || 0),
          formatType: 'composite',
          pem: classicalResult.pem,
          parsed: classicalResult.parsed,
          timingMs: (classicalResult.timingMs || 0) + (pqcResult.timingMs || 0),
          error: hasError ? classicalResult.error || pqcResult.error : undefined,
          components: hasError
            ? undefined
            : [
                {
                  label: 'Component 1: ECDSA P-256 (Classical)',
                  pem: classicalResult.pem,
                  parsed: classicalResult.parsed,
                  type: 'classical',
                },
                {
                  label: 'Component 2: ML-DSA-65 (PQC)',
                  pem: pqcResult.pem,
                  parsed: pqcResult.parsed,
                  type: 'pqc',
                },
              ],
        })
      } else {
        newResults.push(await generateSingleCert(algo))
      }
    }

    setResults(newResults)
    setIsGenerating(false)
  }, [selectedAlgorithm, generateSingleCert])

  const toggleView = (label: string, view: 'pem' | 'parsed') => {
    setExpandedView((prev) => ({
      ...prev,
      // eslint-disable-next-line security/detect-object-injection
      [label]: prev[label] === view ? null : view,
    }))
  }

  const formatBadgeClass = (formatType: FormatType) => {
    if (formatType === 'classical') return 'bg-warning/10 text-warning border-warning/20'
    if (formatType === 'pure-pqc') return 'bg-success/10 text-success border-success/20'
    return 'bg-primary/10 text-primary border-primary/20'
  }

  const formatLabel = (formatType: FormatType) => {
    if (formatType === 'classical') return 'CLASSICAL'
    if (formatType === 'pure-pqc') return 'PURE PQC'
    return 'COMPOSITE'
  }

  const algoConfig = (opensslAlg: string) =>
    CERT_ALGORITHMS.find((a) => a.opensslAlg === opensslAlg)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Certificate Format Comparison</h3>
        <p className="text-sm text-muted-foreground">
          Generate and inspect the three X.509 certificate format approaches for PQC deployment.
          Compare structure, OIDs, sizes, and standardization status.
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
          Generate All Three
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
            Generate{selectedAlgorithm === 'all' ? ' All Three' : ' Certificate'}
          </>
        )}
      </button>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div
            className={`grid grid-cols-1 ${results.length > 1 ? 'lg:grid-cols-2 xl:grid-cols-3' : ''} gap-4`}
          >
            {results.map((result) => {
              const config = algoConfig(result.algorithm)
              const currentView = expandedView[result.algorithmLabel]
              const isComposite = result.formatType === 'composite'

              return (
                <div key={result.algorithmLabel} className="glass-panel p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText size={18} className="text-primary" />
                      <h4 className="font-bold text-foreground text-sm">{result.algorithmLabel}</h4>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded border font-bold ${formatBadgeClass(result.formatType)}`}
                    >
                      {formatLabel(result.formatType)}
                    </span>
                  </div>

                  {/* Standard + OID */}
                  {config && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="font-medium">Standard:</span>
                        <a
                          href={config.standardUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-0.5"
                        >
                          {config.standard}
                          <ExternalLink size={10} />
                        </a>
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground">
                        OID: {config.oid}
                      </div>
                    </div>
                  )}

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

                      {/* Composite: show component certs */}
                      {isComposite && result.components ? (
                        <div className="space-y-3">
                          <p className="text-xs text-muted-foreground">
                            Component certificates generated. In a true composite cert
                            (draft-ietf-lamps-pq-composite-sigs-14), both would be packaged under a
                            single OID ({config?.oid}).
                          </p>
                          {result.components.map((comp) => (
                            <div
                              key={comp.label}
                              className="border border-border rounded-lg p-3 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-foreground">
                                  {comp.label}
                                </span>
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${
                                    comp.type === 'pqc'
                                      ? 'bg-success/10 text-success border-success/20'
                                      : 'bg-warning/10 text-warning border-warning/20'
                                  }`}
                                >
                                  {comp.type === 'pqc' ? 'PQC' : 'CLASSICAL'}
                                </span>
                              </div>
                              <div className="text-[10px] text-muted-foreground font-mono">
                                PEM size: {comp.pem.length} chars
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    toggleView(
                                      `${result.algorithmLabel}-${comp.type}-parsed`,
                                      'parsed'
                                    )
                                  }
                                  className={`text-[10px] px-2 py-1 rounded transition-colors ${
                                    expandedView[`${result.algorithmLabel}-${comp.type}-parsed`] ===
                                    'parsed'
                                      ? 'bg-primary/20 text-primary border border-primary/50'
                                      : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
                                  }`}
                                >
                                  Parsed
                                </button>
                                <button
                                  onClick={() =>
                                    toggleView(
                                      `${result.algorithmLabel}-${comp.type}-parsed`,
                                      'pem'
                                    )
                                  }
                                  className={`text-[10px] px-2 py-1 rounded transition-colors ${
                                    expandedView[`${result.algorithmLabel}-${comp.type}-parsed`] ===
                                    'pem'
                                      ? 'bg-primary/20 text-primary border border-primary/50'
                                      : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
                                  }`}
                                >
                                  PEM
                                </button>
                              </div>
                              {expandedView[`${result.algorithmLabel}-${comp.type}-parsed`] && (
                                <pre className="text-[10px] bg-background p-2 rounded border border-border overflow-x-auto max-h-48 overflow-y-auto font-mono whitespace-pre-wrap">
                                  {expandedView[`${result.algorithmLabel}-${comp.type}-parsed`] ===
                                  'parsed'
                                    ? comp.parsed.trim()
                                    : comp.pem.trim()}
                                </pre>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <>
                          {/* PEM size */}
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Certificate PEM size</span>
                            <span className="font-mono text-foreground">
                              {result.pem.length} chars
                            </span>
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
                    </>
                  )}
                </div>
              )
            })}
          </div>

          {/* Comparison table */}
          {results.length > 1 && results.every((r) => !r.error) && (
            <div className="glass-panel p-4">
              <h4 className="text-sm font-bold text-foreground mb-3">Format Comparison</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-2 text-muted-foreground font-medium">Property</th>
                      {results.map((r) => (
                        <th
                          key={r.algorithmLabel}
                          className="text-center p-2 text-foreground font-bold text-xs"
                        >
                          {r.algorithmLabel.split('(')[0].trim()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/50">
                      <td className="p-2 text-muted-foreground">Standard</td>
                      {results.map((r) => {
                        const cfg = algoConfig(r.algorithm)
                        return (
                          <td
                            key={r.algorithmLabel}
                            className="p-2 text-center font-mono text-[10px]"
                          >
                            {cfg?.standard || '—'}
                          </td>
                        )
                      })}
                    </tr>
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
                      <td className="p-2 text-muted-foreground">Cert Size</td>
                      {results.map((r) => {
                        const size =
                          r.formatType === 'composite' && r.components
                            ? r.components.reduce((s, c) => s + c.pem.length, 0)
                            : r.pem.length
                        return (
                          <td key={r.algorithmLabel} className="p-2 text-center font-mono text-xs">
                            {size} chars{r.formatType === 'composite' ? '*' : ''}
                          </td>
                        )
                      })}
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="p-2 text-muted-foreground">Quantum Safe</td>
                      {results.map((r) => (
                        <td key={r.algorithmLabel} className="p-2 text-center">
                          {r.formatType === 'classical' ? (
                            <span className="text-destructive font-bold">No</span>
                          ) : (
                            <span className="text-success font-bold">Yes</span>
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="p-2 text-muted-foreground">Standardized</td>
                      {results.map((r) => (
                        <td key={r.algorithmLabel} className="p-2 text-center">
                          {r.formatType === 'composite' ? (
                            <span className="text-warning font-bold text-xs">Draft</span>
                          ) : (
                            <span className="text-success font-bold text-xs">Yes</span>
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-2 text-muted-foreground">Legacy Compatible</td>
                      {results.map((r) => (
                        <td key={r.algorithmLabel} className="p-2 text-center">
                          {r.formatType === 'classical' ? (
                            <span className="text-success font-bold text-xs">Yes</span>
                          ) : r.formatType === 'composite' ? (
                            <span className="text-destructive font-bold text-xs">No</span>
                          ) : (
                            <span className="text-destructive font-bold text-xs">No</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
                <p className="text-[10px] text-muted-foreground mt-2">
                  * Composite size shows combined component cert sizes. True composite cert (single
                  OID) would produce one certificate of similar combined size.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Educational notes per format */}
      <div className="space-y-3">
        <div className="bg-muted/50 rounded-lg p-4 border border-success/20">
          <p className="text-xs text-muted-foreground">
            <strong className="text-success">Pure PQC (RFC 9881):</strong> The simplest path to
            quantum safety. ML-DSA-65 uses OID{' '}
            <span className="font-mono">2.16.840.1.101.3.4.3.18</span> in the signatureAlgorithm
            field of a standard X.509 cert. Inspect the Parsed Fields output above to see the OID in
            the actual certificate. Fully supported in OpenSSL 3.x.
          </p>
        </div>
        <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
          <p className="text-xs text-muted-foreground">
            <strong className="text-primary">
              Composite (draft-ietf-lamps-pq-composite-sigs-14):
            </strong>{' '}
            Would use a single composite OID (e.g.,{' '}
            <span className="font-mono">id-MLDSA65-ECDSA-P256 = 2.16.840.1.114027.80.8.1.6</span>)
            that encodes both algorithm identifiers. The public key and signature fields both
            contain the concatenation of the classical and PQC components. Both signatures must
            verify independently. OpenSSL composite OID support is not yet in production releases —
            the component certs above represent what would be packaged together.
          </p>
        </div>
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <p className="text-xs text-muted-foreground">
            <strong>Parallel/Alt-Sig approach:</strong> A third option not generated here — uses PQC
            as the primary signatureAlgorithm plus the classical key/sig in X.509 extension fields
            AltSignatureAlgorithm (OID 2.5.29.73) and AltSignatureValue (OID 2.5.29.74). Legacy
            verifiers that do not understand these extensions will still validate the primary PQC
            signature, making this the most backward-compatible hybrid approach.
          </p>
        </div>
      </div>
    </div>
  )
}
