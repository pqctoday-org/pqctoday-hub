// SPDX-License-Identifier: GPL-3.0-only
// Unit tests for the Cargo build-graph derivation behind check-wasm-provenance.ts.
// Pure: fixture manifests and an in-memory tree, no hsm checkout. The historical
// replay against real hsm commits is wasm-build-inputs.local.test.ts.
import { describe, expect, it } from 'vitest'
import {
  cargoBuildScript,
  cargoBundlePaths,
  cargoPathDeps,
  deriveCargoInputs,
  includeTargets,
  type CargoIo,
} from './wasm-build-inputs'

describe('cargoPathDeps', () => {
  it('reads inline-table and table-form path dependencies', () => {
    const toml = [
      '[package]',
      'name = "x"',
      '[dependencies]',
      'kmip = { path = "../kmip", default-features = false }',
      'serde = "1"',
      '[dependencies.engine]',
      'path = "../rust"',
      'features = ["a"]',
    ].join('\n')
    expect(cargoPathDeps(toml)).toEqual(['../kmip', '../rust'])
  })

  it('reads build, target-specific and [patch] dependencies', () => {
    const toml = [
      '[build-dependencies]',
      'gen = { path = "gen" }',
      '[target.\'cfg(target_arch = "wasm32")\'.dependencies]',
      'shim = { path = "shim" }',
      '[patch.crates-io]',
      'fips204 = { path = "fips204-patched" }',
    ].join('\n')
    expect(cargoPathDeps(toml)).toEqual(['gen', 'shim', 'fips204-patched'])
  })

  it('SABOTAGE: dev-dependencies never count, in any spelling', () => {
    const toml = [
      '[dev-dependencies]',
      'engine = { path = "../rust", features = ["test-support"] }',
      "[target.'cfg(unix)'.dev-dependencies]",
      'x = { path = "x" }',
      '[dev-dependencies.y]',
      'path = "y"',
      '[package]',
      'name = "z"',
    ].join('\n')
    expect(cargoPathDeps(toml)).toEqual([])
  })

  it('ignores comments and a `path` that belongs to a [lib] or [[bin]] target', () => {
    const toml = [
      '[lib]',
      'path = "src/lib.rs"',
      '[[bin]]',
      'path = "bin/main.rs"',
      '[dependencies]',
      '# old = { path = "../old" }',
      'new = { path = "../new" } # the live one',
    ].join('\n')
    expect(cargoPathDeps(toml)).toEqual(['../new'])
  })
})

describe('cargoBuildScript', () => {
  it('defaults, custom path, and build = false', () => {
    expect(cargoBuildScript('[package]\nname = "a"')).toBeNull()
    expect(cargoBuildScript('[package]\nbuild = "tools/gen.rs"')).toBe('tools/gen.rs')
    expect(cargoBuildScript('[package]\nbuild = false')).toBe(false)
  })
})

describe('includeTargets', () => {
  it('resolves literal include paths against the including file', () => {
    const src = [
      'const P: &[u8] = include_bytes!("../kat/p256.der");',
      '#![doc = include_str!("../README.md")]',
      'include!("gen/table.rs");',
    ].join('\n')
    expect(includeTargets('rust/src/ffi.rs', src)).toEqual([
      'rust/kat/p256.der',
      'rust/README.md',
      'rust/src/gen/table.rs',
    ])
  })

  it('does not invent a path for OUT_DIR includes (build.rs is already an input)', () => {
    expect(
      includeTargets('a/src/c.rs', 'include!(concat!(env!("OUT_DIR"), "/constants.rs"));')
    ).toEqual([])
  })
})

/** In-memory tree: path -> contents. */
const fakeIo = (tree: Record<string, string>): CargoIo => ({
  readFile: (p) => tree[p] ?? null,
  listFiles: (dir) => Object.keys(tree).filter((p) => p.startsWith(`${dir}/`)),
})

describe('deriveCargoInputs', () => {
  // The shape that broke cacp-kmip: wasm -> kmip -> rust, plus a nested crate
  // inside rust/ that the build never uses, plus committed build output.
  const tree = {
    'wasm/Cargo.toml': '[dependencies]\nkmip = { path = "../kmip" }\nengine = { path = "../rust" }',
    'wasm/src/lib.rs': 'pub fn f() {}',
    'kmip/Cargo.toml':
      '[dependencies]\nengine = { path = "../rust" }\n[dev-dependencies]\nt = { path = "../testkit" }',
    'kmip/src/lib.rs': '',
    'rust/Cargo.toml':
      '[workspace]\nmembers = ["bench-harness"]\n[dependencies]\npatched = { path = "patched" }',
    'rust/src/ffi.rs': 'const K: &[u8] = include_bytes!("../kat/k.der");',
    'rust/patched/Cargo.toml': '[package]\nname = "patched"',
    'rust/patched/src/lib.rs': '#![doc = include_str!("../README.md")]',
    'rust/bench-harness/Cargo.toml': '[package]\nname = "bench"',
    'rust/pkg_bundler/softhsmrustv3_bg.wasm': 'binary',
  }
  const d = deriveCargoInputs('wasm/Cargo.toml', fakeIo(tree))

  it('walks the path-dependency closure transitively, root first', () => {
    expect(d.crates).toEqual(['wasm', 'kmip', 'rust', 'rust/patched'])
  })

  it('THE MISS: a linked crate (rust) is watched from the kmip bundle', () => {
    expect(d.paths).toContain('rust/src')
    expect(d.paths).toContain('rust/Cargo.toml')
  })

  it('THE FALSE ALARMS: nested unused crates, build output and dev-only deps are not inputs', () => {
    const all = [...d.paths, ...d.includes]
    expect(all.some((p) => p.startsWith('rust/bench-harness'))).toBe(false)
    expect(all.some((p) => p.startsWith('rust/pkg_bundler'))).toBe(false)
    expect(all.some((p) => p.startsWith('testkit'))).toBe(false)
    // whole directories are never watched — only a crate's manifest, src and build script
    expect(d.paths).not.toContain('rust')
    expect(d.paths).not.toContain('kmip')
  })

  it('lockfile and .cargo count only for the build root', () => {
    expect(d.paths).toContain('wasm/Cargo.lock')
    expect(d.paths).toContain('wasm/.cargo')
    expect(d.paths).not.toContain('rust/Cargo.lock')
    expect(d.paths).not.toContain('kmip/.cargo')
  })

  it('compile-time includes are inputs, including a README compiled in as docs', () => {
    expect(d.includes).toEqual(['rust/kat/k.der', 'rust/patched/README.md'])
  })

  it('SABOTAGE: a path dependency with no Cargo.toml fails loudly rather than shrinking the set', () => {
    expect(() =>
      deriveCargoInputs(
        'a/Cargo.toml',
        fakeIo({ 'a/Cargo.toml': '[dependencies]\nb = { path = "../b" }' })
      )
    ).toThrow(/no Cargo.toml at b/)
  })
})

describe('cargoBundlePaths', () => {
  it('adds the hsm build script and declared extras, never a priv-repo script', () => {
    const d = { crates: [], paths: ['rust/src'], includes: [] }
    expect(cargoBundlePaths({ buildScript: 'rust/build-wasm-bundle.sh' }, d)).toEqual([
      'rust/src',
      'rust/build-wasm-bundle.sh',
    ])
    expect(
      cargoBundlePaths(
        { buildScript: 'pqctoday-priv/build-wasm.sh', extraInputs: ['src/vendor/pkcs11-provider'] },
        d
      )
    ).toEqual(['rust/src', 'src/vendor/pkcs11-provider'])
  })
})
