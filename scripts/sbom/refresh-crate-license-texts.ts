// SPDX-License-Identifier: GPL-3.0-only
/**
 * refresh-crate-license-texts — LOCAL ONLY (needs the cargo registry the Rust wasm was built
 * from, and the sibling pqctoday-hsm checkout for the vendored forks).
 *
 * Copies the licence files (LICENSE*, LICENCE*, COPYING*, NOTICE*, UNLICENSE, COPYRIGHT*) of
 * every Rust crate compiled into the shipped wasm bundles into
 * src/data/licenses/crateLicenseTexts.json, deduplicated by content. The site's licence
 * notices (/licenses/) are generated from that file at build time, so the build itself
 * never needs the registry. Which crates and versions to copy is read from
 * src/data/sbomCrateLicenses.json and src/data/sbomRustLock.json, which
 * `gen:sbom-versions:check` already keeps in step with the binaries.
 *
 *   npm run sbom:refresh-crate-license-texts
 */
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const REGISTRY = join(homedir(), '.cargo', 'registry', 'src')
const HSM = process.env.HSM_REPO_PATH ?? join(ROOT, '..', 'pqctoday-hsm')
export const LICENSE_FILE = /^(LICEN[CS]E|COPYING|NOTICE|UNLICENSE|COPYRIGHT)([-._].*)?$/i

const sha = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16)

if (!existsSync(REGISTRY)) {
  console.error(`✗ ${REGISTRY} not found — build the Rust bundles on this machine first`)
  process.exit(1)
}
const indexes = readdirSync(REGISTRY).map((d) => join(REGISTRY, d))
const licenses = JSON.parse(
  readFileSync(join(ROOT, 'src/data/sbomCrateLicenses.json'), 'utf8')
) as { crates: Record<string, Record<string, string>> }
const rustLock = JSON.parse(readFileSync(join(ROOT, 'src/data/sbomRustLock.json'), 'utf8')) as {
  commit: string
  forks: Record<string, { crate: string; version: string; license: string }>
  unscannable: Record<string, { versions: string[]; license: string }>
}

const texts: Record<string, string> = {}
const crates: Record<string, { license: string; source: string; files: Record<string, string> }> =
  {}
const missing: string[] = []
const keep = (text: string) => {
  const h = sha(text)
  texts[h] = text
  return h
}

function fromRegistry(name: string, version: string, license: string) {
  const dir = indexes.map((i) => join(i, `${name}-${version}`)).find((d) => existsSync(d))
  if (!dir) return missing.push(`${name}@${version} (not in the local registry)`)
  const files: Record<string, string> = {}
  for (const f of readdirSync(dir).sort())
    if (LICENSE_FILE.test(f) && statSync(join(dir, f)).isFile())
      files[f] = keep(readFileSync(join(dir, f), 'utf8'))
  crates[`${name}@${version}`] = { license, source: `crates.io ${name} ${version}`, files }
}

for (const [name, byVersion] of Object.entries(licenses.crates))
  for (const [version, license] of Object.entries(byVersion)) fromRegistry(name, version, license)
for (const [name, entry] of Object.entries(rustLock.unscannable))
  for (const version of entry.versions) fromRegistry(name, version, entry.license)

// Vendored forks: their licence files at the engine's build commit in pqctoday-hsm.
const git = (...args: string[]) => execFileSync('git', ['-C', HSM, ...args], { encoding: 'utf8' })
for (const [dir, fork] of Object.entries(rustLock.forks)) {
  let listing: string[] = []
  try {
    listing = git('ls-tree', '--name-only', `${rustLock.commit}:rust/${dir}`).split('\n')
  } catch {
    missing.push(`${fork.crate} (fork rust/${dir} not readable in ${HSM} at ${rustLock.commit})`)
    continue
  }
  const files: Record<string, string> = {}
  for (const f of listing.filter((x) => LICENSE_FILE.test(x)).sort())
    files[f] = keep(git('show', `${rustLock.commit}:rust/${dir}/${f}`))
  crates[`${fork.crate}@${fork.version}`] = {
    license: fork.license,
    source: `pqctoday-org/pqctoday-hsm rust/${dir} @ ${rustLock.commit} (modified copy)`,
    files,
  }
}

if (missing.length) {
  console.error(`✗ could not read:\n  ${missing.join('\n  ')}`)
  process.exit(1)
}
const out = join(ROOT, 'src/data/licenses/crateLicenseTexts.json')
writeFileSync(
  out,
  JSON.stringify(
    {
      _comment:
        'Licence files of every Rust crate compiled into the shipped wasm bundles, copied from each crate as published (forks: from pqctoday-hsm at the build commit). Refresh with `npm run sbom:refresh-crate-license-texts` (local only) after `npm run sbom:refresh-crate-licenses`. A crate with no file here ships no licence file of its own; the notices then use the standard text of its declared licence.',
      commit: rustLock.commit,
      crates: Object.fromEntries(Object.entries(crates).sort(([a], [b]) => a.localeCompare(b))),
      texts: Object.fromEntries(Object.entries(texts).sort(([a], [b]) => a.localeCompare(b))),
    },
    null,
    2
  ) + '\n'
)
const empty = Object.entries(crates).filter(([, c]) => Object.keys(c.files).length === 0)
console.log(
  `wrote ${out} — ${Object.keys(crates).length} crates, ${Object.keys(texts).length} distinct texts; ${empty.length} crates ship no licence file: ${empty.map(([k]) => k).join(', ')}`
)
