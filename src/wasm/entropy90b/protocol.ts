// SPDX-License-Identifier: GPL-3.0-only
/** Message protocol between estimatorClient.ts and estimator.worker.ts. */
import type { EstimatorTool } from './runner'
import type { DatasetProvenance, Sp80090bResultRecord } from './resultRecord'

export interface RunRequest {
  type: 'run'
  tool: EstimatorTool
  /** Transferred to the worker. */
  data: Uint8Array
  bitsPerSymbol: number
  hI?: number
  /**
   * Track flag for ea_restart: '-i' (IID) or '-n' (non-IID, the tool's
   * default). Anything else is dropped by the worker.
   */
  trackFlag?: '-i' | '-n'
  provenance: DatasetProvenance
  manifestId?: string
  /** Base URL of the staged artefacts, default "/wasm/entropy90b/". */
  baseUrl?: string
}

export type WorkerMessage =
  | { type: 'progress'; stage: string; line: string }
  | { type: 'result'; record: Sp80090bResultRecord; stdout: string[] }
  | { type: 'error'; message: string }

/**
 * Map a verbose stdout line of the NIST tool to a progress stage, e.g.
 * "Bitstring Markov Estimate: ..." -> "Bitstring Markov". Returns null for
 * lines that do not start a recognised estimator/test section.
 */
export function stageOf(line: string): string | null {
  const m =
    /^(Literal|Bitstring)\s+(Most Common Value|Collision|Markov|Compression|t-Tuple|LRS|MultiMCW Prediction|Lag Prediction|MultiMMC Prediction|LZ78Y Prediction)\s+Estimate/.exec(
      line
    )
  if (m) return `${m[1]} ${m[2]}`
  if (/^Chi square/i.test(line)) return 'Chi-square tests'
  if (/Longest Repeated Substring|longest repeated substring/.test(line)) return 'LRS test'
  if (/^Permutation testing|IID permutation/i.test(line)) return 'Permutation tests'
  if (/X_cutoff/.test(line)) return 'Restart sanity check'
  return null
}
