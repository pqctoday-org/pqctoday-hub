# Hybrid Cryptography — In Simple Terms

## What This Is About

Transitioning a massive network to brand-new, cutting-edge cryptographic algorithms introduces risk. "Hybrid Cryptography" is the strategy of combining a highly trusted classical algorithm (like X25519) with a new quantum-safe algorithm (like ML-KEM) simultaneously.

## Why It Matters

It provides the ultimate insurance policy. If an unprecedented flaw or vulnerability is unexpectedly discovered in the new quantum-safe algorithm, the classical algorithm is still fully active and protects the data against standard hackers.

## The Key Takeaway

Enterprises should adopt a hybrid approach for TLS and network encryption (using Key Derivation Functions like HKDF) to perfectly intertwine classical and PQC secrets, providing maximum security during the transition years.

## Hybrid in a Validated Module

A security product certified under FIPS 140-3 can offer a hybrid key exchange as an approved service even though one half, such as X25519, is not an approved algorithm. The NIST/CMVP guidance (IG D.S) sets five conditions: an approved ML-KEM, another key exchange (approved or not), an approved way to combine the two secrets, a fixed list of allowed hybrid pairs that the module enforces itself, and module control over the order in which the secrets are joined. The non-approved half is allowed but "no security claimed": the hybrid's claimed strength comes from ML-KEM. If any condition is missing, the hybrid cannot be an approved service. The guidance says the TLS hybrid groups (X25519MLKEM768, SecP256r1MLKEM768, SecP384r1MLKEM1024) may qualify, while the X-Wing hybrid cannot yet, even though NIST's algorithm-testing page lists X-Wing tests. A separate rule, IG 1.B "Hybrid Modules", is about firmware plus hardware in one module and has nothing to do with hybrid key exchange.

## What's Happening

Major tech companies, including Google and Cloudflare, have already deployed hybrid configurations (now X25519MLKEM768, which replaced the earlier X25519Kyber768Draft00) across Chrome and their web infrastructure, proving that hybrid math can be run at scale without severe performance drops.
