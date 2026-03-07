#!/usr/bin/env python3
"""
Generate migrate CSV rows for custody platforms and blockchain protocols.

Combines qwen3.5:27b extraction data with research knowledge to produce
properly formatted CSV rows ready to append to the migrate CSV.

Usage:
  python3 scripts/generate-migrate-csv-rows.py
"""

import csv
import json
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).parent.parent
EXTRACTIONS_DIR = ROOT / 'src' / 'data' / 'product-extractions'
DATA_DIR = ROOT / 'src' / 'data'

TODAY = datetime.now().strftime('%m%d%Y')
TODAY_ISO = datetime.now().strftime('%Y-%m-%d')

# CSV columns in exact order
COLUMNS = [
    'software_name', 'category_id', 'category_name', 'infrastructure_layer',
    'pqc_support', 'pqc_capability_description', 'license_type', 'license',
    'latest_version', 'release_date', 'fips_validated', 'pqc_migration_priority',
    'primary_platforms', 'target_industries', 'authoritative_source',
    'repository_url', 'product_brief', 'source_type', 'verification_status',
    'last_verified_date', 'migration_phases', 'learning_modules',
]

# Research-supplemented data for custody platforms (CSC-057)
CUSTODY_OVERRIDES = {
    'Fireblocks': {
        'pqc_support': 'No',
        'pqc_capability_description': 'MPC-CMP based custody platform. Uses threshold signatures (MPC-CMP protocol) for key management. No PQC algorithms or quantum-safe roadmap announced. Open-sourced MPC-CMP protocol in 2023.',
        'license_type': 'Commercial',
        'license': 'Commercial',
        'pqc_migration_priority': 'High',
        'primary_platforms': 'Cloud SaaS',
        'target_industries': 'Cryptocurrency Finance DeFi Enterprise',
        'authoritative_source': 'https://www.fireblocks.com/what-is-mpc',
        'repository_url': 'https://github.com/fireblocks/mpc-lib',
        'product_brief': 'MPC-CMP based institutional digital asset custody platform supporting hot and cold wallets with threshold signatures.',
        'infrastructure_layer': 'Security Stack',
        'migration_phases': 'assess',
        'learning_modules': 'digital-assets;hsm-pqc',
    },
    'DFNS': {
        'pqc_support': 'Planned',
        'pqc_capability_description': 'API-first key orchestration platform supporting MPC TSS and HSM backends. Quantum-safe cryptography support announced via IBM Crypto Express HSM integration. No specific PQC algorithms or timeline disclosed.',
        'license_type': 'Commercial',
        'license': 'Proprietary',
        'pqc_migration_priority': 'High',
        'primary_platforms': 'Cloud SaaS On-premises',
        'target_industries': 'Cryptocurrency Finance Enterprise',
        'authoritative_source': 'https://www.dfns.co/article/introducing-hsm',
        'repository_url': '',
        'product_brief': 'API-first key orchestration platform with MPC HSM and hybrid custody models. Quantum-safe support planned via IBM HSM integration.',
        'fips_validated': 'Partial (IBM Crypto Express FIPS 140-2 L4)',
        'infrastructure_layer': 'Security Stack',
        'migration_phases': 'assess;plan',
        'learning_modules': 'digital-assets;hsm-pqc',
    },
    'Taurus SA': {
        'pqc_support': 'Planned',
        'pqc_capability_description': 'Swiss digital asset infrastructure provider. CSO Jean-Philippe Aumasson is co-designer of SPHINCS+ (SLH-DSA NIST standard). PQC development stated as strategic objective. Regulated by FINMA. Products: Taurus-PROTECT (custody) Taurus-CAPITAL (tokenization) Taurus-PRIME (trading).',
        'license_type': 'Commercial',
        'license': 'Proprietary',
        'pqc_migration_priority': 'Critical',
        'primary_platforms': 'Cloud On-premises Hybrid',
        'target_industries': 'Finance Enterprise Government',
        'authoritative_source': 'https://www.taurushq.com/',
        'repository_url': '',
        'product_brief': 'Swiss FINMA-regulated digital asset custody tokenization and trading platform. CSO co-designed SPHINCS+ PQC standard.',
        'fips_validated': 'No',
        'infrastructure_layer': 'Security Stack',
        'migration_phases': 'assess;plan',
        'learning_modules': 'digital-assets;hsm-pqc',
    },
    'Galileo FT': {
        'pqc_support': 'No',
        'pqc_capability_description': 'Fintech payment and wallet infrastructure platform (crypto-to-fiat conversion). Not a dedicated crypto custodian. No PQC algorithms or quantum-safe roadmap announced.',
        'license_type': 'Commercial',
        'license': 'Proprietary',
        'pqc_migration_priority': 'Medium',
        'primary_platforms': 'Cloud SaaS',
        'target_industries': 'Finance Payments Retail',
        'authoritative_source': 'https://www.galileo-ft.com/',
        'repository_url': '',
        'product_brief': 'Cloud-native fintech platform for banking payments and digital wallet infrastructure with crypto capabilities.',
        'fips_validated': 'No',
        'infrastructure_layer': 'Application',
        'migration_phases': 'assess',
        'learning_modules': 'digital-assets',
    },
    'BitGo': {
        'pqc_support': 'No',
        'pqc_capability_description': 'TSS 2-of-3 threshold signature custody platform with HSM backing. OCC-chartered national trust bank. Licensed under MiCAR (EU). No PQC roadmap or quantum-safe migration plans announced.',
        'license_type': 'Commercial',
        'license': 'Commercial',
        'pqc_migration_priority': 'High',
        'primary_platforms': 'Cloud SaaS',
        'target_industries': 'Cryptocurrency Finance Enterprise',
        'authoritative_source': 'https://www.bitgo.com/resources/blog/introducing-bitgo-tss/',
        'repository_url': '',
        'product_brief': 'OCC-chartered institutional custody platform using TSS 2-of-3 threshold signatures and HSMs for digital asset security.',
        'fips_validated': 'No',
        'infrastructure_layer': 'Security Stack',
        'migration_phases': 'assess',
        'learning_modules': 'digital-assets;hsm-pqc',
    },
    'Anchorage Digital': {
        'pqc_support': 'No',
        'pqc_capability_description': 'OCC-chartered crypto bank using MPC+HSM hybrid architecture. Supports 25+ blockchain networks. FIPS 140-2 compliant HSMs. SOC 1 and SOC 2 Type II certified. No PQC roadmap announced.',
        'license_type': 'Commercial',
        'license': 'Proprietary',
        'pqc_migration_priority': 'High',
        'primary_platforms': 'Cloud SaaS Web Mobile',
        'target_industries': 'Cryptocurrency Finance Government',
        'authoritative_source': 'https://www.anchorage.com/platform/custody',
        'repository_url': '',
        'product_brief': 'OCC-chartered digital asset bank with MPC+HSM hybrid custody supporting 25+ blockchains and DeFi integration.',
        'fips_validated': 'Yes (FIPS 140-2)',
        'infrastructure_layer': 'Security Stack',
        'migration_phases': 'assess',
        'learning_modules': 'digital-assets;hsm-pqc',
    },
    'Coinbase Custody': {
        'pqc_support': 'No',
        'pqc_capability_description': 'NYDFS qualified custodian and MiCA-licensed institutional custody platform. SOC 1 and SOC 2 audited by Deloitte. Standard ECDSA/EdDSA signatures. No PQC roadmap announced.',
        'license_type': 'Commercial',
        'license': 'Proprietary',
        'pqc_migration_priority': 'High',
        'primary_platforms': 'Cloud SaaS',
        'target_industries': 'Cryptocurrency Finance Enterprise Government',
        'authoritative_source': 'https://www.coinbase.com/prime',
        'repository_url': '',
        'product_brief': 'NYDFS qualified custodian and MiCA-licensed institutional crypto custody with SOC 1/2 audits by Deloitte.',
        'fips_validated': 'No',
        'infrastructure_layer': 'Security Stack',
        'migration_phases': 'assess',
        'learning_modules': 'digital-assets',
    },
    'Copper.co': {
        'pqc_support': 'No',
        'pqc_capability_description': 'MPC-based custody with 3-of-3 threshold signatures. Supports 60+ networks and 600+ digital assets. Cold warm and hot vault configurations. Lloyd\'s insurance via AON. No PQC roadmap announced.',
        'license_type': 'Commercial',
        'license': 'Proprietary',
        'pqc_migration_priority': 'High',
        'primary_platforms': 'Cloud SaaS',
        'target_industries': 'Cryptocurrency Finance Enterprise',
        'authoritative_source': 'https://copper.co/en/products/digital-asset-custody',
        'repository_url': '',
        'product_brief': 'MPC-based institutional custody supporting 600+ digital assets across 60+ networks with Lloyd\'s insurance coverage.',
        'fips_validated': 'No',
        'infrastructure_layer': 'Security Stack',
        'migration_phases': 'assess',
        'learning_modules': 'digital-assets;hsm-pqc',
    },
    'Ledger Enterprise': {
        'pqc_support': 'No',
        'pqc_capability_description': 'Hardware-enforced multi-signature custody using HSMs and Ledger devices. Advocates hybrid hardware+MPC approach over standalone MPC. Supports Bitcoin Ethereum Solana. No PQC roadmap announced.',
        'license_type': 'Commercial',
        'license': 'Proprietary',
        'pqc_migration_priority': 'High',
        'primary_platforms': 'Hardware Cloud',
        'target_industries': 'Cryptocurrency Finance Enterprise',
        'authoritative_source': 'https://www.ledger.com/blog/mpc_readiness',
        'repository_url': '',
        'product_brief': 'Hardware-enforced institutional custody using HSMs and Ledger devices with hybrid hardware+MPC architecture.',
        'fips_validated': 'No',
        'infrastructure_layer': 'Hardware,Security Stack',
        'migration_phases': 'assess',
        'learning_modules': 'digital-assets;hsm-pqc',
    },
    'Metaco (Ripple)': {
        'pqc_support': 'No',
        'pqc_capability_description': 'Institutional digital asset custody platform (Harmonize) acquired by Ripple in 2023 for $250M. Cross-asset custody trading and DeFi services. No PQC roadmap announced.',
        'license_type': 'Commercial',
        'license': 'Proprietary',
        'pqc_migration_priority': 'Medium',
        'primary_platforms': 'Cloud SaaS',
        'target_industries': 'Finance Enterprise',
        'authoritative_source': 'https://ripple.com/solutions/custody/',
        'repository_url': '',
        'product_brief': 'Institutional digital asset custody platform (Harmonize) acquired by Ripple. Cross-asset custody trading and DeFi.',
        'fips_validated': 'No',
        'infrastructure_layer': 'Security Stack',
        'migration_phases': 'assess',
        'learning_modules': 'digital-assets',
    },
    'Hex Trust': {
        'pqc_support': 'No',
        'pqc_capability_description': 'Singapore MAS-licensed institutional custody supporting 24+ blockchain networks including Bitcoin Ethereum Solana Algorand Cosmos Polkadot Avalanche. Regulated in Dubai Hong Kong Singapore Italy France. No PQC roadmap announced.',
        'license_type': 'Commercial',
        'license': 'Proprietary',
        'pqc_migration_priority': 'Medium',
        'primary_platforms': 'Cloud SaaS',
        'target_industries': 'Cryptocurrency Finance',
        'authoritative_source': 'https://www.hextrust.com/',
        'repository_url': '',
        'product_brief': 'MAS-licensed institutional digital asset custody and staking supporting 24+ blockchain networks across 5 jurisdictions.',
        'fips_validated': 'No',
        'infrastructure_layer': 'Application',
        'migration_phases': 'assess',
        'learning_modules': 'digital-assets',
    },
    'Zodia Custody': {
        'pqc_support': 'No',
        'pqc_capability_description': 'Standard Chartered-backed air-gapped cold storage custody with HSM-embedded entitlement workflows. SOC 1/2 and ISO 27001 certified. Regulated in Hong Kong. No PQC roadmap announced.',
        'license_type': 'Commercial',
        'license': 'Proprietary',
        'pqc_migration_priority': 'Medium',
        'primary_platforms': 'Cloud SaaS',
        'target_industries': 'Finance Enterprise Government',
        'authoritative_source': 'https://zodia-custody.com/custody/',
        'repository_url': '',
        'product_brief': 'Standard Chartered-backed institutional custody with air-gapped cold storage and HSM-embedded workflows.',
        'fips_validated': 'No',
        'infrastructure_layer': 'Hardware,Security Stack',
        'migration_phases': 'assess',
        'learning_modules': 'digital-assets;hsm-pqc',
    },
    'Komainu': {
        'pqc_support': 'No',
        'pqc_capability_description': 'Nomura/CoinShares/Ledger-backed institutional custody using hybrid MPC+HSM architecture. Regulated in Jersey UK Dubai Italy Singapore. No PQC roadmap announced.',
        'license_type': 'Commercial',
        'license': 'Proprietary',
        'pqc_migration_priority': 'Medium',
        'primary_platforms': 'Cloud SaaS',
        'target_industries': 'Cryptocurrency Finance',
        'authoritative_source': 'https://komainu.com/',
        'repository_url': '',
        'product_brief': 'Nomura/CoinShares/Ledger-backed institutional custody with hybrid MPC+HSM and multi-jurisdiction regulation.',
        'fips_validated': 'No',
        'infrastructure_layer': 'Security Stack',
        'migration_phases': 'assess',
        'learning_modules': 'digital-assets;hsm-pqc',
    },
}

# Research-supplemented data for blockchain protocols (CSC-058)
BLOCKCHAIN_OVERRIDES = {
    'Bitcoin Core': {
        'pqc_support': 'No (BIP-360 P2MR draft)',
        'pqc_capability_description': 'BIP-360 proposes Pay-to-Merkle-Root (P2MR) as first step toward quantum resistance. Removes keypath spend to protect against long-exposure attacks. Post-quantum signature schemes planned for future proposals. Draft stage - no consensus timeline.',
        'license_type': 'Open Source',
        'license': 'MIT',
        'latest_version': '27.0',
        'pqc_migration_priority': 'Critical',
        'primary_platforms': 'Linux Windows macOS',
        'target_industries': 'Cryptocurrency Finance',
        'authoritative_source': 'https://bip360.org/',
        'repository_url': 'https://github.com/bitcoin/bitcoin',
        'product_brief': 'Reference implementation of the Bitcoin protocol. BIP-360 proposes P2MR address type as first quantum resistance step.',
        'fips_validated': 'No',
        'infrastructure_layer': 'Application',
        'migration_phases': 'assess;plan',
        'learning_modules': 'digital-assets',
    },
    'Ethereum (Geth)': {
        'pqc_support': 'Planned (4-year roadmap)',
        'pqc_capability_description': 'Ethereum Foundation established dedicated PQ team in 2026 with $2M research prize fund. 4-year Strawmap through 2029: replace BLS consensus sigs with hash-based STARK-friendly sigs then upgrade KZG data availability then enable EIP-8141 signature type switching for wallets. Vitalik Buterin published PQC defense roadmap Feb 2026.',
        'license_type': 'Open Source',
        'license': 'LGPL-3.0',
        'latest_version': 'Glamsterdam (dev)',
        'pqc_migration_priority': 'Critical',
        'primary_platforms': 'Linux Windows macOS',
        'target_industries': 'Cryptocurrency DeFi Enterprise',
        'authoritative_source': 'https://ethereum.org/en/roadmap/',
        'repository_url': 'https://github.com/ethereum/go-ethereum',
        'product_brief': 'Primary Ethereum execution client. $2M PQC research fund and 4-year Strawmap for quantum-safe consensus and wallets.',
        'fips_validated': 'No',
        'infrastructure_layer': 'Application',
        'migration_phases': 'assess;plan',
        'learning_modules': 'digital-assets',
    },
    'Solana': {
        'pqc_support': 'Partial (testnet)',
        'pqc_capability_description': 'Uses Ed25519 and BLS aggregation which are Shor-vulnerable. Project Eleven ML-DSA testnet demonstrated quantum-resistant transactions. Hash-based Winternitz one-time sigs exist for vault constructions. Full migration deferred until efficient PQ aggregation schemes available. Transaction size increasing to 4096 bytes in 2026.',
        'license_type': 'Open Source',
        'license': 'Apache-2.0',
        'pqc_migration_priority': 'Critical',
        'primary_platforms': 'Linux',
        'target_industries': 'Cryptocurrency DeFi Web3',
        'authoritative_source': 'https://www.helius.dev/blog/solana-post-quantum-cryptography',
        'repository_url': 'https://github.com/solana-labs/solana',
        'product_brief': 'High-throughput blockchain using Ed25519. Project Eleven ML-DSA testnet active. PQ migration research ongoing.',
        'fips_validated': 'No',
        'infrastructure_layer': 'Application',
        'migration_phases': 'assess;plan;test',
        'learning_modules': 'digital-assets',
    },
    'Hyperledger Fabric': {
        'pqc_support': 'No',
        'pqc_capability_description': 'Enterprise blockchain framework using ECDSA with P-256. Identity managed via X.509 certificates and MSP (Membership Service Provider). No official PQC roadmap. Academic PQFabric research exists but not integrated. Could inherit PQC from upstream OpenSSL 3.x.',
        'license_type': 'Open Source',
        'license': 'Apache-2.0',
        'latest_version': '3.0',
        'pqc_migration_priority': 'High',
        'primary_platforms': 'Linux Docker Kubernetes',
        'target_industries': 'Enterprise Finance Government',
        'authoritative_source': 'https://hyperledger-fabric.readthedocs.io/',
        'repository_url': 'https://github.com/hyperledger/fabric',
        'product_brief': 'Enterprise permissioned blockchain framework using ECDSA P-256. No PQC roadmap but could inherit from OpenSSL.',
        'fips_validated': 'No',
        'infrastructure_layer': 'Application',
        'migration_phases': 'assess',
        'learning_modules': 'digital-assets',
    },
    'Hyperledger Besu': {
        'pqc_support': 'No',
        'pqc_capability_description': 'Ethereum-compatible enterprise blockchain client using secp256k1 (public) and secp256r1 (private networks). Java-based. No PQC roadmap or integration. Could benefit from upstream Ethereum PQC work.',
        'license_type': 'Open Source',
        'license': 'Apache-2.0',
        'pqc_migration_priority': 'High',
        'primary_platforms': 'Linux Docker Kubernetes',
        'target_industries': 'Enterprise Finance',
        'authoritative_source': 'https://besu.hyperledger.org/',
        'repository_url': 'https://github.com/hyperledger/besu',
        'product_brief': 'Ethereum-compatible enterprise blockchain client supporting secp256k1 and secp256r1 for private networks.',
        'fips_validated': 'No',
        'infrastructure_layer': 'Application',
        'migration_phases': 'assess',
        'learning_modules': 'digital-assets',
    },
    'R3 Corda': {
        'pqc_support': 'Yes (SPHINCS)',
        'pqc_capability_description': 'Enterprise DLT with SPHINCS hash-based signature scheme available as production option since 2017. Supports EdDSA (default) ECDSA and RSA. Published BPQS (Blockchain Post-Quantum Signature) protocol at IEEE Blockchain 2018. Cryptographic agility built into platform design.',
        'license_type': 'Open Source/Commercial',
        'license': 'Apache-2.0',
        'latest_version': '4.12',
        'pqc_migration_priority': 'High',
        'primary_platforms': 'Linux Windows macOS JVM',
        'target_industries': 'Finance Enterprise Government',
        'authoritative_source': 'https://docs.r3.com/en/platform/corda/4.12/community/cipher-suites.html',
        'repository_url': 'https://github.com/corda/corda',
        'product_brief': 'Enterprise DLT with SPHINCS quantum-resistant signatures available since 2017. BPQS protocol published at IEEE.',
        'fips_validated': 'No',
        'infrastructure_layer': 'Application',
        'migration_phases': 'migrate;launch',
        'learning_modules': 'digital-assets',
    },
    'QRL': {
        'pqc_support': 'Yes (XMSS)',
        'pqc_capability_description': 'Quantum Resistant Ledger - native quantum-safe blockchain using XMSS (eXtended Merkle Signature Scheme) hash-based signatures from inception (2018). NIST-approved algorithm. V2.0 major update with Audit-Ready Testnet targeting Q1 2026.',
        'license_type': 'Open Source',
        'license': 'MIT',
        'latest_version': 'V2.0 Testnet',
        'pqc_migration_priority': 'Low',
        'primary_platforms': 'Linux',
        'target_industries': 'Cryptocurrency Finance Enterprise',
        'authoritative_source': 'https://www.theqrl.org/',
        'repository_url': 'https://github.com/theQRL/QRL',
        'product_brief': 'Native quantum-resistant blockchain using XMSS hash-based signatures. V2.0 testnet targeting Q1 2026.',
        'fips_validated': 'No',
        'infrastructure_layer': 'Application',
        'migration_phases': 'launch;rampup',
        'learning_modules': 'digital-assets;stateful-signatures',
    },
    'Algorand': {
        'pqc_support': 'Partial (Falcon mainnet)',
        'pqc_capability_description': 'First blockchain to execute PQ transaction on live mainnet using Falcon (NIST-selected lattice signature) in Q2 2025. Falcon verification added to AVM opcodes. Consensus module verifying Falcon signatures natively planned for 2026. VRF remains ECC-vulnerable.',
        'license_type': 'Open Source',
        'license': 'AGPL-3.0',
        'pqc_migration_priority': 'Critical',
        'primary_platforms': 'Linux macOS',
        'target_industries': 'Cryptocurrency Finance Enterprise DeFi',
        'authoritative_source': 'https://algorand.co/technology/post-quantum',
        'repository_url': 'https://github.com/algorand/go-algorand',
        'product_brief': 'First blockchain with PQ mainnet transaction (Falcon). Native AVM Falcon verification. Consensus PQC planned 2026.',
        'fips_validated': 'No',
        'infrastructure_layer': 'Application',
        'migration_phases': 'test;migrate',
        'learning_modules': 'digital-assets',
    },
    'Cardano': {
        'pqc_support': 'Planned',
        'pqc_capability_description': 'Strategic long-term PQC commitment collaborating with Google Linux and Microsoft Research experts. Leaning toward lattice-based cryptography. Nightstream standard for privacy layer. Proof chain architecture using Mithril + PQ signatures for historical transaction immutability.',
        'license_type': 'Open Source',
        'license': 'Apache-2.0',
        'pqc_migration_priority': 'High',
        'primary_platforms': 'Linux macOS',
        'target_industries': 'Cryptocurrency Finance Government',
        'authoritative_source': 'https://iohk.io/en/research/',
        'repository_url': 'https://github.com/IntersectMBO/cardano-node',
        'product_brief': 'Research-driven blockchain with strategic PQC commitment. Lattice-based crypto and Nightstream privacy layer planned.',
        'fips_validated': 'No',
        'infrastructure_layer': 'Application',
        'migration_phases': 'assess;plan',
        'learning_modules': 'digital-assets',
    },
    'IOTA': {
        'pqc_support': 'Planned (hash-based)',
        'pqc_capability_description': 'Originally used quantum-safe Winternitz hash-based signatures (2016-2021). Switched to Ed25519 for UX. IOTA 2.0 returns to hash-based signatures by default with Coordicide completion. Incentivized testnet planned 2025.',
        'license_type': 'Open Source',
        'license': 'Apache-2.0',
        'pqc_migration_priority': 'High',
        'primary_platforms': 'Linux',
        'target_industries': 'IoT Enterprise',
        'authoritative_source': 'https://blog.iota.org/assuring-authenticity-in-the-tangle-with-signatures-791897d7b998/',
        'repository_url': 'https://github.com/iotaledger',
        'product_brief': 'DAG-based DLT returning to quantum-safe hash-based signatures with IOTA 2.0. Pioneer of hash-based sigs at scale.',
        'fips_validated': 'No',
        'infrastructure_layer': 'Application',
        'migration_phases': 'plan;test',
        'learning_modules': 'digital-assets;iot-ot-pqc',
    },
    'Polkadot/Substrate': {
        'pqc_support': 'No (modular)',
        'pqc_capability_description': 'Multi-chain framework using sr25519 (Ed25519 variant) with modular crypto backend. Substrate design permits swappable cryptographic primitives enabling per-parachain PQC adoption without core protocol changes.',
        'license_type': 'Open Source',
        'license': 'GPL-3.0',
        'pqc_migration_priority': 'Medium',
        'primary_platforms': 'Linux',
        'target_industries': 'Cryptocurrency DeFi Enterprise',
        'authoritative_source': 'https://docs.substrate.io/reference/cryptography/',
        'repository_url': 'https://github.com/nicola-mazzocca/BPQS-node',
        'product_brief': 'Multi-chain framework with modular crypto backends. Parachains can adopt PQC independently via Substrate.',
        'fips_validated': 'No',
        'infrastructure_layer': 'Application',
        'migration_phases': 'assess',
        'learning_modules': 'digital-assets',
    },
    'Cosmos/Tendermint': {
        'pqc_support': 'Partial (community)',
        'pqc_capability_description': 'Appchain ecosystem using secp256k1 (accounts) and Ed25519 (validators). DoraFactory pqc-cosmos project adds Dilithium to CometBFT crypto package. Community-driven CosmosSDK replacement with PQC algorithms. Not in core distribution.',
        'license_type': 'Open Source',
        'license': 'Apache-2.0',
        'pqc_migration_priority': 'High',
        'primary_platforms': 'Linux',
        'target_industries': 'Cryptocurrency DeFi Enterprise',
        'authoritative_source': 'https://github.com/DoraFactory/pqc-cosmos',
        'repository_url': 'https://github.com/cosmos/cosmos-sdk',
        'product_brief': 'Appchain ecosystem with community-driven PQC integration via DoraFactory pqc-cosmos (Dilithium in CometBFT).',
        'fips_validated': 'No',
        'infrastructure_layer': 'Application',
        'migration_phases': 'assess;test',
        'learning_modules': 'digital-assets',
    },
    'Aptos': {
        'pqc_support': 'Planned (AIP-137)',
        'pqc_capability_description': 'Move-based blockchain using Ed25519 ECDSA and BLS12-381. AIP-137 proposal integrates SLH-DSA (FIPS 205 hash-based stateless). Backward compatible - Ed25519 accounts unaffected. No new security assumptions required. Proposal stage.',
        'license_type': 'Open Source',
        'license': 'Apache-2.0',
        'pqc_migration_priority': 'High',
        'primary_platforms': 'Linux',
        'target_industries': 'Cryptocurrency DeFi Web3',
        'authoritative_source': 'https://github.com/aptos-foundation/AIPs/blob/main/aips/aip-137.md',
        'repository_url': 'https://github.com/aptos-labs/aptos-core',
        'product_brief': 'Move-based blockchain with AIP-137 proposal for SLH-DSA (FIPS 205) quantum-resistant signatures.',
        'fips_validated': 'No',
        'infrastructure_layer': 'Application',
        'migration_phases': 'assess;plan',
        'learning_modules': 'digital-assets',
    },
    'Avalanche': {
        'pqc_support': 'No (early exploration)',
        'pqc_capability_description': 'Uses ECDSA (secp256k1 P-256). AIP-QR-001 forum proposal for staged transition to lattice-based cryptography. Research phase with no concrete timeline. Per-subnet PQC adoption paths possible.',
        'license_type': 'Open Source',
        'license': 'BSD-3-Clause',
        'pqc_migration_priority': 'Medium',
        'primary_platforms': 'Linux macOS',
        'target_industries': 'Cryptocurrency DeFi Enterprise',
        'authoritative_source': 'https://forum.avax.network/t/acp-idea-staged-transition-to-quantum-resistant-cryptography-aip-qr-001/7055',
        'repository_url': 'https://github.com/ava-labs/avalanchego',
        'product_brief': 'Subnet-based blockchain with AIP-QR-001 proposal for staged PQC transition. Early exploration phase.',
        'fips_validated': 'No',
        'infrastructure_layer': 'Application',
        'migration_phases': 'assess',
        'learning_modules': 'digital-assets',
    },
    'Sui': {
        'pqc_support': 'No (agile-ready)',
        'pqc_capability_description': 'Uses Ed25519 and secp256k1. Architecturally designed for cryptographic agility with seed-based key structure. Inherently more prepared for PQ transitions than account-based chains. No formal PQC roadmap published.',
        'license_type': 'Open Source',
        'license': 'Apache-2.0',
        'pqc_migration_priority': 'Medium',
        'primary_platforms': 'Linux',
        'target_industries': 'Cryptocurrency DeFi Web3',
        'authoritative_source': 'https://blog.sui.io/post-quantum-computing-cryptography-security/',
        'repository_url': 'https://github.com/MystenLabs/sui',
        'product_brief': 'Move-based blockchain with crypto-agile architecture. Seed-based key structure enables faster PQC migration.',
        'fips_validated': 'No',
        'infrastructure_layer': 'Application',
        'migration_phases': 'assess',
        'learning_modules': 'digital-assets',
    },
}


def generate_rows():
    """Generate CSV rows for all platforms."""
    rows = []

    # CSC-057: Digital Asset Custody
    for name, data in CUSTODY_OVERRIDES.items():
        row = {
            'software_name': name,
            'category_id': 'CSC-057',
            'category_name': 'Digital Asset Custody',
            'source_type': 'Trusted Vendor',
            'verification_status': 'Verified',
            'last_verified_date': TODAY_ISO,
        }
        row.update(data)
        rows.append(row)

    # CSC-058: Blockchain & DLT Protocols
    for name, data in BLOCKCHAIN_OVERRIDES.items():
        row = {
            'software_name': name,
            'category_id': 'CSC-058',
            'category_name': 'Blockchain & DLT Protocols',
            'source_type': 'Trusted Vendor',
            'verification_status': 'Verified',
            'last_verified_date': TODAY_ISO,
        }
        row.update(data)
        rows.append(row)

    return rows


def main():
    rows = generate_rows()

    # Find latest migrate CSV
    pattern = 'quantum_safe_cryptographic_software_reference_*.csv'
    csv_files = sorted(DATA_DIR.glob(pattern))
    if not csv_files:
        print('ERROR: No migrate CSV found')
        sys.exit(1)

    latest_csv = csv_files[-1]
    print(f'Latest CSV: {latest_csv.name}')

    # Read existing rows
    with open(latest_csv, 'r', encoding='utf-8', newline='') as f:
        reader = csv.DictReader(f)
        existing_rows = list(reader)
    print(f'Existing rows: {len(existing_rows)}')

    # Update existing CSC-035 entries → CSC-058
    updated_count = 0
    for row in existing_rows:
        if row.get('category_id') == 'CSC-035':
            row['category_id'] = 'CSC-058'
            row['category_name'] = 'Blockchain & DLT Protocols'
            updated_count += 1
    print(f'Migrated CSC-035 → CSC-058: {updated_count} rows')

    # Check for duplicates
    existing_names = {r['software_name'] for r in existing_rows}
    new_rows = [r for r in rows if r['software_name'] not in existing_names]
    skipped = len(rows) - len(new_rows)
    if skipped:
        print(f'Skipped {skipped} duplicates')

    # Combine
    all_rows = existing_rows + new_rows
    print(f'New rows: {len(new_rows)}')
    print(f'Total rows: {len(all_rows)}')

    # Write new CSV
    output_name = f'quantum_safe_cryptographic_software_reference_{TODAY}.csv'
    output_path = DATA_DIR / output_name
    if output_path.exists():
        # Same day — use revision suffix
        rev = 1
        while True:
            output_name = f'quantum_safe_cryptographic_software_reference_{TODAY}_r{rev}.csv'
            output_path = DATA_DIR / output_name
            if not output_path.exists():
                break
            rev += 1

    with open(output_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=COLUMNS, lineterminator='\n')
        writer.writeheader()
        for row in all_rows:
            # Ensure all columns exist
            clean_row = {}
            for col in COLUMNS:
                val = row.get(col, '')
                if val is None:
                    val = ''
                clean_row[col] = val
            writer.writerow(clean_row)

    print(f'\nOutput: {output_path}')
    print(f'  Custody (CSC-057): {sum(1 for r in all_rows if r.get("category_id") == "CSC-057")}')
    print(f'  Blockchain (CSC-058): {sum(1 for r in all_rows if r.get("category_id") == "CSC-058")}')


if __name__ == '__main__':
    main()
