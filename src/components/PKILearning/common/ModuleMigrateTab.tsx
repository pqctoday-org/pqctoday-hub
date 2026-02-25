import { ExternalLink, Package, CheckCircle, ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getMigrateItemsForModule } from '@/data/migrateData'
import { LAYERS } from '@/components/Migrate/InfrastructureStack'
import type { SoftwareItem } from '@/types/MigrateTypes'

interface ModuleMigrateTabProps {
  moduleId: string
}

function renderPqcBadge(support: string) {
  const lower = (support || '').toLowerCase()
  let badgeClass: string
  let label: string
  if (lower.startsWith('yes')) {
    badgeClass = 'bg-status-success text-status-success'
    label = 'PQC'
  } else if (lower.startsWith('limited') || lower.startsWith('planned')) {
    badgeClass = 'bg-status-warning text-status-warning'
    label = lower.startsWith('planned') ? 'Planned' : 'Limited'
  } else {
    badgeClass = 'bg-muted/50 text-muted-foreground'
    label = 'No PQC'
  }
  return (
    <span className={`inline-flex items-center text-xs px-1.5 py-0.5 rounded-full ${badgeClass}`}>
      {label}
    </span>
  )
}

function renderFipsBadge(status: string) {
  const lower = (status || '').toLowerCase()
  const isFipsCertified = lower.includes('fips 140') || lower.includes('fips 203')
  const isPartial = !isFipsCertified && lower.startsWith('yes')

  if (isFipsCertified) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full bg-status-success text-status-success">
        <CheckCircle size={10} /> FIPS
      </span>
    )
  }
  if (isPartial) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full bg-status-warning text-status-warning">
        <ShieldAlert size={10} /> FIPS Partial
      </span>
    )
  }
  return null
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

export function ModuleMigrateTab({ moduleId }: ModuleMigrateTabProps) {
  const items = getMigrateItemsForModule(moduleId)

  if (items.length === 0) {
    return (
      <div className="glass-panel p-8 text-center">
        <Package size={32} className="mx-auto mb-3 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">No tools or products found for this module.</p>
      </div>
    )
  }

  const layerGroups = groupByLayer(items)

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        PQC-ready tools and products relevant to this module. All items are also available in the{' '}
        <Link to="/migrate" className="text-primary hover:underline">
          Migrate Catalog
        </Link>
        .
      </p>

      {layerGroups.map(({ layerId, label, icon: Icon, products }) => (
        <div key={layerId}>
          <div className="flex items-center gap-2 mb-3">
            <Icon size={18} className="text-primary" />
            <h3 className="text-sm font-semibold text-foreground">{label}</h3>
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
              {products.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {products.map((product) => (
              <div key={`${layerId}-${product.softwareName}`} className="glass-panel p-4">
                <div className="flex items-start justify-between gap-2 mb-1.5">
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
                  <div className="flex items-center gap-1 shrink-0">
                    {renderPqcBadge(product.pqcSupport)}
                    {renderFipsBadge(product.fipsValidated)}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {product.productBrief}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-xs px-1.5 py-0.5 rounded border border-border text-muted-foreground bg-muted/30">
                    {product.licenseType}
                  </span>
                  <Link
                    to={`/migrate?layer=${encodeURIComponent(layerId)}`}
                    className="text-xs text-primary hover:underline"
                  >
                    View in Migrate &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
