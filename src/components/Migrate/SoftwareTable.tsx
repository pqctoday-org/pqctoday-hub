import React, { useState, useMemo } from 'react'
import type { SoftwareItem } from '../../types/MigrateTypes'
import {
  ChevronRight,
  ChevronDown,
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Info,
  CheckCircle,
} from 'lucide-react'
import { LAYERS } from './InfrastructureStack'

interface SoftwareTableProps {
  data: SoftwareItem[]
  defaultSort?: { key: SortKey; direction: SortDirection }
}

type SortDirection = 'asc' | 'desc' | null
type SortKey = keyof SoftwareItem

export const SoftwareTable: React.FC<SoftwareTableProps> = ({ data, defaultSort }) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>(
    defaultSort || { key: 'softwareName', direction: 'asc' }
  )

  const rowKey = (item: SoftwareItem) => `${item.softwareName}::${item.categoryId}`

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedIds(newExpanded)
  }

  const handleSort = (key: SortKey) => {
    let direction: SortDirection = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const sortedData = useMemo(() => {
    if (!sortConfig.direction) return data

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key] || ''
      const bValue = b[sortConfig.key] || ''

      const aString = String(aValue).toLowerCase()
      const bString = String(bValue).toLowerCase()

      return sortConfig.direction === 'asc'
        ? aString.localeCompare(bString)
        : bString.localeCompare(aString)
    })
  }, [data, sortConfig])

  // Helper to render FIPS badge
  const renderFipsStatus = (status: string) => {
    if (status && status.toLowerCase().includes('yes')) {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
          <CheckCircle size={10} /> Validated
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground border border-border">
        <span className="w-2 h-2 rounded-full bg-muted-foreground/50" /> No/Unknown
      </span>
    )
  }

  // Helper to render PQC Support badge
  const renderPqcSupport = (support: string) => {
    const isYes = support && support.toLowerCase().startsWith('yes')
    return (
      <span
        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
          isYes
            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
            : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
        }`}
      >
        {support}
      </span>
    )
  }

  const headers: { key: SortKey; label: string }[] = [
    { key: 'softwareName', label: 'Product' },
    { key: 'infrastructureLayer', label: 'Layer' },
    { key: 'categoryName', label: 'Category' },
    { key: 'pqcSupport', label: 'PQC Support' },
    { key: 'license', label: 'License' },
    { key: 'fipsValidated', label: 'FIPS' },
  ]

  return (
    <div className="glass-panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              <th className="p-4 w-10"></th> {/* Expand toggle */}
              {headers.map((header) => (
                <th
                  key={header.key}
                  className="p-4 font-semibold text-sm cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort(header.key)}
                >
                  <div className="flex items-center gap-1">
                    {header.label}
                    {sortConfig.key === header.key ? (
                      sortConfig.direction === 'asc' ? (
                        <ArrowUp size={14} />
                      ) : (
                        <ArrowDown size={14} />
                      )
                    ) : (
                      <ArrowUpDown size={14} className="text-muted-foreground/50" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item) => {
              const key = rowKey(item)
              const isExpanded = expandedIds.has(key)
              return (
                <React.Fragment key={key}>
                  <tr
                    className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => toggleExpand(key)}
                  >
                    <td className="p-4">
                      {isExpanded ? (
                        <ChevronDown size={16} className="text-muted-foreground" />
                      ) : (
                        <ChevronRight size={16} className="text-muted-foreground" />
                      )}
                    </td>
                    <td className="p-4 font-medium text-foreground">
                      <div className="flex items-center gap-3">
                        {(() => {
                          const layerIds = item.infrastructureLayer.split(',').map((l) => l.trim())
                          const layer = LAYERS.find((l) => layerIds.includes(l.id))
                          if (!layer) return null
                          const Icon = layer.icon
                          return (
                            <div
                              className={`p-1.5 rounded-md bg-muted/20 border ${layer.borderColor} ${layer.iconColor}`}
                              title={layerIds
                                .map((id) => LAYERS.find((l) => l.id === id)?.label ?? id)
                                .join(', ')}
                            >
                              <Icon size={16} />
                            </div>
                          )
                        })()}
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span>{item.softwareName}</span>
                            {item.status && (
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold border ${
                                  item.status === 'New'
                                    ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                    : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                }`}
                              >
                                {item.status}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {item.latestVersion}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {item.infrastructureLayer
                        .split(',')
                        .map((id) => id.trim())
                        .map((id) => LAYERS.find((l) => l.id === id)?.label ?? id)
                        .join(', ')}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{item.categoryName}</td>
                    <td className="p-4 text-sm">{renderPqcSupport(item.pqcSupport)}</td>
                    <td className="p-4 text-sm text-muted-foreground">{item.license}</td>
                    <td className="p-4 text-sm">{renderFipsStatus(item.fipsValidated)}</td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-muted/10 border-b border-border">
                      <td colSpan={7} className="p-0">
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                          <div>
                            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                              <Info size={14} /> Description
                            </h4>
                            <p className="text-muted-foreground mb-4">
                              {item.pqcCapabilityDescription}
                            </p>

                            <h4 className="font-semibold text-foreground mb-2">
                              Capability Details
                            </h4>
                            <div className="space-y-2">
                              <div className="grid grid-cols-[120px_1fr] gap-2">
                                <span className="text-muted-foreground">Platforms:</span>
                                <span className="text-foreground">{item.primaryPlatforms}</span>
                              </div>
                              <div className="grid grid-cols-[120px_1fr] gap-2">
                                <span className="text-muted-foreground">Industries:</span>
                                <span className="text-foreground">{item.targetIndustries}</span>
                              </div>
                              <div className="grid grid-cols-[120px_1fr] gap-2">
                                <span className="text-muted-foreground">Migration Priority:</span>
                                <span
                                  className={`font-medium ${item.pqcMigrationPriority === 'Critical' ? 'text-red-400' : 'text-foreground'}`}
                                >
                                  {item.pqcMigrationPriority}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold text-foreground mb-2">Metadata</h4>
                              <div className="space-y-1 text-muted-foreground">
                                <p>
                                  Released:{' '}
                                  <span className="text-foreground">{item.releaseDate}</span>
                                </p>
                                <p>
                                  Last Verified:{' '}
                                  <span className="text-foreground">{item.lastVerifiedDate}</span>
                                </p>
                                <p>Source Type: {item.sourceType}</p>
                              </div>
                            </div>

                            <div className="pt-2 flex flex-col gap-2">
                              {item.repositoryUrl && (
                                <a
                                  href={item.repositoryUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                                >
                                  <ExternalLink size={14} /> Repository / Download
                                </a>
                              )}
                              {item.authoritativeSource && (
                                <a
                                  href={item.authoritativeSource}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-xs"
                                >
                                  <ExternalLink size={12} /> Authoritative Source
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
