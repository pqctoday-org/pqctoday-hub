// SPDX-License-Identifier: GPL-3.0-only

interface ModuleProgressPieProps {
  /** 0–100 percentage of learn sections checked */
  pct: number
  /** Diameter in px (default 40) */
  size?: number
  /** Stroke width in px (default 4) */
  strokeWidth?: number
}

/**
 * Small SVG donut chart showing learn-section completion percentage.
 * Uses CSS variables so it respects light/dark mode.
 */
export const ModuleProgressPie = ({ pct, size = 40, strokeWidth = 4 }: ModuleProgressPieProps) => {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const filledLength = (pct / 100) * circumference
  const cx = size / 2
  const cy = size / 2

  // Color based on completion level
  const strokeColor =
    pct === 100 ? 'var(--status-success)' : pct >= 50 ? 'var(--primary)' : 'var(--status-warning)'

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" role="img">
      {/* Background track */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="var(--muted-foreground)"
        strokeOpacity={0.3}
        strokeWidth={strokeWidth}
      />
      {/* Progress arc — starts at top (−90°) */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={`${filledLength} ${circumference - filledLength}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dasharray 0.4s ease, stroke 0.3s ease' }}
      />
      {/* Center percentage label */}
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size * 0.25}
        fontWeight="700"
        fill="var(--foreground)"
      >
        {pct}%
      </text>
    </svg>
  )
}
