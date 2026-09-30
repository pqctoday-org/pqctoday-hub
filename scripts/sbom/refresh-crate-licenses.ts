// SPDX-License-Identifier: GPL-3.0-only
/**
 * refresh-crate-licenses — LOCAL ONLY (needs the cargo registry the wasm was built from).
 *
 * Reads the `license` field of every crate@version found inside the shipped Rust wasm
 * bundles from that crate's own Cargo.toml in ~/.cargo/registry, and writes
 * src/data/sbomCrateLicenses.json. CI never runs this: it only checks that every scanned
 * crate@version has an entry (scripts/sbom/derive.ts), so a new crate cannot ship without
 * someone running this and reviewing the diff.
 *
 *   npm run sbom:refresh-crate-licenses
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { scanRustWasm } from './wasm-scan.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const REGISTRY = join(homedir(), '.cargo', 'registry', 'src')
const BUNDLES = [
  'public/wasm/rust/softhsmrustv3_bg.wasm',
  'public/wasm/rust-kmip/pqctoday_kmip_wasm_bg.wasm',
]

if (!existsSync(REGISTRY)) {
  console.error(`✗ ${REGISTRY} not found — build the Rust bundles on this machine first`)
  process.exit(1)
}
const indexes = readdirSync(REGISTRY).map((d) => join(REGISTRY, d))

const wanted = new Map<string, Set<string>>()
for (const b of BUNDLES)
  for (const [name, versions] of Object.entries(scanRustWasm(join(ROOT, b)).crates))
    for (const v of versions) (wanted.get(name) ?? wanted.set(name, new Set()).get(name)!).add(v)

const out: Record<string, Record<string, string>> = {}
const missing: string[] = []
for (const name of [...wanted.keys()].sort()) {
  for (const version of [...wanted.get(name)!].sort()) {
    let license: string | undefined
    for (const idx of indexes) {
      const manifest = join(idx, `${name}-${version}`, 'Cargo.toml')
      if (existsSync(manifest)) {
        license = /^license\s*=\s*"([^"]+)"/m.exec(readFileSync(manifest, 'utf8'))?.[1]
        break
      }
    }
    if (license) (out[name] ??= {})[version] = license
    else missing.push(`${name}@${version}`)
  }
}
if (missing.length) {
  console.error(`✗ no license field found in the local registry for: ${missing.join(', ')}`)
  process.exit(1)
}
const file = join(ROOT, 'src', 'data', 'sbomCrateLicenses.json')
writeFileSync(
  file,
  JSON.stringify(
    {
      _comment:
        "License of every crate@version compiled into the shipped Rust wasm bundles, read from that crate's own Cargo.toml by `npm run sbom:refresh-crate-licenses` (local only). `gen:sbom-versions:check` fails if a crate found in a bundle has no entry here. Forks and crates a binary scan cannot see are in sbomRustLock.json.",
      crates: out,
    },
    null,
    2
  ) + '\n'
)
console.log(`wrote ${file} — ${Object.keys(out).length} crates`)
