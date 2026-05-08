// SPDX-License-Identifier: GPL-3.0-only
interface ConfidenceIndicatorProps {
  score: number | undefined
  size?: 'xs' | 'sm'
  showTooltip?: boolean
}

function colorClass(score: number | undefined): string {
  if (score === undefined) return 'text-muted-foreground'
  if (score >= 70) return 'text-status-success'
  if (score >= 30) return 'text-status-warning'
  return 'text-status-error'
}

function barColorClass(score: number | undefined): string {
  if (score === undefined) return 'bg-muted-foreground/40'
  if (score >= 70) return 'bg-status-success'
  if (score >= 30) return 'bg-status-warning'
  return 'bg-status-error'
}

export function ConfidenceIndicator({
  score,
  size = 'sm',
  showTooltip = true,
}: ConfidenceIndicatorProps) {
  const label = score !== undefined ? `${score}/100` : 'Unscored'
  const tooltip = showTooltip
    ? score !== undefined
      ? `Confidence score: ${score}/100`
      : 'No confidence score assigned yet'
    : undefined

  if (size === 'xs') {
    return (
      <span
        className={`inline-block text-xs font-mono tabular-nums ${colorClass(score)}`}
        title={tooltip}
      >
        {label}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5" title={tooltip}>
      <span className="w-16 h-1 rounded-full bg-muted overflow-hidden shrink-0">
        <span
          className={`block h-full rounded-full ${barColorClass(score)}`}
          style={{ width: score !== undefined ? `${score}%` : '0%' }}
        />
      </span>
      <span className={`text-xs font-mono tabular-nums ${colorClass(score)}`}>{label}</span>
    </span>
  )
}
