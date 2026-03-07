---
generated: 2026-03-06
collection: csc_052
documents_processed: 3
enrichment_method: ollama-qwen3.5:27b
---

## Intel TDX (Trust Domain Extensions)

- **Category**: Confidential Computing
- **Product Name**: Intel® Trust Domain Extensions (Intel® TDX)
- **Product Brief**: Hardware-based trusted execution environment facilitating hardware-isolated virtual machines to protect sensitive data and applications.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC), PQC algorithms, or migration plans. It focuses on hardware isolation, memory encryption (Intel TME-MK), and attestation using ECDSA.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: ECDSA (mentioned in context of "Provisioning Certification Service for ECDSA Attestation")
- **Key Management Model**: Hardware-based trusted execution environment; keys protected via hardware-isolated virtual machines (Trust Domains) and memory encryption (Intel TME-MK); specific key injection or storage architecture details not stated.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Hardware-based Trusted Execution Environment (TEE); CPU-measured module running in Secure Arbitration Mode (SEAM); supports Trust Domains (TD) as hardware-isolated VMs.
- **Infrastructure Layer**: Hardware, Cloud
- **License Type**: Open Source/Commercial
- **License**: GPL-2.0 (for the `intel/tdx` repository source code); Commercial availability via cloud providers.
- **Latest Version**: 2.0 (mentioned as "Intel TDX version 2.0 extends Intel TDX to support Trusted Execution Environment for device I/O"); also mentions incompatibilities between v1.0 and v1.5.
- **Release Date**: Not stated (Document dates range from 2021 to February 2026, but no specific product release date is provided).
- **FIPS Validated**: Not stated
- **Primary Platforms**: Alibaba Cloud, Microsoft Azure, Google Cloud, Intel® Developer Cloud; 4th Generation Intel® Xeon® Scalable Processors.
- **Target Industries**: Data Security and IP Protection, Privacy and Compliance, Data Sovereignty, Confidential AI.
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ECDSA (for attestation provisioning); other signature schemes not explicitly listed.
- **Authoritative Source URL**: https://github.com/intel/tdx

---

## AMD SEV-SNP (Secure Encrypted Virtualization)

- **Category**: Confidential Computing
- **Product Name**: AMD Secure Encrypted Virtualization (SEV) / AMD SEV-SNP
- **Product Brief**: An extension to the AMD-V architecture supporting encrypted virtual machines under KVM control.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography, PQC algorithms, or migration plans. It focuses on memory encryption for VMs using standard symmetric and asymmetric cryptography inherent to the AMD-V architecture.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: Not stated (Document mentions "unique encryption key" and "encrypted guests data" but does not specify algorithm names like AES, RSA, or ECDSA).
- **Key Management Model**: Each encrypted VM is associated with a unique encryption key; only the guest has access to the unencrypted version. Key injection methods are not explicitly detailed beyond the requirement for OVMF and kernel support.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Hardware-based virtualization extension (AMD-V) enabling encrypted VMs via KVM/QEMU.
- **Infrastructure Layer**: Hardware, Cloud (via hypervisor support), Security Stack
- **License Type**: Open Source
- **License**: MIT
- **Latest Version**: Not stated (Document lists minimum required versions for dependencies: kernel >= 4.16/5.11, libvirt >= 4.5, qemu >= 2.12/6.00).
- **Release Date**: 2026-03-03 (Last Updated timestamp in repository metadata)
- **FIPS Validated**: Not stated
- **Primary Platforms**: SLES-15, RHEL-8, Fedora-28, Fedora-29, Ubuntu-18.04, openSUSE-Tumbleweed; requires AMD processors with SEV support.
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://github.com/AMDESE/AMDSEV

---

## ARM Confidential Compute Architecture (CCA)

- **Category**: Confidential Computing
- **Product Name**: Arm Confidential Compute Architecture (CCA)
- **Product Brief**: Hardware-based trusted execution environments using Realm Management Extension to isolate AI models and data.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography, PQC algorithms, or migration plans. It focuses on confidential computing via hardware isolation (Realms) rather than specific cryptographic algorithm updates for quantum resistance.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Hardware-based trusted execution environments; keys and data are isolated in "Realms" protected by the Realm Management Extension (RME).
- **Supported Blockchains**: Not stated
- **Architecture Type**: Hardware-based trusted execution environment (TEE) utilizing Armv9-A with Realm Management Extension (RME).
- **Infrastructure Layer**: Hardware
- **License Type**: Proprietary / Open Source components
- **License**: Arm architecture specifications are licensed by partners; reference software (TF-RMM, TF-A Monitor) is available at TrustedFirmware.org.
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Armv9-A CPUs with Realm Management Extension (RME); supports Mobile, PC, Datacenter, and Automotive via Lumex, Neoverse, and Zena CSS.
- **Target Industries**: AI, Healthcare, Financial Services, Industrial Systems, Cloud Computing, Automotive, IoT.
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://www.arm.com (inferred from text context "Arm Global Headquarters" and domain references, though specific product URL not explicitly listed as a single link).

---
