// SPDX-License-Identifier: GPL-3.0-only
import { motion } from 'framer-motion'
import { ArrowRight, BookmarkCheck, Bookmark } from 'lucide-react'
import clsx from 'clsx'
import { ThreatClassBadge, ShorTierBadge } from './ThreatClassBadges'
import type { ThreatItem } from '../../data/threatsData'
import { StatusBadge } from '../common/StatusBadge'
import { TrustScoreBadge } from '@/components/ui/TrustScoreBadge'
import { useBookmarkStore } from '../../store/useBookmarkStore'
import { Button } from '@/components/ui/button'

interface ThreatCardProps {
  item: ThreatItem
  index?: number
  onClick?: (item: ThreatItem) => void
  dimmed?: boolean
}

/** Criticality → severity-bar / badge tone (icon+text, never colour alone). */
function critTone(criticality: string): { bar: string; pill: string } {
  const c = criticality.toLowerCase()
  if (c === 'critical')
    return {
      bar: 'bg-status-error',
      pill: 'bg-status-error/10 border-status-error/40 text-status-error',
    }
  if (c === 'high' || c === 'medium-high')
    return {
      bar: 'bg-status-warning',
      pill: 'bg-status-warning/10 border-status-warning/40 text-status-warning',
    }
  if (c === 'medium')
    return {
      bar: 'bg-status-warning/60',
      pill: 'bg-status-warning/10 border-status-warning/30 text-status-warning',
    }
  return {
    bar: 'bg-muted-foreground/40',
    pill: 'bg-muted/50 border-border text-muted-foreground',
  }
}

const Chips = ({
  values,
  tone,
  max = 2,
}: {
  values: string
  tone: 'risk' | 'pqc'
  max?: number
}) => {
  const list = values
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
  const shown = list.slice(0, max)
  const extra = list.length - shown.length
  return (
    <>
      {shown.map((c, i) => (
        <span
          key={i}
          className={clsx(
            'whitespace-nowrap rounded-sm border px-1.5 py-0.5',
            tone === 'risk'
              ? 'border-status-error/25 bg-status-error/5 text-status-error/90'
              : 'border-status-success/25 bg-status-success/5 text-status-success/90'
          )}
        >
          {c}
        </span>
      ))}
      {extra > 0 && <span className="self-center text-muted-foreground/60">+{extra}</span>}
    </>
  )
}

export const ThreatCard = ({ item, index = 0, onClick, dimmed = false }: ThreatCardProps) => {
  const isBookmarked = useBookmarkStore((s) => s.myThreats.includes(item.threatId))
  const toggleMyThreat = useBookmarkStore((s) => s.toggleMyThreat)
  const tone = critTone(item.criticality)

  return (
    <motion.article
      id={`threat-${item.threatId}`}
      data-workshop-target={`threats-card-${item.threatId}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className={clsx(
        'group glass-panel relative flex h-full cursor-pointer overflow-hidden p-0 scroll-mt-20 transition-all hover:border-secondary/50',
        dimmed && 'opacity-40 hover:opacity-100'
      )}
      onClick={() => onClick?.(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.(item)
        }
      }}
    >
      {/* severity bar */}
      <span className={clsx('w-1 shrink-0', tone.bar)} aria-hidden="true" />

      <div className="flex min-w-0 flex-1 flex-col gap-2 px-4 py-3">
        {/* top line: criticality · id · status — right: class/shor/trust + bookmark */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={clsx(
              'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
              tone.pill
            )}
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
            {item.criticality}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">{item.threatId}</span>
          {item.status && <StatusBadge status={item.status} size="sm" />}
          <div className="ml-auto flex items-center gap-1.5">
            <ThreatClassBadge threat={item} />
            <ShorTierBadge threat={item} />
            <TrustScoreBadge resourceType="threats" resourceId={item.threatId} size="sm" />
            <Button
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                toggleMyThreat(item.threatId)
              }}
              className={clsx(
                'h-auto rounded p-1 transition-colors',
                isBookmarked
                  ? 'text-status-warning hover:text-status-warning/80'
                  : 'text-muted-foreground/40 hover:text-status-warning'
              )}
              aria-label={isBookmarked ? 'Remove from My Threats' : 'Add to My Threats'}
            >
              {isBookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
            </Button>
          </div>
        </div>

        {/* description (2-line clamp) */}
        <p className="line-clamp-2 text-[12.5px] leading-snug text-foreground/90">
          {item.description}
        </p>

        {/* footer: at-risk crypto → PQC replacement + open dossier */}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex min-w-0 flex-wrap items-center gap-1 font-mono text-[11px]">
            <span className="mr-0.5 font-sans text-[10px] uppercase tracking-wide text-muted-foreground/70">
              At risk
            </span>
            <Chips values={item.cryptoAtRisk} tone="risk" />
            <ArrowRight
              size={12}
              className="mx-0.5 shrink-0 text-muted-foreground/50"
              aria-hidden="true"
            />
            <Chips values={item.pqcReplacement} tone="pqc" />
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
            Open dossier
            <ArrowRight size={12} aria-hidden="true" />
          </span>
        </div>
      </div>
    </motion.article>
  )
}
