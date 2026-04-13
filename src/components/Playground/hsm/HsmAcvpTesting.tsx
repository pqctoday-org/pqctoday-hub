// SPDX-License-Identifier: GPL-3.0-only
import { useState, useRef } from 'react'
import { Play, CheckCircle, XCircle, ExternalLink, Copy, Check } from 'lucide-react'
import clsx from 'clsx'
import mlkemTestVectors from '../../../data/acvp/mlkem_test.json'
import mldsaTestVectors from '../../../data/acvp/mldsa_test.json'
import aesGcmTestVectors from '../../../data/acvp/aesgcm_test.json'
import hmacTestVectors from '../../../data/acvp/hmac_test.json'
import rsaPssTestVectors from '../../../data/acvp/rsapss_test.json'
import ecdsaTestVectors from '../../../data/acvp/ecdsa_test.json'
import sha256TestVectors from '../../../data/acvp/sha256_test.json'
import aesCbcTestVectors from '../../../data/acvp/aescbc_test.json'
import aesCtrTestVectors from '../../../data/acvp/aesctr_test.json'
import hmac384TestVectors from '../../../data/acvp/hmac_sha384_test.json'
import hmac512TestVectors from '../../../data/acvp/hmac_sha512_test.json'
import ecdsaP384TestVectors from '../../../data/acvp/ecdsa_p384_test.json'
import aesKwTestVectors from '../../../data/acvp/aeskw_test.json'
import eddsaTestVectors from '../../../data/acvp/eddsa_test.json'
import { hexToBytes } from '../../../utils/dataInputUtils'
import {
  hsm_initialize,
  hsm_finalize,
  hsm_getFirstSlot,
  hsm_initToken,
  hsm_openUserSession,
  hsm_importAESKey,
  hsm_aesDecrypt,
  hsm_importHMACKey,
  hsm_hmacVerify,
  hsm_importRSAPublicKey,
  hsm_rsaVerify,
  CKM_SHA256_RSA_PKCS_PSS,
  hsm_importECPublicKey,
  hsm_ecdsaVerify,
  hsm_importMLKEMPrivateKey,
  hsm_decapsulate,
  hsm_extractKeyValue,
  hsm_importMLDSAPublicKey,
  hsm_verifyBytes,
  hsm_generateMLDSAKeyPair,
  hsm_sign,
  hsm_verify,
  hsm_generateMLKEMKeyPair,
  hsm_encapsulate,
  hsm_generateSLHDSAKeyPair,
  hsm_slhdsaSign,
  hsm_slhdsaVerify,
  hsm_digest,
  hsm_getMechanismList,
  hsm_aesCtrDecrypt,
  hsm_importEdDSAPublicKey,
  hsm_eddsaVerify,
  hsm_generateAESKey,
  hsm_wrapKeyMech,
  hsm_unwrapKeyMech,
  hsm_pbkdf2,
  hsm_hkdf,
  hsm_generateECKeyPair,
  hsm_ecdhDerive,
  hsm_extractECPoint,
  hsm_importX25519PublicKey,
  hsm_importX448PublicKey,
  CKD_SHA3_256_KDF,
  CKD_SHA3_512_KDF,
  CKM_EC_MONTGOMERY_KEY_PAIR_GEN,
  CKP_SLH_DSA_SHA2_128S,
  CKP_SLH_DSA_SHA2_128F,
  CKP_SLH_DSA_SHA2_192S,
  CKP_SLH_DSA_SHA2_192F,
  CKP_SLH_DSA_SHA2_256S,
  CKP_SLH_DSA_SHA2_256F,
  CKP_SLH_DSA_SHAKE_128S,
  CKP_SLH_DSA_SHAKE_128F,
  CKP_SLH_DSA_SHAKE_192S,
  CKP_SLH_DSA_SHAKE_192F,
  CKP_SLH_DSA_SHAKE_256S,
  CKP_SLH_DSA_SHAKE_256F,
  CKM_SHA256,
  CKM_AES_GCM,
  CKM_AES_CBC_PAD,
  CKM_AES_CTR,
  CKM_AES_KEY_WRAP,
  CKM_AES_KEY_WRAP_KWP,
  CKM_SHA256_HMAC,
  CKM_SHA384_HMAC,
  CKM_SHA512_HMAC,
  CKM_ECDSA_SHA256,
  CKM_ECDSA_SHA384,
  CKM_EDDSA,
  CKM_PKCS5_PBKD2,
  CKM_HKDF_DERIVE,
  CKA_CLASS,
  CKA_KEY_TYPE,
  CKA_ENCRYPT,
  CKA_DECRYPT,
  CKA_TOKEN,
  CKA_EXTRACTABLE,
  CKO_SECRET_KEY,
  CKK_AES,
  CKM_CHACHA20_POLY1305,
  hsm_generateChaCha20Key,
  hsm_chacha20Poly1305Encrypt,
  hsm_chacha20Poly1305Decrypt,
  hsm_kbkdf,
  CKM_SP800_108_COUNTER_KDF,
  hsm_kbkdfFeedback,
  CKM_SP800_108_FEEDBACK_KDF,
  hsm_statefulSignBytes,
  hsm_statefulVerifyBytes,
  CKM_XMSS,
  CKM_LMS,
  hsm_generateXMSSKeyPair,
  hsm_generateLMSKeyPair,
} from '../../../wasm/softhsm'
import type { SoftHSMModule, SLHDSASignOptions } from '../../../wasm/softhsm'
import { useHsmContext } from './HsmContext'
import type { HsmKey } from './HsmContext'
import { Button } from '@/components/ui/button'

interface TestResult {
  id: string
  algorithm: string
  testCase: string
  referenceUrl: string
  status: 'pass' | 'fail' | 'pending'
  details: string
}

export const HsmAcvpTesting = () => {
  const [results, setResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [logCopied, setLogCopied] = useState(false)
  const logCopyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const {
    moduleRef,
    crossCheckModuleRef,
    engineMode,
    hSessionRef,
    slotRef,
    phase,
    addHsmLog,
    addHsmKey,
    clearHsmKeys,
    clearHsmLog,
  } = useHsmContext()

  const addLog = (msg: string) =>
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])

  const ts = () => new Date().toLocaleTimeString([], { hour12: false })

  /** Format bytes as hex string, truncated to maxBytes with … suffix */
  const toHex = (bytes: Uint8Array, maxBytes = 32) =>
    Array.from(bytes.slice(0, maxBytes))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('') + (bytes.length > maxBytes ? '…' : '')

  const runTests = async () => {
    if (!moduleRef.current || phase !== 'session_open') {
      addLog('Error: HSM Session not open.')
      return
    }

    setLoading(true)
    setResults([])
    setLogs([])
    clearHsmKeys()
    clearHsmLog()
    addLog('Starting ACVP Validation Suite via PKCS#11...')

    const newResults: TestResult[] = []

    // Canonical reference URLs per algorithm / standard
    const REF = {
      aesgcm: 'https://csrc.nist.gov/publications/detail/sp/800-38d/final',
      hmac: 'https://www.rfc-editor.org/rfc/rfc4231',
      rsapss: 'https://csrc.nist.gov/publications/detail/fips/186/5/final',
      ecdsa: 'https://csrc.nist.gov/publications/detail/fips/186/5/final',
      mldsa: 'https://csrc.nist.gov/pubs/fips/204/final',
      mlkem: 'https://csrc.nist.gov/pubs/fips/203/final',
      sha256: 'https://csrc.nist.gov/publications/detail/fips/180/4/final',
      aescbc: 'https://csrc.nist.gov/publications/detail/sp/800-38a/final',
      aesctr: 'https://csrc.nist.gov/publications/detail/sp/800-38a/final',
      eddsa: 'https://www.rfc-editor.org/rfc/rfc8032',
      pbkdf2: 'https://www.rfc-editor.org/rfc/rfc8018',
      hkdf: 'https://www.rfc-editor.org/rfc/rfc5869',
      aeskw: 'https://www.rfc-editor.org/rfc/rfc3394',
      aeskwp: 'https://www.rfc-editor.org/rfc/rfc5649',
      slhdsa: 'https://csrc.nist.gov/pubs/fips/205/final',
      x25519: 'https://www.rfc-editor.org/rfc/rfc7748',
      x448: 'https://www.rfc-editor.org/rfc/rfc7748',
      x963kdf: 'https://www.rfc-editor.org/rfc/rfc6637',
    } as const

    const engines: Array<{
      M: SoftHSMModule
      name: string
      hSession: number
      slot: number
      mechs: Set<number>
    }> = []
    if (engineMode === 'cpp') {
      engines.push({ M: moduleRef.current, name: 'C++', hSession: 0, slot: 0, mechs: new Set() })
    } else if (engineMode === 'rust') {
      engines.push({ M: moduleRef.current, name: 'Rust', hSession: 0, slot: 0, mechs: new Set() })
    } else if (engineMode === 'dual') {
      engines.push({ M: moduleRef.current, name: 'C++', hSession: 0, slot: 0, mechs: new Set() })
      if (crossCheckModuleRef.current) {
        engines.push({
          M: crossCheckModuleRef.current,
          name: 'Rust',
          hSession: 0,
          slot: 0,
          mechs: new Set(),
        })
      }
    }

    try {
      const ACVP_GLOBAL_SEED = new Uint8Array(32).fill(0xac)

      // Restart HSM into strict ACVP mode with seed injection
      for (const engine of engines) {
        try {
          hsm_finalize(engine.M, hSessionRef.current)
        } catch {
          // Ignore invalid session handle during cross-engine shutdown
        }
        hsm_initialize(engine.M, ACVP_GLOBAL_SEED)
        const slot = hsm_getFirstSlot(engine.M)
        const initSlot = hsm_initToken(engine.M, slot, '12345678', 'ACVP_Token')
        engine.slot = initSlot
        engine.hSession = hsm_openUserSession(engine.M, initSlot, '12345678', 'user1234')
        // Probe supported mechanisms so we can skip unsupported tests gracefully
        try {
          engine.mechs = new Set(hsm_getMechanismList(engine.M, initSlot))
        } catch {
          // If mechanism probing fails, leave empty — tests will run and fail individually
        }
      }

      for (const engine of engines) {
        const M = engine.M
        const eName = engine.name
        const hSession = engine.hSession
        const engineId = eName === 'C++' ? ('cpp' as const) : ('rust' as const)

        const regKey = (key: Omit<HsmKey, 'generatedAt'>) =>
          addHsmKey({ ...key, generatedAt: ts() })

        // ── 1. AES-GCM-256 Decrypt KAT (SP 800-38D) ────────────────────
        if (engine.mechs.size > 0 && !engine.mechs.has(CKM_AES_GCM)) {
          addLog(`[${eName}] [SKIP] AES-GCM-256: mechanism not supported`)
        } else {
          const tv = aesGcmTestVectors.testGroups[0].tests[0]
          const id1 = `aes-acvp-${eName}`
          addLog(`[${eName}] Testing AES-GCM-256 Decrypt KAT (SP 800-38D)...`)
          addLog(`  ACVP Key: ${tv.key.slice(0, 32)}… | IV: ${tv.iv} | Tag: ${tv.tag}`)
          addLog(
            `  ACVP CT[${tv.ct.length / 2}B]: ${tv.ct.slice(0, 32)}… | Expected PT: ${tv.pt.slice(0, 32)}…`
          )
          try {
            const keyBytes = hexToBytes(tv.key)
            const ivBytes = hexToBytes(tv.iv)
            const ctBytes = hexToBytes(tv.ct)
            const tagBytes = hexToBytes(tv.tag)
            const expectedPt = hexToBytes(tv.pt)

            // Import known key — decrypt only (PKCS#11 v3.2 least privilege)
            const aesHandle = hsm_importAESKey(
              M,
              hSession,
              keyBytes,
              false,
              true,
              false,
              false,
              false
            )
            regKey({
              handle: aesHandle,
              family: 'aes',
              role: 'secret',
              label: `ACVP AES-256 (${eName})`,
              engine: engineId,
            })

            // Decrypt: ciphertext || tag → plaintext
            const ctWithTag = new Uint8Array(ctBytes.length + tagBytes.length)
            ctWithTag.set(ctBytes)
            ctWithTag.set(tagBytes, ctBytes.length)
            const recoveredPt = hsm_aesDecrypt(M, hSession, aesHandle, ctWithTag, ivBytes, 'gcm')

            // Compare recovered plaintext against NIST reference
            const matches =
              recoveredPt.length === expectedPt.length &&
              // eslint-disable-next-line security/detect-object-injection
              recoveredPt.every((b: number, i: number) => b === expectedPt[i])

            const ptHex = toHex(recoveredPt)
            newResults.push({
              id: id1,
              algorithm: `AES-GCM-256 (${eName})`,
              testCase: 'Decrypt KAT',
              referenceUrl: REF.aesgcm,
              status: matches ? 'pass' : 'fail',
              details: matches
                ? `PT[${recoveredPt.length}B]: ${ptHex}`
                : `PT mismatch: got ${recoveredPt.length}B, expected ${expectedPt.length}B`,
            })
            addLog(
              `[${eName}] [id:${id1}] AES-GCM Decrypt KAT: ${matches ? 'PASS' : 'FAIL'} | PT: ${ptHex}`
            )
          } catch (e: unknown) {
            const errMessage = e instanceof Error ? e.message : String(e)
            newResults.push({
              id: `aes-err-${eName}`,
              algorithm: `AES-GCM-256 (${eName})`,
              testCase: 'Decrypt KAT',
              referenceUrl: REF.aesgcm,
              status: 'fail',
              details: errMessage,
            })
            addLog(`[DISCREPANCY] [${eName}] [id:${id1}] AES-GCM: ${errMessage}`)
          }
        }

        // ── 2. HMAC-SHA256 Verify KAT (RFC 4231) ────────────────────────
        if (engine.mechs.size > 0 && !engine.mechs.has(CKM_SHA256_HMAC)) {
          addLog(`[${eName}] [SKIP] HMAC-SHA256: mechanism not supported`)
        } else {
          const tv = hmacTestVectors.testGroups[0].tests[0]
          const id2 = `hmac-acvp-${eName}`
          addLog(`[${eName}] Testing HMAC-SHA256 Verify KAT (RFC 4231)...`)
          addLog(`  ACVP Key: ${tv.key.slice(0, 32)}… | Msg: ${tv.msg.slice(0, 32)}…`)
          addLog(`  ACVP Expected MAC: ${tv.mac}`)
          try {
            const keyBytes = hexToBytes(tv.key)
            const msgBytes = hexToBytes(tv.msg)
            const macBytes = hexToBytes(tv.mac)

            // Import known HMAC key — verify only (PKCS#11 v3.2 least privilege)
            const hmacHandle = hsm_importHMACKey(M, hSession, keyBytes, false, true)
            regKey({
              handle: hmacHandle,
              family: 'hmac',
              role: 'secret',
              label: `ACVP HMAC-SHA256 (${eName})`,
              engine: engineId,
            })

            // Verify known MAC against reference
            const isValid = hsm_hmacVerify(M, hSession, hmacHandle, msgBytes, macBytes)

            const macHex = toHex(macBytes)
            newResults.push({
              id: id2,
              algorithm: `HMAC-SHA256 (${eName})`,
              testCase: 'Verify KAT',
              referenceUrl: REF.hmac,
              status: isValid ? 'pass' : 'fail',
              details: isValid
                ? `MAC[${macBytes.length}B] verified: ${macHex}`
                : 'MAC verification failed against RFC 4231 vector',
            })
            addLog(
              `[${eName}] [id:${id2}] HMAC-SHA256 Verify KAT: ${isValid ? 'PASS' : 'FAIL'} | MAC: ${macHex}`
            )
          } catch (e: unknown) {
            const errMessage = e instanceof Error ? e.message : String(e)
            newResults.push({
              id: `hmac-err-${eName}`,
              algorithm: `HMAC-SHA256 (${eName})`,
              testCase: 'Verify KAT',
              referenceUrl: REF.hmac,
              status: 'fail',
              details: errMessage,
            })
            addLog(`[DISCREPANCY] [${eName}] [id:${id2}] HMAC-SHA256: ${errMessage}`)
          }
        }

        // ── 3. RSA-PSS-2048 SigVer KAT (FIPS 186-5) ────────────────────
        if (engine.mechs.size > 0 && !engine.mechs.has(CKM_SHA256_RSA_PKCS_PSS)) {
          addLog(`[${eName}] [SKIP] RSA-PSS-2048: mechanism not supported`)
        } else {
          const tv = rsaPssTestVectors.testGroups[0].tests[0]
          const id3 = `rsa-acvp-${eName}`
          addLog(`[${eName}] Testing RSA-PSS-2048 SigVer KAT (FIPS 186-5)...`)
          addLog(`  ACVP Modulus: ${tv.n.slice(0, 32)}… | Exp: ${tv.e}`)
          addLog(`  ACVP Signature: ${tv.signature.slice(0, 32)}… | Msg: "${tv.msg.slice(0, 40)}"`)
          try {
            const modBytes = hexToBytes(tv.n)
            const expBytes = hexToBytes(tv.e)
            const sigBytes = hexToBytes(tv.signature)

            // Import known RSA public key — verify only (PKCS#11 v3.2 least privilege)
            const rsaPubHandle = hsm_importRSAPublicKey(M, hSession, modBytes, expBytes, false)
            regKey({
              handle: rsaPubHandle,
              family: 'rsa',
              role: 'public',
              label: `ACVP RSA-2048 Public (${eName})`,
              variant: '2048',
              engine: engineId,
            })

            // Verify known signature
            const isValid = hsm_rsaVerify(
              M,
              hSession,
              rsaPubHandle,
              tv.msg,
              sigBytes,
              CKM_SHA256_RSA_PKCS_PSS
            )

            const rsaSigHex = toHex(sigBytes, 16)
            newResults.push({
              id: id3,
              algorithm: `RSA-PSS-2048 (${eName})`,
              testCase: 'SigVer KAT',
              referenceUrl: REF.rsapss,
              status: isValid ? 'pass' : 'fail',
              details: isValid
                ? `Verified sig[${sigBytes.length}B]: ${rsaSigHex}…`
                : 'Signature verification failed against FIPS 186-5 vector',
            })
            addLog(
              `[${eName}] [id:${id3}] RSA-PSS SigVer KAT: ${isValid ? 'PASS' : 'FAIL'} | sig[0:16]: ${rsaSigHex}…`
            )
          } catch (e: unknown) {
            const errMessage = e instanceof Error ? e.message : String(e)
            newResults.push({
              id: `rsa-err-${eName}`,
              algorithm: `RSA-PSS-2048 (${eName})`,
              testCase: 'SigVer KAT',
              referenceUrl: REF.rsapss,
              status: 'fail',
              details: errMessage,
            })
            addLog(`[DISCREPANCY] [${eName}] [id:${id3}] RSA-PSS-2048: ${errMessage}`)
          }
        }

        // ── 4. ECDSA P-256 SigVer KAT (FIPS 186-5) ─────────────────────
        if (engine.mechs.size > 0 && !engine.mechs.has(CKM_ECDSA_SHA256)) {
          addLog(`[${eName}] [SKIP] ECDSA P-256: mechanism not supported`)
        } else {
          const tv = ecdsaTestVectors.testGroups[0].tests[0]
          const id4 = `ecdsa-acvp-${eName}`
          addLog(`[${eName}] Testing ECDSA P-256 SigVer KAT (FIPS 186-5)...`)
          addLog(`  ACVP Qx: ${tv.qx.slice(0, 32)}… | Qy: ${tv.qy.slice(0, 32)}…`)
          addLog(`  ACVP r: ${tv.r.slice(0, 32)}… | s: ${tv.s.slice(0, 32)}…`)
          try {
            const qx = hexToBytes(tv.qx)
            const qy = hexToBytes(tv.qy)
            const rBytes = hexToBytes(tv.r)
            const sBytes = hexToBytes(tv.s)
            // PKCS#11 ECDSA signature format: raw r || s
            const sigBytes = new Uint8Array(rBytes.length + sBytes.length)
            sigBytes.set(rBytes)
            sigBytes.set(sBytes, rBytes.length)

            // Import known EC public key
            const ecPubHandle = hsm_importECPublicKey(M, hSession, qx, qy, 'P-256')
            regKey({
              handle: ecPubHandle,
              family: 'ecdsa',
              role: 'public',
              label: `ACVP ECDSA P-256 Public (${eName})`,
              variant: 'P-256',
              engine: engineId,
            })

            // Verify known signature
            const isValid = hsm_ecdsaVerify(M, hSession, ecPubHandle, tv.msg, sigBytes)
            const ecSigHex = toHex(sigBytes, 16)

            newResults.push({
              id: id4,
              algorithm: `ECDSA P-256 (${eName})`,
              testCase: 'SigVer KAT',
              referenceUrl: REF.ecdsa,
              status: isValid ? 'pass' : 'fail',
              details: isValid
                ? `Verified sig[${sigBytes.length}B]: ${ecSigHex}…`
                : 'Signature verification failed against FIPS 186-5 vector',
            })
            addLog(
              `[${eName}] [id:${id4}] ECDSA P-256 SigVer KAT: ${isValid ? 'PASS' : 'FAIL'} | sig[0:16]: ${ecSigHex}…`
            )
          } catch (e: unknown) {
            const errMessage = e instanceof Error ? e.message : String(e)
            newResults.push({
              id: `ecdsa-err-${eName}`,
              algorithm: `ECDSA P-256 (${eName})`,
              testCase: 'SigVer KAT',
              referenceUrl: REF.ecdsa,
              status: 'fail',
              details: errMessage,
            })
            addLog(`[DISCREPANCY] [${eName}] [id:${id4}] ECDSA: ${errMessage}`)
          }
        }

        // ── 5. ML-DSA SigVer KAT (FIPS 204) ─────────────────────────────
        for (const group of mldsaTestVectors.testGroups) {
          const test = group.tests[0]
          const algo = group.parameterSet
          const variantNum = parseInt(algo.split('-')[2]) as 44 | 65 | 87
          const id5 = `mldsa-sigver-${algo}-${eName}`
          addLog(`[${eName}] Testing ${algo} SigVer (FIPS 204)...`)
          addLog(
            `  ACVP PK: ${test.pk.slice(0, 32)}… | Sig[${test.sig.length / 2}B]: ${test.sig.slice(0, 32)}…`
          )

          try {
            const pkBytes = hexToBytes(test.pk)
            const msgBytes = hexToBytes(test.msg)
            const sigBytes = hexToBytes(test.sig)

            const pubHandle = hsm_importMLDSAPublicKey(M, hSession, variantNum, pkBytes)
            regKey({
              handle: pubHandle,
              family: 'ml-dsa',
              role: 'public',
              label: `ACVP ${algo} Public (${eName})`,
              variant: String(variantNum),
              engine: engineId,
            })

            const isValid = hsm_verifyBytes(M, hSession, pubHandle, msgBytes, sigBytes)
            const mldsaSigHex = toHex(sigBytes, 16)

            newResults.push({
              id: id5,
              algorithm: `${algo} (${eName})`,
              testCase: 'SigVer KAT',
              referenceUrl: REF.mldsa,
              status: isValid ? 'pass' : 'fail',
              details: isValid
                ? `Verified sig[${sigBytes.length}B]: ${mldsaSigHex}…`
                : 'Signature verification failed',
            })
            addLog(
              `[${eName}] [id:${id5}] ${algo} SigVer: ${isValid ? 'PASS' : 'FAIL'} | sig[0:16]: ${mldsaSigHex}…`
            )
          } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error'
            newResults.push({
              id: `mldsa-err-${algo}-${eName}`,
              algorithm: `${algo} (${eName})`,
              testCase: 'SigVer KAT',
              referenceUrl: REF.mldsa,
              status: 'fail',
              details: errorMessage,
            })
            addLog(`[DISCREPANCY] [${eName}] [id:${id5}] ${algo} SigVer Error: ${errorMessage}`)
          }
        }

        // ── 6. ML-DSA Functional Sign+Verify (FIPS 204) — all variants ──
        for (const dsaVariant of [44, 65, 87] as const) {
          const dsaAlgo = `ML-DSA-${dsaVariant}`
          const id6 = `mldsa-func-${dsaVariant}-${eName}`
          addLog(`[${eName}] Testing ${dsaAlgo} Functional Sign+Verify (FIPS 204)...`)
          try {
            const mldsaPair = hsm_generateMLDSAKeyPair(M, hSession, dsaVariant)
            regKey({
              handle: mldsaPair.pubHandle,
              family: 'ml-dsa',
              role: 'public',
              label: `ACVP ${dsaAlgo} Keygen Public (${eName})`,
              variant: String(dsaVariant),
              engine: engineId,
            })
            regKey({
              handle: mldsaPair.privHandle,
              family: 'ml-dsa',
              role: 'private',
              label: `ACVP ${dsaAlgo} Keygen Private (${eName})`,
              variant: String(dsaVariant),
              engine: engineId,
            })
            const sig = hsm_sign(M, hSession, mldsaPair.privHandle, 'ACVP NIST PQC test')
            const isValid = hsm_verify(M, hSession, mldsaPair.pubHandle, 'ACVP NIST PQC test', sig)
            if (isValid) {
              const signHex = toHex(sig, 16)
              newResults.push({
                id: id6,
                algorithm: `${dsaAlgo} (${eName})`,
                testCase: 'Functional Sign+Verify',
                referenceUrl: REF.mldsa,
                status: 'pass',
                details: `sig[${sig.length}B]: ${signHex}…`,
              })
              addLog(`[${eName}] [id:${id6}] ${dsaAlgo} Functional: PASS | sig[0:16]: ${signHex}…`)
            } else {
              throw new Error('Signature verification failed on own signature')
            }
          } catch (e: unknown) {
            const errMessage = e instanceof Error ? e.message : String(e)
            newResults.push({
              id: `mldsa-func-${dsaVariant}-err-${eName}`,
              algorithm: `${dsaAlgo} (${eName})`,
              testCase: 'Functional Sign+Verify',
              referenceUrl: REF.mldsa,
              status: 'fail',
              details: errMessage,
            })
            addLog(`[DISCREPANCY] [${eName}] [id:${id6}] ${dsaAlgo} Functional: ${errMessage}`)
          }
        }

        // ── 7. ML-KEM Decapsulation KAT (FIPS 203) ──────────────────────
        for (const group of mlkemTestVectors.testGroups) {
          const test = group.tests[0]
          const algo = group.parameterSet
          const variantNum = (parseInt(algo.split('-')[2]) || 768) as 512 | 768 | 1024
          const id7 = `test-${algo}-decap-${eName}`
          addLog(`[${eName}] Testing ${algo} Decapsulate KAT...`)
          addLog(
            `  ACVP SK: ${test.sk.slice(0, 32)}… | CT[${test.ct.length / 2}B]: ${test.ct.slice(0, 32)}…`
          )
          addLog(`  ACVP Expected SS: ${test.ss}`)

          try {
            const skBytes = hexToBytes(test.sk)
            const ctBytes = hexToBytes(test.ct)
            const expectedSsBytes = hexToBytes(test.ss)

            // Import private key from NIST vector
            const privHandle = hsm_importMLKEMPrivateKey(M, hSession, variantNum, skBytes)
            regKey({
              handle: privHandle,
              family: 'ml-kem',
              role: 'private',
              label: `ACVP ${algo} Private (${eName})`,
              variant: String(variantNum),
              engine: engineId,
            })

            // Decapsulate using NIST ciphertext
            const secretHandle = hsm_decapsulate(M, hSession, privHandle, ctBytes, variantNum)

            // Extract recovered shared secret
            const recoveredSs = hsm_extractKeyValue(M, hSession, secretHandle)

            // Compare byte-by-byte against NIST expected shared secret
            const matches =
              recoveredSs.length === expectedSsBytes.length &&
              // eslint-disable-next-line security/detect-object-injection
              recoveredSs.every((b: number, i: number) => b === expectedSsBytes[i])

            if (matches) {
              const ssHex = toHex(recoveredSs)
              newResults.push({
                id: id7,
                algorithm: `${algo} (${eName})`,
                testCase: 'Decapsulate KAT',
                referenceUrl: REF.mlkem,
                status: 'pass',
                details: `SS[${recoveredSs.length}B]: ${ssHex}`,
              })
              addLog(`[${eName}] [id:${id7}] ${algo} Decapsulate: PASS | SS: ${ssHex}`)
            } else {
              const gotHex = Array.from(recoveredSs.slice(0, 16))
                .map((b) => b.toString(16).padStart(2, '0'))
                .join('')
              const expHex = Array.from(expectedSsBytes.slice(0, 16))
                .map((b) => b.toString(16).padStart(2, '0'))
                .join('')
              newResults.push({
                id: id7,
                algorithm: `${algo} (${eName})`,
                testCase: 'Decapsulate KAT',
                referenceUrl: REF.mlkem,
                status: 'fail',
                details: `SS mismatch: got ${gotHex}... expected ${expHex}...`,
              })
              addLog(`[DISCREPANCY] [${eName}] [id:${id7}] ${algo} Decapsulate: SS mismatch`)
              addHsmLog({
                id: Date.now(),
                timestamp: new Date().toLocaleTimeString(),
                fn: `[${eName}] C_DecapsulateKey(${algo})`,
                args: 'ACVP KAT Validation',
                rvHex: '0x00000005',
                rvName: 'CKR_GENERAL_ERROR (ACVP SS MISMATCH)',
                ms: 0,
                ok: false,
              })
            }
          } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error'
            newResults.push({
              id: `test-${algo}-err-${eName}`,
              algorithm: `${algo} (${eName})`,
              testCase: 'Decapsulate KAT',
              referenceUrl: REF.mlkem,
              status: 'fail',
              details: errorMessage,
            })
            addLog(`[DISCREPANCY] [${eName}] [id:${id7}] ${algo} Error: ${errorMessage}`)
            addHsmLog({
              id: Date.now(),
              timestamp: new Date().toLocaleTimeString(),
              fn: `[${eName}] C_DecapsulateKey(${algo})`,
              args: 'ACVP KAT Validation',
              rvHex: '0x00000005',
              rvName: `CKR_GENERAL_ERROR: ${errorMessage}`,
              ms: 0,
              ok: false,
            })
          }
        }

        // ── 8. ML-KEM Encap+Decap Round-Trip (FIPS 203) ─────────────────
        for (const kemVariant of [512, 768, 1024] as const) {
          const kemAlgo = `ML-KEM-${kemVariant}`
          const id8 = `mlkem-rt-${kemVariant}-${eName}`
          addLog(`[${eName}] Testing ${kemAlgo} Encap+Decap Round-Trip (FIPS 203)...`)
          try {
            const { pubHandle, privHandle } = hsm_generateMLKEMKeyPair(M, hSession, kemVariant)
            regKey({
              handle: pubHandle,
              family: 'ml-kem',
              role: 'public',
              label: `ACVP ${kemAlgo} RT Public (${eName})`,
              variant: String(kemVariant),
              engine: engineId,
            })
            regKey({
              handle: privHandle,
              family: 'ml-kem',
              role: 'private',
              label: `ACVP ${kemAlgo} RT Private (${eName})`,
              variant: String(kemVariant),
              engine: engineId,
            })
            const { ciphertextBytes, secretHandle: encapSecret } = hsm_encapsulate(
              M,
              hSession,
              pubHandle,
              kemVariant
            )
            const encapSs = hsm_extractKeyValue(M, hSession, encapSecret)
            const decapSecret = hsm_decapsulate(
              M,
              hSession,
              privHandle,
              ciphertextBytes,
              kemVariant
            )
            const decapSs = hsm_extractKeyValue(M, hSession, decapSecret)

            const ssMatch =
              encapSs.length === decapSs.length &&
              // eslint-disable-next-line security/detect-object-injection
              encapSs.every((b: number, i: number) => b === decapSs[i])

            if (ssMatch) {
              const ssHex = toHex(encapSs)
              newResults.push({
                id: id8,
                algorithm: `${kemAlgo} (${eName})`,
                testCase: 'Encap+Decap Round-Trip',
                referenceUrl: REF.mlkem,
                status: 'pass',
                details: `SS[${encapSs.length}B]: ${ssHex} | ct=${ciphertextBytes.length}B`,
              })
              addLog(`[${eName}] [id:${id8}] ${kemAlgo} Round-Trip: PASS | SS: ${ssHex}`)
            } else {
              newResults.push({
                id: id8,
                algorithm: `${kemAlgo} (${eName})`,
                testCase: 'Encap+Decap Round-Trip',
                referenceUrl: REF.mlkem,
                status: 'fail',
                details: `SS mismatch: encap=${toHex(encapSs, 8)}… decap=${toHex(decapSs, 8)}…`,
              })
              addLog(`[DISCREPANCY] [${eName}] [id:${id8}] ${kemAlgo} Round-Trip: SS mismatch`)
            }
          } catch (e: unknown) {
            const errMessage = e instanceof Error ? e.message : String(e)
            newResults.push({
              id: `mlkem-rt-${kemVariant}-err-${eName}`,
              algorithm: `${kemAlgo} (${eName})`,
              testCase: 'Encap+Decap Round-Trip',
              referenceUrl: REF.mlkem,
              status: 'fail',
              details: errMessage,
            })
            addLog(`[DISCREPANCY] [${eName}] [id:${id8}] ${kemAlgo} Round-Trip: ${errMessage}`)
          }
        }

        // ── 9. SLH-DSA Functional Sign+Verify (FIPS 205) — all 12 sets ──
        for (const slhParam of [
          { ckp: CKP_SLH_DSA_SHA2_128S, name: 'SLH-DSA-SHA2-128s' },
          { ckp: CKP_SLH_DSA_SHA2_128F, name: 'SLH-DSA-SHA2-128f' },
          { ckp: CKP_SLH_DSA_SHA2_192S, name: 'SLH-DSA-SHA2-192s' },
          { ckp: CKP_SLH_DSA_SHA2_192F, name: 'SLH-DSA-SHA2-192f' },
          { ckp: CKP_SLH_DSA_SHA2_256S, name: 'SLH-DSA-SHA2-256s' },
          { ckp: CKP_SLH_DSA_SHA2_256F, name: 'SLH-DSA-SHA2-256f' },
          { ckp: CKP_SLH_DSA_SHAKE_128S, name: 'SLH-DSA-SHAKE-128s' },
          { ckp: CKP_SLH_DSA_SHAKE_128F, name: 'SLH-DSA-SHAKE-128f' },
          { ckp: CKP_SLH_DSA_SHAKE_192S, name: 'SLH-DSA-SHAKE-192s' },
          { ckp: CKP_SLH_DSA_SHAKE_192F, name: 'SLH-DSA-SHAKE-192f' },
          { ckp: CKP_SLH_DSA_SHAKE_256S, name: 'SLH-DSA-SHAKE-256s' },
          { ckp: CKP_SLH_DSA_SHAKE_256F, name: 'SLH-DSA-SHAKE-256f' },
        ]) {
          const id9 = `slhdsa-func-${slhParam.name}-${eName}`
          addLog(`[${eName}] Testing ${slhParam.name} Functional Sign+Verify (FIPS 205)...`)
          try {
            const { pubHandle, privHandle } = hsm_generateSLHDSAKeyPair(M, hSession, slhParam.ckp)
            regKey({
              handle: pubHandle,
              family: 'slh-dsa',
              role: 'public',
              label: `ACVP ${slhParam.name} Public (${eName})`,
              engine: engineId,
            })
            regKey({
              handle: privHandle,
              family: 'slh-dsa',
              role: 'private',
              label: `ACVP ${slhParam.name} Private (${eName})`,
              engine: engineId,
            })
            const sigBytes = hsm_slhdsaSign(M, hSession, privHandle, 'ACVP SLH-DSA functional test')
            const isValid = hsm_slhdsaVerify(
              M,
              hSession,
              pubHandle,
              'ACVP SLH-DSA functional test',
              sigBytes
            )
            if (isValid) {
              const sigHex = toHex(sigBytes, 16)
              newResults.push({
                id: id9,
                algorithm: `${slhParam.name} (${eName})`,
                testCase: 'Functional Sign+Verify',
                referenceUrl: REF.slhdsa,
                status: 'pass',
                details: `sig[${sigBytes.length}B]: ${sigHex}…`,
              })
              addLog(
                `[${eName}] [id:${id9}] ${slhParam.name} Functional: PASS | sig[0:16]: ${sigHex}…`
              )
            } else {
              throw new Error('Signature verification failed on own signature')
            }
          } catch (e: unknown) {
            const errMessage = e instanceof Error ? e.message : String(e)
            newResults.push({
              id: `slhdsa-func-${slhParam.name}-err-${eName}`,
              algorithm: `${slhParam.name} (${eName})`,
              testCase: 'Functional Sign+Verify',
              referenceUrl: REF.slhdsa,
              status: 'fail',
              details: errMessage,
            })
            addLog(
              `[DISCREPANCY] [${eName}] [id:${id9}] ${slhParam.name} Functional: ${errMessage}`
            )
          }
        }

        // ── 10. SHA-256 Digest KAT (FIPS 180-4) ─────────────────────────
        if (engine.mechs.size > 0 && !engine.mechs.has(CKM_SHA256)) {
          addLog(`[${eName}] [SKIP] SHA-256 Digest: mechanism not supported`)
        } else {
          for (const test of sha256TestVectors.testGroups[0].tests) {
            const id10 = `sha256-tc${test.tcId}-${eName}`
            addLog(`[${eName}] Testing SHA-256 Digest KAT tc=${test.tcId} (FIPS 180-4)...`)
            addLog(
              `  ACVP Msg: ${test.msg.slice(0, 32)}${test.msg.length > 32 ? '…' : ''} | Expected MD: ${test.md}`
            )
            try {
              const msgBytes = hexToBytes(test.msg)
              const expectedMd = hexToBytes(test.md)
              const digest = hsm_digest(M, hSession, msgBytes, CKM_SHA256)

              const matches =
                digest.length === expectedMd.length &&
                // eslint-disable-next-line security/detect-object-injection
                digest.every((b: number, i: number) => b === expectedMd[i])

              const mdHex = toHex(digest)
              newResults.push({
                id: id10,
                algorithm: `SHA-256 (${eName})`,
                testCase: `Digest KAT tc=${test.tcId}`,
                referenceUrl: REF.sha256,
                status: matches ? 'pass' : 'fail',
                details: matches
                  ? `MD[${digest.length}B]: ${mdHex}`
                  : `MD mismatch: got ${toHex(digest, 8)}… expected ${toHex(expectedMd, 8)}…`,
              })
              addLog(
                `[${eName}] [id:${id10}] SHA-256 tc=${test.tcId}: ${matches ? 'PASS' : 'FAIL'} | MD: ${mdHex}`
              )
            } catch (e: unknown) {
              const errMessage = e instanceof Error ? e.message : String(e)
              newResults.push({
                id: `sha256-tc${test.tcId}-err-${eName}`,
                algorithm: `SHA-256 (${eName})`,
                testCase: `Digest KAT tc=${test.tcId}`,
                referenceUrl: REF.sha256,
                status: 'fail',
                details: errMessage,
              })
              addLog(`[DISCREPANCY] [${eName}] [id:${id10}] SHA-256 tc=${test.tcId}: ${errMessage}`)
            }
          }
        }

        // ── 11. AES-CBC-256 Decrypt KAT (SP 800-38A) ──────────────────────
        if (engine.mechs.size > 0 && !engine.mechs.has(CKM_AES_CBC_PAD)) {
          addLog(`[${eName}] [SKIP] AES-CBC-256: mechanism not supported`)
        } else {
          const tv = aesCbcTestVectors.testGroups[0].tests[0]
          const id11 = `aescbc-acvp-${eName}`
          addLog(`[${eName}] Testing AES-CBC-256 Decrypt KAT (SP 800-38A)...`)
          addLog(`[${eName}]   Key: ${tv.key.slice(0, 32)}… IV: ${tv.iv}`)
          try {
            const keyBytes = hexToBytes(tv.key)
            const ivBytes = hexToBytes(tv.iv)
            const ctBytes = hexToBytes(tv.ct)
            const expectedPt = hexToBytes(tv.pt)

            const aesHandle = hsm_importAESKey(
              M,
              hSession,
              keyBytes,
              false,
              true,
              false,
              false,
              false
            )
            regKey({
              handle: aesHandle,
              family: 'aes',
              role: 'secret',
              label: `ACVP AES-CBC-256 (${eName})`,
              engine: engineId,
            })

            const recoveredPt = hsm_aesDecrypt(M, hSession, aesHandle, ctBytes, ivBytes, 'cbc')
            const matches =
              recoveredPt.length === expectedPt.length &&
              // eslint-disable-next-line security/detect-object-injection
              recoveredPt.every((b: number, i: number) => b === expectedPt[i])

            const ptHex = toHex(recoveredPt)
            newResults.push({
              id: id11,
              algorithm: `AES-CBC-256 (${eName})`,
              testCase: 'Decrypt KAT',
              referenceUrl: REF.aescbc,
              status: matches ? 'pass' : 'fail',
              details: matches
                ? `PT[${recoveredPt.length}B]: ${ptHex}`
                : `PT mismatch: got ${recoveredPt.length}B, expected ${expectedPt.length}B`,
            })
            addLog(
              `[${eName}] [id:${id11}] AES-CBC Decrypt KAT: ${matches ? 'PASS' : 'FAIL'} | PT: ${ptHex}`
            )
          } catch (e: unknown) {
            const errMessage = e instanceof Error ? e.message : String(e)
            newResults.push({
              id: `aescbc-err-${eName}`,
              algorithm: `AES-CBC-256 (${eName})`,
              testCase: 'Decrypt KAT',
              referenceUrl: REF.aescbc,
              status: 'fail',
              details: errMessage,
            })
            addLog(`[DISCREPANCY] [${eName}] [id:${id11}] AES-CBC: ${errMessage}`)
          }
        }

        // ── 12. AES-CTR-256 Decrypt KAT (SP 800-38A) ──────────────────────
        if (engine.mechs.size > 0 && !engine.mechs.has(CKM_AES_CTR)) {
          addLog(`[${eName}] [SKIP] AES-CTR-256: mechanism not supported`)
        } else {
          const tv = aesCtrTestVectors.testGroups[0].tests[0]
          const counterBits = aesCtrTestVectors.testGroups[0].counterBits
          const id12 = `aesctr-acvp-${eName}`
          addLog(`[${eName}] Testing AES-CTR-256 Decrypt KAT (SP 800-38A)...`)
          addLog(`[${eName}]   Key: ${tv.key.slice(0, 32)}… IV: ${tv.iv} ctrBits: ${counterBits}`)
          try {
            const keyBytes = hexToBytes(tv.key)
            const ivBytes = hexToBytes(tv.iv)
            const ctBytes = hexToBytes(tv.ct)
            const expectedPt = hexToBytes(tv.pt)

            const aesHandle = hsm_importAESKey(
              M,
              hSession,
              keyBytes,
              false,
              true,
              false,
              false,
              false
            )
            regKey({
              handle: aesHandle,
              family: 'aes',
              role: 'secret',
              label: `ACVP AES-CTR-256 (${eName})`,
              engine: engineId,
            })

            const recoveredPt = hsm_aesCtrDecrypt(
              M,
              hSession,
              aesHandle,
              ivBytes,
              counterBits,
              ctBytes
            )
            const matches =
              recoveredPt.length === expectedPt.length &&
              // eslint-disable-next-line security/detect-object-injection
              recoveredPt.every((b: number, i: number) => b === expectedPt[i])

            const ptHex = toHex(recoveredPt)
            newResults.push({
              id: id12,
              algorithm: `AES-CTR-256 (${eName})`,
              testCase: 'Decrypt KAT',
              referenceUrl: REF.aesctr,
              status: matches ? 'pass' : 'fail',
              details: matches
                ? `PT[${recoveredPt.length}B]: ${ptHex}`
                : `PT mismatch: got ${recoveredPt.length}B, expected ${expectedPt.length}B`,
            })
            addLog(
              `[${eName}] [id:${id12}] AES-CTR Decrypt KAT: ${matches ? 'PASS' : 'FAIL'} | PT: ${ptHex}`
            )
          } catch (e: unknown) {
            const errMessage = e instanceof Error ? e.message : String(e)
            newResults.push({
              id: `aesctr-err-${eName}`,
              algorithm: `AES-CTR-256 (${eName})`,
              testCase: 'Decrypt KAT',
              referenceUrl: REF.aesctr,
              status: 'fail',
              details: errMessage,
            })
            addLog(`[DISCREPANCY] [${eName}] [id:${id12}] AES-CTR: ${errMessage}`)
          }
        }

        // ── 13. HMAC-SHA384 Verify KAT ─────────────────────────────────────
        if (engine.mechs.size > 0 && !engine.mechs.has(CKM_SHA384_HMAC)) {
          addLog(`[${eName}] [SKIP] HMAC-SHA384: mechanism not supported`)
        } else {
          const tv = hmac384TestVectors.testGroups[0].tests[0]
          const id13 = `hmac384-acvp-${eName}`
          addLog(`[${eName}] Testing HMAC-SHA384 Verify KAT...`)
          addLog(`[${eName}]   Key: ${tv.key.slice(0, 32)}… MAC: ${tv.mac.slice(0, 32)}…`)
          try {
            const keyBytes = hexToBytes(tv.key)
            const msgBytes = hexToBytes(tv.msg)
            const macBytes = hexToBytes(tv.mac)

            const hmacHandle = hsm_importHMACKey(M, hSession, keyBytes, false, true)
            regKey({
              handle: hmacHandle,
              family: 'hmac',
              role: 'secret',
              label: `ACVP HMAC-SHA384 (${eName})`,
              engine: engineId,
            })

            const isValid = hsm_hmacVerify(
              M,
              hSession,
              hmacHandle,
              msgBytes,
              macBytes,
              CKM_SHA384_HMAC
            )
            const macHex = toHex(macBytes)
            newResults.push({
              id: id13,
              algorithm: `HMAC-SHA384 (${eName})`,
              testCase: 'Verify KAT',
              referenceUrl: REF.hmac,
              status: isValid ? 'pass' : 'fail',
              details: isValid
                ? `MAC[${macBytes.length}B] verified: ${macHex}`
                : 'MAC verification failed',
            })
            addLog(
              `[${eName}] [id:${id13}] HMAC-SHA384 Verify KAT: ${isValid ? 'PASS' : 'FAIL'} | MAC: ${macHex}`
            )
          } catch (e: unknown) {
            const errMessage = e instanceof Error ? e.message : String(e)
            newResults.push({
              id: `hmac384-err-${eName}`,
              algorithm: `HMAC-SHA384 (${eName})`,
              testCase: 'Verify KAT',
              referenceUrl: REF.hmac,
              status: 'fail',
              details: errMessage,
            })
            addLog(`[DISCREPANCY] [${eName}] [id:${id13}] HMAC-SHA384: ${errMessage}`)
          }
        }

        // ── 14. HMAC-SHA512 Verify KAT ─────────────────────────────────────
        if (engine.mechs.size > 0 && !engine.mechs.has(CKM_SHA512_HMAC)) {
          addLog(`[${eName}] [SKIP] HMAC-SHA512: mechanism not supported`)
        } else {
          const tv = hmac512TestVectors.testGroups[0].tests[0]
          const id14 = `hmac512-acvp-${eName}`
          addLog(`[${eName}] Testing HMAC-SHA512 Verify KAT...`)
          addLog(`[${eName}]   Key: ${tv.key.slice(0, 32)}… MAC: ${tv.mac.slice(0, 32)}…`)
          try {
            const keyBytes = hexToBytes(tv.key)
            const msgBytes = hexToBytes(tv.msg)
            const macBytes = hexToBytes(tv.mac)

            const hmacHandle = hsm_importHMACKey(M, hSession, keyBytes, false, true)
            regKey({
              handle: hmacHandle,
              family: 'hmac',
              role: 'secret',
              label: `ACVP HMAC-SHA512 (${eName})`,
              engine: engineId,
            })

            const isValid = hsm_hmacVerify(
              M,
              hSession,
              hmacHandle,
              msgBytes,
              macBytes,
              CKM_SHA512_HMAC
            )
            const macHex = toHex(macBytes)
            newResults.push({
              id: id14,
              algorithm: `HMAC-SHA512 (${eName})`,
              testCase: 'Verify KAT',
              referenceUrl: REF.hmac,
              status: isValid ? 'pass' : 'fail',
              details: isValid
                ? `MAC[${macBytes.length}B] verified: ${macHex}`
                : 'MAC verification failed',
            })
            addLog(
              `[${eName}] [id:${id14}] HMAC-SHA512 Verify KAT: ${isValid ? 'PASS' : 'FAIL'} | MAC: ${macHex}`
            )
          } catch (e: unknown) {
            const errMessage = e instanceof Error ? e.message : String(e)
            newResults.push({
              id: `hmac512-err-${eName}`,
              algorithm: `HMAC-SHA512 (${eName})`,
              testCase: 'Verify KAT',
              referenceUrl: REF.hmac,
              status: 'fail',
              details: errMessage,
            })
            addLog(`[DISCREPANCY] [${eName}] [id:${id14}] HMAC-SHA512: ${errMessage}`)
          }
        }

        // ── 15. ECDSA P-384 SigVer KAT (FIPS 186-5) ──────────────────────
        if (engine.mechs.size > 0 && !engine.mechs.has(CKM_ECDSA_SHA384)) {
          addLog(`[${eName}] [SKIP] ECDSA P-384: mechanism not supported`)
        } else {
          const tv = ecdsaP384TestVectors.testGroups[0].tests[0]
          const id15 = `ecdsa384-acvp-${eName}`
          addLog(`[${eName}] Testing ECDSA P-384 SigVer KAT (FIPS 186-5)...`)
          addLog(`[${eName}]   Qx: ${tv.qx.slice(0, 32)}… R: ${tv.r.slice(0, 32)}…`)
          try {
            const qx = hexToBytes(tv.qx)
            const qy = hexToBytes(tv.qy)
            const rBytes = hexToBytes(tv.r)
            const sBytes = hexToBytes(tv.s)
            const sigBytes = new Uint8Array(rBytes.length + sBytes.length)
            sigBytes.set(rBytes)
            sigBytes.set(sBytes, rBytes.length)

            const ecPubHandle = hsm_importECPublicKey(M, hSession, qx, qy, 'P-384')
            regKey({
              handle: ecPubHandle,
              family: 'ecdsa',
              role: 'public',
              label: `ACVP ECDSA P-384 Public (${eName})`,
              variant: 'P-384',
              engine: engineId,
            })

            const isValid = hsm_ecdsaVerify(
              M,
              hSession,
              ecPubHandle,
              tv.msg,
              sigBytes,
              CKM_ECDSA_SHA384
            )
            const ecSigHex = toHex(sigBytes, 16)
            newResults.push({
              id: id15,
              algorithm: `ECDSA P-384 (${eName})`,
              testCase: 'SigVer KAT',
              referenceUrl: REF.ecdsa,
              status: isValid ? 'pass' : 'fail',
              details: isValid
                ? `Verified sig[${sigBytes.length}B]: ${ecSigHex}…`
                : 'Signature verification failed against FIPS 186-5 vector',
            })
            addLog(
              `[${eName}] [id:${id15}] ECDSA P-384 SigVer KAT: ${isValid ? 'PASS' : 'FAIL'} | sig: ${ecSigHex}…`
            )
          } catch (e: unknown) {
            const errMessage = e instanceof Error ? e.message : String(e)
            newResults.push({
              id: `ecdsa384-err-${eName}`,
              algorithm: `ECDSA P-384 (${eName})`,
              testCase: 'SigVer KAT',
              referenceUrl: REF.ecdsa,
              status: 'fail',
              details: errMessage,
            })
            addLog(`[DISCREPANCY] [${eName}] [id:${id15}] ECDSA P-384: ${errMessage}`)
          }
        }

        // ── 16. EdDSA Ed25519 SigVer KAT (RFC 8032) ──────────────────────
        if (engine.mechs.size > 0 && !engine.mechs.has(CKM_EDDSA)) {
          addLog(`[${eName}] [SKIP] EdDSA Ed25519: mechanism not supported`)
        } else {
          const edTv = eddsaTestVectors.testGroups[0].tests[0]
          const id16 = `eddsa-sigver-${eName}`
          addLog(`[${eName}] Testing EdDSA Ed25519 SigVer KAT (RFC 8032)...`)
          addLog(`  ACVP PK: ${edTv.pk} | Sig: ${edTv.signature.slice(0, 32)}…`)
          try {
            const pkBytes = hexToBytes(edTv.pk)
            const msgBytes = hexToBytes(edTv.msg)
            const sigBytes = hexToBytes(edTv.signature)

            // Import NIST public key — verify only
            const pubHandle = hsm_importEdDSAPublicKey(M, hSession, pkBytes, 'Ed25519')
            regKey({
              handle: pubHandle,
              family: 'eddsa',
              role: 'public',
              label: `ACVP EdDSA Ed25519 Public (${eName})`,
              engine: engineId,
            })

            // msg is hex-encoded ASCII text in the ACVP vector — decode to string
            const msgStr = new TextDecoder().decode(msgBytes)
            const isValid = hsm_eddsaVerify(M, hSession, pubHandle, msgStr, sigBytes)

            newResults.push({
              id: id16,
              algorithm: `EdDSA Ed25519 (${eName})`,
              testCase: 'SigVer KAT',
              referenceUrl: REF.eddsa,
              status: isValid ? 'pass' : 'fail',
              details: isValid
                ? `Verified sig[${sigBytes.length}B]: ${toHex(sigBytes, 16)}…`
                : 'Signature verification failed against RFC 8032 vector',
            })
            addLog(`[${eName}] [id:${id16}] EdDSA Ed25519 SigVer KAT: ${isValid ? 'PASS' : 'FAIL'}`)
          } catch (e: unknown) {
            const errMessage = e instanceof Error ? e.message : String(e)
            newResults.push({
              id: `eddsa-sigver-err-${eName}`,
              algorithm: `EdDSA Ed25519 (${eName})`,
              testCase: 'SigVer KAT',
              referenceUrl: REF.eddsa,
              status: 'fail',
              details: errMessage,
            })
            addLog(`[DISCREPANCY] [${eName}] [id:${id16}] EdDSA Ed25519: ${errMessage}`)
          }
        }

        // ── 17. PBKDF2 Functional Derivation (PKCS#5 v2.1) ────────────────
        if (engine.mechs.size > 0 && !engine.mechs.has(CKM_PKCS5_PBKD2)) {
          addLog(`[${eName}] [SKIP] PBKDF2: mechanism not supported`)
        } else {
          const id17 = `pbkdf2-func-${eName}`
          addLog(`[${eName}] Testing PBKDF2 Functional Derivation (PKCS#5 v2.1)...`)
          try {
            const password = new TextEncoder().encode('ACVP-PBKDF2-test-password')
            const salt = new TextEncoder().encode('ACVP-salt-value')
            const iterations = 4096
            const keyLen = 32
            addLog(`[${eName}]   iterations: ${iterations}, keyLen: ${keyLen}, PRF: HMAC-SHA512`)

            const derived1 = hsm_pbkdf2(M, hSession, password, salt, iterations, keyLen)
            const derived2 = hsm_pbkdf2(M, hSession, password, salt, iterations, keyLen)
            const matches =
              derived1.length === derived2.length &&
              // eslint-disable-next-line security/detect-object-injection
              derived1.every((b: number, i: number) => b === derived2[i])

            const dkHex = toHex(derived1)
            newResults.push({
              id: id17,
              algorithm: `PBKDF2-HMAC-SHA512 (${eName})`,
              testCase: 'Functional Derivation',
              referenceUrl: REF.pbkdf2,
              status: matches && derived1.length === keyLen ? 'pass' : 'fail',
              details: matches
                ? `DK[${derived1.length}B]: ${dkHex}`
                : 'Determinism failure: run1 ≠ run2',
            })
            addLog(`[${eName}] [id:${id17}] PBKDF2: ${matches ? 'PASS' : 'FAIL'} | DK: ${dkHex}`)
          } catch (e: unknown) {
            const errMessage = e instanceof Error ? e.message : String(e)
            newResults.push({
              id: `pbkdf2-func-err-${eName}`,
              algorithm: `PBKDF2-HMAC-SHA512 (${eName})`,
              testCase: 'Functional Derivation',
              referenceUrl: REF.pbkdf2,
              status: 'fail',
              details: errMessage,
            })
            addLog(`[DISCREPANCY] [${eName}] [id:${id17}] PBKDF2: ${errMessage}`)
          }
        }

        // ── 18. HKDF Functional Derivation (RFC 5869) ──────────────────────
        if (engine.mechs.size > 0 && !engine.mechs.has(CKM_HKDF_DERIVE)) {
          addLog(`[${eName}] [SKIP] HKDF: mechanism not supported`)
        } else {
          const id18 = `hkdf-func-${eName}`
          addLog(`[${eName}] Testing HKDF Functional Derivation (RFC 5869)...`)
          try {
            const ikmHandle = hsm_generateAESKey(
              M,
              hSession,
              256,
              false,
              false,
              false,
              false,
              true,
              false
            )
            regKey({
              handle: ikmHandle,
              family: 'aes',
              role: 'secret',
              label: `ACVP HKDF IKM (${eName})`,
              engine: engineId,
            })

            const salt = new TextEncoder().encode('ACVP-HKDF-salt')
            const info = new TextEncoder().encode('ACVP-HKDF-info')
            const keyLen = 32
            addLog(`[${eName}]   PRF: SHA-256, salt: 14B, info: 14B, keyLen: ${keyLen}`)

            const derived1 = hsm_hkdf(
              M,
              hSession,
              ikmHandle,
              CKM_SHA256,
              true,
              true,
              salt,
              info,
              keyLen
            )
            const derived2 = hsm_hkdf(
              M,
              hSession,
              ikmHandle,
              CKM_SHA256,
              true,
              true,
              salt,
              info,
              keyLen
            )
            const matches =
              derived1.length === derived2.length &&
              // eslint-disable-next-line security/detect-object-injection
              derived1.every((b: number, i: number) => b === derived2[i])

            const dkHex = toHex(derived1)
            newResults.push({
              id: id18,
              algorithm: `HKDF-SHA256 (${eName})`,
              testCase: 'Functional Derivation',
              referenceUrl: REF.hkdf,
              status: matches && derived1.length === keyLen ? 'pass' : 'fail',
              details: matches
                ? `OKM[${derived1.length}B]: ${dkHex}`
                : 'Determinism failure: run1 ≠ run2',
            })
            addLog(`[${eName}] [id:${id18}] HKDF: ${matches ? 'PASS' : 'FAIL'} | OKM: ${dkHex}`)
          } catch (e: unknown) {
            const errMessage = e instanceof Error ? e.message : String(e)
            newResults.push({
              id: `hkdf-func-err-${eName}`,
              algorithm: `HKDF-SHA256 (${eName})`,
              testCase: 'Functional Derivation',
              referenceUrl: REF.hkdf,
              status: 'fail',
              details: errMessage,
            })
            addLog(`[DISCREPANCY] [${eName}] [id:${id18}] HKDF: ${errMessage}`)
          }
        }

        // ── 19. AES-KW Wrap KAT (RFC 3394) ────────────────────────────────
        if (engine.mechs.size > 0 && !engine.mechs.has(CKM_AES_KEY_WRAP)) {
          addLog(`[${eName}] [SKIP] AES-KW: mechanism not supported`)
        } else {
          const tv = aesKwTestVectors.testGroups[0].tests[0]
          const id19 = `aeskw-acvp-${eName}`
          addLog(`[${eName}] Testing AES-KW Wrap KAT (RFC 3394)...`)
          addLog(`[${eName}]   KEK: ${tv.kek.slice(0, 32)}… Expected: ${tv.wrapped.slice(0, 32)}…`)
          try {
            const kekBytes = hexToBytes(tv.kek)
            const keyDataBytes = hexToBytes(tv.keyData)
            const expectedWrapped = hexToBytes(tv.wrapped)

            const kekHandle = hsm_importAESKey(
              M,
              hSession,
              kekBytes,
              false,
              false,
              true,
              false,
              false
            )
            regKey({
              handle: kekHandle,
              family: 'aes',
              role: 'secret',
              label: `ACVP AES-KW KEK (${eName})`,
              engine: engineId,
            })
            const targetHandle = hsm_importAESKey(
              M,
              hSession,
              keyDataBytes,
              false,
              false,
              false,
              false,
              false,
              true
            )
            regKey({
              handle: targetHandle,
              family: 'aes',
              role: 'secret',
              label: `ACVP AES-KW Target (${eName})`,
              engine: engineId,
            })

            const wrapped = hsm_wrapKeyMech(M, hSession, CKM_AES_KEY_WRAP, kekHandle, targetHandle)
            const matches =
              wrapped.length === expectedWrapped.length &&
              // eslint-disable-next-line security/detect-object-injection
              wrapped.every((b: number, i: number) => b === expectedWrapped[i])

            const wrappedHex = toHex(wrapped)
            newResults.push({
              id: id19,
              algorithm: `AES-KW-256 (${eName})`,
              testCase: 'Wrap KAT',
              referenceUrl: REF.aeskw,
              status: matches ? 'pass' : 'fail',
              details: matches
                ? `Wrapped[${wrapped.length}B]: ${wrappedHex}`
                : `Mismatch: got ${toHex(wrapped, 8)}… expected ${toHex(expectedWrapped, 8)}…`,
            })
            addLog(
              `[${eName}] [id:${id19}] AES-KW Wrap KAT: ${matches ? 'PASS' : 'FAIL'} | Wrapped: ${wrappedHex}`
            )
          } catch (e: unknown) {
            const errMessage = e instanceof Error ? e.message : String(e)
            newResults.push({
              id: `aeskw-err-${eName}`,
              algorithm: `AES-KW-256 (${eName})`,
              testCase: 'Wrap KAT',
              referenceUrl: REF.aeskw,
              status: 'fail',
              details: errMessage,
            })
            addLog(`[DISCREPANCY] [${eName}] [id:${id19}] AES-KW: ${errMessage}`)
          }
        }

        // ── 20. AES-KWP Wrap+Unwrap Round-Trip (RFC 5649) ─────────────────
        if (engine.mechs.size > 0 && !engine.mechs.has(CKM_AES_KEY_WRAP_KWP)) {
          addLog(`[${eName}] [SKIP] AES-KWP: mechanism not supported`)
        } else {
          const id20 = `aeskwp-func-${eName}`
          addLog(`[${eName}] Testing AES-KWP Wrap+Unwrap Round-Trip (RFC 5649)...`)
          try {
            const kekHandle = hsm_generateAESKey(
              M,
              hSession,
              256,
              false,
              false,
              true,
              true,
              false,
              false
            )
            regKey({
              handle: kekHandle,
              family: 'aes',
              role: 'secret',
              label: `ACVP AES-KWP KEK (${eName})`,
              engine: engineId,
            })
            const targetHandle = hsm_generateAESKey(
              M,
              hSession,
              256,
              false,
              false,
              false,
              false,
              false,
              true
            )
            regKey({
              handle: targetHandle,
              family: 'aes',
              role: 'secret',
              label: `ACVP AES-KWP Target (${eName})`,
              engine: engineId,
            })

            const origValue = hsm_extractKeyValue(M, hSession, targetHandle)
            const wrapped = hsm_wrapKeyMech(
              M,
              hSession,
              CKM_AES_KEY_WRAP_KWP,
              kekHandle,
              targetHandle
            )
            addLog(`[${eName}]   Wrapped[${wrapped.length}B]: ${toHex(wrapped, 16)}…`)

            const unwrappedHandle = hsm_unwrapKeyMech(
              M,
              hSession,
              CKM_AES_KEY_WRAP_KWP,
              kekHandle,
              wrapped,
              [
                { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
                { type: CKA_KEY_TYPE, ulongVal: CKK_AES },
                { type: CKA_ENCRYPT, boolVal: true },
                { type: CKA_DECRYPT, boolVal: true },
                { type: CKA_TOKEN, boolVal: false },
                { type: CKA_EXTRACTABLE, boolVal: true },
              ]
            )
            const unwrappedValue = hsm_extractKeyValue(M, hSession, unwrappedHandle)
            const matches =
              origValue.length === unwrappedValue.length &&
              // eslint-disable-next-line security/detect-object-injection
              origValue.every((b: number, i: number) => b === unwrappedValue[i])

            newResults.push({
              id: id20,
              algorithm: `AES-KWP-256 (${eName})`,
              testCase: 'Wrap+Unwrap Round-Trip',
              referenceUrl: REF.aeskwp,
              status: matches ? 'pass' : 'fail',
              details: matches
                ? `Key[${origValue.length}B] recovered | wrapped=${wrapped.length}B`
                : 'Key mismatch after unwrap',
            })
            addLog(
              `[${eName}] [id:${id20}] AES-KWP Round-Trip: ${matches ? 'PASS' : 'FAIL'} | key=${origValue.length}B wrapped=${wrapped.length}B`
            )
          } catch (e: unknown) {
            const errMessage = e instanceof Error ? e.message : String(e)
            newResults.push({
              id: `aeskwp-func-err-${eName}`,
              algorithm: `AES-KWP-256 (${eName})`,
              testCase: 'Wrap+Unwrap Round-Trip',
              referenceUrl: REF.aeskwp,
              status: 'fail',
              details: errMessage,
            })
            addLog(`[DISCREPANCY] [${eName}] [id:${id20}] AES-KWP: ${errMessage}`)
          }
        }

        // ── 21. SLH-DSA Context Binding (FIPS 205 §9.2) ───────────────────
        {
          const id21 = `slhdsa-ctx-binding-${eName}`
          addLog(`[${eName}] Testing SLH-DSA-SHA2-128s Context Binding (FIPS 205 §9.2)...`)
          try {
            const { pubHandle, privHandle } = hsm_generateSLHDSAKeyPair(
              M,
              hSession,
              CKP_SLH_DSA_SHA2_128S
            )
            regKey({
              handle: pubHandle,
              family: 'slh-dsa',
              role: 'public',
              label: `ACVP SLH-DSA Ctx Binding Public (${eName})`,
              engine: engineId,
            })
            regKey({
              handle: privHandle,
              family: 'slh-dsa',
              role: 'private',
              label: `ACVP SLH-DSA Ctx Binding Private (${eName})`,
              engine: engineId,
            })
            const ctxA: SLHDSASignOptions = { context: new TextEncoder().encode('acvp-ctx-A') }
            const ctxB: SLHDSASignOptions = { context: new TextEncoder().encode('acvp-ctx-B') }
            const sig = hsm_slhdsaSign(M, hSession, privHandle, 'ACVP context-binding test', ctxA)
            const verifyOk = hsm_slhdsaVerify(
              M,
              hSession,
              pubHandle,
              'ACVP context-binding test',
              sig,
              ctxA
            )
            const verifyCrossFail = !hsm_slhdsaVerify(
              M,
              hSession,
              pubHandle,
              'ACVP context-binding test',
              sig,
              ctxB
            )
            const verifyNoCxtFail = !hsm_slhdsaVerify(
              M,
              hSession,
              pubHandle,
              'ACVP context-binding test',
              sig
            )
            const pass = verifyOk && verifyCrossFail && verifyNoCxtFail
            newResults.push({
              id: id21,
              algorithm: `SLH-DSA-SHA2-128s (${eName})`,
              testCase: 'Context Binding (FIPS 205 §9.2)',
              referenceUrl: REF.slhdsa,
              status: pass ? 'pass' : 'fail',
              details: pass
                ? `ctx-A verifies ✓ | ctx-B rejects ✓ | no-ctx rejects ✓`
                : `verifyOk=${verifyOk} crossFail=${verifyCrossFail} noCtxFail=${verifyNoCxtFail}`,
            })
            addLog(
              `[${eName}] [id:${id21}] Context Binding: ${pass ? 'PASS' : 'FAIL'} | same=${verifyOk} cross=${verifyCrossFail} empty=${verifyNoCxtFail}`
            )
          } catch (e: unknown) {
            const errMessage = e instanceof Error ? e.message : String(e)
            newResults.push({
              id: `slhdsa-ctx-binding-err-${eName}`,
              algorithm: `SLH-DSA-SHA2-128s (${eName})`,
              testCase: 'Context Binding (FIPS 205 §9.2)',
              referenceUrl: REF.slhdsa,
              status: 'fail',
              details: errMessage,
            })
            addLog(`[DISCREPANCY] [${eName}] [id:${id21}] Context Binding: ${errMessage}`)
          }
        }

        // ── 22. SLH-DSA Deterministic Mode (FIPS 205 §10) ────────────────
        {
          const id22 = `slhdsa-deterministic-${eName}`
          addLog(`[${eName}] Testing SLH-DSA-SHA2-128s Deterministic Mode (FIPS 205 §10)...`)
          try {
            const { pubHandle, privHandle } = hsm_generateSLHDSAKeyPair(
              M,
              hSession,
              CKP_SLH_DSA_SHA2_128S
            )
            regKey({
              handle: pubHandle,
              family: 'slh-dsa',
              role: 'public',
              label: `ACVP SLH-DSA Det Mode Public (${eName})`,
              engine: engineId,
            })
            regKey({
              handle: privHandle,
              family: 'slh-dsa',
              role: 'private',
              label: `ACVP SLH-DSA Det Mode Private (${eName})`,
              engine: engineId,
            })
            const detOpts: SLHDSASignOptions = { deterministic: true }
            const sig1 = hsm_slhdsaSign(M, hSession, privHandle, 'ACVP deterministic test', detOpts)
            const sig2 = hsm_slhdsaSign(M, hSession, privHandle, 'ACVP deterministic test', detOpts)
            const equal =
              sig1.length === sig2.length && sig1.every((b: number, i: number) => b === sig2[i])
            const verifyOk = hsm_slhdsaVerify(
              M,
              hSession,
              pubHandle,
              'ACVP deterministic test',
              sig1,
              detOpts
            )
            const pass = equal && verifyOk
            newResults.push({
              id: id22,
              algorithm: `SLH-DSA-SHA2-128s (${eName})`,
              testCase: 'Deterministic Mode (FIPS 205 §10)',
              referenceUrl: REF.slhdsa,
              status: pass ? 'pass' : 'fail',
              details: pass
                ? `sig[${sig1.length}B] reproducible ✓ | verify ✓`
                : `equal=${equal} verify=${verifyOk}`,
            })
            addLog(
              `[${eName}] [id:${id22}] Deterministic: ${pass ? 'PASS' : 'FAIL'} | equal=${equal} verify=${verifyOk}`
            )
          } catch (e: unknown) {
            const errMessage = e instanceof Error ? e.message : String(e)
            newResults.push({
              id: `slhdsa-deterministic-err-${eName}`,
              algorithm: `SLH-DSA-SHA2-128s (${eName})`,
              testCase: 'Deterministic Mode (FIPS 205 §10)',
              referenceUrl: REF.slhdsa,
              status: 'fail',
              details: errMessage,
            })
            addLog(`[DISCREPANCY] [${eName}] [id:${id22}] Deterministic: ${errMessage}`)
          }
        }

        // Helper: extract raw bytes from a Montgomery public key.
        // Rust stores raw bytes in CKA_VALUE; C++ stores DER-wrapped (04 len raw) in CKA_EC_POINT.
        const extractMontgomeryPubKey = (handle: number): Uint8Array => {
          try {
            return new Uint8Array(hsm_extractKeyValue(M, hSession, handle))
          } catch {
            // C++ engine: CKA_EC_POINT = "04 <1-byte-len> <raw>", strip 2-byte DER prefix
            return hsm_extractECPoint(M, hSession, handle).slice(2)
          }
        }

        // ── 23. X25519 ECDH Round-Trip (RFC 7748) ─────────────────────────
        if (engine.mechs.size > 0 && !engine.mechs.has(CKM_EC_MONTGOMERY_KEY_PAIR_GEN)) {
          addLog(`[${eName}] [SKIP] X25519: CKM_EC_MONTGOMERY_KEY_PAIR_GEN not in mechanism list`)
        } else {
          const id23 = `x25519-ecdh-${eName}`
          addLog(`[${eName}] Testing X25519 ECDH Round-Trip (RFC 7748)...`)
          try {
            // Generate two X25519 keypairs
            const { pubHandle: pubA, privHandle: privA } = hsm_generateECKeyPair(
              M,
              hSession,
              'X25519',
              true,
              'sign'
            )
            const { pubHandle: pubB, privHandle: privB } = hsm_generateECKeyPair(
              M,
              hSession,
              'X25519',
              true,
              'sign'
            )
            regKey({
              handle: pubA,
              family: 'ecdh',
              role: 'public',
              label: `ACVP X25519 PubKey-A (${eName})`,
              engine: engineId,
            })
            regKey({
              handle: privA,
              family: 'ecdh',
              role: 'private',
              label: `ACVP X25519 PrivKey-A (${eName})`,
              engine: engineId,
            })
            regKey({
              handle: pubB,
              family: 'ecdh',
              role: 'public',
              label: `ACVP X25519 PubKey-B (${eName})`,
              engine: engineId,
            })
            regKey({
              handle: privB,
              family: 'ecdh',
              role: 'private',
              label: `ACVP X25519 PrivKey-B (${eName})`,
              engine: engineId,
            })

            // Extract raw 32-byte public key values (engine-agnostic: Rust=CKA_VALUE, C++=CKA_EC_POINT)
            const pubABytes = extractMontgomeryPubKey(pubA)
            const pubBBytes = extractMontgomeryPubKey(pubB)

            // Import peer public keys — smoke test only (not used in derive below)
            let peerBHandle = 0,
              peerAHandle = 0
            try {
              peerBHandle = hsm_importX25519PublicKey(M, hSession, pubBBytes)
              peerAHandle = hsm_importX25519PublicKey(M, hSession, pubABytes)
            } catch {
              /* C++ engine stores Montgomery pubkeys as CKA_EC_POINT; import is smoke-only */
            }

            // A derives shared secret using B's public key
            const secretHandleAB = hsm_ecdhDerive(
              M,
              hSession,
              privA,
              pubBBytes,
              undefined,
              undefined,
              { keyLen: 32, extractable: true }
            )
            const secretAB = hsm_extractKeyValue(M, hSession, secretHandleAB)

            // B derives shared secret using A's public key
            const secretHandleBA = hsm_ecdhDerive(
              M,
              hSession,
              privB,
              pubABytes,
              undefined,
              undefined,
              { keyLen: 32, extractable: true }
            )
            const secretBA = hsm_extractKeyValue(M, hSession, secretHandleBA)

            const matches =
              secretAB.length === secretBA.length &&
              secretAB.every((b: number, i: number) => b === secretBA[i])

            void peerBHandle
            void peerAHandle

            newResults.push({
              id: id23,
              algorithm: `X25519 ECDH (${eName})`,
              testCase: 'RFC 7748 §6.1 Round-Trip',
              referenceUrl: REF.x25519,
              status: matches ? 'pass' : 'fail',
              details: matches
                ? `A→B and B→A derive same 32B shared secret ✓ | Z=${toHex(secretAB, 8)}…`
                : `Secrets differ: A→B=${toHex(secretAB, 8)}… B→A=${toHex(secretBA, 8)}…`,
            })
            addLog(
              `[${eName}] [id:${id23}] X25519 ECDH: ${matches ? 'PASS' : 'FAIL'} | Z=${toHex(secretAB, 8)}…`
            )
          } catch (e: unknown) {
            const errMessage = e instanceof Error ? e.message : String(e)
            newResults.push({
              id: `x25519-ecdh-err-${eName}`,
              algorithm: `X25519 ECDH (${eName})`,
              testCase: 'RFC 7748 §6.1 Round-Trip',
              referenceUrl: REF.x25519,
              status: 'fail',
              details: errMessage,
            })
            addLog(`[DISCREPANCY] [${eName}] [id:${id23}] X25519: ${errMessage}`)
          }
        }

        // ── 24. X448 ECDH Round-Trip (RFC 7748) ───────────────────────────
        if (engine.mechs.size > 0 && !engine.mechs.has(CKM_EC_MONTGOMERY_KEY_PAIR_GEN)) {
          addLog(`[${eName}] [SKIP] X448: CKM_EC_MONTGOMERY_KEY_PAIR_GEN not in mechanism list`)
        } else {
          const id24 = `x448-ecdh-${eName}`
          addLog(`[${eName}] Testing X448 ECDH Round-Trip (RFC 7748)...`)
          try {
            // Generate two X448 keypairs
            const { pubHandle: pubA, privHandle: privA } = hsm_generateECKeyPair(
              M,
              hSession,
              'X448',
              true,
              'sign'
            )
            const { pubHandle: pubB, privHandle: privB } = hsm_generateECKeyPair(
              M,
              hSession,
              'X448',
              true,
              'sign'
            )
            regKey({
              handle: pubA,
              family: 'ecdh',
              role: 'public',
              label: `ACVP X448 PubKey-A (${eName})`,
              engine: engineId,
            })
            regKey({
              handle: privA,
              family: 'ecdh',
              role: 'private',
              label: `ACVP X448 PrivKey-A (${eName})`,
              engine: engineId,
            })
            regKey({
              handle: pubB,
              family: 'ecdh',
              role: 'public',
              label: `ACVP X448 PubKey-B (${eName})`,
              engine: engineId,
            })
            regKey({
              handle: privB,
              family: 'ecdh',
              role: 'private',
              label: `ACVP X448 PrivKey-B (${eName})`,
              engine: engineId,
            })

            // Extract raw 56-byte public key values (engine-agnostic: Rust=CKA_VALUE, C++=CKA_EC_POINT)
            const pubABytes = extractMontgomeryPubKey(pubA)
            const pubBBytes = extractMontgomeryPubKey(pubB)

            // Import peer public keys — smoke test only (not used in derive below)
            let peerBHandle = 0,
              peerAHandle = 0
            try {
              peerBHandle = hsm_importX448PublicKey(M, hSession, pubBBytes)
              peerAHandle = hsm_importX448PublicKey(M, hSession, pubABytes)
            } catch {
              /* C++ engine stores Montgomery pubkeys as CKA_EC_POINT; import is smoke-only */
            }

            // A derives shared secret using B's public key
            const secretHandleAB = hsm_ecdhDerive(
              M,
              hSession,
              privA,
              pubBBytes,
              undefined,
              undefined,
              { keyLen: 56, extractable: true }
            )
            const secretAB = hsm_extractKeyValue(M, hSession, secretHandleAB)

            // B derives shared secret using A's public key
            const secretHandleBA = hsm_ecdhDerive(
              M,
              hSession,
              privB,
              pubABytes,
              undefined,
              undefined,
              { keyLen: 56, extractable: true }
            )
            const secretBA = hsm_extractKeyValue(M, hSession, secretHandleBA)

            const matches =
              secretAB.length === secretBA.length &&
              secretAB.every((b: number, i: number) => b === secretBA[i])

            void peerBHandle
            void peerAHandle

            newResults.push({
              id: id24,
              algorithm: `X448 ECDH (${eName})`,
              testCase: 'RFC 7748 §6.2 Round-Trip',
              referenceUrl: REF.x448,
              status: matches ? 'pass' : 'fail',
              details: matches
                ? `A→B and B→A derive same 56B shared secret ✓ | Z=${toHex(secretAB, 8)}…`
                : `Secrets differ: A→B=${toHex(secretAB, 8)}… B→A=${toHex(secretBA, 8)}…`,
            })
            addLog(
              `[${eName}] [id:${id24}] X448 ECDH: ${matches ? 'PASS' : 'FAIL'} | Z=${toHex(secretAB, 8)}…`
            )
          } catch (e: unknown) {
            const errMessage = e instanceof Error ? e.message : String(e)
            newResults.push({
              id: `x448-ecdh-err-${eName}`,
              algorithm: `X448 ECDH (${eName})`,
              testCase: 'RFC 7748 §6.2 Round-Trip',
              referenceUrl: REF.x448,
              status: 'fail',
              details: errMessage,
            })
            addLog(`[DISCREPANCY] [${eName}] [id:${id24}] X448: ${errMessage}`)
          }
        }

        // ── 25. X9.63 KDF with SHA3-256 / SHA3-512 (PKCS#11 v3.2 §5.2.12) ──
        if (engine.mechs.size > 0 && !engine.mechs.has(CKM_EC_MONTGOMERY_KEY_PAIR_GEN)) {
          addLog(`[${eName}] [SKIP] X9.63-SHA3: requires X25519 keygen`)
        } else {
          const id25 = `x963-sha3-kdf-${eName}`
          addLog(`[${eName}] Testing X9.63 KDF SHA3-256/SHA3-512 (PKCS#11 v3.2 §5.2.12)...`)
          try {
            // Generate an X25519 keypair for each party
            const { pubHandle: pubA, privHandle: privA } = hsm_generateECKeyPair(
              M,
              hSession,
              'X25519',
              true,
              'sign'
            )
            const { pubHandle: pubB, privHandle: privB } = hsm_generateECKeyPair(
              M,
              hSession,
              'X25519',
              true,
              'sign'
            )
            regKey({
              handle: pubA,
              family: 'ecdh',
              role: 'public',
              label: `ACVP X963-SHA3 PubA (${eName})`,
              engine: engineId,
            })
            regKey({
              handle: privA,
              family: 'ecdh',
              role: 'private',
              label: `ACVP X963-SHA3 PrivA (${eName})`,
              engine: engineId,
            })
            regKey({
              handle: pubB,
              family: 'ecdh',
              role: 'public',
              label: `ACVP X963-SHA3 PubB (${eName})`,
              engine: engineId,
            })
            regKey({
              handle: privB,
              family: 'ecdh',
              role: 'private',
              label: `ACVP X963-SHA3 PrivB (${eName})`,
              engine: engineId,
            })

            const pubABytes = extractMontgomeryPubKey(pubA)
            const pubBBytes = extractMontgomeryPubKey(pubB)

            // ── SHA3-256 KDF (CKD_SHA3_256_KDF = 0x0B): derive 32B AES key ──
            const sharedInfo = new TextEncoder().encode('ACVP-X9.63-SHA3-KDF-test')
            const k256AB = hsm_extractKeyValue(
              M,
              hSession,
              hsm_ecdhDerive(M, hSession, privA, pubBBytes, CKD_SHA3_256_KDF, sharedInfo, {
                keyLen: 32,
                extractable: true,
              })
            )
            const k256BA = hsm_extractKeyValue(
              M,
              hSession,
              hsm_ecdhDerive(M, hSession, privB, pubABytes, CKD_SHA3_256_KDF, sharedInfo, {
                keyLen: 32,
                extractable: true,
              })
            )
            const sha3_256Match =
              k256AB.length === k256BA.length &&
              k256AB.every((b: number, i: number) => b === k256BA[i])

            // ── SHA3-512 KDF (CKD_SHA3_512_KDF = 0x0D): derive 64B material ──
            const k512AB = hsm_extractKeyValue(
              M,
              hSession,
              hsm_ecdhDerive(M, hSession, privA, pubBBytes, CKD_SHA3_512_KDF, sharedInfo, {
                keyLen: 64,
                extractable: true,
              })
            )
            const k512BA = hsm_extractKeyValue(
              M,
              hSession,
              hsm_ecdhDerive(M, hSession, privB, pubABytes, CKD_SHA3_512_KDF, sharedInfo, {
                keyLen: 64,
                extractable: true,
              })
            )
            const sha3_512Match =
              k512AB.length === k512BA.length &&
              k512AB.every((b: number, i: number) => b === k512BA[i])

            const pass = sha3_256Match && sha3_512Match
            newResults.push({
              id: id25,
              algorithm: `X9.63-KDF (${eName})`,
              testCase: 'PKCS#11 v3.2 §5.2.12 — SHA3-256 + SHA3-512 bilateral agreement',
              referenceUrl: REF.x963kdf,
              status: pass ? 'pass' : 'fail',
              details: pass
                ? `SHA3-256: A→B=B→A (32B) ✓ | SHA3-512: A→B=B→A (64B) ✓`
                : `SHA3-256 match=${sha3_256Match} | SHA3-512 match=${sha3_512Match}`,
            })
            addLog(
              `[${eName}] [id:${id25}] X9.63-SHA3: ${pass ? 'PASS' : 'FAIL'} | SHA3-256=${sha3_256Match} SHA3-512=${sha3_512Match}`
            )
          } catch (e: unknown) {
            const errMessage = e instanceof Error ? e.message : String(e)
            newResults.push({
              id: `x963-sha3-kdf-err-${eName}`,
              algorithm: `X9.63-KDF (${eName})`,
              testCase: 'PKCS#11 v3.2 §5.2.12 — SHA3-256 + SHA3-512 bilateral agreement',
              referenceUrl: REF.x963kdf,
              status: 'fail',
              details: errMessage,
            })
            addLog(`[DISCREPANCY] [${eName}] [id:${id25}] X9.63-SHA3: ${errMessage}`)
          }
        }

        // ── 26. ChaCha20-Poly1305 AEAD Encrypt/Decrypt Round-Trip ────────────────────────
        if (engine.mechs.size > 0 && !engine.mechs.has(CKM_CHACHA20_POLY1305)) {
          addLog(`[${eName}] [SKIP] ChaCha20-Poly1305: mechanism not supported`)
        } else {
          const id26 = `chacha20-rt-${eName}`
          addLog(`[${eName}] Testing ChaCha20-Poly1305 AEAD Round-Trip...`)
          try {
            const hKey = hsm_generateChaCha20Key(
              M,
              hSession,
              true,
              true,
              true,
              `ACVP ChaCha20 (${eName})`
            )
            regKey({
              handle: hKey,
              family: 'chacha20',
              role: 'secret',
              label: `ACVP ChaCha20 (${eName})`,
              engine: engineId,
            })

            const nonce = new Uint8Array(12).fill(0x55)
            const aad = new TextEncoder().encode('ACVP-AAD-DATA')
            const ptStr = 'ChaCha20-Poly1305 Payload Test'
            const ptBytes = new TextEncoder().encode(ptStr)

            const ctWithTag = hsm_chacha20Poly1305Encrypt(M, hSession, hKey, nonce, aad, ptBytes)
            const recoveredPtBytes = hsm_chacha20Poly1305Decrypt(
              M,
              hSession,
              hKey,
              nonce,
              aad,
              ctWithTag
            )

            const pass =
              recoveredPtBytes.length === ptBytes.length &&
              recoveredPtBytes.every((b, i) => b === ptBytes[i])

            newResults.push({
              id: id26,
              algorithm: `ChaCha20-Poly1305 (${eName})`,
              testCase: 'AEAD Encrypt/Decrypt Round-Trip',
              referenceUrl: 'https://datatracker.ietf.org/doc/html/rfc8439',
              status: pass ? 'pass' : 'fail',
              details: pass
                ? `PT -> CT (${ctWithTag.length}B) -> PT matched ✓`
                : `PT mismatch after decryption`,
            })
            addLog(
              `[${eName}] [id:${id26}] ChaCha20-Poly1305 Round-Trip: ${pass ? 'PASS' : 'FAIL'}`
            )
          } catch (e: unknown) {
            const errMessage = e instanceof Error ? e.message : String(e)
            newResults.push({
              id: `chacha20-rt-err-${eName}`,
              algorithm: `ChaCha20-Poly1305 (${eName})`,
              testCase: 'AEAD Encrypt/Decrypt Round-Trip',
              referenceUrl: 'https://datatracker.ietf.org/doc/html/rfc8439',
              status: 'fail',
              details: errMessage,
            })
            addLog(`[DISCREPANCY] [${eName}] [id:${id26}] ChaCha20-Poly1305: ${errMessage}`)
          }
        }

        // ── 27. SP 800-108 KBKDF Derivation (Counter Mode) ────────────────────────
        if (engine.mechs.size > 0 && !engine.mechs.has(CKM_SP800_108_COUNTER_KDF)) {
          addLog(`[${eName}] [SKIP] SP800-108 KBKDF: mechanism not supported`)
        } else {
          const id27 = `sp800-108-kdf-${eName}`
          addLog(`[${eName}] Testing SP800-108 KBKDF (Counter Mode, SHA-256)...`)
          try {
            const secretKeyBytes = new Uint8Array(32).fill(0xaa)
            const hBaseKey = hsm_importAESKey(
              M,
              hSession,
              secretKeyBytes,
              false, // encrypt
              false, // decrypt
              false, // wrap
              false, // unwrap
              true // derive
            )
            const fixedInput = new TextEncoder().encode('ACVP-KDF-CONTEXT')
            const derivedKeyBytes = hsm_kbkdf(M, hSession, hBaseKey, CKM_SHA256, fixedInput, 32)

            const pass = derivedKeyBytes.length === 32
            const derivedHex = Array.from(derivedKeyBytes)
              .map((b) => b.toString(16).padStart(2, '0'))
              .join('')
            newResults.push({
              id: id27,
              algorithm: `SP 800-108 KBKDF (${eName})`,
              testCase: 'Counter Mode Derivation',
              referenceUrl: 'https://csrc.nist.gov/publications/detail/sp/800-108/rev-1/final',
              status: pass ? 'pass' : 'fail',
              details: pass ? `Derived 32B Key: ${derivedHex}` : 'Key derivation failed',
            })
            addLog(
              `[${eName}] [id:${id27}] SP800-108 KBKDF: ${pass ? 'PASS' : 'FAIL'} | Key: ${derivedHex}`
            )
          } catch (e: unknown) {
            const errMessage = e instanceof Error ? e.message : String(e)
            newResults.push({
              id: `sp800-108-err-${eName}`,
              algorithm: `SP 800-108 KBKDF (${eName})`,
              testCase: 'Counter Mode Derivation',
              referenceUrl: 'https://csrc.nist.gov/publications/detail/sp/800-108/rev-1/final',
              status: 'fail',
              details: errMessage,
            })
            addLog(`[DISCREPANCY] [${eName}] [id:${id27}] SP800-108 KBKDF: ${errMessage}`)
          }
        }

        // ── 28. Hash-ML-DSA Functional Sign+Verify ────────────────────────
        for (const dsaVariant of [44, 65, 87] as const) {
          const dsaAlgo = `Hash-ML-DSA-${dsaVariant} (SHA-512)`
          const id28 = `hash-mldsa-${dsaVariant}-${eName}`
          addLog(`[${eName}] Testing ${dsaAlgo} Functional Sign+Verify...`)
          try {
            const mldsaPair = hsm_generateMLDSAKeyPair(M, hSession, dsaVariant)
            const sig = hsm_sign(M, hSession, mldsaPair.privHandle, 'ACVP PreHash Test', {
              preHash: 'sha512',
            })
            const isValid = hsm_verify(M, hSession, mldsaPair.pubHandle, 'ACVP PreHash Test', sig, {
              preHash: 'sha512',
            })
            if (isValid) {
              newResults.push({
                id: id28,
                algorithm: dsaAlgo,
                testCase: 'PreHash Sign+Verify',
                referenceUrl: REF.mldsa,
                status: 'pass',
                details: `sig[${sig.length}B] validated successfully ✓`,
              })
              addLog(`[${eName}] [id:${id28}] ${dsaAlgo}: PASS`)
            } else {
              throw new Error('Hash-ML-DSA signature verification failed on own signature')
            }
          } catch (e: unknown) {
            const errMessage = e instanceof Error ? e.message : String(e)
            newResults.push({
              id: `hash-mldsa-err-${dsaVariant}-${eName}`,
              algorithm: dsaAlgo,
              testCase: 'PreHash Sign+Verify',
              referenceUrl: REF.mldsa,
              status: 'fail',
              details: errMessage,
            })
            addLog(`[DISCREPANCY] [${eName}] [id:${id28}] ${dsaAlgo}: ${errMessage}`)
          }
        }
        // ── 29. SP 800-108 KBKDF Derivation (Feedback Mode) ────────────────────────
        if (engine.mechs.size > 0 && !engine.mechs.has(CKM_SP800_108_FEEDBACK_KDF)) {
          addLog(`[${eName}] [SKIP] SP800-108 KBKDF Feedback: mechanism not supported`)
        } else {
          const id29 = `sp800-108-kdf-feedback-${eName}`
          addLog(`[${eName}] Testing SP800-108 KBKDF (Feedback Mode, SHA-256)...`)
          try {
            const secretKeyBytes = new Uint8Array(32).fill(0xbb)
            const hBaseKey = hsm_importAESKey(
              M,
              hSession,
              secretKeyBytes,
              false, // encrypt
              false, // decrypt
              false, // wrap
              false, // unwrap
              true // derive
            )
            const fixedInput = new TextEncoder().encode('ACVP-KDF-FEEDBACK')
            const ivBytes = new Uint8Array(32).fill(0xcc) // PRF_SEED_BYTES for SHA-256 is 32
            const derivedKeyBytes = hsm_kbkdfFeedback(
              M,
              hSession,
              hBaseKey,
              CKM_SHA256,
              fixedInput,
              ivBytes,
              32
            )

            const pass = derivedKeyBytes.length === 32
            const derivedHex = Array.from(derivedKeyBytes)
              .map((b) => b.toString(16).padStart(2, '0'))
              .join('')
            newResults.push({
              id: id29,
              algorithm: `SP 800-108 KBKDF (${eName})`,
              testCase: 'Feedback Mode Derivation',
              referenceUrl: 'https://csrc.nist.gov/publications/detail/sp/800-108/rev-1/final',
              status: pass ? 'pass' : 'fail',
              details: pass ? `Derived 32B Key: ${derivedHex}` : 'Key derivation failed',
            })
            addLog(
              `[${eName}] [id:${id29}] SP800-108 KBKDF Feedback: ${pass ? 'PASS' : 'FAIL'} | Key: ${derivedHex}`
            )
          } catch (e: unknown) {
            const errMessage = e instanceof Error ? e.message : String(e)
            newResults.push({
              id: `sp800-108-feedback-err-${eName}`,
              algorithm: `SP 800-108 KBKDF (${eName})`,
              testCase: 'Feedback Mode Derivation',
              referenceUrl: 'https://csrc.nist.gov/publications/detail/sp/800-108/rev-1/final',
              status: 'fail',
              details: errMessage,
            })
            addLog(`[DISCREPANCY] [${eName}] [id:${id29}] SP800-108 KBKDF Feedback: ${errMessage}`)
          }
        }

        // ── 30. XMSS Stateful Sign+Verify ────────────────────────
        if (engine.mechs.size > 0 && !engine.mechs.has(CKM_XMSS)) {
          addLog(`[${eName}] [SKIP] XMSS: mechanism not supported`)
        } else {
          const id30 = `xmss-sig-${eName}`
          addLog(`[${eName}] Testing XMSS Stateful Sign+Verify...`)
          try {
            const xmssPair = hsm_generateXMSSKeyPair(M, hSession, 1, false) // 0x00000001
            const msgBytes = new TextEncoder().encode('ACVP XMSS Test')
            const sig = hsm_statefulSignBytes(M, hSession, CKM_XMSS, xmssPair.privHandle, msgBytes)
            const valid =
              hsm_statefulVerifyBytes(M, hSession, CKM_XMSS, xmssPair.pubHandle, msgBytes, sig) ===
              0
            if (valid) {
              newResults.push({
                id: id30,
                algorithm: `XMSS (${eName})`,
                testCase: 'Stateful Sign+Verify',
                referenceUrl: 'https://csrc.nist.gov/pubs/sp/800/208/final',
                status: 'pass',
                details: `sig[${sig.length}B] validated successfully ✓`,
              })
              addLog(`[${eName}] [id:${id30}] XMSS: PASS`)
            } else {
              throw new Error('XMSS signature verification failed')
            }
          } catch (e: unknown) {
            const errMessage = e instanceof Error ? e.message : String(e)
            newResults.push({
              id: `xmss-err-${eName}`,
              algorithm: `XMSS (${eName})`,
              testCase: 'Stateful Sign+Verify',
              referenceUrl: 'https://csrc.nist.gov/pubs/sp/800/208/final',
              status: 'fail',
              details: errMessage,
            })
            addLog(`[DISCREPANCY] [${eName}] [id:${id30}] XMSS: ${errMessage}`)
          }
        }

        // ── 31. LMS Stateful Sign+Verify ────────────────────────
        if (engine.mechs.size > 0 && !engine.mechs.has(CKM_LMS)) {
          addLog(`[${eName}] [SKIP] LMS: mechanism not supported`)
        } else {
          const id31 = `lms-sig-${eName}`
          addLog(`[${eName}] Testing LMS Stateful Sign+Verify...`)
          try {
            const lmsPair = hsm_generateLMSKeyPair(M, hSession, 0x05, 0x01, false)
            const msgBytes = new TextEncoder().encode('ACVP LMS Test')
            const sig = hsm_statefulSignBytes(M, hSession, CKM_LMS, lmsPair.privHandle, msgBytes)
            const valid =
              hsm_statefulVerifyBytes(M, hSession, CKM_LMS, lmsPair.pubHandle, msgBytes, sig) === 0
            if (valid) {
              newResults.push({
                id: id31,
                algorithm: `LMS (${eName})`,
                testCase: 'Stateful Sign+Verify',
                referenceUrl: 'https://csrc.nist.gov/pubs/sp/800/208/final',
                status: 'pass',
                details: `sig[${sig.length}B] validated successfully ✓`,
              })
              addLog(`[${eName}] [id:${id31}] LMS: PASS`)
            } else {
              throw new Error('LMS signature verification failed')
            }
          } catch (e: unknown) {
            const errMessage = e instanceof Error ? e.message : String(e)
            newResults.push({
              id: `lms-err-${eName}`,
              algorithm: `LMS (${eName})`,
              testCase: 'Stateful Sign+Verify',
              referenceUrl: 'https://csrc.nist.gov/pubs/sp/800/208/final',
              status: 'fail',
              details: errMessage,
            })
            addLog(`[DISCREPANCY] [${eName}] [id:${id31}] LMS: ${errMessage}`)
          }
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      addLog(`Critical Error: ${errorMessage}`)
    } finally {
      // ACVP session stays alive — keys remain as live session objects
      // so C_GetAttributeValue works when inspecting via the eye icon.
      // Next ACVP run resets everything via clearHsmKeys() + finalize at top of runTests().
      // Re-anchor HsmContext refs so Mechanism Discovery + other panels remain functional.
      const primary = engines[0] ?? null
      if (primary) {
        slotRef.current = primary.slot
        if (primary.hSession !== 0) {
          hSessionRef.current = primary.hSession
        }
      }
      setResults(newResults)
      setLoading(false)
      addLog('Validation Suite Completed.')
    }
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <CheckCircle className="text-success" aria-hidden="true" size={20} />
            SoftHSMv3 FIPS Validation Mode (ACVP)
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Validates deterministic operations across the WASM PKCS#11 FFI using NIST CAVP target
            vectors.
          </p>
          <a
            href="https://github.com/usnistgov/ACVP-Server"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs hover:underline text-primary mt-2 block"
          >
            View NIST ACVP JSON Reference Vectors
          </a>
        </div>
        <Button
          variant="ghost"
          onClick={runTests}
          className="btn-primary flex items-center gap-2"
          disabled={loading || phase !== 'session_open'}
        >
          <Play size={18} /> Execute ACVP Tests
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Results Column */}
        <div className="space-y-4 flex flex-col min-h-0">
          <h4 className="font-bold text-muted-foreground uppercase tracking-wider text-sm">
            Test Results
          </h4>
          <div className="bg-muted/30 border border-border rounded-lg overflow-hidden flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/30 text-muted-foreground uppercase text-xs sticky top-0 backdrop-blur-md">
                <tr>
                  <th className="p-3 font-bold">Algorithm</th>
                  <th className="p-3 font-bold">Test Case</th>
                  <th className="p-3 font-bold">Status</th>
                  <th className="p-3 font-bold">Details</th>
                  <th className="p-3 font-bold">Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-foreground/30 italic">
                      No results yet. Run the validation suite to assert ACVP compliance.
                    </td>
                  </tr>
                ) : (
                  results.map((res) => (
                    <tr key={res.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-medium text-foreground">{res.algorithm}</td>
                      <td className="p-3 text-muted-foreground">{res.testCase}</td>
                      <td className="p-3">
                        <span
                          className={clsx(
                            'px-2 py-0.5 rounded text-[10px] uppercase font-bold flex items-center gap-1 w-fit',
                            res.status === 'pass'
                              ? 'bg-success/20 text-success'
                              : 'bg-destructive/20 text-destructive'
                          )}
                        >
                          {res.status === 'pass' ? (
                            <CheckCircle size={12} />
                          ) : (
                            <XCircle size={12} />
                          )}
                          {res.status}
                        </span>
                      </td>
                      <td
                        className="p-3 text-muted-foreground truncate max-w-[200px]"
                        title={res.details}
                      >
                        {res.details}
                      </td>
                      <td className="p-3">
                        <a
                          href={res.referenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/70 transition-colors"
                          title={res.referenceUrl}
                        >
                          <ExternalLink size={12} />
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Logs Column */}
        <div className="space-y-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-muted-foreground uppercase tracking-wider text-sm">
              Execution Log
            </h4>
            {logs.length > 0 && (
              <Button
                variant="ghost"
                onClick={() => {
                  void navigator.clipboard.writeText(logs.join('\n')).then(() => {
                    setLogCopied(true)
                    if (logCopyTimerRef.current) clearTimeout(logCopyTimerRef.current)
                    logCopyTimerRef.current = setTimeout(() => setLogCopied(false), 2000)
                  })
                }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                title="Copy log to clipboard"
              >
                {logCopied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                {logCopied ? 'Copied' : 'Copy log'}
              </Button>
            )}
          </div>
          <div className="bg-muted/50 border border-border rounded-lg p-4 font-mono text-xs text-success/80 overflow-y-auto custom-scrollbar flex-1">
            {logs.length === 0 ? (
              <span className="text-foreground/20 italic">Ready to engage HSM suite...</span>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
