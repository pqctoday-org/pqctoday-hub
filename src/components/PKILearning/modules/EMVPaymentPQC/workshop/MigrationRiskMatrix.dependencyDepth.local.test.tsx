// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MigrationRiskMatrix } from './MigrationRiskMatrix'
import { MIGRATION_VECTORS } from '../data/migrationRiskData'

const ecommerce = MIGRATION_VECTORS.find((v) => v.component === 'ecommerce-tls')!
const keyInjection = MIGRATION_VECTORS.find((v) => v.component === 'key-injection')!

describe('payment dependency depth is not a duration-based critical path', () => {
  it('retains independent components, existing depth levels and selected-dependency navigation', () => {
    render(
      <MemoryRouter>
        <MigrationRiskMatrix />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Dependencies' }))
    expect(screen.getByText('Illustrative Dependency Depth')).toBeInTheDocument()
    expect(screen.getByText(/Depth is not a duration-based critical path/)).toHaveTextContent(
      'does not calculate a deployment schedule'
    )
    expect(screen.getByText(/Depth 0.*No Prerequisites Recorded in This View/)).toBeInTheDocument()
    expect(screen.getByText(/Depth 3.*Deepest Shown Dependency Level/)).toBeInTheDocument()
    expect(screen.queryByText(/\(Critical Path\)/)).not.toBeInTheDocument()
    expect(ecommerce.dependencies).toEqual([])
    expect(keyInjection.dependencies).toEqual(['hsm-key-wrapping'])
    fireEvent.click(
      screen.getAllByRole('button', {
        name: /Key Injection Facilities \(KIF\)/,
      })[0]
    )
    expect(screen.getByText('Recorded dependencies in this sample plan')).toBeInTheDocument()
    const hsm = MIGRATION_VECTORS.find((v) => v.component === 'hsm-key-wrapping')!
    fireEvent.click(screen.getByRole('button', { name: hsm.componentLabel }))
    expect(screen.queryByText('Recorded dependencies in this sample plan')).not.toBeInTheDocument()
  })

  it('keeps stored timeline ranges and original source-defined components visible', () => {
    render(
      <MemoryRouter>
        <MigrationRiskMatrix />
      </MemoryRouter>
    )
    const timeline = screen.getByRole('region', { name: 'Migration timeline overview' })
    expect(timeline).toHaveTextContent('2025')
    expect(timeline).toHaveTextContent('2035')
    for (const vector of MIGRATION_VECTORS) {
      expect(timeline).toHaveTextContent(vector.componentLabel)
      expect(timeline).toHaveTextContent(vector.migrationTimeline)
    }
    expect(timeline).toHaveTextContent('RSA/ECC deprecated after 2030')
    expect(timeline).toHaveTextContent('RSA/ECC disallowed after 2035')
  })
})
