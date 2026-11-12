// SPDX-License-Identifier: AGPL-3.0-only
import type { HistoricalProductRecord } from '@/data/migrateData'

/** Lifecycle context, separate from current availability and dataset delta badges. */
export function HistoricalProductNotice({ record }: { record: HistoricalProductRecord }) {
  const urls = record.reason.match(/https?:\/\/[^\s]+/g) ?? []
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">Historical record — not a current deployment option</p>
      <p className="text-sm break-words">{record.reason}</p>
      {urls.map((url) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block break-all text-sm text-primary underline"
        >
          Upstream lifecycle source
        </a>
      ))}
      {record.deprecatedAt && (
        <p className="text-xs">Catalogue retirement date: {record.deprecatedAt}</p>
      )}
      {record.product.latestVersion && (
        <p className="text-xs">Historical version recorded: {record.product.latestVersion}</p>
      )}
      {record.product.lastVerifiedDate && (
        <p className="text-xs">Evidence fetched: {record.product.lastVerifiedDate}</p>
      )}
      {record.product.productBrief && <p className="text-sm">{record.product.productBrief}</p>}
    </div>
  )
}
