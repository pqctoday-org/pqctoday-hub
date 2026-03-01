// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useCallback, useMemo } from 'react'
import { Plus, X, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExportableArtifact } from './ExportableArtifact'

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

    if (deadlines.length > 0) {
      md += '## External Deadlines\n\n'
      md += '| Year | Deadline | Source |\n'
      md += '|------|----------|--------|\n'
      for (const d of deadlines) {
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
  }, [title, milestones, deadlines])

  return (
    <div className="space-y-6">
      {title && <h3 className="text-lg font-semibold text-foreground">{title}</h3>}

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

          {/* External deadlines row */}
          {deadlines.length > 0 && (
            <div className="relative h-10 mb-3">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 text-xs text-muted-foreground w-20 truncate">
                Deadlines
              </div>
              <div className="ml-20 relative h-full">
                {deadlines.map((d, i) => {
                  const pos = ((d.year - yearRange[0]) / (yearRange[1] - yearRange[0])) * 100
                  return (
                    <div
                      key={`${d.label}-${i}`}
                      className="absolute top-0 flex flex-col items-center"
                      style={{ left: `${Math.min(95, Math.max(0, pos))}%` }}
                      title={`${d.label} (${d.source})`}
                    >
                      <div className="w-0.5 h-10 bg-status-error/60" />
                      <span className="text-[10px] text-status-error font-medium whitespace-nowrap mt-0.5 max-w-[80px] truncate">
                        {d.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* User milestones row */}
          <div className="relative h-10 mb-2">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 text-xs text-muted-foreground w-20 truncate">
              Plan
            </div>
            <div className="ml-20 relative h-full bg-muted/30 rounded">
              {milestones.map((m) => {
                const pos = ((m.year - yearRange[0]) / (yearRange[1] - yearRange[0])) * 100
                return (
                  <div
                    key={m.id}
                    className="absolute top-0 flex flex-col items-center group"
                    style={{ left: `${Math.min(95, Math.max(0, pos))}%` }}
                    title={`${m.label} — ${m.category || ''}`}
                  >
                    <div className="w-3 h-3 rounded-full bg-primary border-2 border-background shadow-sm cursor-grab">
                      <GripVertical size={8} className="hidden" />
                    </div>
                    <span className="text-[10px] text-primary font-medium whitespace-nowrap mt-0.5 max-w-[80px] truncate">
                      {m.label}
                    </span>
                  </div>
                )
              })}
            </div>
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
            <label
              htmlFor="timeline-year"
              className="block text-xs font-medium text-muted-foreground mb-1"
            >
              Year
            </label>
            <select
              id="timeline-year"
              className="w-full px-2 py-2 rounded-lg border border-input bg-background text-foreground text-sm"
              value={newYear}
              onChange={(e) => setNewYear(parseInt(e.target.value))}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="w-32">
            <label
              htmlFor="timeline-phase"
              className="block text-xs font-medium text-muted-foreground mb-1"
            >
              Phase
            </label>
            <select
              id="timeline-phase"
              className="w-full px-2 py-2 rounded-lg border border-input bg-background text-foreground text-sm"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
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
