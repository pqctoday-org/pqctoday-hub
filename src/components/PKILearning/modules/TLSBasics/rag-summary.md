# TLS 1.3 Basics

## Overview

The TLS Basics module provides a comprehensive introduction to Transport Layer Security 1.3 (RFC 8446) and its post-quantum cryptography integration. It covers the TLS 1.3 protocol improvements over TLS 1.2, the 1-RTT handshake process, cipher suite simplification, key exchange mechanisms (classical ECDH, pure PQC ML-KEM, and hybrid X25519MLKEM768), the HKDF-based key schedule, and the trade-offs of PQC migration in TLS. The module also covers active quantum downgrade attacks that threaten the transition period — where an adversary suppresses PQC negotiation entirely — and the layered mitigations developed by Bas Westerbaan (Cloudflare Research) and the IETF: maximum compatibility mode, PQ Lock/PQC HSTS, and PQC Continuity. The module includes a live TLS handshake simulator powered by OpenSSL WASM that demonstrates real handshake operations with configurable client and server parameters, including a downgrade attack scenario.

## Key Concepts

- **TLS 1.3 improvements**: removed RSA key exchange (no forward secrecy), CBC cipher modes, renegotiation, and compression; added mandatory ECDHE forward secrecy, 0-RTT early data, and encrypted handshake messages; simplified to 5 cipher suites and 1-RTT handshake
- **TLS 1.3 cipher suites** specify only symmetric encryption and hash (key exchange negotiated separately): TLS_AES_256_GCM_SHA384, TLS_AES_128_GCM_SHA256, TLS_CHACHA20_POLY1305_SHA256, TLS_AES_128_CCM_SHA256, TLS_AES_128_CCM_8_SHA256
- **Key exchange approaches**:
  - **Classical (ECDH)** — X25519, P-256, P-384; fast with small keys (~32 bytes); quantum-vulnerable
  - **PQC (ML-KEM)** — ML-KEM-512/768/1024; quantum-resistant; larger keys (~1,184 bytes for ML-KEM-768)
  - **Hybrid** — X25519MLKEM768 combines both; already deployed in Chrome and Firefox; secure even if one algorithm is broken
- **HKDF key schedule**: derives all session keys through Extract and Expand operations — Early Secret (from PSK), Handshake Secret (from ECDHE/KEM shared secret, producing client and server handshake traffic secrets), and Master Secret (producing application traffic secrets)
- **Forward secrecy** — TLS 1.3 mandates ephemeral key exchange for every connection; session keys cannot be recovered even if long-term keys are compromised
- **HNDL threat** — adversaries can record TLS-encrypted traffic today and decrypt it once quantum computers break the ECDH key exchange, recovering the symmetric session keys
- **PQC size trade-off** — ML-KEM-768 public keys are approximately 1,184 bytes versus 32 bytes for X25519, increasing handshake overhead
- **Mutual TLS (mTLS)** — the simulator supports both standard TLS and mutual authentication where both client and server present certificates
- **PQC certificate support** — the simulator includes pre-loaded ML-DSA-65 and ML-DSA-87 certificates for testing post-quantum authentication
- **Quantum downgrade attack** (Westerbaan/Cloudflare) — an active MITM adversary intercepts the ClientHello and removes the ML-KEM key_share entry, forcing a fallback to classical-only ECDH; distinct from passive HNDL harvesting because it actively prevents PQC even when both endpoints support it
- **Maximum compatibility mode** — the default server posture during transition: serve a classical certificate to any client, PQC only to capable clients; eliminates breakage but provides zero protection against downgrade attacks, and is fundamentally incompatible with PQC Continuity enforcement
- **PQ Lock / PQC HSTS** — an HTTP-layer signal where a server tells the browser it supports PQC key exchange; the browser caches this signal and refuses future connections that omit PQC (implemented in Chromium, analogous to HSTS); provides session-level downgrade protection once the first PQC connection succeeds
- **PQC Continuity / downgrade limit** (`draft-sheffer-tls-pqc-continuity`, Sheffer; Westerbaan et al.) — a TLS-layer cached commitment: the server declares a duration (the "downgrade limit," e.g., one year) and the client caches it, refusing classical-only connections within that window; pins the server to PQC across connection gaps, closing the attack surface that PQ Lock leaves open for first-visit interception

## Workshop / Interactive Activities

The workshop is a live TLS handshake simulator with the following features:

- **Client Configuration Panel** — configure TLS version, cipher suites, key exchange groups, supported signature algorithms, and client certificates
- **Server Configuration Panel** — configure server certificates (classical RSA/ECDSA or PQC ML-DSA), cipher preferences, mutual TLS settings, and trust store management
- **Full Handshake Simulation** — runs a complete TLS 1.3 handshake via OpenSSL WASM, showing the ClientHello, ServerHello, key exchange, certificate verification, and Finished messages
- **TLS Negotiation Results** — displays the negotiated parameters including cipher suite, key exchange group, signature algorithm, and session keys
- **TLS Comparison Table** — compares classical, hybrid, and pure PQC handshake configurations showing sizes, round trips, and security properties
- **TLS Summary** — post-simulation analysis showing handshake trace events and success/failure status

## Workshop / Interactive Activities (Downgrade Scenario)

- **Downgrade Attack Scenario tab** — interactive walkthrough of a quantum downgrade attack: configure an attacker-in-the-middle that removes ML-KEM from the ClientHello key_share, observe the server falling back to X25519, and compare the negotiated session against a non-attacked connection; then apply PQ Lock and PQC Continuity mitigations and observe the attack being blocked

## Related Standards

- RFC 8446 (TLS 1.3)
- FIPS 203 (ML-KEM)
- FIPS 204 (ML-DSA)
- draft-ietf-tls-mlkem (ML-KEM for TLS 1.3)
- RFC 8879 (TLS Certificate Compression)
- draft-sheffer-tls-pqc-continuity (PQC Continuity: Downgrade Protection for TLS)
