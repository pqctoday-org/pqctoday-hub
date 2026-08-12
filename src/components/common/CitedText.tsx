// SPDX-License-Identifier: GPL-3.0-only
/**
 * Renders a run of prose with any standards citation inside it linked to the
 * document in this app's own library.
 *
 * Use this where the citation is part of a sentence. Where a component already
 * holds the citation as its own value, use `StandardRef` instead — it is the
 * same resolution with less machinery.
 *
 * Citations that do not resolve render as ordinary text, so this is safe to
 * apply to arbitrary prose: worst case, nothing changes.
 */
import { Link, useInRouterContext } from 'react-router'
import { splitCitations } from '@/utils/citedText'

export interface CitedTextProps {
  /** Prose that may contain citations, e.g. "Sanitize per NIST SP 800-88". */
  children: string
  /** Class applied to the links only, not the surrounding text. */
  linkClassName?: string
}

export function CitedText({ children, linkClassName }: CitedTextProps) {
  // `Link` throws outside a router, and this component is meant to be dropped
  // into arbitrary prose — including shared components that some callers mount
  // without one. Degrade to plain text rather than take the page down for a
  // convenience link. (Caught by 6 ArtifactBuilder tests on first wiring.)
  const inRouter = useInRouterContext()
  const segments = splitCitations(children)
  if (!inRouter || segments.every((s) => s.href === null)) return <>{children}</>

  return (
    <>
      {segments.map((seg, i) =>
        seg.href ? (
          <Link
            key={i}
            to={seg.href}
            className={linkClassName ?? 'text-primary hover:underline'}
            title={`Open ${seg.text} in the library`}
            // The label this often sits inside is itself a click target (it
            // toggles a checkbox); without this, following the link would also
            // tick the box the user was only trying to read about.
            onClick={(e) => e.stopPropagation()}
          >
            {seg.text}
          </Link>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </>
  )
}
