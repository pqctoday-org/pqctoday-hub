## Oracle Key Vault

- **Reference ID**: Oracle Key Vault
- **Title**: Oracle Key Vault
- **Authors**: Key Management Systems (KMS)
- **Publication Date**: 2025-12-19
- **Last Updated**: 2026-02-16
- **Document Status**: Verified
- **Main Topic**: Oracle Key Vault provides centralized key management for encryption keys, SSH keys, and digital certificates across multi-cloud and on-premises environments without native PQC features in version 21.13.
- **PQC Algorithms Covered**: ML-KEM; ML-DSA
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Peter Wahl, Sr. Principal Product Manager, Database Encryption and Key Management, Database Security, Oracle
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: SSH; KMIP
- **Infrastructure Layers**: Key Management; HSM; Cloud KMS
- **Standardization Bodies**: OASIS
- **Compliance Frameworks Referenced**: FIPS 140-2; PCI DSS
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Oracle Key Vault v21.13 lacks native PQC features with PQC efforts focused on database TLS and JDK levels; Centralized key management supports multi-cloud deployment across OCI, Azure, AWS, and Google Cloud; SSH private keys can be stored as non-extractable to mitigate credential theft risks; Integration with HSMs provides FIPS 140-2 certified hardware-anchored root-of-trust.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Supports up to sixteen read/write nodes for high availability
- **Target Audience**: Security Architect; Developer; Compliance Officer; Operations
- **Implementation Prerequisites**: Oracle Database 19c or later for TDE migration; C and Java APIs for custom application integration; Hardware Security Modules (HSMs) for FIPS 140-2 certification
- **Relevant PQC Today Features**: kms-pqc, hsm-pqc, compliance-strategy, migration-program
- **Source Document**: Oracle_Key_Vault.html (53,682 bytes, 7,707 extracted chars)
- **Extraction Timestamp**: 2026-04-13T22:52:12

---

## GlobalSign Digital Signing Service

- **Reference ID**: GlobalSign Digital Signing Service
- **Title**: GlobalSign Digital Signing Service
- **Authors**: Digital Signature Software
- **Publication Date**: 2025
- **Last Updated**: 2026-03-31
- **Document Status**: Verified
- **Main Topic**: GlobalSign outlines its commitment to Post-Quantum Cryptography (PQC) research and details the structural changes required for Root, Intermediate, and Leaf certificates using algorithms like Dilithium and Kyber.
- **PQC Algorithms Covered**: dilithium3, ML-DSA-65, Kyber, Dilithium2
- **Quantum Threats Addressed**: Vulnerability of traditional encryption methods to quantum computers; malicious parties falsely proving certificate revocation or erasing revocation status
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Max Planck, Albert Einstein, Niels Bohr
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS, x509, S/MIME, ACME
- **Infrastructure Layers**: PKI, Certificate Authority, Root CA, Intermediate CA, Leaf/End Entity Certificates
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: FIPS 203
- **Classical Algorithms Referenced**: RSA, ECC
- **Key Takeaways**: Organizations must inventory certificates and keys to improve crypto-agility; Root and Intermediate CAs may use dilithium3 while Leaf certificates require PQ-Safe key types like Dilithium2; Revocation mechanisms (OCSP/CRL) must be updated to PQ-safe to prevent malicious manipulation; Full TLS handshake security requires updating both digital signature and Key Exchange algorithms
- **Security Levels & Parameters**: dilithium3, ML-DSA-65, Dilithium2
- **Hybrid & Transition Approaches**: crypto-agility
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Compliance Officer, CISO
- **Implementation Prerequisites**: Inventory of certificates and keys; identification of vulnerabilities; plan to replace vulnerable certificates and keys; up-to-date ownership information; automation of management
- **Relevant PQC Today Features**: Algorithms, crypto-agility, pki-workshop, tls-basics, migration-program
- **Source Document**: GlobalSign_Digital_Signing_Service.html (95,756 bytes, 11,155 extracted chars)
- **Extraction Timestamp**: 2026-04-13T22:53:38

---

## Venafi TLS Protect

- **Reference ID**: Venafi TLS Protect
- **Title**: Venafi TLS Protect
- **Authors**: Certificate Lifecycle Management
- **Publication Date**: 2025
- **Last Updated**: 2026-03-31
- **Document Status**: Verified
- **Main Topic**: The document describes CyberArk's identity security platform and machine identity management solutions, with a brief mention of quantum computing as an emerging challenge.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Michael Flanders, Senior Cybersecurity Engineer with Southwest Airlines; Santosh Prusty, Senior Leader, Enterprise Security Team, Cisco; Jan Thielmann, IT Security Specialist, DZ BANK AG
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: SSH
- **Infrastructure Layers**: PKI, Certificate Management, Secrets Management, Kubernetes, Cloud
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations face a mass proliferation of machine identities due to AI and cloud adoption; Comprehensive observability is required to maintain visibility of machine identities; Automation reduces risk from manual processes in identity management; Future readiness requires preparation for emerging challenges including quantum computing; Full protection must cover secrets, certificates, workload identities, and SSH keys.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, CISO, Developer, Operations
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: quantum-threats, pki-workshop, code-signing, api-security-jwt, digital-id
- **Source Document**: Venafi_TLS_Protect.html (248,329 bytes, 7,317 extracted chars)
- **Extraction Timestamp**: 2026-04-13T22:58:26

---

## IBM Security Guardium Data Protection

- **Reference ID**: IBM Security Guardium Data Protection
- **Title**: IBM Security Guardium Data Protection
- **Authors**: Data Security & Protection
- **Publication Date**: 2025
- **Last Updated**: 2026-03-31
- **Document Status**: Verified
- **Main Topic**: IBM Guardium Data Protection is a solution for securing enterprise data, simplifying compliance, and managing vulnerabilities across hybrid cloud infrastructure.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: PCI DSS, GDPR, CPRA, SOX
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations can achieve continuous compliance with ready-to-use templates and customizable policies; Real-time monitoring enables faster threat detection for SQL injection and data leakage; Long-term audit data retention reduces operational overhead while supporting compliance requirements; AI-powered views improve SOC team efficacy in detecting advanced attack vectors.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: 406% ROI over 3 years; 70% reduction in time spent on auditing; 25% of data security analysts' time saved
- **Target Audience**: CISO, Security Architect, Compliance Officer, Operations
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: compliance-strategy, data-asset-sensitivity
- **Source Document**: IBM_Security_Guardium_Data_Protection.html (226,076 bytes, 6,370 extracted chars)
- **Extraction Timestamp**: 2026-04-13T22:59:27

---

## Thales Luna T-Series HSM

- **Reference ID**: Thales Luna T-Series HSM
- **Title**: Thales Luna T-Series HSM
- **Authors**: Hardware Security Module (HSM) Software
- **Publication Date**: 2025
- **Last Updated**: 2026-03-30
- **Document Status**: Verified
- **Main Topic**: Thales Luna HSM firmware v7.9 delivers production-ready, NIST-approved post-quantum cryptography including ML-KEM and ML-DSA to address Harvest-Now, Decrypt-Later threats.
- **PQC Algorithms Covered**: ML-KEM; ML-DSA
- **Quantum Threats Addressed**: Harvest-Now, Decrypt-Later (HNDL) attacks
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Blair Canavan | Director, Alliances – PQC Portfolio, Thales
- **PQC Products Mentioned**: Luna HSM; Luna HSM v7.9
- **Protocols Covered**: TLS/SSL
- **Infrastructure Layers**: Hardware Security Modules (HSM); PKI; Key Management; Database Encryption; IoT
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: FIPS 203; FIPS 204; FIPS 140-3 Level 3
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations must start planning today to be post-quantum ready due to emerging HNDL risks; Luna HSM v7.9 offers native support for ML-KEM and ML-DSA eliminating external modules; Hybrid PQC encryption is available for secure key synchronization, backup, and restore; The solution provides production-ready capabilities with FIPS 140-3 Level 3 validation in progress
- **Security Levels & Parameters**: FIPS 140-3 Level 3 (validation in progress)
- **Hybrid & Transition Approaches**: Hybrid PQC encryption for secure key synchronization, backup, and restore
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; CISO; Compliance Officer
- **Implementation Prerequisites**: Luna HSM firmware v7.9; Thales PKI Technology Partners ecosystem validation
- **Relevant PQC Today Features**: hsm-pqc, hybrid-crypto, tls-basics, code-signing, iot-ot-pqc
- **Source Document**: Thales_Luna_T-Series_HSM.html (123,713 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-13T23:00:25

---

## Oracle AI Database 26ai

- **Reference ID**: Oracle AI Database 26ai
- **Title**: Oracle AI Database 26ai
- **Authors**: Database Encryption Software
- **Publication Date**: 2026-01
- **Last Updated**: 2026-03-31
- **Document Status**: Pending Verification
- **Main Topic**: Oracle AI Database 26ai introduces quantum-resistant TLS 1.3 via hybrid ML-KEM and ML-DSA certificate support powered by the Oracle OpenSSL FIPS Provider.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Hasan Rizvi (Executive Vice President, Oracle Database Engineering); Steve McDowell (Principal Analyst and Founding Partner, NAND Research); Ron Westfall (Vice President and Practice Leader, HyperFRAME Research); Alexei Balaganski (Lead Analyst and CTO, KuppingerCole Analysts); Steve Nouri (CEO, GenAI.Works)
- **PQC Products Mentioned**: Oracle AI Database 26ai, Oracle OpenSSL FIPS Provider
- **Protocols Covered**: TLS 1.3
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: ACVP A7758, FIPS
- **Classical Algorithms Referenced**: ECDHE
- **Key Takeaways**: Oracle AI Database 26ai supports hybrid quantum-resistant TLS 1.3 using ML-KEM and classical ECDHE; ML-DSA is supported for database certificate authentication requiring JDK 24+; PQC capabilities are delivered via the Oracle OpenSSL FIPS Provider validated under ACVP A7758; The solution unifies AI workloads with stock exchange-grade security across cloud, hybrid, and on-premises environments.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid ECDHE + ML-KEM key exchange
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer, Security Architect, CISO
- **Implementation Prerequisites**: JDK 24+; Oracle OpenSSL FIPS Provider
- **Relevant PQC Today Features**: Algorithms, hybrid-crypto, tls-basics, compliance-strategy
- **Source Document**: Oracle_AI_Database_26ai.html (69,849 bytes, 10,958 extracted chars)
- **Extraction Timestamp**: 2026-04-13T23:01:54

---

## Infineon OPTIGA TPM SLB 9672

- **Reference ID**: Infineon OPTIGA TPM SLB 9672
- **Title**: Infineon OPTIGA TPM SLB 9672
- **Authors**: Hardware Security and Semiconductors
- **Publication Date**: Not specified
- **Last Updated**: 2026-03-31
- **Document Status**: Verified
- **Main Topic**: The document describes the Infineon OPTIGA TPM SLB 9672 as the world's first Trusted Platform Module with PQC-protected firmware using XMSS signatures since 2022.
- **PQC Algorithms Covered**: XMSS
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Since 2022
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: OPTIGA TPM SLB 9672
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Infineon released the world's first TPM with PQC-protected firmware; The OPTIGA TPM SLB 9672 utilizes XMSS signatures for protection; The product has been available since 2022; The solution targets embedded security applications.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Developer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: stateful-signatures, iot-ot-pqc, hsm-pqc
- **Source Document**: Infineon_OPTIGA_TPM_SLB_9672.html (1,505,291 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-13T23:03:15

---

## Palo Alto GlobalProtect

- **Reference ID**: Palo Alto GlobalProtect
- **Title**: Palo Alto GlobalProtect
- **Authors**: VPN and IPsec Software
- **Publication Date**: 2024-09
- **Last Updated**: 2026-03-31
- **Document Status**: Verified
- **Main Topic**: Introduction of Palo Alto Networks Quantum-Safe Security solution to enable continuous cryptographic discovery, risk assessment, and remediation for post-quantum migration.
- **PQC Algorithms Covered**: ML-KEM
- **Quantum Threats Addressed**: Shor's algorithm; Harvest now, decrypt later (HNDL); Trust Now, Forge Later
- **Migration Timeline Info**: Generally available January 30, 2026; additional integration enhancements planned for April 2026
- **Applicable Regions / Bodies**: United States
- **Leaders Contributions Mentioned**: Rich Campagna; Richu Channakeshava
- **PQC Products Mentioned**: Palo Alto Networks Quantum-Safe Security; PAN-OS NGFW; Prisma Access
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Cryptographic Bill of Materials (CBOM); SIEM; load balancers; endpoint detection and response (EDR); Application Vulnerability Management (AVM) tools; configuration management database (CMDB); asset management platforms; network clouds; log platforms
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: US Commercial National Security Algorithm Suite 2.0; FIPS 140-3; DORA
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Enterprises must move beyond manual audits to continuous cryptographic discovery via a Cryptographic Bill of Materials (CBOM); Legacy systems unable to be upgraded can achieve quantum safety through Cipher Translation Proxy reencryption at the network edge; Risk prioritization should correlate cryptographic strength with business criticality and data shelf-life to address Harvest Now, Decrypt Later threats; Organizations need automated drift detection to prevent the introduction of weak or noncompliant ciphers in real-time
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid-PQC algorithms; Cipher Translation Proxy for legacy systems; Quantum Ready state transition; agentic remediation
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO; Security Architect; Compliance Officer; Operations
- **Implementation Prerequisites**: Integration with existing SIEM, load balancers, EDR, and AVM tools; synchronization with CMDB and asset management platforms; hardware and OS capabilities to support post-quantum algorithms
- **Relevant PQC Today Features**: Assess; Migrate; Threats; Compliance; pqc-governance; iot-ot-pqc
- **Source Document**: Palo_Alto_GlobalProtect.html (865,585 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-13T23:04:41

---

## Qrypt BLAST SDK

- **Reference ID**: Qrypt BLAST SDK
- **Title**: Qrypt BLAST SDK
- **Authors**: Quantum Random Number Generator (QRNG)
- **Publication Date**: 2025
- **Last Updated**: 2026-03-31
- **Document Status**: Verified
- **Main Topic**: Qrypt BLAST SDK provides a REST API and software development kit implementing the BLAST algorithm to generate identical symmetric encryption keys at multiple endpoints without network transmission.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Harvest now, decrypt later (HNDL)
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States
- **Leaders Contributions Mentioned**: Prof. Yevgeniy Dodis, NYU
- **PQC Products Mentioned**: Qrypt BLAST SDK; Quantum Entropy-as-a-Service; Quantum Entropy Appliance; Quantum-Secure IPsec Gateway; Digital Quantum Key Distribution; Q-Isolate
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Cloud API; on-premises; container; SDK
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: AES
- **Key Takeaways**: Eliminate key transmission to remove the risk of harvest now, decrypt later even with NIST Post-Quantum Cryptography; Generate identical keys at multiple endpoints without transmitting them over the network; Deploy quantum-secure encryption via container or SDK with 4-lines of code; Use high-output quantum random number generators sourced from ICFO, Los Alamos National Lab, Oak Ridge National Lab, and EPFL
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: 4-lines of code to start; High-output quantum random number generator
- **Target Audience**: Developer; Security Architect; CISO; Operations
- **Implementation Prerequisites**: Drop in a container or SDK; No dedicated hardware requirements
- **Relevant PQC Today Features**: None detected
- **Source Document**: Qrypt_BLAST_SDK.html (206,394 bytes, 4,386 extracted chars)
- **Extraction Timestamp**: 2026-04-13T23:06:58

---

## PQShield Core

- **Reference ID**: PQShield Core
- **Title**: PQShield Core
- **Authors**: Cryptographic SDKs & Libraries
- **Publication Date**: Not specified
- **Last Updated**: 2026-03-31
- **Document Status**: Verified
- **Main Topic**: PQShield provides NIST-standardized post-quantum and hybrid cryptographic software and hardware solutions to protect against quantum threats.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Harvest Now Decrypt Later; quantum computers breaking current cryptography methods
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United Kingdom; NCSC; NIST; CRYPTREC
- **Leaders Contributions Mentioned**: Carolina Polito: Operationalizing Quantum Readiness
- **PQC Products Mentioned**: PQMicroLib-Core; PQCryptoLib-Core; PQCryptoLib-SDK; PQPlatform-CoPro; PQPlatform-TrustSys; PQPerform-Flare; PQPerform-Inferno; PQPerform-Flex
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Cloud; chips; embedded systems; security coprocessor; Root-of-Trust system
- **Standardization Bodies**: NIST; CRYPTREC
- **Compliance Frameworks Referenced**: FIPS; NCSC Assured
- **Classical Algorithms Referenced**: Elliptic Curves; OpenSSL
- **Key Takeaways**: Organizations must modernize cryptography to align with new NIST global standards; PQShield offers solutions for memory-constrained embedded systems as small as 5KB RAM; Hybrid solutions are available to protect against Harvest Now Decrypt Later attacks; Evaluation of existing infrastructure risk is critical before deployment.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: PQ/T Hybrid solutions; crypto-agility; smooth transition to quantum resistance
- **Performance & Size Considerations**: 5KB RAM for embedded devices
- **Target Audience**: Security Architect; Developer; CISO; Compliance Officer; Operations; Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats, Compliance, Migrate, Assess, Algorithms, crypto-agility, iot-ot-pqc
- **Source Document**: PQShield_Core.html (146,406 bytes, 7,102 extracted chars)
- **Extraction Timestamp**: 2026-04-13T23:08:03

---

## CryptoNext COMPASS Probe

- **Reference ID**: CryptoNext COMPASS Probe
- **Title**: CryptoNext COMPASS Probe
- **Authors**: Security Testing & Discovery
- **Publication Date**: Not specified
- **Last Updated**: 2026-03-31
- **Document Status**: Verified
- **Main Topic**: The document introduces CryptoNext COMPASS Discovery and Network Probe as tools for cryptographic asset inventory, analysis, and post-quantum transition preparation.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: European Commission recommends completing full cryptographic asset inventory by end of 2026
- **Applicable Regions / Bodies**: Regions: European Union; Bodies: European Commission
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: CryptoNext COMPASS Discovery; CryptoNext COMPASS Analytics; CryptoNext COMPASS Network Probe; PQC Evaluation Toolbox; Post-Quantum Remediation SDK; CryptoNext Captain
- **Protocols Covered**: TLS 1.3; SSH; ISAKMP
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: CBOM; NIST CAVP
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations must complete a full inventory of cryptographic assets by end of 2026 per European Commission recommendations; Creating a Cryptographic Bill of Materials (CBOM) is a no-regret move for risk management; Migrating to post-quantum cryptography requires a comprehensive mapping phase to eliminate blind spots; Continuous auditing and monitoring are essential to maintain compliance with evolving standards
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Crypto-agility; centralized approach for post-quantum transition
- **Performance & Size Considerations**: Real-time analysis up to 1 Gbps; soon extendable to 10 Gbps
- **Target Audience**: Security Architect; Compliance Officer; CISO; Operations
- **Implementation Prerequisites**: TAP installation for passive probe deployment; standard APIs and formats for integration; CBOM format adoption
- **Relevant PQC Today Features**: Assess; Migrate; crypto-agility; compliance-strategy; migration-program
- **Source Document**: CryptoNext_COMPASS_Probe.html (133,193 bytes, 9,469 extracted chars)
- **Extraction Timestamp**: 2026-04-13T23:09:14

---

## Microsoft RDS

- **Reference ID**: Microsoft RDS
- **Title**: Microsoft RDS
- **Authors**: Remote Access and VDI Software
- **Publication Date**: Not specified
- **Last Updated**: 2026-03-31
- **Document Status**: Verified
- **Main Topic**: Microsoft announces the general availability of ML-KEM and ML-DSA algorithms in Windows Server 2025, Windows 11, and .NET 10 as part of its Quantum Safe Program.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA
- **Quantum Threats Addressed**: harvest now, decrypt later; quantum-based attacks
- **Migration Timeline Info**: PQC in Active Directory Certificate Services targeted for early 2026; PQC algorithms generally available November 2025
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: AabhaThipsay
- **PQC Products Mentioned**: Windows Server 2025, Windows 11, .NET 10, Cryptography API: Next Generation (CNG), SymCrypt
- **Protocols Covered**: TLS
- **Infrastructure Layers**: PKI, Certificate functions, Active Directory Certificate Services (ADCS)
- **Standardization Bodies**: IETF
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA, ECDHE
- **Key Takeaways**: PQC algorithms ML-KEM and ML-DSA are now generally available in Windows Server 2025, Windows 11, and .NET 10; Organizations should adopt crypto agility to adapt as standards evolve; Hybrid or composite modes combining PQC with traditional algorithms like RSA or ECDHE are recommended for transition; PQC support for TLS is proceeding in alignment with IETF standards; ADCS PQC capabilities are targeted for early 2026
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: hybrid or composite modes, crypto agility, maintaining compatibility with existing standards
- **Performance & Size Considerations**: PQC algorithms may require increased computational resources; ongoing optimization and hardware acceleration necessary
- **Target Audience**: Developer, IT administrator, Security professional, Security Architect
- **Implementation Prerequisites**: Windows Server 2025; Windows 11 clients (24H2, 25H2); .NET 10; updates to Cryptography API: Next Generation (CNG) libraries
- **Relevant PQC Today Features**: Algorithms, hybrid-crypto, crypto-agility, tls-basics, pki-workshop
- **Source Document**: Microsoft_RDS.html (410,652 bytes, 9,187 extracted chars)
- **Extraction Timestamp**: 2026-04-13T23:10:30

---

## Google Cloud CDN

- **Reference ID**: Google Cloud CDN
- **Title**: Google Cloud CDN
- **Authors**: Web & Application Security
- **Publication Date**: Not specified
- **Last Updated**: 2026-03-31
- **Document Status**: Verified
- **Main Topic**: Google Cloud's strategic commitment and technical roadmap for migrating to post-quantum cryptography by 2029, including hybrid KEM implementations in Cloud KMS.
- **PQC Algorithms Covered**: ML-KEM
- **Quantum Threats Addressed**: Attacks by future quantum computers; Shor's algorithm implications for 2048-bit RSA keys
- **Migration Timeline Info**: Google has set 2029 as the deadline for PQC migration; Cloud KMS added X-Wing in preview (Oct 2025); internal communications rolled out PQC in 2022
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: BoringSSL; Tink; OpenSK; Cloud KMS
- **Protocols Covered**: TLS; HTTPS; FIDO2
- **Infrastructure Layers**: Cloud KMS; Key Management; PKI; Trust anchor agility
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: X25519; RSA
- **Key Takeaways**: Google has set 2029 as the deadline for PQC migration to secure the quantum era; Hybrid deployments combining PQC and classic cryptography are key to secure migration; Robust key management and key rotation are essential for cryptographic agility; Chrome is implementing ML-KEM in BoringSSL to enable quantum-safe HTTPS
- **Security Levels & Parameters**: ML-KEM-768; 2048-bit RSA
- **Hybrid & Transition Approaches**: X-Wing (X25519+ML-KEM-768); hybrid deployments of PQC and classic cryptography; trust anchor agility; cryptographic agility
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Developer, Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline, Threats, Algorithms, hybrid-crypto, crypto-agility, tls-basics, kms-pqc
- **Source Document**: Google_Cloud_CDN.html (1,931,395 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-13T23:12:37

---

## Checkmarx One

- **Reference ID**: Checkmarx One
- **Title**: Checkmarx One
- **Authors**: Supply Chain & DevSecOps
- **Publication Date**: Not specified
- **Last Updated**: 2026-03-31
- **Document Status**: Verified
- **Main Topic**: The document describes Checkmarx One as an enterprise-grade unified Agentic AppSec platform designed to secure human-written, AI-generated, and legacy code across the SDLC and ADLC.
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
- **Key Takeaways**: Checkmarx One unifies application security posture management across human-written, AI-generated, and legacy code; The platform integrates agentic AI directly into IDEs and CI/CD pipelines for real-time vulnerability detection and remediation; Organizations can reduce noise by 80% and vulnerabilities by 90% through unified risk correlation and automated triage; Security operations must shift from post-facto scanning to continuous, inline controls within the Agentic Development Life Cycle (ADLC); The solution provides visibility into AI supply chains including LLMs, agent frameworks, and open-source dependencies.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Scanning over 800 billion lines of code each month; 80% noise reduction reported by Best Buy; 90% reduction in vulnerabilities reported by a customer; Support for 75+ languages and 100+ frameworks.
- **Target Audience**: CISO, Security Architect, Developer, Compliance Officer, Operations
- **Implementation Prerequisites**: Integration with existing IDEs, SCMs, CI/CD pipelines, ticketing systems, and AI-native coding environments; No requirement to change how teams build software as the tool operates inline.
- **Relevant PQC Today Features**: api-security-jwt, vendor-risk, code-signing, migration-program, pqc-governance
- **Source Document**: Checkmarx_One.html (313,445 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-13T23:14:05

---

## Brave Browser

- **Reference ID**: Brave Browser
- **Title**: Brave Browser
- **Authors**: Web & Application Security
- **Publication Date**: Not specified
- **Last Updated**: 2026-03-30
- **Document Status**: Pending Verification
- **Main Topic**: The document provides a 2025 update on the state of post-quantum Internet security, detailing quantum hardware and software progress, regulatory migration deadlines, and the urgency of mitigating harvest-now-decrypt-later attacks.
- **PQC Algorithms Covered**: X25519MLKEM768; X25519Kyber768Draft00
- **Quantum Threats Addressed**: Harvest-now-decrypt-later; Shor's algorithm; Chen's algorithm; RSA breaking via quantum computers
- **Migration Timeline Info**: NSA CNSA 2.0 deadlines between 2030 and 2033; US federal government target of 2035; Australia deadline of 2030; UK NCSC deadline of 2035; European Union roadmaps with 2030 and 2035 deadlines
- **Applicable Regions / Bodies**: United States; Australia; United Kingdom; European Union
- **Leaders Contributions Mentioned**: Bas Westerbaan (author); Samuel Jaques (compiled quantum computing graph); Craig Gidney (quantum software optimizations reducing qubit requirements); Yilei Chen (proposed lattice algorithm with fundamental bug)
- **PQC Products Mentioned**: BoringSSL; OpenSSL; Brave Browser; Edge; Firefox
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: CNSA 2.0
- **Classical Algorithms Referenced**: RSA; elliptic curves (ECC); RSA-2048
- **Key Takeaways**: Quantum software optimizations by Craig Gidney have reduced the qubit requirement to break RSA-2048 from 20 million to under one million, accelerating Q-day estimates; Regulatory bodies globally are setting migration deadlines between 2030 and 2035 regardless of exact Q-day timing; Harvest-now-decrypt-later attacks pose an immediate threat as encrypted traffic can be harvested today for future decryption; Lattice-based cryptography remains the primary defense despite recent algorithmic scares like Chen's algorithm which was found to have a fundamental bug
- **Security Levels & Parameters**: RSA-2048; X25519MLKEM768; X25519Kyber768Draft00
- **Hybrid & Transition Approaches**: Post-quantum hybrid key agreement (X25519MLKEM768); Hybrid deployments using classical and post-quantum algorithms
- **Performance & Size Considerations**: 20 million qubits (original estimate for RSA-2048); fewer than one million qubits (Gidney's optimized estimate); 242,000 superconducting qubits (lower bound estimate); 15 (largest number factored by quantum computer without cheating)
- **Target Audience**: Security Architect; CISO; Policy Maker; Researcher
- **Implementation Prerequisites**: Underlying libraries like BoringSSL or OpenSSL with PQC providers; specific browser version ranges for Edge and Firefox support
- **Relevant PQC Today Features**: Timeline; Threats; Compliance; Migrate; Algorithms
- **Source Document**: Brave_Browser.html (692,679 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-13T23:15:36

---

## IBM LinuxONE PQC

- **Reference ID**: IBM LinuxONE PQC
- **Title**: IBM LinuxONE PQC
- **Authors**: Enterprise Server Platforms
- **Publication Date**: 2025
- **Last Updated**: 2026-03-31
- **Document Status**: Verified
- **Main Topic**: IBM LinuxONE is a family of enterprise-grade Linux servers featuring quantum-safe technologies and on-chip accelerators for pervasive encryption.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: IBM LinuxONE; Unified Key Orchestrator for Containers
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management; HSM
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: IBM LinuxONE servers integrate quantum-safe technologies via on-chip accelerators; Unified Key Orchestrator provides centralized hardware-backed encryption key management for containers; The platform supports confidential computing and end-to-end data protection for AI applications; Resource-efficient design optimizes power usage to reduce operational costs.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, CISO, Operations
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: hsm-pqc, kms-pqc, vendor-risk, pqc-business-case
- **Source Document**: IBM_LinuxONE_PQC.html (164,395 bytes, 3,935 extracted chars)
- **Extraction Timestamp**: 2026-04-13T23:17:43

---

## QRL 2.0 (Quantum Resistant Ledger)

- **Reference ID**: QRL 2.0 (Quantum Resistant Ledger)
- **Title**: QRL 2.0 (Quantum Resistant Ledger)
- **Authors**: Blockchain & DLT
- **Publication Date**: 2024
- **Last Updated**: 2026-03-31
- **Document Status**: Verified
- **Main Topic**: The document serves as a central documentation hub for the Quantum Resistant Ledger (QRL), covering usage, development, and API integration for its quantum-resistant blockchain.
- **PQC Algorithms Covered**: XMSS; ML-DSA
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: ML-DSA migration planned
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: QRL Wallet; QRL Core Library; QRLLIB; QrandomX; QRL Node; QRL Helpers API; QRL API; WalletD Rest Proxy; Zeus Proxy; test-zond
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: QRL is a purpose-built quantum-resistant blockchain using XMSS signatures since mainnet; ML-DSA migration is planned for the future; documentation covers three main categories: Use, Build, and API; developers can access tools like QRLLIB and QrandomX for building on the project; a test network named test-zond offers Proof-of-Stake with EVM smart contracts.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; User; Researcher
- **Implementation Prerequisites**: Docker nodes; QRL Core Library; QrandomX RandomX Library
- **Relevant PQC Today Features**: stateful-signatures; digital-assets; algorithms; migration-program
- **Source Document**: QRL*2_0\_\_Quantum_Resistant_Ledger*.html (30,815 bytes, 2,447 extracted chars)
- **Extraction Timestamp**: 2026-04-13T23:18:42

---

## NCSC UK PQC Migration Timelines

- **Reference ID**: NCSC UK PQC Migration Timelines
- **Title**: NCSC UK PQC Migration Timelines
- **Authors**: Cryptographic Agility Frameworks
- **Publication Date**: 2025-03
- **Last Updated**: 2026-04-01
- **Document Status**: Verified
- **Main Topic**: NCSC UK guidance on preparing for post-quantum cryptography migration, including threat understanding, algorithm selection, and standardization status.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA, LMS, XMSS
- **Quantum Threats Addressed**: Cryptographically-relevant quantum computer (CRQC); Harvest Now Decrypt Later; signature forgery
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United Kingdom; NCSC UK
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS, IPsec
- **Infrastructure Layers**: Critical National Infrastructure (CNI); Operational Technology; Root of trust
- **Standardization Bodies**: NIST, IETF, ETSI
- **Compliance Frameworks Referenced**: NIST FIPS 203, NIST FIPS 204, NIST FIPS 205, NIST SP 800-208
- **Classical Algorithms Referenced**: RSA, Finite Field Diffie-Hellman, ECDH, DSA, ECDSA, EdDSA, AES, SHA-256
- **Key Takeaways**: System owners should begin financial planning for PQC updates now; Operational systems should only use robust implementations of final standards like ML-KEM and ML-DSA; Hybrid schemes are recommended for interoperability during the transition phase; Stateful hash-based signatures require strict state management suitable only for specific use cases like firmware signing
- **Security Levels & Parameters**: ML-KEM-768, ML-DSA-65, 128-bit keys
- **Hybrid & Transition Approaches**: Post-quantum traditional (PQ/T) hybrid schemes; phased approach to introduction of PQC; dual support of PQC and traditional PKC algorithms
- **Performance & Size Considerations**: Larger parameter sets require greater processing power and bandwidth; Hash-based signatures have large signature sizes and slower signing speeds than ML-DSA; Smaller parameter sets require less power and bandwidth but offer lower security margins
- **Target Audience**: System owners, Risk owners, Security Architect, Compliance Officer, Policy Maker
- **Implementation Prerequisites**: Financial planning for system updates; Inventory of bespoke IT or operational technology; State management capability for LMS and XMSS; Use of RFC-based protocol implementations
- **Relevant PQC Today Features**: Threats, Algorithms, Migrate, hybrid-crypto, stateful-signatures
- **Source Document**: NCSC_UK_PQC_Migration_Timelines.html (154,371 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-13T23:19:43

---

## hbs-lms

- **Reference ID**: hbs-lms
- **Title**: hbs-lms
- **Authors**: Post-Quantum Cryptography Libraries
- **Publication Date**: 2023
- **Last Updated**: 2026-04-05
- **Document Status**: Pending Verification
- **Main Topic**: Specification of the Leighton-Micali Hash-Based Signatures (LMS) and Hierarchical Signature System (HSS) as stateful, post-quantum digital signature schemes.
- **PQC Algorithms Covered**: LMS, HSS, LM-OTS
- **Quantum Threats Addressed**: Quantum computer attacks on large integer mathematics; general quantum resistance of hash-based signatures
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: David McGrew; Michael Curcio; Scott Fluhrer
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: Internet Research Task Force (IRTF); Crypto Forum Research Group (CFRG)
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA; ECDSA
- **Key Takeaways**: LMS and HSS provide asymmetric authentication resistant to quantum computers without using large integer mathematics; The schemes are stateful, meaning secret key states must not be reused or security guarantees are lost; Classical APIs for digital signatures cannot be used without modification to handle dynamic secret key states; Multilevel signature schemes increase signature size and verification time but save space and time for key generation on resource-constrained systems
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Small private and public keys; Fast signature generation and verification; Large signatures; Moderately slow key generation compared to RSA and ECDSA
- **Target Audience**: Developer; Security Architect; Researcher
- **Implementation Prerequisites**: Systems must prevent reuse of secret key states; APIs must handle dynamic secret key state updates
- **Relevant PQC Today Features**: stateful-signatures; algorithms; merkle-tree-certs; pqc-101; quantum-threats
- **Source Document**: hbs-lms.html (218,791 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-13T23:21:29

---
