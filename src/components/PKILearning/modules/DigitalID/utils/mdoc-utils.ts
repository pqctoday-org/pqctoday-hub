import type { CryptoKey, CredentialAttribute, MsoMdoc } from '../types'
import { signData, sha256Hash } from './crypto-utils'

// Simplified mdoc structure for educational visualization
// In a real implementation, this would be binary CBOR

export const createMdoc = async (
  attributes: CredentialAttribute[],
  issuerKey: CryptoKey,
  deviceKey: CryptoKey,
  docType: string = 'org.iso.18013.5.1.mDL',
  onLog?: (log: string) => void
): Promise<MsoMdoc> => {
  // 1. Organize attributes by namespace
  // For MVA mDL, standard namespace is org.iso.18013.5.1
  // EU PID adds eu.europa.ec.eudi.pid.1

  /* eslint-disable security/detect-object-injection */
  const namespaces: Record<string, Record<string, unknown>> = {
    [docType]: {},
  }

  attributes.forEach((attr) => {
    if (attr.name === '__proto__' || attr.name === 'constructor' || attr.name === 'prototype') {
      return
    }
    namespaces[docType][attr.name] = attr.value
  })

  // 2. Create Mobile Security Object (MSO)
  // This is the structure signed by the issuer
  const mso = {
    version: '1.0',
    digestAlgorithm: 'SHA-256',
    docType: docType,
    validityInfo: {
      signed: new Date().toISOString(),
      validFrom: new Date().toISOString(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
    },
    deviceKeyInfo: {
      deviceKey: {
        // Simplified representation of COSE Key
        kty: 'EC',
        crv: deviceKey.curve,
        x: '...', // In real app, these would be actual values
        y: '...',
      },
    },
    // In real mdoc, this contains digests of all data items
    // We simulate it here
    valueDigests: {
      [docType]: await (async () => {
        const keys = Object.keys(namespaces[docType])
        const digests: Record<string, string> = {}
        for (const key of keys) {
          digests[key] = await sha256Hash(JSON.stringify(namespaces[docType][key]), onLog)
        }
        return digests
      })(),
    },
  }

  // 3. Sign the MSO
  // We sign the JSON string of MSO for this simulation
  const msoString = JSON.stringify(mso)
  const signature = await signData(issuerKey, msoString, onLog)

  return {
    docType,
    namespaces,
    mobileSecurityObject: mso,
    issuerSignature: signature,
  }
}

export const parseMdoc = (mdocJSON: string): MsoMdoc => {
  return JSON.parse(mdocJSON)
}
