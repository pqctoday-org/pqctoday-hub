// SPDX-License-Identifier: AGPL-3.0-only
import { Link } from 'react-router'
import { findStandard } from '@/data/standardsRegistry'
import { claimsFor } from '../data/cloudKmsExchangeData'

interface FactsProps {
  claimIds: readonly string[]
  heading: string
  /** Plain-text caveat shown under the statements. */
  note?: string
}

/**
 * Provider statements with their Library source. Each sentence is the claim
 * registered for that reference; the source line links to the Library row when
 * the row is present in the loaded Library data.
 */
export function CloudKmsFacts({ claimIds, heading, note }: FactsProps) {
  const claims = claimsFor(claimIds)
  return (
    <section aria-label={heading} className="glass-panel space-y-3 p-4">
      <h4 className="text-sm font-semibold">{heading}</h4>
      <ul className="space-y-3">
        {claims.map((c) => {
          const std = findStandard(c.id)
          return (
            <li key={c.id} className="text-sm">
              <p>{c.sentence}</p>
              <p className="mt-0.5 break-words text-xs text-muted-foreground">
                Source:{' '}
                {std ? (
                  <Link to={std.deepLink} className="text-primary underline underline-offset-2">
                    {std.title}
                  </Link>
                ) : (
                  <span className="font-mono">{c.id}</span>
                )}
              </p>
            </li>
          )
        })}
      </ul>
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
    </section>
  )
}
