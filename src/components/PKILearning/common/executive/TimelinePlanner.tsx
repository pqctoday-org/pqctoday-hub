// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useCallback, useMemo } from 'react'
import { Plus, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExportableArtifact } from './ExportableArtifact'
import { FilterDropdown } from '@/components/common/FilterDropdown'

export interface Milestone {
  id: string
  label: string
  year: number
  quarter?: 1 | 2 | 3 | 4
  category?: string
  color?: string
}

export interface ExternalDeadline {
  label: string
  year: number
  source: string
  color?: string
}

interface TimelinePlannerProps {
  title?: string
  initialMilestones?: Milestone[]
  deadlines?: ExternalDeadline[]
  yearRange?: [number, number]
  categories?: string[]
  onMilestonesChange?: (milestones: Milestone[]) => void
}

export const TimelinePlanner: React.FC<TimelinePlannerProps> = ({
  title = 'Migration Timeline',
  initialMilestones = [],
  deadlines = [],
  yearRange = [2025, 2036],
  categories = ['Discovery', 'Planning', 'Migration', 'Validation', 'Completion'],
  onMilestonesChange,
}) => {
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones)
  const [newLabel, setNewLabel] = useState('')
  const [newYear, setNewYear] = useState(yearRange[0])
  const [newCategory, setNewCategory] = useState(categories[0])

  // Deadline selection state — empty by default (user opts in)
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set())
  const [pickerOpen, setPickerOpen] = useState(deadlines.length > 0)

  const deadlineKey = useCallback((d: ExternalDeadline) => `${d.label}-${d.year}`, [])

  const visibleDeadlines = useMemo(
    () => deadlines.filter((d) => selectedKeys.has(deadlineKey(d))),
    [deadlines, selectedKeys, deadlineKey]
  )

  const deadlinesBySource = useMemo(() => {
    const map = new Map<string, ExternalDeadline[]>()
    for (const d of deadlines) {
      const existing = map.get(d.source) ?? []
      existing.push(d)
      map.set(d.source, existing)
    }
    return map
  }, [deadlines])

  const toggleDeadline = useCallback((key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const selectAllDeadlines = useCallback(() => {
    setSelectedKeys(new Set(deadlines.map(deadlineKey)))
  }, [deadlines, deadlineKey])

  const clearAllDeadlines = useCallback(() => {
    setSelectedKeys(new Set())
  }, [])

  const years = useMemo(() => {
    const arr: number[] = []
    for (let y = yearRange[0]; y <= yearRange[1]; y++) arr.push(y)
    return arr
  }, [yearRange])

  const addMilestone = useCallback(() => {
    if (!newLabel.trim()) return
    const ms: Milestone = {
      id: `ms-${Date.now()}`,
      label: newLabel.trim(),
      year: newYear,
      category: newCategory,
    }
    const updated = [...milestones, ms].sort((a, b) => a.year - b.year)
    setMilestones(updated)
    onMilestonesChange?.(updated)
    setNewLabel('')
  }, [newLabel, newYear, newCategory, milestones, onMilestonesChange])

  const removeMilestone = useCallback(
    (id: string) => {
      const updated = milestones.filter((m) => m.id !== id)
      setMilestones(updated)
      onMilestonesChange?.(updated)
    },
    [milestones, onMilestonesChange]
  )

  const exportMarkdown = useMemo(() => {
    let md = `# ${title}\n\n`
    md += `Generated: ${new Date().toLocaleDateString()}\n\n`

    if (visibleDeadlines.length > 0) {
      md += '## External Deadlines\n\n'
      md += '| Year | Deadline | Source |\n'
      md += '|------|----------|--------|\n'
      for (const d of visibleDeadlines) {
        md += `| ${d.year} | ${d.label} | ${d.source} |\n`
      }
      md += '\n'
    }

    md += '## Your Milestones\n\n'
    md += '| Year | Milestone | Phase |\n'
    md += '|------|-----------|-------|\n'
    for (const m of milestones) {
      md += `| ${m.year}${m.quarter ? ` Q${m.quarter}` : ''} | ${m.label} | ${m.category || ''} |\n`
    }
    return md
  }, [title, milestones, visibleDeadlines])

  return (
    <div className="space-y-6">
      {title && <h3 className="text-lg font-semibold text-foreground">{title}</h3>}

      {/* Deadline picker */}
      {deadlines.length > 0 && (
        <div className="glass-panel p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">Regulatory Deadlines</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {selectedKeys.size} / {deadlines.length} selected
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={selectAllDeadlines}>
                All
              </Button>
              <Button variant="ghost" size="sm" onClick={clearAllDeadlines}>
                None
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPickerOpen((p) => !p)}
                aria-expanded={pickerOpen}
                aria-controls="deadline-picker"
              >
                <ChevronDown
                  size={14}
                  className={`transition-transform ${pickerOpen ? 'rotate-180' : ''}`}
                />
              </Button>
            </div>
          </div>
          {pickerOpen && (
            <div id="deadline-picker" className="mt-3 max-h-56 overflow-y-auto space-y-3 pr-1">
              {Array.from(deadlinesBySource.entries()).map(([source, items]) => (
                <div key={source}>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    {source}
                  </div>
                  <div className="space-y-0.5">
                    {items.map((d) => {
                      const key = deadlineKey(d)
                      return (
                        <label
                          key={key}
                          className="flex items-center gap-2 cursor-pointer hover:bg-muted/30 rounded px-1 py-0.5"
                        >
                          <input
                            type="checkbox"
                            checked={selectedKeys.has(key)}
                            onChange={() => toggleDeadline(key)}
                            className="accent-primary"
                            aria-label={`${d.label} (${d.year})`}
                          />
                          <span className="text-xs font-mono text-primary shrink-0">{d.year}</span>
                          <span className="text-xs text-foreground truncate">{d.label}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Timeline visualization */}
      <div className="glass-panel p-6 overflow-x-auto">
        <div className="relative min-w-[600px]">
          {/* Year axis */}
          <div className="flex items-end border-b-2 border-border pb-2 mb-4">
            {years.map((year) => (
              <div
                key={year}
                className="flex-1 text-center text-xs font-medium text-muted-foreground"
              >
                {year}
              </div>
            ))}
          </div>

          {/* External deadlines — one row per deadline */}
          {visibleDeadlines.length > 0 && (
            <div className="mb-3 space-y-0.5">
              {visibleDeadlines.map((d, i) => {
                const pos = ((d.year - yearRange[0]) / (yearRange[1] - yearRange[0])) * 100
                return (
                  <div
                    key={`${d.label}-${i}`}
                    className="flex items-center"
                    style={{ height: '24px' }}
                  >
                    <div className="w-20 shrink-0 text-xs text-muted-foreground truncate">
                      {i === 0 ? 'Deadlines' : ''}
                    </div>
                    <div className="flex-1 relative h-full">
                      <div
                        className="absolute top-1/2 -translate-y-1/2 flex items-center gap-1"
                        style={{ left: `${Math.min(95, Math.max(0, pos))}%` }}
                        title={`${d.label} (${d.source})`}
                      >
                        <div className="w-1.5 h-4 bg-status-error/60 rounded-sm shrink-0" />
                        <span className="text-[10px] text-status-error font-medium whitespace-nowrap">
                          {d.label}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* User milestones — one row per milestone */}
          <div className="mb-2 space-y-0.5">
            {milestones.map((m, i) => {
              const pos = ((m.year - yearRange[0]) / (yearRange[1] - yearRange[0])) * 100
              return (
                <div key={m.id} className="flex items-center" style={{ height: '24px' }}>
                  <div className="w-20 shrink-0 text-xs text-muted-foreground truncate">
                    {i === 0 ? 'Plan' : ''}
                  </div>
                  <div className="flex-1 relative h-full bg-muted/30 rounded">
                    <div
                      className="absolute top-1/2 -translate-y-1/2 flex items-center gap-1"
                      style={{ left: `${Math.min(95, Math.max(0, pos))}%` }}
                      title={`${m.label} — ${m.category || ''}`}
                    >
                      <div className="w-3 h-3 rounded-full bg-primary border-2 border-background shadow-sm shrink-0" />
                      <span className="text-[10px] text-primary font-medium whitespace-nowrap">
                        {m.label}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Add milestone form */}
      <div className="glass-panel p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            <label
              htmlFor="timeline-milestone"
              className="block text-xs font-medium text-muted-foreground mb-1"
            >
              Milestone
            </label>
            <input
              id="timeline-milestone"
              type="text"
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              placeholder="e.g., Complete crypto inventory"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addMilestone()}
            />
          </div>
          <div className="w-24">
            <span className="block text-xs font-medium text-muted-foreground mb-1">Year</span>
            <FilterDropdown
              noContainer
              selectedId={String(newYear)}
              onSelect={(id) => setNewYear(parseInt(id))}
              items={years.map((y) => ({ id: String(y), label: String(y) }))}
            />
          </div>
          <div className="w-32">
            <span className="block text-xs font-medium text-muted-foreground mb-1">Phase</span>
            <FilterDropdown
              noContainer
              selectedId={newCategory}
              onSelect={(id) => setNewCategory(id)}
              items={categories.map((c) => ({ id: c, label: c }))}
            />
          </div>
          <Button variant="gradient" size="sm" onClick={addMilestone} disabled={!newLabel.trim()}>
            <Plus size={14} />
            <span className="ml-1">Add</span>
          </Button>
        </div>
      </div>

      {/* Milestone list */}
      {milestones.length > 0 && (
        <div className="space-y-2">
          {milestones.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-4 py-2 glass-panel">
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-primary">{m.year}</span>
                <span className="text-sm text-foreground">{m.label}</span>
                {m.category && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {m.category}
                  </span>
                )}
              </div>
              <button
                onClick={() => removeMilestone(m.id)}
                className="text-muted-foreground hover:text-status-error transition-colors"
                aria-label={`Remove ${m.label}`}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Export */}
      <ExportableArtifact
        title="Timeline Export"
        exportData={exportMarkdown}
        filename="migration-timeline"
        formats={['markdown', 'csv']}
      >
        <p className="text-sm text-muted-foreground">
          Export your timeline milestones and external deadlines.
        </p>
      </ExportableArtifact>
    </div>
  )
}
