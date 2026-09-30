// SPDX-License-Identifier: GPL-3.0-only
/**
 * derive — build src/data/sbomVersions.generated.ts and audit the curated SBOM
 * (src/data/sbomComponents.ts) against what this build actually ships.
 *
 * Evidence hierarchy, strongest first:
 *   1. the shipped binary itself (public/wasm/**.wasm): crate paths, embedded
 *      "OpenSSL 3.6.3" / "strongSwan 6.0.5" strings                  -> scan
 *   2. the shipped build record next to a binary (entropy90b/BUILDINFO.json),
 *      whose per-file sha256 is re-checked against the files
 *   3. package.json / package-lock.json for npm packages
 *   4. a committed record pinned by sha256 or commit (sbomWasmArtifacts.json,
 *      sbomRustLock.json) that FAILS the check as soon as the thing it
 *      describes changes
 * Nothing is taken from documentation.
 *
 * The audit is two-way. The old generator only checked "listed => exists",
 * so the page silently fell behind in the other direction (three, react-dom,
 * strongSwan, dozens of compiled-in crates were never listed) and kept rows for
 * crates that were never compiled in (ml-dsa, slh-dsa). Every direction is a
 * failure here.
 */
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { scanEmbeddedVersion, scanRustWasm } from './wasm-scan.mjs'
import type { SbomComponent, SbomGroup } from '../../src/data/sbomComponents'
import { SBOM_CATEGORIES } from '../../src/data/sbomCategories'

export interface Curated {
  groups: readonly SbomGroup[]
  /** package.json dependency -> why it is intentionally not on the page. */
  excluded: Readonly<Record<string, string>>
}

export interface Derived {
  content: string
  problems: string[]
}

/** The two Rust bundles whose crate lists are scanned, keyed as the page labels them. */
const RUST_BUNDLES = {
  engine: 'public/wasm/rust/softhsmrustv3_bg.wasm',
  kmip: 'public/wasm/rust-kmip/pqctoday_kmip_wasm_bg.wasm',
} as const

const EMBEDDED_SCANS: Record<string, { file: string; re: RegExp }> = {
  openssl: {
    file: 'public/wasm/openssl.wasm',
    re: /OpenSSL (3\.\d+\.\d+) \d+ [A-Z][a-z]{2} \d{4}/,
  },
  strongswan: { file: 'public/wasm/strongswan.wasm', re: /strongSwan (\d+\.\d+\.\d+)/ },
}

/** Categories whose rows describe build/test tooling, not code in the shipped bundle. */
const TOOLING = new Set<string>([SBOM_CATEGORIES[9], SBOM_CATEGORIES[10]])

const sha256 = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex')
const readJson = <T>(root: string, rel: string): T =>
  JSON.parse(readFileSync(join(root, rel), 'utf8')) as T

function walk(dir: string, out: string[], skipDir: (name: string) => boolean): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) {
      if (!skipDir(name)) walk(p, out, skipDir)
    } else out.push(p)
  }
  return out
}

const TEST_FILE = /(\.test\.|\.spec\.|\.local\.test\.|\.nightly\.test\.|\/__tests__\/|\/test\/)/

/** Package names that shipped source (or its build config) refers to. */
export function shippedPackageUses(root: string): Set<string> {
  const used = new Set<string>()
  const add = (spec: string) => {
    if (spec.startsWith('.') || spec.startsWith('@/') || spec.startsWith('node:')) return
    used.add(spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0])
  }
  const files = walk(join(root, 'src'), [], (n) => n === 'node_modules' || n === 'archive')
  files.push(join(root, 'vite.config.ts'), join(root, 'index.html'))
  for (const f of files) {
    if (!existsSync(f) || TEST_FILE.test(f.replace(root, ''))) continue
    if (!/\.(ts|tsx|js|mjs|css|html)$/.test(f)) continue
    const s = readFileSync(f, 'utf8')
    for (const m of s.matchAll(/(?:\bfrom|\bimport\s*\(?|\brequire\s*\()\s*['"]([^'"]+)['"]/g))
      add(m[1])
    if (f.endsWith('.css'))
      for (const m of s.matchAll(/@(?:import|plugin|source)\s+['"]([^'"]+)['"]/g)) add(m[1])
  }
  return used
}

/** `^1.2.3` / `~1.2.3` / `1.2.3` -> `1.2.3`. Anything else cannot be pinned. */
function exactVersion(spec: string): string | null {
  const m = /^[\^~]?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/.exec(spec.trim())
  return m ? m[1] : null
}

function asArray(v: string | readonly string[]): readonly string[] {
  return typeof v === 'string' ? [v] : v
}

interface Provenance {
  hsmRepo: string
  bundles: { name: string; files: string[]; hsmCommit: string | null }[]
}
interface Artifacts {
  artifacts: {
    key: string
    repo: string | null
    commit: string | null
    files: Record<string, string>
    buildinfo?: string
  }[]
}
interface RustLock {
  bundle: string
  commit: string
  forks: Record<string, { crate: string; version: string; license: string }>
  unscannable: Record<string, { versions: string[]; license: string }>
}

export function derive(root: string, curated: Curated): Derived {
  const problems: string[] = []
  const bad = (m: string) => problems.push(m)

  const pkgJson = readJson<{
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
  }>(root, 'package.json')
  const deps: Record<string, string> = { ...pkgJson.dependencies, ...pkgJson.devDependencies }

  // ---- npm: listed <=> package.json, and listed => shipped ------------------
  const listedPkgs = new Set<string>()
  const pkgCategory = new Map<string, string>()
  const lockKeys = new Set<string>()
  const crateClaims = new Map<string, string>()
  const seenNames = new Set<string>()
  for (const g of curated.groups) {
    for (const c of g.components) {
      if (seenNames.has(c.name)) bad(`duplicate SBOM row name "${c.name}"`)
      seenNames.add(c.name)
      if ('pkg' in c && c.pkg !== undefined)
        for (const k of asArray(c.pkg)) {
          listedPkgs.add(k)
          pkgCategory.set(k, g.category)
        }
      if ('lock' in c && c.lock !== undefined) lockKeys.add(c.lock)
      if ('crate' in c && c.crate !== undefined)
        for (const k of asArray(c.crate)) claimCrate(k, c.name)
      if ('crates' in c && c.crates !== undefined) for (const k of c.crates) claimCrate(k, c.name)
    }
  }
  function claimCrate(crate: string, row: string) {
    const prev = crateClaims.get(crate)
    if (prev) bad(`crate ${crate} is claimed by two rows: "${prev}" and "${row}"`)
    crateClaims.set(crate, row)
  }

  const packageVersions: Record<string, string> = {}
  for (const key of [...listedPkgs].sort()) {
    const spec = deps[key]
    if (!spec) {
      bad(`${key}: listed in sbomComponents.ts but not a direct dependency in package.json`)
      continue
    }
    if (spec.startsWith('file:')) {
      const manifest = join(root, spec.slice('file:'.length), 'package.json')
      const v = existsSync(manifest)
        ? (JSON.parse(readFileSync(manifest, 'utf8')) as { version?: string }).version
        : undefined
      if (v) packageVersions[key] = v
      else bad(`${key}: spec "${spec}" has no readable package.json version`)
      continue
    }
    const v = exactVersion(spec)
    if (v) packageVersions[key] = v
    else bad(`${key}: spec "${spec}" cannot be pinned — give the entry a different source`)
  }
  for (const [key, why] of Object.entries(curated.excluded)) {
    if (!why.trim()) bad(`${key}: SBOM_EXCLUDED entry has no reason`)
    if (!deps[key]) bad(`${key}: in SBOM_EXCLUDED but not a direct dependency (stale exclusion)`)
    if (listedPkgs.has(key)) bad(`${key}: both listed and in SBOM_EXCLUDED`)
  }
  for (const key of Object.keys(deps).sort()) {
    if (!listedPkgs.has(key) && !(key in curated.excluded))
      bad(`${key}: direct dependency is neither on the SBOM page nor in SBOM_EXCLUDED`)
  }
  const uses = shippedPackageUses(root)
  for (const [key, category] of pkgCategory) {
    if (TOOLING.has(category)) continue
    if (!uses.has(key))
      bad(
        `${key}: listed under "${category}" but imported by no shipped source — it is declared, not shipped (move it to SBOM_EXCLUDED or remove the dependency)`
      )
  }

  // ---- npm transitive (package-lock) ----------------------------------------
  const lockVersions: Record<string, string> = {}
  if (lockKeys.size > 0) {
    const lock = readJson<{ packages: Record<string, { version?: string }> }>(
      root,
      'package-lock.json'
    )
    for (const k of [...lockKeys].sort()) {
      const v = lock.packages[`node_modules/${k}`]?.version
      if (v) lockVersions[k] = v
      else bad(`${k}: listed as a lockfile package but absent from package-lock.json`)
    }
  }

  // ---- wasm inventory: every shipped .wasm has a record ---------------------
  const provenance = readJson<Provenance>(root, 'public/wasm/wasm-provenance.json')
  const artifacts = readJson<Artifacts>(root, 'src/data/sbomWasmArtifacts.json')
  const shippedWasm = walk(join(root, 'public', 'wasm'), [], () => false)
    .filter((f) => f.endsWith('.wasm'))
    .map((f) => relative(root, f))
    .sort()
  const provFiles = provenance.bundles.flatMap((b) => b.files)
  const artifactFiles = new Map<string, string>()
  for (const a of artifacts.artifacts)
    for (const [f, sha] of Object.entries(a.files)) artifactFiles.set(f, sha)
  for (const f of shippedWasm) {
    const inProv = provFiles.some((p) => p === f || (p.endsWith('/') && f.startsWith(p)))
    const pinned = artifactFiles.get(f)
    if (pinned) {
      const actual = sha256(join(root, f))
      if (actual !== pinned)
        bad(
          `${f}: sha256 is ${actual.slice(0, 12)}… but src/data/sbomWasmArtifacts.json pins ${pinned.slice(0, 12)}… — the binary changed; update the record`
        )
    } else if (!inProv)
      bad(
        `${f}: shipped wasm with no record in wasm-provenance.json or src/data/sbomWasmArtifacts.json`
      )
  }
  for (const f of artifactFiles.keys())
    if (!shippedWasm.includes(f)) bad(`${f}: recorded in sbomWasmArtifacts.json but not shipped`)

  // ---- builds (label for "built from <repo> @ <commit>") --------------------
  const builds: Record<string, { repo: string | null; commit: string | null; sha256: string }> = {}
  for (const b of provenance.bundles) {
    const first = b.files.find((f) => f.endsWith('.wasm'))
    builds[b.name] = {
      repo: provenance.hsmRepo,
      commit: b.hsmCommit,
      sha256: first && existsSync(join(root, first)) ? sha256(join(root, first)) : '',
    }
  }
  for (const a of artifacts.artifacts) {
    const first = Object.keys(a.files)[0]
    builds[a.key] = {
      repo: a.repo,
      commit: a.commit,
      sha256: first && existsSync(join(root, first)) ? sha256(join(root, first)) : '',
    }
  }

  // ---- rust crates: the binary is the evidence ------------------------------
  const rustLock = readJson<RustLock>(root, 'src/data/sbomRustLock.json')
  const crates: Record<string, Partial<Record<keyof typeof RUST_BUNDLES, string[]>>> = {}
  const binaryForks = new Set<string>()
  for (const [bundle, file] of Object.entries(RUST_BUNDLES) as [
    keyof typeof RUST_BUNDLES,
    string,
  ][]) {
    if (!existsSync(join(root, file))) {
      bad(`${file}: Rust bundle missing, cannot scan crates`)
      continue
    }
    const scan = scanRustWasm(join(root, file))
    for (const [name, versions] of Object.entries(scan.crates))
      (crates[name] ??= {})[bundle] = versions
    if (bundle === 'engine') for (const f of scan.forks) binaryForks.add(f)
  }
  const engineProv = provenance.bundles.find((b) => b.name === rustLock.bundle)
  if (!engineProv || engineProv.hsmCommit !== rustLock.commit)
    bad(
      `src/data/sbomRustLock.json was read at ${rustLock.commit.slice(0, 8)} but wasm-provenance.json records ${engineProv?.hsmCommit?.slice(0, 8) ?? 'nothing'} for ${rustLock.bundle} — the engine was rebuilt; re-read the forks' and lock-only crates' versions and update the record`
    )
  for (const fork of Object.keys(rustLock.forks))
    if (!binaryForks.has(fork))
      bad(
        `${fork}: recorded as a vendored fork in the engine but its source path is not in the binary`
      )
  for (const fork of binaryForks)
    if (!(fork in rustLock.forks))
      bad(
        `${fork}: vendored fork present in the engine binary but not recorded in sbomRustLock.json`
      )

  const forkCrates = new Set(Object.values(rustLock.forks).map((f) => f.crate))
  const knownCrates = new Set<string>([
    ...Object.keys(crates),
    ...forkCrates,
    ...Object.keys(rustLock.unscannable),
  ])
  for (const name of Object.keys(crates))
    if (!crateClaims.has(name))
      bad(
        `crate ${name}: compiled into a shipped wasm bundle but not on the SBOM page (add a row or put it in a group)`
      )
  for (const name of forkCrates)
    if (!crateClaims.has(name)) bad(`crate ${name} (vendored fork): not on the SBOM page`)
  for (const name of Object.keys(rustLock.unscannable))
    if (!crateClaims.has(name)) bad(`crate ${name} (Cargo.lock only): not on the SBOM page`)
  for (const [name, row] of crateClaims)
    if (!knownCrates.has(name))
      bad(`crate ${name}: "${row}" lists it but it is not in any shipped wasm bundle`)

  // ---- embedded versions ----------------------------------------------------
  const embedded: Record<string, string> = {}
  for (const [key, cfg] of Object.entries(EMBEDDED_SCANS)) {
    const p = join(root, cfg.file)
    const v = existsSync(p) ? scanEmbeddedVersion(p, cfg.re) : null
    if (v) embedded[key] = v
    else bad(`${key}: no version string found in ${cfg.file}`)
  }
  for (const a of artifacts.artifacts) {
    if (!a.buildinfo) continue
    const info = readJson<{
      toolVersionString: string
      deps: Record<string, string>
      files: Record<string, { sha256: string }>
    }>(root, a.buildinfo)
    embedded[`${a.key}.tool`] = info.toolVersionString
    for (const [dep, v] of Object.entries(info.deps)) embedded[`${a.key}.${dep}`] = v
    const dir = a.buildinfo.slice(0, a.buildinfo.lastIndexOf('/'))
    for (const [name, meta] of Object.entries(info.files)) {
      const p = join(root, dir, name)
      if (!existsSync(p)) bad(`${dir}/${name}: named in BUILDINFO.json but not shipped`)
      else if (sha256(p) !== meta.sha256)
        bad(`${dir}/${name}: sha256 differs from BUILDINFO.json — the build record is stale`)
    }
  }

  // ---- row sources must resolve --------------------------------------------
  for (const g of curated.groups)
    for (const c of g.components) {
      if ('embedded' in c && c.embedded !== undefined && !(c.embedded in embedded))
        bad(`"${c.name}": embedded source "${c.embedded}" does not exist`)
      if ('built' in c && c.built !== undefined && !(c.built in builds))
        bad(
          `"${c.name}": built source "${c.built}" is not in wasm-provenance.json or sbomWasmArtifacts.json`
        )
      if ('native' in c && c.native !== undefined && c.name !== 'Web Crypto API (X25519, P-256)')
        bad(`"${c.name}": only the browser's own Web Crypto API may use a hand-typed "Native"`)
    }

  return {
    content: generate({ packageVersions, lockVersions, crates, embedded, builds }),
    problems,
  }
}

function generate(d: {
  packageVersions: Record<string, string>
  lockVersions: Record<string, string>
  crates: Record<string, Partial<Record<string, string[]>>>
  embedded: Record<string, string>
  builds: Record<string, { repo: string | null; commit: string | null; sha256: string }>
}): string {
  const key = (k: string) => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : `'${k}'`)
  const map = (o: Record<string, string>) =>
    Object.keys(o)
      .sort()
      .map((k) => `  ${key(k)}: '${o[k]}',`)
      .join('\n')
  const crateLines = Object.keys(d.crates)
    .sort()
    .map((c) => {
      const b = d.crates[c]
      const parts = (['engine', 'kmip'] as const)
        .filter((n) => b[n])
        .map((n) => `${n}: [${b[n]!.map((v) => `'${v}'`).join(', ')}]`)
      return `  ${key(c)}: { ${parts.join(', ')} },`
    })
    .join('\n')
  const buildLines = Object.keys(d.builds)
    .sort()
    .map((k) => {
      const b = d.builds[k]
      const repo = b.repo === null ? 'null' : `'${b.repo}'`
      const commit = b.commit === null ? 'null' : `'${b.commit}'`
      return `  ${key(k)}: { repo: ${repo}, commit: ${commit}, sha256: '${b.sha256}' },`
    })
    .join('\n')
  return `// SPDX-License-Identifier: GPL-3.0-only
// GENERATED by scripts/gen-sbom-versions.ts — DO NOT EDIT BY HAND.
// Sources: package.json / package-lock.json (npm), the shipped wasm binaries in
// public/wasm (Rust crates, embedded OpenSSL / strongSwan versions), the shipped
// entropy90b/BUILDINFO.json, and public/wasm/wasm-provenance.json (builds).
// Re-run \`npm run gen:sbom-versions\` (it runs in prebuild and pretest).

/** Direct npm dependencies, exactly as package.json pins them. */
export const SBOM_PACKAGE_VERSIONS: Readonly<Record<string, string>> = {
${map(d.packageVersions)}
}

/** npm packages that are not direct dependencies, versions from package-lock.json. */
export const SBOM_LOCK_VERSIONS: Readonly<Record<string, string>> = {
${map(d.lockVersions)}
}

/** Crates found inside each shipped Rust wasm bundle, versions as the binary records them. */
export const SBOM_CRATES: Readonly<
  Record<string, { engine?: readonly string[]; kmip?: readonly string[] }>
> = {
${crateLines}
}

/** Versions a shipped binary (or its shipped build record) states about itself. */
export const SBOM_EMBEDDED_VERSIONS: Readonly<Record<string, string>> = {
${map(d.embedded)}
}

/** Where each shipped wasm bundle was built from; commit is null when nothing records it. */
export const SBOM_BUILDS: Readonly<
  Record<string, { repo: string | null; commit: string | null; sha256: string }>
> = {
${buildLines}
}
`
}

export type { SbomComponent }
