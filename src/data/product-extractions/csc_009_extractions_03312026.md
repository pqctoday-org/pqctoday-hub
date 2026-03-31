---
generated: 2026-03-31
collection: csc_009
documents_processed: 7
enrichment_method: ollama-qwen3.5:27b
---

## Codegic Khatim Sign Server

- **Category**: Digital Signature Software
- **Product Name**: Khatim Sign Server
- **Product Brief**: Digital signature software supporting PKCS#1 signatures with experimental Post Quantum Cryptography (PQC) capabilities.
- **PQC Support**: Partial (experimental support for Dilithium algorithms in v5.0)
- **PQC Capability Description**: Khatim PKI Server v5.0 offers experimental support for PQC, specifically the Dilithium algorithm (levels 2, 3, and 5). It supports generating CA certificates, CRLs, OCSP responses, timestamp responses, end-entity certificates, and PKCS#1 signatures using Dilithium. Note: Windows OS currently does not support verifying these PQC certificates. Future support for PAdES, XAdES, CAdES, JAdES, and ASic is planned.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: Dilithium (2, 3, 5), RSA, ECC (mentioned as vulnerable context)
- **Key Management Model**: Supports generating keys inside HSM or via SERVER/CLIENT_CSR policies within the Certificate Provider; mentions Key Vault > System Keys for key generation.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Server-based PKI infrastructure with Certificate Provider (CP) and RESTful interface; supports HSM integration.
- **Infrastructure Layer**: Security Stack
- **License Type**: Commercial
- **License**: Proprietary (Trial version available upon request)
- **Latest Version**: v5.0
- **Release Date**: 2024-12-10
- **FIPS Validated**: Not stated
- **Primary Platforms**: Windows (for CA installation, though PQC verification not supported on Windows), Linux/Unix implied for OpenSSL testing.
- **Target Industries**: Enterprise PKI administrators, organizations requiring digital signatures and certificate lifecycle management.
- **Regulatory Status**: ISO 27001, 9001, 14001 Certified (Company level); NIST standards referenced for PQC algorithms.
- **PQC Roadmap Details**: Experimental support currently available in v5.0 for Dilithium. Future plans include supporting PAdES, XAdES, CAdES, JAdES, and ASic container-based signature formats with PQC.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Dilithium (experimental), PKCS#1 (with Dilithium support), RSA, ECC (legacy context).
- **Authoritative Source URL**: https://codegic.com (inferred from domain structure in text, though specific product URL not explicitly listed as a single link)

---
## SignServer

- **Category**: Digital Signature Software
- **Product Name**: SignServer Community Edition (SignServer CE)
- **Product Brief**: Open source, PKI-based signing software to sign code, documents, timestamps and more.
- **PQC Support**: No
- **PQC Capability Description**: Not stated in the document. The text mentions "cryptography" and "PKI" generally but does not specify any Post-Quantum Cryptography algorithms or implementations.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Topics list includes "pkcs7", "xades", "xml", "digital-signature", but specific primitives like ECDSA or RSA are not explicitly named).
- **Key Management Model**: Not stated (Text mentions "keeping signing keys secure" and "enterprise-grade key management" for the Enterprise edition, but no specific architecture is described for CE).
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Libraries
- **License Type**: Open Source
- **License**: LGPL-2.1
- **Latest Version**: Not stated
- **Release Date**: 2026-02-27 (Last Updated date)
- **FIPS Validated**: No
- **Primary Platforms**: Linux, Windows (runs on JVM such as OpenJDK)
- **Target Industries**: Not stated (Mentions "learning, testing, and prototyping" for CE; Enterprise is for production environments).
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://www.signserver.org/

---

## Adobe Acrobat Sign

- **Category**: Digital Signature Software
- **Product Name**: Adobe Acrobat Sign
- **Product Brief**: Standalone e-signature solution with unlimited seats, robust integrations, industry-ready compliance, and advanced features.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document mentions "built-in security" but does not specify Post-Quantum Cryptography algorithms, implementation status, or maturity levels.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application
- **License Type**: Commercial
- **License**: Proprietary (implied by "Business Pricing Plans" and "Contact Sales")
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Desktop, mobile device, Microsoft Word, Teams, Salesforce, Workday, Adobe Document Cloud, Box, Dropbox, Google Drive, Microsoft OneDrive
- **Target Industries**: Medium or large business, Fortune 500 companies, small businesses
- **Regulatory Status**: Not stated (mentions "industry-ready compliance" but no specific licenses or charters)
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://main--dc--adobecom.aem.live/dc-shared/fragments/promo-banners/acrobat-sign

---

## DigiCert SigningHub

- **Category**: Digital Signature Software
- **Product Name**: DigiCert SigningHub
- **Product Brief**: Not stated (Document mentions "DigiCert® Software Trust Manager" and "DigiCert® KeyLocker" but does not provide a specific description for "SigningHub").
- **PQC Support**: Planned (with timeline)
- **PQC Capability Description**: The document states that shorter certificate lifetimes create a cadence for "planning future transitions to stronger or quantum-safe algorithms." It mentions a blog post titled "No Time to Wait: PQC Pressure from the Dept. of War" but does not detail specific PQC algorithms, implementation status, or maturity levels for the product itself.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document discusses code signing and TLS/SSL generally but does not list specific primitives like ECDSA, Ed25519, etc., used by the software).
- **Key Management Model**: HSM-backed (mentions "FIPS or Common Criteria-compliant hardware tokens" and "cloud-based signing services" that automate key rotation in secure environments).
- **Supported Blockchains**: Not stated
- **Architecture Type**: Hybrid (supports both hardware tokens and cloud-based managed signing services like DigiCert® KeyLocker).
- **Infrastructure Layer**: Cloud, Hardware
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: Yes (mentions support for "Federal Information Processing Standard (FIPS) ... compliant hardware tokens").
- **Primary Platforms**: Not stated (Document mentions Windows tools but does not specify OS support for the core platform).
- **Target Industries**: Enterprise, Government (implied by "Dept. of War" reference and general enterprise security context), Software Supply Chain.
- **Regulatory Status**: Not stated (Mentions CA/Browser Forum standards and eIDAS/PKIo in navigation, but no specific regulatory licenses for the product).
- **PQC Roadmap Details**: Planning future transitions to quantum-safe algorithms is encouraged by shorter certificate lifetimes; specific algorithm choices or timelines are not provided.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated (Document discusses code signing certificates but does not specify the underlying signature schemes).
- **Authoritative Source URL**: Not stated (Document text contains navigation links but no direct product URL for DigiCert SigningHub).

---

## GlobalSign Digital Signing Service

- **Category**: Digital Signature Software
- **Product Name**: Digital Signing Service (DSS)
- **Product Brief**: Cloud-based solution enabling organizations to sign documents with signatures and seals quickly, easily, and securely.
- **PQC Support**: Unknown
- **PQC Capability Description**: Not stated. The document lists "Post Quantum Computing" as a menu item but provides no details on implementation, algorithms, or maturity level for the Digital Signing Service.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Cloud-based; explicitly states "No Hardware" (no tokens or HSMs required).
- **Supported Blockchains**: Not stated
- **Architecture Type**: Cloud-based
- **Infrastructure Layer**: Cloud, Application
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: No
- **Primary Platforms**: Cloud; integrates with Adobe Acrobat, DocuSign, ServiceNow, HashiCorp Vault, Microsoft Intune.
- **Target Industries**: Finance and Insurance, Government, Health and Dental, Education, Legal and Real Estate, Energy.
- **Regulatory Status**: eIDAS, PSD2, FDA (21 CFR Part 11), Adobe Approved Trust List (AATL).
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Advanced Electronic Signatures, Qualified Electronic Signatures.
- **Authoritative Source URL**: Not stated

---

## Adva FSP 3000 S-Flex

- **Category**: Network Encryptors
- **Product Name**: Adva FSP 3000 S-Flex™
- **Product Brief**: BSI-approved 400G Layer 1 muxponder with quantum-safe encryption for classified data.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: The solution delivers quantum-safe Layer 1 encryption utilizing post-quantum cryptography (PQC) and post-quantum key exchange. It is approved by the German Federal Office for Information Security (BSI) for VS-NfD and EU/NATO-restricted data, protecting against harvest-now, decrypt-later attacks.
- **PQC Migration Priority**: Critical
- **Crypto Primitives**: Not stated
- **Key Management Model**: Post-quantum key exchange; specific architecture details (e.g., HSM, MPC) not stated.
- **Supported Blockchains**: Not stated
- **Architecture Type**: High-capacity transponder/muxponder card for optical transport platform; Layer 1 encryption solution.
- **Infrastructure Layer**: Network, Hardware
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: Not stated
- **Release Date**: 2025-09-25
- **FIPS Validated**: No (BSI approved for VS-NfD and EU/NATO-restricted data; FIPS status not mentioned)
- **Primary Platforms**: Adtran FSP 3000 open optical transport platform
- **Target Industries**: Critical infrastructure, Research and science, Finance and insurance, Energy and utilities, Public sector and defense
- **Regulatory Status**: BSI-approved for VS-NfD and EU/NATO-restricted data communication
- **PQC Roadmap Details**: Already deployed and certified; provides a path to upgrade in sync with evolving standards.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Adva_FSP_3000_S-Flex.html

---

## Codegic Khatim Sign Server

- **Category**: Digital Signature Software
- **Product Name**: Khatim Sign Server
- **Product Brief**: Digital signature software supporting PKCS#1 signatures with experimental Post Quantum Cryptography (PQC) capabilities.
- **PQC Support**: Partial (experimental support for Dilithium algorithms in v5.0)
- **PQC Capability Description**: Khatim PKI Server v5.0 offers experimental support for PQC, specifically the Dilithium algorithm (levels 2, 3, and 5). It supports generating CA certificates, CRLs, OCSP responses, timestamp responses, end-entity certificates, and PKCS#1 signatures using Dilithium. Note: Windows OS currently does not support verifying these PQC certificates. Future support for PAdES, XAdES, CAdES, JAdES, and ASic is planned.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: Dilithium (2, 3, 5), RSA, ECC (mentioned as vulnerable context)
- **Key Management Model**: Supports generating keys inside HSM or via SERVER/CLIENT_CSR policies within the Certificate Provider; mentions Key Vault > System Keys for key generation.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Server-based PKI infrastructure with Certificate Provider (CP) and RESTful interface; supports HSM integration.
- **Infrastructure Layer**: Security Stack
- **License Type**: Commercial
- **License**: Proprietary (Trial version available upon request)
- **Latest Version**: v5.0
- **Release Date**: 2024-12-10
- **FIPS Validated**: Not stated
- **Primary Platforms**: Windows (for CA installation, though PQC verification not supported on Windows), Linux/Unix implied for OpenSSL testing.
- **Target Industries**: Enterprise PKI administrators, organizations requiring digital signatures and certificate lifecycle management.
- **Regulatory Status**: ISO 27001, 9001, 14001 Certified (Company level); NIST standards referenced for PQC algorithms.
- **PQC Roadmap Details**: Experimental support currently available in v5.0 for Dilithium. Future plans include supporting PAdES, XAdES, CAdES, JAdES, and ASic container-based signature formats with PQC.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Dilithium (experimental), PKCS#1 (with Dilithium support), RSA, ECC (legacy context).
- **Authoritative Source URL**: https://codegic.com (inferred from domain structure in text, though specific product URL not explicitly listed as a single link)

---
