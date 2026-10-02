// SPDX-License-Identifier: GPL-3.0-only
//
// Main-thread side of the "Discovering certificates" lesson: owns the
// dedicated worker (its own Rust engine instance — see certDiscovery.worker.ts)
// and turns the worker's call records into ordinary Pkcs11LogEntry rows, so
// the lesson's calls show up in the same inline step trace and Inspect log as
// every other lesson's.
import type { Pkcs11LogEntry } from '@/wasm/softhsm'
import type { CallRecord, FlowResult, ProvisionResult } from './certDiscoveryCore'
import { rvName } from './certDiscoveryCore'

type Phase = 'provision' | 'short' | 'long'
type PhaseResult<P extends Phase> = P extends 'provision' ? ProvisionResult : FlowResult

export const ISOLATED_ENGINE_LABEL = 'rust (isolated lesson engine)'

let worker: Worker | null = null
let seq = 0
const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>()

const getWorker = (): Worker => {
  if (!worker) {
    worker = new Worker(new URL('./certDiscovery.worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (ev: MessageEvent) => {
      const { type, requestId, result, error } = ev.data as {
        type: 'result' | 'error'
        requestId: number
        result?: unknown
        error?: string
      }
      const p = pending.get(requestId)
      if (!p) return
      pending.delete(requestId)
      if (type === 'result') p.resolve(result)
      else p.reject(new Error(error ?? 'lesson engine error'))
    }
    worker.onerror = (ev) => {
      for (const p of pending.values()) p.reject(new Error(ev.message || 'lesson worker failed'))
      pending.clear()
    }
  }
  return worker
}

/** Discard the lesson engine; the next phase starts on a brand-new instance. */
export const resetLessonEngine = (): void => {
  worker?.terminate()
  worker = null
  for (const p of pending.values()) p.reject(new Error('lesson engine reset'))
  pending.clear()
}

export const runLessonPhase = <P extends Phase>(phase: P): Promise<PhaseResult<P>> => {
  if (typeof Worker === 'undefined') {
    return Promise.reject(
      new Error('This lesson needs Web Workers (its engine runs in a dedicated worker).')
    )
  }
  const requestId = ++seq
  return new Promise<PhaseResult<P>>((resolve, reject) => {
    pending.set(requestId, { resolve: resolve as (v: unknown) => void, reject })
    getWorker().postMessage({ type: phase, requestId })
  })
}

/** CallRecord → the shared log's entry shape. */
export const toLogEntries = (calls: CallRecord[]): Pkcs11LogEntry[] => {
  const ts = new Date().toLocaleTimeString('en-US', { hour12: false })
  return calls.map((c) => ({
    id: Math.random(),
    timestamp: ts,
    fn: c.fn,
    args: c.args,
    rvHex: `0x${c.rv.toString(16).padStart(8, '0')}`,
    rvName: rvName(c.rv),
    ms: c.ms,
    ok: c.rv === 0,
    engineName: ISOLATED_ENGINE_LABEL,
  }))
}
