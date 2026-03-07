---
generated: 2026-03-06
collection: csc_056
documents_processed: 2
enrichment_method: ollama-qwen3.5:27b
---

## Wind River VxWorks

- **Category**: Real-Time Operating Systems
- **Product Name**: VxWorks
- **Product Brief**: Safety certified RTOS with deterministic performance and reliability for mission-critical embedded systems.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document mentions "mitigation processes to counter cybersecurity threats" and "security vulnerability monitoring," but does not explicitly mention Post-Quantum Cryptography (PQC), specific PQC algorithms, or PQC migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Separated kernel and user space environments; Scalable, modular architecture; Supports OCI-compliant container engine.
- **Infrastructure Layer**: OS, Hardware
- **License Type**: Commercial
- **License**: Proprietary (Commercial)
- **Latest Version**: VxWorks 653 (mentioned in context of Agusta Westland); "VxWorks Cert Edition" mentioned as a specific edition. No specific version number (e.g., 7.x) is explicitly stated as the latest release.
- **Release Date**: Not stated
- **FIPS Validated**: Not stated
- **Primary Platforms**: Embedded systems; Supports Arm®, Power Architecture®, Intel®, and RISC-V architectures; 32-bit and 64-bit CPUs.
- **Target Industries**: Aerospace, Defense and Government, Automotive, Energy, Enterprise, Industrial, Medical, Telecommunications, Retail.
- **Regulatory Status**: Safety certifications: DO-178C / EUROCAE ED-12C, IEC 61508, IEC 62304, ISO 26262. POSIX PSE52-certified subset.
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: www.windriver.com/products/vxworks

---

## FreeRTOS

- **Category**: Real-Time Operating Systems
- **Product Name**: FreeRTOS
- **Product Brief**: 'Classic' FreeRTOS distribution containing the kernel, supplementary libraries, and example projects.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC) algorithms, support, or migration plans. It references MbedTLS v3.5.1 and WolfSSL v5.6.4 but does not specify PQC capabilities within these versions.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions TLSv1.3, corePKCS11, MbedTLS, and WolfSSL but does not list specific primitives like ECDSA or RSA).
- **Key Management Model**: Not stated (Document mentions corePKCS11 library but does not describe the key management architecture, TPM integration, or certificate store details).
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated (Document mentions kernel source code and supplementary libraries but does not specify kernel vs. userspace crypto architecture or provider models).
- **Infrastructure Layer**: OS
- **License Type**: Open Source
- **License**: MIT
- **Latest Version**: 202411.00
- **Release Date**: 2026-03-06
- **FIPS Validated**: No
- **Primary Platforms**: Not stated (Document mentions "supported devices and compilers" via a link but does not list specific platforms in the text).
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://github.com/FreeRTOS/FreeRTOS

---
