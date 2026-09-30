// SPDX-License-Identifier: GPL-3.0-only
/**
 * wasm-scan — read what a shipped .wasm binary says it is built from.
 *
 * The SBOM's Rust rows used to be hand-typed and had drifted from the binary
 * in both directions (crates listed that were never compiled in, dozens of
 * compiled-in crates unlisted). A Rust build leaves the crate directory and
 * version of every crate that contains a panic/assert path inside the wasm
 * data section (`registry/src/<index>/<crate>-<version>/src/...`), so the
 * binary itself is the evidence. Nothing here reads a lockfile or a doc.
 *
 * Limits, stated so callers do not over-trust it: a crate that compiled with
 * no panic path leaves no string and is invisible to this scan; vendored
 * forks (`fips204-patched/src/...`) leave a directory name but no version.
 */
import { readFileSync } from 'node:fs'

const REGISTRY_RE = /registry\/src\/[^/\0\s]+\/([A-Za-z0-9_.+-]+)\//g
const FORK_RE = /(?:^|[^A-Za-z0-9_-])([a-z0-9][a-z0-9_-]*-(?:patched|multi))\/src\//g
const NAME_VERSION_RE = /^(.+?)-(\d+\.\d+\.\d+.*)$/

/** Latin-1 view: wasm data is bytes, paths are ASCII, and this never throws. */
function text(bufOrPath) {
  const buf = typeof bufOrPath === 'string' ? readFileSync(bufOrPath) : bufOrPath
  return buf.toString('latin1')
}

/** @returns {{ crates: Record<string,string[]>, forks: string[] }} sorted, de-duplicated */
export function scanRustWasm(bufOrPath) {
  const s = text(bufOrPath)
  const crates = {}
  for (const m of s.matchAll(REGISTRY_RE)) {
    const nv = NAME_VERSION_RE.exec(m[1])
    if (!nv) continue
    ;(crates[nv[1]] ??= new Set()).add(nv[2])
  }
  const forks = new Set()
  for (const m of s.matchAll(FORK_RE)) forks.add(m[1])
  return {
    crates: Object.fromEntries(
      Object.keys(crates)
        .sort()
        .map((k) => [k, [...crates[k]].sort()])
    ),
    forks: [...forks].sort(),
  }
}

/**
 * First `<label> X.Y.Z` string a binary embeds, e.g. "OpenSSL 3.6.3 9 Jun 2026".
 * `pattern` must capture the version in group 1. Returns null if absent.
 */
export function scanEmbeddedVersion(bufOrPath, pattern) {
  const m = pattern.exec(text(bufOrPath))
  return m ? m[1] : null
}
