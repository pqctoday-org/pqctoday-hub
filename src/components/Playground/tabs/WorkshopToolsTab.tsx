// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { DROPPED_TOOL_IDS } from '@/components/Mobile/screens/MobilePlaygroundView'
import { expandSearchQuery } from '../cryptoLabTaxonomy'
import { CATEGORIES, WORKSHOP_TOOLS, type WorkshopTool } from '../workshopRegistry'

// ---------------------------------------------------------------------------
// Tool list — derived live from the real desktop registry (workshopRegistry.tsx),
// not a hand-copied duplicate. Sandbox/Docker-gated scenarios are excluded since
// they require a local sandbox server, not a fit for a mobile touch picker, and
// so are the tools the phone catalog drops (DROPPED_TOOL_IDS), so both phone
// pickers offer the same set.
// (2026-08-02: replaces a stale hand-copied 21-tool array that had drifted from
// the real 64-tool registry — dead ids, missing tools added since. See
// design_handoff_2026_pages/IMPLEMENTATION-PLAN-PLAYGROUND-2026-08-01.md §3.2.)
// ---------------------------------------------------------------------------

const MOBILE_TOOLS: WorkshopTool[] = WORKSHOP_TOOLS.filter(
  (t) => !t.sandbox && !DROPPED_TOOL_IDS.has(t.id)
)

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Picker for the phone Interactive Playground's "Crypto Lab" swipe tab.
 *
 * Choosing a tool opens its own page (/playground/<id>). It used to mount the
 * tool inline here, inside the horizontal swipe carousel, where a sideways drag
 * on a slider or a scrolling table inside the tool could swipe the visitor to
 * the neighbouring tab instead.
 */
export const WorkshopToolsTab: React.FC = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return MOBILE_TOOLS
    const queries = expandSearchQuery(searchQuery)
    const hit = (hay: string) => queries.some((term) => hay.includes(term))
    return MOBILE_TOOLS.filter(
      (t) =>
        hit(t.name.toLowerCase()) ||
        hit(t.description.toLowerCase()) ||
        t.algorithms.some((a) => hit(a.toLowerCase())) ||
        t.keywords.some((k) => hit(k.toLowerCase())) ||
        hit(t.category.toLowerCase())
    )
  }, [searchQuery])

  const groupedTools = useMemo(() => {
    const groups: Record<string, WorkshopTool[]> = {}
    for (const cat of CATEGORIES) {
      const tools = filteredTools.filter((t) => t.category === cat)
      if (tools.length > 0) groups[cat] = tools
    }
    return groups
  }, [filteredTools])

  // Render tool selector grid
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tools, algorithms, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''}
        </span>
      </div>

      {Object.keys(groupedTools).length === 0 && (
        <EmptyState
          icon={<Search className="w-6 h-6" />}
          title={`No tools match \u201c${searchQuery}\u201d`}
        />
      )}

      {CATEGORIES.map((category) => {
        const tools = groupedTools[category]
        if (!tools) return null
        return (
          <div key={category}>
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {category}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {tools.map((tool) => {
                const Icon = tool.icon
                return (
                  <Button
                    key={tool.id}
                    variant="ghost"
                    onClick={() => navigate(`/playground/${tool.id}`)}
                    className="glass-panel p-4 h-auto text-left hover:border-primary/40 transition-colors cursor-pointer group items-start justify-start"
                  >
                    <div className="flex items-start gap-3 w-full">
                      <Icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {tool.name}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2 whitespace-normal font-normal">
                          {tool.description}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {tool.algorithms.map((algo) => (
                            <span
                              key={algo}
                              className="inline-block text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-normal"
                            >
                              {algo}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
