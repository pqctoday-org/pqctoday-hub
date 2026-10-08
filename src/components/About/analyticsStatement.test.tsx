// SPDX-License-Identifier: GPL-3.0-only
/**
 * The desktop About and the phone About say the same thing about analytics and
 * about where your data goes, because both build it from analyticsStatement.ts.
 * The phone About used to say nothing about analytics, and said local data never
 * leaves your device "unless you opt in to sync" (sync is not enabled), while the
 * only privacy statement on a phone was on /terms.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { DataPrivacySection } from './sections/DataPrivacySection'
import { MobileAboutView } from '@/components/Mobile/screens/MobileAboutView'
import {
  ANALYTICS_DISCLOSURE,
  LOCAL_DATA_LEAVES_STATEMENT,
  PAGE_ADDRESS_STATEMENT,
  SEARCH_SCRUB_CLAUSE,
} from './analyticsStatement'

vi.mock('@/embed/EmbedProvider', () => ({ useIsEmbedded: () => false }))

const plain = (text: string | null) => (text ?? '').replace(/\s+/g, ' ').trim()
const SHARED = {
  'the analytics disclosure': ANALYTICS_DISCLOSURE,
  'the page address statement': PAGE_ADDRESS_STATEMENT,
  'the search scrubbing clause': SEARCH_SCRUB_CLAUSE,
  'the statement of when local data leaves the device': LOCAL_DATA_LEAVES_STATEMENT,
}

function desktopText() {
  const { container } = render(<DataPrivacySection />)
  fireEvent.click(screen.getByRole('button', { name: /Data Privacy/ }))
  return plain(container.textContent)
}

function phoneText() {
  const { container } = render(
    <MemoryRouter>
      <MobileAboutView />
    </MemoryRouter>
  )
  const group = screen
    .getAllByRole('button')
    .find((b) => /Data & privacy/.test(b.textContent ?? ''))
  fireEvent.click(group as HTMLElement)
  return plain(container.textContent)
}

describe('the About page says the same about analytics on a laptop and on a phone', () => {
  for (const [name, text] of Object.entries(SHARED)) {
    it(`the laptop carries ${name}`, () => {
      expect(desktopText()).toContain(text)
    })
    it(`the phone carries ${name}`, () => {
      expect(phoneText()).toContain(text)
    })
  }

  it('the phone says Google Analytics runs on every visit, in its own Analytics row', () => {
    const text = phoneText()
    expect(screen.getByRole('heading', { name: 'Analytics' })).toBeInTheDocument()
    // The heading is followed straight away by the sentence, so both are in the one row.
    expect(text).toMatch(/Analytics\s*Google Analytics 4 runs on every visit\./)
    expect(screen.getByText('every visit')).toBeInTheDocument()
    expect(screen.getByText('Google Analytics 4')).toBeInTheDocument()
  })

  it('the phone points to section 10 of the Terms with a link', () => {
    phoneText()
    expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms')
  })

  it('the phone no longer says local data stays put "unless you opt in to sync"', () => {
    const text = phoneText()
    expect(text).not.toMatch(/never leave your device\s+unless you opt in to sync/i)
    expect(text).not.toMatch(/no analytics tracking|no cookies,|collects no personal data/i)
  })
})
