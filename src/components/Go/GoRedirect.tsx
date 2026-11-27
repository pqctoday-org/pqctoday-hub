// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { NotFoundView } from '@/components/NotFound/NotFoundView'
import { loadKnowledgeReader, type Lookup } from '@/services/knowledge/knowledgeReader'

type Result = { raw: string; failed: true } | { raw: string; failed: false; lookup: Lookup }

/**
 * `/go/<tag>`: the short address of any resource (decision D20). It opens the page the tag stands for, through the
 * knowledge core: a tag, a former id or a name, to the record's own link. A name that fits several records lists them
 * instead of guessing; a tag the model does not have shows the not-found page.
 */
export function GoRedirect() {
  const raw = useParams()['*'] ?? ''
  const [result, setResult] = useState<Result | null>(null)

  useEffect(() => {
    let cancelled = false
    loadKnowledgeReader()
      .then((reader) => !cancelled && setResult({ raw, failed: false, lookup: reader.lookup(raw) }))
      .catch(() => !cancelled && setResult({ raw, failed: true }))
    return () => {
      cancelled = true
    }
  }, [raw])

  // the answer belongs to one address; until the one for this address arrives the page says it is opening
  if (!result || result.raw !== raw) {
    return (
      <p role="status" className="px-4 py-12 text-center text-muted-foreground">
        Opening…
      </p>
    )
  }
  if (result.failed) {
    return (
      <p role="alert" className="px-4 py-12 text-center text-muted-foreground">
        The link could not be opened just now. Try again, or search from the home page.
      </p>
    )
  }
  const { lookup } = result
  if (lookup.found) return <Navigate to={lookup.record.link} replace />
  if (lookup.reason === 'ambiguous') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12" data-testid="go-ambiguous">
        <h1 className="page-title mb-4">Which one do you mean?</h1>
        <ul className="space-y-2">
          {lookup.candidates.map((r) => (
            <li key={r.id}>
              <Link to={r.link} className="text-primary hover:underline">
                {r.label}
              </Link>{' '}
              <span className="text-xs text-muted-foreground">({r.kind})</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }
  return <NotFoundView />
}
