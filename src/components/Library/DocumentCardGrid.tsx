// SPDX-License-Identifier: GPL-3.0-only
import { useState, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { LibraryItem } from '../../data/libraryData'
import { DocumentCard } from './DocumentCard'
import { Button } from '@/components/ui/button'

export interface DocumentCardGridProps {
  items: LibraryItem[]
  onViewDetails: (item: LibraryItem) => void
  showHierarchicalAccordion?: boolean
}

const HierarchicalCardGroup = ({
  root,
  allItems,
  onViewDetails,
  index,
}: {
  root: LibraryItem
  allItems: LibraryItem[]
  onViewDetails: (item: LibraryItem) => void
  index: number
}) => {
  const [expanded, setExpanded] = useState(false)
  const activeChildren = useMemo(() => {
    return (
      root.children?.filter((child) => allItems.some((i) => i.referenceId === child.referenceId)) ||
      []
    )
  }, [root, allItems])

  return (
    <div className="space-y-3">
      <DocumentCard item={root} onViewDetails={onViewDetails} index={index} />

      {activeChildren.length > 0 && (
        <div className="flex flex-col gap-2">
          <Button
            variant="ghost"
            onClick={() => setExpanded(!expanded)}
            className="self-start flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors ml-2 py-1 px-2 rounded-lg bg-primary/10 hover:bg-primary/20"
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            {expanded ? 'Hide' : 'Show'} {activeChildren.length} related{' '}
            {activeChildren.length === 1 ? 'draft' : 'drafts'}
          </Button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pl-4 ml-2 border-l-2 border-primary/20 space-y-3 overflow-hidden"
              >
                {activeChildren.map((child, idx) => (
                  <DocumentCard
                    key={child.referenceId}
                    item={child}
                    onViewDetails={onViewDetails}
                    index={idx}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

export const DocumentCardGrid = ({
  items,
  onViewDetails,
  showHierarchicalAccordion = false,
}: DocumentCardGridProps) => {
  const displayRoots = useMemo(() => {
    if (!showHierarchicalAccordion) return items

    return items.filter((item) => {
      // Find if this item is a child of any other item currently in 'items'
      const isChild = items.some((potentialParent) =>
        potentialParent.children?.some((c) => c.referenceId === item.referenceId)
      )
      return !isChild
    })
  }, [items, showHierarchicalAccordion])

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic py-8 text-center">
        No documents found matching your filters.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <AnimatePresence mode="popLayout">
        {showHierarchicalAccordion
          ? displayRoots.map((root, i) => (
              <HierarchicalCardGroup
                key={root.referenceId}
                root={root}
                allItems={items}
                onViewDetails={onViewDetails}
                index={i}
              />
            ))
          : items.map((item, i) => (
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
