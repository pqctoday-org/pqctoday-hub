// SPDX-License-Identifier: AGPL-3.0-only
import type { PyRunResult } from '@/services/python/pyRuntime'
import { parseRun } from './pipelineRun'
import { emitPipeline, type PipelineStep } from './pipelineCodegen'
import { TEMPLATES, TEMPLATE_OUTCOMES } from './pipelineTemplates'

export interface PkcsAttemptInputs {
  name: string
  code: string
  steps: PipelineStep[]
  input: string
  slot: number
  engine: string
  detached: boolean
  templateName: string | null
}
export type PkcsAttemptState = 'running' | 'passed' | 'failed' | 'incomplete' | 'script-finished'
export interface PkcsAttempt {
  inputs: PkcsAttemptInputs
  state: PkcsAttemptState
  elapsedMs: number | null
  error: string | null
  stdout: string
  stderr: string
  explanation: string | null
  parsed: ReturnType<typeof parseRun> | null
}
// Runtime decorations do not change the code/input identity. IDs and reference
// bindings remain significant for a recorded run; template comparison alone
// canonicalizes IDs because selecting a template creates fresh step IDs.
export const attemptBinding = (inputs: PkcsAttemptInputs) =>
  JSON.stringify({
    ...inputs,
    steps: inputs.steps.map(({ id, primId, op, params }) => ({ id, primId, op, params })),
  })
export function stepStructure(steps: PipelineStep[]): string {
  const ids = new Map(steps.map((step, index) => [step.id, String(index)]))
  return JSON.stringify(
    steps.map((step) => ({
      id: ids.get(step.id),
      primId: step.primId,
      op: step.op,
      params: Object.fromEntries(
        Object.entries(step.params).map(([key, value]) => [
          key,
          value.bind === 'ref' || value.bind === 'key'
            ? { ...value, step: ids.get(value.step) ?? value.step }
            : value,
        ])
      ),
    }))
  )
}
export const snapshotAttempt = (inputs: PkcsAttemptInputs): PkcsAttemptInputs => ({
  ...inputs,
  steps: JSON.parse(JSON.stringify(inputs.steps)) as PipelineStep[],
})
export function beginAttempt(inputs: PkcsAttemptInputs): PkcsAttempt {
  return {
    inputs: snapshotAttempt(inputs),
    state: 'running',
    elapsedMs: null,
    error: null,
    stdout: '',
    stderr: '',
    explanation: null,
    parsed: null,
  }
}
export function failAttempt(
  inputs: PkcsAttemptInputs,
  error: unknown,
  elapsedMs: number
): PkcsAttempt {
  return {
    ...beginAttempt(inputs),
    state: 'failed',
    elapsedMs,
    error: `Could not run: ${error instanceof Error ? error.message : String(error)}`,
  }
}
export function completeAttempt(
  inputs: PkcsAttemptInputs,
  result: PyRunResult,
  elapsedMs: number
): PkcsAttempt {
  const parsed = inputs.detached
    ? null
    : parseRun(
        result.stdout + (result.error ? `\n${result.error}` : ''),
        inputs.steps,
        result.ok ? 0 : 1
      )
  const base = {
    ...beginAttempt(inputs),
    elapsedMs,
    stdout: result.stdout,
    stderr: result.stderr,
    parsed,
  }
  if (!result.ok || result.error)
    return { ...base, state: 'failed', error: result.error || 'Python run failed' }
  if (inputs.detached) return { ...base, state: 'script-finished' }
  if (!parsed)
    return { ...base, state: 'incomplete', error: 'Generated step results are unavailable.' }
  if (
    inputs.steps.some(
      (step) => parsed.status[step.id] === 'error' || parsed.detail[step.id]?.kind === 'error'
    )
  ) {
    return {
      ...base,
      state: 'failed',
      error: 'A required generated step reported failure; inspect its output.',
    }
  }
  const ids = inputs.steps.map((step) => step.id)
  const markers = [...result.stdout.matchAll(/^###STEP (\S+) (ok|error)###/gm)]
  if (
    !ids.length ||
    new Set(ids).size !== ids.length ||
    markers.length !== ids.length ||
    markers.some((m) => !ids.includes(m[1])) ||
    ids.some((id) => markers.filter((m) => m[1] === id).length !== 1) ||
    ids.some((id) => parsed.status[id] !== 'ok' || parsed.detail[id]?.kind !== 'output')
  ) {
    return {
      ...base,
      state: 'incomplete',
      error:
        'Required generated-step results are missing, repeated or incomplete; no successful demonstration is established.',
    }
  }
  // The editable name is never the identity of a built-in template. Imported,
  // saved or detached code cannot borrow an explanation from a matching title.
  const template = inputs.templateName && TEMPLATES[inputs.templateName]
  const matches =
    template &&
    stepStructure(template) === stepStructure(inputs.steps) &&
    inputs.code === emitPipeline(inputs.steps, { input: inputs.input, slot: inputs.slot })
  return {
    ...base,
    state: 'passed',
    explanation: matches ? (TEMPLATE_OUTCOMES[inputs.templateName!] ?? null) : null,
  }
}
