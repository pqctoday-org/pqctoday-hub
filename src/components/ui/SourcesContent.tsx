// SPDX-License-Identifier: AGPL-3.0-only
import { useMemo } from 'react'
import { ExternalLink } from 'lucide-react'
import {
  getSourcesForView,
  type ViewType,
  type AuthoritativeSource,
} from '../../data/authoritativeSourcesData'
import { CategoryBadge } from './category-badge'

const regionToBadgeCategory: Record<
  AuthoritativeSource['region'],
  'americas' | 'emea' | 'apac' | 'global'
> = {
  Americas: 'americas',
  EMEA: 'emea',
  APAC: 'apac',
  Global: 'global',
}

/**
 * The authoritative sources a page lists, grouped by type, with the data file the page is built from.
 * One component for the drawer's Sources view and for the modal (embedded mode), so there is one copy.
 */
export const SourcesContent = ({
  viewType,
  dataSource,
}: {
  viewType: ViewType
  /** The page's own underlying CSV filename and last-updated date, when known. */
  dataSource?: string
}) => {
  const sources = useMemo(() => getSourcesForView(viewType), [viewType])

  // Group sources by type
  const groupedSources = useMemo(() => {
    const groups: Record<string, AuthoritativeSource[]> = {
      Government: [],
      Academic: [],
      'Industry Workgroup': [],
    }
    sources.forEach((source) => {
      if (!groups[source.sourceType]) groups[source.sourceType] = []
      groups[source.sourceType].push(source)
    })
    return groups
  }, [sources])

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">Sources referenced for {viewType} data</p>
        {dataSource && (
          <p className="text-xs text-muted-foreground mt-1 font-mono break-all">{dataSource}</p>
        )}
      </div>

      {/* Sources grouped by type */}
      <div className="space-y-6">
        {Object.entries(groupedSources).map(([type, typeSources]) => {
          if (typeSources.length === 0) return null

          return (
            <div key={type}>
              <h3 className="text-lg font-semibold mb-3 text-primary">{type}</h3>
              <div className="grid gap-3">
                {typeSources.map((source, idx) => (
                  <div
                    key={idx}
                    className="glass-panel p-4 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <a
                          href={source.primaryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-foreground hover:text-primary font-medium inline-flex items-center gap-2 group max-md:min-h-[44px]"
                        >
                          {source.sourceName}
                          <span className="sr-only"> (opens in new tab)</span>
                          <ExternalLink
                            size={14}
                            aria-hidden="true"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                        </a>
                        <p className="text-sm text-muted-foreground mt-1">{source.description}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <CategoryBadge
                          category={regionToBadgeCategory[source.region]}
                          label={source.region}
                        />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          Verified: {source.lastVerifiedDate}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-border text-center">
        <p className="text-xs text-muted-foreground">Total sources: {sources.length}</p>
      </div>
    </div>
  )
}
