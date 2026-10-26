// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection -- indices into the fixture rows rendered above */
/**
 * Secure Boot lesson, Learn tab:
 *  - the OS Kernel card says what mainline Linux supports for ML-DSA, with the same sentence as
 *    the OS Cryptographic Stacks lesson (ML-DSA module signing in Linux 7.0, IMA/EVM ML-DSA
 *    signatures in 7.2; the kernel module-signing documentation lists ML-DSA);
 *  - the role line for the certification engineer names the block that holds "What the lab tests";
 *  - the key-hierarchy table keeps every column reachable on a phone: below 640 px each key is a
 *    stacked block with its CNSA 2.0 / NSS line, and the text above the table names that column.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { SecureBootIntroduction } from './components/SecureBootIntroduction'
import { BOOT_CHAIN_STAGES, UEFI_KEY_TYPES } from './data/secureBootConstants'
import { PERSONA_BLOCKS } from '@/data/personaBlocks'

const KERNEL_SENTENCE =
  'ML-DSA kernel module signing is in mainline Linux from 7.0 (X.509 and PKCS#7); IMA/EVM ML-DSA signature verification from 7.2.'

const renderLearn = () =>
  render(
    <MemoryRouter>
      <SecureBootIntroduction onNavigateToWorkshop={() => {}} />
    </MemoryRouter>
  )

describe('Secure Boot: OS Kernel card', () => {
  it('states the mainline Linux versions and drops the old 6.9 and 2027 claims', () => {
    const kernel = BOOT_CHAIN_STAGES.find((s) => s.id === 'os-kernel')!
    expect(kernel.pqcStatus).toBe(KERNEL_SENTENCE)
    expect(kernel.pqcStatus).not.toMatch(/6\.9|6\.13|2027/)
  })

  it('shows that sentence on the Learn tab', () => {
    renderLearn()
    expect(screen.getByText(KERNEL_SENTENCE)).toBeInTheDocument()
  })
})

describe('Secure Boot: role line for the certification engineer', () => {
  it('names the block that holds "What the lab tests"', () => {
    const text = PERSONA_BLOCKS['/learn/secure-boot-pqc']!['cert-engineer']!
    expect(text).toContain(
      "Start with 'What the lab tests', inside 'ML-DSA-65 for Firmware Signature Migration' on the Learn tab"
    )
    renderLearn()
    const block = screen.getByRole('button', { name: /ML-DSA-65 for Firmware Signature Migration/ })
    fireEvent.click(block)
    expect(screen.getByRole('heading', { name: 'What the lab tests' })).toBeInTheDocument()
  })
})

describe('Secure Boot: UEFI key hierarchy table', () => {
  it('names the CNSA 2.0 / NSS column, not "the last column"', () => {
    renderLearn()
    expect(
      screen.getByText(/The CNSA 2\.0 \/ NSS column shows the NSS choice\./)
    ).toBeInTheDocument()
    expect(screen.queryByText(/The last column shows the NSS choice/)).not.toBeInTheDocument()
  })

  it('stacks each key below 640 px with its CNSA 2.0 / NSS line, and is a table from 640 px up', () => {
    renderLearn()
    const stacked = screen.getByTestId('uefi-key-table-stacked')
    expect(stacked).toHaveClass('sm:hidden')
    expect(screen.getByTestId('uefi-key-table-table')).toHaveClass('hidden', 'sm:block')
    const items = within(stacked).getAllByRole('listitem')
    expect(items).toHaveLength(UEFI_KEY_TYPES.length)
    UEFI_KEY_TYPES.forEach((kt, i) => {
      const item = within(items[i])
      expect(item.getByText(kt.name)).toBeInTheDocument()
      const terms = item.getAllByRole('term').map((t) => t.textContent)
      expect(terms).toEqual(['Owner', 'Current', 'PQC Target', 'CNSA 2.0 / NSS', 'Priority'])
      const nss = item.getAllByRole('definition')[terms.indexOf('CNSA 2.0 / NSS')]
      expect(nss).toHaveTextContent(kt.cnsaAlgorithm)
    })
  })

  it('has no sideways-scrolling region around the table at phone width', () => {
    renderLearn()
    expect(screen.queryByRole('region', { name: 'UEFI key hierarchy summary' })).toBeNull()
    expect(screen.getByRole('table', { name: 'UEFI key hierarchy summary' })).toBeInTheDocument()
  })
})
