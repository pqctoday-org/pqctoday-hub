// SPDX-License-Identifier: GPL-3.0-only
import type { CryptoKey, CredentialAttribute, MsoMdoc, IssuerSignedItem } from '../types'
import type { CryptoProvider } from './crypto-provider'
import { encode } from 'cborg'
import { bytesToBase64 } from './hsm-crypto-provider'

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
  // Each element's salt is retained alongside its digest. Without it a holder
  // cannot later present a SUBSET of elements: ISO 18013-5 selective disclosure
  // works by sending the chosen IssuerSignedItems verbatim so the verifier can
  // re-hash them and match against the signed MSO. This used to be generated
  // inside the loop and thrown away, which left the mdoc structurally unable to
  // do the selective disclosure the module teaches (added 2026-07-31).
  const issuerSignedItems: IssuerSignedItem[] = []
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
    issuerSignedItems.push({
      digestID: digestId,
      random: bytesToBase64(salt),
      elementIdentifier: key,
      elementValue: namespaces[docType][key], // eslint-disable-line security/detect-object-injection
    })

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

  // The CBOR that gets signed above uses Maps, which is structurally correct
  // per ISO 18013-5. The RETURNED object, however, is JSON.stringify'd into
  // the wallet's credential store — and a Map serialises to `{}`, which
  // silently dropped every value digest the moment a credential was saved.
  // Emit a JSON-safe mirror (base64 digests keyed by digestID) so a stored
  // mdoc can still be verified after a round trip.
  const jsonValueDigests: Record<string, Record<string, string>> = {
    [docType]: Object.fromEntries(
      Array.from(digests.entries()).map(([id, bytes]) => [String(id), bytesToBase64(bytes)])
    ),
  }

  return {
    docType,
    namespaces,
    issuerSignedItems,
    mobileSecurityObject: {
      ...(Object.fromEntries(mso) as MsoMdoc['mobileSecurityObject']),
      valueDigests: jsonValueDigests,
    },
    issuerSignature: finalSignatureB64,
  }
}

export const parseMdoc = (mdocJSON: string): MsoMdoc => {
  return JSON.parse(mdocJSON)
}

/**
 * ISO 18013-5 selective disclosure for an mdoc.
 *
 * The holder sends only the chosen IssuerSignedItems. Everything else — the
 * MSO and the issuer's COSE_Sign1 over it — travels unchanged, because the
 * issuer's signature covers the DIGESTS, not the values. Withholding an
 * element therefore costs nothing cryptographically: the verifier simply has
 * one fewer item to re-hash, and the digest it would have matched stays in the
 * MSO unmatched.
 *
 * This is what lets a wallet prove `age_over_18` while withholding
 * `birth_date` from the very same signed credential.
 */
export const createMdocPresentation = (
  mdoc: MsoMdoc,
  selectedElements: string[]
): { docType: string; disclosed: IssuerSignedItem[]; withheld: string[]; mobileSecurityObject: MsoMdoc['mobileSecurityObject']; issuerSignature: string } => {
  const items = mdoc.issuerSignedItems ?? []
  const disclosed = items.filter((i) => selectedElements.includes(i.elementIdentifier))
  const withheld = items
    .filter((i) => !selectedElements.includes(i.elementIdentifier))
    .map((i) => i.elementIdentifier)
  return {
    docType: mdoc.docType,
    disclosed,
    withheld,
    mobileSecurityObject: mdoc.mobileSecurityObject,
    issuerSignature: mdoc.issuerSignature,
  }
}

/**
 * Verifier side: re-hash each disclosed item and match it against the digest
 * the issuer signed. Returns per-element results so the UI can show that a
 * withheld element is genuinely absent rather than merely hidden from view.
 */
export const verifyMdocPresentation = async (
  presentation: ReturnType<typeof createMdocPresentation>,
  provider: CryptoProvider,
  onLog?: (log: string) => void
): Promise<{ element: string; digestMatched: boolean }[]> => {
  const digestMap = (presentation.mobileSecurityObject?.valueDigests ?? {}) as Record<
    string,
    Record<string, unknown>
  >
  const nsDigests = digestMap[presentation.docType] ?? {}
  const results: { element: string; digestMatched: boolean }[] = []

  for (const item of presentation.disclosed) {
    // Rebuild the exact IssuerSignedItem CBOR the issuer hashed at issuance.
    const salt = Uint8Array.from(atob(item.random), (c) => c.charCodeAt(0))
    const itemMap = new Map<string, unknown>()
    itemMap.set('digestID', item.digestID)
    itemMap.set('random', salt)
    itemMap.set('elementIdentifier', item.elementIdentifier)
    itemMap.set('elementValue', item.elementValue)

    const hashB64url = await provider.sha256Hash(encode(itemMap), onLog)
    const recomputed = hashB64url.replace(/-/g, '+').replace(/_/g, '/')

    const expectedRaw = (nsDigests as Record<string, unknown>)[String(item.digestID)]
    const expected =
      expectedRaw instanceof Uint8Array
        ? bytesToBase64(expectedRaw)
        : typeof expectedRaw === 'string'
          ? expectedRaw
          : ''
    // Compare on padded base64 so encoding differences don't read as tampering.
    const matched = expected !== '' && recomputed.replace(/=+$/, '') === expected.replace(/=+$/, '')
    results.push({ element: item.elementIdentifier, digestMatched: matched })
  }
  return results
}
