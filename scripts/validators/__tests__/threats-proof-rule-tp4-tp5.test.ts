// SPDX-License-Identifier: GPL-3.0-only
/**
 * TP-4: every published threat carries a reviewed threat_class (ruling R1,
 * 2026-09-24 — the page no longer guesses it). TP-5: every second source a
 * threat names is a library row, and a claim is credited only to a ref the
 * row lists. Drafts are exempt from both: they are not on the page.
 */
import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { runThreatsProofRule } from '../threats-proof-rule'

const HEADER =
  'industry,threat_id,threat_description,local_file,status,threat_class,secondary_source_ref,secondary_claims'

function writeFixture(root: string, rows: string[]): void {
  const data = path.join(root, 'src', 'data')
  fs.mkdirSync(data, { recursive: true })
  fs.writeFileSync(
    path.join(data, 'quantum_threats_hsm_industries_09242026.csv'),
    [HEADER, ...rows].join('\n') + '\n'
  )
  fs.writeFileSync(
    path.join(data, 'library_09242026.csv'),
    'reference_id,document_title\nRFC 7935,Algorithms\nRFC 6605,ECDSA for DNSSEC\n'
  )
}

describe('TP-4 threat_class and TP-5 second-source links', () => {
  let tmp: string
  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tp45-'))
    vi.spyOn(process, 'cwd').mockReturnValue(tmp)
  })
  afterEach(() => {
    vi.restoreAllMocks()
    fs.rmSync(tmp, { recursive: true, force: true })
  })
  const check = (id: string) => runThreatsProofRule().find((r) => r.id === id)

  it('passes reviewed classes and resolvable second sources; ignores drafts', () => {
    writeFixture(tmp, [
      'X,T-1,d,threats/T-1.pdf,active,hndl,RFC 7935,threat_description',
      'X,T-2,d,threats/T-2.pdf,active,both,RFC 6605;RFC 7935,crypto_at_risk@RFC 6605;pqc_replacement@RFC 7935',
      'X,T-3,d,threats/T-3.pdf,draft,,,',
    ])
    expect(check('TP-4')?.status).toBe('PASS')
    expect(check('TP-5')?.status).toBe('PASS')
  })

  it('fails a published row with no class or an unknown class', () => {
    writeFixture(tmp, [
      'X,T-1,d,threats/T-1.pdf,active,,,',
      'X,T-2,d,threats/T-2.pdf,active,unclassified,,',
    ])
    const r = check('TP-4')
    expect(r?.status).toBe('FAIL')
    expect(r?.findings.map((f) => f.value)).toEqual(['', 'unclassified'])
  })

  it('fails a second source that is not in the library, and a claim credited to an unlisted ref', () => {
    writeFixture(tmp, [
      'X,T-1,d,threats/T-1.pdf,active,hnfl,RFC 9999,threat_description',
      'X,T-2,d,threats/T-2.pdf,active,hnfl,RFC 6605,crypto_at_risk@RFC 7935',
      'X,T-3,d,threats/T-3.pdf,active,hnfl,,threat_description',
    ])
    const r = check('TP-5')
    expect(r?.status).toBe('FAIL')
    expect(r?.findings.map((f) => f.row)).toEqual([2, 3, 4])
  })

  it('skips TP-4 on a CSV that predates the column', () => {
    const data = path.join(tmp, 'src', 'data')
    fs.mkdirSync(data, { recursive: true })
    fs.writeFileSync(
      path.join(data, 'quantum_threats_hsm_industries_09232026.csv'),
      'industry,threat_id,local_file,status\nX,T-1,threats/T-1.pdf,active\n'
    )
    expect(check('TP-4')?.status).toBe('SKIP')
  })
})
