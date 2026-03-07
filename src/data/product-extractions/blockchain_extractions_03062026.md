---
generated: 2026-03-06
collection: blockchain
documents_processed: 15
enrichment_method: ollama-qwen3.5:27b
---

## Bitcoin Core

- **Category**: Blockchain & DLT Protocols
- **Product Name**: Bitcoin Core
- **Product Brief**: Proposed BIP 360 introduces Pay-to-Merkle-Root to address quantum vulnerabilities in Bitcoin addresses.
- **PQC Support**: Planned (with timeline)
- **PQC Capability Description**: Current Bitcoin addresses are not quantum resistant. BIP 360 proposes a "first step" via Pay-to-Merkle-Root (P2MR) to protect against long-exposure attacks by removing keypath spend. The team intends to introduce post-quantum signature schemes for short-exposure protection in future proposals.
- **PQC Migration Priority**: Critical
- **Crypto Primitives**: ECDSA
- **Key Management Model**: Not stated
- **Supported Blockchains**: Bitcoin
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Network, Application
- **License Type**: Not stated
- **License**: Unknown
- **Latest Version**: Not stated
- **Release Date**: 2025-12 (Updated: December 2025)
- **FIPS Validated**: No
- **Primary Platforms**: Not stated
- **Target Industries**: Cryptocurrency, Finance
- **Regulatory Status**: US federal government mandate to phase out ECDSA by 2035
- **PQC Roadmap Details**: BIP 360 is a proposed first step for long-exposure protection; future proposals will introduce post-quantum signature schemes for short-exposure attacks. Transition estimated to take several years.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Current: ECDSA; Planned: Post-quantum signature schemes (specific algorithms not stated)
- **Authoritative Source URL**: Bitcoin_BIP360_P2QRH.html

---

## Ethereum (Geth)

- **Category**: Blockchain & DLT Protocols
- **Product Name**: Ethereum
- **Product Brief**: A community-driven platform aiming for scalability, security, and sustainability through regular upgrades.
- **PQC Support**: No
- **PQC Capability Description**: The document mentions "Future-proofing" and readiness for future generations but contains no explicit mention of Post-Quantum Cryptography (PQC) algorithms, implementations, or specific migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Ethereum mainnet, Beacon Chain
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Network
- **License Type**: Not stated
- **License**: Unknown
- **Latest Version**: Glamsterdam (In development)
- **Release Date**: 2026-00-00
- **FIPS Validated**: No
- **Primary Platforms**: Not stated
- **Target Industries**: Cryptocurrency, DeFi, Enterprise
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Proof of Stake (PoS)
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: ethereum.org

---

## Solana

- **Category**: Blockchain & DLT Protocols
- **Product Name**: Solana
- **Product Brief**: A high-throughput blockchain protocol currently using Ed25519 signatures, analyzing requirements for post-quantum migration.
- **PQC Support**: No
- **PQC Capability Description**: Solana currently relies on Ed25519 and BLS aggregation, which are vulnerable to Shor's algorithm. The document states that no practically deployable PQ analogue to BLS aggregation exists yet. While hash-based one-time signature schemes (e.g., Winternitz) exist on Solana today for vault constructions, the core protocol is not PQC-ready. Migration is considered impractical until more efficient schemes are available or quantum threats become imminent.
- **PQC Migration Priority**: Critical
- **Crypto Primitives**: Ed25519, BLS, SHA-256
- **Key Management Model**: Not stated
- **Supported Blockchains**: Solana
- **Architecture Type**: Blockchain Protocol
- **Infrastructure Layer**: Network, Security Stack
- **License Type**: Not stated
- **License**: Unknown
- **Latest Version**: Not stated
- **Release Date**: 2025-12-05 (Document publication date)
- **FIPS Validated**: No
- **Primary Platforms**: Solana Network
- **Target Industries**: Cryptocurrency, Blockchain
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: The document suggests delaying full PQ migration until more efficient schemes are discovered or quantum computers become an imminent threat. It notes that transaction size limits will increase to 4096 bytes in 2026. Potential future approaches include using hashes of PQ public keys for addresses, defining transaction IDs as payload hashes, and exploring lattice-based aggregation (e.g., Chipmunk) or STARK-based aggregation for Votor, though these are currently not efficient enough.
- **Consensus Mechanism**: Alpenglow (Votor/Rotor components mentioned)
- **Signature Schemes**: Current: Ed25519, BLS. Planned/Research: ML-DSA, SLH-DSA, FN-DSA, HAWK signatures, Winternitz (hash-based), Chipmunk (lattice-based aggregation).
- **Authoritative Source URL**: Not stated

---

## Hyperledger Fabric

- **Category**: Blockchain & DLT Protocols
- **Product Name**: Hyperledger Fabric
- **Product Brief**: A permissioned blockchain platform using X.509 certificates and PKI for identity management and secure communication.
- **PQC Support**: No
- **PQC Capability Description**: The document describes the use of traditional Public Key Infrastructure (PKI) with X.509 certificates, digital signatures, and public/private key pairs. There is no mention of Post-Quantum Cryptography (PQC), quantum-resistant algorithms, or migration plans for PQC.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: X.509, Digital Certificates, Public Keys, Private Keys, Digital Signatures
- **Key Management Model**: PKI hierarchical model with Certificate Authorities (Root CAs, Intermediate CAs) and Membership Service Providers (MSP).
- **Supported Blockchains**: Hyperledger Fabric networks
- **Architecture Type**: PKI-based with X.509 certificates
- **Infrastructure Layer**: Security Stack, Network
- **License Type**: Creative Commons Attribution 4.0 International License
- **License**: Unknown
- **Latest Version**: Unknown
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Not stated
- **Target Industries**: Enterprise (implied by "permissioned blockchain system" and organizational use cases)
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Digital Signatures (specific algorithm not stated, relies on X.509 standard)
- **Authoritative Source URL**: hyperledger-fabric.readthedocs.io

---

## Hyperledger Besu

- **Category**: Blockchain & DLT Protocols
- **Product Name**: Besu
- **Product Brief**: An open source Ethereum client written in Java that runs on public and private networks.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC), PQC algorithms, or any related migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: External key management required; Besu does not support key management inside the client and requires Web3Signer to access keystores and sign transactions.
- **Supported Blockchains**: Ethereum Mainnet, Hoodi, Ephemery, Sepolia (public testnets), and private networks.
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application, Network
- **License Type**: Apache 2.0
- **License**: Unknown
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: No
- **Primary Platforms**: Java (runs on public and private networks)
- **Target Industries**: Enterprise, Public networks
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated

---

## R3 Corda

- **Category**: Blockchain & DLT Protocols
- **Product Name**: Unknown
- **Product Brief**: Not stated
- **PQC Support**: No
- **PQC Capability Description**: The provided text contains no information regarding Post-Quantum Cryptography (PQC) implementation, algorithms, or maturity levels. It consists entirely of GitHub website navigation, login forms, and footer links.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Not stated
- **License Type**: Not stated
- **License**: Unknown
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Not stated
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated

---

## QRL

- **Category**: Blockchain & DLT Protocols
- **Product Name**: QRL (Quantum Resistant Ledger)
- **Product Brief**: A visionary blockchain platform secured by NIST-approved XMSS, offering quantum-safe digital assets and secure communications.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Industrial implementation utilizing IETF specified XMSS (hash-based, forward secure). Features on-chain lattice key storage, ephemeral messaging layer using Dilithium and Kyber (under development), and PQ document notarisation. NIST-approved signature scheme with reusable addresses.
- **PQC Migration Priority**: High
- **Crypto Primitives**: XMSS, Winternitz OTS+, Kyber, Dilithium
- **Key Management Model**: On-chain lattice key storage, hardware wallet support (Ledger), multisignature wallet capability
- **Supported Blockchains**: QRL (native), Ethereum (via Project Zond/enQlave)
- **Architecture Type**: Blockchain protocol with on-chain key storage and hardware integration
- **Infrastructure Layer**: Application, Security Stack, Network
- **License Type**: MIT
- **License**: Unknown
- **Latest Version**: QRL 2.0 (Testnet V2)
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Windows, OSX, Linux, Android, iOS, Web
- **Target Industries**: Cryptocurrency, Enterprise, Digital Asset Security
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: QRL 2.0 Testnet V2 launching Q1 2026; audits to follow towards mainnet release. Development of enQlave for Ethereum. Planned PQ proof-of-stake consensus and ephemeral messaging using Dilithium and Kyber.
- **Consensus Mechanism**: Proof-of-Work (current), PQ proof-of-stake (under development)
- **Signature Schemes**: XMSS (current), Dilithium and Kyber (planned/under development)
- **Authoritative Source URL**: Not stated

---

## Algorand

- **Category**: Blockchain & DLT Protocols
- **Product Name**: Algorand
- **Product Brief**: A global-scale, secure, and resilient blockchain protocol enabling asset tokenization, DeFi, payments, and identity applications.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Algorand has executed the first post-quantum transaction on its mainnet using NIST-selected Falcon signatures (Falcon-1024). The protocol uses Falcon for state proofs every 256 rounds and supports PQC transactions via Logic Signatures. While production-grade code exists, general account and consensus layer integration is described as experimental.
- **PQC Migration Priority**: High
- **Crypto Primitives**: Ed25519, Falcon (Falcon-512, Falcon-1024), RSA (mentioned as vulnerable)
- **Key Management Model**: Logic Signature-based stateless smart contracts; deterministic signing mode with constant-time coding practices.
- **Supported Blockchains**: Algorand Mainnet
- **Architecture Type**: Blockchain Protocol with native PQC opcode integration (falcon_verify) and Logic Signatures
- **Infrastructure Layer**: Network, Security Stack
- **License Type**: Not stated
- **License**: Unknown
- **Latest Version**: AVM v12 (Algorand Virtual Machine version mentioned for falcon_verify opcode)
- **Release Date**: 2025-11-03 (Date of the technical brief article; transaction execution date not explicitly specified as a separate release date)
- **FIPS Validated**: No
- **Primary Platforms**: Algorand Mainnet, Developer tools (AlgoKit), Command-line tools
- **Target Industries**: Asset tokenization, DeFi, Payments, Supply chain, Identity, Humanitarian aid
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Falcon signatures are deployed for state proofs and experimental transactions; full integration for accounts and consensus layer is noted as bringing additional challenges and remains experimental.
- **Consensus Mechanism**: Not stated (Text mentions "consensus vote" and "committee selection" but does not name the specific mechanism like Pure Proof-of-Stake)
- **Signature Schemes**: Ed25519 (current standard), Falcon (PQC, NIST-selected)
- **Authoritative Source URL**: Not stated

---

## Cardano

- **Category**: Blockchain & DLT Protocols
- **Product Name**: Cardano
- **Product Brief**: A high-assurance blockchain protocol built on peer-reviewed science and formal specification by Input Output Research.
- **PQC Support**: Planned (with timeline)
- **PQC Capability Description**: Input Output Research conducts advanced research in post-quantum cryptography as part of its fundamental research (SRL 1–2) and technology validation (SRL 3–5). The text states they are pioneering foundational research but does not confirm production implementation or specific algorithms currently deployed on the Cardano mainnet.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Cardano, Midnight
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Network, Security Stack
- **License Type**: Not stated
- **License**: Unknown
- **Latest Version**: Not stated
- **Release Date**: 2024-10-14 (Date of "Ouroboros Peras" article)
- **FIPS Validated**: No
- **Primary Platforms**: Not stated
- **Target Industries**: Cryptocurrency, Decentralized Systems, Finance
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Advanced research in post-quantum cryptography is listed under "Where we focus" (Cryptography). Projects follow a Software Readiness Levels (SRL) framework from conceptual modeling to implementation. No specific algorithm choices or migration timelines are provided.
- **Consensus Mechanism**: Ouroboros
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated

---

## IOTA

- **Category**: Blockchain & DLT Protocols
- **Product Name**: IOTA
- **Product Brief**: A cryptocurrency platform using hash-based digital signatures to secure transactions on the Tangle.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Implements hash-based signatures using the Winternitz one-time signature scheme (OTS). These are viewed as resistant to quantum attacks like Shor's algorithm. The current implementation is a one-time signature scheme, requiring addresses not to be debited more than once. Reusable addresses are under consideration.
- **PQC Migration Priority**: Critical
- **Crypto Primitives**: Winternitz one-time signature scheme, hash functions (generic)
- **Key Management Model**: One-time private keys generated per address; keys must not be reused for signing multiple transactions.
- **Supported Blockchains**: IOTA Tangle
- **Architecture Type**: Hash-based signature architecture
- **Infrastructure Layer**: Network, Security Stack
- **License Type**: Not stated
- **License**: Unknown
- **Latest Version**: Not stated
- **Release Date**: 2019-02-27 (Date of the referenced blog post)
- **FIPS Validated**: No
- **Primary Platforms**: Not stated
- **Target Industries**: Cryptocurrency, Trade Initiative
- **Regulatory Status**: Joint Industry Response to FCA CP25/40 in the UK mentioned; no specific license or charter held by IOTA stated.
- **PQC Roadmap Details**: Considering ways around the one-time signature limitation, such as a recent proposal for reusable addresses.
- **Consensus Mechanism**: Not stated (Text refers to "Tangle" but does not explicitly name the consensus algorithm like PoW/PoS).
- **Signature Schemes**: Winternitz one-time signature scheme (current); Reusable addresses (planned/considered)
- **Authoritative Source URL**: Not stated (Source filename provided: IOTA_Tangle_Signatures.html, but no full URL)

---

## Polkadot/Substrate

- **Category**: Blockchain & DLT Protocols
- **Product Name**: Polkadot/Substrate
- **Product Brief**: A platform for building smart contracts, parachains, and node infrastructure with developer documentation.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document contains no mention of Post-Quantum Cryptography algorithms, migration plans, or research initiatives.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions "Cryptography" as a section header but does not list specific algorithms like ECDSA, Ed25519, or BLS).
- **Key Management Model**: Not stated (Document mentions "Set Up a Validator Key Management" as a topic but does not describe the architecture).
- **Supported Blockchains**: Polkadot Hub, Parachains, Ethereum (via EVM/PVM and precompiles)
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Network, Application
- **License Type**: Not stated
- **License**: Unknown
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Not stated (Document mentions "Local Development", "Remix IDE", "Hardhat", "Foundry" as development environments, but not OS or cloud targets).
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Proof-of-Stake (Relay Chain)
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated

---

## Cosmos/Tendermint

- **Category**: Blockchain & DLT Protocols
- **Product Name**: pqc-cosmos
- **Product Brief**: A Post-Quantum Cosmos-based Infrastructure replacing existing signature algorithms with Dilithium for Tendermint and Cosmos-SDK.
- **PQC Support**: Planned (with details)
- **PQC Capability Description**: The project aims to replace Ed25519 with the Dilithium signature algorithm in Tendermint/CometBFT and Cosmos-SDK. Preliminary tasks include a functioning Tendermint core with Dilithium, key generation, and network startup. Full integration into cosmos-app-pqc is planned to support transfers, staking, governance, and CosmWasm.
- **PQC Migration Priority**: High
- **Crypto Primitives**: Ed25519 (current), Dilithium (planned/replaced)
- **Key Management Model**: Not stated
- **Supported Blockchains**: Cosmos-based Appchains (using CosmosSDK)
- **Architecture Type**: Software-based PQC implementation within Tendermint and Cosmos-SDK
- **Infrastructure Layer**: Security Stack, Application
- **License Type**: GPL-3.0 license
- **License**: Unknown
- **Latest Version**: v0.47.15 (mentioned as a specific version to implement)
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Not stated
- **Target Industries**: Cryptocurrency, Decentralized Finance (DeFi)
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Replace Ed25519 with Dilithium in Tendermint/CometBFT and Cosmos-SDK; benchmark performance; integrate into cosmos-app-pqc; develop Keplr wallet support plan; create post-quantum migration/fork plan for existing chains.
- **Consensus Mechanism**: Tendermint (CometBFT)
- **Signature Schemes**: Current: Ed25519; Planned/Implemented in repo: Dilithium
- **Authoritative Source URL**: https://github.com/DoraFactory/pqc-cosmos

---

## Aptos

- **Category**: Blockchain & DLT Protocols
- **Product Name**: Aptos
- **Product Brief**: A blockchain protocol proposing SLH-DSA-SHA2-128s as its first post-quantum signature scheme.
- **PQC Support**: Planned (with timeline)
- **PQC Capability Description**: Proposal (AIP-137, Draft status) to add SLH-DSA-SHA2-128s signatures for accounts. Implementation details include 48-byte secret keys and 32-byte public keys. Benchmarks show verification is ~5x slower than Ed25519. Future support for ML-DSA and Falcon is mentioned as potential alternatives but not currently implemented.
- **PQC Migration Priority**: High
- **Crypto Primitives**: Ed25519, Secp256k1, Secp256r1, SLH-DSA-SHA2-128s (proposed), ML-DSA (future candidate), Falcon (future candidate)
- **Key Management Model**: Deterministic signing; BIP-32 HD wallet support proposed with hardened derivation only.
- **Supported Blockchains**: Aptos
- **Architecture Type**: Software-based signature scheme integration (RustCrypto/signatures ecosystem).
- **Infrastructure Layer**: Security Stack, Application
- **License Type**: Not stated
- **License**: Unknown
- **Latest Version**: Not stated
- **Release Date**: 2025-12-12 (AIP updated date)
- **FIPS Validated**: No (References FIPS-205 standard for SLH-DSA, but no validation status for the Aptos implementation is stated).
- **Primary Platforms**: x86_64 (benchmarks), Rust ecosystem, TypeScript SDK.
- **Target Industries**: Cryptocurrency, Blockchain
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: AIP-137 proposes SLH-DSA-SHA2-128s as the first PQ scheme. Future plans include potentially adding ML-DSA (FIPS-204) and Falcon. Governance can enable PQ accounts when CRQC rumors become worrisome.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Current: Ed25519, Secp256k1, Secp256r1. Proposed: SLH-DSA-SHA2-128s. Future candidates: ML-DSA, Falcon.
- **Authoritative Source URL**: https://github.com/aptos-foundation/AIPs/blob/main/aips/aip-137.md

---

## Avalanche

- **Category**: Blockchain & DLT Protocols
- **Product Name**: Avalanche
- **Product Brief**: A blockchain protocol proposing a staged migration to Post-Quantum Cryptography via hybrid signatures and subnet testing.
- **PQC Support**: Planned (with timeline)
- **PQC Capability Description**: Proposal for a staged transition using a Hybrid Signature Model combining ECDSA with Falcon/Dilithium. Includes C-Chain precompiles for PQC verification and Subnet Modularity for testing PQ-only environments before mainnet enforcement. Currently in technical review phase via ACP repository.
- **PQC Migration Priority**: High
- **Crypto Primitives**: ECDSA, Falcon, Dilithium
- **Key Management Model**: Hybrid (classical and PQ-safe keys)
- **Supported Blockchains**: Avalanche
- **Architecture Type**: Hybrid Signature Model
- **Infrastructure Layer**: Network, Security Stack
- **License Type**: Not stated
- **License**: Unknown
- **Latest Version**: Not stated
- **Release Date**: 2026-02-21
- **FIPS Validated**: No
- **Primary Platforms**: Avalanche Ecosystem
- **Target Industries**: Cryptocurrency, Blockchain
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Staged migration path; Hybrid Signature Model (ECDSA + Falcon/Dilithium); C-Chain Precompiles at 0x101/0x102; Subnet Modularity for testing; Gas Economics benchmarks.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Current: ECDSA; Planned: Falcon, Dilithium (Hybrid)
- **Authoritative Source URL**: https://github.com/avalanche-foundation/ACPs/pull/278

---

## Sui

- **Category**: Blockchain & DLT Protocols
- **Product Name**: Sui
- **Product Brief**: A blockchain platform built with cryptographic agility to adapt to quantum-resistant cryptography.
- **PQC Support**: Planned (with timeline)
- **PQC Capability Description**: Sui is designed for cryptographic agility but currently uses classical primitives. Transition strategies are defined, including proactive multisig and adaptive ownership transitions. NIST-recommended algorithms like ML-DSA (Dilithium), FALCON, SPHINCS+, and ML-KEM (Kyber) are identified for future adoption. Batch verification optimizations for PQ signatures are currently lacking compared to ECC.
- **PQC Migration Priority**: Critical
- **Crypto Primitives**: ECDSA, EdDSA, RSA, BLS12-381, AES (implied via TLS/symmetric), SHA-256 (implied via 256-bit digests)
- **Key Management Model**: Not stated
- **Supported Blockchains**: Sui
- **Architecture Type**: Blockchain Protocol
- **Infrastructure Layer**: Security Stack, Network
- **License Type**: Not stated
- **License**: Unknown
- **Latest Version**: Not stated
- **Release Date**: 2025-04-10
- **FIPS Validated**: No
- **Primary Platforms**: Not stated
- **Target Industries**: Cryptocurrency, Blockchain
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: NIST mandates deprecation of classical algorithms by 2030 and phase-out by 2035. Sui plans to adopt lattice-based schemes (Dilithium, FALCON) and hash-based schemes (SPHINCS+). Strategies include PreQ-PQ multisig at account creation and ownership transitions for existing addresses.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Current: ECDSA, EdDSA, RSA, BLS12-381. Planned/Considered: CRYSTALS-Dilithium (ML-DSA), FALCON, SPHINCS+.
- **Authoritative Source URL**: Not stated

---
