// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { CheckCircle2, ShieldAlert, Cpu, Lock, KeyRound } from 'lucide-react'
import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex } from '@noble/hashes/utils.js'
import { Button } from '@/components/ui/button'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import { ScopeTransparencyBanner } from '@/components/ui/ScopeTransparencyBanner'
import { useHSM } from '@/hooks/useHSM'
import { hsm_generateMLDSAKeyPair, hsm_signBytesMLDSA, hsm_verifyBytes } from '@/wasm/softhsm/pqc'
import {
  DEFAULT_FROST_PARTIES,
  runFrost2of3Dkg,
  runFrost2of3Signing,
  type FrostDkgResult,
  type FrostPartyPolicy,
  type FrostSigningRunResult,
} from './frostPolicyHelpers'

interface ThresholdSigningProps {
  initialPreset?: string
}

export const ThresholdSigningWorkshop: React.FC<ThresholdSigningProps> = ({ initialPreset }) => {
  const hsm = useHSM('rust')
  const [dkg, setDkg] = useState<FrostDkgResult | null>(null)
  const [partyAuthKeys, setPartyAuthKeys] = useState<{ pubHandle: number; privHandle: number }[]>(
    []
  )
  const [policies, setPolicies] = useState<FrostPartyPolicy[]>(DEFAULT_FROST_PARTIES)
  const [txAmountEth, setTxAmountEth] = useState(initialPreset === 'happy' ? 15 : 40)
  const [sharePlacementMode, setSharePlacementMode] = useState<'host-ram' | 'in-hsm-conceptual'>(
    'host-ram'
  )
  const [runResult, setRunResult] = useState<FrostSigningRunResult | null>(null)
  const [hsmAuthResults, setHsmAuthResults] = useState<boolean[]>([])
  const [errMsg, setErrMsg] = useState<string | null>(null)

  const activePartyAuthKeys = hsm.isReady ? partyAuthKeys : []
  const activeHsmAuthResults = hsm.isReady ? hsmAuthResults : []

  const handleRunDkgAndAuth = () => {
    setErrMsg(null)
    try {
      const nextDkg = runFrost2of3Dkg()
      setDkg(nextDkg)
      setRunResult(null)
      setHsmAuthResults([])

      if (hsm.isReady && hsm.moduleRef.current && hsm.hSessionRef.current) {
        const M = hsm.moduleRef.current
        const hSession = hsm.hSessionRef.current
        const keys = [0, 1, 2].map(() => hsm_generateMLDSAKeyPair(M, hSession, 65, false))
        setPartyAuthKeys(keys)
        hsm.addStepLog('Generated 3× ML-DSA-65 party auth keys + completed 3-round FROST DKG')
      }
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : 'DKG failed')
    }
  }

  const handleSignFrost = () => {
    setErrMsg(null)
    setHsmAuthResults([])
    try {
      const activeDkg = dkg ?? runFrost2of3Dkg()
      if (!dkg) setDkg(activeDkg)

      const tx = {
        txId: `FROST-TX-${txAmountEth}`,
        to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        amountEth: txAmountEth,
        memo: '2-of-3 RFC 9591 FROST custody transfer',
      }

      const res = runFrost2of3Signing(activeDkg, policies, tx)
      setRunResult(res)

      if (hsm.isReady && hsm.moduleRef.current && hsm.hSessionRef.current) {
        const M = hsm.moduleRef.current
        const hSession = hsm.hSessionRef.current
        let authKeys = activePartyAuthKeys
        if (authKeys.length < 3) {
          authKeys = [0, 1, 2].map(() => hsm_generateMLDSAKeyPair(M, hSession, 65, false))
          setPartyAuthKeys(authKeys)
        }
        const txDigest = sha256(res.messageBytes)
        const authChecks = res.partyOutcomes.map((p, idx) => {
          if (!p.approved) return false
          const payload = new TextEncoder().encode(
            `${p.identifier}:${p.hidingCommitmentHex ?? ''}:${bytesToHex(txDigest)}`
          )
          // eslint-disable-next-line security/detect-object-injection
          const sig = hsm_signBytesMLDSA(M, hSession, authKeys[idx].privHandle, payload)
          // eslint-disable-next-line security/detect-object-injection
          return hsm_verifyBytes(M, hSession, authKeys[idx].pubHandle, payload, sig, true)
        })
        setHsmAuthResults(authChecks)
        hsm.addStepLog(
          res.success
            ? `FROST 2-of-3 succeeded (${res.approvingCount}/3 approved) + HSM ML-DSA-65 auth verified`
            : `FROST blocked (${res.approvingCount}/3 approved < threshold 2)`
        )
      }
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : 'FROST signing failed')
    }
  }

  const updateCap = (partyIndex: number, nextCap: number) => {
    setPolicies((prev) =>
      prev.map((p, idx) => (idx === partyIndex ? { ...p, maxAmountEth: nextCap } : p))
    )
    setRunResult(null)
  }

  return (
    <div className="space-y-6">
      <div className="p-3 rounded-lg bg-status-warning/10 border border-status-warning/30 text-xs text-muted-foreground">
        <strong className="text-foreground">On-Screen Scope Disclaimer:</strong> The RFC 9591
        secp256k1_FROST threshold protocol runs in page JavaScript, and the browser SoftHSMv3
        emulator is not a FIPS 140-3 validated module. HSM ML-DSA-65 keys authenticate each
        party&rsquo;s Round 1 commitment and policy approval (teaching quorum control, not chain
        migration).
      </div>

      <LiveHSMToggle
        hsm={hsm}
        operations={[
          '3× C_GenerateKeyPair (ML-DSA-65 party auth)',
          'C_SignMessage / C_VerifyMessage (CKM_ML_DSA)',
        ]}
      />

      <ScopeTransparencyBanner
        realOps={[
          'Real 3-round Pedersen DKG and 2-of-3 RFC 9591 FROST (secp256k1_FROST) in page JavaScript via @noble/curves',
          'Real SoftHSMv3 ML-DSA-65 signing & verification of each approving party’s Round 1 commitment',
        ]}
        simulatedOps={[
          'Separate MPC party trust domains (executed in one browser session rather than isolated hosts)',
          '§5b "Share inside the HSM" mode (conceptual architectural diagram only — PKCS#11 v3.2 has no MPC mechanism)',
        ]}
      />

      {/* §5b Toggle */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Cpu size={16} className="text-primary" aria-hidden="true" />
            §5b Architecture Toggle: Where Does the MPC Share Execute?
          </h3>
          <div className="flex flex-wrap gap-2" role="group" aria-label="MPC share execution mode">
            <Button
              size="sm"
              variant={sharePlacementMode === 'host-ram' ? 'default' : 'outline'}
              onClick={() => setSharePlacementMode('host-ram')}
            >
              (a) Share in Host RAM (Live Demo)
            </Button>
            <Button
              size="sm"
              variant={sharePlacementMode === 'in-hsm-conceptual' ? 'default' : 'outline'}
              onClick={() => setSharePlacementMode('in-hsm-conceptual')}
            >
              (b) Share Inside the HSM (Conceptual)
            </Button>
          </div>
        </div>

        {sharePlacementMode === 'host-ram' ? (
          <div className="p-3 rounded-lg bg-status-warning/10 border border-status-warning/30 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">
              Mode (a): Share Stored in HSM at Rest, Decrypted into Host RAM for Signing
            </p>
            <p>
              Just like this browser JavaScript demo, a host/OS root compromise on an MPC node can
              inspect the unwrapped <code className="text-foreground">signingShare s_i</code> and
              ephemeral nonces <code className="text-foreground">(d_i, e_i)</code> in RAM during
              signing rounds.
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-muted/40 border border-primary/40 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-primary">
              <Lock size={14} aria-hidden="true" />
              Conceptual Diagram — Not Executed in Browser HSM (PKCS#11 v3.2 defines no standard
              MPC/threshold mechanism)
            </div>
            <svg
              viewBox="0 0 680 120"
              className="w-full h-auto rounded bg-card border border-border"
              role="img"
              aria-label="Conceptual diagram of Variant (b): FROST signing share s_i, nonces (d_i, e_i), and local policy check execute inside the vendor HSM firmware extension boundary rather than host RAM."
            >
              <rect
                x="14"
                y="20"
                width="170"
                height="80"
                rx="8"
                className="fill-muted/40 stroke-border"
              />
              <text
                x="99"
                y="48"
                textAnchor="middle"
                className="fill-foreground text-[11px] font-semibold"
              >
                Untrusted Host RAM
              </text>
              <text x="99" y="68" textAnchor="middle" className="fill-muted-foreground text-[9px]">
                Sees tx request + commitment
              </text>
              <text x="99" y="84" textAnchor="middle" className="fill-muted-foreground text-[9px]">
                No plaintext s_i or (d_i, e_i)
              </text>

              <line x1="184" y1="60" x2="226" y2="60" className="stroke-primary" strokeWidth="2" />
              <polygon points="226,55 236,60 226,65" className="fill-primary" />

              <rect
                x="238"
                y="12"
                width="428"
                height="96"
                rx="10"
                className="fill-primary/10 stroke-primary"
                strokeWidth="1.5"
              />
              <text
                x="452"
                y="32"
                textAnchor="middle"
                className="fill-primary text-[11px] font-bold"
              >
                HSM PHYSICAL ENCLOSURE (Vendor Firmware Extension, e.g. CodeSafe / FM)
              </text>
              <rect
                x="256"
                y="44"
                width="180"
                height="50"
                rx="6"
                className="fill-card stroke-border"
              />
              <text
                x="346"
                y="66"
                textAnchor="middle"
                className="fill-foreground text-[10px] font-semibold"
              >
                In-HSM Local Policy Engine
              </text>
              <text x="346" y="82" textAnchor="middle" className="fill-muted-foreground text-[9px]">
                Evaluates cap &amp; allowlist
              </text>
              <rect
                x="454"
                y="44"
                width="194"
                height="50"
                rx="6"
                className="fill-card stroke-border"
              />
              <text
                x="551"
                y="66"
                textAnchor="middle"
                className="fill-foreground text-[10px] font-semibold"
              >
                Share s_i + Nonces (d_i, e_i)
              </text>
              <text x="551" y="82" textAnchor="middle" className="fill-muted-foreground text-[9px]">
                Check FIPS 140-3 IG 2.3.D / 10.3.F
              </text>
            </svg>
            <p className="text-xs text-muted-foreground">
              Even when code executes inside the physical enclosure, check whether the custom
              extension is an <strong>Excluded Component</strong> (FIPS 140-3 IG 2.3.D) outside the
              validated cryptographic boundary and how Software/Firmware Loading (IG 10.3.F) is
              authorized.
            </p>
          </div>
        )}
      </div>

      {/* DKG + Per-Party Policy Controls */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <KeyRound size={16} className="text-primary" aria-hidden="true" />
            Live 2-of-3 RFC 9591 FROST DKG &amp; Independent Party Policy Check
          </h3>
          <Button variant="outline" size="sm" onClick={handleRunDkgAndAuth}>
            Run 3-Round DKG {hsm.isReady ? '+ HSM ML-DSA-65 Auth Keys' : ''}
          </Button>
        </div>

        {dkg ? (
          <p className="text-xs font-mono text-muted-foreground break-all">
            Group Public Key (33B secp256k1): {dkg.groupPublicKeyHex}
          </p>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {policies.map((p, idx) => (
            <div
              key={p.partyId}
              className="p-3 rounded-lg bg-muted/30 border border-border space-y-2"
            >
              <p className="text-xs font-bold text-foreground">{p.label}</p>
              <label
                htmlFor={`frost-cap-${p.partyId}`}
                className="block text-xs text-muted-foreground"
              >
                Local Policy Cap (ETH)
              </label>
              <input
                id={`frost-cap-${p.partyId}`}
                type="number"
                min={5}
                max={200}
                value={p.maxAmountEth}
                onChange={(e) => updateCap(idx, Math.max(5, Number(e.target.value) || 5))}
                className="w-full rounded border border-border bg-background px-2.5 py-1 text-xs text-foreground"
              />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label
              htmlFor="frost-tx-amount"
              className="block text-xs font-semibold text-foreground mb-1"
            >
              Proposed Transfer Amount (ETH)
            </label>
            <input
              id="frost-tx-amount"
              type="number"
              min={1}
              max={200}
              value={txAmountEth}
              onChange={(e) => {
                setTxAmountEth(Math.max(1, Number(e.target.value) || 1))
                setRunResult(null)
              }}
              className="w-36 rounded border border-border bg-background px-3 py-1.5 text-sm text-foreground"
            />
          </div>
          <Button size="sm" onClick={handleSignFrost}>
            Sign with FROST (2-of-3)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTxAmountEth(40)
              setRunResult(null)
            }}
          >
            Preset: 40 ETH (Party 2 Refuses, 2-of-3 Succeeds)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTxAmountEth(90)
              setRunResult(null)
            }}
          >
            Preset: 90 ETH (2 Parties Refuse, Blocked)
          </Button>
        </div>

        {errMsg ? <p className="text-xs text-status-error">{errMsg}</p> : null}
      </div>

      {/* Results */}
      {runResult ? (
        <div
          className={`p-4 rounded-xl border space-y-3 ${
            runResult.success
              ? 'bg-status-success/10 border-status-success/30'
              : 'bg-status-error/10 border-status-error/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {runResult.success ? (
              <CheckCircle2 size={18} className="text-status-success" aria-hidden="true" />
            ) : (
              <ShieldAlert size={18} className="text-status-error" aria-hidden="true" />
            )}
            <h4 className="text-sm font-bold text-foreground">
              {runResult.success
                ? `Aggregated 2-of-3 Schnorr Signature Valid (${runResult.approvingCount}/3 parties signed)`
                : runResult.error}
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {runResult.partyOutcomes.map((po, idx) => (
              <div
                key={po.partyId}
                className="p-3 rounded-lg bg-card border border-border space-y-1"
              >
                <p className="font-bold text-foreground">{po.label}</p>
                <p
                  className={
                    po.approved
                      ? 'text-status-success font-semibold'
                      : 'text-status-error font-semibold'
                  }
                >
                  {po.approved ? 'APPROVED' : 'REFUSED'}
                </p>
                <p className="text-muted-foreground">{po.reason}</p>
                {po.hidingCommitmentHex ? (
                  <p className="font-mono text-[10px] text-muted-foreground break-all">
                    D_i: {po.hidingCommitmentHex.slice(0, 22)}...
                  </p>
                ) : null}
                {po.signatureShareHex ? (
                  <p className="font-mono text-[10px] text-muted-foreground break-all">
                    z_i: {po.signatureShareHex.slice(0, 22)}... (verifyShare:{' '}
                    {po.shareVerified ? 'true' : 'false'})
                  </p>
                ) : null}
                {activeHsmAuthResults.length === 3 && po.approved ? (
                  <p className="text-[10px] text-primary font-semibold">
                    HSM ML-DSA-65 Auth: {activeHsmAuthResults[idx] ? 'VERIFIED' : 'FAILED'}
                  </p>
                ) : null}
              </div>
            ))}
          </div>

          {runResult.aggregatedSignatureHex ? (
            <p className="text-xs font-mono text-muted-foreground break-all">
              Aggregated RFC 9591 Signature (65B R||z): {runResult.aggregatedSignatureHex} |
              secp256k1_FROST.verify(): {runResult.finalVerified ? 'true' : 'false'}
            </p>
          ) : null}
        </div>
      ) : null}

      {hsm.isReady ? <Pkcs11LogPanel log={hsm.log} onClear={hsm.clearLog} /> : null}
    </div>
  )
}
