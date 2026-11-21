// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Structured content for the CustodyThreatsControls module (LM-083).
 * lastReviewed is intentionally omitted until a formal content:review entry is recorded.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'
import { BINANCE_INCIDENT_SOURCE_IDS } from '@/data/canonicalBinanceIncident'

export const content: ModuleContent = {
  moduleId: 'custody-threats-controls',
  version: '1.0.0',
  lastEdited: '2026-11-21',

  standards: [
    getStandard('IETF RFC 6979'),
    getStandard('Safe-Wallet-Safe-sol-multisig-signature-verification'),
    getStandard('Safe-Smart-Account-Safe-sol-Contract-Source'),
    getStandard('Ethereum-EIP7702'),
    getStandard('FBI-PSA-I-022625-PSA-North-Korea-Responsible-for-1-5-Billion'),
    getStandard('Bybit-Confirms-Security-Integrity-Amid-Safe-Wallet-Incident'),
    getStandard('Bybit-Heist-Case-Study-When-Billions-Vanish'),
    getStandard('NCC-Group-Technical-Analysis-Bybit-SafeWallet-UI-Manipulatio'),
    getStandard('February-28th-2025-Statement-by-the-Safe-Ecosystem-Foundatio'),
    getStandard('Incident-Recovery-Update-April-16-2026-Drift-Updates'),
    getStandard('Drift-Protocol-Hack-How-Privileged-Access-Led-to-a-285M-Loss'),
    getStandard(BINANCE_INCIDENT_SOURCE_IDS.binanceInitialReport),
    getStandard(BINANCE_INCIDENT_SOURCE_IDS.fbiTraderTraitorAlert),
    getStandard('Chainalysis-2026-Crypto-Crime-Report'),
    getStandard('CertiK-H1-2026-Physical-Coercion-and-Wrench-Attacks-Report'),
    getStandard('Blockchain-Address-Poisoning-Tsuchiya-et-al-arXiv-2501-16681'),
    getStandard('EIP-2612-Permit-Extension-for-EIP-20-Signed-Approvals'),
    getStandard('Uniswap-Permit2-Signature-Based-Token-Approval-Overview'),
    getStandard('PKCS11-V32-OS-OASIS'),
    getStandard('draft-ietf-rats-pkix-key-attestation-08'),
    getStandard('Verifying-HSM-Authenticity-or-Key-Attestation-Thales-Luna'),
    getStandard('Securosys-Smart-Key-Attributes-SKA-and-Transaction-Security'),
    getStandard('The-security-model-Ledger-Enterprise'),
    getStandard('Secure-enclaves-Turnkey'),
    getStandard('Using-cryptographic-attestation-with-AWS-KMS-AWS-Nitro-Encla'),
    getStandard('The-Security-Design-of-the-AWS-Nitro-System'),
    getStandard('Secure-Key-Release-with-Azure-Key-Vault-and-Azure-Confidenti'),
    getStandard('API-Co-signers-Architecture-Overview-Fireblocks-Developer-Do'),
    getStandard('RFC-9591-The-Flexible-Round-Optimized-Schnorr-Threshold-FROS'),
    getStandard('IBM-Offline-Signing-Orchestrator-OSO-Architecture-Documentat'),
    getStandard('ERC-7730-Structured-Data-Clear-Signing-Format'),
    getStandard('ERC-8176-Descriptor-Attestations-for-ERC-7730'),
    getStandard('Secure-Use-of-the-Agent-Payments-Protocol-AP2'),
    getStandard('Post-Quantum-Credential-Binding-for-x402-Agentic-Payment-Aut'),
    getStandard('Security-Coinbase-Developer-Documentation'),
    getStandard('Wallet-MCP-Coinbase-Developer-Documentation'),
    getStandard('HSM-signing-infrastructure-DFNS-documentation'),
    getStandard('Securing-Digital-Asset-Operations-with-Dfns-and-Thales-Solut'),
    getStandard('Securing-Digital-Asset-Keys-with-Thales-and-Fireblocks-Solut'),
    getStandard('Securosys-Protecting-the-Crypto-Stash-Part-III-Multisig-MPC'),
    getStandard('CodeSafe-v13-9-9-Developer-Guide-nShield-Docs'),
    getStandard('FM-Architecture'),
    getStandard('Is-MPC-truly-ready-for-digital-asset-custody-Ledger'),
    getStandard('Key-Management-Interoperability-Protocol-Specification-Versi'),
    getStandard('KMIP-V2-1-OASIS'),
    getStandard('NIST-FIPS140-3-IG-PQC'),
    getStandard('BitForge-Fireblocks-researchers-uncover-vulnerabilities-in-o'),
    getStandard('bnb-chain-tss-lib-Security-Advisory-GHSA-h24c-6p6p-m3vx-Pail'),
    getStandard('Practical-Key-Extraction-Attacks-in-Leading-MPC-Wallets-ePri'),
    getStandard('Foreshadow-Extracting-the-Keys-to-the-Intel-SGX-Kingdom-with'),
    getStandard('AEPIC-Leak-Architecturally-Leaking-Uninitialized-Data-from-t'),
    getStandard('BadRAM-Practical-Memory-Aliasing-Attacks-on-Trusted-Executio'),
    getStandard('Battering-RAM-Low-Cost-Interposer-Attacks-on-Confidential-Co'),
    getStandard('TEE-fail-Breaking-Hardware-Based-Confidential-Computing-Memo'),
    getStandard('Confidential-Computing-Consortium-A-Technical-Analysis-of-Co'),
    getStandard('NIST IR 8320E'),
    getStandard('Google-Cloud-Multi-Party-Compute-Custody-Architecture-with-C'),
  ],

  algorithms: [
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('Ed25519'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('FN-DSA-1024'),
  ],

  deadlines: [],

  narratives: {
    overview:
      'Intermediate digital-asset custody security module answering who can make a custody system sign and which control combinations stop unauthorized transfers today. It examines signing authority versus key possession, transaction exfiltration paths, a nine-row adversary model, AI agent spend authority, chronological case studies of the Bybit, Drift, and Binance incidents, technical limits of HSMs, MPC, and confidential computing enclaves, control combinations with explicit authority assumptions, and five hybrid MPC + HSM architectures.',
    keyConcepts:
      'Keys never leaving an HSM or MPC cluster does not prevent asset loss if an attacker tricks signers via front-end manipulation (Bybit), collects durable-nonce pre-approvals (Drift), abuses an internal signing service via EIP-7702 delegations (Binance), or submits off-chain permit authorizations. PKCS#11 v3.2 C_Sign signs whatever hash an authorized session submits and defines no transaction parser or MPC/threshold signing mechanism, whereas KMIP models Split Key objects. Control combinations hold only under explicit authority assumptions: which signer, guardian, recovery, and upgrade authorities an attacker must not control.',
    workshopSummary:
      'Five hands-on steps: (1) Blind vs Clear Signing in browser SoftHSMv3 using CKM_ECDSA on secp256k1, comparing blind signing, parse-only, and parse-plus-policy enforcement; (2) Quorum Approvals using three HSM ML-DSA-65 approvers gating one secp256k1 custody signer with tamper, expiry, and replay-nonce rejection; (3) Live 2-of-3 RFC 9591 FROST threshold signing in page JavaScript paired with HSM ML-DSA-65 party authentication, per-party policy refusal, and an explained conceptual diagram for in-HSM share execution; (4) Control Combination Builder evaluating HSM, MPC, enclave, trusted display, and time lock mixes across three account types; (5) Agent Wallet Scoping testing spend caps, allowlists, approval thresholds, credential TTLs, and key isolation against three agent mistake scenarios.',
    relatedStandards:
      'IETF RFC 6979, IETF RFC 9591 (FROST), OASIS PKCS#11 v3.2, OASIS KMIP 2.1 & 3.0 CSD02, NIST FIPS 140-3 Implementation Guidance, NIST IR 8320E (ipd), Confidential Computing Consortium v1.3, IETF RATS draft-ietf-rats-pkix-key-attestation-08, Ethereum EIP-2612, EIP-7702, ERC-7730, ERC-8176, Safe.sol, AP2 security guidance, and x402 post-quantum credential binding draft.',
  },
}
