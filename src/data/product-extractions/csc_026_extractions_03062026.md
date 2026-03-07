---
generated: 2026-03-06
collection: csc_026
documents_processed: 6
enrichment_method: ollama-qwen3.5:27b
---

## wolfBoot

- **Category**: Secure Boot and Firmware Security
- **Product Name**: wolfBoot
- **Product Brief**: Portable, OS-agnostic secure bootloader for 32-bit microcontrollers supporting firmware authentication and updates.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention any Post-Quantum Cryptography (PQC) algorithms or support. It explicitly lists classical algorithms including Ed25519, RSA (2048/4096), ECC-256, and SHA3.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Ed25519, RSA (2048, 4096), ECC-256, SHA3, DES3
- **Key Management Model**: Software-based key generation using `ed25519_keygen` and `sign.py` tools; public keys embedded in the bootloader build; private keys used for signing firmware images externally. Supports TPM integration for measured boot (storing hashes in PCRs) and hardware-assisted signature verification via PKA/PKHA accelerators.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Secure Bootloader running on microcontrollers (bare-metal), utilizing a Hardware Abstraction Layer (HAL) for flash access and clock settings; supports external flash and TPM integration.
- **Infrastructure Layer**: Hardware, Security Stack
- **License Type**: Open Source
- **License**: GPL-3.0
- **Latest Version**: V1.9
- **Release Date**: 2021-11-09
- **FIPS Validated**: No
- **Primary Platforms**: STM32 (various series), nRF52, Atmel SamR21, TI cc26x2, NXP Kinetis, RV32 RISC-V (SiFive HiFive-1), Raspberry Pi, Xilinx Zynq+, NXP LPC54xx, Cypress psoc6, ARM Cortex-M0/M33/A/R, PowerPC
- **Target Industries**: Embedded Systems, IoT (Internet of Things)
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Ed25519, RSA (PKCS#1 v1.5 implied by ASN.1 header support), ECC-256
- **Authoritative Source URL**: https://github.com/wolfSSL/wolfBoot

---

## coreboot

- **Category**: Secure Boot and Firmware Security
- **Product Name**: coreboot
- **Product Brief**: Free Software project replacing proprietary BIOS/UEFI firmware to perform hardware initialization and boot payloads.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography, PQC algorithms, or any related migration plans. It focuses on firmware initialization and payload execution.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Firmware replacing BIOS/UEFI; supports various architectures, chipsets, devices, and mainboards.
- **Infrastructure Layer**: Hardware
- **License Type**: Open Source
- **License**: GPL-2.0 (with some files under CC-BY 4.0 or BSD-3-clause)
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Linux distributions, QEMU; supports wide range of architectures and mainboards.
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://www.coreboot.org

---

## U-Boot

- **Category**: Secure Boot and Firmware Security
- **Product Name**: Das U-Boot
- **Product Brief**: A boot loader for embedded boards based on PowerPC, ARM, MIPS and several other processors.
- **PQC Support**: No
- **PQC Capability Description**: The document contains no mention of Post-Quantum Cryptography (PQC), quantum-resistant algorithms, or PQC migration plans. It only mentions standard cryptographic support via TPM devices and SHA1 for authorized sessions.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: SHA1 (mentioned in context of CONFIG_TPM_AUTH_SESSIONS); No specific signature schemes (e.g., ECDSA, RSA) explicitly listed as implemented primitives in the text provided.
- **Key Management Model**: Not stated (Text mentions TPM support for functional interfaces but does not describe key storage architecture, generation, or injection methods).
- **Supported Blockchains**: Not stated
- **Architecture Type**: Boot loader software installed in boot ROM; supports embedded boards and sandbox environment on Linux host.
- **Infrastructure Layer**: Hardware, Security Stack (via TPM support)
- **License Type**: Open Source
- **License**: GPL-2.0+
- **Latest Version**: Not stated
- **Release Date**: 2026-03-05 (Last Updated timestamp in repository metadata)
- **FIPS Validated**: No
- **Primary Platforms**: Embedded boards based on PowerPC, ARM, MIPS; Linux host (sandbox); vxWorks.
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://source.denx.de/u-boot/u-boot

---

## Linux IMA/EVM

- **Category**: Secure Boot and Firmware Security
- **Product Name**: Integrity Measurement Architecture (IMA) / Linux Extended Verification Module (EVM)
- **Product Brief**: Open source kernel integrity subsystem to detect file alterations, appraise measurements against good values, and enforce local file integrity.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC), quantum-resistant algorithms, or any plans for PQC migration. It focuses on classical cryptographic primitives like RSA and SHA hashes.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: RSA, SHA1, MD5, SHA256, SHA512, wp512
- **Key Management Model**: Uses Kernel Key Retention for Trusted and Encrypted keys; supports loading public/private keypairs (RSA) into IMA/EVM keyrings; can anchor aggregate integrity values in a hardware Trusted Platform Module (TPM).
- **Supported Blockchains**: Not stated
- **Architecture Type**: Linux kernel subsystem (software) integrating with optional hardware TPM for measurement anchoring and attestation.
- **Infrastructure Layer**: Security Stack, Hardware (optional TPM integration)
- **License Type**: Open Source
- **License**: Mozilla Public License 1.0 (MPL)
- **Latest Version**: Not stated (Kernel versions mentioned include 2.6.30, 2.6.36, 3.2, 3.3, 3.7, 4.13; Project last update: 2023-04-27)
- **Release Date**: 2023-04-27 (Project Last Update)
- **FIPS Validated**: Not stated
- **Primary Platforms**: Linux (kernel versions 2.6.30+), Android
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: RSA (public/private key pair generation mentioned)
- **Authoritative Source URL**: https://sourceforge.net/projects/linux-ima/ (inferred from "This project can now be found here" and SourceForge context, though exact URL not explicitly typed in text)

---

## ARM Trusted Firmware (TF-A)

- **Category**: Secure Boot and Firmware Security
- **Product Name**: Trusted Firmware-A (TF-A)
- **Product Brief**: Reference implementation of secure world software for Arm A-Profile architectures including EL3 Secure Monitor.
- **PQC Support**: No
- **PQC Capability Description**: Not stated in the document. The text mentions no Post-Quantum Cryptography algorithms, plans, or research.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Secure world software for Arm A-Profile architectures (Armv8-A and Armv7-A)
- **Infrastructure Layer**: Hardware
- **License Type**: Open Source
- **License**: NOASSERTION
- **Latest Version**: Unknown
- **Release Date**: 2026-03-06
- **FIPS Validated**: No
- **Primary Platforms**: Arm A-Profile architectures (Armv8-A and Armv7-A)
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://github.com/ARM-software/arm-trusted-firmware

---

## TianoCore EDK2 (UEFI Firmware)

- **Category**: Secure Boot and Firmware Security
- **Product Name**: EDK II
- **Product Brief**: A modern, feature-rich, cross-platform firmware development environment for the UEFI and PI specifications.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC) algorithms, migration plans, or research. It lists classical crypto libraries (OpenSSL, MbedTLS) but provides no details on PQC implementation status.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions inclusion of OpenSSL and MbedTLS libraries but does not list specific primitives like ECDSA, RSA, or Ed25519).
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Firmware development environment for UEFI and PI specifications.
- **Infrastructure Layer**: Hardware
- **License Type**: Open Source
- **License**: BSD-2-Clause Plus Patent License (majority); Apache 2.0, MIT, Zlib, Python-2.0, FreeBSD Documentation License (for specific components).
- **Latest Version**: Not stated
- **Release Date**: Not stated (Last Updated: 2026-03-06)
- **FIPS Validated**: No
- **Primary Platforms**: Windows (Visual Studio), Ubuntu (GCC), EmulatorPkg, OvmfPkg, ArmVirtPkg.
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://github.com/tianocore/edk2

---
