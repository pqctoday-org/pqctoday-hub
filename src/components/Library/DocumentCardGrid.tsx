import { AnimatePresence } from 'framer-motion'
import type { LibraryItem } from '../../data/libraryData'
import { DocumentCard } from './DocumentCard'

interface DocumentCardGridProps {
  items: LibraryItem[]
  onViewDetails: (item: LibraryItem) => void
}

export const DocumentCardGrid = ({ items, onViewDetails }: DocumentCardGridProps) => {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic py-8 text-center">
        No documents found matching your filters.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <AnimatePresence mode="popLayout">
        {items.map((item, i) => (
          <DocumentCard
            key={item.referenceId}
            item={item}
            onViewDetails={onViewDetails}
            index={i}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
