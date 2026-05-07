---
generated: 2026-05-07
collection: vendor-roadmaps
enrichment_method: ollama-qwen3.6:27b
source: public/vendor-roadmaps/
---

# Vendor PQC Roadmap Enrichments

## VND-001 — Amazon Web Services Inc.

- **Vendor ID**: VND-001
- **Vendor Name**: Amazon Web Services Inc.
- **Roadmap Title**: AWS Post-Quantum Cryptography Migration Plan
- **Roadmap URL**: https://aws.amazon.com/security/post-quantum-cryptography/migrating-to-post-quantum-cryptography/
- **Publish Date**: 2026-04-23
- **Local File**: public/vendor-roadmaps/VND-001_Amazon_Web_Services_Inc..html
- **CSV Coverage Notes**: AWS-LC · s2n-tls · KMS · ACM · Secrets Manager · S3 · CloudFront · VPC
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Elastic Load Balancers (ALB, NLB); API Gateway; CloudFront; Transfer Family; AWS Key Management Service (KMS); AWS Certificate Manager (ACM); AWS Secrets Manager; AWS Payment Cryptography; Amazon Simple Storage Service (S3); AWS Private Certificate Authority; IAM Roles Anywhere; AWS CloudHSM
- **Compliance Frameworks**: NIST FIPS 203, 204, and 205; NIST IR 8547; European Commission Recommendation on a Coordinated Implementation Roadmap; UK NCSC whitepaper; BSI Technical Guideline TR-02102; ANSSI position paper; ASD guidance; Canadian Centre for Cyber Security ITSM.40.001; UAE National Encryption Policy v1.0; G7 Cyber Expert Group roadmap; ASC X9 Post Quantum Cryptography Financial Readiness Needs Assessment; GSMA Post-Quantum Telco Network Taskforce guidelines
- **Hybrid Mode Support**: Yes, the document states that services offer encryption in transit policies that support "hybrid PQ-key exchange using ML-KEM" and references BSI/ANSSI recommendations for hybrid approaches.
- **Current GA Status**: GA (General Availability), as indicated by "Launched services" and "capabilities AWS has already delivered," though CloudHSM support is in preview.
- **Customer Action Required**: Update client-side components/SDKs to versions supporting ML-KEM; explicitly specify desired TLS policies in infrastructure-as-code; use IAM condition keys to restrict policies; ensure applications use TLS 1.3; update PKI infrastructure to use ML-DSA for code signing and trust anchors.
- **Key Commitments & Quotes**: "AWS uses the ML-KEM algorithm for this purpose."; "AWS uses the ML-DSA algorithm for this purpose."; "Once a service launches PQ support, it will automatically enforce its use with any updated client."
- **Coverage Verification**: PARTIAL, the document confirms KMS, ACM, Secrets Manager, S3, and CloudFront, but does not explicitly mention AWS-LC, s2n-tls, or VPC in the provided text.
- **Extraction Quality**: HIGH
- **Source Document**: VND-001_Amazon_Web_Services_Inc..html (311.1 KB)
- **Extraction Timestamp**: 2026-05-07T01:09:39

## VND-002 — Apple Inc.

- **Vendor ID**: VND-002
- **Vendor Name**: Apple Inc.
- **Roadmap Title**: Apple PQ3: iMessage Post-Quantum Security
- **Roadmap URL**: https://security.apple.com/blog/imessage-pq3/
- **Publish Date**: 2024-02-21
- **Local File**: public/vendor-roadmaps/VND-002_Apple_Inc..html
- **CSV Coverage Notes**: iMessage PQ3 · iOS/macOS CoreCrypto · CryptoKit ML-KEM/ML-DSA APIs (iOS 26+)
- **PQC Algorithms Announced**: Kyber; ML-KEM
- **Target Migration Dates**: fully replace the existing protocol within all supported conversations this year
- **Products / Services Covered**: iMessage; iOS 17.4; iPadOS 17.4; macOS 14.4; watchOS 10.4
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: Yes; PQ3 employs a hybrid design that combines Elliptic Curve cryptography with post-quantum encryption both during the initial key establishment and during rekeying.
- **Current GA Status**: GA; Support for PQ3 will start to roll out with the public releases of iOS 17.4, iPadOS 17.4, macOS 14.4, and watchOS 10.4
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "PQ3 is the first messaging protocol to reach what we call Level 3 security"; "PQ3 has the strongest security properties of any at-scale messaging protocol in the world"; "PQ3 will fully replace the existing protocol within all supported conversations this year"
- **Coverage Verification**: MISMATCH; The document confirms iMessage PQ3 and ML-KEM usage, but does not mention CryptoKit APIs, CoreCrypto, or iOS 26+.
- **Extraction Quality**: HIGH
- **Source Document**: VND-002_Apple_Inc..html (103.6 KB)
- **Extraction Timestamp**: 2026-05-07T01:14:41

## VND-014 — F5 Networks Inc.

- **Vendor ID**: VND-014
- **Vendor Name**: F5 Networks Inc.
- **Roadmap Title**: F5 Post-Quantum Cryptography Readiness
- **Roadmap URL**: https://www.f5.com/solutions/post-quantum-cryptography-readiness
- **Publish Date**: 2024-01-01
- **Local File**: public/vendor-roadmaps/VND-014_F5_Networks_Inc..html
- **CSV Coverage Notes**: BIG-IP v17.5.1 ML-KEM · NGINX Plus PQC via oqs-provider · F5 Distributed Cloud · crypto-agile hybrid PQC TLS
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: F5 BIG-IP LTM; NGINX Plus; F5 BIG-IP SSL Orchestrator; F5 BIG-IP Zero Trust Access (ZTA); F5 Application Delivery and Security Platform (ADSP)
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: Yes, the document describes a "hybrid implementation strategy" that combines classical encryption with post-quantum algorithms to preserve compatibility.
- **Current GA Status**: GA
- **Customer Action Required**: Identify where encryption terminates; enforce quantum-safe algorithms; adopt crypto-agile controls; deploy quantum-resistant encryption.
- **Key Commitments & Quotes**: "F5 ADSP delivers end-to-end post-quantum cryptography (PQC) with National Institute of Standards and Technologies (NIST)-approved algorithms"; "F5 delivers crypto-agility allowing teams to deploy PQC safely today and adapt continuously"; "PQC is applied at the application delivery and security tier, enabling legacy apps... to benefit from quantum-safe encryption"
- **Coverage Verification**: PARTIAL, the document confirms BIG-IP and NGINX Plus PQC capabilities but does not explicitly mention BIG-IP v17.5.1, oqs-provider, or F5 Distributed Cloud.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-014_F5_Networks_Inc..html (1133.3 KB)
- **Extraction Timestamp**: 2026-05-07T01:28:54

## VND-018 — Google LLC

- **Vendor ID**: VND-018
- **Vendor Name**: Google LLC
- **Roadmap Title**: Google Cloud Post-Quantum Cryptography
- **Roadmap URL**: https://cloud.google.com/security/resources/post-quantum-cryptography
- **Publish Date**: 2025-01-01
- **Local File**: public/vendor-roadmaps/VND-018_Google_LLC.html
- **CSV Coverage Notes**: BoringSSL · Tink · Chrome · Android · Google Cloud KMS · Workspace
- **PQC Algorithms Announced**: ML-KEM; Kyber
- **Target Migration Dates**: 2029
- **Products / Services Covered**: BoringSSL; Tink; Chrome; Android; Google Cloud KMS; OpenSK
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: Yes; "hybrid deployments of PQC and classic cryptography"
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Google has set 2029 as the deadline for Google's PQC migration to secure the quantum era."
- **Coverage Verification**: PARTIAL; The document confirms BoringSSL, Tink, Chrome, Android, and Cloud KMS, but does not explicitly mention Workspace in the PQC context.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-018_Google_LLC.html (2124.2 KB)
- **Extraction Timestamp**: 2026-05-07T01:38:42

## VND-019 — IBM Corporation

- **Vendor ID**: VND-019
- **Vendor Name**: IBM Corporation
- **Roadmap Title**: IBM Quantum-Safe Roadmap
- **Roadmap URL**: https://research.ibm.com/blog/quantum-safe-roadmap
- **Publish Date**: 2023-05-10
- **Local File**: public/vendor-roadmaps/VND-019_IBM_Corporation.html
- **CSV Coverage Notes**: IBM Quantum Safe Explorer/Advisor/Remediator · Guardium · z/OS · OpenSSL
- **PQC Algorithms Announced**: CRYSTALS-Kyber; CRYSTALS-Dilithium; Falcon
- **Target Migration Dates**: 2024 (NIST publish post-quantum cryptography standards); 2025 (NSA require preference for quantum-safe algorithms)
- **Products / Services Covered**: IBM Quantum Safe Explorer; IBM Quantum Safe Advisor; IBM Quantum Safe Remediator; IBM z16; IBM Tape
- **Compliance Frameworks**: NIST; FIPS; CNSA 2.0
- **Hybrid Mode Support**: Yes; Remediator supports a hybrid implementation approach allowing use of classical and quantum-safe cryptography during transition
- **Current GA Status**: GA; Explorer, Advisor, and first generation of Remediator are released
- **Customer Action Required**: Complete cryptography inventory; create a Cryptography Bill of Materials (CBOM); begin quantum-safe transition
- **Key Commitments & Quotes**: "This roadmap serves as a commitment to transparency, predictability, and confidence as we guide industries along their journey to post-quantum cryptography."; "Our end goal for clients is crypto-agility in the increasingly fast-paced world of cybersecurity."; "By then, Remediator will offer a hybrid approach, enabling traditional as well quantum-safe cryptography."
- **Coverage Verification**: PARTIAL; The document confirms Explorer, Advisor, Remediator, and z/OS, but does not mention Guardium or OpenSSL.
- **Extraction Quality**: HIGH
- **Source Document**: VND-019_IBM_Corporation.html (84.2 KB)
- **Extraction Timestamp**: 2026-05-07T01:43:38

## VND-024 — Keyfactor Inc.

- **Vendor ID**: VND-024
- **Vendor Name**: Keyfactor Inc.
- **Roadmap Title**: Keyfactor Post-Quantum Cryptography Lab
- **Roadmap URL**: https://www.keyfactor.com/post-quantum-cryptography-lab/
- **Publish Date**: 2025-01-01
- **Local File**: public/vendor-roadmaps/VND-024_Keyfactor_Inc..html
- **CSV Coverage Notes**: EJBCA · SignServer · Command · ACME · IoT PKI
- **PQC Algorithms Announced**: Falcon; Dilithium; SPHINCS+
- **Target Migration Dates**: all encryption must be post-quantum secure by 2035
- **Products / Services Covered**: Keyfactor Command; SignServer; Bouncy Castle APIs
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: Yes, mentions "Post-quantum hybrid cryptography in Bouncy Castle" and "Examining the Migration Path of Hybrid Certificates"
- **Current GA Status**: Beta (indicated by "Free trial", "PQC Lab", "Playground", and "Test Drive")
- **Customer Action Required**: Explore PQC in our Test Drive; Get a PQC-Ready PKI and Signing Test Drive; Assess your organization's PKI maturity; Get hands-on with open-source toolkits
- **Key Commitments & Quotes**: "Crypto-agility—swapping cryptographic algorithms quickly and confidently—is essential, as all encryption must be post-quantum secure by 2035."; "Keyfactor's PQC Lab offers resources to modernize proactively, so when quantum threats arrive, you're ready."; "Get quantum-ready with resources and a PQC sandbox"
- **Coverage Verification**: PARTIAL, the document confirms Command, SignServer, and Bouncy Castle (IoT PKI context), but does not explicitly mention EJBCA or ACME in the PQC-specific sections.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-024_Keyfactor_Inc..html (177.4 KB)
- **Extraction Timestamp**: 2026-05-07T01:53:48

## VND-025 — The Legion of the Bouncy Castle Inc.

- **Vendor ID**: VND-025
- **Vendor Name**: The Legion of the Bouncy Castle Inc.
- **Roadmap Title**: Bouncy Castle: NIST PQC Standards Support (v1.79+)
- **Roadmap URL**: https://www.bouncycastle.org/resources/latest-nist-pqc-standards-and-more-bouncy-castle-java-1-79/
- **Publish Date**: 2024-12-01
- **Local File**: public/vendor-roadmaps/VND-025_The_Legion_of_the_Bouncy_Castle_Inc..html
- **CSV Coverage Notes**: Java 1.79–1.81 · ML-KEM · ML-DSA · SLH-DSA · FN-DSA · hybrid TLS cipher suites · C# .NET 2.6+
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Bouncy Castle Java 1.79; Bouncy Castle C# .NET
- **Compliance Frameworks**: NIST; RFC 9269
- **Hybrid Mode Support**: Yes, mentions "X.509 hybrid certificates" and "transitioning from classical cryptography to post-quantum standards"
- **Current GA Status**: GA
- **Customer Action Required**: Download the PQC Almanac; use implementations for testing and migration planning rather than production deployment
- **Key Commitments & Quotes**: "supporting the newly standardized NIST Post-Quantum Cryptography (PQC) algorithms, including the ML-KEM key encapsulation mechanism and the ML-DSA and SLH-DSA signature algorithms"; "implementations are intended for testing and migration planning rather than production deployment"; "Bouncy Castle Java's CMS API now supports using KEMs within Cryptographic Message Syntax, adhering to RFC 9269"
- **Coverage Verification**: PARTIAL, the document confirms Java 1.79 support for ML-KEM, ML-DSA, and SLH-DSA but does not mention FN-DSA, hybrid TLS cipher suites, or C# .NET 2.6+ specific versioning.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-025_The_Legion_of_the_Bouncy_Castle_Inc..html (268.3 KB)
- **Extraction Timestamp**: 2026-05-07T01:58:45

## VND-027 — Microsoft Corporation

- **Vendor ID**: VND-027
- **Vendor Name**: Microsoft Corporation
- **Roadmap Title**: Microsoft Quantum-Safe Security: Progress Towards Next-Generation Cryptography
- **Roadmap URL**: https://www.microsoft.com/en-us/security/blog/2025/08/20/quantum-safe-security-progress-towards-next-generation-cryptography/
- **Publish Date**: 2025-08-20
- **Local File**: public/vendor-roadmaps/VND-027_Microsoft_Corporation.html
- **CSV Coverage Notes**: SymCrypt · Windows 11/Server 2025 · .NET · Azure · M365 · Active Directory
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; FrodoKEM
- **Target Migration Dates**: Early adoption by 2029; complete transition of services and products by 2033
- **Products / Services Covered**: SymCrypt; Windows Insiders; Linux; Microsoft Entra; Azure; Microsoft 365; TLS stack; Adams Bridge Accelerator; Caliptra 2.0
- **Compliance Frameworks**: NIST; CNSA 2.0; CNSSP-15; ISO; IETF; OMB; CISA; NSA; EU; Japan; Canada; Australia; UK
- **Hybrid Mode Support**: Yes, the document states a hybrid approach combining classical and quantum-resistant algorithms is used as an interim step and TLS 1.3 is being enhanced to support hybrid key exchange.
- **Current GA Status**: Preview (PQC capabilities previewed for Windows Insiders and Linux; SymCrypt updated to support verified PQC algorithms)
- **Customer Action Required**: Start developing their strategy now; proactively prepare software and services for PQC support; begin exploration and integration of quantum-safe algorithms
- **Key Commitments & Quotes**: "Microsoft's roadmap aims to complete transition of its services and products by 2033"; "aiming to enable early adoption of quantum-safe capabilities by 2029"; "previewed PQC capabilities for Windows Insiders and Linux"
- **Coverage Verification**: PARTIAL, the document confirms SymCrypt, Windows, Azure, M365, and Entra (Active Directory) but does not explicitly mention .NET or Windows Server 2025.
- **Extraction Quality**: HIGH
- **Source Document**: VND-027_Microsoft_Corporation.html (313.6 KB)
- **Extraction Timestamp**: 2026-05-07T02:03:27

## VND-031 — Palo Alto Networks Inc.

- **Vendor ID**: VND-031
- **Vendor Name**: Palo Alto Networks Inc.
- **Roadmap Title**: Palo Alto Networks Post-Quantum Migration Planning
- **Roadmap URL**: https://docs.paloaltonetworks.com/network-security/quantum-security/administration/quantum-security-concepts/post-quantum-migration-planning-and-preparation
- **Publish Date**: 2025-01-01
- **Local File**: public/vendor-roadmaps/VND-031_Palo_Alto_Networks_Inc..html
- **CSV Coverage Notes**: NGFW · Prisma SASE · Quantum Readiness Dashboard · Strata Cloud Manager
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: PAN-OS; Quantum-Safe Security app; Decryption, Traffic, and Threat logs; Vulnerability Protection profile signatures
- **Compliance Frameworks**: NIST; NSA; RFC 6379; RFC 8784; RFC 9242; RFC 9370
- **Hybrid Mode Support**: Yes; The document states "the industry is adopting hybrid keys" and recommends using "a strong classic KEM... and one or more PQCs" to provide an extra layer of security.
- **Current GA Status**: Planned; The document outlines a migration planning guide and mentions that post-quantum IKEv2 VPNs (RFC 8784) are the first step, implying preparation for future implementation rather than current general availability of PQC algorithms.
- **Customer Action Required**: Form a dedicated project management team; develop a cryptographic inventory; upgrade VPN connections to tough cipher suites (Suite-B-GCM-256); upgrade CA to 4K RSA key sizes; stop using weak hashes (MD5, SHA-1); implement RFC 8784/9242/9370; engage vendors to understand their PQC readiness plans.
- **Key Commitments & Quotes**: "Post-quantum IKEv2 VPNs ( RFC 8784 ) are the first step to creating a secure post-quantum network, which you can do now without impacting your network."
- **Coverage Verification**: PARTIAL; The document mentions PAN-OS and specific apps/logs but does not explicitly name Prisma SASE, Quantum Readiness Dashboard, or Strata Cloud Manager in the provided text.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-031_Palo_Alto_Networks_Inc..html (292.5 KB)
- **Extraction Timestamp**: 2026-05-07T02:11:38

## VND-035 — Samsung Electronics Co. Ltd.

- **Vendor ID**: VND-035
- **Vendor Name**: Samsung Electronics Co. Ltd.
- **Roadmap Title**: Samsung Knox: The First Step to a Quantum-Safe Future
- **Roadmap URL**: https://news.samsung.com/global/the-first-step-to-a-quantum-safe-future-with-samsung-knox
- **Publish Date**: 2025-01-22
- **Local File**: public/vendor-roadmaps/VND-035_Samsung_Electronics_Co.\_Ltd..html
- **CSV Coverage Notes**: Samsung Knox Matrix (Galaxy S25+) · ML-KEM FIPS 203 · Knox Secure Wi-Fi PQC · cross-device quantum-safe protection
- **PQC Algorithms Announced**: ML-KEM
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Galaxy S25 series; Samsung Knox Matrix; Samsung Cloud
- **Compliance Frameworks**: NIST; FIPS 203; FIPS 204; FIPS 205
- **Hybrid Mode Support**: None detected
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Samsung is introducing Post-Quantum Enhanced Data Protection (EDP) to Samsung Knox Matrix"; "The Galaxy S25 series is the first in the industry to support PQC-based cloud data protection"; "Knox Matrix's cross-device compatibility will ensure seamless quantum-safe protection"
- **Coverage Verification**: PARTIAL — The document confirms Knox Matrix, Galaxy S25+, ML-KEM, and cross-device protection, but does not mention "Knox Secure Wi-Fi PQC".
- **Extraction Quality**: HIGH
- **Source Document**: VND-035_Samsung_Electronics_Co.\_Ltd..html (148.6 KB)
- **Extraction Timestamp**: 2026-05-07T02:17:29

## VND-037 — Securosys SA

- **Vendor ID**: VND-037
- **Vendor Name**: Securosys SA
- **Roadmap Title**: Securosys Post-Quantum Cryptography HSM
- **Roadmap URL**: https://www.securosys.com/en/hsm/post-quantum-cryptography
- **Publish Date**: 2024-01-01
- **Local File**: public/vendor-roadmaps/VND-037_Securosys_SA.html
- **CSV Coverage Notes**: Primus HSM CyberVault Series · CloudHSM · ML-KEM · ML-DSA · SLH-DSA · HSS-LMS · XMSS · hybrid classical+PQC
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA; HSS-LMS; XMSS
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Primus HSM CyberVault (X2 Models); Primus HSM CyberVault Core (E2 Model); Primus HSM X-Series; Primus HSM E-Series; Primus HSM S-Series; Securosys CloudHSM
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: Yes; Integrating classical algorithms like RSA and ECC/ED with PQC signatures and key exchange
- **Current GA Status**: GA
- **Customer Action Required**: Start a 90-free trial; Test Securosys HSM PQC in a Controlled Environment; Contact our sales team
- **Key Commitments & Quotes**: "Our PQC-ready HSMs currently support the following algorithms : ML-KEM, ML-DSA, SLH-DSA, HSS-LMS, XMSS"; "Integrating classical algorithms like RSA and ECC/ED with PQC signatures and key exchange"; "Securosys is committed to advancing PQC in safe-world applications"
- **Coverage Verification**: CONSISTENT; The document explicitly lists the Primus HSM CyberVault series, CloudHSM, the specified algorithms (ML-KEM, ML-DSA, SLH-DSA, HSS-LMS, XMSS), and confirms hybrid classical+PQC support.
- **Extraction Quality**: HIGH
- **Source Document**: VND-037_Securosys_SA.html (274.3 KB)
- **Extraction Timestamp**: 2026-05-07T02:19:51

## VND-041 — Thales Group

- **Vendor ID**: VND-041
- **Vendor Name**: Thales Group
- **Roadmap Title**: Thales Luna HSM: Quantum-Safe Encryption Roadmap
- **Roadmap URL**: https://cpl.thalesgroup.com/blog/encryption/luna-hsm-pqc-quantum-safe-encryption
- **Publish Date**: 2025-06-27
- **Local File**: public/vendor-roadmaps/VND-041_Thales_Group.html
- **CSV Coverage Notes**: Luna HSM · CipherTrust Manager · SafeNet · High Speed Encryptors
- **PQC Algorithms Announced**: ML-KEM; ML-DSA
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Luna HSM v7.9
- **Compliance Frameworks**: FIPS 203; FIPS 204; FIPS 140-3
- **Hybrid Mode Support**: Yes; "Hybrid PQC encryption for secure key synchronization, backup, and restore."
- **Current GA Status**: GA; "production-ready, NIST-approved post-quantum cryptography (PQC)"
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Luna HSM v7.9 offers native support for: ML-KEM (FIPS 203) and ML-DSA (FIPS 204) — fully integrated into firmware"; "production-ready, standards-based, and certified solution, with FIPS 140-3 Level 3 validation in progress"
- **Coverage Verification**: PARTIAL; The document explicitly confirms Luna HSM v7.9 but does not mention CipherTrust Manager, SafeNet, or High Speed Encryptors.
- **Extraction Quality**: HIGH
- **Source Document**: VND-041_Thales_Group.html (114.5 KB)
- **Extraction Timestamp**: 2026-05-07T02:22:56

## VND-042 — Utimaco IS GmbH

- **Vendor ID**: VND-042
- **Vendor Name**: Utimaco IS GmbH
- **Roadmap Title**: Utimaco Quantum Protect — PQC Application Package for GP HSM
- **Roadmap URL**: https://utimaco.com/data-protection/gp-hsm/application-package/quantum-protect
- **Publish Date**: 2025-04-02
- **Local File**: public/vendor-roadmaps/VND-042_Utimaco_IS_GmbH.html
- **CSV Coverage Notes**: u.trust GP HSM Se-Series · ML-KEM · ML-DSA · LMS · XMSS · HSS · XMSS-MT · SLH-DSA (roadmap) · free PQC simulator · in-field activation
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; LMS; XMSS; HSS; XMSS-MT; SLH-DSA
- **Target Migration Dates**: None detected
- **Products / Services Covered**: u.trust General Purpose HSM Se-Series; Quantum Protect application package; Quantum Protect Simulator
- **Compliance Frameworks**: FIPS 203; FIPS 204; FIPS 205
- **Hybrid Mode Support**: None detected
- **Current GA Status**: GA (available as in-field upgrade)
- **Customer Action Required**: Use the free simulator to evaluate how PQC algorithms work within your environment and use case
- **Key Commitments & Quotes**: "Quantum Protect extends the u.trust General Purpose HSM Se-Series with proven and standardized Post Quantum Cryptography algorithms"; "Quantum Protect is available as seamless in-field upgrade for the u.trust General Purpose HSM Se-Series – no HSM exchange needed"; "More algorithms such as SLH-DSA are on the roadmap"
- **Coverage Verification**: CONSISTENT — The document explicitly confirms support for ML-KEM, ML-DSA, LMS, XMSS, HSS, XMSS-MT on the Se-Series, lists SLH-DSA as on the roadmap, and mentions the free simulator and in-field upgrade capability.
- **Extraction Quality**: HIGH
- **Source Document**: VND-042_Utimaco_IS_GmbH.html (282.6 KB)
- **Extraction Timestamp**: 2026-05-07T02:25:45

## VND-045 — wolfSSL Inc.

- **Vendor ID**: VND-045
- **Vendor Name**: wolfSSL Inc.
- **Roadmap Title**: wolfSSL Support for NIST PQC Standards
- **Roadmap URL**: https://www.wolfssl.com/support-for-the-official-post-quantum-standards-ml-kem-and-ml-dsa/
- **Publish Date**: 2024-08-13
- **Local File**: public/vendor-roadmaps/VND-045_wolfSSL_Inc..html
- **CSV Coverage Notes**: wolfSSL · wolfCrypt · wolfBoot · wolfPKCS11 · embedded/IoT
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA; Kyber; Dilithium; SPHINCS+
- **Target Migration Dates**: None detected
- **Products / Services Covered**: wolfSSL library; wolfCrypt
- **Compliance Frameworks**: NIST FIPS 203; NIST FIPS 204; NIST FIPS 205
- **Hybrid Mode Support**: None detected
- **Current GA Status**: GA
- **Customer Action Required**: Download the wolfSSL library; configure it to enable Dilithium and Kyber; run the benchmarks
- **Key Commitments & Quotes**: "we have full implementation and support for ML-KEM and ML-DSA"
- **Coverage Verification**: PARTIAL — The document confirms wolfSSL and wolfCrypt but does not mention wolfBoot, wolfPKCS11, or specific embedded/IoT coverage.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-045_wolfSSL_Inc..html (66.7 KB)
- **Extraction Timestamp**: 2026-05-07T02:28:27

## VND-116 — Signal Foundation

- **Vendor ID**: VND-116
- **Vendor Name**: Signal Foundation
- **Roadmap Title**: Signal PQXDH: Post-Quantum Key Agreement
- **Roadmap URL**: https://signal.org/blog/pqxdh/
- **Publish Date**: 2023-09-22
- **Local File**: public/vendor-roadmaps/VND-116_Signal_Foundation.html
- **CSV Coverage Notes**: Signal app · PQXDH protocol · ML-KEM Braid · libsignal
- **PQC Algorithms Announced**: CRYSTALS-Kyber
- **Target Migration Dates**: In the coming months (after sufficient time has passed for everyone using Signal to update), we will disable X3DH for new chats and require PQXDH for all new chats.
- **Products / Services Covered**: Signal's client applications
- **Compliance Frameworks**: NIST Standardization Process for Post-Quantum Cryptography
- **Hybrid Mode Support**: Yes; augmenting existing cryptosystems such that an attacker must break both X25519 and CRYSTALS-Kyber to compute the shared secret.
- **Current GA Status**: GA; supported in the latest versions of Signal's client applications and in use for chats initiated after both sides are using the latest software.
- **Customer Action Required**: Update to the latest Signal software to enable PQXDH for new chats.
- **Key Commitments & Quotes**: "we are adding a layer of protection against the threat of a quantum computer"; "we do not want to simply replace our existing elliptic curve cryptography foundations"; "we will disable X3DH for new chats and require PQXDH for all new chats"
- **Coverage Verification**: PARTIAL; The document confirms Signal app, PQXDH protocol, and CRYSTALS-Kyber (ML-KEM), but does not explicitly mention "libsignal" or the specific term "Braid".
- **Extraction Quality**: HIGH
- **Source Document**: VND-116_Signal_Foundation.html (19.7 KB)
- **Extraction Timestamp**: 2026-05-07T02:31:06

## VND-127 — Broadcom Inc.

- **Vendor ID**: VND-127
- **Vendor Name**: Broadcom Inc.
- **Roadmap Title**: VMware Cloud Foundation Post-Quantum Readiness
- **Roadmap URL**: https://blogs.vmware.com/cloud-foundation/2026/04/28/post-quantum-readiness-on-vcf/
- **Publish Date**: 2026-04-28
- **Local File**: public/vendor-roadmaps/VND-127_Broadcom_Inc..html
- **CSV Coverage Notes**: VMware Cloud Foundation · vCenter · ESXi 9.0 · Avi (NSX ALB) · Symantec DLP · CBOM initiative · FIPS-gated PQC rollout
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA
- **Target Migration Dates**: Full transition to quantum-resistant algorithms required by 2035; deprecating RSA-2048 and other quantum-vulnerable algorithms by 2030; disallowing them by 2035
- **Products / Services Covered**: VMware Cloud Foundation; VMware Avi Load Balancer; vCenter; hypervisor (vSphere)
- **Compliance Frameworks**: CNSA 2.0; NIST IR 8547; FIPS; TPM 2.0 v185; UEFI Forum; Confidential Computing Consortium
- **Hybrid Mode Support**: Yes; VMware Avi Load Balancer supports hybrid post-quantum key exchange in TLS; VCF preparing for hybrid signing and hybrid TLS key exchange
- **Current GA Status**: GA; VMware Avi Load Balancer already supports hybrid post-quantum key exchange in TLS
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Broadcom is committed to adopting PQC-resistant algorithms and methods for VCF on the timelines mandated by the NSA through CNSA 2.0, with full transition to quantum-resistant algorithms required by 2035."
- **Coverage Verification**: PARTIAL; The document confirms VCF, vCenter, Avi, CBOM, and FIPS gating, but does not mention ESXi 9.0 or Symantec DLP.
- **Extraction Quality**: HIGH
- **Source Document**: VND-127_Broadcom_Inc..html (96.6 KB)
- **Extraction Timestamp**: 2026-05-07T02:32:40

## VND-008 — Cisco Systems Inc.

- **Vendor ID**: VND-008
- **Vendor Name**: Cisco Systems Inc.
- **Roadmap Title**: Cisco Secure Firewall: Post-Quantum Cryptography Roadmap
- **Roadmap URL**: https://blogs.cisco.com/security/preparing-for-post-quantum-cryptography-the-secure-firewall-roadmap
- **Publish Date**: 2026-04-13
- **Local File**: public/vendor-roadmaps/VND-008_Cisco_Systems_Inc..html
- **CSV Coverage Notes**: Secure Firewall · IOS XE · IOS XR · Meraki · WebEx · AnyConnect
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA
- **Target Migration Dates**: ML-KEM GA late 2026; ML-DSA and SLH-DSA support in second half of 2027
- **Products / Services Covered**: Secure Firewall Threat Defense (FTD); ASA
- **Compliance Frameworks**: NIST FIPS 203; NIST FIPS 204; NIST FIPS 205; NSA; RFC 8784; RFC 9242; RFC 9370
- **Hybrid Mode Support**: Yes, via RFC 9242 and RFC 9370 enabling hybrid key exchange with classical and post-quantum key agreement simultaneously
- **Current GA Status**: Planned
- **Customer Action Required**: Know where encryption lives; build upgrade paths into planning cycles; think about hardware now for PQC Secure Boot support
- **Key Commitments & Quotes**: "Support arrives in Secure Firewall Threat Defense (FTD) 10.5 and ASA 9.25 , targeted for General Availability in late 2026."
- **Coverage Verification**: MISMATCH, the document only covers Secure Firewall (FTD/ASA) and does not mention IOS XE, IOS XR, Meraki, WebEx, or AnyConnect.
- **Extraction Quality**: HIGH
- **Source Document**: VND-008_Cisco_Systems_Inc..html (82.4 KB)
- **Extraction Timestamp**: 2026-05-07T07:23:48

## VND-030 — PQShield Ltd.

- **Vendor ID**: VND-030
- **Vendor Name**: PQShield Ltd.
- **Roadmap Title**: PQShield PQCryptoLib-SDK: ML-KEM and ML-DSA
- **Roadmap URL**: https://pqshield.com/products/pqc-sdk/
- **Publish Date**: 2025-01-01
- **Local File**: public/vendor-roadmaps/VND-030_PQShield_Ltd..html
- **CSV Coverage Notes**: PQSDK · PQCryptoLib-Core · PQMicroLib-Core · PQE2E Messaging SDK · hardware IP cores · FIPS 203/204/205
- **PQC Algorithms Announced**: ML-KEM; ML-DSA
- **Target Migration Dates**: None detected
- **Products / Services Covered**: PQCryptoLib-SDK; PQCryptoLib-Core
- **Compliance Frameworks**: FIPS 140-3; CAVP; CMVP
- **Hybrid Mode Support**: None detected
- **Current GA Status**: GA
- **Customer Action Required**: Contact us for an evaluation; Complete the form below to download the Product Brief and arrange a Product Evaluation
- **Key Commitments & Quotes**: "PQCryptoLib-SDK provides implementations of ML-KEM and ML-DSA."; "PQCryptoLib-SDK is PQShield’s plug-and-play software development kit"; "FIPS 140-3 CAVP/CMVP ready PQCryptoLib-Core library"
- **Coverage Verification**: PARTIAL — The document confirms PQCryptoLib-SDK and PQCryptoLib-Core but does not mention PQMicroLib-Core, PQE2E Messaging SDK, hardware IP cores, or FIPS 203/204/205.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-030_PQShield_Ltd..html (61.0 KB)
- **Extraction Timestamp**: 2026-05-07T07:25:58

## VND-181 — Sectigo Ltd.

- **Vendor ID**: VND-181
- **Vendor Name**: Sectigo Ltd.
- **Roadmap Title**: Sectigo Certificate Manager: Private PKI PQC Sandbox (ML-DSA)
- **Roadmap URL**: https://www.sectigo.com/enterprise-solutions/certificate-manager/private-pqc
- **Publish Date**: 2026-04-14
- **Local File**: public/vendor-roadmaps/VND-181_Sectigo_Ltd..html
- **CSV Coverage Notes**: Sectigo Certificate Manager · IoT Manager · Code Signing
- **PQC Algorithms Announced**: ML-DSA
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Sectigo Certificate Manager (SCM)
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: Partial; mentions "hybrid certificates" as part of strategy definition, but the sandbox specifically leverages "supported ML-DSA algorithms" for private experimental certificates.
- **Current GA Status**: Preview; described as a "sandbox," "experiment," and "experimental PQC certificates" for learning and evaluation.
- **Customer Action Required**: Request access in SCM; Talk to us; Start your PQC journey with a free consultation.
- **Key Commitments & Quotes**: "Private PQC with SCM is a core part of Sectigo’s PQC readiness approach"; "Sectigo operates the private PQC CA and HSMs that support NIST PQC keys"; "Designed for learning and evaluation, Private PQC helps teams build early operational insight"
- **Coverage Verification**: MISMATCH; The document only discusses Sectigo Certificate Manager (SCM) and does not mention IoT Manager or Code Signing.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-181_Sectigo_Ltd..html (408.1 KB)
- **Extraction Timestamp**: 2026-05-07T07:27:28

## VND-057 — Cloudflare Inc.

- **Vendor ID**: VND-057
- **Vendor Name**: Cloudflare Inc.
- **Roadmap Title**: Cloudflare Post-Quantum Roadmap
- **Roadmap URL**: https://blog.cloudflare.com/post-quantum-roadmap/
- **Publish Date**: 2024-09-09
- **Local File**: public/vendor-roadmaps/VND-057_Cloudflare_Inc..html
- **CSV Coverage Notes**: Cloudflare CDN · Zero Trust · Workers · Gateway · WARP — targeting 2029 full PQ
- **PQC Algorithms Announced**: ML-KEM
- **Target Migration Dates**: 2029 for full post-quantum security including authentication
- **Products / Services Covered**: Cloudflare IPsec; Cloudflare One; Cloudflare products (general reference to entire product suite)
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: Yes, via hybrid ML-KEM for Cloudflare IPsec
- **Current GA Status**: GA (Cloudflare IPsec post-quantum encryption is generally available)
- **Customer Action Required**: None detected (document states "you do not need to take any mitigating action")
- **Key Commitments & Quotes**: "We now target 2029 to be fully post-quantum (PQ) secure including, crucially, post-quantum authentication."; "Cloudflare IPsec now has generally available support for post-quantum encryption via hybrid ML-KEM."; "every post-quantum upgrade we build will continue to be available to all customers, on every plan, at no additional cost"
- **Coverage Verification**: PARTIAL, the document confirms the 2029 target and mentions Cloudflare One (WARP/Zero Trust) and IPsec, but does not explicitly list CDN, Workers, or Gateway in the roadmap section.
- **Extraction Quality**: HIGH
- **Source Document**: VND-057_Cloudflare_Inc..html (302.3 KB)
- **Extraction Timestamp**: 2026-05-07T07:28:54
