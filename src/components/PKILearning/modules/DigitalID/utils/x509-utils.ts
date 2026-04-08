// SPDX-License-Identifier: GPL-3.0-only
import type { CryptoProvider } from './crypto-provider'
import type { CryptoKey } from '../types'
import {
  buildSelfSignedX509,
  ECDSA_SHA256_OID_STR,
  derToPem,
} from '../../HybridCrypto/services/certBuilder'

const hexToBytes = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

export async function generateX509Certificate(
  key: CryptoKey,
  provider: CryptoProvider,
  subjectName: string,
  onLog?: (msg: string) => void
): Promise<string> {
  if (onLog) onLog(`Generating X.509 v3 Certificate for ${subjectName}...`)

  const pubKeyBytes = hexToBytes(key.publicKey)

  // Determine signature algorithm based on key type
  const algOid = key.algorithm === 'ES384' ? '1.2.840.10045.4.3.3' : ECDSA_SHA256_OID_STR

  // The certBuilder expects a generic signer: (tbs: Uint8Array) => Promise<Uint8Array>
  const signerFn = async (tbs: Uint8Array): Promise<Uint8Array> => {
    if (onLog) onLog(`Signing TBSCertificate payload via provider...`)
    return provider.signRaw(key, tbs, onLog)
  }

  const derBytes = await buildSelfSignedX509(pubKeyBytes, signerFn, algOid, subjectName)

  if (onLog) onLog(`X.509 Certificate successfully generated and signed.`)
  return derToPem(derBytes, 'CERTIFICATE')
}
