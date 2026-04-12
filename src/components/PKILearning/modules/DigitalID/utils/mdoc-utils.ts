// SPDX-License-Identifier: GPL-3.0-only
import type { CryptoKey, CredentialAttribute, MsoMdoc } from '../types'
import type { CryptoProvider } from './crypto-provider'
import { encode } from 'cborg'

// EUDI ARF requires exact CBOR structural encoding and COSE_Sign1 definitions.
// See ISO 18013-5 9.1.2.4

export const createMdoc = async (
  attributes: CredentialAttribute[],
  issuerKey: CryptoKey,
  deviceKey: CryptoKey,
  provider: CryptoProvider,
  docType: string = 'eu.europa.ec.eudi.pid.1',
  onLog?: (log: string) => void
): Promise<MsoMdoc> => {
  // 1. Organize attributes by namespace
  const namespaces: Record<string, Record<string, unknown>> = {
    [docType]: {},
  }

  attributes.forEach((attr) => {
    if (attr.name === '__proto__' || attr.name === 'constructor' || attr.name === 'prototype') {
      return
    }
    namespaces[docType][attr.name] = attr.value // eslint-disable-line security/detect-object-injection
  })

  // 2. Prepare Value Digests for MSO (Mobile Security Object)
  // According to ARF, each element is serialized inside an IssuerSignedItem, then CBOR encoded and hashed
  const digests: Map<number, Uint8Array> = new Map()
  let digestId = 0
  const keys = Object.keys(namespaces[docType])

  for (const key of keys) {
    const itemMap = new Map<string, unknown>()
    itemMap.set('digestID', digestId)
    // EUDI specifies salt should be cryptographically random (ISO 18013-5 §9.1.2.4)
    const salt = new Uint8Array(16)
    crypto.getRandomValues(salt)
    itemMap.set('random', salt)
    itemMap.set('elementIdentifier', key)
    itemMap.set('elementValue', namespaces[docType][key]) // eslint-disable-line security/detect-object-injection

    const itemBytes = encode(itemMap)

    // Hash the resulting CBOR mapping
    const hashB64url = await provider.sha256Hash(itemBytes, onLog)
    const b64 = hashB64url.replace(/-/g, '+').replace(/_/g, '/')
    const binString = atob(b64)
    const hashBytes = new Uint8Array(binString.length).map((_, i) => binString.charCodeAt(i))
    digests.set(digestId++, hashBytes)
  }

  // 3. Assemble MobileSecurityObject matching standard keys
  const mso = new Map<string, unknown>()
  mso.set('version', '1.0')
  mso.set('digestAlgorithm', 'SHA-256')
  mso.set('docType', docType)

  const validityInfo = new Map<string, unknown>()
  const now = new Date()
  validityInfo.set('signed', now.toISOString())
  validityInfo.set('validFrom', now.toISOString())
  validityInfo.set('validUntil', new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString())
  mso.set('validityInfo', validityInfo)

  const deviceKeyInfo = new Map<string, unknown>()
  const coseKey = new Map<number, unknown>()
  coseKey.set(1, 2) // kty: EC2
  coseKey.set(3, deviceKey.algorithm === 'ES384' ? -35 : -7) // alg: ECDSA
  coseKey.set(-1, deviceKey.curve === 'P-384' ? 2 : 1) // crv: P-Curve
  // Educational stub: real coordinates would be extracted from the wallet's EC public key.
  // Extracting raw x/y from our internal CryptoKey type requires provider-layer changes
  // that are out of scope for this simulation. The MSO structure and signing flow are
  // architecturally correct; only the deviceKey coordinates are synthetic.
  coseKey.set(-2, new Uint8Array(32).fill(1)) // x coordinate (structural stub)
  coseKey.set(-3, new Uint8Array(32).fill(2)) // y coordinate (structural stub)
  deviceKeyInfo.set('deviceKey', coseKey)
  mso.set('deviceKeyInfo', deviceKeyInfo)

  const valueDigests = new Map<string, Map<number, Uint8Array>>()
  valueDigests.set(docType, digests)
  mso.set('valueDigests', valueDigests)

  const msoBytes = encode(mso)

  // 4. Construct EUDI strict COSE_Sign1 IssuerAuth block (RFC 8152)
  const protectedHeaderMap = new Map<number, unknown>()
  protectedHeaderMap.set(1, issuerKey.algorithm === 'ES384' ? -35 : -7) // alg header
  const protectedHeaderBytes = encode(protectedHeaderMap)
  const unprotectedHeaderMap = new Map<number, unknown>()

  // EUDI Sig_structure strictly bounds to "Signature1" Context
  const sigStructure = ['Signature1', protectedHeaderBytes, new Uint8Array(0), msoBytes]
  const tbsBytes = encode(sigStructure)

  // Use CryptoProvider signRaw mapping specifically to execute SoftHSM natively
  if (onLog) onLog('Executing SoftHSM C_Sign mapped against COSE_Sign1 structure...')
  const signatureBytes = await provider.signRaw(issuerKey, tbsBytes, onLog)

  const coseSign1 = [protectedHeaderBytes, unprotectedHeaderMap, msoBytes, signatureBytes]

  // Transform final CBOR Payload for visualization
  const issuerAuthBytes = encode(coseSign1)
  const binStringAuth = String.fromCharCode(...Array.from(issuerAuthBytes))
  const finalSignatureB64 = btoa(binStringAuth)

  return {
    docType,
    namespaces,
    mobileSecurityObject: Object.fromEntries(mso) as MsoMdoc['mobileSecurityObject'],
    issuerSignature: finalSignatureB64,
  }
}

export const parseMdoc = (mdocJSON: string): MsoMdoc => {
  return JSON.parse(mdocJSON)
}
