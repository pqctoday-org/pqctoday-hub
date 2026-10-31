// SPDX-License-Identifier: AGPL-3.0-only
import { readAlgorithmLaunch } from '@/data/algorithmLaunch'
import { HpkeWorkshop } from './HpkeWorkshop'
import React, { useCallback, useRef } from 'react'
import { Link } from 'react-router'
import { useHSM, type HsmKey } from '@/hooks/useHSM'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import { HsmKeyInspector } from '@/components/shared/HsmKeyInspector'
import { StepWizard } from '@/components/PKILearning/modules/DigitalAssets/components/StepWizard'
import type { Step } from '@/components/PKILearning/modules/DigitalAssets/components/StepWizard'
import { useStepWizard } from '@/components/PKILearning/modules/DigitalAssets/hooks/useStepWizard'
import { WorkshopOperationLog } from '@/components/PKILearning/common/WorkshopOperationLog'
import {
  hsm_generateECKeyPair,
  hsm_generateMLKEMKeyPair,
  hsm_extractECPoint,
  hsm_ecdhDerive,
  hsm_encapsulate,
  hsm_decapsulate,
  hsm_extractKeyValue,
} from '@/wasm/softhsm'
import { combineHybridSecrets, HYBRID_KEM_INFO } from '../services/hybridKemCombiner'

// ── PKCS#11 operations exercised by this demo ────────────────────────────────
const HYBRID_LIVE_OPERATIONS = [
  'C_GenerateKeyPair',
  'C_DeriveKey',
  'C_EncapsulateKey',
  'C_DecapsulateKey',
  'C_CreateObject',
]

// ── Per-step state (handles + extracted bytes) ───────────────────────────────
interface HybridState {
  alicePubHandle: number
  alicePrivHandle: number
  bobPubHandle: number
  bobPrivHandle: number
  ecdhSSHandle: number
  ecdhSSBytes: Uint8Array
  kemPubHandle: number
  kemPrivHandle: number
  ciphertextBytes: Uint8Array
  kemSSBytes: Uint8Array
  hybridKey: Uint8Array
}

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

// ── Step definitions ─────────────────────────────────────────────────────────
const STEPS: Step[] = [
  {
    id: 'alice-keygen',
    title: 'Step 1 — Alice X25519 Keypair',
    description:
      'Alice generates an ephemeral X25519 (Curve25519) keypair. The 32-byte public key will be shared with Bob for ECDH key agreement.',
    code: `const { pubHandle, privHandle } = hsm_generateECKeyPair(\n  module, session,\n  'X25519', false, 'Alice X25519'\n)`,
    language: 'javascript',
    actionLabel: 'Generate Alice Keypair',
    explanationTable: [
      {
        label: 'Mechanism',
        value: 'CKM_EC_MONTGOMERY_KEY_PAIR_GEN (0x1056)',
        description: 'PKCS#11 v3.2 mechanism for Curve25519/Curve448 keypair generation',
      },
      {
        label: 'Curve',
        value: 'X25519 (Curve25519)',
        description: 'Montgomery-form elliptic curve; public key is the 32-byte u-coordinate',
      },
      {
        label: 'CKA_DERIVE',
        value: 'true',
        description: 'Key is authorized for CKM_ECDH1_DERIVE — required for ECDH key agreement',
      },
      {
        label: 'Public Key Size',
        value: '32 bytes',
        description: 'Compact vs 65 bytes for an uncompressed P-256 public key',
      },
    ],
  },
  {
    id: 'bob-keygen',
    title: 'Step 2 — Bob X25519 Keypair',
    description:
      'Bob generates his own X25519 keypair. Both parties now hold key material for bidirectional ECDH. The Diffie-Hellman property guarantees they will arrive at the same shared secret.',
    code: `const { pubHandle, privHandle } = hsm_generateECKeyPair(\n  module, session,\n  'X25519', false, 'Bob X25519'\n)`,
    language: 'javascript',
    actionLabel: 'Generate Bob Keypair',
    explanationTable: [
      {
        label: 'Protocol Role',
        value: 'Recipient',
        description:
          'Bob publishes his X25519 public key; Alice uses it to compute the shared secret',
      },
      {
        label: 'Key Usage',
        value: 'Derive-only',
        description:
          'Montgomery keys have no CKA_SIGN/CKA_VERIFY — X25519 is not a signature algorithm. CKA_DERIVE=true is set automatically.',
      },
    ],
  },
  {
    id: 'ecdh-agree',
    title: 'Step 3 — ECDH Key Agreement',
    description:
      'ECDH is computed in both directions (Alice→Bob and Bob→Alice) and the 32-byte shared secrets are compared. The Diffie-Hellman property guarantees both parties arrive at the same value without ever transmitting the secret.',
    code: `const ssA = hsm_ecdhDerive(module, session, alicePriv, bobPubBytes)\nconst ssB = hsm_ecdhDerive(module, session, bobPriv, alicePubBytes)\n// assert toHex(ssA) === toHex(ssB)`,
    language: 'javascript',
    actionLabel: 'Compute ECDH',
    explanationTable: [
      {
        label: 'Mechanism',
        value: 'CKM_ECDH1_DERIVE (0x1050)',
        description:
          'Works for both Weierstrass (P-256) and Montgomery (X25519) curves in softhsmv3',
      },
      {
        label: 'KDF',
        value: 'CKD_NULL',
        description:
          'Raw DH u-coordinate output; combined with the ML-KEM secret and passed through HKDF in Step 6',
      },
      {
        label: 'Output',
        value: '32-byte CKK_GENERIC_SECRET (CKA_DERIVE=true)',
        description: 'Its bytes become the second half of the HKDF input in Step 6',
      },
      {
        label: 'Verification',
        value: 'Both-ways match',
        description: 'Alice→Bob secret === Bob→Alice secret — confirms correct DH behaviour',
      },
    ],
  },
  {
    id: 'mlkem-keygen',
    title: 'Step 4 — ML-KEM-768 Keypair',
    description:
      "The recipient (Bob) generates an ML-KEM-768 keypair. ML-KEM is a lattice-based Key Encapsulation Mechanism standardised in FIPS 203, resistant to both Grover's algorithm (symmetric) and Shor's algorithm (asymmetric).",
    code: `const { pubHandle, privHandle } = hsm_generateMLKEMKeyPair(\n  module, session, 768\n)`,
    language: 'javascript',
    actionLabel: 'Generate ML-KEM Keypair',
    explanationTable: [
      {
        label: 'Mechanism',
        value: 'CKM_ML_KEM_KEY_PAIR_GEN',
        description: 'PKCS#11 v3.2 keypair generation for ML-KEM (FIPS 203)',
      },
      {
        label: 'Public Key (ek)',
        value: '1,184 bytes',
        description: 'FIPS 203 §7.2 ML-KEM-768 encapsulation key size',
      },
      {
        label: 'Decapsulation Key (dk)',
        value: '2,400 bytes',
        description:
          'Includes ek for internal re-encryption and z for implicit rejection (FIPS 203 §6.3)',
      },
      {
        label: 'Shared Secret',
        value: 'Always 32 bytes',
        description: 'All ML-KEM parameter sets produce a 32-byte shared secret (FIPS 203 §7)',
      },
    ],
  },
  {
    id: 'mlkem-encap',
    title: 'Step 5 — ML-KEM Encapsulation',
    description:
      "Alice encapsulates a fresh random shared secret using Bob's ML-KEM-768 public key. The 1,088-byte ciphertext is sent to Bob. Only Bob (holding the private decapsulation key) can recover the same 32-byte shared secret.",
    code: `const { ciphertextBytes, secretHandle } =\n  hsm_encapsulate(module, session, kemPubHandle, 768)`,
    language: 'javascript',
    actionLabel: 'Encapsulate',
    explanationTable: [
      {
        label: 'Ciphertext',
        value: '1,088 bytes',
        description: 'ML-KEM-768 ciphertext size (FIPS 203 §7)',
      },
      {
        label: 'Security',
        value: 'IND-CCA2',
        description:
          'Indistinguishable under adaptive chosen-ciphertext attack — secure against harvest-now-decrypt-later (HNDL)',
      },
      {
        label: 'Randomness',
        value: 'HSM-internal',
        description:
          "Encapsulation randomness generated inside softhsmv3 WASM; Alice's random coins are never exported",
      },
    ],
  },
  {
    id: 'hkdf-combine',
    title: 'Step 6 — Decapsulate & HKDF Combine',
    description:
      'Bob decapsulates the ML-KEM ciphertext, then concatenates the two shared secrets, ML-KEM first and X25519 second (the order RFC 10024 §4.3 gives for X25519MLKEM768), and feeds the 64 bytes into HKDF-SHA-256 to get a 32-byte hybrid session key. Feeding the concatenation into an SP 800-56C KDF such as HKDF is the combiner form CMVP IG D.S accepts, and SP 800-227 §4.6 describes the aim: the result is secure if at least one component is. A quantum break of X25519 alone, or a flaw in ML-KEM alone, should not expose the session key.',
    code: `const kemSS = hsm_extractKeyValue(module, session,\n  hsm_decapsulate(module, session, kemPriv, ct, 768))\n// RFC 10024 §4.3 order for X25519MLKEM768: ML-KEM_ss || X25519_ss\nconst ikm = concat(kemSS, ecdhSS)            // 64 bytes\nconst ikmHandle = hsm_importGenericSecret(module, session, ikm)\nconst hybridKey = hsm_hkdf(\n  module, session, ikmHandle,\n  CKM_SHA256, true, true,\n  undefined,                                  // no salt: HKDF uses HashLen zero bytes\n  encode('hybrid-kem-x25519-mlkem768-v1'),\n  32\n)`,
    language: 'javascript',
    actionLabel: 'Decapsulate & Combine',
    explanationTable: [
      {
        label: 'HKDF-Extract IKM',
        value: 'ML-KEM shared secret || X25519 shared secret (64 bytes)',
        description:
          'Both secrets are the input key material, concatenated in the RFC 10024 §4.3 order for X25519MLKEM768 (ML-KEM first). IG D.S approves a concatenation of the shared secrets fed into an SP 800-56C KDF, and names HKDF (RFC 5869) as included',
      },
      {
        label: 'HKDF-Extract Salt',
        value: 'None (HKDF default: 32 zero bytes)',
        description:
          'No secret goes in the salt. Placing one shared secret in the salt and the other in the input is not the combiner form IG D.S lists, so this demo concatenates them instead (RFC 5869 §2.2: with no salt, HKDF uses HashLen zero bytes)',
      },
      {
        label: 'Info',
        value: '"hybrid-kem-x25519-mlkem768-v1"',
        description:
          'Domain-separation string identifies the composite scheme in use (SP 800-227 §4.6.3)',
      },
      {
        label: 'Output',
        value: '32 bytes (256-bit hybrid session key)',
        description:
          'Meant to stay secret if either the X25519 or the ML-KEM-768 secret does (SP 800-227 §4.6: a well-designed multi-algorithm scheme is secure if at least one component is)',
      },
    ],
  },
]

// ── Component ────────────────────────────────────────────────────────────────
const HybridKemDemo: React.FC<{ initialStep?: number }> = ({ initialStep }) => {
  const hsm = useHSM()
  const stateRef = useRef<Partial<HybridState>>({})
  const wizard = useStepWizard({ steps: STEPS, onBack: () => {}, initialStep })

  const executeCurrentStep = useCallback(async (): Promise<string> => {
    if (!hsm.isReady || !hsm.moduleRef.current || !hsm.hSessionRef.current) {
      throw new Error('HSM session is not ready. Enable the HSM toggle above first.')
    }
    const M = hsm.moduleRef.current
    const hSession = hsm.hSessionRef.current

    switch (wizard.currentStep) {
      case 0: {
        // Alice X25519 keypair
        const { pubHandle, privHandle } = hsm_generateECKeyPair(
          M,
          hSession,
          'X25519',
          false,
          'Alice X25519'
        )
        stateRef.current.alicePubHandle = pubHandle
        stateRef.current.alicePrivHandle = privHandle
        hsm.registerKey(M, hSession, {
          handle: pubHandle,
          label: 'Alice X25519 Pub',
          family: 'ecdh',
          role: 'public',
          generatedAt: new Date().toISOString(),
        })
        hsm.registerKey(M, hSession, {
          handle: privHandle,
          label: 'Alice X25519 Priv',
          family: 'ecdh',
          role: 'private',
          generatedAt: new Date().toISOString(),
        })
        const alicePubBytes = hsm_extractECPoint(M, hSession, pubHandle)
        hsm.addStepLog('Step 1 — Alice X25519 Keypair')
        return (
          `Alice X25519 pub handle : ${pubHandle}\n` +
          `Alice X25519 priv handle: ${privHandle}\n\n` +
          `Public key (32 B):\n${toHex(alicePubBytes)}\n\n` +
          `Mechanism: CKM_EC_MONTGOMERY_KEY_PAIR_GEN (0x1056)`
        )
      }

      case 1: {
        // Bob X25519 keypair
        const { pubHandle, privHandle } = hsm_generateECKeyPair(
          M,
          hSession,
          'X25519',
          false,
          'Bob X25519'
        )
        stateRef.current.bobPubHandle = pubHandle
        stateRef.current.bobPrivHandle = privHandle
        hsm.registerKey(M, hSession, {
          handle: pubHandle,
          label: 'Bob X25519 Pub',
          family: 'ecdh',
          role: 'public',
          generatedAt: new Date().toISOString(),
        })
        hsm.registerKey(M, hSession, {
          handle: privHandle,
          label: 'Bob X25519 Priv',
          family: 'ecdh',
          role: 'private',
          generatedAt: new Date().toISOString(),
        })
        const bobPubBytes = hsm_extractECPoint(M, hSession, pubHandle)
        hsm.addStepLog('Step 2 — Bob X25519 Keypair')
        return (
          `Bob X25519 pub handle : ${pubHandle}\n` +
          `Bob X25519 priv handle: ${privHandle}\n\n` +
          `Public key (32 B):\n${toHex(bobPubBytes)}\n\n` +
          `Mechanism: CKM_EC_MONTGOMERY_KEY_PAIR_GEN (0x1056)`
        )
      }

      case 2: {
        // ECDH in both directions
        if (
          stateRef.current.alicePubHandle == null ||
          stateRef.current.alicePrivHandle == null ||
          stateRef.current.bobPubHandle == null ||
          stateRef.current.bobPrivHandle == null
        ) {
          throw new Error('Complete Steps 1 and 2 first.')
        }
        const alicePubBytes = hsm_extractECPoint(M, hSession, stateRef.current.alicePubHandle)
        const bobPubBytes = hsm_extractECPoint(M, hSession, stateRef.current.bobPubHandle)

        // Alice priv × Bob pub
        const ssAHandle = hsm_ecdhDerive(
          M,
          hSession,
          stateRef.current.alicePrivHandle,
          bobPubBytes,
          undefined,
          undefined,
          { keyLen: 32, derive: true, extractable: true }
        )
        const ssABytes = hsm_extractKeyValue(M, hSession, ssAHandle)

        // Bob priv × Alice pub
        const ssBHandle = hsm_ecdhDerive(
          M,
          hSession,
          stateRef.current.bobPrivHandle,
          alicePubBytes,
          undefined,
          undefined,
          { keyLen: 32, derive: true, extractable: true }
        )
        const ssBBytes = hsm_extractKeyValue(M, hSession, ssBHandle)

        const match = toHex(ssABytes) === toHex(ssBBytes)
        stateRef.current.ecdhSSHandle = ssAHandle
        stateRef.current.ecdhSSBytes = ssABytes

        hsm.registerKey(M, hSession, {
          handle: ssAHandle,
          label: 'ECDH Shared Secret',
          family: 'aes',
          role: 'secret',
          purpose: 'application',
          generatedAt: new Date().toISOString(),
        })
        hsm.addStepLog('Step 3 — ECDH Key Agreement')
        return (
          `Alice→Bob ECDH shared secret:\n${toHex(ssABytes)}\n\n` +
          `Bob→Alice ECDH shared secret:\n${toHex(ssBBytes)}\n\n` +
          `Match: ${match ? '✓ Verified — both parties derive identical 32-byte shared secret' : '✗ MISMATCH — unexpected error'}\n\n` +
          `Mechanism: CKM_ECDH1_DERIVE (0x1050), KDF: CKD_NULL`
        )
      }

      case 3: {
        // ML-KEM-768 keypair
        const { pubHandle, privHandle } = hsm_generateMLKEMKeyPair(
          M,
          hSession,
          768,
          false,
          'ML-KEM-768 Recipient'
        )
        stateRef.current.kemPubHandle = pubHandle
        stateRef.current.kemPrivHandle = privHandle
        hsm.registerKey(M, hSession, {
          handle: pubHandle,
          label: 'ML-KEM-768 Pub',
          family: 'ml-kem',
          role: 'public',
          generatedAt: new Date().toISOString(),
        })
        hsm.registerKey(M, hSession, {
          handle: privHandle,
          label: 'ML-KEM-768 Priv',
          family: 'ml-kem',
          role: 'private',
          generatedAt: new Date().toISOString(),
        })
        hsm.addStepLog('Step 4 — ML-KEM-768 Keypair')
        return (
          `ML-KEM-768 pub handle : ${pubHandle}  (1,184-byte encapsulation key)\n` +
          `ML-KEM-768 priv handle: ${privHandle} (2,400-byte decapsulation key)\n\n` +
          `Mechanism: CKM_ML_KEM_KEY_PAIR_GEN\n` +
          `Standard:  FIPS 203 (Module-Lattice-Based Key-Encapsulation Mechanism Standard)`
        )
      }

      case 4: {
        // ML-KEM encapsulation
        if (stateRef.current.kemPubHandle == null) {
          throw new Error('Complete Step 4 (ML-KEM keygen) first.')
        }
        const { ciphertextBytes, secretHandle } = hsm_encapsulate(
          M,
          hSession,
          stateRef.current.kemPubHandle,
          768
        )
        const kemSSBytes = hsm_extractKeyValue(M, hSession, secretHandle)
        stateRef.current.ciphertextBytes = ciphertextBytes
        stateRef.current.kemSSBytes = kemSSBytes

        hsm.registerKey(M, hSession, {
          handle: secretHandle,
          label: 'ML-KEM Encap Secret',
          family: 'aes',
          role: 'secret',
          purpose: 'application',
          generatedAt: new Date().toISOString(),
        })
        hsm.addStepLog('Step 5 — ML-KEM Encapsulation')
        return (
          `Ciphertext (${ciphertextBytes.length} bytes):\n` +
          `${toHex(ciphertextBytes).slice(0, 128)}...[truncated]\n\n` +
          `Encapsulated KEM shared secret (32 B):\n${toHex(kemSSBytes)}\n\n` +
          `Mechanism: C_EncapsulateKey(CKM_ML_KEM)\n` +
          `Security: IND-CCA2 — quantum-resistant under MLWE hardness assumption`
        )
      }

      case 5: {
        // Decapsulate + HKDF combine
        if (
          stateRef.current.kemPrivHandle == null ||
          stateRef.current.ciphertextBytes == null ||
          stateRef.current.kemSSBytes == null ||
          stateRef.current.ecdhSSBytes == null
        ) {
          throw new Error('Complete Steps 1–5 first.')
        }

        // Decapsulate
        const decapSSHandle = hsm_decapsulate(
          M,
          hSession,
          stateRef.current.kemPrivHandle,
          stateRef.current.ciphertextBytes,
          768
        )
        const decapSSBytes = hsm_extractKeyValue(M, hSession, decapSSHandle)
        const kemMatch = toHex(stateRef.current.kemSSBytes) === toHex(decapSSBytes)

        hsm.registerKey(M, hSession, {
          handle: decapSSHandle,
          label: 'ML-KEM Decap Secret',
          family: 'aes',
          role: 'secret',
          purpose: 'application',
          generatedAt: new Date().toISOString(),
        })

        // Combine: HKDF-SHA-256 over ML-KEM_ss || X25519_ss (RFC 10024 section 4.3 order), no salt
        const combined = combineHybridSecrets(
          M,
          hSession,
          decapSSBytes,
          stateRef.current.ecdhSSBytes
        )
        stateRef.current.hybridKey = combined.key

        hsm.registerKey(M, hSession, {
          handle: combined.ikmHandle,
          label: 'Hybrid IKM (ML-KEM SS || X25519 SS)',
          family: 'aes',
          role: 'secret',
          purpose: 'application',
          generatedAt: new Date().toISOString(),
        })

        hsm.registerKey(M, hSession, {
          handle: combined.keyHandle,
          label: 'Hybrid Session Key',
          family: 'aes',
          role: 'secret',
          purpose: 'application',
          generatedAt: new Date().toISOString(),
        })

        hsm.addStepLog('Step 6 — Decapsulate & HKDF Combine')
        return (
          `Decapsulated KEM secret (32 B):\n${toHex(decapSSBytes)}\n` +
          `Encapsulated KEM secret (32 B):\n${toHex(stateRef.current.kemSSBytes)}\n` +
          `KEM match: ${kemMatch ? '✓ Verified' : '✗ MISMATCH'}\n\n` +
          `─────────────────────────────────────────────\n` +
          `HKDF-SHA-256 inputs\n` +
          `  IKM  (ML-KEM SS || X25519 SS, 64 B):\n    ${toHex(combined.ikm)}\n` +
          `  Salt: none (HKDF default: 32 zero bytes)\n` +
          `  Info: "${HYBRID_KEM_INFO}"\n\n` +
          `32-byte hybrid session key:\n${toHex(combined.key)}\n\n` +
          `Combiner form: both secrets concatenated, ML-KEM first (RFC 10024 §4.3), then HKDF\n` +
          `  (an SP 800-56C KDF, as CMVP IG D.S accepts). Meant to stay secret if either\n` +
          `  • X25519 ECDH remains unbroken (classical assumption), or\n` +
          `  • ML-KEM-768 remains unbroken (MLWE lattice assumption)`
        )
      }

      default:
        throw new Error(`Unknown step index: ${wizard.currentStep}`)
    }
  }, [hsm, wizard.currentStep])

  return (
    <div className="flex flex-col h-full relative">
      {/* Top control */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-muted/10 mb-6 rounded-t-xl">
        <LiveHSMToggle hsm={hsm} operations={HYBRID_LIVE_OPERATIONS} />
      </div>

      {/* Section header */}
      <div className="px-6 mb-4">
        <h2 className="text-lg font-semibold text-gradient">
          Hybrid Key Establishment (X25519 + ML-KEM-768)
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Live PKCS#11 demo: X25519 ECDH + ML-KEM-768 encapsulation + HKDF-SHA-256 over the
          concatenated secrets (ML-KEM first, as RFC 10024 §4.3 orders X25519MLKEM768). Both secrets
          contribute to the 32-byte hybrid session key, which stays secret as long as either
          component is unbroken, given an approved combiner form such as concatenation into an HKDF
          (
          <a
            href="/library?ref=FIPS%20203"
            className="text-primary underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            FIPS 203
          </a>
          {' · '}
          <a
            href="/library?ref=RFC 5869"
            className="text-primary underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            RFC 5869
          </a>
          ).
        </p>
      </div>

      {/* Step executor */}
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
          output={wizard.output}
          error={wizard.error}
          isStepComplete={wizard.isStepComplete}
        />

        {wizard.logEntries.length > 0 && (
          <div className="mt-4">
            <WorkshopOperationLog entries={wizard.logEntries} className="max-h-40" />
          </div>
        )}
      </div>

      {/* PKCS#11 call log */}
      {hsm.isReady && (
        <div className="px-6 mt-4">
          <Pkcs11LogPanel
            log={hsm.log}
            onClear={hsm.clearLog}
            title="PKCS#11 Call Log — Hybrid KEM + ECDH"
            emptyMessage="Enable the HSM toggle and execute steps to see PKCS#11 traces."
            filterFns={HYBRID_LIVE_OPERATIONS}
            defaultOpen={true}
          />
        </div>
      )}

      {/* Key inspector */}
      {hsm.keys.length > 0 && (
        <div className="px-6 mt-4">
          <HsmKeyInspector
            keys={hsm.keys}
            moduleRef={hsm.moduleRef}
            hSessionRef={hsm.hSessionRef}
            onRemoveKey={(key: HsmKey) => hsm.removeKey(key.handle)}
            title="Key Registry — Hybrid KEM Session"
          />
        </div>
      )}

      {/* Educational note */}
      <div className="px-6 mt-6 mb-6">
        <div className="glass-panel p-4 text-sm text-muted-foreground space-y-2">
          <p className="font-semibold text-foreground">Why combine ECDH and ML-KEM?</p>
          <p>
            A Key Encapsulation Mechanism (KEM) is a one-sided primitive: the sender gives Encaps
            the receiver&apos;s public key and gets back a shared secret and a ciphertext, rather
            than supplying a key of its own choosing.
          </p>
          <p>
            Combining X25519 ECDH with ML-KEM-768 via HKDF provides{' '}
            <strong>defense-in-depth</strong>:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>
              If a cryptographically-relevant quantum computer (CRQC) breaks X25519 via Shor&apos;s
              algorithm, the ML-KEM shared secret remains secret.
            </li>
            <li>
              If ML-KEM-768 has an unforeseen algebraic weakness, the X25519 shared secret remains
              secret.
            </li>
          </ul>
          <p>
            What this construction does and does not do: its combiner has the form CMVP IG D.S
            accepts (both secrets concatenated and fed into an SP 800-56C KDF, HKDF included), but
            it mixes in only the two secrets and a fixed label, not the exchanged key shares or
            public keys. Deployed combiners bind those too (X-Wing hashes the X25519 key share and
            public key into its output; TLS 1.3 feeds the whole handshake transcript into its key
            schedule). A validated module must also enforce a fixed set of hybrid schemes and
            control the concatenation order itself, which this demo does not, so treat it as the
            idea, not a design to copy.
          </p>
          <p>
            <Link to="/playground/tls-simulator" className="text-primary underline">
              Then watch the same idea in a real TLS 1.3 handshake →
            </Link>{' '}
            The TLS simulator negotiates the X25519MLKEM768 group with real OpenSSL.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Note: softhsmv3 WASM uses X25519 (Montgomery) for the classical leg via{' '}
            <code>CKM_EC_MONTGOMERY_KEY_PAIR_GEN</code> + <code>CKM_ECDH1_DERIVE</code>. This demo
            is for educational use only — keys generated here must not be used in production
            systems.
          </p>
        </div>
      </div>
    </div>
  )
}

export const HybridEncryptionDemo: React.FC<{ initialStep?: number }> = (props) =>
  readAlgorithmLaunch('hybrid-encrypt')?.algorithm === 'HPKE-PQ' ? (
    <HpkeWorkshop />
  ) : (
    <HybridKemDemo {...props} />
  )
