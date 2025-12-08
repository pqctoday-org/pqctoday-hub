import type { Step } from '../../components/StepWizard'
import { useKeyGeneration } from '../../hooks/useKeyGeneration'
import { SignatureError } from '../../../../../../lib/errors/CryptoError'
import { useArtifactManagement } from '../../hooks/useArtifactManagement'
import { useFileRetrieval } from '../../hooks/useFileRetrieval'
import { openSSLService } from '../../../../../../services/crypto/OpenSSLService'
/* eslint-disable security/detect-object-injection */
import { secp256k1 } from '@noble/curves/secp256k1.js'
import { keccak_256 } from '@noble/hashes/sha3.js'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'
import type { EthereumFlowState, EthereumFlowActions } from './types'
import { toChecksumAddress } from './utils'

interface UseEthereumSigningProps {
  keyGen: ReturnType<typeof useKeyGeneration>
  artifacts: ReturnType<typeof useArtifactManagement>
  fileRetrieval: ReturnType<typeof useFileRetrieval>
  actions: EthereumFlowActions
  state: EthereumFlowState
  filenames: {
    SRC_PRIVATE_KEY: string
  }
}

export function useEthereumSigning({
  keyGen,
  artifacts,
  fileRetrieval,
  actions,
  state,
  filenames,
}: UseEthereumSigningProps): { steps: Step[]; execute: (stepId: string) => Promise<string> } {
  const steps: Step[] = [
    {
      id: 'sign',
      title: '8. Sign Transaction',
      description: (
        <>
          Sign the transaction hash using OpenSSL's standard ECDSA implementation.
          <br />
          <br />
          <strong>The Challenge:</strong> Standard ECDSA signatures (like those from OpenSSL) only
          produce <strong>r</strong> and <strong>s</strong>. Ethereum requires a third parameter,{' '}
          <strong>v</strong> (recovery ID).
          <br />
          <br />
          <strong>The Solution:</strong> We compute <strong>v</strong> as a post-processing step. We
          test recovery IDs (0 and 1) to find the correct one, then encode it.
        </>
      ),
      code: `// 1. OpenSSL Command (Sign Raw Hash) -> Outputs r, s\nopenssl pkeyutl -sign -inkey ${filenames.SRC_PRIVATE_KEY} -in ethereum_hashdata_[ts].dat -out ethereum_signdata_[ts].sig -rawin\n\n// 2. Compute v (Post-processing)`,
      language: 'javascript',
      actionLabel: 'Sign Transaction',
    },
  ]

  const execute = async (stepId: string) => {
    let result = ''

    if (stepId === 'sign') {
      if (!keyGen.privateKeyHex) throw new Error('Private key not found.')
      if (!state.txHash)
        throw new SignatureError('Missing transaction hash. Please generate transaction first.')
      if (!filenames.SRC_PRIVATE_KEY) throw new SignatureError('Missing private key file.')

      // Hash should already be in state from previous step
      const hashHex = state.txHash
      const hash = hexToBytes(hashHex)

      // Re-save/ensure hash artifact exists for OpenSSL
      const hashFileName = artifacts.saveHash('ethereum', hash)

      // Name for signature file
      const sigFileName = `ethereum_signdata_${artifacts.getTimestamp()}.sig`
      artifacts.registerArtifact('sig', sigFileName)

      // 1. OpenSSL Signing (Raw Signature of Pre-Computed Hash)
      let openSSL_r: bigint = BigInt(0)
      let openSSL_s: bigint = BigInt(0)
      let openSSL_error: string | null = null
      let derHexDisplay: string = '(Generation failed)'

      try {
        // Retrieve private key from store
        const filesToPass = fileRetrieval.prepareFilesForExecution([filenames.SRC_PRIVATE_KEY])
        // Need hash file
        filesToPass.push({ name: hashFileName, data: hash })

        const signCmd = `openssl pkeyutl -sign -inkey ${filenames.SRC_PRIVATE_KEY} -in ${hashFileName} -out ${sigFileName} -rawin`

        const res = await openSSLService.execute(signCmd, filesToPass)
        if (res.error && (res.error.includes('error') || res.error.includes('failure'))) {
          throw new Error(res.error)
        }

        // Check output file
        const sigFile = res.files.find((f) => f.name === sigFileName)
        if (!sigFile || sigFile.data.length === 0) {
          throw new Error(`Generated signature file is empty. Stderr: ${res.stderr || 'None'}`)
        }

        const derSig = sigFile.data
        derHexDisplay = bytesToHex(derSig)

        // Save Signature Artifact
        artifacts.saveSignature('ethereum', derSig)

        // Parse DER to extract r, s
        let pos = 0
        if (derSig[pos] !== 0x30) throw new Error(`Invalid DER Header`)
        pos++ // 0x30

        const seqLenByte = derSig[pos]
        pos++
        if (seqLenByte & 0x80) {
          pos += seqLenByte & 0x7f
        }

        // Parse R
        if (derSig[pos] !== 0x02) throw new Error('Invalid Integer Tag for R')
        pos++
        const rLen = derSig[pos]
        pos++
        const rBytes = derSig.slice(pos, pos + rLen)
        openSSL_r = BigInt('0x' + bytesToHex(rBytes))
        pos += rLen

        // Parse S
        if (derSig[pos] !== 0x02) throw new Error('Invalid Integer Tag for S')
        pos++
        const sLen = derSig[pos]
        pos++
        const sBytes = derSig.slice(pos, pos + sLen)
        openSSL_s = BigInt('0x' + bytesToHex(sBytes))
        pos += sLen
      } catch (err: unknown) {
        openSSL_error = err instanceof Error ? err.message : 'Unknown error'
        console.error('OpenSSL Signing Failed:', err)
      }

      // 2. JS Signing (Fallback/Reference)
      const privBytes = hexToBytes(keyGen.privateKeyHex)
      const jsSig = secp256k1.sign(hash, privBytes, { prehash: false })
      const jsSigObj = secp256k1.Signature.fromBytes(jsSig)

      // Use JS values if OpenSSL failed
      const final_r = openSSL_error ? jsSigObj.r : openSSL_r
      const final_s = openSSL_error ? jsSigObj.s : openSSL_s

      // 3. Compute Recovery Parameter (v)
      let recovery = 0
      let recoveryFound = false

      let expectedAddress: string | null = state.sourceAddress // Fallback
      if (keyGen.privateKeyHex) {
        const pubKey = secp256k1.getPublicKey(hexToBytes(keyGen.privateKeyHex), false)
        const pubKeyNoPrefix = pubKey.slice(1)
        const addrHash = keccak_256(pubKeyNoPrefix)
        expectedAddress = toChecksumAddress(bytesToHex(addrHash.slice(-20)))
      }

      for (let i = 0; i < 2; i++) {
        try {
          const recoveredPub = new secp256k1.Signature(final_r, final_s, i).recoverPublicKey(hash)
          const recoveredRaw = recoveredPub.toBytes(false).slice(1)
          const recoveredHash = keccak_256(recoveredRaw)
          const recoveredAddr = toChecksumAddress(bytesToHex(recoveredHash.slice(-20)))

          if (expectedAddress && recoveredAddr.toLowerCase() === expectedAddress.toLowerCase()) {
            recovery = i
            recoveryFound = true
            break
          }
        } catch {
          // Ignore
        }
      }

      if (!recoveryFound) recovery = 0

      actions.setSignature({ r: final_r, s: final_s, recovery })

      const rHex = final_r.toString(16).padStart(64, '0')
      const sHex = final_s.toString(16).padStart(64, '0')

      result = `SUCCESS: Transaction Signed & Processed!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. PREPARE (Keccak-256 Hash)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Keccak-256 Hash to Sign:
0x${hashHex}

📂 Artifact Saved: ${hashFileName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. SIGN (OpenSSL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
result: 0x${derHexDisplay}

r: 0x${rHex}
s: 0x${sHex}
recovery_id: ${recovery}

Status: ${openSSL_error ? `FAILED: ${openSSL_error}` : 'SUCCESS ✅'}

📂 Artifact Saved: ${sigFileName}`
    }

    return result
  }

  return { steps, execute }
}
