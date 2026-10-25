// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The "Which scheme for which use" rows say what NSA CNSA 2.0 FAQ v2.2 says about each scheme:
 * p. 7 (ML-DSA-87 for any use, including firmware and software), p. 8 (LMS and XMSS for firmware
 * and software, LMS SHA-256/192 recommended) and p. 11 ("From NIST SP 800-208, NSA has only
 * approved LMS and XMSS for use in NSS. The multi-tree algorithms HSS and XMSSMT are not
 * allowed."), p. 12 (backup flows must prevent state re-use). A row that uses a multi-tree set
 * must say it is not allowed, and the figures and phrases that had no source must stay gone.
 */
import { describe, it, expect } from 'vitest'
import {
  SCHEME_FOR_USE_ROWS,
  schemeForUseParamSet,
  type SchemeForUseRow,
} from './statefulSigsConstants'
import constantsSource from './statefulSigsConstants.ts?raw'

const row = (id: string): SchemeForUseRow => {
  const found = SCHEME_FOR_USE_ROWS.find((r) => r.id === id)
  if (!found) throw new Error(`no scheme row ${id}`)
  return found
}

const MULTI_TREE_TEXT =
  'XMSS^MT not allowed, LMS and XMSS approved for firmware and software only, ML-DSA-87 approved for every use.'

describe('scheme chooser: rows carry the NSA statements (CNSA 2.0 FAQ v2.2)', () => {
  it.each([
    [
      'firmware-signing',
      'LMS allowed for firmware and software, SHA-256/192 recommended, HSS not allowed.',
    ],
    ['code-signing', 'XMSS allowed for software, XMSS^MT not allowed.'],
    ['document-signing', MULTI_TREE_TEXT],
    ['timestamping', MULTI_TREE_TEXT],
  ])('%s says: %s', (id, text) => {
    expect(row(id).cnsa).toBe(text)
  })

  it('every row that uses a multi-tree set says the multi-tree schemes are not allowed', () => {
    const multiTree = SCHEME_FOR_USE_ROWS.filter((r) => {
      const set = schemeForUseParamSet(r)
      return ('variant' in set && set.variant === 'multi-tree') || set.name.includes('HSS')
    })
    expect(multiTree.map((r) => r.id)).toEqual(['document-signing', 'timestamping'])
    for (const r of multiTree) expect(r.cnsa).toContain('XMSS^MT not allowed')
  })

  it('the secure boot row names the Winternitz trade-off from RFC 8554', () => {
    expect(row('secure-boot').cnsa).toBe(
      'LMS allowed; note that a larger Winternitz w makes signatures smaller but slows key generation, signing and verification (RFC 8554).'
    )
  })

  it('the state of a stateful key is kept in the signing hardware module, never on the verifying device', () => {
    expect(row('firmware-signing').state).toBe('Signing HSM, the device holds none.')
    expect(row('secure-boot').state).toBe(
      "The vendor's signing HSM, the device holds only the public key."
    )
    const backup = 'Signing HSM, backups must prevent state re-use (CNSA 2.0 FAQ p. 12).'
    expect(row('document-signing').state).toBe(backup)
    expect(row('timestamping').state).toBe(backup)
  })

  it('has dropped the phrases and figures that had no source', () => {
    const all = JSON.stringify(SCHEME_FOR_USE_ROWS)
    for (const gone of [
      'Better state recovery mechanisms',
      'PKI-integrated workflows',
      'massive signing capacity',
      '~10,000',
      '~100,000',
      '~1,000,000+',
      '~10,000,000+',
      '60-level',
      'Large W parameter',
      'OTP fuses',
      'secure element',
    ]) {
      expect(all, gone).not.toContain(gone)
      expect(constantsSource, `constants file: ${gone}`).not.toContain(gone)
    }
    expect(constantsSource).not.toContain('USE_CASE_RECOMMENDATIONS')
    expect(constantsSource).not.toContain('maxSignaturesNeeded')
  })
})
