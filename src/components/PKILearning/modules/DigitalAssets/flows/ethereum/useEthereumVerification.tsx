import type { Step } from '../../components/StepWizard'
import { InfoTooltip } from '../../components/InfoTooltip'
import { useArtifactManagement } from '../../hooks/useArtifactManagement'
import { useFileRetrieval } from '../../hooks/useFileRetrieval'
import { openSSLService } from '../../../../../../services/crypto/OpenSSLService'
import { secp256k1 } from '@noble/curves/secp256k1.js'
import { keccak_256 } from '@noble/hashes/sha3.js'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'
import type { EthereumFlowState } from './types'
import { toChecksumAddress } from './utils'

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
      code: `// OpenSSL Standard ECDSA Verify\nopenssl pkeyutl -verify -inkey src_pub.pem -pubin -in ethereum_hashdata_[ts].dat -sigfile ethereum_signdata_[ts].sig -rawin\n\n// Recover Address\nconst recoveredPubKey = sigObj.recoverPublicKey(txHash);\nconst recoveredAddress = deriveAddress(recoveredPubKey);`,
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
      const verifyCmd = `openssl pkeyutl -verify -inkey ${filenames.SRC_PUBLIC_KEY} -pubin -in ${hashFileName} -sigfile ${sigFileName} -rawin`
      const res = await openSSLService.execute(verifyCmd, filesToPass)
      const openSSLResult = res.error
        ? `OpenSSL Verification Failed: ${res.error}`
        : res.stdout || 'Signature verified successfully using OpenSSL'

      // JS Recovery Verify
      const sigObj = new secp256k1.Signature(
        state.signature.r,
        state.signature.s,
        state.signature.recovery
      )
      const recoveredPubKey = sigObj.recoverPublicKey(hexToBytes(state.txHash))
      const recoveredRaw = recoveredPubKey.toBytes(false).slice(1)

      const recoveredHash = keccak_256(recoveredRaw)
      const recoveredAddress = toChecksumAddress(bytesToHex(recoveredHash.slice(-20)))

      const match =
        state.sourceAddress && recoveredAddress.toLowerCase() === state.sourceAddress.toLowerCase()

      result = `Verification Result:

      1. OpenSSL Verification:
${openSSLResult}

2. Address Recovery(EIP - 155):
Recovered Address: ${recoveredAddress}
Expected Address: ${state.sourceAddress}
Match: ${match ? '✅ MATCH' : '❌ MISMATCH'} `
    }

    return result
  }

  return { steps, execute }
}
