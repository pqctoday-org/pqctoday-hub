// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { EDUCATION_NOTICE } from '@/data/educationNotice'
import { buildRunManifest } from './runManifest'
import { runManifestToJson, runRecordFile, siteProvenanceLine } from './runRecordExport'

const SITE = {
  appVersion: '4.163.0',
  commit: 'abcdef1234567890abcd',
  wasmHash: '',
  buildTimestamp: '',
}
const M = buildRunManifest(
  {
    tool: { id: 'drbg-demo', title: 'SP 800-90A DRBG', version: '1.0.4' },
    executionMode: 'in-browser-implementation',
    inputs: {},
    cases: [{ id: 'a', actual: 'x', pass: true }],
    limitations: ['Not a validation.'],
    startedAt: '2026-10-16T10:00:00.000Z',
    finishedAt: '2026-10-16T10:00:01.000Z',
  },
  SITE,
  'UA'
)

describe('run record JSON', () => {
  it('leads with the education notice and keeps the manifest unchanged', () => {
    const file = runRecordFile(M)
    expect(Object.keys(file)[0]).toBe('notice')
    expect(file.notice).toBe(EDUCATION_NOTICE)
    const parsed = JSON.parse(runManifestToJson(M))
    delete parsed.notice
    expect(parsed).toEqual(M)
  })

  it('names the site version and a 12-character commit', () => {
    expect(siteProvenanceLine(SITE)).toBe('Site version 4.163.0 · commit abcdef123456')
    expect(siteProvenanceLine({ ...SITE, appVersion: '', commit: '' })).toBe(
      'Site version unknown · commit unknown'
    )
  })
})
