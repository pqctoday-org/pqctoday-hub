// SPDX-License-Identifier: GPL-3.0-only
import { ShieldCheck, AlertTriangle, XCircle } from 'lucide-react'

export type UrlQuality = 'url_authoritative' | 'url_needs_review' | 'missing' | string

interface Props {
  quality: UrlQuality | undefined | null
  showLabel?: boolean
  className?: string
}

const CONFIG: Record<string, { icon: typeof ShieldCheck; label: string; className: string }> = {
  url_authoritative: {
    icon: ShieldCheck,
    label: 'Authoritative',
    className: 'text-status-success',
  },
  url_needs_review: {
    icon: AlertTriangle,
    label: 'Needs review',
    className: 'text-status-warning',
  },
  missing: {
    icon: XCircle,
    label: 'Missing',
    className: 'text-status-error',
  },
}

const FALLBACK = {
  icon: AlertTriangle,
  label: 'Unknown',
  className: 'text-muted-foreground',
}

export function UrlQualityBadge({ quality, showLabel = false, className = '' }: Props) {
  if (!quality) return null
  const cfg = CONFIG[quality] ?? FALLBACK
  const Icon = cfg.icon
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.className} ${className}`}
      title={cfg.label}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {showLabel && <span>{cfg.label}</span>}
    </span>
  )
}
