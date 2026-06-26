// SPDX-License-Identifier: GPL-3.0-only
/**
 * Encode/decode a migration-plan selection for /migrate URL tokens.
 *
 * Mirrors {@link ./reportShareToken} so a /migrate link can carry the user's
 * product selection (plan assets + chosen products) to a colleague, instead of
 * the selection living only in their own browser's localStorage.
 *
 * The store keeps `choice` as product *names* (display strings, drift-prone), so
 * we encode/decode through stable `productId` slugs — the same id the rest of the
 * app keys on. Holds IDs only: no org names, asset names, or free text.
 *
 * Encoding: JSON → UTF-8 → base64url (URL-safe, no padding).
 */
import { softwareData } from '@/data/migrateData'

export interface MigrateShareSchema {
  /** Schema version — bump if fields change. */
  v: number
  /** Plan asset ids (from REPLACE_ASSETS) the user added to their plan. */
  plan: string[]
  /** Chosen products per asset/domain, as productId slugs (stable). */
  choice: Record<string, string[]>
}

const SCHEMA_VERSION = 1

const PRODUCT_ID_BY_NAME = new Map<string, string>(
  softwareData.map((s) => [s.softwareName, s.productId])
)
const PRODUCT_NAME_BY_ID = new Map<string, string>(
  softwareData.map((s) => [s.productId, s.softwareName])
)

function toBase64url(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function fromBase64url(str: string): string {
  const padded =
    str.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - (str.length % 4)) % 4)
  return decodeURIComponent(escape(atob(padded)))
}

/** Build a token from the store's current `plan` and name-keyed `choice`. */
export function encodeMigrateShareToken(
  plan: string[],
  choiceByName: Record<string, string[]>
): string {
  const choice: Record<string, string[]> = {}
  for (const [assetId, names] of Object.entries(choiceByName)) {
    const ids = names
      .map((n) => PRODUCT_ID_BY_NAME.get(n))
      .filter((id): id is string => Boolean(id))
    if (ids.length > 0) choice[assetId] = ids
  }
  const schema: MigrateShareSchema = { v: SCHEMA_VERSION, plan, choice }
  return toBase64url(JSON.stringify(schema))
}

/** Decode a token back into store-shaped `plan` + name-keyed `choice`, or null. */
export function decodeMigrateShareToken(
  token: string
): { plan: string[]; choice: Record<string, string[]> } | null {
  try {
    const parsed = JSON.parse(fromBase64url(token)) as MigrateShareSchema
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      parsed.v !== SCHEMA_VERSION ||
      !Array.isArray(parsed.plan) ||
      typeof parsed.choice !== 'object' ||
      parsed.choice === null
    ) {
      return null
    }
    const plan = parsed.plan.filter((id): id is string => typeof id === 'string')
    const choice: Record<string, string[]> = {}
    for (const [assetId, ids] of Object.entries(parsed.choice)) {
      if (!Array.isArray(ids)) continue
      const names = ids
        .map((id) => PRODUCT_NAME_BY_ID.get(id))
        .filter((n): n is string => Boolean(n))
      if (names.length > 0) choice[assetId] = names
    }
    return { plan, choice }
  } catch {
    return null
  }
}
