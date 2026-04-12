// SPDX-License-Identifier: GPL-3.0-only
import {
  PenTool,
  Key,
  ShieldCheck,
  Network,
  Library,
  Landmark,
  Award,
  Globe,
  Compass,
  FlaskConical,
  Briefcase,
  BookOpen,
} from 'lucide-react'
import type { LibraryCategory } from '../../data/libraryData'
import clsx from 'clsx'
import { Button } from '@/components/ui/button'

interface CategoryInfo {
  name: string
  count: number
  hasUpdates: boolean
}

interface CategorySidebarProps {
  categories: CategoryInfo[]
  active: string
  onSelect: (category: string) => void
  totalCount: number
  totalHasUpdates: boolean
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Digital Signature': <PenTool size={18} aria-hidden="true" />,
  KEM: <Key size={18} aria-hidden="true" />,
  'PKI Certificate Management': <ShieldCheck size={18} aria-hidden="true" />,
  Protocols: <Network size={18} aria-hidden="true" />,
  'Government & Policy': <Landmark size={18} aria-hidden="true" />,
  'NIST Standards': <Award size={18} aria-hidden="true" />,
  'International Frameworks': <Globe size={18} aria-hidden="true" />,
  'Migration Guidance': <Compass size={18} aria-hidden="true" />,
  'Algorithm Specifications': <FlaskConical size={18} aria-hidden="true" />,
  'Industry & Research': <Briefcase size={18} aria-hidden="true" />,
}

export const CATEGORY_ICON_MAP = CATEGORY_ICONS

export const CategorySidebar = ({
  categories,
  active,
  onSelect,
  totalCount,
  totalHasUpdates,
}: CategorySidebarProps) => {
  return (
    <nav
      className="flex flex-nowrap lg:flex-wrap items-center gap-2 overflow-x-auto lg:overflow-visible [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-2 lg:pb-0"
      aria-label="Library categories"
    >
      <Button
        variant="ghost"
        onClick={() => onSelect('All')}
        className={clsx(
          'flex items-center shrink-0 gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
          active === 'All'
            ? 'bg-primary/10 text-primary border border-primary/30'
            : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground border border-transparent'
        )}
        aria-current={active === 'All' ? 'page' : undefined}
      >
        <Library size={16} aria-hidden="true" />
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
            'flex items-center shrink-0 gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
            active === cat.name
              ? 'bg-primary/10 text-primary border border-primary/30'
              : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground border border-transparent'
          )}
          aria-current={active === cat.name ? 'page' : undefined}
        >
          {CATEGORY_ICONS[cat.name as LibraryCategory] ?? <BookOpen size={16} aria-hidden="true" />}
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
