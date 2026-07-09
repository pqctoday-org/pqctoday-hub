# CycloneDX Cryptography Registry — In Simple Terms

## What This Is About

Every tool that looks at your cryptography names it differently. An HSM calls something `CKM_ECDSA_SHA256`. A certificate calls the same thing an OID like `1.2.840.10045.4.3.2`. A login service calls it `ES256`. A network capture calls it `0x0403`. They're all the same signing mechanism — but nothing about the names tells you that.

The CycloneDX Cryptography Registry is a shared dictionary that fixes this: one canonical name for each cryptographic algorithm family (96 of them) and each elliptic curve (246 of them), each backed by a real standard. Once every tool's output is translated into this dictionary, you can finally ask questions like "which of our systems still use something quantum-vulnerable?" and get a real answer — because "ECDSA" means the same thing everywhere, instead of five different strings that happen to describe the same math.

## Why It Matters

Post-quantum readiness starts with knowing what cryptography you actually have. New algorithms like ML-KEM and ML-DSA are registered in this same dictionary right alongside RSA and AES, so checking "is this quantum-safe?" is a lookup, not a research project.

## Try It Yourself

The workshop in this module lets you type in a messy, real-world identifier — the kind a scanner or certificate would actually report — and watch it resolve to its canonical name, plus the standard that defines it.
