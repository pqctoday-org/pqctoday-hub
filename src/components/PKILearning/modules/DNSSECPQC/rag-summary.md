# DNSSEC & Post-Quantum Signatures

## Overview

This module explains how DNSSEC — the DNS Security Extensions that sign DNS answers to prove authenticity and integrity — is moving to post-quantum signatures. It covers why DNSSEC's PQC motivation is forgery risk rather than harvest-now-decrypt-later (DNSSEC is signature-only, not confidential), the ML-DSA-44 mechanism behind IANA DNSSEC algorithm 18 (draft-westerbaan-dnssec-mldsa), Cloudflare's real 2026-09-10 deployment (1.1.1.1 validating by default against the dnstest.dev signed test zone), the signature-size problem that makes this an unusually hard PQC migration, and what remains before production zones can actually be signed.

## Key Concepts

- **DNSSEC basics** (RFC 4034, RFC 9364/BCP 237) — DS/DNSKEY/RRSIG resource records chain trust from the DNS root down through each delegated zone to the signed answer; signature-only, no confidentiality dimension
- **Forgery, not harvesting** — because DNSSEC has no ciphertext, the quantum threat is a future quantum computer forging RSA/ECDSA signatures the day it exists, not decrypting captured traffic later
- **ML-DSA-44 for DNSSEC** (current draft-westerbaan-dnssec-mldsa-04, an individual Internet-Draft, not an IETF standard) — defines DS/DNSKEY/RRSIG use of ML-DSA-44 (FIPS 204's smallest parameter set); IANA algorithm 18 (MLDSA44) currently has MAY values for use/implementation in signing and validation. IANA's reference is draft-03; draft-04 says it defines the same codepoint. Public key 1,312 bytes, signature 2,420 bytes
- **The size problem** — 2,420-byte ML-DSA-44 signatures are ~38x larger than ECDSA P-256's 64 bytes and exceed a common conservative ~1,232-byte UDP payload limit (RFC 9715 recommends up to 1,400 bytes), needing another transport, normally TCP; SLH-DSA alternatives run even larger (7,856+ bytes)
- **Downgrade risk** (RFC 6840 §5.11) — a lenient validator accepting any single valid signature path can be tricked into accepting a stripped classical signature if a zone is dual-signed; the fix is requiring algorithm 18 whenever the zone's DS record advertises it
- **Cloudflare's real pilot** (2026-09-10 blog post) — 1.1.1.1 validates ML-DSA-44 by default; dnstest.dev is a live, ML-DSA-44-signed test zone; this is resolver-side validation only, not production zone signing
- **What's missing** — authoritative-side signing support and registrar DS-record support are Cloudflare's own stated next steps; end-to-end PQ DNSSEC also needs the root and other registries to adopt algorithm 18, beyond what Cloudflare alone can deliver
- **Distinct dates and scenarios** — Cloudflare's ~2029 target is its own company-wide post-quantum security goal (not a DNSSEC-specific date). The RSA-to-RSA KSK-2024 rollover began 11 October 2026. Separately, ICANN's 2 March 2026 proposal for a classical algorithm rollover describes ECDSA key generation in 2027 and RSA key decommissioning in 2030; it invites feedback before execution. Verisign's December 2023 comments describe a possible later PQ rollover in the mid-2030s, a conditional scenario, not an ICANN plan or forecast.
- **Parallel size-mitigation drafts** — draft-sheth-pqc-dnssec-strategy surveys SLH-DSA-MTL/Falcon/XMSS/LMS candidates; the Fregly SLH-DSA-MTL draft -06 expired 1 October 2026; the Fregly and Kaizer individual drafts explore Merkle Tree Ladder mode with SLH-DSA and ML-DSA respectively. They are not IETF standards or working-group-adopted documents

## Workshop / Interactive Activities

The workshop has 3 steps:

1. **Signature Size Explorer** — compare RSA-2048, ECDSA P-256, Ed25519, ML-DSA-44, and SLH-DSA-SHA2-128s signature sizes against the ~1,232-byte DNS UDP ceiling; both PQ options shown exceed it
2. **PQ Validation Chain Walkthrough** — root → TLD → domain trust chain, toggling between "today" (algorithm 18 exists only at the dnstest.dev leaf) and "full deployment" (algorithm 18 at every level up to the root)
3. **Deployment Roadmap Tracker** — Cloudflare's own roadmap (resolver validation done → authoritative signing → registrar DS support → ~2029 company-wide PQ target) versus the DNS root's separate rollovers (the classical ICANN/IANA first rollover and Verisign's conditional mid-2030s scenario for a second)

## Related Standards

- RFC 4034 (DNSSEC resource records)
- RFC 9364 / BCP 237 (DNSSEC, consolidated)
- draft-westerbaan-dnssec-mldsa (ML-DSA-44 for DNSSEC, IANA algorithm 18)
- draft-sheth-pqc-dnssec-strategy (PQC strategy survey for DNSSEC)
- draft-fregly-dnsop-slh-dsa-mtl-dnssec (SLH-DSA Merkle Tree Ladder mode)
- draft-kaizer-dnsop-ml-dsa-mtl-dnssec (ML-DSA Merkle Tree Ladder mode)
- FIPS 204 (ML-DSA)
- Cloudflare blog, "1.1.1.1 now supports post-quantum DNSSEC" (2026-09-10)
