// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadCacpSession,
  saveCacpPresetSession,
  saveCacpDraft,
  clearCacpDraft,
} from './cacpSessionStorage'

beforeEach(() => {
  localStorage.clear()
})

describe('cacpSessionStorage', () => {
  it('loadCacpSession returns an empty session when nothing is stored', () => {
    expect(loadCacpSession()).toEqual({
      presetFile: null,
      moduleFiles: null,
      uncoveredOps: 'deny',
      fingerprints: [],
      draftYaml: null,
      draftPresetFile: null,
    })
  })

  it('saveCacpPresetSession round-trips and clears any prior draft', () => {
    saveCacpDraft('classical.yaml', 'schema_version: 1\n')
    saveCacpPresetSession({
      presetFile: 'pqc.yaml',
      moduleFiles: null,
      uncoveredOps: 'deny',
      fingerprints: ['abc123'],
    })
    expect(loadCacpSession()).toEqual({
      presetFile: 'pqc.yaml',
      moduleFiles: null,
      uncoveredOps: 'deny',
      fingerprints: ['abc123'],
      draftYaml: null,
      draftPresetFile: null,
    })
  })

  it('saveCacpDraft merges into the existing session without disturbing preset fields', () => {
    saveCacpPresetSession({
      presetFile: 'pqc.yaml',
      moduleFiles: null,
      uncoveredOps: 'deny',
      fingerprints: ['abc123'],
    })
    saveCacpDraft('pqc.yaml', 'schema_version: 1\nrules: []\n')
    expect(loadCacpSession()).toEqual({
      presetFile: 'pqc.yaml',
      moduleFiles: null,
      uncoveredOps: 'deny',
      fingerprints: ['abc123'],
      draftYaml: 'schema_version: 1\nrules: []\n',
      draftPresetFile: 'pqc.yaml',
    })
  })

  it('clearCacpDraft drops only the draft fields', () => {
    saveCacpPresetSession({
      presetFile: 'pqc.yaml',
      moduleFiles: ['pqc-signing.yaml'],
      uncoveredOps: 'allow',
      fingerprints: ['abc123'],
    })
    saveCacpDraft('pqc.yaml', 'draft text')
    clearCacpDraft()
    expect(loadCacpSession()).toEqual({
      presetFile: 'pqc.yaml',
      moduleFiles: ['pqc-signing.yaml'],
      uncoveredOps: 'allow',
      fingerprints: ['abc123'],
      draftYaml: null,
      draftPresetFile: null,
    })
  })

  it('is resilient to corrupted JSON in the storage slot', () => {
    localStorage.setItem('cacp-session-v1', '{not json')
    expect(loadCacpSession().presetFile).toBeNull()
  })
})
