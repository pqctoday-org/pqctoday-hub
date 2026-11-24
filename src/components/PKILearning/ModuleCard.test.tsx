// SPDX-License-Identifier: AGPL-3.0-only
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { MODULE_CATALOG } from './moduleData'
import { ModuleCard } from './ModuleCard'

describe('ModuleCard', () => {
  it('shows the learning stage chip for catalogue modules', () => {
    render(
      <MemoryRouter>
        <ModuleCard module={MODULE_CATALOG['pqc-algorithms']} onSelectModule={() => undefined} />
      </MemoryRouter>
    )

    expect(screen.getByText('Stage 2 · Core concepts')).toBeInTheDocument()
  })
})
