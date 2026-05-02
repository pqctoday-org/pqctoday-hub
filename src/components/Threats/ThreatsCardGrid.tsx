// SPDX-License-Identifier: GPL-3.0-only
import { AnimatePresence } from 'framer-motion'
import type { ThreatItem } from '../../data/threatsData'
import { ThreatCard } from './ThreatCard'
import { EmptyState } from '../ui/empty-state'
import { ShieldAlert } from 'lucide-react'

interface ThreatsCardGridProps {
  items: ThreatItem[]
  onItemClick: (item: ThreatItem) => void
  relevantIndustries?: Set<string>
}

export const ThreatsCardGrid = ({
  items,
  onItemClick,
  relevantIndustries,
}: ThreatsCardGridProps) => {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ShieldAlert size={32} />}
        title="No threats match the constraints."
        description="Try adjusting your filters or search."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <AnimatePresence mode="popLayout">
        {items.map((item, i) => (
          <ThreatCard
            key={item.threatId}
            item={item}
            index={i}
            onClick={onItemClick}
            dimmed={relevantIndustries != null && !relevantIndustries.has(item.industry)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
