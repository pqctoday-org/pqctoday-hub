// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Structured data tables for Module C (CustodyGovernance, LM-086):
 * - Six Custody Evaluation Questions (Q1-Q6) with Rule G1 authority checks
 * - Built-in custody design presets for Workshop W11 (standalone from Module A1 W4)
 * - 12 custody control rows mapped across 8 jurisdiction/baseline profiles
 * - Separate US Federal Context Band (SEC SAB 121/122, OCC Letters 1170/1184)
 * - Market-practice Insurer Asks & Auditor Tests columns (not mandates)
 * - Assurance regimes comparison (SOC 1/ISAE 3402, SOC 2, ISAE 3000 (Revised), CCSS, PoR)
 */
import type { AnalysisClaimId, SourceClaimId } from './sourceClaims'

export interface EvaluationQuestion {
  id: string
  number: string
  title: string
  question: string
  strongPattern: string
  acceptableAlternatives: string
  residualRisk: string
  g1Check: string
  analysisClaimId: AnalysisClaimId
  sourceClaimId?: SourceClaimId
  crossRef: string
}

export const EVALUATION_QUESTIONS: readonly EvaluationQuestion[] = [
  {
    id: 'q1-policy-location',
    number: 'Q1',
    title: 'Where is the policy checked?',
    question:
      'When a vendor claims "policy is enforced in hardware", does the signing boundary itself evaluate transaction rules, or does a host broker check policy before calling a policy-free signer?',
    strongPattern:
      'Policy rules (spend limits, allowlists, quorum thresholds) are evaluated inside the signing boundary (HSM firmware/enclave/co-signer) before producing a signature.',
    acceptableAlternatives:
      'Enough indispensable threshold or multisig signers independently enforce the policy, or an on-chain verifier contract enforces it.',
    residualRisk:
      'A host application or API broker sitting in front of a policy-free signer is bypassable if the host, container, or API credential is compromised.',
    g1Check:
      'Who can modify the policy-engine code, firmware, or configuration, and what quorum gates that change?',
    analysisClaimId: 'DA-20.1',
    crossRef: 'Module A1 §5 (Control combinations & signing boundaries)',
  },
  {
    id: 'q2-full-tx-or-hash',
    number: 'Q2',
    title: 'Does the signer see the full transaction or only a hash?',
    question:
      'Can the signing boundary decode the full transaction calldata and recipient, or does it blind-sign a 32-byte digest supplied by a browser or backend?',
    strongPattern:
      'The signing boundary parses the full raw transaction it signs, or verifies a decoded form cryptographically bound to the exact bytes being signed.',
    acceptableAlternatives:
      'Independent verifier devices decode the raw calldata locally before co-signing; clear-signing descriptors (such as ERC-7730) display human-readable fields on a trusted screen.',
    residualRisk:
      'Blind-signing a hash lets a compromised UI or frontend substitute a malicious delegatecall or approval while displaying benign details.',
    g1Check:
      'Who controls the transaction parser, ABI metadata, and clear-signing descriptor registry (ERC-7730 registry trust)?',
    analysisClaimId: 'DA-20.2',
    sourceClaimId: 'DA-20.2-erc7730',
    crossRef:
      'Module A1 §5 & W1 (Clear signing); Module B §5d (hardware-wallet PQ specialisation — optional further reading)',
  },
  {
    id: 'q3-policy-change-quorum',
    number: 'Q3',
    title: 'Who can change the policy, and is that change checked inside the boundary?',
    question:
      'If an attacker cannot bypass the spending policy directly, can they lower the quorum, add their own address to the allowlist, or swap a contract module?',
    strongPattern:
      'Policy changes require the same or a higher quorum than spending, enforced inside the signing boundary with a mandatory time delay and out-of-band governance alerts.',
    acceptableAlternatives:
      'On-chain timelocked governance with independent guardian veto for smart-account policy updates.',
    residualRisk:
      'A single admin console user, vendor support role, or unmonitored upgrade key can silently weaken rules before initiating a transfer.',
    g1Check:
      'Can a contract-upgrade key, smart-account module, vendor master key, or admin role bypass the policy-change quorum?',
    analysisClaimId: 'DA-20.3',
    crossRef: 'Module A2 §5h (Governance-change monitoring) & §5i (Separation of duties)',
  },
  {
    id: 'q4-attested-approvers',
    number: 'Q4',
    title: 'Are approvers’ keys in attested hardware with a trusted display?',
    question:
      'How does the signing boundary know an approval came from a genuine, unrevoked human approver who saw the real transaction?',
    strongPattern:
      'Approver keys live in attested hardware verified by the signing boundary or an independent verifier, with approvals bound to decoded transaction content and clean revocation.',
    acceptableAlternatives:
      'Independent hardware security keys plus out-of-band transaction verification on a separate device where full trusted-display hardware is not deployed.',
    residualRisk:
      'Device attestation alone proves neither display correctness nor that the signed approval matches the decoded content shown to the human.',
    g1Check:
      'Can a single operator, IT admin, or vendor enrol a new approver device or substitute attestation root certificates?',
    analysisClaimId: 'DA-20.4',
    crossRef:
      'Module A1 §5 (Approver devices); Module A2 §5e (Approver revocation) & §5i (Enrolment)',
  },
  {
    id: 'q5-state-replay-expiry',
    number: 'Q5',
    title: 'How are state, replay, and expiry enforced?',
    question:
      'What stops an attacker from replaying an old approval, rolling back a daily spend counter, or abusing a long-lived pre-signed transaction?',
    strongPattern:
      'Approvals carry fresh nonces and short expiries; replay state (monotonic counters, velocity limits) lives inside the signing boundary, in bound on-chain state, or in distributed consensus state. No long-lived pre-signed transactions.',
    acceptableAlternatives:
      'Authenticated external state anchored by monotonic hardware counters or on-chain nonces when signing hardware itself is stateless.',
    residualRisk:
      'A stateless HSM cannot hold durable monotonic counters without authenticated state, and host-stored counters or VM snapshots can be rolled back.',
    g1Check:
      'Who can reset replay counters, restore a VM snapshot to roll back rate limits, or extend approval expiry?',
    analysisClaimId: 'DA-20.5',
    crossRef:
      'Module A1 §5; Module A2 §5j (No rollback of counters/nonces); Module B §5d (optional further reading)',
  },
  {
    id: 'q6-recovery-rotation-timelocks',
    number: 'Q6',
    title: 'How do recovery, rotation, and time locks work?',
    question:
      'If operational keys are lost or rotated, does the recovery path become a weaker backdoor than day-to-day spending?',
    strongPattern:
      'Time locks and veto windows are enforced inside the signing boundary or on-chain; recovery has its own independently satisfiable trigger; key rotation never bypasses the operational quorum.',
    acceptableAlternatives:
      'Geographically distributed offline key-share recovery ceremonies with dual-custody physical vaults and independent witness logs.',
    residualRisk:
      'An opaque vendor recovery backdoor, unmonitored guardian quorum, or unauthenticated rotation procedure undermines every operational control.',
    g1Check:
      'Who holds recovery shares, guardian keys, and upgrade authority, and could they collude to bypass the operational quorum?',
    analysisClaimId: 'DA-20.6',
    crossRef: 'Module A2 §5e (Rotation), §5f (Recovery), §5j (Backup/DR) & §5k (Key destruction)',
  },
]

export type ControlId =
  | 'key-gen-storage'
  | 'multi-party-control'
  | 'client-segregation'
  | 'hot-cold-split'
  | 'access-control-mfa'
  | 'recovery-access'
  | 'backup-dr-bcp'
  | 'rotation-revocation'
  | 'key-destruction'
  | 'third-party-ict'
  | 'audit-logging-ceremonies'
  | 'incident-testing'

export interface ControlRow {
  id: ControlId
  label: string
  moduleLink: string
  shortScope: string
}

export const CONTROL_ROWS: readonly ControlRow[] = [
  {
    id: 'key-gen-storage',
    label: 'Secure key generation & storage',
    moduleLink: 'Module A1 §4–§5b',
    shortScope: 'Offline/HSM generation, certified environment, protected key boundary',
  },
  {
    id: 'multi-party-control',
    label: 'Multi-party control (M-of-N / quorum)',
    moduleLink: 'Module A1 §5 & Module C §6 (Q1–Q4)',
    shortScope: 'Dual control, split knowledge, quorum approval over decoded transactions',
  },
  {
    id: 'client-segregation',
    label: 'Segregation of client assets & keys',
    moduleLink: 'Module C §6b',
    shortScope: 'Legal and operational separation from custodian proprietary assets',
  },
  {
    id: 'hot-cold-split',
    label: 'Hot / warm / cold split & limits',
    moduleLink: 'Module A1 §5 & Module C §6b',
    shortScope: 'Offline cold-storage ratio expectations, hot-wallet caps & backing',
  },
  {
    id: 'access-control-mfa',
    label: 'Access control & MFA for key operations',
    moduleLink: 'Module A2 §5i',
    shortScope: 'Least-privilege access reviews, MFA, separation of duties',
  },
  {
    id: 'recovery-access',
    label: 'Recovery of access',
    moduleLink: 'Module A2 §5f & Module C §6 (Q6)',
    shortScope: 'Independently satisfiable recovery trigger without bypassing quorum',
  },
  {
    id: 'backup-dr-bcp',
    label: 'Backup, disaster recovery & BCP',
    moduleLink: 'Module A2 §5j',
    shortScope: 'Tamper-evident encrypted backups, tested DR/BCP, counter-rollback protection',
  },
  {
    id: 'rotation-revocation',
    label: 'Key rotation & revocation',
    moduleLink: 'Module A2 §5e',
    shortScope: 'Planned rotation, compromised-key revocation, approver de-enrolment',
  },
  {
    id: 'key-destruction',
    label: 'Key destruction',
    moduleLink: 'Module A2 §5k',
    shortScope: 'Verified zeroisation / destruction of retired keys and shares',
  },
  {
    id: 'third-party-ict',
    label: 'Third-party / sub-custodian & ICT risk',
    moduleLink: 'Module A1 §5 (Vendor patterns)',
    shortScope: 'Sub-custodian due diligence, ICT vendor concentration & outsourcing',
  },
  {
    id: 'audit-logging-ceremonies',
    label: 'Audit trail, logging, monitoring & ceremonies',
    moduleLink: 'Module A2 §5g & §5h',
    shortScope: 'Immutable signing logs, governance-change alerting, witnessed ceremonies',
  },
  {
    id: 'incident-testing',
    label: 'Incident reporting & resilience testing',
    moduleLink: 'Module C §6b & §6c',
    shortScope: 'Regulatory incident notice windows, penetration testing & TLPT scoping',
  },
]

export interface CustodyDesignPreset {
  id: string
  name: string
  summary: string
  /** Controls implemented by this preset; omitted controls trigger "no mapped control found (reviewer analysis)" */
  implementedControls: readonly ControlId[]
  /** Preset-specific notes explaining what is present or missing */
  architectureNotes: string
}

export const CUSTODY_DESIGN_PRESETS: readonly CustodyDesignPreset[] = [
  {
    id: 'policy-free-hsm-hot',
    name: 'Preset A: Single-cluster policy-free HSM + host broker (hot)',
    summary:
      'Private keys sit in a single PKCS#11 HSM, but transaction parsing, allowlists, and approvals run in a host web service; no cold-storage split, no segregated client wallets, and no formal key-destruction or DR drill.',
    implementedControls: ['key-gen-storage', 'access-control-mfa', 'audit-logging-ceremonies'],
    architectureNotes:
      'Illustrates why an HSM alone leaves major control gaps across segregation, cold/hot split, multi-party quorum, recovery, third-party oversight, and resilience testing.',
  },
  {
    id: 'mpc-enclave-tier',
    name: 'Preset B: Mixed-domain MPC + enclave co-signer + 98/2 cold-hot split',
    summary:
      'Mixed trust-domain MPC + hardware enclave policy engine with attested clear-signing approvers, 98% offline cold storage / 2% hot cap, client wallet segregation, MFA, daily monitoring, and tested recovery — but no formal key-destruction procedure or sub-custodian register.',
    implementedControls: [
      'key-gen-storage',
      'multi-party-control',
      'client-segregation',
      'hot-cold-split',
      'access-control-mfa',
      'recovery-access',
      'backup-dr-bcp',
      'rotation-revocation',
      'audit-logging-ceremonies',
      'incident-testing',
    ],
    architectureNotes:
      'Strong operational stack that still surfaces targeted gaps on key destruction (DORA RTS Art. 7) and third-party/sub-custodian governance (DORA Arts. 28–30 / NYDFS Sept 2025).',
  },
  {
    id: 'airgapped-cold-vault',
    name: 'Preset C: Air-gapped cold vault + witnessed ceremonies + full lifecycle',
    summary:
      'Offline HSM key generation and storage, M-of-N witnessed ceremonies, legally and operationally segregated client vaults, 98%+ cold split, MFA + least privilege, tested recovery/DR, documented rotation/destruction, sub-custodian due diligence, and annual pen-test/audit.',
    implementedControls: [
      'key-gen-storage',
      'multi-party-control',
      'client-segregation',
      'hot-cold-split',
      'access-control-mfa',
      'recovery-access',
      'backup-dr-bcp',
      'rotation-revocation',
      'key-destruction',
      'third-party-ict',
      'audit-logging-ceremonies',
      'incident-testing',
    ],
    architectureNotes:
      'All 12 control categories have a mapped design element — yet a mapped control still requires verifying Rule G1 authority assumptions and assurance scope rather than claiming compliance.',
  },
  {
    id: 'omni-subcustody',
    name: 'Preset D: Omnibus sub-custodian + browser multisig UI',
    summary:
      'Client assets pooled at an external sub-custodian behind a browser multisig interface; basic MFA and backup exist, but no independent clear-signing verifier, no client-level segregation records, no hot/cold split cap, and no sub-custodian audit rights.',
    implementedControls: ['multi-party-control', 'access-control-mfa', 'backup-dr-bcp'],
    architectureNotes:
      'Highlights insolvency segregation, sub-custodian due-diligence, and transaction-verification gaps across NYDFS, MiCA, Singapore PSR, Japan PSA, and Swiss DEBA.',
  },
]

export interface RegulatoryCell {
  /** True when the cited text does not state an obligation for this control */
  notStated?: boolean
  claimId?: SourceClaimId
  citation?: string
  bindingVerb?: 'shall / binding' | 'should / guidance' | 'policy / voluntary' | 'not stated'
  text: string
}

export interface JurisdictionProfile {
  id: string
  shortName: string
  jurisdiction: string
  band:
    | 'Binding Regulation & RTS'
    | 'Supervisory Guidance & Statute Mix'
    | 'International / Industry Baseline'
  /** Applicability gates shown BEFORE any control cell */
  gates: {
    entityType: string
    licenceScope: string
    effectiveVersion: string
    exemptionsAndLimits: string
    bindingForceSummary: string
  }
  cells: Record<ControlId, RegulatoryCell>
}

export const JURISDICTION_PROFILES: readonly JurisdictionProfile[] = [
  {
    id: 'eu-mica-dora',
    shortName: 'EU (MiCA + DORA)',
    jurisdiction: 'European Union',
    band: 'Binding Regulation & RTS',
    gates: {
      entityType:
        'MiCA-authorised Crypto-Asset Service Providers (CASPs) providing custody & administration',
      licenceScope:
        'EU CASP authorisation (MiCA Title V) + DORA Art. 2(1)(f) financial-entity scope',
      effectiveVersion:
        'MiCA (EU) 2023/1114 (applicable 30 Dec 2024); DORA (EU) 2022/2554 (applicable 17 Jan 2025); ICT RTS 2024/1774; MiCA RTS 2025/305; TLPT RTS 2025/1190',
      exemptionsAndLimits:
        'Does not apply to self-custody software providers not holding client keys; DORA TLPT applies only to competent-authority-identified entities under TLPT RTS Art. 2 (not presumptively all CASPs).',
      bindingForceSummary:
        'Binding EU Regulations & Delegated Regulations ("shall"); ESMA/EBA guidelines are supervisory guidance.',
    },
    cells: {
      'key-gen-storage': {
        claimId: 'DA-18.2b',
        citation: 'DORA RTS (EU) 2024/1774 Arts. 6–7; MiCA Art. 75(3)',
        bindingVerb: 'shall / binding',
        text: 'Requires cryptographic control policies and key-lifecycle management covering generating and storing cryptographic keys, plus custody-policy rules minimizing risk of loss of means of access; names no specific HSM scheme or algorithm.',
      },
      'multi-party-control': {
        notStated: true,
        bindingVerb: 'not stated',
        text: 'Not stated as a mandatory M-of-N threshold in MiCA Art. 75 or DORA RTS Arts. 6–7 (assessed through custody-policy authorisation disclosures under MiCA RTS 2025/305).',
      },
      'client-segregation': {
        claimId: 'DA-18.1',
        citation: 'MiCA (EU) 2023/1114 Art. 75(7) & Art. 70',
        bindingVerb: 'shall / binding',
        text: 'CASPs providing custody shall segregate clients’ crypto-assets operationally and legally from their own holdings and maintain a register of positions.',
      },
      'hot-cold-split': {
        notStated: true,
        bindingVerb: 'not stated',
        text: 'Not stated — MiCA and DORA do not prescribe a fixed cold-storage percentage.',
      },
      'access-control-mfa': {
        claimId: 'DA-18.2a',
        citation: 'DORA (EU) 2022/2554 Art. 9 & RTS 2024/1774',
        bindingVerb: 'shall / binding',
        text: 'Requires ICT access-control policies, least privilege, and strong authentication aligned with the ICT risk-management framework.',
      },
      'recovery-access': {
        claimId: 'DA-18.1',
        citation: 'MiCA Art. 75(3) & MiCA RTS (EU) 2025/305',
        bindingVerb: 'shall / binding',
        text: 'Custody policy and authorisation disclosures must address safekeeping and recovery of means of access to client crypto-assets.',
      },
      'backup-dr-bcp': {
        claimId: 'DA-18.2b',
        citation: 'DORA Art. 11–12 & DORA RTS (EU) 2024/1774 Art. 7',
        bindingVerb: 'shall / binding',
        text: 'Requires ICT business continuity, backup/restoration policies, and key-lifecycle rules covering backing up, archiving, and retrieving cryptographic keys.',
      },
      'rotation-revocation': {
        claimId: 'DA-18.2b',
        citation: 'DORA RTS (EU) 2024/1774 Art. 7',
        bindingVerb: 'shall / binding',
        text: 'Explicitly covers renewing, retiring, and revoking cryptographic keys within the documented key-management lifecycle.',
      },
      'key-destruction': {
        claimId: 'DA-18.2b',
        citation: 'DORA RTS (EU) 2024/1774 Art. 7',
        bindingVerb: 'shall / binding',
        text: 'Explicitly lists "destroying" cryptographic keys among the required key-lifecycle management controls.',
      },
      'third-party-ict': {
        claimId: 'DA-18.2a',
        citation: 'DORA Arts. 28–30; MiCA Art. 75(9)',
        bindingVerb: 'shall / binding',
        text: 'Sets binding ICT third-party risk governance, contractual clauses, and register obligations; MiCA restricts sub-custody to authorised CASPs.',
      },
      'audit-logging-ceremonies': {
        claimId: 'DA-18.8a',
        citation: 'MiCA RTS (EU) 2025/305 & DORA Arts. 10–11',
        bindingVerb: 'shall / binding',
        text: 'Requires anomaly detection, logging, and documented custody operational procedures in authorisation filings; specific key-ceremony scripts are not prescribed.',
      },
      'incident-testing': {
        claimId: 'DA-19.8',
        citation: 'DORA Arts. 17–19, 24–27 & TLPT RTS (EU) 2025/1190 Art. 2',
        bindingVerb: 'shall / binding',
        text: 'Requires major ICT incident classification/reporting and periodic resilience testing; TLPT applies only where designated by a competent authority under RTS Art. 2 criteria.',
      },
    },
  },
  {
    id: 'hk-sfc',
    shortName: 'Hong Kong (SFC)',
    jurisdiction: 'Hong Kong SAR',
    band: 'Supervisory Guidance & Statute Mix',
    gates: {
      entityType:
        'SFC-licensed Virtual Asset Trading Platform (VATP) operators & associated entities',
      licenceScope: 'Licensed VATP operators under AMLO / SFO framework',
      effectiveVersion:
        'SFC VATP Guidelines (effective 1 June 2023) + SFC Circular 25EC44 (15 August 2025)',
      exemptionsAndLimits:
        'Scoped to licensed VATPs (not unregulated software wallets); exceptions to the 98% cold-storage expectation require limited SFC-approved circumstances.',
      bindingForceSummary:
        'Supervisory guidelines & circular ("should" wording, enforced through licensing conditions and inspections).',
    },
    cells: {
      'key-gen-storage': {
        claimId: 'DA-18.3',
        citation: 'SFC VATP Guidelines §10.8(a) & Circular 25EC44',
        bindingVerb: 'should / guidance',
        text: 'Where practicable, seeds and private keys "should" be generated offline and kept in a secure environment such as an HSM with "appropriate certification" (no specific scheme named).',
      },
      'multi-party-control': {
        claimId: 'DA-18.7d',
        citation: 'SFC Circular 25EC44 (15 Aug 2025)',
        bindingVerb: 'should / guidance',
        text: 'Sets expected minimum standards for transaction verification, multi-party signing controls, and senior-management accountability over custody operations.',
      },
      'client-segregation': {
        claimId: 'DA-18.3',
        citation: 'SFC VATP Guidelines §10.3–10.5',
        bindingVerb: 'should / guidance',
        text: 'Client virtual assets should be held on trust through an associated entity, segregated from platform operator assets.',
      },
      'hot-cold-split': {
        claimId: 'DA-18.3',
        citation: 'SFC VATP Guidelines §10.6 & Circular 25EC44',
        bindingVerb: 'should / guidance',
        text: '98% of client virtual assets "should" be stored in cold storage (except limited SFC-approved circumstances); Circular 25EC44 reinforces cold-wallet isolation.',
      },
      'access-control-mfa': {
        claimId: 'DA-18.7d',
        citation: 'SFC Circular 25EC44',
        bindingVerb: 'should / guidance',
        text: 'Addresses strict access controls, privilege separation, and physical/logical restrictions on cold-wallet infrastructure.',
      },
      'recovery-access': {
        claimId: 'DA-18.7d',
        citation: 'SFC Circular 25EC44',
        bindingVerb: 'should / guidance',
        text: 'Covers seed/key backup and recovery governance for licensed VATP cold-wallet infrastructure.',
      },
      'backup-dr-bcp': {
        claimId: 'DA-18.3',
        citation: 'SFC VATP Guidelines §10.8 & Circular 25EC44',
        bindingVerb: 'should / guidance',
        text: 'Expects secure, geographically separated backups of seeds/keys and operational resilience procedures.',
      },
      'rotation-revocation': {
        notStated: true,
        bindingVerb: 'not stated',
        text: 'Not stated as a fixed rotation interval in the cited SFC texts.',
      },
      'key-destruction': {
        notStated: true,
        bindingVerb: 'not stated',
        text: 'Not stated as a standalone key-destruction procedure in the cited SFC texts.',
      },
      'third-party-ict': {
        claimId: 'DA-18.7d',
        citation: 'SFC Circular 25EC44 (15 Aug 2025)',
        bindingVerb: 'should / guidance',
        text: 'Highlights third-party and supply-chain threat controls for wallet infrastructure and service providers.',
      },
      'audit-logging-ceremonies': {
        claimId: 'DA-18.7d',
        citation: 'SFC Circular 25EC44',
        bindingVerb: 'should / guidance',
        text: 'Sets monitoring, alerting, and transaction-verification expectations (mapped to Module A2 §5h).',
      },
      'incident-testing': {
        claimId: 'DA-19.2',
        citation: 'SFC VATP Guidelines §§10.22–10.23 & Circular 25EC44',
        bindingVerb: 'should / guidance',
        text: 'Sets compensation-arrangement expectations (50% cold / 100% hot "should") alongside ongoing security reviews and incident reporting to the SFC.',
      },
    },
  },
  {
    id: 'dubai-vara',
    shortName: 'Dubai (VARA)',
    jurisdiction: 'Dubai (excluding DIFC)',
    band: 'Binding Regulation & RTS',
    gates: {
      entityType:
        'VARA-licensed Virtual Asset Service Providers (VASPs) authorised for Custody Services',
      licenceScope:
        'Dubai Emirate (excluding DIFC); Custody VASPs must follow Custody, Technology & Company Rulebooks',
      effectiveVersion:
        'VARA Custody Services, Technology & Information, and Company Rulebooks (Version 2, May 2025)',
      exemptionsAndLimits:
        'Direct text check confirms zero occurrences of FIPS 140 or Common Criteria in Custody and Technology Rulebooks; insurance rules sit in the Company Rulebook (Part VI.D), not the Custody Rulebook.',
      bindingForceSummary: 'Binding VARA Rulebooks for licensed VASPs.',
    },
    cells: {
      'key-gen-storage': {
        claimId: 'DA-18.4a',
        citation: 'VARA Custody Rulebook v2 & Technology Rulebook v2',
        bindingVerb: 'shall / binding',
        text: 'Requires secure cryptographic key generation, storage, and safekeeping controls for Custody VASPs; contains zero occurrences of FIPS 140 or Common Criteria.',
      },
      'multi-party-control': {
        claimId: 'DA-18.4a',
        citation: 'VARA Custody Rulebook v2',
        bindingVerb: 'shall / binding',
        text: 'Requires governance and authorisation controls over wallet signing and client-asset transfers.',
      },
      'client-segregation': {
        claimId: 'DA-18.4a',
        citation: 'VARA Custody Rulebook v2',
        bindingVerb: 'shall / binding',
        text: 'Mandates strict segregation of client virtual assets and separate wallet/account governance from VASP proprietary assets.',
      },
      'hot-cold-split': {
        claimId: 'DA-19.3',
        citation: 'VARA Company Rulebook Part VI.D & Custody Rulebook v2',
        bindingVerb: 'shall / binding',
        text: 'Custody governance addresses wallet-tier controls; Company Rulebook Part VI.D ties commercial crime insurance specifically to virtual assets stored in hot wallets.',
      },
      'access-control-mfa': {
        claimId: 'DA-18.4b',
        citation: 'VARA Technology & Information Rulebook v2',
        bindingVerb: 'shall / binding',
        text: 'Requires access-control governance, authentication, and privilege management across VASP technology systems.',
      },
      'recovery-access': {
        claimId: 'DA-18.4a',
        citation: 'VARA Custody Rulebook v2',
        bindingVerb: 'shall / binding',
        text: 'Requires documented key-recovery and continuity arrangements protecting client access.',
      },
      'backup-dr-bcp': {
        claimId: 'DA-18.4b',
        citation: 'VARA Technology & Information Rulebook v2',
        bindingVerb: 'shall / binding',
        text: 'Requires business continuity, disaster recovery, and cryptographic key backup governance.',
      },
      'rotation-revocation': {
        claimId: 'DA-18.4b',
        citation: 'VARA Technology & Information Rulebook v2',
        bindingVerb: 'shall / binding',
        text: 'Requires key-lifecycle controls within the cryptographic management policy.',
      },
      'key-destruction': {
        notStated: true,
        bindingVerb: 'not stated',
        text: 'Not stated as a standalone key-destruction article in the cited VARA summaries.',
      },
      'third-party-ict': {
        claimId: 'DA-18.4a',
        citation: 'VARA Custody & Technology Rulebooks v2',
        bindingVerb: 'shall / binding',
        text: 'Requires governance and due diligence over outsourced technology and custody arrangements.',
      },
      'audit-logging-ceremonies': {
        claimId: 'DA-18.4b',
        citation: 'VARA Technology & Information Rulebook v2',
        bindingVerb: 'shall / binding',
        text: 'Requires audit logging and security monitoring across key and wallet operations.',
      },
      'incident-testing': {
        claimId: 'DA-19.3',
        citation: 'VARA Technology Rulebook v2 & Company Rulebook Part VI.D',
        bindingVerb: 'shall / binding',
        text: 'Requires incident reporting and security testing; Company Rulebook Part VI.D sets PI, D&O, and hot-wallet commercial crime insurance obligations.',
      },
    },
  },
  {
    id: 'ny-nydfs',
    shortName: 'New York (NYDFS)',
    jurisdiction: 'New York State (US)',
    band: 'Supervisory Guidance & Statute Mix',
    gates: {
      entityType:
        'NYDFS-regulated Virtual Currency Entities (BitLicensees & NY Limited Purpose Trust Companies)',
      licenceScope:
        '23 NYCRR Part 200 (BitLicense), Part 500 (Cybersecurity), and NYDFS Custodial Structures Guidance',
      effectiveVersion:
        '23 NYCRR Part 500 Amendment 2 (phased through Nov 2025); 23 NYCRR §200.9; Custodial Structures Guidance (effective 30 Sept 2025, replacing Jan 2023)',
      exemptionsAndLimits:
        'Applies to NYDFS-regulated entities; Part 500 contains limited small-entity exemptions (§500.19) and Class A heightened obligations.',
      bindingForceSummary:
        'Parts 200 & 500 are binding NY regulations ("shall"); Sept 2025 Industry Letter is supervisory guidance.',
    },
    cells: {
      'key-gen-storage': {
        notStated: true,
        bindingVerb: 'not stated',
        text: 'Not stated as a specific HSM/MPC prescription in Part 500 or §200.9 (evaluated through risk-based cybersecurity program & supervisory examinations).',
      },
      'multi-party-control': {
        notStated: true,
        bindingVerb: 'not stated',
        text: 'Not stated as a fixed M-of-N threshold in Part 500 or §200.9.',
      },
      'client-segregation': {
        claimId: 'DA-18.7b',
        citation: '23 NYCRR §200.9 & NYDFS Guidance (30 Sept 2025)',
        bindingVerb: 'shall / binding',
        text: '§200.9 requires holding virtual currency of the same type and amount owed to customers and bars unauthorised rehypothecation; Sept 2025 guidance details separate on-chain or omnibus accounting for insolvency protection.',
      },
      'hot-cold-split': {
        notStated: true,
        bindingVerb: 'not stated',
        text: 'Not stated as a fixed cold-storage percentage in Part 500, §200.9, or the Sept 2025 guidance.',
      },
      'access-control-mfa': {
        claimId: 'DA-18.5',
        citation: '23 NYCRR Part 500 §§500.7 & 500.12 (Amendment 2)',
        bindingVerb: 'shall / binding',
        text: 'Mandates limiting and periodically reviewing user access privileges (§500.7) and enforcing multi-factor authentication (§500.12) across systems.',
      },
      'recovery-access': {
        notStated: true,
        bindingVerb: 'not stated',
        text: 'Not stated as a custody-specific key-recovery formula in Part 500 or §200.9.',
      },
      'backup-dr-bcp': {
        claimId: 'DA-18.5',
        citation: '23 NYCRR Part 500 (Amendment 2 BCDR / backups)',
        bindingVerb: 'shall / binding',
        text: 'Requires cybersecurity program resilience, backups, and business continuity / disaster recovery planning.',
      },
      'rotation-revocation': {
        notStated: true,
        bindingVerb: 'not stated',
        text: 'Not stated as a fixed cryptographic key-rotation schedule in Part 500 or §200.9.',
      },
      'key-destruction': {
        notStated: true,
        bindingVerb: 'not stated',
        text: 'Not stated as a custody key-destruction rule in Part 500 or §200.9.',
      },
      'third-party-ict': {
        claimId: 'DA-18.7',
        citation: 'NYDFS Custodial Structures Guidance (30 Sept 2025) & Part 500',
        bindingVerb: 'should / guidance',
        text: 'Sept 2025 guidance sets explicit expectations for sub-custodian due diligence, contractual terms, and customer disclosures on sub-custody.',
      },
      'audit-logging-ceremonies': {
        claimId: 'DA-18.5',
        citation: '23 NYCRR §500.6 (Audit Trail)',
        bindingVerb: 'shall / binding',
        text: 'Requires audit-trail systems designed to reconstruct material financial transactions and detect/respond to cybersecurity events.',
      },
      'incident-testing': {
        claimId: 'DA-18.5',
        citation: '23 NYCRR §§500.5 & 500.17 (Amendment 2)',
        bindingVerb: 'shall / binding',
        text: 'Requires penetration testing and vulnerability assessments (§500.5) and notifying the Superintendent within 72 hours of determining a covered cybersecurity event occurred (§500.17).',
      },
    },
  },
  {
    id: 'sg-mas',
    shortName: 'Singapore (MAS / PSR)',
    jurisdiction: 'Singapore',
    band: 'Supervisory Guidance & Statute Mix',
    gates: {
      entityType:
        'Licensed Digital Payment Token (DPT) Service Providers under the Payment Services Act',
      licenceScope:
        'Binding Payment Services Regulations 2019 (Regs. 18B–18C, 18G) + MAS PS-G03 & MAS TRM Guidelines',
      effectiveVersion:
        'Payment Services Regulations 2019 (as amended for DPT safeguarding); MAS PS-G03 (19 Sept 2024); MAS TRM Guidelines (Jan 2021)',
      exemptionsAndLimits:
        'Distinguish binding "shall" rules in PSR Regs. 18B–18C & 18G from non-binding supervisory expectations in PS-G03 and TRM.',
      bindingForceSummary:
        'PSR 2019 Regs. 18B–18C & 18G are binding subsidiary legislation ("shall"); PS-G03 & TRM are guidelines.',
    },
    cells: {
      'key-gen-storage': {
        claimId: 'DA-18.6',
        citation: 'MAS TRM Guidelines §10 & MAS PS-G03 (Sept 2024)',
        bindingVerb: 'should / guidance',
        text: 'TRM sets cryptographic key lifecycle expectations; PS-G03 sets private-key storage expectations for DPT service providers.',
      },
      'multi-party-control': {
        claimId: 'DA-18.17',
        citation: 'Payment Services Regulations 2019 Reg. 18G & MAS TRM §10',
        bindingVerb: 'shall / binding',
        text: 'PSR Reg. 18G sets binding obligations on security of DPT instruments, controls, and segregation of duties; TRM expects dual control / split knowledge for sensitive key operations.',
      },
      'client-segregation': {
        claimId: 'DA-18.17',
        citation: 'Payment Services Regulations 2019 Regs. 18B–18C & PS-G03',
        bindingVerb: 'shall / binding',
        text: 'PSR Regs. 18B–18C mandate safeguarding customer assets in statutory trust accounts segregated from the licensee’s own assets; PS-G03 adds daily reconciliation guidance.',
      },
      'hot-cold-split': {
        claimId: 'DA-18.7c',
        citation: 'MAS Guidelines PS-G03 (19 Sept 2024)',
        bindingVerb: 'should / guidance',
        text: 'PS-G03 sets supervisory expectations on cold-storage practices for customer DPTs alongside statutory safeguarding rules.',
      },
      'access-control-mfa': {
        claimId: 'DA-18.6',
        citation: 'MAS TRM Guidelines §9 & PSR Reg. 18G',
        bindingVerb: 'should / guidance',
        text: 'Expects strong access controls, least privilege, and segregation of duties over key-management systems.',
      },
      'recovery-access': {
        claimId: 'DA-18.6',
        citation: 'MAS TRM Guidelines §10',
        bindingVerb: 'should / guidance',
        text: 'Covers controlled key backup and recovery procedures under dual control.',
      },
      'backup-dr-bcp': {
        claimId: 'DA-18.6',
        citation: 'MAS TRM Guidelines',
        bindingVerb: 'should / guidance',
        text: 'Expects tested disaster-recovery, backup integrity, and operational resilience controls.',
      },
      'rotation-revocation': {
        claimId: 'DA-18.6',
        citation: 'MAS TRM Guidelines §10',
        bindingVerb: 'should / guidance',
        text: 'Covers cryptographic key renewal, rotation, and compromise revocation.',
      },
      'key-destruction': {
        claimId: 'DA-18.6',
        citation: 'MAS TRM Guidelines §10',
        bindingVerb: 'should / guidance',
        text: 'Covers secure disposal/destruction of retired cryptographic keys.',
      },
      'third-party-ict': {
        claimId: 'DA-18.7c',
        citation: 'MAS PS-G03 & MAS TRM Guidelines',
        bindingVerb: 'should / guidance',
        text: 'Addresses third-party custodian/trustee safeguarding arrangements and ICT vendor risk oversight.',
      },
      'audit-logging-ceremonies': {
        claimId: 'DA-18.7c',
        citation: 'MAS PS-G03 & MAS TRM Guidelines',
        bindingVerb: 'should / guidance',
        text: 'Expects daily reconciliations, audit logs, and monitoring of key-management operations.',
      },
      'incident-testing': {
        claimId: 'DA-18.6',
        citation: 'MAS TRM Guidelines',
        bindingVerb: 'should / guidance',
        text: 'Expects periodic vulnerability assessments, penetration testing, and timely incident notification.',
      },
    },
  },
  {
    id: 'jp-fsa',
    shortName: 'Japan (PSA / Order)',
    jurisdiction: 'Japan',
    band: 'Binding Regulation & RTS',
    gates: {
      entityType: 'Registered Cryptoasset Exchange Service Providers (CAESPs)',
      licenceScope:
        'Japan Payment Services Act (Act No. 59 of 2009) & Cabinet Office Order No. 7 of 2017',
      effectiveVersion:
        'Payment Services Act (2020 English trans.) & Cabinet Office Order (2021 English trans.)',
      exemptionsAndLimits:
        'Applies to registered Japanese CAESPs; hot-wallet holdings for operational liquidity require matching proprietary crypto-assets held in cold storage.',
      bindingForceSummary: 'Binding statutory act & Cabinet Office Order ("shall").',
    },
    cells: {
      'key-gen-storage': {
        claimId: 'DA-18.10b',
        citation: 'Cabinet Office Order No. 7 of 2017',
        bindingVerb: 'shall / binding',
        text: 'Specifies reliable offline management methods for customer crypto-assets (cold storage).',
      },
      'multi-party-control': {
        notStated: true,
        bindingVerb: 'not stated',
        text: 'Not stated as a specific M-of-N formula in the cited English translation excerpts.',
      },
      'client-segregation': {
        claimId: 'DA-18.10a',
        citation: 'Payment Services Act Art. 63-11',
        bindingVerb: 'shall / binding',
        text: 'Requires customer crypto-assets to be managed separately from proprietary assets using reliable methods specified by Cabinet Office Order.',
      },
      'hot-cold-split': {
        claimId: 'DA-18.10b',
        citation: 'Cabinet Office Order No. 7 of 2017',
        bindingVerb: 'shall / binding',
        text: 'Mandates cold-wallet management for customer crypto-assets and requires matching proprietary crypto-assets held in cold storage for any customer share held in hot wallets.',
      },
      'access-control-mfa': {
        claimId: 'DA-18.10a',
        citation: 'Payment Services Act (information security duties)',
        bindingVerb: 'shall / binding',
        text: 'Establishes general information-security management obligations over user-property systems.',
      },
      'recovery-access': {
        notStated: true,
        bindingVerb: 'not stated',
        text: 'Not stated as a specific cryptographic recovery protocol in the cited excerpts.',
      },
      'backup-dr-bcp': {
        notStated: true,
        bindingVerb: 'not stated',
        text: 'Not stated as a specific key-backup architecture in the cited excerpts.',
      },
      'rotation-revocation': {
        notStated: true,
        bindingVerb: 'not stated',
        text: 'Not stated in the cited excerpts.',
      },
      'key-destruction': {
        notStated: true,
        bindingVerb: 'not stated',
        text: 'Not stated in the cited excerpts.',
      },
      'third-party-ict': {
        notStated: true,
        bindingVerb: 'not stated',
        text: 'Not stated as a standalone custody sub-delegation rule in the cited excerpts.',
      },
      'audit-logging-ceremonies': {
        claimId: 'DA-18.10b',
        citation: 'Cabinet Office Order No. 7 of 2017',
        bindingVerb: 'shall / binding',
        text: 'Requires external audit of segregated user-property management.',
      },
      'incident-testing': {
        notStated: true,
        bindingVerb: 'not stated',
        text: 'Not stated as a specific penetration-testing cadence in the cited excerpts.',
      },
    },
  },
  {
    id: 'ch-swiss',
    shortName: 'Switzerland (DEBA / BankG)',
    jurisdiction: 'Switzerland',
    band: 'Binding Regulation & RTS',
    gates: {
      entityType: 'Swiss custodians & banks holding crypto-based assets (DLT Act amendments)',
      licenceScope:
        'DEBA (SR 281.1) Art. 242a; Banking Act (SR 952.0) Art. 16(1bis) & Art. 37d; FINMA Guidance 08/2023 (staking only)',
      effectiveVersion:
        'DEBA status 1 Jan 2026; Banking Act status 1 Oct 2026; FINMA Guidance 08/2023 (20 Dec 2023)',
      exemptionsAndLimits:
        'FINMA Guidance 08/2023 is scoped specifically to staking — not general custody key management. DEBA Art. 242a focuses on insolvency segregation conditions.',
      bindingForceSummary:
        'DEBA & BankG are binding federal statutes; FINMA Guidance 08/2023 is staking-scoped supervisory guidance.',
    },
    cells: {
      'key-gen-storage': {
        notStated: true,
        bindingVerb: 'not stated',
        text: 'Not stated — DEBA Art. 242a and BankG Art. 16(1bis) are technology-neutral insolvency-segregation statutes.',
      },
      'multi-party-control': {
        notStated: true,
        bindingVerb: 'not stated',
        text: 'Not stated in DEBA Art. 242a or BankG Art. 16(1bis).',
      },
      'client-segregation': {
        claimId: 'DA-18.11a',
        citation: 'DEBA (SR 281.1) Art. 242a; BankG (SR 952.0) Arts. 16(1bis) & 37d',
        bindingVerb: 'shall / binding',
        text: 'Establishes bankruptcy segregation and surrender of crypto-based assets kept in readiness for the beneficiary at all times (individually attributed or community with identifiable shares).',
      },
      'hot-cold-split': {
        notStated: true,
        bindingVerb: 'not stated',
        text: 'Not stated in DEBA Art. 242a or BankG Art. 16(1bis).',
      },
      'access-control-mfa': {
        notStated: true,
        bindingVerb: 'not stated',
        text: 'Not stated in DEBA Art. 242a or BankG Art. 16(1bis).',
      },
      'recovery-access': {
        notStated: true,
        bindingVerb: 'not stated',
        text: 'Not stated in DEBA Art. 242a or BankG Art. 16(1bis).',
      },
      'backup-dr-bcp': {
        notStated: true,
        bindingVerb: 'not stated',
        text: 'Not stated in DEBA Art. 242a or BankG Art. 16(1bis).',
      },
      'rotation-revocation': {
        notStated: true,
        bindingVerb: 'not stated',
        text: 'Not stated in DEBA Art. 242a or BankG Art. 16(1bis).',
      },
      'key-destruction': {
        notStated: true,
        bindingVerb: 'not stated',
        text: 'Not stated in DEBA Art. 242a or BankG Art. 16(1bis).',
      },
      'third-party-ict': {
        claimId: 'DA-18.11c',
        citation: 'FINMA Guidance 08/2023 (Staking only)',
        bindingVerb: 'should / guidance',
        text: 'Scoped strictly to staking: addresses validator operational risk, custody chain, and risk disclosures for staked assets (not general custody outsourcing).',
      },
      'audit-logging-ceremonies': {
        claimId: 'DA-18.11b',
        citation: 'BankG Art. 16(1bis) & DEBA Art. 242a (attribution records)',
        bindingVerb: 'shall / binding',
        text: 'Requires identifiable attribution records so client shares in community custody can be segregated in bankruptcy.',
      },
      'incident-testing': {
        notStated: true,
        bindingVerb: 'not stated',
        text: 'Not stated in DEBA Art. 242a, BankG Art. 16(1bis), or FINMA Guidance 08/2023.',
      },
    },
  },
  {
    id: 'intl-iosco-ccss',
    shortName: 'IOSCO + CCSS v9.0',
    jurisdiction: 'International Policy / Industry Standard',
    band: 'International / Industry Baseline',
    gates: {
      entityType:
        'Crypto-asset service providers & self-custody/custodian engineering teams (voluntary / policy baseline)',
      licenceScope:
        'Non-binding international policy recommendations (IOSCO FR11/2023) & voluntary industry standard (C4 CCSS v9.0)',
      effectiveVersion: 'IOSCO FR11/2023 (November 2023); CCSS v9.0 (C4)',
      exemptionsAndLimits:
        'Neither IOSCO FR11/2023 nor CCSS v9.0 has direct statutory force unless adopted by a national regulator; CCSS is explicitly an industry standard, not regulation.',
      bindingForceSummary:
        'Policy recommendations & voluntary industry standard ("should" / Levels I–III).',
    },
    cells: {
      'key-gen-storage': {
        claimId: 'DA-18.13',
        citation: 'CCSS v9.0 (Industry Standard, Levels I–III)',
        bindingVerb: 'policy / voluntary',
        text: 'Defines Level I–III controls for cryptographic key generation, wallet architecture, and secure key storage.',
      },
      'multi-party-control': {
        claimId: 'DA-18.13',
        citation: 'CCSS v9.0 (Wallet Architecture / Access)',
        bindingVerb: 'policy / voluntary',
        text: 'Addresses multi-signature / multi-actor authorization requirements across CCSS security levels.',
      },
      'client-segregation': {
        claimId: 'DA-18.12',
        citation: 'IOSCO FR11/2023 Recs. 12–14',
        bindingVerb: 'policy / voluntary',
        text: 'Recommends legal and operational segregation of client assets from proprietary holdings and clear custody disclosures.',
      },
      'hot-cold-split': {
        claimId: 'DA-18.12',
        citation: 'IOSCO FR11/2023 Custody Recommendations',
        bindingVerb: 'policy / voluntary',
        text: 'Recommends mitigating theft and loss risks through appropriate safeguarding architecture (without fixing a universal cold-storage percentage).',
      },
      'access-control-mfa': {
        claimId: 'DA-18.13',
        citation: 'CCSS v9.0',
        bindingVerb: 'policy / voluntary',
        text: 'Defines access-control and role-separation controls for key-management operations.',
      },
      'recovery-access': {
        claimId: 'DA-18.13',
        citation: 'CCSS v9.0 (Key Compromise & Recovery)',
        bindingVerb: 'policy / voluntary',
        text: 'Includes key-compromise policies and structured recovery procedures.',
      },
      'backup-dr-bcp': {
        claimId: 'DA-18.13',
        citation: 'CCSS v9.0 (Backups)',
        bindingVerb: 'policy / voluntary',
        text: 'Specifies backup protection, storage, and restoration controls across Levels I–III.',
      },
      'rotation-revocation': {
        claimId: 'DA-18.13',
        citation: 'CCSS v9.0',
        bindingVerb: 'policy / voluntary',
        text: 'Covers key compromise response and rotation procedures.',
      },
      'key-destruction': {
        claimId: 'DA-18.13',
        citation: 'CCSS v9.0',
        bindingVerb: 'policy / voluntary',
        text: 'Addresses secure sanitization/disposal of retired key media.',
      },
      'third-party-ict': {
        claimId: 'DA-18.12',
        citation: 'IOSCO FR11/2023 Rec. 15',
        bindingVerb: 'policy / voluntary',
        text: 'Recommends transparent disclosure and governance of sub-custody and third-party custody arrangements.',
      },
      'audit-logging-ceremonies': {
        claimId: 'DA-18.13',
        citation: 'CCSS v9.0 & IOSCO FR11/2023',
        bindingVerb: 'policy / voluntary',
        text: 'CCSS covers security logs, key-ceremony evidence, and third-party CCSS audits; IOSCO recommends regular reconciliations.',
      },
      'incident-testing': {
        claimId: 'DA-18.13',
        citation: 'CCSS v9.0 (Security Audits)',
        bindingVerb: 'policy / voluntary',
        text: 'Includes third-party security audits and penetration-testing controls at higher CCSS levels.',
      },
    },
  },
]

export interface UsFederalContextItem {
  id: string
  claimId: SourceClaimId
  instrumentType: 'Accounting Bulletin' | 'Banking Permissibility Letter'
  title: string
  asOfVersion: string
  whyExcludedFromControlCells: string
}

/** Excluded from W11's key-management control cells by an explicit instrument-type gate. */
export const US_FEDERAL_CONTEXT_BAND: readonly UsFederalContextItem[] = [
  {
    id: 'sec-sab-121',
    claimId: 'DA-18.9a',
    instrumentType: 'Accounting Bulletin',
    title: 'SEC Staff Accounting Bulletin No. 121 (Rescinded)',
    asOfVersion: 'Rescinded 23 January 2025 by SAB 122',
    whyExcludedFromControlCells:
      'Accounting-reporting staff view on balance-sheet safeguarding liabilities; never specified cryptographic key-management controls.',
  },
  {
    id: 'sec-sab-122',
    claimId: 'DA-18.9b',
    instrumentType: 'Accounting Bulletin',
    title: 'SEC Staff Accounting Bulletin No. 122',
    asOfVersion: 'Effective 23 January 2025',
    whyExcludedFromControlCells:
      'Directs loss-contingency evaluation under FASB ASC 450-20 / IAS 37 — financial reporting context, not key-management technical controls.',
  },
  {
    id: 'occ-1170',
    claimId: 'DA-18.9c',
    instrumentType: 'Banking Permissibility Letter',
    title: 'OCC Interpretive Letter 1170',
    asOfVersion: '22 July 2020',
    whyExcludedFromControlCells:
      'Confirms national bank legal authority to offer crypto custody; does not prescribe HSM, MPC, or quorum parameters.',
  },
  {
    id: 'occ-1184',
    claimId: 'DA-18.9d',
    instrumentType: 'Banking Permissibility Letter',
    title: 'OCC Interpretive Letter 1184',
    asOfVersion: '7 May 2025',
    whyExcludedFromControlCells:
      'Clarifies national banks may provide and outsource crypto custody/execution without prior supervisory non-objection; permissibility context only.',
  },
]

export interface MarketPracticeCell {
  insurerAsks: {
    claimId?: SourceClaimId
    sourceLabel: string
    text: string
    notStatedInSource?: boolean
  }
  auditorTests: {
    claimId: SourceClaimId
    sourceLabel: string
    text: string
  }
  evidenceExample: string
}

/**
 * Market-practice columns for W11 & Section 9C takeaways.
 * Explicitly tagged as market practice, NOT regulatory mandates.
 * "Not stated in this identified source" never means "the market does not ask".
 */
export const INSURER_AUDITOR_MATRIX: Record<ControlId, MarketPracticeCell> = {
  'key-gen-storage': {
    insurerAsks: {
      claimId: 'DA-19.4b',
      sourceLabel: 'WTW (2023, broker commentary)',
      text: 'Asks how private keys are generated, whether cold-storage specie assets are physically/logically isolated, and what hardware/MPC boundary protects them.',
    },
    auditorTests: {
      claimId: 'DA-19.5c',
      sourceLabel: 'SOC 2 / CCSS v9.0 (scope-dependent)',
      text: 'Tests key-generation and storage controls ONLY if included in the service organization’s system description and Trust Services Criteria scope.',
    },
    evidenceExample:
      'Witnessed key-ceremony log, HSM/MPC architecture boundary diagram, CMVP/module inventory.',
  },
  'multi-party-control': {
    insurerAsks: {
      claimId: 'DA-19.4a',
      sourceLabel: 'Aon (2025, broker brief)',
      text: 'Scrutinises multi-party signing quorums, clear transaction verification, and collusion exclusions following high-profile exchange compromises.',
    },
    auditorTests: {
      claimId: 'DA-19.5a',
      sourceLabel: 'SOC 1 / ISAE 3402 & SOC 2 (Type II)',
      text: 'Samples transaction approvals over the review period to verify configured quorum enforcement inside the declared scope.',
    },
    evidenceExample:
      'Signed policy-ruleset export, sampled quorum approval logs, negative-test rejection logs.',
  },
  'client-segregation': {
    insurerAsks: {
      claimId: 'DA-19.4b',
      sourceLabel: 'WTW (2023, broker commentary)',
      text: 'Reviews how insured client cold/hot assets are demarcated from proprietary balances and excluded exposures.',
    },
    auditorTests: {
      claimId: 'DA-19.5a',
      sourceLabel: 'SOC 1 / ISAE 3402 (ICFR)',
      text: 'Evaluates reconciliation controls between client sub-ledgers and on-chain wallet balances relevant to financial reporting.',
    },
    evidenceExample:
      'Daily wallet-to-sub-ledger reconciliation reports, statutory trust / segregation legal memo.',
  },
  'hot-cold-split': {
    insurerAsks: {
      claimId: 'DA-19.4b',
      sourceLabel: 'WTW (2023, broker commentary)',
      text: 'Distinguishes cold-storage specie cover from hot-wallet crime/cyber sub-limits and asks for exact cold-vs-hot allocation caps.',
    },
    auditorTests: {
      claimId: 'DA-19.5c',
      sourceLabel: 'SOC 2 / ISAE 3000 (Revised)',
      text: 'Checks adherence to declared hot-wallet sweep thresholds and cold-storage ratio controls when included in engagement criteria.',
    },
    evidenceExample:
      'Automated hot-wallet cap alerts, sweep execution logs, cold-ratio exception approvals.',
  },
  'access-control-mfa': {
    insurerAsks: {
      claimId: 'DA-19.4a',
      sourceLabel: 'Aon (2025, broker brief)',
      text: 'Reviews operator authentication, staff vetting, and social-engineering / authorised-push boundary conditions.',
    },
    auditorTests: {
      claimId: 'DA-19.5c',
      sourceLabel: 'SOC 2 (Security TSC)',
      text: 'Tests quarterly user-access reviews, MFA enforcement, and privilege revocation tickets over the Type II period.',
    },
    evidenceExample:
      'Quarterly access-review sign-offs, IdP/HSM MFA configuration exports, joiner-mover-leaver logs.',
  },
  'recovery-access': {
    insurerAsks: {
      claimId: 'DA-19.4b',
      sourceLabel: 'WTW (2023, broker commentary)',
      text: 'Examines how key-recovery shares are stored and protected against insider collusion or coercion.',
    },
    auditorTests: {
      claimId: 'DA-18.13',
      sourceLabel: 'CCSS v9.0 / ISAE 3000 (Revised)',
      text: 'Reviews documented recovery triggers, custodian share-custody logs, and tabletop or staging recovery drill records.',
    },
    evidenceExample:
      'Tamper-evident vault seal logs, staging recovery drill report, guardian roster.',
  },
  'backup-dr-bcp': {
    insurerAsks: {
      sourceLabel: 'Aon (2025) / WTW (2023)',
      text: 'Not stated in this identified source (does not mean the market does not ask).',
      notStatedInSource: true,
    },
    auditorTests: {
      claimId: 'DA-19.5c',
      sourceLabel: 'SOC 2 (Availability TSC)',
      text: 'Tests backup integrity checks and disaster-recovery test evidence when Availability is in scope.',
    },
    evidenceExample: 'Annual DR failover report, encrypted backup checksum verification logs.',
  },
  'rotation-revocation': {
    insurerAsks: {
      sourceLabel: 'Aon (2025) / WTW (2023)',
      text: 'Not stated in this identified source (does not mean the market does not ask).',
      notStatedInSource: true,
    },
    auditorTests: {
      claimId: 'DA-19.5c',
      sourceLabel: 'SOC 2 / CCSS v9.0',
      text: 'Tests timely de-enrolment of departed approvers and documented key-rotation tickets.',
    },
    evidenceExample:
      'Approver revocation timestamps, rotation ceremony tickets, updated quorum manifests.',
  },
  'key-destruction': {
    insurerAsks: {
      sourceLabel: 'Aon (2025) / WTW (2023)',
      text: 'Not stated in this identified source (does not mean the market does not ask).',
      notStatedInSource: true,
    },
    auditorTests: {
      claimId: 'DA-18.13',
      sourceLabel: 'CCSS v9.0 / ISAE 3000 (Revised)',
      text: 'Verifies witnessed media-sanitization / HSM zeroisation certificates for retired keys.',
    },
    evidenceExample: 'Dual-signed HSM zeroisation log, physical media destruction certificate.',
  },
  'third-party-ict': {
    insurerAsks: {
      claimId: 'DA-19.4a',
      sourceLabel: 'Aon (2025, broker brief)',
      text: 'Evaluates supply-chain and third-party wallet-interface dependencies highlighted by recent exchange breaches.',
    },
    auditorTests: {
      claimId: 'DA-19.5b',
      sourceLabel: 'SOC 1 / ISAE 3402 (Carve-out / CUECs)',
      text: 'Checks Complementary Subservice Organization Controls (CSOCs) and vendor due-diligence reviews.',
    },
    evidenceExample:
      'Sub-custodian SOC/ISAE bridge letters, annual vendor risk review, CSOC mapping.',
  },
  'audit-logging-ceremonies': {
    insurerAsks: {
      claimId: 'DA-19.4b',
      sourceLabel: 'WTW (2023, broker commentary)',
      text: 'Asks for documented key ceremonies, chain-of-custody logs, and real-time anomaly monitoring.',
    },
    auditorTests: {
      claimId: 'DA-18.16',
      sourceLabel: 'ISAE 3000 (Revised) / SOC 2',
      text: 'Inspects ceremony witness evidence (procedures taught in Module A2 §5g) and log immutability over the review period.',
    },
    evidenceExample:
      'Witnessed ceremony attestation pack, SIEM governance-alert runbooks, immutable log hashes.',
  },
  'incident-testing': {
    insurerAsks: {
      claimId: 'DA-19.4a',
      sourceLabel: 'Aon (2025, broker brief)',
      text: 'Reviews recent penetration tests, breach-response readiness, and loss-history disclosures during renewal underwriting.',
    },
    auditorTests: {
      claimId: 'DA-19.6',
      sourceLabel: 'PCAOB (2023) & SOC 2 / Pen-test',
      text: 'Reviews remediation of pen-test findings; PCAOB warns Proof-of-Reserve snapshots are NOT audits and do not replace assurance engagements.',
    },
    evidenceExample:
      'Third-party pen-test remediation report, 72-hour incident playbook drill record.',
  },
}

export interface AssuranceRegimeRow {
  id: string
  regime: string
  claimId: SourceClaimId
  whatItCovers: string
  whatItDoesNotProve: string
  scopeQuestionToAsk: string
}

export const ASSURANCE_REGIMES: readonly AssuranceRegimeRow[] = [
  {
    id: 'soc1-isae3402',
    regime: 'SOC 1 / ISAE 3402 (Type I & Type II)',
    claimId: 'DA-19.5a',
    whatItCovers:
      'Internal controls at a service organization relevant to user entities’ internal control over financial reporting (ICFR). Type II covers operating effectiveness over a stated period.',
    whatItDoesNotProve:
      'Does not inherently test cryptographic signing boundaries, frontend clear-signing integrity, or key-recovery quorums unless management placed them in scope.',
    scopeQuestionToAsk:
      'Which subservice organizations were carved out, and were signing-policy changes inside the tested ICFR boundary?',
  },
  {
    id: 'soc2',
    regime: 'SOC 2 (AICPA Trust Services Criteria)',
    claimId: 'DA-19.5c',
    whatItCovers:
      'Controls evaluated against selected AICPA Trust Services Criteria (Security, Availability, Processing Integrity, Confidentiality, Privacy) over a management-defined system boundary.',
    whatItDoesNotProve:
      'A clean SOC 2 does not prove an HSM or MPC policy engine cannot be bypassed, nor does it audit client asset completeness or solvency.',
    scopeQuestionToAsk:
      'Did the system boundary include the transaction-builder UI, signing-service APIs, and contract-upgrade keys, or only corporate IT?',
  },
  {
    id: 'isae3000',
    regime: 'ISAE 3000 (Revised)',
    claimId: 'DA-18.16',
    whatItCovers:
      'IAASB’s general assurance standard for engagements other than historical financial audits — supports limited or reasonable assurance against any suitable criteria (not an "international SOC 2").',
    whatItDoesNotProve:
      'Assurance strength depends entirely on whether the engagement was limited vs reasonable assurance and on the exact criteria selected.',
    scopeQuestionToAsk:
      'Was this limited or reasonable assurance, what exact criteria were tested, and who authored those criteria?',
  },
  {
    id: 'ccss-audit',
    regime: 'CCSS v9.0 Audit (Industry Standard)',
    claimId: 'DA-18.13',
    whatItCovers:
      'Voluntary cryptocurrency-specific security controls (Levels I–III) covering key generation, wallet architecture, key storage, backups, and compromise policies.',
    whatItDoesNotProve:
      'Voluntary industry benchmark — not a regulatory licence or statutory compliance verdict, and point-in-time unless continuously maintained.',
    scopeQuestionToAsk:
      'Which CCSS level (I, II, or III) was assessed for each wallet tier (hot, warm, cold), and what exceptions were noted?',
  },
  {
    id: 'proof-of-reserves',
    regime: 'Proof of Reserves (e.g., Merkle Tree / Provisions)',
    claimId: 'DA-19.6',
    whatItCovers:
      'Cryptographic demonstration (one common construction: Merkle-tree liability proofs + signed asset addresses, or zero-knowledge Provisions) that someone could sign for claimed addresses at one timestamp.',
    whatItDoesNotProve:
      'Per the PCAOB (8 March 2023), PoR reports are NOT audits: they may omit complete liabilities, beneficial ownership, borrowed or encumbered assets, and continuing control after the snapshot.',
    scopeQuestionToAsk:
      'Were off-ledger liabilities, pledged collateral, and post-snapshot key control verified by an independent financial audit?',
  },
]
