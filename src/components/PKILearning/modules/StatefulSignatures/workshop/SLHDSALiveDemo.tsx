// SPDX-License-Identifier: AGPL-3.0-only
import { readAlgorithmLaunch } from '@/data/algorithmLaunch'
import React, { useState, useCallback, useRef } from 'react'
import { Loader2, CheckCircle, XCircle, Info, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { ErrorAlert } from '@/components/ui/error-alert'
import {
  WorkshopOperationLog,
  type LogEntry,
} from '@/components/PKILearning/common/WorkshopOperationLog'
import { CodeBlock } from '@/components/ui/code-block'
import { useHSM, type HsmKey } from '@/hooks/useHSM'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import { HsmKeyInspector } from '@/components/shared/HsmKeyInspector'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import {
  hsm_generateSLHDSAKeyPair,
  hsm_slhdsaSign,
  hsm_slhdsaVerify,
  hsm_extractKeyValue,
  CKP_SLH_DSA_SHA2_128S,
  CKP_SLH_DSA_SHAKE_128S,
  CKP_SLH_DSA_SHA2_128F,
  CKP_SLH_DSA_SHAKE_128F,
  CKP_SLH_DSA_SHA2_192S,
  CKP_SLH_DSA_SHAKE_192S,
  CKP_SLH_DSA_SHA2_192F,
  CKP_SLH_DSA_SHAKE_192F,
  CKP_SLH_DSA_SHA2_256S,
  CKP_SLH_DSA_SHAKE_256S,
  CKP_SLH_DSA_SHA2_256F,
  CKP_SLH_DSA_SHAKE_256F,
  type SLHDSAPreHash,
} from '@/wasm/softhsm'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import { KatValidationPanel } from '@/components/shared/KatValidationPanel'
import { SlhDsaAcvpSigVerPanel } from './SlhDsaAcvpSigVerPanel'
import { LmsAcvpSigVerPanel } from './LmsAcvpSigVerPanel'
import { COMPARED_LMS, COMPARED_SIZES, bytesLabel } from '../data/signatureSizes'
import type { KatTestSpec } from '@/utils/katRunner'
import { PREHASH_OPTIONS as PREHASH_OPTIONS_BASE } from '@/components/Playground/tabs/softhsm/SoftHsmUI'
import { translateCryptoError } from '@/utils/cryptoErrorHint'

// Known-answer checks: the expected value is fixed in advance by a standard (RFC 8554
// Appendix F for LMS/HSS, the NIST ACVP SHA-256 sample), not produced by this engine.
const SHA256_BASELINE_SPEC: KatTestSpec = {
  id: 'stateful-hash-base',
  useCase: 'Hash function baseline (SHA-256)',
  standard: 'FIPS 180-4 ACVP',
  referenceUrl: 'https://csrc.nist.gov/pubs/fips/180-4/upd1/final',
  kind: { type: 'sha256-hash' },
}

const LMS_KAT_SPECS: KatTestSpec[] = [
  {
    id: 'stateful-lms-rfc8554-tc1',
    useCase: 'LMS/HSS signature verification, RFC 8554 Test Case 1',
    standard: 'IETF RFC 8554 Appendix F',
    referenceUrl: 'https://www.rfc-editor.org/rfc/rfc8554#appendix-F',
    libraryRefId: 'RFC 8554',
    kind: { type: 'lms-sigver', testCase: 1 },
  },
  {
    id: 'stateful-lms-rfc8554-tc2',
    useCase: 'LMS/HSS signature verification, RFC 8554 Test Case 2',
    standard: 'IETF RFC 8554 Appendix F',
    referenceUrl: 'https://www.rfc-editor.org/rfc/rfc8554#appendix-F',
    libraryRefId: 'RFC 8554',
    kind: { type: 'lms-sigver', testCase: 2 },
  },
]

// Functional round trips: the engine signs and then verifies its own output, so the
// "expected" value is the engine's own, and a pass shows the pieces work together.
const FUNCTIONAL_SPECS: KatTestSpec[] = [
  {
    id: 'stateful-slhdsa-128s',
    useCase: 'SLH-DSA-SHA2-128s sign and verify (functional round trip, not a known-answer test)',
    standard: 'FIPS 205',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/205/final',
    kind: { type: 'slhdsa-functional', variant: 'SHA2-128s' },
    message: 'Firmware image hash for stateful signature scheme validation',
  },
  {
    id: 'stateful-slhdsa-256s',
    useCase:
      'SLH-DSA-SHA2-256s sign and verify (Level 5; functional round trip, not a known-answer test)',
    standard: 'FIPS 205',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/205/final',
    kind: { type: 'slhdsa-functional', variant: 'SHA2-256s' },
    message: 'Code signing digest for XMSS-equivalent stateful hash-based scheme',
  },
]

/**
 * Where this demo is shown. The same component serves the Stateful Hash Signatures
 * module (workshop step 4), the SLH-DSA module (workshop steps 1-3) and the
 * standalone Playground tool, so the wording that points at other steps, and the
 * checks that only make sense for one scheme, depend on it.
 */
export type SLHDSALiveDemoContext = 'stateful' | 'slh-dsa' | 'standalone'

// ── SLH-DSA parameter set data (FIPS 205 / PKCS#11 v3.2) ──────────────────

interface ParamSet {
  id: string
  label: string
  ckp: number
  nistLevel: number
  hash: string
  pubBytes: number
  sigBytes: number
  category: 's' | 'f'
}

// A lazy function, not a top-level literal: the production build wraps this
// module's softhsm import in vite-plugin-top-level-await, so a top-level
// literal here would capture every CKP_SLH_DSA_* parameter set as `undefined`
// (assigned only once that chunk's own top-level await resolves, which
// happens AFTER this module's top-level runs). Dev/vitest don't use that
// plugin, so this bug is invisible outside a real production build. See
// pqctoday-priv/design/design_handoff_kmip_pkcs11_playground/GAPS-CLOSEOUT-PLAN-2026-09-02.md §2.1.
const paramSets = (): ParamSet[] => [
  {
    id: 'sha2-128s',
    label: 'SHA2-128s',
    ckp: CKP_SLH_DSA_SHA2_128S,
    nistLevel: 1,
    hash: 'SHA-256, all functions',
    pubBytes: 32,
    sigBytes: 7856,
    category: 's',
  },
  {
    id: 'shake-128s',
    label: 'SHAKE-128s',
    ckp: CKP_SLH_DSA_SHAKE_128S,
    nistLevel: 1,
    hash: 'SHAKE256, all functions',
    pubBytes: 32,
    sigBytes: 7856,
    category: 's',
  },
  {
    id: 'sha2-128f',
    label: 'SHA2-128f',
    ckp: CKP_SLH_DSA_SHA2_128F,
    nistLevel: 1,
    hash: 'SHA-256, all functions',
    pubBytes: 32,
    sigBytes: 17088,
    category: 'f',
  },
  {
    id: 'shake-128f',
    label: 'SHAKE-128f',
    ckp: CKP_SLH_DSA_SHAKE_128F,
    nistLevel: 1,
    hash: 'SHAKE256, all functions',
    pubBytes: 32,
    sigBytes: 17088,
    category: 'f',
  },
  {
    id: 'sha2-192s',
    label: 'SHA2-192s',
    ckp: CKP_SLH_DSA_SHA2_192S,
    nistLevel: 3,
    hash: 'SHA-256 (F, PRF); SHA-512 (H, T_l, H_msg, PRF_msg)',
    pubBytes: 48,
    sigBytes: 16224,
    category: 's',
  },
  {
    id: 'shake-192s',
    label: 'SHAKE-192s',
    ckp: CKP_SLH_DSA_SHAKE_192S,
    nistLevel: 3,
    hash: 'SHAKE256, all functions',
    pubBytes: 48,
    sigBytes: 16224,
    category: 's',
  },
  {
    id: 'sha2-192f',
    label: 'SHA2-192f',
    ckp: CKP_SLH_DSA_SHA2_192F,
    nistLevel: 3,
    hash: 'SHA-256 (F, PRF); SHA-512 (H, T_l, H_msg, PRF_msg)',
    pubBytes: 48,
    sigBytes: 35664,
    category: 'f',
  },
  {
    id: 'shake-192f',
    label: 'SHAKE-192f',
    ckp: CKP_SLH_DSA_SHAKE_192F,
    nistLevel: 3,
    hash: 'SHAKE256, all functions',
    pubBytes: 48,
    sigBytes: 35664,
    category: 'f',
  },
  {
    id: 'sha2-256s',
    label: 'SHA2-256s',
    ckp: CKP_SLH_DSA_SHA2_256S,
    nistLevel: 5,
    hash: 'SHA-256 (F, PRF); SHA-512 (H, T_l, H_msg, PRF_msg)',
    pubBytes: 64,
    sigBytes: 29792,
    category: 's',
  },
  {
    id: 'shake-256s',
    label: 'SHAKE-256s',
    ckp: CKP_SLH_DSA_SHAKE_256S,
    nistLevel: 5,
    hash: 'SHAKE256, all functions',
    pubBytes: 64,
    sigBytes: 29792,
    category: 's',
  },
  {
    id: 'sha2-256f',
    label: 'SHA2-256f',
    ckp: CKP_SLH_DSA_SHA2_256F,
    nistLevel: 5,
    hash: 'SHA-256 (F, PRF); SHA-512 (H, T_l, H_msg, PRF_msg)',
    pubBytes: 64,
    sigBytes: 49856,
    category: 'f',
  },
  {
    id: 'shake-256f',
    label: 'SHAKE-256f',
    ckp: CKP_SLH_DSA_SHAKE_256F,
    nistLevel: 5,
    hash: 'SHAKE256, all functions',
    pubBytes: 64,
    sigBytes: 49856,
    category: 'f',
  },
]

// All PKCS#11 v3.2 pre-hash variants; those with no OID in FIPS 205 §10.2.2 are labeled for awareness
const PREHASH_OPTIONS = PREHASH_OPTIONS_BASE.map((o) => ({
  id: o.id,
  label: o.fips205Slh ? o.label : `${o.label} (OID not listed in FIPS 205)`,
}))

const dropdownItems = () => paramSets().map((p) => ({ id: p.id, label: p.label }))

const LIVE_OPERATIONS = [
  'C_GenerateKeyPair',
  'C_MessageSignInit',
  'C_SignMessage',
  'C_MessageSignFinal',
  'C_MessageVerifyInit',
  'C_VerifyMessage',
  'C_MessageVerifyFinal',
]

// ── Comparison data: LMS vs SLH-DSA vs ML-DSA ──────────────────────────────

// Sizes are printed for named parameter sets, not for a security level: SP 800-208 assigns
// no NIST category to LMS or XMSS. Sizes come from ../data/signatureSizes.ts (RFC 8554 and
// FIPS 204/205 layouts); the CNSA 2.0 row is the NSA CNSA 2.0 FAQ version 2.2 (October 2026).
const COMPARISON_ROWS = [
  { label: 'Standard', lms: 'SP 800-208 / RFC 8554', slhdsa: 'FIPS 205', mldsa: 'FIPS 204' },
  { label: 'Basis', lms: 'Hash function', slhdsa: 'Hash function', mldsa: 'Lattice' },
  {
    label: 'Parameter set shown in the size rows',
    lms: COMPARED_LMS.name,
    slhdsa: 'SLH-DSA-SHA2-192s (category 3)',
    mldsa: 'ML-DSA-65 (category 3) and ML-DSA-87 (category 5)',
  },
  { label: 'Statefulness', lms: 'Stateful', slhdsa: 'Stateless', mldsa: 'Stateless' },
  {
    label: 'Signing capacity / analysis scope',
    lms: `Bounded (2^h = ${(2 ** COMPARED_LMS.h).toLocaleString('en-US')} for h = ${COMPARED_LMS.h})`,
    slhdsa: 'At most 2^64 messages/key in the FIPS 205 §11 security analysis; no leaf counter',
    mldsa: 'No leaf-exhaustion counter (not an unlimited-use claim)',
  },
  {
    label: 'Public key',
    lms: bytesLabel(COMPARED_SIZES.lms.publicKey),
    slhdsa: bytesLabel(COMPARED_SIZES.slhdsa192s.publicKey),
    mldsa: `${bytesLabel(COMPARED_SIZES.mldsa65.publicKey)} (-65); ${bytesLabel(COMPARED_SIZES.mldsa87.publicKey)} (-87)`,
  },
  {
    label: 'Signature',
    lms: bytesLabel(COMPARED_SIZES.lms.signature),
    slhdsa: bytesLabel(COMPARED_SIZES.slhdsa192s.signature),
    mldsa: `${bytesLabel(COMPARED_SIZES.mldsa65.signature)} (-65); ${bytesLabel(COMPARED_SIZES.mldsa87.signature)} (-87)`,
  },
  { label: 'Signing speed', lms: 'Fast', slhdsa: 'Slow', mldsa: 'Fast' },
  {
    label: 'CNSA 2.0',
    lms: 'Single-tree LMS approved for firmware and software signing; LMS SHA-256/192 recommended; multi-tree HSS and XMSSMT not allowed (CNSA 2.0 FAQ)',
    slhdsa: 'Not approved for any use in NSS',
    mldsa: 'ML-DSA-87 only (the CNSA 2.0 table lists no other ML-DSA set)',
  },
  {
    label: 'Best use',
    lms: 'Firmware, code signing (CNSA 2.0)',
    slhdsa: 'CA roots, stateless contexts, no persistent state',
    mldsa: 'TLS, general-purpose signing',
  },
]

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

// Exact byte count first (cert engineers compare it with the FIPS 205 tables), then the rounded size.
const formatBytes = (n: number): string =>
  n >= 1024 ? `${n.toLocaleString('en-US')} B (${(n / 1024).toFixed(1)} KB)` : `${n} B`

interface SLHDSALiveDemoProps {
  /** Which page hosts the demo; picks the intro sentence and the checks shown. Default: standalone. */
  context?: SLHDSALiveDemoContext
}

const INTRO_BY_CONTEXT: Record<SLHDSALiveDemoContext, string> = {
  stateful:
    'Compare SLH-DSA (stateless) with the stateful LMS/XMSS schemes from Steps 1–3 of this module.',
  'slh-dsa':
    'SLH-DSA is stateless: unlike LMS and XMSS (see the Stateful Hash Signatures module) there is no leaf counter to protect. Step 4 of this module compares the three schemes side by side.',
  standalone:
    'SLH-DSA is stateless: unlike LMS and XMSS (see the Stateful Hash Signatures module) there is no leaf counter to protect.',
}

export const SLHDSALiveDemo: React.FC<SLHDSALiveDemoProps> = ({ context = 'standalone' }) => {
  const hsm = useHSM('rust')
  const isLive = hsm.isReady && !!hsm.moduleRef.current

  // Parameter set & pre-hash selection
  const [paramSetId, setParamSetId] = useState(
    () => readAlgorithmLaunch('slh-dsa')?.parameter ?? 'sha2-128s'
  )
  const [preHash, setPreHash] = useState('')
  const [signContext, setSignContext] = useState('')
  const [verifyContext, setVerifyContext] = useState('')
  const [signedContext, setSignedContext] = useState('')
  const [signingMode, setSigningMode] = useState('hedged')
  const [comparison, setComparison] = useState<{
    mode: string
    context: string
    message: string
    parameter: string
    preHash: string
    first: Uint8Array
    second: Uint8Array
    validFirst: boolean
    validSecond: boolean
  } | null>(null)
  const [showAdvancedPreHash, setShowAdvancedPreHash] = useState(false)
  const [message, setMessage] = useState('SLH-DSA test message for stateful signatures module')

  // Operation results
  const [keyHandles, setKeyHandles] = useState<{ pub: number; priv: number } | null>(null)
  const [pubKeyHex, setPubKeyHex] = useState<string | null>(null)
  const [signature, setSignature] = useState<Uint8Array | null>(null)
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [logEntries, setLogEntries] = useState<LogEntry[]>([])

  // Track pre-hash used during signing for verify consistency
  const signPreHashRef = useRef<string>('')
  const checksHeadingRef = useRef<HTMLHeadingElement>(null)
  const goToAlgorithmChecks = () => {
    const heading = checksHeadingRef.current
    if (!heading) return
    heading.scrollIntoView({ behavior: 'smooth', block: 'start' })
    heading.focus({ preventScroll: true })
  }
  const [signedPreHash, setSignedPreHash] = useState<string>('')

  const selectedParam = paramSets().find((p) => p.id === paramSetId) ?? paramSets()[0]

  const resetResults = useCallback(() => {
    setComparison(null)
    setKeyHandles(null)
    setPubKeyHex(null)
    setSignature(null)
    setVerifyResult(null)
    setError(null)
    setSignedPreHash('')
    signPreHashRef.current = ''
  }, [])

  const handleParamSetChange = useCallback(
    (id: string) => {
      setParamSetId(id)
      resetResults()
    },
    [resetResults]
  )

  // A7 — wrap an async op with a single pending→success/error log entry.
  const runOp = useCallback(
    async <T,>(label: string, fn: () => Promise<T> | T): Promise<T | null> => {
      const startedAt = performance.now()
      setLogEntries((prev) => [...prev, { status: 'pending', message: label }])
      try {
        const result = await fn()
        setLogEntries((prev) => {
          const next = [...prev]
          next[next.length - 1] = {
            status: 'success',
            message: label.replace(/…$/, ''),

            durationMs: Math.round(performance.now() - startedAt),
          }
          return next
        })
        return result
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        setLogEntries((prev) => {
          const next = [...prev]
          next[next.length - 1] = {
            status: 'error',
            message: `${label.replace(/…$/, '')} — ${msg}`,

            durationMs: Math.round(performance.now() - startedAt),
          }
          return next
        })
        throw err
      }
    },
    []
  )

  const handleGenerateKey = useCallback(async () => {
    setComparison(null)
    if (!hsm.isReady || !hsm.moduleRef.current) return
    setLoading('keygen')
    setError(null)
    setSignature(null)
    setVerifyResult(null)
    try {
      await runOp(`Generating SLH-DSA keypair (${selectedParam.label})…`, () => {
        const M = hsm.moduleRef.current as unknown as SoftHSMModule
        const hSession = hsm.hSessionRef.current
        const { pubHandle, privHandle } = hsm_generateSLHDSAKeyPair(M, hSession, selectedParam.ckp)
        setKeyHandles({ pub: pubHandle, priv: privHandle })

        hsm.registerKey(M, hSession, {
          handle: pubHandle,
          family: 'slh-dsa',
          role: 'public',
          label: `SLH-DSA Public Key (${selectedParam.label})`,
          generatedAt: new Date().toISOString(),
        })
        hsm.registerKey(M, hSession, {
          handle: privHandle,
          family: 'slh-dsa',
          role: 'private',
          label: `SLH-DSA Private Key (${selectedParam.label})`,
          generatedAt: new Date().toISOString(),
        })

        const pubBytes = hsm_extractKeyValue(M, hSession, pubHandle)
        setPubKeyHex(toHex(pubBytes))
      })
    } catch (err) {
      setError(translateCryptoError(err instanceof Error ? err.message : String(err)))
    }
    setLoading(null)
  }, [hsm, selectedParam.ckp, selectedParam.label, runOp])

  const handleSign = useCallback(async () => {
    if (!hsm.isReady || !hsm.moduleRef.current || !keyHandles) return
    setLoading('sign')
    setError(null)
    setSignature(null)
    setVerifyResult(null)
    try {
      await runOp(
        `Signing SLH-DSA ${selectedParam.label}, ${preHash || 'Pure'}, context=${JSON.stringify(signContext)}…`,
        () => {
          const M = hsm.moduleRef.current as unknown as SoftHSMModule
          const hSession = hsm.hSessionRef.current
          const opts = {
            preHash: (preHash || undefined) as SLHDSAPreHash | undefined,
            context: new TextEncoder().encode(signContext),
            deterministic: signingMode === 'deterministic',
            hedgedRequired: signingMode === 'hedged',
          }
          const sig = hsm_slhdsaSign(M, hSession, keyHandles.priv, message, opts)
          setSignature(sig)
          setSignedContext(signContext)
          setSignedPreHash(preHash)
          signPreHashRef.current = preHash
        }
      )
    } catch (err) {
      setError(translateCryptoError(err instanceof Error ? err.message : String(err)))
    }
    setLoading(null)
  }, [hsm, keyHandles, message, preHash, signContext, signingMode, selectedParam.label, runOp])

  const handleCompare = async () => {
    if (!hsm.isReady || !hsm.moduleRef.current || !keyHandles) return
    setComparison(null)
    setError(null)
    setLoading('compare')
    try {
      await runOp(
        `Compare two ${signingMode} signatures (${selectedParam.label}, ${preHash || 'Pure'})…`,
        () => {
          const M = hsm.moduleRef.current as unknown as SoftHSMModule
          const session = hsm.hSessionRef.current
          const opts = {
            preHash: (preHash || undefined) as SLHDSAPreHash | undefined,
            context: new TextEncoder().encode(signContext),
            deterministic: signingMode === 'deterministic',
            hedgedRequired: signingMode === 'hedged',
          }
          const first = hsm_slhdsaSign(M, session, keyHandles.priv, message, opts)
          const second = hsm_slhdsaSign(M, session, keyHandles.priv, message, opts)
          const validFirst = hsm_slhdsaVerify(M, session, keyHandles.pub, message, first, opts)
          const validSecond = hsm_slhdsaVerify(M, session, keyHandles.pub, message, second, opts)
          setComparison({
            mode: signingMode,
            context: signContext,
            message,
            parameter: selectedParam.label,
            preHash,
            first,
            second,
            validFirst,
            validSecond,
          })
        }
      )
    } catch (err) {
      setError(translateCryptoError(err instanceof Error ? err.message : String(err)))
    } finally {
      setLoading(null)
    }
  }

  const handleVerify = useCallback(async () => {
    if (!hsm.isReady || !hsm.moduleRef.current || !keyHandles || !signature) return
    setLoading('verify')
    setError(null)
    setVerifyResult(null)
    try {
      await runOp(
        `Verifying SLH-DSA ${selectedParam.label}, ${signedPreHash || 'Pure'}, signed context=${JSON.stringify(signedContext)}, verification context=${JSON.stringify(verifyContext)}…`,
        () => {
          const M = hsm.moduleRef.current as unknown as SoftHSMModule
          const hSession = hsm.hSessionRef.current
          // Must use same pre-hash as signing
          const opts = {
            preHash: (signPreHashRef.current || undefined) as SLHDSAPreHash | undefined,
            context: new TextEncoder().encode(verifyContext),
          }
          const ok = hsm_slhdsaVerify(M, hSession, keyHandles.pub, message, signature, opts)
          setVerifyResult(ok)
        }
      )
    } catch (err) {
      setError(translateCryptoError(err instanceof Error ? err.message : String(err)))
    }
    setLoading(null)
  }, [
    hsm,
    keyHandles,
    signature,
    message,
    verifyContext,
    signedContext,
    signedPreHash,
    selectedParam.label,
    runOp,
  ])

  return (
    <div className="space-y-6">
      {/* Live HSM Toggle — MUST be first child per hsm-ui-layout-pattern.md §2 */}
      <LiveHSMToggle hsm={hsm} operations={LIVE_OPERATIONS} />

      <div>
        <h2 className="text-lg font-bold text-foreground mb-2">SLH-DSA Live Demo (FIPS 205)</h2>
        <p className="text-sm text-muted-foreground">
          Generate SLH-DSA key pairs, sign messages, and verify signatures using a real PKCS#11 v3.2
          HSM emulator in-browser. SLH-DSA (standardized as FIPS 205, August 2024) is the NIST name
          for SPHINCS+. {INTRO_BY_CONTEXT[context]}
        </p>
        {context === 'slh-dsa' && (
          <Button
            variant="link"
            onClick={goToAlgorithmChecks}
            className="mt-1 h-auto p-0 text-xs"
            data-testid="go-to-algorithm-checks"
          >
            Go to Algorithm checks
          </Button>
        )}
      </div>

      {isLive ? (
        <div className="space-y-5">
          {/* Parameter Set + Pre-hash Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="block text-xs font-medium text-muted-foreground mb-1.5">
                Parameter Set (12 FIPS 205 variants)
              </p>
              <FilterDropdown
                items={dropdownItems()}
                selectedId={paramSetId}
                onSelect={handleParamSetChange}
                defaultLabel="Select parameter set"
              />
            </div>
            <div>
              <p className="block text-xs font-medium text-muted-foreground mb-1.5">
                Pre-hash mode
              </p>
              {showAdvancedPreHash ? (
                <>
                  <FilterDropdown
                    items={PREHASH_OPTIONS}
                    selectedId={preHash || 'All'}
                    onSelect={(id) => setPreHash(id === 'All' ? '' : id)}
                    defaultLabel="Pure (no pre-hash)"
                  />
                  {preHash && !PREHASH_OPTIONS_BASE.find((o) => o.id === preHash)?.fips205Slh && (
                    <p className="text-[10px] text-status-warning mt-1 leading-relaxed">
                      ⚠ FIPS 205 section 10.2.2 lists OIDs for SHA-256, SHA-512, SHAKE128 and
                      SHAKE256 and allows other approved hash functions or XOFs. Section 10.2 says
                      the digest needs at least 8n bits of classical security strength against both
                      collision and second-preimage attacks (n = 16, 24 or 32, by parameter set).
                      SHA-256 and SHAKE128 are only appropriate for category 1 parameter sets.
                    </p>
                  )}
                  {(preHash === 'sha256' || preHash === 'shake128') &&
                    selectedParam.nistLevel !== 1 && (
                      <p
                        data-testid="prehash-category-warning"
                        className="text-[10px] text-status-warning mt-1 leading-relaxed"
                      >
                        ⚠ FIPS 205 section 10.2.2: SHA-256 and SHAKE128 are only appropriate for use
                        with SLH-DSA parameter sets that are claimed to be in security category 1.{' '}
                        {selectedParam.label} is a category {selectedParam.nistLevel} parameter set.
                      </p>
                    )}
                </>
              ) : (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-foreground">Pure (FIPS 205 — recommended)</span>
                  <Button
                    variant="link"
                    onClick={() => setShowAdvancedPreHash(true)}
                    className="text-xs h-auto p-0 text-muted-foreground"
                  >
                    Show HashSLH-DSA variants
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Parameter Details */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground block">Param set</span>
                <span className="font-mono font-bold text-primary">{selectedParam.label}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">NIST Level</span>
                <span className="font-bold text-foreground">{selectedParam.nistLevel}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Hash</span>
                <span className="font-mono text-foreground">{selectedParam.hash}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Public key</span>
                <span className="font-mono text-foreground">{selectedParam.pubBytes} B</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Signature</span>
                <span className="font-mono text-foreground">
                  {formatBytes(selectedParam.sigBytes)}
                </span>
              </div>
            </div>
            <div className="mt-2 text-[10px] text-muted-foreground">
              <strong>{selectedParam.category === 's' ? 'Small (s)' : 'Fast (f)'}:</strong>
              {selectedParam.category === 's'
                ? ' Optimized for smaller signatures — slower signing.'
                : ' Optimized for faster signing — larger signatures.'}
            </div>
          </div>

          {/* Message Input */}
          <div>
            <label
              htmlFor="slhdsa-message-input"
              className="block text-xs font-medium text-muted-foreground mb-1.5"
            >
              Message to sign
            </label>
            <Input
              id="slhdsa-message-input"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value)
                setVerifyResult(null)
              }}
              placeholder="Enter message..."
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-3 text-xs">
            <p>
              Context is optional: leave empty for zero bytes. A space is not empty. The same
              context must be used for signing and verification, in pure and pre-hash modes. The
              limit is 255 UTF-8 bytes, not characters; whitespace is preserved.
            </p>
            <label className="block" htmlFor="slhdsa-sign-context">
              Signing context ({new TextEncoder().encode(signContext).length} bytes)
            </label>
            <Input
              id="slhdsa-sign-context"
              value={signContext}
              onChange={(e) => setSignContext(e.target.value)}
            />
            <label className="block" htmlFor="slhdsa-verify-context">
              Verification context ({new TextEncoder().encode(verifyContext).length} bytes)
            </label>
            <Input
              id="slhdsa-verify-context"
              value={verifyContext}
              onChange={(e) => {
                setVerifyContext(e.target.value)
                setVerifyResult(null)
              }}
            />
            <p>
              Try “firmware-update” in both fields: sign, then verify. Change only the verification
              context to “document-signing” and verify again. Rejection is expected: it demonstrates
              that the signature binds the context. An engine error is not a successful mismatch
              test.
            </p>
            {signature && (
              <p className="font-mono break-all">
                Signed context: {JSON.stringify(signedContext)}; verification context:{' '}
                {JSON.stringify(verifyContext)}; signed mode: {signedPreHash || 'Pure'}; parameter
                set: {selectedParam.label}.
              </p>
            )}
          </div>

          <fieldset disabled={!!loading} className="space-y-2 text-sm">
            <legend className="text-xs">Signing mode</legend>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="slhdsa-signing-mode"
                checked={signingMode === 'hedged'}
                onChange={() => setSigningMode('hedged')}
              />
              Hedged — fresh randomness required
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="slhdsa-signing-mode"
                checked={signingMode === 'deterministic'}
                onChange={() => setSigningMode('deterministic')}
              />
              Deterministic — repeatable signatures required
            </label>
          </fieldset>
          <Button onClick={handleCompare} disabled={!!loading || !keyHandles} variant="outline">
            Sign twice and compare
          </Button>
          {comparison && (
            <section
              aria-label="Signing-mode comparison"
              className="space-y-2 text-xs border border-border rounded p-3"
            >
              <p>
                Saved run: {comparison.mode}; {comparison.parameter}; {comparison.preHash || 'Pure'}
                ; context {JSON.stringify(comparison.context)}; message{' '}
                {JSON.stringify(comparison.message)}. Both operations used the same key and these
                saved inputs, regardless of later field edits.
              </p>
              <p>
                Signatures:{' '}
                {toHex(comparison.first) === toHex(comparison.second) ? 'identical' : 'different'}.
              </p>
              <p>
                First signature: {comparison.validFirst ? 'valid' : 'invalid'}. Second signature:{' '}
                {comparison.validSecond ? 'valid' : 'invalid'}.
              </p>
              <p>
                Deterministic mode should produce identical signatures; hedged mode normally
                produces different signatures. Both should verify. Unexpected results need
                investigation; this comparison does not prove randomness quality, attack resistance
                or certification compliance.
              </p>
              <details>
                <summary>Inspect both signatures (hex)</summary>
                <p className="break-all font-mono">First: {toHex(comparison.first)}</p>
                <p className="break-all font-mono">Second: {toHex(comparison.second)}</p>
              </details>
            </section>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleGenerateKey}
              disabled={!!loading}
              variant="gradient"
              className="text-sm"
            >
              {loading === 'keygen' ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-1" aria-hidden="true" />{' '}
                  Generating...
                </>
              ) : (
                '1. Generate Key Pair'
              )}
            </Button>
            <Button
              onClick={handleSign}
              disabled={!!loading || !keyHandles}
              variant="outline"
              className="text-sm"
            >
              {loading === 'sign' ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-1" aria-hidden="true" /> Signing...
                </>
              ) : (
                '2. Sign Message'
              )}
            </Button>
            <Button
              onClick={handleVerify}
              disabled={!!loading || !signature}
              variant="outline"
              className="text-sm"
            >
              {loading === 'verify' ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-1" aria-hidden="true" />{' '}
                  Verifying...
                </>
              ) : (
                '3. Verify Signature'
              )}
            </Button>
            {signature && preHash !== signedPreHash && (
              <span className="text-[10px] text-status-warning self-center">
                Verify will use {signedPreHash || 'Pure'} (signed with), not {preHash || 'Pure'}{' '}
                (currently selected)
              </span>
            )}
          </div>

          {/* Error display */}
          {logEntries.length > 0 && (
            <WorkshopOperationLog entries={logEntries} className="max-h-40" />
          )}

          {error && <ErrorAlert message={error} onRetry={() => void handleGenerateKey()} />}

          {/* Results */}
          {pubKeyHex && (
            <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-3">
              <div className="text-xs font-bold text-foreground">Public Key (CKA_VALUE)</div>
              <CodeBlock
                code={
                  pubKeyHex.length > 120
                    ? `${pubKeyHex.slice(0, 60)}...${pubKeyHex.slice(-60)}`
                    : pubKeyHex
                }
              />
              <div className="text-[10px] text-muted-foreground">
                {(pubKeyHex.length / 2).toLocaleString()} bytes — extracted via C_GetAttributeValue.
                Private key is HSM-protected (CKA_EXTRACTABLE=FALSE).
              </div>
            </div>
          )}

          {signature && (
            <div className="bg-primary/5 rounded-lg p-4 border border-primary/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-primary">
                  SLH-DSA Signature
                  {signedPreHash ? ` (HashSLH-DSA-${signedPreHash})` : ' (Pure)'}
                </div>
                <span className="text-xs font-mono text-primary">
                  {formatBytes(signature.length)}
                </span>
              </div>
              <CodeBlock code={`${toHex(signature).slice(0, 120)}...`} />
              <p className="text-[11px] text-muted-foreground mt-1">
                An SLH-DSA signature is a randomizer R, a FORS signature and a hypertree signature
                (d XMSS signatures, each a WOTS+ signature plus a Merkle authentication path) — see
                FIPS 205 §9.2, Figure 17 (FORS is §8, the hypertree §7).
              </p>
            </div>
          )}

          {verifyResult !== null && (
            <div
              className={`flex items-center justify-between gap-2 rounded-lg p-3 border ${
                verifyResult
                  ? 'border-status-success/30 bg-status-success/10'
                  : 'border-status-error/30 bg-status-error/10'
              }`}
            >
              <div className="flex items-center gap-2">
                {verifyResult ? (
                  <CheckCircle size={16} className="text-status-success" aria-hidden="true" />
                ) : (
                  <XCircle size={16} className="text-status-error" aria-hidden="true" />
                )}
                <span
                  className={`text-sm font-bold ${verifyResult ? 'text-status-success' : 'text-status-error'}`}
                >
                  {verifyResult ? 'Signature Valid' : 'Signature Invalid'}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={resetResults}
                className="gap-1.5 text-xs"
              >
                <RotateCcw size={12} aria-hidden="true" />
                Start Over
              </Button>
            </div>
          )}

          {/* PKCS#11 Call Log */}
        </div>
      ) : (
        <div className="bg-muted/50 rounded-lg p-6 border border-border text-center">
          <p className="text-sm text-muted-foreground">
            Enable <strong>Live WASM Mode</strong> above to generate real SLH-DSA keys, sign, and
            verify using the SoftHSM3 PKCS#11 v3.2 emulator.
          </p>
        </div>
      )}

      {/* Comparison Table: LMS vs SLH-DSA vs ML-DSA */}
      <div className="glass-panel p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Info size={16} className="text-primary" aria-hidden="true" />
          <h3 className="text-sm font-bold text-foreground">
            Stateful vs Stateless Signature Comparison
          </h3>
        </div>
        <ResponsiveTable
          caption="Stateful vs Stateless Signature Comparison"
          head={[
            'Property',
            'LMS',
            <span key="slhdsa" className="text-primary">
              SLH-DSA
            </span>,
            'ML-DSA',
          ]}
          rows={COMPARISON_ROWS.map((row) => [
            row.label,
            <span key="lms" className="font-mono text-muted-foreground">
              {row.lms}
            </span>,
            <span key="slhdsa" className="font-mono text-primary">
              {row.slhdsa}
            </span>,
            <span key="mldsa" className="font-mono text-muted-foreground">
              {row.mldsa}
            </span>,
          ])}
          strongFirstColumn
          centerValues
          testId="slh-dsa-comparison"
        />
        <p className="mt-3 text-[10px] text-muted-foreground leading-relaxed">
          The size rows compare named parameter sets of a similar size class, not equal security: SP
          800-208 assigns no NIST security category to LMS. LMS sizes follow the RFC 8554 layouts
          (public key 4 + 4 + 16 + m bytes; signature 12 + n(p + 1) + m·h bytes) with the SP 800-208
          SHA-256/192 parameters n = m = {COMPARED_LMS.n}, p = {COMPARED_LMS.p}, h ={' '}
          {COMPARED_LMS.h}. An HSS key with one level, which is what the PKCS#11 engine signs with,
          adds 4 bytes to the public key and to each signature.
        </p>
      </div>

      {/* Educational note */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-2">
        <p className="text-xs text-muted-foreground">
          <strong>Why is SLH-DSA stateless?</strong> SLH-DSA keeps no counter. A key pair is a very
          large set of few-time FORS keys; each signature hashes the message with a randomizer, uses
          part of the digest to select one of them, and authenticates it through the hypertree. A
          FORS key can be selected again, and its security degrades gradually; the parameter sets
          are designed for up to 2^64 signatures per key. Because SLH-DSA keeps no counter, a copy
          of the private key cannot cause the one-time key reuse that NIST SP 800-208 section 9.1
          warns about for LMS and XMSS. Signatures made by all copies of a key still count towards
          the same limit of 2^64 signatures per key (FIPS 205 section 11). FIPS 205 gives no rules
          for backing up or replicating keys, so follow your module&apos;s key-management
          requirements.
        </p>
        <p className="text-xs text-muted-foreground">
          <strong>The cost of statefulness elimination:</strong> SLH-DSA (FIPS 205, formerly
          SPHINCS+) signs with a Merkle hypertree whose path proof must be included in full —
          producing signatures of 7–49 KB depending on the parameter set, versus 1.3–9.3 KB for LMS.
          The &quot;s&quot; variants optimize for smaller signatures; the &quot;f&quot; variants
          optimize for faster signing at the expense of larger output.{' '}
          {isLive
            ? 'All operations above execute via SoftHSM3 PKCS#11 v3.2.'
            : 'Enable Live WASM Mode above for real cryptographic operations.'}{' '}
          Generated keys are for educational purposes only.
        </p>
      </div>

      {/* Algorithm checks: known-answer checks first, then the functional round trips,
          each panel saying which kind of evidence it gives. */}
      <section aria-labelledby="algorithm-checks-heading" className="space-y-4">
        <div>
          <h3
            id="algorithm-checks-heading"
            ref={checksHeadingRef}
            tabIndex={-1}
            className="scroll-mt-20 text-sm font-bold text-foreground focus:outline-none"
          >
            {context === 'stateful'
              ? 'Algorithm checks: LMS and SLH-DSA'
              : 'Algorithm checks: SLH-DSA'}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            A known-answer check compares the engine&apos;s output with a value fixed in advance by
            a standard or by NIST. A functional round trip signs and verifies with the same engine,
            so it shows the pieces work together and nothing more.
          </p>
        </div>

        <KatValidationPanel
          specs={
            context === 'stateful'
              ? [...LMS_KAT_SPECS, SHA256_BASELINE_SPEC]
              : [SHA256_BASELINE_SPEC]
          }
          label={
            context === 'stateful'
              ? 'Known-answer checks: LMS (RFC 8554) and SHA-256'
              : 'Known-answer check: SHA-256'
          }
          authorityNote={context === 'stateful' ? 'RFC 8554 Appendix F · FIPS 180-4' : 'FIPS 180-4'}
        />

        {context === 'stateful' && <LmsAcvpSigVerPanel />}

        <SlhDsaAcvpSigVerPanel />

        <KatValidationPanel
          specs={FUNCTIONAL_SPECS}
          label="Functional round trips (not known-answer tests)"
          authorityNote="FIPS 205 · each row signs and verifies with this engine, so a pass shows no external correctness claim"
        />
      </section>

      {hsm.isReady && (
        <div className="space-y-4">
          <Pkcs11LogPanel
            log={hsm.log}
            onClear={hsm.clearLog}
            title="PKCS#11 Call Log"
            defaultOpen={true}
            filterFns={LIVE_OPERATIONS}
          />
          {hsm.keys.length > 0 && (
            <HsmKeyInspector
              keys={hsm.keys}
              moduleRef={hsm.moduleRef}
              hSessionRef={hsm.hSessionRef}
              onRemoveKey={(key: HsmKey) => hsm.removeKey(key.handle)}
            />
          )}
        </div>
      )}
    </div>
  )
}
