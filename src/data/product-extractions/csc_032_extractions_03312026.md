---
generated: 2026-03-31
collection: csc_032
documents_processed: 14
enrichment_method: ollama-qwen3.5:27b
---

## Cisco IOS XE PQC

- **Category**: Network Operating Systems
- **Product Name**: Cisco IOS XE
- **Product Brief**: Single OS for enterprise switching, routing, wired and wireless access providing open programmable interfaces.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports Post-Quantum Pre-Shared Key (PPK) method via RFC 8784 mixing in IKEv2 key derivation. Implements NIST standards FIPS-203 (ML-KEM), FIPS-204 (ML-DSA), and SP 800-208 (LMS) for quantum-resistant encryption, authentication, and secure boot.
- **PQC Migration Priority**: Critical
- **Crypto Primitives**: ML-KEM, ML-DSA, LMS, AES256, IKEv2, IPsec, TLS, SSH
- **Key Management Model**: Post-Quantum Pre-Shared Key (PPK) mixing in IKEv2; supports dynamic PPK rekeying.
- **Supported Blockchains**: Not stated
- **Architecture Type**: OS-level crypto support with quantum-resistant key exchange and authentication modules.
- **Infrastructure Layer**: Network, Security Stack
- **License Type**: Proprietary
- **License**: Proprietary (Cisco Systems, Inc.)
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: Mentions FIPS-203, FIPS-204, and SP 800-208 standards; specific validation status not stated.
- **Primary Platforms**: Cisco Catalyst 9200/9300/9400/9500/9600 Series, ASR 1000/900 Series, NCS 4200 Series, Catalyst 8000 Edge, ISR 4000/1000 Series, cBR Series, Industrial Switches/Routers.
- **Target Industries**: Enterprise, Government (implied by CNSA 2.0), WAN, SD-WAN
- **Regulatory Status**: Aligns with NIST PQC Standards, CNSA 2.0, NSA, ETSI, CISA mandates.
- **PQC Roadmap Details**: Timeline indicates adoption of Post-Quantum Cryptography between 2025-2030; plans to defend against quantum attacks by 2030-2035.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA, LMS (Planned/Supported); ECDSA/RSA implied as current vulnerable methods being replaced.
- **Authoritative Source URL**: Not stated

---

## Juniper Junos OS

- **Category**: Network Operating Systems
- **Product Name**: Junos OS Evolved
- **Product Brief**: Network operating system running on Juniper Networks ACX, PTX, and QFX Series hardware.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: The document lists "Post-Quantum Cryptography (PQC)" as a new feature section for ACX, PTX, and QFX Series in Release 25.4R1. However, the provided text contains only the Table of Contents entries and does not include the specific content, algorithms, or implementation details within those sections.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions PQC section but does not list specific algorithms like ECDSA, Ed25519, etc.)
- **Key Management Model**: Not stated (Document mentions IMA keyrings for integrity measurement but does not describe the general OS keychain or certificate store architecture)
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated (Document mentions kernel-level IMA enforcement and userspace scripting via SLAX, but does not define the crypto provider model)
- **Infrastructure Layer**: Network, Hardware, OS
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: 25.4R1
- **Release Date**: 2026-03-09
- **FIPS Validated**: Not stated
- **Primary Platforms**: Juniper Networks ACX Series, PTX Series, QFX Series, Third-Party Whitebox
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated (Only the existence of a PQC feature in 25.4R1 is noted; no specific algorithms or future plans are detailed)
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

## Arista EOS (Extensible Operating System)

- **Category**: Network Operating Systems
- **Product Name**: Arista EOS (Extensible Operating System)
- **Product Brief**: Unknown
- **PQC Support**: Unknown
- **PQC Capability Description**: Not stated
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Network
- **License Type**: Unknown
- **License**: Unknown
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: Unknown
- **Primary Platforms**: Unknown
- **Target Industries**: Unknown
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Arista_EOS__Extensible_Operating_System_.html

---

## MikroTik RouterOS

- **Category**: Network Operating Systems
- **Product Name**: RouterOS
- **Product Brief**: Stand-alone operating system based on Linux kernel powering MikroTik hardware devices with routing, firewall, and VPN features.
- **PQC Support**: No
- **PQC Capability Description**: Not stated in the provided text. No mention of Post-Quantum Cryptography algorithms, migration plans, or quantum-resistant implementations.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: IPsec (mentioned as "IPsec hardware acceleration"); specific primitives like ECDSA, Ed25519, or RSA are not explicitly listed in the text.
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Stand-alone operating system; Virtual appliance (CHR - Cloud Hosted Router); Inline encryptor/VPN concentrator (implied by "IPsec gateway", "VPN server").
- **Infrastructure Layer**: Network, Hardware, Cloud
- **License Type**: Commercial
- **License**: Proprietary (requires license key from MikroTik Account server; free 24-hour trial available).
- **Latest Version**: Not stated (text mentions "latest stable RouterOS version" without a specific number).
- **Release Date**: Not stated (documentation update dates like Oct 21, 2025, and Mar 04, 2026 are present but do not correspond to a software release date).
- **FIPS Validated**: No
- **Primary Platforms**: MikroTik hardware devices, PC (x86), Virtual Machines (Cloud Hosted Router/CHR), Amazon AWS marketplace.
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (text contains demo addresses demo.mt.lv and demo2.mt.lv, but no primary product URL is explicitly defined as the authoritative source).

---

## Cisco IOS XR

- **Category**: Network Operating Systems
- **Product Name**: Cisco IOS XR
- **Product Brief**: A modern, trustworthy network operating system designed for service providers with Linux-style workflows and secure boot.
- **PQC Support**: No
- **PQC Capability Description**: The provided text discusses quantum computing fundamentals and the threat of quantum adversaries but does not state that Cisco IOS XR currently implements Post-Quantum Cryptography algorithms or features. It mentions "Securing Your Network Against Quantum Adversaries" as a session topic, but no specific PQC implementation details are found in the data sheet.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Text mentions signatures and keys generally for secure boot and RPM validation but does not list specific algorithms like ECDSA or RSA).
- **Key Management Model**: Hardware-based Trust Anchor Module (TAm) housing known good values, keys, and certificates rooted to Cisco; used for verifying hardware components, bootloader, kernel modules, and RPM signatures.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Linux-based (WindRiver Linux 9), single host layer with native control plane processes, supports containers (LXC, Docker).
- **Infrastructure Layer**: Network, OS
- **License Type**: Proprietary
- **License**: Proprietary (Cisco and/or its affiliates. All rights reserved.)
- **Latest Version**: Release 7 (mentioned as "With Release 7 of IOS XR")
- **Release Date**: Not stated (Document copyright is 2026, but no specific release date for version 7 is provided)
- **FIPS Validated**: Not stated
- **Primary Platforms**: Cisco 8000 series, NCS 540/560, NCS 5000/5500/5700, ASR 9000, XRd, XRv9000, qualified third-party hardware.
- **Target Industries**: Service Providers (SPs), Web-scale networks
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
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
## Cisco IOS XE PQC

- **Category**: Network Operating Systems
- **Product Name**: Cisco IOS XE
- **Product Brief**: Single OS for enterprise switching, routing, wired and wireless access providing open programmable interfaces.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports Post-Quantum Pre-Shared Key (PPK) method via RFC 8784 mixing in IKEv2 key derivation. Implements NIST standards FIPS-203 (ML-KEM), FIPS-204 (ML-DSA), and SP 800-208 (LMS) for quantum-resistant encryption, authentication, and secure boot.
- **PQC Migration Priority**: Critical
- **Crypto Primitives**: ML-KEM, ML-DSA, LMS, AES256, IKEv2, IPsec, TLS, SSH
- **Key Management Model**: Post-Quantum Pre-Shared Key (PPK) mixing in IKEv2; supports dynamic PPK rekeying.
- **Supported Blockchains**: Not stated
- **Architecture Type**: OS-level crypto support with quantum-resistant key exchange and authentication modules.
- **Infrastructure Layer**: Network, Security Stack
- **License Type**: Proprietary
- **License**: Proprietary (Cisco Systems, Inc.)
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: Mentions FIPS-203, FIPS-204, and SP 800-208 standards; specific validation status not stated.
- **Primary Platforms**: Cisco Catalyst 9200/9300/9400/9500/9600 Series, ASR 1000/900 Series, NCS 4200 Series, Catalyst 8000 Edge, ISR 4000/1000 Series, cBR Series, Industrial Switches/Routers.
- **Target Industries**: Enterprise, Government (implied by CNSA 2.0), WAN, SD-WAN
- **Regulatory Status**: Aligns with NIST PQC Standards, CNSA 2.0, NSA, ETSI, CISA mandates.
- **PQC Roadmap Details**: Timeline indicates adoption of Post-Quantum Cryptography between 2025-2030; plans to defend against quantum attacks by 2030-2035.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA, LMS (Planned/Supported); ECDSA/RSA implied as current vulnerable methods being replaced.
- **Authoritative Source URL**: Not stated

---

## Juniper Junos OS

- **Category**: Network Operating Systems
- **Product Name**: Junos OS Evolved
- **Product Brief**: Network operating system running on Juniper Networks ACX, PTX, and QFX Series hardware.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: The document lists "Post-Quantum Cryptography (PQC)" as a new feature section for ACX, PTX, and QFX Series in Release 25.4R1. However, the provided text contains only the Table of Contents entries and does not include the specific content, algorithms, or implementation details within those sections.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions PQC section but does not list specific algorithms like ECDSA, Ed25519, etc.)
- **Key Management Model**: Not stated (Document mentions IMA keyrings for integrity measurement but does not describe the general OS keychain or certificate store architecture)
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated (Document mentions kernel-level IMA enforcement and userspace scripting via SLAX, but does not define the crypto provider model)
- **Infrastructure Layer**: Network, Hardware, OS
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: 25.4R1
- **Release Date**: 2026-03-09
- **FIPS Validated**: Not stated
- **Primary Platforms**: Juniper Networks ACX Series, PTX Series, QFX Series, Third-Party Whitebox
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated (Only the existence of a PQC feature in 25.4R1 is noted; no specific algorithms or future plans are detailed)
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

## Arista EOS (Extensible Operating System)

- **Category**: Network Operating Systems
- **Product Name**: Arista EOS (Extensible Operating System)
- **Product Brief**: Unknown
- **PQC Support**: Unknown
- **PQC Capability Description**: Not stated
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Network
- **License Type**: Unknown
- **License**: Unknown
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: Unknown
- **Primary Platforms**: Unknown
- **Target Industries**: Unknown
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Arista_EOS__Extensible_Operating_System_.html

---

## MikroTik RouterOS

- **Category**: Network Operating Systems
- **Product Name**: RouterOS
- **Product Brief**: Stand-alone operating system based on Linux kernel powering MikroTik hardware devices with routing, firewall, and VPN features.
- **PQC Support**: No
- **PQC Capability Description**: Not stated in the provided text. No mention of Post-Quantum Cryptography algorithms, migration plans, or quantum-resistant implementations.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: IPsec (mentioned as "IPsec hardware acceleration"); specific primitives like ECDSA, Ed25519, or RSA are not explicitly listed in the text.
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Stand-alone operating system; Virtual appliance (CHR - Cloud Hosted Router); Inline encryptor/VPN concentrator (implied by "IPsec gateway", "VPN server").
- **Infrastructure Layer**: Network, Hardware, Cloud
- **License Type**: Commercial
- **License**: Proprietary (requires license key from MikroTik Account server; free 24-hour trial available).
- **Latest Version**: Not stated (text mentions "latest stable RouterOS version" without a specific number).
- **Release Date**: Not stated (documentation update dates like Oct 21, 2025, and Mar 04, 2026 are present but do not correspond to a software release date).
- **FIPS Validated**: No
- **Primary Platforms**: MikroTik hardware devices, PC (x86), Virtual Machines (Cloud Hosted Router/CHR), Amazon AWS marketplace.
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (text contains demo addresses demo.mt.lv and demo2.mt.lv, but no primary product URL is explicitly defined as the authoritative source).

---

## Cisco IOS XR

- **Category**: Network Operating Systems
- **Product Name**: Cisco IOS XR
- **Product Brief**: A modern, trustworthy network operating system designed for service providers with Linux-style workflows and secure boot.
- **PQC Support**: No
- **PQC Capability Description**: The provided text discusses quantum computing fundamentals and the threat of quantum adversaries but does not state that Cisco IOS XR currently implements Post-Quantum Cryptography algorithms or features. It mentions "Securing Your Network Against Quantum Adversaries" as a session topic, but no specific PQC implementation details are found in the data sheet.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Text mentions signatures and keys generally for secure boot and RPM validation but does not list specific algorithms like ECDSA or RSA).
- **Key Management Model**: Hardware-based Trust Anchor Module (TAm) housing known good values, keys, and certificates rooted to Cisco; used for verifying hardware components, bootloader, kernel modules, and RPM signatures.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Linux-based (WindRiver Linux 9), single host layer with native control plane processes, supports containers (LXC, Docker).
- **Infrastructure Layer**: Network, OS
- **License Type**: Proprietary
- **License**: Proprietary (Cisco and/or its affiliates. All rights reserved.)
- **Latest Version**: Release 7 (mentioned as "With Release 7 of IOS XR")
- **Release Date**: Not stated (Document copyright is 2026, but no specific release date for version 7 is provided)
- **FIPS Validated**: Not stated
- **Primary Platforms**: Cisco 8000 series, NCS 540/560, NCS 5000/5500/5700, ASR 9000, XRd, XRv9000, qualified third-party hardware.
- **Target Industries**: Service Providers (SPs), Web-scale networks
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
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
