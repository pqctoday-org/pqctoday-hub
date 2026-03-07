---
generated: 2026-03-06
collection: csc_042
documents_processed: 5
enrichment_method: ollama-qwen3.5:27b
---

## Keycloak

- **Category**: Identity & Access Management (IAM)
- **Product Name**: Keycloak
- **Product Brief**: Open Source Identity and Access Management For Modern Applications and Services.
- **PQC Support**: No mention
- **PQC Capability Description**: Not stated in the provided text.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Topics list mentions "oidc" and "saml", but specific cryptographic algorithms are not listed).
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Security Stack
- **License Type**: Open Source
- **License**: Apache-2.0
- **Latest Version**: Unknown (Badge indicates "latest release" but no specific version number is textually stated)
- **Release Date**: 2026-03-06 (Last Updated date provided; specific release date not stated)
- **FIPS Validated**: No mention
- **Primary Platforms**: Not stated (Docker and Java mentioned as deployment/build methods, but specific OS or cloud platforms are not listed).
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://github.com/keycloak/keycloak

---

## Microsoft Entra ID

- **Category**: Identity & Access Management (IAM)
- **Product Name**: Microsoft Entra ID
- **Product Brief**: AI-enabled multicloud identity and network access solution providing authentication, key management, and signing services.
- **PQC Support**: Planned (with timeline)
- **PQC Capability Description**: PQC capabilities are previewed for Windows Insiders and Linux via SymCrypt updates supporting ML-KEM and ML-DSA. Microsoft Entra authentication is identified as a core infrastructure service for quantum safety transition. Full maturity expected by 2033, with early adoption starting in 2029 using hybrid or direct PQC approaches.
- **PQC Migration Priority**: Critical
- **Crypto Primitives**: RSA, ECDSA, AES, ML-KEM, ML-DSA
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Cloud, Security Stack
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Not stated
- **Release Date**: 2025-08-20
- **FIPS Validated**: No
- **Primary Platforms**: Windows, Linux, Microsoft Azure, Microsoft 365
- **Target Industries**: Enterprise, Government, Financial services, Healthcare, Education, Manufacturing, Retail
- **Regulatory Status**: Aligned with NIST, CISA, OMB, NSA (CNSA 2.0), ISO, IETF, ETSI standards; aligned with US and international government timelines.
- **PQC Roadmap Details**: Transition strategy aims to complete by 2033 (two years before 2035 deadline). Early adoption of quantum-safe capabilities begins in 2029. Strategy involves a phased approach: foundational components (SymCrypt), core infrastructure services (Entra ID), and all services/endpoints. Uses hybrid or full PQC approaches based on service requirements.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Current: ECDSA, RSA; Planned/Preview: ML-DSA (Module-Lattice Digital Signature Algorithm)
- **Authoritative Source URL**: https://www.microsoft.com/security/blog/2025/08/20/quantum-safe-security-progress-towards-next-generation-cryptography/

---

## Teleport Access Platform

- **Category**: Identity & Access Management (IAM)
- **Product Name**: Teleport Access Platform
- **Product Brief**: The easiest, and most secure way to access and protect all of your infrastructure.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document mentions the use of "Go crypto" and certificate-based authentication but does not mention Post-Quantum Cryptography algorithms or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Certificate-based auth (specific algorithms like ECDSA, Ed25519, etc., are not explicitly listed in the text).
- **Key Management Model**: Uses a CA that issues short-lived certificates; no shared secrets such as SSH keys or Kubernetes tokens.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Single Go binary; supports Linux daemon or Kubernetes deployment; Cloud & Self-Hosted options available.
- **Infrastructure Layer**: Security Stack
- **License Type**: Open Source/Commercial
- **License**: AGPL-3.0
- **Latest Version**: v18.5.0
- **Release Date**: 2026-03-06
- **FIPS Validated**: No
- **Primary Platforms**: Linux, Kubernetes, Docker; supports SSH nodes, PostgreSQL, MongoDB, CockroachDB, MySQL, Windows Hosts, Internal Web apps.
- **Target Industries**: Not stated (mentions "hobbyists to hyperscalers")
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Certificate-based auth (specific schemes not listed)
- **Authoritative Source URL**: https://github.com/gravitational/teleport

---

## AWS Identity and Access Management (IAM)

- **Category**: Identity & Access Management (IAM)
- **Product Name**: AWS Identity and Access Management (IAM)
- **Product Brief**: Securely manage identities and access to AWS services and resources.
- **PQC Support**: No
- **PQC Capability Description**: Not stated in the provided text.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated (Text mentions managing identities, permissions, and temporary security credentials, but does not describe key hierarchy, root key protection, or escrow).
- **Supported Blockchains**: Not stated
- **Architecture Type**: Cloud-based SaaS service; supports centralized identity management across multiple AWS accounts.
- **Infrastructure Layer**: Security Stack, Cloud
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: Not stated
- **Primary Platforms**: AWS (Amazon Web Services)
- **Target Industries**: Enterprise (implied by "workload and workforce access", "agility and innovation")
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (Text contains navigation links but no specific product URL)

---

## SAML 2.0

- **Category**: Identity & Access Management (IAM)
- **Product Name**: Security Assertion Markup Language (SAML)
- **Product Brief**: An XML-based framework for communicating user authentication, entitlement, and attribute information between online partners.
- **PQC Support**: No
- **PQC Capability Description**: The document describes SAML as an XML-based standard for security assertions. There is no mention of Post-Quantum Cryptography (PQC) algorithms, hybrid modes, or migration plans. The Technical Committee was closed on 08 July 2023.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Not stated (described as "open standards" and "publicly accessible")
- **Latest Version**: SAML 2.0
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Not stated
- **Target Industries**: Enterprise, Government, Finance
- **Regulatory Status**: OASIS Technical Committee (Closed)
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: saml.xml.org

---
