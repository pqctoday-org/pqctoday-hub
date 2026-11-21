// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Structured content for the CustodyLifecycleOps module (LM-084).
 * lastReviewed is intentionally omitted until a formal content:review entry is recorded.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'
import { BINANCE_INCIDENT_SOURCE_IDS } from '@/data/canonicalBinanceIncident'

export const content: ModuleContent = {
  moduleId: 'custody-lifecycle-ops',
  version: '1.0.0',
  lastEdited: '2026-11-21',

  standards: [
    getStandard('NIST-IR-8214'),
    getStandard('Bitcoin-Whitepaper'),
    getStandard('Ethereum-Yellow-Paper'),
    getStandard('Safe-Smart-Account-OwnerManager-sol-Contract-Source'),
    getStandard('Safe-Smart-Account-ModuleManager-sol-Contract-Source'),
    getStandard('Safe-Smart-Account-GuardManager-sol-Contract-Source'),
    getStandard('Proactive-Secret-Sharing-Or-How-to-Cope-With-Perpetual-Leaka'),
    getStandard('IACR-ePrint-2021-060-CGGMP21'),
    getStandard('RFC 5280'),
    getStandard('RFC-6960'),
    getStandard('NIST-SP-800-57-Pt1-R5'),
    getStandard('NIST-SP-800-57-Pt1-R6'),
    getStandard('NIST-SP-800-57-Pt2-R1'),
    getStandard('EIP-2612-Permit-Extension-for-EIP-20-Signed-Approvals'),
    getStandard('Ethereum-EIP7702'),
    getStandard('ERC-20-Token-Standard'),
    getStandard(BINANCE_INCIDENT_SOURCE_IDS.binanceInitialReport),
    getStandard('ERC-7730-Structured-Data-Clear-Signing-Format'),
    getStandard('ERC-8176-Descriptor-Attestations-for-ERC-7730'),
    getStandard('BIP-65'),
    getStandard('BIP-68'),
    getStandard('BIP-112'),
    getStandard('BIP-379'),
    getStandard('SLIP-0039'),
    getStandard('Ethereum-EIP4337-AA'),
    getStandard('Account-recovery-with-Safe-RecoveryHub-Safe-Knowledge-Base'),
    getStandard('Fireblocks-Recovery-Utility-Key-Recovery-Kit-Disaster-Recove'),
    getStandard('Luna-Backup-HSM-7-Connected-to-Luna-HSM-Client-Using-Direct'),
    getStandard('ICANN-Root-Zone-KSK-DPS-8th-Edition'),
    getStandard('CABF-TLS-BR-v2-2-9'),
    getStandard('NIST SP 800-88'),
    getStandard('Root-KSK-Ceremonies'),
    getStandard('CCSS-v9-0'),
    getStandard('Ethereum-KZG-Ceremony-Specifications-and-Documentation'),
    getStandard('Tutorial-Configure-and-Query-HSM-Operation-Audit-Logs-for-Az'),
    getStandard('NIST-CSF-2.0'),
    getStandard('SEAL-911-Security-Alliance'),
    getStandard('Intro-to-Web3-Actions-Tenderly'),
    getStandard('PKCS11-V32-OS-OASIS'),
    getStandard('PKCS-11-Cryptographic-Token-Interface-Usage-Guide-Version-3'),
    getStandard('NIST-SP-800-63B-4'),
    getStandard('NIST SP 800-207'),
    getStandard('NIST-SP-800-207A-A-Zero-Trust-Architecture-Model-for-Access'),
    getStandard('NIST SP 800-53'),
    getStandard('Multifactor-Quorum-Authentication'),
    getStandard('NIST-SP-800-34-R1'),
    getStandard('ISO-22301-2019'),
    getStandard('Copying-AWS-CloudHSM-cluster-backups-across-AWS-Regions-AWS'),
    getStandard('NIST-FIPS140-3-IG-PQC'),
    getStandard('ISO-IEC-19790-2012'),
    getStandard('KMIP-V2-1-OASIS'),
    getStandard('Decommission-and-Disposal-nShield-Docs'),
  ],

  algorithms: [
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('Ed25519'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-KEM-768'),
  ],

  deadlines: [],

  narratives: {
    overview:
      'Intermediate digital-asset custody operations module answering how custody keys are created, guarded, watched, recovered, and retired in daily operation. Building on Module A1 (Custody Key Threats & Controls), it covers threshold key lifecycles, why chain keys cannot be revoked like X.509 certificates, recovery and inheritance design, key ceremony procedures and evidence, custody monitoring and alerting, signing-path versus administration-path access control, operational backup and disaster recovery, and safe key destruction and decommissioning.',
    keyConcepts:
      'Ordinary Bitcoin UTXO and Ethereum EOA keys cannot be revoked — rotation requires sweeping funds to pre-planned destination keys, while ERC-20 allowances and EIP-7702 delegations must be revoked explicitly because off-chain withdrawal pauses do not invalidate on-chain authorizations. Proactive MPC share refresh defeats mobile adversaries but does not change the public key or protect a compromised key, and assumes erasure of old-epoch shares. Recovery paths, backups, and administrative paths are high-value attack surfaces governed by the same authority assumptions (Rule G1) as live signing. Chain keys must be swept, unlinked, and monitored through a retention window before destruction so late deposits are not permanently burned.',
    workshopSummary:
      'Seven decision workshops: (W9) Revoke or Rotate Matrix across 12 custody items; (W10) Recovery & Inheritance Planner across three holder profiles and five disruption events; (W12) Ceremony Script Review identifying eight planted defects while respecting CA/B Forum BR §6.1.1.1 rules; (W14) Custody Alert Triage over 12 replayed signing, HSM, governance, and on-chain events; (W15) Access Matrix Review flagging eight effective-permission conflicts; (W16) Disaster Recovery Drill evaluating restore order, RTO, and attacker-foothold risks across three outages; and (W17) Decommission Checklist ordering retirement steps for a hot wallet, HSM model, and departed approver share.',
    relatedStandards:
      'NIST IR 8214, NIST SP 800-57 Part 1 Rev. 5 (final) & Rev. 6 (draft) & Part 2 Rev. 1, NIST SP 800-88 Rev. 2, NIST SP 800-63B-4, NIST SP 800-207 / 800-207A, NIST SP 800-53 Rev. 5, NIST SP 800-34 Rev. 1, NIST CSF 2.0, NIST FIPS 140-3 IG & ISO/IEC 19790:2012, ISO 22301:2019, OASIS PKCS#11 v3.2 & Usage Guide, OASIS KMIP 2.1, IETF RFC 5280 & RFC 6960, CA/B Forum TLS BR v2.2.9, ICANN Root Zone KSK DPS 8th Edition, CCSS v9.0, BIP-65 / BIP-68 / BIP-112 / BIP-379, SLIP-0039, ERC-20, EIP-2612, ERC-4337, EIP-7702, ERC-7730, ERC-8176, and Safe.sol contracts.',
  },
}
