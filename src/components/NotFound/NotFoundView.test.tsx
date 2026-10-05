// SPDX-License-Identifier: GPL-3.0-only
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import '@testing-library/jest-dom'
import { PageMeta } from '@/seo/PageMeta'
import { NOT_FOUND_LINKS, NOT_FOUND_TITLE } from '@/seo/notFoundContent'
import { NotFoundView } from './NotFoundView'

/**
 * The screen for an address with no page, together with PageMeta: it must say so, be noindex with no
 * canonical, and give all of that back as soon as the visitor reaches a real page.
 */

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <PageMeta />
      <Routes>
        <Route path="/about" element={<h1>About page</h1>} />
        <Route path="*" element={<NotFoundView />} />
      </Routes>
    </MemoryRouter>
  )
}

const head = (selector: string) => document.head.querySelector(selector)

afterEach(() => {
  // Unmount first, so React removes the tags it put in the head, then clear anything left.
  cleanup()
  document.head.innerHTML = ''
})

describe('NotFoundView', () => {
  it('says the page was not found, with one heading and the address that was asked for', () => {
    renderAt('/definitely-not-a-page')
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Page not found')
    expect(screen.getByText('/definitely-not-a-page')).toBeInTheDocument()
  })

  it('links to the main sections', () => {
    renderAt('/nothing-here')
    for (const link of NOT_FOUND_LINKS) {
      expect(screen.getByRole('link', { name: link.label })).toHaveAttribute('href', link.path)
    }
  })

  it('does not redirect: the address stays the one that was asked for', () => {
    renderAt('/nothing-here')
    expect(screen.getByTestId('not-found')).toBeInTheDocument()
    expect(screen.queryByText('About page')).toBeNull()
  })
})

describe('PageMeta on the not-found screen', () => {
  it('is noindex, has the not-found title and no canonical or og:url', async () => {
    renderAt('/definitely-not-a-page')
    await waitFor(() => expect(document.title).toBe(NOT_FOUND_TITLE))
    expect(head('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow')
    expect(head('link[rel="canonical"]')).toBeNull()
    expect(head('meta[property="og:url"]')).toBeNull()
  })

  it('gives all of that back on a real page: indexable again, with its own canonical', async () => {
    renderAt('/missing')
    await waitFor(() => expect(head('meta[name="robots"]')).not.toBeNull())
    await userEvent.click(screen.getByRole('link', { name: 'About' }))
    expect(await screen.findByText('About page')).toBeInTheDocument()
    await waitFor(() => expect(head('meta[name="robots"]')).toBeNull())
    expect(head('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.pqctoday.com/about')
    expect(document.title).not.toBe(NOT_FOUND_TITLE)
  })

  it('removes the static not-found tags from 404.html once the app has taken over', async () => {
    document.head.innerHTML =
      '<title data-static-404>Static</title><meta data-static-404 name="robots" content="noindex,follow">'
    renderAt('/about')
    expect(await screen.findByText('About page')).toBeInTheDocument()
    await waitFor(() => expect(document.head.querySelector('[data-static-404]')).toBeNull())
    expect(head('meta[name="robots"]')).toBeNull()
  })
})
