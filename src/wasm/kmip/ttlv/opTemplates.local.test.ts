// SPDX-License-Identifier: GPL-3.0-only
//
// Integration test for the generic op-template pipeline (buildRequest →
// toWireTree → encodeTtlv → submit → decodeTtlv, via `runOp`) — the
// foundation the new KMIP3.0 Commands tab and the OASIS corpus replay both
// build on, instead of a Rust match arm per operation. Drives the REAL wasm
// engine, not a mock.
//
// Venue: `*.local.test.ts` — excluded from CI vitest globs, run by the local
// gate (project directive 2026-07-01: new suites are local-only) because
// booting the wasm engine is heavier than the default suite budget.
/* eslint-disable security/detect-non-literal-fs-filename -- reads a fixed repo dir */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect, beforeAll } from 'vitest'
import { KmipEngine, hexToBytes } from '../kmipEngine'
import { CodepointTable } from './codepointTable'
import { runOp } from './runner'
import { find, findAll, leaf } from './nodes'
import * as ops from './opTemplates'
import { OP_TEMPLATES } from './opTemplates'
// WP6-a/WP6-b (cert-ops plan revision) — the workshop's OWN, independent
// DER parser/OID constants (Hybrid Certificates tool), deliberately NOT
// re-implemented here: agreement between this and the KMIP wasm engine's
// own encoder is the actual cross-check value (plan §"WP6-b").
import { parseCertificateInfo } from '../../../components/PKILearning/modules/HybridCrypto/services/derParser'
import { AsnConvert } from '@peculiar/asn1-schema'
import {
  Certificate,
  TBSCertificate,
  Version,
  AlgorithmIdentifier,
  SubjectPublicKeyInfo,
  Validity,
  Name,
  RelativeDistinguishedName,
  AttributeTypeAndValue,
  AttributeValue,
} from '@peculiar/asn1-x509'
import {
  ECDSA_SHA256_OID_STR,
  EC_PUBLIC_KEY_OID_STR,
  ML_DSA_65_OID_STR,
} from '../../../components/PKILearning/modules/HybridCrypto/services/certBuilder'

const SPEC_JSON = JSON.parse(
  readFileSync(join(__dirname, '../../../../public/kmip-corpus/tags-enums.json'), 'utf8')
) as Parameters<typeof CodepointTable.fromSpec>[0]

describe('op-template pipeline (real wasm engine)', () => {
  let engine: KmipEngine
  let table: CodepointTable

  beforeAll(async () => {
    engine = await KmipEngine.boot()
    table = CodepointTable.fromSpec(SPEC_JSON)
  })

  const run = (operation: string, payload: ReturnType<typeof ops.query>) =>
    runOp(engine, table, operation, payload)

  it('has exactly one template per KMIP 3.0 operation, 66 total', () => {
    expect(OP_TEMPLATES).toHaveLength(66)
    expect(new Set(OP_TEMPLATES.map((t) => t.op)).size).toBe(66)
  })

  it('Query succeeds and reports the server info', () => {
    const { ok, namedResponseTree } = run('Query', ops.query())
    expect(ok).toBe(true)
    expect(find(namedResponseTree, 'VendorIdentification')).toBeDefined()
  })

  it('full lifecycle: CreateKeyPair → Activate → Sign → GetAttributes → Revoke → Destroy', () => {
    const created = run('CreateKeyPair', ops.createKeyPair('ML-DSA-65', 'Sign Verify'))
    expect(created.ok).toBe(true)
    const priv = find(created.namedResponseTree, 'PrivateKeyUniqueIdentifier')
    expect(typeof priv?.value).toBe('string')
    const uid = priv?.value as string

    expect(run('Activate', ops.activate(uid)).ok).toBe(true)

    const signed = run('Sign', ops.sign(uid, '68656c6c6f'))
    expect(signed.ok).toBe(true)
    expect(find(signed.namedResponseTree, 'SignatureData')).toBeDefined()

    expect(run('GetAttributes', ops.getAttributes(uid)).ok).toBe(true)
    expect(run('Revoke', ops.revoke(uid)).ok).toBe(true)
    expect(run('Destroy', ops.destroy(uid)).ok).toBe(true)
  })

  it('DeriveKey (NIST 800-108-C) derives a real key from a base secret', () => {
    // Matches op_coverage_e2e.rs's `dk-derive` base key exactly: an
    // HMAC-SHA256 key (the KDF's PRF) carrying the `DeriveKey` usage bit —
    // DeriveKey refuses a base object lacking that bit
    // (IncompatibleCryptographicUsageMask), and refuses a PreActive one
    // (WrongKeyLifecycleState), so both must be set up correctly here.
    const base = run('Create', ops.create('HMAC-SHA256', 256, 'DeriveKey'))
    expect(base.ok).toBe(true)
    const baseUid = find(base.namedResponseTree, 'UniqueIdentifier')?.value as string
    expect(run('Activate', ops.activate(baseUid)).ok).toBe(true)

    const derived = run('DeriveKey', ops.deriveKey(baseUid))
    expect(derived.ok).toBe(true)
    expect(find(derived.namedResponseTree, 'UniqueIdentifier')).toBeDefined()
  })

  it('GetUsageAllocation on a key with no declared Usage Limits is a real, well-formed AttributeNotFound', () => {
    const created = run('Create', ops.create('AES', 256))
    const uid = find(created.namedResponseTree, 'UniqueIdentifier')?.value as string
    // A freshly created key with no `UsageLimits` attribute correctly
    // refuses an allocation request — proving the round trip reaches real
    // dispatcher semantics, not just "some bytes came back".
    const { ok, resultReason } = run('GetUsageAllocation', ops.getUsageAllocation(uid, 5))
    expect(ok).toBe(false)
    expect(resultReason).toBeDefined()
  })

  it('Validate on an empty chain is Success/Unknown, not an error — §6.1.62 "nothing to check"', () => {
    // Since the pure-Rust cert-ops port (WP4), Validate dispatches for
    // real here (previously OperationNotSupported — ring/rcgen didn't
    // cross-compile to wasm32). An empty chain can't be affirmed Valid,
    // but it's not a protocol error either.
    const { ok, namedResponseTree } = run('Validate', ops.validate())
    expect(ok).toBe(true)
    expect(find(namedResponseTree, 'ValidityIndicator')?.value).toBe('0x00000003')
  })

  it('Certificate Services: setupDemoCa mints a self-signed cert that Validates Valid, then Invalid once tampered', () => {
    // setup_demo_ca (the "Set up demo CA" affordance) runs the SAME
    // production certify::bootstrap_ca_certificate path the native
    // server's --ca-key bootstrap uses — real ECDSA keygen, real
    // self-signature, real storage, not a wasm-only shortcut.
    const ca = engine.setupDemoCa('ECDSA-P256', 'op-template-test CA')
    expect(ca.ok).toBe(true)
    expect(ca.certificateUid).toBeDefined()
    expect((ca.certificateDerHex as string).length).toBeGreaterThan(100)

    const valid = run('Validate', ops.validate([], [ca.certificateUid as string]))
    expect(valid.ok).toBe(true)
    expect(find(valid.namedResponseTree, 'ValidityIndicator')?.value).toBe('0x00000001')

    // Tamper one hex nibble of the SAME cert's inline DER (independent of
    // the stored copy) — the corrupted chain must come back Invalid, never
    // a false Valid.
    const goodDer = ca.certificateDerHex as string
    const tamperedDer = goodDer.slice(0, -1) + (goodDer.at(-1) === '0' ? '1' : '0')
    const tampered = run('Validate', ops.validate([tamperedDer]))
    expect(tampered.ok).toBe(true)
    expect(find(tampered.namedResponseTree, 'ValidityIndicator')?.value).toBe('0x00000002')
  })

  it('Certify with neither a Unique Identifier nor a CSR is a real, spec-shaped rejection', () => {
    // Certify's OTHER two inputs are a stored PublicKey UID with real
    // SubjectPublicKeyInfo material (WP-R/R1: works for a bare
    // CreateKeyPair output too now, not just a Register'd key — see the
    // positive test below) or a PKCS#10 CSR (a CSR encoder this TS layer
    // doesn't build — real engine-side coverage for that lives in
    // certify.rs's own test suite, `certify_ml_dsa_pqc_csr_is_accepted`).
    // This proves the request DOES reach real Certify logic (a precise,
    // spec-shaped error), not `OperationNotSupported` — the wasm32 gap
    // this port closed.
    engine.setupDemoCa('ECDSA-P256', 'certify-neither-test CA')
    const { ok, resultReason, resultMessage } = run('Certify', ops.certify())
    expect(ok).toBe(false)
    expect(resultReason).toBeDefined()
    expect(resultMessage).toMatch(/Certificate Request|Unique Identifier/)
  })

  /** WP-R/R1 + WP6-a + WP6-b, run per algorithm. Before WP-R/R1, Certify by
   * UID failed with KeyValueNotPresent for a bare CreateKeyPair output:
   * CreateKeyPair never populates the store's key_material cache (only
   * hybrid-KEM public halves do), and resolve_subject only ever read that
   * cache. It now falls back to a live engine SPKI lookup — same
   * production path bootstrap_ca_certificate already used. This is the
   * wasm-side half of that fix's proof (native half:
   * certify.rs::certify_freshly_created_{ecdsa,ml_dsa}_public_key_by_uid);
   * a wasm bundle built before the fix landed still shows
   * KeyValueNotPresent here even though the native tests pass. */
  function certifyByUidAndAssertStructure(
    kmipAlgo: string,
    caAlgo: string,
    algorithmOID: string,
    publicKeyOID: string
  ) {
    const ca = engine.setupDemoCa(caAlgo, `WP6-a wasm CA (${kmipAlgo})`)
    const created = run('CreateKeyPair', ops.createKeyPair(kmipAlgo, 'Sign Verify'))
    expect(created.ok).toBe(true)
    const pubUid = find(created.namedResponseTree, 'PublicKeyUniqueIdentifier')?.value as string
    expect(pubUid).toBeDefined()

    const certified = run('Certify', ops.certify(pubUid))
    expect(certified.ok).toBe(true)
    const certUid = find(certified.namedResponseTree, 'UniqueIdentifier')?.value as string
    expect(certUid).toBeDefined()

    // WP6-a — structural parity fields (native counterpart:
    // certify.rs::issue_and_verify's assertions after the signature
    // check). Not byte-identical — serial/timestamp are wall-clock, and
    // ECDSA/ML-DSA signing is randomized by this engine's default
    // regardless of build target (confirmed empirically, see plan's
    // "WP6-a" section) — but every field that ISN'T inherently random
    // must independently check out here exactly as it does natively.
    const got = run('Get', ops.get(certUid))
    expect(got.ok).toBe(true)
    const certHex = find(got.namedResponseTree, 'Key Material')?.value as string
    expect(certHex).toBeDefined()
    const info = parseCertificateInfo(hexToBytes(certHex))
    // No subject DN on a bare public key — resolve_subject synthesises
    // "CN=<object name or UID>" (certify.rs, WP-R/R1 branch). No `Name`
    // attribute was set on this CreateKeyPair, so it falls back to the
    // UID itself — assert the DER actually carries it, not just that
    // parsing succeeded.
    const derText = new TextDecoder('latin1').decode(hexToBytes(certHex))
    expect(derText).toContain(pubUid)
    // WP6-b — hub-side OID/constant audit: the issued cert's signature
    // and SPKI algorithm OIDs, parsed by the workshop's OWN independent
    // derParser.ts (not a re-implementation), must equal certBuilder.ts's
    // exported constants. Any disagreement is a real bug in one of the
    // two encoders — fix the encoder, never this assertion.
    expect(info.algorithmOID).toBe(algorithmOID)
    expect(info.publicKeyOID).toBe(publicKeyOID)
    expect(info.extensionOIDs).toEqual([])

    // Validate needs the full chain supplied explicitly (§6.1.62 — it
    // never auto-resolves an issuer from just the leaf's own UID; native
    // counterpart: validate.rs::leaf_with_ca_chain_is_valid). Leaf UID
    // first, then the CA's own stored certificate UID.
    const valid = run('Validate', ops.validate([], [certUid, ca.certificateUid as string]))
    expect(valid.ok).toBe(true)
    expect(find(valid.namedResponseTree, 'ValidityIndicator')?.value).toBe('0x00000001')
  }

  it('Certify a bare CreateKeyPair ECDSA public key by UID — no Register step (WP-R/R1)', () => {
    certifyByUidAndAssertStructure(
      'ECDSA',
      'ECDSA-P256',
      ECDSA_SHA256_OID_STR,
      EC_PUBLIC_KEY_OID_STR
    )
  })

  it('Certify a bare CreateKeyPair ML-DSA-65 public key by UID — no Register step (WP-R/R1)', () => {
    // ML-DSA has no separate hash-then-sign split: the same id-ml-dsa-65
    // arc names both the SPKI algorithm and the signature algorithm (RFC
    // 9500-family convention — no distinct "public key" OID, unlike
    // RSA/ECDSA where signing and SPKI algorithm OIDs differ).
    certifyByUidAndAssertStructure('ML-DSA-65', 'ML-DSA-65', ML_DSA_65_OID_STR, ML_DSA_65_OID_STR)
  })

  it('WP6-c: an independently-built, externally-signed cert Validates — cross-engine, no shared code with this Rust engine', async () => {
    // The strongest check in the cert-ops plan: two independent crypto
    // stacks agreeing, not just one agreeing with itself. Signed by
    // Node's `node:crypto` legacy API (OpenSSL-backed, genuinely
    // independent of this Rust KMIP engine — not WebCrypto, deliberately:
    // WebCrypto's ECDSA output is raw IEEE-P1363 r||s, and this cert's
    // signatureValue BIT STRING needs real DER SEQUENCE(r, s); `node:
    // crypto`'s legacy `sign()` returns that by default, no hand-rolled
    // ASN.1 signature re-encoding needed).
    //
    // NOT built with certBuilder.ts::buildSelfSignedX509 — a real,
    // useful finding from trying it first: that function reuses ONE
    // AlgorithmIdentifier for both the SPKI and the signature, which is
    // only correct for algorithms where those OIDs are the SAME arc
    // (ML-DSA/SLH-DSA, its actual documented scope — "works for any
    // single-algorithm cert (ML-DSA-65, SLH-DSA, etc.)"). For ECDSA they
    // legitimately differ (id-ecPublicKey+curve vs ecdsa-with-SHA256);
    // using it for ECDSA produces an SPKI whose AlgorithmIdentifier OID
    // is the SIGNATURE oid, which `validate.rs`'s engine dispatch
    // correctly refuses to treat as a public-key algorithm — the
    // resulting cert genuinely came back Unknown, not Valid, when tried.
    // Node can't sign ML-DSA (no PQC support in its bundled OpenSSL), so
    // assembling a real EC self-signed cert here uses the SAME
    // `@peculiar/asn1-x509` primitives certBuilder.ts itself is built on
    // (no hand-rolled DER), just with the two AlgorithmIdentifiers kept
    // properly separate — mirroring certBuilder.ts's own *private*
    // `buildECAlgId()`, which already gets this right internally but
    // isn't exported for reuse.
    const crypto = await import('node:crypto')
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
    const jwk = publicKey.export({ format: 'jwk' }) as { x: string; y: string }
    const point = new Uint8Array([
      0x04,
      ...Buffer.from(jwk.x, 'base64url'),
      ...Buffer.from(jwk.y, 'base64url'),
    ])
    // id-ecPublicKey (1.2.840.10045.2.1) with prime256v1 (1.2.840.10045.3.1.7)
    // as the parameter — a raw DER OID TLV, same byte pattern
    // certBuilder.ts::buildECAlgId() uses.
    const p256CurveOidTlv = new Uint8Array([
      0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07,
    ])
    const ecSpkiAlgId = new AlgorithmIdentifier({
      algorithm: EC_PUBLIC_KEY_OID_STR,
      parameters: p256CurveOidTlv.buffer as ArrayBuffer,
    })
    const sigAlgId = new AlgorithmIdentifier({ algorithm: ECDSA_SHA256_OID_STR })
    const name = new Name([
      new RelativeDistinguishedName([
        new AttributeTypeAndValue({
          type: '2.5.4.3',
          value: new AttributeValue({ utf8String: 'wp6c-crosscheck-external-ca' }),
        }),
      ]),
    ])
    const notBefore = new Date()
    const notAfter = new Date(notBefore.getTime() + 365 * 24 * 60 * 60 * 1000)
    const tbs = new TBSCertificate({
      version: Version.v3,
      serialNumber: new Uint8Array(crypto.randomBytes(8)).buffer as ArrayBuffer,
      signature: sigAlgId,
      issuer: name,
      validity: new Validity({ notBefore, notAfter }),
      subject: name,
      subjectPublicKeyInfo: new SubjectPublicKeyInfo({
        algorithm: ecSpkiAlgId,
        subjectPublicKey: point.buffer as ArrayBuffer,
      }),
    })
    const tbsDer = new Uint8Array(AsnConvert.serialize(tbs))
    const signature = crypto.sign('sha256', Buffer.from(tbsDer), privateKey)
    const cert = new Certificate({
      tbsCertificate: tbs,
      signatureAlgorithm: sigAlgId,
      signatureValue: new Uint8Array(signature).buffer as ArrayBuffer,
    })
    const certHex = Buffer.from(AsnConvert.serialize(cert)).toString('hex')

    const valid = run('Validate', ops.validate([certHex]))
    expect(valid.ok).toBe(true)
    expect(find(valid.namedResponseTree, 'ValidityIndicator')?.value).toBe('0x00000001')

    const tampered = certHex.slice(0, -1) + (certHex.at(-1) === '0' ? '1' : '0')
    const invalid = run('Validate', ops.validate([tampered]))
    expect(invalid.ok).toBe(true)
    expect(find(invalid.namedResponseTree, 'ValidityIndicator')?.value).toBe('0x00000002')
  })

  it("ReCertify renews the demo CA's own self-signed certificate", () => {
    // No CSR supplied → ReCertify reuses the existing cert's subject/SPKI,
    // sidestepping the same Register-a-fresh-key gap: the CA's Certificate
    // object (unlike a bare PublicKey from CreateKeyPair) already carries
    // real stored DER, since bootstrap_ca_certificate stores it that way.
    // No Offset either — `Offset` shifts the NEW Activation Date into the
    // future relative to now (§6.1.50 Table 400, for pre-provisioning a
    // successor key not yet active), so validating a just-renewed cert
    // "now" needs the default (activation = now), not a positive offset.
    const ca = engine.setupDemoCa('ECDSA-P256', 'recertify-test CA')
    const renewed = run('ReCertify', ops.reCertify(ca.certificateUid as string))
    expect(renewed.ok).toBe(true)
    const renewedUid = find(renewed.namedResponseTree, 'UniqueIdentifier')?.value as string
    expect(renewedUid).toBeDefined()
    expect(renewedUid).not.toBe(ca.certificateUid)

    const stillValid = run('Validate', ops.validate([], [renewedUid]))
    expect(find(stillValid.namedResponseTree, 'ValidityIndicator')?.value).toBe('0x00000001')
  })

  it('ReCertify with a positive Offset pre-provisions a not-yet-active successor (Unknown/Invalid right now)', () => {
    const ca = engine.setupDemoCa('ECDSA-P256', 'recertify-offset-test CA')
    const renewed = run('ReCertify', ops.reCertify(ca.certificateUid as string, '', 3600))
    expect(renewed.ok).toBe(true)
    const renewedUid = find(renewed.namedResponseTree, 'UniqueIdentifier')?.value as string

    const notYetValid = run('Validate', ops.validate([], [renewedUid]))
    expect(find(notYetValid.namedResponseTree, 'ValidityIndicator')?.value).toBe('0x00000002')
  })

  // ── engine 0.12.0/0.13.0 "honest maximum" promotions ──────────────────────

  it('CreateSplitKey → JoinSplitKey: a 3-of-5 polynomial split reconstructs from any 3 shares and refuses 2', () => {
    const created = run('Create', ops.create('AES', 256))
    const uid = find(created.namedResponseTree, 'UniqueIdentifier')?.value as string
    expect(run('Activate', ops.activate(uid)).ok).toBe(true)

    const split = run('CreateSplitKey', ops.createSplitKey(uid, 5, 3))
    expect(split.ok).toBe(true)
    const shares = findAll(split.namedResponseTree, 'UniqueIdentifier')
      .map((n) => n.value)
      .filter((v): v is string => typeof v === 'string')
    expect(shares).toHaveLength(5)

    const joined = run('JoinSplitKey', ops.joinSplitKey(shares.slice(0, 3)))
    expect(joined.ok).toBe(true)
    expect(find(joined.namedResponseTree, 'UniqueIdentifier')).toBeDefined()

    const tooFew = run('JoinSplitKey', ops.joinSplitKey(shares.slice(0, 2)))
    expect(tooFew.ok).toBe(false)
    expect(tooFew.resultMessage).toContain('Threshold')
  })

  it('CreateSplitKey with XOR honestly refuses N != M (§13.1: XOR needs every share)', () => {
    const created = run('Create', ops.create('AES', 256))
    const uid = find(created.namedResponseTree, 'UniqueIdentifier')?.value as string
    run('Activate', ops.activate(uid))
    const { ok, resultMessage } = run('CreateSplitKey', ops.createSplitKey(uid, 5, 3, 'XOR'))
    expect(ok).toBe(false)
    expect(resultMessage).toContain('XOR')
  })

  it('async round trip: Hash + Mandatory indicator → OperationPending + correlation value → Poll returns the real digest', () => {
    const enqueue = runOp(engine, table, 'Hash', ops.hash('68656c6c6f'), [
      leaf('AsynchronousIndicator', 'Enumeration', 'Mandatory'),
    ])
    // OperationPending, not Success — the job is queued, not answered.
    expect(enqueue.ok).toBe(false)
    const cv = find(enqueue.namedResponseTree, 'AsynchronousCorrelationValue')?.value
    expect(typeof cv).toBe('string')

    const polled = run('Poll', ops.poll(cv as string))
    expect(polled.ok).toBe(true)
    // SHA-256("hello") — the identical payload the synchronous op returns.
    expect(find(polled.namedResponseTree, 'Data')?.value).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
    )
  })

  it('Poll with an unknown correlation value is a real, well-formed rejection', () => {
    const { ok, resultMessage } = run('Poll', ops.poll('deadbeef'))
    expect(ok).toBe(false)
    expect(resultMessage).toBeDefined()
  })

  it('QueryAsynchronousRequests succeeds (empty once every job has been polled)', () => {
    expect(run('QueryAsynchronousRequests', ops.queryAsynchronousRequests()).ok).toBe(true)
  })

  it('ObtainLease grants a real lease on a managed object', () => {
    const created = run('Create', ops.create('AES', 256))
    const uid = find(created.namedResponseTree, 'UniqueIdentifier')?.value as string
    const lease = run('ObtainLease', ops.obtainLease(uid))
    expect(lease.ok).toBe(true)
    expect(find(lease.namedResponseTree, 'LeaseTime')).toBeDefined()
  })

  it('SetConstraints round-trips against the real constraint table', () => {
    expect(run('SetConstraints', ops.setConstraints()).ok).toBe(true)
  })

  it('Locate narrows by UID filter — real filtering since 0.13.0, not silently ignored', () => {
    const created = run('Create', ops.create('AES', 256))
    const uid = find(created.namedResponseTree, 'UniqueIdentifier')?.value as string
    const located = run('Locate', ops.locate(undefined, undefined, uid))
    const uids = findAll(located.namedResponseTree, 'UniqueIdentifier').map((n) => n.value)
    expect(uids).toEqual([uid])
  })

  it('a genuinely-unimplemented op (Put) is a real, well-formed rejection', () => {
    const { ok, resultMessage } = run('Put', ops.put())
    expect(ok).toBe(false)
    expect(resultMessage).toBeDefined()
  })
})
