// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { INTEROP_MATRIX, CLIENT_CONFIGS, SERVER_CONFIGS } from '../data/testingConstants'
import { InteropTestMatrix } from './InteropTestMatrix'

describe('interop matrix evidence labels', () => {
  it('uses current browser documentation and avoids claiming measured pairwise results', () => {
    expect(CLIENT_CONFIGS.find((client) => client.id === 'chrome-hybrid')?.label).toContain('131+')
    expect(CLIENT_CONFIGS.find((client) => client.id === 'firefox-hybrid')?.label).toContain(
      '145+ Android'
    )
    for (const entries of Object.values(INTEROP_MATRIX)) {
      for (const entry of Object.values(entries)) {
        expect(entry.note).not.toMatch(/negotiated successfully|production-ready as of Chrome 130/i)
      }
    }
  })

  it('leaves the undocumented pure-PQC Cloudflare pairing unassessed', () => {
    expect(INTEROP_MATRIX['pure-pqc'].cloudflare.status).toBe('untested')
    expect(INTEROP_MATRIX['pure-pqc'].cloudflare.note).toMatch(/does not establish/i)
  })

  it('labels the visible matrix as scenario expectations and links its current sources', () => {
    render(<InteropTestMatrix />)
    expect(screen.getByText(/Illustrative matrix:/).parentElement).toHaveTextContent(
      /not captured handshakes/i
    )
    expect(screen.getByRole('link', { name: 'Cloudflare PQC support guide' })).toHaveAttribute(
      'href',
      'https://developers.cloudflare.com/ssl/post-quantum-cryptography/pqc-support/'
    )
    expect(screen.getByRole('link', { name: 'Firefox policy reference' })).toHaveAttribute(
      'href',
      'https://firefox-admin-docs.mozilla.org/reference/policies/postquantumkeyagreementenabled/'
    )
    expect(screen.getAllByText('Compatible (expected)').length).toBeGreaterThan(0)
  })

  it('lets keyboard users select a named client/server result and read its details', async () => {
    const user = userEvent.setup()
    render(<InteropTestMatrix />)
    const cells = screen.getAllByRole('button')
    expect(cells).toHaveLength(CLIENT_CONFIGS.length * SERVER_CONFIGS.length)
    const names = cells.map((cell) => cell.getAttribute('aria-label'))
    expect(names.every(Boolean)).toBe(true)
    expect(new Set(names).size).toBe(names.length)
    const cell = screen.getByRole('button', {
      name: /Chrome 131\+ .* to Cloudflare visitor TLS .* Compatible \(expected\)/,
    })
    cell.focus()
    expect(cell).toHaveFocus()
    expect(cell).toHaveAttribute('aria-pressed', 'false')
    await user.keyboard('{Enter}')
    expect(cell).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/Cloudflare documents Chrome 131\+/)).toBeInTheDocument()
  })
})
