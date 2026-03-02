// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { ScatterChart } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LagPlotProps {
  /** Raw byte data to plot */
  data: Uint8Array
  /** Plot size in pixels (default: 200) */
  size?: number
  /** Hide the lag selector (default lag = 1) */
  hideLagSelector?: boolean
}

const LAG_OPTIONS = [1, 2, 4, 8] as const

const GRID_LINES = [64, 128, 192] // 0x40, 0x80, 0xC0
const AXIS_TICKS = [0, 64, 128, 192, 255]

const LagPlotInner: React.FC<LagPlotProps> = ({ data, size = 200, hideLagSelector = false }) => {
  const [lag, setLag] = useState(1)

  const points = useMemo(() => {
    const pts: { x: number; y: number }[] = []
    for (let i = 0; i < data.length - lag; i++) {
      pts.push({ x: data[i], y: data[i + lag] })
    }
    return pts
  }, [data, lag])

  // SVG coordinate system: 0-255 data maps to padded viewport
  const padding = 28
  const viewSize = size
  const plotSize = viewSize - padding * 2

  const toX = (val: number) => padding + (val / 255) * plotSize
  const toY = (val: number) => padding + ((255 - val) / 255) * plotSize // Invert Y for SVG

  const description = useMemo(() => {
    if (points.length === 0) return 'No data points to plot'
    const uniquePoints = new Set(points.map((p) => `${p.x},${p.y}`)).size
    const coverage = ((uniquePoints / (256 * 256)) * 100).toFixed(2)
    return `Lag-${lag} plot: ${points.length} points, ${uniquePoints} unique positions (${coverage}% of space covered)`
  }, [points, lag])

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScatterChart size={14} className="text-primary" />
          <span className="text-xs font-semibold text-foreground">
            Lag-{lag} Autocorrelation Plot
          </span>
        </div>
        {!hideLagSelector && (
          <div className="flex gap-1">
            {LAG_OPTIONS.map((k) => (
              <Button
                key={k}
                variant={lag === k ? 'secondary' : 'ghost'}
                size="sm"
                className="h-6 w-8 px-1 text-[10px]"
                onClick={() => setLag(k)}
              >
                k={k}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Plot */}
      <div className="bg-muted/20 rounded-lg p-2 border border-border flex justify-center">
        <svg
          width={viewSize}
          height={viewSize}
          viewBox={`0 0 ${viewSize} ${viewSize}`}
          role="img"
          aria-label={description}
          className="select-none"
        >
          {/* Background */}
          <rect
            x={padding}
            y={padding}
            width={plotSize}
            height={plotSize}
            className="fill-muted/30"
            rx={2}
          />

          {/* Grid lines */}
          {GRID_LINES.map((v) => (
            <g key={v}>
              <line
                x1={toX(v)}
                y1={padding}
                x2={toX(v)}
                y2={padding + plotSize}
                className="stroke-border"
                strokeWidth={0.5}
                strokeDasharray="2,2"
              />
              <line
                x1={padding}
                y1={toY(v)}
                x2={padding + plotSize}
                y2={toY(v)}
                className="stroke-border"
                strokeWidth={0.5}
                strokeDasharray="2,2"
              />
            </g>
          ))}

          {/* Border */}
          <rect
            x={padding}
            y={padding}
            width={plotSize}
            height={plotSize}
            fill="none"
            className="stroke-border"
            strokeWidth={1}
          />

          {/* Data points */}
          {points.map((pt, i) => (
            <circle
              key={i}
              cx={toX(pt.x)}
              cy={toY(pt.y)}
              r={Math.max(2, Math.min(3, 200 / points.length))}
              className="fill-primary"
              opacity={0.4}
            >
              <title>
                byte[{i}]=0x{pt.x.toString(16).padStart(2, '0')}, byte[{i + lag}]=0x
                {pt.y.toString(16).padStart(2, '0')}
              </title>
            </circle>
          ))}

          {/* Axis labels */}
          {AXIS_TICKS.map((v) => (
            <g key={`tick-${v}`}>
              {/* X axis */}
              <text
                x={toX(v)}
                y={viewSize - 4}
                textAnchor="middle"
                className="fill-muted-foreground"
                fontSize={8}
                fontFamily="monospace"
              >
                {v.toString(16).padStart(2, '0')}
              </text>
              {/* Y axis */}
              <text
                x={padding - 4}
                y={toY(v) + 3}
                textAnchor="end"
                className="fill-muted-foreground"
                fontSize={8}
                fontFamily="monospace"
              >
                {v.toString(16).padStart(2, '0')}
              </text>
            </g>
          ))}

          {/* Axis titles */}
          <text
            x={viewSize / 2}
            y={viewSize - 14}
            textAnchor="middle"
            className="fill-muted-foreground"
            fontSize={9}
          >
            byte[i]
          </text>
          <text
            x={10}
            y={viewSize / 2}
            textAnchor="middle"
            className="fill-muted-foreground"
            fontSize={9}
            transform={`rotate(-90, 10, ${viewSize / 2})`}
          >
            byte[i+{lag}]
          </text>
        </svg>
      </div>

      {/* Caption */}
      <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
        Random data fills the square uniformly. Patterns create lines, clusters, or voids.
      </p>
    </div>
  )
}

/** Autocorrelation scatter plot — plots (byte[i], byte[i+k]) pairs to reveal sequential patterns */
export const LagPlot = React.memo(LagPlotInner, (prev, next) => {
  if (prev.data.length !== next.data.length) return false
  if (prev.size !== next.size) return false
  if (prev.hideLagSelector !== next.hideLagSelector) return false
  for (let i = 0; i < prev.data.length; i++) {
    if (prev.data[i] !== next.data[i]) return false
  }
  return true
})
