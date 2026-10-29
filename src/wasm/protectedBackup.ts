// SPDX-License-Identifier: AGPL-3.0-only
// Public metadata and existing encrypted replication packages only.
export interface ProtectedKeyResult {
  readonly public_handle: number
  readonly private_handle: number
  readonly key_type: number
  readonly parameter_set: number
  readonly session_handle: number
  readonly receipt: Uint8Array
  free(): void
}

export interface ProtectedBackupSession {
  generate(algorithm: number): ProtectedKeyResult
  backup(key: number, seed: boolean): Uint8Array
  recover(packageBytes: Uint8Array): ProtectedKeyResult
  free(): void
}

interface BackupBindings {
  pqctodaySelectEducationalReplicationProfile(): void
  ProtectedBackupLab: new (soPin: string, userPin: string) => ProtectedBackupSession
}

export async function loadProtectedBackupBindings(): Promise<BackupBindings> {
  const bindings = (await import('./softhsmrustv3.js')) as unknown as Partial<BackupBindings>
  if (
    typeof bindings.pqctodaySelectEducationalReplicationProfile !== 'function' ||
    typeof bindings.ProtectedBackupLab !== 'function'
  ) {
    throw new Error('Protected backup is unavailable in this engine build.')
  }
  return bindings as BackupBindings
}

const FORMAT = 'PQCTODAY_KEY_REPLICATION_1_0'
const MAX_PACKAGE_BYTES = 256 * 1024

export function encodeProtectedBackup(packageBytes: Uint8Array): string {
  return JSON.stringify({
    format: FORMAT,
    packageHex: Array.from(packageBytes, (b) => b.toString(16).padStart(2, '0')).join(''),
  })
}

export function decodeProtectedBackup(text: string): Uint8Array {
  if (text.length > MAX_PACKAGE_BYTES * 2 + 1024) throw new Error('Backup file is too large.')
  const value: unknown = JSON.parse(text)
  if (!value || typeof value !== 'object' || !('format' in value) || value.format !== FORMAT) {
    throw new Error(
      'Use a protected replication export. Legacy prefix-based Seed files cannot be recovered here.'
    )
  }
  const hex = 'packageHex' in value ? value.packageHex : undefined
  if (
    typeof hex !== 'string' ||
    !/^(?:[0-9a-fA-F]{2})+$/.test(hex) ||
    hex.length > MAX_PACKAGE_BYTES * 2
  ) {
    throw new Error('The protected package must contain complete hexadecimal bytes.')
  }
  // Format labels never authorize or describe a recovered key. The engine
  // validates the signed/encrypted DER and returns the actual key metadata.
  return Uint8Array.from(hex.match(/../g)!, (b) => parseInt(b, 16))
}
