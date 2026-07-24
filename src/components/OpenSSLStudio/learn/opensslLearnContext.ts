// SPDX-License-Identifier: GPL-3.0-only
//
// opensslLearnContext — what a lesson step runs against. Two implementations
// share this one interface so the SAME lesson step code (opensslLessons.ts)
// runs in the browser (OpenSslLearnView, via the shared useOpenSSL() worker)
// and in Node (opensslLessons.local.test.ts, via src/test/kat/openssl-driver.ts)
// — mirroring TpmLearnContext / the PKCS#11 lesson runner's own
// browser/Node duality, so the curriculum can't silently drift from the
// engine it claims to demonstrate.

export interface OpenSslRunResult {
  /** Combined stdout+stderr lines the command printed (LOG stream in the
   * browser; captured print/printErr in the Node driver). */
  stdout: string
}

export interface OpenSslLearnContext {
  /** Run one `openssl ...` command line against the shared virtual
   * filesystem. Rejects with the real error text on nonzero exit —
   * `expect: 'refusal'` steps rely on this throwing. */
  run: (cmd: string) => Promise<OpenSslRunResult>
  /** Read back a file the current or a prior step wrote, by name. */
  readFile: (name: string) => Uint8Array | undefined
  /** Seed an input file directly (mirrors typing into the Studio's File
   * Editor) — NOT a command execution, for lessons that need literal
   * content (e.g. a config file) rather than another command's output. */
  writeFile: (name: string, content: string | Uint8Array) => void
}
