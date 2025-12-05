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
    },
    {
      id: 'pub_key',
      title: 'Derive Source Public Key',
      description: "Derive the sender's public key from the private key.",
      code: `// Derive sender's public key\n${DIGITAL_ASSETS_CONSTANTS.COMMANDS.BITCOIN.EXTRACT_PUB(filenames?.SRC_PRIVATE_KEY || 'src_key.pem', filenames?.SRC_PUBLIC_KEY || 'src_pub.pem')}`,
      language: 'bash',
      actionLabel: 'Derive Public Key',
    },
    {
      id: 'address',
      title: 'Create Source Address',
      description:
        "Hash the sender's public key (SHA256 + RIPEMD160) and encode with Base58Check to create a P2PKH address.",
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
        'Define the transaction details including amount, fee, and addresses. Verify the recipient address carefully!',
      code: `const transaction = {\n  amount: 0.5,\n  fee: 0.0001,\n  sourceAddress: "${sourceAddress || '...'}",\n  recipientAddress: "${editableRecipientAddress || recipientAddress || '...'}"\n};`,
      language: 'javascript',
      actionLabel: 'Format Transaction',
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
      code: `// 1. Double SHA256 of message\nconst sighash = sha256(sha256(rawTxBytes));\n\n// 2. Sign with OpenSSL\nopenssl pkeyutl -sign -inkey ${filenames?.SRC_PRIVATE_KEY || 'src_key.pem'} -in sighash.bin -out sig.der`,
      language: 'bash',
      actionLabel: 'Sign Transaction',
    },
    {
      id: 'verify',
      title: 'Verify Signature',
      description: "Verify the transaction signature using the sender's public key.",
      code: `// Verify with OpenSSL\nopenssl pkeyutl -verify -pubin -inkey ${filenames?.SRC_PUBLIC_KEY || 'src_pub.pem'} -in sighash.bin -sigfile sig.der`,
      language: 'bash',
      actionLabel: 'Verify Signature',
    },
  ]

  // Helper to extract key from OpenSSL text output
  const extractKeyFromText = async (
    pemFile: string,
    type: 'private' | 'public',
    files: { name: string; data: Uint8Array }[] = []
  ): Promise<Uint8Array> => {
    // Ensure the file is in the list to pass to worker
    const filesToPass = [...files]
    if (!filesToPass.find((f) => f.name === pemFile)) {
      const storedFile = useOpenSSLStore.getState().getFile(pemFile)
      if (storedFile) {
        filesToPass.push({ name: storedFile.name, data: storedFile.content as Uint8Array })
      }
    }

    // Use -text to let OpenSSL parse the key structure
    const pubIn = type === 'public' ? '-pubin' : ''
    const cmd = `openssl pkey -in ${pemFile} ${pubIn} -text -noout`
    const res = await openSSLService.execute(cmd, filesToPass)
    if (res.error) throw new Error(res.error)

    const output = res.stdout
    let hexBlock = ''

    if (type === 'private') {
      // Extract content between "priv:" and "pub:" (or end)
      const match = output.match(/priv:([\s\S]*?)(?:pub:|ASN1|$)/)
      if (!match) throw new Error('Could not find private key in OpenSSL output')
      hexBlock = match[1]
    } else {
      // Extract content between "pub:" and "ASN1" (or end)
      const match = output.match(/pub:([\s\S]*?)(?:ASN1|$)/)
      if (!match) throw new Error('Could not find public key in OpenSSL output')
      hexBlock = match[1]
    }

    // Clean up hex string (remove newlines, spaces, colons)
    const cleanHex = hexBlock.replace(/[\s:]/g, '')

    // Convert to bytes
    const bytes = new Uint8Array(cleanHex.length / 2)
    for (let i = 0; i < cleanHex.length; i += 2) {
      bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16)
    }

    return bytes
  }

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
      const rawKeyBytes = await extractKeyFromText(filenames.SRC_PRIVATE_KEY, 'private', res.files)
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
      const rawKeyBytes = await extractKeyFromText(filenames.SRC_PUBLIC_KEY, 'public', res.files)
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
      const rawKeyBytes = await extractKeyFromText(filenames.DST_PUBLIC_KEY, 'public', allFiles)
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

      result = `Raw Transaction Structure (to be hashed):\n${JSON.stringify(rawTx, null, 2)}`
    } else if (step.id === 'sign') {
      const msg = JSON.stringify(transactionData) // Simplified for demo
      const msgData = new TextEncoder().encode(msg)
      const messageFileName = `btc_tx.txt`
      const sighashFileName = `btc_sighash.bin`
      const signatureName = `btc_sig.der`

      // 1. Create transaction file
      await openSSLService.execute(`echo "${msg}" > ${messageFileName}`, [
        { name: messageFileName, data: msgData },
      ])

      // 2. Double SHA256 (Hash256)
      // First SHA256
      await openSSLService.execute(`openssl dgst -sha256 -binary ${messageFileName}`, [
        { name: messageFileName, data: msgData },
      ])
      // We don't need the output of the first hash, just the file for the second step if we were chaining.
      // But since we use JS for the actual hashing logic below to be safe with binary data,
      // the OpenSSL calls here are mostly for demonstration/logging if we were capturing output.

      await openSSLService.execute(
        `openssl dgst -sha256 -binary -out temp_hash1.bin ${messageFileName}`,
        [{ name: messageFileName, data: msgData }]
      )

      const hash1Bytes = sha256(msgData)
      const sighashBytes = sha256(hash1Bytes)

      // Write sighash to file for signing
      const sighashFile = { name: sighashFileName, data: sighashBytes }

      // 3. Sign with ECDSA
      // Retrieve private key
      const privateKeyFile = useOpenSSLStore.getState().getFile(filenames.SRC_PRIVATE_KEY)
      const filesToPass = privateKeyFile
        ? [sighashFile, { name: privateKeyFile.name, data: privateKeyFile.content as Uint8Array }]
        : [sighashFile]

      const cmd = DIGITAL_ASSETS_CONSTANTS.COMMANDS.BITCOIN.SIGN(
        filenames.SRC_PRIVATE_KEY,
        sighashFileName,
        signatureName
      )
      const res = await openSSLService.execute(cmd, filesToPass)
      if (res.error) throw new Error(res.error)

      // Add generated signature file to store
      addFile({
        name: signatureName,
        type: 'binary',
        content: res.files.find((f) => f.name === signatureName)?.data || new Uint8Array(),
        size: res.files.find((f) => f.name === signatureName)?.data?.length || 0,
        timestamp: Date.now(),
      })

      // Read signature for display (Base64)
      const readRes = await openSSLService.execute(
        `openssl enc -base64 -in ${signatureName}`,
        res.files
      )
      const sigBase64 = readRes.stdout.replace(/\n/g, '')

      // Also get hex
      const sigHex = Array.from(res.files.find((f) => f.name === signatureName)?.data || [])
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')

      result = `Transaction Data:\n${msg}\n\nDouble SHA256 (Sighash):\n${bytesToHex(sighashBytes)}\n\nECDSA Signature (DER):\n${sigHex}\n\nSignature (Base64):\n${sigBase64}`
    } else if (step.id === 'verify') {
      const msg = JSON.stringify(transactionData)
      const msgData = new TextEncoder().encode(msg)
      const sighashFileName = `btc_sighash.bin`
      const signatureName = `btc_sig.der`

      // Re-compute sighash (or retrieve from store if we saved it, but re-computing is safer/easier here)
      const hash1Bytes = sha256(msgData)
      const sighashBytes = sha256(hash1Bytes)
      const sighashFile = { name: sighashFileName, data: sighashBytes }

      // Retrieve signature from store
      // We need to make sure we save it in step 4.
      // Let's assume I'll add that.

      const signatureFile = useOpenSSLStore.getState().files.find((f) => f.name === signatureName)
      const publicKeyFile = useOpenSSLStore.getState().getFile(filenames.SRC_PUBLIC_KEY)

      const filesToPass = [sighashFile]
      if (signatureFile)
        filesToPass.push({ name: signatureFile.name, data: signatureFile.content as Uint8Array })
      if (publicKeyFile)
        filesToPass.push({ name: publicKeyFile.name, data: publicKeyFile.content as Uint8Array })

      const cmd = DIGITAL_ASSETS_CONSTANTS.COMMANDS.BITCOIN.VERIFY(
        filenames.SRC_PUBLIC_KEY,
        sighashFileName,
        signatureName
      )
      const res = await openSSLService.execute(cmd, filesToPass)

      if (res.error) throw new Error(res.error)

      result = res.stdout || 'Signature Verified Successfully'
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
    />
  )
}
