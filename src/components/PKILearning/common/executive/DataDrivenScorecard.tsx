// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useCallback, useMemo } from 'react'
import { ExportableArtifact } from './ExportableArtifact'

export interface ScorecardDimension {
  id: string
  label: string
  description: string
  autoScore?: number
  userOverride?: boolean
  weight: number
  maxScore?: number
}

interface DataDrivenScorecardProps {
  title: string
  description?: string
  dimensions: ScorecardDimension[]
  colorScale?: 'risk' | 'readiness' | 'maturity'
  onScoreChange?: (scores: Record<string, number>) => void
  showExport?: boolean
  exportFilename?: string
}

function getScoreColor(value: number, scale: 'risk' | 'readiness' | 'maturity'): string {
  if (scale === 'risk') {
    if (value >= 75) return 'text-status-error'
    if (value >= 50) return 'text-status-warning'
    return 'text-status-success'
  }
  if (value >= 75) return 'text-status-success'
  if (value >= 50) return 'text-status-warning'
  return 'text-status-error'
}

function getBarColor(value: number, scale: 'risk' | 'readiness' | 'maturity'): string {
  if (scale === 'risk') {
    if (value >= 75) return 'bg-status-error'
    if (value >= 50) return 'bg-status-warning'
    return 'bg-status-success'
  }
  if (value >= 75) return 'bg-status-success'
  if (value >= 50) return 'bg-status-warning'
  return 'bg-status-error'
}

export const DataDrivenScorecard: React.FC<DataDrivenScorecardProps> = ({
  title,
  description,
  dimensions,
  colorScale = 'readiness',
  onScoreChange,
  showExport = true,
  exportFilename = 'scorecard',
}) => {
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    for (const d of dimensions) {
      initial[d.id] = d.autoScore ?? 0
    }
    return initial
  })

  const handleScoreChange = useCallback(
    (dimId: string, value: number) => {
      const clamped = Math.max(0, Math.min(100, value))
      setScores((prev) => {
        const updated = { ...prev, [dimId]: clamped }
        onScoreChange?.(updated)
        return updated
      })
    },
    [onScoreChange]
  )

  const weightedTotal = useMemo(() => {
    let totalWeight = 0
    let weightedSum = 0
    for (const d of dimensions) {
      const score = scores[d.id] ?? 0
      weightedSum += score * d.weight
      totalWeight += d.weight
    }
    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0
  }, [scores, dimensions])

  const exportMarkdown = useMemo(() => {
    let md = `# ${title}\n\n`
    if (description) md += `${description}\n\n`
    md += `**Overall Score: ${weightedTotal}/100**\n\n`
    md += `Generated: ${new Date().toLocaleDateString()}\n\n`
    md += '| Dimension | Score | Weight |\n'
    md += '|-----------|-------|--------|\n'
    for (const d of dimensions) {
      md += `| ${d.label} | ${scores[d.id] ?? 0}/100 | ${Math.round(d.weight * 100)}% |\n`
    }
    return md
  }, [title, description, weightedTotal, dimensions, scores])

  return (
    <div className="space-y-6">
      {/* Overall score */}
      <div className="glass-panel p-6 text-center">
        <p className="text-sm text-muted-foreground mb-2">{title} — Overall Score</p>
        <p className={`text-3xl md:text-5xl font-bold ${getScoreColor(weightedTotal, colorScale)}`}>
          {weightedTotal}
        </p>
        <p className="text-sm text-muted-foreground mt-1">/100</p>
        {description && <p className="text-sm text-muted-foreground mt-3">{description}</p>}
      </div>

      {/* Dimension bars */}
      <div className="space-y-4">
        {dimensions.map((d) => {
          const score = scores[d.id] ?? 0
          return (
            <div key={d.id} className="glass-panel p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{d.label}</p>
                  <p className="text-xs text-muted-foreground">{d.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${getScoreColor(score, colorScale)}`}>
                    {score}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({Math.round(d.weight * 100)}%)
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${getBarColor(score, colorScale)}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
                {d.userOverride !== false && (
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={score}
                    onChange={(e) => handleScoreChange(d.id, parseInt(e.target.value))}
                    className="w-24 accent-primary"
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Export */}
      {showExport && (
        <ExportableArtifact
          title={`${title} — Export`}
          exportData={exportMarkdown}
          filename={exportFilename}
          formats={['markdown', 'csv']}
        >
          <p className="text-sm text-muted-foreground">
            Export the scorecard above as a shareable document.
          </p>
        </ExportableArtifact>
      )}
    </div>
  )
}
