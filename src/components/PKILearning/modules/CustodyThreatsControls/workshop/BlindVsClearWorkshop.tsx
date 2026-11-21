// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { ShieldAlert, CheckCircle2, XCircle, Eye, Lock } from 'lucide-react'
import { bytesToHex } from '@noble/hashes/utils.js'
import { Button } from '@/components/ui/button'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import { ScopeTransparencyBanner } from '@/components/ui/ScopeTransparencyBanner'
import { useHSM } from '@/hooks/useHSM'
import { hsm_generateECKeyPair, hsm_ecdsaSign, hsm_ecdsaVerify } from '@/wasm/softhsm/classical'
import { CKM_ECDSA } from '@/wasm/softhsm/constants'
import {
  buildW1Payload,
  evaluateW1Policy,
  hashW1Payload,
  type PayloadKind,
} from './frostPolicyHelpers'

interface BlindVsClearProps {
  initialPreset?: string
}

export const BlindVsClearWorkshop: React.FC<BlindVsClearProps> = ({ initialPreset }) => {
  const hsm = useHSM('rust')
  const [payloadKind, setPayloadKind] = useState<PayloadKind>(
    initialPreset === 'delegatecall-swap' ? 'delegatecall-upgrade' : 'transfer'
  )
  const [guardMode, setGuardMode] = useState<'blind' | 'parse-only' | 'parse-and-policy'>('blind')
  const [keyPair, setKeyPair] = useState<{ pubHandle: number; privHandle: number } | null>(null)
  const [signResult, setSignResult] = useState<{
    attempted: boolean
    signed: boolean
    verified: boolean | null
    digestHex: string
    sigHex: string | null
    policyReason: string
    decodedOp: string
  } | null>(null)
  const [errMsg, setErrMsg] = useState<string | null>(null)

  const activeKeyPair = hsm.isReady ? keyPair : null

  const payload = buildW1Payload(payloadKind)

  const handleGenerateKey = () => {
    if (!hsm.moduleRef.current || !hsm.hSessionRef.current) return
    setErrMsg(null)
    try {
      const kp = hsm_generateECKeyPair(
        hsm.moduleRef.current,
        hsm.hSessionRef.current,
        'secp256k1',
        false,
        'sign'
      )
      setKeyPair(kp)
      hsm.addStepLog('Generated non-extractable secp256k1 keypair in SoftHSMv3')
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : 'Key generation failed')
    }
  }

  const handleSignAttempt = () => {
    if (!hsm.moduleRef.current || !hsm.hSessionRef.current) return
    setErrMsg(null)
    try {
      let kp = activeKeyPair
      if (!kp) {
        kp = hsm_generateECKeyPair(
          hsm.moduleRef.current,
          hsm.hSessionRef.current,
          'secp256k1',
          false,
          'sign'
        )
        setKeyPair(kp)
      }

      const digest = hashW1Payload(payload)
      const policy = evaluateW1Policy(payload, guardMode)

      if (!policy.allowedToSign) {
        hsm.addStepLog(`Blocked before C_Sign: ${policy.decoded.decodedOperation}`)
        setSignResult({
          attempted: true,
          signed: false,
          verified: null,
          digestHex: bytesToHex(digest),
          sigHex: null,
          policyReason: policy.reason,
          decodedOp: policy.decoded.decodedOperation,
        })
        return
      }

      const sig = hsm_ecdsaSign(
        hsm.moduleRef.current,
        hsm.hSessionRef.current,
        kp.privHandle,
        digest,
        CKM_ECDSA
      )
      const verified = hsm_ecdsaVerify(
        hsm.moduleRef.current,
        hsm.hSessionRef.current,
        kp.pubHandle,
        digest,
        sig,
        CKM_ECDSA,
        true
      )
      hsm.addStepLog(`Signed 32-byte digest with CKM_ECDSA (${payload.kind})`)
      setSignResult({
        attempted: true,
        signed: true,
        verified,
        digestHex: bytesToHex(digest),
        sigHex: bytesToHex(sig),
        policyReason: policy.reason,
        decodedOp: policy.decoded.decodedOperation,
      })
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : 'Signing failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="p-3 rounded-lg bg-status-warning/10 border border-status-warning/30 text-xs text-muted-foreground">
        <strong className="text-foreground">Simulation Scope Disclaimer:</strong> Browser SoftHSMv3
        (WASM) is an educational emulator, not a FIPS 140-3 validated module. Calldata parsing and
        policy enforcement logic outside PKCS#11 calls run in page JavaScript.
      </div>

      <LiveHSMToggle
        hsm={hsm}
        operations={[
          'C_GenerateKeyPair (secp256k1)',
          'C_Sign (CKM_ECDSA raw 32-byte digest)',
          'C_Verify (CKM_ECDSA)',
        ]}
      />

      <ScopeTransparencyBanner
        realOps={[
          'Real PKCS#11 C_GenerateKeyPair (secp256k1, CKA_EXTRACTABLE=false) inside SoftHSMv3 WASM',
          'Real PKCS#11 C_Sign / C_Verify with raw CKM_ECDSA over 32-byte SHA-256 payload digest',
        ]}
        simulatedOps={[
          'Browser frontend UI spoofing and calldata parsing / policy evaluation in page JavaScript',
          'Ethereum proxy contract upgrade target (no live chain RPC broadcast)',
        ]}
      />

      {/* Step Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-panel p-5 space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Eye size={16} className="text-primary" aria-hidden="true" />
            1. What the Compromised Frontend Displays vs Submits
          </h3>

          <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs space-y-1">
            <p className="text-muted-foreground uppercase tracking-wide font-semibold">
              Browser Screen Summary (Always Shows Benign Text):
            </p>
            <p className="text-foreground font-medium">{payload.displayedSummary}</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground">
              Select Actual Submitted Payload:
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={payloadKind === 'transfer' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setPayloadKind('transfer')
                  setSignResult(null)
                }}
              >
                Benign Transfer (allowlisted)
              </Button>
              <Button
                variant={payloadKind === 'delegatecall-upgrade' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setPayloadKind('delegatecall-upgrade')
                  setSignResult(null)
                }}
              >
                Hidden delegatecall Upgrade (Bybit pattern)
              </Button>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-muted/30 border border-border text-xs font-mono space-y-1 break-all">
            <p>
              <span className="text-muted-foreground">to:</span> {payload.to}
            </p>
            <p>
              <span className="text-muted-foreground">method:</span> {payload.method}
            </p>
            <p>
              <span className="text-muted-foreground">calldata:</span> {payload.calldataHex}
            </p>
          </div>
        </div>

        <div className="glass-panel p-5 space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Lock size={16} className="text-primary" aria-hidden="true" />
            2. Custody Boundary Mode Before C_Sign(CKM_ECDSA)
          </h3>

          <div className="space-y-2" role="radiogroup" aria-label="Signing boundary mode">
            {(
              [
                {
                  id: 'blind',
                  label: 'Blind sign (HSM receives raw 32B hash only)',
                },
                {
                  id: 'parse-only',
                  label: 'Parse only (decodes calldata warning, no policy block)',
                },
                {
                  id: 'parse-and-policy',
                  label: 'Parse + policy check before sign (blocks delegatecall)',
                },
              ] as const
            ).map((opt) => (
              <label
                key={opt.id}
                className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-muted/20 cursor-pointer text-xs text-foreground"
              >
                <input
                  type="radio"
                  name="w1-guard-mode"
                  value={opt.id}
                  checked={guardMode === opt.id}
                  onChange={() => {
                    setGuardMode(opt.id)
                    setSignResult(null)
                  }}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="outline" size="sm" disabled={!hsm.isReady} onClick={handleGenerateKey}>
              Generate secp256k1 Key
            </Button>
            <Button size="sm" disabled={!hsm.isReady} onClick={handleSignAttempt}>
              Execute Signing Request
            </Button>
          </div>

          {activeKeyPair ? (
            <p className="text-xs text-muted-foreground">
              Active HSM Handles: priv={activeKeyPair.privHandle}, pub={activeKeyPair.pubHandle}{' '}
              (non-extractable)
            </p>
          ) : null}
          {errMsg ? <p className="text-xs text-status-error">{errMsg}</p> : null}
        </div>
      </div>

      {/* Outcome Panel */}
      {signResult ? (
        <div
          className={`p-4 rounded-xl border space-y-2 ${
            !signResult.signed
              ? 'bg-status-success/10 border-status-success/30'
              : payloadKind === 'delegatecall-upgrade'
                ? 'bg-status-error/10 border-status-error/30'
                : 'bg-status-success/10 border-status-success/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {!signResult.signed ? (
              <CheckCircle2 size={18} className="text-status-success" aria-hidden="true" />
            ) : payloadKind === 'delegatecall-upgrade' ? (
              <ShieldAlert size={18} className="text-status-error" aria-hidden="true" />
            ) : (
              <CheckCircle2 size={18} className="text-status-success" aria-hidden="true" />
            )}
            <h4 className="text-sm font-bold text-foreground">
              {!signResult.signed
                ? 'Malicious Payload Refused Before C_Sign'
                : payloadKind === 'delegatecall-upgrade'
                  ? 'HSM Signed Malicious delegatecall Upgrade!'
                  : 'Benign Allowlisted Transfer Signed & Verified'}
            </h4>
          </div>
          <p className="text-xs text-muted-foreground">{signResult.policyReason}</p>
          {guardMode !== 'blind' ? (
            <p className="text-xs text-foreground">
              <strong>Decoded Operation:</strong> {signResult.decodedOp}
            </p>
          ) : null}
          <p className="text-xs font-mono text-muted-foreground break-all">
            SHA-256 Digest: {signResult.digestHex}
          </p>
          {signResult.sigHex ? (
            <p className="text-xs font-mono text-muted-foreground break-all">
              CKM_ECDSA Signature (64B r||s): {signResult.sigHex} (C_Verify:{' '}
              {signResult.verified ? (
                <span className="text-status-success font-semibold">VALID</span>
              ) : (
                <span className="text-status-error font-semibold">
                  <XCircle size={12} className="inline mr-1" />
                  INVALID
                </span>
              )}
              )
            </p>
          ) : null}
        </div>
      ) : null}

      {hsm.isReady ? <Pkcs11LogPanel log={hsm.log} onClear={hsm.clearLog} /> : null}
    </div>
  )
}
