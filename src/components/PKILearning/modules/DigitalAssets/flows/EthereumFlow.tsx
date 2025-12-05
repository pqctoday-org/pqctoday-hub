import React, { useState } from 'react'
import type { Step } from '../components/StepWizard'
import { StepWizard } from '../components/StepWizard'
import { openSSLService } from '../../../../../services/crypto/OpenSSLService'
import { useOpenSSLStore } from '../../../../OpenSSLStudio/store'
import { secp256k1 } from '@noble/curves/secp256k1.js'
import { keccak_256 } from '@noble/hashes/sha3.js'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'
import { useStepWizard } from '../hooks/useStepWizard'
import { DIGITAL_ASSETS_CONSTANTS } from '../constants'

interface EthereumFlowProps {
  onBack: () => void
}

export const EthereumFlow: React.FC<EthereumFlowProps> = ({ onBack }) => {
  const { addFile } = useOpenSSLStore()
  const [privateKeyHex, setPrivateKeyHex] = useState<string | null>(null)
  const [publicKeyHex, setPublicKeyHex] = useState<string | null>(null)
  const [rawPubKey, setRawPubKey] = useState<Uint8Array | null>(null)

  const [txHash, setTxHash] = useState<string | null>(null)
  const [signature, setSignature] = useState<{ r: bigint; s: bigint; recovery: number } | null>(
    null
  )
  const [filenames, setFilenames] = useState<{
    SRC_PRIVATE_KEY: string
    SRC_PUBLIC_KEY: string
    DST_PRIVATE_KEY: string
    DST_PUBLIC_KEY: string
  } | null>(null)
  const [recipientPublicKeyHex, setRecipientPublicKeyHex] = useState<string | null>(null)
  const [sourceAddress, setSourceAddress] = useState<string | null>(null)
  const [recipientAddress, setRecipientAddress] = useState<string | null>(null)
  const [transactionData, setTransactionData] = useState<{
    nonce: number
    gasPrice: string
    gasLimit: number
    to: string
    value: string
    data: string
    chainId: number
  } | null>(null)
  const [editableRecipientAddress, setEditableRecipientAddress] = useState<string>('')

  // Initialize filenames on mount
  React.useEffect(() => {
    if (!filenames) {
      const src = DIGITAL_ASSETS_CONSTANTS.getFilenames('SRC_ethereum')
      const dst = DIGITAL_ASSETS_CONSTANTS.getFilenames('DST_ethereum')
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
      id: 'keygen',
      title: '1. Generate Source Keypair',
      description: 'Generate a secp256k1 private key for the sender using OpenSSL.',
      code: `// OpenSSL Command\nopenssl ecparam -name secp256k1 -genkey -noout -out ${filenames?.SRC_PRIVATE_KEY || 'src_key.pem'}`,
      language: 'bash',
      actionLabel: 'Generate Source Key',
    },
    {
      id: 'pubkey',
      title: '2. Derive Source Public Key',
      description: 'Derive the uncompressed public key (65 bytes) from the private key.',
      code: `// OpenSSL Command\nopenssl ec -in ${filenames?.SRC_PRIVATE_KEY || 'src_key.pem'} -pubout -out ${filenames?.SRC_PUBLIC_KEY || 'src_pub.pem'}`,
      language: 'bash',
      actionLabel: 'Extract Public Key',
    },
    {
      id: 'address',
      title: '3. Derive Source Address',
      description:
        'Compute the Keccak-256 hash of the public key and take the last 20 bytes. Then apply EIP-55 checksum.',
      code: `// JavaScript Execution\nconst hash = keccak_256(rawPubKey);\nconst addressBytes = hash.slice(-20);\nconst address = toChecksumAddress(bytesToHex(addressBytes));`,
      language: 'javascript',
      actionLabel: 'Generate Source Address',
    },
    {
      id: 'gen_recipient_key',
      title: '4. Generate Recipient Keypair',
      description: 'Generate a key pair for the recipient to receive funds.',
      code: `// OpenSSL Command\nopenssl ecparam -name secp256k1 -genkey -noout -out ${filenames?.DST_PRIVATE_KEY || 'dst_key.pem'}\n\n// Extract Public Key\nopenssl ec -in ${filenames?.DST_PRIVATE_KEY || 'dst_key.pem'} -pubout -out ${filenames?.DST_PUBLIC_KEY || 'dst_pub.pem'}`,
      language: 'bash',
      actionLabel: 'Generate Recipient Key',
    },
    {
      id: 'recipient_address',
      title: '5. Derive Recipient Address',
      description: "Derive the recipient's address from their public key.",
      code: `// JavaScript Execution\nconst recipientAddress = deriveAddress(recipientPubKey);`,
      language: 'javascript',
      actionLabel: 'Derive Recipient Address',
    },
    {
      id: 'format_tx',
      title: '6. Format Transaction',
      description: 'Define the transaction details. Verify the recipient address carefully!',
      code: `const transaction = {\n  nonce: 0,\n  gasPrice: "20000000000", // 20 Gwei\n  gasLimit: 21000,\n  to: "${editableRecipientAddress || recipientAddress || '...'}",\n  value: "1500000000000000000", // 1.5 ETH\n  data: "0x",\n  chainId: 1\n};`,
      language: 'javascript',
      actionLabel: 'Format Transaction',
    },
    {
      id: 'visualize_msg',
      title: 'Visualize RLP Structure',
      description: 'View the RLP encoded structure fields that will be hashed and signed.',
      code: '',
      language: 'javascript',
      actionLabel: 'Visualize Message',
      explanationTable: [
        {
          label: 'Nonce',
          value: '0',
          description: 'Counter to prevent replay attacks. Starts at 0 for new accounts.',
        },
        {
          label: 'Gas Price',
          value: '20 Gwei',
          description: 'Price per unit of gas (in Wei) the sender is willing to pay.',
        },
        {
          label: 'Gas Limit',
          value: '21000',
          description: 'Maximum gas allowed for the transaction (21000 is standard for transfers).',
        },
        {
          label: 'To',
          value: editableRecipientAddress || recipientAddress || '...',
          description: 'The destination address (20 bytes).',
        },
        {
          label: 'Value',
          value: '1.5 ETH',
          description: 'Amount of Ether to transfer (in Wei).',
        },
        {
          label: 'Data',
          value: '0x',
          description: 'Input data for contract calls. Empty for simple transfers.',
        },
        {
          label: 'Chain ID',
          value: '1',
          description: 'EIP-155 Chain ID (1 = Mainnet) to prevent replay across chains.',
        },
        {
          label: 'r, s',
          value: '0, 0',
          description: 'Dummy signature values used during hashing (EIP-155).',
        },
      ],
    },
    {
      id: 'sign',
      title: '8. Sign Transaction',
      description: 'Create a transaction, hash it with Keccak-256, and sign with ECDSA.',
      code: `// JavaScript Execution\nconst txHash = keccak_256(rlpEncodedTx);\nconst sig = secp256k1.sign(txHash, privKey, { lowS: true });`,
      language: 'javascript',
      actionLabel: 'Sign Transaction',
    },
    {
      id: 'verify',
      title: '9. Verify Signature',
      description: 'Verify the signature and recover the public key/address from it.',
      code: `// JavaScript Execution\nconst isValid = secp256k1.verify(sig, txHash, pubKey);\nconst recovered = sig.recoverPublicKey(txHash);\nconst recoveredAddress = deriveAddress(recovered);`,
      language: 'javascript',
      actionLabel: 'Verify & Recover',
    },
  ]

  // Helper to get checksum address
  const toChecksumAddress = (address: string) => {
    const addr = address.toLowerCase().replace('0x', '')
    const hash = keccak_256(new TextEncoder().encode(addr))
    const hashHex = bytesToHex(hash)
    let result = '0x'
    for (let i = 0; i < 40; i++) {
      // eslint-disable-next-line security/detect-object-injection
      result += parseInt(hashHex[i], 16) >= 8 ? addr[i].toUpperCase() : addr[i]
    }
    return result
  }

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

    const pubIn = type === 'public' ? '-pubin' : ''
    const cmd = `openssl pkey -in ${pemFile} ${pubIn} -text -noout`
    const res = await openSSLService.execute(cmd, filesToPass)
    if (res.error) throw new Error(res.error)

    const output = res.stdout
    let hexBlock = ''

    if (type === 'private') {
      const match = output.match(/priv:([\s\S]*?)(?:pub:|ASN1|$)/)
      if (!match) throw new Error('Could not find private key in OpenSSL output')
      hexBlock = match[1]
    } else {
      const match = output.match(/pub:([\s\S]*?)(?:ASN1|$)/)
      if (!match) throw new Error('Could not find public key in OpenSSL output')
      hexBlock = match[1]
    }

    const cleanHex = hexBlock.replace(/[\s:]/g, '')
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

    if (step.id === 'keygen') {
      // 1. Generate Private Key
      const cmd = DIGITAL_ASSETS_CONSTANTS.COMMANDS.ETHEREUM.GEN_KEY(filenames.SRC_PRIVATE_KEY)
      const res1 = await openSSLService.execute(cmd)
      if (res1.error) throw new Error(res1.error)

      // Add generated file to store
      res1.files.forEach((file) => {
        addFile({
          name: file.name,
          type: 'key',
          content: file.data,
          size: file.data.length,
          timestamp: Date.now(),
        })
      })

      // 2. Extract Raw Key using OpenSSL text output
      const rawKeyBytes = await extractKeyFromText(filenames.SRC_PRIVATE_KEY, 'private', res1.files)
      const cleanPrivHex = bytesToHex(rawKeyBytes)

      // Read the key file
      const readRes = await openSSLService.execute(
        `openssl enc -base64 -in ${filenames.SRC_PRIVATE_KEY}`,
        res1.files
      )
      if (readRes.error) throw new Error(readRes.error)
      const keyContent = atob(readRes.stdout.replace(/\n/g, ''))

      setPrivateKeyHex(cleanPrivHex)
      result = `Generated Source Private Key (Hex):\n${cleanPrivHex}\n\nPEM Format:\n${keyContent}`
    } else if (step.id === 'pubkey') {
      // Changed from 'pub_key' to 'pubkey'
      if (!privateKeyHex) throw new Error('Private key not found. Please go back and generate it.')

      // 1. Derive Public Key in PEM format
      const cmd = DIGITAL_ASSETS_CONSTANTS.COMMANDS.ETHEREUM.EXTRACT_PUB(
        filenames.SRC_PRIVATE_KEY,
        filenames.SRC_PUBLIC_KEY
      )

      // Retrieve private key from store to ensure it exists in worker
      const privateKeyFile = useOpenSSLStore.getState().getFile(filenames.SRC_PRIVATE_KEY)
      const filesToPass = privateKeyFile
        ? [{ name: privateKeyFile.name, data: privateKeyFile.content as Uint8Array }]
        : []

      const res1 = await openSSLService.execute(cmd, filesToPass)
      if (res1.error) throw new Error(res1.error)

      // Add generated file to store
      res1.files.forEach((file) => {
        addFile({
          name: file.name,
          type: 'key',
          content: file.data,
          size: file.data.length,
          timestamp: Date.now(),
        })
      })

      // 2. Extract Raw Key using OpenSSL text output
      const rawKeyBytes = await extractKeyFromText(filenames.SRC_PUBLIC_KEY, 'public', res1.files)
      const cleanPubHex = bytesToHex(rawKeyBytes)

      const readRes = await openSSLService.execute(
        `openssl enc -base64 -in ${filenames.SRC_PUBLIC_KEY}`,
        res1.files
      )
      if (readRes.error) throw new Error(readRes.error)
      const pubKeyPem = atob(readRes.stdout.replace(/\n/g, ''))

      // Convert hex string to Uint8Array for state
      // Remove 0x04 prefix for raw public key usage in Ethereum
      const rawKeyBytesNoPrefix = rawKeyBytes.slice(1)

      setRawPubKey(rawKeyBytesNoPrefix)
      setPublicKeyHex(cleanPubHex.slice(2)) // Store hex without prefix for later use

      result = `Derived Source Public Key (Hex):\n${cleanPubHex}\n\nPEM Format:\n${pubKeyPem}`
    } else if (step.id === 'address') {
      if (!rawPubKey) throw new Error('Public key not found.')

      const hash = keccak_256(rawPubKey)
      const addressBytes = hash.slice(-20)
      const addr = toChecksumAddress(bytesToHex(addressBytes))

      setSourceAddress(addr)

      result = `Source Public Key (Hex, no prefix):\n${bytesToHex(rawPubKey)}\n\nKeccak-256 Hash:\n0x${bytesToHex(hash)}\n\nEthereum Address:\n${addr}`
    } else if (step.id === 'gen_recipient_key') {
      // 1. Generate Recipient Private Key
      const cmd1 = DIGITAL_ASSETS_CONSTANTS.COMMANDS.ETHEREUM.GEN_KEY(filenames.DST_PRIVATE_KEY)
      const res1 = await openSSLService.execute(cmd1)
      if (res1.error) throw new Error(res1.error)

      // 2. Derive Recipient Public Key
      const cmd2 = DIGITAL_ASSETS_CONSTANTS.COMMANDS.ETHEREUM.EXTRACT_PUB(
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
      const cleanPubHex = bytesToHex(rawKeyBytes)

      // Remove 0x04 prefix
      const rawKeyBytesNoPrefix = rawKeyBytes.slice(1)
      setRecipientPublicKeyHex(bytesToHex(rawKeyBytesNoPrefix))

      result = `Generated Recipient Keys:\n${filenames.DST_PRIVATE_KEY}\n${filenames.DST_PUBLIC_KEY}\n\nRecipient Public Key (Hex):\n${cleanPubHex}`
    } else if (step.id === 'recipient_address') {
      if (!recipientPublicKeyHex) throw new Error('Recipient public key not found')

      const rawKeyBytes = hexToBytes(recipientPublicKeyHex)
      const hash = keccak_256(rawKeyBytes)
      const addressBytes = hash.slice(-20)
      const addr = toChecksumAddress(bytesToHex(addressBytes))

      setRecipientAddress(addr)
      setEditableRecipientAddress(addr)

      result = `Recipient Ethereum Address:\n${addr}`
    } else if (step.id === 'format_tx') {
      if (!sourceAddress || !recipientAddress) throw new Error('Addresses not generated')

      const txData = {
        nonce: 0,
        gasPrice: '20000000000', // 20 Gwei
        gasLimit: 21000,
        to: editableRecipientAddress || recipientAddress,
        value: '1500000000000000000', // 1.5 ETH
        data: '0x',
        chainId: 1,
      }
      setTransactionData(txData)

      const isModified = editableRecipientAddress !== recipientAddress
      const warning = isModified
        ? '\n\n⚠️ WARNING: Recipient address has been modified! Signing this transaction may result in loss of funds.'
        : ''

      result = `Transaction Details:\n${JSON.stringify(txData, null, 2)}${warning}`
    } else if (step.id === 'visualize_msg') {
      // Visualize RLP Structure
      const rlpStructure = {
        nonce: transactionData?.nonce,
        gasPrice: transactionData?.gasPrice,
        gasLimit: transactionData?.gasLimit,
        to: transactionData?.to,
        value: transactionData?.value,
        data: transactionData?.data,
        v: transactionData?.chainId, // Simplified
        r: 0,
        s: 0,
      }

      result = `RLP Encoded Structure (to be hashed):\n${JSON.stringify(rlpStructure, null, 2)}`
    } else if (step.id === 'sign') {
      if (!privateKeyHex) throw new Error('Private key not found.')

      const txMessage = JSON.stringify(transactionData)
      const msgBytes = new TextEncoder().encode(txMessage)
      const hash = keccak_256(msgBytes)

      setTxHash(bytesToHex(hash))

      const privBytes = hexToBytes(privateKeyHex)
      // Use prehash: false because we are signing the Keccak-256 hash directly
      const sigBytes = secp256k1.sign(hash, privBytes, { prehash: false })
      const sigObj = secp256k1.Signature.fromBytes(sigBytes)

      // Find recovery id
      let recovery = 0
      for (let i = 0; i < 4; i++) {
        try {
          // Explicitly construct signature with recovery id
          const recoveredPub = new secp256k1.Signature(sigObj.r, sigObj.s, i).recoverPublicKey(hash)
          const recoveredRaw = recoveredPub.toBytes(false).slice(1)
          const recoveredHash = keccak_256(recoveredRaw)
          const recoveredAddr = toChecksumAddress(bytesToHex(recoveredHash.slice(-20)))

          if (recoveredAddr === sourceAddress) {
            recovery = i
            break
          }
        } catch {
          // ignore
        }
      }

      const fullSig = sigObj.addRecoveryBit(recovery)
      setSignature({ r: fullSig.r, s: fullSig.s, recovery: fullSig.recovery })

      result = `Transaction Data:\n${txMessage}\n\nKeccak-256 Hash:\n0x${bytesToHex(hash)}\n\nSignature:\nr: 0x${fullSig.r.toString(16).padStart(64, '0')}\ns: 0x${fullSig.s.toString(16).padStart(64, '0')}\nv: ${fullSig.recovery + 27}`
    } else if (step.id === 'verify') {
      if (!signature || !txHash || !publicKeyHex)
        throw new Error('Missing signature or transaction data.')

      try {
        const hashBytes = hexToBytes(txHash)
        const pubKeyBytes = new Uint8Array([0x04, ...hexToBytes(publicKeyHex)]) // Add back 04 prefix for verification

        // Verify using the signature object
        const sigObj = new secp256k1.Signature(signature.r, signature.s, signature.recovery)
        const isValid = secp256k1.verify(sigObj.toBytes(), hashBytes, pubKeyBytes, {
          prehash: false,
        })

        const recoveredPubKey = sigObj.recoverPublicKey(hashBytes)
        const recoveredRaw = recoveredPubKey.toBytes(false).slice(1)
        const recoveredHash = keccak_256(recoveredRaw)
        const recoveredAddr = toChecksumAddress(bytesToHex(recoveredHash.slice(-20)))

        result = `Signature Valid: ${isValid}\n\nRecovered Address: ${recoveredAddr}\nMatches Source Address: ${recoveredAddr === sourceAddress ? 'YES ✅' : 'NO ❌'}`
      } catch (e: unknown) {
        console.error('Verification failed:', e)
        const errorMessage = e instanceof Error ? e.message : String(e)
        result = `Verification Failed: ${errorMessage}\n\nCheck console for details.`
      }
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
      onNext={wizard.handleNext}
      onBack={wizard.handleBack}
      onExecute={() => wizard.execute(executeStep)}
      isExecuting={wizard.isExecuting}
      output={wizard.output}
      error={wizard.error}
      isStepComplete={wizard.isStepComplete}
    />
  )
}
