// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo } from 'react'

interface EntropyGaugeProps {
  /** Test name */
  label: string
  /** Current value */
  value: number
  /** Pass/fail threshold */
  threshold: number
  /** Whether this test passed */
  passed: boolean
  /** Whether higher values mean better (true) or lower values mean better (false) */
  higherIsBetter: boolean
  /** Sparkline history (last N values) */
  history: number[]
}

const GAUGE_SIZE = 100
const STROKE_WIDTH = 8
const RADIUS = (GAUGE_SIZE - STROKE_WIDTH) / 2
const CENTER = GAUGE_SIZE / 2
// Arc from -135 to +135 degrees (270-degree sweep)
const ARC_START = -135
const ARC_SWEEP = 270

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  }
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle)
  const end = polarToCartesian(cx, cy, r, startAngle)
  const sweep = endAngle - startAngle
  const largeArc = sweep > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`
}

/** Sparkline — tiny line chart of historical values */
const Sparkline: React.FC<{
  values: number[]
  threshold: number
  width: number
  height: number
  higherIsBetter: boolean
}> = ({ values, threshold, width, height, higherIsBetter }) => {
  if (values.length < 2) return null

  const allVals = [...values, threshold]
  const min = Math.min(...allVals) * 0.9
  const max = Math.max(...allVals) * 1.1 || 1

  const toY = (v: number) => height - ((v - min) / (max - min)) * height
  const toX = (i: number) => (i / (values.length - 1)) * width

  const linePath = values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(v)}`).join(' ')

  const thresholdY = toY(threshold)

  return (
    <svg width={width} height={height} className="overflow-visible">
      {/* Threshold line */}
      <line
        x1={0}
        y1={thresholdY}
        x2={width}
        y2={thresholdY}
        className="stroke-muted-foreground"
        strokeWidth={0.5}
        strokeDasharray="2,2"
        opacity={0.5}
      />
      {/* Value line */}
      <path
        d={linePath}
        fill="none"
        className={
          values[values.length - 1] !== undefined
            ? higherIsBetter
              ? values[values.length - 1] >= threshold
                ? 'stroke-success'
                : 'stroke-destructive'
              : values[values.length - 1] <= threshold
                ? 'stroke-success'
                : 'stroke-destructive'
            : 'stroke-primary'
        }
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  )
}

export const EntropyGauge: React.FC<EntropyGaugeProps> = ({
  label,
  value,
  threshold,
  passed,
  higherIsBetter,
  history,
}) => {
  // Compute gauge fill ratio (0 to 1)
  const ratio = useMemo(() => {
    if (higherIsBetter) {
      // e.g., min-entropy: value 8 is best, threshold 6
      const maxVal = Math.max(threshold * 1.5, value * 1.2, threshold + 2)
      return Math.min(value / maxVal, 1)
    }
    // e.g., frequency deviation: value 0 is best, threshold 0.05
    const maxVal = Math.max(threshold * 3, value * 1.2, threshold + 1)
    return Math.min(value / maxVal, 1)
  }, [value, threshold, higherIsBetter])

  const endAngle = ARC_START + ratio * ARC_SWEEP

  // Threshold tick position
  const thresholdRatio = useMemo(() => {
    if (higherIsBetter) {
      const maxVal = Math.max(threshold * 1.5, value * 1.2, threshold + 2)
      return Math.min(threshold / maxVal, 1)
    }
    const maxVal = Math.max(threshold * 3, value * 1.2, threshold + 1)
    return Math.min(threshold / maxVal, 1)
  }, [threshold, value, higherIsBetter])

  const thresholdAngle = ARC_START + thresholdRatio * ARC_SWEEP
  const thresholdPos = polarToCartesian(CENTER, CENTER, RADIUS, thresholdAngle)

  return (
    <div
      className={`rounded-lg border p-3 transition-colors duration-300 ${
        passed ? 'border-success/30 bg-status-success/5' : 'border-destructive/30 bg-status-error/5'
      }`}
    >
      {/* Label */}
      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center mb-1">
        {label}
      </div>

      {/* Gauge */}
      <div className="flex justify-center">
        <svg
          width={GAUGE_SIZE}
          height={GAUGE_SIZE * 0.7}
          viewBox={`0 0 ${GAUGE_SIZE} ${GAUGE_SIZE * 0.75}`}
          role="meter"
          aria-label={`${label}: ${value.toFixed(3)}`}
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={threshold * 2}
        >
          {/* Background arc */}
          <path
            d={arcPath(CENTER, CENTER, RADIUS, ARC_START, ARC_START + ARC_SWEEP)}
            fill="none"
            className="stroke-muted/40"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
          />

          {/* Danger zone arc */}
          <path
            d={arcPath(
              CENTER,
              CENTER,
              RADIUS,
              higherIsBetter ? ARC_START : thresholdAngle,
              higherIsBetter ? thresholdAngle : ARC_START + ARC_SWEEP
            )}
            fill="none"
            className="stroke-destructive/20"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
          />

          {/* Value arc */}
          {ratio > 0.01 && (
            <path
              d={arcPath(CENTER, CENTER, RADIUS, ARC_START, endAngle)}
              fill="none"
              className={passed ? 'stroke-success' : 'stroke-destructive'}
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 300ms ease' }}
            />
          )}

          {/* Threshold tick */}
          <circle
            cx={thresholdPos.x}
            cy={thresholdPos.y}
            r={3}
            className="fill-foreground"
            opacity={0.6}
          >
            <title>Threshold: {threshold.toFixed(3)}</title>
          </circle>

          {/* Value text */}
          <text
            x={CENTER}
            y={CENTER + 2}
            textAnchor="middle"
            className={`font-mono font-bold ${passed ? 'fill-success' : 'fill-destructive'}`}
            fontSize={14}
          >
            {value.toFixed(2)}
          </text>
        </svg>
      </div>

      {/* Sparkline */}
      {history.length > 1 && (
        <div className="flex justify-center mt-1">
          <Sparkline
            values={history}
            threshold={threshold}
            width={80}
            height={20}
            higherIsBetter={higherIsBetter}
          />
        </div>
      )}
    </div>
  )
}
