// SPDX-License-Identifier: GPL-3.0-only

import React, { useState, useMemo } from 'react'
import { BarChart3, Shield, Download, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import {
  IAM_VENDORS,
  PQC_STATUS_LABELS,
  VENDOR_SCORING_DIMENSIONS,
  type IAMVendorStatus,
} from '../data/iamProviderData'

const VENDOR_OPTIONS = IAM_VENDORS.map((v) => ({ id: v.id, label: v.vendor + ' — ' + v.product }))

function ScoreBar({ score, max }: { score: number; max: number }) {
  const pct = (score / max) * 100
  const color =
    pct >= 80
      ? 'bg-status-success'
      : pct >= 60
        ? 'bg-primary'
        : pct >= 40
          ? 'bg-warning'
          : 'bg-status-error'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-muted/50 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-[10px] font-bold w-10 text-right ${color.replace('bg-', 'text-')}`}>
        {score}/{max}
      </span>
    </div>
  )
}

function VendorCard({ vendor, compact = false }: { vendor: IAMVendorStatus; compact?: boolean }) {
  const status = PQC_STATUS_LABELS[vendor.pqcStatus]
  const totalScore =
    vendor.scores.tokenSigning +
    vendor.scores.mfa +
    vendor.scores.apiSecurity +
    vendor.scores.roadmap
  const totalMax = 100
  const totalPct = Math.round((totalScore / totalMax) * 100)

  const totalColor =
    totalPct >= 75
      ? 'text-status-success'
      : totalPct >= 55
        ? 'text-primary'
        : totalPct >= 35
          ? 'text-warning'
          : 'text-status-error'

  return (
    <div className={`glass-panel p-5 space-y-4 ${compact ? '' : ''}`}>
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
        <div className="text-center shrink-0">
          <div className={`text-3xl font-bold ${totalColor}`}>{totalScore}</div>
          <div className="text-[10px] text-muted-foreground">/100</div>
          <div className={`text-[10px] font-bold ${totalColor}`}>{totalPct}%</div>
        </div>
      </div>

      {/* Dimension Scores */}
      <div className="space-y-3">
        {VENDOR_SCORING_DIMENSIONS.map((dim) => (
          <div key={dim.id}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-foreground">{dim.label}</span>
              <span className="text-[10px] text-muted-foreground">{dim.description}</span>
            </div>
            <ScoreBar
              score={vendor.scores[dim.id as keyof typeof vendor.scores]}
              max={dim.maxScore}
            />
          </div>
        ))}
      </div>

      {/* Detail Panels */}
      {!compact && (
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
      )}
    </div>
  )
}

export const VendorReadinessScorer: React.FC = () => {
  const [primaryVendorId, setPrimaryVendorId] = useState<string>(IAM_VENDORS[0].id)
  const [compareVendorId, setCompareVendorId] = useState<string>('All')
  const [showAllVendors, setShowAllVendors] = useState(false)

  const primaryVendor = useMemo(
    () => IAM_VENDORS.find((v) => v.id === primaryVendorId) ?? IAM_VENDORS[0],
    [primaryVendorId]
  )
  const compareVendor = useMemo(
    () => (compareVendorId !== 'All' ? IAM_VENDORS.find((v) => v.id === compareVendorId) : null),
    [compareVendorId]
  )

  const sortedVendors = useMemo(
    () =>
      [...IAM_VENDORS].sort((a, b) => {
        const aTotal =
          a.scores.tokenSigning + a.scores.mfa + a.scores.apiSecurity + a.scores.roadmap
        const bTotal =
          b.scores.tokenSigning + b.scores.mfa + b.scores.apiSecurity + b.scores.roadmap
        return bTotal - aTotal
      }),
    []
  )

  const handleExport = () => {
    const primary = primaryVendor
    const total =
      primary.scores.tokenSigning +
      primary.scores.mfa +
      primary.scores.apiSecurity +
      primary.scores.roadmap
    const lines = [
      `IAM PQC Vendor Readiness Report`,
      `Generated: ${new Date().toISOString().split('T')[0]}`,
      ``,
      `Vendor: ${primary.vendor} — ${primary.product}`,
      `Category: ${primary.category}`,
      `PQC Status: ${PQC_STATUS_LABELS[primary.pqcStatus].label}`,
      `Overall Score: ${total}/100 (${Math.round((total / 100) * 100)}%)`,
      ``,
      `Dimension Scores:`,
      `  Token Signing: ${primary.scores.tokenSigning}/25`,
      `  MFA/Attestation: ${primary.scores.mfa}/25`,
      `  API Security: ${primary.scores.apiSecurity}/25`,
      `  Roadmap Clarity: ${primary.scores.roadmap}/25`,
      ``,
      `Token Signing: ${primary.tokenSigning}`,
      `MFA: ${primary.mfaPqc}`,
      `API Security: ${primary.apiSecurity}`,
      `Notes: ${primary.notes}`,
      `Certifications: ${primary.certifications.join(', ')}`,
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `iam-pqc-vendor-${primary.id}-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const compareOptions = VENDOR_OPTIONS.filter((v) => v.id !== primaryVendorId)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Vendor Readiness Scorer</h3>
        <p className="text-sm text-muted-foreground">
          Evaluate IAM vendor PQC readiness across four dimensions: token signing, MFA/attestation,
          API security, and roadmap clarity. Select a vendor to see detailed score breakdown.
        </p>
      </div>

      {/* Vendor Selector */}
      <div className="glass-panel p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-bold text-foreground mb-2">Primary Vendor</div>
            <FilterDropdown
              items={VENDOR_OPTIONS}
              selectedId={primaryVendorId}
              onSelect={(id) => {
                if (id !== 'All') {
                  setPrimaryVendorId(id)
                  if (id === compareVendorId) setCompareVendorId('All')
                }
              }}
              label="Vendor"
              defaultLabel="Select Vendor"
              noContainer
            />
          </div>
          <div>
            <div className="text-xs font-bold text-foreground mb-2">Compare Vendor (optional)</div>
            <FilterDropdown
              items={compareOptions}
              selectedId={compareVendorId}
              onSelect={setCompareVendorId}
              label="Compare"
              defaultLabel="No Comparison"
              noContainer
            />
          </div>
        </div>
      </div>

      {/* Comparison Layout */}
      {compareVendor ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <VendorCard vendor={primaryVendor} compact />
          <VendorCard vendor={compareVendor} compact />
        </div>
      ) : (
        <VendorCard vendor={primaryVendor} />
      )}

      {/* Export */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="flex items-center gap-2 text-xs"
        >
          <Download size={14} aria-hidden="true" />
          Export Score Report
        </Button>
      </div>

      {/* All Vendors Leaderboard */}
      <div className="glass-panel p-5">
        <button
          onClick={() => setShowAllVendors((p) => !p)}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-primary" aria-hidden="true" />
            <span className="text-sm font-bold text-foreground">
              All Vendors Leaderboard ({IAM_VENDORS.length} vendors)
            </span>
          </div>
          {showAllVendors ? (
            <ChevronUp size={16} className="text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronDown size={16} className="text-muted-foreground" aria-hidden="true" />
          )}
        </button>

        {showAllVendors && (
          <div className="mt-4 space-y-3">
            {sortedVendors.map((vendor, rank) => {
              const total =
                vendor.scores.tokenSigning +
                vendor.scores.mfa +
                vendor.scores.apiSecurity +
                vendor.scores.roadmap
              const pct = Math.round((total / 100) * 100)
              const status = PQC_STATUS_LABELS[vendor.pqcStatus]
              const color =
                pct >= 75
                  ? 'bg-status-success text-status-success'
                  : pct >= 55
                    ? 'bg-primary text-primary'
                    : pct >= 35
                      ? 'bg-warning text-warning'
                      : 'bg-status-error text-status-error'
              const [barColor, textColor] = color.split(' ')
              return (
                <div
                  key={vendor.id}
                  className="flex items-center gap-3 bg-muted/50 rounded-lg p-3 border border-border"
                >
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-muted-foreground">#{rank + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-bold text-foreground">{vendor.vendor}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${status.className}`}
                      >
                        {status.label}
                      </span>
                      <Shield size={10} className="text-muted-foreground" aria-hidden="true" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted/50 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={`text-[10px] font-bold w-10 text-right ${textColor}`}>
                        {total}/100
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
