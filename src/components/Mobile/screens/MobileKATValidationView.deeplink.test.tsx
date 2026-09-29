// SPDX-License-Identifier: GPL-3.0-only
/** `?section=attacks` / `?attack=` on the phone Validation screen. */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

vi.mock('@/hooks/useHSM', () => ({
  useHSM: () => ({
    isReady: true,
    moduleRef: { current: {} },
    hSessionRef: { current: 1 },
    slotRef: { current: 0 },
    initialize: vi.fn(),
  }),
}))

import { MobileKATValidationView } from './MobileKATValidationView'

const attacksButton = () => screen.getByRole('button', { name: /Implementation Attacks/ })

describe('MobileKATValidationView — deep links', () => {
  it('?section=attacks opens the attacks list', () => {
    render(<MobileKATValidationView sectionParam="attacks" />)
    expect(attacksButton()).toHaveAttribute('aria-expanded', 'true')
  })

  it('re-reads the link on same-route change', () => {
    const { rerender } = render(<MobileKATValidationView />)
    expect(attacksButton()).toHaveAttribute('aria-expanded', 'false')
    rerender(<MobileKATValidationView sectionParam="attacks" />)
    expect(attacksButton()).toHaveAttribute('aria-expanded', 'true')
  })

  it('?attack opens the list and marks the resolved profile', () => {
    render(<MobileKATValidationView attackParam="ml-kem-768" attackProfile="ML-KEM / Kyber" />)
    // eslint-disable-next-line testing-library/no-node-access
    const card = document.querySelector('[data-deeplink-id="attack-ML-KEM / Kyber"]')
    expect(card).toHaveClass('border-primary/60')
  })

  it('an unresolved ?attack says so', () => {
    render(<MobileKATValidationView attackParam="nope" attackProfile={null} />)
    expect(screen.getByTestId('deeplink-notice-not-found')).toHaveTextContent('nope')
  })

  it('toggling writes ?section (and closing clears ?attack)', () => {
    const onUpdateParams = vi.fn()
    render(<MobileKATValidationView onUpdateParams={onUpdateParams} />)
    fireEvent.click(attacksButton())
    expect(onUpdateParams).toHaveBeenLastCalledWith({ section: 'attacks' })
    fireEvent.click(attacksButton())
    expect(onUpdateParams).toHaveBeenLastCalledWith({ section: null, attack: null })
  })
})
