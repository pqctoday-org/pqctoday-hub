// SPDX-License-Identifier: GPL-3.0-only
/**
 * W2 — wall time and peak memory of ONE WASM estimator run in Node.
 *
 *   npx tsx scripts/entropy-90b/measure-node.ts <tool> <file.bin> <bits> [hI]
 *
 * Run each measurement in a fresh process (maxRSS is a process-lifetime peak).
 * Prints one JSON line: elapsed ms, peak RSS, the RSS before the run, and the
 * WebAssembly memory size reached (via the memory export of the instance).
 */
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  runEstimator,
  type EaModuleFactory,
  type EstimatorTool,
} from '../../src/wasm/entropy90b/runner.ts'

const [tool, file, bits, hI] = process.argv.slice(2) as [EstimatorTool, string, string, string?]
const WASM_DIR = resolve(import.meta.dirname, '../../public/wasm/entropy90b')
const factory = (
  (await import(pathToFileURL(join(WASM_DIR, `ea_${tool}.mjs`)).href)) as {
    default: EaModuleFactory
  }
).default

let memory: WebAssembly.Memory | undefined
const data = new Uint8Array(readFileSync(file))
const rssBefore = process.memoryUsage().rss
const r = await runEstimator(
  factory,
  { tool, data, bitsPerSymbol: Number(bits), hI: hI ? Number(hI) : undefined },
  {
    // Same as the default instantiation, but keep a handle on the memory export.
    instantiateWasm: (imports, receive) => {
      const bytes = readFileSync(join(WASM_DIR, `ea_${tool}.wasm`))
      void WebAssembly.instantiate(bytes, imports).then(({ instance }) => {
        memory = Object.values(instance.exports).find(
          (e): e is WebAssembly.Memory => e instanceof WebAssembly.Memory
        )
        receive(instance)
      })
      return {}
    },
  }
)
const overall = (r.json as { testCases?: Array<Record<string, unknown>> } | null)?.testCases?.find(
  (t) => t.testCaseDesc === 'Overall'
)
console.log(
  JSON.stringify({
    tool,
    file,
    bits: Number(bits),
    samples: data.length,
    exitCode: r.exitCode,
    elapsedMs: Math.round(r.elapsedMs),
    peakRssMiB: Math.round(process.resourceUsage().maxRSS / 1024),
    rssBeforeRunMiB: Math.round(rssBefore / 2 ** 20),
    wasmMemoryMiB: memory ? Math.round(memory.buffer.byteLength / 2 ** 20) : null,
    hAssessed: overall?.hAssessed ?? null,
    node: process.version,
  })
)
