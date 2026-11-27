// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { ExternalLink, Package } from 'lucide-react'
import { Link } from 'react-router'
import { getMigrateItemsForModule } from '@/data/migrateData'
import { LAYERS } from '@/data/infrastructureLayers'
import { CertBadges } from '@/components/Migrate/migrateHelpers'
import { getCertsForProduct } from '@/data/certificationXrefData'
import type { SoftwareItem } from '@/types/MigrateTypes'
import { EmptyState } from '@/components/ui/empty-state'
import { migrateProductHref } from '@/utils/migrateLinks'
import { FipsStatusBadge } from '@/components/common/FipsStatusBadge'
import { StoryRow } from '@/components/storybook'
import { Button } from '@/components/ui/button'
import { pqcSupportLevel, pqcSupportToneClass } from './pqcSupportLevel'

/** Rows shown before "Show more": the list grows 25 at a time. */
const PAGE_SIZE = 25

interface ModuleMigrateTabProps {
  moduleId: string
  /** Keeps only the products this returns true for (e.g. the products on the learner's path). */
  itemFilter?: (item: SoftwareItem) => boolean
}

/** The support chip: the level's word is always shown, colour only repeats it. */
function SupportChip({ pqcSupport }: { pqcSupport: string }) {
  const level = pqcSupportLevel(pqcSupport)
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-extrabold leading-none ${pqcSupportToneClass(level)}`}
    >
      {level}
    </span>
  )
}

interface LayerGroup {
  layerId: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  products: SoftwareItem[]
}

function groupByLayer(items: SoftwareItem[]): LayerGroup[] {
  const groups: LayerGroup[] = []

  for (const layer of LAYERS) {
    const products = items.filter((item) => {
      const layers = item.infrastructureLayer.split(',').map((l) => l.trim())
      return layers.includes(layer.id)
    })
    if (products.length > 0) {
      groups.push({
        layerId: layer.id,
        label: layer.label,
        icon: layer.icon,
        products,
      })
    }
  }

  return groups
}

export function ModuleMigrateTab({ moduleId, itemFilter }: ModuleMigrateTabProps) {
  const [shown, setShown] = useState(PAGE_SIZE)
  const all = getMigrateItemsForModule(moduleId)
  const items = itemFilter ? all.filter(itemFilter) : all

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Package size={32} />}
        title="No tools or products yet"
        description="No mapped tools or products for this module — the Playground has related hands-on tools."
      />
    )
  }

  const layerGroups = groupByLayer(items)
  // One row per product in each layer it sits in; the list grows 25 rows at a time, in layer order.
  const rowCount = layerGroups.reduce((sum, group) => sum + group.products.length, 0)
  const visibleGroups = layerGroups
    .map((group, index) => {
      const before = layerGroups
        .slice(0, index)
        .reduce((sum, earlier) => sum + earlier.products.length, 0)
      const room = Math.max(0, shown - before)
      return { ...group, total: group.products.length, products: group.products.slice(0, room) }
    })
    .filter((group) => group.products.length > 0)
  // A module can list products that are here for their certificates and carry no PQC support; the
  // header must not call those "PQC-ready".
  const hasProductWithoutPqc = items.some(
    (item) => !/^(yes|partial|limited|planned|in progress)/i.test(item.pqcSupport || '')
  )
  // The catalog link opens on exactly this module's products (?productIds=).
  const catalogHref = `/migrate?productIds=${[...new Set(items.map((i) => i.productId))]
    .map(encodeURIComponent)
    .join(',')}`

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {hasProductWithoutPqc
          ? 'Tools and products relevant to this module; each badge shows its PQC support.'
          : 'PQC-ready tools and products relevant to this module.'}{' '}
        All items are also available in the{' '}
        {/* `underline`, not `hover:underline`: this link sits inside a
            paragraph, so colour alone is not a sufficient affordance
            (axe link-in-text-block / WCAG 1.4.1). */}
        <Link to={catalogHref} className="text-primary underline">
          Migrate Catalog
        </Link>
        .
      </p>

      {visibleGroups.map(({ layerId, label, icon: Icon, total, products }) => (
        <div key={layerId}>
          <div className="flex items-center gap-2 mb-3">
            <Icon size={18} className="text-primary" />
            <h3 className="text-sm font-semibold text-foreground">{label}</h3>
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
              {total}
            </span>
          </div>

          <ul className="space-y-2">
            {products.map((product) => (
              <StoryRow as="li" key={`${layerId}-${product.softwareName}`} className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {product.repositoryUrl ? (
                      <a
                        href={product.repositoryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1 group truncate"
                      >
                        {product.softwareName}
                        <ExternalLink
                          size={11}
                          className="shrink-0 opacity-50 group-hover:opacity-100 transition-opacity"
                        />
                      </a>
                    ) : (
                      <span className="text-sm font-semibold text-foreground truncate">
                        {product.softwareName}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                    <SupportChip pqcSupport={product.pqcSupport} />
                    <FipsStatusBadge
                      fipsValidated={product.fipsValidated}
                      productId={product.productId}
                      softwareName={product.softwareName}
                      hideNegative
                    />
                    <CertBadges
                      certs={getCertsForProduct(product.productId, product.softwareName)}
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2">{product.productBrief}</p>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs px-1.5 py-0.5 rounded border border-border text-muted-foreground bg-muted/30">
                    {product.licenseType}
                  </span>
                  <Link
                    to={migrateProductHref(product.productId)}
                    className="text-xs text-primary-legible hover:underline"
                  >
                    Open in Migrate &rsaquo;
                  </Link>
                </div>
              </StoryRow>
            ))}
          </ul>
        </div>
      ))}

      {rowCount > shown && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground" role="status">
            Showing {Math.min(shown, rowCount)} of {rowCount}
          </p>
          <Button
            type="button"
            variant="outline"
            className="min-h-[44px]"
            onClick={() => setShown((n) => n + PAGE_SIZE)}
          >
            Show {Math.min(PAGE_SIZE, rowCount - shown)} more
          </Button>
        </div>
      )}
    </div>
  )
}
