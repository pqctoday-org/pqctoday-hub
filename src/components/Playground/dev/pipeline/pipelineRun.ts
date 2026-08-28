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

export function parseRun(output: string, steps: PipelineStep[], returncode: number): RunOutcome {
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

const STORE_KEY = 'pqctoday-hub-pkcs11-pipelines-v1'

export interface SavedPipeline {
  steps: PipelineStep[]
  input: string
}

export type PipelineStore = Record<string, SavedPipeline>

export function loadStore(): PipelineStore {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (raw) return JSON.parse(raw) as PipelineStore
  } catch { /* private window, cleared site data, or corrupt value */ }
  return {}
}

export function saveStore(store: PipelineStore): boolean {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store))
    return true
  } catch {
    return false   // quota — the caller surfaces this rather than failing silently
  }
}

/** D2: export a single saved pipeline as a JSON file, portable across browsers/
 *  machines and re-importable via importPipelineJson below. */
export interface ExportedPipelineFile {
  schema: 'pqctoday-hub-pkcs11-pipeline-v1'
  name: string
  exportedAt: string
  pipeline: SavedPipeline
}

export function exportPipelineJson(name: string, pipeline: SavedPipeline): string {
  const file: ExportedPipelineFile = {
    schema: 'pqctoday-hub-pkcs11-pipeline-v1',
    name,
    exportedAt: new Date().toISOString(),
    pipeline,
  }
  return JSON.stringify(file, null, 2)
}

/** Validates the imported shape before it ever reaches setState — a malformed
 *  or foreign JSON file must fail loudly here, not corrupt the canvas. */
export function importPipelineJson(raw: string): { name: string; pipeline: SavedPipeline } | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (
    typeof parsed !== 'object' || parsed === null ||
    (parsed as Partial<ExportedPipelineFile>).schema !== 'pqctoday-hub-pkcs11-pipeline-v1'
  ) {
    return null
  }
  const file = parsed as ExportedPipelineFile
  if (
    typeof file.name !== 'string' ||
    !file.pipeline || !Array.isArray(file.pipeline.steps) ||
    typeof file.pipeline.input !== 'string'
  ) {
    return null
  }
  return { name: file.name, pipeline: file.pipeline }
}
