// SPDX-License-Identifier: GPL-3.0-only
/// <reference lib="webworker" />
/**
 * W2 — Web Worker hosting one run of the NIST SP 800-90B tool (WASM).
 *
 * One worker = one run: the client creates a worker per request and cancels
 * by terminating it, which also releases the (up to several hundred MB of)
 * WASM memory a 1M-sample run allocates.
 */
import { runEstimator, type EaModuleFactory } from './runner'
import { makeResultRecord, type NistProgram } from './resultRecord'
import { stageOf, type RunRequest, type WorkerMessage } from './protocol'

const post = (m: WorkerMessage) => (self as unknown as DedicatedWorkerGlobalScope).postMessage(m)

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  // .slice() yields a Uint8Array over a plain ArrayBuffer, as SubtleCrypto requires.
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes.slice()))
  return Array.from(d, (b) => b.toString(16).padStart(2, '0')).join('')
}

self.onmessage = async (ev: MessageEvent<RunRequest>) => {
  const req = ev.data
  if (req?.type !== 'run') return
  try {
    const base = req.baseUrl ?? '/wasm/entropy90b/'
    const program: NistProgram = `ea_${req.tool}`
    // Fetch the wasm bytes ourselves so the record hashes exactly what runs.
    const wasmBytes = new Uint8Array(await (await fetch(`${base}${program}.wasm`)).arrayBuffer())
    const wasmSha256 = await sha256Hex(wasmBytes)
    const factory = (
      (await import(/* @vite-ignore */ `${base}${program}.mjs`)) as { default: EaModuleFactory }
    ).default
    const datasetSha256 = await sha256Hex(req.data)
    const startedAt = new Date().toISOString()
    let lastStage = ''
    const r = await runEstimator(
      factory,
      {
        tool: req.tool,
        data: req.data,
        bitsPerSymbol: req.bitsPerSymbol,
        hI: req.hI,
        extraFlags:
          req.tool === 'restart' && (req.trackFlag === '-i' || req.trackFlag === '-n')
            ? [req.trackFlag]
            : undefined,
        onStdout: (line) => {
          const stage = stageOf(line)
          if (stage && stage !== lastStage) {
            lastStage = stage
            post({ type: 'progress', stage, line })
          }
        },
      },
      { wasmBinary: wasmBytes }
    )
    const record = makeResultRecord({
      dataset: {
        sha256: datasetSha256,
        bytes: req.data.length,
        bitsPerSymbol: req.bitsPerSymbol,
        provenance: req.provenance,
        manifestId: req.manifestId,
      },
      program,
      argv: r.argv,
      runtime: { kind: 'wasm', wasmSha256 },
      startedAt,
      elapsedMs: r.elapsedMs,
      exitCode: r.exitCode,
      pinnedUrandom: false,
      toolJsonText: r.jsonText,
      toolJsonSha256: r.jsonText ? await sha256Hex(new TextEncoder().encode(r.jsonText)) : null,
    })
    post({ type: 'result', record, stdout: r.stdout })
  } catch (e) {
    post({ type: 'error', message: e instanceof Error ? e.message : String(e) })
  }
}
