// SPDX-License-Identifier: AGPL-3.0-only
import type { PyRunResult } from '@/services/python/pyRuntime'
import { parseRun } from '../pipeline/pipelineRun'
import { emitKmipPipeline, type KmipStep, type KmipMessageMode } from './kmipPipelineCodegen'
import { KMIP_TEMPLATES, KMIP_TEMPLATE_OUTCOMES } from './kmipPipelineTemplates'

export interface KmipAttemptInputs {
  name: string
  code: string
  steps: KmipStep[]
  message: string
  messageMode: KmipMessageMode
  detached: boolean
  templateName: string | null
}
export type KmipAttemptState = 'running' | 'passed' | 'failed' | 'incomplete' | 'script-finished'
export interface KmipAttempt {
  inputs: KmipAttemptInputs
  state: KmipAttemptState
  elapsedMs: number | null
  error: string | null
  stdout: string
  stderr: string
  explanation: string | null
  parsed: ReturnType<typeof parseRun> | null
}
export const attemptBinding = (inputs: KmipAttemptInputs) => JSON.stringify(inputs)
export const snapshotAttempt = (inputs: KmipAttemptInputs): KmipAttemptInputs => ({
  ...inputs,
  steps: JSON.parse(JSON.stringify(inputs.steps)) as KmipStep[],
})
export function beginAttempt(inputs: KmipAttemptInputs): KmipAttempt {
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
  inputs: KmipAttemptInputs,
  error: unknown,
  elapsedMs: number
): KmipAttempt {
  return {
    ...beginAttempt(inputs),
    state: 'failed',
    elapsedMs,
    error: `Could not run: ${error instanceof Error ? error.message : String(error)}`,
  }
}
export function completeAttempt(
  inputs: KmipAttemptInputs,
  result: PyRunResult,
  elapsedMs: number
): KmipAttempt {
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
  const template = inputs.templateName && KMIP_TEMPLATES[inputs.templateName]
  const matches =
    template &&
    JSON.stringify(template) === JSON.stringify(inputs.steps) &&
    inputs.code ===
      emitKmipPipeline(inputs.steps, { message: inputs.message, messageMode: inputs.messageMode })
  return {
    ...base,
    state: 'passed',
    explanation: matches ? (KMIP_TEMPLATE_OUTCOMES[inputs.templateName!] ?? null) : null,
  }
}
