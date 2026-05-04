// SPDX-License-Identifier: GPL-3.0-only
import { AnimatePresence } from 'framer-motion'
import type { ThreatItem } from '../../data/threatsData'
import { ThreatCard } from './ThreatCard'
import { EmptyState } from '../ui/empty-state'
import { ShieldAlert } from 'lucide-react'
import { getIndustryIcon } from './threatsHelper'

interface ThreatsCardGridProps {
  items: ThreatItem[]
  onItemClick: (item: ThreatItem) => void
  relevantIndustries?: Set<string>
}

function industrySlug(industry: string) {
  return industry.toLowerCase().replace(/[^a-z0-9]+/g, '-')
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

  const groups: [string, ThreatItem[]][] = []
  const seen = new Map<string, ThreatItem[]>()
  for (const item of items) {
    if (!seen.has(item.industry)) {
      seen.set(item.industry, [])
      groups.push([item.industry, seen.get(item.industry)!])
    }
    seen.get(item.industry)!.push(item)
  }

  return (
    <div className="space-y-8">
      {groups.map(([industry, groupItems], gi) => (
        <section key={industry} id={`industry-${industrySlug(industry)}`}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-muted-foreground">{getIndustryIcon(industry, 16)}</span>
            <h3 className="text-sm font-semibold text-foreground">{industry}</h3>
            <span className="text-xs text-muted-foreground">({groupItems.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {groupItems.map((item, i) => (
                <ThreatCard
                  key={item.threatId}
                  item={item}
                  index={gi * 100 + i}
                  onClick={onItemClick}
                  dimmed={relevantIndustries != null && !relevantIndustries.has(item.industry)}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>
      ))}
    </div>
  )
}
