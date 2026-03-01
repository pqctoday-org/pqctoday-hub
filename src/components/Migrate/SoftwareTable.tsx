// SPDX-License-Identifier: GPL-3.0-only
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
  ShieldAlert,
  EyeOff,
  Award,
} from 'lucide-react'
import { LAYERS } from './InfrastructureStack'
import { certsByProduct } from '../../data/certificationXrefData'
import { AskAssistantButton } from '../ui/AskAssistantButton'

interface SoftwareTableProps {
  data: SoftwareItem[]
  defaultSort?: { key: SortKey; direction: SortDirection }
  hiddenProducts?: Set<string>
  onHideProduct?: (key: string) => void
}

type SortDirection = 'asc' | 'desc' | null
type SortKey = keyof SoftwareItem

export const SoftwareTable: React.FC<SoftwareTableProps> = ({
  data,
  defaultSort,
  hiddenProducts,
  onHideProduct,
}) => {
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

  // Helper to render FIPS badge (three-tier)
  const renderFipsStatus = (status: string) => {
    const lower = (status || '').toLowerCase()
    const isFipsCertified = lower.includes('fips 140') || lower.includes('fips 203')
    const isPartial = !isFipsCertified && lower.startsWith('yes')

    if (isFipsCertified) {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-status-success text-status-success">
          <CheckCircle size={10} /> Validated
        </span>
      )
    }
    if (isPartial) {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-status-warning text-status-warning">
          <ShieldAlert size={10} /> Partial
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground border border-border">
        <span className="w-2 h-2 rounded-full bg-muted-foreground/50" /> No
      </span>
    )
  }

  // Helper to render PQC Support badge with level-specific colors
  const renderPqcSupport = (support: string) => {
    const lower = (support || '').toLowerCase()
    let badgeClass: string
    if (lower.startsWith('yes')) {
      badgeClass = 'bg-status-success text-status-success'
    } else if (lower.startsWith('limited')) {
      badgeClass = 'bg-status-warning text-status-warning'
    } else if (lower.startsWith('planned')) {
      badgeClass = 'bg-primary/10 text-primary border-primary/20'
    } else if (lower.startsWith('no')) {
      badgeClass = 'bg-destructive/10 text-destructive border-destructive/20'
    } else {
      badgeClass = 'bg-muted/50 text-muted-foreground border-border'
    }
    return (
      <span
        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${badgeClass}`}
      >
        {support || 'Unknown'}
      </span>
    )
  }

  const headers: { key: SortKey; label: string; mobileHidden?: boolean }[] = [
    { key: 'softwareName', label: 'Product' },
    { key: 'infrastructureLayer', label: 'Layer' },
    { key: 'categoryName', label: 'Category', mobileHidden: true },
    { key: 'pqcSupport', label: 'PQC Support' },
    { key: 'license', label: 'License', mobileHidden: true },
    { key: 'fipsValidated', label: 'FIPS' },
  ]

  const visibleData = useMemo(
    () =>
      hiddenProducts ? sortedData.filter((item) => !hiddenProducts.has(rowKey(item))) : sortedData,
    [sortedData, hiddenProducts]
  )

  const totalCols = 8 // hide + expand + 6 data columns

  return (
    <div className="glass-panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              <th className="p-4 w-8"></th> {/* Hide toggle */}
              <th className="p-4 w-10"></th> {/* Expand toggle */}
              {headers.map((header) => (
                <th
                  key={header.key}
                  className={`p-4 font-semibold text-sm cursor-pointer hover:text-primary transition-colors${header.mobileHidden ? ' hidden md:table-cell' : ''}`}
                  onClick={() => handleSort(header.key)}
                  aria-sort={
                    sortConfig.key === header.key
                      ? sortConfig.direction === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
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
            {visibleData.map((item) => {
              const key = rowKey(item)
              const isExpanded = expandedIds.has(key)
              return (
                <React.Fragment key={key}>
                  <tr
                    className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => toggleExpand(key)}
                  >
                    <td className="p-2 w-8">
                      {onHideProduct && (
                        <button
                          type="button"
                          aria-label="Hide this product"
                          onClick={(e) => {
                            e.stopPropagation()
                            onHideProduct(key)
                          }}
                          className="p-1 rounded text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <EyeOff size={14} />
                        </button>
                      )}
                    </td>
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
                                    ? 'bg-primary/10 text-primary border-primary/20'
                                    : 'bg-status-warning/10 text-status-warning border-status-warning/20'
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
                    <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">
                      {item.categoryName}
                    </td>
                    <td className="p-4 text-sm">{renderPqcSupport(item.pqcSupport)}</td>
                    <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">
                      {item.license}
                    </td>
                    <td className="p-4 text-sm">{renderFipsStatus(item.fipsValidated)}</td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-muted/10 border-b border-border">
                      <td colSpan={totalCols} className="p-0">
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
                              <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] gap-2">
                                <span className="text-muted-foreground">Platforms:</span>
                                <span className="text-foreground">{item.primaryPlatforms}</span>
                              </div>
                              <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] gap-2">
                                <span className="text-muted-foreground">Industries:</span>
                                <span className="text-foreground">{item.targetIndustries}</span>
                              </div>
                              <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] gap-2">
                                <span className="text-muted-foreground">Migration Priority:</span>
                                <span
                                  className={`font-medium ${
                                    item.pqcMigrationPriority === 'Critical'
                                      ? 'text-status-error'
                                      : item.pqcMigrationPriority === 'High'
                                        ? 'text-status-warning'
                                        : item.pqcMigrationPriority === 'Medium'
                                          ? 'text-primary'
                                          : 'text-muted-foreground'
                                  }`}
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

                            {(() => {
                              const certs = certsByProduct.get(item.softwareName)
                              if (!certs || certs.length === 0) return null
                              return (
                                <div>
                                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                                    <Award size={14} /> PQC Certifications
                                  </h4>
                                  <div className="space-y-2">
                                    {certs.map((cert) => {
                                      const badgeClass =
                                        cert.certType === 'FIPS 140-3'
                                          ? 'bg-status-success text-status-success'
                                          : cert.certType === 'ACVP'
                                            ? 'bg-primary/10 text-primary border-primary/20'
                                            : 'bg-status-warning text-status-warning'
                                      const levelShort =
                                        cert.certificationLevel
                                          ?.split(',')[0]
                                          ?.replace('FIPS 140-3 ', '')
                                          ?.trim() || ''
                                      return (
                                        <a
                                          key={cert.certId}
                                          href={cert.certLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-2 text-xs group hover:bg-muted/30 rounded-md p-1.5 -mx-1.5 transition-colors"
                                        >
                                          <span
                                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border whitespace-nowrap ${badgeClass}`}
                                          >
                                            {cert.certType === 'Common Criteria'
                                              ? 'CC'
                                              : cert.certType}
                                          </span>
                                          <span className="text-muted-foreground truncate">
                                            {cert.certProduct.length > 40
                                              ? cert.certProduct.slice(0, 40) + '...'
                                              : cert.certProduct}
                                          </span>
                                          {cert.pqcAlgorithms &&
                                            !cert.pqcAlgorithms.startsWith('Potentially') && (
                                              <span className="text-foreground font-medium whitespace-nowrap">
                                                {cert.pqcAlgorithms}
                                              </span>
                                            )}
                                          {levelShort && (
                                            <span className="text-muted-foreground whitespace-nowrap">
                                              {levelShort}
                                            </span>
                                          )}
                                          <ExternalLink
                                            size={10}
                                            className="text-muted-foreground/50 group-hover:text-primary shrink-0"
                                          />
                                        </a>
                                      )
                                    })}
                                  </div>
                                </div>
                              )
                            })()}

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
                              <AskAssistantButton
                                variant="text"
                                label="Ask about PQC capabilities"
                                question={`What PQC algorithms does ${item.softwareName} support${item.categoryName ? ` (${item.categoryName})` : ''}?${item.pqcCapabilityDescription ? ` Capabilities: ${item.pqcCapabilityDescription}` : ''}${item.fipsValidated && item.fipsValidated !== 'No' ? ` FIPS status: ${item.fipsValidated}.` : ''}`}
                              />
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
