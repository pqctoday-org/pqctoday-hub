// SPDX-License-Identifier: GPL-3.0-only

/**
 * Vendor certificate registry.
 *
 * Stores the full PEM certificate for each vendor — capabilities and expiry
 * are parsed from the certificate at verification time, not stored separately.
 *
 * See PRD §3.4 for the registry design.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VendorRegistryEntry {
  /** Unique key identifier — matches `kid` URL parameter */
  kid: string
  /** Vendor organization identifier */
  vendorId: string
  /** Vendor display name */
  vendorName: string
  /** Full X.509 PEM certificate (includes public key + capabilities + expiry) */
  certPem: string
  /** Soft revocation flag — checked before signature verification */
  revoked: boolean
  /** Marks this as a development/test key to trigger the overlay warning */
  isTest?: boolean
}

// ---------------------------------------------------------------------------
// Production registry
// ---------------------------------------------------------------------------

import * as x509 from '@peculiar/x509'

// Explicitly ensure crypto gets bound for cert parsing.
if (typeof window !== 'undefined' && window.crypto) {
  x509.cryptoProvider.set(window.crypto)
}

function extractSubjectO(cert: x509.X509Certificate): string {
  return cert.subjectName.getField('O')[0] ?? 'unknown-vendor'
}

function extractSubjectCN(cert: x509.X509Certificate): string {
  return cert.subjectName.getField('CN')[0] ?? 'Unknown'
}

/**
 * Production vendor certificates — natively bound to the physical offline folder!
 * Vite will bundle all .pem files dropped in here automatically.
 */
const certFiles = import.meta.glob('../../pki/vendors/*.pem', { as: 'raw', eager: true })

const PRODUCTION_REGISTRY: VendorRegistryEntry[] = []

for (const [path, pemContent] of Object.entries(certFiles as Record<string, string>)) {
  try {
    const cert = new x509.X509Certificate(pemContent)

    // Extract kid from filename (e.g. '../../pki/vendors/my-vendor-key.pem' -> 'my-vendor-key')
    const fileName = path.split('/').pop() || ''
    const kid = fileName.replace('.pem', '')

    PRODUCTION_REGISTRY.push({
      kid,
      vendorId: extractSubjectO(cert),
      vendorName: extractSubjectCN(cert),
      certPem: pemContent,
      revoked: false, // In a real system, sync with a physical pki/revoked/ folder or external CRL
    })
  } catch (err) {
    console.error(`Failed to parse offline certificate: ${path}`, err)
  }
}

// ---------------------------------------------------------------------------
// Dev-mode test registry
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------------

/**
 * Find a vendor entry by key identifier.
 *
 * @returns The registry entry, or undefined if the kid is not registered
 */
export function findVendor(kid: string): VendorRegistryEntry | undefined {
  return PRODUCTION_REGISTRY.find((v) => v.kid === kid)
}
