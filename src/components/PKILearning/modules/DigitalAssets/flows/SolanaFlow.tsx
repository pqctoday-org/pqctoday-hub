import React, { useState, useMemo } from 'react'
import type { Step } from '../components/StepWizard'
import { StepWizard } from '../components/StepWizard'
import { openSSLService } from '../../../../../services/crypto/OpenSSLService'
import { useOpenSSLStore } from '../../../../OpenSSLStudio/store'
import { base58 } from '@scure/base'
import { bytesToHex } from '@noble/hashes/utils.js'
import { ed25519 } from '@noble/curves/ed25519.js'
import { useStepWizard } from '../hooks/useStepWizard'
import { DIGITAL_ASSETS_CONSTANTS } from '../constants'
import { SolanaFlowDiagram } from '../components/CryptoFlowDiagram'
import { InfoTooltip } from '../components/InfoTooltip'
import { useKeyGeneration } from '../hooks/useKeyGeneration'
import { useArtifactManagement } from '../hooks/useArtifactManagement'
import { useFileRetrieval } from '../hooks/useFileRetrieval'

interface SolanaFlowProps {
  onBack: () => void
}

export const SolanaFlow: React.FC<SolanaFlowProps> = ({ onBack }) => {
  // Shared Hooks
  const keyGen = useKeyGeneration('solana')
  const recipientKeyGen = useKeyGeneration('solana')
  const artifacts = useArtifactManagement()
  const fileRetrieval = useFileRetrieval()
  // const { addFile } = useOpenSSLStore() // Keep for simulation logic

  // Local State
  const [sourceAddress, setSourceAddress] = useState<string | null>(null)
  const [recipientAddress, setRecipientAddress] = useState<string | null>(null)

  const [transactionData, setTransactionData] = useState<{
    recentBlockhash: string
    instructions: {
      programIdIndex: number
      accounts: number[]
      data: string
    }[]
  } | null>(null)
  const [editableRecipientAddress, setEditableRecipientAddress] = useState<string>('')
  const [simulateError, setSimulateError] = useState(false)

  // Filenames (Memoized constants)
  const filenames = useMemo(() => {
    const src = DIGITAL_ASSETS_CONSTANTS.getFilenames('SRC_solana')
    const dst = DIGITAL_ASSETS_CONSTANTS.getFilenames('DST_solana')
    return {
      SRC_PRIVATE_KEY: src.PRIVATE_KEY,
      SRC_PUBLIC_KEY: src.PUBLIC_KEY,
      DST_PRIVATE_KEY: dst.PRIVATE_KEY,
      DST_PUBLIC_KEY: dst.PUBLIC_KEY,
    }
  }, [])

  const steps: Step[] = [
    {
      id: 'keygen',
      title: '1. Generate Source Keypair',
      description: (
        <>
          Generate an Ed25519 <InfoTooltip term="ed25519" /> private key for the sender using
          OpenSSL. Solana uses Ed25519 for high-performance, deterministic signatures with strong
          security guarantees.
          <br />
          <br />
          <strong>Why Ed25519?</strong> Unlike Bitcoin's secp256k1 (ECDSA), Ed25519 uses EdDSA{' '}
          <InfoTooltip term="eddsa" /> which is faster, more secure against side-channel attacks,
          and produces deterministic signatures (no random k value needed).
        </>
      ),
      code: `// OpenSSL Command\n${DIGITAL_ASSETS_CONSTANTS.COMMANDS.SOLANA.GEN_KEY(filenames.SRC_PRIVATE_KEY)}`,
      language: 'bash',
      actionLabel: 'Generate Source Key',
      diagram: <SolanaFlowDiagram />,
    },
    {
      id: 'pubkey',
      title: '2. Extract Source Public Key',
      description: (
        <>
          Derive the public key from the private key using Ed25519 scalar multiplication on the
          Edwards curve. This is a <strong>one-way function</strong> - you cannot derive the private
          key from the public key.
          <br />
          <br />
          <strong>Ed25519 Public Key Derivation:</strong> Unlike ECDSA which uses point
          multiplication on a Weierstrass curve, Ed25519 uses the twisted Edwards curve for faster
          computation. The public key is exactly 32 bytes (256 bits).
        </>
      ),
      code: `// OpenSSL Command\n${DIGITAL_ASSETS_CONSTANTS.COMMANDS.SOLANA.EXTRACT_PUB(filenames.SRC_PRIVATE_KEY, filenames.SRC_PUBLIC_KEY)}`,
      language: 'bash',
      actionLabel: 'Extract Public Key',
    },
    {
      id: 'address',
      title: '3. Generate Source Address',
      description: (
        <>
          The Solana address is simply the Base58 <InfoTooltip term="base58" /> encoding of the
          32-byte public key. Unlike Bitcoin (which hashes the public key) or Ethereum (which hashes
          and takes last 20 bytes), Solana uses the raw public key directly.
          <br />
          <br />
          <strong>Why Direct Encoding?</strong> Solana prioritizes performance and simplicity. The
          32-byte Ed25519 public key is already compact and secure, so no additional hashing is
          needed.
        </>
      ),
      code: `// JavaScript Execution\nconst pubKeyBytes = ...; // 32 bytes\nconst address = base58.encode(pubKeyBytes);`,
      language: 'javascript',
      actionLabel: 'Generate Source Address',
    },
    {
      id: 'gen_recipient_key',
      title: '4. Generate Recipient Keypair',
      description: (
        <>
          Generate an Ed25519 <InfoTooltip term="ed25519" /> keypair for the recipient to receive
          funds. This follows the same process as step 1.
          <br />
          <br />
          <strong>Key Security:</strong> In production, the recipient would generate their own keys
          and only share the public key/address. Never share private keys!
        </>
      ),
      code: `// OpenSSL Command\n${DIGITAL_ASSETS_CONSTANTS.COMMANDS.SOLANA.GEN_KEY(filenames.DST_PRIVATE_KEY)}\n\n// Extract Public Key\n${DIGITAL_ASSETS_CONSTANTS.COMMANDS.SOLANA.EXTRACT_PUB(filenames.DST_PRIVATE_KEY, filenames.DST_PUBLIC_KEY)}`,
      language: 'bash',
      actionLabel: 'Generate Recipient Key',
    },
    {
      id: 'recipient_address',
      title: '5. Generate Recipient Address',
      description: (
        <>
          Derive the recipient's address from their public key using Base58{' '}
          <InfoTooltip term="base58" /> encoding.
          <br />
          <br />
          <strong>Address Verification:</strong> Always verify the recipient address before sending
          funds. Solana addresses are case-sensitive and exactly 32-44 characters long.
        </>
      ),
      code: `// JavaScript Execution\nconst recipientAddress = base58.encode(recipientPubKeyBytes);`,
      language: 'javascript',
      actionLabel: 'Generate Recipient Address',
    },
    {
      id: 'format_tx',
      title: '6. Format Transaction',
      description: (
        <>
          Define the transaction details including <InfoTooltip term="recentBlockhash" /> recent
          blockhash and <InfoTooltip term="instruction" /> instructions. Verify the recipient
          address carefully!
          <br />
          <br />
          <strong>Transaction Structure:</strong> Solana transactions contain a recent blockhash
          (for deduplication/expiration) and one or more instructions. Each instruction specifies a
          program to call, accounts to use, and data to pass.
          <br />
          <br />
          <strong>Lamports:</strong> The amount is specified in <InfoTooltip term="lamports" /> (1
          SOL = 1 billion lamports).
        </>
      ),
      code: `const transaction = {\n  recentBlockhash: "Gh9...",\n  instructions: [\n    {\n      programIdIndex: 2,\n      accounts: [0, 1],\n      data: "020000000065cd1d00000000" // Transfer instruction (type 2) + 0.5 SOL in lamports\n    }\n  ]\n};`,
      language: 'javascript',
      actionLabel: 'Format Transaction',
    },
    {
      id: 'visualize_msg',
      title: '7. Visualize Message',
      description:
        'View the Solana Message structure that will be serialized and signed. This demo uses a simplified JSON representation for readability. Production Solana transactions use a compact binary format.',
      code: '',
      language: 'javascript',
      actionLabel: 'Visualize Message',
      explanationTable: [
        {
          label: 'Header',
          value: '{ numRequiredSignatures: 1, ... }',
          description: 'Specifies which accounts must sign the transaction.',
        },
        {
          label: 'Account Keys',
          value: `1. ${sourceAddress || '...'} (Signer)\n2. ${editableRecipientAddress || recipientAddress || '...'} (Writable)\n3. 111...111 (System Program)`,
          description:
            'Array containing actual addresses. This transaction transfers SOL from source (index 0) to destination (index 1).',
        },
        {
          label: 'Recent Blockhash',
          value: transactionData?.recentBlockhash || '...',
          description:
            'A recent blockhash (max 150 blocks old) to prevent replay and ensure liveness.',
        },
        {
          label: 'Instructions',
          value: '[{ programIdIndex: 2, accounts: [0, 1], data: ... }]',
          description: 'List of instructions executed atomically.',
        },
        {
          label: 'Real Binary Format',
          value: 'Header(3B) | compact-u16 | Keys(32B each) | Blockhash(32B) | Instructions',
          description:
            'Production Solana messages use a compact binary format: 3-byte header, compact-u16 encoded counts, 32-byte account keys, 32-byte blockhash, and tightly packed instructions with 1-byte program index + compact-u16 account indices + compact-u16 data length + raw data bytes.',
        },
      ],
    },
    {
      id: 'sign',
      title: '8. Sign Message',
      description: (
        <>
          Sign the serialized message using the private key with Ed25519{' '}
          <InfoTooltip term="eddsa" /> signature algorithm.
          <br />
          <br />
          <strong>Ed25519 Signing Process:</strong>
          <br />
          1. Hash the message using SHA-512
          <br />
          2. Generate deterministic signature (R || S format, 64 bytes total)
        </>
      ),
      code: `// OpenSSL Command\n${DIGITAL_ASSETS_CONSTANTS.COMMANDS.SOLANA.SIGN(filenames.SRC_PRIVATE_KEY, 'sol_msg.bin', 'sol_sig.bin')}`,
      language: 'bash',
      actionLabel: 'Sign Message',
    },
    {
      id: 'verify',
      title: '9. Verify Signature',
      description: (
        <>
          Verify the Ed25519 signature using the public key. This ensures the message was signed by
          the holder of the corresponding private key.
          <br />
          <br />
          <strong>Security:</strong> Ed25519 verification is faster than ECDSA and provides strong
          protection against signature malleability attacks.
        </>
      ),
      code: `// OpenSSL Command\n${DIGITAL_ASSETS_CONSTANTS.COMMANDS.SOLANA.VERIFY(filenames.SRC_PUBLIC_KEY, 'sol_msg.bin', 'sol_sig.bin')}`,
      language: 'bash',
      actionLabel: 'Verify Signature',
      customControls: (
        <div className="flex items-center gap-2 mb-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
          <input
            type="checkbox"
            id="simulate-error"
            checked={simulateError}
            onChange={(e) => setSimulateError(e.target.checked)}
            className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
          />
          <label
            htmlFor="simulate-error"
            className="text-sm font-medium cursor-pointer select-none"
          >
            Simulate Invalid Signature (Proof of Verification)
            <span className="block text-xs text-muted-foreground font-normal mt-0.5">
              Intentionally corrupts the signature to prove that verification actually fails.
            </span>
          </label>
        </div>
      ),
    },
  ]

  const wizard = useStepWizard({
    steps,
    onBack,
  })

  const executeStep = async () => {
    const step = steps[wizard.currentStep]
    let result = ''

    if (step.id === 'keygen') {
      const { keyPair } = await keyGen.generateKeyPair(
        filenames.SRC_PRIVATE_KEY,
        filenames.SRC_PUBLIC_KEY
      )

      let openSSLOutput = ''
      if (!keyGen.usingFallback) {
        // Try to read OpenSSL info for display
        try {
          // We need to pass the private key file which should be in the store
          const files = fileRetrieval.prepareFilesForExecution([filenames.SRC_PRIVATE_KEY])
          const res = await openSSLService.execute(
            `openssl pkey -in ${filenames.SRC_PRIVATE_KEY} -text -noout`,
            files
          )
          openSSLOutput = res.stdout
        } catch {
          // ignore
        }
      } else {
        openSSLOutput = `(Generated via JS Fallback - Ed25519 not supported in OpenSSL env)\\nPrivate-Key: (256 bit)\\npriv:\\n    ${keyPair.privateKeyHex.match(/.{1,2}/g)?.join(':')}`
      }

      result = `Generated Source Ed25519 Keypair:

Private Key (Ed25519 Hex): ${keyPair.privateKeyHex}

OpenSSL Output:
${openSSLOutput}`
    } else if (step.id === 'pubkey') {
      if (!keyGen.publicKeyHex) throw new Error('Public key not found')

      let openSSLOutput = ''
      // If we used fallback, or if OpenSSL just successfully ran inside hook
      if (!keyGen.usingFallback) {
        try {
          const files = fileRetrieval.prepareFilesForExecution([filenames.SRC_PRIVATE_KEY])
          const res = await openSSLService.execute(
            `openssl pkey -in ${filenames.SRC_PRIVATE_KEY} -pubout -text`,
            files
          )
          openSSLOutput = res.stdout
        } catch {
          // ignore
        }
      } else {
        openSSLOutput = `(Generated via JS Fallback)\\nPublic-Key: (256 bit)\\n${keyGen.publicKeyHex.match(/.{1,2}/g)?.join(':')}`
      }

      result = `Source Public Key (Hex): ${keyGen.publicKeyHex}\n\nOpenSSL Output:\n${openSSLOutput}`
    } else if (step.id === 'address') {
      if (!keyGen.publicKey)
        throw new Error('Public key not found. Please go back and regenerate the key.')

      const addr = base58.encode(keyGen.publicKey)
      setSourceAddress(addr)
      result = `Source Solana Address (Base58): ${addr}`
    } else if (step.id === 'gen_recipient_key') {
      const { keyPair } = await recipientKeyGen.generateKeyPair(
        filenames.DST_PRIVATE_KEY,
        filenames.DST_PUBLIC_KEY
      )

      result = `Generated Recipient Keys:\n${filenames.DST_PRIVATE_KEY}\n${filenames.DST_PUBLIC_KEY}\n\nRecipient Public Key (Hex): ${keyPair.publicKeyHex}`
    } else if (step.id === 'recipient_address') {
      if (!recipientKeyGen.publicKey) throw new Error('Recipient public key not found')

      const addr = base58.encode(recipientKeyGen.publicKey)
      setRecipientAddress(addr)
      setEditableRecipientAddress(addr)

      result = `Recipient Solana Address (Base58): ${addr}`
    } else if (step.id === 'format_tx') {
      if (!sourceAddress || !recipientAddress) throw new Error('Addresses not generated')

      const txData = {
        recentBlockhash: 'Gh9ZwEmd68M8r5BqQqEweramqJ9V1k15KqSu6Jbcz9GM', // Demo blockhash
        instructions: [
          {
            programIdIndex: 2, // System Program
            accounts: [0, 1], // Source, Destination
            data: '020000000065cd1d00000000', // Transfer instruction (type 2) + 0.5 SOL in lamports
          },
        ],
      }
      setTransactionData(txData)

      const isModified = editableRecipientAddress !== recipientAddress
      const warning = isModified
        ? '\\n\\n⚠️ WARNING: Recipient address has been modified! Signing this transaction may result in loss of funds.'
        : ''

      result = `Transaction Details:
${JSON.stringify(txData, null, 2)}${warning}`
    } else if (step.id === 'visualize_msg') {
      // Visualize Solana Message Structure
      const message = {
        header: {
          numRequiredSignatures: 1,
          numReadonlySignedAccounts: 0,
          numReadonlyUnsignedAccounts: 1,
        },
        accountKeys: [
          sourceAddress || '...',
          editableRecipientAddress || recipientAddress || '...',
          '11111111111111111111111111111111', // System Program
        ],
        recentBlockhash: transactionData?.recentBlockhash,
        instructions: transactionData?.instructions,
      }

      const msgString = JSON.stringify(message, null, 2)
      const msgBytes = new TextEncoder().encode(msgString)

      // Save artifacts
      const transFilename = artifacts.saveTransaction('solana', msgBytes)

      result = `Solana Message Structure (to be serialized and signed):
${JSON.stringify(message, null, 2)}

========================================
RAW MESSAGE BYTES (Hex)
========================================
Message Length: ${msgBytes.length} bytes

Hex String:
${bytesToHex(msgBytes)}

📂 Artifact Saved: ${transFilename}`
    } else if (step.id === 'sign') {
      if (!keyGen.privateKey) throw new Error('Private key not found.')

      // Reconstruct message
      const message = {
        header: {
          numRequiredSignatures: 1,
          numReadonlySignedAccounts: 0,
          numReadonlyUnsignedAccounts: 1,
        },
        accountKeys: [
          sourceAddress || '...',
          editableRecipientAddress || recipientAddress || '...',
          '11111111111111111111111111111111',
        ],
        recentBlockhash: transactionData?.recentBlockhash,
        instructions: transactionData?.instructions,
      }
      const msgString = JSON.stringify(message, null, 2)
      const msgBytes = new TextEncoder().encode(msgString)

      // Ensure transaction file exists in hook state or file list
      const transFilename =
        artifacts.filenames.trans || artifacts.saveTransaction('solana', msgBytes)

      const sigFilename = `solana_signdata_${artifacts.getTimestamp()}.sig`
      // Manually set this specialized artifact name in hook
      artifacts.registerArtifact('sig', sigFilename)

      let sigHex = ''
      let sigBase58 = ''

      try {
        // Attempt OpenSSL Signing
        // File Retrieval Hook prepares known files. Artifacts might be in store but not in 'files' list yet?
        // prepareFilesForExecution checks store.
        // We need private key. keyGen usually stores it.
        const filesToPass = fileRetrieval.prepareFilesForExecution([filenames.SRC_PRIVATE_KEY])
        filesToPass.push({ name: transFilename, data: msgBytes })

        const signCmd = `openssl pkeyutl -sign -inkey ${filenames.SRC_PRIVATE_KEY} -in ${transFilename} -out ${sigFilename} -rawin`

        const res = await openSSLService.execute(signCmd, filesToPass)
        if (res.error) throw new Error(res.error)

        const sigFile = res.files.find((f) => f.name === sigFilename)
        if (!sigFile) throw new Error('Signature file not generated')

        const sigBytes = sigFile.data
        sigHex = bytesToHex(sigBytes)
        sigBase58 = base58.encode(sigBytes)

        artifacts.saveSignature('solana', sigBytes)
      } catch (err) {
        console.warn('Falling back to JS for Ed25519 signing:', err)
        // Only fallback if keyGen has private bytes
        if (!keyGen.privateKey) throw new Error('Private key bytes not found for JS signing')

        const sigBytes = ed25519.sign(msgBytes, keyGen.privateKey)
        sigHex = bytesToHex(sigBytes)
        sigBase58 = base58.encode(sigBytes)

        artifacts.saveSignature('solana', sigBytes)
      }

      result = `Ed25519 Signature Generated Successfully!

Signature (Ed25519 Hex):
${sigHex}

Signature (Base58 - Solana Standard):
${sigBase58}

📂 Artifact Saved: ${sigFilename}`
    } else if (step.id === 'verify') {
      const transFilename = artifacts.filenames.trans || 'solana_transdata.dat'
      const sigFilename = artifacts.filenames.sig || 'solana_signdata.sig'

      const transFile = useOpenSSLStore.getState().getFile(transFilename)
      const sigFile = useOpenSSLStore.getState().getFile(sigFilename)

      if (!transFile || !sigFile) throw new Error('Missing artifacts for verification')

      let verifyResult = ''
      let corruptMsg = ''

      const signatureToVerify = simulateError
        ? new Uint8Array(sigFile.content as Uint8Array).map((b, i, arr) =>
            i === arr.length - 1 ? b ^ 0xff : b
          )
        : (sigFile.content as Uint8Array)

      if (simulateError) corruptMsg = '\\n\\n[TEST MODE] Simulating invalid signature...'

      try {
        // Try OpenSSL Verify
        const filesToPass = fileRetrieval.prepareFilesForExecution([filenames.SRC_PUBLIC_KEY])
        // Manually add the sig/trans content
        filesToPass.push({ name: transFilename, data: transFile.content as Uint8Array })
        const tempSigName = simulateError ? 'corrupt.sig' : sigFilename
        filesToPass.push({ name: tempSigName, data: signatureToVerify })

        const verifyCmd = `openssl pkeyutl -verify -pubin -inkey ${filenames.SRC_PUBLIC_KEY} -in ${transFilename} -sigfile ${tempSigName} -rawin`

        const res = await openSSLService.execute(verifyCmd, filesToPass)
        if (res.error) throw new Error(res.error)

        verifyResult = res.stdout?.trim() || 'Signature Verified Successfully'
        if (simulateError)
          verifyResult = '⚠️ Verification SUCCEEDED unexpectedly during simulation!'
      } catch (err) {
        if (simulateError) {
          verifyResult =
            '✅ Verification FAILED as expected (Proof of Validation)\\nError: Signature Verification Failure'
        } else {
          // Fallback to JS
          console.warn('Falling back to JS Verify', err)
          if (!keyGen.publicKey) throw new Error('Public key not found for JS verification')
          const isValid = ed25519.verify(
            signatureToVerify,
            transFile.content as Uint8Array,
            keyGen.publicKey
          )
          if (isValid) verifyResult = 'Signature Verified Successfully (JS Fallback)'
          else throw new Error('JS Verification Failed')
        }
      }

      result = `Ed25519 Signature Verification Complete!${corruptMsg}

Result: ${verifyResult}

Files Verified:
- ${transFilename}
- ${sigFilename}
`
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
      onComplete={onBack}
    />
  )
}
