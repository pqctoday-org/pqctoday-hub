// SPDX-License-Identifier: GPL-3.0-only
/**
 * W3 — the evidence record for one run of the NIST SP 800-90B estimator tool.
 *
 * The record wraps the tool's OWN JSON output (written with `-o`) verbatim and
 * links it to exactly what was run: the dataset (SHA-256), the NIST tool
 * commit, and the SHA-256 of the WebAssembly bytes that executed.
 *
 * Naming rule (plan §4, W3): this is "NIST SP800-90B_EntropyAssessment tool
 * JSON output". It is NOT called, labelled or treated as an "ESV format";
 * that has not been confirmed. A record is not an ESV submission, CSTL
 * analysis, CMVP review or any certificate (plan §1 item 5).
 */

/** Pinned upstream commit the Hub's WASM build is compiled from. */
export const NIST_90B_TOOL_COMMIT = '87c104d0ed4cbc96103e7b8b38d6f2c7e0a6b289'
export const NIST_90B_TOOL_REPO = 'usnistgov/SP800-90B_EntropyAssessment'

export type NistProgram = 'ea_non_iid' | 'ea_iid' | 'ea_restart'

export type DatasetProvenance =
  /** Generated data (D4). Never a measurement of a device. */
  | 'synthetic'
  /** Raw noise-source samples recorded from a device under stated conditions (D2). */
  | 'device-raw-noise'
  /** Conditioned / DRBG output collected as a contrast case (D3) — assessing it is the mistake. */
  | 'conditioned-output-contrast'
  /** Uploaded by the learner; nothing is known about it beyond its hash. */
  | 'user-supplied'

export interface DatasetRef {
  sha256: string
  bytes: number
  bitsPerSymbol: number
  provenance: DatasetProvenance
  /** Manifest id (e.g. "d4-markov-1bit") when the dataset comes from a manifest. */
  manifestId?: string
}

export type RuntimeRef =
  | {
      kind: 'wasm'
      /** SHA-256 of the .wasm bytes that actually executed. */
      wasmSha256: string
      /** Emscripten version string from BUILDINFO.json. */
      compiler?: string
    }
  | {
      kind: 'native'
      /** e.g. "linux/amd64 debian:trixie g++ 14.2.0 -fopenmp" */
      platform: string
      /** For precomputed native results shown at the freeze-day fallback. */
      precomputed: boolean
    }

/** The top level of the NIST tool's JSON, as far as the Hub relies on it. */
export interface NistToolJson {
  IID?: boolean
  type?: string
  errorLevel: number
  errorMessage?: string
  sha256?: string
  filename?: string
  toolVersion?: string
  dateTimeStamp?: string
  commandline?: string
  testCases?: Array<Record<string, unknown> & { testCaseDesc: string }>
}

export interface Sp80090bResultRecord {
  schema: 'pqctoday.entropy.sp800-90b-tool-result/1'
  /** Deliberately NOT "ESV". */
  outputKind: 'nist-sp800-90b-tool-json'
  dataset: DatasetRef
  tool: {
    repo: typeof NIST_90B_TOOL_REPO
    commit: string
    /** VERSION macro reported by the tool (commit 87c104d0 still says "1.1.8"). */
    versionString: string | null
    program: NistProgram
    argv: string[]
  }
  runtime: RuntimeRef
  execution: {
    startedAt: string
    elapsedMs: number
    exitCode: number
    /**
     * true only for parity/unit tests that pin /dev/urandom; learner runs are
     * always false (the IID permutation test and the restart simulation are
     * randomised by the tool itself).
     */
    pinnedUrandom: boolean
  }
  /** The tool's JSON output, verbatim. */
  toolJson: NistToolJson | null
  /** SHA-256 of the exact JSON text the tool wrote. */
  toolJsonSha256: string | null
  /**
   * Whether the tool's own `sha256` of the input it read equals
   * dataset.sha256. false means the record must not be shown as evidence.
   */
  datasetHashConfirmedByTool: boolean
}

export interface MakeRecordInput {
  dataset: DatasetRef
  program: NistProgram
  argv: string[]
  runtime: RuntimeRef
  startedAt: string
  elapsedMs: number
  exitCode: number
  pinnedUrandom: boolean
  toolJsonText: string | null
  toolJsonSha256: string | null
  commit?: string
}

export function makeResultRecord(input: MakeRecordInput): Sp80090bResultRecord {
  const toolJson = input.toolJsonText ? (JSON.parse(input.toolJsonText) as NistToolJson) : null
  return {
    schema: 'pqctoday.entropy.sp800-90b-tool-result/1',
    outputKind: 'nist-sp800-90b-tool-json',
    dataset: input.dataset,
    tool: {
      repo: NIST_90B_TOOL_REPO,
      commit: input.commit ?? NIST_90B_TOOL_COMMIT,
      versionString: toolJson?.toolVersion ?? null,
      program: input.program,
      argv: input.argv,
    },
    runtime: input.runtime,
    execution: {
      startedAt: input.startedAt,
      elapsedMs: input.elapsedMs,
      exitCode: input.exitCode,
      pinnedUrandom: input.pinnedUrandom,
    },
    toolJson,
    toolJsonSha256: input.toolJsonSha256,
    datasetHashConfirmedByTool:
      !!toolJson?.sha256 && toolJson.sha256.toLowerCase() === input.dataset.sha256.toLowerCase(),
  }
}

/** Overall assessed min-entropy from a non-IID or IID run, or null (error / not reported). */
export function assessedMinEntropy(json: NistToolJson | null): number | null {
  if (!json || json.errorLevel !== 0) return null
  const overall = json.testCases?.find((t) => t.testCaseDesc === 'Overall') ?? json.testCases?.[0]
  const h = overall?.hAssessed
  return typeof h === 'number' ? h : null
}
