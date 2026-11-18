// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useLayoutEffect } from 'react'
import { useLocation } from 'react-router'
import { getRouteMeta } from './routeMeta'
import { NOT_FOUND_DESCRIPTION, NOT_FOUND_TITLE } from './notFoundContent'
import { useNotFoundPath } from './notFoundState'

/**
 * Keeps the title from the HTML shell available during startup, then updates
 * it in place. React hoists the other route metadata into the head.
 */
export function PageMeta() {
  const { pathname } = useLocation()
  // The app is showing its "page not found" screen for this address: no canonical (there is no page
  // to point to), noindex, and nothing that describes a real page.
  const isNotFound = useNotFoundPath() === pathname
  const meta = isNotFound
    ? { title: NOT_FOUND_TITLE, description: NOT_FOUND_DESCRIPTION, canonical: '', noindex: true }
    : getRouteMeta(pathname)

  useLayoutEffect(() => {
    document.title = meta.title
  }, [meta.title])

  // The saved 404 page can also serve app-only routes. Keep its title element,
  // and remove the temporary description and robots tags once the app takes over.
  useEffect(() => {
    for (const element of document.head.querySelectorAll('[data-static-404]:not(title)')) {
      element.remove()
    }
  }, [])

  return (
    <>
      <meta name="description" content={meta.description} />
      {!isNotFound && <link rel="canonical" href={meta.canonical} />}
      {meta.noindex && <meta name="robots" content="noindex,follow" />}

      {/* Open Graph */}
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      {!isNotFound && <meta property="og:url" content={meta.canonical} />}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="PQC Today" />
      <meta property="og:image" content={meta.ogImage ?? 'https://www.pqctoday.com/og-image.png'} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      <meta
        name="twitter:image"
        content={meta.ogImage ?? 'https://www.pqctoday.com/og-image.png'}
      />

      {/* Structured Data */}
      {meta.structuredData && (
        <script type="application/ld+json">{JSON.stringify(meta.structuredData)}</script>
      )}
    </>
  )
}
