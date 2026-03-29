// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useCallback, useMemo } from 'react'
import { Wrench, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePersonaStore } from '@/store/usePersonaStore'
import { cn } from '@/lib/utils'

export interface ChecklistItem {
  id: string
  label: string
  detail?: string
  critical?: boolean
}

export interface ChecklistSection {
  title: string
  items: ChecklistItem[]
}

interface OpsChecklistProps {
  title: string
  description: string
  sections: ChecklistSection[]
}

export const OpsChecklist: React.FC<OpsChecklistProps> = ({ title, description, sections }) => {
  const { selectedPersona } = usePersonaStore()
  const isOps = selectedPersona === 'ops'

  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(sections.map((s) => s.title))
  )
  const [copied, setCopied] = useState(false)

  const totalItems = useMemo(() => sections.reduce((sum, s) => sum + s.items.length, 0), [sections])
  const checkedCount = checkedItems.size
  const progress = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0

  const toggleItem = useCallback((id: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleSection = useCallback((sectionTitle: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionTitle)) next.delete(sectionTitle)
      else next.add(sectionTitle)
      return next
    })
  }, [])

  const handleCopyMarkdown = useCallback(async () => {
    const lines = [`# ${title}`, '', description, '']
    for (const section of sections) {
      lines.push(`## ${section.title}`, '')
      for (const item of section.items) {
        const checked = checkedItems.has(item.id) ? 'x' : ' '
        lines.push(`- [${checked}] ${item.label}`)
        if (item.detail) lines.push(`  - ${item.detail}`)
      }
      lines.push('')
    }
    await navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [title, description, sections, checkedItems])

  return (
    <div
      className={cn(
        'glass-panel p-6 space-y-4',
        isOps && 'border-l-2 border-l-primary bg-primary/5'
      )}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Wrench size={20} className="text-primary" aria-hidden="true" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              {isOps && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/30">
                  Ops Guide
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {checkedCount}/{totalItems}
          </span>
          <Button variant="outline" size="sm" onClick={handleCopyMarkdown}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span className="ml-1.5">{copied ? 'Copied' : 'Copy'}</span>
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="w-full bg-muted rounded-full h-2"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Sections */}
      {sections.map((section) => {
        const isExpanded = expandedSections.has(section.title)
        const sectionChecked = section.items.filter((i) => checkedItems.has(i.id)).length

        return (
          <div key={section.title} className="border border-border rounded-lg overflow-hidden">
            <Button
              variant="ghost"
              onClick={() => toggleSection(section.title)}
              className="w-full flex items-center justify-between p-3 h-auto rounded-none text-left"
              aria-expanded={isExpanded}
            >
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDown size={16} className="text-muted-foreground" />
                ) : (
                  <ChevronRight size={16} className="text-muted-foreground" />
                )}
                <span className="font-medium text-foreground">{section.title}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {sectionChecked}/{section.items.length}
              </span>
            </Button>

            {isExpanded && (
              <div className="border-t border-border p-3 space-y-2">
                {section.items.map((item) => (
                  <label
                    key={item.id}
                    className={cn(
                      'flex items-start gap-3 p-2 rounded-md hover:bg-muted/30 cursor-pointer transition-colors',
                      item.critical && 'border border-destructive/30 bg-destructive/5'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checkedItems.has(item.id)}
                      onChange={() => toggleItem(item.id)}
                      className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <span
                        className={cn(
                          'text-sm text-foreground',
                          checkedItems.has(item.id) && 'line-through text-muted-foreground'
                        )}
                      >
                        {item.label}
                      </span>
                      {item.detail && (
                        <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
