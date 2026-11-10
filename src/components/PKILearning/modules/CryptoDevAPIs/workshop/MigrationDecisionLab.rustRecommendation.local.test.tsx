// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MigrationDecisionLab } from './MigrationDecisionLab'
import { MIGRATION_PATHS } from '../data/migrationData'
import { DEV_LANGUAGES } from '../data/languageData'

describe('Rust migration recommendation', () => {
  it('routes to a complete, versioned ML-DSA example and resets the recommendation', () => {
    render(<MigrationDecisionLab />)
    fireEvent.click(screen.getByRole('button', { name: 'Rust' }))
    fireEvent.click(screen.getByRole('button', { name: 'RustCrypto crates' }))
    expect(screen.getByText('Rust: Add standardized ML-DSA signing')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /View full migration path/ }))
    expect(screen.getByText(/Create a Cargo binary project using edition 2024/)).toBeInTheDocument()
    expect(screen.getByText(/ml-dsa =/)).toHaveTextContent('version = "=0.1.2"')
    const path = MIGRATION_PATHS.find((entry) => entry.id === 'add-pqcrypto')!
    expect(
      screen.getByText(path.afterCode.code, { normalizer: (value) => value })
    ).toBeInTheDocument()
    expect(path.afterCode.code).toContain('fn main() -> Result<(), ml_dsa::Error>')
    expect(path.afterCode.code).toContain('try_sign(message)?')
    expect(path.afterCode.code).not.toMatch(/dilithium3|pqcrypto/)
    fireEvent.click(screen.getByRole('button', { name: 'Decision Wizard' }))
    fireEvent.click(screen.getByRole('button', { name: /Start over/ }))
    expect(screen.queryByText('Recommended Migration Path')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Rust' }))
    fireEvent.click(screen.getByRole('button', { name: 'ring' }))
    expect(screen.getByText('Rust: Move from ring to aws-lc-rs')).toBeInTheDocument()
  })

  it('distinguishes maintained final algorithms from archived legacy APIs and validation', () => {
    const rust = DEV_LANGUAGES.find((entry) => entry.id === 'rust')!
    expect(rust.cryptoLibraries.find((entry) => entry.name === 'RustCrypto')?.pqcSupport).toBe(true)
    expect(rust.cryptoLibraries.find((entry) => entry.name === 'pqcrypto')?.description).toMatch(
      /Archived.*legacy/
    )
    expect(rust.cryptoDevContext).toMatch(/unaudited ml-dsa 0.1.2/)
    expect(rust.cryptoDevContext).toMatch(/exact module/)
  })
})
