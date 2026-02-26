import React, { useMemo, useState, useCallback } from 'react'
import { Grid3X3, Info } from 'lucide-react'
import { HeatmapGrid, type HeatmapCell } from '@/components/PKILearning/common/executive'

interface RiskEntry {
  id: string
  assetName: string
  currentAlgorithm: string
  threatVector: string
  likelihood: number
  impact: number
  mitigation: string
}

interface RiskHeatmapGeneratorProps {
  riskEntries: RiskEntry[]
}

const LIKELIHOOD_LABELS = [
  '5 - Almost Certain',
  '4 - Likely',
  '3 - Possible',
  '2 - Unlikely',
  '1 - Rare',
]

const IMPACT_LABELS = [
  '1 - Negligible',
  '2 - Minor',
  '3 - Moderate',
  '4 - Major',
  '5 - Catastrophic',
]

function getRiskColor(score: number): string {
  if (score >= 20) return 'Critical'
  if (score >= 12) return 'High'
  if (score >= 6) return 'Medium'
  return 'Low'
}

export const RiskHeatmapGenerator: React.FC<RiskHeatmapGeneratorProps> = ({ riskEntries }) => {
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)

  // Build heatmap cells: rows = likelihood (5 down to 1), columns = impact (1 to 5)
  const { cells, cellEntries } = useMemo(() => {
    // cellEntries maps "row-col" to the list of risk entries in that cell
    const entriesMap = new Map<string, RiskEntry[]>()

    for (const entry of riskEntries) {
      // Row index: likelihood 5 is row 0, likelihood 1 is row 4
      const rowIdx = 5 - entry.likelihood
      // Col index: impact 1 is col 0, impact 5 is col 4
      const colIdx = entry.impact - 1
      const key = `${rowIdx}-${colIdx}`
      const existing = entriesMap.get(key)
      if (existing) {
        existing.push(entry)
      } else {
        entriesMap.set(key, [entry])
      }
    }

    const heatmapCells: HeatmapCell[][] = []

    for (let row = 0; row < 5; row++) {
      const rowCells: HeatmapCell[] = []
      for (let col = 0; col < 5; col++) {
        const likelihood = 5 - row
        const impact = col + 1
        const score = likelihood * impact
        const key = `${row}-${col}`
        const entries = entriesMap.get(key) ?? []

        // Value maps to 0-100 scale for HeatmapGrid color
        const normalizedValue = (score / 25) * 100

        rowCells.push({
          value: entries.length > 0 ? normalizedValue : normalizedValue * 0.3,
          label: entries.length > 0 ? `${entries.length}` : '',
          tooltip:
            entries.length > 0
              ? `${entries.length} risk(s): ${entries.map((e) => e.assetName || 'Unnamed').join(', ')}`
              : `Score: ${score} (${getRiskColor(score)})`,
        })
      }
      heatmapCells.push(rowCells)
    }

    return { cells: heatmapCells, cellEntries: entriesMap }
  }, [riskEntries])

  const handleCellClick = useCallback((row: number, col: number) => {
    setSelectedCell((prev) => (prev?.row === row && prev?.col === col ? null : { row, col }))
  }, [])

  const selectedEntries = useMemo(() => {
    if (!selectedCell) return []
    const key = `${selectedCell.row}-${selectedCell.col}`
    return cellEntries.get(key) ?? []
  }, [selectedCell, cellEntries])

  const selectedScore = selectedCell ? (5 - selectedCell.row) * (selectedCell.col + 1) : null

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border border-border">
        <Info size={18} className="text-primary shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <p>
            This heatmap visualizes your risk register entries on a 5x5 Likelihood x Impact grid.
            {riskEntries.length > 0 ? (
              <>
                {' '}
                Cells with numbers indicate how many risk entries fall in that position. Click any
                cell to see the details.
              </>
            ) : (
              <> Add entries in the Risk Register Builder (Step 2) to populate this heatmap.</>
            )}
          </p>
        </div>
      </div>

      {/* Heatmap */}
      <div className="glass-panel p-6">
        <div className="flex items-center gap-2 mb-4">
          <Grid3X3 size={18} className="text-primary" />
          <h3 className="text-base font-semibold text-foreground">Quantum Risk Heatmap</h3>
          {riskEntries.length > 0 && (
            <span className="text-xs text-muted-foreground ml-2">
              ({riskEntries.length} {riskEntries.length === 1 ? 'risk' : 'risks'} plotted)
            </span>
          )}
        </div>

        <div className="flex items-start gap-4">
          {/* Y-axis label */}
          <div className="flex items-center justify-center w-6 shrink-0 self-center">
            <span
              className="text-xs font-medium text-muted-foreground whitespace-nowrap"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              LIKELIHOOD
            </span>
          </div>

          <div className="flex-1 space-y-2">
            <HeatmapGrid
              rows={LIKELIHOOD_LABELS}
              columns={IMPACT_LABELS}
              cells={cells}
              colorScale="risk"
              onCellClick={handleCellClick}
            />

            {/* X-axis label */}
            <div className="text-center">
              <span className="text-xs font-medium text-muted-foreground">IMPACT</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Cell Details */}
      {selectedCell && (
        <div className="glass-panel p-6 animate-fade-in">
          <h3 className="text-base font-semibold text-foreground mb-3">
            Cell Details &mdash; Likelihood: {5 - selectedCell.row}, Impact: {selectedCell.col + 1}
            {selectedScore && (
              <span
                className={`ml-2 text-xs px-2 py-0.5 rounded ${
                  selectedScore >= 20
                    ? 'bg-status-error/10 text-status-error'
                    : selectedScore >= 12
                      ? 'bg-status-warning/10 text-status-warning'
                      : selectedScore >= 6
                        ? 'bg-primary/10 text-primary'
                        : 'bg-status-success/10 text-status-success'
                }`}
              >
                Score: {selectedScore} ({getRiskColor(selectedScore)})
              </span>
            )}
          </h3>
          {selectedEntries.length > 0 ? (
            <div className="space-y-3">
              {selectedEntries.map((entry) => (
                <div key={entry.id} className="p-3 bg-muted/50 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">
                      {entry.assetName || 'Unnamed Asset'}
                    </span>
                    <span className="text-xs text-muted-foreground">{entry.currentAlgorithm}</span>
                  </div>
                  {entry.mitigation && (
                    <p className="text-xs text-muted-foreground mt-1">
                      <strong>Mitigation:</strong> {entry.mitigation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No risk entries in this cell. Add entries with Likelihood {5 - selectedCell.row} and
              Impact {selectedCell.col + 1} in the Risk Register Builder to populate this cell.
            </p>
          )}
        </div>
      )}

      {/* Risk Distribution Summary */}
      {riskEntries.length > 0 && (
        <div className="glass-panel p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">
            Risk Distribution Summary
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: 'Critical',
                range: '20\u201325',
                entries: riskEntries.filter((e) => e.likelihood * e.impact >= 20),
                color: 'text-status-error',
                bg: 'bg-status-error/10 border-status-error/20',
              },
              {
                label: 'High',
                range: '12\u201319',
                entries: riskEntries.filter(
                  (e) => e.likelihood * e.impact >= 12 && e.likelihood * e.impact < 20
                ),
                color: 'text-status-warning',
                bg: 'bg-status-warning/10 border-status-warning/20',
              },
              {
                label: 'Medium',
                range: '6\u201311',
                entries: riskEntries.filter(
                  (e) => e.likelihood * e.impact >= 6 && e.likelihood * e.impact < 12
                ),
                color: 'text-primary',
                bg: 'bg-primary/10 border-primary/20',
              },
              {
                label: 'Low',
                range: '1\u20135',
                entries: riskEntries.filter((e) => e.likelihood * e.impact < 6),
                color: 'text-status-success',
                bg: 'bg-status-success/10 border-status-success/20',
              },
            ].map((cat) => (
              <div key={cat.label} className={`rounded-lg p-4 border ${cat.bg}`}>
                <div className={`text-2xl font-bold ${cat.color}`}>{cat.entries.length}</div>
                <div className="text-sm font-medium text-foreground">{cat.label}</div>
                <div className="text-xs text-muted-foreground">Score {cat.range}</div>
                {cat.entries.length > 0 && (
                  <div className="mt-2 space-y-0.5">
                    {cat.entries.slice(0, 3).map((e) => (
                      <div key={e.id} className="text-xs text-muted-foreground truncate">
                        {e.assetName || 'Unnamed'}
                      </div>
                    ))}
                    {cat.entries.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{cat.entries.length - 3} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {riskEntries.length === 0 && (
        <div className="glass-panel p-8 text-center">
          <Grid3X3 size={32} className="mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">
            No risk entries to display. Go to Step 2 (Risk Register Builder) to add risk entries,
            then return here to visualize them on the heatmap.
          </p>
        </div>
      )}
    </div>
  )
}
