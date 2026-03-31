---
generated: 2026-03-30
collection: csc_033
documents_processed: 6
enrichment_method: ollama-qwen3.5:27b
---

## Forward Edge-AI Isidore Quantum

- **Category**: Network Security Software
- **Product Name**: Isidore Quantum®
- **Product Brief**: First drop-in, CNSA 2.0 & FIPS 140-3 compliant encryption device for space systems.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Delivers quantum-resilient encryption using CNSA 2.0-compliant algorithms including AES-256 GCM and ML-KEM (CRYSTALS-Kyber). Supports Dilithium for signatures. Features autonomous on-orbit rekeying, self-healing security, and integrated Quantum Random Number Generator (QRNG). Validated with U.S. Space Force, NASA, and NSA.
- **PQC Migration Priority**: Critical
- **Crypto Primitives**: AES-256 GCM, ML-KEM (CRYSTALS-Kyber), Dilithium, RSA, ECC
- **Key Management Model**: Autonomous on-orbit rekeying with self-healing security; eliminates PKI, certificates, and manual loaders; uses quantum-random key generation.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Hardware-based encryption module (Space COMSEC), High Throughput Space Router (HTSR), High Throughput Space Crypto (HTSC); zero-trust, protocol-agnostic hardware.
- **Infrastructure Layer**: Network, Hardware
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Not stated
- **Release Date**: 2026-09-15 (Table of contents date) / Q3 2026 - Q4 2026 (Availability for variants)
- **FIPS Validated**: Yes, FIPS 140-3 (Level 3) compliant.
- **Primary Platforms**: Space systems (satellites, launch systems, ground networks), TT&C links, inter-satellite links, hybrid space-terrestrial networks.
- **Target Industries**: Space Systems, Defense, Government (U.S. Space Force, NASA, NSA), Commercial Satellite Operators.
- **Regulatory Status**: CNSA 2.0 compliant, FIPS 140-3 Level 3, NIST SP 800-90 A/B/C, BSI AIS-31, ECCN 5A002 (License Exception ENC).
- **PQC Roadmap Details**: Available Q3 2026 and Q4 2026 for specific throughput variants; utilizes NSA-approved CRYSTALS-Kyber & Dilithium algorithms.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Dilithium (implied by CNSA 2.0 compliance and explicit mention), RSA, ECC (legacy).
- **Authoritative Source URL**: forwardedge.ai

---

## Palo Alto PAN-OS

- **Category**: Network Security Software
- **Product Name**: Palo Alto PAN-OS
- **Product Brief**: Next-generation firewall software providing network security, quantum readiness dashboard, and cipher translation capabilities.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports Post-Quantum Cryptography via PAN-OS 12.1 Orion. Features include a Quantum Readiness Dashboard for visibility, industry-first cipher translation to upgrade applications, and Quantum-Optimized Hardware (5th-gen NGFW models). Implements RFC 8784 (PPKs), RFC 9242, and RFC 9370 (Hybrid Keys) for IKEv2 VPNs. Supports integration with Quantum Key Distribution (QKD) per ETSI-014.
- **PQC Migration Priority**: High
- **Crypto Primitives**: Not stated (Text mentions support for RFC 8784, RFC 9242, and RFC 9370 but does not list specific algorithm names like Kyber or Dilithium).
- **Key Management Model**: Supports IKE key exchange with pre-shared keys (implied by PPKs in RFC 8784 context), certificate-based authentication, and Quantum Key Distribution (QKD) integration.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Next-Generation Firewall, Secure Access Service Edge (SASE), Virtual Appliance (VM-Series), Cloud-Native (Prisma AIRS, Cloud NGFW).
- **Infrastructure Layer**: Network, Security Stack, Hardware, Cloud
- **License Type**: Commercial
- **License**: Proprietary (Requires "Quantum-Safe Security License" activation)
- **Latest Version**: PAN-OS 12.1 Orion
- **Release Date**: 2025-08-14
- **FIPS Validated**: Not stated
- **Primary Platforms**: Multi-cloud environments, AWS, Azure (Cloud NGFW), On-premise hardware (Next-Generation Firewall models).
- **Target Industries**: Enterprise, Sports (NBA), Travel (Sabre), General Corporate.
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Available via software upgrade to PAN-OS 12.1 Orion. Includes migration planning, preparation, and configuration for RFC 8784, RFC 9242, and RFC 9370.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated (Text references RFCs for key exchange/hybrid keys but does not explicitly name signature schemes).
- **Authoritative Source URL**: https://www.prnewswire.com/news-releases/palo-alto-networks-delivers-enterprise-wide-quantumsecurity-readiness-for-all-customers-302529895.html

---

## Check Point Quantum

- **Category**: Network Security Software
- **Product Name**: Check Point Quantum Force 9300
- **Product Brief**: High-performance security gateway delivering up to 70 Gbps firewall throughput with integrated AI/ML threat prevention in a 1 RU modular platform.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports "quantum-safe" VPN using RFC 9242 and RFC 9370 for IKEv2 enhancements, enabling hybrid key exchange with classical and PQC algorithms. References NIST CNSA 2.0 suite including CRYSTALS-Kyber (ML-KEM/FIPS 203), CRYSTALS-Dilithium (ML-DSA/FIPS 204), SPHINCS+ (SLH-DSA/FIPS 205), LMS, and XMSS for future-proofing against quantum threats.
- **PQC Migration Priority**: High
- **Crypto Primitives**: RSA, ECC, AES-GCM, SHA-384, SHA-512, CRYSTALS-Kyber (ML-KEM), CRYSTALS-Dilithium (ML-DSA), SPHINCS+ (SLH-DSA), LMS, XMSS
- **Key Management Model**: Hybrid key exchange supporting classical and quantum-safe algorithms via IKEv2 enhancements (RFC 9242, RFC 9370); supports up to eight concurrent security checks/key exchanges.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Security Gateway / Next-Generation Firewall (Hardware appliance with modular I/O)
- **Infrastructure Layer**: Network, Hardware
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Quantum Firewall Software Release R82 take #25
- **Release Date**: 2025-09-05
- **FIPS Validated**: No (Document references FIPS 203, 204, 205 standards for PQC algorithms but does not state the appliance itself is FIPS 140 validated)
- **Primary Platforms**: On-premises hardware (1 RU chassis), Cloud management integration mentioned
- **Target Industries**: Enterprise, Healthcare, Financial Services, Government, Education, Manufacturing, Retail, Telco/Service Provider
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Plans to extend PQC protections from VPNs to TLS; currently supports hybrid approach for backward and forward compatibility using RFC 9242 and RFC 9370.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: CRYSTALS-Dilithium (ML-DSA), SPHINCS+ (SLH-DSA), LMS, XMSS; traditional RSA/ECC mentioned as legacy targets for replacement.
- **Authoritative Source URL**: Not stated

---

## F5 BIG-IP

- **Category**: Network Security Software
- **Product Name**: F5 BIG-IP
- **Product Brief**: Part of the F5 Application Delivery and Security Platform, enabling hybrid PQC key exchange in production.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports hybrid PQC key exchange in production using FIPS 203 (ML-KEM based on Kyber) combined with classical algorithms like X25519, RSA, or ECC. Enables TLS termination at the edge without backend refactoring.
- **PQC Migration Priority**: High
- **Crypto Primitives**: ML-KEM (Kyber), X25519, RSA, ECC
- **Key Management Model**: Hybrid key exchange combining classical algorithms with post-quantum algorithms in the same handshake; TLS termination within BIG-IP.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Edge termination point, API gateway, centralized TLS orchestration
- **Infrastructure Layer**: Network, Security Stack
- **License Type**: Commercial
- **License**: Proprietary (Subscriptions, Perpetual licensing)
- **Latest Version**: v17.5.1
- **Release Date**: Not stated
- **FIPS Validated**: FIPS 203 supported (ratified); FIPS 140 status not explicitly stated in text.
- **Primary Platforms**: Amazon Web Services, Google Cloud Platform, Microsoft Azure, Red Hat OpenShift
- **Target Industries**: Banking and financial services, E-commerce, Healthcare, Public sector, Technology, Manufacturing
- **Regulatory Status**: Not stated (mentions CISA and NIST recommendations)
- **PQC Roadmap Details**: Track FIPS 204/205 for post-quantum signature support; prioritize public-facing APIs and login flows.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated (text focuses on key exchange/encryption via ML-KEM)
- **Authoritative Source URL**: Not stated

---

## Broadcom Avi (NSX ALB)

- **Category**: Network Security Software
- **Product Name**: VMware Avi Load Balancer
- **Product Brief**: Network security software providing load balancing with Post Quantum Cryptography support for TLS 1.3.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Version 31.2.1 supports Pure ML-KEM, Hybrid KEMs (combining ECC curves like P-256/X25519 with ML-KEM), and MLDSA signature algorithms. Requires TLS 1.3 for PQC key exchange. Supports OpenSSL 3.5 or oqsprovider 0.10.0.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: RSA, ECDSA, ECDH, secp256r1 (P-256), secp384r1 (P-384), secp521r1 (P-521), X25519, X448, ML-KEM (mlkem512, mlkem768, mlkem1024), MLDSA (MLDSA44, MLDSA87)
- **Key Management Model**: HSM-backed (Thales Luna Provider) for SIGN operations only; session keys generated locally. Supports certificate-based auth with MLDSA certificates.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Virtual appliance / Load Balancer (Network Security Software)
- **Infrastructure Layer**: Network, Security Stack
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: 31.2.1
- **Release Date**: Unknown
- **FIPS Validated**: No (PQC based KEMs and Signature Algorithms are not supported on an Avi deployment with FIPS enabled)
- **Primary Platforms**: Not stated (Requires OpenSSL 3.5 or oqsprovider 0.10.0)
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Version 31.2.1 introduces support for Pure ML-KEM, Hybrid KEMs, and MLDSA.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ECDSA+SHA256, RSA+SHA256, MLDSA44, MLDSA87
- **Authoritative Source URL**: Not stated

---

## Juniper SRX Series Firewalls

- **Category**: Network Security Software
- **Product Name**: Juniper SRX Series Firewalls
- **Product Brief**: Network security software running on Juniper Networks hardware, providing firewall and encryption capabilities.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports PQC signatures for software images with off-box verification to ensure integrity against quantum threats. Uses ML-DSA-87 for digital signatures and SHA-512 for hashing, complying with CNSA 2.0. Verification requires requesting the signature from the support portal and validating with a chosen verifier.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: ML-DSA-87, SHA-512
- **Key Management Model**: Not stated (Document mentions retrieving public key from certificate for off-box verification but does not describe the key exchange or management architecture).
- **Supported Blockchains**: Not stated
- **Architecture Type**: Network Security Software / Firewall / VPN Concentrator (Runs on SRX Series hardware and vSRX virtual appliance)
- **Infrastructure Layer**: Network, Hardware
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: Junos OS Release 25.4R1
- **Release Date**: 2026-03-13
- **FIPS Validated**: Not stated
- **Primary Platforms**: ACX Series, cRPD, cSRX, EX Series, JRR Series, Juniper Secure Connect, MX Series, NFX Series, QFX Series, SRX Series, vSRX
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Implements ML-DSA-87 and SHA-512 for software image signatures in Release 25.4R1; complies with CNSA 2.0.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA-87 (PQC), Legacy signatures (implied by "additional security beyond existing legacy signatures")
- **Authoritative Source URL**: https://www.juniper.net/documentation/product/us/en/junosos#cat=release_notes

---
