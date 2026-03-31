---
generated: 2026-03-31
collection: csc_057
documents_processed: 9
enrichment_method: ollama-qwen3.5:27b
---

## Fireblocks

- **Category**: Digital Asset Custody
- **Product Name**: Fireblocks
- **Product Brief**: The complete infrastructure stack to bring customers onchain in the most seamless and secure way possible.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document discusses Multi-Party Computation (MPC) and MPC-CMP algorithms for private key security but contains no mention of Post-Quantum Cryptography (PQC), quantum-resistant algorithms, or PQC migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: MPC (Multi-Party Computation), MPC-CMP (1-round, automatic key-refreshing algorithm)
- **Key Management Model**: Multi-Party Computation (MPC); private keys are broken into shares, encrypted, and divided among multiple parties; the key is never formed in one place.
- **Supported Blockchains**: Not stated (Text mentions "protocol-agnostic" regarding MPC vs multi-sig but does not list specific blockchain networks).
- **Architecture Type**: MPC-based (SaaS/Cloud implied by "Wallets-as-a-service" and "white-labeled solution")
- **Infrastructure Layer**: Security Stack, Application
- **License Type**: Commercial
- **License**: Proprietary (Implied by "Talk to sales", "Pricing", and commercial service model; specific license text not stated)
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: No
- **Primary Platforms**: Not stated (Text mentions "Flexible deployment" but does not list specific OS or cloud providers).
- **Target Industries**: Trading firms, Fintechs & exchanges, Payments, Financial institutions, Web3
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: MPC-based signatures (specific algorithm names like ECDSA or Ed25519 not explicitly listed in the text)
- **Authoritative Source URL**: Not stated

---

## DFNS

- **Category**: Digital Asset Custody
- **Product Name**: Dfns HSM Service (part of Dfns platform)
- **Product Brief**: An orchestration platform enabling programmable wallet infrastructure using client-owned FIPS-certified HSMs or MPC.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: The document states the service includes "Quantum-safe cryptography support, future-proofing security infrastructure for the post-quantum era." No specific algorithms or implementation maturity levels are detailed beyond this general statement.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (MPC and HSM architectures mentioned, but specific primitives like ECDSA or Ed25519 not explicitly listed in the text)
- **Key Management Model**: Hybrid orchestration supporting MPC, HSM, TEE, or a mix; supports offline/air-gapped signing via Offline Signing Orchestrator (OSO); keys stored in FIPS-certified hardware or distributed via MPC.
- **Supported Blockchains**: Not stated (Text mentions "any blockchain" and "blockchain rails" generally)
- **Architecture Type**: Hybrid orchestration layer supporting MPC, HSM, TEE; SaaS platform connecting to on-premises or cloud HSMs via PKCS#11.
- **Infrastructure Layer**: Security Stack, Hardware, Cloud
- **License Type**: Commercial
- **License**: Proprietary (Not stated explicitly as a license name, but described as a commercial service with pricing and demos)
- **Latest Version**: Not stated
- **Release Date**: 2025-07-02
- **FIPS Validated**: Yes; Supports FIPS 140-2 Level 4 (specifically for IBM Crypto Express HSM) and mentions FIPS 140-3 certification for HSMs generally.
- **Primary Platforms**: IBM Z, LinuxONE, Cloud, On-premises; supports PKCS#11 standard interface.
- **Target Industries**: Finance, Banking, Custodians, Payment Service Providers (PSPs), Exchanges, Government agencies, Large corporations.
- **Regulatory Status**: Not stated (Text mentions compliance with regulations in Turkey, UAE, Singapore, Hong Kong, South Korea, but does not list specific licenses held by Dfns).
- **PQC Roadmap Details**: Not stated (Mentions "future-proofing" and support for quantum-safe cryptography, but no specific timeline or algorithm migration plan provided).
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated (Text mentions blockchain signatures generally and PKCS#11 interface, but does not list specific signature algorithms).
- **Authoritative Source URL**: Not stated (Source file name is DFNS.html, but no explicit URL provided in the text body).

---

## Taurus SA

- **Category**: Digital Asset Custody
- **Product Name**: Taurus-PROTECT (Custody), Taurus-CAPITAL (Tokenization), Taurus-PRIME (Trading), Taurus-NETWORK (Collateral & Settlement)
- **Product Brief**: Enterprise-grade custody, tokenization, and trading solutions through a fully integrated, modular platform.
- **PQC Support**: No mention
- **PQC Capability Description**: Not stated. The document mentions "Taurus is at the forefront of cryptography and blockchain technology" but does not specify Post-Quantum Cryptography algorithms, implementation status, or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions "cryptography" generally but lists no specific algorithms like ECDSA, Ed25519, etc.)
- **Key Management Model**: Ultra secure hot, warm, and cold storage; Defense in-depth security; Granular governance rules. Specific key hierarchy or escrow details not stated.
- **Supported Blockchains**: Public and permissioned blockchains; EVM & non-EVM; Any blockchain, any smart contract.
- **Architecture Type**: Modular platform; Managed services, on-premise, and hybrid installation; API-first platform.
- **Infrastructure Layer**: Security Stack, Application, Network
- **License Type**: Proprietary (Stated as "100% owned IP and home-made")
- **License**: Proprietary
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No mention of FIPS validation; mentions ISO 27001, ISAE 3402 Type II.
- **Primary Platforms**: Managed services, on-premise, and hybrid installation.
- **Target Industries**: Banks, Neobanks, Broker-dealers, FMIs and CSDs, Fintechs and startups, Foundations, Exchanges.
- **Regulatory Status**: Regulated by Swiss Financial Market Supervisory Authority (FINMA); Member of esisuisse; Taurus (Europe) Ltd regulated by Cyprus Securities and Exchange Commission (CySEC); DORA compliant; ISO 27001, ISAE 3402 Type II.
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (Source text provided as [Source: Taurus_SA_doc1.html])

---

## BitGo

- **Category**: Digital Asset Custody
- **Product Name**: BitGo TSS (Threshold Signature Scheme) / BitGo Multi-Signature
- **Product Brief**: Digital asset custody platform offering MPC-based TSS and Multi-Sig security for hot and cold storage.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC), quantum-resistant algorithms, or any plans for PQC migration. It focuses on classical cryptographic schemes like Threshold Signature Schemes (TSS) and Multi-Signature.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: Threshold Signature Scheme (TSS), Multi-Signature (Multi-Sig), MPC (Multi-Party Computation)
- **Key Management Model**: 2-of-3 security model using TSS (one key split into three shares) or Multi-Sig (three keys split three ways); includes backup key shares; utilizes purpose-built Hardware Security Modules (HSMs).
- **Supported Blockchains**: Not stated (Text mentions "new coins" and "ETH" specifically for fee reduction, but does not list a comprehensive supported blockchain inventory).
- **Architecture Type**: Hybrid MPC-based (TSS) and Multi-Sig; SaaS with purpose-built HSMs; supports both hot wallets and cold storage.
- **Infrastructure Layer**: Security Stack, Hardware
- **License Type**: Proprietary / Open Source (Code is open-sourced for scrutiny, but the service is a commercial product).
- **License**: Not stated (Text mentions "Open-sourced, peer reviewed code" but does not specify a license identifier like Apache-2.0).
- **Latest Version**: Not stated
- **Release Date**: 2022-06-16 (Date of the blog post introducing BitGo TSS)
- **FIPS Validated**: Not stated
- **Primary Platforms**: Not stated (Text mentions "BitGo SDK" and "REST APIs" but does not specify OS or cloud deployment targets).
- **Target Industries**: Institutions, Asset Managers, Banks, Exchanges, Trading Firms, Investors, Protocols, Enterprises, Fintechs, Corporations.
- **Regulatory Status**: OCC Approval to Convert to a Federally Chartered National Trust Bank; BitGo Bank & Trust is chartered and regulated by the Office of the Comptroller of the Currency (OCC); Licensed Under MiCAR (mentioned in footer link text).
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Threshold Signature Scheme (TSS), Multi-Signature
- **Authoritative Source URL**: www.bitgo.com

---

## Anchorage Digital

- **Category**: Digital Asset Custody
- **Product Name**: Anchorage Digital Custody
- **Product Brief**: Industry-leading digital asset custody platform offering security, regulatory protections, and support for crypto and fiat assets.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document mentions "cryptographically signed instructions" and "Hardware Security Module" but does not specify any Post-Quantum Cryptography algorithms or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions "cryptographically signed instructions" and "client signatures" but does not name specific algorithms like ECDSA, Ed25519, etc.)
- **Key Management Model**: HSM-backed with quorum validation of client signatures; keys are fully segregated.
- **Supported Blockchains**: Not stated (Document mentions "broadcasted to the blockchain" generally but lists no specific networks).
- **Architecture Type**: HSM-based with quorum authorization and biometric approval.
- **Infrastructure Layer**: Security Stack
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: No (Document mentions SOC 1 and SOC 2 Type II reports but does not mention FIPS validation).
- **Primary Platforms**: Not stated (Mentions "account dashboard or API integration" but no specific OS or cloud platform).
- **Target Industries**: Protocols, VC firms, Hedge funds, Wealth managers, Government, ETF issuers, Asset managers, Corporations.
- **Regulatory Status**: U.S. Office of the Comptroller of the Currency (OCC) charter; Major Payment Institution licensed by Monetary Authority of Singapore (MAS); SOC 1 and SOC 2 Type II certified.
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Unknown
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated

---

## Coinbase Custody

- **Category**: Digital Asset Custody
- **Product Name**: Coinbase Custody
- **Product Brief**: Digital asset custody platform forming an advisory board to safeguard assets against quantum threats.
- **PQC Support**: Planned (with timeline)
- **PQC Capability Description**: Part of a larger post-quantum security strategy including updating Bitcoin address handling, enhancing internal key management, and advancing research on post-quantum signature schemes. A position paper with a roadmap is expected early next year.
- **PQC Migration Priority**: High
- **Crypto Primitives**: Not stated (Text mentions "cryptography that underpins major blockchains" generally but does not list specific primitives used by Coinbase Custody).
- **Key Management Model**: Enhancing internal key management; specific hierarchy or architecture details not stated.
- **Supported Blockchains**: Bitcoin, Ethereum
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Security Stack
- **License Type**: Unknown
- **License**: Not stated
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Not stated
- **Target Industries**: Cryptocurrency, Finance
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Publishing a position paper early next year laying out a roadmap for quantum resilience; includes updating Bitcoin address handling and advancing research on post-quantum signature schemes.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Researching post-quantum signature schemes; current schemes not explicitly named.
- **Authoritative Source URL**: Not stated (Source text is from Bitcoin Magazine, not the product's official site).

---

## Copper.co

- **Category**: Digital Asset Custody
- **Product Name**: Copper Custody
- **Product Brief**: Secure digital asset custody solution using MPC technology for institutional clients across 60+ networks.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC), quantum-resistant algorithms, or any migration plans related to quantum computing threats.
- **PQC Migration Priority**: Low
- **Crypto Primitives**: MPC (Multi-Party Computation)
- **Key Management Model**: MPC threshold scheme where each wallet is controlled by three entities (Client, Copper, Trusted Third Party); no private key is ever generated or assembled; shards stored offline or online.
- **Supported Blockchains**: 60+ networks (specific names not listed), supports 50+ blockchains for custody/transfer, 20+ for staking, 10+ for DeFi.
- **Architecture Type**: MPC-based, hybrid (cold/warm/hot vaults with online/offline shard storage)
- **Infrastructure Layer**: Security Stack
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: No
- **Primary Platforms**: Web-based platform (implied by "Book a demo", "Login"), SaaS model for institutional clients.
- **Target Industries**: Hedge funds, Trading firms, Foundations, Exchanges, ETP Providers, Venture capital funds, Miners, Institutional investors.
- **Regulatory Status**: Registered in Switzerland as Copper Markets (Switzerland) AG (CHE 477.629.838); intended for institutional investors only.
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: 2-of-3 quorum consensus for signing asset transfers (internal architecture, not blockchain consensus).
- **Signature Schemes**: MPC-based signing (no private key assembled); specific signature algorithms (e.g., ECDSA, Ed25519) not explicitly named.
- **Authoritative Source URL**: copper.co

---

## Ledger Enterprise

- **Category**: Digital Asset Custody
- **Product Name**: Ledger Enterprise
- **Product Brief**: All-in-one Digital Asset Platform for Institutions.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC) algorithms or support. It discusses Multi-Party Computation (MPC) as a current technology but states that "MPC-only solutions are not ready for production" and emphasizes the need for secure hardware. No PQC migration plans or algorithms are stated.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: MPC, BIP-32, Threshold Signature Schemes (TSS), ECDSA (mentioned in reference titles), DSA (mentioned in reference titles)
- **Key Management Model**: Hybrid approach proposed; currently relies on secure hardware for key generation and storage, with MPC investigated for distributing keys to reduce operational risk. The document states "MPC-only solutions are not ready for production."
- **Supported Blockchains**: Bitcoin, Ethereum, Solana
- **Architecture Type**: Hardware-based (Secure Hardware/HSM) with potential future integration of MPC; explicitly rejects MPC-only architecture for production.
- **Infrastructure Layer**: Hardware, Security Stack
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: Unknown
- **Release Date**: 2019-12-19 (Date of the blog post discussing technology; no specific product release date for Ledger Enterprise is provided)
- **FIPS Validated**: No (Document states: "Security setups based on MPC have yet to pass extensive penetration testing and security certifications such as Common Criteria, FIPS, or CSPN certifications.")
- **Primary Platforms**: Not stated
- **Target Industries**: Institutions, Investors
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Threshold Signature Schemes (TSS), ECDSA, DSA (referenced in citations)
- **Authoritative Source URL**: Not stated

---

## Zodia Custody

- **Category**: Digital Asset Custody
- **Product Name**: Zodia Custody
- **Product Brief**: Institution-grade cold wallet storage with 24/7 instant availability and air-gapped security.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document mentions "Hardware Security Modules (HSMs)" and "cryptographic layer" but does not specify any Post-Quantum Cryptography algorithms, implementations, or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: HSM-backed cold storage with client-controlled entitlement workflows embedded in HSMs; air-gapped cold wallets.
- **Supported Blockchains**: Not stated
- **Architecture Type**: HSM-based, air-gapped cold storage
- **Infrastructure Layer**: Hardware, Security Stack
- **License Type**: Commercial
- **License**: Proprietary (implied by "Commercial" nature and institutional focus; specific license text not stated)
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Not stated
- **Target Industries**: Asset managers, Financial institutions, Crypto natives, Enterprise, Government, Hedge funds, Private wealth
- **Regulatory Status**: Trust or Company Service Provider (TCSP) License in Hong Kong; SOC 1 Type II accreditation; SOC 2 Type I accreditation; ISO 27001:2022 accreditation
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated

---
