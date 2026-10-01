// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  Info,
  Loader2,
  Play,
  FileText,
  ExternalLink,
  Link2,
  Copy,
  Check,
  Download,
  Square,
  Trash2,
} from 'lucide-react'
import {
  hybridCryptoService,
  GenerationCancelledError,
  type FormatOutput,
  type KeyTracker,
  type RunContext,
  type IssuedCertView,
} from '../services/HybridCryptoService'
import { COMPOSITE_PROFILE_CHOICES } from '../services/certBuilder'
import { verifyCompositeCert } from '../services/compositeVerifier'
import type { VerificationCheck } from '../services/certVerifier'
import {
  CURRENT_HYBRID_CERT_FORMATS,
  ADVANCED_HYBRID_CERT_FORMATS,
  HISTORICAL_HYBRID_CERT_FORMATS,
  STATUS_BADGE_CLASSES,
  STRUCTURE_LINE_COLOR_CLASSES,
  compositeStructureLines,
  type HybridCertFormat,
  type HybridFormatId,
} from '../constants'
import { useHSM, type HsmKey } from '@/hooks/useHSM'
import { hsm_destroyObject, hsm_findAllObjects } from '@/wasm/softhsm'
import { useOpenSSLStore } from '@/components/OpenSSLStudio/store'
import type { HsmFamily, HsmKeyRole } from '@/components/Playground/hsm/HsmContext'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import { translateCryptoError } from '@/utils/cryptoErrorHint'
import { HsmKeyInspector } from '@/components/shared/HsmKeyInspector'
import { Button } from '@/components/ui/button'
import { WhyThisMatters } from '@/components/ui/WhyThisMatters'

const LIVE_OPERATIONS = ['C_GenerateKeyPair', 'C_SignInit', 'C_Sign']

interface FormatResult {
  formatId: HybridFormatId
  certs: IssuedCertView[]
  checks: VerificationCheck[]
  timingMs: number
  bindingHash?: string
  error?: string
}

function pemToDer(pem: string): Uint8Array {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
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
  const [generatingFormat, setGeneratingFormat] = useState<string | null>(null)
  /** The stage the running format reported last — real progress, not a timer. */
  const [stage, setStage] = useState<string>('')
  /** Every HSM key handle each format created, so its keys can be destroyed. */
  const formatHandles = useRef<Partial<Record<HybridFormatId, number[]>>>({})
  const abortRef = useRef<AbortController | null>(null)
  const [expandedViews, setExpandedViews] = useState<Record<string, 'pem' | 'parsed' | null>>({})
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  /**
   * Which draft §6 composite profile the 'composite' format mints. Defaults to
   * the first entry, id-MLDSA65-ECDSA-P256-SHA512 — §10.4's general-use pick.
   */
  const [compositeOid, setCompositeOid] = useState<string>(
    COMPOSITE_PROFILE_CHOICES[0].profile.compositeOid
  )
  const compositeChoice =
    COMPOSITE_PROFILE_CHOICES.find((c) => c.profile.compositeOid === compositeOid) ??
    COMPOSITE_PROFILE_CHOICES[0]
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

  const downloadContent = useCallback((text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const pushHybridFiles = useCallback((formatId: HybridFormatId, certs: IssuedCertView[]) => {
    const { addFile } = useOpenSSLStore.getState()
    certs.forEach((cert) => {
      // Named by role so the PKI Workshop parser can attach the right note:
      // hybrid-<format>.pem, hybrid-<format>-ca.pem, and for RFC 9763
      // hybrid-related-certs-cert-a.pem / -cert-b.pem.
      const suffix =
        cert.role === 'ca'
          ? '-ca'
          : cert.role === 'existing'
            ? '-cert-a'
            : formatId === 'related-certs'
              ? '-cert-b'
              : ''
      const name = `hybrid-${formatId}${suffix}.pem`
      addFile({
        name,
        type: 'cert',
        content: new TextEncoder().encode(cert.pem),
        size: cert.pem.length,
        timestamp: Date.now(),
      })
    })
  }, [])

  const onKeyTracked = useCallback(
    (handle: number, family: HsmFamily, label: string, role: HsmKeyRole = 'private') => {
      const M = hsm.moduleRef.current!
      const hSession = hsm.hSessionRef.current!
      hsm.registerKey(M, hSession, {
        handle,
        family,
        role,
        label,
        generatedAt: new Date().toLocaleTimeString('en-US', { hour12: false }),
      })
    },
    [hsm]
  )

  /**
   * C_DestroyObject every key a format created and drop them from the key
   * inspector. Called before a format regenerates, on Clear, on cancel and on
   * unmount — repeated runs must not accumulate HSM objects.
   */
  const destroyFormatKeys = useCallback(
    (formatId: HybridFormatId) => {
      const handles = formatHandles.current[formatId] ?? []
      delete formatHandles.current[formatId]
      const M = hsm.moduleRef.current
      const hSession = hsm.hSessionRef.current
      for (const h of handles) {
        if (M && hSession) {
          try {
            hsm_destroyObject(M, hSession, h)
          } catch (err) {
            console.error('HybridCertFormats: could not destroy key handle', h, err)
          }
        }
        hsm.removeKey(h)
      }
    },
    [hsm]
  )

  const destroyAllKeys = useCallback(() => {
    for (const id of Object.keys(formatHandles.current) as HybridFormatId[]) destroyFormatKeys(id)
  }, [destroyFormatKeys])

  // Unmount: leave nothing behind in the shared HSM session.
  const destroyAllRef = useRef(destroyAllKeys)
  destroyAllRef.current = destroyAllKeys
  useEffect(
    () => () => {
      abortRef.current?.abort()
      destroyAllRef.current()
    },
    []
  )

  /** Returns 'cancelled' when the run was aborted, so Generate All can stop. */
  const generateFormat = useCallback(
    async (
      formatId: HybridFormatId,
      skipStateReset = false,
      signal?: AbortSignal
    ): Promise<'done' | 'cancelled'> => {
      if (!hsm.isReady || !hsm.moduleRef.current || !hsm.hSessionRef.current) return 'done'
      const M = hsm.moduleRef.current
      const hSession = hsm.hSessionRef.current

      // Regenerating replaces the previous result — destroy its keys first.
      destroyFormatKeys(formatId)
      const handles: number[] = []
      formatHandles.current[formatId] = handles
      const track: KeyTracker = (handle, family, label, role) => {
        handles.push(handle)
        onKeyTracked(handle, family, label, role)
      }
      const run: RunContext = { onStage: setStage, signal }

      setStage('Starting')
      setGeneratingFormat(formatId)
      if (!skipStateReset) setGenerating(formatId)
      const start = performance.now()
      const subject = '/CN=Hybrid Certificate Demo/O=PQC Today/OU=Hybrid Certificate Sandbox'

      try {
        const sandbox = (cn: string) => `/CN=${cn}/O=PQC Today/OU=Hybrid Certificate Sandbox`
        let output: FormatOutput
        switch (formatId) {
          case 'pure-pqc':
            output = await hybridCryptoService.generatePurePQCCertMLDSA(
              subject,
              M,
              hSession,
              track,
              run
            )
            break
          case 'pure-pqc-slh':
            output = await hybridCryptoService.generateSelfSignedCertSLHDSA(
              sandbox('Pure PQC (SLH-DSA-128s) Demo'),
              M,
              hSession,
              track,
              run
            )
            break
          case 'composite': {
            // Resolved HERE rather than closed over: generateFormat is memoised,
            // and capturing the derived object would pin whichever profile was
            // selected when the callback was last built — the dropdown would move
            // the label while still minting the original profile.
            const chosen =
              COMPOSITE_PROFILE_CHOICES.find((c) => c.profile.compositeOid === compositeOid) ??
              COMPOSITE_PROFILE_CHOICES[0]
            const r = await hybridCryptoService.generateCompositeCert(
              subject,
              M,
              hSession,
              track,
              chosen.profile,
              run
            )
            const checks: VerificationCheck[] = []
            if (!r.error) {
              const v = await verifyCompositeCert(pemToDer(r.pem))
              checks.push(
                {
                  name: `${v.mldsa?.algorithm ?? 'ML-DSA'} component verifies`,
                  ok: v.mldsa?.verified === true,
                },
                {
                  name: `${v.classical?.algorithm ?? 'Classical'} component verifies`,
                  ok: v.classical?.verified === true,
                },
                { name: 'Both components verify (composite AND rule)', ok: v.valid }
              )
            }
            output = {
              certs: r.error
                ? []
                : [
                    {
                      label: `Composite: ${chosen.profile.label.replace(/^id-/, '')}`,
                      pem: r.pem,
                      parsed: r.parsed,
                      type: 'pqc',
                      role: 'subject',
                    },
                  ],
              checks,
              timingMs: r.timingMs,
              error: r.error,
            }
            break
          }
          case 'alt-sig':
            output = await hybridCryptoService.generateAltSigCert(subject, M, hSession, track, run)
            break
          case 'related-certs':
            output = await hybridCryptoService.generateRelatedCertPairReal(
              subject,
              M,
              hSession,
              track,
              run
            )
            break
          case 'pure-pqc-kem':
            output = await hybridCryptoService.generatePurePQCCertMLKEM(
              sandbox('Pure PQC KEM (ML-KEM-768) Demo'),
              M,
              hSession,
              track,
              run
            )
            break
          case 'composite-kem':
            output = await hybridCryptoService.generateCompositeKEMCert(
              sandbox('Composite KEM (ML-KEM-768 + X25519) Demo'),
              M,
              hSession,
              track,
              run
            )
            break
          case 'cert-discovery':
            output = await hybridCryptoService.generateCertDiscovery(
              subject,
              M,
              hSession,
              track,
              run
            )
            break
          case 'unsigned-kem':
            output = await hybridCryptoService.generateUnsignedKEMCert(
              sandbox('Unsigned ML-KEM-768 (RFC 9925) Demo'),
              M,
              hSession,
              track,
              run
            )
            break
          case 'chameleon':
            output = await hybridCryptoService.generateChameleonCert(
              subject,
              M,
              hSession,
              track,
              run
            )
            break
        }
        setResults((prev) => ({ ...prev, [formatId]: { formatId, ...output } }))
        if (!output.error) pushHybridFiles(formatId, output.certs)
      } catch (e) {
        const cancelled = e instanceof GenerationCancelledError
        // A cancelled or failed run keeps no keys.
        if (cancelled) destroyFormatKeys(formatId)
        setResults((prev) => ({
          ...prev,
          [formatId]: {
            formatId,
            certs: [],
            checks: [],
            timingMs: performance.now() - start,
            error: cancelled
              ? e.message
              : translateCryptoError(e instanceof Error ? e.message : 'Generation failed'),
          },
        }))
        if (cancelled) {
          setGeneratingFormat(null)
          setStage('')
          if (!skipStateReset) setGenerating(null)
          return 'cancelled'
        }
      }

      setGeneratingFormat(null)
      setStage('')
      if (!skipStateReset) setGenerating(null)
      return 'done'
    },
    [hsm, onKeyTracked, pushHybridFiles, compositeOid, destroyFormatKeys]
  )

  const generateAll = useCallback(async () => {
    const controller = new AbortController()
    abortRef.current = controller
    setGenerating('all')
    // Current formats only — historical designs are generated on request.
    // A failed format does not stop the run; a cancel does.
    for (const fmt of CURRENT_HYBRID_CERT_FORMATS) {
      if ((await generateFormat(fmt.id, true, controller.signal)) === 'cancelled') break
    }
    abortRef.current = null
    setGenerating(null)
  }, [generateFormat])

  const cancelRun = useCallback(() => abortRef.current?.abort(), [])

  const clearResults = useCallback(() => {
    destroyAllKeys()
    setResults({})
    setExpandedViews({})
  }, [destroyAllKeys])

  // Diagnostics for the browser smoke check: proves repeated runs leave no HSM
  // objects behind. On in dev/test builds; in a production build only when
  // localStorage 'pqc-hybrid-cert-diag' is '1'. Exposes object counts only.
  useEffect(() => {
    let optIn = false
    try {
      optIn = localStorage.getItem('pqc-hybrid-cert-diag') === '1'
    } catch {
      optIn = false
    }
    if (!import.meta.env.DEV && import.meta.env.MODE !== 'test' && !optIn) return
    const w = window as unknown as { __hybridCertDiag?: () => unknown }
    w.__hybridCertDiag = () => {
      const M = hsm.moduleRef.current
      const hSession = hsm.hSessionRef.current
      return {
        hsmObjects: M && hSession ? hsm_findAllObjects(M, hSession, []).length : null,
        trackedHandles: Object.values(formatHandles.current).reduce(
          (n, hs) => n + (hs?.length ?? 0),
          0
        ),
        results: Object.keys(results),
      }
    }
    return () => {
      delete w.__hybridCertDiag
    }
  }, [hsm, results])

  const anyGenerated = Object.values(results).some((r) => !r.error)

  // The comparison table covers current formats, plus any historical design the
  // user chose to generate.
  const comparisonFormats = [
    ...CURRENT_HYBRID_CERT_FORMATS,
    ...[...ADVANCED_HYBRID_CERT_FORMATS, ...HISTORICAL_HYBRID_CERT_FORMATS].filter(
      (f) => results[f.id] && !results[f.id].error
    ),
  ]

  const renderFormatCard = (baseFmt: HybridCertFormat) => {
    // The composite card follows the selected draft §6 profile — its label,
    // OID and structure are never hard-coded to one profile.
    const fmt: HybridCertFormat =
      baseFmt.id === 'composite'
        ? {
            ...baseFmt,
            label: `Composite (${compositeChoice.shortLabel})`,
            oids: [compositeChoice.profile.compositeOid],
            structureLines: compositeStructureLines(compositeChoice.profile),
          }
        : baseFmt
    const result = results[fmt.id]
    const isGeneratingThis =
      generating === fmt.id || (generating === 'all' && !result && fmt.group === 'current')
    const isCurrentlyExecuting = generatingFormat === fmt.id
    const badgeClass = STATUS_BADGE_CLASSES[fmt.statusColor] ?? STATUS_BADGE_CLASSES['muted']

    return (
      <div key={fmt.id} className="glass-panel p-5 space-y-4 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-primary" />
            <h3 className="font-bold text-foreground text-sm">{fmt.label}</h3>
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
              className={STRUCTURE_LINE_COLOR_CLASSES[line.color]}
              style={{ paddingLeft: `${line.indent * 12}px` }}
            >
              {line.text || '\u00A0'}
            </div>
          ))}
        </div>

        {/* Generate button or results */}
        {!result && !isGeneratingThis && (
          <div className="space-y-2">
            {fmt.id === 'composite' && (
              <div className="space-y-1">
                <label
                  htmlFor="composite-profile"
                  className="block text-xs font-medium text-muted-foreground"
                >
                  Composite profile (draft §6)
                </label>
                {/*
                  DOCUMENTED EXCEPTION to the <FilterDropdown> contract
                  (WS22 Stage 2). The two <optgroup>s — "Recommended by
                  §10.4" and "Also implemented" — are normative guidance
                  from the composite-sigs draft, not decoration, and
                  FilterDropdown has no grouped-item concept: flattening
                  the list would drop the recommendation that tells a
                  learner which profile to pick. Revisit if
                  FilterDropdown ever grows option groups.
                */}
                {/* eslint-disable-next-line no-restricted-syntax -- see exception note above */}
                <select
                  id="composite-profile"
                  value={compositeOid}
                  onChange={(e) => setCompositeOid(e.target.value)}
                  disabled={generating !== null}
                  className="w-full max-w-md rounded-md border border-border bg-background px-2 py-1.5 text-xs disabled:opacity-50"
                >
                  <optgroup label="Recommended by §10.4">
                    {COMPOSITE_PROFILE_CHOICES.filter((c) => c.recommended).map((c) => (
                      <option key={c.profile.compositeOid} value={c.profile.compositeOid}>
                        {c.shortLabel} — {c.profile.compositeOid}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Also implemented">
                    {COMPOSITE_PROFILE_CHOICES.filter((c) => !c.recommended).map((c) => (
                      <option key={c.profile.compositeOid} value={c.profile.compositeOid}>
                        {c.shortLabel} — {c.profile.compositeOid}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <p className="text-[10px] leading-relaxed text-muted-foreground">
                  {compositeChoice.useWhen}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  <span className="font-mono">{compositeChoice.profile.label}</span> — PH{' '}
                  {compositeChoice.profile.preHash}, traditional{' '}
                  {compositeChoice.profile.classical.kind === 'ed25519'
                    ? 'Ed25519 (hashes internally, no separate hash)'
                    : compositeChoice.profile.classical.kind === 'rsa-pss'
                      ? `RSA-${compositeChoice.profile.classical.modulusBits} PSS with ${compositeChoice.profile.classical.tradHash}`
                      : `ECDSA ${compositeChoice.profile.classical.curve} with ${compositeChoice.profile.classical.tradHash}`}
                  . The pre-hash and the traditional hash are chosen independently — the SHA-xxx in
                  the profile name is the pre-hash, not the traditional algorithm’s hash.
                </p>
              </div>
            )}
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
          </div>
        )}

        {isGeneratingThis && (
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              Generating...
            </div>
            {isCurrentlyExecuting && (
              <span className="text-xs text-muted-foreground h-4" aria-live="polite">
                {stage}
              </span>
            )}
          </div>
        )}

        {result && (
          <div className="space-y-3">
            {result.error ? (
              <div className="space-y-1">
                <p className="text-xs text-destructive">{result.error}</p>
                <p className="text-[10px] text-muted-foreground">
                  {fmt.id === 'pure-pqc' &&
                    'Requires ML-DSA-65 key pairs in the HSM for the workshop CA and the end entity (C_GenerateKeyPair + C_Sign).'}
                  {fmt.id === 'pure-pqc-slh' &&
                    'Requires SLH-DSA-128s key pairs in the HSM for the workshop CA and the end entity (C_GenerateKeyPair + C_MessageSign).'}
                  {fmt.id === 'composite' &&
                    'Requires both ML-DSA-65 and ECDSA P-256 key pairs; both signatures over shared TBS bytes.'}
                  {fmt.id === 'alt-sig' &&
                    'Requires ECDSA P-256 primary key and ML-DSA-65 key for extensions 2.5.29.72–74.'}
                  {fmt.id === 'related-certs' &&
                    'Requires an ECDSA P-256 key for Cert A, an ML-DSA-65 key for Cert B, and an ML-DSA-65 workshop CA.'}
                  {fmt.id === 'cert-discovery' &&
                    'Requires an ECDSA P-256 primary key, an ML-DSA-65 secondary key and an ML-DSA-65 workshop CA in the HSM.'}
                  {fmt.id === 'unsigned-kem' &&
                    'Requires an ML-KEM-768 key pair in the HSM; no signing key is involved.'}
                  {fmt.id === 'chameleon' &&
                    'Requires an ML-DSA-65 primary key and an ECDSA P-256 delta key; the DeltaCertificateDescriptor carries the DER-encoded ECDSA delta signature.'}
                  {fmt.id === 'pure-pqc-kem' &&
                    'Requires an ML-KEM-768 key pair (CKA_ENCAPSULATE / CKA_DECAPSULATE) and an ML-DSA-65 workshop CA in the HSM; the KEM key cannot sign, so the CA signs its certificate.'}
                  {fmt.id === 'composite-kem' &&
                    'Requires ML-KEM-768 and X25519 key pairs plus an ML-DSA-65 workshop CA in the HSM. OID id-MLKEM768-X25519-SHA3-256 = 1.3.6.1.5.5.7.6.58; subjectPublicKey = ML-KEM-768 (1184 B) ‖ X25519 (32 B).'}
                </p>
                {!isGeneratingThis && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateFormat(fmt.id)}
                    disabled={generating !== null || !hsm.isReady}
                    className="flex items-center gap-2 text-status-error border-destructive/20 hover:bg-destructive/10 mt-2"
                  >
                    <Play size={14} fill="currentColor" />
                    Retry
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Timing + DER size */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>
                    Total:{' '}
                    <strong className="text-foreground">{result.timingMs.toFixed(0)}ms</strong>
                  </span>
                  <span>
                    DER:{' '}
                    <strong className="text-foreground">
                      {result.certs.reduce((s, c) => s + pemToDerSize(c.pem), 0)} B
                    </strong>
                  </span>
                  <span>
                    Certs: <strong className="text-foreground">{result.certs.length}</strong>
                  </span>
                </div>

                {/* Binding hash for related certs */}
                {result.bindingHash && (
                  <div className="flex items-start gap-2 bg-primary/5 rounded-lg p-2 border border-primary/10">
                    <Link2 size={14} className="text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[10px] font-medium text-primary">
                        SHA-256 of the complete final Cert A — stored in Cert B&apos;s
                        RelatedCertificate extension
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground break-all">
                        {result.bindingHash}
                      </div>
                    </div>
                  </div>
                )}

                {/* Verification — run with @noble, not the HSM that signed */}
                {result.checks.length > 0 && (
                  <div className="rounded-lg border border-border p-2 space-y-1">
                    <div
                      className={`text-[10px] font-bold ${
                        result.checks.every((c) => c.ok)
                          ? 'text-status-success'
                          : 'text-status-error'
                      }`}
                    >
                      {result.checks.every((c) => c.ok)
                        ? `Verified — ${result.checks.length}/${result.checks.length} checks passed`
                        : `${result.checks.filter((c) => !c.ok).length} of ${result.checks.length} checks failed`}
                    </div>
                    <ul className="space-y-0.5">
                      {result.checks.map((c, i) => (
                        <li
                          key={i}
                          className={`text-[10px] ${c.ok ? 'text-muted-foreground' : 'text-status-error'}`}
                        >
                          {c.ok ? '✓' : '✗'} {c.name}
                          {!c.ok && c.detail ? ` — ${c.detail}` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Component certs */}
                {result.certs.map((cert, certIdx) => {
                  // Keyed by position: a CA and its end entity share a type.
                  const viewKey = `${fmt.id}-${certIdx}`
                  const currentView = expandedViews[viewKey]
                  const certBadgeClass =
                    cert.role === 'ca'
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : cert.type === 'pqc'
                        ? 'bg-success/10 text-success border-success/20'
                        : 'bg-warning/10 text-warning border-warning/20'
                  const copyKey = `${viewKey}-${currentView}`
                  const isCopied = copiedKey === copyKey

                  return (
                    <div key={cert.label} className="border border-border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground">{cert.label}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${certBadgeClass}`}
                        >
                          {cert.role === 'ca'
                            ? 'ISSUER CA'
                            : cert.type === 'pqc'
                              ? 'PQC'
                              : 'CLASSICAL'}
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
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(
                                  currentView === 'pem' ? cert.pem.trim() : cert.parsed.trim(),
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                downloadContent(
                                  currentView === 'pem' ? cert.pem.trim() : cert.parsed.trim(),
                                  currentView === 'pem'
                                    ? `${fmt.id}-${certIdx}-${cert.role}.pem`
                                    : `${fmt.id}-${certIdx}-${cert.role}-parsed.txt`
                                )
                              }
                              className="text-[10px] h-7 px-2 text-muted-foreground border border-border hover:border-primary/30"
                            >
                              <Download size={11} />
                            </Button>
                          </>
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
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Header bar — LiveHSMToggle anchored per hsm-ui-layout-pattern.md §2 */}
      <div
        className="flex items-center justify-between px-6 py-3 border-b border-border bg-muted/10 mb-6 rounded-t-xl"
        title="Loads softhsmv3 WASM in-browser; required for PKCS#11-backed key generation and signing."
      >
        <LiveHSMToggle hsm={hsm} operations={LIVE_OPERATIONS} />
      </div>

      <div className="space-y-6 px-1">
        <div>
          <h2 className="text-lg font-bold text-foreground mb-2">Hybrid Certificate Formats</h2>
          <p className="text-sm text-muted-foreground">
            Generate and compare X.509 hybrid certificate approaches. Each format combines classical
            and PQC algorithms differently, with distinct trade-offs for backward compatibility,
            standardization, and security properties.
          </p>
        </div>

        <WhyThisMatters
          title="Why Hybrid Certificates? Migration Without Breaking Relying Parties"
          variant="info"
        >
          <p>
            Two quantum risks reach certificates differently. &quot;Harvest now, decrypt later&quot;
            is a confidentiality risk: traffic recorded today can be decrypted once a
            cryptographically-relevant quantum computer can break the classical key exchange, so key
            establishment must move to PQC first. Signatures are different: a future quantum
            computer could forge new RSA/ECDSA signatures, but it cannot reach back and undo
            authentication that already happened. Certificates need PQC signatures before that
            computer exists, and relying parties upgrade at different speeds.
          </p>
          <p className="mt-2">
            The main comparison shows {CURRENT_HYBRID_CERT_FORMATS.length} formats: pure PQC
            signature certificates, a single-OID <strong>composite</strong> signature (both
            algorithms must verify), <strong>Alt-Sig</strong> (a classical certificate carrying a
            PQC key and signature in extensions), <strong>Related Certificates</strong> (two
            separate certificates linked by a hash), and two KEM certificate formats. The subject
            key and the certificate signature are independent: an ML-KEM key cannot sign, so its
            certificate is signed by a separate CA. Pick the format that matches your relying-party
            upgrade horizon.
          </p>
        </WhyThisMatters>

        {/* HSM not ready hint */}
        {!hsm.isReady && (
          <p className="text-xs text-muted-foreground bg-muted/20 border border-border rounded-lg px-4 py-2">
            Enable the HSM above to generate certificates.{' '}
            <span className="text-muted-foreground">
              (softhsmv3 WASM loads once — allow 3–8 seconds on first use.)
            </span>
          </p>
        )}

        {/* Generate All, Cancel, Clear */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="gradient"
            onClick={generateAll}
            disabled={generating !== null || !hsm.isReady}
            className="flex items-center gap-2"
          >
            {generating === 'all' ? (
              <>
                <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                Generating Current Formats...
              </>
            ) : (
              <>
                <Play size={18} fill="currentColor" />
                Generate All Current Formats
              </>
            )}
          </Button>
          {generating === 'all' && (
            <Button variant="outline" onClick={cancelRun} className="flex items-center gap-2">
              <Square size={14} aria-hidden="true" />
              Cancel
            </Button>
          )}
          {generating === null && Object.keys(results).length > 0 && (
            <Button
              variant="ghost"
              onClick={clearResults}
              className="flex items-center gap-2 text-muted-foreground"
              title="Remove the results and destroy every key these runs created in the HSM"
            >
              <Trash2 size={14} aria-hidden="true" />
              Clear results
            </Button>
          )}
        </div>

        {/* Recommended starting point callout */}
        {Object.keys(results).filter((k) => !results[k].error).length === 0 && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-muted-foreground">
            <Info size={14} className="mt-0.5 shrink-0 text-primary" />
            <span>
              <strong className="text-foreground">Start here:</strong> Try <strong>Pure PQC</strong>{' '}
              or <strong>Related Certs</strong> first — they show the greatest visual contrast in
              the comparison table.
            </span>
          </div>
        )}

        {/* Format cards — current formats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CURRENT_HYBRID_CERT_FORMATS.map(renderFormatCard)}
        </div>

        {/* Advanced examples — specialised or illustrative, generated on request */}
        {ADVANCED_HYBRID_CERT_FORMATS.length > 0 && (
          <section aria-labelledby="advanced-examples-heading" className="space-y-3">
            <div>
              <h3 id="advanced-examples-heading" className="text-sm font-bold text-foreground">
                Advanced examples
              </h3>
              <p className="text-xs text-muted-foreground">
                Specialised mechanisms that are not part of Generate All: Certificate Discovery (an
                active draft whose OIDs are not assigned yet, so its encoding here is illustrative)
                and the RFC 9925 unsigned certificate (a container that is never valid in a
                certification path).
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ADVANCED_HYBRID_CERT_FORMATS.map(renderFormatCard)}
            </div>
          </section>
        )}

        {/* Historical designs — separated from the main comparison */}
        {HISTORICAL_HYBRID_CERT_FORMATS.length > 0 && (
          <section aria-labelledby="historical-designs-heading" className="space-y-3">
            <div>
              <h3 id="historical-designs-heading" className="text-sm font-bold text-foreground">
                Historical designs
              </h3>
              <p className="text-xs text-muted-foreground">
                Proposals that expired or were never adopted by the IETF. They are kept for study
                only, are not part of Generate All, and are not recommended for new deployments.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {HISTORICAL_HYBRID_CERT_FORMATS.map(renderFormatCard)}
            </div>
          </section>
        )}

        {/* Comparison table — shown as soon as any format is generated */}
        {anyGenerated && (
          <div className="glass-panel p-4">
            <h3 className="text-sm font-bold text-foreground mb-3">Format Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2 text-muted-foreground font-medium">Property</th>
                    {comparisonFormats.map((fmt) => (
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
                    {comparisonFormats.map((fmt) => (
                      <td key={fmt.id} className="p-2 text-center font-mono text-[10px] break-all">
                        {fmt.standard}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="p-2 text-muted-foreground">Approach</td>
                    {comparisonFormats.map((fmt) => (
                      <td key={fmt.id} className="p-2 text-center text-xs">
                        {fmt.approach}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="p-2 text-muted-foreground">DER Size</td>
                    {comparisonFormats.map((fmt) => {
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
                    {comparisonFormats.map((fmt) => {
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
                    {comparisonFormats.map((fmt) => (
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
                    {comparisonFormats.map((fmt) => (
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
                    {comparisonFormats.map((fmt) => {
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
            onRemoveKey={(key: HsmKey) => hsm.removeKey(key.handle)}
          />
        )}
      </div>
    </div>
  )
}
