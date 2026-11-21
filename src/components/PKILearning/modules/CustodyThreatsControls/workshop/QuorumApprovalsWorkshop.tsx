// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { CheckCircle2, ShieldAlert, Users, Clock, Repeat, FileWarning } from 'lucide-react'
import { bytesToHex } from '@noble/hashes/utils.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { Button } from '@/components/ui/button'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import { ScopeTransparencyBanner } from '@/components/ui/ScopeTransparencyBanner'
import { useHSM } from '@/hooks/useHSM'
import { hsm_generateECKeyPair, hsm_ecdsaSign, hsm_ecdsaVerify } from '@/wasm/softhsm/classical'
import { hsm_generateMLDSAKeyPair, hsm_signBytesMLDSA, hsm_verifyBytes } from '@/wasm/softhsm/pqc'
import { CKM_ECDSA } from '@/wasm/softhsm/constants'
import {
  encodeQuorumApprovalBytes,
  evaluateQuorumGate,
  type QuorumProposal,
} from './frostPolicyHelpers'

interface ApproverKey {
  label: string
  pubHandle: number
  privHandle: number
}

const INITIAL_BASE_TIME = 1_800_000_000_000

export const QuorumApprovalsWorkshop: React.FC = () => {
  const hsm = useHSM('rust')
  const [approvers, setApprovers] = useState<ApproverKey[]>([])
  const [signerKey, setSignerKey] = useState<{ pubHandle: number; privHandle: number } | null>(null)
  const [nonceCounter, setNonceCounter] = useState(1)
  const [usedNonces, setUsedNonces] = useState<string[]>([])
  const [amountEth, setAmountEth] = useState(15)
  const [faultMode, setFaultMode] = useState<'valid' | 'tamper-amount' | 'expired' | 'replay'>(
    'valid'
  )
  const [result, setResult] = useState<{
    passed: boolean
    reasons: string[]
    mlDsaVerifies: boolean[]
    ecdsaSigHex: string | null
    ecdsaVerified: boolean | null
    nonceUsed: string
  } | null>(null)
  const [errMsg, setErrMsg] = useState<string | null>(null)

  const activeApprovers = hsm.isReady ? approvers : []
  const activeSignerKey = hsm.isReady ? signerKey : null

  const ensureKeys = () => {
    const M = hsm.moduleRef.current
    const hSession = hsm.hSessionRef.current
    if (!M || !hSession) return null
    let currentApprovers = activeApprovers
    if (currentApprovers.length < 3) {
      const names = ['Approver 1 (Treasury)', 'Approver 2 (Risk)', 'Approver 3 (Compliance)']
      currentApprovers = names.map((label) => ({
        label,
        ...hsm_generateMLDSAKeyPair(M, hSession, 65, false),
      }))
      setApprovers(currentApprovers)
    }
    let currentSigner = activeSignerKey
    if (!currentSigner) {
      currentSigner = hsm_generateECKeyPair(M, hSession, 'secp256k1', false, 'sign')
      setSignerKey(currentSigner)
    }
    return { M, hSession, currentApprovers, currentSigner }
  }

  const handleRunQuorum = (modeOverride?: 'valid' | 'tamper-amount' | 'expired' | 'replay') => {
    const activeMode = modeOverride ?? faultMode
    if (modeOverride) setFaultMode(modeOverride)
    setErrMsg(null)
    try {
      const ctx = ensureKeys()
      if (!ctx) return
      const { M, hSession, currentApprovers, currentSigner } = ctx

      const activeNonce =
        activeMode === 'replay' && usedNonces.length > 0
          ? usedNonces[0]
          : `quorum-nonce-${nonceCounter}`

      const baseNow = INITIAL_BASE_TIME
      const signedProposal: QuorumProposal = {
        txId: `TX-${nonceCounter}`,
        to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        amountEth,
        calldataHashHex: '0x4f91a2c8e1d0b73a',
        nonce: activeNonce,
        expiresAtMs: baseNow + 300_000,
      }

      const signedBytes = encodeQuorumApprovalBytes(signedProposal)
      // 2-of-3 approvers sign the decoded transaction + nonce + expiry with ML-DSA-65 in HSM
      const sig0 = hsm_signBytesMLDSA(M, hSession, currentApprovers[0].privHandle, signedBytes)
      const sig1 = hsm_signBytesMLDSA(M, hSession, currentApprovers[1].privHandle, signedBytes)

      const submittedProposal: QuorumProposal =
        activeMode === 'tamper-amount'
          ? { ...signedProposal, amountEth: signedProposal.amountEth + 500 }
          : signedProposal

      const submittedBytes = encodeQuorumApprovalBytes(submittedProposal)
      const checkNow =
        activeMode === 'expired' ? signedProposal.expiresAtMs + 60_000 : baseNow + 10_000

      // Verify ML-DSA-65 approvals against the submitted proposal bytes
      const v0 = hsm_verifyBytes(
        M,
        hSession,
        currentApprovers[0].pubHandle,
        submittedBytes,
        sig0,
        true
      )
      const v1 = hsm_verifyBytes(
        M,
        hSession,
        currentApprovers[1].pubHandle,
        submittedBytes,
        sig1,
        true
      )
      const verifiedCount = (v0 ? 1 : 0) + (v1 ? 1 : 0)

      const gate = evaluateQuorumGate({
        signedProposal,
        submittedProposal,
        nowMs: checkNow,
        usedNonces: new Set(usedNonces),
        verifiedApproverCount: verifiedCount,
        requiredThreshold: 2,
      })

      if (!gate.passed) {
        hsm.addStepLog(`Quorum gate REJECTED (${activeMode}): C_Sign(CKM_ECDSA) skipped`)
        setResult({
          passed: false,
          reasons: gate.failureReasons,
          mlDsaVerifies: [v0, v1],
          ecdsaSigHex: null,
          ecdsaVerified: null,
          nonceUsed: activeNonce,
        })
        return
      }

      const txDigest = sha256(submittedBytes)
      const ecdsaSig = hsm_ecdsaSign(M, hSession, currentSigner.privHandle, txDigest, CKM_ECDSA)
      const ecdsaVerified = hsm_ecdsaVerify(
        M,
        hSession,
        currentSigner.pubHandle,
        txDigest,
        ecdsaSig,
        CKM_ECDSA,
        true
      )
      setUsedNonces((prev) => (prev.includes(activeNonce) ? prev : [...prev, activeNonce]))
      setNonceCounter((c) => c + 1)
      hsm.addStepLog(`2-of-3 ML-DSA-65 approvals verified -> signed secp256k1 tx (${activeNonce})`)
      setResult({
        passed: true,
        reasons: [
          '2-of-3 ML-DSA-65 approvals verified, nonce fresh, TTL valid -> secp256k1 C_Sign executed.',
        ],
        mlDsaVerifies: [v0, v1],
        ecdsaSigHex: bytesToHex(ecdsaSig),
        ecdsaVerified,
        nonceUsed: activeNonce,
      })
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : 'Quorum execution error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="p-3 rounded-lg bg-status-warning/10 border border-status-warning/30 text-xs text-muted-foreground">
        <strong className="text-foreground">Simulation Scope Disclaimer:</strong> Browser SoftHSMv3
        (WASM) is an educational emulator, not a FIPS 140-3 validated module. Quorum nonce/expiry
        policy checks run in page JavaScript; this control-plane demo uses ML-DSA-65 approvals
        gating a classical secp256k1 chain signature (not chain-level PQC migration).
      </div>

      <LiveHSMToggle
        hsm={hsm}
        operations={[
          '3× C_GenerateKeyPair (ML-DSA-65 approvers)',
          '1× C_GenerateKeyPair (secp256k1 custody signer)',
          'C_SignMessage / C_VerifyMessage (CKM_ML_DSA)',
          'C_Sign (CKM_ECDSA)',
        ]}
      />

      <ScopeTransparencyBanner
        realOps={[
          'Real HSM ML-DSA-65 signing & verification for 2-of-3 approvers in SoftHSMv3',
          'Real HSM secp256k1 CKM_ECDSA signing only when the 4-part policy gate passes',
        ]}
        simulatedOps={[
          'Decoded transaction proposal assembly, nonce tracking, and expiry clock in page JavaScript',
        ]}
      />

      <div className="glass-panel p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Users size={16} className="text-primary" aria-hidden="true" />
            2-of-3 ML-DSA-65 Quorum Gating secp256k1 Custody Signing
          </h3>
          <span className="text-xs text-muted-foreground">
            Spent nonces recorded: {usedNonces.length}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label htmlFor="w2-amount" className="block font-semibold text-foreground mb-1">
              Transfer Amount (ETH)
            </label>
            <input
              id="w2-amount"
              type="number"
              min={1}
              max={500}
              value={amountEth}
              onChange={(e) => setAmountEth(Math.max(1, Number(e.target.value) || 1))}
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground"
            />
          </div>
          <div className="p-3 rounded-lg bg-muted/40 border border-border">
            <p className="font-semibold text-foreground">Signer Policy Gate Checks</p>
            <p className="text-muted-foreground mt-1">
              (1) Fresh unused nonce, (2) Not expired, (3) Exact payload match against ML-DSA-65
              signed bytes, (4) &ge; 2 valid approver signatures.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={!hsm.isReady} onClick={() => handleRunQuorum('valid')}>
            Run Valid 2-of-3 Approval
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!hsm.isReady}
            onClick={() => handleRunQuorum('tamper-amount')}
          >
            <FileWarning size={14} className="mr-1" aria-hidden="true" />
            Fault: Tamper Amount (+500 ETH)
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!hsm.isReady}
            onClick={() => handleRunQuorum('expired')}
          >
            <Clock size={14} className="mr-1" aria-hidden="true" />
            Fault: Expired Approval
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!hsm.isReady || usedNonces.length === 0}
            onClick={() => handleRunQuorum('replay')}
          >
            <Repeat size={14} className="mr-1" aria-hidden="true" />
            Fault: Replay Spent Nonce
          </Button>
        </div>

        {usedNonces.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Run &ldquo;Valid 2-of-3 Approval&rdquo; once to record a spent nonce before testing the
            replay fault button.
          </p>
        ) : null}
        {errMsg ? <p className="text-xs text-status-error">{errMsg}</p> : null}
      </div>

      {result ? (
        <div
          className={`p-4 rounded-xl border space-y-2 ${
            result.passed
              ? 'bg-status-success/10 border-status-success/30'
              : 'bg-status-error/10 border-status-error/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {result.passed ? (
              <CheckCircle2 size={18} className="text-status-success" aria-hidden="true" />
            ) : (
              <ShieldAlert size={18} className="text-status-error" aria-hidden="true" />
            )}
            <h4 className="text-sm font-bold text-foreground">
              {result.passed
                ? `Quorum Verified & secp256k1 Transaction Signed (${result.nonceUsed})`
                : `Rejected Before secp256k1 Signing (${faultMode})`}
            </h4>
          </div>
          <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
            {result.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <p className="text-xs text-foreground">
            ML-DSA-65 Approver Verifications: Approver 1 ={' '}
            {result.mlDsaVerifies[0] ? 'VALID' : 'FAILED'}, Approver 2 ={' '}
            {result.mlDsaVerifies[1] ? 'VALID' : 'FAILED'}
          </p>
          {result.ecdsaSigHex ? (
            <p className="text-xs font-mono text-muted-foreground break-all">
              secp256k1 CKM_ECDSA Signature: {result.ecdsaSigHex} (Verified:{' '}
              {result.ecdsaVerified ? 'true' : 'false'})
            </p>
          ) : null}
        </div>
      ) : null}

      {hsm.isReady ? <Pkcs11LogPanel log={hsm.log} onClear={hsm.clearLog} /> : null}
    </div>
  )
}
