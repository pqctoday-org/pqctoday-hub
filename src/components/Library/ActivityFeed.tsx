import { motion } from 'framer-motion'
import { Calendar, Clock } from 'lucide-react'
import type { LibraryItem } from '../../data/libraryData'
import { StatusBadge } from '../common/StatusBadge'

interface ActivityFeedProps {
  items: LibraryItem[]
  onSelect: (item: LibraryItem) => void
}

export const ActivityFeed = ({ items, onSelect }: ActivityFeedProps) => {
  if (items.length === 0) return null

  return (
    <section aria-label="Recent updates">
      <div className="flex items-center gap-2 mb-3">
        <Clock size={16} className="text-primary" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-foreground">Recent Updates</h3>
        <span className="text-xs text-muted-foreground">({items.length})</span>
      </div>

      {/* Desktop: horizontal scroll */}
      <div className="hidden md:block glass-panel p-3 overflow-hidden">
        <div
          className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin"
          role="list"
        >
          {items.map((item, i) => (
            <motion.button
              key={item.referenceId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: i * 0.05 }}
              onClick={() => onSelect(item)}
              className="snap-start flex-shrink-0 w-[260px] p-3 rounded-xl bg-muted/20 hover:bg-muted/40 border border-border hover:border-secondary/50 transition-all text-left group"
              role="listitem"
              aria-label={`${item.status}: ${item.referenceId} — ${item.documentTitle}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Calendar size={10} aria-hidden="true" />
                  <span>{item.lastUpdateDate}</span>
                </div>
                <StatusBadge status={item.status} size="sm" />
              </div>
              <p className="font-mono text-xs text-primary/80 mb-0.5">{item.referenceId}</p>
              <p className="text-xs text-foreground leading-snug line-clamp-2 group-hover:text-foreground/90">
                {item.documentTitle}
              </p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Mobile: vertical list, top 5 */}
      <div className="md:hidden glass-panel p-3 space-y-2" role="list">
        {items.slice(0, 5).map((item, i) => (
          <motion.button
            key={item.referenceId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: i * 0.05 }}
            onClick={() => onSelect(item)}
            className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/40 border border-border hover:border-secondary/50 transition-all text-left"
            role="listitem"
            aria-label={`${item.status}: ${item.referenceId} — ${item.documentTitle}`}
          >
            <StatusBadge status={item.status} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="font-mono text-xs text-primary/80">{item.referenceId}</p>
              <p className="text-xs text-foreground truncate">{item.documentTitle}</p>
            </div>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {item.lastUpdateDate}
            </span>
          </motion.button>
        ))}
      </div>
    </section>
  )
}
