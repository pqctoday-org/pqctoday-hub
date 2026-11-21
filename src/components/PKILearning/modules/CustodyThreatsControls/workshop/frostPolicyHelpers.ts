// SPDX-License-Identifier: AGPL-3.0-only
import { secp256k1_FROST } from '@noble/curves/secp256k1.js'
import type {
  DKG_Round1,
  DKG_Round2,
  Key as FrostKey,
  NonceCommitments,
  Nonces,
} from '@noble/curves/abstract/frost.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex } from '@noble/hashes/utils.js'

// ── W1: Blind vs Clear Signing Helpers ───────────────────────────────────────

export type PayloadKind = 'transfer' | 'delegatecall-upgrade'

export interface W1TransactionPayload {
  kind: PayloadKind
  displayedSummary: string
  to: string
  method: string
  valueEth: string
  calldataHex: string
}

export const W1_ALLOWLISTED_DESTINATIONS = [
  '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  '0x1111111254fb6c44bAC0beD2854e76F90643097d',
] as const

export function buildW1Payload(kind: PayloadKind): W1TransactionPayload {
  if (kind === 'transfer') {
    return {
      kind: 'transfer',
      displayedSummary: 'Transfer 12.50 ETH to Treasury Sweeper (0x7a25...488D)',
      to: W1_ALLOWLISTED_DESTINATIONS[0],
      method: 'transfer(address,uint256)',
      valueEth: '12.50',
      // 4-byte selector a9059cbb (ERC-20 / standard transfer) + padded params
      calldataHex:
        '0xa9059cbb0000000000000000000000007a250d5630b4cf539739df2c5dacb4c659f2488d0000000000000000000000000000000000000000000000000ad78ebc5ac620000',
    }
  }
  return {
    kind: 'delegatecall-upgrade',
    // Spoofed frontend UI shows the exact same benign summary!
    displayedSummary: 'Transfer 12.50 ETH to Treasury Sweeper (0x7a25...488D)',
    to: '0x96221423681A6d52E184D440a8eFCEbB105C7242',
    method: 'execTransaction(..., operation: 1 [delegatecall], upgradeTo)',
    valueEth: '0.00',
    // 4-byte selector 3659cfe6 (upgradeTo(address)) + delegatecall op marker
    calldataHex:
      '0x3659cfe600000000000000000000000096221423681a6d52e184d440a8efcebb105c72420000000000000000000000000000000000000000000000000000000000000001',
  }
}

export interface DecodedCalldata {
  selector: string
  decodedOperation: string
  isDelegatecallOrUpgrade: boolean
  isAllowlistedDestination: boolean
}

export function parseW1Calldata(payload: W1TransactionPayload): DecodedCalldata {
  const selector = payload.calldataHex.slice(0, 10).toLowerCase()
  const isDelegatecallOrUpgrade =
    selector === '0x3659cfe6' || payload.method.toLowerCase().includes('delegatecall')
  const isAllowlistedDestination = W1_ALLOWLISTED_DESTINATIONS.some(
    (addr) => addr.toLowerCase() === payload.to.toLowerCase()
  )
  return {
    selector,
    decodedOperation: isDelegatecallOrUpgrade
      ? 'DELEGATECALL / Proxy Implementation Upgrade (upgradeTo)'
      : 'Allowlisted Treasury Transfer (transfer)',
    isDelegatecallOrUpgrade,
    isAllowlistedDestination,
  }
}

export function evaluateW1Policy(
  payload: W1TransactionPayload,
  mode: 'blind' | 'parse-only' | 'parse-and-policy'
): { decoded: DecodedCalldata; allowedToSign: boolean; reason: string } {
  const decoded = parseW1Calldata(payload)
  if (mode === 'blind') {
    return {
      decoded,
      allowedToSign: true,
      reason:
        'Blind sign mode: HSM C_Sign(CKM_ECDSA) receives only the 32-byte digest and signs whatever hash is submitted (PKCS#11 v3.2 has no transaction parser).',
    }
  }
  if (mode === 'parse-only') {
    return {
      decoded,
      allowedToSign: true,
      reason: decoded.isDelegatecallOrUpgrade
        ? 'Parse-only warning: decoded payload is DELEGATECALL / upgradeTo, but parsing without policy enforcement refuses nothing — C_Sign still executes!'
        : 'Parse-only decoded allowlisted transfer; no policy block active.',
    }
  }
  if (decoded.isDelegatecallOrUpgrade || !decoded.isAllowlistedDestination) {
    return {
      decoded,
      allowedToSign: false,
      reason:
        'In-boundary policy check REFUSED before C_Sign: delegatecall / proxy-upgrade or non-allowlisted target is blocked.',
    }
  }
  return {
    decoded,
    allowedToSign: true,
    reason: 'In-boundary policy check PASSED: decoded transfer matches allowlisted recipient.',
  }
}

export function hashW1Payload(payload: W1TransactionPayload): Uint8Array {
  const canonical = JSON.stringify({
    to: payload.to.toLowerCase(),
    method: payload.method,
    valueEth: payload.valueEth,
    calldataHex: payload.calldataHex.toLowerCase(),
  })
  return sha256(new TextEncoder().encode(canonical))
}

// ── W2: Quorum Approval Policy Helpers ───────────────────────────────────────

export interface QuorumProposal {
  txId: string
  to: string
  amountEth: number
  calldataHashHex: string
  nonce: string
  expiresAtMs: number
}

export function encodeQuorumApprovalBytes(proposal: QuorumProposal): Uint8Array {
  const canonical = JSON.stringify({
    txId: proposal.txId,
    to: proposal.to.toLowerCase(),
    amountEth: proposal.amountEth,
    calldataHashHex: proposal.calldataHashHex,
    nonce: proposal.nonce,
    expiresAtMs: proposal.expiresAtMs,
  })
  return new TextEncoder().encode(canonical)
}

export interface QuorumGateInput {
  signedProposal: QuorumProposal
  submittedProposal: QuorumProposal
  nowMs: number
  usedNonces: ReadonlySet<string>
  verifiedApproverCount: number
  requiredThreshold?: number
}

export interface QuorumGateResult {
  passed: boolean
  failureReasons: string[]
}

export function evaluateQuorumGate(input: QuorumGateInput): QuorumGateResult {
  const threshold = input.requiredThreshold ?? 2
  const failureReasons: string[] = []

  if (input.usedNonces.has(input.submittedProposal.nonce)) {
    failureReasons.push(
      `Replay rejected: nonce "${input.submittedProposal.nonce}" was already spent.`
    )
  }
  if (input.nowMs > input.submittedProposal.expiresAtMs) {
    failureReasons.push('Expired approval rejected: current time exceeds approval expiresAtMs.')
  }
  const signedHex = bytesToHex(sha256(encodeQuorumApprovalBytes(input.signedProposal)))
  const submittedHex = bytesToHex(sha256(encodeQuorumApprovalBytes(input.submittedProposal)))
  if (signedHex !== submittedHex) {
    failureReasons.push(
      'Payload mismatch rejected: submitted transaction bytes differ from the decoded proposal signed by approvers.'
    )
  }
  if (input.verifiedApproverCount < threshold) {
    failureReasons.push(
      `Insufficient quorum: ${input.verifiedApproverCount} valid ML-DSA-65 approvals verified (requires ${threshold}).`
    )
  }

  return {
    passed: failureReasons.length === 0,
    failureReasons,
  }
}

// ── W3: Live RFC 9591 2-of-3 secp256k1_FROST DKG + Policy + Sign ─────────────

export interface FrostPartyPolicy {
  partyId: 1 | 2 | 3
  label: string
  maxAmountEth: number
  allowlistedRecipients: string[]
}

export interface FrostTxRequest {
  txId: string
  to: string
  amountEth: number
  memo: string
}

export const DEFAULT_FROST_PARTIES: FrostPartyPolicy[] = [
  {
    partyId: 1,
    label: 'Party 1 · Treasury Ops',
    maxAmountEth: 100,
    allowlistedRecipients: ['0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'],
  },
  {
    partyId: 2,
    label: 'Party 2 · Risk Co-Signer',
    maxAmountEth: 25,
    allowlistedRecipients: ['0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'],
  },
  {
    partyId: 3,
    label: 'Party 3 · Cold Backup',
    maxAmountEth: 80,
    allowlistedRecipients: ['0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'],
  },
]

export interface FrostDkgResult {
  identifiers: [string, string, string]
  keys: [FrostKey, FrostKey, FrostKey]
  groupPublicKeyHex: string
}

/**
 * Execute full 3-round Pedersen DKG for 2-of-3 secp256k1_FROST (RFC 9591 §6.5 ciphersuite).
 * No trusted dealer ever holds the combined secret key.
 */
export function runFrost2of3Dkg(): FrostDkgResult {
  const signers = { min: 2, max: 3 }
  const ids: [string, string, string] = [
    secp256k1_FROST.Identifier.fromNumber(1),
    secp256k1_FROST.Identifier.fromNumber(2),
    secp256k1_FROST.Identifier.fromNumber(3),
  ]

  const r1 = ids.map((id) => secp256k1_FROST.DKG.round1(id, signers))
  const r1Pubs: DKG_Round1[] = r1.map((x) => x.public)

  const r2Map = r1.map((x, i) =>
    secp256k1_FROST.DKG.round2(
      x.secret,
      r1Pubs.filter((_, j) => j !== i)
    )
  )

  const keys = r1.map((x, i) => {
    const myId = ids[i]
    const othersR1 = r1Pubs.filter((_, j) => j !== i)
    const receivedR2: DKG_Round2[] = r2Map
      .filter((_, j) => j !== i)
      // eslint-disable-next-line security/detect-object-injection
      .map((pkgMap) => pkgMap[myId])
    return secp256k1_FROST.DKG.round3(x.secret, othersR1, receivedR2)
  }) as [FrostKey, FrostKey, FrostKey]

  return {
    identifiers: ids,
    keys,
    groupPublicKeyHex: bytesToHex(keys[0].public.commitments[0]),
  }
}

export function evaluatePartyPolicy(
  policy: FrostPartyPolicy,
  tx: FrostTxRequest
): { approved: boolean; reason: string } {
  const isAllowlisted = policy.allowlistedRecipients.some(
    (a) => a.toLowerCase() === tx.to.toLowerCase()
  )
  if (!isAllowlisted) {
    return {
      approved: false,
      reason: `Refused: recipient ${tx.to} is not in ${policy.label} allowlist.`,
    }
  }
  if (tx.amountEth > policy.maxAmountEth) {
    return {
      approved: false,
      reason: `Refused: ${tx.amountEth} ETH exceeds ${policy.label} cap (${policy.maxAmountEth} ETH).`,
    }
  }
  return {
    approved: true,
    reason: `Approved: ${tx.amountEth} ETH <= ${policy.maxAmountEth} ETH cap and recipient allowlisted.`,
  }
}

export interface FrostSigningPartyOutcome {
  partyId: 1 | 2 | 3
  identifier: string
  label: string
  approved: boolean
  reason: string
  hidingCommitmentHex?: string
  bindingCommitmentHex?: string
  signatureShareHex?: string
  shareVerified?: boolean
}

export interface FrostSigningRunResult {
  success: boolean
  approvingCount: number
  threshold: number
  messageBytes: Uint8Array
  partyOutcomes: FrostSigningPartyOutcome[]
  aggregatedSignatureHex: string | null
  finalVerified: boolean
  error: string | null
}

/**
 * Run fresh 2-round RFC 9591 FROST signing using freshly committed nonces per run.
 * Parties whose local policy refuses omit their commitments & shares.
 */
export function runFrost2of3Signing(
  dkg: FrostDkgResult,
  policies: FrostPartyPolicy[],
  tx: FrostTxRequest
): FrostSigningRunResult {
  const canonical = JSON.stringify({
    txId: tx.txId,
    to: tx.to.toLowerCase(),
    amountEth: tx.amountEth,
    memo: tx.memo,
  })
  const messageBytes = new TextEncoder().encode(canonical)

  const outcomes: FrostSigningPartyOutcome[] = []
  const approvingIndices: number[] = []
  const noncesByIdx = new Map<number, Nonces>()
  const commitmentsByIdx = new Map<number, NonceCommitments>()

  for (let i = 0; i < 3; i++) {
    // eslint-disable-next-line security/detect-object-injection
    const policy = policies[i]
    // eslint-disable-next-line security/detect-object-injection
    const id = dkg.identifiers[i]
    // eslint-disable-next-line security/detect-object-injection
    const key = dkg.keys[i]
    const decision = evaluatePartyPolicy(policy, tx)

    if (!decision.approved) {
      outcomes.push({
        partyId: policy.partyId,
        identifier: id,
        label: policy.label,
        approved: false,
        reason: decision.reason,
      })
      continue
    }

    // Generate fresh Round 1 nonces (signShare zeroes nonces in place!)
    const { nonces, commitments } = secp256k1_FROST.commit(key.secret)
    approvingIndices.push(i)
    noncesByIdx.set(i, nonces)
    commitmentsByIdx.set(i, commitments)
    outcomes.push({
      partyId: policy.partyId,
      identifier: id,
      label: policy.label,
      approved: true,
      reason: decision.reason,
      hidingCommitmentHex: bytesToHex(commitments.hiding),
      bindingCommitmentHex: bytesToHex(commitments.binding),
    })
  }

  if (approvingIndices.length < 2) {
    return {
      success: false,
      approvingCount: approvingIndices.length,
      threshold: 2,
      messageBytes,
      partyOutcomes: outcomes,
      aggregatedSignatureHex: null,
      finalVerified: false,
      error: `Signing blocked: only ${approvingIndices.length} of 3 parties approved (threshold requires 2).`,
    }
  }

  const commitmentList = approvingIndices.map((idx) => commitmentsByIdx.get(idx)!)
  const sigShares: Record<string, Uint8Array> = {}

  for (const idx of approvingIndices) {
    // eslint-disable-next-line security/detect-object-injection
    const key = dkg.keys[idx]
    // eslint-disable-next-line security/detect-object-injection
    const id = dkg.identifiers[idx]
    const nonces = noncesByIdx.get(idx)!
    const share = secp256k1_FROST.signShare(
      key.secret,
      key.public,
      nonces,
      commitmentList,
      messageBytes
    )
    const shareOk = secp256k1_FROST.verifyShare(key.public, commitmentList, messageBytes, id, share)
    // eslint-disable-next-line security/detect-object-injection
    sigShares[id] = share
    // eslint-disable-next-line security/detect-object-injection
    outcomes[idx].signatureShareHex = bytesToHex(share)
    // eslint-disable-next-line security/detect-object-injection
    outcomes[idx].shareVerified = shareOk
  }

  const aggregated = secp256k1_FROST.aggregate(
    dkg.keys[0].public,
    commitmentList,
    messageBytes,
    sigShares
  )
  const finalVerified = secp256k1_FROST.verify(
    aggregated,
    messageBytes,
    dkg.keys[0].public.commitments[0]
  )

  return {
    success: finalVerified,
    approvingCount: approvingIndices.length,
    threshold: 2,
    messageBytes,
    partyOutcomes: outcomes,
    aggregatedSignatureHex: bytesToHex(aggregated),
    finalVerified,
    error: finalVerified ? null : 'Aggregated Schnorr signature failed verification.',
  }
}

// ── W4: Control Combination Builder Evaluator ────────────────────────────────

export type AccountProfileId = 'treasury' | 'exchange-hot' | 'cold-vault'

export interface CombinationSelection {
  accountProfile: AccountProfileId
  hasInBoundaryPolicyHsm: boolean
  hasMpcSeparateDomains: boolean
  hasEnclaveCosigner: boolean
  hasAttestedApproverDisplay: boolean
  hasTimelockAndExpiry: boolean
}

export interface IncidentPatternStatus {
  id: string
  pattern: string
  blocked: boolean
  explanation: string
}

export interface CombinationEvaluation {
  incidentStatuses: IncidentPatternStatus[]
  blockedCount: number
  g1Assumptions: string[]
  residualRisks: string[]
}

export function evaluateControlCombination(sel: CombinationSelection): CombinationEvaluation {
  const bybitBlocked =
    sel.hasAttestedApproverDisplay && (sel.hasInBoundaryPolicyHsm || sel.hasEnclaveCosigner)
  const driftBlocked = sel.hasTimelockAndExpiry && sel.hasAttestedApproverDisplay
  const binanceBlocked =
    (sel.hasInBoundaryPolicyHsm || sel.hasEnclaveCosigner) && sel.hasMpcSeparateDomains
  const hostRootBlocked =
    sel.hasMpcSeparateDomains && (sel.hasInBoundaryPolicyHsm || sel.hasEnclaveCosigner)

  const incidentStatuses: IncidentPatternStatus[] = [
    {
      id: 'bybit-ui',
      pattern: 'UI tampering + blind delegatecall upgrade (Bybit pattern)',
      blocked: bybitBlocked,
      explanation: bybitBlocked
        ? 'Blocked: attested approver display decodes calldata independently while in-boundary policy blocks unapproved delegatecall.'
        : 'Exposed: requires BOTH attested clear-signing approver display AND in-boundary policy blocking unexpected delegatecalls.',
    },
    {
      id: 'drift-nonce',
      pattern: 'Pre-collected durable-nonce approvals + social engineering (Drift pattern)',
      blocked: driftBlocked,
      explanation: driftBlocked
        ? 'Blocked: bounded approval expiry + timelock + dedicated out-of-band verifier interrupt silent admin takeover.'
        : 'Exposed: without approval expiry, timelocks, and independent verification, stale pre-approvals remain executable.',
    },
    {
      id: 'binance-api',
      pattern: 'Compromised internal signing-service / EIP-7702 abuse (Binance pattern)',
      blocked: binanceBlocked,
      explanation: binanceBlocked
        ? 'Blocked: multi-domain t-of-n threshold + in-boundary policy stops a single stolen deployment token from issuing unauthorized delegations.'
        : 'Exposed: a compromised requester or single-domain orchestrator can drive policy-free signing APIs.',
    },
    {
      id: 'host-ram',
      pattern: 'Host OS root memory dump / single-operator collusion',
      blocked: hostRootBlocked,
      explanation: hostRootBlocked
        ? 'Mitigated: shares reside across distinct trust domains inside HSM/TEE boundaries rather than host RAM.'
        : 'Exposed: unwrapped keys or single-domain MPC nodes remain vulnerable to host root.',
    },
  ]

  const g1Assumptions: string[] = [
    'Policy, allowlist, timelock, and contract-upgrade changes require an independent quorum.',
  ]
  if (sel.hasMpcSeparateDomains) {
    g1Assumptions.push(
      'Threshold t > 1, DKG used (no trusted dealer), and no shared orchestrator can instruct >= t parties.'
    )
  }
  if (sel.hasInBoundaryPolicyHsm) {
    g1Assumptions.push(
      'HSM Security Officer (SO) firmware-loading keys are quorum-protected, and custom in-HSM policy extensions are checked against FIPS 140-3 Excluded Components (IG 2.3.D) and Approved Security Service Indicator (IG 2.4.A/C) scope.'
    )
  }
  if (sel.hasAttestedApproverDisplay) {
    g1Assumptions.push(
      'ERC-7730 descriptors and ERC-8176 attester keys are uncompromised and bounded with expirationTime.'
    )
  }
  if (sel.hasEnclaveCosigner) {
    g1Assumptions.push(
      'Every valid signing quorum requires the attested enclave co-signer, and physical DDR4/DDR5 bus interposers are absent.'
    )
  }

  const residualRisks: string[] = [
    'Compromised requesters can still spend up to configured velocity caps to allowlisted addresses.',
  ]
  if (sel.accountProfile === 'exchange-hot') {
    residualRisks.push(
      'High-throughput exchange hot wallets often use automated API signers that lack a human PSD second screen.'
    )
  }
  if (sel.accountProfile === 'cold-vault') {
    residualRisks.push(
      'Long-lived cold vaults must test recovery quorum separation and on-chain revocation (e.g., clearing EIP-7702 delegations) before an incident.'
    )
  }

  return {
    incidentStatuses,
    blockedCount: incidentStatuses.filter((s) => s.blocked).length,
    g1Assumptions,
    residualRisks,
  }
}

// ── W6: Agent Wallet Scoping Evaluator ───────────────────────────────────────

export type AgentKeyLocation = 'agent-env' | 'host-ram' | 'enclave-or-hsm'

export interface AgentScopeConfig {
  perTxCapUsd: number
  dailyCapUsd: number
  allowlistEnforcedInSigner: boolean
  humanApprovalAboveUsd: number
  credentialTtlMinutes: number
  keyLocation: AgentKeyLocation
}

export interface AgentMistakeOutcome {
  id: 'prompt-injected-payee' | 'runaway-loop' | 'lookalike-address'
  title: string
  attemptedAction: string
  stopped: boolean
  outcome: string
}

export function evaluateAgentScope(cfg: AgentScopeConfig): AgentMistakeOutcome[] {
  const inBoundarySigner = cfg.keyLocation === 'enclave-or-hsm'
  const ttlBounded = cfg.credentialTtlMinutes <= 60

  const promptInjectedStopped =
    inBoundarySigner &&
    cfg.allowlistEnforcedInSigner &&
    (cfg.humanApprovalAboveUsd < 5000 || cfg.perTxCapUsd < 5000)

  const runawayLoopStopped =
    inBoundarySigner && cfg.dailyCapUsd <= 2000 && cfg.perTxCapUsd <= 500 && ttlBounded

  const lookalikeStopped = inBoundarySigner && cfg.allowlistEnforcedInSigner

  return [
    {
      id: 'prompt-injected-payee',
      title: '1. Prompt-Injected Payee Swap',
      attemptedAction:
        'Untrusted invoice text injects an instruction to pay $5,000 to attacker address 0xBAD...9999.',
      stopped: promptInjectedStopped,
      outcome: promptInjectedStopped
        ? 'BLOCKED by signer boundary: non-allowlisted address and amount above cap/human-approval gate are rejected even though the LLM requested it.'
        : 'FAILED TO BLOCK: either key sits outside HSM/enclave, allowlist is not enforced inside the signer, or both per-tx cap and human-approval threshold permit $5,000.',
    },
    {
      id: 'runaway-loop',
      title: '2. Runaway Retry Loop',
      attemptedAction:
        'Agent retries a $400 payment 25 times in 10 minutes ($10,000 total) against an allowlisted vendor.',
      stopped: runawayLoopStopped,
      outcome: runawayLoopStopped
        ? `BLOCKED after daily cap ($${cfg.dailyCapUsd}) is reached inside the signer; short ${cfg.credentialTtlMinutes}m grant TTL limits blast window.`
        : 'EXCESS LOSS: daily cap > $2,000, per-tx cap > $500, TTL > 60m, or host-held keys allow sustained automated draining.',
    },
    {
      id: 'lookalike-address',
      title: '3. Look-Alike Address Poisoning',
      attemptedAction:
        'Agent copies a poisoned lookalike address sharing the first/last 4 hex chars from recent chain history.',
      stopped: lookalikeStopped,
      outcome: lookalikeStopped
        ? 'BLOCKED by signer allowlist: exact full-address match inside enclave/HSM rejects lookalike vanity address.'
        : 'FAILED TO BLOCK: without an exact signer-enforced allowlist inside HSM/TEE, the agent signs to the poisoned vanity address.',
    },
  ]
}
