// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { Building2, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { FIRMWARE_VENDORS, VENDOR_STATUS_LABELS } from '../data/secureBootProviderData'
import type { VendorTier, FirmwareVendorStatus } from '../data/secureBootProviderData'
import { VendorCoverageNotice } from '@/components/PKILearning/common/VendorCoverageNotice'
import { Button } from '@/components/ui/button'

const TIER_LABELS: Record<VendorTier, string> = {
  enterprise: 'Enterprise',
  smb: 'SMB',
  'open-source': 'Open Source',
}

const TIER_FILTER_ITEMS = [
  { id: 'enterprise', label: 'Enterprise' },
  { id: 'smb', label: 'SMB' },
  { id: 'open-source', label: 'Open Source' },
]

const STATUS_FILTER_ITEMS = [
  { id: 'available', label: 'Available' },
  { id: 'merged', label: 'Merged / GA' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'evaluation', label: 'Evaluation' },
  { id: 'not-started', label: 'Not Started' },
]

export const FirmwareVendorMatrix: React.FC = () => {
  const [selectedTier, setSelectedTier] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return FIRMWARE_VENDORS.filter((v) => {
      const tierMatch = selectedTier === 'All' || v.tier === selectedTier
      const statusMatch = selectedStatus === 'All' || v.pqcStatus === selectedStatus
      return tierMatch && statusMatch
    })
  }, [selectedTier, selectedStatus])

  const stats = useMemo(() => {
    const total = FIRMWARE_VENDORS.length
    const available = FIRMWARE_VENDORS.filter(
      (v) => v.pqcStatus === 'available' || v.pqcStatus === 'merged'
    ).length
    const roadmap = FIRMWARE_VENDORS.filter((v) => v.pqcStatus === 'roadmap').length
    const notStarted = FIRMWARE_VENDORS.filter((v) => v.pqcStatus === 'not-started').length
    return { total, available, roadmap, notStarted }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Firmware Vendor PQC Matrix</h3>
        <p className="text-sm text-muted-foreground">
          BIOS and firmware vendor PQC readiness. Filter by vendor tier or migration status to find
          products matching your infrastructure. Click any vendor for detailed migration guidance.
        </p>
      </div>
      <VendorCoverageNotice migrateLayer="Hardware" className="mb-2" />

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
          <div className="text-xl font-bold text-foreground">{stats.total}</div>
          <div className="text-[10px] text-muted-foreground">Vendors Tracked</div>
        </div>
        <div className="bg-status-success/5 rounded-lg p-3 border border-status-success/20 text-center">
          <div className="text-xl font-bold text-status-success">{stats.available}</div>
          <div className="text-[10px] text-muted-foreground">Available / GA</div>
        </div>
        <div className="bg-status-warning/5 rounded-lg p-3 border border-status-warning/20 text-center">
          <div className="text-xl font-bold text-status-warning">{stats.roadmap}</div>
          <div className="text-[10px] text-muted-foreground">On Roadmap</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
          <div className="text-xl font-bold text-muted-foreground">{stats.notStarted}</div>
          <div className="text-[10px] text-muted-foreground">Not Started</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <FilterDropdown
          label="Tier"
          items={TIER_FILTER_ITEMS}
          selectedId={selectedTier}
          onSelect={setSelectedTier}
          defaultLabel="All Tiers"
          noContainer
        />
        <FilterDropdown
          label="PQC Status"
          items={STATUS_FILTER_ITEMS}
          selectedId={selectedStatus}
          onSelect={setSelectedStatus}
          defaultLabel="All Statuses"
          noContainer
        />
        {(selectedTier !== 'All' || selectedStatus !== 'All') && (
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedTier('All')
              setSelectedStatus('All')
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          >
            Clear filters
          </Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} of {FIRMWARE_VENDORS.length} vendors
        </span>
      </div>

      {/* Vendor Table */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="glass-panel p-8 text-center text-muted-foreground">
            <Building2 size={32} className="mx-auto mb-2 opacity-30" aria-hidden="true" />
            <p className="text-sm">No vendors match the selected filters.</p>
          </div>
        ) : (
          filtered.map((vendor: FirmwareVendorStatus) => {
            const status = VENDOR_STATUS_LABELS[vendor.pqcStatus]
            const isExpanded = expandedVendor === vendor.id

            return (
              <div
                key={vendor.id}
                className="rounded-lg border border-border bg-muted/30 overflow-hidden"
              >
                <Button
                  variant="ghost"
                  onClick={() => setExpandedVendor(isExpanded ? null : vendor.id)}
                  className="flex items-start gap-3 w-full p-4 text-left"
                >
                  <div className="p-2 rounded-lg bg-primary/10 shrink-0 mt-0.5">
                    <Building2 size={16} className="text-primary" aria-hidden="true" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-bold text-foreground">{vendor.product}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border text-muted-foreground uppercase">
                        {vendor.vendor}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border font-bold ${status.className}`}
                      >
                        {status.label}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 border border-border text-muted-foreground">
                        {TIER_LABELS[vendor.tier]}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 text-[10px] text-muted-foreground">
                      <span>Category: {vendor.category}</span>
                      <span>Current: {vendor.currentAlgorithm}</span>
                      <span>Roadmap: {vendor.roadmapYear}</span>
                    </div>
                  </div>

                  {isExpanded ? (
                    <ChevronDown size={16} className="text-muted-foreground shrink-0 mt-1" />
                  ) : (
                    <ChevronRight size={16} className="text-muted-foreground shrink-0 mt-1" />
                  )}
                </Button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border/50 pt-4 space-y-4">
                    {/* Products */}
                    <div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
                        Affected Products
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {vendor.products.map((product) => (
                          <span
                            key={product}
                            className="text-[10px] px-2 py-0.5 rounded bg-muted border border-border text-foreground/80"
                          >
                            {product}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Algorithm transition */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-status-error/5 rounded-lg p-3 border border-status-error/20">
                        <div className="text-[10px] font-bold text-status-error mb-1">
                          Current Algorithm
                        </div>
                        <p className="text-xs text-foreground/80">{vendor.currentAlgorithm}</p>
                      </div>
                      <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                        <div className="text-[10px] font-bold text-primary mb-1">PQC Target</div>
                        <p className="text-xs text-foreground/80">{vendor.pqcAlgorithm}</p>
                      </div>
                    </div>

                    {/* Migration Guidance */}
                    <div className="bg-muted/50 rounded-lg p-4 border border-border">
                      <div className="text-xs font-bold text-foreground mb-2">Migration Path</div>
                      <p className="text-xs text-foreground/80 leading-relaxed">
                        {vendor.migrationGuidance}
                      </p>
                    </div>

                    {/* Notes */}
                    <div className="text-xs text-muted-foreground leading-relaxed">
                      {vendor.notes}
                    </div>

                    {/* Certifications */}
                    {vendor.certifications.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
                          Certifications
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {vendor.certifications.map((cert) => (
                            <span
                              key={cert}
                              className="text-[10px] px-2 py-0.5 rounded bg-status-success/10 border border-status-success/20 text-status-success"
                            >
                              {cert}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* External link placeholder */}
                    <div className="flex">
                      <span className="inline-flex items-center gap-1 text-xs text-primary">
                        <ExternalLink size={12} aria-hidden="true" />
                        Vendor PQC Roadmap (contact vendor)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
