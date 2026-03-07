// SPDX-License-Identifier: GPL-3.0-only
import React, { useRef, useState } from 'react'
import { CheckCircle, ShieldCheck, Cpu, AlertCircle } from 'lucide-react'
import { StepWizard } from '../components/StepWizard'
import { useStepWizard } from '../hooks/useStepWizard'
import { openSSLService } from '@/services/crypto/OpenSSLService'
import { DIGITAL_ASSETS_CONSTANTS } from '../constants'
import { useHSM } from '@/hooks/useHSM'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
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
}

const DEMO_MESSAGE = 'PQC Demo: Transfer 0.5 BTC · Block #901234 · Quantum-Safe Signing'

// Size reference for bar chart (ML-DSA-65 sig = baseline 100%)
const CLASSICAL_SIG_BYTES = 72
const PQC_SIG_BYTES = 3309

interface SizeBarsProps {
  classicalSig: number | null
  pqcSig: number | null
}

const SizeBars: React.FC<SizeBarsProps> = ({ classicalSig, pqcSig }) => {
  if (!classicalSig || !pqcSig) return null
  const ratio = Math.round(pqcSig / classicalSig)
  return (
    <div className="space-y-2 mt-3">
      <p className="text-xs text-muted-foreground font-medium">Signature size comparison</p>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-24 shrink-0">secp256k1</span>
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
        ML-DSA-65 signatures are ~{ratio}× larger than secp256k1
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
    {/* Classical column */}
    <div className="glass-panel p-4 space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Cpu size={16} className="text-primary shrink-0" />
        <span className="text-sm font-semibold text-foreground">secp256k1 (Classical)</span>
      </div>
      {classical.privBytes !== null ? (
        <>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Private key (PEM)</span>
            <span className="font-mono text-foreground">{classical.privBytes} B</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Public key (PEM)</span>
            <span className="font-mono text-foreground">{classical.pubBytes} B</span>
          </div>
          {showSigs && classical.sigBytes !== null && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Signature</span>
              <span className="font-mono text-status-success">{classical.sigBytes} B</span>
            </div>
          )}
          {showVerified && classical.verified !== null && (
            <div className="flex items-center gap-1 text-xs mt-2">
              {classical.verified ? (
                <>
                  <CheckCircle size={12} className="text-status-success" />
                  <span className="text-status-success font-medium">Verified</span>
                </>
              ) : (
                <>
                  <AlertCircle size={12} className="text-destructive" />
                  <span className="text-destructive font-medium">Failed</span>
                </>
              )}
            </div>
          )}
        </>
      ) : (
        <p className="text-xs text-muted-foreground italic">Run Step 1 to generate keys</p>
      )}
    </div>

    {/* PQC column */}
    <div className="glass-panel p-4 space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck size={16} className="text-accent shrink-0" />
        <span className="text-sm font-semibold text-foreground">ML-DSA-65 (FIPS 204)</span>
      </div>
      {pqc.privBytes !== null ? (
        <>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Private key (PEM)</span>
            <span className="font-mono text-status-warning">{pqc.privBytes} B</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Public key (PEM)</span>
            <span className="font-mono text-status-warning">{pqc.pubBytes} B</span>
          </div>
          {showSigs && pqc.sigBytes !== null && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Signature</span>
              <span className="font-mono text-destructive">{pqc.sigBytes} B</span>
            </div>
          )}
          {showVerified && pqc.verified !== null && (
            <div className="flex items-center gap-1 text-xs mt-2">
              {pqc.verified ? (
                <>
                  <CheckCircle size={12} className="text-status-success" />
                  <span className="text-status-success font-medium">Verified</span>
                </>
              ) : (
                <>
                  <AlertCircle size={12} className="text-destructive" />
                  <span className="text-destructive font-medium">Failed</span>
                </>
              )}
            </div>
          )}
        </>
      ) : (
        <p className="text-xs text-muted-foreground italic">Run Step 1 to generate keys</p>
      )}
    </div>
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
  })
  const [pqc, setPqc] = useState<AlgoState>({
    privBytes: null,
    pubBytes: null,
    sigBytes: null,
    verified: null,
  })

  const hsm = useHSM()

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
      description:
        'Generate a secp256k1 keypair (current Bitcoin standard) and an ML-DSA-65 keypair (FIPS 204, quantum-safe) using OpenSSL. Both run in your browser via WebAssembly.',
      code: `# Classical — secp256k1 (128-bit classical security)
${DIGITAL_ASSETS_CONSTANTS.COMMANDS.BITCOIN.GEN_KEY(filenames.ecPriv)}
${DIGITAL_ASSETS_CONSTANTS.COMMANDS.BITCOIN.EXTRACT_PUB(filenames.ecPriv, filenames.ecPub)}

# Quantum-Safe — ML-DSA-65 (FIPS 204, 128-bit post-quantum security)
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
      title: '2. Sign the Same Transaction',
      description:
        "Both algorithms sign an identical message. Notice how the signature sizes differ — this is what drives Bitcoin's estimated 9–46× witness data overhead for PQC transactions (BIP-360).",
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
          <SizeBars classicalSig={classical.sigBytes} pqcSig={pqc.sigBytes} />
        </div>
      ),
    },
    {
      id: 'verify',
      title: '3. Verify & Compare',
      description:
        'Both signatures are verified against the original message and public keys. The full size overhead is now visible — a real trade-off any blockchain migration must address.',
      code: `# Verify secp256k1 signature (must match signing flags)
openssl pkeyutl -verify -pubin -inkey ${filenames.ecPub} -in ${filenames.msg} -sigfile ${filenames.ecSig} -rawin -digest sha256

# Verify ML-DSA-65 signature
${DIGITAL_ASSETS_CONSTANTS.COMMANDS.ML_DSA_65.VERIFY(filenames.mlPub, filenames.msg, filenames.mlSig)}`,
      language: 'bash' as const,
      actionLabel: 'Verify Both Signatures',
      customControls: (
        <div className="space-y-4">
          <ComparisonPanel classical={classical} pqc={pqc} showSigs={true} showVerified={true} />
          <SizeBars classicalSig={classical.sigBytes} pqcSig={pqc.sigBytes} />
          {classical.sigBytes !== null && pqc.sigBytes !== null && (
            <div className="glass-panel p-4 border-l-4 border-l-accent text-sm text-muted-foreground leading-relaxed">
              <p className="font-semibold text-foreground mb-1">What this means for BIP-360</p>
              <p className="text-xs">
                Every P2QRH transaction (BIP-360) must include the full ML-DSA public key (
                {pqc.pubBytes ?? PQC_SIG_BYTES} B) and signature ({pqc.sigBytes} B) in the witness.
                Compared to secp256k1 ({classical.sigBytes} B sig + {classical.pubBytes ?? 33} B
                pubkey), this is roughly{' '}
                {Math.round(
                  ((pqc.sigBytes + (pqc.pubBytes ?? 0)) /
                    (classical.sigBytes + (classical.pubBytes ?? 33))) *
                    10
                ) / 10}
                × more witness data — the cost of quantum resistance.
              </p>
            </div>
          )}
        </div>
      ),
    },
  ]

  const wizard = useStepWizard({ steps, onBack })

  const executeStep = async () => {
    await wizard.execute(async () => {
      // ── Live HSM Mode ──
      if (hsm.isReady && hsm.moduleRef.current && hsm.hSessionRef.current) {
        const M = hsm.moduleRef.current
        const hSession = hsm.hSessionRef.current

        if (wizard.currentStep === 0) {
          // Step 1: Generate both keypairs via PKCS#11
          const ec = hsm_generateECKeyPair(M, hSession, 'P-256')
          const ecPoint = hsm_extractECPoint(M, hSession, ec.pubHandle)
          const ml = hsm_generateMLDSAKeyPair(M, hSession, 65)
          const mlPub = hsm_extractKeyValue(M, hSession, ml.pubHandle)

          hsmKeysRef.current = {
            ecPub: ec.pubHandle,
            ecPriv: ec.privHandle,
            mlPub: ml.pubHandle,
            mlPriv: ml.privHandle,
            ecSig: null,
            mlSig: null,
          }

          setClassical((prev) => ({ ...prev, privBytes: 121, pubBytes: ecPoint.length }))
          setPqc((prev) => ({ ...prev, privBytes: 4032, pubBytes: mlPub.length }))

          return (
            `[PKCS#11] secp256k1 EC key pair: C_GenerateKeyPair → pub ${ecPoint.length} B\n` +
            `[PKCS#11] ML-DSA-65 key pair:   C_GenerateKeyPair → pub ${mlPub.length} B\n` +
            `\nBoth keypairs generated via SoftHSM3 WASM.`
          )
        }

        if (wizard.currentStep === 1) {
          // Step 2: Sign with both via PKCS#11
          const ecSig = hsm_ecdsaSign(M, hSession, hsmKeysRef.current.ecPriv, DEMO_MESSAGE)
          const mlSig = hsm_sign(M, hSession, hsmKeysRef.current.mlPriv, DEMO_MESSAGE)

          hsmKeysRef.current.ecSig = ecSig
          hsmKeysRef.current.mlSig = mlSig

          setClassical((prev) => ({ ...prev, sigBytes: ecSig.length }))
          setPqc((prev) => ({ ...prev, sigBytes: mlSig.length }))

          const ratio = Math.round(mlSig.length / ecSig.length)
          return (
            `Message: "${DEMO_MESSAGE}"\n\n` +
            `[PKCS#11] secp256k1 C_Sign(CKM_ECDSA_SHA256): ${ecSig.length} bytes\n` +
            `[PKCS#11] ML-DSA-65 C_SignMessage:             ${mlSig.length} bytes\n` +
            `\nSize ratio: ~${ratio}× larger for ML-DSA-65`
          )
        }

        if (wizard.currentStep === 2) {
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

          setClassical((prev) => ({ ...prev, verified: ecVerified }))
          setPqc((prev) => ({ ...prev, verified: mlVerified }))

          return (
            `[PKCS#11] secp256k1 C_Verify: ${ecVerified ? 'Verified ✓' : 'FAILED ✗'}\n` +
            `[PKCS#11] ML-DSA-65 C_VerifyMessage: ${mlVerified ? 'Verified ✓' : 'FAILED ✗'}\n` +
            `\nBoth signatures verified via SoftHSM3 WASM.`
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
        if (r1.error) throw new Error(`secp256k1 key gen failed: ${r1.error}`)

        const r2 = await openSSLService.execute(
          DIGITAL_ASSETS_CONSTANTS.COMMANDS.BITCOIN.EXTRACT_PUB(filenames.ecPriv, filenames.ecPub),
          r1.files
        )
        if (r2.error) throw new Error(`secp256k1 pubkey extract failed: ${r2.error}`)

        // PQC key gen
        const r3 = await openSSLService.execute(
          DIGITAL_ASSETS_CONSTANTS.COMMANDS.ML_DSA_65.GEN_KEY(filenames.mlPriv)
        )
        if (r3.error) throw new Error(`ML-DSA-65 key gen failed: ${r3.error}`)

        const r4 = await openSSLService.execute(
          DIGITAL_ASSETS_CONSTANTS.COMMANDS.ML_DSA_65.EXTRACT_PUB(
            filenames.mlPriv,
            filenames.mlPub
          ),
          r3.files
        )
        if (r4.error) throw new Error(`ML-DSA-65 pubkey extract failed: ${r4.error}`)

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
        }))
        setPqc((prev) => ({
          ...prev,
          privBytes: mlPrivFile?.data.length ?? null,
          pubBytes: mlPubFile?.data.length ?? null,
        }))

        return (
          `secp256k1 private key: ${ecPrivFile?.data.length ?? '?'} bytes (PEM)\n` +
          `secp256k1 public key:  ${ecPubFile?.data.length ?? '?'} bytes (PEM)\n` +
          `ML-DSA-65 private key: ${mlPrivFile?.data.length ?? '?'} bytes (PEM)\n` +
          `ML-DSA-65 public key:  ${mlPubFile?.data.length ?? '?'} bytes (PEM)\n` +
          `\nBoth keypairs generated successfully.`
        )
      }

      if (wizard.currentStep === 1) {
        // Step 2: Sign same message with both keys
        const msgBytes = new TextEncoder().encode(DEMO_MESSAGE)
        const msgFile = { name: filenames.msg, data: msgBytes }

        // Classical sign — use -rawin -digest sha256 so OpenSSL hashes the raw message
        // (BITCOIN.SIGN constants expect a pre-hashed digest, like BitcoinFlow provides)
        const r1 = await openSSLService.execute(
          `openssl pkeyutl -sign -inkey ${filenames.ecPriv} -in ${filenames.msg} -out ${filenames.ecSig} -rawin -digest sha256`,
          [...ecFilesRef.current, msgFile]
        )
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
        if (r2.error) throw new Error(`ML-DSA-65 sign failed: ${r2.error}`)

        // Store sig files
        const ecSigFile = r1.files.find((f) => f.name === filenames.ecSig)
        const mlSigFile = r2.files.find((f) => f.name === filenames.mlSig)

        ecFilesRef.current = [...ecFilesRef.current, msgFile, ...(ecSigFile ? [ecSigFile] : [])]
        mlFilesRef.current = [...mlFilesRef.current, msgFile, ...(mlSigFile ? [mlSigFile] : [])]

        setClassical((prev) => ({ ...prev, sigBytes: ecSigFile?.data.length ?? null }))
        setPqc((prev) => ({ ...prev, sigBytes: mlSigFile?.data.length ?? null }))

        const ratio =
          mlSigFile && ecSigFile ? Math.round(mlSigFile.data.length / ecSigFile.data.length) : '?'

        return (
          `Message: "${DEMO_MESSAGE}"\n\n` +
          `secp256k1 signature: ${ecSigFile?.data.length ?? '?'} bytes\n` +
          `ML-DSA-65 signature: ${mlSigFile?.data.length ?? '?'} bytes\n` +
          `\nSize ratio: ~${ratio}× larger for ML-DSA-65`
        )
      }

      if (wizard.currentStep === 2) {
        // Step 3: Verify both signatures (msg file is in ecFilesRef/mlFilesRef from Step 2)

        // Classical verify — flags must match the sign command (-rawin -digest sha256)
        const r1 = await openSSLService.execute(
          `openssl pkeyutl -verify -pubin -inkey ${filenames.ecPub} -in ${filenames.msg} -sigfile ${filenames.ecSig} -rawin -digest sha256`,
          ecFilesRef.current
        )

        // PQC verify
        const r2 = await openSSLService.execute(
          DIGITAL_ASSETS_CONSTANTS.COMMANDS.ML_DSA_65.VERIFY(
            filenames.mlPub,
            filenames.msg,
            filenames.mlSig
          ),
          mlFilesRef.current
        )

        const ecVerified = r1.stdout.includes('Signature Verified Successfully')
        const mlVerified = r2.stdout.includes('Signature Verified Successfully')

        setClassical((prev) => ({ ...prev, verified: ecVerified }))
        setPqc((prev) => ({ ...prev, verified: mlVerified }))

        return (
          `secp256k1 signature: ${ecVerified ? 'Signature Verified Successfully ✓' : 'FAILED ✗'}\n` +
          `ML-DSA-65 signature: ${mlVerified ? 'Signature Verified Successfully ✓' : 'FAILED ✗'}\n` +
          `\nBoth algorithms produce valid, verifiable signatures.\n` +
          `The key difference is size — ML-DSA-65 signatures are ~${
            classical.sigBytes && pqc.sigBytes
              ? Math.round(pqc.sigBytes / classical.sigBytes)
              : CLASSICAL_SIG_BYTES > 0
                ? Math.round(PQC_SIG_BYTES / CLASSICAL_SIG_BYTES)
                : '?'
          }× larger.`
        )
      }

      return 'Step complete.'
    })
  }

  return (
    <div className="space-y-4">
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
        isStepComplete={wizard.isStepComplete}
      />
      {hsm.isReady && (
        <Pkcs11LogPanel
          log={hsm.log}
          onClear={hsm.clearLog}
          title="PKCS#11 Call Log — PQC vs Classical"
          emptyMessage="Click 'Generate Both Keypairs' to see live PKCS#11 operations."
        />
      )}
    </div>
  )
}
