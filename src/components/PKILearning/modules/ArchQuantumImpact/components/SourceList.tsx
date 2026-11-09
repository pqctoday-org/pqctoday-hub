// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Link } from 'react-router'
import { sourceLabel } from '../data/sourceLabel'

/** Library links for a list of source ids, shown by document title; the id stays in the link target. */
export const SourceList: React.FC<{ ids: string[]; label?: string }> = ({
  ids,
  label = 'Sources',
}) => {
  if (ids.length === 0) return null
  return (
    <p className="text-[11px] text-muted-foreground leading-snug">
      {label}:{' '}
      {ids.map((id, i) => {
        const { short, full } = sourceLabel(id)
        return (
          <React.Fragment key={id}>
            {i > 0 && '; '}
            <Link
              to={`/library?ref=${encodeURIComponent(id)}`}
              className="text-primary hover:underline"
              title={`${full} (${id})`}
            >
              {short}
            </Link>
          </React.Fragment>
        )
      })}
    </p>
  )
}
