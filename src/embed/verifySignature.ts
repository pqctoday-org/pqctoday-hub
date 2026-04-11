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
 *   6. Validate routes against certificate policy
 *   7. Validate persist mode against certificate policy
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
  | 'unauthorized_module'
  | 'unauthorized_tool'
  | 'unauthorized_persist'
  | 'invalid_signature'
  | 'verification_error'

export class EmbedVerificationError extends Error {
  readonly code: EmbedErrorCode
  readonly kid?: string
  constructor(code: EmbedErrorCode, message: string, kid?: string) {
    super(message)
    this.name = 'EmbedVerificationError'
    this.code = code
    this.kid = kid
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
    const persist = params.get('persist')! as 'postMessage' | 'none'
    const sig = params.get('sig')!
    const theme = (params.get('theme') as 'dark' | 'light' | undefined) ?? undefined
    const personaParam = params.get('persona') ?? undefined
    const assistantParam = params.get('assistant') ?? undefined

    // Validate nonce length (min 16 chars as per PRD)
    if (nonce.length < 16) {
      throw new EmbedVerificationError('missing_params', 'Nonce must be at least 16 characters')
    }

    // Validate persist mode is a known value
    if (!['postMessage', 'none'].includes(persist)) {
      throw new EmbedVerificationError('missing_params', `Unknown persist mode: ${persist}`)
    }

    // -----------------------------------------------------------------------
    // Step 2: Lookup vendor in registry
    // In dev mode, the SDK test site may pass the cert inline as ?cert=<base64>
    // so we don't need cross-origin localStorage.
    // -----------------------------------------------------------------------
    let vendor = await findVendor(kid)

    if (!vendor && import.meta.env.DEV) {
      const inlineCert = params.get('cert')
      if (inlineCert) {
        try {
          const certPem = atob(inlineCert)
          vendor = {
            kid,
            vendorId: 'SDK Preview',
            vendorName: 'SDK Preview',
            certPem,
            revoked: false,
            isTest: true,
          }
        } catch {
          // malformed base64 — fall through to unknown_vendor
        }
      }
    }

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
    if (exp - nowSeconds > cert.policy.session.maxDuration) {
      throw new EmbedVerificationError(
        'session_too_long',
        `URL expiry exceeds max session duration (${cert.policy.session.maxDuration}s)`,
        kid
      )
    }

    // -----------------------------------------------------------------------
    // Step 6: Validate routes against certificate policy
    // -----------------------------------------------------------------------
    let allowedRoutes: string[]
    try {
      allowedRoutes = resolveRoutes(routes, cert.policy.routes.presets)
    } catch (e) {
      throw new EmbedVerificationError(
        'unauthorized_routes',
        e instanceof Error ? e.message : 'Route resolution failed',
        kid
      )
    }

    // Validate current path against module/tool restrictions if present
    const pathname = url.pathname
    if (cert.policy.routes.modules) {
      validateModulePath(pathname, cert.policy.routes.modules, kid)
    }
    if (cert.policy.routes.tools) {
      validateToolPath(pathname, cert.policy.routes.tools, kid)
    }

    // -----------------------------------------------------------------------
    // Step 7: Validate persist mode against certificate policy
    // -----------------------------------------------------------------------
    if (!cert.policy.session.persistModes.includes(persist)) {
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
      signatureBytes.buffer as ArrayBuffer,
      canonicalBytes.buffer as ArrayBuffer
    )

    if (!isValid) {
      throw new EmbedVerificationError('invalid_signature', 'Signature verification failed', kid)
    }

    // -----------------------------------------------------------------------
    // Step 9: Construct EmbedConfig
    // -----------------------------------------------------------------------

    // Clamp persona URL param to cert-allowed set; fall back to first allowed
    const certPersonas = cert.policy.content.personas
    const resolvedPersona = personaParam
      ? !certPersonas || certPersonas.includes(personaParam)
        ? personaParam
        : certPersonas[0]
      : (certPersonas?.[0] ?? personaParam)

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
      theme,
      persona: resolvedPersona,
      allowedOrigins: cert.allowedOrigins,
      policy: {
        ...cert.policy,
        features: {
          ...cert.policy.features,
          assistantEnabled:
            assistantParam === 'false' ? false : cert.policy.features.assistantEnabled,
        },
      },
      allowedModules: cert.policy.routes.modules,
      allowedTools: cert.policy.routes.tools,
      allowedPersonas: cert.policy.content.personas,
      allowedRegions: cert.policy.content.regions,
      allowedIndustries: cert.policy.content.industries,
      isTestMode: vendor.isTest || false,
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
// Module / tool path validators
// ---------------------------------------------------------------------------

/**
 * If the current path is under /learn/, verify the module ID is in the allowed list.
 * No-op for paths outside /learn/.
 */
function validateModulePath(pathname: string, allowedModules: string[], kid?: string): void {
  const LEARN_PREFIX = '/learn/'
  if (!pathname.startsWith(LEARN_PREFIX)) return
  const moduleId = pathname.slice(LEARN_PREFIX.length).split('/')[0]
  if (moduleId && !allowedModules.includes(moduleId)) {
    throw new EmbedVerificationError(
      'unauthorized_module',
      `Module "${moduleId}" not authorized by vendor certificate`,
      kid
    )
  }
}

/**
 * If the current path is under /playground/ or /business/tools/, verify the
 * tool ID is in the allowed list. No-op for paths outside these prefixes.
 */
function validateToolPath(pathname: string, allowedTools: string[], kid?: string): void {
  const PLAYGROUND_PREFIX = '/playground/'
  const BUSINESS_PREFIX = '/business/tools/'

  let toolId: string | undefined
  if (pathname.startsWith(PLAYGROUND_PREFIX)) {
    toolId = pathname.slice(PLAYGROUND_PREFIX.length).split('/')[0]
  } else if (pathname.startsWith(BUSINESS_PREFIX)) {
    toolId = pathname.slice(BUSINESS_PREFIX.length).split('/')[0]
  }

  if (toolId && !allowedTools.includes(toolId)) {
    throw new EmbedVerificationError(
      'unauthorized_tool',
      `Tool "${toolId}" not authorized by vendor certificate`,
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

  // 'sig' is the signature itself; 'ind' and 'cert' are post-verification secondary params
  const EXCLUDED = new Set(['sig', 'ind', 'cert'])
  for (const [key, value] of params.entries()) {
    if (EXCLUDED.has(key)) continue
    entries.push([key, value])
  }

  entries.sort(([a], [b]) => a.localeCompare(b))

  return entries.map(([k, v]) => `${k}=${v}`).join('&')
}
