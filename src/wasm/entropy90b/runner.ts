// SPDX-License-Identifier: GPL-3.0-only
/**
 * Environment-neutral runner for the NIST SP 800-90B estimator tool compiled
 * to WebAssembly (public/wasm/entropy90b/ea_*.mjs + .wasm).
 *
 * Works in a Web Worker and in Node. Each run instantiates a FRESH module
 * instance (the NIST mains keep global state and call exit()), writes the
 * dataset into MEMFS, calls main() with the same argv the native CLI takes,
 * and reads back the tool's own JSON output (`-o`).
 *
 * The caller supplies the module factory (how it is imported differs between
 * a browser worker and Node); see estimator.worker.ts and the tests.
 */

export type EstimatorTool = 'non_iid' | 'iid' | 'restart'

/** Minimal slice of the Emscripten module surface this runner uses. */
export interface EaModule {
  callMain: (args: string[]) => number
  FS: {
    writeFile: (path: string, data: Uint8Array | string) => void
    readFile: (path: string, opts: { encoding: 'utf8' }) => string
    unlink: (path: string) => void
    analyzePath: (path: string) => { exists: boolean }
    mkdir: (path: string) => void
  }
}

export interface EaModuleOverrides {
  print?: (line: string) => void
  printErr?: (line: string) => void
  wasmBinary?: ArrayBuffer | Uint8Array
  instantiateWasm?: (
    imports: WebAssembly.Imports,
    receive: (instance: WebAssembly.Instance) => void
  ) => object
  locateFile?: (path: string, scriptDirectory: string) => string
}

export type EaModuleFactory = (overrides?: EaModuleOverrides) => Promise<EaModule>

export interface EstimatorRunOptions {
  tool: EstimatorTool
  /** Raw samples, one per byte (low `bitsPerSymbol` bits significant). */
  data: Uint8Array
  /** 1..8 */
  bitsPerSymbol: number
  /** ea_restart only: the initial entropy estimate H_I from the sequential run. */
  hI?: number
  /**
   * Verbosity passed as repeated `-v`. Default 2 (i.e. `-v -v`, the tool's
   * "verbose 3" level): at lower levels ea_iid writes `hAssessed` = the
   * symbol width instead of the assessed value into its JSON (upstream
   * behaviour at commit 87c104d0, iid_main.cpp), so 2 is the safe default.
   */
  verbose?: number
  /** Extra CLI flags placed before the positional arguments (e.g. ['-t']). */
  extraFlags?: string[]
  /**
   * TEST/PARITY ONLY. Replaces /dev/urandom with these bytes so the permutation
   * test / restart simulation seed is fixed. Never used for a learner run.
   */
  deterministicUrandom?: Uint8Array
  onStdout?: (line: string) => void
  onStderr?: (line: string) => void
}

export interface EstimatorRunResult {
  tool: EstimatorTool
  argv: string[]
  exitCode: number
  /** Parsed JSON written by the tool with `-o`, or null if it wrote none. */
  json: unknown
  /** Raw JSON text as written by the tool (kept for hashing / evidence). */
  jsonText: string | null
  stdout: string[]
  stderr: string[]
  elapsedMs: number
}

export const INPUT_PATH = '/work/input.bin'
export const OUTPUT_PATH = '/work/result.json'

export function buildArgv(opts: EstimatorRunOptions): string[] {
  const bits = opts.bitsPerSymbol
  if (!Number.isInteger(bits) || bits < 1 || bits > 8) {
    throw new RangeError(`bitsPerSymbol must be an integer 1..8, got ${bits}`)
  }
  const v = opts.verbose ?? 2
  const flags = [...Array.from({ length: v }, () => '-v'), ...(opts.extraFlags ?? [])]
  flags.push('-o', OUTPUT_PATH)
  if (opts.tool === 'restart') {
    if (opts.hI === undefined || !Number.isFinite(opts.hI) || opts.hI < 0) {
      throw new RangeError('ea_restart needs a non-negative hI (initial entropy estimate)')
    }
    // Pass H_I at full double precision; the tool parses it with atof().
    return [...flags, INPUT_PATH, String(bits), formatHI(opts.hI)]
  }
  return [...flags, INPUT_PATH, String(bits)]
}

/** Shortest round-trip decimal for a double (what atof() reads back exactly). */
export function formatHI(h: number): string {
  return String(h)
}

export async function runEstimator(
  factory: EaModuleFactory,
  opts: EstimatorRunOptions,
  overrides: Omit<EaModuleOverrides, 'print' | 'printErr'> = {}
): Promise<EstimatorRunResult> {
  const stdout: string[] = []
  const stderr: string[] = []
  const argv = buildArgv(opts)
  const t0 = now()
  const mod = await factory({
    ...overrides,
    print: (l) => {
      stdout.push(l)
      opts.onStdout?.(l)
    },
    printErr: (l) => {
      stderr.push(l)
      opts.onStderr?.(l)
    },
  })

  if (!mod.FS.analyzePath('/work').exists) mod.FS.mkdir('/work')
  mod.FS.writeFile(INPUT_PATH, opts.data)
  if (opts.deterministicUrandom) {
    mod.FS.unlink('/dev/urandom')
    mod.FS.writeFile('/dev/urandom', opts.deterministicUrandom)
  }

  // In Node the Emscripten glue sets process.exitCode when main() calls
  // exit(); keep the host process's exit code untouched.
  const proc = (globalThis as { process?: { exitCode?: number | string } }).process
  const savedExitCode = proc?.exitCode
  let exitCode: number
  try {
    exitCode = mod.callMain(argv)
  } finally {
    if (proc) proc.exitCode = savedExitCode
  }

  let jsonText: string | null = null
  let json: unknown = null
  if (mod.FS.analyzePath(OUTPUT_PATH).exists) {
    jsonText = mod.FS.readFile(OUTPUT_PATH, { encoding: 'utf8' })
    json = JSON.parse(jsonText)
  }
  return {
    tool: opts.tool,
    argv,
    exitCode,
    json,
    jsonText,
    stdout,
    stderr,
    elapsedMs: now() - t0,
  }
}

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}
