// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable react-refresh/only-export-components */
import { Scale, Briefcase, Building2, Lightbulb, Landmark, Trophy } from 'lucide-react'
import clsx from 'clsx'
import { Button } from '@/components/ui/button'

export const LEADER_CATEGORIES = [
  'Standards',
  'Industry Vendor',
  'Industry Adopter',
  'Algorithm Inventor',
  'Government',
] as const

export type LeaderCategory = (typeof LEADER_CATEGORIES)[number]

interface CategoryInfo {
  name: string
  count: number
  hasUpdates: boolean
}

interface LeaderCategorySidebarProps {
  categories: CategoryInfo[]
  active: string
  onSelect: (category: string) => void
  totalCount: number
  totalHasUpdates: boolean
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Standards: <Scale size={18} aria-hidden="true" />,
  'Industry Vendor': <Briefcase size={18} aria-hidden="true" />,
  'Industry Adopter': <Building2 size={18} aria-hidden="true" />,
  'Algorithm Inventor': <Lightbulb size={18} aria-hidden="true" />,
  Government: <Landmark size={18} aria-hidden="true" />,
}

export const LeaderCategorySidebar = ({
  categories,
  active,
  onSelect,
  totalCount,
  totalHasUpdates,
}: LeaderCategorySidebarProps) => {
  return (
    <nav className="hidden md:flex flex-wrap items-center gap-2" aria-label="Leader categories">
      <Button
        variant="ghost"
        onClick={() => onSelect('All')}
        className={clsx(
          'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
          active === 'All'
            ? 'bg-primary/10 text-primary border border-primary/30'
            : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground border border-transparent'
        )}
        aria-current={active === 'All' ? 'page' : undefined}
      >
        <Trophy size={16} aria-hidden="true" />
        <span>All</span>
        <span className="text-xs bg-muted/50 px-1.5 py-0.5 rounded-full">{totalCount}</span>
        {totalHasUpdates && (
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
        )}
      </Button>

      {categories.map((cat) => (
        <Button
          variant="ghost"
          key={cat.name}
          onClick={() => onSelect(cat.name)}
          className={clsx(
            'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
            active === cat.name
              ? 'bg-primary/10 text-primary border border-primary/30'
              : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground border border-transparent'
          )}
          aria-current={active === cat.name ? 'page' : undefined}
        >
          {CATEGORY_ICONS[cat.name] ?? <Trophy size={16} aria-hidden="true" />}
          <span className="truncate">{cat.name}</span>
          <span className="text-xs bg-muted/50 px-1.5 py-0.5 rounded-full">{cat.count}</span>
          {cat.hasUpdates && (
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
          )}
        </Button>
      ))}
    </nav>
  )
}
