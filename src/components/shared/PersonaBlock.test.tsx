// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The certification engineer's OpenSSL Studio paragraph sends the reader to NIST's known-answer
 * samples "on the Validation tab on the Algorithms page". Those words are a link to that tab, on
 * the desktop paragraph and on the phone twin; the sentence reads the same with or without it.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { PersonaBlock } from './PersonaBlock'
import { MobilePersonaBlock } from '../Mobile/MobilePersonaBlock'
import { PERSONA_BLOCKS } from '@/data/personaBlocks'
import { usePersonaStore } from '@/store/usePersonaStore'

const ROUTE = '/playground/openssl-studio'
const LINK_NAME = 'Validation tab on the Algorithms page'

const withRouter = (ui: React.ReactNode) => render(<MemoryRouter>{ui}</MemoryRouter>)

describe('PersonaBlock links inside a paragraph', () => {
  beforeEach(() => usePersonaStore.setState({ selectedPersona: 'cert-engineer' }))

  it('desktop: "Validation tab on the Algorithms page" links to /algorithms?tab=validation', () => {
    withRouter(<PersonaBlock route={ROUTE} />)
    const link = screen.getByRole('link', { name: LINK_NAME })
    expect(link).toHaveAttribute('href', '/algorithms?tab=validation')
    // The same words as before, and no link syntax left on the page.
    const block = screen.getByTestId('persona-block')
    expect(block).toHaveTextContent(
      'For NIST known-answer samples use the Validation tab on the Algorithms page.'
    )
    expect(block.textContent).not.toMatch(/[[\]]|\(\/algorithms/)
  })

  it('phone: the same words are the same link', () => {
    withRouter(<MobilePersonaBlock route={ROUTE} />)
    expect(screen.getByRole('link', { name: LINK_NAME })).toHaveAttribute(
      'href',
      '/algorithms?tab=validation'
    )
    expect(screen.getByTestId('persona-block').textContent).not.toMatch(/[[\]]|\(\/algorithms/)
  })

  it('a paragraph without a link renders as plain text, with no link', () => {
    usePersonaStore.setState({ selectedPersona: 'developer' })
    withRouter(<PersonaBlock route="/playground/hybrid-encrypt" />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByTestId('persona-block')).toHaveTextContent(
      PERSONA_BLOCKS['/playground/hybrid-encrypt']!.developer ?? ''
    )
  })
})
