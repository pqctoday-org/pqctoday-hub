# SLH-DSA — In Simple Terms

## What This Is About

SLH-DSA (Stateless Hash-Based Digital Signature Algorithm, **FIPS 205**) is NIST's hash-only signature scheme. It doesn't rely on lattices or elliptic curves: its security relies on the presumed difficulty of finding preimages for hash functions, as well as several related properties of the same hash functions (FIPS 205 section 1.1), and is based on nothing else (BSI TR-02102-1 section 5.3.4). If those hash properties hold, SLH-DSA holds.

## Why It Matters

Hash-based signatures were the first quantum-safe construction anyone trusted, but the early designs (LMS and XMSS, both **stateful**) had a brutal operational catch: the signer has to make sure no one-time key is ever used twice, so it must durably keep track of which keys it has already used. Lose that record, even briefly — accidental reboot, accidental restore-from-backup, accidental clone of a VM — and the whole key is compromised. SLH-DSA fixes that by being **stateless**: every signature is fresh, no counter to track, safe in distributed systems, serverless functions, and multi-instance HSMs. The price is signature size — anywhere from 8 KB to 50 KB depending on the parameter set — which makes SLH-DSA the bulky but conservative option compared with ML-DSA's lattice signatures of 2,420 to 4,627 bytes (FIPS 204 Table 2).

## The Key Takeaway

Reach for SLH-DSA when you want **the longest, most conservative security argument available** and you don't sign often: root CAs that issue once a year, firmware images stamped at the factory, code-signing certificates for ten-year-life embedded devices. (Note: SLH-DSA is not part of CNSA 2.0 — NSA's FAQ says it "is not approved for any use in NSS"; NSA's picks there are LMS/XMSS for firmware signing and ML-DSA-87 for general signing.) Reach for ML-DSA when signature size or throughput actually matters — TLS handshakes, JWTs, anything high-volume.

## What's Happening

FIPS 205 published in August 2024 with twelve parameter sets across NIST Levels 1, 3, and 5 (e.g. `SLH-DSA-SHA2-128s`, `SLH-DSA-SHAKE-256f`). The `-s` variants are smaller signatures / slower signing; the `-f` variants are faster signing / larger signatures. PKCS#11 v3.2 defines the SLH-DSA mechanisms (`CKM_SLH_DSA` and the `CKM_HASH_SLH_DSA` family), and the softhsmv3 build this module drives implements them. Support in other libraries varies by product and release, so check each one's own release notes. Our expectation (no source states it): the size cost makes SLH-DSA impractical at the TLS handshake layer, while it suits root-of-trust artifacts where you sign once and verify for decades.

## How It Is Tested

A validated SLH-DSA module is checked three ways. NIST's algorithm tests (ACVP) cover key generation, signing and verification, and a vendor registers options such as the parameter sets, internal or external interface, pure or pre-hash mode and, for signing, deterministic or hedged mode. The module also runs its own self-tests before first use: signing, verifying and key generation each get one, and if pure and pre-hash modes share the same code, testing one covers both. Finally the algorithm validation is only a prerequisite for the module certificate, not a substitute for it. This module's workshop replays eight published NIST verification cases (valid signatures, and ones NIST says must be rejected) through the in-browser engine; those are reference samples, not an official validation.
