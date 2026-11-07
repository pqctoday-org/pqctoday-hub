// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { EMVPaymentIntroduction } from './components/EMVPaymentIntroduction'
import { MIGRATION_VECTORS } from './data/migrationRiskData'

const flat = (s: string) => s.replace(/\s+/g, ' ')

describe('3-D Secure wording does not say ECDSA signs the cardholder challenge', () => {
  it('the lesson text describes the sourced token and key-agreement picture and what it leaves unverified', () => {
    render(
      <MemoryRouter initialEntries={['/learn/emv-payment-pqc?section=ecommerce']}>
        <EMVPaymentIntroduction onNavigateToWorkshop={vi.fn()} />
      </MemoryRouter>
    )
    const text = flat(document.body.textContent ?? '')
    expect(text).toMatch(/This module does not verify its signing details/)
    expect(text).toMatch(/ES256 \(ECDSA P-256\) or PS256 \(RSA-PSS\)/)
    expect(text).toMatch(/P-256 Diffie-Hellman key agreement for the challenge channel/)
    expect(text).not.toMatch(/adds cardholder authentication using ECDSA challenge signing/)
    expect(text).not.toMatch(/3DS challenge signing:/)
  })

  it('the migration risk row for 3-D Secure states the same picture', () => {
    const row = MIGRATION_VECTORS.find((r) => r.component === '3ds-authentication')
    expect(row).toBeDefined()
    expect(row!.vulnerability).toMatch(/signing details are not verified here/)
    expect(row!.vulnerability).toMatch(/ES256 \(ECDSA P-256\) or PS256 \(RSA-PSS\)/)
    expect(row!.vulnerability).not.toMatch(/uses ECDSA for challenge-response signing/)
    expect(row!.currentCrypto.join(' ')).not.toMatch(/challenge signing/)
  })
})
