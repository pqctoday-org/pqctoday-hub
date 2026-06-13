---
generated: 2026-06-07
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
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Elastic Load Balancers (ALB, NLB); API Gateway; CloudFront; Transfer Family; AWS Key Management Service (KMS); AWS Certificate Manager (ACM); AWS Secrets Manager; AWS Payment Cryptography; Amazon Simple Storage Service (S3); AWS Private Certificate Authority (Private CA); AWS CloudHSM; IAM Roles Anywhere
- **Compliance Frameworks**: NIST FIPS 203; NIST FIPS 204; NIST FIPS 205; NIST IR 8547
- **Hybrid Mode Support**: Yes, document states services offer "hybrid PQ-key exchange using ML-KEM" and references BSI recommendation for hybrid approaches.
- **Current GA Status**: GA
- **Customer Action Required**: Update client-side components/SDKs to versions supporting ML-KEM; apply PQ-TLS policies to customer-owned resources; ensure applications use TLS 1.3; update infrastructure-as-code to explicitly specify TLS policies.
- **Key Commitments & Quotes**: "AWS is migrating to post-quantum cryptography (PQC), and helping our customers do the same under a shared responsibility model."
- **Coverage Verification**: PARTIAL, the document confirms the listed services and algorithms but does not explicitly mention the underlying libraries "AWS-LC and s2n-tls" found in the CSV notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-001_Amazon_Web_Services_Inc..html (311.1 KB)
- **Extraction Timestamp**: 2026-06-06T20:45:13

## VND-002 — Apple Inc.

- **Vendor ID**: VND-002
- **Vendor Name**: Apple Inc.
- **Roadmap Title**: Quantum-secure cryptography in Apple operating systems
- **Roadmap URL**: https://support.apple.com/guide/security/quantum-secure-cryptography-apple-devices-secc7c82e533/web
- **Publish Date**: 2024-02-21
- **Local File**: public/vendor-roadmaps/VND-002_Apple_Inc..html
- **CSV Coverage Notes**: None
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: ML-KEM; ML-DSA
- **Target Migration Dates**: None detected
- **Products / Services Covered**: iOS 17.4; iPadOS 17.4; macOS 14.4; watchOS 10.4; iOS 26; iPadOS 26; macOS 26; tvOS 26; watchOS 26; iMessage; TLS; HTTPS; VPN; SSH; Apple Watch; CryptoKit
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: Yes, Apple is adopting hybrid cryptography, which combines classic algorithms and new post-quantum algorithms.
- **Current GA Status**: GA
- **Customer Action Required**: Developers must use algorithms in well-analyzed protocols to ensure they correctly use and combine them.
- **Key Commitments & Quotes**: "Apple is adopting hybrid cryptography, which combines classic algorithms and new post-quantum algorithms"
- **Coverage Verification**: CONSISTENT, the document details specific PQC implementations across multiple operating systems and services, confirming the vendor's active roadmap.
- **Extraction Quality**: HIGH
- **Source Document**: VND-002_Apple_Inc..html (287.1 KB)
- **Extraction Timestamp**: 2026-06-06T20:23:19

## VND-005 — BlackBerry Limited

- **Vendor ID**: VND-005
- **Vendor Name**: BlackBerry Limited
- **Roadmap Title**: BlackBerry & NXP: Preparing Against Y2Q Post-Quantum Cyber Attacks (Certicom + QNX)
- **Roadmap URL**: https://www.prnewswire.com/news-releases/blackberry-and-nxp-join-forces-to-help-companies-prepare-for-and-prevent-y2q-post-quantum-cyber-attacks-301554427.html
- **Publish Date**: 2022-05-25
- **Local File**: public/vendor-roadmaps/VND-005_BlackBerry_Limited.html
- **CSV Coverage Notes**: BlackBerry has no single consolidated PQC roadmap page; its PQC work runs through the Certicom division and QNX. Official BlackBerry/NXP press release describes Certicom Code Signing & Key Management Server using CRYSTALS-Dilithium (ML-DSA) for quantum-resistant code/firmware/OTA signing and SBOMs on NXP S32G; QNX secure boot uses quantum-safe signatures. BlackBerry/Certicom states it is deploying finalized NIST standards (ML-KEM, ML-DSA, SLH-DSA, HQC). | Milestone: BlackBerry Certicom Code Signing and Key Management Server uses CRYSTALS-Dilithium (ML-DSA) for quantum-resistant secure boot, fi
- **Roadmap Scope**: Single product
- **PQC Algorithms Announced**: ML-DSA; Dilithium
- **Target Migration Dates**: None detected
- **Products / Services Covered**: BlackBerry Certicom Code Signing and Key Management Server
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: No
- **Current GA Status**: Planned
- **Customer Action Required**: Register to attend the webinar
- **Key Commitments & Quotes**: "BlackBerry Limited ... today announced it will provide support for quantum-resistant secure boot signatures for NXP® Semiconductors' ... S32G vehicle networking processors"
- **Coverage Verification**: PARTIAL, the document confirms the Certicom Code Signing and Key Management Server using Dilithium (ML-DSA) for NXP S32G, but does not mention QNX, ML-KEM, SLH-DSA, or HQC.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-005_BlackBerry_Limited.html (205.0 KB)
- **Extraction Timestamp**: 2026-06-06T20:45:43

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
- **Target Migration Dates**: 25.10 ships PQC; 26.04 LTS makes hybrid key exchange default; 28.04 LTS targets Hybrid Secure Boot
- **Products / Services Covered**: Ubuntu 25.10; Ubuntu 26.04 LTS; Ubuntu 28.04 LTS; OpenSSL 3.5; OpenSSH 10.0+; libgcrypt; wolfssl; rustls; Nginx
- **Compliance Frameworks**: NIST FIPS 203; NIST FIPS 204; NIST FIPS 205; FIPS-206
- **Hybrid Mode Support**: Yes, Ubuntu retains hybrid key exchange (e.g., X25519MLKEM768) as the default for TLS/SSH to ensure security if one component fails.
- **Current GA Status**: GA
- **Customer Action Required**: Experiment with algorithms, report bugs, share feedback, and upgrade to Ubuntu 26.04 for recommended PQ support.
- **Key Commitments & Quotes**: "Ubuntu has chosen to retain hybrid key exchange as the default"; "26.04 LTS makes hybrid key exchange... the default for TLS/SSH automatically"; "Hybrid Secure Boot... could realistically appear around the 28.04 LTS timeframe"
- **Coverage Verification**: CONSISTENT, the document confirms the author, timeline, specific libraries, and hybrid default strategy for 26.04 LTS and 28.04 LTS as described in the notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-006_Canonical_Ltd..html (37.4 KB)
- **Extraction Timestamp**: 2026-06-06T21:13:58

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
- **Products / Services Covered**: R82 (Site-to-Site VPNs); R82.10 (Quantum-Safe TLS and HTTPS Inspection); Remote Access VPN clients (Windows, macOS, Linux)
- **Compliance Frameworks**: NIST FIPS 203; NIST FIPS 204; NIST FIPS 205; RFC 9370; RFC 9242; RFC 8784
- **Hybrid Mode Support**: Yes, hybrid IKEv2 key exchange combining classical Diffie-Hellman with ML-KEM
- **Current GA Status**: GA (R82 QSKE); Early Availability (R82.10 TLS Inspection)
- **Customer Action Required**: Upgrade to R82 to allow Post-Quantum Hybrid Key Exchange on critical VPNs; join Early Availability program for R82.10
- **Key Commitments & Quotes**: "Check Point delivers Post-Quantum Hybrid Key Exchange in the R82 release"; "Support for ML-DSA and SLH-DSA will be introduced as PKI tooling and ecosystem support mature"; "Check Point plans to introduce QKD integration for specialized, high-assurance environments"
- **Coverage Verification**: PARTIAL, the document confirms all roadmap items except the specific commitment for the SIC framework to shift to ML-DSA when FIPS libraries are available.
- **Extraction Quality**: HIGH
- **Source Document**: VND-007_Check_Point_Software_Technologies_Ltd..html (113.4 KB)
- **Extraction Timestamp**: 2026-06-06T21:12:53

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
- **Target Migration Dates**: ML-KEM GA late 2026; ML-DSA and SLH-DSA H2 2027
- **Products / Services Covered**: Secure Firewall Threat Defense (FTD); ASA; Secure Firewall 1200; Secure Firewall 6100
- **Compliance Frameworks**: NIST FIPS 203; NIST FIPS 204; NIST FIPS 205; NSA National Security Systems; CNSA 2.0; BSI; ANSSI
- **Hybrid Mode Support**: Yes, via RFC 9242 and RFC 9370 enabling hybrid key exchange in IKEv2
- **Current GA Status**: Planned
- **Customer Action Required**: Know where encryption lives; build upgrade paths into planning cycles; think about hardware now
- **Key Commitments & Quotes**: "Support arrives in Secure Firewall Threat Defense (FTD) 10.5 and ASA 9.25 , targeted for General Availability in late 2026."
- **Coverage Verification**: PARTIAL, the document confirms the Secure Firewall milestones but does not mention the broader Cisco PQC spans (IOS XE/XR, Meraki, Webex, AnyConnect) cited in the notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-008_Cisco_Systems_Inc..html (82.4 KB)
- **Extraction Timestamp**: 2026-06-06T20:46:02

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
- **Extraction Timestamp**: 2026-06-07T23:32:24

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
- **Hybrid Mode Support**: None detected
- **Current GA Status**: GA
- **Customer Action Required**: Request a Demo; Get a structured roadmap; Map every cryptographic asset; Evaluate the impacts on your systems; Deploy NIST-validated post-quantum algorithms
- **Key Commitments & Quotes**: "Deploy NIST-validated post-quantum algorithms without accumulating cryptographic debt"; "We are at the forefront of the NIST standardization efforts"; "CryptoNext Security is recognized as a leading player in PQC"
- **Coverage Verification**: CONSISTENT. The document explicitly details the four-phase strategy (Evaluation, Inventory/COMPASS, Remediation, Management) and mentions the June 2025 launch of COMPASS Discovery, aligning with the CSV notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-011_CryptoNext_Security.html (147.1 KB)
- **Extraction Timestamp**: 2026-06-06T21:15:18

## VND-012 — DigiCert Inc.

- **Vendor ID**: VND-012
- **Vendor Name**: DigiCert Inc.
- **Roadmap Title**: DigiCert Post-Quantum Cryptography — Trust Lifecycle Manager
- **Roadmap URL**: https://www.digicert.com/post-quantum-cryptography
- **Publish Date**: 2025-01-01
- **Local File**: public/vendor-roadmaps/VND-012_DigiCert_Inc..html
- **CSV Coverage Notes**: DigiCert PQC product page centered on Trust Lifecycle Manager (DigiCert ONE) and crypto-agility: discover, inventory and manage certificates at scale to prepare for ML-KEM/ML-DSA migration. Supporting resources include PQC test servers/playgrounds (DigiCert Labs), a 'PQC for Dummies' ebook and readiness webinars. Page is undated and gives no explicit per-algorithm GA timeline. | Milestone: DigiCert positions Trust Lifecycle Manager (DigiCert ONE) for crypto-agility — continuous certificate discovery/inventory and at-scale management to enable transition to NIST ML-KEM/ML-DSA; provides PQC test
- **Extraction Error**: Extracted text too short (82 chars)
- **Extraction Timestamp**: 2026-06-06T20:46:30

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
- **Products / Services Covered**: nShield HSMs; Public Key Infrastructure (PKI); Cryptographic Security Platform; PQC Readiness Assessment
- **Compliance Frameworks**: NIST; IETF
- **Hybrid Mode Support**: Yes, supports hybrid approach combining traditional algorithms (RSA/ECC) with PQC for backward compatibility.
- **Current GA Status**: Planned
- **Customer Action Required**: Take self-assessment; fill out form to connect with expert; explore solution guide.
- **Key Commitments & Quotes**: "Entrust helps organizations protect long-lived information, maintain compliance, and prepare for the quantum era with crypto-agile solutions"; "Entrust solutions support a hybrid approach, combining today’s algorithms with PQC so organizations can maintain backwards compatibility"; "Entrust has proposed and published the only draft for a composite certificate... with the IETF"
- **Coverage Verification**: PARTIAL, the document confirms nShield HSMs, PKI, and CSP but does not explicitly mention KeyControl or identity solutions in the PQC context.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-013_Entrust_Corporation.html (195.4 KB)
- **Extraction Timestamp**: 2026-06-06T20:46:30

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
- **Hybrid Mode Support**: Yes, document states "Hybrid cipher support ensures backward compatibility" and mentions combining classical encryption with post-quantum algorithms.
- **Current GA Status**: GA
- **Customer Action Required**: Act now to deploy quantum-resistant encryption; identify where encryption terminates; enforce quantum-safe algorithms; adopt crypto-agile controls.
- **Key Commitments & Quotes**: "F5 ADSP delivers end-to-end post-quantum cryptography (PQC) with National Institute of Standards and Technologies (NIST)-approved algorithms"; "F5 BIG-IP LTM Provides client and server quantum-resilience with NIST-standard algorithms"; "NGINX Plus Easily enables quantum-safe security for APIs and microservices"
- **Coverage Verification**: PARTIAL, the document confirms the products and NIST standards but does not contain the specific version numbers (v17.5.0, v21.1), dates (2026-05-06), or specific cipher group names (SecP256r1ML-KEM-768) listed in the CSV notes.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-014_F5_Networks_Inc..html (1133.3 KB)
- **Extraction Timestamp**: 2026-06-06T20:46:56

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
- **Products / Services Covered**: Fortanix DSM; PQC Central
- **Compliance Frameworks**: CNSA 2.0; FIPS PUB 203; FIPS PUB 204; NIST SP 800-208; FIPS 140-2
- **Hybrid Mode Support**: None detected
- **Current GA Status**: GA
- **Customer Action Required**: Start the journey to PQC transition today; assess current cryptography; update systems; prepare people and processes.
- **Key Commitments & Quotes**: "Fortanix supports the full suite of algorithms in the Commercial National Security Algorithm Suite (CNSA) 2.0."
- **Coverage Verification**: CONSISTENT. The document explicitly details the four-step framework (Discover, PQC Assessment, PQC Transition, Crypto-agility), mentions PQC Central, and lists the specified algorithms within the Fortanix platform context.
- **Extraction Quality**: HIGH
- **Source Document**: VND-015_Fortanix_Inc..html (252.8 KB)
- **Extraction Timestamp**: 2026-06-06T21:12:53

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
- **Hybrid Mode Support**: Yes, "Hybrid mode allows classical and PQC algorithms to run simultaneously"
- **Current GA Status**: GA
- **Customer Action Required**: "Migrate to post-quantum security and future-proof your infrastructure"
- **Key Commitments & Quotes**: "quantum-safe features, including post-quantum cryptography (PQC), are natively integrated into the FortiOS operating system"
- **Coverage Verification**: CONSISTENT, the document outlines a portfolio-wide strategy for PQC integration via FortiOS, which aligns with the unspecified CSV notes.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-016_Fortinet_Inc..html (329.4 KB)
- **Extraction Timestamp**: 2026-06-06T20:24:02

## VND-017 — Futurex Inc.

- **Vendor ID**: VND-017
- **Vendor Name**: Futurex Inc.
- **Roadmap Title**: Futurex Post-Quantum Hybrid Certificate Authority Solution
- **Roadmap URL**: https://www.futurex.com/news/futurex-announces-post-quantum-hybrid-certificate-authority-solution
- **Publish Date**: 2026-06-05
- **Local File**: public/vendor-roadmaps/VND-017_Futurex_Inc..html
- **CSV Coverage Notes**: None
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: CryptoHub; VirtuCrypt; Excrypt HSM
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: Yes, described as "Post-Quantum Hybrid Certificate Authority Solution"
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "The only PQC-ready, all-in-one encryption solution for HSMs, key management, PKI and CA, and data protection via cloud, on-premises, and hybrid."
- **Coverage Verification**: CONSISTENT, the document details PQC readiness for specific named products (CryptoHub, VirtuCrypt, Excrypt HSM) which aligns with the unspecified CSV notes.
- **Extraction Quality**: LOW
- **Source Document**: VND-017_Futurex_Inc..html (596.5 KB)
- **Extraction Timestamp**: 2026-06-06T20:24:40

## VND-018 — Google LLC

- **Vendor ID**: VND-018
- **Vendor Name**: Google LLC
- **Roadmap Title**: Google Cloud Post-Quantum Cryptography
- **Roadmap URL**: https://cloud.google.com/security/resources/post-quantum-cryptography
- **Publish Date**: 2025-10-01
- **Local File**: public/vendor-roadmaps/VND-018_Google_LLC.html
- **CSV Coverage Notes**: Google Cloud PQC: ML-KEM migrated for internal/network traffic and default Cloud network encryption; Cloud KMS quantum-safe digital signatures (ML-DSA-65, SLH-DSA-SHA2-128S) preview Feb 2025 and KEM support preview Oct 2025, committing to FIPS 203/204/205 in both Cloud KMS (software) and Cloud HSM (hardware). Implementations open-sourced via BoringCrypto/BoringSSL and Tink (HPKE for Java/C++/Go/Python). Chrome and Android PQC support. Infra connection rollout targeted 2026. | Milestone: Quantum-safe KEMs in Cloud KMS in preview (Oct 2025); quantum-safe digital signatures (ML-DSA-65, SLH-DSA-SH
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: ML-KEM; Kyber
- **Target Migration Dates**: 2029
- **Products / Services Covered**: Google Cloud; Chrome; Android; BoringSSL; Tink; OpenSK
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: Yes, document states "hybrid deployments of PQC and classic cryptography" are key.
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Google has set 2029 as the deadline for Google’s PQC migration to secure the quantum era."
- **Coverage Verification**: PARTIAL, the document confirms the 2029 deadline, ML-KEM/Kyber usage in Chrome/Android, and hybrid strategy, but does not explicitly mention Cloud KMS preview dates, specific signature algorithms (ML-DSA/SLH-DSA), or FIPS 203/204/205 commitments found in the CSV notes.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-018_Google_LLC.html (2124.2 KB)
- **Extraction Timestamp**: 2026-06-06T20:47:31

## VND-019 — IBM Corporation

- **Vendor ID**: VND-019
- **Vendor Name**: IBM Corporation
- **Roadmap Title**: IBM Quantum-Safe Roadmap
- **Roadmap URL**: https://research.ibm.com/blog/quantum-safe-roadmap
- **Publish Date**: 2023-05-10
- **Local File**: public/vendor-roadmaps/VND-019_IBM_Corporation.html
- **CSV Coverage Notes**: IBM Quantum-Safe Roadmap (page dated 2023-05-10, unchanged) outlines crypto-agility via the IBM Quantum Safe portfolio: Explorer (code scanning / cryptographic artifact discovery), Advisor (posture & compliance analysis, CBOM), and Remediator (test/implement hybrid quantum-safe remediation). Phased path: inventory (2023), adopt NIST standards (2024), CNSA 2.0 preference (2025). Also Guardium, z/OS, OpenSSL integrations. | Milestone: IBM Quantum Safe Explorer/Advisor/Remediator for crypto inventory (CBOM), risk analysis, and hybrid quantum-safe remediation; aligned to NIST 2024 standards and 20
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: CRYSTALS-Kyber; CRYSTALS-Dilithium; Falcon
- **Target Migration Dates**: 2023 (cryptography inventory/CBOM); 2024 (NIST post-quantum cryptography standards publication); 2025 (NSA preference for quantum-safe algorithms)
- **Products / Services Covered**: IBM Quantum Safe Explorer; IBM Quantum Safe Advisor; IBM Quantum Safe Remediator; IBM z16; IBM Tape
- **Compliance Frameworks**: NIST; FIPS; CNSA 2.0
- **Hybrid Mode Support**: Yes; Remediator supports a hybrid implementation approach using classical and quantum-safe cryptography
- **Current GA Status**: GA
- **Customer Action Required**: Complete cryptography inventory and create a CBOM; begin quantum-safe transition
- **Key Commitments & Quotes**: "This roadmap serves as a commitment to transparency, predictability, and confidence as we guide industries along their journey to post-quantum cryptography."
- **Coverage Verification**: PARTIAL; The document confirms the Explorer/Advisor/Remediator portfolio, CBOM focus, and 2023/2024/2025 timeline, but does not mention Guardium, z/OS, or OpenSSL integrations.
- **Extraction Quality**: HIGH
- **Source Document**: VND-019_IBM_Corporation.html (84.2 KB)
- **Extraction Timestamp**: 2026-06-06T20:47:59

## VND-021 — Infineon Technologies AG

- **Vendor ID**: VND-021
- **Vendor Name**: Infineon Technologies AG
- **Roadmap Title**: Infineon Post-Quantum Cryptography
- **Roadmap URL**: https://www.infineon.com/promo/postquantumcryptography
- **Publish Date**: 2025-10-15
- **Local File**: public/vendor-roadmaps/VND-021_Infineon_Technologies_AG.html
- **CSV Coverage Notes**: Infineon PQC hub: SLC27 security controller (TEGRION family, Integrity Guard 32) launched Oct 2025 with Common Criteria-certified PQC library (ML-KEM, ML-DSA), crypto-agility and in-field updates, hardened against fault/side-channel. PSOC Control C3 Performance Line samples by end-2025, production 2026 adding ML-DSA on-device key gen/signing and ML-KEM for TLS. Automotive MCUs upgraded for PQC; LMS support. | Milestone: SLC27 PQC-certified contactless/dual-interface security controller launched Oct 2025 with CC-certified ML-KEM + ML-DSA crypto library (TEGRION family, Integrity Guard 32); PSOC
- **Roadmap Scope**: No PQC content
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: None detected
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: None detected
- **Current GA Status**: No PQC
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: None detected
- **Coverage Verification**: MISMATCH — The provided document text is a generic website navigation menu and product list containing no PQC-specific information, whereas the CSV notes describe specific PQC product launches and certifications.
- **Extraction Quality**: LOW
- **Source Document**: VND-021_Infineon_Technologies_AG.html (1682.4 KB)
- **Extraction Timestamp**: 2026-06-06T20:48:30

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
- **Hybrid Mode Support**: Yes, the document recommends implementing the transition in Hybrid mode, combining classical and post-quantum schemes (e.g., Kyber512 + X25519) to ensure security against non-quantum attackers if the PQC component is broken.
- **Current GA Status**: Preview
- **Customer Action Required**: Download the Intel Cryptography Primitives Library standalone or as part of the Intel oneAPI Base Toolkit; submit issues on Github or in the online service center for questions or requests to extend the list of post-quantum algorithms.
- **Key Commitments & Quotes**: "We are at the forefront of implementing the latest in post-quantum cryptographic technology and are closely monitoring the evolution of standards at NIST’s Post Quantum Cryptography PQC ."
- **Coverage Verification**: MISMATCH, the document does not mention the 2030 Y2Q goal, FIPS 203/204/205, 3rd Gen Xeon Scalable acceleration, or SPHINCS+ co-development, focusing instead on the Cryptography Primitives Library's preview support for XMSS and LMS.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-022_Intel_Corporation.html (137.7 KB)
- **Extraction Timestamp**: 2026-06-06T21:12:53

## VND-024 — Keyfactor Inc.

- **Vendor ID**: VND-024
- **Vendor Name**: Keyfactor Inc.
- **Roadmap Title**: Keyfactor Post-Quantum Cryptography Lab
- **Roadmap URL**: https://www.keyfactor.com/post-quantum-cryptography-lab/
- **Publish Date**: 2025-01-01
- **Local File**: public/vendor-roadmaps/VND-024_Keyfactor_Inc..html
- **CSV Coverage Notes**: Keyfactor PQC Lab is a resource hub (webinars, sandboxed test envs, toolkits) emphasizing crypto-agility ahead of the 2035 deadline. EJBCA 9.1 and SignServer 7.1 add quantum-safe algorithms (Dilithium/ML-DSA, SPHINCS+/SLH-DSA, Falcon) via Bouncy Castle APIs; Keyfactor Command for certificate lifecycle/IoT PKI; ACME support. Free trials on Azure Marketplace. | Milestone: EJBCA 9.1 and SignServer 7.1 deliver PQC: issuance/signing with ML-DSA (Dilithium), SLH-DSA (SPHINCS+) and Falcon via Bouncy Castle; Command available for crypto-agile PKI/cert lifecycle
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: ML-DSA; SLH-DSA; Falcon
- **Target Migration Dates**: 2035
- **Products / Services Covered**: Keyfactor Command; SignServer; Bouncy Castle APIs
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: Yes, document mentions "Post-quantum hybrid cryptography in Bouncy Castle" and "Hybrid Certificates".
- **Current GA Status**: GA
- **Customer Action Required**: Get a PQC-Ready PKI and Signing Test Drive; Assess your organization's PKI maturity; Get hands-on with open-source toolkits.
- **Key Commitments & Quotes**: "Crypto-agility—swapping cryptographic algorithms quickly and confidently—is essential, as all encryption must be post-quantum secure by 2035."; "EJBCA 9.1 and SignServer 7.1 are Here!"; "Get started with signing artifacts using Falcon, Dilithium, and SPHINCS+."
- **Coverage Verification**: CONSISTENT, the document confirms the PQC Lab as a resource hub, mentions the 2035 deadline, and explicitly lists EJBCA 9.1, SignServer 7.1, and Keyfactor Command with support for Dilithium, SPHINCS+, and Falcon via Bouncy Castle.
- **Extraction Quality**: HIGH
- **Source Document**: VND-024_Keyfactor_Inc..html (177.4 KB)
- **Extraction Timestamp**: 2026-06-06T20:48:53

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
- **Hybrid Mode Support**: Yes, document mentions "X.509 hybrid certificates" and "Composite Signatures" for transitioning from classical cryptography.
- **Current GA Status**: GA
- **Customer Action Required**: Download the PQC Almanac for migration guidance and examples.
- **Key Commitments & Quotes**: "The Bouncy Castle Java 1.79 release has arrived, supporting the newly standardized NIST Post-Quantum Cryptography (PQC) algorithms"
- **Coverage Verification**: CONSISTENT, the document explicitly confirms the release of Bouncy Castle Java 1.79 on 2024-10-31 with support for ML-KEM, ML-DSA, SLH-DSA, RFC 9269, and draft Composite Signatures/Delta-Chameleon.
- **Extraction Quality**: HIGH
- **Source Document**: VND-025_The_Legion_of_the_Bouncy_Castle_Inc..html (268.3 KB)
- **Extraction Timestamp**: 2026-06-06T20:49:22

## VND-027 — Microsoft Corporation

- **Vendor ID**: VND-027
- **Vendor Name**: Microsoft Corporation
- **Roadmap Title**: Microsoft Quantum-Safe Security: Progress Towards Next-Generation Cryptography
- **Roadmap URL**: https://www.microsoft.com/en-us/security/blog/2025/08/20/quantum-safe-security-progress-towards-next-generation-cryptography/
- **Publish Date**: 2025-08-20
- **Local File**: public/vendor-roadmaps/VND-027_Microsoft_Corporation.html
- **CSV Coverage Notes**: Microsoft quantum-safe roadmap: SymCrypt foundation with ML-KEM/ML-DSA exposed through Windows CNG and certificate APIs; SymCrypt 1.9.0 adds TLS hybrid key exchange (coming to Windows TLS stack). PQC previewing for Windows Insiders and Linux. Three-phase strategy (foundational libs -> core infra/Entra/key mgmt/signing -> all services Windows/Azure/M365). Early adoption by 2029, full transition by 2033. | Milestone: ML-KEM and ML-DSA available via Windows APIs (CNG/Certificate funcs); SymCrypt 1.9.0 supports TLS hybrid key exchange; early adoption by 2029, full transition by 2033 (ahead of 2035
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; FrodoKEM
- **Target Migration Dates**: Early adoption by 2029; full transition by 2033
- **Products / Services Covered**: SymCrypt; Windows; Linux; Microsoft Azure; Microsoft 365; Microsoft Entra; Azure Key Vault; Windows TLS stack
- **Compliance Frameworks**: NIST; CNSA 2.0; CNSSP-15; ISO; IETF; OMB; CISA; NSA
- **Hybrid Mode Support**: Yes; TLS hybrid key exchange and hybrid approach combining classical and quantum-resistant algorithms
- **Current GA Status**: Preview
- **Customer Action Required**: Start developing their strategy now
- **Key Commitments & Quotes**: "Microsoft’s roadmap aims to complete transition of its services and products by 2033"; "aiming to enable early adoption of quantum-safe capabilities by 2029"; "we’ve enabled TLS hybrid key exchange as per the latest IETF internet draft"
- **Coverage Verification**: CONSISTENT; The document explicitly confirms the SymCrypt foundation, ML-KEM/ML-DSA availability via CNG/Certificate APIs, TLS hybrid key exchange in SymCrypt 1.9.0, preview status for Windows Insiders/Linux, the three-phase strategy, and the 2029/2033 timelines.
- **Extraction Quality**: HIGH
- **Source Document**: VND-027_Microsoft_Corporation.html (313.6 KB)
- **Extraction Timestamp**: 2026-06-07T23:34:42

## VND-028 — NXP Semiconductors N.V.

- **Vendor ID**: VND-028
- **Vendor Name**: NXP Semiconductors N.V.
- **Roadmap Title**: NXP Stands at the Forefront of Post-Quantum Cryptography
- **Roadmap URL**: https://www.nxp.com/company/about-nxp/smarter-world-blog/BL-NXP-STANDS-POST-QUANTUM-CRYPTOGRAPHY
- **Publish Date**: 2024-11-01
- **Local File**: public/vendor-roadmaps/VND-028_NXP_Semiconductors_N.V..html
- **CSV Coverage Notes**: None
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: Crystals-Kyber; Classic McEliece
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: NIST; BSI; CNSA Suite
- **Hybrid Mode Support**: No
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "NXP helps standardize next-generation security with post-quantum cryptography."
- **Coverage Verification**: CONSISTENT
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-028_NXP_Semiconductors_N.V..html (55.0 KB)
- **Extraction Timestamp**: 2026-06-06T20:25:14

## VND-029 — Oracle Corporation

- **Vendor ID**: VND-029
- **Vendor Name**: Oracle Corporation
- **Roadmap Title**: Preparing for Post Quantum Cryptography | Oracle Security
- **Roadmap URL**: https://blogs.oracle.com/security/post-quantum-cryptography
- **Publish Date**: 2025-10-01
- **Local File**: public/vendor-roadmaps/VND-029_Oracle_Corporation.html
- **CSV Coverage Notes**: None
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA; LMS
- **Target Migration Dates**: JDK 26 released in March 2026; PQC TLS mechanisms planned for JDK 27
- **Products / Services Covered**: Oracle AI Database 26ai; Oracle Java (JDK 21, 24, 26, 27); Oracle Jipher; Oracle Linux (9.7, 10.1); OpenSSL 3.5
- **Compliance Frameworks**: FIPS 203; FIPS 204; FIPS 140; CNSA 2.0; RFC 8554; NIST SP 800-208; RFC 9180
- **Hybrid Mode Support**: Yes, Oracle is implementing hybrid key establishments for most environments, combining classical and quantum-safe mechanisms for TLS 1.3, SSH, and IKE v2.
- **Current GA Status**: GA
- **Customer Action Required**: Transition to TLS 1.3 as a prerequisite for enabling post-quantum cryptography for data in-transit; Upgrade to current version
- **Key Commitments & Quotes**: "Oracle is implementing hybrid key establishments for most environments."
- **Coverage Verification**: CONSISTENT, the document details a multi-product strategy covering database, Java, and OS components, which aligns with the unspecified CSV notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-029_Oracle_Corporation.html (72.5 KB)
- **Extraction Timestamp**: 2026-06-06T20:25:37

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
- **Coverage Verification**: PARTIAL, the document confirms PQCryptoLib-SDK and Core but does not mention PQMicroLib-Core, hardware IP cores, PQE2E, or specific FIPS 203/204/205 algorithm numbers.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-030_PQShield_Ltd..html (61.0 KB)
- **Extraction Timestamp**: 2026-06-06T20:50:17

## VND-031 — Palo Alto Networks Inc.

- **Vendor ID**: VND-031
- **Vendor Name**: Palo Alto Networks Inc.
- **Roadmap Title**: Palo Alto Networks Post-Quantum Migration Planning and Preparation
- **Roadmap URL**: https://docs.paloaltonetworks.com/network-security/quantum-security/administration/quantum-security-concepts/post-quantum-migration-planning-and-preparation
- **Publish Date**: 2026-05-26
- **Local File**: public/vendor-roadmaps/VND-031_Palo_Alto_Networks_Inc..html
- **CSV Coverage Notes**: Official PQC migration planning guidance (updated May 2026). Five-step migration framework (resources, responsibilities, crypto inventory, evaluation/testing, monitoring) and Mosca model for urgency. Quantum-resistant IKEv2 VPNs on PAN-OS 11.1+ via RFC 8784, plus RFC 9242/9370 multi/hybrid key exchange; Quantum-Safe Security app for cryptographic inventory. | Milestone: PAN-OS 11.1+ quantum-resistant IKEv2 VPNs via RFC 8784 (immediate priority), with RFC 9242/9370 for multiple/hybrid IKEv2 key exchanges; Quantum-Safe Security app for crypto inventory.
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: PAN-OS; Quantum-Safe Security app
- **Compliance Frameworks**: NIST; NSA; RFC 8784; RFC 9242; RFC 9370; RFC 6379
- **Hybrid Mode Support**: Yes, document states "industry is adopting hybrid keys" and recommends using "a strong classic KEM... and one or more PQCs" via RFC 9242/9370.
- **Current GA Status**: GA
- **Customer Action Required**: Assign resources; define responsibilities; develop cryptographic inventory; evaluate solutions; monitor progress; upgrade to Suite-B-GCM-256; upgrade CA to 4K RSA; implement RFC 8784/9242/9370.
- **Key Commitments & Quotes**: "Post-quantum IKEv2 VPNs ( RFC 8784 ) are the first step to creating a secure post-quantum network, which you can do now without impacting your network."
- **Coverage Verification**: CONSISTENT, the document confirms the five-step framework, Mosca model, PAN-OS 11.1+ support for RFC 8784/9242/9370, and the Quantum-Safe Security app, though the update date is April 2026 rather than May 2026.
- **Extraction Quality**: HIGH
- **Source Document**: VND-031_Palo_Alto_Networks_Inc..html (292.5 KB)
- **Extraction Timestamp**: 2026-06-06T20:50:37

## VND-032 — Red Hat Inc.

- **Vendor ID**: VND-032
- **Vendor Name**: Red Hat Inc.
- **Roadmap Title**: Building the levee: Red Hat's post-quantum strategy is already in production
- **Roadmap URL**: https://www.redhat.com/en/blog/building-levee-why-red-hats-post-quantum-strategy-already-production
- **Publish Date**: 2025-05-01
- **Local File**: public/vendor-roadmaps/VND-032_Red_Hat_Inc..html
- **CSV Coverage Notes**: None
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Red Hat Enterprise Linux 10 (RHEL); Red Hat Enterprise Linux 10.1 (RHEL 10.1); Fedora; OpenSSL; Network Security Services (NSS); Linux kernel
- **Compliance Frameworks**: NIST; FIPS 203; FIPS 204
- **Hybrid Mode Support**: Yes, managing 2 estates simultaneously: classical cryptography and PQC
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Red Hat has been laying the groundwork for the post-quantum transition for years"; "we're helping build them. Our teams are deep in the trenches of OpenSSL, NSS, and the Linux kernel"; "we became the first major distribution to start signing our RPM packages with post-quantum keys (ML-DSA)"
- **Coverage Verification**: CONSISTENT, the document details a specific PQC strategy and product integrations, which is consistent with the unspecified CSV notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-032_Red_Hat_Inc..html (620.0 KB)
- **Extraction Timestamp**: 2026-06-06T20:26:33

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
- **Products / Services Covered**: CryptoComply; CryptoComply v3.5; CryptoComply BoringCrypto; CryptoComply PQ TLS
- **Compliance Frameworks**: FIPS 140-3; FIPS 140-2; FIPS 203; FIPS 204; FIPS 205; CMMC 2.0; CNSA 2.0; Common Criteria; FedRAMP; GovRAMP
- **Hybrid Mode Support**: Yes, "Hybrid PQC + FIPS Mode Combine ML-KEM with SafeLogic's validated FIPS 140-3 algorithms" and "hybrid cryptographic models that combine classical and quantum-safe algorithms"
- **Current GA Status**: GA
- **Customer Action Required**: Assess cryptographic systems; build a migration plan; embrace crypto-agility and hybrid models; align with FIPS 140-3; download PQC Migration Guide
- **Key Commitments & Quotes**: "CryptoComply v3.5 delivers... full support for NIST-standardized PQC algorithms"
- **Coverage Verification**: PARTIAL, The document confirms the roadmap, CMAP, phased methodology, CryptoComply PQC support, and hybrid mode, but does not mention the CEO's NCCoE role or the specific 2026-05-19 submission milestone.
- **Extraction Quality**: HIGH
- **Source Document**: VND-034_SafeLogic_Inc..html (161.0 KB)
- **Extraction Timestamp**: 2026-06-06T21:23:29

## VND-035 — Samsung Electronics Co. Ltd.

- **Vendor ID**: VND-035
- **Vendor Name**: Samsung Electronics Co. Ltd.
- **Roadmap Title**: The First Step to a Quantum-Safe Future With Samsung Knox
- **Roadmap URL**: https://news.samsung.com/global/the-first-step-to-a-quantum-safe-future-with-samsung-knox
- **Publish Date**: 2025-01-22
- **Local File**: public/vendor-roadmaps/VND-035_Samsung_Electronics_Co.\_Ltd..html
- **CSV Coverage Notes**: Samsung Knox Matrix gains Post-Quantum Enhanced Data Protection (EDP) using ML-KEM (FIPS 203, lattice-based), debuting on Galaxy S25 (first device on One UI 7) — industry-first PQC-based cloud/cross-device data protection. Extends quantum-safe protection across the Knox cross-device trust ecosystem. | Milestone: Galaxy S25 (One UI 7) is first to support PQC-based cloud data protection: ML-KEM (FIPS 203) integrated into Knox Matrix via Post-Quantum Enhanced Data Protection (EDP).
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: ML-KEM
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Galaxy S25 series; Samsung Knox Matrix; Samsung Cloud; One UI 7
- **Compliance Frameworks**: NIST; FIPS 203
- **Hybrid Mode Support**: None detected
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Samsung is introducing Post-Quantum Enhanced Data Protection (EDP) to Samsung Knox Matrix"; "The Galaxy S25 series is the first in the industry to support PQC-based cloud data protection"; "Knox Matrix’s cross-device compatibility will ensure seamless quantum-safe protection"
- **Coverage Verification**: CONSISTENT. The document explicitly confirms the integration of ML-KEM into Knox Matrix via EDP on the Galaxy S25 series running One UI 7, matching the CSV notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-035_Samsung_Electronics_Co.\_Ltd..html (148.6 KB)
- **Extraction Timestamp**: 2026-06-06T20:51:10

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
- **Products / Services Covered**: Primus CyberVault HSMs; CloudHSM (Economy/Sandbox tiers)
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: Yes, integrating classical algorithms like RSA and ECC/ED with PQC signatures and key exchange
- **Current GA Status**: GA
- **Customer Action Required**: Start a 90-free trial; Test Securosys HSM PQC in a Controlled Environment
- **Key Commitments & Quotes**: "Our Primus CyberVault HSMs and CloudHSM services fully support PQC algorithms"; "Hybrid Operations : Integrating classical algorithms like RSA and ECC/ED with PQC signatures and key exchange"; "Securosys is committed to advancing PQC in real-world applications"
- **Coverage Verification**: CONSISTENT, the document explicitly confirms support for the listed algorithms, hybrid operations, specific product lines (Primus CyberVault, CloudHSM), and the HSLU collaboration.
- **Extraction Quality**: HIGH
- **Source Document**: VND-037_Securosys_SA.html (274.3 KB)
- **Extraction Timestamp**: 2026-06-06T20:51:31

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
- **Hybrid Mode Support**: Yes, "Senetas delivers a hybrid approach — combining conventional cryptography with quantum-resistant techniques"
- **Current GA Status**: GA
- **Customer Action Required**: Practice Crypto-Agility; Undertake a Post-Quantum Risk Assessment; Protect Applications with Quantum Random Number Generation; Secure Data in Motion with Quantum Key Distribution; Implement Quantum Resistant Algorithms
- **Key Commitments & Quotes**: "Senetas supports all quantum encryption algorithms selected by NIST"; "first to market with our high-speed network encryptors offering Quantum Resistant Encryption (QRE)"; "existing customers can deploy on their current platforms today"
- **Coverage Verification**: PARTIAL, The document confirms the 5-step roadmap, hybrid approach, FPGA crypto-agility, NIST 2024 standards, and first-to-market QRE claim, but does not explicitly mention ETSI QKD standards or the specific distribution channels (Thales/AU/NZ) noted in the CSV.
- **Extraction Quality**: HIGH
- **Source Document**: VND-038_Senetas_Corporation_Ltd..html (188.5 KB)
- **Extraction Timestamp**: 2026-06-06T21:23:29

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
- **Compliance Frameworks**: NIST FIPS-203; NIST FIPS 204; NIST FIPS 205; NIST SP800-208; NIST FIPS 202; Common Criteria
- **Hybrid Mode Support**: Yes, supporting a mix of quantum-safe and classical algorithms
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "ST launched a post-quantum cryptography program to support the standardization and development of new algorithms"
- **Coverage Verification**: CONSISTENT, the document confirms the corporate program, Keccak role, specific algorithms, and named products like X-Cube PQC and STSAFE-TPM.
- **Extraction Quality**: HIGH
- **Source Document**: VND-039_STMicroelectronics_N.V..html (481.3 KB)
- **Extraction Timestamp**: 2026-06-06T21:15:18

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
- **Products / Services Covered**: SLES 15 SP6; SLES 15 SP7; SL Micro 6.0; SL Micro 6.1; SLES 16.0; SL Micro 6.2; OpenSSL; GnuTLS; libgcrypt; leancrypto; Mozilla NSS; OpenSSH; strongSwan; Go runtime
- **Compliance Frameworks**: FIPS 203; FIPS 204; FIPS 205; FIPS 186; FIPS 140-3
- **Hybrid Mode Support**: Yes, hybrid ciphers (e.g., x25519mlkem768) are used during transition for TLS, IKEv2, and SSH.
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "SUSE’s strategy on implementing post quantum cryptography (PQC) has been to adopt standards and upstream implementations when they become available"
- **Coverage Verification**: CONSISTENT, the document explicitly details the strategy, standards, hybrid approach, and specific product/component coverage listed in the notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-040_SUSE_LLC.html (188.6 KB)
- **Extraction Timestamp**: 2026-06-06T21:24:41

## VND-041 — Thales Group

- **Vendor ID**: VND-041
- **Vendor Name**: Thales Group
- **Roadmap Title**: Post-Quantum Crypto Agility | Thales CPL
- **Roadmap URL**: https://cpl.thalesgroup.com/encryption/post-quantum-crypto-agility
- **Publish Date**: 2025-07-29
- **Local File**: public/vendor-roadmaps/VND-041_Thales_Group.html
- **CSV Coverage Notes**: None
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: Yes, document mentions "preparing for hybrid environments using both classical and NIST-standardized PQC algorithms"
- **Current GA Status**: Planned
- **Customer Action Required**: Take a free risk assessment to learn if your organization is at risk of a post-quantum breach
- **Key Commitments & Quotes**: "Thales is committed to delivering solutions that support a Post-Quantum crypto agile strategy."
- **Coverage Verification**: CONSISTENT, the document outlines a portfolio-wide strategy without specifying individual products, which aligns with the "Not specified" coverage notes.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-041_Thales_Group.html (363.1 KB)
- **Extraction Timestamp**: 2026-06-06T20:27:16

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
- **Products / Services Covered**: u.trust General Purpose HSM Se-Series; Quantum Protect
- **Compliance Frameworks**: FIPS 203; FIPS 204; FIPS 205
- **Hybrid Mode Support**: None detected
- **Current GA Status**: GA
- **Customer Action Required**: Use the free simulator to evaluate how PQC algorithms work within your environment and use case.
- **Key Commitments & Quotes**: "Quantum Protect extends the u.trust General Purpose HSM Se-Series with proven and standardized Post Quantum Cryptography algorithms"; "Quantum Protect is available as seamless in-field upgrade for the u.trust General Purpose HSM Se-Series – no HSM exchange needed"; "More algorithms such as SLH-DSA are on the roadmap."
- **Coverage Verification**: CONSISTENT. The document explicitly confirms the support for ML-KEM, ML-DSA, LMS, HSS, XMSS, XMSS-MT on the Se-Series via in-field upgrade, and states SLH-DSA is on the roadmap/in progress.
- **Extraction Quality**: HIGH
- **Source Document**: VND-042_Utimaco_IS_GmbH.html (282.6 KB)
- **Extraction Timestamp**: 2026-06-06T20:51:56

## VND-045 — wolfSSL Inc.

- **Vendor ID**: VND-045
- **Vendor Name**: wolfSSL Inc.
- **Roadmap Title**: wolfSSL Support for NIST PQC Standards (ML-KEM & ML-DSA)
- **Roadmap URL**: https://www.wolfssl.com/support-for-the-official-post-quantum-standards-ml-kem-and-ml-dsa/
- **Publish Date**: 2024-10-01
- **Local File**: public/vendor-roadmaps/VND-045_wolfSSL_Inc..html
- **CSV Coverage Notes**: wolfSSL/wolfCrypt have full production support for ML-KEM (FIPS 203) and ML-DSA (FIPS 204), usable across wolfSSL, wolfBoot and wolfPKCS11 for embedded/IoT/TLS. SLH-DSA (FIPS 205) offered for specialized applications on request. Page revised Sep/Oct 2024. | Milestone: Full ML-KEM (FIPS 203) and ML-DSA (FIPS 204) implementation shipping in wolfSSL/wolfCrypt today; SLH-DSA available on request
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA; Kyber; Dilithium; SPHINCS+
- **Target Migration Dates**: None detected
- **Products / Services Covered**: wolfSSL; wolfCrypt
- **Compliance Frameworks**: FIPS 203; FIPS 204; FIPS 205
- **Hybrid Mode Support**: None detected
- **Current GA Status**: GA
- **Customer Action Required**: Download the wolfSSL library, configure it to enable Dilithium and Kyber and run the benchmarks; contact us for SLH-DSA implementation and support
- **Key Commitments & Quotes**: "we here at wolfSSL are announcing to the world that we have full implementation and support for ML-KEM and ML-DSA"
- **Coverage Verification**: PARTIAL, the document confirms ML-KEM/ML-DSA support in wolfSSL/wolfCrypt but does not explicitly name wolfBoot or wolfPKCS11 as covered products in the text.
- **Extraction Quality**: HIGH
- **Source Document**: VND-045_wolfSSL_Inc..html (66.7 KB)
- **Extraction Timestamp**: 2026-06-06T20:52:25

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
- **Hybrid Mode Support**: Yes; Recommends "Hybrid Approach" using both classical and post-quantum algorithms during transition for backwards compatibility and risk mitigation.
- **Current GA Status**: No PQC
- **Customer Action Required**: Assess Your Risk; Get Expert Help; Get Expert Consultation; Calculate Migration Priority
- **Key Commitments & Quotes**: "Your complete roadmap for migrating from current encryption to quantum-safe cryptography."
- **Coverage Verification**: MISMATCH; The document confirms the 7-phase roadmap, algorithm recommendations, and timeline, but does not mention the "QuProtect platform" or "QuProtect R3" as stated in the CSV notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-054_QuSecure_Inc..html (150.2 KB)
- **Extraction Timestamp**: 2026-06-06T21:12:05

## VND-056 — SEALSQ Corp.

- **Vendor ID**: VND-056
- **Vendor Name**: SEALSQ Corp.
- **Roadmap Title**: SEALSQ and IC'Alps Achieve Key Common Criteria Certification Milestones, Publish Full Post-Quantum Certification Roadmap
- **Roadmap URL**: https://www.globenewswire.com/news-release/2026/04/02/3267476/0/en/SEALSQ-and-IC-Alps-Achieve-Key-Common-Criteria-Certification-Milestones-Publish-Full-Post-Quantum-Certification-Roadmap.html
- **Publish Date**: 2026-04-02
- **Local File**: public/vendor-roadmaps/VND-056_SEALSQ_Corp..html
- **CSV Coverage Notes**: SEALSQ published a 'Full Post-Quantum Certification Roadmap' covering its QS7001 secure element and QVault TPM families with dated milestones (production samples, wafer fab-out, FIPS 140-3 submission, TCG/Common Criteria certification), explicitly aligned to the NSA CNSA 2.0 January 2027 compliance timeline. Supports ML-KEM, ML-DSA, FALCON in EAL5+ hardware. | Milestone: QS7001 V2 wafer fab-out targeted April 21, 2026; QVault TPM 183/185 FIPS 140-3 submission Sept 2026 and TCG certification Oct 2026; positioning ahead of CNSA 2.0 (Jan 2027).
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: NSA CNSA 2.0 January 2027 compliance timeline
- **Products / Services Covered**: QS7001 Secure Element; QVault Trusted Platform Module (TPM)
- **Compliance Frameworks**: Common Criteria (CC) EAL 5+; FIPS 140-3; TCG; NSA CNSA 2.0
- **Hybrid Mode Support**: None detected
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "This certification roadmap reflects our commitment to delivering hardware-anchored post-quantum security on a predictable, transparent timetable."
- **Coverage Verification**: MISMATCH. The document confirms the roadmap, products, and dates, but does not mention support for ML-KEM, ML-DSA, or FALCON algorithms.
- **Extraction Quality**: HIGH
- **Source Document**: VND-056_SEALSQ_Corp..html (64.0 KB)
- **Extraction Timestamp**: 2026-06-06T20:58:55

## VND-057 — Cloudflare Inc.

- **Vendor ID**: VND-057
- **Vendor Name**: Cloudflare Inc.
- **Roadmap Title**: Cloudflare Post-Quantum Roadmap
- **Roadmap URL**: https://blog.cloudflare.com/post-quantum-roadmap/
- **Publish Date**: 2026-04-07
- **Local File**: public/vendor-roadmaps/VND-057_Cloudflare_Inc..html
- **CSV Coverage Notes**: Cloudflare's PQC roadmap (refreshed Apr 7, 2026) now targets full post-quantum security including PQ authentication by 2029, accelerated from prior timelines due to advances in attacks on elliptic-curve crypto. Focus shifting from encryption (harvest-now-decrypt-later) to PQ authentication across CDN, Zero Trust, Workers, Gateway and WARP. Intermediate milestones noted but not dated in this post. | Milestone: Target to be fully post-quantum secure (including post-quantum authentication) by 2029
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: ML-KEM
- **Target Migration Dates**: 2029
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: Yes, hybrid ML-KEM for IPsec
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "We now target 2029 to be fully post-quantum (PQ) secure including, crucially, post-quantum authentication."
- **Coverage Verification**: CONSISTENT, the document confirms the 2029 target for full PQ security including authentication and the acceleration due to recent crypto advances, though it does not explicitly list the specific product names (CDN, Zero Trust, etc.) mentioned in the notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-057_Cloudflare_Inc..html (302.3 KB)
- **Extraction Timestamp**: 2026-06-06T20:52:46

## VND-058 — HashiCorp Inc.

- **Vendor ID**: VND-058
- **Vendor Name**: HashiCorp Inc.
- **Roadmap Title**: HashiCorp Post-Quantum Cryptography Plans
- **Roadmap URL**: https://www.hashicorp.com/en/blog/nist-s-post-quantum-cryptography-standards-our-plans
- **Publish Date**: 2024-09-04
- **Local File**: public/vendor-roadmaps/VND-058_HashiCorp_Inc..html
- **CSV Coverage Notes**: HashiCorp plans phased PQC adoption beginning with the Vault transit secrets engine, incorporating the three NIST algorithms (ML-KEM first; ML-DSA/SLH-DSA later) and hybrid classical+PQ schemes, expanding to other products as Go and standards bodies converge. No firm version/release dates given. | Milestone: Staged PQC rollout in Vault starting with the transit secrets engine, adopting NIST ML-KEM/ML-DSA/SLH-DSA and hybrid schemes as Go/standards support matures
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA; FN-DSA
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Vault
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: Yes, HashiCorp plans to research and build support for hybrid schemes that enable current and post-quantum cryptography algorithms to coexist.
- **Current GA Status**: Planned
- **Customer Action Required**: Take immediate steps to reduce security risks; develop a plan for learning and implementing quantum-safe solutions; stay informed on evolving best practices; perform impact analysis; institute a PQC readiness program; prioritize and assess high-risk assets; discover and inventory cryptographic usage; enforce zero trust security; create a migration plan; establish ongoing governance.
- **Key Commitments & Quotes**: "HashiCorp plans to develop and deliver quantum and hybrid PQC solutions in a staged manner, starting with PQC support in the Vault transit secrets engine."
- **Coverage Verification**: CONSISTENT, the document explicitly confirms the phased rollout in Vault, the specific NIST algorithms, hybrid support, and the dependency on Go/standards maturity.
- **Extraction Quality**: HIGH
- **Source Document**: VND-058_HashiCorp_Inc..html (274.8 KB)
- **Extraction Timestamp**: 2026-06-06T20:53:09

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
- **Products / Services Covered**: CodeSign Protect; Trust Protection Platform; TLS Protect
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: No
- **Current GA Status**: Experimental
- **Customer Action Required**: Contact Venafi for activation instructions; set up self-signed CA template; create Key Pair environment template; create Key Pair environment; obtain grant; sync keystore; sign/verify using CLI
- **Key Commitments & Quotes**: "Venafi is adding experimental support for post-quantum cryptographic algorithms in CodeSign Protect"; "This feature it is experimental and is intended to help you start planning for future PQC migration"; "Experimental post-quantum signing key algorithms supported: ML-DSA ... SLH-DSA ... Falcon"
- **Coverage Verification**: CONSISTENT. The document confirms experimental support for ML-DSA and SLH-DSA in CodeSign Protect and Falcon for TLS certificates in TPP 24.3, matching the CSV notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-059_Venafi_Inc..html (47.3 KB)
- **Extraction Timestamp**: 2026-06-06T20:53:40

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
- **Hybrid Mode Support**: None detected
- **Current GA Status**: No PQC
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: None detected
- **Coverage Verification**: MISMATCH. The document text provided is truncated and does not contain the section naming post-quantum cryptography as a focus area, thus it does not confirm the CSV notes.
- **Extraction Quality**: LOW
- **Source Document**: VND-060_Okta_Inc..html (277.6 KB)
- **Extraction Timestamp**: 2026-06-06T20:54:03

## VND-064 — Internet Security Research Group

- **Vendor ID**: VND-064
- **Vendor Name**: Internet Security Research Group
- **Roadmap Title**: A Post-Quantum Future for Let's Encrypt
- **Roadmap URL**: https://letsencrypt.org/2026/06/03/pq-certs
- **Publish Date**: 2026-06-03
- **Local File**: public/vendor-roadmaps/VND-064_Internet_Security_Research_Group.html
- **CSV Coverage Notes**: Official Let's Encrypt (ISRG) post laying out their post-quantum Web PKI plan. They have chosen Merkle Tree Certificates (MTCs) as the route to quantum-safe certificates, batching a post-quantum signature across many certificates to keep TLS handshakes small. Cites CNSA 2.0 (2030-2035), NIST RSA-2048/P-256 deprecation after 2030, and the EU coordinated roadmap as drivers. Participating in IETF PLANTS/ACME working groups; tracking ML-DSA in X.509/TLS. | Milestone: Targeting a staging environment issuing MTCs in late 2026 and production-ready MTC issuance in 2027; nothing changes for existing ce
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: ML-KEM; ML-DSA
- **Target Migration Dates**: Staging environment issuing MTCs in late 2026; production-ready MTC issuance in 2027
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: CNSA 2.0; NIST; EU coordinated roadmap
- **Hybrid Mode Support**: Yes, recommends hybrid post-quantum key exchange (X25519MLKEM768) for servers
- **Current GA Status**: Planned
- **Customer Action Required**: Ensure servers support hybrid post-quantum key exchange (X25519MLKEM768); track work in IETF PLANTS working group and mtcs@chromium.org mailing list if maintaining ACME clients
- **Key Commitments & Quotes**: "Let's Encrypt is committed to a post-quantum-safe Web PKI."; "We are targeting late 2026 for a staging environment that issues MTCs, and 2027 for a production-ready environment."; "When post-quantum certificates become available from Let's Encrypt, they will arrive the way our service always has: free, automated, and available to anyone with an ACME client."
- **Coverage Verification**: CONSISTENT, the document confirms the MTC strategy, specific 2026/2027 milestones, CNSA 2.0/NIST/EU drivers, and IETF participation as noted in the CSV.
- **Extraction Quality**: HIGH
- **Source Document**: VND-064_Internet_Security_Research_Group.html (36.5 KB)
- **Extraction Timestamp**: 2026-06-06T21:12:53

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
- **Coverage Verification**: CONSISTENT. The document explicitly details the three pillars (QSSN, QCIM, QPerfect), the Solana milestone with Bonsol Labs, and the Bitcoin Quantum work, aligning with the CSV notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-089_BTQ_Technologies_Corp..html (172.7 KB)
- **Extraction Timestamp**: 2026-06-06T21:12:05

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
- **Target Migration Dates**: Full transition to PQC-based signatures targeting 2028; proactive planning and experimentation in H1 2026; exploration of post-quantum primitives in H2 2026
- **Products / Services Covered**: XRP Ledger (XRPL)
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: Yes, "hybrid post-quantum signing implementation" and "integrating candidate post-quantum signature schemes alongside existing elliptic curve signatures"
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "target for full readiness by 2028"; "targeting full transition no later than 2028"; "integrating candidate post-quantum signature schemes alongside existing elliptic curve signatures"
- **Coverage Verification**: CONSISTENT, the document explicitly details the four-phase roadmap, dates, Project Eleven collaboration, and ML-DSA experimentation as described in the notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-112_Metaco_Ripple.html (138.6 KB)
- **Extraction Timestamp**: 2026-06-06T20:54:21

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
- **Hybrid Mode Support**: Yes, hybrid post-quantum key exchange (X25519MLKEM768) combining classical cryptography with ML-KEM.
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "This is the first step in our long-term plan to protect customer data and withstand harvest-now, decrypt-later attacks."
- **Coverage Verification**: CONSISTENT, the document confirms the deployment of X25519MLKEM768 for web traffic as Phase 1 of a broader roadmap targeting HNDL risks.
- **Extraction Quality**: HIGH
- **Source Document**: VND-114_1Password_Inc..html (164.4 KB)
- **Extraction Timestamp**: 2026-06-06T21:18:14

## VND-116 — Signal Foundation

- **Vendor ID**: VND-116
- **Vendor Name**: Signal Foundation
- **Roadmap Title**: Signal PQXDH: Post-Quantum Key Agreement
- **Roadmap URL**: https://signal.org/blog/pqxdh/
- **Publish Date**: 2023-09-19
- **Local File**: public/vendor-roadmaps/VND-116_Signal_Foundation.html
- **CSV Coverage Notes**: Signal app PQXDH protocol combines X25519 ECDH with CRYSTALS-Kyber (ML-KEM) for quantum-resistant initial key agreement; implemented in libsignal and live in client apps. Subsequent SPQR (Sparse Post-Quantum Ratchet) work extends PQC beyond the handshake. | Milestone: PQXDH (X25519 + CRYSTALS-Kyber/ML-KEM hybrid) shipped in Signal clients and libsignal; default for new chats with plan to phase out classic X3DH. Follow-on SPQR/Triple Ratchet work extends PQC to the ongoing ratchet.
- **Roadmap Scope**: Single product
- **PQC Algorithms Announced**: CRYSTALS-Kyber; ML-KEM
- **Target Migration Dates**: In the coming months (after sufficient time has passed for everyone using Signal to update), we will disable X3DH for new chats and require PQXDH for all new chats.
- **Products / Services Covered**: Signal client applications; libsignal
- **Compliance Frameworks**: NIST Standardization Process for Post-Quantum Cryptography
- **Hybrid Mode Support**: Yes, combining X25519 and CRYSTALS-Kyber so that an attacker must break both systems.
- **Current GA Status**: GA
- **Customer Action Required**: Update to the latest Signal software.
- **Key Commitments & Quotes**: "we are augmenting our existing cryptosystems such that an attacker must break both systems in order to compute the keys protecting people’s communications."
- **Coverage Verification**: PARTIAL, the document confirms PQXDH implementation and phasing out X3DH but does not mention SPQR or Triple Ratchet work.
- **Extraction Quality**: HIGH
- **Source Document**: VND-116_Signal_Foundation.html (19.7 KB)
- **Extraction Timestamp**: 2026-06-06T20:54:46

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
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: NIST FIPS 203; NIST FIPS 204; NIST FIPS 205; IETF RFCs; ISO PQC standard
- **Hybrid Mode Support**: Yes; prefers hybrid deployment; uses hybrid X25519/ML-KEM768
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "we have already begun deploying and rolling out post-quantum encryption across our internal infrastructure over a multi-year process"; "Meta cryptographers are co-authors of HQC"; "we have begun deploying PQ protections across significant portions of our internal traffic"
- **Coverage Verification**: CONSISTENT; The document confirms the five maturity levels, six-step strategy, HQC co-authorship, and internal deployment milestones, though specific algorithm parameters (ML-KEM768/ML-DSA65) and the X25519 hybrid detail are in the notes rather than the truncated text.
- **Extraction Quality**: HIGH
- **Source Document**: VND-118_Meta_Platforms_Inc..html (121.9 KB)
- **Extraction Timestamp**: 2026-06-06T21:21:15

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
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: Yes, strategy uses at least three different algorithms for key exchange.
- **Current GA Status**: Beta
- **Customer Action Required**: Install WireGuard, download and run the post-quantum setup script, and activate the tunnel.
- **Key Commitments & Quotes**: "Our ambition is to develop a key exchange that uses at least three different algorithms, each based on a different math problem."; "we will extend this solution to them as well"; "intend to fully integrate with Mullvad on all platforms"
- **Coverage Verification**: PARTIAL, the document confirms the 2017 New Hope beta and multi-algorithm strategy but does not mention the 2022/2023 updates, Classic McEliece, ML-KEM, or cross-platform stabilization.
- **Extraction Quality**: HIGH
- **Source Document**: VND-119_Mullvad_VPN_AB.html (50.7 KB)
- **Extraction Timestamp**: 2026-06-06T21:21:15

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
- **Target Migration Dates**: Full transition to quantum-resistant algorithms required by 2035; deprecating RSA-2048 and other quantum-vulnerable algorithms by 2030; disallowing them by 2035
- **Products / Services Covered**: VMware Cloud Foundation (VCF); VMware vSAN; VMware vCenter; VMware Avi Load Balancer
- **Compliance Frameworks**: CNSA 2.0; NIST IR 8547; FIPS 206; TPM 2.0 v185
- **Hybrid Mode Support**: Yes, VMware Avi Load Balancer already supports hybrid post-quantum key exchange in TLS; VCF preparing for hybrid signing and hybrid TLS key exchange
- **Current GA Status**: GA (Avi Load Balancer supports hybrid PQC key exchange in TLS)
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Broadcom is committed to adopting PQC-resistant algorithms and methods for VCF on the timelines mandated by the NSA through CNSA 2.0, with full transition to quantum-resistant algorithms required by 2035."
- **Coverage Verification**: CONSISTENT, the document explicitly confirms all details in the CSV notes, including AES-256 usage, Avi hybrid PQC support, CNSA 2.0/2035 timeline, FIPS gating, and CBOM initiative.
- **Extraction Quality**: HIGH
- **Source Document**: VND-127_Broadcom_Inc..html (96.6 KB)
- **Extraction Timestamp**: 2026-06-06T20:55:09

## VND-140 — Forward Edge-AI Inc.

- **Vendor ID**: VND-140
- **Vendor Name**: Forward Edge-AI Inc.
- **Roadmap Title**: Global PQC Readiness – ForwardEdge AI (12-month Implementation Playbook)
- **Roadmap URL**: https://www.forwardedge.ai/pages/isidore-pqc-readiness
- **Publish Date**: 2026-03-13
- **Local File**: public/vendor-roadmaps/VND-140_Forward_Edge-AI_Inc..html
- **CSV Coverage Notes**: None
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: 0–3 months (Governance); 1–4 months (Inventory); 3–6 months (PoC); 5–8 months (Cassian™ Deployment); 4–9 months (Training); 7–11 months (Full-Scale Deployment); Month 12 onward (Auditing)
- **Products / Services Covered**: Isidore Quantum; Cassian™
- **Compliance Frameworks**: Singapore's QRI; CSA 2025; NIST PQC standards
- **Hybrid Mode Support**: None detected
- **Current GA Status**: No PQC
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "PQC Readiness provides a structured, twelve-month roadmap that guides governments and enterprises through seven phases of PQC adoption."
- **Coverage Verification**: CONSISTENT
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-140_Forward_Edge-AI_Inc..html (321.2 KB)
- **Extraction Timestamp**: 2026-06-06T21:54:51

## VND-146 — Robust Intelligence (Cisco AI Defense)

- **Vendor ID**: VND-146
- **Vendor Name**: Robust Intelligence (Cisco AI Defense)
- **Roadmap Title**: Cisco Post-Quantum Cryptography (Trust Center)
- **Roadmap URL**: https://www.cisco.com/site/us/en/about/trust-center/post-quantum-cryptography.html
- **Publish Date**: 2026-02-01
- **Local File**: public/vendor-roadmaps/VND-146*Robust_Intelligence_Cisco_AI_Defense*.html
- **CSV Coverage Notes**: Robust Intelligence is now part of Cisco (AI Defense / Foundation AI); it has no separate PQC roadmap and inherits Cisco's program. Cisco Quantum Resilience Framework (quantum-safe communications + quantum-safe products) targets quantum-safe communications across most core products by Dec 2026; IOS XE 26 full-stack PQC; ML-KEM/ML-DSA/SLH-DSA rollout 2026-2027. | Milestone: Cisco commits to quantum-safe communications across most of its core portfolio by December 2026 under its Quantum Resilience Framework. Network examples: FTD 10.5/ASA 9.25 (ML-KEM VPN) targeted late 2026; FTD/ASA 11.0 add ML
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: December 2026
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: None detected
- **Current GA Status**: Planned
- **Customer Action Required**: Assess cryptographic exposure across systems and data flows; prioritize sensitive data requiring long-term protection; begin a structured, ongoing transition.
- **Key Commitments & Quotes**: "Cisco is committed to delivering quantum-safe communications across the majority of Cisco’s core portfolio by December 2026"
- **Coverage Verification**: PARTIAL — The document confirms the Dec 2026 portfolio-wide commitment but does not mention Robust Intelligence, specific algorithms (ML-KEM/ML-DSA/SLH-DSA), or specific product versions (IOS XE, FTD, ASA) listed in the notes.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-146*Robust_Intelligence_Cisco_AI_Defense*.html (87.6 KB)
- **Extraction Timestamp**: 2026-06-06T20:55:42

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
- **Hybrid Mode Support**: None detected
- **Current GA Status**: No PQC
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: None detected
- **Coverage Verification**: MISMATCH — The provided document text is a generic website navigation menu and does not contain the specific PQC roadmap details, product names (TS1800, TS500/TS501), or commitments described in the CSV Coverage Notes.
- **Extraction Quality**: LOW
- **Source Document**: VND-151_Microchip_Technology_Inc..html (693.7 KB)
- **Extraction Timestamp**: 2026-06-06T20:56:02

## VND-152 — Adtran Networks SE (formerly ADVA)

- **Vendor ID**: VND-152
- **Vendor Name**: Adtran Networks SE (formerly ADVA)
- **Roadmap Title**: Quantum-Safe Communications | Adtran
- **Roadmap URL**: https://www.adtran.com/en/solutions/quantum-safe-communications
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-152*Adtran_Networks_SE_formerly_ADVA*.html
- **CSV Coverage Notes**: None
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: FSP 150 platforms; Security Director; ALM fiber monitoring
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: No
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Adtran addresses this challenge with a defense-in-depth approach that combines multi-layer, post-quantum-ready encryption"; "Quantum‑safe Multi‑layer protection of long-lived data using standards-aligned post-quantum cryptography"; "Support for post-quantum cryptography and interoperability with quantum key distribution approaches"
- **Coverage Verification**: CONSISTENT
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-152*Adtran_Networks_SE_formerly_ADVA*.html (138.9 KB)
- **Extraction Timestamp**: 2026-06-06T20:27:59

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
- **Target Migration Dates**: PQC likely introduced in 5G releases 20/21; 6G fully quantum-resistant from the start (release 21)
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: NIST FIPS 203; NIST FIPS 204; NIST FIPS 205
- **Hybrid Mode Support**: None detected
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "In 3GPP, post-quantum cryptography will likely be introduced already in the 5G era as part of upcoming releases 20 and/or 21."
- **Coverage Verification**: PARTIAL, the document confirms the 3GPP timeline and NIST algorithms but does not explicitly mention NSA CNSA 2.0 or GSMA in the provided text.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-154_Ericsson_AB.html (290.9 KB)
- **Extraction Timestamp**: 2026-06-06T21:19:04

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
- **Hybrid Mode Support**: Yes, bundles PQC, Symmetric Key Infrastructure (SKI), and QKD into a hybrid, crypto-agile migration.
- **Current GA Status**: Planned
- **Customer Action Required**: Start preparing their networks now; begin choosing quantum-safe networking technology as they architect their digital transformation.
- **Key Commitments & Quotes**: "Quantum-safe networks use quantum-safe cryptography that are secure even in the presence of powerful quantum computers."
- **Coverage Verification**: PARTIAL, the document confirms the QSN strategy, defense-in-depth approach, and bundling of PQC/SKI/QKD, but does not explicitly mention engaging NIST on building blocks or FIPS 140-3 validation in the provided text.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-155_Nokia_Corporation.html (308.5 KB)
- **Extraction Timestamp**: 2026-06-06T21:13:58

## VND-157 — ID Quantique SA

- **Vendor ID**: VND-157
- **Vendor Name**: ID Quantique SA
- **Roadmap Title**: Migrating to quantum-safe infrastructure
- **Roadmap URL**: https://www.idquantique.com/quantum-safe-security/migrating-to-quantum-safe-infrastructure/
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-157_ID_Quantique_SA.html
- **CSV Coverage Notes**: ID Quantique publishes a quantum-safe migration strategy laying out a defense-in-depth, hybrid approach that combines PQC (software, deployable now), QKD (hardware/quantum-physics based), QRNG and Quantum Key Management (Q-KMS), with strong emphasis on cryptographic hybridization and crypto-agility to de-risk a migration that 'won't happen overnight' (decade-plus) against harvest-now-decrypt-later. Clarion KX is positioned as the platform for flexible QKD+PQC deployments. Strategic/positioning content rather than a dated milestone timeline, so classified as a migration strategy page. | Milesto
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Clarion KX Platform
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: Yes, the document advocates for a hybrid cybersecurity model integrating PQC and QKD, and notes that PQC algorithms will often operate in a hybrid mode alongside classical ECC and RSA algorithms.
- **Current GA Status**: No PQC
- **Customer Action Required**: Arrange a free consultation with one of our experts today.
- **Key Commitments & Quotes**: "Implementing post-quantum cryptography won’t happen overnight"; "The journey to quantum safe infrastructure is likely to be long, complex and expensive."; "IDQ’s Quantum Key Exchange platform, Clarion KX , is purpose built to support large and flexible deployments of QKD and PQC"
- **Coverage Verification**: CONSISTENT, the document confirms the defense-in-depth hybrid strategy combining PQC, QKD, QRNG, and Q-KMS, highlights the long migration timeline, and positions Clarion KX for QKD+PQC deployments.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-157_ID_Quantique_SA.html (375.0 KB)
- **Extraction Timestamp**: 2026-06-06T21:13:58

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
- **Coverage Verification**: CONSISTENT; The document confirms QID 38994 usage, lists the specified scan sources (VM, Certificate View, WAS, EASM, VM_AUTH), and matches the April 2026 copyright date.
- **Extraction Quality**: HIGH
- **Source Document**: VND-164_Qualys_Inc..html (56.4 KB)
- **Extraction Timestamp**: 2026-06-07T23:37:38

## VND-168 — Arqit Quantum Inc.

- **Vendor ID**: VND-168
- **Vendor Name**: Arqit Quantum Inc.
- **Roadmap Title**: Arqit Quantum-Safe Security Approach
- **Roadmap URL**: https://arqitgroup.com/company/our-approach
- **Publish Date**: 2025-01-01
- **Local File**: public/vendor-roadmaps/VND-168_Arqit_Quantum_Inc..html
- **CSV Coverage Notes**: Arqit's quantum-safe approach centers on the SKA Platform (Symmetric Key Agreement) delivering quantum-safe key agreement with perfect forward secrecy; products: PQC Migration / Encryption Intelligence (crypto discovery), SKA Edge & Central Controllers, NetworkSecure. FIPS 140-3 validated, hybrid/crypto-agile, supports symmetric-only provisioning. Formally verified (Tamarin, Univ. of Surrey). Recent 2024-2025 industry awards. | Milestone: FIPS 140-3 validated Symmetric Key Agreement (SKA) Platform with hybrid crypto-agility; software-only SKA Edge/Central Controllers plus NetworkSecure and PQC
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: PQC Migration; SKA Edge Controller; SKA Central Controller; Network Security; SKA-Platform
- **Compliance Frameworks**: FIPS
- **Hybrid Mode Support**: Yes, "Our standards-based hybrid approach maximizes compatibility, offers cryptoagility, and minimizes risk"
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Arqit's encryption keys are the most secure They aren’t vulnerable to quantum methods"; "Arqit’s protocols have been formally validated using the Tamarin prover method"; "Arqit’s use of PQAs is limited to initial provisioning and customers can opt for symmetric-only provisioning"
- **Coverage Verification**: PARTIAL, The document confirms the SKA Platform, formal verification (Tamarin), hybrid approach, and symmetric-only provisioning, but does not explicitly name "NetworkSecure" or "Encryption Intelligence" as distinct products, nor does it mention FIPS 140-3 validation or recent awards.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-168_Arqit_Quantum_Inc..html (90.3 KB)
- **Extraction Timestamp**: 2026-06-06T20:56:39

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
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: DORA; NIS2; PCI DSS 4.0; EU coordinated roadmap; NSA CNSA 2.0; NIST; ENISA
- **Hybrid Mode Support**: Yes, the document recommends "adopting hybrid classical–PQC encryption schemes" and details a "Hybrid Cryptography Pilot" in Phase 3.
- **Current GA Status**: No PQC
- **Customer Action Required**: Perform cryptographic inventory; establish governance; implement centralized key management; pilot hybrid PQC; upgrade HSMs/libraries; decommission legacy crypto.
- **Key Commitments & Quotes**: "The EU’ s coordinated PQC roadmap asks Member States to start transition activities by end-2026 and to secure high-risk systems... with PQC by end-2030."
- **Coverage Verification**: CONSISTENT. The document text explicitly outlines the five-phase roadmap with the specified month-based timelines and regulatory alignments described in the CSV notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-169_Cryptomathic_A_S.html (251.3 KB)
- **Extraction Timestamp**: 2026-06-06T21:19:04

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
- **Hybrid Mode Support**: Yes; The strategy supports hybrid cryptography, allowing traditional algorithms (like RSA) and quantum-resistant algorithms (like ML-DSA) to exist side-by-side.
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Docusign sichert digitale Vereinbarungen für die Quanten-Ära mit Post-Quanten-Kryptografie (PQC)."
- **Coverage Verification**: PARTIAL; The document confirms the ML-DSA hybrid strategy and three pillars, but does not explicitly mention ML-KEM or SLH-DSA/SPHINCS+ in the provided text.
- **Extraction Quality**: HIGH
- **Source Document**: VND-171_DocuSign.html (483.5 KB)
- **Extraction Timestamp**: 2026-06-06T20:57:01

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
- **Coverage Verification**: CONSISTENT. The document explicitly confirms the use of Dilithium3 for Root/Intermediate CAs, the likelihood of ML-DSA-65 and Kyber for TLS/leaf certs, and the need for PQ-safe OCSP/CRL, matching the CSV notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-173_GlobalSign_Ltd..html (97.7 KB)
- **Extraction Timestamp**: 2026-06-06T20:57:25

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
- **Hybrid Mode Support**: None detected
- **Current GA Status**: No PQC
- **Customer Action Required**: Understand the Threat; Adopt PQC Standards; Partner with Experts
- **Key Commitments & Quotes**: "Cryptographic Agility: Built-in flexibility to seamlessly transition to quantum-resistant cryptographic algorithms as new standards emerge."
- **Coverage Verification**: CONSISTENT. The document is an advisory blog published on Feb 27, 2025, discussing NIST FIPS 203/204/205 and crypto-agility for IAM without naming specific products or milestones.
- **Extraction Quality**: HIGH
- **Source Document**: VND-178_Ping_Identity_Holdings_Corp..html (61.4 KB)
- **Extraction Timestamp**: 2026-06-06T20:57:50

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
- **Hybrid Mode Support**: Partial; mentions "hybrid certificates" as part of the strategy to define adoption plans.
- **Current GA Status**: Preview
- **Customer Action Required**: Request access in your SCM; Talk to us; Start your PQC journey with a free consultation.
- **Key Commitments & Quotes**: "Issue and manage private PQC certificates directly in SCM using supported ML-DSA algorithms"; "By 2030, advances in quantum computing are predicted to make the use of conventional asymmetric cryptography insecure"; "Sectigo’s Q.U.A.N.T. framework outlines the key stages organizations follow as they prepare for post-quantum cryptography"
- **Coverage Verification**: CONSISTENT; The document explicitly confirms SCM offers Private PQC with ML-DSA, references RFC 9881, details the Q.U.A.N.T. framework steps, and cites the 2030 risk horizon.
- **Extraction Quality**: HIGH
- **Source Document**: VND-181_Sectigo_Ltd..html (408.1 KB)
- **Extraction Timestamp**: 2026-06-06T20:58:12

## VND-183 — Splunk Inc. (Cisco)

- **Vendor ID**: VND-183
- **Vendor Name**: Splunk Inc. (Cisco)
- **Roadmap Title**: Quantum-Safe Cryptography & Standards: QSC, PQC, QKD & More
- **Roadmap URL**: https://www.splunk.com/en_us/blog/learn/quantum-safe-cryptography-standards.html
- **Publish Date**: 2023-08-23
- **Local File**: public/vendor-roadmaps/VND-183*Splunk_Inc.\_Cisco*.html
- **CSV Coverage Notes**: Educational Splunk blog explaining quantum-safe cryptography terminology (QSC, PQC, QKD) and the NIST-selected algorithms CRYSTALS-Kyber, CRYSTALS-Dilithium, FALCON, SPHINCS+. Advises waiting for standardized, tested implementations. Contains NO Splunk-specific product roadmap, GA dates, or concrete migration commitments. As Splunk is now a Cisco company, product PQC direction tracks Cisco's crypto-agility roadmap. Best available official Splunk source on PQC. | Milestone: No Splunk product-level PQC milestone published; article is educational only. Splunk (acquired by Cisco) defers to Cisco's
- **Roadmap Scope**: Algorithm/standard reference
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA; FN-DSA; HQC
- **Target Migration Dates**: None detected
- **Products / Services Covered**: None detected
- **Compliance Frameworks**: NIST SP 800-208
- **Hybrid Mode Support**: None detected
- **Current GA Status**: No PQC
- **Customer Action Required**: Auditing your systems; Making an asset inventory; Planning lifecycle management; wait for well-researched, international standards and implementations
- **Key Commitments & Quotes**: None detected
- **Coverage Verification**: CONSISTENT. The document is an educational blog post explaining PQC terminology and NIST standards, explicitly advising against custom implementations and containing no Splunk-specific product roadmap or migration commitments.
- **Extraction Quality**: LOW
- **Source Document**: VND-183*Splunk_Inc.\_Cisco*.html (29.1 KB)
- **Extraction Timestamp**: 2026-06-06T20:58:36

## VND-187 — Tuta GmbH

- **Vendor ID**: VND-187
- **Vendor Name**: Tuta GmbH
- **Roadmap Title**: Tuta Launches Post Quantum Cryptography For Email (TutaCrypt)
- **Roadmap URL**: https://tuta.com/blog/post-quantum-cryptography
- **Publish Date**: 2024-03-11
- **Local File**: public/vendor-roadmaps/VND-187_Tuta_GmbH.html
- **CSV Coverage Notes**: Tuta details its hybrid PQC protocol TutaCrypt (CRYSTALS-Kyber-1024 KEM + X25519 ECDH, AES-256/HMAC-SHA-256, Argon2/HKDF), enabled by default for all new accounts. Roadmap includes gradual migration of existing users via key-rotation mechanism, formal protocol verification with University of Wuppertal, full PQMail protocol for Perfect Forward Secrecy, and the PQDrive project (German-government-funded) building post-quantum-secure cloud storage (Tuta Drive). | Milestone: Quantum-safe encryption enabled by default in Tuta Mail and Calendar; rolling out to existing single-user accounts; key verif
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: CRYSTALS-Kyber; ML-KEM; ML-DSA; CRYSTALS-Dilithium
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Tuta Mail; Tuta Calendar; Tuta Drive
- **Compliance Frameworks**: NIST; BSI
- **Hybrid Mode Support**: Yes, TutaCrypt combines CRYSTALS-Kyber (PQC) with X25519 ECDH (classical) and AES-256.
- **Current GA Status**: GA
- **Customer Action Required**: New users must update to the latest version of the Tuta apps; existing users will be rolled out to gradually.
- **Key Commitments & Quotes**: "enabling quantum-safe encryption by default for all new Tuta Mail accounts"; "roll out post-quantum secure encryption to all ten million existing users"; "aim to implement the full PQMail protocol to achieve Perfect Forward Secrecy"
- **Coverage Verification**: CONSISTENT
- **Extraction Quality**: HIGH
- **Source Document**: VND-187_Tuta_GmbH.html (148.7 KB)
- **Extraction Timestamp**: 2026-06-06T21:25:44

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
- **Coverage Verification**: PARTIAL; The document confirms the blog series and Zero Trust Exchange focus but does not mention the 'Quantum-Ready SSE' launch, specific SI partners (EY, HCLTech), or IPsec tunnel details found in the CSV notes.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-190_Zscaler_Inc..html (256.2 KB)
- **Extraction Timestamp**: 2026-06-06T22:27:49

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
- **Key Commitments & Quotes**: "The EU Member States, supported by the Commission, issued a roadmap and timeline to start using a more complex form of cybersecurity, the so-called post-quantum cryptography (PQC)."
- **Coverage Verification**: PARTIAL, the document confirms the Commission/NIS2 context and the 11 April 2024 Recommendation but does not contain the specific milestones (2026, 2030, 2035) or hybrid scheme details listed in the CSV notes.
- **Extraction Quality**: LOW
- **Source Document**: VND-220_European_Commission.html (49.3 KB)
- **Extraction Timestamp**: 2026-06-06T21:20:09

## VND-225 — Proton AG

- **Vendor ID**: VND-225
- **Vendor Name**: Proton AG
- **Roadmap Title**: Proton is building quantum-safe PGP encryption for everyone
- **Roadmap URL**: https://proton.me/blog/post-quantum-encryption
- **Publish Date**: 2023-10-24
- **Local File**: public/vendor-roadmaps/VND-225_Proton_AG.html
- **CSV Coverage Notes**: Official Proton blog laying out their quantum-safe strategy: standardizing a post-quantum extension to OpenPGP (with German BSI and others since 2021), hybrid algorithms (CRYSTALS-Kyber + X25519 for encryption, CRYSTALS-Dilithium + Ed25519 for signatures), and a sequence of future steps (community standardization, symmetric-key/message re-encryption). May 2026 follow-through: Proton Mail rolled out post-quantum encryption to all users. | Milestone: May 2026 general rollout of post-quantum (OpenPGP v6, hybrid) encryption to all Proton Mail users; next: cross-provider interoperability (Thunderbi
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: CRYSTALS-Kyber; CRYSTALS-Dilithium
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: BSI
- **Hybrid Mode Support**: Yes, using CRYSTALS-Kyber + X25519 for encryption and CRYSTALS-Dilithium + Ed25519 for signatures.
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Proton is leading the standardization of quantum-safe encryption algorithms in OpenPGP"; "we will use post-quantum cryptography in combination with classical cryptography"; "We will roll this out well before quantum computers become a threat"
- **Coverage Verification**: PARTIAL, the document confirms the strategy, algorithms, and BSI collaboration but does not mention the May 2026 rollout milestone or OpenPGP v6.
- **Extraction Quality**: HIGH
- **Source Document**: VND-225_Proton_AG.html (310.2 KB)
- **Extraction Timestamp**: 2026-06-06T20:59:17

## VND-227 — SUSE LLC (openSUSE)

- **Vendor ID**: VND-227
- **Vendor Name**: SUSE LLC (openSUSE)
- **Roadmap Title**: SUSE state of and strategy for Post Quantum Cryptography at the end of 2025
- **Roadmap URL**: https://www.suse.com/c/suse-state-of-and-strategy-for-post-quantum-cryptography-at-the-end-of-2025/
- **Publish Date**: 2025-12-04
- **Local File**: public/vendor-roadmaps/VND-227*SUSE_LLC_openSUSE*.html
- **CSV Coverage Notes**: SUSE's official PQC strategy blog explicitly covers both SUSE Linux Enterprise and openSUSE: adopt NIST standards and upstream implementations quickly, use hybrid ciphers during transition. openSUSE Tumbleweed/Leap have landed hybrid PQC (ML-KEM-768 + X25519), including the libzupt cryptographic library (announced openSUSE news, 2026-04-28). | Milestone: Hybrid PQC (ML-KEM-768 + X25519) available in openSUSE Tumbleweed and Leap; libzupt PQC library released (April 2026).
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA; LMS; XMSS; Frodo KEM
- **Target Migration Dates**: None detected
- **Products / Services Covered**: SUSE Linux Enterprise Server (SLES) 15 SP6; SLES 15 SP7; SUSE Linux Micro (SL Micro) 6.0; SL Micro 6.1; SLES 16.0; SL Micro 6.2
- **Compliance Frameworks**: FIPS 203; FIPS 204; FIPS 205; FIPS 186; FIPS 140-3
- **Hybrid Mode Support**: Yes, the document states that "During the transition time there will be hybrid ciphers used" and specifically mentions "hybrid ML-KEM 768 / X25519 key agreement" for TLS, IKEv2, and SSH.
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "SUSE’s strategy on implementing post quantum cryptography (PQC) has been to adopt standards and upstream implementations when they become available"
- **Coverage Verification**: MISMATCH, the document text does not mention openSUSE Tumbleweed, openSUSE Leap, or the libzupt library, covering only SUSE Linux Enterprise and SUSE Linux Micro products.
- **Extraction Quality**: HIGH
- **Source Document**: VND-227*SUSE_LLC_openSUSE*.html (188.6 KB)
- **Extraction Timestamp**: 2026-06-06T21:24:41

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
- **Target Migration Dates**: April 30, 2026 (TLS 1.3 default); April 14, 2030 (Cloud Security Alliance deadline for PQC infrastructure)
- **Products / Services Covered**: Confluent Cloud
- **Compliance Frameworks**: NIST FIPS 203; NIST FIPS 204; NIST FIPS 205
- **Hybrid Mode Support**: Yes, moving toward a hybrid key exchange model combining traditional classical signatures with new PQC signatures.
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "On April 30, 2026, Confluent Cloud will enable TLS 1.3 by default for all newly provisioned clusters"; "we’re moving toward a hybrid key exchange model"; "Confluent already uses symmetric Advanced Encryption Standard (AES) 256 keys... making these environments PQC-compliant"
- **Coverage Verification**: CONSISTENT, the document confirms the multi-phase strategy, specific algorithms, data-in-transit/at-rest details, and the April 30, 2026 milestone.
- **Extraction Quality**: HIGH
- **Source Document**: VND-230_Confluent_Inc..html (211.7 KB)
- **Extraction Timestamp**: 2026-06-06T21:15:18

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
- **Products / Services Covered**: Wiz for PQC Readiness; Wiz Cloud; Wiz for Gov; Wiz Code; Wiz Runtime Sensor; Wiz DSPM; Wiz IDE Extension; Wiz CLI; Wiz PQC Tester
- **Compliance Frameworks**: FedRAMP High
- **Hybrid Mode Support**: None detected
- **Current GA Status**: GA
- **Customer Action Required**: Log in to Wiz tenant to explore the Cryptographic Readiness board; Scan domain using PQC Tester
- **Key Commitments & Quotes**: "Wiz for PQC Readiness is now generally available for all Wiz customers."
- **Coverage Verification**: CONSISTENT
- **Extraction Quality**: HIGH
- **Source Document**: VND-231_Wiz_Inc..html (330.0 KB)
- **Extraction Timestamp**: 2026-06-06T21:12:05

## VND-233 — Huawei Technologies Co. Ltd.

- **Vendor ID**: VND-233
- **Vendor Name**: Huawei Technologies Co. Ltd.
- **Roadmap Title**: Post-Quantum Cryptography - Huawei Trust Center
- **Roadmap URL**: https://www.huawei.com/en/trust-center/post-quantum-cryptography
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-233_Huawei_Technologies_Co.\_Ltd..html
- **CSV Coverage Notes**: Official Huawei Trust Center page setting out the company's quantum-safe strategy: prioritizing quantum-safe key-agreement to counter store-now-decrypt-later, adopting hybrid schemes (classical Diffie-Hellman + PQC KEM) during transition, tracking NIST standardization, and committing to introduce quantum-safe algorithms into products early. Reviews the six PQC algorithm families and selection criteria (security maturity, complexity, performance). | Milestone: Deploy hybrid (classical + PQC) key-agreement in products in advance of finalized standards; align with NIST PQC standardization outcome
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: in advance of the 2024 deadline
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: Yes, implementing a hybrid scheme that implements both Diffie-Hellman and a candidate quantum-safe key-exchange mechanism.
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Huawei plans to introduce quantum-safe algorithms into its products at an early date"
- **Coverage Verification**: CONSISTENT, the document explicitly details the strategy for hybrid key-agreement, the six algorithm families, and the commitment to early introduction ahead of the 2024 standardization deadline.
- **Extraction Quality**: HIGH
- **Source Document**: VND-233_Huawei_Technologies_Co.\_Ltd..html (111.9 KB)
- **Extraction Timestamp**: 2026-06-06T21:16:23

## VND-235 — Samsung SDS Co. Ltd.

- **Vendor ID**: VND-235
- **Vendor Name**: Samsung SDS Co. Ltd.
- **Roadmap Title**: In the Era of Quantum Computing, SDS is Taking the Following Steps to Enhance Security - Participating in NIST Post-Quantum Cryptography Migration Project
- **Roadmap URL**: https://www.samsungsds.com/en/research-blog/post-quantum-crypto-migration.html
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-235_Samsung_SDS_Co.\_Ltd..html
- **CSV Coverage Notes**: Official Samsung SDS research blog describing its quantum-safe strategy across three pillars: building the Crypto Agility Platform / S-CAPE for enterprise PQC migration (identification, analysis, migration phases), active participation in NIST NCCoE Migration to PQC project (founding member since June 2022), and advancing domestic KPQC standards (AIMer selected 2025). PQC piloted in Samsung Cloud Platform communications with planned expansion. | Milestone: Provide S-CAPE PQC migration via Samsung Cloud Platform and expand PQC application in SCP communication segments; presented Software-Define
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA; HQC
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Crypto Agility Platform; Samsung Cloud Platform
- **Compliance Frameworks**: NIST FIPS; NIST SP 1800 series
- **Hybrid Mode Support**: None detected
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Samsung SDS developed the Crypto Agility Platform, equipping enterprises with the tools needed to migrate to post-quantum cryptography (PQC)."
- **Coverage Verification**: PARTIAL, the document confirms the Crypto Agility Platform, NIST participation, and AIMer selection, but does not mention "S-CAPE" or the specific "PQC piloted in Samsung Cloud Platform communications" milestone.
- **Extraction Quality**: HIGH
- **Source Document**: VND-235_Samsung_SDS_Co.\_Ltd..html (35.3 KB)
- **Extraction Timestamp**: 2026-06-06T21:16:23

## VND-239 — Eviden SAS (Atos Group)

- **Vendor ID**: VND-239
- **Vendor Name**: Eviden SAS (Atos Group)
- **Roadmap Title**: Post-Quantum Cryptography (PQC) | Eviden
- **Roadmap URL**: https://eviden.com/solutions/cybersecurity/post-quantum-security-pqc/
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-239*Eviden_SAS_Atos_Group*.html
- **CSV Coverage Notes**: Official Eviden PQC page presenting a structured quantum-safe migration framework: a 4-step approach (awareness/education, cryptography inventory, risk assessment, implementation) plus a referenced 6-step PQC migration framework whitepaper. Frames urgency (quantum maturity ~2037; irreducible ~3-year migration timeline per CSA) and supports migration with PQC Explorer tooling, C-QSR Quantum Safe Remediation suite, and quantum-ready products (Trustway HSM/IP Protect, IDnomic PKI, PQC HSMaaS). | Milestone: Drive customer migration via cryptography inventory + risk assessment toward hybrid PQC; qu
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: 2037 (quantum maturity); 3 years (irreducible migration timeline)
- **Products / Services Covered**: PQC Explorer; Trustway HSM; Trustway IP Protect; IDnomic PKI; PQC HSMaaS
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: No
- **Current GA Status**: GA
- **Customer Action Required**: Run cryptography inventory; perform risk assessment; prioritize assets; migrate to PQC algorithms
- **Key Commitments & Quotes**: "Migrating to PQC is not an option, rather a vital requirement to maintain your business continuity and security."
- **Coverage Verification**: PARTIAL, the document confirms the 4-step framework, 2037 timeline, 3-year migration, PQC Explorer, and specific products, but does not mention the "C-QSR Quantum Safe Remediation suite" or the "6-step PQC migration framework whitepaper" referenced in the notes.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-239*Eviden_SAS_Atos_Group*.html (137.3 KB)
- **Extraction Timestamp**: 2026-06-06T21:16:23

## VND-240 — Orange S.A.

- **Vendor ID**: VND-240
- **Vendor Name**: Orange S.A.
- **Roadmap Title**: Orange: leading the way in quantum technologies for a safer, smarter future
- **Roadmap URL**: https://www.orange.com/en/news/2025/orange-leading-way-quantum-technologies-safer-smarter-future
- **Publish Date**: 2025
- **Local File**: public/vendor-roadmaps/VND-240_Orange_S.A..html
- **CSV Coverage Notes**: None
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: ML-KEM; ML-DSA
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: NIST; ENISA; ANSSI
- **Hybrid Mode Support**: No
- **Current GA Status**: Planned
- **Customer Action Required**: Map vulnerabilities; Plan the transition; Build in crypto-agility; Test before deploying; Roll out gradually
- **Key Commitments & Quotes**: "PQC + QKD: our dual strategy for the quantum era"; "Orange Cyberdefense is already supporting organizations through this transformation with a proven methodology called Quantum Safe Migration."; "Our approach integrates crypto-agility to ensure that systems remain resilience as cryptographic standards continue to evolve."
- **Coverage Verification**: CONSISTENT
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-240_Orange_S.A..html (206.1 KB)
- **Extraction Timestamp**: 2026-06-06T20:35:48

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
- **Hybrid Mode Support**: Yes, hybrid deployment frameworks
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "quantum resiliency across Critical Information Infrastructure by 2029"; "enterprise-wide post-quantum cryptography adoption by 2033"; "build a quantum-secure digital backbone suited to India's scale"
- **Coverage Verification**: PARTIAL, the document confirms the DST Task Force, National Quantum Mission, and targets, but does not mention Dr. Rajkumar Upadhyay, C-DOT, or the specific PDF date of 4 Feb 2026.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-251_Department_of_Science_and_Technology_DST_India.html (53.1 KB)
- **Extraction Timestamp**: 2026-06-06T21:17:16

## VND-258 — NetSfere (Infinite Convergence Solutions)

- **Vendor ID**: VND-258
- **Vendor Name**: NetSfere (Infinite Convergence Solutions)
- **Roadmap Title**: The NetSfere Edge — Post-Quantum Cryptography
- **Roadmap URL**: https://netsfere.com/Resources/pqc
- **Publish Date**: 2025-03-27
- **Local File**: public/vendor-roadmaps/VND-258*NetSfere_Infinite_Convergence_Solutions*.html
- **CSV Coverage Notes**: NetSfere publishes a dedicated PQC strategy page ('The NetSfere Edge') describing its crypto-agile, quantum-proof secure-communication architecture. Built on four pillars (Modular Architecture, NIST Standard Compliance, Automated Updates, Backward Compatibility), using Rust-based ML-KEM 1024 (FIPS 203, evolved from CRYSTALS-Kyber) paired with AES-256. Architecture is designed for seamless transition to future quantum-safe standards. Backed by a March 2025 press release unveiling the enterprise-ready quantum-proof platform; crypto-agile architecture first announced at NetSfere Connections 2024
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: ML-KEM
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: Yes, "Seamless Communication with ECC users is assured with ECC backward compatibility, while new conversations adopt ML-KEM 1024"
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "NetSfere... unveils the industry’s first Quantum-Proof Secure Communication Platform."
- **Coverage Verification**: PARTIAL, The document confirms the architecture, pillars, and ML-KEM 1024 usage, but does not explicitly mention "FIPS 203", "AES-256", the "March 2025 press release", or "NetSfere Connections 2024".
- **Extraction Quality**: HIGH
- **Source Document**: VND-258*NetSfere_Infinite_Convergence_Solutions*.html (66.3 KB)
- **Extraction Timestamp**: 2026-06-06T21:17:16

## VND-259 — Cellcrypt Limited

- **Vendor ID**: VND-259
- **Vendor Name**: Cellcrypt Limited
- **Roadmap Title**: Store Now, Decrypt Later: The Quantum Computing Threat (PQC strategy & phased migration)
- **Roadmap URL**: https://www.cellcrypt.com/post/post-quantum-cryptography-and-the-store-now-decrypt-later-threat/
- **Publish Date**: 2024-10-17
- **Local File**: public/vendor-roadmaps/VND-259_Cellcrypt_Limited.html
- **CSV Coverage Notes**: Cellcrypt's blog 'Store Now, Decrypt Later' (17 Oct 2024) lays out its dual-layer PQC strategy combining CRYSTALS-Kyber (ML-KEM, lattice-based) with Classic McEliece (code-based) plus an agile post-quantum crypto layer for easy algorithm replacement, and includes a 12-month phased migration roadmap (Phase 1 inventory/months 1-2; Phase 2 hybrid deployment/months 3-6; Phase 3 PQ-only or dual-layer migration + audit/months 7-12). Modules certified FIPS 140-3 Level 3. | Milestone: Dual-layer PQC (CRYSTALS-Kyber + Classic McEliece) with agile crypto layer live in product; FIPS 140-3 Level 3 validat
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: ML-KEM; ML-DSA; SLH-DSA; CRYSTALS-Kyber; Classic McEliece
- **Target Migration Dates**: 12-month phased migration (Phase 1: Months 1-2; Phase 2: Months 3-6; Phase 3: Months 7-12)
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: NIST; FIPS 140-3 Level 3
- **Hybrid Mode Support**: Yes; Hybrid approaches (classical + PQ) provide backward compatibility during transition
- **Current GA Status**: Planned
- **Customer Action Required**: Begin phased rollout to key exchange mechanisms immediately; Inventory current encryption usage; Identify long-lived secrets and retention policies
- **Key Commitments & Quotes**: "Cellcrypt implements a dual-layer PQ architecture that composes: CRYSTALS-Kyber (ML-KEM)... Classic McEliece"
- **Coverage Verification**: PARTIAL; The document confirms the dual-layer strategy, algorithms, and 12-month roadmap, but does not mention an "agile post-quantum crypto layer" or "FIPS 140-3 Level 3" certification.
- **Extraction Quality**: HIGH
- **Source Document**: VND-259_Cellcrypt_Limited.html (43.1 KB)
- **Extraction Timestamp**: 2026-06-07T23:33:51

## VND-261 — XWiki SAS (CryptPad)

- **Vendor ID**: VND-261
- **Vendor Name**: XWiki SAS (CryptPad)
- **Roadmap Title**: Towards More Cryptographic Agility — CryptPad Blueprints (PQC integration)
- **Roadmap URL**: https://blueprints.cryptpad.org/review/agility/
- **Publish Date**: 2025-09-05
- **Local File**: public/vendor-roadmaps/VND-261*XWiki_SAS_CryptPad*.html
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
- **Coverage Verification**: MISMATCH. The document text is a general architectural blueprint for cryptographic agility that mentions NIST standards generally but does not explicitly name ML-KEM, ML-DSA, the Crystals suite, or the specific proof-of-concept milestones cited in the CSV notes.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-261*XWiki_SAS_CryptPad*.html (32.4 KB)
- **Extraction Timestamp**: 2026-06-06T21:17:16

## VND-263 — Quranium

- **Vendor ID**: VND-263
- **Vendor Name**: Quranium
- **Roadmap Title**: Quranium Blockchain Documentation / 2025 Roadmap
- **Roadmap URL**: https://docs.quranium.org/
- **Publish Date**: 2025-12-22
- **Local File**: public/vendor-roadmaps/VND-263_Quranium.html
- **CSV Coverage Notes**: Quranium is a quantum-secure Layer 1 blockchain built on SLH-DSA (stateless hash-based, SPHINCS+ family). Its docs and 2025 roadmap cover the Convergence Layer (PoS P2P stack with post-quantum protections), QSafe Wallet, and QINFI quantum-secure SuperApp (launched Dec 2025). A phased migration approach maintains backward compatibility between SPHINCS+ and SLH-DSA during transition. PQC is core to the protocol design. | Milestone: Dec 2025: launched QINFI quantum-secure SuperApp; 2025 rollout of PoS Convergence Layer and QSafe Wallet on SLH-DSA mainnet.
- **Extraction Error**: Bot-protection/error page detected: "ray id"
- **Extraction Timestamp**: 2026-06-06T21:18:14

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
- **Hybrid Mode Support**: Partial, document mentions "hybrid classical/PQC key exchange" in CSV notes and "One-Time Pad (OTP) encryption... complementing the forward-looking protection of PQC" in text, but does not explicitly detail a hybrid classical+PQC mode for ML-KEM/ML-DSA in the provided text.
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "The Kryptus BruitBlanc ecosystem is an integrated suite of hardware and software cryptographic solutions designed to provide this trusted foundation."
- **Coverage Verification**: PARTIAL, the document confirms the products and ecosystem but does not explicitly list the four-step roadmap steps (Discover, Fortify, Secure, Extend) in the provided text.
- **Extraction Quality**: HIGH
- **Source Document**: VND-269_Kryptus_Solu_es_em_TI_Ltda..html (79.8 KB)
- **Extraction Timestamp**: 2026-06-06T21:20:09

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
- **Hybrid Mode Support**: Yes, combining traditional and post-quantum cryptography
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "We’re developing the current security of our networks, adding an extra layer of security with quantum-safe technology andcombining traditional and post-quantum cryptography."
- **Coverage Verification**: PARTIAL, the document confirms the three pillars and subsea/IoT/eSIM deployments but does not mention the Centre of Excellence, QKD, EuroQCI, or the EU PQC Roadmap contribution.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-273_Telefonica_S.A..html (160.8 KB)
- **Extraction Timestamp**: 2026-06-06T21:25:44

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
- **Hybrid Mode Support**: None detected
- **Current GA Status**: No PQC
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Cybernetica has been awarded three strategic procurements by the Estonian government to lead the nation's transition of e-governance systems to post-quantum cryptography (PQC)."
- **Coverage Verification**: CONSISTENT. The document explicitly confirms the three procurements, the three-phase roadmap structure, the specific systems covered (eID, X-Road, etc.), the Population Register assessment, and the SHA-1 to SHA-512 migration precedent.
- **Extraction Quality**: HIGH
- **Source Document**: VND-291_Cybernetica_AS.html (78.0 KB)
- **Extraction Timestamp**: 2026-06-06T21:19:04

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
- **Hybrid Mode Support**: Yes, favoring hybrid PQC schemes
- **Current GA Status**: No PQC
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "issued a roadmap and timeline to start using a more complex form of cybersecurity, the so-called post-quantum cryptography (PQC)"
- **Coverage Verification**: CONSISTENT, the document confirms the release date, the issuing bodies (NIS Cooperation Group and Commission), and the high-level nature of the roadmap for Member States.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-300_EU_NIS_Cooperation_Group.html (49.3 KB)
- **Extraction Timestamp**: 2026-06-06T21:19:04

## VND-304 — Akamai Technologies, Inc.

- **Vendor ID**: VND-304
- **Vendor Name**: Akamai Technologies, Inc.
- **Roadmap Title**: Taking Steps to Prepare for Quantum Advantage
- **Roadmap URL**: https://www.akamai.com/blog/security/taking-steps-to-prepare-for-quantum-advantage
- **Publish Date**: 2025
- **Local File**: public/vendor-roadmaps/VND-304_Akamai_Technologies\_\_Inc..html
- **CSV Coverage Notes**: Akamai's phased PQC roadmap for end-to-end quantum-safe support across its platform, covering client-to-Akamai, Akamai-to-origin (G2O), and internal mid-tier connections. Uses TLS 1.3 hybrid X25519MLKEM768 (NIST FIPS 203 ML-KEM) and platform-wide crypto-agility upgrades; aligned with NSA/CISA/NIST quantum-readiness guidance. | Milestone: PQC enabled by default for all Enhanced TLS customers and G2O origin connections in Q1 2026; all Akamai-to-Akamai mid-tier connections quantum-safe by March 2026.
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: Second half of 2024; early 2025
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: NIST; NSA; CISA
- **Hybrid Mode Support**: Yes, adoption of hybrid key exchange algorithms
- **Current GA Status**: Beta
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "We plan to take a phased approach to support end-to-end post-quantum cryptography on our platform."
- **Coverage Verification**: PARTIAL, the document confirms the phased approach and early milestones (H2 2024, early 2025) but does not mention the specific Q1 2026/March 2026 milestones or the specific ML-KEM algorithm cited in the notes.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-304_Akamai_Technologies\_\_Inc..html (180.5 KB)
- **Extraction Timestamp**: 2026-06-06T21:12:05

## VND-312 — Netskope, Inc.

- **Vendor ID**: VND-312
- **Vendor Name**: Netskope, Inc.
- **Roadmap Title**: Preparing for a Future with Post-Quantum Cryptography
- **Roadmap URL**: https://www.netskope.com/resources/white-papers/preparing-for-a-future-with-post-quantum-cryptography
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-312_Netskope_Inc..html
- **CSV Coverage Notes**: Official Netskope white paper (authored by CTO Krishna Narayanaswamy), complemented by the 'Planning for a Post-quantum World, Now!' blog, outlining how encryption is implemented across the Netskope One platform and the company's strategy to address quantum threats. Netskope evaluated five places in the Netskope One architecture using encryption and is adopting NIST PQC algorithms (ML-KEM-768) to build protections. | Milestone: Quantum-resilient Netskope One in development, intended to be available for customer sandbox testing; standardizing on ML-KEM-768.
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: None detected
- **Current GA Status**: No PQC
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: None detected
- **Coverage Verification**: MISMATCH. The provided document text is a website navigation menu and footer containing no substantive white paper content, whereas the CSV notes describe specific technical details (ML-KEM-768, five architecture points) not present in the text.
- **Extraction Quality**: LOW
- **Source Document**: VND-312_Netskope_Inc..html (1516.5 KB)
- **Extraction Timestamp**: 2026-06-06T21:16:23

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
- **Hybrid Mode Support**: Yes, described as "quantum-resistant hybrid blockchain platform"
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Our vision of launching the world's first quantum-resistant hybrid blockchain platform"
- **Coverage Verification**: PARTIAL, the document confirms the roadmap structure and audit statuses but does not explicitly name Dilithium or ML-DSA algorithms.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-318_QANplatform.html (455.5 KB)
- **Extraction Timestamp**: 2026-06-06T21:22:23

## VND-319 — QNu Labs Pvt. Ltd.

- **Vendor ID**: VND-319
- **Vendor Name**: QNu Labs Pvt. Ltd.
- **Roadmap Title**: A Strategic Roadmap for Transitioning to Quantum Cyber Readiness
- **Roadmap URL**: https://www.qnulabs.com/blog/cert-in-quantum-cyber-readiness-roadmap
- **Publish Date**: 2026-01-26
- **Local File**: public/vendor-roadmaps/VND-319_QNu_Labs_Pvt.\_Ltd..html
- **CSV Coverage Notes**: Published QNu Labs strategic roadmap (aligned with CERT-In) for transitioning to quantum-safe cryptography. Four phases: foundational assessment & CBOM/QBOM inventory; technology readiness with hybrid PQC (Kyber/ML-KEM) and QRNG; phased organizational rollout (0-1y groundwork, 1-3y high-risk upgrades, 3+y enterprise-wide); resilience/crypto-agility with QKD. | Milestone: Phased migration framework: prioritize high-risk systems within 3-6 months, mid-term (1-3y) PQC upgrades for high-risk assets, long-term (3+y) enterprise-wide quantum-safe deployment with crypto-agility and QKD.
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: Kyber; ML-KEM
- **Target Migration Dates**: Immediate (0-1 Years); Mid-Term (1-3 Years); Long-Term (3+ Years); high-risk systems within 3–6 months
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: CERT-In
- **Hybrid Mode Support**: Yes; Combining classical algorithms with quantum-resistant ones (like Kyber/ ML-KEM) ensures backward compatibility
- **Current GA Status**: GA
- **Customer Action Required**: Take a quick ‘Quantum Risk Assessment’; Conduct an audit of applications, devices, and protocols; Create a centralized, living inventory of every cryptographic component
- **Key Commitments & Quotes**: "Hybrid Cryptography: Combining classical algorithms with quantum-resistant ones (like Kyber/ ML-KEM ) ensures backward compatibility"
- **Coverage Verification**: CONSISTENT; The document explicitly details the four phases, hybrid PQC (Kyber/ML-KEM), QRNG, QKD, and the specific timeline milestones mentioned in the notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-319_QNu_Labs_Pvt.\_Ltd..html (89.4 KB)
- **Extraction Timestamp**: 2026-06-06T21:22:23

## VND-322 — Society for Worldwide Interbank Financial Telecommunication SC

- **Vendor ID**: VND-322
- **Vendor Name**: Society for Worldwide Interbank Financial Telecommunication SC
- **Roadmap Title**: Future-proofing the financial ecosystem
- **Roadmap URL**: https://www.swift.com/news-events/news/future-proofing-financial-ecosystem
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-322_Society_for_Worldwide_Interbank_Financial_Telecommunication_SC.html
- **CSV Coverage Notes**: Swift has published an official quantum-safe / post-quantum strategy: it is evolving its platform for quantum computing and PQC, and committed that in 2027 it will release SwiftNet 8.0, an upgraded network enabled for post-quantum cryptography, with an indicated ~15-month migration window for institutions. Swift also participated in BIS Project Leap (Phase 2) validating PQC in operational payments and offers an 'Introduction to Post-Quantum Security' training. Multiple official swift.com pages document this plan (e.g. 'Future-proofing the financial ecosystem', 'A quantum leap into the future o
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: None detected
- **Hybrid Mode Support**: None detected
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "evolving our infrastructure to further reinforce our platform and ensure it is future-proofed and ready for new technologies, including zero-trust models, AI, quantum computing, and post-quantum cryptography."
- **Coverage Verification**: PARTIAL, the document confirms the strategy to evolve infrastructure for PQC but does not mention the specific 2027 SwiftNet 8.0 release date, the 15-month migration window, BIS Project Leap, or the training course.
- **Extraction Quality**: LOW
- **Source Document**: VND-322_Society_for_Worldwide_Interbank_Financial_Telecommunication_SC.html (173.2 KB)
- **Extraction Timestamp**: 2026-06-06T21:24:41

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
- **Coverage Verification**: CONSISTENT
- **Extraction Quality**: HIGH
- **Source Document**: VND-327_Tailscale_Inc..html (200.6 KB)
- **Extraction Timestamp**: 2026-06-06T21:24:41

## VND-329 — Versa Networks, Inc.

- **Vendor ID**: VND-329
- **Vendor Name**: Versa Networks, Inc.
- **Roadmap Title**: Post-Quantum Cryptography (PQC) and Versa: Future-Proofing Enterprise Security Against Quantum Threats
- **Roadmap URL**: https://versa-networks.com/blog/post-quantum-cryptography-pqc-and-versa-future-proofing-enterprise-security-against-quantum-threats/
- **Publish Date**: 2025-03-12
- **Local File**: public/vendor-roadmaps/VND-329_Versa_Networks_Inc..html
- **CSV Coverage Notes**: Official Versa Networks blog describing the company's quantum-safe strategy for its Universal SASE platform: phased, hybrid PQC approach maintaining backward compatibility, with X25519Kyber768 hybrid key exchange integrated and three negotiation fallback scenarios. Aligned to FIPS 140-3 / NIAP. Strategic in scope but lacks explicit dated milestones, so it reads as a strategy blog rather than a dated roadmap. | Milestone: Integration of X25519Kyber768 hybrid PQC key exchange into the Versa SASE platform with dynamic hybrid PQC negotiation/fallback (as of March 2025).
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: ML-KEM
- **Target Migration Dates**: None detected
- **Products / Services Covered**: VersaONE Platform; Universal SASE platform; VOS
- **Compliance Frameworks**: FIPS 140-3; NIAP
- **Hybrid Mode Support**: Yes; integration of X25519Kyber768 hybrid key exchange with dynamic negotiation and fallback scenarios
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Versa has taken a proactive approach to PQC by integrating X25519Kyber768 into its security solutions"; "The hybrid PQC negotiation model ensures compatibility with existing cryptographic systems"; "Versa aligns with emerging PQC standards to ensure resilience against quantum threats"
- **Coverage Verification**: CONSISTENT; The document confirms the integration of X25519Kyber768, the three negotiation scenarios, and alignment with FIPS 140-3/NIAP as described in the notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-329_Versa_Networks_Inc..html (162.3 KB)
- **Extraction Timestamp**: 2026-06-06T21:26:41

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
- **Hybrid Mode Support**: Yes, document advises to "adopt hybrid classical/PQC solutions where practical with full PQC migration later as standards mature"
- **Current GA Status**: No PQC
- **Customer Action Required**: Build cryptographic inventories; adopt hybrid classical/PQC solutions; prepare for migration away from classical cryptographic systems
- **Key Commitments & Quotes**: "Financial organizations must proactively plan for a future where quantum-safe practices are the norm."
- **Coverage Verification**: PARTIAL, the document confirms the strategic guidance and PQC vs QKD comparison but does not mention the co-authors, Harvest-Now-Decrypt-Later threat, or specific past products like Ecos cards.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-341_Mastercard_Incorporated.html (146.9 KB)
- **Extraction Timestamp**: 2026-06-06T21:21:15

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
- **Hybrid Mode Support**: Yes, bootloader uses hybrid scheme with SLH-DSA and EdDSA (Ed25519)
- **Current GA Status**: GA
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Trezor Safe 7 can run post-quantum updates, but these updates don't exist yet."; "Each Trezor Safe 7 is quantum-ready from the moment it powers on."; "Legacy devices... will eventually need replacement once quantum computing becomes powerful enough."
- **Coverage Verification**: CONSISTENT, the document confirms the Trezor Safe 7 strategy, the three-layer architecture, the use of SLH-DSA-128 (hybrid with Ed25519) for boot and ML-DSA-44 for attestation, and references the NIST 2035 framework.
- **Extraction Quality**: HIGH
- **Source Document**: VND-351_SatoshiLabs_s.r.o..html (540.7 KB)
- **Extraction Timestamp**: 2026-06-06T21:23:29

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
- **Hybrid Mode Support**: Yes, SecureBridge employs a hybrid methodology supporting both ML-DSA and ECDSA to facilitate authentication via both PQC and current public-key cryptography.
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Targeting full-scale deployment of SecureBridge in 2030, TOPPAN Digital is planning limited practical implementations in 2025"
- **Coverage Verification**: PARTIAL, the document confirms the SecureBridge roadmap, ML-DSA/ECDSA hybrid support, and 2025/2030 timeline, but does not mention Edge Safe or Secure Activate Service.
- **Extraction Quality**: HIGH
- **Source Document**: VND-352_TOPPAN_Digital_Inc..html (63.7 KB)
- **Extraction Timestamp**: 2026-06-06T21:25:44

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
- **Coverage Verification**: PARTIAL
- **Extraction Quality**: HIGH
- **Source Document**: VND-355_Trezor_Company_s.r.o..html (538.3 KB)
- **Extraction Timestamp**: 2026-06-06T21:25:44

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
- **Target Migration Dates**: 2035 (transition away from quantum-vulnerable cryptography); 2030 (NIST deprecation of quantum-vulnerable cryptography)
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: FIPS 140-3; National Security Memorandum 10 (NSM-10)
- **Hybrid Mode Support**: None detected
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Our strategy has four steps, summed up in four words: monitor, extend, adopt, and wait."; "Cohesity’s migration to 4096-bit keys is a step to extend the useful lifetime of RSA and Diffie-Hellman."; "the industry needs to begin adopting post-quantum cryptography now to limit the damage of Harvest Now Decrypt Later (HNDL) attacks"
- **Coverage Verification**: CONSISTENT. The document explicitly details the four-phase strategy (monitor, extend, adopt, wait), references NSM-10 and NIST timelines (2030/2035), mentions 4096-bit RSA migration, and notes AES-256 resilience.
- **Extraction Quality**: HIGH
- **Source Document**: VND-367_Cohesity.html (184.3 KB)
- **Extraction Timestamp**: 2026-06-06T21:18:14

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
- **Customer Action Required**: Use Security IQ to gain insights into security posture and implement controls
- **Key Commitments & Quotes**: "Commvault has chosen to implement it to safeguard your data."
- **Coverage Verification**: MISMATCH
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-368_Commvault.html (106.8 KB)
- **Extraction Timestamp**: 2026-06-06T21:18:14

## VND-371 — Red Hat (Dogtag)

- **Vendor ID**: VND-371
- **Vendor Name**: Red Hat (Dogtag)
- **Roadmap Title**: Red Hat's path to post-quantum cryptography
- **Roadmap URL**: https://www.redhat.com/en/blog/red-hats-path-post-quantum-cryptography
- **Publish Date**: 2024-07-15
- **Local File**: public/vendor-roadmaps/VND-371*Red_Hat_Dogtag*.html
- **CSV Coverage Notes**: Red Hat published a strategic three-phase PQC roadmap (Classical -> Post-Quantum Capable -> Post-Quantum Ready) aligning with US/EU/Czech/German/French government timelines and NIST standardization. A follow-up strategy update, 'Building the levee: Why Red Hat's post-quantum strategy is already in production' (2026-05-25, https://www.redhat.com/en/blog/building-levee-why-red-hats-post-quantum-strategy-already-production), details concrete milestones: RHEL 10 first practical PQC steps (May 2025), RHEL 10.1 enabling PQC by default and being the first major distro to sign RPM packages with ML-DSA
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: NIST; IETF
- **Hybrid Mode Support**: Yes; "PQ-Ready also supports approved hybrid schemes (classical and post-quantum) as they are available."
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "Red Hat is committed to providing customers with functional, quantum-resistant security capabilities as the industry evolves, develops and begins integrating these new cryptographic functions."
- **Coverage Verification**: PARTIAL; The document confirms the three-phase roadmap and government alignment but does not mention the follow-up blog post, RHEL 10/10.1 milestones, or ML-DSA.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-371*Red_Hat_Dogtag*.html (610.2 KB)
- **Extraction Timestamp**: 2026-06-06T21:23:29

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
- **Hybrid Mode Support**: Yes, the document discusses deploying "hybrid classical and PQC algorithms" and "hybrid certificates" to facilitate a smooth transition.
- **Current GA Status**: Planned
- **Customer Action Required**: Inventory cryptographic footprint; Deploy edge platforms with PQC capabilities; Engage vendors on quantum readiness; Focus on long-term confidentiality
- **Key Commitments & Quotes**: "By 2030: U.S. federal agencies must migrate to PQC"; "By 2035: National security systems must be fully quantum-resistant"; "Deploy edge platforms with PQC capabilities. Adopt solutions to terminate quantum-safe TLS connections at the perimeter"
- **Coverage Verification**: CONSISTENT, the document explicitly outlines the NIST standards, the 2025-2027 inventory/edge deployment phase, and the 2030/2035 federal timelines mentioned in the notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-374_F5.html (354.8 KB)
- **Extraction Timestamp**: 2026-06-06T21:20:09

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
- **Target Migration Dates**: summer 2026
- **Products / Services Covered**: Junos OS Evolved; Junos; HPE ProLiant Compute Gen12 servers; HPE Integrated Lights-Out (iLO) 7
- **Compliance Frameworks**: NIST FIPS 203/204
- **Hybrid Mode Support**: None detected
- **Current GA Status**: Planned
- **Customer Action Required**: None detected
- **Key Commitments & Quotes**: "HPE has added post-quantum cryptography (PQC)-ready capabilities to Junos OS Evolved and will extend PQC support more broadly to Junos in summer 2026."
- **Coverage Verification**: PARTIAL, the document confirms the Junos and iLO 7 milestones and FIPS 203/204 alignment, but does not explicitly mention CNSA 2.0 alignment or "Quantum Buffer for SSH" in the provided text.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-379_Hewlett_Packard_Enterprise.html (381.0 KB)
- **Extraction Timestamp**: 2026-06-06T21:15:18

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
- **Key Commitments & Quotes**: "By embedding post-quantum cryptography (PQC) into our storage, we proactively neutralize quantum threats before they materialize."; "Integrated, NIST-approved PQC algorithms keep data secure at rest and in flight."; "NetApp has pioneered built-in quantum encryption that fully protects your data."
- **Coverage Verification**: PARTIAL, the document confirms the strategy, algorithms, and data protection scope but does not mention the F5 partnership, StorageGRID, ONTAP 9.18.1, or the specific solution brief.
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-390_NetApp.html (307.8 KB)
- **Extraction Timestamp**: 2026-06-06T21:21:15

## VND-391 — Nord Security

- **Vendor ID**: VND-391
- **Vendor Name**: Nord Security
- **Roadmap Title**: NordVPN launches post-quantum encryption across all applications
- **Roadmap URL**: https://nordsecurity.com/press-area/nordvpn-launches-post-quantum-encryption-across-all-its-applications
- **Publish Date**: Unknown
- **Local File**: public/vendor-roadmaps/VND-391_Nord_Security.html
- **CSV Coverage Notes**: None
- **Roadmap Scope**: Portfolio-wide strategy
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: NordVPN Linux application; NordVPN Windows; NordVPN macOS; NordVPN iOS; NordVPN Android; NordVPN Android TV; NordVPN tvOS
- **Compliance Frameworks**: NIST
- **Hybrid Mode Support**: None detected
- **Current GA Status**: GA
- **Customer Action Required**: Enable PQE with a toggle switch under “Connections” in “Settings”
- **Key Commitments & Quotes**: "NordVPN, a leading cybersecurity company, announces the launch of post-quantum encryption (PQE) support for all its VPN applications"
- **Coverage Verification**: CONSISTENT
- **Extraction Quality**: MEDIUM
- **Source Document**: VND-391_Nord_Security.html (85.5 KB)
- **Extraction Timestamp**: 2026-06-06T20:29:17

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
- **Compliance Frameworks**: NIST FIPS 203; NIST FIPS 204; NIST FIPS 205; NSA CNSA 2.0; NSM-10
- **Hybrid Mode Support**: Yes, DAST flags servers lacking TLS 1.3 hybrid key exchange options such as X25519MLKEM768.
- **Current GA Status**: GA
- **Customer Action Required**: Enable the feature flag com.fortify.sca.rules.enablePQCRules in SAST to identify RSA and DSA usage.
- **Key Commitments & Quotes**: "We’re expanding coverage beyond RSA and DSA to include other quantum-vulnerable algorithms"; "Future releases will analyze key lengths and configuration parameters"; "We’re planning to extend post-quantum detection across the full range of languages"
- **Coverage Verification**: CONSISTENT, the document explicitly confirms the Oct 2025 release of SAST/DAST 25.4 with the specified detection categories and roadmap extensions.
- **Extraction Quality**: HIGH
- **Source Document**: VND-395_OpenText.html (105.1 KB)
- **Extraction Timestamp**: 2026-06-06T21:22:23

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
- **Target Migration Dates**: 2027 to 2030 window
- **Products / Services Covered**: Portfolio-wide commitment (no individual products named)
- **Compliance Frameworks**: NIST FIPS 203; NIST FIPS 204; NIST FIPS 205; FIPS 140-3; CNSA 2.0
- **Hybrid Mode Support**: Yes, mentions "hybrid modes", "hybrid negotiation", and "guidance for hybrid modes"
- **Current GA Status**: Planned
- **Customer Action Required**: Inventory cryptographic dependencies; Validate crypto agility; Engage Veeam for workshops, roadmap reviews, and controlled pilots
- **Key Commitments & Quotes**: "Veeam’s adoption strategy for PQC emphasizes three principles."; "Our goal is to integrate PQC when the underlying libraries are enterprise-ready, validated, and operationally supportable"; "Providers like OpenSSL are estimating widespread adoption in the 2027 to 2030 window"
- **Coverage Verification**: MISMATCH, the document does not mention the Entrust partnership or the Veeam Data Platform v13.1 milestone
- **Extraction Quality**: HIGH
- **Source Document**: VND-409_Veeam.html (249.1 KB)
- **Extraction Timestamp**: 2026-06-06T21:26:41

## VND-423 — IBM Research (CBOMkit)

- **Vendor ID**: VND-423
- **Vendor Name**: IBM Research (CBOMkit)
- **Roadmap Title**: IBM bringing organizations along the quantum-safe journey (IBM Quantum Safe roadmap)
- **Roadmap URL**: https://research.ibm.com/blog/quantum-safe-roadmap
- **Publish Date**: 2023-05-10
- **Local File**: public/vendor-roadmaps/VND-423*IBM_Research_CBOMkit*.html
- **CSV Coverage Notes**: IBM Research's official Quantum Safe roadmap presenting a three-phase strategic blueprint: Discover (cryptography inventory / CBOM via Explorer and Advisor), Observe (analyze cryptographic posture and prioritize vulnerabilities), and Transform (remediate with crypto-agility). The roadmap ties phases to external milestones: NIST publishing PQC standards in 2024 and NSA/CNSA requirements for quantum-safe algorithms in national security systems by 2025. CBOMkit (now contributed to the Post-Quantum Cryptography Alliance) supports the Discover phase. This is a genuine strategic timeline document, n
- **Roadmap Scope**: Multi-product
- **PQC Algorithms Announced**: CRYSTALS-Kyber; CRYSTALS-Dilithium; Falcon
- **Target Migration Dates**: NIST publishing PQC standards in 2024; NSA/CNSA requirements for quantum-safe algorithms in national security systems by 2025
- **Products / Services Covered**: IBM Quantum Safe Explorer; IBM Quantum Safe Advisor; IBM Quantum Safe Remediator; IBM z16; IBM Tape
- **Compliance Frameworks**: NIST; NSA/CNSA; FIPS
- **Hybrid Mode Support**: Yes; Remediator supports a hybrid implementation approach that allows using classical and quantum-safe cryptography during transition
- **Current GA Status**: GA
- **Customer Action Required**: Complete cryptography inventory and create a CBOM; begin quantum-safe transition
- **Key Commitments & Quotes**: "This roadmap serves as a commitment to transparency, predictability, and confidence as we guide industries along their journey to post-quantum cryptography."
- **Coverage Verification**: CONSISTENT; The document explicitly details the three-phase roadmap (Discover, Observe, Transform) with the specified tools and external milestones, confirming the CSV notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-423*IBM_Research_CBOMkit*.html (84.2 KB)
- **Extraction Timestamp**: 2026-06-06T21:20:09

## VND-433 — OpenBao (LF Edge)

- **Vendor ID**: VND-433
- **Vendor Name**: OpenBao (LF Edge)
- **Roadmap Title**: RFC - Post-Quantum Cryptography Migration Roadmap
- **Roadmap URL**: https://github.com/openbao/openbao/issues/496
- **Publish Date**: 2024-08-30
- **Local File**: public/vendor-roadmaps/VND-433*OpenBao_LF_Edge*.html
- **CSV Coverage Notes**: Official OpenBao RFC design document laying out a phased PQC migration plan following NIST's Aug 2024 standards finalization. Catalogs cryptographic uses across impact, migration difficulty, and failure risk; priority areas include TLS listeners, PKI/SSH CAs, Transit keys, auto-unseal, and JWT/OIDC. Addresses harvest-now-decrypt-later risk and emphasizes incremental, independent migration of each subsystem with user-selectable hybrid/pure PQC algorithms in Transit and PKI. | Milestone: RFC-stage roadmap defining blocking requirements (crypto library availability via Go stdlib/CIRCL, X.509/TLS/
- **Roadmap Scope**: Single product
- **PQC Algorithms Announced**: None detected
- **Target Migration Dates**: None detected
- **Products / Services Covered**: OpenBao
- **Compliance Frameworks**: NIST; FIPS 185-5
- **Hybrid Mode Support**: Yes; "Transit and PKI might allow pure post-quantum algorithms or various hybrid constructions."
- **Current GA Status**: Planned
- **Customer Action Required**: Explicitly handle key type choices and migrations for PKI, SSH, JWT, and Transit; "no automatic migration will occur for the user"
- **Key Commitments & Quotes**: "OpenBao needs to be hardened against quantum adversaries"; "we should start considering our own quantum roadmap"; "OpenBao might allow pure post-quantum algorithms or various hybrid constructions"
- **Coverage Verification**: CONSISTENT; The document is an OpenBao RFC that catalogs cryptographic uses, addresses HNDL risk, and details a phased migration plan for TLS, PKI, SSH, Transit, and auto-unseal, aligning with the notes.
- **Extraction Quality**: HIGH
- **Source Document**: VND-433*OpenBao_LF_Edge*.html (338.4 KB)
- **Extraction Timestamp**: 2026-06-06T21:22:23
