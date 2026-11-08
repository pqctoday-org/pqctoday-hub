// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { importPipelineJson } from '../pipeline/pipelineRun'
import { KMIP_TEMPLATES } from './kmipPipelineTemplates'
import {
  exportKmipPipeline,
  importKmipPipeline,
  restoreKmipPipeline,
  snapshotKmipPipeline,
  KMIP_EXPORT_SCHEMA,
  LEGACY_KMIP_EXPORT_SCHEMA,
} from './kmipPipelinePersistence'
const steps = KMIP_TEMPLATES['ML-KEM round trip']

describe('KMIP saved input and custom-code preservation', () => {
  it.each(['text', 'hex'] as const)(
    'preserves explicit %s meaning of identical input characters',
    (mode) => {
      const saved = snapshotKmipPipeline(steps, '00ff80', mode, null)
      const restored = importKmipPipeline(exportKmipPipeline('sample', saved))
      expect(restored?.pipeline).toEqual({
        steps,
        input: '00ff80',
        messageMode: mode,
        customCode: null,
        legacy: false,
      })
    }
  )
  it.each(['print("custom")', ''])('retains an edited script including empty code', (code) => {
    const saved = snapshotKmipPipeline(steps, 'sample', 'text', code)
    expect(importKmipPipeline(exportKmipPipeline('sample', saved))?.pipeline.customCode).toBe(code)
    expect(restoreKmipPipeline(JSON.parse(JSON.stringify(saved)))?.customCode).toBe(code)
  })
  it('does not guess legacy hex-looking input or claim to recover lost custom edits', () => {
    const legacy = JSON.stringify({
      schema: LEGACY_KMIP_EXPORT_SCHEMA,
      name: 'old',
      pipeline: { steps, input: '00ff80' },
    })
    expect(importKmipPipeline(legacy)?.pipeline).toEqual({
      steps,
      input: '00ff80',
      messageMode: null,
      customCode: null,
      legacy: true,
    })
  })
  it.each([
    { formatVersion: 3 },
    { messageMode: 'base64' },
    { customCode: 7 },
    { customCode: undefined },
  ])('rejects unsupported modern metadata %j', (change) => {
    const pipeline = { ...snapshotKmipPipeline(steps, 'message', 'text', null), ...change }
    expect(
      importKmipPipeline(JSON.stringify({ schema: KMIP_EXPORT_SCHEMA, name: 'bad', pipeline }))
    ).toBeNull()
  })
  it('does not accept a modern file that omitted its metadata', () => {
    expect(
      importKmipPipeline(
        JSON.stringify({
          schema: KMIP_EXPORT_SCHEMA,
          name: 'bad',
          pipeline: { steps, input: 'sample' },
        })
      )
    ).toBeNull()
  })
  it('keeps the shared PKCS11 importer and an older KMIP importer from accepting the new schema', () => {
    const exported = exportKmipPipeline('sample', snapshotKmipPipeline(steps, '00ff', 'hex', null))
    expect(importPipelineJson('pqctoday-hub-pkcs11-pipeline-v1', exported)).toBeNull()
    expect(importPipelineJson(LEGACY_KMIP_EXPORT_SCHEMA, exported)).toBeNull()
    expect(
      importKmipPipeline(
        JSON.stringify({
          schema: 'pqctoday-hub-pkcs11-pipeline-v1',
          name: 'other',
          pipeline: { steps, input: 'sample' },
        })
      )
    ).toBeNull()
  })
})
