// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useMemo } from 'react'
import { Filter, Calendar, Award, ChevronDown, ChevronUp, ExternalLink, Info } from 'lucide-react'
import { FIPS_VALIDATIONS, type FipsValidationEntry } from '../data/hsmConstants'
import { Button } from '@/components/ui/button'

type CertTypeFilter = 'all' | FipsValidationEntry['certType']
type StatusFilter = 'all' | FipsValidationEntry['status']

const CERT_TYPE_COLORS: Record<FipsValidationEntry['certType'], string> = {
  'FIPS 140-3': 'bg-success/10 text-success border-success/20',
  ACVP: 'bg-primary/10 text-primary border-primary/20',
  CAVP: 'bg-secondary/10 text-secondary border-secondary/20',
  'Common Criteria': 'bg-warning/10 text-warning border-warning/20',
}

const STATUS_COLORS: Record<FipsValidationEntry['status'], string> = {
  Active: 'bg-success/10 text-success border-success/20',
  Pending: 'bg-warning/10 text-warning border-warning/20',
  Planned: 'bg-muted/50 text-muted-foreground border-border',
}

export const FipsValidationTracker: React.FC = () => {
  const [certTypeFilter, setCertTypeFilter] = useState<CertTypeFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [algorithmFilter, setAlgorithmFilter] = useState<string>('all')
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null)

  // Gather all unique algorithms across validations
  const allAlgorithms = useMemo(() => {
    const algSet = new Set<string>()
    FIPS_VALIDATIONS.forEach((v) => v.algorithms.forEach((a) => algSet.add(a)))
    return Array.from(algSet).sort()
  }, [])

  // Gather unique cert types
  const allCertTypes = useMemo(() => {
    const types = new Set<FipsValidationEntry['certType']>()
    FIPS_VALIDATIONS.forEach((v) => types.add(v.certType))
    return Array.from(types)
  }, [])

  const filteredValidations = useMemo(() => {
    let validations = [...FIPS_VALIDATIONS]

    if (certTypeFilter !== 'all') {
      validations = validations.filter((v) => v.certType === certTypeFilter)
    }
    if (statusFilter !== 'all') {
      validations = validations.filter((v) => v.status === statusFilter)
    }
    if (algorithmFilter !== 'all') {
      validations = validations.filter((v) => v.algorithms.includes(algorithmFilter))
    }

    return validations
  }, [certTypeFilter, statusFilter, algorithmFilter])

  // Group by vendor
  const groupedByVendor = useMemo(() => {
    const groups: Record<string, FipsValidationEntry[]> = {}
    filteredValidations.forEach((v) => {
      const key = v.vendorId
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(v)
    })
    return groups
  }, [filteredValidations])

  // Summary stats
  const stats = useMemo(() => {
    const active = filteredValidations.filter((v) => v.status === 'Active').length
    const pending = filteredValidations.filter((v) => v.status === 'Pending').length
    const planned = filteredValidations.filter((v) => v.status === 'Planned').length

    // Algorithm validation counts
    const algCounts: Record<string, number> = {}
    filteredValidations
      .filter((v) => v.status === 'Active')
      .forEach((v) => {
        v.algorithms.forEach((alg) => {
          algCounts[alg] = (algCounts[alg] || 0) + 1
        })
      })
    const topAlgorithm = Object.entries(algCounts).sort((a, b) => b[1] - a[1])[0]

    return { active, pending, planned, topAlgorithm }
  }, [filteredValidations])

  // Timeline data: sorted by date
  const timelineEntries = useMemo(() => {
    return [...filteredValidations].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  }, [filteredValidations])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">
          Certification &amp; Algorithm Validation Tracker
        </h3>
        <p className="text-sm text-muted-foreground">
          Track FIPS 140-3 module certifications and ACVP PQC algorithm validations across HSM
          vendors. Filter by certification type, status, or algorithm.
        </p>
      </div>

      {/* FIPS vs ACVP clarification banner */}
      <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
        <div className="flex items-start gap-2">
          <Info size={14} className="text-primary shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-foreground/80">
            <p>
              <strong className="text-foreground">FIPS 140-3 (CMVP)</strong> certifies the
              cryptographic hardware module — its physical security boundary and classical algorithm
              implementations (AES, SHA, RSA, ECDH). As of early 2026,{' '}
              <strong>
                no HSM has a FIPS 140-3 module certificate that includes PQC algorithms
              </strong>
              .
            </p>
            <p>
              <strong className="text-foreground">ACVP</strong> validates individual algorithm
              implementations against NIST test vectors. This is where PQC algorithm support is
              formally validated — separate from module certification.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-panel p-3 text-center">
          <div className="text-2xl font-bold text-success">{stats.active}</div>
          <div className="text-xs text-muted-foreground">Active Certs</div>
        </div>
        <div className="glass-panel p-3 text-center">
          <div className="text-2xl font-bold text-warning">{stats.pending}</div>
          <div className="text-xs text-muted-foreground">Pending</div>
        </div>
        <div className="glass-panel p-3 text-center">
          <div className="text-2xl font-bold text-muted-foreground">{stats.planned}</div>
          <div className="text-xs text-muted-foreground">Planned</div>
        </div>
        <div className="glass-panel p-3 text-center">
          <div className="text-2xl font-bold text-primary">
            {stats.topAlgorithm ? stats.topAlgorithm[0] : 'N/A'}
          </div>
          <div className="text-xs text-muted-foreground">
            Most Validated
            {stats.topAlgorithm ? ` (${stats.topAlgorithm[1]})` : ''}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-panel p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Filters:</span>
          </div>

          {/* Cert Type Filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Type:</span>
            <Button
              variant="ghost"
              onClick={() => setCertTypeFilter('all')}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                certTypeFilter === 'all'
                  ? 'bg-primary/20 text-primary border border-primary/50'
                  : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
              }`}
            >
              All
            </Button>
            {allCertTypes.map((type) => (
              <Button
                variant="ghost"
                key={type}
                onClick={() => setCertTypeFilter(type)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  certTypeFilter === type
                    ? 'bg-primary/20 text-primary border border-primary/50'
                    : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
                }`}
              >
                {type}
              </Button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Status:</span>
            {(['all', 'Active', 'Pending', 'Planned'] as StatusFilter[]).map((status) => (
              <Button
                variant="ghost"
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  statusFilter === status
                    ? 'bg-primary/20 text-primary border border-primary/50'
                    : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
                }`}
              >
                {status}
              </Button>
            ))}
          </div>

          {/* Algorithm Filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Algorithm:</span>
            <Button
              variant="ghost"
              onClick={() => setAlgorithmFilter('all')}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                algorithmFilter === 'all'
                  ? 'bg-primary/20 text-primary border border-primary/50'
                  : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
              }`}
            >
              All
            </Button>
            {allAlgorithms.map((alg) => (
              <Button
                variant="ghost"
                key={alg}
                onClick={() => setAlgorithmFilter(alg)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  algorithmFilter === alg
                    ? 'bg-primary/20 text-primary border border-primary/50'
                    : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
                }`}
              >
                {alg}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Grouped by Vendor */}
      <div className="space-y-3">
        {Object.entries(groupedByVendor).map(([vendorId, validations]) => {
          const vendorName = validations[0].vendorName.split(' ')[0] // First word as vendor label
          const isExpanded = expandedVendor === vendorId

          return (
            <div key={vendorId} className="glass-panel overflow-hidden">
              <Button
                variant="ghost"
                onClick={() => setExpandedVendor(isExpanded ? null : vendorId)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <Award size={16} className="text-primary" />
                  <div>
                    <span className="text-sm font-bold text-foreground">{vendorName}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {validations.length} certification
                      {validations.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Quick status badges */}
                  <div className="hidden sm:flex gap-1">
                    {validations.map((v, i) => (
                      <span
                        key={i}
                        className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${CERT_TYPE_COLORS[v.certType]}`}
                      >
                        {v.certType === 'FIPS 140-3'
                          ? 'FIPS'
                          : v.certType === 'Common Criteria'
                            ? 'CC'
                            : v.certType}
                      </span>
                    ))}
                  </div>
                  {isExpanded ? (
                    <ChevronUp size={16} className="text-muted-foreground" />
                  ) : (
                    <ChevronDown size={16} className="text-muted-foreground" />
                  )}
                </div>
              </Button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 animate-fade-in">
                  {validations.map((v, idx) => (
                    <div key={idx} className="bg-muted/50 rounded-lg p-4 border border-border">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <h5 className="text-sm font-bold text-foreground">{v.vendorName}</h5>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded border font-bold ${CERT_TYPE_COLORS[v.certType]}`}
                            >
                              {v.certType}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded border font-bold ${STATUS_COLORS[v.status]}`}
                            >
                              {v.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar size={10} />
                            {v.date}
                          </div>
                          {v.level && (
                            <div className="text-xs text-primary font-medium mt-0.5">{v.level}</div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-muted-foreground">Cert ID:</span>
                        {v.certLink ? (
                          <a
                            href={v.certLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-mono text-primary hover:underline flex items-center gap-1"
                          >
                            {v.certId}
                            <ExternalLink size={10} />
                          </a>
                        ) : (
                          <span className="text-xs font-mono text-foreground">{v.certId}</span>
                        )}
                      </div>

                      <div className="mb-2">
                        <span className="text-xs text-muted-foreground">
                          {v.certType === 'FIPS 140-3' ? 'PQC Coverage:' : 'Algorithms:'}
                        </span>
                        {v.algorithms.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {v.algorithms.map((alg) => (
                              <span
                                key={alg}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono"
                              >
                                {alg}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-muted-foreground mt-1 italic">
                            None — module certs do not include PQC algorithm certification
                          </p>
                        )}
                      </div>

                      {v.note && (
                        <p className="text-[10px] text-muted-foreground border-t border-border/50 pt-2 mt-2">
                          {v.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {Object.keys(groupedByVendor).length === 0 && (
          <div className="glass-panel p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No validations match the current filters. Try adjusting your filter criteria.
            </p>
          </div>
        )}
      </div>

      {/* Timeline Visualization */}
      <div className="glass-panel p-6">
        <h4 className="text-base font-bold text-foreground mb-4">
          <Calendar size={16} className="inline mr-2" />
          Validation Timeline
        </h4>
        <div className="space-y-2">
          {timelineEntries.map((entry, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-muted-foreground w-20 shrink-0">
                {entry.date}
              </span>
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${
                  entry.status === 'Active'
                    ? 'bg-success'
                    : entry.status === 'Pending'
                      ? 'bg-warning'
                      : 'bg-muted-foreground'
                }`}
              />
              <div className="flex-1 flex items-center gap-2 min-w-0">
                <span className="text-xs font-medium text-foreground truncate">
                  {entry.vendorName}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded border font-bold shrink-0 ${CERT_TYPE_COLORS[entry.certType]}`}
                >
                  {entry.certType === 'FIPS 140-3'
                    ? 'FIPS'
                    : entry.certType === 'Common Criteria'
                      ? 'CC'
                      : entry.certType}
                </span>
                <div className="flex gap-1 shrink-0">
                  {entry.algorithms.map((alg) => (
                    <span
                      key={alg}
                      className="text-[10px] px-1 py-0.5 rounded bg-muted/50 text-muted-foreground font-mono"
                    >
                      {alg}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* References */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <h5 className="text-xs font-bold text-foreground mb-2">Reference Databases</h5>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>
            <strong>NIST CMVP</strong> &mdash; Cryptographic Module Validation Program —{' '}
            <a
              href="https://csrc.nist.gov/projects/cryptographic-module-validation-program"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              csrc.nist.gov/projects/cryptographic-module-validation-program
            </a>
          </p>
          <p>
            <strong>NIST ACVP</strong> &mdash; Automated Cryptographic Validation Protocol —{' '}
            <a
              href="https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              csrc.nist.gov/projects/cryptographic-algorithm-validation-program
            </a>
          </p>
          <p>
            <strong>Note:</strong> Validation data is based on publicly available NIST records and
            vendor announcements as of early 2026. Check the official databases for the most current
            status. FIPS 140-3 module certs currently show &ldquo;No PQC Mechanisms Detected&rdquo;
            — only ACVP provides PQC algorithm validation.
          </p>
        </div>
      </div>
    </div>
  )
}
