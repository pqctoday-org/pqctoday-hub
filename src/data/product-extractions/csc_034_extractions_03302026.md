---
generated: 2026-03-30
collection: csc_034
documents_processed: 11
enrichment_method: ollama-qwen3.5:27b
---

## SEALSQ Quantum Shield

- **Category**: Hardware Security and Semiconductors
- **Product Name**: Quantum Shield QS7001
- **Product Brief**: First secure chip to embed NIST-standardized PQC algorithms directly at the hardware level.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Integrates ML-KEM (CRYSTALS-Kyber) and ML-DSA (CRYSTALS-Dilithium) directly in silicon. Provides 10x performance gains, stronger side-channel resistance, and advanced tamper protection. Built as an open hardware platform with support for custom firmware and hybrid cryptography migration.
- **PQC Migration Priority**: Critical
- **Crypto Primitives**: ML-KEM (CRYSTALS-Kyber), ML-DSA (CRYSTALS-Dilithium), ECC, RSA
- **Key Management Model**: Hardware key storage via secure chip with native PQC embedding; supports custom firmware and hybrid cryptography migration.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Secure chip (semiconductor) with hardware-embedded PQC algorithms; open hardware platform.
- **Infrastructure Layer**: Hardware
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: QS7001
- **Release Date**: 2025-11-15 (Planned official launch mid-November 2025)
- **FIPS Validated**: Yes, FIPS 140-3 (Company achieved highest levels including FIPS 140-3; specific chip validation status not explicitly detailed beyond company certification).
- **Primary Platforms**: Defense & Aerospace, Healthcare & Infrastructure, Energy & Smart Grid, IoT & Edge, Automotive, Industrial Automation.
- **Target Industries**: Defense, Healthcare, Energy, IoT, Automotive, Industrial Automation, Telecommunications, Logistics, Medical, Luxury.
- **Regulatory Status**: Not stated (Company holds Common Criteria EAL5+ and FIPS 140-3 certifications).
- **PQC Roadmap Details**: Official launch planned for mid-November 2025; development kits available to customers. QVault TPM variants expected starting first half of 2026.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA (CRYSTALS-Dilithium)
- **Authoritative Source URL**: www.sealsq.com

---

## Samsung S3SSE2A eSE

- **Category**: Hardware Security and Semiconductors
- **Product Name**: Samsung Knox Matrix with Post-Quantum Enhanced Data Protection (EDP) on Galaxy S25 series
- **Product Brief**: Mobile security platform integrating PQC algorithms to protect cloud backups and synced data against quantum threats.
- **PQC Support**: Yes (with details: ML-KEM algorithm integrated into Knox Matrix for Samsung Cloud)
- **PQC Capability Description**: Samsung has integrated Post-Quantum Enhanced Data Protection (EDP) into Knox Matrix, utilizing the NIST-standardized ML-KEM (Module-Lattice-Based Key-Encapsulation Mechanism) algorithm. This provides end-to-end encryption for user data during backup, restore, and sync operations on Samsung Cloud across smartphones, TVs, and digital appliances. The feature is available on the Galaxy S25 series running One UI 7.
- **PQC Migration Priority**: High
- **Crypto Primitives**: ML-KEM (Module-Lattice-Based Key-Encapsulation Mechanism)
- **Key Management Model**: Not stated (Document mentions end-to-end encryption for cloud data but does not specify hardware key storage, generation, or injection methods).
- **Supported Blockchains**: Not stated
- **Architecture Type**: Mobile device security software integrated with cloud services; specific hardware form factor of the eSE is not detailed in this text.
- **Infrastructure Layer**: Hardware, Security Stack, Cloud
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: One UI 7
- **Release Date**: 2025-02-04 (Date of the press release announcing the feature)
- **FIPS Validated**: No (Document mentions NIST standards FIPS 203, 204, 205 as references for algorithms but does not state the product itself is FIPS validated).
- **Primary Platforms**: Galaxy S25 series, Samsung Cloud, One UI 7
- **Target Industries**: Consumer Mobile, Enterprise (implied by Knox Matrix context)
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Currently deployed on Galaxy S25 series; Samsung plans to continue pioneering mobile security with PQC.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated (Document mentions ML-KEM for key encapsulation but does not specify signature schemes like FIPS 204 or 205 implementation).
- **Authoritative Source URL**: https://news.samsung.com/ (Inferred from "Samsung Newsroom" context, specific article URL not provided in text)

---

## SEALSQ QS7001

- **Category**: Hardware Security & Semiconductors
- **Product Name**: SEALSQ QS7001
- **Product Brief**: High-performance, low-power 32-bit Secure RISC-V microcontroller with hardware crypto acceleration and PQC support.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports Post Quantum Cryptography algorithms: Crystal Kyber (KEM) and Crystal Dilithium (Signature). Features a dedicated ad-X4 hardware cryptographic accelerator for fast encryption/authentication including PQC acceleration.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: AES 128/192/256, RSA, DSA, ECC, Diffie-Hellman, Crystal Kyber, Crystal Dilithium, Keccak, CRC 16 & 32
- **Key Management Model**: Hardware-based key storage in Secure Memory (Supervisor Mode) and FLASH; secure key generation via SP800-90B compliant RNG; hardware protection against SPA/DPA/SEMA/DEMA attacks.
- **Supported Blockchains**: Not stated
- **Architecture Type**: 32-bit Secure RISC-V Microcontroller (Secure Element/Semiconductor) with dedicated crypto accelerators and secure memory.
- **Infrastructure Layer**: Hardware
- **License Type**: Proprietary
- **License**: Proprietary (All rights reserved by SEALSQ)
- **Latest Version**: Not stated
- **Release Date**: 2024-12-20
- **FIPS Validated**: Targeted: FIPS SP800-90B (RNG compliance); FIPS 140-2/3 status not explicitly stated as validated.
- **Primary Platforms**: Embedded Systems (Strong Authentication applications)
- **Target Industries**: Not stated
- **Regulatory Status**: Certification Targeted: CC EAL5+; FIPS SP800-90B
- **PQC Roadmap Details**: Current implementation includes Crystal Kyber and Crystal Dilithium via hardware accelerator.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Crystal Dilithium (PQC), RSA, DSA, ECC
- **Authoritative Source URL**: Not stated

---

## Microchip PolarFire

- **Category**: Hardware Security & Semiconductors
- **Product Name**: Microchip PolarFire
- **Product Brief**: Mid-range FPGA platform offering radiation-tolerant, low-power, and system-on-chip solutions.
- **PQC Support**: No
- **PQC Capability Description**: Not stated in the document. The text lists general product categories but does not mention Post-Quantum Cryptography algorithms, implementations, or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: FPGA (Field Programmable Gate Array) / System-on-Chip (SoC)
- **Infrastructure Layer**: Hardware
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Aerospace and Defense, Automotive, Communications Infrastructure, Industrial, IoT, Medical, Data Centers
- **Target Industries**: Aerospace and Defense, Automotive and Transportation, Communications Infrastructure, Consumer, Data Centers and Computing, Industrial, IoT Solutions, Medical, Sustainability Technologies
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated

---

## NXP SE051 Secure Element

- **Category**: Hardware Security & Semiconductors
- **Product Name**: EdgeLock® SE051 Secure Element
- **Product Brief**: Proven, easy-to-use IoT security solution with support for updatability and custom applets.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC), quantum-resistant algorithms, or any PQC migration plans. It focuses on classical cryptography.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: AES 128/192/256, ECDSA
- **Key Management Model**: Hardware secure element providing root of trust at IC level; supports credential injection and RFC3394 symmetric key import protected with AES.
- **Supported Blockchains**: Not stated (Document mentions "Blockchain ID" in an application note title but does not list supported networks).
- **Architecture Type**: Secure Element (Hardware)
- **Infrastructure Layer**: Hardware
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: Not stated (Product family versioning not specified; document revisions listed are for datasheets/notes, e.g., Rev 2.0 for Data Sheet).
- **Release Date**: Not stated (Document dates refer to application notes and datasheet revisions, not product release).
- **FIPS Validated**: No (Document states Common Criteria EAL 6+ certification; FIPS is not mentioned).
- **Primary Platforms**: IoT devices, Linux, Zephyr OS, various MCUs/MPUs (i.MX, LPC55S69, FRDM-K64F, Raspberry Pi)
- **Target Industries**: Industrial IoT, Smart Home, Smart City, Healthcare, Automotive, Telecom, Energy Management, EV Charging, POS Terminal
- **Regulatory Status**: Common Criteria EAL 6+ (with AVA_VAN.5 up to OS level), IEC62443-4-2 certified, IEC62443-4-1 compliant (maturity level 3)
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ECDSA
- **Authoritative Source URL**: Not stated

---

## STMicroelectronics ST33KTPM

- **Category**: Hardware Security & Semiconductors
- **Product Name**: ST33KTPM
- **Product Brief**: FIPS 140-3 certified Trusted Platform Module (TPM) for consumer and industrial systems with post-quantum cryptography support.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Includes firmware updates authenticated by LMS signature (SP800-208). Enables support for additional post-quantum cryptographic algorithms, such as ML-KEM and ML-DSA, through field firmware upgrades.
- **PQC Migration Priority**: High
- **Crypto Primitives**: LMS, ML-KEM, ML-DSA
- **Key Management Model**: Hardware key storage within a Trusted Platform Module (TPM) with secure firmware update authentication.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Hardware Security Module (HSM)/Trusted Platform Module (TPM) semiconductor chip
- **Infrastructure Layer**: Hardware
- **License Type**: Proprietary
- **License**: Proprietary
- **Latest Version**: TCG TPM 2.0 rev 1.59 specification
- **Release Date**: Not stated
- **FIPS Validated**: FIPS 140-3 certified
- **Primary Platforms**: PCs, servers, network-connected IoT devices, medical equipment, industrial equipment, high-assurance infrastructure equipment, Raspberry Pi (via evaluation board)
- **Target Industries**: Consumer, Industrial, Medical, High-assurance infrastructure
- **Regulatory Status**: FIPS 140-3 certified, Common Criteria EAL4+ certified, JESD-47 qualification, ANSSI-CC-2025/10, ANSSI-CC-2024/38
- **PQC Roadmap Details**: Supports LMS signature for firmware updates; enables ML-KEM and ML-DSA via field firmware upgrades.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: LMS (current), ML-DSA (planned via firmware)
- **Authoritative Source URL**: Not stated

---

## Xiphera XIP6110B

- **Category**: Hardware Security & Semiconductors
- **Product Name**: Chainguard FIPS Provider for OpenSSL (AESNI_ASM)
- **Product Brief**: Provides cryptographic services to Linux user space software components using Intel AES-NI.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention any Post-Quantum Cryptography algorithms, implementations, or plans. It only covers classical symmetric encryption (AES-GCM, AES-GMAC).
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: AES-GCM, AES-GMAC
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Software cryptographic provider for Linux user space
- **Infrastructure Layer**: Security Stack, Cloud
- **License Type**: Commercial
- **License**: Not stated
- **Latest Version**: 3.4.0-r4
- **Release Date**: Unknown (First Validated: 2025-03-10)
- **FIPS Validated**: Yes (Validated by NIST CAVP, First Validated: 3/10/2025)
- **Primary Platforms**: Amazon Linux 2023 on EC2 m7i.metal-24xl (Intel Sapphire Rapids Xeon Platinum 8488C)
- **Target Industries**: Not stated
- **Regulatory Status**: FIPS Validated (NIST CAVP)
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://csrc.nist.gov

---

## NXP EdgeLock SE051H

- **Category**: Hardware Security & Semiconductors
- **Product Name**: EdgeLock® SE051H Secure Element
- **Product Brief**: Secure element for Matter onboarding via NFC, part of the EdgeLock SE051 family with CC EAL 6+ certification.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC), quantum-resistant algorithms, or any PQC migration plans. It focuses on classical cryptography (AES, ECDSA).
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: AES 128/192/256, ECDSA
- **Key Management Model**: Hardware secure element providing root of trust at IC level; supports credential injection and RFC3394 symmetric key import protected with AES.
- **Supported Blockchains**: Not stated (Document mentions "Blockchain ID" in a related application note title but does not list supported networks for SE051H).
- **Architecture Type**: Secure Element (Hardware)
- **Infrastructure Layer**: Hardware
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: Not stated (Document lists revision numbers for datasheets and application notes, e.g., Rev 2.0 for Data Sheet, but no specific product firmware version).
- **Release Date**: Not stated (Document lists dates for various resources ranging from 2020 to 2026, but no specific product release date).
- **FIPS Validated**: No (Document states "Common Criteria EAL 6+ certified up to OS level" and mentions IEC62443 compliance, but does not mention FIPS 140-2 or 140-3 validation).
- **Primary Platforms**: IoT devices, Linux, Zephyr OS (via middleware), MCUs/MPUs (integration supported via Plug & Trust middleware).
- **Target Industries**: Industrial IoT, Smart Home, Smart City, Infrastructure, Transportation, Healthcare, Energy Management, EV Supply Equipment, Building Security.
- **Regulatory Status**: Common Criteria EAL 6+ (with AVA_VAN.5), IEC62443-4-2 certified, IEC62443-4-1 compliant secure process (maturity level 3).
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ECDSA
- **Authoritative Source URL**: Not stated (Source text provided as [Source: NXP_EdgeLock_SE051H.html] without a full URL).

---

## Lattice MachXO5-NX

- **Category**: Hardware Security & Semiconductors
- **Product Name**: Lattice MachXO5-NX
- **Product Brief**: Secure control FPGA family with root-of-trust features, embedded flash, and support for classical and CNSA2.0 approved PQC algorithms.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports full suite of CNSA2.0 prescribed PQC algorithms including LMS, XMSS, ML-DSA, ML-KEM, and SLH-DSA. PQC services (XMSS/LMS, ML-DSA, ML-KEM) are available specifically in TDQ devices to address quantum threats.
- **PQC Migration Priority**: High
- **Crypto Primitives**: ECDSA-256, ECDSA-384, ECDSA-521, RSA-3K, RSA-4K, AES-256, SHA-256, SHA-384, SHA-512, SHA-2, SHA-3, SHAKE, LMS, XMSS, ML-DSA, ML-KEM, SLH-DSA
- **Key Management Model**: Hardware-based Root-of-Trust with internal flash configuration, AES256 bitstream encryption, and ECDSA/RSA/XMSS/LMS/ML-DSA bitstream authentication.
- **Supported Blockchains**: Not stated
- **Architecture Type**: FPGA (Field Programmable Gate Array) semiconductor device; deployment as secure control module or system management component.
- **Infrastructure Layer**: Hardware
- **License Type**: Proprietary
- **License**: Proprietary (Software Licensing mentioned, specific terms not detailed)
- **Latest Version**: Not stated (Device variants listed: LFMXO5-25, LFMXO5-55T, etc.)
- **Release Date**: Not stated (Document dates range from 2022 to 2026 for various guides)
- **FIPS Validated**: No (CNSA2.0 approved mentioned; FIPS validation status not explicitly stated)
- **Primary Platforms**: Compute, Communications, Industrial market segments; Lattice Nexus Platform; Intel Lincoln City Reference Architecture; AMI Tektagon Platform.
- **Target Industries**: Industrial & Auto, Medical, Video Surveillance, Aerospace & Defense, Datacenter Systems, Consumer Electronics, IoT.
- **Regulatory Status**: CNSA2.0 approved (for PQC algorithms); Intel PFR 4.0 compliance mentioned in context of AMI Tektagon integration.
- **PQC Roadmap Details**: Devices built on Lattice's low power Nexus platform expand capabilities with root-of-trust features supporting state-of-the-art classical cryptography and CNSA2.0 approved PQC to address increased threats; full suite of CNSA2.0 prescribed algorithms supported in TDQ devices.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ECDSA-256/384/521, RSA-3K/4K, LMS, XMSS, ML-DSA, SLH-DSA
- **Authoritative Source URL**: Not stated (Source filename: Lattice_MachXO5-NX.html)

---

## AMD Versal Adaptive SoC

- **Category**: Hardware Security & Semiconductors
- **Product Name**: AMD Versal Adaptive SoC
- **Product Brief**: An adaptive SoC architecture featuring programmable logic, AI Engines, and high-speed I/O for heterogeneous acceleration.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC), quantum-resistant algorithms, or any related migration plans. It focuses on general SoC architecture, compute resources, and memory solutions.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Adaptive SoC (System on Chip) with programmable logic, AI Engines, and Arm Cortex APUs/RPUs.
- **Infrastructure Layer**: Hardware
- **License Type**: Proprietary
- **License**: Proprietary (Copyright 2026 Advanced Micro Devices, Inc.)
- **Latest Version**: 2025.2 (Software Tools); VER-ARCH v1.0 (Course Specification)
- **Release Date**: 2026-01-31 (Document updated January 2026)
- **FIPS Validated**: No
- **Primary Platforms**: Versal VCK190 Evaluation Platform, Versal VEK280 Evaluation platform; Software tools: Vivado Design Suite, Vitis unified software platform.
- **Target Industries**: Not stated (Course targets software/hardware developers, system architects, DSP users)
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: www.amd.com

---

## General Dynamics Mission

- **Category**: Hardware Security & Semiconductors
- **Product Name**: General Dynamics Mission Systems Cyber Portfolio (TACLANE, Sectéra, ProtecD@R, TACDS)
- **Product Brief**: NSA-certified encryption and cross-domain solutions for Land, Sea, Air, Space, and Cyber domains.
- **PQC Support**: No mention
- **PQC Capability Description**: Not stated in the document. The text mentions "Space & Embedded Crypto" and "Encryption" but does not specify Post-Quantum Cryptography algorithms or migration status.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Text mentions "Encryption", "Network Encryption", "Data At Rest Encryption", "Secure Voice Encryption" without specifying algorithms like AES, RSA, or ECC).
- **Key Management Model**: Not stated (Text mentions "Encryptor Management" but does not describe key storage architecture or generation methods).
- **Supported Blockchains**: Not stated
- **Architecture Type**: Hardware and Network (Products include network encryptors, data at rest encryptors, and embedded crypto systems).
- **Infrastructure Layer**: Hardware, Network
- **License Type**: Proprietary
- **License**: Proprietary (Implied by "Commercial" nature of General Dynamics Mission Systems products; no open source license stated).
- **Latest Version**: Not stated (Text mentions "TACLANE E-Series", "TACLANE-C175N", but no specific version numbers like v1.0 or 2.0).
- **Release Date**: Not stated
- **FIPS Validated**: No (Text states "NSA Certification" for TACLANE E-Series and TACLANE-C175N, but does not explicitly mention FIPS 140-2 or 140-3 validation).
- **Primary Platforms**: Land, Sea, Air, Space, Cyber domains; Embedded systems; Network infrastructure.
- **Target Industries**: Government, Defense (U.S. Army, U.S. Navy, NASA, FAA, Space Development Agency).
- **Regulatory Status**: NSA Certification (for TACLANE E-Series and TACLANE-C175N).
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: GD.COM (General Dynamics Mission Systems website)

---