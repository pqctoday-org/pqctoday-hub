// SPDX-License-Identifier: GPL-3.0-only
import { useState, useRef, useEffect } from 'react'
import { ShieldCheck, BookMarked, FlaskConical } from 'lucide-react'
import mlkemTestVectors from '@/data/acvp/mlkem_test.json'
import mldsaTestVectors from '@/data/acvp/mldsa_test.json'
import mldsaExtendedTestVectors from '@/data/acvp/mldsa_extended_test.json'
import aesGcmTestVectors from '@/data/acvp/aesgcm_test.json'
import hmacTestVectors from '@/data/acvp/hmac_test.json'
import kmacTestVectors from '@/data/acvp/kmac_test.json'
import rsaOaepTestVectors from '@/data/acvp/rsa_oaep_test.json'
import rsaPssTestVectors from '@/data/acvp/rsapss_test.json'
import ecdsaTestVectors from '@/data/acvp/ecdsa_test.json'
import sha256TestVectors from '@/data/acvp/sha256_test.json'
import aesCbcTestVectors from '@/data/acvp/aescbc_test.json'
import aesCtrTestVectors from '@/data/acvp/aesctr_test.json'
import hmac384TestVectors from '@/data/acvp/hmac_sha384_test.json'
import hmac512TestVectors from '@/data/acvp/hmac_sha512_test.json'
import ecdsaP384TestVectors from '@/data/acvp/ecdsa_p384_test.json'
import ecdsaP521TestVectors from '@/data/acvp/ecdsa_p521_test.json'
import aesKwTestVectors from '@/data/acvp/aeskw_test.json'
import eddsaTestVectors from '@/data/acvp/eddsa_test.json'
import eddsaEd448TestVectors from '@/data/acvp/eddsa_ed448_test.json'
import slhdsaCtxTestVectors from '@/data/acvp/slhdsa_ctx_test.json'
import pbkdf2TestVectors from '@/data/acvp/pbkdf2_test.json'
import sha384TestVectors from '@/data/acvp/sha384_test.json'
import sha512TestVectors from '@/data/acvp/sha512_test.json'
import sha3_256TestVectors from '@/data/acvp/sha3_256_test.json'
import sha3_512TestVectors from '@/data/acvp/sha3_512_test.json'
import { hexToBytes } from '@/utils/dataInputUtils'
import {
  hsm_initialize,
  hsm_finalize,
  hsm_getFirstSlot,
  hsm_initToken,
  hsm_openUserSession,
  hsm_importAESKey,
  hsm_aesDecrypt,
  hsm_importHMACKey,
  hsm_hmacVerifyGeneral,
  hsm_kmacVerify,
  hsm_importRSAPublicKey,
  hsm_importRSAPrivateKey,
  hsm_rsaVerify,
  hsm_rsaDecrypt,
  CKM_SHA256_RSA_PKCS_PSS,
  hsm_importECPublicKey,
  hsm_ecdsaSign,
  hsm_ecdsaVerify,
  hsm_ecdsaVerifyBytes,
  hsm_importMLKEMPrivateKey,
  hsm_decapsulate,
  hsm_extractKeyValue,
  hsm_importMLDSAPublicKey,
  hsm_verifyBytes,
  hsm_verifyBytesMLDSA,
  type MLDSAPreHash,
  hsm_generateMLDSAKeyPair,
  hsm_sign,
  hsm_verify,
  hsm_generateMLKEMKeyPair,
  hsm_encapsulate,
  hsm_generateSLHDSAKeyPair,
  hsm_slhdsaSign,
  hsm_slhdsaVerify,
  hsm_importSLHDSAPublicKey,
  hsm_slhdsaVerifyBytes,
  hsm_digest,
  hsm_getMechanismList,
  hsm_aesCtrDecrypt,
  hsm_importEdDSAPublicKey,
  hsm_eddsaVerify,
  hsm_eddsaVerifyBytes,
  hsm_generateAESKey,
  hsm_wrapKeyMech,
  hsm_unwrapKeyMech,
  hsm_pbkdf2,
  hsm_hkdf,
  hsm_importGenericSecret,
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
  CKM_SHA384,
  CKM_SHA512,
  CKM_SHA3_256,
  CKM_SHA3_512,
  CKM_AES_GCM,
  CKM_AES_CBC,
  CKM_AES_CTR,
  CKM_AES_KEY_WRAP,
  CKM_AES_KEY_WRAP_KWP,
  CKM_SHA256_HMAC,
  CKM_SHA256_HMAC_GENERAL,
  CKM_SHA384_HMAC_GENERAL,
  CKM_SHA512_HMAC_GENERAL,
  CKM_KMAC_128,
  CKM_RSA_PKCS_OAEP,
  CKM_ECDSA_SHA256,
  CKM_ECDSA_SHA384,
  CKM_ECDSA_SHA512,
  CKM_EDDSA,
  CKM_PKCS5_PBKD2,
  CKP_PKCS5_PBKD2_HMAC_SHA256,
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
  CKM_HSS,
  hsm_generateXMSSKeyPair,
  hsm_generateLMSKeyPair,
} from '@/wasm/softhsm'
import type { SoftHSMModule, SLHDSASignOptions } from '@/wasm/softhsm'
import { useHsmContext } from '../HsmContext'
import type { HsmKey } from '../HsmContext'

// ─────────────────────────────────────────────────────────────────────────────
// useAcvpSuite — the ACVP known-answer suite's state + run logic, extracted
// verbatim from HsmAcvpTesting.tsx (2026-09-02, design handoff
// design_handoff_kmip_pkcs11_playground WP-P6c) so the Build tab's suite
// workbench, the standalone results view and the Pyodide `acvp_native`
// bridge all drive ONE runner. The ~36 test sections inside `runTests` are
// untouched — this is a move, not a rewrite; parity with the pre-extraction
// results is what e2e/acvp-validator.spec.ts's ≥40-row assertion checks.
// ─────────────────────────────────────────────────────────────────────────────

// WS-8 (2026-08-28) — what kind of evidence backs a test's expected value:
//  - 'nist-acvp': from a NIST ACVP-Server reference vector
//  - 'published-standard': from a cited public standard's own KAT (e.g. an
//    RFC), not NIST ACVP specifically — reserved for a future producer this
//    file doesn't currently have (every vector today is either nist-acvp or
//    self-consistency)
//  - 'self-consistency': computed by an independent oracle (Node crypto /
//    OpenSSL), not sourced from any published KAT — still a real assertion
//    (the two engines and the oracle must agree), just a weaker one
export type EvidenceTier = 'nist-acvp' | 'published-standard' | 'self-consistency'

/**
 * Derives the evidence tier from a vector file's own `_provenance.producer`
 * string, rather than each of the ~80 pushResult call sites asserting its
 * own tier by hand — the provenance block is the single source of truth
 * (see D-8/WS-4's "provenance data drives behavior" precedent). Returns
 * undefined for vector files with no `_provenance` block at all (most of
 * the pre-WS-4 test files) — the UI shows no tier badge in that case rather
 * than guessing one.
 */
const deriveEvidenceTier = (
  provenance: { producer?: string } | null | undefined
): EvidenceTier | undefined => {
  const producer = provenance?.producer
  if (!producer) return undefined
  if (producer.startsWith('NIST ACVP-Server')) return 'nist-acvp'
  if (producer.startsWith('self-generated')) return 'self-consistency'
  return 'published-standard'
}

export const EVIDENCE_TIER_META: Record<EvidenceTier, { icon: typeof ShieldCheck; label: string }> =
  {
    'nist-acvp': { icon: ShieldCheck, label: 'NIST ACVP reference vector' },
    'published-standard': { icon: BookMarked, label: "Published standard's own KAT" },
    'self-consistency': {
      icon: FlaskConical,
      label: 'Self-consistency (independent oracle, not a published KAT)',
    },
  }

/**
 * The 36 test sections below group into 7 algorithm-family categories, used
 * by the left sidebar to let a user run a subset instead of the full suite.
 * Each section is tagged with its category by setting `currentCategory`
 * (see `pushResult` below) right as its enclosing `if (activeCategories.has(...))`
 * guard is entered — the section bodies themselves are unmodified.
 */
export type CategoryId =
  | 'symmetric'
  | 'hashing_mac'
  | 'kdf'
  | 'classical'
  | 'ml_dsa'
  | 'slh_stateful'
  | 'ml_kem'

export const CATEGORIES: { id: CategoryId; label: string; groups: number }[] = [
  { id: 'symmetric', label: 'Symmetric / AEAD', groups: 6 },
  { id: 'hashing_mac', label: 'Hashing & MAC', groups: 5 },
  { id: 'kdf', label: 'KDF', groups: 5 },
  { id: 'classical', label: 'Classical Asymmetric', groups: 10 },
  { id: 'ml_dsa', label: 'ML-DSA', groups: 3 },
  { id: 'slh_stateful', label: 'SLH-DSA & Stateful', groups: 5 },
  { id: 'ml_kem', label: 'ML-KEM', groups: 2 },
]

export const ALL_CATEGORY_IDS: Set<CategoryId> = new Set(CATEGORIES.map((c) => c.id))

export interface TestResult {
  id: string
  algorithm: string
  testCase: string
  referenceUrl: string
  // 'skip' = the engine doesn't advertise the mechanism this check needs, so no
  // PKCS#11 call was made. It is deliberately distinct from 'pass'/'fail': a
  // skip proves nothing about conformance and must never count as either — see
  // the summary counters below, where it has its own bucket.
  status: 'pass' | 'fail' | 'pending' | 'skip'
  details: string
  evidenceTier?: EvidenceTier
  category: CategoryId
}

export function useAcvpSuite() {
  const [results, setResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<{ done: number; current: string } | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [logCopied, setLogCopied] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<Set<CategoryId>>(
    () => new Set(ALL_CATEGORY_IDS)
  )
  const logCopyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const {
    moduleRef,
    crossCheckModuleRef,
    engineMode,
    hSessionRef,
    slotRef,
    phase,
    autoInit,
    addHsmLog,
    addHsmKey,
    clearHsmKeys,
    addHsmStepLog,
  } = useHsmContext()

  const addLog = (msg: string) =>
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])

  const ts = () => new Date().toLocaleTimeString([], { hour12: false })

  /** Format bytes as hex string, truncated to maxBytes with … suffix */
  const toHex = (bytes: Uint8Array, maxBytes = 32) =>
    Array.from(bytes.slice(0, maxBytes))
      .map((b: number) => b.toString(16).padStart(2, '0'))
      .join('') + (bytes.length > maxBytes ? '…' : '')

  const runTestsRef = useRef<{ runTests: (override?: Set<CategoryId>) => Promise<void> }>({
    runTests: () => Promise.resolve(),
  })
  runTestsRef.current = {
    runTests: (override?: Set<CategoryId>) => (runTests as typeof runTests)(override),
  }

  // Attach e2e event securely. Always runs the FULL suite (ALL_CATEGORY_IDS),
  // regardless of the sidebar's current checkbox state — e2e/acvp-validator.spec.ts
  // asserts on ≥40 result rows across the whole suite, and that assertion must
  // hold no matter what a prior interactive session left selected.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleTrigger = () => {
        setTimeout(() => {
          runTestsRef.current.runTests(ALL_CATEGORY_IDS).catch(console.error)
        }, 300) // allow state to settle
      }
      window.addEventListener('e2e:trigger_acvp', handleTrigger)
      return () => window.removeEventListener('e2e:trigger_acvp', handleTrigger)
    }
  }, [])

  const runTests = async (overrideCategories?: Set<CategoryId>) => {
    if (loading) return
    // "Run All" (and the e2e trigger) pass ALL_CATEGORY_IDS explicitly here so
    // the full suite runs regardless of the sidebar's checkbox state; "Run
    // Selected" omits the override and uses whatever's currently checked.
    const activeCategories = overrideCategories ?? selectedCategories
    // Self-heal: the session can be lost between enabling this button and the
    // run firing (a dev-server hot-reload, an engine-mode switch, or a stale
    // module). Rather than dead-end with "Session not open", (re)initialize the
    // HSM and continue. autoInit updates moduleRef/hSessionRef synchronously.
    if (!moduleRef.current || phase !== 'session_open') {
      addLog('HSM session not open — initializing…')
      const ok = await autoInit()
      if (!ok || !moduleRef.current) {
        addLog('Error: HSM initialization failed. Reload the page and retry.')
        return
      }
    }

    setLoading(true)
    setResults([])
    setLogs([])
    setProgress({ done: 0, current: 'Starting…' })
    clearHsmKeys()
    // Deliberately NOT clearHsmLog(): the Logs tab is the playground's
    // cross-tab inspection surface, and wiping it at run start silently
    // destroyed the visitor's whole session trace (2026-08-13 audit, N14).
    // A step-header marker delimits this run's output in the shared log
    // instead; the pane's own results live in local `logs` state anyway.
    addHsmStepLog('ACVP Validation Run')
    addLog('Starting ACVP Validation Suite via PKCS#11...')

    const newResults: TestResult[] = []
    // Paint the "running" state before the (heavy, synchronous) engine setup.
    await new Promise((resolve) => setTimeout(resolve, 0))

    // Which of the 7 categories the section currently executing belongs to —
    // set as the first statement inside each section's `if (activeCategories.has(...))`
    // guard, below. `pushResult` reads it so none of the ~36 sections' own
    // pushResult({...}) call sites need a `category` field added by hand.
    let currentCategory: CategoryId = CATEGORIES[0].id

    // Record each result as it completes: stream it into the table and advance
    // the live progress label so the run visibly moves instead of sitting on a
    // static spinner for 19–29s. (Avoids the literal `.push(` so the
    // global push→pushResult rewrite below doesn't recurse into this helper.)
    const pushResult = async (r: Omit<TestResult, 'category'>) => {
      newResults[newResults.length] = { ...r, category: currentCategory }
      setResults(newResults.slice())
      setProgress({ done: newResults.length, current: r.algorithm })
      // The crypto ops are synchronous WASM calls that block the main thread for
      // the whole run, so React never paints intermediate state. Yield a macrotask
      // after each result so the streamed table + progress label actually render.
      await new Promise((resolve) => setTimeout(resolve, 0))
    }

    // Canonical reference URLs per algorithm / standard
    const REF = {
      aesgcm: 'https://csrc.nist.gov/publications/detail/sp/800-38d/final',
      hmac: 'https://www.rfc-editor.org/rfc/rfc4231',
      rsapss: 'https://csrc.nist.gov/publications/detail/fips/186/5/final',
      ecdsa: 'https://csrc.nist.gov/publications/detail/fips/186/5/final',
      mldsa: 'https://csrc.nist.gov/pubs/fips/204/final',
      mlkem: 'https://csrc.nist.gov/pubs/fips/203/final',
      sha256: 'https://csrc.nist.gov/publications/detail/fips/180/4/final',
      sha384: 'https://csrc.nist.gov/publications/detail/fips/180/4/final',
      sha512: 'https://csrc.nist.gov/publications/detail/fips/180/4/final',
      sha3_256: 'https://csrc.nist.gov/publications/detail/fips/202/final',
      sha3_512: 'https://csrc.nist.gov/publications/detail/fips/202/final',
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
      kmac: 'https://csrc.nist.gov/pubs/sp/800/185/final',
      rsaoaep: 'https://csrc.nist.gov/pubs/sp/800/56/b/r2/final',
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

        // Record a visible 'skip' row when a mechanism this engine doesn't
        // advertise would otherwise silently drop a whole test category from
        // the Results table with nothing but a line in the Execution Log pane
        // (H-1 remediation — a real regression that removed a mechanism from
        // an engine's advertised list used to vanish with zero visible trace).
        const pushSkip = async (
          id: string,
          algorithm: string,
          testCase: string,
          referenceUrl: string,
          reason: string
        ) => {
          addLog(`[${eName}] [SKIP] ${reason}`)
          await pushResult({
            id,
            algorithm,
            testCase,
            referenceUrl,
            status: 'skip',
            details: `Skipped — ${reason}`,
          })
        }

        // Helper: extract raw bytes from a Montgomery public key.
        //
        // Both the attribute AND the encoding vary, so neither can be assumed:
        //   - CKA_VALUE holds the raw point on older bundles and on keys the hub
        //     imported itself; the conformance pass removed it from generated
        //     Montgomery/Edwards public keys, where the point now lives only in
        //     CKA_EC_POINT.
        //   - CKA_EC_POINT is DER "04 <len> <raw>" on the C++ engine and BARE
        //     raw bytes on the Rust engine (PKCS#11 v3.2 §6.7 — Montgomery
        //     points are not DER ECPoints).
        //
        // This used to strip two bytes unconditionally in the fallback. Against
        // a bare 32-byte X25519 point that yields 30 bytes, which C_DeriveKey
        // rejects with CKR_KEY_TYPE_INCONSISTENT — the failure the ACVP X25519,
        // X448 and X9.63-KDF rows were showing. Strip only when the DER header
        // is genuinely there and its length byte agrees.
        //
        // Hoisted here (2026-08-31, ACVP-into-Developer-tab category split) so
        // it stays in scope unconditionally — it's used by §23/§24 (Classical
        // Asymmetric) AND §25 (KDF), two different categories, and each of
        // those sections is now independently guarded by `selectedCategories`.
        const extractMontgomeryPubKey = (handle: number): Uint8Array => {
          try {
            const v = new Uint8Array(hsm_extractKeyValue(M, hSession, handle))
            if (v.length > 0) return v
          } catch {
            // fall through to CKA_EC_POINT
          }
          const pt = hsm_extractECPoint(M, hSession, handle)
          const derWrapped = pt.length > 2 && pt[0] === 0x04 && pt[1] === pt.length - 2
          return derWrapped ? pt.slice(2) : pt
        }

        // ── 1. AES-GCM-256 Decrypt KAT (SP 800-38D) ────────────────────
        if (activeCategories.has('symmetric')) {
          currentCategory = 'symmetric'
          if (engine.mechs.size > 0 && !engine.mechs.has(CKM_AES_GCM)) {
            await pushSkip(
              `aes-skip-${eName}`,
              `AES-GCM-256 (${eName})`,
              'Decrypt KAT',
              REF.aesgcm,
              'AES-GCM-256: mechanism not supported'
            )
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
              await pushResult({
                id: id1,
                algorithm: `AES-GCM-256 (${eName})`,
                testCase: 'Decrypt KAT',
                referenceUrl: REF.aesgcm,
                status: matches ? 'pass' : 'fail',
                details: matches
                  ? `PT[${recoveredPt.length}B]: ${ptHex}`
                  : `PT mismatch: got ${recoveredPt.length}B, expected ${expectedPt.length}B`,
                evidenceTier: deriveEvidenceTier(aesGcmTestVectors._provenance),
              })
              addLog(
                `[${eName}] [id:${id1}] AES-GCM Decrypt KAT: ${matches ? 'PASS' : 'FAIL'} | PT: ${ptHex}`
              )
            } catch (e: unknown) {
              const errMessage = e instanceof Error ? e.message : String(e)
              await pushResult({
                id: `aes-err-${eName}`,
                algorithm: `AES-GCM-256 (${eName})`,
                testCase: 'Decrypt KAT',
                referenceUrl: REF.aesgcm,
                evidenceTier: deriveEvidenceTier(aesGcmTestVectors._provenance),
                status: 'fail',
                details: errMessage,
              })
              addLog(`[DISCREPANCY] [${eName}] [id:${id1}] AES-GCM: ${errMessage}`)
            }
          }
        }

        // ── 2. HMAC-SHA256 Verify KAT (NIST ACVP, truncated) ───────────────
        if (activeCategories.has('hashing_mac')) {
          currentCategory = 'hashing_mac'
          // WS-7 (2026-08-28): replaced a self-generated (Node-oracle,
          // full-length) vector with a real NIST ACVP-HMAC-SHA2-256 vector.
          // NIST's ACVP-HMAC reference set tests SP 800-107 truncation
          // lengths (this sample tops out at 160 bits, no full 256-bit case
          // exists in it), so this now exercises CKM_SHA256_HMAC_GENERAL
          // (hsm_hmacVerifyGeneral) instead of the exact-length-only
          // CKM_SHA256_HMAC — testing the mechanism the vector is for.
          if (engine.mechs.size > 0 && !engine.mechs.has(CKM_SHA256_HMAC_GENERAL)) {
            await pushSkip(
              `hmac-skip-${eName}`,
              `HMAC-SHA256 (${eName})`,
              'Verify KAT (NIST ACVP, truncated)',
              REF.hmac,
              'HMAC-SHA256-GENERAL: mechanism not supported'
            )
          } else {
            const tv = hmacTestVectors.testGroups[0].tests[0]
            const id2 = `hmac-acvp-${eName}`
            addLog(`[${eName}] Testing HMAC-SHA256 Verify KAT (NIST ACVP tcId=${tv.tcId})...`)
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

              // Verify known MAC against reference (truncated to tv.macLen bits)
              const isValid = hsm_hmacVerifyGeneral(
                M,
                hSession,
                hmacHandle,
                msgBytes,
                macBytes,
                CKM_SHA256_HMAC_GENERAL
              )

              const macHex = toHex(macBytes)
              await pushResult({
                id: id2,
                algorithm: `HMAC-SHA256 (${eName})`,
                testCase: 'Verify KAT (NIST ACVP, truncated)',
                referenceUrl: REF.hmac,
                evidenceTier: deriveEvidenceTier(hmacTestVectors._provenance),
                status: isValid ? 'pass' : 'fail',
                details: isValid
                  ? `MAC[${macBytes.length}B, ${tv.macLen}-bit truncated] verified: ${macHex}`
                  : 'MAC verification failed against NIST ACVP vector',
              })
              addLog(
                `[${eName}] [id:${id2}] HMAC-SHA256 Verify KAT: ${isValid ? 'PASS' : 'FAIL'} | MAC: ${macHex}`
              )
            } catch (e: unknown) {
              const errMessage = e instanceof Error ? e.message : String(e)
              await pushResult({
                id: `hmac-err-${eName}`,
                algorithm: `HMAC-SHA256 (${eName})`,
                testCase: 'Verify KAT (NIST ACVP, truncated)',
                referenceUrl: REF.hmac,
                evidenceTier: deriveEvidenceTier(hmacTestVectors._provenance),
                status: 'fail',
                details: errMessage,
              })
              addLog(`[DISCREPANCY] [${eName}] [id:${id2}] HMAC-SHA256: ${errMessage}`)
            }
          }
        }

        // ── 3. RSA-PSS-2048 SigVer KAT (FIPS 186-5) ────────────────────
        if (activeCategories.has('classical')) {
          currentCategory = 'classical'
          if (engine.mechs.size > 0 && !engine.mechs.has(CKM_SHA256_RSA_PKCS_PSS)) {
            await pushSkip(
              `rsa-skip-${eName}`,
              `RSA-PSS-2048 (${eName})`,
              'SigVer KAT',
              REF.rsapss,
              'RSA-PSS-2048: mechanism not supported'
            )
          } else {
            const tv = rsaPssTestVectors.testGroups[0].tests[0]
            const id3 = `rsa-acvp-${eName}`
            addLog(`[${eName}] Testing RSA-PSS-2048 SigVer KAT (FIPS 186-5)...`)
            addLog(`  ACVP Modulus: ${tv.n.slice(0, 32)}… | Exp: ${tv.e}`)
            addLog(
              `  ACVP Signature: ${tv.signature.slice(0, 32)}… | Msg: "${tv.msg.slice(0, 40)}"`
            )
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
              await pushResult({
                id: id3,
                algorithm: `RSA-PSS-2048 (${eName})`,
                testCase: 'SigVer KAT',
                referenceUrl: REF.rsapss,
                status: isValid ? 'pass' : 'fail',
                details: isValid
                  ? `Verified sig[${sigBytes.length}B]: ${rsaSigHex}…`
                  : 'Signature verification failed against FIPS 186-5 vector',
                evidenceTier: deriveEvidenceTier(rsaPssTestVectors._provenance),
              })
              addLog(
                `[${eName}] [id:${id3}] RSA-PSS SigVer KAT: ${isValid ? 'PASS' : 'FAIL'} | sig[0:16]: ${rsaSigHex}…`
              )
            } catch (e: unknown) {
              const errMessage = e instanceof Error ? e.message : String(e)
              await pushResult({
                id: `rsa-err-${eName}`,
                algorithm: `RSA-PSS-2048 (${eName})`,
                testCase: 'SigVer KAT',
                referenceUrl: REF.rsapss,
                evidenceTier: deriveEvidenceTier(rsaPssTestVectors._provenance),
                status: 'fail',
                details: errMessage,
              })
              addLog(`[DISCREPANCY] [${eName}] [id:${id3}] RSA-PSS-2048: ${errMessage}`)
            }
          }

          // ── 4. ECDSA P-256 SigVer KAT (FIPS 186-5) ─────────────────────
          if (engine.mechs.size > 0 && !engine.mechs.has(CKM_ECDSA_SHA256)) {
            await pushSkip(
              `ecdsa-skip-${eName}`,
              `ECDSA P-256 (${eName})`,
              'SigVer KAT',
              REF.ecdsa,
              'ECDSA P-256: mechanism not supported'
            )
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

              await pushResult({
                id: id4,
                algorithm: `ECDSA P-256 (${eName})`,
                testCase: 'SigVer KAT (RFC 6979 §A.2.5)',
                referenceUrl: REF.ecdsa,
                status: isValid ? 'pass' : 'fail',
                details: isValid
                  ? `Verified sig[${sigBytes.length}B]: ${ecSigHex}…`
                  : 'Signature verification failed against FIPS 186-5 vector',
                evidenceTier: deriveEvidenceTier(ecdsaTestVectors._provenance),
              })
              addLog(
                `[${eName}] [id:${id4}] ECDSA P-256 SigVer KAT: ${isValid ? 'PASS' : 'FAIL'} | sig[0:16]: ${ecSigHex}…`
              )
            } catch (e: unknown) {
              const errMessage = e instanceof Error ? e.message : String(e)
              await pushResult({
                id: `ecdsa-err-${eName}`,
                algorithm: `ECDSA P-256 (${eName})`,
                testCase: 'SigVer KAT',
                referenceUrl: REF.ecdsa,
                evidenceTier: deriveEvidenceTier(ecdsaTestVectors._provenance),
                status: 'fail',
                details: errMessage,
              })
              addLog(`[DISCREPANCY] [${eName}] [id:${id4}] ECDSA: ${errMessage}`)
            }
          }
        }

        // ── 5. ML-DSA SigVer KAT (FIPS 204) ─────────────────────────────
        if (activeCategories.has('ml_dsa')) {
          currentCategory = 'ml_dsa'
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

              await pushResult({
                id: id5,
                algorithm: `${algo} (${eName})`,
                testCase: 'SigVer KAT',
                referenceUrl: REF.mldsa,
                evidenceTier: deriveEvidenceTier(mldsaTestVectors._provenance),
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
              await pushResult({
                id: `mldsa-err-${algo}-${eName}`,
                algorithm: `${algo} (${eName})`,
                testCase: 'SigVer KAT',
                referenceUrl: REF.mldsa,
                evidenceTier: deriveEvidenceTier(mldsaTestVectors._provenance),
                status: 'fail',
                details: errorMessage,
              })
              addLog(`[DISCREPANCY] [${eName}] [id:${id5}] ${algo} SigVer Error: ${errorMessage}`)
            }
          }

          // ── 5b. ML-DSA extended-mode SigVer KAT (FIPS 204 §5.2/§5.4, PKCS#11
          // v3.2 HashML-DSA) — context string + pre-hash, NIST ACVP tr1 vectors.
          // Until 2026-08-24 no KAT here exercised a non-empty context string or
          // any HashML-DSA pre-hash mechanism — every ML-DSA case above used
          // context="" and CKM_ML_DSA only. Deterministic-mode and External-Mu
          // remain open — see mldsa_extended_test.json's own _provenance block
          // for exactly why (both need engine-side work beyond a wasm binding).
          for (const [paramSet, tv] of Object.entries(mldsaExtendedTestVectors.context)) {
            const variantNum = parseInt(paramSet.split('-')[2]) as 44 | 65 | 87
            const id5b = `mldsa-ctx-sigver-${paramSet}-${eName}`
            addLog(
              `[${eName}] Testing ${paramSet} SigVer with context (FIPS 204 §5.2, tcId=${tv.tcId})...`
            )
            try {
              const pubHandle = hsm_importMLDSAPublicKey(M, hSession, variantNum, hexToBytes(tv.pk))
              regKey({
                handle: pubHandle,
                family: 'ml-dsa',
                role: 'public',
                label: `ACVP ${paramSet} Context KAT Public (${eName})`,
                variant: String(variantNum),
                engine: engineId,
              })
              const isValid = hsm_verifyBytesMLDSA(
                M,
                hSession,
                pubHandle,
                hexToBytes(tv.message),
                hexToBytes(tv.signature),
                { context: hexToBytes(tv.context) }
              )
              await pushResult({
                id: id5b,
                algorithm: `${paramSet} (${eName})`,
                testCase: `SigVer KAT (context, ${tv.context.length / 2}B)`,
                referenceUrl: REF.mldsa,
                evidenceTier: deriveEvidenceTier(mldsaExtendedTestVectors._provenance),
                status: isValid ? 'pass' : 'fail',
                details: isValid ? 'NIST vector verified with non-empty context' : 'verify=false',
              })
              addLog(
                `[${eName}] [id:${id5b}] ${paramSet} context SigVer: ${isValid ? 'PASS' : 'FAIL'}`
              )
            } catch (err: unknown) {
              const errorMessage = err instanceof Error ? err.message : 'Unknown error'
              await pushResult({
                id: `mldsa-ctx-err-${paramSet}-${eName}`,
                algorithm: `${paramSet} (${eName})`,
                testCase: 'SigVer KAT (context)',
                referenceUrl: REF.mldsa,
                evidenceTier: deriveEvidenceTier(mldsaExtendedTestVectors._provenance),
                status: 'fail',
                details: errorMessage,
              })
              addLog(
                `[DISCREPANCY] [${eName}] [id:${id5b}] ${paramSet} context SigVer: ${errorMessage}`
              )
            }
          }

          for (const [paramSet, tv] of Object.entries(mldsaExtendedTestVectors.preHash)) {
            const variantNum = parseInt(paramSet.split('-')[2]) as 44 | 65 | 87
            const id5c = `mldsa-prehash-sigver-${paramSet}-${eName}`
            addLog(
              `[${eName}] Testing ${paramSet} HashML-DSA SigVer (${tv.hashAlg}, tcId=${tv.tcId})...`
            )
            try {
              const pubHandle = hsm_importMLDSAPublicKey(M, hSession, variantNum, hexToBytes(tv.pk))
              regKey({
                handle: pubHandle,
                family: 'ml-dsa',
                role: 'public',
                label: `ACVP ${paramSet} HashML-DSA KAT Public (${eName})`,
                variant: String(variantNum),
                engine: engineId,
              })
              const isValid = hsm_verifyBytesMLDSA(
                M,
                hSession,
                pubHandle,
                hexToBytes(tv.message),
                hexToBytes(tv.signature),
                {
                  context: tv.context ? hexToBytes(tv.context) : undefined,
                  preHash: tv.hashAlg as MLDSAPreHash,
                }
              )
              await pushResult({
                id: id5c,
                algorithm: `${paramSet} (${eName})`,
                testCase: `HashML-DSA SigVer KAT (${tv.hashAlg})`,
                referenceUrl: REF.mldsa,
                evidenceTier: deriveEvidenceTier(mldsaExtendedTestVectors._provenance),
                status: isValid ? 'pass' : 'fail',
                details: isValid ? `NIST HashML-DSA/${tv.hashAlg} vector verified` : 'verify=false',
              })
              addLog(
                `[${eName}] [id:${id5c}] ${paramSet} HashML-DSA/${tv.hashAlg} SigVer: ${isValid ? 'PASS' : 'FAIL'}`
              )
            } catch (err: unknown) {
              const errorMessage = err instanceof Error ? err.message : 'Unknown error'
              await pushResult({
                id: `mldsa-prehash-err-${paramSet}-${eName}`,
                algorithm: `${paramSet} (${eName})`,
                testCase: 'HashML-DSA SigVer KAT',
                referenceUrl: REF.mldsa,
                evidenceTier: deriveEvidenceTier(mldsaExtendedTestVectors._provenance),
                status: 'fail',
                details: errorMessage,
              })
              addLog(
                `[DISCREPANCY] [${eName}] [id:${id5c}] ${paramSet} HashML-DSA SigVer: ${errorMessage}`
              )
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
              const isValid = hsm_verify(
                M,
                hSession,
                mldsaPair.pubHandle,
                'ACVP NIST PQC test',
                sig
              )
              if (isValid) {
                const signHex = toHex(sig, 16)
                await pushResult({
                  id: id6,
                  algorithm: `${dsaAlgo} (${eName})`,
                  testCase: 'Functional Sign+Verify',
                  referenceUrl: REF.mldsa,
                  status: 'pass',
                  details: `sig[${sig.length}B]: ${signHex}…`,
                })
                addLog(
                  `[${eName}] [id:${id6}] ${dsaAlgo} Functional: PASS | sig[0:16]: ${signHex}…`
                )
              } else {
                throw new Error('Signature verification failed on own signature')
              }
            } catch (e: unknown) {
              const errMessage = e instanceof Error ? e.message : String(e)
              await pushResult({
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
        }

        // ── 7. ML-KEM Decapsulation KAT (FIPS 203) ──────────────────────
        if (activeCategories.has('ml_kem')) {
          currentCategory = 'ml_kem'
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
                await pushResult({
                  id: id7,
                  algorithm: `${algo} (${eName})`,
                  testCase: 'Decapsulate KAT',
                  referenceUrl: REF.mlkem,
                  evidenceTier: deriveEvidenceTier(mlkemTestVectors._provenance),
                  status: 'pass',
                  details: `SS[${recoveredSs.length}B]: ${ssHex}`,
                })
                addLog(`[${eName}] [id:${id7}] ${algo} Decapsulate: PASS | SS: ${ssHex}`)
              } else {
                const gotHex = Array.from(recoveredSs.slice(0, 16))
                  .map((b: number) => b.toString(16).padStart(2, '0'))
                  .join('')
                const expHex = Array.from(expectedSsBytes.slice(0, 16))
                  .map((b: number) => b.toString(16).padStart(2, '0'))
                  .join('')
                await pushResult({
                  id: id7,
                  algorithm: `${algo} (${eName})`,
                  testCase: 'Decapsulate KAT',
                  referenceUrl: REF.mlkem,
                  evidenceTier: deriveEvidenceTier(mlkemTestVectors._provenance),
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
              await pushResult({
                id: `test-${algo}-err-${eName}`,
                algorithm: `${algo} (${eName})`,
                testCase: 'Decapsulate KAT',
                referenceUrl: REF.mlkem,
                evidenceTier: deriveEvidenceTier(mlkemTestVectors._provenance),
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
                await pushResult({
                  id: id8,
                  algorithm: `${kemAlgo} (${eName})`,
                  testCase: 'Encap+Decap Round-Trip',
                  referenceUrl: REF.mlkem,
                  status: 'pass',
                  details: `SS[${encapSs.length}B]: ${ssHex} | ct=${ciphertextBytes.length}B`,
                })
                addLog(`[${eName}] [id:${id8}] ${kemAlgo} Round-Trip: PASS | SS: ${ssHex}`)
              } else {
                await pushResult({
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
              await pushResult({
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
        }

        // ── 9. SLH-DSA Functional Sign+Verify (FIPS 205) — all 12 sets ──
        if (activeCategories.has('slh_stateful')) {
          currentCategory = 'slh_stateful'
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
              const sigBytes = hsm_slhdsaSign(
                M,
                hSession,
                privHandle,
                'ACVP SLH-DSA functional test'
              )
              const isValid = hsm_slhdsaVerify(
                M,
                hSession,
                pubHandle,
                'ACVP SLH-DSA functional test',
                sigBytes
              )
              if (isValid) {
                const sigHex = toHex(sigBytes, 16)
                await pushResult({
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
              await pushResult({
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

          // ── 9b. SLH-DSA SigVer KAT (FIPS 205) — NIST ACVP vectors, all 12 sets ──
          // True known-answer test: import the NIST public key and verify the
          // embedded signature over the binary message+context, asserting the
          // result matches the vector's testPassed. (The functional test above
          // only proves self-consistency; this proves FIPS-205 conformance.)
          // Until 2026-08-24 this only covered SLH-DSA-SHA2-128f (1 of 12 sets);
          // the other 11 had no vector-backed check at all, only the functional
          // round-trip above — see WS-6/H-4 remediation.
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
            const tv = (
              slhdsaCtxTestVectors.sigVer as Record<
                string,
                (typeof slhdsaCtxTestVectors.sigVer)['SLH-DSA-SHA2-128f']
              >
            )[slhParam.name]
            const id9b = `slhdsa-sigver-kat-${slhParam.name}-${eName}`
            addLog(
              `[${eName}] Testing ${tv.parameterSet} SigVer KAT (FIPS 205, NIST ACVP tcId=${tv.tcId})...`
            )
            addLog(
              `  ACVP PK: ${tv.pk.slice(0, 32)}… | ctx[${tv.context.length / 2}B] | Sig[${tv.signature.length / 2}B]`
            )
            try {
              const pkBytes = hexToBytes(tv.pk)
              const msgBytes = hexToBytes(tv.message)
              const ctxBytes = hexToBytes(tv.context)
              const sigBytes = hexToBytes(tv.signature)

              const pubHandle = hsm_importSLHDSAPublicKey(M, hSession, slhParam.ckp, pkBytes)
              regKey({
                handle: pubHandle,
                family: 'slh-dsa',
                role: 'public',
                label: `ACVP ${tv.parameterSet} KAT Public (${eName})`,
                engine: engineId,
              })

              const isValid = hsm_slhdsaVerifyBytes(M, hSession, pubHandle, msgBytes, sigBytes, {
                context: ctxBytes,
              })
              const pass = isValid === tv.testPassed
              newResults.push({
                id: id9b,
                algorithm: `${tv.parameterSet} (${eName})`,
                testCase: 'SigVer KAT (NIST ACVP)',
                referenceUrl: REF.slhdsa,
                evidenceTier: deriveEvidenceTier(slhdsaCtxTestVectors._provenance),
                status: pass ? 'pass' : 'fail',
                details: pass
                  ? `NIST vector: verify=${isValid} matches testPassed=${tv.testPassed} ✓`
                  : `verify=${isValid}, expected testPassed=${tv.testPassed}`,
                category: currentCategory,
              })
              addLog(
                `[${eName}] [id:${id9b}] ${tv.parameterSet} SigVer KAT: ${pass ? 'PASS' : 'FAIL'} | verify=${isValid}`
              )
            } catch (e: unknown) {
              const errMessage = e instanceof Error ? e.message : String(e)
              newResults.push({
                id: `slhdsa-sigver-kat-err-${slhParam.name}-${eName}`,
                algorithm: `${tv.parameterSet} (${eName})`,
                testCase: 'SigVer KAT (NIST ACVP)',
                referenceUrl: REF.slhdsa,
                evidenceTier: deriveEvidenceTier(slhdsaCtxTestVectors._provenance),
                status: 'fail',
                details: errMessage,
                category: currentCategory,
              })
              addLog(`[DISCREPANCY] [${eName}] [id:${id9b}] SLH-DSA SigVer KAT: ${errMessage}`)
            }
          }
        }

        // ── 10. SHA-256 Digest KAT (FIPS 180-4) ─────────────────────────
        if (activeCategories.has('hashing_mac')) {
          currentCategory = 'hashing_mac'
          if (engine.mechs.size > 0 && !engine.mechs.has(CKM_SHA256)) {
            await pushSkip(
              `sha256-skip-${eName}`,
              `SHA-256 (${eName})`,
              'Digest KAT',
              REF.sha256,
              'SHA-256 Digest: mechanism not supported'
            )
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
                await pushResult({
                  id: id10,
                  algorithm: `SHA-256 (${eName})`,
                  testCase: `Digest KAT tc=${test.tcId}`,
                  referenceUrl: REF.sha256,
                  evidenceTier: deriveEvidenceTier(sha256TestVectors._provenance),
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
                await pushResult({
                  id: `sha256-tc${test.tcId}-err-${eName}`,
                  algorithm: `SHA-256 (${eName})`,
                  testCase: `Digest KAT tc=${test.tcId}`,
                  referenceUrl: REF.sha256,
                  evidenceTier: deriveEvidenceTier(sha256TestVectors._provenance),
                  status: 'fail',
                  details: errMessage,
                })
                addLog(
                  `[DISCREPANCY] [${eName}] [id:${id10}] SHA-256 tc=${test.tcId}: ${errMessage}`
                )
              }
            }
          }

          // ── 10b–10e. SHA-384/512, SHA3-256/512 Digest KAT (NIST ACVP) ──────
          // WS-12 (2026-08-28): these 4 vector files already carried a real
          // NIST ACVP _provenance block but were never imported anywhere
          // (dead files, found while wiring WS-8's evidence tier) — wired in
          // now, mirroring item 10's SHA-256 pattern exactly.
          for (const { name, mech, ref, vectors, prefix } of [
            {
              name: 'SHA-384',
              mech: CKM_SHA384,
              ref: REF.sha384,
              vectors: sha384TestVectors,
              prefix: 'sha384',
            },
            {
              name: 'SHA-512',
              mech: CKM_SHA512,
              ref: REF.sha512,
              vectors: sha512TestVectors,
              prefix: 'sha512',
            },
            {
              name: 'SHA3-256',
              mech: CKM_SHA3_256,
              ref: REF.sha3_256,
              vectors: sha3_256TestVectors,
              prefix: 'sha3-256',
            },
            {
              name: 'SHA3-512',
              mech: CKM_SHA3_512,
              ref: REF.sha3_512,
              vectors: sha3_512TestVectors,
              prefix: 'sha3-512',
            },
          ] as const) {
            if (engine.mechs.size > 0 && !engine.mechs.has(mech)) {
              await pushSkip(
                `${prefix}-skip-${eName}`,
                `${name} (${eName})`,
                'Digest KAT (NIST ACVP)',
                ref,
                `${name} Digest: mechanism not supported`
              )
              continue
            }
            for (const test of vectors.testGroups[0].tests) {
              const idDigest = `${prefix}-tc${test.tcId}-${eName}`
              addLog(`[${eName}] Testing ${name} Digest KAT tc=${test.tcId} (NIST ACVP)...`)
              try {
                const msgBytes = hexToBytes(test.msg)
                const expectedMd = hexToBytes(test.md)
                const digest = hsm_digest(M, hSession, msgBytes, mech)

                const matches =
                  digest.length === expectedMd.length &&
                  // eslint-disable-next-line security/detect-object-injection
                  digest.every((b: number, i: number) => b === expectedMd[i])

                const mdHex = toHex(digest)
                await pushResult({
                  id: idDigest,
                  algorithm: `${name} (${eName})`,
                  testCase: `Digest KAT tc=${test.tcId}`,
                  referenceUrl: ref,
                  evidenceTier: deriveEvidenceTier(vectors._provenance),
                  status: matches ? 'pass' : 'fail',
                  details: matches
                    ? `MD[${digest.length}B]: ${mdHex}`
                    : `MD mismatch: got ${toHex(digest, 8)}… expected ${toHex(expectedMd, 8)}…`,
                })
                addLog(
                  `[${eName}] [id:${idDigest}] ${name} tc=${test.tcId}: ${matches ? 'PASS' : 'FAIL'} | MD: ${mdHex}`
                )
              } catch (e: unknown) {
                const errMessage = e instanceof Error ? e.message : String(e)
                await pushResult({
                  id: `${prefix}-tc${test.tcId}-err-${eName}`,
                  algorithm: `${name} (${eName})`,
                  testCase: `Digest KAT tc=${test.tcId}`,
                  referenceUrl: ref,
                  evidenceTier: deriveEvidenceTier(vectors._provenance),
                  status: 'fail',
                  details: errMessage,
                })
                addLog(
                  `[DISCREPANCY] [${eName}] [id:${idDigest}] ${name} tc=${test.tcId}: ${errMessage}`
                )
              }
            }
          }
        }

        // ── 11. AES-CBC-256 Decrypt KAT (NIST ACVP-AES-CBC) ────────────────
        if (activeCategories.has('symmetric')) {
          currentCategory = 'symmetric'
          // WS-7 (2026-08-28): replaced a self-generated (Node-oracle,
          // PKCS#7-padded) vector with a real NIST ACVP-AES-CBC-256 MMT vector
          // (tgId 30, tcId 2129). NIST's ACVP-AES-CBC algorithm is a raw
          // block-cipher KAT with no padding, so this now exercises
          // CKM_AES_CBC (hsm_aesDecrypt's 'cbc-raw' mode) rather than
          // CKM_AES_CBC_PAD — testing the actual mechanism the vector is for,
          // not re-padding the vector to fit the previously-tested mechanism.
          if (engine.mechs.size > 0 && !engine.mechs.has(CKM_AES_CBC)) {
            await pushSkip(
              `aescbc-skip-${eName}`,
              `AES-CBC-256 (${eName})`,
              'Decrypt KAT (NIST ACVP)',
              REF.aescbc,
              'AES-CBC-256: mechanism not supported'
            )
          } else {
            const tv = aesCbcTestVectors.testGroups[0].tests[0]
            const id11 = `aescbc-acvp-${eName}`
            addLog(`[${eName}] Testing AES-CBC-256 Decrypt KAT (NIST ACVP tcId=${tv.tcId})...`)
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

              const recoveredPt = hsm_aesDecrypt(
                M,
                hSession,
                aesHandle,
                ctBytes,
                ivBytes,
                'cbc-raw'
              )
              const matches =
                recoveredPt.length === expectedPt.length &&
                // eslint-disable-next-line security/detect-object-injection
                recoveredPt.every((b: number, i: number) => b === expectedPt[i])

              const ptHex = toHex(recoveredPt)
              await pushResult({
                id: id11,
                algorithm: `AES-CBC-256 (${eName})`,
                testCase: 'Decrypt KAT (NIST ACVP)',
                referenceUrl: REF.aescbc,
                evidenceTier: deriveEvidenceTier(aesCbcTestVectors._provenance),
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
              await pushResult({
                id: `aescbc-err-${eName}`,
                algorithm: `AES-CBC-256 (${eName})`,
                testCase: 'Decrypt KAT (NIST ACVP)',
                referenceUrl: REF.aescbc,
                evidenceTier: deriveEvidenceTier(aesCbcTestVectors._provenance),
                status: 'fail',
                details: errMessage,
              })
              addLog(`[DISCREPANCY] [${eName}] [id:${id11}] AES-CBC: ${errMessage}`)
            }
          }

          // ── 12. AES-CTR-256 Decrypt KAT (SP 800-38A) ──────────────────────
          if (engine.mechs.size > 0 && !engine.mechs.has(CKM_AES_CTR)) {
            await pushSkip(
              `aesctr-skip-${eName}`,
              `AES-CTR-256 (${eName})`,
              'Decrypt KAT',
              REF.aesctr,
              'AES-CTR-256: mechanism not supported'
            )
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
              await pushResult({
                id: id12,
                algorithm: `AES-CTR-256 (${eName})`,
                testCase: 'Decrypt KAT (NIST SP 800-38A F.5.6)',
                referenceUrl: REF.aesctr,
                status: matches ? 'pass' : 'fail',
                details: matches
                  ? `PT[${recoveredPt.length}B]: ${ptHex}`
                  : `PT mismatch: got ${recoveredPt.length}B, expected ${expectedPt.length}B`,
                evidenceTier: deriveEvidenceTier(aesCtrTestVectors._provenance),
              })
              addLog(
                `[${eName}] [id:${id12}] AES-CTR Decrypt KAT: ${matches ? 'PASS' : 'FAIL'} | PT: ${ptHex}`
              )
            } catch (e: unknown) {
              const errMessage = e instanceof Error ? e.message : String(e)
              await pushResult({
                id: `aesctr-err-${eName}`,
                algorithm: `AES-CTR-256 (${eName})`,
                testCase: 'Decrypt KAT',
                referenceUrl: REF.aesctr,
                evidenceTier: deriveEvidenceTier(aesCtrTestVectors._provenance),
                status: 'fail',
                details: errMessage,
              })
              addLog(`[DISCREPANCY] [${eName}] [id:${id12}] AES-CTR: ${errMessage}`)
            }
          }
        }

        // ── 13. HMAC-SHA384 Verify KAT (NIST ACVP, truncated) ──────────────
        if (activeCategories.has('hashing_mac')) {
          currentCategory = 'hashing_mac'
          // WS-7 (2026-08-28): see the HMAC-SHA256 block's comment above for
          // why this uses CKM_SHA384_HMAC_GENERAL rather than CKM_SHA384_HMAC.
          if (engine.mechs.size > 0 && !engine.mechs.has(CKM_SHA384_HMAC_GENERAL)) {
            await pushSkip(
              `hmac384-skip-${eName}`,
              `HMAC-SHA384 (${eName})`,
              'Verify KAT (NIST ACVP, truncated)',
              REF.hmac,
              'HMAC-SHA384-GENERAL: mechanism not supported'
            )
          } else {
            const tv = hmac384TestVectors.testGroups[0].tests[0]
            const id13 = `hmac384-acvp-${eName}`
            addLog(`[${eName}] Testing HMAC-SHA384 Verify KAT (NIST ACVP tcId=${tv.tcId})...`)
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

              const isValid = hsm_hmacVerifyGeneral(
                M,
                hSession,
                hmacHandle,
                msgBytes,
                macBytes,
                CKM_SHA384_HMAC_GENERAL
              )
              const macHex = toHex(macBytes)
              await pushResult({
                id: id13,
                algorithm: `HMAC-SHA384 (${eName})`,
                testCase: 'Verify KAT (NIST ACVP, truncated)',
                referenceUrl: REF.hmac,
                evidenceTier: deriveEvidenceTier(hmac384TestVectors._provenance),
                status: isValid ? 'pass' : 'fail',
                details: isValid
                  ? `MAC[${macBytes.length}B, ${tv.macLen}-bit truncated] verified: ${macHex}`
                  : 'MAC verification failed against NIST ACVP vector',
              })
              addLog(
                `[${eName}] [id:${id13}] HMAC-SHA384 Verify KAT: ${isValid ? 'PASS' : 'FAIL'} | MAC: ${macHex}`
              )
            } catch (e: unknown) {
              const errMessage = e instanceof Error ? e.message : String(e)
              await pushResult({
                id: `hmac384-err-${eName}`,
                algorithm: `HMAC-SHA384 (${eName})`,
                testCase: 'Verify KAT (NIST ACVP, truncated)',
                referenceUrl: REF.hmac,
                evidenceTier: deriveEvidenceTier(hmac384TestVectors._provenance),
                status: 'fail',
                details: errMessage,
              })
              addLog(`[DISCREPANCY] [${eName}] [id:${id13}] HMAC-SHA384: ${errMessage}`)
            }
          }

          // ── 14. HMAC-SHA512 Verify KAT (NIST ACVP, truncated) ──────────────
          // WS-7 (2026-08-28): see the HMAC-SHA256 block's comment above for
          // why this uses CKM_SHA512_HMAC_GENERAL rather than CKM_SHA512_HMAC.
          if (engine.mechs.size > 0 && !engine.mechs.has(CKM_SHA512_HMAC_GENERAL)) {
            await pushSkip(
              `hmac512-skip-${eName}`,
              `HMAC-SHA512 (${eName})`,
              'Verify KAT (NIST ACVP, truncated)',
              REF.hmac,
              'HMAC-SHA512-GENERAL: mechanism not supported'
            )
          } else {
            const tv = hmac512TestVectors.testGroups[0].tests[0]
            const id14 = `hmac512-acvp-${eName}`
            addLog(`[${eName}] Testing HMAC-SHA512 Verify KAT (NIST ACVP tcId=${tv.tcId})...`)
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

              const isValid = hsm_hmacVerifyGeneral(
                M,
                hSession,
                hmacHandle,
                msgBytes,
                macBytes,
                CKM_SHA512_HMAC_GENERAL
              )
              const macHex = toHex(macBytes)
              await pushResult({
                id: id14,
                algorithm: `HMAC-SHA512 (${eName})`,
                testCase: 'Verify KAT (NIST ACVP, truncated)',
                referenceUrl: REF.hmac,
                evidenceTier: deriveEvidenceTier(hmac512TestVectors._provenance),
                status: isValid ? 'pass' : 'fail',
                details: isValid
                  ? `MAC[${macBytes.length}B, ${tv.macLen}-bit truncated] verified: ${macHex}`
                  : 'MAC verification failed against NIST ACVP vector',
              })
              addLog(
                `[${eName}] [id:${id14}] HMAC-SHA512 Verify KAT: ${isValid ? 'PASS' : 'FAIL'} | MAC: ${macHex}`
              )
            } catch (e: unknown) {
              const errMessage = e instanceof Error ? e.message : String(e)
              await pushResult({
                id: `hmac512-err-${eName}`,
                algorithm: `HMAC-SHA512 (${eName})`,
                testCase: 'Verify KAT (NIST ACVP, truncated)',
                referenceUrl: REF.hmac,
                evidenceTier: deriveEvidenceTier(hmac512TestVectors._provenance),
                status: 'fail',
                details: errMessage,
              })
              addLog(`[DISCREPANCY] [${eName}] [id:${id14}] HMAC-SHA512: ${errMessage}`)
            }
          }
        }

        // ── 15. ECDSA P-384 SigVer KAT (FIPS 186-5) ──────────────────────
        if (activeCategories.has('classical')) {
          currentCategory = 'classical'
          if (engine.mechs.size > 0 && !engine.mechs.has(CKM_ECDSA_SHA384)) {
            await pushSkip(
              `ecdsa384-skip-${eName}`,
              `ECDSA P-384 (${eName})`,
              'SigVer KAT',
              REF.ecdsa,
              'ECDSA P-384: mechanism not supported'
            )
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
              await pushResult({
                id: id15,
                algorithm: `ECDSA P-384 (${eName})`,
                testCase: 'SigVer KAT (RFC 6979 §A.2.6)',
                referenceUrl: REF.ecdsa,
                status: isValid ? 'pass' : 'fail',
                details: isValid
                  ? `Verified sig[${sigBytes.length}B]: ${ecSigHex}…`
                  : 'Signature verification failed against FIPS 186-5 vector',
                evidenceTier: deriveEvidenceTier(ecdsaP384TestVectors._provenance),
              })
              addLog(
                `[${eName}] [id:${id15}] ECDSA P-384 SigVer KAT: ${isValid ? 'PASS' : 'FAIL'} | sig: ${ecSigHex}…`
              )
            } catch (e: unknown) {
              const errMessage = e instanceof Error ? e.message : String(e)
              await pushResult({
                id: `ecdsa384-err-${eName}`,
                algorithm: `ECDSA P-384 (${eName})`,
                testCase: 'SigVer KAT',
                referenceUrl: REF.ecdsa,
                evidenceTier: deriveEvidenceTier(ecdsaP384TestVectors._provenance),
                status: 'fail',
                details: errMessage,
              })
              addLog(`[DISCREPANCY] [${eName}] [id:${id15}] ECDSA P-384: ${errMessage}`)
            }
          }

          // ── 16. EdDSA Ed25519 SigVer KAT (RFC 8032) ──────────────────────
          if (engine.mechs.size > 0 && !engine.mechs.has(CKM_EDDSA)) {
            await pushSkip(
              `eddsa-sigver-skip-${eName}`,
              `EdDSA Ed25519 (${eName})`,
              'SigVer KAT',
              REF.eddsa,
              'EdDSA Ed25519: mechanism not supported'
            )
          } else {
            const edTv = eddsaTestVectors.testGroups[0].tests[0]
            const id16 = `eddsa-sigver-${eName}`
            addLog(`[${eName}] Testing EdDSA Ed25519 SigVer KAT (RFC 8032)...`)
            addLog(`  ACVP PK: ${edTv.pk} | Sig: ${edTv.signature.slice(0, 32)}…`)
            try {
              const pkBytes = hexToBytes(edTv.pk)
              const msgBytes = hexToBytes(edTv.msg)
              const sigBytes = hexToBytes(edTv.signature)

              // Import the RFC 8032 §7.1 public key — verify only
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

              await pushResult({
                id: id16,
                algorithm: `EdDSA Ed25519 (${eName})`,
                testCase: 'SigVer KAT (RFC 8032 §7.1)',
                referenceUrl: REF.eddsa,
                status: isValid ? 'pass' : 'fail',
                details: isValid
                  ? `Verified sig[${sigBytes.length}B]: ${toHex(sigBytes, 16)}…`
                  : 'Signature verification failed against RFC 8032 vector',
                evidenceTier: deriveEvidenceTier(eddsaTestVectors._provenance),
              })
              addLog(
                `[${eName}] [id:${id16}] EdDSA Ed25519 SigVer KAT: ${isValid ? 'PASS' : 'FAIL'}`
              )
            } catch (e: unknown) {
              const errMessage = e instanceof Error ? e.message : String(e)
              await pushResult({
                id: `eddsa-sigver-err-${eName}`,
                algorithm: `EdDSA Ed25519 (${eName})`,
                testCase: 'SigVer KAT',
                referenceUrl: REF.eddsa,
                evidenceTier: deriveEvidenceTier(eddsaTestVectors._provenance),
                status: 'fail',
                details: errMessage,
              })
              addLog(`[DISCREPANCY] [${eName}] [id:${id16}] EdDSA Ed25519: ${errMessage}`)
            }
          }

          // ── 16b. EdDSA Ed448 SigVer KAT (RFC 8032, NIST ACVP) ─────────────
          // New category (D-3): eddsa_ed448_test.json was a dead file with zero
          // importers (G-13/H-6) — no Ed448 signature test existed at all before
          // this, only X448 (Montgomery ECDH) further below.
          //
          // Both engines now implement Ed448 (2026-08-28, pqctoday-hsm PR #185):
          // the Rust engine was Ed25519-only end to end — CKM_EC_EDWARDS_KEY_PAIR_GEN
          // rejected Ed448 with CKR_CURVE_NOT_SUPPORTED, and CKM_EDDSA/_PH hardcoded
          // Ed25519's 32-byte key / 64-byte signature sizes — and this exact test
          // wiring is what surfaced that gap live (the vector itself was already
          // confirmed valid against an independent Node WebCrypto oracle and the
          // C++ engine before the Rust failure was investigated). See
          // rust/CHANGELOG.md's Ed448 entry for the fix.
          if (engine.mechs.size > 0 && !engine.mechs.has(CKM_EDDSA)) {
            await pushSkip(
              `eddsa448-sigver-skip-${eName}`,
              `EdDSA Ed448 (${eName})`,
              'SigVer KAT',
              REF.eddsa,
              'EdDSA Ed448: mechanism not supported'
            )
          } else {
            const edTv448 = eddsaEd448TestVectors.testGroups[0].tests[0]
            const id16b = `eddsa448-sigver-${eName}`
            addLog(`[${eName}] Testing EdDSA Ed448 SigVer KAT (NIST ACVP tcId=${edTv448.tcId})...`)
            addLog(`  ACVP PK: ${edTv448.pk} | Sig: ${edTv448.signature.slice(0, 32)}…`)
            try {
              const pkBytes448 = hexToBytes(edTv448.pk)
              const msgBytes448 = hexToBytes(edTv448.message)
              const sigBytes448 = hexToBytes(edTv448.signature)

              const pubHandle448 = hsm_importEdDSAPublicKey(M, hSession, pkBytes448, 'Ed448')
              regKey({
                handle: pubHandle448,
                family: 'eddsa',
                role: 'public',
                label: `ACVP EdDSA Ed448 Public (${eName})`,
                engine: engineId,
              })

              const isValid448 = hsm_eddsaVerifyBytes(
                M,
                hSession,
                pubHandle448,
                msgBytes448,
                sigBytes448
              )

              await pushResult({
                id: id16b,
                algorithm: `EdDSA Ed448 (${eName})`,
                testCase: 'SigVer KAT (NIST ACVP)',
                referenceUrl: REF.eddsa,
                evidenceTier: deriveEvidenceTier(eddsaEd448TestVectors._provenance),
                status: isValid448 ? 'pass' : 'fail',
                details: isValid448
                  ? `Verified sig[${sigBytes448.length}B]: ${toHex(sigBytes448, 16)}…`
                  : `Signature verification failed against NIST ACVP Ed448 vector on ${eName}.`,
              })
              addLog(
                `[${eName}] [id:${id16b}] EdDSA Ed448 SigVer KAT: ${isValid448 ? 'PASS' : 'FAIL'}`
              )
            } catch (e: unknown) {
              const errMessage = e instanceof Error ? e.message : String(e)
              await pushResult({
                id: `eddsa448-sigver-err-${eName}`,
                algorithm: `EdDSA Ed448 (${eName})`,
                testCase: 'SigVer KAT',
                referenceUrl: REF.eddsa,
                evidenceTier: deriveEvidenceTier(eddsaEd448TestVectors._provenance),
                status: 'fail',
                details: errMessage,
              })
              addLog(`[DISCREPANCY] [${eName}] [id:${id16b}] EdDSA Ed448: ${errMessage}`)
            }
          }
        }

        // ── 17. PBKDF2 Functional Derivation (PKCS#5 v2.1) ────────────────
        if (activeCategories.has('kdf')) {
          currentCategory = 'kdf'
          if (engine.mechs.size > 0 && !engine.mechs.has(CKM_PKCS5_PBKD2)) {
            await pushSkip(
              `pbkdf2-skip-${eName}`,
              `PBKDF2-HMAC-SHA256 (${eName})`,
              'KAT (c=4096)',
              REF.pbkdf2,
              'PBKDF2: mechanism not supported'
            )
          } else {
            const id17 = `pbkdf2-kat-${eName}`
            // WS-7 (2026-08-28): previously hardcoded inline with pbkdf2_test.json
            // sitting unread alongside it (dead file, G-13/H-6-style gap). Now
            // reads from the file — same self-consistency vector (tcId 2,
            // P="password" S="salt" c=4096 dkLen=32), see the file's own
            // _provenance note for why no NIST ACVP vector exists for this PRF.
            const pbkdf2Tv = pbkdf2TestVectors.testGroups[0].tests[1]
            addLog(
              `[${eName}] Testing PBKDF2-HMAC-SHA256 KAT (self-consistency tcId=${pbkdf2Tv.tcId}, c=${pbkdf2Tv.iterations})...`
            )
            try {
              const password = hexToBytes(pbkdf2Tv.password)
              const salt = hexToBytes(pbkdf2Tv.salt)
              const iterations = pbkdf2Tv.iterations
              const keyLen = pbkdf2Tv.dkLen
              const expectedDk = hexToBytes(pbkdf2Tv.dk)

              const derived = hsm_pbkdf2(
                M,
                hSession,
                password,
                salt,
                iterations,
                keyLen,
                CKP_PKCS5_PBKD2_HMAC_SHA256
              )
              const matches =
                derived.length === expectedDk.length &&
                // eslint-disable-next-line security/detect-object-injection
                derived.every((b: number, i: number) => b === expectedDk[i])

              const dkHex = toHex(derived)
              await pushResult({
                id: id17,
                algorithm: `PBKDF2-HMAC-SHA256 (${eName})`,
                testCase: 'KAT (c=4096)',
                referenceUrl: REF.pbkdf2,
                evidenceTier: deriveEvidenceTier(pbkdf2TestVectors._provenance),
                status: matches ? 'pass' : 'fail',
                details: matches
                  ? `DK[${derived.length}B] matches vector ✓: ${dkHex}`
                  : `DK mismatch: got ${toHex(derived, 12)}… expected ${toHex(expectedDk, 12)}…`,
              })
              addLog(
                `[${eName}] [id:${id17}] PBKDF2 KAT: ${matches ? 'PASS' : 'FAIL'} | DK: ${dkHex}`
              )
            } catch (e: unknown) {
              const errMessage = e instanceof Error ? e.message : String(e)
              await pushResult({
                id: `pbkdf2-kat-err-${eName}`,
                algorithm: `PBKDF2-HMAC-SHA256 (${eName})`,
                testCase: 'KAT (c=4096)',
                referenceUrl: REF.pbkdf2,
                evidenceTier: deriveEvidenceTier(pbkdf2TestVectors._provenance),
                status: 'fail',
                details: errMessage,
              })
              addLog(`[DISCREPANCY] [${eName}] [id:${id17}] PBKDF2: ${errMessage}`)
            }
          }

          // ── 18. HKDF Functional Derivation (RFC 5869) ──────────────────────
          if (engine.mechs.size > 0 && !engine.mechs.has(CKM_HKDF_DERIVE)) {
            await pushSkip(
              `hkdf-skip-${eName}`,
              `HKDF-SHA256 (${eName})`,
              'KAT (RFC 5869 A.1)',
              REF.hkdf,
              'HKDF: mechanism not supported'
            )
          } else {
            const id18 = `hkdf-kat-${eName}`
            addLog(`[${eName}] Testing HKDF-SHA256 KAT (RFC 5869 Appendix A.1)...`)
            try {
              // RFC 5869 Appendix A.1 (Test Case 1), Hash = SHA-256.
              const ikm = hexToBytes('0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b') // 22 × 0x0b
              const salt = hexToBytes('000102030405060708090a0b0c') // 13 B
              const info = hexToBytes('f0f1f2f3f4f5f6f7f8f9') // 10 B
              const expectedOkm = hexToBytes(
                '3cb25f25faacd57a90434f64d0362f2a2d2d0a90cf1a5a4c5db02d56ecc4c5bf34007208d5b887185865'
              ) // 42 B
              const keyLen = 42

              const ikmHandle = hsm_importGenericSecret(M, hSession, ikm)
              regKey({
                handle: ikmHandle,
                family: 'kdf',
                role: 'secret',
                label: `ACVP HKDF IKM RFC 5869 (${eName})`,
                engine: engineId,
              })

              const okm = hsm_hkdf(
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
                okm.length === expectedOkm.length &&
                // eslint-disable-next-line security/detect-object-injection
                okm.every((b: number, i: number) => b === expectedOkm[i])

              const dkHex = toHex(okm)
              await pushResult({
                id: id18,
                algorithm: `HKDF-SHA256 (${eName})`,
                testCase: 'KAT (RFC 5869 A.1)',
                referenceUrl: REF.hkdf,
                status: matches ? 'pass' : 'fail',
                details: matches
                  ? `OKM[${okm.length}B] matches RFC 5869 A.1 ✓: ${dkHex}`
                  : `OKM mismatch: got ${toHex(okm, 12)}… expected ${toHex(expectedOkm, 12)}…`,
              })
              addLog(
                `[${eName}] [id:${id18}] HKDF KAT: ${matches ? 'PASS' : 'FAIL'} | OKM: ${dkHex}`
              )
            } catch (e: unknown) {
              const errMessage = e instanceof Error ? e.message : String(e)
              await pushResult({
                id: `hkdf-kat-err-${eName}`,
                algorithm: `HKDF-SHA256 (${eName})`,
                testCase: 'KAT (RFC 5869 A.1)',
                referenceUrl: REF.hkdf,
                status: 'fail',
                details: errMessage,
              })
              addLog(`[DISCREPANCY] [${eName}] [id:${id18}] HKDF: ${errMessage}`)
            }
          }
        }

        // ── 19. AES-KW Wrap KAT (RFC 3394) ────────────────────────────────
        if (activeCategories.has('symmetric')) {
          currentCategory = 'symmetric'
          if (engine.mechs.size > 0 && !engine.mechs.has(CKM_AES_KEY_WRAP)) {
            await pushSkip(
              `aeskw-skip-${eName}`,
              `AES-KW-256 (${eName})`,
              'Wrap KAT',
              REF.aeskw,
              'AES-KW: mechanism not supported'
            )
          } else {
            const tv = aesKwTestVectors.testGroups[0].tests[0]
            const id19 = `aeskw-acvp-${eName}`
            addLog(`[${eName}] Testing AES-KW Wrap KAT (RFC 3394)...`)
            addLog(
              `[${eName}]   KEK: ${tv.kek.slice(0, 32)}… Expected: ${tv.wrapped.slice(0, 32)}…`
            )
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

              const wrapped = hsm_wrapKeyMech(
                M,
                hSession,
                CKM_AES_KEY_WRAP,
                kekHandle,
                targetHandle
              )
              const matches =
                wrapped.length === expectedWrapped.length &&
                // eslint-disable-next-line security/detect-object-injection
                wrapped.every((b: number, i: number) => b === expectedWrapped[i])

              const wrappedHex = toHex(wrapped)
              await pushResult({
                id: id19,
                algorithm: `AES-KW-256 (${eName})`,
                testCase: 'Wrap KAT',
                referenceUrl: REF.aeskw,
                status: matches ? 'pass' : 'fail',
                details: matches
                  ? `Wrapped[${wrapped.length}B]: ${wrappedHex}`
                  : `Mismatch: got ${toHex(wrapped, 8)}… expected ${toHex(expectedWrapped, 8)}…`,
                evidenceTier: deriveEvidenceTier(aesKwTestVectors._provenance),
              })
              addLog(
                `[${eName}] [id:${id19}] AES-KW Wrap KAT: ${matches ? 'PASS' : 'FAIL'} | Wrapped: ${wrappedHex}`
              )
            } catch (e: unknown) {
              const errMessage = e instanceof Error ? e.message : String(e)
              await pushResult({
                id: `aeskw-err-${eName}`,
                algorithm: `AES-KW-256 (${eName})`,
                testCase: 'Wrap KAT',
                referenceUrl: REF.aeskw,
                evidenceTier: deriveEvidenceTier(aesKwTestVectors._provenance),
                status: 'fail',
                details: errMessage,
              })
              addLog(`[DISCREPANCY] [${eName}] [id:${id19}] AES-KW: ${errMessage}`)
            }
          }

          // ── 20. AES-KWP Wrap+Unwrap Round-Trip (RFC 5649) ─────────────────
          if (engine.mechs.size > 0 && !engine.mechs.has(CKM_AES_KEY_WRAP_KWP)) {
            await pushSkip(
              `aeskwp-skip-${eName}`,
              `AES-KWP-256 (${eName})`,
              'Wrap+Unwrap Round-Trip',
              REF.aeskwp,
              'AES-KWP: mechanism not supported'
            )
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

              await pushResult({
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
              await pushResult({
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
        }

        // ── 21. SLH-DSA Context Binding (FIPS 205 §9.2) ───────────────────
        if (activeCategories.has('slh_stateful')) {
          currentCategory = 'slh_stateful'
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
              await pushResult({
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
              await pushResult({
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
              const sig1 = hsm_slhdsaSign(
                M,
                hSession,
                privHandle,
                'ACVP deterministic test',
                detOpts
              )
              const sig2 = hsm_slhdsaSign(
                M,
                hSession,
                privHandle,
                'ACVP deterministic test',
                detOpts
              )
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
              await pushResult({
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
              await pushResult({
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
        }

        // extractMontgomeryPubKey is hoisted up near pushSkip (used by both
        // this category and KDF's §25) — see the comment there.

        // ── 23. X25519 ECDH Round-Trip (RFC 7748) ─────────────────────────
        if (activeCategories.has('classical')) {
          currentCategory = 'classical'
          if (engine.mechs.size > 0 && !engine.mechs.has(CKM_EC_MONTGOMERY_KEY_PAIR_GEN)) {
            await pushSkip(
              `x25519-skip-${eName}`,
              `X25519 ECDH (${eName})`,
              'RFC 7748 §6.1 Round-Trip',
              REF.x25519,
              'X25519: CKM_EC_MONTGOMERY_KEY_PAIR_GEN not in mechanism list'
            )
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

              await pushResult({
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
              await pushResult({
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
            await pushSkip(
              `x448-skip-${eName}`,
              `X448 ECDH (${eName})`,
              'RFC 7748 §6.2 Round-Trip',
              REF.x448,
              'X448: CKM_EC_MONTGOMERY_KEY_PAIR_GEN not in mechanism list'
            )
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

              await pushResult({
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
              await pushResult({
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
        }

        // ── 25. X9.63 KDF with SHA3-256 / SHA3-512 (PKCS#11 v3.2 §5.2.12) ──
        if (activeCategories.has('kdf')) {
          currentCategory = 'kdf'
          if (engine.mechs.size > 0 && !engine.mechs.has(CKM_EC_MONTGOMERY_KEY_PAIR_GEN)) {
            await pushSkip(
              `x963-sha3-kdf-skip-${eName}`,
              `X9.63-KDF (${eName})`,
              'PKCS#11 v3.2 §5.2.12 — SHA3-256 + SHA3-512 bilateral agreement',
              REF.x963kdf,
              'X9.63-SHA3: requires X25519 keygen'
            )
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
              await pushResult({
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
              await pushResult({
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
        }

        // ── 26. ChaCha20-Poly1305 AEAD Encrypt/Decrypt Round-Trip ────────────────────────
        if (activeCategories.has('symmetric')) {
          currentCategory = 'symmetric'
          if (engine.mechs.size > 0 && !engine.mechs.has(CKM_CHACHA20_POLY1305)) {
            await pushSkip(
              `chacha20-skip-${eName}`,
              `ChaCha20-Poly1305 (${eName})`,
              'AEAD Encrypt/Decrypt Round-Trip',
              'https://datatracker.ietf.org/doc/html/rfc8439',
              'ChaCha20-Poly1305: mechanism not supported'
            )
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

              await pushResult({
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
              await pushResult({
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
        }

        // ── 27. SP 800-108 KBKDF Derivation (Counter Mode) ────────────────────────
        if (activeCategories.has('kdf')) {
          currentCategory = 'kdf'
          if (engine.mechs.size > 0 && !engine.mechs.has(CKM_SP800_108_COUNTER_KDF)) {
            await pushSkip(
              `sp800-108-skip-${eName}`,
              `SP 800-108 KBKDF (${eName})`,
              'Counter Mode Derivation',
              'https://csrc.nist.gov/publications/detail/sp/800-108/rev-1/final',
              'SP800-108 KBKDF: mechanism not supported'
            )
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
              // SP 800-108 PRF must be a keyed MAC (PKCS#11 v3.2 §6.42 Table 196),
              // not a bare digest — use CKM_SHA256_HMAC (0x251), not CKM_SHA256 (0x250).
              const derivedKeyBytes = hsm_kbkdf(
                M,
                hSession,
                hBaseKey,
                CKM_SHA256_HMAC,
                fixedInput,
                32
              )

              const pass = derivedKeyBytes.length === 32
              const derivedHex = Array.from(derivedKeyBytes)
                .map((b: number) => b.toString(16).padStart(2, '0'))
                .join('')
              await pushResult({
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
              await pushResult({
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
        }

        // ── 28. Hash-ML-DSA Functional Sign+Verify ────────────────────────
        if (activeCategories.has('ml_dsa')) {
          currentCategory = 'ml_dsa'
          for (const dsaVariant of [44, 65, 87] as const) {
            const dsaAlgo = `Hash-ML-DSA-${dsaVariant} (SHA-512)`
            const id28 = `hash-mldsa-${dsaVariant}-${eName}`
            addLog(`[${eName}] Testing ${dsaAlgo} Functional Sign+Verify...`)
            try {
              const mldsaPair = hsm_generateMLDSAKeyPair(M, hSession, dsaVariant)
              const sig = hsm_sign(M, hSession, mldsaPair.privHandle, 'ACVP PreHash Test', {
                preHash: 'sha512',
              })
              const isValid = hsm_verify(
                M,
                hSession,
                mldsaPair.pubHandle,
                'ACVP PreHash Test',
                sig,
                {
                  preHash: 'sha512',
                }
              )
              if (isValid) {
                await pushResult({
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
              await pushResult({
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
        }

        // ── 29. SP 800-108 KBKDF Derivation (Feedback Mode) ────────────────────────
        if (activeCategories.has('kdf')) {
          currentCategory = 'kdf'
          if (engine.mechs.size > 0 && !engine.mechs.has(CKM_SP800_108_FEEDBACK_KDF)) {
            await pushSkip(
              `sp800-108-feedback-skip-${eName}`,
              `SP 800-108 KBKDF (${eName})`,
              'Feedback Mode Derivation',
              'https://csrc.nist.gov/publications/detail/sp/800-108/rev-1/final',
              'SP800-108 KBKDF Feedback: mechanism not supported'
            )
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
                CKM_SHA256_HMAC,
                fixedInput,
                ivBytes,
                32
              )

              const pass = derivedKeyBytes.length === 32
              const derivedHex = Array.from(derivedKeyBytes)
                .map((b: number) => b.toString(16).padStart(2, '0'))
                .join('')
              await pushResult({
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
              await pushResult({
                id: `sp800-108-feedback-err-${eName}`,
                algorithm: `SP 800-108 KBKDF (${eName})`,
                testCase: 'Feedback Mode Derivation',
                referenceUrl: 'https://csrc.nist.gov/publications/detail/sp/800-108/rev-1/final',
                status: 'fail',
                details: errMessage,
              })
              addLog(
                `[DISCREPANCY] [${eName}] [id:${id29}] SP800-108 KBKDF Feedback: ${errMessage}`
              )
            }
          }
        }

        // ── 30. XMSS Stateful Sign+Verify ────────────────────────
        if (activeCategories.has('slh_stateful')) {
          currentCategory = 'slh_stateful'
          if (engine.mechs.size > 0 && !engine.mechs.has(CKM_XMSS)) {
            await pushSkip(
              `xmss-skip-${eName}`,
              `XMSS (${eName})`,
              'Stateful Sign+Verify',
              'https://csrc.nist.gov/pubs/sp/800/208/final',
              'XMSS: mechanism not supported'
            )
          } else {
            const id30 = `xmss-sig-${eName}`
            addLog(`[${eName}] Testing XMSS Stateful Sign+Verify...`)
            try {
              const xmssPair = hsm_generateXMSSKeyPair(M, hSession, 1) // CKP_XMSS_SHA2_10_256
              const msgBytes = new TextEncoder().encode('ACVP XMSS Test')
              const sig = hsm_statefulSignBytes(
                M,
                hSession,
                CKM_XMSS,
                xmssPair.privHandle,
                msgBytes
              )
              const valid =
                hsm_statefulVerifyBytes(
                  M,
                  hSession,
                  CKM_XMSS,
                  xmssPair.pubHandle,
                  msgBytes,
                  sig
                ) === 0
              if (valid) {
                await pushResult({
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
              await pushResult({
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

          // ── 31. HSS/LMS Stateful Sign+Verify (PKCS#11 v3.2 §6.14, SP 800-208) ──
          // Spec CKM_HSS (0x4033) / CKM_HSS_KEY_PAIR_GEN (0x4032) — was previously
          // gated on a vendor CKM_LMS=0x80000002 the engines never advertise, so the
          // row was silently skipped. NULL keygen params → single-level LMS default.
          if (engine.mechs.size > 0 && !engine.mechs.has(CKM_HSS)) {
            await pushSkip(
              `hss-skip-${eName}`,
              `HSS/LMS (${eName})`,
              'Stateful Sign+Verify',
              'https://csrc.nist.gov/pubs/sp/800/208/final',
              'HSS/LMS: mechanism not supported'
            )
          } else {
            const id31 = `hss-sig-${eName}`
            addLog(`[${eName}] Testing HSS/LMS Stateful Sign+Verify...`)
            try {
              const lmsPair = hsm_generateLMSKeyPair(M, hSession)
              const msgBytes = new TextEncoder().encode('ACVP HSS/LMS Test')
              const sig = hsm_statefulSignBytes(M, hSession, CKM_HSS, lmsPair.privHandle, msgBytes)
              const valid =
                hsm_statefulVerifyBytes(M, hSession, CKM_HSS, lmsPair.pubHandle, msgBytes, sig) ===
                0
              if (valid) {
                await pushResult({
                  id: id31,
                  algorithm: `HSS/LMS (${eName})`,
                  testCase: 'Stateful Sign+Verify',
                  referenceUrl: 'https://csrc.nist.gov/pubs/sp/800/208/final',
                  status: 'pass',
                  details: `sig[${sig.length}B] validated successfully ✓`,
                })
                addLog(`[${eName}] [id:${id31}] HSS/LMS: PASS`)
              } else {
                throw new Error('HSS/LMS signature verification failed')
              }
            } catch (e: unknown) {
              const errMessage = e instanceof Error ? e.message : String(e)
              await pushResult({
                id: `hss-err-${eName}`,
                algorithm: `HSS/LMS (${eName})`,
                testCase: 'Stateful Sign+Verify',
                referenceUrl: 'https://csrc.nist.gov/pubs/sp/800/208/final',
                status: 'fail',
                details: errMessage,
              })
              addLog(`[DISCREPANCY] [${eName}] [id:${id31}] HSS/LMS: ${errMessage}`)
            }
          }
        }

        // ── 32. ECDSA secp256k1 Functional Sign+Verify (SEC 2) ────────────
        if (activeCategories.has('classical')) {
          currentCategory = 'classical'
          if (engine.mechs.size > 0 && !engine.mechs.has(CKM_ECDSA_SHA256)) {
            await pushSkip(
              `ecdsa-k1-skip-${eName}`,
              `ECDSA secp256k1 (${eName})`,
              'Functional Sign+Verify',
              REF.ecdsa,
              'ECDSA secp256k1: mechanism not supported'
            )
          } else {
            const id32 = `ecdsa-k1-func-${eName}`
            addLog(`[${eName}] Testing ECDSA secp256k1 Functional Sign+Verify (SEC 2)...`)
            try {
              const kp = hsm_generateECKeyPair(M, hSession, 'secp256k1', false)
              regKey({
                handle: kp.pubHandle,
                family: 'ecdsa',
                role: 'public',
                label: `ACVP ECDSA secp256k1 Public (${eName})`,
                variant: 'secp256k1',
                engine: engineId,
              })
              regKey({
                handle: kp.privHandle,
                family: 'ecdsa',
                role: 'private',
                label: `ACVP ECDSA secp256k1 Private (${eName})`,
                variant: 'secp256k1',
                engine: engineId,
              })
              const msg = 'ACVP secp256k1 ECDSA-SHA256 round-trip'
              const sig = hsm_ecdsaSign(M, hSession, kp.privHandle, msg, CKM_ECDSA_SHA256)
              const isValid = hsm_ecdsaVerify(M, hSession, kp.pubHandle, msg, sig, CKM_ECDSA_SHA256)
              if (isValid) {
                await pushResult({
                  id: id32,
                  algorithm: `ECDSA secp256k1 (${eName})`,
                  testCase: 'Functional Sign+Verify',
                  referenceUrl: REF.ecdsa,
                  status: 'pass',
                  details: `sig[${sig.length}B]: ${toHex(sig, 16)}…`,
                })
                addLog(`[${eName}] [id:${id32}] ECDSA secp256k1: PASS | sig[${sig.length}B]`)
              } else {
                throw new Error('secp256k1 signature verification failed on own signature')
              }
            } catch (e: unknown) {
              const errMessage = e instanceof Error ? e.message : String(e)
              await pushResult({
                id: `ecdsa-k1-err-${eName}`,
                algorithm: `ECDSA secp256k1 (${eName})`,
                testCase: 'Functional Sign+Verify',
                referenceUrl: REF.ecdsa,
                status: 'fail',
                details: errMessage,
              })
              addLog(`[DISCREPANCY] [${eName}] [id:${id32}] ECDSA secp256k1: ${errMessage}`)
            }
          }

          // ── 33. ECDSA P-521 SigVer KAT (FIPS 186-5, NIST ACVP) ───────────
          if (engine.mechs.size > 0 && !engine.mechs.has(CKM_ECDSA_SHA512)) {
            await pushSkip(
              `ecdsa521-skip-${eName}`,
              `ECDSA P-521 (${eName})`,
              'SigVer KAT',
              REF.ecdsa,
              'ECDSA P-521: mechanism not supported'
            )
          } else {
            const tv33 = ecdsaP521TestVectors.testGroups[0].tests[0]
            const id33 = `ecdsa521-acvp-${eName}`
            addLog(
              `[${eName}] Testing ECDSA P-521 SigVer KAT (FIPS 186-5, NIST ACVP tcId=${tv33.tcId})...`
            )
            addLog(`[${eName}]   Qx: ${tv33.qx.slice(0, 32)}… R: ${tv33.r.slice(0, 32)}…`)
            try {
              const qx = hexToBytes(tv33.qx)
              const qy = hexToBytes(tv33.qy)
              const msgBytes = hexToBytes(tv33.message)
              const rBytes = hexToBytes(tv33.r)
              const sBytes = hexToBytes(tv33.s)
              const sigBytes = new Uint8Array(rBytes.length + sBytes.length)
              sigBytes.set(rBytes)
              sigBytes.set(sBytes, rBytes.length)

              const ecPubHandle = hsm_importECPublicKey(M, hSession, qx, qy, 'P-521')
              regKey({
                handle: ecPubHandle,
                family: 'ecdsa',
                role: 'public',
                label: `ACVP ECDSA P-521 Public (${eName})`,
                variant: 'P-521',
                engine: engineId,
              })

              const isValid = hsm_ecdsaVerifyBytes(
                M,
                hSession,
                ecPubHandle,
                msgBytes,
                sigBytes,
                CKM_ECDSA_SHA512
              )
              const ecSigHex = toHex(sigBytes, 16)
              await pushResult({
                id: id33,
                algorithm: `ECDSA P-521 (${eName})`,
                testCase: 'SigVer KAT (NIST ACVP)',
                referenceUrl: REF.ecdsa,
                evidenceTier: deriveEvidenceTier(ecdsaP521TestVectors._provenance),
                status: isValid ? 'pass' : 'fail',
                details: isValid
                  ? `Verified sig[${sigBytes.length}B]: ${ecSigHex}…`
                  : 'Signature verification failed against FIPS 186-5 NIST ACVP vector',
              })
              addLog(
                `[${eName}] [id:${id33}] ECDSA P-521 SigVer KAT: ${isValid ? 'PASS' : 'FAIL'} | sig: ${ecSigHex}…`
              )
            } catch (e: unknown) {
              const errMessage = e instanceof Error ? e.message : String(e)
              await pushResult({
                id: `ecdsa521-err-${eName}`,
                algorithm: `ECDSA P-521 (${eName})`,
                testCase: 'SigVer KAT',
                referenceUrl: REF.ecdsa,
                evidenceTier: deriveEvidenceTier(ecdsaP521TestVectors._provenance),
                status: 'fail',
                details: errMessage,
              })
              addLog(`[DISCREPANCY] [${eName}] [id:${id33}] ECDSA P-521: ${errMessage}`)
            }
          }

          // ── 34. ECDH P-521 Key Agreement Round-Trip (SP 800-56A) ─────────
          if (engine.mechs.size > 0 && !engine.mechs.has(CKM_ECDSA_SHA512)) {
            await pushSkip(
              `ecdh521-skip-${eName}`,
              `ECDH P-521 (${eName})`,
              'Key Agreement Round-Trip',
              REF.ecdsa,
              'ECDH P-521: mechanism not supported'
            )
          } else {
            const id34 = `ecdh521-rt-${eName}`
            addLog(`[${eName}] Testing ECDH P-521 Key Agreement Round-Trip (SP 800-56A)...`)
            try {
              // Generate two P-521 key pairs (derive-enabled)
              const kpA = hsm_generateECKeyPair(M, hSession, 'P-521', true)
              const kpB = hsm_generateECKeyPair(M, hSession, 'P-521', true)
              regKey({
                handle: kpA.pubHandle,
                family: 'ecdh',
                role: 'public',
                label: `ACVP ECDH P-521 PubKey-A (${eName})`,
                variant: 'P-521',
                engine: engineId,
              })
              regKey({
                handle: kpA.privHandle,
                family: 'ecdh',
                role: 'private',
                label: `ACVP ECDH P-521 PrivKey-A (${eName})`,
                variant: 'P-521',
                engine: engineId,
              })
              regKey({
                handle: kpB.pubHandle,
                family: 'ecdh',
                role: 'public',
                label: `ACVP ECDH P-521 PubKey-B (${eName})`,
                variant: 'P-521',
                engine: engineId,
              })
              regKey({
                handle: kpB.privHandle,
                family: 'ecdh',
                role: 'private',
                label: `ACVP ECDH P-521 PrivKey-B (${eName})`,
                variant: 'P-521',
                engine: engineId,
              })

              // Extract DER-encoded EC points (SEC1 uncompressed)
              const pubABytes = hsm_extractECPoint(M, hSession, kpA.pubHandle)
              const pubBBytes = hsm_extractECPoint(M, hSession, kpB.pubHandle)

              // A derives shared secret using B's public key
              const secretHandleAB = hsm_ecdhDerive(
                M,
                hSession,
                kpA.privHandle,
                pubBBytes,
                undefined,
                undefined,
                { keyLen: 66, extractable: true }
              )
              const secretAB = hsm_extractKeyValue(M, hSession, secretHandleAB)

              // B derives shared secret using A's public key
              const secretHandleBA = hsm_ecdhDerive(
                M,
                hSession,
                kpB.privHandle,
                pubABytes,
                undefined,
                undefined,
                { keyLen: 66, extractable: true }
              )
              const secretBA = hsm_extractKeyValue(M, hSession, secretHandleBA)

              const matches =
                secretAB.length === secretBA.length &&
                secretAB.every((b: number, i: number) => b === secretBA[i])

              await pushResult({
                id: id34,
                algorithm: `ECDH P-521 (${eName})`,
                testCase: 'Key Agreement Round-Trip',
                referenceUrl: REF.ecdsa,
                status: matches ? 'pass' : 'fail',
                details: matches
                  ? `A→B and B→A derive same ${secretAB.length}B shared secret ✓ | Z=${toHex(secretAB, 8)}…`
                  : `Secrets differ: A→B=${toHex(secretAB, 8)}… B→A=${toHex(secretBA, 8)}…`,
              })
              addLog(
                `[${eName}] [id:${id34}] ECDH P-521: ${matches ? 'PASS' : 'FAIL'} | Z=${toHex(secretAB, 8)}…`
              )
            } catch (e: unknown) {
              const errMessage = e instanceof Error ? e.message : String(e)
              await pushResult({
                id: `ecdh521-rt-err-${eName}`,
                algorithm: `ECDH P-521 (${eName})`,
                testCase: 'Key Agreement Round-Trip',
                referenceUrl: REF.ecdsa,
                status: 'fail',
                details: errMessage,
              })
              addLog(`[DISCREPANCY] [${eName}] [id:${id34}] ECDH P-521: ${errMessage}`)
            }
          }
        }

        // ── 35. KMAC128 KAT (NIST SP 800-185) ─────────────────────────────
        if (activeCategories.has('hashing_mac')) {
          currentCategory = 'hashing_mac'
          // New category (D-3): kmac_test.json was a dead file with zero
          // importers (G-13/H-6). Wires the KMAC128 sample (empty
          // customization string) — the KMAC256 sample in the same file has a
          // non-empty customization string that hsm_kmac/hsm_kmacVerify have
          // no parameter for, so it is intentionally left unused rather than
          // silently fed through a path that would mis-verify it.
          if (engine.mechs.size > 0 && !engine.mechs.has(CKM_KMAC_128)) {
            await pushSkip(
              `kmac128-skip-${eName}`,
              `KMAC128 (${eName})`,
              'KAT',
              REF.kmac,
              'KMAC128: mechanism not supported'
            )
          } else {
            const kmacTv = kmacTestVectors.testGroups[1].tests[0] // variant: KMAC128
            const id35 = `kmac128-kat-${eName}`
            addLog(`[${eName}] Testing KMAC128 KAT (NIST SP 800-185 Sample #4)...`)
            addLog(`  Key: ${kmacTv.key.slice(0, 32)}… | Msg: ${kmacTv.msg}`)
            try {
              const keyBytes = hexToBytes(kmacTv.key)
              const msgBytes = hexToBytes(kmacTv.msg)
              const macBytes = hexToBytes(kmacTv.mac)

              const kmacHandle = hsm_importHMACKey(M, hSession, keyBytes, false, true)
              regKey({
                handle: kmacHandle,
                family: 'hmac',
                role: 'secret',
                label: `ACVP KMAC128 (${eName})`,
                engine: engineId,
              })

              const isValid = hsm_kmacVerify(
                M,
                hSession,
                kmacHandle,
                msgBytes,
                macBytes,
                CKM_KMAC_128
              )

              await pushResult({
                id: id35,
                algorithm: `KMAC128 (${eName})`,
                testCase: 'KAT (SP 800-185 Sample #4)',
                referenceUrl: REF.kmac,
                evidenceTier: deriveEvidenceTier(kmacTestVectors._provenance),
                status: isValid ? 'pass' : 'fail',
                details: isValid
                  ? `Verified mac[${macBytes.length}B]: ${toHex(macBytes, 8)}…`
                  : 'MAC verification failed against SP 800-185 vector',
              })
              addLog(`[${eName}] [id:${id35}] KMAC128 KAT: ${isValid ? 'PASS' : 'FAIL'}`)
            } catch (e: unknown) {
              const errMessage = e instanceof Error ? e.message : String(e)
              await pushResult({
                id: `kmac128-err-${eName}`,
                algorithm: `KMAC128 (${eName})`,
                testCase: 'KAT',
                referenceUrl: REF.kmac,
                evidenceTier: deriveEvidenceTier(kmacTestVectors._provenance),
                status: 'fail',
                details: errMessage,
              })
              addLog(`[DISCREPANCY] [${eName}] [id:${id35}] KMAC128: ${errMessage}`)
            }
          }
        }

        // ── 36. RSA-OAEP Decrypt Self-Consistency (no ACVP registration) ──
        if (activeCategories.has('classical')) {
          currentCategory = 'classical'
          // New category (D-3/D-8): rsa_oaep_test.json was a dead file with
          // zero importers (G-13/H-6) AND self-generated (H-3/H-4) — checked
          // NIST's ACVP-Server directory listing directly (2026-08-27): RSA-OAEP
          // has no ACVP algorithm registration at all, so there is no external
          // vector to replace this with. Per D-8's fallback, the vector stays
          // and is tiered honestly as self-consistency: this decrypts the
          // file's own known ciphertext with an imported CRT private key and
          // checks it against the file's own known plaintext — proving the
          // engine's decrypt agrees with the value the fixture was generated
          // against, not correctness against an external oracle.
          if (engine.mechs.size > 0 && !engine.mechs.has(CKM_RSA_PKCS_OAEP)) {
            await pushSkip(
              `rsaoaep-skip-${eName}`,
              `RSA-OAEP (${eName})`,
              'Decrypt Self-Consistency',
              REF.rsaoaep,
              'RSA-OAEP: mechanism not supported'
            )
          } else {
            const oaepTv = rsaOaepTestVectors.testGroups[0].tests[0]
            const id36 = `rsaoaep-selfcheck-${eName}`
            addLog(`[${eName}] Testing RSA-OAEP Decrypt Self-Consistency (no ACVP registration)...`)
            try {
              const privHandle = await hsm_importRSAPrivateKey(M, hSession, {
                n: hexToBytes(oaepTv.n),
                e: hexToBytes(oaepTv.e),
                d: hexToBytes(oaepTv.d),
                p: hexToBytes(oaepTv.p),
                q: hexToBytes(oaepTv.q),
                dp: hexToBytes(oaepTv.dp),
                dq: hexToBytes(oaepTv.dq),
                qi: hexToBytes(oaepTv.qi),
              })
              regKey({
                handle: privHandle,
                family: 'rsa',
                role: 'private',
                label: `ACVP RSA-OAEP Private (${eName})`,
                engine: engineId,
              })

              const ciphertext = hexToBytes(oaepTv.ct)
              const decrypted = hsm_rsaDecrypt(M, hSession, privHandle, ciphertext, 'sha256')
              const decryptedHex = toHex(decrypted, decrypted.length)
              const matches = decryptedHex === oaepTv.pt

              await pushResult({
                id: id36,
                algorithm: `RSA-OAEP (${eName})`,
                testCase: 'Decrypt Self-Consistency',
                referenceUrl: REF.rsaoaep,
                evidenceTier: deriveEvidenceTier(rsaOaepTestVectors._provenance),
                status: matches ? 'pass' : 'fail',
                details: matches
                  ? `Decrypted ${decrypted.length}B matches known plaintext ✓`
                  : `Decrypted ${decryptedHex.slice(0, 32)}… ≠ expected ${oaepTv.pt.slice(0, 32)}…`,
              })
              addLog(`[${eName}] [id:${id36}] RSA-OAEP: ${matches ? 'PASS' : 'FAIL'}`)
            } catch (e: unknown) {
              const errMessage = e instanceof Error ? e.message : String(e)
              await pushResult({
                id: `rsaoaep-err-${eName}`,
                algorithm: `RSA-OAEP (${eName})`,
                testCase: 'Decrypt Self-Consistency',
                referenceUrl: REF.rsaoaep,
                evidenceTier: deriveEvidenceTier(rsaOaepTestVectors._provenance),
                status: 'fail',
                details: errMessage,
              })
              addLog(`[DISCREPANCY] [${eName}] [id:${id36}] RSA-OAEP: ${errMessage}`)
            }
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
      setProgress(null)
      addLog('Validation Suite Completed.')
    }
  }

  const totalChecks = results.length
  const passed = results.filter((r) => r.status === 'pass').length
  const failed = results.filter((r) => r.status === 'fail').length
  // Rows where the engine didn't advertise the mechanism, so no PKCS#11 call was
  // made. Counted separately from pass/fail everywhere below — a skip proves
  // nothing about conformance and must never be folded into either bucket.
  const skipped = results.filter((r) => r.status === 'skip').length
  const executed = totalChecks - skipped

  return {
    results,
    loading,
    progress,
    logs,
    logCopied,
    setLogCopied,
    logCopyTimerRef,
    selectedCategories,
    setSelectedCategories,
    runTests,
    totalChecks,
    passed,
    failed,
    skipped,
    executed,
  }
}

export type AcvpSuite = ReturnType<typeof useAcvpSuite>
