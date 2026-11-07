// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SbomGenerationPicker } from './SbomGenerationPicker'

describe('authored SBOM comparison scope', () => {
  it('keeps the npm comparison while avoiding a contradictory universal gap claim', () => {
    render(<SbomGenerationPicker />)
    fireEvent.click(screen.getByRole('button', { name: 'npm / Node package' }))
    expect(screen.getByText(/CycloneDX mode: 9\/10/).textContent).toContain(
      'missing only Author Signature'
    )
    expect(screen.getByText(/This authored comparison/).textContent).toContain(
      'not a universal compliance finding'
    )
    expect(screen.getByText(/This authored comparison/).textContent).toContain(
      'the npm CycloneDX example lists only Author Signature as missing'
    )
    expect(screen.queryByText(/Two gaps are universal/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Container image' }))
    expect(screen.getByText('Syft')).toBeTruthy()
    expect(screen.getByText(/4\/10 new elements solid/)).toBeTruthy()
  })
})
