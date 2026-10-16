// SPDX-License-Identifier: AGPL-3.0-only
// Types for wasm-scan.mjs (imported by the build config through notices.ts).
export function scanRustWasm(bufOrPath: string | Buffer): {
  crates: Record<string, string[]>
  forks: string[]
}
export function scanEmbeddedVersion(bufOrPath: string | Buffer, pattern: RegExp): string | null
