import { useLocation } from 'react-router-dom'
import { getRouteMeta } from './routeMeta'

/**
 * Renders per-route SEO metadata using React 19's native document metadata hoisting.
 * React 19 automatically hoists <title>, <meta>, and <link> tags to <head>.
 */
export function PageMeta() {
  const { pathname } = useLocation()
  const meta = getRouteMeta(pathname)

  return (
    <>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <link rel="canonical" href={meta.canonical} />

      {/* Open Graph */}
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:url" content={meta.canonical} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="PQC Today" />
      <meta property="og:image" content={meta.ogImage ?? 'https://pqctoday.com/og-image.png'} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      <meta name="twitter:image" content={meta.ogImage ?? 'https://pqctoday.com/og-image.png'} />

      {/* Structured Data */}
      {meta.structuredData && (
        <script type="application/ld+json">{JSON.stringify(meta.structuredData)}</script>
      )}
    </>
  )
}
