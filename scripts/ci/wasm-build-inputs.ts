/**
 * wasm-build-inputs.ts — derive a Rust wasm bundle's source inputs from its
 * Cargo build graph, instead of trusting a hand-written directory list.
 *
 * WHY (2026-09-26). check-wasm-provenance.ts decided whether a vendored bundle
 * was stale by counting hsm commits under the bundle's `sourceDirs`. That list
 * was wrong in BOTH directions at once:
 *   - too narrow: cacp-kmip listed ["kmip", "wasm"], but wasm/Cargo.toml links
 *     `softhsmrustv3 = { path = "../rust" }`, so every Rust engine fix (e.g. hsm
 *     PRs #272-#276) left the KMIP bundle "current" while it shipped the old code;
 *   - too broad: whole directories counted docs, conformance REPORTS, a nested
 *     bench crate and committed build OUTPUT (rust/pkg_bundler/*.wasm) as inputs,
 *     so the gate cried stale on changes that cannot alter the binary — the
 *     wasm-provenance.json notes record three such false alarms.
 * One cause: the watched set was written by hand rather than read from the
 * build. This module reads it from the build.
 *
 * WHAT COUNTS AS AN INPUT, per crate reachable from the root manifest through
 * `path` dependencies (normal, build and target-specific dependencies, and
 * [patch] entries — NOT dev-dependencies, which never reach the library):
 *   <crate>/Cargo.toml, <crate>/src, <crate>/build.rs (or its `build =` path),
 *   and every file a source in <crate>/src pulls in at compile time with
 *   include_bytes!/include_str!/include! and a literal relative path.
 * Plus, for the ROOT crate only (the directory the build runs from):
 *   <root>/Cargo.lock and <root>/.cargo — Cargo reads the lockfile and config of
 *   the build root, never those of a dependency.
 * Over-inclusion is deliberate where the build can't be resolved exactly (an
 * optional dependency is counted even if the bundle's features leave it out;
 * an include inside a #[cfg(test)] module is counted): a needless rebuild is
 * cheap, a false "current" ships a binary that does not match its source.
 *
 * Pure: all I/O is injected, so the unit tests run without an hsm checkout.
 */
import path from 'node:path'

/** Sections whose `path = "..."` entries are part of the library build. */
const BUILD_DEP_SECTION =
  /^(?:(?:target\.[^\]]+\.)?(?:dependencies|build-dependencies)|patch\.[^\].]+|workspace\.dependencies)(?:\.[^\]]+)?$/

/**
 * Local `path` dependencies declared in one Cargo.toml, as written (relative to
 * that manifest's directory). Section-aware without a TOML library: handles the
 * inline-table form `foo = { path = "../x" }` and the table form
 * `[dependencies.foo]` + `path = "../x"`, and skips [dev-dependencies] in every
 * spelling (including target-specific and dotted-table forms).
 */
export function cargoPathDeps(toml: string): string[] {
  const out: string[] = []
  let section = ''
  for (const raw of toml.split('\n')) {
    const line = raw.replace(/#.*$/, '').trim()
    if (!line) continue
    const header = /^\[\[?\s*([^\]]+?)\s*\]\]?$/.exec(line)
    if (header) {
      section = header[1].replace(/\s+/g, '').replace(/"/g, '')
      continue
    }
    if (!BUILD_DEP_SECTION.test(section)) continue
    // inline table: name = { ..., path = "x", ... }  OR  table form: path = "x"
    const m = /(?:^|[{,\s])path\s*=\s*"([^"]+)"/.exec(line)
    if (m) out.push(m[1])
  }
  return out
}

/** `[package] build = "..."`, when the build script is not build.rs. */
export function cargoBuildScript(toml: string): string | null | false {
  let section = ''
  for (const raw of toml.split('\n')) {
    const line = raw.replace(/#.*$/, '').trim()
    const header = /^\[\[?\s*([^\]]+?)\s*\]\]?$/.exec(line)
    if (header) {
      section = header[1].trim()
      continue
    }
    if (section !== 'package') continue
    const m = /^build\s*=\s*(?:"([^"]+)"|(false|true))/.exec(line)
    if (m) return m[1] ?? (m[2] === 'false' ? false : null)
  }
  return null
}

/**
 * Files one Rust source pulls in at compile time with a LITERAL relative path,
 * resolved against that source's directory (POSIX, repo-relative).
 * `include!(concat!(env!("OUT_DIR"), ...))` has no literal path: OUT_DIR is
 * produced by build.rs, which is already an input.
 */
export function includeTargets(rsFile: string, content: string): string[] {
  const out: string[] = []
  const re = /\binclude(?:_bytes|_str)?!\s*\(\s*"([^"]+)"/g
  let m: RegExpExecArray | null
  while ((m = re.exec(content))) {
    out.push(path.posix.normalize(path.posix.join(path.posix.dirname(rsFile), m[1])))
  }
  return out
}

export interface CargoIo {
  /** File contents at the baseline commit, or null when it does not exist. */
  readFile(repoPath: string): string | null
  /** Every file path under a directory at the baseline commit (repo-relative, POSIX). */
  listFiles(repoDir: string): string[]
}

export interface DerivedInputs {
  /** Crate directories in the build closure, root first. */
  crates: string[]
  /** Directories and manifests watched with the doc-only excludes applied. */
  paths: string[]
  /** Compile-time include targets — watched WITHOUT excludes (a README can be compiled in). */
  includes: string[]
}

/** Walk the path-dependency closure from `rootManifest` (e.g. "wasm/Cargo.toml"). */
export function deriveCargoInputs(rootManifest: string, io: CargoIo): DerivedInputs {
  const rootDir = path.posix.dirname(rootManifest)
  const seen = new Set<string>()
  const crates: string[] = []
  const queue = [rootDir]
  while (queue.length) {
    const dir = queue.shift()!
    if (seen.has(dir)) continue
    const toml = io.readFile(`${dir}/Cargo.toml`)
    if (toml === null) throw new Error(`no Cargo.toml at ${dir} (reached from ${rootManifest})`)
    seen.add(dir)
    crates.push(dir)
    for (const rel of cargoPathDeps(toml))
      queue.push(path.posix.normalize(path.posix.join(dir, rel)))
  }

  // Build-root-only inputs: the lockfile, Cargo config and toolchain pin of the
  // directory the build runs from (and a repo-root toolchain pin, which rustup
  // also honours from a subdirectory).
  const paths = new Set<string>([
    `${rootDir}/Cargo.lock`,
    `${rootDir}/.cargo`,
    `${rootDir}/rust-toolchain`,
    `${rootDir}/rust-toolchain.toml`,
    'rust-toolchain',
    'rust-toolchain.toml',
  ])
  const includes = new Set<string>()
  for (const dir of crates) {
    const toml = io.readFile(`${dir}/Cargo.toml`)!
    paths.add(`${dir}/Cargo.toml`)
    paths.add(`${dir}/src`)
    const build = cargoBuildScript(toml)
    if (build !== false) paths.add(`${dir}/${build ?? 'build.rs'}`)
    for (const f of io.listFiles(`${dir}/src`)) {
      if (!f.endsWith('.rs')) continue
      const content = io.readFile(f)
      if (content === null) continue
      for (const t of includeTargets(f, content)) includes.add(t)
    }
  }
  return { crates, paths: [...paths].sort(), includes: [...includes].sort() }
}

/** Paths git must never count as a build input change (documentation). */
export const DOC_ONLY_EXCLUDES = [
  ':(exclude)**/*.md',
  ':(exclude)**/LICENSE',
  ':(exclude)**/LICENSE.*',
]

/** A `git -C <hsm> …` runner returning trimmed stdout, throwing on failure. */
export type Git = (...args: string[]) => string

/** CargoIo over an hsm repository at one commit (reads blobs, never the worktree). */
export function gitCargoIo(git: Git, sha: string): CargoIo {
  return {
    readFile: (p) => {
      try {
        return git('cat-file', '-p', `${sha}:${p}`)
      } catch {
        return null
      }
    },
    listFiles: (dir) =>
      git('ls-tree', '-r', '--name-only', sha, '--', dir).split('\n').filter(Boolean),
  }
}

/**
 * Distinct commits in from..to that touch the watched `paths` (doc-only
 * excludes applied) or any compile-time `includes` (NO excludes: an
 * `include_str!("../README.md")` compiles that README into the binary).
 */
export function commitsTouching(
  git: Git,
  from: string,
  to: string,
  paths: string[],
  includes: string[]
): Set<string> {
  const list = (specs: string[]) =>
    specs.length
      ? git('rev-list', `${from}..${to}`, '--', ...specs)
          .split('\n')
          .filter(Boolean)
      : []
  return new Set([...list([...paths, ...DOC_ONLY_EXCLUDES]), ...list(includes)])
}

/** A Cargo bundle's full watched set: derived graph + build script + declared extras. */
export function cargoBundlePaths(
  bundle: { buildScript?: string; extraInputs?: string[] },
  derived: DerivedInputs
): string[] {
  return [
    ...derived.paths,
    // A build script outside hsm (e.g. pqctoday-priv/build-wasm.sh) is not an hsm path.
    ...(bundle.buildScript && !bundle.buildScript.startsWith('pqctoday-priv/')
      ? [bundle.buildScript]
      : []),
    ...(bundle.extraInputs ?? []),
  ]
}
