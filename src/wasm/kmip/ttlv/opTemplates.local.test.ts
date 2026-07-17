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
import { toWireTree } from './encode'
import { buildRequestWithHeader } from './request'
import { ALGORITHMS, AUTO_ALGO } from '../kmipMeta'
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
  COMPOSITE_MLDSA65_ECDSA_P256_SHA512_OID_STR,
  COMPOSITE_PROFILE_MLDSA65_ECDSA_P256_SHA512,
  buildCompositeCertDraft19,
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

  // Ground truth transcribed from pqctoday-hsm/kmip/src/kmip30/ops.rs's
  // `Operation` enum — the value the real dispatcher matches on, and
  // independently unit-asserted there against the spec. This is the guard
  // the 2026-07-17 KMIP 3.0 audit found missing: a case-sensitive `norm()`
  // collision made the `ReKeyKeyPair` card's own patch-table entry encode
  // op 0x1e (Discover Versions) instead of 0x1d (Re-key Key Pair), so every
  // "Run" silently executed the wrong operation and reported Success. This
  // test would have failed on that bug; it now guards every op's wire
  // codepoint, and every future codepointTable.ts edit, the same way.
  const OPERATION_CODEPOINTS: Record<string, number> = {
    Create: 0x01,
    CreateKeyPair: 0x02,
    Register: 0x03,
    ReKey: 0x04,
    DeriveKey: 0x05,
    Certify: 0x06,
    ReCertify: 0x07,
    Locate: 0x08,
    Check: 0x09,
    Get: 0x0a,
    GetAttributes: 0x0b,
    GetAttributeList: 0x0c,
    AddAttribute: 0x0d,
    ModifyAttribute: 0x0e,
    DeleteAttribute: 0x0f,
    ObtainLease: 0x10,
    GetUsageAllocation: 0x11,
    Activate: 0x12,
    Revoke: 0x13,
    Destroy: 0x14,
    Archive: 0x15,
    Recover: 0x16,
    Validate: 0x17,
    Query: 0x18,
    Cancel: 0x19,
    Poll: 0x1a,
    Notify: 0x1b,
    Put: 0x1c,
    ReKeyKeyPair: 0x1d,
    DiscoverVersions: 0x1e,
    Encrypt: 0x1f,
    Decrypt: 0x20,
    Sign: 0x21,
    SignatureVerify: 0x22,
    MAC: 0x23,
    MACVerify: 0x24,
    RNGRetrieve: 0x25,
    RNGSeed: 0x26,
    Hash: 0x27,
    CreateSplitKey: 0x28,
    JoinSplitKey: 0x29,
    Import: 0x2a,
    Export: 0x2b,
    Log: 0x2c,
    Login: 0x2d,
    Logout: 0x2e,
    DelegatedLogin: 0x2f,
    AdjustAttribute: 0x30,
    SetAttribute: 0x31,
    SetEndpointRole: 0x32,
    PKCS_11: 0x33,
    Interop: 0x34,
    'Re-Provision': 0x35,
    SetDefaults: 0x36,
    SetConstraints: 0x37,
    GetConstraints: 0x38,
    QueryAsynchronousRequests: 0x39,
    Process: 0x3a,
    Ping: 0x3b,
    CreateGroup: 0x3c,
    Obliterate: 0x3d,
    CreateUser: 0x3e,
    CreateCredential: 0x3f,
    Deactivate: 0x40,
    Encapsulate: 0x41,
    Decapsulate: 0x42,
  }

  it('every op template encodes to its spec-correct Operation codepoint', () => {
    expect(Object.keys(OPERATION_CODEPOINTS)).toHaveLength(66)
    for (const t of OP_TEMPLATES) {
      const expected = OPERATION_CODEPOINTS[t.op]
      expect(expected, `no ground-truth codepoint for op template '${t.op}'`).toBeDefined()
      const wire = toWireTree(leaf('Operation', 'Enumeration', t.op), table)
      const expectedHex = `0x${expected.toString(16).toUpperCase().padStart(8, '0')}`
      expect(wire.value, `${t.op} encoded to the wrong Operation codepoint`).toBe(expectedHex)
    }
  })

  // The 2026-07-17 audit also found three `select`/`algorithm` option values
  // across the Commands tab (a Revoke reason, a Get key format, several
  // algorithm-picker entries) that threw `EncodeError` with zero UI
  // feedback — CommandsView's `OpRow.run()` had no catch. Both are now
  // fixed; this sweeps every option of every param the Commands tab
  // actually offers so the next one fails a test instead of a silent click.
  it('every select/algorithm param option encodes without throwing', () => {
    const runnableAlgorithms = ALGORITHMS.filter(
      (a) => a.value !== AUTO_ALGO && a.runnable !== false
    ).map((a) => a.value)
    expect(runnableAlgorithms.length).toBeGreaterThan(0)

    for (const t of OP_TEMPLATES) {
      const defaults: Record<string, string> = {}
      for (const p of t.params) defaults[p.key] = p.default ?? ''

      for (const p of t.params) {
        const optionsToTry =
          p.kind === 'select' ? (p.options ?? []) : p.kind === 'algorithm' ? runnableAlgorithms : []
        for (const opt of optionsToTry) {
          const values = { ...defaults, [p.key]: opt }
          expect(() => {
            const payload = t.build(values)
            const header = t.headerBuild?.(values) ?? []
            toWireTree(buildRequestWithHeader(t.op, header, payload), table)
          }, `${t.op}.${p.key} = '${opt}' failed to encode`).not.toThrow()
        }
      }
    }
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

  it('ReKeyKeyPair mints a fresh key pair and retires the original (not Discover Versions)', () => {
    const created = run('CreateKeyPair', ops.createKeyPair('ML-DSA-65', 'Sign Verify'))
    expect(created.ok).toBe(true)
    const oldPriv = find(created.namedResponseTree, 'PrivateKeyUniqueIdentifier')?.value as string
    const oldPub = find(created.namedResponseTree, 'PublicKeyUniqueIdentifier')?.value as string
    expect(run('Activate', ops.activate(oldPriv)).ok).toBe(true)

    const rekeyed = run('ReKeyKeyPair', ops.rekeyKeyPair(oldPriv))
    expect(rekeyed.ok).toBe(true)
    const newPriv = find(rekeyed.namedResponseTree, 'PrivateKeyUniqueIdentifier')?.value as string
    const newPub = find(rekeyed.namedResponseTree, 'PublicKeyUniqueIdentifier')?.value as string
    expect(typeof newPriv).toBe('string')
    expect(typeof newPub).toBe('string')
    expect(newPriv).not.toBe(oldPriv)
    expect(newPub).not.toBe(oldPub)

    // No Offset ⇒ the new pair inherits the old (already-past) Activation
    // Date and is born Active, same as the old pair it replaces — so it's
    // immediately usable, proof this was a real re-key and not (as the
    // pre-fix codepoint bug caused) a Discover Versions response that
    // happens to carry no Result Status failure either.
    const signed = run('Sign', ops.sign(newPriv, '68656c6c6f'))
    expect(signed.ok).toBe(true)
    expect(find(signed.namedResponseTree, 'SignatureData')).toBeDefined()
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

  it('WP-C8 direction 1: a KMIP-issued composite cert (ML-DSA-65+ECDSA-P256) parses correctly via derParser.ts', () => {
    // Cross-check #1 of 2 (composite/hybrid remediation plan §WP-C8):
    // this Rust engine's OWN composite encoder, read back by the
    // workshop's independent derParser.ts (not a re-implementation —
    // agreement is the actual check, same principle as WP6-b above).
    const ca = engine.setupDemoCa('ML-DSA-65-ECDSA-P256', 'WP-C8 composite CA')
    expect(ca.ok).toBe(true)

    const created = run('CreateKeyPair', ops.createKeyPair('ML-DSA-65-ECDSA-P256', 'Sign Verify'))
    expect(created.ok).toBe(true)
    const pubUid = find(created.namedResponseTree, 'PublicKeyUniqueIdentifier')?.value as string
    expect(pubUid).toBeDefined()

    const certified = run('Certify', ops.certify(pubUid))
    expect(certified.ok).toBe(true)
    const certUid = find(certified.namedResponseTree, 'UniqueIdentifier')?.value as string
    expect(certUid).toBeDefined()

    const got = run('Get', ops.get(certUid))
    expect(got.ok).toBe(true)
    const certHex = find(got.namedResponseTree, 'Key Material')?.value as string
    expect(certHex).toBeDefined()
    const info = parseCertificateInfo(hexToBytes(certHex))

    // Composite certs use ONE AlgorithmIdentifier for both the outer
    // signature and the SPKI — no separate "public key OID", the same
    // single-arc convention ML-DSA itself uses (unlike RSA/ECDSA, where
    // the signature and SPKI OIDs legitimately differ). certBuilder.ts's
    // buildCompositeCertDraft19 reuses ONE compositeAlgId for both
    // fields too — confirmed by direct read, not assumed.
    expect(info.algorithmOID).toBe(COMPOSITE_MLDSA65_ECDSA_P256_SHA512_OID_STR)
    expect(info.publicKeyOID).toBe(COMPOSITE_MLDSA65_ECDSA_P256_SHA512_OID_STR)
    expect(info.extensionOIDs).toEqual([])

    // Composite SPKI = mldsaPubKey(1952) || ecdsaPubKey(65, uncompressed
    // P-256 point) — draft-19 §4.1, byte-exact split point.
    expect(info.publicKeySizeBytes).toBe(1952 + 65)
    // Composite signature = mldsaSig(3309, fixed) || DER-wrapped
    // Ecdsa-Sig-Value (variable ~70-72 bytes depending on r/s leading-
    // zero padding) — only the fixed ML-DSA floor is an exact bound.
    expect(info.signatureSizeBytes).toBeGreaterThan(3309)

    const valid = run('Validate', ops.validate([], [certUid, ca.certificateUid as string]))
    expect(valid.ok).toBe(true)
    expect(find(valid.namedResponseTree, 'ValidityIndicator')?.value).toBe('0x00000001')
  })

  it('WP-C8 direction 2: an independently-built composite cert (@noble/post-quantum + node:crypto) Validates — cross-engine, no shared code with this Rust engine', async () => {
    // Cross-check #2 of 2. Resolves the plan's flagged open question
    // ("Node has no native ML-DSA signing... a real open question, not
    // a solved problem") — probed 2026-07-10: @noble/post-quantum/
    // ml-dsa.js DOES sign under plain Node (pure JS, no wasm), and its
    // `context` option implements FIPS 204 Algorithm 2's ctx parameter
    // correctly (verified standalone: matching context verifies,
    // missing/wrong context fails) — the one thing that MUST be right
    // for a draft-19 verifier to accept the signature (draft-19 §9.2.3
    // weak/strong non-separability — buildCompositeCertDraft19's own
    // module doc warns "vanilla ML-DSA.Sign without ctx produces
    // signatures a draft-19 verifier rejects").
    //
    // Built via buildCompositeCertDraft19 itself (not hand-rolled, per
    // the plan's direction 2 wording) — mirrors WP6-c's classical-half
    // choice too: node:crypto's legacy sign() for the SAME reason
    // (real DER SEQUENCE(r,s), not WebCrypto's raw r||s).
    const { ml_dsa65 } = await import('@noble/post-quantum/ml-dsa.js')
    const crypto = await import('node:crypto')

    const mldsaKp = ml_dsa65.keygen()
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
    const jwk = publicKey.export({ format: 'jwk' }) as { x: string; y: string }
    const ecPubPoint = new Uint8Array([
      0x04,
      ...Buffer.from(jwk.x, 'base64url'),
      ...Buffer.from(jwk.y, 'base64url'),
    ])

    const cert = await buildCompositeCertDraft19(
      COMPOSITE_PROFILE_MLDSA65_ECDSA_P256_SHA512,
      mldsaKp.publicKey,
      ecPubPoint,
      (mprime, mldsaCtx) =>
        Promise.resolve(ml_dsa65.sign(mprime, mldsaKp.secretKey, { context: mldsaCtx })),
      (mprime) =>
        Promise.resolve(new Uint8Array(crypto.sign('sha512', Buffer.from(mprime), privateKey))),
      '/CN=wp-c8-direction2-external-composite'
    )
    const certHex = Buffer.from(cert).toString('hex')

    const valid = run('Validate', ops.validate([certHex]))
    expect(valid.ok).toBe(true)
    expect(find(valid.namedResponseTree, 'ValidityIndicator')?.value).toBe('0x00000001')

    // A corrupted byte anywhere in the cert (covering both signature
    // components, since it's a single flipped nibble at the end —
    // inside the classical half's DER encoding) must never come back
    // Valid.
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
