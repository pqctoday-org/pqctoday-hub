// SPDX-License-Identifier: GPL-3.0-only

import React, { useState } from 'react'
import { Network, BarChart3, Map, Loader2 } from 'lucide-react'
import { useGraphData } from '../PKILearning/modules/KnowledgeGraph/hooks/useGraphData'
import { useGraphSearch } from '../PKILearning/modules/KnowledgeGraph/hooks/useGraphSearch'
import { Button } from '@/components/ui/button'

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

const MindmapView = React.lazy(() =>
  import('./MindmapView').then((m) => ({
    default: m.MindmapView,
  }))
)

type GraphSubTab = 'explore' | 'coverage' | 'mindmap'

const SUB_TABS: { id: GraphSubTab; label: string; icon: React.ElementType }[] = [
  { id: 'explore', label: 'Explore', icon: Network },
  { id: 'coverage', label: 'Coverage', icon: BarChart3 },
  { id: 'mindmap', label: 'Mindmap', icon: Map },
]

const LoadingSpinner: React.FC = () => (
  <div className="flex-1 flex items-center justify-center">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
)

/** Content for graph-dependent tabs (Explore, Coverage) */
function GraphContent({
  subTab,
  graph,
  query,
  setQuery,
  results,
}: {
  subTab: GraphSubTab
  graph: ReturnType<typeof useGraphData>['graph']
  query: string
  setQuery: (q: string) => void
  results: ReturnType<typeof useGraphSearch>['results']
}) {
  if (!graph) return null
  return (
    <>
      {subTab === 'explore' && (
        <ExploreView
          graph={graph}
          searchQuery={query}
          onSearchQueryChange={setQuery}
          searchResults={results}
        />
      )}
      {subTab === 'coverage' && <CoverageView graph={graph} />}
    </>
  )
}

export const GraphPanel: React.FC = () => {
  const [subTab, setSubTab] = useState<GraphSubTab>('explore')
  const { graph, searchIndex, loading, error } = useGraphData()
  const { query, setQuery, results } = useGraphSearch(searchIndex)

  const needsGraph = subTab !== 'mindmap'

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Sub-tab bar */}
      <div className="px-4 md:px-12 border-b border-border shrink-0">
        <div className="flex items-center gap-1 max-w-4xl mx-auto" role="tablist">
          {SUB_TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <Button
                variant="ghost"
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
                <span className="hidden sm:inline">{tab.label}</span>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Sub-tab content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-12 py-4">
        <div className="max-w-4xl mx-auto">
          <React.Suspense fallback={<LoadingSpinner />}>
            {subTab === 'mindmap' && <MindmapView />}
            {needsGraph && loading && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Building knowledge graph…</p>
              </div>
            )}
            {needsGraph && (error || (!loading && !graph)) && (
              <div className="flex-1 flex items-center justify-center px-6 py-12">
                <p className="text-sm text-status-error text-center">
                  Failed to load knowledge graph. Please reload the panel.
                </p>
              </div>
            )}
            {needsGraph && !loading && !error && (
              <GraphContent
                subTab={subTab}
                graph={graph}
                query={query}
                setQuery={setQuery}
                results={results}
              />
            )}
          </React.Suspense>
        </div>
      </div>
    </div>
  )
}
