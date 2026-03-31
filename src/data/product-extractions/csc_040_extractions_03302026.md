---
generated: 2026-03-30
collection: csc_040
documents_processed: 11
enrichment_method: ollama-qwen3.5:27b
---

## CircleCI

- **Category**: CI/CD & Artifact Management
- **Product Name**: CircleCI
- **Product Brief**: A CI/CD platform providing execution environments, build optimization, and security features for software development pipelines.
- **PQC Support**: No
- **PQC Capability Description**: The provided text contains no mention of Post-Quantum Cryptography (PQC) support, algorithms, or implementation within the CircleCI product. The document discusses PQC as a general industry trend in an article section but does not attribute PQC capabilities to CircleCI itself.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: SSH, HTTPS, OpenID Connect (OIDC)
- **Key Management Model**: Environment variables for secrets; OpenID Connect for authentication without distributing secrets; Restricted contexts for encrypted storage and sharing of environment variables.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Cloud-hosted service with option for self-hosted runners or on-premise infrastructure; isolated sandboxes for builds.
- **Infrastructure Layer**: Application, Cloud
- **License Type**: Commercial
- **License**: Proprietary (implied by commercial nature and lack of open source license statement in product section)
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: No (FedRAMP tailored and SOC 2 Type II compliant mentioned, but no specific FIPS 140 validation stated)
- **Primary Platforms**: Cloud-hosted; Self-hosted runners; Integrations with GitHub, GitLab, Bitbucket, AWS, GCP, Azure, Kubernetes.
- **Target Industries**: Enterprise, SMB, Startup, Government (FedRAMP tailored), Financial Services (implied by context of security compliance)
- **Regulatory Status**: FedRAMP tailored, SOC 2 Type II compliant, EU-U.S. Data Privacy Framework, UK Extension to the EU-U.S. Data Privacy Framework, Swiss-U.S. Data Privacy Framework, PCI compliance (via Stripe).
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://circleci.com

---

## Zscaler ZTE

- **Category**: Web & Application Security
- **Product Name**: Zscaler Internet Access™ (ZIA™) / Zscaler Zero Trust Exchange™
- **Product Brief**: Cloud-native inline inspection platform providing real-time decryption and security policy enforcement for PQC traffic.
- **PQC Support**: Yes (with details: Supports hybrid PQC key exchange using ML-KEM/FIPS 203 and Pre-shared Post-Quantum Keys (PPK) for IPsec).
- **PQC Capability Description**: Provides real-time inline inspection of PQC traffic via hybrid PQC key exchange in TLS 1.2/1.3, auto-detecting ML-KEM (FIPS 203) and Open Quantum Safe groups alongside classical curves. Supports IPsec with Pre-shared Post-Quantum Keys (PPK) per RFC 8784 to protect IKE key derivation against quantum attacks without requiring full PQC algorithms in the exchange.
- **PQC Migration Priority**: High
- **Crypto Primitives**: ML-KEM (FIPS 203), Open Quantum Safe, classical elliptic curves, Diffie-Hellman (DH/ECDH), TLS 1.2, TLS 1.3, IPsec, IKE.
- **Key Management Model**: Hybrid PQC key exchange (combining classical and post-quantum algorithms); Pre-shared Post-Quantum Keys (PPK) for IPsec to secure IKE key derivation; supports draft-ietf-tls-echde-mlkem standard.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Cloud-native inline inspection engine / Zero Trust Exchange / Inline proxy
- **Infrastructure Layer**: Network, Security Stack, Cloud
- **License Type**: Commercial
- **License**: Proprietary (©2026 Zscaler, Inc. All rights reserved)
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No (ML-KEM is noted as finalized in August 2024 as FIPS 203 standard; product implementation is compliant with the standard but specific FIPS validation status of the appliance is not stated).
- **Primary Platforms**: Cloud-native (Zscaler Zero Trust Exchange); compatible with Chrome, Firefox, Safari clients and servers.
- **Target Industries**: Enterprise, Government (implied by compliance mandates), Critical sectors
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Implementation of hybrid PQC key exchange compliant with draft-ietf-tls-echde-mlkem; adoption of NIST-standardized ML-KEM (FIPS 203); support for RFC 8784 (PPK) for IPsec.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated (Document focuses on Key Encapsulation Mechanisms/KEM and key exchange; digital signature mechanisms are mentioned as vulnerable but specific PQC signature schemes supported are not listed).
- **Authoritative Source URL**: zscaler.com

---

## Akamai Edge

- **Category**: Web & Application Security
- **Product Name**: Akamai Edge
- **Product Brief**: Network security platform offering Post Quantum Cryptography (PQC) for TLS communications between client and edge.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports ML-KEM based hybrid key exchange for transport layer security (TLS) 1.3. Available via "Post Quantum Cryptography Client to Edge" behavior for Enhanced TLS hostnames. Can be disabled if high latency or error rates occur. Limited availability; requires contacting Akamai representative.
- **PQC Migration Priority**: High
- **Crypto Primitives**: ML-KEM (hybrid key exchange), TLS 1.3
- **Key Management Model**: Certificate-based authentication with TLS 1.3 enabled deployment settings; hybrid key exchange using ML-KEM.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Edge network security platform with inline behaviors for TLS configuration.
- **Infrastructure Layer**: Network, Security Stack
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: FIPS mode mentioned as a behavior option; specific validation status not stated.
- **Primary Platforms**: Akamai Edge network, Enhanced TLS hostnames
- **Target Industries**: Enterprise (implied by "Enterprise Application Access", "Site Shield")
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Aligns with industry standard; accepts ML-KEM based hybrid key exchange. Phased release status indicated for some features.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated (only key exchange algorithms mentioned)
- **Authoritative Source URL**: Akamai TechDocs (specific URL not provided in text)

---

## Fastly Edge Cloud

- **Category**: Web & Application Security
- **Product Name**: Fastly Edge Cloud Platform
- **Product Brief**: A modern network platform ensuring websites, applications, and services scale securely and quickly with built-in security.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document mentions "built-in security" and "enhanced security" but does not explicitly mention Post-Quantum Cryptography (PQC), quantum-resistant algorithms, or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Edge cloud platform / Programmable Edge Platform
- **Infrastructure Layer**: Network, Security Stack, Cloud
- **License Type**: Commercial
- **License**: Proprietary (implied by commercial sales contact and AWS Marketplace listing)
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: AWS Cloud, AWS Lambda, Amazon S3
- **Target Industries**: Enterprise (implied by "businesses", "consumers", "DevOps and SecOps teams")
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: fastly.com

---

## Amazon CloudFront

- **Category**: Web & Application Security
- **Product Name**: Amazon CloudFront
- **Product Brief**: A content delivery network service offering hybrid post-quantum key establishment for TLS client-to-edge connections.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports hybrid post-quantum key establishment across all existing TLS security policies and a new TLS 1.3 only policy (TLS1.3_2025). PQC is automatically enabled for client-to-edge connections with no customer configuration required. Available in all edge locations at no additional charge.
- **PQC Migration Priority**: High
- **Crypto Primitives**: ML-KEM, SecP256r1, X25519, ML-DSA (mentioned in context of KMS complications), SLH-DSA (mentioned in NIST timeline)
- **Key Management Model**: Hybrid key establishment using classical and post-quantum algorithms; AWS Key Management Service (KMS) mentioned for broader AWS PQC strategy.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Cloud-native edge network (CDN) with TLS termination at edge locations.
- **Infrastructure Layer**: Network, Security Stack, Cloud
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: TLS1.3_2025 policy; AWS SDK for Java v2
- **Release Date**: 2025-09-05
- **FIPS Validated**: Yes (AWS-LC-FIPS-3.0 mentioned in deployment timeline context)
- **Primary Platforms**: Amazon CloudFront edge locations, AWS Cloud
- **Target Industries**: Enterprise, Organizations requiring regulatory compliance and long-term data security
- **Regulatory Status**: Mentions readiness for regulatory compliance; references NIST SP800-208, CNSA 2.0, FIPS 203, FIPS 204, FIPS 205.
- **PQC Roadmap Details**: PQC capabilities automatically enabled by default on all existing policies; new TLS1.3_2025 policy launched; alignment with NIST timeline (FIPS 203/204) and CNSA 2.0 standards.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA, SLH-DSA (referenced in NIST/CNSA timelines); SecP256r1, X25519 used in hybrid key exchange.
- **Authoritative Source URL**: https://aws.amazon.com/cloudfront/ (inferred from context "visit the CloudFront documentation" and AWS branding)

---

## Google Cloud CDN

- **Category**: Web & Application Security
- **Product Name**: Unknown
- **Product Brief**: Not stated
- **PQC Support**: Unknown
- **PQC Capability Description**: Not stated
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Network (inferred from context header, but not explicitly described in document text)
- **License Type**: Unknown
- **License**: Unknown
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: No
- **Primary Platforms**: Not stated
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Unknown (Document indicates a 404 error for the requested URL)

---

## Vultr Cloud GPU

- **Category**: Web & Application Security
- **Product Name**: Vultr Cloud GPU
- **Product Brief**: Not stated (Document lists general cloud infrastructure services, not a specific network security product).
- **PQC Support**: No mention
- **PQC Capability Description**: Not stated. The document contains no information regarding Post-Quantum Cryptography algorithms, implementation status, or maturity levels.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated (Document lists "Cloud GPU", "Bare Metal", "Kubernetes", etc., but does not describe a specific security architecture like inline encryptor or VPN concentrator).
- **Infrastructure Layer**: Cloud, Network (implied by "Advanced Network Control Panel" and "Direct Connect"), Hardware (implied by "Cloud GPU", "Bare Metal")
- **License Type**: Commercial (Implied by "Contact Sales", "Pricing", and trademark notice)
- **License**: Not stated
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No mention
- **Primary Platforms**: Cloud (Vultr), NVIDIA Dynamo (mentioned in context of inference)
- **Target Industries**: Industry Cloud, Start-Up Programs (General cloud services; no specific security industry focus stated)
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (Source filename provided: Vultr_Cloud_GPU.html, but no specific product URL extracted)

---

## Brave Browser

- **Category**: Web & Application Security
- **Product Name**: Brave Browser
- **Product Brief**: A web browser with default support for post-quantum hybrid key agreements (X25519MLKEM768).
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports X25519MLKEM768 as the default post-quantum hybrid key agreement. Also supports X25519Kyber768Draft00 for specific version ranges (Edge 124-130, Firefox 124-131). Implementation relies on underlying libraries like BoringSSL or OpenSSL with PQC providers.
- **PQC Migration Priority**: High
- **Crypto Primitives**: X25519MLKEM768, X25519Kyber768Draft00
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application
- **License Type**: Unknown
- **License**: Not stated
- **Latest Version**: Not stated (Document lists supported versions of other software like Firefox 132+, Chrome 131+, but does not specify a specific Brave version number)
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Desktop, Android (implied by context of browser support), iOS, macOS
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Default for recent versions; supports X25519MLKEM768 and X25519Kyber768Draft00.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated (Document only mentions key agreement algorithms)
- **Authoritative Source URL**: https://developers.cloudflare.com/ssl/post-quantum-cryptography/pqc-support/index.md

---

## Tor Browser

- **Category**: Web & Application Security
- **Product Name**: Tor Browser
- **Product Brief**: Anonymity network allowing users to browse anonymously by routing traffic through entry, middle, and exit nodes.
- **PQC Support**: No (Current implementation uses classical crypto; PQC is discussed as a theoretical migration target)
- **PQC Capability Description**: The document describes Tor's current reliance on non-quantum-resistant schemes (RSA, ECC). It proposes theoretical performance assessments for migrating to PQC algorithms like CRYSTALS-Kyber (ML-KEM), CRYSTALS-Dilithium (ML-DSA), FALCON, and NTRUEncrypt. No full PQC implementation is stated as currently active in the product; research focuses on hybrid handshakes (HybridOR) and overhead estimation.
- **PQC Migration Priority**: High (Document highlights vulnerability to "harvest now, decrypt later" attacks and NIST's 2035 ban on RSA/ECDSA)
- **Crypto Primitives**: RSA, ECC, AES, Ed25519, Curve25519, SHA1, SHA3, Diffie-Hellman (DH), NTOR, CRYSTALS-Kyber (ML-KEM), CRYSTALS-Dilithium (ML-DSA), FALCON, NTRUEncrypt, ring-LWE
- **Key Management Model**: Not stated (Document mentions long-term keys for relays and ephemeral keys for circuits but does not specify a formal key management architecture like HSM or MPC)
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Network-based onion routing with circuit creation via directory authorities and relay nodes
- **Infrastructure Layer**: Application, Network
- **License Type**: Unknown
- **License**: Not stated
- **Latest Version**: 0.3.2.1-alpha (mentioned in context of Onion Services cryptography improvements)
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Constrained devices (mentioned for benchmarking), general client/relay infrastructure
- **Target Industries**: Not stated (General public use for anonymity, censorship resistance)
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Theoretical estimation of overhead by replacing classical crypto times with PQC benchmarks; NIST timeline banning RSA and ECDSA from 2035; proposals to widen cell size (#340) and enable hybridization of ntor protocol with KEMs (#269).
- **Consensus Mechanism**: Not applicable (Tor uses directory authorities for consensus on network state, not a blockchain consensus mechanism)
- **Signature Schemes**: Ed25519 (current), RSA (legacy/current), ECDSA (mentioned as banned by 2035), CRYSTALS-Dilithium (ML-DSA) (planned/research), FALCON (expected/planned)
- **Authoritative Source URL**: Not stated

---

## DuckDuckGo Browser

- **Category**: Web & Application Security
- **Product Name**: DuckDuckGo Browser
- **Product Brief**: An Internet privacy browser helping users take back control of personal information without sacrificing experience.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document discusses search engine competition, choice screens, and user privacy but contains no mention of Post-Quantum Cryptography algorithms or implementations.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Android, Chrome (desktop), iOS
- **Target Industries**: Consumer Internet Search
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: duckduckgo.com

---

## Akamai Connected Cloud

- **Category**: Web & Application Security
- **Product Name**: Akamai Connected Cloud
- **Product Brief**: A distributed cloud platform providing cybersecurity, content delivery, and edge computing services with PQC support in TLS 1.3.
- **PQC Support**: Yes (Limited availability for Ghost to Origin connections; General Availability planned for October 31, 2025)
- **PQC Capability Description**: Akamai rolled out PQC support on June 30, 2025, for Ghost to Origin (G2O) connections using TLS 1.3 hybrid key exchange. The implementation uses the X25519MLKEM768 group (hybrid of X25519 and ML-KEM768). It is currently in limited availability with a planned general availability release on October 31, 2025, for all origin TLS connections.
- **PQC Migration Priority**: High
- **Crypto Primitives**: X25519, ML-KEM768 (Module-Lattice-Based Key-Encapsulation Mechanism), ECDHE, RSA, AES256-GCM-SHA384
- **Key Management Model**: TLS 1.3 hybrid key exchange using X25519MLKEM768; supports standalone X25519 and hybrid keys in ClientHello; utilizes HelloRetryRequest for negotiation if needed.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Cloud-native edge network, CDN edge server, Ghost to Origin (G2O) connection architecture
- **Infrastructure Layer**: Network, Security Stack, Cloud
- **License Type**: Commercial
- **License**: Proprietary (Akamai developed its own PQC provider; no open source license mentioned for the platform itself)
- **Latest Version**: Not stated
- **Release Date**: 2025-06-30
- **FIPS Validated**: Not stated
- **Primary Platforms**: Akamai Connected Cloud, Ubuntu (mentioned in sample environment context), OpenSSL, BoringSSL
- **Target Industries**: Media and Entertainment, Retail, Travel & Hospitality, Financial Services, Healthcare & Life Sciences, Public Sector, Games, Online Sports Betting and iGaming, Service Providers
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Phase one: Akamai-to-origin (limited availability as of June 30, 2025); Phase two: Client-to-Akamai; Phase three: Akamai-to-Akamai. General Availability planned for October 31, 2025. Uses X25519MLKEM768 hybrid scheme.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ECDSA (implied via cipher suites), RSA (implied via cipher suites); PQC uses ML-KEM for key encapsulation, not signatures in this context.
- **Authoritative Source URL**: https://www.akamai.com (inferred from document source Akamai_Connected_Cloud.html and content context)

---
