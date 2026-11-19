---
generated: 2026-09-07
collection: vendor-roadmaps
enrichment_method: ollama-qwen3.6:27b-q8_0
source: public/vendor-roadmaps/
---

# Vendor PQC Roadmap Enrichments


## VND-001 — Amazon Web Services Inc.

- **Vendor ID**: VND-001
- **Vendor Name**: Amazon Web Services Inc.
- **Roadmap Title**: AWS post-quantum cryptography migration plan
- **Roadmap URL**: https://aws.amazon.com/blogs/security/aws-post-quantum-cryptography-migration-plan/
- **Publish Date**: Unknown
- **Local File**: vendor-roadmaps/VND-001_Amazon_Web_Services_Inc.html
- **CSV Coverage Notes**: None
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA
- **Target Migration Dates**: None detected
- **Products / Services Covered**: AWS-LC; s2n; AWS Key Management Service (AWS KMS); AWS Secrets Manager; AWS Certificate Manager (ACM); Elastic Load Balancing (ELB); Amazon API Gateway; Amazon CloudFront
- **Compliance Frameworks**: NIST FIPS 203; NIST FIPS 204; NIST FIPS 205; CNSA Suite 2.0; European Commission’s Recommendation on a Coordinated Implementation Roadmap; FIPS-140-3; ETSI TR 103 619
- **Hybrid Mode Support**: Yes, AWS pioneered "hybrid post-quantum key agreement" combining ECDH with ML-KEM.
- **Current GA Status**: Planned
- **Customer Action Required**: Ensure agility in distributing updated software versions; adopt TLS 1.3 across the organization.
- **Key Commitments & Quotes**: "AWS is migrating to post-quantum cryptography (PQC)."; "AWS will adopt ML-DSA... enabling customers to generate and use PQC keys as roots of trust"; "we will begin deployment of this s2n version across all AWS public endpoints that offer HTTPS-based interfaces"
- **Coverage Verification**: CONSISTENT. The document outlines a general migration plan and workstreams but does not specify the granular product versioning or specific implementation details implied by "Not specified" in the CSV notes, making the lack of specific coverage details consistent.
- **Extraction Quality**: HIGH
- **Source Document**: VND-001_Amazon_Web_Services_Inc.html (1253.9 KB)
- **Extraction Timestamp**: 2026-09-07T10:59:40

## VND-002 — Apple Inc.

- **Vendor ID**: VND-002
- **Vendor Name**: Apple Inc.
- **Roadmap Title**: Quantum-secure cryptography in Apple operating systems
- **Roadmap URL**: https://support.apple.com/guide/security/quantum-secure-cryptography-apple-devices-secc7c82e533/web
- **Publish Date**: 2026-01-28
- **Local File**: public/vendor-roadmaps/VND-002_Apple_Inc..html
- **CSV Coverage Notes**: (2026-07-01: page content has materially expanded since original 2024-02-21 capture -- re-archived.)
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: ML-KEM; ML-DSA
- **Target Migration Dates**: None detected
- **Products / Services Covered**: iMessage; TLS; HTTPS; VPN; SSH; Apple Watch; CryptoKit
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: Yes; Apple is adopting hybrid cryptography
- **Current GA Status**: GA
- **Customer Action Required**: Developers must use algorithms in well-analyzed protocols
- **Key Commitments & Quotes**: "Apple is adopting hybrid cryptography"; "Apple has deployed quantum-secure cryptography across a wide range of protocols"; "support was added in the Apple CryptoKit framework"
- **Coverage Verification**: CONSISTENT; The document details specific PQC implementations in iOS 17.4 and iOS 26, confirming material expansion from earlier captures.
- **Extraction Quality**: HIGH
- **Source Document**: VND-002_Apple_Inc..html (710.1 KB)
- **Extraction Timestamp**: 2026-07-07T20:20:19

## VND-005 — BlackBerry Limited

- **Vendor ID**: VND-005
- **Vendor Name**: BlackBerry Limited
- **Roadmap Title**: BlackBerry & NXP: Preparing Against Y2Q Post-Quantum Cyber Attacks (Certicom + QNX)
- **Roadmap URL**: https://www.prnewswire.com/news-releases/blackberry-and-nxp-join-forces-to-help-companies-prepare-for-and-prevent-y2q-post-quantum-cyber-attacks-301554427.html
- **Publish Date**: 2022-05-25
- **Local File**: public/vendor-roadmaps/VND-005_BlackBerry_Limited.html
- **CSV Coverage Notes**: BlackBerry has no single consolidated PQC roadmap page; its PQC work runs through the Certicom division and QNX. Official BlackBerry/NXP press release describes Certicom Code Signing & Key Management Server using CRYSTALS-Dilithium (ML-DSA) for quantum-resistant code/firmware/OTA signing and SBOMs on NXP S32G; QNX secure boot uses quantum-safe signatures. BlackBerry/Certicom states it is deploying finalized NIST standards (ML-KEM, ML-DSA, SLH-DSA, HQC). | Milestone: BlackBerry Certicom Code Signing and Key Management Server uses CRYSTALS-Dilithium (ML-DSA) for quantum-resistant secure boot, fi
- **Roadmap Scope**: Single product
- **PQC Algorithms Announced**: CRYSTALS Dilithium
- **Target Migration Dates**: None detected
- **Products / Services Covered**: BlackBerry Certicom Code Signing and Key Management Server
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: No
- **Current GA Status**: Planned
- **Customer Action Required**: Register to attend the webinar
- **Key Commitments & Quotes**: "BlackBerry Limited ... announced it will provide support for quantum-resistant secure boot signatures for NXP® Semiconductors' ... S32G vehicle networking processors"
- **Coverage Verification**: PARTIAL; The document confirms the Certicom/NXP S32G integration and Dilithium usage but does not mention QNX, ML-KEM, SLH-DSA, or HQC.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-005_BlackBerry_Limited.html (205.0 KB)
- **Extraction Timestamp**: 2026-07-07T20:20:19

## VND-006 — Canonical Ltd.

- **Vendor ID**: VND-006
- **Vendor Name**: Canonical Ltd.
- **Roadmap Title**: Post Quantum Support in the upcoming 26.04 LTS
- **Roadmap URL**: https://discourse.ubuntu.com/t/post-quantum-support-in-the-upcoming-26-04-lts/76840
- **Publish Date**: 2026-02-12
- **Local File**: public/vendor-roadmaps/VND-006_Canonical_Ltd..html
- **CSV Coverage Notes**: Official Canonical plan (Ubuntu Community Hub / Foundations team, author Ravi Sharma) detailing Ubuntu's PQC roadmap with a clear release timeline: 25.10 already ships PQC in OpenSSL 3.5, OpenSSH 10.0+, libgcrypt, wolfssl, rustls; 26.04 LTS makes hybrid key exchange (e.g. X25519MLKEM768) the default for TLS/SSH automatically; 28.04 LTS targets Hybrid Secure Boot with classical + post-quantum signatures. Implements NIST 2024 standards ML-KEM, ML-DSA, SLH-DSA in hybrid mode for interoperability. Corroborated by ubuntu.com/blog PQC posts (25.10 security, building quantum-safe telecom). | Mileston
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA; CRYSTALS-Kyber; CRYSTALS-Dilithium; SPHINCS+; Falcon; HQC
- **Target Migration Dates**: 26.04 LTS makes hybrid key exchange default; 28.04 LTS targets Hybrid Secure Boot
- **Products / Services Covered**: Ubuntu 25.10; Ubuntu 26.04 LTS; Ubuntu 28.04 LTS; OpenSSL; OpenSSH; libgcrypt; wolfssl; rustls; Nginx
- **Compliance Frameworks**: NIST FIPS 203; NIST FIPS 204; NIST FIPS 205; FIPS-206
- **Hybrid Mode Support**: Yes; hybrid key exchange is the default for TLS/SSH
- **Current GA Status**: GA
- **Customer Action Required**: Experiment with algorithms, report bugs, and share feedback
- **Key Commitments & Quotes**: "Ubuntu has chosen to retain hybrid key exchange as the default"; "26.04 LTS makes hybrid key exchange... the default for TLS/SSH automatically"; "Hybrid Secure Boot... could realistically appear around the 28.04 LTS timeframe"
- **Coverage Verification**: CONSISTENT; The document confirms the author, timeline, algorithms, and hybrid defaults described in the notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-006_Canonical_Ltd..html (37.4 KB)
- **Extraction Timestamp**: 2026-07-07T20:32:32

## VND-007 — Check Point Software Technologies Ltd.

- **Vendor ID**: VND-007
- **Vendor Name**: Check Point Software Technologies Ltd.
- **Roadmap Title**: Quantum-Safe Cybersecurity with Check Point: Current Capabilities and the Road Ahead
- **Roadmap URL**: https://blog.checkpoint.com/innovation/quantum-safe-cyber-security-current-capabilities-and-the-road-ahead/
- **Publish Date**: 2025-09-25
- **Local File**: public/vendor-roadmaps/VND-007_Check_Point_Software_Technologies_Ltd..html
- **CSV Coverage Notes**: Official Check Point blog laying out a phased PQC roadmap to integrate NIST standards. Current (R82): hybrid IKEv2 site-to-site VPN combining classical DH with ML-KEM; quantum-safe TLS/HTTPS inspection (R82.10). Roadmap items: extend quantum-safe key exchange to remote access VPN clients (Windows/macOS/Linux), RFC 8784 PQ pre-shared keys, ML-DSA/SLH-DSA signatures as PKI matures, LMS/XMSS for software/firmware signing, and QKD integration for high-assurance environments. SIC framework designed to shift to ML-DSA when FIPS libraries are available. | Milestone: R82.10 General Availability (with
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA; LMS; XMSS
- **Target Migration Dates**: R82.10 General Availability expected in November 2025
- **Products / Services Covered**: R82 (Site-to-Site VPNs); R82.10 (Quantum-Safe TLS/HTTPS Inspection); Remote Access VPN clients (Windows/macOS/Linux)
- **Compliance Frameworks**: NIST FIPS 203; NIST FIPS 204; NIST FIPS 205; RFC 9370; RFC 9242; RFC 8784
- **Hybrid Mode Support**: Yes; hybrid IKEv2 key exchange combining classical Diffie-Hellman with ML-KEM
- **Current GA Status**: GA
- **Customer Action Required**: Upgrade to R82 to allow Post-Quantum Hybrid Key Exchange on critical VPNs; join Early Availability program for R82.10
- **Key Commitments & Quotes**: "Check Point’s strategy is to integrate these standards into our security architecture in a phased, operationally practical way."
- **Coverage Verification**: PARTIAL; The document confirms the R82/R82.10 milestones and algorithm roadmap but does not mention the "SIC framework" or its shift to ML-DSA.
- **Extraction Quality**: HIGH
- **Source Document**: VND-007_Check_Point_Software_Technologies_Ltd..html (113.4 KB)
- **Extraction Timestamp**: 2026-07-07T20:31:25

## VND-008 — Cisco Systems Inc.

- **Vendor ID**: VND-008
- **Vendor Name**: Cisco Systems Inc.
- **Roadmap Title**: Cisco Secure Firewall: Post-Quantum Cryptography Roadmap
- **Roadmap URL**: https://blogs.cisco.com/security/preparing-for-post-quantum-cryptography-the-secure-firewall-roadmap
- **Publish Date**: 2026-04-13
- **Local File**: public/vendor-roadmaps/VND-008_Cisco_Systems_Inc..html
- **CSV Coverage Notes**: Cisco Secure Firewall PQC roadmap: ML-KEM arrives in FTD 10.5 / ASA 9.25 (GA late 2026) for IPsec VPN and SKIP key management; ML-DSA and SLH-DSA planned for FTD/ASA 11.0 in H2 2027 with broader TLS decryption, Remote Access VPN and management access. Driven by NSA NSS Jan 2027 purchase requirements and CNSA 2.0 deadlines through 2035. Broader Cisco PQC spans IOS XE/XR, Meraki, Webex, AnyConnect. | Milestone: ML-KEM in Secure Firewall Threat Defense (FTD) 10.5 and ASA 9.25 targeted GA late 2026 (IPsec VPN + SKIP key management); ML-DSA/SLH-DSA planned for FTD/ASA 11.0 in H2 CY2027 with broader
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA
- **Target Migration Dates**: ML-KEM GA late 2026; ML-DSA/SLH-DSA H2 2027
- **Products / Services Covered**: Secure Firewall Threat Defense (FTD); ASA; Secure Firewall 1200; Secure Firewall 6100
- **Compliance Frameworks**: NIST FIPS 203; NIST FIPS 204; NIST FIPS 205; NSA National Security Systems; CNSA 2.0
- **Hybrid Mode Support**: Yes; hybrid key exchange via RFC 9242 and RFC 9370
- **Current GA Status**: Planned
- **Customer Action Required**: Know where encryption lives; build upgrade paths into planning cycles; think about hardware now
- **Key Commitments & Quotes**: "Support arrives in Secure Firewall Threat Defense (FTD) 10.5 and ASA 9.25 , targeted for General Availability in late 2026."
- **Coverage Verification**: PARTIAL; Document confirms firewall milestones but does not mention broader Cisco PQC spans (IOS XE/XR, Meraki, Webex, AnyConnect) or CNSA 2.0 deadlines through 2035.
- **Extraction Quality**: HIGH
- **Source Document**: VND-008_Cisco_Systems_Inc..html (82.4 KB)
- **Extraction Timestamp**: 2026-07-07T20:20:19

## VND-009 — Citrix Systems Inc.

- **Vendor ID**: VND-009
- **Vendor Name**: Citrix Systems Inc.
- **Roadmap Title**: Leading the quantum-ready transition: How NetScaler helps prevent a silent data breach decades in the making
- **Roadmap URL**: https://www.citrix.com/blogs/2025/07/30/leading-the-quantum-ready-transition/
- **Publish Date**: 2025-07-30
- **Local File**: public/vendor-roadmaps/VND-009_Citrix_Systems_Inc..html
- **CSV Coverage Notes**: Official Citrix blog laying out NetScaler's PQC transition plan: hybrid NIST-aligned PQC (X25519 + ML-KEM768), private tech preview April 2025, general availability August 2025 (v14.1.51), plus a recommended customer migration timeline (Q2 2025 test in non-prod, Q3 2025 map critical systems, Q4 2025 phased rollout) and industry deadlines (2030 phase-out of deprecated crypto, 2035 fully disallowed). | Milestone: NetScaler hybrid PQC (X25519 + ML-KEM768) generally available since August 2025 via v14.1.51; recommended customer phased rollout through Q4 2025.
- **Roadmap Scope**: Single product
- **PQC Algorithms Announced**: ML-KEM
- **Target Migration Dates**: Q2 2025 test in non-prod; Q3 2025 map critical systems; Q4 2025 phased rollout; 2030 phase-out of deprecated crypto; 2035 fully disallowed
- **Products / Services Covered**: NetScaler
- **Compliance Frameworks**: NIST; FIPS 140-3 Level 2; FIPS 140-2 Level 1
- **Hybrid Mode Support**: Yes; NIST-aligned hybrid post-quantum cryptography (X25519 + ML-KEM768)
- **Current GA Status**: GA
- **Customer Action Required**: Begin internal validation in non-production environments; identify and map critical systems; begin phased rollout
- **Key Commitments & Quotes**: "NetScaler became the first application delivery platform to offer NIST-aligned hybrid post-quantum cryptography (X25519 + ML-KEM768) through a Private Tech Preview"
- **Coverage Verification**: CONSISTENT; The document confirms the hybrid algorithm, preview/GA dates, and customer timeline, though it does not explicitly state version number v14.1.51.
- **Extraction Quality**: HIGH
- **Source Document**: VND-009_Citrix_Systems_Inc..html (242.7 KB)
- **Extraction Timestamp**: 2026-07-07T20:30:24

## VND-010 — Crypto4A Technologies Inc.

- **Vendor ID**: VND-010
- **Vendor Name**: Crypto4A Technologies Inc.
- **Roadmap Title**: Crypto4A News: QxHSM/QxOS 5 Post-Quantum HSM Platform Updates
- **Roadmap URL**: https://crypto4a.com/news/
- **Publish Date**: 2026-07-12
- **Local File**: vendor-roadmaps/VND-010_Crypto4A_Technologies_Inc.html
- **CSV Coverage Notes**: None
- **Extraction Error**: Bot-protection/error page detected: "404"
- **Extraction Timestamp**: 2026-07-12T21:04:44

## VND-011 — CryptoNext Security

- **Vendor ID**: VND-011
- **Vendor Name**: CryptoNext Security
- **Roadmap Title**: Switch to post-quantum crypto-agility with CryptoNext (4-phase PQC migration strategy)
- **Roadmap URL**: https://www.cryptonext-security.com/en/
- **Publish Date**: 2025-06
- **Local File**: public/vendor-roadmaps/VND-011_CryptoNext_Security.html
- **CSV Coverage Notes**: CryptoNext publishes a structured PQC migration strategy/methodology on its official site organized in four phases: (1) PQC Evaluation/Test & Learn via prototypes, (2) Cryptographic Discovery & Inventory (CryptoNext COMPASS Discovery, launched June 2025), (3) PQC Remediation by integrating standards-based PQC into hardware/software, and (4) Crypto-Agility management for evolving standards. Supported by a blog series on discovery, testing before migration, and crypto-agility; CryptoNext is also engaged in NIST's PQC collaboration project. | Milestone: Crypto-agility/COMPASS Discovery driven mig
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: CryptoNext Toolbox; CryptoNext COMPASS Discovery; CryptoNext Remediation SDK; CryptoNext Captain
- **Compliance Frameworks**: NIST; DORA; NIS2
- **Hybrid Mode Support**: No
- **Current GA Status**: GA
- **Customer Action Required**: Request a Demo; Get a structured roadmap; Map every cryptographic asset; Test the impacts of PQC
- **Key Commitments & Quotes**: "Deploy NIST-validated post-quantum algorithms without accumulating cryptographic debt"; "We are at the forefront of the NIST standardization efforts"; "CryptoNext Security is recognized as a leading player in PQC"
- **Coverage Verification**: CONSISTENT; The document explicitly details the four-phase strategy (Evaluation, Inventory/COMPASS, Remediation, Management) and mentions NIST engagement, aligning with the CSV notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-011_CryptoNext_Security.html (147.1 KB)
- **Extraction Timestamp**: 2026-07-07T20:33:35

## VND-012 — DigiCert Inc.

- **Vendor ID**: VND-012
- **Vendor Name**: DigiCert Inc.
- **Roadmap Title**: DigiCert Post-Quantum Cryptography — Trust Lifecycle Manager
- **Roadmap URL**: https://www.digicert.com/post-quantum-cryptography
- **Publish Date**: 2025-01-01
- **Local File**: public/vendor-roadmaps/VND-012_DigiCert_Inc..html
- **CSV Coverage Notes**: DigiCert PQC product page centered on Trust Lifecycle Manager (DigiCert ONE) and crypto-agility: discover, inventory and manage certificates at scale to prepare for ML-KEM/ML-DSA migration. Supporting resources include PQC test servers/playgrounds (DigiCert Labs), a 'PQC for Dummies' ebook and readiness webinars. Page is undated and gives no explicit per-algorithm GA timeline. | Milestone: DigiCert positions Trust Lifecycle Manager (DigiCert ONE) for crypto-agility — continuous certificate discovery/inventory and at-scale management to enable transition to NIST ML-KEM/ML-DSA; provides PQC test
- **Extraction Error**: Extracted text too short (82 chars)
- **Extraction Timestamp**: 2026-07-07T20:21:10

## VND-013 — Entrust Corporation

- **Vendor ID**: VND-013
- **Vendor Name**: Entrust Corporation
- **Roadmap Title**: Entrust Post-Quantum Cryptography Solutions
- **Roadmap URL**: https://www.entrust.com/solutions/post-quantum-cryptography
- **Publish Date**: 2024-01-01
- **Local File**: public/vendor-roadmaps/VND-013_Entrust_Corporation.html
- **CSV Coverage Notes**: Entrust PQC solutions page covering nShield HSMs, KeyControl, PKI and Certificate Services, and identity solutions for the quantum-safe transition (NIST ML-KEM/ML-DSA). Content could not be re-read this pass due to a server block. | Milestone: Entrust quantum-safe portfolio across nShield HSMs, KeyControl, PKI/Certificate Services and identity solutions supporting NIST ML-KEM/ML-DSA; specific dated milestones not confirmable this pass.
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: ML-KEM; ML-DSA
- **Target Migration Dates**: None detected
- **Products / Services Covered**: nShield HSMs; Public Key Infrastructure (PKI); Cryptographic Security Platform
- **Compliance Frameworks**: NIST; IETF
- **Hybrid Mode Support**: Yes; supports hybrid approach combining today’s algorithms with PQC
- **Current GA Status**: Planned
- **Customer Action Required**: Take self-assessment; fill out form to connect with expert
- **Key Commitments & Quotes**: "Entrust helps organizations protect long-lived information, maintain compliance, and prepare for the quantum era with crypto-agile solutions"; "Entrust solutions support a hybrid approach, combining today’s algorithms with PQC"; "Entrust has proposed and published the only draft for a composite certificate... with the IETF"
- **Coverage Verification**: PARTIAL; Document confirms nShield HSMs, PKI, and Cryptographic Security Platform, but does not explicitly mention KeyControl or identity solutions in the PQC context.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-013_Entrust_Corporation.html (195.4 KB)
- **Extraction Timestamp**: 2026-07-07T20:21:10

## VND-014 — F5 Networks Inc.

- **Vendor ID**: VND-014
- **Vendor Name**: F5 Networks Inc.
- **Roadmap Title**: F5 BIG-IP v21.1 GA: Post-Quantum Cryptography & AI Security Enhancements
- **Roadmap URL**: https://www.f5.com/company/blog/f5-big-ip-v21-1-is-now-generally-available-bringing-pqc-and-ai-security-enhancements
- **Publish Date**: 2026-05-06
- **Local File**: public/vendor-roadmaps/VND-014_F5_Networks_Inc..html
- **CSV Coverage Notes**: F5 PQC readiness: BIG-IP began hybrid X25519+ML-KEM-768 TLS 1.3 in v17.5.0/17.5.1; v21.1 (GA 2026-05-06) adds FIPS 203 ML-KEM hybrid cipher groups SecP256r1ML-KEM-768 and SecP384r1ML-KEM-1024 for client/server TLS and quantum-resistant TLS/SSL VPN tunneling. NGINX Plus enables PQC for APIs/microservices; SSL Orchestrator centralizes quantum-safe management; F5 Distributed Cloud included. | Milestone: BIG-IP v21.1 (GA May 2026) adds NIST FIPS 203 ML-KEM hybrid cipher groups SecP256r1ML-KEM-768 and SecP384r1ML-KEM-1024 for client- and server-side TLS, plus quantum-resistant TLS/SSL VPN tunneling
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: ML-KEM
- **Target Migration Dates**: None detected
- **Products / Services Covered**: F5 BIG-IP LTM; NGINX Plus; F5 BIG-IP SSL Orchestrator; F5 BIG-IP Zero Trust Access (ZTA)
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: Yes; hybrid implementation strategy combining classical encryption with post-quantum algorithms
- **Current GA Status**: GA
- **Customer Action Required**: Act now to deploy quantum-resistant encryption and protect sensitive data
- **Key Commitments & Quotes**: "F5 ADSP delivers end-to-end post-quantum cryptography (PQC) with National Institute of Standards and Technologies (NIST)-approved algorithms"
- **Coverage Verification**: PARTIAL; The document confirms the products and general NIST compliance but does not contain the specific version numbers (v17.5.0, v21.1), dates (2026-05-06), or specific cipher group names (SecP256r1ML-KEM-768) listed in the CSV notes.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-014_F5_Networks_Inc..html (1133.3 KB)
- **Extraction Timestamp**: 2026-07-07T20:21:10

## VND-015 — Fortanix Inc.

- **Vendor ID**: VND-015
- **Vendor Name**: Fortanix Inc.
- **Roadmap Title**: Post Quantum Cryptography Solutions
- **Roadmap URL**: https://www.fortanix.com/solutions/use-case/post-quantum-cryptography
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-015_Fortanix_Inc..html
- **CSV Coverage Notes**: Fortanix publishes a four-step PQC transition framework: (1) Discover - inventory cryptographic posture/keys across environments; (2) PQC Assessment - prioritize quantum-vulnerable, high-risk assets via dashboards/heat maps (PQC Central); (3) PQC Transition - migrate to NIST/CNSA 2.0-aligned algorithms (ML-KEM/ML-DSA) with centralized key management and testing; (4) Crypto-agility - continuously adopt future algorithms without hardware changes. Framed as a long strategic journey to start now rather than a one-time algorithm swap. Algorithms implemented in Fortanix DSM. | Milestone: PQC Central
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; LMS; XMSS
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Fortanix Platform; PQC Central; Data Security Manager™
- **Compliance Frameworks**: CNSA 2.0; FIPS PUB 203; FIPS PUB 204; NIST SP 800-208; FIPS 140-2
- **Hybrid Mode Support**: No
- **Current GA Status**: GA
- **Customer Action Required**: Start the journey to PQC transition today; assess current cryptography; update systems; prepare people and processes
- **Key Commitments & Quotes**: "Post-Quantum Cryptography transition is not an algorithm switch. It is a long and strategic journey that needs to start today."; "Fortanix supports the full suite of algorithms in the Commercial National Security Algorithm Suite (CNSA) 2.0."; "Our platform is built for agility and will swiftly implement updates and new standards when they arise."
- **Coverage Verification**: CONSISTENT; The document explicitly details the four-step framework (Discover, PQC Assessment, PQC Transition, Crypto-agility), mentions PQC Central, CNSA 2.0 alignment, and the strategic nature of the journey.
- **Extraction Quality**: HIGH
- **Source Document**: VND-015_Fortanix_Inc..html (252.8 KB)
- **Extraction Timestamp**: 2026-07-07T20:31:25

## VND-016 — Fortinet Inc.

- **Vendor ID**: VND-016
- **Vendor Name**: Fortinet Inc.
- **Roadmap Title**: Fortinet Quantum Security Solutions
- **Roadmap URL**: https://www.fortinet.com/solutions/quantum-security
- **Publish Date**: 2025-07-22
- **Local File**: public/vendor-roadmaps/VND-016_Fortinet_Inc..html
- **CSV Coverage Notes**: None
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: FortiOS
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: Yes; Hybrid mode allows classical and PQC algorithms to run simultaneously
- **Current GA Status**: GA
- **Customer Action Required**: Migrate to post-quantum security and future-proof your infrastructure
- **Key Commitments & Quotes**: "Quantum-safe features, including post-quantum cryptography (PQC), are natively integrated into the FortiOS operating system."
- **Coverage Verification**: CONSISTENT; The document outlines a portfolio-wide strategy for PQC integration, which aligns with the unspecified coverage notes.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-016_Fortinet_Inc..html (329.4 KB)
- **Extraction Timestamp**: 2026-07-07T20:21:10

## VND-017 — Futurex Inc.

- **Vendor ID**: VND-017
- **Vendor Name**: Futurex Inc.
- **Roadmap Title**: Futurex Post-Quantum Hybrid Certificate Authority Solution
- **Roadmap URL**: https://www.futurex.com/news/futurex-announces-post-quantum-hybrid-certificate-authority-solution
- **Publish Date**: 2020-02-20
- **Local File**: vendor-roadmaps/VND-017_Futurex_Inc..html
- **CSV Coverage Notes**: (2026-07-01: verified publish date is 2020-02-20 (KMES Series 3 announcement), not 2026-06-05 as previously recorded; page shows a 2024-09-20 republish stamp but no new content. No more-current Futurex PQC announcement found.)
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: KMES Series 3
- **Compliance Frameworks**: FIPS 140-2 Level 3; NIST
- **Hybrid Mode Support**: Yes; embeds both conventional and quantum-safe certificates in a single container
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Futurex is the first company to deliver a post-quantum hybrid certificate authority offering that integrates certificate lifecycle management within a FIPS 140-2 Level 3-validated hardware security module (HSM)."
- **Coverage Verification**: CONSISTENT; The document text confirms the February 20, 2020 announcement date for KMES Series 3 and matches the republish context.
- **Extraction Quality**: LOW
- **Source Document**: VND-017_Futurex_Inc..html (596.5 KB)
- **Extraction Timestamp**: 2026-09-02T09:20:29

## VND-018 — Google LLC

- **Vendor ID**: VND-018
- **Vendor Name**: Google LLC
- **Roadmap Title**: Google Cloud Post-Quantum Cryptography
- **Roadmap URL**: https://cloud.google.com/security/resources/post-quantum-cryptography
- **Publish Date**: 2025-10-01
- **Local File**: vendor-roadmaps/VND-018_Google_LLC.html
- **CSV Coverage Notes**: Google Cloud PQC: ML-KEM migrated for internal/network traffic and default Cloud network encryption; Cloud KMS quantum-safe digital signatures (ML-DSA-65, SLH-DSA-SHA2-128S) preview Feb 2025 and KEM support preview Oct 2025, committing to FIPS 203/204/205 in both Cloud KMS (software) and Cloud HSM (hardware). Implementations open-sourced via BoringCrypto/BoringSSL and Tink (HPKE for Java/C++/Go/Python). Chrome and Android PQC support. Infra connection rollout targeted 2026. | Milestone: Quantum-safe KEMs in Cloud KMS in preview (Oct 2025); quantum-safe digital signatures (ML-DSA-65, SLH-DSA-SH
- **PQC Algorithms Announced**: ML-KEM; Kyber
- **Target Migration Dates**: 2029
- **Products / Services Covered**: Google Cloud; Cloud KMS; Chrome; Android; BoringSSL; Tink; OpenSK
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: Yes; "hybrid deployments of PQC and classic cryptography"
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Google has set 2029 as the deadline for Google’s PQC migration to secure the quantum era."
- **Coverage Verification**: PARTIAL; The document confirms the 2029 deadline, ML-KEM/Kyber usage, and hybrid strategy, but does not explicitly state the specific preview dates (Feb/Oct 2025), specific algorithm variants (ML-DSA-65, SLH-DSA-SHA2-128S), or FIPS 203/204/205 commitments found in the CSV notes.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-018_Google_LLC.html (2124.2 KB)
- **Extraction Timestamp**: 2026-09-02T09:20:29

## VND-019 — IBM Corporation

- **Vendor ID**: VND-019
- **Vendor Name**: IBM Corporation
- **Roadmap Title**: IBM Quantum-Safe Roadmap
- **Roadmap URL**: https://research.ibm.com/blog/quantum-safe-roadmap
- **Publish Date**: 2023-05-10
- **Local File**: vendor-roadmaps/VND-019_IBM_Corporation.html
- **CSV Coverage Notes**: IBM Quantum-Safe Roadmap (page dated 2023-05-10, unchanged) outlines crypto-agility via the IBM Quantum Safe portfolio: Explorer (code scanning / cryptographic artifact discovery), Advisor (posture & compliance analysis, CBOM), and Remediator (test/implement hybrid quantum-safe remediation). Phased path: inventory (2023), adopt NIST standards (2024), CNSA 2.0 preference (2025). Also Guardium, z/OS, OpenSSL integrations. | Milestone: IBM Quantum Safe Explorer/Advisor/Remediator for crypto inventory (CBOM), risk analysis, and hybrid quantum-safe remediation; aligned to NIST 2024 standards and 20
- **PQC Algorithms Announced**: CRYSTALS-Kyber; CRYSTALS-Dilithium; Falcon
- **Target Migration Dates**: 2023 (complete cryptography inventory and create CBOM); 2024 (NIST publish post-quantum cryptography standards); 2025 (NSA require preference for quantum-safe algorithms)
- **Products / Services Covered**: IBM Quantum Safe Explorer; IBM Quantum Safe Advisor; IBM Quantum Safe Remediator; IBM z16; IBM Tape
- **Compliance Frameworks**: NIST; FIPS; CNSA 2.0
- **Hybrid Mode Support**: Yes; Remediator supports a hybrid implementation approach using classical and quantum-safe cryptography
- **Current GA Status**: GA
- **Customer Action Required**: Complete cryptography inventory; create CBOM; begin quantum-safe transition
- **Key Commitments & Quotes**: "This roadmap serves as a commitment to transparency, predictability, and confidence as we guide industries along their journey to post-quantum cryptography."
- **Coverage Verification**: PARTIAL; The document confirms the roadmap date, portfolio names, and phased timeline, but does not explicitly mention Guardium, z/OS, or OpenSSL integrations in the provided text.
- **Extraction Quality**: HIGH
- **Source Document**: VND-019_IBM_Corporation.html (84.2 KB)
- **Extraction Timestamp**: 2026-09-02T09:20:29

## VND-020 — IDEMIA Group

- **Vendor ID**: VND-020
- **Vendor Name**: IDEMIA Group
- **Roadmap Title**: IDEMIA Post-Quantum Security Consulting
- **Roadmap URL**: https://www.idemia.com/post-quantum-security-consulting
- **Publish Date**: 2026-07-13
- **Local File**: vendor-roadmaps/VND-020_IDEMIA_Group.html
- **CSV Coverage Notes**: None
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: IDEMIA Sphere CryptoLib; IDEMIA Sphere HSM
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: Yes; "introducing post‑quantum and hybrid modes into existing systems"
- **Current GA Status**: GA
- **Customer Action Required**: Ask for a quote
- **Key Commitments & Quotes**: "Expert guidance to help leaders assess their exposure and plan their PQC migration."
- **Coverage Verification**: CONSISTENT; The document describes consulting services and libraries, which aligns with the "Not specified" note regarding specific product roadmap details.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-020_IDEMIA_Group.html (106.8 KB)
- **Extraction Timestamp**: 2026-07-12T21:04:44

## VND-021 — Infineon Technologies AG

- **Vendor ID**: VND-021
- **Vendor Name**: Infineon Technologies AG
- **Roadmap Title**: Infineon Post-Quantum Cryptography
- **Roadmap URL**: https://www.infineon.com/promo/postquantumcryptography
- **Publish Date**: 2025-10-15
- **Local File**: vendor-roadmaps/VND-021_Infineon_Technologies_AG.html
- **CSV Coverage Notes**: Infineon PQC hub: SLC27 security controller (TEGRION family, Integrity Guard 32) launched Oct 2025 with Common Criteria-certified PQC library (ML-KEM, ML-DSA), crypto-agility and in-field updates, hardened against fault/side-channel. PSOC Control C3 Performance Line samples by end-2025, production 2026 adding ML-DSA on-device key gen/signing and ML-KEM for TLS. Automotive MCUs upgraded for PQC; LMS support. | Milestone: SLC27 PQC-certified contactless/dual-interface security controller launched Oct 2025 with CC-certified ML-KEM + ML-DSA crypto library (TEGRION family, Integrity Guard 32); PSOC
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA; XMSS; LMS
- **Target Migration Dates**: 2025 (PSOC MCUs compliant with CNSA 2.0; TEGRION CC certification); 2030-2035 (potential availability of powerful quantum computers)
- **Products / Services Covered**: TEGRION security controller (Integrity Guard 32); PSOC™ Control C3 Performance Line Family; OPTIGA™ TPM SLB 9673 FW26; OPTIGA™ TPM SLB 9672 FW15; OPTIGA™ TPM SLB 9672 FW16; PSOC™ Edge; SECORA™ Pay; SECORA™ Blockchain
- **Compliance Frameworks**: Common Criteria EAL6+; CNSA Suite 2.0; NIST
- **Hybrid Mode Support**: Yes; "Changes in protocols and a transition period with e.g. hybrid schemes (combining classical cryptography and PQC...)"
- **Current GA Status**: GA; "In 2024, Infineon made a huge step... We received the world’s first Common Criteria EAL6+ certification"
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "In 2024, Infineon made a huge step toward a quantum resistant world. We received the world’s first Common Criteria EAL6+ certification for a security controller comprising the secured implementation of a post-quantum cryptography (PQC) algorithm."; "from 2025 on, Infineon PSOC™ microcontrollers (MCUs) are compliant with PQC requirements for firmware verification outlined in the Commercial National Security Algorithm (CNSA) Suite 2.0"; "In 2025, we become world‘s first company to receive Common Criteria EAL6... for the secured implementation of a post-quantum cryptography algorithm on our TEGRION security controller."
- **Coverage Verification**: PARTIAL; The document confirms TEGRION/Integrity Guard 32 CC certification and PSOC CNSA 2.0 compliance, but does not explicitly mention the SLC27 product name, the Oct 2025 launch date, or specific ML-DSA/ML-KEM library details for those products.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-021_Infineon_Technologies_AG.html (1682.4 KB)
- **Extraction Timestamp**: 2026-07-17T07:52:32

## VND-022 — Intel Corporation

- **Vendor ID**: VND-022
- **Vendor Name**: Intel Corporation
- **Roadmap Title**: Post-Quantum Security with Intel Cryptography
- **Roadmap URL**: https://www.intel.com/content/www/us/en/developer/articles/technical/post-quantum-cryptography.html
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-022_Intel_Corporation.html
- **CSV Coverage Notes**: Intel lays out a phased PQC strategy with an explicit goal of being Y2Q (quantum-resistant) ready by 2030, aligned to the NIST migration deadline to phase out RSA/ECC. The approach addresses harvest-now-decrypt-later first (larger symmetric keys/digests), then hardens code signing/firmware authentication and internet security with NIST-standardized algorithms (FIPS 203 ML-KEM, FIPS 204/205), using hybrid schemes (e.g. Kyber512 + X25519). Built-in crypto acceleration starts with 3rd Gen Xeon Scalable. Intel co-developed FIPS 205 SPHINCS+. Companion strategy content also at intel.com/.../researc
- **Roadmap Scope**: Single product
- **PQC Algorithms Announced**: XMSS; LMS; Kyber512
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Intel Cryptography Primitives Library
- **Compliance Frameworks**: NIST SP 800-208; FIPS 140-3
- **Hybrid Mode Support**: Yes; combines Kyber512 and X25519
- **Current GA Status**: Preview
- **Customer Action Required**: Download the Intel Cryptography Primitives Library; submit issues on Github or in the online service center
- **Key Commitments & Quotes**: "The Intel Cryptography Primitives Library provides Post-Quantum Security already today with its support for XMSS... and LMS..."
- **Coverage Verification**: MISMATCH; The document does not mention the 2030 Y2Q goal, FIPS 203/204/205, 3rd Gen Xeon acceleration, or SPHINCS+ co-development.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-022_Intel_Corporation.html (137.7 KB)
- **Extraction Timestamp**: 2026-07-07T20:32:32

## VND-024 — Keyfactor Inc.

- **Vendor ID**: VND-024
- **Vendor Name**: Keyfactor Inc.
- **Roadmap Title**: Keyfactor Post-Quantum Cryptography Lab
- **Roadmap URL**: https://www.keyfactor.com/post-quantum-cryptography-lab/
- **Publish Date**: 2025-01-01
- **Local File**: public/vendor-roadmaps/VND-024_Keyfactor_Inc..html
- **CSV Coverage Notes**: Keyfactor PQC Lab is a resource hub (webinars, sandboxed test envs, toolkits) emphasizing crypto-agility ahead of the 2035 deadline. EJBCA 9.1 and SignServer 7.1 add quantum-safe algorithms (Dilithium/ML-DSA, SPHINCS+/SLH-DSA, Falcon) via Bouncy Castle APIs; Keyfactor Command for certificate lifecycle/IoT PKI; ACME support. Free trials on Azure Marketplace. | Milestone: EJBCA 9.1 and SignServer 7.1 deliver PQC: issuance/signing with ML-DSA (Dilithium), SLH-DSA (SPHINCS+) and Falcon via Bouncy Castle; Command available for crypto-agile PKI/cert lifecycle
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: Dilithium; SPHINCS+; Falcon
- **Target Migration Dates**: 2035
- **Products / Services Covered**: Keyfactor Command; SignServer; Bouncy Castle APIs; PQC Lab
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: Yes; Post-quantum hybrid cryptography in Bouncy Castle
- **Current GA Status**: GA
- **Customer Action Required**: Get hands-on with a free SaaS-based PKI sandbox; start a 30-day trial of Keyfactor Command or SignServer in Azure
- **Key Commitments & Quotes**: "Crypto-agility—swapping cryptographic algorithms quickly and confidently—is essential, as all encryption must be post-quantum secure by 2035."
- **Coverage Verification**: CONSISTENT; The document confirms the PQC Lab as a resource hub, mentions the 2035 deadline, and explicitly lists SignServer, Keyfactor Command, and Bouncy Castle with support for Dilithium, SPHINCS+, and Falcon via Azure trials.
- **Extraction Quality**: HIGH
- **Source Document**: VND-024_Keyfactor_Inc..html (177.4 KB)
- **Extraction Timestamp**: 2026-07-07T20:22:39

## VND-025 — The Legion of the Bouncy Castle Inc.

- **Vendor ID**: VND-025
- **Vendor Name**: The Legion of the Bouncy Castle Inc.
- **Roadmap Title**: Bouncy Castle: NIST PQC Standards Support (Java 1.79+)
- **Roadmap URL**: https://www.bouncycastle.org/resources/latest-nist-pqc-standards-and-more-bouncy-castle-java-1-79/
- **Publish Date**: 2024-10-31
- **Local File**: public/vendor-roadmaps/VND-025_The_Legion_of_the_Bouncy_Castle_Inc..html
- **CSV Coverage Notes**: Bouncy Castle Java 1.79 (released 2024-10-31) adds the finalized NIST PQC algorithms ML-KEM, ML-DSA and SLH-DSA, CMS KEM support (RFC 9269), enhanced OpenPGP (Argon2, v6 sigs), and draft Composite Signatures / Delta-Chameleon support for migration planning. PQC Almanac provides Java and C# (.NET) migration guidance. | Milestone: Bouncy Castle Java 1.79 ships finalized NIST PQC: ML-KEM, ML-DSA, SLH-DSA; CMS KEM support per RFC 9269; draft Composite Signatures and Delta/Chameleon for migration testing
- **Roadmap Scope**: Single product
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Bouncy Castle Java 1.79
- **Compliance Frameworks**: NIST; RFC 9269
- **Hybrid Mode Support**: Yes; X.509 hybrid certificates
- **Current GA Status**: GA
- **Customer Action Required**: Download the PQC Almanac for migration guidance
- **Key Commitments & Quotes**: "supporting the newly standardized NIST Post-Quantum Cryptography (PQC) algorithms, including the ML-KEM key encapsulation mechanism and the ML-DSA and SLH-DSA signature algorithms"
- **Coverage Verification**: CONSISTENT; The document confirms the release date, algorithms, RFC 9269 support, and draft standards mentioned in the notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-025_The_Legion_of_the_Bouncy_Castle_Inc..html (268.3 KB)
- **Extraction Timestamp**: 2026-07-07T20:22:39

## VND-027 — Microsoft Corporation

- **Vendor ID**: VND-027
- **Vendor Name**: Microsoft Corporation
- **Roadmap Title**: Accelerating the quantum-safe timeline | Microsoft Security Blog
- **Roadmap URL**: https://www.microsoft.com/en-us/security/blog/2026/06/30/microsoft-advances-quantum-safe-security-as-the-risk-timeline-shifts/
- **Publish Date**: 2026-07-15
- **Local File**: vendor-roadmaps/VND-027_Microsoft_Corporation.html
- **CSV Coverage Notes**: None
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: transition products and services to PQC by 2029
- **Products / Services Covered**: None detected
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: Yes; "enables hybrid and post-quantum key exchange as standards mature"
- **Current GA Status**: Planned
- **Customer Action Required**: Align on strategy; Design for change; Begin with inventory; Modernize protocols
- **Key Commitments & Quotes**: "transition products and services to PQC by 2029"; "incorporating PQC requirements into our Secure Future Initiative (SFI)"; "Critical endpoints negotiate TLS 1.3 by default"
- **Coverage Verification**: CONSISTENT; The document is a high-level roadmap announcement and does not specify product-level coverage details.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-027_Microsoft_Corporation.html (276.2 KB)
- **Extraction Timestamp**: 2026-07-15T23:33:21

## VND-028 — NXP Semiconductors N.V.

- **Vendor ID**: VND-028
- **Vendor Name**: NXP Semiconductors N.V.
- **Roadmap Title**: Conservative Post-Quantum Security with FrodoKEM
- **Roadmap URL**: https://www.nxp.com/company/about-nxp/smarter-world-blog/BL-POST-QUANTUM-SECURITY-WITH-FRODOKEM
- **Publish Date**: 2023-05-24
- **Local File**: public/vendor-roadmaps/VND-028_NXP_Semiconductors_N.V..html
- **CSV Coverage Notes**: (2026-07-01: original URL (BL-NXP-STANDS-POST-QUANTUM-CRYPTOGRAPHY) returns HTTP 404; replaced with a current, confirmed-live NXP PQC blog post.) (2026-07-01 r1: publish_date corrected 2025-11-18 -> 2023-05-24 per JSON-LD datePublished and visible "May 24, 2023" byline in the archived HTML; 2025-11-18 is the page dateModified. url_needs_review: roadmap_url returns HTTP 404 to automated checks (WebFetch + browser-UA curl), but nxp.com serves 404 to ALL automated fetches including the homepage (bot blocking), so liveness could not be verified programmatically; the URL remains the canonical search-indexed location and no relocated/alternate URL for the same FrodoKEM post was found. Archived HTML in local_file is the durable proof.)
- **Roadmap Scope**: Algorithm/standard reference
- **PQC Algorithms Announced**: Kyber; Dilithium; FrodoKEM; Rainbow; SIKE
- **Target Migration Dates**: None detected
- **Products / Services Covered**: None detected
- **Compliance Frameworks**: NIST; BSI; ANSSI; ISO
- **Hybrid Mode Support**: No
- **Current GA Status**: No PQC
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: None detected
- **Coverage Verification**: CONSISTENT; The document text matches the title "Conservative Post-Quantum Security with FrodoKEM" and the byline date "May 24, 2023" cited in the coverage notes.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-028_NXP_Semiconductors_N.V..html (68.9 KB)
- **Extraction Timestamp**: 2026-07-07T20:22:39

## VND-029 — Oracle Corporation

- **Vendor ID**: VND-029
- **Vendor Name**: Oracle Corporation
- **Roadmap Title**: Preparing for Post Quantum Cryptography | Oracle Security
- **Roadmap URL**: https://blogs.oracle.com/security/post-quantum-cryptography
- **Publish Date**: 2025-10-01
- **Local File**: vendor-roadmaps/VND-029_Oracle_Corporation.html
- **CSV Coverage Notes**: Discusses challenges of adopting post-quantum cryptography, including the need for standards, interoperability, and new APIs, and addresses risks like "harvest now and decrypt later" attacks on data at rest and in transit.
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA; LMS
- **Target Migration Dates**: JDK 26 released in March 2026; PQC TLS mechanisms planned for JDK 27
- **Products / Services Covered**: Oracle AI Database 26ai; Oracle Java (JDK 21, 24, 26, 27); Oracle Linux 9.7 and 10.1; Oracle Jipher; OpenSSL 3.5
- **Compliance Frameworks**: FIPS 203; FIPS 204; FIPS 140; CNSA 2.0; RFC 8554; NIST Special Publication 800-208; RFC 9180
- **Hybrid Mode Support**: Yes, Oracle is implementing hybrid key establishments for most environments, combining classical and quantum-safe mechanisms for TLS 1.3, SSH, and IKE v2.
- **Current GA Status**: GA (Oracle Linux 9.7 and 10.1 offer OpenSSL 3.5 with PQC; JDK 21/24 include LMS/ML-KEM/ML-DSA; Oracle AI Database 26ai supports ML-KEM/ML-DSA)
- **Customer Action Required**: Transition to TLS 1.3; Upgrade to current versions of Oracle products (Database, Java, Linux); Follow PQC standards rather than investing in non-standard solutions.
- **Key Commitments & Quotes**: "Oracle is implementing hybrid key establishments for most environments." "Oracle is implementing FIPS 204 ML-DSA signatures." "Oracle plans to use classical and post-quantum cryptographic signatures side by side for firmware signing where feasible."
- **Coverage Verification**: CONSISTENT, the document explicitly discusses challenges including standards, interoperability, new APIs, and "harvest now and decrypt later" risks for data at rest and in transit.
- **Extraction Quality**: HIGH
- **Source Document**: VND-029_Oracle_Corporation.html (72.5 KB)
- **Extraction Timestamp**: 2026-07-30T20:58:23

## VND-030 — PQShield Ltd.

- **Vendor ID**: VND-030
- **Vendor Name**: PQShield Ltd.
- **Roadmap Title**: PQShield PQCryptoLib-SDK: ML-KEM and ML-DSA
- **Roadmap URL**: https://pqshield.com/products/pqc-sdk/
- **Publish Date**: 2025-09-01
- **Local File**: public/vendor-roadmaps/VND-030_PQShield_Ltd..html
- **CSV Coverage Notes**: PQShield's PQCryptoLib-Core is FIPS 140-3 CMVP-certified (ML-KEM/FIPS 203 + ML-DSA/FIPS 204, hybrid ECDH+ML-KEM) and listed on NIST's Implementation Under Test list. Product family: PQCryptoLib-SDK (OpenSSL 3.x integration), PQMicroLib-Core, hardware IP cores (PQPlatform-CoPro, PQPerform-Flare/Inferno/Flex), PQE2E messaging. FIPS 203/204/205 coverage. | Milestone: PQCryptoLib-Core achieved FIPS 140-3 CMVP certification (incl. ML-KEM FIPS 203 + ML-DSA FIPS 204 and hybrid ECDH+ML-KEM); now progressing on NIST IUT/MIP list toward expanded validation.
- **Roadmap Scope**: Single product
- **PQC Algorithms Announced**: ML-KEM; ML-DSA
- **Target Migration Dates**: None detected
- **Products / Services Covered**: PQCryptoLib-SDK; PQCryptoLib-Core
- **Compliance Frameworks**: FIPS 140-3; CAVP; CMVP
- **Hybrid Mode Support**: No
- **Current GA Status**: GA
- **Customer Action Required**: Contact us for an evaluation; Complete the form below to download the Product Brief and arrange a Product Evaluation
- **Key Commitments & Quotes**: "PQCryptoLib-SDK provides implementations of ML-KEM and ML-DSA."
- **Coverage Verification**: PARTIAL; The document confirms PQCryptoLib-SDK and Core but does not mention PQMicroLib-Core, hardware IP cores, PQE2E, or specific FIPS 203/204/205 algorithm numbers.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-030_PQShield_Ltd..html (61.0 KB)
- **Extraction Timestamp**: 2026-07-07T20:23:35

## VND-031 — Palo Alto Networks Inc.

- **Vendor ID**: VND-031
- **Vendor Name**: Palo Alto Networks Inc.
- **Roadmap Title**: Palo Alto Networks Post-Quantum Migration Planning
- **Roadmap URL**: https://docs.paloaltonetworks.com/network-security/quantum-security/administration/quantum-security-concepts/post-quantum-migration-planning-and-preparation
- **Publish Date**: Unknown
- **Local File**: vendor-roadmaps/VND-031_Palo_Alto_Networks_Inc.html
- **CSV Coverage Notes**: None
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: PAN-OS 11.1 or later; Quantum-Safe Security app
- **Compliance Frameworks**: NIST; NSA; RFC 6379; RFC 8784; RFC 9242; RFC 9370
- **Hybrid Mode Support**: Yes; The document states "the industry is adopting hybrid keys" and recommends using "a strong classic KEM... and one or more PQCs" to provide an extra layer of security.
- **Current GA Status**: Planned
- **Customer Action Required**: Assign resources and build awareness; define responsibilities; develop a cryptographic inventory and priority list; evaluate solutions, experiment, and test; continue to monitor progress; harden existing VPN connections (e.g., Suite-B-GCM-256, 4K RSA, SHA-384/512); implement RFC 8784/9242/9370.
- **Key Commitments & Quotes**: "Post-quantum IKEv2 VPNs ( RFC 8784 ) are the first step to creating a secure post-quantum network, which you can do now without impacting your network."
- **Coverage Verification**: CONSISTENT; The document is a general planning guide and does not specify the detailed algorithmic or version-specific coverage implied by the "Not specified" CSV note.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-031_Palo_Alto_Networks_Inc.html (303.5 KB)
- **Extraction Timestamp**: 2026-09-02T11:57:09

## VND-032 — Red Hat Inc.

- **Vendor ID**: VND-032
- **Vendor Name**: Red Hat Inc.
- **Roadmap Title**: Building the levee: Red Hat's post-quantum strategy is already in production
- **Roadmap URL**: https://www.redhat.com/en/blog/building-levee-why-red-hats-post-quantum-strategy-already-production
- **Publish Date**: 2026-05-25
- **Local File**: public/vendor-roadmaps/VND-032_Red_Hat_Inc..html
- **CSV Coverage Notes**: (2026-07-01: corrected publish_date from 2025-05-01 to 2026-05-25 per the byline on the live page.)
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Red Hat Enterprise Linux 10 (RHEL); Red Hat Enterprise Linux 10.1; Fedora; OpenSSL; Network Security Services (NSS); Linux kernel
- **Compliance Frameworks**: NIST; FIPS 203; FIPS 204
- **Hybrid Mode Support**: Yes; managing 2 estates simultaneously: classical cryptography and PQC
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Red Hat has been laying the groundwork for the post-quantum transition for years"; "With RHEL 10.1, we became the first major distribution to start signing our RPM packages with post-quantum keys (ML-DSA)"; "We recognize moving to PQC requires managing 2 estates simultaneously: classical cryptography and PQC"
- **Coverage Verification**: CONSISTENT; The document byline states "May 25, 2026", which matches the corrected publish_date in the CSV notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-032_Red_Hat_Inc..html (620.0 KB)
- **Extraction Timestamp**: 2026-07-07T20:23:35

## VND-034 — SafeLogic Inc.

- **Vendor ID**: VND-034
- **Vendor Name**: SafeLogic Inc.
- **Roadmap Title**: Post-Quantum Cryptography (PQC) | SafeLogic PQC Migration Roadmap
- **Roadmap URL**: https://www.safelogic.com/products-and-services/post-quantum-cryptography
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-034_SafeLogic_Inc..html
- **CSV Coverage Notes**: SafeLogic publishes a PQC Migration Roadmap and CMAP (Cryptography Maturity Action Plan) framework with a phased methodology: assess crypto systems, build migration plans, embrace crypto-agility, align with FIPS 140-3. CryptoComply suite delivers ML-KEM/ML-DSA/SLH-DSA with hybrid mode. SafeLogic CEO leads NIST NCCoE PQC Migration Project Risk Management workstream. | Milestone: CryptoComply 140-3 FIPS Provider with PQC submitted to NIST CMVP on 2026-05-19; CryptoComply Go v4.0 with full PQC support generally available.
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA; Kyber; Dilithium; SPHINCS+
- **Target Migration Dates**: None detected
- **Products / Services Covered**: CryptoComply; CryptoComply BoringCrypto; CryptoComply PQ TLS; CryptoComply Entropy Provider; RapidCert; MaintainCert
- **Compliance Frameworks**: FIPS 140-3; FIPS 140-2; FIPS 203; FIPS 204; FIPS 205; CMMC 2.0; CNSA 2.0; Common Criteria; FedRAMP; GovRAMP
- **Hybrid Mode Support**: Yes; Hybrid PQC + FIPS Mode combining ML-KEM with validated FIPS 140-3 algorithms
- **Current GA Status**: GA
- **Customer Action Required**: Download Free PQC Migration Guide; Assess Your Cryptographic Systems; Build a Migration Plan; Embrace Crypto-Agility and Hybrid Models; Align with FIPS 140-3
- **Key Commitments & Quotes**: "CryptoComply v3.5 delivers... full support for NIST-standardized PQC algorithms, hybrid cryptography for FIPS environments"
- **Coverage Verification**: PARTIAL; The document confirms the roadmap, CMAP, phased methodology, CryptoComply PQC support, and hybrid mode, but does not mention the CEO's NCCoE role or the specific 2026-05-19 submission milestone.
- **Extraction Quality**: HIGH
- **Source Document**: VND-034_SafeLogic_Inc..html (161.0 KB)
- **Extraction Timestamp**: 2026-07-07T20:42:05

## VND-035 — Samsung Electronics Co. Ltd.

- **Vendor ID**: VND-035
- **Vendor Name**: Samsung Electronics Co. Ltd.
- **Roadmap Title**: The First Step to a Quantum-Safe Future With Samsung Knox
- **Roadmap URL**: https://news.samsung.com/global/the-first-step-to-a-quantum-safe-future-with-samsung-knox
- **Publish Date**: 2025-01-22
- **Local File**: public/vendor-roadmaps/VND-035_Samsung_Electronics_Co._Ltd..html
- **CSV Coverage Notes**: Samsung Knox Matrix gains Post-Quantum Enhanced Data Protection (EDP) using ML-KEM (FIPS 203, lattice-based), debuting on Galaxy S25 (first device on One UI 7) — industry-first PQC-based cloud/cross-device data protection. Extends quantum-safe protection across the Knox cross-device trust ecosystem. | Milestone: Galaxy S25 (One UI 7) is first to support PQC-based cloud data protection: ML-KEM (FIPS 203) integrated into Knox Matrix via Post-Quantum Enhanced Data Protection (EDP).
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: ML-KEM
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Galaxy S25 series; Samsung Knox Matrix; Samsung Cloud
- **Compliance Frameworks**: NIST; FIPS 203
- **Hybrid Mode Support**: No
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Samsung is introducing Post-Quantum Enhanced Data Protection (EDP) to Samsung Knox Matrix"; "The Galaxy S25 series is the first in the industry to support PQC-based cloud data protection"
- **Coverage Verification**: CONSISTENT; The document confirms ML-KEM integration into Knox Matrix EDP on Galaxy S25/One UI 7 for cloud data protection.
- **Extraction Quality**: HIGH
- **Source Document**: VND-035_Samsung_Electronics_Co._Ltd..html (148.6 KB)
- **Extraction Timestamp**: 2026-07-07T20:24:35

## VND-036 — SandboxAQ Inc.

- **Vendor ID**: VND-036
- **Vendor Name**: SandboxAQ Inc.
- **Roadmap Title**: SandboxAQ: Q-Day Moved Closer - PQC Migration Timelines Just Shifted Left
- **Roadmap URL**: https://www.sandboxaq.com/post/q-day-moved-closer-pqc-migration-timelines-just-shifted-left
- **Publish Date**: 2026-07-13
- **Local File**: vendor-roadmaps/VND-036_SandboxAQ_Inc.html
- **CSV Coverage Notes**: None
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: 2029
- **Products / Services Covered**: AQtive Guard
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: None detected
- **Current GA Status**: No PQC
- **Customer Action Required**: Move our Public Key Infrastructures (PKIs) now
- **Key Commitments & Quotes**: "The window for migration to Post-Quantum Cryptography (PQC) has potentially been moved from 2035 to 2029"
- **Coverage Verification**: CONSISTENT — The document is a general threat analysis blog post and does not specify product-level roadmap details, consistent with "Not specified".
- **Extraction Quality**: LOW
- **Source Document**: VND-036_SandboxAQ_Inc.html (34.5 KB)
- **Extraction Timestamp**: 2026-07-12T21:04:44

## VND-037 — Securosys SA

- **Vendor ID**: VND-037
- **Vendor Name**: Securosys SA
- **Roadmap Title**: Securosys Post-Quantum Cryptography HSM
- **Roadmap URL**: https://www.securosys.com/en/hsm/post-quantum-cryptography
- **Publish Date**: 2024-08-20
- **Local File**: public/vendor-roadmaps/VND-037_Securosys_SA.html
- **CSV Coverage Notes**: Securosys PQC HSM offering across Primus CyberVault on-prem HSMs and CloudHSM (Economy/Sandbox tiers). Supports the five NIST-standardized PQC algorithms — ML-KEM, ML-DSA, SLH-DSA, HSS-LMS, XMSS — and hybrid classical+PQC operations for gradual migration. Collaborates with HSLU researchers on PQC TLS performance (key agreement + authentication). | Milestone: Primus X CyberVault HSM and CloudHSM support all five NIST PQC algorithms (ML-KEM, ML-DSA, SLH-DSA, HSS-LMS, XMSS) with hybrid RSA/ECC+PQC operations.
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA; HSS-LMS; XMSS
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Primus CyberVault HSMs; CloudHSM
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: Yes; hybrid operations combining classical (RSA/ECC) and PQC algorithms
- **Current GA Status**: GA
- **Customer Action Required**: Start a 90-day free trial of CloudHSM
- **Key Commitments & Quotes**: "Our Primus CyberVault HSMs and CloudHSM services fully support PQC algorithms"
- **Coverage Verification**: CONSISTENT; The document explicitly confirms support for the listed algorithms, hybrid operations, and the specific product lines (Primus CyberVault and CloudHSM) mentioned in the notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-037_Securosys_SA.html (274.3 KB)
- **Extraction Timestamp**: 2026-07-07T20:24:35

## VND-038 — Senetas Corporation Ltd.

- **Vendor ID**: VND-038
- **Vendor Name**: Senetas Corporation Ltd.
- **Roadmap Title**: Quantum Resistant Encryption Security - Senetas (5-step Quantum Security roadmap)
- **Roadmap URL**: https://www.senetas.com/cybersecurity-challenges/post-quantum-encryption-security/
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-038_Senetas_Corporation_Ltd..html
- **CSV Coverage Notes**: Senetas publishes a post-quantum encryption strategy with a 5-step roadmap to quantum security: crypto-agility, risk assessment, QRNG, QKD, and adoption of NIST-standardized quantum-resistant algorithms. Hybrid approach combining conventional and quantum-resistant crypto; crypto-agile FPGA design updatable in-field. Aligns with NIST 2024 standards and ETSI QKD standards. | Milestone: First-to-market high-speed network encryptors with Quantum Resistant Encryption (QRE) supporting all NIST-selected PQC algorithms; offered to existing customers (direct in AU/NZ, via Thales globally) for in-field
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: NIST FIPS 203; NIST FIPS 204; NIST FIPS 205
- **Hybrid Mode Support**: Yes; combining conventional cryptography with quantum-resistant techniques
- **Current GA Status**: GA
- **Customer Action Required**: Practice Crypto-Agility; Undertake a Post-Quantum Risk Assessment; Protect Applications with Quantum Random Number Generation; Secure Data in Motion with Quantum Key Distribution; Implement Quantum Resistant Algorithms
- **Key Commitments & Quotes**: "Senetas supports all quantum encryption algorithms selected by NIST and is proud to have been first to market with our high-speed network encryptors offering Quantum Resistant Encryption (QRE)."
- **Coverage Verification**: PARTIAL; The document confirms the 5-step roadmap, hybrid approach, FPGA crypto-agility, NIST standards, and first-to-market claim, but does not mention ETSI QKD standards or distribution via Thales.
- **Extraction Quality**: HIGH
- **Source Document**: VND-038_Senetas_Corporation_Ltd..html (188.5 KB)
- **Extraction Timestamp**: 2026-07-07T20:43:09

## VND-039 — STMicroelectronics N.V.

- **Vendor ID**: VND-039
- **Vendor Name**: STMicroelectronics N.V.
- **Roadmap Title**: Post-Quantum Cryptography - STMicroelectronics
- **Roadmap URL**: https://www.st.com/content/st_com/en/about/innovation-and-technology/post-quantum-cryptography.html
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-039_STMicroelectronics_N.V..html
- **CSV Coverage Notes**: Official ST corporate page describing its post-quantum cryptography program: contributing to standardization, developing crypto-agile hardware accelerators and software libraries for general-purpose and secure MCUs, and ensuring a seamless transition to crypto-agile ecosystems supporting a mix of quantum-safe and classical algorithms. Notes ST's Keccak role in NIST-standardized algorithms (ML-KEM, ML-DSA, SLH-DSA, FALCON). | Milestone: Crypto-agile hardware/software PQC assets ready (X-CUBE-PQC library; first Common Criteria-certified STSAFE-TPM with LMS-signed firmware update) supporting secu
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA; LMS; XMSS; FALCON
- **Target Migration Dates**: None detected
- **Products / Services Covered**: STM32 MCUs; STM32 MPUs; SPC5 32-bit Automotive MCUs; Stellar 32-bit Automotive MCUs; X-Cube PQC; NesLib-PQML; STSAFE-TPM
- **Compliance Frameworks**: NIST FIPS-203; NIST FIPS 204; NIST FIPS 205; NIST SP800-208; Common Criteria
- **Hybrid Mode Support**: Yes; supporting a mix of quantum-safe and classical algorithms
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "ST launched a post-quantum cryptography program to support the standardization and development of new algorithms, and secure a seamless transition to new crypto-agile ecosystems."
- **Coverage Verification**: CONSISTENT; The document confirms the corporate program, Keccak role, specific algorithms, and named products (X-Cube PQC, STSAFE-TPM) mentioned in the notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-039_STMicroelectronics_N.V..html (481.3 KB)
- **Extraction Timestamp**: 2026-07-07T20:34:37

## VND-040 — SUSE LLC

- **Vendor ID**: VND-040
- **Vendor Name**: SUSE LLC
- **Roadmap Title**: SUSE state of and strategy for Post Quantum Cryptography at the end of 2025
- **Roadmap URL**: https://www.suse.com/c/suse-state-of-and-strategy-for-post-quantum-cryptography-at-the-end-of-2025/
- **Publish Date**: 2025-12-04
- **Local File**: public/vendor-roadmaps/VND-040_SUSE_LLC.html
- **CSV Coverage Notes**: Official SUSE Communities strategy blog laying out SUSE's PQC approach: adopt NIST standards (ML-KEM/ML-DSA/SLH-DSA, FIPS 203-205) and upstream implementations as they mature, delivering via maintenance updates and new product revisions, using hybrid classical+PQC ciphers during transition. Covers progressive rollout across SLES 15 SP6/SP7, SL Micro 6.0-6.2, and SLES 16, integrating PQC into OpenSSL, GnuTLS, libgcrypt, NSS, OpenSSH 10+, strongSwan 6.0+, and Go. | Milestone: SLES 16.0 and SL Micro 6.2 expand PQC support across OpenSSL, GnuTLS, libgcrypt, and leancrypto; hybrid x25519mlkem768 ke
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA; LMS; XMSS; Frodo KEM
- **Target Migration Dates**: None detected
- **Products / Services Covered**: SLES 15 SP6; SLES 15 SP7; SL Micro 6.0; SL Micro 6.1; SLES 16.0; SL Micro 6.2
- **Compliance Frameworks**: FIPS 203; FIPS 204; FIPS 205; FIPS 186; FIPS 140-3
- **Hybrid Mode Support**: Yes; hybrid classical+PQC ciphers used during transition
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "SUSE’s strategy on implementing post quantum cryptography (PQC) has been to adopt standards and upstream implementations when they become available, and deliver support to customers via maintenance or newer product revisions."
- **Coverage Verification**: CONSISTENT; The document confirms the strategy, standards, hybrid approach, and specific product/component coverage listed in the notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-040_SUSE_LLC.html (188.6 KB)
- **Extraction Timestamp**: 2026-07-07T20:43:09

## VND-041 — Thales Group

- **Vendor ID**: VND-041
- **Vendor Name**: Thales Group
- **Roadmap Title**: Post-Quantum Crypto Agility | Thales CPL
- **Roadmap URL**: https://cpl.thalesgroup.com/encryption/post-quantum-crypto-agility
- **Publish Date**: 2025-07-29
- **Local File**: vendor-roadmaps/VND-041_Thales_Group.html
- **CSV Coverage Notes**: Thales's PQC-ready portfolio spans Luna HSMs (ML-KEM/ML-DSA/SLH-DSA support built into core firmware), High Speed Encryptors (FPGA-based, field-upgradable for crypto-agile network encryption with QKD/QRNG integration and a Transport Independent Mode that avoids public key exchange to mitigate harvest-now-decrypt-later risk), and general PQC-readiness assessment services. Positioned as a portfolio-wide crypto-agility strategy rather than a single product.
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Luna HSMs; High Speed Encryptors (HSE); PQC-readiness assessment services
- **Compliance Frameworks**: NIST FIPS 203; NIST FIPS 204; NIST FIPS 205; NSA CNSA 2.0
- **Hybrid Mode Support**: Yes, the document states that "many organizations will use hybrid cryptography allowing classical and post-quantum algorithms to coexist" and mentions "hybrid cryptographic operations for transitional environments."
- **Current GA Status**: GA (General Availability), as algorithms are "built into core firmware" and products are described as "PQC-ready" and "Quantum-Ready."
- **Customer Action Required**: Identify quantum-vulnerable cryptography; prioritize high-risk and long-lived data; prepare for hybrid environments; build a crypto-agile migration plan; test applications and workflows.
- **Key Commitments & Quotes**: "Thales is committed to delivering solutions that support a Post-Quantum crypto agile strategy."; "Luna HSMs help enable quantum-safe cryptographic workflows by incorporating NIST-standardized PQC algorithms... directly into core firmware"; "Thales HSEs deliver crypto-agile network encryption with a flexible FPGA-based architecture, enabling seamless migration to post-quantum security."
- **Coverage Verification**: CONSISTENT, the document explicitly confirms Luna HSMs with core firmware support for ML-KEM/ML-DSA/SLH-DSA, FPGA-based HSEs with QKD/QRNG integration and Transport Independent Mode, and offers PQC readiness assessments as part of a broader crypto-agility strategy.
- **Extraction Quality**: HIGH
- **Source Document**: VND-041_Thales_Group.html (363.1 KB)
- **Extraction Timestamp**: 2026-07-30T21:00:13

## VND-042 — Utimaco IS GmbH

- **Vendor ID**: VND-042
- **Vendor Name**: Utimaco IS GmbH
- **Roadmap Title**: Utimaco Quantum Protect — PQC Application Package for GP HSM
- **Roadmap URL**: https://utimaco.com/data-protection/gp-hsm/application-package/quantum-protect
- **Publish Date**: 2025-04-02
- **Local File**: public/vendor-roadmaps/VND-042_Utimaco_IS_GmbH.html
- **CSV Coverage Notes**: Utimaco Quantum Protect extends u.trust General Purpose HSM Se-Series with PQC via in-field firmware upgrade (no hardware swap). Supports ML-KEM (FIPS 203), ML-DSA (FIPS 204), and hash-based LMS/HSS/XMSS/XMSS-MT; SLH-DSA (FIPS 205) on the roadmap (in progress). Crypto-agile design plus a free PQC simulator for pre-deployment evaluation. | Milestone: Quantum Protect on u.trust GP HSM Se-Series supports ML-KEM (FIPS 203) + ML-DSA (FIPS 204) and LMS/HSS/XMSS/XMSS-MT today; SLH-DSA (FIPS 205) in progress.
- **Roadmap Scope**: Single product
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; LMS; HSS; XMSS; XMSS-MT; SLH-DSA
- **Target Migration Dates**: None detected
- **Products / Services Covered**: u.trust General Purpose HSM Se-Series; Quantum Protect Simulator
- **Compliance Frameworks**: FIPS 203; FIPS 204; FIPS 205; PKCS #11
- **Hybrid Mode Support**: No
- **Current GA Status**: GA
- **Customer Action Required**: Use the free simulator to evaluate how PQC algorithms work within your environment and use case
- **Key Commitments & Quotes**: "Quantum Protect extends the u.trust General Purpose HSM Se-Series with proven and standardized Post Quantum Cryptography algorithms"; "Quantum Protect is available as seamless in-field upgrade for the u.trust General Purpose HSM Se-Series – no HSM exchange needed"; "More algorithms such as SLH-DSA are on the roadmap"
- **Coverage Verification**: CONSISTENT; The document confirms the Se-Series support, in-field upgrade capability, specific algorithms (ML-KEM, ML-DSA, LMS, HSS, XMSS, XMSS-MT), SLH-DSA roadmap status, and the free simulator.
- **Extraction Quality**: HIGH
- **Source Document**: VND-042_Utimaco_IS_GmbH.html (282.6 KB)
- **Extraction Timestamp**: 2026-07-07T20:24:35

## VND-045 — wolfSSL Inc.

- **Vendor ID**: VND-045
- **Vendor Name**: wolfSSL Inc.
- **Roadmap Title**: wolfSSL Support for NIST PQC Standards (ML-KEM & ML-DSA)
- **Roadmap URL**: https://www.wolfssl.com/support-for-the-official-post-quantum-standards-ml-kem-and-ml-dsa/
- **Publish Date**: 2024-10-01
- **Local File**: vendor-roadmaps/VND-045_wolfSSL_Inc..html
- **CSV Coverage Notes**: wolfSSL/wolfCrypt have full production support for ML-KEM (FIPS 203) and ML-DSA (FIPS 204), usable across wolfSSL, wolfBoot and wolfPKCS11 for embedded/IoT/TLS. SLH-DSA (FIPS 205) offered for specialized applications on request. Page revised Sep/Oct 2024. | Milestone: Full ML-KEM (FIPS 203) and ML-DSA (FIPS 204) implementation shipping in wolfSSL/wolfCrypt today; SLH-DSA available on request
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA; Kyber; Dilithium; SPHINCS+; LMS; XMSS
- **Target Migration Dates**: None detected
- **Products / Services Covered**: wolfSSL library; wolfCrypt
- **Compliance Frameworks**: NIST FIPS 203; NIST FIPS 204; NIST FIPS 205
- **Hybrid Mode Support**: None detected
- **Current GA Status**: GA
- **Customer Action Required**: Download the wolfSSL library; configure it to enable Dilithium and Kyber; run the benchmarks; contact facts@wolfSSL.com or +1 425 245 8247 for SLH-DSA implementation and support
- **Key Commitments & Quotes**: "we here at wolfSSL are announcing to the world that we have full implementation and support for ML-KEM and ML-DSA"
- **Coverage Verification**: PARTIAL — The document confirms full support for ML-KEM and ML-DSA in wolfSSL/wolfCrypt and SLH-DSA on request, but does not explicitly mention wolfBoot, wolfPKCS11, or the specific revision dates.
- **Extraction Quality**: HIGH
- **Source Document**: VND-045_wolfSSL_Inc..html (66.7 KB)
- **Extraction Timestamp**: 2026-07-30T21:01:13

## VND-048 — Open Quantum Safe Project

- **Vendor ID**: VND-048
- **Vendor Name**: Open Quantum Safe Project
- **Roadmap Title**: Open Quantum Safe: Post-Quantum Cryptography
- **Roadmap URL**: https://openquantumsafe.org/post-quantum-crypto.html
- **Publish Date**: 2026-07-13
- **Local File**: vendor-roadmaps/VND-048_Open_Quantum_Safe_Project.html
- **CSV Coverage Notes**: None
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA; BIKE; Classic McEliece; CROSS; Falcon; FrodoKEM; HQC; Kyber; LMS; MAYO; NTRU; NTRU-Prime; SNOVA; UOV; XMSS
- **Target Migration Dates**: None detected
- **Products / Services Covered**: None detected
- **Compliance Frameworks**: NIST FIPS 202; NIST FIPS 203; NIST FIPS 204; IETF Crypto Forum Research Group
- **Hybrid Mode Support**: None detected
- **Current GA Status**: No PQC
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Thus, it is important to start developing and deploying quantum-safe cryptography now, even before quantum computers are built."
- **Coverage Verification**: CONSISTENT — The document is a general project overview and FAQ, not a specific product roadmap, so the lack of specific coverage notes is consistent.
- **Extraction Quality**: LOW
- **Source Document**: VND-048_Open_Quantum_Safe_Project.html (18.5 KB)
- **Extraction Timestamp**: 2026-07-12T21:31:54

## VND-053 — ISARA Corporation

- **Vendor ID**: VND-053
- **Vendor Name**: ISARA Corporation
- **Roadmap Title**: ISARA Radiate: Quantum-Safe Library
- **Roadmap URL**: https://isara.com/products/isara-radiate-quantum-safe-library.html
- **Publish Date**: 2026-07-13
- **Local File**: vendor-roadmaps/VND-053_ISARA_Corporation.html
- **CSV Coverage Notes**: None
- **PQC Algorithms Announced**: ML-KEM; ML-DSA
- **Target Migration Dates**: None detected
- **Products / Services Covered**: ISARA Radiate™ Quantum-safe Library; ISARA Advance® Cryptographic Inventory and Risk Assessment Tool
- **Compliance Frameworks**: NIST PQC Security Level 5; MISRA-C; DORA; GDPR; PCI DSS; CNSA 2.0; CISA
- **Hybrid Mode Support**: Yes; "test optional hybrid certificates for PQC migration"; "Seamlessly transition internal PKIs to a hybrid then fully quantum-safe state"
- **Current GA Status**: GA
- **Customer Action Required**: Connect with ISARA; Book Your Meeting; Integrate; Verify; Migrate
- **Key Commitments & Quotes**: "Radiate is a high-performance quantum-safe software development kit"; "Achieve NIST PQC Security Level 5, even on the most resource-limited devices"; "Radiate promotes crypto agility using interoperable certificates"
- **Coverage Verification**: CONSISTENT; The document is a general product overview and does not specify the detailed roadmap timelines or CSV coverage notes mentioned in the prompt.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-053_ISARA_Corporation.html (49.7 KB)
- **Extraction Timestamp**: 2026-07-12T21:04:44

## VND-054 — QuSecure Inc.

- **Vendor ID**: VND-054
- **Vendor Name**: QuSecure Inc.
- **Roadmap Title**: Post-Quantum Cryptography Migration Guide
- **Roadmap URL**: https://qu-secure.net/resources/migration-guide/
- **Publish Date**: 2024
- **Local File**: public/vendor-roadmaps/VND-054_QuSecure_Inc..html
- **CSV Coverage Notes**: QuSecure publishes a structured 7-phase PQC migration roadmap: Discovery & Assessment, Risk Prioritization, Algorithm Selection, Proof of Concept, Pilot Implementation, Staged Migration, and Validation & Monitoring. Recommends NIST ML-KEM/ML-DSA/SLH-DSA and hybrid/direct/phased replacement approaches over a 3-5 year timeline; delivered via the QuProtect platform. | Milestone: Staged migration of critical systems (6-18 months) with continuous validation/monitoring; QuProtect R3 enables algorithm swaps and crypto-policy changes across cloud, on-prem, air-gapped, and sovereign environments aligne
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA
- **Target Migration Dates**: 3-5 year migration timeline
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: NIST FIPS 203; NIST FIPS 204; NIST FIPS 205; FIPS 140-3; SOC 2 Type II; HIPAA
- **Hybrid Mode Support**: Yes; Hybrid Approach uses both classical and post-quantum algorithms during transition
- **Current GA Status**: No PQC
- **Customer Action Required**: Assess Your Risk; Get Expert Help; Get Expert Consultation; Calculate Migration Priority
- **Key Commitments & Quotes**: "Your complete roadmap for migrating from current encryption to quantum-safe cryptography."
- **Coverage Verification**: PARTIAL; The document confirms the 7-phase roadmap, algorithms, and timeline, but does not mention the "QuProtect" platform or "QuProtect R3" features cited in the notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-054_QuSecure_Inc..html (150.2 KB)
- **Extraction Timestamp**: 2026-07-07T20:31:25

## VND-055 — evolutionQ Inc.

- **Vendor ID**: VND-055
- **Vendor Name**: evolutionQ Inc.
- **Roadmap Title**: evolutionQ: Quantum Risk Assessment
- **Roadmap URL**: https://evolutionq.com/services/quantum-risk-assessment
- **Publish Date**: 2026-07-13
- **Local File**: vendor-roadmaps/VND-055_evolutionQ_Inc.html
- **CSV Coverage Notes**: None
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: BasejumpSKI; BasejumpQDN
- **Compliance Frameworks**: NIST Risk Management Framework
- **Hybrid Mode Support**: None detected
- **Current GA Status**: No PQC
- **Customer Action Required**: Get Price
- **Key Commitments & Quotes**: None detected
- **Coverage Verification**: CONSISTENT — The document describes risk assessment services and general product names without specific PQC algorithm implementation details, consistent with "Not specified" coverage notes.
- **Extraction Quality**: LOW
- **Source Document**: VND-055_evolutionQ_Inc.html (38.4 KB)
- **Extraction Timestamp**: 2026-07-12T21:05:16

## VND-056 — SEALSQ Corp.

- **Vendor ID**: VND-056
- **Vendor Name**: SEALSQ Corp.
- **Roadmap Title**: SEALSQ Announces Development of QASIC, the Quantum-Resistant ASIC, By IC'Alps
- **Roadmap URL**: https://www.sealsq.com/investors/news-releases/sealsq-announces-development-of-qasic-the-quantum-resistant-asic-by-icalps
- **Publish Date**: 2026-07-28
- **Local File**: vendor-roadmaps/VND-056_SEALSQ_Corp.html
- **CSV Coverage Notes**: None
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: QASIC; Catalog ICs; Custom ICs; Security IP; Chiplet-based Hardware Security Modules (CHSMs); Post-Quantum Hardware Security Modules (HSMs); secure microcontrollers
- **Compliance Frameworks**: ISO 9001; ISO 13485; EN 9100; Common Criteria
- **Hybrid Mode Support**: None detected
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "commercialization of the first PQC standard chip on the market"; "development of custom IC solutions, the QASIC - Quantum ASIC"; "first prototype from this integrated roadmap is expected in 2026"
- **Coverage Verification**: CONSISTENT — The document is a high-level strategic announcement regarding the acquisition and roadmap, containing no specific technical details or product versions to verify against CSV notes.
- **Extraction Quality**: LOW
- **Source Document**: VND-056_SEALSQ_Corp.html (79.5 KB)
- **Extraction Timestamp**: 2026-07-27T23:27:52

## VND-057 — Cloudflare Inc.

- **Vendor ID**: VND-057
- **Vendor Name**: Cloudflare Inc.
- **Roadmap Title**: The White House's post-quantum executive order is an important milestone. It's time to get to work
- **Roadmap URL**: https://blog.cloudflare.com/post-quantum-eo-2026/
- **Publish Date**: 2026-07-15
- **Local File**: vendor-roadmaps/VND-057_Cloudflare_Inc.html
- **CSV Coverage Notes**: Cloudflare moved its full post-quantum security target to 2029; already shipped PQC (ML-KEM, ML-DSA) across most products (Cloudflare One, TLS, MASQUE, IPsec) at no extra cost to any plan. References NIST FIPS and the 2026 federal PQC EO deadlines (agency key-establishment by 2030-12-31, digital signatures by 2031-12-31, covered-contractor FIPS compliance by 2030-12-31).
- **PQC Algorithms Announced**: ML-KEM; ML-DSA
- **Target Migration Dates**: Cloudflare full post-quantum security target: 2029; Federal agency key-establishment: December 31, 2030; Federal agency digital signatures: December 31, 2031; Covered-contractor FIPS compliance: December 31, 2030
- **Products / Services Covered**: Cloudflare One; TLS; MASQUE; IPsec
- **Compliance Frameworks**: NIST FIPS; FIPS 199
- **Hybrid Mode Support**: Partial; The document discusses the risk of downgrade attacks if classical cryptography is not disabled, implying hybrid or transitional states are common but warns against them for full security.
- **Current GA Status**: GA; The document states PQC has been "shipped" and is "available to all customers, on every plan, at no additional cost."
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Cloudflare moved our own target for full post-quantum security to 2029"; "we've already shipped post-quantum encryption across most of our products at no extra cost"; "every post-quantum upgrade we build is available to all customers, on every plan, at no additional cost"
- **Coverage Verification**: CONSISTENT; The document explicitly confirms the 2029 target, the shipping of PQC across Cloudflare One, TLS, MASQUE, and IPsec at no extra cost, and references the specific federal deadlines and NIST FIPS compliance requirements mentioned in the notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-057_Cloudflare_Inc.html (426.7 KB)
- **Extraction Timestamp**: 2026-07-30T21:03:03

## VND-058 — HashiCorp Inc.

- **Vendor ID**: VND-058
- **Vendor Name**: HashiCorp Inc.
- **Roadmap Title**: HashiCorp Post-Quantum Cryptography Plans
- **Roadmap URL**: https://www.hashicorp.com/en/blog/nist-s-post-quantum-cryptography-standards-our-plans
- **Publish Date**: 2024-09-04
- **Local File**: vendor-roadmaps/VND-058_HashiCorp_Inc..html
- **CSV Coverage Notes**: HashiCorp plans phased PQC adoption beginning with the Vault transit secrets engine, incorporating the three NIST algorithms (ML-KEM first; ML-DSA/SLH-DSA later) and hybrid classical+PQ schemes, expanding to other products as Go and standards bodies converge. No firm version/release dates given. | Milestone: Staged PQC rollout in Vault starting with the transit secrets engine, adopting NIST ML-KEM/ML-DSA/SLH-DSA and hybrid schemes as Go/standards support matures
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA; FN-DSA
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Vault transit secrets engine
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: Yes; HashiCorp plans to research and build support for hybrid schemes that enable current and post-quantum cryptography algorithms to coexist.
- **Current GA Status**: Planned
- **Customer Action Required**: Take immediate steps to reduce security risks; develop a plan for learning and implementing quantum-safe solutions; stay informed on evolving best practices; perform impact analysis; institute a PQC readiness program; prioritize and assess high-risk assets; discover and inventory cryptographic usage; enforce zero trust security; create a migration plan; establish ongoing governance.
- **Key Commitments & Quotes**: "HashiCorp plans to develop and deliver quantum and hybrid PQC solutions in a staged manner, starting with PQC support in the Vault transit secrets engine."
- **Coverage Verification**: CONSISTENT; The document explicitly confirms the staged rollout in Vault transit secrets engine, adoption of the three NIST algorithms, hybrid schemes, and dependency on Go/standards maturity without firm dates.
- **Extraction Quality**: HIGH
- **Source Document**: VND-058_HashiCorp_Inc..html (274.8 KB)
- **Extraction Timestamp**: 2026-07-30T21:04:24

## VND-059 — Venafi Inc.

- **Vendor ID**: VND-059
- **Vendor Name**: Venafi Inc.
- **Roadmap Title**: Venafi/CyberArk: Experimental PQC Support (TLS + CodeSign Protect, TPP 24.3)
- **Roadmap URL**: https://docs.venafi.com/Docs/24.3/TopNav/Content/CodeSigning/t-codesigning-pqc.php
- **Publish Date**: 2025-07-01
- **Local File**: public/vendor-roadmaps/VND-059_Venafi_Inc..html
- **CSV Coverage Notes**: Venafi/CyberArk Trust Protection Platform 24.3 provides experimental PQC support: ML-DSA and SLH-DSA in CodeSign Protect (with libhsm/PKCS#11), and Falcon limited to TLS certificates in TLS Protect. Marked experimental to aid PQC migration planning. Doc topic updated 01 Jul 2025. | Milestone: Experimental PQC support in Trust Protection Platform 24.3 — ML-DSA & SLH-DSA in CodeSign Protect, Falcon for TLS certificates
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: ML-DSA; SLH-DSA; Falcon
- **Target Migration Dates**: None detected
- **Products / Services Covered**: CodeSign Protect; TLS Protect; Trust Protection Platform
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: No
- **Current GA Status**: Experimental
- **Customer Action Required**: Contact Venafi for activation instructions; set up self-signed CA template; create Key Pair environment template; create Key Pair environment
- **Key Commitments & Quotes**: "Venafi is adding experimental support for post-quantum cryptographic algorithms in CodeSign Protect"; "This feature it is experimental and is intended to help you start planning for future PQC migration"; "Experimental post-quantum signing key algorithms supported: ML-DSA; SLH-DSA; Falcon"
- **Coverage Verification**: CONSISTENT; The document confirms experimental support for ML-DSA and SLH-DSA in CodeSign Protect and Falcon for TLS certificates in TPP 24.3, matching the CSV notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-059_Venafi_Inc..html (47.3 KB)
- **Extraction Timestamp**: 2026-07-07T20:25:33

## VND-060 — Okta Inc.

- **Vendor ID**: VND-060
- **Vendor Name**: Okta Inc.
- **Roadmap Title**: Okta Ventures: PQC as Strategic Focus Area
- **Roadmap URL**: https://www.okta.com/blog/customers-and-partners/okta-ventures-request-for-builders-five-key-focus-areas-in-identity-and-security/
- **Publish Date**: 2025-04-01
- **Local File**: public/vendor-roadmaps/VND-060_Okta_Inc..html
- **CSV Coverage Notes**: Okta's only public PQC-related statement is via Okta Ventures' 'Request for Builders' (Apr 1, 2025), naming post-quantum cryptography as one of five identity/security investment focus areas. This is advisory/investment-oriented, not an Okta product roadmap; no concrete Okta product PQC milestones or dates published. | Milestone: No concrete Okta product PQC milestone; PQC named as an Okta Ventures investment focus area only
- **Roadmap Scope**: No PQC content
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: None detected
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: No
- **Current GA Status**: No PQC
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: None detected
- **Coverage Verification**: MISMATCH; The document text provided is truncated and does not contain the section naming post-quantum cryptography as a focus area, thus it does not confirm the CSV notes.
- **Extraction Quality**: LOW
- **Source Document**: VND-060_Okta_Inc..html (277.6 KB)
- **Extraction Timestamp**: 2026-07-07T20:26:37

## VND-064 — Internet Security Research Group

- **Vendor ID**: VND-064
- **Vendor Name**: Internet Security Research Group
- **Roadmap Title**: A Post-Quantum Future for Let's Encrypt
- **Roadmap URL**: https://letsencrypt.org/2026/06/03/pq-certs
- **Publish Date**: 2026-06-03
- **Local File**: public/vendor-roadmaps/VND-064_Internet_Security_Research_Group.html
- **CSV Coverage Notes**: Official Let's Encrypt (ISRG) post laying out their post-quantum Web PKI plan. They have chosen Merkle Tree Certificates (MTCs) as the route to quantum-safe certificates, batching a post-quantum signature across many certificates to keep TLS handshakes small. Cites CNSA 2.0 (2030-2035), NIST RSA-2048/P-256 deprecation after 2030, and the EU coordinated roadmap as drivers. Participating in IETF PLANTS/ACME working groups; tracking ML-DSA in X.509/TLS. | Milestone: Targeting a staging environment issuing MTCs in late 2026 and production-ready MTC issuance in 2027; nothing changes for existing ce
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: ML-DSA; ML-KEM
- **Target Migration Dates**: Staging environment issuing MTCs in late 2026; production-ready MTC issuance in 2027
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: CNSA 2.0; NIST draft transition guidance; EU coordinated roadmap
- **Hybrid Mode Support**: Yes; recommends hybrid post-quantum key exchange (X25519MLKEM768) for servers
- **Current GA Status**: Planned
- **Customer Action Required**: Ensure servers support hybrid post-quantum key exchange (X25519MLKEM768); track PLANTS working group and mtcs@chromium.org mailing list if maintaining ACME clients
- **Key Commitments & Quotes**: "Let's Encrypt is committed to a post-quantum-safe Web PKI."; "We are targeting late 2026 for a staging environment that issues MTCs, and 2027 for a production-ready environment."; "When post-quantum certificates become available from Let's Encrypt, they will arrive the way our service always has: free, automated, and available to anyone with an ACME client."
- **Coverage Verification**: CONSISTENT; The document confirms the MTC strategy, CNSA 2.0/NIST/EU drivers, IETF participation, and the 2026/2027 milestones exactly as described in the notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-064_Internet_Security_Research_Group.html (36.5 KB)
- **Extraction Timestamp**: 2026-07-07T20:31:25

## VND-085 — Cosmian SAS

- **Vendor ID**: VND-085
- **Vendor Name**: Cosmian SAS
- **Roadmap Title**: Cosmian: Post-Quantum Encryption Libraries
- **Roadmap URL**: https://cosmian.com
- **Publish Date**: 2026-07-13
- **Local File**: vendor-roadmaps/VND-085_Cosmian_SAS.html
- **CSV Coverage Notes**: None
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Cosmian findex; Cosmian covercrypt
- **Compliance Frameworks**: ETSI
- **Hybrid Mode Support**: None detected
- **Current GA Status**: GA
- **Customer Action Required**: Book a Demo with our team today
- **Key Commitments & Quotes**: "Advanced, post-quantum encryption librairies"; "Cosmian covercrypt achieves ETSI standardization for data protection in the post-quantum era"
- **Coverage Verification**: CONSISTENT — The document is a general marketing overview rather than a technical roadmap, so the lack of specific coverage details in the notes is consistent with the text.
- **Extraction Quality**: LOW
- **Source Document**: VND-085_Cosmian_SAS.html (335.3 KB)
- **Extraction Timestamp**: 2026-07-12T21:05:37

## VND-089 — BTQ Technologies Corp.

- **Vendor ID**: VND-089
- **Vendor Name**: BTQ Technologies Corp.
- **Roadmap Title**: 2025 Year-End Letter to Shareholders
- **Roadmap URL**: https://www.btq.com/blog/2025-year-end-letter-to-shareholders
- **Publish Date**: 2025-12-29
- **Local File**: public/vendor-roadmaps/VND-089_BTQ_Technologies_Corp..html
- **CSV Coverage Notes**: BTQ's strategic full-stack post-quantum roadmap built on three pillars: Quantum Secure Systems & Networks (incl. QSSN stablecoin settlement and Bitcoin Quantum), QCIM hardware acceleration / secure elements, and QPerfect neutral-atom platforms. Aims to enable PQC transition without disrupting existing infrastructure. | Milestone: 2025: first NIST-standard PQC signature verification demonstrated on Solana (with Bonsol Labs). 2026 targets: deliver QCIM test silicon to customers, expand QSSN from PoC to regulator-aligned deployments, and advance Bitcoin Quantum toward public testnet/mainnet/enter
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: ML-DSA
- **Target Migration Dates**: None detected
- **Products / Services Covered**: QCIM secure element platform; Quantum Secure Stablecoin Network (QSSN); Bitcoin Quantum Core; QPerfect MIMIQ emulator; Quantum Logical Unit (QLU)
- **Compliance Frameworks**: FIPS 203/204/205; CNSA 2.0; NIST
- **Hybrid Mode Support**: No
- **Current GA Status**: Beta
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "crypto agile support for FIPS 203/204/205 and CNSA 2.0"; "first implementation of NIST standard PQC signature verification on Solana"; "demonstrating end to end Bitcoin operations using NIST standardized ML DSA signatures"
- **Coverage Verification**: CONSISTENT; The document confirms the three pillars (QSSN, QCIM, QPerfect), the Solana milestone with Bonsol Labs, and the Bitcoin Quantum work, though specific 2026 targets are not explicitly detailed in the text.
- **Extraction Quality**: HIGH
- **Source Document**: VND-089_BTQ_Technologies_Corp..html (172.7 KB)
- **Extraction Timestamp**: 2026-07-07T20:30:24

## VND-092 — Algorand Foundation

- **Vendor ID**: VND-092
- **Vendor Name**: Algorand Foundation
- **Roadmap Title**: Algorand Post-Quantum Cryptography Roadmap
- **Roadmap URL**: https://algorand.co/blog/algorand-post-quantum-cryptography-roadmap
- **Publish Date**: 2026-07-17
- **Local File**: vendor-roadmaps/VND-092_Algorand_Foundation.html
- **CSV Coverage Notes**: None
- **PQC Algorithms Announced**: Falcon-1024; Falcon-512; FN-DSA; ML-DSA
- **Target Migration Dates**: Native post-quantum accounts in Q3 2026; Native Falcon-512 support by year’s end 2026; Native multisig support for multi-cryptography schemes by end of 2026; Broad quantum resilience by 2027
- **Products / Services Covered**: Algorand protocol; Algorand Virtual Machine (AVM); Pera Wallet; AlgoKit; Trezor Safe 5
- **Compliance Frameworks**: NIST; BIP39; BIP32; BIP44
- **Hybrid Mode Support**: Yes, the document states Algorand will operate under a hybrid model for consensus messages using both Ed25519 and Falcon signatures, and supports hybrid accounts merging ECC-based and lattice-based keys.
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Native support for post-quantum accounts will be introduced in the Q3 2026 protocol release."; "Algorand will operate under a hybrid model for a while, where both Ed25519 and Falcon signatures will be used for consensus messages."; "Targets Broad Quantum Resilience by 2027"
- **Coverage Verification**: CONSISTENT, the document provides a detailed roadmap for PQC implementation on the Algorand protocol, which aligns with the lack of specific CSV coverage notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-092_Algorand_Foundation.html (191.2 KB)
- **Extraction Timestamp**: 2026-07-17T11:50:23

## VND-112 — Metaco / Ripple

- **Vendor ID**: VND-112
- **Vendor Name**: Metaco / Ripple
- **Roadmap Title**: Post-Quantum Readiness on the XRP Ledger
- **Roadmap URL**: https://ripple.com/insights/post-quantum-readiness-on-the-xrp-ledger/
- **Publish Date**: 2026-04-20
- **Local File**: public/vendor-roadmaps/VND-112_Metaco_Ripple.html
- **CSV Coverage Notes**: Ripple's official PQC roadmap (Apr 20, 2026) lays out a four-phase XRPL plan: (1) ongoing Q-Day readiness/contingency planning, (2) proactive planning & experimentation in H1 2026, (3) exploration of post-quantum primitives in H2 2026, (4) full transition to PQ signatures targeting 2028. Includes custody prototype work with Project Eleven and quantum-safe signature research. No Metaco-branded PQC roadmap; Ripple is the parent/relevant source. | Milestone: Full transition to post-quantum signatures on the XRP Ledger targeting 2028; PQ primitive exploration in H2 2026
- **Roadmap Scope**: Single product
- **PQC Algorithms Announced**: ML-DSA
- **Target Migration Dates**: Full transition to PQC-based signatures targeting 2028
- **Products / Services Covered**: XRP Ledger (XRPL)
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: Yes; hybrid post-quantum signing implementation
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "target for full readiness by 2028"; "targeting full transition no later than 2028"; "integrating candidate post-quantum signature schemes alongside existing elliptic curve signatures"
- **Coverage Verification**: CONSISTENT; The document explicitly details the four-phase roadmap, H1/H2 2026 activities, 2028 target, and Project Eleven collaboration as described in the notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-112_Metaco_Ripple.html (138.6 KB)
- **Extraction Timestamp**: 2026-07-07T20:26:37

## VND-114 — 1Password Inc.

- **Vendor ID**: VND-114
- **Vendor Name**: 1Password Inc.
- **Roadmap Title**: A first step toward post-quantum security
- **Roadmap URL**: https://1password.com/blog/post-quantum-cryptography
- **Publish Date**: 2026-03-31
- **Local File**: public/vendor-roadmaps/VND-114_1Password_Inc..html
- **CSV Coverage Notes**: Official 1Password blog announcing the first phase of a broader, sequential post-quantum roadmap. Risk-prioritized approach targeting parts of the architecture most exposed to harvest-now-decrypt-later attacks, starting with internet-facing web traffic, with future phases extending PQC across products. | Milestone: Deployed hybrid post-quantum key exchange (X25519MLKEM768) for all 1Password web application TLS connections; data protected today on PQC-capable browsers (Chrome, Firefox). Phase 1 of broader roadmap complete.
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: ML-KEM
- **Target Migration Dates**: None detected
- **Products / Services Covered**: 1Password web application
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: Yes; hybrid post-quantum key exchange (X25519MLKEM768)
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "This is the first step in our long-term plan to protect customer data and withstand harvest-now, decrypt-later attacks."
- **Coverage Verification**: CONSISTENT; The document confirms the deployment of X25519MLKEM768 for web application TLS, the focus on internet-facing traffic to mitigate HNDL attacks, and describes this as the first phase of a broader roadmap.
- **Extraction Quality**: HIGH
- **Source Document**: VND-114_1Password_Inc..html (164.4 KB)
- **Extraction Timestamp**: 2026-07-07T20:37:20

## VND-116 — Signal Foundation

- **Vendor ID**: VND-116
- **Vendor Name**: Signal Foundation
- **Roadmap Title**: Signal PQXDH: Post-Quantum Key Agreement
- **Roadmap URL**: https://signal.org/blog/pqxdh/
- **Publish Date**: 2023-09-19
- **Local File**: public/vendor-roadmaps/VND-116_Signal_Foundation.html
- **CSV Coverage Notes**: Signal app PQXDH protocol combines X25519 ECDH with CRYSTALS-Kyber (ML-KEM) for quantum-resistant initial key agreement; implemented in libsignal and live in client apps. Subsequent SPQR (Sparse Post-Quantum Ratchet) work extends PQC beyond the handshake. | Milestone: PQXDH (X25519 + CRYSTALS-Kyber/ML-KEM hybrid) shipped in Signal clients and libsignal; default for new chats with plan to phase out classic X3DH. Follow-on SPQR/Triple Ratchet work extends PQC to the ongoing ratchet.
- **Roadmap Scope**: Single product
- **PQC Algorithms Announced**: CRYSTALS-Kyber
- **Target Migration Dates**: In the coming months (after sufficient time has passed for everyone using Signal to update)
- **Products / Services Covered**: Signal’s client applications; libsignal
- **Compliance Frameworks**: NIST Standardization Process for Post-Quantum Cryptography
- **Hybrid Mode Support**: Yes; combining X25519 and CRYSTALS-Kyber
- **Current GA Status**: GA
- **Customer Action Required**: Update to the latest Signal software
- **Key Commitments & Quotes**: "we will disable X3DH for new chats and require PQXDH for all new chats"; "Our new protocol is already supported in the latest versions of Signal’s client applications"
- **Coverage Verification**: PARTIAL; The document confirms PQXDH, Kyber, and client implementation, but does not mention SPQR or the Triple Ratchet extension.
- **Extraction Quality**: HIGH
- **Source Document**: VND-116_Signal_Foundation.html (19.7 KB)
- **Extraction Timestamp**: 2026-07-07T20:26:37

## VND-118 — Meta Platforms Inc.

- **Vendor ID**: VND-118
- **Vendor Name**: Meta Platforms Inc.
- **Roadmap Title**: Post-Quantum Cryptography Migration at Meta: Framework, Lessons, and Takeaways
- **Roadmap URL**: https://engineering.fb.com/2026/04/16/security/post-quantum-cryptography-migration-at-meta-framework-lessons-and-takeaways/
- **Publish Date**: 2026-04-16
- **Local File**: public/vendor-roadmaps/VND-118_Meta_Platforms_Inc..html
- **CSV Coverage Notes**: Official Meta Engineering blog laying out Meta's PQC migration framework: five PQC Migration Maturity Levels (PQ-Unaware through PQ-Enabled) and a six-step strategy (prioritize risks, inventory crypto assets, address external dependencies, design PQC components, implement guardrails, integrate PQC components). Uses NIST ML-KEM768 and ML-DSA65, prefers hybrid deployment; Meta co-authored HQC as a fallback algorithm. Described as multi-year phased work. | Milestone: Begun deploying post-quantum protections across significant portions of internal traffic using hybrid X25519/ML-KEM768; recommends
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; HQC; BIKE; Classical McEliece
- **Target Migration Dates**: Multi-year process; target timeframes including 2030
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: NIST FIPS 203; NIST FIPS 204; NIST FIPS 205; IETF RFCs; ISO PQC standard
- **Hybrid Mode Support**: Yes; hybrid X25519/ML-KEM768
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "we have already begun deploying and rolling out post-quantum encryption across our internal infrastructure over a multi-year process"; "Meta cryptographers are co-authors of HQC"; "we have begun deploying PQ protections across significant portions of our internal traffic"
- **Coverage Verification**: CONSISTENT; The document confirms the five maturity levels, six-step strategy, HQC co-authorship, multi-year timeline, and internal deployment of hybrid protections, though specific algorithm parameters (ML-KEM768/ML-DSA65) are not explicitly detailed in the provided text.
- **Extraction Quality**: HIGH
- **Source Document**: VND-118_Meta_Platforms_Inc..html (121.9 KB)
- **Extraction Timestamp**: 2026-07-07T20:40:10

## VND-119 — Mullvad VPN AB

- **Vendor ID**: VND-119
- **Vendor Name**: Mullvad VPN AB
- **Roadmap Title**: Introducing a post-quantum VPN, Mullvad's strategy for a future problem
- **Roadmap URL**: https://mullvad.net/en/blog/introducing-post-quantum-vpn-mullvads-strategy-future-problem
- **Publish Date**: 2017-12-08
- **Local File**: public/vendor-roadmaps/VND-119_Mullvad_VPN_AB.html
- **CSV Coverage Notes**: Mullvad published an explicit post-quantum strategy: a conservative multi-algorithm key exchange combining at least three algorithms based on different math problems so traffic stays safe if at least one is PQ-secure. Began with New Hope (2017), moved to NIST finalists (Classic McEliece + Kyber/ML-KEM, 2022), stabilized in desktop app v2023.3, and extended PQ-safe WireGuard tunnels across all platforms (Linux, Windows, macOS, Android, iOS). Strategy is tracked through follow-up blog posts. | Milestone: Quantum-resistant (Classic McEliece + ML-KEM) WireGuard tunnels available and stabilized acr
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: New Hope; SIDH
- **Target Migration Dates**: None detected
- **Products / Services Covered**: WireGuard protocol on Linux
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: Yes; key exchange uses at least three different algorithms
- **Current GA Status**: Beta
- **Customer Action Required**: Install WireGuard, download and run the post-quantum setup script, and activate the tunnel
- **Key Commitments & Quotes**: "Our ambition is to develop a key exchange that uses at least three different algorithms, each based on a different math problem."
- **Coverage Verification**: PARTIAL; The document confirms the 2017 New Hope beta and multi-algorithm strategy but does not mention the 2022/2023 updates, Classic McEliece, ML-KEM, or cross-platform availability.
- **Extraction Quality**: HIGH
- **Source Document**: VND-119_Mullvad_VPN_AB.html (50.7 KB)
- **Extraction Timestamp**: 2026-07-07T20:40:10

## VND-127 — Broadcom Inc.

- **Vendor ID**: VND-127
- **Vendor Name**: Broadcom Inc.
- **Roadmap Title**: VMware Cloud Foundation Post-Quantum Readiness
- **Roadmap URL**: https://blogs.vmware.com/cloud-foundation/2026/04/28/post-quantum-readiness-on-vcf/
- **Publish Date**: 2026-04-28
- **Local File**: public/vendor-roadmaps/VND-127_Broadcom_Inc..html
- **CSV Coverage Notes**: VMware Cloud Foundation - vSAN/VM/vMotion AES-256 data-at-rest; Avi (NSX ALB) hybrid PQC TLS key exchange live; CNSA 2.0-aligned rollout with full transition by 2035; FIPS-gated ML-KEM/ML-DSA integration; CBOM/crypto-agility initiative. | Milestone: Broadcom commits VCF to CNSA 2.0 timelines with full quantum-resistant transition by 2035. Today VCF uses AES-256 for vSAN/VM/vMotion encryption; Avi Load Balancer already supports hybrid PQC key exchange in TLS. Broader PQC adoption gated on FIPS-certified libraries (FIPS 206 expected late 2026/early 2027) and TPM 2.0 v185 ML-KEM/ML-DSA support.
- **Roadmap Scope**: Single product
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA
- **Target Migration Dates**: Full transition to quantum-resistant algorithms by 2035; deprecating RSA-2048 by 2030; disallowing by 2035
- **Products / Services Covered**: VMware Cloud Foundation; VMware Avi Load Balancer; VMware vSAN; VMware vCenter; VMware vSphere
- **Compliance Frameworks**: CNSA 2.0; NIST IR 8547; FIPS 206; TPM 2.0 v185; X.509
- **Hybrid Mode Support**: Yes; hybrid post-quantum key exchange in TLS and hybrid signing for code integrity
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Broadcom is committed to adopting PQC-resistant algorithms and methods for VCF on the timelines mandated by the NSA through CNSA 2.0, with full transition to quantum-resistant algorithms required by 2035."
- **Coverage Verification**: CONSISTENT; The document explicitly confirms AES-256 usage for vSAN/VM/vMotion, live hybrid PQC TLS in Avi, CNSA 2.0 alignment with a 2035 deadline, FIPS gating for ML-KEM/ML-DSA, and the CBOM initiative.
- **Extraction Quality**: HIGH
- **Source Document**: VND-127_Broadcom_Inc..html (96.6 KB)
- **Extraction Timestamp**: 2026-07-07T20:26:37

## VND-139 — Qrypt Inc.

- **Vendor ID**: VND-139
- **Vendor Name**: Qrypt Inc.
- **Roadmap Title**: Qrypt: Post-Quantum Secure VPN for NVIDIA Jetson
- **Roadmap URL**: https://www.qrypt.com/resources/post-quantum-secure-vpn/
- **Publish Date**: 2026-07-13
- **Local File**: vendor-roadmaps/VND-139_Qrypt_Inc.html
- **CSV Coverage Notes**: None
- **PQC Algorithms Announced**: ML-KEM; Kyber
- **Target Migration Dates**: February 2026 (Jetson Thor support)
- **Products / Services Covered**: Qrypt BLAST; Quantum-Secure IPsec Gateway; Qrypt SDK
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: Yes; Hybrid PQC IPsec setup using ML-KEM + DH + BLAST
- **Current GA Status**: GA
- **Customer Action Required**: Register for a free Qrypt API token; Clone GitHub repository; Follow Quick Start instructions; Contact team for enterprise features
- **Key Commitments & Quotes**: "Implementing Hybrid PQC IPsec with Qrypt BLAST on Jetson Orin"; "Works on Jetson Orin today, Jetson Thor in February 2026"; "926 Mbps VPN throughput with hybrid PQC key exchange"
- **Coverage Verification**: CONSISTENT; The document details the specific roadmap item (PQC VPN for Jetson) without contradicting the unspecified CSV notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-139_Qrypt_Inc.html (258.6 KB)
- **Extraction Timestamp**: 2026-07-12T21:06:01

## VND-140 — Forward Edge-AI Inc.

- **Vendor ID**: VND-140
- **Vendor Name**: Forward Edge-AI Inc.
- **Roadmap Title**: Global PQC Readiness – ForwardEdge AI (12-month Implementation Playbook)
- **Roadmap URL**: https://www.forwardedge.ai/pages/isidore-pqc-readiness
- **Publish Date**: 2026-03-13
- **Local File**: public/vendor-roadmaps/VND-140_Forward_Edge-AI_Inc..html
- **CSV Coverage Notes**: (2026-07-01: page loads and matches title/content, but the full playbook is gated behind a password prompt -- flagging in case the gate tightens further.)
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: 12-month roadmap; phases 0–3 months to Month 12 onward
- **Products / Services Covered**: Isidore Quantum; Cassian
- **Compliance Frameworks**: Singapore's QRI; CSA 2025; NIST PQC standards
- **Hybrid Mode Support**: No
- **Current GA Status**: No PQC
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "PQC Readiness provides a structured, twelve-month roadmap that guides governments and enterprises through seven phases of PQC adoption."
- **Coverage Verification**: CONSISTENT; The document text matches the title and content described, and the password prompt confirms the gating noted in the CSV.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-140_Forward_Edge-AI_Inc..html (321.2 KB)
- **Extraction Timestamp**: 2026-07-07T20:39:09

## VND-146 — Robust Intelligence (Cisco AI Defense)

- **Vendor ID**: VND-146
- **Vendor Name**: Robust Intelligence (Cisco AI Defense)
- **Roadmap Title**: Cisco Post-Quantum Cryptography (Trust Center)
- **Roadmap URL**: https://www.cisco.com/site/us/en/about/trust-center/post-quantum-cryptography.html
- **Publish Date**: 2026-02-01
- **Local File**: vendor-roadmaps/VND-146_Robust_Intelligence_Cisco_AI_Defense_.html
- **CSV Coverage Notes**: Robust Intelligence is now part of Cisco (AI Defense / Foundation AI); it has no separate PQC roadmap and inherits Cisco's program. Cisco Quantum Resilience Framework (quantum-safe communications + quantum-safe products) targets quantum-safe communications across most core products by Dec 2026; IOS XE 26 full-stack PQC; ML-KEM/ML-DSA/SLH-DSA rollout 2026-2027. | Milestone: Cisco commits to quantum-safe communications across most of its core portfolio by December 2026 under its Quantum Resilience Framework. Network examples: FTD 10.5/ASA 9.25 (ML-KEM VPN) targeted late 2026; FTD/ASA 11.0 add ML
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: December 2026
- **Products / Services Covered**: None detected
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: None detected
- **Current GA Status**: Planned
- **Customer Action Required**: build awareness of the quantum threat, assess cryptographic exposure across systems and data flows, and prioritize sensitive data requiring long-term protection
- **Key Commitments & Quotes**: "Cisco is committed to delivering quantum-safe communications across the majority of Cisco’s core portfolio by December 2026"
- **Coverage Verification**: PARTIAL — The document confirms the Dec 2026 commitment and framework but does not mention Robust Intelligence, specific algorithms (ML-KEM/ML-DSA/SLH-DSA), or specific product versions (IOS XE 26, FTD 10.5/ASA 9.25) listed in the notes.
- **Extraction Quality**: LOW
- **Source Document**: VND-146_Robust_Intelligence_Cisco_AI_Defense_.html (87.6 KB)
- **Extraction Timestamp**: 2026-07-30T21:05:54

## VND-149 — Arm Ltd.

- **Vendor ID**: VND-149
- **Vendor Name**: Arm Ltd.
- **Roadmap Title**: Mbed TLS PQC plan (ML-DSA first (2026), ML-KEM later) — planned, not yet released
- **Roadmap URL**: https://lists.trustedfirmware.org/archives/list/mbed-tls@lists.trustedfirmware.org/thread/D73QWEQBW5LHMFMG35S3IPV62NTKR4SO/
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-149_Arm_Ltd..html
- **CSV Coverage Notes**: Arm-stewarded Mbed TLS: official roadmap plans ML-DSA initial support for 2026 CQ2, with ML-KEM listed under Future with no timeline; neither is in official releases yet; only LMS hash-based signatures supported today. Roadmap signal (no GA PQC). Supersedes prior "no public roadmap found". Re-validated 2026-06-19. (2026-07-01: local_file was empty despite downloadable=yes -- archiving this mailing-list thread now since it is community-hosted and content is explicitly in flux.) (2026-07-01 r1: algorithm order corrected per the official Mbed TLS roadmap (mbed-tls.readthedocs.io/en/latest/project/roadmap/): ML-DSA initial support 2026 CQ2; ML-KEM under Future, no timeline. Previous wording had ML-KEM first.)
- **Roadmap Scope**: Single product
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA; LMS
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Mbed TLS; TF-PSA-Crypto
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: No
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "We still haven't set a date for integrating PQC algorithms."
- **Coverage Verification**: MISMATCH; The document text (Jan 2025) states no date is set and work is blocked until 2025Q3, whereas the CSV notes claim a specific 2026 CQ2 roadmap exists.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-149_Arm_Ltd..html (45.1 KB)
- **Extraction Timestamp**: 2026-07-07T20:27:41

## VND-151 — Microchip Technology Inc.

- **Vendor ID**: VND-151
- **Vendor Name**: Microchip Technology Inc.
- **Roadmap Title**: Microchip Technology Post-Quantum Cryptography (PQC)
- **Roadmap URL**: https://www.microchip.com/en-us/solutions/technologies/embedded-security/post-quantum-cryptography
- **Publish Date**: 2026-04-28
- **Local File**: public/vendor-roadmaps/VND-151_Microchip_Technology_Inc..html
- **CSV Coverage Notes**: Trust Shield PQC-ready portfolio: TS1800 Platform Root of Trust, TS500/TS501 secure boot controllers with hybrid PQC + classical firmware authentication (NIST SP 800-193 PFR, rollback protection, crisis recovery); x86 and Arm Cortex compatible; secure provisioning and crypto-agile architectures for CNSA 2.0 compliance. | Milestone: Microchip expanded its PQC-ready Trust Shield root-of-trust family (announced 2026-04-28): TS1800 Platform Root of Trust and TS50x secure boot controllers (TS500 in-line SoC-to-SPI-Flash, TS501 with integrated SPI Flash) using hybrid PQC + classical signature verifi
- **Roadmap Scope**: No PQC content
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: None detected
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: No
- **Current GA Status**: No PQC
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: None detected
- **Coverage Verification**: MISMATCH; The provided document text is a generic website navigation menu and does not contain the specific PQC roadmap details, product names, or milestones listed in the CSV Coverage Notes.
- **Extraction Quality**: LOW
- **Source Document**: VND-151_Microchip_Technology_Inc..html (693.7 KB)
- **Extraction Timestamp**: 2026-07-07T20:27:41

## VND-152 — Adtran Networks SE (formerly ADVA)

- **Vendor ID**: VND-152
- **Vendor Name**: Adtran Networks SE (formerly ADVA)
- **Roadmap Title**: Quantum-Safe Communications | Adtran
- **Roadmap URL**: https://www.adtran.com/en/solutions/quantum-safe-communications
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-152_Adtran_Networks_SE_formerly_ADVA_.html
- **CSV Coverage Notes**: (2026-07-01: no true publish date discoverable on-page or via Wayback -- left publish_date blank rather than fabricate one.)
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: FSP 150 platforms; ALM fiber monitoring; Security Director
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: No
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Adtran addresses this challenge with a defense-in-depth approach that combines multi-layer, post-quantum-ready encryption"; "Quantum‑safe Multi‑layer protection of long-lived data using standards-aligned post-quantum cryptography."
- **Coverage Verification**: CONSISTENT; The document is a high-level strategy page without a specific publish date, consistent with the notes.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-152_Adtran_Networks_SE_formerly_ADVA_.html (138.9 KB)
- **Extraction Timestamp**: 2026-07-07T20:32:32

## VND-154 — Ericsson AB

- **Vendor ID**: VND-154
- **Vendor Name**: Ericsson AB
- **Roadmap Title**: Quantum-safe networks explained
- **Roadmap URL**: https://www.ericsson.com/en/security/quantum-safe-networks
- **Publish Date**: 2025
- **Local File**: public/vendor-roadmaps/VND-154_Ericsson_AB.html
- **CSV Coverage Notes**: Official Ericsson strategy page for transitioning telecom networks to quantum-resistant cryptography, referencing NIST ML-KEM/ML-DSA/SLH-DSA, NSA CNSA 2.0, and standardization work in 3GPP, IETF, GSMA. Lays out a phased migration: PQC likely introduced in 5G releases 20/21, with 6G (release 21) quantum-resistant from the start. | Milestone: PQC expected to be introduced in 5G era (3GPP releases 20/21) and 6G fully quantum-resistant from the start (~release 21), aligned with NSA 2030 phase-out guidance.
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA
- **Target Migration Dates**: PQC likely introduced in 5G releases 20/21; 6G fully quantum-resistant from the start
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: NIST; IETF; 3GPP
- **Hybrid Mode Support**: No
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "In 3GPP, post-quantum cryptography will likely be introduced already in the 5G era as part of upcoming releases 20 and/or 21."
- **Coverage Verification**: PARTIAL; The document confirms the 3GPP timeline and NIST algorithm references but does not explicitly mention NSA CNSA 2.0 or GSMA in the provided text.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-154_Ericsson_AB.html (290.9 KB)
- **Extraction Timestamp**: 2026-07-07T20:38:19

## VND-155 — Nokia Corporation

- **Vendor ID**: VND-155
- **Vendor Name**: Nokia Corporation
- **Roadmap Title**: Quantum-safe networks
- **Roadmap URL**: https://www.nokia.com/industries/quantum-safe-networks/
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-155_Nokia_Corporation.html
- **CSV Coverage Notes**: Nokia publishes a Quantum Safe Network (QSN) strategy and the white paper 'The road to quantum-safe networks' (nokia.com/asset/i/214685/), advocating a pragmatic, layered defense-in-depth roadmap that bundles PQC, Symmetric Key Infrastructure (SKI), and QKD into a hybrid, crypto-agile migration. Nokia is engaging NIST on building blocks and its optical networking was first in industry to achieve FIPS 140-3 Security Level 2 validation. Supporting strategy blog 'Get ahead of the quantum threat with a quantum-safe network strategy' (returned 403 to automated fetch but confirmed live via Nokia-sou
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: Yes; bundles PQC, Symmetric Key Infrastructure (SKI), and QKD into a hybrid approach
- **Current GA Status**: No PQC
- **Customer Action Required**: Begin choosing quantum-safe networking technology as they architect their digital transformation
- **Key Commitments & Quotes**: "Quantum-safe networks use quantum-safe cryptography that are secure even in the presence of powerful quantum computers."
- **Coverage Verification**: PARTIAL; The document confirms the QSN strategy, defense-in-depth approach, and bundling of PQC/SKI/QKD, but does not mention the specific white paper title, NIST engagement, or FIPS 140-3 validation.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-155_Nokia_Corporation.html (308.5 KB)
- **Extraction Timestamp**: 2026-07-07T20:33:35

## VND-157 — ID Quantique SA

- **Vendor ID**: VND-157
- **Vendor Name**: ID Quantique SA
- **Roadmap Title**: Migrating to quantum-safe infrastructure
- **Roadmap URL**: https://www.idquantique.com/quantum-safe-security/migrating-to-quantum-safe-infrastructure/
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-157_ID_Quantique_SA.html
- **CSV Coverage Notes**: ID Quantique publishes a quantum-safe migration strategy laying out a defense-in-depth, hybrid approach that combines PQC (software, deployable now), QKD (hardware/quantum-physics based), QRNG and Quantum Key Management (Q-KMS), with strong emphasis on cryptographic hybridization and crypto-agility to de-risk a migration that 'won't happen overnight' (decade-plus) against harvest-now-decrypt-later. Clarion KX is positioned as the platform for flexible QKD+PQC deployments. Strategic/positioning content rather than a dated milestone timeline, so classified as a migration strategy page. | Milesto
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Clarion KX
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: Yes; hybrid mode alongside classical ECC and RSA algorithms
- **Current GA Status**: No PQC
- **Customer Action Required**: Arrange a free consultation with one of our experts today
- **Key Commitments & Quotes**: "Implementing post-quantum cryptography won’t happen overnight"; "The journey to quantum safe infrastructure is likely to be long, complex and expensive"; "Embracing a hybrid cybersecurity model"
- **Coverage Verification**: CONSISTENT; The document confirms the defense-in-depth hybrid strategy, the decade-plus timeline, HNDL threat, and Clarion KX positioning as described in the notes.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-157_ID_Quantique_SA.html (375.0 KB)
- **Extraction Timestamp**: 2026-07-07T20:32:32

## VND-164 — Qualys Inc.

- **Vendor ID**: VND-164
- **Vendor Name**: Qualys Inc.
- **Roadmap Title**: Qualys CertView/Platform: PQC Detection Support
- **Roadmap URL**: https://docs.qualys.com/en/certview/latest/assets_certificates/pqc_details.htm
- **Publish Date**: 2026-04-01
- **Local File**: public/vendor-roadmaps/VND-164_Qualys_Inc..html
- **CSV Coverage Notes**: Qualys provides PQC scanning/detection capability: QID 38994 reports server support for PQC (KEM) key-exchange algorithms; coverage spans VM, Certificate View, WAS, EASM and authenticated VM scans. Doc is current (April 2026 copyright). User documentation for an existing capability rather than a forward-looking roadmap; no specific algorithm names or future milestone dates listed. | Milestone: PQC key-exchange detection across VM, CertView, WAS, EASM and VM_AUTH scans via QID 38994 (reports whether a server supports PQC KEM key exchange).
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: VM, Certificate View, WAS, EASM, VM_AUTH
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: No
- **Current GA Status**: GA
- **Customer Action Required**: Include QID 38994 in option profile
- **Key Commitments & Quotes**: "QID 38994 reports whether the server supports the PQC key exchange algorithm."
- **Coverage Verification**: CONSISTENT; The document confirms QID 38994 usage and coverage across VM, Certificate View, WAS, EASM, and VM_AUTH scans.
- **Extraction Quality**: HIGH
- **Source Document**: VND-164_Qualys_Inc..html (56.4 KB)
- **Extraction Timestamp**: 2026-07-07T20:27:41

## VND-168 — Arqit Quantum Inc.

- **Vendor ID**: VND-168
- **Vendor Name**: Arqit Quantum Inc.
- **Roadmap Title**: Arqit Quantum-Safe Security Approach
- **Roadmap URL**: https://arqitgroup.com/company/our-approach
- **Publish Date**: 2025-01-01
- **Local File**: vendor-roadmaps/VND-168_Arqit_Quantum_Inc..html
- **CSV Coverage Notes**: Arqit's quantum-safe approach centers on the SKA Platform (Symmetric Key Agreement) delivering quantum-safe key agreement with perfect forward secrecy; products: PQC Migration / Encryption Intelligence (crypto discovery), SKA Edge & Central Controllers, NetworkSecure. FIPS 140-3 validated, hybrid/crypto-agile, supports symmetric-only provisioning. Formally verified (Tamarin, Univ. of Surrey). Recent 2024-2025 industry awards. | Milestone: FIPS 140-3 validated Symmetric Key Agreement (SKA) Platform with hybrid crypto-agility; software-only SKA Edge/Central Controllers plus NetworkSecure and PQC
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: SKA-Platform; SKA Edge; Central Controllers; NetworkSecure; PQC Migration; Encryption Intelligence
- **Compliance Frameworks**: FIPS 140-3
- **Hybrid Mode Support**: Yes; "Our standards-based hybrid approach maximizes compatibility, offers cryptoagility, and minimizes risk"
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Arqit’s protocols have been formally validated using the Tamarin prover method by the Surrey Centre for Cyber Security"; "We don’t rely on public/private keys and we operate with zero-trust principles"; "Arqit’s use of PQAs is limited to initial provisioning and customers can opt for symmetric-only provisioning"
- **Coverage Verification**: PARTIAL; The document confirms SKA, FIPS 140-3, Tamarin verification, and hybrid/crypto-agile support, but does not explicitly name "SKA Edge," "Central Controllers," "NetworkSecure," "PQC Migration," or "Encryption Intelligence" as distinct product names, nor does it mention recent 2024-2025 awards.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-168_Arqit_Quantum_Inc..html (90.3 KB)
- **Extraction Timestamp**: 2026-07-30T21:06:48

## VND-169 — Cryptomathic A/S

- **Vendor ID**: VND-169
- **Vendor Name**: Cryptomathic A/S
- **Roadmap Title**: A Banker's Guide to Quantum Safe Cryptography - Part 3: Roadmap to PQC Migration for Financial Institutions
- **Roadmap URL**: https://www.cryptomathic.com/a-bankers-guide-to-quantum-safe-cryptography-part-3-roadmap-to-pqc-migration-for-financial-institutions-cryptomathic
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-169_Cryptomathic_A_S.html
- **CSV Coverage Notes**: Part 3 of Cryptomathic's three-part 'Banker's Guide to Quantum Safe Cryptography'. Lays out an explicit five-phase PQC migration roadmap with month-based timelines: Phase 1 (0-6mo) crypto inventory and governance; Phase 2 (3-12mo) centralized key management and deprecating SHA-1/1024-bit RSA/3DES; Phase 3 (9-18mo) hybrid classical-PQC pilots and HSM/library upgrades; Phase 4 (18-36mo) broad deployment prioritizing high-risk systems; Phase 5 (36mo+) legacy decommission and crypto agility. Aligned to DORA, NIS2, PCI DSS 4.0 and EU coordinated roadmap targets. | Milestone: Hybrid classical-PQC en
- **Roadmap Scope**: Algorithm/standard reference
- **PQC Algorithms Announced**: Kyber; Dilithium
- **Target Migration Dates**: None detected
- **Products / Services Covered**: None detected
- **Compliance Frameworks**: DORA; NIS2; PCI DSS 4.0; CNSA 2.0; NIST; ENISA
- **Hybrid Mode Support**: Yes; hybrid classical-PQC encryption schemes
- **Current GA Status**: No PQC
- **Customer Action Required**: Perform cryptographic inventory; establish governance; implement centralized key management; pilot hybrid cryptography; upgrade HSMs and libraries; decommission legacy crypto.
- **Key Commitments & Quotes**: None detected
- **Coverage Verification**: CONSISTENT; The document explicitly outlines the five-phase roadmap with the specified timelines and regulatory alignments as described in the notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-169_Cryptomathic_A_S.html (251.3 KB)
- **Extraction Timestamp**: 2026-07-07T20:37:20

## VND-171 — DocuSign

- **Vendor ID**: VND-171
- **Vendor Name**: DocuSign
- **Roadmap Title**: DocuSign: Post-Quantum-Kryptografie (Post-Quantum Cryptography, DE)
- **Roadmap URL**: https://www.docusign.com/de-de/blog/post-quanten-kryptografie
- **Publish Date**: 2026-02-25
- **Local File**: public/vendor-roadmaps/VND-171_DocuSign.html
- **CSV Coverage Notes**: DocuSign outlines a PQC strategy referencing ML-DSA (signatures), ML-KEM (key encapsulation) and SLH-DSA/SPHINCS+. Core approach is hybrid cryptography (RSA + ML-DSA) for crypto-agile, paced migration; three pillars: early planning, gradual hybrid transition, lifecycle protection of agreements. Note: English URL (/blog/post-quantum-cryptography) returns 404; canonical live page is the DE blog. | Milestone: Hybrid cryptography for e-signatures combining traditional algorithms (RSA) with PQC (ML-DSA), enabling phased migration; protecting agreements across full lifecycle against Harvest-Now-Decr
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: ML-DSA
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: NIST; Europäische Kommission
- **Hybrid Mode Support**: Yes; hybrid cryptography combining traditional algorithms (RSA) with PQC (ML-DSA)
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Docusign sichert digitale Vereinbarungen für die Quanten-Ära mit Post-Quanten-Kryptografie (PQC)."
- **Coverage Verification**: PARTIAL; The document confirms the ML-DSA hybrid strategy and three pillars, but does not explicitly mention ML-KEM or SLH-DSA/SPHINCS+ in the provided text.
- **Extraction Quality**: HIGH
- **Source Document**: VND-171_DocuSign.html (483.5 KB)
- **Extraction Timestamp**: 2026-07-07T20:28:31

## VND-173 — GlobalSign Ltd.

- **Vendor ID**: VND-173
- **Vendor Name**: GlobalSign Ltd.
- **Roadmap Title**: GlobalSign Post-Quantum Computing
- **Roadmap URL**: https://www.globalsign.com/en/post-quantum-computing
- **Publish Date**: 2025-01-01
- **Local File**: public/vendor-roadmaps/VND-173_GlobalSign_Ltd..html
- **CSV Coverage Notes**: GlobalSign's PQC plan: Dilithium3 (->ML-DSA-65) for Root/Intermediate CA hierarchy, with ML-DSA likely for TLS/X.509 leaf certs and Kyber (ML-KEM) for PQ-safe TLS handshakes; updating OCSP/CRL status checks to PQ-safe methods. Emphasis on crypto-agility and inventory now; no firm calendar dates given. | Milestone: Dilithium3 (to become ML-DSA-65 at FIPS finalization) used for Root/Intermediate CAs; planned ML-DSA option for TLS/X.509 leaf certs and Kyber/ML-KEM for PQ-safe TLS handshakes; PQ-safe OCSP/CRL.
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: Dilithium3; ML-DSA-65; Kyber; ML-KEM; Dilithium2
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: NIST; FIPS 203
- **Hybrid Mode Support**: No
- **Current GA Status**: Planned
- **Customer Action Required**: Have an inventory of your certificates and keys; Identify and address any vulnerabilities; Develop a plan to replace vulnerable certificates and keys quickly; Maintain up-to-date ownership information; Automate management
- **Key Commitments & Quotes**: "Currently dilithium3 is used for the Root and the Intermediate CA."; "Our dedicated team is actively involved in PQC research and development"; "these methods for communicating if certificates have been revoked will also need updating to use PQ-safe"
- **Coverage Verification**: CONSISTENT; The document confirms the use of Dilithium3 for Root/Intermediate CAs, the transition to ML-DSA-65, the use of Kyber for key exchange, and the need for PQ-safe OCSP/CRL, aligning with the notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-173_GlobalSign_Ltd..html (97.7 KB)
- **Extraction Timestamp**: 2026-07-07T20:28:31

## VND-178 — Ping Identity Holdings Corp.

- **Vendor ID**: VND-178
- **Vendor Name**: Ping Identity Holdings Corp.
- **Roadmap Title**: Ping Identity: Addressing the Quantum Threat in US Federal Government
- **Roadmap URL**: https://www.pingidentity.com/en/resources/blog/post/quantum-threat-us-fed-gov.html
- **Publish Date**: 2025-02-27
- **Local File**: public/vendor-roadmaps/VND-178_Ping_Identity_Holdings_Corp..html
- **CSV Coverage Notes**: Advisory blog (publ. 2025-02-27) covering NIST FIPS 203 (ML-KEM), 204 (ML-DSA), 205 (SLH-DSA) and the need for crypto-agility in IAM for federal buyers. Guidance/positioning piece - no specific Ping product PQC roadmap or dated milestones. | Milestone: No concrete product GA milestone; positions IAM around crypto-agility to transition to NIST FIPS 203 (ML-KEM), 204 (ML-DSA), 205 (SLH-DSA).
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: NIST FIPS 203; NIST FIPS 204; NIST FIPS 205; JOSE; COSE; IETF
- **Hybrid Mode Support**: No
- **Current GA Status**: No PQC
- **Customer Action Required**: Understand the Threat; Adopt PQC Standards; Partner with Experts
- **Key Commitments & Quotes**: "organizations will need to adopt critical security capabilities, including: ... Cryptographic Agility"
- **Coverage Verification**: CONSISTENT; The document is an advisory blog published on Feb 27, 2025, discussing NIST FIPS 203/204/205 and crypto-agility for IAM without naming specific product milestones.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-178_Ping_Identity_Holdings_Corp..html (61.4 KB)
- **Extraction Timestamp**: 2026-07-07T20:28:31

## VND-181 — Sectigo Ltd.

- **Vendor ID**: VND-181
- **Vendor Name**: Sectigo Ltd.
- **Roadmap Title**: Sectigo Certificate Manager: Private PQC (ML-DSA)
- **Roadmap URL**: https://www.sectigo.com/enterprise-solutions/certificate-manager/private-pqc
- **Publish Date**: 2026-04-14
- **Local File**: public/vendor-roadmaps/VND-181_Sectigo_Ltd..html
- **CSV Coverage Notes**: Sectigo Certificate Manager offers Private PQC: issue and manage private PQC certificates directly in SCM using supported ML-DSA algorithms (RFC 9881). Adoption guided by the Q.U.A.N.T. framework (Quantum exposure inventory, Uncover risk, Assess/strategize, Navigate implementation, Track/manage). References ~2030 quantum risk horizon. Page focuses on SCM Private PKI PQC; IoT/Code Signing PQC not detailed on this specific page. | Milestone: Private PQC in Sectigo Certificate Manager (SCM): issue/manage private PQC certificates using ML-DSA algorithms per RFC 9881; phased adoption via Q.U.A.N.T.
- **Roadmap Scope**: Single product
- **PQC Algorithms Announced**: ML-DSA
- **Target Migration Dates**: By 2030
- **Products / Services Covered**: Sectigo Certificate Manager (SCM)
- **Compliance Frameworks**: RFC 9881
- **Hybrid Mode Support**: Yes; hybrid certificates
- **Current GA Status**: Preview
- **Customer Action Required**: Request access in your SCM; Talk to us
- **Key Commitments & Quotes**: "Private PQC in Sectigo Certificate Manager"; "issue and manage private PQC certificates directly in SCM using supported ML-DSA algorithms"; "Sectigo’s Q.U.A.N.T. strategy for PQC readiness"
- **Coverage Verification**: CONSISTENT; The document confirms SCM Private PQC using ML-DSA, the Q.U.A.N.T. framework, and the 2030 risk horizon as stated in the notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-181_Sectigo_Ltd..html (408.1 KB)
- **Extraction Timestamp**: 2026-07-07T20:29:27

## VND-183 — Splunk Inc. (Cisco)

- **Vendor ID**: VND-183
- **Vendor Name**: Splunk Inc. (Cisco)
- **Roadmap Title**: Quantum-Safe Cryptography & Standards: QSC, PQC, QKD & More
- **Roadmap URL**: https://www.splunk.com/en_us/blog/learn/quantum-safe-cryptography-standards.html
- **Publish Date**: 2023-08-23
- **Local File**: public/vendor-roadmaps/VND-183_Splunk_Inc._Cisco_.html
- **CSV Coverage Notes**: Educational Splunk blog explaining quantum-safe cryptography terminology (QSC, PQC, QKD) and the NIST-selected algorithms CRYSTALS-Kyber, CRYSTALS-Dilithium, FALCON, SPHINCS+. Advises waiting for standardized, tested implementations. Contains NO Splunk-specific product roadmap, GA dates, or concrete migration commitments. As Splunk is now a Cisco company, product PQC direction tracks Cisco's crypto-agility roadmap. Best available official Splunk source on PQC. | Milestone: No Splunk product-level PQC milestone published; article is educational only. Splunk (acquired by Cisco) defers to Cisco's
- **Roadmap Scope**: Algorithm/standard reference
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA; HQC
- **Target Migration Dates**: None detected
- **Products / Services Covered**: None detected
- **Compliance Frameworks**: NIST SP 800-208
- **Hybrid Mode Support**: No
- **Current GA Status**: No PQC
- **Customer Action Required**: Audit systems; make asset inventory; plan lifecycle management; wait for standards
- **Key Commitments & Quotes**: None detected
- **Coverage Verification**: CONSISTENT; The document is an educational blog post explaining PQC terminology and NIST algorithms without any Splunk-specific product roadmap or migration commitments.
- **Extraction Quality**: LOW
- **Source Document**: VND-183_Splunk_Inc._Cisco_.html (29.1 KB)
- **Extraction Timestamp**: 2026-07-07T20:29:27

## VND-187 — Tuta GmbH

- **Vendor ID**: VND-187
- **Vendor Name**: Tuta GmbH
- **Roadmap Title**: Tuta Launches Post Quantum Cryptography For Email (TutaCrypt)
- **Roadmap URL**: https://tuta.com/blog/post-quantum-cryptography
- **Publish Date**: 2024-03-11
- **Local File**: public/vendor-roadmaps/VND-187_Tuta_GmbH.html
- **CSV Coverage Notes**: Tuta details its hybrid PQC protocol TutaCrypt (CRYSTALS-Kyber-1024 KEM + X25519 ECDH, AES-256/HMAC-SHA-256, Argon2/HKDF), enabled by default for all new accounts. Roadmap includes gradual migration of existing users via key-rotation mechanism, formal protocol verification with University of Wuppertal, full PQMail protocol for Perfect Forward Secrecy, and the PQDrive project (German-government-funded) building post-quantum-secure cloud storage (Tuta Drive). | Milestone: Quantum-safe encryption enabled by default in Tuta Mail and Calendar; rolling out to existing single-user accounts; key verif
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: CRYSTALS-Kyber; ML-KEM; ML-DSA
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Tuta Mail; Tuta Calendar; Tuta Drive
- **Compliance Frameworks**: NIST; BSI
- **Hybrid Mode Support**: Yes; hybrid protocol combining CRYSTALS-Kyber and X25519
- **Current GA Status**: GA
- **Customer Action Required**: Update to the latest version of the Tuta apps
- **Key Commitments & Quotes**: "enabling quantum-safe encryption by default for all new Tuta Mail accounts"; "roll out post-quantum secure encryption to all ten million existing users"; "aim to implement the full PQMail protocol to achieve Perfect Forward Secrecy"
- **Coverage Verification**: CONSISTENT; The document confirms the hybrid protocol details, default enablement for new accounts, gradual rollout to existing users, PQDrive project, and plans for formal verification and PQMail.
- **Extraction Quality**: HIGH
- **Source Document**: VND-187_Tuta_GmbH.html (148.7 KB)
- **Extraction Timestamp**: 2026-07-07T20:44:59

## VND-190 — Zscaler Inc.

- **Vendor ID**: VND-190
- **Vendor Name**: Zscaler Inc.
- **Roadmap Title**: Preparing for 'Q Day': A Primer on the Quantum Threat and the Strategic Shift to Post-Quantum Cryptography
- **Roadmap URL**: https://www.zscaler.com/blogs/product-insights/primer-quantum-threat-strategic-shift-post-quantum-cryptography-pqc
- **Publish Date**: 2025-10-31
- **Local File**: public/vendor-roadmaps/VND-190_Zscaler_Inc..html
- **CSV Coverage Notes**: Zscaler has published a strategic PQC program: a multi-part 'Strategic Shift to Post-Quantum Cryptography' blog series (primer published Oct 31, 2025) plus a 'Quantum-Ready Security Service Edge' innovation launch. It lays out a hybrid ECC+ML-KEM key-exchange strategy, inline PQC TLS decryption/inspection, IPsec tunnels with post-quantum pre-shared keys, crypto-discovery via SI partners (EY, HCLTech), and phased customer migration guidance across the Zero Trust Exchange. | Milestone: Quantum-ready SSE: inline inspection of ML-KEM hybrid PQC TLS traffic and IPsec tunnels with post-quantum pre-s
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: ML-KEM
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Zero Trust Exchange
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: Yes; hybrid ECC+ML-KEM key-exchange strategy
- **Current GA Status**: Planned
- **Customer Action Required**: Audit Cryptographic Systems; Adopt Post-Quantum Cryptography
- **Key Commitments & Quotes**: "Zscaler’s phased approach to post-quantum key exchange"; "Enabling quantum key exchange algorithms and decryption of PQC traffic on the Zero Trust Exchange"
- **Coverage Verification**: PARTIAL; The document confirms the blog series and general strategy but does not explicitly mention the 'Quantum-Ready SSE' launch, specific SI partners (EY, HCLTech), or IPsec pre-shared key details found in the CSV notes.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-190_Zscaler_Inc..html (256.2 KB)
- **Extraction Timestamp**: 2026-07-07T20:33:35

## VND-220 — European Commission

- **Vendor ID**: VND-220
- **Vendor Name**: European Commission
- **Roadmap Title**: A Coordinated Implementation Roadmap for the Transition to Post-Quantum Cryptography
- **Roadmap URL**: https://digital-strategy.ec.europa.eu/en/library/coordinated-implementation-roadmap-transition-post-quantum-cryptography
- **Publish Date**: 2025-06-23
- **Local File**: public/vendor-roadmaps/VND-220_European_Commission.html
- **CSV Coverage Notes**: Official European Commission roadmap (developed with the NIS Cooperation Group PQC work stream), building on the Commission's 11 April 2024 Recommendation. Provides coordinated, phased EU-wide PQC transition guidance using hybrid schemes across public administration and critical infrastructure. | Milestone: Member States to start PQC transition by end of 2026; critical infrastructure protected with PQC by end of 2030; transition completed for as many systems as feasible by 2035.
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: No
- **Current GA Status**: No PQC
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "issued a roadmap and timeline to start using a more complex form of cybersecurity, the so-called post-quantum cryptography (PQC)"
- **Coverage Verification**: PARTIAL; The text confirms the document is the roadmap developed with the NIS Cooperation Group and based on the 11 April 2024 Recommendation, but it does not contain the specific milestones (2026, 2030, 2035) or the mention of hybrid schemes found in the CSV notes.
- **Extraction Quality**: LOW
- **Source Document**: VND-220_European_Commission.html (49.3 KB)
- **Extraction Timestamp**: 2026-07-07T20:38:19

## VND-225 — Proton AG

- **Vendor ID**: VND-225
- **Vendor Name**: Proton AG
- **Roadmap Title**: Proton is building quantum-safe PGP encryption for everyone
- **Roadmap URL**: https://proton.me/blog/post-quantum-encryption
- **Publish Date**: 2023-10-24
- **Local File**: vendor-roadmaps/VND-225_Proton_AG.html
- **CSV Coverage Notes**: Official Proton blog laying out their quantum-safe strategy: standardizing a post-quantum extension to OpenPGP (with German BSI and others since 2021), hybrid algorithms (CRYSTALS-Kyber + X25519 for encryption, CRYSTALS-Dilithium + Ed25519 for signatures), and a sequence of future steps (community standardization, symmetric-key/message re-encryption). May 2026 follow-through: Proton Mail rolled out post-quantum encryption to all users. | Milestone: May 2026 general rollout of post-quantum (OpenPGP v6, hybrid) encryption to all Proton Mail users; next: cross-provider interoperability (Thunderbi
- **PQC Algorithms Announced**: CRYSTALS-Kyber; CRYSTALS-Dilithium
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Proton Mail
- **Compliance Frameworks**: German Federal Office of Information Security (BSI); OpenPGP
- **Hybrid Mode Support**: Yes, using CRYSTALS-Kyber in combination with X25519 for encryption and CRYSTALS-Dilithium in combination with Ed25519 for signatures.
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Proton is leading the standardization of quantum-safe encryption algorithms in OpenPGP"; "we will use post-quantum cryptography in combination with classical cryptography"; "We will roll this out well before quantum computers become a threat"
- **Coverage Verification**: PARTIAL, the document confirms the strategy, algorithms, and BSI collaboration but does not mention the May 2026 rollout milestone or OpenPGP v6.
- **Extraction Quality**: HIGH
- **Source Document**: VND-225_Proton_AG.html (310.2 KB)
- **Extraction Timestamp**: 2026-07-30T21:09:49

## VND-227 — SUSE LLC (openSUSE)

- **Vendor ID**: VND-227
- **Vendor Name**: SUSE LLC (openSUSE)
- **Roadmap Title**: SUSE state of and strategy for Post Quantum Cryptography at the end of 2025
- **Roadmap URL**: https://www.suse.com/c/suse-state-of-and-strategy-for-post-quantum-cryptography-at-the-end-of-2025/
- **Publish Date**: 2025-12-04
- **Local File**: public/vendor-roadmaps/VND-227_SUSE_LLC_openSUSE_.html
- **CSV Coverage Notes**: SUSE's official PQC strategy blog explicitly covers both SUSE Linux Enterprise and openSUSE: adopt NIST standards and upstream implementations quickly, use hybrid ciphers during transition. openSUSE Tumbleweed/Leap have landed hybrid PQC (ML-KEM-768 + X25519), including the libzupt cryptographic library (announced openSUSE news, 2026-04-28). | Milestone: Hybrid PQC (ML-KEM-768 + X25519) available in openSUSE Tumbleweed and Leap; libzupt PQC library released (April 2026).
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA; LMS; XMSS; Frodo KEM
- **Target Migration Dates**: None detected
- **Products / Services Covered**: SUSE Linux Enterprise Server (SLES) 15 SP6, SLES 15 SP7, SLES 16.0, SUSE Linux Micro (SL Micro) 6.0, 6.1, 6.2
- **Compliance Frameworks**: FIPS 203; FIPS 204; FIPS 205; FIPS 186; FIPS 140-3
- **Hybrid Mode Support**: Yes; hybrid ML-KEM 768 / X25519 key agreement for TLS, IKEv2, and SSH
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "SUSE’s strategy on implementing post quantum cryptography (PQC) has been to adopt standards and upstream implementations when they become available"
- **Coverage Verification**: MISMATCH; The document does not mention openSUSE Tumbleweed/Leap or the libzupt library, covering only SUSE Linux Enterprise and SUSE Linux Micro.
- **Extraction Quality**: HIGH
- **Source Document**: VND-227_SUSE_LLC_openSUSE_.html (188.6 KB)
- **Extraction Timestamp**: 2026-07-07T20:43:09

## VND-229 — CyberZero

- **Vendor ID**: VND-229
- **Vendor Name**: CyberZero
- **Roadmap Title**: CyberZero: Post-Quantum Cryptography Readiness
- **Roadmap URL**: https://cyberzero.io/services/post-quantum-cryptography-readiness/
- **Publish Date**: 2026-07-13
- **Local File**: vendor-roadmaps/VND-229_CyberZero.html
- **CSV Coverage Notes**: None
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Quantanaut; PQC Readiness Profile; PQC Edge Scanner; CRQC Attack Simulations
- **Compliance Frameworks**: CPCSC; CMMC; NIST SP 800-171; ITSP.10.171
- **Hybrid Mode Support**: None detected
- **Current GA Status**: No PQC
- **Customer Action Required**: Contact Us
- **Key Commitments & Quotes**: "We help you future-proof your systems, keeping your data safe from quantum-powered threats."
- **Coverage Verification**: CONSISTENT — The document is a general service overview and does not specify algorithmic coverage, consistent with the "Not specified" note.
- **Extraction Quality**: LOW
- **Source Document**: VND-229_CyberZero.html (96.6 KB)
- **Extraction Timestamp**: 2026-07-12T21:32:43

## VND-230 — Confluent Inc.

- **Vendor ID**: VND-230
- **Vendor Name**: Confluent Inc.
- **Roadmap Title**: Post-Quantum Cryptography in Confluent Cloud
- **Roadmap URL**: https://www.confluent.io/blog/confluent-cloud-post-quantum-cryptography-roadmap/
- **Publish Date**: 2026-03-05
- **Local File**: public/vendor-roadmaps/VND-230_Confluent_Inc..html
- **CSV Coverage Notes**: Official Confluent blog laying out a multi-phase PQC strategy for Confluent Cloud addressing 'harvest now, decrypt later'. Covers data-in-transit (TLS 1.3 default, hybrid key exchange investigating ML-KEM/ML-DSA/SLH-DSA), data-at-rest (already AES-256 / PQC-compliant on AWS & GCP, investigating Azure HSM), and crypto-agility. Aligns with NIST FIPS 203/204/205 and references the Cloud Security Alliance 2030 deadline. | Milestone: TLS 1.3 becomes default for all newly provisioned and existing (non-Dedicated) clusters by April 30, 2026; moving toward hybrid classical+PQC key exchange.
- **Roadmap Scope**: Single product
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA
- **Target Migration Dates**: April 30, 2026 (TLS 1.3 default); April 14, 2030 (Cloud Security Alliance deadline)
- **Products / Services Covered**: Confluent Cloud
- **Compliance Frameworks**: NIST FIPS 203; NIST FIPS 204; NIST FIPS 205
- **Hybrid Mode Support**: Yes; moving toward hybrid key exchange model combining classical and PQC signatures
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "On April 30, 2026, Confluent Cloud will enable TLS 1.3 by default for all newly provisioned clusters"; "we’re moving toward a hybrid key exchange model"; "Confluent already uses symmetric Advanced Encryption Standard (AES) 256 keys... making these environments PQC-compliant"
- **Coverage Verification**: CONSISTENT; The document confirms the multi-phase strategy, specific algorithms, data-in-transit/at-rest details, and the April 30, 2026 milestone exactly as described in the notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-230_Confluent_Inc..html (211.7 KB)
- **Extraction Timestamp**: 2026-07-07T20:33:35

## VND-231 — Wiz Inc.

- **Vendor ID**: VND-231
- **Vendor Name**: Wiz Inc.
- **Roadmap Title**: From Cryptographic Blind Spots to Post-Quantum Agility: Introducing Wiz for PQC Readiness
- **Roadmap URL**: https://www.wiz.io/blog/wiz-for-pqc-readiness
- **Publish Date**: 2026-05-18
- **Local File**: public/vendor-roadmaps/VND-231_Wiz_Inc..html
- **CSV Coverage Notes**: Official Wiz blog introducing the PQC Readiness Framework, a structured, priority-ordered migration roadmap with three phases: (1) Legacy Resiliency (urgent—weak RSA, 3DES/RC4, insecure TLS/SSH), (2) HNDL Risk (key exchange/KEMs like ML-KEM), (3) Identity & Signature Resiliency (long-term PKI migration). Includes PQC Lens visualization, continuous crypto inventory, PQC-aware code scanning, and CI/CD guardrails. References accelerated 2029 readiness deadline. | Milestone: Wiz for PQC Readiness launched (May 2026) with three-phase PQC Readiness Framework and PQC Lens; expanding to PQC-aware code
- **Roadmap Scope**: Single product
- **PQC Algorithms Announced**: ML-KEM
- **Target Migration Dates**: 2029
- **Products / Services Covered**: Wiz for PQC Readiness; Wiz Cloud; Wiz for Gov; Wiz Code; Wiz Runtime Sensor; Wiz DSPM; Wiz IDE Extension; Wiz CLI
- **Compliance Frameworks**: FedRAMP High
- **Hybrid Mode Support**: No
- **Current GA Status**: GA
- **Customer Action Required**: Log in to Wiz tenant to explore the Cryptographic Readiness board; scan domain using PQC Tester
- **Key Commitments & Quotes**: "Wiz for PQC Readiness is now generally available for all Wiz customers."
- **Coverage Verification**: CONSISTENT
- **Extraction Quality**: HIGH
- **Source Document**: VND-231_Wiz_Inc..html (330.0 KB)
- **Extraction Timestamp**: 2026-07-07T20:30:24

## VND-233 — Huawei Technologies Co. Ltd.

- **Vendor ID**: VND-233
- **Vendor Name**: Huawei Technologies Co. Ltd.
- **Roadmap Title**: Post-Quantum Cryptography - Huawei Trust Center
- **Roadmap URL**: https://www.huawei.com/en/trust-center/post-quantum-cryptography
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-233_Huawei_Technologies_Co._Ltd..html
- **CSV Coverage Notes**: Official Huawei Trust Center page setting out the company's quantum-safe strategy: prioritizing quantum-safe key-agreement to counter store-now-decrypt-later, adopting hybrid schemes (classical Diffie-Hellman + PQC KEM) during transition, tracking NIST standardization, and committing to introduce quantum-safe algorithms into products early. Reviews the six PQC algorithm families and selection criteria (security maturity, complexity, performance). | Milestone: Deploy hybrid (classical + PQC) key-agreement in products in advance of finalized standards; align with NIST PQC standardization outcome
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: in advance of the 2024 deadline
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: Yes; implement a hybrid scheme that implements both Diffie-Hellman and a candidate quantum-safe key-exchange mechanism
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Huawei plans to introduce quantum-safe algorithms into its products at an early date"; "We plan to introduce some of these algorithms into our products in advance of the 2024 deadline"
- **Coverage Verification**: CONSISTENT; The document confirms the strategy, hybrid approach, six algorithm families, and early introduction commitment described in the notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-233_Huawei_Technologies_Co._Ltd..html (111.9 KB)
- **Extraction Timestamp**: 2026-07-07T20:34:37

## VND-234 — NTT Corporation

- **Vendor ID**: VND-234
- **Vendor Name**: NTT Corporation
- **Roadmap Title**: NTT quantum-safe secure transport system
- **Roadmap URL**: https://group.ntt/en/newsrelease/2024/10/30/241030a.html
- **Publish Date**: 2024-10-30
- **Local File**: public/vendor-roadmaps/VND-234_NTT_Corporation.html
- **CSV Coverage Notes**: NTT's 'quantum-safe secure transport system' using proprietary Elastic Key Control to switch cryptographic methods without service interruption, deployed on the Japan-Taiwan IOWN all-photonics network; framed around the '2030 Cryptography Problem.' Added 2026-07-07 via migrate-data remediation; independently re-fetched before adding.
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: quantum-safe secure transport system; open optical transponder
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: Yes; combines multiple key exchange algorithms and hybridizes keys to generate a single common key
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "NTT has developed the world's first post-quantum secure transport system that supports advanced crypto-agility."
- **Coverage Verification**: CONSISTENT; The document confirms the system uses Elastic Key Control, switches methods without interruption, is deployed on the Japan-Taiwan IOWN network, and addresses the 2030 Cryptography Problem.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-234_NTT_Corporation.html (122.9 KB)
- **Extraction Timestamp**: 2026-07-11T15:57:00

## VND-235 — Samsung SDS Co. Ltd.

- **Vendor ID**: VND-235
- **Vendor Name**: Samsung SDS Co. Ltd.
- **Roadmap Title**: In the Era of Quantum Computing, SDS is Taking the Following Steps to Enhance Security - Participating in NIST Post-Quantum Cryptography Migration Project
- **Roadmap URL**: https://www.samsungsds.com/en/research-blog/post-quantum-crypto-migration.html
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-235_Samsung_SDS_Co._Ltd..html
- **CSV Coverage Notes**: Official Samsung SDS research blog describing its quantum-safe strategy across three pillars: building the Crypto Agility Platform / S-CAPE for enterprise PQC migration (identification, analysis, migration phases), active participation in NIST NCCoE Migration to PQC project (founding member since June 2022), and advancing domestic KPQC standards (AIMer selected 2025). PQC piloted in Samsung Cloud Platform communications with planned expansion. | Milestone: Provide S-CAPE PQC migration via Samsung Cloud Platform and expand PQC application in SCP communication segments; presented Software-Define
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA; HQC; AIMer
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Crypto Agility Platform; S-CAPE; Samsung Cloud Platform
- **Compliance Frameworks**: NIST FIPS; NIST SP 1800 series; NSM-10
- **Hybrid Mode Support**: No
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Samsung SDS developed the Crypto Agility Platform, equipping enterprises with the tools needed to migrate to post-quantum cryptography (PQC)."
- **Coverage Verification**: PARTIAL; The document confirms the Crypto Agility Platform, NIST participation, and AIMer selection, but does not explicitly mention "S-CAPE" or "PQC piloted in Samsung Cloud Platform communications" as stated in the notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-235_Samsung_SDS_Co._Ltd..html (35.3 KB)
- **Extraction Timestamp**: 2026-07-07T20:35:35

## VND-236 — Centre for Development of Telematics (C-DOT)

- **Vendor ID**: VND-236
- **Vendor Name**: Centre for Development of Telematics (C-DOT)
- **Roadmap Title**: Post Quantum Cryptography product category
- **Roadmap URL**: https://www.cdot.in/cdotweb/web/product_category.php?lang=en&catId=10
- **Publish Date**: 2026-07-29
- **Local File**: vendor-roadmaps/VND-236_Centre_for_Development_of_Telematics_C_DOT.html
- **CSV Coverage Notes**: None
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: C-DOT QUANTUM SAFE ENTERPRISE NETWORK e-QSAN; C-DOT ENHANCED QUATUM SECURE ACCESS NODE (e-QSAN); C-DOT SECURE AD-HOC NETWORK NODE QSWP2P-Quantum Safe Wireless P2P Solution; Q-SIIP; C-DOT QUANTUM SECURE IN-LINE NODE FOR IP PHONE Q-SETU PINE; Post Quantum In-Line Network Encryptor QSSVIP; Quantum Secure Smart Video IP Phone CEM; Compact Encryption Module
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: None detected
- **Current GA Status**: No PQC
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: None detected
- **Coverage Verification**: CONSISTENT — The document lists product names but contains no roadmap details, dates, or algorithm specifications, consistent with "Not specified" coverage notes.
- **Extraction Quality**: LOW
- **Source Document**: VND-236_Centre_for_Development_of_Telematics_C_DOT.html (58.7 KB)
- **Extraction Timestamp**: 2026-07-28T20:42:37

## VND-238 — Toshiba Research Europe Ltd.

- **Vendor ID**: VND-238
- **Vendor Name**: Toshiba Research Europe Ltd.
- **Roadmap Title**: Toshiba Cambridge Research Laboratory satellite QKD milestones
- **Roadmap URL**: https://www.toshiba-clip.com/en/detail/p=5165
- **Publish Date**: 2026-04-24
- **Local File**: public/vendor-roadmaps/VND-238_Toshiba_Research_Europe_Ltd..html
- **CSV Coverage Notes**: Completed milestone (Jan 2026): compact satellite QKD transmitter, ground-demonstrated. Target milestone (FY2027): long-distance LEO-satellite-to-ground QKD communication, building on 25 years of Cambridge QKD research. Added 2026-07-07 via migrate-data remediation; independently re-fetched before adding.
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: None detected
- **Compliance Frameworks**: ETSI
- **Hybrid Mode Support**: None detected
- **Current GA Status**: No PQC
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Satellite QKD is indispensable for building quantum networks that span continents."; "Toshiba aims to demonstrate long-distance communication between low-Earth-orbit satellites and ground stations by fiscal year 2027."; "Satellite QKD will not replace all communications, but it will serve as a foundational layer securing the most critical information across continents."
- **Coverage Verification**: CONSISTENT — The document confirms the Jan 2026 ground demonstration of the compact satellite QKD transmitter and the FY2027 target for long-distance LEO-satellite-to-ground communication, citing 25+ years of research.
- **Extraction Quality**: LOW
- **Source Document**: VND-238_Toshiba_Research_Europe_Ltd..html (61.8 KB)
- **Extraction Timestamp**: 2026-07-11T15:57:00

## VND-239 — Eviden SAS (Atos Group)

- **Vendor ID**: VND-239
- **Vendor Name**: Eviden SAS (Atos Group)
- **Roadmap Title**: Post-Quantum Cryptography (PQC) | Eviden
- **Roadmap URL**: https://eviden.com/solutions/cybersecurity/post-quantum-security-pqc/
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-239_Eviden_SAS_Atos_Group_.html
- **CSV Coverage Notes**: Official Eviden PQC page presenting a structured quantum-safe migration framework: a 4-step approach (awareness/education, cryptography inventory, risk assessment, implementation) plus a referenced 6-step PQC migration framework whitepaper. Frames urgency (quantum maturity ~2037; irreducible ~3-year migration timeline per CSA) and supports migration with PQC Explorer tooling, C-QSR Quantum Safe Remediation suite, and quantum-ready products (Trustway HSM/IP Protect, IDnomic PKI, PQC HSMaaS). | Milestone: Drive customer migration via cryptography inventory + risk assessment toward hybrid PQC; qu
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: 2037 (quantum maturity); 3 years (migration timeline)
- **Products / Services Covered**: PQC Explorer; C-QSR Quantum Safe Remediation suite; Trustway HSM; IP Protect; IDnomic PKI; PQC HSMaaS
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: No
- **Current GA Status**: GA
- **Customer Action Required**: Run cryptography inventory; perform risk assessment; migrate prioritized assets to PQC algorithms
- **Key Commitments & Quotes**: "Migrating to PQC is not an option, rather a vital requirement to maintain your business continuity and security."
- **Coverage Verification**: PARTIAL; The document confirms the 4-step framework, 2037 timeline, 3-year migration, PQC Explorer, and specific products, but does not mention the "C-QSR Quantum Safe Remediation suite" or the "6-step PQC migration framework whitepaper" referenced in the notes.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-239_Eviden_SAS_Atos_Group_.html (137.3 KB)
- **Extraction Timestamp**: 2026-07-07T20:35:35

## VND-240 — Orange S.A.

- **Vendor ID**: VND-240
- **Vendor Name**: Orange S.A.
- **Roadmap Title**: Orange Quantum Defender — quantum-safe / PQC adoption service
- **Roadmap URL**: https://www.orange-business.com/en/solutions/orange-quantum-defender
- **Publish Date**: 2025
- **Local File**: public/vendor-roadmaps/VND-240_Orange_S.A..html
- **CSV Coverage Notes**: Orange Quantum Defender service: guidance and support adopting/integrating quantum-safe cryptography incl. Post-Quantum Cryptography (PQC); positioned as available to protect enterprises against future quantum attacks. (Re-validated 2026-06-19, stronger source than prior 2025 blog.)
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: Kyber; Dilithium
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: NIST; ENISA; ANSSI
- **Hybrid Mode Support**: No
- **Current GA Status**: No PQC
- **Customer Action Required**: Map vulnerabilities; plan transition; build crypto-agility; test before deploying; roll out gradually
- **Key Commitments & Quotes**: "Orange Cyberdefense is already supporting organizations through this transformation with a proven methodology called Quantum Safe Migration."
- **Coverage Verification**: PARTIAL; The document confirms the PQC guidance and support strategy but does not explicitly name the "Orange Quantum Defender" service.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-240_Orange_S.A..html (206.1 KB)
- **Extraction Timestamp**: 2026-07-07T20:35:35

## VND-244 — HP Inc.

- **Vendor ID**: VND-244
- **Vendor Name**: HP Inc.
- **Roadmap Title**: HP business PCs with quantum-resistant firmware protection
- **Roadmap URL**: https://www.hp.com/us-en/newsroom/blogs/2024/hp-launches-business-pc-to-protect-against-quantum-computer-hacks.html
- **Publish Date**: 2024-03-07
- **Local File**: public/vendor-roadmaps/VND-244_HP_Inc..html
- **CSV Coverage Notes**: HP shipped business PCs with an upgraded Endpoint Security Controller (ESC) chip using quantum-resistant cryptography to protect firmware integrity, positioned ahead of US government guidance (quantum-resistant crypto recommended from 2025, required from 2030 for sensitive systems). Added 2026-07-07 via migrate-data remediation; independently re-fetched before adding.
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: 2025 (recommended for sensitive systems); 2030 (required for sensitive systems)
- **Products / Services Covered**: 5th generation Endpoint Security Controller (ESC) chip; select business PCs
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: None detected
- **Current GA Status**: GA
- **Customer Action Required**: Identify highest priority use cases; talk to technology providers to understand vendor plans; ensure a plan to protect against the quantum threat
- **Key Commitments & Quotes**: "HP has announced the world’s first business PCs to protect firmware against quantum computer attacks"; "recommending quantum-resistant cryptography be used from 2025, and be required from 2030, for sensitive systems"; "hardware will be in place to protect PC firmware integrity with Quantum-Resistant Cryptography"
- **Coverage Verification**: CONSISTENT — The document confirms the launch of business PCs with an upgraded ESC chip for quantum-resistant firmware protection and cites the US government guidance recommending use from 2025 and requiring it from 2030.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-244_HP_Inc..html (266.7 KB)
- **Extraction Timestamp**: 2026-07-11T15:57:00

## VND-251 — Department of Science and Technology (DST) India

- **Vendor ID**: VND-251
- **Vendor Name**: Department of Science and Technology (DST) India
- **Roadmap Title**: Quantum Safe Ecosystem in India - Report of the Task Force on Implementation of Quantum Safe Ecosystem in India
- **Roadmap URL**: https://dst.gov.in/quantum-safe-ecosystem-in-india
- **Publish Date**: 2026-02-04
- **Local File**: public/vendor-roadmaps/VND-251_Department_of_Science_and_Technology_DST_India.html
- **CSV Coverage Notes**: Official DST India page (verified via WebFetch) presenting the national PQC migration roadmap produced by the DST Task Force under the National Quantum Mission (chaired by Dr. Rajkumar Upadhyay, CEO C-DOT). Sets time-bound national targets, phased migration guidelines, recommended PQC standards (NIST-aligned plus evaluation of indigenous algorithms), national testing/certification infrastructure, hybrid deployment, crypto-agile PKI, and PQC-QKD composite testbeds. Linked full report PDF dated 4 Feb 2026; page last updated 01 Jun 2026. | Milestone: Quantum resiliency across Critical Information
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: quantum resiliency across Critical Information Infrastructure by 2029; enterprise-wide post-quantum cryptography adoption by 2033
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: Yes; hybrid deployment frameworks
- **Current GA Status**: No PQC
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "quantum resiliency across Critical Information Infrastructure by 2029"; "enterprise-wide post-quantum cryptography adoption by 2033"; "build a quantum-secure digital backbone suited to India's scale"
- **Coverage Verification**: PARTIAL; The text confirms the DST Task Force, National Quantum Mission, targets, and update date, but does not mention Dr. Rajkumar Upadhyay, C-DOT, NIST alignment, or the specific PDF date.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-251_Department_of_Science_and_Technology_DST_India.html (53.1 KB)
- **Extraction Timestamp**: 2026-07-07T20:35:35

## VND-255 — Quantum eMotion Inc.

- **Vendor ID**: VND-255
- **Vendor Name**: Quantum eMotion Inc.
- **Roadmap Title**: Quantum eMotion Deploys Its Quantum-Safe Security Platform
- **Roadmap URL**: https://www.quantumemotion.com/press-release/53/quantum-emotion-deploys-its-quantum-safe-security-platform-for-digital-therapeutics-in-landmark-comm
- **Publish Date**: 2026-07-17
- **Local File**: vendor-roadmaps/VND-255_Quantum_eMotion_Inc.html
- **CSV Coverage Notes**: None
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Sentry-Q platform
- **Compliance Frameworks**: NIST IUT; FIPS
- **Hybrid Mode Support**: None detected
- **Current GA Status**: No PQC
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: None detected
- **Coverage Verification**: CONSISTENT — The document is a press release about a commercial alliance and does not contain specific PQC roadmap details, consistent with "Not specified" coverage notes.
- **Extraction Quality**: LOW
- **Source Document**: VND-255_Quantum_eMotion_Inc.html (72.7 KB)
- **Extraction Timestamp**: 2026-07-17T11:46:05

## VND-258 — NetSfere (Infinite Convergence Solutions)

- **Vendor ID**: VND-258
- **Vendor Name**: NetSfere (Infinite Convergence Solutions)
- **Roadmap Title**: The NetSfere Edge — Post-Quantum Cryptography
- **Roadmap URL**: https://netsfere.com/Resources/pqc
- **Publish Date**: 2025-03-27
- **Local File**: public/vendor-roadmaps/VND-258_NetSfere_Infinite_Convergence_Solutions_.html
- **CSV Coverage Notes**: NetSfere publishes a dedicated PQC strategy page ('The NetSfere Edge') describing its crypto-agile, quantum-proof secure-communication architecture. Built on four pillars (Modular Architecture, NIST Standard Compliance, Automated Updates, Backward Compatibility), using Rust-based ML-KEM 1024 (FIPS 203, evolved from CRYSTALS-Kyber) paired with AES-256. Architecture is designed for seamless transition to future quantum-safe standards. Backed by a March 2025 press release unveiling the enterprise-ready quantum-proof platform; crypto-agile architecture first announced at NetSfere Connections 2024
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: ML-KEM
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: Yes; ECC backward compatibility
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "NetSfere... unveils the industry’s first Quantum-Proof Secure Communication Platform."
- **Coverage Verification**: PARTIAL; The document confirms the strategy, pillars, and ML-KEM 1024 usage, but does not explicitly mention "FIPS 203", "AES-256", the "March 2025 press release", or "NetSfere Connections 2024".
- **Extraction Quality**: HIGH
- **Source Document**: VND-258_NetSfere_Infinite_Convergence_Solutions_.html (66.3 KB)
- **Extraction Timestamp**: 2026-07-07T20:36:31

## VND-259 — Cellcrypt Limited

- **Vendor ID**: VND-259
- **Vendor Name**: Cellcrypt Limited
- **Roadmap Title**: Store Now, Decrypt Later: The Quantum Computing Threat (PQC strategy & phased migration)
- **Roadmap URL**: https://www.cellcrypt.com/post/post-quantum-cryptography-and-the-store-now-decrypt-later-threat/
- **Publish Date**: 2024-10-17
- **Local File**: public/vendor-roadmaps/VND-259_Cellcrypt_Limited.html
- **CSV Coverage Notes**: Cellcrypt's blog 'Store Now, Decrypt Later' (17 Oct 2024) lays out its dual-layer PQC strategy combining CRYSTALS-Kyber (ML-KEM, lattice-based) with Classic McEliece (code-based) plus an agile post-quantum crypto layer for easy algorithm replacement, and includes a 12-month phased migration roadmap (Phase 1 inventory/months 1-2; Phase 2 hybrid deployment/months 3-6; Phase 3 PQ-only or dual-layer migration + audit/months 7-12). Modules certified FIPS 140-3 Level 3. | Milestone: Dual-layer PQC (CRYSTALS-Kyber + Classic McEliece) with agile crypto layer live in product; FIPS 140-3 Level 3 validat
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA; CRYSTALS-Kyber; CRYSTALS-Dilithium; SPHINCS+; Classic McEliece
- **Target Migration Dates**: 12-month phased migration (Phase 1: Months 1-2; Phase 2: Months 3-6; Phase 3: Months 7-12)
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: NIST; FIPS 140-3 Level 3
- **Hybrid Mode Support**: Yes; hybrid (classical + PQ) key exchange for TLS and messaging
- **Current GA Status**: Planned
- **Customer Action Required**: Begin phased PQ rollout and policy updates immediately; inventory current encryption usage; identify long-lived secrets
- **Key Commitments & Quotes**: "Cellcrypt implements a dual-layer PQ architecture that composes: CRYSTALS-Kyber (ML-KEM)... Classic McEliece"; "Begin phased rollout to key exchange mechanisms immediately"; "Migrate to PQ-only or dual-layer PQ for high-value data"
- **Coverage Verification**: PARTIAL; The document confirms the dual-layer strategy, algorithms, and 12-month roadmap, but does not mention an "agile post-quantum crypto layer" or "FIPS 140-3 Level 3" certification.
- **Extraction Quality**: HIGH
- **Source Document**: VND-259_Cellcrypt_Limited.html (43.1 KB)
- **Extraction Timestamp**: 2026-07-07T20:36:31

## VND-261 — XWiki SAS (CryptPad)

- **Vendor ID**: VND-261
- **Vendor Name**: XWiki SAS (CryptPad)
- **Roadmap Title**: Towards More Cryptographic Agility — CryptPad Blueprints (PQC integration)
- **Roadmap URL**: https://blueprints.cryptpad.org/review/agility/
- **Publish Date**: 2025-09-05
- **Local File**: public/vendor-roadmaps/VND-261_XWiki_SAS_CryptPad_.html
- **CSV Coverage Notes**: CryptPad (XWiki SAS) documents a PQC integration plan via its blog and Blueprints. After a 6-month internship, the team chose the Crystals suite (ML-KEM and ML-DSA) after benchmarking NIST candidates, implemented a proof-of-concept, and added crypto-agility to allow easy switching of cryptographic libraries. The 'Towards More Cryptographic Agility' blueprint and status posts describe the path toward quantum-resilient cryptography, with acknowledged low-level/UX blockers before production deployment. | Milestone: PQC proof-of-concept (ML-KEM + ML-DSA) and crypto-agility refactor completed; depl
- **Roadmap Scope**: Single product
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: CryptPad
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: No
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "we thus plan the transition towards such a scheme"; "CryptPad should already start today towards more cryptographic agility"; "Having the possibility to more easily change the cryptographic primitives will make the transition smooth"
- **Coverage Verification**: MISMATCH; The document text does not mention the Crystals suite, ML-KEM, ML-DSA, or the completion of a proof-of-concept, focusing instead on general architectural strategies for agility.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-261_XWiki_SAS_CryptPad_.html (32.4 KB)
- **Extraction Timestamp**: 2026-07-07T20:36:31

## VND-263 — Quranium

- **Vendor ID**: VND-263
- **Vendor Name**: Quranium
- **Roadmap Title**: Quranium Blockchain Documentation / 2025 Roadmap
- **Roadmap URL**: https://docs.quranium.org/
- **Publish Date**: 2025-12-22
- **Local File**: public/vendor-roadmaps/VND-263_Quranium.html
- **CSV Coverage Notes**: Quranium: quantum-secure L1 blockchain adopting SLH-DSA (FIPS 205) for signatures; published roadmap lists mainnet launch (Q3 2025 plan) with testnets live. Confirmed roadmap, re-validated 2026-06-19.
- **Extraction Error**: Bot-protection/error page detected: "ray id"
- **Extraction Timestamp**: 2026-07-07T20:36:31

## VND-269 — Kryptus Soluções em TI Ltda.

- **Vendor ID**: VND-269
- **Vendor Name**: Kryptus Soluções em TI Ltda.
- **Roadmap Title**: The Quantum Countdown: A Practical Guide to Sovereign, Quantum-Safe Transition with Kryptus
- **Roadmap URL**: https://kryptus.com/practical-guide-to-quantum-safe-transition/
- **Publish Date**: 2025-10-31
- **Local File**: public/vendor-roadmaps/VND-269_Kryptus_Solu_es_em_TI_Ltda..html
- **CSV Coverage Notes**: Official Kryptus guide laying out a four-step PQC migration roadmap: (1) Discover and Prioritize - inventory public-key crypto usage, prioritizing mission-critical assets; (2) Fortify the Core - deploy kNET HSM as central crypto root of trust for PQC keys/certs; (3) Secure the Arteries - roll out CommGuard network encryptors with hybrid classical/PQC key exchange; (4) Extend to the Edge - deploy KeyGuardian devices to remote personnel for end-to-end quantum-resistant protection. Built around the BruitBlanc ecosystem; emphasizes crypto-agility. A companion EU-focused piece (post-quantum-cryptog
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: ML-KEM; ML-DSA
- **Target Migration Dates**: None detected
- **Products / Services Covered**: kNET HSM; CommGuard; KeyGuardian
- **Compliance Frameworks**: Common Criteria EAL4+; NIST CAVP; FIPS 140-2 Level 3
- **Hybrid Mode Support**: No
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "The Kryptus BruitBlanc ecosystem is an integrated suite of hardware and software cryptographic solutions designed to provide this trusted foundation."
- **Coverage Verification**: PARTIAL; The document confirms the products and ecosystem but does not explicitly list the four-step roadmap steps or mention "hybrid" key exchange for CommGuard.
- **Extraction Quality**: HIGH
- **Source Document**: VND-269_Kryptus_Solu_es_em_TI_Ltda..html (79.8 KB)
- **Extraction Timestamp**: 2026-07-07T20:39:09

## VND-273 — Telefonica S.A.

- **Vendor ID**: VND-273
- **Vendor Name**: Telefonica S.A.
- **Roadmap Title**: Quantum-Safe Networks - Telefonica
- **Roadmap URL**: https://www.telefonica.com/en/sustainability-innovation/innovation/quantum-safe-networks/
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-273_Telefonica_S.A..html
- **CSV Coverage Notes**: Official Telefonica innovation page outlining its quantum-safe strategy across three pillars: networks (extra quantum-safe layer combining traditional + post-quantum cryptography), customer solutions (protecting against store-now-decrypt-later), and technology (NIST-standardised post-quantum algorithms with crypto-agility). Backed by a dedicated quantum Centre of Excellence and QKD deployment in EuroQCI. Telefonica also published a formal contribution to the EU PQC Roadmap (2025-09-29 PDF). | Milestone: Live quantum-safe deployments: subsea infrastructure protection, IoT/eSIM quantum-safe cert
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Quantum-Safe Networks; private 5G networks; Telefónica Tech’s Kite platform; eSIM profiles
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: Yes; combining traditional and post-quantum cryptography
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "We’re developing the current security of our networks, adding an extra layer of security with quantum-safe technology andcombining traditional and post-quantum cryptography."
- **Coverage Verification**: PARTIAL; The document confirms the three pillars and specific deployments (subsea, IoT/eSIM) but does not mention the Centre of Excellence, QKD, EuroQCI, or the EU PQC Roadmap contribution.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-273_Telefonica_S.A..html (160.8 KB)
- **Extraction Timestamp**: 2026-07-07T20:44:08

## VND-291 — Cybernetica AS

- **Vendor ID**: VND-291
- **Vendor Name**: Cybernetica AS
- **Roadmap Title**: Cybernetica to lead Estonia's transition to quantum-safe e-governance
- **Roadmap URL**: https://cyber.ee/resources/news/estonia-pqc-transition/
- **Publish Date**: 2025-11-10
- **Local File**: public/vendor-roadmaps/VND-291_Cybernetica_AS.html
- **CSV Coverage Notes**: Cybernetica won three Estonian government procurements to lead the national PQC transition and develop Estonia's national PQC roadmap. The roadmap follows three phases: (1) cryptographic inventory of existing systems, (2) detailed transition planning with timelines and priorities, (3) implementation across Estonia's digital infrastructure (eID/ID-card, Mobile-ID, Smart-ID, X-Road, public e-services, i-voting). Includes a Population Register security assessment and updated cryptographic-algorithm lifecycle research. Modeled on Cybernetica's earlier X-Road SHA-1 to SHA-512 migration. | Milestone
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: ETSI; Post Quantum Cryptography Coalition; British National Cyber Security Centre; EU NIS Cooperation Group; U.S. National Security Agency
- **Hybrid Mode Support**: No
- **Current GA Status**: No PQC
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Cybernetica has been awarded three strategic procurements by the Estonian government to lead the nation's transition of e-governance systems to post-quantum cryptography (PQC)."
- **Coverage Verification**: CONSISTENT; The document confirms the three procurements, the three-phase roadmap structure, the specific systems covered, and the SHA-1 to SHA-512 migration precedent.
- **Extraction Quality**: HIGH
- **Source Document**: VND-291_Cybernetica_AS.html (78.0 KB)
- **Extraction Timestamp**: 2026-07-07T20:38:19

## VND-300 — EU NIS Cooperation Group

- **Vendor ID**: VND-300
- **Vendor Name**: EU NIS Cooperation Group
- **Roadmap Title**: A Coordinated Implementation Roadmap for the Transition to Post-Quantum Cryptography
- **Roadmap URL**: https://digital-strategy.ec.europa.eu/en/library/coordinated-implementation-roadmap-transition-post-quantum-cryptography
- **Publish Date**: 2025-06-23
- **Local File**: public/vendor-roadmaps/VND-300_EU_NIS_Cooperation_Group.html
- **CSV Coverage Notes**: Roadmap produced by the PQC work stream of the NIS Cooperation Group (alongside the European Commission), released to Member States 23 June 2025. Sets coordinated milestones: start transition by end-2026, protect critical infrastructure with PQC by end-2030, complete transition where feasible by 2035, favoring hybrid PQC schemes. | Milestone: Member States to begin PQC transition by end of 2026; critical infrastructure to PQC by end of 2030; broad completion by 2035.
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: start transition by end-2026; protect critical infrastructure with PQC by end-2030; complete transition where feasible by 2035
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: Yes; favoring hybrid PQC schemes
- **Current GA Status**: No PQC
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "issued a roadmap and timeline to start using a more complex form of cybersecurity, the so-called post-quantum cryptography (PQC)"
- **Coverage Verification**: CONSISTENT; The document confirms the release date, the issuing bodies (NIS Cooperation Group and Commission), and the high-level nature of the roadmap for Member States.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-300_EU_NIS_Cooperation_Group.html (49.3 KB)
- **Extraction Timestamp**: 2026-07-07T20:38:19

## VND-304 — Akamai Technologies, Inc.

- **Vendor ID**: VND-304
- **Vendor Name**: Akamai Technologies, Inc.
- **Roadmap Title**: Taking Steps to Prepare for Quantum Advantage
- **Roadmap URL**: https://www.akamai.com/blog/security/taking-steps-to-prepare-for-quantum-advantage
- **Publish Date**: 2025
- **Local File**: public/vendor-roadmaps/VND-304_Akamai_Technologies__Inc..html
- **CSV Coverage Notes**: Akamai's phased PQC roadmap for end-to-end quantum-safe support across its platform, covering client-to-Akamai, Akamai-to-origin (G2O), and internal mid-tier connections. Uses TLS 1.3 hybrid X25519MLKEM768 (NIST FIPS 203 ML-KEM) and platform-wide crypto-agility upgrades; aligned with NSA/CISA/NIST quantum-readiness guidance. | Milestone: PQC enabled by default for all Enhanced TLS customers and G2O origin connections in Q1 2026; all Akamai-to-Akamai mid-tier connections quantum-safe by March 2026.
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: Akamai-to-origin service available in second half of 2024; client-to-Akamai service available in early 2025
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: NIST; NSA; CISA
- **Hybrid Mode Support**: Yes; adoption of hybrid key exchange algorithms
- **Current GA Status**: Beta
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "We plan to take a phased approach to support end-to-end post-quantum cryptography on our platform."
- **Coverage Verification**: PARTIAL; The document confirms the phased approach and timelines for Akamai-to-origin and client-to-Akamai, but does not mention the specific algorithm (ML-KEM), the Akamai-to-Akamai phase, or the 2026 milestones cited in the notes.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-304_Akamai_Technologies__Inc..html (180.5 KB)
- **Extraction Timestamp**: 2026-07-07T20:30:24

## VND-308 — Fastly, Inc.

- **Vendor ID**: VND-308
- **Vendor Name**: Fastly, Inc.
- **Roadmap Title**: Future-proofing TLS encryption against quantum threats
- **Roadmap URL**: https://www.fastly.com/blog/future-proofing-tls-encryption-against-quantum-threats
- **Publish Date**: 2025-04-02
- **Local File**: vendor-roadmaps/VND-308_Fastly_Inc..html
- **CSV Coverage Notes**: Rollout of ML-KEM across Fastly's global CDN fleet starting April 2025, automatic for TLS 1.3 customers, with measured early adoption data (~5% of TLS 1.3 clients at time of writing). Added 2026-07-07 via migrate-data remediation; independently re-fetched before adding.
- **PQC Algorithms Announced**: ML-KEM; Kyber
- **Target Migration Dates**: Starting April 2025
- **Products / Services Covered**: global CDN fleet
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: None detected
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Starting April 2025 , we will be rolling out ML-KEM support across our global CDN fleet"
- **Coverage Verification**: PARTIAL — The document confirms the April 2025 rollout of ML-KEM across the global CDN fleet, but does not mention that it is automatic for TLS 1.3 customers or provide the ~5% early adoption data.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-308_Fastly_Inc..html (250.9 KB)
- **Extraction Timestamp**: 2026-07-12T21:04:44

## VND-311 — IronCore Labs, Inc.

- **Vendor ID**: VND-311
- **Vendor Name**: IronCore Labs, Inc.
- **Roadmap Title**: IronCore Labs — Crypto-Agility / Post-Quantum Cryptography
- **Roadmap URL**: https://ironcorelabs.com/crypto-agility-post-quantum/
- **Publish Date**: 2026-07-31
- **Local File**: vendor-roadmaps/VND-311_IronCore_Labs_Inc.html
- **CSV Coverage Notes**: None
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: SaaS Shield
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: Partial; mentions "hybrid schemes that come with their own tradeoffs" as a general industry practice, not a specific product feature.
- **Current GA Status**: No PQC
- **Customer Action Required**: Start migrating to crypto-agility now; Schedule a Consultation
- **Key Commitments & Quotes**: "We abstract away your reliance on specific key management servers, algorithms, key sizes, etc., and we allow these to rotate at any time with simple configuration changes."
- **Coverage Verification**: CONSISTENT; The document is a general educational overview and product pitch rather than a technical roadmap, so the lack of specific coverage details in the notes is consistent with the text.
- **Extraction Quality**: LOW
- **Source Document**: VND-311_IronCore_Labs_Inc.html (86.1 KB)
- **Extraction Timestamp**: 2026-09-02T11:58:01

## VND-312 — Netskope, Inc.

- **Vendor ID**: VND-312
- **Vendor Name**: Netskope, Inc.
- **Roadmap Title**: Preparing for a Future with Post-Quantum Cryptography
- **Roadmap URL**: https://www.netskope.com/resources/white-papers/preparing-for-a-future-with-post-quantum-cryptography
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-312_Netskope_Inc..html
- **CSV Coverage Notes**: Official Netskope white paper (authored by CTO Krishna Narayanaswamy), complemented by the 'Planning for a Post-quantum World, Now!' blog, outlining how encryption is implemented across the Netskope One platform and the company's strategy to address quantum threats. Netskope evaluated five places in the Netskope One architecture using encryption and is adopting NIST PQC algorithms (ML-KEM-768) to build protections. | Milestone: Quantum-resilient Netskope One in development, intended to be available for customer sandbox testing; standardizing on ML-KEM-768.
- **Roadmap Scope**: Single product
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Netskope One
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: No
- **Current GA Status**: No PQC
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: None detected
- **Coverage Verification**: MISMATCH; The provided text is a website navigation menu and footer containing no substantive white paper content, thus it does not contain the specific details (ML-KEM-768, CTO authorship, five architecture points) cited in the coverage notes.
- **Extraction Quality**: LOW
- **Source Document**: VND-312_Netskope_Inc..html (1516.5 KB)
- **Extraction Timestamp**: 2026-07-07T20:34:37

## VND-315 — PQSecure Technologies, Inc.

- **Vendor ID**: VND-315
- **Vendor Name**: PQSecure Technologies, Inc.
- **Roadmap Title**: PQSecure Technologies — PQSecure Software Products
- **Roadmap URL**: https://pqsecurity.com/pqsecure-software/
- **Publish Date**: 2026-07-31
- **Local File**: vendor-roadmaps/VND-315_PQSecure_Technologies_Inc.html
- **CSV Coverage Notes**: None
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA; FN-DSA; XMSS; LMS
- **Target Migration Dates**: None detected
- **Products / Services Covered**: PQSecure-SW; libpqsecure-C; libpqsecure-rs; libpqsecure-asm; PQSecure-TRUST
- **Compliance Frameworks**: FIPS 180; FIPS 203; FIPS 204; FIPS 205; FIPS 206; FIPS 202; RFC 8391; RFC 8554; NIST SP 800-208; RFC 6234; CNSA 2.0; ACVP
- **Hybrid Mode Support**: Partial, with brief description: The document mentions "classical primitives required for hybrid deployments" and lists SHA-2, HMAC, and HKDF, but does not explicitly detail hybrid key exchange or signature schemes.
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "PQSecure-SW™ delivers production-grade, side-channel-aware, formally verified post-quantum cryptography software"; "libpqsecure consistently demonstrates measurable performance advantages"; "Designed for FIPS-oriented validation pathways"
- **Coverage Verification**: CONSISTENT, as the document provides detailed product and algorithm information despite the CSV notes being unspecified.
- **Extraction Quality**: HIGH
- **Source Document**: VND-315_PQSecure_Technologies_Inc.html (74.4 KB)
- **Extraction Timestamp**: 2026-09-02T11:58:31

## VND-318 — QANplatform

- **Vendor ID**: VND-318
- **Vendor Name**: QANplatform
- **Roadmap Title**: Roadmap | QANplatform
- **Roadmap URL**: https://learn.qanplatform.com/about-us/roadmap
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-318_QANplatform.html
- **CSV Coverage Notes**: Official QANplatform roadmap page laying out development/audit milestones for its quantum-resistant hybrid Layer-1 blockchain (Dilithium/ML-DSA signatures, XLINK quantum-resistant migration component). Shows QVM Audit and XLINK Audit complete, Integration Audit in progress, MainNet to follow. | Milestone: XLINK (quantum-resistant security component) audit completed; currently in comprehensive Integration Audit (QVM, XLINK, RPC, consensus, governance) ahead of MainNet launch.
- **Roadmap Scope**: Single product
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: QANplatform; QVM; XLINK
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: Yes; quantum-resistant hybrid blockchain platform
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Our vision of launching the world's first quantum-resistant hybrid blockchain platform"
- **Coverage Verification**: PARTIAL; The document confirms the roadmap structure, audit statuses (QVM/XLINK complete, Integration in progress), and the "quantum-resistant hybrid" nature, but it does not explicitly name "Dilithium" or "ML-DSA" in the text provided.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-318_QANplatform.html (455.5 KB)
- **Extraction Timestamp**: 2026-07-07T20:41:12

## VND-319 — QNu Labs Pvt. Ltd.

- **Vendor ID**: VND-319
- **Vendor Name**: QNu Labs Pvt. Ltd.
- **Roadmap Title**: A Strategic Roadmap for Transitioning to Quantum Cyber Readiness
- **Roadmap URL**: https://www.qnulabs.com/blog/cert-in-quantum-cyber-readiness-roadmap
- **Publish Date**: 2026-01-26
- **Local File**: public/vendor-roadmaps/VND-319_QNu_Labs_Pvt._Ltd..html
- **CSV Coverage Notes**: Published QNu Labs strategic roadmap (aligned with CERT-In) for transitioning to quantum-safe cryptography. Four phases: foundational assessment & CBOM/QBOM inventory; technology readiness with hybrid PQC (Kyber/ML-KEM) and QRNG; phased organizational rollout (0-1y groundwork, 1-3y high-risk upgrades, 3+y enterprise-wide); resilience/crypto-agility with QKD. | Milestone: Phased migration framework: prioritize high-risk systems within 3-6 months, mid-term (1-3y) PQC upgrades for high-risk assets, long-term (3+y) enterprise-wide quantum-safe deployment with crypto-agility and QKD.
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: Kyber; ML-KEM
- **Target Migration Dates**: Immediate (0-1 Years); Mid-Term (1-3 Years); Long-Term (3+ Years); high-risk systems within 3–6 months
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: CERT-In
- **Hybrid Mode Support**: Yes; Combining classical algorithms with quantum-resistant ones
- **Current GA Status**: GA
- **Customer Action Required**: Take a quick ‘Quantum Risk Assessment’; Conduct an audit of applications, devices, and protocols; Create a centralized, living inventory of every cryptographic component
- **Key Commitments & Quotes**: "Hybrid Cryptography: Combining classical algorithms with quantum-resistant ones (like Kyber/ ML-KEM ) ensures backward compatibility"
- **Coverage Verification**: CONSISTENT; The document explicitly details the four phases, hybrid PQC (Kyber/ML-KEM), QRNG, QKD, and the specific timeline milestones mentioned in the notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-319_QNu_Labs_Pvt._Ltd..html (89.4 KB)
- **Extraction Timestamp**: 2026-07-07T20:42:05

## VND-322 — Society for Worldwide Interbank Financial Telecommunication SC

- **Vendor ID**: VND-322
- **Vendor Name**: Society for Worldwide Interbank Financial Telecommunication SC
- **Roadmap Title**: Future-proofing the financial ecosystem
- **Roadmap URL**: https://www.swift.com/news-events/news/future-proofing-financial-ecosystem
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-322_Society_for_Worldwide_Interbank_Financial_Telecommunication_SC.html
- **CSV Coverage Notes**: CORRECTION 2026-06-19: the cited 'Future-proofing the financial ecosystem' article is a general piece with only a passing PQC mention, NOT a dedicated PQC roadmap. SWIFT's concrete PQC work is the BIS Project Leap Phase-2 pilot (post-quantum signatures in an operational payment test). Treat as engaged/experimental, not a published roadmap doc.
- **Roadmap Scope**: No PQC content
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: None detected
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: No
- **Current GA Status**: No PQC
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: None detected
- **Coverage Verification**: CONSISTENT; The document is a general strategy piece with only a passing mention of PQC as a future technology, confirming it is not a dedicated roadmap.
- **Extraction Quality**: LOW
- **Source Document**: VND-322_Society_for_Worldwide_Interbank_Financial_Telecommunication_SC.html (173.2 KB)
- **Extraction Timestamp**: 2026-07-07T20:43:09

## VND-327 — Tailscale Inc.

- **Vendor ID**: VND-327
- **Vendor Name**: Tailscale Inc.
- **Roadmap Title**: Post-quantum cryptography - Tailscale Docs
- **Roadmap URL**: https://tailscale.com/kb/1460/post-quantum-cryptography
- **Publish Date**: 2025-05-02
- **Local File**: public/vendor-roadmaps/VND-327_Tailscale_Inc..html
- **CSV Coverage Notes**: Official Tailscale KB doc explaining its PQC strategy. Tailscale's WireGuard is not yet post-quantum secure; rather than altering WireGuard's protocol, Tailscale plans to leverage WireGuard's pre-shared key (PSK) feature and build automatic PSK provisioning/distribution, with the distribution mechanism itself using post-quantum cryptography (e.g., TLS with ML-KEM), to make Tailscale post-quantum secure out of the box in the future. | Milestone: Planned: automatic PSK provisioning/distribution (using ML-KEM-secured distribution) to deliver out-of-the-box post-quantum security; no committed date
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: ML-KEM
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: No
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Eventually, we intend to build automatic PSK provisioning and distribution to devices."
- **Coverage Verification**: CONSISTENT; The document explicitly confirms the strategy of using PSKs with PQC-secured distribution (ML-KEM) to achieve out-of-the-box security, matching the notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-327_Tailscale_Inc..html (200.6 KB)
- **Extraction Timestamp**: 2026-07-07T20:44:08

## VND-329 — Versa Networks, Inc.

- **Vendor ID**: VND-329
- **Vendor Name**: Versa Networks, Inc.
- **Roadmap Title**: Post-Quantum Cryptography (PQC) and Versa: Future-Proofing Enterprise Security Against Quantum Threats
- **Roadmap URL**: https://versa-networks.com/blog/post-quantum-cryptography-pqc-and-versa-future-proofing-enterprise-security-against-quantum-threats/
- **Publish Date**: 2025-03-12
- **Local File**: public/vendor-roadmaps/VND-329_Versa_Networks_Inc..html
- **CSV Coverage Notes**: Official Versa Networks blog describing the company's quantum-safe strategy for its Universal SASE platform: phased, hybrid PQC approach maintaining backward compatibility, with X25519Kyber768 hybrid key exchange integrated and three negotiation fallback scenarios. Aligned to FIPS 140-3 / NIAP. Strategic in scope but lacks explicit dated milestones, so it reads as a strategy blog rather than a dated roadmap. | Milestone: Integration of X25519Kyber768 hybrid PQC key exchange into the Versa SASE platform with dynamic hybrid PQC negotiation/fallback (as of March 2025).
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: Kyber
- **Target Migration Dates**: None detected
- **Products / Services Covered**: VersaONE Platform; Universal SASE platform; VOS
- **Compliance Frameworks**: FIPS 140-3; NIAP
- **Hybrid Mode Support**: Yes; X25519Kyber768 hybrid key exchange
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Versa has taken a proactive approach to PQC by integrating X25519Kyber768 into its security solutions"; "The hybrid PQC negotiation model ensures compatibility with existing cryptographic systems"; "Maintains FIPS 140-3 and NIAP validation for government and enterprise security requirements"
- **Coverage Verification**: CONSISTENT; The document confirms the integration of X25519Kyber768, the three negotiation scenarios, and alignment with FIPS 140-3/NIAP as described in the notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-329_Versa_Networks_Inc..html (162.3 KB)
- **Extraction Timestamp**: 2026-07-07T20:44:59

## VND-341 — Mastercard Incorporated

- **Vendor ID**: VND-341
- **Vendor Name**: Mastercard Incorporated
- **Roadmap Title**: Migration to post-quantum cryptography (Mastercard R&D white paper)
- **Roadmap URL**: https://www.mastercard.com/global/en/news-and-trends/Insights/2025/post-quantum-cryptography-white-paper.html
- **Publish Date**: 2025
- **Local File**: public/vendor-roadmaps/VND-341_Mastercard_Incorporated.html
- **CSV Coverage Notes**: Mastercard R&D white paper (co-authored with NTU Singapore and PQStation) on migrating the financial sector to post-quantum cryptography. Covers the Harvest-Now-Decrypt-Later threat, compares PQC vs QKD (concluding PQC is more practical), and gives strategic migration guidance: build cryptographic inventories, adopt hybrid classical/PQC solutions where practical with full PQC migration later as standards mature. Mastercard is among the most aggressive card networks on PQC (quantum-resistant Ecos contactless cards since Oct 2022, Quantum Security and Communications project, participation in Eur
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: Yes; adopt hybrid classical/PQC solutions where practical
- **Current GA Status**: No PQC
- **Customer Action Required**: proactively plan for a future where quantum-safe practices are the norm
- **Key Commitments & Quotes**: "exploring and adopting quantum-safe technologies, such as Post-Quantum Cryptography and Quantum Key Distribution"
- **Coverage Verification**: PARTIAL; The document confirms the white paper title and general strategic guidance but does not mention co-authors, specific technical comparisons (PQC vs QKD), or specific past products (Ecos cards).
- **Extraction Quality**: LOW
- **Source Document**: VND-341_Mastercard_Incorporated.html (146.9 KB)
- **Extraction Timestamp**: 2026-07-07T20:40:10

## VND-351 — SatoshiLabs s.r.o.

- **Vendor ID**: VND-351
- **Vendor Name**: SatoshiLabs s.r.o.
- **Roadmap Title**: Going quantum: our choices for Trezor Safe 7's quantum readiness
- **Roadmap URL**: https://trezor.io/guides/trezor-devices/trezor-safe-7/going-quantum
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-351_SatoshiLabs_s.r.o..html
- **CSV Coverage Notes**: SatoshiLabs (Trezor) published its quantum-readiness strategy for the Trezor Safe 7 hardware wallet. Three-layer security architecture (boardloader/bootloader/firmware) designed for post-quantum verification. Uses SLH-DSA-128 (hybrid with Ed25519) for quantum-secure boot and ML-DSA-44 for device attestation; each device ships with a post-quantum device certificate. References NIST 2035 transition framework as forward context. | Milestone: Trezor Safe 7 launched as the first quantum-ready hardware wallet with PQC-protected boot (SLH-DSA-128) and device attestation (ML-DSA-44); positioned for fu
- **Roadmap Scope**: Single product
- **PQC Algorithms Announced**: SLH-DSA; ML-DSA
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Trezor Safe 7
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: Yes; hybrid scheme with SLH-DSA and EdDSA (Ed25519)
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Trezor Safe 7 can run post-quantum updates, but these updates don't exist yet."; "Each Trezor Safe 7 is quantum-ready from the moment it powers on."; "We chose ML-DSA-44 , a lattice-based algorithm standardized by NIST."
- **Coverage Verification**: CONSISTENT; The document confirms the Trezor Safe 7 strategy, the three-layer architecture, the use of SLH-DSA-128 hybrid with Ed25519 for boot, ML-DSA-44 for attestation, and the NIST 2035 context.
- **Extraction Quality**: HIGH
- **Source Document**: VND-351_SatoshiLabs_s.r.o..html (540.7 KB)
- **Extraction Timestamp**: 2026-07-07T20:42:05

## VND-352 — TOPPAN Digital Inc.

- **Vendor ID**: VND-352
- **Vendor Name**: TOPPAN Digital Inc.
- **Roadmap Title**: TOPPAN Digital, NICT, and ISARA Develop Smart Card System Employing Hybrid Methodology to Support Post-Quantum Cryptography and Current Public-key Cryptography
- **Roadmap URL**: https://www.holdings.toppan.com/en/news/2024/10/newsrelease241007_1.html
- **Publish Date**: 2024-10-07
- **Local File**: public/vendor-roadmaps/VND-352_TOPPAN_Digital_Inc..html
- **CSV Coverage Notes**: TOPPAN Digital (subsidiary of TOPPAN Holdings) lays out a phased PQC migration roadmap for its smart-card/secure-element products. SecureBridge uses a hybrid methodology supporting both ML-DSA (NIST PQC signature, Aug 2024) and ECDSA, enabling phased migration and continued use of existing crypto-assets. Roadmap: limited practical implementations in 2025 in high-security sectors (healthcare, finance), targeting full-scale deployment of SecureBridge in 2030. Related products (Edge Safe, Secure Activate Service, PQC CARD) extend PQC across IoT and card systems. Timeline corroborated by The Quant
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: ML-DSA
- **Target Migration Dates**: limited practical implementations in 2025; full-scale deployment of SecureBridge in 2030
- **Products / Services Covered**: SecureBridge; PQC CARD
- **Compliance Frameworks**: NIST FIPS
- **Hybrid Mode Support**: Yes; supports both PQC and current public-key cryptography
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Targeting full-scale deployment of SecureBridge in 2030"; "planning limited practical implementations in 2025"; "developed SecureBridge, a smart card system capable of supporting both currently used public-key cryptography and post-quantum cryptography"
- **Coverage Verification**: PARTIAL; The document confirms the SecureBridge roadmap, ML-DSA/ECDSA hybrid support, and 2025/2030 timeline, but does not mention Edge Safe or Secure Activate Service.
- **Extraction Quality**: HIGH
- **Source Document**: VND-352_TOPPAN_Digital_Inc..html (63.7 KB)
- **Extraction Timestamp**: 2026-07-07T20:44:08

## VND-355 — Trezor Company s.r.o.

- **Vendor ID**: VND-355
- **Vendor Name**: Trezor Company s.r.o.
- **Roadmap Title**: What quantum-ready crypto security means and why it matters
- **Roadmap URL**: https://trezor.io/blog/security/what-quantum-ready-crypto-security-means-and-why-it-matters
- **Publish Date**: 2026-03-16
- **Local File**: public/vendor-roadmaps/VND-355_Trezor_Company_s.r.o..html
- **CSV Coverage Notes**: SatoshiLabs/Trezor blog framing quantum readiness as a two-layer problem (blockchains and the wallets securing keys), focused on device-level security it controls. Trezor Safe 7 ships with NIST-standardized PQC built into manufacturing: SLH-DSA-128 (hybrid with EdDSA/Ed25519) for boot/firmware-signature verification and ML-DSA-44 for device attestation. Positions itself as 'prepared by principle' for threats over the next decade, aligned to NIST's 2035 transition target. | Milestone: Trezor Safe 7 shipping with PQC-protected boot (SLH-DSA-128) and device attestation (ML-DSA-44); plans to exten
- **Roadmap Scope**: Single product
- **PQC Algorithms Announced**: SLH-DSA; ML-DSA
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Trezor Safe 7
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: No
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "The Trezor Safe 7 is ready to secure these operations with post-quantum algorithms."
- **Coverage Verification**: PARTIAL; The document confirms the two-layer framing, Safe 7 focus, and algorithms, but does not mention EdDSA hybridization or the 2035 NIST target.
- **Extraction Quality**: HIGH
- **Source Document**: VND-355_Trezor_Company_s.r.o..html (538.3 KB)
- **Extraction Timestamp**: 2026-07-07T20:44:08

## VND-367 — Cohesity

- **Vendor ID**: VND-367
- **Vendor Name**: Cohesity
- **Roadmap Title**: The Cohesity post-quantum cryptography strategy
- **Roadmap URL**: https://www.cohesity.com/blogs/the-cohesity-post-quantum-cryptography-strategy/
- **Publish Date**: 2024-12-12
- **Local File**: public/vendor-roadmaps/VND-367_Cohesity.html
- **CSV Coverage Notes**: Official Cohesity blog laying out a four-phase PQC strategy: monitor (track quantum advances), extend (prolong current crypto viability, e.g. migrate to 4096-bit RSA), adopt (implement NIST-standardized PQC algorithms standardized summer 2024), and wait (transition to quantum cryptography later). References regulatory timelines (NSM-10 transition by 2035, NIST deprecation after 2030 / disallow after 2035) and notes AES-256 remains resilient against quantum attacks. | Milestone: Adopt phase: implementing NIST-standardized PQC algorithms and extending current cryptography (4096-bit RSA) while al
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: 2035
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: FIPS 140-3; NSM-10
- **Hybrid Mode Support**: No
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Our strategy has four steps, summed up in four words: monitor, extend, adopt, and wait."; "National Security Memorandum 10 called for transitioning away from as much quantum-vulnerable cryptography as possible by 2035."; "it’s evident that the industry needs to begin adopting post-quantum cryptography now to limit the damage of Harvest Now Decrypt Later (HNDL) attacks"
- **Coverage Verification**: CONSISTENT; The document explicitly details the four-phase strategy (monitor, extend, adopt, wait), references NSM-10 and NIST timelines (2030/2035), mentions 4096-bit RSA migration, and confirms AES-256 resilience.
- **Extraction Quality**: HIGH
- **Source Document**: VND-367_Cohesity.html (184.3 KB)
- **Extraction Timestamp**: 2026-07-07T20:37:20

## VND-368 — Commvault

- **Vendor ID**: VND-368
- **Vendor Name**: Commvault
- **Roadmap Title**: Future-Proofing Your Data: Post-Quantum Cryptography and Beyond
- **Roadmap URL**: https://www.commvault.com/blogs/future-proofing-your-data-post-quantum-cryptography-and-beyond
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-368_Commvault.html
- **CSV Coverage Notes**: Commvault maintains a dedicated PQC content hub (commvault.com/explore/post-quantum-cryptography) plus strategy blogs describing a crypto-agility framework that lets customers update algorithms without overhauling systems. Commvault Cloud (CPR 2024) uses CRYSTALS-Kyber (KEM) and CRYSTALS-Dilithium3/FALCON (signatures), supports SPHINCS+, and added NIST's HQC algorithm to defend against harvest-now-decrypt-later, aligning to NIST FIPS 203/204/205 (Aug 2024). | Milestone: Integrated NIST's HQC algorithm and expanded crypto-agile PQC support (Kyber/Dilithium/FALCON/SPHINCS+) within Commvault Clou
- **Roadmap Scope**: Single product
- **PQC Algorithms Announced**: CRYSTALS-Kyber; CRYSTALS-Dilithium3; Falcon; Sphincs+
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Commvault Cloud CPR 2024
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: No
- **Current GA Status**: GA
- **Customer Action Required**: Use Security IQ to gain insights into security posture
- **Key Commitments & Quotes**: "Commvault has chosen to implement it to safeguard your data."
- **Coverage Verification**: MISMATCH; The document does not mention HQC, NIST FIPS 203/204/205, or the dedicated PQC content hub URL.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-368_Commvault.html (106.8 KB)
- **Extraction Timestamp**: 2026-07-07T20:37:20

## VND-371 — Red Hat (Dogtag)

- **Vendor ID**: VND-371
- **Vendor Name**: Red Hat (Dogtag)
- **Roadmap Title**: Red Hat's path to post-quantum cryptography
- **Roadmap URL**: https://www.redhat.com/en/blog/red-hats-path-post-quantum-cryptography
- **Publish Date**: 2024-07-15
- **Local File**: public/vendor-roadmaps/VND-371_Red_Hat_Dogtag_.html
- **CSV Coverage Notes**: Red Hat published a strategic three-phase PQC roadmap (Classical -> Post-Quantum Capable -> Post-Quantum Ready) aligning with US/EU/Czech/German/French government timelines and NIST standardization. A follow-up strategy update, 'Building the levee: Why Red Hat's post-quantum strategy is already in production' (2026-05-25, https://www.redhat.com/en/blog/building-levee-why-red-hats-post-quantum-strategy-already-production), details concrete milestones: RHEL 10 first practical PQC steps (May 2025), RHEL 10.1 enabling PQC by default and being the first major distro to sign RPM packages with ML-DSA
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: NIST; IETF
- **Hybrid Mode Support**: Yes; supports approved hybrid schemes combining classical and post-quantum algorithms
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Red Hat is committed to providing customers with functional, quantum-resistant security capabilities as the industry evolves, develops and begins integrating these new cryptographic functions."
- **Coverage Verification**: PARTIAL; The document confirms the three-phase roadmap and government alignment but does not mention the follow-up blog post, RHEL 10/10.1 milestones, or ML-DSA.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-371_Red_Hat_Dogtag_.html (610.2 KB)
- **Extraction Timestamp**: 2026-07-07T20:42:05

## VND-374 — F5

- **Vendor ID**: VND-374
- **Vendor Name**: F5
- **Roadmap Title**: Understanding PQC Standards and Timelines
- **Roadmap URL**: https://www.f5.com/company/blog/understanding-pqc-standards-and-timelines
- **Publish Date**: 2025-07-24
- **Local File**: public/vendor-roadmaps/VND-374_F5.html
- **CSV Coverage Notes**: F5 strategic PQC transition guide outlining NIST-finalized algorithms (FIPS 203/204/205, HQC expected 2027) and a phased migration: 2025-2027 inventory crypto assets and deploy PQC at the edge, US federal migration by 2030, national security systems fully quantum-resistant by 2035. Complemented by F5's PQC readiness solutions page and hybrid TLS approach. | Milestone: 2025-2027: inventory cryptographic assets and deploy hybrid PQC (quantum-safe TLS) at the network edge, ahead of the 2030 federal migration target.
- **Roadmap Scope**: Algorithm/standard reference
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA; HQC
- **Target Migration Dates**: By 2030: U.S. federal agencies must migrate to PQC; By 2035: National security systems must be fully quantum-resistant
- **Products / Services Covered**: F5 Application Delivery and Security Platform (ADSP)
- **Compliance Frameworks**: NIST FIPS 203; NIST FIPS 204; NIST FIPS 205
- **Hybrid Mode Support**: Yes; enable deployment of hybrid classical and PQC algorithms
- **Current GA Status**: No PQC
- **Customer Action Required**: Inventory cryptographic footprint; deploy edge platforms with PQC capabilities; engage vendors on quantum readiness; prioritize PQC protection of backups and sensitive data
- **Key Commitments & Quotes**: "By 2030: U.S. federal agencies must migrate to PQC"; "By 2035: National security systems must be fully quantum-resistant"; "The shift to quantum-resistant security is no longer optional—it’s a strategic necessity."
- **Coverage Verification**: CONSISTENT; The document confirms the NIST standards, HQC timeline, federal/national security deadlines, and the strategic advice to inventory assets and deploy edge PQC, aligning with the CSV notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-374_F5.html (354.8 KB)
- **Extraction Timestamp**: 2026-07-07T20:39:09

## VND-379 — Hewlett Packard Enterprise

- **Vendor ID**: VND-379
- **Vendor Name**: Hewlett Packard Enterprise
- **Roadmap Title**: HPE Introduces Sweeping Security Advancements to Secure AI Adoption and Strengthen Enterprise Resiliency
- **Roadmap URL**: https://www.businesswire.com/news/home/20260324083438/en/HPE-Introduces-Sweeping-Security-Advancements-to-Secure-AI-Adoption-and-Strengthen-Enterprise-Resiliency
- **Publish Date**: 2026-03-24
- **Local File**: public/vendor-roadmaps/VND-379_Hewlett_Packard_Enterprise.html
- **CSV Coverage Notes**: HPE press release describing portfolio-wide quantum-safe security advancements with a phased crypto-agility approach: NIST FIPS 203/204 alignment, PQC-ready Junos OS Evolved (with broader Junos PQC support, software signing on FIPS 204, and Quantum Buffer for SSH), and PQC-capable HPE ProLiant Gen12 / iLO 7 silicon root of trust aligned to CNSA 2.0. Emphasizes standards alignment, supply-chain security, and customer migration paths. | Milestone: PQC support to extend more broadly across Junos OS in summer 2026 (FIPS 203/204 libraries); HPE ProLiant Gen12 with iLO 7 embedded PQC/CNSA 2.0 capabi
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: Summer 2026
- **Products / Services Covered**: Junos OS Evolved; Junos OS; HPE ProLiant Compute Gen12 servers; HPE Integrated Lights-Out (iLO) 7
- **Compliance Frameworks**: NIST FIPS 203/204
- **Hybrid Mode Support**: No
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "HPE has added post-quantum cryptography (PQC)-ready capabilities to Junos OS Evolved and will extend PQC support more broadly to Junos in summer 2026."
- **Coverage Verification**: PARTIAL; The document confirms the Junos and iLO 7 milestones and FIPS 203/204 alignment, but does not explicitly mention CNSA 2.0 alignment or "Quantum Buffer for SSH" in the provided text.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-379_Hewlett_Packard_Enterprise.html (381.0 KB)
- **Extraction Timestamp**: 2026-07-07T20:34:37

## VND-390 — NetApp

- **Vendor ID**: VND-390
- **Vendor Name**: NetApp
- **Roadmap Title**: Post-Quantum Cryptography | NetApp
- **Roadmap URL**: https://www.netapp.com/cyber-resilience/post-quantum-cryptography/
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-390_NetApp.html
- **CSV Coverage Notes**: NetApp maintains a dedicated cyber-resilience PQC strategy hub describing its plan to embed NIST-approved PQC algorithms (CRYSTALS-Kyber/ML-KEM, Dilithium) for data at rest and in flight, using hybrid cryptography to let enterprises transition to quantum-safe encryption with minimal disruption and without architectural overhauls. Backed by a 'NetApp Roadmap Brief' solution PDF and a partnership with F5 (BIG-IP hybrid key agreement for StorageGRID). | Milestone: PQC for data at rest declared NIST-PQC compliant and integrated into ONTAP (PQC in ONTAP 9.18.1); joint F5+NetApp AI + PQC security so
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: CRYSTALS-Kyber; CRYSTALS-Dilithium
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: No
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "By embedding post-quantum cryptography (PQC) into our storage, we proactively neutralize quantum threats before they materialize."; "Integrated, NIST-approved PQC algorithms keep data secure at rest and in flight."
- **Coverage Verification**: PARTIAL; The document confirms the portfolio-wide strategy and NIST alignment but does not mention specific products (ONTAP, StorageGRID), the F5 partnership, or specific version milestones cited in the notes.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-390_NetApp.html (307.8 KB)
- **Extraction Timestamp**: 2026-07-07T20:40:10

## VND-391 — Nord Security

- **Vendor ID**: VND-391
- **Vendor Name**: Nord Security
- **Roadmap Title**: NordVPN launches post-quantum encryption across all applications
- **Roadmap URL**: https://nordsecurity.com/press-area/nordvpn-launches-post-quantum-encryption-across-all-its-applications
- **Publish Date**: 2025-05-22
- **Local File**: public/vendor-roadmaps/VND-391_Nord_Security.html
- **CSV Coverage Notes**: (2026-07-01: backfilled publish_date to 2025-05-22, determined from the press release content.)
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: NordVPN Linux, Windows, macOS, iOS, Android, Android TV, tvOS
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: No
- **Current GA Status**: GA
- **Customer Action Required**: Enable PQE with a toggle switch under “Connections” in “Settings”
- **Key Commitments & Quotes**: "NordVPN, a leading cybersecurity company, announces the launch of post-quantum encryption (PQE) support for all its VPN applications"
- **Coverage Verification**: CONSISTENT; The document text explicitly states the date "May 22, 2025", which matches the backfilled publish_date in the CSV notes.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-391_Nord_Security.html (85.5 KB)
- **Extraction Timestamp**: 2026-07-07T20:41:12

## VND-395 — OpenText

- **Vendor ID**: VND-395
- **Vendor Name**: OpenText
- **Roadmap Title**: Preparing for post-quantum cryptography with OpenText SAST and DAST
- **Roadmap URL**: https://blogs.opentext.com/preparing-for-post-quantum-cryptography-with-opentext-sast-and-dast/
- **Publish Date**: 2025-10-23
- **Local File**: public/vendor-roadmaps/VND-395_OpenText.html
- **CSV Coverage Notes**: OpenText blog outlining a phased PQC capability plan for its application security tools. SAST/DAST 25.4 (Oct 2025) add detection of quantum-vulnerable cryptography (new 'Weak Encryption: Non-PQC Resilient Algorithm' category; DAST flags servers lacking TLS 1.3 X25519MLKEM768 hybrid key exchange). Roadmap extensions: expand coverage beyond RSA/DSA, key-length adequacy analysis, multi-language SAST support, and additional ML-KEM permutations and standardized PQC handshakes for DAST. | Milestone: OpenText SAST and DAST 25.4 (Oct 2025) shipped detection of quantum-vulnerable algorithms and absence
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA
- **Target Migration Dates**: None detected
- **Products / Services Covered**: OpenText SAST; OpenText DAST
- **Compliance Frameworks**: NIST FIPS 203; NIST FIPS 204; NIST FIPS 205; CNSA 2.0; NSM-10
- **Hybrid Mode Support**: Yes; TLS 1.3 hybrid key exchange (X25519MLKEM768)
- **Current GA Status**: GA
- **Customer Action Required**: Enable feature flag com.fortify.sca.rules.enablePQCRules in SAST to detect quantum-vulnerable algorithms
- **Key Commitments & Quotes**: "OpenText Application Security is committed to helping you navigate it successfully."
- **Coverage Verification**: CONSISTENT; The document explicitly confirms the release of SAST/DAST 25.4 in Oct 2025 with the specified detection categories and roadmap extensions.
- **Extraction Quality**: HIGH
- **Source Document**: VND-395_OpenText.html (105.1 KB)
- **Extraction Timestamp**: 2026-07-07T20:41:12

## VND-409 — Veeam

- **Vendor ID**: VND-409
- **Vendor Name**: Veeam
- **Roadmap Title**: Veeam on Quantum Readiness: Preparing for PQC
- **Roadmap URL**: https://www.veeam.com/blog/quantum-readiness-pqc.html
- **Publish Date**: 2026-04-24
- **Local File**: public/vendor-roadmaps/VND-409_Veeam.html
- **CSV Coverage Notes**: Veeam outlines a three-principle PQC adoption strategy: align to NIST standards/authoritative guidance (FIPS 203/204/205), coordinate with upstream cryptographic providers (OpenSSL) and platform vendors, and design for crypto agility with staged adoption. Expects 2027-2030 ecosystem readiness window; will integrate PQC when underlying libraries are enterprise-ready, validated, and supportable. Maintains FIPS 140-3 (cert #5156); partnered with Entrust for PQC-backed cyber recovery. | Milestone: Veeam Data Platform v13.1 introduces post-quantum cryptography to safeguard backups; broader rollout
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA
- **Target Migration Dates**: 2027 to 2030 ecosystem readiness window
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: NIST FIPS 203; NIST FIPS 204; NIST FIPS 205; FIPS 140-3; CNSA 2.0
- **Hybrid Mode Support**: Yes; guidance for hybrid modes and hybrid negotiation
- **Current GA Status**: Planned
- **Customer Action Required**: Inventory cryptographic dependencies; validate crypto agility; engage Veeam for workshops and pilots
- **Key Commitments & Quotes**: "Veeam’s adoption strategy for PQC emphasizes three principles."
- **Coverage Verification**: PARTIAL; The document confirms the three-principle strategy, NIST alignment, OpenSSL coordination, 2027-2030 window, and FIPS 140-3 cert #5156, but does not mention the Entrust partnership or the Veeam Data Platform v13.1 milestone.
- **Extraction Quality**: HIGH
- **Source Document**: VND-409_Veeam.html (249.1 KB)
- **Extraction Timestamp**: 2026-07-07T20:44:59

## VND-423 — IBM Research (CBOMkit)

- **Vendor ID**: VND-423
- **Vendor Name**: IBM Research (CBOMkit)
- **Roadmap Title**: IBM bringing organizations along the quantum-safe journey (IBM Quantum Safe roadmap)
- **Roadmap URL**: https://research.ibm.com/blog/quantum-safe-roadmap
- **Publish Date**: 2023-05-10
- **Local File**: public/vendor-roadmaps/VND-423_IBM_Research_CBOMkit_.html
- **CSV Coverage Notes**: IBM Research's official Quantum Safe roadmap presenting a three-phase strategic blueprint: Discover (cryptography inventory / CBOM via Explorer and Advisor), Observe (analyze cryptographic posture and prioritize vulnerabilities), and Transform (remediate with crypto-agility). The roadmap ties phases to external milestones: NIST publishing PQC standards in 2024 and NSA/CNSA requirements for quantum-safe algorithms in national security systems by 2025. CBOMkit (now contributed to the Post-Quantum Cryptography Alliance) supports the Discover phase. This is a genuine strategic timeline document, n
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: CRYSTALS-Kyber; CRYSTALS-Dilithium; Falcon
- **Target Migration Dates**: NIST publishing PQC standards in 2024; NSA requiring quantum-safe algorithms in national security systems by 2025
- **Products / Services Covered**: IBM Quantum Safe Explorer; IBM Quantum Safe Advisor; IBM Quantum Safe Remediator; IBM z16; IBM Tape
- **Compliance Frameworks**: NIST; NSA/CNSA 2.0; FIPS
- **Hybrid Mode Support**: Yes; hybrid implementation approach using classical and quantum-safe cryptography
- **Current GA Status**: GA
- **Customer Action Required**: Complete cryptography inventory and create a CBOM; begin quantum-safe transition
- **Key Commitments & Quotes**: "This roadmap serves as a commitment to transparency, predictability, and confidence as we guide industries along their journey to post-quantum cryptography."
- **Coverage Verification**: CONSISTENT; The document explicitly details the three-phase roadmap (Discover, Observe, Transform) with the specified tools and external milestones.
- **Extraction Quality**: HIGH
- **Source Document**: VND-423_IBM_Research_CBOMkit_.html (84.2 KB)
- **Extraction Timestamp**: 2026-07-07T20:39:09

## VND-433 — OpenBao (LF Edge)

- **Vendor ID**: VND-433
- **Vendor Name**: OpenBao (LF Edge)
- **Roadmap Title**: RFC - Post-Quantum Cryptography Migration Roadmap
- **Roadmap URL**: https://github.com/openbao/openbao/issues/496
- **Publish Date**: 2024-08-30
- **Local File**: public/vendor-roadmaps/VND-433_OpenBao_LF_Edge_.html
- **CSV Coverage Notes**: Official OpenBao RFC design document laying out a phased PQC migration plan following NIST's Aug 2024 standards finalization. Catalogs cryptographic uses across impact, migration difficulty, and failure risk; priority areas include TLS listeners, PKI/SSH CAs, Transit keys, auto-unseal, and JWT/OIDC. Addresses harvest-now-decrypt-later risk and emphasizes incremental, independent migration of each subsystem with user-selectable hybrid/pure PQC algorithms in Transit and PKI. | Milestone: RFC-stage roadmap defining blocking requirements (crypto library availability via Go stdlib/CIRCL, X.509/TLS/
- **Roadmap Scope**: Single product
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: OpenBao
- **Compliance Frameworks**: NIST; FIPS 185-5
- **Hybrid Mode Support**: Yes; user-selectable hybrid/pure PQC algorithms in Transit and PKI
- **Current GA Status**: Planned
- **Customer Action Required**: Explicitly handle key type choices and CA/issuer migrations; no automatic migration will occur
- **Key Commitments & Quotes**: "OpenBao needs to be hardened against quantum adversaries"; "we should start considering our own quantum roadmap"; "Introducing additional algorithms before standardization should be strictly avoided"
- **Coverage Verification**: CONSISTENT; The document is an OpenBao RFC detailing a phased migration plan post-NIST Aug 2024, cataloging crypto uses by impact/risk, listing priority areas (TLS, PKI, Transit, etc.), addressing HNDL, and noting hybrid options and library dependencies.
- **Extraction Quality**: HIGH
- **Source Document**: VND-433_OpenBao_LF_Edge_.html (338.4 KB)
- **Extraction Timestamp**: 2026-07-07T20:41:12


## VND-018 — Google LLC

- **Vendor ID**: VND-018
- **Vendor Name**: Google LLC
- **Roadmap Title**: Google's timeline for PQC migration
- **Roadmap URL**: https://blog.google/innovation-and-ai/technology/safety-security/cryptography-migration-timeline/
- **Publish Date**: Unknown
- **Local File**: vendor-roadmaps/VND-018_Google_LLC.html
- **CSV Coverage Notes**: None
- **PQC Algorithms Announced**: ML-DSA
- **Target Migration Dates**: 2029
- **Products / Services Covered**: Android 17; Google Chrome; Cloud
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: None detected
- **Current GA Status**: GA
- **Customer Action Required**: Follow suit to prioritize PQC migration for authentication services
- **Key Commitments & Quotes**: "We’re setting a timeline for post-quantum cryptography migration to 2029."; "Android 17 is integrating PQC digital signature protection using ML-DSA"; "provide the clarity and urgency needed to accelerate digital transitions"
- **Coverage Verification**: CONSISTENT — The document provides a high-level timeline and product mentions but lacks the specific technical details implied by "Not specified" in the notes, making the lack of detail consistent.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-018_Google_LLC.html (360.0 KB)
- **Extraction Timestamp**: 2026-09-07T11:01:13


## VND-032 — Red Hat Inc.

- **Vendor ID**: VND-032
- **Vendor Name**: Red Hat Inc.
- **Roadmap Title**: What's new in post-quantum cryptography in RHEL 10.1
- **Roadmap URL**: https://www.redhat.com/en/blog/whats-new-post-quantum-cryptography-rhel-101
- **Publish Date**: Unknown
- **Local File**: vendor-roadmaps/VND-032_Red_Hat_Inc.html
- **CSV Coverage Notes**: None
- **PQC Algorithms Announced**: ML-KEM; ML-DSA
- **Target Migration Dates**: None detected
- **Products / Services Covered**: RHEL 10.1; OpenSSL; GnuTLS; NSS; Go; Sequoia-PGP
- **Compliance Frameworks**: NIST; European Cyber Resilience Act
- **Hybrid Mode Support**: Yes, hybrid PQC key exchange in TLS and hybrid post-quantum signatures (ML-DSA-87 + Ed448) for RPM packages.
- **Current GA Status**: GA
- **Customer Action Required**: Start testing hybrid PQC key exchange in TLS deployments; make plans for dual classic/PQC TLS certificate servers; roll out PQC key exchange; test dual classic/PQC TLS certificate setups.
- **Key Commitments & Quotes**: "post-quantum cryptography with Module-Lattice-Based Key Encapsulation Mechanism (ML-KEM) and ML-DSA in TLS is generally available and fully supported"; "RHEL 10.1 now includes this implementation"; "RHEL is the first and currently only major Linux distribution to achieve this milestone"
- **Coverage Verification**: CONSISTENT, the document details specific PQC features in RHEL 10.1, confirming the roadmap title.
- **Extraction Quality**: HIGH
- **Source Document**: VND-032_Red_Hat_Inc.html (358.3 KB)
- **Extraction Timestamp**: 2026-09-07T11:01:48


## VND-553 — Tencent

- **Vendor ID**: VND-553
- **Vendor Name**: Tencent
- **Roadmap Title**: PQC InfoHub - Tencent Post-Quantum Cryptography Information Center
- **Roadmap URL**: https://pqc.tencent.com/en
- **Publish Date**: Unknown
- **Local File**: vendor-roadmaps/VND-553_Tencent.html
- **CSV Coverage Notes**: None
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: None detected
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: None detected
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Tencent Cloud has also initiated preliminary research and planning for post-quantum migration since the end of 2024."
- **Coverage Verification**: CONSISTENT. The document is a general information hub description and does not specify product-level coverage details.
- **Extraction Quality**: LOW
- **Source Document**: VND-553_Tencent.html (89.6 KB)
- **Extraction Timestamp**: 2026-09-07T11:02:48

