// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState, useCallback, useEffect, useMemo, useRef, useLayoutEffect } from 'react'
import {
  Loader2,
  Search,
  BarChart3,
  FileText,
  ExternalLink,
  Download,
  ChevronDown,
  ChevronRight,
  FlaskConical,
  Globe,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react'
import { useOpenSSLStore } from '@/components/OpenSSLStudio/store'
import {
  inspectCertificateDer,
  workspaceCertificateGroups,
  type CertificateInspection,
} from './certificateInspection'
import { HYBRID_CERT_FORMATS } from '../constants'
import { oidToLabel, type CertInfo } from '../services/derParser'
import {
  verifyCompositeCert,
  findCompositeProfile,
  type CompositeVerifyResult,
} from '../services/compositeVerifier'
import {
  IETF_CERT_VECTORS,
  decodeDer,
  derToPem,
  type IETFCertVector,
} from '../data/ietfTestVectors'
import { Button } from '@/components/ui/button'

interface ParsedField {
  key: string
  value: string
  children: ParsedField[]
  depth: number
}

interface IETFParsedResult {
  openSSLText: string
  certInfo: CertInfo
  inspection: CertificateInspection
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
    if (/[\x00-\x08\x0A-\x1F\x7F]/.test(line)) continue

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
  const files = useOpenSSLStore((state) => state.files)
  const certs = useMemo(() => workspaceCertificateGroups(files), [files])
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const namedSelection = certs
    .flatMap((group) => group.certs)
    .find((cert) => cert.label === selectedName)
  const selected = namedSelection ?? certs[0]?.certs[0]
  useEffect(() => {
    if (selectedName !== null && !namedSelection) setSelectedName(null)
  }, [selectedName, namedSelection])
  const selectedFormat = certs.find((group) => group.certs.includes(selected!))
  const [viewMode, setViewMode] = useState<'tree' | 'raw' | 'size'>('tree')
  // --- Source toggle ---
  const [source, setSource] = useState<'generated' | 'ietf'>('generated')

  // --- IETF certs state ---
  const [ietfSelectedId, setIETFSelectedId] = useState<string>(IETF_CERT_VECTORS[0].id)
  const [ietfParsed, setIETFParsed] = useState<Record<string, IETFParsedResult>>({})
  const [ietfLoading, setIETFLoading] = useState<string | null>(null)
  const [ietfErrors, setIETFErrors] = useState<Record<string, string>>({})
  const [ietfViewMode, setIETFViewMode] = useState<'tree' | 'raw' | 'size'>('tree')

  // Verification is bound to the exact selected saved file and source, not its filename.
  const owner = useMemo(() => ({ snapshot: selected, source }), [selected, source])
  const currentOwner = useRef<typeof owner | null>(null)
  const [verification, setVerification] = useState<{
    owner: typeof owner
    result: CompositeVerifyResult | null
    error?: string
  } | null>(null)
  const compositeVerify = verification?.owner === owner ? verification.result : null
  const verificationError = verification?.owner === owner ? verification.error : null
  useLayoutEffect(() => {
    currentOwner.current = owner
    return () => {
      currentOwner.current = null
    }
  }, [owner])
  useEffect(() => {
    const inspection = selected?.inspection
    if (
      source !== 'generated' ||
      !inspection ||
      !inspection.selfIssued ||
      !findCompositeProfile(inspection.info.algorithmOID)
    )
      return
    void verifyCompositeCert(inspection.der)
      .then((result) => {
        if (currentOwner.current === owner)
          setVerification({ owner, result: result.recognized ? result : null })
      })
      .catch((e: unknown) => {
        if (currentOwner.current === owner)
          setVerification({
            owner,
            result: null,
            error: e instanceof Error ? e.message : 'Verification did not complete',
          })
      })
  }, [owner, selected?.inspection, source])

  const parsedTree = selected ? parseCertText(selected.parsed) : []

  const handleDownload = () => {
    if (!selected?.inspection) return
    const blob = new Blob([selected.pem], { type: 'application/x-pem-file' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = selected.label
    a.click()
    URL.revokeObjectURL(url)
  }

  const sizeBreakdown = selected?.inspection?.sizes ?? null

  // ---------------------------------------------------------------------------
  // IETF cert parsing logic
  // ---------------------------------------------------------------------------
  const parseIETFCert = useCallback(
    async (vector: IETFCertVector) => {
      if (ietfParsed[vector.id]) return // already cached
      setIETFLoading(vector.id)

      try {
        const der = decodeDer(vector.derBase64)
        const inspection = inspectCertificateDer(der)
        setIETFParsed((prev) => ({
          ...prev,
          [vector.id]: { openSSLText: inspection.text, certInfo: inspection.info, inspection },
        }))
        setIETFErrors((prev) => ({ ...prev, [vector.id]: '' }))
      } catch (e) {
        setIETFErrors((prev) => ({
          ...prev,
          [vector.id]: e instanceof Error ? e.message : 'Certificate inspection failed',
        }))
      } finally {
        setIETFLoading(null)
      }
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
  const selectedIETFResult =
    Object.entries(ietfParsed).find(([id]) => id === ietfSelectedId)?.[1] ?? null
  const selectedIETFError = Object.entries(ietfErrors).find(([id]) => id === ietfSelectedId)?.[1]
  const isIETFLoading = ietfLoading === ietfSelectedId

  // Parse the selected IETF cert's DER synchronously for size view (certInfo only)
  const selectedIETFCertInfo = selectedIETFResult?.certInfo
  const selectedIETFTree = selectedIETFResult ? parseCertText(selectedIETFResult.openSSLText) : []

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Certificate Inspector</h3>
        <p className="text-sm text-muted-foreground">
          Inspect saved public certificates from Certificate Formats (Step 6), or the reference
          certificate bytes. Compare encoded fields and sizes without generating substitutes.
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
          <p className="text-xs text-muted-foreground">
            Saved public workspace files named for Certificate Formats (Step 6). Filename groups and
            saved timestamps do not establish their origin, the latest generation attempt, a
            matching certificate pair, format conformance or trust. No new keys or certificates are
            generated by this inspector.
          </p>
          {certs.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No saved public workshop certificates. Generate a supported example in Certificate
              Formats (Step 6), then return here.
            </p>
          )}
          {certs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Cert selector - left panel */}
              <div className="space-y-2 min-w-0 overflow-hidden">
                <h4 className="text-sm font-bold text-foreground mb-2">Select Certificate</h4>
                {certs.map((group) => (
                  <div key={group.formatId} className="space-y-1">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {group.formatLabel}
                    </div>
                    {group.certs.map((cert) => {
                      const isSelected = selected?.file === cert.file
                      const badgeClass = 'bg-muted/30 text-muted-foreground border-border'
                      return (
                        <Button
                          variant="ghost"
                          key={cert.label}
                          onClick={() => setSelectedName(cert.label)}
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
                            {cert.error ? 'Incomplete' : 'Saved'}
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
                        disabled={!selected.inspection}
                        className="flex items-center gap-1 px-3 py-2 rounded text-xs bg-muted/50 text-muted-foreground border border-border hover:border-primary/30 transition-colors"
                      >
                        <Download size={12} />
                        Export PEM
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground break-words">
                      Saved file: {selected.label} · Timestamp:{' '}
                      {Number.isFinite(new Date(selected.file.timestamp).getTime())
                        ? new Date(selected.file.timestamp).toISOString()
                        : 'not recorded'}
                    </p>
                    {selected.error && (
                      <div role="alert">Incomplete inspection: {selected.error}</div>
                    )}
                    {verificationError && (
                      <div role="alert">
                        Incomplete selected self-signature check: {verificationError}
                      </div>
                    )}
                    {selected.inspection && !selected.inspection.selfIssued && (
                      <p className="text-xs text-muted-foreground">
                        Issuer and subject differ. No issuer-signature or certificate-path
                        validation is executed by this inspector.
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Structural parsing is not signature verification or a full certificate
                      validation decision.
                    </p>
                    {/* Format info banner */}
                    {selectedFormat && (
                      <div className="bg-muted/30 rounded-lg p-3 border border-border flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-foreground">
                            Filename group: {selectedFormat.formatLabel}
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

                    {/* Composite self-signature verification */}
                    {compositeVerify && (
                      <div
                        className={`rounded-lg p-3 border ${
                          compositeVerify.valid
                            ? 'bg-success/5 border-success/30'
                            : 'bg-destructive/5 border-destructive/30'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {compositeVerify.valid ? (
                            <ShieldCheck size={14} className="text-success shrink-0" />
                          ) : (
                            <ShieldAlert size={14} className="text-destructive shrink-0" />
                          )}
                          <span
                            className={`text-xs font-bold ${
                              compositeVerify.valid ? 'text-success' : 'text-destructive'
                            }`}
                          >
                            {compositeVerify.valid
                              ? 'Selected composite self-signature checks passed'
                              : 'Selected composite self-signature check failed'}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono ml-auto truncate">
                            {compositeVerify.profileLabel}
                          </span>
                        </div>

                        <div className="space-y-1">
                          {[compositeVerify.mldsa, compositeVerify.classical].map(
                            (c, i) =>
                              c && (
                                <div
                                  key={i}
                                  className="flex items-center gap-2 text-[10px] font-mono bg-background/60 rounded px-2 py-1"
                                >
                                  <span
                                    className={
                                      c.verified === true
                                        ? 'text-success'
                                        : c.verified === false
                                          ? 'text-destructive'
                                          : 'text-muted-foreground'
                                    }
                                  >
                                    {c.verified === true ? '✓' : c.verified === false ? '✗' : '—'}
                                  </span>
                                  <span className="text-foreground w-44 shrink-0 truncate">
                                    {c.algorithm}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {c.bytes} B {c.range}
                                  </span>
                                  {c.detail && (
                                    <span className="text-muted-foreground truncate">
                                      — {c.detail}
                                    </span>
                                  )}
                                </div>
                              )
                          )}
                        </div>

                        <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                          This selected self-signature check uses the LAMPS composite draft: the key
                          and signature are split at ML-DSA&apos;s fixed length (no ASN.1 framing to
                          read), both components are checked over the shared message representative
                          M&apos;, and ML-DSA takes the signature label as its FIPS&nbsp;204
                          context. BOTH must verify — composite is an AND construction, not a
                          fallback.
                        </p>
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
                            Custom structural X.509 display
                          </h5>
                          <pre className="text-[10px] bg-background p-3 rounded border border-border overflow-x-auto max-h-64 overflow-y-auto font-mono whitespace-pre-wrap custom-scrollbar">
                            {selected.parsed.trim()}
                          </pre>
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-foreground mb-1">PEM Encoding</h5>
                          <pre
                            aria-label="Encoded certificate PEM"
                            className="text-[10px] bg-background p-3 rounded border border-border overflow-x-auto max-h-64 overflow-y-auto font-mono whitespace-pre-wrap custom-scrollbar"
                          >
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
                            DER Certificate Size Breakdown
                          </h5>
                          <p className="text-xs text-muted-foreground mb-3">
                            PEM UTF8 transport: {sizeBreakdown.pemSize} B. Base64, envelope and
                            line-break expansion beyond DER:{' '}
                            {sizeBreakdown.pemSize - sizeBreakdown.derSize} B. DER remainder plus
                            both encoded payloads equals total DER; payload octets are not algorithm
                            security strength.
                          </p>
                          <div className="space-y-3">
                            {[
                              {
                                label: 'Total DER',
                                value: sizeBreakdown.derSize,
                                color: 'bg-primary',
                                pct: 100,
                              },
                              {
                                label: 'Subject public-key payload octets',
                                value: sizeBreakdown.pubKeySize,
                                color: 'bg-success',
                                pct:
                                  sizeBreakdown.derSize > 0
                                    ? (sizeBreakdown.pubKeySize / sizeBreakdown.derSize) * 100
                                    : 0,
                              },
                              {
                                label: 'Signature payload octets',
                                value: sizeBreakdown.sigSize,
                                color: 'bg-warning',
                                pct:
                                  sizeBreakdown.derSize > 0
                                    ? (sizeBreakdown.sigSize / sizeBreakdown.derSize) * 100
                                    : 0,
                              },
                              {
                                label: 'DER remainder (structure, names, extensions)',
                                value: sizeBreakdown.overhead,
                                color: 'bg-muted-foreground',
                                pct:
                                  sizeBreakdown.derSize > 0
                                    ? (sizeBreakdown.overhead / sizeBreakdown.derSize) * 100
                                    : 0,
                              },
                            ].map((item) => (
                              <div key={item.label}>
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-muted-foreground">{item.label}</span>
                                  <span className="font-mono text-foreground">
                                    {`${item.value} B`}
                                  </span>
                                </div>
                                <div className="w-full bg-muted/50 rounded-full h-2">
                                  <div
                                    className={`${item.color} rounded-full h-2 transition-all`}
                                    style={{ width: `${item.pct}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Cross-format size comparison */}
                        <div className="bg-background rounded-lg p-4 border border-border">
                          <h5 className="text-xs font-bold text-foreground mb-3">
                            Saved group PEM UTF8 totals (all listed files)
                          </h5>
                          <p className="text-xs text-muted-foreground mb-3">
                            Groups can contain different numbers and roles of saved files. These
                            totals are not equivalent authentication payloads or a format-efficiency
                            ranking.
                          </p>
                          <div className="space-y-2">
                            {certs.map((group) => {
                              const totalSize = group.certs.every((cert) => cert.inspection)
                                ? group.certs.reduce(
                                    (sum, cert) => sum + cert.inspection!.sizes.pemSize,
                                    0
                                  )
                                : null
                              const maxSize = Math.max(
                                1,
                                ...certs
                                  .filter((g) => g.certs.every((cert) => cert.inspection))
                                  .map((g) =>
                                    g.certs.reduce(
                                      (sum, cert) => sum + cert.inspection!.sizes.pemSize,
                                      0
                                    )
                                  )
                              )
                              return (
                                <div key={group.formatId}>
                                  <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-muted-foreground">
                                      {group.formatLabel}
                                    </span>
                                    <span className="font-mono text-foreground">
                                      {totalSize === null
                                        ? 'Not assessed (incomplete certificate)'
                                        : `${totalSize} B`}
                                    </span>
                                  </div>
                                  <div className="w-full bg-muted/50 rounded-full h-2">
                                    <div
                                      className="bg-primary rounded-full h-2 transition-all"
                                      style={{
                                        width: `${totalSize === null ? 0 : (totalSize / maxSize) * 100}%`,
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
                        The workspace can contain CA-issued, self-issued, unsigned or replaced
                        sample files. Their names and structural display do not establish origin,
                        signature validity or trust. Inspect the actual exported bytes with your
                        tools, for example{' '}
                        <code className="font-mono">openssl x509 -in cert.pem -text -noout</code>.
                        If your tool does not understand an algorithm,{' '}
                        <code className="font-mono">openssl asn1parse -in cert.pem -i</code> can
                        show encoded structure without verifying that algorithm. For production,
                        evaluate algorithm support, signatures, validity, path policy and revocation
                        with your relying-party tools; these sample files are not production
                        credentials.
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
            <div className="space-y-2 min-w-0 overflow-hidden">
              <h4 className="text-sm font-bold text-foreground mb-2">Reference Certificates</h4>
              {IETF_CERT_VECTORS.map((vector) => {
                const isSelected = ietfSelectedId === vector.id
                const badgeClass = certTypeBadge(vector.certType)
                return (
                  <Button
                    variant="ghost"
                    key={vector.id}
                    onClick={() => handleIETFSelect(vector)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-colors border whitespace-normal flex-col items-start overflow-hidden min-w-0 ${
                      isSelected
                        ? 'bg-primary/10 text-primary border-primary/30'
                        : 'bg-muted/30 text-foreground border-border hover:border-primary/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1 w-full min-w-0">
                      <span className="font-medium truncate pr-2">{vector.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded border font-bold shrink-0 ${badgeClass}`}
                      >
                        {vector.certType}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono truncate w-full">
                      {vector.algorithmOID}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {vector.provider} · {decodeDer(vector.derBase64).length.toLocaleString()} B
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

              {selectedIETFError && (
                <div role="alert">Incomplete inspection: {selectedIETFError}</div>
              )}
              {/* Algorithm OID banner */}
              <div className="bg-background rounded-lg p-3 border border-border">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[10px] text-muted-foreground font-medium mb-0.5">
                      Reference signature algorithm metadata (not parsed identity)
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
                      Reading encoded certificate fields...
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
                      Custom structural X.509 display
                    </h5>
                    {isIETFLoading ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground p-3">
                        <Loader2 size={14} className="animate-spin" />
                        Parsing...
                      </div>
                    ) : (
                      <pre
                        aria-label="Reference structural certificate fields"
                        className="text-[10px] bg-background p-3 rounded border border-border overflow-x-auto max-h-64 overflow-y-auto font-mono whitespace-pre-wrap custom-scrollbar"
                      >
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
              {ietfViewMode === 'size' && selectedIETFCertInfo && (
                <div className="space-y-4">
                  <div className="bg-background rounded-lg p-4 border border-border">
                    <h5 className="text-xs font-bold text-foreground mb-3">
                      DER Certificate Size Breakdown
                    </h5>
                    <div className="space-y-3">
                      {(() => {
                        const total = selectedIETFResult!.inspection.sizes.derSize
                        const keyBytes = selectedIETFCertInfo.publicKeySizeBytes
                        const sigBytes = selectedIETFCertInfo.signatureSizeBytes
                        const overhead = selectedIETFResult!.inspection.sizes.overhead
                        return [
                          { label: 'Total DER', value: total, color: 'bg-primary', pct: 100 },
                          {
                            label: 'Subject public-key payload octets',
                            value: keyBytes,
                            color: 'bg-success',
                            pct: total > 0 ? (keyBytes / total) * 100 : 0,
                          },
                          {
                            label: 'Signature payload octets',
                            value: sigBytes,
                            color: 'bg-warning',
                            pct: total > 0 ? (sigBytes / total) * 100 : 0,
                          },
                          {
                            label: 'DER remainder (structure, names, extensions)',
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
                              style={{ width: `${item.pct}%` }}
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
                        const maxSize = Math.max(
                          ...IETF_CERT_VECTORS.map((x) => decodeDer(x.derBase64).length)
                        )
                        return (
                          <div key={v.id}>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-muted-foreground">{v.label.split(':')[0]}</span>
                              <span className="font-mono text-foreground">
                                {decodeDer(v.derBase64).length.toLocaleString()} B
                              </span>
                            </div>
                            <div className="w-full bg-muted/50 rounded-full h-2">
                              <div
                                className="bg-primary rounded-full h-2 transition-all"
                                style={{
                                  width: `${(decodeDer(v.derBase64).length / maxSize) * 100}%`,
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
                          {decodeDer(v.derBase64).length.toLocaleString()} B
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
              artifacts from IETF PQC hackathon testing.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
