// SPDX-License-Identifier: GPL-3.0-only

import React, { useState, useCallback, useMemo } from 'react'
import { Lock, Unlock, ArrowRight, Key, XCircle } from 'lucide-react'
import { ml_kem768 } from '@noble/post-quantum/ml-kem.js'
import { kmac256 } from '@noble/hashes/sha3-addons.js'
import { JOSE_KEY_AGREEMENT_ALGORITHMS, SAMPLE_JWT_PAYLOAD } from '../constants'
import { base64urlDecode, base64urlEncode, bytesToHex } from '../jwtUtils'
import { Button } from '@/components/ui/button'
import { ShieldCheck } from 'lucide-react'
import { useHSM } from '@/hooks/useHSM'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import {
  hsm_generateMLKEMKeyPair,
  hsm_pqcEncap,
  hsm_pqcDecap,
  hsm_extractKeyValue,
  hsm_destroyObject,
} from '@/wasm/softhsm'

// ── KDF per draft-ietf-jose-pqc-kem-05 §5.1 ─────────────────────────────────
//
// JOSE uses KMAC256(K=SS', X=AlgorithmID || SuppPubInfo || SuppPrivInfo, L, S="")
// where X is the NIST SP 800-56Ar3 / RFC 7518 §4.6.2 context structure with
// PartyUInfo and PartyVInfo intentionally omitted (PQ KEMs don't authenticate
// the sender, and the receiver is bound to the public key already).
//
// AlgorithmID = uint32_be(len) || ASCII("enc" value)  e.g. "A256GCM"
// SuppPubInfo = uint32_be(keydatalen_in_bits)         e.g. 256 for A256GCM
// SuppPrivInfo = empty
// L = output length in bits = 256
// S = "" (empty customization label per §5.1)
function joseKdfContext(encAlg: string, keyLenBits: number): Uint8Array {
  const algNameBytes = new TextEncoder().encode(encAlg)
  const out = new Uint8Array(4 + algNameBytes.length + 4)
  const dv = new DataView(out.buffer)
  // AlgorithmID
  dv.setUint32(0, algNameBytes.length, false)
  out.set(algNameBytes, 4)
  // SuppPubInfo = keydatalen in bits
  dv.setUint32(4 + algNameBytes.length, keyLenBits, false)
  // SuppPrivInfo intentionally empty
  return out
}

function deriveCek(sharedSecret: Uint8Array, encAlg: string, keyLenBytes: number): Uint8Array {
  const x = joseKdfContext(encAlg, keyLenBytes * 8)
  // Fixed-length KMAC256 (SP 800-185 right_encode(L)), NOT KMACXOF256
  // (right_encode(0)): -05 §5.1 specifies KMAC(K, X, L, S) per SP 800-108r1-upd1,
  // and the two give different keys. This used the XOF variant until 2026-10-01.
  // Empty customization S=""; dkLen = keyLenBytes.
  return kmac256(sharedSecret, x, { dkLen: keyLenBytes })
}

type JwsBackend = 'noble' | 'softhsmv3'
type JWEStep = 'keygen' | 'encapsulate' | 'derive' | 'encrypt' | 'assemble'

const JWE_STEPS: { id: JWEStep; label: string; description: string }[] = [
  {
    id: 'keygen',
    label: '1. Generate ML-KEM-768 Keypair',
    description:
      'The recipient generates a ML-KEM-768 keypair. The public key (1,184 bytes) is shared; the private key is kept secret.',
  },
  {
    id: 'encapsulate',
    label: '2. Encapsulate Shared Secret',
    description:
      'The sender calls ML-KEM.Encaps(pk), which produces a shared secret (32 bytes) and a KEM ciphertext (1,088 bytes). Per draft-ietf-jose-pqc-kem-05 §6.1 (direct key agreement) the ciphertext travels in the "ek" header parameter, and the JWE Encrypted Key is absent — the same shape ECDH-ES uses for its "epk".',
  },
  {
    id: 'derive',
    label: '3. Derive CEK via KMAC256',
    description:
      'Per draft-ietf-jose-pqc-kem-05 §5.1, the Content Encryption Key is KMAC256(K=SS, X=AlgorithmID‖SuppPubInfo, L=256, S=""). AlgorithmID = uint32_be(7) || "A256GCM"; SuppPubInfo = uint32_be(256). PartyUInfo/PartyVInfo are intentionally omitted (PQ KEMs do not authenticate the sender).',
  },
  {
    id: 'encrypt',
    label: '4. Encrypt Payload with AES-256-GCM',
    description:
      'The JWT payload is encrypted with AES-256-GCM via WebCrypto. The Additional Authenticated Data is ASCII(BASE64URL(protected header)) per RFC 7516 §5.1 step 14 — the encoded header, not its JSON — so the header, including "ek", is integrity-protected.',
  },
  {
    id: 'assemble',
    label: '5. Assemble JWE',
    description:
      'The five JWE Compact parts are assembled per RFC 7516 §7.1: protected header (carrying "ek"), an EMPTY Encrypted Key, initialization vector, ciphertext, and authentication tag.',
  },
]

interface JWEKeys {
  pubKey: Uint8Array
  secKey: Uint8Array
  // softhsmv3 handles (0 = not used)
  pubHandle?: number
  privHandle?: number
}

interface JWEResult {
  headerB64: string
  /** KEM ciphertext as carried in the protected header's "ek" parameter. */
  ekB64: string
  ivB64: string
  ciphertextB64: string
  tagB64: string
  fullToken: string
  sharedSecret: Uint8Array
  cek: Uint8Array
  pubKey: Uint8Array
}

const mlKem768Meta = JOSE_KEY_AGREEMENT_ALGORITHMS.find((a) => a.jose === 'ML-KEM-768')!

export const JWEEncryption: React.FC = () => {
  const [backend, setBackend] = useState<JwsBackend>('noble')
  const [activeStep, setActiveStep] = useState<JWEStep>('keygen')
  const [keys, setKeys] = useState<JWEKeys | null>(null)
  const [result, setResult] = useState<JWEResult | null>(null)
  const [isEncrypting, setIsEncrypting] = useState(false)
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [decryptedPayload, setDecryptedPayload] = useState<string | null>(null)
  const [decryptError, setDecryptError] = useState<string | null>(null)
  const [encryptError, setEncryptError] = useState<string | null>(null)

  const hsm = useHSM('rust')

  const hsmCtx = useMemo(() => {
    if (backend !== 'softhsmv3' || !hsm.isReady || !hsm.moduleRef.current) return undefined
    return { M: hsm.moduleRef.current, session: hsm.hSessionRef.current }
  }, [backend, hsm.isReady, hsm.moduleRef, hsm.hSessionRef])

  const handleEncrypt = useCallback(async () => {
    setIsEncrypting(true)
    setEncryptError(null)
    setDecryptedPayload(null)
    setDecryptError(null)
    setResult(null)
    try {
      let pubKey: Uint8Array
      let secKey: Uint8Array
      let ciphertextBytes: Uint8Array
      let sharedSecret: Uint8Array
      let pubHandle: number | undefined
      let privHandle: number | undefined

      // Step 1: keygen
      setActiveStep('keygen')
      if (backend === 'softhsmv3' && hsmCtx) {
        const { M, session } = hsmCtx
        const kp = hsm_generateMLKEMKeyPair(M, session, 768, true)
        pubHandle = kp.pubHandle
        privHandle = kp.privHandle
        pubKey = hsm_extractKeyValue(M, session, kp.pubHandle)
        secKey = new Uint8Array(4) // sentinel — real key stays in HSM
      } else {
        const kp = ml_kem768.keygen()
        pubKey = kp.publicKey
        secKey = kp.secretKey
      }
      setKeys({ pubKey, secKey, pubHandle, privHandle })
      await new Promise((r) => setTimeout(r, 250))

      // Step 2: encapsulate (sender side)
      setActiveStep('encapsulate')
      if (backend === 'softhsmv3' && hsmCtx && pubHandle !== undefined) {
        const { M, session } = hsmCtx
        const encapResult = hsm_pqcEncap(M, session, pubHandle, 'ML-KEM-768')
        ciphertextBytes = encapResult.ciphertextBytes
        sharedSecret = hsm_extractKeyValue(M, session, encapResult.secretHandle)
        hsm_destroyObject(M, session, encapResult.secretHandle)
      } else {
        const encapResult = ml_kem768.encapsulate(pubKey)
        ciphertextBytes = encapResult.cipherText
        sharedSecret = encapResult.sharedSecret
      }
      await new Promise((r) => setTimeout(r, 250))

      // Step 3: derive CEK via KMAC256 per draft-ietf-jose-pqc-kem-05 §5.1
      setActiveStep('derive')
      const cek = deriveCek(sharedSecret, 'A256GCM', 32)
      await new Promise((r) => setTimeout(r, 250))

      // Step 4: AES-256-GCM encrypt
      setActiveStep('encrypt')
      const iv = crypto.getRandomValues(new Uint8Array(12))
      const cekBuf = cek.buffer.slice(cek.byteOffset, cek.byteOffset + cek.byteLength)
      const aesKey = await crypto.subtle.importKey(
        'raw',
        cekBuf as ArrayBuffer,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      )
      const plaintext = new TextEncoder().encode(JSON.stringify(SAMPLE_JWT_PAYLOAD))
      // draft-ietf-jose-pqc-kem-05 §6.1: the KEM ciphertext goes in "ek". Compact
      // Serialization has only a protected header, so that is where it lives.
      const ekB64 = base64urlEncode(ciphertextBytes)
      const headerB64 = base64urlEncode(
        new TextEncoder().encode(JSON.stringify({ alg: 'ML-KEM-768', enc: 'A256GCM', ek: ekB64 }))
      )
      // RFC 7516 §5.1 step 14: AAD = ASCII(Encoded Protected Header).
      const aad = new TextEncoder().encode(headerB64)
      const encryptedWithTag = new Uint8Array(
        await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad }, aesKey, plaintext)
      )
      const ciphertext = encryptedWithTag.subarray(0, encryptedWithTag.length - 16)
      const tag = encryptedWithTag.subarray(encryptedWithTag.length - 16)
      await new Promise((r) => setTimeout(r, 250))

      // Step 5: assemble
      setActiveStep('assemble')
      const ivB64 = base64urlEncode(iv)
      const ciphertextB64 = base64urlEncode(ciphertext)
      const tagB64 = base64urlEncode(tag)
      // Direct key agreement: "The JWE Encrypted Key MUST be absent" — an
      // empty second segment in Compact Serialization.
      const fullToken = `${headerB64}..${ivB64}.${ciphertextB64}.${tagB64}`

      setResult({
        headerB64,
        ekB64,
        ivB64,
        ciphertextB64,
        tagB64,
        fullToken,
        sharedSecret,
        cek,
        pubKey,
      })
    } catch (e) {
      setEncryptError(e instanceof Error ? e.message : String(e))
    } finally {
      setIsEncrypting(false)
    }
  }, [backend, hsmCtx])

  const handleDecrypt = useCallback(async () => {
    if (!result || !keys) return
    setIsDecrypting(true)
    setDecryptError(null)
    setDecryptedPayload(null)
    try {
      // Decrypt from the assembled token itself — on both backends — so the
      // serialization shown on screen is what actually round-trips.
      const parts = result.fullToken.split('.')
      if (parts.length !== 5) throw new Error('JWE Compact Serialization must have 5 parts')
      const [headerB64, encryptedKeyB64, ivB64, ciphertextB64, tagB64] = parts
      if (encryptedKeyB64 !== '') {
        throw new Error('direct key agreement: the JWE Encrypted Key must be absent')
      }
      const header = JSON.parse(new TextDecoder().decode(base64urlDecode(headerB64))) as {
        alg?: string
        enc?: string
        ek?: string
      }
      if (header.alg !== 'ML-KEM-768' || header.enc !== 'A256GCM' || !header.ek) {
        throw new Error('unexpected protected header: need alg ML-KEM-768, enc A256GCM, ek')
      }
      const kemCiphertext = base64urlDecode(header.ek)
      const iv = base64urlDecode(ivB64)
      const ciphertext = base64urlDecode(ciphertextB64)
      const tag = base64urlDecode(tagB64)
      // RFC 7516 §5.2 step 15: AAD = ASCII(Encoded Protected Header).
      const aad = new TextEncoder().encode(headerB64)

      let sharedSecret: Uint8Array
      if (backend === 'softhsmv3' && hsmCtx && keys.privHandle !== undefined) {
        const { M, session } = hsmCtx
        const secretHandle = hsm_pqcDecap(M, session, keys.privHandle, kemCiphertext, 'ML-KEM-768')
        sharedSecret = hsm_extractKeyValue(M, session, secretHandle)
        hsm_destroyObject(M, session, secretHandle)
      } else {
        sharedSecret = ml_kem768.decapsulate(kemCiphertext, keys.secKey)
      }

      const cek = deriveCek(sharedSecret, 'A256GCM', 32)
      const cekBuf = cek.buffer.slice(cek.byteOffset, cek.byteOffset + cek.byteLength)
      const aesKey = await crypto.subtle.importKey(
        'raw',
        cekBuf as ArrayBuffer,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      )
      const combined = new Uint8Array(ciphertext.length + tag.length)
      combined.set(ciphertext, 0)
      combined.set(tag, ciphertext.length)
      const combinedBuf = combined.buffer.slice(0, combined.byteLength)
      const aadBuf = aad.buffer.slice(aad.byteOffset, aad.byteOffset + aad.byteLength)
      const ivBuf = iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength)
      const plaintextBytes = new Uint8Array(
        await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: ivBuf as ArrayBuffer, additionalData: aadBuf as ArrayBuffer },
          aesKey,
          combinedBuf as ArrayBuffer
        )
      )
      setDecryptedPayload(new TextDecoder().decode(plaintextBytes))
    } catch (e) {
      setDecryptError(e instanceof Error ? e.message : String(e))
    } finally {
      setIsDecrypting(false)
    }
  }, [result, keys, backend, hsmCtx])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">
          JWE Encryption with ML-KEM{' '}
          <span className="text-[10px] align-middle px-2 py-0.5 rounded border font-bold bg-warning/20 text-warning border-warning/50">
            historical draft · not interoperable
          </span>
        </h3>
        <p className="text-sm text-muted-foreground">
          Walk through the five-step JWE encryption flow using ML-KEM-768 (
          {/* Link the -05 ARCHIVE, not the datatracker landing page. That page
              now serves -06, which was retitled "PQ KEMs for COSE" and contains
              no JWE algorithms at all — so a reader following it to check this
              lesson would find nothing matching what they just ran. */}
          <a
            href="https://www.ietf.org/archive/id/draft-ietf-jose-pqc-kem-05.txt"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            draft-ietf-jose-pqc-kem-05
          </a>
          ) for key agreement and AES-256-GCM (WebCrypto) for content encryption. All operations run
          real crypto in your browser. This flow follows revision <strong>-05</strong>, which
          covered JOSE and COSE; revision -06 (2026) narrowed the document to COSE only, so no
          current specification defines these JWE algorithms. PQ encryption for JWE now runs through
          HPKE:{' '}
          <a
            href="https://datatracker.ietf.org/doc/draft-ietf-jose-hpke-encrypt/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            draft-ietf-jose-hpke-encrypt
          </a>{' '}
          (in the RFC Editor queue) plus the ML-KEM suites in{' '}
          <a
            href="https://datatracker.ietf.org/doc/draft-ietf-jose-hpke-pq-pqt/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            draft-ietf-jose-hpke-pq-pqt
          </a>
          . Use this tab to see how a KEM slots into JWE, not as a format to deploy.
        </p>
      </div>

      {/* Backend selector */}
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck size={16} className="text-primary" />
          <h4 className="text-sm font-bold text-foreground">KEM backend</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              setBackend('noble')
              setResult(null)
              setKeys(null)
              setDecryptedPayload(null)
            }}
            className={`px-3 py-1.5 rounded text-xs font-medium border ${
              backend === 'noble'
                ? 'bg-primary/20 text-primary border-primary/50'
                : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/30'
            }`}
          >
            @noble/post-quantum (pure JS)
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setBackend('softhsmv3')
              setResult(null)
              setKeys(null)
              setDecryptedPayload(null)
            }}
            className={`px-3 py-1.5 rounded text-xs font-medium border ${
              backend === 'softhsmv3'
                ? 'bg-primary/20 text-primary border-primary/50'
                : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/30'
            }`}
          >
            SoftHSM3 (PKCS#11 v3.2 WASM)
          </Button>
        </div>
        {backend === 'softhsmv3' && (
          <div className="mt-3">
            <LiveHSMToggle
              hsm={hsm}
              operations={['C_GenerateKeyPair', 'C_EncapsulateKey', 'C_DecapsulateKey']}
            />
          </div>
        )}
      </div>

      {/* JWE Format Explainer */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3">
          JWE Compact Serialization (5 parts)
        </h4>
        <div className="bg-background rounded-lg p-3 border border-border overflow-x-auto">
          <div className="flex flex-wrap gap-1 items-center text-xs font-mono">
            <span className="px-2 py-1 rounded bg-primary/10 text-primary">Header</span>
            <span className="text-muted-foreground font-bold">.</span>
            <span className="px-2 py-1 rounded bg-warning/10 text-warning">Encrypted Key</span>
            <span className="text-muted-foreground font-bold">.</span>
            <span className="px-2 py-1 rounded bg-secondary/10 text-secondary">IV</span>
            <span className="text-muted-foreground font-bold">.</span>
            <span className="px-2 py-1 rounded bg-destructive/10 text-status-error">
              Ciphertext
            </span>
            <span className="text-muted-foreground font-bold">.</span>
            <span className="px-2 py-1 rounded bg-success/10 text-success">Auth Tag</span>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Unlike JWS (3 parts), JWE has 5 base64url-encoded parts. In direct key agreement the
          Encrypted Key is empty: the ML-KEM ciphertext (1,088 bytes for ML-KEM-768) rides in the
          protected header&apos;s <code>ek</code> parameter, where the AAD covers it.
        </p>
      </div>

      {/* Step Progress */}
      <div className="flex flex-wrap gap-2">
        {JWE_STEPS.map((step) => (
          <Button
            variant="ghost"
            key={step.id}
            onClick={() => setActiveStep(step.id)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeStep === step.id
                ? 'bg-primary/20 text-primary border border-primary/50'
                : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
            }`}
          >
            {step.label.split('.')[0]}
          </Button>
        ))}
      </div>

      {/* Step Description */}
      <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
        <div className="text-xs font-bold text-primary mb-1">
          {JWE_STEPS.find((s) => s.id === activeStep)?.label}
        </div>
        <p className="text-sm text-foreground">
          {JWE_STEPS.find((s) => s.id === activeStep)?.description}
        </p>
      </div>

      {/* Pipeline */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3">Encryption Pipeline</h4>
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-0">
          {JWE_STEPS.map((step, idx) => (
            <React.Fragment key={step.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setActiveStep(step.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setActiveStep(step.id)
                  }
                }}
                className={`flex-1 text-center p-2 rounded-lg border transition-colors cursor-pointer ${
                  activeStep === step.id
                    ? 'bg-primary/10 border-primary/50 text-primary'
                    : JWE_STEPS.findIndex((s) => s.id === activeStep) > idx
                      ? 'bg-success/10 border-success/30 text-success'
                      : 'bg-muted/50 border-border text-muted-foreground'
                }`}
              >
                <div className="text-[10px] font-bold">{step.label.split('.')[0]}</div>
              </div>
              {idx < JWE_STEPS.length - 1 && (
                <ArrowRight
                  size={12}
                  className="text-muted-foreground hidden sm:block mx-0.5 shrink-0"
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Encrypt / Decrypt */}
      <div className="flex justify-center gap-3 flex-wrap">
        <Button
          variant="gradient"
          onClick={() => void handleEncrypt()}
          disabled={isEncrypting || (backend === 'softhsmv3' && !hsmCtx)}
          className="px-6 py-3 font-bold rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          <Lock size={16} />
          {isEncrypting ? 'Encrypting...' : 'Encrypt JWT Payload'}
        </Button>
        {result && (
          <Button
            variant="ghost"
            onClick={() => void handleDecrypt()}
            disabled={isDecrypting || (backend === 'softhsmv3' && !hsmCtx)}
            className="px-6 py-3 bg-secondary text-secondary-foreground font-bold rounded-lg hover:bg-secondary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <Unlock size={16} />
            {isDecrypting ? 'Decrypting...' : 'Decrypt'}
          </Button>
        )}
      </div>

      {encryptError && (
        <div className="rounded-lg p-3 border border-destructive/50 bg-destructive/10 text-xs text-status-error">
          {encryptError}
        </div>
      )}

      {/* Intermediate Values */}
      {keys && (
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-3">
            <Key size={16} className="text-primary" />
            <h4 className="text-sm font-bold text-foreground">Intermediate Cryptographic Values</h4>
          </div>
          <div className="space-y-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-[10px] font-bold text-primary mb-1">
                ML-KEM-768 Public Key ({keys.pubKey.length.toLocaleString()} bytes)
                {backend === 'softhsmv3' && keys.pubHandle !== undefined && (
                  <span className="ml-2 text-muted-foreground font-normal">
                    handle {keys.pubHandle}
                  </span>
                )}
              </div>
              <code className="text-[10px] font-mono text-foreground/70 break-all">
                {bytesToHex(keys.pubKey).substring(0, 192)}…
              </code>
            </div>
            {result && (
              <>
                <div className="bg-muted/50 rounded-lg p-3 border border-border">
                  <div className="text-[10px] font-bold text-warning mb-1">
                    Shared Secret ({result.sharedSecret.length} bytes — recovered on both sides)
                  </div>
                  <code className="text-[10px] font-mono text-foreground/70 break-all">
                    {bytesToHex(result.sharedSecret)}
                  </code>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 border border-border">
                  <div className="text-[10px] font-bold text-success mb-1">
                    Content Encryption Key / CEK ({result.cek.length} bytes, KMAC256 of shared
                    secret)
                  </div>
                  <code className="text-[10px] font-mono text-foreground/70 break-all">
                    {bytesToHex(result.cek)}
                  </code>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* JWE Parts Display */}
      {result && (
        <div className="glass-panel p-4">
          <h4 className="text-sm font-bold text-foreground mb-3">JWE Token Parts</h4>
          <div className="space-y-3">
            {[
              {
                label: `Protected header (alg, enc, and ek = ML-KEM ciphertext, ${mlKem768Meta.ctBytes} B)`,
                value: result.headerB64,
                color: 'text-primary',
                bg: 'bg-primary/10',
              },
              {
                label: 'Encrypted Key (empty in direct key agreement)',
                value: '',
                color: 'text-warning',
                bg: 'bg-warning/10',
              },
              {
                label: 'Initialization Vector (96-bit)',
                value: result.ivB64,
                color: 'text-secondary',
                bg: 'bg-secondary/10',
              },
              {
                label: 'Ciphertext (AES-256-GCM)',
                value: result.ciphertextB64,
                color: 'text-destructive',
                bg: 'bg-destructive/10',
              },
              {
                label: 'Authentication Tag (128-bit)',
                value: result.tagB64,
                color: 'text-success',
                bg: 'bg-success/10',
              },
            ].map((part) => (
              <div key={part.label} className="bg-muted/50 rounded-lg p-3 border border-border">
                <div className={`text-[10px] font-bold ${part.color} mb-1`}>{part.label}</div>
                <div className={`${part.bg} rounded p-2 overflow-x-auto`}>
                  <code className="text-[10px] font-mono text-foreground/70 break-all">
                    {part.value.substring(0, 120)}
                    {part.value.length > 120 && '...'}
                  </code>
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {part.value.length} base64url characters
                </div>
              </div>
            ))}

            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-[10px] font-bold text-foreground mb-1">Total JWE Size</div>
              <div className="text-sm font-mono font-bold text-foreground">
                {result.fullToken.length.toLocaleString()} characters (
                {(result.fullToken.length / 1024).toFixed(1)} KB)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Decrypted Payload */}
      {decryptedPayload && (
        <div className="glass-panel p-4 border-success/20">
          <div className="flex items-center gap-2 mb-3">
            <Unlock size={16} className="text-success" />
            <h4 className="text-sm font-bold text-foreground">Decrypted Payload</h4>
            <span className="text-[10px] px-2 py-0.5 rounded border font-bold bg-success/20 text-success border-success/50">
              GCM tag verified
            </span>
          </div>
          <pre className="text-xs font-mono text-foreground/80 bg-background rounded p-3 border border-border overflow-x-auto">
            {(() => {
              try {
                return JSON.stringify(JSON.parse(decryptedPayload), null, 2)
              } catch {
                return decryptedPayload
              }
            })()}
          </pre>
          <p className="text-[10px] text-muted-foreground mt-2">
            {backend === 'softhsmv3'
              ? 'Decryption: C_DecapsulateKey → shared_secret → KMAC256 → CEK → AES-GCM-Decrypt → plaintext'
              : 'Decryption: ML-KEM.Decaps(sk, ct) → shared_secret → KMAC256 → CEK → AES-GCM-Decrypt → plaintext'}
          </p>
        </div>
      )}

      {decryptError && (
        <div className="rounded-lg p-3 border border-destructive/50 bg-destructive/10 text-xs text-status-error flex items-center gap-2">
          <XCircle size={14} /> {decryptError}
        </div>
      )}

      {/* Educational note */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Key insight:</strong> JWE with ML-KEM replaces the ECDH-ES key agreement step with
          KEM encapsulation; AES-GCM content encryption is unchanged. Where ECDH-ES puts the
          sender&apos;s ephemeral public key in the <code>epk</code> header, this draft put the
          1,088-byte KEM ciphertext in <code>ek</code>, and both leave the Encrypted Key empty. The
          HPKE design that replaced it (Integrated Encryption) moves the encapsulated key into the
          Encrypted Key segment instead — one reason a format still in draft is no basis for
          production tokens.
        </p>
      </div>
    </div>
  )
}
