// SPDX-License-Identifier: AGPL-3.0-only
import type { Step } from '../../components/StepWizard'
import { InfoTooltip } from '../../components/InfoTooltip'
import { useArtifactManagement } from '../../hooks/useArtifactManagement'
import { useFileRetrieval } from '../../hooks/useFileRetrieval'
import { openSSLService } from '@/services/crypto/OpenSSLService'
import { secp256k1 } from '@noble/curves/secp256k1.js'
import { keccak_256 } from '@noble/hashes/sha3.js'
import { bytesToHex } from '@noble/hashes/utils.js'
import type { EthereumFlowState } from './types'
import { toChecksumAddress } from './utils'
import { extractKeyFromOpenSSLOutput } from '@/utils/cryptoUtils'

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
      title: '9. Inspect Sample Verification Outputs',
      description: (
        <>
          Attempt software ECDSA <InfoTooltip term="ecdsa" /> verification of the sample digest,
          then compare a separately recovered address with the available expected address using the
          sample recovery parameter <InfoTooltip term="recoveryParam" />.
          <br />
          <br />A service error, missing file-derived signer or address mismatch keeps this step
          incomplete. Read the OpenSSL response and address comparison independently. Neither a
          matching address nor completion of this activity establishes that an Ethereum transaction
          is encoded or accepted.
        </>
      ),
      code: `// Illustrative summary of the executed software checks
const response = await openSSLService.execute(verifyCmd, filesToPass);
// The existing JavaScript calculation separately recovers and compares an address.
// No HSM operation or Ethereum network acceptance check is executed here.`,
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
      if (res.error) throw new Error(`OpenSSL sample verification failed: ${res.error}`)
      const openSSLResult =
        res.stdout ||
        'OpenSSL verification command completed without a service-reported error; no text output.'

      // JS Recovery Verify
      // Decode EIP-155 v back to recovery ID (0 or 1)
      const chainId = 1
      // v = recovery + 35 + 2 * chainId
      // recovery = v - 35 - 2 * chainId
      // Simple handling for now (assuming v is EIP-155 compliant)
      const v = state.signature.recovery
      const recoveryId = v >= 35 ? v - 35 - 2 * chainId : v - 27
      if (!Number.isInteger(recoveryId) || (recoveryId !== 0 && recoveryId !== 1))
        throw new Error(
          'The sample recovery parameter is outside the supported legacy/mainnet range.'
        )

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
      let derivedExpectedAddress = ''
      try {
        const rawPubBytes = await extractKeyFromOpenSSLOutput(
          filenames.SRC_PUBLIC_KEY,
          'public',
          filesToPass
        )

        if (rawPubBytes.length === 0) throw new Error('No public key bytes were returned.')
        if (rawPubBytes.length > 0) {
          const pubKeyNoPrefix = rawPubBytes.slice(1)
          const addrHash = keccak_256(pubKeyNoPrefix)
          const calculatedAddr = toChecksumAddress(bytesToHex(addrHash.slice(-20)))
          derivedExpectedAddress = calculatedAddr
        }
      } catch (err) {
        const detail = err instanceof Error ? err.message : 'Unknown error'
        throw new Error(
          `Could not establish the expected signer from the public key file: ${detail}`
        )
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

      if (!match)
        throw new Error(
          `Recovered sample address ${recoveredAddress} does not match the expected signer ${derivedExpectedAddress}.`
        )

      result = `Sample verification outputs (independent checks):

      1. Software OpenSSL response:
${openSSLResult}

2. Software sample address comparison:
Recovered Address: ${recoveredAddress}
Expected Address: ${derivedExpectedAddress}
Match: ${match ? '✅ MATCH' : '❌ MISMATCH'} `
    }

    return result
  }

  return { steps, execute }
}
