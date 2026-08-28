/**
 * Run-result parsing and pipeline persistence.
 *
 * Results attribute to steps by id, read from the ###STEP <id> ok|error### markers the
 * emitter writes. The previous builder split output on a bare separator and assigned
 * chunks by list position, which is only correct while every step prints exactly once.
 */
import type { PipelineStep, StepStatus } from './pipelineCodegen'

export interface RunOutcome {
  status: Record<string, StepStatus>
  text: Record<string, string>
  /** Set when the run failed as a whole (non-zero exit, or the backend was unreachable). */
  error: string | null
  elapsedMs: number | null
  hsmCalls: number | null
}

const MARKER = /###STEP (\S+) (ok|error)###\s*(.*)/

/**
 * `steps` is typed structurally ({id: string}[], not the concrete
 * PipelineStep[]) so the KMIP Developer tab's own step type (kmipPipeline/
 * kmipPipelineCodegen.ts's KmipStep — a different shape, same `id` field
 * and the same ###STEP marker contract) can reuse this parser instead of a
 * second copy of it. Only `s.id` is ever read off an entry.
 */
export function parseRun(
  output: string,
  steps: ReadonlyArray<{ id: string }>,
  returncode: number
): RunOutcome {
  const status: Record<string, StepStatus> = {}
  const text: Record<string, string> = {}
  for (const s of steps) status[s.id] = 'skipped'

  let buffer: string[] = []
  let sawError: string | null = null

  for (const line of output.split('\n')) {
    const m = MARKER.exec(line)
    if (!m) { buffer.push(line); continue }
    const [, id, verdict, detail] = m
    status[id] = verdict === 'ok' ? 'ok' : 'error'
    text[id] = buffer.join('\n').trim()
    if (verdict === 'error') {
      sawError = detail || 'step failed'
      text[id] = [text[id], detail].filter(Boolean).join('\n').trim()
    }
    buffer = []
  }

  // Anything after the last marker is the traceback of a step that never reported.
  const trailing = buffer.join('\n').trim()
  if (trailing && returncode !== 0) {
    const firstUnreported = steps.find((s) => status[s.id] === 'skipped')
    if (firstUnreported) {
      status[firstUnreported.id] = 'error'
      text[firstUnreported.id] = trailing
      sawError = sawError ?? trailing.split('\n').pop() ?? 'step failed'
    }
  }

  return {
    status,
    text,
    error: returncode === 0 ? null : (sawError ?? `exited with code ${returncode}`),
    elapsedMs: null,
    hsmCalls: null,
  }
}

/* ── persistence (dev-tabs-pkcs11-kmip plan, WS-H / D2) ──────────────────────── */
/* Generic over the step type: the KMIP Developer tab's own step shape
 * (kmipPipeline/kmipPipelineCodegen.ts's KmipStep — a different structure,
 * same `id`-addressed, ###STEP-marker-run contract) reuses this rather
 * than a second copy of the storage/export machinery. Each lane passes its
 * own localStorage key and export schema string so a PKCS#11 export can
 * never be mistaken for — or silently accepted as — a KMIP one. */

export interface SavedPipeline<TStep = PipelineStep> {
  steps: TStep[]
  input: string
}

export type PipelineStore<TStep = PipelineStep> = Record<string, SavedPipeline<TStep>>

export function loadStore<TStep = PipelineStep>(storeKey: string): PipelineStore<TStep> {
  try {
    const raw = localStorage.getItem(storeKey)
    if (raw) return JSON.parse(raw) as PipelineStore<TStep>
  } catch { /* private window, cleared site data, or corrupt value */ }
  return {}
}

export function saveStore<TStep = PipelineStep>(storeKey: string, store: PipelineStore<TStep>): boolean {
  try {
    localStorage.setItem(storeKey, JSON.stringify(store))
    return true
  } catch {
    return false   // quota — the caller surfaces this rather than failing silently
  }
}

/** D2: export a single saved pipeline as a JSON file, portable across browsers/
 *  machines and re-importable via importPipelineJson below. */
export interface ExportedPipelineFile<TStep = PipelineStep> {
  schema: string
  name: string
  exportedAt: string
  pipeline: SavedPipeline<TStep>
}

export function exportPipelineJson<TStep = PipelineStep>(
  schema: string,
  name: string,
  pipeline: SavedPipeline<TStep>
): string {
  const file: ExportedPipelineFile<TStep> = {
    schema,
    name,
    exportedAt: new Date().toISOString(),
    pipeline,
  }
  return JSON.stringify(file, null, 2)
}

/** Validates the imported shape before it ever reaches setState — a malformed
 *  or foreign JSON file must fail loudly here, not corrupt the canvas.
 *  `expectedSchema` rejects a file exported from the OTHER lane outright
 *  (a KMIP pipeline is not a valid PKCS#11 one, and vice versa) rather than
 *  accepting it and failing confusingly later on a step-shape mismatch. */
export function importPipelineJson<TStep = PipelineStep>(
  expectedSchema: string,
  raw: string
): { name: string; pipeline: SavedPipeline<TStep> } | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (
    typeof parsed !== 'object' || parsed === null ||
    (parsed as Partial<ExportedPipelineFile<TStep>>).schema !== expectedSchema
  ) {
    return null
  }
  const file = parsed as ExportedPipelineFile<TStep>
  if (
    typeof file.name !== 'string' ||
    !file.pipeline || !Array.isArray(file.pipeline.steps) ||
    typeof file.pipeline.input !== 'string'
  ) {
    return null
  }
  return { name: file.name, pipeline: file.pipeline }
}
