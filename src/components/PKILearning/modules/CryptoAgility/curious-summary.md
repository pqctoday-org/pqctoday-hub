# Crypto Agility — In Simple Terms

## What This Is About

Crypto agility is the engineering capability to rapidly switch cryptographic algorithms, protocols, and provider implementations without rewriting the underlying application code. Larger keys and signatures, new encodings and new call patterns (a KEM is not an encryption function) still need review and testing.

## Why It Matters

Migrating to new algorithms requires locating every piece of cryptography in an enterprise via a Cryptographic Bill of Materials (CBOM). Without agility patterns—like relying on Provider Models, Service Meshes, or External HSMs—replacing these broken algorithms forces massive, expensive code rewrites.

## The Key Takeaway

The transition demands architectural patterns that decouple cryptographic choices from application logic. For example, a hybrid TLS client key share combines X25519 and ML-KEM-768 material and is 1,216 bytes, compared with 32 bytes for X25519 alone. Application code still needs to handle the larger share and related encoding changes.

## What's Happening

NIST's current crypto-agility white paper is CSWP 39-upd1. Google Chrome and Apple's iMessage have deployed hybrid post-quantum key agreement in phased rollouts.
