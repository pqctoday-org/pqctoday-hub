// SPDX-License-Identifier: GPL-3.0-only
/**
 * Step 2 — Firmware signing with SUIT/COSE.
 *
 * REWRITTEN 2026-10-01. The pre-split step showed `randomHex()` as the
 * signature and a timer as "verification". Now:
 *  - ML-DSA-44/65/87 are signed and verified for real in the hub's SoftHSM
 *    (C_SignMessage / C_VerifyMessage, CKM_ML_DSA), and a tampered manifest is
 *    shown to fail verification.
 *  - LMS is a real HSS (L = 1, LMS_SHA256_M32_H10 / LMOTS_SHA256_N32_W4) key
 *    signed with CKM_HSS; the remaining-signature counter comes from the token.
 *    The engine's HSS verifier is validated against RFC 8554 Appendix F in the
 *    KAT panel below.
 *  - XMSS, FN-DSA and ECDSA are size-only and say so on screen.
 */
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { FileCode, CheckCircle, XCircle, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react'
import {
  BENCH_SOURCES,
  FIRMWARE_ALGORITHMS,
  IOT_DEVICE_TYPES,
  LMS_H10_SIGNATURES,
  MODEL_MCU_HZ,
  SUIT_COSE_OVERHEAD_BYTES,
  algorithmById,
  type FirmwareAlgorithm,
} from '../constants'
import { KatValidationPanel } from '@/components/shared/KatValidationPanel'
import type { KatTestSpec } from '@/utils/katRunner'
import { Button } from '@/components/ui/button'
import { useHSM } from '@/hooks/useHSM'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import {
  hsm_generateMLDSAKeyPair,
  hsm_signBytesMLDSA,
  hsm_verifyBytes,
  hsm_generateHSSKeyPair,
  hsm_statefulSignBytes,
  hsm_statefulVerifyBytes,
  hsm_getKeysRemaining,
  hsm_extractKeyValue,
} from '@/wasm/softhsm'
import { CKM_HSS, CKP_LMS_SHA256_M32_H10, CKP_LMOTS_SHA256_N32_W4 } from '@/wasm/softhsm/constants'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'

export interface FirmwareSigningConfig {
  deviceId?: string
  algId?: string
}

const FIRMWARE_KAT_SPECS: KatTestSpec[] = [
  {
    id: 'iot-fw-mldsa44-sigver',
    useCase: 'Firmware manifest signature, ML-DSA-44',
    standard: 'NIST ACVP (FIPS 204)',
    referenceUrl:
      'https://github.com/usnistgov/ACVP-Server/tree/master/gen-val/json-files/ML-DSA-sigGen-FIPS204',
    libraryRefId: 'FIPS 204',
    kind: { type: 'mldsa-sigver', variant: 44 },
  },
  {
    id: 'iot-fw-mldsa87-sigver',
    useCase: 'Firmware manifest signature, ML-DSA-87 (CNSA 2.0)',
    standard: 'NIST ACVP (FIPS 204)',
    referenceUrl:
      'https://github.com/usnistgov/ACVP-Server/tree/master/gen-val/json-files/ML-DSA-sigGen-FIPS204',
    libraryRefId: 'FIPS 204',
    kind: { type: 'mldsa-sigver', variant: 87 },
  },
  {
    id: 'iot-fw-hss-tc1',
    useCase: 'HSS/LMS firmware verifier, RFC 8554 Test Case 1',
    standard: 'IETF RFC 8554 Appendix F',
    referenceUrl: 'https://www.rfc-editor.org/rfc/rfc8554#appendix-F',
    libraryRefId: 'RFC 8554',
    kind: { type: 'lms-sigver', testCase: 1 },
  },
  {
    id: 'iot-fw-hss-tc2',
    useCase: 'HSS/LMS firmware verifier, RFC 8554 Test Case 2',
    standard: 'IETF RFC 8554 Appendix F',
    referenceUrl: 'https://www.rfc-editor.org/rfc/rfc8554#appendix-F',
    libraryRefId: 'RFC 8554',
    kind: { type: 'lms-sigver', testCase: 2 },
  },
]

const LIVE_OPERATIONS = [
  'C_GenerateKeyPair',
  'C_MessageSignInit',
  'C_SignMessage',
  'C_MessageVerifyInit',
  'C_VerifyMessage',
  'C_SignInit',
  'C_Sign',
  'C_VerifyInit',
  'C_Verify',
]

const toHex = (b: Uint8Array, max = 24) =>
  Array.from(b.slice(0, max), (x) => x.toString(16).padStart(2, '0')).join('') +
  (b.length > max ? '…' : '')

/** Deterministic stand-in firmware image of the device's size. */
function firmwareImage(bytes: number): Uint8Array {
  const out = new Uint8Array(bytes)
  let x = 0x2545f491
  for (let i = 0; i < bytes; i++) {
    x ^= x << 13
    x ^= x >>> 17
    x ^= x << 5
    out[i] = x & 0xff
  }
  return out
}

interface SignOutcome {
  digestHex: string
  manifestText: string
  signatureBytes: number | null
  signaturePreview?: string
  verified?: boolean
  tamperRejected?: boolean
  keysRemaining?: number | null
  publicKeyBytes?: number
  error?: string
}

/** Verify cycles per algorithm, best build first — the ranking panel. */
function verifyRanking() {
  return FIRMWARE_ALGORITHMS.map((fa) => {
    const alg = algorithmById(fa.algId)
    const builds = [alg.builds.stack, alg.builds.speed].filter((b) => b !== undefined)
    const best = builds
      .filter((b) => b.ops.verify)
      .sort((a, b) => a.ops.verify!.cycles - b.ops.verify!.cycles)[0]
    return { fa, alg, cycles: best.ops.verify!.cycles, impl: best.impl, source: best.source }
  }).sort((a, b) => a.cycles - b.cycles)
}

export const FirmwareSigningSimulator: React.FC<{ initial?: FirmwareSigningConfig }> = ({
  initial,
}) => {
  const hsm = useHSM()
  const [deviceId, setDeviceId] = useState(initial?.deviceId ?? 'smart-meter')
  const [algId, setAlgId] = useState(initial?.algId ?? 'ml-dsa-44')
  const [busy, setBusy] = useState(false)
  const [outcome, setOutcome] = useState<SignOutcome | null>(null)
  const keyCache = useRef(new Map<string, { pub: number; priv: number }>())

  const device = IOT_DEVICE_TYPES.find((d) => d.id === deviceId) ?? IOT_DEVICE_TYPES[0]
  const fa: FirmwareAlgorithm =
    FIRMWARE_ALGORITHMS.find((a) => a.id === algId) ?? FIRMWARE_ALGORITHMS[0]
  const alg = algorithmById(fa.algId)
  const isLiveAlg = fa.execution !== 'size-only'
  const live = hsm.isReady && !!hsm.moduleRef.current
  const ranking = useMemo(verifyRanking, [])

  const overheadBytes = alg.outputBytes + SUIT_COSE_OVERHEAD_BYTES
  const firmwareBytes = device.firmwareKB * 1024
  const overheadShare = overheadBytes / (firmwareBytes + overheadBytes)
  const overheadSeconds = (overheadBytes * 8) / (device.downlinkKbps * 1000)
  const firmwareSeconds = (firmwareBytes * 8) / (device.downlinkKbps * 1000)

  const sign = useCallback(async () => {
    setBusy(true)
    setOutcome(null)
    try {
      const image = firmwareImage(firmwareBytes)
      const digest = new Uint8Array(
        await crypto.subtle.digest('SHA-256', image.buffer as ArrayBuffer)
      )
      const digestHex = toHex(digest, 32)
      const manifest = {
        'manifest-version': 1,
        'manifest-sequence-number': 42,
        'common.components': [[device.id, 'firmware']],
        'install.condition-vendor-identifier': 'example.com',
        'install.condition-class-identifier': device.id,
        'image-digest': ['sha-256', digestHex],
        'image-size': firmwareBytes,
      }
      const manifestText = JSON.stringify(manifest, null, 1)
      const manifestBytes = new TextEncoder().encode(manifestText)

      if (!isLiveAlg) {
        setOutcome({ digestHex, manifestText, signatureBytes: null })
        return
      }
      if (!live || !hsm.moduleRef.current) {
        setOutcome({
          digestHex,
          manifestText,
          signatureBytes: null,
          error: 'Live HSM is not ready — enable it above to sign for real.',
        })
        return
      }
      const M = hsm.moduleRef.current as unknown as SoftHSMModule
      const s = hsm.hSessionRef.current
      const tampered = manifestBytes.slice()
      tampered[tampered.length - 2] ^= 0x01

      if (fa.execution === 'live-mldsa' && fa.mldsaVariant) {
        let keys = keyCache.current.get(fa.id)
        if (!keys) {
          const kp = hsm_generateMLDSAKeyPair(M, s, fa.mldsaVariant)
          keys = { pub: kp.pubHandle, priv: kp.privHandle }
          keyCache.current.set(fa.id, keys)
        }
        const sig = hsm_signBytesMLDSA(M, s, keys.priv, manifestBytes)
        const verified = hsm_verifyBytes(M, s, keys.pub, manifestBytes, sig)
        const tamperRejected = !hsm_verifyBytes(M, s, keys.pub, tampered, sig)
        setOutcome({
          digestHex,
          manifestText,
          signatureBytes: sig.length,
          signaturePreview: toHex(sig),
          verified,
          tamperRejected,
          publicKeyBytes: hsm_extractKeyValue(M, s, keys.pub).length,
        })
      } else {
        let keys = keyCache.current.get(fa.id)
        if (!keys) {
          const kp = hsm_generateHSSKeyPair(
            M,
            s,
            1,
            [CKP_LMS_SHA256_M32_H10],
            [CKP_LMOTS_SHA256_N32_W4]
          )
          keys = { pub: kp.pubHandle, priv: kp.privHandle }
          keyCache.current.set(fa.id, keys)
        }
        const sig = hsm_statefulSignBytes(M, s, CKM_HSS, keys.priv, manifestBytes)
        const verified = hsm_statefulVerifyBytes(M, s, CKM_HSS, keys.pub, manifestBytes, sig) === 0
        const tamperRejected = hsm_statefulVerifyBytes(M, s, CKM_HSS, keys.pub, tampered, sig) !== 0
        setOutcome({
          digestHex,
          manifestText,
          signatureBytes: sig.length,
          signaturePreview: toHex(sig),
          verified,
          tamperRejected,
          keysRemaining: hsm_getKeysRemaining(M, s, keys.priv),
          publicKeyBytes: hsm_extractKeyValue(M, s, keys.pub).length,
        })
      }
    } catch (e) {
      setOutcome({
        digestHex: '',
        manifestText: '',
        signatureBytes: null,
        error: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setBusy(false)
    }
  }, [device, fa, firmwareBytes, hsm, isLiveAlg, live])

  return (
    <div className="space-y-6">
      <p className="text-sm text-foreground/80">
        Sign a firmware manifest the way a SUIT update does: hash the image, put the digest in the
        manifest, sign the manifest. ML-DSA and LMS signatures are computed and verified in the
        browser&apos;s SoftHSM; the other algorithms show sizes only and are labelled.
      </p>

      <LiveHSMToggle hsm={hsm} operations={LIVE_OPERATIONS} />

      <div className="glass-panel p-4">
        <div className="text-sm font-bold text-foreground mb-3">1. Device</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {IOT_DEVICE_TYPES.map((d) => (
            <Button
              variant="ghost"
              key={d.id}
              onClick={() => {
                setDeviceId(d.id)
                setOutcome(null)
              }}
              className={`h-auto flex-col items-start whitespace-normal p-3 rounded-lg border text-left ${
                d.id === deviceId ? 'border-primary bg-primary/10' : 'border-border bg-muted/30'
              }`}
            >
              <div className="text-sm font-bold text-foreground">{d.name}</div>
              <div className="text-[10px] text-muted-foreground mt-1">
                {d.firmwareKB.toLocaleString('en-US')} KiB image · {d.link}
              </div>
            </Button>
          ))}
        </div>
      </div>

      <div className="glass-panel p-4">
        <div className="text-sm font-bold text-foreground mb-3">2. Signature algorithm</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {FIRMWARE_ALGORITHMS.map((a) => {
            const info = algorithmById(a.algId)
            return (
              <Button
                variant="ghost"
                key={a.id}
                onClick={() => {
                  setAlgId(a.id)
                  setOutcome(null)
                }}
                className={`h-auto flex-col items-start whitespace-normal p-3 rounded-lg border text-left ${
                  a.id === algId ? 'border-primary bg-primary/10' : 'border-border bg-muted/30'
                }`}
              >
                <div className="text-sm font-bold text-foreground">{info.name}</div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  Sig {info.outputBytes.toLocaleString('en-US')} B · key{' '}
                  {info.publicKeyBytes.toLocaleString('en-US')} B
                </div>
                <div className="text-[10px] mt-0.5">
                  <span
                    className={
                      a.execution === 'size-only' ? 'text-muted-foreground' : 'text-success'
                    }
                  >
                    {a.execution === 'size-only' ? 'Sizes only' : 'Live in SoftHSM'}
                  </span>
                  {info.stateful && <span className="text-warning"> · stateful</span>}
                </div>
              </Button>
            )
          })}
        </div>
        {fa.cnsa2 === 'allowed' ? (
          <p className="text-[11px] text-success mt-3">
            CNSA 2.0: accepted for national-security-system firmware signing (ML-DSA-87, or LMS/XMSS
            per NIST SP 800-208).
          </p>
        ) : (
          <p className="text-[11px] text-warning mt-3">
            CNSA 2.0: not accepted for national-security-system firmware — CNSA 2.0 allows only
            ML-DSA-87 or LMS/XMSS. Fine for commercial devices that follow FIPS 204 or other
            profiles.
          </p>
        )}
      </div>

      <div className="text-center">
        <Button
          variant="gradient"
          onClick={sign}
          disabled={busy || (isLiveAlg && !live)}
          className="inline-flex items-center gap-2 px-6 py-3 font-bold rounded-lg disabled:opacity-50"
        >
          {busy ? <Loader2 size={18} className="animate-spin" /> : <FileCode size={18} />}
          {busy
            ? fa.execution === 'live-hss' && !keyCache.current.has(fa.id)
              ? 'Generating the 1,024-leaf LMS tree…'
              : 'Signing…'
            : isLiveAlg
              ? 'Sign and verify the manifest'
              : 'Build the manifest (sizes only)'}
        </Button>
        {isLiveAlg && !live && (
          <p className="text-xs text-muted-foreground mt-2">
            Waiting for the live HSM. Nothing is faked while it loads.
          </p>
        )}
      </div>

      {outcome && (
        <div className="glass-panel p-4 space-y-3">
          {outcome.error && (
            <div className="flex items-start gap-2 text-xs text-destructive">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" /> {outcome.error}
            </div>
          )}
          {outcome.digestHex && (
            <div className="text-xs">
              <div className="font-bold text-foreground">
                1. SHA-256 of the {device.firmwareKB} KiB image
              </div>
              <div className="font-mono text-muted-foreground break-all">{outcome.digestHex}</div>
            </div>
          )}
          {outcome.manifestText && (
            <div className="text-xs">
              <div className="font-bold text-foreground">
                2. Manifest (shown as JSON; SUIT encodes it in CBOR per draft-ietf-suit-manifest)
              </div>
              <pre
                className="bg-muted/50 rounded p-2 border border-border font-mono text-[10px] overflow-x-auto"
                // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- required by WCAG: a scrollable region with no focusable content is unreachable by keyboard; axe's documented fix for `scrollable-region-focusable` (same pattern as VpnSimulationPanel.tsx).
                tabIndex={0}
                aria-label="Scrollable code"
              >
                {outcome.manifestText}
              </pre>
            </div>
          )}
          <div className="text-xs">
            <div className="font-bold text-foreground">3. Signature ({alg.name})</div>
            {outcome.signatureBytes !== null ? (
              <div className="space-y-1 mt-1">
                <div className="font-mono text-muted-foreground break-all">
                  {outcome.signatureBytes.toLocaleString('en-US')} B: {outcome.signaturePreview}
                </div>
                <div className="flex items-center gap-1">
                  {outcome.signatureBytes === alg.outputBytes ? (
                    <CheckCircle size={12} className="text-success" />
                  ) : (
                    <XCircle size={12} className="text-destructive" />
                  )}
                  Length {outcome.signatureBytes === alg.outputBytes ? 'matches' : 'differs from'}{' '}
                  {alg.sizeSource} ({alg.outputBytes.toLocaleString('en-US')} B)
                  {outcome.publicKeyBytes !== undefined &&
                    ` · public key read back: ${outcome.publicKeyBytes} B`}
                </div>
                <div className="flex items-center gap-1">
                  {outcome.verified ? (
                    <CheckCircle size={12} className="text-success" />
                  ) : (
                    <XCircle size={12} className="text-destructive" />
                  )}
                  Verify over the manifest: {outcome.verified ? 'valid' : 'INVALID'}
                </div>
                <div className="flex items-center gap-1">
                  {outcome.tamperRejected ? (
                    <CheckCircle size={12} className="text-success" />
                  ) : (
                    <XCircle size={12} className="text-destructive" />
                  )}
                  One bit flipped in the manifest:{' '}
                  {outcome.tamperRejected ? 'rejected, as it must be' : 'ACCEPTED — engine fault'}
                </div>
                {fa.execution === 'live-hss' && (
                  <div className="text-warning">
                    Remaining one-time signatures on this LMS key:{' '}
                    {outcome.keysRemaining ?? 'not published by this engine'} of{' '}
                    {LMS_H10_SIGNATURES.toLocaleString('en-US')}. The counter must never roll back:
                    restoring an old copy of the private key and signing again reuses a leaf and
                    leaks the key.
                  </div>
                )}
              </div>
            ) : (
              !outcome.error && (
                <div className="text-muted-foreground italic mt-1">{fa.simulatedLabel}</div>
              )
            )}
          </div>
          <div className="text-xs">
            <div className="font-bold text-foreground">4. COSE_Sign1 inside the SUIT envelope</div>
            <pre
              className="bg-muted/50 rounded p-2 border border-border font-mono text-[10px] overflow-x-auto"
              // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- required by WCAG: a scrollable region with no focusable content is unreachable by keyboard; axe's documented fix for `scrollable-region-focusable` (same pattern as VpnSimulationPanel.tsx).
              tabIndex={0}
              aria-label="Scrollable code"
            >
              {`COSE_Sign1 = [
  protected:   { 1 (alg): ${fa.coseAlg ?? 'unassigned'} }   / ${fa.coseSource} /
  unprotected: { 4 (kid): h'…' },
  payload:     nil                   / detached: SHA-256 digest of the manifest /
  signature:   bstr .size ${alg.outputBytes}
]`}
            </pre>
          </div>
        </div>
      )}

      {/* Bandwidth */}
      <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
        <div className="text-sm font-bold text-foreground mb-2">
          Update overhead on {device.link} — model estimate
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <div className="text-muted-foreground">Signature + SUIT/COSE</div>
            <div className="font-mono font-bold">{overheadBytes.toLocaleString('en-US')} B</div>
          </div>
          <div>
            <div className="text-muted-foreground">Share of the update</div>
            <div className="font-mono font-bold">{(overheadShare * 100).toFixed(2)}%</div>
          </div>
          <div>
            <div className="text-muted-foreground">Signature airtime</div>
            <div className="font-mono font-bold">{overheadSeconds.toFixed(2)} s</div>
          </div>
          <div>
            <div className="text-muted-foreground">Image airtime</div>
            <div className="font-mono font-bold">{firmwareSeconds.toFixed(0)} s</div>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          At {device.downlinkKbps.toLocaleString('en-US')} kbit/s ({device.linkSource}). The public
          key is provisioned once as the device&apos;s trust anchor, so only the signature travels
          with each update. The image dominates.
        </p>
      </div>

      {/* Verify ranking */}
      <div className="glass-panel p-4">
        <div className="text-sm font-bold text-foreground mb-1">
          Verification cost on the device (fastest build of each)
        </div>
        <p className="text-[10px] text-muted-foreground mb-3">
          Benchmarks on Arm Cortex-M4, time at {MODEL_MCU_HZ / 1e6} MHz; varies by implementation.
        </p>
        <div className="space-y-1">
          {ranking.map((r, i) => (
            <div key={r.fa.id} className="flex items-center justify-between text-xs gap-2">
              <span className="text-foreground">
                {i + 1}. {r.alg.name}
              </span>
              <span className="font-mono text-muted-foreground text-right">
                {(r.cycles / 1e6).toFixed(2)} M cycles ≈{' '}
                {((r.cycles / MODEL_MCU_HZ) * 1000).toFixed(0)} ms · {r.impl} ·{' '}
                {BENCH_SOURCES[r.source].label}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          LMS is not the fastest verifier: FN-DSA-512, ECDSA and the speed-optimised ML-DSA-44 and
          ML-DSA-65 all verify in fewer cycles. LMS&apos;s strengths are the 60-byte key, hash-only
          security assumptions and a tiny verifier stack.
        </p>
      </div>

      <KatValidationPanel
        specs={FIRMWARE_KAT_SPECS}
        label="Firmware signing known-answer tests"
        authorityNote="NIST FIPS 204 · IETF RFC 8554 Appendix F"
      />
      <div className="text-[10px] text-muted-foreground flex items-center gap-1">
        <ShieldCheck size={12} /> The HSS rows run the RFC&apos;s own public key, message and
        signature through the same CKM_HSS verifier this step signs with, and also check that a
        one-bit-flipped signature is refused.
      </div>
    </div>
  )
}
