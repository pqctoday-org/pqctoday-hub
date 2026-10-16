#!/usr/bin/env tsx
// SPDX-License-Identifier: AGPL-3.0-only
/**
 * scripts/ci/verify-engines.ts — the engine files this site ships are exactly
 * the ones recorded in public/wasm/engines.lock.json.
 *
 * WHY (owner decision 2026-10-12, repository cleanup Step 3). The WebAssembly
 * engines are built in the pqctoday-hsm repository and vendored here.
 * public/wasm/wasm-provenance.json says which HSM commit each bundle came from,
 * but the only check that compared it with anything (`sync:wasm:check`) needs
 * a sibling HSM checkout and quietly does nothing without one. The lock records
 * the SHA-256 and size of every engine file, so a changed, missing or unlisted
 * file fails on any machine with no sibling at all.
 *
 * WHAT IT CHECKS (offline, always on):
 *   - every locked file exists and matches its recorded SHA-256 and size;
 *   - every file the provenance declares for a bundle is in the lock, and every
 *     locked file is declared (the two lists cannot drift apart);
 *   - the HSM commit in the lock equals the one in the provenance;
 *   - the provenance names files, not folders: a folder can hold code written
 *     here, which must never be treated as an engine artifact.
 *
 * Output names the bundle and the file, never file contents.
 *
 * Upgrading an engine: rebuild it, update its provenance entry, then run
 * `npm run verify:engines -- --write-lock` and commit the lock with the files.
 * Rollback is reverting that commit. A bundle published in an engine release
 * also carries `release` (tag, asset, tarball SHA-256); `--pin-release` fills
 * it from that release's SHA256SUMS, and `verify-engines-release.ts` downloads
 * the asset and compares it. A pin whose asset name no longer matches the
 * bundle's build commit fails here as 'release stale': re-pin after a rebuild.
 *
 * Usage:
 *   tsx scripts/ci/verify-engines.ts                 # check
 *   tsx scripts/ci/verify-engines.ts --write-lock    # (re)generate the lock
 *   tsx scripts/ci/verify-engines.ts --pin-release engines-N --sums <SHA256SUMS>
 *                                                     # pin HSM bundles to a published release
 *   --root <dir> --lock <file> --provenance <file> --artifacts <file>   # override locations
 *
 * Two sources (owner decision 2026-10-14: every shipped engine is locked):
 * public/wasm/wasm-provenance.json for the bundles built in pqctoday-hsm, and
 * src/data/sbomWasmArtifacts.json for the others (TPM emulator, LMS module,
 * NIST SP 800-90B tools), whose `lockFiles` add the loaders beside each binary.
 */
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export interface LockedFile {
  sha256: string
  bytes: number
}

export interface PinnedRelease {
  tag: string
  asset: string
  tarballSha256: string
}

export interface LockedBundle {
  hsmCommit: string | null
  /** Bundles not built from the HSM repository: who built them and from which commit. */
  producer?: string | null
  buildCommit?: string | null
  /** Filled in once the bundle is published as an engine release; null until then. */
  release: PinnedRelease | null
  files: Record<string, LockedFile>
}

export interface EnginesLock {
  version: 1
  producer: string
  bundles: Record<string, LockedBundle>
}

export interface ProvenanceBundle {
  name: string
  files: string[]
  hsmCommit?: string | null
  /** Set only for bundles from src/data/sbomWasmArtifacts.json (not built in the HSM repository). */
  producer?: string | null
  buildCommit?: string | null
}

/** One record of src/data/sbomWasmArtifacts.json. `files` are the pinned .wasm binaries;
 * `lockFiles` lists their companion loaders, which the SBOM check does not pin. */
export interface WasmArtifact {
  key: string
  repo: string | null
  commit: string | null
  files: Record<string, string>
  lockFiles?: string[]
}

/** Turn the non-HSM artifact records into bundles the lock covers like any other. */
export function artifactBundles(artifacts: WasmArtifact[]): ProvenanceBundle[] {
  return artifacts.map((a) => ({
    name: a.key,
    files: [...Object.keys(a.files), ...(a.lockFiles ?? [])],
    hsmCommit: null,
    producer: a.repo,
    buildCommit: a.commit,
  }))
}

/** All bundles the lock must cover; a name used twice is an error. */
export function allBundles(
  provenance: ProvenanceBundle[],
  artifacts: WasmArtifact[]
): ProvenanceBundle[] {
  const all = [...provenance, ...artifactBundles(artifacts)]
  const seen = new Set<string>()
  for (const b of all) {
    if (seen.has(b.name)) throw new Error(`bundle name ${b.name} is used twice`)
    seen.add(b.name)
  }
  return all
}

export type ProblemKind =
  | 'changed'
  | 'missing'
  | 'unlocked'
  | 'not declared'
  | 'commit differs'
  | 'producer differs'
  | 'release stale'
  | 'folder entry'
  | 'bundle not in lock'
  | 'bundle not in provenance'

export interface Problem {
  bundle: string
  file: string
  what: ProblemKind
}

const sha256 = (buf: Buffer): string => createHash('sha256').update(buf).digest('hex')

const isFolder = (entry: string): boolean => entry.endsWith('/')

/** A release asset is named `<bundle>-<first 8 of the build commit>.tar.gz`. */
export const releaseAsset = (bundle: string, commit: string): string =>
  `${bundle}-${commit.slice(0, 8)}.tar.gz`

/** A pin is stale when the engine was rebuilt from another commit but not re-pinned. */
function releaseMatchesCommit(name: string, locked: LockedBundle): boolean {
  if (!locked.release || !locked.hsmCommit) return false
  return locked.release.asset === releaseAsset(name, locked.hsmCommit)
}

/** Pin every HSM bundle whose asset for its current commit is listed in a release's SHA256SUMS. */
export function pinRelease(lock: EnginesLock, tag: string, sums: string): string[] {
  const bySum = new Map<string, string>()
  for (const line of sums.split('\n')) {
    const m = /^([0-9a-f]{64})\s+\*?(\S+)$/.exec(line.trim())
    if (m) bySum.set(m[2], m[1])
  }
  const pinned: string[] = []
  for (const [name, b] of Object.entries(lock.bundles)) {
    if (!b.hsmCommit) continue
    const asset = releaseAsset(name, b.hsmCommit)
    const sha = bySum.get(asset)
    if (!sha) continue
    b.release = { tag, asset, tarballSha256: sha }
    pinned.push(name)
  }
  return pinned
}

export function verifyEngines(
  root: string,
  lock: EnginesLock,
  provenance: ProvenanceBundle[]
): Problem[] {
  const problems: Problem[] = []
  const declared = new Set(provenance.map((b) => b.name))
  for (const name of Object.keys(lock.bundles)) {
    if (!declared.has(name))
      problems.push({ bundle: name, file: '-', what: 'bundle not in provenance' })
  }
  for (const b of provenance) {
    const locked = lock.bundles[b.name]
    for (const entry of b.files) {
      if (isFolder(entry)) problems.push({ bundle: b.name, file: entry, what: 'folder entry' })
    }
    if (!locked) {
      problems.push({ bundle: b.name, file: '-', what: 'bundle not in lock' })
      continue
    }
    if ((locked.hsmCommit ?? null) !== (b.hsmCommit ?? null)) {
      problems.push({ bundle: b.name, file: '-', what: 'commit differs' })
    }
    if ((locked.buildCommit ?? null) !== (b.buildCommit ?? null)) {
      problems.push({ bundle: b.name, file: '-', what: 'commit differs' })
    }
    if (locked.release && !releaseMatchesCommit(b.name, locked)) {
      problems.push({ bundle: b.name, file: locked.release.asset, what: 'release stale' })
    }
    if ((locked.producer ?? null) !== (b.producer ?? null)) {
      problems.push({ bundle: b.name, file: '-', what: 'producer differs' })
    }
    const declaredFiles = new Set(b.files.filter((f) => !isFolder(f)))
    for (const f of declaredFiles) {
      if (!(f in locked.files)) problems.push({ bundle: b.name, file: f, what: 'unlocked' })
    }
    for (const [f, meta] of Object.entries(locked.files)) {
      if (!declaredFiles.has(f)) problems.push({ bundle: b.name, file: f, what: 'not declared' })
      const full = join(root, f)
      if (!existsSync(full) || !statSync(full).isFile()) {
        problems.push({ bundle: b.name, file: f, what: 'missing' })
        continue
      }
      const data = readFileSync(full)
      if (data.length !== meta.bytes || sha256(data) !== meta.sha256) {
        problems.push({ bundle: b.name, file: f, what: 'changed' })
      }
    }
  }
  return problems
}

/** Build a lock from the files on disk. Keeps an existing pinned `release` for a bundle. */
export function buildLock(
  root: string,
  provenance: ProvenanceBundle[],
  producer: string,
  previous?: EnginesLock
): EnginesLock {
  const bundles: Record<string, LockedBundle> = {}
  for (const b of [...provenance].sort((x, y) => x.name.localeCompare(y.name))) {
    const files: Record<string, LockedFile> = {}
    for (const entry of [...b.files].sort()) {
      if (isFolder(entry)) {
        throw new Error(
          `${b.name}: provenance lists the folder ${entry}; list the engine files one by one`
        )
      }
      const full = join(root, entry)
      if (!existsSync(full) || !statSync(full).isFile()) {
        throw new Error(`${b.name}: declared file not found: ${entry}`)
      }
      const data = readFileSync(full)
      files[entry] = { sha256: sha256(data), bytes: data.length }
    }
    bundles[b.name] = {
      hsmCommit: b.hsmCommit ?? null,
      ...(b.producer !== undefined || b.buildCommit !== undefined
        ? { producer: b.producer ?? null, buildCommit: b.buildCommit ?? null }
        : {}),
      release: previous?.bundles[b.name]?.release ?? null,
      files,
    }
  }
  return { version: 1, producer, bundles }
}

function main(argv: string[]): number {
  const arg = (name: string): string | undefined => {
    const i = argv.indexOf(name)
    return i >= 0 ? argv[i + 1] : undefined
  }
  const root = arg('--root') ?? process.cwd()
  const lockPath = arg('--lock') ?? join(root, 'public/wasm/engines.lock.json')
  const provPath = arg('--provenance') ?? join(root, 'public/wasm/wasm-provenance.json')
  const artifactsPath = arg('--artifacts') ?? join(root, 'src/data/sbomWasmArtifacts.json')
  const prov = JSON.parse(readFileSync(provPath, 'utf8')) as {
    hsmRepo?: string
    bundles: ProvenanceBundle[]
  }
  const artifacts = existsSync(artifactsPath)
    ? (JSON.parse(readFileSync(artifactsPath, 'utf8')) as { artifacts: WasmArtifact[] }).artifacts
    : []
  const bundlesIn = allBundles(prov.bundles, artifacts)
  const previous = existsSync(lockPath)
    ? (JSON.parse(readFileSync(lockPath, 'utf8')) as EnginesLock)
    : undefined

  const pinTag = arg('--pin-release')
  if (pinTag) {
    const sumsPath = arg('--sums')
    if (!previous || !sumsPath) {
      console.error(
        'engines: --pin-release needs an existing lock and --sums <SHA256SUMS of that release>'
      )
      return 2
    }
    const pinned = pinRelease(previous, pinTag, readFileSync(sumsPath, 'utf8'))
    writeFileSync(lockPath, `${JSON.stringify(previous, null, 2)}\n`)
    console.log(
      `engines: pinned ${pinned.length} bundle(s) to ${pinTag}: ${pinned.join(', ') || 'none'}`
    )
    return pinned.length > 0 ? 0 : 1
  }

  if (argv.includes('--write-lock')) {
    const lock = buildLock(root, bundlesIn, prov.hsmRepo ?? 'pqctoday-org/pqctoday-hsm', previous)
    writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`)
    const n = Object.values(lock.bundles).reduce((s, b) => s + Object.keys(b.files).length, 0)
    console.log(`engines: lock written (${Object.keys(lock.bundles).length} bundles, ${n} files)`)
    return 0
  }

  if (!previous) {
    console.error(`engines: no lock at ${lockPath}; create it with --write-lock`)
    return 2
  }
  const problems = verifyEngines(root, previous, bundlesIn)
  if (problems.length === 0) {
    const n = Object.values(previous.bundles).reduce((s, b) => s + Object.keys(b.files).length, 0)
    console.log(
      `engines: all ${Object.keys(previous.bundles).length} bundles, ${n} files match the lock`
    )
    return 0
  }
  console.log(`engines: ${problems.length} problem(s)`)
  for (const p of problems) console.log(`  ${p.bundle}: ${p.file} ${p.what}`)
  return 1
}

if (process.argv[1] && /verify-engines\.ts$/.test(process.argv[1])) {
  process.exit(main(process.argv.slice(2)))
}
