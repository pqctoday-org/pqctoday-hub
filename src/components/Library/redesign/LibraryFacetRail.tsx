// SPDX-License-Identifier: GPL-3.0-only
/**
 * LibraryFacetRail — the quiet left rail (228px) of the redesign. Three stacked
 * cards: Quick views, Categories (with persona-preferred emphasis), and
 * Lifecycle status. Replaces the live CategorySidebar, now also carrying the
 * quick views and lifecycle that used to be chips/radiogroups in the control row.
 */
import { Bookmark, Sparkles, ShieldCheck, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LIFECYCLE_FILTER_OPTIONS } from '@/utils/documentStatusBucket'

export type LibraryQuickView = 'all' | 'new' | 'cert' | 'bookmarked'

interface LibraryFacetRailProps {
  quickView: LibraryQuickView
  onQuickView: (q: LibraryQuickView) => void
  categoryInfo: { name: string; count: number; hasUpdates: boolean }[]
  activeCategory: string
  onCategory: (c: string) => void
  personaPreferredCategories: string[]
  lifecycleBucket: string
  onLifecycle: (b: string) => void
  counts: { all: number; new: number; cert: number; bookmarked: number }
}

const QUICK_VIEWS: { id: LibraryQuickView; label: string; icon: typeof Bookmark }[] = [
  { id: 'all', label: 'All documents', icon: Layers },
  { id: 'new', label: 'New & updated', icon: Sparkles },
  { id: 'cert', label: 'Cert-relevant', icon: ShieldCheck },
  { id: 'bookmarked', label: 'Bookmarked', icon: Bookmark },
]

const ROW_BASE =
  'flex h-auto min-h-[44px] md:min-h-0 w-full items-center justify-start gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] font-normal transition-colors'

function RailCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="glass-panel rounded-xl p-2.5">
      <div className="mb-2 px-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  )
}

function CountPill({ n, active }: { n: number; active: boolean }) {
  return (
    <span
      className={`ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[11px] ${
        active ? 'bg-primary/20 text-primary' : 'bg-muted/60 text-muted-foreground'
      }`}
    >
      {n}
    </span>
  )
}

export function LibraryFacetRail({
  quickView,
  onQuickView,
  categoryInfo,
  activeCategory,
  onCategory,
  personaPreferredCategories,
  lifecycleBucket,
  onLifecycle,
  counts,
}: LibraryFacetRailProps) {
  return (
    <div className="flex w-full flex-col gap-3 lg:w-[228px] lg:shrink-0">
      {/* Quick views */}
      <RailCard label="Quick views">
        {QUICK_VIEWS.map(({ id, label, icon: Icon }) => {
          const active = quickView === id
          // eslint-disable-next-line security/detect-object-injection
          const n = counts[id]
          return (
            <Button
              key={id}
              type="button"
              variant="ghost"
              onClick={() => onQuickView(id)}
              aria-pressed={active}
              className={`${ROW_BASE} ${
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
              }`}
            >
              <Icon size={14} aria-hidden="true" className="shrink-0" />
              <span className="truncate">{label}</span>
              <CountPill n={n} active={active} />
            </Button>
          )
        })}
      </RailCard>

      {/* Categories */}
      <RailCard label="Categories">
        <Button
          type="button"
          variant="ghost"
          onClick={() => onCategory('All')}
          aria-pressed={activeCategory === 'All'}
          className={`${ROW_BASE} ${
            activeCategory === 'All'
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
          }`}
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground" aria-hidden="true" />
          <span className="truncate">All categories</span>
        </Button>
        {categoryInfo.map((cat) => {
          const active = activeCategory === cat.name
          const preferred =
            activeCategory === 'All' && personaPreferredCategories.includes(cat.name)
          return (
            <Button
              key={cat.name}
              type="button"
              variant="ghost"
              onClick={() => onCategory(cat.name)}
              aria-pressed={active}
              className={`${ROW_BASE} ${
                active
                  ? 'bg-primary/10 text-primary'
                  : preferred
                    ? 'bg-secondary/10 text-foreground hover:bg-secondary/15'
                    : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
              }`}
              title={preferred ? 'Emphasized for your role' : undefined}
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  active ? 'bg-primary' : preferred ? 'bg-secondary' : 'bg-muted-foreground/60'
                }`}
                aria-hidden="true"
              />
              <span className="truncate">{cat.name}</span>
              <CountPill n={cat.count} active={active} />
            </Button>
          )
        })}
      </RailCard>

      {/* Lifecycle status */}
      <RailCard label="Lifecycle status">
        <div className="flex flex-wrap gap-1">
          {LIFECYCLE_FILTER_OPTIONS.map((opt) => {
            const active = lifecycleBucket === opt.id
            return (
              <Button
                key={opt.id}
                type="button"
                variant="ghost"
                onClick={() => onLifecycle(opt.id)}
                aria-pressed={active}
                className={`h-auto min-h-[44px] md:min-h-0 rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors ${
                  active
                    ? 'bg-primary/15 text-primary'
                    : 'bg-muted/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt.label}
              </Button>
            )
          })}
        </div>
      </RailCard>
    </div>
  )
}
