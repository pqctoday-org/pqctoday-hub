---
generated: 2026-03-30
collection: csc_032
documents_processed: 3
enrichment_method: ollama-qwen3.5:27b
---

## Juniper Junos OS

- **Category**: Network Operating Systems
- **Product Name**: Junos OS Evolved
- **Product Brief**: Network operating system running on ACX, PTX, and QFX Series hardware with new PQC features in Release 25.4R1.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Post-Quantum Cryptography (PQC) is listed as a "What's New" feature for ACX, PTX, and QFX Series in Release 25.4R1. The document confirms the inclusion of PQC features but does not specify the algorithms, implementation details, or maturity level within the provided text.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: IMA keyrings mentioned for signature verification and nonrepudiable logs; specific OS keychain architecture not detailed.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Kernel-level integrity via Integrity Measurement Architecture (IMA) covering file systems and kernel images; userspace scripting via libslax.
- **Infrastructure Layer**: Network, Hardware, OS
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: 25.4R1
- **Release Date**: 2026-03-09
- **FIPS Validated**: No
- **Primary Platforms**: Juniper Networks ACX Series, PTX Series, QFX Series, and Third-Party Whitebox hardware.
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: PQC is included in Release 25.4R1; specific algorithm choices or future timelines not stated.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Junos OS Evolved Documentation | Juniper Networks

---

## Fortinet FortiOS

- **Category**: Network Operating Systems
- **Product Name**: Fortinet FortiOS
- **Product Brief**: The operating system of the Fortinet Security Platform, integrating networking and security tools.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: FortiOS 8.0 features expanded quantum-safe capabilities. FortiClient supports PQC for secure VPN connectivity. Specific algorithms or maturity levels beyond "expanded" are not stated.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Network, Security Stack, Hardware, Cloud
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: 8.0 (also mentions 7.6.6 in document library header)
- **Release Date**: Not stated
- **FIPS Validated**: Not stated
- **Primary Platforms**: FortiGate hardware, Cloud (Public/Private), CNF, Hybrid environments
- **Target Industries**: Enterprise, IT and OT environments
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Expanded quantum-safe capabilities included in FortiOS 8.0; PQC support for secure VPN connectivity in FortiClient. No specific timeline or algorithm choices stated.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated

---

## IDEMIA PQC Accelerator

- **Category**: Telecom & 5G Security
- **Product Name**: IDEMIA PQC Accelerator
- **Product Brief**: Advanced hardware accelerator based on Keccak for post-quantum cryptography, embedded in future quantum-safe chips.
- **PQC Support**: Yes (based on Keccak; supports NIST standardized algorithms ML-KEM, ML-DSA, SLH-DSA)
- **PQC Capability Description**: Hardware accelerator utilizing Keccak to offload intensive tasks from the main processor. Optimizes performance for quantum-resistant algorithms standardized by NIST: ML-KEM (FIPS 203), ML-DSA (FIPS 204), and SLH-DSA (FIPS 205). Designed for seamless transition without compromising speed.
- **PQC Migration Priority**: High
- **Crypto Primitives**: Keccak, ML-KEM, ML-DSA, SLH-DSA
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Hardware Accelerator (embedded in chips)
- **Infrastructure Layer**: Hardware
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: Not stated
- **Release Date**: 2025-03-18
- **FIPS Validated**: Supports algorithms standardized by NIST (ML-KEM FIPS 203, ML-DSA FIPS 204, SLH-DSA FIPS 205); specific module validation status not stated.
- **Primary Platforms**: Embedded in future quantum-safe chips from IDEMIA Secure Transactions; applicable to banking, automotive, IoT, Industry 4.0, healthcare sectors.
- **Target Industries**: Banking, Automotive, IoT, Industry 4.0, Healthcare
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Will be embedded in all future quantum-safe chips from IDEMIA Secure Transactions to support migration to NIST standardized algorithms.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA (FIPS 204), SLH-DSA (FIPS 205)
- **Authoritative Source URL**: www.idemia.com

---
