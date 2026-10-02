// SPDX-License-Identifier: GPL-3.0-only
/**
 * JWT validation for the workshop's attack lab.
 *
 * `validateJwt` is the recipient side RFC 8725 (JWT BCP) asks for: the
 * algorithm is pinned to the key, never read from the token (§3.1, §2.1); the
 * signature is verified under that key; then the claims are checked — issuer,
 * audience (§3.9), expiry and not-before (RFC 7519 §4.1.4/§4.1.5) and, when
 * the policy names one, explicit typing (§3.11, e.g. "at+jwt" per RFC 9068).
 * Swapping ML-DSA in for RS256/ES256 changes none of this.
 *
 * `naiveVerify` is the ANTI-PATTERN, kept only so the lab can show what goes
 * wrong: it trusts the token's own "alg" (so "none" means "no signature
 * needed") and checks no claims. It is not used anywhere outside the lab.
 */
import { base64urlDecode, type JwsAlg, verifyJWS } from './jwtUtils'

export interface ValidationPolicy {
  /** The only algorithm accepted for this key. */
  alg: JwsAlg
  publicKey: Uint8Array
  issuer: string
  audience: string
  /** Expected "typ" header, e.g. "at+jwt" (RFC 9068); omitted = not checked. */
  typ?: string
  /** Seconds since the epoch; defaults to the current time. */
  now?: number
  clockSkewSec?: number
}

export type CheckId = 'format' | 'alg' | 'typ' | 'signature' | 'iss' | 'aud' | 'exp' | 'nbf'

export interface ValidationCheck {
  id: CheckId
  label: string
  passed: boolean
  detail: string
}

export interface ValidationResult {
  valid: boolean
  /** Checks in the order they ran; validation stops at the first failure. */
  checks: ValidationCheck[]
  header: Record<string, unknown>
  payload: Record<string, unknown>
}

function decodePart(b64: string): Record<string, unknown> | null {
  try {
    const v: unknown = JSON.parse(
      new TextDecoder('utf-8', { fatal: true }).decode(base64urlDecode(b64))
    )
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
  } catch {
    return null
  }
}

export async function validateJwt(
  token: string,
  policy: ValidationPolicy
): Promise<ValidationResult> {
  const checks: ValidationCheck[] = []
  const done = (header: Record<string, unknown>, payload: Record<string, unknown>) => ({
    valid: checks.every((c) => c.passed),
    checks,
    header,
    payload,
  })
  const add = (id: CheckId, label: string, passed: boolean, detail: string) => {
    checks.push({ id, label, passed, detail })
    return passed
  }

  const parts = token.split('.')
  const header = parts.length === 3 ? decodePart(parts[0]) : null
  const payload = parts.length === 3 ? decodePart(parts[1]) : null
  if (
    !add(
      'format',
      'Compact JWS with JSON header and claims',
      header !== null && payload !== null,
      header && payload ? '3 parts, both decode to JSON objects' : 'not a well-formed compact JWS'
    )
  ) {
    return done(header ?? {}, payload ?? {})
  }
  const h = header as Record<string, unknown>
  const p = payload as Record<string, unknown>

  if (
    !add(
      'alg',
      'Algorithm pinned to the key (RFC 8725 §3.1)',
      h.alg === policy.alg,
      h.alg === policy.alg
        ? `"alg" is ${policy.alg}, the only algorithm this key accepts`
        : `token says "alg": ${JSON.stringify(h.alg)}, but this key only accepts ${policy.alg}`
    )
  ) {
    return done(h, p)
  }

  if (policy.typ !== undefined) {
    const ok = typeof h.typ === 'string' && h.typ.toLowerCase() === policy.typ.toLowerCase()
    if (
      !add(
        'typ',
        'Explicit type (RFC 8725 §3.11)',
        ok,
        ok ? `"typ" is ${policy.typ}` : `expected "typ" ${policy.typ}, got ${JSON.stringify(h.typ)}`
      )
    ) {
      return done(h, p)
    }
  }

  const { valid } = await verifyJWS({ token, publicKey: policy.publicKey, backend: 'noble' })
  if (
    !add(
      'signature',
      `Signature verifies under the pinned ${policy.alg} key`,
      valid,
      valid
        ? 'header and claims are exactly what the issuer signed'
        : 'signature does not verify — the token was altered or signed by another key'
    )
  ) {
    return done(h, p)
  }

  if (
    !add(
      'iss',
      'Issuer is the expected one',
      p.iss === policy.issuer,
      p.iss === policy.issuer
        ? `iss = ${policy.issuer}`
        : `iss is ${JSON.stringify(p.iss)}, expected ${policy.issuer}`
    )
  ) {
    return done(h, p)
  }

  const aud = Array.isArray(p.aud) ? p.aud : [p.aud]
  if (
    !add(
      'aud',
      'Audience includes this API (RFC 8725 §3.9)',
      aud.includes(policy.audience),
      aud.includes(policy.audience)
        ? `aud contains ${policy.audience}`
        : `aud is ${JSON.stringify(p.aud)}; this API is ${policy.audience}`
    )
  ) {
    return done(h, p)
  }

  const now = policy.now ?? Math.floor(Date.now() / 1000)
  const skew = policy.clockSkewSec ?? 60
  const expOk = typeof p.exp === 'number' && now < p.exp + skew
  if (
    !add(
      'exp',
      'Not expired',
      expOk,
      typeof p.exp !== 'number'
        ? 'no numeric "exp" claim'
        : expOk
          ? `expires in ${p.exp - now} s`
          : `expired ${now - p.exp} s ago`
    )
  ) {
    return done(h, p)
  }

  if (p.nbf !== undefined) {
    const nbfOk = typeof p.nbf === 'number' && now + skew >= p.nbf
    add(
      'nbf',
      'Already valid ("nbf")',
      nbfOk,
      nbfOk ? 'nbf is in the past' : 'token is not valid yet'
    )
  }

  return done(h, p)
}

/** The anti-pattern: trust the header, check nothing else. See the file header. */
export async function naiveVerify(
  token: string,
  publicKey: Uint8Array
): Promise<{ accepted: boolean; reason: string }> {
  const parts = token.split('.')
  const header = parts.length === 3 ? decodePart(parts[0]) : null
  if (!header) return { accepted: false, reason: 'could not parse the token' }
  if (typeof header.alg === 'string' && header.alg.toLowerCase() === 'none') {
    return { accepted: true, reason: 'header says "alg": "none", so it skipped the signature' }
  }
  const { valid } = await verifyJWS({ token, publicKey, backend: 'noble' })
  return valid
    ? { accepted: true, reason: 'signature verified; no claims were checked' }
    : { accepted: false, reason: 'signature did not verify' }
}
