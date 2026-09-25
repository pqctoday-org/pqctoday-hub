// SPDX-License-Identifier: GPL-3.0-only
/**
 * WS-H H-2(a): the WASM baseline targets (wasm-cpp, wasm-rust) — both engines
 * via the hub's own Node CLI core (src/services/acvp/node/cli.ts, unchanged),
 * plus the ExecutionEnvironment record (H-1) for each run. The C++ run also
 * emits THE fixture bundle every other target consumes; the Rust run's own
 * bundle must reproduce the same prompt/IR/plan hashes or the run aborts.
 * Node-only.
 */
import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { writeFileSync } from 'node:fs'
import { sha256Hex } from '../../acvp/ir'
import { runCli } from '../../acvp/node/cli'
import { FIXTURE_NAMES, fixturePath, type FixtureName } from '../../acvp/node/fixtures'
import { ENGINE_ARTIFACTS, type EngineId } from '../../acvp/node/loadEngines'
import { withEnvId, type ExecutionEnvironment } from '../../../data/validation/executionEnvironment'

/**
 * Build facts for the vendored WASM engines that cannot be observed at run
 * time. Every value is transcribed from public/wasm/wasm-provenance.json (the
 * named rebuild note) or the named hsm source at the pinned commit — update
 * together with a rebuild.
 */
export const WASM_BUILD_FACTS: Record<
  EngineId,
  {
    implementation: string
    provenanceCommitField: string
    build: ExecutionEnvironment['build']
    openssl: ExecutionEnvironment['dependencies']['openssl']
    cryptoBackend: ExecutionEnvironment['dependencies']['cryptoBackend']
    entropy: string
    notes: string[]
  }
> = {
  cpp: {
    implementation: 'pqctoday-hsm softhsmv3 C++ (OpenSSL 3.6 backend), Emscripten WASM',
    provenanceCommitField: 'softhsm-cpp-engine.hsmCommit',
    build: {
      buildSystem: 'hsm scripts/build-wasm.sh (CMake, SKIP_OPENSSL=1)',
      compiler: 'emcc 6.0.4 (workspace emsdk; its own clang)',
      flags: null,
      profile: 'Release (build-wasm.sh default)',
      features: 'WITH_LIBOQS forced OFF for Emscripten (CMakeLists.txt D-4)',
      location:
        'host macOS via emsdk (no Xcode) — wasm-provenance.json softhsm-cpp-engine._rebuild20260923',
    },
    openssl: {
      linked: true,
      version: 'OpenSSL 3.6.3 (static libcrypto.a for wasm32)',
      source:
        'build record, not runtime: hsm scripts/build-openssl-wasm.sh OSSL_VERSION=3.6.3 at 7795799b; deps/openssl-wasm reused with libcrypto.a sha256 204eb4d7… verified (wasm-provenance.json _rebuild20260923). The module exports no OpenSSL_version().',
    },
    cryptoBackend: { name: 'OpenSSL libcrypto (EVP), statically linked', version: '3.6.3' },
    entropy:
      'Emscripten getentropy() → host crypto RNG (Node 22 webcrypto); not exercised by decapsulation/verification',
    notes: [
      'build.flags: not recorded by build-wasm.sh; the provenance record names the script, not its flag set',
    ],
  },
  rust: {
    implementation: 'pqctoday-hsm softhsmrustv3 (Rust), wasm-bindgen WASM',
    provenanceCommitField: 'softhsmrustv3-engine.hsmCommit',
    build: {
      buildSystem: 'hsm rust/build-wasm-bundle.sh (wasm-pack --target bundler --release)',
      compiler: 'rustc 1.96.0 (ac68faa20 2026-05-25), cargo 1.96.0 — pqc-rust container',
      flags: "RUSTFLAGS='-C link-arg=-zstack-size=8388608 -C link-arg=--export-table'",
      profile: 'release (opt-level="s", lto=true)',
      features:
        'acvp (build-wasm-bundle.sh; RNG-seeding hook via C_Initialize pReserved — not used: the CLI passes NULL)',
      location:
        'pqc-rust container (rust:1) — wasm-provenance.json softhsmrustv3-engine._rebuild20260923/_reanchor20260923',
    },
    openssl: {
      linked: false,
      version: null,
      source:
        'wasm-bindgen module; the ML-KEM/ML-DSA path is pure Rust (no libcrypto in the crate graph for wasm32)',
    },
    cryptoBackend: {
      name: 'RustCrypto ml-kem (patched: rust/ml-kem-patched) + fips204 (patched: rust/fips204-patched)',
      version: 'ml-kem 0.2.3, fips204 0.4.6 (rust/Cargo.lock @ 417c47a2)',
    },
    entropy:
      'getrandom (js feature) → crypto.getRandomValues (Node 22 webcrypto); not exercised by decapsulation/verification',
    notes: [
      'Provenance: built at hsm 7795799b, then rebuilt at 417c47a2 and proven byte-identical (sha256 a4582ff0…) — wasm-provenance.json _reanchor20260923.',
    ],
  },
}

const sh = (cmd: string, args: string[], cwd?: string): string | null => {
  try {
    return execFileSync(cmd, args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return null
  }
}

const provenanceCommit = (
  repoRoot: string,
  bundle: string
): { short: string | null; builtAt: string | null } => {
  const doc = JSON.parse(
    readFileSync(path.join(repoRoot, 'public/wasm/wasm-provenance.json'), 'utf8')
  ) as {
    bundles: Array<{ name: string; hsmCommit?: string; builtAt?: string }>
  }
  const b = doc.bundles.find((x) => x.name === bundle)
  return { short: b?.hsmCommit ?? null, builtAt: b?.builtAt ?? null }
}

export interface WasmRunOptions {
  repoRoot: string
  runDir: string
  /** Where full bundles (prompt/ir/plan — too big to commit) are written for native runners. */
  bundleDir: string
  /** Sibling pqctoday-hsm checkout used ONLY to `git rev-parse` abbreviated provenance commits. */
  hsmRepo: string
}

export const buildWasmEnvironment = async (
  opts: WasmRunOptions,
  engine: EngineId,
  artifactSha256: string | null,
  bundleManifestSha256: string,
  schemaId: string,
  vsId: number
): Promise<ExecutionEnvironment> => {
  const facts = WASM_BUILD_FACTS[engine]
  const art = ENGINE_ARTIFACTS[engine]
  const prov = provenanceCommit(opts.repoRoot, art.bundle)
  const full = prov.short
    ? sh('git', ['-C', opts.hsmRepo, 'rev-parse', '--verify', `${prov.short}^{commit}`])
    : null
  const hubHead = sh('git', ['-C', opts.repoRoot, 'rev-parse', 'HEAD'])
  const macVer = sh('sw_vers', ['-productVersion'])
  const cpuModel = sh('sysctl', ['-n', 'machdep.cpu.brand_string'])
  const pkg = JSON.parse(readFileSync(path.join(opts.repoRoot, 'package.json'), 'utf8')) as {
    version: string
  }
  return withEnvId({
    envVersion: 'pqctoday.execution-environment/1',
    recordedAt: new Date().toISOString(),
    target: {
      id: `wasm-${engine}`,
      label: `WebAssembly (Node 22, host V8) — ${engine === 'cpp' ? 'C++' : 'Rust'} engine`,
      class: 'wasm',
    },
    os: {
      name:
        os.platform() === 'darwin'
          ? `macOS ${macVer ?? os.release()} (host running Node)`
          : os.type(),
      version: macVer ?? os.release(),
      kernel: `${os.type()} ${os.release()}`,
      image: { name: null, id: null },
    },
    arch: { machine: 'wasm32', pointerBits: 32, endianness: 'little' },
    cpu: { model: cpuModel ?? (os.cpus()[0]?.model || null), board: null, features: null },
    emulation: {
      emulated: false,
      mechanism: null,
      hostMachine: os.arch(),
      detection: `WebAssembly JIT-compiled by V8 (Node ${process.version}) on the host ${os.arch()} CPU — a VM, not ISA emulation`,
    },
    engine: {
      id: engine,
      implementation: facts.implementation,
      artifactKind: 'wasm',
      artifactPath: art.wasm,
      artifactSha256,
      sourceRepository: 'https://github.com/pqctoday-org/pqctoday-hsm',
      sourceCommit: full,
      sourceCommitEvidence: full
        ? `public/wasm/wasm-provenance.json ${facts.provenanceCommitField} "${prov.short}" resolved with git rev-parse in ${path.basename(opts.hsmRepo)}`
        : `wasm-provenance.json ${facts.provenanceCommitField} "${prov.short}" could not be resolved to a full commit`,
      builtAt: prov.builtAt,
    },
    build: facts.build,
    dependencies: {
      openssl: facts.openssl,
      cryptoBackend: facts.cryptoBackend,
      runtime: [{ name: 'node', version: process.version }],
    },
    acceleration: {
      state: 'none',
      detail:
        'no hardware accelerator: WebAssembly bytecode executed by the V8 JIT on the host CPU',
    },
    entropy: { source: facts.entropy, exercisedByTestedOperations: false },
    runner: {
      name: 'acvp-respond (hub Node CLI, src/services/acvp/node/cli.ts)',
      version: `${pkg.version}+${hubHead ? hubHead.slice(0, 12) : 'unknown'}`,
      language: 'typescript (tsx)',
      languageVersion: process.version,
    },
    fixtureBundle: { manifestSha256: bundleManifestSha256, schemaId, vsId },
    notes: [...facts.notes, `hub commit ${hubHead ?? 'unknown'}`],
  })
}

const writeJson = (p: string, v: unknown) => {
  mkdirSync(path.dirname(p), { recursive: true })
  writeFileSync(p, `${JSON.stringify(v, null, 2)}\n`)
}

/** Run both WASM engines on every fixture and write their evidence + the committed bundle manifests. */
export const runWasmBaseline = async (opts: WasmRunOptions): Promise<string[]> => {
  const log: string[] = []
  for (const name of FIXTURE_NAMES as readonly FixtureName[]) {
    const prompt = fixturePath(opts.repoRoot, name, 'prompt.json')
    const expected = fixturePath(opts.repoRoot, name, 'expectedResults.json')
    const manifests: Record<string, { text: string; json: Record<string, unknown> }> = {}
    for (const engine of ['cpp', 'rust'] as const) {
      const out = path.join(opts.runDir, 'targets', `wasm-${engine}`, name)
      const bundle = path.join(opts.bundleDir, engine, name)
      const res = await runCli(
        { prompt, engine, out, expected, evidence: true, emitBundle: bundle },
        opts.repoRoot
      )
      log.push(res.summary)
      if (res.exitCode !== 0) throw new Error(`wasm-${engine} ${name}: exit ${res.exitCode}`)
      const text = readFileSync(path.join(bundle, 'manifest.json'), 'utf8')
      manifests[engine] = { text, json: JSON.parse(text) as Record<string, unknown> }
    }
    // Same inputs on both engines, or the comparison is meaningless.
    const c = manifests.cpp.json
    const r = manifests.rust.json
    const same = (k: 'ir' | 'plan') =>
      (c.canonicalSha256 as Record<string, string>)[k] ===
      (r.canonicalSha256 as Record<string, string>)[k]
    if (
      !same('ir') ||
      !same('plan') ||
      (c.files as Record<string, string>)['prompt.json'] !==
        (r.files as Record<string, string>)['prompt.json']
    ) {
      throw new Error(
        `${name}: C++ and Rust CLI runs derived different IR/plan from the same prompt`
      )
    }
    // THE bundle = the C++ emission; commit its manifest, keep the full bundle for native runners.
    const committed = path.join(opts.runDir, 'bundles', name, 'manifest.json')
    mkdirSync(path.dirname(committed), { recursive: true })
    copyFileSync(path.join(opts.bundleDir, 'cpp', name, 'manifest.json'), committed)
    const bundleSha = await sha256Hex(manifests.cpp.text)
    for (const engine of ['cpp', 'rust'] as const) {
      const ev = JSON.parse(
        readFileSync(
          path.join(opts.runDir, 'targets', `wasm-${engine}`, name, 'evidence.json'),
          'utf8'
        )
      ) as { engine: { artifactSha256: string | null } }
      const env = await buildWasmEnvironment(
        opts,
        engine,
        ev.engine.artifactSha256,
        bundleSha,
        c.schemaId as string,
        c.vsId as number
      )
      writeJson(
        path.join(opts.runDir, 'targets', `wasm-${engine}`, name, 'execution-environment.json'),
        env
      )
    }
    log.push(
      `${name}: bundle manifest ${bundleSha} (full bundle: ${path.join(opts.bundleDir, 'cpp', name)})`
    )
  }
  return log
}
