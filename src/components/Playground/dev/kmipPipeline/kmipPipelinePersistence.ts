// SPDX-License-Identifier: AGPL-3.0-only
import { exportPipelineJson, importPipelineJson, type SavedPipeline } from '../pipeline/pipelineRun'
import type { KmipMessageMode, KmipStep } from './kmipPipelineCodegen'

export const KMIP_EXPORT_SCHEMA = 'pqctoday-hub-kmip-pipeline-v2'
export const LEGACY_KMIP_EXPORT_SCHEMA = 'pqctoday-hub-kmip-pipeline-v1'

export interface SavedKmipPipeline extends SavedPipeline<KmipStep> {
  formatVersion: 2
  messageMode: KmipMessageMode
  /** null is generated code; the empty string is still an edited custom script. */
  customCode: string | null
}
export interface RestoredKmipPipeline {
  steps: KmipStep[]
  input: string
  /** Older saved records did not preserve the interpretation of their input. */
  messageMode: KmipMessageMode | null
  customCode: string | null
  legacy: boolean
}

export function snapshotKmipPipeline(
  steps: KmipStep[],
  input: string,
  messageMode: KmipMessageMode,
  customCode: string | null
): SavedKmipPipeline {
  return { formatVersion: 2, steps, input, messageMode, customCode }
}

export function restoreKmipPipeline(value: unknown): RestoredKmipPipeline | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const data = value as Partial<SavedKmipPipeline>
  if (!Array.isArray(data.steps) || typeof data.input !== 'string') return null
  if (data.formatVersion === undefined) {
    // Do not guess text/hex from the characters. Custom edits were not stored
    // by the old format and cannot be reconstructed from its builder steps.
    if (data.messageMode !== undefined || data.customCode !== undefined) return null
    return {
      steps: data.steps,
      input: data.input,
      messageMode: null,
      customCode: null,
      legacy: true,
    }
  }
  if (
    data.formatVersion !== 2 ||
    (data.messageMode !== 'text' && data.messageMode !== 'hex') ||
    (data.customCode !== null && typeof data.customCode !== 'string')
  )
    return null
  return {
    steps: data.steps,
    input: data.input,
    messageMode: data.messageMode,
    customCode: data.customCode,
    legacy: false,
  }
}

export function exportKmipPipeline(name: string, pipeline: SavedKmipPipeline): string {
  // A distinct schema prevents old clients silently accepting a record whose
  // message mode or edited code they do not understand.
  return exportPipelineJson<KmipStep>(KMIP_EXPORT_SCHEMA, name, pipeline)
}

export function importKmipPipeline(
  raw: string
): { name: string; pipeline: RestoredKmipPipeline } | null {
  const modern = importPipelineJson<KmipStep>(KMIP_EXPORT_SCHEMA, raw)
  const parsed = modern ?? importPipelineJson<KmipStep>(LEGACY_KMIP_EXPORT_SCHEMA, raw)
  if (!parsed) return null
  const pipeline = restoreKmipPipeline(parsed.pipeline)
  if (!pipeline || (modern && pipeline.legacy)) return null
  return { name: parsed.name, pipeline }
}
