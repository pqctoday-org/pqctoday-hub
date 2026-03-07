---
generated: 2026-03-06
collection: csc_048
documents_processed: 5
enrichment_method: ollama-qwen3.5:27b
---

## Thales High Speed Encryptor (HSE)

- **Category**: Network Encryptors
- **Product Name**: Thales High Speed Encryptor (HSE) / Thales CN Series Network Encryptors
- **Product Brief**: FIPS-certified network encryption devices offering data-in-motion security up to 100 Gbps with ultra-low latency.
- **PQC Support**: No
- **PQC Capability Description**: The document mentions a general "Quantum" section advising enterprises to start planning for post-quantum readiness and offers a risk assessment, but it does not state that the High Speed Encryptor (HSE) or CN Series products currently support PQC algorithms or have a specific implementation status.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Hardware network encryptor (inline)
- **Infrastructure Layer**: Network, Hardware
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: Yes (FIPS-certified; FIPS 140-2 and FIPS 140-3 mentioned in compliance section)
- **Primary Platforms**: Enterprise, Government, Cloud Service Providers, Data Centers
- **Target Industries**: Enterprise, Government, Financial Services, Telecommunications, Critical Infrastructure
- **Regulatory Status**: FIPS 140-2, FIPS 140-3, CMMC, FedRamp, NIST 800-53 (mentioned in general compliance context)
- **PQC Roadmap Details**: Not stated for this specific product; general advice to start planning provided.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated

---

## Senetas CN7000 Series

- **Category**: Network Encryptors
- **Product Name**: Senetas CN7000 Series
- **Product Brief**: Quantum-resistant, crypto-agile network encryptor for tactical edge and rugged environments up to 1 Gbps.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports quantum-resistant hybrid encryption using NIST PQC standards ML-KEM and ML-DSA. Designed for future threats with support for sovereign/custom algorithms via CSDK. Includes SNMPv3Q for quantum-safe management.
- **PQC Migration Priority**: High
- **Crypto Primitives**: AES-128, AES-256, GCM, CTR, X.509 ECC, X.509 RSA, ML-KEM, ML-DSA
- **Key Management Model**: Automatic key management, NIST-validated key generation via Senetas Transport Independent Mode (TIM), external Key Servers (CipherTrust), supports perfect forward secrecy.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Hardware-based network encryptor with FPGA encryption engine
- **Infrastructure Layer**: Network, Hardware
- **License Type**: Proprietary
- **License**: Proprietary
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: Yes (FIPS 140-3 Level 1 certified)
- **Primary Platforms**: Military, industrial, in-vehicle, field deployments, OT networks, edge sites
- **Target Industries**: Government & Defence, Critical Infrastructure, Industrial/OT, Commercial Cyber Security
- **Regulatory Status**: FIPS 140-3 Level 1 (CE Crypto Module), MIL-STD-810G compliant
- **PQC Roadmap Details**: Currently supports hybrid encryption with ML-KEM and ML-DSA; designed to NIST PQC standards; supports custom cipher development via CSDK for evolving requirements.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ECDSA (implied by ECC), RSA, ML-DSA
- **Authoritative Source URL**: Not stated

---

## Adva Network Security FSP 3000 S-Flex

- **Category**: Network Encryptors
- **Product Name**: Adva Network Security FSP 3000 S-Flex™
- **Product Brief**: BSI-approved 400G Layer 1 muxponder with quantum-safe encryption for classified data.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: The solution delivers quantum-safe Layer 1 encryption using post-quantum cryptography (PQC) and ConnectGuard™ technology. It features BSI-approved post-quantum key exchange to protect VS-NfD and EU/NATO-restricted data against harvest-now, decrypt-later attacks.
- **PQC Migration Priority**: Critical
- **Crypto Primitives**: Not stated
- **Key Management Model**: Post-quantum key exchange; specific architecture (e.g., HSM, MPC) not stated.
- **Supported Blockchains**: Not stated
- **Architecture Type**: High-capacity transponder/muxponder card for optical transport platform; Layer 1 encryption solution.
- **Infrastructure Layer**: Network, Hardware
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: Not stated
- **Release Date**: 2025-09-25
- **FIPS Validated**: No (BSI approved for VS-NfD and EU/NATO-restricted data; FIPS not mentioned)
- **Primary Platforms**: Adtran FSP 3000 open optical transport platform
- **Target Industries**: Critical infrastructure, Research and science, Finance and insurance, Energy and utilities, Public sector and defense
- **Regulatory Status**: BSI-approved for VS-NfD and EU/NATO-restricted data communication
- **PQC Roadmap Details**: Already deployed and certified; supports upgrade path in sync with evolving standards.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Adva_Network_Security_FSP_3000_S-Flex.html

---

## Ciena WaveLogic 6 Extreme

- **Category**: Network Encryptors
- **Product Name**: Ciena WaveLogic 6 Extreme
- **Product Brief**: Industry's only 1.6Tb/s quantum-safe optical encryption solution on the Waveserver platform.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports NIST-certified PQC algorithms and Quantum Key Distribution (QKD) interworking via ETSI-standard API. Features crypto agility for software-based adaptation to new standards and hybrid cryptographic approaches supporting current and post-quantum algorithms simultaneously.
- **PQC Migration Priority**: Critical
- **Crypto Primitives**: AES-256-GCM, NIST-certified PQC algorithms (specific algorithm names not stated)
- **Key Management Model**: Supports fast key rotation (every second), separate keys for encryption and authentication, and interworking with third-party QKD systems for quantum-generated keys.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Inline optical encryptor deployed on Waveserver platform; compact modular form-factor integrated into transport network.
- **Infrastructure Layer**: Network, Hardware
- **License Type**: Commercial
- **License**: Proprietary (Not explicitly named)
- **Latest Version**: WaveLogic 6 Extreme (WL6e)
- **Release Date**: Not stated (Blog date: February 12, 2026; OFC event mentioned as 2026)
- **FIPS Validated**: Yes (FIPS 140-3 Level 2 certification mentioned for government/defense use cases)
- **Primary Platforms**: Waveserver platform
- **Target Industries**: Cloud providers, Service providers, Financial institutions, Healthcare, Government and defense agencies
- **Regulatory Status**: NIST-certified PQC algorithms support; FIPS 140-3 Level 2 certification; NIS2 Directive compliance mentioned.
- **PQC Roadmap Details**: Built with crypto agility to adapt to new standards via software; existing WaveLogic 5e 800G deployments can upgrade via software.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated (Encryption algorithms specified, signature schemes not mentioned)
- **Authoritative Source URL**: Not stated

---

## Thales MISTRAL Encryptor

- **Category**: Network Encryptors
- **Product Name**: Thales MISTRAL Encryptor
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
- **Regulatory Status**: Unknown
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Thales_MISTRAL_Encryptor.html

---
