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
import { buildCycloneDx, cdxLicense, integrityHash, npmPurl, type CdxComponent } from './cyclonedx'

export interface Curated {
  groups: readonly SbomGroup[]
  /** package.json dependency -> why it is intentionally not on the page. */
  excluded: Readonly<Record<string, string>>
}

export interface Derived {
  content: string
  problems: string[]
  /** Other generated files, keyed by repo-relative path. */
  files: Record<string, string>
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
  'pkcs11-provider': {
    file: 'public/wasm/openssl.wasm',
    re: /pkcs11-provider (\d+\.\d+\.\d+)/,
  },
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

/**
 * Last resort for a bundled package whose manifest and lock entry carry no license: recognise
 * the license text the package itself ships. Only unambiguous, standard texts are recognised;
 * anything else stays a failure so a human reads it.
 */
export function licenseFromFile(dir: string): string | undefined {
  for (const name of ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'license', 'license.md', 'COPYING']) {
    const p = join(dir, name)
    if (!existsSync(p)) continue
    const t = readFileSync(p, 'utf8')
    if (/Permission is hereby granted, free of charge/i.test(t) && /\bMIT\b/i.test(t)) return 'MIT'
    if (/Apache License/i.test(t) && /Version 2\.0/i.test(t)) return 'Apache-2.0'
    if (/ISC License/i.test(t)) return 'ISC'
    if (/Redistribution and use in source and binary forms/i.test(t))
      return /Neither the name/i.test(t) ? 'BSD-3-Clause' : 'BSD-2-Clause'
  }
  return undefined
}

export function derive(root: string, curated: Curated): Derived {
  const problems: string[] = []
  const bad = (m: string) => problems.push(m)

  const pkgJson = readJson<{
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
  }>(root, 'package.json')
  const deps: Record<string, string> = { ...pkgJson.dependencies, ...pkgJson.devDependencies }

  const SNAPSHOT = 'src/data/sbomBundledPackages.json'
  const bundledKeys: string[] = existsSync(join(root, SNAPSHOT))
    ? readJson<{ packages: string[] }>(root, SNAPSHOT).packages
    : (bad(`${SNAPSHOT} missing — run \`npm run sbom:snapshot-bundle\` (a production build)`), [])
  const bundledNames = new Set(
    bundledKeys.map((k) => k.slice(k.lastIndexOf('node_modules/') + 'node_modules/'.length))
  )

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
    if (!uses.has(key) && !bundledNames.has(key))
      bad(
        `${key}: listed under "${category}" but neither imported by shipped source nor bundled by the build — it is declared, not shipped (move it to SBOM_EXCLUDED or remove the dependency)`
      )
  }

  // ---- npm transitive (package-lock) + licenses for every npm row -------------
  const lockVersions: Record<string, string> = {}
  const packageLicenses: Record<string, string> = {}
  const lockFile = existsSync(join(root, 'package-lock.json'))
    ? readJson<{ packages: Record<string, { version?: string; license?: string }> }>(
        root,
        'package-lock.json'
      )
    : { packages: {} }
  for (const k of [...lockKeys].sort()) {
    const v = lockFile.packages[`node_modules/${k}`]?.version
    if (v) lockVersions[k] = v
    else bad(`${k}: listed as a lockfile package but absent from package-lock.json`)
  }
  // License evidence, strongest first: the lockfile entry for the pinned version, then the
  // manifest of the package itself (only for a `file:` dependency, which the lock omits).
  for (const k of [...listedPkgs, ...lockKeys].sort()) {
    let lic = lockFile.packages[`node_modules/${k}`]?.license
    const spec = deps[k]
    if (!lic && spec?.startsWith('file:')) {
      const manifest = join(root, spec.slice('file:'.length), 'package.json')
      if (existsSync(manifest))
        lic = (JSON.parse(readFileSync(manifest, 'utf8')) as { license?: string }).license
    }
    if (lic && lic.trim()) packageLicenses[k] = lic.trim()
    else
      bad(`${k}: no license in package-lock.json (or its own package.json for a file: dependency)`)
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

  // ---- rust crate licenses: every compiled-in crate@version has a reviewed entry ----
  const crateLicenseFile = readJson<{ crates: Record<string, Record<string, string>> }>(
    root,
    'src/data/sbomCrateLicenses.json'
  )
  const crateLicenses: Record<string, string[]> = {}
  const tokens = (spdx: string) =>
    spdx
      .replace(/[()]/g, '')
      .split(/\s+OR\s+|\s*\/\s*/)
      .map((t) => t.trim())
      .filter(Boolean)
  const addLicense = (crate: string, spdx: string) => {
    crateLicenses[crate] = [...new Set([...(crateLicenses[crate] ?? []), ...tokens(spdx)])].sort()
  }
  for (const [name, byBundle] of Object.entries(crates))
    for (const versions of Object.values(byBundle))
      for (const v of versions ?? []) {
        const lic = crateLicenseFile.crates[name]?.[v]
        if (lic) addLicense(name, lic)
        else
          bad(
            `crate ${name}@${v}: no license recorded in src/data/sbomCrateLicenses.json — run \`npm run sbom:refresh-crate-licenses\` (needs the local cargo registry) and review the diff`
          )
      }
  for (const [name, entry] of Object.entries(crateLicenseFile.crates))
    if (!crates[name]) bad(`crate ${name}: in sbomCrateLicenses.json but not in any shipped bundle`)
    else
      for (const v of Object.keys(entry))
        if (![...Object.values(crates[name])].some((vs) => vs?.includes(v)))
          bad(`crate ${name}@${v}: in sbomCrateLicenses.json but not in any shipped bundle`)
  for (const fork of Object.values(rustLock.forks)) addLicense(fork.crate, fork.license)
  for (const [name, entry] of Object.entries(rustLock.unscannable)) addLicense(name, entry.license)

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
      compiler?: string
      deps: Record<string, string>
      files: Record<string, { sha256: string }>
    }>(root, a.buildinfo)
    embedded[`${a.key}.tool`] = info.toolVersionString
    const emcc = /emcc[^\n]*?(\d+\.\d+\.\d+)/.exec(info.compiler ?? '')
    if (emcc) embedded[`${a.key}.emscripten`] = emcc[1]
    for (const [dep, v] of Object.entries(info.deps)) embedded[`${a.key}.${dep}`] = v
    const dir = a.buildinfo.slice(0, a.buildinfo.lastIndexOf('/'))
    for (const [name, meta] of Object.entries(info.files)) {
      const p = join(root, dir, name)
      if (!existsSync(p)) bad(`${dir}/${name}: named in BUILDINFO.json but not shipped`)
      else if (sha256(p) !== meta.sha256)
        bad(`${dir}/${name}: sha256 differs from BUILDINFO.json — the build record is stale`)
    }
  }

  // CPython inside the Pyodide runtime that ships: the runtime's own lock records it.
  const pyodideLock = join(root, 'node_modules', 'pyodide', 'pyodide-lock.json')
  if (existsSync(pyodideLock)) {
    const info = (JSON.parse(readFileSync(pyodideLock, 'utf8')) as { info?: { python?: string } })
      .info
    if (info?.python) embedded['python'] = info.python
    else bad('node_modules/pyodide/pyodide-lock.json has no info.python')
  } else bad('node_modules/pyodide/pyodide-lock.json missing — run npm ci')

  // ---- shipped non-code assets (fonts): every file recorded, pinned by sha256 ---
  const assets = readJson<{
    assets: { key: string; license: string; files: Record<string, string> }[]
  }>(root, 'src/data/sbomAssets.json')
  const pinned = new Map<string, string>()
  for (const a of assets.assets) for (const [f, h] of Object.entries(a.files)) pinned.set(f, h)
  const fontDir = join(root, 'public', 'fonts')
  const shippedFonts = existsSync(fontDir)
    ? walk(fontDir, [], () => false).map((f) => relative(root, f))
    : []
  for (const f of shippedFonts) {
    const want = pinned.get(f)
    if (!want) bad(`${f}: shipped font with no record in src/data/sbomAssets.json`)
    else if (sha256(join(root, f)) !== want)
      bad(
        `${f}: sha256 differs from src/data/sbomAssets.json — the font changed; update the record`
      )
  }
  for (const f of pinned.keys())
    if (!shippedFonts.includes(f)) bad(`${f}: recorded in sbomAssets.json but not shipped`)

  // ---- AI models: what the shipped code names must be recorded, and nothing else -----
  const modelFile = readJson<{
    models: {
      key: string
      id: string
      sourceUrl: string
      license: string
      revisionChecked: string | null
    }[]
    fetchedAt: string
  }>(root, 'src/data/sbomModels.json')
  const modelKeys = new Set(modelFile.models.map((m) => m.key))
  const shippedModelUrls = new Map<string, string>() // sourceUrl -> what names it
  const webllmPath = join(root, 'node_modules', '@mlc-ai', 'web-llm', 'lib', 'index.js')
  const chatPath = join(root, 'src/services/chat/modelConfig.ts')
  const metaPath = join(root, 'public/data/embeddings-meta.json')
  if (!existsSync(webllmPath) || !existsSync(chatPath) || !existsSync(metaPath)) {
    bad('cannot check AI models: web-llm lib, modelConfig.ts or embeddings-meta.json is missing')
  } else {
    // The local models the app supports are named once, in modelConfig.ts
    // (SUPPORTED_LOCAL_MODELS, whose entries are string literals or the exported constants above it).
    const cfg = readFileSync(chatPath, 'utf8')
    const consts = new Map(
      [...cfg.matchAll(/export const (\w+)\s*=\s*'([^']+)'/g)].map((m) => [m[1], m[2]] as const)
    )
    const list = /export const SUPPORTED_LOCAL_MODELS\s*=\s*\[([^\]]*)\]/.exec(cfg)
    const entries = (list?.[1] ?? '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    const chatIds = entries
      .map((t) => /^'([^']+)'$/.exec(t)?.[1] ?? consts.get(t))
      .filter((x): x is string => Boolean(x))
    if (!list || entries.length === 0 || chatIds.length !== entries.length)
      bad(
        'modelConfig.ts: SUPPORTED_LOCAL_MODELS is missing or names something this check cannot resolve'
      )
    const lib = readFileSync(webllmPath, 'utf8')
    const prefix = /modelLibURLPrefix\s*=\s*"([^"]+)"/.exec(lib)?.[1]
    const version = /modelVersion\s*=\s*"([^"]+)"/.exec(lib)?.[1]
    for (const id of chatIds) {
      const esc = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const m = new RegExp(
        `model:\\s*"([^"]+)",\\s*model_id:\\s*"${esc}",\\s*model_lib:\\s*modelLibURLPrefix\\s*\\+\\s*modelVersion\\s*\\+\\s*"([^"]+)"`
      ).exec(lib)
      if (!m || !prefix || !version) {
        bad(`${id}: named by modelConfig.ts but not found in the bundled @mlc-ai/web-llm config`)
        continue
      }
      shippedModelUrls.set(m[1], `${id} (weights)`)
      shippedModelUrls.set(`${prefix}${version}${m[2]}`, `${id} (model library)`)
    }
    const embed = (JSON.parse(readFileSync(metaPath, 'utf8')) as { model?: string }).model
    if (embed) shippedModelUrls.set(`https://huggingface.co/${embed}`, `${embed} (embeddings)`)
    else bad('public/data/embeddings-meta.json names no embedding model')
    for (const [url, what] of shippedModelUrls)
      if (!modelFile.models.some((m) => m.sourceUrl === url))
        bad(`${what}: named by shipped code (${url}) but not recorded in src/data/sbomModels.json`)
    for (const m of modelFile.models) {
      if (!shippedModelUrls.has(m.sourceUrl))
        bad(`${m.key}: recorded in sbomModels.json but no shipped code names ${m.sourceUrl}`)
      if (!m.license.trim()) bad(`${m.key}: no license stated in sbomModels.json`)
    }
  }

  // ---- row sources must resolve --------------------------------------------
  for (const g of curated.groups)
    for (const c of g.components) {
      if ('embedded' in c && c.embedded !== undefined && !(c.embedded in embedded))
        bad(`"${c.name}": embedded source "${c.embedded}" does not exist`)
      if ('model' in c && c.model !== undefined && !modelKeys.has(c.model))
        bad(`"${c.name}": model source "${c.model}" is not in src/data/sbomModels.json`)
      if ('asset' in c && c.asset !== undefined) {
        const rec = assets.assets.find((a) => a.key === c.asset)
        if (!rec) bad(`"${c.name}": asset source "${c.asset}" is not in src/data/sbomAssets.json`)
        else if (rec.license !== c.license)
          bad(`"${c.name}": row says "${c.license}" but sbomAssets.json records "${rec.license}"`)
      }
      if ('built' in c && c.built !== undefined && !(c.built in builds))
        bad(
          `"${c.name}": built source "${c.built}" is not in wasm-provenance.json or sbomWasmArtifacts.json`
        )
      if ('native' in c && c.native !== undefined && c.name !== 'Web Crypto API (X25519, P-256)')
        bad(`"${c.name}": only the browser's own Web Crypto API may use a hand-typed "Native"`)
    }

  // ---- npm packages the production build actually bundles (build evidence) -------
  interface Bundled {
    key: string
    name: string
    version: string
    license: string
    integrity?: string
  }
  const bundled: Bundled[] = []
  for (const key of bundledKeys) {
    const entry = lockFile.packages[key] as
      { version?: string; license?: string; integrity?: string } | undefined
    const name = key.slice(key.lastIndexOf('node_modules/') + 'node_modules/'.length)
    if (!entry?.version) {
      bad(`${key}: in ${SNAPSHOT} but absent from package-lock.json — the snapshot is stale`)
      continue
    }
    let license = entry.license
    if (!license) {
      const manifest = join(root, key, 'package.json')
      if (existsSync(manifest))
        license = (JSON.parse(readFileSync(manifest, 'utf8')) as { license?: string }).license
    }
    if (!license) license = licenseFromFile(join(root, key))
    if (!license?.trim()) {
      bad(`${key}: bundled but no license in package-lock.json or its own package.json`)
      continue
    }
    bundled.push({
      key,
      name,
      version: entry.version,
      license: license.trim(),
      integrity: entry.integrity,
    })
  }
  for (const b of bundled)
    if (b.key === `node_modules/${b.name}` && b.name in curated.excluded)
      bad(
        `${b.name}: the build bundles it, but SBOM_EXCLUDED says it is not shipped (${curated.excluded[b.name]})`
      )
  const listedNames = new Set<string>([...listedPkgs, ...lockKeys])
  const transitive = bundled.filter((b) => !listedNames.has(b.name))
  const licenseHistogram = new Map<string, number>()
  for (const b of transitive) {
    const shown = b.license
      .replace(/[()]/g, '')
      .replace(/\s+OR\s+/g, ' / ')
      .trim()
    licenseHistogram.set(shown, (licenseHistogram.get(shown) ?? 0) + 1)
  }
  const bundledTransitive = {
    count: transitive.length,
    licenses: [...licenseHistogram.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
    ),
  }

  // ---- the complete machine-readable SBOM ---------------------------------------
  const cdx: CdxComponent[] = []
  for (const b of bundled)
    cdx.push({
      type: 'library',
      name: b.name,
      version: b.version,
      purl: npmPurl(b.name, b.version),
      licenses: cdxLicense(b.license),
      ...(integrityHash(b.integrity) ? { hashes: [integrityHash(b.integrity)!] } : {}),
      properties: [
        {
          name: 'pqctoday:evidence',
          value:
            'bundled into the production build (emitted chunks); version and license from package-lock.json',
        },
        { name: 'pqctoday:listed-on-about-page', value: String(listedNames.has(b.name)) },
        ...(b.key !== `node_modules/${b.name}`
          ? [{ name: 'pqctoday:lock-path', value: b.key }]
          : []),
      ],
    })
  const crateBundles = (name: string) =>
    Object.entries(crates[name] ?? {}).map(([bundle, vs]) => ({ bundle, vs: vs ?? [] }))
  const seenCrate = new Set<string>()
  for (const name of Object.keys(crates).sort())
    for (const version of new Set(crateBundles(name).flatMap((x) => x.vs))) {
      seenCrate.add(`${name}@${version}`)
      cdx.push({
        type: 'library',
        name,
        version,
        purl: `pkg:cargo/${name}@${version}`,
        licenses: cdxLicense(crateLicenseFile.crates[name]?.[version] ?? ''),
        properties: [
          {
            name: 'pqctoday:evidence',
            value: 'crate path found inside the served WebAssembly bundle',
          },
          {
            name: 'pqctoday:bundles',
            value: crateBundles(name)
              .filter((x) => x.vs.includes(version))
              .map((x) => x.bundle)
              .join(', '),
          },
        ],
      })
    }
  for (const [dir, fork] of Object.entries(rustLock.forks))
    cdx.push({
      type: 'library',
      name: fork.crate,
      version: fork.version,
      purl: `pkg:cargo/${fork.crate}@${fork.version}`,
      licenses: cdxLicense(fork.license),
      properties: [
        {
          name: 'pqctoday:evidence',
          value: `vendored fork "${dir}": source directory present in the engine binary; version read from the pqctoday-hsm sources at ${rustLock.commit.slice(0, 8)}`,
        },
        { name: 'pqctoday:bundles', value: 'engine' },
      ],
    })
  for (const [name, entry] of Object.entries(rustLock.unscannable))
    for (const version of entry.versions)
      cdx.push({
        type: 'library',
        name,
        version,
        purl: `pkg:cargo/${name}@${version}`,
        licenses: cdxLicense(entry.license),
        properties: [
          {
            name: 'pqctoday:evidence',
            value: `Cargo.lock at ${rustLock.commit.slice(0, 8)}; leaves no path string in the binary, so not verifiable there`,
          },
          { name: 'pqctoday:bundles', value: 'engine' },
        ],
      })
  for (const g of curated.groups)
    for (const c of g.components) {
      if ('embedded' in c && c.embedded !== undefined)
        cdx.push({
          type: 'library',
          name: c.name,
          version: embedded[c.embedded],
          licenses: cdxLicense(c.license),
          properties: [
            {
              name: 'pqctoday:evidence',
              value: 'version string embedded in the served binary or its shipped build record',
            },
          ],
        })
      else if ('built' in c && c.built !== undefined) {
        const b = builds[c.built]
        cdx.push({
          type: 'application',
          name: c.name,
          licenses: cdxLicense(c.license),
          hashes: b?.sha256 ? [{ alg: 'SHA-256', content: b.sha256 }] : undefined,
          externalReferences:
            b?.repo && b.commit
              ? [{ type: 'vcs', url: `https://github.com/${b.repo}/commit/${b.commit}` }]
              : undefined,
          properties: [
            {
              name: 'pqctoday:evidence',
              value: 'served WebAssembly binary; the binary embeds no release version',
            },
            {
              name: 'pqctoday:build',
              value: b?.commit ? `built from ${b.repo} @ ${b.commit}` : 'build commit not recorded',
            },
            ...(c.note ? [{ name: 'pqctoday:note', value: c.note }] : []),
          ],
        })
      } else if ('asset' in c && c.asset !== undefined) {
        const rec = assets.assets.find((a) => a.key === c.asset) as
          | { version: string; license: string; copyright: string; files: Record<string, string> }
          | undefined
        cdx.push({
          type: 'data',
          name: c.name,
          version: rec?.version,
          licenses: cdxLicense(c.license),
          hashes: rec
            ? Object.values(rec.files).map((content) => ({ alg: 'SHA-256', content }))
            : undefined,
          properties: [
            {
              name: 'pqctoday:evidence',
              value: "read from the shipped font file's own name table",
            },
            ...(rec ? [{ name: 'pqctoday:copyright', value: rec.copyright }] : []),
          ],
        })
      } else if ('model' in c && c.model !== undefined) {
        const m = modelFile.models.find((x) => x.key === c.model)
        cdx.push({
          type: 'machine-learning-model',
          name: c.name,
          version: m?.revisionChecked ?? undefined,
          licenses: cdxLicense(m?.license ?? ''),
          externalReferences: m ? [{ type: 'distribution', url: m.sourceUrl }] : undefined,
          properties: [
            {
              name: 'pqctoday:evidence',
              value: `named by shipped code; license and revision read from the model repository on ${modelFile.fetchedAt}`,
            },
            { name: 'pqctoday:revision-pinned', value: 'false' },
            {
              name: 'pqctoday:delivery',
              value: "downloaded by the visitor's browser at run time; not in the site bundle",
            },
          ],
        })
      }
    }
  const cdxDoc = buildCycloneDx({
    app: { name: 'pqctoday-hub', version: (pkgJson as { version?: string }).version ?? '0.0.0' },
    components: cdx,
  })
  const files: Record<string, string> = {
    'public/data/pqctoday-sbom.cdx.json': JSON.stringify(cdxDoc, null, 2) + '\n',
  }

  return {
    files,
    content: generate({
      packageVersions,
      lockVersions,
      packageLicenses,
      crateLicenses,
      crates,
      embedded,
      builds,
      bundledTransitive,
    }),
    problems,
  }
}

function generate(d: {
  packageVersions: Record<string, string>
  lockVersions: Record<string, string>
  packageLicenses: Record<string, string>
  crateLicenses: Record<string, string[]>
  crates: Record<string, Partial<Record<string, string[]>>>
  bundledTransitive: { count: number; licenses: [string, number][] }
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

/** License of every npm package on the page, as package-lock.json records it (SPDX). */
export const SBOM_PACKAGE_LICENSES: Readonly<Record<string, string>> = {
${map(d.packageLicenses)}
}

/** SPDX license identifiers per Rust crate, from each crate's own Cargo.toml (see sbomCrateLicenses.json). */
export const SBOM_CRATE_LICENSES: Readonly<Record<string, readonly string[]>> = {
${Object.keys(d.crateLicenses)
  .sort()
  .map((k) => `  ${key(k)}: [${d.crateLicenses[k].map((x) => `'${x}'`).join(', ')}],`)
  .join('\n')}
}

/**
 * npm packages the production build bundles that are not rows above (dependencies of the
 * listed packages): how many, and how many per license. The full list is
 * public/data/pqctoday-sbom.cdx.json.
 */
export const SBOM_BUNDLED_TRANSITIVE: {
  readonly count: number
  readonly licenses: readonly (readonly [string, number])[]
} = ${JSON.stringify(d.bundledTransitive)}

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
