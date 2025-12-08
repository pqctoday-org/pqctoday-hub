import type { Step } from '../../components/StepWizard'
import { EthereumFlowDiagram } from '../../components/CryptoFlowDiagram'
import { InfoTooltip } from '../../components/InfoTooltip'
import { useKeyGeneration } from '../../hooks/useKeyGeneration'
import { useFileRetrieval } from '../../hooks/useFileRetrieval'
import { openSSLService } from '../../../../../../services/crypto/OpenSSLService'
import { keccak_256 } from '@noble/hashes/sha3.js'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'
import type { EthereumFlowActions } from './types'
import { toChecksumAddress } from './utils'

interface UseEthereumKeyGenerationProps {
  keyGen: ReturnType<typeof useKeyGeneration>
  recipientKeyGen: ReturnType<typeof useKeyGeneration>
  fileRetrieval: ReturnType<typeof useFileRetrieval>
  actions: EthereumFlowActions
  filenames: {
    SRC_PRIVATE_KEY: string
    SRC_PUBLIC_KEY: string
    DST_PRIVATE_KEY: string
    DST_PUBLIC_KEY: string
  }
}

export function useEthereumKeyGeneration({
  keyGen,
  recipientKeyGen,
  fileRetrieval,
  actions,
  filenames,
}: UseEthereumKeyGenerationProps): { steps: Step[]; execute: (stepId: string) => Promise<string> } {
  const steps: Step[] = [
    {
      id: 'keygen',
      title: '1. Generate Source Keypair (v2-Fixed)',
      description: (
        <>
          Generate a secp256k1
          <InfoTooltip term="secp256k1" /> private key for the sender using OpenSSL.Ethereum uses
          the same elliptic curve as Bitcoin for ECDSA <InfoTooltip term="ecdsa" /> signatures.
          <br /> <br />
          <strong> Why secp256k1 ? </strong> This curve offers a good balance of security (128-bit)
          and performance. It's battle-tested across Bitcoin and Ethereum ecosystems.
        </>
      ),
      code: `// OpenSSL Command\nopenssl ecparam -name secp256k1 -genkey -noout -out ${filenames.SRC_PRIVATE_KEY}`,
      language: 'bash',
      actionLabel: 'Generate Source Key',
      diagram: <EthereumFlowDiagram />,
    },
    {
      id: 'pubkey',
      title: '2. Derive Source Public Key',
      description: (
        <>
          Derive the uncompressed public key(65 bytes) from the private key using elliptic curve
          point multiplication.This is a <strong>one - way trapdoor function</strong> - you cannot
          reverse it to get the private key.
          <br /> <br />
          <strong> ECDSA Public Key: </strong> The public key is a point (x, y) on the secp256k1
          curve. Uncompressed format: 0x04 || x || y (65 bytes total).
        </>
      ),
      code: `// OpenSSL Command\nopenssl ec -in ${filenames.SRC_PRIVATE_KEY} -pubout -out ${filenames.SRC_PUBLIC_KEY}`,
      language: 'bash',
      actionLabel: 'Extract Public Key',
    },
    {
      id: 'address',
      title: '3. Derive Source Address',
      description: (
        <>
          Compute the Keccak - 256 <InfoTooltip term="keccak256" /> hash of the public key(excluding
          the 0x04 prefix) and take the last 20 bytes.Then apply EIP - 55{' '}
          <InfoTooltip term="eip55" /> checksum for error detection.
          <br /> <br />
          <strong> Why Keccak - 256 ? </strong> Ethereum uses the original Keccak submission, NOT
          the final NIST SHA3-256 standard. They differ in padding.
          <br /> <br />
          <strong> Address Format: </strong> 0x + 40 hex characters (20 bytes) with mixed case for
          checksum.
        </>
      ),
      code: `// JavaScript Execution\nconst hash = keccak_256(rawPubKey);\nconst addressBytes = hash.slice(-20);\nconst address = toChecksumAddress(bytesToHex(addressBytes));`,
      language: 'javascript',
      actionLabel: 'Generate Source Address',
    },
    {
      id: 'gen_recipient_key',
      title: '4. Generate Recipient Keypair',
      description: (
        <>
          Generate a secp256k1 <InfoTooltip term="secp256k1" /> keypair for the recipient.This
          follows the same process as step 1.
          <br /> <br />
          <strong> Key Security: </strong> In production, the recipient generates their own keys and
          only shares the address. Never share private keys!
        </>
      ),
      code: `// OpenSSL Command\nopenssl ecparam -name secp256k1 -genkey -noout -out ${filenames.DST_PRIVATE_KEY}\n\n// Extract Public Key\nopenssl ec -in ${filenames.DST_PRIVATE_KEY} -pubout -out ${filenames.DST_PUBLIC_KEY}`,
      language: 'bash',
      actionLabel: 'Generate Recipient Key',
    },
    {
      id: 'recipient_address',
      title: '5. Derive Recipient Address',
      description: (
        <>
          Derive the recipient's address using Keccak-256 <InfoTooltip term="keccak256" /> and
          EIP-55 <InfoTooltip term="eip55" /> checksum, same as step 3.
          <br /> <br />
          <strong> Address Verification: </strong> Always verify the recipient address before
          sending funds. Ethereum addresses are case-sensitive (due to EIP-55) and exactly 42
          characters (0x + 40 hex).
        </>
      ),
      code: `// JavaScript Execution\nconst recipientAddress = deriveAddress(recipientPubKey);`,
      language: 'javascript',
      actionLabel: 'Derive Recipient Address',
    },
  ]

  const execute = async (stepId: string) => {
    let result = ''

    if (stepId === 'keygen') {
      const { keyPair } = await keyGen.generateKeyPair(
        filenames.SRC_PRIVATE_KEY,
        filenames.SRC_PUBLIC_KEY
      )

      // Read the key file
      const files = fileRetrieval.prepareFilesForExecution([filenames.SRC_PRIVATE_KEY])
      const readRes = await openSSLService.execute(
        `openssl enc -base64 -in ${filenames.SRC_PRIVATE_KEY}`,
        files
      )
      const keyContent = atob(readRes.stdout.replace(/\\n/g, ''))

      result = `SUCCESS: Key Generated!
      
Command: openssl ecparam -name secp256k1 -genkey -noout -out ${filenames.SRC_PRIVATE_KEY}

Generated File: ${filenames.SRC_PRIVATE_KEY}

[VERIFICATION TAG]
Hex Start: ${keyPair.privateKeyHex.slice(0, 64)}...
(Compare this with Step 8 verification)

Generated Source Private Key (Hex): ${keyPair.privateKeyHex}

PEM Format:
${keyContent}`
    } else if (stepId === 'pubkey') {
      if (!keyGen.privateKeyHex)
        throw new Error('Private key not found. Please go back and generate it.')
      if (!keyGen.publicKeyHex) throw new Error('Public key not found in state.')

      const files = fileRetrieval.prepareFilesForExecution([filenames.SRC_PUBLIC_KEY])
      const readRes = await openSSLService.execute(
        `openssl enc -base64 -in ${filenames.SRC_PUBLIC_KEY}`,
        files
      )
      const pubKeyPem = atob(readRes.stdout.replace(/\\n/g, ''))

      // Remove 0x04 prefix for raw public key usage in Ethereum
      if (keyGen.publicKey) {
        actions.setRawPubKey(keyGen.publicKey.slice(1))
      }

      result = `Derived Source Public Key (Hex): ${keyGen.publicKeyHex}\n\nPEM Format:\n${pubKeyPem}`
    } else if (stepId === 'address') {
      if (!keyGen.publicKey) throw new Error('Public key not found.')

      const raw = keyGen.publicKey.slice(1) // 64 bytes
      const hash = keccak_256(raw)
      const addressBytes = hash.slice(-20)
      const addr = toChecksumAddress(bytesToHex(addressBytes))

      actions.setSourceAddress(addr)

      result = `Source Public Key (Hex, no prefix): ${bytesToHex(raw)}\n\nKeccak-256 Hash: 0x${bytesToHex(hash)}\n\nEthereum Address: ${addr}`
    } else if (stepId === 'gen_recipient_key') {
      const { keyPair } = await recipientKeyGen.generateKeyPair(
        filenames.DST_PRIVATE_KEY,
        filenames.DST_PUBLIC_KEY
      )

      if (recipientKeyGen.publicKey) {
        actions.setRecipientPublicKeyHex(keyPair.publicKeyHex)
      }

      result = `Generated Recipient Keys:\n${filenames.DST_PRIVATE_KEY}\n${filenames.DST_PUBLIC_KEY}\n\nRecipient Public Key (Hex): ${keyPair.publicKeyHex}`
    } else if (stepId === 'recipient_address') {
      if (!recipientKeyGen.publicKeyHex) throw new Error('Recipient public key not found')

      const rawKeyBytes = hexToBytes(recipientKeyGen.publicKeyHex)
      const keyBytesToHash = rawKeyBytes[0] === 0x04 ? rawKeyBytes.slice(1) : rawKeyBytes
      const hash = keccak_256(keyBytesToHash)
      const addressBytes = hash.slice(-20)
      const addr = toChecksumAddress(bytesToHex(addressBytes))

      actions.setRecipientAddress(addr)
      actions.setEditableRecipientAddress(addr)

      result = `Recipient Ethereum Address: ${addr}`
    }

    return result
  }

  return { steps, execute }
}
