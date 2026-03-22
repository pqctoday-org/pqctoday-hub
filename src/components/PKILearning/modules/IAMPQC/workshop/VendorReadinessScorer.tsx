// SPDX-License-Identifier: GPL-3.0-only

import React, { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { VendorCoverageNotice } from '@/components/PKILearning/common/VendorCoverageNotice'
import { IAM_VENDORS, PQC_STATUS_LABELS, type IAMVendorStatus } from '../data/iamProviderData'

const VENDOR_OPTIONS = IAM_VENDORS.map((v) => ({ id: v.id, label: v.vendor + ' — ' + v.product }))

function VendorCard({ vendor }: { vendor: IAMVendorStatus }) {
  const status = PQC_STATUS_LABELS[vendor.pqcStatus]

  return (
    <div className="glass-panel p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-foreground">{vendor.vendor}</div>
          <div className="text-xs text-muted-foreground">{vendor.product}</div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border uppercase">
              {vendor.category}
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded border font-bold ${status.className}`}
            >
              {status.label}
            </span>
            {vendor.roadmapYear && (
              <span className="text-[10px] text-muted-foreground">
                Target: {vendor.roadmapYear}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Detail Panels */}
      <div className="space-y-2 pt-2 border-t border-border">
        <div className="bg-muted/50 rounded-lg p-3 border border-border">
          <div className="text-[10px] font-bold text-primary mb-1">Token Signing</div>
          <p className="text-[10px] text-muted-foreground">{vendor.tokenSigning}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 border border-border">
          <div className="text-[10px] font-bold text-secondary mb-1">MFA / Attestation</div>
          <p className="text-[10px] text-muted-foreground">{vendor.mfaPqc}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 border border-border">
          <div className="text-[10px] font-bold text-accent mb-1">API Security</div>
          <p className="text-[10px] text-muted-foreground">{vendor.apiSecurity}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 border border-border">
          <div className="text-[10px] font-bold text-muted-foreground mb-1">Notes</div>
          <p className="text-[10px] text-muted-foreground">{vendor.notes}</p>
        </div>
        {vendor.certifications.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {vendor.certifications.map((cert) => (
              <span
                key={cert}
                className="text-[9px] px-1.5 py-0.5 rounded bg-status-success/10 text-status-success border border-status-success/20"
              >
                {cert}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export const VendorReadinessScorer: React.FC = () => {
  const [selectedVendorId, setSelectedVendorId] = useState<string>(IAM_VENDORS[0].id)

  const selectedVendor =
    IAM_VENDORS.find((v) => v.id === selectedVendorId) ?? IAM_VENDORS[0]

  const handleExport = () => {
    const v = selectedVendor
    const status = PQC_STATUS_LABELS[v.pqcStatus]
    const lines = [
      `IAM PQC Vendor Status Report`,
      `Generated: ${new Date().toISOString().split('T')[0]}`,
      ``,
      `Vendor: ${v.vendor} — ${v.product}`,
      `Category: ${v.category}`,
      `PQC Status: ${status.label}`,
      v.roadmapYear ? `Target Year: ${v.roadmapYear}` : '',
      ``,
      `Token Signing: ${v.tokenSigning}`,
      `MFA / Attestation: ${v.mfaPqc}`,
      `API Security: ${v.apiSecurity}`,
      `Notes: ${v.notes}`,
      `Certifications: ${v.certifications.join(', ')}`,
    ].filter(Boolean)
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `iam-pqc-vendor-${v.id}-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">IAM Vendor PQC Status</h3>
        <p className="text-sm text-muted-foreground">
          Review IAM vendor PQC readiness across token signing, MFA/attestation, and API security.
          Select a vendor to see published status and roadmap details.
        </p>
      </div>
      <VendorCoverageNotice migrateLayer="Security Stack" className="mb-2" />

      {/* Vendor Selector */}
      <div className="glass-panel p-5">
        <div className="text-xs font-bold text-foreground mb-2">Select Vendor</div>
        <FilterDropdown
          items={VENDOR_OPTIONS}
          selectedId={selectedVendorId}
          onSelect={(id) => {
            if (id !== 'All') setSelectedVendorId(id)
          }}
          label="Vendor"
          defaultLabel="Select Vendor"
          noContainer
        />
      </div>

      <VendorCard vendor={selectedVendor} />

      {/* Export */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="flex items-center gap-2 text-xs"
        >
          <Download size={14} aria-hidden="true" />
          Export Status Report
        </Button>
      </div>
    </div>
  )
}
