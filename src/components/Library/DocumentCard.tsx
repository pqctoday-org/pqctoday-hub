import { motion } from 'framer-motion'
import { Calendar, Eye, ExternalLink, Info } from 'lucide-react'
import type { LibraryItem } from '../../data/libraryData'
import { StatusBadge } from '../common/StatusBadge'
import clsx from 'clsx'

interface DocumentCardProps {
  item: LibraryItem
  onViewDetails: (item: LibraryItem) => void
  index?: number
}

const URGENCY_COLORS: Record<string, string> = {
  Critical: 'bg-destructive/10 text-destructive border-destructive/20',
  High: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  Low: 'bg-status-success text-status-success border-status-success',
}

export const DocumentCard = ({ item, onViewDetails, index = 0 }: DocumentCardProps) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className="glass-panel p-5 flex flex-col h-full hover:border-secondary/50 transition-colors bg-card/50 relative"
    >
      {item.status && (
        <div className="absolute top-3 right-3">
          <StatusBadge status={item.status} size="sm" />
        </div>
      )}

      <span className="font-mono text-sm text-primary/80 mb-1">{item.referenceId}</span>

      <h3 className="text-sm font-semibold text-foreground mb-2 leading-snug pr-16 line-clamp-2">
        {item.documentTitle}
      </h3>

      <div className="flex items-center gap-2 mb-3">
        <span
          className={clsx(
            'inline-flex self-start items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
            'bg-status-info text-status-info border border-status-info/50'
          )}
        >
          {item.documentStatus}
        </span>
        {item.localFile && (
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/20"
            title="Rich summary and preview available"
          >
            <Eye size={10} aria-hidden="true" />
            Preview
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
        <Calendar size={12} aria-hidden="true" />
        <span>{item.lastUpdateDate}</span>
      </div>

      {item.migrationUrgency && (
        <span
          className={clsx(
            'inline-flex self-start items-center px-2 py-0.5 rounded text-[10px] font-medium border mb-2',
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
              className="px-1.5 py-0.5 rounded text-[10px] bg-muted/30 text-muted-foreground border border-border"
            >
              {region.trim()}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 mt-auto pt-3 border-t border-border">
        <button
          onClick={() => onViewDetails(item)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/40 text-primary text-xs font-medium transition-all"
          aria-label={`View details for ${item.documentTitle}`}
        >
          <Info size={14} aria-hidden="true" />
          Details
        </button>
        {item.downloadUrl && (
          <a
            href={item.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-muted/30 border border-border text-muted-foreground hover:text-foreground text-xs font-medium transition-all"
            aria-label={`Open ${item.documentTitle} in new tab`}
          >
            <ExternalLink size={14} aria-hidden="true" />
            Open
          </a>
        )}
      </div>
    </motion.article>
  )
}
