// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The certificate sizes the lesson prints are the sizes measured with OpenSSL 3.6.3 for minimal
 * self-signed certificates (DER): ML-DSA-65 5,538 bytes, RSA-2048 809 bytes. The older "about 6 KB
 * against about 1.2 KB" figures had no source. Every place that prints the comparison must agree.
 */
import { describe, it, expect } from 'vitest'
import introduction from './components/SecureBootIntroduction.tsx?raw'
import migrator from './workshop/FirmwareSigningMigrator.tsx?raw'
import analyzer from './workshop/SecureBootChainAnalyzer.tsx?raw'
import constants from './data/secureBootConstants.ts?raw'

const flat = (s: string) => s.replace(/\s+/g, ' ')

describe('Secure Boot lesson: ML-DSA-65 and RSA-2048 certificate sizes', () => {
  it('the introduction states the measured sizes and how they were measured', () => {
    const t = flat(introduction)
    expect(t).toContain('about <strong>5.5 KB</strong> (5,538 bytes)')
    expect(t).toContain(
      '<strong>0.8 KB</strong> (809 bytes) for RSA-2048, measured with OpenSSL 3.6.3'
    )
    expect(t).toContain('Certificates with more fields are larger.')
  })

  it.each([
    ['Firmware Signing Migrator', migrator],
    ['Chain Analyzer', analyzer],
    ['db constant', constants],
  ])('%s uses the measured sizes, not the unsourced 6 KB and 1.2 KB', (_name, source) => {
    const t = flat(source)
    expect(t).toContain('5.5 KB')
    expect(t).toContain('0.8 KB')
    expect(t).toContain('OpenSSL 3.6.3')
    expect(t).not.toMatch(/~6 KB vs ~1\.2 KB|about 6 KB against about 1\.2 KB/)
  })
})
