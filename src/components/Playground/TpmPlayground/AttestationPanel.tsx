/**
 * AttestationPanel.tsx — ML-DSA Quote / Certify with in-browser verification.
 *
 * Marquee TpmPlayground tab. Drives real TPM2_Quote / TPM2_Certify against
 * the WASM TPM using an ML-DSA-{44,65,87} restricted+sign AK, then verifies
 * the returned signature in-browser via OpenSSL WASM (`liboqs_dsa.verify`).
 *
 * NOT a trust-anchored production flow — the AK is locally provisioned, the
 * ephemeral EK cert issuer is not a real CA. This demonstrates the
 * cryptographic plumbing end-to-end (TPM-resident ML-DSA AK → real signed
 * attestation → spec-compliant cross-stack verification).
 */
import { useCallback, useState } from 'react'
import { AlertCircle, CheckCircle2, Download, Play, Shield, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { executeTpmCommandLarge, readPublic } from '../../../wasm/tpmBridge'
import { verify as mldsaVerify } from '../../../wasm/liboqs_dsa'
import {
  MLDSA_AK_SPECS,
  type MlDsaAkSpec,
  OID_ML_DSA_44,
  OID_ML_DSA_65,
  OID_ML_DSA_87,
  TPM_GENERATED_VALUE,
  toHex,
} from './v2p7-reference'

interface Props {
  isWasmReady: boolean
}

type Operation = 'quote' | 'certify'

interface AttestResult {
  operation: Operation
  ak: MlDsaAkSpec
  attest: Uint8Array
  signature: Uint8Array
  pubkey: Uint8Array
  verifyResult: 'pending' | 'pass' | 'fail'
  verifyError?: string
  hasGeneratedMagic: boolean
}

// ── Big-endian byte helpers ────────────────────────────────────────────────
function u16be(v: number): number[] {
  return [(v >>> 8) & 0xff, v & 0xff]
}
function u32be(v: number): number[] {
  return [(v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff]
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim().replace(/^0x/i, '').replace(/[\s:]/g, '')
  if (clean.length % 2 !== 0) throw new Error('hex must be even length')
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.substr(i * 2, 2), 16)
  return out
}

function parsePcrSelection(text: string): { hashAlg: number; bitmap: number[] } {
  // Form: "sha256:0,1,2,3,7"
  const [alg, list] = text.split(':')
  const algMap: Record<string, number> = {
    sha1: 0x0004,
    sha256: 0x000b,
    sha384: 0x000c,
    sha512: 0x000d,
  }
  const hashAlg = algMap[alg.toLowerCase().trim()]
  if (!hashAlg) throw new Error(`unknown PCR hash: ${alg}`)
  const indices = (list || '')
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n >= 0 && n < 24)
  const bitmap = [0, 0, 0]
  for (const i of indices) bitmap[i >>> 3] |= 1 << (i & 7)
  return { hashAlg, bitmap }
}

// ── TPMT_PUBLIC parser for ML-DSA AK ──────────────────────────────────────
// Layout:  type(2) + nameAlg(2) + objAttrs(4) + authPolicy(2 + bytes) +
//          parms(TPMS_MLDSA_PARMS = parameterSet(2) + allowExternalMu(1)) +
//          unique(2 + bytes)
function extractMlDsaPubkey(tpmtPublic: Uint8Array): Uint8Array {
  let off = 0
  off += 2 + 2 + 4
  const apSize = (tpmtPublic[off] << 8) | tpmtPublic[off + 1]
  off += 2 + apSize
  off += 3 // TPMS_MLDSA_PARMS
  const uSize = (tpmtPublic[off] << 8) | tpmtPublic[off + 1]
  off += 2
  return tpmtPublic.slice(off, off + uSize)
}

// ── Wrap a raw ML-DSA pubkey into a PEM SPKI for OpenSSL pkeyutl -verify ──

function oidForAk(ak: MlDsaAkSpec): Uint8Array {
  if (ak.label === 'ML-DSA-44') return OID_ML_DSA_44
  if (ak.label === 'ML-DSA-65') return OID_ML_DSA_65
  return OID_ML_DSA_87
}

function derSeq(content: Uint8Array): Uint8Array {
  return derTLV(0x30, content)
}
function derOid(oidBody: Uint8Array): Uint8Array {
  return derTLV(0x06, oidBody)
}
function derBitString(content: Uint8Array): Uint8Array {
  // BIT STRING with 0 unused bits prefix
  const wrapped = new Uint8Array(content.length + 1)
  wrapped[0] = 0
  wrapped.set(content, 1)
  return derTLV(0x03, wrapped)
}
function derTLV(tag: number, value: Uint8Array): Uint8Array {
  let lenBytes: number[]
  if (value.length < 0x80) {
    lenBytes = [value.length]
  } else if (value.length < 0x100) {
    lenBytes = [0x81, value.length]
  } else if (value.length < 0x10000) {
    lenBytes = [0x82, (value.length >>> 8) & 0xff, value.length & 0xff]
  } else {
    lenBytes = [
      0x83,
      (value.length >>> 16) & 0xff,
      (value.length >>> 8) & 0xff,
      value.length & 0xff,
    ]
  }
  const out = new Uint8Array(1 + lenBytes.length + value.length)
  out[0] = tag
  out.set(lenBytes, 1)
  out.set(value, 1 + lenBytes.length)
  return out
}
function bytesToBase64(bytes: Uint8Array): string {
  // Avoid String.fromCharCode stack overflow on large signatures by chunking.
  let s = ''
  const CHUNK = 0x8000
  for (let i = 0; i < bytes.length; i += CHUNK) {
    s += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(s)
}
function pemSpkiFromRawMlDsa(pubkey: Uint8Array, ak: MlDsaAkSpec): Uint8Array {
  const algIdent = derSeq(derOid(oidForAk(ak)))
  const bitStr = derBitString(pubkey)
  const spki = derSeq(new Uint8Array([...algIdent, ...bitStr]))
  const b64 = bytesToBase64(spki)
  const lines = b64.match(/.{1,64}/g)?.join('\n') || b64
  const pem = `-----BEGIN PUBLIC KEY-----\n${lines}\n-----END PUBLIC KEY-----\n`
  return new TextEncoder().encode(pem)
}

// ── Quote / Certify command builders ──────────────────────────────────────

function buildQuoteCommand(
  signHandle: number,
  qualifyingData: Uint8Array,
  pcr: { hashAlg: number; bitmap: number[] }
): Uint8Array {
  // Empty-password session for the signHandle (USER role; AK keyflags permit it).
  const sessionFrame = [...u32be(0x40000009), ...u16be(0), 0, ...u16be(0)]
  const inSchemeNull = u16be(0x0010) // TPM_ALG_NULL — TPM derives hash from nameAlg
  const pcrSelection = [
    ...u32be(1), // count = 1
    ...u16be(pcr.hashAlg),
    3, // sizeofSelect
    pcr.bitmap[0],
    pcr.bitmap[1],
    pcr.bitmap[2],
  ]
  const body = [
    ...u32be(signHandle), // sign handle
    ...u32be(sessionFrame.length),
    ...sessionFrame,
    ...u16be(qualifyingData.length), // TPM2B_DATA size
    ...qualifyingData,
    ...inSchemeNull,
    ...pcrSelection,
  ]
  const cmd = new Uint8Array([
    ...u16be(0x8002), // TPM_ST_SESSIONS
    ...u32be(10 + body.length), // commandSize
    ...u32be(0x00000158), // TPM_CC_Quote
    ...body,
  ])
  return cmd
}

function buildCertifyCommand(
  objectHandle: number,
  signHandle: number,
  qualifyingData: Uint8Array
): Uint8Array {
  // Two authorizations: objectHandle (ADMIN role) + signHandle (USER role).
  // For a self-Certify (objectHandle == signHandle) the TPM still demands two
  // session frames. Both empty-password sessions.
  const session = [...u32be(0x40000009), ...u16be(0), 0, ...u16be(0)]
  const sessionsBlock = [...session, ...session]
  const inSchemeNull = u16be(0x0010)
  const body = [
    ...u32be(objectHandle),
    ...u32be(signHandle),
    ...u32be(sessionsBlock.length),
    ...sessionsBlock,
    ...u16be(qualifyingData.length),
    ...qualifyingData,
    ...inSchemeNull,
  ]
  const cmd = new Uint8Array([
    ...u16be(0x8002),
    ...u32be(10 + body.length),
    ...u32be(0x00000148), // TPM_CC_Certify
    ...body,
  ])
  return cmd
}

// Parse a TPM2_Quote/TPM2_Certify response → (attest, signature) bytes.
//
// Layout after the 10-byte header (tag=TPM_ST_SESSIONS):
//   parameterSize(4)
//   quoted/certifyInfo = TPM2B_ATTEST { size(2), bytes }
//   signature = TPMT_SIGNATURE { sigAlg(2), TPMU_SIGNATURE }
//     for ML-DSA: sigAlg = 0x00A1, then TPM2B_SIGNATURE_MLDSA { size(2), bytes }
//
// (followed by an authorization area we don't consume here)
function parseAttestResponse(resp: Uint8Array): {
  attest: Uint8Array
  signature: Uint8Array
} {
  if (resp.length < 10) throw new Error('attest response too short')
  const rc = (resp[6] << 24) | (resp[7] << 16) | (resp[8] << 8) | resp[9]
  if (rc !== 0) throw new Error(`TPM rc 0x${rc.toString(16)}`)
  let off = 10
  off += 4 // parameterSize
  const aSize = (resp[off] << 8) | resp[off + 1]
  off += 2
  const attest = resp.slice(off, off + aSize)
  off += aSize
  const sigAlg = (resp[off] << 8) | resp[off + 1]
  off += 2
  if (sigAlg !== 0x00a1) {
    throw new Error(`unexpected sigAlg 0x${sigAlg.toString(16)} (want ML-DSA 0x00A1)`)
  }
  const sigSize = (resp[off] << 8) | resp[off + 1]
  off += 2
  const signature = resp.slice(off, off + sigSize)
  return { attest, signature }
}

// ── React component ──────────────────────────────────────────────────────

export function AttestationPanel({ isWasmReady }: Props) {
  const [ak, setAk] = useState<MlDsaAkSpec>(MLDSA_AK_SPECS[1])
  const [operation, setOperation] = useState<Operation>('quote')
  const [pcrSel, setPcrSel] = useState('sha256:0,1,2,3,7')
  const [nonce, setNonce] = useState('deadbeefcafebabe1234567890abcdef')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<AttestResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async () => {
    if (!isWasmReady) return
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const qData = hexToBytes(nonce)

      // Fetch AK pubkey via TPM2_ReadPublic.
      const tpmtPublic = await readPublic(ak.persistentHandle)
      const pubkey = extractMlDsaPubkey(tpmtPublic)
      if (pubkey.length !== ak.fipsPubKeySize) {
        throw new Error(`AK pubkey ${pubkey.length} B ≠ FIPS expected ${ak.fipsPubKeySize} B`)
      }

      // Regression guard: bridge's last paramSet-cached pubkey is intended
      // as a diagnostic for cache-collision symptoms. The per-key handle
      // pinned in the libtpms sensitive buffer (pqcCryptoBridge.ts MAGIC
      // 0x42504751) is the authoritative path; this is a belt-and-braces
      // warning if for any reason it falls back to the per-paramSet cache
      // and that cache disagrees with the TPM-stored AK pubkey.
      try {
        const { getBridgeMlDsaPubBytes } = await import('../../../wasm/pqcCryptoBridge')
        const paramSet = ak.label === 'ML-DSA-44' ? 1 : ak.label === 'ML-DSA-65' ? 2 : 3
        const bridgePub = getBridgeMlDsaPubBytes(paramSet)
        if (bridgePub && bridgePub.length === pubkey.length) {
          let match = true
          for (let i = 0; i < pubkey.length; i++) {
            // eslint-disable-next-line security/detect-object-injection
            if (bridgePub[i] !== pubkey[i]) {
              match = false
              break
            }
          }
          if (!match) {
            console.warn(
              `[Attestation] TPM AK_pub differs from bridge paramSet=${paramSet} cached pub — ` +
                `the per-key handle pinned in sensitive will sign with the right key, ` +
                `but a regression in that code path would cause a verify rejection here.`
            )
          }
        }
      } catch (diagErr) {
        console.warn('[Attestation] bridge cross-check failed:', diagErr)
      }

      let cmd: Uint8Array
      if (operation === 'quote') {
        const sel = parsePcrSelection(pcrSel)
        cmd = buildQuoteCommand(ak.persistentHandle, qData, sel)
      } else {
        cmd = buildCertifyCommand(ak.persistentHandle, ak.persistentHandle, qData)
      }

      // Response must fit: ML-DSA-87 sig = 4627 B + attest 144-174 B + framing.
      const resp = await executeTpmCommandLarge(cmd, 8192)
      const { attest, signature } = parseAttestResponse(resp)

      const hasGeneratedMagic =
        attest.length >= 4 &&
        attest[0] === TPM_GENERATED_VALUE[0] &&
        attest[1] === TPM_GENERATED_VALUE[1] &&
        attest[2] === TPM_GENERATED_VALUE[2] &&
        attest[3] === TPM_GENERATED_VALUE[3]

      const partial: AttestResult = {
        operation,
        ak,
        attest,
        signature,
        pubkey,
        verifyResult: 'pending',
        hasGeneratedMagic,
      }
      setResult(partial)

      // Independent verification via OpenSSL WASM (drives openssl pkeyutl -verify).
      try {
        const pubkeyPem = pemSpkiFromRawMlDsa(pubkey, ak)
        const ok = await mldsaVerify(signature, attest, pubkeyPem)
        setResult({ ...partial, verifyResult: ok ? 'pass' : 'fail' })

        // If verify failed, try the bridge's last paramSet-cached pubkey
        // as a second pass. If THAT verifies, the bug is bridge cache
        // collision (TPM-stored AK_pub doesn't match the key softhsmv3
        // actually signed with). If that also fails, the bug is somewhere
        // in sig generation or message-bytes plumbing.
        if (!ok) {
          try {
            const { getBridgeMlDsaPubBytes } = await import('../../../wasm/pqcCryptoBridge')
            const paramSet = ak.label === 'ML-DSA-44' ? 1 : ak.label === 'ML-DSA-65' ? 2 : 3
            const bridgePub = getBridgeMlDsaPubBytes(paramSet)
            if (bridgePub && bridgePub.length === pubkey.length) {
              const bridgePem = pemSpkiFromRawMlDsa(bridgePub, ak)
              const retryOk = await mldsaVerify(signature, attest, bridgePem)
              if (retryOk) {
                console.warn(
                  '[Attestation] verify against TPM-stored AK_pub REJECTED but verify against ' +
                    'bridge paramSet=' +
                    paramSet +
                    ' cached pubkey PASSED — bridge cache collision regressed; ' +
                    'see pqcCryptoBridge.ts per-key handle path.'
                )
              }
            }
          } catch (diagErr) {
            console.warn('[Attestation] bridge-pub retry failed:', diagErr)
          }
        }
      } catch (verifyErr: unknown) {
        setResult({
          ...partial,
          verifyResult: 'fail',
          verifyError: verifyErr instanceof Error ? verifyErr.message : String(verifyErr),
        })
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }, [ak, operation, pcrSel, nonce, isWasmReady])

  const downloadBundle = () => {
    if (!result) return
    const bundle = {
      operation: result.operation,
      algorithm: result.ak.label,
      handle: `0x${result.ak.persistentHandle.toString(16)}`,
      pubkey_hex: toHex(result.pubkey),
      attest_hex: toHex(result.attest),
      signature_hex: toHex(result.signature),
      tpm_generated_value_present: result.hasGeneratedMagic,
      fips_sig_size_expected: result.ak.fipsSigSize,
      fips_pubkey_size_expected: result.ak.fipsPubKeySize,
    }
    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${result.operation}-${result.ak.label.toLowerCase()}-bundle.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <div className="flex items-start gap-3 mb-3">
          <Shield className="text-primary h-6 w-6 shrink-0 mt-1" />
          <div>
            <h2 className="text-xl font-bold mb-1">
              ML-DSA Attestation — Quote / Certify with in-browser verify
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Runs real <code>TPM2_Quote</code> (PCR attestation) or <code>TPM2_Certify</code>{' '}
              (object name attestation) against an ML-DSA-{'{44,65,87}'} restricted+sign AK
              provisioned in the WASM TPM. The returned <code>TPMS_ATTEST</code> + signature are
              verified by OpenSSL WASM (independent of the TPM signer). All bytes are real ML-DSA
              per FIPS 204 — no placeholders.
            </p>
          </div>
        </div>
        <div className="mt-2 text-xs px-3 py-2 rounded bg-status-warning/10 text-status-warning border border-status-warning/30">
          <strong>Educational.</strong> The AK is locally provisioned; the ephemeral EK cert issuer
          is not a real CA. This demonstrates the cryptographic plumbing, not a production trust
          chain.
        </div>
      </div>

      <div className="glass-panel p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
              Attestation Key
            </div>
            <div className="flex gap-2 mt-2">
              {MLDSA_AK_SPECS.map((spec) => (
                <Button
                  key={spec.label}
                  variant={ak.label === spec.label ? 'gradient' : 'outline'}
                  size="sm"
                  onClick={() => setAk(spec)}
                >
                  {spec.label}
                </Button>
              ))}
            </div>
            <div className="mt-1 text-xs text-muted-foreground font-mono">
              handle 0x{ak.persistentHandle.toString(16)} · pubkey {ak.fipsPubKeySize}B · sig{' '}
              {ak.fipsSigSize}B (FIPS 204)
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
              Operation
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                variant={operation === 'quote' ? 'gradient' : 'outline'}
                size="sm"
                onClick={() => setOperation('quote')}
              >
                TPM2_Quote
              </Button>
              <Button
                variant={operation === 'certify' ? 'gradient' : 'outline'}
                size="sm"
                onClick={() => setOperation('certify')}
              >
                TPM2_Certify
              </Button>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {operation === 'quote'
                ? 'attests a hash of selected PCRs (V1.85 Part 3 §18.4)'
                : 'attests the Name of an object (V1.85 Part 3 §18.2) — self-certify here'}
            </div>
          </div>
        </div>

        {operation === 'quote' && (
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
              PCR selection
            </div>
            <Input
              value={pcrSel}
              onChange={(e) => setPcrSel(e.target.value)}
              placeholder="sha256:0,1,2,3,7"
              className="mt-2"
            />
          </div>
        )}

        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
            Qualifying data (nonce, hex)
          </div>
          <Input
            value={nonce}
            onChange={(e) => setNonce(e.target.value)}
            placeholder="deadbeef…"
            className="mt-2 font-mono"
          />
        </div>

        <Button variant="gradient" onClick={run} disabled={!isWasmReady || busy}>
          <Play className="h-4 w-4 mr-2" />
          {busy ? 'Running…' : `Run ${operation === 'quote' ? 'Quote' : 'Certify'}`}
        </Button>
      </div>

      {error && (
        <div className="glass-panel p-5 border-l-4 border-l-status-error">
          <div className="flex items-start gap-2">
            <AlertCircle className="text-status-error h-5 w-5 mt-0.5" />
            <div className="font-mono text-sm text-status-error break-all">{error}</div>
          </div>
        </div>
      )}

      {result && (
        <div
          className={`glass-panel p-6 border-l-4 ${
            result.verifyResult === 'pass'
              ? 'border-l-status-success'
              : result.verifyResult === 'fail'
                ? 'border-l-status-error'
                : 'border-l-status-warning'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-lg font-bold">
                {result.operation === 'quote' ? 'TPM2_Quote' : 'TPM2_Certify'} · {result.ak.label}
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                attest {result.attest.length} B · sig {result.signature.length} B (FIPS expected{' '}
                {result.ak.fipsSigSize} B) · pubkey {result.pubkey.length} B
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={downloadBundle}>
              <Download className="h-4 w-4 mr-2" />
              JSON bundle
            </Button>
          </div>

          <div className="space-y-3">
            <ResultRow
              ok={result.verifyResult === 'pass'}
              warn={result.verifyResult === 'pending'}
              label="OpenSSL WASM verify"
              value={
                result.verifyResult === 'pass'
                  ? 'Signature Verified Successfully'
                  : result.verifyResult === 'fail'
                    ? `REJECTED${result.verifyError ? ': ' + result.verifyError : ''}`
                    : 'pending'
              }
            />
            <ResultRow
              ok={result.hasGeneratedMagic}
              label="TPM_GENERATED_VALUE prefix"
              value={
                result.hasGeneratedMagic
                  ? '0xFF 54 43 47 — confirms attest blob came from a TPM (V1.85 Part 1 §22.1.2)'
                  : 'missing — not a TPM-generated attestation'
              }
            />
            <ResultRow
              ok={result.signature.length === result.ak.fipsSigSize}
              label={`FIPS 204 sig size`}
              value={`got ${result.signature.length} B, expected ${result.ak.fipsSigSize} B`}
            />
          </div>

          <details className="mt-4">
            <summary className="cursor-pointer text-xs font-mono text-muted-foreground hover:text-foreground">
              show bytes ({result.attest.length} + {result.signature.length} +{' '}
              {result.pubkey.length})
            </summary>
            <div className="mt-3 space-y-3 font-mono text-xs">
              <HexBlock label="attest" bytes={result.attest} />
              <HexBlock label="signature" bytes={result.signature} />
              <HexBlock label="AK pubkey" bytes={result.pubkey} />
            </div>
          </details>
        </div>
      )}
    </div>
  )
}

function ResultRow({
  ok,
  warn,
  label,
  value,
}: {
  ok: boolean
  warn?: boolean
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2 text-xs font-mono">
      {ok ? (
        <CheckCircle2 className="text-status-success h-4 w-4 mt-0.5 shrink-0" />
      ) : warn ? (
        <AlertCircle className="text-status-warning h-4 w-4 mt-0.5 shrink-0" />
      ) : (
        <XCircle className="text-status-error h-4 w-4 mt-0.5 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-muted-foreground">{label}</div>
        <div className="text-foreground break-all">{value}</div>
      </div>
    </div>
  )
}

function HexBlock({ label, bytes }: { label: string; bytes: Uint8Array }) {
  const PREVIEW = 64
  const head = toHex(bytes.slice(0, PREVIEW), ' ')
  const tail = bytes.length > PREVIEW * 2 ? toHex(bytes.slice(-PREVIEW), ' ') : ''
  return (
    <div>
      <div className="text-muted-foreground mb-1">
        {label} ({bytes.length} B)
      </div>
      <div className="break-all">
        <span className="text-foreground">{head}</span>
        {tail && (
          <>
            <span className="text-muted-foreground"> … </span>
            <span className="text-foreground">{tail}</span>
          </>
        )}
      </div>
    </div>
  )
}
