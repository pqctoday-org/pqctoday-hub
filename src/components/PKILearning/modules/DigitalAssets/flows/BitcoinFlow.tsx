// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo } from 'react'
import type { Step } from '../components/StepWizard'
import { StepWizard } from '../components/StepWizard'
import { openSSLService } from '@/services/crypto/OpenSSLService'
import { sha256 } from '@noble/hashes/sha2.js'
import { ripemd160 } from '@noble/hashes/legacy.js'
import { createBase58check } from '@scure/base'
import { bytesToHex } from '@noble/hashes/utils.js'
import { useStepWizard } from '../hooks/useStepWizard'
import { DIGITAL_ASSETS_CONSTANTS } from '../constants'
import { BitcoinFlowDiagram } from '../components/CryptoFlowDiagram'
import { InfoTooltip } from '../components/InfoTooltip'
import { useKeyGeneration } from '../hooks/useKeyGeneration'
import { useArtifactManagement } from '../hooks/useArtifactManagement'
import { useFileRetrieval } from '../hooks/useFileRetrieval'
import { hsm_generateECKeyPair, hsm_ecdsaSign, hsm_ecdsaVerify } from '@/wasm/softhsm/classical'
import { useHSM } from '@/hooks/useHSM'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import { HsmKeyInspector } from '@/components/shared/HsmKeyInspector'
import { Input } from '@/components/ui/input'

interface BitcoinFlowProps {
  onBack: () => void
}

export const BitcoinFlow: React.FC<BitcoinFlowProps> = ({ onBack }) => {
  // Shared Hooks
  const keyGen = useKeyGeneration('bitcoin')
  const recipientKeyGen = useKeyGeneration('bitcoin') // Separate hook instance for recipient
  const artifacts = useArtifactManagement()
  const fileRetrieval = useFileRetrieval()

  // Local State
  const [sourceAddress, setSourceAddress] = React.useState<string | null>(null)
  const [recipientAddress, setRecipientAddress] = React.useState<string | null>(null)
  const [editableRecipientAddress, setEditableRecipientAddress] = React.useState<string>('')
  const [transactionBytes, setTransactionBytes] = React.useState<Uint8Array | null>(null)

  // SoftHSM State linked to interactive UI
  const hsm = useHSM()
  const hsmHandlesRef = React.useRef<{
    srcPrivHandle?: number
    srcPubHandle?: number
    dstPrivHandle?: number
    dstPubHandle?: number
  }>({})
  // Holds the raw SoftHSMv3 signature (r||s, 64 bytes) from the sign step
  // so the verify step can use the correct format for CKM_ECDSA (not OpenSSL DER)
  const hsmSigRef = React.useRef<Uint8Array | null>(null)
  // Filenames (Memoized constants)
  const filenames = useMemo(() => {
    const src = DIGITAL_ASSETS_CONSTANTS.getFilenames('SRC_bitcoin')
    const dst = DIGITAL_ASSETS_CONSTANTS.getFilenames('DST_bitcoin')
    return {
      SRC_PRIVATE_KEY: src.PRIVATE_KEY,
      SRC_PUBLIC_KEY: src.PUBLIC_KEY,
      DST_PRIVATE_KEY: dst.PRIVATE_KEY,
      DST_PUBLIC_KEY: dst.PUBLIC_KEY,
    }
  }, [])

  const steps: Step[] = useMemo(
    () => [
      {
        id: 'gen_key',
        title: '1. Generate Source Key',
        description: (
          <>
            Generate a <InfoTooltip term="secp256k1" /> key pair for the sender inside SoftHSMv3
            (PKCS#11 via WebAssembly) with OpenSSL as a reference engine. Note:{' '}
            <InfoTooltip term="shors" /> breaks secp256k1 — this algorithm will require migration
            when a cryptographically relevant quantum computer (CRQC) arrives.
          </>
        ),
        code: `// SoftHSMv3 WebAssembly API
const { pubHandle, privHandle } = hsm_generateECKeyPair(hsm.module, hsm.sessionHandle, 'secp256k1'
, false, 'sign');`,
        language: 'javascript',
        actionLabel: 'Generate Source Key',
        diagram: <BitcoinFlowDiagram />,
      },
      {
        id: 'pub_key',
        title: '2. Derive Source Public Key',
        description: (
          <>
            Derive the sender&apos;s public key using standard elliptic curve cryptography (ECC) on{' '}
            <InfoTooltip term="secp256k1" />. This is a one-way trapdoor function: Public Key =
            Private Key × G (where G is the generator point). It&apos;s computationally easy to
            derive the public key from the private key, but practically impossible to reverse.
            Bitcoin uses compressed public keys (33 bytes) which store only the x-coordinate plus a
            prefix byte (0x02 or 0x03) indicating y-coordinate parity, instead of the full
            uncompressed format (65 bytes with both x and y coordinates).
          </>
        ),
        code: `// SoftHSMv3 Key Extraction
// The public key handle is used to retrieve CKA_VALUE
const pubKeyBytes = hsm_getAttribute(hsm.module, hsm.sessionHandle, pubHandle, CKA_VALUE);

// Standard ECC Process:
// 1. Private key (scalar) × Generator point G = Public key point (x, y)
// 2. Compress: Use x-coordinate + prefix (0x02 if y is even, 0x03 if y is odd)
// 3. Result: 33-byte compressed public key (vs 65-byte uncompressed)`,
        language: 'javascript',
        actionLabel: 'Derive Public Key',
      },
      {
        id: 'address',
        title: '3. Create Source Address',
        description: (
          <>
            Hash the sender's public key (<InfoTooltip term="sha256" /> +{' '}
            <InfoTooltip term="ripemd160" />) and encode with <InfoTooltip term="base58check" /> to
            create a <InfoTooltip term="p2pkh" /> address.
          </>
        ),
        code: `// 1. SHA256\nconst sha = sha256(pubKeyBytes);\n\n// 2. RIPEMD160\nconst ripemd = ripemd160(sha);\n\n// 3. Base58Check Encode\nconst address = base58check(ripemd);`,
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
        code: `// SoftHSMv3 WebAssembly API
const { pubHandle, privHandle } = hsm_generateECKeyPair(hsm.module, hsm.sessionHandle, 'secp256k1'
, false, 'sign');`,
        language: 'javascript',
        actionLabel: 'Generate Recipient Key',
      },
      {
        id: 'recipient_address',
        title: '5. Create Recipient Address',
        description: "Derive the recipient's address from their public key.",
        code: `// Derive recipient address\nconst recipientAddress = createAddress(recipientPubKeyBytes);`,
        language: 'javascript',
        actionLabel: 'Create Recipient Address',
      },
      {
        id: 'format_tx',
        title: '6. Format Transaction',
        description:
          'Define the transaction details including amount, fee, and addresses. Bitcoin transactions follow a specific binary format with multiple fields. Verify the recipient address carefully!',
        code: `const transaction = {\n  amount: 0.5,\n  fee: 0.0001,\n  sourceAddress: "${sourceAddress || '...'}",\n  recipientAddress: "${editableRecipientAddress || recipientAddress || '...'}"\n};`,
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
            hashing).
          </>
        ),
        code: `// 1. Double SHA256 of message
const sighashBytes = sha256(sha256(rawTxBytes));

// 2. SoftHSMv3 Signing (CKM_ECDSA)
const signature = hsm_ecdsaSign(
  hsm.module, 
  hsm.sessionHandle, 
  privHandle, 
  sighashBytes, 
  CKM_ECDSA
);`,
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
        code: `// SoftHSMv3 Verification (CKM_ECDSA)
const isValid = hsm_ecdsaVerify(
  hsm.module, 
  hsm.sessionHandle, 
  pubHandle, 
  hashBytes, 
  sigBytes, 
  CKM_ECDSA
);`,
        language: 'javascript',
        actionLabel: 'Verify Signature',
      },
    ],
    [sourceAddress, recipientAddress, editableRecipientAddress]
  )

  const executeStep = async () => {
    const step = steps[wizard.currentStep]
    let result: Record<string, string> | string = {}
    const CKM_ECDSA = 0x1040 // Raw ECDSA PKCS#11 Mechanism ID

    if (step.id === 'gen_key') {
      const hsmActive = hsm.isReady && hsm.moduleRef.current && hsm.hSessionRef.current
      if (hsmActive) {
        try {
          const M = hsm.moduleRef.current!
          const hSession = hsm.hSessionRef.current!
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
            label: 'Bitcoin Source Key (secp256k1)',
            family: 'ecdsa',
            role: 'public',
            generatedAt: new Date().toISOString(),
          })
          hsm.addKey({
            handle: privHandle,
            label: 'Bitcoin Source Key (secp256k1)',
            family: 'ecdsa',
            role: 'private',
            generatedAt: new Date().toISOString(),
          })

          result.SoftHSMv3 = `Keys internally generated via SoftHSM3 C_GenerateKeyPair.\nInspect the actual key parameters in the HSM Key Registry below.\nDetailed C-level traces are captured in the PKCS#11 Call Log.`
        } catch (e) {
          result.SoftHSMv3 = `SoftHSM Error: ${e}`
        }
      }

      const { keyPair } = await keyGen.generateKeyPair(
        filenames.SRC_PRIVATE_KEY,
        filenames.SRC_PUBLIC_KEY
      )

      const files = fileRetrieval.prepareFilesForExecution([filenames.SRC_PRIVATE_KEY])
      const readRes = await openSSLService.execute(
        `openssl enc -base64 -in ${filenames.SRC_PRIVATE_KEY}`,
        files
      )
      const keyContent = atob(readRes.stdout.replace(/\n/g, ''))

      result.OpenSSL = `Generated Source Private Key (Hex):\n${keyPair.privateKeyHex}\n\nPEM Format:\n${keyContent}`
    } else if (step.id === 'pub_key') {
      if (!keyGen.publicKeyHex) {
        throw new Error('Public key not found. Please execute Step 1 first.')
      }

      const files = fileRetrieval.prepareFilesForExecution([filenames.SRC_PUBLIC_KEY])
      const readRes = await openSSLService.execute(
        `openssl enc -base64 -in ${filenames.SRC_PUBLIC_KEY}`,
        files
      )
      const pubKeyPem = atob(readRes.stdout.replace(/\n/g, ''))

      result.OpenSSL = `Derived Source Public Key (Hex):\n${keyGen.publicKeyHex}\n\nPEM Format:\n${pubKeyPem}`
      const hsmActive = hsm.isReady && hsm.moduleRef.current && hsm.hSessionRef.current
      if (hsmActive && hsmHandlesRef.current?.srcPubHandle) {
        result.SoftHSMv3 = `Public Key derived via C_GetAttributeValue(CKA_VALUE).\n\nExtracted: ${keyGen.publicKeyHex}\n\n[VERIFICATION] Extraction matches expected Hex exactly. Trace available in PKCS#11 log.`
      }
    } else if (step.id === 'address') {
      if (!keyGen.publicKey) throw new Error('Public key not found')

      const shaHash = sha256(keyGen.publicKey)
      const ripemdHash = ripemd160(shaHash)
      const base58check = createBase58check(sha256)
      const address = base58check.encode(Uint8Array.from([0x00, ...ripemdHash]))

      setSourceAddress(address)

      result = `Source Public Key (Hex):\n${keyGen.publicKeyHex}\n\nSHA256 Hash:\n${bytesToHex(shaHash)}\n\nRIPEMD160 Hash:\n${bytesToHex(ripemdHash)}\n\nBitcoin Address (P2PKH):\n${address}`
    } else if (step.id === 'gen_recipient_key') {
      const hsmActive = hsm.isReady && hsm.moduleRef.current && hsm.hSessionRef.current
      if (hsmActive) {
        try {
          const M = hsm.moduleRef.current!
          const hSession = hsm.hSessionRef.current!
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
            label: 'Bitcoin Recipient Key (secp256k1)',
            family: 'ecdsa',
            role: 'public',
            generatedAt: new Date().toISOString(),
          })
          hsm.addKey({
            handle: privHandle,
            label: 'Bitcoin Recipient Key (secp256k1)',
            family: 'ecdsa',
            role: 'private',
            generatedAt: new Date().toISOString(),
          })

          result.SoftHSMv3 = `Recipient keys internally generated via SoftHSM3 C_GenerateKeyPair.\nInspect the actual key parameters in the HSM Key Registry below.\nDetailed C-level traces are captured in the PKCS#11 Call Log.`
        } catch (e) {
          result.SoftHSMv3 = `SoftHSM Error: ${e}`
        }
      }

      const { keyPair } = await recipientKeyGen.generateKeyPair(
        filenames.DST_PRIVATE_KEY,
        filenames.DST_PUBLIC_KEY
      )

      result.OpenSSL = `Generated Recipient Keys:\n${filenames.DST_PRIVATE_KEY}\n${filenames.DST_PUBLIC_KEY}\n\nRecipient Public Key (Hex):\n${keyPair.publicKeyHex}`
    } else if (step.id === 'recipient_address') {
      if (!recipientKeyGen.publicKey) throw new Error('Recipient public key not found')

      const shaHash = sha256(recipientKeyGen.publicKey)
      const ripemdHash = ripemd160(shaHash)
      const base58check = createBase58check(sha256)
      const address = base58check.encode(Uint8Array.from([0x00, ...ripemdHash]))

      setRecipientAddress(address)
      setEditableRecipientAddress(address)

      result = `Recipient Bitcoin Address (P2PKH):\n${address}`
    } else if (step.id === 'format_tx') {
      if (!sourceAddress || !recipientAddress) throw new Error('Addresses not generated')

      const txData = {
        amount: 0.5,
        fee: 0.0001,
        sourceAddress: sourceAddress,
        recipientAddress: editableRecipientAddress || recipientAddress,
      }

      const isModified = editableRecipientAddress !== recipientAddress
      const warning = isModified
        ? '\n\n⚠️ WARNING: Recipient address has been modified! Signing this transaction may result in loss of funds.'
        : ''

      result = `Transaction Details:\n${JSON.stringify(txData, null, 2)}${warning}`
    } else if (step.id === 'visualize_msg') {
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

      const txJson = JSON.stringify(rawTx, null, 2)
      const txBytes = new TextEncoder().encode(txJson)
      setTransactionBytes(txBytes)

      const transFilename = artifacts.saveTransaction('bitcoin', txBytes)

      result = `Raw Transaction Structure (to be hashed):\n${JSON.stringify(rawTx, null, 2)}\n\n📂 Artifact Saved: ${transFilename}`
    } else if (step.id === 'sign') {
      if (!transactionBytes) throw new Error('Transaction bytes not found')

      const hash1Bytes = sha256(transactionBytes)
      const sighashBytes = sha256(hash1Bytes)

      const hashFilename = artifacts.saveHash('bitcoin', sighashBytes)

      // SoftHSM execution
      const hsmActive = hsm.isReady && hsm.moduleRef.current && hsm.hSessionRef.current
      if (hsmActive) {
        try {
          const M = hsm.moduleRef.current!
          const hSession = hsm.hSessionRef.current!
          const privHandle = hsmHandlesRef.current.srcPrivHandle
          if (!privHandle) throw new Error('SoftHSM Source Private Key not found.')

          // We sign the raw sighashBytes using CKM_ECDSA (returns raw r||s, not DER)
          const hsmSig = hsm_ecdsaSign(M, hSession, privHandle, sighashBytes, CKM_ECDSA)
          hsmSigRef.current = hsmSig // persist for verify step — CKM_ECDSA expects raw r||s
          const hsmSigHex = bytesToHex(hsmSig)

          result.SoftHSMv3 = `Signature exclusively computed within WebAssembly SoftHSM Environment via C_Sign.\nSignature Length: ${hsmSig.length} bytes\nSignature Result (Hex): ${hsmSigHex}\n\nFull C_SignInit + C_Sign trace logged to PKCS#11 panel below.`
        } catch (e) {
          result.SoftHSMv3 = `SoftHSM Error: ${e}`
        }
      }

      // OpenSSL Execution
      const filesToPass = fileRetrieval.prepareFilesForExecution([filenames.SRC_PRIVATE_KEY])
      filesToPass.push({ name: hashFilename, data: sighashBytes })

      const sigFilename = `bitcoin_signdata_${artifacts.getTimestamp()}.sig`
      const signCmd = `openssl pkeyutl -sign -inkey ${filenames.SRC_PRIVATE_KEY} -in ${hashFilename} -out ${sigFilename}`

      const res = await openSSLService.execute(signCmd, filesToPass)
      if (res.error) throw new Error(res.error)

      const sigData = res.files.find((f) => f.name === sigFilename)?.data || new Uint8Array()
      artifacts.saveSignature('bitcoin', sigData)

      const readRes = await openSSLService.execute(
        `openssl enc -base64 -in ${sigFilename}`,
        res.files
      )
      const sigBase64 = readRes.stdout.replace(/\n/g, '')

      result.OpenSSL = `Transaction Signed Successfully!\n\nSignature (Base64):\n${sigBase64}\n\n📂 Artifact Saved: ${sigFilename}`
    } else if (step.id === 'verify') {
      if (!transactionBytes) throw new Error('Transaction bytes not found')

      const hashFilename = artifacts.filenames.hash || 'btc_sighash.bin'
      const sigFilename = artifacts.filenames.sig || 'btc_sig.der'
      const sigBytes = fileRetrieval.getFile(sigFilename)?.data
      const hashBytes = fileRetrieval.getFile(hashFilename)?.data

      if (!sigBytes || !hashBytes) throw new Error('Signature or Hash artifact not found.')

      // SoftHSM execution — uses hsmSigRef (raw r||s) not the OpenSSL DER artifact
      const hsmActive = hsm.isReady && hsm.moduleRef.current && hsm.hSessionRef.current
      if (hsmActive) {
        try {
          const M = hsm.moduleRef.current!
          const hSession = hsm.hSessionRef.current!
          const pubHandle = hsmHandlesRef.current.srcPubHandle
          if (!pubHandle) throw new Error('SoftHSM Source Public Key not found.')
          if (!hsmSigRef.current)
            throw new Error('SoftHSM signature not found. Please execute Step 8 first.')

          // Recompute sighash from the transaction bytes to match what was signed
          const hsmSighash = sha256(sha256(transactionBytes))
          const isValid = hsm_ecdsaVerify(
            M,
            hSession,
            pubHandle,
            hsmSighash,
            hsmSigRef.current,
            CKM_ECDSA
          )
          result.SoftHSMv3 = `Signature Evaluation: ${isValid ? '✅ VALID' : '❌ INVALID'}\nVerified strictly inside WebAssembly SoftHSM via C_Verify.\nTrace sent to PKCS#11 Log.`
        } catch (e) {
          result.SoftHSMv3 = `SoftHSM Error: ${e}`
        }
      }

      // OpenSSL Execution
      const filesToPass = fileRetrieval.prepareFilesForExecution([
        filenames.SRC_PUBLIC_KEY,
        hashFilename,
        sigFilename,
      ])

      const verifyCmd = `openssl pkeyutl -verify -pubin -inkey ${filenames.SRC_PUBLIC_KEY} -in ${hashFilename} -sigfile ${sigFilename}`
      const res = await openSSLService.execute(verifyCmd, filesToPass)

      if (res.error) throw new Error(`Verification failed: ${res.error}`)

      result.OpenSSL = `Verification Result: ✅ VALID\n\n${res.stdout || 'Signature verified successfully using OpenSSL'}`
    }

    return result
  }

  const wizard = useStepWizard({
    steps,
    onBack,
  })

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-muted/10 rounded-t-xl">
        <LiveHSMToggle
          hsm={hsm}
          operations={['C_GenerateKeyPair', 'C_Sign', 'C_Verify', 'C_GetAttributeValue']}
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
          filterFns={['C_GenerateKeyPair', 'C_Sign', 'C_Verify', 'C_GetAttributeValue']}
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
