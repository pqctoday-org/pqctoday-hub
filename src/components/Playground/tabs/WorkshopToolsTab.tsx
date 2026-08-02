// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo, useEffect, Suspense, useCallback } from 'react'
import { ArrowLeft, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { useAchievementStore } from '@/store/useAchievementStore'
import { WorkshopNavigationContext } from '../contexts/WorkshopNavigationContext'
import {
  CATEGORIES,
  WORKSHOP_TOOLS,
  TOOL_COMPONENTS,
  ONBACK_COMPONENTS,
  type WorkshopTool,
} from '../workshopRegistry'

// ---------------------------------------------------------------------------
// Tool list — derived live from the real desktop registry (workshopRegistry.tsx),
// not a hand-copied duplicate. Sandbox/Docker-gated scenarios are excluded since
// they require a local sandbox server, not a fit for a mobile touch picker.
// (2026-08-02: replaces a stale hand-copied 21-tool array that had drifted from
// the real 64-tool registry — dead ids, missing tools added since. See
// design_handoff_2026_pages/IMPLEMENTATION-PLAN-PLAYGROUND-2026-08-01.md §3.2.)
// ---------------------------------------------------------------------------

const MOBILE_TOOLS: WorkshopTool[] = WORKSHOP_TOOLS.filter((t) => !t.sandbox)

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const WorkshopToolsTab: React.FC = () => {
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (selectedToolId) useAchievementStore.getState().recordPlaygroundToolUsage(selectedToolId)
  }, [selectedToolId])

  const handleBack = useCallback(() => setSelectedToolId(null), [])

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return MOBILE_TOOLS
    const q = searchQuery.toLowerCase()
    return MOBILE_TOOLS.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.algorithms.some((a) => a.toLowerCase().includes(q)) ||
        t.keywords.some((k) => k.includes(q)) ||
        t.category.toLowerCase().includes(q)
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

  const selectedTool = selectedToolId ? MOBILE_TOOLS.find((t) => t.id === selectedToolId) : null

  // Render the selected tool
  if (selectedTool) {
    const isOnBack = selectedTool.id in ONBACK_COMPONENTS
    const Comp = isOnBack ? ONBACK_COMPONENTS[selectedTool.id] : TOOL_COMPONENTS[selectedTool.id]

    return (
      <WorkshopNavigationContext.Provider value={{ selectTool: setSelectedToolId }}>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              All Tools
            </Button>
            <span className="text-sm text-muted-foreground">
              {selectedTool.category} / {selectedTool.name}
            </span>
          </div>
          <Suspense
            fallback={
              <div className="space-y-4 p-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            }
          >
            {Comp && (isOnBack ? <Comp onBack={handleBack} /> : <Comp />)}
          </Suspense>
        </div>
      </WorkshopNavigationContext.Provider>
    )
  }

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
                    onClick={() => setSelectedToolId(tool.id)}
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
