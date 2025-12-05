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

export const BitcoinFlow: React.FC = () => {
  const { addFile } = useOpenSSLStore()
  const [publicKeyBytes, setPublicKeyBytes] = React.useState<Uint8Array | null>(null)
  const [filenames, setFilenames] = React.useState<{
    PRIVATE_KEY: string
    PUBLIC_KEY: string
  } | null>(null)

  // Initialize filenames on mount
  React.useEffect(() => {
    if (!filenames) {
      setFilenames(DIGITAL_ASSETS_CONSTANTS.getFilenames('bitcoin'))
    }
  }, [])

  const steps: Step[] = [
    {
      id: 'gen_key',
      title: 'Generate Private Key',
      description: 'Generate a secp256k1 private key using OpenSSL.',
      code: `// Generate secp256k1 private key\n${DIGITAL_ASSETS_CONSTANTS.COMMANDS.BITCOIN.GEN_KEY(filenames?.PRIVATE_KEY || 'bitcoin_key.pem')}`,
      language: 'bash',
      actionLabel: 'Generate Key',
    },
    {
      id: 'pub_key',
      title: 'Derive Public Key',
      description: 'Derive the uncompressed public key from the private key.',
      code: `// Derive public key\n${DIGITAL_ASSETS_CONSTANTS.COMMANDS.BITCOIN.EXTRACT_PUB(filenames?.PRIVATE_KEY || 'bitcoin_key.pem', filenames?.PUBLIC_KEY || 'bitcoin_pub.pem')}`,
      language: 'bash',
      actionLabel: 'Derive Public Key',
    },
    {
      id: 'address',
      title: 'Create Address',
      description:
        'Hash the public key (SHA256 + RIPEMD160) and encode with Base58Check to create a P2PKH address.',
      code: `// 1. SHA256\nconst sha = sha256(pubKeyBytes);\n\n// 2. RIPEMD160\nconst ripemd = ripemd160(sha);\n\n// 3. Base58Check Encode\nconst address = base58check(ripemd);`,
      language: 'javascript',
      actionLabel: 'Create Address',
    },
    {
      id: 'sign',
      title: 'Sign Transaction',
      description: 'Sign a transaction hash (Double SHA256) using the private key (ECDSA).',
      code: `// 1. Double SHA256 of message\nconst sighash = sha256(sha256(message));\n\n// 2. Sign with OpenSSL\nopenssl pkeyutl -sign -inkey ${filenames?.PRIVATE_KEY || 'key.pem'} -in sighash.bin -out sig.der`,
      language: 'bash',
      actionLabel: 'Sign Transaction',
    },
    {
      id: 'verify',
      title: 'Verify Signature',
      description: 'Verify the transaction signature using the public key.',
      code: `// Verify with OpenSSL\nopenssl pkeyutl -verify -pubin -inkey ${filenames?.PUBLIC_KEY || 'pub.pem'} -in sighash.bin -sigfile sig.der`,
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
      const cmd = DIGITAL_ASSETS_CONSTANTS.COMMANDS.BITCOIN.GEN_KEY(filenames.PRIVATE_KEY)
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
      const rawKeyBytes = await extractKeyFromText(filenames.PRIVATE_KEY, 'private', res.files)
      const cleanPrivHex = bytesToHex(rawKeyBytes)

      // Read the key file for PEM display
      const readRes = await openSSLService.execute(
        `openssl enc -base64 -in ${filenames.PRIVATE_KEY}`,
        res.files
      )
      const keyContent = atob(readRes.stdout.replace(/\n/g, ''))

      result = `Generated Private Key (Hex):\n${cleanPrivHex}\n\nPEM Format:\n${keyContent}`
    } else if (step.id === 'pub_key') {
      // 1. Derive Public Key in PEM format
      const cmd = DIGITAL_ASSETS_CONSTANTS.COMMANDS.BITCOIN.EXTRACT_PUB(
        filenames.PRIVATE_KEY,
        filenames.PUBLIC_KEY
      )

      // Retrieve private key from store to ensure it exists in worker (robustness)
      const privateKeyFile = useOpenSSLStore.getState().getFile(filenames.PRIVATE_KEY)
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
      const rawKeyBytes = await extractKeyFromText(filenames.PUBLIC_KEY, 'public', res.files)
      const cleanPubHex = bytesToHex(rawKeyBytes)

      setPublicKeyBytes(rawKeyBytes)

      // Read PEM for display
      const readRes = await openSSLService.execute(
        `openssl enc -base64 -in ${filenames.PUBLIC_KEY}`,
        res.files
      )
      const pubKeyPem = atob(readRes.stdout.replace(/\n/g, ''))

      result = `Derived Public Key (Hex):\n${cleanPubHex}\n\nPEM Format:\n${pubKeyPem}`
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

      result = `Public Key (Hex):\n${pubKeyHex}\n\nSHA256 Hash:\n${bytesToHex(shaHash)}\n\nRIPEMD160 Hash:\n${bytesToHex(ripemdHash)}\n\nBitcoin Address (P2PKH):\n${address}`
    } else if (step.id === 'sign') {
      const msg = 'Transfer 0.5 BTC'
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
      const privateKeyFile = useOpenSSLStore.getState().getFile(filenames.PRIVATE_KEY)
      const filesToPass = privateKeyFile
        ? [sighashFile, { name: privateKeyFile.name, data: privateKeyFile.content as Uint8Array }]
        : [sighashFile]

      const cmd = DIGITAL_ASSETS_CONSTANTS.COMMANDS.BITCOIN.SIGN(
        filenames.PRIVATE_KEY,
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

      result = `Transaction: "${msg}"\n\nDouble SHA256 (Sighash):\n${bytesToHex(sighashBytes)}\n\nECDSA Signature (DER):\n${sigHex}\n\nSignature (Base64):\n${sigBase64}`
    } else if (step.id === 'verify') {
      const msg = 'Transfer 0.5 BTC'
      const msgData = new TextEncoder().encode(msg)
      const sighashFileName = `btc_sighash.bin`
      const signatureName = `btc_sig.der`

      // Re-compute sighash (or retrieve from store if we saved it, but re-computing is safer/easier here)
      const hash1Bytes = sha256(msgData)
      const sighashBytes = sha256(hash1Bytes)
      const sighashFile = { name: sighashFileName, data: sighashBytes }

      // Retrieve public key and signature (if we had saved signature to store, but we didn't explicitly save it to store in previous step, only to worker output)
      // Actually, we should probably save the signature to store in the previous step if we want it to persist.
      // For now, let's assume the user just ran the previous step and the file is in the worker's memory OR we pass it if we can get it.
      // Wait, if we didn't save btc_sig.der to the store, we can't retrieve it to pass it.
      // We should update the previous step to save the signature to the store.

      // But for now, let's assume the worker has it? No, that's risky.
      // Let's rely on the fact that we can't easily get the signature file from the previous step unless we saved it.
      // So, I will add saving to store in the 'sign' step.

      // ... (I will add the save logic in the 'sign' block above) ...

      // Retrieve signature from store
      // We need to make sure we save it in step 4.
      // Let's assume I'll add that.

      const signatureFile = useOpenSSLStore.getState().files.find((f) => f.name === signatureName)
      const publicKeyFile = useOpenSSLStore.getState().getFile(filenames.PUBLIC_KEY)

      const filesToPass = [sighashFile]
      if (signatureFile)
        filesToPass.push({ name: signatureFile.name, data: signatureFile.content as Uint8Array })
      if (publicKeyFile)
        filesToPass.push({ name: publicKeyFile.name, data: publicKeyFile.content as Uint8Array })

      const cmd = DIGITAL_ASSETS_CONSTANTS.COMMANDS.BITCOIN.VERIFY(
        filenames.PUBLIC_KEY,
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
    onBack: () => console.log('Back requested'),
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
