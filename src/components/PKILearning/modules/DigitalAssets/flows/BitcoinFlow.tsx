// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo } from 'react'
import type { Step } from '../components/StepWizard'
import { StepWizard } from '../components/StepWizard'
import { sha256 } from '@noble/hashes/sha2.js'
import { ripemd160 } from '@noble/hashes/legacy.js'
import { createBase58check } from '@scure/base'
import { bytesToHex } from '@noble/hashes/utils.js'
import { useStepWizard } from '../hooks/useStepWizard'
import { BitcoinFlowDiagram } from '../components/CryptoFlowDiagram'
import { InfoTooltip } from '../components/InfoTooltip'
import { hsm_generateECKeyPair, hsm_ecdsaSign, hsm_ecdsaVerify } from '@/wasm/softhsm/classical'
import { hsm_getPublicKeyInfo } from '@/wasm/softhsm/objects'
import { useHSM } from '@/hooks/useHSM'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import { HsmKeyInspector } from '@/components/shared/HsmKeyInspector'
import { Input } from '@/components/ui/input'

interface BitcoinFlowProps {
  onBack: () => void
}

/**
 * Extract the compressed secp256k1 public key (33 bytes) from an SPKI DER blob.
 *
 * SPKI structure for secp256k1:
 *   SEQUENCE(2) + inner SEQUENCE(18: ecPublicKey OID + secp256k1 OID) + BIT STRING header(3)
 *   = 23 bytes before the EC point.
 *
 * If the extracted point is uncompressed (0x04 prefix, 65 bytes) it is compressed
 * by keeping the x-coordinate and deriving the prefix from y-parity.
 */
function extractCompressedSecp256k1(spki: Uint8Array): Uint8Array {
  const point = spki.slice(23)
  if (point[0] === 0x04 && point.length === 65) {
    const prefix = (point[64] & 1) === 0 ? 0x02 : 0x03
    const compressed = new Uint8Array(33)
    compressed[0] = prefix
    compressed.set(point.slice(1, 33), 1)
    return compressed
  }
  return point // already compressed (0x02 / 0x03)
}

export const BitcoinFlow: React.FC<BitcoinFlowProps> = ({ onBack }) => {
  const hsm = useHSM()

  const hsmHandlesRef = React.useRef<{
    srcPrivHandle?: number
    srcPubHandle?: number
    dstPrivHandle?: number
    dstPubHandle?: number
  }>({})
  // Extracted public key bytes (from HSM via CKA_PUBLIC_KEY_INFO) — used for address derivation
  const srcPubKeyRef = React.useRef<Uint8Array | null>(null)
  const dstPubKeyRef = React.useRef<Uint8Array | null>(null)
  // Raw SoftHSMv3 signature (r||s, 64 bytes) — CKM_ECDSA format, persisted for verify step
  const hsmSigRef = React.useRef<Uint8Array | null>(null)

  const [sourceAddress, setSourceAddress] = React.useState<string | null>(null)
  const [recipientAddress, setRecipientAddress] = React.useState<string | null>(null)
  const [editableRecipientAddress, setEditableRecipientAddress] = React.useState<string>('')
  const [transactionBytes, setTransactionBytes] = React.useState<Uint8Array | null>(null)

  const steps: Step[] = useMemo(
    () => [
      {
        id: 'gen_key',
        title: '1. Generate Source Key',
        description: (
          <>
            Generate a <InfoTooltip term="secp256k1" /> key pair for the sender inside SoftHSMv3
            (PKCS#11 via WebAssembly). The private key is created inside the HSM token and never
            leaves it. Note: <InfoTooltip term="shors" /> breaks secp256k1 — this algorithm will
            require migration when a cryptographically relevant quantum computer (CRQC) arrives.
          </>
        ),
        code: `// Generate secp256k1 key pair inside the SoftHSMv3 token
const { pubHandle, privHandle } = hsm_generateECKeyPair(
  module, hSession,
  'secp256k1',
  false,   // extractable = false — private key stays in HSM
  'sign'   // usage: CKA_SIGN on private, CKA_VERIFY on public
)`,
        language: 'javascript',
        actionLabel: 'Generate Source Key',
        diagram: <BitcoinFlowDiagram />,
      },
      {
        id: 'pub_key',
        title: '2. Extract Source Public Key',
        description: (
          <>
            Extract the sender&apos;s <InfoTooltip term="secp256k1" /> public key from the HSM token
            via{' '}
            <code className="text-xs font-mono text-primary">
              C_GetAttributeValue(CKA_PUBLIC_KEY_INFO)
            </code>
            . This returns the SPKI DER blob; the raw EC point is parsed out and compressed to 33
            bytes. The private key is not involved and never leaves the token.
          </>
        ),
        code: `// PKCS#11 C_GetAttributeValue(CKA_PUBLIC_KEY_INFO) — returns SPKI DER bytes
const spki = module._C_GetAttributeValue(hSession, pubHandle, CKA_PUBLIC_KEY_INFO)

// Parse the EC point out of SPKI and compress it
// SPKI offset 23 = SEQUENCE(2) + inner SEQUENCE(18) + BIT STRING header(3)
const point = spki.slice(23) // 65 bytes uncompressed or 33 bytes compressed
const prefix = (point[64] & 1) === 0 ? 0x02 : 0x03   // y-parity → prefix byte
const pubKeyBytes = new Uint8Array([prefix, ...point.slice(1, 33)]) // 33 bytes`,
        language: 'javascript',
        actionLabel: 'Extract Public Key',
      },
      {
        id: 'address',
        title: '3. Create Source Address',
        description: (
          <>
            Hash the sender&apos;s public key (<InfoTooltip term="sha256" /> +{' '}
            <InfoTooltip term="ripemd160" />) and encode with <InfoTooltip term="base58check" /> to
            create a <InfoTooltip term="p2pkh" /> address.
          </>
        ),
        code: `// 1. SHA256
const sha = sha256(pubKeyBytes)

// 2. RIPEMD160
const ripemd = ripemd160(sha)

// 3. Base58Check(version=0x00) → P2PKH address
const address = base58check.encode([0x00, ...ripemd])`,
        language: 'javascript',
        actionLabel: 'Create Source Address',
        diagram: <BitcoinFlowDiagram />,
      },
      {
        id: 'gen_recipient_key',
        title: '4. Generate Recipient Key',
        description: (
          <>
            Generate a <InfoTooltip term="secp256k1" /> key pair for the recipient using the same
            process as step 1. Each participant needs their own independent key pair — the private
            key is generated inside the HSM and never exposed.
          </>
        ),
        code: `const { pubHandle, privHandle } = hsm_generateECKeyPair(
  module, hSession, 'secp256k1', false, 'sign'
)`,
        language: 'javascript',
        actionLabel: 'Generate Recipient Key',
      },
      {
        id: 'recipient_address',
        title: '5. Create Recipient Address',
        description: (
          <>
            Extract the recipient&apos;s public key from the HSM token, then derive their{' '}
            <InfoTooltip term="p2pkh" /> address using the same <InfoTooltip term="sha256" /> →{' '}
            <InfoTooltip term="ripemd160" /> → <InfoTooltip term="base58check" /> pipeline as step
            3.
          </>
        ),
        code: `// Extract recipient public key from HSM token
const spki = C_GetAttributeValue(hSession, dstPubHandle, CKA_PUBLIC_KEY_INFO)
const pubKeyBytes = extractCompressedPoint(spki)

// Derive P2PKH address — same pipeline as step 3
const address = base58check.encode([0x00, ...ripemd160(sha256(pubKeyBytes))])`,
        language: 'javascript',
        actionLabel: 'Create Recipient Address',
      },
      {
        id: 'format_tx',
        title: '6. Format Transaction',
        description:
          'Define the transaction details including amount, fee, and addresses. Bitcoin transactions follow a specific binary format with multiple fields. Verify the recipient address carefully!',
        code: `const transaction = {
  amount: 0.5,
  fee: 0.0001,
  sourceAddress: "${sourceAddress || '...'}",
  recipientAddress: "${editableRecipientAddress || recipientAddress || '...'}"
}`,
        language: 'javascript',
        actionLabel: 'Format Transaction',
        explanationTable: [
          {
            label: 'Version',
            value: '4 bytes',
            description: 'Transaction version (typically 1 or 2)',
          },
          {
            label: 'Input Count',
            value: 'VarInt',
            description: 'Number of transaction inputs (1-9 bytes)',
          },
          {
            label: 'Inputs',
            value: '~180 bytes each',
            description:
              'Previous transaction hash (32B) + output index (4B) + script length + scriptSig + sequence (4B)',
          },
          {
            label: 'Output Count',
            value: 'VarInt',
            description: 'Number of transaction outputs (1-9 bytes)',
          },
          {
            label: 'Outputs',
            value: '~34 bytes each',
            description: 'Amount (8B) + script length + scriptPubKey (~25B for P2PKH)',
          },
          {
            label: 'Locktime',
            value: '4 bytes',
            description: 'Block height or timestamp when tx becomes valid (0 = immediate)',
          },
          {
            label: 'Total Size',
            value: '~250 bytes',
            description: 'Typical P2PKH transaction with 1 input, 2 outputs',
          },
        ],
        diagram: <BitcoinFlowDiagram />,
        customControls: (
          <div className="mt-3 mb-1">
            <label
              htmlFor="recipient-addr-input"
              className="text-xs font-medium text-muted-foreground mb-1.5 block"
            >
              Recipient Address — edit to test the tampered-address warning:
            </label>
            <Input
              id="recipient-addr-input"
              value={editableRecipientAddress}
              onChange={(e) => setEditableRecipientAddress(e.target.value)}
              placeholder="Generate recipient address first (Step 5)"
              className="font-mono text-xs"
            />
            {editableRecipientAddress && editableRecipientAddress !== recipientAddress && (
              <p className="mt-1.5 text-xs text-status-warning">
                ⚠️ Address differs from generated recipient — funds would be unrecoverable on a real
                network.
              </p>
            )}
          </div>
        ),
      },
      {
        id: 'visualize_msg',
        title: '7. Visualize Message',
        description:
          'View the transaction structure that will be hashed and signed. This demo uses a simplified JSON representation for readability. Production Bitcoin transactions use a specific binary format with little-endian integers, VarInts, and script bytecode.',
        code: '',
        language: 'javascript',
        actionLabel: 'Visualize Message',
        explanationTable: [
          {
            label: 'Version',
            value: '1',
            description: 'Transaction version number (4 bytes). Currently version 1 or 2.',
          },
          {
            label: 'Input Count',
            value: '1',
            description: 'Number of inputs in the transaction (VarInt).',
          },
          {
            label: 'Inputs',
            value: '[{ txid: "...", vout: 0, ... }]',
            description: 'List of inputs referencing previous unspent outputs (UTXOs).',
          },
          {
            label: 'Output Count',
            value: '2',
            description: 'Number of outputs (VarInt).',
          },
          {
            label: 'Outputs',
            value: `1. ${editableRecipientAddress || recipientAddress || '...'} (0.5 BTC)\n2. ${sourceAddress || '...'} (Change)`,
            description:
              'List of destinations and amounts. Includes the recipient and change back to sender.',
          },
          {
            label: 'Locktime',
            value: '0',
            description:
              'The block number or timestamp at which this transaction is locked (0 = immediate).',
          },
          {
            label: 'Real Binary Format',
            value: 'Version(4B) | VarInt | Inputs | VarInt | Outputs | Locktime(4B)',
            description:
              'Production Bitcoin transactions use a specific binary format: Version (4B little-endian) | VarInt(inputCount) | [txid(32B) + vout(4B LE) + scriptLen + scriptSig + sequence(4B)] per input | VarInt(outputCount) | [value(8B LE) + scriptLen + scriptPubKey] per output | Locktime(4B LE). This demo uses a simplified JSON representation.',
          },
        ],
      },
      {
        id: 'sign',
        title: '8. Sign Transaction',
        description: (
          <>
            Sign the transaction hash (Double <InfoTooltip term="sha256" />) using the sender&apos;s
            private key via <InfoTooltip term="ecdsa" /> (CKM_ECDSA — raw hash input, no internal
            hashing). The private key never leaves the HSM token.
          </>
        ),
        code: `// 1. Double SHA256 sighash — computed in JS, passed raw to HSM
const sighash = sha256(sha256(rawTxBytes))

// 2. C_SignInit + C_Sign with CKM_ECDSA (raw: HSM does NOT hash internally)
const signature = hsm_ecdsaSign(module, hSession, privHandle, sighash, CKM_ECDSA)
// Returns raw r||s (64 bytes) — NOT DER-encoded`,
        language: 'javascript',
        actionLabel: 'Sign Transaction',
      },
      {
        id: 'verify',
        title: '9. Verify Signature',
        description: (
          <>
            Verify the transaction signature using the sender&apos;s public key with standard{' '}
            <InfoTooltip term="ecdsa" /> verification. The verifier uses the public key, signature
            (r, s), and message hash to confirm the signature was created by the corresponding
            private key. The equation checks: r ≡ x₁ (mod n), where x₁ is derived from s⁻¹ × (H(m) ×
            G + r × PublicKey). Quantum note: <InfoTooltip term="shors" /> can derive the private
            key from the public key, forging any signature — making <InfoTooltip term="ecdsa" />{' '}
            quantum-unsafe.
          </>
        ),
        code: `// C_VerifyInit + C_Verify with CKM_ECDSA (raw r||s, no DER)
// Recompute sighash to match what was signed in step 8
const sighash = sha256(sha256(rawTxBytes))
const isValid = hsm_ecdsaVerify(module, hSession, pubHandle, sighash, sig, CKM_ECDSA)`,
        language: 'javascript',
        actionLabel: 'Verify Signature',
      },
    ],
    [sourceAddress, recipientAddress, editableRecipientAddress]
  )

  const executeStep = async (): Promise<string | Record<string, string>> => {
    const step = steps[wizard.currentStep]
    const CKM_ECDSA = 0x1040

    if (!hsm.isReady || !hsm.moduleRef.current || !hsm.hSessionRef.current) {
      throw new Error('SoftHSMv3 session not ready — waiting for initialization to complete.')
    }
    const M = hsm.moduleRef.current
    const hSession = hsm.hSessionRef.current

    if (step.id === 'gen_key') {
      const { pubHandle, privHandle } = hsm_generateECKeyPair(
        M,
        hSession,
        'secp256k1',
        false,
        'sign'
      )
      hsmHandlesRef.current.srcPrivHandle = privHandle
      hsmHandlesRef.current.srcPubHandle = pubHandle
      hsm.addKey({
        handle: pubHandle,
        label: 'Bitcoin Sender (secp256k1)',
        family: 'ecdsa',
        role: 'public',
        generatedAt: new Date().toISOString(),
      })
      hsm.addKey({
        handle: privHandle,
        label: 'Bitcoin Sender (secp256k1)',
        family: 'ecdsa',
        role: 'private',
        generatedAt: new Date().toISOString(),
      })
      return `secp256k1 key pair generated inside SoftHSMv3 token via C_GenerateKeyPair.\n\nPub handle: ${pubHandle}  ·  Priv handle: ${privHandle}\n\nThe private key never leaves the HSM token.\nFull trace in PKCS#11 Call Log below.`
    }

    if (step.id === 'pub_key') {
      const pubHandle = hsmHandlesRef.current.srcPubHandle
      if (!pubHandle) throw new Error('Source key not found — execute Step 1 first.')
      const spki = hsm_getPublicKeyInfo(M, hSession, pubHandle)
      const compressed = extractCompressedSecp256k1(spki)
      srcPubKeyRef.current = compressed
      return `Sender public key extracted via C_GetAttributeValue(CKA_PUBLIC_KEY_INFO).\n\nSPKI DER (${spki.length} bytes, hex):\n${bytesToHex(spki)}\n\nCompressed secp256k1 public key (33 bytes, hex):\n${bytesToHex(compressed)}\n\nFull C_GetAttributeValue trace in PKCS#11 Call Log below.`
    }

    if (step.id === 'address') {
      if (!srcPubKeyRef.current)
        throw new Error('Sender public key not found — execute Step 2 first.')
      const shaHash = sha256(srcPubKeyRef.current)
      const ripemdHash = ripemd160(shaHash)
      const base58check = createBase58check(sha256)
      const address = base58check.encode(Uint8Array.from([0x00, ...ripemdHash]))
      setSourceAddress(address)
      return `Sender Public Key (hex):\n${bytesToHex(srcPubKeyRef.current)}\n\nSHA256:\n${bytesToHex(shaHash)}\n\nRIPEMD160:\n${bytesToHex(ripemdHash)}\n\nBitcoin Address (P2PKH):\n${address}`
    }

    if (step.id === 'gen_recipient_key') {
      const { pubHandle, privHandle } = hsm_generateECKeyPair(
        M,
        hSession,
        'secp256k1',
        false,
        'sign'
      )
      hsmHandlesRef.current.dstPrivHandle = privHandle
      hsmHandlesRef.current.dstPubHandle = pubHandle
      hsm.addKey({
        handle: pubHandle,
        label: 'Bitcoin Recipient (secp256k1)',
        family: 'ecdsa',
        role: 'public',
        generatedAt: new Date().toISOString(),
      })
      hsm.addKey({
        handle: privHandle,
        label: 'Bitcoin Recipient (secp256k1)',
        family: 'ecdsa',
        role: 'private',
        generatedAt: new Date().toISOString(),
      })
      return `Recipient secp256k1 key pair generated inside SoftHSMv3 via C_GenerateKeyPair.\n\nPub handle: ${pubHandle}  ·  Priv handle: ${privHandle}\n\nFull trace in PKCS#11 Call Log below.`
    }

    if (step.id === 'recipient_address') {
      const pubHandle = hsmHandlesRef.current.dstPubHandle
      if (!pubHandle) throw new Error('Recipient key not found — execute Step 4 first.')
      const spki = hsm_getPublicKeyInfo(M, hSession, pubHandle)
      const compressed = extractCompressedSecp256k1(spki)
      dstPubKeyRef.current = compressed
      const shaHash = sha256(compressed)
      const ripemdHash = ripemd160(shaHash)
      const base58check = createBase58check(sha256)
      const address = base58check.encode(Uint8Array.from([0x00, ...ripemdHash]))
      setRecipientAddress(address)
      setEditableRecipientAddress(address)
      return `Recipient Public Key (hex):\n${bytesToHex(compressed)}\n\nSHA256:\n${bytesToHex(shaHash)}\n\nRIPEMD160:\n${bytesToHex(ripemdHash)}\n\nRecipient Bitcoin Address (P2PKH):\n${address}`
    }

    if (step.id === 'format_tx') {
      if (!sourceAddress || !recipientAddress)
        throw new Error('Addresses not generated — execute Steps 3 and 5 first.')
      const txData = {
        amount: 0.5,
        fee: 0.0001,
        sourceAddress,
        recipientAddress: editableRecipientAddress || recipientAddress,
      }
      const isModified = editableRecipientAddress !== recipientAddress
      const warning = isModified
        ? '\n\n⚠️ WARNING: Recipient address has been modified! Signing this transaction may result in loss of funds.'
        : ''
      return `Transaction Details:\n${JSON.stringify(txData, null, 2)}${warning}`
    }

    if (step.id === 'visualize_msg') {
      const rawTx = {
        version: 1,
        inputCount: 1,
        inputs: [
          {
            txid: '(demo) a1b2c3d4...',
            vout: 0,
            scriptSig: '<signature> <pubkey>',
            sequence: 0xffffffff,
          },
        ],
        outputCount: 2,
        outputs: [
          {
            value: 50000000,
            scriptPubKey: `OP_DUP OP_HASH160 ${editableRecipientAddress || recipientAddress} ...`,
          },
          { value: 49990000, scriptPubKey: `OP_DUP OP_HASH160 ${sourceAddress} ...` },
        ],
        locktime: 0,
      }
      const txBytes = new TextEncoder().encode(JSON.stringify(rawTx, null, 2))
      setTransactionBytes(txBytes)
      return `Raw Transaction Structure (to be double-SHA256 hashed and signed):\n${JSON.stringify(rawTx, null, 2)}`
    }

    if (step.id === 'sign') {
      if (!transactionBytes) throw new Error('Transaction bytes not found — execute Step 7 first.')
      const privHandle = hsmHandlesRef.current.srcPrivHandle
      if (!privHandle) throw new Error('Sender private key not found — execute Step 1 first.')
      const sighashBytes = sha256(sha256(transactionBytes))
      const hsmSig = hsm_ecdsaSign(M, hSession, privHandle, sighashBytes, CKM_ECDSA)
      hsmSigRef.current = hsmSig
      return `Double SHA256 sighash (32 bytes):\n${bytesToHex(sighashBytes)}\n\nSignature via C_SignInit + C_Sign (CKM_ECDSA):\n${bytesToHex(hsmSig)}\n\n${hsmSig.length} bytes — raw r||s, not DER-encoded.\nFull trace in PKCS#11 Call Log below.`
    }

    if (step.id === 'verify') {
      if (!transactionBytes) throw new Error('Transaction bytes not found — execute Step 7 first.')
      if (!hsmSigRef.current) throw new Error('Signature not found — execute Step 8 first.')
      const pubHandle = hsmHandlesRef.current.srcPubHandle
      if (!pubHandle) throw new Error('Sender public key not found — execute Step 1 first.')
      const hsmSighash = sha256(sha256(transactionBytes))
      const isValid = hsm_ecdsaVerify(
        M,
        hSession,
        pubHandle,
        hsmSighash,
        hsmSigRef.current,
        CKM_ECDSA
      )
      return `Sighash recomputed (32 bytes):\n${bytesToHex(hsmSighash)}\n\nSignature Evaluation via C_VerifyInit + C_Verify (CKM_ECDSA):\n${isValid ? '✅ VALID' : '❌ INVALID'}\n\nVerified using sender public key handle ${pubHandle}.\nFull trace in PKCS#11 Call Log below.`
    }

    return ''
  }

  const wizard = useStepWizard({ steps, onBack })

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-muted/10 rounded-t-xl">
        <LiveHSMToggle
          hsm={hsm}
          operations={['C_GenerateKeyPair', 'C_GetAttributeValue', 'C_Sign', 'C_Verify']}
        />
      </div>
      <p className="text-xs text-muted-foreground px-6 py-2 mb-4 border-b border-border">
        Educational demo — keys and transactions generated here are not for production use.
      </p>

      <StepWizard
        steps={steps}
        currentStepIndex={wizard.currentStep}
        onExecute={() => wizard.execute(executeStep)}
        output={wizard.output}
        isExecuting={wizard.isExecuting}
        error={wizard.error}
        isStepComplete={wizard.isStepComplete}
        onNext={wizard.handleNext}
        onBack={wizard.handleBack}
        onComplete={onBack}
      />

      {hsm.isReady && (
        <Pkcs11LogPanel
          log={hsm.log}
          onClear={hsm.clearLog}
          title="PKCS#11 Call Log — Bitcoin Flow"
          emptyMessage="Execute a step to see live PKCS#11 operations."
          filterFns={['C_GenerateKeyPair', 'C_GetAttributeValue', 'C_Sign', 'C_Verify']}
        />
      )}

      {hsm.isReady && (
        <HsmKeyInspector
          keys={hsm.keys}
          moduleRef={hsm.moduleRef}
          hSessionRef={hsm.hSessionRef}
          onRemoveKey={hsm.removeKey}
        />
      )}
    </div>
  )
}
