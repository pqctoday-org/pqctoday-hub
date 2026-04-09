// SPDX-License-Identifier: GPL-3.0-only

/**
 * X.509 certificate parser for vendor embed certificates.
 *
 * Uses @peculiar/x509 to parse PEM certificates and extract the public key,
 * validity window, and custom OID extensions that encode vendor capabilities.
 *
 * See PRD §3.1–3.2 for the certificate architecture and OID assignments.
 */

import * as x509 from '@peculiar/x509'

// ---------------------------------------------------------------------------
// Custom OID arc — placeholder until PEN is assigned
// ---------------------------------------------------------------------------

const OID_PREFIX = '1.3.6.1.4.1.99999' // placeholder PEN arc

export const CUSTOM_OIDS = {
  allowedRoutePresets: `${OID_PREFIX}.1`,
  allowedOrigins: `${OID_PREFIX}.2`,
  maxSessionDuration: `${OID_PREFIX}.3`,
  persistModes: `${OID_PREFIX}.4`,
  allowedRegions: `${OID_PREFIX}.5`,
  allowedIndustries: `${OID_PREFIX}.6`,
  allowedRoles: `${OID_PREFIX}.7`,
} as const

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
  /** Comma-separated route preset names from cert extension */
  allowedRoutePresets: string[]
  /** Allowed parent origins from cert extension */
  allowedOrigins: string[]
  /** Maximum session duration in seconds */
  maxSessionDuration: number
  /** Allowed persistence modes */
  persistModes: string[]
  /** Allowed geographic regions */
  allowedRegions: string[]
  /** Allowed industry verticals */
  allowedIndustries: string[]
  /** Allowed persona roles */
  allowedRoles: string[]
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

  // Extract the public key as a CryptoKey for Web Crypto API verification
  const publicKey = await cert.publicKey.export({
    name: 'ECDSA',
    namedCurve: 'P-256',
  } as EcKeyImportParams)

  // Extract subject fields
  const subjectCN = getSubjectField(cert, 'CN') || 'Unknown Vendor'
  const subjectO = getSubjectField(cert, 'O') || 'Unknown Organization'

  // Extract custom extensions — all are optional with sensible defaults
  const allowedRoutePresets = getStringExtension(cert, CUSTOM_OIDS.allowedRoutePresets, 'all')
  const allowedOrigins = getStringExtension(cert, CUSTOM_OIDS.allowedOrigins, '*')
  const maxSessionDuration = getIntExtension(cert, CUSTOM_OIDS.maxSessionDuration, 86400)
  const persistModes = getStringExtension(cert, CUSTOM_OIDS.persistModes, 'api,postMessage,none')
  const allowedRegions = getStringExtension(cert, CUSTOM_OIDS.allowedRegions, 'global')
  const allowedIndustries = getStringExtension(
    cert,
    CUSTOM_OIDS.allowedIndustries,
    'finance,healthcare,government,telecom,energy,defense,technology,education'
  )
  const allowedRoles = getStringExtension(cert, CUSTOM_OIDS.allowedRoles, 'curious,basics,expert')

  return {
    publicKey,
    notBefore: cert.notBefore,
    notAfter: cert.notAfter,
    allowedRoutePresets: splitCsv(allowedRoutePresets),
    allowedOrigins: splitCsv(allowedOrigins),
    maxSessionDuration,
    persistModes: splitCsv(persistModes),
    allowedRegions: splitCsv(allowedRegions),
    allowedIndustries: splitCsv(allowedIndustries),
    allowedRoles: splitCsv(allowedRoles),
    subjectCN,
    subjectO,
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSubjectField(cert: x509.X509Certificate, shortName: string): string | undefined {
  // @peculiar/x509 represents the subject as an array of attribute arrays
  for (const rdn of cert.subject) {
    for (const attr of rdn) {
      // OID for CN = 2.5.4.3, O = 2.5.4.10
      const oid = shortName === 'CN' ? '2.5.4.3' : shortName === 'O' ? '2.5.4.10' : ''
      if (attr.type === oid) {
        return String(attr.value)
      }
    }
  }
  return undefined
}

function getStringExtension(cert: x509.X509Certificate, oid: string, defaultValue: string): string {
  const ext = cert.getExtension(oid)
  if (!ext) return defaultValue

  try {
    // Extension value is ASN.1 encoded — try to decode as UTF8String
    const value = new TextDecoder().decode(ext.value)
    // Strip ASN.1 tag+length prefix if present (UTF8String tag = 0x0C)
    if (value.charCodeAt(0) === 0x0c) {
      const len = value.charCodeAt(1)
      return value.slice(2, 2 + len)
    }
    return value
  } catch {
    return defaultValue
  }
}

function getIntExtension(cert: x509.X509Certificate, oid: string, defaultValue: number): number {
  const str = getStringExtension(cert, oid, String(defaultValue))
  const parsed = parseInt(str, 10)
  return isNaN(parsed) ? defaultValue : parsed
}

function splitCsv(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}
