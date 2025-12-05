import React, { useState, useEffect } from 'react'
import type { Step } from '../components/StepWizard'
import { StepWizard } from '../components/StepWizard'
import { openSSLService } from '../../../../../services/crypto/OpenSSLService'
import { useOpenSSLStore } from '../../../../OpenSSLStudio/store'
import { base58 } from '@scure/base'
import { bytesToHex } from '@noble/hashes/utils.js'
import { ed25519 } from '@noble/curves/ed25519.js'
import { useStepWizard } from '../hooks/useStepWizard'
import { DIGITAL_ASSETS_CONSTANTS } from '../constants'

interface SolanaFlowProps {
  onBack: () => void
}

export const SolanaFlow: React.FC<SolanaFlowProps> = ({ onBack }) => {
  const { addFile } = useOpenSSLStore()
  const [publicKeyBytes, setPublicKeyBytes] = useState<Uint8Array | null>(null)
  const [privateKeyBytes, setPrivateKeyBytes] = useState<Uint8Array | null>(null)
  const [filenames, setFilenames] = useState<{ PRIVATE_KEY: string; PUBLIC_KEY: string } | null>(
    null
  )

  // Initialize filenames on mount
  useEffect(() => {
    if (!filenames) {
      setFilenames(DIGITAL_ASSETS_CONSTANTS.getFilenames('solana'))
    }
  }, [filenames])

  const steps: Step[] = [
    {
      id: 'keygen',
      title: '1. Generate Keypair',
      description:
        'Generate an Ed25519 private key using OpenSSL. Solana uses Ed25519 for high-performance signatures.',
      code: `// OpenSSL Command\nopenssl genpkey -algorithm Ed25519 -out ${filenames?.PRIVATE_KEY || 'sol_key.pem'}`,
      language: 'bash',
      actionLabel: 'Generate Key',
    },
    {
      id: 'pubkey',
      title: '2. Extract Public Key',
      description: 'Extract the 32-byte public key from the private key.',
      code: `// OpenSSL Command\nopenssl pkey -in ${filenames?.PRIVATE_KEY || 'sol_key.pem'} -pubout -out ${filenames?.PUBLIC_KEY || 'sol_pub.pem'}`,
      language: 'bash',
      actionLabel: 'Extract Public Key',
    },
    {
      id: 'address',
      title: '3. Generate Solana Address',
      description: 'The Solana address is the Base58 encoding of the public key.',
      code: `// JavaScript Execution\nconst pubKeyBytes = ...; // 32 bytes\nconst address = base58.encode(pubKeyBytes);`,
      language: 'javascript',
      actionLabel: 'Generate Address',
    },
    {
      id: 'sign',
      title: '4. Sign Message',
      description: 'Sign a message "Transfer 2 SOL" using the private key (Ed25519).',
      code: `// OpenSSL Command\nopenssl pkeyutl -sign -inkey ${filenames?.PRIVATE_KEY || 'sol_key.pem'} -in sol_msg.txt -out sol_sig.bin -rawin`,
      language: 'bash',
      actionLabel: 'Sign Message',
    },
    {
      id: 'verify',
      title: '5. Verify Signature',
      description: 'Verify the signature using the public key.',
      code: `// OpenSSL Command\nopenssl pkeyutl -verify -pubin -inkey ${filenames?.PUBLIC_KEY || 'sol_pub.pem'} -in sol_msg.txt -sigfile sol_sig.bin -rawin`,
      language: 'bash',
      actionLabel: 'Verify Signature',
    },
  ]

  const wizard = useStepWizard({
    steps,
    onBack,
  })

  // Helper to extract key from OpenSSL text output with JS fallback
  const extractKeyFromText = async (
    pemFile: string,
    type: 'private' | 'public',
    files: { name: string; data: Uint8Array }[] = []
  ): Promise<Uint8Array> => {
    try {
      // Ensure the file is in the list to pass to worker
      const filesToPass = [...files]
      if (!filesToPass.find((f) => f.name === pemFile)) {
        const storedFile = useOpenSSLStore.getState().getFile(pemFile)
        if (storedFile) {
          filesToPass.push({ name: storedFile.name, data: storedFile.content as Uint8Array })
        }
      }

      // Try OpenSSL first
      const pubIn = type === 'public' ? '-pubin' : ''
      const cmd = `openssl pkey -in ${pemFile} ${pubIn} -text -noout`
      const res = await openSSLService.execute(cmd, filesToPass)

      // If OpenSSL fails (e.g. Ed25519 not supported in older versions), throw to trigger fallback
      if (res.error || res.stderr.includes('Algorithm Ed25519 not found')) {
        throw new Error('OpenSSL Ed25519 text parsing failed')
      }

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
    } catch (err) {
      console.warn('OpenSSL extraction failed, falling back to JS:', err)

      // Fallback: Read the PEM file and parse it manually or use JS lib
      // Since we generated it with OpenSSL (or tried to), if OpenSSL failed to generate, we might need to generate with JS too.
      // But here we assume generation worked (or we wouldn't have a file).
      // If generation failed, we should have caught it earlier.
      // However, if local OpenSSL doesn't support Ed25519, generation likely failed too.
      // So we need to handle generation fallback in the main flow, not just extraction.
      // But for this helper, let's assume we have a valid key file (maybe generated by JS fallback).

      // Actually, if OpenSSL doesn't support it, we should use JS for EVERYTHING (Gen + Extract).
      // So this helper might just read the file if we wrote it with JS.
      // Let's assume the file exists.

      // For now, let's just return null or throw, and handle the whole flow in executeStep.
      throw err
    }
  }

  const executeStep = async () => {
    if (!filenames) throw new Error('Filenames not initialized')
    const step = steps[wizard.currentStep]
    let result = ''

    if (step.id === 'keygen') {
      let privHex = ''
      let openSSLOutput = ''
      let generatedPrivateKeyBytes: Uint8Array | null = null

      try {
        // 1. Try OpenSSL Generation
        const cmd = DIGITAL_ASSETS_CONSTANTS.COMMANDS.SOLANA.GEN_KEY(filenames.PRIVATE_KEY)
        const res1 = await openSSLService.execute(cmd)

        if (res1.error || res1.stderr.includes('Algorithm Ed25519 not found')) {
          throw new Error('OpenSSL Ed25519 not supported')
        }

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
        generatedPrivateKeyBytes = await extractKeyFromText(
          filenames.PRIVATE_KEY,
          'private',
          res1.files
        )
        privHex = bytesToHex(generatedPrivateKeyBytes)

        const res2 = await openSSLService.execute(
          `openssl pkey -in ${filenames.PRIVATE_KEY} -text -noout`,
          res1.files
        )
        openSSLOutput = res2.stdout
      } catch (err) {
        // Fallback to JS Generation
        console.log('Falling back to JS for Ed25519 key generation:', err)
        const privKey = ed25519.utils.randomSecretKey()
        generatedPrivateKeyBytes = privKey
        privHex = bytesToHex(privKey)

        // We can't easily write a PEM file compatible with OpenSSL if OpenSSL doesn't support it.
        // But we can simulate the output.
        openSSLOutput = `(Generated via JS Fallback)\nPrivate-Key: (256 bit)\npriv:\n    ${privHex.match(/.{1,2}/g)?.join(':')}`
      }

      if (generatedPrivateKeyBytes) {
        setPrivateKeyBytes(generatedPrivateKeyBytes)
      }
      result = `Generated Ed25519 Keypair:\n\nPrivate Key (Hex):\n${privHex}\n\nOpenSSL Output:\n${openSSLOutput}`
    } else if (step.id === 'pubkey') {
      let pubHex = ''
      let openSSLOutput = ''
      let extractedPublicKeyBytes: Uint8Array | null = null

      try {
        // 1. Try OpenSSL Extraction
        const cmd = DIGITAL_ASSETS_CONSTANTS.COMMANDS.SOLANA.EXTRACT_PUB(
          filenames.PRIVATE_KEY,
          filenames.PUBLIC_KEY
        )

        // Retrieve private key from store to ensure it exists in worker
        const privateKeyFile = useOpenSSLStore.getState().getFile(filenames.PRIVATE_KEY)
        const filesToPass = privateKeyFile
          ? [{ name: privateKeyFile.name, data: privateKeyFile.content as Uint8Array }]
          : []

        const res1 = await openSSLService.execute(cmd, filesToPass)

        if (res1.error || res1.stderr.includes('Algorithm Ed25519 not found')) {
          throw new Error('OpenSSL Pubkey Extraction failed or Ed25519 not supported')
        }

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
        extractedPublicKeyBytes = await extractKeyFromText(
          filenames.PUBLIC_KEY,
          'public',
          res1.files
        )
        pubHex = bytesToHex(extractedPublicKeyBytes)

        const res2 = await openSSLService.execute(
          `openssl pkey -in ${filenames.PRIVATE_KEY} -pubout -text`,
          res1.files
        )
        openSSLOutput = res2.stdout
      } catch (err) {
        // Fallback to JS Extraction
        console.log('Falling back to JS for Ed25519 public key extraction:', err)
        if (!privateKeyBytes) {
          throw new Error(
            'Private key not available for JS public key derivation. Please generate key first.'
          )
        }
        extractedPublicKeyBytes = ed25519.getPublicKey(privateKeyBytes)
        pubHex = bytesToHex(extractedPublicKeyBytes)
        openSSLOutput = `(Generated via JS Fallback)\nPublic-Key: (256 bit)\n${pubHex.match(/.{1,2}/g)?.join(':')}`
      }

      if (extractedPublicKeyBytes) {
        setPublicKeyBytes(extractedPublicKeyBytes)
      }
      result = `Public Key (Hex):\n${pubHex}\n\nOpenSSL Output:\n${openSSLOutput}`
    } else if (step.id === 'address') {
      if (!publicKeyBytes)
        throw new Error('Public key not found. Please go back and regenerate the key.')

      const addr = base58.encode(publicKeyBytes)
      result = `Solana Address (Base58):\n${addr}`
    } else if (step.id === 'sign') {
      const msg = 'Transfer 2 SOL'
      const msgData = new TextEncoder().encode(msg)
      const messageFileName = `sol_msg.txt`
      const signatureName = `sol_sig.bin`

      const res = await openSSLService.execute(
        `openssl pkeyutl -sign -inkey ${filenames.PRIVATE_KEY} -in ${messageFileName} -out ${signatureName} -rawin`,
        [{ name: messageFileName, data: msgData }]
      )
      if (res.error) throw new Error(res.error)

      // Read signature
      const res2 = await openSSLService.execute(
        `openssl enc -base64 -in ${signatureName}`,
        res.files
      )
      const sigHex = Array.from(
        Uint8Array.from(atob(res2.stdout.replace(/\n/g, '')), (c) => c.charCodeAt(0))
      )
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')

      // Convert signature to Base58 (standard for Solana)
      const sigBytes = Uint8Array.from(atob(res2.stdout.replace(/\n/g, '')), (c) => c.charCodeAt(0))
      const sigBase58 = base58.encode(sigBytes)

      result = `Message: "${msg}"\n\nRaw Message Bytes:\n${bytesToHex(msgData)}\n\nSignature (Base58 - Solana Standard):\n${sigBase58}\n\nSignature (Hex):\n${sigHex}`
    } else if (step.id === 'verify') {
      const msg = 'Transfer 2 SOL'
      const msgData = new TextEncoder().encode(msg)
      const messageFileName = `sol_msg.txt`
      const signatureName = `sol_sig.bin`

      // Ensure message file exists for verification
      await openSSLService.execute(`echo "${msg}" > ${messageFileName}`, [
        { name: messageFileName, data: msgData },
      ])

      const res = await openSSLService.execute(
        `openssl pkeyutl -verify -pubin -inkey ${filenames.PUBLIC_KEY} -in ${messageFileName} -sigfile ${signatureName} -rawin`
      )
      if (res.error) throw new Error(res.error)

      result = `Verifying message "${msg}" against signature...\n\nResult: ${res.stdout || 'Signature Verified Successfully'}`
    }

    return result
  }

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
