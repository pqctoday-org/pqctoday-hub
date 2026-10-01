// SPDX-License-Identifier: GPL-3.0-only
//
// Conformance harness for the hybrid-certificate workshop, run in Node
// against the SAME path the browser uses: SoftHSM PKCS#11 keys → the
// production builders in certBuilder.ts → the service's own checks.
//
// Three layers of evidence, deliberately from different implementations:
//   1. The service's checks (certVerifier.ts, @noble) — not the HSM that signed.
//   2. OpenSSL 3.6.3 (public/wasm/openssl.wasm via the KAT driver) verifying
//      every chain with `openssl verify -x509_strict`, and re-reading the
//      keyUsage / basicConstraints it parses out of the DER.
//   3. Hand-written negatives: mutated signatures, the pre-2026-09-30
//      Alt-Sig input, raw r||s ECDSA, and a RelatedCertificate hash of a
//      different Cert A must all be rejected.
//
// Set HYBRID_CONFORMANCE_REPORT=<path> to write a per-format JSON report.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { AsnConvert } from '@peculiar/asn1-schema'
import { Certificate, TBSCertificate } from '@peculiar/asn1-x509'
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js'
import * as SoftHSM from '@/wasm/softhsm'
import { newModule, runOpenssl, writeFile } from '@/test/kat/openssl-driver'
import {
  hybridCryptoService,
  GenerationCancelledError,
  type FormatOutput,
  type RunContext,
} from './HybridCryptoService'
import {
  parseCertificate,
  readBasicConstraints,
  readKeyUsage,
  verifyAltSigCert,
  verifyIssuedBy,
  verifyRelatedCertificate,
  verifyWithSpki,
} from './certVerifier'
import { HYBRID_CERT_FORMATS } from '../constants'

const SUBJECT = '/CN=Conformance/O=PQC Today/OU=Hybrid Certificate Sandbox'

function pemToDer(pem: string): Uint8Array {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')
  return Uint8Array.from(Buffer.from(b64, 'base64'))
}

/** Independent DER walker — not certVerifier's — for the Alt-Sig input check. */
function children(der: Uint8Array): Uint8Array[] {
  const hdr = (o: number) => {
    const l = der[o + 1]
    if (l < 0x80) return { len: l, h: 2 }
    let len = 0
    for (let i = 0; i < (l & 0x7f); i++) len = (len << 8) | der[o + 2 + i]
    return { len, h: 2 + (l & 0x7f) }
  }
  const outer = hdr(0)
  const out: Uint8Array[] = []
  for (let o = outer.h; o < outer.h + outer.len;) {
    const { len, h } = hdr(o)
    out.push(der.slice(o, o + h + len))
    o += h + len
  }
  return out
}
function seq(parts: Uint8Array[]): Uint8Array {
  const len = parts.reduce((s, p) => s + p.length, 0)
  const lb = len < 0x80 ? [len] : len < 0x100 ? [0x81, len] : [0x82, len >> 8, len & 0xff]
  return new Uint8Array([0x30, ...lb, ...parts.flatMap((p) => [...p])])
}

type Generator = (M: SoftHSM.SoftHSMModule, h: number) => Promise<FormatOutput>
const GENERATORS: Record<string, Generator> = {
  'pure-pqc': (M, h) => hybridCryptoService.generatePurePQCCertMLDSA(SUBJECT, M, h),
  'pure-pqc-slh': (M, h) => hybridCryptoService.generateSelfSignedCertSLHDSA(SUBJECT, M, h),
  'alt-sig': (M, h) => hybridCryptoService.generateAltSigCert(SUBJECT, M, h),
  'related-certs': (M, h) => hybridCryptoService.generateRelatedCertPairReal(SUBJECT, M, h),
  'pure-pqc-kem': (M, h) => hybridCryptoService.generatePurePQCCertMLKEM(SUBJECT, M, h),
  'composite-kem': (M, h) => hybridCryptoService.generateCompositeKEMCert(SUBJECT, M, h),
  chameleon: (M, h) => hybridCryptoService.generateChameleonCert(SUBJECT, M, h),
}

/** Expected keyUsage per format's subject certificate, as the card displays it. */
const EXPECTED_KU: Record<string, string> = {
  'pure-pqc': 'Digital Signature',
  'pure-pqc-slh': 'Digital Signature',
  'related-certs': 'Digital Signature',
  'pure-pqc-kem': 'Key Encipherment',
  'composite-kem': 'Key Encipherment',
}

/**
 * One fresh OpenSSL module per command — the WASM is built with
 * EXIT_RUNTIME=1, so a module cannot run a second `main`.
 */
async function openssl(files: Record<string, string>, args: string[]) {
  const ossl = await newModule({ quiet: true })
  for (const [path, data] of Object.entries(files)) writeFile(ossl, path, data)
  return runOpenssl(ossl, args)
}

/** OpenSSL 3.6.3 registers no composite algorithms, so it cannot build a
 *  chain whose leaf carries a composite KEM key. @noble is the only oracle. */
const NO_OPENSSL_ORACLE = new Set(['composite-kem'])

interface ReportRow {
  format: string
  certificates: number
  serviceChecks: { name: string; ok: boolean }[]
  opensslVerify: string[]
}
const report: ReportRow[] = []

describe('hybrid certificate conformance (SoftHSM → builders → @noble + OpenSSL 3.6.3)', () => {
  let M: SoftHSM.SoftHSMModule
  let session: number
  const outputs: Record<string, FormatOutput> = {}

  beforeAll(async () => {
    M = (await SoftHSM.getSoftHSMRustModule()) as never
    SoftHSM.hsm_initialize(M)
    const slot = SoftHSM.hsm_initToken(M, SoftHSM.hsm_getFirstFreeSlot(M), '1234', 'Conformance')
    session = SoftHSM.hsm_openUserSession(M, slot, '1234', '1234')
    for (const [id, gen] of Object.entries(GENERATORS)) outputs[id] = await gen(M, session)
  }, 180_000)

  afterAll(() => {
    if (process.env.HYBRID_CONFORMANCE_REPORT) {
      writeFileSync(process.env.HYBRID_CONFORMANCE_REPORT, JSON.stringify(report, null, 2))
    }
  })

  it('covers every executable format the workshop shows', () => {
    const executable = HYBRID_CERT_FORMATS.map((f) => f.id).filter((id) => id !== 'composite')
    expect(Object.keys(GENERATORS).sort()).toEqual([...executable].sort())
  })

  for (const id of Object.keys(GENERATORS)) {
    it(`${id}: generates without error and every service check passes`, () => {
      const out = outputs[id]
      expect(out.error).toBeUndefined()
      expect(out.certs.length).toBeGreaterThan(0)
      const failed = out.checks.filter((c) => !c.ok)
      expect(failed, JSON.stringify(failed)).toEqual([])
      expect(out.checks.length).toBeGreaterThan(0)
    })

    it(`${id}: OpenSSL 3.6.3 verifies the chain and reads the profile`, async () => {
      const out = outputs[id]
      const ca = out.certs.find((c) => c.role === 'ca')
      const subjects = out.certs.filter((c) => c.role !== 'ca')
      const results: string[] = []
      for (const cert of subjects) {
        const files = {
          '/ssl/leaf.pem': cert.pem,
          // Self-signed certs verify against themselves; CA-issued against the CA.
          '/ssl/anchor.pem': cert.role === 'subject' && ca ? ca.pem : cert.pem,
        }
        if (NO_OPENSSL_ORACLE.has(id)) {
          results.push(`${cert.label}: not checkable by OpenSSL 3.6.3 (no composite KEM support)`)
          continue
        }
        const v = await openssl(files, [
          'verify',
          '-x509_strict',
          '-CAfile',
          '/ssl/anchor.pem',
          '/ssl/leaf.pem',
        ])
        results.push(`${cert.label}: rc=${v.rc} ${v.stdout.trim()} ${v.stderr.trim()}`.trim())
        // A self-signed end entity (cA=FALSE) is reported as an untrusted
        // leaf by x509_strict, so only CA-issued chains must return OK.
        if (cert.role === 'subject' && ca) expect(v.rc, results.at(-1)).toBe(0)
        if (cert.role === 'subject' && EXPECTED_KU[id]) {
          const t = await openssl(files, ['x509', '-in', '/ssl/leaf.pem', '-noout', '-text'])
          expect(t.stdout).toMatch(
            /X509v3 Key Usage: critical\s+Key Encipherment|X509v3 Key Usage: critical\s+Digital Signature/
          )
          expect(t.stdout).toContain(EXPECTED_KU[id])
          expect(t.stdout).toMatch(/X509v3 Basic Constraints: critical\s+CA:FALSE/)
        }
      }
      report.push({
        format: id,
        certificates: out.certs.length,
        serviceChecks: out.checks.map(({ name, ok }) => ({ name, ok })),
        opensslVerify: results,
      })
    })
  }

  it('alt-sig: the alternative signature covers TBS minus `signature` minus altSignatureValue', () => {
    const cert = parseCertificate(pemToDer(outputs['alt-sig'].certs[0].pem))
    const tbs = AsnConvert.parse(AsnConvert.serialize(cert.tbsCertificate), TBSCertificate)
    const altValue = tbs.extensions!.find((e) => e.extnID === '2.5.29.74')!
    const altKey = tbs.extensions!.find((e) => e.extnID === '2.5.29.72')!
    tbs.extensions = tbs.extensions!.filter((e) => e.extnID !== '2.5.29.74') as never
    const full = children(new Uint8Array(AsnConvert.serialize(tbs)))
    const correct = seq([full[0], full[1], ...full.slice(3)])
    const wrong = new Uint8Array(AsnConvert.serialize(tbs)) // still has `signature`
    const sig = new Uint8Array(altValue.extnValue.buffer).slice(
      3 +
        (new Uint8Array(altValue.extnValue.buffer)[1] & 0x80
          ? new Uint8Array(altValue.extnValue.buffer)[1] & 0x7f
          : 0)
    )
    const spkiChildren = children(new Uint8Array(altKey.extnValue.buffer))
    const pub = spkiChildren[1].slice(
      spkiChildren[1][1] & 0x80 ? 3 + (spkiChildren[1][1] & 0x7f) : 3
    )
    expect(ml_dsa65.verify(sig, correct, pub)).toBe(true)
    expect(ml_dsa65.verify(sig, wrong, pub)).toBe(false)
  })

  it('negative: a flipped signature byte fails every signature check', () => {
    for (const id of ['pure-pqc', 'pure-pqc-slh', 'pure-pqc-kem', 'composite-kem']) {
      const out = outputs[id]
      const ca = parseCertificate(pemToDer(out.certs.find((c) => c.role === 'ca')!.pem))
      const leafDer = pemToDer(out.certs.find((c) => c.role === 'subject')!.pem)
      const tampered = leafDer.slice()
      tampered[tampered.length - 5] ^= 0x01
      const checks = verifyIssuedBy(parseCertificate(tampered), ca)
      expect(checks.find((c) => c.name === 'Certificate signature verifies')!.ok, id).toBe(false)
    }
  })

  it('negative: a tampered TBS (one subject byte) fails verification', () => {
    const out = outputs['pure-pqc']
    const ca = parseCertificate(pemToDer(out.certs.find((c) => c.role === 'ca')!.pem))
    const leaf = parseCertificate(pemToDer(out.certs.find((c) => c.role === 'subject')!.pem))
    const tbs = new Uint8Array(AsnConvert.serialize(leaf.tbsCertificate))
    const i = tbs.indexOf(0x43) // 'C' of "Conformance"
    tbs[i] ^= 0x20
    const sigOk = verifyWithSpki(
      leaf.signatureAlgorithm.algorithm,
      ca.tbsCertificate.subjectPublicKeyInfo,
      tbs,
      new Uint8Array(leaf.signatureValue)
    )
    expect(sigOk.ok).toBe(false)
  })

  it('negative: raw r||s ECDSA in an X.509 signature field is rejected', () => {
    const certA = parseCertificate(pemToDer(outputs['related-certs'].certs[0].pem))
    const derSig = new Uint8Array(certA.signatureValue)
    expect(derSig[0]).toBe(0x30)
    // Re-encode as raw r||s and check the verifier refuses it.
    const parts = children(derSig).map((p) => {
      let v = p.slice(2)
      while (v.length > 32 && v[0] === 0) v = v.slice(1)
      const out = new Uint8Array(32)
      out.set(v, 32 - v.length)
      return out
    })
    const raw = new Uint8Array([...parts[0], ...parts[1]])
    const res = verifyWithSpki(
      certA.signatureAlgorithm.algorithm,
      certA.tbsCertificate.subjectPublicKeyInfo,
      new Uint8Array(AsnConvert.serialize(certA.tbsCertificate)),
      raw
    )
    expect(res.ok).toBe(false)
  })

  it('related-certs: Cert B binds the FINAL Cert A, one way only', () => {
    const out = outputs['related-certs']
    const certADer = pemToDer(out.certs.find((c) => c.role === 'existing')!.pem)
    const certB = parseCertificate(pemToDer(out.certs.find((c) => c.role === 'subject')!.pem))
    const certA = parseCertificate(certADer)
    expect(verifyRelatedCertificate(certB, certADer).ok).toBe(true)
    // The displayed binding hash is the hash stored in Cert B.
    expect(out.bindingHash).toBe(createHash('sha256').update(certADer).digest('hex'))
    // Cert A carries no RelatedCertificate extension (not reciprocal).
    expect(certA.tbsCertificate.extensions?.some((e) => e.extnID === '1.3.6.1.5.5.7.1.36')).toBe(
      false
    )
    // A hash of a different Cert A is rejected.
    const other = certADer.slice()
    other[other.length - 1] ^= 0xff
    expect(verifyRelatedCertificate(certB, other).ok).toBe(false)
  })

  it('alt-sig: verifyAltSigCert rejects a corrupted alternative signature', () => {
    const der = pemToDer(outputs['alt-sig'].certs[0].pem)
    const cert = AsnConvert.parse(der, Certificate)
    const ext = cert.tbsCertificate.extensions!.find((e) => e.extnID === '2.5.29.74')!
    const bytes = new Uint8Array(ext.extnValue.buffer)
    bytes[bytes.length - 10] ^= 0x01
    const altCheck = verifyAltSigCert(cert).find((c) => c.name.startsWith('Alternative signature'))
    expect(altCheck?.ok).toBe(false)
  })

  it('every keyUsage / basicConstraints claim on a card matches the generated DER', () => {
    const KU_NAMES: Record<string, string> = {
      digitalSignature: 'digitalSignature',
      keyEncipherment: 'keyEncipherment',
    }
    for (const fmt of HYBRID_CERT_FORMATS) {
      const out = outputs[fmt.id]
      if (!out) continue
      const subject = out.certs.find((c) => c.role === 'subject')!
      const cert = parseCertificate(pemToDer(subject.pem))
      for (const line of fmt.structureLines.map((l) => l.text)) {
        const ku = line.match(/keyUsage \(critical\)\s+(\w+)/)
        if (ku) {
          const got = readKeyUsage(cert)
          expect(got?.critical, `${fmt.id}: ${line}`).toBe(true)
          expect(got?.bits, `${fmt.id}: ${line}`).toEqual([KU_NAMES[ku[1]]])
        }
        const bc = line.match(/basicConstraints \(critical\)\s+cA=(TRUE|FALSE)/)
        if (bc) {
          const got = readBasicConstraints(cert)
          expect(got, `${fmt.id}: ${line}`).toEqual({ cA: bc[1] === 'TRUE', critical: true })
        }
      }
    }
  })

  it('KEM and pure-PQC end entities are CA-issued, never self-issued', () => {
    // Self-issued is legitimate only for a CA root, the existing RFC 9763
    // Cert A, and the two single-certificate extension demos.
    const selfIssuedDemos = new Set(['alt-sig', 'chameleon'])
    for (const [id, out] of Object.entries(outputs)) {
      for (const c of out.certs) {
        const cert = parseCertificate(pemToDer(c.pem))
        const selfIssued = Buffer.from(AsnConvert.serialize(cert.tbsCertificate.issuer)).equals(
          Buffer.from(AsnConvert.serialize(cert.tbsCertificate.subject))
        )
        const allowed = c.role === 'ca' || c.role === 'existing' || selfIssuedDemos.has(id)
        if (selfIssued) expect(allowed, `${id}: ${c.label}`).toBe(true)
      }
    }
  })
})

// ---------------------------------------------------------------------------
// Repeated runs and cancellation — the lifecycle half of the plan (§7).
// Every key a format creates must be reported to the tracker, so that
// destroying the tracked handles returns the HSM to its starting object count.
// ---------------------------------------------------------------------------
describe('repeated Generate All leaves no HSM objects behind', () => {
  let M: SoftHSM.SoftHSMModule
  let session: number
  const RUNS = 10

  beforeAll(async () => {
    M = (await SoftHSM.getSoftHSMRustModule()) as never
    SoftHSM.hsm_initialize(M)
    const slot = SoftHSM.hsm_initToken(M, SoftHSM.hsm_getFirstFreeSlot(M), '1234', 'Repeat')
    session = SoftHSM.hsm_openUserSession(M, slot, '1234', '1234')
  }, 60_000)

  const count = () => SoftHSM.hsm_findAllObjects(M, session, []).length

  it(`${RUNS} consecutive runs of every format: each succeeds and the object count returns to baseline`, async () => {
    const baseline = count()
    const durations: Record<string, number[]> = {}
    for (let run = 0; run < RUNS; run++) {
      for (const [id] of Object.entries(GENERATORS)) {
        const handles: number[] = []
        const stages: string[] = []
        const track = (h: number) => {
          handles.push(h)
        }
        const t0 = performance.now()
        const out = await runWith(id, M, session, track, { onStage: (s) => stages.push(s) })
        ;(durations[id] ??= []).push(performance.now() - t0)
        expect(out.error, `run ${run} ${id}`).toBeUndefined()
        expect(stages.length, `run ${run} ${id}: stages reported`).toBeGreaterThan(1)
        expect(handles.length, `run ${run} ${id}: keys tracked`).toBeGreaterThan(0)
        for (const h of handles) SoftHSM.hsm_destroyObject(M, session, h)
        expect(count(), `run ${run} ${id}: objects after cleanup`).toBe(baseline)
      }
    }
    if (process.env.HYBRID_CONFORMANCE_REPORT) {
      const medians = Object.fromEntries(
        Object.entries(durations).map(([id, ds]) => [
          id,
          Math.round([...ds].sort((a, b) => a - b)[Math.floor(ds.length / 2)]),
        ])
      )
      writeFileSync(
        process.env.HYBRID_CONFORMANCE_REPORT.replace(/\.json$/, '-repeat.json'),
        JSON.stringify({ runs: RUNS, baselineObjects: baseline, medianMs: medians }, null, 2)
      )
    }
  }, 600_000)

  it('cancelling mid-run throws GenerationCancelledError and its tracked keys clean up to baseline', async () => {
    const baseline = count()
    const controller = new AbortController()
    const handles: number[] = []
    let caught: unknown
    try {
      await runWith('pure-pqc-kem', M, session, (h) => handles.push(h), {
        signal: controller.signal,
        // Cancel once the ML-KEM key exists, i.e. mid-format.
        onStage: (s) => {
          if (s === 'Subject certificate issuance') controller.abort()
        },
      })
    } catch (e) {
      caught = e
    }
    expect(caught).toBeInstanceOf(GenerationCancelledError)
    expect(handles.length).toBeGreaterThan(0)
    for (const h of handles) SoftHSM.hsm_destroyObject(M, session, h)
    expect(count()).toBe(baseline)
  })
})

function runWith(
  id: string,
  M: SoftHSM.SoftHSMModule,
  h: number,
  track: (handle: number) => void,
  run: RunContext
): Promise<FormatOutput> {
  const onKey = (handle: number) => track(handle)
  switch (id) {
    case 'pure-pqc':
      return hybridCryptoService.generatePurePQCCertMLDSA(SUBJECT, M, h, onKey, run)
    case 'pure-pqc-slh':
      return hybridCryptoService.generateSelfSignedCertSLHDSA(SUBJECT, M, h, onKey, run)
    case 'alt-sig':
      return hybridCryptoService.generateAltSigCert(SUBJECT, M, h, onKey, run)
    case 'related-certs':
      return hybridCryptoService.generateRelatedCertPairReal(SUBJECT, M, h, onKey, run)
    case 'pure-pqc-kem':
      return hybridCryptoService.generatePurePQCCertMLKEM(SUBJECT, M, h, onKey, run)
    case 'composite-kem':
      return hybridCryptoService.generateCompositeKEMCert(SUBJECT, M, h, onKey, run)
    case 'chameleon':
      return hybridCryptoService.generateChameleonCert(SUBJECT, M, h, onKey, run)
    default:
      throw new Error(`no generator for ${id}`)
  }
}
