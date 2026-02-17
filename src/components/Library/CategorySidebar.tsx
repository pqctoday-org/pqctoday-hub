import { PenTool, Key, ShieldCheck, Network, BookOpen, Library } from 'lucide-react'
import type { LibraryCategory } from '../../data/libraryData'
import clsx from 'clsx'

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
  'General Recommendations': <BookOpen size={18} aria-hidden="true" />,
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
      className="hidden lg:flex flex-col w-56 shrink-0 glass-panel p-2 self-start sticky top-4"
      aria-label="Library categories"
    >
      <button
        onClick={() => onSelect('All')}
        className={clsx(
          'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left',
          active === 'All'
            ? 'bg-primary/10 text-primary border border-primary/30'
            : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground border border-transparent'
        )}
        aria-current={active === 'All' ? 'page' : undefined}
      >
        <Library size={18} aria-hidden="true" />
        <span className="flex-1">All</span>
        <span className="text-xs bg-muted/50 px-1.5 py-0.5 rounded-full">{totalCount}</span>
        {totalHasUpdates && (
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
        )}
      </button>

      <div className="h-px bg-border my-1" />

      {categories.map((cat) => (
        <button
          key={cat.name}
          onClick={() => onSelect(cat.name)}
          className={clsx(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left',
            active === cat.name
              ? 'bg-primary/10 text-primary border border-primary/30'
              : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground border border-transparent'
          )}
          aria-current={active === cat.name ? 'page' : undefined}
        >
          {CATEGORY_ICONS[cat.name as LibraryCategory] ?? <BookOpen size={18} aria-hidden="true" />}
          <span className="flex-1 truncate">{cat.name}</span>
          <span className="text-xs bg-muted/50 px-1.5 py-0.5 rounded-full">{cat.count}</span>
          {cat.hasUpdates && (
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
          )}
        </button>
      ))}
    </nav>
  )
}
