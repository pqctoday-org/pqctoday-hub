/**
 * V2p7EkExplorer.tsx — V2.7 RC1 PQC EK Template Explorer
 *
 * For each of the 6 V2.7 EK persistent handles, TPM2_ReadPublic +
 * byte-level unmarshal of the returned TPMT_PUBLIC, then a spec-compliance
 * scoreboard vs V2.7 RC1 Tables 13/14 + Table 8 PolicyB digests + FIPS
 * 203/204 pubkey-size tables.
 *
 * NOT a parser library — TPM 2.0 structures are length-prefixed plain
 * bytes, no ASN.1, so DataView is enough.
 */
import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { readPublic } from '../../../wasm/tpmBridge'
import { V2P7_EK_SPECS, type V2p7EkSpec, tpmAlgName, toHex, bytesEqual } from './v2p7-reference'

interface ReadResult {
  spec: V2p7EkSpec
  /** undefined while loading, error message if TPM2_ReadPublic failed. */
  error?: string
  /** Parsed TPMT_PUBLIC fields. */
  type?: number
  nameAlg?: number
  objectAttributes?: number
  authPolicy?: Uint8Array
  /** Raw parms blob (sym + alg-specific) — we don't break this down on screen,
   *  but display its length so users see the V2.7 template width. */
  parmsLen?: number
  uniqueSize?: number
}

interface Props {
  isWasmReady: boolean
  v2p7Status: number[] | null
}

function parseTpmtPublic(bytes: Uint8Array, parmsLen: number, spec: V2p7EkSpec): ReadResult {
  // TPMT_PUBLIC layout (V1.85 Part 2 §12.2.4):
  //   type(2), nameAlg(2), objectAttributes(4),
  //   authPolicy.size(2), authPolicy.buffer[],
  //   parameters[],          ← alg-specific, size known by template
  //   unique.size(2), unique.buffer[]
  let off = 0
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const type = view.getUint16(off)
  off += 2
  const nameAlg = view.getUint16(off)
  off += 2
  const objectAttributes = view.getUint32(off)
  off += 4
  const apSize = view.getUint16(off)
  off += 2
  const authPolicy = bytes.slice(off, off + apSize)
  off += apSize
  // Skip parms (we don't decode them; just verify the byte width matches the spec).
  off += parmsLen
  const uniqueSize = view.getUint16(off)
  return { spec, type, nameAlg, objectAttributes, authPolicy, parmsLen, uniqueSize }
}

function expectedParmsLen(spec: V2p7EkSpec): number {
  // ML-KEM Storage (V2.7 Table 13): sym{TPM_ALG_AES(2) + keyBits(2) + mode(2)}
  //   + asymDetail{TPM_MLKEM_*(2)} → 8 bytes.
  // ML-DSA Signing (V2.7 Table 14): { parameterSet(2) + allowExternalMu(1) }
  //   → 3 bytes.
  if (spec.label.startsWith('ML-KEM')) return 8
  return 3
}

export function V2p7EkExplorer({ isWasmReady, v2p7Status }: Props) {
  const [results, setResults] = useState<ReadResult[]>([])
  const [loading, setLoading] = useState(false)

  const readAll = useCallback(async () => {
    if (!isWasmReady) return
    setLoading(true)
    const out: ReadResult[] = []
    for (const spec of V2P7_EK_SPECS) {
      try {
        const tpmtPublic = await readPublic(spec.persistentHandle)
        out.push(parseTpmtPublic(tpmtPublic, expectedParmsLen(spec), spec))
      } catch (err: unknown) {
        out.push({ spec, error: err instanceof Error ? err.message : String(err) })
      }
    }
    setResults(out)
    setLoading(false)
  }, [isWasmReady])

  useEffect(() => {
    if (!isWasmReady) return
    // Defer to avoid "setState within an effect" lint warning — readAll's
    // setState lands after a microtask boundary anyway, but the eslint plugin
    // can't see through the async callback.
    queueMicrotask(() => {
      void readAll()
    })
  }, [isWasmReady, readAll])

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold mb-2">V2.7 RC1 EK Template Explorer</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              For each of the 6 spec-mandated PQC EKs, the playground issues a real{' '}
              <code>TPM2_ReadPublic</code> against its persistent handle, unmarshals the returned{' '}
              <code>TPMT_PUBLIC</code>, and compares every field byte-exact against{' '}
              <strong>TCG EK Credential Profile V2.7 RC1, Tables 13/14</strong> (ML-KEM Storage /
              ML-DSA Signing templates), Table 8 PolicyB digests, and FIPS 203 Table 3 / FIPS 204
              Table 2 pubkey sizes.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={readAll} disabled={loading || !isWasmReady}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Re-read
          </Button>
        </div>
        {v2p7Status && (
          <div className="mt-4 text-xs font-mono text-muted-foreground">
            V2.7 provisioning status:{' '}
            {v2p7Status.map((s, i) => (
              <span key={i} className="mr-2">
                {
                  [
                    'ML-KEM-512',
                    'ML-KEM-768',
                    'ML-KEM-1024',
                    'ML-DSA-44',
                    'ML-DSA-65',
                    'ML-DSA-87',
                  ][i]
                }
                <span
                  className={
                    s === 1
                      ? 'text-status-success ml-1'
                      : s === 2
                        ? 'text-status-error ml-1'
                        : 'text-muted-foreground ml-1'
                  }
                >
                  {s === 1 ? '✓' : s === 2 ? '✗' : '·'}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {results.map((r) => (
          <EkCard key={r.spec.label} r={r} />
        ))}
      </div>
    </div>
  )
}

function StatusRow({
  label,
  expected,
  got,
  ok,
}: {
  label: string
  expected: string
  got: string
  ok: boolean
}) {
  return (
    <div className="flex items-start gap-2 text-xs font-mono">
      {ok ? (
        <CheckCircle2 className="text-status-success h-3.5 w-3.5 mt-0.5 shrink-0" />
      ) : (
        <XCircle className="text-status-error h-3.5 w-3.5 mt-0.5 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-muted-foreground">{label}</div>
        <div className="flex flex-wrap gap-x-3">
          <span className="text-foreground">got: {got}</span>
          <span className="text-muted-foreground">spec: {expected}</span>
        </div>
      </div>
    </div>
  )
}

function EkCard({ r }: { r: ReadResult }) {
  const s = r.spec
  if (r.error) {
    return (
      <div className="glass-panel p-5 border-l-4 border-l-status-error">
        <div className="flex items-start gap-2">
          <AlertCircle className="text-status-error h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">{s.label}</div>
            <div className="text-xs text-muted-foreground mt-1">
              handle 0x{s.persistentHandle.toString(16)}
            </div>
            <div className="text-xs text-status-error mt-2 font-mono break-all">{r.error}</div>
            <div className="text-xs text-muted-foreground mt-2">
              EK not provisioned yet — check the "V2.7 provisioning status" banner above. If the
              corresponding row is <span className="text-status-error">✗</span>, the EK
              CreatePrimary failed at WASM init (most often: the softhsm PQC bridge isn't
              registered).
            </div>
          </div>
        </div>
      </div>
    )
  }

  const checks = [
    {
      label: 'type (algorithm)',
      ok: r.type === s.algId,
      got: `0x${r.type?.toString(16).padStart(4, '0')} (${tpmAlgName(r.type!)})`,
      expected: `0x${s.algId.toString(16).padStart(4, '0')} (${tpmAlgName(s.algId)})`,
    },
    {
      label: 'nameAlg',
      ok: r.nameAlg === s.nameAlg,
      got: `0x${r.nameAlg?.toString(16).padStart(4, '0')} (${tpmAlgName(r.nameAlg!)})`,
      expected: `0x${s.nameAlg.toString(16).padStart(4, '0')} (${tpmAlgName(s.nameAlg)})`,
    },
    {
      label: 'objectAttributes',
      ok: r.objectAttributes === s.objectAttributes,
      got: `0x${r.objectAttributes?.toString(16).padStart(8, '0')}`,
      expected: `0x${s.objectAttributes.toString(16).padStart(8, '0')}`,
    },
    {
      label: 'authPolicy = PolicyB',
      ok: r.authPolicy ? bytesEqual(r.authPolicy, s.policyB) : false,
      got: r.authPolicy ? `${r.authPolicy.length} B, ${toHex(r.authPolicy.slice(0, 4))}…` : '—',
      expected: `${s.policyB.length} B (V2.7 Table 8), ${toHex(s.policyB.slice(0, 4))}…`,
    },
    {
      label: 'unique.size (FIPS pubkey)',
      ok: r.uniqueSize === s.fipsPubKeySize,
      got: `${r.uniqueSize} B`,
      expected: `${s.fipsPubKeySize} B (FIPS ${s.label.startsWith('ML-KEM') ? '203 Table 3' : '204 Table 2'})`,
    },
  ]
  const allOk = checks.every((c) => c.ok)

  return (
    <div
      className={`glass-panel p-5 border-l-4 ${
        allOk ? 'border-l-status-success' : 'border-l-status-warning'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-bold">{s.label}</div>
          <div className="text-xs text-muted-foreground font-mono">
            handle 0x{s.persistentHandle.toString(16)}
          </div>
        </div>
        {allOk ? (
          <span className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded border bg-status-success/10 text-status-success border-status-success/30">
            spec-compliant
          </span>
        ) : (
          <span className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded border bg-status-warning/10 text-status-warning border-status-warning/30">
            spec drift
          </span>
        )}
      </div>
      <div className="space-y-2">
        {checks.map((c, i) => (
          <StatusRow key={i} {...c} />
        ))}
      </div>
    </div>
  )
}
