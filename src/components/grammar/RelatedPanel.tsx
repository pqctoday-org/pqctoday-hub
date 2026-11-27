// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Part I: the related panel (UX grammar v2.1, section 3.4, I6). Inside a page tab or a record
 * viewer it is a list with type chips grouped in TAB_ORDER, never a nested tab bar (X10). The
 * Assistant keeps its own ResourceTabBar + ResourceStepper over the same grouping.
 */
import { cn } from '@/lib/utils'
import { TAB_ORDER, recordTypeInfo, type ResourceTabKey } from '@/data/recordTypes'
import { Chip } from './Chip'
import { EmptyState } from './FixedLines'
import { RoleButton } from './RoleButton'
import { verbLabel } from './verbs'

export interface RelatedItem {
  tag: string
  title: string
  /** The record's `type`: it decides the group (recordTypes[type].tab) and the type chip. */
  type: string
  /** The reviewed relation phrase, already filled in. Without an approved phrase the chip shows and no sentence (D12). */
  phrase?: string
}

export interface RelatedPanelProps {
  items: RelatedItem[]
  onOpen: (tag: string) => void
  /** Shown as the section heading; defaults to "Related". */
  title?: string
  className?: string
}

/** Groups items by tab in TAB_ORDER; an item whose type is not in the table goes to "more". */
export function groupRelated(
  items: RelatedItem[]
): { tab: ResourceTabKey; items: RelatedItem[] }[] {
  const byTab = new Map<ResourceTabKey, RelatedItem[]>()
  for (const it of items) {
    const tab = recordTypeInfo(it.type)?.tab ?? 'more'
    byTab.set(tab, [...(byTab.get(tab) ?? []), it])
  }
  return TAB_ORDER.filter((t) => byTab.has(t)).map((tab) => ({ tab, items: byTab.get(tab)! }))
}

export function RelatedPanel({ items, onOpen, title = 'Related', className }: RelatedPanelProps) {
  const groups = groupRelated(items)
  return (
    <section data-page-part="I" aria-label={title} className={cn('flex flex-col gap-3', className)}>
      <h3 className="type-block-title">{title}</h3>
      {groups.length === 0 ? (
        <EmptyState thing="linked records" reason="not-recorded" />
      ) : (
        groups.map((g) => (
          <ul key={g.tab} data-related-tab={g.tab} className="flex flex-col gap-1">
            {g.items.map((it) => (
              <li key={it.tag} className="flex flex-wrap items-center gap-2">
                <Chip family="category" word={recordTypeInfo(it.type)?.type ?? it.type} />
                <RoleButton emphasis="quiet" dense onClick={() => onOpen(it.tag)}>
                  {it.title}
                </RoleButton>
                {it.phrase && <span className="type-small text-muted-foreground">{it.phrase}</span>}
                <span className="sr-only">{verbLabel('open')}</span>
              </li>
            ))}
          </ul>
        ))
      )}
    </section>
  )
}
