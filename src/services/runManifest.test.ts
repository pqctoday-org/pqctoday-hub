// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { buildRunManifest, runManifestToMarkdown, RUN_MANIFEST_SCHEMA } from './runManifest'

const SITE = {
  appVersion: '4.163.0',
  commit: 'abcdef1234567890',
  wasmHash: 'w',
  buildTimestamp: 't',
}
const INPUT = {
  tool: { id: 'tls-simulator', title: 'TLS 1.3 Simulator', version: '1.0.2' },
  executionMode: 'in-browser-implementation' as const,
  inputs: { groups: ['X25519MLKEM768'] },
  cases: [
    { id: 'handshake', expected: 'success', actual: 'success', pass: true },
    { id: 'client-auth', expected: 'success', actual: 'failed', pass: false },
  ],
  limitations: ['Not a product test.'],
  startedAt: '2026-10-16T10:00:00.000Z',
  finishedAt: '2026-10-16T10:00:02.000Z',
}

describe('run manifest', () => {
  it('records the schema, the build, the cases and a summary that matches them', () => {
    const m = buildRunManifest(INPUT, SITE, 'UA')
    expect(m.schema).toBe(RUN_MANIFEST_SCHEMA)
    expect(m.site).toEqual(SITE)
    expect(m.runtime.userAgent).toBe('UA')
    expect(m.summary).toEqual({ passed: 1, failed: 1 })
  })

  it('refuses a record that states no limitation', () => {
    expect(() => buildRunManifest({ ...INPUT, limitations: [] }, SITE, 'UA')).toThrow()
  })

  it('renders a readable file whose JSON block parses back to the same record', () => {
    const m = buildRunManifest(INPUT, SITE, 'UA')
    const md = runManifestToMarkdown(m)
    expect(md).toContain('## What this run does not show')
    expect(md.startsWith('**Notice')).toBe(true)
    expect(md).toContain('- FAIL client-auth: failed (expected success)')
    const json = md.slice(md.indexOf('```json') + 7, md.lastIndexOf('```'))
    expect(JSON.parse(json)).toEqual(m)
  })
})
