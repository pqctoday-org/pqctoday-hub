---
generated: 2026-03-26
collection: csc_061
documents_processed: 6
enrichment_method: ollama-qwen3.5:27b
---

## VIAVI TeraVM Security Test

- **Category**: Network Testing & Validation Tools
- **Product Name**: TeraVM Security Test
- **Product Brief**: Cloud-enabled test platform for emulating large-scale user traffic over secure connections to measure PQC performance.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: First cloud-enabled test platform to support PQC algorithms mandated by NIST. Enables benchmarking of enterprise devices, CDNs, and endpoints initiating or terminating IPSec Traffic using PQC. Measures performance overhead and quality vectors.
- **PQC Migration Priority**: High
- **Crypto Primitives**: Not stated (Text mentions "PQC algorithms mandated by NIST" and "IPSec Traffic" but does not list specific primitives like Kyber, Dilithium, etc.)
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Software-based test tool; Cloud-enabled platform
- **Infrastructure Layer**: Network, Cloud
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Unknown
- **Release Date**: 2024-04-09
- **FIPS Validated**: Not stated
- **Primary Platforms**: Commercial-off-the-shelf (COTS) servers, Cloud platforms
- **Target Industries**: Network security infrastructure vendors, Service providers, Research institutes, Governments, Enterprises, Military, Mobile operators
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Supports PQC algorithms mandated by the U.S. National Institute of Standards and Technology (NIST) for IPSec Traffic benchmarking.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: www.viavisolutions.com

---

## VIAVI Observer Analyzer

- **Category**: Network Testing & Validation Tools
- **Product Name**: Observer Analyzer
- **Product Brief**: Network analyzer offering packet capture, decode, and troubleshooting for unified communications and network security performance.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document describes a network performance monitoring and packet analysis tool but contains no mention of Post-Quantum Cryptography algorithms, support, or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions SSL decryption and SRTP support but does not specify underlying cryptographic primitives like ECDSA, RSA, or AES).
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Software deployment on laptop or centrally deployed suite; part of Observer Performance Management Platform.
- **Infrastructure Layer**: Network
- **License Type**: Commercial
- **License**: Proprietary (Commercial)
- **Latest Version**: Unknown (Document mentions "latest version" generally but no specific version number).
- **Release Date**: Not stated
- **FIPS Validated**: Not stated
- **Primary Platforms**: Laptop (network engineer's laptop), Windows (implied by Microsoft UC support and OS type tracking), integration with IBM Tivoli and HP OpenView.
- **Target Industries**: Financial Services, Healthcare Organizations, Manufacturing, Service Providers, Government (US Department of Veterans Affairs, Eglin Air Force Base mentioned in case studies).
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://www.viavisolutions.com/products/observer-platform/observer-analyzer (Inferred from source filename and context, though exact URL not explicitly printed in text body).

---

## CryptoNext COMPASS Network Probe

- **Category**: Network Testing & Validation Tools
- **Product Name**: CryptoNext COMPASS Network Probe
- **Product Brief**: High-performance passive network probe detecting and extracting cryptographic data in real-time via TAP.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: The product uses post-quantum TLS 1.3 for its own encrypted communications and secure remote access. It is designed to detect, inventory, and analyze cryptographic assets to support PQC migration strategies, but the text does not state it performs PQC encryption on user traffic itself.
- **PQC Migration Priority**: High
- **Crypto Primitives**: TLS 1.3 (Post-Quantum), X.509 Certificate, TPM Key Storage
- **Key Management Model**: Authentication by Certificate; TPM storage for keys; Secure Boot and Software integrity checks.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Hardware appliance (1U rack-mounted) with passive deployment via TAP.
- **Infrastructure Layer**: Network, Hardware
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Hardened Operating System (specific OS not named); integrates with Kafka Cluster server (version 7.3.3).
- **Target Industries**: Banking, Finance, Defense, Energy, Aerospace, Public sectors.
- **Regulatory Status**: Not stated (Company is NIST CAVP certified for algorithms, but product specific regulatory status not detailed).
- **PQC Roadmap Details**: Supports organizations in PQC migration by identifying assets and assessing vulnerabilities; enables long-term auditability for regulatory compliance.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated (Uses X.509 Certificates for authentication, specific signature algorithms not listed).
- **Authoritative Source URL**: cryptonext-security.com

---

## pqcscan

- **Category**: Network Testing & Validation Tools
- **Product Name**: pqcscan
- **Product Brief**: A Rust utility to scan SSH/TLS servers for Post-Quantum Cryptography algorithm support and generate reports.
- **PQC Support**: Yes (with details) - Scans for PQC support in SSH KEX and TLS algorithms; identifies standardized PQC-hybrid and PQC algorithms.
- **PQC Capability Description**: The tool scans SSH and TLS servers to identify stated support for Post-Quantum Cryptography algorithms. For SSH, it checks a manually curated list of KEX algorithms based on OpenSSH and OQS-OpenSSH, including experimental ones. For TLS, it identifies common and standardized PQC-hybrid and PQC algorithms but currently excludes experimental algorithms due to scanning time constraints. It outputs results in JSON and HTML formats.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: sntrup761x25519-sha512, curve25519-sha256 (identified as non-PQC), generic PQC-hybrid algorithms, generic PQC algorithms.
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Command-line utility / Scanner
- **Infrastructure Layer**: Network
- **License Type**: Open Source
- **License**: BSD-2-Clause
- **Latest Version**: Not stated
- **Release Date**: 2026-03-20 (Last Updated)
- **FIPS Validated**: No
- **Primary Platforms**: Linux, MacOS, Windows
- **Target Industries**: System administrators, infosec practitioners
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Mentions USA, EU, and UK deadlines for phasing out non-PQC algorithms between 2030-2035; notes potential future addition of experimental TLS algorithms.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated (Tool scans for KEX and cipher suites, not specific signature schemes)
- **Authoritative Source URL**: https://github.com/anvilsecure/pqcscan

---

## PQC-LEO

- **Category**: Network Testing & Validation Tools
- **Product Name**: PQC-LEO (PQC-Library Evaluation Operator)
- **Product Brief**: Comprehensive benchmarking and evaluation framework for Post-Quantum Cryptography algorithms using OpenSSL and OQS libraries.
- **PQC Support**: Yes (with details: Supports computational and TLS-based PQC performance testing via Liboqs and OQS-Provider).
- **PQC Capability Description**: Automated framework for benchmarking PQC algorithms (KEMs, signatures) and Hybrid-PQC in TLS 1.3. Sources implementations from OpenSSL 3.6.1, Liboqs v0.15.0, and OQS-Provider v0.11.0. Supports x86 and ARM Linux. HQC is disabled by default due to spec non-conformance but can be enabled manually.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: PQC algorithms from Liboqs and OQS-Provider; Classical algorithms via OpenSSL 3.6.1 (specific algorithm names not listed in text).
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Automated testing framework / Benchmarking suite (not a network security product like VPN/Firewall).
- **Infrastructure Layer**: Network, Hardware
- **License Type**: Open Source
- **License**: MIT
- **Latest Version**: 0.5.0 (mentioned in context of known issues)
- **Release Date**: 2026-03-25 (Last Updated date)
- **FIPS Validated**: No
- **Primary Platforms**: x86 Linux (Debian-based), ARM Linux (64-bit Debian-based)
- **Target Industries**: Research, Academic
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Future versions aim to support additional PQC libraries; currently supports OpenSSL 3.6.1 and OQS libraries.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Supported via Liboqs and OQS-Provider (specific schemes not listed in text).
- **Authoritative Source URL**: https://github.com/crt26/pqc-evaluation-tools

---

## Crucible

- **Category**: Network Testing & Validation Tools
- **Product Name**: Crucible
- **Product Brief**: Cryptographic implementation conformance testing harness for ML-KEM and ML-DSA targeting real-world audit findings.
- **PQC Support**: Yes (ML-KEM/FIPS 203 and ML-DSA/FIPS 204)
- **PQC Capability Description**: Testing harness verifying conformance of ML-KEM (FIPS 203) and ML-DSA (FIPS 204) implementations. Includes 78 tests for ML-KEM and 51 tests for ML-DSA covering compression, NTT, bounds, decapsulation, serialization, sampling, norm checks, arithmetic, signing, verification, and timing. Supports deterministic testing via explicit randomness seeds.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: ML-KEM (FIPS 203), ML-DSA (FIPS 204)
- **Key Management Model**: Not stated (Product is a testing harness, not a key management system)
- **Supported Blockchains**: Not stated
- **Architecture Type**: Command-line interface (CLI) testing harness communicating via JSON line protocol over stdin/stdout.
- **Infrastructure Layer**: Security Stack
- **License Type**: Open Source
- **License**: Apache 2.0
- **Latest Version**: Not stated
- **Release Date**: 2026-03-26
- **FIPS Validated**: No (Tests implementations against FIPS 203 and FIPS 204 specifications; product itself is not validated)
- **Primary Platforms**: Linux/Unix/macOS (implied by Cargo/Rust, Go, C/C++ build tools); supports testing implementations in Rust, Go, C, C++, Java.
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA (FIPS 204)
- **Authoritative Source URL**: https://github.com/symbolicsoft/crucible

---
