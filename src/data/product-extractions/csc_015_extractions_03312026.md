---
generated: 2026-03-31
collection: csc_015
documents_processed: 8
enrichment_method: ollama-qwen3.5:27b
---


## Nimbus JOSE+JWT

- **Category**: API Security and JWT Libraries
- **Product Name**: Nimbus JOSE + JWT
- **Product Brief**: The most popular and robust Java and Android library for JSON Web Tokens (JWT) covering standard signature and encryption algorithms.
- **PQC Support**: Partial (with scope)
- **PQC Capability Description**: Supports a draft implementation of post-quantum cryptography via `draft-ietf-jose-pqc-kem` contributed by Stepan Yakimovich at MONET+. No specific PQC algorithms are explicitly named as implemented in the core library text, only the contribution of a draft implementation is noted.
- **PQC Migration Priority**: Low
- **Crypto Primitives**: HMAC (HS256, HS384, HS512), RSASSA-PKCS1-V1_5 (RS256, RS384, RS512), RSASSA-PSS (PS256, PS384, PS512), ECDSA (ES256, ES256K/secp256k1, ES384, ES512), EdDSA (Ed25519), RSAES-PKCS1-V1_5, RSAES-OAEP, AES Key Wrap, ECDH-ES, ECDH-1PU, XC20P (ChaCha20-Poly1305)
- **Key Management Model**: Supports decoupling from underlying crypto implementations; allows plugging JCA providers including hardware-based (PKCS#11 smart cards and HSMs) and cloud-based providers (Google Cloud KMS, AWS KMS).
- **Supported Blockchains**: Not stated
- **Architecture Type**: Library with support for HSM, Smart Card, and Cloud KMS integration via JCA.
- **Infrastructure Layer**: Libraries
- **License Type**: Open Source
- **License**: Apache 2.0
- **Latest Version**: 10.x
- **Release Date**: Not stated (Document last updated: 9 January 2026)
- **FIPS Validated**: No (Supports optional BouncyCastle FIPS as a separate JCA provider for FIPS 140-2, Level 1 compliance; the library itself is not stated as validated).
- **Primary Platforms**: Java 7+, Android
- **Target Industries**: Identity, messaging, mobile, finance
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Mentions a contribution of a `draft-ietf-jose-pqc-kem` implementation; no specific timeline or algorithm choices for full production migration are stated.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: HS256, HS384, HS512, RS256, RS384, RS512, PS256, PS384, PS512, ES256, ES256K, ES384, ES512, EdDSA, Ed25519
- **Authoritative Source URL**: Not stated (Text contains navigation links but no explicit base URL)

---

## jsonwebtoken (auth0)

- **Category**: API Security and JWT Libraries
- **Product Name**: jsonwebtoken (auth0/node-jsonwebtoken)
- **Product Brief**: JsonWebToken implementation for node.js developed against draft-ietf-oauth-json-web-token-08.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography, PQC algorithms, or any migration plans to quantum-resistant standards. It only supports classical algorithms.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: HMAC (HS256, HS384, HS512), RSA (RS256, RS384, RS512), ECDSA (ES256, ES384, ES512)
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Library-based implementation for Node.js
- **Infrastructure Layer**: Libraries
- **License Type**: Open Source
- **License**: MIT
- **Latest Version**: Not stated (Migration notes mention v7, v8, and v9)
- **Release Date**: 2026-03-06 (Last Updated date provided)
- **FIPS Validated**: No
- **Primary Platforms**: node.js
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: HS256, HS384, HS512, RS256, RS384, RS512, ES256, ES384, ES512
- **Authoritative Source URL**: https://github.com/auth0/node-jsonwebtoken

---

## go-jose v4

- **Category**: API Security and JWT Libraries
- **Product Name**: go-jose/go-jose
- **Product Brief**: An implementation of JOSE standards (JWE, JWS, JWT) in Go.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention any Post-Quantum Cryptography algorithms, support, or migration plans. It lists classical algorithms only.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: RSA-PKCS#1v1.5, RSA-OAEP, AES key wrap, AES-GCM key wrap, ECDH-ES, Direct encryption, RSASSA-PKCS#1v1.5, RSASSA-PSS, HMAC, ECDSA, Ed25519, AES-CBC+HMAC, AES-GCM, DEFLATE
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Library
- **Infrastructure Layer**: Libraries
- **License Type**: Open Source
- **License**: Apache-2.0
- **Latest Version**: v4 (Version 5 is forthcoming)
- **Release Date**: 2026-03-03
- **FIPS Validated**: No
- **Primary Platforms**: Go (Golang 1.24+)
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: RSASSA-PKCS#1v1.5 (RS256, RS384, RS512), RSASSA-PSS (PS256, PS384, PS512), HMAC (HS256, HS384, HS512), ECDSA (ES256, ES384, ES512), Ed25519 (EdDSA)
- **Authoritative Source URL**: https://github.com/go-jose/go-jose

---

## Spring Security OAuth2

- **Category**: API Security and JWT Libraries
- **Product Name**: Spring Security
- **Product Brief**: A powerful and highly customizable authentication and access-control framework for Java applications.
- **PQC Support**: No
- **PQC Capability Description**: Not stated in the provided text. The document describes general authentication and authorization features but contains no mention of Post-Quantum Cryptography, quantum-resistant algorithms, or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Security Stack, Application
- **License Type**: Open Source
- **License**: Apache-2.0
- **Latest Version**: 7.0.3
- **Release Date**: Unknown
- **FIPS Validated**: No
- **Primary Platforms**: Java (requires JDK 17), Spring IO Platform, Servlet API, Spring Web MVC, WebFlux
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://github.com/spring-projects/spring-security

---

## Okta Integration Network

- **Category**: API Security and JWT Libraries
- **Product Name**: Okta Platform (including Okta Workforce Identity, Okta Customer Identity, Okta Integration Network)
- **Product Brief**: A comprehensive identity security fabric platform securing human, non-human, and AI agent identities across all environments.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC), quantum-resistant algorithms, or any PQC migration plans. It mentions OIDC ID Token Encryption using JSON Web Encryption (JWE) but does not specify the underlying cryptographic primitives as PQC.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions "JSON Web Encryption (JWE)" and "OIDC ID Token Encryption" but does not list specific algorithms like ECDSA, RSA, or Ed25519).
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Cloud-based identity security fabric; includes Universal Directory and Secure Identity Orchestration.
- **Infrastructure Layer**: Cloud, Security Stack, Application
- **License Type**: Commercial
- **License**: Proprietary (Okta and/or its affiliates. All rights reserved.)
- **Latest Version**: Not stated (Document refers to "Q3 2025" release overview but no specific version numbers).
- **Release Date**: 2025-07-01 (Inferred from "Q3 (July - September 2025)" and "Available 9/30" for blog; exact date not specified, using start of quarter).
- **FIPS Validated**: Not stated (Document mentions FedRAMP High/Moderate and HIPAA BAA compliance, but does not explicitly state FIPS 140-2 or 140-3 validation status).
- **Primary Platforms**: Cloud Apps, On Prem Servers, Public/Private Directories, Kubernetes, Databases.
- **Target Industries**: Public Sector (Government High/Moderate/US Military), Financial Services, Healthcare (HIPAA), Manufacturing, Retail, Technology, Non-Profit, Energy.
- **Regulatory Status**: FedRAMP High, FedRAMP Moderate, HIPAA (with signed BAA).
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: okta.com/agreements (mentioned for contractual assurances); okta.com (implied base domain).

---

## Kong API Gateway

- **Category**: API Security and JWT Libraries
- **Product Name**: Kong Gateway
- **Product Brief**: A cloud-native, platform-agnostic, scalable API, LLM, and MCP Gateway distinguished for high performance and extensibility.
- **PQC Support**: No
- **PQC Capability Description**: Not stated in the document. The text mentions "semantic security" and "MCP traffic security" but does not specify Post-Quantum Cryptography algorithms or implementations.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: JWT, OAuth, SSL/TLS (specific algorithms like ECDSA or RSA are not explicitly listed).
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Cloud-native, platform-agnostic; supports Declarative Databaseless Deployment and Hybrid Deployment.
- **Infrastructure Layer**: Network, Security Stack, Cloud
- **License Type**: Open Source/Commercial
- **License**: Apache-2.0 (Open Source); Commercial subscriptions available via Konnect Cloud.
- **Latest Version**: Unknown (Badge indicates version tracking but no specific number is listed in the text).
- **Release Date**: 2026-03-06 (Last Updated date provided).
- **FIPS Validated**: No
- **Primary Platforms**: Kubernetes, Docker, Cloud, Bare metal, Containers.
- **Target Industries**: Enterprise, DevOps, AI/LLM operations.
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: JWT, OAuth (specific signature algorithms not detailed).
- **Authoritative Source URL**: https://github.com/Kong/kong

---

## PyJWT

- **Category**: API Security and JWT Libraries
- **Product Name**: PyJWT
- **Product Brief**: A Python implementation of RFC 7519 (JSON Web Token).
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document describes a standard JWT implementation using classical algorithms but contains no mention of Post-Quantum Cryptography, PQC algorithms, or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: HS256
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Libraries
- **License Type**: Open Source
- **License**: MIT
- **Latest Version**: Unknown (Badge link provided, but specific version number not explicitly stated in text)
- **Release Date**: 2026-03-06 (Last Updated date)
- **FIPS Validated**: No
- **Primary Platforms**: Python
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: HS256
- **Authoritative Source URL**: https://github.com/jpadilla/pyjwt

---

## OAuth 2.0 / OpenID Connect (OIDC)

- **Category**: API Security and JWT Libraries
- **Product Name**: OAuth 2.0 / OpenID Connect (OIDC)
- **Product Brief**: Industry-standard protocol for authorization focusing on client developer simplicity across web, desktop, mobile, and device applications.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document describes standard cryptographic protocols (OAuth 2.0, OIDC, JWT) but contains no mention of Post-Quantum Cryptography algorithms, implementations, or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions protocol standards like ECDSA/Ed25519 are not explicitly listed as primitives in the text, only references to JWT, Bearer Tokens, and TLS).
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Libraries
- **License Type**: Unknown
- **License**: Not stated
- **Latest Version**: OAuth 2.1 (in-progress), OAuth 2.0
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Web applications, desktop applications, mobile phones, living room devices, native apps, browser-based apps (SPA)
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: oauth.net/2/

---
