---
generated: 2026-03-31
collection: csc_004
documents_processed: 20
enrichment_method: ollama-qwen3.5:27b
---

## Codegic Khatim PKI Server

- **Category**: Public Key Infrastructure (PKI) Software
- **Product Name**: Khatim PKI Server
- **Product Brief**: A Public Key Infrastructure (PKI) server offering experimental Post Quantum Cryptography support for certificate lifecycle management.
- **PQC Support**: Yes (experimental support for Dilithium algorithms in v5.0)
- **PQC Capability Description**: Khatim PKI Server v5.0 offers experimental support for PQC, specifically the Dilithium algorithm (levels 2, 3, and 5). It supports generating CA certificates, CRLs, OCSP responses, Timestamp responses, End Entity certificates, and PKCS#1 signatures using Dilithium. Note: Windows OS currently does not support verifying these PQC certificates. Future support for PAdES, XAdES, CAdES, JAdES, and ASic is planned.
- **PQC Migration Priority**: High (Explicitly addresses quantum threats to RSA/ECC core PKI building blocks; enables proactive future-proofing)
- **Crypto Primitives**: Dilithium (levels 2, 3, 5), RSA, ECC
- **Key Management Model**: Supports generating keys inside HSM or via SERVER/CLIENT_CSR policies within the Certificate Provider.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Server-based PKI infrastructure with components for CA, RA, OCSP, TSA, Sign, and Verify servers; supports HSM integration.
- **Infrastructure Layer**: Security Stack
- **License Type**: Commercial
- **License**: Proprietary (Trial version available upon request)
- **Latest Version**: v5.0
- **Release Date**: 2024-12-10
- **FIPS Validated**: Not stated
- **Primary Platforms**: Windows (for CA installation, though PQC verification is not supported on Windows yet); supports RESTful interface for business applications.
- **Target Industries**: Enterprise, Government (implied by PKI and regulatory context), Digital Trust Services
- **Regulatory Status**: ISO 27001, 9001, 14001 Certified (Company level)
- **PQC Roadmap Details**: Experimental support for Dilithium in v5.0; future support planned for PAdES, XAdES, CAdES, JAdES, and ASic container based signature formats.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Dilithium (experimental), RSA, ECC (traditional)
- **Authoritative Source URL**: https://codegic.com (inferred from context of "Codegic" and product pages, though specific URL not explicitly listed as a single link in text; text mentions "Get in touch with our team")

---

## CZERTAINLY

- **Category**: Public Key Infrastructure (PKI) Software
- **Product Name**: CZERTAINLY
- **Product Brief**: Open-source platform for technology agnostic digital trust management and automation, including certificates, keys, signatures, and secrets.
- **PQC Support**: Unknown
- **PQC Capability Description**: Not stated in the provided text. No mention of Post-Quantum Cryptography algorithms, migration plans, or research status.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: X.509 (mentioned in repository name "CZERTAINLY-X509-Compliance-Provider"); specific signature algorithms (e.g., ECDSA, RSA) not explicitly listed.
- **Key Management Model**: Not stated; text mentions management of cryptographic keys and keystore entities but does not describe hierarchy, escrow, or rotation policies.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Open-source platform; components include Java core, TypeScript UI, Go templates, and Docker images (e.g., Keycloak optimized).
- **Infrastructure Layer**: Security Stack
- **License Type**: Open Source
- **License**: MIT (stated in repository listings for CZERTAINLY-Core, Interfaces, Common-Credential-Provider, etc.)
- **Latest Version**: Unknown
- **Release Date**: Not stated (Repository update dates show "Mar 31, 2026", but no specific software version release date is provided).
- **FIPS Validated**: No
- **Primary Platforms**: Not explicitly stated; repositories indicate usage of Java, TypeScript, Go, Docker, and Open Policy Agent.
- **Target Industries**: Not stated (GitHub sidebar lists industries like Healthcare, Financial services, etc., but these are GitHub categories, not specific CZERTAINLY targets).
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Digital signatures mentioned generally; specific schemes not listed.
- **Authoritative Source URL**: http://www.czertainly.com

---

## EVERTRUST STREAM

- **Category**: Public Key Infrastructure (PKI) Software
- **Product Name**: EVERTRUST STREAM (also referred to as Evertrust PKI)
- **Product Brief**: Sovereign Certificate Authority for enterprise-grade certificate issuance & management with full key control.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports NIST-approved post-quantum algorithms including ML-DSA, ML-KEM, and SLH-DSA. The platform is described as "Crypto-Agile," allowing the issuance of post-quantum certificates now and transparent migration of existing certificates when Q-day arrives without infrastructure reconstruction.
- **PQC Migration Priority**: High
- **Crypto Primitives**: RSA (2048, 3072, 4096, 8192-bit), ECDSA (P-256, P-384, P-521), EdDSA (Ed25519, Ed448), ML-DSA, ML-KEM, SLH-DSA, SHA-2, SHA-3
- **Key Management Model**: HSM-backed and Cloud KMS integration; supports hierarchical CA management (Root, Intermediate, External); isolates each authority on its own HSM; direct signing from HSM/Cloud KMS.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Non-blocking, fully asynchronous architecture; supports On-premises (RPM packages), Containerized (Docker, OpenShift, Kubernetes), and Cloud deployment with Active-Active clustering.
- **Infrastructure Layer**: Security Stack
- **License Type**: Commercial
- **License**: Proprietary (Subject to license terms and conditions)
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: Yes, Support for FIPS 140-2 Level 3 modules.
- **Primary Platforms**: Linux enterprise distributions (RPM), Docker, OpenShift, Kubernetes, Cloud environments with managed databases.
- **Target Industries**: Enterprise, Finance (mentioned "Grands Services Financiers"), Public Sector/Organizations (eIDAS compliance).
- **Regulatory Status**: eIDAS Qualified Trust Service Provider; ISO 27001 certified; Member of Hexatrust and PKI Consortium.
- **PQC Roadmap Details**: Built with NIST-approved post-quantum algorithms; enables immediate issuance of PQC certificates and transparent migration of existing certificates upon Q-day without infrastructure rebuild.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: RSA, ECDSA, EdDSA (Ed25519, Ed448), ML-DSA, SLH-DSA
- **Authoritative Source URL**: Not stated

---

## Eviden IDnomic PKI

- **Category**: Public Key Infrastructure (PKI) Software
- **Product Name**: IDnomic PKI
- **Product Brief**: A modular software suite enabling the management of trusted IT infrastructures based on X.509v3 standards and certificate lifecycle management.
- **PQC Support**: Planned (with timeline)
- **PQC Capability Description**: Post-Quantum Cryptography is a focus; analyzing recent PQC algorithms for support via hybrid certificates allowing coexistence of classic asymmetric cryptography with PQC. Targeting PQC-ready status by End of 2023.
- **PQC Migration Priority**: High
- **Crypto Primitives**: RSA (1024-4096), ECDSA, SHA-224, SHA-256, SHA-384, SHA-512, PKCS#1 v1.5, RSA PSS PKCS#1 v2.1
- **Key Management Model**: HSM-backed (supports Trustway, Thales, Utimaco, nCipher, AWS Cloud HSM); includes Key Escrow and Key Generation capabilities within the ID CA module.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Modular software suite; supports On-Premise and SaaS (Cloud) deployments; multi-tenant by design.
- **Infrastructure Layer**: Security Stack, Cloud
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Not stated
- **Release Date**: 2023-09-13
- **FIPS Validated**: No (Common Criteria EAL 4+ certified; RGS certified)
- **Primary Platforms**: RHEL, CentOS, SUSE, Rocky Linux; Cloud datacenters in France.
- **Target Industries**: Government and public sector, Finance & insurance, Telecommunications, Healthcare, Automotive, Energy, Retail & catering, Information technology.
- **Regulatory Status**: Common Criteria EAL 4+ certified; eIDAS compliant (LSTI N° 80291318-V3.0); RGS certified (Classifications 1, 2, and 3).
- **PQC Roadmap Details**: Analyzing recent post-quantum proof algorithms; implementing hybrid certificates for coexistence of classic and PQC cryptography; aiming to be PQC-ready by End of 2023.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: RSA (PKCS#1 v1.5, PSS PKCS#1 v2.1), ECDSA
- **Authoritative Source URL**: www.idnomic.com

---

## MTG AG CARA

- **Category**: Public Key Infrastructure (PKI) Software
- **Product Name**: MTG CARA (MTG Certificate Authority) / MTG CLM (MTG Certificate Lifecycle Manager)
- **Product Brief**: Flexible PKI platform and lifecycle manager for issuing, managing, and validating digital certificates with HSM support.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: The platform supports post-quantum cryptography (PQC) as part of its crypto agility features. It is designed to meet security standards like BSI TR-03145. Specific PQC algorithms are not listed in the text, only general support and a "PQC Size Calculator" tool availability.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Text mentions support for ACME, EST, CMP, SCEP protocols and HSMs, but does not list specific cryptographic algorithms like ECDSA or RSA).
- **Key Management Model**: HSM-backed; supports vendor-independent Hardware Security Modules (HSMs) including Securosys, Utimaco, nShield, Nitrokey, and Cloud Based HSM. Supports BYOK (Bring Your Own Key).
- **Supported Blockchains**: Not stated
- **Architecture Type**: Hybrid (On-Premises or Managed Service); supports Single, Two, and Three Location Architectures; High Availability; Docker Compose; Kubernetes; Linux Package.
- **Infrastructure Layer**: Security Stack
- **License Type**: Commercial
- **License**: Proprietary (Commercial)
- **Latest Version**: 6.10.0 (MTG CLM), 3.13.0 (MTG KMS)
- **Release Date**: Not stated
- **FIPS Validated**: No (Text mentions compliance with BSI TR-03145, but does not mention FIPS validation).
- **Primary Platforms**: Linux, Docker Compose, Kubernetes, Windows Server 2016 (for PKCS#12 conversion), Microsoft Active Directory, Microsoft Intune, Keycloak.
- **Target Industries**: Energy, Manufacturing, Public Sector, Health Care, Mobility, Finance, Smart Metering.
- **Regulatory Status**: Meets BSI TR-03145 for PKI operations; suitable for regulated or certification-critical environments.
- **PQC Roadmap Details**: Not stated (General support mentioned, but no specific timeline or algorithm migration plan provided).
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (Text contains internal navigation links and mentions mtg.de contact email, but no specific product URL is explicitly defined as the authoritative source).

---

## Nexus Group Certificate Manager

- **Category**: Public Key Infrastructure (PKI) Software
- **Product Name**: Nexus Certificate Manager
- **Product Brief**: Public Key Infrastructure software for certificate lifecycle management, key generation, and authority administration.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document lists support for DSA, EC, and RSA key pairs but contains no mention of Post-Quantum Cryptography algorithms or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: DSA, EC, RSA, AES, 3DES
- **Key Management Model**: Supports Hardware Security Module (HSM) initialization, Key Archiving and Recovery (KAR), and system key management for PIN encryption and KEK generation.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Server-based with support for Podman containerization, Virtual Machine (VM) installation, and client-server components (AWB, RA, CC, SP).
- **Infrastructure Layer**: Security Stack
- **License Type**: Commercial
- **License**: Proprietary (implied by "License file for Certificate Manager" and commercial vendor context; specific license text not stated)
- **Latest Version**: 8.14.0
- **Release Date**: Not stated
- **FIPS Validated**: No (Document mentions "Common Criteria certification" but does not state FIPS validation status)
- **Primary Platforms**: Linux, Windows, Podman, Microsoft SQL Server, Oracle, PostgreSQL, MySQL, MariaDB, SQLite, Azure SQL
- **Target Industries**: Enterprise (implied by PKI features like GDPR considerations, smart cards, and certificate factories)
- **Regulatory Status**: Common Criteria certified (Security Target document mentioned)
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: DSA, EC, RSA
- **Authoritative Source URL**: Not stated

---

## XiPKI

- **Category**: Public Key Infrastructure (PKI) Software
- **Product Name**: XiPKI
- **Product Brief**: Compact open source PKI (CA, OCSP responder) with full support of PQC MLDSA and MLKEM.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Native support for post-quantum algorithms including ML-DSA (Dilithium: 44, 65, 87), ML-KEM (Kyber: 512, 768, 1024), and composite variants (MLDSA/MLKEM) per draft-ietf-lamps-pq-composite-sigs/kem. Supports X.509 certificates with these algorithms.
- **PQC Migration Priority**: High
- **Crypto Primitives**: RSA, EC, Ed25519, Ed448, SM2, X25519, X448, MLDSA (ML-DSA-44, ML-DSA-65, ML-DSA-87), MLKEM (ML-KEM-512, ML-KEM-768, ML-KEM-1024), composite MLDSA, composite MLKEM, ECDSA, EdDSA, Diffie-Hellman Proof-of-Possession.
- **Key Management Model**: HSM integration via PKCS#11; supports key generation in tokens; database-backed CA configuration and data storage.
- **Supported Blockchains**: Not stated
- **Architecture Type**: On-premises software (Java-based), supports centralized or clustered database deployment, agentless management via CLI/REST API.
- **Infrastructure Layer**: Security Stack
- **License Type**: Open Source
- **License**: Apache Software License, Version 2.0
- **Latest Version**: placeholder-version (specific version number not explicitly stated in text, only referenced as variable)
- **Release Date**: Not stated
- **FIPS Validated**: No (Supports Bouncy Castle FIPS variant for compliance, but validation status not stated)
- **Primary Platforms**: Linux, Windows, MacOS; Java 11+; Tomcat 10/11; DB2, MariaDB, MySQL, Oracle, PostgreSQL, H2, HSQLDB.
- **Target Industries**: Critical infrastructure (implied by description), Enterprise (PKI use cases).
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Actively contributes to IETF standardization including C509 specification and COSE Working Group test vectors; supports draft composite algorithms.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: MLDSA (ML-DSA-44, 65, 87), Composite MLDSA, ECDSA (SHA-1/2/3/SHAKE), Ed25519, Ed448, RSA PKCS1v1.5 (SHA-1/2/3), RSA PSS (SHA-1/2/3/SHAKE), SM3withSM2.
- **Authoritative Source URL**: https://github.com/xipki/xipki

---
## Keyfactor EJBCA

- **Category**: Public Key Infrastructure (PKI) Software
- **Product Name**: Keyfactor EJBCA
- **Product Brief**: Open-source public key infrastructure (PKI) and certificate authority (CA) software covering full certificate lifecycle.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports NIST PQC finalists including Dilithium, FALCON, and SPHINCS+. Capabilities include inventory of PQC certificates, issuance of PQC certificates (Dilithium, FALCON), signing with PQC algorithms (SPHINCS+, Dilithium), and automation for migration/re-issuance. Available in EJBCA 8.0+ and SignServer 6.0+.
- **PQC Migration Priority**: High
- **Crypto Primitives**: ECDSA, EdDSA, RSA, Dilithium (ML-DSA), FALCON, SPHINCS+ (SLH-DSA)
- **Key Management Model**: HSM-backed (supports generic PKCS#11, AWS CloudHSM, Azure Key Vault, Thales Luna, Utimaco, etc.), supports remote authenticators and crypto tokens.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Centralized CA/RA/VA architecture; supports distributed RA/VAs, High Availability, Clustering, Container-based (Docker), Helm automation.
- **Infrastructure Layer**: Security Stack
- **License Type**: Open Source/Commercial
- **License**: LGPL-2.1 (Community Edition); Commercial License (Enterprise Edition)
- **Latest Version**: 9.5.1
- **Release Date**: Not stated
- **FIPS Validated**: No mention of specific FIPS validation status for the software itself; mentions support for FIPS 203, 204, 205 algorithms in draft format.
- **Primary Platforms**: Linux, Windows (runs on JVM/OpenJDK); Docker containers; Kubernetes (via Helm).
- **Target Industries**: Enterprise, Government (mentions government recommendations), IoT (Matter CAs), Cloud (AWS, Azure integrations).
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Supports NIST PQC finalists (Dilithium, FALCON, SPHINCS+); mentions transition planning and automation for re-issuance; references IETF drafts for certificate extensions and migration.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ECDSA, EdDSA, RSA, Dilithium, FALCON, SPHINCS+
- **Authoritative Source URL**: https://www.ejbca.org/ (Community), https://www.keyfactor.com/products/ejbca-enterprise/ (Enterprise)

---

## Venafi Trust Protection Platform

- **Category**: Public Key Infrastructure (PKI) Software
- **Product Name**: Venafi Trust Protection Platform (now part of CyberArk Machine Identity Security)
- **Product Brief**: Machine identity security platform providing certificate lifecycle management, enterprise PKI, workload identity, code signing, and SSH security.
- **PQC Support**: Unknown
- **PQC Capability Description**: Not stated in the document. No mention of Post-Quantum Cryptography algorithms, migration plans, or readiness status.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions TLS/SSL certificates and SSH security but does not list specific cryptographic algorithms like ECDSA, RSA, or Ed25519).
- **Key Management Model**: Not stated (Document mentions "Secrets Manager" and "Certificate Manager" but does not describe key hierarchy, HSM usage, MPC, or escrow details).
- **Supported Blockchains**: Not stated
- **Architecture Type**: SaaS and Self-Hosted (mentioned for Secrets Manager); Cloud-native and on-premises support mentioned generally.
- **Infrastructure Layer**: Security Stack
- **License Type**: Commercial
- **License**: Proprietary (Implied by "CyberArk Software Ltd." and commercial trial/purchase options; specific license text not stated).
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: Not stated
- **Primary Platforms**: Cloud-native, on-premises, third-party applications, Kubernetes (mentioned for Certificate Manager for Kubernetes).
- **Target Industries**: Automotive, Banking, Critical Infrastructure, Financial Services, Government, Healthcare, Insurance, Manufacturing, Managed Service Providers.
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (Document text contains navigation links but no specific product URL).

---

## Entrust PKI

- **Category**: Public Key Infrastructure (PKI) Software
- **Product Name**: Entrust PKI (including Entrust nShield HSM, Entrust Cryptographic Security Platform)
- **Product Brief**: Post-quantum ready PKI and security platform offering hybrid certificate issuance, crypto discovery, and HSM-backed key management.
- **PQC Support**: Yes (with details: Supports NIST-approved algorithms ML-DSA, ML-KEM, SLH-DSA; offers pure PQC and composite/hybrid certificates)
- **PQC Capability Description**: Entrust nShield HSMs are NIST-validated for ML-DSA, ML-KEM, and SLH-DSA with native firmware support. Entrust PKI supports issuing hybrid and pure PQC certificates (roots, intermediates, end-entity). The Cryptographic Security Platform unifies key/certificate/secrets management with crypto-agility for PQ transition.
- **PQC Migration Priority**: High
- **Crypto Primitives**: RSA, ECC, ML-DSA, ML-KEM, SLH-DSA
- **Key Management Model**: HSM-backed (Entrust nShield), centralized visibility via Cryptographic Security Platform, supports key generation/storage/operations in tamper-resistant hardware.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Hybrid (SaaS "PKI as a Service" and On-prem/Hardware "nShield HSM"), centralized management platform
- **Infrastructure Layer**: Security Stack, Hardware, Cloud
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: Yes (Entrust nShield HSMs are NIST-validated; Entrust nShield PQ SDK runs within FIPS 140-2 Level 3 physical boundary)
- **Primary Platforms**: Cloud-based offering ("PKI as a Service"), Hardware Security Modules (nShield), Enterprise environments
- **Target Industries**: Enterprise, Government, Finance (implied by "secure payments" and "governments")
- **Regulatory Status**: NIST standards compliance (CNSA 2.0 alignment mentioned); FIPS 140-2 Level 3 validation for HSM boundary
- **PQC Roadmap Details**: Supports NIST draft and approved standards; enables transition to hybrid and pure PQC architectures; aligns with NSA CNSA 2.0 deadlines (2025, 2030, 2033) and NIST deprecation timelines (2030, 2035).
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA, SLH-DSA (PQC); RSA, ECC (Classical)
- **Authoritative Source URL**: www.entrust.com

---

## Microsoft AD CS

- **Category**: Public Key Infrastructure (PKI) Software
- **Product Name**: Active Directory Certificate Services (AD CS)
- **Product Brief**: Provides public key infrastructure (PKI) for cryptography, digital certificates and signature capabilities.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document mentions "Disable weak cryptographic algorithms" but does not explicitly mention Post-Quantum Cryptography algorithms or support.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions "weak cryptographic algorithms" generally but does not list specific primitives like ECDSA, RSA, etc.)
- **Key Management Model**: Key Storage Provider (KSP) mentioned for migrating Certification Authority keys; no specific hierarchy or escrow details provided.
- **Supported Blockchains**: Not stated
- **Architecture Type**: On-premises PKI infrastructure (implied by "Active Directory" and "Certification Authority role service"); specific deployment architecture (centralized vs distributed) not explicitly defined beyond standard AD CS roles.
- **Infrastructure Layer**: Security Stack
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: No
- **Primary Platforms**: Microsoft Windows (implied by "Active Directory" and "Microsoft Edge" context), though specific OS versions are not listed.
- **Target Industries**: Enterprise, Government (implied by "Active Directory" usage), but not explicitly stated in the text.
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (Text is from a documentation page, but no specific URL is provided in the content).

---

## smallstep Certificate Authority

- **Category**: Public Key Infrastructure (PKI) Software
- **Product Name**: smallstep Certificate Authority (step-ca)
- **Product Brief**: An online Certificate Authority for secure, automated X.509 and SSH certificate management.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC), PQC algorithms, or migration plans. It explicitly lists support for RSA, ECDSA, and EdDSA only.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: RSA, ECDSA, EdDSA
- **Key Management Model**: Supports integrations with PKCS #11 HSMs, Google Cloud KMS, AWS KMS, and YubiKey PIV for signing key protection; designed for a two-tiered PKI with an offline Root CA and online Intermediate CA.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Online Certificate Authority (CA) server; supports centralized deployment or high availability via root federation; can operate as an intermediate CA or Registration Authority (RA).
- **Infrastructure Layer**: Security Stack
- **License Type**: Open Source/Commercial
- **License**: Apache-2.0 (for step-ca/open source); Commercial license available for hosted Smallstep authority and advanced features.
- **Latest Version**: Not stated
- **Release Date**: 2026-03-06 (Repository last updated)
- **FIPS Validated**: No (Document states "FIPS-compliant software" is a feature of the commercial product, implying step-ca open source does not have it).
- **Primary Platforms**: Linux, macOS, Windows (implied by browser/OS integrations), Kubernetes, Docker; Cloud platforms: AWS, GCP, Azure.
- **Target Industries**: Enterprise, DevOps, Security
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: RSA, ECDSA, EdDSA
- **Authoritative Source URL**: https://github.com/smallstep/certificates

---

## Let's Encrypt

- **Category**: Public Key Infrastructure (PKI) Software
- **Product Name**: Boulder
- **Product Brief**: An ACME-based certificate authority written in Go that runs Let's Encrypt.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC), PQC algorithms, or any plans for PQC migration. It focuses on standard ACME protocol implementation.
- **PQC Migration Priority**: Low
- **Crypto Primitives**: Not stated (Document mentions "private key material" and certificates generally but does not list specific algorithms like ECDSA, RSA, or Ed25519).
- **Key Management Model**: Not stated (Document mentions components talk to a Storage Authority for persistent copies of objects and uses MariaDB/S3, but does not describe the specific key hierarchy, HSM usage, or custody model).
- **Supported Blockchains**: Not stated
- **Architecture Type**: Microservices-based CA with gRPC inter-component communication; includes Web Front Ends, Registration Authority, Validation Authority, Certificate Authority, Storage Authority, Publisher, and CRL Updater.
- **Infrastructure Layer**: Application, Cloud (via Docker deployment)
- **License Type**: Open Source
- **License**: MPL-2.0
- **Latest Version**: Not stated
- **Release Date**: 2026-03-25 (Last Updated timestamp in repository metadata)
- **FIPS Validated**: No
- **Primary Platforms**: Docker, Linux (implied by Go/Docker environment), MariaDB, S3
- **Target Industries**: Web PKI, Certificate Authorities
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://github.com/letsencrypt/boulder

---

## Codegic Khatim PKI Server

- **Category**: Public Key Infrastructure (PKI) Software
- **Product Name**: Khatim PKI Server
- **Product Brief**: A Public Key Infrastructure (PKI) server offering experimental Post Quantum Cryptography support for certificate lifecycle management.
- **PQC Support**: Yes (experimental support for Dilithium algorithms in v5.0)
- **PQC Capability Description**: Khatim PKI Server v5.0 offers experimental support for PQC, specifically the Dilithium algorithm (levels 2, 3, and 5). It supports generating CA certificates, CRLs, OCSP responses, Timestamp responses, End Entity certificates, and PKCS#1 signatures using Dilithium. Note: Windows OS currently does not support verifying these PQC certificates. Future support for PAdES, XAdES, CAdES, JAdES, and ASic is planned.
- **PQC Migration Priority**: High (Explicitly addresses quantum threats to RSA/ECC core PKI building blocks; enables proactive future-proofing)
- **Crypto Primitives**: Dilithium (levels 2, 3, 5), RSA, ECC
- **Key Management Model**: Supports generating keys inside HSM or via SERVER/CLIENT_CSR policies within the Certificate Provider.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Server-based PKI infrastructure with components for CA, RA, OCSP, TSA, Sign, and Verify servers; supports HSM integration.
- **Infrastructure Layer**: Security Stack
- **License Type**: Commercial
- **License**: Proprietary (Trial version available upon request)
- **Latest Version**: v5.0
- **Release Date**: 2024-12-10
- **FIPS Validated**: Not stated
- **Primary Platforms**: Windows (for CA installation, though PQC verification is not supported on Windows yet); supports RESTful interface for business applications.
- **Target Industries**: Enterprise, Government (implied by PKI and regulatory context), Digital Trust Services
- **Regulatory Status**: ISO 27001, 9001, 14001 Certified (Company level)
- **PQC Roadmap Details**: Experimental support for Dilithium in v5.0; future support planned for PAdES, XAdES, CAdES, JAdES, and ASic container based signature formats.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Dilithium (experimental), RSA, ECC (traditional)
- **Authoritative Source URL**: https://codegic.com (inferred from context of "Codegic" and product pages, though specific URL not explicitly listed as a single link in text; text mentions "Get in touch with our team")

---

## CZERTAINLY

- **Category**: Public Key Infrastructure (PKI) Software
- **Product Name**: CZERTAINLY
- **Product Brief**: Open-source platform for technology agnostic digital trust management and automation, including certificates, keys, signatures, and secrets.
- **PQC Support**: Unknown
- **PQC Capability Description**: Not stated in the provided text. No mention of Post-Quantum Cryptography algorithms, migration plans, or research status.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: X.509 (mentioned in repository name "CZERTAINLY-X509-Compliance-Provider"); specific signature algorithms (e.g., ECDSA, RSA) not explicitly listed.
- **Key Management Model**: Not stated; text mentions management of cryptographic keys and keystore entities but does not describe hierarchy, escrow, or rotation policies.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Open-source platform; components include Java core, TypeScript UI, Go templates, and Docker images (e.g., Keycloak optimized).
- **Infrastructure Layer**: Security Stack
- **License Type**: Open Source
- **License**: MIT (stated in repository listings for CZERTAINLY-Core, Interfaces, Common-Credential-Provider, etc.)
- **Latest Version**: Unknown
- **Release Date**: Not stated (Repository update dates show "Mar 31, 2026", but no specific software version release date is provided).
- **FIPS Validated**: No
- **Primary Platforms**: Not explicitly stated; repositories indicate usage of Java, TypeScript, Go, Docker, and Open Policy Agent.
- **Target Industries**: Not stated (GitHub sidebar lists industries like Healthcare, Financial services, etc., but these are GitHub categories, not specific CZERTAINLY targets).
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Digital signatures mentioned generally; specific schemes not listed.
- **Authoritative Source URL**: http://www.czertainly.com

---

## EVERTRUST STREAM

- **Category**: Public Key Infrastructure (PKI) Software
- **Product Name**: EVERTRUST STREAM (also referred to as Evertrust PKI)
- **Product Brief**: Sovereign Certificate Authority for enterprise-grade certificate issuance & management with full key control.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports NIST-approved post-quantum algorithms including ML-DSA, ML-KEM, and SLH-DSA. The platform is described as "Crypto-Agile," allowing the issuance of post-quantum certificates now and transparent migration of existing certificates when Q-day arrives without infrastructure reconstruction.
- **PQC Migration Priority**: High
- **Crypto Primitives**: RSA (2048, 3072, 4096, 8192-bit), ECDSA (P-256, P-384, P-521), EdDSA (Ed25519, Ed448), ML-DSA, ML-KEM, SLH-DSA, SHA-2, SHA-3
- **Key Management Model**: HSM-backed and Cloud KMS integration; supports hierarchical CA management (Root, Intermediate, External); isolates each authority on its own HSM; direct signing from HSM/Cloud KMS.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Non-blocking, fully asynchronous architecture; supports On-premises (RPM packages), Containerized (Docker, OpenShift, Kubernetes), and Cloud deployment with Active-Active clustering.
- **Infrastructure Layer**: Security Stack
- **License Type**: Commercial
- **License**: Proprietary (Subject to license terms and conditions)
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: Yes, Support for FIPS 140-2 Level 3 modules.
- **Primary Platforms**: Linux enterprise distributions (RPM), Docker, OpenShift, Kubernetes, Cloud environments with managed databases.
- **Target Industries**: Enterprise, Finance (mentioned "Grands Services Financiers"), Public Sector/Organizations (eIDAS compliance).
- **Regulatory Status**: eIDAS Qualified Trust Service Provider; ISO 27001 certified; Member of Hexatrust and PKI Consortium.
- **PQC Roadmap Details**: Built with NIST-approved post-quantum algorithms; enables immediate issuance of PQC certificates and transparent migration of existing certificates upon Q-day without infrastructure rebuild.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: RSA, ECDSA, EdDSA (Ed25519, Ed448), ML-DSA, SLH-DSA
- **Authoritative Source URL**: Not stated

---

## Eviden IDnomic PKI

- **Category**: Public Key Infrastructure (PKI) Software
- **Product Name**: IDnomic PKI
- **Product Brief**: A modular software suite enabling the management of trusted IT infrastructures based on X.509v3 standards and certificate lifecycle management.
- **PQC Support**: Planned (with timeline)
- **PQC Capability Description**: Post-Quantum Cryptography is a focus; analyzing recent PQC algorithms for support via hybrid certificates allowing coexistence of classic asymmetric cryptography with PQC. Targeting PQC-ready status by End of 2023.
- **PQC Migration Priority**: High
- **Crypto Primitives**: RSA (1024-4096), ECDSA, SHA-224, SHA-256, SHA-384, SHA-512, PKCS#1 v1.5, RSA PSS PKCS#1 v2.1
- **Key Management Model**: HSM-backed (supports Trustway, Thales, Utimaco, nCipher, AWS Cloud HSM); includes Key Escrow and Key Generation capabilities within the ID CA module.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Modular software suite; supports On-Premise and SaaS (Cloud) deployments; multi-tenant by design.
- **Infrastructure Layer**: Security Stack, Cloud
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Not stated
- **Release Date**: 2023-09-13
- **FIPS Validated**: No (Common Criteria EAL 4+ certified; RGS certified)
- **Primary Platforms**: RHEL, CentOS, SUSE, Rocky Linux; Cloud datacenters in France.
- **Target Industries**: Government and public sector, Finance & insurance, Telecommunications, Healthcare, Automotive, Energy, Retail & catering, Information technology.
- **Regulatory Status**: Common Criteria EAL 4+ certified; eIDAS compliant (LSTI N° 80291318-V3.0); RGS certified (Classifications 1, 2, and 3).
- **PQC Roadmap Details**: Analyzing recent post-quantum proof algorithms; implementing hybrid certificates for coexistence of classic and PQC cryptography; aiming to be PQC-ready by End of 2023.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: RSA (PKCS#1 v1.5, PSS PKCS#1 v2.1), ECDSA
- **Authoritative Source URL**: www.idnomic.com

---

## MTG AG CARA

- **Category**: Public Key Infrastructure (PKI) Software
- **Product Name**: MTG CARA (MTG Certificate Authority) / MTG CLM (MTG Certificate Lifecycle Manager)
- **Product Brief**: Flexible PKI platform and lifecycle manager for issuing, managing, and validating digital certificates with HSM support.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: The platform supports post-quantum cryptography (PQC) as part of its crypto agility features. It is designed to meet security standards like BSI TR-03145. Specific PQC algorithms are not listed in the text, only general support and a "PQC Size Calculator" tool availability.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Text mentions support for ACME, EST, CMP, SCEP protocols and HSMs, but does not list specific cryptographic algorithms like ECDSA or RSA).
- **Key Management Model**: HSM-backed; supports vendor-independent Hardware Security Modules (HSMs) including Securosys, Utimaco, nShield, Nitrokey, and Cloud Based HSM. Supports BYOK (Bring Your Own Key).
- **Supported Blockchains**: Not stated
- **Architecture Type**: Hybrid (On-Premises or Managed Service); supports Single, Two, and Three Location Architectures; High Availability; Docker Compose; Kubernetes; Linux Package.
- **Infrastructure Layer**: Security Stack
- **License Type**: Commercial
- **License**: Proprietary (Commercial)
- **Latest Version**: 6.10.0 (MTG CLM), 3.13.0 (MTG KMS)
- **Release Date**: Not stated
- **FIPS Validated**: No (Text mentions compliance with BSI TR-03145, but does not mention FIPS validation).
- **Primary Platforms**: Linux, Docker Compose, Kubernetes, Windows Server 2016 (for PKCS#12 conversion), Microsoft Active Directory, Microsoft Intune, Keycloak.
- **Target Industries**: Energy, Manufacturing, Public Sector, Health Care, Mobility, Finance, Smart Metering.
- **Regulatory Status**: Meets BSI TR-03145 for PKI operations; suitable for regulated or certification-critical environments.
- **PQC Roadmap Details**: Not stated (General support mentioned, but no specific timeline or algorithm migration plan provided).
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (Text contains internal navigation links and mentions mtg.de contact email, but no specific product URL is explicitly defined as the authoritative source).

---

## Nexus Group Certificate Manager

- **Category**: Public Key Infrastructure (PKI) Software
- **Product Name**: Nexus Certificate Manager
- **Product Brief**: Public Key Infrastructure software for certificate lifecycle management, key generation, and authority administration.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document lists support for DSA, EC, and RSA key pairs but contains no mention of Post-Quantum Cryptography algorithms or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: DSA, EC, RSA, AES, 3DES
- **Key Management Model**: Supports Hardware Security Module (HSM) initialization, Key Archiving and Recovery (KAR), and system key management for PIN encryption and KEK generation.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Server-based with support for Podman containerization, Virtual Machine (VM) installation, and client-server components (AWB, RA, CC, SP).
- **Infrastructure Layer**: Security Stack
- **License Type**: Commercial
- **License**: Proprietary (implied by "License file for Certificate Manager" and commercial vendor context; specific license text not stated)
- **Latest Version**: 8.14.0
- **Release Date**: Not stated
- **FIPS Validated**: No (Document mentions "Common Criteria certification" but does not state FIPS validation status)
- **Primary Platforms**: Linux, Windows, Podman, Microsoft SQL Server, Oracle, PostgreSQL, MySQL, MariaDB, SQLite, Azure SQL
- **Target Industries**: Enterprise (implied by PKI features like GDPR considerations, smart cards, and certificate factories)
- **Regulatory Status**: Common Criteria certified (Security Target document mentioned)
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: DSA, EC, RSA
- **Authoritative Source URL**: Not stated

---

## XiPKI

- **Category**: Public Key Infrastructure (PKI) Software
- **Product Name**: XiPKI
- **Product Brief**: Compact open source PKI (CA, OCSP responder) with full support of PQC MLDSA and MLKEM.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Native support for post-quantum algorithms including ML-DSA (Dilithium: 44, 65, 87), ML-KEM (Kyber: 512, 768, 1024), and composite variants (MLDSA/MLKEM) per draft-ietf-lamps-pq-composite-sigs/kem. Supports X.509 certificates with these algorithms.
- **PQC Migration Priority**: High
- **Crypto Primitives**: RSA, EC, Ed25519, Ed448, SM2, X25519, X448, MLDSA (ML-DSA-44, ML-DSA-65, ML-DSA-87), MLKEM (ML-KEM-512, ML-KEM-768, ML-KEM-1024), composite MLDSA, composite MLKEM, ECDSA, EdDSA, Diffie-Hellman Proof-of-Possession.
- **Key Management Model**: HSM integration via PKCS#11; supports key generation in tokens; database-backed CA configuration and data storage.
- **Supported Blockchains**: Not stated
- **Architecture Type**: On-premises software (Java-based), supports centralized or clustered database deployment, agentless management via CLI/REST API.
- **Infrastructure Layer**: Security Stack
- **License Type**: Open Source
- **License**: Apache Software License, Version 2.0
- **Latest Version**: placeholder-version (specific version number not explicitly stated in text, only referenced as variable)
- **Release Date**: Not stated
- **FIPS Validated**: No (Supports Bouncy Castle FIPS variant for compliance, but validation status not stated)
- **Primary Platforms**: Linux, Windows, MacOS; Java 11+; Tomcat 10/11; DB2, MariaDB, MySQL, Oracle, PostgreSQL, H2, HSQLDB.
- **Target Industries**: Critical infrastructure (implied by description), Enterprise (PKI use cases).
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Actively contributes to IETF standardization including C509 specification and COSE Working Group test vectors; supports draft composite algorithms.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: MLDSA (ML-DSA-44, 65, 87), Composite MLDSA, ECDSA (SHA-1/2/3/SHAKE), Ed25519, Ed448, RSA PKCS1v1.5 (SHA-1/2/3), RSA PSS (SHA-1/2/3/SHAKE), SM3withSM2.
- **Authoritative Source URL**: https://github.com/xipki/xipki

---
