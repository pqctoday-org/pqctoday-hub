// SPDX-License-Identifier: GPL-3.0-only
/**
 * The "Open-source maintainers" list on a product (desktop product detail and phone product sheet).
 *
 * Both views load it with React.lazy and never import it statically. It reads the Community roster
 * with a dynamic import(), and the build wraps every chunk that holds an import() so that its code
 * finishes running a moment after the chunk loads; a chunk that reads such a chunk's exports while
 * it starts up, without waiting for it, sees them undefined. Imported statically by both views,
 * this module's import() ended up in the large shared chunk that also holds the product-status
 * helpers, and the Migration Workbench chunk (no import() of its own, so not wrapped and not
 * waiting) ran its start-up sort before those helpers existed: /migrate never finished loading.
 * Loaded lazily, the import() sits in this module's own chunk and each view holds one lazy import
 * of it, which makes the build wrap the view's chunk too, so it waits for what it imports.
 *
 * scripts/ci/check-tla-eager-imports.ts fails the build if any chunk reads another chunk's exports
 * at start-up before that chunk is ready, so this cannot come back unnoticed.
 */
import { Link } from 'react-router'
import { Users } from 'lucide-react'
import type { SoftwareItem } from '@/types/MigrateTypes'
import { leaderProfileHref, maintainerLinksFor, useLeadersRoster } from './maintainerLeaders'

type Variant = 'desktop' | 'phone'

interface Style {
  heading: string
  list: string
  item: string
  link: string
  icon: number
}

const DESKTOP: Style = {
  heading: 'mb-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground',
  list: 'flex flex-wrap gap-x-3 gap-y-1',
  item: 'text-foreground/80',
  link: 'inline-flex items-center gap-1 text-primary hover:underline',
  icon: 11,
}

const PHONE: Style = {
  heading: 'mb-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground',
  list: 'flex flex-wrap gap-x-3 gap-y-1.5 text-[13px] text-foreground/90',
  item: '',
  link: 'inline-flex min-h-[32px] items-center gap-1 font-semibold text-primary hover:underline',
  icon: 12,
}

export default function ProductMaintainers({
  product,
  variant,
}: {
  product: SoftwareItem
  variant: Variant
}) {
  // A maintainer with a Community profile links to it; the rest (organisations, people not on the
  // roster) stay plain text. The roster loads on demand.
  const maintainers = maintainerLinksFor(product, useLeadersRoster(true))
  if (maintainers.length === 0) return null
  const style = variant === 'phone' ? PHONE : DESKTOP
  return (
    <div data-testid="product-maintainers">
      <p className={style.heading}>Open-source maintainers</p>
      <ul className={style.list}>
        {maintainers.map((m, i) => (
          <li key={`${m.name}-${i}`} className={style.item || undefined}>
            {m.leader ? (
              <Link
                to={leaderProfileHref(m.leader)}
                title={variant === 'desktop' ? `${m.leader.name} — Community profile` : undefined}
                className={style.link}
              >
                <Users size={style.icon} aria-hidden="true" />
                {m.name}
              </Link>
            ) : (
              m.name
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
