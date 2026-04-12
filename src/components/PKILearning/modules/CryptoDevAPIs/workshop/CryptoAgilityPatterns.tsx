// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Shuffle } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { AGILITY_PATTERNS } from '../data/agilityPatternsData'
import { Button } from '@/components/ui/button'

const LANGUAGE_ITEMS = [
  { id: 'All', label: 'All Languages' },
  { id: 'Java', label: 'Java' },
  { id: 'C (OpenSSL)', label: 'C (OpenSSL)' },
  { id: 'Rust', label: 'Rust' },
  { id: 'Python', label: 'Python' },
  { id: 'Go', label: 'Go' },
]

export const CryptoAgilityPatterns: React.FC = () => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set([AGILITY_PATTERNS[0]?.id ?? ''])
  )
  const [langFilter, setLangFilter] = useState('All')

  const toggleExpand = (id: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-4 border-l-4 border-primary">
        <div className="flex items-center gap-2 mb-2">
          <Shuffle size={18} className="text-primary" />
          <h3 className="font-bold text-foreground">Crypto Agility Patterns</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Five software design patterns for building algorithm-agile systems that can swap
          cryptographic algorithms without code changes. Essential for PQC migration.
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <FilterDropdown
          label="Language"
          items={LANGUAGE_ITEMS}
          selectedId={langFilter}
          onSelect={setLangFilter}
        />
      </div>

      {/* Pattern list */}
      <div className="space-y-4">
        {AGILITY_PATTERNS.map((pattern, idx) => {
          const isExpanded = expandedIds.has(pattern.id)
          const filteredExamples = pattern.codeExamples.filter(
            (ex) => langFilter === 'All' || ex.language === langFilter
          )
          const hasExamples = langFilter === 'All' || filteredExamples.length > 0

          if (!hasExamples) return null

          return (
            <div key={pattern.id} className="glass-panel overflow-hidden">
              <Button
                variant="ghost"
                className="w-full text-left p-4"
                onClick={() => toggleExpand(pattern.id)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-foreground">{pattern.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {pattern.description.slice(0, 100)}…
                      </div>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp size={20} className="text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown size={20} className="text-muted-foreground shrink-0" />
                  )}
                </div>
              </Button>

              {isExpanded && (
                <div className="border-t border-border p-4 space-y-4">
                  <p className="text-sm text-muted-foreground">{pattern.description}</p>

                  <div>
                    <h4 className="font-semibold text-sm text-foreground mb-2">When to Use</h4>
                    <ul className="space-y-1">
                      {pattern.whenToUse.map((w, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex gap-2">
                          <span className="text-status-success shrink-0">✓</span> {w}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-foreground mb-2">Trade-offs</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {pattern.tradeoffs.map((t, i) => (
                        <div key={i} className="space-y-1">
                          <div className="text-sm flex gap-2">
                            <span className="text-status-success shrink-0">+</span>
                            <span className="text-muted-foreground">{t.pro}</span>
                          </div>
                          <div className="text-sm flex gap-2">
                            <span className="text-status-error shrink-0">−</span>
                            <span className="text-muted-foreground">{t.con}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-foreground mb-2">Code Examples</h4>
                    {(langFilter === 'All' ? pattern.codeExamples : filteredExamples).map(
                      (ex, i) => (
                        <div key={i} className="mb-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs px-2 py-0.5 rounded border border-border text-muted-foreground">
                              {ex.language}
                            </span>
                          </div>
                          <pre className="glass-panel p-3 overflow-x-auto text-sm font-mono text-foreground leading-relaxed">
                            <code>{ex.code}</code>
                          </pre>
                          {ex.notes && (
                            <p className="text-xs text-muted-foreground mt-1 italic">{ex.notes}</p>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Summary table */}
      <div className="glass-panel p-4">
        <h3 className="font-bold text-foreground mb-3">Pattern Selection Guide</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-2 text-muted-foreground">Pattern</th>
                <th className="text-left p-2 text-muted-foreground">Best For</th>
                <th className="text-left p-2 text-muted-foreground">Complexity</th>
              </tr>
            </thead>
            <tbody>
              {AGILITY_PATTERNS.map((p, idx) => (
                <tr key={p.id} className="border-b border-border hover:bg-muted/20">
                  <td className="p-2 font-medium text-foreground">
                    {idx + 1}. {p.name}
                  </td>
                  <td className="p-2 text-muted-foreground">{p.whenToUse[0]}</td>
                  <td className="p-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded border ${
                        idx < 2
                          ? 'bg-status-success/10 text-status-success border-status-success/40'
                          : idx < 4
                            ? 'bg-status-warning/10 text-status-warning border-status-warning/40'
                            : 'bg-status-error/10 text-status-error border-status-error/40'
                      }`}
                    >
                      {idx < 2 ? 'Low' : idx < 4 ? 'Medium' : 'High'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
