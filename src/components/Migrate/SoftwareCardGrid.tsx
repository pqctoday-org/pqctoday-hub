// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import type { SoftwareItem } from '../../types/MigrateTypes'
import { SoftwareCard } from './SoftwareCard'
import { EmptyState } from '../ui/empty-state'

interface SoftwareCardGridProps {
  items: SoftwareItem[]
  hiddenProducts?: Set<string>
  onHideProduct?: (key: string) => void
  selectedProducts?: Set<string>
  onToggleProduct?: (key: string) => void
}

const rowKey = (item: SoftwareItem) => `${item.softwareName}::${item.categoryId}`

export const SoftwareCardGrid = ({
  items,
  hiddenProducts,
  onHideProduct,
  selectedProducts,
  onToggleProduct,
}: SoftwareCardGridProps) => {
  const visibleItems = useMemo(
    () => (hiddenProducts ? items.filter((item) => !hiddenProducts.has(rowKey(item))) : items),
    [items, hiddenProducts]
  )

  if (visibleItems.length === 0) {
    return <EmptyState title="No products match the current filters." />
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <AnimatePresence mode="popLayout">
        {visibleItems.map((item, i) => (
          <SoftwareCard
            key={rowKey(item)}
            item={item}
            index={i}
            onHide={onHideProduct}
            isSelected={selectedProducts?.has(rowKey(item))}
            onToggleSelect={onToggleProduct}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
