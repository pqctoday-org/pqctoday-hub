// SPDX-License-Identifier: GPL-3.0-only
import React, { useCallback, useRef } from 'react'
import { useHSM } from '@/hooks/useHSM'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import { HsmKeyInspector } from '@/components/shared/HsmKeyInspector'
import { StepWizard } from '@/components/PKILearning/modules/DigitalAssets/components/StepWizard'
import type { Step } from '@/components/PKILearning/modules/DigitalAssets/components/StepWizard'
import { useStepWizard } from '@/components/PKILearning/modules/DigitalAssets/hooks/useStepWizard'
import {
  hsm_generateECKeyPair,
  hsm_generateMLKEMKeyPair,
  hsm_extractECPoint,
  hsm_ecdhDerive,
  hsm_encapsulate,
  hsm_decapsulate,
  hsm_hkdf,
  hsm_extractKeyValue,
  hsm_importGenericSecret,
  CKM_SHA256,
} from '@/wasm/softhsm'

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
        description: 'Raw DH u-coordinate output; domain separation applied via HKDF in Step 6',
      },
      {
        label: 'Output',
        value: '32-byte CKK_GENERIC_SECRET (CKA_DERIVE=true)',
        description: 'Stored in HSM session for direct use as HKDF base key in Step 6',
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
        description: 'Includes ek for implicit rejection (FIPS 203 §7.1)',
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
      'Bob decapsulates the ML-KEM ciphertext, then HKDF-SHA-256 combines both shared secrets into a 32-byte hybrid session key. Defense-in-depth: if X25519 is broken by a quantum computer, the ML-KEM secret still protects. If ML-KEM has an unforeseen flaw, the X25519 secret still protects.',
    code: `const kemSS = hsm_extractKeyValue(module, session,\n  hsm_decapsulate(module, session, kemPriv, ct, 768))\nconst hybridKey = hsm_hkdf(\n  module, session, ecdhHandle,\n  CKM_SHA256, true, true,\n  kemSS,\n  encode('hybrid-kem-x25519-mlkem768-v1'),\n  32\n)`,
    language: 'javascript',
    actionLabel: 'Decapsulate & Combine',
    explanationTable: [
      {
        label: 'HKDF-Extract IKM',
        value: 'ECDH shared secret (base key)',
        description: 'X25519 DH output used as input key material (RFC 5869 §2.2)',
      },
      {
        label: 'HKDF-Extract Salt',
        value: 'ML-KEM shared secret',
        description:
          'KEM output used as salt — both secrets must be secret for the output to be secret',
      },
      {
        label: 'Info',
        value: '"hybrid-kem-x25519-mlkem768-v1"',
        description:
          'Domain-separation string prevents hybrid key material from being reused in other contexts',
      },
      {
        label: 'Output',
        value: '32 bytes (256-bit hybrid session key)',
        description: 'Quantum-safe if either X25519 ECDH or ML-KEM-768 remains secure',
      },
    ],
  },
]

// ── Component ────────────────────────────────────────────────────────────────
export const HybridEncryptionDemo: React.FC = () => {
  const hsm = useHSM()
  const stateRef = useRef<Partial<HybridState>>({})
  const wizard = useStepWizard({ steps: STEPS, onBack: () => {} })

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
        hsm.addKey({
          handle: pubHandle,
          label: 'Alice X25519 Pub',
          family: 'ecdh',
          role: 'public',
          generatedAt: new Date().toISOString(),
        })
        hsm.addKey({
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
        hsm.addKey({
          handle: pubHandle,
          label: 'Bob X25519 Pub',
          family: 'ecdh',
          role: 'public',
          generatedAt: new Date().toISOString(),
        })
        hsm.addKey({
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

        hsm.addKey({
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
        hsm.addKey({
          handle: pubHandle,
          label: 'ML-KEM-768 Pub',
          family: 'ml-kem',
          role: 'public',
          generatedAt: new Date().toISOString(),
        })
        hsm.addKey({
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

        hsm.addKey({
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

        hsm.addKey({
          handle: decapSSHandle,
          label: 'ML-KEM Decap Secret',
          family: 'aes',
          role: 'secret',
          purpose: 'application',
          generatedAt: new Date().toISOString(),
        })

        // Import ECDH SS as a derivable generic secret for HKDF
        const ecdhDerivableHandle = hsm_importGenericSecret(
          M,
          hSession,
          stateRef.current.ecdhSSBytes
        )

        hsm.addKey({
          handle: ecdhDerivableHandle,
          label: 'ECDH SS (Derivable)',
          family: 'aes',
          role: 'secret',
          purpose: 'application',
          generatedAt: new Date().toISOString(),
        })

        // HKDF-SHA-256: IKM = ECDH SS (base key), salt = KEM SS, info = domain separator
        const info = new TextEncoder().encode('hybrid-kem-x25519-mlkem768-v1')
        const hybridKeyOut = { current: 0 }
        const hybridKey = hsm_hkdf(
          M,
          hSession,
          ecdhDerivableHandle,
          CKM_SHA256,
          true,
          true,
          decapSSBytes,
          info,
          32,
          hybridKeyOut
        )
        stateRef.current.hybridKey = hybridKey

        hsm.addKey({
          handle: hybridKeyOut.current,
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
          `  IKM  (ECDH SS):  ${toHex(stateRef.current.ecdhSSBytes)}\n` +
          `  Salt (KEM SS):   ${toHex(decapSSBytes)}\n` +
          `  Info:            "hybrid-kem-x25519-mlkem768-v1"\n\n` +
          `32-byte hybrid session key:\n${toHex(hybridKey)}\n\n` +
          `Defense-in-depth: this key is quantum-safe if either\n` +
          `  • X25519 ECDH remains secure (classical assumption), or\n` +
          `  • ML-KEM-768 remains secure (MLWE lattice assumption)`
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
        <h2 className="text-lg font-semibold text-foreground">
          Hybrid Key Establishment (X25519 + ML-KEM-768)
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Live PKCS#11 demo: X25519 ECDH + ML-KEM-768 encapsulation + HKDF-SHA-256 combiner. Both
          secrets contribute to the 32-byte hybrid session key — quantum-safe if either component
          remains secure (
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
            href="/library?ref=RFC-5869"
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
            onRemoveKey={hsm.removeKey}
            title="Key Registry — Hybrid KEM Session"
          />
        </div>
      )}

      {/* Educational note */}
      <div className="px-6 mt-6 mb-6">
        <div className="glass-panel p-4 text-sm text-muted-foreground space-y-2">
          <p className="font-semibold text-foreground">Why combine ECDH and ML-KEM?</p>
          <p>
            A Key Encapsulation Mechanism (KEM) is a one-sided primitive: the sender encapsulates a
            random shared secret for the receiver. Unlike ECDH, the sender cannot inject a chosen
            value.
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
