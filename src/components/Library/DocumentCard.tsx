// SPDX-License-Identifier: GPL-3.0-only
import { motion } from 'framer-motion'
import { Bookmark, BookmarkCheck, Calendar, Eye, ExternalLink, Sparkles } from 'lucide-react'
import type { LibraryItem } from '../../data/libraryData'
import { libraryEnrichments } from '../../data/libraryEnrichmentData'
import { StatusBadge } from '../common/StatusBadge'
import { EndorseButton } from '../ui/EndorseButton'
import { FlagButton } from '../ui/FlagButton'
import { buildLibraryEndorsementUrl, buildLibraryFlagUrl } from './libraryEndorsement'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { TrustScoreBadge } from '@/components/ui/TrustScoreBadge'
import { DocumentAnalysis } from './DocumentAnalysis'
import clsx from 'clsx'

interface DocumentCardProps {
  item: LibraryItem
  onViewDetails: (item: LibraryItem) => void
  index?: number
}

const URGENCY_COLORS: Record<string, string> = {
  Critical: 'bg-destructive/10 text-destructive border-destructive/20',
  High: 'bg-status-warning text-status-warning',
  Medium: 'bg-status-warning text-status-warning',
  Low: 'bg-status-success text-status-success border-status-success',
}

export const DocumentCard = ({ item, onViewDetails, index = 0 }: DocumentCardProps) => {
  const { libraryBookmarks, toggleLibraryBookmark } = useBookmarkStore()
  const isBookmarked = libraryBookmarks.includes(item.referenceId)
  const isEnriched = !!libraryEnrichments[item.referenceId]

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      onClick={() => onViewDetails(item)}
      className="glass-panel p-5 flex flex-col h-full hover:border-secondary/50 hover:shadow-md cursor-pointer transition-all bg-card/50 relative"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onViewDetails(item)
        }
      }}
    >
      {item.status && (
        <div className="absolute top-3 right-3">
          <StatusBadge status={item.status} size="sm" />
        </div>
      )}

      <span className="font-mono text-sm text-primary/80 mb-1">{item.referenceId}</span>

      <h3 
        className="text-sm font-semibold text-foreground mb-2 leading-snug pr-16 line-clamp-2"
        title={item.documentTitle}
      >
        {item.documentTitle}
      </h3>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <TrustScoreBadge resourceType="library" resourceId={item.referenceId} size="sm" />
        <span
          className={clsx(
            'inline-flex self-start items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider',
            'bg-status-info text-status-info border border-status-info/50'
          )}
        >
          {item.documentStatus}
        </span>
        {isEnriched ? (
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20"
            title="AI-analyzed document with enriched metadata"
          >
            <Sparkles size={10} aria-hidden="true" />
            Enriched
          </span>
        ) : item.localFile ? (
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20"
            title="Rich summary and preview available"
          >
            <Eye size={10} aria-hidden="true" />
            Preview
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
        <Calendar size={12} aria-hidden="true" />
        <span>{item.lastUpdateDate}</span>
      </div>

      {item.migrationUrgency && (
        <span
          className={clsx(
            'inline-flex self-start items-center px-2 py-0.5 rounded text-xs font-medium border mb-2',
            URGENCY_COLORS[item.migrationUrgency] ??
              'bg-muted/20 text-muted-foreground border-border'
          )}
        >
          {item.migrationUrgency} urgency
        </span>
      )}

      {item.regionScope && (
        <div className="flex flex-wrap gap-1 mb-3">
          {item.regionScope.split(',').map((region) => (
            <span
              key={region.trim()}
              className="px-1.5 py-0.5 rounded text-xs bg-muted/30 text-muted-foreground border border-border"
            >
              {region.trim()}
            </span>
          ))}
        </div>
      )}

      {isEnriched && (
        <div
          className="mb-3 mt-1"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          role="presentation"
        >
          <DocumentAnalysis enrichment={libraryEnrichments[item.referenceId]} />
        </div>
      )}

      <div className="flex items-center gap-2 mt-auto pt-3 border-t border-border">
        {item.downloadUrl && (
          <a
            href={item.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-muted/30 border border-border text-muted-foreground hover:text-foreground text-xs font-medium transition-all"
            aria-label={`Open ${item.documentTitle} in new tab`}
          >
            <ExternalLink size={14} aria-hidden="true" />
            Open
          </a>
        )}
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <div className="flex items-center gap-1 ml-auto" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleLibraryBookmark(item.referenceId)
            }}
            className="p-1 rounded hover:bg-muted/50 transition-colors"
            aria-label={
              isBookmarked ? `Remove ${item.referenceId} bookmark` : `Bookmark ${item.referenceId}`
            }
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            {isBookmarked ? (
              <BookmarkCheck size={16} className="text-primary" />
            ) : (
              <Bookmark size={16} className="text-muted-foreground" />
            )}
          </button>
          <EndorseButton
            endorseUrl={buildLibraryEndorsementUrl(item)}
            resourceLabel={item.referenceId}
            resourceType="Library"
          />
          <FlagButton
            flagUrl={buildLibraryFlagUrl(item)}
            resourceLabel={item.referenceId}
            resourceType="Library"
          />
        </div>
      </div>
    </motion.article>
  )
}
