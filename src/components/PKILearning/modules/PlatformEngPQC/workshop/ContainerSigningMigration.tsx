// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo, useCallback } from 'react'
import { ChevronDown, ChevronUp, CheckSquare, Square, ShieldCheck } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { Button } from '@/components/ui/button'
import { SIGNING_TOOLS } from '../data/signingToolsData'
import { VendorCoverageNotice } from '@/components/PKILearning/common/VendorCoverageNotice'
import {
  PQC_READINESS_COLORS,
  PQC_READINESS_LABELS,
  ALGORITHM_LABELS,
  type PQCReadiness,
} from '../data/platformEngConstants'
import { KatValidationPanel } from '@/components/shared/KatValidationPanel'
import type { KatTestSpec } from '@/utils/katRunner'

const PLATFORM_KAT_SPECS: KatTestSpec[] = [
  {
    id: 'platform-container-sign',
    useCase: 'Container image signing (ML-DSA-65)',
    standard: 'SLSA + FIPS 204',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/204/final',
    kind: { type: 'mldsa-functional', variant: 65 },
    message: 'OCI image digest: sha256:a1b2c3d4e5f6@sha256:7890abcdef01',
  },
  {
    id: 'platform-artifact-hash',
    useCase: 'Build artifact integrity hash',
    standard: 'FIPS 180-4 ACVP',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/180-4/upd1/final',
    kind: { type: 'sha256-hash', testIndex: 2 },
  },
  {
    id: 'platform-classical-ecdsa',
    useCase: 'Legacy ECDSA P-256 attestation',
    standard: 'FIPS 186-5',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/186-5/final',
    kind: { type: 'ecdsa-functional', curve: 'P-256' },
    message: 'Sigstore bundle: logIndex=42,integratedTime=1735689600',
  },
]

type ReadinessFilter = 'All' | PQCReadiness

const READINESS_ITEMS = [
  { id: 'All', label: 'All Readiness' },
  { id: 'available', label: 'Available' },
  { id: 'beta', label: 'Beta' },
  { id: 'roadmap', label: 'On Roadmap' },
  { id: 'not-planned', label: 'Not Planned' },
]

const COMPARE_DIMENSIONS = [
  { key: 'signingAlgorithm' as const, label: 'Current Algorithm' },
  { key: 'signatureFormat' as const, label: 'Signature Format' },
  { key: 'transparencyLog' as const, label: 'Transparency Log' },
  { key: 'pqcReadiness' as const, label: 'PQC Readiness' },
  { key: 'pqcAlgorithm' as const, label: 'PQC Algorithm' },
  { key: 'estimatedPqcYear' as const, label: 'PQC ETA' },
]

export const ContainerSigningMigration: React.FC = () => {
  const [readinessFilter, setReadinessFilter] = useState<ReadinessFilter>('All')
  const [expandedId, setExpandedId] = useState<string | null>('cosign')
  const [compareMode, setCompareMode] = useState(false)
  const [selectedForCompare, setSelectedForCompare] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    return SIGNING_TOOLS.filter((t) => {
      if (readinessFilter !== 'All' && t.pqcReadiness !== readinessFilter) return false
      return true
    })
  }, [readinessFilter])

  const toggleExpand = useCallback(
    (id: string) => setExpandedId((prev) => (prev === id ? null : id)),
    []
  )

  const toggleCompare = useCallback((id: string) => {
    setSelectedForCompare((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < 3) next.add(id)
      return next
    })
  }, [])

  const handleToggleCompareMode = useCallback(() => {
    setCompareMode((prev) => {
      if (prev) setSelectedForCompare(new Set())
      return !prev
    })
  }, [])

  const comparedTools = useMemo(
    () => SIGNING_TOOLS.filter((t) => selectedForCompare.has(t.id)),
    [selectedForCompare]
  )

  const renderCompareValue = (tool: (typeof SIGNING_TOOLS)[0], key: string): React.ReactNode => {
    switch (key) {
      case 'signingAlgorithm':
        return (
          <span className="font-mono text-xs text-status-error">
            {ALGORITHM_LABELS[tool.signingAlgorithm]}
          </span>
        )
      case 'signatureFormat':
        return <span className="text-xs text-foreground">{tool.signatureFormat}</span>
      case 'transparencyLog':
        return tool.transparencyLog ? (
          <span className="text-status-success text-xs font-bold">Yes</span>
        ) : (
          <span className="text-muted-foreground text-xs">No</span>
        )
      case 'pqcReadiness':
        return (
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${PQC_READINESS_COLORS[tool.pqcReadiness]}`}
          >
            {PQC_READINESS_LABELS[tool.pqcReadiness]}
          </span>
        )
      case 'pqcAlgorithm':
        return tool.pqcAlgorithm ? (
          <span className="font-mono text-xs text-status-success">
            {ALGORITHM_LABELS[tool.pqcAlgorithm]}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">N/A</span>
        )
      case 'estimatedPqcYear':
        return <span className="text-xs font-bold text-foreground">{tool.estimatedPqcYear}</span>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Container & OCI Artifact Signing</h3>
        <p className="text-sm text-muted-foreground">
          Compare OCI artifact signing tools by PQC readiness, signature format, and migration path.
          Current tools use ECDSA P-256 — quantum-vulnerable signatures that must be migrated to
          ML-DSA before CRQC arrival.
        </p>
      </div>
      <VendorCoverageNotice migrateLayer="Libraries" className="mb-2" />

      {/* Filters + Compare toggle */}
      <div className="glass-panel p-4 flex flex-wrap items-center gap-3">
        <FilterDropdown
          items={READINESS_ITEMS}
          selectedId={readinessFilter}
          onSelect={(id) => setReadinessFilter(id as ReadinessFilter)}
          label="PQC Readiness"
          defaultLabel="All Readiness"
          defaultIcon={<ShieldCheck size={16} className="text-primary" />}
          noContainer
        />
        <Button variant="outline" onClick={handleToggleCompareMode} className="ml-auto">
          {compareMode ? 'Exit Compare' : 'Compare Tools'}
        </Button>
        {compareMode && (
          <span className="text-xs text-muted-foreground">
            Select 2–3 tools ({selectedForCompare.size}/3)
          </span>
        )}
      </div>

      {/* Tool Cards */}
      <div className="space-y-2">
        {filtered.map((tool) => {
          const isExpanded = expandedId === tool.id
          const isSelected = selectedForCompare.has(tool.id)
          return (
            <div
              key={tool.id}
              className={`glass-panel overflow-hidden ${isSelected ? 'ring-2 ring-primary' : ''}`}
            >
              <Button
                variant="ghost"
                onClick={() => (compareMode ? toggleCompare(tool.id) : toggleExpand(tool.id))}
                className="w-full text-left p-4 flex items-center gap-3"
              >
                {compareMode && (
                  <span className="shrink-0">
                    {isSelected ? (
                      <CheckSquare size={18} className="text-primary" />
                    ) : (
                      <Square size={18} className="text-muted-foreground" />
                    )}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-foreground">{tool.name}</span>
                    <span className="text-xs text-muted-foreground">{tool.vendor}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${PQC_READINESS_COLORS[tool.pqcReadiness]}`}
                    >
                      {PQC_READINESS_LABELS[tool.pqcReadiness]}
                    </span>
                    {tool.transparencyLog && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-status-info/10 text-status-info border border-status-info/30 font-bold">
                        Transparency Log
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{tool.description}</p>
                </div>
                {!compareMode && (
                  <span className="shrink-0">
                    {isExpanded ? (
                      <ChevronUp size={16} className="text-muted-foreground" />
                    ) : (
                      <ChevronDown size={16} className="text-muted-foreground" />
                    )}
                  </span>
                )}
              </Button>

              {isExpanded && !compareMode && (
                <div className="px-4 pb-4 border-t border-border pt-4 space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-2">
                      <div>
                        <span className="text-muted-foreground">Current Algorithm:</span>{' '}
                        <span className="font-mono text-status-error">
                          {ALGORITHM_LABELS[tool.signingAlgorithm]}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Signature Format:</span>{' '}
                        <span className="text-foreground">{tool.signatureFormat}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">PQC ETA:</span>{' '}
                        <span className="font-bold text-foreground">{tool.estimatedPqcYear}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-bold">Strengths:</span>
                      <ul className="mt-1 space-y-0.5">
                        {tool.strengths.map((s) => (
                          <li key={s} className="text-status-success">
                            &bull; {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="bg-status-success/10 rounded-lg p-3 border border-status-success/20">
                    <div className="flex items-center gap-1 mb-1">
                      <ShieldCheck size={12} className="text-status-success" />
                      <span className="text-xs font-bold text-foreground">PQC Migration Path</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{tool.pqcNotes}</p>
                  </div>
                  {tool.limitations.length > 0 && (
                    <div>
                      <span className="text-xs text-muted-foreground font-bold">Limitations:</span>
                      <ul className="mt-1 space-y-0.5">
                        {tool.limitations.map((l) => (
                          <li key={l} className="text-xs text-status-warning">
                            &bull; {l}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Comparison Table */}
      {compareMode && comparedTools.length >= 2 && (
        <div className="glass-panel overflow-hidden">
          <div className="p-4 border-b border-border">
            <h4 className="text-sm font-bold text-foreground">Side-by-Side Comparison</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-3 text-left text-muted-foreground font-medium w-40">
                    Dimension
                  </th>
                  {comparedTools.map((t) => (
                    <th key={t.id} className="p-3 text-left text-foreground font-bold">
                      {t.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE_DIMENSIONS.map((dim) => (
                  <tr key={dim.key} className="border-b border-border last:border-0">
                    <td className="p-3 text-muted-foreground font-medium">{dim.label}</td>
                    {comparedTools.map((t) => (
                      <td key={t.id} className="p-3">
                        {renderCompareValue(t, dim.key)}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-b border-border">
                  <td className="p-3 text-muted-foreground font-medium align-top">PQC Path</td>
                  {comparedTools.map((t) => (
                    <td key={t.id} className="p-3 text-xs text-muted-foreground">
                      {t.pqcNotes.slice(0, 120)}…
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Recommendation:</strong> Migrate to Notation with ML-DSA-65 support (available now
          via AWS plugin) for new deployments. For keyless signing, wait for Sigstore/cosign PQC
          support (2026). Avoid DCT (Docker Content Trust) — Notary v1 has no PQC roadmap.
        </p>
      </div>

      <KatValidationPanel
        specs={PLATFORM_KAT_SPECS}
        label="Platform Engineering PQC Known Answer Tests"
        authorityNote="SLSA · FIPS 204 · FIPS 180-4 · FIPS 186-5"
      />
    </div>
  )
}
