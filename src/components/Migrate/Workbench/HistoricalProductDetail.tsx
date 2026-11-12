// SPDX-License-Identifier: AGPL-3.0-only
import type { HistoricalProductRecord } from '@/data/migrateData'
import { ProductDetail } from './ProductDetail'
import { HistoricalProductNotice } from '@/components/ui/HistoricalProductNotice'

/** Same-record evidence only; never an inventory choice or current availability claim. */
export function HistoricalProductDetail({ record }: { record: HistoricalProductRecord }) {
  return (
    <section
      aria-label="Historical product record"
      className="rounded-xl border border-border bg-card p-3"
    >
      <h2 className="text-base font-bold">{record.product.softwareName}</h2>
      <HistoricalProductNotice record={record} />
      <ProductDetail product={record.product} readOnly />
    </section>
  )
}
