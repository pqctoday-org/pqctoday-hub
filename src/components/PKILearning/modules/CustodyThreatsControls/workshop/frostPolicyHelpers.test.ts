// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  DEFAULT_FROST_PARTIES,
  buildW1Payload,
  evaluateAgentScope,
  evaluateControlCombination,
  evaluateQuorumGate,
  evaluateW1Policy,
  runFrost2of3Dkg,
  runFrost2of3Signing,
} from './frostPolicyHelpers'

describe('W1 blind vs clear signing helpers', () => {
  it('blocks delegatecall upgrade only when parse + policy check are both active', () => {
    const upgrade = buildW1Payload('delegatecall-upgrade')
    expect(evaluateW1Policy(upgrade, 'blind').allowedToSign).toBe(true)
    const parseOnly = evaluateW1Policy(upgrade, 'parse-only')
    expect(parseOnly.decoded.isDelegatecallOrUpgrade).toBe(true)
    expect(parseOnly.allowedToSign).toBe(true) // parsing alone refuses nothing

    const enforced = evaluateW1Policy(upgrade, 'parse-and-policy')
    expect(enforced.allowedToSign).toBe(false)

    const transfer = buildW1Payload('transfer')
    expect(evaluateW1Policy(transfer, 'parse-and-policy').allowedToSign).toBe(true)
  })
})

describe('W2 quorum gate helpers', () => {
  const baseProposal = {
    txId: 'TX-101',
    to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    amountEth: 10,
    calldataHashHex: 'abcd',
    nonce: 'nonce-1',
    expiresAtMs: 2_000_000,
  }

  it('passes valid 2-of-3 quorum and rejects tamper, expiry, and replay nonce', () => {
    expect(
      evaluateQuorumGate({
        signedProposal: baseProposal,
        submittedProposal: baseProposal,
        nowMs: 1_500_000,
        usedNonces: new Set(),
        verifiedApproverCount: 2,
      }).passed
    ).toBe(true)

    expect(
      evaluateQuorumGate({
        signedProposal: baseProposal,
        submittedProposal: { ...baseProposal, amountEth: 99 },
        nowMs: 1_500_000,
        usedNonces: new Set(),
        verifiedApproverCount: 2,
      }).passed
    ).toBe(false)

    expect(
      evaluateQuorumGate({
        signedProposal: baseProposal,
        submittedProposal: baseProposal,
        nowMs: 2_500_000,
        usedNonces: new Set(),
        verifiedApproverCount: 2,
      }).passed
    ).toBe(false)

    expect(
      evaluateQuorumGate({
        signedProposal: baseProposal,
        submittedProposal: baseProposal,
        nowMs: 1_500_000,
        usedNonces: new Set(['nonce-1']),
        verifiedApproverCount: 2,
      }).passed
    ).toBe(false)
  })
})

describe('W3 RFC 9591 2-of-3 secp256k1_FROST DKG + policy + signing', () => {
  it('completes 3-round DKG and succeeds 2-of-3 when 1 party refuses, blocks when 2 refuse, and supports fresh re-runs', () => {
    const dkg = runFrost2of3Dkg()
    expect(dkg.groupPublicKeyHex).toHaveLength(66) // 33-byte compressed secp256k1 point

    // Party 2 cap = 25 ETH; Parties 1 (100) & 3 (80) approve 40 ETH -> 2-of-3 succeeds
    const tx40 = {
      txId: 'TX-40',
      to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      amountEth: 40,
      memo: 'Treasury rebalance',
    }
    const run1 = runFrost2of3Signing(dkg, DEFAULT_FROST_PARTIES, tx40)
    expect(run1.success).toBe(true)
    expect(run1.approvingCount).toBe(2)
    expect(run1.partyOutcomes[1].approved).toBe(false) // Party 2 refused
    expect(run1.partyOutcomes[0].shareVerified).toBe(true)
    expect(run1.partyOutcomes[2].shareVerified).toBe(true)
    expect(run1.finalVerified).toBe(true)
    expect(run1.aggregatedSignatureHex).toHaveLength(130) // 65 bytes

    // Fresh commit() per run allows immediate second run without zeroed-nonce failure
    const run2 = runFrost2of3Signing(dkg, DEFAULT_FROST_PARTIES, {
      ...tx40,
      txId: 'TX-41',
    })
    expect(run2.success).toBe(true)
    expect(run2.finalVerified).toBe(true)

    // 90 ETH exceeds Party 2 (25) and Party 3 (80) -> only 1 approves -> blocked
    const tx90 = { ...tx40, txId: 'TX-90', amountEth: 90 }
    const blocked = runFrost2of3Signing(dkg, DEFAULT_FROST_PARTIES, tx90)
    expect(blocked.success).toBe(false)
    expect(blocked.approvingCount).toBe(1)
    expect(blocked.aggregatedSignatureHex).toBeNull()
  })
})

describe('W4 combination builder & W6 agent wallet scope', () => {
  it('blocks all 4 incident patterns only when full combination is enabled', () => {
    const empty = evaluateControlCombination({
      accountProfile: 'treasury',
      hasInBoundaryPolicyHsm: false,
      hasMpcSeparateDomains: false,
      hasEnclaveCosigner: false,
      hasAttestedApproverDisplay: false,
      hasTimelockAndExpiry: false,
    })
    expect(empty.blockedCount).toBe(0)

    const full = evaluateControlCombination({
      accountProfile: 'treasury',
      hasInBoundaryPolicyHsm: true,
      hasMpcSeparateDomains: true,
      hasEnclaveCosigner: true,
      hasAttestedApproverDisplay: true,
      hasTimelockAndExpiry: true,
    })
    expect(full.blockedCount).toBe(4)
  })

  it('emits conditional W4 Rule G1 assumptions for MPC and in-boundary policy HSM toggles', () => {
    const baseOnly = evaluateControlCombination({
      accountProfile: 'treasury',
      hasInBoundaryPolicyHsm: false,
      hasMpcSeparateDomains: false,
      hasEnclaveCosigner: false,
      hasAttestedApproverDisplay: false,
      hasTimelockAndExpiry: false,
    })
    expect(baseOnly.g1Assumptions.some((a) => a.includes('Threshold t > 1'))).toBe(false)
    expect(baseOnly.g1Assumptions.some((a) => a.includes('Excluded Components'))).toBe(false)

    const mpcOnly = evaluateControlCombination({
      accountProfile: 'treasury',
      hasInBoundaryPolicyHsm: false,
      hasMpcSeparateDomains: true,
      hasEnclaveCosigner: false,
      hasAttestedApproverDisplay: false,
      hasTimelockAndExpiry: false,
    })
    expect(mpcOnly.g1Assumptions.some((a) => a.includes('Threshold t > 1'))).toBe(true)
    expect(mpcOnly.g1Assumptions.some((a) => a.includes('Excluded Components'))).toBe(false)

    const hsmOnly = evaluateControlCombination({
      accountProfile: 'treasury',
      hasInBoundaryPolicyHsm: true,
      hasMpcSeparateDomains: false,
      hasEnclaveCosigner: false,
      hasAttestedApproverDisplay: false,
      hasTimelockAndExpiry: false,
    })
    expect(hsmOnly.g1Assumptions.some((a) => a.includes('Threshold t > 1'))).toBe(false)
    expect(hsmOnly.g1Assumptions.some((a) => a.includes('Excluded Components'))).toBe(true)
  })

  it('blocks $5,000 prompt-injected payee when humanApprovalAboveUsd is 1000 and perTxCapUsd is 5000', () => {
    const outcomes = evaluateAgentScope({
      perTxCapUsd: 5000,
      dailyCapUsd: 2000,
      allowlistEnforcedInSigner: true,
      humanApprovalAboveUsd: 1000,
      credentialTtlMinutes: 30,
      keyLocation: 'enclave-or-hsm',
    })
    const payeeOutcome = outcomes.find((o) => o.id === 'prompt-injected-payee')
    expect(payeeOutcome?.stopped).toBe(true)

    const unblocked = evaluateAgentScope({
      perTxCapUsd: 5000,
      dailyCapUsd: 2000,
      allowlistEnforcedInSigner: true,
      humanApprovalAboveUsd: 5000,
      credentialTtlMinutes: 30,
      keyLocation: 'enclave-or-hsm',
    })
    expect(unblocked.find((o) => o.id === 'prompt-injected-payee')?.stopped).toBe(false)
  })

  it('stops all 3 agent mistakes when enclave/HSM isolation, allowlist, tight caps, and short TTL are set', () => {
    const outcomes = evaluateAgentScope({
      perTxCapUsd: 250,
      dailyCapUsd: 1000,
      allowlistEnforcedInSigner: true,
      humanApprovalAboveUsd: 300,
      credentialTtlMinutes: 15,
      keyLocation: 'enclave-or-hsm',
    })
    expect(outcomes.every((o) => o.stopped)).toBe(true)

    const lax = evaluateAgentScope({
      perTxCapUsd: 10000,
      dailyCapUsd: 50000,
      allowlistEnforcedInSigner: false,
      humanApprovalAboveUsd: 20000,
      credentialTtlMinutes: 1440,
      keyLocation: 'agent-env',
    })
    expect(lax.every((o) => !o.stopped)).toBe(true)
  })
})
