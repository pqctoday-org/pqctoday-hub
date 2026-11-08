// SPDX-License-Identifier: AGPL-3.0-only
import type { CryptoProvider } from './crypto-provider'
import type { CryptoKey } from '../types'

function decodeObject(encoded: string): Record<string, unknown> {
  if (!/^[A-Za-z0-9_-]+$/.test(encoded)) throw new Error('Malformed sample JWT payload.')
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  const value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Malformed sample JWT payload.')
  return value
}

/** Match the existing Hub credential's simplified confirmation encoding.
 * The sample stores encoded DER text in x; this is not a production EC JWK parser.
 */
export function sampleHolderMatchesIssuer(key: CryptoKey, issuerJwt: string): boolean {
  try {
    const issuer = decodeObject(issuerJwt.split('.')[1])
    const cnf = issuer.cnf as { jwk?: { x?: string; crv?: string } } | undefined
    const encoded = btoa(String.fromCharCode(...new TextEncoder().encode(key.publicKey)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    return cnf?.jwk?.x === encoded && cnf?.jwk?.crv === key.curve
  } catch {
    return false
  }
}

/** Flat-disclosure checks for the Hub sample, not a full issuer/trust/status verifier. */
export async function verifySampleSdPresentation(
  presentation: string,
  expected: { issuerJwt: string; nonce: string; audience: string },
  key: CryptoKey,
  provider: CryptoProvider,
  onLog?: (line: string) => void
): Promise<void> {
  const split = presentation.lastIndexOf('~')
  if (split < 0) throw new Error('Missing sample key-binding JWT.')
  const prefix = presentation.slice(0, split + 1)
  const segments = prefix.slice(0, -1).split('~')
  if (segments[0] !== expected.issuerJwt)
    throw new Error('Presented issuer JWT differs from the saved sample credential.')
  const kb = presentation.slice(split + 1).split('.')
  if (kb.length !== 3 || kb.some((part) => !part))
    throw new Error('Malformed sample key-binding JWT.')
  const header = decodeObject(kb[0])
  const payload = decodeObject(kb[1])
  if (
    header.typ !== 'kb+jwt' ||
    typeof header.alg !== 'string' ||
    !header.alg ||
    header.alg !== key.algorithm
  )
    throw new Error('Unexpected sample key-binding profile.')
  if (payload.nonce !== expected.nonce || payload.aud !== expected.audience)
    throw new Error('Sample nonce or audience mismatch.')
  if (typeof payload.iat !== 'number' || !Number.isFinite(payload.iat))
    throw new Error('Missing sample issuance time.')
  if (!(await provider.verifySignature(key, kb[2], `${kb[0]}.${kb[1]}`, onLog)))
    throw new Error(
      'Sample holder signature check did not pass. Inspect the operation log for the cause.'
    )
  if (!sampleHolderMatchesIssuer(key, expected.issuerJwt))
    throw new Error('Holder key does not match the saved sample credential confirmation.')
  const issuerParts = segments[0].split('.')
  if (issuerParts.length !== 3) throw new Error('Malformed sample issuer JWT.')
  const issuerPayload = decodeObject(issuerParts[1])
  if (issuerPayload._sd_alg !== 'sha-256' || !Array.isArray(issuerPayload._sd))
    throw new Error('Unsupported sample disclosure profile.')
  const seen = new Set<string>()
  for (const disclosure of segments.slice(1)) {
    if (!disclosure || seen.has(disclosure))
      throw new Error('Missing or duplicate sample disclosure.')
    seen.add(disclosure)
    const digest = await provider.sha256Hash(disclosure, onLog)
    if (!issuerPayload._sd.includes(digest))
      throw new Error('Sample disclosure digest does not match the saved issuer payload.')
  }
  if (payload.sd_hash !== (await provider.sha256Hash(prefix, onLog)))
    throw new Error('Sample SD-hash does not match the presented disclosures.')
}
