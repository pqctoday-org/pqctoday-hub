// SPDX-License-Identifier: GPL-3.0-only

/**
 * Embed URL signature verification — the core security gate.
 *
 * Implements the full 9-step verification flow from PRD §5:
 *   1. Parse URL parameters
 *   2. Lookup kid in VENDOR_REGISTRY
 *   3. Parse X.509 certificate
 *   4. Validate certificate time window
 *   5. Validate URL expiry (5-min clock skew tolerance)
 *   6. Validate routes against certificate
 *   7. Validate persist mode against certificate
 *   8. Verify ECDSA P-256 signature
 *   9. Construct EmbedConfig
 */

import { base64urlDecode } from './base64url'
import { parsePemCertificate } from './certParser'
import type { EmbedConfig } from './embedContext'
import { resolveRoutes } from './routePresets'
import { findVendor } from './vendorRegistry'

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

export type EmbedErrorCode =
  | 'missing_params'
  | 'unknown_vendor'
  | 'revoked'
  | 'cert_not_yet_valid'
  | 'cert_expired'
  | 'url_expired'
  | 'session_too_long'
  | 'unauthorized_routes'
  | 'unauthorized_persist'
  | 'invalid_signature'
  | 'verification_error'

export class EmbedVerificationError extends Error {
  constructor(
    public readonly code: EmbedErrorCode,
    message: string,
    public readonly kid?: string
  ) {
    super(message)
    this.name = 'EmbedVerificationError'
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Clock skew tolerance in seconds (5 minutes) */
const CLOCK_SKEW_SECONDS = 300

/** Required URL parameters */
const REQUIRED_PARAMS = ['kid', 'uid', 'exp', 'nonce', 'routes', 'persist', 'sig'] as const

// ---------------------------------------------------------------------------
// Main verification function
// ---------------------------------------------------------------------------

/**
 * Verify an embed URL and return the embed configuration.
 *
 * This function is called once from main.tsx before React mounts.
 * It performs all security checks and returns a complete EmbedConfig
 * on success, or throws an EmbedVerificationError on failure.
 *
 * @throws {EmbedVerificationError} with a specific error code
 */
export async function verifyEmbedUrl(url: URL): Promise<EmbedConfig> {
  const params = url.searchParams
  let kid: string | undefined

  try {
    // -----------------------------------------------------------------------
    // Step 1: Parse required parameters
    // -----------------------------------------------------------------------
    for (const key of REQUIRED_PARAMS) {
      if (!params.has(key)) {
        throw new EmbedVerificationError('missing_params', `Missing required parameter: ${key}`)
      }
    }

    kid = params.get('kid')!
    const uid = params.get('uid')!
    const exp = parseInt(params.get('exp')!, 10)
    const nonce = params.get('nonce')!
    const routes = params.get('routes')!
    const persist = params.get('persist')! as 'api' | 'postMessage' | 'none'
    const sig = params.get('sig')!
    const apiBase = params.get('apiBase') ?? undefined
    const theme = (params.get('theme') as 'dark' | 'light' | undefined) ?? undefined
    const persona = params.get('persona') ?? undefined

    // Validate nonce length (min 16 chars as per PRD)
    if (nonce.length < 16) {
      throw new EmbedVerificationError('missing_params', 'Nonce must be at least 16 characters')
    }

    // Validate persist mode is a known value
    if (!['api', 'postMessage', 'none'].includes(persist)) {
      throw new EmbedVerificationError('missing_params', `Unknown persist mode: ${persist}`)
    }

    // Validate apiBase is provided when persist=api
    if (persist === 'api' && !apiBase) {
      throw new EmbedVerificationError('missing_params', 'apiBase required when persist=api')
    }

    // -----------------------------------------------------------------------
    // Step 2: Lookup vendor in registry
    // -----------------------------------------------------------------------
    const vendor = await findVendor(kid)
    if (!vendor) {
      throw new EmbedVerificationError('unknown_vendor', `Unknown vendor: ${kid}`, kid)
    }
    if (vendor.revoked) {
      throw new EmbedVerificationError('revoked', `Vendor certificate revoked: ${kid}`, kid)
    }

    // -----------------------------------------------------------------------
    // Step 3: Parse X.509 certificate
    // -----------------------------------------------------------------------
    const cert = await parsePemCertificate(vendor.certPem)

    // -----------------------------------------------------------------------
    // Step 4: Validate certificate time window
    // -----------------------------------------------------------------------
    const now = Date.now()
    if (now < cert.notBefore.getTime()) {
      throw new EmbedVerificationError('cert_not_yet_valid', 'Certificate not yet valid', kid)
    }
    if (now > cert.notAfter.getTime()) {
      throw new EmbedVerificationError('cert_expired', 'Certificate has expired', kid)
    }

    // -----------------------------------------------------------------------
    // Step 5: Validate URL expiry (with clock skew tolerance)
    // -----------------------------------------------------------------------
    const nowSeconds = Math.floor(now / 1000)
    if (nowSeconds > exp + CLOCK_SKEW_SECONDS) {
      throw new EmbedVerificationError('url_expired', 'Embed URL has expired', kid)
    }
    // Check that the URL doesn't grant a session longer than the cert allows
    if (exp - nowSeconds > cert.maxSessionDuration) {
      throw new EmbedVerificationError(
        'session_too_long',
        `URL expiry exceeds max session duration (${cert.maxSessionDuration}s)`,
        kid
      )
    }

    // -----------------------------------------------------------------------
    // Step 6: Validate routes against certificate
    // -----------------------------------------------------------------------
    let allowedRoutes: string[]
    try {
      allowedRoutes = resolveRoutes(routes, cert.allowedRoutePresets)
    } catch (e) {
      throw new EmbedVerificationError(
        'unauthorized_routes',
        e instanceof Error ? e.message : 'Route resolution failed',
        kid
      )
    }

    // -----------------------------------------------------------------------
    // Step 7: Validate persist mode against certificate
    // -----------------------------------------------------------------------
    if (!cert.persistModes.includes(persist)) {
      throw new EmbedVerificationError(
        'unauthorized_persist',
        `Persist mode "${persist}" not authorized by vendor certificate`,
        kid
      )
    }

    // -----------------------------------------------------------------------
    // Step 8: Verify ECDSA P-256 signature
    // -----------------------------------------------------------------------
    const canonical = buildCanonicalString(params)
    const signatureBytes = base64urlDecode(sig)
    const canonicalBytes = new TextEncoder().encode(canonical)

    const isValid = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      cert.publicKey,
      signatureBytes,
      canonicalBytes
    )

    if (!isValid) {
      throw new EmbedVerificationError('invalid_signature', 'Signature verification failed', kid)
    }

    // -----------------------------------------------------------------------
    // Step 9: Construct EmbedConfig
    // -----------------------------------------------------------------------
    return {
      isEmbedded: true,
      vendorId: cert.subjectO,
      vendorName: cert.subjectCN,
      userId: uid,
      kid,
      nonce,
      expiresAt: exp,
      allowedRoutes,
      persistMode: persist,
      apiBase,
      theme,
      persona,
      allowedOrigins: cert.allowedOrigins,
      allowedRegions: cert.allowedRegions,
      allowedIndustries: cert.allowedIndustries,
      allowedRoles: cert.allowedRoles,
    }
  } catch (e) {
    if (e instanceof EmbedVerificationError) throw e
    throw new EmbedVerificationError(
      'verification_error',
      e instanceof Error ? e.message : 'Unknown verification error',
      kid
    )
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build the canonical string for signature verification.
 *
 * PRD §4.3: collect all params except `sig`, sort alphabetically by key,
 * join as key=value pairs separated by &. Values are NOT URL-encoded.
 */
function buildCanonicalString(params: URLSearchParams): string {
  const entries: [string, string][] = []

  for (const [key, value] of params.entries()) {
    if (key === 'sig') continue
    entries.push([key, value])
  }

  entries.sort(([a], [b]) => a.localeCompare(b))

  return entries.map(([k, v]) => `${k}=${v}`).join('&')
}
