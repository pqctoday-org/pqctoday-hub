// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { CuriousOrientationView } from './CuriousOrientationView'

function renderView() {
  return render(
    <MemoryRouter>
      <CuriousOrientationView />
    </MemoryRouter>
  )
}

describe('CuriousOrientationView', () => {
  it('renders the "does this affect me?" card', () => {
    renderView()
    expect(screen.getByText('Does this affect me?')).toBeInTheDocument()
  })

  it('renders exactly one link out, to the full Compliance Landscape', () => {
    renderView()
    const link = screen.getByRole('link', { name: /See the full Compliance Landscape/ })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/compliance?tab=compliance')
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  it('does not render the previous profile editor / applicable-frameworks list', () => {
    renderView()
    expect(screen.queryByText('What applies to you')).not.toBeInTheDocument()
    expect(screen.queryByText(/Start the assessment/)).not.toBeInTheDocument()
  })

  it('does not claim that most current rules require RSA or ECC', () => {
    const { container } = renderView()
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/Most current rules/i)
    expect(text).not.toMatch(/require RSA or ECC/i)
    expect(text).not.toMatch(/tell organisations which cryptographic algorithms they must use/i)
  })

  it('separates risk obligations, technical standards, guidance and scoped algorithm mandates', () => {
    renderView()
    for (const kind of [
      'Risk obligations',
      'Technical standards',
      'Guidance',
      'Scoped algorithm mandates',
    ]) {
      expect(screen.getByText(kind)).toBeInTheDocument()
    }
    const item = (kind: string) =>
      screen.getAllByRole('listitem').find((li) => li.textContent?.startsWith(kind))?.textContent ??
      ''
    // Each kind is taught with an example that keeps its scope.
    expect(item('Risk obligations')).toMatch(/NIS2.*Article 21/)
    expect(item('Risk obligations')).toMatch(/names no algorithm/)
    expect(item('Technical standards')).toMatch(/FIPS 140-3.*US federal agencies/)
    expect(item('Guidance')).toMatch(/BSI TR-02102/)
    expect(item('Scoped algorithm mandates')).toMatch(/national security systems/)
    expect(item('Scoped algorithm mandates')).toMatch(/does not mandate it outside/)
  })

  it('tells the reader that scope decides which rules apply', () => {
    const { container } = renderView()
    expect(container.textContent).toMatch(/depends on your country, sector and systems/)
  })
})
