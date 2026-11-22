// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection -- indexes a byte array and a map of file names the tool returned */
/**
 * Runs one OpenSSL command in the browser through the Hub's shared OpenSSL service and returns the
 * files it wrote. Nothing is computed here: every byte shown in the workshop is what the tool returned.
 */
import { openSSLService } from '@/services/crypto/OpenSSLService'
import { bytesToHex } from '@noble/hashes/utils.js'

export type FileMap = Record<string, Uint8Array>

export async function runOpenssl(
  command: string,
  inputs: { name: string; data: Uint8Array }[] = []
): Promise<FileMap> {
  const result = await openSSLService.execute(command, inputs)
  const files: FileMap = {}
  for (const f of result.files) files[f.name] = f.data
  return files
}

/**
 * The service rejects with "OpenSSL exited with status N" when the command itself returns a
 * failure, which is how a failed verification arrives. Start-up failures are worded differently.
 */
export function isCommandFailure(err: unknown): boolean {
  return err instanceof Error && err.message.startsWith('OpenSSL exited with status')
}

export const toHex = (bytes: Uint8Array): string => bytesToHex(bytes)

export function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

/** Remove the workshop's files from the shared OpenSSL file system (private keys included). */
export function removeFiles(names: string[]): void {
  for (const n of names) void openSSLService.deleteFile(n)
}
