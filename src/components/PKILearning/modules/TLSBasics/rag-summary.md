# TLS 1.3 Basics

## Overview

The TLS Basics module provides a comprehensive introduction to Transport Layer Security 1.3 (RFC 8446) and its post-quantum cryptography integration. It covers the TLS 1.3 protocol improvements over TLS 1.2, the 1-RTT handshake process, cipher suite simplification, key exchange mechanisms (classical ECDH, pure PQC ML-KEM, and hybrid X25519MLKEM768), the HKDF-based key schedule, and the trade-offs of PQC migration in TLS. The module includes a live TLS handshake simulator powered by OpenSSL WASM that demonstrates real handshake operations with configurable client and server parameters.

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

## Workshop / Interactive Activities

The workshop is a live TLS handshake simulator with the following features:

- **Client Configuration Panel** — configure TLS version, cipher suites, key exchange groups, supported signature algorithms, and client certificates
- **Server Configuration Panel** — configure server certificates (classical RSA/ECDSA or PQC ML-DSA), cipher preferences, mutual TLS settings, and trust store management
- **Full Handshake Simulation** — runs a complete TLS 1.3 handshake via OpenSSL WASM, showing the ClientHello, ServerHello, key exchange, certificate verification, and Finished messages
- **TLS Negotiation Results** — displays the negotiated parameters including cipher suite, key exchange group, signature algorithm, and session keys
- **TLS Comparison Table** — compares classical, hybrid, and pure PQC handshake configurations showing sizes, round trips, and security properties
- **TLS Summary** — post-simulation analysis showing handshake trace events and success/failure status

## Related Standards

- RFC 8446 (TLS 1.3)
- FIPS 203 (ML-KEM)
- FIPS 204 (ML-DSA)
- RFC 9180 (Hybrid Public Key Encryption)
- draft-ietf-tls-mlkem (ML-KEM for TLS 1.3)
