// SPDX-License-Identifier: GPL-3.0-only
/**
 * TP-3 resolves a threat's trusted_source_id against BOTH registries
 * (trusted_sources_*.csv and pqc_authoritative_sources_reference_*.csv), the
 * union the app itself resolves (getTrustedSource, then getAuthoritativeSource).
 * Pinned 2026-09-23: CROS-008 -> incd-israel, a trusted-sources-only id, failed
 * TP-3 at ERROR while the page resolved it.
 */
import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { runThreatsProofRule } from '../threats-proof-rule'

const THREATS_HEADER =
  'industry,threat_id,threat_description,trusted_source_id,local_file,status,deprecated_at'

function writeFixture(root: string, threatRows: string[]): void {
  const data = path.join(root, 'src', 'data')
  fs.mkdirSync(data, { recursive: true })
  fs.writeFileSync(
    path.join(data, 'quantum_threats_hsm_industries_09232026.csv'),
    [THREATS_HEADER, ...threatRows].join('\n') + '\n'
  )
  fs.writeFileSync(
    path.join(data, 'pqc_authoritative_sources_reference_09182026.csv'),
    'id,Source_Name\nauth-only,Authoritative Only\n'
  )
  fs.writeFileSync(
    path.join(data, 'trusted_sources_09182026_r1.csv'),
    'source_id,source_name\ntrusted-only,Trusted Only\n'
  )
}

describe('TP-3 trusted_source_id resolution', () => {
  let tmp: string
  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tp3-'))
    vi.spyOn(process, 'cwd').mockReturnValue(tmp)
  })
  afterEach(() => {
    vi.restoreAllMocks()
    fs.rmSync(tmp, { recursive: true, force: true })
  })

  const tp3 = () => runThreatsProofRule().find((r) => r.id === 'TP-3')

  it('accepts an id from either registry', () => {
    writeFixture(tmp, [
      'X,T-001,d,auth-only,threats/T-001.pdf,active,',
      'X,T-002,d,trusted-only,threats/T-002.pdf,active,',
    ])
    expect(tp3()?.status).toBe('PASS')
  })

  it('still fails an id neither registry knows', () => {
    writeFixture(tmp, ['X,T-003,d,nowhere,threats/T-003.pdf,active,'])
    const r = tp3()
    expect(r?.status).toBe('FAIL')
    expect(r?.findings.length).toBe(1)
  })
})
