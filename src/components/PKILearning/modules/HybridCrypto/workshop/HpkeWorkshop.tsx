// SPDX-License-Identifier: GPL-3.0-only
import React, { useCallback, useMemo, useRef, useState } from 'react'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useHSM } from '@/hooks/useHSM'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import { HsmKeyInspector } from '@/components/shared/HsmKeyInspector'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { StepWizard } from '@/components/PKILearning/modules/DigitalAssets/components/StepWizard'
import type { Step } from '@/components/PKILearning/modules/DigitalAssets/components/StepWizard'
import { useStepWizard } from '@/components/PKILearning/modules/DigitalAssets/hooks/useStepWizard'
import { WorkshopOperationLog } from '@/components/PKILearning/common/WorkshopOperationLog'
import {
  hsm_generateECKeyPair,
  hsm_generateMLKEMKeyPair,
  hsm_extractECPoint,
  hsm_extractKeyValue,
  hsm_importGenericSecret,
  hsm_generateHpkeKeyPair,
  hsm_hpkeEncapsulate,
  hsm_hpkeDecapsulate,
  type HpkeMechParams,
} from '@/wasm/softhsm'
import {
  HPKE_KEM,
  HPKE_KDF,
  HPKE_AEAD,
  HPKE_MODE,
  HPKE_MODE_LABEL,
  kemInfo,
  dhkemEncap,
  dhkemDecap,
  dhkemAuthEncap,
  dhkemAuthDecap,
  hybridEncap,
  hybridDecap,
  keySchedule,
  keyScheduleSecure,
  seal,
  open as hpkeOpen,
  sealHandle,
  openHandle,
  hex,
  ecPointRawLen,
  stripEcPointDer,
  type Hctx,
  type HpkeKemId,
  type HpkeKdfId,
  type HpkeAeadId,
  type HpkeModeId,
  type HpkeContext,
  type HpkeContextSecure,
} from '../services/hpkeService'
import { HpkeDiagram, type HpkeDiagramStage } from './HpkeDiagram'

// ── PKCS#11 operations exercised by this workshop ────────────────────────────
const HPKE_LIVE_OPERATIONS = [
  'C_GenerateKeyPair',
  'C_CreateObject',
  'C_DeriveKey',
  'C_Sign',
  'C_EncapsulateKey',
  'C_DecapsulateKey',
  'C_Digest',
  'C_Encrypt',
  'C_Decrypt',
]

const KEM_OPTIONS = [
  { id: String(HPKE_KEM.DHKEM_X25519_HKDF_SHA256), label: 'DHKEM(X25519, HKDF-SHA256)' },
  { id: String(HPKE_KEM.DHKEM_P256_HKDF_SHA256), label: 'DHKEM(P-256, HKDF-SHA256)' },
  { id: String(HPKE_KEM.DHKEM_P384_HKDF_SHA384), label: 'DHKEM(P-384, HKDF-SHA384)' },
  { id: String(HPKE_KEM.DHKEM_P521_HKDF_SHA512), label: 'DHKEM(P-521, HKDF-SHA512)' },
  { id: String(HPKE_KEM.MLKEM768_X25519), label: 'MLKEM768-X25519 (PQ-hybrid)' },
  { id: String(HPKE_KEM.MLKEM768_P256), label: 'MLKEM768-P256 (PQ-hybrid)' },
  { id: String(HPKE_KEM.MLKEM1024_P384), label: 'MLKEM1024-P384 (PQ-hybrid)' },
]
const KDF_OPTIONS = [
  { id: String(HPKE_KDF.HKDF_SHA256), label: 'HKDF-SHA256' },
  { id: String(HPKE_KDF.HKDF_SHA384), label: 'HKDF-SHA384' },
  { id: String(HPKE_KDF.HKDF_SHA512), label: 'HKDF-SHA512' },
]
const AEAD_OPTIONS = [
  { id: String(HPKE_AEAD.AES_128_GCM), label: 'AES-128-GCM' },
  { id: String(HPKE_AEAD.AES_256_GCM), label: 'AES-256-GCM' },
  { id: String(HPKE_AEAD.CHACHA20POLY1305), label: 'ChaCha20-Poly1305' },
]
const ALL_MODE_OPTIONS = [
  { id: String(HPKE_MODE.BASE), label: 'Base' },
  { id: String(HPKE_MODE.PSK), label: 'PSK' },
  { id: String(HPKE_MODE.AUTH), label: 'Auth' },
  { id: String(HPKE_MODE.AUTH_PSK), label: 'AuthPSK' },
]

const toHex = hex
const DEMO_PT = new TextEncoder().encode('The quantum-safe fox jumps over the classical dog.')
const DEMO_AAD = new TextEncoder().encode('hpke-workshop-v1')
const DEMO_PSK_ID = new TextEncoder().encode('hpke-workshop-demo-psk')
const DEMO_INFO = new TextEncoder().encode('pqctoday HPKE workshop')

interface WorkshopState {
  ekH: Uint8Array // classical: raw EC point; hybrid: concat(ekPQ, ekT)
  skRHandle?: number // classical only
  dkPQHandle?: number // hybrid only
  dkTHandle?: number // hybrid only
  skSHandle?: number
  pkSBytes?: Uint8Array
  psk?: Uint8Array
  pskId?: Uint8Array
  // Classical DHKEM path — bytes, matches the byte-exact RFC 9180 A.3 tests.
  sharedSecret?: Uint8Array
  senderCtx?: HpkeContext
  recipientSharedSecret?: Uint8Array
  recipientCtx?: HpkeContext
  // Hybrid KEM path — non-extractable handles throughout (see hpkeService.ts's
  // "Non-extracting hybrid path" note). Never converted to bytes anywhere in
  // this component.
  sharedSecretHandle?: number
  senderCtxSecure?: HpkeContextSecure
  recipientSharedSecretHandle?: number
  recipientCtxSecure?: HpkeContextSecure
  enc?: Uint8Array
  ciphertext?: Uint8Array
  // ── CKM_HPKE candidate-mechanism path — one CKK_HPKE_KEM keypair per side
  // (classical or hybrid, uniformly) instead of the composed path's
  // per-primitive keypairs; Encap/Decap fold KeySchedule in, so `keyHandle`/
  // `baseNonce` below already ARE the derived AEAD key + nonce, not an
  // intermediate shared secret.
  hpkeRecipientPubHandle?: number
  hpkeRecipientPrivHandle?: number
  hpkeSenderPubHandle?: number
  hpkeSenderPrivHandle?: number
  hpkeSenderPkBytes?: Uint8Array
  hpkePskHandle?: number
  candidateKeyHandle?: number
  candidateBaseNonce?: Uint8Array
  candidateRecipientKeyHandle?: number
  candidateRecipientBaseNonce?: Uint8Array
}

type HpkeEngineMode = 'composed' | 'candidate'

function ecCurveOf(kemId: number): 'P-256' | 'P-384' | 'P-521' | 'X25519' | 'X448' {
  return kemInfo(kemId).curve
}

const STEP_DIVIDER = '\n\n' + '━'.repeat(50) + '\n\n'

/**
 * useStepWizard's execute() prepends each new step's result onto the front
 * of `output` (see hooks/useStepWizard.ts) so a live free-form workbench
 * shows its latest attempt first. This is a fixed 6-step lesson instead —
 * a learner reading top to bottom expects Step 1 first, not Step 6 — so
 * reverse the chunks back to the order they were produced, purely for
 * display, without changing the shared hook every other workshop relies on.
 */
function chronological(output: string | Record<string, string> | null): typeof output {
  if (typeof output !== 'string') return output
  return output.split(STEP_DIVIDER).reverse().join(STEP_DIVIDER)
}

function extractRawPoint(
  M: SoftHSMModule,
  hSession: number,
  pubHandle: number,
  curve: 'P-256' | 'P-384' | 'P-521' | 'X25519' | 'X448'
): Uint8Array {
  const raw = hsm_extractECPoint(M, hSession, pubHandle)
  return curve === 'X25519' || curve === 'X448' ? raw : stripEcPointDer(raw, ecPointRawLen(curve))
}

export const HpkeWorkshop: React.FC = () => {
  const hsm = useHSM()
  const [kemId, setKemId] = useState<HpkeKemId>(HPKE_KEM.DHKEM_X25519_HKDF_SHA256)
  const [kdfId, setKdfId] = useState<HpkeKdfId>(HPKE_KDF.HKDF_SHA256)
  const [aeadId, setAeadId] = useState<HpkeAeadId>(HPKE_AEAD.AES_128_GCM)
  const [mode, setMode] = useState<HpkeModeId>(HPKE_MODE.BASE)
  const [stage, setStage] = useState<HpkeDiagramStage>('idle')
  const [engineMode, setEngineMode] = useState<HpkeEngineMode>('composed')
  const stateRef = useRef<WorkshopState>({} as WorkshopState)

  const info = kemInfo(kemId)
  const isHybrid = info.kind === 'hybrid'
  const modeOptions = isHybrid ? ALL_MODE_OPTIONS.slice(0, 2) : ALL_MODE_OPTIONS

  const selectKem = useCallback((id: string) => {
    const next = Number(id) as HpkeKemId
    setKemId(next)
    if (kemInfo(next).kind === 'hybrid')
      setMode((m) => (m === HPKE_MODE.AUTH || m === HPKE_MODE.AUTH_PSK ? HPKE_MODE.BASE : m))
    stateRef.current = {} as WorkshopState
    setStage('idle')
  }, [])

  const STEPS: Step[] = useMemo(
    () => [
      {
        id: 'recipient-keygen',
        title: 'Step 1 — Recipient Keypair',
        description:
          engineMode === 'candidate'
            ? `The recipient generates one CKK_HPKE_KEM keypair in a single call — classical or hybrid shape is selected entirely by \`kemId\` (CKA_PARAMETER_SET); the engine builds ek_H = concat(ek_PQ, ek_T) internally for hybrid suites, so the caller never assembles it by hand.`
            : isHybrid
              ? `The recipient generates two independent keypairs — ML-KEM-${info.kind === 'hybrid' ? info.pqVariant : ''} and ${ecCurveOf(kemId)} — since this SoftHSM build cannot derive both from one seed (RFC 9180 §5.2's sanctioned "shared seed" deviation for hardware that lacks a general-purpose SHAKE256 PRG). The encapsulation key ek_H = concat(ek_PQ, ek_T) — PQ first.`
              : `The recipient generates a ${ecCurveOf(kemId)} keypair. Its public point IS pkR — DHKEM's whole encapsulation key.`,
        code:
          engineMode === 'candidate'
            ? `const { pubHandle, privHandle } = hsm_generateHpkeKeyPair(\n  M, s, kemId  // CKM_HPKE_KEM_KEY_PAIR_GEN\n)`
            : isHybrid
              ? `const mlkem = hsm_generateMLKEMKeyPair(M, s, ${info.kind === 'hybrid' ? info.pqVariant : 768})\nconst ec = hsm_generateECKeyPair(M, s, '${ecCurveOf(kemId)}', false)\nconst ekH = concat(ekPQ, ekT)  // PQ-component-first`
              : `const { pubHandle, privHandle } = hsm_generateECKeyPair(\n  M, s, '${ecCurveOf(kemId)}', false\n)`,
        language: 'javascript',
        actionLabel: 'Generate Recipient Keypair',
        explanationTable: [
          {
            label: 'Mechanism',
            value:
              engineMode === 'candidate'
                ? 'CKM_HPKE_KEM_KEY_PAIR_GEN (candidate)'
                : isHybrid
                  ? 'CKM_ML_KEM_KEY_PAIR_GEN + CKM_EC(_MONTGOMERY)_KEY_PAIR_GEN'
                  : 'CKM_EC(_MONTGOMERY)_KEY_PAIR_GEN',
            description:
              engineMode === 'candidate'
                ? 'One vendor mechanism, one CKK_HPKE_KEM object — not yet OASIS TC allocated'
                : 'PKCS#11 v3.2 keypair generation — HPKE has no keypair mechanism of its own',
          },
          {
            label: 'kem_id',
            value: `0x${kemId.toString(16).padStart(4, '0')}`,
            description: KEM_OPTIONS.find((o) => Number(o.id) === kemId)?.label ?? '',
          },
        ],
      },
      {
        id: 'sender-static',
        title: 'Step 2 — Sender Static Key + PSK',
        description:
          'Generated unconditionally so every mode has a consistent step count. A static sender keypair is only meaningful for Auth/AuthPSK (it is what AuthEncap/AuthDecap authenticate); a PSK+psk_id is only meaningful for PSK/AuthPSK — both are provisioned out-of-band in a real deployment, not derived by HPKE itself.',
        code:
          engineMode === 'candidate'
            ? `const sender = hsm_generateHpkeKeyPair(M, s, kemId)\nconst psk = crypto.getRandomValues(new Uint8Array(32))`
            : `const skS = hsm_generateECKeyPair(M, s, '${ecCurveOf(kemId)}', false)\nconst psk = crypto.getRandomValues(new Uint8Array(32))`,
        language: 'javascript',
        actionLabel: 'Provision Sender Key + PSK',
        explanationTable: [
          {
            label: 'Used by this mode?',
            value: HPKE_MODE_LABEL[mode],
            description:
              mode === HPKE_MODE.BASE
                ? 'Neither — Base mode uses only the recipient KEM keys.'
                : mode === HPKE_MODE.PSK
                  ? 'PSK only.'
                  : mode === HPKE_MODE.AUTH
                    ? 'Sender static key only.'
                    : 'Both.',
          },
        ],
      },
      {
        id: 'encap',
        title: 'Step 3 — Sender: Encap',
        description:
          engineMode === 'candidate'
            ? 'This candidate CKM_HPKE mechanism (a PQCToday vendor proposal, not yet OASIS TC allocated) fuses Encap — plus, for hybrid suites, the PQ/T combiner — AND KeySchedule into one C_EncapsulateKey call: it returns enc alongside an already-derived AEAD key handle and base_nonce. No intermediate shared_secret ever becomes a JS-visible value of ANY kind, extractable or not — unlike the composed path, which always hands back at least a handle for it.'
            : isHybrid
              ? 'PKCS#11 v3.2 defines no CKM_HPKE mechanism (checked against the canonical v3.2 header — no HPKE entry exists). Encap combines CKM_ML_KEM and CKM_ECDH1_DERIVE, then builds ss_H via CKM_CONCATENATE_BASE_AND_KEY/_DATA + CKM_SHA3_256_KEY_DERIVATION — ss_PQ, ss_T, and ss_H all stay non-extractable key handles, never bytes.'
              : 'PKCS#11 v3.2 defines no CKM_HPKE mechanism (checked against the canonical v3.2 header — no HPKE entry exists). Encap is composed from CKM_ECDH1_DERIVE (classical) or CKM_ML_KEM + CKM_ECDH1_DERIVE (PQ-hybrid), then RFC 9180’s LabeledExtract/LabeledExpand built from CKM_HKDF_DERIVE and C_Sign(CKM_SHA*_HMAC).',
        code:
          engineMode === 'candidate'
            ? `const { enc, keyHandle, baseNonce } = hsm_hpkeEncapsulate(\n  M, s, pubHandle,\n  { kemId, kdfId, aeadId, mode, info${mode === HPKE_MODE.AUTH || mode === HPKE_MODE.AUTH_PSK ? ', hSenderStaticKey' : ''}${mode === HPKE_MODE.PSK || mode === HPKE_MODE.AUTH_PSK ? ', hPsk, pskId' : ''} }\n)  // CKM_HPKE — Encap + KeySchedule in ONE call`
            : mode === HPKE_MODE.AUTH || mode === HPKE_MODE.AUTH_PSK
              ? `const { sharedSecret, enc } = dhkemAuthEncap(ctx, kemId, pkR, skS, pkS)`
              : isHybrid
                ? `const { sharedSecretHandle, enc } = hybridEncap(ctx, kemId, ekH)`
                : `const { sharedSecret, enc } = dhkemEncap(ctx, kemId, pkR)`,
        language: 'javascript',
        actionLabel: 'Encapsulate',
        explanationTable:
          engineMode === 'candidate'
            ? [
                {
                  label: 'enc length',
                  value: `${info.Nenc} bytes`,
                  description: isHybrid
                    ? 'concat(ct_PQ, ct_T) — PQ first'
                    : 'The ephemeral DHKEM public key',
                },
                {
                  label: 'keyHandle',
                  value: 'Already the AEAD key',
                  description: 'Step 4 no longer runs KeySchedule — it only Seals with this handle',
                },
              ]
            : [
                {
                  label: 'enc length',
                  value: `${info.Nenc} bytes`,
                  description: isHybrid
                    ? 'concat(ct_PQ, ct_T) — PQ first'
                    : 'The ephemeral DHKEM public key',
                },
                {
                  label: 'shared_secret length',
                  value: `${info.Nsecret} bytes`,
                  description: isHybrid
                    ? 'SHA3-256(concat(ss_PQ, ss_T, ct_T, ek_T, Label)) — draft-irtf-cfrg-concrete-hybrid-kems §4'
                    : 'ExtractAndExpand(dh, kem_context) — RFC 9180 §4.1',
                },
              ],
      },
      {
        id: 'seal',
        title:
          engineMode === 'candidate'
            ? 'Step 4 — Sender: Seal'
            : 'Step 4 — Sender: KeySchedule + Seal',
        description:
          engineMode === 'candidate'
            ? 'KeySchedule already ran inside Step 3’s single CKM_HPKE call — this step only Seals the demo message under the AEAD key handle Step 3 returned, with nonce = base_nonce ⊕ seq.'
            : isHybrid
              ? 'KeySchedule derives key/base_nonce/exporter_secret from the ss_H handle via LabeledExtract (shared_secret used as CKF_HKDF_SALT_KEY — never extracted) then three independent LabeledExpands. `key` is derived straight into a non-extractable CKK_AES/CKK_CHACHA20 handle; Seal consumes it directly.'
              : 'KeySchedule derives key/base_nonce/exporter_secret from the KEM shared_secret via LabeledExtract then three independent LabeledExpands. Seal then encrypts a demo message under the chosen AEAD with nonce = base_nonce ⊕ seq.',
        code:
          engineMode === 'candidate'
            ? `const { ct } = sealHandle(hctx, keyHandle, aeadId, baseNonce, 0, aad, pt)`
            : isHybrid
              ? `const ctx = keyScheduleSecure(hctx, mode, kemId, kdfId, aeadId, sharedSecretHandle, info, psk, pskId)\nconst { ct } = sealHandle(hctx, ctx.keyHandle, aeadId, ctx.baseNonce, 0, aad, pt)`
              : `const ctx = keySchedule(hctx, mode, kemId, kdfId, aeadId, sharedSecret, info, psk, pskId)\nconst { ct } = seal(hctx, ctx.keyBytes, aeadId, ctx.baseNonce, 0, aad, pt)`,
        language: 'javascript',
        actionLabel: engineMode === 'candidate' ? 'Seal' : 'Derive Keys & Seal',
        explanationTable: [
          {
            label: 'AEAD',
            value: AEAD_OPTIONS.find((o) => Number(o.id) === aeadId)?.label ?? '',
            description: '',
          },
          { label: 'Plaintext', value: `"${new TextDecoder().decode(DEMO_PT)}"`, description: '' },
        ],
      },
      {
        id: 'decap',
        title: 'Step 5 — Recipient: Decap',
        description:
          engineMode === 'candidate'
            ? "One C_DecapsulateKey(CKM_HPKE) call mirrors Step 3: it recovers enc's shared value, runs the recipient-side KeySchedule, and returns an already-derived AEAD key handle + base_nonce — again with no shared_secret ever surfacing as a JS value."
            : isHybrid
              ? "The recipient recovers ss_H independently, as its own non-extractable handle — from its own decapsulation key(s) and the sender's enc, without any secret ever crossing the wire OR ever existing as bytes on either side."
              : "The recipient recovers the identical shared_secret independently — from its own decapsulation key(s) and the sender's enc — without any secret ever crossing the wire.",
        code:
          engineMode === 'candidate'
            ? `const { keyHandle, baseNonce } = hsm_hpkeDecapsulate(\n  M, s, privHandle, enc,\n  { kemId, kdfId, aeadId, mode, info${mode === HPKE_MODE.AUTH || mode === HPKE_MODE.AUTH_PSK ? ', senderPk' : ''}${mode === HPKE_MODE.PSK || mode === HPKE_MODE.AUTH_PSK ? ', hPsk, pskId' : ''} }\n)  // CKM_HPKE — Decap + KeySchedule in ONE call`
            : mode === HPKE_MODE.AUTH || mode === HPKE_MODE.AUTH_PSK
              ? `const sharedSecret = dhkemAuthDecap(ctx, kemId, enc, skR, pkR, pkS)`
              : isHybrid
                ? `const sharedSecretHandle = hybridDecap(ctx, kemId, enc, dkPQ, dkT, ekH)`
                : `const sharedSecret = dhkemDecap(ctx, kemId, enc, skR, pkR)`,
        language: 'javascript',
        actionLabel: 'Decapsulate',
        explanationTable:
          engineMode === 'candidate' || isHybrid
            ? [
                {
                  label: 'Verification',
                  value: 'Proven functionally in Step 6, not by comparison here',
                  description:
                    engineMode === 'candidate'
                      ? 'This mechanism never surfaces a shared_secret to compare — equality can only be proven by Seal/Open succeeding end-to-end'
                      : 'Neither shared_secret is ever readable as bytes — equality can only be proven by Seal/Open succeeding end-to-end',
                },
              ]
            : [
                {
                  label: 'Verification',
                  value: 'Compared to sender shared_secret',
                  description:
                    'Both sides derive this independently — a mismatch here means the recipient cannot decrypt anything',
                },
              ],
      },
      {
        id: 'open',
        title:
          engineMode === 'candidate'
            ? 'Step 6 — Recipient: Open'
            : 'Step 6 — Recipient: KeySchedule + Open',
        description:
          engineMode === 'candidate'
            ? 'KeySchedule already ran inside Step 5’s single CKM_HPKE call — this step only Opens the ciphertext through the AEAD key handle Step 5 returned. AES-GCM/ChaCha20-Poly1305 authentication fails closed on any mismatch, so this succeeding is still the end-to-end correctness proof.'
            : isHybrid
              ? "The recipient runs the same non-extracting KeySchedule and Opens the ciphertext through its own never-extracted key handle. Since neither side's shared_secret or AEAD key was ever readable as bytes, this Open succeeding IS the proof they matched — not a separate hex comparison."
              : 'The recipient runs the same KeySchedule and Opens the ciphertext. AES-GCM/ChaCha20-Poly1305 authentication fails closed on any tampering — this is what actually proves round-trip correctness, not just secret agreement.',
        code:
          engineMode === 'candidate'
            ? `const pt = openHandle(hctx, keyHandle, aeadId, baseNonce, 0, aad, ct)`
            : isHybrid
              ? `const ctx2 = keyScheduleSecure(hctx, mode, kemId, kdfId, aeadId, recipientSharedSecretHandle, info, psk, pskId)\nconst pt = openHandle(hctx, ctx2.keyHandle, aeadId, ctx2.baseNonce, 0, aad, ct)`
              : `const ctx2 = keySchedule(hctx, mode, kemId, kdfId, aeadId, sharedSecret, info, psk, pskId)\nconst pt = open(hctx, ctx2.keyBytes, aeadId, ctx2.baseNonce, 0, aad, ct)`,
        language: 'javascript',
        actionLabel: engineMode === 'candidate' ? 'Open' : 'Derive Keys & Open',
        explanationTable: [
          {
            label: 'Expected plaintext',
            value: `"${new TextDecoder().decode(DEMO_PT)}"`,
            description: '',
          },
        ],
      },
    ],
    [kemId, aeadId, mode, isHybrid, info, engineMode]
  )

  const wizard = useStepWizard({ steps: STEPS, onBack: () => {} })

  const handleReset = useCallback(() => {
    stateRef.current = {} as WorkshopState
    setStage('idle')
    wizard.reset()
    hsm.clearKeys()
    hsm.clearLog()
  }, [wizard, hsm])

  // Switching the composed/candidate sequence mid-run leaves stale
  // per-engine state (e.g. a composed-mode handle at a step index whose
  // candidate-mode branch expects a candidate-mode handle) — reset the
  // wizard's step position too, not just the workshop's own key/secret state.
  const selectEngineMode = useCallback(
    (next: HpkeEngineMode) => {
      setEngineMode(next)
      stateRef.current = {} as WorkshopState
      setStage('idle')
      wizard.reset()
      hsm.clearKeys()
      hsm.clearLog()
    },
    [wizard, hsm]
  )

  const executeCurrentStep = useCallback(async (): Promise<string> => {
    if (!hsm.isReady || !hsm.moduleRef.current || !hsm.hSessionRef.current) {
      throw new Error('HSM session is not ready. Enable the HSM toggle above first.')
    }
    const M = hsm.moduleRef.current
    const hSession = hsm.hSessionRef.current
    const hctx: Hctx = { M, hSession }
    const st = stateRef.current

    switch (wizard.currentStep) {
      case 0: {
        setStage('recipient-keygen')
        if (engineMode === 'candidate') {
          const kp = hsm_generateHpkeKeyPair(M, hSession, kemId)
          st.hpkeRecipientPubHandle = kp.pubHandle
          st.hpkeRecipientPrivHandle = kp.privHandle
          hsm.addKey({
            handle: kp.pubHandle,
            label: 'Recipient HPKE pubkey',
            family: 'hpke',
            role: 'public',
            generatedAt: new Date().toISOString(),
          })
          hsm.addKey({
            handle: kp.privHandle,
            label: 'Recipient HPKE privkey',
            family: 'hpke',
            role: 'private',
            generatedAt: new Date().toISOString(),
          })
          hsm.addStepLog('Step 1 — Recipient CKK_HPKE_KEM keypair (CKM_HPKE_KEM_KEY_PAIR_GEN)')
          return `Mechanism: CKM_HPKE_KEM_KEY_PAIR_GEN (candidate)\npubHandle: #${kp.pubHandle}\nprivHandle: #${kp.privHandle}\n\nOne call regardless of classical vs. hybrid shape — the engine builds ek_H internally for hybrid suites.`
        }
        if (isHybrid && info.kind === 'hybrid') {
          const mlkem = hsm_generateMLKEMKeyPair(
            M,
            hSession,
            info.pqVariant,
            true,
            'HPKE recipient PQ'
          )
          const ec = hsm_generateECKeyPair(M, hSession, info.curve, false, 'HPKE recipient EC')
          const ekPQBytes = hsm_extractKeyValue(M, hSession, mlkem.pubHandle)
          const ekTBytes = extractRawPoint(M, hSession, ec.pubHandle, info.curve)
          const ekH = new Uint8Array(ekPQBytes.length + ekTBytes.length)
          ekH.set(ekPQBytes, 0)
          ekH.set(ekTBytes, ekPQBytes.length)
          st.ekH = ekH
          st.dkPQHandle = mlkem.privHandle
          st.dkTHandle = ec.privHandle
          hsm.addKey({
            handle: mlkem.pubHandle,
            label: 'Recipient ek_PQ',
            family: 'ml-kem',
            role: 'public',
            generatedAt: new Date().toISOString(),
          })
          hsm.addKey({
            handle: mlkem.privHandle,
            label: 'Recipient dk_PQ',
            family: 'ml-kem',
            role: 'private',
            generatedAt: new Date().toISOString(),
          })
          hsm.addKey({
            handle: ec.privHandle,
            label: 'Recipient dk_T',
            family: 'ecdh',
            role: 'private',
            generatedAt: new Date().toISOString(),
          })
          hsm.addStepLog('Step 1 — Recipient hybrid keypair (ML-KEM + EC)')
          return `ek_PQ (${ekPQBytes.length} B):\n${toHex(ekPQBytes).slice(0, 64)}...\n\nek_T (${ekTBytes.length} B):\n${toHex(ekTBytes)}\n\nek_H = concat(ek_PQ, ek_T) = ${ekH.length} bytes`
        }
        const curve = ecCurveOf(kemId)
        const kp = hsm_generateECKeyPair(M, hSession, curve, false, 'HPKE recipient')
        const pkR = extractRawPoint(M, hSession, kp.pubHandle, curve)
        st.ekH = pkR
        st.skRHandle = kp.privHandle
        hsm.addKey({
          handle: kp.pubHandle,
          label: 'Recipient pkR',
          family: 'ecdh',
          role: 'public',
          generatedAt: new Date().toISOString(),
        })
        hsm.addKey({
          handle: kp.privHandle,
          label: 'Recipient skR',
          family: 'ecdh',
          role: 'private',
          generatedAt: new Date().toISOString(),
        })
        hsm.addStepLog('Step 1 — Recipient keypair')
        return `Mechanism: CKM_EC${curve === 'X25519' ? '_MONTGOMERY' : ''}_KEY_PAIR_GEN\npkR (${pkR.length} B):\n${toHex(pkR)}`
      }

      case 1: {
        setStage('sender-keygen')
        if (!isHybrid) {
          if (engineMode === 'candidate') {
            const kp = hsm_generateHpkeKeyPair(M, hSession, kemId)
            st.hpkeSenderPubHandle = kp.pubHandle
            st.hpkeSenderPrivHandle = kp.privHandle
            st.hpkeSenderPkBytes = hsm_extractKeyValue(M, hSession, kp.pubHandle)
            hsm.addKey({
              handle: kp.pubHandle,
              label: 'Sender HPKE pubkey (static)',
              family: 'hpke',
              role: 'public',
              generatedAt: new Date().toISOString(),
            })
            hsm.addKey({
              handle: kp.privHandle,
              label: 'Sender HPKE privkey (static)',
              family: 'hpke',
              role: 'private',
              generatedAt: new Date().toISOString(),
            })
          } else {
            const curve = ecCurveOf(kemId)
            const kp = hsm_generateECKeyPair(M, hSession, curve, false, 'HPKE sender static')
            const pkS = extractRawPoint(M, hSession, kp.pubHandle, curve)
            st.skSHandle = kp.privHandle
            st.pkSBytes = pkS
            hsm.addKey({
              handle: kp.pubHandle,
              label: 'Sender pkS (static)',
              family: 'ecdh',
              role: 'public',
              generatedAt: new Date().toISOString(),
            })
            hsm.addKey({
              handle: kp.privHandle,
              label: 'Sender skS (static)',
              family: 'ecdh',
              role: 'private',
              generatedAt: new Date().toISOString(),
            })
          }
        }
        let pskLine = 'PSK: not used by this mode'
        if (mode === HPKE_MODE.PSK || mode === HPKE_MODE.AUTH_PSK) {
          const psk = crypto.getRandomValues(new Uint8Array(32))
          const pskHandle = hsm_importGenericSecret(M, hSession, psk)
          st.psk = psk
          st.pskId = DEMO_PSK_ID
          st.hpkePskHandle = pskHandle
          hsm.addKey({
            handle: pskHandle,
            label: 'PSK (out-of-band)',
            family: 'hmac',
            role: 'secret',
            purpose: 'application',
            generatedAt: new Date().toISOString(),
          })
          pskLine = `PSK (32 B, out-of-band): ${toHex(psk)}\npsk_id: "${new TextDecoder().decode(DEMO_PSK_ID)}"`
        }
        hsm.addStepLog('Step 2 — Sender static key + PSK provisioning')
        return `${isHybrid ? 'Sender static key: not used — the CG hybrid KEM has no Auth interface (ML-KEM does not support AuthEncap/AuthDecap).' : `Sender static key generated (used only in Auth/AuthPSK).`}\n${pskLine}`
      }

      case 2: {
        setStage('encap')
        if (engineMode === 'candidate') {
          if (st.hpkeRecipientPubHandle == null) throw new Error('Complete Step 1 first.')
          const params: HpkeMechParams = { kemId, kdfId, aeadId, mode, info: DEMO_INFO }
          if (mode === HPKE_MODE.AUTH || mode === HPKE_MODE.AUTH_PSK) {
            if (st.hpkeSenderPrivHandle == null) throw new Error('Complete Step 2 first.')
            params.hSenderStaticKey = st.hpkeSenderPrivHandle
          }
          if (mode === HPKE_MODE.PSK || mode === HPKE_MODE.AUTH_PSK) {
            if (st.hpkePskHandle == null) throw new Error('Complete Step 2 first.')
            params.hPsk = st.hpkePskHandle
            params.pskId = st.pskId
          }
          const result = hsm_hpkeEncapsulate(M, hSession, st.hpkeRecipientPubHandle, params)
          st.enc = result.enc
          st.candidateKeyHandle = result.keyHandle ?? undefined
          st.candidateBaseNonce = result.baseNonce ?? undefined
          if (result.keyHandle != null) {
            hsm.addKey({
              handle: result.keyHandle,
              label: 'AEAD key (from CKM_HPKE Encap)',
              family: aeadId === HPKE_AEAD.CHACHA20POLY1305 ? 'chacha20' : 'aes',
              role: 'secret',
              purpose: 'application',
              generatedAt: new Date().toISOString(),
            })
          }
          hsm.addStepLog('Step 3 — Sender Encap (CKM_HPKE candidate, single call)')
          let extractProof = 'n/a (no key handle returned)'
          if (result.keyHandle != null) {
            try {
              hsm_extractKeyValue(M, hSession, result.keyHandle)
              extractProof = '✗ unexpectedly succeeded — this should never happen'
            } catch {
              extractProof = '✓ CKR_ATTRIBUTE_SENSITIVE, as expected — CKA_EXTRACTABLE=false'
            }
          }
          return `enc (${result.enc.length} B):\n${toHex(result.enc).slice(0, 96)}${result.enc.length > 48 ? '...' : ''}\n\nAEAD key: non-extractable handle #${result.keyHandle} (KeySchedule already ran INSIDE this single C_EncapsulateKey(CKM_HPKE) call — no intermediate shared_secret was ever a JS value, not even a handle)\nbase_nonce: ${result.baseNonce ? toHex(result.baseNonce) : 'n/a'}\n\nAttempted C_GetAttributeValue(CKA_VALUE) on the key handle anyway, to prove the point: ${extractProof}`
        }
        if (mode === HPKE_MODE.AUTH || mode === HPKE_MODE.AUTH_PSK) {
          if (st.skSHandle == null || st.pkSBytes == null) throw new Error('Complete Step 2 first.')
          const { sharedSecret, enc } = dhkemAuthEncap(
            hctx,
            kemId,
            st.ekH,
            st.skSHandle,
            st.pkSBytes
          )
          st.sharedSecret = sharedSecret
          st.enc = enc
          hsm.addStepLog('Step 3 — Sender Encap')
          return `enc (${enc.length} B):\n${toHex(enc).slice(0, 96)}${enc.length > 48 ? '...' : ''}\n\nshared_secret (${sharedSecret.length} B):\n${toHex(sharedSecret)}`
        }
        if (isHybrid) {
          const { sharedSecretHandle, enc } = hybridEncap(hctx, kemId, st.ekH)
          st.sharedSecretHandle = sharedSecretHandle
          st.enc = enc
          hsm.addStepLog('Step 3 — Sender Encap (non-extracting combiner)')
          let extractProof: string
          try {
            hsm_extractKeyValue(M, hSession, sharedSecretHandle)
            extractProof = '✗ unexpectedly succeeded — this should never happen'
          } catch {
            extractProof = '✓ CKR_ATTRIBUTE_SENSITIVE, as expected — CKA_EXTRACTABLE=false'
          }
          return `enc (${enc.length} B):\n${toHex(enc).slice(0, 96)}${enc.length > 48 ? '...' : ''}\n\nshared_secret: non-extractable handle #${sharedSecretHandle} (ss_H — built entirely from CKM_CONCATENATE_BASE_AND_KEY/_DATA + CKM_SHA3_256_KEY_DERIVATION; ss_PQ and ss_T were never extracted either)\n\nAttempted C_GetAttributeValue(CKA_VALUE) on it anyway, to prove the point: ${extractProof}`
        }
        const { sharedSecret, enc } = dhkemEncap(hctx, kemId, st.ekH)
        st.sharedSecret = sharedSecret
        st.enc = enc
        hsm.addStepLog('Step 3 — Sender Encap')
        return `enc (${enc.length} B):\n${toHex(enc).slice(0, 96)}${enc.length > 48 ? '...' : ''}\n\nshared_secret (${sharedSecret.length} B):\n${toHex(sharedSecret)}`
      }

      case 3: {
        setStage('seal')
        if (engineMode === 'candidate') {
          if (st.candidateKeyHandle == null || st.candidateBaseNonce == null)
            throw new Error('Complete Step 3 first.')
          const { ct } = sealHandle(
            hctx,
            st.candidateKeyHandle,
            aeadId,
            st.candidateBaseNonce,
            0,
            DEMO_AAD,
            DEMO_PT
          )
          st.ciphertext = ct
          hsm.addStepLog('Step 4 — Sender Seal (KeySchedule already ran in Step 3)')
          return `Seal only — KeySchedule already ran inside Step 3's single CKM_HPKE call.\n\nciphertext (${ct.length} B):\n${toHex(ct)}`
        }
        if (isHybrid) {
          if (st.sharedSecretHandle == null) throw new Error('Complete Step 3 first.')
          const senderCtx = keyScheduleSecure(
            hctx,
            mode,
            kemId,
            kdfId,
            aeadId,
            st.sharedSecretHandle,
            DEMO_INFO,
            st.psk,
            st.pskId
          )
          st.senderCtxSecure = senderCtx
          const { ct } = sealHandle(
            hctx,
            senderCtx.keyHandle!,
            aeadId,
            senderCtx.baseNonce!,
            0,
            DEMO_AAD,
            DEMO_PT
          )
          st.ciphertext = ct
          hsm.addStepLog('Step 4 — Sender KeySchedule + Seal (non-extracting)')
          return `key: non-extractable handle #${senderCtx.keyHandle} (derived via CKM_HKDF_DERIVE bExpand-only, templated directly to CKK_${AEAD_OPTIONS.find((o) => Number(o.id) === aeadId)?.label.includes('ChaCha') ? 'CHACHA20' : 'AES'}, CKA_EXTRACTABLE=false — never read out, consumed straight by C_EncryptInit)\nbase_nonce: ${toHex(senderCtx.baseNonce!)} (not secret — public, like an IV)\nexporter_secret: ${toHex(senderCtx.exporterSecret)} (meant to leave — RFC 9180's own Export() API)\n\nciphertext (${ct.length} B):\n${toHex(ct)}`
        }
        if (st.sharedSecret == null) throw new Error('Complete Step 3 first.')
        const senderCtx = keySchedule(
          hctx,
          mode,
          kemId,
          kdfId,
          aeadId,
          st.sharedSecret,
          DEMO_INFO,
          st.psk,
          st.pskId
        )
        st.senderCtx = senderCtx
        const { ct } = seal(
          hctx,
          senderCtx.keyBytes!,
          aeadId,
          senderCtx.baseNonce!,
          0,
          DEMO_AAD,
          DEMO_PT
        )
        st.ciphertext = ct
        hsm.addStepLog('Step 4 — Sender KeySchedule + Seal')
        return `key (${senderCtx.keyBytes!.length} B): ${toHex(senderCtx.keyBytes!)}\nbase_nonce: ${toHex(senderCtx.baseNonce!)}\nexporter_secret: ${toHex(senderCtx.exporterSecret)}\n\nciphertext (${ct.length} B):\n${toHex(ct)}`
      }

      case 4: {
        setStage('decap')
        if (st.enc == null) throw new Error('Complete Step 3 first.')
        if (engineMode === 'candidate') {
          if (st.hpkeRecipientPrivHandle == null) throw new Error('Complete Step 1 first.')
          const params: HpkeMechParams = { kemId, kdfId, aeadId, mode, info: DEMO_INFO }
          if (mode === HPKE_MODE.AUTH || mode === HPKE_MODE.AUTH_PSK) {
            if (st.hpkeSenderPkBytes == null) throw new Error('Complete Step 2 first.')
            params.senderPk = st.hpkeSenderPkBytes
          }
          if (mode === HPKE_MODE.PSK || mode === HPKE_MODE.AUTH_PSK) {
            if (st.hpkePskHandle == null) throw new Error('Complete Step 2 first.')
            params.hPsk = st.hpkePskHandle
            params.pskId = st.pskId
          }
          const result = hsm_hpkeDecapsulate(
            M,
            hSession,
            st.hpkeRecipientPrivHandle,
            st.enc,
            params
          )
          st.candidateRecipientKeyHandle = result.keyHandle ?? undefined
          st.candidateRecipientBaseNonce = result.baseNonce ?? undefined
          hsm.addStepLog('Step 5 — Recipient Decap (CKM_HPKE candidate, single call)')
          return `AEAD key: non-extractable handle #${result.keyHandle} (KeySchedule already ran INSIDE this single C_DecapsulateKey(CKM_HPKE) call)\nbase_nonce: ${result.baseNonce ? toHex(result.baseNonce) : 'n/a'}\n\nThis mechanism never surfaces a shared_secret to compare — equality can only be proven by Step 6's Seal→Open round trip succeeding.`
        }
        if (mode === HPKE_MODE.AUTH || mode === HPKE_MODE.AUTH_PSK) {
          if (st.skRHandle == null || st.pkSBytes == null)
            throw new Error('Missing recipient/sender key state.')
          const recipientSharedSecret = dhkemAuthDecap(
            hctx,
            kemId,
            st.enc,
            st.skRHandle,
            st.ekH,
            st.pkSBytes
          )
          st.recipientSharedSecret = recipientSharedSecret
          const match = toHex(recipientSharedSecret) === toHex(st.sharedSecret!)
          hsm.addStepLog('Step 5 — Recipient Decap')
          return `Recipient shared_secret (${recipientSharedSecret.length} B):\n${toHex(recipientSharedSecret)}\n\nMatch vs sender: ${match ? '✓ identical' : '✗ MISMATCH'}`
        }
        if (isHybrid) {
          if (st.dkPQHandle == null || st.dkTHandle == null)
            throw new Error('Missing recipient key state.')
          const recipientSharedSecretHandle = hybridDecap(
            hctx,
            kemId,
            st.enc,
            st.dkPQHandle,
            st.dkTHandle,
            st.ekH
          )
          st.recipientSharedSecretHandle = recipientSharedSecretHandle
          hsm.addStepLog('Step 5 — Recipient Decap (non-extracting)')
          return `Recipient shared_secret: non-extractable handle #${recipientSharedSecretHandle}\n\nSender's shared_secret is ALSO a non-extractable handle (#${st.sharedSecretHandle}) — neither side's bytes are ever readable, so equality can't be hex-compared here the way the classical DHKEM path can. That's the point: instead, Step 6's Seal→Open round trip is the proof — AES-GCM/ChaCha20-Poly1305 authentication only succeeds if both sides derived byte-identical keys, entirely inside the token.`
        }
        if (st.skRHandle == null) throw new Error('Missing recipient key state.')
        const recipientSharedSecret = dhkemDecap(hctx, kemId, st.enc, st.skRHandle, st.ekH)
        st.recipientSharedSecret = recipientSharedSecret
        const match = toHex(recipientSharedSecret) === toHex(st.sharedSecret!)
        hsm.addStepLog('Step 5 — Recipient Decap')
        return `Recipient shared_secret (${recipientSharedSecret.length} B):\n${toHex(recipientSharedSecret)}\n\nMatch vs sender: ${match ? '✓ identical' : '✗ MISMATCH'}`
      }

      case 5: {
        setStage('open')
        if (st.ciphertext == null) throw new Error('Complete Steps 4–5 first.')
        if (engineMode === 'candidate') {
          if (st.candidateRecipientKeyHandle == null || st.candidateRecipientBaseNonce == null) {
            throw new Error('Complete Steps 4–5 first.')
          }
          const pt = openHandle(
            hctx,
            st.candidateRecipientKeyHandle,
            aeadId,
            st.candidateRecipientBaseNonce,
            0,
            DEMO_AAD,
            st.ciphertext
          )
          const text = new TextDecoder().decode(pt)
          const match = text === new TextDecoder().decode(DEMO_PT)
          setStage('done')
          hsm.addStepLog('Step 6 — Recipient Open (KeySchedule already ran in Step 5)')
          return `Recovered plaintext: "${text}"\n\nRound-trip: ${match ? '✓ verified — sender and recipient agree end-to-end' : '✗ MISMATCH'}\n\nOpen only succeeds because sender and recipient independently derived the identical AEAD key inside two separate single-call CKM_HPKE invocations — the shared value behind it was never a JS value on either side, not even as a handle.`
        }
        if (isHybrid) {
          if (st.recipientSharedSecretHandle == null) throw new Error('Complete Steps 4–5 first.')
          const recipientCtx = keyScheduleSecure(
            hctx,
            mode,
            kemId,
            kdfId,
            aeadId,
            st.recipientSharedSecretHandle,
            DEMO_INFO,
            st.psk,
            st.pskId
          )
          st.recipientCtxSecure = recipientCtx
          const pt = openHandle(
            hctx,
            recipientCtx.keyHandle!,
            aeadId,
            recipientCtx.baseNonce!,
            0,
            DEMO_AAD,
            st.ciphertext
          )
          const text = new TextDecoder().decode(pt)
          const match = text === new TextDecoder().decode(DEMO_PT)
          setStage('done')
          hsm.addStepLog('Step 6 — Recipient KeySchedule + Open (non-extracting)')
          return `Recovered plaintext: "${text}"\n\nRound-trip: ${match ? '✓ verified — sender and recipient agree end-to-end' : '✗ MISMATCH'}\n\nThis IS the equality proof Step 5 deferred: Open only succeeds because sender and recipient independently derived the identical non-extractable AEAD key — proven functionally, without either key ever existing as plaintext in this browser.`
        }
        if (st.recipientSharedSecret == null) throw new Error('Complete Steps 4–5 first.')
        const recipientCtx = keySchedule(
          hctx,
          mode,
          kemId,
          kdfId,
          aeadId,
          st.recipientSharedSecret,
          DEMO_INFO,
          st.psk,
          st.pskId
        )
        st.recipientCtx = recipientCtx
        const pt = hpkeOpen(
          hctx,
          recipientCtx.keyBytes!,
          aeadId,
          recipientCtx.baseNonce!,
          0,
          DEMO_AAD,
          st.ciphertext
        )
        const text = new TextDecoder().decode(pt)
        const match = text === new TextDecoder().decode(DEMO_PT)
        setStage('done')
        hsm.addStepLog('Step 6 — Recipient KeySchedule + Open')
        return `Recovered plaintext: "${text}"\n\nRound-trip: ${match ? '✓ verified — sender and recipient agree end-to-end' : '✗ MISMATCH'}`
      }

      default:
        throw new Error(`Unknown step index: ${wizard.currentStep}`)
    }
  }, [hsm, wizard.currentStep, kemId, kdfId, aeadId, mode, isHybrid, info, engineMode])

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-muted/10 mb-6 rounded-t-xl">
        <LiveHSMToggle hsm={hsm} operations={HPKE_LIVE_OPERATIONS} />
      </div>

      <div className="px-6 mb-4">
        <h2 className="text-lg font-semibold text-gradient">HPKE (RFC 9180) over PKCS#11</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {engineMode === 'composed' ? (
            <>
              PKCS#11 v3.2 has no CKM_HPKE mechanism — this composes HPKE&apos;s KeySchedule,
              DHKEM/hybrid-KEM, and Seal/Open from CKM_ECDH1_DERIVE / CKM_ML_KEM / CKM_HKDF_DERIVE /
              C_Sign(HMAC) / CKM_AES_GCM / CKM_CHACHA20_POLY1305 primitives, byte-exact against{' '}
              <a
                href="/library?ref=RFC 9180"
                className="text-primary underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                RFC 9180
              </a>{' '}
              Appendix A.
            </>
          ) : (
            <>
              A PQCToday-proposed <code className="text-xs">CKM_HPKE</code> mechanism family — not
              yet OASIS TC allocated — that folds Encap/Decap, the PQ/T hybrid combiner, and
              KeySchedule into a single C_EncapsulateKey/C_DecapsulateKey call each. See the{' '}
              <span className="italic">CKM_HPKE mechanism proposal</span> in pqctoday-hsm&apos;s
              docs for the full spec and FIPS-mapping rationale.
            </>
          )}
        </p>
      </div>

      <div className="px-6 mb-4">
        <div className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
          PKCS#11 sequence
        </div>
        <div
          className="inline-flex rounded-md border border-border overflow-hidden"
          role="group"
          aria-label="HPKE engine mode"
        >
          <Button
            type="button"
            variant={engineMode === 'composed' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-none"
            onClick={() => selectEngineMode('composed')}
          >
            PKCS#11 v3.2 (composed, ~5 calls)
          </Button>
          <Button
            type="button"
            variant={engineMode === 'candidate' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-none border-l border-border"
            onClick={() => selectEngineMode('candidate')}
          >
            vNext candidate — CKM_HPKE (single call)
          </Button>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Same picker, same diagram, same 6 steps — this only changes which PKCS#11 mechanism(s)
          each step actually calls. Switching resets step progress and generated keys.
        </p>
      </div>

      <div className="px-6 mb-4 flex flex-wrap items-end gap-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1 min-w-[280px]">
          <div>
            <div className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
              KEM
            </div>
            <FilterDropdown
              items={KEM_OPTIONS}
              selectedId={String(kemId)}
              onSelect={selectKem}
              size="sm"
              hideDefaultOption
              ariaLabel="HPKE KEM"
            />
          </div>
          <div>
            <div className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
              KDF
            </div>
            <FilterDropdown
              items={KDF_OPTIONS}
              selectedId={String(kdfId)}
              onSelect={(id) => setKdfId(Number(id) as HpkeKdfId)}
              size="sm"
              hideDefaultOption
              ariaLabel="HPKE KDF"
            />
          </div>
          <div>
            <div className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
              AEAD
            </div>
            <FilterDropdown
              items={AEAD_OPTIONS}
              selectedId={String(aeadId)}
              onSelect={(id) => setAeadId(Number(id) as HpkeAeadId)}
              size="sm"
              hideDefaultOption
              ariaLabel="HPKE AEAD"
            />
          </div>
          <div>
            <div className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
              Mode
            </div>
            <FilterDropdown
              items={modeOptions}
              selectedId={String(mode)}
              onSelect={(id) => setMode(Number(id) as HpkeModeId)}
              size="sm"
              hideDefaultOption
              ariaLabel="HPKE mode"
            />
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 shrink-0">
          <RotateCcw size={14} />
          Reset
        </Button>
      </div>
      <p className="px-6 -mt-2 mb-4 text-[11px] text-muted-foreground">
        Reset clears all generated keys and step progress — use it after changing KEM/KDF/AEAD/Mode
        to start a clean run with the new suite.
      </p>
      {isHybrid && (
        <p className="px-6 -mt-2 mb-4 text-[11px] text-muted-foreground">
          Auth/AuthPSK are hidden for this KEM — draft-ietf-hpke-pq&apos;s ML-KEM entries mark the
          Auth column &quot;no&quot;; only classical DHKEMs support AuthEncap/AuthDecap.
        </p>
      )}

      <div className="px-6 mb-4">
        <HpkeDiagram
          stage={stage}
          modeLabel={HPKE_MODE_LABEL[mode]}
          kemLabel={KEM_OPTIONS.find((o) => Number(o.id) === kemId)?.label ?? ''}
        />
      </div>

      <div className="px-6">
        <StepWizard
          steps={STEPS}
          isExecuteDisabled={!hsm.isReady}
          plainEnglishEnabled={true}
          currentStepIndex={wizard.currentStep}
          onNext={wizard.handleNext}
          onBack={wizard.handleBack}
          onExecute={async () => {
            await wizard.execute(executeCurrentStep)
          }}
          isExecuting={wizard.isExecuting}
          output={chronological(wizard.output)}
          error={wizard.error}
          isStepComplete={wizard.isStepComplete}
        />

        {wizard.logEntries.length > 0 && (
          <div className="mt-4">
            <WorkshopOperationLog entries={wizard.logEntries} className="max-h-40" />
          </div>
        )}
      </div>

      {hsm.isReady && (
        <div className="px-6 mt-4">
          <Pkcs11LogPanel
            log={hsm.log}
            onClear={hsm.clearLog}
            title="PKCS#11 Call Log — HPKE"
            emptyMessage="Enable the HSM toggle and execute steps to see PKCS#11 traces."
            filterFns={HPKE_LIVE_OPERATIONS}
            defaultOpen={true}
            groupOrder="chronological"
          />
        </div>
      )}

      {hsm.keys.length > 0 && (
        <div className="px-6 mt-4 mb-6">
          <HsmKeyInspector
            keys={hsm.keys}
            moduleRef={hsm.moduleRef}
            hSessionRef={hsm.hSessionRef}
            onRemoveKey={hsm.removeKey}
            title="Key Registry — HPKE Session"
          />
        </div>
      )}
    </div>
  )
}
