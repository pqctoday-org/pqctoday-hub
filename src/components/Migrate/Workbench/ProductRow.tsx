// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { Plus, Check, ChevronDown } from 'lucide-react'
import type { SoftwareItem } from '@/types/MigrateTypes'
import { Button } from '../../ui/button'
import { Pill } from './workbenchUi'
import { productFipsBadge, productPqcStatus, productVerificationBadge } from './productStatus'
import { ProductDetail } from './ProductDetail'

interface ProductRowProps {
  product: SoftwareItem
  /** When omitted (e.g. vendor-roadmap context) the Choose button is hidden. */
  chosen?: boolean
  onChoose?: () => void
}

/** A candidate replacement product. Expands to the full detail (roadmap, certs,
 *  proof, evidence) — same data as the existing /migrate table. */
export function ProductRow({ product, chosen, onChoose }: ProductRowProps) {
  const [expanded, setExpanded] = useState(false)
  const pqc = productPqcStatus(product)
  const fips = productFipsBadge(product)
  const verification = productVerificationBadge(product)

  return (
    <div
      className={`overflow-hidden rounded-xl border transition-colors ${
        chosen ? 'border-status-success/40 bg-status-success/5' : 'border-border bg-card'
      }`}
    >
      <div className="flex items-start justify-between gap-3 p-3">
        <div
          role="button"
          tabIndex={0}
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} details for ${product.softwareName}`}
          onClick={() => setExpanded((v) => !v)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setExpanded((v) => !v)
            }
          }}
          className="min-w-0 flex-1 cursor-pointer"
        >
          <div className="flex flex-wrap items-center gap-2">
            <ChevronDown
              size={14}
              className={`shrink-0 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
              aria-hidden
            />
            <span className="text-sm font-semibold text-foreground">{product.softwareName}</span>
            {product.vendorId && (
              <span className="font-mono text-[11px] text-muted-foreground">
                {product.vendorId}
              </span>
            )}
            <Pill tone={pqc.tone}>{pqc.label}</Pill>
            {fips && <Pill tone={fips.tone}>{fips.label}</Pill>}
            <Pill tone={verification.tone}>{verification.label}</Pill>
            {product.wip && <Pill tone="warning">WIP</Pill>}
          </div>
          <p className="mt-1 pl-6 font-mono text-[11px] text-muted-foreground">
            {product.categoryName}
          </p>
        </div>
        {onChoose && (
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
        )}
      </div>

      {expanded && <ProductDetail product={product} />}
    </div>
  )
}
