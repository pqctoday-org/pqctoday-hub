---
generated: 2026-06-06
collection: vendor-roadmaps
enrichment_method: mlx-mlx-community/Qwen3.6-27B-8bit
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
- **CSV Coverage Notes**: AWS PQC migration plan: ML-KEM (FIPS 203) key exchange enabled across KMS, ACM, Secrets Manager, S3, CloudFront, API Gateway, ALB/NLB, Transfer Family, Payment Cryptography; ML-DSA (FIPS 204) signatures in AWS Private CA and KMS, CloudHSM ML-DSA in preview. Built on AWS-LC and s2n-tls. Some features transparently enabled, others customer-opt-in under shared responsibility model. | Milestone: ML-KEM hybrid key exchange live across KMS, ACM, Secrets Manager, S3, CloudFront (default client-to-edge), API Gateway, ALB/NLB, Transfer Family, Payment Cryptography; ML-DSA signing in Private CA and KMS,
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Elastic Load Balancers (ALB, NLB); API Gateway; CloudFront; Transfer Family; AWS Key Management Service (KMS); AWS Certificate Manager (ACM); AWS Secrets Manager; AWS Payment Cryptography; Amazon Simple Storage Service (S3); AWS Private Certificate Authority (Private CA); AWS CloudHSM; IAM Roles Anywhere
- **Compliance Frameworks**: NIST FIPS 203; NIST FIPS 204; NIST FIPS 205; NIST IR 8547; European Commission Recommendation on a Coordinated Implementation Roadmap; NCSC whitepaper; BSI Technical Guideline TR-02102; ANSSI position paper; ASD guidance; Canadian Centre for Cyber Security ITSM.40.001; UAE Cyber Security Council National Encryption Policy v1.0; G7 Cyber Expert Group coordinated roadmap; ASC X9 Post Quantum Cryptography Financial Readiness Needs Assessment; GSMA Post-Quantum Telco Network Taskforce guidelines
- **Hybrid Mode Support**: Yes, the document states that services offer "hybrid PQ-key exchange using ML-KEM" and references BSI guidelines recommending "hybrid post-quantum cryptography... combining traditional and quantum-resistant algorithms".
- **Current GA Status**: GA (General Availability), with CloudHSM ML-DSA support in preview.
- **Customer Action Required**: Update client-side components/SDKs to versions supporting ML-KEM; apply PQ-TLS policies to customer-owned resources; ensure applications use TLS 1.3; explicitly specify desired TLS policy in infrastructure-as-code; use IAM condition keys to restrict operations to allowlisted TLS policies.
- **Key Commitments & Quotes**: "AWS is migrating to post-quantum cryptography (PQC), and helping our customers do the same under a shared responsibility model."
- **Coverage Verification**: PARTIAL, the document confirms the listed services and ML-KEM/ML-DSA support but does not explicitly mention the underlying libraries "AWS-LC and s2n-tls" in the provided text.
- **Extraction Quality**: HIGH
- **Source Document**: VND-001_Amazon_Web_Services_Inc..html (311.1 KB)
- **Extraction Timestamp**: 2026-06-06T13:47:32

## VND-002 — Apple Inc.

- **Vendor ID**: VND-002
- **Vendor Name**: Apple Inc.
- **Roadmap Title**: Apple PQ3: iMessage Post-Quantum Security
- **Roadmap URL**: https://security.apple.com/blog/imessage-pq3/
- **Publish Date**: 2024-02-21
- **Local File**: public/vendor-roadmaps/VND-002_Apple_Inc..html
- **CSV Coverage Notes**: Apple PQ3 protocol for iMessage: hybrid Kyber/ML-KEM key establishment plus post-quantum ratcheting, achieving Apple's 'Level 3' messaging security (vs Signal PQXDH Level 2). Shipped from iOS 17.4 / macOS 14.4 (Feb 2024). CryptoKit exposes ML-KEM/ML-DSA APIs for developers (iOS 26+). | Milestone: iMessage PQ3 (Level 3, Kyber/ML-KEM hybrid with ongoing post-quantum rekeying ~every 50 messages / 7 days) rolled out from iOS/iPadOS 17.4 and macOS 14.4, fully replacing the prior protocol across supported conversations.
- **PQC Algorithms Announced**: Kyber; ML-KEM
- **Target Migration Dates**: fully replace the existing protocol within all supported conversations this year
- **Products / Services Covered**: iMessage; iOS 17.4; iPadOS 17.4; macOS 14.4; watchOS 10.4
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: Yes; PQ3 employs a hybrid design that combines Elliptic Curve cryptography with post-quantum encryption both during the initial key establishment and during rekeying.
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "PQ3 is the first messaging protocol to reach what we call Level 3 security"; "it will fully replace the existing protocol within all supported conversations this year"; "PQ3 employs a hybrid design that combines Elliptic Curve cryptography with post-quantum encryption"
- **Coverage Verification**: PARTIAL; The document confirms the PQ3 protocol, Level 3 security, hybrid Kyber/ML-KEM, and iOS 17.4/macOS 14.4 rollout, but does not mention CryptoKit APIs, iOS 26, or specific rekeying intervals (50 messages/7 days).
- **Extraction Quality**: HIGH
- **Source Document**: VND-002_Apple_Inc..html (103.6 KB)
- **Extraction Timestamp**: 2026-06-06T13:48:09

## VND-005 — BlackBerry Limited

- **Vendor ID**: VND-005
- **Vendor Name**: BlackBerry Limited
- **Roadmap Title**: BlackBerry & NXP: Preparing Against Y2Q Post-Quantum Cyber Attacks (Certicom + QNX)
- **Roadmap URL**: https://www.prnewswire.com/news-releases/blackberry-and-nxp-join-forces-to-help-companies-prepare-for-and-prevent-y2q-post-quantum-cyber-attacks-301554427.html
- **Publish Date**: 2022-05-25
- **Local File**: public/vendor-roadmaps/VND-005_BlackBerry_Limited.html
- **CSV Coverage Notes**: BlackBerry has no single consolidated PQC roadmap page; its PQC work runs through the Certicom division and QNX. Official BlackBerry/NXP press release describes Certicom Code Signing & Key Management Server using CRYSTALS-Dilithium (ML-DSA) for quantum-resistant code/firmware/OTA signing and SBOMs on NXP S32G; QNX secure boot uses quantum-safe signatures. BlackBerry/Certicom states it is deploying finalized NIST standards (ML-KEM, ML-DSA, SLH-DSA, HQC). | Milestone: BlackBerry Certicom Code Signing and Key Management Server uses CRYSTALS-Dilithium (ML-DSA) for quantum-resistant secure boot, fi
- **PQC Algorithms Announced**: CRYSTALS Dilithium
- **Target Migration Dates**: None detected
- **Products / Services Covered**: BlackBerry Certicom Code Signing and Key Management Server; NXP S32G vehicle networking processors
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: None detected
- **Current GA Status**: Planned
- **Customer Action Required**: Register to attend the "Post-Quantum Cyber Attacks, how to Prepare and Prevent" webinar on June 9, 2022
- **Key Commitments & Quotes**: "provide support for quantum-resistant secure boot signatures for NXP® Semiconductors' (NASDAQ: NXPI ) crypto-agile S32G vehicle networking processors"; "digitally signed using the National Institute of Standards and Technology's (NIST) recently endorsed CRYSTALS Dilithium digital signature scheme"; "mitigates the risk of potential quantum computing attacks on critical software updates"
- **Coverage Verification**: PARTIAL — The document confirms the Certicom/NXP collaboration and Dilithium usage but does not mention QNX, ML-KEM, SLH-DSA, or HQC.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-005_BlackBerry_Limited.html (205.0 KB)
- **Extraction Timestamp**: 2026-06-06T14:05:22

## VND-008 — Cisco Systems Inc.

- **Vendor ID**: VND-008
- **Vendor Name**: Cisco Systems Inc.
- **Roadmap Title**: Cisco Secure Firewall: Post-Quantum Cryptography Roadmap
- **Roadmap URL**: https://blogs.cisco.com/security/preparing-for-post-quantum-cryptography-the-secure-firewall-roadmap
- **Publish Date**: 2026-04-13
- **Local File**: public/vendor-roadmaps/VND-008_Cisco_Systems_Inc..html
- **CSV Coverage Notes**: Cisco Secure Firewall PQC roadmap: ML-KEM arrives in FTD 10.5 / ASA 9.25 (GA late 2026) for IPsec VPN and SKIP key management; ML-DSA and SLH-DSA planned for FTD/ASA 11.0 in H2 2027 with broader TLS decryption, Remote Access VPN and management access. Driven by NSA NSS Jan 2027 purchase requirements and CNSA 2.0 deadlines through 2035. Broader Cisco PQC spans IOS XE/XR, Meraki, Webex, AnyConnect. | Milestone: ML-KEM in Secure Firewall Threat Defense (FTD) 10.5 and ASA 9.25 targeted GA late 2026 (IPsec VPN + SKIP key management); ML-DSA/SLH-DSA planned for FTD/ASA 11.0 in H2 CY2027 with broader
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA
- **Target Migration Dates**: ML-KEM GA late 2026; ML-DSA and SLH-DSA H2 2027; NSA NSS purchases after January 2027; EU deadlines through 2035
- **Products / Services Covered**: Secure Firewall Threat Defense (FTD) 10.5; ASA 9.25; FTD/ASA 11.0; Secure Firewall 1200; Secure Firewall 6100 series
- **Compliance Frameworks**: NIST FIPS 203; NIST FIPS 204; NIST FIPS 205; NSA National Security Systems; CNSA 2.0; BSI; ANSSI
- **Hybrid Mode Support**: Yes, via RFC 9242 and RFC 9370 enabling hybrid key exchange with classical and post-quantum key agreement simultaneously
- **Current GA Status**: Planned
- **Customer Action Required**: Know where encryption lives; build upgrade paths into planning cycles; plan upgrade windows; think about hardware now for PQC Secure Boot
- **Key Commitments & Quotes**: "Support arrives in Secure Firewall Threat Defense (FTD) 10.5 and ASA 9.25 , targeted for General Availability in late 2026."
- **Coverage Verification**: CONSISTENT, the document confirms ML-KEM in FTD 10.5/ASA 9.25 (late 2026) and ML-DSA/SLH-DSA in FTD/ASA 11.0 (H2 2027), aligning with the CSV notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-008_Cisco_Systems_Inc..html (82.4 KB)
- **Extraction Timestamp**: 2026-06-06T14:06:33

## VND-012 — DigiCert Inc.

- **Vendor ID**: VND-012
- **Vendor Name**: DigiCert Inc.
- **Roadmap Title**: DigiCert Post-Quantum Cryptography — Trust Lifecycle Manager
- **Roadmap URL**: https://www.digicert.com/post-quantum-cryptography
- **Publish Date**: 2025-01-01
- **Local File**: public/vendor-roadmaps/VND-012_DigiCert_Inc..html
- **CSV Coverage Notes**: DigiCert PQC product page centered on Trust Lifecycle Manager (DigiCert ONE) and crypto-agility: discover, inventory and manage certificates at scale to prepare for ML-KEM/ML-DSA migration. Supporting resources include PQC test servers/playgrounds (DigiCert Labs), a 'PQC for Dummies' ebook and readiness webinars. Page is undated and gives no explicit per-algorithm GA timeline. | Milestone: DigiCert positions Trust Lifecycle Manager (DigiCert ONE) for crypto-agility — continuous certificate discovery/inventory and at-scale management to enable transition to NIST ML-KEM/ML-DSA; provides PQC test
- **Extraction Error**: Extracted text too short (82 chars)
- **Extraction Timestamp**: 2026-06-06T14:07:32

## VND-013 — Entrust Corporation

- **Vendor ID**: VND-013
- **Vendor Name**: Entrust Corporation
- **Roadmap Title**: Entrust Post-Quantum Cryptography Solutions
- **Roadmap URL**: https://www.entrust.com/solutions/post-quantum-cryptography
- **Publish Date**: 2024-01-01
- **Local File**: public/vendor-roadmaps/VND-013_Entrust_Corporation.html
- **CSV Coverage Notes**: Entrust PQC solutions page covering nShield HSMs, KeyControl, PKI and Certificate Services, and identity solutions for the quantum-safe transition (NIST ML-KEM/ML-DSA). Content could not be re-read this pass due to a server block. | Milestone: Entrust quantum-safe portfolio across nShield HSMs, KeyControl, PKI/Certificate Services and identity solutions supporting NIST ML-KEM/ML-DSA; specific dated milestones not confirmable this pass.
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: nShield HSMs; Public Key Infrastructure (PKI); Cryptographic Security Platform
- **Compliance Frameworks**: NIST; IETF
- **Hybrid Mode Support**: Yes, the document states that Entrust solutions support a hybrid approach, combining today’s algorithms with PQC to maintain backwards compatibility.
- **Current GA Status**: Planned
- **Customer Action Required**: Take a self-assessment to understand readiness; fill out a form to connect with an Entrust expert.
- **Key Commitments & Quotes**: "Entrust helps organizations protect long-lived information, maintain compliance, and prepare for the quantum era with crypto-agile solutions designed to evolve as standards and threats change."
- **Coverage Verification**: PARTIAL, the document confirms nShield HSMs, PKI, and Cryptographic Security Platform, but does not explicitly mention KeyControl or identity solutions in the context of PQC.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-013_Entrust_Corporation.html (195.4 KB)
- **Extraction Timestamp**: 2026-06-06T14:07:32

## VND-014 — F5 Networks Inc.

- **Vendor ID**: VND-014
- **Vendor Name**: F5 Networks Inc.
- **Roadmap Title**: F5 BIG-IP v21.1 GA: Post-Quantum Cryptography & AI Security Enhancements
- **Roadmap URL**: https://www.f5.com/company/blog/f5-big-ip-v21-1-is-now-generally-available-bringing-pqc-and-ai-security-enhancements
- **Publish Date**: 2026-05-06
- **Local File**: public/vendor-roadmaps/VND-014_F5_Networks_Inc..html
- **CSV Coverage Notes**: F5 PQC readiness: BIG-IP began hybrid X25519+ML-KEM-768 TLS 1.3 in v17.5.0/17.5.1; v21.1 (GA 2026-05-06) adds FIPS 203 ML-KEM hybrid cipher groups SecP256r1ML-KEM-768 and SecP384r1ML-KEM-1024 for client/server TLS and quantum-resistant TLS/SSL VPN tunneling. NGINX Plus enables PQC for APIs/microservices; SSL Orchestrator centralizes quantum-safe management; F5 Distributed Cloud included. | Milestone: BIG-IP v21.1 (GA May 2026) adds NIST FIPS 203 ML-KEM hybrid cipher groups SecP256r1ML-KEM-768 and SecP384r1ML-KEM-1024 for client- and server-side TLS, plus quantum-resistant TLS/SSL VPN tunneling
- **PQC Algorithms Announced**: ML-KEM
- **Target Migration Dates**: None detected
- **Products / Services Covered**: F5 BIG-IP LTM; NGINX Plus; F5 BIG-IP SSL Orchestrator; F5 BIG-IP Zero Trust Access (ZTA); F5 Application Delivery and Security Platform (ADSP)
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: Yes; The document states that a hybrid implementation strategy combines classical encryption with post-quantum algorithms to preserve compatibility.
- **Current GA Status**: GA
- **Customer Action Required**: Act now to deploy quantum-resistant encryption; identify where encryption terminates; enforce quantum-safe algorithms; adopt crypto-agile controls.
- **Key Commitments & Quotes**: "F5 ADSP delivers end-to-end post-quantum cryptography (PQC) with National Institute of Standards and Technologies (NIST)-approved algorithms"
- **Coverage Verification**: PARTIAL; The document confirms the products and general NIST compliance but does not explicitly state the specific version numbers (v17.5.0, v21.1), dates (2026-05-06), or specific cipher group names (SecP256r1ML-KEM-768) found in the CSV notes.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-014_F5_Networks_Inc..html (1133.3 KB)
- **Extraction Timestamp**: 2026-06-06T14:08:10

## VND-016 — Fortinet Inc.

- **Vendor ID**: VND-016
- **Vendor Name**: Fortinet Inc.
- **Roadmap Title**: Fortinet Advances Quantum-Safe Security for FortiOS 7.6 (ML-KEM, BIKE, HQC, QKD)
- **Roadmap URL**: https://www.fortinet.com/corporate/about-us/newsroom/press-releases/2025/fortinet-advances-quantum-safe-security-to-guard-against-emerging-quantum-threats
- **Publish Date**: 2025-07-22
- **Local File**: public/vendor-roadmaps/VND-016_Fortinet_Inc..html
- **CSV Coverage Notes**: Fortinet quantum-safe security: FortiOS 7.6 brings NIST ML-KEM plus emerging KEMs (BIKE, HQC, FrodoKEM), algorithm stacking and hybrid transition mode to FortiGate NGFW and Secure SD-WAN at no added cost; QKD integration support began in FortiOS 7.4. Targets harvest-now-decrypt-later risk in telecom, finance, government, healthcare. | Milestone: FortiOS 7.6 delivers quantum-safe features to FortiGate NGFW and Secure SD-WAN at no extra cost: NIST ML-KEM plus emerging BIKE, HQC and FrodoKEM, algorithm stacking and hybrid transition mode; QKD integration support introduced in FortiOS 7.4.
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: FortiOS 7.6; FortiGate NGFW; Fortinet Secure SD-WAN
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: Yes; "stack algorithms for more robust protection" and "easily transition to post-quantum security"
- **Current GA Status**: GA; "made cutting-edge, quantum-safe features available today"
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "protect against quantum-computing threats to current encryption standards"; "safeguard their critical data and future-proof their infrastructures"; "confidently transition to post-quantum security"
- **Coverage Verification**: MISMATCH; The document text does not mention ML-KEM, BIKE, HQC, FrodoKEM, QKD, or specific algorithm names, contradicting the CSV notes.
- **Extraction Quality**: LOW
- **Source Document**: VND-016_Fortinet_Inc..html (261.1 KB)
- **Extraction Timestamp**: 2026-06-06T14:09:12

## VND-017 — Futurex Inc.

- **Vendor ID**: VND-017
- **Vendor Name**: Futurex Inc.
- **Roadmap Title**: Futurex CryptoHub: NIST PQC Standards Use Cases (FIPS 203/204/205)
- **Roadmap URL**: https://www.futurex.com/blog/new-nist-pqc-standards-use-cases
- **Publish Date**: 2026-06-05
- **Local File**: public/vendor-roadmaps/VND-017_Futurex_Inc..html
- **CSV Coverage Notes**: Futurex CryptoHub positioned as all-in-one PQC-ready platform spanning HSM, key management, PKI/CA and data protection (cloud/on-prem/hybrid). Supports the three finalized NIST standards (ML-KEM, ML-DSA, SLH-DSA) and is preparing Falcon/FN-DSA. Vectera Plus HSM. Blog last updated 2026-06-05 (was recorded 2024-09-01). | Milestone: CryptoHub supports FIPS 203 ML-KEM, FIPS 204 ML-DSA, FIPS 205 SLH-DSA; preparing FN-DSA (Falcon) support
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: None detected
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: None detected
- **Current GA Status**: No PQC
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: None detected
- **Coverage Verification**: MISMATCH — The provided document text consists entirely of website navigation menus and footer links, containing no specific PQC roadmap details, algorithm support lists, or FIPS compliance statements to verify the CSV notes.
- **Extraction Quality**: LOW
- **Source Document**: VND-017_Futurex_Inc..html (603.7 KB)
- **Extraction Timestamp**: 2026-06-06T14:09:49

## VND-018 — Google LLC

- **Vendor ID**: VND-018
- **Vendor Name**: Google LLC
- **Roadmap Title**: Google Cloud Post-Quantum Cryptography
- **Roadmap URL**: https://cloud.google.com/security/resources/post-quantum-cryptography
- **Publish Date**: 2025-10-01
- **Local File**: public/vendor-roadmaps/VND-018_Google_LLC.html
- **CSV Coverage Notes**: Google Cloud PQC: ML-KEM migrated for internal/network traffic and default Cloud network encryption; Cloud KMS quantum-safe digital signatures (ML-DSA-65, SLH-DSA-SHA2-128S) preview Feb 2025 and KEM support preview Oct 2025, committing to FIPS 203/204/205 in both Cloud KMS (software) and Cloud HSM (hardware). Implementations open-sourced via BoringCrypto/BoringSSL and Tink (HPKE for Java/C++/Go/Python). Chrome and Android PQC support. Infra connection rollout targeted 2026. | Milestone: Quantum-safe KEMs in Cloud KMS in preview (Oct 2025); quantum-safe digital signatures (ML-DSA-65, SLH-DSA-SH
- **PQC Algorithms Announced**: ML-KEM; Kyber
- **Target Migration Dates**: 2029
- **Products / Services Covered**: Cloud KMS; Chrome; Android; BoringSSL; Tink; OpenSK
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: Yes; "hybrid deployments of PQC and classic cryptography"
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Google has set 2029 as the deadline for Google’s PQC migration to secure the quantum era."
- **Coverage Verification**: PARTIAL; The document confirms the 2029 deadline, ML-KEM/Kyber usage, and hybrid strategy, but does not explicitly state the specific Cloud KMS preview dates (Feb/Oct 2025), specific signature algorithms (ML-DSA-65, SLH-DSA-SHA2-128S), or FIPS 203/204/205 commitments found in the CSV notes.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-018_Google_LLC.html (2124.2 KB)
- **Extraction Timestamp**: 2026-06-06T14:10:18

## VND-019 — IBM Corporation

- **Vendor ID**: VND-019
- **Vendor Name**: IBM Corporation
- **Roadmap Title**: IBM Quantum-Safe Roadmap
- **Roadmap URL**: https://research.ibm.com/blog/quantum-safe-roadmap
- **Publish Date**: 2023-05-10
- **Local File**: public/vendor-roadmaps/VND-019_IBM_Corporation.html
- **CSV Coverage Notes**: IBM Quantum-Safe Roadmap (page dated 2023-05-10, unchanged) outlines crypto-agility via the IBM Quantum Safe portfolio: Explorer (code scanning / cryptographic artifact discovery), Advisor (posture & compliance analysis, CBOM), and Remediator (test/implement hybrid quantum-safe remediation). Phased path: inventory (2023), adopt NIST standards (2024), CNSA 2.0 preference (2025). Also Guardium, z/OS, OpenSSL integrations. | Milestone: IBM Quantum Safe Explorer/Advisor/Remediator for crypto inventory (CBOM), risk analysis, and hybrid quantum-safe remediation; aligned to NIST 2024 standards and 20
- **PQC Algorithms Announced**: CRYSTALS-Kyber; CRYSTALS-Dilithium; Falcon
- **Target Migration Dates**: 2023 (cryptography inventory/CBOM); 2024 (NIST post-quantum cryptography standards publication); 2025 (NSA preference for quantum-safe algorithms)
- **Products / Services Covered**: IBM Quantum Safe Explorer; IBM Quantum Safe Advisor; IBM Quantum Safe Remediator; IBM z16; IBM Tape
- **Compliance Frameworks**: NIST; FIPS; CNSA 2.0
- **Hybrid Mode Support**: Yes; Remediator supports a hybrid implementation approach using classical and quantum-safe cryptography during transition
- **Current GA Status**: GA; Explorer and Advisor released, first generation of Remediator released
- **Customer Action Required**: Complete cryptography inventory; create a Cryptography Bill of Materials (CBOM); begin quantum-safe transition
- **Key Commitments & Quotes**: "This roadmap serves as a commitment to transparency, predictability, and confidence as we guide industries along their journey to post-quantum cryptography."
- **Coverage Verification**: PARTIAL; The document confirms the roadmap date, portfolio names, and phased timeline, but does not mention Guardium, z/OS, or OpenSSL integrations.
- **Extraction Quality**: HIGH
- **Source Document**: VND-019_IBM_Corporation.html (84.2 KB)
- **Extraction Timestamp**: 2026-06-06T14:10:59

## VND-021 — Infineon Technologies AG

- **Vendor ID**: VND-021
- **Vendor Name**: Infineon Technologies AG
- **Roadmap Title**: Infineon Post-Quantum Cryptography
- **Roadmap URL**: https://www.infineon.com/promo/postquantumcryptography
- **Publish Date**: 2025-10-15
- **Local File**: public/vendor-roadmaps/VND-021_Infineon_Technologies_AG.html
- **CSV Coverage Notes**: Infineon PQC hub: SLC27 security controller (TEGRION family, Integrity Guard 32) launched Oct 2025 with Common Criteria-certified PQC library (ML-KEM, ML-DSA), crypto-agility and in-field updates, hardened against fault/side-channel. PSOC Control C3 Performance Line samples by end-2025, production 2026 adding ML-DSA on-device key gen/signing and ML-KEM for TLS. Automotive MCUs upgraded for PQC; LMS support. | Milestone: SLC27 PQC-certified contactless/dual-interface security controller launched Oct 2025 with CC-certified ML-KEM + ML-DSA crypto library (TEGRION family, Integrity Guard 32); PSOC
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: None detected
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: None detected
- **Current GA Status**: No PQC
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: None detected
- **Coverage Verification**: MISMATCH — The provided document text is a generic website navigation menu and product list that contains no mention of PQC, SLC27, ML-KEM, ML-DSA, or the specific roadmap details cited in the CSV notes.
- **Extraction Quality**: LOW
- **Source Document**: VND-021_Infineon_Technologies_AG.html (1682.4 KB)
- **Extraction Timestamp**: 2026-06-06T14:11:44

## VND-024 — Keyfactor Inc.

- **Vendor ID**: VND-024
- **Vendor Name**: Keyfactor Inc.
- **Roadmap Title**: Keyfactor Post-Quantum Cryptography Lab
- **Roadmap URL**: https://www.keyfactor.com/post-quantum-cryptography-lab/
- **Publish Date**: 2025-01-01
- **Local File**: public/vendor-roadmaps/VND-024_Keyfactor_Inc..html
- **CSV Coverage Notes**: Keyfactor PQC Lab is a resource hub (webinars, sandboxed test envs, toolkits) emphasizing crypto-agility ahead of the 2035 deadline. EJBCA 9.1 and SignServer 7.1 add quantum-safe algorithms (Dilithium/ML-DSA, SPHINCS+/SLH-DSA, Falcon) via Bouncy Castle APIs; Keyfactor Command for certificate lifecycle/IoT PKI; ACME support. Free trials on Azure Marketplace. | Milestone: EJBCA 9.1 and SignServer 7.1 deliver PQC: issuance/signing with ML-DSA (Dilithium), SLH-DSA (SPHINCS+) and Falcon via Bouncy Castle; Command available for crypto-agile PKI/cert lifecycle
- **PQC Algorithms Announced**: Dilithium; SPHINCS+; Falcon
- **Target Migration Dates**: 2035
- **Products / Services Covered**: Keyfactor Command; SignServer; Bouncy Castle APIs; PQC Lab
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: Partial, with brief description: The document mentions "Post-quantum hybrid cryptography in Bouncy Castle" in a video title and discusses "Hybrid Certificates" in a blog title, but does not explicitly detail the hybrid mode implementation in the main text.
- **Current GA Status**: GA
- **Customer Action Required**: Get hands-on with a free SaaS-based PKI sandbox; start a 30-day trial of Keyfactor Command or SignServer in Azure; download Bouncy Castle; assess PKI maturity.
- **Key Commitments & Quotes**: "Crypto-agility—swapping cryptographic algorithms quickly and confidently—is essential, as all encryption must be post-quantum secure by 2035."
- **Coverage Verification**: CONSISTENT, the document confirms the PQC Lab as a resource hub with sandbox/trials, mentions the 2035 deadline, and lists Dilithium, SPHINCS+, and Falcon support in SignServer and via Bouncy Castle, aligning with the CSV notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-024_Keyfactor_Inc..html (177.4 KB)
- **Extraction Timestamp**: 2026-06-06T14:12:28

## VND-025 — The Legion of the Bouncy Castle Inc.

- **Vendor ID**: VND-025
- **Vendor Name**: The Legion of the Bouncy Castle Inc.
- **Roadmap Title**: Bouncy Castle: NIST PQC Standards Support (Java 1.79+)
- **Roadmap URL**: https://www.bouncycastle.org/resources/latest-nist-pqc-standards-and-more-bouncy-castle-java-1-79/
- **Publish Date**: 2024-10-31
- **Local File**: public/vendor-roadmaps/VND-025_The_Legion_of_the_Bouncy_Castle_Inc..html
- **CSV Coverage Notes**: Bouncy Castle Java 1.79 (released 2024-10-31) adds the finalized NIST PQC algorithms ML-KEM, ML-DSA and SLH-DSA, CMS KEM support (RFC 9269), enhanced OpenPGP (Argon2, v6 sigs), and draft Composite Signatures / Delta-Chameleon support for migration planning. PQC Almanac provides Java and C# (.NET) migration guidance. | Milestone: Bouncy Castle Java 1.79 ships finalized NIST PQC: ML-KEM, ML-DSA, SLH-DSA; CMS KEM support per RFC 9269; draft Composite Signatures and Delta/Chameleon for migration testing
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Bouncy Castle Java 1.79; Bouncy Castle C# .NET
- **Compliance Frameworks**: NIST; RFC 9269
- **Hybrid Mode Support**: Yes, with brief description: Supports X.509 hybrid certificates and draft Composite Signatures for transitioning from classical to post-quantum standards.
- **Current GA Status**: GA
- **Customer Action Required**: Download the PQC Almanac for migration guidance; use draft implementations for testing and migration planning rather than production deployment.
- **Key Commitments & Quotes**: "supporting the newly standardized NIST Post-Quantum Cryptography (PQC) algorithms, including the ML-KEM key encapsulation mechanism and the ML-DSA and SLH-DSA signature algorithms"; "Bouncy Castle Java's CMS API now supports using KEMs within Cryptographic Message Syntax, adhering to RFC 9269"; "implementations are intended for testing and migration planning rather than production deployment"
- **Coverage Verification**: CONSISTENT, the document explicitly confirms the release date, algorithms, RFC 9269 support, PGP enhancements, and draft status of composite signatures.
- **Extraction Quality**: HIGH
- **Source Document**: VND-025_The_Legion_of_the_Bouncy_Castle_Inc..html (268.3 KB)
- **Extraction Timestamp**: 2026-06-06T14:13:11

## VND-027 — Microsoft Corporation

- **Vendor ID**: VND-027
- **Vendor Name**: Microsoft Corporation
- **Roadmap Title**: Microsoft Quantum-Safe Security: Progress Towards Next-Generation Cryptography
- **Roadmap URL**: https://www.microsoft.com/en-us/security/blog/2025/08/20/quantum-safe-security-progress-towards-next-generation-cryptography/
- **Publish Date**: 2025-08-20
- **Local File**: public/vendor-roadmaps/VND-027_Microsoft_Corporation.html
- **CSV Coverage Notes**: Microsoft quantum-safe roadmap: SymCrypt foundation with ML-KEM/ML-DSA exposed through Windows CNG and certificate APIs; SymCrypt 1.9.0 adds TLS hybrid key exchange (coming to Windows TLS stack). PQC previewing for Windows Insiders and Linux. Three-phase strategy (foundational libs -> core infra/Entra/key mgmt/signing -> all services Windows/Azure/M365). Early adoption by 2029, full transition by 2033. | Milestone: ML-KEM and ML-DSA available via Windows APIs (CNG/Certificate funcs); SymCrypt 1.9.0 supports TLS hybrid key exchange; early adoption by 2029, full transition by 2033 (ahead of 2035
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; FrodoKEM
- **Target Migration Dates**: Early adoption by 2029; full transition by 2033
- **Products / Services Covered**: SymCrypt; Windows CNG; Certificate and Cryptographic messaging functions; SymCrypt-OpenSSL; Windows TLS stack; Microsoft Entra; Azure Key Vault; Windows; Microsoft Azure; Microsoft 365; Linux
- **Compliance Frameworks**: NIST; CNSA 2.0; CNSSP-15; ISO; IETF; OMB; CISA; NSA; ETSI; DMTF; OCP
- **Hybrid Mode Support**: Yes, TLS hybrid key exchange supported in SymCrypt-OpenSSL 1.9.0 and planned for Windows TLS stack; strategy includes hybrid approach combining classical and quantum-resistant algorithms.
- **Current GA Status**: Preview
- **Customer Action Required**: Start developing their strategy now; proactively prepare their software and services for PQC support; begin exploration and integration of quantum-safe algorithms into their environments.
- **Key Commitments & Quotes**: "Microsoft’s roadmap aims to complete transition of its services and products by 2033"; "aiming to enable early adoption of quantum-safe capabilities by 2029"; "we’ve enabled TLS hybrid key exchange as per the latest IETF internet draft"
- **Coverage Verification**: CONSISTENT, the document explicitly confirms the SymCrypt foundation, ML-KEM/ML-DSA availability via CNG/Certificate APIs, SymCrypt 1.9.0 TLS hybrid support, preview status for Windows Insiders/Linux, the three-phase strategy, and the 2029/2033 timeline.
- **Extraction Quality**: HIGH
- **Source Document**: VND-027_Microsoft_Corporation.html (313.6 KB)
- **Extraction Timestamp**: 2026-06-06T14:14:08

## VND-028 — NXP Semiconductors N.V.

- **Vendor ID**: VND-028
- **Vendor Name**: NXP Semiconductors N.V.
- **Roadmap Title**: NXP: Prepare for the Quantum Breakthrough with PQC
- **Roadmap URL**: https://www.nxp.com/company/about-nxp/smarter-world-blog/BL-PREPARE-FOR-THE-QUANTUM
- **Publish Date**: 2024-11-01
- **Local File**: public/vendor-roadmaps/VND-028_NXP_Semiconductors_N.V..html
- **CSV Coverage Notes**: NXP PQC strategy: i.MX 94 is NXP's first applications processor family integrating PQC via the EdgeLock secure enclave (unveiled Electronica Nov 2024); S32K5 automotive MCUs provide PQC-secure hardware root-of-trust for signature verification, secure boot/firmware update and crypto-agility over multi-decade vehicle lifecycles. JCOP smart cards; NXP contributes to NIST PQC standardization. Companion official resource: NXP 'Securing Tomorrow' PQC strategy training. | Milestone: i.MX 94 (first NXP applications processor with PQC, EdgeLock secure enclave) launched at Electronica Nov 2024; S32K5 au
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: None detected
- **Compliance Frameworks**: NIST; BSI; IEC 62443; ISO 18013
- **Hybrid Mode Support**: None detected
- **Current GA Status**: No PQC
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "NXP security engineers and cryptographers are contributing to the NIST PQC standardization effort"; "NXP strives to ensure its products offer the long-term security protection"; "NXP is addressing issues around the larger key sizes, key serialization re-using existing hardware"
- **Coverage Verification**: MISMATCH — The document is a 2022 blog post that predates the 2024 Electronica launch of i.MX 94 and S32K5, and does not mention these specific products or the 'Securing Tomorrow' training.
- **Extraction Quality**: LOW
- **Source Document**: VND-028_NXP_Semiconductors_N.V..html (345.8 KB)
- **Extraction Timestamp**: 2026-06-06T14:15:07

## VND-029 — Oracle Corporation

- **Vendor ID**: VND-029
- **Vendor Name**: Oracle Corporation
- **Roadmap Title**: Securing Oracle AI Database 26ai for the Quantum Era
- **Roadmap URL**: https://blogs.oracle.com/database/oracle-ai-database-26ai-pqc
- **Publish Date**: 2025-10-01
- **Local File**: public/vendor-roadmaps/VND-029_Oracle_Corporation.html
- **CSV Coverage Notes**: Oracle AI Database 26ai now ships ML-KEM (FIPS 203) key exchange and ML-DSA (FIPS 204) certificate/signing support, with hybrid classical+PQC key establishment for TLS 1.3/SSH/IKEv2 (23.26.0 Oct 2025, hybrid in 23.26.1 Jan 2026). Java JDK 26 (Mar 2026) adds ML-DSA JAR signing and Hybrid Public Key Encryption API; OCI and Oracle Key Vault roadmap continue. | Milestone: Oracle AI Database 26ai: ML-KEM key exchange + ML-DSA certificates shipped in release 23.26.0 (Oct 2025); hybrid (classical+PQC) key exchange for TLS 1.3 added in 23.26.1 (Jan 2026); JDK 26 adds ML-DSA JAR signing + HPKE API (Mar
- **PQC Algorithms Announced**: ML-KEM; ML-DSA
- **Target Migration Dates**: Public certificate authorities are expected to adopt ML-DSA-based certificates by 2026
- **Products / Services Covered**: Oracle AI Database 26ai; Oracle Call Interface (OCI) drivers; SQL\*Plus; SQL Developer; ODP.NET Unmanaged
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: Yes; The document states that during migration, the server can simultaneously accept traditional and quantum-safe TLS 1.3 clients until all clients support ML-KEM.
- **Current GA Status**: GA
- **Customer Action Required**: Build an inventory of cryptographic algorithms; update configurations to utilize AES-256 and TLS 1.3 with ML-KEM; re-encrypt existing data with AES-256; enable ML-KEM key exchange in TLS 1.3; use self-signed ML-DSA certificates if needed.
- **Key Commitments & Quotes**: "Oracle AI Database 26ai is among the first database systems to provide quantum-safe TLS for encrypting network connections."
- **Coverage Verification**: MISMATCH; The document confirms ML-KEM and ML-DSA support in Oracle AI Database 26ai but does not mention release version numbers (23.26.0/23.26.1), JDK 26, SSH/IKEv2 support, or FIPS 203/204 compliance.
- **Extraction Quality**: HIGH
- **Source Document**: VND-029_Oracle_Corporation.html (56.2 KB)
- **Extraction Timestamp**: 2026-06-06T14:15:48

## VND-030 — PQShield Ltd.

- **Vendor ID**: VND-030
- **Vendor Name**: PQShield Ltd.
- **Roadmap Title**: PQShield PQCryptoLib-SDK: ML-KEM and ML-DSA
- **Roadmap URL**: https://pqshield.com/products/pqc-sdk/
- **Publish Date**: 2025-09-01
- **Local File**: public/vendor-roadmaps/VND-030_PQShield_Ltd..html
- **CSV Coverage Notes**: PQShield's PQCryptoLib-Core is FIPS 140-3 CMVP-certified (ML-KEM/FIPS 203 + ML-DSA/FIPS 204, hybrid ECDH+ML-KEM) and listed on NIST's Implementation Under Test list. Product family: PQCryptoLib-SDK (OpenSSL 3.x integration), PQMicroLib-Core, hardware IP cores (PQPlatform-CoPro, PQPerform-Flare/Inferno/Flex), PQE2E messaging. FIPS 203/204/205 coverage. | Milestone: PQCryptoLib-Core achieved FIPS 140-3 CMVP certification (incl. ML-KEM FIPS 203 + ML-DSA FIPS 204 and hybrid ECDH+ML-KEM); now progressing on NIST IUT/MIP list toward expanded validation.
- **PQC Algorithms Announced**: ML-KEM; ML-DSA
- **Target Migration Dates**: None detected
- **Products / Services Covered**: PQCryptoLib-SDK; PQCryptoLib-Core
- **Compliance Frameworks**: FIPS 140-3; CAVP; CMVP
- **Hybrid Mode Support**: None detected
- **Current GA Status**: GA
- **Customer Action Required**: Contact us for an evaluation; Complete the form below to download the Product Brief and arrange a Product Evaluation
- **Key Commitments & Quotes**: "PQCryptoLib-SDK provides implementations of ML-KEM and ML-DSA."
- **Coverage Verification**: PARTIAL — The document confirms PQCryptoLib-SDK integrates PQCryptoLib-Core and mentions FIPS 140-3 readiness, but does not explicitly state the CMVP certification status or NIST IUT listing mentioned in the notes.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-030_PQShield_Ltd..html (61.0 KB)
- **Extraction Timestamp**: 2026-06-06T14:16:46

## VND-031 — Palo Alto Networks Inc.

- **Vendor ID**: VND-031
- **Vendor Name**: Palo Alto Networks Inc.
- **Roadmap Title**: Palo Alto Networks Post-Quantum Migration Planning and Preparation
- **Roadmap URL**: https://docs.paloaltonetworks.com/network-security/quantum-security/administration/quantum-security-concepts/post-quantum-migration-planning-and-preparation
- **Publish Date**: 2026-05-26
- **Local File**: public/vendor-roadmaps/VND-031_Palo_Alto_Networks_Inc..html
- **CSV Coverage Notes**: Official PQC migration planning guidance (updated May 2026). Five-step migration framework (resources, responsibilities, crypto inventory, evaluation/testing, monitoring) and Mosca model for urgency. Quantum-resistant IKEv2 VPNs on PAN-OS 11.1+ via RFC 8784, plus RFC 9242/9370 multi/hybrid key exchange; Quantum-Safe Security app for cryptographic inventory. | Milestone: PAN-OS 11.1+ quantum-resistant IKEv2 VPNs via RFC 8784 (immediate priority), with RFC 9242/9370 for multiple/hybrid IKEv2 key exchanges; Quantum-Safe Security app for crypto inventory.
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: PAN-OS 11.1 or later; Quantum-Safe Security app
- **Compliance Frameworks**: NIST; NSA; RFC 8784; RFC 9242; RFC 9370; RFC 6379
- **Hybrid Mode Support**: Yes, the document states "the industry is adopting hybrid keys" and recommends using "a strong classic KEM... and one or more PQCs" to provide an extra layer of security.
- **Current GA Status**: GA (General Availability), as the document states "Post-quantum IKEv2 VPNs ( RFC 8784 ) are the first step... which you can do now" on PAN-OS 11.1+.
- **Customer Action Required**: Assign resources and build awareness; define responsibilities; develop a cryptographic inventory and priority list; evaluate solutions, experiment, and test; continue to monitor progress; implement RFC 8784/9242/9370; upgrade to Suite-B-GCM-256; upgrade CA to 4K RSA; upgrade to SHA-384/512.
- **Key Commitments & Quotes**: "Post-quantum IKEv2 VPNs ( RFC 8784 ) are the first step to creating a secure post-quantum network, which you can do now without impacting your network."
- **Coverage Verification**: PARTIAL, the document confirms the five-step framework, Mosca model, PAN-OS 11.1+ support for RFC 8784/9242/9370, and the Quantum-Safe Security app, but the update date is April 15, 2026, not May 2026.
- **Extraction Quality**: HIGH
- **Source Document**: VND-031_Palo_Alto_Networks_Inc..html (292.5 KB)
- **Extraction Timestamp**: 2026-06-06T14:17:25

## VND-032 — Red Hat Inc.

- **Vendor ID**: VND-032
- **Vendor Name**: Red Hat Inc.
- **Roadmap Title**: Red Hat Enterprise Linux 10 Post-Quantum Cryptography
- **Roadmap URL**: https://www.redhat.com/en/technologies/linux-platforms/enterprise-linux-10/post-quantum-cryptography
- **Publish Date**: 2025-05-01
- **Local File**: public/vendor-roadmaps/VND-032_Red_Hat_Inc..html
- **CSV Coverage Notes**: RHEL 10 incorporates NIST-approved quantum-resistant algorithms (ML-KEM for key exchange/encryption, ML-DSA for signing) across the platform crypto stack, available since RHEL 10 GA. Positioned against harvest-now-decrypt-later threat; page cites quantum risk to asymmetric crypto by ~2029. RPM ML-DSA signing, OpenSSL/GnuTLS/NSS and OpenShift integration continue per Red Hat roadmap. | Milestone: RHEL 10 ships NIST-standardized PQC (ML-KEM key exchange/encryption, ML-DSA signing) system-wide, addressing harvest-now-decrypt-later ahead of ~2029 CRQC risk.
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: By 2029, advances in quantum computing could make asymmetric cryptography unsafe and by 2034 fully breakable.
- **Products / Services Covered**: Red Hat Enterprise Linux 10
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: None detected
- **Current GA Status**: GA
- **Customer Action Required**: begin testing NIST-approved, quantum-resistant algorithms with your organization to start protecting your data and preparing to meet future regulatory requirements
- **Key Commitments & Quotes**: "Red Hat Enterprise Linux 10 includes the first installment of PQC algorithms, based on NIST-approved standards, that enable key-exchange, encryption, and signing."
- **Coverage Verification**: MISMATCH - The document text does not explicitly name ML-KEM or ML-DSA, nor does it mention RPM signing, OpenSSL, GnuTLS, NSS, or OpenShift integration, which are central to the CSV notes.
- **Extraction Quality**: LOW
- **Source Document**: VND-032_Red_Hat_Inc..html (567.7 KB)
- **Extraction Timestamp**: 2026-06-06T14:18:28

## VND-035 — Samsung Electronics Co. Ltd.

- **Vendor ID**: VND-035
- **Vendor Name**: Samsung Electronics Co. Ltd.
- **Roadmap Title**: The First Step to a Quantum-Safe Future With Samsung Knox
- **Roadmap URL**: https://news.samsung.com/global/the-first-step-to-a-quantum-safe-future-with-samsung-knox
- **Publish Date**: 2025-01-22
- **Local File**: public/vendor-roadmaps/VND-035_Samsung_Electronics_Co.\_Ltd..html
- **CSV Coverage Notes**: Samsung Knox Matrix gains Post-Quantum Enhanced Data Protection (EDP) using ML-KEM (FIPS 203, lattice-based), debuting on Galaxy S25 (first device on One UI 7) — industry-first PQC-based cloud/cross-device data protection. Extends quantum-safe protection across the Knox cross-device trust ecosystem. | Milestone: Galaxy S25 (One UI 7) is first to support PQC-based cloud data protection: ML-KEM (FIPS 203) integrated into Knox Matrix via Post-Quantum Enhanced Data Protection (EDP).
- **PQC Algorithms Announced**: ML-KEM
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Galaxy S25 series; Samsung Knox Matrix; Samsung Cloud; One UI 7
- **Compliance Frameworks**: NIST; FIPS 203
- **Hybrid Mode Support**: None detected
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Samsung is introducing Post-Quantum Enhanced Data Protection (EDP) to Samsung Knox Matrix"; "The Galaxy S25 series is the first in the industry to support PQC-based cloud data protection"; "Knox Matrix’s cross-device compatibility will ensure seamless quantum-safe protection"
- **Coverage Verification**: CONSISTENT. The document confirms ML-KEM integration into Knox Matrix via EDP on Galaxy S25/One UI 7 as an industry-first for cloud data protection.
- **Extraction Quality**: HIGH
- **Source Document**: VND-035_Samsung_Electronics_Co.\_Ltd..html (148.6 KB)
- **Extraction Timestamp**: 2026-06-06T14:18:52

## VND-037 — Securosys SA

- **Vendor ID**: VND-037
- **Vendor Name**: Securosys SA
- **Roadmap Title**: Securosys Post-Quantum Cryptography HSM
- **Roadmap URL**: https://www.securosys.com/en/hsm/post-quantum-cryptography
- **Publish Date**: 2024-08-20
- **Local File**: public/vendor-roadmaps/VND-037_Securosys_SA.html
- **CSV Coverage Notes**: Securosys PQC HSM offering across Primus CyberVault on-prem HSMs and CloudHSM (Economy/Sandbox tiers). Supports the five NIST-standardized PQC algorithms — ML-KEM, ML-DSA, SLH-DSA, HSS-LMS, XMSS — and hybrid classical+PQC operations for gradual migration. Collaborates with HSLU researchers on PQC TLS performance (key agreement + authentication). | Milestone: Primus X CyberVault HSM and CloudHSM support all five NIST PQC algorithms (ML-KEM, ML-DSA, SLH-DSA, HSS-LMS, XMSS) with hybrid RSA/ECC+PQC operations.
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA; HSS-LMS; XMSS
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Primus HSM CyberVault (X2 Models); Primus HSM CyberVault Core (E2 Model); Primus HSM X-Series; Primus HSM E-Series; Primus HSM S-Series; Securosys CloudHSM; CloudHSM Economy (ECO); CloudHSM Sandbox (SBX)
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: Yes; Integrating classical algorithms like RSA and ECC/ED with PQC signatures and key exchange, enabling a secure and phased transition to quantum-resistant cryptography.
- **Current GA Status**: GA
- **Customer Action Required**: Start a 90-free trial; Test Securosys HSM PQC in a Controlled Environment; Contact our sales team
- **Key Commitments & Quotes**: "Our Primus CyberVault HSMs and CloudHSM services fully support PQC algorithms"
- **Coverage Verification**: CONSISTENT; The document explicitly confirms support for ML-KEM, ML-DSA, SLH-DSA, HSS-LMS, and XMSS on Primus CyberVault and CloudHSM (Economy/Sandbox), hybrid operations, and collaboration with HSLU on TLS performance.
- **Extraction Quality**: HIGH
- **Source Document**: VND-037_Securosys_SA.html (274.3 KB)
- **Extraction Timestamp**: 2026-06-06T14:19:13

## VND-041 — Thales Group

- **Vendor ID**: VND-041
- **Vendor Name**: Thales Group
- **Roadmap Title**: Thales Luna HSM v7.9: Quantum-Safe Encryption
- **Roadmap URL**: https://cpl.thalesgroup.com/blog/encryption/luna-hsm-pqc-quantum-safe-encryption
- **Publish Date**: 2025-07-29
- **Local File**: public/vendor-roadmaps/VND-041_Thales_Group.html
- **CSV Coverage Notes**: Luna HSM v7.9 adds production-ready native ML-KEM (FIPS 203) and ML-DSA (FIPS 204) directly in firmware, validated for PKI, TLS/SSL, IoT, code signing and DB encryption with partners (DigiCert, Keyfactor); FIPS 140-3 Level 3 validation in progress. Broader Thales quantum-safe portfolio: CipherTrust Manager and High Speed Encryptors. | Milestone: Luna HSM firmware v7.9 natively integrates ML-KEM (FIPS 203) and ML-DSA (FIPS 204) into firmware (no external functionality modules); FIPS 140-3 Level 3 validation underway.
- **PQC Algorithms Announced**: ML-KEM; ML-DSA
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Luna HSM v7.9
- **Compliance Frameworks**: FIPS 203; FIPS 204; FIPS 140-3 Level 3
- **Hybrid Mode Support**: Yes, "Hybrid PQC encryption for secure key synchronization, backup, and restore."
- **Current GA Status**: GA (production-ready)
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Luna HSM v7.9 offers native support for: ML-KEM (FIPS 203) and ML-DSA (FIPS 204) — fully integrated into firmware"; "FIPS 140-3 Level 3 validation in progress"; "production-ready, NIST-approved post-quantum cryptography (PQC)"
- **Coverage Verification**: PARTIAL, the document confirms Luna HSM v7.9 details but does not mention the broader portfolio items CipherTrust Manager and High Speed Encryptors.
- **Extraction Quality**: HIGH
- **Source Document**: VND-041_Thales_Group.html (114.5 KB)
- **Extraction Timestamp**: 2026-06-06T14:20:01

## VND-042 — Utimaco IS GmbH

- **Vendor ID**: VND-042
- **Vendor Name**: Utimaco IS GmbH
- **Roadmap Title**: Utimaco Quantum Protect — PQC Application Package for GP HSM
- **Roadmap URL**: https://utimaco.com/data-protection/gp-hsm/application-package/quantum-protect
- **Publish Date**: 2025-04-02
- **Local File**: public/vendor-roadmaps/VND-042_Utimaco_IS_GmbH.html
- **CSV Coverage Notes**: Utimaco Quantum Protect extends u.trust General Purpose HSM Se-Series with PQC via in-field firmware upgrade (no hardware swap). Supports ML-KEM (FIPS 203), ML-DSA (FIPS 204), and hash-based LMS/HSS/XMSS/XMSS-MT; SLH-DSA (FIPS 205) on the roadmap (in progress). Crypto-agile design plus a free PQC simulator for pre-deployment evaluation. | Milestone: Quantum Protect on u.trust GP HSM Se-Series supports ML-KEM (FIPS 203) + ML-DSA (FIPS 204) and LMS/HSS/XMSS/XMSS-MT today; SLH-DSA (FIPS 205) in progress.
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; LMS; HSS; XMSS; XMSS-MT; SLH-DSA
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Quantum Protect; u.trust General Purpose HSM Se-Series; Quantum Protect Simulator
- **Compliance Frameworks**: FIPS 203; FIPS 204; FIPS 205
- **Hybrid Mode Support**: None detected
- **Current GA Status**: GA
- **Customer Action Required**: Use the free simulator to evaluate how PQC algorithms work within your environment and use case
- **Key Commitments & Quotes**: "Quantum Protect extends the u.trust General Purpose HSM Se-Series with proven and standardized Post Quantum Cryptography algorithms"; "Quantum Protect is available as seamless in-field upgrade for the u.trust General Purpose HSM Se-Series – no HSM exchange needed"; "More algorithms such as SLH-DSA are on the roadmap"
- **Coverage Verification**: CONSISTENT, the document explicitly confirms support for ML-KEM, ML-DSA, LMS, HSS, XMSS, XMSS-MT, and SLH-DSA (in progress) on the u.trust GP HSM Se-Series via in-field upgrade with a free simulator.
- **Extraction Quality**: HIGH
- **Source Document**: VND-042_Utimaco_IS_GmbH.html (282.6 KB)
- **Extraction Timestamp**: 2026-06-06T14:20:45

## VND-045 — wolfSSL Inc.

- **Vendor ID**: VND-045
- **Vendor Name**: wolfSSL Inc.
- **Roadmap Title**: wolfSSL Support for NIST PQC Standards (ML-KEM & ML-DSA)
- **Roadmap URL**: https://www.wolfssl.com/support-for-the-official-post-quantum-standards-ml-kem-and-ml-dsa/
- **Publish Date**: 2024-10-01
- **Local File**: public/vendor-roadmaps/VND-045_wolfSSL_Inc..html
- **CSV Coverage Notes**: wolfSSL/wolfCrypt have full production support for ML-KEM (FIPS 203) and ML-DSA (FIPS 204), usable across wolfSSL, wolfBoot and wolfPKCS11 for embedded/IoT/TLS. SLH-DSA (FIPS 205) offered for specialized applications on request. Page revised Sep/Oct 2024. | Milestone: Full ML-KEM (FIPS 203) and ML-DSA (FIPS 204) implementation shipping in wolfSSL/wolfCrypt today; SLH-DSA available on request
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA; Kyber; Dilithium; SPHINCS+; LMS; XMSS
- **Target Migration Dates**: None detected
- **Products / Services Covered**: wolfSSL; wolfCrypt
- **Compliance Frameworks**: FIPS 203; FIPS 204; FIPS 205
- **Hybrid Mode Support**: None detected
- **Current GA Status**: GA
- **Customer Action Required**: Download the wolfSSL library, configure it to enable Dilithium and Kyber, and run the benchmarks; contact facts@wolfSSL.com or +1 425 245 8247 for SLH-DSA implementation and support
- **Key Commitments & Quotes**: "we here at wolfSSL are announcing to the world that we have full implementation and support for ML-KEM and ML-DSA"
- **Coverage Verification**: PARTIAL — The document confirms full support for ML-KEM and ML-DSA in wolfSSL/wolfCrypt and SLH-DSA on request, but does not explicitly state usability across wolfBoot and wolfPKCS11 as noted in the CSV.
- **Extraction Quality**: HIGH
- **Source Document**: VND-045_wolfSSL_Inc..html (66.7 KB)
- **Extraction Timestamp**: 2026-06-06T14:21:27

## VND-057 — Cloudflare Inc.

- **Vendor ID**: VND-057
- **Vendor Name**: Cloudflare Inc.
- **Roadmap Title**: Cloudflare Post-Quantum Roadmap
- **Roadmap URL**: https://blog.cloudflare.com/post-quantum-roadmap/
- **Publish Date**: 2026-04-07
- **Local File**: public/vendor-roadmaps/VND-057_Cloudflare_Inc..html
- **CSV Coverage Notes**: Cloudflare's PQC roadmap (refreshed Apr 7, 2026) now targets full post-quantum security including PQ authentication by 2029, accelerated from prior timelines due to advances in attacks on elliptic-curve crypto. Focus shifting from encryption (harvest-now-decrypt-later) to PQ authentication across CDN, Zero Trust, Workers, Gateway and WARP. Intermediate milestones noted but not dated in this post. | Milestone: Target to be fully post-quantum secure (including post-quantum authentication) by 2029
- **PQC Algorithms Announced**: ML-KEM
- **Target Migration Dates**: 2029
- **Products / Services Covered**: Cloudflare IPsec; Cloudflare One
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: Yes, hybrid ML-KEM for Cloudflare IPsec
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "We now target 2029 to be fully post-quantum (PQ) secure including, crucially, post-quantum authentication."
- **Coverage Verification**: CONSISTENT, the document confirms the 2029 target for full PQ security including authentication, the acceleration due to recent crypto advances, and the shift in focus to authentication.
- **Extraction Quality**: HIGH
- **Source Document**: VND-057_Cloudflare_Inc..html (302.3 KB)
- **Extraction Timestamp**: 2026-06-06T14:21:53

## VND-058 — HashiCorp Inc.

- **Vendor ID**: VND-058
- **Vendor Name**: HashiCorp Inc.
- **Roadmap Title**: HashiCorp Post-Quantum Cryptography Plans
- **Roadmap URL**: https://www.hashicorp.com/en/blog/nist-s-post-quantum-cryptography-standards-our-plans
- **Publish Date**: 2024-09-04
- **Local File**: public/vendor-roadmaps/VND-058_HashiCorp_Inc..html
- **CSV Coverage Notes**: HashiCorp plans phased PQC adoption beginning with the Vault transit secrets engine, incorporating the three NIST algorithms (ML-KEM first; ML-DSA/SLH-DSA later) and hybrid classical+PQ schemes, expanding to other products as Go and standards bodies converge. No firm version/release dates given. | Milestone: Staged PQC rollout in Vault starting with the transit secrets engine, adopting NIST ML-KEM/ML-DSA/SLH-DSA and hybrid schemes as Go/standards support matures
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA; FN-DSA
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Vault transit secrets engine
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: Yes; HashiCorp plans to research and build support for hybrid schemes that enable current and post-quantum cryptography algorithms to coexist.
- **Current GA Status**: Planned
- **Customer Action Required**: Take immediate steps to reduce security risks; develop a plan for learning and implementing quantum-safe solutions; stay informed on evolving best practices; perform impact analysis; institute a PQC readiness program; prioritize and assess high-risk assets; discover and inventory cryptographic usage; enforce zero trust security; create a migration plan; monitor PQC implementation.
- **Key Commitments & Quotes**: "HashiCorp plans to develop and deliver quantum and hybrid PQC solutions in a staged manner, starting with PQC support in the Vault transit secrets engine."
- **Coverage Verification**: CONSISTENT; The document explicitly confirms the staged rollout in Vault transit secrets engine, adoption of the three NIST algorithms, hybrid schemes, and dependency on Go/standards maturity, with no firm dates.
- **Extraction Quality**: HIGH
- **Source Document**: VND-058_HashiCorp_Inc..html (274.8 KB)
- **Extraction Timestamp**: 2026-06-06T14:22:17

## VND-059 — Venafi Inc.

- **Vendor ID**: VND-059
- **Vendor Name**: Venafi Inc.
- **Roadmap Title**: Venafi/CyberArk: Experimental PQC Support (TLS + CodeSign Protect, TPP 24.3)
- **Roadmap URL**: https://docs.venafi.com/Docs/24.3/TopNav/Content/CodeSigning/t-codesigning-pqc.php
- **Publish Date**: 2025-07-01
- **Local File**: public/vendor-roadmaps/VND-059_Venafi_Inc..html
- **CSV Coverage Notes**: Venafi/CyberArk Trust Protection Platform 24.3 provides experimental PQC support: ML-DSA and SLH-DSA in CodeSign Protect (with libhsm/PKCS#11), and Falcon limited to TLS certificates in TLS Protect. Marked experimental to aid PQC migration planning. Doc topic updated 01 Jul 2025. | Milestone: Experimental PQC support in Trust Protection Platform 24.3 — ML-DSA & SLH-DSA in CodeSign Protect, Falcon for TLS certificates
- **PQC Algorithms Announced**: ML-DSA; SLH-DSA; Falcon
- **Target Migration Dates**: None detected
- **Products / Services Covered**: CodeSign Protect; Trust Protection Platform; TLS Protect
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: No
- **Current GA Status**: Experimental
- **Customer Action Required**: Contact Venafi for activation instructions; set up self-signed CA template; create Key Pair environment template; create Key Pair environment; obtain grant; sync keystore; sign and verify using PQC keys
- **Key Commitments & Quotes**: "This feature it is experimental and is intended to help you start planning for future PQC migration."
- **Coverage Verification**: CONSISTENT — The document confirms experimental support for ML-DSA and SLH-DSA in CodeSign Protect and Falcon for TLS certificates in TPP 24.3, matching the CSV notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-059_Venafi_Inc..html (47.3 KB)
- **Extraction Timestamp**: 2026-06-06T14:22:51

## VND-060 — Okta Inc.

- **Vendor ID**: VND-060
- **Vendor Name**: Okta Inc.
- **Roadmap Title**: Okta Ventures: PQC as Strategic Focus Area
- **Roadmap URL**: https://www.okta.com/blog/customers-and-partners/okta-ventures-request-for-builders-five-key-focus-areas-in-identity-and-security/
- **Publish Date**: 2025-04-01
- **Local File**: public/vendor-roadmaps/VND-060_Okta_Inc..html
- **CSV Coverage Notes**: Okta's only public PQC-related statement is via Okta Ventures' 'Request for Builders' (Apr 1, 2025), naming post-quantum cryptography as one of five identity/security investment focus areas. This is advisory/investment-oriented, not an Okta product roadmap; no concrete Okta product PQC milestones or dates published. | Milestone: No concrete Okta product PQC milestone; PQC named as an Okta Ventures investment focus area only
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: None detected
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: None detected
- **Current GA Status**: No PQC
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "preparing for the quantum era, Identity security is foundational to building trust"
- **Coverage Verification**: CONSISTENT — The document confirms PQC is an investment focus area for Okta Ventures but contains no product roadmap, milestones, or technical implementation details.
- **Extraction Quality**: LOW
- **Source Document**: VND-060_Okta_Inc..html (277.6 KB)
- **Extraction Timestamp**: 2026-06-06T14:23:14

## VND-112 — Metaco / Ripple

- **Vendor ID**: VND-112
- **Vendor Name**: Metaco / Ripple
- **Roadmap Title**: Post-Quantum Readiness on the XRP Ledger
- **Roadmap URL**: https://ripple.com/insights/post-quantum-readiness-on-the-xrp-ledger/
- **Publish Date**: 2026-04-20
- **Local File**: public/vendor-roadmaps/VND-112_Metaco_Ripple.html
- **CSV Coverage Notes**: Ripple's official PQC roadmap (Apr 20, 2026) lays out a four-phase XRPL plan: (1) ongoing Q-Day readiness/contingency planning, (2) proactive planning & experimentation in H1 2026, (3) exploration of post-quantum primitives in H2 2026, (4) full transition to PQ signatures targeting 2028. Includes custody prototype work with Project Eleven and quantum-safe signature research. No Metaco-branded PQC roadmap; Ripple is the parent/relevant source. | Milestone: Full transition to post-quantum signatures on the XRP Ledger targeting 2028; PQ primitive exploration in H2 2026
- **PQC Algorithms Announced**: ML-DSA
- **Target Migration Dates**: Full transition to post-quantum signatures targeting 2028; proactive planning and experimentation in 1st half of 2026; exploration of post-quantum primitives in 2nd half of 2026
- **Products / Services Covered**: XRP Ledger (XRPL); Project Eleven custody wallet prototype; AlphaNet; Devnet
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: Yes; "proof-of-concept hybrid post-quantum signing implementation" and "integrating candidate post-quantum signature schemes alongside existing elliptic curve signatures"
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "target for full readiness by 2028"; "testing a number of NIST-recommended schemes"; "design, build and propose a new amendment to the XRPL ecosystem for native post-quantum cryptography"
- **Coverage Verification**: CONSISTENT; The document explicitly details the four-phase roadmap, dates, Project Eleven collaboration, and ML-DSA experimentation as described in the notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-112_Metaco_Ripple.html (138.6 KB)
- **Extraction Timestamp**: 2026-06-06T14:23:36

## VND-116 — Signal Foundation

- **Vendor ID**: VND-116
- **Vendor Name**: Signal Foundation
- **Roadmap Title**: Signal PQXDH: Post-Quantum Key Agreement
- **Roadmap URL**: https://signal.org/blog/pqxdh/
- **Publish Date**: 2023-09-19
- **Local File**: public/vendor-roadmaps/VND-116_Signal_Foundation.html
- **CSV Coverage Notes**: Signal app PQXDH protocol combines X25519 ECDH with CRYSTALS-Kyber (ML-KEM) for quantum-resistant initial key agreement; implemented in libsignal and live in client apps. Subsequent SPQR (Sparse Post-Quantum Ratchet) work extends PQC beyond the handshake. | Milestone: PQXDH (X25519 + CRYSTALS-Kyber/ML-KEM hybrid) shipped in Signal clients and libsignal; default for new chats with plan to phase out classic X3DH. Follow-on SPQR/Triple Ratchet work extends PQC to the ongoing ratchet.
- **PQC Algorithms Announced**: CRYSTALS-Kyber
- **Target Migration Dates**: In the coming months (after sufficient time has passed for everyone using Signal to update), we will disable X3DH for new chats and require PQXDH for all new chats.
- **Products / Services Covered**: Signal’s client applications; libsignal
- **Compliance Frameworks**: NIST Standardization Process for Post-Quantum Cryptography
- **Hybrid Mode Support**: Yes; The protocol computes a shared secret using both X25519 and CRYSTALS-Kyber, combining them so an attacker must break both systems.
- **Current GA Status**: GA; The new protocol is already supported in the latest versions of Signal’s client applications and is in use for chats initiated after both sides are using the latest software.
- **Customer Action Required**: Update to the latest Signal software to enable PQXDH for new chats.
- **Key Commitments & Quotes**: "we are augmenting our existing cryptosystems such that an attacker must break both systems in order to compute the keys protecting people’s communications."
- **Coverage Verification**: PARTIAL; The document confirms PQXDH (X25519 + CRYSTALS-Kyber) is live and will replace X3DH, but does not mention SPQR or extending PQC to the ongoing ratchet.
- **Extraction Quality**: HIGH
- **Source Document**: VND-116_Signal_Foundation.html (19.7 KB)
- **Extraction Timestamp**: 2026-06-06T14:24:01

## VND-127 — Broadcom Inc.

- **Vendor ID**: VND-127
- **Vendor Name**: Broadcom Inc.
- **Roadmap Title**: VMware Cloud Foundation Post-Quantum Readiness
- **Roadmap URL**: https://blogs.vmware.com/cloud-foundation/2026/04/28/post-quantum-readiness-on-vcf/
- **Publish Date**: 2026-04-28
- **Local File**: public/vendor-roadmaps/VND-127_Broadcom_Inc..html
- **CSV Coverage Notes**: VMware Cloud Foundation - vSAN/VM/vMotion AES-256 data-at-rest; Avi (NSX ALB) hybrid PQC TLS key exchange live; CNSA 2.0-aligned rollout with full transition by 2035; FIPS-gated ML-KEM/ML-DSA integration; CBOM/crypto-agility initiative. | Milestone: Broadcom commits VCF to CNSA 2.0 timelines with full quantum-resistant transition by 2035. Today VCF uses AES-256 for vSAN/VM/vMotion encryption; Avi Load Balancer already supports hybrid PQC key exchange in TLS. Broader PQC adoption gated on FIPS-certified libraries (FIPS 206 expected late 2026/early 2027) and TPM 2.0 v185 ML-KEM/ML-DSA support.
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA
- **Target Migration Dates**: Full transition to quantum-resistant algorithms required by 2035; deprecating RSA-2048 and other quantum-vulnerable algorithms by 2030; disallowing them by 2035
- **Products / Services Covered**: VMware Cloud Foundation (VCF); VMware Avi Load Balancer; VMware vSAN; VMware vCenter; hypervisor
- **Compliance Frameworks**: CNSA 2.0; NIST IR 8547; FIPS 206; TPM 2.0 v185; X.509
- **Hybrid Mode Support**: Yes, VMware Avi Load Balancer already supports hybrid post-quantum key exchange in TLS; VCF will support hybrid TLS key exchange combining conventional and PQC algorithms (typically ML-KEM)
- **Current GA Status**: GA (Avi Load Balancer supports hybrid PQC key exchange in TLS)
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Broadcom is committed to adopting PQC-resistant algorithms and methods for VCF on the timelines mandated by the NSA through CNSA 2.0, with full transition to quantum-resistant algorithms required by 2035."
- **Coverage Verification**: CONSISTENT, the document explicitly confirms AES-256 usage for vSAN/VM/vMotion, live hybrid PQC TLS in Avi, CNSA 2.0 alignment with a 2035 deadline, FIPS gating for ML-KEM/ML-DSA, and the CBOM initiative.
- **Extraction Quality**: HIGH
- **Source Document**: VND-127_Broadcom_Inc..html (96.6 KB)
- **Extraction Timestamp**: 2026-06-06T14:24:26

## VND-146 — Robust Intelligence (Cisco AI Defense)

- **Vendor ID**: VND-146
- **Vendor Name**: Robust Intelligence (Cisco AI Defense)
- **Roadmap Title**: Cisco Post-Quantum Cryptography (Trust Center)
- **Roadmap URL**: https://www.cisco.com/site/us/en/about/trust-center/post-quantum-cryptography.html
- **Publish Date**: 2026-02-01
- **Local File**: public/vendor-roadmaps/VND-146*Robust_Intelligence_Cisco_AI_Defense*.html
- **CSV Coverage Notes**: Robust Intelligence is now part of Cisco (AI Defense / Foundation AI); it has no separate PQC roadmap and inherits Cisco's program. Cisco Quantum Resilience Framework (quantum-safe communications + quantum-safe products) targets quantum-safe communications across most core products by Dec 2026; IOS XE 26 full-stack PQC; ML-KEM/ML-DSA/SLH-DSA rollout 2026-2027. | Milestone: Cisco commits to quantum-safe communications across most of its core portfolio by December 2026 under its Quantum Resilience Framework. Network examples: FTD 10.5/ASA 9.25 (ML-KEM VPN) targeted late 2026; FTD/ASA 11.0 add ML
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: December 2026
- **Products / Services Covered**: None detected
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: None detected
- **Current GA Status**: Planned
- **Customer Action Required**: Get the PQC transition guide; Watch webinar; Read white paper; Download overview
- **Key Commitments & Quotes**: "Cisco is committed to delivering quantum-safe communications across the majority of Cisco’s core portfolio by December 2026"
- **Coverage Verification**: PARTIAL — The document confirms the Dec 2026 commitment and framework but lacks specific product versions (FTD/ASA/IOS XE) and algorithm names (ML-KEM/ML-DSA/SLH-DSA) listed in the CSV notes.
- **Extraction Quality**: LOW
- **Source Document**: VND-146*Robust_Intelligence_Cisco_AI_Defense*.html (87.6 KB)
- **Extraction Timestamp**: 2026-06-06T14:24:59

## VND-151 — Microchip Technology Inc.

- **Vendor ID**: VND-151
- **Vendor Name**: Microchip Technology Inc.
- **Roadmap Title**: Microchip Technology Post-Quantum Cryptography (PQC)
- **Roadmap URL**: https://www.microchip.com/en-us/solutions/technologies/embedded-security/post-quantum-cryptography
- **Publish Date**: 2026-04-28
- **Local File**: public/vendor-roadmaps/VND-151_Microchip_Technology_Inc..html
- **CSV Coverage Notes**: Trust Shield PQC-ready portfolio: TS1800 Platform Root of Trust, TS500/TS501 secure boot controllers with hybrid PQC + classical firmware authentication (NIST SP 800-193 PFR, rollback protection, crisis recovery); x86 and Arm Cortex compatible; secure provisioning and crypto-agile architectures for CNSA 2.0 compliance. | Milestone: Microchip expanded its PQC-ready Trust Shield root-of-trust family (announced 2026-04-28): TS1800 Platform Root of Trust and TS50x secure boot controllers (TS500 in-line SoC-to-SPI-Flash, TS501 with integrated SPI Flash) using hybrid PQC + classical signature verifi
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: None detected
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: None detected
- **Current GA Status**: No PQC
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: None detected
- **Coverage Verification**: MISMATCH — The provided document text is a generic website navigation menu and contains no information regarding the Trust Shield PQC portfolio, TS1800/TS50x products, or the specific milestones mentioned in the CSV notes.
- **Extraction Quality**: LOW
- **Source Document**: VND-151_Microchip_Technology_Inc..html (693.7 KB)
- **Extraction Timestamp**: 2026-06-06T14:25:17

## VND-164 — Qualys Inc.

- **Vendor ID**: VND-164
- **Vendor Name**: Qualys Inc.
- **Roadmap Title**: Qualys CertView/Platform: PQC Detection Support
- **Roadmap URL**: https://docs.qualys.com/en/certview/latest/assets_certificates/pqc_details.htm
- **Publish Date**: 2026-04-01
- **Local File**: public/vendor-roadmaps/VND-164_Qualys_Inc..html
- **CSV Coverage Notes**: Qualys provides PQC scanning/detection capability: QID 38994 reports server support for PQC (KEM) key-exchange algorithms; coverage spans VM, Certificate View, WAS, EASM and authenticated VM scans. Doc is current (April 2026 copyright). User documentation for an existing capability rather than a forward-looking roadmap; no specific algorithm names or future milestone dates listed. | Milestone: PQC key-exchange detection across VM, CertView, WAS, EASM and VM_AUTH scans via QID 38994 (reports whether a server supports PQC KEM key exchange).
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: VM; Certificate View; WAS; EASM; VM_AUTH
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: None detected
- **Current GA Status**: GA
- **Customer Action Required**: Include QID 38994 in your option profile for PQC support
- **Key Commitments & Quotes**: "QID 38994 reports whether the server supports the PQC key exchange algorithm"; "The PQC-supported scan sources include VM, Certificate View, WAS, EASM, and VM_AUTH scans"; "View PQC-supported Key Encapsulation Mechanism (KEM) algorithms linked to the certificates"
- **Coverage Verification**: CONSISTENT. The document explicitly confirms QID 38994 usage, lists the exact scan sources (VM, Certificate View, WAS, EASM, VM_AUTH), and bears the April 2026 copyright, matching all details in the CSV notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-164_Qualys_Inc..html (56.4 KB)
- **Extraction Timestamp**: 2026-06-06T14:25:35

## VND-168 — Arqit Quantum Inc.

- **Vendor ID**: VND-168
- **Vendor Name**: Arqit Quantum Inc.
- **Roadmap Title**: Arqit Quantum-Safe Security Approach
- **Roadmap URL**: https://arqitgroup.com/company/our-approach
- **Publish Date**: 2025-01-01
- **Local File**: public/vendor-roadmaps/VND-168_Arqit_Quantum_Inc..html
- **CSV Coverage Notes**: Arqit's quantum-safe approach centers on the SKA Platform (Symmetric Key Agreement) delivering quantum-safe key agreement with perfect forward secrecy; products: PQC Migration / Encryption Intelligence (crypto discovery), SKA Edge & Central Controllers, NetworkSecure. FIPS 140-3 validated, hybrid/crypto-agile, supports symmetric-only provisioning. Formally verified (Tamarin, Univ. of Surrey). Recent 2024-2025 industry awards. | Milestone: FIPS 140-3 validated Symmetric Key Agreement (SKA) Platform with hybrid crypto-agility; software-only SKA Edge/Central Controllers plus NetworkSecure and PQC
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: PQC Migration; SKA Edge Controller; SKA Central Controller; Network Security; SKA-Platform
- **Compliance Frameworks**: FIPS
- **Hybrid Mode Support**: Yes; "Our standards-based hybrid approach maximizes compatibility, offers cryptoagility, and minimizes risk"
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Arqit’s protocols have been formally validated using the Tamarin prover method by the Surrey Centre for Cyber Security"; "We don’t rely on public/private keys and we operate with zero-trust principles"; "Arqit’s use of PQAs is limited to initial provisioning and customers can opt for symmetric-only provisioning"
- **Coverage Verification**: PARTIAL; The document confirms SKA, formal verification, and hybrid/crypto-agile aspects, but does not explicitly mention "NetworkSecure" or "Encryption Intelligence" by those specific names, nor does it mention FIPS 140-3 validation or recent awards.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-168_Arqit_Quantum_Inc..html (90.3 KB)
- **Extraction Timestamp**: 2026-06-06T14:25:54

## VND-171 — DocuSign

- **Vendor ID**: VND-171
- **Vendor Name**: DocuSign
- **Roadmap Title**: DocuSign: Post-Quantum-Kryptografie (Post-Quantum Cryptography, DE)
- **Roadmap URL**: https://www.docusign.com/de-de/blog/post-quanten-kryptografie
- **Publish Date**: 2026-02-25
- **Local File**: public/vendor-roadmaps/VND-171_DocuSign.html
- **CSV Coverage Notes**: DocuSign outlines a PQC strategy referencing ML-DSA (signatures), ML-KEM (key encapsulation) and SLH-DSA/SPHINCS+. Core approach is hybrid cryptography (RSA + ML-DSA) for crypto-agile, paced migration; three pillars: early planning, gradual hybrid transition, lifecycle protection of agreements. Note: English URL (/blog/post-quantum-cryptography) returns 404; canonical live page is the DE blog. | Milestone: Hybrid cryptography for e-signatures combining traditional algorithms (RSA) with PQC (ML-DSA), enabling phased migration; protecting agreements across full lifecycle against Harvest-Now-Decr
- **PQC Algorithms Announced**: ML-DSA
- **Target Migration Dates**: None detected
- **Products / Services Covered**: None detected
- **Compliance Frameworks**: NIST; Europäische Kommission
- **Hybrid Mode Support**: Yes; "hybride Kryptografie, die es sowohl traditionellen Algorithmen (wie RSA) als auch quantenresistenten Algorithmen (wie ML-DSA) ermöglicht, nebeneinander zu existieren"
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Docusign sichert digitale Vereinbarungen für die Quanten-Ära mit Post-Quanten-Kryptografie (PQC)."; "Die Strategie von Docusign unterstützt hybride Kryptografie..."; "entwickelt Docusign neue Sicherheitsfunktionen, die auf quantenresistenter Kryptografie und vertrauenswürdiger Zeitstempelung basieren."
- **Coverage Verification**: PARTIAL; The document confirms ML-DSA and hybrid RSA+ML-DSA but does not explicitly mention ML-KEM or SLH-DSA/SPHINCS+ in the provided text.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-171_DocuSign.html (483.5 KB)
- **Extraction Timestamp**: 2026-06-06T14:26:14

## VND-173 — GlobalSign Ltd.

- **Vendor ID**: VND-173
- **Vendor Name**: GlobalSign Ltd.
- **Roadmap Title**: GlobalSign Post-Quantum Computing
- **Roadmap URL**: https://www.globalsign.com/en/post-quantum-computing
- **Publish Date**: 2025-01-01
- **Local File**: public/vendor-roadmaps/VND-173_GlobalSign_Ltd..html
- **CSV Coverage Notes**: GlobalSign's PQC plan: Dilithium3 (->ML-DSA-65) for Root/Intermediate CA hierarchy, with ML-DSA likely for TLS/X.509 leaf certs and Kyber (ML-KEM) for PQ-safe TLS handshakes; updating OCSP/CRL status checks to PQ-safe methods. Emphasis on crypto-agility and inventory now; no firm calendar dates given. | Milestone: Dilithium3 (to become ML-DSA-65 at FIPS finalization) used for Root/Intermediate CAs; planned ML-DSA option for TLS/X.509 leaf certs and Kyber/ML-KEM for PQ-safe TLS handshakes; PQ-safe OCSP/CRL.
- **PQC Algorithms Announced**: Dilithium3; ML-DSA-65; Kyber; Dilithium2
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Root CA; Intermediate CA; Leaf/End Entity Certificates; OCSP; CRL
- **Compliance Frameworks**: NIST; FIPS 203
- **Hybrid Mode Support**: None detected
- **Current GA Status**: Planned
- **Customer Action Required**: Have an inventory of your certificates and keys; Identify and address any vulnerabilities; Develop a plan to replace vulnerable certificates and keys quickly; Maintain up-to-date ownership information; Automate management
- **Key Commitments & Quotes**: "Currently dilithium3 is used for the Root and the Intermediate CA."
- **Coverage Verification**: CONSISTENT — The document explicitly confirms the use of Dilithium3 for Root/Intermediate CAs, the likely transition to ML-DSA-65, the use of Kyber for key exchange, and the need to update OCSP/CRL to PQ-safe methods, matching the CSV notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-173_GlobalSign_Ltd..html (97.7 KB)
- **Extraction Timestamp**: 2026-06-06T14:26:39

## VND-178 — Ping Identity Holdings Corp.

- **Vendor ID**: VND-178
- **Vendor Name**: Ping Identity Holdings Corp.
- **Roadmap Title**: Ping Identity: Addressing the Quantum Threat in US Federal Government
- **Roadmap URL**: https://www.pingidentity.com/en/resources/blog/post/quantum-threat-us-fed-gov.html
- **Publish Date**: 2025-02-27
- **Local File**: public/vendor-roadmaps/VND-178_Ping_Identity_Holdings_Corp..html
- **CSV Coverage Notes**: Advisory blog (publ. 2025-02-27) covering NIST FIPS 203 (ML-KEM), 204 (ML-DSA), 205 (SLH-DSA) and the need for crypto-agility in IAM for federal buyers. Guidance/positioning piece - no specific Ping product PQC roadmap or dated milestones. | Milestone: No concrete product GA milestone; positions IAM around crypto-agility to transition to NIST FIPS 203 (ML-KEM), 204 (ML-DSA), 205 (SLH-DSA).
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA
- **Target Migration Dates**: None detected
- **Products / Services Covered**: None detected
- **Compliance Frameworks**: NIST FIPS 203; NIST FIPS 204; NIST FIPS 205; JOSE; COSE; IETF
- **Hybrid Mode Support**: None detected
- **Current GA Status**: No PQC
- **Customer Action Required**: Understand the Threat; Adopt PQC Standards; Partner with Experts
- **Key Commitments & Quotes**: "Continuous monitoring of post-quantum cryptography standards"; "Built-in flexibility to seamlessly transition to quantum-resistant cryptographic algorithms"; "Integration of quantum-resistant algorithms to safeguard sensitive data"
- **Coverage Verification**: CONSISTENT — The document is an advisory blog published on Feb 27, 2025, discussing NIST FIPS 203/204/205 and crypto-agility for IAM without specific product milestones.
- **Extraction Quality**: HIGH
- **Source Document**: VND-178_Ping_Identity_Holdings_Corp..html (61.4 KB)
- **Extraction Timestamp**: 2026-06-06T14:27:00

## VND-181 — Sectigo Ltd.

- **Vendor ID**: VND-181
- **Vendor Name**: Sectigo Ltd.
- **Roadmap Title**: Sectigo Certificate Manager: Private PQC (ML-DSA)
- **Roadmap URL**: https://www.sectigo.com/enterprise-solutions/certificate-manager/private-pqc
- **Publish Date**: 2026-04-14
- **Local File**: public/vendor-roadmaps/VND-181_Sectigo_Ltd..html
- **CSV Coverage Notes**: Sectigo Certificate Manager offers Private PQC: issue and manage private PQC certificates directly in SCM using supported ML-DSA algorithms (RFC 9881). Adoption guided by the Q.U.A.N.T. framework (Quantum exposure inventory, Uncover risk, Assess/strategize, Navigate implementation, Track/manage). References ~2030 quantum risk horizon. Page focuses on SCM Private PKI PQC; IoT/Code Signing PQC not detailed on this specific page. | Milestone: Private PQC in Sectigo Certificate Manager (SCM): issue/manage private PQC certificates using ML-DSA algorithms per RFC 9881; phased adoption via Q.U.A.N.T.
- **PQC Algorithms Announced**: ML-DSA
- **Target Migration Dates**: By 2030
- **Products / Services Covered**: Sectigo Certificate Manager (SCM)
- **Compliance Frameworks**: RFC 9881; NIST
- **Hybrid Mode Support**: Partial; mentions "hybrid certificates" as part of strategy definition in the Assess and strategize phase, but the specific Private PQC offering described uses ML-DSA.
- **Current GA Status**: Preview; described as "Private PQC in SCM" for "experimentation," "learning and evaluation," and "experimental PQC certificates."
- **Customer Action Required**: Request access in your SCM; Talk to us; Start your PQC journey with a free consultation.
- **Key Commitments & Quotes**: "Issue and manage private PQC certificates directly in SCM using supported ML-DSA algorithms"; "By 2030, advances in quantum computing are predicted to make the use of conventional asymmetric cryptography insecure"; "Sectigo’s Q.U.A.N.T. framework outlines the key stages organizations follow as they prepare for post-quantum cryptography"
- **Coverage Verification**: CONSISTENT; The document explicitly confirms SCM offers Private PQC using ML-DSA, references RFC 9881, details the Q.U.A.N.T. framework steps, and cites the 2030 risk horizon.
- **Extraction Quality**: HIGH
- **Source Document**: VND-181_Sectigo_Ltd..html (408.1 KB)
- **Extraction Timestamp**: 2026-06-06T14:27:20

## VND-183 — Splunk Inc. (Cisco)

- **Vendor ID**: VND-183
- **Vendor Name**: Splunk Inc. (Cisco)
- **Roadmap Title**: Quantum-Safe Cryptography & Standards: QSC, PQC, QKD & More
- **Roadmap URL**: https://www.splunk.com/en_us/blog/learn/quantum-safe-cryptography-standards.html
- **Publish Date**: 2023-08-23
- **Local File**: public/vendor-roadmaps/VND-183*Splunk_Inc.\_Cisco*.html
- **CSV Coverage Notes**: Educational Splunk blog explaining quantum-safe cryptography terminology (QSC, PQC, QKD) and the NIST-selected algorithms CRYSTALS-Kyber, CRYSTALS-Dilithium, FALCON, SPHINCS+. Advises waiting for standardized, tested implementations. Contains NO Splunk-specific product roadmap, GA dates, or concrete migration commitments. As Splunk is now a Cisco company, product PQC direction tracks Cisco's crypto-agility roadmap. Best available official Splunk source on PQC. | Milestone: No Splunk product-level PQC milestone published; article is educational only. Splunk (acquired by Cisco) defers to Cisco's
- **PQC Algorithms Announced**: CRYSTALS-Kyber; CRYSTALS-Dilithium; FALCON; SPHINCS+; BIKE; HQC; Classic McEliece; SIKE
- **Target Migration Dates**: None detected
- **Products / Services Covered**: None detected
- **Compliance Frameworks**: NIST SP 800-208
- **Hybrid Mode Support**: None detected
- **Current GA Status**: No PQC
- **Customer Action Required**: Auditing your systems; Making an asset inventory; Planning lifecycle management; wait for well-researched, international standards and implementations; do not roll your own cryptography
- **Key Commitments & Quotes**: "wait until they are. If you do this yourself, you’re likely to make a mistake."
- **Coverage Verification**: CONSISTENT. The document is an educational blog post explaining QSC/PQC/QKD terminology and NIST algorithms, advising to wait for standards, with no Splunk-specific product roadmap or migration commitments.
- **Extraction Quality**: HIGH
- **Source Document**: VND-183*Splunk_Inc.\_Cisco*.html (29.1 KB)
- **Extraction Timestamp**: 2026-06-06T14:27:46

## VND-056 — SEALSQ Corp.

- **Vendor ID**: VND-056
- **Vendor Name**: SEALSQ Corp.
- **Roadmap Title**: SEALSQ and IC'Alps Achieve Key Common Criteria Certification Milestones, Publish Full Post-Quantum Certification Roadmap
- **Roadmap URL**: https://www.globenewswire.com/news-release/2026/04/02/3267476/0/en/SEALSQ-and-IC-Alps-Achieve-Key-Common-Criteria-Certification-Milestones-Publish-Full-Post-Quantum-Certification-Roadmap.html
- **Publish Date**: 2026-04-02
- **Local File**: public/vendor-roadmaps/VND-056_SEALSQ_Corp..html
- **CSV Coverage Notes**: SEALSQ published a 'Full Post-Quantum Certification Roadmap' covering its QS7001 secure element and QVault TPM families with dated milestones (production samples, wafer fab-out, FIPS 140-3 submission, TCG/Common Criteria certification), explicitly aligned to the NSA CNSA 2.0 January 2027 compliance timeline. Supports ML-KEM, ML-DSA, FALCON in EAL5+ hardware. | Milestone: QS7001 V2 wafer fab-out targeted April 21, 2026; QVault TPM 183/185 FIPS 140-3 submission Sept 2026 and TCG certification Oct 2026; positioning ahead of CNSA 2.0 (Jan 2027).
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: NSA CNSA 2.0 January 2027 compliance timeline
- **Products / Services Covered**: QS7001 Secure Element (V1, V2); QVault Trusted Platform Module (TPM) 183; QVault Trusted Platform Module (TPM) 185
- **Compliance Frameworks**: Common Criteria (CC) EAL 5+; FIPS 140-3; TCG certification; NSA CNSA 2.0
- **Hybrid Mode Support**: None detected
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "This certification roadmap reflects our commitment to delivering hardware-anchored post-quantum security on a predictable, transparent timetable."
- **Coverage Verification**: MISMATCH — The document text does not explicitly state support for ML-KEM, ML-DSA, or FALCON algorithms, contradicting the CSV notes.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-056_SEALSQ_Corp..html (64.0 KB)
- **Extraction Timestamp**: 2026-06-06T14:28:07

## VND-225 — Proton AG

- **Vendor ID**: VND-225
- **Vendor Name**: Proton AG
- **Roadmap Title**: Proton is building quantum-safe PGP encryption for everyone
- **Roadmap URL**: https://proton.me/blog/post-quantum-encryption
- **Publish Date**: 2023-10-24
- **Local File**: public/vendor-roadmaps/VND-225_Proton_AG.html
- **CSV Coverage Notes**: Official Proton blog laying out their quantum-safe strategy: standardizing a post-quantum extension to OpenPGP (with German BSI and others since 2021), hybrid algorithms (CRYSTALS-Kyber + X25519 for encryption, CRYSTALS-Dilithium + Ed25519 for signatures), and a sequence of future steps (community standardization, symmetric-key/message re-encryption). May 2026 follow-through: Proton Mail rolled out post-quantum encryption to all users. | Milestone: May 2026 general rollout of post-quantum (OpenPGP v6, hybrid) encryption to all Proton Mail users; next: cross-provider interoperability (Thunderbi
- **PQC Algorithms Announced**: CRYSTALS-Kyber; CRYSTALS-Dilithium
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Proton Mail
- **Compliance Frameworks**: German Federal Office of Information Security (BSI)
- **Hybrid Mode Support**: Yes, using CRYSTALS-Kyber in combination with X25519 for encryption and CRYSTALS-Dilithium in combination with Ed25519 for signatures.
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Proton is leading the standardization of quantum-safe encryption algorithms in OpenPGP"; "we will use post-quantum cryptography in combination with classical cryptography"; "We will roll this out well before quantum computers become a threat"
- **Coverage Verification**: PARTIAL, the document confirms the strategy, algorithms, and BSI collaboration but does not mention the May 2026 rollout milestone as it was published in October 2023.
- **Extraction Quality**: HIGH
- **Source Document**: VND-225_Proton_AG.html (310.2 KB)
- **Extraction Timestamp**: 2026-06-06T14:28:28

## VND-009 — Citrix Systems Inc.

- **Vendor ID**: VND-009
- **Vendor Name**: Citrix Systems Inc.
- **Roadmap Title**: Leading the quantum-ready transition: How NetScaler helps prevent a silent data breach decades in the making
- **Roadmap URL**: https://www.citrix.com/blogs/2025/07/30/leading-the-quantum-ready-transition/
- **Publish Date**: 2025-07-30
- **Local File**: public/vendor-roadmaps/VND-009_Citrix_Systems_Inc..html
- **CSV Coverage Notes**: Official Citrix blog laying out NetScaler's PQC transition plan: hybrid NIST-aligned PQC (X25519 + ML-KEM768), private tech preview April 2025, general availability August 2025 (v14.1.51), plus a recommended customer migration timeline (Q2 2025 test in non-prod, Q3 2025 map critical systems, Q4 2025 phased rollout) and industry deadlines (2030 phase-out of deprecated crypto, 2035 fully disallowed). | Milestone: NetScaler hybrid PQC (X25519 + ML-KEM768) generally available since August 2025 via v14.1.51; recommended customer phased rollout through Q4 2025.
- **PQC Algorithms Announced**: ML-KEM
- **Target Migration Dates**: Q2 2025: Begin internal validation; Q3 2025: Identify and map systems; Q4 2025: Begin phased rollout; By 2030: deprecated classical encryption phased out; By 2035: PQC fully implemented
- **Products / Services Covered**: NetScaler
- **Compliance Frameworks**: NIST; FIPS 140-3 Level 2; FIPS 140-2 Level 1
- **Hybrid Mode Support**: Yes, NIST-aligned hybrid post-quantum cryptography (X25519 + ML-KEM768)
- **Current GA Status**: Generally Available (August 2025)
- **Customer Action Required**: Begin internal validation of quantum-safe encryption in non-production environments; Identify and map all systems where data confidentiality is critical; Begin phased rollout, starting with external-facing services
- **Key Commitments & Quotes**: "NetScaler became the first application delivery platform to offer NIST-aligned hybrid post-quantum cryptography (X25519 + ML-KEM768)"
- **Coverage Verification**: PARTIAL, the document confirms the algorithms, preview/GA dates, and migration timeline, but does not explicitly state version v14.1.51.
- **Extraction Quality**: HIGH
- **Source Document**: VND-009_Citrix_Systems_Inc..html (242.7 KB)
- **Extraction Timestamp**: 2026-06-06T14:28:52

## VND-231 — Wiz Inc.

- **Vendor ID**: VND-231
- **Vendor Name**: Wiz Inc.
- **Roadmap Title**: From Cryptographic Blind Spots to Post-Quantum Agility: Introducing Wiz for PQC Readiness
- **Roadmap URL**: https://www.wiz.io/blog/wiz-for-pqc-readiness
- **Publish Date**: 2026-05-18
- **Local File**: public/vendor-roadmaps/VND-231_Wiz_Inc..html
- **CSV Coverage Notes**: Official Wiz blog introducing the PQC Readiness Framework, a structured, priority-ordered migration roadmap with three phases: (1) Legacy Resiliency (urgent—weak RSA, 3DES/RC4, insecure TLS/SSH), (2) HNDL Risk (key exchange/KEMs like ML-KEM), (3) Identity & Signature Resiliency (long-term PKI migration). Includes PQC Lens visualization, continuous crypto inventory, PQC-aware code scanning, and CI/CD guardrails. References accelerated 2029 readiness deadline. | Milestone: Wiz for PQC Readiness launched (May 2026) with three-phase PQC Readiness Framework and PQC Lens; expanding to PQC-aware code
- **PQC Algorithms Announced**: ML-KEM
- **Target Migration Dates**: 2029
- **Products / Services Covered**: Wiz for PQC Readiness; Wiz Cloud; Wiz for Gov; Wiz Code; Wiz Runtime Sensor; Wiz DSPM; Wiz IDE Extension; Wiz CLI; PQC Tester
- **Compliance Frameworks**: FedRAMP High
- **Hybrid Mode Support**: None detected
- **Current GA Status**: GA
- **Customer Action Required**: Log in to your Wiz tenant to explore the Cryptographic Readiness board; Scan your domain using our PQC Tester
- **Key Commitments & Quotes**: "Wiz for PQC Readiness is now generally available for all Wiz customers."
- **Coverage Verification**: CONSISTENT. The document explicitly confirms the three-phase framework, PQC Lens, continuous inventory, code scanning, CI/CD guardrails, ML-KEM usage, and the 2029 deadline.
- **Extraction Quality**: HIGH
- **Source Document**: VND-231_Wiz_Inc..html (330.0 KB)
- **Extraction Timestamp**: 2026-06-06T14:29:20

## VND-304 — Akamai Technologies, Inc.

- **Vendor ID**: VND-304
- **Vendor Name**: Akamai Technologies, Inc.
- **Roadmap Title**: Taking Steps to Prepare for Quantum Advantage
- **Roadmap URL**: https://www.akamai.com/blog/security/taking-steps-to-prepare-for-quantum-advantage
- **Publish Date**: 2025
- **Local File**: public/vendor-roadmaps/VND-304_Akamai_Technologies\_\_Inc..html
- **CSV Coverage Notes**: Akamai's phased PQC roadmap for end-to-end quantum-safe support across its platform, covering client-to-Akamai, Akamai-to-origin (G2O), and internal mid-tier connections. Uses TLS 1.3 hybrid X25519MLKEM768 (NIST FIPS 203 ML-KEM) and platform-wide crypto-agility upgrades; aligned with NSA/CISA/NIST quantum-readiness guidance. | Milestone: PQC enabled by default for all Enhanced TLS customers and G2O origin connections in Q1 2026; all Akamai-to-Akamai mid-tier connections quantum-safe by March 2026.
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: Akamai-to-origin service available in the second half of 2024; Client-to-Akamai service available in early 2025
- **Products / Services Covered**: CDN platform; Enhanced TLS (implied by context of TLS protocol); Professional Services
- **Compliance Frameworks**: NIST; NSA; CISA
- **Hybrid Mode Support**: Yes; adoption of hybrid key exchange algorithms to mitigate “harvest now, decrypt later” threat
- **Current GA Status**: Beta; engineers are currently beta testing PQC modules for Akamai-to-origin
- **Customer Action Required**: Deploy support for hybrid key exchange on origins; align with vendors; establish a quantum-readiness roadmap
- **Key Commitments & Quotes**: "We plan to take a phased approach to support end-to-end post-quantum cryptography on our platform."
- **Coverage Verification**: PARTIAL; The document confirms the phased approach and timelines for Akamai-to-origin and Client-to-Akamai, but does not mention the specific algorithm (ML-KEM), the Akamai-to-Akamai phase details, or the Q1 2026 default enablement milestones found in the CSV notes.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-304_Akamai_Technologies\_\_Inc..html (180.5 KB)
- **Extraction Timestamp**: 2026-06-06T14:29:40

## VND-089 — BTQ Technologies Corp.

- **Vendor ID**: VND-089
- **Vendor Name**: BTQ Technologies Corp.
- **Roadmap Title**: 2025 Year-End Letter to Shareholders
- **Roadmap URL**: https://www.btq.com/blog/2025-year-end-letter-to-shareholders
- **Publish Date**: 2025-12-29
- **Local File**: public/vendor-roadmaps/VND-089_BTQ_Technologies_Corp..html
- **CSV Coverage Notes**: BTQ's strategic full-stack post-quantum roadmap built on three pillars: Quantum Secure Systems & Networks (incl. QSSN stablecoin settlement and Bitcoin Quantum), QCIM hardware acceleration / secure elements, and QPerfect neutral-atom platforms. Aims to enable PQC transition without disrupting existing infrastructure. | Milestone: 2025: first NIST-standard PQC signature verification demonstrated on Solana (with Bonsol Labs). 2026 targets: deliver QCIM test silicon to customers, expand QSSN from PoC to regulator-aligned deployments, and advance Bitcoin Quantum toward public testnet/mainnet/enter
- **PQC Algorithms Announced**: ML-DSA
- **Target Migration Dates**: December 31, 2030 (DoD legacy cryptography replacement deadline)
- **Products / Services Covered**: QCIM secure element platform; Quantum Secure Stablecoin Network (QSSN); Bitcoin Quantum Core; QPerfect MIMIQ emulator; Quantum Logical Unit (QLU) middleware
- **Compliance Frameworks**: NIST FIPS 203/204/205; CNSA 2.0; U.S. Post Quantum Financial Infrastructure Framework (PQFIF)
- **Hybrid Mode Support**: None detected
- **Current GA Status**: Beta (Proof-of-concept deployments for QSSN; demonstrated verification on Solana; Bitcoin Quantum Core demonstrated)
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "replace legacy encryption by EOY 2030"; "crypto agile support for FIPS 203/204/205 and CNSA 2.0"; "first implementation of NIST standard PQC signature verification on Solana"
- **Coverage Verification**: PARTIAL — The document confirms the three pillars, QSSN/Bitcoin Quantum details, and the 2025 Solana milestone, but does not explicitly state the specific 2026 targets for QCIM test silicon or Bitcoin Quantum mainnet advancement mentioned in the notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-089_BTQ_Technologies_Corp..html (172.7 KB)
- **Extraction Timestamp**: 2026-06-06T14:30:06

## VND-054 — QuSecure Inc.

- **Vendor ID**: VND-054
- **Vendor Name**: QuSecure Inc.
- **Roadmap Title**: Post-Quantum Cryptography Migration Guide
- **Roadmap URL**: https://qu-secure.net/resources/migration-guide/
- **Publish Date**: 2024
- **Local File**: public/vendor-roadmaps/VND-054_QuSecure_Inc..html
- **CSV Coverage Notes**: QuSecure publishes a structured 7-phase PQC migration roadmap: Discovery & Assessment, Risk Prioritization, Algorithm Selection, Proof of Concept, Pilot Implementation, Staged Migration, and Validation & Monitoring. Recommends NIST ML-KEM/ML-DSA/SLH-DSA and hybrid/direct/phased replacement approaches over a 3-5 year timeline; delivered via the QuProtect platform. | Milestone: Staged migration of critical systems (6-18 months) with continuous validation/monitoring; QuProtect R3 enables algorithm swaps and crypto-policy changes across cloud, on-prem, air-gapped, and sovereign environments aligne
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA
- **Target Migration Dates**: 3-5 year migration timeline; Staged Migration Duration: 6-18 months
- **Products / Services Covered**: None detected
- **Compliance Frameworks**: NIST FIPS 203; NIST FIPS 204; NIST FIPS 205; FIPS 140-3; SOC 2 Type II; HIPAA
- **Hybrid Mode Support**: Yes; "Hybrid Approach Use both classical and post-quantum algorithms during transition"
- **Current GA Status**: No PQC
- **Customer Action Required**: Assess Your Risk; Get Expert Help; Get Expert Consultation; Calculate Migration Priority
- **Key Commitments & Quotes**: "Your complete roadmap for migrating from current encryption to quantum-safe cryptography."
- **Coverage Verification**: PARTIAL; The document confirms the 7-phase roadmap, algorithm recommendations, and timeline, but does not mention the "QuProtect" platform or "QuProtect R3" features cited in the notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-054_QuSecure_Inc..html (150.2 KB)
- **Extraction Timestamp**: 2026-06-06T14:30:33

## VND-064 — Internet Security Research Group

- **Vendor ID**: VND-064
- **Vendor Name**: Internet Security Research Group
- **Roadmap Title**: A Post-Quantum Future for Let's Encrypt
- **Roadmap URL**: https://letsencrypt.org/2026/06/03/pq-certs
- **Publish Date**: 2026-06-03
- **Local File**: public/vendor-roadmaps/VND-064_Internet_Security_Research_Group.html
- **CSV Coverage Notes**: Official Let's Encrypt (ISRG) post laying out their post-quantum Web PKI plan. They have chosen Merkle Tree Certificates (MTCs) as the route to quantum-safe certificates, batching a post-quantum signature across many certificates to keep TLS handshakes small. Cites CNSA 2.0 (2030-2035), NIST RSA-2048/P-256 deprecation after 2030, and the EU coordinated roadmap as drivers. Participating in IETF PLANTS/ACME working groups; tracking ML-DSA in X.509/TLS. | Milestone: Targeting a staging environment issuing MTCs in late 2026 and production-ready MTC issuance in 2027; nothing changes for existing ce
- **PQC Algorithms Announced**: ML-DSA; ML-KEM
- **Target Migration Dates**: Staging environment issuing MTCs in late 2026; production-ready MTC issuance in 2027
- **Products / Services Covered**: Let's Encrypt; ACME protocol; Certificate Transparency logs
- **Compliance Frameworks**: CNSA 2.0; NIST; EU coordinated roadmap
- **Hybrid Mode Support**: Yes; recommends hybrid post-quantum key exchange (X25519MLKEM768) for servers
- **Current GA Status**: Planned
- **Customer Action Required**: Ensure servers support hybrid post-quantum key exchange (X25519MLKEM768); track work in IETF PLANTS working group and mtcs@chromium.org mailing list
- **Key Commitments & Quotes**: "Let's Encrypt is committed to a post-quantum-safe Web PKI."; "We are targeting late 2026 for a staging environment that issues MTCs, and 2027 for a production-ready environment."; "Nothing changes today. Your current Let's Encrypt certificates will continue to be issued and renewed exactly as they always have been."
- **Coverage Verification**: CONSISTENT; The document confirms the MTC strategy, timelines, standards participation, and regulatory drivers cited in the notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-064_Internet_Security_Research_Group.html (36.5 KB)
- **Extraction Timestamp**: 2026-06-06T14:30:52

## VND-007 — Check Point Software Technologies Ltd.

- **Vendor ID**: VND-007
- **Vendor Name**: Check Point Software Technologies Ltd.
- **Roadmap Title**: Quantum-Safe Cybersecurity with Check Point: Current Capabilities and the Road Ahead
- **Roadmap URL**: https://blog.checkpoint.com/innovation/quantum-safe-cyber-security-current-capabilities-and-the-road-ahead/
- **Publish Date**: 2025-09-25
- **Local File**: public/vendor-roadmaps/VND-007_Check_Point_Software_Technologies_Ltd..html
- **CSV Coverage Notes**: Official Check Point blog laying out a phased PQC roadmap to integrate NIST standards. Current (R82): hybrid IKEv2 site-to-site VPN combining classical DH with ML-KEM; quantum-safe TLS/HTTPS inspection (R82.10). Roadmap items: extend quantum-safe key exchange to remote access VPN clients (Windows/macOS/Linux), RFC 8784 PQ pre-shared keys, ML-DSA/SLH-DSA signatures as PKI matures, LMS/XMSS for software/firmware signing, and QKD integration for high-assurance environments. SIC framework designed to shift to ML-DSA when FIPS libraries are available. | Milestone: R82.10 General Availability (with
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA; LMS; XMSS
- **Target Migration Dates**: R82.10 General Availability expected in November 2025
- **Products / Services Covered**: R82 (Site-to-Site VPNs); R82.10 (Quantum-Safe TLS and HTTPS Inspection); Remote Access VPN clients (Windows, macOS, Linux)
- **Compliance Frameworks**: NIST FIPS 203; NIST FIPS 204; NIST FIPS 205; RFC 9370; RFC 9242; RFC 8784
- **Hybrid Mode Support**: Yes, hybrid IKEv2 key exchange combining classical Diffie-Hellman with ML-KEM
- **Current GA Status**: GA (R82 QSKE); Early Availability (R82.10 TLS Inspection)
- **Customer Action Required**: Upgrade to R82 to allow Post-Quantum Hybrid Key Exchange on critical VPNs; join Early Availability program for R82.10 to enable HTTPS Inspection for all TLS sessions
- **Key Commitments & Quotes**: "Check Point delivers Post-Quantum Hybrid Key Exchange in the R82 release"
- **Coverage Verification**: PARTIAL, the document confirms all roadmap items except the specific detail regarding the SIC framework shifting to ML-DSA when FIPS libraries are available.
- **Extraction Quality**: HIGH
- **Source Document**: VND-007_Check_Point_Software_Technologies_Ltd..html (113.4 KB)
- **Extraction Timestamp**: 2026-06-06T14:31:18

## VND-015 — Fortanix Inc.

- **Vendor ID**: VND-015
- **Vendor Name**: Fortanix Inc.
- **Roadmap Title**: Post Quantum Cryptography Solutions
- **Roadmap URL**: https://www.fortanix.com/solutions/use-case/post-quantum-cryptography
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-015_Fortanix_Inc..html
- **CSV Coverage Notes**: Fortanix publishes a four-step PQC transition framework: (1) Discover - inventory cryptographic posture/keys across environments; (2) PQC Assessment - prioritize quantum-vulnerable, high-risk assets via dashboards/heat maps (PQC Central); (3) PQC Transition - migrate to NIST/CNSA 2.0-aligned algorithms (ML-KEM/ML-DSA) with centralized key management and testing; (4) Crypto-agility - continuously adopt future algorithms without hardware changes. Framed as a long strategic journey to start now rather than a one-time algorithm swap. Algorithms implemented in Fortanix DSM. | Milestone: PQC Central
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; LMS; XMSS
- **Target Migration Dates**: None detected
- **Products / Services Covered**: PQC Central; Fortanix DSM; Fortanix Platform
- **Compliance Frameworks**: CNSA 2.0; FIPS PUB 203; FIPS PUB 204; FIPS PUB 197; FIPS PUB 180-4; NIST SP 800-208; FIPS 140-2 Level 3
- **Hybrid Mode Support**: None detected
- **Current GA Status**: GA
- **Customer Action Required**: Start the journey to PQC transition today; identify quantum-vulnerable assets; prioritize exposure; migrate to post-quantum cryptographic algorithms; continuously evaluate and be ready to adopt future cryptographic advancements.
- **Key Commitments & Quotes**: "Post-Quantum Cryptography transition is not an algorithm switch. It is a long and strategic journey that needs to start today."
- **Coverage Verification**: CONSISTENT — The document explicitly details the four-step framework (Discover, PQC Assessment, PQC Transition, Crypto-agility), mentions PQC Central, CNSA 2.0 alignment, and implementation in the Fortanix platform/DSM.
- **Extraction Quality**: HIGH
- **Source Document**: VND-015_Fortanix_Inc..html (252.8 KB)
- **Extraction Timestamp**: 2026-06-06T14:31:45

## VND-022 — Intel Corporation

- **Vendor ID**: VND-022
- **Vendor Name**: Intel Corporation
- **Roadmap Title**: Post-Quantum Security with Intel Cryptography
- **Roadmap URL**: https://www.intel.com/content/www/us/en/developer/articles/technical/post-quantum-cryptography.html
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-022_Intel_Corporation.html
- **CSV Coverage Notes**: Intel lays out a phased PQC strategy with an explicit goal of being Y2Q (quantum-resistant) ready by 2030, aligned to the NIST migration deadline to phase out RSA/ECC. The approach addresses harvest-now-decrypt-later first (larger symmetric keys/digests), then hardens code signing/firmware authentication and internet security with NIST-standardized algorithms (FIPS 203 ML-KEM, FIPS 204/205), using hybrid schemes (e.g. Kyber512 + X25519). Built-in crypto acceleration starts with 3rd Gen Xeon Scalable. Intel co-developed FIPS 205 SPHINCS+. Companion strategy content also at intel.com/.../researc
- **PQC Algorithms Announced**: XMSS; LMS; Kyber512
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Intel Cryptography Primitives Library; Intel oneAPI Base Toolkit
- **Compliance Frameworks**: NIST SP 800-208; FIPS 140-3
- **Hybrid Mode Support**: Yes, the document recommends implementing the transition in Hybrid mode, combining classical and post-quantum schemes (e.g., Kyber512 + X25519) to ensure security against non-quantum attackers if the PQC component is broken.
- **Current GA Status**: Preview
- **Customer Action Required**: Download the Intel Cryptography Primitives Library standalone or as part of the Intel oneAPI Base Toolkit; submit issues on Github or in the online service center for questions or requests to extend the list of post-quantum algorithms.
- **Key Commitments & Quotes**: "We are at the forefront of implementing the latest in post-quantum cryptographic technology and are closely monitoring the evolution of standards at NIST’s Post Quantum Cryptography PQC ."
- **Coverage Verification**: MISMATCH — The document does not mention the 2030 Y2Q goal, FIPS 203/204/205 standards, 3rd Gen Xeon acceleration, or SPHINCS+ co-development; it only covers XMSS/LMS preview support and general hybrid concepts.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-022_Intel_Corporation.html (137.7 KB)
- **Extraction Timestamp**: 2026-06-06T14:32:11

## VND-157 — ID Quantique SA

- **Vendor ID**: VND-157
- **Vendor Name**: ID Quantique SA
- **Roadmap Title**: Migrating to quantum-safe infrastructure
- **Roadmap URL**: https://www.idquantique.com/quantum-safe-security/migrating-to-quantum-safe-infrastructure/
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-157_ID_Quantique_SA.html
- **CSV Coverage Notes**: ID Quantique publishes a quantum-safe migration strategy laying out a defense-in-depth, hybrid approach that combines PQC (software, deployable now), QKD (hardware/quantum-physics based), QRNG and Quantum Key Management (Q-KMS), with strong emphasis on cryptographic hybridization and crypto-agility to de-risk a migration that 'won't happen overnight' (decade-plus) against harvest-now-decrypt-later. Clarion KX is positioned as the platform for flexible QKD+PQC deployments. Strategic/positioning content rather than a dated milestone timeline, so classified as a migration strategy page. | Milesto
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Clarion KX Platform
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: Yes, the document advocates for a hybrid approach combining PQC and QKD, and notes that PQC algorithms will often operate in hybrid mode alongside classical ECC and RSA.
- **Current GA Status**: No PQC
- **Customer Action Required**: Arrange a free consultation with one of our experts today.
- **Key Commitments & Quotes**: "Implementing post-quantum cryptography won’t happen overnight"; "The journey to quantum safe infrastructure is likely to be long, complex and expensive"; "Any entity transferring data with long-term secrecy requirements should move to quantum-safe cryptography now."
- **Coverage Verification**: CONSISTENT, the document explicitly details a defense-in-depth hybrid strategy combining PQC, QKD, QRNG, and Q-KMS, highlights the decade-long migration timeline and HNDL threat, and positions Clarion KX for flexible deployments.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-157_ID_Quantique_SA.html (375.0 KB)
- **Extraction Timestamp**: 2026-06-06T14:32:40

## VND-152 — Adtran Networks SE (formerly ADVA)

- **Vendor ID**: VND-152
- **Vendor Name**: Adtran Networks SE (formerly ADVA)
- **Roadmap Title**: Quantum-safe security
- **Roadmap URL**: https://www.adtran.com/en/innovation/quantum-safe-security
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-152*Adtran_Networks_SE_formerly_ADVA*.html
- **CSV Coverage Notes**: Adtran (with Adva Network Security) publishes a quantum-safe networking strategy built on a defense-in-depth approach combining post-quantum-ready encryption across optical (Layer 1, FSP 3000 ConnectGuard), Ethernet (Layer 2 MACsec, FSP 150), and IP layers, plus QKD and crypto-agility for software-upgradeable PQC. Concrete milestone: the FSP 150-XG118Pro 10G edge device received German BSI certification and delivers PQC (NIST ML-KEM combined with classical DH) via software update. Supporting strategy blogs ('Striving toward a quantum-safe world', 'Quantum-safe communication deployment strategi
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: FSP 3000; FSP 150; FSP 150-XG118 Pro (CSH); ConnectGuard; Security Director; ALM fiber monitoring
- **Compliance Frameworks**: EU/NATO classified data standards
- **Hybrid Mode Support**: None detected
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Our solutions with ConnectGuard&trade; technology feature post-quantum algorithms and quantum-based key exchange technologies"; "ConnectGuard&trade; security technology ensures strong and future-proof protection of data in motion"; "Our FSP 3000 and FSP 150 systems are approved for transporting EU/NATO classified data"
- **Coverage Verification**: MISMATCH — The document does not mention ML-KEM, BSI certification, QKD, or IP layer coverage, contradicting specific claims in the CSV notes.
- **Extraction Quality**: LOW
- **Source Document**: VND-152*Adtran_Networks_SE_formerly_ADVA*.html (140.5 KB)
- **Extraction Timestamp**: 2026-06-06T14:33:03

## VND-006 — Canonical Ltd.

- **Vendor ID**: VND-006
- **Vendor Name**: Canonical Ltd.
- **Roadmap Title**: Post Quantum Support in the upcoming 26.04 LTS
- **Roadmap URL**: https://discourse.ubuntu.com/t/post-quantum-support-in-the-upcoming-26-04-lts/76840
- **Publish Date**: 2026-02-12
- **Local File**: public/vendor-roadmaps/VND-006_Canonical_Ltd..html
- **CSV Coverage Notes**: Official Canonical plan (Ubuntu Community Hub / Foundations team, author Ravi Sharma) detailing Ubuntu's PQC roadmap with a clear release timeline: 25.10 already ships PQC in OpenSSL 3.5, OpenSSH 10.0+, libgcrypt, wolfssl, rustls; 26.04 LTS makes hybrid key exchange (e.g. X25519MLKEM768) the default for TLS/SSH automatically; 28.04 LTS targets Hybrid Secure Boot with classical + post-quantum signatures. Implements NIST 2024 standards ML-KEM, ML-DSA, SLH-DSA in hybrid mode for interoperability. Corroborated by ubuntu.com/blog PQC posts (25.10 security, building quantum-safe telecom). | Mileston
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA; CRYSTALS-Kyber; CRYSTALS-Dilithium; SPHINCS+; Falcon; HQC; sntrup761
- **Target Migration Dates**: 26.04 LTS makes hybrid key exchange the default; 28.04 LTS targets Hybrid Secure Boot
- **Products / Services Covered**: Ubuntu 25.10; Ubuntu 26.04 LTS; Ubuntu 28.04 LTS; OpenSSL 3.5; OpenSSH 10.0+; libgcrypt 1.11.0; wolfssl 2.7.2; rustls 23.23; Nginx; LXD
- **Compliance Frameworks**: NIST FIPS 203; NIST FIPS 204; NIST FIPS 205; NIST FIPS-206
- **Hybrid Mode Support**: Yes, Ubuntu retains hybrid key exchange (e.g., X25519MLKEM768) as the default for TLS and SSH to ensure security if one component fails.
- **Current GA Status**: GA (General Availability in Ubuntu 25.10 and upcoming 26.04 LTS)
- **Customer Action Required**: Experiment with these algorithms, report any bugs, and share feedback; upgrade to Ubuntu 26.04 for PQ support (no backport to Noble planned).
- **Key Commitments & Quotes**: "Ubuntu has chosen to retain hybrid key exchange as the default"; "Hybrid Secure Boot (classical + PQ Signatures) could realistically appear around the 28.04 LTS timeframe"; "Currently, there are no plans to backport PQ algorithms to Noble"
- **Coverage Verification**: CONSISTENT. The document confirms the author, timeline, specific libraries, and hybrid default status for 26.04 LTS as described in the notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-006_Canonical_Ltd..html (37.4 KB)
- **Extraction Timestamp**: 2026-06-06T14:33:22

## VND-155 — Nokia Corporation

- **Vendor ID**: VND-155
- **Vendor Name**: Nokia Corporation
- **Roadmap Title**: Quantum-safe networks
- **Roadmap URL**: https://www.nokia.com/industries/quantum-safe-networks/
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-155_Nokia_Corporation.html
- **CSV Coverage Notes**: Nokia publishes a Quantum Safe Network (QSN) strategy and the white paper 'The road to quantum-safe networks' (nokia.com/asset/i/214685/), advocating a pragmatic, layered defense-in-depth roadmap that bundles PQC, Symmetric Key Infrastructure (SKI), and QKD into a hybrid, crypto-agile migration. Nokia is engaging NIST on building blocks and its optical networking was first in industry to achieve FIPS 140-3 Security Level 2 validation. Supporting strategy blog 'Get ahead of the quantum threat with a quantum-safe network strategy' (returned 403 to automated fetch but confirmed live via Nokia-sou
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: None detected
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: No
- **Current GA Status**: No PQC
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: None detected
- **Coverage Verification**: PARTIAL — The document confirms the QSN strategy, defense-in-depth approach, and white paper title, but does not explicitly mention SKI, QKD bundling, NIST engagement, or FIPS 140-3 validation in the provided text.
- **Extraction Quality**: LOW
- **Source Document**: VND-155_Nokia_Corporation.html (308.5 KB)
- **Extraction Timestamp**: 2026-06-06T14:33:58

## VND-190 — Zscaler Inc.

- **Vendor ID**: VND-190
- **Vendor Name**: Zscaler Inc.
- **Roadmap Title**: Preparing for 'Q Day': A Primer on the Quantum Threat and the Strategic Shift to Post-Quantum Cryptography
- **Roadmap URL**: https://www.zscaler.com/blogs/product-insights/primer-quantum-threat-strategic-shift-post-quantum-cryptography-pqc
- **Publish Date**: 2025-10-31
- **Local File**: public/vendor-roadmaps/VND-190_Zscaler_Inc..html
- **CSV Coverage Notes**: Zscaler has published a strategic PQC program: a multi-part 'Strategic Shift to Post-Quantum Cryptography' blog series (primer published Oct 31, 2025) plus a 'Quantum-Ready Security Service Edge' innovation launch. It lays out a hybrid ECC+ML-KEM key-exchange strategy, inline PQC TLS decryption/inspection, IPsec tunnels with post-quantum pre-shared keys, crypto-discovery via SI partners (EY, HCLTech), and phased customer migration guidance across the Zero Trust Exchange. | Milestone: Quantum-ready SSE: inline inspection of ML-KEM hybrid PQC TLS traffic and IPsec tunnels with post-quantum pre-s
- **PQC Algorithms Announced**: ML-KEM; FIPS-203
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Zscaler Internet Access (ZIA); Zero Trust Exchange
- **Compliance Frameworks**: NIST; FIPS-203
- **Hybrid Mode Support**: Partial, mentions "hybrid ECC+ML-KEM key-exchange strategy" in CSV notes but document text only discusses ML-KEM as a replacement for ECDHE/FFDHE/RSA without explicitly detailing the hybrid implementation mechanics in the provided text.
- **Current GA Status**: Planned
- **Customer Action Required**: Adopt Post-Quantum Cryptography; Audit Cryptographic Systems
- **Key Commitments & Quotes**: "This is the first entry in a series of blogs that will help organizations prepare for the Post-Quantum Era."
- **Coverage Verification**: PARTIAL, the document confirms the blog series title, date, and general PQC strategy but does not explicitly mention the 'Quantum-Ready Security Service Edge' launch, specific SI partners (EY, HCLTech), or IPsec pre-shared key details found in the CSV notes.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-190_Zscaler_Inc..html (256.2 KB)
- **Extraction Timestamp**: 2026-06-06T14:34:14

## VND-011 — CryptoNext Security

- **Vendor ID**: VND-011
- **Vendor Name**: CryptoNext Security
- **Roadmap Title**: Switch to post-quantum crypto-agility with CryptoNext (4-phase PQC migration strategy)
- **Roadmap URL**: https://www.cryptonext-security.com/en/
- **Publish Date**: 2025-06
- **Local File**: public/vendor-roadmaps/VND-011_CryptoNext_Security.html
- **CSV Coverage Notes**: CryptoNext publishes a structured PQC migration strategy/methodology on its official site organized in four phases: (1) PQC Evaluation/Test & Learn via prototypes, (2) Cryptographic Discovery & Inventory (CryptoNext COMPASS Discovery, launched June 2025), (3) PQC Remediation by integrating standards-based PQC into hardware/software, and (4) Crypto-Agility management for evolving standards. Supported by a blog series on discovery, testing before migration, and crypto-agility; CryptoNext is also engaged in NIST's PQC collaboration project. | Milestone: Crypto-agility/COMPASS Discovery driven mig
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: CryptoNext Toolbox; CryptoNext COMPASS Discovery; CryptoNext Remediation SDK; CryptoNext Captain
- **Compliance Frameworks**: NIST; DORA; NIS2
- **Hybrid Mode Support**: None detected
- **Current GA Status**: GA
- **Customer Action Required**: Request a Demo; Get a structured roadmap; Map every cryptographic asset; Test the impacts of PQC; Deploy NIST-validated post-quantum algorithms
- **Key Commitments & Quotes**: "We are at the forefront of the NIST standardization efforts."; "Deploy NIST-validated post-quantum algorithms without accumulating cryptographic debt"; "CryptoNext Security is recognized as a leading player in PQC by ABI Research, Bain Capital Ventures and IDC Innovators."
- **Coverage Verification**: CONSISTENT — The document explicitly details the four-phase strategy (Evaluation, Inventory/COMPASS, Remediation, Management) and mentions the June 2025 launch of COMPASS Discovery, aligning with the notes.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-011_CryptoNext_Security.html (147.1 KB)
- **Extraction Timestamp**: 2026-06-06T14:34:39

## VND-230 — Confluent Inc.

- **Vendor ID**: VND-230
- **Vendor Name**: Confluent Inc.
- **Roadmap Title**: Post-Quantum Cryptography in Confluent Cloud
- **Roadmap URL**: https://www.confluent.io/blog/confluent-cloud-post-quantum-cryptography-roadmap/
- **Publish Date**: 2026-03-05
- **Local File**: public/vendor-roadmaps/VND-230_Confluent_Inc..html
- **CSV Coverage Notes**: Official Confluent blog laying out a multi-phase PQC strategy for Confluent Cloud addressing 'harvest now, decrypt later'. Covers data-in-transit (TLS 1.3 default, hybrid key exchange investigating ML-KEM/ML-DSA/SLH-DSA), data-at-rest (already AES-256 / PQC-compliant on AWS & GCP, investigating Azure HSM), and crypto-agility. Aligns with NIST FIPS 203/204/205 and references the Cloud Security Alliance 2030 deadline. | Milestone: TLS 1.3 becomes default for all newly provisioned and existing (non-Dedicated) clusters by April 30, 2026; moving toward hybrid classical+PQC key exchange.
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA
- **Target Migration Dates**: April 30, 2026 (TLS 1.3 default); April 14, 2030 (Cloud Security Alliance deadline for PQC infrastructure)
- **Products / Services Covered**: Confluent Cloud
- **Compliance Frameworks**: NIST FIPS 203; NIST FIPS 204; NIST FIPS 205; Cloud Security Alliance
- **Hybrid Mode Support**: Yes; moving toward a hybrid key exchange model combining traditional classical signatures with new PQC signatures
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "On April 30, 2026, Confluent Cloud will enable TLS 1.3 by default for all newly provisioned clusters"; "we’re moving toward a hybrid key exchange model"; "Confluent already uses symmetric Advanced Encryption Standard (AES) 256 keys... making these environments PQC-compliant"
- **Coverage Verification**: CONSISTENT; The document confirms the multi-phase strategy, specific algorithms, TLS 1.3 milestone date, data-at-rest status on AWS/GCP, and alignment with NIST FIPS and CSA deadlines.
- **Extraction Quality**: HIGH
- **Source Document**: VND-230_Confluent_Inc..html (211.7 KB)
- **Extraction Timestamp**: 2026-06-06T14:34:59

## VND-039 — STMicroelectronics N.V.

- **Vendor ID**: VND-039
- **Vendor Name**: STMicroelectronics N.V.
- **Roadmap Title**: Post-Quantum Cryptography - STMicroelectronics
- **Roadmap URL**: https://www.st.com/content/st_com/en/about/innovation-and-technology/post-quantum-cryptography.html
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-039_STMicroelectronics_N.V..html
- **CSV Coverage Notes**: Official ST corporate page describing its post-quantum cryptography program: contributing to standardization, developing crypto-agile hardware accelerators and software libraries for general-purpose and secure MCUs, and ensuring a seamless transition to crypto-agile ecosystems supporting a mix of quantum-safe and classical algorithms. Notes ST's Keccak role in NIST-standardized algorithms (ML-KEM, ML-DSA, SLH-DSA, FALCON). | Milestone: Crypto-agile hardware/software PQC assets ready (X-CUBE-PQC library; first Common Criteria-certified STSAFE-TPM with LMS-signed firmware update) supporting secu
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA; LMS; XMSS; CRYSTALS-Kyber; CRYSTAL-Dilithium; FALCON; SPHINCS+
- **Target Migration Dates**: None detected
- **Products / Services Covered**: STM32 MCUs; STM32 MPUs; SPC5 32-bit Automotive MCUs; Stellar 32-bit Automotive MCUs; X-Cube PQC; NesLib-PQML; STSAFE-TPM
- **Compliance Frameworks**: NIST FIPS-203; NIST FIPS 204; NIST FIPS 205; NIST SP800-208; NIST FIPS 202; Common Criteria
- **Hybrid Mode Support**: Yes, ST is contributing to standards supporting a mix of quantum-safe and classical algorithms.
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "ST launched a post-quantum cryptography program to support the standardization and development of new algorithms"
- **Coverage Verification**: CONSISTENT, the document confirms ST's PQC program, Keccak role, crypto-agile products, X-Cube PQC, and STSAFE-TPM with LMS signatures.
- **Extraction Quality**: HIGH
- **Source Document**: VND-039_STMicroelectronics_N.V..html (481.3 KB)
- **Extraction Timestamp**: 2026-06-06T14:35:25

## VND-379 — Hewlett Packard Enterprise

- **Vendor ID**: VND-379
- **Vendor Name**: Hewlett Packard Enterprise
- **Roadmap Title**: HPE Introduces Sweeping Security Advancements to Secure AI Adoption and Strengthen Enterprise Resiliency
- **Roadmap URL**: https://www.businesswire.com/news/home/20260324083438/en/HPE-Introduces-Sweeping-Security-Advancements-to-Secure-AI-Adoption-and-Strengthen-Enterprise-Resiliency
- **Publish Date**: 2026-03-24
- **Local File**: public/vendor-roadmaps/VND-379_Hewlett_Packard_Enterprise.html
- **CSV Coverage Notes**: HPE press release describing portfolio-wide quantum-safe security advancements with a phased crypto-agility approach: NIST FIPS 203/204 alignment, PQC-ready Junos OS Evolved (with broader Junos PQC support, software signing on FIPS 204, and Quantum Buffer for SSH), and PQC-capable HPE ProLiant Gen12 / iLO 7 silicon root of trust aligned to CNSA 2.0. Emphasizes standards alignment, supply-chain security, and customer migration paths. | Milestone: PQC support to extend more broadly across Junos OS in summer 2026 (FIPS 203/204 libraries); HPE ProLiant Gen12 with iLO 7 embedded PQC/CNSA 2.0 capabi
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: summer 2026
- **Products / Services Covered**: Junos OS Evolved; Junos; HPE ProLiant Compute Gen12 servers; HPE Integrated Lights-Out (iLO) 7
- **Compliance Frameworks**: NIST; FIPS 203/204
- **Hybrid Mode Support**: None detected
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "HPE has added post-quantum cryptography (PQC)-ready capabilities to Junos OS Evolved and will extend PQC support more broadly to Junos in summer 2026."
- **Coverage Verification**: PARTIAL — The document confirms Junos/iLO PQC readiness and FIPS 203/204 alignment, but does not explicitly mention CNSA 2.0, Quantum Buffer for SSH, or supply-chain security/migration paths as noted in the CSV.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-379_Hewlett_Packard_Enterprise.html (381.0 KB)
- **Extraction Timestamp**: 2026-06-06T14:35:50

## VND-312 — Netskope, Inc.

- **Vendor ID**: VND-312
- **Vendor Name**: Netskope, Inc.
- **Roadmap Title**: Preparing for a Future with Post-Quantum Cryptography
- **Roadmap URL**: https://www.netskope.com/resources/white-papers/preparing-for-a-future-with-post-quantum-cryptography
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-312_Netskope_Inc..html
- **CSV Coverage Notes**: Official Netskope white paper (authored by CTO Krishna Narayanaswamy), complemented by the 'Planning for a Post-quantum World, Now!' blog, outlining how encryption is implemented across the Netskope One platform and the company's strategy to address quantum threats. Netskope evaluated five places in the Netskope One architecture using encryption and is adopting NIST PQC algorithms (ML-KEM-768) to build protections. | Milestone: Quantum-resilient Netskope One in development, intended to be available for customer sandbox testing; standardizing on ML-KEM-768.
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: None detected
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: None detected
- **Current GA Status**: No PQC
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: None detected
- **Coverage Verification**: MISMATCH — The provided document text is a website navigation menu and footer containing no substantive white paper content, thus it does not contain the specific PQC details, author attribution, or algorithm mentions cited in the CSV notes.
- **Extraction Quality**: LOW
- **Source Document**: VND-312_Netskope_Inc..html (1516.5 KB)
- **Extraction Timestamp**: 2026-06-06T14:36:12

## VND-233 — Huawei Technologies Co. Ltd.

- **Vendor ID**: VND-233
- **Vendor Name**: Huawei Technologies Co. Ltd.
- **Roadmap Title**: Post-Quantum Cryptography - Huawei Trust Center
- **Roadmap URL**: https://www.huawei.com/en/trust-center/post-quantum-cryptography
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-233_Huawei_Technologies_Co.\_Ltd..html
- **CSV Coverage Notes**: Official Huawei Trust Center page setting out the company's quantum-safe strategy: prioritizing quantum-safe key-agreement to counter store-now-decrypt-later, adopting hybrid schemes (classical Diffie-Hellman + PQC KEM) during transition, tracking NIST standardization, and committing to introduce quantum-safe algorithms into products early. Reviews the six PQC algorithm families and selection criteria (security maturity, complexity, performance). | Milestone: Deploy hybrid (classical + PQC) key-agreement in products in advance of finalized standards; align with NIST PQC standardization outcome
- **PQC Algorithms Announced**: NTRU; McEliece; Rainbow
- **Target Migration Dates**: in advance of the 2024 deadline
- **Products / Services Covered**: None detected
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: Yes, implementing a hybrid scheme that implements both Diffie-Hellman and a candidate quantum-safe key-exchange mechanism.
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Huawei plans to introduce quantum-safe algorithms into its products at an early date"; "We plan to introduce some of these algorithms into our products in advance of the 2024 deadline"; "A third option is to implement a hybrid scheme that implements both Diffie-Hellman and a candidate quantum-safe key-exchange mechanism."
- **Coverage Verification**: CONSISTENT, the document explicitly confirms the strategy of prioritizing key-agreement, adopting hybrid schemes, tracking standardization, and introducing algorithms early.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-233_Huawei_Technologies_Co.\_Ltd..html (111.9 KB)
- **Extraction Timestamp**: 2026-06-06T14:36:27

## VND-235 — Samsung SDS Co. Ltd.

- **Vendor ID**: VND-235
- **Vendor Name**: Samsung SDS Co. Ltd.
- **Roadmap Title**: In the Era of Quantum Computing, SDS is Taking the Following Steps to Enhance Security - Participating in NIST Post-Quantum Cryptography Migration Project
- **Roadmap URL**: https://www.samsungsds.com/en/research-blog/post-quantum-crypto-migration.html
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-235_Samsung_SDS_Co.\_Ltd..html
- **CSV Coverage Notes**: Official Samsung SDS research blog describing its quantum-safe strategy across three pillars: building the Crypto Agility Platform / S-CAPE for enterprise PQC migration (identification, analysis, migration phases), active participation in NIST NCCoE Migration to PQC project (founding member since June 2022), and advancing domestic KPQC standards (AIMer selected 2025). PQC piloted in Samsung Cloud Platform communications with planned expansion. | Milestone: Provide S-CAPE PQC migration via Samsung Cloud Platform and expand PQC application in SCP communication segments; presented Software-Define
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA; HQC; AIMer
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Crypto Agility Platform; S-CAPE
- **Compliance Frameworks**: NIST FIPS; NIST SP 1800 series; NSM-10
- **Hybrid Mode Support**: None detected
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Samsung SDS developed the Crypto Agility Platform, equipping enterprises with the tools needed to migrate to post-quantum cryptography (PQC)."; "Samsung SDS has secured the Crypto Agility Platform for Enterprise to address the key stages of PQC migration: identification, analysis, and migration."; "Samsung SDS became the sole Asian company to join the NIST project as an early member and has since remained actively engaged."
- **Coverage Verification**: PARTIAL — The document confirms the Crypto Agility Platform, NIST founding membership, and AIMer selection, but does not mention "S-CAPE" by name, nor does it mention PQC piloting in Samsung Cloud Platform communications.
- **Extraction Quality**: HIGH
- **Source Document**: VND-235_Samsung_SDS_Co.\_Ltd..html (35.3 KB)
- **Extraction Timestamp**: 2026-06-06T14:36:47

## VND-239 — Eviden SAS (Atos Group)

- **Vendor ID**: VND-239
- **Vendor Name**: Eviden SAS (Atos Group)
- **Roadmap Title**: Post-Quantum Cryptography (PQC) | Eviden
- **Roadmap URL**: https://eviden.com/solutions/cybersecurity/post-quantum-security-pqc/
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-239*Eviden_SAS_Atos_Group*.html
- **CSV Coverage Notes**: Official Eviden PQC page presenting a structured quantum-safe migration framework: a 4-step approach (awareness/education, cryptography inventory, risk assessment, implementation) plus a referenced 6-step PQC migration framework whitepaper. Frames urgency (quantum maturity ~2037; irreducible ~3-year migration timeline per CSA) and supports migration with PQC Explorer tooling, C-QSR Quantum Safe Remediation suite, and quantum-ready products (Trustway HSM/IP Protect, IDnomic PKI, PQC HSMaaS). | Milestone: Drive customer migration via cryptography inventory + risk assessment toward hybrid PQC; qu
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: 2037 (quantum maturity); 3 years (irreducible migration timeline)
- **Products / Services Covered**: PQC Explorer; Trustway HSM; Trustway IP Protect; IDnomic PKI; PQC HSMaaS
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: None detected
- **Current GA Status**: GA
- **Customer Action Required**: Run cryptography inventory; perform risk assessment; prioritize assets; migrate to PQC algorithms
- **Key Commitments & Quotes**: "Migrating to PQC is not an option, rather a vital requirement to maintain your business continuity and security."
- **Coverage Verification**: PARTIAL - The document confirms the 4-step framework, 2037 timeline, 3-year migration, PQC Explorer, and specific products, but does not mention the "C-QSR Quantum Safe Remediation suite" or the "6-step PQC migration framework whitepaper" referenced in the notes.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-239*Eviden_SAS_Atos_Group*.html (137.3 KB)
- **Extraction Timestamp**: 2026-06-06T14:37:09

## VND-240 — Orange S.A.

- **Vendor ID**: VND-240
- **Vendor Name**: Orange S.A.
- **Roadmap Title**: Orange: leading the way in quantum technologies for a safer, smarter future
- **Roadmap URL**: https://www.orange.com/en/news/2025/orange-leading-way-quantum-technologies-safer-smarter-future
- **Publish Date**: 2025
- **Local File**: public/vendor-roadmaps/VND-240_Orange_S.A..html
- **CSV Coverage Notes**: Official Orange page describing its quantum-safe strategy: invested in quantum tech since 2017 (QKD first, then PQC), embedding post-quantum security into network security early. Recommends a structured customer transition - comprehensive risk assessment, a clear budgeted PQC migration roadmap, full cryptographic asset inventory (keys, certs, signatures, protocols), and crypto-agility to swap algorithms quickly. Backed by Orange Business + Cisco PQC-secured global WAN services. | Milestone: Orange Business first European provider of PQC-secured global WAN (Cisco 8000 Secure Routers); managed C
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: None detected
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: None detected
- **Current GA Status**: No PQC
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: None detected
- **Coverage Verification**: MISMATCH — The document text contains only a cookie/security warning and no content related to Orange's quantum strategy or PQC roadmap.
- **Extraction Quality**: LOW
- **Source Document**: VND-240_Orange_S.A..html (26.5 KB)
- **Extraction Timestamp**: 2026-06-06T14:37:53

## VND-251 — Department of Science and Technology (DST) India

- **Vendor ID**: VND-251
- **Vendor Name**: Department of Science and Technology (DST) India
- **Roadmap Title**: Quantum Safe Ecosystem in India - Report of the Task Force on Implementation of Quantum Safe Ecosystem in India
- **Roadmap URL**: https://dst.gov.in/quantum-safe-ecosystem-in-india
- **Publish Date**: 2026-02-04
- **Local File**: public/vendor-roadmaps/VND-251_Department_of_Science_and_Technology_DST_India.html
- **CSV Coverage Notes**: Official DST India page (verified via WebFetch) presenting the national PQC migration roadmap produced by the DST Task Force under the National Quantum Mission (chaired by Dr. Rajkumar Upadhyay, CEO C-DOT). Sets time-bound national targets, phased migration guidelines, recommended PQC standards (NIST-aligned plus evaluation of indigenous algorithms), national testing/certification infrastructure, hybrid deployment, crypto-agile PKI, and PQC-QKD composite testbeds. Linked full report PDF dated 4 Feb 2026; page last updated 01 Jun 2026. | Milestone: Quantum resiliency across Critical Information
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: quantum resiliency across Critical Information Infrastructure by 2029; enterprise-wide post-quantum cryptography adoption by 2033
- **Products / Services Covered**: None detected
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: Yes, the document mentions "hybrid deployment frameworks" and "composite PQC-QKD solutions".
- **Current GA Status**: No PQC
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "quantum resiliency across Critical Information Infrastructure by 2029"; "enterprise-wide post-quantum cryptography adoption by 2033"; "build a quantum-secure digital backbone suited to India's scale"
- **Coverage Verification**: PARTIAL, the document confirms the DST Task Force, National Quantum Mission, and 2029/2033 targets, but does not mention Dr. Rajkumar Upadhyay, C-DOT, NIST alignment, or the specific PDF date.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-251_Department_of_Science_and_Technology_DST_India.html (53.1 KB)
- **Extraction Timestamp**: 2026-06-06T14:38:10

## VND-258 — NetSfere (Infinite Convergence Solutions)

- **Vendor ID**: VND-258
- **Vendor Name**: NetSfere (Infinite Convergence Solutions)
- **Roadmap Title**: The NetSfere Edge — Post-Quantum Cryptography
- **Roadmap URL**: https://netsfere.com/Resources/pqc
- **Publish Date**: 2025-03-27
- **Local File**: public/vendor-roadmaps/VND-258*NetSfere_Infinite_Convergence_Solutions*.html
- **CSV Coverage Notes**: NetSfere publishes a dedicated PQC strategy page ('The NetSfere Edge') describing its crypto-agile, quantum-proof secure-communication architecture. Built on four pillars (Modular Architecture, NIST Standard Compliance, Automated Updates, Backward Compatibility), using Rust-based ML-KEM 1024 (FIPS 203, evolved from CRYSTALS-Kyber) paired with AES-256. Architecture is designed for seamless transition to future quantum-safe standards. Backed by a March 2025 press release unveiling the enterprise-ready quantum-proof platform; crypto-agile architecture first announced at NetSfere Connections 2024
- **PQC Algorithms Announced**: ML-KEM; CRYSTALS-Kyber
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Quantum-Proof Secure Communication Platform
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: Yes; "Seamless Communication with ECC users is assured with ECC backward compatibility, while new conversations adopt ML-KEM 1024"
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "NetSfere, a global leader in next-generation secure and compliant messaging and mobility solutions, unveils the industry’s first Quantum-Proof Secure Communication Platform."
- **Coverage Verification**: PARTIAL; The document confirms the four pillars, Rust-based ML-KEM 1024, AES-256, and crypto-agility, but does not explicitly mention "FIPS 203", the "March 2025 press release", or "NetSfere Connections 2024".
- **Extraction Quality**: HIGH
- **Source Document**: VND-258*NetSfere_Infinite_Convergence_Solutions*.html (66.3 KB)
- **Extraction Timestamp**: 2026-06-06T14:38:42

## VND-259 — Cellcrypt Limited

- **Vendor ID**: VND-259
- **Vendor Name**: Cellcrypt Limited
- **Roadmap Title**: Store Now, Decrypt Later: The Quantum Computing Threat (PQC strategy & phased migration)
- **Roadmap URL**: https://www.cellcrypt.com/post/post-quantum-cryptography-and-the-store-now-decrypt-later-threat/
- **Publish Date**: 2024-10-17
- **Local File**: public/vendor-roadmaps/VND-259_Cellcrypt_Limited.html
- **CSV Coverage Notes**: Cellcrypt's blog 'Store Now, Decrypt Later' (17 Oct 2024) lays out its dual-layer PQC strategy combining CRYSTALS-Kyber (ML-KEM, lattice-based) with Classic McEliece (code-based) plus an agile post-quantum crypto layer for easy algorithm replacement, and includes a 12-month phased migration roadmap (Phase 1 inventory/months 1-2; Phase 2 hybrid deployment/months 3-6; Phase 3 PQ-only or dual-layer migration + audit/months 7-12). Modules certified FIPS 140-3 Level 3. | Milestone: Dual-layer PQC (CRYSTALS-Kyber + Classic McEliece) with agile crypto layer live in product; FIPS 140-3 Level 3 validat
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA; CRYSTALS-Kyber; CRYSTALS-Dilithium; SPHINCS+; Classic McEliece
- **Target Migration Dates**: Phase 1: Months 1-2; Phase 2: Months 3-6; Phase 3: Months 7-12
- **Products / Services Covered**: None detected
- **Compliance Frameworks**: NIST; FIPS 140-3 Level 3
- **Hybrid Mode Support**: Yes; "Deploy hybrid (classical + PQ) key exchange for TLS and messaging"
- **Current GA Status**: Planned
- **Customer Action Required**: Begin phased rollout to key exchange mechanisms immediately; Inventory current encryption usage; Identify long-lived secrets and retention policies; Map dependencies on classical algorithms
- **Key Commitments & Quotes**: "Cellcrypt implements a dual-layer PQ architecture that composes: CRYSTALS-Kyber (ML-KEM)... Classic McEliece"
- **Coverage Verification**: PARTIAL; The document confirms the dual-layer strategy, algorithms, and 12-month roadmap, but does not mention an "agile post-quantum crypto layer" or "FIPS 140-3 Level 3" certification.
- **Extraction Quality**: HIGH
- **Source Document**: VND-259_Cellcrypt_Limited.html (43.1 KB)
- **Extraction Timestamp**: 2026-06-06T14:39:14

## VND-261 — XWiki SAS (CryptPad)

- **Vendor ID**: VND-261
- **Vendor Name**: XWiki SAS (CryptPad)
- **Roadmap Title**: Towards More Cryptographic Agility — CryptPad Blueprints (PQC integration)
- **Roadmap URL**: https://blueprints.cryptpad.org/review/agility/
- **Publish Date**: 2025-09-05
- **Local File**: public/vendor-roadmaps/VND-261*XWiki_SAS_CryptPad*.html
- **CSV Coverage Notes**: CryptPad (XWiki SAS) documents a PQC integration plan via its blog and Blueprints. After a 6-month internship, the team chose the Crystals suite (ML-KEM and ML-DSA) after benchmarking NIST candidates, implemented a proof-of-concept, and added crypto-agility to allow easy switching of cryptographic libraries. The 'Towards More Cryptographic Agility' blueprint and status posts describe the path toward quantum-resilient cryptography, with acknowledged low-level/UX blockers before production deployment. | Milestone: PQC proof-of-concept (ML-KEM + ML-DSA) and crypto-agility refactor completed; depl
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: CryptPad
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: None detected
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "we thus plan the transition towards such a scheme"; "CryptPad should already start today towards more cryptographic agility"; "Having the possibility to more easily change the cryptographic primitives will make the transition smooth"
- **Coverage Verification**: MISMATCH — The document text does not mention the Crystals suite, ML-KEM, ML-DSA, a 6-month internship, or a completed proof-of-concept, contradicting the specific claims in the CSV notes.
- **Extraction Quality**: LOW
- **Source Document**: VND-261*XWiki_SAS_CryptPad*.html (32.4 KB)
- **Extraction Timestamp**: 2026-06-06T14:40:06

## VND-114 — 1Password Inc.

- **Vendor ID**: VND-114
- **Vendor Name**: 1Password Inc.
- **Roadmap Title**: A first step toward post-quantum security
- **Roadmap URL**: https://1password.com/blog/post-quantum-cryptography
- **Publish Date**: 2026-03-31
- **Local File**: public/vendor-roadmaps/VND-114_1Password_Inc..html
- **CSV Coverage Notes**: Official 1Password blog announcing the first phase of a broader, sequential post-quantum roadmap. Risk-prioritized approach targeting parts of the architecture most exposed to harvest-now-decrypt-later attacks, starting with internet-facing web traffic, with future phases extending PQC across products. | Milestone: Deployed hybrid post-quantum key exchange (X25519MLKEM768) for all 1Password web application TLS connections; data protected today on PQC-capable browsers (Chrome, Firefox). Phase 1 of broader roadmap complete.
- **PQC Algorithms Announced**: ML-KEM
- **Target Migration Dates**: None detected
- **Products / Services Covered**: 1Password web application
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: Yes, hybrid post-quantum key exchange (X25519MLKEM768) combining classical cryptography with a quantum-resistant algorithm
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "We are thrilled to announce the first major milestone in our post-quantum cryptography (PQC) journey, the successful deployment of PQC on 1Password’s web application."
- **Coverage Verification**: CONSISTENT, the document confirms the deployment of hybrid PQC for web traffic as Phase 1 of a broader roadmap targeting HNDL risks.
- **Extraction Quality**: HIGH
- **Source Document**: VND-114_1Password_Inc..html (164.4 KB)
- **Extraction Timestamp**: 2026-06-06T14:40:35

## VND-367 — Cohesity

- **Vendor ID**: VND-367
- **Vendor Name**: Cohesity
- **Roadmap Title**: The Cohesity post-quantum cryptography strategy
- **Roadmap URL**: https://www.cohesity.com/blogs/the-cohesity-post-quantum-cryptography-strategy/
- **Publish Date**: 2024-12-12
- **Local File**: public/vendor-roadmaps/VND-367_Cohesity.html
- **CSV Coverage Notes**: Official Cohesity blog laying out a four-phase PQC strategy: monitor (track quantum advances), extend (prolong current crypto viability, e.g. migrate to 4096-bit RSA), adopt (implement NIST-standardized PQC algorithms standardized summer 2024), and wait (transition to quantum cryptography later). References regulatory timelines (NSM-10 transition by 2035, NIST deprecation after 2030 / disallow after 2035) and notes AES-256 remains resilient against quantum attacks. | Milestone: Adopt phase: implementing NIST-standardized PQC algorithms and extending current cryptography (4096-bit RSA) while al
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: Transition away from quantum-vulnerable cryptography by 2035; NIST deprecate after 2030; disallow entirely after 2035
- **Products / Services Covered**: None detected
- **Compliance Frameworks**: FIPS 140-3; National Security Memorandum 10 (NSM-10)
- **Hybrid Mode Support**: None detected
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Our strategy has four steps, summed up in four words: monitor, extend, adopt, and wait."; "Cohesity’s migration to 4096-bit keys is a step to extend the useful lifetime of RSA and Diffie-Hellman."; "industry needs to begin adopting post-quantum cryptography now... and complete the transition by 2035"
- **Coverage Verification**: CONSISTENT — The document explicitly details the four-phase strategy (monitor, extend, adopt, wait), references NSM-10 and NIST timelines (2030/2035), mentions the summer 2024 standardization, and confirms AES-256 resilience and 4096-bit RSA migration.
- **Extraction Quality**: HIGH
- **Source Document**: VND-367_Cohesity.html (184.3 KB)
- **Extraction Timestamp**: 2026-06-06T14:41:02

## VND-368 — Commvault

- **Vendor ID**: VND-368
- **Vendor Name**: Commvault
- **Roadmap Title**: Future-Proofing Your Data: Post-Quantum Cryptography and Beyond
- **Roadmap URL**: https://www.commvault.com/blogs/future-proofing-your-data-post-quantum-cryptography-and-beyond
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-368_Commvault.html
- **CSV Coverage Notes**: Commvault maintains a dedicated PQC content hub (commvault.com/explore/post-quantum-cryptography) plus strategy blogs describing a crypto-agility framework that lets customers update algorithms without overhauling systems. Commvault Cloud (CPR 2024) uses CRYSTALS-Kyber (KEM) and CRYSTALS-Dilithium3/FALCON (signatures), supports SPHINCS+, and added NIST's HQC algorithm to defend against harvest-now-decrypt-later, aligning to NIST FIPS 203/204/205 (Aug 2024). | Milestone: Integrated NIST's HQC algorithm and expanded crypto-agile PQC support (Kyber/Dilithium/FALCON/SPHINCS+) within Commvault Clou
- **PQC Algorithms Announced**: CRYSTALS-Kyber; CRYSTALS-Dilithium3; Falcon; Sphincs+
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Commvault Cloud CPR 2024
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: No
- **Current GA Status**: GA
- **Customer Action Required**: Use Security IQ to gain insights into security posture and implement controls
- **Key Commitments & Quotes**: "Commvault Cloud CPR 2024, which leverages CRYSTALS-Kyber for key encapsulation, and CRYSTALS-Dilithium3 or FALCON for digital signature schemes"
- **Coverage Verification**: MISMATCH - The document does not mention HQC, NIST FIPS 203/204/205, or the specific PQC content hub URL.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-368_Commvault.html (106.8 KB)
- **Extraction Timestamp**: 2026-06-06T14:41:50

## VND-169 — Cryptomathic A/S

- **Vendor ID**: VND-169
- **Vendor Name**: Cryptomathic A/S
- **Roadmap Title**: A Banker's Guide to Quantum Safe Cryptography - Part 3: Roadmap to PQC Migration for Financial Institutions
- **Roadmap URL**: https://www.cryptomathic.com/a-bankers-guide-to-quantum-safe-cryptography-part-3-roadmap-to-pqc-migration-for-financial-institutions-cryptomathic
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-169_Cryptomathic_A_S.html
- **CSV Coverage Notes**: Part 3 of Cryptomathic's three-part 'Banker's Guide to Quantum Safe Cryptography'. Lays out an explicit five-phase PQC migration roadmap with month-based timelines: Phase 1 (0-6mo) crypto inventory and governance; Phase 2 (3-12mo) centralized key management and deprecating SHA-1/1024-bit RSA/3DES; Phase 3 (9-18mo) hybrid classical-PQC pilots and HSM/library upgrades; Phase 4 (18-36mo) broad deployment prioritizing high-risk systems; Phase 5 (36mo+) legacy decommission and crypto agility. Aligned to DORA, NIS2, PCI DSS 4.0 and EU coordinated roadmap targets. | Milestone: Hybrid classical-PQC en
- **PQC Algorithms Announced**: Kyber; Dilithium
- **Target Migration Dates**: Start transition activities by end-2026; secure high-risk systems with PQC by end-2030; complete remaining transition by 2035
- **Products / Services Covered**: None detected
- **Compliance Frameworks**: DORA; NIS2; PCI DSS 4.0; CNSA 2.0; NIST; ENISA
- **Hybrid Mode Support**: Yes, the document explicitly recommends adopting hybrid classical–PQC encryption schemes and piloting hybrid implementations.
- **Current GA Status**: No PQC
- **Customer Action Required**: Perform cryptographic inventory; establish governance; implement centralized key management; replace deprecated algorithms (SHA-1, 1024-bit RSA, 3DES); pilot hybrid PQC; upgrade HSMs and libraries; decommission legacy crypto.
- **Key Commitments & Quotes**: "migrate to post-quantum cryptography (PQC) to counter looming quantum threats"; "secure high-risk systems, including critical financial infrastructure, with PQC by end-2030"; "achieve crypto agility – the ability to swiftly swap and upgrade cryptographic algorithms"
- **Coverage Verification**: CONSISTENT, the document text explicitly details the five-phase roadmap with the specified month-based timelines and regulatory alignments mentioned in the CSV notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-169_Cryptomathic_A_S.html (251.3 KB)
- **Extraction Timestamp**: 2026-06-06T14:42:37

## VND-291 — Cybernetica AS

- **Vendor ID**: VND-291
- **Vendor Name**: Cybernetica AS
- **Roadmap Title**: Cybernetica to lead Estonia's transition to quantum-safe e-governance
- **Roadmap URL**: https://cyber.ee/resources/news/estonia-pqc-transition/
- **Publish Date**: 2025-11-10
- **Local File**: public/vendor-roadmaps/VND-291_Cybernetica_AS.html
- **CSV Coverage Notes**: Cybernetica won three Estonian government procurements to lead the national PQC transition and develop Estonia's national PQC roadmap. The roadmap follows three phases: (1) cryptographic inventory of existing systems, (2) detailed transition planning with timelines and priorities, (3) implementation across Estonia's digital infrastructure (eID/ID-card, Mobile-ID, Smart-ID, X-Road, public e-services, i-voting). Includes a Population Register security assessment and updated cryptographic-algorithm lifecycle research. Modeled on Cybernetica's earlier X-Road SHA-1 to SHA-512 migration. | Milestone
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: EU NIS Cooperation Group deadline for high-risk use cases by 2030; medium-risk cases by 2035; U.S. NSA requires quantum-resistant algorithms in new products/services starting in 2027
- **Products / Services Covered**: eID solutions (ID-card, Mobile-ID, Smart-ID); X-Road data exchange platform; public e-services; Internet voting system; Population Register
- **Compliance Frameworks**: ETSI; Post Quantum Cryptography Coalition; British National Cyber Security Centre; EU NIS Cooperation Group; U.S. National Security Agency
- **Hybrid Mode Support**: None detected
- **Current GA Status**: No PQC
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Cybernetica has been very invested in researching PQC since 2017 and we have a very clear picture of the transitioning process."
- **Coverage Verification**: CONSISTENT — The document explicitly confirms the three procurements, the three-phase roadmap structure, the specific systems covered, the Population Register assessment, the lifecycle research, and the comparison to the X-Road SHA-1 to SHA-512 migration.
- **Extraction Quality**: HIGH
- **Source Document**: VND-291_Cybernetica_AS.html (78.0 KB)
- **Extraction Timestamp**: 2026-06-06T14:43:26

## VND-154 — Ericsson AB

- **Vendor ID**: VND-154
- **Vendor Name**: Ericsson AB
- **Roadmap Title**: Quantum-safe networks explained
- **Roadmap URL**: https://www.ericsson.com/en/security/quantum-safe-networks
- **Publish Date**: 2025
- **Local File**: public/vendor-roadmaps/VND-154_Ericsson_AB.html
- **CSV Coverage Notes**: Official Ericsson strategy page for transitioning telecom networks to quantum-resistant cryptography, referencing NIST ML-KEM/ML-DSA/SLH-DSA, NSA CNSA 2.0, and standardization work in 3GPP, IETF, GSMA. Lays out a phased migration: PQC likely introduced in 5G releases 20/21, with 6G (release 21) quantum-resistant from the start. | Milestone: PQC expected to be introduced in 5G era (3GPP releases 20/21) and 6G fully quantum-resistant from the start (~release 21), aligned with NSA 2030 phase-out guidance.
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA
- **Target Migration Dates**: PQC likely introduced in 5G releases 20/21; 6G fully quantum-resistant from the start (release 21)
- **Products / Services Covered**: None detected
- **Compliance Frameworks**: NIST; IETF; 3GPP
- **Hybrid Mode Support**: None detected
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "In 3GPP, post-quantum cryptography will likely be introduced already in the 5G era as part of upcoming releases 20 and/or 21."
- **Coverage Verification**: PARTIAL — The document confirms the 3GPP/IETF timelines and NIST algorithms but does not explicitly mention NSA CNSA 2.0 or GSMA in the provided text.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-154_Ericsson_AB.html (290.9 KB)
- **Extraction Timestamp**: 2026-06-06T14:44:08

## VND-300 — EU NIS Cooperation Group

- **Vendor ID**: VND-300
- **Vendor Name**: EU NIS Cooperation Group
- **Roadmap Title**: A Coordinated Implementation Roadmap for the Transition to Post-Quantum Cryptography
- **Roadmap URL**: https://digital-strategy.ec.europa.eu/en/library/coordinated-implementation-roadmap-transition-post-quantum-cryptography
- **Publish Date**: 2025-06-23
- **Local File**: public/vendor-roadmaps/VND-300_EU_NIS_Cooperation_Group.html
- **CSV Coverage Notes**: Roadmap produced by the PQC work stream of the NIS Cooperation Group (alongside the European Commission), released to Member States 23 June 2025. Sets coordinated milestones: start transition by end-2026, protect critical infrastructure with PQC by end-2030, complete transition where feasible by 2035, favoring hybrid PQC schemes. | Milestone: Member States to begin PQC transition by end of 2026; critical infrastructure to PQC by end of 2030; broad completion by 2035.
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: None detected
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: None detected
- **Current GA Status**: No PQC
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: None detected
- **Coverage Verification**: MISMATCH — The document text is a webpage wrapper that mentions the roadmap's existence and date but does not contain the specific milestones (2026, 2030, 2035) or hybrid scheme preferences stated in the CSV notes.
- **Extraction Quality**: LOW
- **Source Document**: VND-300_EU_NIS_Cooperation_Group.html (49.3 KB)
- **Extraction Timestamp**: 2026-06-06T14:44:59

## VND-220 — European Commission

- **Vendor ID**: VND-220
- **Vendor Name**: European Commission
- **Roadmap Title**: A Coordinated Implementation Roadmap for the Transition to Post-Quantum Cryptography
- **Roadmap URL**: https://digital-strategy.ec.europa.eu/en/library/coordinated-implementation-roadmap-transition-post-quantum-cryptography
- **Publish Date**: 2025-06-23
- **Local File**: public/vendor-roadmaps/VND-220_European_Commission.html
- **CSV Coverage Notes**: Official European Commission roadmap (developed with the NIS Cooperation Group PQC work stream), building on the Commission's 11 April 2024 Recommendation. Provides coordinated, phased EU-wide PQC transition guidance using hybrid schemes across public administration and critical infrastructure. | Milestone: Member States to start PQC transition by end of 2026; critical infrastructure protected with PQC by end of 2030; transition completed for as many systems as feasible by 2035.
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: None detected
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: None detected
- **Current GA Status**: No PQC
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: None detected
- **Coverage Verification**: MISMATCH — The provided text is a webpage wrapper that mentions the roadmap's existence and date but does not contain the specific milestones (2026, 2030, 2035) or hybrid scheme guidance cited in the CSV notes.
- **Extraction Quality**: LOW
- **Source Document**: VND-220_European_Commission.html (49.3 KB)
- **Extraction Timestamp**: 2026-06-06T14:45:21

## VND-374 — F5

- **Vendor ID**: VND-374
- **Vendor Name**: F5
- **Roadmap Title**: Understanding PQC Standards and Timelines
- **Roadmap URL**: https://www.f5.com/company/blog/understanding-pqc-standards-and-timelines
- **Publish Date**: 2025-07-24
- **Local File**: public/vendor-roadmaps/VND-374_F5.html
- **CSV Coverage Notes**: F5 strategic PQC transition guide outlining NIST-finalized algorithms (FIPS 203/204/205, HQC expected 2027) and a phased migration: 2025-2027 inventory crypto assets and deploy PQC at the edge, US federal migration by 2030, national security systems fully quantum-resistant by 2035. Complemented by F5's PQC readiness solutions page and hybrid TLS approach. | Milestone: 2025-2027: inventory cryptographic assets and deploy hybrid PQC (quantum-safe TLS) at the network edge, ahead of the 2030 federal migration target.
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA; HQC
- **Target Migration Dates**: By 2030: U.S. federal agencies must migrate to PQC; By 2035: National security systems must be fully quantum-resistant
- **Products / Services Covered**: F5 Application Delivery and Security Platform (ADSP)
- **Compliance Frameworks**: FIPS 203; FIPS 204; FIPS 205
- **Hybrid Mode Support**: Yes, the document discusses deploying "hybrid classical and PQC algorithms" and "hybrid certificates" to facilitate a smooth transition.
- **Current GA Status**: Planned
- **Customer Action Required**: Inventory cryptographic footprint; Deploy edge platforms with PQC capabilities; Engage vendors on quantum readiness; Focus on long-term confidentiality
- **Key Commitments & Quotes**: "By 2030: U.S. federal agencies must migrate to PQC"; "By 2035: National security systems must be fully quantum-resistant"; "Deploy edge platforms with PQC capabilities."
- **Coverage Verification**: CONSISTENT, the document explicitly confirms the NIST standards, HQC timeline, and the specific 2025-2027 and 2030/2035 migration milestones outlined in the notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-374_F5.html (354.8 KB)
- **Extraction Timestamp**: 2026-06-06T14:45:44

## VND-140 — Forward Edge-AI Inc.

- **Vendor ID**: VND-140
- **Vendor Name**: Forward Edge-AI Inc.
- **Roadmap Title**: Post-Quantum Cryptography (PQC) Implementation Playbook (12-month roadmap)
- **Roadmap URL**: https://itbrief.co.uk/story/forward-edge-ai-unveils-12-month-post-quantum-roadmap
- **Publish Date**: 2026-03-13
- **Local File**: public/vendor-roadmaps/VND-140_Forward_Edge-AI_Inc..html
- **CSV Coverage Notes**: Forward Edge-AI published a 'Global PQC Implementation Playbook' presenting a structured 12-month migration roadmap across seven phases: (1) governance & strategic planning, (2) cryptographic asset inventory mapping RSA/ECC/legacy dependencies, (3) proof-of-concept validation, (4) AI-driven orchestration/fleet management of key operations, (5) workforce training & PQC certification, (6) full production deployment to quantum-safe states, (7) continuous monitoring & quarterly compliance auditing. Targets government, defense, critical infrastructure, financial institutions, and multinationals; al
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Isidore Quantum
- **Compliance Frameworks**: NIS2; DORA; Quantum Readiness Index; CSA 2025
- **Hybrid Mode Support**: None detected
- **Current GA Status**: No PQC
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "The transition to post-quantum security is no longer a research initiative. It is an implementation requirement"
- **Coverage Verification**: CONSISTENT, the document confirms the 12-month roadmap, seven phases, and target sectors as described in the notes.
- **Extraction Quality**: LOW
- **Source Document**: VND-140_Forward_Edge-AI_Inc..html (87.5 KB)
- **Extraction Timestamp**: 2026-06-06T14:46:31

## VND-423 — IBM Research (CBOMkit)

- **Vendor ID**: VND-423
- **Vendor Name**: IBM Research (CBOMkit)
- **Roadmap Title**: IBM bringing organizations along the quantum-safe journey (IBM Quantum Safe roadmap)
- **Roadmap URL**: https://research.ibm.com/blog/quantum-safe-roadmap
- **Publish Date**: 2023-05-10
- **Local File**: public/vendor-roadmaps/VND-423*IBM_Research_CBOMkit*.html
- **CSV Coverage Notes**: IBM Research's official Quantum Safe roadmap presenting a three-phase strategic blueprint: Discover (cryptography inventory / CBOM via Explorer and Advisor), Observe (analyze cryptographic posture and prioritize vulnerabilities), and Transform (remediate with crypto-agility). The roadmap ties phases to external milestones: NIST publishing PQC standards in 2024 and NSA/CNSA requirements for quantum-safe algorithms in national security systems by 2025. CBOMkit (now contributed to the Post-Quantum Cryptography Alliance) supports the Discover phase. This is a genuine strategic timeline document, n
- **PQC Algorithms Announced**: CRYSTALS-Kyber; CRYSTALS-Dilithium; Falcon
- **Target Migration Dates**: NIST publishing PQC standards in 2024; NSA requiring quantum-safe algorithms in national security systems by 2025
- **Products / Services Covered**: IBM Quantum Safe Explorer; IBM Quantum Safe Advisor; IBM Quantum Safe Remediator; IBM z16; IBM Tape
- **Compliance Frameworks**: NIST; FIPS; CNSA 2.0
- **Hybrid Mode Support**: Yes; Remediator supports a hybrid implementation approach allowing use of classical and quantum-safe cryptography during transition
- **Current GA Status**: GA; Explorer and Advisor are released, and the first generation of Remediator is released
- **Customer Action Required**: Complete cryptography inventory; create a CBOM; begin quantum-safe transition
- **Key Commitments & Quotes**: "This roadmap serves as a commitment to transparency, predictability, and confidence as we guide industries along their journey to post-quantum cryptography."
- **Coverage Verification**: PARTIAL; The document confirms the three-phase roadmap, milestones, and tools, but does not mention "CBOMkit" or its contribution to the Post-Quantum Cryptography Alliance.
- **Extraction Quality**: HIGH
- **Source Document**: VND-423*IBM_Research_CBOMkit*.html (84.2 KB)
- **Extraction Timestamp**: 2026-06-06T14:46:57

## VND-269 — Kryptus Soluções em TI Ltda.

- **Vendor ID**: VND-269
- **Vendor Name**: Kryptus Soluções em TI Ltda.
- **Roadmap Title**: The Quantum Countdown: A Practical Guide to Sovereign, Quantum-Safe Transition with Kryptus
- **Roadmap URL**: https://kryptus.com/practical-guide-to-quantum-safe-transition/
- **Publish Date**: 2025-10-31
- **Local File**: public/vendor-roadmaps/VND-269_Kryptus_Solu_es_em_TI_Ltda..html
- **CSV Coverage Notes**: Official Kryptus guide laying out a four-step PQC migration roadmap: (1) Discover and Prioritize - inventory public-key crypto usage, prioritizing mission-critical assets; (2) Fortify the Core - deploy kNET HSM as central crypto root of trust for PQC keys/certs; (3) Secure the Arteries - roll out CommGuard network encryptors with hybrid classical/PQC key exchange; (4) Extend to the Edge - deploy KeyGuardian devices to remote personnel for end-to-end quantum-resistant protection. Built around the BruitBlanc ecosystem; emphasizes crypto-agility. A companion EU-focused piece (post-quantum-cryptog
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; CRYSTALS-Kyber; CRYSTALS-Dilithium
- **Target Migration Dates**: None detected
- **Products / Services Covered**: kNET HSM; CommGuard (CG) Network Encryptor; KeyGuardian (KG) Portable Cryptocomputer; BruitBlanc Suite
- **Compliance Frameworks**: Common Criteria EAL4+; NIST CAVP; FIPS 140-2 Level 3; ISO/IEC 15408
- **Hybrid Mode Support**: Partial; The CSV notes mention "hybrid classical/PQC key exchange" for CommGuard, but the document text only explicitly states CommGuard integrates "ML-KEM" and KeyGuardian uses "ML-KEM" alongside "One-Time Pad (OTP)".
- **Current GA Status**: GA; The document describes the products as "certified," "PQC-native," and having "NIST CAVP Validation," implying general availability.
- **Customer Action Required**: Begin the PQC transition immediately; inventory public-key crypto usage; prioritize mission-critical assets; deploy kNET HSM as root of trust; roll out CommGuard; deploy KeyGuardian.
- **Key Commitments & Quotes**: "The kNET HSM is engineered to be PQC-native, with explicit support for the official NIST-standardized post-quantum algorithms: ML-DSA... ML-KEM"; "The finalization of the first official PQC standards in 2024 marks the formal commencement of the global migration era"; "BruitBlanc ecosystem offers a practical, certified, and sovereign pathway to not only achieve quantum-resistance"
- **Coverage Verification**: PARTIAL; The document confirms the four-step roadmap structure and product roles (kNET, CommGuard, KeyGuardian) within the BruitBlanc ecosystem, but does not explicitly detail the "Discover and Prioritize" inventory step or explicitly state "hybrid" mode for CommGuard in the text provided.
- **Extraction Quality**: HIGH
- **Source Document**: VND-269_Kryptus_Solu_es_em_TI_Ltda..html (79.8 KB)
- **Extraction Timestamp**: 2026-06-06T14:47:34

## VND-341 — Mastercard Incorporated

- **Vendor ID**: VND-341
- **Vendor Name**: Mastercard Incorporated
- **Roadmap Title**: Migration to post-quantum cryptography (Mastercard R&D white paper)
- **Roadmap URL**: https://www.mastercard.com/global/en/news-and-trends/Insights/2025/post-quantum-cryptography-white-paper.html
- **Publish Date**: 2025
- **Local File**: public/vendor-roadmaps/VND-341_Mastercard_Incorporated.html
- **CSV Coverage Notes**: Mastercard R&D white paper (co-authored with NTU Singapore and PQStation) on migrating the financial sector to post-quantum cryptography. Covers the Harvest-Now-Decrypt-Later threat, compares PQC vs QKD (concluding PQC is more practical), and gives strategic migration guidance: build cryptographic inventories, adopt hybrid classical/PQC solutions where practical with full PQC migration later as standards mature. Mastercard is among the most aggressive card networks on PQC (quantum-resistant Ecos contactless cards since Oct 2022, Quantum Security and Communications project, participation in Eur
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: None detected
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: Partial; The document advises to "adopting quantum-safe technologies, such as Post-Quantum Cryptography and Quantum Key Distribution, and preparing for a migration away from classical cryptographic systems."
- **Current GA Status**: No PQC
- **Customer Action Required**: Financial organizations must proactively plan for a future where quantum-safe practices are the norm, exploring and adopting quantum-safe technologies, and preparing for a migration away from classical cryptographic systems.
- **Key Commitments & Quotes**: "Financial organizations must proactively plan for a future where quantum-safe practices are the norm."
- **Coverage Verification**: MISMATCH; The provided text is a generic web landing page for the white paper and does not contain the specific technical details, co-author names, or specific product claims (e.g., Ecos cards, NTU/PQStation) listed in the CSV Coverage Notes.
- **Extraction Quality**: LOW
- **Source Document**: VND-341_Mastercard_Incorporated.html (146.9 KB)
- **Extraction Timestamp**: 2026-06-06T14:48:10

## VND-118 — Meta Platforms Inc.

- **Vendor ID**: VND-118
- **Vendor Name**: Meta Platforms Inc.
- **Roadmap Title**: Post-Quantum Cryptography Migration at Meta: Framework, Lessons, and Takeaways
- **Roadmap URL**: https://engineering.fb.com/2026/04/16/security/post-quantum-cryptography-migration-at-meta-framework-lessons-and-takeaways/
- **Publish Date**: 2026-04-16
- **Local File**: public/vendor-roadmaps/VND-118_Meta_Platforms_Inc..html
- **CSV Coverage Notes**: Official Meta Engineering blog laying out Meta's PQC migration framework: five PQC Migration Maturity Levels (PQ-Unaware through PQ-Enabled) and a six-step strategy (prioritize risks, inventory crypto assets, address external dependencies, design PQC components, implement guardrails, integrate PQC components). Uses NIST ML-KEM768 and ML-DSA65, prefers hybrid deployment; Meta co-authored HQC as a fallback algorithm. Described as multi-year phased work. | Milestone: Begun deploying post-quantum protections across significant portions of internal traffic using hybrid X25519/ML-KEM768; recommends
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; HQC; BIKE; Classical McEliece
- **Target Migration Dates**: None detected
- **Products / Services Covered**: None detected
- **Compliance Frameworks**: NIST FIPS 203; NIST FIPS 204; NIST FIPS 205; IETF RFCs; ISO PQC standard
- **Hybrid Mode Support**: Partial; The document mentions "hybrid X25519/ML-KEM768" in the CSV notes, but the provided text excerpt does not explicitly describe hybrid deployment strategies, only mentioning "post-quantum encryption" and "PQC protections".
- **Current GA Status**: Planned; The document states Meta has "begun deploying and rolling out post-quantum encryption across our internal infrastructure over a multi-year process" and "begun deploying PQ protections across significant portions of our internal traffic".
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "We have already begun deploying and rolling out post-quantum encryption across our internal infrastructure over a multi-year process"; "Meta cryptographers are co-authors of HQC , one of the newly selected PQC algorithms"; "we have begun deploying PQ protections across significant portions of our internal traffic"
- **Coverage Verification**: PARTIAL; The document confirms the five PQC Migration Maturity Levels, the six-step strategy, HQC co-authorship, and internal deployment milestones, but the specific algorithm parameters (ML-KEM768, ML-DSA65) and the explicit preference for hybrid deployment are not present in the provided text excerpt.
- **Extraction Quality**: HIGH
- **Source Document**: VND-118_Meta_Platforms_Inc..html (121.9 KB)
- **Extraction Timestamp**: 2026-06-06T14:48:33

## VND-119 — Mullvad VPN AB

- **Vendor ID**: VND-119
- **Vendor Name**: Mullvad VPN AB
- **Roadmap Title**: Introducing a post-quantum VPN, Mullvad's strategy for a future problem
- **Roadmap URL**: https://mullvad.net/en/blog/introducing-post-quantum-vpn-mullvads-strategy-future-problem
- **Publish Date**: 2017-12-08
- **Local File**: public/vendor-roadmaps/VND-119_Mullvad_VPN_AB.html
- **CSV Coverage Notes**: Mullvad published an explicit post-quantum strategy: a conservative multi-algorithm key exchange combining at least three algorithms based on different math problems so traffic stays safe if at least one is PQ-secure. Began with New Hope (2017), moved to NIST finalists (Classic McEliece + Kyber/ML-KEM, 2022), stabilized in desktop app v2023.3, and extended PQ-safe WireGuard tunnels across all platforms (Linux, Windows, macOS, Android, iOS). Strategy is tracked through follow-up blog posts. | Milestone: Quantum-resistant (Classic McEliece + ML-KEM) WireGuard tunnels available and stabilized acr
- **PQC Algorithms Announced**: New Hope; SIDH
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Mullvad VPN (WireGuard protocol on Linux)
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: Partial, uses at least three different algorithms, each based on a different math problem
- **Current GA Status**: Beta
- **Customer Action Required**: Install and run WireGuard; download and run the post-quantum setup script; activate/deactivate the post-quantum tunnel using wg-quick commands
- **Key Commitments & Quotes**: "Our ambition is to develop a key exchange that uses at least three different algorithms, each based on a different math problem."
- **Coverage Verification**: PARTIAL, the document confirms the 2017 New Hope beta and multi-algorithm strategy but does not mention the 2022/2023 updates, Classic McEliece, ML-KEM, or cross-platform availability.
- **Extraction Quality**: HIGH
- **Source Document**: VND-119_Mullvad_VPN_AB.html (50.7 KB)
- **Extraction Timestamp**: 2026-06-06T14:49:02

## VND-390 — NetApp

- **Vendor ID**: VND-390
- **Vendor Name**: NetApp
- **Roadmap Title**: Post-Quantum Cryptography | NetApp
- **Roadmap URL**: https://www.netapp.com/cyber-resilience/post-quantum-cryptography/
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-390_NetApp.html
- **CSV Coverage Notes**: NetApp maintains a dedicated cyber-resilience PQC strategy hub describing its plan to embed NIST-approved PQC algorithms (CRYSTALS-Kyber/ML-KEM, Dilithium) for data at rest and in flight, using hybrid cryptography to let enterprises transition to quantum-safe encryption with minimal disruption and without architectural overhauls. Backed by a 'NetApp Roadmap Brief' solution PDF and a partnership with F5 (BIG-IP hybrid key agreement for StorageGRID). | Milestone: PQC for data at rest declared NIST-PQC compliant and integrated into ONTAP (PQC in ONTAP 9.18.1); joint F5+NetApp AI + PQC security so
- **PQC Algorithms Announced**: CRYSTALS-Kyber; CRYSTALS-Dilithium
- **Target Migration Dates**: None detected
- **Products / Services Covered**: None detected
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: None detected
- **Current GA Status**: Planned
- **Customer Action Required**: Evaluate whether stored data depends on RSA, ECC, and AES; ask how long data must remain confidential; consider operational overhead of upgrading storage encryption; consider whether storage solution integrates PQC with broader security features.
- **Key Commitments & Quotes**: "By embedding post-quantum cryptography (PQC) into our storage, we proactively neutralize quantum threats before they materialize."; "Integrated, NIST-approved PQC algorithms keep data secure at rest and in flight."; "NetApp has pioneered built-in quantum encryption that fully protects your data."
- **Coverage Verification**: MISMATCH — The document does not mention ONTAP 9.18.1, the F5 partnership, StorageGRID, or the specific "NetApp Roadmap Brief" PDF referenced in the notes.
- **Extraction Quality**: LOW
- **Source Document**: VND-390_NetApp.html (307.8 KB)
- **Extraction Timestamp**: 2026-06-06T14:49:22

## VND-391 — Nord Security

- **Vendor ID**: VND-391
- **Vendor Name**: Nord Security
- **Roadmap Title**: A VPN with post-quantum encryption | NordVPN
- **Roadmap URL**: https://nordvpn.com/features/vpn-encryption/post-quantum-vpn/
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-391_Nord_Security.html
- **CSV Coverage Notes**: Nord Security (NordVPN) has a published quantum-safe strategy centered on cryptographic agility: it added ML-KEM (CRYSTALS-Kyber) to the NordLynx (WireGuard-based) protocol with key rotation every 90 seconds (patented). Phased rollout from Linux (Sept 2024) to Windows, macOS, iOS, Android/TV (early 2025), reaching all applications by May 2025. Forward roadmap includes adding post-quantum authentication targeted for first half of 2026, aiming to be the first VPN to do so. | Milestone: Post-quantum encryption (ML-KEM key exchange) live across all NordVPN apps (May 2025); next milestone: PQC auth
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: NordVPN; NordLynx
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: None detected
- **Current GA Status**: GA
- **Customer Action Required**: Open the NordVPN app; go to "Settings"; switch on the "Post-quantum encryption" option
- **Key Commitments & Quotes**: "NordVPN has just released an update with a quantum-safe cryptography feature for the NordLynx protocol."
- **Coverage Verification**: MISMATCH — The document confirms PQC is available on NordLynx across all listed OSs but does not mention ML-KEM, 90-second key rotation, specific rollout dates, or future PQC authentication plans.
- **Extraction Quality**: LOW
- **Source Document**: VND-391_Nord_Security.html (309.6 KB)
- **Extraction Timestamp**: 2026-06-06T14:49:43

## VND-433 — OpenBao (LF Edge)

- **Vendor ID**: VND-433
- **Vendor Name**: OpenBao (LF Edge)
- **Roadmap Title**: RFC - Post-Quantum Cryptography Migration Roadmap
- **Roadmap URL**: https://github.com/openbao/openbao/issues/496
- **Publish Date**: 2024-08-30
- **Local File**: public/vendor-roadmaps/VND-433*OpenBao_LF_Edge*.html
- **CSV Coverage Notes**: Official OpenBao RFC design document laying out a phased PQC migration plan following NIST's Aug 2024 standards finalization. Catalogs cryptographic uses across impact, migration difficulty, and failure risk; priority areas include TLS listeners, PKI/SSH CAs, Transit keys, auto-unseal, and JWT/OIDC. Addresses harvest-now-decrypt-later risk and emphasizes incremental, independent migration of each subsystem with user-selectable hybrid/pure PQC algorithms in Transit and PKI. | Milestone: RFC-stage roadmap defining blocking requirements (crypto library availability via Go stdlib/CIRCL, X.509/TLS/
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: OpenBao
- **Compliance Frameworks**: NIST; FIPS 185-5
- **Hybrid Mode Support**: Yes; Transit and PKI might allow pure post-quantum algorithms or various hybrid constructions.
- **Current GA Status**: Planned
- **Customer Action Required**: Explicitly handle interactions such as changing PKI CA key types, rotating unseal/recovery keys, and making explicit choices about key types.
- **Key Commitments & Quotes**: "OpenBao needs to be hardened against quantum adversaries"; "we should start considering our own quantum roadmap"; "no automatic migration will occur for the user"
- **Coverage Verification**: CONSISTENT; The document confirms the RFC status, NIST Aug 2024 context, HNDL risk, incremental migration strategy, and specific subsystems (TLS, PKI, Transit, Auto-unseal, JWT/OIDC) mentioned in the notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-433*OpenBao_LF_Edge*.html (338.4 KB)
- **Extraction Timestamp**: 2026-06-06T14:50:00

## VND-395 — OpenText

- **Vendor ID**: VND-395
- **Vendor Name**: OpenText
- **Roadmap Title**: Preparing for post-quantum cryptography with OpenText SAST and DAST
- **Roadmap URL**: https://blogs.opentext.com/preparing-for-post-quantum-cryptography-with-opentext-sast-and-dast/
- **Publish Date**: 2025-10-23
- **Local File**: public/vendor-roadmaps/VND-395_OpenText.html
- **CSV Coverage Notes**: OpenText blog outlining a phased PQC capability plan for its application security tools. SAST/DAST 25.4 (Oct 2025) add detection of quantum-vulnerable cryptography (new 'Weak Encryption: Non-PQC Resilient Algorithm' category; DAST flags servers lacking TLS 1.3 X25519MLKEM768 hybrid key exchange). Roadmap extensions: expand coverage beyond RSA/DSA, key-length adequacy analysis, multi-language SAST support, and additional ML-KEM permutations and standardized PQC handshakes for DAST. | Milestone: OpenText SAST and DAST 25.4 (Oct 2025) shipped detection of quantum-vulnerable algorithms and absence
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA; X25519MLKEM768
- **Target Migration Dates**: U.S. federal guidance targets completion by 2035; NSA’s CNSA 2.0 sets earlier milestones for some systems (many by 2030)
- **Products / Services Covered**: OpenText SAST 25.4; OpenText DAST 25.4
- **Compliance Frameworks**: FIPS 203; FIPS 204; FIPS 205; NSM-10; CNSA 2.0
- **Hybrid Mode Support**: Yes, DAST flags servers lacking TLS 1.3 configured with post-quantum-resilient hybrid key-exchange options such as X25519MLKEM768
- **Current GA Status**: GA (OpenText SAST and DAST 25.4 released in October 2025)
- **Customer Action Required**: Enable feature flag com.fortify.sca.rules.enablePQCRules in SAST to identify RSA and DSA usage; use DAST to verify TLS 1.3 handshake support for X25519MLKEM768
- **Key Commitments & Quotes**: "We’re expanding coverage beyond RSA and DSA to include other quantum-vulnerable algorithms"; "Future releases will analyze key lengths and configuration parameters"; "We’re planning to extend post-quantum detection across the full range of languages"
- **Coverage Verification**: CONSISTENT, the document explicitly confirms the Oct 2025 release of SAST/DAST 25.4 with the specified detection categories and roadmap extensions.
- **Extraction Quality**: HIGH
- **Source Document**: VND-395_OpenText.html (105.1 KB)
- **Extraction Timestamp**: 2026-06-06T14:50:20

## VND-318 — QANplatform

- **Vendor ID**: VND-318
- **Vendor Name**: QANplatform
- **Roadmap Title**: Roadmap | QANplatform
- **Roadmap URL**: https://learn.qanplatform.com/about-us/roadmap
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-318_QANplatform.html
- **CSV Coverage Notes**: Official QANplatform roadmap page laying out development/audit milestones for its quantum-resistant hybrid Layer-1 blockchain (Dilithium/ML-DSA signatures, XLINK quantum-resistant migration component). Shows QVM Audit and XLINK Audit complete, Integration Audit in progress, MainNet to follow. | Milestone: XLINK (quantum-resistant security component) audit completed; currently in comprehensive Integration Audit (QVM, XLINK, RPC, consensus, governance) ahead of MainNet launch.
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: QANplatform; QVM; XLINK; QAN TestNet; QAN MainNet
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: Yes, described as "quantum-resistant hybrid blockchain platform"
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Our vision of launching the world's first quantum-resistant hybrid blockchain platform"
- **Coverage Verification**: MISMATCH, the document does not mention Dilithium or ML-DSA, and states the XLINK audit is expected in October rather than completed.
- **Extraction Quality**: LOW
- **Source Document**: VND-318_QANplatform.html (455.5 KB)
- **Extraction Timestamp**: 2026-06-06T14:50:51

## VND-319 — QNu Labs Pvt. Ltd.

- **Vendor ID**: VND-319
- **Vendor Name**: QNu Labs Pvt. Ltd.
- **Roadmap Title**: A Strategic Roadmap for Transitioning to Quantum Cyber Readiness
- **Roadmap URL**: https://www.qnulabs.com/blog/cert-in-quantum-cyber-readiness-roadmap
- **Publish Date**: 2026-01-26
- **Local File**: public/vendor-roadmaps/VND-319_QNu_Labs_Pvt.\_Ltd..html
- **CSV Coverage Notes**: Published QNu Labs strategic roadmap (aligned with CERT-In) for transitioning to quantum-safe cryptography. Four phases: foundational assessment & CBOM/QBOM inventory; technology readiness with hybrid PQC (Kyber/ML-KEM) and QRNG; phased organizational rollout (0-1y groundwork, 1-3y high-risk upgrades, 3+y enterprise-wide); resilience/crypto-agility with QKD. | Milestone: Phased migration framework: prioritize high-risk systems within 3-6 months, mid-term (1-3y) PQC upgrades for high-risk assets, long-term (3+y) enterprise-wide quantum-safe deployment with crypto-agility and QKD.
- **PQC Algorithms Announced**: Kyber; ML-KEM
- **Target Migration Dates**: Immediate (0-1 Years); Mid-Term (1-3 Years); Long-Term (3+ Years); high-risk systems within 3–6 months
- **Products / Services Covered**: Hodos (PQC); QShield™ Platform; QConnect; QVerse; Qosmos; Armos (QKD); Tropos (QRNG); Q-ORE Encryptor
- **Compliance Frameworks**: CERT-In; Information Technology Amendment Act 2008
- **Hybrid Mode Support**: Yes; Combining classical algorithms with quantum-resistant ones (like Kyber/ ML-KEM) ensures backward compatibility
- **Current GA Status**: GA
- **Customer Action Required**: Take a quick ‘Quantum Risk Assessment’; Conduct an audit of applications, devices, and protocols; Create a centralized, living inventory of every cryptographic component
- **Key Commitments & Quotes**: "Hybrid Cryptography: Combining classical algorithms with quantum-resistant ones (like Kyber/ ML-KEM ) ensures backward compatibility"
- **Coverage Verification**: CONSISTENT; The document explicitly details the four phases, hybrid PQC (Kyber/ML-KEM), QRNG, QKD, and the specific migration timelines (0-1y, 1-3y, 3+y, 3-6 months) aligned with CERT-In as described in the notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-319_QNu_Labs_Pvt.\_Ltd..html (89.4 KB)
- **Extraction Timestamp**: 2026-06-06T14:51:05

## VND-371 — Red Hat (Dogtag)

- **Vendor ID**: VND-371
- **Vendor Name**: Red Hat (Dogtag)
- **Roadmap Title**: Red Hat's path to post-quantum cryptography
- **Roadmap URL**: https://www.redhat.com/en/blog/red-hats-path-post-quantum-cryptography
- **Publish Date**: 2024-07-15
- **Local File**: public/vendor-roadmaps/VND-371*Red_Hat_Dogtag*.html
- **CSV Coverage Notes**: Red Hat published a strategic three-phase PQC roadmap (Classical -> Post-Quantum Capable -> Post-Quantum Ready) aligning with US/EU/Czech/German/French government timelines and NIST standardization. A follow-up strategy update, 'Building the levee: Why Red Hat's post-quantum strategy is already in production' (2026-05-25, https://www.redhat.com/en/blog/building-levee-why-red-hats-post-quantum-strategy-already-production), details concrete milestones: RHEL 10 first practical PQC steps (May 2025), RHEL 10.1 enabling PQC by default and being the first major distro to sign RPM packages with ML-DSA
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: None detected
- **Compliance Frameworks**: NIST; IETF
- **Hybrid Mode Support**: Yes; "PQ-Ready also supports approved hybrid schemes (classical and post-quantum) as they are available."
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Red Hat is committed to providing customers with functional, quantum-resistant security capabilities as the industry evolves, develops and begins integrating these new cryptographic functions."
- **Coverage Verification**: MISMATCH; The document text does not mention the follow-up strategy update, RHEL 10/10.1 milestones, or ML-DSA signing, which are central to the CSV notes.
- **Extraction Quality**: LOW
- **Source Document**: VND-371*Red_Hat_Dogtag*.html (610.2 KB)
- **Extraction Timestamp**: 2026-06-06T14:51:30

## VND-034 — SafeLogic Inc.

- **Vendor ID**: VND-034
- **Vendor Name**: SafeLogic Inc.
- **Roadmap Title**: Post-Quantum Cryptography (PQC) | SafeLogic PQC Migration Roadmap
- **Roadmap URL**: https://www.safelogic.com/products-and-services/post-quantum-cryptography
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-034_SafeLogic_Inc..html
- **CSV Coverage Notes**: SafeLogic publishes a PQC Migration Roadmap and CMAP (Cryptography Maturity Action Plan) framework with a phased methodology: assess crypto systems, build migration plans, embrace crypto-agility, align with FIPS 140-3. CryptoComply suite delivers ML-KEM/ML-DSA/SLH-DSA with hybrid mode. SafeLogic CEO leads NIST NCCoE PQC Migration Project Risk Management workstream. | Milestone: CryptoComply 140-3 FIPS Provider with PQC submitted to NIST CMVP on 2026-05-19; CryptoComply Go v4.0 with full PQC support generally available.
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA; Kyber; Dilithium; SPHINCS+
- **Target Migration Dates**: None detected
- **Products / Services Covered**: CryptoComply v3.5; CryptoComply BoringCrypto; CryptoComply PQ TLS
- **Compliance Frameworks**: FIPS 140-3; FIPS 140-2; FIPS 203; FIPS 204; FIPS 205; CMMC 2.0; CNSA 2.0; Common Criteria; FedRAMP; GovRAMP
- **Hybrid Mode Support**: Yes; "Hybrid PQC + FIPS Mode Combine ML-KEM with SafeLogic's validated FIPS 140-3 algorithms for quantum-resistant encryption today while staying fully compliant."
- **Current GA Status**: GA; "SafeLogic Announces General Availability of CryptoComply BoringCrypto!" and "CryptoComply v3.5 is the latest evolution... engineered for post-quantum readiness"
- **Customer Action Required**: Assess cryptographic systems; Build a migration plan; Embrace crypto-agility and hybrid models; Align with FIPS 140-3; Download Free PQC Migration Guide
- **Key Commitments & Quotes**: "CryptoComply v3.5... delivers... full support for NIST-standardized PQC algorithms, hybrid cryptography for FIPS environments"
- **Coverage Verification**: PARTIAL; The document confirms the roadmap, CMAP, phased methodology, CryptoComply PQC support, and hybrid mode, but does not mention the CEO's NCCoE role or the specific 2026-05-19 submission milestone.
- **Extraction Quality**: HIGH
- **Source Document**: VND-034_SafeLogic_Inc..html (161.0 KB)
- **Extraction Timestamp**: 2026-06-06T14:51:48

## VND-351 — SatoshiLabs s.r.o.

- **Vendor ID**: VND-351
- **Vendor Name**: SatoshiLabs s.r.o.
- **Roadmap Title**: Going quantum: our choices for Trezor Safe 7's quantum readiness
- **Roadmap URL**: https://trezor.io/guides/trezor-devices/trezor-safe-7/going-quantum
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-351_SatoshiLabs_s.r.o..html
- **CSV Coverage Notes**: SatoshiLabs (Trezor) published its quantum-readiness strategy for the Trezor Safe 7 hardware wallet. Three-layer security architecture (boardloader/bootloader/firmware) designed for post-quantum verification. Uses SLH-DSA-128 (hybrid with Ed25519) for quantum-secure boot and ML-DSA-44 for device attestation; each device ships with a post-quantum device certificate. References NIST 2035 transition framework as forward context. | Milestone: Trezor Safe 7 launched as the first quantum-ready hardware wallet with PQC-protected boot (SLH-DSA-128) and device attestation (ML-DSA-44); positioned for fu
- **PQC Algorithms Announced**: SLH-DSA; ML-DSA; Dilithium; Falcon
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Trezor Safe 7
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: Yes; The boardloader uses a hybrid scheme signed with both SLH-DSA and EdDSA (Ed25519), requiring both signatures to validate firmware updates.
- **Current GA Status**: Planned; The document states "Trezor Safe 7 can run post-quantum updates, but these updates don't exist yet."
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Trezor Safe 7 can run post-quantum updates, but these updates don't exist yet."; "Each Trezor Safe 7 is quantum-ready from the moment it powers on."; "Legacy devices that rely only on classical elliptic curve cryptography for firmware verification cannot be patched"
- **Coverage Verification**: CONSISTENT; The document confirms the three-layer architecture, the use of SLH-DSA-128 hybrid with Ed25519 for boot, ML-DSA-44 for attestation, and the NIST 2035 context.
- **Extraction Quality**: HIGH
- **Source Document**: VND-351_SatoshiLabs_s.r.o..html (540.7 KB)
- **Extraction Timestamp**: 2026-06-06T14:52:18

## VND-038 — Senetas Corporation Ltd.

- **Vendor ID**: VND-038
- **Vendor Name**: Senetas Corporation Ltd.
- **Roadmap Title**: Quantum Resistant Encryption Security - Senetas (5-step Quantum Security roadmap)
- **Roadmap URL**: https://www.senetas.com/cybersecurity-challenges/post-quantum-encryption-security/
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-038_Senetas_Corporation_Ltd..html
- **CSV Coverage Notes**: Senetas publishes a post-quantum encryption strategy with a 5-step roadmap to quantum security: crypto-agility, risk assessment, QRNG, QKD, and adoption of NIST-standardized quantum-resistant algorithms. Hybrid approach combining conventional and quantum-resistant crypto; crypto-agile FPGA design updatable in-field. Aligns with NIST 2024 standards and ETSI QKD standards. | Milestone: First-to-market high-speed network encryptors with Quantum Resistant Encryption (QRE) supporting all NIST-selected PQC algorithms; offered to existing customers (direct in AU/NZ, via Thales globally) for in-field
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA
- **Target Migration Dates**: None detected
- **Products / Services Covered**: CypherNET CN Series (CN9000, CN6000, CN7000, CN4000); CypherNET CV Series (CV1000)
- **Compliance Frameworks**: NIST FIPS 203; NIST FIPS 204; NIST FIPS 205
- **Hybrid Mode Support**: Yes, "Senetas delivers a hybrid approach — combining conventional cryptography with quantum-resistant techniques"
- **Current GA Status**: GA
- **Customer Action Required**: Practice Crypto-Agility; Undertake a Post-Quantum Risk Assessment; Protect Applications with Quantum Random Number Generation; Secure Data in Motion with Quantum Key Distribution; Implement Quantum Resistant Algorithms
- **Key Commitments & Quotes**: "Senetas supports all quantum encryption algorithms selected by NIST"; "first to market with our high-speed network encryptors offering Quantum Resistant Encryption (QRE)"; "crypto-agile by design... updated in-field without the need to rip and replace"
- **Coverage Verification**: PARTIAL, The document confirms the 5-step roadmap, hybrid approach, FPGA crypto-agility, NIST FIPS standards, and first-to-market status, but does not explicitly mention ETSI QKD standards.
- **Extraction Quality**: HIGH
- **Source Document**: VND-038_Senetas_Corporation_Ltd..html (188.5 KB)
- **Extraction Timestamp**: 2026-06-06T14:52:39

## VND-322 — Society for Worldwide Interbank Financial Telecommunication SC

- **Vendor ID**: VND-322
- **Vendor Name**: Society for Worldwide Interbank Financial Telecommunication SC
- **Roadmap Title**: Future-proofing the financial ecosystem
- **Roadmap URL**: https://www.swift.com/news-events/news/future-proofing-financial-ecosystem
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-322_Society_for_Worldwide_Interbank_Financial_Telecommunication_SC.html
- **CSV Coverage Notes**: Swift has published an official quantum-safe / post-quantum strategy: it is evolving its platform for quantum computing and PQC, and committed that in 2027 it will release SwiftNet 8.0, an upgraded network enabled for post-quantum cryptography, with an indicated ~15-month migration window for institutions. Swift also participated in BIS Project Leap (Phase 2) validating PQC in operational payments and offers an 'Introduction to Post-Quantum Security' training. Multiple official swift.com pages document this plan (e.g. 'Future-proofing the financial ecosystem', 'A quantum leap into the future o
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: None detected
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: None detected
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "evolving our infrastructure to further reinforce our platform and ensure it is future-proofed and ready for new technologies, including zero-trust models, AI, quantum computing, and post-quantum cryptography."
- **Coverage Verification**: MISMATCH — The document mentions evolving infrastructure for PQC but does not contain the specific commitments regarding SwiftNet 8.0 in 2027, the 15-month migration window, BIS Project Leap participation, or the training course cited in the notes.
- **Extraction Quality**: LOW
- **Source Document**: VND-322_Society_for_Worldwide_Interbank_Financial_Telecommunication_SC.html (173.2 KB)
- **Extraction Timestamp**: 2026-06-06T14:53:05

## VND-040 — SUSE LLC

- **Vendor ID**: VND-040
- **Vendor Name**: SUSE LLC
- **Roadmap Title**: SUSE state of and strategy for Post Quantum Cryptography at the end of 2025
- **Roadmap URL**: https://www.suse.com/c/suse-state-of-and-strategy-for-post-quantum-cryptography-at-the-end-of-2025/
- **Publish Date**: 2025-12-04
- **Local File**: public/vendor-roadmaps/VND-040_SUSE_LLC.html
- **CSV Coverage Notes**: Official SUSE Communities strategy blog laying out SUSE's PQC approach: adopt NIST standards (ML-KEM/ML-DSA/SLH-DSA, FIPS 203-205) and upstream implementations as they mature, delivering via maintenance updates and new product revisions, using hybrid classical+PQC ciphers during transition. Covers progressive rollout across SLES 15 SP6/SP7, SL Micro 6.0-6.2, and SLES 16, integrating PQC into OpenSSL, GnuTLS, libgcrypt, NSS, OpenSSH 10+, strongSwan 6.0+, and Go. | Milestone: SLES 16.0 and SL Micro 6.2 expand PQC support across OpenSSL, GnuTLS, libgcrypt, and leancrypto; hybrid x25519mlkem768 ke
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA; LMS; XMSS; Frodo KEM
- **Target Migration Dates**: None detected
- **Products / Services Covered**: SLES 15 SP6; SLES 15 SP7; SL Micro 6.0; SL Micro 6.1; SLES 16.0; SL Micro 6.2; OpenSSL; GnuTLS; libgcrypt; leancrypto; liboqs; Mozilla NSS; Go; OpenSSH; strongSwan
- **Compliance Frameworks**: FIPS 203; FIPS 204; FIPS 205; FIPS 186; FIPS 140-3
- **Hybrid Mode Support**: Yes, the document states that "During the transition time there will be hybrid ciphers used" and specifically mentions "hybrid ML-KEM 768 / X25519 key agreement" for TLS, IKEv2, and SSH.
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "SUSE’s strategy on implementing post quantum cryptography (PQC) has been to adopt standards and upstream implementations when they become available"
- **Coverage Verification**: CONSISTENT, the document confirms the adoption of NIST standards (ML-KEM/ML-DSA/SLH-DSA, FIPS 203-205), upstream implementations, hybrid ciphers, and the specific product rollout across SLES 15 SP6/SP7, SL Micro 6.0-6.2, and SLES 16.
- **Extraction Quality**: HIGH
- **Source Document**: VND-040_SUSE_LLC.html (188.6 KB)
- **Extraction Timestamp**: 2026-06-06T14:53:23

## VND-227 — SUSE LLC (openSUSE)

- **Vendor ID**: VND-227
- **Vendor Name**: SUSE LLC (openSUSE)
- **Roadmap Title**: SUSE state of and strategy for Post Quantum Cryptography at the end of 2025
- **Roadmap URL**: https://www.suse.com/c/suse-state-of-and-strategy-for-post-quantum-cryptography-at-the-end-of-2025/
- **Publish Date**: 2025-12-04
- **Local File**: public/vendor-roadmaps/VND-227*SUSE_LLC_openSUSE*.html
- **CSV Coverage Notes**: SUSE's official PQC strategy blog explicitly covers both SUSE Linux Enterprise and openSUSE: adopt NIST standards and upstream implementations quickly, use hybrid ciphers during transition. openSUSE Tumbleweed/Leap have landed hybrid PQC (ML-KEM-768 + X25519), including the libzupt cryptographic library (announced openSUSE news, 2026-04-28). | Milestone: Hybrid PQC (ML-KEM-768 + X25519) available in openSUSE Tumbleweed and Leap; libzupt PQC library released (April 2026).
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA; LMS; XMSS; Frodo KEM
- **Target Migration Dates**: None detected
- **Products / Services Covered**: SUSE Linux Enterprise Server 15 SP6; SUSE Linux Enterprise Server 15 SP7; SUSE Linux Micro 6.0; SUSE Linux Micro 6.1; SUSE Linux Enterprise Server 16.0; SUSE Linux Micro 6.2
- **Compliance Frameworks**: FIPS 203; FIPS 204; FIPS 205; FIPS 186; FIPS 140-3
- **Hybrid Mode Support**: Yes, the document states that "During the transition time there will be hybrid ciphers used" and specifically mentions "hybrid ML-KEM 768 / X25519 key agreement" for TLS, IKEv2, and SSH.
- **Current GA Status**: GA (General Availability), as indicated by the integration of liboqs in SLES 15 SP6 and the availability of hybrid key exchanges in supported software versions.
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "SUSE’s strategy on implementing post quantum cryptography (PQC) has been to adopt standards and upstream implementations when they become available"; "SUSE’s strategy going forward is that of a quick adoption of both standards and upstream implementations"; "We will use future product deliveries and also maintenance feature updates to improve SUSE’s PQC coverage"
- **Coverage Verification**: MISMATCH, the document text does not mention openSUSE Tumbleweed, openSUSE Leap, or the libzupt library, which are central to the CSV Coverage Notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-227*SUSE_LLC_openSUSE*.html (188.6 KB)
- **Extraction Timestamp**: 2026-06-06T14:53:52

## VND-327 — Tailscale Inc.

- **Vendor ID**: VND-327
- **Vendor Name**: Tailscale Inc.
- **Roadmap Title**: Post-quantum cryptography - Tailscale Docs
- **Roadmap URL**: https://tailscale.com/kb/1460/post-quantum-cryptography
- **Publish Date**: 2025-05-02
- **Local File**: public/vendor-roadmaps/VND-327_Tailscale_Inc..html
- **CSV Coverage Notes**: Official Tailscale KB doc explaining its PQC strategy. Tailscale's WireGuard is not yet post-quantum secure; rather than altering WireGuard's protocol, Tailscale plans to leverage WireGuard's pre-shared key (PSK) feature and build automatic PSK provisioning/distribution, with the distribution mechanism itself using post-quantum cryptography (e.g., TLS with ML-KEM), to make Tailscale post-quantum secure out of the box in the future. | Milestone: Planned: automatic PSK provisioning/distribution (using ML-KEM-secured distribution) to deliver out-of-the-box post-quantum security; no committed date
- **PQC Algorithms Announced**: ML-KEM; Kyber
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Tailscale; WireGuard
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: No
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Eventually, we intend to build automatic PSK provisioning and distribution to devices."; "This should allow us to make Tailscale post-quantum secure out of the box in the future."; "The distribution step should use some PQC mechanism, like a TLS connection using ML-KEM."
- **Coverage Verification**: CONSISTENT. The document explicitly confirms the strategy of using PSKs for WireGuard security and planning automatic PSK distribution via PQC (ML-KEM) to achieve out-of-the-box post-quantum security, with no specific date committed.
- **Extraction Quality**: HIGH
- **Source Document**: VND-327_Tailscale_Inc..html (200.6 KB)
- **Extraction Timestamp**: 2026-06-06T14:54:21

## VND-273 — Telefonica S.A.

- **Vendor ID**: VND-273
- **Vendor Name**: Telefonica S.A.
- **Roadmap Title**: Quantum-Safe Networks - Telefonica
- **Roadmap URL**: https://www.telefonica.com/en/sustainability-innovation/innovation/quantum-safe-networks/
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-273_Telefonica_S.A..html
- **CSV Coverage Notes**: Official Telefonica innovation page outlining its quantum-safe strategy across three pillars: networks (extra quantum-safe layer combining traditional + post-quantum cryptography), customer solutions (protecting against store-now-decrypt-later), and technology (NIST-standardised post-quantum algorithms with crypto-agility). Backed by a dedicated quantum Centre of Excellence and QKD deployment in EuroQCI. Telefonica also published a formal contribution to the EU PQC Roadmap (2025-09-29 PDF). | Milestone: Live quantum-safe deployments: subsea infrastructure protection, IoT/eSIM quantum-safe cert
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Quantum-Safe Networks; Kite platform
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: Yes, combining traditional and post-quantum cryptography
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "adding an extra layer of security with quantum-safe technology andcombining traditional and post-quantum cryptography"; "encrypting critical information by means of post-quantum algorithms standardised by the NIST"; "Our methodology incorporates crypto-agility to ensure adaptation to any evolution of the standards"
- **Coverage Verification**: PARTIAL, the document confirms the three pillars and subsea/IoT/eSIM deployments but does not mention the Centre of Excellence, QKD, EuroQCI, or the EU PQC Roadmap contribution.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-273_Telefonica_S.A..html (160.8 KB)
- **Extraction Timestamp**: 2026-06-06T14:54:39

## VND-352 — TOPPAN Digital Inc.

- **Vendor ID**: VND-352
- **Vendor Name**: TOPPAN Digital Inc.
- **Roadmap Title**: TOPPAN Digital, NICT, and ISARA Develop Smart Card System Employing Hybrid Methodology to Support Post-Quantum Cryptography and Current Public-key Cryptography
- **Roadmap URL**: https://www.holdings.toppan.com/en/news/2024/10/newsrelease241007_1.html
- **Publish Date**: 2024-10-07
- **Local File**: public/vendor-roadmaps/VND-352_TOPPAN_Digital_Inc..html
- **CSV Coverage Notes**: TOPPAN Digital (subsidiary of TOPPAN Holdings) lays out a phased PQC migration roadmap for its smart-card/secure-element products. SecureBridge uses a hybrid methodology supporting both ML-DSA (NIST PQC signature, Aug 2024) and ECDSA, enabling phased migration and continued use of existing crypto-assets. Roadmap: limited practical implementations in 2025 in high-security sectors (healthcare, finance), targeting full-scale deployment of SecureBridge in 2030. Related products (Edge Safe, Secure Activate Service, PQC CARD) extend PQC across IoT and card systems. Timeline corroborated by The Quant
- **PQC Algorithms Announced**: ML-DSA; CRYSTALS-Dilithium
- **Target Migration Dates**: limited practical implementations in 2025; full-scale deployment of SecureBridge in 2030
- **Products / Services Covered**: SecureBridge; PQC CARD
- **Compliance Frameworks**: NIST; Federal Information Processing Standard (FIPS)
- **Hybrid Mode Support**: Yes; SecureBridge employs a hybrid methodology supporting both PQC (ML-DSA) and current public-key cryptography (ECDSA) via hybrid certificates.
- **Current GA Status**: Pilot Testing
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Targeting full-scale deployment of SecureBridge in 2030"; "planning limited practical implementations in 2025 in fields requiring high levels of security"; "develop SecureBridge as a smart card system that employs a hybrid methodology"
- **Coverage Verification**: PARTIAL; The document confirms the SecureBridge roadmap, ML-DSA/ECDSA hybrid support, and 2025/2030 timelines, but does not mention Edge Safe or Secure Activate Service.
- **Extraction Quality**: HIGH
- **Source Document**: VND-352_TOPPAN_Digital_Inc..html (63.7 KB)
- **Extraction Timestamp**: 2026-06-06T14:54:55

## VND-355 — Trezor Company s.r.o.

- **Vendor ID**: VND-355
- **Vendor Name**: Trezor Company s.r.o.
- **Roadmap Title**: What quantum-ready crypto security means and why it matters
- **Roadmap URL**: https://trezor.io/blog/security/what-quantum-ready-crypto-security-means-and-why-it-matters
- **Publish Date**: 2026-03-16
- **Local File**: public/vendor-roadmaps/VND-355_Trezor_Company_s.r.o..html
- **CSV Coverage Notes**: SatoshiLabs/Trezor blog framing quantum readiness as a two-layer problem (blockchains and the wallets securing keys), focused on device-level security it controls. Trezor Safe 7 ships with NIST-standardized PQC built into manufacturing: SLH-DSA-128 (hybrid with EdDSA/Ed25519) for boot/firmware-signature verification and ML-DSA-44 for device attestation. Positions itself as 'prepared by principle' for threats over the next decade, aligned to NIST's 2035 transition target. | Milestone: Trezor Safe 7 shipping with PQC-protected boot (SLH-DSA-128) and device attestation (ML-DSA-44); plans to exten
- **PQC Algorithms Announced**: SLH-DSA-128; ML-DSA-44
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Trezor Safe 7
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: No
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "The Trezor Safe 7 is ready to secure these operations with post-quantum algorithms."; "It is currently the only hardware wallet designed to do so."; "secure by design, prepared by principle"
- **Coverage Verification**: PARTIAL — The document confirms the two-layer framing, device-level focus, and specific algorithms (SLH-DSA-128, ML-DSA-44) for Trezor Safe 7, but does not mention "hybrid with EdDSA/Ed25519" or "NIST's 2035 transition target".
- **Extraction Quality**: HIGH
- **Source Document**: VND-355_Trezor_Company_s.r.o..html (538.3 KB)
- **Extraction Timestamp**: 2026-06-06T14:55:17

## VND-187 — Tuta GmbH

- **Vendor ID**: VND-187
- **Vendor Name**: Tuta GmbH
- **Roadmap Title**: Tuta Launches Post Quantum Cryptography For Email (TutaCrypt)
- **Roadmap URL**: https://tuta.com/blog/post-quantum-cryptography
- **Publish Date**: 2024-03-11
- **Local File**: public/vendor-roadmaps/VND-187_Tuta_GmbH.html
- **CSV Coverage Notes**: Tuta details its hybrid PQC protocol TutaCrypt (CRYSTALS-Kyber-1024 KEM + X25519 ECDH, AES-256/HMAC-SHA-256, Argon2/HKDF), enabled by default for all new accounts. Roadmap includes gradual migration of existing users via key-rotation mechanism, formal protocol verification with University of Wuppertal, full PQMail protocol for Perfect Forward Secrecy, and the PQDrive project (German-government-funded) building post-quantum-secure cloud storage (Tuta Drive). | Milestone: Quantum-safe encryption enabled by default in Tuta Mail and Calendar; rolling out to existing single-user accounts; key verif
- **PQC Algorithms Announced**: CRYSTALS-Kyber; Kyber-1024; ML-KEM
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Tuta Mail; Tuta Calendar; Tuta Drive
- **Compliance Frameworks**: NIST; BSI
- **Hybrid Mode Support**: Yes; TutaCrypt combines CRYSTALS-Kyber (PQC) with X25519 ECDH (classical) in a hybrid protocol.
- **Current GA Status**: GA
- **Customer Action Required**: New users must update to the latest version of the Tuta apps; existing users will be rolled out to gradually via key rotation.
- **Key Commitments & Quotes**: "enabling quantum-safe encryption by default for all new Tuta Mail accounts"; "roll out post-quantum secure encryption to all ten million existing users"; "aim to implement the full PQMail protocol to achieve Perfect Forward Secrecy"
- **Coverage Verification**: CONSISTENT; The document explicitly confirms the TutaCrypt hybrid protocol details, default enablement for new accounts, gradual rollout to existing users, PQDrive project with University of Wuppertal, and plans for PQMail.
- **Extraction Quality**: HIGH
- **Source Document**: VND-187_Tuta_GmbH.html (148.7 KB)
- **Extraction Timestamp**: 2026-06-06T14:55:35

## VND-409 — Veeam

- **Vendor ID**: VND-409
- **Vendor Name**: Veeam
- **Roadmap Title**: Veeam on Quantum Readiness: Preparing for PQC
- **Roadmap URL**: https://www.veeam.com/blog/quantum-readiness-pqc.html
- **Publish Date**: 2026-04-24
- **Local File**: public/vendor-roadmaps/VND-409_Veeam.html
- **CSV Coverage Notes**: Veeam outlines a three-principle PQC adoption strategy: align to NIST standards/authoritative guidance (FIPS 203/204/205), coordinate with upstream cryptographic providers (OpenSSL) and platform vendors, and design for crypto agility with staged adoption. Expects 2027-2030 ecosystem readiness window; will integrate PQC when underlying libraries are enterprise-ready, validated, and supportable. Maintains FIPS 140-3 (cert #5156); partnered with Entrust for PQC-backed cyber recovery. | Milestone: Veeam Data Platform v13.1 introduces post-quantum cryptography to safeguard backups; broader rollout
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA
- **Target Migration Dates**: 2027 to 2030 window
- **Products / Services Covered**: None detected
- **Compliance Frameworks**: FIPS 203; FIPS 204; FIPS 205; FIPS 140-3; CNSA 2.0
- **Hybrid Mode Support**: Yes, mentions monitoring "hybrid modes" and that "Hybrid negotiation and downgrade resistance will be key to maintaining compatibility during the transition"
- **Current GA Status**: Planned
- **Customer Action Required**: Inventory cryptography dependencies; Design for crypto-agility; Assess “harvest-now, decrypt-later” exposure; Align to standards and timelines; Pilot safely
- **Key Commitments & Quotes**: "We’re aligning our own roadmap with these standards and the broader security community."; "Our goal is to integrate PQC when the underlying libraries are enterprise-ready, validated, and operationally supportable in customer environments."; "Veeam’s adoption strategy for PQC emphasizes three principles."
- **Coverage Verification**: PARTIAL, the document confirms the three principles, NIST standards, OpenSSL coordination, 2027-2030 window, and FIPS 140-3 cert #5156, but does not mention the Entrust partnership or the Veeam Data Platform v13.1 milestone.
- **Extraction Quality**: HIGH
- **Source Document**: VND-409_Veeam.html (249.1 KB)
- **Extraction Timestamp**: 2026-06-06T14:55:59

## VND-329 — Versa Networks, Inc.

- **Vendor ID**: VND-329
- **Vendor Name**: Versa Networks, Inc.
- **Roadmap Title**: Post-Quantum Cryptography (PQC) and Versa: Future-Proofing Enterprise Security Against Quantum Threats
- **Roadmap URL**: https://versa-networks.com/blog/post-quantum-cryptography-pqc-and-versa-future-proofing-enterprise-security-against-quantum-threats/
- **Publish Date**: 2025-03-12
- **Local File**: public/vendor-roadmaps/VND-329_Versa_Networks_Inc..html
- **CSV Coverage Notes**: Official Versa Networks blog describing the company's quantum-safe strategy for its Universal SASE platform: phased, hybrid PQC approach maintaining backward compatibility, with X25519Kyber768 hybrid key exchange integrated and three negotiation fallback scenarios. Aligned to FIPS 140-3 / NIAP. Strategic in scope but lacks explicit dated milestones, so it reads as a strategy blog rather than a dated roadmap. | Milestone: Integration of X25519Kyber768 hybrid PQC key exchange into the Versa SASE platform with dynamic hybrid PQC negotiation/fallback (as of March 2025).
- **PQC Algorithms Announced**: Kyber
- **Target Migration Dates**: None detected
- **Products / Services Covered**: VersaONE Platform; Versa SASE platform; VOS
- **Compliance Frameworks**: FIPS 140-3; NIAP
- **Hybrid Mode Support**: Yes; integration of X25519Kyber768 hybrid key exchange to maintain backward compatibility
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Versa has taken a proactive approach to PQC by integrating X25519Kyber768 into its security solutions"; "The hybrid PQC negotiation model ensures compatibility with existing cryptographic systems"; "Maintains FIPS 140-3 and NIAP validation for government and enterprise security requirements"
- **Coverage Verification**: CONSISTENT; The document confirms the integration of X25519Kyber768, the three negotiation scenarios, and alignment with FIPS 140-3/NIAP as described in the notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-329_Versa_Networks_Inc..html (162.3 KB)
- **Extraction Timestamp**: 2026-06-06T14:56:25
