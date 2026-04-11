// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, CheckSquare, Square, Link2 } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import {
  PQC_LIBRARIES,
  type PQCLibrary,
  type FIPSStatus,
  type PerformanceTier,
} from '../data/pqcLibraryData'
import { KatValidationPanel } from '@/components/shared/KatValidationPanel'
import type { KatTestSpec } from '@/utils/katRunner'
import { Button } from '@/components/ui/button'

const DEVAPI_KAT_SPECS: KatTestSpec[] = [
  {
    id: 'devapi-pqc-sign',
    useCase: 'PQC library signing (ML-DSA-65)',
    standard: 'FIPS 204',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/204/final',
    kind: { type: 'mldsa-functional', variant: 65 },
    message: 'API request signature: method=POST,path=/v1/sign,timestamp=1735689600',
  },
  {
    id: 'devapi-ecdsa-verify',
    useCase: 'Classical ECDSA P-256 verification',
    standard: 'FIPS 186-5 ACVP',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/186-5/final',
    kind: { type: 'ecdsa-sigver', curve: 'P-256' },
  },
  {
    id: 'devapi-eddsa-verify',
    useCase: 'EdDSA Ed25519 verification',
    standard: 'RFC 8032 ACVP',
    referenceUrl: 'https://www.rfc-editor.org/rfc/rfc8032',
    kind: { type: 'eddsa-sigver' },
  },
  {
    id: 'devapi-sha3-256',
    useCase: 'SHA3-256 post-quantum hash API',
    standard: 'FIPS 202',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/202/final',
    kind: { type: 'sha3-256-hash', testIndex: 1 },
  },
  {
    id: 'devapi-sha512',
    useCase: 'SHA-512 high-security hash API',
    standard: 'FIPS 180-4',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/180-4/upd1/final',
    kind: { type: 'sha512-hash', testIndex: 1 },
  },
]

type FIPSFilter = 'All' | FIPSStatus
type PerfFilter = 'All' | PerformanceTier

const FIPS_ITEMS = [
  { id: 'All', label: 'All FIPS Status' },
  { id: 'validated', label: 'Validated' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'planned', label: 'Planned' },
  { id: 'none', label: 'None' },
]

const PERF_ITEMS = [
  { id: 'All', label: 'All Performance' },
  { id: 'optimized', label: 'Optimized' },
  { id: 'mixed', label: 'Mixed' },
  { id: 'reference', label: 'Reference' },
]

const FIPS_COLORS: Record<FIPSStatus, string> = {
  validated: 'bg-status-success/20 text-status-success border-status-success/50',
  'in-progress': 'bg-status-warning/20 text-status-warning border-status-warning/50',
  planned: 'bg-status-info/20 text-status-info border-status-info/50',
  none: 'bg-muted/50 text-muted-foreground border-border',
}

const FIPS_LABELS: Record<FIPSStatus, string> = {
  validated: 'FIPS Validated',
  'in-progress': 'FIPS In-Progress',
  planned: 'FIPS Planned',
  none: 'No FIPS',
}

const PERF_COLORS: Record<PerformanceTier, string> = {
  optimized: 'text-status-success',
  mixed: 'text-status-warning',
  reference: 'text-muted-foreground',
}

const RADAR_KEYS: { key: keyof PQCLibrary['radar']; label: string }[] = [
  { key: 'algorithmBreadth', label: 'Algo Breadth' },
  { key: 'performance', label: 'Performance' },
  { key: 'fipsMaturity', label: 'FIPS' },
  { key: 'communityMaintenance', label: 'Community' },
  { key: 'languageBindings', label: 'Bindings' },
]

const AlgoCheck: React.FC<{ supported: boolean; label: string }> = ({ supported, label }) => (
  <div
    className={`text-xs px-1.5 py-0.5 rounded border ${supported ? 'bg-status-success/10 text-status-success border-status-success/40' : 'bg-muted/30 text-muted-foreground border-border'}`}
  >
    {label}
  </div>
)

interface LibCardProps {
  lib: PQCLibrary
  isExpanded: boolean
  isSelected: boolean
  onToggleExpand: () => void
  onToggleSelect: () => void
  compareMode: boolean
}

const LibCard: React.FC<LibCardProps> = ({
  lib,
  isExpanded,
  isSelected,
  onToggleExpand,
  onToggleSelect,
  compareMode,
}) => (
  <div
    className={`glass-panel overflow-hidden transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}
  >
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-foreground">{lib.name}</h3>
            <span
              className={`text-xs px-2 py-0.5 rounded-full border ${FIPS_COLORS[lib.fipsStatus]}`}
            >
              {FIPS_LABELS[lib.fipsStatus]}
            </span>
            <span className={`text-xs ${PERF_COLORS[lib.performanceTier]}`}>
              {lib.performanceTier}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {lib.language} · {lib.maintainer} · {lib.license}
          </p>
          <p className="text-sm text-muted-foreground mt-1">{lib.description.slice(0, 110)}…</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {compareMode && (
            <Button
              variant="ghost"
              onClick={onToggleSelect}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              {isSelected ? (
                <CheckSquare size={20} className="text-primary" />
              ) : (
                <Square size={20} />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={onToggleExpand}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </Button>
        </div>
      </div>

      {/* Radar bars */}
      <div className="mt-3 space-y-1">
        {RADAR_KEYS.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-2 text-sm">
            <span className="w-24 text-muted-foreground shrink-0 text-xs">{label}</span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${(lib.radar[key] / 10) * 100}%` }}
              />
            </div>
            <span className="w-6 text-right text-muted-foreground text-xs">{lib.radar[key]}</span>
          </div>
        ))}
      </div>

      {/* Algorithm support badges */}
      <div className="mt-3 flex flex-wrap gap-1">
        <AlgoCheck supported={lib.algorithmSupport.mlKem} label="ML-KEM" />
        <AlgoCheck supported={lib.algorithmSupport.mlDsa} label="ML-DSA" />
        <AlgoCheck supported={lib.algorithmSupport.slhDsa} label="SLH-DSA" />
        <AlgoCheck supported={lib.algorithmSupport.fnDsa} label="FN-DSA" />
        <AlgoCheck supported={lib.algorithmSupport.lms} label="LMS" />
        <AlgoCheck supported={lib.algorithmSupport.hqc} label="HQC" />
        <AlgoCheck supported={lib.algorithmSupport.classicMcEliece} label="McEliece" />
        <AlgoCheck supported={lib.algorithmSupport.frodoKem} label="FrodoKEM" />
      </div>
    </div>

    {isExpanded && (
      <div className="border-t border-border p-4 space-y-4">
        <div>
          <h4 className="font-semibold text-sm text-foreground mb-1">Key Differentiator</h4>
          <p className="text-sm text-muted-foreground">{lib.keyDifferentiator}</p>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-foreground mb-1">FIPS Details</h4>
          <p className="text-sm text-muted-foreground">{lib.fipsDetails}</p>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-foreground mb-1">Performance</h4>
          <p className="text-sm text-muted-foreground">{lib.performanceNotes}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <h4 className="font-semibold text-sm text-foreground mb-1">Platforms</h4>
            <div className="flex flex-wrap gap-1">
              {lib.platforms.map((p) => (
                <span
                  key={p}
                  className="text-xs px-2 py-0.5 rounded border border-border text-muted-foreground"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-foreground mb-1">Language Bindings</h4>
            <div className="flex flex-wrap gap-1">
              {lib.bindings.map((b) => (
                <span
                  key={b}
                  className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <h4 className="font-semibold text-sm text-status-success mb-1">Strengths</h4>
            <ul className="space-y-0.5">
              {lib.strengths.map((s, i) => (
                <li key={i} className="text-sm text-muted-foreground">
                  • {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-status-error mb-1">Limitations</h4>
            <ul className="space-y-0.5">
              {lib.limitations.map((s, i) => (
                <li key={i} className="text-sm text-muted-foreground">
                  • {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
        {lib.dependencies.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-1">
              <Link2 size={14} className="text-primary" /> Dependencies &amp; Relationships
            </h4>
            <div className="space-y-1">
              {lib.dependencies.map((dep, i) => (
                <div key={i} className="text-sm flex items-center gap-2">
                  <span className="text-xs px-1.5 py-0.5 rounded border border-border text-muted-foreground">
                    {dep.relationship}
                  </span>
                  <span className="font-mono text-primary">{dep.target}</span>
                  <span className="text-muted-foreground">— {dep.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )}
  </div>
)

const CompareTable: React.FC<{ libs: PQCLibrary[] }> = ({ libs }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b border-border">
          <th className="text-left p-3 text-muted-foreground w-32">Dimension</th>
          {libs.map((l) => (
            <th key={l.id} className="text-left p-3 text-foreground font-bold">
              {l.name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {[
          { label: 'Language', fn: (l: PQCLibrary) => l.language },
          { label: 'FIPS', fn: (l: PQCLibrary) => FIPS_LABELS[l.fipsStatus] },
          { label: 'Performance', fn: (l: PQCLibrary) => l.performanceTier },
          { label: 'License', fn: (l: PQCLibrary) => l.license },
          { label: 'ML-KEM', fn: (l: PQCLibrary) => (l.algorithmSupport.mlKem ? '✓' : '✗') },
          { label: 'ML-DSA', fn: (l: PQCLibrary) => (l.algorithmSupport.mlDsa ? '✓' : '✗') },
          { label: 'SLH-DSA', fn: (l: PQCLibrary) => (l.algorithmSupport.slhDsa ? '✓' : '✗') },
          { label: 'FN-DSA', fn: (l: PQCLibrary) => (l.algorithmSupport.fnDsa ? '✓' : '✗') },
          { label: 'Bindings', fn: (l: PQCLibrary) => l.bindings.join(', ') },
        ].map(({ label, fn }) => (
          <tr key={label} className="border-b border-border hover:bg-muted/30">
            <td className="p-3 text-muted-foreground">{label}</td>
            {libs.map((l) => {
              const val = fn(l)
              return (
                <td
                  key={l.id}
                  className={`p-3 ${val === '✓' ? 'text-status-success' : val === '✗' ? 'text-muted-foreground/40' : 'text-foreground'}`}
                >
                  {val}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

export const PQCLibraryExplorer: React.FC = () => {
  const [fipsFilter, setFipsFilter] = useState<FIPSFilter>('All')
  const [perfFilter, setPerfFilter] = useState<PerfFilter>('All')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [compareMode, setCompareMode] = useState(false)

  const filtered = useMemo(
    () =>
      PQC_LIBRARIES.filter((l) => {
        if (fipsFilter !== 'All' && l.fipsStatus !== fipsFilter) return false
        if (perfFilter !== 'All' && l.performanceTier !== perfFilter) return false
        return true
      }),
    [fipsFilter, perfFilter]
  )

  const compareLibs = useMemo(
    () => PQC_LIBRARIES.filter((l) => selectedIds.has(l.id)),
    [selectedIds]
  )

  const toggleExpand = (id: string) =>
    setExpandedIds((p) => {
      const n = new Set(p)
      if (n.has(id)) {
        n.delete(id)
      } else {
        n.add(id)
      }
      return n
    })
  const toggleSelect = (id: string) =>
    setSelectedIds((p) => {
      const n = new Set(p)
      if (n.has(id)) {
        n.delete(id)
      } else if (n.size < 3) {
        n.add(id)
      }
      return n
    })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center">
        <FilterDropdown
          label="FIPS Status"
          items={FIPS_ITEMS}
          selectedId={fipsFilter}
          onSelect={(id) => setFipsFilter(id as FIPSFilter)}
        />
        <FilterDropdown
          label="Performance"
          items={PERF_ITEMS}
          selectedId={perfFilter}
          onSelect={(id) => setPerfFilter(id as PerfFilter)}
        />
        <Button
          variant="ghost"
          onClick={() => {
            setCompareMode((v) => !v)
            if (compareMode) setSelectedIds(new Set())
          }}
          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${compareMode ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground hover:border-primary hover:text-primary'}`}
        >
          {compareMode ? `Compare (${selectedIds.size}/3)` : 'Compare Mode'}
        </Button>
      </div>

      {compareMode && compareLibs.length >= 2 && (
        <div className="glass-panel p-4">
          <h3 className="font-bold text-foreground mb-4">Library Comparison</h3>
          <CompareTable libs={compareLibs} />
        </div>
      )}
      {compareMode && compareLibs.length < 2 && (
        <div className="glass-panel p-4 text-center text-muted-foreground text-sm">
          Select 2–3 libraries to compare.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((lib) => (
          <LibCard
            key={lib.id}
            lib={lib}
            isExpanded={expandedIds.has(lib.id)}
            isSelected={selectedIds.has(lib.id)}
            onToggleExpand={() => toggleExpand(lib.id)}
            onToggleSelect={() => toggleSelect(lib.id)}
            compareMode={compareMode}
          />
        ))}
      </div>

      <KatValidationPanel
        specs={DEVAPI_KAT_SPECS}
        label="Crypto Dev APIs Known Answer Tests"
        authorityNote="FIPS 204 · FIPS 186-5 · RFC 8032"
      />
    </div>
  )
}
