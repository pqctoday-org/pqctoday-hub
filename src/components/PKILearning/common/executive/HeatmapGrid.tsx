import React from 'react'

export interface HeatmapCell {
  value: number
  label?: string
  tooltip?: string
}

interface HeatmapGridProps {
  title?: string
  rows: string[]
  columns: string[]
  cells: HeatmapCell[][]
  colorScale?: 'risk' | 'priority' | 'readiness'
  onCellClick?: (row: number, col: number) => void
}

function getCellColor(value: number, scale: 'risk' | 'priority' | 'readiness'): string {
  // value should be 0-100
  const clamped = Math.max(0, Math.min(100, value))

  if (scale === 'risk') {
    if (clamped >= 75) return 'bg-status-error/80 text-white'
    if (clamped >= 50) return 'bg-status-warning/80 text-foreground'
    if (clamped >= 25) return 'bg-status-warning/40 text-foreground'
    return 'bg-status-success/30 text-foreground'
  }

  if (scale === 'readiness') {
    if (clamped >= 75) return 'bg-status-success/80 text-white'
    if (clamped >= 50) return 'bg-status-success/40 text-foreground'
    if (clamped >= 25) return 'bg-status-warning/40 text-foreground'
    return 'bg-status-error/30 text-foreground'
  }

  // priority
  if (clamped >= 75) return 'bg-primary/80 text-primary-foreground'
  if (clamped >= 50) return 'bg-primary/50 text-foreground'
  if (clamped >= 25) return 'bg-primary/25 text-foreground'
  return 'bg-muted text-muted-foreground'
}

export const HeatmapGrid: React.FC<HeatmapGridProps> = ({
  title,
  rows,
  columns,
  cells,
  colorScale = 'risk',
  onCellClick,
}) => {
  return (
    <div className="space-y-4">
      {title && <h3 className="text-lg font-semibold text-foreground">{title}</h3>}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left text-sm font-medium text-muted-foreground border-b border-border" />
              {columns.map((col) => (
                <th
                  key={col}
                  className="p-2 text-center text-sm font-medium text-muted-foreground border-b border-border min-w-[80px]"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={row}>
                <td className="p-2 text-sm font-medium text-foreground border-b border-border whitespace-nowrap">
                  {row}
                </td>
                {columns.map((col, colIdx) => {
                  const cell = cells[rowIdx]?.[colIdx] ?? { value: 0 }
                  return (
                    <td
                      key={col}
                      className={`p-2 text-center text-sm font-medium border-b border-border transition-colors ${getCellColor(cell.value, colorScale)} ${onCellClick ? 'cursor-pointer hover:opacity-80' : ''}`}
                      onClick={() => onCellClick?.(rowIdx, colIdx)}
                      title={cell.tooltip ?? `${row} / ${col}: ${cell.value}`}
                    >
                      {cell.label ?? cell.value}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>Scale:</span>
        {colorScale === 'risk' && (
          <>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-status-success/30" /> Low
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-status-warning/40" /> Medium
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-status-warning/80" /> High
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-status-error/80" /> Critical
            </span>
          </>
        )}
        {colorScale === 'readiness' && (
          <>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-status-error/30" /> Not Ready
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-status-warning/40" /> Partial
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-status-success/40" /> Good
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-status-success/80" /> Ready
            </span>
          </>
        )}
      </div>
    </div>
  )
}
