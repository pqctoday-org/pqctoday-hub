// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SbomGenerationPicker } from './SbomGenerationPicker'

describe('SBOM generation tool references and scope', () => {
  it('selects npm guidance and links its primary documentation', () => {
    render(<SbomGenerationPicker />)
    fireEvent.click(screen.getByRole('button', { name: 'npm / Node package' }))
    const guidance = screen.getByText(/Choose the output format explicitly/)
    expect(guidance).toHaveTextContent('npm sbom --sbom-format=cyclonedx')
    expect(guidance).toHaveTextContent('your installed npm version')
    expect(screen.queryByText(/ships CycloneDX output by default/)).toBeNull()
    expect(screen.getByRole('link', { name: 'npm sbom documentation' })).toHaveAttribute(
      'href',
      'https://docs.npmjs.com/cli/commands/npm-sbom'
    )
    expect(screen.getByText(/This is a tool-finding starting point/)).toHaveTextContent(
      'not a compliance score'
    )
    fireEvent.click(screen.getByRole('button', { name: 'Container image' }))
    expect(screen.queryByText(/npm sbom --sbom-format=cyclonedx/)).toBeNull()
    expect(screen.getByText('Syft')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'npm / Node package' }))
    expect(screen.getByText(/Choose the output format explicitly/)).toHaveTextContent(
      'npm sbom --sbom-format=cyclonedx'
    )
  })

  it('does not assign a universal element score to generators', () => {
    render(<SbomGenerationPicker />)
    fireEvent.click(screen.getByRole('button', { name: 'npm / Node package' }))
    expect(screen.queryByText(/\d+\/10/)).toBeNull()
    expect(screen.getByText(/not a compliance score/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Container image' }))
    expect(screen.getByText('Syft')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Syft documentation' })).toHaveAttribute(
      'href',
      'https://github.com/anchore/syft'
    )
  })

  it('distinguishes pip-audit output from a VEX statement', () => {
    render(<SbomGenerationPicker />)
    fireEvent.click(screen.getByRole('button', { name: 'Python package' }))
    expect(screen.getByText(/not a VEX statement/)).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'pip-audit documentation and changelog' })
    ).toHaveAttribute('href', 'https://github.com/pypa/pip-audit')
  })
})
