// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo, useCallback } from 'react'
import { ChevronDown, ChevronUp, ArrowUpDown, Server, Cloud, Filter, Shield } from 'lucide-react'
import { HSM_VENDORS, STATUS_LABELS, type HSMVendor } from '../data/hsmVendorData'

type FilterType = 'all' | 'on-prem' | 'cloud'
type FilterStatus = 'all' | HSMVendor['pqcSupportStatus']
type SortKey = 'maturity' | 'name' | 'type'

export const VendorComparison: React.FC = () => {
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [sortKey, setSortKey] = useState<SortKey>('maturity')
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null)

  const filteredVendors = useMemo(() => {
    let vendors = [...HSM_VENDORS]

    if (filterType !== 'all') {
      vendors = vendors.filter((v) => v.type === filterType)
    }
    if (filterStatus !== 'all') {
      vendors = vendors.filter((v) => v.pqcSupportStatus === filterStatus)
    }

    vendors.sort((a, b) => {
      switch (sortKey) {
        case 'maturity':
          return b.pqcMaturityScore - a.pqcMaturityScore
        case 'name':
          return a.name.localeCompare(b.name)
        case 'type':
          return a.type.localeCompare(b.type)
        default:
          return 0
      }
    })

    return vendors
  }, [filterType, filterStatus, sortKey])

  const stats = useMemo(() => {
    const total = filteredVendors.length
    const productionReady = filteredVendors.filter(
      (v) => v.pqcSupportStatus === 'production'
    ).length
    const avgMaturity =
      total > 0
        ? Math.round(filteredVendors.reduce((sum, v) => sum + v.pqcMaturityScore, 0) / total)
        : 0
    return { total, productionReady, avgMaturity }
  }, [filteredVendors])

  const toggleExpand = useCallback((vendorId: string) => {
    setExpandedVendor((prev) => (prev === vendorId ? null : vendorId))
  }, [])

  const getMaturityColor = (score: number): string => {
    if (score >= 80) return 'bg-success'
    if (score >= 50) return 'bg-warning'
    return 'bg-destructive'
  }

  const getMaturityTextColor = (score: number): string => {
    if (score >= 80) return 'text-success'
    if (score >= 50) return 'text-warning'
    return 'text-destructive'
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">HSM Vendor Comparison Matrix</h3>
        <p className="text-sm text-muted-foreground">
          Compare 8 HSM vendors by PQC maturity, algorithm support, and FIPS validation status.
          Click a row to expand vendor details.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-panel p-3 text-center">
          <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          <div className="text-xs text-muted-foreground">Total Vendors</div>
        </div>
        <div className="glass-panel p-3 text-center">
          <div className="text-2xl font-bold text-success">{stats.productionReady}</div>
          <div className="text-xs text-muted-foreground">Production Ready</div>
        </div>
        <div className="glass-panel p-3 text-center">
          <div className={`text-2xl font-bold ${getMaturityTextColor(stats.avgMaturity)}`}>
            {stats.avgMaturity}
          </div>
          <div className="text-xs text-muted-foreground">Avg Maturity Score</div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-panel p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Filters:</span>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Type:</span>
            {(['all', 'on-prem', 'cloud'] as FilterType[]).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  filterType === type
                    ? 'bg-primary/20 text-primary border border-primary/50'
                    : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
                }`}
              >
                {type === 'all' ? 'All' : type === 'on-prem' ? 'On-Prem' : 'Cloud'}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Status:</span>
            {(['all', 'production', 'beta', 'limited', 'roadmap'] as FilterStatus[]).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    filterStatus === status
                      ? 'bg-primary/20 text-primary border border-primary/50'
                      : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
                  }`}
                >
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              )
            )}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1">
            <ArrowUpDown size={12} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Sort:</span>
            {(['maturity', 'name', 'type'] as SortKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setSortKey(key)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  sortKey === key
                    ? 'bg-primary/20 text-primary border border-primary/50'
                    : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
                }`}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vendor Table */}
      <div className="space-y-2">
        {filteredVendors.map((vendor) => {
          const statusInfo = STATUS_LABELS[vendor.pqcSupportStatus]
          const isExpanded = expandedVendor === vendor.id

          return (
            <div key={vendor.id} className="glass-panel overflow-hidden">
              {/* Main Row */}
              <button
                onClick={() => toggleExpand(vendor.id)}
                className="w-full text-left p-4 flex items-center gap-4"
              >
                {/* Vendor Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-foreground">{vendor.name}</span>
                    <span className="text-xs text-muted-foreground">{vendor.product}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Type Badge */}
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        vendor.type === 'on-prem'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-secondary/10 text-secondary'
                      }`}
                    >
                      {vendor.type === 'on-prem' ? (
                        <>
                          <Server size={8} className="inline mr-0.5" />
                          on-prem
                        </>
                      ) : (
                        <>
                          <Cloud size={8} className="inline mr-0.5" />
                          cloud
                        </>
                      )}
                    </span>
                    {/* Status Badge */}
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded border font-bold ${statusInfo.className}`}
                    >
                      {statusInfo.label}
                    </span>
                    {/* FIPS Level */}
                    <span className="text-[10px] text-muted-foreground">{vendor.fips140Level}</span>
                  </div>
                </div>

                {/* Maturity Score */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-24 hidden sm:block">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] text-muted-foreground">Maturity</span>
                      <span
                        className={`text-xs font-bold ${getMaturityTextColor(vendor.pqcMaturityScore)}`}
                      >
                        {vendor.pqcMaturityScore}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className={`rounded-full h-1.5 transition-all duration-300 ${getMaturityColor(vendor.pqcMaturityScore)}`}
                        style={{ width: `${vendor.pqcMaturityScore}%` }}
                      />
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp size={16} className="text-muted-foreground" />
                  ) : (
                    <ChevronDown size={16} className="text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border pt-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <h5 className="font-bold text-foreground mb-2">Specifications</h5>
                      <div className="space-y-1">
                        <div>
                          <span className="text-muted-foreground">Firmware:</span>{' '}
                          <span className="font-mono text-foreground">
                            {vendor.firmwareVersion}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">PKCS#11 Version:</span>{' '}
                          <span className="font-mono text-foreground">{vendor.pkcs11Version}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Form Factor:</span>{' '}
                          <span className="text-foreground">{vendor.formFactor}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Hybrid Support:</span>{' '}
                          {vendor.hybridSupport ? (
                            <span className="text-success font-bold">Yes</span>
                          ) : (
                            <span className="text-destructive font-bold">No</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-bold text-foreground mb-2">PQC Algorithms</h5>
                      <div className="flex flex-wrap gap-1">
                        {vendor.supportedPQCAlgorithms.map((alg) => (
                          <span
                            key={alg}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono"
                          >
                            {alg}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="font-bold text-foreground mb-2">
                        <Shield size={12} className="inline mr-1" />
                        Side-Channel Countermeasures
                      </h5>
                      <ul className="space-y-0.5">
                        {vendor.sideChannelCountermeasures.map((cm) => (
                          <li key={cm} className="text-muted-foreground">
                            &bull; {cm}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-bold text-foreground mb-2">Notes</h5>
                      <p className="text-muted-foreground">{vendor.notes}</p>
                    </div>
                  </div>

                  {/* Maturity Score Bar (visible in expanded on mobile) */}
                  <div className="mt-4 sm:hidden">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">PQC Maturity Score</span>
                      <span
                        className={`text-sm font-bold ${getMaturityTextColor(vendor.pqcMaturityScore)}`}
                      >
                        {vendor.pqcMaturityScore} / 100
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`rounded-full h-2 transition-all duration-300 ${getMaturityColor(vendor.pqcMaturityScore)}`}
                        style={{ width: `${vendor.pqcMaturityScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {filteredVendors.length === 0 && (
          <div className="glass-panel p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No vendors match the current filters. Try adjusting type or status filters.
            </p>
          </div>
        )}
      </div>

      {/* Educational Disclaimer */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Note:</strong> Maturity scores are based on publicly available information
          including algorithm support, FIPS validation status, firmware availability, and hybrid key
          support. Scores are approximate and intended for educational comparison only. Always
          verify vendor capabilities directly for procurement decisions.
        </p>
      </div>
    </div>
  )
}
