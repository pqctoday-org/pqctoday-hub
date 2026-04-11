// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useCallback } from 'react'
import {
  Loader2,
  Play,
  Search,
  BarChart3,
  FileText,
  ExternalLink,
  Download,
  ChevronDown,
  ChevronRight,
  FlaskConical,
  Globe,
} from 'lucide-react'
import { hybridCryptoService } from '../services/HybridCryptoService'
import { HYBRID_CERT_FORMATS } from '../constants'
import { parseCertificateInfo, oidToLabel, type CertInfo } from '../services/derParser'
import {
  IETF_CERT_VECTORS,
  decodeDer,
  derToPem,
  type IETFCertVector,
} from '../data/ietfTestVectors'
import { Button } from '@/components/ui/button'

interface GeneratedCert {
  formatId: string
  formatLabel: string
  certs: Array<{
    label: string
    pem: string
    parsed: string
    type: 'classical' | 'pqc'
  }>
}

interface ParsedField {
  key: string
  value: string
  children: ParsedField[]
  depth: number
}

interface IETFParsedResult {
  openSSLText: string
  certInfo: CertInfo
}

function parseCertText(text: string): ParsedField[] {
  const lines = text.split('\n')
  const result: ParsedField[] = []
  const stack: ParsedField[] = []

  for (const line of lines) {
    if (!line.trim()) continue

    // Skip lines that have binary/control characters (e.g., OpenSSL unparsed octet strings)
    // We allow standard ASCII printable (0x20-0x7E) plus tab
    // eslint-disable-next-line no-control-regex
    if (/[^\x09\x20-\x7E]/.test(line)) continue

    const indent = line.search(/\S/)
    const trimmed = line.trim()

    const colonIdx = trimmed.indexOf(':')
    let key: string
    let value: string

    if (colonIdx > 0 && colonIdx < trimmed.length - 1) {
      key = trimmed.substring(0, colonIdx).trim()
      value = trimmed.substring(colonIdx + 1).trim()
    } else {
      key = trimmed.replace(/:$/, '')
      value = ''
    }

    const field: ParsedField = { key, value, children: [], depth: indent }

    while (stack.length > 0 && stack[stack.length - 1].depth >= indent) {
      stack.pop()
    }

    if (stack.length > 0) {
      stack[stack.length - 1].children.push(field)
    } else {
      result.push(field)
    }
    stack.push(field)
  }

  return result
}

function generateIETFText(vector: IETFCertVector, certInfo: CertInfo): string {
  const algLabel = certInfo.algorithmOID ? oidToLabel(certInfo.algorithmOID) : vector.algorithmLabel
  const pubLabel = certInfo.publicKeyOID ? oidToLabel(certInfo.publicKeyOID) : algLabel

  const extLines: string[] = []
  if (certInfo.extensionOIDs.length > 0) {
    extLines.push('        X509v3 extensions:')
    for (const ext of certInfo.extensionOIDs) {
      extLines.push(`            ${oidToLabel(ext)}: present`)
    }
  }

  const specialExtLines: string[] = []
  if (vector.specialExtensions && vector.specialExtensions.length > 0) {
    specialExtLines.push('        Special Hybrid Extensions:')
    for (const ext of vector.specialExtensions) {
      specialExtLines.push(`            ${ext.oid} (${ext.label}):`)
      specialExtLines.push(`                ${ext.description}`)
    }
  }

  const formatHexBlock = (bytes: Uint8Array | undefined, indent: number): string => {
    if (!bytes || bytes.length === 0) return ''
    const hexStr = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0'))
    const lines: string[] = []
    const spaces = ' '.repeat(indent)
    for (let i = 0; i < hexStr.length; i += 15) {
      lines.push(spaces + hexStr.slice(i, i + 15).join(':') + (i + 15 < hexStr.length ? ':' : ''))
    }
    return '\n' + lines.join('\n')
  }

  const pubKeyHex = formatHexBlock(certInfo.publicKeyBytes, 20)
  const sigHex = formatHexBlock(certInfo.signatureBytes, 8)

  return [
    'Certificate:',
    '    Data:',
    '        Version: 3 (0x2)',
    `        Serial Number: (omitted in simplified view)`,
    `    Signature Algorithm: ${algLabel}`,
    `    Issuer: CN=${vector.provider} Test Root`,
    '    Validity',
    `        Not Before: (omitted)`,
    `        Not After : (omitted)`,
    `    Subject: CN=${vector.label}`,
    '    Subject Public Key Info:',
    `        Public Key Algorithm: ${pubLabel}`,
    `            Public-Key: (${certInfo.publicKeySizeBytes * 8} bit)${pubKeyHex}`,
    ...extLines,
    ...specialExtLines,
    `    Signature Algorithm: ${algLabel}`,
    `    Signature Value: (${certInfo.signatureSizeBytes} bytes)${sigHex}`,
  ].join('\n')
}

const TreeNode: React.FC<{
  field: ParsedField
  defaultOpen?: boolean
}> = ({ field, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const hasChildren = field.children.length > 0

  return (
    <div className="ml-3">
      <div
        role={hasChildren ? 'button' : undefined}
        tabIndex={hasChildren ? 0 : undefined}
        className={`flex items-start gap-1 py-0.5 ${hasChildren ? 'cursor-pointer hover:bg-muted/30 rounded' : ''}`}
        onClick={() => hasChildren && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (hasChildren && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            setIsOpen(!isOpen)
          }
        }}
      >
        {hasChildren ? (
          isOpen ? (
            <ChevronDown size={12} className="text-muted-foreground shrink-0 mt-0.5" />
          ) : (
            <ChevronRight size={12} className="text-muted-foreground shrink-0 mt-0.5" />
          )
        ) : (
          <span className="w-3 shrink-0" />
        )}
        <span className="text-primary text-[10px] font-medium shrink-0">{field.key}</span>
        {field.value && (
          <span className="text-foreground text-[10px] font-mono break-all">{field.value}</span>
        )}
      </div>
      {isOpen &&
        field.children.map((child, i) => (
          <TreeNode key={`${child.key}-${i}`} field={child} defaultOpen={child.depth < 8} />
        ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// IETF cert type badge colour
// ---------------------------------------------------------------------------
function certTypeBadge(certType: IETFCertVector['certType']) {
  switch (certType) {
    case 'composite':
      return 'bg-primary/10 text-primary border-primary/20'
    case 'catalyst':
      return 'bg-warning/10 text-warning border-warning/20'
    case 'chameleon':
      return 'bg-success/10 text-success border-success/20'
    case 'pure-pqc':
      return 'bg-success/10 text-success border-success/20'
    case 'related-certs':
      return 'bg-primary/10 text-primary border-primary/20'
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export const HybridCertInspector: React.FC = () => {
  // --- Generated certs state (existing) ---
  const [certs, setCerts] = useState<GeneratedCert[]>([])
  const [generating, setGenerating] = useState(false)
  const [selectedCert, setSelectedCert] = useState<{
    formatIdx: number
    certIdx: number
  } | null>(null)
  const [viewMode, setViewMode] = useState<'tree' | 'raw' | 'size'>('tree')

  // --- Source toggle ---
  const [source, setSource] = useState<'generated' | 'ietf'>('generated')

  // --- IETF certs state ---
  const [ietfSelectedId, setIETFSelectedId] = useState<string>(IETF_CERT_VECTORS[0].id)
  const [ietfParsed, setIETFParsed] = useState<Record<string, IETFParsedResult>>({})
  const [ietfLoading, setIETFLoading] = useState<string | null>(null)
  const [ietfViewMode, setIETFViewMode] = useState<'tree' | 'raw' | 'size'>('tree')

  // ---------------------------------------------------------------------------
  // Generated certs logic (unchanged from original)
  // ---------------------------------------------------------------------------
  const generateAllCerts = useCallback(async () => {
    setGenerating(true)
    const allCerts: GeneratedCert[] = []

    for (const fmt of HYBRID_CERT_FORMATS) {
      const fmtCerts: GeneratedCert['certs'] = []

      if (fmt.id === 'pure-pqc') {
        const keyResult = await hybridCryptoService.generateKey('ML-DSA-65', 'inspect_pqc_key.pem')
        if (!keyResult.error && keyResult.fileData) {
          const certResult = await hybridCryptoService.generateSelfSignedCert(
            'inspect_pqc_key.pem',
            'inspect_pqc_cert.pem',
            '/CN=Pure PQC Inspection/O=PQC Today',
            keyResult.fileData
          )
          if (!certResult.error) {
            fmtCerts.push({
              label: 'ML-DSA-65 Certificate',
              pem: certResult.pem,
              parsed: certResult.parsed,
              type: 'pqc',
            })
          }
        }
      } else {
        const ecKey = await hybridCryptoService.generateKey('EC', `inspect_${fmt.id}_ec_key.pem`)
        if (!ecKey.error && ecKey.fileData) {
          const ecCert = await hybridCryptoService.generateSelfSignedCert(
            `inspect_${fmt.id}_ec_key.pem`,
            `inspect_${fmt.id}_ec_cert.pem`,
            `/CN=${fmt.shortLabel} Classical/O=PQC Today`,
            ecKey.fileData
          )
          if (!ecCert.error) {
            fmtCerts.push({
              label: `${fmt.shortLabel}: ECDSA P-256`,
              pem: ecCert.pem,
              parsed: ecCert.parsed,
              type: 'classical',
            })
          }
        }
        const pqcKey = await hybridCryptoService.generateKey(
          'ML-DSA-65',
          `inspect_${fmt.id}_pqc_key.pem`
        )
        if (!pqcKey.error && pqcKey.fileData) {
          const pqcCert = await hybridCryptoService.generateSelfSignedCert(
            `inspect_${fmt.id}_pqc_key.pem`,
            `inspect_${fmt.id}_pqc_cert.pem`,
            `/CN=${fmt.shortLabel} PQC/O=PQC Today`,
            pqcKey.fileData
          )
          if (!pqcCert.error) {
            fmtCerts.push({
              label: `${fmt.shortLabel}: ML-DSA-65`,
              pem: pqcCert.pem,
              parsed: pqcCert.parsed,
              type: 'pqc',
            })
          }
        }
      }

      allCerts.push({ formatId: fmt.id, formatLabel: fmt.label, certs: fmtCerts })
    }

    setCerts(allCerts)
    if (allCerts.length > 0 && allCerts[0].certs.length > 0) {
      setSelectedCert({ formatIdx: 0, certIdx: 0 })
    }
    setGenerating(false)
  }, [])

  const selected =
    selectedCert !== null ? certs[selectedCert.formatIdx]?.certs[selectedCert.certIdx] : null

  const selectedFormat = selectedCert !== null ? certs[selectedCert.formatIdx] : null

  const parsedTree = selected ? parseCertText(selected.parsed) : []

  const handleDownload = () => {
    if (!selected) return
    const blob = new Blob([selected.pem], { type: 'application/x-pem-file' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selected.label.replace(/[^a-zA-Z0-9]/g, '_')}.pem`
    a.click()
    URL.revokeObjectURL(url)
  }

  const sizeBreakdown = selected
    ? (() => {
        const pemSize = selected.pem.length
        const lines = selected.parsed.split('\n')
        let pubKeySize = 0
        let sigSize = 0
        let inPubKey = false
        let inSig = false

        for (const line of lines) {
          if (line.includes('Public Key:') || line.includes('pub:')) inPubKey = true
          if (line.includes('Signature Algorithm:') && inPubKey) {
            inPubKey = false
            inSig = true
          }
          if (inPubKey && line.trim().match(/^[0-9a-f:]+$/i)) {
            pubKeySize += line.trim().replace(/:/g, '').length / 2
          }
          if (inSig && line.trim().match(/^[0-9a-f:]+$/i)) {
            sigSize += line.trim().replace(/:/g, '').length / 2
          }
        }

        const overhead = pemSize - pubKeySize - sigSize
        return { pemSize, pubKeySize, sigSize, overhead }
      })()
    : null

  // ---------------------------------------------------------------------------
  // IETF cert parsing logic
  // ---------------------------------------------------------------------------
  const parseIETFCert = useCallback(
    async (vector: IETFCertVector) => {
      if (ietfParsed[vector.id]) return // already cached
      setIETFLoading(vector.id)

      const der = decodeDer(vector.derBase64)
      const certInfo = parseCertificateInfo(der)

      // Use our custom formatted text view instead of OpenSSL
      // because OpenSSL WASM fails to parse some PQC signatures/extensions cleanly
      const openSSLText = generateIETFText(vector, certInfo)

      setIETFParsed((prev) => ({
        ...prev,
        [vector.id]: { openSSLText, certInfo },
      }))
      setIETFLoading(null)
    },
    [ietfParsed]
  )

  const handleIETFSelect = useCallback(
    (vector: IETFCertVector) => {
      setIETFSelectedId(vector.id)
      parseIETFCert(vector)
    },
    [parseIETFCert]
  )

  const handleIETFDownload = (vector: IETFCertVector) => {
    const pem = derToPem(decodeDer(vector.derBase64))
    const blob = new Blob([pem], { type: 'application/x-pem-file' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${vector.id}.pem`
    a.click()
    URL.revokeObjectURL(url)
  }

  const selectedIETFVector =
    IETF_CERT_VECTORS.find((v) => v.id === ietfSelectedId) ?? IETF_CERT_VECTORS[0]
  const selectedIETFResult = ietfParsed[ietfSelectedId] ?? null
  const isIETFLoading = ietfLoading === ietfSelectedId

  // Parse the selected IETF cert's DER synchronously for size view (certInfo only)
  const selectedIETFCertInfo =
    selectedIETFResult?.certInfo ?? parseCertificateInfo(decodeDer(selectedIETFVector.derBase64))
  const selectedIETFTree = selectedIETFResult ? parseCertText(selectedIETFResult.openSSLText) : []

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Certificate Inspector</h3>
        <p className="text-sm text-muted-foreground">
          Inspect generated X.509 certificates side-by-side with real hybrid certificates from the
          IETF Hackathon pqc-certificates test vector repository.
        </p>
      </div>

      {/* Source toggle */}
      <div className="flex gap-2">
        <Button
          variant="ghost"
          onClick={() => setSource('generated')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
            source === 'generated'
              ? 'bg-primary/10 text-primary border-primary/40'
              : 'bg-muted/30 text-muted-foreground border-border hover:border-primary/20'
          }`}
        >
          <FlaskConical size={15} />
          Your Certificates
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setSource('ietf')
            parseIETFCert(selectedIETFVector)
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
            source === 'ietf'
              ? 'bg-primary/10 text-primary border-primary/40'
              : 'bg-muted/30 text-muted-foreground border-border hover:border-primary/20'
          }`}
        >
          <Globe size={15} />
          IETF Reference Certs
        </Button>
      </div>

      {/* ===== GENERATED CERTS SECTION ===== */}
      {source === 'generated' && (
        <>
          {certs.length === 0 && (
            <Button
              variant="ghost"
              onClick={generateAllCerts}
              disabled={generating}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {generating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Generating certificates for inspection...
                </>
              ) : (
                <>
                  <Play size={18} fill="currentColor" />
                  Generate All Certificates for Inspection
                </>
              )}
            </Button>
          )}

          {certs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Cert selector - left panel */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-foreground mb-2">Select Certificate</h4>
                {certs.map((group, fIdx) => (
                  <div key={group.formatId} className="space-y-1">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {group.formatLabel}
                    </div>
                    {group.certs.map((cert, cIdx) => {
                      const isSelected =
                        selectedCert?.formatIdx === fIdx && selectedCert?.certIdx === cIdx
                      const badgeClass =
                        cert.type === 'pqc'
                          ? 'bg-success/10 text-success border-success/20'
                          : 'bg-warning/10 text-warning border-warning/20'

                      return (
                        <Button
                          variant="ghost"
                          key={cert.label}
                          onClick={() => setSelectedCert({ formatIdx: fIdx, certIdx: cIdx })}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                            isSelected
                              ? 'bg-primary/10 text-primary border border-primary/30'
                              : 'bg-muted/30 text-foreground border border-border hover:border-primary/20'
                          }`}
                        >
                          <span className="truncate">{cert.label}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded border font-bold shrink-0 ml-2 ${badgeClass}`}
                          >
                            {cert.type === 'pqc' ? 'PQC' : 'EC'}
                          </span>
                        </Button>
                      )
                    })}
                  </div>
                ))}
              </div>

              {/* Inspector - right panel */}
              <div className="lg:col-span-2 space-y-4">
                {selected ? (
                  <>
                    {/* View mode tabs */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => setViewMode('tree')}
                          className={`flex items-center gap-1 px-3 py-2 rounded text-xs transition-colors ${
                            viewMode === 'tree'
                              ? 'bg-primary/20 text-primary border border-primary/50'
                              : 'bg-muted/50 text-muted-foreground border border-border'
                          }`}
                        >
                          <Search size={12} />
                          Tree View
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setViewMode('raw')}
                          className={`flex items-center gap-1 px-3 py-2 rounded text-xs transition-colors ${
                            viewMode === 'raw'
                              ? 'bg-primary/20 text-primary border border-primary/50'
                              : 'bg-muted/50 text-muted-foreground border border-border'
                          }`}
                        >
                          <FileText size={12} />
                          Raw Output
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setViewMode('size')}
                          className={`flex items-center gap-1 px-3 py-2 rounded text-xs transition-colors ${
                            viewMode === 'size'
                              ? 'bg-primary/20 text-primary border border-primary/50'
                              : 'bg-muted/50 text-muted-foreground border border-border'
                          }`}
                        >
                          <BarChart3 size={12} />
                          Size Breakdown
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={handleDownload}
                        className="flex items-center gap-1 px-3 py-2 rounded text-xs bg-muted/50 text-muted-foreground border border-border hover:border-primary/30 transition-colors"
                      >
                        <Download size={12} />
                        Export PEM
                      </Button>
                    </div>

                    {/* Format info banner */}
                    {selectedFormat && (
                      <div className="bg-muted/30 rounded-lg p-3 border border-border flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-foreground">
                            {selectedFormat.formatLabel}
                          </span>
                          <span className="text-[10px] text-muted-foreground ml-2">
                            {HYBRID_CERT_FORMATS.find((f) => f.id === selectedFormat.formatId)
                              ?.approach || ''}
                          </span>
                        </div>
                        <a
                          href={
                            HYBRID_CERT_FORMATS.find((f) => f.id === selectedFormat.formatId)
                              ?.standardUrl || '#'
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary text-[10px] flex items-center gap-0.5 hover:underline"
                        >
                          {HYBRID_CERT_FORMATS.find((f) => f.id === selectedFormat.formatId)
                            ?.standard || ''}
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    )}

                    {/* Tree View */}
                    {viewMode === 'tree' && (
                      <div className="bg-background rounded-lg p-4 border border-border max-h-[500px] overflow-y-auto custom-scrollbar">
                        {parsedTree.length > 0 ? (
                          parsedTree.map((field, i) => (
                            <TreeNode key={`${field.key}-${i}`} field={field} defaultOpen={true} />
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            No parsed fields available.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Raw View */}
                    {viewMode === 'raw' && (
                      <div className="space-y-3">
                        <div>
                          <h5 className="text-xs font-bold text-foreground mb-1">
                            Parsed X.509 Fields
                          </h5>
                          <pre className="text-[10px] bg-background p-3 rounded border border-border overflow-x-auto max-h-64 overflow-y-auto font-mono whitespace-pre-wrap custom-scrollbar">
                            {selected.parsed.trim()}
                          </pre>
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-foreground mb-1">PEM Encoding</h5>
                          <pre className="text-[10px] bg-background p-3 rounded border border-border overflow-x-auto max-h-64 overflow-y-auto font-mono whitespace-pre-wrap custom-scrollbar">
                            {selected.pem.trim()}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Size View */}
                    {viewMode === 'size' && sizeBreakdown && (
                      <div className="space-y-4">
                        <div className="bg-background rounded-lg p-4 border border-border">
                          <h5 className="text-xs font-bold text-foreground mb-3">
                            Certificate Size Breakdown
                          </h5>
                          <div className="space-y-3">
                            {[
                              {
                                label: 'Total PEM',
                                value: sizeBreakdown.pemSize,
                                color: 'bg-primary',
                                pct: 100,
                              },
                              {
                                label: 'Public Key',
                                value: sizeBreakdown.pubKeySize,
                                color: 'bg-success',
                                pct:
                                  sizeBreakdown.pemSize > 0
                                    ? (sizeBreakdown.pubKeySize / sizeBreakdown.pemSize) * 100
                                    : 0,
                              },
                              {
                                label: 'Signature',
                                value: sizeBreakdown.sigSize,
                                color: 'bg-warning',
                                pct:
                                  sizeBreakdown.pemSize > 0
                                    ? (sizeBreakdown.sigSize / sizeBreakdown.pemSize) * 100
                                    : 0,
                              },
                              {
                                label: 'Overhead (headers, extensions, ASN.1)',
                                value: sizeBreakdown.overhead,
                                color: 'bg-muted-foreground',
                                pct:
                                  sizeBreakdown.pemSize > 0
                                    ? (sizeBreakdown.overhead / sizeBreakdown.pemSize) * 100
                                    : 0,
                              },
                            ].map((item) => (
                              <div key={item.label}>
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-muted-foreground">{item.label}</span>
                                  <span className="font-mono text-foreground">
                                    {item.value > 0 ? `${item.value} B` : '—'}
                                  </span>
                                </div>
                                <div className="w-full bg-muted/50 rounded-full h-2">
                                  <div
                                    className={`${item.color} rounded-full h-2 transition-all`}
                                    style={{ width: `${Math.max(item.pct, 1)}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Cross-format size comparison */}
                        <div className="bg-background rounded-lg p-4 border border-border">
                          <h5 className="text-xs font-bold text-foreground mb-3">
                            Cross-Format PEM Size Comparison
                          </h5>
                          <div className="space-y-2">
                            {certs.map((group) => {
                              const totalSize = group.certs.reduce((s, c) => s + c.pem.length, 0)
                              const maxSize = Math.max(
                                ...certs.map((g) => g.certs.reduce((s, c) => s + c.pem.length, 0))
                              )
                              return (
                                <div key={group.formatId}>
                                  <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-muted-foreground">
                                      {group.formatLabel.split('(')[0].trim()}
                                    </span>
                                    <span className="font-mono text-foreground">
                                      {totalSize} chars
                                    </span>
                                  </div>
                                  <div className="w-full bg-muted/50 rounded-full h-2">
                                    <div
                                      className="bg-primary rounded-full h-2 transition-all"
                                      style={{
                                        width: `${maxSize > 0 ? (totalSize / maxSize) * 100 : 0}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Educational disclaimer */}
                    <div className="bg-muted/30 rounded-lg p-3 border border-border">
                      <p className="text-[10px] text-muted-foreground">
                        These certificates are self-signed and generated for educational purposes
                        only. Do not use them in production environments. The exported PEM files can
                        be inspected with{' '}
                        <code className="font-mono">openssl x509 -in cert.pem -text -noout</code>.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                    Select a certificate from the left panel to inspect it.
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ===== IETF REFERENCE CERTS SECTION ===== */}
      {source === 'ietf' && (
        <div className="space-y-4">
          {/* Attribution note */}
          <div className="flex items-center gap-2 bg-muted/20 rounded-lg px-3 py-2 border border-border">
            <Globe size={13} className="text-primary shrink-0" />
            <p className="text-[10px] text-muted-foreground">
              Real DER test certificates from the{' '}
              <a
                href="https://github.com/IETF-Hackathon/pqc-certificates"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                IETF Hackathon pqc-certificates
              </a>{' '}
              repository (r5). Generated by Bouncy Castle and OpenSSL 3.5 for interoperability
              testing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* IETF cert selector - left panel */}
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-foreground mb-2">Reference Certificates</h4>
              {IETF_CERT_VECTORS.map((vector) => {
                const isSelected = ietfSelectedId === vector.id
                const badgeClass = certTypeBadge(vector.certType)
                return (
                  <Button
                    variant="ghost"
                    key={vector.id}
                    onClick={() => handleIETFSelect(vector)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-colors border ${
                      isSelected
                        ? 'bg-primary/10 text-primary border-primary/30'
                        : 'bg-muted/30 text-foreground border-border hover:border-primary/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium truncate pr-2">{vector.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded border font-bold shrink-0 ${badgeClass}`}
                      >
                        {vector.certType}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {vector.algorithmOID}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {vector.provider} · {vector.sizeBytes.toLocaleString()} B
                    </div>
                  </Button>
                )
              })}
            </div>

            {/* IETF inspector - right panel */}
            <div className="lg:col-span-2 space-y-4">
              {/* View mode tabs + export */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  {(['tree', 'raw', 'size'] as const).map((mode) => {
                    const Icon = mode === 'tree' ? Search : mode === 'raw' ? FileText : BarChart3
                    const label =
                      mode === 'tree'
                        ? 'Tree View'
                        : mode === 'raw'
                          ? 'Raw Output'
                          : 'Size Breakdown'
                    return (
                      <Button
                        variant="ghost"
                        key={mode}
                        onClick={() => setIETFViewMode(mode)}
                        className={`flex items-center gap-1 px-3 py-2 rounded text-xs transition-colors ${
                          ietfViewMode === mode
                            ? 'bg-primary/20 text-primary border border-primary/50'
                            : 'bg-muted/50 text-muted-foreground border border-border'
                        }`}
                      >
                        <Icon size={12} />
                        {label}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="ghost"
                  onClick={() => handleIETFDownload(selectedIETFVector)}
                  className="flex items-center gap-1 px-3 py-2 rounded text-xs bg-muted/50 text-muted-foreground border border-border hover:border-primary/30 transition-colors"
                >
                  <Download size={12} />
                  Export PEM
                </Button>
              </div>

              {/* Provider attribution banner */}
              <div className="bg-muted/30 rounded-lg p-3 border border-border flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-foreground">
                    {selectedIETFVector.provider}
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-2">
                    {selectedIETFVector.hackathonRef}
                  </span>
                </div>
                <a
                  href={selectedIETFVector.providerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-[10px] flex items-center gap-0.5 hover:underline"
                >
                  View source
                  <ExternalLink size={10} />
                </a>
              </div>

              {/* Algorithm OID banner */}
              <div className="bg-background rounded-lg p-3 border border-border">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[10px] text-muted-foreground font-medium mb-0.5">
                      Signature Algorithm OID
                    </div>
                    <div className="font-mono text-xs text-foreground">
                      {selectedIETFVector.algorithmOID}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {selectedIETFVector.algorithmLabel}
                    </div>
                  </div>
                  <div
                    className={`text-[10px] px-2 py-0.5 rounded border font-bold shrink-0 ${certTypeBadge(selectedIETFVector.certType)}`}
                  >
                    {selectedIETFVector.certType}
                  </div>
                </div>
              </div>

              {/* Tree View */}
              {ietfViewMode === 'tree' && (
                <div className="bg-background rounded-lg p-4 border border-border max-h-[500px] overflow-y-auto custom-scrollbar">
                  {isIETFLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 size={14} className="animate-spin" />
                      Parsing certificate with OpenSSL WASM...
                    </div>
                  ) : selectedIETFResult ? (
                    selectedIETFTree.length > 0 ? (
                      selectedIETFTree.map((field, i) => (
                        <TreeNode key={`${field.key}-${i}`} field={field} defaultOpen={true} />
                      ))
                    ) : (
                      <pre className="text-[10px] font-mono whitespace-pre-wrap text-foreground">
                        {selectedIETFResult.openSSLText}
                      </pre>
                    )
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      Click &ldquo;Parse&rdquo; or select the cert to load its parsed view.
                    </div>
                  )}
                </div>
              )}

              {/* Raw View */}
              {ietfViewMode === 'raw' && (
                <div className="space-y-3">
                  <div>
                    <h5 className="text-xs font-bold text-foreground mb-1">
                      OpenSSL X.509 Parse Output
                    </h5>
                    {isIETFLoading ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground p-3">
                        <Loader2 size={14} className="animate-spin" />
                        Parsing...
                      </div>
                    ) : (
                      <pre className="text-[10px] bg-background p-3 rounded border border-border overflow-x-auto max-h-64 overflow-y-auto font-mono whitespace-pre-wrap custom-scrollbar">
                        {selectedIETFResult?.openSSLText.trim() ??
                          '(not yet parsed — select the cert)'}
                      </pre>
                    )}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-foreground mb-1">
                      PEM Encoding (derived from DER)
                    </h5>
                    <pre className="text-[10px] bg-background p-3 rounded border border-border overflow-x-auto max-h-48 overflow-y-auto font-mono whitespace-pre-wrap custom-scrollbar">
                      {derToPem(decodeDer(selectedIETFVector.derBase64))}
                    </pre>
                  </div>
                </div>
              )}

              {/* Size View */}
              {ietfViewMode === 'size' && (
                <div className="space-y-4">
                  <div className="bg-background rounded-lg p-4 border border-border">
                    <h5 className="text-xs font-bold text-foreground mb-3">
                      DER Certificate Size Breakdown
                    </h5>
                    <div className="space-y-3">
                      {(() => {
                        const total = selectedIETFVector.sizeBytes
                        const keyBytes = selectedIETFCertInfo.publicKeySizeBytes
                        const sigBytes = selectedIETFCertInfo.signatureSizeBytes
                        const overhead = Math.max(0, total - keyBytes - sigBytes)
                        return [
                          { label: 'Total DER', value: total, color: 'bg-primary', pct: 100 },
                          {
                            label: 'Public Key',
                            value: keyBytes,
                            color: 'bg-success',
                            pct: total > 0 ? (keyBytes / total) * 100 : 0,
                          },
                          {
                            label: 'Signature',
                            value: sigBytes,
                            color: 'bg-warning',
                            pct: total > 0 ? (sigBytes / total) * 100 : 0,
                          },
                          {
                            label: 'Overhead (ASN.1, extensions, metadata)',
                            value: overhead,
                            color: 'bg-muted-foreground',
                            pct: total > 0 ? (overhead / total) * 100 : 0,
                          },
                        ]
                      })().map((item) => (
                        <div key={item.label}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className="font-mono text-foreground">
                              {item.value > 0 ? `${item.value.toLocaleString()} B` : '—'}
                            </span>
                          </div>
                          <div className="w-full bg-muted/50 rounded-full h-2">
                            <div
                              className={`${item.color} rounded-full h-2 transition-all`}
                              style={{ width: `${Math.max(item.pct, 1)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cross-IETF cert size comparison */}
                  <div className="bg-background rounded-lg p-4 border border-border">
                    <h5 className="text-xs font-bold text-foreground mb-3">
                      IETF Reference Cert Size Comparison
                    </h5>
                    <div className="space-y-2">
                      {IETF_CERT_VECTORS.map((v) => {
                        const maxSize = Math.max(...IETF_CERT_VECTORS.map((x) => x.sizeBytes))
                        return (
                          <div key={v.id}>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-muted-foreground">{v.label.split(':')[0]}</span>
                              <span className="font-mono text-foreground">
                                {v.sizeBytes.toLocaleString()} B
                              </span>
                            </div>
                            <div className="w-full bg-muted/50 rounded-full h-2">
                              <div
                                className="bg-primary rounded-full h-2 transition-all"
                                style={{ width: `${(v.sizeBytes / maxSize) * 100}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Structure annotation — special extensions */}
              {selectedIETFVector.certType === 'composite' && (
                <div className="bg-warning/5 border border-warning/20 rounded-lg p-3">
                  <div className="text-xs font-bold text-warning mb-1">
                    Composite OID — Legacy Compatibility Note
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    OID <code className="font-mono">{selectedIETFVector.algorithmOID}</code>{' '}
                    (MLDSA65-ECDSA-P256-SHA512) is not in OpenSSL&apos;s OID database — it shows as{' '}
                    <code className="font-mono">UNKNOWN</code> in the parse output above. This is
                    exactly the backward compatibility challenge: legacy validators reject
                    certificates with unrecognised signature algorithm OIDs. Composite PKI requires
                    both signer and verifier to be updated.
                  </p>
                </div>
              )}

              {selectedIETFVector.certType === 'catalyst' &&
                selectedIETFVector.specialExtensions && (
                  <div className="bg-background rounded-lg p-3 border border-border">
                    <div className="text-xs font-bold text-foreground mb-2">
                      Alt-Sig Extensions (catalyst / draft-ietf-lamps-cert-binding-for-multi-auth)
                    </div>
                    <div className="space-y-2">
                      {selectedIETFVector.specialExtensions.map((ext) => (
                        <div key={ext.oid} className="flex gap-3">
                          <code className="text-[10px] font-mono text-primary shrink-0">
                            {ext.oid}
                          </code>
                          <div>
                            <div className="text-[10px] font-medium text-foreground">
                              {ext.label}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {ext.description}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {selectedIETFVector.certType === 'chameleon' &&
                selectedIETFVector.specialExtensions && (
                  <div className="bg-background rounded-lg p-3 border border-border">
                    <div className="text-xs font-bold text-foreground mb-2">
                      Chameleon Extension (draft-bonnell-lamps-chameleon-certs)
                    </div>
                    {selectedIETFVector.specialExtensions.map((ext) => (
                      <div key={ext.oid} className="flex gap-3">
                        <code className="text-[10px] font-mono text-primary shrink-0">
                          {ext.oid}
                        </code>
                        <div>
                          <div className="text-[10px] font-medium text-foreground">{ext.label}</div>
                          <div className="text-[10px] text-muted-foreground">{ext.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>

          {/* IETF static comparison table */}
          <div className="glass-panel p-4">
            <h4 className="text-sm font-bold text-foreground mb-3">
              IETF Reference Cert Comparison
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2 text-muted-foreground font-medium">Format</th>
                    <th className="text-left p-2 text-muted-foreground font-medium">Provider</th>
                    <th className="text-right p-2 text-muted-foreground font-medium">DER Size</th>
                    <th className="text-left p-2 text-muted-foreground font-medium">Algorithm</th>
                    <th className="text-center p-2 text-muted-foreground font-medium">
                      Legacy Parseable
                    </th>
                    <th className="text-center p-2 text-muted-foreground font-medium">
                      Special Extensions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {IETF_CERT_VECTORS.map((v) => {
                    const legacyParseable = v.certType !== 'composite'
                    const specialExtCount = v.specialExtensions?.length ?? 0
                    return (
                      <tr
                        key={v.id}
                        className={`border-b border-border/50 cursor-pointer transition-colors ${
                          ietfSelectedId === v.id ? 'bg-primary/5' : 'hover:bg-muted/20'
                        }`}
                        onClick={() => handleIETFSelect(v)}
                      >
                        <td className="p-2 font-medium text-foreground">{v.label.split(':')[0]}</td>
                        <td className="p-2 text-muted-foreground">{v.provider}</td>
                        <td className="p-2 text-right font-mono">
                          {v.sizeBytes.toLocaleString()} B
                        </td>
                        <td className="p-2 font-mono text-[10px] text-muted-foreground">
                          {oidToLabel(v.algorithmOID).split('(')[0].trim()}
                        </td>
                        <td className="p-2 text-center">
                          {legacyParseable ? (
                            <span className="text-success font-bold">Yes</span>
                          ) : (
                            <span className="text-destructive font-bold">No</span>
                          )}
                        </td>
                        <td className="p-2 text-center font-mono">
                          {specialExtCount > 0 ? (
                            <span className="text-primary font-bold">{specialExtCount}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              Click any row to inspect that certificate. These certs are interoperability test
              vectors verified by multiple implementations at IETF hackathons.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
