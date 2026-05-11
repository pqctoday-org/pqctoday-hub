// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useRef } from 'react'
import { MapPin, BookOpen, Clock, ShieldCheck, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Leader } from '../../data/leadersData'
import { CountryFlag } from '../common/CountryFlag'
import { FLAG_CODE_MAP } from './leadersConstants'
import { Button } from '@/components/ui/button'

interface LeaderDetailSectionProps {
  leader: Leader
  onClose: () => void
}

export const LeaderDetailSection = ({ leader, onClose }: LeaderDetailSectionProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const flagCode = FLAG_CODE_MAP[leader.country] ?? 'un'

  useEffect(() => {
    const el = containerRef.current
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [leader.id])

  return (
    <motion.section
      ref={containerRef}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
      role="region"
      aria-label={`Additional details for ${leader.name}`}
    >
      <div className="mt-4 pt-3 border-t border-border space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
            {leader.category && (
              <span className="px-2 py-0.5 rounded-full font-medium bg-muted/50">
                {leader.category}
              </span>
            )}
            {leader.country && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={12} className="shrink-0" aria-hidden="true" />
                <CountryFlag code={flagCode} width={16} height={11} />
                {leader.country}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            className="h-7 w-7 p-0 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground"
            aria-label="Collapse details"
          >
            <X size={14} />
          </Button>
        </div>

        {leader.country && (
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/timeline?country=${encodeURIComponent(leader.country)}`}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-muted/30 border border-border hover:bg-muted/60 hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all"
              title={`View timeline events from ${leader.country}`}
            >
              <Clock size={12} aria-hidden="true" />
              Events from {leader.country}
            </Link>
            <Link
              to={`/compliance${leader.type === 'Public' ? '?industry=Government+%26+Defense' : leader.type === 'Academic' ? '' : '?industry=Technology'}`}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-muted/30 border border-border hover:bg-muted/60 hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all"
              title="View compliance frameworks for this sector"
            >
              <ShieldCheck size={12} aria-hidden="true" />
              Compliance frameworks
            </Link>
          </div>
        )}

        {leader.keyResourceUrl && leader.keyResourceUrl.length > 0 && (
          <div className="rounded-lg bg-muted/20 border border-border p-2.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1.5">
              {leader.keyResourceUrl.length === 1
                ? 'Key Resource'
                : `Key Resources (${leader.keyResourceUrl.length})`}
            </p>
            <div className="flex flex-col gap-0.5">
              {leader.keyResourceUrl.slice(0, 6).map((ref, i) => (
                <Link
                  key={i}
                  to={`/library?ref=${encodeURIComponent(ref)}`}
                  className="text-xs font-medium text-secondary hover:text-secondary/80 transition-colors flex items-center gap-1.5"
                  title={`Open in Library: ${ref}`}
                >
                  <BookOpen size={11} className="shrink-0" aria-hidden="true" />
                  <span className="truncate">{ref}</span>
                </Link>
              ))}
              {leader.keyResourceUrl.length > 6 && (
                <span className="text-[10px] text-muted-foreground italic mt-0.5">
                  …and {leader.keyResourceUrl.length - 6} more
                </span>
              )}
            </div>
          </div>
        )}

        {(leader.websiteUrl || leader.linkedinUrl) && (
          <div className="flex flex-wrap gap-2">
            {leader.websiteUrl && (
              <a
                href={leader.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Visit ${leader.name}'s website (opens in new window)`}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/40 text-primary font-medium"
              >
                Website
              </a>
            )}
            {leader.linkedinUrl && (
              <a
                href={leader.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Visit ${leader.name}'s LinkedIn profile (opens in new window)`}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-status-info hover:bg-primary/20 border-status-info/50 hover:border-primary/40 text-status-info font-medium"
              >
                LinkedIn
              </a>
            )}
          </div>
        )}
      </div>
    </motion.section>
  )
}
