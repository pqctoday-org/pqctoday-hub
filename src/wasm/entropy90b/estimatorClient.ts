// SPDX-License-Identifier: GPL-3.0-only
/**
 * W2 — main-thread API for running the NIST SP 800-90B tool (WASM) in a Web
 * Worker, with progress and cancel.
 *
 *   const { record } = await runSp80090b(
 *     { tool: 'non_iid', data, bitsPerSymbol: 8, provenance: 'synthetic' },
 *     { onProgress: (s) => setStage(s), signal: abort.signal },
 *   )
 *
 * Cancel = AbortSignal -> worker.terminate(); the promise rejects with an
 * AbortError DOMException. The UI (a later step) builds on this; no UI here.
 */
import type { RunRequest, WorkerMessage } from './protocol'
import type { Sp80090bResultRecord } from './resultRecord'

export interface RunSp80090bOptions {
  onProgress?: (stage: string, line: string) => void
  signal?: AbortSignal
}

export interface RunSp80090bResult {
  record: Sp80090bResultRecord
  stdout: string[]
}

export function runSp80090b(
  req: Omit<RunRequest, 'type'>,
  opts: RunSp80090bOptions = {}
): Promise<RunSp80090bResult> {
  return new Promise((resolve, reject) => {
    if (opts.signal?.aborted) {
      reject(new DOMException('Estimator run cancelled', 'AbortError'))
      return
    }
    const worker = new Worker(new URL('./estimator.worker.ts', import.meta.url), { type: 'module' })
    const cleanup = () => {
      worker.terminate()
      opts.signal?.removeEventListener('abort', onAbort)
    }
    const onAbort = () => {
      cleanup()
      reject(new DOMException('Estimator run cancelled', 'AbortError'))
    }
    opts.signal?.addEventListener('abort', onAbort, { once: true })
    worker.onmessage = (ev: MessageEvent<WorkerMessage>) => {
      const m = ev.data
      if (m.type === 'progress') opts.onProgress?.(m.stage, m.line)
      else if (m.type === 'result') {
        cleanup()
        resolve({ record: m.record, stdout: m.stdout })
      } else {
        cleanup()
        reject(new Error(m.message))
      }
    }
    worker.onerror = (ev) => {
      cleanup()
      reject(new Error(ev.message || 'estimator worker failed'))
    }
    // Copy so the caller keeps its buffer; the copy is transferred.
    const data = req.data.slice()
    const msg: RunRequest = { ...req, type: 'run', data }
    worker.postMessage(msg, [data.buffer])
  })
}
