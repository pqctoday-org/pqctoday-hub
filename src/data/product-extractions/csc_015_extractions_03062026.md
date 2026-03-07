---
generated: 2026-03-06
collection: csc_015
documents_processed: 7
enrichment_method: ollama-qwen3.5:27b
---

## Nimbus JOSE+JWT

- **Category**: API Security and JWT Libraries
- **Product Name**: Nimbus JOSE + JWT
- **Product Brief**: The most popular and robust Java and Android library for JSON Web Tokens (JWT) covering standard JWS and JWE algorithms.
- **PQC Support**: Partial (with scope)
- **PQC Capability Description**: Supports a draft implementation of `draft-ietf-jose-pqc-kem` contributed by Stepan Yakimovich at MONET+. No specific PQC signature schemes are listed as fully supported in the standard algorithm list; support is noted as a contribution for post-quantum cryptography.
- **PQC Migration Priority**: Low
- **Crypto Primitives**: HMAC (HS256, HS384, HS512), RSA (RS256, RS384, RS512, PS256, PS384, PS512), ECDSA (ES256, ES384, ES512, ES256K/secp256k1), EdDSA (Ed25519), ECDH-ES, ECDH-1PU, XC20P (ChaCha20-Poly1305)
- **Key Management Model**: Programmatic key management via JCA interface; supports PKCS#11 smart cards, HSMs, Google Cloud KMS, AWS KMS, and Android biometric prompts. Supports JWK formats (RFC 7517), PEM-encoded objects, and X.509 certificates.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Software library with pluggable cryptographic backends (JCA providers) supporting HSM and Cloud KMS integration.
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Apache 2.0
- **Latest Version**: 10.x
- **Release Date**: Not stated
- **FIPS Validated**: No (Supports optional BouncyCastle FIPS provider for FIPS 140-2, Level 1 compliance)
- **Primary Platforms**: Java 7+, Android
- **Target Industries**: Identity, messaging, mobile, finance
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Includes a contribution of `draft-ietf-jose-pqc-kem` implementation; specific timeline or algorithm choices for full production PQC migration are not detailed beyond the draft reference.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: HS256, HS384, HS512, RS256, RS384, RS512, PS256, PS384, PS512, ES256, ES256K, ES384, ES512, EdDSA, Ed25519
- **Authoritative Source URL**: Not stated (Document source filename: Nimbus_JOSE_JWT.html)

---

## jsonwebtoken (auth0)

- **Category**: API Security and JWT Libraries
- **Product Name**: jsonwebtoken (auth0/node-jsonwebtoken)
- **Product Brief**: JsonWebToken implementation for node.js developed against draft-ietf-oauth-json-web-token-08.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention any Post-Quantum Cryptography algorithms, hybrid modes, or PQC migration plans. It only lists classical algorithms (HMAC, RSA, ECDSA).
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: HMAC (HS256, HS384, HS512), RSA (RS256, RS384, RS512), ECDSA (ES256, ES384, ES512)
- **Key Management Model**: Programmatic key management using strings (utf-8 encoded), buffers, objects, or KeyObjects containing secrets for HMAC or PEM-encoded private/public keys for RSA and ECDSA. Supports passphrase-protected private keys via `{ key, passphrase }` object.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Application-layer library
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: MIT
- **Latest Version**: Unknown (Migration notes mention v7, v8, and v9, but no specific current version number is stated)
- **Release Date**: 2026-03-06 (Last Updated date provided in metadata)
- **FIPS Validated**: No
- **Primary Platforms**: node.js (JavaScript)
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: HS256, HS384, HS512, RS256, RS384, RS512, ES256, ES384, ES512
- **Authoritative Source URL**: https://github.com/auth0/node-jsonwebtoken

---

## go-jose v4

- **Category**: API Security and JWT Libraries
- **Product Name**: go-jose/go-jose
- **Product Brief**: An implementation of JOSE standards (JWE, JWS, JWT) in Go.
- **PQC Support**: No
- **PQC Capability Description**: The document lists support for RSA, ECDSA, Ed25519, HMAC, and AES-based algorithms. There is no mention of Post-Quantum Cryptography (PQC) algorithms, hybrid modes, or PQC migration plans.
- **PQC Migration Priority**: Low
- **Crypto Primitives**: RSA-PKCS#1v1.5, RSA-OAEP, AES key wrap, AES-GCM key wrap, ECDH-ES, Direct encryption, RSASSA-PKCS#1v1.5, RSASSA-PSS, HMAC, ECDSA, Ed25519 (EdDSA), AES-CBC+HMAC, AES-GCM, DEFLATE
- **Key Management Model**: Programmatic key management using Go standard library types (*rsa.PublicKey, *ecdsa.PublicKey, ed25519.PublicKey, []byte); supports wrapping keys in JWK format.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Application-layer cryptographic library
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Apache-2.0
- **Latest Version**: v4 (Version 5 is forthcoming)
- **Release Date**: 2026-03-03
- **FIPS Validated**: Not stated
- **Primary Platforms**: Go (Golang 1.24+)
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: RS256, RS384, RS512, PS256, PS384, PS512, HS256, HS384, HS512, ES256, ES384, ES512, EdDSA
- **Authoritative Source URL**: https://github.com/go-jose/go-jose

---

## Spring Security OAuth2

- **Category**: API Security and JWT Libraries
- **Product Name**: Spring Security
- **Product Brief**: A powerful and highly customizable authentication and access-control framework for Java applications.
- **PQC Support**: No
- **PQC Capability Description**: The provided text contains no mention of Post-Quantum Cryptography (PQC), PQC algorithms, hybrid modes, or migration plans. It focuses on standard authentication and authorization features.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Apache-2.0
- **Latest Version**: 7.0.3
- **Release Date**: Unknown
- **FIPS Validated**: No
- **Primary Platforms**: Java (requires JDK 17), Spring IO Platform, Servlet API, Spring Web MVC, WebFlux
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://github.com/spring-projects/spring-security

---

## Kong API Gateway

- **Category**: API Security and JWT Libraries
- **Product Name**: Kong Gateway
- **Product Brief**: A cloud-native, platform-agnostic, scalable API and AI Gateway distinguished for high performance and extensibility via plugins.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC), PQC algorithms, or any plans for PQC migration. It only mentions standard authentication methods like JWT, OAuth, and SSL/TLS termination without specifying quantum-resistant variants.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions "SSL/TLS termination" and "JWT" but does not list specific underlying cryptographic primitives like ECDSA, RSA, or Ed25519).
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application
- **License Type**: Open Source/Commercial
- **License**: Apache-2.0 (Open Source); Commercial subscriptions available via Konnect Cloud
- **Latest Version**: Unknown (Document references a version badge but does not state the specific version number in text)
- **Release Date**: 2026-03-06 (Last Updated date provided in repository metadata)
- **FIPS Validated**: No
- **Primary Platforms**: Kubernetes, Docker, Cloud, Bare metal, Containers
- **Target Industries**: Not stated (Mentions "organization's services" generally)
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated (Document mentions JWT and OAuth but does not list specific signature algorithms)
- **Authoritative Source URL**: https://github.com/Kong/kong

---

## PyJWT

- **Category**: API Security and JWT Libraries
- **Product Name**: PyJWT
- **Product Brief**: A Python implementation of RFC 7519 (JSON Web Token).
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention any Post-Quantum Cryptography algorithms, hybrid modes, or PQC migration plans. It only references standard symmetric and asymmetric algorithms like HS256.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: HS256
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: MIT
- **Latest Version**: Unknown
- **Release Date**: 2026-03-06
- **FIPS Validated**: No
- **Primary Platforms**: Python
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: HS256
- **Authoritative Source URL**: https://github.com/jpadilla/pyjwt

---

## OAuth 2.0 / OpenID Connect (OIDC)

- **Category**: API Security and JWT Libraries
- **Product Name**: OAuth 2.0 / OpenID Connect (OIDC)
- **Product Brief**: Industry-standard protocol for authorization focusing on client developer simplicity with specific flows for various devices.
- **PQC Support**: No
- **PQC Capability Description**: The document describes standard cryptographic protocols and extensions (JWT, DPoP, mTLS) but contains no mention of Post-Quantum Cryptography algorithms, hybrid modes, or PQC migration plans.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: Not stated (Document mentions protocol names like JWT, JWS, Bearer Tokens, and references to "Private Key" and "Public/Private Keys" generally, but does not list specific algorithms like ECDSA, RSA, or Ed25519).
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application
- **License Type**: Not stated
- **License**: Not stated
- **Latest Version**: OAuth 2.0 (OAuth 2.1 is described as "in-progress")
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Web applications, desktop applications, mobile phones, living room devices, native apps, browser-based apps (SPA), devices with no browser or keyboard.
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated (Document references JWT, JWS, and HTTP Message Signatures as concepts/specs but does not list specific signature algorithms).
- **Authoritative Source URL**: oauth.net/2/

---
