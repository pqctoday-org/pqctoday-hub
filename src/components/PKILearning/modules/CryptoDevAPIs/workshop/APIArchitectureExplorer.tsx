// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, CheckSquare, Square } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import {
  CRYPTO_APIS,
  type CryptoAPI,
  type PlatformScope,
  type KeyStorageModel,
  type AbstractionLevel,
} from '../data/apiData'
import { Button } from '@/components/ui/button'

type PlatformFilter = 'All' | PlatformScope
type StorageFilter = 'All' | KeyStorageModel
type LevelFilter = 'All' | AbstractionLevel

const PLATFORM_ITEMS = [
  { id: 'All', label: 'All Platforms' },
  { id: 'cross-platform', label: 'Cross-Platform' },
  { id: 'java', label: 'Java' },
  { id: 'windows', label: 'Windows' },
  { id: 'all', label: 'Universal' },
]

const STORAGE_ITEMS = [
  { id: 'All', label: 'All Storage' },
  { id: 'software', label: 'Software' },
  { id: 'hardware', label: 'Hardware' },
  { id: 'both', label: 'Both' },
]

const LEVEL_ITEMS = [
  { id: 'All', label: 'All Levels' },
  { id: 'high', label: 'High-Level' },
  { id: 'medium', label: 'Medium-Level' },
  { id: 'low', label: 'Low-Level' },
]

const RADAR_KEYS: { key: keyof CryptoAPI['radar']; label: string }[] = [
  { key: 'maturity', label: 'Maturity' },
  { key: 'pqcReadiness', label: 'PQC Ready' },
  { key: 'platformReach', label: 'Platform' },
  { key: 'hsmIntegration', label: 'HSM' },
  { key: 'communitySize', label: 'Community' },
]

const RadarBar: React.FC<{ label: string; value: number; max?: number }> = ({
  label,
  value,
  max = 10,
}) => (
  <div className="flex items-center gap-2 text-sm">
    <span className="w-20 text-muted-foreground shrink-0">{label}</span>
    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
      <div
        className="h-full bg-primary rounded-full transition-all"
        style={{ width: `${(value / max) * 100}%` }}
      />
    </div>
    <span className="w-6 text-right text-muted-foreground">{value}</span>
  </div>
)

interface APICardProps {
  api: CryptoAPI
  isExpanded: boolean
  isSelected: boolean
  onToggleExpand: () => void
  onToggleSelect: () => void
  compareMode: boolean
}

const APICard: React.FC<APICardProps> = ({
  api,
  isExpanded,
  isSelected,
  onToggleExpand,
  onToggleSelect,
  compareMode,
}) => {
  const levelColors: Record<AbstractionLevel, string> = {
    high: 'bg-status-success/20 text-status-success border-status-success/50',
    medium: 'bg-status-warning/20 text-status-warning border-status-warning/50',
    low: 'bg-status-info/20 text-status-info border-status-info/50',
  }
  return (
    <div
      className={`glass-panel overflow-hidden transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-foreground">{api.name}</h3>
              <span
                className={`text-xs px-2 py-0.5 rounded-full border ${levelColors[api.abstractionLevel]}`}
              >
                {api.abstractionLevel}-level
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground">
                {api.platform}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{api.description.slice(0, 100)}…</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {compareMode && (
              <Button
                variant="ghost"
                onClick={onToggleSelect}
                className="text-muted-foreground hover:text-primary transition-colors"
                title={isSelected ? 'Remove from comparison' : 'Add to comparison'}
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

        {/* Radar scores */}
        <div className="mt-3 space-y-1">
          {RADAR_KEYS.map(({ key, label }) => (
            <RadarBar key={key} label={label} value={api.radar[key]} />
          ))}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-border p-4 space-y-4">
          <div>
            <h4 className="font-semibold text-sm text-foreground mb-1">Architecture</h4>
            <p className="text-sm text-muted-foreground">{api.architectureSummary}</p>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-foreground mb-1">Provider Pattern</h4>
            <p className="text-sm text-muted-foreground">{api.providerPattern}</p>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-foreground mb-1">Key Objects</h4>
            <ul className="space-y-1">
              {api.keyObjects.map((obj) => (
                <li key={obj.name} className="text-sm">
                  <span className="font-mono text-primary">{obj.name}</span>
                  <span className="text-muted-foreground"> — {obj.description}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <h4 className="font-semibold text-sm text-foreground mb-1">Session Model</h4>
              <p className="text-sm text-muted-foreground">{api.sessionModel}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground mb-1">PQC Status</h4>
              <p className="text-sm text-muted-foreground">{api.pqcStatus}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <h4 className="font-semibold text-sm text-status-success mb-1">Strengths</h4>
              <ul className="space-y-0.5">
                {api.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-muted-foreground">
                    • {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-status-error mb-1">Limitations</h4>
              <ul className="space-y-0.5">
                {api.limitations.map((s, i) => (
                  <li key={i} className="text-sm text-muted-foreground">
                    • {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-foreground mb-1">Origin &amp; Year</h4>
            <p className="text-sm text-muted-foreground">
              {api.origin} ({api.yearIntroduced})
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

interface CompareViewProps {
  apis: CryptoAPI[]
}
const CompareView: React.FC<CompareViewProps> = ({ apis }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b border-border">
          <th className="text-left p-3 text-muted-foreground font-medium w-32">Dimension</th>
          {apis.map((a) => (
            <th key={a.id} className="text-left p-3 text-foreground font-bold">
              {a.name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {[
          { label: 'Platform', key: (a: CryptoAPI) => a.platform },
          { label: 'Abstraction', key: (a: CryptoAPI) => a.abstractionLevel },
          { label: 'Key Storage', key: (a: CryptoAPI) => a.keyStorage },
          { label: 'Session Model', key: (a: CryptoAPI) => a.sessionModel },
          { label: 'PQC Status', key: (a: CryptoAPI) => a.pqcStatus },
          { label: 'Error Handling', key: (a: CryptoAPI) => a.errorHandling },
          { label: 'Languages', key: (a: CryptoAPI) => a.languages.join(', ') },
        ].map(({ label, key }) => (
          <tr key={label} className="border-b border-border hover:bg-muted/30 transition-colors">
            <td className="p-3 text-muted-foreground font-medium">{label}</td>
            {apis.map((a) => (
              <td key={a.id} className="p-3 text-foreground">
                {key(a)}
              </td>
            ))}
          </tr>
        ))}
        {RADAR_KEYS.map(({ key, label }) => (
          <tr key={key} className="border-b border-border hover:bg-muted/30 transition-colors">
            <td className="p-3 text-muted-foreground font-medium">{label}</td>
            {apis.map((a) => (
              <td key={a.id} className="p-3">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(a.radar[key] / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground">{a.radar[key]}/10</span>
                </div>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

export const APIArchitectureExplorer: React.FC = () => {
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('All')
  const [storageFilter, setStorageFilter] = useState<StorageFilter>('All')
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('All')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [compareMode, setCompareMode] = useState(false)

  const filtered = useMemo(() => {
    return CRYPTO_APIS.filter((api) => {
      if (platformFilter !== 'All' && api.platform !== platformFilter) return false
      if (storageFilter !== 'All' && api.keyStorage !== storageFilter) return false
      if (levelFilter !== 'All' && api.abstractionLevel !== levelFilter) return false
      return true
    })
  }, [platformFilter, storageFilter, levelFilter])

  const compareApis = useMemo(() => CRYPTO_APIS.filter((a) => selectedIds.has(a.id)), [selectedIds])

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < 3) {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <FilterDropdown
          label="Platform"
          items={PLATFORM_ITEMS}
          selectedId={platformFilter}
          onSelect={(id) => setPlatformFilter(id as PlatformFilter)}
        />
        <FilterDropdown
          label="Key Storage"
          items={STORAGE_ITEMS}
          selectedId={storageFilter}
          onSelect={(id) => setStorageFilter(id as StorageFilter)}
        />
        <FilterDropdown
          label="Abstraction"
          items={LEVEL_ITEMS}
          selectedId={levelFilter}
          onSelect={(id) => setLevelFilter(id as LevelFilter)}
        />
        <Button
          variant="ghost"
          onClick={() => {
            setCompareMode((v) => !v)
            if (compareMode) setSelectedIds(new Set())
          }}
          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
            compareMode
              ? 'border-primary text-primary bg-primary/10'
              : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
          }`}
        >
          {compareMode ? `Compare (${selectedIds.size}/3)` : 'Compare Mode'}
        </Button>
      </div>

      {/* Compare table */}
      {compareMode && compareApis.length >= 2 && (
        <div className="glass-panel p-4">
          <h3 className="font-bold text-foreground mb-4">Side-by-Side Comparison</h3>
          <CompareView apis={compareApis} />
        </div>
      )}
      {compareMode && compareApis.length < 2 && (
        <div className="glass-panel p-4 text-center text-muted-foreground text-sm">
          Select 2–3 APIs using the checkboxes on their cards to compare them side-by-side.
        </div>
      )}

      {/* Cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((api) => (
          <APICard
            key={api.id}
            api={api}
            isExpanded={expandedIds.has(api.id)}
            isSelected={selectedIds.has(api.id)}
            onToggleExpand={() => toggleExpand(api.id)}
            onToggleSelect={() => toggleSelect(api.id)}
            compareMode={compareMode}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="glass-panel p-8 text-center text-muted-foreground">
          No APIs match the current filters.
        </div>
      )}
    </div>
  )
}
