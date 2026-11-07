// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { DatabaseEncryptionExercises } from './DatabaseEncryptionExercises'

function renderExercises() {
  const setConfig = vi.fn()
  const navigate = vi.fn()
  render(
    <MemoryRouter>
      <DatabaseEncryptionExercises
        onNavigateToWorkshop={navigate}
        onSetWorkshopConfig={setConfig}
      />
    </MemoryRouter>
  )
  return { setConfig, navigate }
}

describe('database encryption exercise wording', () => {
  it('describes the HSM and key-provider routes and the DEK wrap without a blanket FIPS or RSA claim', () => {
    renderExercises()
    expect(
      screen.getByText(
        /Oracle’s Transparent Data Encryption can use an HSM or external key manager/
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText(/pg_tde reaches an HSM only through an external key provider such as a KMIP/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Percona says it does not yet support post-quantum encryption/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Where a DEK wrap uses RSA-OAEP, that wrap needs a post-quantum replacement/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/protects its internal keys with a principal key from the key provider/)
    ).toBeInTheDocument()
    expect(screen.queryByText(/Oracle has HSM integration and FIPS validation/)).toBeNull()
    expect(screen.queryByText(/Both use RSA-OAEP for DEK wrapping/)).toBeNull()
  })

  it('presents the queryable matrix as conditions per operation, not a ranking', () => {
    renderExercises()
    expect(
      screen.getByText(/compares documented conditions per operation, not an overall ranking/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/equality queries from 7\.0, range queries from 8\.0/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/public preview in 8\.2 and generally available in 9\.0/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Always Encrypted adds range and LIKE matching only with a secure enclave/)
    ).toBeInTheDocument()
    expect(screen.getByText(/None of these schemes is shown as PQC-ready/)).toBeInTheDocument()
    expect(screen.queryByText(/most capable queryable encryption solution/)).toBeNull()
  })

  it('tells the reader to use the condition notes and what Unknown means', () => {
    renderExercises()
    expect(
      screen.getByText(/pg_tde shows a cross in every column, and read the condition notes/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/"Unknown" means not verified here, not unsupported/)
    ).toBeInTheDocument()
    expect(screen.queryByText(/shows all zeros in the matrix/)).toBeNull()
  })

  it('keeps the workshop routing of the queryable exercise', () => {
    const { setConfig, navigate } = renderExercises()
    screen.getByRole('heading', { name: '4. Queryable Encryption Compatibility Matrix' })
    fireEvent.click(screen.getAllByRole('button', { name: 'Load & Run' })[3])
    expect(setConfig).toHaveBeenCalledExactlyOnceWith({ step: 3 })
    expect(navigate).toHaveBeenCalledOnce()
  })
})
