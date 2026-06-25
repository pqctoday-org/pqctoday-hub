# Cryptography Bill of Materials — For the Curious

## What This Is About

Imagine trying to replace every lock in a huge building, but nobody has a list of where the locks are — and some were installed years ago by people who have left. A CBOM is that missing list, for cryptography: a machine-readable inventory of every algorithm, key, certificate and protocol, and where each is used.

## Why It Matters

Quantum computers will eventually break today's public-key cryptography (RSA, ECC). Before an organization can swap those out, it has to find them all — including the "ghost" crypto nobody tracks. The clever part is that you don't buy yet another scanner: you reuse the tools you already run (vulnerability scanners, certificate managers, cloud posture tools) as sources, and only scan new where you're genuinely blind, such as source code or container images.

## The Key Takeaway

The same key can show up four different ways — an HSM handle, a certificate thumbprint, a line of source code, a network handshake — and the trick to recognizing it's all one key is a "fingerprint" computed from the key itself. Once everything is found, named consistently, and tied to a key you can trace, software can automatically flag what's quantum-safe and what still needs to change.
