// SPDX-License-Identifier: GPL-3.0-only
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

const ROUTE_NAMES: Record<string, string> = {
  timeline: 'Timeline',
  algorithms: 'Algorithms',
  library: 'Library',
  learn: 'Learn',
  playground: 'Playground',
  openssl: 'OpenSSL Lab',
  threats: 'Threats',
  leaders: 'Leaders',
  compliance: 'Compliance',
  changelog: 'Changelog',
  migrate: 'Migrate',
  assess: 'Assess',
  about: 'About',
  quiz: 'Quiz',
}

function labelFor(segment: string): string {
  return ROUTE_NAMES[segment] ?? segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function Breadcrumb() {
  const { pathname } = useLocation()
  const segments = pathname.split('/').filter(Boolean)

  // Only render for nested paths (depth ≥ 2, e.g. /learn/quantum-basics)
  if (segments.length < 2) return null

  const crumbs = segments.map((seg, i) => ({
    label: labelFor(seg),
    path: '/' + segments.slice(0, i + 1).join('/'),
  }))

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1 text-xs text-muted-foreground mb-3 print:hidden overflow-hidden"
    >
      <Link
        to="/"
        className="flex items-center hover:text-foreground transition-colors shrink-0"
        aria-label="Home"
      >
        <Home size={12} aria-hidden="true" />
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={crumb.path} className="flex items-center gap-1 min-w-0 shrink">
          <ChevronRight size={10} className="text-muted-foreground/40" aria-hidden="true" />
          {i === crumbs.length - 1 ? (
            <span
              className="text-foreground max-w-[150px] md:max-w-none truncate min-w-0"
              aria-current="page"
            >
              {crumb.label}
            </span>
          ) : (
            <Link
              to={crumb.path}
              className="hover:text-foreground transition-colors max-w-[120px] md:max-w-none truncate min-w-0"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
