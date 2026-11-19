// SPDX-License-Identifier: AGPL-3.0-only
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SbomFormatExplorer } from './SbomFormatExplorer'

describe('SBOM format explorer examples', () => {
  it('uses the declared license field and labels relationship scope', () => {
    render(<SbomFormatExplorer />)
    const spdx = screen.getByText(/SPDX package entry/).parentElement?.querySelector('pre')
    expect(spdx?.textContent).toContain('"licenseDeclared": "MIT"')
    expect(spdx?.textContent).not.toContain('licenseConcluded')
    expect(
      screen.getByText(/dependency relationships are represented elsewhere/)
    ).toBeInTheDocument()
  })

  it('labels the mapping as an example rather than a conformance result', () => {
    render(<SbomFormatExplorer />)
    expect(
      screen.getByRole('heading', { name: /Example mappings for nine minimum elements/ })
    ).toBeVisible()
    expect(screen.getByText(/does not certify complete CISA conformance/)).toBeInTheDocument()
  })
})
