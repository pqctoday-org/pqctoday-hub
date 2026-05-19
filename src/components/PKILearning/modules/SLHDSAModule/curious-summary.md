# SLH-DSA — In Simple Terms

## What This Is About

SLH-DSA (Stateless Hash-Based Digital Signature Algorithm, **FIPS 205**) is NIST's hash-only signature scheme. It doesn't rely on lattices, elliptic curves, or any algebraic hardness assumption — its security comes from one thing: that the underlying hash function (SHA-2 or SHAKE) keeps doing what hash functions are supposed to do. If hashes hold, SLH-DSA holds.

## Why It Matters

Hash-based signatures were the first quantum-safe construction anyone trusted, but the early designs (LMS and XMSS, both **stateful**) had a brutal operational catch: the signer has to remember every signature it ever produced, forever. Lose that counter, even briefly — accidental reboot, accidental restore-from-backup, accidental clone of a VM — and the whole key is compromised. SLH-DSA fixes that by being **stateless**: every signature is fresh, no counter to track, safe in distributed systems, serverless functions, and multi-instance HSMs. The price is signature size — anywhere from 8 KB to 50 KB depending on the parameter set — which makes SLH-DSA the bulky-but-rock-solid option compared with ML-DSA's 2–4 KB lattice signatures.

## The Key Takeaway

Reach for SLH-DSA when you want **the longest, most conservative security argument available** and you don't sign often: root CAs that issue once a year, firmware images stamped at the factory, code-signing certificates for ten-year-life embedded devices. CNSA 2.0 explicitly permits it as the stateless alternative to LMS/XMSS. Reach for ML-DSA when signature size or throughput actually matters — TLS handshakes, JWTs, anything high-volume.

## What's Happening

FIPS 205 published in August 2024 with twelve parameter sets across NIST Levels 1, 3, and 5 (e.g. `SLH-DSA-SHA2-128s`, `SLH-DSA-SHAKE-256f`). The `-s` variants are smaller signatures / slower signing; the `-f` variants are faster signing / larger signatures. OpenSSL 3.5+, BoringSSL, Bouncy Castle, and PKCS#11 v3.2 HSMs (including the softhsmv3 build this module drives) all ship SLH-DSA today. Major browsers and TLS stacks have flagged it as a deferred candidate — the size cost makes it impractical at the handshake layer, but it remains the go-to for root-of-trust artifacts where you sign once and verify for decades.
