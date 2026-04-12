// SPDX-License-Identifier: GPL-3.0-only

/**
 * X.509 certificate parser for vendor embed certificates.
 *
 * Uses @peculiar/x509 to parse PEM certificates and extract the public key,
 * validity window, and the vendor policy extension (OID .1) that encodes
 * all access restrictions as a JSON-encoded VendorPolicy object.
 *
 * Backward compatible: certs with the old 8 CSV OID format are automatically
 * reconstructed into VendorPolicy shape.
 *
 * See PRD §3.1–3.2 for the certificate architecture and OID assignments.
 */

import 'reflect-metadata'
import * as x509 from '@peculiar/x509'
import {
  VENDOR_POLICY_OID,
  ALLOWED_ORIGINS_OID,
  LEGACY_OIDS,
  defaultVendorPolicy,
  type VendorPolicy,
} from './vendorPolicy'

// Explicitly bind the browser Web Crypto API to @peculiar/x509.
// This prevents 'Cannot read properties of undefined (reading importKey)'
// errors caused by Vite's ESM bundler hiding the global scope from the module.
if (typeof window !== 'undefined' && window.crypto) {
  x509.cryptoProvider.set(window.crypto)
}

// ---------------------------------------------------------------------------
// Root CA trust anchor — loaded at build time from pki/ca/*.pem
// Vite bundles the PEM bytes into the JS output; the shipped bundle is the
// trust anchor, equivalent to a hardcoded string but rotation-friendly.
// ---------------------------------------------------------------------------

const rootCaFiles = import.meta.glob('../../pki/ca/*.pem', { as: 'raw', eager: true })

const ROOT_CA_CERTS: x509.X509Certificate[] = []
for (const [, pem] of Object.entries(rootCaFiles as Record<string, string>)) {
  try {
    ROOT_CA_CERTS.push(new x509.X509Certificate(pem))
  } catch {
    // malformed PEM — skip
  }
}

/**
 * Verify that a PEM-encoded vendor certificate chains up to one of the bundled Root CA certs.
 *
 * Uses @peculiar/x509 X509ChainBuilder which performs:
 *   - Issuer/subject name matching
 *   - Signature verification (Root CA signs vendor cert)
 *   - Basic constraints (CA:TRUE on the root)
 *
 * @throws if no root CA is configured or the chain cannot be verified
 */
export async function verifyChain(vendorCertPem: string): Promise<void> {
  if (ROOT_CA_CERTS.length === 0) {
    throw new Error('No Root CA configured — add a PEM cert to pki/ca/')
  }

  const vendorCert = new x509.X509Certificate(vendorCertPem)
  const chain = new x509.X509ChainBuilder({ certificates: ROOT_CA_CERTS })
  const built = await chain.build(vendorCert)

  // built[0] is the end-entity (vendor cert), built[last] should be the root CA.
  // A valid chain has at least 2 entries (vendor + root).
  if (built.length < 2) {
    throw new Error(
      'Certificate chain could not be built — vendor cert not issued by a trusted Root CA'
    )
  }
}

// ---------------------------------------------------------------------------
// Parsed certificate type
// ---------------------------------------------------------------------------

export interface ParsedVendorCert {
  /** ECDSA P-256 public key for signature verification */
  publicKey: CryptoKey
  /** Certificate validity start */
  notBefore: Date
  /** Certificate validity end */
  notAfter: Date
  /** Full vendor access policy decoded from OID .1 */
  policy: VendorPolicy
  /** Allowed parent origins decoded from OID .2 */
  allowedOrigins: string[]
  /** Subject Common Name (vendorName) */
  subjectCN: string
  /** Subject Organization (vendorId) */
  subjectO: string
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

/**
 * Parse a PEM-encoded X.509 certificate and extract vendor capabilities.
 *
 * @throws If the PEM is invalid or critical fields are missing
 */
export async function parsePemCertificate(pem: string): Promise<ParsedVendorCert> {
  const cert = new x509.X509Certificate(pem)

  // Extract the public key via native WebCrypto — avoids relying on @peculiar/x509's
  // internal cryptoProvider binding which breaks under Vite's Node-context pre-bundling.
  // cert.publicKey.rawData is the raw SubjectPublicKeyInfo DER bytes — no crypto needed.
  const spkiBytes = new Uint8Array(cert.publicKey.rawData)
  const publicKey = await window.crypto.subtle.importKey(
    'spki',
    spkiBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['verify']
  )

  // Extract subject fields
  const subjectCN = getSubjectField(cert, 'CN') || 'Unknown Vendor'
  const subjectO = getSubjectField(cert, 'O') || 'Unknown Organization'

  // Origins are always separate (needed at postMessage boundary before JSON parse)
  const allowedOrigins = splitCsv(getStringExtension(cert, ALLOWED_ORIGINS_OID, '*'))

  // Decode policy — try new JSON format first, fall back to legacy CSV OIDs
  const policy = decodePolicy(cert)

  return {
    publicKey,
    notBefore: cert.notBefore,
    notAfter: cert.notAfter,
    policy,
    allowedOrigins,
    subjectCN,
    subjectO,
  }
}

// ---------------------------------------------------------------------------
// Policy decoding
// ---------------------------------------------------------------------------

/**
 * Decode VendorPolicy from the certificate.
 *
 * New format: OID .1 contains JSON.stringify(VendorPolicy)
 * Legacy format: OIDs .1/.3-.8 contain individual CSV values
 */
function decodePolicy(cert: x509.X509Certificate): VendorPolicy {
  const rawPolicy = getStringExtension(cert, VENDOR_POLICY_OID, '')

  if (rawPolicy) {
    // Attempt JSON decode (new format)
    try {
      const parsed = JSON.parse(rawPolicy) as VendorPolicy
      // Validate minimum required shape
      if (parsed.routes?.presets && parsed.session?.persistModes && parsed.features) {
        return parsed
      }
    } catch {
      // Fall through to legacy decode
    }
  }

  // Legacy CSV OID fallback — reconstruct VendorPolicy from old 8-OID format
  return {
    routes: {
      presets: splitCsv(getStringExtension(cert, LEGACY_OIDS.allowedRoutePresets, 'all')),
    },
    content: {
      regions: splitCsv(getStringExtension(cert, LEGACY_OIDS.allowedRegions, 'global')),
      industries: splitCsv(
        getStringExtension(
          cert,
          LEGACY_OIDS.allowedIndustries,
          'finance,healthcare,government,telecom,energy,defense,technology,education'
        )
      ),
      roles: splitCsv(getStringExtension(cert, LEGACY_OIDS.allowedRoles, 'curious,basics,expert')),
    },
    session: {
      maxDuration: getIntExtension(cert, LEGACY_OIDS.maxSessionDuration, 86400),
      persistModes: splitCsv(
        getStringExtension(cert, LEGACY_OIDS.persistModes, 'api,postMessage,none')
      ),
    },
    features: {
      assistantEnabled: getStringExtension(cert, LEGACY_OIDS.assistantEnabled, 'true') !== 'false',
    },
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSubjectField(cert: x509.X509Certificate, shortName: string): string | undefined {
  const values = cert.subjectName.getField(shortName)
  return values.length > 0 ? values[0] : undefined
}

function getStringExtension(cert: x509.X509Certificate, oid: string, defaultValue: string): string {
  const ext = cert.getExtension(oid)
  if (!ext) return defaultValue

  try {
    const bytes = new Uint8Array(ext.value)
    // Strip ASN.1 DER tag+length prefix if present (UTF8String tag = 0x0C)
    if (bytes[0] === 0x0c) {
      let offset = 1
      let len: number
      if (bytes[offset] <= 0x7f) {
        // Short form: length in single byte
        len = bytes[offset]
        offset += 1
      } else {
        // Long form: next byte indicates how many bytes encode the length
        const numLenBytes = bytes[offset] & 0x7f
        offset += 1
        len = 0
        for (let i = 0; i < numLenBytes; i++) {
          len = (len << 8) | bytes[offset + i]
        }
        offset += numLenBytes
      }
      return new TextDecoder().decode(bytes.slice(offset, offset + len))
    }
    return new TextDecoder().decode(bytes)
  } catch {
    return defaultValue
  }
}

function getIntExtension(cert: x509.X509Certificate, oid: string, defaultValue: number): number {
  const str = getStringExtension(cert, oid, String(defaultValue))
  const parsed = parseInt(str, 10)
  return isNaN(parsed) ? defaultValue : parsed
}

export function splitCsv(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

// Re-export for consumers that only need the default policy
export { defaultVendorPolicy }
