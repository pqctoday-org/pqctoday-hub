# Crypto Agility — In Simple Terms

## What This Is About

Crypto agility is the engineering capability to rapidly switch cryptographic algorithms, protocols, and provider implementations without rewriting the underlying application code. Larger keys and signatures, new encodings and new call patterns (a KEM is not an encryption function) still need review and testing.

## Why It Matters

Migrating to new algorithms requires locating every piece of cryptography in an enterprise via a Cryptographic Bill of Materials (CBOM). Without agility patterns—like relying on Provider Models, Service Meshes, or External HSMs—replacing these broken algorithms forces massive, expensive code rewrites.

## The Key Takeaway

The transition demands architectural patterns that completely decouple the cryptographic math from the business application. As algorithms get heavier, these patterns protect the app. For example, when Cloudflare enabled hybrid PQC key exchange, the key size grew from 32 bytes to 1,216 bytes, but the core network routing code remained untouched.

## What's Happening

NIST devotes a white paper, CSWP 39, to crypto agility. Tech giants are already utilizing this agility—Google Chrome and Apple's iMessage have natively enabled hybrid PQC key exchanges through rapid, phased rollouts.
