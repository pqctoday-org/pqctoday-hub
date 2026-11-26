// SPDX-License-Identifier: AGPL-3.0-only
import type { HistoricalProductRecord } from '@/data/migrateData'
import { ProductDetail } from './ProductDetail'
import { HistoricalProductNotice } from '@/components/ui/HistoricalProductNotice'

/** Same-record evidence only; never an inventory choice or current availability claim. */
export function HistoricalProductDetail({ record }: { record: HistoricalProductRecord }) {
  return (
    <section
      aria-label="Historical product record"
      className="bg-card border-2 border-ink rounded-3xl shadow-[0_6px_0_hsl(var(--edge))] p-3"
    >
      <h2 className="text-base font-bold font-display text-heading">
        {record.product.softwareName}
      </h2>
      <HistoricalProductNotice record={record} />
      <ProductDetail product={record.product} readOnly />
    </section>
  )
}
