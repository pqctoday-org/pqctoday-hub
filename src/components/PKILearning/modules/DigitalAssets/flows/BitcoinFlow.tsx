import React from 'react'
import type { Step } from '../components/StepWizard'
import { StepWizard } from '../components/StepWizard'
import { openSSLService } from '../../../../../services/crypto/OpenSSLService'
import { useOpenSSLStore } from '../../../../OpenSSLStudio/store'
import { sha256 } from '@noble/hashes/sha2.js'
import { ripemd160 } from '@noble/hashes/legacy.js'
import { createBase58check } from '@scure/base'
import { bytesToHex } from '@noble/hashes/utils.js'
import { useStepWizard } from '../hooks/useStepWizard'
import { DIGITAL_ASSETS_CONSTANTS } from '../constants'
import { extractKeyFromOpenSSLOutput } from '../../../../../utils/cryptoUtils'
import { BitcoinFlowDiagram } from '../components/CryptoFlowDiagram'
import { InfoTooltip } from '../components/InfoTooltip'

interface BitcoinFlowProps {
  onBack: () => void
}

export const BitcoinFlow: React.FC<BitcoinFlowProps> = ({ onBack }) => {
  const { addFile } = useOpenSSLStore()
  const [publicKeyBytes, setPublicKeyBytes] = React.useState<Uint8Array | null>(null)
  const [filenames, setFilenames] = React.useState<{
    SRC_PRIVATE_KEY: string
    SRC_PUBLIC_KEY: string
    DST_PRIVATE_KEY: string
    DST_PUBLIC_KEY: string
  } | null>(null)
  const [recipientPublicKeyBytes, setRecipientPublicKeyBytes] = React.useState<Uint8Array | null>(
    null
  )
  const [sourceAddress, setSourceAddress] = React.useState<string | null>(null)
  const [recipientAddress, setRecipientAddress] = React.useState<string | null>(null)
  const [transactionData, setTransactionData] = React.useState<{
    amount: number
    fee: number
    recipientAddress: string
    sourceAddress: string
  } | null>(null)
  const [editableRecipientAddress, setEditableRecipientAddress] = React.useState<string>('')
  const [transactionBytes, setTransactionBytes] = React.useState<Uint8Array | null>(null)

  // Artifact filenames state
  const [artifactFilenames, setArtifactFilenames] = React.useState<{
    trans: string
    hash: string
    sig: string
  }>({ trans: '', hash: '', sig: '' })

  const getTimestamp = () => new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)

  // Initialize filenames on mount
  React.useEffect(() => {
    if (!filenames) {
      const src = DIGITAL_ASSETS_CONSTANTS.getFilenames('SRC_bitcoin')
      const dst = DIGITAL_ASSETS_CONSTANTS.getFilenames('DST_bitcoin')
      setFilenames({
        SRC_PRIVATE_KEY: src.PRIVATE_KEY,
        SRC_PUBLIC_KEY: src.PUBLIC_KEY,
        DST_PRIVATE_KEY: dst.PRIVATE_KEY,
        DST_PUBLIC_KEY: dst.PUBLIC_KEY,
      })
    }
  }, [filenames])

  const steps: Step[] = [
    {
      id: 'gen_key',
      title: 'Generate Source Key',
      description: 'Generate a secp256k1 private key for the sender using OpenSSL.',
      code: `// Generate sender's private key\n${DIGITAL_ASSETS_CONSTANTS.COMMANDS.BITCOIN.GEN_KEY(filenames?.SRC_PRIVATE_KEY || 'src_key.pem')}`,
      language: 'bash',
      actionLabel: 'Generate Source Key',
      diagram: <BitcoinFlowDiagram />,
    },
    {
      id: 'pub_key',
      title: 'Derive Source Public Key',
      description:
        "Derive the sender's public key using the standard elliptic curve cryptography (ECC) process. This is a one-way trapdoor function: Public Key = Private Key × G (where G is the generator point on secp256k1). It's computationally easy to derive the public key from the private key, but practically impossible to reverse (derive private key from public key). Bitcoin uses compressed public keys (33 bytes) which store only the x-coordinate plus a prefix byte (0x02 or 0x03) indicating y-coordinate parity, instead of the full uncompressed format (65 bytes with both x and y coordinates).",
      code: `// Derive sender's public key\n${DIGITAL_ASSETS_CONSTANTS.COMMANDS.BITCOIN.EXTRACT_PUB(filenames?.SRC_PRIVATE_KEY || 'src_key.pem', filenames?.SRC_PUBLIC_KEY || 'src_pub.pem')}\n\n// Standard ECC Process:\n// 1. Private key (scalar) × Generator point G = Public key point (x, y)\n// 2. Compress: Use x-coordinate + prefix (0x02 if y is even, 0x03 if y is odd)\n// 3. Result: 33-byte compressed public key (vs 65-byte uncompressed)`,
      language: 'bash',
      actionLabel: 'Derive Public Key',
    },
    {
      id: 'address',
      title: 'Create Source Address',
      description: (
        <>
          Hash the sender's public key (SHA256 + RIPEMD160) and encode with Base58Check to create a{' '}
          <InfoTooltip term="p2pkh" /> address.
        </>
      ),
      code: `// 1. SHA256\nconst sha = sha256(pubKeyBytes);\n\n// 2. RIPEMD160\nconst ripemd = ripemd160(sha);\n\n// 3. Base58Check Encode\nconst address = base58check(ripemd);`,
      language: 'javascript',
      actionLabel: 'Create Source Address',
    },
    {
      id: 'gen_recipient_key',
      title: 'Generate Recipient Key',
      description: 'Generate a key pair for the recipient to receive funds.',
      code: `// Generate recipient's private key\n${DIGITAL_ASSETS_CONSTANTS.COMMANDS.BITCOIN.GEN_KEY(filenames?.DST_PRIVATE_KEY || 'dst_key.pem')}\n\n// Derive recipient's public key\n${DIGITAL_ASSETS_CONSTANTS.COMMANDS.BITCOIN.EXTRACT_PUB(filenames?.DST_PRIVATE_KEY || 'dst_key.pem', filenames?.DST_PUBLIC_KEY || 'dst_pub.pem')}`,
      language: 'bash',
      actionLabel: 'Generate Recipient Key',
    },
    {
      id: 'recipient_address',
      title: 'Create Recipient Address',
      description: "Derive the recipient's address from their public key.",
      code: `// Derive recipient address\nconst recipientAddress = createAddress(recipientPubKeyBytes);`,
      language: 'javascript',
      actionLabel: 'Create Recipient Address',
    },
    {
      id: 'format_tx',
      title: 'Format Transaction',
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
          description: 'Previous transaction hash (32B) + output index (4B) + script length + scriptSig + sequence (4B)',
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
    },
    {
      id: 'visualize_msg',
      title: 'Visualize Message',
      description: 'View the raw transaction structure that will be hashed and signed.',
      code: '', // Replaced by explanationTable
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
      ],
    },
    {
      id: 'sign',
      title: 'Sign Transaction',
      description: "Sign the transaction hash (Double SHA256) using the sender's private key.",
      code: `// 1. Double SHA256 of message\nconst sighash = sha256(sha256(rawTxBytes));\n\n// 2. Sign with OpenSSL\n// Using dynamic filenames for consistency\nopenssl pkeyutl -sign -inkey ${filenames?.SRC_PRIVATE_KEY || 'src_key.pem'} -in bitcoin_hashdata_[ts].dat -out bitcoin_signdata_[ts].sig`,
      language: 'bash',
      actionLabel: 'Sign Transaction',
    },
    {
      id: 'verify',
      title: 'Verify Signature',
      description:
        "Verify the transaction signature using the sender's public key with standard ECDSA verification. This is the same process used in all ECC-based systems (TLS, SSH, etc.). The verifier uses the public key, signature (r, s), and message hash to mathematically confirm the signature was created by the corresponding private key. Bitcoin's verification is identical to classical ECC verification - there's nothing blockchain-specific about this cryptographic operation. The verification equation checks: r ≡ x₁ (mod n), where x₁ is derived from s⁻¹ × (H(m) × G + r × PublicKey).",
      code: `// Verify with OpenSSL\nopenssl pkeyutl -verify -pubin -inkey ${filenames?.SRC_PUBLIC_KEY || 'src_pub.pem'} -in bitcoin_hashdata_[ts].dat -sigfile bitcoin_signdata_[ts].sig\n\n// Standard ECDSA Verification Process:\n// 1. Parse signature (r, s) from DER format\n// 2. Compute hash H(m) of the message\n// 3. Calculate u₁ = H(m) × s⁻¹ mod n\n// 4. Calculate u₂ = r × s⁻¹ mod n\n// 5. Compute point (x₁, y₁) = u₁ × G + u₂ × PublicKey\n// 6. Verify: r ≡ x₁ (mod n)\n// If true, signature is valid`,
      language: 'bash',
      actionLabel: 'Verify Signature',
    },
  ]

  const executeStep = async () => {
    if (!filenames) throw new Error('Filenames not initialized')
    const step = steps[wizard.currentStep]
    let result = ''

    if (step.id === 'gen_key') {
      // 1. Generate Private Key
      const cmd = DIGITAL_ASSETS_CONSTANTS.COMMANDS.BITCOIN.GEN_KEY(filenames.SRC_PRIVATE_KEY)
      const res = await openSSLService.execute(cmd)
      if (res.error) throw new Error(res.error)

      // Add generated file to store
      res.files.forEach((file) => {
        addFile({
          name: file.name,
          type: 'key',
          content: file.data,
          size: file.data.length,
          timestamp: Date.now(),
        })
      })

      // 2. Extract Raw Key using OpenSSL text output
      const rawKeyBytes = await extractKeyFromOpenSSLOutput(
        filenames.SRC_PRIVATE_KEY,
        'private',
        res.files
      )
      const cleanPrivHex = bytesToHex(rawKeyBytes)

      // Read the key file for PEM display
      const readRes = await openSSLService.execute(
        `openssl enc -base64 -in ${filenames.SRC_PRIVATE_KEY}`,
        res.files
      )
      const keyContent = atob(readRes.stdout.replace(/\n/g, ''))

      result = `Generated Source Private Key (Hex):\n${cleanPrivHex}\n\nPEM Format:\n${keyContent}`
    } else if (step.id === 'pub_key') {
      // 1. Derive Public Key in PEM format
      const cmd = DIGITAL_ASSETS_CONSTANTS.COMMANDS.BITCOIN.EXTRACT_PUB(
        filenames.SRC_PRIVATE_KEY,
        filenames.SRC_PUBLIC_KEY
      )

      // Retrieve private key from store to ensure it exists in worker (robustness)
      const privateKeyFile = useOpenSSLStore.getState().getFile(filenames.SRC_PRIVATE_KEY)
      const filesToPass = privateKeyFile
        ? [{ name: privateKeyFile.name, data: privateKeyFile.content as Uint8Array }]
        : []

      const res = await openSSLService.execute(cmd, filesToPass)
      if (res.error) throw new Error(res.error)

      // Add generated file to store
      res.files.forEach((file) => {
        addFile({
          name: file.name,
          type: 'key',
          content: file.data,
          size: file.data.length,
          timestamp: Date.now(),
        })
      })

      // 2. Extract Raw Key using OpenSSL text output
      // Note: For Public Key, we use the PUBLIC_KEY file
      const rawKeyBytes = await extractKeyFromOpenSSLOutput(
        filenames.SRC_PUBLIC_KEY,
        'public',
        res.files
      )
      const cleanPubHex = bytesToHex(rawKeyBytes)

      setPublicKeyBytes(rawKeyBytes)

      // Read PEM for display
      const readRes = await openSSLService.execute(
        `openssl enc -base64 -in ${filenames.SRC_PUBLIC_KEY}`,
        res.files
      )
      const pubKeyPem = atob(readRes.stdout.replace(/\n/g, ''))

      result = `Derived Source Public Key (Hex):\n${cleanPubHex}\n\nPEM Format:\n${pubKeyPem}`
    } else if (step.id === 'address') {
      if (!publicKeyBytes) throw new Error('Public key not found')

      const pubKeyHex = bytesToHex(publicKeyBytes)

      // 1. SHA256
      const shaHash = sha256(publicKeyBytes)

      // 2. RIPEMD160
      const ripemdHash = ripemd160(shaHash)

      // 3. Base58Check (Version 0x00 for Mainnet P2PKH)
      const base58check = createBase58check(sha256)
      const address = base58check.encode(Uint8Array.from([0x00, ...ripemdHash]))

      setSourceAddress(address)

      result = `Source Public Key (Hex):\n${pubKeyHex}\n\nSHA256 Hash:\n${bytesToHex(shaHash)}\n\nRIPEMD160 Hash:\n${bytesToHex(ripemdHash)}\n\nBitcoin Address (P2PKH):\n${address}`
    } else if (step.id === 'gen_recipient_key') {
      // 1. Generate Recipient Private Key
      const cmd1 = DIGITAL_ASSETS_CONSTANTS.COMMANDS.BITCOIN.GEN_KEY(filenames.DST_PRIVATE_KEY)
      const res1 = await openSSLService.execute(cmd1)
      if (res1.error) throw new Error(res1.error)

      // 2. Derive Recipient Public Key
      // We need to pass the private key file we just generated (it's in res1.files)
      const cmd2 = DIGITAL_ASSETS_CONSTANTS.COMMANDS.BITCOIN.EXTRACT_PUB(
        filenames.DST_PRIVATE_KEY,
        filenames.DST_PUBLIC_KEY
      )
      const res2 = await openSSLService.execute(cmd2, res1.files)
      if (res2.error) throw new Error(res2.error)

      // Add all generated files to store
      const allFiles = [...res1.files, ...res2.files]
      allFiles.forEach((file) => {
        addFile({
          name: file.name,
          type: 'key',
          content: file.data,
          size: file.data.length,
          timestamp: Date.now(),
        })
      })

      // Extract public key bytes for next step
      const rawKeyBytes = await extractKeyFromOpenSSLOutput(
        filenames.DST_PUBLIC_KEY,
        'public',
        allFiles
      )
      setRecipientPublicKeyBytes(rawKeyBytes)

      result = `Generated Recipient Keys:\n${filenames.DST_PRIVATE_KEY}\n${filenames.DST_PUBLIC_KEY}\n\nRecipient Public Key (Hex):\n${bytesToHex(rawKeyBytes)}`
    } else if (step.id === 'recipient_address') {
      if (!recipientPublicKeyBytes) throw new Error('Recipient public key not found')

      // 1. SHA256
      const shaHash = sha256(recipientPublicKeyBytes)
      // 2. RIPEMD160
      const ripemdHash = ripemd160(shaHash)
      // 3. Base58Check
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
      setTransactionData(txData)

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
            txid: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // Dummy hash
            vout: 0,
            scriptSig: `<signature> <pubkey>`,
            sequence: 0xffffffff,
          },
        ],
        outputCount: 2,
        outputs: [
          {
            value: 50000000, // 0.5 BTC in satoshis
            scriptPubKey: `OP_DUP OP_HASH160 ${editableRecipientAddress} OP_EQUALVERIFY OP_CHECKSIG`,
          },
          {
            value: 49990000, // Change
            scriptPubKey: `OP_DUP OP_HASH160 ${sourceAddress} OP_EQUALVERIFY OP_CHECKSIG`,
          },
        ],
        locktime: 0,
      }

      // Create raw bytes for visualization
      const txJson = JSON.stringify(rawTx, null, 2)
      const txBytes = new TextEncoder().encode(txJson)
      const hexString = bytesToHex(txBytes)

      // Store bytes for download
      setTransactionBytes(txBytes)

      // Format hex dump (16 bytes per line with ASCII)
      const formatHexDump = (hex: string) => {
        const lines: string[] = []
        for (let i = 0; i < hex.length; i += 32) {
          const chunk = hex.slice(i, i + 32)
          const offset = (i / 2).toString(16).padStart(8, '0')

          // Split into byte pairs
          const bytes = chunk.match(/.{1,2}/g) || []
          const hexPart = bytes.join(' ').padEnd(47, ' ')

          // ASCII representation
          const ascii = bytes
            .map(b => {
              const code = parseInt(b, 16)
              return code >= 32 && code <= 126 ? String.fromCharCode(code) : '.'
            })
            .join('')

          lines.push(`${offset}  ${hexPart}  |${ascii}|`)
        }
        return lines.join('\n')
      }

      // Save Raw Transaction Artifact
      const timestamp = getTimestamp()
      const transFilename = `bitcoin_transdata_${timestamp}.dat`

      // Update state for next steps
      setArtifactFilenames(prev => ({ ...prev, trans: transFilename }))

      addFile({
        name: transFilename,
        type: 'binary',
        content: txBytes,
        size: txBytes.length,
        timestamp: Date.now(),
      })

      result = `Raw Transaction Structure (to be hashed):
${JSON.stringify(rawTx, null, 2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RAW HEX BYTES (${txBytes.length} bytes total):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Offset    Hex Bytes                                        ASCII
--------  -----------------------------------------------  ----------------
${formatHexDump(hexString)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Full Hex String (for signing):
${hexString}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📂 Artifact Saved: ${transFilename}`
    } else if (step.id === 'sign') {
      if (!transactionBytes) {
        throw new Error('Transaction bytes not found. Please execute step 7 (Visualize Message) first.')
      }

      // Generate consistent filenames for this run
      const timestamp = getTimestamp()
      const inputTransFile = artifactFilenames.trans || `bitcoin_transdata_${timestamp}.dat`
      const hashFilename = `bitcoin_hashdata_${timestamp}.dat`
      const sigFilename = `bitcoin_signdata_${timestamp}.sig`

      setArtifactFilenames(prev => ({ ...prev, hash: hashFilename, sig: sigFilename }))

      const msg = JSON.stringify(transactionData) // For display
      const msgData = transactionBytes

      // 1. Create transaction file (if needed, or just use the buffer)
      // We'll write it to the worker so the command can reference it by name
      // Note: We use execute to just write the file if we needed to, but we can pass it directly.
      // However, to show the user the command 'openssl dgst ... inputfile', the file must exist in the worker.
      // So ensuring the file exists:
      if (!useOpenSSLStore.getState().getFile(inputTransFile)) {
        addFile({
          name: inputTransFile,
          type: 'binary',
          content: msgData,
          size: msgData.length,
          timestamp: Date.now(),
        })
      }

      // 2. Double SHA256 (Hash256)
      const hash1Bytes = sha256(msgData)
      const sighashBytes = sha256(hash1Bytes)

      // We perform the double hash construction commands for display and execution simulation
      const tempHashFile = 'temp_sha256.bin'

      // Step 2a: First Hash
      await openSSLService.execute(
        `openssl dgst -sha256 -binary -out ${tempHashFile} ${inputTransFile}`,
        [{ name: inputTransFile, data: msgData }]
      )

      // Step 2b: Second Hash (File to Sign)
      await openSSLService.execute(
        `openssl dgst -sha256 -binary -out ${hashFilename} ${tempHashFile}`,
        [{ name: tempHashFile, data: hash1Bytes }]
      )

      // 3. Sign with ECDSA
      const privateKeyFile = useOpenSSLStore.getState().getFile(filenames.SRC_PRIVATE_KEY)
      if (!privateKeyFile) {
        throw new Error(`Private key file not found: ${filenames.SRC_PRIVATE_KEY}. Please execute step 1 (Generate Source Key) first.`)
      }

      const filesToPass = [
        { name: hashFilename, data: sighashBytes },
        { name: privateKeyFile.name, data: privateKeyFile.content as Uint8Array }
      ]

      const signCmd = `openssl pkeyutl -sign -inkey ${filenames.SRC_PRIVATE_KEY} -in ${hashFilename} -out ${sigFilename}`

      const res = await openSSLService.execute(signCmd, filesToPass)
      if (res.error) throw new Error(res.error)

      const sigData = res.files.find((f) => f.name === sigFilename)?.data || new Uint8Array()

      // Add generated files to store (store artifact)
      addFile({
        name: hashFilename,
        type: 'binary',
        content: sighashBytes,
        size: sighashBytes.length,
        timestamp: Date.now(),
      })

      addFile({
        name: sigFilename,
        type: 'binary',
        content: sigData,
        size: sigData.length,
        timestamp: Date.now(),
      })

      // Read signature for display (Base64)
      const readRes = await openSSLService.execute(
        `openssl enc -base64 -in ${sigFilename}`,
        res.files
      )
      const sigBase64 = readRes.stdout.replace(/\n/g, '')

      // Also get hex
      const sigHex = Array.from(sigData)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')

      result = `Transaction Data (JSON):
${msg}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HASHING PROCESS (Commands Executed):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 1. First SHA-256
openssl dgst -sha256 -binary -out ${tempHashFile} ${inputTransFile}
> Hash: ${bytesToHex(hash1Bytes)}

# 2. Second SHA-256 (Hash to Sign)
openssl dgst -sha256 -binary -out ${hashFilename} ${tempHashFile}
> Hash: ${bytesToHex(sighashBytes)}

📂 Artifact Saved: ${hashFilename}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ECDSA SIGNING (Command Executed):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${signCmd}

Signature (DER Hex):
${sigHex}

Signature (Base64):
${sigBase64}

📂 Artifact Saved: ${sigFilename}`
    } else if (step.id === 'verify') {
      if (!transactionBytes) {
        throw new Error('Transaction bytes not found. Please execute step 7 first.')
      }

      const hashFilename = artifactFilenames.hash || 'btc_sighash.bin'
      const sigFilename = artifactFilenames.sig || 'btc_sig.der'

      const sighashBytes = sha256(sha256(transactionBytes))

      // Retrieve signature from store (saved in step 8)
      const signatureFile = useOpenSSLStore.getState().files.find((f) => f.name === sigFilename)
      if (!signatureFile) {
        throw new Error(`Signature file not found: ${sigFilename}. Please execute step 8 (Sign Transaction) first.`)
      }

      // Retrieve public key from store (saved in step 2)
      const publicKeyFile = useOpenSSLStore.getState().getFile(filenames.SRC_PUBLIC_KEY)
      if (!publicKeyFile) {
        throw new Error(`Public key file not found: ${filenames.SRC_PUBLIC_KEY}.`)
      }

      const filesToPass = [
        { name: hashFilename, data: sighashBytes },
        { name: sigFilename, data: signatureFile.content as Uint8Array },
        { name: publicKeyFile.name, data: publicKeyFile.content as Uint8Array }
      ]

      const verifyCmd = `openssl pkeyutl -verify -pubin -inkey ${filenames.SRC_PUBLIC_KEY} -in ${hashFilename} -sigfile ${sigFilename}`
      const res = await openSSLService.execute(verifyCmd, filesToPass)

      if (res.error) {
        throw new Error(`Verification failed: ${res.error}`)
      }

      const isValid = !res.error

      result = `Verification Result: ${isValid ? '✅ VALID' : '❌ INVALID'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERIFICATION COMMAND:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${verifyCmd}

${res.stdout || 'Signature verified successfully using OpenSSL'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILES USED:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Signature: ${sigFilename}
Hash Input: ${hashFilename}
Public Key: ${filenames.SRC_PUBLIC_KEY}
`
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
