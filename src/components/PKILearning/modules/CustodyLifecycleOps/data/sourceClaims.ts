// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Primary-source claims for Module A2 (CustodyLifecycleOps, LM-084).
 * Every claim binds strictly ONE Library reference_id (`sourceId`), declared in content.ts.
 * Binance 29 October 2026 containment mechanics are imported dynamically from
 * `@/data/canonicalBinanceIncident` so custody modules share one canonical record.
 */
import {
  BINANCE_INCIDENT_CONTAINMENT,
  BINANCE_INCIDENT_SOURCE_IDS,
} from '@/data/canonicalBinanceIncident'

export interface SourceClaim {
  id: string
  text: string
  /** Library reference_id of the single document this claim rests on */
  sourceId: string
  /** Document edition or publication date as read */
  edition: string
  /** Section, heading, or page locator within the document */
  locator: string
}

export const SOURCE_CLAIMS = {
  'DA-13.4': {
    id: 'DA-13.4',
    text: 'NISTIR 8214 surveys threshold cryptographic schemes and notes that distributing cryptographic operations across multiple devices or parties introduces new protocol complexity and can increase the attack surface unless implementation, communication, and validation challenges are addressed.',
    sourceId: 'NIST-IR-8214',
    edition: 'NISTIR 8214 (March 2019)',
    locator: '§1 Introduction & §4 Challenges in Threshold Cryptography',
  },
  'DA-16.1a': {
    id: 'DA-16.1a',
    text: 'Bitcoin defines coin ownership as a chain of digital signatures verified against public keys in unspent transaction outputs (UTXOs); the protocol defines no on-chain certificate revocation list for an ordinary UTXO spending key.',
    sourceId: 'Bitcoin-Whitepaper',
    edition: 'Bitcoin Whitepaper (2008-10-31)',
    locator: '§2 Transactions',
  },
  'DA-16.1b': {
    id: 'DA-16.1b',
    text: 'In the Ethereum Yellow Paper, an Externally Owned Account (EOA) address is derived directly from the Keccak-256 hash of its secp256k1 public key, so rotating an EOA key means migrating assets to a new address rather than revoking the old key.',
    sourceId: 'Ethereum-Yellow-Paper',
    edition: 'Ethereum Yellow Paper (Shanghai efc5f9a)',
    locator: '§4.1 World State & §4.2 The Transaction',
  },
  'DA-16.2': {
    id: 'DA-16.2',
    text: 'Safe Smart Account’s OwnerManager.sol manages a linked list of owner addresses and an m-of-n threshold, permitting authorized calls (addOwnerWithThreshold, removeOwner, swapOwner, changeThreshold) to rotate signers on-chain without moving funds.',
    sourceId: 'Safe-Smart-Account-OwnerManager-sol-Contract-Source',
    edition: 'Safe Smart Account OwnerManager.sol Source',
    locator: 'contracts/base/OwnerManager.sol',
  },
  'DA-16.3a': {
    id: 'DA-16.3a',
    text: 'Herzberg et al. (CRYPTO 1995) introduced proactive secret sharing (PSS) so share holders periodically refresh shares of the same secret without changing the secret itself, defeating a mobile adversary who compromises fewer than t shares per epoch.',
    sourceId: 'Proactive-Secret-Sharing-Or-How-to-Cope-With-Perpetual-Leaka',
    edition: 'Herzberg et al., CRYPTO 1995 (LNCS 963)',
    locator: '§1 Introduction & §3 Share Renewal',
  },
  'DA-16.3b': {
    id: 'DA-16.3b',
    text: 'CGGMP21 (IACR ePrint 2021/060) specifies a UC-secure proactive threshold ECDSA protocol with periodic key-share refresh and identifiable aborts so honest parties can detect and attribute protocol-blocking faults.',
    sourceId: 'IACR-ePrint-2021-060-CGGMP21',
    edition: 'IACR ePrint 2021/060 (CGGMP21, updated 2024-10-21)',
    locator: '§1 Introduction & Key-Refresh / Identifiable Abort',
  },
  'DA-16.4': {
    id: 'DA-16.4',
    text: 'Proactive refresh security in threshold schemes such as CGGMP21 relies on honest parties erasing prior-epoch share material once the new epoch is established; retained old-epoch shares can still reconstruct or sign if a threshold of old shares is combined.',
    sourceId: 'IACR-ePrint-2021-060-CGGMP21',
    edition: 'IACR ePrint 2021/060 (CGGMP21)',
    locator: 'Proactive Security Model & Epoch Erasure',
  },
  'DA-16.5a': {
    id: 'DA-16.5a',
    text: 'RFC 5280 defines X.509 v3 certificate path validation and Certificate Revocation Lists (CRLs) for revoking control-plane certificates such as TLS/mTLS and operator credentials.',
    sourceId: 'RFC 5280',
    edition: 'IETF RFC 5280 (May 2008)',
    locator: '§5 CRL and CRL Extensions Profile',
  },
  'DA-16.5b': {
    id: 'DA-16.5b',
    text: 'RFC 6960 specifies the Online Certificate Status Protocol (OCSP) for querying the current revocation status of an X.509 certificate (certificate status, not on-chain key status).',
    sourceId: 'RFC-6960',
    edition: 'IETF RFC 6960 (June 2013)',
    locator: '§1 Introduction & §2 Protocol Overview',
  },
  'DA-16.6a': {
    id: 'DA-16.6a',
    text: 'NIST SP 800-57 Part 1 Rev. 5 (final) defines key-lifecycle states, cryptoperiod selection factors, and guidance for key rotation, backup, archival, and destruction.',
    sourceId: 'NIST-SP-800-57-Pt1-R5',
    edition: 'NIST SP 800-57 Part 1 Rev. 5 (Final, May 2020)',
    locator: '§5.3.6 Cryptoperiods & §7 Key Management Lifecycle',
  },
  'DA-16.6b': {
    id: 'DA-16.6b',
    text: 'NIST SP 800-57 Part 1 Rev. 6 (Initial Public Draft, December 2025 — draft, not final) updates key-management guidance to add FIPS 203/204/205 post-quantum algorithm categories and transition considerations.',
    sourceId: 'NIST-SP-800-57-Pt1-R6',
    edition: 'NIST SP 800-57 Part 1 Rev. 6 (Draft, 2025-12-05)',
    locator: '§5.6 Security Strengths & PQC Key Management',
  },
  'DA-16.8a': {
    id: 'DA-16.8a',
    text: 'EIP-2612 extends ERC-20 with permit() so a signed EIP-712 message sets a token allowance off-chain; once submitted, the allowance remains active on-chain until spent or explicitly revoked.',
    sourceId: 'EIP-2612-Permit-Extension-for-EIP-20-Signed-Approvals',
    edition: 'Ethereum EIP-2612 (Final, 2020-04-13)',
    locator: 'Specification -> permit()',
  },
  'DA-16.8b': {
    id: 'DA-16.8b',
    text: 'EIP-7702 writes a persistent delegation indicator (0xef0100 || address) into an EOA’s account code via a type-4 transaction; clearing the delegation requires submitting a new authorization pointing to the zero address.',
    sourceId: 'Ethereum-EIP7702',
    edition: 'Ethereum EIP-7702 (Final)',
    locator: 'Specification -> Delegation Designation',
  },
  'DA-16.8c': {
    id: 'DA-16.8c',
    text: `In the 29 October 2026 Binance incident report, ${BINANCE_INCIDENT_CONTAINMENT.keyFinding} (${BINANCE_INCIDENT_CONTAINMENT.onChainRevocation.procedureSummary}).`,
    sourceId: BINANCE_INCIDENT_SOURCE_IDS.binanceInitialReport,
    edition: 'Binance Security Incident Update & Initial Findings (2026-11-03)',
    locator: 'EIP-7702 Exploitation & On-Chain Revocation',
  },
  'DA-17.9': {
    id: 'DA-17.9',
    text: 'ERC-7730 (Draft) defines a versioned JSON schema for clear-signing descriptors; registry curation, distribution, descriptor expiry, and revocation are outside ERC-7730’s scope and left to wallet registry governance.',
    sourceId: 'ERC-7730-Structured-Data-Clear-Signing-Format',
    edition: 'Ethereum ERC-7730 (Draft, 2024-02-07)',
    locator: 'Specification & Security Considerations',
  },
  'DA-13.7': {
    id: 'DA-13.7',
    text: 'ERC-8176 (Draft) defines Ethereum Attestation Service (EAS) attestations for ERC-7730 descriptors, supplying explicit attestation revocation and expirationTime fields.',
    sourceId: 'ERC-8176-Descriptor-Attestations-for-ERC-7730',
    edition: 'Ethereum ERC-8176 (Draft, 2026-02-26)',
    locator: 'Specification -> Attestation Schema & Expiration/Revocation',
  },
  'DA-17.1a': {
    id: 'DA-17.1a',
    text: 'BIP-68 repurposes transaction input sequence numbers for consensus-enforced relative lock-times counted from the confirmation of the output being spent, capped at 65,535 blocks or 65,535 × 512 seconds (approximately 388 days).',
    sourceId: 'BIP-68',
    edition: 'Bitcoin BIP-68 (Final, 2015-05-28)',
    locator: 'Specification -> Relative Lock-Time Encoding',
  },
  'DA-17.1b': {
    id: 'DA-17.1b',
    text: 'BIP-112 introduces OP_CHECKSEQUENCEVERIFY (CSV) so Bitcoin scripts can enforce BIP-68 relative timelocks on-chain inside spending conditions.',
    sourceId: 'BIP-112',
    edition: 'Bitcoin BIP-112 (Final, 2015-08-10)',
    locator: 'Specification -> OP_CHECKSEQUENCEVERIFY',
  },
  'DA-17.1c': {
    id: 'DA-17.1c',
    text: 'BIP-65 introduces OP_CHECKLOCKTIMEVERIFY (CLTV) for absolute block-height or Unix-timestamp timelocks, enabling multi-year recovery or inheritance delays beyond BIP-68’s ~388-day relative ceiling.',
    sourceId: 'BIP-65',
    edition: 'Bitcoin BIP-65 (Final, 2014-10-01)',
    locator: 'Specification -> OP_CHECKLOCKTIMEVERIFY',
  },
  'DA-17.2': {
    id: 'DA-17.2',
    text: 'BIP-379 specifies Miniscript for writing composable, analyzable Bitcoin spending policies (such as 2-of-3 now or recovery key after a timelock), while providing no monitoring, cancellation, fee-bumping, or inheritance protocol.',
    sourceId: 'BIP-379',
    edition: 'Bitcoin BIP-379 (2023-10-10)',
    locator: 'Abstract & Specification',
  },
  'DA-17.3a': {
    id: 'DA-17.3a',
    text: 'Safe{RecoveryHub} documents smart-account recovery modules that let designated recoverers initiate an owner-replacement transaction subject to a review delay window during which current owners can cancel.',
    sourceId: 'Account-recovery-with-Safe-RecoveryHub-Safe-Knowledge-Base',
    edition: 'Safe Knowledge Base — Safe{RecoveryHub}',
    locator: 'Recovery Delay & Cancellation Flow',
  },
  'DA-17.3b': {
    id: 'DA-17.3b',
    text: 'ERC-4337 decouples transaction validation from ECDSA EOAs through smart-contract accounts, enabling programmable guardian recovery and validation-key replacement as an account-design property rather than a protocol default.',
    sourceId: 'Ethereum-EIP4337-AA',
    edition: 'Ethereum ERC-4337 (2021-09-29)',
    locator: 'Abstract & Account Validation',
  },
  'DA-17.5': {
    id: 'DA-17.5',
    text: 'Fireblocks’ Recovery Utility documentation (vendor pattern) describes client-held Key Recovery Kits encrypted to customer recovery keys so customers can reconstruct assets independently if the custody platform is unavailable — raising the operational question of who can run the kit and whether recovery rebuilds the full key in one place.',
    sourceId: 'Fireblocks-Recovery-Utility-Key-Recovery-Kit-Disaster-Recove',
    edition: 'Fireblocks Recovery Utility Documentation (Vendor Pattern)',
    locator: 'Key Recovery Kit & Disaster Recovery',
  },
  'DA-17.6': {
    id: 'DA-17.6',
    text: 'Thales Luna Backup HSM 7 documentation (vendor pattern) illustrates M-of-N multifactor quorum-authenticated HSM backup and restore to a second HSM within the same cloning domain without exporting plaintext key material to host RAM.',
    sourceId: 'Luna-Backup-HSM-7-Connected-to-Luna-HSM-Client-Using-Direct',
    edition: 'Thales Luna Backup HSM 7 Documentation (Vendor Pattern)',
    locator: 'Direct Multifactor Quorum Authentication Backup',
  },
  'DA-17.8': {
    id: 'DA-17.8',
    text: 'SLIP-0039 specifies Shamir’s Secret-Sharing for Mnemonic Codes, splitting a master secret into M-of-N word-list shares (with optional group thresholds) as a classical alternative to single-copy BIP-39 seed backups.',
    sourceId: 'SLIP-0039',
    edition: 'SatoshiLabs SLIP-0039 (2017-12-18)',
    locator: 'Abstract & Specification',
  },
  'DA-21.1': {
    id: 'DA-21.1',
    text: 'The ICANN Root Zone KSK Operator DNSSEC Practice Statement (8th Edition) enumerates separated trusted roles for HSM smart-card and safe ceremonies: System Administrators, Crypto Officers, Recovery Key Share Holders, Safe Security Controllers, Internal Witnesses, and Ceremony Administrators.',
    sourceId: 'ICANN-Root-Zone-KSK-DPS-8th-Edition',
    edition: 'ICANN Root Zone KSK DPS 8th Edition (2025-04-14)',
    locator: '§4.2.2 Trusted Roles',
  },
  'DA-21.2': {
    id: 'DA-21.2',
    text: 'CA/Browser Forum TLS Baseline Requirements v2.2.9 §6.1.1.1 requires for root CAs and externally operated subordinate CAs a key-generation script, a Qualified Auditor witness OR a video recording of the entire generation ceremony, and a Qualified Auditor report (SHALL; SHOULD for internally operated subordinate CAs).',
    sourceId: 'CABF-TLS-BR-v2-2-9',
    edition: 'CA/Browser Forum TLS Baseline Requirements v2.2.9',
    locator: '§6.1.1.1 CA Key Pair Generation',
  },
  'DA-21.3': {
    id: 'DA-21.3',
    text: 'NIST SP 800-57 Part 2 Rev. 1 defines split knowledge and dual control as organizational safeguards so no single person can generate, copy, or take away a usable cryptographic key during sensitive lifecycle procedures.',
    sourceId: 'NIST-SP-800-57-Pt2-R1',
    edition: 'NIST SP 800-57 Part 2 Rev. 1 (May 2019)',
    locator: '§2.2 Key Management Policies & Split Knowledge / Dual Control',
  },
  'DA-21.3b': {
    id: 'DA-21.3b',
    text: 'NIST SP 800-88 Rev. 2 (September 2025) defines media sanitization categories — Clear, Purge (including cryptographic erase), and Destroy — together with verification and documentation of the sanitization outcome.',
    sourceId: 'NIST SP 800-88',
    edition: 'NIST SP 800-88 Rev. 2 (September 2025)',
    locator: '§2.5 Sanitization Methods & §4 Verification and Validation',
  },
  'DA-21.4': {
    id: 'DA-21.4',
    text: 'IANA’s public Root KSK Ceremonies archive publishes executed ceremony scripts, signed minutes, witness attestations, file hashes, and video recordings as a transparent public reference for ceremony evidence.',
    sourceId: 'Root-KSK-Ceremonies',
    edition: 'IANA Root KSK Ceremonies Archive',
    locator: 'Published Ceremony Scripts & Evidence Artifacts',
  },
  'DA-21.5': {
    id: 'DA-21.5',
    text: 'CryptoCurrency Security Standard (CCSS) v9.0 covers Key/Seed Generation (1.01) and Wallet Creation (1.02) and requires independently witnessed key ceremonies at Level 3.',
    sourceId: 'CCSS-v9-0',
    edition: 'CCSS v9.0 (C4, 2024-12-10)',
    locator: 'Aspect 1: Key/Seed Generation (1.01) & Wallet Creation (1.02)',
  },
  'DA-21.9': {
    id: 'DA-21.9',
    text: 'Zero-knowledge trusted-setup ceremonies (such as the Ethereum KZG Ceremony) are a distinct ceremony class whose sole security goal is destroying every participant’s secret ("toxic waste") rather than preserving a usable custody key.',
    sourceId: 'Ethereum-KZG-Ceremony-Specifications-and-Documentation',
    edition: 'Ethereum KZG Ceremony Specifications',
    locator: 'Overview & Security Model (1-of-N Honesty / Secret Destruction)',
  },
  'DA-22.1': {
    id: 'DA-22.1',
    text: 'Azure Cloud HSM’s audit-log tutorial (one vendor product example, not general HSM coverage) logs login, user, policy, wrapping/export, backup, and secure-application operations; each HSM product’s event scope and delivery latency must be checked separately.',
    sourceId: 'Tutorial-Configure-and-Query-HSM-Operation-Audit-Logs-for-Az',
    edition: 'Azure Cloud HSM Audit Log Tutorial (2026-10-14, Vendor Pattern)',
    locator: 'Logged HSM Operation Categories',
  },
  'DA-22.2': {
    id: 'DA-22.2',
    text: 'NIST Cybersecurity Framework (CSF) 2.0 defines the Detect (DE: Continuous Monitoring, Adverse Event Analysis) and Respond (RS: Incident Management, Analysis, Mitigation) functions as a standard vocabulary for custody alerting and playbooks.',
    sourceId: 'NIST-CSF-2.0',
    edition: 'NIST CSF 2.0 (CSWP 29, 2024-02-26)',
    locator: 'Detect (DE) & Respond (RS) Functions',
  },
  'DA-22.3a': {
    id: 'DA-22.3a',
    text: 'Safe’s ModuleManager.sol emits EnabledModule, DisabledModule, and ChangedModuleGuard events on-chain so monitors can immediately alert on smart-account module authority changes.',
    sourceId: 'Safe-Smart-Account-ModuleManager-sol-Contract-Source',
    edition: 'Safe Smart Account ModuleManager.sol Source',
    locator: 'contracts/base/ModuleManager.sol (Events)',
  },
  'DA-22.3b': {
    id: 'DA-22.3b',
    text: 'Safe’s GuardManager.sol emits ChangedGuard events whenever a transaction guard hook is attached, replaced, or cleared, providing an on-chain governance-change signal.',
    sourceId: 'Safe-Smart-Account-GuardManager-sol-Contract-Source',
    edition: 'Safe Smart Account GuardManager.sol Source',
    locator: 'contracts/base/GuardManager.sol (ChangedGuard Event)',
  },
  'DA-22.4a': {
    id: 'DA-22.4a',
    text: 'The ERC-20 standard requires emitting an Approval event on successful allowance updates (including after an EIP-2612 permit is submitted on-chain), whereas EIP-7702 delegations emit no dedicated event log and require inspecting type-4 transaction authorization lists or account code.',
    sourceId: 'ERC-20-Token-Standard',
    edition: 'Ethereum ERC-20 (Final, 2015-11-19)',
    locator: 'Events -> Approval',
  },
  'DA-22.5': {
    id: 'DA-22.5',
    text: 'SEAL 911 (Security Alliance — labeled as one industry emergency-response resource) operates a 24/7 volunteer incident-response channel for coordinating war rooms and issuer/exchange outreach during active crypto exploits.',
    sourceId: 'SEAL-911-Security-Alliance',
    edition: 'Security Alliance SEAL 911 (Industry Resource, 2026-11)',
    locator: 'Incident Response & War-Room Coordination',
  },
  'DA-22.6': {
    id: 'DA-22.6',
    text: 'Tenderly Web3 Actions (labeled as one active vendor pattern) illustrates programmable serverless hooks triggered by on-chain contract events or webhooks to drive custody alerts or automated circuit-breaker pauses.',
    sourceId: 'Intro-to-Web3-Actions-Tenderly',
    edition: 'Tenderly Web3 Actions Documentation (Vendor Pattern)',
    locator: 'Triggers & Automated Response Hooks',
  },
  'DA-23.1a': {
    id: 'DA-23.1a',
    text: 'OASIS PKCS#11 v3.2 separates Security Officer (CKU_SO) and normal user (CKU_USER) sessions and defines CKA_ALWAYS_AUTHENTICATE so sensitive private keys require a C_Login with CKU_CONTEXT_SPECIFIC immediately after C_SignInit.',
    sourceId: 'PKCS11-V32-OS-OASIS',
    edition: 'OASIS PKCS#11 v3.2 (OASIS Standard, 2026-06-03)',
    locator: '§4.9 Private Key Objects (CKA_ALWAYS_AUTHENTICATE) & C_Login',
  },
  'DA-23.1b': {
    id: 'DA-23.1b',
    text: 'The PKCS#11 v3.2 Usage Guide specifies the session-state and user-login access matrix: the SO cannot access private user objects, but on many tokens the SO can initialize or reset the user PIN — an authority assumption Rule G1 must account for.',
    sourceId: 'PKCS-11-Cryptographic-Token-Interface-Usage-Guide-Version-3',
    edition: 'OASIS PKCS#11 v3.2 Usage Guide (2025-04-15)',
    locator: 'Session States & User/SO Access Matrix',
  },
  'DA-23.2': {
    id: 'DA-23.2',
    text: 'NIST SP 800-63B-4 makes authenticator assurance level (AAL) selection contextual: it recognizes synced passkeys as phishing-resistant at AAL2 and requires a non-exportable, hardware-bound cryptographic authenticator at AAL3.',
    sourceId: 'NIST-SP-800-63B-4',
    edition: 'NIST SP 800-63B-4 (July 2025)',
    locator: '§3.2 AAL2 & §3.3 AAL3 Authenticator Requirements',
  },
  'DA-23.3a': {
    id: 'DA-23.3a',
    text: 'NIST SP 800-207 (Zero Trust Architecture) frames access control around authenticating and authorizing every request independently regardless of network location.',
    sourceId: 'NIST SP 800-207',
    edition: 'NIST SP 800-207 (August 2020)',
    locator: '§2.1 Tenets of Zero Trust',
  },
  'DA-23.3b': {
    id: 'DA-23.3b',
    text: 'NIST SP 800-207A extends zero-trust access control to cloud-native multi-location workloads using per-service workload identities (such as mTLS) and granular application-level policy enforcement.',
    sourceId: 'NIST-SP-800-207A-A-Zero-Trust-Architecture-Model-for-Access',
    edition: 'NIST SP 800-207A (September 2023)',
    locator: '§3 Workload Identity & Policy Enforcement',
  },
  'DA-23.4': {
    id: 'DA-23.4',
    text: 'NIST SP 800-53 Rev. 5 defines AC-5 (Separation of Duties) and AC-6 (Least Privilege) as control vocabulary for separating payment initiation, approval, policy administration, key custody, and auditing.',
    sourceId: 'NIST SP 800-53',
    edition: 'NIST SP 800-53 Rev. 5',
    locator: 'AC-5 Separation of Duties & AC-6 Least Privilege',
  },
  'DA-23.5': {
    id: 'DA-23.5',
    text: 'Thales Multifactor Quorum Authentication documentation (vendor pattern) illustrates M-of-N smart-card administrative authentication for HSM initialization, backup, and role changes — a vendor capability, not a PKCS#11 standard term.',
    sourceId: 'Multifactor-Quorum-Authentication',
    edition: 'Thales Luna Multifactor Quorum Authentication Docs (Vendor Pattern)',
    locator: 'M-of-N Administrative Quorum Overview',
  },
  'DA-24.1': {
    id: 'DA-24.1',
    text: 'NIST SP 800-57 Part 1 Rev. 5 requires that backed-up and archived keys receive at least the same level of cryptographic and physical protection as operational keys, and that key-encrypting keys remain separated from the backed-up keys they protect.',
    sourceId: 'NIST-SP-800-57-Pt1-R5',
    edition: 'NIST SP 800-57 Part 1 Rev. 5 (Final, May 2020)',
    locator: '§6.2.2 Protection of Keys in Storage & §7.3 Post-Operational Phase',
  },
  'DA-24.2': {
    id: 'DA-24.2',
    text: 'NIST SP 800-34 Rev. 1 defines contingency-planning vocabulary including Recovery Time Objective (RTO), Recovery Point Objective (RPO), alternate-site strategies, and scheduled recovery testing.',
    sourceId: 'NIST-SP-800-34-R1',
    edition: 'NIST SP 800-34 Rev. 1 (May 2010)',
    locator: '§2.2 Business Impact Analysis (RTO/RPO) & §3.4 Testing',
  },
  'DA-24.3': {
    id: 'DA-24.3',
    text: 'ISO 22301:2019 (paid standard; catalogue identity reference) establishes the business continuity management system (BCMS) vocabulary for operational resilience and disaster recovery governance.',
    sourceId: 'ISO-22301-2019',
    edition: 'ISO 22301:2019 (Catalogue Reference)',
    locator: 'Scope & BCMS Structure',
  },
  'DA-24.5': {
    id: 'DA-24.5',
    text: 'AWS CloudHSM documentation (vendor pattern) describes copying encrypted cluster backups across AWS Regions to survive a single-region outage while preserving cluster-level encryption boundaries.',
    sourceId: 'Copying-AWS-CloudHSM-cluster-backups-across-AWS-Regions-AWS',
    edition: 'AWS CloudHSM User Guide (Vendor Pattern)',
    locator: 'Cross-Region Backup Copy',
  },
  'DA-25.1': {
    id: 'DA-25.1',
    text: 'In OASIS PKCS#11 v3.2, C_DestroyObject destroys a single token object and returns CKR_ACTION_PROHIBITED if CKA_DESTROYABLE is CK_FALSE; it makes no guarantees about prior copies, clones, backups, or physical media.',
    sourceId: 'PKCS11-V32-OS-OASIS',
    edition: 'OASIS PKCS#11 v3.2 (OASIS Standard, 2026-06-03)',
    locator: '§5.7.3 C_DestroyObject & CKA_DESTROYABLE',
  },
  'DA-25.2a': {
    id: 'DA-25.2a',
    text: 'NIST FIPS 140-3 Implementation Guidance enforces SSP (Sensitive Security Parameter) zeroisation requirements derived from ISO/IEC 19790:2012 before a cryptographic module is decommissioned or returned.',
    sourceId: 'NIST-FIPS140-3-IG-PQC',
    edition: 'NIST FIPS 140-3 Implementation Guidance (2026-08-19)',
    locator: 'Zeroization & SSP Lifecycle Guidance',
  },
  'DA-25.2b': {
    id: 'DA-25.2b',
    text: 'ISO/IEC 19790:2012 (paid standard; incorporated by reference into FIPS 140-3) specifies cryptographic module security levels and mandatory zeroisation of plaintext sensitive security parameters.',
    sourceId: 'ISO-IEC-19790-2012',
    edition: 'ISO/IEC 19790:2012 (Catalogue Reference)',
    locator: 'Incorporated by FIPS 140-3 — SSP Zeroisation',
  },
  'DA-25.3b': {
    id: 'DA-25.3b',
    text: 'In OASIS KMIP v2.1, an Active key cannot be destroyed directly; it must be Revoked or Deactivated first (revoking for compromise transitions it to Compromised), after which Pre-Active, Deactivated, or Compromised keys may be Destroyed.',
    sourceId: 'KMIP-V2-1-OASIS',
    edition: 'OASIS KMIP Specification v2.1 (2021-06-20)',
    locator: '§4.14 Destroy & §3.6 State Transition Model',
  },
  'DA-25.5': {
    id: 'DA-25.5',
    text: 'Entrust nShield Decommission and Disposal documentation (vendor pattern) details end-of-life HSM zeroisation, tamper-battery/mechanism discharge, and documented physical disposal so un-zeroised hardware is never resold or returned.',
    sourceId: 'Decommission-and-Disposal-nShield-Docs',
    edition: 'Entrust nShield Decommission & Disposal Docs (Vendor Pattern)',
    locator: 'HSM Zeroisation & End-of-Life Disposal',
  },
} as const satisfies Record<string, SourceClaim>

export type SourceClaimId = keyof typeof SOURCE_CLAIMS

export function claimText(id: SourceClaimId): string {
  // eslint-disable-next-line security/detect-object-injection
  return SOURCE_CLAIMS[id].text
}
