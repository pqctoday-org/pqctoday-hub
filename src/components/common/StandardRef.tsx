// SPDX-License-Identifier: GPL-3.0-only
/**
 * A standards citation that links to the document in this app's own library
 * when it exists there, and renders as plain text when it does not.
 *
 * The business tools cite heavily and link almost nothing — 49 references and
 * zero URLs in the Audit Readiness Checklist, 57 against one URL in the Policy
 * Template Generator (audit 2026-08-10, W3-3). The documents are already in
 * the library; this connects a citation to its source in one place instead of
 * each tool hand-rolling a URL.
 */
import { Link } from 'react-router'
import { standardRefHref } from '@/utils/standardRef'

export interface StandardRefProps {
  /** Citation as it reads in prose, e.g. "FIPS 203" or "NIST SP 800-88". */
  cite: string
  /** Optional display text; defaults to the citation itself. */
  children?: React.ReactNode
  className?: string
}

export function StandardRef({ cite, children, className }: StandardRefProps) {
  const href = standardRefHref(cite)
  const label = children ?? cite
  if (!href) return <>{label}</>
  return (
    <Link
      to={href}
      // `underline`, not `hover:underline`: this renders inline in prose (see
      // the doc comment above), so colour alone is not a sufficient
      // affordance (axe link-in-text-block / WCAG 1.4.1).
      className={className ?? 'text-primary underline'}
      title={`Open ${cite} in the library`}
    >
      {label}
    </Link>
  )
}
