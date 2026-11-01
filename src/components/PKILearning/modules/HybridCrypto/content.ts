// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Structured content for the Hybrid Cryptography module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0 } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'hybrid-crypto',
  version: '1.3.0',
  lastReviewed: '2026-10-27',
  lastEdited: '2026-11-01',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('RFC 9794'), // Hybrid terminology
    getStandard('RFC 9881'), // ML-DSA OIDs in X.509
    getStandard('RFC-9909'), // SLH-DSA profile in X.509
    getStandard('RFC-9935'), // ML-KEM OIDs in X.509 — backs the pure-KEM cert format
    getStandard('RFC 9802'), // LMS/XMSS OIDs
    getStandard('NIST SP 800-227'), // KEM recommendations
    getStandard('NIST-FIPS140-3-IG-PQC'), // CMVP IG D.S: when a hybrid KEM is an approved service (Hybrid KEM Construction callout)
    getStandard('draft-ietf-lamps-pq-composite-sigs-19'), // Composite ML-DSA
    getStandard('draft-ietf-lamps-pq-composite-kem-23'), // Composite ML-KEM (draft -23, RFC Editor queue since 2026-10-12; supersedes -22)
    getStandard('RFC-9763'), // Related Certificates
    getStandard('RFC 9629'), // CMS KEMRecipientInfo — how a KEM certificate key is used
    getStandard('RFC-9936'), // ML-KEM in CMS
    getStandard('draft-bonnell-lamps-chameleon-certs-07'), // Chameleon Certificates — expired individual draft, historical design
    getStandard('draft-ietf-lamps-fn-dsa-certificates-00'), // FN-DSA in X.509 — watchlist, OIDs TBD
    getStandard('RFC-9925'), // Unsigned certificates — Advanced example
    getStandard('draft-ietf-lamps-certdiscovery-03'), // Certificate Discovery — Advanced example, OIDs TBD
    // DECLARED 2026-08-22 by writeback_module_declarations.py: documents this
    // module already names to a reader. Mechanical since the four-document
    // sampler cap was lifted the same day — declaring no longer costs coverage.
    getStandard('FIPS 186-5'),
    getStandard('FIPS 205'),
    getStandard('Falcon-Spec-v12'),
    getStandard('NIST SP 800-56A'),
    getStandard('RFC 5869'),
    getStandard('RFC 8017'),
    getStandard('RFC 9180'), // HPKE base spec — see the HPKE section + Step 3 workshop
    getStandard('draft-ietf-hpke-pq'), // PQ/PQ-T hybrid HPKE KEM IDs (MLKEM768-X25519/P256, MLKEM1024-P384)
    getStandard('draft-ietf-cose-hpke'), // HPKE use case: COSE
    getStandard('draft-ietf-jose-hpke-encrypt'), // HPKE use case: JOSE
    getStandard('RFC-9955-Hybrid-Signature-Spectrums'),
    // X25519MLKEM768 deployment and measured cost (sourced 2026-10-22, owner: "source or trim")
    getStandard('Google-Security-Blog-A-new-path-for-Kyber-on-the-web'),
    getStandard('Cloudflare-PQ-Internet-2025'),
    getStandard('AWS-Security-Blog-ML-KEM-Post-Quantum-TLS-in-KMS-ACM-Secrets'),
    getStandard('draft-sheffer-tls-pqc-continuity'),
    // DECLARED 2026-08-23: this module labels a hashing mechanism it describes as conforming to FIPS 180-4
    // (the Secure Hash Standard) and cited nothing for it. Found by
    // audit_module_designation_aliases.py — the literal-id check could not match the
    // prose "FIPS 180-4" against a row filed as FIPS-180-4.
    getStandard('FIPS-180-4'),
    // DECLARED 2026-08-23: this module names "RFC 5480" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('IETF RFC 5480'),
    // DECLARED 2026-08-23: this module names "RFC 8032" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('RFC-8032'),
    // DECLARED 2026-08-23: this module names "RFC 8410" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('RFC-8410'),
    // DECLARED 2026-08-23: this module names "RFC 9846" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('RFC-9846-The-Transport-Layer-Security-TLS-Protocol-Version-1'),
    // DECLARED 2026-08-23: this module names "SP 800-56C" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('NIST-SP-800-56C-R2'),
    // DECLARED 2026-08-23: this module names "SP 800-90A" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('NIST-SP-800-90A-R1'),
    // round 9 wave 4c (2026-09-20): cited for the figures the accuracy record found unmapped
    getStandard('SEC2-v2'), // m-hybrid-crypto: secp256k1; pt-hybrid-certs: secp256k1; pt-hybrid-sigs: secp256k1
    getStandard('CRYSTALS-Dilithium-Spec-v31'), // m-hybrid-crypto: 3,293B
    getStandard('eprint-2025-2059'), // pt-hybrid-sigs: 2059
    // round 9 wave 4c (2026-09-20): cited for the figures the accuracy record found unmapped
    getStandard('RFC-6928'), // m-hybrid-crypto: wave 4c
    // 2026-11-01: "Hybrid or Pure PQC: The Risks" and "Who Recommends Hybrid" sections
    getStandard('ANSSI-PQC-FAQ-2025'),
    getStandard('BSI TR-02102-1'),
    getStandard('BSI-Hinweise-zu-aktuellen-Entwicklungen-um-Classic-McEliece'),
    getStandard('NL-PQC-Migration-Handbook-2024'),
    getStandard('https-nukib-gov-cz-download-publications-en-Annex-20to-20the'),
    getStandard('NSA CNSA 2.0 FAQ'),
    getStandard('UK-NCSC-PQC-Whitepaper-2024'),
    getStandard('CA-CCCS-ITSP-40-111'),
    getStandard('EUCC v2.0 ACM'),
    getStandard('ECCG-ACM-v3-Draft-2026'), // draft, not yet applicable
    getStandard('ENISA-Hybridization-Standardisation-Status'),
    getStandard('ETSI TS 103 744'),
    getStandard('ETSI-TR-103-966'),
    getStandard('RFC-10024'),
    getStandard('draft-ietf-tls-mlkem-07'),
    getStandard('GSMA PQ.03 PQC Guidelines'),
    getStandard('Cloudflare-PostQuantum-Roadmap-2026'),
    getStandard('Bernstein-MLDSA-Bugs-2026'),
    getStandard('Analysis-of-Hybrid-Key-Establishment-and-Standalone-ML-KEM-i'),
    // 2026-11-01: "Combiners Compared, and X-Wing" box and the Step 2 combiner panel
    getStandard('draft-connolly-cfrg-xwing-kem-11'),
    getStandard('draft-irtf-cfrg-concrete-hybrid-kems-04'),
    getStandard('Hybrid-PQ-T-Key-Encapsulation-Mechanisms'),
    // 2026-11-01: "Hybrid in Crypto APIs & HSMs" section, support matrix and PKCS#11 v3.3 box
    getStandard('OpenJDK-JEP-496-ML-KEM'),
    getStandard('OpenJDK-JEP-497-ML-DSA'),
    getStandard('OpenJDK-JEP-527-PQ-Hybrid-TLS13'),
    getStandard('OpenJDK-JEP-452-KEM-API'),
    getStandard('OpenJDK-JEP-510-KDF-API'),
    getStandard('Oracle-JDK-25-0-5-Release-Notes'),
    getStandard('Oracle-JDK-27-Release-Notes'),
    getStandard('JDK-27-Standard-Algorithm-Names'),
    getStandard('BouncyCastle-Java-Release-Notes'),
    getStandard('BouncyCastle-Java-1-86-Release'),
    getStandard('BouncyCastle-Java-Specifications'),
    getStandard('Microsoft-PQC-APIs-GA-2025'),
    getStandard('Microsoft-Windows-PQ-Composite-Features-2026'),
    getStandard('Microsoft-Windows-TLS13-PQC-FAQ-2026'),
    getStandard('Microsoft-Schannel-Kestrel-PQC-GA-2026'),
    getStandard('Microsoft-DotNet-PQC-2025'),
    getStandard('Microsoft-DotNet-11-Libraries'),
    getStandard('Microsoft-DotNet-11-CompositeMLDsa-Windows-Native'),
    getStandard('Microsoft-TLS-Supported-Groups-Win11'),
    getStandard('Microsoft-CNG-Algorithm-Identifiers'),
    getStandard('Microsoft-ADCS-ML-DSA-Overview'),
    getStandard('Microsoft-PQC-Windows-Insiders-Linux-2025'),
    getStandard('Microsoft-SymCrypt-Changelog'),
    getStandard('Microsoft-KB5099536'),
    getStandard('OpenSSL-4-1-0-Release'),
    getStandard('OpenSSL-3-6-Release-Notes'),
    getStandard('OpenSSL-SSL-CTX-set1-curves-3-5'),
    getStandard('Go-1-24-Release-Notes'),
    getStandard('Go-1-26-Release-Notes'),
    getStandard('Go-1-27-Release-Notes'),
    getStandard('Go-crypto-hpke'),
    getStandard('BoringSSL-xwing-h'),
    getStandard('AWS-LC-v5-12-0-Release'),
    getStandard('rustls-0-23-46-Release'),
    getStandard('rustls-0-23-27-Release'),
    getStandard('NSS-3-132-Release-Notes'),
    getStandard('NSS-3-118-Release-Notes'),
    getStandard('NSS-3-105-Release-Notes'),
    getStandard('Firefox-132-Release-Notes'),
    getStandard('wolfSSL-5-9-4-Release'),
    getStandard('liboqs-0-16-0-Release'),
    getStandard('oqs-provider-0-12-0-Release'),
    getStandard('OASIS-PKCS11-TC-v33-Working-Header'),
    getStandard('OASIS-PKCS11-TC-v33-Composite-KEM-Draft'),
    getStandard('OASIS-PKCS11-TC-v33-Composite-Sig-Draft'),
  ],

  algorithms: [
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('X25519'),
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('SLH-DSA-SHA2-128s'),
  ],

  deadlines: [
    {
      label: 'NSA mandates PQC adoption for national security systems',
      year: CNSA_2_0.softwareExclusive,
      source: 'CNSA 2.0',
    },
  ],

  narratives: {
    hybridRationale:
      'Hybrid cryptography solves the dilemma of PQC being newer (less cryptanalysis) while the HNDL threat is real now. For key exchange, the shared secret stays secret as long as either component KEM is unbroken, provided the combiner is a sound one (for example the TLS hybrid design or X-Wing). For signatures, a forgery requires breaking both algorithms, provided the verifier requires both signatures to be valid.',
    anssiMandate:
      'ANSSI recommends hybrid mode for PQC deployments and makes it mandatory inside the French regulated perimeter (classified and Diffusion Restreinte data, vital information systems, certified or qualified products). Exception: for hash-based signatures (SLH-DSA, XMSS, LMS) ANSSI does not recommend systematic hybridisation (ANSSI PQC FAQ 2025).',
    nistRecommendation:
      'NIST SP 800-227 describes how to combine key-establishment mechanisms securely (§4.6). A suitably designed classical/PQC combination can retain security if one component remains secure. Compatibility with existing systems depends on the protocol and the mechanisms each participant supports.',
    certFormatExplain:
      'Seven certificate formats make up the main comparison — five that carry signature keys and two that carry KEM (encryption) keys. Signature formats: Pure PQC (ML-DSA, RFC 9881), Pure PQC (SLH-DSA, RFC 9909), Composite (single OID, both-must-verify, draft-ietf-lamps-pq-composite-sigs-19, in the RFC Editor queue), Alt-Sig (a PQC key and signature in X.509 extensions, ITU-T X.509 (2019)), and Related Certificates (RFC 9763: a new certificate carries a hash of an existing one). KEM formats: Pure PQC KEM (ML-KEM, RFC 9935) and Composite KEM (draft-ietf-lamps-pq-composite-kem-23, in the RFC Editor queue). The subject key and the certificate signature are independent: an ML-KEM key cannot sign, so a KEM certificate is always signed by a separate signing-capable CA. Only Alt-Sig and the classical certificate of a Related Certificates pair remain verifiable by a validator that does not understand PQC; composite is not backward compatible. Two Advanced examples sit outside the main comparison: Certificate Discovery (draft-ietf-lamps-certdiscovery-03, an active draft whose OIDs are still TBD, so its encoding is illustrative) and the RFC 9925 unsigned certificate (no issuer signature, never valid in a certification path). Chameleon certificates (an expired individual draft, never adopted by the LAMPS working group) are shown separately as a historical design.',
    compositeSigSize: '~3,379 bytes (3,309 B ML-DSA-65 + 64 B ECDSA P-256 + 6 B of encoding)',
    altSigSize: '2,017 bytes',
    relatedStandards:
      'Planned FIPS 206 (FN-DSA), cited above as a future pure-PQC signature format, remains in development with no published public draft or final text. This hub cites the distinct Falcon v1.2 candidate specification without presenting it as FIPS 206. The LAMPS working group has started draft-ietf-lamps-fn-dsa-certificates for FN-DSA in X.509, but its OIDs are still TBD, so no deployable FN-DSA certificate exists yet.',
    hpkeDefinition:
      "HPKE (RFC 9180) is a public-key encryption scheme built from three swappable components — a KEM, a KDF, and an AEAD — combined through a standard KeySchedule so any KEM/KDF/AEAD triple, plus one of four modes (Base, PSK, Auth, AuthPSK), yields an interoperable construction. It is not itself a hybrid-vs-classical choice: RFC 9180's own KEM registry is all-classical (DHKEM over P-256/P-384/P-521/X25519/X448). The PQC angle comes from draft-ietf-hpke-pq, which registers PQ and PQ/T hybrid KEM IDs (pure ML-KEM, and MLKEM768-X25519 / MLKEM768-P256 / MLKEM1024-P384 hybrids) that plug into the exact same KeySchedule and Seal/Open — still an Internet-Draft, not yet an RFC.",
    hpkeUseCases:
      'MLS (RFC 9420) uses HPKE for its TreeKEM path updates. TLS 1.3 Encrypted Client Hello (ECH) uses it to encrypt the ClientHello. draft-ietf-jose-hpke-encrypt and draft-ietf-cose-hpke extend it to JOSE/COSE, so it can wrap a JWT or CWT payload the same way. All four share one property: a KEM’s Encaps takes the recipient’s public key (plus a parameter set) and returns both a shared secret and the ciphertext; the sender does not hand it a key of its own choosing, whereas in key transport (for example RSA-OAEP) one party selects the key and transmits it. HPKE’s Encap is a randomized algorithm that generates an ephemeral shared secret and its encapsulation.',
    hpkeAuthLimitation:
      'RFC 9180\'s Auth and AuthPSK modes require the KEM to expose AuthEncap/AuthDecap. Every classical DHKEM in RFC 9180 supports this; draft-ietf-hpke-pq\'s ML-KEM and PQ/T hybrid KEM entries mark the Auth column "no" — so Auth/AuthPSK stay classical-only until a future KEM adds it.',
    hpkeNoNativeMechanism:
      'PKCS#11 v3.2 has no CKM_HPKE mechanism (checked against the canonical v3.2 header — no HPKE entry exists at all). A real HSM deployment of HPKE composes it from mechanisms the spec does define: CKM_ECDH1_DERIVE / CKM_ML_KEM for the KEM leg, CKM_HKDF_DERIVE plus C_Sign(CKM_SHA*_HMAC) for LabeledExtract/LabeledExpand, and CKM_AES_GCM / CKM_CHACHA20_POLY1305 for Seal/Open. The Step 7 workshop below does exactly that, cross-checked byte-for-byte against RFC 9180 Appendix A.',
  },
}
