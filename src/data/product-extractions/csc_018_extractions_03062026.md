---
generated: 2026-03-06
collection: csc_018
documents_processed: 8
enrichment_method: ollama-qwen3.5:27b
---

## SSLyze

- **Category**: Cryptographic Protocol Analyzers
- **Product Name**: SSLyze
- **Product Brief**: Fast and powerful SSL/TLS scanning tool and Python library to analyze server configurations and detect vulnerabilities.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document mentions checking for "strong encryption settings" and specific classical algorithms (RSA, ECDSA) but contains no mention of Post-Quantum Cryptography algorithms or support.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: RSA, ECDSA, TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384, TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256, TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Python library / Scanning tool (CLI and Docker)
- **Infrastructure Layer**: Network
- **License Type**: Open Source
- **License**: AGPL-3.0
- **Latest Version**: 6.1.0
- **Release Date**: 2026-02-26
- **FIPS Validated**: No
- **Primary Platforms**: Windows, Linux (x86 or x64), macOS, Docker, AWS Lambda
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: sha256WithRSAEncryption, ecdsa-with-SHA512, ecdsa-with-SHA256, ecdsa-with-SHA384 (mentioned as recommended standards for compliance checks)
- **Authoritative Source URL**: https://github.com/nabla-c0d3/sslyze

---

## testssl.sh

- **Category**: Cryptographic Protocol Analyzers
- **Product Name**: testssl.sh
- **Product Brief**: A free command line tool which checks a server's service on any port for the support of TLS/SSL ciphers, protocols as well as some cryptographic flaws.
- **PQC Support**: Partial (with scope)
- **PQC Capability Description**: The tool includes topics "kem" and "pqcrypto", indicating it can test for Post-Quantum Cryptography capabilities such as Key Encapsulation Mechanisms on servers. It is a testing/analysis tool, not an implementation of PQC itself. No specific PQC algorithms (e.g., Kyber, Dilithium) are explicitly listed as being implemented by the tool, only that it checks for their support.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: TLS, SSL, cipher, kem (Key Encapsulation Mechanism), pqcrypto (Post-Quantum Cryptography), openssl, LibreSSL, quic
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Command line tool (CLI)
- **Infrastructure Layer**: Network
- **License Type**: Open Source
- **License**: GPL-2.0
- **Latest Version**: 3.3dev
- **Release Date**: 2026-03-06
- **FIPS Validated**: No
- **Primary Platforms**: Linux, MacOS, FreeBSD, NetBSD, WSL2, MSYS2/Cygwin, OpenBSD, Docker (linux/amd64, linux/386, linux/arm64, linux/arm/v7, linux/arm/v6, linux/ppc64le)
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://github.com/drwetter/testssl.sh

---

## Suricata IDS/IPS

- **Category**: Cryptographic Protocol Analyzers
- **Product Name**: Suricata
- **Product Brief**: A network IDS, IPS and NSM engine developed by the OISF and the Suricata community.
- **PQC Support**: No
- **PQC Capability Description**: Not stated in the document. The text describes Suricata as a network security monitoring engine but contains no mention of Post-Quantum Cryptography algorithms, implementation status, or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated (Document describes it as a network IDS/IPS engine; no specific crypto architecture like MPC or HSM is mentioned).
- **Infrastructure Layer**: Security Stack, Network
- **License Type**: Open Source
- **License**: GPL-2.0
- **Latest Version**: Unknown
- **Release Date**: 2026-03-06 (Last Updated date provided)
- **FIPS Validated**: No
- **Primary Platforms**: Not stated (Mentions "different OS'" in the context of QA tests, but does not list specific supported operating systems).
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://suricata.io

---

## Zeek Network Analysis Framework

- **Category**: Cryptographic Protocol Analyzers
- **Product Name**: Zeek Network Analysis Framework
- **Product Brief**: A powerful framework for network traffic analysis and security monitoring.
- **PQC Support**: No
- **PQC Capability Description**: Not stated in the document. The text describes Zeek as a network analysis framework with protocol analyzers but contains no mention of Post-Quantum Cryptography algorithms, implementation status, or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated (Document describes it as a network analysis framework, not a key management architecture).
- **Infrastructure Layer**: Security Stack, Network
- **License Type**: Open Source
- **License**: BSD license
- **Latest Version**: Unknown
- **Release Date**: 2026-03-06 (Last Updated date)
- **FIPS Validated**: No
- **Primary Platforms**: Not stated (Installation instructions imply Unix/Linux environments via `./configure` and `make`, but specific OS names are not listed).
- **Target Industries**: Major companies, educational institutions, scientific institutions
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://www.zeek.org

---

## Tenable Nessus Professional

- **Category**: Cryptographic Protocol Analyzers
- **Product Name**: Tenable Nessus Professional
- **Product Brief**: The industry's most trusted vulnerability assessment solution to expose and close weaknesses across your attack surface.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document focuses on vulnerability assessment, CVE coverage, and compliance checks but contains no mention of Post-Quantum Cryptography algorithms, support, or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated (Document mentions deployment on various platforms including Raspberry Pi and integration with Tenable One, but does not specify cryptographic architecture).
- **Infrastructure Layer**: Security Stack
- **License Type**: Commercial
- **License**: Proprietary (Pricing listed: 1 Year - $4,790; 2 Years - $9,330.95; 3 Years - $13,637.54)
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No (Document mentions "Configuration, compliance and security audits" and lists regulations like FISMA, but does not explicitly state FIPS 140-2 or 140-3 validation status for the product).
- **Primary Platforms**: Raspberry Pi, Windows, Linux, macOS (implied by "Deploy on any platform" and "Use anywhere", though specific OS names are not listed in the text provided).
- **Target Industries**: Educational institutions, Energy, Banks and financial services, Healthcare, Retail, Public Sector, State / Local / Education, US federal.
- **Regulatory Status**: Not stated (Document lists compliance frameworks like FISMA, HIPAA, NERC CIP, NIS directive, PCI, but does not state the product holds specific regulatory licenses or charters).
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (Document text contains navigation links but no explicit authoritative source URL string).

---

## Rapid7 InsightVM

- **Category**: Cryptographic Protocol Analyzers
- **Product Name**: Rapid7 InsightVM
- **Product Brief**: Vulnerability management solution providing attack surface visibility, AI-driven risk prioritization, and remediation workflows.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC) support, algorithms, or migration plans. It references NIST CNSA strength encryption for the Scan Assistant but does not specify PQC algorithms.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: TLS, X.509 certificates, Public-private key encryption, NIST CNSA (Commercial National Security Algorithm Suite) strength encryption
- **Key Management Model**: Uses digital certificates (X.509) for authenticated scanning instead of administrative credentials; supports automatic digital certificate generation and rotation via Security Console.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Hybrid deployment with single agent, agentless scanning options, Scan Engines, and a Security Console; includes lightweight Scan Assistant service on assets.
- **Infrastructure Layer**: Security Stack
- **License Type**: Commercial
- **License**: Proprietary (Commercial)
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No mention of FIPS 140-2 or 140-3 validation status.
- **Primary Platforms**: Microsoft Windows, Linux; Cloud and hybrid environments; On-premises (Scan Engines, Security Console).
- **Target Industries**: Financial Services, Enterprise (general), Government (implied by compliance standards like HIPAA/CIS/PCI DSS)
- **Regulatory Status**: Supports compliance assessments for CIS, PCI DSS, and HIPAA.
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: X.509 certificates (specific signature algorithm not stated); Public-private key encryption.
- **Authoritative Source URL**: https://www.rapid7.com/try/insight/

---

## Qualys Cloud Platform

- **Category**: Cryptographic Protocol Analyzers
- **Product Name**: Qualys Cloud Platform (Enterprise TruRisk™ Platform / VMDR)
- **Product Brief**: Unified risk-based vulnerability management, detection, and response platform with asset discovery and patching.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document focuses on vulnerability management, threat intelligence, and certificate inventory but contains no mention of Post-Quantum Cryptography algorithms or migration capabilities.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions "expired certs" and "SSL certs" generally but does not list specific cryptographic primitives like ECDSA, RSA, or Ed25519).
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Cloud-based SaaS platform with agents (Cloud Agents), passive sensors, and gateways; supports on-prem, cloud, and internet-facing assets.
- **Infrastructure Layer**: Security Stack, Cloud
- **License Type**: Commercial
- **License**: Proprietary (Subscription-based)
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: Not stated
- **Primary Platforms**: On-prem, Cloud, Internet-facing assets; integrates with ServiceNow, JIRA, BMC Helix, Active Directory.
- **Target Industries**: Enterprise (Forbes Global 100, Fortune 100), Finance (Banco PAN), Healthcare/Services (Cintas)
- **Regulatory Status**: Supports compliance standards including CISA, PCI DSS (including PCI 4.0), FedRAMP, NIST, and SOC 2.
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated

---

## Snort IDS/IPS

- **Category**: Cryptographic Protocol Analyzers
- **Product Name**: Snort++ (Snort 3)
- **Product Brief**: Next generation Snort IPS (Intrusion Prevention System) with pluggable components and multi-threaded packet processing.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography, PQC algorithms, or any related migration plans. It only mentions OpenSSL for SHA, MD5, and SSL service detection.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: SHA, MD5 (via OpenSSL); SSL/TLS (implied by "SSL service detection")
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Intrusion Prevention System (IPS) with pluggable components and shared configuration; supports multiple packet processing threads.
- **Infrastructure Layer**: Security Stack, Network
- **License Type**: Open Source
- **License**: NOASSERTION
- **Latest Version**: 3.0.0 (Build 250)
- **Release Date**: Not stated (Last Updated: 2026-03-06T11:27:09Z refers to repository update, not product release)
- **FIPS Validated**: No
- **Primary Platforms**: Cross platform support mentioned; Windows support is on the roadmap.
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://github.com/snort3/snort3

---
