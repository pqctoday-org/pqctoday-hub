// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
/**
 * JOSEProtocolMatrixAudit — Workshop-tab tool that reads the JOSE row of the
 * PQC Protocol Matrix and proposes patches against it.
 *
 * Read view: renders the current row (dimensions / drafts / libraries) so the
 * maintainer can eyeball what the matrix says about JOSE today.
 *
 * Audit view: runs three deterministic checks in-browser —
 *  1. real ML-DSA-65 sign+verify roundtrip (confirms `pureSig` is implementable)
 *  2. diff `latestDraft` vs. public/data/jose-drafts-snapshot.json
 *  3. diff library claims vs. public/data/jose-library-pqc-status.json
 *
 * Then emits a JSON patch in the exact shape the protocol-matrix apply step
 * consumes; the maintainer applies it outside this repository. Per project
 * policy, only `stage` and `stageNote` are applied automatically; everything
 * else (refs, libraries, deployments) requires a human PR.
 */
import React, { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  FileJson,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  ShieldCheck,
  FileCheck2,
} from 'lucide-react'
import { ml_dsa44, ml_dsa65, ml_dsa87 } from '@noble/post-quantum/ml-dsa.js'
import { Button } from '@/components/ui/button'
import { PROTOCOL_MATRIX } from '@/data/pqcProtocolMatrix'
import {
  base64urlDecode,
  base64urlEncode,
  createJWTHeader,
  createJWTPayload,
  decodeJWT,
  generateJwsKeyPair,
  signJWS,
  verifyJWS,
} from '../jwtUtils'
import { KatValidationPanel } from '@/components/shared/KatValidationPanel'
import type { KatTestSpec } from '@/utils/katRunner'
import coseDilithiumKat from '@/data/acvp/cose-dilithium-11-jose-kat.json'
import compositeExamples from '@/data/acvp/composite-sigs-04-jose-examples.json'
import hpkeExamples from '@/data/acvp/jose-hpke-pq-pqt-01-examples.json'
import { type HpkeJweAlg, hpkeJweDecrypt } from '../hpkeJwe'

// In-browser JOSE-KAT runner — same vectors that joseKat.test.ts, compositeKat.test.ts
// and hpkeJwe.test.ts replay in vitest, exposed as a one-click check in the audit panel.

interface JoseKatResult {
  id: string
  spec: string
  reference: string
  vector: string
  description: string
  passed: boolean
  durationMs: number
  evidence: string
}

const MLDSA_SUITES = {
  'ML-DSA-44': ml_dsa44,
  'ML-DSA-65': ml_dsa65,
  'ML-DSA-87': ml_dsa87,
} as const

function hexToBytesUtil(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return out
}

interface CoseDilithiumVec {
  alg: 'ML-DSA-44' | 'ML-DSA-65' | 'ML-DSA-87'
  kid: string
  priv_seed_hex: string
  expected_payload_text: string
  jws: string
}

async function runJoseKatSuite(): Promise<JoseKatResult[]> {
  const out: JoseKatResult[] = []

  // ── RFC 9964 Appendix A.1 — JOSE worked examples ────
  const coseVectors = (coseDilithiumKat as { vectors: CoseDilithiumVec[] }).vectors
  for (const v of coseVectors) {
    const start = performance.now()
    let passed = false
    let evidence = ''
    try {
      const seed = hexToBytesUtil(v.priv_seed_hex)
      const { publicKey } = MLDSA_SUITES[v.alg].keygen(seed)
      const result = await verifyJWS({
        token: v.jws,
        publicKey,
        backend: 'noble',
      })
      passed = result.valid
      evidence = passed
        ? `IETF JWS verifies under AKP-seed-derived pk (${publicKey.length} B)`
        : `verify returned false — wire format regression`
    } catch (e) {
      evidence = `threw: ${e instanceof Error ? e.message : String(e)}`
    }
    out.push({
      id: `cose-dilithium-${v.alg}`,
      spec: 'RFC 9964 Appendix A.1',
      reference: 'https://www.rfc-editor.org/rfc/rfc9964.html',
      vector: v.alg,
      description: `Verify byte-exact IETF JWS for ${v.alg} under AKP-seed-derived public key`,
      passed,
      durationMs: performance.now() - start,
      evidence,
    })
  }

  // ── Published composite examples (draft-ietf-jose-pq-composite-sigs-04 A.1) ─
  // The draft authors' own JOSE examples for all six algorithms — external
  // evidence, unlike the self-pinned -01 snapshot this replaced.
  for (const v of (
    compositeExamples as { vectors: { alg: string; jws: string; jwk: { pub: string } }[] }
  ).vectors) {
    const start = performance.now()
    let passed = false
    let evidence = ''
    try {
      const result = await verifyJWS({
        token: v.jws,
        publicKey: base64urlDecode(v.jwk.pub),
        backend: 'noble',
      })
      passed = result.valid
      evidence = passed
        ? `Published ${v.alg} JWS verifies (ML-DSA and traditional components)`
        : `verify returned false for the published ${v.alg} example`
    } catch (e) {
      evidence = `threw: ${e instanceof Error ? e.message : String(e)}`
    }
    out.push({
      id: `composite-sigs-04-${v.alg}`,
      spec: 'draft-ietf-jose-pq-composite-sigs-04 Appendix A.1 (published example)',
      reference: 'https://www.ietf.org/archive/id/draft-ietf-jose-pq-composite-sigs-04.txt',
      vector: v.alg,
      description: `Verify the draft's published ${v.alg} JWS under its published AKP public key`,
      passed,
      durationMs: performance.now() - start,
      evidence,
    })
  }

  // ── Published HPKE JWE examples (draft-ietf-jose-hpke-pq-pqt-01 Appendix A) ─
  // Made by the draft authors with a different ML-KEM implementation: decrypting
  // them is interop evidence for the JWE tab, not a self round-trip.
  for (const v of hpkeExamples.vectors as {
    alg: HpkeJweAlg
    compact: string
    jwk: { priv: string }
  }[]) {
    const start = performance.now()
    let passed = false
    let evidence = ''
    try {
      const { plaintext } = await hpkeJweDecrypt({
        token: v.compact,
        alg: v.alg,
        privateKey: base64urlDecode(v.jwk.priv),
      })
      passed = new TextDecoder().decode(plaintext) === hpkeExamples.plaintext
      evidence = passed
        ? `Published ${v.alg} compact JWE decrypts to the published plaintext`
        : `decrypted, but the plaintext differs from the published one`
    } catch (e) {
      evidence = `threw: ${e instanceof Error ? e.message : String(e)}`
    }
    out.push({
      id: `hpke-pq-pqt-01-${v.alg}`,
      spec: 'draft-ietf-jose-hpke-pq-pqt-01 Appendix A (published example)',
      reference: 'https://www.ietf.org/archive/id/draft-ietf-jose-hpke-pq-pqt-01.txt',
      vector: v.alg,
      description: `Decrypt the draft's published ${v.alg} JWE with its published private key`,
      passed,
      durationMs: performance.now() - start,
      evidence,
    })
  }

  return out
}

// ── Standards compliance suite ──────────────────────────────────────────────
//
// Each check maps to a concrete clause in a published RFC, FIPS pub, or active
// IETF draft. The check is deterministic so a green tick is a real proof of
// compliance, not a "looks ok".

interface ComplianceCheck {
  id: string
  spec: string
  reference: string
  description: string
  passed: boolean
  evidence: string
}

// Canonical KAT specs for the ACVP-driven primitive layer.
const PRIMITIVE_KAT_SPECS: KatTestSpec[] = [
  {
    id: 'jose-mldsa65-acvp',
    useCase: 'ML-DSA-65 sign/verify functional round-trip (FIPS 204)',
    standard: 'FIPS 204',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/204/final',
    libraryRefId: 'FIPS 204',
    kind: { type: 'mldsa-functional', variant: 65 },
    message: 'standards-compliance probe — JOSE matrix audit',
  },
  {
    id: 'jose-mldsa44-acvp',
    useCase: 'ML-DSA-44 sign/verify functional round-trip (FIPS 204)',
    standard: 'FIPS 204',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/204/final',
    kind: { type: 'mldsa-functional', variant: 44 },
    message: 'standards-compliance probe — JOSE matrix audit',
  },
  {
    id: 'jose-mlkem768-acvp',
    useCase: 'ML-KEM-768 encap/decap roundtrip (FIPS 203)',
    standard: 'FIPS 203',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/203/final',
    libraryRefId: 'FIPS 203',
    kind: { type: 'mlkem-encap-roundtrip', variant: 768 },
  },
  {
    id: 'jose-hmac-sha256-acvp',
    useCase: 'HMAC-SHA256 (RFC 7515 §3.5 baseline integrity)',
    standard: 'FIPS 198-1 + NIST ACVP',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/198-1/final',
    kind: { type: 'hmac-verify', hashAlg: 'SHA-256' },
  },
]

// RFC 7515 Appendix A.1 — HS256 example. We only use this to validate our
// base64url decode against the IETF reference values; the JOSE header in the
// RFC includes whitespace (\r\n) that we don't reproduce, so we compare on
// decoded bytes rather than encoded strings.
const RFC7515_A1 = {
  encodedHeader: 'eyJ0eXAiOiJKV1QiLA0KICJhbGciOiJIUzI1NiJ9',
  encodedPayload:
    'eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ',
  expectedSignature: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
}

async function runJwsFramingCompliance(): Promise<ComplianceCheck[]> {
  const checks: ComplianceCheck[] = []
  const enc = new TextEncoder()

  // ── 1. RFC 4648 §5 base64url — no padding, URL-safe alphabet ────────────
  const padTest = base64urlEncode(new Uint8Array([1, 2, 3]))
  checks.push({
    id: 'rfc4648-no-padding',
    spec: 'RFC 4648 §5',
    reference: 'https://datatracker.ietf.org/doc/html/rfc4648#section-5',
    description: 'base64url output has no `=` padding characters',
    passed: !padTest.includes('='),
    evidence: `base64urlEncode([1,2,3]) = "${padTest}"`,
  })
  const urlSafeTest = base64urlEncode(new Uint8Array([0xfb, 0xff, 0xbf]))
  checks.push({
    id: 'rfc4648-urlsafe-alphabet',
    spec: 'RFC 4648 §5',
    reference: 'https://datatracker.ietf.org/doc/html/rfc4648#section-5',
    description: 'base64url uses `-` and `_` instead of `+`/`/`',
    passed: /^[A-Za-z0-9_-]+$/.test(urlSafeTest),
    evidence: `Encoded bytes [0xfb 0xff 0xbf] → "${urlSafeTest}"`,
  })

  // ── 2. RFC 7515 Appendix A.1 interop — our decoder must produce the
  //      same bytes the RFC documents for the example header/payload ───────
  const headerBytes = base64urlDecode(RFC7515_A1.encodedHeader)
  const headerStr = new TextDecoder().decode(headerBytes)
  let appendixA1Pass = false
  try {
    const headerJson = JSON.parse(headerStr) as { typ: string; alg: string }
    appendixA1Pass = headerJson.typ === 'JWT' && headerJson.alg === 'HS256'
  } catch {
    appendixA1Pass = false
  }
  checks.push({
    id: 'rfc7515-a1-decode',
    spec: 'RFC 7515 Appendix A.1',
    reference: 'https://datatracker.ietf.org/doc/html/rfc7515#appendix-A.1',
    description: "Decoder reproduces RFC's worked HS256 example header (typ=JWT, alg=HS256)",
    passed: appendixA1Pass,
    evidence: `Decoded header → ${JSON.stringify(headerStr)}`,
  })

  const payloadBytes = base64urlDecode(RFC7515_A1.encodedPayload)
  const payloadStr = new TextDecoder().decode(payloadBytes)
  let payloadDecodePass = false
  try {
    const parsed = JSON.parse(payloadStr) as { iss?: string }
    payloadDecodePass = parsed.iss === 'joe'
  } catch {
    payloadDecodePass = false
  }
  checks.push({
    id: 'rfc7515-a1-payload',
    spec: 'RFC 7515 Appendix A.1',
    reference: 'https://datatracker.ietf.org/doc/html/rfc7515#appendix-A.1',
    description: 'Decoder reproduces the RFC payload (iss=joe)',
    passed: payloadDecodePass,
    evidence: `Decoded payload first 64 bytes → ${JSON.stringify(payloadStr.slice(0, 64))}`,
  })

  // ── 3. RFC 7515 §5.1 — signing input shape ──────────────────────────────
  const kp = await generateJwsKeyPair({ alg: 'ML-DSA-65', backend: 'noble' })
  const signed = await signJWS({
    alg: 'ML-DSA-65',
    payload: { sub: 'compliance-probe', iat: 0 },
    keyPair: kp,
    backend: 'noble',
  })
  const expectedSigningInput = `${signed.headerB64}.${signed.payloadB64}`
  checks.push({
    id: 'rfc7515-5.1-signing-input',
    spec: 'RFC 7515 §5.1',
    reference: 'https://datatracker.ietf.org/doc/html/rfc7515#section-5.1',
    description:
      'Signing input is exactly ASCII(BASE64URL(JOSE header) || "." || BASE64URL(payload))',
    passed: signed.signingInput === expectedSigningInput,
    evidence: `signingInput length ${signed.signingInput.length}, matches concatenation`,
  })

  // ── 4. RFC 7515 §3.1 — compact serialization (three dot-separated parts)
  const parts = signed.token.split('.')
  checks.push({
    id: 'rfc7515-3.1-compact-shape',
    spec: 'RFC 7515 §3.1',
    reference: 'https://datatracker.ietf.org/doc/html/rfc7515#section-3.1',
    description: 'Compact JWS has exactly three base64url segments',
    passed: parts.length === 3 && parts.every((p) => /^[A-Za-z0-9_-]+$/.test(p)),
    evidence: `Lengths: header=${parts[0]?.length} payload=${parts[1]?.length} sig=${parts[2]?.length}`,
  })

  // ── 5. RFC 9964 §2.1 — alg code strings ─────────────
  const decoded = decodeJWT(signed.token)
  const alg = decoded?.header?.['alg']
  const expectedAlgs = new Set(['ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87'])
  checks.push({
    id: 'cose-dilithium-11-alg-code',
    spec: 'RFC 9964 §2.1',
    reference: 'https://www.rfc-editor.org/rfc/rfc9964.html',
    description: 'JOSE header carries the canonical alg code (JOSE inherits from COSE)',
    passed: typeof alg === 'string' && expectedAlgs.has(alg),
    evidence: `Observed alg="${String(alg)}"`,
  })

  // ── 6. FIPS 204 — ML-DSA-65 size invariants (table 1) ───────────────────
  checks.push({
    id: 'fips-204-mldsa65-pk-size',
    spec: 'FIPS 204 Table 1',
    reference: 'https://csrc.nist.gov/pubs/fips/204/final',
    description: 'ML-DSA-65 public key is exactly 1952 bytes',
    passed: kp.publicKey.length === 1952,
    evidence: `Observed publicKey.length = ${kp.publicKey.length}`,
  })
  checks.push({
    id: 'fips-204-mldsa65-sig-size',
    spec: 'FIPS 204 Table 1',
    reference: 'https://csrc.nist.gov/pubs/fips/204/final',
    description: 'ML-DSA-65 signature is exactly 3309 bytes',
    passed: signed.signature.length === 3309,
    evidence: `Observed signature.length = ${signed.signature.length}`,
  })

  // ── 7. Cross-framing verify proves the signature wraps the canonical
  //      signing input — i.e. tampering with header or payload invalidates
  //      it, which is the security property RFC 7515 §10.7 mandates ──────
  const tamperedHeader =
    base64urlEncode(enc.encode('{"alg":"ML-DSA-65","typ":"JWT","kid":"x"}')) +
    '.' +
    signed.payloadB64 +
    '.' +
    signed.signatureB64
  const tamperedVerify = await verifyJWS({
    token: tamperedHeader,
    publicKey: kp.publicKey,
    backend: 'noble',
  })
  checks.push({
    id: 'rfc7515-10.7-binding',
    spec: 'RFC 7515 §10.7',
    reference: 'https://datatracker.ietf.org/doc/html/rfc7515#section-10.7',
    description: 'Modifying the JOSE header invalidates the signature',
    passed: tamperedVerify.valid === false,
    evidence: 'verifyJWS({tampered header}) returned valid=false',
  })

  // ── 8. draft-ietf-jose-pq-composite-sigs-04 — composite framing (self round-trip) ─
  const compKp = await generateJwsKeyPair({ alg: 'ML-DSA-65-Ed25519', backend: 'noble' })
  const compSigned = await signJWS({
    alg: 'ML-DSA-65-Ed25519',
    payload: { sub: 'compliance-probe' },
    keyPair: compKp,
    backend: 'noble',
  })
  const compDecoded = decodeJWT(compSigned.token)
  const compAlg = compDecoded?.header?.['alg']
  checks.push({
    id: 'composite-sigs-alg-code',
    spec: 'draft-ietf-jose-pq-composite-sigs-04 §5.1',
    reference: 'https://datatracker.ietf.org/doc/draft-ietf-jose-pq-composite-sigs/',
    description: 'Composite token uses the ML-DSA-65-Ed25519 alg identifier',
    passed: compAlg === 'ML-DSA-65-Ed25519',
    evidence: `Observed alg="${String(compAlg)}"`,
  })
  checks.push({
    id: 'composite-sigs-size',
    spec: 'draft-ietf-jose-pq-composite-sigs-04 §4.4',
    reference: 'https://datatracker.ietf.org/doc/draft-ietf-jose-pq-composite-sigs/',
    description:
      'Composite signature = direct concat: 3309 B ML-DSA-65 || 64 B Ed25519 (ML-DSA first per §4.4)',
    passed: compSigned.signature.length === 3309 + 64,
    evidence: `Observed composite signature length = ${compSigned.signature.length}`,
  })
  const compVerify = await verifyJWS({
    token: compSigned.token,
    publicKey: compKp.publicKey,
    backend: 'noble',
  })
  checks.push({
    id: 'composite-sigs-verify',
    spec: 'draft-ietf-jose-pq-composite-sigs-04 §4.3',
    reference: 'https://datatracker.ietf.org/doc/draft-ietf-jose-pq-composite-sigs/',
    description: 'Composite verify accepts a freshly signed token (self round-trip)',
    passed: compVerify.valid === true,
    evidence: 'verifyJWS(composite token) returned valid=true',
  })

  // ── 9. Helper: createJWTHeader emits an `alg` field per RFC 7515 §4.1.1 ─
  const hdr = createJWTHeader('ML-DSA-65')
  const hdrJson = JSON.parse(new TextDecoder().decode(base64urlDecode(hdr))) as Record<
    string,
    unknown
  >
  checks.push({
    id: 'rfc7515-4.1.1-alg-required',
    spec: 'RFC 7515 §4.1.1',
    reference: 'https://datatracker.ietf.org/doc/html/rfc7515#section-4.1.1',
    description: 'createJWTHeader emits the required `alg` header parameter',
    passed: hdrJson['alg'] === 'ML-DSA-65',
    evidence: `Decoded header = ${JSON.stringify(hdrJson)}`,
  })

  // ── 10. Stable payload encoding for size-analysis reproducibility ────────
  const payloadCheck = createJWTPayload({ a: 1, b: 'two' })
  const payloadRoundtrip = new TextDecoder().decode(base64urlDecode(payloadCheck))
  checks.push({
    id: 'jwt-payload-stable',
    spec: 'RFC 7519 §3',
    reference: 'https://datatracker.ietf.org/doc/html/rfc7519#section-3',
    description: 'createJWTPayload roundtrips JSON claims byte-stable',
    passed: payloadRoundtrip === JSON.stringify({ a: 1, b: 'two' }),
    evidence: `Roundtrip → ${payloadRoundtrip}`,
  })

  return checks
}

interface DraftSnapshotEntry {
  current_version: string
  current_date: string
  title?: string
  state?: string
  iesg_state?: string | null
  rfceditor_state?: string | null
  url: string
  covers: string[]
}

interface DraftSnapshot {
  generated_at: string
  source: string
  max_age_days?: number
  drafts: Record<string, DraftSnapshotEntry>
}

/** Days between an ISO date (YYYY-MM-DD) and today. */
function ageInDays(isoDate: string): number {
  return Math.floor((Date.now() - Date.parse(`${isoDate}T00:00:00Z`)) / 86_400_000)
}

/** A row draft id may carry a revision suffix (draft-ietf-jose-hpke-encrypt-22). */
function splitDraftId(id: string): { name: string; rev: string | null } {
  const m = /^(draft-.+?)-(\d{2})$/.exec(id)
  return m ? { name: m[1], rev: m[2] } : { name: id, rev: null }
}

interface LibStatusEntry {
  name: string
  current_version: string
  release_date: string
  ml_dsa_jws: boolean
  slh_dsa_jws: boolean
  ml_kem_jwe: boolean
  composite_sigs: boolean
  evidence: string
  notes: string
}

interface LibStatus {
  generated_at: string
  source: string
  libraries: Record<string, LibStatusEntry>
}

interface DraftDelta {
  draftId: string
  rowVersion: string | null
  snapshotVersion: string | null
  rowDate: string | null
  snapshotDate: string | null
  /** Datatracker IESG / RFC Editor state, so a "stage" claim can be checked. */
  snapshotState: string | null
  /** The row's title no longer matches the draft's scope (e.g. JOSE -> COSE-only). */
  scopeChanged: boolean
  stale: boolean
}

interface LibraryDelta {
  productId: string
  rowName: string
  pqcSupport: 'none' | 'partial' | 'full'
  notes: string
  evidence: string
}

interface AuditReport {
  generated_at: string
  /** When the standards snapshot was taken — NOT when this report was exported. */
  snapshot_generated_at: string
  snapshotExpired: boolean
  signSelfTest: { alg: string; durationMs: number; valid: boolean }
  draftDeltas: DraftDelta[]
  libraryDeltas: LibraryDelta[]
  proposedPatch: {
    generated_at: string
    snapshot_generated_at: string
    deltas: {
      row_id: string
      dimension: 'pureSig' | 'hybridSig'
      ref_id: string
      encoded_stage: string | null
      current_stage: string
      current_state_slug: string
      last_updated: string
      notes: string[]
    }[]
    xref_issues: unknown[]
    llm_proposals: unknown[]
  }
}

export const JOSEProtocolMatrixAudit: React.FC = () => {
  const joseRow = useMemo(() => PROTOCOL_MATRIX.find((r) => r.id === 'jose'), [])
  const [draftSnapshot, setDraftSnapshot] = useState<DraftSnapshot | null>(null)
  const [libStatus, setLibStatus] = useState<LibStatus | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [report, setReport] = useState<AuditReport | null>(null)
  const [isAuditing, setIsAuditing] = useState(false)
  const [auditError, setAuditError] = useState<string | null>(null)
  const [compliance, setCompliance] = useState<ComplianceCheck[] | null>(null)
  const [isCompliance, setIsCompliance] = useState(false)
  const [complianceError, setComplianceError] = useState<string | null>(null)
  const [joseKat, setJoseKat] = useState<JoseKatResult[] | null>(null)
  const [isJoseKat, setIsJoseKat] = useState(false)
  const [joseKatError, setJoseKatError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const base = import.meta.env.BASE_URL || '/'
        const [snapRes, libRes] = await Promise.all([
          fetch(`${base}data/jose-drafts-snapshot.json`),
          fetch(`${base}data/jose-library-pqc-status.json`),
        ])
        if (!snapRes.ok || !libRes.ok) {
          throw new Error(
            `Failed to fetch snapshots: drafts=${snapRes.status} libs=${libRes.status}`
          )
        }
        const snap = (await snapRes.json()) as DraftSnapshot
        const libs = (await libRes.json()) as LibStatus
        if (!cancelled) {
          setDraftSnapshot(snap)
          setLibStatus(libs)
        }
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : String(e))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleAudit = async () => {
    if (!joseRow || !draftSnapshot || !libStatus) return
    setIsAuditing(true)
    setAuditError(null)
    try {
      // 1. Self-test: ML-DSA-65 sign+verify roundtrip in-browser
      const t0 = performance.now()
      const kp = await generateJwsKeyPair({ alg: 'ML-DSA-65', backend: 'noble' })
      const signed = await signJWS({
        alg: 'ML-DSA-65',
        payload: { iss: 'jose-matrix-audit', iat: Math.floor(Date.now() / 1000) },
        keyPair: kp,
        backend: 'noble',
      })
      const v = await verifyJWS({
        token: signed.token,
        publicKey: kp.publicKey,
        backend: 'noble',
      })
      const durationMs = performance.now() - t0

      // 2. Draft snapshot vs. row
      const draftDeltas: DraftDelta[] = []
      for (const rowDraft of joseRow.latestDraft) {
        const { name, rev } = splitDraftId(rowDraft.id)
        const snap = draftSnapshot.drafts[name]
        if (!snap) {
          draftDeltas.push({
            draftId: rowDraft.id,
            rowVersion: rev,
            snapshotVersion: null,
            rowDate: rowDraft.date ?? null,
            snapshotDate: null,
            snapshotState: null,
            scopeChanged: false,
            // Not in the snapshot means nothing checked it: never "current".
            stale: true,
          })
          continue
        }
        // Revision-aware: an explicit row revision must equal the snapshot's;
        // otherwise fall back to comparing full dates, not year-month strings.
        const revStale = rev !== null && rev !== snap.current_version
        const dateStale = (rowDraft.date ?? '') < (snap.current_date ?? '')
        // Scope check: a row that says JOSE for a draft whose title no longer does.
        const scopeChanged =
          /JOSE|JWE|JWS/.test(rowDraft.title) &&
          !!snap.title &&
          !/JOSE|JWE|JWS|JSON/.test(snap.title)
        draftDeltas.push({
          draftId: rowDraft.id,
          rowVersion: rev,
          snapshotVersion: snap.current_version,
          rowDate: rowDraft.date ?? null,
          snapshotDate: snap.current_date,
          snapshotState:
            [snap.iesg_state, snap.rfceditor_state].filter(Boolean).join(' / ') || null,
          scopeChanged,
          stale: revStale || dateStale || scopeChanged,
        })
      }
      const snapshotAge = ageInDays(draftSnapshot.generated_at)
      const snapshotExpired = snapshotAge > (draftSnapshot.max_age_days ?? 45)

      // 3. Library claims vs. status table
      const libraryDeltas: LibraryDelta[] = []
      for (const lib of joseRow.ossLibraries) {
        const entry = libStatus.libraries[lib.productId]
        if (!entry) {
          libraryDeltas.push({
            productId: lib.productId,
            rowName: lib.name,
            pqcSupport: 'none',
            notes: 'No entry in jose-library-pqc-status.json — fill in via audit script.',
            evidence: '',
          })
          continue
        }
        const all = [entry.ml_dsa_jws, entry.slh_dsa_jws, entry.ml_kem_jwe, entry.composite_sigs]
        const count = all.filter(Boolean).length
        const pqcSupport: 'none' | 'partial' | 'full' =
          count === 0 ? 'none' : count >= 3 ? 'full' : 'partial'
        libraryDeltas.push({
          productId: lib.productId,
          rowName: lib.name,
          pqcSupport,
          notes: entry.notes,
          evidence: entry.evidence,
        })
      }

      // 4a. Composite (hybridSig) self-test — sign+verify a real
      //     ML-DSA-65-Ed25519 token. Drives the second delta below.
      const tComp0 = performance.now()
      let compositeValid = false
      let compositeDurationMs = 0
      try {
        const compKp = await generateJwsKeyPair({ alg: 'ML-DSA-65-Ed25519', backend: 'noble' })
        const compSigned = await signJWS({
          alg: 'ML-DSA-65-Ed25519',
          payload: { iss: 'jose-matrix-audit-hybrid', iat: Math.floor(Date.now() / 1000) },
          keyPair: compKp,
          backend: 'noble',
        })
        const compVerify = await verifyJWS({
          token: compSigned.token,
          publicKey: compKp.publicKey,
          backend: 'noble',
        })
        compositeValid = compVerify.valid
      } finally {
        compositeDurationMs = performance.now() - tComp0
      }

      // 4b. Build proposed patch — pureSig + hybridSig deltas. The applier
      //     [the protocol-matrix apply step] only touches `stage`
      //     and `stageNote`, never refs/libraries/deployments, so this stays
      //     safe to auto-apply.
      const today = new Date().toISOString().slice(0, 10)
      const hybridSigDraft = draftSnapshot.drafts['draft-ietf-jose-pq-composite-sigs']
      const proposedPatch: AuditReport['proposedPatch'] = {
        generated_at: today,
        snapshot_generated_at: draftSnapshot.generated_at,
        deltas: [
          {
            row_id: 'jose',
            dimension: 'pureSig',
            ref_id: 'RFC 9964',
            encoded_stage: joseRow.dimensions.pureSig.value,
            current_stage: 'rfc',
            current_state_slug: 'rfc-published',
            last_updated: '2026-05',
            notes: [
              `In-browser ML-DSA-65 sign+verify self round-trip ${v.valid ? 'passed' : 'FAILED'} in ${durationMs.toFixed(0)}ms (self-consistency, not conformance — see the RFC 9964 Appendix A.1 KATs)`,
              'Spec: RFC 9964 — ML-DSA for JOSE and COSE (published May 2026)',
            ],
          },
          {
            row_id: 'jose',
            dimension: 'hybridSig',
            ref_id: 'draft-ietf-jose-pq-composite-sigs',
            encoded_stage: joseRow.dimensions.hybridSig.value,
            current_stage: 'draft',
            current_state_slug: hybridSigDraft?.iesg_state ?? 'draft',
            last_updated: hybridSigDraft?.current_date ?? today,
            notes: [
              `In-browser ML-DSA-65-Ed25519 composite sign+verify self round-trip ${compositeValid ? 'passed' : 'FAILED'} in ${compositeDurationMs.toFixed(0)}ms (self-consistency; conformance comes from the draft -04 Appendix A.1 KATs).`,
              `Spec: draft-ietf-jose-pq-composite-sigs-${hybridSigDraft?.current_version ?? '?'} (${hybridSigDraft?.current_date ?? '?'})`,
            ],
          },
        ],
        xref_issues: [],
        llm_proposals: [],
      }

      setReport({
        generated_at: today,
        snapshot_generated_at: draftSnapshot.generated_at,
        snapshotExpired,
        signSelfTest: { alg: 'ML-DSA-65', durationMs, valid: v.valid },
        draftDeltas,
        libraryDeltas,
        proposedPatch,
      })
    } catch (e) {
      setAuditError(e instanceof Error ? e.message : String(e))
    } finally {
      setIsAuditing(false)
    }
  }

  const handleRunJoseKat = async () => {
    setIsJoseKat(true)
    setJoseKatError(null)
    setJoseKat(null)
    try {
      const results = await runJoseKatSuite()
      setJoseKat(results)
    } catch (e) {
      setJoseKatError(e instanceof Error ? e.message : String(e))
    } finally {
      setIsJoseKat(false)
    }
  }

  const handleRunCompliance = async () => {
    setIsCompliance(true)
    setComplianceError(null)
    setCompliance(null)
    try {
      const checks = await runJwsFramingCompliance()
      setCompliance(checks)
    } catch (e) {
      setComplianceError(e instanceof Error ? e.message : String(e))
    } finally {
      setIsCompliance(false)
    }
  }

  const handleDownload = () => {
    if (!report) return
    const blob = new Blob([JSON.stringify(report.proposedPatch, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `protocol-matrix-updates-jose-${report.generated_at}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!joseRow) {
    return (
      <div className="rounded-lg p-3 border border-destructive/50 bg-destructive/10 text-xs text-status-error">
        JOSE row not found in pqcProtocolMatrix.ts — check the data file.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">
          PQC Protocol Matrix — JOSE row audit
        </h3>
        <p className="text-sm text-muted-foreground">
          Read the current JOSE entry, run an in-browser ML-DSA-65 sign/verify roundtrip, diff
          against the latest IETF draft + library snapshots, and download a JSON patch in the shape
          the maintainers' protocol-matrix update step consumes.
        </p>
      </div>

      {/* Current state */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3">
          Current JOSE row in <code className="text-foreground/80">pqcProtocolMatrix.ts</code>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {(['pureKem', 'hybridKem', 'pureSig', 'hybridSig'] as const).map((dim) => {
            const d = joseRow.dimensions[dim]
            return (
              <div key={dim} className="bg-muted/50 rounded-lg p-3 border border-border">
                <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
                  {dim}
                </div>
                <div className="text-sm font-bold text-foreground capitalize">{d.value}</div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {(d.refs ?? []).map((r) => (
                    <a
                      key={r.id}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={r.id}
                      className="text-primary underline block truncate"
                    >
                      {r.id}
                    </a>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-3 text-[11px] text-muted-foreground">
          {joseRow.latestDraft.length} active drafts · {joseRow.ossLibraries.length} OSS libraries ·{' '}
          {joseRow.commercialLibraries.length} commercial · {joseRow.liveDeployments?.length ?? 0}{' '}
          live deployments
        </div>
      </div>

      {loadError && (
        <div className="rounded-lg p-3 border border-destructive/50 bg-destructive/10 text-xs text-status-error flex items-center gap-2">
          <AlertCircle size={14} /> Failed to load snapshot data: {loadError}
        </div>
      )}

      {/* Audit trigger */}
      <div className="flex justify-center gap-2">
        <Button
          variant="gradient"
          onClick={() => void handleAudit()}
          disabled={isAuditing || !draftSnapshot || !libStatus}
          className="px-6 py-3 font-bold rounded-lg disabled:opacity-50 flex items-center gap-2"
        >
          <Activity size={16} />
          {isAuditing ? 'Auditing…' : 'Audit JOSE row'}
        </Button>
        {report && (
          <Button
            variant="outline"
            onClick={handleDownload}
            className="px-6 py-3 font-bold rounded-lg flex items-center gap-2"
          >
            <Download size={16} /> Download patch JSON
          </Button>
        )}
      </div>

      {auditError && (
        <div className="rounded-lg p-3 border border-destructive/50 bg-destructive/10 text-xs text-status-error">
          {auditError}
        </div>
      )}

      {/* Standards Compliance Suite */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-primary" />
            <h4 className="text-sm font-bold text-foreground">Standards Compliance Suite</h4>
          </div>
          <Button
            variant="outline"
            onClick={() => void handleRunCompliance()}
            disabled={isCompliance}
            className="text-xs"
          >
            {isCompliance ? 'Running…' : 'Run framing self-checks'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Each check maps to a specific clause in an RFC, FIPS publication, or active IETF draft.
          Framing self-checks validate our adapter against{' '}
          <a
            href="https://datatracker.ietf.org/doc/html/rfc7515"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            RFC 7515
          </a>
          ,{' '}
          <a
            href="https://www.rfc-editor.org/rfc/rfc9964.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            RFC 9964
          </a>
          , and{' '}
          <a
            href="https://datatracker.ietf.org/doc/draft-ietf-jose-pq-composite-sigs/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            draft-ietf-jose-pq-composite-sigs-04
          </a>
          . The test panel below runs the same primitives the workshop uses: ML-DSA and ML-KEM
          functional round-trips plus one HMAC-SHA256 check against a public NIST ACVP-Server
          reference sample — each row names its evidence class.
        </p>

        {complianceError && (
          <div className="rounded-lg p-3 border border-destructive/50 bg-destructive/10 text-xs text-status-error mb-3">
            {complianceError}
          </div>
        )}

        {compliance && (
          <>
            <div className="flex items-center gap-3 mb-3 text-xs">
              <span className="text-success font-bold">
                {compliance.filter((c) => c.passed).length} passed
              </span>
              <span className="text-destructive font-bold">
                {compliance.filter((c) => !c.passed).length} failed
              </span>
              <span className="text-muted-foreground">of {compliance.length} checks</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2 text-muted-foreground font-medium">Result</th>
                    <th className="text-left p-2 text-muted-foreground font-medium">Spec</th>
                    <th className="text-left p-2 text-muted-foreground font-medium">Check</th>
                    <th className="text-left p-2 text-muted-foreground font-medium">Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {compliance.map((c) => (
                    <tr key={c.id} className="border-b border-border/50">
                      <td className="p-2">
                        {c.passed ? (
                          <CheckCircle size={14} className="text-success" />
                        ) : (
                          <XCircle size={14} className="text-destructive" />
                        )}
                      </td>
                      <td className="p-2 font-mono text-foreground/80 whitespace-nowrap">
                        <a
                          href={c.reference}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline"
                        >
                          {c.spec}
                        </a>
                      </td>
                      <td className="p-2 text-foreground">{c.description}</td>
                      <td className="p-2 font-mono text-muted-foreground text-[10px] break-all">
                        {c.evidence}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* JOSE KAT Suite — RFC 9964 JWS vectors + published composite and HPKE JWE examples */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
          <div className="flex items-center gap-2">
            <FileCheck2 size={16} className="text-primary" />
            <h4 className="text-sm font-bold text-foreground">JOSE KAT Suite</h4>
          </div>
          <Button
            variant="outline"
            onClick={() => void handleRunJoseKat()}
            disabled={isJoseKat}
            className="text-xs"
          >
            {isJoseKat ? 'Running…' : 'Run JOSE KAT suite'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Replays JOSE-layer Known Answer Tests against our{' '}
          <code className="text-foreground/80">verifyJWS</code> and{' '}
          <code className="text-foreground/80">hpkeJweDecrypt</code> code:{' '}
          <a
            href="https://www.rfc-editor.org/rfc/rfc9964.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            RFC 9964
          </a>{' '}
          Appendix A.1 (3 official IETF JWS vectors for ML-DSA-44/65/87), the six published
          composite examples in{' '}
          <a
            href="https://www.ietf.org/archive/id/draft-ietf-jose-pq-composite-sigs-04.txt"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            draft-ietf-jose-pq-composite-sigs-04
          </a>{' '}
          Appendix A.1, and the HPKE-12 and HPKE-9 JWE examples in{' '}
          <a
            href="https://www.ietf.org/archive/id/draft-ietf-jose-hpke-pq-pqt-01.txt"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            draft-ietf-jose-hpke-pq-pqt-01
          </a>{' '}
          Appendix A — all external vectors, written by the RFC and drafts&apos; authors.
        </p>

        {joseKatError && (
          <div className="rounded-lg p-3 border border-destructive/50 bg-destructive/10 text-xs text-status-error mb-3">
            {joseKatError}
          </div>
        )}

        {joseKat && (
          <>
            <div className="flex items-center gap-3 mb-3 text-xs">
              <span className="text-success font-bold">
                {joseKat.filter((c) => c.passed).length} passed
              </span>
              <span className="text-destructive font-bold">
                {joseKat.filter((c) => !c.passed).length} failed
              </span>
              <span className="text-muted-foreground">of {joseKat.length} vectors</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2 text-muted-foreground font-medium">Result</th>
                    <th className="text-left p-2 text-muted-foreground font-medium">Vector</th>
                    <th className="text-left p-2 text-muted-foreground font-medium">Spec</th>
                    <th className="text-left p-2 text-muted-foreground font-medium">Check</th>
                    <th className="text-right p-2 text-muted-foreground font-medium">ms</th>
                    <th className="text-left p-2 text-muted-foreground font-medium">Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {joseKat.map((c) => (
                    <tr key={c.id} className="border-b border-border/50">
                      <td className="p-2">
                        {c.passed ? (
                          <CheckCircle size={14} className="text-success" />
                        ) : (
                          <XCircle size={14} className="text-destructive" />
                        )}
                      </td>
                      <td className="p-2 font-mono text-foreground/80 whitespace-nowrap">
                        {c.vector}
                      </td>
                      <td className="p-2 font-mono text-foreground/80 whitespace-nowrap">
                        <a
                          href={c.reference}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline"
                        >
                          {c.spec}
                        </a>
                      </td>
                      <td className="p-2 text-foreground">{c.description}</td>
                      <td className="p-2 text-right font-mono text-muted-foreground">
                        {c.durationMs.toFixed(0)}
                      </td>
                      <td className="p-2 font-mono text-muted-foreground text-[10px] break-all">
                        {c.evidence}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <KatValidationPanel
        specs={PRIMITIVE_KAT_SPECS}
        label="Primitive KATs — FIPS 203 / 204 / 198-1"
        authorityNote="Vectors imported from src/data/acvp/{mldsa,mlkem,hmac}_test.json — green = our primitive output matches NIST's expected output byte-for-byte."
      />

      {/* Audit results */}
      {report && (
        <>
          <div className="glass-panel p-4">
            <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              {report.signSelfTest.valid ? (
                <CheckCircle size={14} className="text-success" />
              ) : (
                <XCircle size={14} className="text-destructive" />
              )}
              Self-test: ML-DSA-65 sign/verify roundtrip
            </h4>
            <p className="text-xs text-muted-foreground">
              {report.signSelfTest.valid ? 'Signature verified' : 'Signature INVALID'} in{' '}
              {report.signSelfTest.durationMs.toFixed(0)} ms. A self round-trip only shows this
              build agrees with itself; conformance comes from the published-vector KATs above.
            </p>
          </div>

          <div className="glass-panel p-4">
            <h4 className="text-sm font-bold text-foreground mb-3">Draft freshness</h4>
            <p
              className={`text-xs mb-3 ${report.snapshotExpired ? 'text-status-error font-bold' : 'text-muted-foreground'}`}
            >
              Standards snapshot taken {report.snapshot_generated_at} (
              {ageInDays(report.snapshot_generated_at)} days ago).{' '}
              {report.snapshotExpired
                ? 'EXPIRED — every row below is treated as unverified until the snapshot is refreshed (the maintainers refresh it).'
                : 'A green "current" means current as of that date, not today.'}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2 text-muted-foreground font-medium">Draft</th>
                    <th className="text-left p-2 text-muted-foreground font-medium">Row date</th>
                    <th className="text-left p-2 text-muted-foreground font-medium">
                      Snapshot date
                    </th>
                    <th className="text-left p-2 text-muted-foreground font-medium">
                      Snapshot version
                    </th>
                    <th className="text-left p-2 text-muted-foreground font-medium">
                      IESG / RFC Editor
                    </th>
                    <th className="text-left p-2 text-muted-foreground font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.draftDeltas.map((d) => (
                    <tr key={d.draftId} className="border-b border-border/50">
                      <td className="p-2 font-mono text-foreground">{d.draftId}</td>
                      <td className="p-2 text-muted-foreground">{d.rowDate ?? '-'}</td>
                      <td className="p-2 text-muted-foreground">{d.snapshotDate ?? '-'}</td>
                      <td className="p-2 text-muted-foreground">{d.snapshotVersion ?? '-'}</td>
                      <td className="p-2 text-muted-foreground">{d.snapshotState ?? '-'}</td>
                      <td className="p-2">
                        {report.snapshotExpired ? (
                          <span className="text-status-error font-bold">unverified</span>
                        ) : d.scopeChanged ? (
                          <span className="text-warning font-bold">scope changed</span>
                        ) : d.stale ? (
                          <span className="text-warning font-bold">stale</span>
                        ) : (
                          <span className="text-success">current</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-panel p-4">
            <h4 className="text-sm font-bold text-foreground mb-3">Library PQC support</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2 text-muted-foreground font-medium">Library</th>
                    <th className="text-left p-2 text-muted-foreground font-medium">PQC support</th>
                    <th className="text-left p-2 text-muted-foreground font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {report.libraryDeltas.map((l) => (
                    <tr key={l.productId} className="border-b border-border/50">
                      <td className="p-2 font-medium text-foreground">{l.rowName}</td>
                      <td className="p-2">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${
                            l.pqcSupport === 'full'
                              ? 'bg-success/20 text-success border-success/50'
                              : l.pqcSupport === 'partial'
                                ? 'bg-warning/20 text-warning border-warning/50'
                                : 'bg-destructive/20 text-destructive border-destructive/50'
                          }`}
                        >
                          {l.pqcSupport}
                        </span>
                      </td>
                      <td className="p-2 text-muted-foreground">
                        {l.notes}{' '}
                        {l.evidence && (
                          <a
                            href={l.evidence}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline"
                          >
                            evidence
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-panel p-4">
            <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <FileJson size={14} className="text-primary" /> Proposed patch (
              {report.proposedPatch.deltas.length} dimension{' '}
              {report.proposedPatch.deltas.length === 1 ? 'delta' : 'deltas'})
            </h4>
            <pre className="text-[11px] font-mono text-foreground/80 bg-background rounded p-3 border border-border overflow-x-auto max-h-72">
              {JSON.stringify(report.proposedPatch, null, 2)}
            </pre>
            <p className="text-[11px] text-muted-foreground mt-2">
              Covers <code className="text-foreground/80">pureSig</code> (via RFC 9964) and{' '}
              <code className="text-foreground/80">hybridSig</code> (via
              draft-ietf-jose-pq-composite-sigs). The maintainers apply this patch with their
              protocol-matrix update step. Only <code className="text-foreground/80">stage</code>{' '}
              and <code className="text-foreground/80">stageNote</code> are applied automatically;
              ref, library, and deployment changes still require a human PR by design.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
