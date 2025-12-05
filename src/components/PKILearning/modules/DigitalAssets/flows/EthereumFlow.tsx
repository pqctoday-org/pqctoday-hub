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
  const [address, setAddress] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [signature, setSignature] = useState<{ r: bigint; s: bigint; recovery: number } | null>(
    null
  )
  const [filenames, setFilenames] = useState<{ PRIVATE_KEY: string; PUBLIC_KEY: string } | null>(
    null
  )

  // Initialize filenames on mount
  React.useEffect(() => {
    if (!filenames) {
      setFilenames(DIGITAL_ASSETS_CONSTANTS.getFilenames('ethereum'))
    }
  }, [filenames])

  const steps: Step[] = [
    {
      id: 'keygen',
      title: '1. Generate Keypair',
      description:
        'Generate a secp256k1 private key using OpenSSL. This curve is used by Ethereum for its key pairs.',
      code: `// OpenSSL Command\nopenssl ecparam -name secp256k1 -genkey -noout -out ${filenames?.PRIVATE_KEY || 'eth_key.pem'}`,
      language: 'bash',
      actionLabel: 'Generate Key',
    },
    {
      id: 'pubkey',
      title: '2. Derive Public Key',
      description: 'Derive the uncompressed public key (65 bytes) from the private key.',
      code: `// OpenSSL Command\nopenssl ec -in ${filenames?.PRIVATE_KEY || 'eth_key.pem'} -pubout -out ${filenames?.PUBLIC_KEY || 'eth_pub.pem'}`,
      language: 'bash',
      actionLabel: 'Extract Public Key',
    },
    {
      id: 'address',
      title: '3. Derive Address',
      description:
        'Compute the Keccak-256 hash of the public key and take the last 20 bytes. Then apply EIP-55 checksum.',
      code: `// JavaScript Execution\nconst hash = keccak_256(rawPubKey);\nconst addressBytes = hash.slice(-20);\nconst address = toChecksumAddress(bytesToHex(addressBytes));`,
      language: 'javascript',
      actionLabel: 'Generate Address',
    },
    {
      id: 'sign',
      title: '4. Sign Transaction',
      description:
        'Create a transaction, hash it with Keccak-256, and sign with ECDSA. Note: Ethereum uses Keccak-256, NOT SHA-3.',
      code: `// JavaScript Execution\nconst txMessage = "Transfer 1.5 ETH";\nconst txHash = keccak_256(new TextEncoder().encode(txMessage));\nconst sig = secp256k1.sign(txHash, privKey, { lowS: true });`,
      language: 'javascript',
      actionLabel: 'Sign Transaction',
    },
    {
      id: 'verify',
      title: '5. Verify Signature',
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
      const cmd = DIGITAL_ASSETS_CONSTANTS.COMMANDS.ETHEREUM.GEN_KEY(filenames.PRIVATE_KEY)
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
      const rawKeyBytes = await extractKeyFromText(filenames.PRIVATE_KEY, 'private', res1.files)
      const cleanPrivHex = bytesToHex(rawKeyBytes)

      // Read the key file
      const readRes = await openSSLService.execute(
        `openssl enc -base64 -in ${filenames.PRIVATE_KEY}`,
        res1.files
      )
      if (readRes.error) throw new Error(readRes.error)
      const keyContent = atob(readRes.stdout.replace(/\n/g, ''))

      setPrivateKeyHex(cleanPrivHex)
      result = `Generated Private Key (Hex):\n${cleanPrivHex}\n\nPEM Format:\n${keyContent}`
    } else if (step.id === 'pubkey') {
      // Changed from 'pub_key' to 'pubkey'
      if (!privateKeyHex) throw new Error('Private key not found. Please go back and generate it.')

      // 1. Derive Public Key in PEM format
      const cmd = DIGITAL_ASSETS_CONSTANTS.COMMANDS.ETHEREUM.EXTRACT_PUB(
        filenames.PRIVATE_KEY,
        filenames.PUBLIC_KEY
      )

      // Retrieve private key from store to ensure it exists in worker
      const privateKeyFile = useOpenSSLStore.getState().getFile(filenames.PRIVATE_KEY)
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
      const rawKeyBytes = await extractKeyFromText(filenames.PUBLIC_KEY, 'public', res1.files)
      const cleanPubHex = bytesToHex(rawKeyBytes)

      const readRes = await openSSLService.execute(
        `openssl enc -base64 -in ${filenames.PUBLIC_KEY}`,
        res1.files
      )
      if (readRes.error) throw new Error(readRes.error)
      const pubKeyPem = atob(readRes.stdout.replace(/\n/g, ''))

      // Convert hex string to Uint8Array for state
      // Remove 0x04 prefix for raw public key usage in Ethereum
      const rawKeyBytesNoPrefix = rawKeyBytes.slice(1)

      setRawPubKey(rawKeyBytesNoPrefix)
      setPublicKeyHex(cleanPubHex.slice(2)) // Store hex without prefix for later use

      result = `Derived Public Key (Hex):\n${cleanPubHex}\n\nPEM Format:\n${pubKeyPem}`
    } else if (step.id === 'address') {
      if (!rawPubKey) throw new Error('Public key not found.')

      const hash = keccak_256(rawPubKey)
      const addressBytes = hash.slice(-20)
      const addr = toChecksumAddress(bytesToHex(addressBytes))

      setAddress(addr)

      result = `Public Key (Hex, no prefix):\n${bytesToHex(rawPubKey)}\n\nKeccak-256 Hash:\n0x${bytesToHex(hash)}\n\nEthereum Address:\n${addr}`
    } else if (step.id === 'sign') {
      if (!privateKeyHex) throw new Error('Private key not found.')

      const txMessage = 'Transfer 1.5 ETH'
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

          if (recoveredAddr === address) {
            recovery = i
            break
          }
        } catch {
          // ignore
        }
      }

      // Debug: Check if signature is valid for the known public key
      if (!publicKeyHex) throw new Error('Public key not found')
      const pubKeyBytes = new Uint8Array([0x04, ...hexToBytes(publicKeyHex)])
      const isValid = secp256k1.verify(sigBytes, hash, pubKeyBytes, { prehash: false })
      if (!isValid) {
        console.error('Signature is INVALID for the stored public key!')
      }

      const fullSig = sigObj.addRecoveryBit(recovery)
      setSignature({ r: fullSig.r, s: fullSig.s, recovery: fullSig.recovery })

      result = `Message: "${txMessage}"\n\nKeccak-256 Hash:\n0x${bytesToHex(hash)}\n\nSignature:\nr: 0x${fullSig.r.toString(16).padStart(64, '0')}\ns: 0x${fullSig.s.toString(16).padStart(64, '0')}\nv: ${fullSig.recovery + 27}`
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

        result = `Signature Valid: ${isValid}\n\nRecovered Address: ${recoveredAddr}\nMatches Original: ${recoveredAddr === address ? 'YES ✅' : 'NO ❌'}`
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
