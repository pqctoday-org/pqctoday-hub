---
generated: 2026-03-06
collection: csc_046
documents_processed: 4
enrichment_method: ollama-qwen3.5:27b
---

## AWS CloudHSM

- **Category**: Cloud Hardware Security Module (HSM)
- **Product Name**: AWS CloudHSM
- **Product Brief**: Manage single-tenant hardware security modules (HSMs) on AWS with FIPS-validated hardware in your own VPC.
- **PQC Support**: No mention
- **PQC Capability Description**: Not stated. The document does not mention Post-Quantum Cryptography, PQC algorithms, or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions SSL/TLS and PKCS#11/JCE/OpenSSL integrations but does not list specific primitives like ECDSA or RSA).
- **Key Management Model**: Customer-owned, single-tenant HSM instances running in a Virtual Private Cloud (VPC); supports clusters for capacity management.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Managed service providing single-tenant hardware security modules (HSMs) on AWS.
- **Infrastructure Layer**: Cloud, Hardware
- **License Type**: Commercial
- **License**: Proprietary (Implied by "Pay by the hour" and AWS Marketplace context; specific license text not stated).
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: Yes, FIPS 140-2 Level 3 validated hardware.
- **Primary Platforms**: AWS (Virtual Private Cloud/VPC); supports .NET, Python, Java, PHP, JavaScript via SDKs/Tools; integrates with OpenSSL, PKCS#11, JCE.
- **Target Industries**: Not stated (Use cases include web servers, issuing CAs, and Oracle databases).
- **Regulatory Status**: Helps meet regulatory compliance; FIPS 140-2 Level 3 validated.
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated (Document mentions signing certificate requests but does not specify algorithms).
- **Authoritative Source URL**: Not stated (Source text is from AWS_CloudHSM.html, AWS_CloudHSM_doc1.html, and AWS_CloudHSM_doc2.html; no specific URL provided in the text).

---

## Securosys CloudHSM

- **Category**: Cloud Hardware Security Module (HSM)
- **Product Name**: Securosys CloudHSM
- **Product Brief**: HSM as a Service providing secure key storage, cryptographic operations, and compliance via certified Primus HSMs in the cloud.
- **PQC Support**: Partial (with scope)
- **PQC Capability Description**: Supports specific post-quantum or advanced algorithms including BLS and Schnorr, primarily for cryptocurrency and blockchain solutions. The product is listed under "Post-Quantum Cryptography" in the portfolio, but no general PQC migration roadmap for standard protocols is detailed.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: BLS, Schnorr (mentioned in context of cryptocurrencies); PKCS#11, OpenSSL, JCE/JCA, Microsoft CNG, REST API (interfaces).
- **Key Management Model**: HSM-backed; supports dedicated or shared multi-tenant HSMs with synchronous clustering for redundancy; customer-managed keys via BYOK/XKS integrations.
- **Supported Blockchains**: Not stated (mentions support for "blockchain-based solutions" and "crypto assets" generally, including Bitcoin).
- **Architecture Type**: HSM-based (Cloud-hosted Hardware Security Module service using Securosys Primus HSMs).
- **Infrastructure Layer**: Cloud, Hardware, Security Stack
- **License Type**: Commercial
- **License**: Proprietary (Subscription model)
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: Yes (FIPS 140-2 Level 3)
- **Primary Platforms**: Cloud (Securosys' own cloud infrastructure); accessible via regional clusters in Switzerland, Germany, Singapore, US; integrates with AWS, Azure, HashiCorp Vault, Microsoft 365.
- **Target Industries**: Finance (payment clearing/settlement), Cryptocurrency, Enterprise, PKI providers, Trust Service Providers.
- **Regulatory Status**: FIPS 140-2 Level 3, Common Criteria EAL4+, EN 419 221-5, ISO/IEC 27001; supports eIDAS and ZertES compliant electronic signatures.
- **PQC Roadmap Details**: Not stated (mentions support for BLS/Schnorr but no specific timeline or algorithm migration plan).
- **Consensus Mechanism**: Unknown
- **Signature Schemes**: BLS, Schnorr (for crypto assets); supports qualified electronic signatures (eIDAS/ZertES).
- **Authoritative Source URL**: Not stated

---

## Azure Dedicated HSM (Marvell LiquidSecurity)

- **Category**: Cloud Hardware Security Module (HSM)
- **Product Name**: Azure Dedicated HSM
- **Product Brief**: A single-tenant, FIPS 140-3 Level 3 validated cloud service for managing hardware security modules and safeguarding cryptographic keys.
- **PQC Support**: No mention
- **PQC Capability Description**: Not stated in the provided text. The document mentions support for industry standards like PKCS#11, OpenSSL, and JCE but does not explicitly list Post-Quantum Cryptography algorithms or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Text mentions support for PKCS#11, OpenSSL, JCE, SSL Offload, and signing, but does not list specific primitives like ECDSA, RSA, or Ed25519).
- **Key Management Model**: Hardware-backed key storage in a single-tenant HSM cluster; Microsoft has no access to customer keys; customers maintain full administrative and cryptographic control.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Cloud-based Hardware Security Module (HSM) service; single-tenant clusters of three HSMs for high availability.
- **Infrastructure Layer**: Cloud, Hardware
- **License Type**: Commercial
- **License**: Proprietary (Microsoft Azure service)
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: Yes, FIPS 140-3 Level 3 validated
- **Primary Platforms**: Microsoft Azure (Azure VMs, SQL Server, Oracle TDS, Active Directory Certificate Services)
- **Target Industries**: Enterprise, Government (implied by compliance focus), Finance (implied by HSM use cases)
- **Regulatory Status**: FIPS 140-3 Level 3 validated; eIDAS compliant
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (Text contains navigation links but no specific product URL)

---

## IBM Cloud HSM (Utimaco)

- **Category**: Cloud Hardware Security Module (HSM)
- **Product Name**: IBM Cloud HSM
- **Product Brief**: A dedicated, single-tenant hardware security module for protecting cryptographic key lifecycles.
- **PQC Support**: No mention
- **PQC Capability Description**: Not stated in the document.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (document mentions support for PKCS #11, CAPI, JCA, KMIP, and RESTful APIs but does not list specific algorithms).
- **Key Management Model**: Hardware-backed; keys are generated, processed, and stored inside a hardened, tamper-resistant device.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Cloud-based single-tenant hardware security module (HSM).
- **Infrastructure Layer**: Hardware, Cloud
- **License Type**: Commercial
- **License**: Proprietary (implied by "Commercial" nature and support portal access; specific license text not stated)
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: FIPS 140-2 Level 3 validated
- **Primary Platforms**: IBM Cloud
- **Target Industries**: Security-conscious organizations (general); specific industries not listed.
- **Regulatory Status**: FIPS 140-2 Level 3 validated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (Source filename provided: IBM*Cloud_HSM\_\_Utimaco*.html)

---
