---
generated: 2026-04-13
collection: catalog
documents_processed: 5
enrichment_method: ollama-qwen3.5:27b
---

## Entrust nShield

- **Reference ID**: Entrust nShield
- **Title**: Entrust nShield
- **Authors**: Hardware Security Module (HSM) Software
- **Publication Date**: 2025
- **Last Updated**: 2026-03-30
- **Document Status**: Verified
- **Main Topic**: Entrust nShield HSMs achieve NIST CAVP validation for ML-KEM, ML-DSA, and SLH-DSA algorithms in firmware v13.8.0.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA, LMS, HSS, XMSS
- **Quantum Threats Addressed**: quantum computing advancements threaten established security protocols; looming threats of quantum computing
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: NIST
- **Leaders Contributions Mentioned**: Mike Baxter, Chief Technology and Product Officer at Entrust
- **PQC Products Mentioned**: Entrust nShield HSMs, PQSDK C API
- **Protocols Covered**: PKCS#11
- **Infrastructure Layers**: Hardware Security Modules (HSMs), Key Management, Public Key Infrastructure (PKI)
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: FIPS 140-3 Level 3, Cryptographic Algorithm Validation Program (CAVP), Cryptographic Module Validation Program (CMVP)
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Entrust nShield HSM firmware v13.8.0 provides native support for NIST standardized PQC algorithms; Organizations can deploy quantum-safe security immediately with CAVP validated implementations; FIPS 140-3 Level 3 validation for the updated firmware is pending submission; LMS, HSS, and XMSS are available via the PQSDK C API interface
- **Security Levels & Parameters**: ML-KEM (512/768/1024), ML-DSA (44/65/87), SLH-DSA (all 12 param sets), FIPS 140-3 Level 3
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, CISO, Compliance Officer, Operations
- **Implementation Prerequisites**: Entrust nShield HSM firmware v13.8.0+; PKCS#11 interface; PQSDK C API for LMS/HSS/XMSS
- **Relevant PQC Today Features**: hsm-pqc, algorithms, compliance, leaders, stateful-signatures
- **Source Document**: Entrust_nShield.html (103,709 bytes, 7,932 extracted chars)
- **Extraction Timestamp**: 2026-04-13T19:13:18

---

## HashiCorp Vault

- **Reference ID**: HashiCorp Vault
- **Title**: HashiCorp Vault
- **Authors**: Key Management Systems (KMS)
- **Publication Date**: 2026-01-07
- **Last Updated**: 2026-03-31
- **Document Status**: Verified
- **Main Topic**: HashiCorp's strategic approach to integrating NIST post-quantum cryptography standards into Vault Enterprise and preparing enterprises for quantum threats.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA, FN-DSA
- **Quantum Threats Addressed**: Harvest-now-decrypt-later strategy; Shor's algorithm
- **Migration Timeline Info**: NIST predicts first post-quantum certificates won't be commercially available until 2026
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Rich DuBose, Mohan Madhvapathy Rao
- **PQC Products Mentioned**: Vault Enterprise; HashiCorp Vault
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Transit secrets engine; PKI; Secrets management
- **Standardization Bodies**: NIST; ETSI
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA, ECC
- **Key Takeaways**: Enterprises should institute a post-quantum readiness task force to plan and execute PQC implementation; Organizations must discover and inventory cryptographic usage to develop crypto-agility; High-risk assets and long-lived sensitive data require immediate assessment due to harvest-now-decrypt-later threats; HashiCorp plans to adopt hybrid schemes enabling current and post-quantum algorithms to coexist in Vault
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid schemes; crypto-agility; fallback mechanisms
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Compliance Officer, Policy Maker
- **Implementation Prerequisites**: Go programming language maturity for hybrid schemes; cryptographic inventory; zero trust security policies; PQC readiness program/task force
- **Relevant PQC Today Features**: Threats, Migrate, Assess, Algorithms, crypto-agility, pqc-governance, migration-program
- **Source Document**: HashiCorp_Vault.html (282,022 bytes, 13,838 extracted chars)
- **Extraction Timestamp**: 2026-04-13T19:15:03

---

## Entrust KeyControl

- **Reference ID**: Entrust KeyControl
- **Title**: Entrust KeyControl
- **Authors**: Key Management Systems (KMS)
- **Publication Date**: 2025
- **Last Updated**: 2026-03-30
- **Document Status**: Verified
- **Main Topic**: The document outlines a strategic roadmap for transitioning organizations from post-quantum preparedness to full PQC adoption using NIST standards and hybrid or pure migration approaches.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA, HQC
- **Quantum Threats Addressed**: Cryptographically relevant quantum computers (CRQCs), Harvest now decrypt later (HNDL) attacks
- **Migration Timeline Info**: NIST published first three PQC algorithms in August 2024; HQC draft standard expected in 2026; NSA favors exclusive PQC algorithm use by 2030 for National Security Systems
- **Applicable Regions / Bodies**: United States, France, Germany, European Union, United Kingdom; NIST, ANSSI, BSI, European Commission, NSA, NCSC
- **Leaders Contributions Mentioned**: Samantha Mabey (Director of Digital Security Solutions Marketing at Entrust); Jenn Markey (Advisor, Entrust Cybersecurity Institute)
- **PQC Products Mentioned**: Entrust KeyControl, nShield HSM, nShield 5 HSM v13.8.0
- **Protocols Covered**: TLS, IPsec, SSH, KMIP
- **Infrastructure Layers**: Hardware Security Modules (HSMs), Public Key Infrastructure (PKI), Keys Secrets and Certificates Management, Cryptographic Security Platform
- **Standardization Bodies**: NIST, IETF, Open Quantum Safe, MITRE Post-Quantum Cryptography Coalition
- **Compliance Frameworks Referenced**: FIPS 203, FIPS 204, FIPS 205, CAVP validation
- **Classical Algorithms Referenced**: RSA, ECC
- **Key Takeaways**: Organizations must move beyond PQ preparedness to implement PQC in production due to HNDL attacks and government mandates; PQC migration requires a staged enterprise-wide transformation with clear ownership rather than a simple switch; A hybrid approach offers operational continuity but adds complexity, while pure PQC ensures quantum readiness but risks legacy incompatibility; Enterprises should inventory all cryptographic assets and prioritize high-risk long-life data for migration; Systems must be built with crypto agility to allow swapping of cryptographic primitives as standards evolve.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid PQC migration combining traditional algorithms like RSA with PQC algorithms; Pure PQC migration replacing all traditional algorithms; Interim hybrid measures on the path to full adoption; Crypto agility to swap cryptographic primitives
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Compliance Officer, Policy Maker, Developer
- **Implementation Prerequisites**: Unified cryptographic security platform; Complete inventory of cryptographic assets including algorithms protocols libraries keys and dependencies; Updated security policies including PQC adoption; Procurement policies embedding PQC requirements; Training for developers and security teams on PQC algorithms and key management
- **Relevant PQC Today Features**: Threats, Compliance, Migrate, Assess, Algorithms, Hybrid-crypto, Crypto-agility, Hsm-pqc, Migration-program, Pqc-governance
- **Source Document**: Entrust_KeyControl.html (114,718 bytes, 11,333 extracted chars)
- **Extraction Timestamp**: 2026-04-13T19:16:56

---

## Cryptosense Analyzer

- **Reference ID**: Cryptosense Analyzer
- **Title**: Cryptosense Analyzer
- **Authors**: Cryptographic Agility Frameworks
- **Publication Date**: 2025
- **Last Updated**: 2026-03-31
- **Document Status**: Verified
- **Main Topic**: SandboxAQ acquires Cryptosense to accelerate post-quantum cryptography solutions deployment and enhance cryptographic inventory management.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: existing and emerging quantum threats
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: United States, France, United Kingdom; Bodies: European Union
- **Leaders Contributions Mentioned**: Jack D. Hidary (SandboxAQ CEO); Dr. Graham Steel (Cryptosense founder)
- **PQC Products Mentioned**: Cryptosense Analyzer Platform; SandboxAQ cybersecurity products; evolutionQ
- **Protocols Covered**: None detected
- **Infrastructure Layers**: IT infrastructure; software, hardware and cloud cryptography services
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations need continuous cryptographic inventory to assess risk and plan migration; PQC solutions must interoperate with existing communications protocols; Critical infrastructure sectors require accelerated deployment of quantum-resistant cryptography; Cryptography management should integrate into DevOps for full visibility during development and production.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Developer, Security Architect, Compliance Officer
- **Implementation Prerequisites**: continuous integration/continuous delivery integration; cryptographic inventory; visibility into cryptography during development and production
- **Relevant PQC Today Features**: Assess, Migrate, Leaders, pqc-risk-management, migration-program
- **Source Document**: Cryptosense_Analyzer.html (108,871 bytes, 5,699 extracted chars)
- **Extraction Timestamp**: 2026-04-13T19:18:55

---

## Tuta Mail

- **Reference ID**: Tuta Mail
- **Title**: Tuta Mail
- **Authors**: Secure Messaging and Communication
- **Publication Date**: 2026-01
- **Last Updated**: 2026-02-13
- **Document Status**: Verified
- **Main Topic**: Tuta Mail launches TutaCrypt, a hybrid post-quantum encryption protocol combining ML-KEM and X25519 to protect emails against quantum threats.
- **PQC Algorithms Covered**: CRYSTALS-Kyber, ML-KEM, Kyber-1024
- **Quantum Threats Addressed**: Harvest Now Decrypt Later; Shor's algorithm; integer factorization problem; discrete logarithm problem
- **Migration Timeline Info**: Enabled by default for all new accounts as of March 2024; gradual roll-out to existing users planned after key rotation mechanism release; key verification added in August 2025
- **Applicable Regions / Bodies**: Germany; United States; German government; US federal agencies (FBI, NSA); Biden administration
- **Leaders Contributions Mentioned**: Sara Spätestens seit den Enthüllungen von Edward Snowden wissen wir, dass quasi alles, was wir online tun überwacht und gespeichert wird. Trotzdem gibt es gute Gründe in der digitalen Welt zu partizipieren. Deshalb arbeite ich an einer verschlüsselten Alternative.; Arne Möhle (CEO of Tuta Mail); Rafael Misoczki (cryptographer)
- **PQC Products Mentioned**: TutaCrypt; Tuta Mail
- **Protocols Covered**: TutaCrypt; ECDH; PQMail protocol
- **Infrastructure Layers**: Key Management; German-based servers; password based key derivation
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: National Cybersecurity Strategy
- **Classical Algorithms Referenced**: AES 128; AES 256; RSA-2048; X25519; ECDH; bcrypt; Argon2; HMAC-SHA-256; HKDF-SHA-256; SHA-256
- **Key Takeaways**: Tuta Mail replaces RSA-2048 with a hybrid protocol combining Kyber and X25519 for asymmetric encryption; Quantum-safe encryption is enabled by default for all new accounts to mitigate Harvest Now Decrypt Later attacks; Existing users will be migrated gradually once key rotation mechanisms are implemented; The protocol uses AES-256 in CBC mode with HMAC-SHA-256 for symmetric encryption and Argon2 for password-based key derivation
- **Security Levels & Parameters**: Kyber-1024; AES 256; RSA-2048; 1 million physical qubits to break 2048-bit RSA in 100 days; 1 billion qubits to break 2048-bit RSA within an hour
- **Hybrid & Transition Approaches**: Hybrid protocol combining CRYSTALS-Kyber and X25519 ECDH; gradual roll-out to existing users; key rotation mechanism in development
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Developer, Compliance Officer, Policy Maker, Researcher
- **Implementation Prerequisites**: Update to the latest version of Tuta apps; German-based servers for private key storage; password derived keys using Argon2
- **Relevant PQC Today Features**: email-signing; hybrid-crypto; threats; migration-program; algorithms
- **Source Document**: Tuta_Mail.html (142,297 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-13T19:20:07

---

## Entrust PKI

- **Reference ID**: Entrust PKI
- **Title**: Entrust PKI
- **Authors**: Public Key Infrastructure (PKI) Software
- **Publication Date**: 2025
- **Last Updated**: 2026-03-25
- **Document Status**: Partially Verified
- **Main Topic**: The document discusses the release of NIST's first post-quantum cryptography standards and outlines the urgent need for organizations to begin migration planning against quantum threats.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA, FN-DSA, CRYSTALS-Kyber, CRYSTALS-Dilithium, FALCON, SPHINCS+
- **Quantum Threats Addressed**: Cryptographically relevant quantum computers (CRQCs), Harvest Now Decrypt Later attacks
- **Migration Timeline Info**: 61% of CISOs plan to migrate within the next five years; 70% in the U.S. plan to migrate within the next five years; migration spans several years
- **Applicable Regions / Bodies**: United States, France, Germany, UK
- **Leaders Contributions Mentioned**: Dustin Moody (NIST mathematician urging immediate action); Samantha Mabey (Director of Digital Security Solutions Marketing at Entrust)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Public Key Infrastructure (PKI), Hardware Security Modules (HSMs), IT infrastructure
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: FIPS 203, FIPS 204, FIPS 205
- **Classical Algorithms Referenced**: RSA, ECC, SHA 1, SHA 2
- **Key Takeaways**: Organizations should not wait for future standards and must begin migration using the three released NIST standards; The transition to PQC is more complex than previous shifts like RSA to ECC or SHA 1 to SHA 2; A full-scale project involving complete cryptographic inventories and mapping to sensitive data is required; Global alignment is expected as France, Germany, and the UK plan to adopt NIST recommendations
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid certificate operations combining classical and post-quantum algorithms
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Policy Maker
- **Implementation Prerequisites**: Complete cryptographic inventories of assets and technology; mapping to sensitive data; developing and executing a post-quantum cryptography migration strategy
- **Relevant PQC Today Features**: Threats, Migrate, Assess, Algorithms, Leaders
- **Source Document**: Entrust_PKI.html (107,958 bytes, 8,635 extracted chars)
- **Extraction Timestamp**: 2026-04-13T19:22:21

---

## Spring Security OAuth2

- **Reference ID**: Spring Security OAuth2
- **Title**: Spring Security OAuth2
- **Authors**: API Security and JWT Libraries
- **Publication Date**: 2026-03
- **Last Updated**: 2026-03-31
- **Document Status**: Verified
- **Main Topic**: The document describes Spring Security as a customizable authentication and access-control framework for Java applications.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Spring Security provides comprehensive support for authentication and authorization; The framework is designed to be easily extended for custom requirements; Protection includes defenses against session fixation, clickjacking, and cross-site request forgery; Integration options include Servlet API and Spring Web MVC; Broadcom owns the Spring projects as of 2026
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer, Security Architect
- **Implementation Prerequisites**: Java applications; Spring Initializr for project bootstrap
- **Relevant PQC Today Features**: None detected
- **Source Document**: Spring_Security_OAuth2.html (405,465 bytes, 3,935 extracted chars)
- **Extraction Timestamp**: 2026-04-13T19:24:02

---

## U-Boot

- **Reference ID**: U-Boot
- **Title**: U-Boot
- **Authors**: Secure Boot and Firmware Security
- **Publication Date**: 2026-01
- **Last Updated**: 2026-03-31
- **Document Status**: Verified
- **Main Topic**: The document provides an overview and navigation index for the U-Boot bootloader documentation, covering user guides, developer resources, API details, and architecture-specific information.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: SHA1
- **Key Takeaways**: The U-Boot documentation is a work in progress integrating scattered documents; contributions to the documentation are welcome via the U-Boot mailing list; the project supports various architectures including ARM64, RISC-V, and x86; Android Verified Boot 2.0 and Chromium OS verified boot are supported features; standard cryptographic support includes TPM devices and SHA1 for authorized sessions
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer, Security Architect
- **Implementation Prerequisites**: GCC or Clang compilers; GitLab CI / U-Boot runner container; Buildman build tool; Device Tree Overlays support
- **Relevant PQC Today Features**: iot-ot-pqc, code-signing, entropy-randomness
- **Source Document**: U-Boot.html (27,743 bytes, 4,370 extracted chars)
- **Extraction Timestamp**: 2026-04-13T19:25:00

---

## Node.js

- **Reference ID**: Node.js
- **Title**: Node.js
- **Authors**: Application Servers
- **Publication Date**: 2025-08
- **Last Updated**: 2026-03-31
- **Document Status**: Verified
- **Main Topic**: Node.js v24.7.0 introduces native support for NIST post-quantum cryptography standards ML-KEM and ML-DSA alongside modern WebCrypto APIs and infrastructure updates.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Zaheet Batada
- **PQC Products Mentioned**: Node.js
- **Protocols Covered**: TLS, HTTP/2
- **Infrastructure Layers**: PKI
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: FIPS 203, FIPS 204
- **Classical Algorithms Referenced**: AES-OCB, ChaCha20-Poly1305, SHA-3, SHAKE, Argon2, scrypt, bcrypt, Brotli
- **Key Takeaways**: Node.js v24.7.0 enables experimentation with quantum-resistant encryption and signatures via the crypto module; WebCrypto API now supports next-gen algorithms including AES-OCB and ML-KEM for browser parity; Single Executable Apps support runtime arguments directly in configuration for flexible binary distribution; Updated root certificates include TrustAsia and SwissSign while removing legacy CAs like GlobalSign and Go Daddy.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer, Security Architect
- **Implementation Prerequisites**: Node.js v24.7.0; crypto module; WebCrypto API (globalThis.crypto.subtle)
- **Relevant PQC Today Features**: Algorithms, Migrate, tls-basics, code-signing, api-security-jwt
- **Source Document**: Node_js.html (131,904 bytes, 4,117 extracted chars)
- **Extraction Timestamp**: 2026-04-13T19:26:07

---

## .NET System.Security.Cryptography

- **Reference ID**: .NET System.Security.Cryptography
- **Title**: .NET System.Security.Cryptography
- **Authors**: Cryptographic Libraries
- **Publication Date**: 2025-11
- **Last Updated**: 2026-02-24
- **Document Status**: Verified
- **Main Topic**: .NET 10 introduces native Post-Quantum Cryptography APIs including ML-KEM, ML-DSA, and SLH-DSA to enable quantum-resistant security in applications.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Anthony Giretti: Specialist in Web technologies and Microsoft .NET with 14 years of experience, twice Microsoft MVP award recipient, certified Microsoft MCSD and Azure Fundamentals
- **PQC Products Mentioned**: .NET 10, MLKem class, MLDsa class, SlhDsa class, CompositeMLDsa class, Windows CNG, OpenSSL 3.5+
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: FIPS 203, FIPS 204, FIPS 205
- **Classical Algorithms Referenced**: RSA, ECDSA, ECDH
- **Key Takeaways**: .NET 10 provides native support for NIST standardized PQC algorithms; ML-DSA is recommended for performance-focused digital signatures while SLH-DSA suits long-term security needs; Hybrid modes combining classical and post-quantum algorithms are advised for transition compatibility; Developers can use familiar .NET patterns to integrate quantum-resistant cryptography immediately
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Composite signatures, hybrid classical + PQC encryption systems
- **Performance & Size Considerations**: ML-DSA offers relatively compact signatures; SLH-DSA produces larger signatures
- **Target Audience**: Developer, Security Architect
- **Implementation Prerequisites**: .NET 10; Windows CNG on Windows; OpenSSL 3.5+ on Linux
- **Relevant PQC Today Features**: Algorithms, hybrid-crypto, code-signing, api-security-jwt
- **Source Document**: \_NET_System_Security_Cryptography.html (67,616 bytes, 4,942 extracted chars)
- **Extraction Timestamp**: 2026-04-13T19:27:22

---

## Ericsson Quantum-Safe 5G

- **Reference ID**: Ericsson Quantum-Safe 5G
- **Title**: Ericsson Quantum-Safe 5G
- **Authors**: 5G & Telecom Security
- **Publication Date**: 2025
- **Last Updated**: 2026-02-24
- **Document Status**: Needs Verification
- **Main Topic**: Ericsson's experimental simulation of hybrid post-quantum cryptography integration in 5G Core registration and deregistration processes.
- **PQC Algorithms Covered**: BIKE, FrodoKEM, ML-DSA, SLH-DSA, Falcon
- **Quantum Threats Addressed**: Cryptographically relevant quantum computer (CRQC)
- **Migration Timeline Info**: PQC introduction in 3GPP releases 20 and/or 21; 6G expected from release 21 to be fully quantum-resistant; CRQC scaling estimated at 25-30 years.
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS, IPsec
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST, IETF, 3GPP
- **Compliance Frameworks Referenced**: FIPS 203, FIPS 204, FIPS 205
- **Classical Algorithms Referenced**: RSA, ECC, AES, SHA-1, ECDSA, SHA-2, EdDSA, secp256r1
- **Key Takeaways**: Hybrid schemes combining conventional and PQC algorithms are being tested for 5G Core; QKD is not considered a viable alternative to PQC due to physical link limitations; Migration to quantum-safe networks is driven by NIST and IETF standards; 3GPP releases 20 and 21 will likely introduce PQC into the 5G era.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid schemes combining conventional and PQC algorithms
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Network Engineer, Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: 5g-security, hybrid-crypto, qkd, Algorithms, Timeline
- **Source Document**: Ericsson_Quantum-Safe_5G.html (296,301 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-13T19:28:34

---

## Qualys Cloud Platform

- **Reference ID**: Qualys Cloud Platform
- **Title**: Qualys Cloud Platform
- **Authors**: Cryptographic Protocol Analyzers
- **Publication Date**: Not specified
- **Last Updated**: 2026-03-31
- **Document Status**: Verified
- **Main Topic**: The document describes the Qualys Enterprise TruRisk Platform as a solution for measuring, communicating, and eliminating cyber risk through vulnerability management and threat intelligence.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Nemi George (VP & CISO); Robert Ayoub (Research Director, Security Products)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations can reduce critical vulnerabilities by 85% using risk-based prioritization; Unified platforms can reduce Mean Time to Remediate (MTTR) by correlating vulnerabilities to patches; TruRisk aggregates risk factors from over 73,000 vulnerability signatures and 25+ threat intel sources; Dynamic dashboards help communicate cyber risk in terms of business value; The platform supports compliance with 100 regulations and frameworks out-of-the-box.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: 85% reduction in critical vulnerabilities; 60% faster remediation; 73,000 vulnerability signatures; 25+ sources of threat intel; 850 out-of-the-box policies; 19,000 controls; 350 technologies; 100 regulations and frameworks.
- **Target Audience**: CISO; Security Architect; Compliance Officer; Operations
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: vendor-risk; compliance-strategy; pqc-risk-management
- **Source Document**: Qualys_Cloud_Platform.html (75,651 bytes, 4,344 extracted chars)
- **Extraction Timestamp**: 2026-04-13T19:30:19

---

## Traefik

- **Reference ID**: Traefik
- **Title**: Traefik
- **Authors**: Application Servers
- **Publication Date**: 2026-01
- **Last Updated**: 2026-03-31
- **Document Status**: Verified
- **Main Topic**: Traefik Proxy v3.3+ and Go 1.24+ enable X25519MLKEM768 by default to provide Post-Quantum Cryptography support for cloud-native application proxies.
- **PQC Algorithms Covered**: ML-KEM
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: Traefik Proxy; Go
- **Protocols Covered**: HTTP; HTTP/2; HTTP/3; TCP; UDP; Websockets; gRPC; TLS; ACME
- **Infrastructure Layers**: PKI; Certificate Management; Kubernetes Ingress; API Gateway
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: X25519
- **Key Takeaways**: Go 1.24+ enables X25519MLKEM768 by default; Traefik v3.3+ inherits PQC capabilities from the Go runtime; Organizations can migrate to PQC-enabled proxies without waiting for future vulnerabilities; Traefik supports automatic certificate generation via ACME providers like Let's Encrypt
- **Security Levels & Parameters**: X25519MLKEM768
- **Hybrid & Transition Approaches**: Hybrid KEM (X25519MLKEM768)
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; Security Architect; DevOps Engineer; Operations
- **Implementation Prerequisites**: Go 1.24+; Traefik v3.3+
- **Relevant PQC Today Features**: Migrate; Algorithms; hybrid-crypto; tls-basics; api-security-jwt
- **Source Document**: Traefik.html (169,137 bytes, 9,063 extracted chars)
- **Extraction Timestamp**: 2026-04-13T19:31:24

---

## Copper.co

- **Reference ID**: Copper.co
- **Title**: Copper.co
- **Authors**: Digital Asset Custody
- **Publication Date**: Not specified
- **Last Updated**: 2026-03-31
- **Document Status**: Verified
- **Main Topic**: The document describes Copper.co as an institutional digital asset custody and settlement platform utilizing MPC technology.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Switzerland
- **Leaders Contributions Mentioned**: Alan Howard (Co-Founder, Brevan Howard); Hany Rashwan (Co-Founder and CEO, 21Shares); Alessandro Balata (Partner, Fasanara)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: MPC custody; settlement network
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Copper provides institutional-grade digital asset custody using MPC technology; ClearLoop enables off-exchange settlement to mitigate counterparty risk; The platform serves hedge funds, trading firms, exchanges, and ETP providers; Security architecture is highlighted as award-winning for safeguarding assets; Services are intended exclusively for institutional investors.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Institutional Investors, Hedge Funds, Trading Firms, Exchanges, ETP Providers, Venture Capital Funds, Miners
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: digital-assets
- **Source Document**: Copper_co.html (104,248 bytes, 3,556 extracted chars)
- **Extraction Timestamp**: 2026-04-13T19:32:38

---

## R3 Corda

- **Reference ID**: R3 Corda
- **Title**: R3 Corda
- **Authors**: Blockchain & DLT Protocols
- **Publication Date**: Not specified
- **Last Updated**: 2026-03-31
- **Document Status**: Verified
- **Main Topic**: The document is a website navigation and footer page for R3 containing links to Corda certification and company resources without substantive technical content.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: The document contains no technical information regarding Post-Quantum Cryptography; No algorithms, threats, or migration strategies are discussed; The text consists solely of website navigation and footer links.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected
- **Source Document**: R3_Corda.html (151,241 bytes, 885 extracted chars)
- **Extraction Timestamp**: 2026-04-13T19:33:32

---

## Keysight CyPerf

- **Reference ID**: Keysight CyPerf
- **Title**: Keysight CyPerf
- **Authors**: Network Testing & Validation Tools
- **Publication Date**: 2025-10-28
- **Last Updated**: 2026-03-30
- **Document Status**: Verified
- **Main Topic**: Keysight CyPerf is a cloud-native network security test platform validating hybrid post-quantum TLS 1.3 handshakes using X25519+ML-KEM-768 across distributed environments.
- **PQC Algorithms Covered**: ML-KEM-768
- **Quantum Threats Addressed**: Harvest now, decrypt later; cryptographically relevant quantum computers (CRQCs)
- **Migration Timeline Info**: Experts estimate 15–20 years before cryptographically relevant quantum computers are available
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: Keysight CyPerf; BreakingPoint System; ATI-2025-15; Embedded Security Testbench
- **Protocols Covered**: TLS 1.3
- **Infrastructure Layers**: Cloud environments; physical environments; embedded systems; IoT devices; secure elements; cryptographic modules
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: Common Criteria; EUCC
- **Classical Algorithms Referenced**: X25519; RSA; ECC
- **Key Takeaways**: Organizations must validate PQC implementations early to avoid costly hardware replacement later; Hybrid key exchange simulation is supported for security appliance testing; Side-channel and fault injection testing are critical for PQC implementation security on resource-constrained hardware; Long-lived systems in government and critical infrastructure face immediate "harvest now, decrypt later" risks
- **Security Levels & Parameters**: ML-KEM-768
- **Hybrid & Transition Approaches**: Hybrid key exchange simulation; hybrid post-quantum TLS 1.3 handshakes; X25519+ML-KEM-768
- **Performance & Size Considerations**: Stateful traffic generation at 1 Gbps; 10 Gbps; 100 Gbps; 400 Gbps
- **Target Audience**: Security Architect; Developer; Compliance Officer; Researcher
- **Implementation Prerequisites**: Cloud-native network security test platform; BreakingPoint System integration via ATI-2025-15 application; Embedded Security Testbench setup
- **Relevant PQC Today Features**: hybrid-crypto; tls-basics; iot-ot-pqc; compliance-strategy; pqc-risk-management
- **Source Document**: Keysight_CyPerf.html (612,012 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-13T19:34:12

---

## Keysight Inspector

- **Reference ID**: Keysight Inspector
- **Title**: Keysight Inspector
- **Authors**: Network Testing & Validation Tools
- **Publication Date**: 2025-01-01
- **Last Updated**: 2026-03-30
- **Document Status**: Verified
- **Main Topic**: Keysight Inspector is a device security testing platform expanded with capabilities to test post-quantum cryptography implementations against hardware-based side-channel and fault injection attacks.
- **PQC Algorithms Covered**: Dilithium, ML-DSA, ML-KEM, SLH-DSA
- **Quantum Threats Addressed**: Harvest Now Decrypt Later; hardware-based attack methods threatening PQC implementations
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; NIST
- **Leaders Contributions Mentioned**: Dr Axel Poschmann (Vice President of Product at PQShield); Marc Witteman (Director of the Device Security Research Lab at Keysight)
- **PQC Products Mentioned**: Keysight Inspector; Crypto 3 modular framework; Dilithium TVLA data generator; Known Key Analysis module; DS1050A testbench
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA, ECC
- **Key Takeaways**: New PQC algorithms require verification against hardware-based side-channel and fault injection attacks; Keysight Inspector enables pre-silicon and post-silicon analysis of PQC implementations; Collaboration with vendors like PQShield validates countermeasures for ML-DSA; Existing encryption technologies like RSA and ECC are vulnerable to quantum computing acceleration
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Captures millions of power traces per second
- **Target Audience**: Security Architect, Developer, Compliance Officer, Researcher
- **Implementation Prerequisites**: PXI-based DS1050A testbench; Crypto 3 modular framework
- **Relevant PQC Today Features**: Threats, Algorithms, Assess, Leaders, vendor-risk
- **Source Document**: Keysight_Inspector.html (551,264 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-13T19:35:46

---

## Entrust Identity as a Service (IDaaS)

- **Reference ID**: Entrust Identity as a Service (IDaaS)
- **Title**: Entrust Identity as a Service (IDaaS)
- **Authors**: Identity & Access Management (IAM)
- **Publication Date**: 2025
- **Last Updated**: 2026-03-31
- **Document Status**: Verified
- **Main Topic**: The document describes Entrust Identity as a Service (IDaaS), a cloud-based identity and access management platform featuring passwordless authentication, adaptive risk-based controls, and AI-driven biometric verification.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: SAML, OpenID Connect, OAuth 2.0, FIDO2, LDAP, SCIM
- **Infrastructure Layers**: Public Key Infrastructure (PKI), Hardware Security Modules (HSMs), Cloud-based platform
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: PSD2, Zero Trust
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations can reduce credential-based attacks by implementing phishing-resistant passwordless access; Adaptive risk-based authentication dynamically adjusts security requirements based on real-time risk; AI-powered biometric verification helps counter deepfakes and secure digital onboarding; Storing biometric data locally on user devices minimizes data breach risks compared to cloud storage.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, IT Manager, Compliance Officer
- **Implementation Prerequisites**: Low-code/no-code deployment options; Integration with Microsoft Active Directory and Azure Active Directory; Support for SAML applications like Office 365, Salesforce (SDFC), and WebEx.
- **Relevant PQC Today Features**: digital-id, tls-basics, pki-workshop, hsm-pqc, api-security-jwt
- **Source Document**: Entrust*Identity_as_a_Service\_\_IDaaS*.html (218,642 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-13T19:37:10

---

## Entrust Cryptographic Platform

- **Reference ID**: Entrust Cryptographic Platform
- **Title**: Entrust Cryptographic Platform
- **Authors**: PKI & Certificate Lifecycle
- **Publication Date**: Not specified
- **Last Updated**: 2026-03-31
- **Document Status**: Verified
- **Main Topic**: Entrust's Cryptographic Platform provides a full-stack solution for enterprise post-quantum readiness through crypto-agile PKI, HSMs, and governance tools.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Harvest now, decrypt later; quantum computers breaking today's standards
- **Migration Timeline Info**: Expansion announced in February 2026; 2026 PQC Trends report referenced
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: Entrust Cryptographic Platform; nShield HSMs; Entrust nShield Post-Quantum Option Pack; Entrust Cryptographic Security Platform
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Public Key Infrastructure (PKI); Hardware Security Modules (HSMs); Keys, Secrets, and Certificates Management; Cryptographic Security Platform
- **Standardization Bodies**: NIST; IETF
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA; ECC
- **Key Takeaways**: Organizations should inventory at-risk cryptographic assets to prioritize PQC transitions; Hybrid approaches combining traditional and PQC algorithms maintain backward compatibility during migration; Composite certificates allow single-certificate implementation of hybrid methods; Crypto-agility enables adaptation to evolving standards and threats without disruption; Early preparation mitigates harvest now, decrypt later risks for long-lived data
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid approach combining today's algorithms with PQC; composite certificates; multi-key algorithms; crypto-agile solutions
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO; Security Architect; Compliance Officer; Policy Maker; Operations
- **Implementation Prerequisites**: Cryptographic inventory; PQ readiness assessments; access to Entrust experts; adoption of NIST standardized PQC algorithms
- **Relevant PQC Today Features**: Assess; Migrate; hybrid-crypto; crypto-agility; hsm-pqc; pki-workshop; pqc-governance; pqc-business-case
- **Source Document**: Entrust_Cryptographic_Platform.html (200,429 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-13T19:38:33

---

## ANKATech ANKASecure

- **Reference ID**: ANKATech ANKASecure
- **Title**: ANKATech ANKASecure
- **Authors**: API Security and JWT Libraries
- **Publication Date**: Not specified
- **Last Updated**: 2026-03-31
- **Document Status**: Pending Verification
- **Main Topic**: ANKASecure is a quantum-resistant encryption platform offering certified post-quantum algorithms and crypto-agility for enterprise data protection.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA, Falcon, LMS, XMSS, FrodoKEM, HQC
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: PQC 2025 Conference scheduled for October 28–30, 2025
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: ANKASecure
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management, Cloud, Hybrid environments
- **Standardization Bodies**: NIST, ETSI, PKI Consortium
- **Compliance Frameworks Referenced**: CNSA 2.0, International Standards
- **Classical Algorithms Referenced**: RSA, ECC
- **Key Takeaways**: ANKASecure enables migration from classical encryption (RSA, ECC) without exposing sensitive information; The platform supports flexible deployment via CLI, API, and SaaS; Organizations can maintain cryptographic sovereignty with full key control; Immediate transition to quantum-safe solutions is essential as traditional encryption becomes obsolete; ANKATech is actively shaping the next era of data protection through conference sponsorship.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Crypto-agility, Secure re-encryption for quantum-safe migration
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Developer, Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms, Migrate, crypto-agility, compliance-strategy, api-security-jwt
- **Source Document**: ANKATech_ANKASecure.html (215,789 bytes, 5,092 extracted chars)
- **Extraction Timestamp**: 2026-04-13T19:40:02

---

## Spherity CARO Pharma PQC

- **Reference ID**: Spherity CARO Pharma PQC
- **Title**: Spherity CARO Pharma PQC
- **Authors**: Secrets & Data Governance
- **Publication Date**: 2025
- **Last Updated**: 2026-04-01
- **Document Status**: Verified
- **Main Topic**: The document outlines quantum computing threats to critical infrastructure and decentralized networks, advocating for immediate Post-Quantum Cryptography adoption via Spherity's European Business Wallet solutions.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Harvest Now Decrypt Later; Quantum-enabled sabotage; Digital signature forgery; Shor's algorithm; Grover's algorithm
- **Migration Timeline Info**: EU and UK target full quantum-resilience for critical systems by 2030–2035
- **Applicable Regions / Bodies**: Regions: Germany, United Kingdom, Europe; Bodies: European Commission, German Federal Office for Information Security (BSI)
- **Leaders Contributions Mentioned**: Carsten Stöcker: Author and strategic insights on HNDL operations; Dr. Carsten Stöcker: Strategic Insights on HNDL Operations
- **PQC Products Mentioned**: Spherity European Business Wallet (EUBW); Apple PQ3 protocol
- **Protocols Covered**: TLS; iMessage; X.509 (implied via certificates context but not explicitly named as protocol version); None detected for specific versions like TLS 1.3
- **Infrastructure Layers**: PKI; Virtual Private Networks (VPNs); Industrial SCADA systems; Decentralized identity; European Business Wallet (EUBW)
- **Standardization Bodies**: NIST; European Commission
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA; ECC; SHA-256; SHA-3; SHA-384; AES-128; AES-256; DES; DSA; ECDSA; Diffie–Hellman
- **Key Takeaways**: Transitioning to PQC is crucial now due to harvest now decrypt later threats; Symmetric encryption requires doubling key sizes (e.g., AES-256) for quantum resistance; Public-key algorithms like RSA and ECC are obsolete against Shor's algorithm; Critical infrastructure must adopt Zero Trust Architectures combined with PQC; Decentralized networks like Bitcoin and Ethereum are developing quantum-resistance strategies
- **Security Levels & Parameters**: 256-bit hash effective strength reduced to 128-bit under Grover; AES-128 effectively 64-bit under quantum attack; AES-256 provides post-quantum strength equivalent to 128-bit security
- **Hybrid & Transition Approaches**: Crypto agility; Zero Trust Architectures combined with PQC
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO; Security Architect; Policy Maker; Researcher; Operations
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats, digital-id, migration-program, pqc-risk-management, crypto-agility
- **Source Document**: Spherity_CARO_Pharma_PQC.html (380,550 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-13T19:41:07

---

## Turkcell Nokia Quantum-Safe IPsec

- **Reference ID**: Turkcell Nokia Quantum-Safe IPsec
- **Title**: Turkcell Nokia Quantum-Safe IPsec
- **Authors**: Telecom PQC
- **Publication Date**: 2025
- **Last Updated**: 2026-04-01
- **Document Status**: Verified
- **Main Topic**: Nokia and Turkcell demonstrated a quantum-safe IPsec integration for mobile transport networks in Turkey.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: evolving quantum threats; future threats from quantum computing
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Turkey; Bodies: None detected
- **Leaders Contributions Mentioned**: Prof Dr Vehbi Çağrı Güngör, Turkcell Chief Network Technologies Officer; Rafael De Fermin, Senior Vice President of Network Infrastructure Europe, Nokia
- **PQC Products Mentioned**: Nokia IPsec Security Gateway; Quantum Bridge DSKE technology; Juniper Networks SRX firewalls
- **Protocols Covered**: IPsec
- **Infrastructure Layers**: mobile transport network; network infrastructure
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Turkcell and Nokia achieved a world-first demonstration of quantum-safe IPsec for mobile subscribers; The integration secures critical data against evolving quantum threats in the transport network; The initiative represents a proactive defense-in-depth crypto-resilient approach to future security challenges; Eurofiber is partnering with Quantum Bridge and Juniper Networks to integrate post-quantum cryptography into its infrastructure
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, CISO, Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: 5g-security; vpn-ssh-pqc; Leaders; Threats; Migrate
- **Source Document**: Turkcell_Nokia_Quantum-Safe_IPsec.html (412,399 bytes, 8,309 extracted chars)
- **Extraction Timestamp**: 2026-04-13T19:42:56

---
