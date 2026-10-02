// SPDX-License-Identifier: GPL-3.0-only
/**
 * Token scenarios for the workshop's attack lab. Each one is a real ML-DSA-65
 * JWS (or a forgery derived from one) aimed at the same API, so the lab can
 * run the strict validator and the naive verifier side by side.
 */
import {
  base64urlEncode,
  createJWTPayload,
  generateJwsKeyPair,
  type JwsKeyPair,
  signJWS,
} from './jwtUtils'
import type { CheckId, ValidationPolicy } from './jwtValidation'

export const LAB_ALG = 'ML-DSA-65' as const
export const LAB_ISSUER = 'https://auth.example.com'
export const LAB_AUDIENCE = 'https://api.example.com'
/** RFC 9068 access tokens carry "typ": "at+jwt". */
export const LAB_TYP = 'at+jwt'

export type ScenarioId =
  'legit' | 'alg-none' | 'tampered' | 'wrong-audience' | 'expired' | 'wrong-type'

export interface Scenario {
  id: ScenarioId
  title: string
  attack: string
  token: string
  /** The check the strict validator must fail at; null = must accept. */
  expectedFailure: CheckId | null
  /** Whether the naive verifier is fooled (accepts). */
  naiveAccepts: boolean
}

export function labPolicy(publicKey: Uint8Array, now: number): ValidationPolicy {
  return {
    alg: LAB_ALG,
    publicKey,
    issuer: LAB_ISSUER,
    audience: LAB_AUDIENCE,
    typ: LAB_TYP,
    now,
  }
}

export async function generateLabKey(): Promise<JwsKeyPair> {
  return generateJwsKeyPair({ alg: LAB_ALG, backend: 'noble' })
}

export async function buildScenarios(keyPair: JwsKeyPair, now: number): Promise<Scenario[]> {
  const claims = {
    iss: LAB_ISSUER,
    sub: 'alice',
    aud: LAB_AUDIENCE,
    iat: now - 60,
    exp: now + 600,
    scope: 'orders:read',
  }
  const sign = async (payload: Record<string, unknown>, typ = LAB_TYP) =>
    (
      await signJWS({
        alg: LAB_ALG,
        header: { typ },
        payload,
        keyPair,
        backend: 'noble',
      })
    ).token

  const legit = await sign(claims)
  const escalated = { ...claims, scope: 'orders:admin' }

  // "alg": "none" — an unsigned token claiming more privilege (RFC 7519 §6).
  const noneHeader = base64urlEncode(
    new TextEncoder().encode(JSON.stringify({ alg: 'none', typ: LAB_TYP }))
  )
  const algNone = `${noneHeader}.${createJWTPayload(escalated)}.`

  // Same signature, edited claims.
  const [h, , s] = legit.split('.')
  const tampered = `${h}.${createJWTPayload(escalated)}.${s}`

  return [
    {
      id: 'legit',
      title: 'Legitimate access token',
      attack: 'Baseline: a valid token, issued for this API, signed with ML-DSA-65.',
      token: legit,
      expectedFailure: null,
      naiveAccepts: true,
    },
    {
      id: 'alg-none',
      title: '"alg": "none"',
      attack:
        'The attacker drops the signature, sets "alg" to "none" and raises its scope to orders:admin.',
      token: algNone,
      expectedFailure: 'alg',
      naiveAccepts: true,
    },
    {
      id: 'tampered',
      title: 'Edited claims, original signature',
      attack:
        'The attacker keeps the real ML-DSA-65 signature but edits the claims to scope orders:admin.',
      token: tampered,
      expectedFailure: 'signature',
      naiveAccepts: false,
    },
    {
      id: 'wrong-audience',
      title: 'Token for another API',
      attack:
        'A genuine token the same issuer minted for the billing API is replayed against this API.',
      token: await sign({ ...claims, aud: 'https://billing.example.com' }),
      expectedFailure: 'aud',
      naiveAccepts: true,
    },
    {
      id: 'expired',
      title: 'Expired token',
      attack: 'A genuine token that expired an hour ago, e.g. lifted from an old log.',
      token: await sign({ ...claims, iat: now - 7200, exp: now - 3600 }),
      expectedFailure: 'exp',
      naiveAccepts: true,
    },
    {
      id: 'wrong-type',
      title: 'ID token used as an access token',
      attack:
        'A genuine OpenID Connect ID token ("typ": "JWT") from the same issuer is presented as an access token.',
      token: await sign(claims, 'JWT'),
      expectedFailure: 'typ',
      naiveAccepts: true,
    },
  ]
}
