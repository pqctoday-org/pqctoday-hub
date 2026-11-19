// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { StackMigrationDiffs } from './StackMigrationDiffs'
import { STACK_MIGRATION_DIFFS } from '../stackMigrationDiffs'

describe('StackMigrationDiffs', () => {
  it('renders all four core late-2026 developer stacks and defaults to Go 1.24+', () => {
    render(<StackMigrationDiffs />)
    expect(
      screen.getByRole('region', { name: 'Before and after code migration diffs' })
    ).toBeInTheDocument()

    for (const label of ['Go 1.24+', 'OpenSSL 3.5+', 'Node.js 24+', 'Java 24+ JCA']) {
      expect(screen.getByRole('tab', { name: label })).toBeInTheDocument()
    }

    expect(screen.getByRole('tab', { name: 'Go 1.24+' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText(/mlkem\.GenerateKey768\(\)/)).toBeInTheDocument()
    expect(screen.getAllByText(/tls\.X25519MLKEM768/).length).toBeGreaterThanOrEqual(1)
  })

  it('switches cleanly across OpenSSL 3.5+, Node.js 24+, and Java 24+ JCA diffs with caveats', () => {
    render(<StackMigrationDiffs />)

    fireEvent.click(screen.getByRole('tab', { name: 'OpenSSL 3.5+' }))
    expect(screen.getByText(/EVP_PKEY_encapsulate_init/)).toBeInTheDocument()
    expect(
      screen.getByText(/EVP_PKEY_CTX_new_from_name\(NULL, "ML-DSA-65", NULL\)/)
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Node.js 24+' }))
    expect(screen.getByText(/generateKeyPairSync\('ml-kem-768'\)/)).toBeInTheDocument()
    expect(screen.getByText(/decapsulate\(kem\.privateKey, ciphertext\)/)).toBeInTheDocument()
    expect(screen.getByText(/X25519MLKEM768:X25519:P-256/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Java 24+ JCA' }))
    expect(screen.getByText(/KeyPairGenerator\.getInstance\("ML-KEM-768"\)/)).toBeInTheDocument()
    expect(screen.getByText(/KEM\.getInstance\("ML-KEM"\)/)).toBeInTheDocument()
    expect(screen.getByText(/Signature\.getInstance\("ML-DSA-65"\)/)).toBeInTheDocument()
    expect(screen.getByText('What This Diff Proves vs. Production Checks')).toBeInTheDocument()
  })

  it('includes FIPS 203/204 sizing and verification boundaries for every stack', () => {
    expect(STACK_MIGRATION_DIFFS).toHaveLength(4)
    for (const stack of STACK_MIGRATION_DIFFS) {
      expect(stack.beforeCode.length).toBeGreaterThan(50)
      expect(stack.afterCode.length).toBeGreaterThan(50)
      expect(stack.apiCapability).toMatch(/\S/)
      expect(stack.interopCaveats).toMatch(/\S/)
      expect(stack.verificationBoundary).toMatch(/\S/)
    }
  })
})
