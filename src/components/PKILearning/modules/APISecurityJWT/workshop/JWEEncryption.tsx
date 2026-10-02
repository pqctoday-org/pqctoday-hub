// SPDX-License-Identifier: GPL-3.0-only

import React, { useState, useCallback, useMemo } from 'react'
import { Lock, Unlock, ArrowRight, Key, XCircle, CheckCircle } from 'lucide-react'
import { SAMPLE_JWT_PAYLOAD } from '../constants'
import { base64urlDecode, base64urlEncode, bytesToHex } from '../jwtUtils'
import {
  HPKE_JWE_ALGS,
  HPKE_JWE_SPEC,
  HPKE_JWE_SUITES,
  type HpkeJweAlg,
  generateHpkeKeyPair,
  hpkeJweDecrypt,
  hpkeJweDecryptInHsm,
  hpkeJweEncrypt,
  hpkeJweEncryptInHsm,
} from '../hpkeJwe'
import { type HsmHpkeRecipient, hsmHpkeRecipient, softHsmHpkeOps } from '../hpkeJweHsm'
import publishedExamples from '@/data/acvp/jose-hpke-pq-pqt-01-examples.json'
import { Button } from '@/components/ui/button'
import { ShieldCheck } from 'lucide-react'
import { useHSM } from '@/hooks/useHSM'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'

type JwsBackend = 'noble' | 'softhsmv3'
type JWEStep = 'keygen' | 'header' | 'seal' | 'assemble'

const stepsFor = (alg: HpkeJweAlg): { id: JWEStep; label: string; description: string }[] => {
  const s = HPKE_JWE_SUITES[alg]
  return [
    {
      id: 'keygen',
      label: `1. Generate ${s.kemName} Keypair`,
      description: `The recipient generates a ${s.kemName} keypair and publishes the public key (${s.Npk.toLocaleString()} bytes) as an "AKP" JWK with "alg": "${alg}". The private key is a ${s.Nsk}-byte seed.${
        s.kind === 'pq-t-hybrid'
          ? ' MLKEM768-X25519 is the X-Wing hybrid: an attacker has to break both ML-KEM-768 and X25519.'
          : ''
      }`,
    },
    {
      id: 'header',
      label: '2. Build the Protected Header',
      description: `The header names only "alg" (and here "kid"). In Integrated Encryption, "enc" MUST NOT be present — HPKE itself encrypts the payload, so there is no separate content encryption algorithm — and "ek" MUST NOT be present either (draft-ietf-jose-hpke-encrypt-22 §5). The encoded header becomes the AAD.`,
    },
    {
      id: 'seal',
      label: '3. HPKE Seal',
      description: `HPKE runs Encap(pk) to get a shared secret and a ${s.Nenc.toLocaleString()}-byte encapsulated secret, derives the AEAD key and nonce with the single-stage SHAKE256 KDF, and encrypts the payload with AES-256-GCM using AAD = ASCII(BASE64URL(protected header)). The 16-byte GCM tag is part of the HPKE ciphertext.`,
    },
    {
      id: 'assemble',
      label: '4. Assemble JWE',
      description:
        'The five JWE Compact parts: protected header . Encrypted Key (= the HPKE encapsulated secret) . empty IV . HPKE ciphertext . empty Authentication Tag. IV and Tag are empty because HPKE manages its own nonce and tag.',
    },
  ]
}

interface JWEKeys {
  alg: HpkeJweAlg
  pubKey: Uint8Array
  /** KEM seed (noble backend); empty when the key lives in the HSM. */
  seed: Uint8Array
  /** SoftHSM3 key handles, when the whole HPKE operation runs in the token. */
  hsmKeys?: HsmHpkeRecipient
}

interface JWEResult {
  alg: HpkeJweAlg
  headerB64: string
  encapsulatedKeyB64: string
  ciphertextB64: string
  fullToken: string
  encapsulatedKeyBytes: number
  ciphertextBytes: number
}

const KID = 'workshop-recipient'

export const JWEEncryption: React.FC = () => {
  const [backend, setBackend] = useState<JwsBackend>('noble')
  const [alg, setAlg] = useState<HpkeJweAlg>('HPKE-12')
  const [activeStep, setActiveStep] = useState<JWEStep>('keygen')
  const [keys, setKeys] = useState<JWEKeys | null>(null)
  const [result, setResult] = useState<JWEResult | null>(null)
  const [isEncrypting, setIsEncrypting] = useState(false)
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [decryptedPayload, setDecryptedPayload] = useState<string | null>(null)
  const [decryptError, setDecryptError] = useState<string | null>(null)
  const [encryptError, setEncryptError] = useState<string | null>(null)
  const [exampleCheck, setExampleCheck] = useState<{ ok: boolean; message: string } | null>(null)

  const hsm = useHSM('rust')
  const steps = useMemo(() => stepsFor(alg), [alg])
  const suite = HPKE_JWE_SUITES[alg]
  // SoftHSM3 runs both suites (CKM_HPKE with the SHAKE256 KDF).
  const useHsm = backend === 'softhsmv3'

  const hsmCtx = useMemo(() => {
    if (!useHsm || !hsm.isReady || !hsm.moduleRef.current) return undefined
    const M = hsm.moduleRef.current
    const session = hsm.hSessionRef.current
    return { M, session, ops: softHsmHpkeOps(M, session) }
  }, [useHsm, hsm.isReady, hsm.moduleRef, hsm.hSessionRef])

  const reset = () => {
    setResult(null)
    setKeys(null)
    setDecryptedPayload(null)
    setDecryptError(null)
    setEncryptError(null)
    setActiveStep('keygen')
  }

  const handleEncrypt = useCallback(async () => {
    setIsEncrypting(true)
    setEncryptError(null)
    setDecryptedPayload(null)
    setDecryptError(null)
    setResult(null)
    try {
      // Step 1: recipient keypair
      setActiveStep('keygen')
      let newKeys: JWEKeys
      if (useHsm && hsmCtx) {
        // CKM_HPKE_KEM_KEY_PAIR_GEN: the token picks the seed and keeps it.
        const recipient = hsmHpkeRecipient(hsmCtx.M, hsmCtx.session, alg)
        newKeys = { alg, pubKey: recipient.publicKey, seed: new Uint8Array(0), hsmKeys: recipient }
      } else {
        const kp = await generateHpkeKeyPair(alg)
        newKeys = { alg, pubKey: kp.publicKey, seed: kp.privateKey }
      }
      setKeys(newKeys)
      await new Promise((r) => setTimeout(r, 250))

      // Step 2: protected header {alg, kid} — no "enc", no "ek"
      setActiveStep('header')
      await new Promise((r) => setTimeout(r, 250))

      // Step 3: HPKE Seal (Encap → SHAKE256 key schedule → AES-256-GCM)
      setActiveStep('seal')
      const plaintext = new TextEncoder().encode(JSON.stringify(SAMPLE_JWT_PAYLOAD))
      const sealed =
        newKeys.hsmKeys && hsmCtx
          ? hpkeJweEncryptInHsm({
              alg,
              plaintext,
              hsm: hsmCtx.ops,
              pubHandle: newKeys.hsmKeys.pubHandle,
              kid: KID,
            })
          : await hpkeJweEncrypt({ alg, plaintext, publicKey: newKeys.pubKey, kid: KID })
      await new Promise((r) => setTimeout(r, 250))

      // Step 4: assemble
      setActiveStep('assemble')
      const [headerB64, encapsulatedKeyB64, , ciphertextB64] = sealed.token.split('.')
      setResult({
        alg,
        headerB64,
        encapsulatedKeyB64,
        ciphertextB64,
        fullToken: sealed.token,
        encapsulatedKeyBytes: sealed.encapsulatedKey.length,
        ciphertextBytes: sealed.ciphertext.length,
      })
    } catch (e) {
      setEncryptError(e instanceof Error ? e.message : String(e))
    } finally {
      setIsEncrypting(false)
    }
  }, [alg, useHsm, hsmCtx])

  const handleDecrypt = useCallback(async () => {
    if (!result || !keys) return
    setIsDecrypting(true)
    setDecryptError(null)
    setDecryptedPayload(null)
    try {
      // Decrypt the assembled token itself, with the -22 checks: alg must be the
      // key's algorithm, no "enc"/"ek", empty IV and Tag.
      const { plaintext } =
        keys.hsmKeys && hsmCtx
          ? hpkeJweDecryptInHsm({
              token: result.fullToken,
              alg: keys.alg,
              hsm: hsmCtx.ops,
              privHandle: keys.hsmKeys.privHandle,
            })
          : await hpkeJweDecrypt({ token: result.fullToken, alg: keys.alg, privateKey: keys.seed })
      setDecryptedPayload(new TextDecoder().decode(plaintext))
    } catch (e) {
      setDecryptError(e instanceof Error ? e.message : String(e))
    } finally {
      setIsDecrypting(false)
    }
  }, [result, keys, hsmCtx])

  const handleCheckExample = useCallback(async () => {
    setExampleCheck(null)
    const v = publishedExamples.vectors.find((x) => x.alg === alg)
    if (!v) return
    try {
      const seed = base64urlDecode(v.jwk.priv)
      let plaintext: Uint8Array
      let where: string
      if (useHsm && hsmCtx) {
        // Import the published "priv" seed into the token, let it derive "pub",
        // and open the published JWE there.
        const recipient = hsmHpkeRecipient(hsmCtx.M, hsmCtx.session, alg, seed)
        if (base64urlEncode(recipient.publicKey) !== v.jwk.pub) {
          throw new Error('SoftHSM3 derived a different public key from the published seed')
        }
        plaintext = hpkeJweDecryptInHsm({
          token: v.compact,
          alg,
          hsm: hsmCtx.ops,
          privHandle: recipient.privHandle,
        }).plaintext
        where =
          'inside SoftHSM3 (seed imported, public key re-derived and matched, CKM_HPKE + AES-256-GCM in the token)'
      } else {
        plaintext = (await hpkeJweDecrypt({ token: v.compact, alg, privateKey: seed })).plaintext
        where = 'in your browser with its published private key'
      }
      const ok = new TextDecoder().decode(plaintext) === publishedExamples.plaintext
      setExampleCheck({
        ok,
        message: ok
          ? `Decrypted the ${alg} example from ${HPKE_JWE_SPEC.suites} Appendix A ${where} — plaintext matches.`
          : `The ${alg} example decrypted, but the plaintext does not match the published one.`,
      })
    } catch (e) {
      setExampleCheck({ ok: false, message: e instanceof Error ? e.message : String(e) })
    }
  }, [alg, useHsm, hsmCtx])

  const tabBtn = (active: boolean) =>
    `px-3 py-1.5 rounded text-xs font-medium border ${
      active
        ? 'bg-primary/20 text-primary border-primary/50'
        : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/30'
    }`

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">
          JWE Encryption with HPKE{' '}
          <span className="text-[10px] align-middle px-2 py-0.5 rounded border font-bold bg-warning/20 text-warning border-warning/50">
            experimental · {HPKE_JWE_SPEC.suites}
          </span>
        </h3>
        <p className="text-sm text-muted-foreground">
          Post-quantum JWE runs through HPKE.{' '}
          <a
            href="https://datatracker.ietf.org/doc/draft-ietf-jose-hpke-encrypt/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            draft-ietf-jose-hpke-encrypt
          </a>{' '}
          (in the RFC Editor queue) defines how HPKE carries a JWE, and{' '}
          <a
            href="https://www.ietf.org/archive/id/draft-ietf-jose-hpke-pq-pqt-01.txt"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            draft-ietf-jose-hpke-pq-pqt-01
          </a>{' '}
          registers the ML-KEM suites used here. All operations run real crypto in your browser, and
          the code is checked against the examples published in that draft. It is still an early
          working-group draft, so the algorithm names may change — not a format to deploy yet. An
          earlier direct-KEM design (draft-ietf-jose-pqc-kem) was dropped for JOSE in 2026.
        </p>
      </div>

      {/* Suite + backend */}
      <div className="glass-panel p-4 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Key size={16} className="text-primary" />
            <h4 className="text-sm font-bold text-foreground">HPKE suite (&quot;alg&quot;)</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {HPKE_JWE_ALGS.map((a) => (
              <Button
                key={a}
                variant="ghost"
                onClick={() => {
                  setAlg(a)
                  setExampleCheck(null)
                  reset()
                }}
                className={tabBtn(alg === a)}
              >
                {HPKE_JWE_SUITES[a].label}
              </Button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Both use the SHAKE256 KDF and AES-256-GCM. The hybrid keeps a classical X25519
            component, so a flaw found in ML-KEM alone would not expose the payload.
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={16} className="text-primary" />
            <h4 className="text-sm font-bold text-foreground">KEM backend</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setBackend('noble')
                reset()
              }}
              className={tabBtn(backend === 'noble')}
            >
              @noble/post-quantum (pure JS)
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setBackend('softhsmv3')
                reset()
              }}
              className={tabBtn(backend === 'softhsmv3')}
            >
              SoftHSM3 (PKCS#11 v3.2 WASM)
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            {useHsm
              ? `The whole HPKE operation runs inside SoftHSM3 through the vendor mechanism CKM_HPKE: ${suite.kemName} encapsulation, the SHAKE256 key schedule and AES-256-GCM. The private key (a seed) and the content-encryption key are non-extractable token objects; only the public key, the encapsulated secret and the ciphertext leave the token.`
              : 'The browser path runs @noble/post-quantum (ML-KEM, X-Wing) and @noble/hashes (SHAKE256) inside the hpke package.'}
          </p>
          {useHsm && (
            <div className="mt-3">
              <LiveHSMToggle
                hsm={hsm}
                operations={[
                  'C_GenerateKeyPair',
                  'C_EncapsulateKey',
                  'C_DecapsulateKey',
                  'C_EncryptInit',
                  'C_Encrypt',
                  'C_DecryptInit',
                  'C_Decrypt',
                ]}
              />
            </div>
          )}
        </div>
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
            <span className="px-2 py-1 rounded bg-muted text-muted-foreground">IV (empty)</span>
            <span className="text-muted-foreground font-bold">.</span>
            <span className="px-2 py-1 rounded bg-destructive/10 text-status-error">
              Ciphertext
            </span>
            <span className="text-muted-foreground font-bold">.</span>
            <span className="px-2 py-1 rounded bg-muted text-muted-foreground">Tag (empty)</span>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          JWE keeps its 5 parts. In HPKE Integrated Encryption the Encrypted Key carries the HPKE
          encapsulated secret ({suite.Nenc.toLocaleString()} bytes for {alg}), and the IV and Tag
          stay empty because HPKE manages its own nonce and puts the GCM tag inside the ciphertext.
        </p>
      </div>

      {/* Step Progress */}
      <div className="flex flex-wrap gap-2">
        {steps.map((step) => (
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
          {steps.find((s) => s.id === activeStep)?.label}
        </div>
        <p className="text-sm text-foreground">
          {steps.find((s) => s.id === activeStep)?.description}
        </p>
      </div>

      {/* Pipeline */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3">Encryption Pipeline</h4>
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-0">
          {steps.map((step, idx) => (
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
                    : steps.findIndex((s) => s.id === activeStep) > idx
                      ? 'bg-success/10 border-success/30 text-success'
                      : 'bg-muted/50 border-border text-muted-foreground'
                }`}
              >
                <div className="text-[10px] font-bold">{step.label.split('.')[0]}</div>
              </div>
              {idx < steps.length - 1 && (
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
          disabled={isEncrypting || (useHsm && !hsmCtx)}
          className="px-6 py-3 font-bold rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          <Lock size={16} />
          {isEncrypting ? 'Encrypting...' : 'Encrypt JWT Payload'}
        </Button>
        {result && (
          <Button
            variant="ghost"
            onClick={() => void handleDecrypt()}
            disabled={isDecrypting || (keys?.hsmKeys !== undefined && !hsmCtx)}
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

      {/* Recipient key */}
      {keys && (
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-3">
            <Key size={16} className="text-primary" />
            <h4 className="text-sm font-bold text-foreground">Recipient Key</h4>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-[10px] font-bold text-primary mb-1">
              {HPKE_JWE_SUITES[keys.alg].kemName} public key ({keys.pubKey.length.toLocaleString()}{' '}
              bytes) — JWK {'{'} &quot;kty&quot;: &quot;AKP&quot;, &quot;alg&quot;: &quot;{keys.alg}
              &quot; {'}'}
              {keys.hsmKeys && (
                <span className="ml-2 text-muted-foreground font-normal">
                  private key (seed) stays in SoftHSM3
                </span>
              )}
            </div>
            <code className="text-[10px] font-mono text-foreground/70 break-all">
              {bytesToHex(keys.pubKey).substring(0, 192)}…
            </code>
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
                label: `Protected header (alg ${result.alg}, kid — no "enc", no "ek")`,
                value: result.headerB64,
                color: 'text-primary',
                bg: 'bg-primary/10',
              },
              {
                label: `Encrypted Key = HPKE encapsulated secret, ${result.encapsulatedKeyBytes} B`,
                value: result.encapsulatedKeyB64,
                color: 'text-warning',
                bg: 'bg-warning/10',
              },
              {
                label: 'Initialization Vector (empty in Integrated Encryption)',
                value: '',
                color: 'text-muted-foreground',
                bg: 'bg-muted',
              },
              {
                label: `Ciphertext (HPKE / AES-256-GCM, ${result.ciphertextBytes} B incl. 16-byte tag)`,
                value: result.ciphertextB64,
                color: 'text-destructive',
                bg: 'bg-destructive/10',
              },
              {
                label: 'Authentication Tag (empty — the tag is inside the ciphertext)',
                value: '',
                color: 'text-muted-foreground',
                bg: 'bg-muted',
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
            {keys?.hsmKeys
              ? 'Decryption: check alg / no enc, ek / empty IV, Tag → C_DecapsulateKey(CKM_HPKE: Decap + SHAKE256 key schedule, in the token) → C_Decrypt(AES-256-GCM) on the non-extractable key → plaintext'
              : `Decryption: check alg / no enc, ek / empty IV, Tag → ${suite.kemName}.Decap → SHAKE256 key schedule → AES-256-GCM open → plaintext`}
          </p>
        </div>
      )}

      {decryptError && (
        <div className="rounded-lg p-3 border border-destructive/50 bg-destructive/10 text-xs text-status-error flex items-center gap-2">
          <XCircle size={14} /> {decryptError}
        </div>
      )}

      {/* Published example */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-2">
          Check against the draft&apos;s published example
        </h4>
        <p className="text-xs text-muted-foreground mb-3">
          {HPKE_JWE_SPEC.suites} Appendix A publishes, for each algorithm, a private key and a JWE
          made by the draft authors with a different ML-KEM implementation. Decrypting it here shows
          this code interoperates with theirs, not just with itself. With the SoftHSM3 backend the
          published private key is imported into the token and the example is opened there.
        </p>
        <Button
          variant="ghost"
          onClick={() => void handleCheckExample()}
          disabled={useHsm && !hsmCtx}
          className="px-4 py-2 text-xs font-medium rounded border border-border hover:border-primary/30"
        >
          Decrypt the published {alg} example
        </Button>
        {exampleCheck && (
          <div
            className={`mt-3 rounded-lg p-3 border text-xs flex items-center gap-2 ${
              exampleCheck.ok
                ? 'border-success/50 bg-success/10 text-success'
                : 'border-destructive/50 bg-destructive/10 text-status-error'
            }`}
          >
            {exampleCheck.ok ? <CheckCircle size={14} /> : <XCircle size={14} />}
            {exampleCheck.message}
          </div>
        )}
      </div>

      {/* Educational note */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Key insight:</strong> moving JWE to post-quantum changes the key-establishment
          step, not the token format. HPKE packages &quot;encapsulate a key, derive a symmetric key,
          encrypt&quot; as one standard operation, so the same JWE layout works for classical ECDH
          suites (HPKE-0 to HPKE-7) and for ML-KEM. What does change is size: the{' '}
          {suite.Nenc.toLocaleString()}-byte encapsulated secret makes every encrypted token roughly
          1.5 KB larger than its plaintext.
        </p>
      </div>
    </div>
  )
}
