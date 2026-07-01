// SPDX-License-Identifier: GPL-3.0-only
import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Wrench } from 'lucide-react'
import { PageHeader } from '../common/PageHeader'
import { Input } from '../ui/input'
import { EmptyState } from '../ui/empty-state'
import {
  BUSINESS_TOOLS,
  BUSINESS_CATEGORIES,
  type BusinessToolAudience,
} from './businessToolsRegistry'
import { Button } from '@/components/ui/button'
import { logBusinessToolsSearch, logBusinessToolsFilter } from '@/utils/analytics'

// Badge shown only for the non-default (technical) audiences, so an executive can
// tell at a glance which tools are meant for architects/developers. Business/GRC
// tools — the vast majority — carry no badge (they are the expected default).
const AUDIENCE_BADGE: Record<Exclude<BusinessToolAudience, 'business'>, string> = {
  architect: 'For architects',
  developer: 'For developers',
}

// A recommended starting sequence for an executive, so the toolbox reads as a
// path rather than an unordered A-Z list. Each id resolves to a real tool.
const START_HERE: { step: number; label: string; id: string }[] = [
  { step: 1, label: 'Business case', id: 'roi-calculator' },
  { step: 2, label: 'Risk', id: 'risk-register' },
  { step: 3, label: 'Governance', id: 'raci-builder' },
  { step: 4, label: 'Roadmap', id: 'roadmap-builder' },
  { step: 5, label: 'Verify', id: 'migration-verification' },
]

export const BusinessToolsGrid = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  useEffect(() => {
    if (!searchQuery.trim()) return
    const t = window.setTimeout(() => logBusinessToolsSearch(searchQuery), 600)
    return () => window.clearTimeout(t)
  }, [searchQuery])

  const filteredTools = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return BUSINESS_TOOLS.filter((t) => {
      const matchesCategory = !activeCategory || t.category === activeCategory
      const matchesSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.keywords.some((k) => k.includes(q)) ||
        t.category.toLowerCase().includes(q)
      return matchesCategory && matchesSearch
    })
  }, [searchQuery, activeCategory])

  const groupedTools: Record<string, typeof filteredTools> = {}
  for (const cat of BUSINESS_CATEGORIES) {
    const tools = filteredTools.filter((t) => t.category === cat)
    if (tools.length > 0) groupedTools[cat] = tools
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <PageHeader
        icon={Wrench}
        pageId="business-center"
        title="Business Tools"
        description="Interactive planning and governance tools for PQC migration — ROI calculators, RACI builders, vendor scorecards, and more."
        shareTitle="PQC Business Tools — Planning & Governance Toolkit"
        shareText={`${BUSINESS_TOOLS.length} interactive business planning tools for PQC migration readiness.`}
      />

      {/* Search + filter */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tools or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              aria-label="Search business tools"
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Category filter pills */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              if (activeCategory !== null) logBusinessToolsFilter(null)
              setActiveCategory(null)
            }}
            aria-pressed={activeCategory === null}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              activeCategory === null
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'text-muted-foreground border-border hover:text-foreground hover:border-border/60'
            }`}
          >
            All
            <span
              className={`text-[10px] px-1 rounded ${activeCategory === null ? 'text-primary' : 'text-muted-foreground'}`}
            >
              {BUSINESS_TOOLS.length}
            </span>
          </Button>
          {BUSINESS_CATEGORIES.map((cat) => {
            const count = BUSINESS_TOOLS.filter((t) => t.category === cat).length
            const isActive = activeCategory === cat
            return (
              <Button
                variant="ghost"
                key={cat}
                onClick={() => {
                  const next = isActive ? null : cat
                  logBusinessToolsFilter(next)
                  setActiveCategory(next)
                }}
                aria-pressed={isActive}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : 'text-muted-foreground border-border hover:text-foreground hover:border-border/60'
                }`}
              >
                {cat}
                <span
                  className={`text-[10px] px-1 rounded ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  {count}
                </span>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Start-here sequence — only on the unfiltered view, so it reads as a
          suggested path without fighting an active search/category. */}
      {!searchQuery.trim() && !activeCategory && (
        <div className="glass-panel p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            New here? Start with the essentials
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {START_HERE.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <Link
                  to={`/business/tools/${s.id}`}
                  className="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-sm text-foreground hover:border-primary/40 hover:text-primary transition-colors"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                    {s.step}
                  </span>
                  {s.label}
                </Link>
                {i < START_HERE.length - 1 && (
                  <span className="text-muted-foreground" aria-hidden="true">
                    →
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {Object.keys(groupedTools).length === 0 && (
        <EmptyState
          icon={<Search className="w-6 h-6" />}
          title={`No tools match \u201c${searchQuery}\u201d`}
        />
      )}

      {/* Tool grid by category */}
      {BUSINESS_CATEGORIES.map((category) => {
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
                  <Link
                    key={tool.id}
                    to={`/business/tools/${tool.id}`}
                    className="glass-panel p-4 h-auto text-left hover:border-primary/40 transition-colors cursor-pointer group items-start justify-start flex"
                  >
                    <div className="flex items-start gap-3 w-full">
                      <Icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {tool.name}
                          </p>
                          {tool.audience && tool.audience !== 'business' && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-secondary/10 text-secondary shrink-0">
                              {}
                              {AUDIENCE_BADGE[tool.audience]}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {tool.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
