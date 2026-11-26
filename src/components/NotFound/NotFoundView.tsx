// SPDX-License-Identifier: AGPL-3.0-only
import { useLayoutEffect } from 'react'
import { Link, useLocation } from 'react-router'
import { NOT_FOUND_LINKS } from '@/seo/notFoundContent'
import { markNotFound } from '@/seo/notFoundState'

/**
 * Shown for an address the app does not have a page for. It used to redirect to the home page, which
 * hid the mistake from the visitor and made every wrong address look like a copy of the home page.
 * PageMeta marks this page noindex without a canonical while it is showing.
 */
export function NotFoundView() {
  const { pathname } = useLocation()

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
