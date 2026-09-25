// SPDX-License-Identifier: GPL-3.0-only
/**
 * The single prompt → response pipeline shared by the browser panel and the
 * Node CLI (F-8). Neither caller re-implements parsing, dispatch or
 * serialization; they differ only in how the engine module is loaded and
 * where the bytes come from / go to. No I/O and no network here.
 */
import { canonicalJson, sha256Hex, type AcvpPromptIR, type JsonObject } from './ir'
import { parsePromptText } from './parser'
import {
  executePlan,
  planVectorSet,
  type AcvpEngine,
  type CaseResult,
  type ExecutionPlan,
} from './dispatch'
import { buildResponse, type BuiltResponse } from './response'
import { buildEvidence } from './evidence'
import { compareToExpected, type GoldenComparison } from './compare'
import type { PinnedVectorSetSchema } from './schemas/registry'
import type { SchemaDiagnostic } from './schemaValidator'

export interface PreparedPrompt {
  ir: AcvpPromptIR
  schema: PinnedVectorSetSchema
  plan: ExecutionPlan
  promptSha256: string
}

export type PrepareResult =
  ({ ok: true } & PreparedPrompt) | { ok: false; diagnostics: SchemaDiagnostic[] }

/** Parse + validate + plan. Engine-free, so the UI can show diagnostics before loading WASM. */
export const preparePrompt = async (promptText: string): Promise<PrepareResult> => {
  const parsed = parsePromptText(promptText)
  if (!parsed.ok) return parsed
  return {
    ok: true,
    ir: parsed.ir,
    schema: parsed.schema,
    plan: planVectorSet(parsed.ir),
    promptSha256: await sha256Hex(promptText),
  }
}

export interface RunOptions {
  engine: AcvpEngine
  codePath: 'browser' | 'cli'
  appVersion: string | null
  /** Optional NIST expectedResults.json text for a local golden comparison. */
  expectedText?: string
  now?: () => Date
  onProgress?: (done: number, total: number) => void
}

export interface RunOutput {
  results: CaseResult[]
  response: BuiltResponse
  responseSha256: string
  evidence: JsonObject
  evidenceText: string
  golden: GoldenComparison | null
}

export const executePrepared = async (
  prepared: PreparedPrompt,
  opts: RunOptions
): Promise<RunOutput> => {
  const now = opts.now ?? (() => new Date())
  const startedAt = now().toISOString()
  const results = executePlan(prepared.plan, opts.engine, opts.onProgress)
  const finishedAt = now().toISOString()
  const response = buildResponse(prepared.ir, results)
  const responseSha256 = await sha256Hex(response.text)
  const golden = opts.expectedText
    ? compareToExpected(response.document, JSON.parse(opts.expectedText))
    : null
  const evidence = buildEvidence({
    ir: prepared.ir,
    schema: prepared.schema,
    promptSha256: prepared.promptSha256,
    responseSha256,
    results,
    engine: opts.engine.identity,
    codePath: opts.codePath,
    appVersion: opts.appVersion,
    startedAt,
    finishedAt,
    goldenComparison: golden,
  })
  return {
    results,
    response,
    responseSha256,
    evidence,
    evidenceText: `${JSON.stringify(evidence, null, 2)}\n`,
    golden,
  }
}

/** Semantic identity of two responses: canonical JSON equality. */
export const responsesSemanticallyEqual = (a: unknown, b: unknown): boolean =>
  canonicalJson(a) === canonicalJson(b)
