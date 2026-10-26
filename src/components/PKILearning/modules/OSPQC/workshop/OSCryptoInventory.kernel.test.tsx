// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The Kernel Module Signing row of the OS crypto inventory says what mainline Linux supports for
 * ML-DSA, with the same sentence as the Secure Boot lesson's OS Kernel card: ML-DSA module
 * signing from Linux 7.0 (the kernel's module-signing documentation lists ML-DSA), IMA/EVM
 * ML-DSA signatures from 7.2.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { OSCryptoInventory } from './OSCryptoInventory'
import { BOOT_CHAIN_STAGES } from '../../SecureBootPQC/data/secureBootConstants'

const KERNEL_SENTENCE =
  'ML-DSA kernel module signing is in mainline Linux from 7.0 (X.509 and PKCS#7); IMA/EVM ML-DSA signature verification from 7.2.'

describe('OS crypto inventory: kernel module signing', () => {
  it('uses the mainline Linux 7.0 / 7.2 sentence, not the old 6.13 claim', () => {
    render(
      <MemoryRouter>
        <OSCryptoInventory />
      </MemoryRouter>
    )
    const note = screen.getAllByText(
      new RegExp(KERNEL_SENTENCE.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'))
    )
    expect(note.length).toBeGreaterThan(0)
    expect(document.body.textContent).not.toMatch(/Linux 6\.13/)
  })

  it('says the same thing as the Secure Boot lesson', () => {
    const kernel = BOOT_CHAIN_STAGES.find((s) => s.id === 'os-kernel')!
    expect(kernel.pqcStatus).toBe(KERNEL_SENTENCE)
  })
})
