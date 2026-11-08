// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import type { KatTestSpec } from '@/utils/katRunner'

const panelProps: { specs: KatTestSpec[]; label: string; authorityNote: string }[] = []

vi.mock('@/components/shared/KatValidationPanel', () => ({
  KatValidationPanel: (props: { specs: KatTestSpec[]; label: string; authorityNote: string }) => {
    panelProps.push(props)
    return null
  },
}))

import { AbstractionLayerDemo } from './AbstractionLayerDemo'

function renderPanelProps() {
  panelProps.length = 0
  render(<AbstractionLayerDemo />)
  return panelProps[0]
}

describe('AbstractionLayerDemo sample checks', () => {
  it('does not attribute an ML-DSA-65 check to CNSA 2.0, which specifies ML-DSA-87', () => {
    const { specs } = renderPanelProps()
    const mldsa65 = specs.filter(
      (s) => s.kind.type === 'mldsa-functional' && 'variant' in s.kind && s.kind.variant === 65
    )
    expect(mldsa65.length).toBeGreaterThan(0)
    for (const s of mldsa65) {
      expect(s.standard ?? '').not.toMatch(/CNSA/i)
      expect(s.standard ?? '').toMatch(/FIPS 204/)
    }
  })

  it('only names CNSA 2.0 on a check whose parameter set CNSA 2.0 actually uses', () => {
    const { specs, authorityNote } = renderPanelProps()
    for (const s of specs) {
      if (/CNSA/i.test(s.standard ?? '')) {
        expect(s.kind.type === 'mldsa-functional' && 'variant' in s.kind && s.kind.variant).toBe(87)
      }
    }
    // the panel-level note may mention CNSA 2.0 only to say what it specifies, never as the authority
    expect(authorityNote).not.toMatch(/^CNSA 2\.0 ·/)
    expect(authorityNote).toMatch(/ML-DSA-87/)
  })

  it('says the sample runs are not module validation', () => {
    const { authorityNote, label } = renderPanelProps()
    expect(authorityNote).toMatch(/not cryptographic-module validation/i)
    expect(label).not.toMatch(/known answer/i)
  })
})
