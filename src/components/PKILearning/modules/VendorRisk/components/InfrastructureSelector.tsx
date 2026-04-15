// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, ExternalLink, Trash2, CheckCircle, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'
import { softwareData } from '@/data/migrateData'
import { LAYERS } from '@/components/Migrate/InfrastructureStack'
import type { SoftwareItem } from '@/types/MigrateTypes'

/** Resolve product keys to SoftwareItem objects, grouped by infrastructure layer */
function resolveSelections(keys: string[]): Map<string, SoftwareItem[]> {
  const keySet = new Set(keys)
  const lookup = new Map<string, SoftwareItem>()
  for (const item of softwareData) {
    const key = item.productId
    if (keySet.has(key)) {
      lookup.set(key, item)
    }
  }

  const grouped = new Map<string, SoftwareItem[]>()
  for (const key of keys) {
    const item = lookup.get(key)
    if (!item) continue
    const layers = item.infrastructureLayer.split(',').map((l) => l.trim())
    for (const layerId of layers) {
      const list = grouped.get(layerId) ?? []
      list.push(item)
      grouped.set(layerId, list)
    }
  }
  return grouped
}

function renderFipsBadge(status: string) {
  const lower = (status || '').toLowerCase()
  const isFipsCertified = lower.includes('fips 140') || lower.includes('fips 203')
  const isPartial = !isFipsCertified && lower.startsWith('yes')

  if (isFipsCertified) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-status-success text-status-success">
        <CheckCircle size={9} /> FIPS
      </span>
    )
  }
  if (isPartial) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-status-warning text-status-warning">
        <ShieldAlert size={9} /> Partial
      </span>
    )
  }
  return null
}

function renderPqcBadge(support: string) {
  const lower = (support || '').toLowerCase()
  let badgeClass: string
  if (lower.startsWith('yes')) {
    badgeClass = 'bg-status-success text-status-success'
  } else if (lower.startsWith('partial') || lower.startsWith('limited')) {
    badgeClass = 'bg-status-warning text-status-warning'
  } else if (lower.startsWith('planned') || lower.startsWith('in progress')) {
    badgeClass = 'bg-primary/10 text-primary border-primary/20'
  } else {
    badgeClass = 'bg-destructive/10 text-destructive border-destructive/20'
  }
  return (
    <span
      className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full border ${badgeClass}`}
    >
      {support || 'Unknown'}
    </span>
  )
}

export const InfrastructureSelector: React.FC = () => {
  const navigate = useNavigate()
  const { myProducts, clearMyProducts, toggleMyProduct } = useMigrateSelectionStore()

  const groupedByLayer = useMemo(() => resolveSelections(myProducts), [myProducts])

  // Count unique layers
  const layerCount = groupedByLayer.size

  // Ordered layers matching LAYERS constant order
  const orderedLayers = useMemo(
    () => LAYERS.filter((l) => groupedByLayer.has(l.id)),
    [groupedByLayer]
  )

  if (myProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="p-4 rounded-full bg-muted/50 border border-border">
          <Package size={32} className="text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">
          No infrastructure products selected
        </h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Visit the Migrate catalog to select the products that make up your infrastructure. Your
          selections will persist and be used to personalize the Vendor Scorecard and Supply Chain
          Matrix.
        </p>
        <Button variant="gradient" onClick={() => navigate('/migrate')}>
          <ExternalLink size={16} className="mr-2" />
          Go to Migrate Catalog
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground font-semibold">{myProducts.length}</span> product
          {myProducts.length !== 1 ? 's' : ''} selected across{' '}
          <span className="text-foreground font-semibold">{layerCount}</span> infrastructure layer
          {layerCount !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/migrate')}>
            <ExternalLink size={14} className="mr-1.5" />
            Edit in Migrate
          </Button>
          <Button variant="ghost" size="sm" onClick={() => clearMyProducts()}>
            <Trash2 size={14} className="mr-1.5" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Grouped product list */}
      <div className="space-y-4">
        {orderedLayers.map((layer) => {
          const items = groupedByLayer.get(layer.id) ?? []
          const Icon = layer.icon
          return (
            <div key={layer.id} className="glass-panel p-4">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`p-2 rounded-lg bg-muted/20 border ${layer.borderColor} ${layer.iconColor}`}
                >
                  <Icon size={18} />
                </div>
                <h3 className="font-semibold text-foreground">{layer.label}</h3>
                <span className="text-xs text-muted-foreground">
                  {items.length} product{items.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="space-y-1">
                {items.map((item) => {
                  const key = item.productId
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-2 py-1.5 px-2 rounded hover:bg-muted/30 transition-colors group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm text-foreground truncate">
                          {item.softwareName}
                        </span>
                        {renderPqcBadge(item.pqcSupport)}
                        {renderFipsBadge(item.fipsValidated)}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                        onClick={() => toggleMyProduct(key)}
                      >
                        Remove
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
