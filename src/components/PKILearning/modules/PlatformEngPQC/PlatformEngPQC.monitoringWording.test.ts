// SPDX-License-Identifier: AGPL-3.0-only
import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect } from 'vitest'

describe('PlatformEngPQC monitoring wording', () => {
  it('describes the monitor step as capability requirements and checklists, not exporter metrics and queries', () => {
    const source = fs
      .readFileSync(path.resolve(__dirname, 'index.tsx'), 'utf8')
      .replace(/\s+/g, ' ')
    expect(source).toContain(
      'Four-panel monitor: monitoring capability requirements, SIEM checklists'
    )
    expect(source).not.toContain('Prometheus metrics, SIEM queries')
  })

  it('keeps the module summary in line with the corrected monitor panels', () => {
    const rag = fs.readFileSync(path.resolve(__dirname, 'rag-summary.md'), 'utf8')
    expect(rag).not.toMatch(/4 Prometheus exporters/)
    expect(rag).not.toMatch(/using Prometheus exporters, SIEM queries/)
    expect(rag).not.toMatch(/4 queries \(Splunk/)
    expect(rag).toMatch(/expiry metrics do not carry the key algorithm/)
    expect(rag).toMatch(/4 capability checklists, not runnable queries/)
  })

  it('keeps the lesson overview and the plain-language summary in line as well', () => {
    const dir = __dirname
    const content = fs.readFileSync(path.resolve(dir, 'content.ts'), 'utf8')
    const curious = fs.readFileSync(path.resolve(dir, 'curious-summary.md'), 'utf8')
    expect(content).not.toContain('Monitor crypto posture using Prometheus exporters')
    expect(content).toContain('the expiry metrics of an exporter do not carry the key algorithm')
    expect(curious).not.toContain('employ Prometheus metrics to continuously monitor')
    expect(curious).toContain('expiry metrics alone do not carry the key algorithm')
  })
})
