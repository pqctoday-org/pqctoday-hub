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
import { extractKeyFromOpenSSLOutput } from '../../../../../utils/cryptoUtils'
import { SolanaFlowDiagram } from '../components/CryptoFlowDiagram'
import { InfoTooltip } from '../components/InfoTooltip'

interface SolanaFlowProps {
  onBack: () => void
}

export const SolanaFlow: React.FC<SolanaFlowProps> = ({ onBack }) => {
  const { addFile } = useOpenSSLStore()
  const [publicKeyBytes, setPublicKeyBytes] = useState<Uint8Array | null>(null)
  const [privateKeyBytes, setPrivateKeyBytes] = useState<Uint8Array | null>(null)
  const [filenames, setFilenames] = useState<{
    SRC_PRIVATE_KEY: string
    SRC_PUBLIC_KEY: string
    DST_PRIVATE_KEY: string
    DST_PUBLIC_KEY: string
  } | null>(null)
  const [recipientPublicKeyBytes, setRecipientPublicKeyBytes] = useState<Uint8Array | null>(null)
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

  // Artifact filenames state
  const [artifactFilenames, setArtifactFilenames] = useState<{
    trans: string
    sig: string
  }>({ trans: '', sig: '' })

  const getTimestamp = () => new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)

  // Initialize filenames on mount
  useEffect(() => {
    if (!filenames) {
      const src = DIGITAL_ASSETS_CONSTANTS.getFilenames('SRC_solana')
      const dst = DIGITAL_ASSETS_CONSTANTS.getFilenames('DST_solana')
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
      description: (
        <>
          Generate an Ed25519 <InfoTooltip term="ed25519" /> private key for the sender using OpenSSL. Solana uses Ed25519 for high-performance, deterministic signatures with strong security guarantees.
          <br /><br />
          <strong>Why Ed25519?</strong> Unlike Bitcoin's secp256k1 (ECDSA), Ed25519 uses EdDSA <InfoTooltip term="eddsa" /> which is faster, more secure against side-channel attacks, and produces deterministic signatures (no random k value needed).
        </>
      ),
      code: `// OpenSSL Command\nopenssl genpkey -algorithm Ed25519 -out ${filenames?.SRC_PRIVATE_KEY || 'src_key.pem'}`,
      language: 'bash',
      actionLabel: 'Generate Source Key',
      diagram: <SolanaFlowDiagram />,
    },
    {
      id: 'pubkey',
      title: '2. Extract Source Public Key',
      description: (
        <>
          Derive the public key from the private key using Ed25519 scalar multiplication on the Edwards curve. This is a <strong>one-way function</strong> - you cannot derive the private key from the public key.
          <br /><br />
          <strong>Ed25519 Public Key Derivation:</strong> Unlike ECDSA which uses point multiplication on a Weierstrass curve, Ed25519 uses the twisted Edwards curve for faster computation. The public key is exactly 32 bytes (256 bits).
        </>
      ),
      code: `// OpenSSL Command\nopenssl pkey -in ${filenames?.SRC_PRIVATE_KEY || 'src_key.pem'} -pubout -out ${filenames?.SRC_PUBLIC_KEY || 'src_pub.pem'}`,
      language: 'bash',
      actionLabel: 'Extract Public Key',
    },
    {
      id: 'address',
      title: '3. Generate Source Address',
      description: (
        <>
          The Solana address is simply the Base58 <InfoTooltip term="base58" /> encoding of the 32-byte public key. Unlike Bitcoin (which hashes the public key) or Ethereum (which hashes and takes last 20 bytes), Solana uses the raw public key directly.
          <br /><br />
          <strong>Why Direct Encoding?</strong> Solana prioritizes performance and simplicity. The 32-byte Ed25519 public key is already compact and secure, so no additional hashing is needed.
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
          Generate an Ed25519 <InfoTooltip term="ed25519" /> keypair for the recipient to receive funds. This follows the same process as step 1.
          <br /><br />
          <strong>Key Security:</strong> In production, the recipient would generate their own keys and only share the public key/address. Never share private keys!
        </>
      ),
      code: `// OpenSSL Command\nopenssl genpkey -algorithm Ed25519 -out ${filenames?.DST_PRIVATE_KEY || 'dst_key.pem'}\n\n// Extract Public Key\nopenssl pkey -in ${filenames?.DST_PRIVATE_KEY || 'dst_key.pem'} -pubout -out ${filenames?.DST_PUBLIC_KEY || 'dst_pub.pem'}`,
      language: 'bash',
      actionLabel: 'Generate Recipient Key',
    },
    {
      id: 'recipient_address',
      title: '5. Generate Recipient Address',
      description: (
        <>
          Derive the recipient's address from their public key using Base58 <InfoTooltip term="base58" /> encoding.
          <br /><br />
          <strong>Address Verification:</strong> Always verify the recipient address before sending funds. Solana addresses are case-sensitive and exactly 32-44 characters long.
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
          Define the transaction details including <InfoTooltip term="recentBlockhash" /> recent blockhash and <InfoTooltip term="instruction" /> instructions. Verify the recipient address carefully!
          <br /><br />
          <strong>Transaction Structure:</strong> Solana transactions contain a recent blockhash (for deduplication/expiration) and one or more instructions. Each instruction specifies a program to call, accounts to use, and data to pass.
          <br /><br />
          <strong>Lamports:</strong> The amount is specified in <InfoTooltip term="lamports" /> (1 SOL = 1 billion lamports).
        </>
      ),
      code: `const transaction = {\n  recentBlockhash: "Gh9...",\n  instructions: [\n    {\n      programIdIndex: 2,\n      accounts: [0, 1],\n      data: "0200000000000000" // Transfer 2 SOL (little-endian)\n    }\n  ]\n};`,
      language: 'javascript',
      actionLabel: 'Format Transaction',
    },
    {
      id: 'visualize_msg',
      title: 'Visualize Message',
      description: 'View the Solana Message structure that will be serialized and signed.',
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
            'Array containing actual addresses. This transaction transfers SOL from source (index 0) to destination (index 1). The instruction below references these by index: accounts: [0, 1] means "transfer from address at index 0 to address at index 1". The destination address IS in this array at position 1.',
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
          description:
            'List of instructions executed atomically. programIdIndex: 2 = System Program (index 2 in account keys). accounts: [0, 1] = use accounts at index 0 (source) and index 1 (destination). data = transfer amount in lamports.',
        },
      ],
    },
    {
      id: 'sign',
      title: '8. Sign Message',
      description: (
        <>
          Sign the serialized message using the private key with Ed25519 <InfoTooltip term="eddsa" /> signature algorithm.
          <br /><br />
          <strong>Ed25519 Signing Process:</strong>
          <br />1. Hash the message using SHA-512
          <br />2. Generate deterministic signature (R || S format, 64 bytes total)
          <br />3. No random k value needed - signatures are deterministic!
          <br /><br />
          <strong>Advantages over ECDSA:</strong> Ed25519 signatures are faster to generate, smaller (64 bytes vs 71-73 bytes DER), and immune to k-value attacks.
        </>
      ),
      code: `// OpenSSL Command\nopenssl pkeyutl -sign -inkey ${filenames?.SRC_PRIVATE_KEY || 'src_key.pem'} -in sol_msg.bin -out sol_sig.bin -rawin`,
      language: 'bash',
      actionLabel: 'Sign Message',
    },
    {
      id: 'verify',
      title: '9. Verify Signature',
      description: (
        <>
          Verify the Ed25519 signature using the public key. This ensures the message was signed by the holder of the corresponding private key.
          <br /><br />
          <strong>Ed25519 Verification Process:</strong>
          <br />1. Extract R and S from the 64-byte signature
          <br />2. Recompute R' using the public key and message
          <br />3. Verify that R == R'
          <br /><br />
          <strong>Security:</strong> Ed25519 verification is faster than ECDSA and provides strong protection against signature malleability attacks.
        </>
      ),
      code: `// OpenSSL Command\nopenssl pkeyutl -verify -pubin -inkey ${filenames?.SRC_PUBLIC_KEY || 'src_pub.pem'} -in sol_msg.bin -sigfile sol_sig.bin -rawin`,
      language: 'bash',
      actionLabel: 'Verify Signature',
      customControls: (
        <div className="flex items-center gap-2 mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <input
            type="checkbox"
            id="simulate-error"
            checked={simulateError}
            onChange={(e) => setSimulateError(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="simulate-error" className="text-sm font-medium cursor-pointer select-none">
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
    if (!filenames) throw new Error('Filenames not initialized')
    const step = steps[wizard.currentStep]
    let result = ''

    if (step.id === 'keygen') {
      let privHex = ''
      let openSSLOutput = ''
      let generatedPrivateKeyBytes: Uint8Array | null = null

      try {
        // 1. Try OpenSSL Generation
        const cmd = DIGITAL_ASSETS_CONSTANTS.COMMANDS.SOLANA.GEN_KEY(filenames.SRC_PRIVATE_KEY)
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
        generatedPrivateKeyBytes = await extractKeyFromOpenSSLOutput(
          filenames.SRC_PRIVATE_KEY,
          'private',
          res1.files
        )
        privHex = bytesToHex(generatedPrivateKeyBytes)

        const res2 = await openSSLService.execute(
          `openssl pkey -in ${filenames.SRC_PRIVATE_KEY} -text -noout`,
          res1.files
        )
        openSSLOutput = res2.stdout
      } catch (err) {
        // Fallback to JS Generation
        console.warn('Falling back to JS for Ed25519 key generation:', err)
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
      result = `Generated Source Ed25519 Keypair:\n\nPrivate Key (Hex):\n${privHex}\n\nOpenSSL Output:\n${openSSLOutput}`
    } else if (step.id === 'pubkey') {
      let pubHex = ''
      let openSSLOutput = ''
      let extractedPublicKeyBytes: Uint8Array | null = null

      try {
        // 1. Try OpenSSL Extraction
        const cmd = DIGITAL_ASSETS_CONSTANTS.COMMANDS.SOLANA.EXTRACT_PUB(
          filenames.SRC_PRIVATE_KEY,
          filenames.SRC_PUBLIC_KEY
        )

        // Retrieve private key from store to ensure it exists in worker
        const privateKeyFile = useOpenSSLStore.getState().getFile(filenames.SRC_PRIVATE_KEY)
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
        extractedPublicKeyBytes = await extractKeyFromOpenSSLOutput(
          filenames.SRC_PUBLIC_KEY,
          'public',
          res1.files
        )
        pubHex = bytesToHex(extractedPublicKeyBytes)

        const res2 = await openSSLService.execute(
          `openssl pkey -in ${filenames.SRC_PRIVATE_KEY} -pubout -text`,
          res1.files
        )
        openSSLOutput = res2.stdout
      } catch (err) {
        // Fallback to JS Extraction
        console.warn('Falling back to JS for Ed25519 public key extraction:', err)
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
      result = `Source Public Key (Hex):\n${pubHex}\n\nOpenSSL Output:\n${openSSLOutput}`
    } else if (step.id === 'address') {
      if (!publicKeyBytes)
        throw new Error('Public key not found. Please go back and regenerate the key.')

      const addr = base58.encode(publicKeyBytes)
      setSourceAddress(addr)
      result = `Source Solana Address (Base58):\n${addr}`
    } else if (step.id === 'gen_recipient_key') {
      // Similar logic for recipient key generation
      let pubHex = ''
      let extractedPublicKeyBytes: Uint8Array | null = null

      try {
        // 1. Generate Recipient Private Key
        const cmd1 = DIGITAL_ASSETS_CONSTANTS.COMMANDS.SOLANA.GEN_KEY(filenames.DST_PRIVATE_KEY)
        const res1 = await openSSLService.execute(cmd1)

        if (res1.error || res1.stderr.includes('Algorithm Ed25519 not found')) {
          throw new Error('OpenSSL Ed25519 not supported')
        }

        // 2. Derive Recipient Public Key
        const cmd2 = DIGITAL_ASSETS_CONSTANTS.COMMANDS.SOLANA.EXTRACT_PUB(
          filenames.DST_PRIVATE_KEY,
          filenames.DST_PUBLIC_KEY
        )
        const res2 = await openSSLService.execute(cmd2, res1.files)

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

        // Extract public key bytes
        extractedPublicKeyBytes = await extractKeyFromOpenSSLOutput(
          filenames.DST_PUBLIC_KEY,
          'public',
          allFiles
        )
        pubHex = bytesToHex(extractedPublicKeyBytes)
      } catch (err) {
        // Fallback to JS Generation
        console.warn('Falling back to JS for Ed25519 recipient key generation:', err)
        const privKey = ed25519.utils.randomSecretKey()
        extractedPublicKeyBytes = ed25519.getPublicKey(privKey)
        pubHex = bytesToHex(extractedPublicKeyBytes)
      }

      if (extractedPublicKeyBytes) {
        setRecipientPublicKeyBytes(extractedPublicKeyBytes)
      }

      result = `Generated Recipient Keys:\n${filenames.DST_PRIVATE_KEY}\n${filenames.DST_PUBLIC_KEY}\n\nRecipient Public Key (Hex):\n${pubHex}`
    } else if (step.id === 'recipient_address') {
      if (!recipientPublicKeyBytes) throw new Error('Recipient public key not found')

      const addr = base58.encode(recipientPublicKeyBytes)
      setRecipientAddress(addr)
      setEditableRecipientAddress(addr)

      result = `Recipient Solana Address (Base58):\n${addr}`
    } else if (step.id === 'format_tx') {
      if (!sourceAddress || !recipientAddress) throw new Error('Addresses not generated')

      const txData = {
        recentBlockhash: 'Gh9ZwEmd68M8r5BqQqEweramqJ9V1k15KqSu6Jbcz9GM', // Dummy blockhash
        instructions: [
          {
            programIdIndex: 2, // System Program
            accounts: [0, 1], // Source, Destination
            data: '0200000000000000', // Transfer 2 SOL (little-endian 64-bit integer)
          },
        ],
      }
      setTransactionData(txData)

      const isModified = editableRecipientAddress !== recipientAddress
      const warning = isModified
        ? '\n\n⚠️ WARNING: Recipient address has been modified! Signing this transaction may result in loss of funds.'
        : ''

      result = `Transaction Details:\n${JSON.stringify(txData, null, 2)}${warning}`
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
      const timestamp = getTimestamp()
      const transFilename = `solana_transdata_${timestamp}.dat`
      setArtifactFilenames(prev => ({ ...prev, trans: transFilename }))

      addFile({
        name: transFilename,
        type: 'binary',
        content: msgBytes,
        size: msgBytes.length,
        timestamp: Date.now(),
      })

      result = `Solana Message Structure (to be serialized and signed):
${JSON.stringify(message, null, 2)}

========================================
RAW MESSAGE BYTES (Hex)
========================================
This is the actual data that will be signed in step 8.

Message Length: ${msgBytes.length} bytes

Hex String:
${bytesToHex(msgBytes)}

Note: In production, Solana uses a more compact binary serialization format.
This demo uses JSON for readability.

📂 Artifact Saved: ${transFilename}`
    } else if (step.id === 'sign') {
      // Reconstruct message structure to ensure we sign what we visualized
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

      // Filenames
      const timestamp = getTimestamp()
      const inputTransFile = artifactFilenames.trans || `solana_transdata_${timestamp}.dat`
      const sigFilename = `solana_signdata_${timestamp}.sig`

      setArtifactFilenames(prev => ({ ...prev, sig: sigFilename }))

      // Ensure input file exists (it should from step 7, but for robustness we write it if needed)
      // This overwrites if it exists, which is fine since content is same
      addFile({
        name: inputTransFile,
        type: 'binary',
        content: msgBytes,
        size: msgBytes.length,
        timestamp: Date.now(),
      })

      // 2. Sign with OpenSSL (or JS fallback)
      let sigHex = ''
      let sigBase58 = ''

      const signCmd = `openssl pkeyutl -sign -inkey ${filenames.SRC_PRIVATE_KEY} -in ${inputTransFile} -out ${sigFilename} -rawin`

      try {
        const res = await openSSLService.execute(
          signCmd,
          [{ name: inputTransFile, data: msgBytes }]
        )
        if (res.error) throw new Error(res.error)

        // Read signature
        const res2 = await openSSLService.execute(
          `openssl enc -base64 -in ${sigFilename}`,
          res.files
        )

        if (res2.error) throw new Error(res2.error)
        const rawSig = res2.stdout?.trim()
        if (!rawSig) throw new Error('OpenSSL produced empty signature output')

        const sigBytes = Uint8Array.from(atob(rawSig.replace(/\n/g, '')), (c) =>
          c.charCodeAt(0)
        )
        sigHex = bytesToHex(sigBytes)
        sigBase58 = base58.encode(sigBytes)

        // Save Signature Artifact
        addFile({
          name: sigFilename,
          type: 'binary',
          content: sigBytes,
          size: sigBytes.length,
          timestamp: Date.now(),
        })

      } catch (err) {
        console.warn('Falling back to JS for Ed25519 signing:', err)
        if (!privateKeyBytes) throw new Error('Private key bytes not found for JS signing')
        const sigBytes = ed25519.sign(msgBytes, privateKeyBytes)
        sigHex = bytesToHex(sigBytes)
        sigBase58 = base58.encode(sigBytes)

        // Save JS-generated signature as artifact too
        addFile({
          name: sigFilename,
          type: 'binary',
          content: sigBytes,
          size: sigBytes.length,
          timestamp: Date.now(),
        })
      }

      result = `Ed25519 Signature Generated Successfully!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SIGNING COMMAND:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${signCmd}

Signature (Ed25519 Hex):
${sigHex}

Signature (Base58 - Solana Standard):
${sigBase58}

Files Created:
- ${inputTransFile} (${msgBytes.length} bytes)
- ${sigFilename} (64 bytes)

📂 Artifact Saved: ${sigFilename}`
    } else if (step.id === 'verify') {
      // Use filenames from previous steps if available
      const transFilename = artifactFilenames.trans || `solana_transdata_${getTimestamp()}.dat`
      const sigFilename = artifactFilenames.sig || `solana_signdata_${getTimestamp()}.sig`

      // For verify, we rely on the files created in previous steps.
      // If they don't exist (user jumped here?), we can't easily recreate 'exact' timestamped ones without state.
      // But let's assume valid flow.

      const transFile = useOpenSSLStore.getState().getFile(transFilename)
      const sigFile = useOpenSSLStore.getState().getFile(sigFilename)

      if (!transFile) {
        throw new Error(`Transaction artifact not found: ${transFilename}. Please execute step 7 & 8 first.`)
      }
      if (!sigFile) {
        throw new Error(`Signature artifact not found: ${sigFilename}. Please execute step 8 first.`)
      }

      let verifyResult = ''
      let corruptMsg = ''

      if (simulateError) {
        corruptMsg = '\n\n[TEST MODE] Simulating invalid signature by modifying last byte...'

        // Corrupt in memory
        const corruptedSig = new Uint8Array(sigFile.content as Uint8Array)
        corruptedSig[corruptedSig.length - 1] ^= 0xFF

        // Write corrupted signature to a TEMP file, don't overwrite the good artifact
        const tempSigName = 'sol_corrupt.sig'
        await openSSLService.execute(`echo "corrupt" > ${tempSigName}`, [
          { name: tempSigName, data: corruptedSig }
        ])

        // Use temp corrupt file for verification
        try {
          const res = await openSSLService.execute(
            `openssl pkeyutl -verify -pubin -inkey ${filenames.SRC_PUBLIC_KEY} -in ${transFilename} -sigfile ${tempSigName} -rawin`,
            [
              { name: transFilename, data: transFile.content as Uint8Array },
              { name: tempSigName, data: corruptedSig },
              { name: filenames.SRC_PUBLIC_KEY, data: useOpenSSLStore.getState().getFile(filenames.SRC_PUBLIC_KEY)?.content as Uint8Array || new Uint8Array() }
            ]
          )
          if (!res.error) verifyResult = '⚠️ Verification SUCCEEDED unexpectedly during simulation!'
        } catch (err) {
          verifyResult = '✅ Verification FAILED as expected (Proof of Validation)\nError: Signature Verification Failure'
        }
      } else {
        // Normal Verification
        try {
          const verifyCmd = `openssl pkeyutl -verify -pubin -inkey ${filenames.SRC_PUBLIC_KEY} -in ${transFilename} -sigfile ${sigFilename} -rawin`
          const res = await openSSLService.execute(
            verifyCmd,
            [
              { name: transFilename, data: transFile.content as Uint8Array },
              { name: sigFilename, data: sigFile.content as Uint8Array },
              { name: filenames.SRC_PUBLIC_KEY, data: useOpenSSLStore.getState().getFile(filenames.SRC_PUBLIC_KEY)?.content as Uint8Array || new Uint8Array() }
            ]
          )

          if (res.error) throw new Error(res.error)
          const rawOutput = res.stdout?.trim()
          verifyResult = rawOutput || 'Signature Verified Successfully'
        } catch (err) {
          console.warn('Falling back to JS for Ed25519 verification:', err)
          if (!publicKeyBytes) throw new Error('Public key bytes not found for JS verification')
          const isValid = ed25519.verify(sigFile.content as Uint8Array, transFile.content as Uint8Array, publicKeyBytes)
          if (isValid) verifyResult = 'Signature Verified Successfully (JS Fallback)'
          else throw new Error('JS Verification Failed')
        }
      }

      result = `Ed25519 Signature Verification Complete!${corruptMsg}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERIFICATION PARAMETERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Message File: ${transFilename} (${transFile.size} bytes)
Signature File: ${sigFilename} (64 bytes)
Public Key File: ${filenames.SRC_PUBLIC_KEY}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERIFICATION PROCESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Load public key from ${filenames.SRC_PUBLIC_KEY}
2. Load signature from ${sigFilename}
3. Load message from ${transFilename}
4. Verify signature using Ed25519 algorithm

Result: ${verifyResult}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ed25519 VERIFICATION DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Algorithm: EdDSA (Edwards-curve Digital Signature Algorithm)
- Curve: Curve25519 (twisted Edwards curve)
- Signature Format: R || S (32 bytes each)
- Hash Function: SHA-512 (internal to Ed25519)
- Security Level: ~128 bits`
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
