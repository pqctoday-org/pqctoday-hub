// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { Layers, Shield, AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CLOUD_WORKLOAD_SURFACES, type ControlOwner } from '../data/cloudPqcData'

type OwnerFilter = 'all' | ControlOwner

const OWNER_LABELS: Record<ControlOwner, string> = {
  customer: 'Customer-Controlled',
  shared: 'Shared Configuration',
  provider: 'Provider-Controlled',
}

const OWNER_BADGE_CLASSES: Record<ControlOwner, string> = {
  customer: 'bg-primary/15 text-primary border-primary/40',
  shared: 'bg-status-warning/15 text-status-warning border-status-warning/40',
  provider: 'bg-secondary/20 text-secondary-foreground border-secondary/40',
}

const URGENCY_BADGE_CLASSES: Record<'high' | 'medium' | 'low', string> = {
  high: 'bg-status-error/15 text-status-error border-status-error/40',
  medium: 'bg-status-warning/15 text-status-warning border-status-warning/40',
  low: 'bg-status-success/15 text-status-success border-status-success/40',
}

export const CloudEstateMapper: React.FC = () => {
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([
    'edge-cdn',
    'kms-hsm',
    'object-storage',
    'saas-apps',
  ])
  const [activeSurfaceId, setActiveSurfaceId] = useState<string>('object-storage')

  const filteredSurfaces = CLOUD_WORKLOAD_SURFACES.filter(
    (s) => ownerFilter === 'all' || s.owner === ownerFilter
  )

  const activeSurface =
    CLOUD_WORKLOAD_SURFACES.find((s) => s.id === activeSurfaceId) ?? CLOUD_WORKLOAD_SURFACES[0]

  const toggleInEstate = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const inEstateSurfaces = CLOUD_WORKLOAD_SURFACES.filter((s) => selectedIds.includes(s.id))
  const customerOrSharedCount = inEstateSurfaces.filter(
    (s) => s.owner === 'customer' || s.owner === 'shared'
  ).length
  const providerCount = inEstateSurfaces.filter((s) => s.owner === 'provider').length
  const highHndlCount = inEstateSurfaces.filter((s) => s.hndlUrgency === 'high').length

  return (
    <div className="space-y-6">
      {/* Sample Disclaimer */}
      <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground flex items-start gap-2.5">
        <Info size={15} className="text-primary shrink-0 mt-0.5" />
        <span>
          <strong>Educational Sample Mapper:</strong> Use this fictional multi-cloud estate to
          separate customer-controlled crypto surfaces from provider-managed layers and distinguish
          cloud services from protected assets. In production, reconcile this map against live cloud
          inventories (AWS Config, Azure Resource Graph, GCP Cloud Asset Inventory).
        </span>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass-panel p-4">
          <p className="text-xs text-muted-foreground">In-Scope Surfaces</p>
          <p className="text-2xl font-bold text-foreground mt-1">{inEstateSurfaces.length}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {customerOrSharedCount} customer/shared · {providerCount} provider-controlled
          </p>
        </div>
        <div className="glass-panel p-4">
          <p className="text-xs text-muted-foreground">High HNDL Urgency</p>
          <p className="text-2xl font-bold text-status-error mt-1">{highHndlCount}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Surfaces carrying long-lived confidentiality assets
          </p>
        </div>
        <div className="glass-panel p-4">
          <p className="text-xs text-muted-foreground">Actionable Split</p>
          <p className="text-sm font-semibold text-foreground mt-1">
            {customerOrSharedCount > 0
              ? 'Direct TLS/KMS config required'
              : 'Vendor evidence scope only'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Provider-controlled layers still require verification evidence
          </p>
        </div>
      </div>

      {/* Owner Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Layers size={16} className="text-primary" />
          <span>Filter by Cryptographic Control Boundary</span>
        </div>
        <div
          role="group"
          aria-label="Filter cloud surfaces by control owner"
          className="flex flex-wrap gap-2"
        >
          {(
            [
              { id: 'all', label: 'All Surfaces' },
              { id: 'customer', label: 'Customer-Controlled' },
              { id: 'shared', label: 'Shared Config' },
              { id: 'provider', label: 'Provider-Controlled' },
            ] as const
          ).map((opt) => (
            <Button
              key={opt.id}
              variant={ownerFilter === opt.id ? 'gradient' : 'outline'}
              size="sm"
              aria-pressed={ownerFilter === opt.id}
              onClick={() => setOwnerFilter(opt.id)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Surface Grid + Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 space-y-2.5">
          {filteredSurfaces.map((surface) => {
            const isIncluded = selectedIds.includes(surface.id)
            const isActive = activeSurface.id === surface.id
            return (
              <div
                key={surface.id}
                className={`rounded-xl border p-3.5 transition-colors ${
                  isActive
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card/60 hover:border-primary/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveSurfaceId(surface.id)}
                    aria-pressed={isActive}
                    className="h-auto p-0 text-left font-semibold text-foreground hover:bg-transparent whitespace-normal"
                  >
                    {surface.layer}
                  </Button>
                  <Button
                    variant={isIncluded ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => toggleInEstate(surface.id)}
                    aria-pressed={isIncluded}
                    aria-label={`${isIncluded ? 'Remove' : 'Include'} ${surface.layer} in sample estate`}
                    className="h-7 px-2 text-xs shrink-0"
                  >
                    {isIncluded ? 'In Estate' : 'Excluded'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{surface.serviceExample}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded border ${OWNER_BADGE_CLASSES[surface.owner]}`}
                  >
                    {OWNER_LABELS[surface.owner]}
                  </span>
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded border uppercase ${URGENCY_BADGE_CLASSES[surface.hndlUrgency]}`}
                  >
                    HNDL: {surface.hndlUrgency}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Inspector Panel */}
        <div className="lg:col-span-3 glass-panel p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
            <div>
              <h3 className="text-base font-bold text-foreground">{activeSurface.layer}</h3>
              <p className="text-xs text-muted-foreground">{activeSurface.serviceExample}</p>
            </div>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded border ${OWNER_BADGE_CLASSES[activeSurface.owner]}`}
            >
              {OWNER_LABELS[activeSurface.owner]}
            </span>
          </div>

          {/* Service vs Protected Asset Callout */}
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3.5 space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Shield size={14} className="text-primary" />
              <span>Cloud Service vs. Protected Asset</span>
            </div>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Business / Cloud Service:</strong>{' '}
              {activeSurface.serviceExample}
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Protected Asset:</strong>{' '}
              {activeSurface.protectedAsset}
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Cryptographic Mechanism:</strong>{' '}
              {activeSurface.cryptoMechanism}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg border border-border bg-muted/30 p-3.5 space-y-2">
              <p className="font-semibold text-foreground">Customer Actions (Your Tools)</p>
              <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                {activeSurface.customerActions.map((act) => (
                  <li key={act}>{act}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3.5 space-y-2">
              <p className="font-semibold text-foreground">Provider Responsibility</p>
              <p className="text-muted-foreground leading-relaxed">
                {activeSurface.providerResponsibility}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-status-success/30 bg-status-success/5 p-3.5 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <CheckCircle2 size={14} className="text-status-success" />
              <span>Production Verification Evidence</span>
            </div>
            <p className="text-muted-foreground">{activeSurface.verificationEvidence}</p>
          </div>

          <div className="rounded-lg border border-status-warning/40 bg-status-warning/10 p-3.5 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <AlertTriangle size={14} className="text-status-warning" />
              <span>Common Boundary Mistake</span>
            </div>
            <p className="text-muted-foreground">{activeSurface.commonMistake}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
