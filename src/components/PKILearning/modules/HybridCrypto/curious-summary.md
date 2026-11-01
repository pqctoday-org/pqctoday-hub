# Hybrid Cryptography — In Simple Terms

## What This Is About

Transitioning a massive network to brand-new, cutting-edge cryptographic algorithms introduces risk. "Hybrid Cryptography" is the strategy of combining a highly trusted classical algorithm (like X25519) with a new quantum-safe algorithm (like ML-KEM) simultaneously.

## Why It Matters

It is a hedge. If a flaw is found in the new quantum-safe algorithm or in its new code, the classical algorithm still protects the data against today's attackers, provided the two are combined soundly. The hedge has costs: two algorithms to implement, test and negotiate, larger messages, and a second transition later when the classical part is removed. For signatures, every verifier must insist on both signatures, or an attacker can strip one.

## Who Recommends It

Agencies disagree. France (ANSSI), Germany (BSI), the Netherlands and the EU certification group ask for hybrid during the transition. The US NSA, the UK NCSC and the Czech NÚKIB accept post-quantum algorithms on their own, and the NSA warns that hybrids add complexity that can introduce their own flaws. Canada's Cyber Centre recommends the new algorithms without saying either way.

## The Key Takeaway

Whether to use hybrid depends on whose rules apply to you and on what you protect. For key exchange in TLS, hybrid is already the common default on the web. For signatures and certificates the formats are newer and the advice is more divided.

## Hybrid in a Validated Module

A security product certified under FIPS 140-3 can offer a hybrid key exchange as an approved service even though one half, such as X25519, is not an approved algorithm. The NIST/CMVP guidance (IG D.S) sets five conditions: an approved ML-KEM, another key exchange (approved or not), an approved way to combine the two secrets, a fixed list of allowed hybrid pairs that the module enforces itself, and module control over the order in which the secrets are joined. The non-approved half is allowed but "no security claimed": the hybrid's claimed strength comes from ML-KEM. If any condition is missing, the hybrid cannot be an approved service. The guidance says the TLS hybrid groups (X25519MLKEM768, SecP256r1MLKEM768, SecP384r1MLKEM1024) may qualify, while the X-Wing hybrid cannot yet, even though NIST's algorithm-testing page lists X-Wing tests. A separate rule, IG 1.B "Hybrid Modules", is about firmware plus hardware in one module and has nothing to do with hybrid key exchange.

## What's Happening

Major tech companies, including Google and Cloudflare, have already deployed hybrid configurations (now X25519MLKEM768, which replaced the earlier X25519Kyber768Draft00) across Chrome and their web infrastructure, showing that hybrid key exchange runs at scale; Chrome reported about a 4% slower TLS handshake.
