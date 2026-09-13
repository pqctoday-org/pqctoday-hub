# DNSSEC & Post-Quantum Signatures

## Overview

This module explains how DNSSEC — the DNS Security Extensions that sign DNS answers to prove authenticity and integrity — is moving to post-quantum signatures. It covers why DNSSEC's PQC motivation is forgery risk rather than harvest-now-decrypt-later (DNSSEC is signature-only, not confidential), the ML-DSA-44 mechanism behind IANA DNSSEC algorithm 18 (draft-westerbaan-dnssec-mldsa), Cloudflare's real 2026-09-10 deployment (1.1.1.1 validating by default against the dnstest.dev signed test zone), the signature-size problem that makes this an unusually hard PQC migration, and what remains before production zones can actually be signed.

## Key Concepts

- **DNSSEC basics** (RFC 4034, RFC 9364/BCP 237) — DS/DNSKEY/RRSIG resource records chain trust from the DNS root down through each delegated zone to the signed answer; signature-only, no confidentiality dimension
- **Forgery, not harvesting** — because DNSSEC has no ciphertext, the quantum threat is a future quantum computer forging RSA/ECDSA signatures the day it exists, not decrypting captured traffic later
- **ML-DSA-44 for DNSSEC** (draft-westerbaan-dnssec-mldsa-04, Westerbaan/Cloudflare and Schmieg/Google) — defines DS/DNSKEY/RRSIG use of ML-DSA-44 (FIPS 204's smallest parameter set); IANA has assigned DNSSEC algorithm number 18 (mnemonic MLDSA44); public key 1,312 bytes, signature 2,420 bytes
- **The size problem** — 2,420-byte ML-DSA-44 signatures are ~38x larger than ECDSA P-256's 64 bytes and exceed DNS's practical ~1,232-byte UDP response ceiling, forcing TCP fallback; SLH-DSA alternatives run even larger (7,856+ bytes)
- **Downgrade risk** (RFC 6840 §5.11) — a lenient validator accepting any single valid signature path can be tricked into accepting a stripped classical signature if a zone is dual-signed; the fix is requiring algorithm 18 whenever the zone's DS record advertises it
- **Cloudflare's real pilot** (2026-09-10 blog post) — 1.1.1.1 validates ML-DSA-44 by default; dnstest.dev is a live, ML-DSA-44-signed test zone; this is resolver-side validation only, not production zone signing
- **What's missing** — authoritative-side signing support, then registrar DS-record support, are Cloudflare's own next steps; their full-path target is ~2029
- **Two distinct estimates** — Cloudflare's ~2029 target is a vendor roadmap; the DNS root zone's own algorithm rollover is a separate, broader estimate of mid-2030s (Verisign), since the root must wait for PQ support at every delegation level
- **Parallel size-mitigation drafts** — draft-sheth-pqc-dnssec-strategy surveys SLH-DSA-MTL/Falcon/XMSS/LMS candidates; draft-fregly-dnsop-slh-dsa-mtl-dnssec and draft-kaizer-dnsop-ml-dsa-mtl-dnssec both apply Merkle Tree Ladder mode (to SLH-DSA and ML-DSA respectively) to shrink per-query signature cost; none has IETF working-group status yet

## Workshop / Interactive Activities

The workshop has 3 steps:

1. **Signature Size Explorer** — compare RSA-2048, ECDSA P-256, Ed25519, ML-DSA-44, and SLH-DSA-SHA2-128s signature sizes against the ~1,232-byte DNS UDP ceiling; both PQ options shown exceed it
2. **PQ Validation Chain Walkthrough** — root → TLD → domain trust chain, toggling between "today" (algorithm 18 exists only at the dnstest.dev leaf) and "full deployment" (algorithm 18 at every level up to the root)
3. **Deployment Roadmap Tracker** — Cloudflare's own roadmap (resolver validation done → authoritative signing → registrar DS support → ~2029 full PQ) versus the DNS root's separate mid-2030s rollover estimate

## Related Standards

- RFC 4034 (DNSSEC resource records)
- RFC 9364 / BCP 237 (DNSSEC, consolidated)
- draft-westerbaan-dnssec-mldsa (ML-DSA-44 for DNSSEC, IANA algorithm 18)
- draft-sheth-pqc-dnssec-strategy (PQC strategy survey for DNSSEC)
- draft-fregly-dnsop-slh-dsa-mtl-dnssec (SLH-DSA Merkle Tree Ladder mode)
- draft-kaizer-dnsop-ml-dsa-mtl-dnssec (ML-DSA Merkle Tree Ladder mode)
- FIPS 204 (ML-DSA)
- Cloudflare blog, "1.1.1.1 now supports post-quantum DNSSEC" (2026-09-10)
