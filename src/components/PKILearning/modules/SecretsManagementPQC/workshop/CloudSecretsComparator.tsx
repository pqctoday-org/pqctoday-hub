// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import { VendorCoverageNotice } from '@/components/PKILearning/common/VendorCoverageNotice'
import {
  CLOUD_SECRETS_PROVIDERS,
  PQC_STATUS_LABELS,
  type CloudSecretsProvider,
} from '../data/secretsConstants'
import { Button } from '@/components/ui/button'

type FilterType = 'all' | 'cloud' | 'on-prem' | 'hybrid'

const PQC_STATUS_BADGE: Record<CloudSecretsProvider['pqcStatus'], string> = {
  ga: 'text-status-success bg-status-success/10 border-status-success/30',
  preview: 'text-primary bg-primary/10 border-primary/20',
  planned: 'text-status-warning bg-status-warning/10 border-status-warning/30',
  none: 'text-status-info bg-status-info/10 border-status-info/30',
}

const TYPE_BADGE: Record<CloudSecretsProvider['type'], string> = {
  cloud: 'text-primary bg-primary/10 border-primary/20',
  'on-prem': 'text-secondary bg-secondary/10 border-secondary/20',
  hybrid: 'text-status-info bg-status-info/10 border-status-info/30',
}

const BoolIndicator: React.FC<{ value: boolean; label?: string }> = ({ value, label }) => (
  <span className="flex items-center gap-1">
    {value ? (
      <CheckCircle size={13} className="text-status-success shrink-0" />
    ) : (
      <XCircle size={13} className="text-status-error shrink-0" />
    )}
    {label && <span className="text-[10px] text-muted-foreground">{label}</span>}
  </span>
)

export const CloudSecretsComparator: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = CLOUD_SECRETS_PROVIDERS.filter((p) => filter === 'all' || p.type === filter)

  const filterBtns: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'cloud', label: 'Cloud' },
    { id: 'on-prem', label: 'On-Prem' },
    { id: 'hybrid', label: 'Hybrid' },
  ]

  return (
    <div className="space-y-6">
      <VendorCoverageNotice migrateLayer="Security Stack" className="mb-2" />
      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2">
        {filterBtns.map(({ id, label }) => (
          <Button
            variant="ghost"
            key={id}
            onClick={() => setFilter(id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              filter === id
                ? 'bg-primary text-black border-primary'
                : 'border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Status table (desktop) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-3 text-muted-foreground font-medium">Product</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Type</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">PQC Status</th>
              <th className="text-center py-3 px-2 text-muted-foreground font-medium">
                Envelope Enc.
              </th>
              <th className="text-center py-3 px-2 text-muted-foreground font-medium">
                Dynamic Secrets
              </th>
              <th className="text-center py-3 px-2 text-muted-foreground font-medium">FIPS</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium min-w-[160px]">
                K8s Integration
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((provider) => {
              const isExpanded = expandedId === provider.id
              return (
                <React.Fragment key={provider.id}>
                  <tr
                    className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : provider.id)}
                  >
                    <td className="py-3 px-3">
                      <div className="font-bold text-foreground">{provider.product}</div>
                      <div className="text-[10px] text-muted-foreground">{provider.name}</div>
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${TYPE_BADGE[provider.type]}`}
                      >
                        {provider.type}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${PQC_STATUS_BADGE[provider.pqcStatus]}`}
                      >
                        {PQC_STATUS_LABELS[provider.pqcStatus]}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <BoolIndicator value={provider.envelopeEncryption} />
                    </td>
                    <td className="py-3 px-2 text-center">
                      <BoolIndicator value={provider.dynamicSecrets} />
                    </td>
                    <td className="py-3 px-2 text-center">
                      <BoolIndicator value={provider.fipsMode} />
                    </td>
                    <td className="py-3 px-2 text-[10px] text-muted-foreground">
                      <span className="line-clamp-2">{provider.kubernetesIntegration}</span>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-muted/20">
                      <td colSpan={7} className="px-3 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <div className="text-[10px] font-bold text-foreground mb-1">
                              PQC Algorithms
                            </div>
                            <ul className="space-y-0.5">
                              {provider.pqcAlgorithms.map((alg) => (
                                <li
                                  key={alg}
                                  className="text-[10px] text-muted-foreground flex items-start gap-1"
                                >
                                  <span className="text-primary shrink-0">&#8227;</span>
                                  {alg}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-foreground mb-1">
                              Roadmap Note
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              {provider.roadmapNote}
                            </p>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-foreground mb-1">
                              Encryption at Rest
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              {provider.encryptionAtRest}
                            </p>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-foreground mb-1">
                              Encryption in Transit
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              {provider.encryptionInTransit}
                            </p>
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
        <p className="text-[10px] text-muted-foreground mt-2">Click a row to expand details.</p>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {filtered.map((provider) => {
          const isExpanded = expandedId === provider.id
          return (
            <div
              key={provider.id}
              className="glass-panel p-4 cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : provider.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setExpandedId(isExpanded ? null : provider.id)
                }
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="text-sm font-bold text-foreground">{provider.product}</div>
                  <div className="text-[10px] text-muted-foreground">{provider.name}</div>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${TYPE_BADGE[provider.type]}`}
                  >
                    {provider.type}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${PQC_STATUS_BADGE[provider.pqcStatus]}`}
                  >
                    {PQC_STATUS_LABELS[provider.pqcStatus]}
                  </span>
                </div>
              </div>
              <div className="flex gap-3 text-[10px] text-muted-foreground">
                <BoolIndicator value={provider.envelopeEncryption} label="Envelope Enc." />
                <BoolIndicator value={provider.dynamicSecrets} label="Dynamic Secrets" />
                <BoolIndicator value={provider.fipsMode} label="FIPS" />
              </div>
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-border space-y-2 text-[10px] text-muted-foreground">
                  <p>{provider.roadmapNote}</p>
                  <div>
                    <span className="font-bold text-foreground">Algorithms: </span>
                    {provider.pqcAlgorithms.join(', ')}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
