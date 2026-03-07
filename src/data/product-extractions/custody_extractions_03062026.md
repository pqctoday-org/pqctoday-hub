---
generated: 2026-03-06
collection: custody
documents_processed: 12
enrichment_method: ollama-qwen3.5:27b
---

## Fireblocks

- **Category**: Digital Asset Custody
- **Product Name**: Fireblocks
- **Product Brief**: The complete infrastructure stack to bring customers onchain in the most seamless and secure way possible.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document discusses Multi-Party Computation (MPC) extensively, specifically the MPC-CMP algorithm, but contains no mention of Post-Quantum Cryptography (PQC), quantum-resistant algorithms, or migration plans for PQC.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: MPC-CMP, MPC-GG18 (Gennaro and Goldfeder's algorithm)
- **Key Management Model**: Multi-Party Computation (MPC) with key shares divided among multiple parties; supports hot or cold wallet setups.
- **Supported Blockchains**: Not stated (mentions "protocol-agnostic" regarding multi-sig limitations but does not list specific blockchains).
- **Architecture Type**: MPC-based
- **Infrastructure Layer**: Security Stack, Application, Network
- **License Type**: Open and free-to-use for the MPC-CMP protocol; Commercial for the Fireblocks platform.
- **License**: Unknown
- **Latest Version**: Not stated
- **Release Date**: 2020-05-13 (Date of MPC-CMP announcement)
- **FIPS Validated**: No
- **Primary Platforms**: Not stated
- **Target Industries**: Trading firms, Fintechs & exchanges, Payments, Financial institutions, Web3
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: MPC-CMP (1-round, automatic key-refreshing), MPC-GG18
- **Authoritative Source URL**: Not stated

---

## DFNS

- **Category**: Digital Asset Custody
- **Product Name**: Dfns (Key Orchestration Service / HSM Service)
- **Product Brief**: An orchestration platform enabling programmable wallet infrastructure using MPC, HSMs, or hybrid models for digital asset custody.
- **PQC Support**: Planned (with timeline: "future-proofing security infrastructure for the post-quantum era")
- **PQC Capability Description**: The document states the HSM Service offers "Quantum-safe cryptography support" to future-proof security infrastructure for the post-quantum era. No specific PQC algorithms or current production implementation details are provided; it is described as a capability of the IBM Crypto Express integration.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: ECDSA, EdDSA, STARK, Schnorr, BIP, SLIP, MPC (Multi-Party Computation), TSS (Threshold Signature Scheme)
- **Key Management Model**: Hybrid (supports MPC, HSM, TEE, and combinations); supports on-premises, cloud, and hybrid deployments.
- **Supported Blockchains**: Not stated (text mentions "any blockchain" generically but lists no specific networks).
- **Architecture Type**: Hybrid MPC+HSM orchestration layer; supports SaaS, Hybrid, and On-Premises deployments.
- **Infrastructure Layer**: Security Stack, Cloud, Hardware, Application
- **License Type**: Proprietary (implied by "Commercial" context and lack of open source license mention for the platform itself)
- **License**: Unknown
- **Latest Version**: Unknown
- **Release Date**: 2025-07-02 (Date of the blog post announcing the HSM Service launch)
- **FIPS Validated**: Yes (Supports FIPS 140-2 and FIPS 140-3 certified HSMs; specifically mentions IBM Crypto Express has FIPS 140-2 Level 4 certification).
- **Primary Platforms**: IBM Z, LinuxONE, AWS Nitro, Thales CC, IBM OSO, IBM HPVS, Cloud, On-premises.
- **Target Industries**: Finance (Banks, Custodians, PSPs), Fintechs, Exchanges, Government agencies, Large corporations.
- **Regulatory Status**: Not stated (Document mentions compliance with regulations in Turkey, UAE, Singapore, Hong Kong, South Korea, but does not list specific licenses held by Dfns).
- **PQC Roadmap Details**: Planned support for quantum-safe cryptography via HSM integration; no specific algorithm choices or timelines provided.
- **Consensus Mechanism**: Not stated (Product is a custody/key management layer, not a blockchain protocol).
- **Signature Schemes**: ECDSA, EdDSA, STARK, Schnorr, TSS (Threshold Signature Scheme)
- **Authoritative Source URL**: Unknown (Source text references "DFNS_HSM_Integration.html" and "DFNS_Key_Orchestration.html" but does not provide a full public URL).

---

## Taurus SA

- **Category**: Digital Asset Custody
- **Product Name**: Taurus (Platform comprising Taurus-PROTECT, Taurus-CAPITAL, Taurus-PRIME, Taurus-NETWORK)
- **Product Brief**: Enterprise-grade custody, tokenization, and trading solutions through a fully integrated, modular platform.
- **PQC Support**: Unknown
- **PQC Capability Description**: Not stated. The document mentions "Taurus is at the forefront of cryptography" but does not explicitly mention Post-Quantum Cryptography (PQC), specific PQC algorithms, or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Ultra secure hot, warm, and cold storage; Defense in-depth security; Granular governance rules.
- **Supported Blockchains**: Public and permissioned blockchains; EVM & non-EVM; Any blockchain, any smart contract.
- **Architecture Type**: Modular platform; Managed services, on-premise, and hybrid installation.
- **Infrastructure Layer**: Application, Security Stack, Network
- **License Type**: 100% owned IP and home-made (Proprietary)
- **License**: Unknown
- **Latest Version**: Unknown
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Managed services, on-premise, and hybrid installation.
- **Target Industries**: Banks, Neobanks, Broker-dealers, FMIs and CSDs, Fintechs and startups, Foundations, Exchanges.
- **Regulatory Status**: Regulated by the Swiss Financial Market Supervisory Authority (FINMA); Member of esisuisse; DORA compliant; ISO 27001; ISAE 3402 Type II.
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (Source file name provided: Taurus_SA_Product.html)

---

## Galileo FT

- **Category**: Digital Asset Custody
- **Product Name**: Galileo FT Platform (also referenced as Cyberbank Core, Cyberbank Digital Card Issuing, Payment Hub, Secured Credit, Payment Risk Platform)
- **Product Brief**: A cloud-native, developer-friendly, and regulation-ready financial technology platform for building modern financial products.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document mentions "secure" APIs and infrastructure but contains no explicit mention of Post-Quantum Cryptography (PQC), quantum-resistant algorithms, or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Cloud-native, composable, microservices-driven
- **Infrastructure Layer**: Cloud, Application
- **License Type**: Proprietary (implied by "Commercial" nature and copyright notice; specific license text not stated)
- **License**: Unknown
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Cloud-based platform with open APIs and sandbox testing
- **Target Industries**: Banks, fintechs, brands, retail, SME, corporate, payments
- **Regulatory Status**: Regulation-ready; recognized as "Best-in-Class" by Javelin Strategy & Research (2025 Digital Issuance Provider Scorecard); no specific charter or license numbers stated.
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (Source filename provided: Galileo_FT_Platform.html)

---

## BitGo

- **Category**: Digital Asset Custody
- **Product Name**: BitGo TSS / BitGo Wallet Services
- **Product Brief**: Digital asset infrastructure company delivering custody, wallets, staking, and trading services using Multi-Sig and Threshold Signature Scheme (TSS).
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC), quantum-resistant algorithms, or any plans for PQC migration. It focuses on classical cryptographic schemes including Multi-Signature and Threshold Signature Schemes (TSS) based on Multi-Party Computation (MPC).
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions "Multi-Signature", "Threshold Signature Scheme (TSS)", "Multi-party computation (MPC)", and "Hardware Security Modules (HSMs)" but does not specify underlying primitives like ECDSA, Ed25519, or secp256k1).
- **Key Management Model**: 2-of-3 Threshold Signature Scheme (TSS) and Multi-Signature; utilizes Hardware Security Modules (HSMs); supports cold and hot storage.
- **Supported Blockchains**: Not stated (Document mentions "Bitcoin", "ETH", "new coins", and "certain blockchains" generally, but does not provide a comprehensive list of supported networks).
- **Architecture Type**: Hybrid MPC-based (TSS) and Multi-Signature; HSM-backed.
- **Infrastructure Layer**: Security Stack, Hardware, Application
- **License Type**: Not stated (Document states code is "open-sourced" for pressure testing but does not specify a license name like Apache-2.0; overall service is commercial).
- **License**: Unknown
- **Latest Version**: Unknown
- **Release Date**: 2022-06-16 (Date of the blog post introducing BitGo TSS)
- **FIPS Validated**: No
- **Primary Platforms**: Not stated
- **Target Industries**: Institutions, Asset Managers, Banks, Exchanges, Trading Firms, Investors, Protocols, Enterprises, Fintechs, Corporations.
- **Regulatory Status**: OCC Approval to Convert to a Federally Chartered National Trust Bank; BitGo Bank & Trust is chartered and regulated by the Office of the Comptroller of the Currency (OCC); Licensed Under MiCAR (BitGo Europe GmbH).
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Multi-Signature, Threshold Signature Scheme (TSS)
- **Authoritative Source URL**: www.bitgo.com

---

## Anchorage Digital

- **Category**: Digital Asset Custody
- **Product Name**: Anchorage Digital Custody; Porto by Anchorage Digital
- **Product Brief**: Institutional digital asset custody and self-custody wallet platform offering security, compliance, and DeFi integration.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC), quantum-resistant algorithms, or any plans for PQC migration. It references standard cryptographic methods like ECDSA implicitly via blockchain support but explicitly mentions FIPS-140 policy and HSMs without specifying PQC standards.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Text mentions "cryptographically signed instructions" and "private key security" but does not list specific algorithms like ECDSA, Ed25519, or BLS).
- **Key Management Model**: HSM-backed (Hardware Security Modules), Quorum-based approvals, Self-custody (for Porto), Multi-party computation (MPC) mentioned as a comparison point which Porto claims to be superior to.
- **Supported Blockchains**: Ethereum, Solana, Bitcoin, Polygon, Arbitrum, Optimism, Base, Avalanche (implied via EVM chains), Celo, Litecoin, Dogecoin, Cosmos, Aptos, Sui, Sei, Oasis Network, Filecoin, Osmosis, Agoric, Axelar, Celestia, ZKsync, dYdX, Monad, Provenance, Evmos, Rarimo.
- **Architecture Type**: HSM-based (Anchorage Digital Custody); HSM-based self-custody (Porto).
- **Infrastructure Layer**: Hardware, Security Stack, Application
- **License Type**: Proprietary
- **License**: Unknown
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: Yes (FIPS PUB 140-2 policy mentioned for HSMs in Porto; FIPS-140 policy mentioned generally).
- **Primary Platforms**: Web dashboard, Mobile (implied by "mobile and desktop on-chain wallet"), Desktop.
- **Target Industries**: Protocols, VC firms, Hedge funds, Wealth managers, Government, ETF issuers, Asset managers, Corporations, DeFi.
- **Regulatory Status**: U.S. Office of the Comptroller of the Currency (OCC) charter (Anchorage Digital Bank); Major Payment Institution licensed by Monetary Authority of Singapore (MAS) (Anchorage Digital Singapore); SOC 1 and SOC 2 Type II certified.
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated (Document describes custody services, not the consensus mechanisms of the underlying blockchains).
- **Signature Schemes**: Not stated (Text mentions "cryptographically signed instructions" but does not name specific schemes).
- **Authoritative Source URL**: Not stated (Source filenames provided: Anchorage_Custody_Platform.html, Anchorage_Porto_Self_Custody.html).

---

## Coinbase Custody

- **Category**: Digital Asset Custody
- **Product Name**: Coinbase Custody (provided by Coinbase Custody Trust Company, LLC)
- **Product Brief**: Securely store all your digital assets with advanced, in-house security as a qualified custodian.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document mentions "advanced, in-house security" and "SOC 1 & 2 Audits" but contains no explicit mention of Post-Quantum Cryptography (PQC), quantum-resistant algorithms, or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated (Document mentions "key management end-to-end" and "advanced, in-house security" but does not specify the architecture type).
- **Supported Blockchains**: Not stated (Document mentions "millions of assets" and "275+ Tradeable assets" but does not list specific blockchain networks).
- **Architecture Type**: Unknown
- **Infrastructure Layer**: Application, Security Stack
- **License Type**: Proprietary
- **License**: Unknown
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No (Document mentions SOC 1 & 2 Audits by Deloitte & Touche, but does not mention FIPS validation).
- **Primary Platforms**: Not stated
- **Target Industries**: Institutions, Banks, Brokerages, Hedge Funds, Asset Managers, Corporates, Financial Institutions, Government
- **Regulatory Status**: NYDFS Qualified Custodian (Coinbase Custody Trust Company, LLC chartered as a limited purpose trust company by New York State Department of Financial Services); MiCA licence; Registered futures commission merchant with CFTC (Coinbase Financial Markets, Inc.); Member of National Futures Association (NFA).
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (Document text provided from source files Coinbase_Prime_Custody.html and Coinbase_Institutional.html, but no specific product URL is extracted).

---

## Copper.co

- **Category**: Digital Asset Custody
- **Product Name**: Copper Digital Asset Custody
- **Product Brief**: Secure MPC-based custody solution for institutional clients supporting 60+ networks and 600+ digital assets.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC), PQC algorithms, or any plans for PQC migration. It focuses exclusively on current MPC technology.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions "MPC technology" and "shards" but does not specify underlying signature schemes like ECDSA or Ed25519).
- **Key Management Model**: MPC threshold (3-of-3 shards managed by Client, Copper, and Trusted Third Party; no private key ever created or assembled).
- **Supported Blockchains**: 60+ networks (specific names not listed in text).
- **Architecture Type**: MPC-based (with cold, warm, and hot vault options).
- **Infrastructure Layer**: Security Stack, Application
- **License Type**: Not stated
- **License**: Unknown
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: No
- **Primary Platforms**: Not stated (Web-based platform implied by "Book a demo" and URL).
- **Target Industries**: Institutional investors, Hedge funds, Trading firms, Foundations, Exchanges, ETP Providers, Venture capital funds, Miners.
- **Regulatory Status**: Registered in Switzerland as Copper Markets (Switzerland) AG (CHE 477.629.838); intended for institutional investors only.
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated (Document describes internal custody consensus "2 of 3 quorum" for transfers, not blockchain consensus).
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: copper.co

---

## Ledger Enterprise

- **Category**: Digital Asset Custody
- **Product Name**: Ledger Enterprise
- **Product Brief**: All-in-one Digital Asset Platform for Institutions.
- **PQC Support**: No
- **PQC Capability Description**: The document does not state that Ledger Enterprise supports Post-Quantum Cryptography (PQC). It discusses Multi-Party Computation (MPC) as a current security technology but explicitly states MPC-only solutions are not ready for production and mentions the need for secure hardware. No PQC algorithms or migration plans are mentioned.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: BIP-32, Threshold Signature Schemes (TSS), ECDSA (referenced in context of DSA/ECDSA signatures in references)
- **Key Management Model**: Hybrid approach proposed; current market MPC solutions described as lacking full lifecycle management; Ledger advocates for key generation and storage on secure hardware combined with MPC for distributed signing.
- **Supported Blockchains**: Bitcoin, Ethereum, Solana (mentioned under "Securely manage crypto")
- **Architecture Type**: Hybrid (Secure Hardware + MPC proposed); Document critiques standalone MPC-only architectures.
- **Infrastructure Layer**: Hardware, Security Stack, Application
- **License Type**: Not stated
- **License**: Unknown
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No (Document states: "Security setups based on MPC have yet to pass extensive penetration testing and security certifications such as Common Criteria, FIPS, or CSPN certifications.")
- **Primary Platforms**: Not stated (Mentions devices like smartphone, laptop, computer for signers; secure hardware for key generation)
- **Target Industries**: Institutions, Digital Asset Custody
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Threshold Signature Schemes (TSS), ECDSA (referenced in context of Bitcoin wallet security)
- **Authoritative Source URL**: Not stated

---

## Hex Trust

- **Category**: Digital Asset Custody
- **Product Name**: Hex Trust Platform
- **Product Brief**: Fully regulated institutional digital asset Markets services, Custody and Staking.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document mentions "security-first infrastructure" and "highest security standards" but contains no explicit mention of Post-Quantum Cryptography (PQC), quantum-resistant algorithms, or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Linea, Polkadot, Bitcoin Cash, Ton, Neutron, Bitcoin, Ethereum, Solana, Grass, Cosmos, Binance Smart Chain, Polygon, Celestia, Flare, Injective, Dymension, Algorand, Optimism, Tezos, Ripple, Hedera, Avalanche, Klaytn, Songbird
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application
- **License Type**: Proprietary
- **License**: Unknown
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: No
- **Primary Platforms**: Not stated
- **Target Industries**: Institutional investors, Financial Institutions, High Net Worth Individuals, Protocols & Foundations, DeFi, NFTs
- **Regulatory Status**: Licensed/Registered in Dubai (UAE), Hong Kong, Singapore, Italy, France; Compliance with KYC, AML, CTF.
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated

---

## Zodia Custody

- **Category**: Digital Asset Custody
- **Product Name**: Zodia Custody
- **Product Brief**: Institution-grade cold wallet storage with 24/7 instant availability and air-gapped security.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document mentions "Hardware Security Modules (HSMs)" and "cryptographic layer" but does not specify any Post-Quantum Cryptography algorithms, standards, or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: HSM-backed cold storage with client-controlled entitlement workflows embedded in HSMs; air-gapped cold wallets.
- **Supported Blockchains**: Not stated
- **Architecture Type**: HSM-based, air-gapped cold storage
- **Infrastructure Layer**: Hardware, Security Stack
- **License Type**: Proprietary (implied by "Commercial" nature and institutional focus; specific license text not stated)
- **License**: Unknown
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

## Komainu

- **Category**: Digital Asset Custody
- **Product Name**: Komainu
- **Product Brief**: The institutional gateway for digital assets providing bank-grade custody, staking, and trading infrastructure.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document mentions "State-of-the-art MPC and HSM wallet technology" and "zero-trust architecture" but contains no explicit mention of Post-Quantum Cryptography (PQC) algorithms or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions MPC and HSM technologies but does not list specific cryptographic primitives like ECDSA, Ed25519, or RSA).
- **Key Management Model**: Hybrid MPC and HSM
- **Supported Blockchains**: Hyperliquid (HYPE on HyperEVM)
- **Architecture Type**: Hybrid MPC+HSM
- **Infrastructure Layer**: Security Stack, Application
- **License Type**: Not stated
- **License**: Unknown
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: No (Document mentions "leading security certifications" but does not explicitly state FIPS 140-2 or 140-3 validation).
- **Primary Platforms**: Not stated
- **Target Industries**: Institutional Investors, Finance
- **Regulatory Status**: Regulated entities (specific licenses or charters not named)
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated

---
