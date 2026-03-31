---
generated: 2026-03-31
collection: csc_034
documents_processed: 25
enrichment_method: ollama-qwen3.5:27b
---

## BERTEN MLDS-B235

- **Category**: Hardware Security and Semiconductors
- **Product Name**: MLDS-B235
- **Product Brief**: IP Core implementing NIST ML-DSA PQC digital signatures in FPGA, SoC, and ASIC technologies.
- **PQC Support**: Yes (NIST ML-DSA standard via CRYSTALS-Dilithium scheme)
- **PQC Capability Description**: Implements NIST Module-Lattice-Based Digital Signature Standard (ML-DSA) derived from CRYSTALS-Dilithium. Supports security levels 2, 3, and 5 (ML-DSA-44, ML-DSA-65, ML-DSA-87). Includes sequencer, Polynomial Arithmetic Unit, and SHAKE XOF. Features countermeasures against Side-Channel Attacks (SCA), timing, and Simple Power Analysis (SPA). Supports Hedged variant for signing.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: ML-DSA (ML-DSA-44, ML-DSA-65, ML-DSA-87), SHAKE (XOF)
- **Key Management Model**: Hardware IP core with internal memory zeroization (automatic and on-demand); key generation, signing, and verifying configured via register map.
- **Supported Blockchains**: Not stated
- **Architecture Type**: IP Core for FPGA, SoC, and ASIC; AMBA AXI interfaces (AXI4-Stream, AXI4-Lite)
- **Infrastructure Layer**: Hardware
- **License Type**: Commercial
- **License**: Perpetual Site Licence (encrypted netlist)
- **Latest Version**: BDS016 v1.02
- **Release Date**: 2025-03-07
- **FIPS Validated**: Compliant with FIPS 204 and FIPS 140-3 (Note: Document states "compliant", not explicitly "validated")
- **Primary Platforms**: AMD (Xilinx) devices, Intel (Altera) devices, Microchip (Microsemi) devices
- **Target Industries**: Quantum-Resistant Networks, Public Key Infrastructures, Network Security, Transport Protocols, User Authentication, Secure Communications, Electronic Transactions
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Implements current NIST ML-DSA standard; no future roadmap details provided.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA (ML-DSA-44, ML-DSA-65, ML-DSA-87)
- **Authoritative Source URL**: www.bertendsp.com

---

## BERTEN MLKE-B135

- **Category**: Hardware Security and Semiconductors
- **Product Name**: MLDS-B235 IP Core (ML-DSA Crypto Core)
- **Product Brief**: FPGA, SoC, and ASIC IP core implementing NIST FIPS 204 ML-DSA post-quantum digital signatures.
- **PQC Support**: Yes (Implements NIST FIPS 204 ML-DSA derived from CRYSTALS-Dilithium)
- **PQC Capability Description**: Implements the NIST Module-Lattice-Based Digital Signature Standard (ML-DSA) in FPGA, SoC, and ASIC. Supports security levels ML-DSA-44, ML-DSA-65, and ML-DSA-87. Includes countermeasures against Side-Channel Attacks (SCA), timing, and Simple Power Analysis (SPA). Supports Hedged variant for signing.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: ML-DSA (ML-DSA-44, ML-DSA-65, ML-DSA-87), SHAKE (XOF)
- **Key Management Model**: Hardware IP core with internal memory zeroization (automatic and on-demand); key generation, signing, and verifying configured via register map.
- **Supported Blockchains**: Not stated
- **Architecture Type**: IP Core for FPGA, SoC, and ASIC deployment
- **Infrastructure Layer**: Hardware
- **License Type**: Commercial
- **License**: Perpetual Site Licence (encrypted netlist)
- **Latest Version**: BDS016 v1.02
- **Release Date**: 2025-03-07
- **FIPS Validated**: Compliant with FIPS 204 and FIPS 140-3 (Note: Text states "compliant", not explicitly "validated")
- **Primary Platforms**: AMD (Xilinx), Intel (Altera), Microchip (Microsemi) FPGA/ASIC devices
- **Target Industries**: Quantum-Resistant Networks, Public Key Infrastructures, Network Security, Secure Communications, Electronic Transactions
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Implements current NIST FIPS 204 standard; no future roadmap details provided.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA (ML-DSA-44, ML-DSA-65, ML-DSA-87)
- **Authoritative Source URL**: www.bertendsp.com

---

## CAST KiviPQC-KEM

- **Category**: Hardware Security and Semiconductors
- **Product Name**: CAST KiviPQC-KEM
- **Product Brief**: Hardware accelerator for NIST FIPS 203 ML-KEM post-quantum key encapsulation operations.
- **PQC Support**: Yes (ML-KEM implementation)
- **PQC Capability Description**: Implements Module Lattice-based Key Encapsulation Mechanism (ML-KEM) per NIST FIPS 203. Supports all three parameter sets: ML-KEM-512, ML-KEM-768, and ML-KEM-1024. Offers key generation, encapsulation, and decapsulation procedures. Available in Fast (F) and Tiny (T) versions for ASIC/FPGA integration. Includes protection against timing-based side channel attacks.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: ML-KEM (ML-KEM-512, ML-KEM-768, ML-KEM-1024), AES, ASCON, SNOW-V, SM4, SHA-256, SHA-384/512, SHA-3, MD5
- **Key Management Model**: Hardware key storage within SoC; supports software Random Byte Generator (RBG) or integration with external third-party entropy source/RBG via customized interface.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Silicon IP Core (RISC-V-like SoC topology), available as ASIC or FPGA implementation; includes 32-bit RISC-V processor, hardware crypto accelerators (Fast version), and AMBA AXI4-Lite interface.
- **Infrastructure Layer**: Hardware
- **License Type**: Commercial
- **License**: Proprietary (Export controlled)
- **Latest Version**: Not stated
- **Release Date**: 2025-11-05 (Date of related content announcement)
- **FIPS Validated**: No (Text states "NIST FIPS Compliant" and implements algorithms standardized in FIPS 203, but does not state the product itself is FIPS validated)
- **Primary Platforms**: ASIC (TSMC), FPGA (Altera/Intel, AMD/Xilinx, Microchip); integrates into System-on-Chip (SoC) designs.
- **Target Industries**: Public-key infrastructure, cloud security, safety-critical infrastructure, IoT, HSMs, TPMs, secure Ethernet (MACsec), VPN/IKEv2, edge computing.
- **Regulatory Status**: Subject to export control regulations; requires potential special export license.
- **PQC Roadmap Details**: Implements current NIST FIPS 203 standard; no future roadmap details provided beyond current ML-KEM support.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated (Product is KEM only; related product KiviPQC-DSA handles signatures)
- **Authoritative Source URL**: Not stated

---

## IP Cores PQC1

- **Category**: Hardware Security and Semiconductors
- **Product Name**: PQC1 Post-Quantum Cryptography Accelerator IP Core
- **Product Brief**: Hardware IP core implementing ML-KEM and ML-DSA post-quantum cryptography standards with microprogramming sequencer.
- **PQC Support**: Yes (Implements ML-KEM/FIPS-203/Kyber and ML-DSA/FIPS-204/Dilithium)
- **PQC Capability Description**: Implements ML-KEM (FIPS-203, Kyber) and ML-DSA (FIPS-204, Dilithium) algorithms. Supports all FIPS-204 categories (ML-DSA-44, 65, 87) and FIPS-203 levels (ML-KEM-512, 768, 1024). Includes built-in NTT and SHAKE128/SHAKE256/SHA-3 engines. Contains three accelerators: NTT, FIPS-202 (SHA-3/SHAKE), and packing/unpacking. True random number generator is not included but TRNG1 core can be used.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: ML-KEM, ML-DSA, SHA-3, SHAKE128, SHAKE256, AES, DES, 3DES, RSA, ECC, GCM, CCM, EAX, XTS, ZUC, SNOW 3G, Kasumi, RC4, CMAC, XCBC
- **Key Management Model**: Hardware IP core with internal microprogramming sequencer; requires external single-port RAM banks; SDK supports key generation, signing, verification, encapsulation, and decapsulation. True random number generator not included in core.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Hardware IP Core (ASIC/FPGA) with APB/AHB/AXI microprocessor slave bus interface
- **Infrastructure Layer**: Hardware
- **License Type**: Commercial
- **License**: Proprietary (Synthesizable Verilog RTL source code, SDK, and documentation provided under license)
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No (Implements algorithms defined in FIPS-203 and FIPS-204 standards; no validation statement found)
- **Primary Platforms**: ASIC, FPGA (implied by HDL/Verilog deliverables); interfaces include APB, AHB, AXI
- **Target Industries**: Not stated
- **Regulatory Status**: Export control classification number 5E002 assigned by US Bureau of Industry and Security
- **PQC Roadmap Details**: Not stated (Current implementation details provided for ML-KEM and ML-DSA)
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA (FIPS-204, Dilithium)
- **Authoritative Source URL**: www.ipcores.com

---

## Secure-IC Securyzr

- **Category**: Hardware Security and Semiconductors
- **Product Name**: Securyzr™
- **Product Brief**: A portfolio of security IP cores and hardware solutions for SoC, ASIC, and FPGA including PQC, symmetric/asymmetric crypto, and memory protection.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Secure-IC is a global leader in PQC, offering ML-KEM/ML-DSA based on LWE hardness and XMSS (software IP running on Host CPU). The platform includes dedicated "Securyzr™ Post Quantum Cryptography" solutions.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: RSA, ECC, AES, AES-GCM, AES-XTS, ChaCha20-Poly1305, SM4, ARIA, 3DES, SHA-3, SM3, Snow 3G, ZUC, Kasumi, ML-KEM, ML-DSA, XMSS
- **Key Management Model**: Hardware key storage via Integrated Secure Element (iSE) and Hardware Security Modules; secure boot; memory encryption; on-the-fly execution from Flash.
- **Supported Blockchains**: Not stated
- **Architecture Type**: IP cores for SoC, ASIC, and FPGA; Integrated Secure Element (iSE); Hardware Security Modules; Tunable Cryptography engines.
- **Infrastructure Layer**: Hardware
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: Mentions compliance with FIPS 140, FIPS 180-3, FIPS 198, and FIPS 46-3; specific validation levels (e.g., Level 2/3) not stated.
- **Primary Platforms**: SoC, ASIC, FPGA, Microcontroller, Multi-core architectures, CXL link, Automotive (ISO26262 ASIL-D).
- **Target Industries**: Automotive & Smart Mobility, Defense & Space, Industry & Factory Automation, Critical infrastructures, Media & Entertainment, Smart Grid & Smart Cities, Consumer Electronics, Healthcare, Server & Cloud, Memory & Storage, Academics, Semiconductor.
- **Regulatory Status**: Mentions support for FIPS and Common Criteria certifications; ISO26262 ASIL-D certified for specific IP cores.
- **PQC Roadmap Details**: Implements ML-KEM/ML-DSA (LWE-based) and XMSS; described as pioneering advanced PQC technologies.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: RSA, ECC-based algorithms, ML-DSA, XMSS
- **Authoritative Source URL**: Not stated

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

## Infineon OPTIGA TPM SLB 9672

- **Category**: Hardware Security and Semiconductors
- **Product Name**: Infineon OPTIGA TPM SLB 9672
- **Product Brief**: Not stated in the provided text.
- **PQC Support**: No mention
- **PQC Capability Description**: The provided text contains no information regarding Post-Quantum Cryptography (PQC) algorithms, implementation status, or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Hardware
- **License Type**: Unknown
- **License**: Not stated
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: Not stated
- **Primary Platforms**: Not stated
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated

---

## Intel Platform Trust Technology (PTT)

- **Category**: Hardware Security and Semiconductors
- **Product Name**: Intel Platform Trust Technology (PTT)
- **Product Brief**: Not stated in the provided text.
- **PQC Support**: No mention
- **PQC Capability Description**: The provided text contains no information regarding Post-Quantum Cryptography support, algorithms, or implementation status.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated (Text lists general product categories like Processors and FPGAs but does not describe PTT architecture details).
- **Infrastructure Layer**: Hardware
- **License Type**: Unknown
- **License**: Not stated
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: Not stated
- **Primary Platforms**: Not stated (Text lists various Intel product families but does not specify PTT deployment targets).
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: intel.com (inferred from search context, but specific product URL not explicitly provided in text)

---

## Google OpenTitan

- **Category**: Hardware Security and Semiconductors
- **Product Name**: OpenTitan
- **Product Brief**: Open source silicon Root of Trust (RoT) project administered by lowRISC CIC.
- **PQC Support**: Unknown
- **PQC Capability Description**: Not stated in the provided text.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Silicon Root of Trust (RoT); specific key storage or injection methods not detailed in text.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Open source silicon Root of Trust (RoT) design for instantiation as a full-featured product.
- **Infrastructure Layer**: Hardware
- **License Type**: Open Source
- **License**: Apache License, Version 2.0
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Silicon/Chip manufacturers (targeted for instantiation as a full-featured product)
- **Target Industries**: Enterprises, platform providers, and chip manufacturers
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://opentitan.org

---

## ARM TrustZone

- **Category**: Hardware Security and Semiconductors
- **Product Name**: Arm TrustZone
- **Product Brief**: Hardware-enforced isolation technology creating secure and non-secure worlds within SoCs to protect code and data.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC), specific PQC algorithms, or any migration plans for quantum-resistant cryptography. It only mentions general "cryptography" as a use case.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions "cryptography" generally but lists no specific algorithms like ECDSA, RSA, etc.)
- **Key Management Model**: Hardware-enforced isolation separating secure and non-secure worlds; protects key material within the secure world.
- **Supported Blockchains**: Not stated
- **Architecture Type**: System-on-Chip (SoC) security architecture with hardware-enforced isolation between secure and non-secure worlds.
- **Infrastructure Layer**: Hardware
- **License Type**: Proprietary (IP Licensing)
- **License**: Proprietary (Arm Licensing, Arm Flexible Access, Arm Total Access mentioned; specific license terms not detailed)
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Cortex-A processors, Cortex-M processors, SoCs containing Arm-based chips.
- **Target Industries**: Automotive, Computing Infrastructure, Consumer Technologies, Internet of Things, Mobile, Datacenter, Edge AI.
- **Regulatory Status**: Not stated (Mentions PSA guidelines and GlobalPlatform standards, but no regulatory licenses or charters).
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (Document text provided from source files ARM_TrustZone.html and ARM_TrustZone_doc1.html, but no specific product URL extracted).

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
- **Product Name**: ST33KTPM (specifically ST33KTPM2XSPI, ST33KTPM2X, ST33KTPM2A, ST33KTPM2I, and ST33KTPM-IDevID)
- **Product Brief**: FIPS 140-3 certified Trusted Platform Module (TPM) for consumer and industrial systems with post-quantum cryptography support.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Includes firmware updates authenticated by LMS signature (SP800-208). Supports additional post-quantum cryptographic algorithms such as ML-KEM and ML-DSA through field firmware upgrades. Engineered to resist quantum attacks.
- **PQC Migration Priority**: High
- **Crypto Primitives**: RSA, SHA-1, SHA-2, SHA-3, HMAC, AES, ECC (NIST P-256, NIST P-384), ECDSA, ECSchnorr, ECDAA, ECDH, LMS, ML-KEM, ML-DSA
- **Key Management Model**: Hardware-based key storage and generation within a single silicon chip; supports secure storage for digital certificates; provisioned with Endorsement Keys (EK) and IDevID keys.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Single chip cryptographic HW module (TPM 2.0), integrated circuit package (UFQFPN32, TSSOP20, WLCSP24).
- **Infrastructure Layer**: Hardware
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: Firmware versions 9.257, 9.258, 10.257; TPM 2.0 rev 1.59; Datasheet Rev 1 (October 2025).
- **Release Date**: 2025-10 (Datasheet date); FIPS Policy Date: 2024-06-14
- **FIPS Validated**: Yes, FIPS 140-3 Level 1 (Security Policy), with Physical Security Level 3 mentioned in datasheet.
- **Primary Platforms**: PCs, servers, network-connected IoT devices, medical equipment, industrial infrastructure, Raspberry Pi (via evaluation board).
- **Target Industries**: Consumer, Industrial, Medical, High-assurance infrastructure, Automotive (EV charger), Camera systems.
- **Regulatory Status**: FIPS 140-3 certified; Common Criteria EAL4+ certified (ANSSI-CC-2025/10, ANSSI-CC-2024/38); TCG certified; JESD-47 qualified.
- **PQC Roadmap Details**: Supports LMS signature for firmware updates currently; enables support for ML-KEM and ML-DSA via future field firmware upgrades.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: RSASSA-PSS, RSASSA-PKCS1v1_5, ECDSA, ECSchnorr, ECDAA, LMS (SP800-208), ML-DSA (planned via firmware).
- **Authoritative Source URL**: Not stated (Source text references st.com but no specific product URL provided in the snippet).

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

## BERTEN MLDS-B235

- **Category**: Hardware Security and Semiconductors
- **Product Name**: MLDS-B235
- **Product Brief**: IP Core implementing NIST ML-DSA PQC digital signatures in FPGA, SoC, and ASIC technologies.
- **PQC Support**: Yes (NIST ML-DSA standard via CRYSTALS-Dilithium scheme)
- **PQC Capability Description**: Implements NIST Module-Lattice-Based Digital Signature Standard (ML-DSA) derived from CRYSTALS-Dilithium. Supports security levels 2, 3, and 5 (ML-DSA-44, ML-DSA-65, ML-DSA-87). Includes sequencer, Polynomial Arithmetic Unit, and SHAKE XOF. Features countermeasures against Side-Channel Attacks (SCA), timing, and Simple Power Analysis (SPA). Supports Hedged variant for signing.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: ML-DSA (ML-DSA-44, ML-DSA-65, ML-DSA-87), SHAKE (XOF)
- **Key Management Model**: Hardware IP core with internal memory zeroization (automatic and on-demand); key generation, signing, and verifying configured via register map.
- **Supported Blockchains**: Not stated
- **Architecture Type**: IP Core for FPGA, SoC, and ASIC; AMBA AXI interfaces (AXI4-Stream, AXI4-Lite)
- **Infrastructure Layer**: Hardware
- **License Type**: Commercial
- **License**: Perpetual Site Licence (encrypted netlist)
- **Latest Version**: BDS016 v1.02
- **Release Date**: 2025-03-07
- **FIPS Validated**: Compliant with FIPS 204 and FIPS 140-3 (Note: Document states "compliant", not explicitly "validated")
- **Primary Platforms**: AMD (Xilinx) devices, Intel (Altera) devices, Microchip (Microsemi) devices
- **Target Industries**: Quantum-Resistant Networks, Public Key Infrastructures, Network Security, Transport Protocols, User Authentication, Secure Communications, Electronic Transactions
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Implements current NIST ML-DSA standard; no future roadmap details provided.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA (ML-DSA-44, ML-DSA-65, ML-DSA-87)
- **Authoritative Source URL**: www.bertendsp.com

---

## BERTEN MLKE-B135

- **Category**: Hardware Security and Semiconductors
- **Product Name**: MLDS-B235 IP Core (ML-DSA Crypto Core)
- **Product Brief**: FPGA, SoC, and ASIC IP core implementing NIST FIPS 204 ML-DSA post-quantum digital signatures.
- **PQC Support**: Yes (Implements NIST FIPS 204 ML-DSA derived from CRYSTALS-Dilithium)
- **PQC Capability Description**: Implements the NIST Module-Lattice-Based Digital Signature Standard (ML-DSA) in FPGA, SoC, and ASIC. Supports security levels ML-DSA-44, ML-DSA-65, and ML-DSA-87. Includes countermeasures against Side-Channel Attacks (SCA), timing, and Simple Power Analysis (SPA). Supports Hedged variant for signing.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: ML-DSA (ML-DSA-44, ML-DSA-65, ML-DSA-87), SHAKE (XOF)
- **Key Management Model**: Hardware IP core with internal memory zeroization (automatic and on-demand); key generation, signing, and verifying configured via register map.
- **Supported Blockchains**: Not stated
- **Architecture Type**: IP Core for FPGA, SoC, and ASIC deployment
- **Infrastructure Layer**: Hardware
- **License Type**: Commercial
- **License**: Perpetual Site Licence (encrypted netlist)
- **Latest Version**: BDS016 v1.02
- **Release Date**: 2025-03-07
- **FIPS Validated**: Compliant with FIPS 204 and FIPS 140-3 (Note: Text states "compliant", not explicitly "validated")
- **Primary Platforms**: AMD (Xilinx), Intel (Altera), Microchip (Microsemi) FPGA/ASIC devices
- **Target Industries**: Quantum-Resistant Networks, Public Key Infrastructures, Network Security, Secure Communications, Electronic Transactions
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Implements current NIST FIPS 204 standard; no future roadmap details provided.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA (ML-DSA-44, ML-DSA-65, ML-DSA-87)
- **Authoritative Source URL**: www.bertendsp.com

---

## CAST KiviPQC-KEM

- **Category**: Hardware Security and Semiconductors
- **Product Name**: CAST KiviPQC-KEM
- **Product Brief**: Hardware accelerator for NIST FIPS 203 ML-KEM post-quantum key encapsulation operations.
- **PQC Support**: Yes (ML-KEM implementation)
- **PQC Capability Description**: Implements Module Lattice-based Key Encapsulation Mechanism (ML-KEM) per NIST FIPS 203. Supports all three parameter sets: ML-KEM-512, ML-KEM-768, and ML-KEM-1024. Offers key generation, encapsulation, and decapsulation procedures. Available in Fast (F) and Tiny (T) versions for ASIC/FPGA integration. Includes protection against timing-based side channel attacks.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: ML-KEM (ML-KEM-512, ML-KEM-768, ML-KEM-1024), AES, ASCON, SNOW-V, SM4, SHA-256, SHA-384/512, SHA-3, MD5
- **Key Management Model**: Hardware key storage within SoC; supports software Random Byte Generator (RBG) or integration with external third-party entropy source/RBG via customized interface.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Silicon IP Core (RISC-V-like SoC topology), available as ASIC or FPGA implementation; includes 32-bit RISC-V processor, hardware crypto accelerators (Fast version), and AMBA AXI4-Lite interface.
- **Infrastructure Layer**: Hardware
- **License Type**: Commercial
- **License**: Proprietary (Export controlled)
- **Latest Version**: Not stated
- **Release Date**: 2025-11-05 (Date of related content announcement)
- **FIPS Validated**: No (Text states "NIST FIPS Compliant" and implements algorithms standardized in FIPS 203, but does not state the product itself is FIPS validated)
- **Primary Platforms**: ASIC (TSMC), FPGA (Altera/Intel, AMD/Xilinx, Microchip); integrates into System-on-Chip (SoC) designs.
- **Target Industries**: Public-key infrastructure, cloud security, safety-critical infrastructure, IoT, HSMs, TPMs, secure Ethernet (MACsec), VPN/IKEv2, edge computing.
- **Regulatory Status**: Subject to export control regulations; requires potential special export license.
- **PQC Roadmap Details**: Implements current NIST FIPS 203 standard; no future roadmap details provided beyond current ML-KEM support.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated (Product is KEM only; related product KiviPQC-DSA handles signatures)
- **Authoritative Source URL**: Not stated

---

## IP Cores PQC1

- **Category**: Hardware Security and Semiconductors
- **Product Name**: PQC1 Post-Quantum Cryptography Accelerator IP Core
- **Product Brief**: Hardware IP core implementing ML-KEM and ML-DSA post-quantum cryptography standards with microprogramming sequencer.
- **PQC Support**: Yes (Implements ML-KEM/FIPS-203/Kyber and ML-DSA/FIPS-204/Dilithium)
- **PQC Capability Description**: Implements ML-KEM (FIPS-203, Kyber) and ML-DSA (FIPS-204, Dilithium) algorithms. Supports all FIPS-204 categories (ML-DSA-44, 65, 87) and FIPS-203 levels (ML-KEM-512, 768, 1024). Includes built-in NTT and SHAKE128/SHAKE256/SHA-3 engines. Contains three accelerators: NTT, FIPS-202 (SHA-3/SHAKE), and packing/unpacking. True random number generator is not included but TRNG1 core can be used.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: ML-KEM, ML-DSA, SHA-3, SHAKE128, SHAKE256, AES, DES, 3DES, RSA, ECC, GCM, CCM, EAX, XTS, ZUC, SNOW 3G, Kasumi, RC4, CMAC, XCBC
- **Key Management Model**: Hardware IP core with internal microprogramming sequencer; requires external single-port RAM banks; SDK supports key generation, signing, verification, encapsulation, and decapsulation. True random number generator not included in core.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Hardware IP Core (ASIC/FPGA) with APB/AHB/AXI microprocessor slave bus interface
- **Infrastructure Layer**: Hardware
- **License Type**: Commercial
- **License**: Proprietary (Synthesizable Verilog RTL source code, SDK, and documentation provided under license)
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No (Implements algorithms defined in FIPS-203 and FIPS-204 standards; no validation statement found)
- **Primary Platforms**: ASIC, FPGA (implied by HDL/Verilog deliverables); interfaces include APB, AHB, AXI
- **Target Industries**: Not stated
- **Regulatory Status**: Export control classification number 5E002 assigned by US Bureau of Industry and Security
- **PQC Roadmap Details**: Not stated (Current implementation details provided for ML-KEM and ML-DSA)
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA (FIPS-204, Dilithium)
- **Authoritative Source URL**: www.ipcores.com

---

## Secure-IC Securyzr

- **Category**: Hardware Security and Semiconductors
- **Product Name**: Securyzr™
- **Product Brief**: A portfolio of security IP cores and hardware solutions for SoC, ASIC, and FPGA including PQC, symmetric/asymmetric crypto, and memory protection.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Secure-IC is a global leader in PQC, offering ML-KEM/ML-DSA based on LWE hardness and XMSS (software IP running on Host CPU). The platform includes dedicated "Securyzr™ Post Quantum Cryptography" solutions.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: RSA, ECC, AES, AES-GCM, AES-XTS, ChaCha20-Poly1305, SM4, ARIA, 3DES, SHA-3, SM3, Snow 3G, ZUC, Kasumi, ML-KEM, ML-DSA, XMSS
- **Key Management Model**: Hardware key storage via Integrated Secure Element (iSE) and Hardware Security Modules; secure boot; memory encryption; on-the-fly execution from Flash.
- **Supported Blockchains**: Not stated
- **Architecture Type**: IP cores for SoC, ASIC, and FPGA; Integrated Secure Element (iSE); Hardware Security Modules; Tunable Cryptography engines.
- **Infrastructure Layer**: Hardware
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: Mentions compliance with FIPS 140, FIPS 180-3, FIPS 198, and FIPS 46-3; specific validation levels (e.g., Level 2/3) not stated.
- **Primary Platforms**: SoC, ASIC, FPGA, Microcontroller, Multi-core architectures, CXL link, Automotive (ISO26262 ASIL-D).
- **Target Industries**: Automotive & Smart Mobility, Defense & Space, Industry & Factory Automation, Critical infrastructures, Media & Entertainment, Smart Grid & Smart Cities, Consumer Electronics, Healthcare, Server & Cloud, Memory & Storage, Academics, Semiconductor.
- **Regulatory Status**: Mentions support for FIPS and Common Criteria certifications; ISO26262 ASIL-D certified for specific IP cores.
- **PQC Roadmap Details**: Implements ML-KEM/ML-DSA (LWE-based) and XMSS; described as pioneering advanced PQC technologies.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: RSA, ECC-based algorithms, ML-DSA, XMSS
- **Authoritative Source URL**: Not stated

---
