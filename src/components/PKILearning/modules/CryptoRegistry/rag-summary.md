# CycloneDX Cryptography Registry

## Overview

The Crypto Registry module teaches the CycloneDX v1.7 Cryptography Registry: a standalone, versioned catalog of 96 cryptographic algorithm families (across 14 primitive types — signature, KEM/PKE, key-agreement, block/stream cipher, AEAD, MAC, hash, XOF, KDF, key-wrap, DRBG) and 246 elliptic curves (across 15 standardization categories — NIST, SECG, Brainpool, ANSSI, BLS, GOST, X9.62/X9.63, and more). It solves the "one mechanism, many names" problem: the same algorithm or curve is named differently by an HSM (PKCS#11 mechanism), a certificate (OID), a protocol (code point), a library (config string), and a JOSE/JWT service (`alg` value) — the registry gives every one of these a single canonical resolution target. PQC families (ML-KEM, ML-DSA, SLH-DSA, XMSS, LMS) are registered as first-class entries alongside classical algorithms, not a separate list. The registry is published independently of the CycloneDX specification (own JSON + JSON Schema, own version cadence) and is explicitly designed for use outside CBOM/CycloneDX tooling entirely. Out of scope: the full CBOM document model and layered crypto-discovery methodology (covered by the `cbom` module, which this module cross-links).

## Sub-topics keywords

CycloneDX Cryptography Registry, CycloneDX 1.7, cryptographic algorithm family, elliptic curve registry, algorithm normalization, canonical naming, OID resolution, PKCS#11 mechanism, JOSE alg value, ES256, CKM_ECDSA_SHA256, secp256r1, prime256v1, P-256, curve alias, ML-KEM, ML-DSA, SLH-DSA, XMSS, LMS, PQC algorithm family, quantum-safe lookup, crypto asset identification, cross-notation identifier, standardization reference, RFC FIPS ISO, CBOM tooling interoperability, cdxgen, CBOMkit, sonar-cryptography.
