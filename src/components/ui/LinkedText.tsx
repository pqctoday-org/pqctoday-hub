// SPDX-License-Identifier: AGPL-3.0-only
/**
 * A sentence with in-app links written as `[words](/path?query)`, rendered with the app's
 * router `Link` and the same link look as the Learn path's "Algorithms page" note.
 * Outside a router (some tests mount shared components without one) it shows the words
 * as plain text. See `splitLinkedText` for what counts as a link.
 */
import { Fragment } from 'react'
import { Link, useInRouterContext } from 'react-router'
import { splitLinkedText } from '@/utils/linkedText'

const LINK_CLASS = 'font-medium text-primary underline underline-offset-2'

export function LinkedText({ children }: { children: string }) {
  const inRouter = useInRouterContext()
  const parts = splitLinkedText(children)
  return (
    <>
      {parts.map((part, i) =>
        part.to && inRouter ? (
          <Link key={i} to={part.to} className={LINK_CLASS}>
            {part.text}
          </Link>
        ) : (
          <Fragment key={i}>{part.text}</Fragment>
        )
      )}
    </>
  )
}
