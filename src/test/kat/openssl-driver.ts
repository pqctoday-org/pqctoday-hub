// SPDX-License-Identifier: GPL-3.0-only
/**
 * openssl-driver — Node-mode harness for driving public/wasm/openssl.wasm
 * directly from vitest (no Web Worker abstraction).
 *
 * The Emscripten bundle was compiled with `-sENVIRONMENT=web,worker,node`
 * (the Emscripten default), so the same `createOpenSSLModule` factory the
 * Web Worker uses also runs in Node. This file owns the boring bits —
 * resolving paths to the .wasm + .cnf, seeding entropy, writing the
 * minimal openssl.cnf to the four well-known locations.
 *
 * Crypto-primitive KAT tests import this driver and invoke `runOpenssl`
 * for each ACVP / RFC vector. Each call gets a fresh module instance
 * (the WASM is built with EXIT_RUNTIME=1, same constraint as the worker).
 */
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { webcrypto } from 'node:crypto'

// Vitest runs with cwd = repo root, so resolve openssl.wasm via cwd
// instead of `import.meta.url` (which under Vite's transform isn't a
// file:// URL and trips fileURLToPath).
const REPO_ROOT = process.cwd()
const WASM_DIR = join(REPO_ROOT, 'public', 'wasm')
const OPENSSL_JS = join(WASM_DIR, 'openssl.js')

interface OpenSSLModule {
  callMain: (args: string[]) => number
  FS: {
    writeFile: (path: string, data: Uint8Array | string) => void
    readFile: (path: string, opts?: { encoding?: 'utf8' | 'binary' }) => Uint8Array | string
    unlink: (path: string) => void
    mkdir: (path: string) => void
    stat: (path: string) => unknown
  }
  ENV?: Record<string, string>
}

interface ModuleFactory {
  (cfg: {
    noInitialRun: boolean
    print: (text: string) => void
    printErr: (text: string) => void
    locateFile: (path: string) => string
  }): Promise<OpenSSLModule>
}

const MINIMAL_OPENSSL_CNF = `
openssl_conf = openssl_init
[openssl_init]
providers = provider_sect
[provider_sect]
default = default_sect
legacy = legacy_sect
[default_sect]
activate = 1
[legacy_sect]
activate = 1
[req]
distinguished_name = req_distinguished_name
[req_distinguished_name]
`

let factoryCache: ModuleFactory | null = null

function loadFactory(): ModuleFactory {
  if (factoryCache) return factoryCache
  // openssl.js is a UMD that exposes `module.exports = createOpenSSLModule`
  // in CommonJS. Vitest/Vite intercepts `require()` calls and rewrites them
  // into Vite module graph lookups that don't understand UMD globals. We
  // bypass that by reading the file source and evaluating it under our own
  // CommonJS sandbox (module.exports + require shims).
  const src = readFileSync(OPENSSL_JS, 'utf-8')
  const shimModule: { exports: unknown } = { exports: {} }
  const shimRequire = createRequire(`file://${join(REPO_ROOT, 'package.json')}`)
  // The factory function references node:fs / node:path under
  // ENVIRONMENT_IS_NODE. Hand them through the require shim.
  const wrapped = new Function('module', 'exports', 'require', '__dirname', '__filename', src) as (
    m: typeof shimModule,
    e: unknown,
    r: typeof shimRequire,
    d: string,
    f: string
  ) => void
  wrapped(shimModule, shimModule.exports, shimRequire, WASM_DIR, OPENSSL_JS)
  const exported = shimModule.exports as ModuleFactory | { default: ModuleFactory }
  const factory = (typeof exported === 'function' ? exported : exported.default) as ModuleFactory
  if (typeof factory !== 'function') {
    throw new Error(
      `openssl.js did not export a factory function (got ${typeof exported}); is this the right file?`
    )
  }
  factoryCache = factory
  return factory
}

export async function newModule(opts: { quiet?: boolean } = {}): Promise<OpenSSLModule> {
  const factory = loadFactory()
  const stdout: string[] = []
  const stderr: string[] = []
  // Always capture, regardless of quiet flag — quiet just suppresses the
  // mirror to console. Tests read from the captured arrays via runOpenssl.
  const print = (text: string) => {
    stdout.push(text)
    if (!opts.quiet) process.stdout.write(text + '\n')
  }
  const printErr = (text: string) => {
    stderr.push(text)
    if (!opts.quiet) process.stderr.write(text + '\n')
  }
  const M = await factory({
    noInitialRun: true,
    print,
    printErr,
    locateFile: (path: string) => (path.endsWith('.wasm') ? join(WASM_DIR, 'openssl.wasm') : path),
  })
  configureEnvironment(M)
  // Stash captured streams so tests can inspect them if needed.
  ;(M as unknown as { _stdout: string[]; _stderr: string[] })._stdout = stdout
  ;(M as unknown as { _stdout: string[]; _stderr: string[] })._stderr = stderr
  return M
}

function configureEnvironment(M: OpenSSLModule): void {
  // 4 KB of crypto-strong entropy for genpkey.
  try {
    const seed = new Uint8Array(4096)
    webcrypto.getRandomValues(seed)
    try {
      M.FS.writeFile('/random.seed', seed)
    } catch {
      /* ignore */
    }
    try {
      M.FS.writeFile('/dev/urandom', seed)
    } catch {
      /* ignore */
    }
  } catch {
    /* ignore */
  }
  for (const dir of ['/ssl', '/usr', '/usr/local', '/usr/local/ssl', '/openssl-wasm']) {
    try {
      M.FS.mkdir(dir)
    } catch {
      /* already exists — fine */
    }
  }
  const cnfBytes = new TextEncoder().encode(MINIMAL_OPENSSL_CNF)
  for (const path of [
    '/ssl/openssl.cnf',
    '/usr/local/ssl/openssl.cnf',
    '/openssl-wasm/openssl.cnf',
    '/openssl.cnf',
  ]) {
    try {
      M.FS.writeFile(path, cnfBytes)
    } catch {
      /* ignore */
    }
  }
  if (M.ENV) {
    M.ENV['OPENSSL_CONF'] = '/ssl/openssl.cnf'
    M.ENV['RANDFILE'] = '/random.seed'
  }
}

export function runOpenssl(
  M: OpenSSLModule,
  args: string[]
): { rc: number; stdout: string; stderr: string } {
  const before = (M as unknown as { _stdout: string[]; _stderr: string[] })._stdout?.length ?? 0
  const beforeErr = (M as unknown as { _stdout: string[]; _stderr: string[] })._stderr?.length ?? 0
  let rc = -1
  try {
    rc = M.callMain(args)
  } catch (err) {
    const e = err as { name?: string; status?: number }
    if (e?.name === 'ExitStatus') rc = typeof e.status === 'number' ? e.status : 1
    else throw err
  }
  const stdoutBuf =
    (M as unknown as { _stdout: string[]; _stderr: string[] })._stdout?.slice(before) ?? []
  const stderrBuf =
    (M as unknown as { _stdout: string[]; _stderr: string[] })._stderr?.slice(beforeErr) ?? []
  return { rc, stdout: stdoutBuf.join('\n'), stderr: stderrBuf.join('\n') }
}

/** Convenience helpers for tests. */
export function writeFile(M: OpenSSLModule, path: string, data: Uint8Array | string): void {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data
  M.FS.writeFile(path, bytes)
}

export function readFileBin(M: OpenSSLModule, path: string): Uint8Array {
  return M.FS.readFile(path) as Uint8Array
}

export function readFileText(M: OpenSSLModule, path: string): string {
  return new TextDecoder().decode(M.FS.readFile(path) as Uint8Array)
}

export function fileExists(M: OpenSSLModule, path: string): boolean {
  try {
    M.FS.stat(path)
    return true
  } catch {
    return false
  }
}

/** Load the openssl.wasm artifact's bytes — useful for ensuring CI didn't ship
 *  a placeholder. Tests can also assert the bundle was rebuilt by checking
 *  for the `_pqctoday_cms_init` symbol via runOpenssl trial. */
export function readWasmBytes(): Uint8Array {
  return new Uint8Array(readFileSync(join(WASM_DIR, 'openssl.wasm')))
}
