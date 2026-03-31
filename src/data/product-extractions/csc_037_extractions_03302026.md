---
generated: 2026-03-30
collection: csc_037
documents_processed: 2
enrichment_method: ollama-qwen3.5:27b
---

## Google Chrome

- **Category**: Web Browsers
- **Product Name**: Google Chrome
- **Product Brief**: Web browser with hybrid post-quantum key establishment support via ML-KEM.
- **PQC Support**: Yes (Hybrid ML-KEM enabled by default in TLS 1.3)
- **PQC Capability Description**: Chrome offers hybrid ML-KEM (formerly Kyber) by default on desktop since version 131 and Android since version 133. It uses X25519+ML-KEM for key exchange with ECDSA for authentication. Google servers prefer ML-KEM. Experimental support for Kyber began in Chrome 116. ML-DSA signatures are under standardization and not yet deployed by default due to size/latency concerns.
- **PQC Migration Priority**: High
- **Crypto Primitives**: X25519, ML-KEM (Kyber), ECDSA, Curve25519, AES, ChaCha-Poly, Simon/Speck, RSA, ECDH
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Hybrid (Classical + PQC)
- **Infrastructure Layer**: Application
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: Chrome 133 (Android), Chrome 131 (Desktop)
- **Release Date**: 2024-10-01 (Chrome 131 ML-KEM default enablement mentioned as Oct 2024)
- **FIPS Validated**: No (ML-DSA recently defined in FIPS standard, but Chrome implementation status not stated as validated)
- **Primary Platforms**: Desktop, Android, iOS (via system-wide support context), macOS
- **Target Industries**: General Consumer, Enterprise
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: ML-KEM enabled by default in Chrome 131 (Oct 2024) for desktop and 133 for Android. ML-DSA adoption is delayed due to handshake size/latency; standardization ongoing at IETF.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: ECDSA, RSA Sign (Classical); ML-DSA (Planned/Under Standardization)
- **Authoritative Source URL**: https://dadrian.io/blog/posts/pqc-signatures-2024/ (Referenced in text), Chrome Security documentation implied.

---

## Mozilla Firefox

- **Category**: Web Browsers
- **Product Name**: Mozilla Firefox
- **Product Brief**: Web browser with experimental PQC support via a modified NSS library and external PKCS#11 modules.
- **PQC Support**: Partial (with scope)
- **PQC Capability Description**: Supports hybrid key agreements using X25519MLKEM768 (default in Firefox 132+ Desktop, 145+ Android) and X25519Kyber768Draft00 (Firefox 124-131 via config). A research fork integrates ML-DSA for signatures and ML-KEM for key encapsulation using the Qryptotoken PKCS#11 module and Libcrux library.
- **PQC Migration Priority**: High
- **Crypto Primitives**: X25519, ML-KEM (Kyber), ML-DSA, TLS 1.3, QUIC/HTTP3
- **Key Management Model**: PKCS#11 compliant software token (Qryptotoken) with shallow module architecture delegating operations to external libraries; supports programmatic key management via NSS.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Application-layer with modular PKCS#11 integration
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Not stated
- **Latest Version**: Firefox 145 (Android), Firefox 132 (Desktop) for default PQC; Firefox 128+ for QUIC/HTTP3 Kyber support.
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Desktop, Android, iOS (via system-wide support mentioned in context of other browsers), macOS
- **Target Industries**: General consumer and enterprise web browsing
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Default deployment of X25519MLKEM768 in Firefox 132+; research integration of ML-DSA and ML-KEM via Qryptotoken for future interoperability.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: ECDSA (implied by standard NSS), Ed25519 (implied by standard NSS), ML-DSA (research fork only, not exposed in default signature list yet)
- **Authoritative Source URL**: https://developers.cloudflare.com/ssl/post-quantum-cryptography/pqc-support/index.md

---
