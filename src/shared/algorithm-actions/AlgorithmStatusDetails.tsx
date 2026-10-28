// SPDX-License-Identifier: AGPL-3.0-only
import { getAlgorithmStatusAssertions } from '@/data/algorithmStatusAssertions'

export function AlgorithmStatusDetails({ name }: { name: string }) {
  const assertions = getAlgorithmStatusAssertions(name)
  if (!assertions.length) return null
  return (
    <details className="text-[10px] font-normal normal-case text-muted-foreground">
      <summary className="cursor-pointer">Status context</summary>
      <ul className="space-y-2 p-2 max-w-md">
        {assertions.map((a) => (
          <li key={`${a.authority}:${a.kind}`}>
            <strong>
              {a.authority}: {a.value}
            </strong>
            <p>{a.document}</p>
            <p>{a.conditions}</p>
            {a.documentDate && (
              <p>
                Document: {a.documentDate}; published: {a.publishedAt ?? 'not established'}.
              </p>
            )}
            {a.evidenceState === 'needs-review' && (
              <p>Exact national/parameter scope needs further source review.</p>
            )}
            <a className="underline" href={a.sourceUrl} target="_blank" rel="noopener noreferrer">
              Source
            </a>
          </li>
        ))}
      </ul>
    </details>
  )
}
