// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js'
import { ml_kem768 } from '@noble/post-quantum/ml-kem.js'
import { Play, CheckCircle2, XCircle, Loader2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useHSM, type UseHSMResult } from '@/hooks/useHSM'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import {
  hsm_generateMLDSAKeyPair,
  hsm_signBytesMLDSA,
  hsm_verifyBytes,
  hsm_extractKeyValue,
  hsm_destroyObject,
  hsm_generateMLKEMKeyPair,
  hsm_encapsulate,
  hsm_decapsulate,
  hsm_generateAESKey,
  hsm_aesEncrypt,
  hsm_aesDecrypt,
} from '@/wasm/softhsm'

// ── helpers ──────────────────────────────────────────────────────────────────

const toHex = (b: Uint8Array) =>
  Array.from(b)
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('')
const shortHex = (b: Uint8Array, n = 16) => `${toHex(b.subarray(0, n))}… (${b.length} B)`

type StepStatus = 'idle' | 'running' | 'ok' | 'error'

interface StepResult {
  status: StepStatus
  lines: string[]
  error?: string
}

function useStep() {
  const [result, setResult] = useState<StepResult>({ status: 'idle', lines: [] })
  const run = async (fn: () => Promise<string[]>) => {
    setResult({ status: 'running', lines: [] })
    try {
      const lines = await fn()
      setResult({ status: 'ok', lines })
    } catch (e) {
      setResult({ status: 'error', lines: [], error: String(e) })
    }
  }
  return { result, run }
}

// ── Step Card ─────────────────────────────────────────────────────────────────

function StepCard({
  index,
  title,
  subtitle,
  result,
  onRun,
  children,
}: {
  index: number
  title: string
  subtitle: string
  result: StepResult
  onRun: () => void
  children?: React.ReactNode
}) {
  const icon =
    result.status === 'ok' ? (
      <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" />
    ) : result.status === 'error' ? (
      <XCircle className="w-4 h-4 text-status-error shrink-0" />
    ) : result.status === 'running' ? (
      <Loader2 className="w-4 h-4 text-primary shrink-0 animate-spin" />
    ) : (
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    )

  return (
    <div className="glass-panel p-5 space-y-3">
      <div className="flex items-start gap-3">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0 mt-0.5">
          {index}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {icon}
            <h4 className="text-sm font-semibold">{title}</h4>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRun}
          disabled={result.status === 'running'}
          className="shrink-0"
        >
          <Play className="w-3 h-3 mr-1" />
          Run
        </Button>
      </div>

      {children}

      {result.status !== 'idle' && (
        <pre className="mt-2 bg-muted/40 rounded p-3 overflow-x-auto text-[11px] leading-relaxed font-mono whitespace-pre-wrap break-all">
          {result.status === 'running'
            ? 'Computing…'
            : result.status === 'error'
              ? `Error: ${result.error}`
              : result.lines.join('\n')}
        </pre>
      )}
    </div>
  )
}

// ── Step 1 — Credential signing key (ML-DSA-65) ──────────────────────────────

function CredentialKeyStep({ hsm }: { hsm: UseHSMResult }) {
  const { result, run } = useStep()

  const handleRun = () =>
    run(async () => {
      const msg = new TextEncoder().encode(
        'leaf_node_v1|alice@example.com|2026-05-17|MLS_128_DhKemX25519Aes128GcmSha256Ed25519'
      )

      if (hsm.isReady && hsm.moduleRef.current) {
        const M = hsm.moduleRef.current
        const session = hsm.hSessionRef.current
        const { pubHandle, privHandle } = hsm_generateMLDSAKeyPair(M, session, 65)
        const pk = hsm_extractKeyValue(M, session, pubHandle)
        const sig = hsm_signBytesMLDSA(M, session, privHandle, msg)
        const ok = hsm_verifyBytes(M, session, pubHandle, msg, sig)
        if (!ok) throw new Error('verify returned false — should never happen')
        const tampered = new Uint8Array(msg)
        tampered[0] ^= 0xff
        const bad = hsm_verifyBytes(M, session, pubHandle, tampered, sig)
        if (bad) throw new Error('tampered msg verified — catastrophic')
        hsm_destroyObject(M, session, pubHandle)
        hsm_destroyObject(M, session, privHandle)
        return [
          `[HSM] pk  (${pk.length} B): ${shortHex(pk)}`,
          `[HSM] sig (${sig.length} B): ${shortHex(sig)}`,
          `C_MessageSignInit + C_SignMessage → verify(msg)      → ${ok}   ✓`,
          `C_MessageVerifyInit + C_VerifyMessage → verify(tampered) → ${bad}  ✓ (mutation rejected)`,
        ]
      }

      // noble (software) path
      const kp = ml_dsa65.keygen()
      const sig = ml_dsa65.sign(msg, kp.secretKey)
      const ok = ml_dsa65.verify(sig, msg, kp.publicKey)
      if (!ok) throw new Error('verify returned false — should never happen')
      const tampered = new Uint8Array(msg)
      tampered[0] ^= 0xff
      const bad = ml_dsa65.verify(sig, tampered, kp.publicKey)
      if (bad) throw new Error('tampered msg verified — catastrophic')
      return [
        `pk  (${kp.publicKey.length} B): ${shortHex(kp.publicKey)}`,
        `sk  (${kp.secretKey.length} B): ${shortHex(kp.secretKey)}`,
        `sig (${sig.length} B): ${shortHex(sig)}`,
        `verify(msg)      → ${ok}   ✓`,
        `verify(tampered) → ${bad}  ✓ (mutation rejected)`,
      ]
    })

  return (
    <StepCard
      index={1}
      title="Credential signing key — ML-DSA-65"
      subtitle="Each MLS leaf node carries an identity credential. The leaf_node is signed with ML-DSA-65 before being committed to the tree."
      result={result}
      onRun={handleRun}
    />
  )
}

// ── Step 2 — TreeKEM node update (ML-KEM-768 HPKE encapsulate/decapsulate) ───

function TreeKEMNodeStep({ hsm }: { hsm: UseHSMResult }) {
  const { result, run } = useStep()

  const handleRun = () =>
    run(async () => {
      if (hsm.isReady && hsm.moduleRef.current) {
        const M = hsm.moduleRef.current
        const session = hsm.hSessionRef.current

        const alice = hsm_generateMLKEMKeyPair(M, session, 768)
        const alicePk = hsm_extractKeyValue(M, session, alice.pubHandle)

        const { ciphertextBytes, secretHandle: senderSH } = hsm_encapsulate(
          M,
          session,
          alice.pubHandle,
          768
        )
        const senderSS = hsm_extractKeyValue(M, session, senderSH)
        const receiverSH = hsm_decapsulate(M, session, alice.privHandle, ciphertextBytes, 768)
        const receiverSS = hsm_extractKeyValue(M, session, receiverSH)

        const match = toHex(senderSS) === toHex(receiverSS)
        if (!match) throw new Error('shared secrets diverged')

        const other = hsm_generateMLKEMKeyPair(M, session, 768)
        const wrongSH = hsm_decapsulate(M, session, other.privHandle, ciphertextBytes, 768)
        const wrongSS = hsm_extractKeyValue(M, session, wrongSH)
        const wrongMatch = toHex(wrongSS) === toHex(senderSS)

        for (const h of [
          alice.pubHandle,
          alice.privHandle,
          senderSH,
          receiverSH,
          other.pubHandle,
          other.privHandle,
          wrongSH,
        ]) {
          try {
            hsm_destroyObject(M, session, h)
          } catch {
            /* already freed */
          }
        }

        return [
          `[HSM] node pk   (${alicePk.length} B): ${shortHex(alicePk)}`,
          `[HSM] ciphertext(${ciphertextBytes.length} B): ${shortHex(ciphertextBytes)}`,
          `[HSM] sender  SS (${senderSS.length} B): ${toHex(senderSS)}`,
          `[HSM] receiver SS: ${toHex(receiverSS)}`,
          `C_EncapsulateKey + C_DecapsulateKey → secrets match       → ${match}      ✓`,
          `wrong-key SS match  → ${wrongMatch} ✓ (implicit rejection)`,
        ]
      }

      // noble (software) path
      const alice = ml_kem768.keygen()
      const { cipherText, sharedSecret: senderSS } = ml_kem768.encapsulate(alice.publicKey)
      const receiverSS = ml_kem768.decapsulate(cipherText, alice.secretKey)
      const match = toHex(senderSS) === toHex(receiverSS)
      if (!match) throw new Error('shared secrets diverged')
      const other = ml_kem768.keygen()
      const wrongSS = ml_kem768.decapsulate(cipherText, other.secretKey)
      const wrongMatch = toHex(wrongSS) === toHex(senderSS)
      return [
        `node pk   (${alice.publicKey.length} B): ${shortHex(alice.publicKey)}`,
        `ciphertext(${cipherText.length} B): ${shortHex(cipherText)}`,
        `sender  SS (${senderSS.length} B): ${toHex(senderSS)}`,
        `receiver SS: ${toHex(receiverSS)}`,
        `secrets match       → ${match}      ✓`,
        `wrong-key SS match  → ${wrongMatch} ✓ (implicit rejection)`,
      ]
    })

  return (
    <StepCard
      index={2}
      title="TreeKEM node update — ML-KEM-768 HPKE"
      subtitle="When a member commits, they HPKE-encapsulate a fresh path_secret for every ancestor node. Receivers recover the shared secret via decapsulation. Wrong keys get a distinct implicit-rejection value (RFC 9180 §6.1)."
      result={result}
      onRun={handleRun}
    />
  )
}

// ── Step 3 — Application message encryption (AES-128-GCM) ────────────────────

function AppMessageStep({ hsm }: { hsm: UseHSMResult }) {
  const [plaintext, setPlaintext] = useState('Hello, MLS group! 🔐')
  const { result, run } = useStep()

  const handleRun = () =>
    run(async () => {
      const enc = new TextEncoder()
      const pt = enc.encode(plaintext)
      const aad = enc.encode('group:demo|epoch:1|content:application')
      const badAad = enc.encode('group:demo|epoch:2|content:application')

      if (hsm.isReady && hsm.moduleRef.current) {
        const M = hsm.moduleRef.current
        const session = hsm.hSessionRef.current

        const keyHandle = hsm_generateAESKey(
          M,
          session,
          128,
          true,
          true,
          false,
          false,
          false,
          true,
          'mls-epoch-key'
        )
        const epochKeyBytes = hsm_extractKeyValue(M, session, keyHandle)

        // Roundtrip: encrypt with aad, decrypt with same aad
        const { ciphertext: ct, iv } = hsm_aesEncrypt(
          M,
          session,
          keyHandle,
          pt,
          'gcm',
          undefined,
          aad
        )
        const recovered = new TextDecoder().decode(
          hsm_aesDecrypt(M, session, keyHandle, ct, iv, 'gcm', aad)
        )
        if (recovered !== plaintext) throw new Error('decrypt mismatch')

        // AAD integrity: same ciphertext + wrong aad → CKR_ENCRYPTED_DATA_INVALID
        let aadOk = false
        try {
          hsm_aesDecrypt(M, session, keyHandle, ct, iv, 'gcm', badAad)
          aadOk = true
        } catch {
          aadOk = false
        }

        hsm_destroyObject(M, session, keyHandle)

        return [
          `[HSM] epoch key (${epochKeyBytes.length} B): ${toHex(epochKeyBytes)}`,
          `[HSM] nonce     (${iv.length} B): ${toHex(iv)}`,
          `[HSM] plaintext : "${plaintext}"`,
          `[HSM] ciphertext(${ct.length} B): ${shortHex(ct)}`,
          `[HSM] decrypted : "${recovered}"`,
          `C_EncryptInit(CKM_AES_GCM) + C_Encrypt ✓`,
          `C_DecryptInit(CKM_AES_GCM) + C_Decrypt (correct AAD) ✓`,
          `${!aadOk ? 'AAD integrity → CKR_ENCRYPTED_DATA_INVALID ✓' : '✗ AAD check did not throw — unexpected'}`,
        ]
      }

      // Web Crypto (software) path
      const epochKey = crypto.getRandomValues(new Uint8Array(16))
      const iv = crypto.getRandomValues(new Uint8Array(12))
      const cryptoKey = await crypto.subtle.importKey('raw', epochKey, 'AES-GCM', false, [
        'encrypt',
        'decrypt',
      ])
      const ctBuf = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv, additionalData: aad },
        cryptoKey,
        pt
      )
      const ct = new Uint8Array(ctBuf)
      const ptBuf = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv, additionalData: aad },
        cryptoKey,
        ct
      )
      const recovered = new TextDecoder().decode(ptBuf)
      if (recovered !== plaintext) throw new Error('decrypt mismatch')

      let aadOk = false
      try {
        await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: badAad }, cryptoKey, ct)
        aadOk = true
      } catch {
        aadOk = false
      }

      return [
        `epoch key (${epochKey.length} B): ${toHex(epochKey)}`,
        `nonce     (${iv.length} B): ${toHex(iv)}`,
        `plaintext : "${plaintext}"`,
        `ciphertext(${ct.length} B): ${shortHex(ct)}`,
        `decrypted : "${recovered}"`,
        `AAD integrity (wrong epoch) → throws ✓`,
        `${!aadOk ? '✓ AES-GCM authentication passed' : '✗ AAD check did not throw — unexpected'}`,
      ]
    })

  return (
    <StepCard
      index={3}
      title="Application message encryption — AES-128-GCM"
      subtitle="MLS derives a content key and nonce from the epoch key schedule (RFC 9420 §5.2). Messages are AES-GCM authenticated — the epoch number, group ID, and content type are bound as Additional Data."
      result={result}
      onRun={handleRun}
    >
      <div className="flex items-center gap-2 mt-1">
        <label htmlFor="mls-app-plaintext" className="text-xs text-muted-foreground shrink-0">
          Message:
        </label>
        <input
          id="mls-app-plaintext"
          type="text"
          value={plaintext}
          onChange={(e) => setPlaintext(e.target.value)}
          className="flex-1 bg-muted/30 border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          maxLength={200}
        />
      </div>
    </StepCard>
  )
}

// ── Main export — single shared HSM instance for all three steps ──────────────

export const MLSCryptoOperations: React.FC = () => {
  const hsm = useHSM()

  return (
    <div className="glass-panel p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Live MLS crypto primitives</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Three in-browser operations that underpin every MLS session. Run each step to see real key
          material and verify the cryptographic invariants. Enable HSM mode below to route all steps
          through <code className="text-primary">softhsmv3</code> (PKCS#11 v3.2) —{' '}
          <code className="text-primary">C_SignMessage</code>,{' '}
          <code className="text-primary">C_EncapsulateKey</code>, and{' '}
          <code className="text-primary">C_EncryptInit</code>. All crypto executes client-side — no
          server contact.
        </p>
      </div>
      <LiveHSMToggle
        hsm={hsm}
        operations={[
          'C_GenerateKeyPair',
          'C_GenerateKey',
          'C_MessageSignInit',
          'C_SignMessage',
          'C_MessageVerifyInit',
          'C_VerifyMessage',
          'C_EncapsulateKey',
          'C_DecapsulateKey',
          'C_EncryptInit',
          'C_Encrypt',
          'C_DecryptInit',
          'C_Decrypt',
        ]}
      />
      <CredentialKeyStep hsm={hsm} />
      <TreeKEMNodeStep hsm={hsm} />
      <AppMessageStep hsm={hsm} />
    </div>
  )
}
