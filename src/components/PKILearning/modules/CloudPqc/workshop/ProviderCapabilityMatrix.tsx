// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { Terminal, CheckCircle2, AlertTriangle, Info, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PROVIDER_CAPABILITY_MATRIX, type CapabilityStatus } from '../data/cloudPqcData'

type ProviderFilter = 'all' | 'aws' | 'azure' | 'gcp'
type StatusFilter = 'all' | CapabilityStatus

const STATUS_BADGES: Record<CapabilityStatus, string> = {
  ga: 'bg-status-success/15 text-status-success border-status-success/40',
  preview: 'bg-status-warning/15 text-status-warning border-status-warning/40',
  'verify-in-region': 'bg-primary/15 text-primary border-primary/40',
}

export const ProviderCapabilityMatrix: React.FC = () => {
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const filteredRows = PROVIDER_CAPABILITY_MATRIX.filter((row) => {
    const matchesProvider = providerFilter === 'all' || row.provider === providerFilter
    const matchesStatus = statusFilter === 'all' || row.status === statusFilter
    return matchesProvider && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground flex items-start gap-2.5">
        <Info size={15} className="text-primary shrink-0 mt-0.5" />
        <span>
          <strong>Late-2026 Reference Matrix (Verify Live):</strong> Provider PQC availability
          varies by region, protection level, and endpoint type (commercial vs. GovCloud vs.
          China/Middle East). Run the exact verification commands below in your own cloud accounts
          to collect production evidence.
        </span>
      </div>

      {/* Filters */}
      <div className="glass-panel p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Filter size={15} className="text-primary" />
            <span>Filter Provider &amp; Readiness Status</span>
          </div>
          <span className="text-xs text-muted-foreground">
            Showing {filteredRows.length} of {PROVIDER_CAPABILITY_MATRIX.length} capabilities
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div role="group" aria-label="Filter by cloud provider" className="flex flex-wrap gap-2">
            {(
              [
                { id: 'all', label: 'All Clouds' },
                { id: 'aws', label: 'AWS' },
                { id: 'gcp', label: 'GCP' },
                { id: 'azure', label: 'Azure' },
              ] as const
            ).map((p) => (
              <Button
                key={p.id}
                variant={providerFilter === p.id ? 'gradient' : 'outline'}
                size="sm"
                aria-pressed={providerFilter === p.id}
                onClick={() => setProviderFilter(p.id)}
              >
                {p.label}
              </Button>
            ))}
          </div>

          <div
            role="group"
            aria-label="Filter by readiness status"
            className="flex flex-wrap gap-2"
          >
            {(
              [
                { id: 'all', label: 'All Statuses' },
                { id: 'ga', label: 'GA' },
                { id: 'preview', label: 'Preview' },
                { id: 'verify-in-region', label: 'Verify / Constraint' },
              ] as const
            ).map((st) => (
              <Button
                key={st.id}
                variant={statusFilter === st.id ? 'secondary' : 'outline'}
                size="sm"
                aria-pressed={statusFilter === st.id}
                onClick={() => setStatusFilter(st.id)}
              >
                {st.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Capability Cards */}
      {filteredRows.length === 0 ? (
        <div className="glass-panel p-6 text-center text-sm text-muted-foreground">
          No provider capabilities match the current filter combination. Reset a filter to view all
          entries.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRows.map((row) => (
            <article key={row.id} className="glass-panel p-5 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-muted text-foreground">
                      {row.providerLabel}
                    </span>
                    <span className="text-xs text-muted-foreground">{row.layerLabel}</span>
                  </div>
                  <h3 className="text-base font-bold text-foreground">{row.service}</h3>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded border ${STATUS_BADGES[row.status]}`}
                >
                  {row.statusLabel}
                </span>
              </div>

              <p className="text-sm text-foreground/85 leading-relaxed">{row.summary}</p>

              <div className="rounded-lg border border-status-warning/30 bg-status-warning/10 p-3 text-xs flex items-start gap-2">
                <AlertTriangle size={14} className="text-status-warning shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground">Regional / Tier Caveat: </strong>
                  <span className="text-muted-foreground">{row.regionalOrTierCaveat}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <Terminal size={13} className="text-primary" />
                    <span>Production Verification Command</span>
                  </div>
                  <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-[11px] text-foreground/90 bg-background/60 p-2 rounded border border-border/60">
                    {row.verificationCommand}
                  </pre>
                </div>

                <div className="rounded-lg border border-status-success/30 bg-status-success/5 p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <CheckCircle2 size={13} className="text-status-success" />
                    <span>Evidence to Collect</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{row.evidenceToCollect}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
