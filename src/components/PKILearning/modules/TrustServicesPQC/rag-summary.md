# Trust Services & Signature Longevity

## Overview

The Trust Services module covers the part of the eIDAS world that has to plan in decades rather than in release cycles. It teaches qualified versus advanced electronic signatures, RFC 3161 timestamping as proof of existence, the five stages by which a signature degrades over thirty years, the ETSI cryptographic suites that gained post-quantum modes in June 2026, and why trust service provider conformity assessment makes migration slow even once the algorithms are settled. Its central argument is crypto agility demonstrated from documents rather than asserted from principle: the same ETSI standard, eighteen months apart, with and without a post-quantum path.

## Key Concepts

- **A qualified electronic signature carries legal equivalence to a handwritten one**, so the operative question is not "is this signature valid now" but "can a court establish that it was valid when it was made" — potentially decades later. That reframes migration from an algorithm-swap problem into an evidence-preservation problem
- **RFC 3161 is algorithm-agnostic, and that is the quiet hinge of the whole area.** The signing algorithm comes from the TSA's certificate, not from the protocol. A Time Stamping Authority can therefore migrate to ML-DSA without any protocol change at all. The layer that has to move is the trust list and the validation policy, not the wire format
- **A timestamp is a proof of existence**: a TSA signs a hash of the data plus a time. That is what allows a signature made with a certificate since revoked — or with an algorithm since broken — to still be evaluated against the moment it was made
- **Long-term validation degrades in five stages**, each with a remedy that must be in place _before_ the stage arrives:
  - **Day 0 — signature creation.** No risk yet. Sign, and capture a qualified timestamp at the moment of signing
  - **1–3 years — certificate expiry.** The signing certificate expires; without evidence of when the signature was made, verification becomes ambiguous. The day-0 timestamp is what carries the signature past this point
  - **3–10 years — revocation data ages out.** CRLs and OCSP responses are no longer retrievable, so a verifier cannot establish the certificate was good at signing time. Archive revocation data alongside the signature (the LTV form)
  - **5–20 years — the signing algorithm weakens.** The original algorithm is deprecated or broken; a CRQC breaks RSA and ECDSA outright. Re-timestamp with a current algorithm before the old one becomes untrustworthy — each new timestamp attests to the whole previous structure, so the chain stays evaluable
  - **20–30+ years — archival horizon.** Land registries, notarial deeds and medical consent can outlive several algorithm generations. A repeated re-timestamping policy is the only mechanism that survives this, and it has to be planned at signing time; it cannot be retrofitted once the evidence is gone
- **The real deadline is not the CRQC date.** It is the date by which every signature already made must be re-timestamped under a quantum-safe algorithm — and that work is proportional to the size of the archive, not to the flow of new signatures. This is the single most under-estimated figure in the area
- **ETSI TS 119 312 V2.1.1 (June 2026) supersedes V1.5.1 (December 2024).** The older edition names only RSA and ECDSA; the newer adds ML-DSA, SLH-DSA, LMS, XMSS and hybrid modes. Eighteen months apart, same standard, same committee — anything built against V1.5.1 has no post-quantum path in it at all, not because the design was wrong but because the suites document had not caught up
- **ETSI requires both halves of a hybrid signature to verify.** TS 119 312 V2.1.1 clause 6.4.1: implementations shall combine a classical signature and a post-quantum signature, and acceptance requires both signatures to be valid. This is the exact opposite default to NSA CNSA 2.0, which does not require hybrids for National Security Systems and lists concrete objections to them. Neither is wrong — they protect different things over different lifetimes, and which applies is a jurisdiction question rather than a cryptography one
- **TS 119 312 V2.1.1, Table 3.3 — the approved hybrid pairs**: RSA-PSS (≥ 3000 bit) with ML-DSA-65 for general purpose and certificates, or with ML-DSA-87 for high security and long term; ECDSA P-256/P-384 with ML-DSA-65, or P-384/P-521 with ML-DSA-87; EdDSA Ed25519 with ML-DSA-65, or Ed448 with ML-DSA-87; and ECDSA or EdDSA with SLH-DSA at Level 3 or 5 for the conservative hash-based option
- **A withdrawn standard is a live citation risk.** TS 119 312 V2.1.1 marks its predecessor explicitly: ETSI TS 102 176-1 is withdrawn and superseded by TS 119 312. It was the reference for years and is still widely linked, so citing it remains an easy mistake to make
- **ETSI EN 319 422 V1.1.1 (March 2016) is still the current published timestamp profile.** It profiles RFC 3161 and RFC 5816 for European qualified timestamps and names no algorithm itself, deferring entirely to TS 119 312. The European Commission concluded in October 2025 that it needs updating for eIDAS 2.0, with a replacement Technical Specification targeted for **31 May 2027**. That is a standards-body target, not a compliance deadline
- **Conformity assessment is why this moves slowly.** Even once algorithms are settled, a qualified trust service provider's supervisory and audit regime governs how fast a change can actually be adopted in production

## Workshop / Interactive Activities

The workshop has 3 hands-on tools:

1. **Signature Longevity Calculator** — pick a validity horizon and see which degradation stages apply, and when an existing archive must be re-timestamped
2. **Standards Supersession Explorer** — the same ETSI standard before and after PQC, with the superseded edition marked, including the TS 102 176-1 withdrawal
3. **Hybrid Suite Picker** — TS 119 312 V2.1.1 Table 3.3, filtered by use case

## Related Standards

ETSI TS 119 312 V2.1.1 (June 2026) is the current cryptographic suites specification, superseding V1.5.1 (December 2024) and marking ETSI TS 102 176-1 withdrawn. ETSI EN 319 422 V1.1.1 (March 2016) remains the current published time-stamping protocol and token profile, with a replacement targeted for 31 May 2027. ETSI EN 319 411 governs policy and security requirements for trust service providers issuing certificates. RFC 3161 (August 2001, Standards Track) defines the Time-Stamp Protocol, updated by RFC 5816 for ESSCertIDv2. eIDAS (EU 910/2014) and eIDAS 2.0 (EU 2024/1183) are the governing regulations, with the Cloud Signature Consortium API v2 specification covering remote signing. Underlying algorithm standards are FIPS 204 (ML-DSA) and FIPS 205 (SLH-DSA).

Cross-reference: the **Government & Defense** module reaches the opposite hybrid default for US National Security Systems, and the **Hybrid Cryptography** module covers the combiner constructions themselves.
