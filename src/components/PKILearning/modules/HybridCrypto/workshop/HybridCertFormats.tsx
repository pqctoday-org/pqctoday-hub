// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useCallback } from 'react'
import { Loader2, Play, FileText, ExternalLink, Link2 } from 'lucide-react'
import { hybridCryptoService, type CertResult } from '../services/HybridCryptoService'
import { HYBRID_CERT_FORMATS, type HybridFormatId } from '../constants'

interface FormatResult {
  formatId: HybridFormatId
  certs: Array<{ label: string; pem: string; parsed: string; type: 'classical' | 'pqc' }>
  timingMs: number
  bindingHash?: string
  error?: string
}

export const HybridCertFormats: React.FC = () => {
  const [results, setResults] = useState<Record<string, FormatResult>>({})
  const [generating, setGenerating] = useState<string | null>(null)
  const [expandedViews, setExpandedViews] = useState<Record<string, 'pem' | 'parsed' | null>>({})

  const toggleView = (key: string, view: 'pem' | 'parsed') => {
    setExpandedViews((prev) => ({
      ...prev,
      [key]: prev[key] === view ? null : view,
    }))
  }

  const generateFormat = useCallback(async (formatId: HybridFormatId) => {
    setGenerating(formatId)
    const start = performance.now()

    try {
      if (formatId === 'pure-pqc' || formatId === 'pure-pqc-slh') {
        const algName = formatId === 'pure-pqc' ? 'ML-DSA-65' : 'SLH-DSA-128s'
        const rawPrefix = formatId === 'pure-pqc' ? 'pure_pqc' : 'pure_pqc_slh'

        const keyResult = await hybridCryptoService.generateKey(algName, `${rawPrefix}_key.pem`)
        if (keyResult.error) {
          setResults((prev) => ({
            ...prev,
            [formatId]: {
              formatId,
              certs: [],
              timingMs: performance.now() - start,
              error: keyResult.error,
            },
          }))
          setGenerating(null)
          return
        }

        const certResult = await hybridCryptoService.generateSelfSignedCert(
          `${rawPrefix}_key.pem`,
          `${rawPrefix}_cert.pem`,
          `/CN=Pure PQC (${algName}) Demo/O=PQC Today/OU=Hybrid Certificate Sandbox`,
          keyResult.fileData
        )
        setResults((prev) => ({
          ...prev,
          [formatId]: {
            formatId,
            certs: [
              {
                label: `${algName} Certificate`,
                pem: certResult.pem,
                parsed: certResult.parsed,
                type: 'pqc',
              },
            ],
            timingMs: performance.now() - start,
            error: certResult.error,
          },
        }))
      } else if (formatId === 'composite') {
        // Generate both component certs
        const ecKey = await hybridCryptoService.generateKey('EC', 'comp_ec_key.pem')
        const ecCert = ecKey.error
          ? ({ pem: '', parsed: '', timingMs: 0, error: ecKey.error } as CertResult)
          : await hybridCryptoService.generateSelfSignedCert(
              'comp_ec_key.pem',
              'comp_ec_cert.pem',
              '/CN=Composite ECDSA Component/O=PQC Today/OU=Hybrid Certificate Sandbox',
              ecKey.fileData
            )

        const pqcKey = await hybridCryptoService.generateKey('ML-DSA-65', 'comp_pqc_key.pem')
        const pqcCert = pqcKey.error
          ? ({ pem: '', parsed: '', timingMs: 0, error: pqcKey.error } as CertResult)
          : await hybridCryptoService.generateSelfSignedCert(
              'comp_pqc_key.pem',
              'comp_pqc_cert.pem',
              '/CN=Composite ML-DSA Component/O=PQC Today/OU=Hybrid Certificate Sandbox',
              pqcKey.fileData
            )

        const hasError = ecCert.error || pqcCert.error
        setResults((prev) => ({
          ...prev,
          [formatId]: {
            formatId,
            certs: hasError
              ? []
              : [
                  {
                    label: 'Component 1: ECDSA P-256 (Classical)',
                    pem: ecCert.pem,
                    parsed: ecCert.parsed,
                    type: 'classical',
                  },
                  {
                    label: 'Component 2: ML-DSA-65 (PQC)',
                    pem: pqcCert.pem,
                    parsed: pqcCert.parsed,
                    type: 'pqc',
                  },
                ],
            timingMs: performance.now() - start,
            error: hasError ? ecCert.error || pqcCert.error : undefined,
          },
        }))
      } else if (formatId === 'related-certs') {
        const relResult = await hybridCryptoService.generateRelatedCertPair()
        setResults((prev) => ({
          ...prev,
          [formatId]: {
            formatId,
            certs: relResult.error
              ? []
              : [
                  {
                    label: 'Certificate A: ECDSA P-256 (Classical)',
                    pem: relResult.classical.pem,
                    parsed: relResult.classical.parsed,
                    type: 'classical',
                  },
                  {
                    label: 'Certificate B: ML-DSA-65 (PQC)',
                    pem: relResult.pqc.pem,
                    parsed: relResult.pqc.parsed,
                    type: 'pqc',
                  },
                ],
            timingMs: relResult.totalMs,
            bindingHash: relResult.bindingHash,
            error: relResult.error,
          },
        }))
      } else if (formatId === 'chameleon') {
        // Chameleon: generate primary PQC cert + classical cert, show delta concept
        const pqcKey = await hybridCryptoService.generateKey('ML-DSA-65', 'cham_pqc_key.pem')
        const pqcCert = pqcKey.error
          ? ({ pem: '', parsed: '', timingMs: 0, error: pqcKey.error } as CertResult)
          : await hybridCryptoService.generateSelfSignedCert(
              'cham_pqc_key.pem',
              'cham_pqc_cert.pem',
              '/CN=Chameleon Primary (PQC)/O=PQC Today/OU=Hybrid Certificate Sandbox',
              pqcKey.fileData
            )

        const ecKey = await hybridCryptoService.generateKey('EC', 'cham_ec_key.pem')
        const ecCert = ecKey.error
          ? ({ pem: '', parsed: '', timingMs: 0, error: ecKey.error } as CertResult)
          : await hybridCryptoService.generateSelfSignedCert(
              'cham_ec_key.pem',
              'cham_ec_cert.pem',
              '/CN=Chameleon Reconstructed (Classical)/O=PQC Today/OU=Hybrid Certificate Sandbox',
              ecKey.fileData
            )

        const hasError = pqcCert.error || ecCert.error
        setResults((prev) => ({
          ...prev,
          [formatId]: {
            formatId,
            certs: hasError
              ? []
              : [
                  {
                    label: 'Primary Certificate: ML-DSA-65 (transmitted)',
                    pem: pqcCert.pem,
                    parsed: pqcCert.parsed,
                    type: 'pqc',
                  },
                  {
                    label: 'Reconstructed Certificate: ECDSA P-256 (from delta)',
                    pem: ecCert.pem,
                    parsed: ecCert.parsed,
                    type: 'classical',
                  },
                ],
            timingMs: performance.now() - start,
            error: hasError ? pqcCert.error || ecCert.error : undefined,
          },
        }))
      }
    } catch (e) {
      setResults((prev) => ({
        ...prev,
        [formatId]: {
          formatId,
          certs: [],
          timingMs: performance.now() - start,
          error: e instanceof Error ? e.message : 'Generation failed',
        },
      }))
    }

    setGenerating(null)
  }, [])

  const generateAll = useCallback(async () => {
    setGenerating('all')
    for (const fmt of HYBRID_CERT_FORMATS) {
      await generateFormat(fmt.id)
    }
    setGenerating(null)
  }, [generateFormat])

  const completedFormats = Object.values(results).filter((r) => !r.error)
  const allGenerated = completedFormats.length === HYBRID_CERT_FORMATS.length

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Four Hybrid Certificate Formats</h3>
        <p className="text-sm text-muted-foreground">
          Generate and compare the four X.509 hybrid certificate approaches. Each format combines
          classical and PQC algorithms differently, with distinct trade-offs for backward
          compatibility, standardization, and security properties.
        </p>
      </div>

      {/* Generate All button */}
      <button
        onClick={generateAll}
        disabled={generating !== null}
        className="flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {generating === 'all' ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Generating All Formats...
          </>
        ) : (
          <>
            <Play size={18} fill="currentColor" />
            Generate All Four Formats
          </>
        )}
      </button>

      {/* Format cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {HYBRID_CERT_FORMATS.map((fmt) => {
          const result = results[fmt.id]
          const isGeneratingThis = generating === fmt.id || (generating === 'all' && !result)

          return (
            <div key={fmt.id} className="glass-panel p-5 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-primary" />
                  <h4 className="font-bold text-foreground text-sm">{fmt.label}</h4>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded border font-bold bg-${fmt.statusColor}/10 text-${fmt.statusColor} border-${fmt.statusColor}/20`}
                >
                  {fmt.status}
                </span>
              </div>

              {/* Standard & OIDs */}
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="font-medium">Standard:</span>
                  <a
                    href={fmt.standardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-0.5"
                  >
                    {fmt.standard}
                    <ExternalLink size={10} />
                  </a>
                </div>
                {fmt.oids.map((oid, i) => (
                  <div key={i} className="font-mono text-[10px] text-muted-foreground">
                    OID: {oid}
                  </div>
                ))}
              </div>

              {/* ASN.1 Structure Diagram */}
              <div className="font-mono text-[10px] bg-background p-3 rounded border border-border">
                {fmt.structureLines.map((line, i) => (
                  <div
                    key={i}
                    className={`text-${line.color}`}
                    style={{ paddingLeft: `${line.indent * 12}px` }}
                  >
                    {line.text || '\u00A0'}
                  </div>
                ))}
              </div>

              {/* Generate button or results */}
              {!result && !isGeneratingThis && (
                <button
                  onClick={() => generateFormat(fmt.id)}
                  disabled={generating !== null}
                  className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary font-medium rounded-lg hover:bg-primary/20 disabled:opacity-50 transition-colors text-sm border border-primary/20"
                >
                  <Play size={14} fill="currentColor" />
                  Generate
                </button>
              )}

              {isGeneratingThis && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 size={16} className="animate-spin" />
                  Generating...
                </div>
              )}

              {result && (
                <div className="space-y-3">
                  {result.error ? (
                    <p className="text-xs text-destructive">{result.error}</p>
                  ) : (
                    <>
                      {/* Timing */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          Total:{' '}
                          <strong className="text-foreground">
                            {result.timingMs.toFixed(0)}ms
                          </strong>
                        </span>
                        <span>
                          Certs: <strong className="text-foreground">{result.certs.length}</strong>
                        </span>
                        <span>
                          Size:{' '}
                          <strong className="text-foreground">
                            {result.certs.reduce((s, c) => s + c.pem.length, 0)} chars
                          </strong>
                        </span>
                      </div>

                      {/* Binding hash for related certs */}
                      {result.bindingHash && (
                        <div className="flex items-start gap-2 bg-primary/5 rounded-lg p-2 border border-primary/10">
                          <Link2 size={14} className="text-primary shrink-0 mt-0.5" />
                          <div>
                            <div className="text-[10px] font-medium text-primary">
                              RelatedCertificate binding hash (SHA-256)
                            </div>
                            <div className="font-mono text-[10px] text-muted-foreground break-all">
                              {result.bindingHash}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Component certs */}
                      {result.certs.map((cert) => {
                        const viewKey = `${fmt.id}-${cert.type}`
                        const currentView = expandedViews[viewKey]
                        const badgeClass =
                          cert.type === 'pqc'
                            ? 'bg-success/10 text-success border-success/20'
                            : 'bg-warning/10 text-warning border-warning/20'

                        return (
                          <div
                            key={cert.label}
                            className="border border-border rounded-lg p-3 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-foreground">
                                {cert.label}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${badgeClass}`}
                              >
                                {cert.type === 'pqc' ? 'PQC' : 'CLASSICAL'}
                              </span>
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono">
                              PEM size: {cert.pem.length} chars
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => toggleView(viewKey, 'parsed')}
                                className={`text-[10px] px-2 py-1 rounded transition-colors ${
                                  currentView === 'parsed'
                                    ? 'bg-primary/20 text-primary border border-primary/50'
                                    : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
                                }`}
                              >
                                Parsed
                              </button>
                              <button
                                onClick={() => toggleView(viewKey, 'pem')}
                                className={`text-[10px] px-2 py-1 rounded transition-colors ${
                                  currentView === 'pem'
                                    ? 'bg-primary/20 text-primary border border-primary/50'
                                    : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
                                }`}
                              >
                                PEM
                              </button>
                            </div>
                            {currentView && (
                              <pre className="text-[10px] bg-background p-2 rounded border border-border overflow-x-auto max-h-48 overflow-y-auto font-mono whitespace-pre-wrap">
                                {currentView === 'parsed' ? cert.parsed.trim() : cert.pem.trim()}
                              </pre>
                            )}
                          </div>
                        )
                      })}
                    </>
                  )}
                </div>
              )}

              {/* Educational note */}
              <div className="bg-muted/30 rounded-lg p-3 border border-border">
                <p className="text-[10px] text-muted-foreground">{fmt.educationalNote}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Comparison table */}
      {allGenerated && (
        <div className="glass-panel p-4">
          <h4 className="text-sm font-bold text-foreground mb-3">Format Comparison</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-muted-foreground font-medium">Property</th>
                  {HYBRID_CERT_FORMATS.map((fmt) => (
                    <th key={fmt.id} className="text-center p-2 text-foreground font-bold text-xs">
                      {fmt.shortLabel}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="p-2 text-muted-foreground">Standard</td>
                  {HYBRID_CERT_FORMATS.map((fmt) => (
                    <td key={fmt.id} className="p-2 text-center font-mono text-[10px]">
                      {fmt.standard}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-border/50">
                  <td className="p-2 text-muted-foreground">Approach</td>
                  {HYBRID_CERT_FORMATS.map((fmt) => (
                    <td key={fmt.id} className="p-2 text-center text-xs">
                      {fmt.approach}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-border/50">
                  <td className="p-2 text-muted-foreground">Total Size</td>
                  {HYBRID_CERT_FORMATS.map((fmt) => {
                    const r = results[fmt.id]
                    const size = r?.certs.reduce((s, c) => s + c.pem.length, 0) || 0
                    return (
                      <td key={fmt.id} className="p-2 text-center font-mono text-xs">
                        {size > 0 ? `${size} chars` : '—'}
                      </td>
                    )
                  })}
                </tr>
                <tr className="border-b border-border/50">
                  <td className="p-2 text-muted-foreground">Gen Time</td>
                  {HYBRID_CERT_FORMATS.map((fmt) => {
                    const r = results[fmt.id]
                    return (
                      <td key={fmt.id} className="p-2 text-center font-mono text-xs">
                        {r ? `${r.timingMs.toFixed(0)} ms` : '—'}
                      </td>
                    )
                  })}
                </tr>
                <tr className="border-b border-border/50">
                  <td className="p-2 text-muted-foreground">Quantum Safe</td>
                  {HYBRID_CERT_FORMATS.map((fmt) => (
                    <td key={fmt.id} className="p-2 text-center">
                      <span className="text-success font-bold text-xs">Yes</span>
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-border/50">
                  <td className="p-2 text-muted-foreground">Legacy Compatible</td>
                  {HYBRID_CERT_FORMATS.map((fmt) => (
                    <td key={fmt.id} className="p-2 text-center">
                      {fmt.legacyCompat ? (
                        <span className="text-success font-bold text-xs">Yes</span>
                      ) : (
                        <span className="text-destructive font-bold text-xs">No</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-2 text-muted-foreground">Status</td>
                  {HYBRID_CERT_FORMATS.map((fmt) => (
                    <td key={fmt.id} className="p-2 text-center">
                      <span className={`text-xs font-bold text-${fmt.statusColor}`}>
                        {fmt.status}
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
