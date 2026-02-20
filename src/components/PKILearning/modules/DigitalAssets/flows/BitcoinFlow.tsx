import React, { useMemo } from 'react'
import type { Step } from '../components/StepWizard'
import { StepWizard } from '../components/StepWizard'
import { openSSLService } from '../../../../../services/crypto/OpenSSLService'
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

  const steps: Step[] = [
    {
      id: 'gen_key',
      title: '1. Generate Source Key',
      description: 'Generate a secp256k1 private key for the sender using OpenSSL.',
      code: `// Generate sender's private key\n${DIGITAL_ASSETS_CONSTANTS.COMMANDS.BITCOIN.GEN_KEY(filenames.SRC_PRIVATE_KEY)}`,
      language: 'bash',
      actionLabel: 'Generate Source Key',
      diagram: <BitcoinFlowDiagram />,
    },
    {
      id: 'pub_key',
      title: '2. Derive Source Public Key',
      description:
        "Derive the sender's public key using the standard elliptic curve cryptography (ECC) process. This is a one-way trapdoor function: Public Key = Private Key × G (where G is the generator point on secp256k1). It's computationally easy to derive the public key from the private key, but practically impossible to reverse (derive private key from public key). Bitcoin uses compressed public keys (33 bytes) which store only the x-coordinate plus a prefix byte (0x02 or 0x03) indicating y-coordinate parity, instead of the full uncompressed format (65 bytes with both x and y coordinates).",
      code: `// Derive sender's public key\n${DIGITAL_ASSETS_CONSTANTS.COMMANDS.BITCOIN.EXTRACT_PUB(filenames.SRC_PRIVATE_KEY, filenames.SRC_PUBLIC_KEY)}\n\n// Standard ECC Process:\n// 1. Private key (scalar) × Generator point G = Public key point (x, y)\n// 2. Compress: Use x-coordinate + prefix (0x02 if y is even, 0x03 if y is odd)\n// 3. Result: 33-byte compressed public key (vs 65-byte uncompressed)`,
      language: 'bash',
      actionLabel: 'Derive Public Key',
    },
    {
      id: 'address',
      title: '3. Create Source Address',
      description: (
        <>
          Hash the sender's public key (SHA256 + RIPEMD160) and encode with Base58Check to create a{' '}
          <InfoTooltip term="p2pkh" /> address.
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
      description: 'Generate a key pair for the recipient to receive funds.',
      code: `// Generate recipient's private key\n${DIGITAL_ASSETS_CONSTANTS.COMMANDS.BITCOIN.GEN_KEY(filenames.DST_PRIVATE_KEY)}\n\n// Derive recipient's public key\n${DIGITAL_ASSETS_CONSTANTS.COMMANDS.BITCOIN.EXTRACT_PUB(filenames.DST_PRIVATE_KEY, filenames.DST_PUBLIC_KEY)}`,
      language: 'bash',
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
      description: "Sign the transaction hash (Double SHA256) using the sender's private key.",
      code: `// 1. Double SHA256 of message\nconst sighash = sha256(sha256(rawTxBytes));\n\n// 2. Sign with OpenSSL\n// Using dynamic filenames for consistency\n${DIGITAL_ASSETS_CONSTANTS.COMMANDS.BITCOIN.SIGN(filenames.SRC_PRIVATE_KEY, 'bitcoin_hashdata_[ts].dat', 'bitcoin_signdata_[ts].sig')}`,
      language: 'bash',
      actionLabel: 'Sign Transaction',
    },
    {
      id: 'verify',
      title: '9. Verify Signature',
      description:
        "Verify the transaction signature using the sender's public key with standard ECDSA verification. This is the same process used in all ECC-based systems (TLS, SSH, etc.). The verifier uses the public key, signature (r, s), and message hash to mathematically confirm the signature was created by the corresponding private key. Bitcoin's verification is identical to classical ECC verification - there's nothing blockchain-specific about this cryptographic operation. The verification equation checks: r ≡ x₁ (mod n), where x₁ is derived from s⁻¹ × (H(m) × G + r × PublicKey).",
      code: `// Verify with OpenSSL\n${DIGITAL_ASSETS_CONSTANTS.COMMANDS.BITCOIN.VERIFY(filenames.SRC_PUBLIC_KEY, 'bitcoin_hashdata_[ts].dat', 'bitcoin_signdata_[ts].sig')}\n\n// Standard ECDSA Verification Process:\n// 1. Parse signature (r, s) from DER format\n// 2. Compute hash H(m) of the message\n// 3. Calculate u₁ = H(m) × s⁻¹ mod n\n// 4. Calculate u₂ = r × s⁻¹ mod n\n// 5. Compute point (x₁, y₁) = u₁ × G + u₂ × PublicKey\n// 6. Verify: r ≡ x₁ (mod n)\n// If true, signature is valid`,
      language: 'bash',
      actionLabel: 'Verify Signature',
    },
  ]

  const executeStep = async () => {
    const step = steps[wizard.currentStep]
    let result = ''

    if (step.id === 'gen_key') {
      const { keyPair } = await keyGen.generateKeyPair(
        filenames.SRC_PRIVATE_KEY,
        filenames.SRC_PUBLIC_KEY
      )

      // Retrieve PEM content for display
      const files = fileRetrieval.prepareFilesForExecution([filenames.SRC_PRIVATE_KEY])
      const readRes = await openSSLService.execute(
        `openssl enc -base64 -in ${filenames.SRC_PRIVATE_KEY}`,
        files
      )
      const keyContent = atob(readRes.stdout.replace(/\n/g, ''))

      result = `Generated Source Private Key (Hex):\n${keyPair.privateKeyHex}\n\nPEM Format:\n${keyContent}`
    } else if (step.id === 'pub_key') {
      // Key generation handles public key extraction too, so we just display it
      // Standardize usage: if this step is reached without keyGen having data (e.g. reload), regenerate or error
      if (!keyGen.publicKeyHex) {
        // Fallback: Try to regenerate or error. For simplicity here we error
        throw new Error('Public key not found. Please execute Step 1 first.')
      }

      // Retrieve PEM content for display
      const files = fileRetrieval.prepareFilesForExecution([filenames.SRC_PUBLIC_KEY])
      const readRes = await openSSLService.execute(
        `openssl enc -base64 -in ${filenames.SRC_PUBLIC_KEY}`,
        files
      )
      const pubKeyPem = atob(readRes.stdout.replace(/\n/g, ''))

      result = `Derived Source Public Key (Hex):\n${keyGen.publicKeyHex}\n\nPEM Format:\n${pubKeyPem}`
    } else if (step.id === 'address') {
      if (!keyGen.publicKey) throw new Error('Public key not found')

      // 1. SHA256
      const shaHash = sha256(keyGen.publicKey)
      // 2. RIPEMD160
      const ripemdHash = ripemd160(shaHash)
      // 3. Base58Check
      const base58check = createBase58check(sha256)
      const address = base58check.encode(Uint8Array.from([0x00, ...ripemdHash]))

      setSourceAddress(address)

      result = `Source Public Key (Hex):\n${keyGen.publicKeyHex}\n\nSHA256 Hash:\n${bytesToHex(shaHash)}\n\nRIPEMD160 Hash:\n${bytesToHex(ripemdHash)}\n\nBitcoin Address (P2PKH):\n${address}`
    } else if (step.id === 'gen_recipient_key') {
      const { keyPair } = await recipientKeyGen.generateKeyPair(
        filenames.DST_PRIVATE_KEY,
        filenames.DST_PUBLIC_KEY
      )

      result = `Generated Recipient Keys:\n${filenames.DST_PRIVATE_KEY}\n${filenames.DST_PUBLIC_KEY}\n\nRecipient Public Key (Hex):\n${keyPair.publicKeyHex}`
    } else if (step.id === 'recipient_address') {
      if (!recipientKeyGen.publicKey) throw new Error('Recipient public key not found')

      // SHA256 + RIPEMD160 + Base58Check
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
      // setTransactionData(txData)

      const isModified = editableRecipientAddress !== recipientAddress
      const warning = isModified
        ? '\n\n⚠️ WARNING: Recipient address has been modified! Signing this transaction may result in loss of funds.'
        : ''

      result = `Transaction Details:\n${JSON.stringify(txData, null, 2)}${warning}`
    } else if (step.id === 'visualize_msg') {
      // Visualize the raw transaction structure
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

      // Create raw bytes for visualization
      const txJson = JSON.stringify(rawTx, null, 2)
      const txBytes = new TextEncoder().encode(txJson)
      setTransactionBytes(txBytes)

      // Save Raw Transaction Artifact
      const transFilename = artifacts.saveTransaction('bitcoin', txBytes)

      result = `Raw Transaction Structure (to be hashed):\n${JSON.stringify(rawTx, null, 2)}\n\n📂 Artifact Saved: ${transFilename}`
    } else if (step.id === 'sign') {
      if (!transactionBytes) throw new Error('Transaction bytes not found')

      const inputTransFile =
        artifacts.filenames.trans || artifacts.saveTransaction('bitcoin', transactionBytes)

      // Calculate hashes
      const hash1Bytes = sha256(transactionBytes)
      const sighashBytes = sha256(hash1Bytes)

      const hashFilename = artifacts.saveHash('bitcoin', sighashBytes)
      const tempHashFile = 'temp_sha256.bin'

      // Ensure files execution context
      const transFile = fileRetrieval.getFile(inputTransFile)
      if (transFile) {
        // Run OpenSSL for valid display but use artifacts hooks for state
        await openSSLService.execute(
          `openssl dgst -sha256 -binary -out ${tempHashFile} ${inputTransFile}`,
          [transFile]
        )
      }

      // 3. Sign with ECDSA
      // Need private key file for signing
      const filesToPass = fileRetrieval.prepareFilesForExecution([filenames.SRC_PRIVATE_KEY])
      // Add hash file manually since it's an artifact not in 'prepareFiles' necessarily if just created
      filesToPass.push({ name: hashFilename, data: sighashBytes })

      const sigFilename = `bitcoin_signdata_${artifacts.getTimestamp()}.sig`
      const signCmd = `openssl pkeyutl -sign -inkey ${filenames.SRC_PRIVATE_KEY} -in ${hashFilename} -out ${sigFilename}`

      const res = await openSSLService.execute(signCmd, filesToPass)
      if (res.error) throw new Error(res.error)

      // Retrieve and save signature using artifact hook
      const sigData = res.files.find((f) => f.name === sigFilename)?.data || new Uint8Array()
      artifacts.saveSignature('bitcoin', sigData)

      // Read signature for display
      const readRes = await openSSLService.execute(
        `openssl enc -base64 -in ${sigFilename}`,
        res.files
      )
      const sigBase64 = readRes.stdout.replace(/\n/g, '')

      result = `Transaction Signed Successfully!\n\nSignature (Base64):\n${sigBase64}\n\n📂 Artifact Saved: ${sigFilename}`
    } else if (step.id === 'verify') {
      if (!transactionBytes) throw new Error('Transaction bytes not found')

      const hashFilename = artifacts.filenames.hash || 'btc_sighash.bin'
      const sigFilename = artifacts.filenames.sig || 'btc_sig.der'

      const filesToPass = fileRetrieval.prepareFilesForExecution([
        filenames.SRC_PUBLIC_KEY,
        hashFilename,
        sigFilename,
      ])

      const verifyCmd = `openssl pkeyutl -verify -pubin -inkey ${filenames.SRC_PUBLIC_KEY} -in ${hashFilename} -sigfile ${sigFilename}`
      const res = await openSSLService.execute(verifyCmd, filesToPass)

      if (res.error) throw new Error(`Verification failed: ${res.error}`)

      result = `Verification Result: ✅ VALID\n\n${res.stdout || 'Signature verified successfully using OpenSSL'}`
    }

    return result
  }

  const wizard = useStepWizard({
    steps,
    onBack,
  })

  return (
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
  )
}
