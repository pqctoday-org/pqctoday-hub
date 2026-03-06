// SPDX-License-Identifier: GPL-3.0-only

import React, { useState } from 'react'
import { Network, BarChart3, GitBranch, Loader2 } from 'lucide-react'
import { useGraphData } from '../PKILearning/modules/KnowledgeGraph/hooks/useGraphData'
import { useGraphSearch } from '../PKILearning/modules/KnowledgeGraph/hooks/useGraphSearch'

const ExploreView = React.lazy(() =>
  import('../PKILearning/modules/KnowledgeGraph/components/ExploreView').then((m) => ({
    default: m.ExploreView,
  }))
)

const CoverageView = React.lazy(() =>
  import('../PKILearning/modules/KnowledgeGraph/components/CoverageView').then((m) => ({
    default: m.CoverageView,
  }))
)

const PathwayView = React.lazy(() =>
  import('../PKILearning/modules/KnowledgeGraph/components/PathwayView').then((m) => ({
    default: m.PathwayView,
  }))
)

type GraphSubTab = 'explore' | 'coverage' | 'pathways'

const SUB_TABS: { id: GraphSubTab; label: string; icon: React.ElementType }[] = [
  { id: 'explore', label: 'Explore', icon: Network },
  { id: 'coverage', label: 'Coverage', icon: BarChart3 },
  { id: 'pathways', label: 'Pathways', icon: GitBranch },
]

const LoadingSpinner: React.FC = () => (
  <div className="flex-1 flex items-center justify-center">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
)

export const GraphPanel: React.FC = () => {
  const [subTab, setSubTab] = useState<GraphSubTab>('explore')
  const { graph, searchIndex, loading, error } = useGraphData()
  const { query, setQuery, results } = useGraphSearch(searchIndex)

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Building knowledge graph…</p>
      </div>
    )
  }

  if (error || !graph) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <p className="text-sm text-status-error text-center">
          Failed to load knowledge graph. Please reload the panel.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Sub-tab bar */}
      <div className="px-4 md:px-12 border-b border-border shrink-0">
        <div className="flex items-center gap-1 max-w-4xl mx-auto" role="tablist">
          {SUB_TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                  subTab === tab.id
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
                aria-selected={subTab === tab.id}
                role="tab"
              >
                <Icon size={13} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Sub-tab content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-12 py-4">
        <div className="max-w-4xl mx-auto">
          <React.Suspense fallback={<LoadingSpinner />}>
            {subTab === 'explore' && (
              <ExploreView
                graph={graph}
                searchQuery={query}
                onSearchQueryChange={setQuery}
                searchResults={results}
              />
            )}
            {subTab === 'coverage' && <CoverageView graph={graph} />}
            {subTab === 'pathways' && (
              <PathwayView graph={graph} searchQuery={query} searchResults={results} />
            )}
          </React.Suspense>
        </div>
      </div>
    </div>
  )
}
