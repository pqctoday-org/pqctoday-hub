import type { Step } from '../../components/StepWizard'
import { InfoTooltip } from '../../components/InfoTooltip'
import { useArtifactManagement } from '../../hooks/useArtifactManagement'
import { useFileRetrieval } from '../../hooks/useFileRetrieval'
import { openSSLService } from '../../../../../../services/crypto/OpenSSLService'
import { secp256k1 } from '@noble/curves/secp256k1.js'
import { keccak_256 } from '@noble/hashes/sha3.js'
import { bytesToHex } from '@noble/hashes/utils.js'
import type { EthereumFlowState } from './types'
import { toChecksumAddress } from './utils'
import { extractKeyFromOpenSSLOutput } from '../../../../../../utils/cryptoUtils'

interface UseEthereumVerificationProps {
  artifacts: ReturnType<typeof useArtifactManagement>
  fileRetrieval: ReturnType<typeof useFileRetrieval>
  state: EthereumFlowState
  filenames: {
    SRC_PUBLIC_KEY: string
  }
}

export function useEthereumVerification({
  artifacts,
  fileRetrieval,
  state,
  filenames,
}: UseEthereumVerificationProps): { steps: Step[]; execute: (stepId: string) => Promise<string> } {
  const steps: Step[] = [
    {
      id: 'verify',
      title: '9. Verify Signature',
      description: (
        <>
          Verify the ECDSA
          <InfoTooltip term="ecdsa" /> signature and recover the public key / address from it using
          the recovery parameter <InfoTooltip term="recoveryParam" />.
          <br /> <br />
          <strong> Public Key Recovery: </strong> Ethereum's unique feature - you can derive the
          sender's address from just the signature and message, without needing the public key
          separately.
        </>
      ),
      code: `// OpenSSL Standard ECDSA Verify\nopenssl pkeyutl -verify -inkey src_pub.pem -pubin -in ethereum_hashdata_[ts].dat -sigfile ethereum_signdata_[ts].sig\n\n// Recover Address\nconst recoveredPubKey = sigObj.recoverPublicKey(txHash);\nconst recoveredAddress = deriveAddress(recoveredPubKey);`,
      language: 'javascript',
      actionLabel: 'Verify & Recover',
    },
  ]

  const execute = async (stepId: string) => {
    let result = ''

    if (stepId === 'verify') {
      if (!state.txHash || !state.signature)
        throw new Error('Missing transaction hash or signature. Please sign first.')

      // Artifacts should exist in store from previous step
      const hashFileName = artifacts.filenames.hash || 'ethereum_hashdata.dat'
      const sigFileName = artifacts.filenames.sig || 'ethereum_signdata.sig'

      const filesToPass = fileRetrieval.prepareFilesForExecution([
        filenames.SRC_PUBLIC_KEY,
        hashFileName,
        sigFileName,
      ])

      // OpenSSL Verify
      const verifyCmd = `openssl pkeyutl -verify -inkey ${filenames.SRC_PUBLIC_KEY} -pubin -in ${hashFileName} -sigfile ${sigFileName}`
      const res = await openSSLService.execute(verifyCmd, filesToPass)
      const openSSLResult = res.error
        ? `OpenSSL Verification Failed: ${res.error}`
        : res.stdout || 'Signature verified successfully using OpenSSL'

      // JS Recovery Verify
      // Decode EIP-155 v back to recovery ID (0 or 1)
      const chainId = 1
      // v = recovery + 35 + 2 * chainId
      // recovery = v - 35 - 2 * chainId
      // Simple handling for now (assuming v is EIP-155 compliant)
      const v = state.signature.recovery
      let recoveryId = v >= 35 ? v - 35 - 2 * chainId : v - 27
      if (recoveryId < 0) recoveryId = 0 // Fallback or non-EIP-155

      // Helper for Modular Inverse (Same as in Signing)
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

      // Manual Recovery Logic (Verified Match with Signing)
      const n = BigInt('0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141')

      // 1. Reconstruct R from (r, recoveryId)
      const prefix = (2 + recoveryId).toString(16).padStart(2, '0')
      const rHex = state.signature.r.toString(16).padStart(64, '0')
      const compressedHex = prefix + rHex

      const R_point = secp256k1.Point.fromHex(compressedHex)

      // 2. Recover Q = rInv * (sR - zG)
      // Strip 0x if present to be safe
      const cleanHash = state.txHash.replace(/^0x/, '')
      const z = BigInt('0x' + cleanHash)

      // 3. Derive Expected Address from Public Key File
      // This ensures we compare against the uploaded key, not potentially stale state
      let derivedExpectedAddress = state.sourceAddress || ''
      try {
        const rawPubBytes = await extractKeyFromOpenSSLOutput(
          filenames.SRC_PUBLIC_KEY,
          'public',
          filesToPass
        )

        if (rawPubBytes.length > 0) {
          const pubKeyNoPrefix = rawPubBytes.slice(1)
          const addrHash = keccak_256(pubKeyNoPrefix)
          const calculatedAddr = toChecksumAddress(bytesToHex(addrHash.slice(-20)))
          derivedExpectedAddress = calculatedAddr
        }
      } catch (err) {
        console.warn('Could not derive address from public key file, falling back to state:', err)
      }

      const rInv = modInverse(state.signature.r, n)
      const u1 = (state.signature.s * rInv) % n
      const u2 = (z * rInv) % n
      const u2_neg = (n - u2) % n

      const G_point = secp256k1.Point.BASE
      const Q_point = R_point.multiply(u1).add(G_point.multiply(u2_neg))

      // 3. Get Raw Bytes
      const recoveredRaw = Q_point.toBytes(false).slice(1)

      const recoveredHash = keccak_256(recoveredRaw)

      const recoveredAddress = toChecksumAddress(bytesToHex(recoveredHash.slice(-20)))

      console.log('[Verify] Derived Expected Address (File):', derivedExpectedAddress)
      console.log('[Verify] Recovered Address (Sig):', recoveredAddress)

      const match =
        derivedExpectedAddress &&
        recoveredAddress.toLowerCase() === derivedExpectedAddress.toLowerCase()

      result = `Verification Result:

      1. OpenSSL Verification:
${openSSLResult}

2. Address Recovery(EIP - 155):
Recovered Address: ${recoveredAddress}
Expected Address: ${derivedExpectedAddress}
Match: ${match ? '✅ MATCH' : '❌ MISMATCH'} `
    }

    return result
  }

  return { steps, execute }
}
