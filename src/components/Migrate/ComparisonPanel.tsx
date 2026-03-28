// SPDX-License-Identifier: GPL-3.0-only
import { X } from 'lucide-react'
import { Button } from '../ui/button'
import type { SoftwareItem } from '../../types/MigrateTypes'

const COMPARISON_FIELDS: { key: keyof SoftwareItem; label: string }[] = [
  { key: 'pqcSupport', label: 'PQC Support' },
  { key: 'fipsValidated', label: 'FIPS Validated' },
  { key: 'licenseType', label: 'License' },
  { key: 'pqcMigrationPriority', label: 'Migration Priority' },
  { key: 'primaryPlatforms', label: 'Platforms' },
  { key: 'pqcCapabilityDescription', label: 'PQC Capability' },
  { key: 'latestVersion', label: 'Latest Version' },
]

interface ComparisonPanelProps {
  products: SoftwareItem[]
  onClose: () => void
}

export const ComparisonPanel = ({ products, onClose }: ComparisonPanelProps) => {
  if (products.length < 2) return null

  return (
    <div className="glass-panel p-4 md:p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">
          Comparing {products.length} Products
        </h3>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
          <X size={14} />
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider w-40">
                Attribute
              </th>
              {products.map((p) => (
                <th
                  key={p.softwareName}
                  className="text-left px-3 py-2 text-xs font-semibold text-foreground"
                >
                  {p.softwareName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_FIELDS.map((field) => (
              <tr key={field.key} className="border-b border-border/50 hover:bg-muted/30">
                <td className="px-3 py-2 text-xs font-medium text-muted-foreground whitespace-nowrap">
                  {field.label}
                </td>
                {products.map((p) => {
                  const value = String(p[field.key] ?? '—')
                  const isTruncated = value.length > 120
                  return (
                    <td
                      key={p.softwareName}
                      className="px-3 py-2 text-xs text-foreground"
                      title={isTruncated ? value : undefined}
                    >
                      {isTruncated ? `${value.substring(0, 120)}…` : value}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
