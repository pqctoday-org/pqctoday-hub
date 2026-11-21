// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Structured workshop datasets and deterministic evaluators for Module A2
 * (Custody Key Lifecycle Operations, LM-084).
 * All scenarios use fictional custody setups for educational decision practice.
 */
import type { SourceClaimId } from './sourceClaims'

/* -------------------------------------------------------------------------- */
/*  W9: Revoke or Rotate Matrix                                               */
/* -------------------------------------------------------------------------- */

export type RevokeActionId =
  | 'revoke'
  | 'rotate-in-place'
  | 'reshare'
  | 'sweep-funds'
  | 'revoke-allowances'
  | 'nothing-possible'

export const REVOKE_ACTION_LABELS: Record<RevokeActionId, string> = {
  revoke: 'Revoke credential / cert',
  'rotate-in-place': 'Rotate key / owner in place',
  reshare: 'MPC reshare / refresh',
  'sweep-funds': 'Sweep funds to new address',
  'revoke-allowances': 'Revoke allowances / delegation',
  'nothing-possible': 'Nothing possible on-chain',
}

export interface RevokeOrRotateItem {
  id: string
  label: string
  category: 'Chain Key' | 'Smart Account' | 'MPC' | 'Control Plane' | 'On-Chain Auth'
  scenario: string
  expectedActions: RevokeActionId[]
  explanation: string
  mustExistBeforehand: string
  claimId: SourceClaimId
}

export const W9_ITEMS: RevokeOrRotateItem[] = [
  {
    id: 'eoa-hot-wallet',
    label: '1. Compromised Ethereum EOA hot wallet',
    category: 'Chain Key',
    scenario: 'An attacker is suspected of exfiltrating an ordinary EOA hot-wallet private key.',
    expectedActions: ['sweep-funds', 'revoke-allowances'],
    explanation:
      'An EOA key cannot be revoked. You must sweep all liquid funds to pre-generated destination keys and revoke any active ERC-20 allowances or EIP-7702 delegations; locked or staked assets cannot be swept until transferable, and future deposits to the old address remain at risk.',
    mustExistBeforehand:
      'Pre-generated cold/warm destination keys, templated sweep transactions, and quorum-protected emergency-sweep approval rules.',
    claimId: 'DA-16.1b',
  },
  {
    id: 'safe-owner',
    label: '2. Compromised Safe smart-account owner key',
    category: 'Smart Account',
    scenario:
      'One owner key in a 3-of-5 Safe smart account is lost or compromised while three honest owners remain.',
    expectedActions: ['rotate-in-place'],
    explanation:
      'Safe OwnerManager.sol allows the remaining 3-of-5 quorum to call swapOwner or removeOwner on-chain without moving funds (assuming no attacker-controlled module, guard, or upgrade key bypasses the owner quorum).',
    mustExistBeforehand:
      'Healthy remaining quorum, verified replacement owner key, and audited module/guard configuration.',
    claimId: 'DA-16.2',
  },
  {
    id: 'mpc-share',
    label: '3. Suspected single MPC share leak (below threshold)',
    category: 'MPC',
    scenario:
      'One node in a 2-of-3 MPC cluster had a transient host exposure; threshold t=2 was not reached.',
    expectedActions: ['reshare'],
    explanation:
      'Proactive share refresh (resharing) gives every party new shares of the same secret, defeating a mobile adversary who collects shares across epochs. It does NOT change the public key or protect a key whose threshold was breached, and requires verified erasure of old-epoch shares.',
    mustExistBeforehand:
      'Authenticated peer channels, proactive refresh protocol support (e.g., CGGMP21), and old-epoch share erasure procedures.',
    claimId: 'DA-16.3a',
  },
  {
    id: 'departed-approver-device',
    label: '4. Departed approver’s signing device & MPC seat',
    category: 'MPC',
    scenario:
      'An approver leaves the company while holding an enrolled hardware approver device, API credentials, and an MPC quorum seat.',
    expectedActions: ['revoke', 'reshare'],
    explanation:
      'Removing a person requires both revoking their device/API credentials AND removing them from the quorum via a protocol-specific membership-change reshare (or on-chain owner removal / HSM approver-key removal), then verifying remaining threshold and separation rules.',
    mustExistBeforehand:
      'Joiner/mover/leaver playbook tied to quorum membership, attested replacement approver, and old-share erasure verification.',
    claimId: 'DA-16.4',
  },
  {
    id: 'approver-mldsa-key',
    label: '5. Approver ML-DSA policy-approval key',
    category: 'Control Plane',
    scenario:
      'An approver’s ML-DSA-65 control-plane approval key reaches the end of its cryptoperiod.',
    expectedActions: ['rotate-in-place', 'revoke'],
    explanation:
      'Control-plane approver keys follow classic KMS/PKI rotation: enroll a newly attested ML-DSA key in the policy engine and revoke the retiring key/certificate so old approval signatures are rejected.',
    mustExistBeforehand:
      'Attested device enrollment pipeline, defined SP 800-57 cryptoperiods, and dual-controlled policy-engine key updates.',
    claimId: 'DA-16.6a',
  },
  {
    id: 'hsm-wrapping-key',
    label: '6. HSM backup wrapping key (KEK)',
    category: 'Control Plane',
    scenario:
      'Scheduled rotation of the HSM wrapping key that protects encrypted backup envelopes.',
    expectedActions: ['rotate-in-place'],
    explanation:
      'Rotating a wrapping key in envelope encryption normally re-wraps each data key rather than re-encrypting the underlying data — and provides the operational window to move backup envelopes to a stronger wrapping scheme.',
    mustExistBeforehand:
      'Authoritative backup inventory, dual-controlled HSM quorum for KEK generation, and re-wrap verification checks.',
    claimId: 'DA-24.1',
  },
  {
    id: 'tls-certificate',
    label: '7. Compromised mTLS signing-service certificate',
    category: 'Control Plane',
    scenario: 'A workload’s mTLS client certificate used to call the signing API is exposed.',
    expectedActions: ['revoke', 'rotate-in-place'],
    explanation:
      'Control-plane X.509 certificates use classic PKI revocation (RFC 5280 CRL / RFC 6960 OCSP) and immediate workload-identity re-issuance. Remember OCSP reports certificate status, not blockchain key status.',
    mustExistBeforehand:
      'Short-lived workload certificates, automated revocation checking at the signing boundary, and fast re-issuance.',
    claimId: 'DA-16.5b',
  },
  {
    id: 'policy-signing-key',
    label: '8. Policy-signing key (signed ruleset key)',
    category: 'Control Plane',
    scenario:
      'The key that signs custody policy updates is rotated during a planned governance change.',
    expectedActions: ['rotate-in-place', 'revoke'],
    explanation:
      'Rotate the policy-signing key under administrative quorum, update the signing boundary’s verifier trust store, and revoke the prior key so stale or unauthorized policy bundles are rejected.',
    mustExistBeforehand:
      'Quorum-protected trust-store update path and governance-change alerting on every policy-key change.',
    claimId: 'DA-16.5a',
  },
  {
    id: 'clear-signing-descriptor',
    label: '9. Replaced ERC-7730 clear-signing descriptor',
    category: 'Control Plane',
    scenario: 'A smart-contract upgrade invalidates an older ERC-7730 clear-signing descriptor.',
    expectedActions: ['revoke', 'rotate-in-place'],
    explanation:
      'ERC-7730 defines descriptor schema versioning but no descriptor expiry or revocation; revocation and expirationTime live in ERC-8176 EAS attestations and the wallet’s own registry freshness policy. Publish the updated descriptor and revoke the superseded attestation.',
    mustExistBeforehand:
      'Curated descriptor registry with provenance checks, ERC-8176 revocation/expiry checks, and wallet refresh policy.',
    claimId: 'DA-13.7',
  },
  {
    id: 'cold-key-exposed-pubkey',
    label: '10. Cold-storage UTXO key with exposed public key',
    category: 'Chain Key',
    scenario:
      'A Bitcoin cold-storage address was reused after spending, exposing its classical public key on-chain (no private key theft suspected today).',
    expectedActions: ['sweep-funds'],
    explanation:
      'Nothing can un-expose a public key already recorded on-chain. Moving funds to a fresh, unused address (sweep) restores hash-shielded address hygiene today; post-quantum migration details are covered in Module B (optional further reading).',
    mustExistBeforehand:
      'Pre-verified fresh cold destination address generated and checked on an independent device.',
    claimId: 'DA-16.1a',
  },
  {
    id: 'erc20-token-allowance',
    label: '11. Unlimited ERC-20 allowance / EIP-2612 permit',
    category: 'On-Chain Auth',
    scenario:
      'A compromised DeFi router holds an active ERC-20 allowance granted earlier via approve() or an EIP-2612 permit().',
    expectedActions: ['revoke-allowances'],
    explanation:
      'Pausing off-chain withdrawals does not cancel an on-chain token allowance. Submit an on-chain approve(spender, 0) transaction to revoke the allowance before the spender drains remaining tokens.',
    mustExistBeforehand:
      'On-chain allowance inventory, gas reserve on the wallet, and pre-approved emergency revocation workflow.',
    claimId: 'DA-16.8a',
  },
  {
    id: 'eip7702-delegation',
    label: '12. Unauthorized EIP-7702 delegation on hot EOA',
    category: 'On-Chain Auth',
    scenario:
      'An attacker exploited a signing service to attach an EIP-7702 delegation (0xef0100 || attackerContract) to a treasury EOA.',
    expectedActions: ['revoke-allowances', 'sweep-funds'],
    explanation:
      'Suspending off-chain withdrawals does not invalidate an existing EIP-7702 delegation. You must submit a type-4 authorization pointing to the zero address to clear the delegation AND sweep remaining assets to clean keys once the signing path is contained.',
    mustExistBeforehand:
      'Type-4 zero-address revocation playbook, pre-tested emergency signing path, and out-of-band on-chain verification.',
    claimId: 'DA-16.8c',
  },
]

/* -------------------------------------------------------------------------- */
/*  W10: Recovery & Inheritance Planner                                       */
/* -------------------------------------------------------------------------- */

export type HolderProfileId = 'custody-desk' | 'family-office' | 'individual'
export type RecoveryMechanismId =
  | 'slip39-shares'
  | 'hsm-quorum-backup'
  | 'vendor-recovery-kit'
  | 'miniscript-timelock'
  | 'smart-account-guardians'

export interface W10PlanConfig {
  holder: HolderProfileId
  mechanism: RecoveryMechanismId
  delayWindow: 'none' | '7-days' | '90-days-plus'
  independentGuardianChannels: boolean
  rehearsedSchedule: boolean
  heirPath: 'none' | 'seed-in-will' | 'sealed-quorum-or-timelock'
}

export interface W10EventOutcome {
  eventId: string
  eventLabel: string
  status: 'handled' | 'partial' | 'exposed'
  detail: string
}

export interface W10Evaluation {
  outcomes: W10EventOutcome[]
  singlePointsOfFailure: string[]
  g1Assumptions: string[]
}

export function evaluateW10Plan(cfg: W10PlanConfig): W10Evaluation {
  const spofs: string[] = []
  const g1: string[] = [
    'Recovery path must have an independently satisfiable trigger and authority separate from the daily signing path.',
    'Recovery-module replacement, veto, and contract upgrade authorities must be quorum-protected.',
  ]

  if (cfg.delayWindow === 'none') {
    spofs.push(
      'No recovery delay or veto window: coerced or forged recovery requests execute immediately.'
    )
  }
  if (!cfg.independentGuardianChannels) {
    spofs.push(
      'Guardians or share holders share one communication channel, enabling coordinated social engineering.'
    )
  }
  if (!cfg.rehearsedSchedule) {
    spofs.push(
      'Unrehearsed recovery procedure: stale shares, lost passphrases, or broken instructions go undetected.'
    )
  }
  if (cfg.heirPath === 'seed-in-will') {
    spofs.push(
      'Usable secrets placed in a will may become public during probate or be stolen by any reader.'
    )
  }
  if (cfg.heirPath === 'none' && cfg.holder !== 'custody-desk') {
    spofs.push(
      'No documented heir path: heirs may not know assets exist or how to execute recovery.'
    )
  }
  if (cfg.mechanism === 'vendor-recovery-kit') {
    g1.push(
      'Vendor recovery kit (vendor pattern): verify who can run the kit and whether recovery rebuilds the full key in one place.'
    )
  }
  if (cfg.mechanism === 'miniscript-timelock') {
    g1.push(
      'BIP-379 Miniscript expresses policy only; monitoring, UTXO churn/fee-bumping, and alerts must run outside Miniscript.'
    )
  }

  const lostDevice: W10EventOutcome = {
    eventId: 'lost-device',
    eventLabel: '1. Lost or broken approver device',
    status: 'handled',
    detail:
      'Handled via device re-enrollment and removal of the lost credential (§5e) without invoking full quorum recovery, provided threshold t < n.',
  }

  const lostQuorum: W10EventOutcome = {
    eventId: 'lost-quorum',
    eventLabel: '2. Lost signing quorum',
    status: cfg.rehearsedSchedule ? 'handled' : 'partial',
    detail: cfg.rehearsedSchedule
      ? `Rehearsed ${cfg.mechanism} path restores access once the ${cfg.delayWindow} delay clears.`
      : `Configured ${cfg.mechanism} can recover funds in theory, but without rehearsals stale shares or missing tooling risk failure.`,
  }

  const custodianFailure: W10EventOutcome = {
    eventId: 'custodian-failure',
    eventLabel: '3. Custodian failure or insolvency',
    status:
      cfg.mechanism === 'vendor-recovery-kit' ||
      cfg.mechanism === 'miniscript-timelock' ||
      cfg.mechanism === 'slip39-shares'
        ? cfg.rehearsedSchedule
          ? 'handled'
          : 'partial'
        : cfg.mechanism === 'smart-account-guardians'
          ? 'handled'
          : 'partial',
    detail:
      cfg.mechanism === 'hsm-quorum-backup'
        ? 'HSM backup cards restore within a compatible HSM security domain; confirm independent hardware availability if the custodian fails (regulatory asset return is covered in Module C, optional further reading).'
        : 'Client-held recovery material or on-chain timelock/guardian path lets the holder recover without the custodian’s live servers.',
  }

  const deathEvent: W10EventOutcome = {
    eventId: 'death',
    eventLabel: '4. Death or incapacity of key holder',
    status:
      cfg.holder === 'custody-desk'
        ? 'handled'
        : cfg.heirPath === 'sealed-quorum-or-timelock' && cfg.rehearsedSchedule
          ? 'handled'
          : cfg.heirPath === 'seed-in-will'
            ? 'exposed'
            : 'partial',
    detail:
      cfg.holder === 'custody-desk'
        ? 'Institutional quorum rotation replaces an incapacitated officer under dual control (non-legal operational continuity).'
        : cfg.heirPath === 'sealed-quorum-or-timelock'
          ? 'Heirs have asset notice, sealed/independent recovery material or a timelocked heir path (BIP-65 for multi-year delays), and step-by-step instructions (technical pattern only; seek legal/estate advice).'
          : cfg.heirPath === 'seed-in-will'
            ? 'Exposed: placing raw secrets in a probated will risks theft before heirs act.'
            : 'Partial: without a clear heir path and instructions, funds risk permanent loss.',
  }

  const coercedRecovery: W10EventOutcome = {
    eventId: 'coerced-recovery',
    eventLabel: '5. Coerced or social-engineered recovery request',
    status:
      cfg.delayWindow !== 'none' && cfg.independentGuardianChannels
        ? 'handled'
        : cfg.delayWindow !== 'none' || cfg.independentGuardianChannels
          ? 'partial'
          : 'exposed',
    detail:
      cfg.delayWindow !== 'none' && cfg.independentGuardianChannels
        ? 'Delay plus owner veto window and independent guardian verification channels alert all owners and block rushed coercion or forged incapacity claims.'
        : 'Exposed/Partial: without a delay + veto window and out-of-band guardian channels, an attacker can exploit the rarely checked recovery path.',
  }

  return {
    outcomes: [lostDevice, lostQuorum, custodianFailure, deathEvent, coercedRecovery],
    singlePointsOfFailure: spofs,
    g1Assumptions: g1,
  }
}

/* -------------------------------------------------------------------------- */
/*  W12: Ceremony Script Review                                               */
/* -------------------------------------------------------------------------- */

export interface CeremonyScriptStep {
  id: string
  stepNumber: number
  title: string
  scriptExcerpt: string
  isDefect: boolean
  controlName: string
  explanation: string
  claimId: SourceClaimId
}

export const W12_SCRIPT_STEPS: CeremonyScriptStep[] = [
  {
    id: 'cer-1',
    stepNumber: 1,
    title: 'Role assignment — Administrator & Share Holder',
    scriptExcerpt:
      'Ceremony Administrator runs the HSM console commands and also receives Shamir Recovery Share #1 for safekeeping.',
    isDefect: true,
    controlName: 'Role Separation (Split Knowledge & Dual Control)',
    explanation:
      'Defect: the Ceremony Administrator runs the script and must hold no key material. ICANN Root Zone KSK DPS §4.2.2 and NIST SP 800-57 Part 2 Rev. 1 separate administrators, crypto officers, share holders, and witnesses.',
    claimId: 'DA-21.1',
  },
  {
    id: 'cer-2',
    stepNumber: 2,
    title: 'Hardware arrival & tamper-evident packaging',
    scriptExcerpt:
      'HSM arrived via courier; box was opened in advance by IT ops and serial numbers were not recorded before ceremony start.',
    isDefect: true,
    controlName: 'Hardware Chain of Custody',
    explanation:
      'Defect: hardware must arrive in tamper-evident bags with pre-recorded serial numbers inspected on camera/before witnesses upon opening.',
    claimId: 'DA-21.3',
  },
  {
    id: 'cer-3',
    stepNumber: 3,
    title: 'Firmware & offline workstation verification',
    scriptExcerpt:
      'Skip HSM firmware SHA-256 verification because the vendor shipped the unit last month; boot workstation from a reusable office USB stick.',
    isDefect: true,
    controlName: 'Verified Firmware & Hashed Offline Image',
    explanation:
      'Defect: both HSM firmware and the air-gapped workstation image must be verified against expected cryptographic hashes before generation.',
    claimId: 'DA-21.4',
  },
  {
    id: 'cer-4',
    stepNumber: 4,
    title: 'Witnessing under CA/B Forum BR §6.1.1.1',
    scriptExcerpt:
      'An independent Qualified Auditor witnesses the entire key-generation ceremony in the room and signs the ceremony report; no continuous video recording is made.',
    isDefect: false,
    controlName: 'Valid under CA/B Forum TLS BR §6.1.1.1',
    explanation:
      'Not a defect: CA/B Forum TLS BR v2.2.9 §6.1.1.1 requires a Qualified Auditor witness OR a video recording of the whole generation (plus an auditor report). Witnessed-without-video is permitted by the cited text.',
    claimId: 'DA-21.2',
  },
  {
    id: 'cer-5',
    stepNumber: 5,
    title: 'Entropy source documentation',
    scriptExcerpt:
      'Generate root seed on the workstation using standard JavaScript Math.random() without documenting or testing the entropy source.',
    isDefect: true,
    controlName: 'Approved / Documented Entropy Source',
    explanation:
      'Defect: keys must be generated inside the HSM TRNG (or, for small self-custody setups, documented physical entropy such as dice); untested software PRNGs are a critical ceremony failure mode.',
    claimId: 'DA-21.5',
  },
  {
    id: 'cer-6',
    stepNumber: 6,
    title: 'Independent address & public-key verification',
    scriptExcerpt:
      'Copy the first deposit address from the ceremony laptop directly into production treasury config without deriving it on a second independent device.',
    isDefect: true,
    controlName: 'Independent Public-Key / Address Verification',
    explanation:
      'Defect: before any funds arrive, derive and compare the public keys and first addresses on a second, independent device and test a small transaction.',
    claimId: 'DA-21.5',
  },
  {
    id: 'cer-7',
    stepNumber: 7,
    title: 'Backup share sealing & custody logging',
    scriptExcerpt:
      'Place three backup smart cards into plain unnumbered envelopes and hand them to custodians without logging seal numbers or storage locations.',
    isDefect: true,
    controlName: 'Tamper-Evident Sealing & Backup Inventory',
    explanation:
      'Defect: shares or backup cards must be sealed in tamper-evident bags in the room with recorded holder, storage location, and seal number under dual control.',
    claimId: 'DA-21.3',
  },
  {
    id: 'cer-8',
    stepNumber: 8,
    title: 'Pre-funding backup restore rehearsal',
    scriptExcerpt:
      'Omit the restore test to save two hours; schedule the first restore check after customer funds are deposited.',
    isDefect: true,
    controlName: 'Verified Restore Before Funding',
    explanation:
      'Defect: an untested backup is an unverified assumption. Perform a controlled restore verification before funding the vault.',
    claimId: 'DA-24.2',
  },
  {
    id: 'cer-9',
    stepNumber: 9,
    title: 'Evidence hashing & signed minutes',
    scriptExcerpt:
      'Ceremony Administrator records every minor script deviation in the minutes, hashes all output logs and public keys, and collects witness signatures.',
    isDefect: false,
    controlName: 'Verifiable Ceremony Evidence Package',
    explanation:
      'Not a defect: recording deviations, hashing output artifacts, and collecting witness attestations matches public best practice (e.g., IANA Root KSK Ceremonies).',
    claimId: 'DA-21.4',
  },
  {
    id: 'cer-10',
    stepNumber: 10,
    title: 'Close-out media sanitization',
    scriptExcerpt:
      'Leave the ceremony workstation’s temporary SSD in an unlocked cabinet for reuse next quarter without sanitizing or documenting media erasure.',
    isDefect: true,
    controlName: 'Close-Out Media Sanitization (SP 800-88 Rev. 2)',
    explanation:
      'Defect: temporary media and workstations must be sanitized (Clear, Purge, or Destroy per NIST SP 800-88 Rev. 2) with verification recorded before close-out.',
    claimId: 'DA-21.3b',
  },
]

/* -------------------------------------------------------------------------- */
/*  W14: Custody Alert Triage                                                 */
/* -------------------------------------------------------------------------- */

export type AlertSeverity = 'low' | 'high' | 'critical'
export type AlertResponse = 'log' | 'page' | 'auto-pause'
export type AlertStage = 'pre-signing' | 'mempool' | 'confirmed-chain'

export interface W14AlertEvent {
  id: string
  timestamp: string
  signal: string
  sourceCategory: 'Signing Path' | 'Key Infra' | 'Governance' | 'On-Chain'
  stage: AlertStage
  expectedSeverity: AlertSeverity
  expectedResponse: AlertResponse
  caseStudyMatch: string
  whatResponseCanChange: string
  claimId: SourceClaimId
}

export const W14_EVENTS: W14AlertEvent[] = [
  {
    id: 'ev-1',
    timestamp: '03:02 UTC',
    signal: 'New withdrawal allowlist entry submitted outside change window',
    sourceCategory: 'Governance',
    stage: 'pre-signing',
    expectedSeverity: 'critical',
    expectedResponse: 'auto-pause',
    caseStudyMatch: 'Rule G1 governance pre-positioning (Bybit / Drift pattern)',
    whatResponseCanChange:
      'Pre-signing stage: automatic pause blocks the allowlist update and any dependent withdrawals before a signature is produced.',
    claimId: 'DA-22.2',
  },
  {
    id: 'ev-2',
    timestamp: '03:05 UTC',
    signal: 'Burst of 42 policy denials in 60 seconds from one service identity',
    sourceCategory: 'Signing Path',
    stage: 'pre-signing',
    expectedSeverity: 'high',
    expectedResponse: 'auto-pause',
    caseStudyMatch: 'Policy probing by a compromised service container (Binance pattern)',
    whatResponseCanChange:
      'Pre-signing stage: auto-pausing the calling workload identity stops further probing before the attacker finds an unblocked rule.',
    claimId: 'DA-22.2',
  },
  {
    id: 'ev-3',
    timestamp: '03:08 UTC',
    signal:
      'Type-4 EIP-7702 authorization detected setting code on treasury EOA (no event log emitted)',
    sourceCategory: 'On-Chain',
    stage: 'confirmed-chain',
    expectedSeverity: 'critical',
    expectedResponse: 'auto-pause',
    caseStudyMatch: 'Binance 29 Oct 2026 EIP-7702 delegation exploitation',
    whatResponseCanChange:
      'Confirmed-chain stage: cannot undo the delegation transaction; auto-pause stops internal signing while responders submit a zero-address type-4 revocation and sweep remaining funds.',
    claimId: 'DA-16.8b',
  },
  {
    id: 'ev-4',
    timestamp: '03:11 UTC',
    signal: 'HSM audit log reports unexpected firmware/policy update on HSM #2',
    sourceCategory: 'Key Infra',
    stage: 'pre-signing',
    expectedSeverity: 'critical',
    expectedResponse: 'auto-pause',
    caseStudyMatch: 'Key-boundary tampering / unauthorized admin-path action',
    whatResponseCanChange:
      'Pre-signing stage: quarantine HSM #2 and halt signing requests routed to it before any compromised firmware signs.',
    claimId: 'DA-22.1',
  },
  {
    id: 'ev-5',
    timestamp: '03:14 UTC',
    signal: 'Five incoming 0.0001 USDC "dust" transfers from look-alike vanity addresses',
    sourceCategory: 'On-Chain',
    stage: 'confirmed-chain',
    expectedSeverity: 'low',
    expectedResponse: 'log',
    caseStudyMatch: 'Address poisoning reconnaissance (Module A1 §2)',
    whatResponseCanChange:
      'Confirmed-chain stage: cannot undo incoming dust; log, suppress poisoned addresses from UI history, and remind operators to use allowlists only.',
    claimId: 'DA-22.4a',
  },
  {
    id: 'ev-6',
    timestamp: '03:17 UTC',
    signal: 'On-chain monitor heartbeat silent for 4 minutes',
    sourceCategory: 'Key Infra',
    stage: 'pre-signing',
    expectedSeverity: 'high',
    expectedResponse: 'page',
    caseStudyMatch: 'Blinded monitoring ("disabled monitor looks like a quiet day")',
    whatResponseCanChange:
      'Paging on-call engineers immediately restores visibility and triggers a precautionary freeze on high-value tiers until telemetry returns.',
    claimId: 'DA-22.6',
  },
  {
    id: 'ev-7',
    timestamp: '03:20 UTC',
    signal: 'Three human approvals arrived within 0.4 seconds of transaction creation',
    sourceCategory: 'Signing Path',
    stage: 'pre-signing',
    expectedSeverity: 'high',
    expectedResponse: 'auto-pause',
    caseStudyMatch: 'Blind approval / unauthorized approver automation (Bybit / Drift pattern)',
    whatResponseCanChange:
      'Pre-signing stage: auto-pausing before broadcast stops an unreviewed or automated approval from moving funds.',
    claimId: 'DA-22.2',
  },
  {
    id: 'ev-8',
    timestamp: '03:23 UTC',
    signal: 'Safe GuardManager emits ChangedGuard event replacing the treasury guard contract',
    sourceCategory: 'Governance',
    stage: 'confirmed-chain',
    expectedSeverity: 'critical',
    expectedResponse: 'auto-pause',
    caseStudyMatch: 'Smart-account governance bypass (Rule G1 guard/module authority)',
    whatResponseCanChange:
      'Confirmed-chain stage: cannot undo the guard replacement; auto-pause halts outgoing proposals and pages quorum/SEAL 911 to investigate and restore the guard.',
    claimId: 'DA-22.3b',
  },
  {
    id: 'ev-9',
    timestamp: '03:26 UTC',
    signal: 'Unexpected MPC reshare request initiated from Node 3 outside maintenance',
    sourceCategory: 'Key Infra',
    stage: 'pre-signing',
    expectedSeverity: 'critical',
    expectedResponse: 'auto-pause',
    caseStudyMatch: 'Unauthorized threshold membership / epoch manipulation',
    whatResponseCanChange:
      'Pre-signing stage: blocking the reshare ceremony preserves the current quorum while Node 3 is isolated and attested.',
    claimId: 'DA-16.3b',
  },
  {
    id: 'ev-10',
    timestamp: '03:29 UTC',
    signal:
      'ERC-20 Approval event emitted after an unexpected EIP-2612 permit() call on treasury USDC',
    sourceCategory: 'On-Chain',
    stage: 'confirmed-chain',
    expectedSeverity: 'critical',
    expectedResponse: 'auto-pause',
    caseStudyMatch: 'Off-chain permit submitted on-chain (invisible until submission)',
    whatResponseCanChange:
      'Confirmed-chain stage: cannot undo the permit; immediately revoke the allowance on-chain and contact the stablecoin issuer if funds moved.',
    claimId: 'DA-22.4a',
  },
  {
    id: 'ev-11',
    timestamp: '03:32 UTC',
    signal:
      'Customer deposit landed on a retired cold-wallet address scheduled for decommissioning',
    sourceCategory: 'On-Chain',
    stage: 'confirmed-chain',
    expectedSeverity: 'high',
    expectedResponse: 'page',
    caseStudyMatch: 'Retired-address deposit hazard (§5k)',
    whatResponseCanChange:
      'Confirmed-chain stage: paging custody ops halts key destruction so the deposit can be swept under quorum instead of burned.',
    claimId: 'DA-16.1a',
  },
  {
    id: 'ev-12',
    timestamp: '03:35 UTC',
    signal: 'Unscheduled break-glass admin login succeeded while signing traffic is normal',
    sourceCategory: 'Governance',
    stage: 'pre-signing',
    expectedSeverity: 'critical',
    expectedResponse: 'page',
    caseStudyMatch: 'Privileged admin-path misuse (§5i)',
    whatResponseCanChange:
      'Pre-signing stage: immediate dual-channel page verifies whether a real emergency is underway or revokes the session before policy changes occur.',
    claimId: 'DA-22.5',
  },
]

/* -------------------------------------------------------------------------- */
/*  W15: Access Matrix Review                                                 */
/* -------------------------------------------------------------------------- */

export interface W15AccessRow {
  id: string
  role: string
  listedPermission: string
  effectivePermission: string
  isConflict: boolean
  explanation: string
  claimId: SourceClaimId
}

export const W15_ACCESS_ROWS: W15AccessRow[] = [
  {
    id: 'acc-1',
    role: 'Ops Engineer (laptop identity)',
    listedPermission: 'Read-only infrastructure metrics',
    effectivePermission: 'Inherited DevOps group grants HTTPS access to internal signing API',
    isConflict: true,
    explanation:
      'Conflict: crosses the signing path and administration/engineering path. An engineer’s machine reaching the signing path mirrors real exchange breach paths.',
    claimId: 'DA-23.3b',
  },
  {
    id: 'acc-2',
    role: 'Policy Administrator',
    listedPermission: 'Edit allowlists and spend caps',
    effectivePermission: 'Can both draft and unilaterally approve own policy change',
    isConflict: true,
    explanation:
      'Conflict: violates AC-5 Separation of Duties. Policy changes must require independent quorum approval enforced inside the signing boundary.',
    claimId: 'DA-23.4',
  },
  {
    id: 'acc-3',
    role: 'Signing Service (workload)',
    listedPermission: 'Submit hot-tier withdrawal requests',
    effectivePermission: 'Holds a static 12-month API key valid across hot, warm, and cold tiers',
    isConflict: true,
    explanation:
      'Conflict: violates least privilege and zero-trust workload identity (SP 800-207A). Workloads need short-lived mTLS/tokens scoped to one operation and one wallet tier.',
    claimId: 'DA-23.3b',
  },
  {
    id: 'acc-4',
    role: 'HSM Security Officer (CKU_SO)',
    listedPermission: 'Initialize token & manage user PINs',
    effectivePermission: 'Single SO can reset CKU_USER PIN and log in on an unattended HSM console',
    isConflict: true,
    explanation:
      'Conflict: PKCS#11 Usage Guide notes CKU_SO cannot use private objects directly, but resetting CKU_USER PIN without M-of-N administrative quorum violates Rule G1.',
    claimId: 'DA-23.1b',
  },
  {
    id: 'acc-5',
    role: 'Payment Initiator',
    listedPermission: 'Draft payment proposals',
    effectivePermission: 'Also listed as Approver #2 in the warm-wallet quorum group',
    isConflict: true,
    explanation:
      'Conflict: initiator != approver. Allowing one person to both initiate and approve weakens quorum independence.',
    claimId: 'DA-23.4',
  },
  {
    id: 'acc-6',
    role: 'Approver (human)',
    listedPermission: 'Approve warm/cold transactions',
    effectivePermission:
      'Enrolled with hardware-bound AAL3 phishing-resistant authenticator and CKA_ALWAYS_AUTHENTICATE per-use signing',
    isConflict: false,
    explanation:
      'Sound control: matches NIST SP 800-63B-4 AAL3 hardware-bound authentication and PKCS#11 per-use CKU_CONTEXT_SPECIFIC authentication.',
    claimId: 'DA-23.2',
  },
  {
    id: 'acc-7',
    role: 'Break-Glass Admin Account',
    listedPermission: 'Sealed emergency recovery',
    effectivePermission: 'Shared password stored in team wiki; login emits no out-of-band alert',
    isConflict: true,
    explanation:
      'Conflict: break-glass accounts must be sealed under dual control (M-of-N), never shared informally, and every use must trigger high-severity alerting (§5h).',
    claimId: 'DA-23.5',
  },
  {
    id: 'acc-8',
    role: 'Monitoring Service',
    listedPermission: 'Read audit logs & on-chain state',
    effectivePermission: 'Can also delete or truncate the remote audit-log bucket',
    isConflict: true,
    explanation:
      'Conflict: audit logs must be shipped off-box to an append-only store that neither signing operators nor monitoring agents can alter.',
    claimId: 'DA-23.3a',
  },
  {
    id: 'acc-9',
    role: 'External / Internal Auditor',
    listedPermission: 'Read-only access to logs, policies, and ceremony records',
    effectivePermission: 'Read-only role on immutable evidence store; zero signing or admin rights',
    isConflict: false,
    explanation:
      'Sound control: preserves auditor independence with zero signing-path or administration-path authority.',
    claimId: 'DA-23.4',
  },
  {
    id: 'acc-10',
    role: 'HSM User Session (CKU_USER)',
    listedPermission: 'Sign approved transactions',
    effectivePermission:
      'Single login persists indefinitely without per-use authentication on high-value keys',
    isConflict: true,
    explanation:
      'Conflict: high-value custody keys should use CKA_ALWAYS_AUTHENTICATE (requiring C_Login with CKU_CONTEXT_SPECIFIC after C_SignInit) plus policy-boundary checks.',
    claimId: 'DA-23.1a',
  },
]

/* -------------------------------------------------------------------------- */
/*  W16: Disaster Recovery Drill                                              */
/* -------------------------------------------------------------------------- */

export type DrScenarioId = 'hsm-site-loss' | 'mpc-vendor-outage' | 'poisoned-backup'

export interface W16Choice {
  scenarioId: DrScenarioId
  backupSource: 'latest-backup' | 'known-good-pre-incident' | 'vendor-recovery-kit'
  restoreOrder: 'keys-first' | 'config-and-inventory-first'
  quorumPresent: boolean
  reconcileChainBeforeResume: boolean
}

export interface W16ScenarioMeta {
  id: DrScenarioId
  title: string
  rtoTarget: string
  rpoTarget: string
  brief: string
  claimId: SourceClaimId
}

export const W16_SCENARIOS: W16ScenarioMeta[] = [
  {
    id: 'hsm-site-loss',
    title: 'Scenario A: Primary HSM Site Loss',
    rtoTarget: 'Hot: 30 min · Warm: 4 h · Cold: 48 h',
    rpoTarget: 'Config RPO: 0 (no allowlist/policy rollback)',
    brief:
      'A regional outage takes the primary HSM datacenter offline. Encrypted cross-region backups and a warm standby HSM exist in a second risk area.',
    claimId: 'DA-24.5',
  },
  {
    id: 'mpc-vendor-outage',
    title: 'Scenario B: MPC Vendor Outage of Unknown Length',
    rtoTarget: 'Hot: 60 min · Warm: 8 h · Cold: 72 h',
    rpoTarget: 'Zero nonce/spend-limit rollback',
    brief:
      'Your MPC custody vendor’s cloud co-signer is unreachable with no ETA. You hold a client-held Recovery Kit encrypted to your offline recovery quorum.',
    claimId: 'DA-17.5',
  },
  {
    id: 'poisoned-backup',
    title: 'Scenario C: Backups Taken After Attacker Enrolled a Device',
    rtoTarget: 'Safety overrides speed — validate before resuming',
    rpoTarget: 'Known-good pre-compromise baseline + authenticated replay',
    brief:
      'Forensics reveals an attacker enrolled a rogue approver device 6 days ago. Last night’s automated backup includes the rogue device and modified allowlist.',
    claimId: 'DA-24.1',
  },
]

export interface W16Result {
  verdict: 'safe' | 'unsafe'
  rtoAssessment: string
  attackerFootholdRisk: string
  configRollbackRisk: string
  undiscoveredCopiesNote: string
}

export function evaluateW16Drill(choice: W16Choice): W16Result {
  const issues: string[] = []

  if (!choice.quorumPresent) {
    issues.push(
      'Single-person restore violates Rule G1 backup authority: restore must enforce the same quorum as live signing.'
    )
  }
  if (choice.restoreOrder === 'keys-first') {
    issues.push(
      'Restoring keys before validating policy configuration and authoritative inventory risks signing under stale or tampered rules.'
    )
  }
  if (!choice.reconcileChainBeforeResume) {
    issues.push(
      'Resuming signing without reconciling chain-side state (nonces, derivation indexes, in-flight transactions, spend limits) causes replay or double-spend errors.'
    )
  }

  let attackerFootholdRisk = 'Low — clean baseline selected.'
  if (
    choice.scenarioId === 'poisoned-backup' &&
    choice.backupSource !== 'known-good-pre-incident'
  ) {
    issues.push(
      'Restoring last night’s backup re-introduces the attacker’s rogue approver device and modified allowlist!'
    )
    attackerFootholdRisk = 'HIGH — attacker foothold restored from compromised snapshot.'
  } else if (choice.scenarioId === 'mpc-vendor-outage' && choice.backupSource === 'latest-backup') {
    issues.push(
      'Vendor-hosted backups are unreachable during a vendor outage; use the independent client-held recovery kit.'
    )
    attackerFootholdRisk =
      'Blocked — vendor-dependent backup cannot restore without vendor servers.'
  } else if (
    choice.scenarioId === 'hsm-site-loss' &&
    choice.backupSource === 'vendor-recovery-kit'
  ) {
    issues.push(
      'Site loss for an HSM cluster should restore from cross-region encrypted HSM backups onto the standby HSM rather than an unrelated MPC kit.'
    )
  }

  const configRollbackRisk =
    choice.restoreOrder === 'config-and-inventory-first' && choice.reconcileChainBeforeResume
      ? 'Controlled — authoritative inventory checked and authenticated configuration changes replayed before enabling signing.'
      : 'HIGH — unverified restore may roll back spend limits, replay counters, or recent security fixes.'

  const rtoAssessment =
    issues.length === 0
      ? choice.scenarioId === 'poisoned-backup'
        ? 'Met safety-first objective: signing resumes per tier only after rogue device removal and authenticated policy replay.'
        : 'Within stated tier RTOs: warm standby / independent recovery restores hot tier first, then warm, keeping cold air-gapped.'
      : 'RTO / safety check FAILED — resolve the highlighted restore defects before resuming production signing.'

  return {
    verdict: issues.length === 0 ? 'safe' : 'unsafe',
    rtoAssessment,
    attackerFootholdRisk,
    configRollbackRisk,
    undiscoveredCopiesNote:
      issues.length === 0
        ? 'Verify authoritative inventory for any orphaned clones or cloud snapshots in the failed site/vendor and schedule destruction (§5k).'
        : issues.join(' '),
  }
}

/* -------------------------------------------------------------------------- */
/*  W17: Decommission Checklist                                               */
/* -------------------------------------------------------------------------- */

export type DecommItemId = 'hot-wallet-address' | 'hsm-model-replacement' | 'departed-approver-mpc'

export interface W17Step {
  id: string
  label: string
  disposition: 'execute-first' | 'keep' | 'destroy-last'
  correctOrder: number
  hazardIfWrong: string
  claimId: SourceClaimId
}

export interface W17Case {
  id: DecommItemId
  title: string
  summary: string
  steps: W17Step[]
}

export const W17_CASES: W17Case[] = [
  {
    id: 'hot-wallet-address',
    title: '1. Hot-wallet address still receiving occasional deposits',
    summary: 'Retire an active Ethereum hot-wallet EOA without burning late customer deposits.',
    steps: [
      {
        id: 'hw-1',
        label: 'Sweep all liquid balances to pre-verified new hot/warm keys',
        disposition: 'execute-first',
        correctOrder: 1,
        hazardIfWrong: 'Destroying before sweeping permanently burns current balances.',
        claimId: 'DA-16.1b',
      },
      {
        id: 'hw-2',
        label: 'Revoke ERC-20 allowances, EIP-7702 delegations, and any Safe owner roles',
        disposition: 'execute-first',
        correctOrder: 2,
        hazardIfWrong: 'Unrevoked allowances or delegations allow draining of any future funds.',
        claimId: 'DA-16.8c',
      },
      {
        id: 'hw-3',
        label:
          'Announce retirement, keep public address in retired inventory, and monitor for late deposits during cold retention period',
        disposition: 'keep',
        correctOrder: 3,
        hazardIfWrong:
          'Deleting the address record blinds monitoring and traps late customer deposits.',
        claimId: 'DA-16.1a',
      },
      {
        id: 'hw-4',
        label:
          'Destroy private key after retention period expires, keeping signed destruction record and audit logs',
        disposition: 'destroy-last',
        correctOrder: 4,
        hazardIfWrong:
          'Destroying logs or skipping destruction evidence leaves compliance and forensic gaps.',
        claimId: 'DA-21.3b',
      },
    ],
  },
  {
    id: 'hsm-model-replacement',
    title: '2. HSM model being replaced & returned to vendor',
    summary: 'Decommission an end-of-life FIPS 140-3 HSM that held production custody keys.',
    steps: [
      {
        id: 'hsm-1',
        label:
          'Migrate/sweep active keys to replacement HSM and deactivate/revoke in KMIP (Active keys cannot be destroyed directly)',
        disposition: 'execute-first',
        correctOrder: 1,
        hazardIfWrong: 'KMIP refuses Destroy on Active keys; premature wipe causes outage or loss.',
        claimId: 'DA-25.3b',
      },
      {
        id: 'hsm-2',
        label:
          'Destroy token objects (C_DestroyObject) AND locate/destroy all clones, backups, and cloud copies in the same security domain',
        disposition: 'execute-first',
        correctOrder: 2,
        hazardIfWrong:
          'PKCS#11 C_DestroyObject covers only one object — surviving clones/backups remain an attack path.',
        claimId: 'DA-25.1',
      },
      {
        id: 'hsm-3',
        label:
          'Execute vendor FIPS 140-3 / ISO 19790 SSP zeroisation and SP 800-88 Rev. 2 sanitization verification',
        disposition: 'destroy-last',
        correctOrder: 3,
        hazardIfWrong:
          'Returning or reselling an un-zeroised HSM leaks sensitive security parameters.',
        claimId: 'DA-25.5',
      },
      {
        id: 'hsm-4',
        label:
          'Retain audit logs, zeroisation attestations, and disposal certificates (do NOT destroy evidence)',
        disposition: 'keep',
        correctOrder: 4,
        hazardIfWrong: 'Destroying evidence eliminates proof of procedural decommissioning.',
        claimId: 'DA-25.2a',
      },
    ],
  },
  {
    id: 'departed-approver-mpc',
    title: '3. Departed approver’s MPC share & hardware device',
    summary:
      'Remove a departing approver from a 2-of-3 MPC quorum without losing availability or leaving old-epoch shares.',
    steps: [
      {
        id: 'mpc-1',
        label:
          'Run MPC membership-change reshare to the remaining/replacement members FIRST (confirm new quorum signs)',
        disposition: 'execute-first',
        correctOrder: 1,
        hazardIfWrong: 'Destroying the share before resharing can drop the wallet below threshold.',
        claimId: 'DA-16.3b',
      },
      {
        id: 'mpc-2',
        label:
          'Revoke departed approver’s certificates, API credentials, and policy-engine enrollment',
        disposition: 'execute-first',
        correctOrder: 2,
        hazardIfWrong:
          'Active control-plane credentials still let the former approver submit or view requests.',
        claimId: 'DA-16.5a',
      },
      {
        id: 'mpc-3',
        label:
          'Witnessed erasure/sanitization of the departed member’s old-epoch share, backups, and hardware device (SP 800-88 Rev. 2)',
        disposition: 'destroy-last',
        correctOrder: 3,
        hazardIfWrong:
          'Retained old-epoch shares can still sign if combined with a threshold of other old shares.',
        claimId: 'DA-16.4',
      },
      {
        id: 'mpc-4',
        label: 'Retain witnessed erasure attestation, updated quorum inventory, and audit logs',
        disposition: 'keep',
        correctOrder: 4,
        hazardIfWrong:
          'Secret destruction cannot be proved cryptographically; procedural evidence must be retained.',
        claimId: 'DA-21.3b',
      },
    ],
  },
]

/* -------------------------------------------------------------------------- */
/*  9A: Takeaways Matrix                                                      */
/* -------------------------------------------------------------------------- */

export interface LifecycleTakeawayRow {
  stage: string
  control: string
  evidence: string
  residualRisk: string
}

export const TAKEAWAYS_MATRIX: LifecycleTakeawayRow[] = [
  {
    stage: '5a. Generation & Refresh',
    control: 'DKG (no single dealer), proactive refresh with old-epoch erasure, identifiable abort',
    evidence: 'Attested DKG transcript hash, refresh epoch log, erasure attestations',
    residualRisk:
      'Protocol bugs/complexity (NISTIR 8214); threshold collusion or retained old-epoch shares',
  },
  {
    stage: '5e. Rotation & Revocation',
    control:
      'Pre-planned sweeps for EOA/UTXO, on-chain Safe rotation, explicit allowance/EIP-7702 revocation, CRL/OCSP & ERC-8176 for control plane',
    evidence:
      'Sweep tx hashes, zero-allowance / zero-delegation tx receipts, CRL/OCSP & policy rotation logs',
    residualRisk:
      'Locked/staked assets cannot sweep; race condition after key theft; future deposits to old addresses',
  },
  {
    stage: '5f. Recovery & Inheritance',
    control:
      'SLIP-0039 / HSM M-of-N / BIP-65+379 timelocks / Safe guardians with delay + owner veto + independent channels',
    evidence: 'Rehearsal logs, guardian verification records, timelock/script audit hashes',
    residualRisk:
      'Social engineering of guardians, coercion, rebuild-in-one-place moment, stale untested shares',
  },
  {
    stage: '5g. Key Ceremonies',
    control:
      'Separated roles (admin != custodian), verified firmware/images, independent address check, witnessed/recorded script',
    evidence:
      'Executed script with deviations, signed minutes, artifact hashes, witness/auditor report, media wipe record',
    residualRisk:
      'Hardware supply-chain implant; unverified RNG; covert recording in ceremony room',
  },
  {
    stage: '5h. Monitoring & Alerting',
    control:
      'Signing-path, HSM, governance-change, and on-chain (Approval + EIP-7702 code) monitors with auto-pause & dual-channel paging',
    evidence:
      'Immutable off-box audit logs, heartbeat telemetry, alert-triage & circuit-breaker records',
    residualRisk:
      'Monitoring detects rather than prevents; confirmed transactions cannot be undone; alert fatigue',
  },
  {
    stage: '5i. Access Control',
    control:
      'Separated signing vs admin paths, AC-5 separation of duties, hardware-bound AAL3 MFA, PKCS#11 CKA_ALWAYS_AUTHENTICATE, short-lived workload mTLS',
    evidence:
      'Effective-permission access reviews, JIT elevation logs, recorded admin sessions, break-glass alerts',
    residualRisk:
      'Deceived or coerced authorized signer (requires quorum, clear signing, and timelocks)',
  },
  {
    stage: '5j. Backup & DR',
    control:
      'Cross-site encrypted backups under live-key quorum, separate KEK, authoritative inventory, canary-key drills, known-good restore after compromise',
    evidence: 'Drill sign-off reports, inventory reconciliation logs, KEK rotation records',
    residualRisk:
      'Restore cannot recover stolen funds; undiscovered clone or cloud snapshot; rushed restore re-enabling attacker',
  },
  {
    stage: '5k. Destruction & Decommission',
    control:
      'Sweep -> unlink -> monitor retention window -> KMIP deactivate -> C_DestroyObject + clones -> FIPS 140-3 zeroisation & SP 800-88 Rev. 2 verification',
    evidence:
      'Witnessed destruction attestations, sanitization verification logs, retained audit logs & retired address inventory',
    residualRisk:
      'Cannot cryptographically prove no prior copy exists; incomplete backup inventory leaves surviving copies',
  },
]
