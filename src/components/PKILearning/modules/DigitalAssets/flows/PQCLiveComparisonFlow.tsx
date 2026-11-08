// SPDX-License-Identifier: AGPL-3.0-only
import React, { useRef, useState, useLayoutEffect } from 'react'
import { CheckCircle, ShieldCheck, Cpu, AlertCircle } from 'lucide-react'
import { StepWizard } from '../components/StepWizard'
import { useStepWizard } from '../hooks/useStepWizard'
import { openSSLService } from '@/services/crypto/OpenSSLService'
import { DIGITAL_ASSETS_CONSTANTS } from '../constants'
import { useHSM, type HsmKey } from '@/hooks/useHSM'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import { HsmKeyInspector } from '@/components/shared/HsmKeyInspector'
import {
  hsm_generateECKeyPair,
  hsm_generateMLDSAKeyPair,
  hsm_ecdsaSign,
  hsm_ecdsaVerify,
  hsm_sign,
  hsm_verify,
  hsm_extractKeyValue,
  hsm_extractECPoint,
} from '@/wasm/softhsm'

const COMPARISON_LIVE_OPERATIONS = [
  'C_GenerateKeyPair',
  'C_GetAttributeValue',
  'C_SignInit',
  'C_Sign',
  'C_VerifyInit',
  'C_Verify',
  'C_MessageSignInit',
  'C_SignMessage',
  'C_MessageVerifyInit',
  'C_VerifyMessage',
]

interface PQCLiveComparisonFlowProps {
  onBack: () => void
  onComplete?: () => void
}

interface AlgoState {
  privBytes: number | null
  pubBytes: number | null
  sigBytes: number | null
  verified: boolean | null
  keyOrigin: 'software-pem-file' | 'hsm-public-attribute' | null
  keyAlgorithm: string | null
  signatureOrigin: 'OpenSSL signature file' | 'HSM signature output' | null
  signatureAlgorithm: string | null
  verificationOrigin: 'OpenSSL sample check' | 'HSM sample check' | null
  verificationAlgorithm: string | null
  signatureInput: string | null
  verificationInput: string | null
}

const DEMO_MESSAGE = 'PQC Demo: Transfer 0.5 BTC · Block #901234 · Quantum-Safe Signing'

interface SizeBarsProps {
  classicalSig: number | null
  pqcSig: number | null
  classicalLabel: string
}

const SizeBars: React.FC<SizeBarsProps> = ({ classicalSig, pqcSig, classicalLabel }) => {
  if (!classicalSig || !pqcSig) return null
  const ratio = Math.round(pqcSig / classicalSig)
  return (
    <div className="space-y-2 mt-3">
      <p className="text-xs text-muted-foreground font-medium">
        Returned signature-output lengths (sample encodings)
      </p>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-24 shrink-0">{classicalLabel}</span>
          <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="h-2 rounded-full bg-primary"
              style={{ width: `${(classicalSig / pqcSig) * 100}%` }}
            />
          </div>
          <span className="text-xs font-mono text-foreground w-14 text-right shrink-0">
            {classicalSig} B
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-24 shrink-0">ML-DSA-65</span>
          <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
            <div className="h-2 rounded-full bg-destructive" style={{ width: '100%' }} />
          </div>
          <span className="text-xs font-mono text-foreground w-14 text-right shrink-0">
            {pqcSig} B
          </span>
        </div>
      </div>
      <p className="text-xs text-destructive font-medium">
        In these sample outputs, the ML-DSA-65 buffer is ~{ratio}× the classical buffer. This is not
        a Bitcoin transaction-size estimate.
      </p>
    </div>
  )
}

interface ComparisonPanelProps {
  classical: AlgoState
  pqc: AlgoState
  showSigs?: boolean
  showVerified?: boolean
}

const ComparisonPanel: React.FC<ComparisonPanelProps> = ({
  classical,
  pqc,
  showSigs = false,
  showVerified = false,
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
    {[
      { state: classical, kind: 'Classical', Icon: Cpu },
      { state: pqc, kind: 'Post-quantum', Icon: ShieldCheck },
    ].map(({ state, kind, Icon }) => (
      <div
        key={kind}
        role="region"
        aria-label={`${kind} sample output`}
        className="glass-panel p-4 space-y-2"
      >
        <div className="flex items-center gap-2 mb-3">
          <Icon size={16} className="text-primary shrink-0" />
          <span className="text-sm font-semibold text-foreground">
            {state.keyAlgorithm ?? `${kind} sample`}
          </span>
        </div>
        {state.keyOrigin !== null ? (
          <>
            <p className="text-xs text-muted-foreground">
              Recorded key origin:{' '}
              {state.keyOrigin === 'software-pem-file'
                ? 'OpenSSL PEM-file output'
                : 'HSM public-attribute output'}
            </p>
            <div className="flex justify-between gap-2 text-xs">
              <span className="text-muted-foreground">
                {state.keyOrigin === 'software-pem-file'
                  ? 'Private PEM-file bytes'
                  : 'Private serialized size'}
              </span>
              <span className="font-mono text-foreground">
                {state.keyOrigin === 'hsm-public-attribute'
                  ? 'Resident; not measured here'
                  : state.privBytes === null
                    ? 'Not available'
                    : `${state.privBytes} B`}
              </span>
            </div>
            <div className="flex justify-between gap-2 text-xs">
              <span className="text-muted-foreground">
                {state.keyOrigin === 'software-pem-file'
                  ? 'Public PEM-file bytes'
                  : 'Public attribute-output bytes'}
              </span>
              <span className="font-mono text-foreground">
                {state.pubBytes === null ? 'Not available' : `${state.pubBytes} B`}
              </span>
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            Run Step 1 to request sample key generation
          </p>
        )}
        {showSigs && state.sigBytes !== null && (
          <>
            <p className="text-xs text-muted-foreground">
              Recorded signature origin: {state.signatureAlgorithm ?? 'Algorithm unrecorded'} —{' '}
              {state.signatureOrigin ?? 'Origin unrecorded'}
            </p>
            <p className="text-xs text-muted-foreground break-all">
              Recorded signing input: {state.signatureInput ?? 'Unavailable'}
            </p>
            <div className="flex justify-between gap-2 text-xs">
              <span className="text-muted-foreground">Returned signature-output bytes</span>
              <span className="font-mono text-foreground">{state.sigBytes} B</span>
            </div>
          </>
        )}
        {showVerified && state.verified !== null && (
          <div className="text-xs mt-2 space-y-1">
            <p className="text-muted-foreground break-all">
              Recorded check input: {state.verificationInput ?? 'Unavailable'}
            </p>
            {state.verified ? (
              <CheckCircle size={12} className="text-status-success" />
            ) : (
              <AlertCircle size={12} className="text-destructive" />
            )}
            <span className={state.verified ? 'text-status-success' : 'text-destructive'}>
              {state.verificationAlgorithm ?? 'Algorithm unrecorded'} —{' '}
              {state.verificationOrigin ?? 'Origin unrecorded'}:{' '}
              {state.verified ? 'Verified' : 'Failed'}
            </span>
          </div>
        )}
      </div>
    ))}
  </div>
)

export const PQCLiveComparisonFlow: React.FC<PQCLiveComparisonFlowProps> = ({
  onBack,
  onComplete,
}) => {
  const [classical, setClassical] = useState<AlgoState>({
    privBytes: null,
    pubBytes: null,
    sigBytes: null,
    verified: null,
    keyOrigin: null,
    keyAlgorithm: null,
    signatureOrigin: null,
    signatureAlgorithm: null,
    verificationOrigin: null,
    verificationAlgorithm: null,
    signatureInput: null,
    verificationInput: null,
  })
  const [pqc, setPqc] = useState<AlgoState>({
    privBytes: null,
    pubBytes: null,
    sigBytes: null,
    verified: null,
    keyOrigin: null,
    keyAlgorithm: null,
    signatureOrigin: null,
    signatureAlgorithm: null,
    verificationOrigin: null,
    verificationAlgorithm: null,
    signatureInput: null,
    verificationInput: null,
  })

  const hsm = useHSM()
  const hsmRequested = Boolean(hsm.isReady && hsm.moduleRef.current && hsm.hSessionRef.current)

  // HSM key handle refs (persist across steps)
  const hsmKeysRef = useRef<{
    ecPub: number
    ecPriv: number
    mlPub: number
    mlPriv: number
    ecSig: Uint8Array | null
    mlSig: Uint8Array | null
  }>({ ecPub: 0, ecPriv: 0, mlPub: 0, mlPriv: 0, ecSig: null, mlSig: null })

  // File refs to carry artifacts between steps
  const ecFilesRef = useRef<Array<{ name: string; data: Uint8Array }>>([])
  const mlFilesRef = useRef<Array<{ name: string; data: Uint8Array }>>([])
  const idRef = useRef<string>(Date.now().toString())

  const filenames = {
    ecPriv: `ec_priv_${idRef.current}.key`,
    ecPub: `ec_pub_${idRef.current}.pem`,
    mlPriv: `mldsa_priv_${idRef.current}.key`,
    mlPub: `mldsa_pub_${idRef.current}.pem`,
    msg: `demo_msg_${idRef.current}.dat`,
    ecSig: `ec_sig_${idRef.current}.sig`,
    mlSig: `mldsa_sig_${idRef.current}.sig`,
  }

  const steps = [
    {
      id: 'gen_keys',
      title: '1. Generate Keypairs',
      description: hsmRequested
        ? 'Request an ECDSA P-256 sample and an ML-DSA-65 sample from the HSM path. Recorded measurements describe only outputs actually returned.'
        : 'Request secp256k1 and ML-DSA-65 samples from OpenSSL. File-byte counts include the returned PEM text; they are not raw-key lengths.',
      code: `# Classical — secp256k1 (128-bit classical security)
${DIGITAL_ASSETS_CONSTANTS.COMMANDS.BITCOIN.GEN_KEY(filenames.ecPriv)}
${DIGITAL_ASSETS_CONSTANTS.COMMANDS.BITCOIN.EXTRACT_PUB(filenames.ecPriv, filenames.ecPub)}

# Quantum-Safe — ML-DSA-65 (FIPS 204, security category 3)
${DIGITAL_ASSETS_CONSTANTS.COMMANDS.ML_DSA_65.GEN_KEY(filenames.mlPriv)}
${DIGITAL_ASSETS_CONSTANTS.COMMANDS.ML_DSA_65.EXTRACT_PUB(filenames.mlPriv, filenames.mlPub)}`,
      language: 'bash' as const,
      actionLabel: 'Generate Both Keypairs',
      customControls: (
        <ComparisonPanel classical={classical} pqc={pqc} showSigs={false} showVerified={false} />
      ),
    },
    {
      id: 'sign',
      title: '2. Sign the Same Sample Message',
      description:
        'Both sample operations sign the same fictional text message. Returned signature-file or HSM-output lengths are recorded separately; no Bitcoin transaction is serialized.',
      code: `# Message
MSG="${DEMO_MESSAGE}"

# Classical — secp256k1 ECDSA (raw message, SHA-256 digest)
openssl pkeyutl -sign -inkey ${filenames.ecPriv} -in ${filenames.msg} -out ${filenames.ecSig} -rawin -digest sha256

# Quantum-Safe — ML-DSA-65 (raw message natively, no pre-hash needed)
${DIGITAL_ASSETS_CONSTANTS.COMMANDS.ML_DSA_65.SIGN(filenames.mlPriv, filenames.msg, filenames.mlSig)}`,
      language: 'bash' as const,
      actionLabel: 'Sign with Both Algorithms',
      customControls: (
        <div>
          <ComparisonPanel classical={classical} pqc={pqc} showSigs={true} showVerified={false} />
          <SizeBars
            classicalSig={classical.sigBytes}
            pqcSig={pqc.sigBytes}
            classicalLabel={classical.signatureAlgorithm ?? 'Classical sample'}
          />
        </div>
      ),
    },
    {
      id: 'verify',
      title: '3. Verify & Compare',
      description:
        'Run the existing sample checks and inspect their reported outcomes. Size and provider provenance remain separate from verification; these outputs do not establish a Bitcoin wire format or deployment interoperability.',
      code: `# Verify secp256k1 signature (must match signing flags)
openssl pkeyutl -verify -pubin -inkey ${filenames.ecPub} -in ${filenames.msg} -sigfile ${filenames.ecSig} -rawin -digest sha256

# Verify ML-DSA-65 signature
${DIGITAL_ASSETS_CONSTANTS.COMMANDS.ML_DSA_65.VERIFY(filenames.mlPub, filenames.msg, filenames.mlSig)}`,
      language: 'bash' as const,
      actionLabel: 'Verify Both Signatures',
      customControls: (
        <div className="space-y-4">
          <ComparisonPanel classical={classical} pqc={pqc} showSigs={true} showVerified={true} />
          <SizeBars
            classicalSig={classical.sigBytes}
            pqcSig={pqc.sigBytes}
            classicalLabel={classical.signatureAlgorithm ?? 'Classical sample'}
          />
          {classical.sigBytes !== null && pqc.sigBytes !== null && (
            <div
              role="note"
              className="glass-panel p-4 border-l-4 border-l-accent text-sm text-muted-foreground leading-relaxed"
            >
              <p className="font-semibold text-foreground mb-1">Limits of this size comparison</p>
              <p className="text-xs">
                PEM file bytes, HSM public-attribute output and signature buffers are different
                representations. A resident private key has no measured serialized size here. No
                Bitcoin transaction or witness is serialized or inspected. Before estimating wire
                overhead, specify the intended key, signature and script encodings and measure them
                with compatible production tools.
              </p>
            </div>
          )}
        </div>
      ),
    },
  ]

  const wizard = useStepWizard({ steps, onBack })
  const runVersion = useRef(0)
  const runBusy = useRef(false)
  const selectedModule = hsm.moduleRef.current
  const selectedSession = hsm.hSessionRef.current
  const hsmKeyContext = useRef<{
    module: typeof selectedModule
    session: typeof selectedSession
  } | null>(null)
  const hsmSignatureContext = useRef<{
    module: typeof selectedModule
    session: typeof selectedSession
  } | null>(null)
  const [completedContext, setCompletedContext] = useState<{
    module: typeof selectedModule
    session: typeof selectedSession
    hsm: boolean
    step: number
  } | null>(null)
  const completionMatches =
    completedContext !== null &&
    completedContext.module === selectedModule &&
    completedContext.session === selectedSession &&
    completedContext.hsm === hsmRequested &&
    completedContext.step === wizard.currentStep
  const latestContext = useRef({
    module: selectedModule,
    session: selectedSession,
    hsm: hsmRequested,
    step: wizard.currentStep,
  })
  if (
    latestContext.current.module !== selectedModule ||
    latestContext.current.session !== selectedSession ||
    latestContext.current.hsm !== hsmRequested ||
    latestContext.current.step !== wizard.currentStep
  ) {
    // Invalidate synchronously during the context-changing render, before an
    // already-settling backend promise can begin a dependent command.
    runVersion.current += 1
    latestContext.current = {
      module: selectedModule,
      session: selectedSession,
      hsm: hsmRequested,
      step: wizard.currentStep,
    }
  }
  const mounted = useRef(true)
  useLayoutEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      runVersion.current += 1
    }
  }, [])

  const executeStep = async () => {
    if (runBusy.current) return
    runBusy.current = true
    wizard.setIsStepComplete(false)
    setCompletedContext(null)
    const version = ++runVersion.current
    const ensureCurrent = () => {
      if (
        !mounted.current ||
        version !== runVersion.current ||
        hsm.moduleRef.current !== selectedModule ||
        hsm.hSessionRef.current !== selectedSession ||
        latestContext.current.hsm !== hsmRequested ||
        latestContext.current.step !== wizard.currentStep
      )
        throw new Error('Inputs changed—run again. Previous operation results were not applied.')
    }
    const inputs = { ...hsmKeysRef.current }
    const requestedFiles = { ...filenames }
    const requireFile = (files: Array<{ name: string; data: Uint8Array }>, name: string) => {
      if (!files.some((file) => file.name === name && file.data.length > 0))
        throw new Error(
          `Required sample file not produced or unavailable: ${name}. Run the preceding step again.`
        )
    }
    const clearSignature = (state: AlgoState): AlgoState => ({
      ...state,
      sigBytes: null,
      verified: null,
      signatureOrigin: null,
      signatureAlgorithm: null,
      signatureInput: null,
      verificationOrigin: null,
      verificationAlgorithm: null,
      verificationInput: null,
    })
    if (wizard.currentStep === 0) {
      setClassical((state) => ({
        ...clearSignature(state),
        privBytes: null,
        pubBytes: null,
        keyOrigin: null,
        keyAlgorithm: null,
      }))
      setPqc((state) => ({
        ...clearSignature(state),
        privBytes: null,
        pubBytes: null,
        keyOrigin: null,
        keyAlgorithm: null,
      }))
    } else if (wizard.currentStep === 1) {
      setClassical(clearSignature)
      setPqc(clearSignature)
    } else {
      setClassical((state) => ({
        ...state,
        verified: null,
        verificationOrigin: null,
        verificationAlgorithm: null,
        verificationInput: null,
      }))
      setPqc((state) => ({
        ...state,
        verified: null,
        verificationOrigin: null,
        verificationAlgorithm: null,
        verificationInput: null,
      }))
    }
    try {
      const executeCurrent = async () => {
        try {
          // ── Live HSM Mode ──
          if (hsm.isReady && hsm.moduleRef.current && hsm.hSessionRef.current) {
            const M = hsm.moduleRef.current
            const hSession = hsm.hSessionRef.current

            if (wizard.currentStep === 0) {
              // Step 1: Generate both keypairs via PKCS#11
              const ec = hsm_generateECKeyPair(M, hSession, 'P-256', false, 'sign')
              const ecPoint = hsm_extractECPoint(M, hSession, ec.pubHandle)
              const ml = hsm_generateMLDSAKeyPair(M, hSession, 65)
              const mlPub = hsm_extractKeyValue(M, hSession, ml.pubHandle)

              if (
                !ec.pubHandle ||
                !ec.privHandle ||
                !ml.pubHandle ||
                !ml.privHandle ||
                !ecPoint.length ||
                !mlPub.length
              )
                throw new Error('Required HSM sample key output unavailable. Generate again.')
              hsmKeyContext.current = { module: M, session: hSession }
              hsmSignatureContext.current = null
              hsmKeysRef.current = {
                ecPub: ec.pubHandle,
                ecPriv: ec.privHandle,
                mlPub: ml.pubHandle,
                mlPriv: ml.privHandle,
                ecSig: null,
                mlSig: null,
              }

              hsm.registerKey(M, hSession, {
                handle: ec.pubHandle,
                family: 'ecdsa',
                role: 'public',
                label: 'ECDSA P-256 Public Key',
                generatedAt: new Date().toISOString(),
              })
              hsm.registerKey(M, hSession, {
                handle: ec.privHandle,
                family: 'ecdsa',
                role: 'private',
                label: 'ECDSA P-256 Private Key',
                generatedAt: new Date().toISOString(),
              })
              hsm.registerKey(M, hSession, {
                handle: ml.pubHandle,
                family: 'ml-dsa',
                role: 'public',
                label: 'ML-DSA-65 Public Key',
                generatedAt: new Date().toISOString(),
              })
              hsm.registerKey(M, hSession, {
                handle: ml.privHandle,
                family: 'ml-dsa',
                role: 'private',
                label: 'ML-DSA-65 Private Key',
                generatedAt: new Date().toISOString(),
              })

              setClassical((prev) => ({
                ...prev,
                privBytes: null,
                pubBytes: ecPoint.length,
                keyOrigin: 'hsm-public-attribute',
                keyAlgorithm: 'ECDSA P-256',
              }))
              setPqc((prev) => ({
                ...prev,
                privBytes: null,
                pubBytes: mlPub.length,
                keyOrigin: 'hsm-public-attribute',
                keyAlgorithm: 'ML-DSA-65',
              }))

              return (
                `[PKCS#11] ECDSA P-256 EC key pair: C_GenerateKeyPair → pub ${ecPoint.length} B\n` +
                `[PKCS#11] ML-DSA-65 key pair:   C_GenerateKeyPair → pub ${mlPub.length} B\n` +
                `\nBoth keypairs generated via SoftHSM3 WASM.`
              )
            }

            if (wizard.currentStep === 1) {
              if (hsmKeyContext.current?.module !== M || hsmKeyContext.current.session !== hSession)
                throw new Error(
                  'HSM key context changed. Generate sample keys with this provider first.'
                )
              if (!inputs.ecPriv || !inputs.mlPriv)
                throw new Error(
                  'HSM sample key references unavailable. Generate keys with this provider first.'
                )
              // Step 2: Sign with both via PKCS#11
              const ecSig = hsm_ecdsaSign(M, hSession, hsmKeysRef.current.ecPriv, DEMO_MESSAGE)
              const mlSig = hsm_sign(M, hSession, hsmKeysRef.current.mlPriv, DEMO_MESSAGE)

              if (!ecSig.length || !mlSig.length)
                throw new Error('Required HSM sample signature output unavailable. Sign again.')
              hsmSignatureContext.current = { module: M, session: hSession }
              hsmKeysRef.current.ecSig = ecSig
              hsmKeysRef.current.mlSig = mlSig

              setClassical((prev) => ({
                ...prev,
                sigBytes: ecSig.length,
                signatureOrigin: 'HSM signature output',
                signatureAlgorithm: 'ECDSA P-256',
                signatureInput: `private handle ${inputs.ecPriv}`,
              }))
              setPqc((prev) => ({
                ...prev,
                sigBytes: mlSig.length,
                signatureOrigin: 'HSM signature output',
                signatureAlgorithm: 'ML-DSA-65',
                signatureInput: `private handle ${inputs.mlPriv}`,
              }))

              const ratio = Math.round(mlSig.length / ecSig.length)
              return (
                `Message: "${DEMO_MESSAGE}"\n\n` +
                `[PKCS#11] ECDSA P-256 C_Sign(CKM_ECDSA_SHA256): ${ecSig.length} bytes\n` +
                `[PKCS#11] ML-DSA-65 C_SignMessage:             ${mlSig.length} bytes\n` +
                `\nSize ratio: ~${ratio}× larger for ML-DSA-65`
              )
            }

            if (wizard.currentStep === 2) {
              if (
                hsmSignatureContext.current?.module !== M ||
                hsmSignatureContext.current.session !== hSession
              )
                throw new Error(
                  'HSM signature context changed. Generate and sign with this provider first.'
                )
              if (!inputs.ecPub || !inputs.mlPub || !inputs.ecSig?.length || !inputs.mlSig?.length)
                throw new Error(
                  'HSM sample key/signature references unavailable. Generate and sign with this provider first.'
                )
              // Step 3: Verify both via PKCS#11
              const ecVerified = hsm_ecdsaVerify(
                M,
                hSession,
                hsmKeysRef.current.ecPub,
                DEMO_MESSAGE,
                hsmKeysRef.current.ecSig!
              )
              const mlVerified = hsm_verify(
                M,
                hSession,
                hsmKeysRef.current.mlPub,
                DEMO_MESSAGE,
                hsmKeysRef.current.mlSig!
              )

              setClassical((prev) => ({
                ...prev,
                verified: ecVerified,
                verificationOrigin: 'HSM sample check',
                verificationAlgorithm: 'ECDSA P-256',
                verificationInput: `public handle ${inputs.ecPub}; signature buffer ${inputs.ecSig?.length ?? 'unavailable'} B`,
              }))
              setPqc((prev) => ({
                ...prev,
                verified: mlVerified,
                verificationOrigin: 'HSM sample check',
                verificationAlgorithm: 'ML-DSA-65',
                verificationInput: `public handle ${inputs.mlPub}; signature buffer ${inputs.mlSig?.length ?? 'unavailable'} B`,
              }))

              if (!ecVerified || !mlVerified)
                throw new Error(
                  'A required HSM sample signature check failed. No successful completion is recorded.'
                )
              return (
                `[PKCS#11] ECDSA P-256 C_Verify: ${ecVerified ? 'Verified ✓' : 'FAILED ✗'}\n` +
                `[PKCS#11] ML-DSA-65 C_VerifyMessage: ${mlVerified ? 'Verified ✓' : 'FAILED ✗'}\n` +
                `\nSample check outcomes are reported above; no Bitcoin encoding or interoperability check was performed.`
              )
            }

            return 'Step complete.'
          }

          // ── Software Mode (OpenSSL WASM) ──
          if (wizard.currentStep === 0) {
            // Step 1: Generate both keypairs
            idRef.current = Date.now().toString()
            Object.assign(filenames, {
              ecPriv: `ec_priv_${idRef.current}.key`,
              ecPub: `ec_pub_${idRef.current}.pem`,
              mlPriv: `mldsa_priv_${idRef.current}.key`,
              mlPub: `mldsa_pub_${idRef.current}.pem`,
              msg: `demo_msg_${idRef.current}.dat`,
              ecSig: `ec_sig_${idRef.current}.sig`,
              mlSig: `mldsa_sig_${idRef.current}.sig`,
            })

            // Classical key gen
            const r1 = await openSSLService.execute(
              DIGITAL_ASSETS_CONSTANTS.COMMANDS.BITCOIN.GEN_KEY(filenames.ecPriv)
            )
            ensureCurrent()
            if (r1.error) throw new Error(`secp256k1 key gen failed: ${r1.error}`)
            requireFile(r1.files, filenames.ecPriv)

            const r2 = await openSSLService.execute(
              DIGITAL_ASSETS_CONSTANTS.COMMANDS.BITCOIN.EXTRACT_PUB(
                filenames.ecPriv,
                filenames.ecPub
              ),
              r1.files
            )
            ensureCurrent()
            if (r2.error) throw new Error(`secp256k1 pubkey extract failed: ${r2.error}`)

            // PQC key gen
            const r3 = await openSSLService.execute(
              DIGITAL_ASSETS_CONSTANTS.COMMANDS.ML_DSA_65.GEN_KEY(filenames.mlPriv)
            )
            ensureCurrent()
            if (r3.error) throw new Error(`ML-DSA-65 key gen failed: ${r3.error}`)
            requireFile(r3.files, filenames.mlPriv)

            const r4 = await openSSLService.execute(
              DIGITAL_ASSETS_CONSTANTS.COMMANDS.ML_DSA_65.EXTRACT_PUB(
                filenames.mlPriv,
                filenames.mlPub
              ),
              r3.files
            )
            ensureCurrent()
            if (r4.error) throw new Error(`ML-DSA-65 pubkey extract failed: ${r4.error}`)

            requireFile(r2.files, filenames.ecPub)
            requireFile(r4.files, filenames.mlPub)
            // Store files
            ecFilesRef.current = [...r1.files, ...r2.files]
            mlFilesRef.current = [...r3.files, ...r4.files]

            // Extract sizes from PEM files
            const ecPrivFile = r1.files.find((f) => f.name === filenames.ecPriv)
            const ecPubFile = r2.files.find((f) => f.name === filenames.ecPub)
            const mlPrivFile = r3.files.find((f) => f.name === filenames.mlPriv)
            const mlPubFile = r4.files.find((f) => f.name === filenames.mlPub)

            setClassical((prev) => ({
              ...prev,
              privBytes: ecPrivFile?.data.length ?? null,
              pubBytes: ecPubFile?.data.length ?? null,
              keyOrigin: 'software-pem-file',
              keyAlgorithm: 'secp256k1',
            }))
            setPqc((prev) => ({
              ...prev,
              privBytes: mlPrivFile?.data.length ?? null,
              pubBytes: mlPubFile?.data.length ?? null,
              keyOrigin: 'software-pem-file',
              keyAlgorithm: 'ML-DSA-65',
            }))

            return (
              `secp256k1 private key: ${ecPrivFile?.data.length ?? '?'} bytes (PEM)\n` +
              `secp256k1 public key:  ${ecPubFile?.data.length ?? '?'} bytes (PEM)\n` +
              `ML-DSA-65 private key: ${mlPrivFile?.data.length ?? '?'} bytes (PEM)\n` +
              `ML-DSA-65 public key:  ${mlPubFile?.data.length ?? '?'} bytes (PEM)\n` +
              `\nKey-generation calls returned; measurements describe only the file outputs present in this sample.`
            )
          }

          if (wizard.currentStep === 1) {
            requireFile(ecFilesRef.current, requestedFiles.ecPriv)
            requireFile(mlFilesRef.current, requestedFiles.mlPriv)
            // Step 2: Sign same message with both keys
            const msgBytes = new TextEncoder().encode(DEMO_MESSAGE)
            const msgFile = { name: filenames.msg, data: msgBytes }

            // Classical sign — use -rawin -digest sha256 so OpenSSL hashes the raw message
            // (BITCOIN.SIGN constants expect a pre-hashed digest, like BitcoinFlow provides)
            const r1 = await openSSLService.execute(
              `openssl pkeyutl -sign -inkey ${filenames.ecPriv} -in ${filenames.msg} -out ${filenames.ecSig} -rawin -digest sha256`,
              [...ecFilesRef.current, msgFile]
            )
            ensureCurrent()
            if (r1.error) throw new Error(`secp256k1 sign failed: ${r1.error}`)

            // PQC sign
            const r2 = await openSSLService.execute(
              DIGITAL_ASSETS_CONSTANTS.COMMANDS.ML_DSA_65.SIGN(
                filenames.mlPriv,
                filenames.msg,
                filenames.mlSig
              ),
              [...mlFilesRef.current, msgFile]
            )
            ensureCurrent()
            if (r2.error) throw new Error(`ML-DSA-65 sign failed: ${r2.error}`)

            requireFile(r1.files, filenames.ecSig)
            requireFile(r2.files, filenames.mlSig)
            // Store sig files
            const ecSigFile = r1.files.find((f) => f.name === filenames.ecSig)
            const mlSigFile = r2.files.find((f) => f.name === filenames.mlSig)

            ecFilesRef.current = [...ecFilesRef.current, msgFile, ...(ecSigFile ? [ecSigFile] : [])]
            mlFilesRef.current = [...mlFilesRef.current, msgFile, ...(mlSigFile ? [mlSigFile] : [])]

            setClassical((prev) => ({
              ...prev,
              sigBytes: ecSigFile?.data.length ?? null,
              signatureOrigin: 'OpenSSL signature file',
              signatureAlgorithm: 'secp256k1',
              signatureInput: `private file ${requestedFiles.ecPriv}; message ${requestedFiles.msg}`,
            }))
            setPqc((prev) => ({
              ...prev,
              sigBytes: mlSigFile?.data.length ?? null,
              signatureOrigin: 'OpenSSL signature file',
              signatureAlgorithm: 'ML-DSA-65',
              signatureInput: `private file ${requestedFiles.mlPriv}; message ${requestedFiles.msg}`,
            }))

            const ratio =
              mlSigFile && ecSigFile
                ? Math.round(mlSigFile.data.length / ecSigFile.data.length)
                : '?'

            return (
              `Message: "${DEMO_MESSAGE}"\n\n` +
              `secp256k1 signature: ${ecSigFile?.data.length ?? '?'} bytes\n` +
              `ML-DSA-65 signature: ${mlSigFile?.data.length ?? '?'} bytes\n` +
              `\nSize ratio: ~${ratio}× larger for ML-DSA-65`
            )
          }

          if (wizard.currentStep === 2) {
            requireFile(ecFilesRef.current, requestedFiles.ecPub)
            requireFile(mlFilesRef.current, requestedFiles.mlPub)
            requireFile(ecFilesRef.current, requestedFiles.ecSig)
            requireFile(mlFilesRef.current, requestedFiles.mlSig)
            // Step 3: Verify both signatures (msg file is in ecFilesRef/mlFilesRef from Step 2)

            // Classical verify — flags must match the sign command (-rawin -digest sha256)
            const r1 = await openSSLService.execute(
              `openssl pkeyutl -verify -pubin -inkey ${filenames.ecPub} -in ${filenames.msg} -sigfile ${filenames.ecSig} -rawin -digest sha256`,
              ecFilesRef.current
            )
            ensureCurrent()

            // PQC verify
            const r2 = await openSSLService.execute(
              DIGITAL_ASSETS_CONSTANTS.COMMANDS.ML_DSA_65.VERIFY(
                filenames.mlPub,
                filenames.msg,
                filenames.mlSig
              ),
              mlFilesRef.current
            )
            ensureCurrent()

            if (r1.error || r2.error)
              throw new Error(`Sample verification operation failed: ${r1.error || r2.error}`)
            const ecVerified = r1.stdout.includes('Signature Verified Successfully')
            const mlVerified = r2.stdout.includes('Signature Verified Successfully')

            setClassical((prev) => ({
              ...prev,
              verified: ecVerified,
              verificationOrigin: 'OpenSSL sample check',
              verificationAlgorithm: 'secp256k1',
              verificationInput: `public file ${requestedFiles.ecPub}; signature ${requestedFiles.ecSig}; message ${requestedFiles.msg}`,
            }))
            setPqc((prev) => ({
              ...prev,
              verified: mlVerified,
              verificationOrigin: 'OpenSSL sample check',
              verificationAlgorithm: 'ML-DSA-65',
              verificationInput: `public file ${requestedFiles.mlPub}; signature ${requestedFiles.mlSig}; message ${requestedFiles.msg}`,
            }))

            if (!ecVerified || !mlVerified)
              throw new Error(
                'A required OpenSSL sample signature check failed. No successful completion is recorded.'
              )
            return (
              `secp256k1 signature: ${ecVerified ? 'Signature Verified Successfully ✓' : 'FAILED ✗'}\n` +
              `ML-DSA-65 signature: ${mlVerified ? 'Signature Verified Successfully ✓' : 'FAILED ✗'}\n` +
              `\nSample check outcomes are reported above. Returned lengths do not establish Bitcoin encoding or deployment interoperability.`
            )
          }

          return 'Step complete.'
        } catch (error) {
          ensureCurrent()
          throw error
        }
      }
      await wizard.execute(async () => {
        const result = await executeCurrent()
        ensureCurrent()
        setCompletedContext({
          module: selectedModule,
          session: selectedSession,
          hsm: hsmRequested,
          step: wizard.currentStep,
        })
        return result
      })
    } finally {
      runBusy.current = false
    }
  }

  return (
    <div className="space-y-4">
      <p role="note" className="text-sm text-muted-foreground">
        Current readiness selects{' '}
        {hsmRequested
          ? 'the HSM sample path (ECDSA P-256 and ML-DSA-65)'
          : 'the OpenSSL sample path (secp256k1 and ML-DSA-65)'}
        . This path follows provider availability, not a recorded learner preference. Command
        snippets describe the software path, not HSM execution. Returned key, signature and check
        outputs retain their own recorded origins; this view does not establish that retained stages
        share one provider/key run. No Bitcoin transaction is serialized here.
      </p>
      <LiveHSMToggle hsm={hsm} operations={COMPARISON_LIVE_OPERATIONS} />
      <StepWizard
        steps={steps}
        currentStepIndex={wizard.currentStep}
        onNext={wizard.handleNext}
        onBack={wizard.handleBack}
        onComplete={onComplete ?? onBack}
        onExecute={executeStep}
        isExecuting={wizard.isExecuting}
        output={wizard.output}
        error={wizard.error}
        isStepComplete={wizard.isStepComplete && completionMatches}
      />
      {hsm.isReady && (
        <div className="space-y-4">
          <Pkcs11LogPanel
            log={hsm.log}
            onClear={hsm.clearLog}
            title="PKCS#11 Call Log — PQC vs Classical"
            emptyMessage="Click 'Generate Both Keypairs' to see live PKCS#11 operations."
            filterFns={COMPARISON_LIVE_OPERATIONS}
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
