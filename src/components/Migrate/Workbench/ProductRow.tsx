// SPDX-License-Identifier: GPL-3.0-only
import { Plus, Check } from 'lucide-react'
import type { SoftwareItem } from '@/types/MigrateTypes'
import { Button } from '../../ui/button'
import { Pill } from './workbenchUi'
import { productFipsBadge, productPqcStatus } from './productStatus'

interface ProductRowProps {
  product: SoftwareItem
  chosen: boolean
  onChoose: () => void
}

/** A candidate replacement product in the contextual catalog. */
export function ProductRow({ product, chosen, onChoose }: ProductRowProps) {
  const pqc = productPqcStatus(product)
  const fips = productFipsBadge(product)

  return (
    <div
      className={`flex items-start justify-between gap-3 rounded-xl border p-3 transition-colors ${
        chosen ? 'border-status-success/40 bg-status-success/5' : 'border-border bg-card'
      }`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{product.softwareName}</span>
          {product.vendorId && (
            <span className="font-mono text-[11px] text-muted-foreground">{product.vendorId}</span>
          )}
          <Pill tone={pqc.tone}>{pqc.label}</Pill>
          {fips && <Pill tone={fips.tone}>{fips.label}</Pill>}
          {product.wip && <Pill tone="warning">WIP</Pill>}
        </div>
        <p className="mt-1 font-mono text-[11px] text-muted-foreground">{product.categoryName}</p>
      </div>
      <Button
        variant={chosen ? 'secondary' : 'outline'}
        size="sm"
        className="shrink-0"
        onClick={onChoose}
        aria-label={
          chosen ? `Remove ${product.softwareName} from plan` : `Choose ${product.softwareName}`
        }
      >
        {chosen ? (
          <>
            <Check size={14} /> In plan
          </>
        ) : (
          <>
            <Plus size={14} /> Choose
          </>
        )}
      </Button>
    </div>
  )
}
