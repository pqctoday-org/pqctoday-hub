// SPDX-License-Identifier: AGPL-3.0-only
import { useLayoutEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { NOT_FOUND_LINKS, NOT_FOUND_SEARCH } from '@/seo/notFoundContent'
import { Button } from '@/components/ui/button'
import { markNotFound } from '@/seo/notFoundState'

/**
 * Shown for an address the app does not have a page for. It used to redirect to the home page, which
 * hid the mistake from the visitor and made every wrong address look like a copy of the home page.
 * PageMeta marks this page noindex without a canonical while it is showing.
 */
export function NotFoundView() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const search = (event: FormEvent) => {
    event.preventDefault()
    const term = query.trim()
    navigate(
      `${NOT_FOUND_SEARCH.action}${term ? `?${NOT_FOUND_SEARCH.param}=${encodeURIComponent(term)}` : ''}`
    )
  }

  useLayoutEffect(() => {
    markNotFound(pathname)
  }, [pathname])

  return (
    <div className="mx-auto max-w-2xl px-4 py-12" data-testid="not-found">
      <h1 className="mb-4 font-display text-3xl font-bold text-heading">Page not found</h1>
      <p className="mb-6 text-muted-foreground">
        We could not find{' '}
        <code className="break-all rounded-lg bg-chip px-1.5 py-0.5 text-chip-foreground">
          {pathname}
        </code>
        . It may have moved, or the address may be mistyped.
      </p>
      <form role="search" onSubmit={search} className="mb-6 flex flex-wrap items-end gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <label htmlFor="not-found-search" className="text-sm font-semibold text-heading">
            {NOT_FOUND_SEARCH.label}
          </label>
          <input
            id="not-found-search"
            type="search"
            name={NOT_FOUND_SEARCH.param}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
            className="min-h-[44px] w-full rounded-lg border border-border bg-card px-3 text-base text-foreground"
          />
        </div>
        <Button type="submit" variant="gradient" className="min-h-[44px]">
          {NOT_FOUND_SEARCH.button}
        </Button>
      </form>
      <p className="mb-2 font-display font-semibold text-heading">Where to go next</p>
      <ul className="space-y-1">
        {NOT_FOUND_LINKS.map((link) => (
          <li key={link.path}>
            <Link to={link.path} className="text-primary-legible hover:underline">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
