---
generated: 2026-03-30
collection: csc_028
documents_processed: 3
enrichment_method: ollama-qwen3.5:27b
---

## Fortanix Data Security Manager

- **Category**: Cloud Encryption Gateways
- **Product Name**: Fortanix Data Security Manager™
- **Product Brief**: Unified solution for data encryption and key management across hybrid multicloud environments.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: The platform offers "Post Quantum Cryptography" capabilities to help users discover and assess their cryptographic security posture across environments, prioritize risks, and remediate quantum threats. It is listed under solutions for "Post-Quantum Readiness." Specific algorithms or maturity levels are not detailed in the text.
- **PQC Migration Priority**: High
- **Crypto Primitives**: Not stated
- **Key Management Model**: HSM-backed; supports centralized enterprise key management, AWS KMS External Key Store (XKS), Google External Key Manager (EKM), and Bring Your Own Key (BYOK).
- **Supported Blockchains**: Not stated
- **Architecture Type**: HSM-based; offers on-prem and SaaS deployment options with confidential computing integration.
- **Infrastructure Layer**: Cloud, Security Stack, Hardware
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Unknown
- **Release Date**: Not stated
- **FIPS Validated**: Yes; hardware is FIPS 140-2 L3 validated.
- **Primary Platforms**: AWS (via XKS), Google Cloud Platform (via EKM), hybrid multicloud environments, on-premises.
- **Target Industries**: Healthcare, Banking and Financial Services, Tech, Manufacturing, Federal Government.
- **Regulatory Status**: Supports compliance with GDPR, APRA Prudential Standards, CPS 234, SCHREMS II, Philippines Data Privacy Act, Digital Operational Resilience Act, HIPAA, SOX, GLBA, SEBI, PCI DSS, and Essential Cybersecurity Controls (ECC).
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated

---

## Cloudflare Edge Network

- **Category**: Cloud Encryption Gateways
- **Product Name**: Cloudflare Edge Network
- **Product Brief**: Global network infrastructure providing security, reliability, and post-quantum cryptography support via Anycast data centers.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Deploys post-quantum hybrid key agreements using X25519MLKEM768 (default for modern browsers/OS) and X25519Kyber768Draft00. Supported via Cloudflare's fork of Go, OpenSSL 3.5.0+, Node.js, BoringSSL, GnuTLS, rustls, and NGINX.
- **PQC Migration Priority**: High
- **Crypto Primitives**: X25519MLKEM768, X25519Kyber768Draft00, TLS 1.3, QUIC/HTTP3
- **Key Management Model**: Cloudflare supports integration with AWS Cloud HSM, Azure Dedicated/Managed HSM, Google Cloud HSM, IBM Cloud HSM, Entrust nShield Connect, Fortanix DSM, and SoftHSMv2 via Keyless SSL; customer-managed keys supported.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Managed service (SaaS) with Anycast network, bare metal servers, private backbone, and integration with external HSMs.
- **Infrastructure Layer**: Network, Security Stack, Cloud, Hardware
- **License Type**: Proprietary
- **License**: Proprietary
- **Latest Version**: Not stated (Software versions listed: Go 1.24+, OpenSSL 3.5.0+, Node 24.5.0+, Firefox 132+, Chrome 131+)
- **Release Date**: 2025-11-04 (Document last updated)
- **FIPS Validated**: Not stated
- **Primary Platforms**: Cloudflare Edge Network, AWS, Azure, Google Cloud, IBM Cloud, Entrust, Fortanix; Browsers: Firefox, Chrome, Safari, Edge, Opera, Brave, Tor.
- **Target Industries**: Enterprise, General Internet Services
- **Regulatory Status**: Not stated (PCI compliance mentioned in context of vulnerabilities)
- **PQC Roadmap Details**: Currently deploying hybrid key agreements (X25519MLKEM768 and X25519Kyber768Draft00); no specific future timeline beyond current browser/software defaults.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated (Document focuses on Key Exchange/Agreement)
- **Authoritative Source URL**: https://developers.cloudflare.com/ssl/post-quantum-cryptography/pqc-support/index.md

---

## Futurex Cloud

- **Category**: Cloud Encryption Gateways
- **Product Name**: Futurex Cloud (referenced as "Futurex CryptoHub" and "Futurex HSMs")
- **Product Brief**: A cloud security platform offering PQC readiness checklists, hybrid encryption, and centralized cryptographic management.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports hybrid encryption models combining classic and PQC algorithms. Explicitly mentions alignment with NIST standards: FIPS 203 ML-KEM (Kyber), FIPS 204 ML-DSA (Dilithium), FIPS 205 SLH-DSA (SPHINCS+), and preparation for FIPS 206 FN-DSA (Falcon). Enables seamless migration via Futurex HSMs.
- **PQC Migration Priority**: High
- **Crypto Primitives**: RSA, ECC, SHA-1 (identified as vulnerable); ML-KEM (Kyber), ML-DSA (Dilithium), SLH-DSA (SPHINCS+), FN-DSA (Falcon) (planned/aligned).
- **Key Management Model**: Hybrid encryption models; centralized management via Futurex CryptoHub; HSM-backed (Futurex HSMs); customer-managed assessment of existing HSMs.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Cloud-based platform with HSM integration and hybrid encryption capabilities.
- **Infrastructure Layer**: Cloud, Hardware
- **License Type**: Commercial
- **License**: Proprietary (implied by commercial nature and "Futurex solutions")
- **Latest Version**: Unknown
- **Release Date**: Not stated
- **FIPS Validated**: No (Document mentions aligning with FIPS 203, 204, 205, and 206 standards, but does not state the product itself is FIPS validated).
- **Primary Platforms**: Cloud (Futurex Cloud); specific cloud providers (AWS, Azure, GCP) are not explicitly listed in the text.
- **Target Industries**: Enterprise (implied by references to compliance with PCI, GDPR, HIPAA and organizational governance).
- **Regulatory Status**: Not stated (Document mentions aligning with standards like PCI, GDPR, HIPAA, but does not list specific regulatory licenses or charters for Futurex).
- **PQC Roadmap Details**: Phased migration plan including discovery, planning, execution, and futureproofing. Prioritizes replacing legacy algorithms (RSA, ECC) with NIST-approved PQC algorithms (Kyber, Dilithium, SPHINCS+, Falcon). Includes pilot programs and continuous monitoring.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Current: RSA, ECC; Planned/Aligned: ML-DSA (Dilithium), SLH-DSA (SPHINCS+), FN-DSA (Falcon).
- **Authoritative Source URL**: https://www.futurex.com/pqc-best-resources

---
