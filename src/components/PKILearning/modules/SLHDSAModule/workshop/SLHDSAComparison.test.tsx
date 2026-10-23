// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The LMS / XMSS / SLH-DSA comparison (SLH-DSA module, workshop step 4): sizes come
 * from the RFC 8554 and RFC 8391 layouts for named SP 800-208 SHA-256/192 sets and
 * match the table in the Stateful Hash Signatures module (SLHDSALiveDemo.checks.test.tsx
 * pins the same 48 B / 1,500 B / 16,224 B); the CNSA 2.0 row follows the NSA FAQ v2.2.
 */
import { render, screen, within } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import '@testing-library/jest-dom'
import { SLHDSAComparison } from './SLHDSAComparison'

const rowOf = (label: string) => {
  const cell = screen.getByRole('cell', { name: label })
  return within(cell.closest('tr') as HTMLElement)
    .getAllByRole('cell')
    .map((c) => c.textContent)
}

describe('SLHDSAComparison', () => {
  it('prints named parameter sets and RFC-derived sizes instead of "Level 3" figures', () => {
    render(<SLHDSAComparison />)
    expect(rowOf('Parameter set shown in the size rows')).toEqual([
      'Parameter set shown in the size rows',
      'LMS_SHA256_M24_H10 / LMOTS_SHA256_N24_W4',
      'XMSS-SHA2_10_192',
      'SLH-DSA-SHA2-192s (-s) and SLH-DSA-SHA2-192f (-f)',
    ])
    // LMS 4+4+16+24 and 12+24*(51+1)+24*10; XMSS 4+2*24 and 4+24+51*24+10*24 (len = 51, SP 800-208 Table 12)
    expect(rowOf('Public key')).toEqual(['Public key', '48 B', '52 B', '48 B'])
    expect(rowOf('Signature')).toEqual([
      'Signature',
      '1,500 B',
      '1,492 B',
      '16,224 B (-s) / 35,664 B (-f)',
    ])
    const text = document.body.textContent ?? ''
    expect(text).not.toContain('Level 3')
    // the old XMSS 64 B (a bare 2n key without the OID)
    expect(text).not.toMatch(/(^|[^\d,])64 B/)
    expect(text).not.toContain('4,457')
    expect(text).toContain('compare size classes, not equal security')
  })

  it('lists every height SP 800-208 allows for LMS', () => {
    render(<SLHDSAComparison />)
    expect(rowOf('Max signatures')[1]).toBe('Up to 2^H (H = 5, 10, 15, 20 or 25)')
  })

  it('says HSS and XMSS^MT are not allowed and SLH-DSA is not approved for NSS', () => {
    render(<SLHDSAComparison />)
    const [, lms, xmss, slhdsa] = rowOf('CNSA 2.0')
    expect(lms).toMatch(/Single-tree LMS approved for firmware and software signing/)
    expect(lms).toMatch(/HSS not allowed/)
    expect(xmss).toMatch(/Single-tree XMSS approved/)
    expect(xmss).toMatch(/XMSS\^MT not allowed/)
    expect(slhdsa).toBe('Not approved for any use in NSS')
  })
})
