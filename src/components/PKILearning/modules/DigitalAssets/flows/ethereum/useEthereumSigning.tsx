// SPDX-License-Identifier: AGPL-3.0-only
import type { Step } from '../../components/StepWizard'
import { useKeyGeneration } from '../../hooks/useKeyGeneration'
import { SignatureError } from '@/lib/errors/CryptoError'
import { useArtifactManagement } from '../../hooks/useArtifactManagement'
import { useFileRetrieval } from '../../hooks/useFileRetrieval'
import { openSSLService } from '@/services/crypto/OpenSSLService'
/* eslint-disable security/detect-object-injection */
import { secp256k1 } from '@noble/curves/secp256k1.js'
import { keccak_256 } from '@noble/hashes/sha3.js'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'
import type { EthereumFlowState, EthereumFlowActions } from './types'
import { toChecksumAddress } from './utils'
import { extractKeyFromOpenSSLOutput } from '@/utils/cryptoUtils'

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
      title: '8. Sign Sample JSON Hash',
      description: (
        <>
          Attempt software OpenSSL signing of the JSON sample digest. The JavaScript reference
          signature is also calculated, and supplies the displayed values if the OpenSSL attempt
          fails.
          <br />
          <br />
          The step computes sample recovery metadata after parsing the signature. It does not use
          the optional HSM session or serialize an Ethereum transaction. Signature verification is a
          separate step; the raw values shown here are not a blockchain acceptance result.
        </>
      ),
      code: `// Illustrative summary of the existing software path
// Attempt OpenSSL signing of the saved JSON-payload digest.
await openSSLService.execute(signCmd, filesToPass);
// A JavaScript reference signature is also computed.
// Existing fallback selection and recovery calculations determine the displayed r, s and v.`,
      language: 'javascript',
      actionLabel: 'Sign Sample JSON Hash',
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

      try {
        // Retrieve private key from store
        const filesToPass = fileRetrieval.prepareFilesForExecution([filenames.SRC_PRIVATE_KEY])
        // Need hash file
        filesToPass.push({ name: hashFileName, data: hash })

        const signCmd = `openssl pkeyutl -sign -inkey ${filenames.SRC_PRIVATE_KEY} -in ${hashFileName} -out ${sigFileName}`

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
      // Use JS values if OpenSSL failed
      const final_r = openSSL_error ? jsSigObj.r : openSSL_r
      let final_s = openSSL_error ? jsSigObj.s : openSSL_s

      // Normalize to Low-S (EIP-2)
      // Ethereum requires s <= n/2. OpenSSL might produce s > n/2 (valid in ECDSA but not Eth)
      const n = BigInt('0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141')
      const halfN = n / BigInt(2)
      if (final_s > halfN) {
        final_s = n - final_s
      }

      // 3. Compute Recovery Parameter (v)
      let recovery = 0
      let recoveryFound = false

      // Always derive expected address from the private key FILE to ensure v is correct for the SIGNER
      // Ignoring state.sourceAddress AND keyGen state to ensure consistency with OpenSSL file usage
      let expectedAddress: string | null = null
      try {
        const filesForExtraction = fileRetrieval.prepareFilesForExecution([
          filenames.SRC_PRIVATE_KEY,
        ])
        const rawPrivBytes = await extractKeyFromOpenSSLOutput(
          filenames.SRC_PRIVATE_KEY,
          'private',
          filesForExtraction
        )
        const pubKey = secp256k1.getPublicKey(rawPrivBytes, false)
        const pubKeyNoPrefix = pubKey.slice(1)
        const addrHash = keccak_256(pubKeyNoPrefix)
        expectedAddress = toChecksumAddress(bytesToHex(addrHash.slice(-20)))
        console.log(`[Sign] Derived Target Address from File: ${expectedAddress}`)
      } catch (err) {
        console.warn('Could not derive address from private key file:', err)
      }

      // Helper for Modular Inverse
      const modInverse = (a: bigint, m: bigint) => {
        let [x, y] = [0n, 1n]
        let [a_val, b_val] = [BigInt(m), BigInt(a)]
        while (b_val > 0n) {
          const q = a_val / b_val
          ;[x, y] = [y, x - q * y]
          ;[a_val, b_val] = [b_val, a_val - q * b_val]
        }
        if (x < 0n) x += m
        return x
      }

      for (let i = 0; i < 2; i++) {
        try {
          // Manual Recovery to bypass noble-curves double-hashing
          // 1. Reconstruct R from (r, i)
          const prefix = (2 + i).toString(16).padStart(2, '0')
          const rHex = final_r.toString(16).padStart(64, '0')
          const compressedHex = prefix + rHex

          const R_point = secp256k1.Point.fromHex(compressedHex)

          // 2. Recover Q = rInv * (sR - zG)
          const z = BigInt('0x' + bytesToHex(hash))
          const rInv = modInverse(final_r, n)
          const u1 = (final_s * rInv) % n
          const u2 = (z * rInv) % n
          const u2_neg = (n - u2) % n

          const G_point = secp256k1.Point.BASE
          const Q_point = R_point.multiply(u1).add(G_point.multiply(u2_neg))

          // 3. Derive Address
          const recoveredRaw = Q_point.toBytes(false).slice(1) // Uncompressed, remove 04
          const recoveredHash = keccak_256(recoveredRaw)
          const recoveredAddr = toChecksumAddress(bytesToHex(recoveredHash.slice(-20)))

          if (expectedAddress && recoveredAddr.toLowerCase() === expectedAddress.toLowerCase()) {
            console.log(`[Sign] Found Recovery ID v=${i} for address ${expectedAddress}`)
            recovery = i
            recoveryFound = true
            break
          }
        } catch {
          // Ignore
        }
      }

      if (!recoveryFound) recovery = 0

      // EIP-155: v = recovery + 35 + 2 * chainId (chainId = 1)
      const chainId = 1
      const v = recovery + 35 + 2 * chainId

      actions.setSignature({ r: final_r, s: final_s, recovery: v })

      const rHex = final_r.toString(16).padStart(64, '0')
      const sHex = final_s.toString(16).padStart(64, '0')
      const vHex = v.toString(16)

      result = `Software sample signing trace:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. PREPARE (Keccak-256 Hash)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Keccak-256 Hash to Sign:
0x${hashHex}

📂 Artifact Saved: ${hashFileName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. SIGN (software providers and computation)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Message Hash (from Step 7): 0x${hashHex}

Produced Sample Signature Values (not verified in this step):
r: 0x${rHex}
s: 0x${sHex}
v: 0x${vHex} (sample calculation: ${recovery} + 35 + 2*${chainId})

Raw r || s || v hex display — not an encoded Ethereum transaction:
0x${rHex}${sHex}${vHex}

OpenSSL signing-attempt status: ${openSSL_error ? `FAILED: ${openSSL_error}` : 'SUCCESS ✅'}

Software value selection: ${openSSL_error ? 'JavaScript fallback values used' : 'Parsed OpenSSL values used; JavaScript reference also computed'}
Recovery matching: ${recoveryFound ? 'Matching address candidate found' : 'No matching candidate established; existing recovery-0 default used'}

Registered signature target: ${sigFileName}
When produced, the saved OpenSSL signature contains DER bytes, separate from the raw r || s || v display. This registered target alone does not establish file presence or transaction compatibility.`
    }

    return result
  }

  return { steps, execute }
}
