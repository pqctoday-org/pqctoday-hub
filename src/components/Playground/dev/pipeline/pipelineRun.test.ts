// SPDX-License-Identifier: GPL-3.0-only
//
// Round-trip and seam tests for the shared pipeline persistence module
// (dev-tabs-pkcs11-kmip plan G6). "Test the seam, not the halves" — the
// cross-lane rejection tests are the actual point of the generalization
// done in G4/commit 64dabf47e: a KMIP export must never be silently
// accepted by the PKCS#11 importer (or vice versa), now that both lanes
// share this one module instead of each carrying its own copy.
import { beforeEach, describe, expect, it } from 'vitest'
import {
  loadStore, saveStore, exportPipelineJson, importPipelineJson, pipelineProvenanceHeader,
  type SavedPipeline,
} from './pipelineRun'

const PKCS11_SCHEMA = 'pqctoday-hub-pkcs11-pipeline-v1'
const KMIP_SCHEMA = 'pqctoday-hub-kmip-pipeline-v1'
const PKCS11_STORE_KEY = 'test-pqctoday-hub-pkcs11-pipelines'
const KMIP_STORE_KEY = 'test-pqctoday-hub-kmip-pipelines'

interface FakeStep { id: string; note: string }

beforeEach(() => {
  localStorage.clear()
})

describe('pipelineRun — localStorage save/load round trip', () => {
  it('saves and reloads a pipeline unchanged', () => {
    const pipeline: SavedPipeline<FakeStep> = { steps: [{ id: 's1', note: 'hello' }], input: 'payload' }
    const store = { 'My Pipeline': pipeline }
    expect(saveStore(PKCS11_STORE_KEY, store)).toBe(true)

    const loaded = loadStore<FakeStep>(PKCS11_STORE_KEY)
    expect(loaded).toEqual(store)
  })

  it('returns an empty store when nothing was ever saved', () => {
    expect(loadStore('nonexistent-key-xyz')).toEqual({})
  })

  it('returns an empty store (not a throw) when the stored value is corrupt JSON', () => {
    localStorage.setItem(PKCS11_STORE_KEY, '{not valid json')
    expect(loadStore(PKCS11_STORE_KEY)).toEqual({})
  })

  it('two lanes using different store keys never collide', () => {
    saveStore(PKCS11_STORE_KEY, { A: { steps: [{ id: 'p', note: 'pkcs11' }], input: 'x' } })
    saveStore(KMIP_STORE_KEY, { A: { steps: [{ id: 'k', note: 'kmip' }], input: 'y' } })
    expect(loadStore<FakeStep>(PKCS11_STORE_KEY).A.steps[0].note).toBe('pkcs11')
    expect(loadStore<FakeStep>(KMIP_STORE_KEY).A.steps[0].note).toBe('kmip')
  })
})

describe('pipelineRun — export/import round trip', () => {
  it('a pipeline exported and re-imported comes back identical', () => {
    const pipeline: SavedPipeline<FakeStep> = { steps: [{ id: 's1', note: 'round trip' }], input: 'in' }
    const json = exportPipelineJson(PKCS11_SCHEMA, 'RT Test', pipeline)
    const result = importPipelineJson<FakeStep>(PKCS11_SCHEMA, json)
    expect(result).not.toBeNull()
    expect(result!.name).toBe('RT Test')
    expect(result!.pipeline).toEqual(pipeline)
  })

  it('rejects malformed JSON outright', () => {
    expect(importPipelineJson(PKCS11_SCHEMA, '{not json')).toBeNull()
  })

  it('rejects well-formed JSON missing the expected fields', () => {
    expect(importPipelineJson(PKCS11_SCHEMA, JSON.stringify({ schema: PKCS11_SCHEMA, name: 'x' }))).toBeNull()
  })
})

describe('pipelineRun — cross-lane schema rejection (the actual seam this generalization exists for)', () => {
  it('a KMIP export is refused by the PKCS#11 importer', () => {
    const kmipPipeline: SavedPipeline<FakeStep> = { steps: [{ id: 'k1', note: 'kmip step' }], input: 'msg' }
    const kmipExport = exportPipelineJson(KMIP_SCHEMA, 'KMIP Flow', kmipPipeline)
    expect(importPipelineJson<FakeStep>(PKCS11_SCHEMA, kmipExport)).toBeNull()
  })

  it('a PKCS#11 export is refused by the KMIP importer', () => {
    const pkcs11Pipeline: SavedPipeline<FakeStep> = { steps: [{ id: 'p1', note: 'pkcs11 step' }], input: 'in' }
    const pkcs11Export = exportPipelineJson(PKCS11_SCHEMA, 'PKCS11 Flow', pkcs11Pipeline)
    expect(importPipelineJson<FakeStep>(KMIP_SCHEMA, pkcs11Export)).toBeNull()
  })

  it('each lane still accepts its OWN export (the rejection is schema-specific, not a blanket break)', () => {
    const kmipPipeline: SavedPipeline<FakeStep> = { steps: [{ id: 'k1', note: 'x' }], input: 'y' }
    const kmipExport = exportPipelineJson(KMIP_SCHEMA, 'KMIP Flow', kmipPipeline)
    expect(importPipelineJson<FakeStep>(KMIP_SCHEMA, kmipExport)).not.toBeNull()
  })
})

describe('pipelineProvenanceHeader', () => {
  it('names the lane and stays comment-only (never breaks the script it prefixes)', () => {
    const header = pipelineProvenanceHeader('PKCS#11 v3.2')
    expect(header).toContain('PKCS#11 v3.2 Developer tab')
    for (const line of header.split('\n').filter((l) => l.length > 0)) {
      expect(line.startsWith('#'), `non-comment line in provenance header: ${line}`).toBe(true)
    }
  })

  it('never emits a clickable link (D5: full hub→sandbox decoupling stands)', () => {
    const header = pipelineProvenanceHeader('KMIP 3.0 + CACP')
    expect(header).not.toMatch(/https?:\/\//)
  })
})
