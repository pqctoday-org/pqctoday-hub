// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { CheckCircle, XCircle, Clock, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react'
import {
  VENDOR_MIGRATION_DATA,
  PQC_STATUS_LABELS,
  SUPPORT_STATUS_LABELS,
  FEATURE_FILTERS,
  type PQCStatusKey,
  type SupportStatusKey,
} from '../data/networkProviderData'
import { FilterDropdown } from '@/components/common/FilterDropdown'

function StatusIcon({ status }: { status: PQCStatusKey }) {
  if (status === 'ga') return <CheckCircle size={12} className="text-status-success inline" />
  if (status === 'beta') return <Clock size={12} className="text-primary inline" />
  if (status === 'roadmap')
    return <AlertTriangle size={12} className="text-status-warning inline" />
  return <XCircle size={12} className="text-status-error inline" />
}

function SupportStatusIcon({ status }: { status: SupportStatusKey }) {
  if (status === 'supported')
    return <CheckCircle size={12} className="text-status-success inline" />
  if (status === 'partial') return <Clock size={12} className="text-primary inline" />
  if (status === 'roadmap')
    return <AlertTriangle size={12} className="text-status-warning inline" />
  return <XCircle size={12} className="text-status-error inline" />
}

export const VendorMigrationMatrix: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filterItems = FEATURE_FILTERS.map((f) => ({ id: f.id, label: f.label }))

  const filteredVendors = useMemo(() => {
    if (selectedFilter === 'all') return VENDOR_MIGRATION_DATA

    return VENDOR_MIGRATION_DATA.filter((v) => {
      switch (selectedFilter) {
        case 'tls-inspection':
          return v.tlsInspectionPQC === 'supported' || v.tlsInspectionPQC === 'partial'
        case 'ml-kem':
          return v.mlKemStatus === 'ga' || v.mlKemStatus === 'beta'
        case 'ml-dsa':
          return v.mlDsaStatus === 'ga' || v.mlDsaStatus === 'beta'
        case 'hardware-offload':
          return v.hardwareOffload
        case 'ga':
          return v.pqcStatus === 'ga'
        case 'enterprise':
          return v.tier === 'enterprise'
        default:
          return true
      }
    })
  }, [selectedFilter])

  const readinessBreakdown = useMemo(() => {
    const ga = VENDOR_MIGRATION_DATA.filter((v) => v.pqcStatus === 'ga').length
    const beta = VENDOR_MIGRATION_DATA.filter((v) => v.pqcStatus === 'beta').length
    const roadmap = VENDOR_MIGRATION_DATA.filter((v) => v.pqcStatus === 'roadmap').length
    return { ga, beta, roadmap, total: VENDOR_MIGRATION_DATA.length }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Vendor Migration Matrix</h3>
        <p className="text-sm text-muted-foreground">
          Compare PQC migration readiness across major NGFW vendors. Filter by feature to identify
          which platforms support your requirements today.
        </p>
      </div>

      {/* Readiness Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-panel p-4 text-center">
          <div className="text-2xl font-bold text-status-success">{readinessBreakdown.ga}</div>
          <div className="text-[10px] text-muted-foreground">GA Support</div>
        </div>
        <div className="glass-panel p-4 text-center">
          <div className="text-2xl font-bold text-primary">{readinessBreakdown.beta}</div>
          <div className="text-[10px] text-muted-foreground">Beta / Preview</div>
        </div>
        <div className="glass-panel p-4 text-center">
          <div className="text-2xl font-bold text-status-warning">{readinessBreakdown.roadmap}</div>
          <div className="text-[10px] text-muted-foreground">On Roadmap</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-muted-foreground shrink-0">Filter by:</span>
        <FilterDropdown
          items={filterItems}
          selectedId={selectedFilter}
          onSelect={setSelectedFilter}
          defaultLabel="All Vendors"
          noContainer
        />
        <span className="text-xs text-muted-foreground">
          Showing {filteredVendors.length} of {VENDOR_MIGRATION_DATA.length} vendors
        </span>
      </div>

      {/* Desktop Table */}
      <div className="glass-panel overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr className="border-b border-border">
                <th className="text-left py-3 px-3 text-muted-foreground font-medium">
                  Vendor / Product
                </th>
                <th className="text-center py-3 px-2 text-muted-foreground font-medium">
                  PQC Status
                </th>
                <th className="text-center py-3 px-2 text-muted-foreground font-medium">
                  TLS Inspect
                </th>
                <th className="text-center py-3 px-2 text-muted-foreground font-medium">ML-KEM</th>
                <th className="text-center py-3 px-2 text-muted-foreground font-medium">ML-DSA</th>
                <th className="text-center py-3 px-2 text-muted-foreground font-medium">
                  HW Offload
                </th>
                <th className="text-center py-3 px-2 text-muted-foreground font-medium">Roadmap</th>
                <th className="text-center py-3 px-2 text-muted-foreground font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredVendors.map((vendor) => {
                const pqcLabel = PQC_STATUS_LABELS[vendor.pqcStatus as PQCStatusKey]
                const isExpanded = expandedId === vendor.id
                return (
                  <React.Fragment key={vendor.id}>
                    <tr
                      className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${isExpanded ? 'bg-muted/20' : ''}`}
                    >
                      <td className="py-3 px-3">
                        <div className="font-bold text-foreground">{vendor.vendor}</div>
                        <div className="text-[10px] text-muted-foreground">{vendor.product}</div>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${
                            vendor.tier === 'enterprise'
                              ? 'bg-primary/10 text-primary border-primary/30'
                              : vendor.tier === 'mid-market'
                                ? 'bg-secondary/10 text-secondary border-secondary/30'
                                : 'bg-muted/50 text-muted-foreground border-border'
                          }`}
                        >
                          {vendor.tier}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${pqcLabel.className}`}
                        >
                          {pqcLabel.label}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <SupportStatusIcon status={vendor.tlsInspectionPQC as SupportStatusKey} />
                        <div className="text-[9px] text-muted-foreground mt-0.5">
                          {SUPPORT_STATUS_LABELS[vendor.tlsInspectionPQC as SupportStatusKey].label}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <StatusIcon status={vendor.mlKemStatus as PQCStatusKey} />
                        <div className="text-[9px] text-muted-foreground mt-0.5">
                          {PQC_STATUS_LABELS[vendor.mlKemStatus as PQCStatusKey].label}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <StatusIcon status={vendor.mlDsaStatus as PQCStatusKey} />
                        <div className="text-[9px] text-muted-foreground mt-0.5">
                          {PQC_STATUS_LABELS[vendor.mlDsaStatus as PQCStatusKey].label}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        {vendor.hardwareOffload ? (
                          <CheckCircle size={12} className="text-status-success inline" />
                        ) : (
                          <XCircle size={12} className="text-muted-foreground inline" />
                        )}
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-muted-foreground">
                        {vendor.roadmapYear}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : vendor.id)}
                          className="text-muted-foreground hover:text-primary transition-colors"
                          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${vendor.vendor} details`}
                        >
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-muted/10">
                        <td colSpan={8} className="px-4 py-3 border-b border-border">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs font-bold text-foreground mb-1">
                                Upgrade Requirements
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {vendor.upgradeDetails}
                              </p>
                            </div>
                            <div>
                              <div className="text-xs font-bold text-foreground mb-1">
                                Implementation Notes
                              </div>
                              <p className="text-xs text-muted-foreground">{vendor.notes}</p>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center gap-4 text-[10px] text-muted-foreground">
                            <span>
                              Cert size limit:{' '}
                              <strong className="text-foreground">{vendor.certSizeLimit}</strong>
                            </span>
                            <span>
                              FIPS:{' '}
                              <strong
                                className={
                                  vendor.fipsCompliant ? 'text-status-success' : 'text-status-error'
                                }
                              >
                                {vendor.fipsCompliant ? 'Compliant' : 'Not certified'}
                              </strong>
                            </span>
                            <span>
                              Hybrid mode:{' '}
                              <strong
                                className={
                                  vendor.hybridMode ? 'text-status-success' : 'text-status-error'
                                }
                              >
                                {vendor.hybridMode ? 'Supported' : 'Not supported'}
                              </strong>
                            </span>
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

      {/* Mobile Cards */}
      <div className="space-y-3 md:hidden">
        {filteredVendors.map((vendor) => {
          const pqcLabel = PQC_STATUS_LABELS[vendor.pqcStatus as PQCStatusKey]
          const isExpanded = expandedId === vendor.id
          return (
            <div key={vendor.id} className="glass-panel p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="text-sm font-bold text-foreground">{vendor.vendor}</div>
                  <div className="text-[10px] text-muted-foreground">{vendor.product}</div>
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded border font-bold shrink-0 ${pqcLabel.className}`}
                >
                  {pqcLabel.label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] mb-3">
                <div className="flex items-center gap-1">
                  <SupportStatusIcon status={vendor.tlsInspectionPQC as SupportStatusKey} />
                  <span className="text-muted-foreground">TLS Inspect</span>
                </div>
                <div className="flex items-center gap-1">
                  <StatusIcon status={vendor.mlKemStatus as PQCStatusKey} />
                  <span className="text-muted-foreground">ML-KEM</span>
                </div>
                <div className="flex items-center gap-1">
                  <StatusIcon status={vendor.mlDsaStatus as PQCStatusKey} />
                  <span className="text-muted-foreground">ML-DSA</span>
                </div>
                <div className="flex items-center gap-1">
                  {vendor.hardwareOffload ? (
                    <CheckCircle size={12} className="text-status-success" />
                  ) : (
                    <XCircle size={12} className="text-muted-foreground" />
                  )}
                  <span className="text-muted-foreground">HW Offload</span>
                </div>
              </div>
              <button
                onClick={() => setExpandedId(isExpanded ? null : vendor.id)}
                className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
              >
                {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                {isExpanded ? 'Hide details' : 'Show details'}
              </button>
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-border space-y-2">
                  <p className="text-[10px] text-muted-foreground">{vendor.notes}</p>
                  <p className="text-[10px] text-muted-foreground">
                    <strong>Cert size limit:</strong> {vendor.certSizeLimit}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filteredVendors.length === 0 && (
        <div className="glass-panel p-8 text-center">
          <p className="text-muted-foreground text-sm">
            No vendors match the selected filter. Try a different filter criterion.
          </p>
        </div>
      )}
    </div>
  )
}
