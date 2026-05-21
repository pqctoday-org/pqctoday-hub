// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect, useMemo, useState } from 'react'
import { BarChart3, AlertTriangle, Loader2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { JOSE_SIGNING_ALGORITHMS, SAMPLE_JWT_PAYLOAD } from '../constants'
import {
  createJWTHeader,
  createJWTPayload,
  generateJwsKeyPair,
  signJWS,
  type JwsAlg,
} from '../jwtUtils'

const HTTP_HEADER_LIMIT = 8192 // 8 KB common default

interface TokenSizeData {
  name: string
  jose: string
  headerB64Length: number
  payloadB64Length: number
  signatureB64Length: number
  signatureBytes: number
  totalLength: number
  broken: boolean
  nistLevel?: number
  measured: boolean
}

function getBarColor(total: number): string {
  if (total < 4096) return 'bg-success/60'
  if (total < 8192) return 'bg-warning/60'
  return 'bg-destructive/60'
}

function getSizeLabel(total: number): string {
  if (total < 4096) return 'OK'
  if (total < 8192) return 'Large'
  return 'Exceeds 8 KB'
}

function getSizeLabelColor(total: number): string {
  if (total < 4096) return 'text-success'
  if (total < 8192) return 'text-warning'
  return 'text-destructive'
}

// PQC algs we can actually sign in the browser
const MEASURABLE_ALGS = new Set<string>([
  'ML-DSA-44',
  'ML-DSA-65',
  'ML-DSA-87',
  'SLH-DSA-SHA2-128s',
  'MLDSA65-Ed25519',
])

export const TokenSizeAnalyzer: React.FC = () => {
  const [payloadJson, setPayloadJson] = useState(JSON.stringify(SAMPLE_JWT_PAYLOAD, null, 2))
  const [measuredSigBytes, setMeasuredSigBytes] = useState<Record<string, number>>({})
  const [isMeasuring, setIsMeasuring] = useState(true)
  const [measureError, setMeasureError] = useState<string | null>(null)

  const isPayloadValid = useMemo(() => {
    try {
      JSON.parse(payloadJson)
      return true
    } catch {
      return false
    }
  }, [payloadJson])

  // Measure real signature sizes once on mount over a stable canonical input,
  // so the table reflects byte counts produced by actual signing rather than
  // hardcoded constants.
  useEffect(() => {
    let cancelled = false
    const canonical: Record<string, unknown> = { sub: 'size-probe', iat: 0 }
    const algsToMeasure = JOSE_SIGNING_ALGORITHMS.filter(
      (a) => MEASURABLE_ALGS.has(a.jose) && a.category === 'signing'
    )
    ;(async () => {
      try {
        const out: Record<string, number> = {}
        for (const a of algsToMeasure) {
          const kp = await generateJwsKeyPair({ alg: a.jose as JwsAlg, backend: 'noble' })
          const r = await signJWS({
            alg: a.jose as JwsAlg,
            payload: canonical,
            keyPair: kp,
            backend: 'noble',
          })
          if (cancelled) return
          out[a.jose] = r.signature.length
        }
        if (!cancelled) setMeasuredSigBytes(out)
      } catch (e) {
        if (!cancelled) setMeasureError(e instanceof Error ? e.message : String(e))
      } finally {
        if (!cancelled) setIsMeasuring(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const sizeData: TokenSizeData[] = useMemo(() => {
    if (!isPayloadValid) return []

    try {
      const claims = JSON.parse(payloadJson) as Record<string, unknown>
      const payloadB64 = createJWTPayload(claims)

      return JOSE_SIGNING_ALGORITHMS.filter((alg) => alg.sigBytes !== undefined).map((alg) => {
        const headerB64 = createJWTHeader(alg.jose)
        const sigBytes = measuredSigBytes[alg.jose] ?? alg.sigBytes!
        const signatureB64Length = Math.ceil((sigBytes * 4) / 3)
        const totalLength = headerB64.length + 1 + payloadB64.length + 1 + signatureB64Length

        return {
          name: alg.name,
          jose: alg.jose,
          headerB64Length: headerB64.length,
          payloadB64Length: payloadB64.length,
          signatureB64Length,
          signatureBytes: sigBytes,
          totalLength,
          broken: alg.broken,
          nistLevel: alg.nistLevel,
          measured: measuredSigBytes[alg.jose] !== undefined,
        }
      })
    } catch {
      return []
    }
  }, [payloadJson, isPayloadValid, measuredSigBytes])

  const maxSize = useMemo(
    () => Math.max(...sizeData.map((d) => d.totalLength), HTTP_HEADER_LIMIT),
    [sizeData]
  )

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">
          Interactive Token Size Comparison
        </h3>
        <p className="text-sm text-muted-foreground">
          Edit the JWT payload below and see how total token size changes across every signing
          algorithm in scope. PQC rows are <span className="font-bold text-primary">measured</span>{' '}
          against the real signature bytes produced by @noble/post-quantum; classical rows use spec
          sizes.
        </p>
      </div>

      {isMeasuring && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 size={12} className="animate-spin" />
          Measuring real signature sizes…
        </div>
      )}
      {measureError && (
        <div className="rounded-lg p-3 border border-destructive/50 bg-destructive/10 text-xs text-destructive">
          Failed to measure: {measureError}
        </div>
      )}

      {/* Payload Editor */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3">JWT Payload (Editable)</h4>
        <Textarea
          value={payloadJson}
          onChange={(e) => setPayloadJson(e.target.value)}
          className={`h-36 text-xs font-mono ${isPayloadValid ? '' : 'border-status-error'}`}
          spellCheck={false}
        />
        {!isPayloadValid && (
          <p className="text-[10px] text-status-error mt-1">
            Invalid JSON. Fix the payload to see size calculations.
          </p>
        )}
      </div>

      {/* Color Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-success/60" />
          <span className="text-muted-foreground">&lt; 4 KB (OK)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-warning/60" />
          <span className="text-muted-foreground">4-8 KB (Large)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-destructive/60" />
          <span className="text-muted-foreground">&gt; 8 KB (Exceeds limit)</span>
        </span>
      </div>

      {/* Size Chart */}
      {sizeData.length > 0 && (
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-primary" />
            <h4 className="text-sm font-bold text-foreground">JWT Size by Algorithm</h4>
          </div>

          <div className="space-y-4">
            {sizeData.map((item) => {
              const headerPct = (item.headerB64Length / maxSize) * 100
              const payloadPct = (item.payloadB64Length / maxSize) * 100
              const sigPct = (item.signatureB64Length / maxSize) * 100

              return (
                <div key={item.jose}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground w-40 truncate">
                        {item.name}
                      </span>
                      {item.broken ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded border font-bold bg-destructive/20 text-destructive border-destructive/50">
                          Vulnerable
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded border font-bold bg-success/20 text-success border-success/50">
                          L{item.nistLevel}
                        </span>
                      )}
                      {item.measured && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded border font-bold bg-primary/10 text-primary border-primary/30">
                          measured
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold ${getSizeLabelColor(item.totalLength)}`}
                      >
                        {getSizeLabel(item.totalLength)}
                      </span>
                      <span className="text-xs font-mono text-foreground min-w-[80px] text-right">
                        {item.totalLength < 1024
                          ? `${item.totalLength} B`
                          : `${(item.totalLength / 1024).toFixed(1)} KB`}
                      </span>
                    </div>
                  </div>

                  {/* Segmented Bar */}
                  <div className="w-full bg-muted rounded-full h-5 flex overflow-hidden relative">
                    <div
                      className="bg-primary/40 h-5 transition-all"
                      style={{ width: `${headerPct}%` }}
                      title={`Header: ${item.headerB64Length} chars`}
                    />
                    <div
                      className="bg-success/40 h-5 transition-all"
                      style={{ width: `${payloadPct}%` }}
                      title={`Payload: ${item.payloadB64Length} chars`}
                    />
                    <div
                      className={`${getBarColor(item.totalLength)} h-5 transition-all`}
                      style={{ width: `${sigPct}%` }}
                      title={`Signature: ${item.signatureB64Length} chars`}
                    />

                    {maxSize > HTTP_HEADER_LIMIT && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-destructive z-10"
                        style={{ left: `${(HTTP_HEADER_LIMIT / maxSize) * 100}%` }}
                        title="8 KB HTTP header limit"
                      />
                    )}
                  </div>

                  {/* Segment labels */}
                  <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                    <span>Header: {item.headerB64Length}</span>
                    <span>Payload: {item.payloadB64Length}</span>
                    <span>Signature: {item.signatureB64Length}</span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-4 h-0.5 bg-destructive" />
              <span className="text-destructive font-medium">8 KB HTTP header limit</span>
            </div>
            <span className="text-muted-foreground">
              (common default for Nginx, Apache, Node.js)
            </span>
          </div>
        </div>
      )}

      {/* Segment Legend */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3">Bar Segments</h4>
        <div className="flex flex-wrap gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-primary/40" />
            <span className="text-muted-foreground">JOSE Header (~50 B base64url)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-success/40" />
            <span className="text-muted-foreground">Payload (variable, your claims)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-muted border border-border" />
            <span className="text-muted-foreground">Signature (varies by algorithm)</span>
          </span>
        </div>
      </div>

      {/* Summary Table */}
      {sizeData.length > 0 && (
        <div className="glass-panel p-4">
          <h4 className="text-sm font-bold text-foreground mb-3">Detailed Size Table</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-muted-foreground font-medium">Algorithm</th>
                  <th className="text-right p-2 text-muted-foreground font-medium">Sig (bytes)</th>
                  <th className="text-right p-2 text-muted-foreground font-medium">Sig (b64)</th>
                  <th className="text-right p-2 text-muted-foreground font-medium">Total JWT</th>
                  <th className="text-right p-2 text-muted-foreground font-medium">vs ES256</th>
                </tr>
              </thead>
              <tbody>
                {sizeData.map((item) => {
                  const es256 = sizeData.find((d) => d.jose === 'ES256')
                  const multiplier = es256 ? (item.totalLength / es256.totalLength).toFixed(1) : '-'

                  return (
                    <tr key={item.jose} className="border-b border-border/50">
                      <td className="p-2 font-medium text-foreground">
                        <div className="flex items-center gap-1.5">
                          {item.name}
                          {item.broken && (
                            <AlertTriangle size={12} className="text-destructive shrink-0" />
                          )}
                        </div>
                      </td>
                      <td className="p-2 text-right font-mono text-xs text-foreground">
                        {item.signatureBytes.toLocaleString()}
                      </td>
                      <td className="p-2 text-right font-mono text-xs text-foreground">
                        {item.signatureB64Length.toLocaleString()}
                      </td>
                      <td className="p-2 text-right font-mono text-xs">
                        <span className={getSizeLabelColor(item.totalLength)}>
                          {item.totalLength < 1024
                            ? `${item.totalLength} B`
                            : `${(item.totalLength / 1024).toFixed(1)} KB`}
                        </span>
                      </td>
                      <td className="p-2 text-right font-mono text-xs text-muted-foreground">
                        {item.jose === 'ES256' ? '1.0x' : `${multiplier}x`}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Educational note */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Key takeaway:</strong> SLH-DSA-SHA2-128s has the smallest key (32 bytes) but the
          largest signature (~7,856 bytes). ML-DSA-65 is the recommended balance for most API use
          cases: NIST Level 3 security with a 3,309-byte signature. For APIs with strict header size
          constraints, consider reference tokens (opaque strings) with server-side introspection
          instead of self-contained JWTs.
        </p>
      </div>
    </div>
  )
}
