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
}

// ---------------------------------------------------------------------------
// Production registry
// ---------------------------------------------------------------------------

/**
 * Production vendor certificates — entries added via the admin tool.
 *
 * Each entry is a TypeScript object for compile-time validation.
 * The admin tool generates copy-pasteable entries for this array.
 */
const PRODUCTION_REGISTRY: readonly VendorRegistryEntry[] = [
  // Entries will be added here by the admin tool
]

// ---------------------------------------------------------------------------
// Dev-mode test registry
// ---------------------------------------------------------------------------

/**
 * In development mode, merge test vendor entries so the dev server
 * accepts test-signed URLs without polluting the production registry.
 */
// ---------------------------------------------------------------------------
// Merged registry (built lazily to avoid top-level await / Safari compat)
// ---------------------------------------------------------------------------

let _registry: readonly VendorRegistryEntry[] | null = null

async function buildRegistry(): Promise<readonly VendorRegistryEntry[]> {
  if (_registry !== null) return _registry

  let devEntries: readonly VendorRegistryEntry[] = []
  if (import.meta.env.DEV) {
    try {
      // Dynamic import of dev-only test entries — file may not exist
      const devModule = await import('./vendorRegistry.dev')
      devEntries = devModule.TEST_VENDOR_REGISTRY ?? []
    } catch {
      // vendorRegistry.dev.ts doesn't exist yet — that's fine
    }
  }

  _registry = [...PRODUCTION_REGISTRY, ...devEntries]
  return _registry
}

// ---------------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------------

/**
 * Find a vendor entry by key identifier.
 * Builds the registry on first call (async, Safari-safe — no top-level await).
 *
 * @returns The registry entry, or undefined if the kid is not registered
 */
export async function findVendor(kid: string): Promise<VendorRegistryEntry | undefined> {
  const registry = await buildRegistry()
  return registry.find((v) => v.kid === kid)
}
