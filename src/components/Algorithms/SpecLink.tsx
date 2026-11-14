// SPDX-License-Identifier: AGPL-3.0-only
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ExternalLink } from 'lucide-react'
import { specLink } from './libraryRef'

interface SpecLinkProps {
  /** The matrix citation's id (`DimensionRef.id` or `ProtocolDoc.id`). */
  docId: string
  /** The citation's own address; opened when the Library holds no entry for it. */
  url?: string
  className?: string
  children: ReactNode
}

/**
 * A matrix citation chip. Opens the Library entry in the app when there is one;
 * otherwise opens the cited external page in a new tab instead of a Library
 * search that finds nothing.
 */
export function SpecLink({ docId, url, className, children }: SpecLinkProps) {
  const link = specLink(docId, url)
  if (link.kind === 'external') {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        title={link.title}
        className={className}
      >
        {children}
        <ExternalLink size={9} className="shrink-0" aria-hidden="true" />
      </a>
    )
  }
  return (
    <Link to={link.to} title={link.title} className={className}>
      {children}
    </Link>
  )
}
