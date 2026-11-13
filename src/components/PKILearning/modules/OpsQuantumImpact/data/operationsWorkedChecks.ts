// SPDX-License-Identifier: AGPL-3.0-only
/** Local teaching state only. These observations are authored fixtures, not provider responses. */
export interface RewrapItem {
  readonly id: string
  readonly keyName: string
  readonly version: number
}

export const REWRAP_TARGET_VERSION = 2
export const REWRAP_INVENTORY: readonly RewrapItem[] = [
  { id: 'A', keyName: 'sample-app', version: 1 },
  { id: 'B', keyName: 'sample-app', version: 1 },
  { id: 'C', keyName: 'sample-app', version: 2 },
]

export interface RewrapObservation {
  readonly itemId: string
  /** Caller correlation, not an identity inferred from the ciphertext prefix. */
  readonly requestKeyName: string
  readonly outcome: 'success' | 'failure'
  readonly response?: unknown
}

function ciphertextVersion(response: unknown): number | undefined {
  if (typeof response !== 'object' || response === null || !('data' in response)) return
  const data = response.data
  if (typeof data !== 'object' || data === null || !('ciphertext' in data)) return
  if (typeof data.ciphertext !== 'string') return
  // Inspect the documented version prefix only; this does not authenticate ciphertext bytes.
  const match = /^vault:v([1-9]\d*):[A-Za-z0-9+/]+={0,2}$/.exec(data.ciphertext)
  if (!match) return
  const version = Number(match[1])
  return Number.isSafeInteger(version) ? version : undefined
}

/** Apply one caller-correlated observation to the fixed, same-key, version-2 teaching inventory. */
export function applyRewrapObservation(
  inventory: readonly RewrapItem[],
  observation: RewrapObservation
): { readonly inventory: readonly RewrapItem[]; readonly message: string } {
  const item = inventory.find((entry) => entry.id === observation.itemId)
  if (!item || item.keyName !== observation.requestKeyName) {
    return { inventory, message: 'Unknown item or wrong request key: no completion credit.' }
  }
  if (observation.outcome !== 'success') {
    return {
      inventory,
      message: `${item.id}: operation failed; keep its previous version and retry.`,
    }
  }
  if (ciphertextVersion(observation.response) !== REWRAP_TARGET_VERSION) {
    return { inventory, message: 'Missing, malformed or unexpected version: no completion credit.' }
  }
  if (item.version === REWRAP_TARGET_VERSION) {
    return {
      inventory,
      message: `${item.id}: duplicate observation; no additional completion credit.`,
    }
  }
  return {
    inventory: inventory.map((entry) =>
      entry.id === item.id ? { ...entry, version: REWRAP_TARGET_VERSION } : entry
    ),
    message: `${item.id}: recorded at version 2 in this authored observation ledger.`,
  }
}

export function rewrapCounts(inventory: readonly RewrapItem[]) {
  const confirmed = inventory.filter((item) => item.version === REWRAP_TARGET_VERSION).length
  return { confirmed, remaining: inventory.length - confirmed }
}

export interface ModeledKeyGenerationResponse {
  readonly result: 'success' | 'error'
  readonly custody?: 'hsm' | 'software'
  readonly privateKeyHandle?: number
  readonly auditRecorded?: boolean
}

/** The existing example requires HSM custody. An audit record never changes that requirement. */
export function evaluateModeledKeyGeneration(response: ModeledKeyGenerationResponse): {
  readonly state: 'pending' | 'refused' | 'complete'
  readonly reason: string
} {
  if (response.result === 'error') {
    return {
      state: 'pending',
      reason: 'Generation failed. The HSM-required request remains pending.',
    }
  }
  if (response.custody === 'software') {
    return {
      state: 'refused',
      reason:
        'A software key does not satisfy this HSM-required request, even with an audit record.',
    }
  }
  if (
    response.custody !== 'hsm' ||
    !Number.isSafeInteger(response.privateKeyHandle) ||
    (response.privateKeyHandle ?? 0) <= 0
  ) {
    return { state: 'pending', reason: 'No successful HSM key handle: keep the request pending.' }
  }
  return {
    state: 'complete',
    reason:
      'Modeled new-key request complete. This does not recover an old key or demonstrate hardware failover.',
  }
}
