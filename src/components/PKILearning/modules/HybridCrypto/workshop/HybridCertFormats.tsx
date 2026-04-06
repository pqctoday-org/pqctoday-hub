// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useCallback } from 'react'
import { Loader2, Play, FileText, ExternalLink, Link2, Copy, Check } from 'lucide-react'
import { hybridCryptoService } from '../services/HybridCryptoService'
import { HYBRID_CERT_FORMATS, STATUS_BADGE_CLASSES, type HybridFormatId } from '../constants'
import { useHSM } from '@/hooks/useHSM'
import type { HsmFamily } from '@/components/Playground/hsm/HsmContext'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import { HsmKeyInspector } from '@/components/shared/HsmKeyInspector'
import { Button } from '@/components/ui/button'

const LIVE_OPERATIONS = ['C_GenerateKeyPair', 'C_SignInit', 'C_Sign']

interface FormatResult {
  formatId: HybridFormatId
  certs: Array<{ label: string; pem: string; parsed: string; type: 'classical' | 'pqc' }>
  timingMs: number
  bindingHash?: string
  error?: string
}

/** Compute DER byte size from a PEM string (strips headers, base64-decodes length). */
function pemToDerSize(pem: string): number {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/[\s\r\n]/g, '')
  const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0
  return Math.floor((b64.length * 3) / 4) - padding
}

export const HybridCertFormats: React.FC = () => {
  const [results, setResults] = useState<Record<string, FormatResult>>({})
  const [generating, setGenerating] = useState<string | null>(null)
  const [expandedViews, setExpandedViews] = useState<Record<string, 'pem' | 'parsed' | null>>({})
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const hsm = useHSM()

  const toggleView = (key: string, view: 'pem' | 'parsed') => {
    setExpandedViews((prev) => ({
      ...prev,
      [key]: prev[key] === view ? null : view,
    }))
  }

  const copyToClipboard = useCallback(async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }, [])

  const onKeyTracked = useCallback(
    (handle: number, family: HsmFamily, label: string) => {
      hsm.addKey({
        handle,
        family,
        role: 'private',
        label,
        generatedAt: new Date().toLocaleTimeString('en-US', { hour12: false }),
      })
    },
    [hsm]
  )

  const generateFormat = useCallback(
    async (formatId: HybridFormatId) => {
      if (!hsm.isReady || !hsm.moduleRef.current || !hsm.hSessionRef.current) return
      const M = hsm.moduleRef.current
      const hSession = hsm.hSessionRef.current

      setGenerating(formatId)
      const start = performance.now()
      const subject = '/CN=Hybrid Certificate Demo/O=PQC Today/OU=Hybrid Certificate Sandbox'

      try {
        if (formatId === 'pure-pqc-slh') {
          // SLH-DSA-128s: Real DER-encoded certificate via liboqs + ASN.1 builder (RFC 9909).
          const certResult = await hybridCryptoService.generateSelfSignedCertSLHDSA(
            '/CN=Pure PQC (SLH-DSA-128s) Demo/O=PQC Today/OU=Hybrid Certificate Sandbox',
            M,
            hSession,
            onKeyTracked
          )
          setResults((prev) => ({
            ...prev,
            [formatId]: {
              formatId,
              certs: certResult.error
                ? []
                : [
                    {
                      label: 'SLH-DSA-128s Certificate',
                      pem: certResult.pem,
                      parsed: certResult.parsed,
                      type: 'pqc',
                    },
                  ],
              timingMs: certResult.timingMs,
              error: certResult.error,
            },
          }))
          setGenerating(null)
          return
        } else if (formatId === 'pure-pqc') {
          const certResult = await hybridCryptoService.generatePurePQCCertMLDSA(
            subject,
            M,
            hSession,
            onKeyTracked
          )
          setResults((prev) => ({
            ...prev,
            [formatId]: {
              formatId,
              certs: certResult.error
                ? []
                : [
                    {
                      label: 'ML-DSA-65 Certificate (RFC 9881)',
                      pem: certResult.pem,
                      parsed: certResult.parsed,
                      type: 'pqc',
                    },
                  ],
              timingMs: certResult.timingMs,
              error: certResult.error,
            },
          }))
        } else if (formatId === 'composite') {
          // Real composite certificate (draft-ietf-lamps-pq-composite-sigs-15)
          const certResult = await hybridCryptoService.generateCompositeCert(
            subject,
            M,
            hSession,
            onKeyTracked
          )
          setResults((prev) => ({
            ...prev,
            [formatId]: {
              formatId,
              certs: certResult.error
                ? []
                : [
                    {
                      label: 'Composite: MLDSA65-ECDSA-P256-SHA512',
                      pem: certResult.pem,
                      parsed: certResult.parsed,
                      type: 'pqc',
                    },
                  ],
              timingMs: certResult.timingMs,
              error: certResult.error,
            },
          }))
        } else if (formatId === 'alt-sig') {
          // Real Alt-Sig certificate (ITU-T X.509 §9.8)
          const certResult = await hybridCryptoService.generateAltSigCert(
            subject,
            M,
            hSession,
            onKeyTracked
          )
          setResults((prev) => ({
            ...prev,
            [formatId]: {
              formatId,
              certs: certResult.error
                ? []
                : [
                    {
                      label: 'Alt-Sig Certificate: ECDSA primary + ML-DSA-65 extensions',
                      pem: certResult.pem,
                      parsed: certResult.parsed,
                      type: 'classical',
                    },
                  ],
              timingMs: certResult.timingMs,
              error: certResult.error,
            },
          }))
        } else if (formatId === 'related-certs') {
          const relResult = await hybridCryptoService.generateRelatedCertPairReal(
            subject,
            M,
            hSession,
            onKeyTracked
          )
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
          // Real Chameleon certificate (draft-bonnell-lamps-chameleon-certs-07)
          const certResult = await hybridCryptoService.generateChameleonCert(
            subject,
            M,
            hSession,
            onKeyTracked
          )
          setResults((prev) => ({
            ...prev,
            [formatId]: {
              formatId,
              certs: certResult.error
                ? []
                : [
                    {
                      label: 'Chameleon: ML-DSA-65 primary + ECDSA delta',
                      pem: certResult.pem,
                      parsed: certResult.parsed,
                      type: 'pqc',
                    },
                  ],
              timingMs: certResult.timingMs,
              error: certResult.error,
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
    },
    [hsm, onKeyTracked]
  )

  const generateAll = useCallback(async () => {
    setGenerating('all')
    for (const fmt of HYBRID_CERT_FORMATS) {
      await generateFormat(fmt.id)
    }
    setGenerating(null)
  }, [generateFormat])

  const anyGenerated = Object.values(results).some((r) => !r.error)

  return (
    <div className="flex flex-col h-full relative">
      {/* Header bar — LiveHSMToggle anchored per hsm-ui-layout-pattern.md §2 */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-muted/10 mb-6 rounded-t-xl">
        <LiveHSMToggle hsm={hsm} operations={LIVE_OPERATIONS} />
      </div>

      <div className="space-y-6 px-1">
        <div>
          <h3 className="text-lg font-bold text-foreground mb-2">Hybrid Certificate Formats</h3>
          <p className="text-sm text-muted-foreground">
            Generate and compare X.509 hybrid certificate approaches. Each format combines classical
            and PQC algorithms differently, with distinct trade-offs for backward compatibility,
            standardization, and security properties.
          </p>
        </div>

        {/* HSM not ready hint */}
        {!hsm.isReady && (
          <p className="text-xs text-muted-foreground bg-muted/20 border border-border rounded-lg px-4 py-2">
            Enable the HSM above to generate certificates.
          </p>
        )}

        {/* Generate All button */}
        <Button
          variant="gradient"
          onClick={generateAll}
          disabled={generating !== null || !hsm.isReady}
          className="flex items-center gap-2"
        >
          {generating === 'all' ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Generating All Formats...
            </>
          ) : (
            <>
              <Play size={18} fill="currentColor" />
              Generate All Formats
            </>
          )}
        </Button>

        {/* Format cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {HYBRID_CERT_FORMATS.map((fmt) => {
            const result = results[fmt.id]
            const isGeneratingThis = generating === fmt.id || (generating === 'all' && !result)
            const badgeClass =
              STATUS_BADGE_CLASSES[fmt.statusColor] ?? STATUS_BADGE_CLASSES['muted']

            return (
              <div key={fmt.id} className="glass-panel p-5 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-primary" />
                    <h4 className="font-bold text-foreground text-sm">{fmt.label}</h4>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded border font-bold ${badgeClass}`}>
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateFormat(fmt.id)}
                    disabled={generating !== null || !hsm.isReady}
                    className="flex items-center gap-2 text-primary border-primary/20 hover:bg-primary/10"
                  >
                    <Play size={14} fill="currentColor" />
                    Generate
                  </Button>
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
                        {/* Timing + DER size */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            Total:{' '}
                            <strong className="text-foreground">
                              {result.timingMs.toFixed(0)}ms
                            </strong>
                          </span>
                          <span>
                            DER:{' '}
                            <strong className="text-foreground">
                              {result.certs.reduce((s, c) => s + pemToDerSize(c.pem), 0)} B
                            </strong>
                          </span>
                          <span>
                            Certs:{' '}
                            <strong className="text-foreground">{result.certs.length}</strong>
                          </span>
                        </div>

                        {/* Binding hash for related certs */}
                        {result.bindingHash && (
                          <div className="flex items-start gap-2 bg-primary/5 rounded-lg p-2 border border-primary/10">
                            <Link2 size={14} className="text-primary shrink-0 mt-0.5" />
                            <div>
                              <div className="text-[10px] font-medium text-primary">
                                SHA-256(Cert A) — stored in Cert B&apos;s RelatedCertificate
                                extension
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
                          const certBadgeClass =
                            cert.type === 'pqc'
                              ? 'bg-success/10 text-success border-success/20'
                              : 'bg-warning/10 text-warning border-warning/20'
                          const copyKey = `${viewKey}-${currentView}`
                          const isCopied = copiedKey === copyKey

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
                                  className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${certBadgeClass}`}
                                >
                                  {cert.type === 'pqc' ? 'PQC' : 'CLASSICAL'}
                                </span>
                              </div>
                              <div className="flex gap-2 items-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleView(viewKey, 'parsed')}
                                  className={`text-[10px] h-7 px-2 ${
                                    currentView === 'parsed'
                                      ? 'bg-primary/20 text-primary border border-primary/50'
                                      : 'text-muted-foreground border border-border hover:border-primary/30'
                                  }`}
                                >
                                  Parsed
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleView(viewKey, 'pem')}
                                  className={`text-[10px] h-7 px-2 ${
                                    currentView === 'pem'
                                      ? 'bg-primary/20 text-primary border border-primary/50'
                                      : 'text-muted-foreground border border-border hover:border-primary/30'
                                  }`}
                                >
                                  PEM
                                </Button>
                                {currentView && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      copyToClipboard(
                                        currentView === 'pem'
                                          ? cert.pem.trim()
                                          : cert.parsed.trim(),
                                        copyKey
                                      )
                                    }
                                    className="text-[10px] h-7 px-2 text-muted-foreground border border-border hover:border-primary/30 ml-auto"
                                  >
                                    {isCopied ? (
                                      <Check size={11} className="text-success" />
                                    ) : (
                                      <Copy size={11} />
                                    )}
                                  </Button>
                                )}
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

        {/* Comparison table — shown as soon as any format is generated */}
        {anyGenerated && (
          <div className="glass-panel p-4">
            <h4 className="text-sm font-bold text-foreground mb-3">Format Comparison</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2 text-muted-foreground font-medium">Property</th>
                    {HYBRID_CERT_FORMATS.map((fmt) => (
                      <th
                        key={fmt.id}
                        className="text-center p-2 text-foreground font-bold text-xs"
                      >
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
                    <td className="p-2 text-muted-foreground">DER Size</td>
                    {HYBRID_CERT_FORMATS.map((fmt) => {
                      const r = results[fmt.id]
                      const size = r?.certs.reduce((s, c) => s + pemToDerSize(c.pem), 0) ?? 0
                      return (
                        <td key={fmt.id} className="p-2 text-center font-mono text-xs">
                          {r && !r.error && size > 0 ? `${size} B` : '—'}
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
                          {r && !r.error ? `${r.timingMs.toFixed(0)} ms` : '—'}
                        </td>
                      )
                    })}
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="p-2 text-muted-foreground">Quantum Safe</td>
                    {HYBRID_CERT_FORMATS.map((fmt) => (
                      <td key={fmt.id} className="p-2 text-center">
                        {fmt.quantumSafe === 'system' ? (
                          <span
                            className="text-warning font-bold text-xs"
                            title="Only the two-cert system is quantum-safe; classical cert alone is not"
                          >
                            System
                          </span>
                        ) : (
                          <span className="text-success font-bold text-xs">Yes</span>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="p-2 text-muted-foreground">Legacy Compat</td>
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
                    {HYBRID_CERT_FORMATS.map((fmt) => {
                      const cls =
                        STATUS_BADGE_CLASSES[fmt.statusColor] ?? STATUS_BADGE_CLASSES['muted']
                      return (
                        <td key={fmt.id} className="p-2 text-center">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${cls}`}
                          >
                            {fmt.status}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {hsm.isReady && (
          <Pkcs11LogPanel
            log={hsm.log}
            onClear={hsm.clearLog}
            title="PKCS#11 Hybrid Cert Gen Log"
            filterFns={LIVE_OPERATIONS}
          />
        )}
        {hsm.isReady && (
          <HsmKeyInspector
            keys={hsm.keys}
            moduleRef={hsm.moduleRef}
            hSessionRef={hsm.hSessionRef}
            onRemoveKey={hsm.removeKey}
          />
        )}
      </div>
    </div>
  )
}
