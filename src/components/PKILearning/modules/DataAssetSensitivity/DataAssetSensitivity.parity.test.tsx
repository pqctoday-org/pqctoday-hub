// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render-parity golden test for the DataAssetSensitivity ModuleShell conversion.
 * Captured against the PRE-conversion module; must stay green after the module
 * adopts <ModuleShell>, proving the conversion is behaviour-preserving.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { DataAssetSensitivityModule } from './index'

describe('DataAssetSensitivity render parity', () => {
  it('renders the gradient header, the in-page description, and all six tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <DataAssetSensitivityModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    // header title (renders the literal "&" — JSX entity in source only); the
    // in-page <h1> differs from manifest.title, so it is supplied via the slot
    expect(
      screen.getByRole('heading', { name: 'Data & Asset Sensitivity Assessment' })
    ).toBeInTheDocument()
    // in-page description differs from the catalog description (the override slot)
    expect(
      screen.getByText(/Classify your data assets, map compliance obligations across GDPR/)
    ).toBeInTheDocument()
    // the standard six-tab set (triggers render as buttons)
    for (const name of [
      'Learn',
      'Visual',
      'Workshop',
      'Exercises',
      'References',
      'Tools & Products',
    ]) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
  })
})
